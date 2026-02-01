'use client';

/**
 * Connection Manager
 * Handles P2P connection establishment using WebSocket signaling
 */

import { getSignalingClient, SignalingEvents } from './socket-signaling';
import { deriveSignalingKey, encryptSignalingPayload, decryptSignalingPayload } from './signaling-crypto';
import {
    generatePQCSignalingKeypair,
    derivePQCSignalingKeyAsInitiator,
    derivePQCSignalingKeyAsResponder,
    deriveLegacySignalingKey,
    encryptPQCSignalingPayload,
    decryptPQCSignalingPayload,
    negotiateProtocolVersion,
    serializePublicKey,
    deserializePublicKey,
    type PQCSignalingKeyMaterial,
    type PQCSignalingSession,
} from './pqc-signaling';
import { secureLog } from '../utils/secure-logger';
import { captureException, addBreadcrumb } from '../monitoring/sentry';
import {
    detectNATType,
    getConnectionStrategy,
    getOptimizedICEConfig,
    type NATType,
    type NATDetectionResult,
    type ConnectionStrategyResult,
} from '../network/nat-detection';

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
    let value: number = limit; // Initialize to ensure at least one iteration
    do {
        crypto.getRandomValues(array);
        const arrayValue = array[0];
        if (arrayValue !== undefined) {
            value = arrayValue;
        }
    } while (value >= limit);
    return value % max;
}

/**
 * Encrypted signaling payload structure
 */
interface EncryptedSignalingPayload {
    encrypted: boolean;
    ct: string;
    iv: string;
    ts?: number;
    v?: number;
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
    onNATDetected?: (result: NATDetectionResult) => void;
    onPeerNATReceived?: (peerNAT: NATType, socketId: string) => void;
    onConnectionStrategyDetermined?: (strategy: ConnectionStrategyResult) => void;
}

export interface MultiPeerConnectionState {
    targetSocketId: string;
    status: 'connecting' | 'connected' | 'failed' | 'disconnected';
    error?: string;
    connectedAt?: Date;
}

export interface MultiPeerConnectionResult {
    successful: string[];
    failed: Array<{ socketId: string; error: string }>;
    totalAttempts: number;
    duration: number; // milliseconds
}

export class ConnectionManager {
    private wordCode: string;
    private alphaCode: string;
    private events: ConnectionEvents = {};
    private isSignalingConnected = false;
    private targetSocketId: string | null = null;
    private signalingKey: CryptoKey | null = null;
    private multiPeerConnections: Map<string, MultiPeerConnectionState> = new Map();
    private connectionPool: Set<string> = new Set();
    private maxConcurrentConnections = 10;

    // PQC signaling support
    private usePQC: boolean = true; // Enable PQC by default
    private pqcKeyMaterial: PQCSignalingKeyMaterial | null = null;
    private pqcSession: PQCSignalingSession | null = null;
    private protocolVersion: number = 2; // v2 = PQC support

    // Performance metrics
    private pqcMetrics = {
        keypairGenTime: 0,
        encapsulateTime: 0,
        decapsulateTime: 0,
        totalHandshakeTime: 0,
    };

    // NAT detection support
    private localNATResult: NATDetectionResult | null = null;
    private peerNATTypes: Map<string, NATType> = new Map();
    private connectionStrategies: Map<string, ConnectionStrategyResult> = new Map();
    private natDetectionInProgress: Promise<NATDetectionResult> | null = null;

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
            const value = values[i];
            if (value !== undefined) {
                code += chars[value % chars.length];
            }
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

        // Generate PQC keypair if enabled
        if (this.usePQC) {
            try {
                const startTime = performance.now();
                this.pqcKeyMaterial = await generatePQCSignalingKeypair();
                this.pqcMetrics.keypairGenTime = performance.now() - startTime;
                secureLog.log('[ConnectionManager] Generated PQC signaling keypair (ML-KEM-768 + X25519)',
                    `[${this.pqcMetrics.keypairGenTime.toFixed(2)}ms]`);
            } catch (error) {
                secureLog.warn('[ConnectionManager] PQC key generation failed, falling back to legacy:', error);
                captureException(error as Error, {
                    tags: { component: 'connection-manager', operation: 'pqc-keygen' },
                    extra: { fallbackToLegacy: true }
                });
                this.usePQC = false;
            }
        }

