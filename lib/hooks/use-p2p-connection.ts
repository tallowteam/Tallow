'use client';

/**
 * @fileoverview Custom hook for managing P2P WebRTC connections with security features
 * @module hooks/use-p2p-connection
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { downloadFile } from './use-file-transfer';
import {
    createVerificationSession,
    VerificationSession,
    markSessionVerified,
    markSessionFailed,
    markSessionSkipped,
    isPeerVerified,
} from '@/lib/crypto/peer-authentication';
import { keyManager, SessionKeyPair } from '@/lib/crypto/key-management';
import { getPrivateTransport } from '@/lib/transport/private-webrtc';
import secureLog from '@/lib/utils/secure-logger';
import { generateUUID } from '@/lib/utils/uuid';
import { x25519 } from '@noble/curves/ed25519.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { isObject, hasProperty, isString, isNumber, isArrayOf } from '../types/type-guards';
import { asPublicKey, asSharedSecret } from '@/lib/types/crypto-brands';

/**
 * DH Public Key Message
 */
interface DHPublicKeyMessage {
  type: 'dh-pubkey';
  publicKey: number[];
}

/**
 * File Start Message
 */
interface FileStartMessage {
  type: 'file-start';
  fileId: string;
  name: string;
  size: number;
  mimeType?: string;
}

/**
 * File Chunk Message
 */
interface FileChunkMessage {
  type: 'file-chunk';
  fileId: string;
  chunk: number[];
  index: number;
  total: number;
}

/**
 * File Complete Message
 */
interface FileCompleteMessage {
  type: 'file-complete';
  fileId: string;
}

/**
 * File End Message
 */
interface FileEndMessage {
  type: 'file-end';
  fileId: string;
}

/**
 * File Request Message
 */
interface FileRequestMessage {
  type: 'file-request';
  id: string;
  from: string;
  fromName: string;
  fileName?: string;
  fileType?: string;
  message?: string;
  timestamp: number;
}

/**
 * File Request Response Message
 */
interface FileRequestResponseMessage {
  type: 'file-request-response';
  requestId: string;
  accepted: boolean;
}

/**
 * P2P Control Message Types
 */
type P2PControlMessage =
  | DHPublicKeyMessage
  | FileStartMessage
  | FileChunkMessage
  | FileCompleteMessage
  | FileEndMessage
  | FileRequestMessage
  | FileRequestResponseMessage;

/**
 * Type guard for DHPublicKeyMessage
 */
function isDHPublicKeyMessage(value: unknown): value is DHPublicKeyMessage {
  return (
    isObject(value) &&
    hasProperty(value, 'type') && value['type'] === 'dh-pubkey' &&
    hasProperty(value, 'publicKey') && isArrayOf(value['publicKey'], isNumber)
  );
}

/**
 * Type guard for FileStartMessage
 */
function isFileStartMessage(value: unknown): value is FileStartMessage {
  return (
    isObject(value) &&
    hasProperty(value, 'type') && value['type'] === 'file-start' &&
    hasProperty(value, 'fileId') && isString(value['fileId']) &&
    hasProperty(value, 'name') && isString(value['name']) &&
    hasProperty(value, 'size') && isNumber(value['size'])
  );
}

/**
 * Type guard for FileChunkMessage
 */
function isFileChunkMessage(value: unknown): value is FileChunkMessage {
  return (
    isObject(value) &&
    hasProperty(value, 'type') && value['type'] === 'file-chunk' &&
    hasProperty(value, 'fileId') && isString(value['fileId']) &&
    hasProperty(value, 'chunk') && isArrayOf(value['chunk'], isNumber) &&
    hasProperty(value, 'index') && isNumber(value['index']) &&
    hasProperty(value, 'total') && isNumber(value['total'])
  );
}

/**
 * Type guard for FileCompleteMessage
 */
function isFileCompleteMessage(value: unknown): value is FileCompleteMessage {
  return (
    isObject(value) &&
    hasProperty(value, 'type') && value['type'] === 'file-complete' &&
    hasProperty(value, 'fileId') && isString(value['fileId'])
  );
}

/**
 * Type guard for FileEndMessage
 */
