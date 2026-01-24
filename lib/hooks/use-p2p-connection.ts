'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Device, Transfer, FileInfo } from '@/lib/types';
import { downloadFile } from './use-file-transfer';
import {
    createVerificationSession,
    VerificationSession,
    markSessionVerified,
    markSessionFailed,
    markSessionSkipped,
    isPeerVerified,
    generateSAS
} from '@/lib/crypto/peer-authentication';
import { keyManager, SessionKeyPair } from '@/lib/crypto/key-management';
import { PrivateTransport, getPrivateTransport } from '@/lib/transport/private-webrtc';
import secureLog from '@/lib/utils/secure-logger';
import { generateUUID } from '@/lib/utils/uuid';
import { x25519 } from '@noble/curves/ed25519.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';


// Signaling Message Types
interface SignalMessage {
    type: 'offer' | 'answer' | 'candidate' | 'file-start' | 'file-chunk' | 'file-end' | 'ready';
    payload: any;
    senderId: string;
    receiverId?: string;
}

// File transfer progress
interface TransferProgress {
    fileId: string;
    fileName: string;
    totalSize: number;
    transferredSize: number;
    speed: number;
    progress: number;
}

// Received file
interface ReceivedFile {
    name: string;
    type: string;
    size: number;
    blob: Blob;
}

const CHUNK_SIZE = 16 * 1024; // 16KB chunks for reliability
const ICE_GATHERING_TIMEOUT = 10_000; // 10 seconds
const DH_PUBLIC_KEY_LENGTH = 32; // X25519 public key is always 32 bytes

// Private transport for relay-only connections (IP leak prevention)
const privateTransport = getPrivateTransport({
    forceRelay: true,
    logCandidates: process.env.NODE_ENV === 'development',
    onIpLeakDetected: (candidate) => {
        secureLog.warn('IP LEAK DETECTED:', candidate.candidate);
    },
});


export interface P2PConnectionState {
    isConnected: boolean;
    isConnecting: boolean;
    connectionCode: string;
    peerId: string | null;
    peerName: string | null;
    error: string | null;
    verificationPending: boolean;
    verificationSession: VerificationSession | null;
}

export function useP2PConnection() {
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
            code += chars[values[i] % chars.length];
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
                verificationSession: { ...prev.verificationSession!, status: 'verified' },
            }));
        }
    }, [state.verificationSession]);

    // Handle verification failed
    const failVerification = useCallback(() => {
        if (state.verificationSession) {
            markSessionFailed(state.verificationSession.id);
            setState(prev => ({
                ...prev,
                verificationPending: false,
                verificationSession: { ...prev.verificationSession!, status: 'failed' },
            }));
            // Optionally disconnect on failure
            // disconnect();
        }
    }, [state.verificationSession]);

    // Handle verification skipped
    const skipVerification = useCallback(() => {
        if (state.verificationSession) {
            markSessionSkipped(state.verificationSession.id);
            setState(prev => ({
                ...prev,
                verificationPending: false,
                verificationSession: { ...prev.verificationSession!, status: 'skipped' },
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
                setState(prev => ({ ...prev, isConnected: true, isConnecting: false }));
                // Log privacy stats
                const stats = privateTransport.getStats();
                secureLog.log('Transport stats:', stats);
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
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
    const handleControlMessage = useCallback((message: any) => {
        if (!message || typeof message.type !== 'string') return;

        switch (message.type) {
            case 'dh-pubkey':
                // Received peer's DH public key — compute shared secret
                try {
                    if (!dhPrivateKey.current) {
                        secureLog.error('DH private key not available');
                        break;
                    }

                    // Validate public key format
                    if (!Array.isArray(message.publicKey) || message.publicKey.length !== DH_PUBLIC_KEY_LENGTH) {
                        secureLog.error('Invalid DH public key: wrong length');
                        break;
                    }

                    const peerPublicKey = new Uint8Array(message.publicKey);

                    // Reject all-zero key (low-order point)
                    if (peerPublicKey.every(b => b === 0)) {
                        secureLog.error('Rejected zero DH public key');
                        break;
                    }

                    const rawSharedSecret = x25519.getSharedSecret(dhPrivateKey.current, peerPublicKey);

                    // Reject if shared secret is all zeros (low-order point attack)
                    if (rawSharedSecret.every(b => b === 0)) {
                        secureLog.error('DH key exchange produced zero shared secret (low-order point)');
                        break;
                    }

                    // Derive a proper shared secret via HKDF
                    const SAS_INFO = new TextEncoder().encode('tallow-sas-v1');
                    const salt = new TextEncoder().encode('tallow-dh-salt-v1');
                    const derivedSecret = hkdf(sha256, rawSharedSecret, salt, SAS_INFO, 32);
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
                // Validate required fields
                if (typeof message.size !== 'number' || message.size <= 0) {
                    secureLog.error('Invalid file-start: bad size');
                    break;
                }
                if (typeof message.fileId !== 'string' || message.fileId.length === 0) {
                    secureLog.error('Invalid file-start: missing fileId');
                    break;
                }

                // Sanitize filename (strip path separators, limit length)
                const fileName = typeof message.name === 'string'
                    ? message.name.replace(/[/\\<>:"|?*]/g, '_').slice(0, 255)
                    : 'unnamed';
                const mimeType = typeof message.mimeType === 'string'
                    ? message.mimeType.slice(0, 128)
                    : 'application/octet-stream';

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
        }
    }, [triggerVerification]);

    // Handle file chunk
    const handleFileChunk = useCallback((data: ArrayBuffer) => {
        if (!receivingFile.current) return;

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
        setCurrentTransfer(prev => prev ? {
            ...prev,
            transferredSize: receivingFile.current!.received,
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

            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Wait for ICE gathering with timeout
            await waitForIceGathering(pc);

            return pc.localDescription;
        } catch (error) {
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

        while (offset < file.size) {
            // Check channel is still open
            if (channel.readyState !== 'open') {
                throw new Error('Data channel closed during transfer');
            }

            // Wait if buffer is getting full (backpressure)
            while (channel.bufferedAmount > 1024 * 1024) {
                if (channel.readyState !== 'open') {
                    throw new Error('Data channel closed during transfer');
                }
                await new Promise(resolve => setTimeout(resolve, 50));
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
            await sendFile(files[i], (progress) => onProgress?.(i, progress));
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

    // Close connection
    const disconnect = useCallback(() => {
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

    return {
        state,
        currentTransfer,
        receivedFiles,
        initializeAsInitiator,
        acceptConnection,
        completeConnection,
        sendFile,
        sendFiles,
        downloadReceivedFile,
        onFileReceived,
        disconnect,
        // Verification handlers
        triggerVerification,
        confirmVerification,
        failVerification,
        skipVerification,
    };
}

export default useP2PConnection;
