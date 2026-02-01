'use client';

/**
 * P2P Internet Transfer Module
 * Handles WebRTC peer connections for file transfers across the internet
 */

import { EventEmitter } from 'events';
import { Device } from '../types';
import { generateUUID } from '../utils/uuid';
import secureLog from '../utils/secure-logger';
import type {
  FileMeta,
  InternalMessage,
} from '../types/messaging-types';
import { isInternalMessage } from '../types/messaging-types';
import { captureException, addBreadcrumb } from '../monitoring/sentry';

// Connection states
export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'failed' | 'closed';

// Re-export types for backward compatibility
export type { SignalMessage, FileMeta } from '../types/messaging-types';

// Constants
const CHUNK_SIZE = 64 * 1024; // 64KB chunks for WebRTC
const MAX_FILE_SIZE = Number.MAX_SAFE_INTEGER; // No size limit - unlimited
const MAX_FILENAME_LENGTH = 255;

// Backpressure thresholds for optimal throughput
// Higher thresholds allow more data in flight, improving bandwidth utilization
const BUFFER_HIGH_THRESHOLD = 8 * 1024 * 1024; // 8MB - pause sending when exceeded
const BUFFER_LOW_THRESHOLD = 4 * 1024 * 1024; // 4MB - resume sending when below

// TURN server configuration from environment
const TURN_SERVER = process.env['NEXT_PUBLIC_TURN_SERVER'] || '';
const TURN_USERNAME = process.env['NEXT_PUBLIC_TURN_USERNAME'] || '';
const TURN_CREDENTIAL = process.env['NEXT_PUBLIC_TURN_CREDENTIAL'] || '';

/**
 * Get ICE servers with STUN/TURN configuration
 * Uses multiple STUN servers for redundancy and optimal NAT traversal
 */
function getIceServers(): RTCIceServer[] {
    const servers: RTCIceServer[] = [
        // Multiple Google STUN servers for redundancy
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        // Additional STUN servers from other providers
        { urls: 'stun:stun.services.mozilla.com:3478' },
        { urls: 'stun:stun.stunprotocol.org:3478' },
    ];

    // Add TURN server if configured (required for NAT traversal)
    if (TURN_SERVER && TURN_USERNAME && TURN_CREDENTIAL) {
        servers.unshift({
            urls: TURN_SERVER,
            username: TURN_USERNAME,
            credential: TURN_CREDENTIAL,
        });
    }

    return servers;
}

/**
 * Generate a random 8-character connection code (crypto-safe)
 */