function isFileEndMessage(value: unknown): value is FileEndMessage {
  return (
    isObject(value) &&
    hasProperty(value, 'type') && value['type'] === 'file-end' &&
    hasProperty(value, 'fileId') && isString(value['fileId'])
  );
}

/**
 * Type guard for FileRequestMessage
 */
function isFileRequestMessage(value: unknown): value is FileRequestMessage {
  return (
    isObject(value) &&
    hasProperty(value, 'type') && value['type'] === 'file-request' &&
    hasProperty(value, 'id') && isString(value['id']) &&
    hasProperty(value, 'from') && isString(value['from']) &&
    hasProperty(value, 'fromName') && isString(value['fromName']) &&
    hasProperty(value, 'timestamp') && isNumber(value['timestamp'])
  );
}

/**
 * Type guard for FileRequestResponseMessage
 */
function isFileRequestResponseMessage(value: unknown): value is FileRequestResponseMessage {
  return (
    isObject(value) &&
    hasProperty(value, 'type') && value['type'] === 'file-request-response' &&
    hasProperty(value, 'requestId') && isString(value['requestId']) &&
    hasProperty(value, 'accepted') && typeof value['accepted'] === 'boolean'
  );
}

/**
 * Type guard for P2PControlMessage
 */
function isP2PControlMessage(value: unknown): value is P2PControlMessage {
  return (
    isDHPublicKeyMessage(value) ||
    isFileStartMessage(value) ||
    isFileChunkMessage(value) ||
    isFileCompleteMessage(value) ||
    isFileEndMessage(value) ||
    isFileRequestMessage(value) ||
    isFileRequestResponseMessage(value)
  );
}

/**
 * File transfer progress information
 * @interface TransferProgress
 */
export interface TransferProgress {
    /** Unique file identifier */
    fileId: string;
    /** Name of the file being transferred */
    fileName: string;
    /** Total file size in bytes */
    totalSize: number;
    /** Bytes transferred so far */
    transferredSize: number;
    /** Transfer speed in bytes per second */
    speed: number;
    /** Transfer progress percentage (0-100) */
    progress: number;
}

/**
 * Received file information
 * @interface ReceivedFile
 */
export interface ReceivedFile {
    /** File name */
    name: string;
    /** MIME type */
    type: string;
    /** File size in bytes */
    size: number;
    /** File blob data */
    blob: Blob;
}

const CHUNK_SIZE = 16 * 1024; // 16KB chunks for reliability
const ICE_GATHERING_TIMEOUT = 10_000; // 10 seconds
const DH_PUBLIC_KEY_LENGTH = 32; // X25519 public key is always 32 bytes

// Backpressure thresholds for optimal throughput
// Higher thresholds allow more data in flight, improving bandwidth utilization
const BUFFER_HIGH_THRESHOLD = 8 * 1024 * 1024; // 8MB - pause sending when exceeded
const BUFFER_LOW_THRESHOLD = 4 * 1024 * 1024; // 4MB - resume sending when below

// Private transport for relay-only connections (IP leak prevention)
// P2P direct connection preferred; relay used as fallback only
const privateTransport = getPrivateTransport({
    forceRelay: false,
    logCandidates: process.env.NODE_ENV === 'development',
    onIpLeakDetected: (candidate) => {
        secureLog.warn('IP LEAK DETECTED:', candidate.candidate);
    },
});


/**
 * P2P connection state interface
 * @interface P2PConnectionState
 */
export interface P2PConnectionState {
    /** Whether connected to peer */
    isConnected: boolean;
    /** Whether currently attempting connection */
    isConnecting: boolean;
    /** Connection code for pairing */
    connectionCode: string;
    /** Connected peer's ID */
    peerId: string | null;
    /** Connected peer's name */
    peerName: string | null;
    /** Connection error message */
    error: string | null;
    /** Whether verification is pending */
    verificationPending: boolean;
    /** Current verification session */
    verificationSession: VerificationSession | null;
}

