'use client';

/**
 * Socket.IO Signaling Client
 * Connects to the signaling server for cross-device P2P connections
 */

import { io, Socket } from 'socket.io-client';
import { generateUUID } from '@/lib/utils/uuid';
import secureLog from '@/lib/utils/secure-logger';

// Get signaling server URL from environment or use default
const getSignalingUrl = (): string => {
    if (typeof window === 'undefined') return '';

    // Check for environment variable
    const envUrl = process.env.NEXT_PUBLIC_SIGNALING_URL;
    if (envUrl) return envUrl;

    // Default: use signaling subdomain for production
    if (window.location.hostname.includes('manisahome.com')) {
        return 'wss://signaling.manisahome.com';
    }

    return '';
};

export interface SignalingEvents {
    onPeerJoined?: (data: { peerId: string; socketId: string }) => void;
    onPeerLeft?: (data: { socketId: string }) => void;
    onOffer?: (data: { offer: RTCSessionDescriptionInit; from: string }) => void;
    onAnswer?: (data: { answer: RTCSessionDescriptionInit; from: string }) => void;
    onIceCandidate?: (data: { candidate: RTCIceCandidateInit; from: string }) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
}

class SignalingClient {
    private socket: Socket | null = null;
    private joinedRooms: Set<string> = new Set();
    private peerId: string;
    private events: SignalingEvents = {};
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private isConnecting = false;
    private hasConnected = false;

    constructor() {
        this.peerId = generateUUID();
    }

    /**
     * Connect to the signaling server
     */
    connect(events?: SignalingEvents): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.socket?.connected) {
                if (events) this.events = events;
                resolve();
                return;
            }

            if (this.isConnecting) {
                reject(new Error('Connection already in progress'));
                return;
            }

            if (events) {
                this.events = events;
            }

            const url = getSignalingUrl();
            if (!url) {
                reject(new Error('Signaling URL not configured'));
                return;
            }

            this.isConnecting = true;
            this.hasConnected = false;
            secureLog.log('[Signaling] Connecting to server');

            // Clean up any existing socket
            if (this.socket) {
                this.socket.removeAllListeners();
                this.socket.disconnect();
                this.socket = null;
            }

            this.socket = io(url, {
                path: '/signaling',
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
                timeout: 10000,
            });

            this.socket.on('connect', () => {
                secureLog.log('[Signaling] Connected');
                this.reconnectAttempts = 0;
                this.isConnecting = false;

                // Rejoin rooms on reconnect
                if (this.hasConnected && this.joinedRooms.size > 0) {
                    secureLog.log('[Signaling] Rejoining rooms after reconnect');
                    for (const room of this.joinedRooms) {
                        this.socket!.emit('join-room', room, this.peerId);
                    }
                }

                this.hasConnected = true;
                this.events.onConnect?.();
                resolve();
            });

            this.socket.on('disconnect', (reason) => {
                secureLog.log('[Signaling] Disconnected:', reason);
                // Only notify if we had previously connected successfully
                if (this.hasConnected) {
                    this.events.onDisconnect?.();
                }
                // Don't clear joinedRooms — we'll rejoin on reconnect
            });

            this.socket.on('connect_error', (error) => {
                secureLog.error('[Signaling] Connection error:', error.message);
                this.reconnectAttempts++;

                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    this.isConnecting = false;
                    const err = new Error('Failed to connect to signaling server after ' + this.maxReconnectAttempts + ' attempts');
                    this.events.onError?.(err);
                    if (!this.hasConnected) {
                        reject(err);
                    }
                }
            });

            // WebRTC signaling events - validate data before passing
            this.socket.on('peer-joined', (data) => {
                if (data && typeof data.peerId === 'string' && typeof data.socketId === 'string') {
                    this.events.onPeerJoined?.(data);
                }
            });

            this.socket.on('peer-left', (data) => {
                if (data && typeof data.socketId === 'string') {
                    this.events.onPeerLeft?.(data);
                }
            });

            this.socket.on('offer', (data) => {
                if (data && data.offer && typeof data.from === 'string') {
                    this.events.onOffer?.(data);
                }
            });

            this.socket.on('answer', (data) => {
                if (data && data.answer && typeof data.from === 'string') {
                    this.events.onAnswer?.(data);
                }
            });

            this.socket.on('ice-candidate', (data) => {
                if (data && data.candidate && typeof data.from === 'string') {
                    this.events.onIceCandidate?.(data);
                }
            });
        });
    }

    /**
     * Join a room (connection code)
     */
    joinRoom(roomId: string): boolean {
        if (!this.socket?.connected) {
            secureLog.error('[Signaling] Not connected, cannot join room');
            return false;
        }

        if (this.joinedRooms.has(roomId)) {
            return true; // Already in this room
        }

        secureLog.log('[Signaling] Joining room');
        this.socket.emit('join-room', roomId, this.peerId);
        this.joinedRooms.add(roomId);
        return true;
    }

    /**
     * Leave a specific room
     */
    leaveRoom(roomId?: string): void {
        if (!this.socket?.connected) return;

        if (roomId) {
            if (this.joinedRooms.has(roomId)) {
                this.socket.emit('leave-room', roomId);
                this.joinedRooms.delete(roomId);
            }
        } else {
            // Leave all rooms
            for (const room of this.joinedRooms) {
                this.socket.emit('leave-room', room);
            }
            this.joinedRooms.clear();
        }
    }

    /**
     * Send WebRTC offer to a peer
     */
    sendOffer(targetSocketId: string, offer: RTCSessionDescriptionInit | unknown): void {
        if (!this.socket?.connected) {
            throw new Error('Cannot send offer: not connected');
        }
        this.socket.emit('offer', { target: targetSocketId, offer, ts: Date.now() });
    }

    /**
     * Send WebRTC answer to a peer
     */
    sendAnswer(targetSocketId: string, answer: RTCSessionDescriptionInit | unknown): void {
        if (!this.socket?.connected) {
            throw new Error('Cannot send answer: not connected');
        }
        this.socket.emit('answer', { target: targetSocketId, answer, ts: Date.now() });
    }

    /**
     * Send ICE candidate to a peer
     */
    sendIceCandidate(targetSocketId: string, candidate: RTCIceCandidateInit | unknown): void {
        if (!this.socket?.connected) return;
        this.socket.emit('ice-candidate', { target: targetSocketId, candidate, ts: Date.now() });
    }

    /**
     * Disconnect from the signaling server
     */
    disconnect(): void {
        this.leaveRoom(); // Leave all rooms
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnecting = false;
        this.hasConnected = false;
        this.joinedRooms.clear();
    }

    /**
     * Check if connected
     */
    get isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Get socket ID
     */
    get socketId(): string | null {
        return this.socket?.id ?? null;
    }

    /**
     * Get joined rooms
     */
    get rooms(): Set<string> {
        return new Set(this.joinedRooms);
    }

    /**
     * Get peer ID
     */
    get id(): string {
        return this.peerId;
    }

    /**
     * Listen for a custom event on the socket
     */
    on(event: string, callback: (...args: any[]) => void): void {
        this.socket?.on(event, callback);
    }

    /**
     * Emit a custom event on the socket
     */
    emit(event: string, data: any): void {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
    }
}

// Singleton instance
let signalingClient: SignalingClient | null = null;

export function getSignalingClient(): SignalingClient {
    if (!signalingClient) {
        signalingClient = new SignalingClient();
    }
    return signalingClient;
}

export { SignalingClient };
