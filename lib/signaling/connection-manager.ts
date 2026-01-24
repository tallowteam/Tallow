'use client';

/**
 * Connection Manager
 * Handles P2P connection establishment using WebSocket signaling
 */

import { getSignalingClient, SignalingEvents } from './socket-signaling';
import { deriveSignalingKey, encryptSignalingPayload, decryptSignalingPayload } from './signaling-crypto';
import secureLog from '@/lib/utils/secure-logger';

// Word lists for memorable codes (using crypto.getRandomValues)
const ADJECTIVES = [
    'Red', 'Blue', 'Green', 'Gold', 'Silver', 'Amber', 'Jade', 'Ruby',
    'Swift', 'Brave', 'Kind', 'Wise', 'Bold', 'Calm', 'Warm', 'Cool',
    'Happy', 'Lucky', 'Sunny', 'Misty', 'Wild', 'Free', 'Pure', 'True'
];

const NOUNS = [
    'Lion', 'Eagle', 'Wolf', 'Bear', 'Hawk', 'Fox', 'Deer', 'Owl',
    'Star', 'Moon', 'Sun', 'Cloud', 'Wind', 'Rain', 'Snow', 'Fire',
    'Tree', 'Rose', 'Lake', 'Wave', 'Peak', 'Glow', 'Spark', 'Dream',
    'Bay', 'Jet', 'Ace', 'Mask', 'Zoom', 'Dash', 'Bolt', 'Fern'
];

/**
 * Get a cryptographically random index using rejection sampling (no modulo bias)
 */
function secureRandomIndex(max: number): number {
    const array = new Uint32Array(1);
    // Rejection sampling: reject values that would cause bias
    const limit = Math.floor(0xFFFFFFFF / max) * max;
    let value: number;
    do {
        crypto.getRandomValues(array);
        value = array[0];
    } while (value >= limit);
    return value % max;
}

export interface ConnectionEvents {
    onPeerConnected?: (peerId: string, socketId: string) => void;
    onPeerDisconnected?: (socketId: string) => void;
    onOffer?: (offer: RTCSessionDescriptionInit, fromSocketId: string) => void;
    onAnswer?: (answer: RTCSessionDescriptionInit, fromSocketId: string) => void;
    onIceCandidate?: (candidate: RTCIceCandidateInit, fromSocketId: string) => void;
    onSignalingConnected?: () => void;
    onSignalingDisconnected?: () => void;
    onError?: (error: string) => void;
}

export class ConnectionManager {
    private wordCode: string;
    private alphaCode: string;
    private events: ConnectionEvents = {};
    private isSignalingConnected = false;
    private targetSocketId: string | null = null;
    private signalingKey: CryptoKey | null = null;

    constructor() {
        this.wordCode = this.generateWordCode();
        this.alphaCode = this.generateAlphaCode();
    }

    /**
     * Generate a 3-word connection code using crypto randomness
     */
    private generateWordCode(): string {
        const adj = ADJECTIVES[secureRandomIndex(ADJECTIVES.length)];
        const noun1 = NOUNS[secureRandomIndex(NOUNS.length)];
        const noun2 = NOUNS[secureRandomIndex(NOUNS.length)];
        return `${adj}-${noun1}-${noun2}`;
    }