export function generateConnectionCode(): string {
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

/**
 * P2P Connection class
 * Manages a WebRTC peer connection for file transfers
 */
export class P2PConnection extends EventEmitter {
    private peer: RTCPeerConnection | null = null;
    private dataChannel: RTCDataChannel | null = null;
    private state: ConnectionState = 'idle';
    private pendingCandidates: RTCIceCandidate[] = [];
    private receivingFile: {
        meta: FileMeta;
        chunks: ArrayBuffer[];
        received: number;
    } | null = null;

    constructor(_localDevice: Device) {
        super();
    }

    get connectionState(): ConnectionState {
        return this.state;
    }

    get isConnected(): boolean {
        return this.state === 'connected';
    }

    /**
     * Initialize as the connection initiator (sender)
     */
    async createOffer(): Promise<RTCSessionDescriptionInit> {
        addBreadcrumb('Creating P2P connection offer', 'p2p-internet');

        this.peer = this.createPeerConnection();

        // Create data channel
        this.dataChannel = this.peer.createDataChannel('fileTransfer', {
            ordered: true,
        });
        this.setupDataChannel(this.dataChannel);

        // Create offer
        const offer = await this.peer.createOffer();
        await this.peer.setLocalDescription(offer);

        this.state = 'connecting';
        this.emit('stateChange', this.state);

        return offer;
    }

    /**
     * Accept an incoming connection (receiver)
     */
    async acceptOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
        this.peer = this.createPeerConnection();

        // Handle incoming data channel
        this.peer.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.setupDataChannel(this.dataChannel);
        };

        await this.peer.setRemoteDescription(offer);
        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(answer);

        // Apply pending candidates
        for (const candidate of this.pendingCandidates) {
            await this.peer.addIceCandidate(candidate);
        }
        this.pendingCandidates = [];

        this.state = 'connecting';
        this.emit('stateChange', this.state);

        return answer;
    }

    /**
     * Complete the connection handshake (initiator only)
     */
    async acceptAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peer) {throw new Error('No peer connection');}
        await this.peer.setRemoteDescription(answer);

        // Apply pending candidates
        for (const candidate of this.pendingCandidates) {
            await this.peer.addIceCandidate(candidate);
        }
        this.pendingCandidates = [];
    }

    /**
     * Add ICE candidate
     */
    async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        const iceCandidate = new RTCIceCandidate(candidate);
        if (this.peer?.remoteDescription) {
            await this.peer.addIceCandidate(iceCandidate);
        } else {
            this.pendingCandidates.push(iceCandidate);
        }
    }

    /**
     * Send a file
     */
    async sendFile(file: File): Promise<void> {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            throw new Error('Data channel not ready');
        }

        if (file.size === 0) {
            throw new Error('Cannot send empty file');
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new Error('File too large (max 4GB)');
        }

        const meta: FileMeta = {
            id: generateUUID(),
            name: file.name.replace(/[/\\<>:"|?*]/g, '_').slice(0, MAX_FILENAME_LENGTH),
            size: file.size,
            type: file.type || 'application/octet-stream',
            chunks: Math.ceil(file.size / CHUNK_SIZE),
        };

        // Send file metadata
        this.sendMessage({ type: 'file-meta', meta });

        const channel = this.dataChannel;

        // Configure bufferedAmountLowThreshold for event-driven backpressure
        // This replaces polling with efficient event-based flow control
        channel.bufferedAmountLowThreshold = BUFFER_LOW_THRESHOLD;

        // Use slice + arrayBuffer approach for better control
        let offset = 0;

        while (offset < file.size) {
            // Check channel is still open
            if (channel.readyState !== 'open') {
                this.emit('error', new Error('Data channel closed during transfer'));
                return;
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
                    this.emit('error', new Error('Data channel closed during transfer'));
                    return;
                }
            }

            const slice = file.slice(offset, offset + CHUNK_SIZE);
            const buffer = await slice.arrayBuffer();
            channel.send(buffer);

            offset += buffer.byteLength;

            this.emit('progress', {
                fileId: meta.id,
                sent: offset,
                total: file.size,
                progress: (offset / file.size) * 100,
            });
        }

        addBreadcrumb('P2P file sent successfully', 'p2p-internet', {
            fileId: meta.id,
            fileName: meta.name,
            fileSize: meta.size,
        });

        this.sendMessage({ type: 'complete', fileId: meta.id });
        this.emit('fileSent', { file, meta });
    }

    /**
     * Send multiple files
     */
    async sendFiles(files: File[]): Promise<void> {
        for (const file of files) {
            await this.sendFile(file);
        }
    }

    /**
     * Close the connection
     */
    close(): void {
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        if (this.peer) {
            this.peer.close();
            this.peer = null;
        }
        this.state = 'closed';
        this.emit('stateChange', this.state);
    }

    // Private methods

    private createPeerConnection(): RTCPeerConnection {
        const pc = new RTCPeerConnection({
            iceServers: getIceServers(),
            // Optimize for P2P connections
            iceCandidatePoolSize: 10, // Pre-gather candidates for faster connection
            bundlePolicy: 'max-bundle', // Use single transport for all media
            rtcpMuxPolicy: 'require', // Multiplex RTP and RTCP on same port
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.emit('iceCandidate', event.candidate.toJSON());
            }
        };

        // Monitor ICE connection state for better diagnostics
        pc.oniceconnectionstatechange = () => {
            addBreadcrumb('ICE connection state changed', 'p2p-internet', {
                state: pc.iceConnectionState,
            });

            if (pc.iceConnectionState === 'failed') {
                secureLog.warn('[P2P] ICE connection failed, may need TURN relay');
            }
        };

        // Monitor ICE gathering state
        pc.onicegatheringstatechange = () => {
            addBreadcrumb('ICE gathering state changed', 'p2p-internet', {
                state: pc.iceGatheringState,
            });
        };

        pc.onconnectionstatechange = () => {
            switch (pc.connectionState) {
                case 'connected':
                    this.state = 'connected';
                    // Log connection type for analytics
                    pc.getStats().then(stats => {
                        let connectionType = 'unknown';
                        stats.forEach(stat => {
                            if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
                                connectionType = stat.localCandidateType === 'relay' ||
                                               stat.remoteCandidateType === 'relay'
                                               ? 'relayed' : 'direct';
                            }
                        });
                        secureLog.log('[P2P] Connected via', connectionType);
                    });
                    break;
                case 'failed':
                    this.state = 'failed';
                    // Report connection failure to Sentry
                    captureException(new Error('WebRTC peer connection failed'), {
                        tags: { module: 'p2p-internet', operation: 'connectionStateChange' },
                        extra: {
                            connectionState: pc.connectionState,
                            iceConnectionState: pc.iceConnectionState,
                            iceGatheringState: pc.iceGatheringState,
                        }
                    });
                    break;
                case 'closed':
                case 'disconnected':
                    this.state = 'closed';
                    break;
            }
            this.emit('stateChange', this.state);
        };

        return pc;
    }

    private setupDataChannel(channel: RTCDataChannel): void {
        channel.binaryType = 'arraybuffer';

        channel.onopen = () => {
            this.state = 'connected';
            this.emit('stateChange', this.state);
            this.emit('connected');
        };

        channel.onclose = () => {
            this.state = 'closed';
            this.emit('stateChange', this.state);
            this.emit('disconnected');
        };

        channel.onerror = (error) => {
            // Report WebRTC data channel errors to Sentry
            captureException(error instanceof Error ? error : new Error('WebRTC data channel error'), {
                tags: { module: 'p2p-internet', operation: 'dataChannelError' },
                extra: {
                    channelLabel: channel.label,
                    channelState: channel.readyState,
                }
            });
            this.emit('error', error);
        };

        channel.onmessage = (event) => {
            if (typeof event.data === 'string') {
                // JSON message
                try {
                    const message: unknown = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (_error) {
                    secureLog.error('Failed to parse message');
                }
            } else {
                // Binary data (file chunk)
                this.handleChunk(event.data);
            }
        };
    }

    private sendMessage(message: InternalMessage): void {
        if (this.dataChannel?.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(message));
        }
    }

    private handleMessage(message: unknown): void {
        if (!isInternalMessage(message)) {
            secureLog.warn('[P2P] Received invalid message format');
            return;
        }

        switch (message.type) {
            case 'file-meta': {
                const meta = message.meta;
                // Validate meta fields
                if (!meta || typeof meta.size !== 'number' || meta.size <= 0) {
                    secureLog.error('[P2P] Invalid file-meta: bad size');
                    break;
                }
                if (meta.size > MAX_FILE_SIZE) {
                    secureLog.error('[P2P] Rejected file: exceeds size limit');
                    this.sendMessage({ type: 'error', message: 'File too large' });
                    break;
                }
                if (typeof meta.id !== 'string' || meta.id.length === 0) {
                    secureLog.error('[P2P] Invalid file-meta: missing id');
                    break;
                }

                // Sanitize filename
                meta.name = typeof meta.name === 'string'
                    ? meta.name.replace(/[/\\<>:"|?*]/g, '_').slice(0, MAX_FILENAME_LENGTH)
                    : 'unnamed';

                this.receivingFile = {
                    meta,
                    chunks: [],
                    received: 0,
                };
                this.emit('fileIncoming', meta);
                break;
            }

            case 'complete':
                if (this.receivingFile) {
                    this.assembleFile();
                }
                break;

            case 'error':
                this.emit('error', new Error(
                    typeof message.message === 'string' ? message.message.slice(0, 200) : 'Remote error'
                ));
                break;
        }
    }

    private handleChunk(data: ArrayBuffer): void {
        if (!this.receivingFile) {return;}

        // Reject if receiving more data than declared
        if (this.receivingFile.received + data.byteLength > this.receivingFile.meta.size + CHUNK_SIZE) {
            secureLog.error('[P2P] Received more data than declared file size, aborting');

            // Report data overflow error to Sentry
            const overflowError = new Error('File size exceeded declared size');
            captureException(overflowError, {
                tags: { module: 'p2p-internet', operation: 'handleChunk' },
                extra: {
                    declaredSize: this.receivingFile.meta.size,
                    receivedSoFar: this.receivingFile.received,
                    chunkSize: data.byteLength,
                }
            });

            this.receivingFile = null;
            this.emit('error', overflowError);
            return;
        }

        this.receivingFile.chunks.push(data);
        this.receivingFile.received += data.byteLength;

        this.emit('progress', {
            fileId: this.receivingFile.meta.id,
            received: this.receivingFile.received,
            total: this.receivingFile.meta.size,
            progress: Math.min((this.receivingFile.received / this.receivingFile.meta.size) * 100, 100),
        });
    }

    private assembleFile(): void {
        if (!this.receivingFile) {return;}

        const { meta, chunks, received } = this.receivingFile;

        // Verify received size matches expected (within tolerance of one chunk)
        if (Math.abs(received - meta.size) > CHUNK_SIZE) {
            secureLog.warn('[P2P] File size mismatch: expected', meta.size, 'received', received);
        }

        const blob = new Blob(chunks, { type: meta.type || 'application/octet-stream' });

        this.emit('fileReceived', {
            meta,
            blob,
            url: URL.createObjectURL(blob),
        });

        this.receivingFile = null;
    }
}

export default P2PConnection;
