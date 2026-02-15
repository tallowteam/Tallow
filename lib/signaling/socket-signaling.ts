'use client';

/**
 * Socket.IO Signaling Client
 * Connects to the signaling server for cross-device P2P connections
 */

import type { Socket } from 'socket.io-client';
import { generateUUID } from '@/lib/utils/uuid';

// Lazy-load socket.io-client to reduce initial bundle size (~35KB)
let socketModule: typeof import('socket.io-client') | null = null;

async function getSocketIO(): Promise<typeof import('socket.io-client')> {
    if (!socketModule) {
        socketModule = await import('socket.io-client');
    }
    return socketModule;
}
import secureLog from '@/lib/utils/secure-logger';

// Get signaling server URL from environment or use default
const getSignalingUrl = (): string => {
    if (typeof window === 'undefined') {return '';}

    // Check for environment variable
    const envUrl = process.env['NEXT_PUBLIC_SIGNALING_URL'];
    if (envUrl) {return envUrl;}

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
    // PQC signaling events
    onPQCPublicKey?: (data: { publicKey: string; from: string; version?: number }) => void;
    onPQCCiphertext?: (data: { ciphertext: Uint8Array; from: string }) => void;
    // Group transfer events
    onGroupInvite?: (data: GroupInviteData) => void;
    onGroupJoined?: (data: GroupJoinedData) => void;
    onGroupLeft?: (data: { peerId: string; socketId: string }) => void;
}

export interface GroupInviteData {
    groupId: string;
    senderId: string;
    senderName: string;
    senderSocketId: string;
    recipientCount: number;
    fileName: string;
    fileSize: number;
}