    /**
     * Generate an 8-character alphanumeric code using crypto randomness
     */
    private generateAlphaCode(): string {
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
     * Get the current word-based connection code
     */
    get code(): string {
        return this.wordCode;
    }

    /**
     * Get the alphanumeric connection code
     */
    get shortCode(): string {
        return this.alphaCode;
    }

    /**
     * Regenerate connection codes
     */
    regenerateCodes(): { wordCode: string; alphaCode: string } {
        this.wordCode = this.generateWordCode();
        this.alphaCode = this.generateAlphaCode();
        return { wordCode: this.wordCode, alphaCode: this.alphaCode };
    }

    /**
     * Set event handlers
     */
    setEvents(events: ConnectionEvents): void {
        this.events = events;
    }

    /**
     * Connect to signaling server and join room with current code
     */
    async startListening(): Promise<void> {
        const client = getSignalingClient();

        // Derive signaling encryption key from our code
        this.signalingKey = await deriveSignalingKey(this.wordCode);

        const signalingEvents: SignalingEvents = {
            onConnect: () => {
                this.isSignalingConnected = true;
                this.events.onSignalingConnected?.();
                client.joinRoom(this.wordCode.toLowerCase());
            },
            onDisconnect: () => {
                this.isSignalingConnected = false;
                this.events.onSignalingDisconnected?.();
            },
            onPeerJoined: (data) => {
                this.targetSocketId = data.socketId;
                this.events.onPeerConnected?.(data.peerId, data.socketId);
            },
            onPeerLeft: (data) => {
                if (this.targetSocketId === data.socketId) {
                    this.targetSocketId = null;
                }
                this.events.onPeerDisconnected?.(data.socketId);
            },
            onOffer: async (data) => {
                this.targetSocketId = data.from;
                const offer = await this.decryptPayload(data.offer);
                this.events.onOffer?.(offer as RTCSessionDescriptionInit, data.from);
            },
            onAnswer: async (data) => {
                const answer = await this.decryptPayload(data.answer);
                this.events.onAnswer?.(answer as RTCSessionDescriptionInit, data.from);
            },
            onIceCandidate: async (data) => {
                const candidate = await this.decryptPayload(data.candidate);
                this.events.onIceCandidate?.(candidate as RTCIceCandidateInit, data.from);
            },
            onError: (error) => {
                this.events.onError?.(error.message);
            },
        };

        try {
            await client.connect(signalingEvents);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            if (!msg.includes('not configured')) {
                this.events.onError?.('Failed to connect to signaling server');
            }
            throw error;
        }
    }

    /**
     * Connect to a peer using their connection code
     */
    async connectToCode(code: string): Promise<boolean> {
        const client = getSignalingClient();

        if (!client.isConnected) {
            await this.startListening();
        }

        // Derive signaling key from the peer's code
        this.signalingKey = await deriveSignalingKey(code);

        const normalizedCode = code.toLowerCase().trim();
        const joined = client.joinRoom(normalizedCode);
        return joined;
    }

    /**
     * Send WebRTC offer to connected peer (encrypted)
     */
    async sendOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.targetSocketId) {
            throw new Error('No target peer to send offer');
        }

        const client = getSignalingClient();
        const payload = await this.encryptPayload(offer);
        client.sendOffer(this.targetSocketId, payload);
    }

    /**
     * Send WebRTC answer to connected peer (encrypted)
     */
    async sendAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.targetSocketId) {
            throw new Error('No target peer to send answer');
        }

        const client = getSignalingClient();
        const payload = await this.encryptPayload(answer);
        client.sendAnswer(this.targetSocketId, payload);
    }

    /**
     * Send ICE candidate to connected peer (encrypted)
     */
    async sendIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.targetSocketId) return;

        const client = getSignalingClient();
        const payload = await this.encryptPayload(candidate);
        client.sendIceCandidate(this.targetSocketId, payload);
    }

    /**
     * Encrypt a signaling payload if key is available
     */
    private async encryptPayload(data: unknown): Promise<any> {
        if (!this.signalingKey) return data;
        return await encryptSignalingPayload(this.signalingKey, data);
    }

    /**
     * Decrypt a signaling payload if it's encrypted
     */
    private async decryptPayload(data: any): Promise<unknown> {
        if (!data || !data.encrypted || !this.signalingKey) return data;
        return await decryptSignalingPayload(this.signalingKey, data);
    }

    /**
     * Disconnect and cleanup
     */
    disconnect(): void {
        const client = getSignalingClient();
        client.disconnect();
        this.isSignalingConnected = false;
        this.targetSocketId = null;
    }

    /**
     * Check if signaling is connected
     */
    get connected(): boolean {
        return this.isSignalingConnected;
    }

    /**
     * Get the target socket ID for direct messaging
     */
    get targetPeer(): string | null {
        return this.targetSocketId;
    }
}

// Singleton instance
let connectionManager: ConnectionManager | null = null;

export function getConnectionManager(): ConnectionManager {
    if (!connectionManager) {
        connectionManager = new ConnectionManager();
    }
    return connectionManager;
}

export default { getConnectionManager, ConnectionManager };