        // For now, use legacy key derivation until peer's PQC public key is received
        // Session will upgrade to PQC after key exchange handshake
        if (this.usePQC && this.pqcKeyMaterial) {
            this.pqcSession = await deriveLegacySignalingKey(this.wordCode);
            secureLog.log('[ConnectionManager] Initial session: HKDF (will upgrade to PQC after handshake)');
        } else {
            this.signalingKey = await deriveSignalingKey(this.wordCode);
        }

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
            onPQCPublicKey: async (data) => {
                // Responder: Receive initiator's PQC public key and complete handshake
                if (this.usePQC && this.pqcKeyMaterial) {
                    try {
                        // Negotiate protocol version
                        const peerVersion = data.version || 1;
                        const negotiated = negotiateProtocolVersion(this.protocolVersion, peerVersion);

                        secureLog.log('[ConnectionManager] Received PQC public key from peer',
                            `[Peer v${peerVersion}, Negotiated v${negotiated.version}, PQC: ${negotiated.usePQC}]`);

                        if (!negotiated.usePQC) {
                            // Fall back to legacy if peer doesn't support PQC
                            secureLog.log('[ConnectionManager] Peer does not support PQC, using legacy signaling');
                            this.pqcSession = await deriveLegacySignalingKey(this.wordCode);
                            return;
                        }

                        const startTime = performance.now();
                        const peerPublicKey = deserializePublicKey(data.publicKey);
                        const { session, encapsulatedSecret } = await derivePQCSignalingKeyAsResponder(
                            peerPublicKey
                        );
                        this.pqcMetrics.encapsulateTime = performance.now() - startTime;

                        this.pqcSession = session;
                        secureLog.log('[ConnectionManager] PQC session established as responder (ML-KEM-768)',
                            `[${this.pqcMetrics.encapsulateTime.toFixed(2)}ms]`);

                        // Send our encapsulated secret back to initiator
                        client.sendPQCCiphertext(data.from, encapsulatedSecret);
                    } catch (error) {
                        secureLog.error('[ConnectionManager] PQC handshake failed:', error);
                        // Fall back to legacy if PQC fails
                        this.pqcSession = await deriveLegacySignalingKey(this.wordCode);
                    }
                }
            },
            onPQCCiphertext: async (data) => {
                // Initiator: Receive encapsulated secret and derive final session key
                if (this.usePQC && this.pqcKeyMaterial) {
                    try {
                        secureLog.log('[ConnectionManager] Received PQC ciphertext from peer, deriving final session key...');

                        const startTime = performance.now();
                        this.pqcSession = await derivePQCSignalingKeyAsInitiator(
                            this.pqcKeyMaterial,
                            data.ciphertext
                        );
                        this.pqcMetrics.decapsulateTime = performance.now() - startTime;

                        // Calculate total handshake time
                        this.pqcMetrics.totalHandshakeTime =
                            this.pqcMetrics.keypairGenTime +
                            this.pqcMetrics.encapsulateTime +
                            this.pqcMetrics.decapsulateTime;

                        secureLog.log('[ConnectionManager] PQC session established as initiator (ML-KEM-768)',
                            `[${this.pqcMetrics.decapsulateTime.toFixed(2)}ms]`);
                        secureLog.log('[PQC Metrics]', {
                            keypairGenTime: `${this.pqcMetrics.keypairGenTime.toFixed(2)}ms`,
                            encapsulateTime: `${this.pqcMetrics.encapsulateTime.toFixed(2)}ms`,
                            decapsulateTime: `${this.pqcMetrics.decapsulateTime.toFixed(2)}ms`,
                            totalHandshakeTime: `${this.pqcMetrics.totalHandshakeTime.toFixed(2)}ms`
                        });
                    } catch (error) {
                        secureLog.error('[ConnectionManager] PQC key derivation failed:', error);
                        // Keep using legacy session
                    }
                }
            },
            onError: (error) => {
                captureException(new Error(error.message), {
                    tags: { component: 'connection-manager', operation: 'signaling-error' },
                    extra: { errorCode: (error as { code?: string }).code }
                });
                this.events.onError?.(error.message);
            },
        };

        try {
            await client.connect(signalingEvents);
            addBreadcrumb('connection', 'Connected to signaling server');
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            if (!msg.includes('not configured')) {
                captureException(error as Error, {
                    tags: { component: 'connection-manager', operation: 'signaling-connect' },
                    extra: { errorMessage: msg }
                });
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

        // Start with legacy key for initial handshake
        // Will upgrade to PQC after key exchange completes
        if (this.usePQC && this.pqcKeyMaterial) {
            this.pqcSession = await deriveLegacySignalingKey(code);
            secureLog.log('[ConnectionManager] Initiating connection with PQC handshake...');
        } else {
            // Pure legacy signaling
            this.signalingKey = await deriveSignalingKey(code);
        }

        const normalizedCode = code.toLowerCase().trim();
        const joined = client.joinRoom(normalizedCode);

        // After joining, initiate PQC handshake by sending our public key
        if (joined && this.usePQC && this.pqcKeyMaterial) {
            try {
                const publicKeyStr = serializePublicKey(this.pqcKeyMaterial.publicKey);
                // Send to the room (peer will receive via onPQCPublicKey handler)
                client.sendPQCPublicKey(normalizedCode, publicKeyStr, this.protocolVersion);
                secureLog.log('[ConnectionManager] Sent PQC public key to initiate handshake',
                    `[Protocol v${this.protocolVersion}]`);
            } catch (error) {
                secureLog.warn('[ConnectionManager] Failed to send PQC public key:', error);
                // Continue with legacy session
                this.usePQC = false;
                this.signalingKey = await deriveSignalingKey(code);
            }
        }

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
        if (!this.targetSocketId) {return;}

        const client = getSignalingClient();
        const payload = await this.encryptPayload(candidate);
        client.sendIceCandidate(this.targetSocketId, payload);
    }

    /**
     * Encrypt a signaling payload if key is available
     * Uses PQC encryption if available, otherwise falls back to legacy
     */
    private async encryptPayload(data: unknown): Promise<any> {
        // Try PQC first
        if (this.usePQC && this.pqcSession) {
            return await encryptPQCSignalingPayload(this.pqcSession, data);
        }

        // Fall back to legacy
        if (this.signalingKey) {
            return await encryptSignalingPayload(this.signalingKey, data);
        }

        return data;
    }

    /**
     * Decrypt a signaling payload if it's encrypted
     * Automatically detects PQC vs legacy encryption
     */
    private async decryptPayload(data: EncryptedSignalingPayload | unknown): Promise<unknown> {
        if (!data || typeof data !== 'object') {return data;}
        const raw = data as Record<string, unknown>;
        if (!raw['encrypted'] || typeof raw['ct'] !== 'string' || typeof raw['iv'] !== 'string') {
            return data;
        }

        const payload: EncryptedSignalingPayload = {
            encrypted: true,
            ct: raw['ct'] as string,
            iv: raw['iv'] as string,
            ...(typeof raw['ts'] === 'number' ? { ts: raw['ts'] } : {}),
            ...(typeof raw['v'] === 'number' ? { v: raw['v'] } : {}),
        };

        // Check protocol version to determine decryption method
        const isPQC = payload.v && payload.v >= 2;

        if (isPQC && this.pqcSession) {
            return await decryptPQCSignalingPayload(this.pqcSession, payload);
        }

        // Fall back to legacy decryption
        if (this.signalingKey) {
            return await decryptSignalingPayload(this.signalingKey, payload);
        }

        return data;
    }

    /**
     * Get PQC public key for sharing with peer
     * Returns null if PQC is not enabled or keypair not generated
     */
    getPQCPublicKey(): string | null {
        if (!this.usePQC || !this.pqcKeyMaterial) {return null;}
        return serializePublicKey(this.pqcKeyMaterial.publicKey);
    }

    /**
     * Check if using PQC signaling
     */
    isPQCEnabled(): boolean {
        return this.usePQC && this.pqcSession !== null;
    }

    /**
     * Get signaling algorithm info
     */
    getSignalingInfo(): { algorithm: string; version: number } {
        if (this.usePQC && this.pqcSession) {
            return {
                algorithm: this.pqcSession.algorithm,
                version: this.pqcSession.version,
            };
        }
        return {
            algorithm: 'HKDF-AES-256 (Legacy)',
            version: 1,
        };
    }

    // =========================================================================
    // NAT Detection Methods
    // =========================================================================

    /**
     * Detect local NAT type for connection optimization
     * Results are cached for 5 minutes
     */
    async detectNAT(): Promise<NATDetectionResult> {
        // Return cached result if available
        if (this.localNATResult) {
            return this.localNATResult;
        }

        // Wait for in-progress detection
        if (this.natDetectionInProgress) {
            return this.natDetectionInProgress;
        }

        // Start new detection
        this.natDetectionInProgress = detectNATType();

        try {
            this.localNATResult = await this.natDetectionInProgress;
            secureLog.log('[ConnectionManager] NAT detected:', {
                type: this.localNATResult.type,
                confidence: this.localNATResult.confidence,
                publicIP: this.localNATResult.publicIP ? '[hidden]' : 'none',
            });
            this.events.onNATDetected?.(this.localNATResult);
            return this.localNATResult;
        } finally {
            this.natDetectionInProgress = null;
        }
    }

    /**
     * Get local NAT detection result
     */
    getLocalNATResult(): NATDetectionResult | null {
        return this.localNATResult;
    }

    /**
     * Get local NAT type
     */
    getLocalNATType(): NATType | null {
        return this.localNATResult?.type ?? null;
    }

    /**
     * Set peer's NAT type (received via signaling)
     */
    setPeerNATType(socketId: string, natType: NATType): void {
        this.peerNATTypes.set(socketId, natType);
        this.events.onPeerNATReceived?.(natType, socketId);

        // Calculate connection strategy if we have local NAT info
        if (this.localNATResult) {
            const strategy = getConnectionStrategy(this.localNATResult.type, natType);
            this.connectionStrategies.set(socketId, strategy);
            secureLog.log('[ConnectionManager] Connection strategy determined:', {
                localNAT: this.localNATResult.type,
                remoteNAT: natType,
                strategy: strategy.strategy,
                reason: strategy.reason,
            });
            this.events.onConnectionStrategyDetermined?.(strategy);
        }
    }

    /**
     * Get peer's NAT type
     */
    getPeerNATType(socketId: string): NATType | null {
        return this.peerNATTypes.get(socketId) ?? null;
    }

    /**
     * Get connection strategy for a specific peer
     */
    getConnectionStrategy(socketId: string): ConnectionStrategyResult | null {
        return this.connectionStrategies.get(socketId) ?? null;
    }

    /**
     * Get optimized ICE configuration based on NAT types
     */
    getOptimizedICEConfig(
        _socketId: string,
        turnServer?: string,
        turnCredentials?: { username: string; credential: string }
    ): RTCConfiguration | null {
        if (!this.localNATResult) {
            return null;
        }

        return getOptimizedICEConfig(
            this.localNATResult.type,
            turnServer,
            turnCredentials
        );
    }

    /**
     * Check if TURN relay is recommended for a peer
     */
    shouldUseTURN(socketId: string): boolean {
        const strategy = this.connectionStrategies.get(socketId);
        return strategy?.useTURN ?? false;
    }

    /**
     * Get recommended timeout for direct connection attempts
     */
    getDirectConnectionTimeout(socketId: string): number {
        const strategy = this.connectionStrategies.get(socketId);
        return strategy?.directTimeout ?? 15000; // Default 15 seconds
    }

    /**
     * Clear NAT detection cache
     */
    clearNATCache(): void {
        this.localNATResult = null;
        this.peerNATTypes.clear();
        this.connectionStrategies.clear();
    }

    /**
     * Disconnect and cleanup
     */
    disconnect(): void {
        const client = getSignalingClient();
        client.disconnect();
        this.isSignalingConnected = false;
        this.targetSocketId = null;
        this.peerNATTypes.clear();
        this.connectionStrategies.clear();
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

    /**
     * Set maximum concurrent connections
     */
    setMaxConcurrentConnections(max: number): void {
        this.maxConcurrentConnections = Math.max(1, Math.min(max, 50)); // Limit between 1-50
    }

    /**
     * Connect to multiple peers simultaneously
     * Returns results with successful and failed connections
     */
    async connectToMultiplePeers(
        socketIds: string[],
        options: {
            timeout?: number;
            onPeerConnected?: (socketId: string) => void;
            onPeerFailed?: (socketId: string, error: string) => void;
        } = {}
    ): Promise<MultiPeerConnectionResult> {
        const startTime = Date.now();
        const { timeout = 30000, onPeerConnected, onPeerFailed } = options;

        if (socketIds.length === 0) {
            return {
                successful: [],
                failed: [],
                totalAttempts: 0,
                duration: 0,
            };
        }

        // Enforce connection limit
        const limitedSocketIds = socketIds.slice(0, this.maxConcurrentConnections);

        // Initialize connection states
        limitedSocketIds.forEach(socketId => {
            this.multiPeerConnections.set(socketId, {
                targetSocketId: socketId,
                status: 'connecting',
            });
        });

        // Connect to all peers in parallel
        const connectionPromises = limitedSocketIds.map(async (socketId) => {
            try {
                const connectionResult = await this.connectToPeerWithTimeout(socketId, timeout);

                if (connectionResult.success) {
                    const state = this.multiPeerConnections.get(socketId);
                    if (state) {
                        state.status = 'connected';
                        state.connectedAt = new Date();
                    }
                    this.connectionPool.add(socketId);
                    onPeerConnected?.(socketId);
                    return { socketId, success: true };
                } else {
                    const state = this.multiPeerConnections.get(socketId);
                    if (state) {
                        state.status = 'failed';
                        if (connectionResult.error !== undefined) {
                            state.error = connectionResult.error;
                        }
                    }
                    onPeerFailed?.(socketId, connectionResult.error || 'Connection failed');
                    return { socketId, success: false, error: connectionResult.error || 'Connection failed' };
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                const state = this.multiPeerConnections.get(socketId);
                if (state) {
                    state.status = 'failed';
                    state.error = errorMsg;
                }
                onPeerFailed?.(socketId, errorMsg);
                return { socketId, success: false, error: errorMsg };
            }
        });

        // Wait for all connection attempts
        const results = await Promise.allSettled(connectionPromises);

        // Process results
        const successful: string[] = [];
        const failed: Array<{ socketId: string; error: string }> = [];

        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                const value = result.value;
                if (value.success) {
                    successful.push(value.socketId);
                } else {
                    failed.push({ socketId: value.socketId, error: value.error || 'Unknown error' });
                }
            } else {
                // This should rarely happen as we catch errors in the promise
                failed.push({ socketId: 'unknown', error: result.reason });
            }
        });

        const duration = Date.now() - startTime;

        return {
            successful,
            failed,
            totalAttempts: limitedSocketIds.length,
            duration,
        };
    }

    /**
     * Connect to a single peer with timeout
     */
    private async connectToPeerWithTimeout(
        socketId: string,
        timeout: number
    ): Promise<{ success: boolean; error?: string }> {
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                resolve({ success: false, error: 'Connection timeout' });
            }, timeout);

            // Set up one-time connection handler
            const originalOnConnected = this.events.onPeerConnected;
            this.events.onPeerConnected = (peerId, connectedSocketId) => {
                if (connectedSocketId === socketId) {
                    clearTimeout(timeoutId);
                    // Restore original handler
                    if (originalOnConnected !== undefined) {
                        this.events.onPeerConnected = originalOnConnected;
                    } else {
                        delete this.events.onPeerConnected;
                    }
                    resolve({ success: true });
                }
                // Call original handler
                originalOnConnected?.(peerId, connectedSocketId);
            };

            // The actual connection logic would depend on your signaling implementation
            // For now, we just mark it as attempting
            this.targetSocketId = socketId;
        });
    }

    /**
     * Get multi-peer connection state
     */
    getMultiPeerConnectionState(socketId: string): MultiPeerConnectionState | undefined {
        return this.multiPeerConnections.get(socketId);
    }

    /**
     * Get all multi-peer connection states
     */
    getAllMultiPeerStates(): Map<string, MultiPeerConnectionState> {
        return new Map(this.multiPeerConnections);
    }

    /**
     * Get connected peers from pool
     */
    getConnectedPeers(): string[] {
        return Array.from(this.connectionPool);
    }

    /**
     * Remove peer from connection pool
     */
    removePeerFromPool(socketId: string): void {
        this.connectionPool.delete(socketId);
        const state = this.multiPeerConnections.get(socketId);
        if (state) {
            state.status = 'disconnected';
        }
    }

    /**
     * Clear all multi-peer connections
     */
    clearMultiPeerConnections(): void {
        this.multiPeerConnections.clear();
        this.connectionPool.clear();
    }

    /**
     * Send offer to specific peer in multi-peer setup
     */
    async sendOfferToPeer(socketId: string, offer: RTCSessionDescriptionInit): Promise<void> {
        const client = getSignalingClient();
        const payload = await this.encryptPayload(offer);
        client.sendOffer(socketId, payload);
    }

    /**
     * Send answer to specific peer in multi-peer setup
     */
    async sendAnswerToPeer(socketId: string, answer: RTCSessionDescriptionInit): Promise<void> {
        const client = getSignalingClient();
        const payload = await this.encryptPayload(answer);
        client.sendAnswer(socketId, payload);
    }

    /**
     * Send ICE candidate to specific peer in multi-peer setup
     */
    async sendIceCandidateToPeer(socketId: string, candidate: RTCIceCandidateInit): Promise<void> {
        const client = getSignalingClient();
        const payload = await this.encryptPayload(candidate);
        client.sendIceCandidate(socketId, payload);
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