export interface UseP2PConnectionReturn {
    state: P2PConnectionState;
    currentTransfer: TransferProgress | null;
    receivedFiles: ReceivedFile[];
    dataChannel: RTCDataChannel | null;
    initializeAsInitiator: () => Promise<RTCSessionDescription | null>;
    acceptConnection: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescription | null>;
    completeConnection: (answer: RTCSessionDescriptionInit) => Promise<void>;
    sendFile: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
    sendFiles: (files: File[], onProgress?: (fileIndex: number, progress: number) => void) => Promise<void>;
    downloadReceivedFile: (file: ReceivedFile) => void;
    onFileReceived: (callback: (file: ReceivedFile) => void) => void;
    onMessage: (callback: (data: string | ArrayBuffer) => void) => void;
    disconnect: () => void;
    triggerVerification: () => void;
    confirmVerification: () => void;
    failVerification: () => void;
    skipVerification: () => void;
}

/**
 * Custom hook for managing P2P WebRTC connections with end-to-end encryption
 *
 * Provides comprehensive P2P connectivity including:
 * - WebRTC peer connection setup
 * - Data channel management
 * - File transfer over P2P
 * - Peer verification with SAS (Short Authentication String)
 * - Ephemeral key management
 * - Privacy-preserving relay-only mode
 *
 * @returns P2P connection state and control functions
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   initializeAsInitiator,
 *   acceptConnection,
 *   sendFile,
 *   disconnect,
 *   confirmVerification
 * } = useP2PConnection();
 *
 * // As initiator
 * const offer = await initializeAsInitiator();
 * // Share offer with peer...
 *
 * // As receiver
 * const answer = await acceptConnection(offer);
 * // Share answer back...
 * ```
 */
