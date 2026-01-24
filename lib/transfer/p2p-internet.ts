'use client';

/**
 * P2P Internet Transfer Module
 * Handles WebRTC peer connections for file transfers across the internet
 */

import { EventEmitter } from 'events';
import { Device, ConnectionTicket as Ticket, TransferChunk } from '../types';
import { generateUUID } from '../utils/uuid';
import secureLog from '../utils/secure-logger';

// Connection states
export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'failed' | 'closed';

// Message types for signaling
export interface SignalMessage {
    type: 'offer' | 'answer' | 'candidate' | 'ready' | 'file-meta' | 'chunk' | 'ack' | 'complete' | 'error';
    payload: any;
    from: string;
    to: string;
}

// File metadata sent before transfer
export interface FileMeta {
    id: string;
    name: string;
    size: number;
    type: string;
    chunks: number;
}

// Constants
const CHUNK_SIZE = 64 * 1024; // 64KB chunks for WebRTC
const MAX_FILE_SIZE = 4 * 1024 * 1024 * 1024; // 4GB limit
const MAX_FILENAME_LENGTH = 255;

// TURN server configuration from environment
const TURN_SERVER = process.env.NEXT_PUBLIC_TURN_SERVER || '';
const TURN_USERNAME = process.env.NEXT_PUBLIC_TURN_USERNAME || '';
const TURN_CREDENTIAL = process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '';

function getIceServers(): RTCIceServer[] {
    const servers: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
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
        code += chars[values[i] % chars.length];
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
    private localDevice: Device;
    private remoteDevice: Device | null = null;
    private pendingCandidates: RTCIceCandidate[] = [];
    private fileQueue: File[] = [];
    private receivingFile: {
        meta: FileMeta;
        chunks: ArrayBuffer[];
        received: number;
    } | null = null;

    constructor(localDevice: Device) {
        super();
        this.localDevice = localDevice;
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
        if (!this.peer) throw new Error('No peer connection');
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

        // Use slice + arrayBuffer approach for better control
        let offset = 0;

        while (offset < file.size) {
            // Check channel is still open
            if (channel.readyState !== 'open') {
                this.emit('error', new Error('Data channel closed during transfer'));
                return;
            }

            // Backpressure: wait if buffer is full
            while (channel.bufferedAmount > 1024 * 1024) {
                if (channel.readyState !== 'open') {
                    this.emit('error', new Error('Data channel closed during transfer'));
                    return;
                }
                await new Promise((resolve) => setTimeout(resolve, 50));
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
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.emit('iceCandidate', event.candidate.toJSON());
            }
        };

        pc.onconnectionstatechange = () => {
            switch (pc.connectionState) {
                case 'connected':
                    this.state = 'connected';
                    break;
                case 'failed':
                    this.state = 'failed';
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
            this.emit('error', error);
        };

        channel.onmessage = (event) => {
            if (typeof event.data === 'string') {
                // JSON message
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    secureLog.error('Failed to parse message');
                }
            } else {
                // Binary data (file chunk)
                this.handleChunk(event.data);
            }
        };
    }

    private sendMessage(message: any): void {
        if (this.dataChannel?.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(message));
        }
    }

    private handleMessage(message: any): void {
        if (!message || typeof message.type !== 'string') return;

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
        if (!this.receivingFile) return;

        // Reject if receiving more data than declared
        if (this.receivingFile.received + data.byteLength > this.receivingFile.meta.size + CHUNK_SIZE) {
            secureLog.error('[P2P] Received more data than declared file size, aborting');
            this.receivingFile = null;
            this.emit('error', new Error('File size exceeded declared size'));
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
        if (!this.receivingFile) return;

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