export interface GroupJoinedData {
    groupId: string;
    peerId: string;
    peerName: string;
    socketId: string;
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
    async connect(events?: SignalingEvents): Promise<void> {
        if (this.socket?.connected) {
            if (events) {this.events = events;}
            return;
        }

        if (this.isConnecting) {
            throw new Error('Connection already in progress');
        }

        if (events) {
            this.events = events;
        }

        const url = getSignalingUrl();
        if (!url) {
            throw new Error('Signaling URL not configured');
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

        // Lazy-load socket.io-client
        const { io } = await getSocketIO();

        return new Promise((resolve, reject) => {
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

            // Respond to application-level heartbeat pings from the server
            // This prevents the server from disconnecting us for inactivity
            this.socket.on('heartbeat-ping', () => {
                this.socket?.emit('heartbeat-pong');
            });

            // Handle room-member-disconnected (peer went offline but may reconnect)
            this.socket.on('room-member-disconnected', (data: unknown) => {
                if (data && typeof data === 'object' && 'socketId' in data && typeof data.socketId === 'string') {
                    this.events.onPeerLeft?.({ socketId: data.socketId });
                }
            });

            // Handle room-member-reconnected (peer came back online)
            this.socket.on('room-member-reconnected', (data: unknown) => {
                if (data && typeof data === 'object' && 'memberId' in data && typeof data.memberId === 'string') {
                    secureLog.log('[Signaling] Room member reconnected:', data.memberId);
                }
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

            // PQC signaling events
            this.socket.on('pqc-public-key', (data) => {
                if (data && typeof data.publicKey === 'string' && typeof data.from === 'string') {
                    this.events.onPQCPublicKey?.(data);
                }
            });

            this.socket.on('pqc-ciphertext', (data) => {
                if (data && data.ciphertext && typeof data.from === 'string') {
                    this.events.onPQCCiphertext?.(data);
                }
            });

            // Group transfer events
            this.socket.on('group-invite', (data: unknown) => {
                if (this.isValidGroupInvite(data)) {
                    secureLog.log('[Signaling] Received group invite:', data);
                    this.events.onGroupInvite?.(data);
                }
            });

            this.socket.on('group-joined', (data: unknown) => {
                if (this.isValidGroupJoined(data)) {
                    secureLog.log('[Signaling] Peer joined group:', data);
                    this.events.onGroupJoined?.(data);
                }
            });

            this.socket.on('group-left', (data: unknown) => {
                if (this.isValidGroupLeft(data)) {
                    secureLog.log('[Signaling] Peer left group:', data);
                    this.events.onGroupLeft?.(data);
                }
            });

            // Group WebRTC signaling events
            this.socket.on('group-offer', (data: unknown) => {
                if (this.isValidGroupOffer(data)) {
                    secureLog.log('[Signaling] Received group offer from:', data.from);
                }
            });

            this.socket.on('group-answer', (data: unknown) => {
                if (this.isValidGroupAnswer(data)) {
                    secureLog.log('[Signaling] Received group answer from:', data.from);
                }
            });

            this.socket.on('group-ice-candidate', (data: unknown) => {
                if (this.isValidGroupIceCandidate(data)) {
                    secureLog.log('[Signaling] Received group ICE candidate from:', data.from);
                }
            });

            this.socket.on('group-transfer-cancelled', (data: unknown) => {
                if (this.isValidGroupCancelled(data)) {
                    secureLog.log('[Signaling] Group transfer cancelled:', data.groupId);
                }
            });
        });
    }

    /**
     * Type guard for group invite data
     */
    private isValidGroupInvite(data: unknown): data is GroupInviteData {
        return (
            typeof data === 'object' &&
            data !== null &&
            'groupId' in data &&
            typeof data.groupId === 'string' &&
            'senderId' in data &&
            typeof data.senderId === 'string' &&
            'senderName' in data &&
            typeof data.senderName === 'string' &&
            'senderSocketId' in data &&
            typeof data.senderSocketId === 'string' &&
            'recipientCount' in data &&
            typeof data.recipientCount === 'number' &&
            'fileName' in data &&
            typeof data.fileName === 'string' &&
            'fileSize' in data &&
            typeof data.fileSize === 'number'
        );
    }

    /**
     * Type guard for group joined data
     */
    private isValidGroupJoined(data: unknown): data is GroupJoinedData {
        return (
            typeof data === 'object' &&
            data !== null &&
            'groupId' in data &&
            typeof data.groupId === 'string' &&
            'peerId' in data &&
            typeof data.peerId === 'string' &&
            'peerName' in data &&
            typeof data.peerName === 'string' &&
            'socketId' in data &&
            typeof data.socketId === 'string'
        );
    }

    /**
     * Type guard for group left data
     */
    private isValidGroupLeft(data: unknown): data is { peerId: string; socketId: string } {
        return (
            typeof data === 'object' &&
            data !== null &&
            'peerId' in data &&
            typeof data.peerId === 'string' &&
            'socketId' in data &&
            typeof data.socketId === 'string'
        );
    }

    /**
     * Type guard for group offer data
     */
    private isValidGroupOffer(data: unknown): data is { groupId: string; offer: RTCSessionDescriptionInit; from: string } {
        return (
            typeof data === 'object' &&
            data !== null &&
            'groupId' in data &&
            typeof data.groupId === 'string' &&
            'offer' in data &&
            typeof data.offer === 'object' &&
            'from' in data &&
            typeof data.from === 'string'
        );
    }

    /**
     * Type guard for group answer data
     */
    private isValidGroupAnswer(data: unknown): data is { groupId: string; answer: RTCSessionDescriptionInit; from: string } {
        return (
            typeof data === 'object' &&
            data !== null &&
            'groupId' in data &&
            typeof data.groupId === 'string' &&
            'answer' in data &&
            typeof data.answer === 'object' &&
            'from' in data &&
            typeof data.from === 'string'
        );
    }

    /**
     * Type guard for group ICE candidate data
     */
    private isValidGroupIceCandidate(data: unknown): data is { groupId: string; candidate: RTCIceCandidateInit; from: string } {
        return (
            typeof data === 'object' &&
            data !== null &&
            'groupId' in data &&
            typeof data.groupId === 'string' &&
            'candidate' in data &&
            typeof data.candidate === 'object' &&
            'from' in data &&
            typeof data.from === 'string'
        );
    }

    /**
     * Type guard for group cancelled data
     */
    private isValidGroupCancelled(data: unknown): data is { groupId: string; reason?: string } {
        return (
            typeof data === 'object' &&
            data !== null &&
            'groupId' in data &&
            typeof data.groupId === 'string'
        );
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
        if (!this.socket?.connected) {return;}

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
        if (!this.socket?.connected) {return;}
        this.socket.emit('ice-candidate', { target: targetSocketId, candidate, ts: Date.now() });
    }

    /**
     * Send PQC public key to initiate handshake
     */
    sendPQCPublicKey(room: string, publicKey: string, version: number = 2): void {
        if (!this.socket?.connected) {
            throw new Error('Cannot send PQC public key: not connected');
        }
        this.socket.emit('pqc-public-key', { room, publicKey, version, ts: Date.now() });
    }

    /**
     * Send PQC encapsulated secret back to initiator
     */
    sendPQCCiphertext(targetSocketId: string, ciphertext: Uint8Array): void {
        if (!this.socket?.connected) {
            throw new Error('Cannot send PQC ciphertext: not connected');
        }
        this.socket.emit('pqc-ciphertext', { target: targetSocketId, ciphertext, ts: Date.now() });
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
     *
     * @param event - Event name to listen for
     * @param callback - Callback function to invoke when event is received
     */
    on(event: string, callback: (...args: unknown[]) => void): void {
        this.socket?.on(event, callback);
    }

    /**
     * Emit a custom event on the socket
     *
     * @param event - Event name to emit
     * @param data - Event data to send
     */
    emit(event: string, data: Record<string, unknown> | unknown): void {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
    }

    // ==========================================================================
    // Group Transfer Methods
    // ==========================================================================

    /**
     * Create a group transfer session
     */
    createGroupTransfer(
        groupId: string,
        fileName: string,
        fileSize: number,
        recipientSocketIds: string[]
    ): void {
        if (!this.socket?.connected) {
            throw new Error('Cannot create group transfer: not connected');
        }

        this.socket.emit('create-group-transfer', {
            groupId,
            senderId: this.peerId,
            fileName,
            fileSize,
            recipients: recipientSocketIds,
        });

        secureLog.log(`[Signaling] Created group transfer: ${groupId} with ${recipientSocketIds.length} recipients`);
    }

    /**
     * Join a group transfer
     */
    joinGroupTransfer(groupId: string, senderSocketId: string): void {
        if (!this.socket?.connected) {
            throw new Error('Cannot join group transfer: not connected');
        }

        this.socket.emit('join-group-transfer', {
            groupId,
            peerId: this.peerId,
            senderSocketId,
        });

        secureLog.log(`[Signaling] Joined group transfer: ${groupId}`);
    }

    /**
     * Leave a group transfer
     */
    leaveGroupTransfer(groupId: string): void {
        if (!this.socket?.connected) {return;}

        this.socket.emit('leave-group-transfer', {
            groupId,
            peerId: this.peerId,
        });

        secureLog.log(`[Signaling] Left group transfer: ${groupId}`);
    }

    /**
     * Send group offer to specific peer
     */
    sendGroupOffer(
        groupId: string,
        targetSocketId: string,
        offer: RTCSessionDescriptionInit
    ): void {
        if (!this.socket?.connected) {
            throw new Error('Cannot send group offer: not connected');
        }

        this.socket.emit('group-offer', {
            groupId,
            target: targetSocketId,
            offer,
            from: this.socket.id,
            ts: Date.now(),
        });
    }

    /**
     * Send group answer to specific peer
     */
    sendGroupAnswer(
        groupId: string,
        targetSocketId: string,
        answer: RTCSessionDescriptionInit
    ): void {
        if (!this.socket?.connected) {
            throw new Error('Cannot send group answer: not connected');
        }

        this.socket.emit('group-answer', {
            groupId,
            target: targetSocketId,
            answer,
            from: this.socket.id,
            ts: Date.now(),
        });
    }

    /**
     * Send ICE candidate for group transfer
     */
    sendGroupIceCandidate(
        groupId: string,
        targetSocketId: string,
        candidate: RTCIceCandidateInit
    ): void {
        if (!this.socket?.connected) {return;}

        this.socket.emit('group-ice-candidate', {
            groupId,
            target: targetSocketId,
            candidate,
            from: this.socket.id,
            ts: Date.now(),
        });
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