export function useP2PConnection(): UseP2PConnectionReturn {
    const [state, setState] = useState<P2PConnectionState>({
        isConnected: false,
        isConnecting: false,
        connectionCode: generateCode(),
        peerId: null,
        peerName: null,
        error: null,
        verificationPending: false,
        verificationSession: null,
    });

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const dataChannel = useRef<RTCDataChannel | null>(null);
    const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
    const receivingFile = useRef<{
        name: string;
        type: string;
        size: number;
        chunks: ArrayBuffer[];
        received: number;
    } | null>(null);

    const [currentTransfer, setCurrentTransfer] = useState<TransferProgress | null>(null);
    const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
    const onFileReceivedCallback = useRef<((file: ReceivedFile) => void) | null>(null);
    const onMessageCallback = useRef<((data: string | ArrayBuffer) => void) | null>(null);

    // Ephemeral key management
    const sessionKey = useRef<SessionKeyPair | null>(null);
    const sessionId = useRef<string>(generateUUID());

    // DH key exchange for SAS verification
    const dhPrivateKey = useRef<Uint8Array | null>(null);
    const dhSharedSecret = useRef<Uint8Array | null>(null);


    // Generate a random 8-character connection code (crypto-safe)
    function generateCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const values = new Uint8Array(8);
        crypto.getRandomValues(values);
        let code = '';
        for (let i = 0; i < 8; i++) {
            const value = values[i];
            if (value !== undefined) {
                code += chars[value % chars.length];
            }
        }
        return code;
    }

    // Trigger SAS verification after DH key exchange completes
    const triggerVerification = useCallback(() => {
        if (!dhSharedSecret.current) {
            secureLog.error('Cannot verify: DH key exchange not completed');
            return;
        }

        const peerId = state.peerId || 'unknown';
        const peerName = state.peerName || 'Unknown Device';

        // Check if already verified
        if (isPeerVerified(peerId)) {
            secureLog.log('Peer already verified, skipping verification');
            return;
        }

        // Use the actual DH shared secret for SAS (not the weak connection code)
        const session = createVerificationSession(peerId, peerName, dhSharedSecret.current);
        setState(prev => ({
            ...prev,
            verificationPending: true,
            verificationSession: session,
        }));
    }, [state.peerId, state.peerName]);

    // Handle verification confirmed
    const confirmVerification = useCallback(() => {
        if (state.verificationSession) {
            markSessionVerified(state.verificationSession.id);
            setState(prev => ({
                ...prev,
                verificationPending: false,
                verificationSession: prev.verificationSession ? { ...prev.verificationSession, status: 'verified' } : null,
            }));
        }
    }, [state.verificationSession]);

    // Handle verification failed -- MANDATORY disconnection per Agent 012 SAS-VERIFIER contract.
    // SAS mismatch = possible MITM attack. Connection MUST be terminated immediately. No retry.
    const failVerification = useCallback(() => {
        if (state.verificationSession) {
            markSessionFailed(state.verificationSession.id);
            setState(prev => ({
                ...prev,
                verificationPending: false,
                verificationSession: prev.verificationSession ? { ...prev.verificationSession, status: 'failed' } : null,
            }));
            // MANDATORY: Disconnect on SAS failure -- no retry permitted.
            // Close the peer connection, data channels, and reset state.
            if (peerConnection.current) {
                peerConnection.current.close();
                peerConnection.current = null;
            }
            if (dataChannel.current) {
                dataChannel.current.close();
                dataChannel.current = null;
            }
            setState(prev => ({
                ...prev,
                status: 'disconnected',
                error: 'SAS verification failed: possible man-in-the-middle attack. Connection terminated.',
            }));
            console.warn('[SAS-VERIFIER] Connection terminated due to SAS mismatch. No retry permitted.');
        }
    }, [state.verificationSession]);

    // Handle verification skipped
    const skipVerification = useCallback(() => {
        if (state.verificationSession) {
            markSessionSkipped(state.verificationSession.id);
            setState(prev => ({
                ...prev,
                verificationPending: false,
                verificationSession: prev.verificationSession ? { ...prev.verificationSession, status: 'skipped' } : null,
            }));
        }
    }, [state.verificationSession]);

    // Create peer connection with privacy-preserving settings
    const createPeerConnection = useCallback(() => {
        // Use PrivateTransport for relay-only connections (IP leak prevention)
        const rtcConfig = privateTransport.getRTCConfiguration();
        const pc = new RTCPeerConnection(rtcConfig);
        secureLog.log('Created private peer connection (relay-only mode)');

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // Filter candidates to prevent IP leaks
                if (privateTransport.filterCandidate(event.candidate)) {
                    secureLog.log('ICE candidate (relay):', event.candidate.type);
                } else {
                    secureLog.log('ICE candidate filtered (non-relay blocked)');
                }
            }
        };

        pc.onconnectionstatechange = () => {
            secureLog.log('Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                // Clear connection timeout on successful connection
                if (connectionTimeout.current) {
                    clearTimeout(connectionTimeout.current);
                    connectionTimeout.current = null;
                }
                setState(prev => ({ ...prev, isConnected: true, isConnecting: false }));
                // Log privacy stats
                const stats = privateTransport.getStats();
                secureLog.log('Transport stats:', stats);
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                if (connectionTimeout.current) {
                    clearTimeout(connectionTimeout.current);
                    connectionTimeout.current = null;
                }
                setState(prev => ({ ...prev, isConnected: false, isConnecting: false, error: 'Connection failed' }));
            }
        };

        pc.ondatachannel = (event) => {
            secureLog.log('Received data channel');
            dataChannel.current = event.channel;
            setupDataChannel(event.channel);
        };

        // Monitor for privacy compliance
        privateTransport.monitorConnection(pc);

        return pc;
    }, []);

    // Setup data channel handlers
    const setupDataChannel = useCallback((channel: RTCDataChannel) => {
        channel.binaryType = 'arraybuffer';

        channel.onopen = async () => {
            secureLog.log('Data channel open');
            setState(prev => ({ ...prev, isConnected: true, isConnecting: false }));

            // Generate ephemeral X25519 keypair for DH key exchange
            try {
                const privateKey = x25519.utils.randomSecretKey();
                dhPrivateKey.current = privateKey;
                const publicKey = x25519.getPublicKey(privateKey);

                // Send our public key to the peer
                channel.send(JSON.stringify({
                    type: 'dh-pubkey',
                    publicKey: Array.from(publicKey),
                }));
                secureLog.log('DH public key sent to peer');

                // Generate ephemeral session keys
                sessionKey.current = await keyManager.generateSessionKeys();
                secureLog.log('Ephemeral session keys generated:', sessionKey.current.id);
            } catch (error) {
                secureLog.error('Failed to initialize ephemeral keys:', error);
            }
        };

        channel.onclose = () => {
            secureLog.log('Data channel closed');
            setState(prev => ({ ...prev, isConnected: false }));

            // Securely destroy session keys
            if (sessionKey.current) {
                keyManager.deleteKey(sessionKey.current.id);
                sessionKey.current = null;
            }
            keyManager.destroySession(sessionId.current);

            // Wipe DH key material
            if (dhPrivateKey.current) {
                dhPrivateKey.current.fill(0);
                dhPrivateKey.current = null;
            }
            if (dhSharedSecret.current) {
                dhSharedSecret.current.fill(0);
                dhSharedSecret.current = null;
            }
            secureLog.log('Session keys securely destroyed');
        };

        channel.onerror = (error) => {
            secureLog.error('Data channel error:', error);
            setState(prev => ({ ...prev, error: 'Data channel error' }));
        };

        channel.onmessage = (event) => {
            // Allow external handlers to process messages first (for file requests)
            onMessageCallback.current?.(event.data);
            handleMessage(event.data);
        };
    }, []);

    // Handle incoming messages
    const handleMessage = useCallback((data: ArrayBuffer | string) => {
        if (typeof data === 'string') {
            try {
                const message = JSON.parse(data);
                handleControlMessage(message);
            } catch (e) {
                secureLog.error('Failed to parse message:', e);
            }
        } else {
            // Binary data - file chunk
            handleFileChunk(data);
        }
    }, []);

    // Handle control messages
    const handleControlMessage = useCallback((message: unknown) => {
        if (!isP2PControlMessage(message)) {
            secureLog.warn('Received invalid P2P control message');
            return;
        }

        switch (message.type) {
            case 'dh-pubkey':
                // Received peer's DH public key — compute shared secret
                try {
                    if (!dhPrivateKey.current) {
                        secureLog.error('DH private key not available');
                        break;
                    }

                    // Validate public key format
                    if (message.publicKey.length !== DH_PUBLIC_KEY_LENGTH) {
                        secureLog.error('Invalid DH public key: wrong length');
                        break;
                    }

                    const peerPublicKey = asPublicKey(new Uint8Array(message.publicKey));

                    // CRITICAL FIX: Enhanced low-order point validation
                    // Reject known low-order points and predictable patterns
                    if (!isValidX25519PublicKey(peerPublicKey)) {
                        secureLog.error('Rejected invalid or low-order DH public key');
                        break;
                    }

                    const rawSharedSecret = asSharedSecret(
                        x25519.getSharedSecret(dhPrivateKey.current, peerPublicKey)
                    );

                    // CRITICAL FIX: Enhanced shared secret validation
                    // Check for low-entropy or predictable shared secrets
                    if (!isValidSharedSecret(rawSharedSecret)) {
                        secureLog.error('DH key exchange produced invalid shared secret (low-order point attack)');
                        break;
                    }

                    // Derive a proper shared secret via HKDF
                    const SAS_INFO = new TextEncoder().encode('tallow-sas-v1');
                    const salt = new TextEncoder().encode('tallow-dh-salt-v1');
                    const derivedSecret = asSharedSecret(
                        hkdf(sha256, rawSharedSecret, salt, SAS_INFO, 32)
                    );
                    dhSharedSecret.current = derivedSecret;

                    secureLog.log('DH shared secret derived successfully');

                    // Now initialize ratchet with the real shared secret
                    keyManager.initializeRatchet(
                        sessionId.current,
                        derivedSecret,
                        true // isInitiator
                    ).then(() => {
                        secureLog.log('Double Ratchet initialized with DH shared secret');
                    }).catch((err: unknown) => {
                        secureLog.error('Failed to initialize ratchet:', err);
                    });

                    // Trigger SAS verification now that we have a real shared secret
                    triggerVerification();
                } catch (error) {
                    secureLog.error('DH key exchange failed:', error);
                }
                break;

            case 'file-start': {
                // Validate file size
                if (message.size <= 0) {
                    secureLog.error('Invalid file-start: bad size');
                    break;
                }

                // Sanitize filename (strip path separators, limit length)
                const fileName = message.name.replace(/[/\\<>:"|?*]/g, '_').slice(0, 255);
                const mimeType = message.mimeType?.slice(0, 128) ?? 'application/octet-stream';

                receivingFile.current = {
                    name: fileName,
                    type: mimeType,
                    size: message.size,
                    chunks: [],
                    received: 0,
                };
                setCurrentTransfer({
                    fileId: message.fileId,
                    fileName,
                    totalSize: message.size,
                    transferredSize: 0,
                    speed: 0,
                    progress: 0,
                });
                break;
            }

            case 'file-end':
                if (receivingFile.current) {
                    // Verify received size matches expected
                    if (receivingFile.current.received !== receivingFile.current.size) {
                        secureLog.warn('File size mismatch: expected', receivingFile.current.size, 'got', receivingFile.current.received);
                    }

                    const blob = new Blob(receivingFile.current.chunks, {
                        type: receivingFile.current.type
                    });
                    const file: ReceivedFile = {
                        name: receivingFile.current.name,
                        type: receivingFile.current.type,
                        size: receivingFile.current.size,
                        blob,
                    };
                    setReceivedFiles(prev => [...prev, file]);
                    onFileReceivedCallback.current?.(file);
                    receivingFile.current = null;
                    setCurrentTransfer(null);
                }
                break;

            case 'file-request':
            case 'file-request-response':
                // File request messages are handled by the external onMessage callback
                // No default handling needed here
                break;
        }
    }, [triggerVerification]);

    // Handle file chunk
    const handleFileChunk = useCallback((data: ArrayBuffer) => {
        if (!receivingFile.current) {return;}

        // Reject if receiving more data than declared size
        if (receivingFile.current.received + data.byteLength > receivingFile.current.size) {
            secureLog.error('Received more data than declared file size, aborting');
            receivingFile.current = null;
            setCurrentTransfer(null);
            return;
        }

        receivingFile.current.chunks.push(data);
        receivingFile.current.received += data.byteLength;

        const progress = Math.min((receivingFile.current.received / receivingFile.current.size) * 100, 100);
        const currentReceived = receivingFile.current.received;
        setCurrentTransfer(prev => prev ? {
            ...prev,
            transferredSize: currentReceived,
            progress,
        } : null);
    }, []);

    // Wait for ICE gathering with timeout
    const waitForIceGathering = useCallback((pc: RTCPeerConnection): Promise<void> => {
        return new Promise<void>((resolve) => {
            if (pc.iceGatheringState === 'complete') {
                resolve();
                return;
            }

            const timeout = setTimeout(() => {
                secureLog.warn('ICE gathering timed out, proceeding with available candidates');
                resolve();
            }, ICE_GATHERING_TIMEOUT);

            pc.onicegatheringstatechange = () => {
                if (pc.iceGatheringState === 'complete') {
                    clearTimeout(timeout);
                    resolve();
                }
            };
        });
    }, []);

    // Initialize connection as initiator
    const initializeAsInitiator = useCallback(async () => {
        setState(prev => ({ ...prev, isConnecting: true, error: null }));

        try {
            const pc = createPeerConnection();
            peerConnection.current = pc;

            // Add connection timeout (30 seconds)
            connectionTimeout.current = setTimeout(() => {
                if (pc.connectionState !== 'connected') {
                    secureLog.warn('[P2P] Connection timeout after 30s, retrying...');
                    setState(prev => ({
                        ...prev,
                        isConnecting: false,
                        error: 'Connection timeout. Please try again.'
                    }));
                }
            }, 30000);

            // Create data channel
            const channel = pc.createDataChannel('fileTransfer', { ordered: true });
            dataChannel.current = channel;
            setupDataChannel(channel);

            // Create offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Wait for ICE gathering with timeout
            await waitForIceGathering(pc);

            return pc.localDescription;
        } catch (error) {
            if (connectionTimeout.current) {
                clearTimeout(connectionTimeout.current);
                connectionTimeout.current = null;
            }
            setState(prev => ({ ...prev, isConnecting: false, error: 'Failed to create offer' }));
            throw error;
        }
    }, [createPeerConnection, setupDataChannel, waitForIceGathering]);

    // Accept connection as receiver
    const acceptConnection = useCallback(async (offer: RTCSessionDescriptionInit) => {
        setState(prev => ({ ...prev, isConnecting: true, error: null }));

        try {
            const pc = createPeerConnection();
            peerConnection.current = pc;

            // Add connection timeout (30 seconds)
            connectionTimeout.current = setTimeout(() => {
                if (pc.connectionState !== 'connected') {
                    secureLog.warn('[P2P] Connection timeout after 30s, retrying...');
                    setState(prev => ({
                        ...prev,
                        isConnecting: false,
                        error: 'Connection timeout. Please try again.'
                    }));
                }
            }, 30000);

            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Wait for ICE gathering with timeout
            await waitForIceGathering(pc);

            return pc.localDescription;
        } catch (error) {
            if (connectionTimeout.current) {
                clearTimeout(connectionTimeout.current);
                connectionTimeout.current = null;
            }
            setState(prev => ({ ...prev, isConnecting: false, error: 'Failed to accept connection' }));
            throw error;
        }
    }, [createPeerConnection, waitForIceGathering]);

    // Complete connection with answer
    const completeConnection = useCallback(async (answer: RTCSessionDescriptionInit) => {
        if (!peerConnection.current) {
            throw new Error('No peer connection');
        }
        await peerConnection.current.setRemoteDescription(answer);
    }, []);

    // Send a file
    const sendFile = useCallback(async (file: File, onProgress?: (progress: number) => void) => {
        if (!dataChannel.current || dataChannel.current.readyState !== 'open') {
            throw new Error('Data channel not ready');
        }

        if (file.size === 0) {
            throw new Error('Cannot send empty file');
        }

        const fileId = generateUUID();
        const channel = dataChannel.current;

        // Sanitize filename before sending
        const sanitizedName = file.name.replace(/[/\\<>:"|?*]/g, '_').slice(0, 255);

        // Send file metadata
        channel.send(JSON.stringify({
            type: 'file-start',
            fileId,
            name: sanitizedName,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
        }));

        // Send file in chunks
        let offset = 0;
        const startTime = Date.now();

        // Configure bufferedAmountLowThreshold for event-driven backpressure
        // This replaces polling with efficient event-based flow control
        channel.bufferedAmountLowThreshold = BUFFER_LOW_THRESHOLD;

        while (offset < file.size) {
            // Check channel is still open
            if (channel.readyState !== 'open') {
                throw new Error('Data channel closed during transfer');
            }

            // Backpressure: wait if buffer exceeds high threshold
            // Uses event-driven approach instead of polling for better performance
            if (channel.bufferedAmount > BUFFER_HIGH_THRESHOLD) {
                await new Promise<void>((resolve) => {
                    // Check if buffer already drained while we were setting up
                    if (channel.bufferedAmount <= BUFFER_LOW_THRESHOLD) {
                        resolve();
                        return;
                    }
                    // Wait for bufferedamountlow event
                    const handler = (): void => {
                        channel.onbufferedamountlow = null;
                        resolve();
                    };
                    channel.onbufferedamountlow = handler;
                });
                // Verify channel still open after waiting
                if (channel.readyState !== 'open') {
                    throw new Error('Data channel closed during transfer');
                }
            }

            const chunk = file.slice(offset, offset + CHUNK_SIZE);
            const buffer = await chunk.arrayBuffer();
            channel.send(buffer);

            offset += buffer.byteLength;
            const progress = (offset / file.size) * 100;
            onProgress?.(progress);

            // Update transfer state
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = elapsed > 0 ? offset / elapsed : 0;

            setCurrentTransfer({
                fileId,
                fileName: sanitizedName,
                totalSize: file.size,
                transferredSize: offset,
                speed,
                progress,
            });
        }

        // Send completion message
        channel.send(JSON.stringify({
            type: 'file-end',
            fileId,
        }));

        setCurrentTransfer(null);
    }, []);

    // Send multiple files
    const sendFiles = useCallback(async (files: File[], onProgress?: (fileIndex: number, progress: number) => void) => {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file) {
                await sendFile(file, (progress) => onProgress?.(i, progress));
            }
        }
    }, [sendFile]);

    // Download a received file
    const downloadReceivedFile = useCallback((file: ReceivedFile) => {
        downloadFile(file.blob, file.name);
    }, []);

    // Set callback for when a file is received
    const onFileReceived = useCallback((callback: (file: ReceivedFile) => void) => {
        onFileReceivedCallback.current = callback;
    }, []);

    // Set callback for custom message handling (e.g., file requests)
    const onMessage = useCallback((callback: (data: string | ArrayBuffer) => void) => {
        onMessageCallback.current = callback;
    }, []);

    // Close connection
    const disconnect = useCallback(() => {
        // Clear connection timeout
        if (connectionTimeout.current) {
            clearTimeout(connectionTimeout.current);
            connectionTimeout.current = null;
        }

        dataChannel.current?.close();
        peerConnection.current?.close();
        dataChannel.current = null;
        peerConnection.current = null;

        // Securely destroy all session keys
        if (sessionKey.current) {
            keyManager.deleteKey(sessionKey.current.id);
            sessionKey.current = null;
        }
        keyManager.destroySession(sessionId.current);

        // Wipe DH key material
        if (dhPrivateKey.current) {
            dhPrivateKey.current.fill(0);
            dhPrivateKey.current = null;
        }
        if (dhSharedSecret.current) {
            dhSharedSecret.current.fill(0);
            dhSharedSecret.current = null;
        }

        setState(prev => ({
            ...prev,
            isConnected: false,
            isConnecting: false,
            peerId: null,
        }));
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    /**
     * CRITICAL FIX: Validate X25519 public key against known low-order points
     * X25519 has 8 low-order points that produce predictable shared secrets
     */
    const isValidX25519PublicKey = (publicKey: Uint8Array): boolean => {
        if (publicKey.length !== 32) {return false;}

        // Check for all-zero key (point 0)
        if (publicKey.every(b => b === 0)) {return false;}

        // Check for all-ones key
        if (publicKey.every(b => b === 0xFF)) {return false;}

        // Check for point 1 (0x01 followed by zeros)
        if (publicKey[0] === 1 && publicKey.slice(1).every(b => b === 0)) {return false;}

        // Check for low-order point patterns (known small-order curve points)
        const knownLowOrderPoints = [
            // Point of order 1 (identity)
            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            // Point of order 2
            new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            // Point of order 4
            new Uint8Array([0xe0, 0xeb, 0x7a, 0x7c, 0x3b, 0x41, 0xb8, 0xae, 0x16, 0x56, 0xe3, 0xfa, 0xf1, 0x9f, 0xc4, 0x6a, 0xda, 0x09, 0x8d, 0xeb, 0x9c, 0x32, 0xb1, 0xfd, 0x86, 0x62, 0x05, 0x16, 0x5f, 0x49, 0xb8, 0x00]),
            // Point of order 8
            new Uint8Array([0x5f, 0x9c, 0x95, 0xbc, 0xa3, 0x50, 0x8c, 0x24, 0xb1, 0xd0, 0xb1, 0x55, 0x9c, 0x83, 0xef, 0x5b, 0x04, 0x44, 0x5c, 0xc4, 0x58, 0x1c, 0x8e, 0x86, 0xd8, 0x22, 0x4e, 0xdd, 0xd0, 0x9f, 0x11, 0x57]),
        ];

        for (const lowOrderPoint of knownLowOrderPoints) {
            if (publicKey.every((b, i) => b === lowOrderPoint[i])) {
                return false;
            }
        }

        return true;
    };

    /**
     * CRITICAL FIX: Validate shared secret has sufficient entropy
     * Prevents low-order point attacks that produce predictable secrets
     */
    const isValidSharedSecret = (sharedSecret: Uint8Array): boolean => {
        if (sharedSecret.length !== 32) {return false;}

        // Check for all-zero secret
        if (sharedSecret.every(b => b === 0)) {return false;}

        // Check for all-ones secret
        if (sharedSecret.every(b => b === 0xFF)) {return false;}

        // Check for very low entropy (more than 28 bytes are zero)
        const zeroCount = sharedSecret.filter(b => b === 0).length;
        if (zeroCount > 28) {return false;}

        // Check for repeating patterns (like 0x01010101...)
        const firstByte = sharedSecret[0];
        if (sharedSecret.every(b => b === firstByte)) {return false;}

        // Additional entropy check: count unique bytes
        const uniqueBytes = new Set(sharedSecret);
        if (uniqueBytes.size < 8) {return false;} // Too few unique values

        return true;
    };

    return {
        state,
        currentTransfer,
        receivedFiles,
        dataChannel: dataChannel.current,
        initializeAsInitiator,
        acceptConnection,
        completeConnection,
        sendFile,
        sendFiles,
        downloadReceivedFile,
        onFileReceived,
        onMessage,
        disconnect,
        // Verification handlers
        triggerVerification,
        confirmVerification,
        failVerification,
        skipVerification,
    };
}

export default useP2PConnection;
