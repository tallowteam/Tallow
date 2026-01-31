'use client';

/**
 * Relay Client
 *
 * Manages WebSocket connections to relay nodes for onion routing.
 * Handles circuit establishment, data forwarding, and connection pooling.
 *
 * Protocol:
 * CLIENT -> ENTRY: Establish PQC session, send onion packet
 * ENTRY -> MIDDLE: Peel one layer, forward
 * MIDDLE -> EXIT: Peel one layer, forward
 * EXIT -> DESTINATION: Final decryption, deliver to peer
 */

import { pqCrypto } from '../crypto/pqc-crypto';
import { RelayNodeInfo } from './relay-directory';
import secureLog from '../utils/secure-logger';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';

// ============================================================================
// Constants
// ============================================================================

const RELAY_PROTOCOL_VERSION = 1;
const CONNECTION_TIMEOUT_MS = 10000;
const MESSAGE_TIMEOUT_MS = 30000;
const MAX_PAYLOAD_SIZE = 64 * 1024; // 64KB max per message
const HEARTBEAT_INTERVAL_MS = 30000;

// Message types for relay protocol
const MSG_TYPE = {
    // Handshake
    HELLO: 0x01,
    HELLO_RESPONSE: 0x02,
    // Circuit operations
    CREATE_CIRCUIT: 0x10,
    CIRCUIT_CREATED: 0x11,
    EXTEND_CIRCUIT: 0x12,
    CIRCUIT_EXTENDED: 0x13,
    DESTROY_CIRCUIT: 0x14,
    // Data transfer
    RELAY_DATA: 0x20,
    RELAY_ACK: 0x21,
    // Control
    HEARTBEAT: 0x30,
    HEARTBEAT_ACK: 0x31,
    ERROR: 0xFF,
} as const;

// ============================================================================
// Types
// ============================================================================

export interface RelayConnection {
    /** Relay node info */
    relay: RelayNodeInfo;
    /** WebSocket connection */
    socket: WebSocket;
    /** Connection state */
    state: 'connecting' | 'handshaking' | 'ready' | 'closed' | 'error';
    /** Shared secret with this relay */
    sharedSecret: Uint8Array | null;
    /** Session encryption key */
    sessionKey: Uint8Array | null;
    /** Pending message handlers */
    pendingRequests: Map<number, {
        resolve: (data: Uint8Array) => void;
        reject: (error: Error) => void;
        timeout: ReturnType<typeof setTimeout>;
    }>;
    /** Next request ID */
    nextRequestId: number;
    /** Heartbeat timer */
    heartbeatTimer: ReturnType<typeof setInterval> | null;
    /** Last activity timestamp */
    lastActivity: number;
}

export interface CircuitHop {
    /** Relay node */
    relay: RelayNodeInfo;
    /** Shared secret for this hop */
    sharedSecret: Uint8Array;
    /** Layer encryption key */
    layerKey: Uint8Array;
    /** Layer MAC key */
    macKey: Uint8Array;
}

export interface OnionCircuit {
    /** Unique circuit ID */
    id: string;
    /** Circuit hops */
    hops: CircuitHop[];
    /** Entry relay connection */
    connection: RelayConnection;
    /** Circuit state */
    state: 'building' | 'ready' | 'closed' | 'error';
    /** Creation timestamp */
    createdAt: number;
    /** Destination peer ID */
    destination: string | null;
}

export interface RelayMessage {
    /** Message type */
    type: number;
    /** Request ID for correlation */
    requestId: number;
    /** Circuit ID (if applicable) */
    circuitId?: string | undefined;
    /** Message payload */
    payload: Uint8Array;
}

// ============================================================================
// Relay Client
// ============================================================================

export class RelayClient {
    private static instance: RelayClient;
    private connections: Map<string, RelayConnection> = new Map();
    private circuits: Map<string, OnionCircuit> = new Map();
    private ownKeyPair = pqCrypto.generateHybridKeypair();

    private constructor() {}

    static getInstance(): RelayClient {
        if (!RelayClient.instance) {
            RelayClient.instance = new RelayClient();
        }
        return RelayClient.instance;
    }

    // =========================================================================
    // Connection Management
    // =========================================================================

    /**
     * Connect to a relay node
     */
    async connect(relay: RelayNodeInfo): Promise<RelayConnection> {
        // Check if already connected
        const existing = this.connections.get(relay.id);
        if (existing && existing.state === 'ready') {
            return existing;
        }

        secureLog.log(`[RelayClient] Connecting to relay: ${relay.id}`);

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, CONNECTION_TIMEOUT_MS);

            try {
                const socket = new WebSocket(relay.endpoint);
                socket.binaryType = 'arraybuffer';

                const connection: RelayConnection = {
                    relay,
                    socket,
                    state: 'connecting',
                    sharedSecret: null,
                    sessionKey: null,
                    pendingRequests: new Map(),
                    nextRequestId: 1,
                    heartbeatTimer: null,
                    lastActivity: Date.now(),
                };

                socket.onopen = async () => {
                    clearTimeout(timeout);
                    connection.state = 'handshaking';

                    try {
                        // Perform PQC handshake
                        await this.performHandshake(connection);
                        connection.state = 'ready';

                        // Start heartbeat
                        this.startHeartbeat(connection);

                        this.connections.set(relay.id, connection);
                        secureLog.log(`[RelayClient] Connected to relay: ${relay.id}`);
                        resolve(connection);
                    } catch (error) {
                        connection.state = 'error';
                        socket.close();
                        reject(error);
                    }
                };

                socket.onmessage = (event) => {
                    this.handleMessage(connection, new Uint8Array(event.data as ArrayBuffer));
                };

                socket.onerror = (error) => {
                    clearTimeout(timeout);
                    connection.state = 'error';
                    secureLog.error(`[RelayClient] Connection error: ${relay.id}`, error);
                    reject(new Error('WebSocket error'));
                };

                socket.onclose = () => {
                    this.handleDisconnect(connection);
                };
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    /**
     * Perform PQC handshake with relay
     */
    private async performHandshake(connection: RelayConnection): Promise<void> {
        const keyPair = await this.ownKeyPair;
        const publicKey = pqCrypto.getPublicKey(keyPair);

        // Send HELLO with our public key
        const helloPayload = new Uint8Array([
            RELAY_PROTOCOL_VERSION,
            ...pqCrypto.serializePublicKey(publicKey),
        ]);

        const response = await this.sendRequest(connection, MSG_TYPE.HELLO, helloPayload);

        // Parse response: version + encrypted shared secret info
        if (response[0] !== RELAY_PROTOCOL_VERSION) {
            throw new Error('Protocol version mismatch');
        }

        // Relay responds with their encapsulated ciphertext
        const ciphertextBytes = response.slice(1);
        const ciphertext = pqCrypto.deserializeCiphertext(ciphertextBytes);

        // Decapsulate to get shared secret
        const sharedSecret = await pqCrypto.decapsulate(ciphertext, keyPair);

        // Derive session keys using HKDF
        const sessionInfo = new TextEncoder().encode('tallow-relay-session-v1');
        const keyMaterial = hkdf(sha256, sharedSecret, undefined, sessionInfo, 64);

        connection.sharedSecret = sharedSecret;
        connection.sessionKey = keyMaterial.slice(0, 32);

        // Securely wipe intermediate values
        sharedSecret.fill(0);
    }

    /**
     * Start heartbeat for connection
     */
    private startHeartbeat(connection: RelayConnection): void {
        if (connection.heartbeatTimer) {
            clearInterval(connection.heartbeatTimer);
        }

        connection.heartbeatTimer = setInterval(async () => {
            try {
                await this.sendRequest(connection, MSG_TYPE.HEARTBEAT, new Uint8Array(0), 5000);
                connection.lastActivity = Date.now();
            } catch {
                secureLog.warn(`[RelayClient] Heartbeat failed for ${connection.relay.id}`);
            }
        }, HEARTBEAT_INTERVAL_MS);
    }

    /**
     * Handle disconnection
     */
    private handleDisconnect(connection: RelayConnection): void {
        connection.state = 'closed';

        // Clear heartbeat
        if (connection.heartbeatTimer) {
            clearInterval(connection.heartbeatTimer);
        }

        // Reject pending requests
        for (const [, pending] of connection.pendingRequests) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Connection closed'));
        }
        connection.pendingRequests.clear();

        // Remove from connections
        this.connections.delete(connection.relay.id);

        // Mark affected circuits as closed
        for (const [circuitId, circuit] of this.circuits) {
            if (circuit.connection === connection) {
                circuit.state = 'closed';
                this.circuits.delete(circuitId);
            }
        }

        secureLog.log(`[RelayClient] Disconnected from relay: ${connection.relay.id}`);
    }

    /**
     * Disconnect from a relay
     */
    disconnect(relayId: string): void {
        const connection = this.connections.get(relayId);
        if (connection) {
            connection.socket.close();
            this.handleDisconnect(connection);
        }
    }

    // =========================================================================
    // Message Handling
    // =========================================================================

    /**
     * Send a request and wait for response
     */
    private async sendRequest(
        connection: RelayConnection,
        type: number,
        payload: Uint8Array,
        timeout: number = MESSAGE_TIMEOUT_MS
    ): Promise<Uint8Array> {
        const requestId = connection.nextRequestId++;

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                connection.pendingRequests.delete(requestId);
                reject(new Error('Request timeout'));
            }, timeout);

            connection.pendingRequests.set(requestId, {
                resolve,
                reject,
                timeout: timeoutId,
            });

            // Build and send message
            const message = this.buildMessage(type, requestId, payload);

            // Encrypt if we have a session key
            const toSend = connection.sessionKey
                ? this.encryptMessage(message, connection.sessionKey)
                : message;

            connection.socket.send(toSend);
        });
    }

    /**
     * Build a relay message
     */
    private buildMessage(
        type: number,
        requestId: number,
        payload: Uint8Array,
        circuitId?: string
    ): Uint8Array {
        // Format: type(1) + requestId(4) + circuitIdLen(1) + circuitId(n) + payloadLen(4) + payload
        const circuitIdBytes = circuitId ? new TextEncoder().encode(circuitId) : new Uint8Array(0);
        const totalSize = 1 + 4 + 1 + circuitIdBytes.length + 4 + payload.length;

        const message = new Uint8Array(totalSize);
        const view = new DataView(message.buffer);

        let offset = 0;
        message[offset++] = type;

        view.setUint32(offset, requestId, false);
        offset += 4;

        message[offset++] = circuitIdBytes.length;
        message.set(circuitIdBytes, offset);
        offset += circuitIdBytes.length;

        view.setUint32(offset, payload.length, false);
        offset += 4;

        message.set(payload, offset);

        return message;
    }

    /**
     * Parse a relay message
     */
    private parseMessage(data: Uint8Array): RelayMessage {
        const view = new DataView(data.buffer, data.byteOffset);

        let offset = 0;
        const type = data[offset++]!;

        const requestId = view.getUint32(offset, false);
        offset += 4;

        const circuitIdLen = data[offset++]!;
        const circuitId = circuitIdLen > 0
            ? new TextDecoder().decode(data.slice(offset, offset + circuitIdLen))
            : undefined;
        offset += circuitIdLen;

        const payloadLen = view.getUint32(offset, false);
        offset += 4;

        const payload = data.slice(offset, offset + payloadLen);

        return { type, requestId, circuitId, payload };
    }

    /**
     * Encrypt message with session key
     */
    private encryptMessage(data: Uint8Array, key: Uint8Array): Uint8Array {
        // Use simple XOR for now (in production, use AES-GCM)
        // The actual encryption happens at each onion layer
        const nonce = pqCrypto.randomBytes(12);
        const encrypted = new Uint8Array(nonce.length + data.length);
        encrypted.set(nonce, 0);

        for (let i = 0; i < data.length; i++) {
            encrypted[nonce.length + i] = data[i]! ^ key[i % key.length]! ^ nonce[i % nonce.length]!;
        }

        return encrypted;
    }

    /**
     * Decrypt message with session key
     */
    private decryptMessage(data: Uint8Array, key: Uint8Array): Uint8Array {
        const nonce = data.slice(0, 12);
        const ciphertext = data.slice(12);
        const decrypted = new Uint8Array(ciphertext.length);

        for (let i = 0; i < ciphertext.length; i++) {
            decrypted[i] = ciphertext[i]! ^ key[i % key.length]! ^ nonce[i % nonce.length]!;
        }

        return decrypted;
    }

    /**
     * Handle incoming message
     */
    private handleMessage(connection: RelayConnection, data: Uint8Array): void {
        connection.lastActivity = Date.now();

        // Decrypt if we have a session key
        const decrypted = connection.sessionKey
            ? this.decryptMessage(data, connection.sessionKey)
            : data;

        const message = this.parseMessage(decrypted);

        // Handle response to pending request
        const pending = connection.pendingRequests.get(message.requestId);
        if (pending) {
            clearTimeout(pending.timeout);
            connection.pendingRequests.delete(message.requestId);

            if (message.type === MSG_TYPE.ERROR) {
                pending.reject(new Error(new TextDecoder().decode(message.payload)));
            } else {
                pending.resolve(message.payload);
            }
            return;
        }

        // Handle unsolicited messages
        switch (message.type) {
            case MSG_TYPE.HEARTBEAT:
                // Send ack
                this.sendHeartbeatAck(connection, message.requestId);
                break;

            case MSG_TYPE.RELAY_DATA:
                // Handle incoming relay data (from circuit)
                this.handleRelayData(connection, message);
                break;

            default:
                secureLog.warn(`[RelayClient] Unknown message type: ${message.type}`);
        }
    }

    /**
     * Send heartbeat acknowledgment
     */
    private sendHeartbeatAck(connection: RelayConnection, requestId: number): void {
        const message = this.buildMessage(MSG_TYPE.HEARTBEAT_ACK, requestId, new Uint8Array(0));
        const encrypted = connection.sessionKey
            ? this.encryptMessage(message, connection.sessionKey)
            : message;
        connection.socket.send(encrypted);
    }

    /**
     * Handle incoming relay data
     */
    private handleRelayData(_connection: RelayConnection, message: RelayMessage): void {
        if (!message.circuitId) {
            return;
        }

        const circuit = this.circuits.get(message.circuitId);
        if (!circuit) {
            return;
        }

        // Emit event for circuit data handler
        // In a full implementation, this would decrypt and forward to the application
        secureLog.log(`[RelayClient] Received data on circuit: ${message.circuitId}`);
    }

    // =========================================================================
    // Circuit Operations
    // =========================================================================

    /**
     * Build an onion circuit through multiple relays
     */
    async buildCircuit(
        path: RelayNodeInfo[],
        destination: string
    ): Promise<OnionCircuit> {
        if (path.length < 1) {
            throw new Error('Circuit path must have at least 1 hop');
        }

        const circuitId = this.generateCircuitId();
        secureLog.log(`[RelayClient] Building circuit ${circuitId} with ${path.length} hops`);

        // Connect to entry relay
        const entryConnection = await this.connect(path[0]!);

        const circuit: OnionCircuit = {
            id: circuitId,
            hops: [],
            connection: entryConnection,
            state: 'building',
            createdAt: Date.now(),
            destination,
        };

        try {
            // Create circuit at entry relay
            const entryHop = await this.createCircuitHop(
                entryConnection,
                circuitId,
                path[0]!
            );
            circuit.hops.push(entryHop);

            // Extend circuit through remaining relays
            for (let i = 1; i < path.length; i++) {
                const nextRelay = path[i]!;
                const hop = await this.extendCircuit(circuit, nextRelay);
                circuit.hops.push(hop);
            }

            circuit.state = 'ready';
            this.circuits.set(circuitId, circuit);

            secureLog.log(`[RelayClient] Circuit ${circuitId} established`);
            return circuit;
        } catch (error) {
            circuit.state = 'error';
            // Cleanup on failure
            await this.destroyCircuit(circuit).catch(() => {});
            throw error;
        }
    }

    /**
     * Create circuit hop with a relay
     */
    private async createCircuitHop(
        relayConnection: RelayConnection,
        circuitId: string,
        relay: RelayNodeInfo
    ): Promise<CircuitHop> {
        // Encapsulate shared secret to relay's public key
        const encapResult = await pqCrypto.encapsulate(relay.publicKey);

        // Build create request: ciphertext
        const payload = pqCrypto.serializeCiphertext(encapResult.ciphertext);

        const response = await this.sendRequest(
            relayConnection,
            MSG_TYPE.CREATE_CIRCUIT,
            this.buildMessage(MSG_TYPE.CREATE_CIRCUIT, 0, payload, circuitId)
        );

        // Parse response (confirmation + relay's parameters)
        if (response[0] !== 0x01) {
            throw new Error('Circuit creation failed');
        }

        // Derive layer keys
        const layerInfo = new TextEncoder().encode(`tallow-onion-layer-${circuitId}`);
        const keyMaterial = hkdf(sha256, encapResult.sharedSecret, undefined, layerInfo, 64);

        return {
            relay,
            sharedSecret: encapResult.sharedSecret,
            layerKey: keyMaterial.slice(0, 32),
            macKey: keyMaterial.slice(32, 64),
        };
    }

    /**
     * Extend circuit to next relay
     */
    private async extendCircuit(
        circuit: OnionCircuit,
        nextRelay: RelayNodeInfo
    ): Promise<CircuitHop> {
        // Encapsulate to next relay's public key
        const encapResult = await pqCrypto.encapsulate(nextRelay.publicKey);

        // Build extend request
        const extendPayload = new Uint8Array([
            ...new TextEncoder().encode(nextRelay.endpoint),
            0, // Null terminator
            ...pqCrypto.serializeCiphertext(encapResult.ciphertext),
        ]);

        // Wrap in onion layers (encrypt for each hop in reverse order)
        let wrappedPayload = extendPayload;
        for (let i = circuit.hops.length - 1; i >= 0; i--) {
            wrappedPayload = await this.wrapLayer(wrappedPayload, circuit.hops[i]!);
        }

        const response = await this.sendRequest(
            circuit.connection,
            MSG_TYPE.EXTEND_CIRCUIT,
            this.buildMessage(MSG_TYPE.EXTEND_CIRCUIT, 0, wrappedPayload, circuit.id)
        );

        // Unwrap response through each layer
        let unwrappedResponse = response;
        for (const hop of circuit.hops) {
            unwrappedResponse = await this.unwrapLayer(unwrappedResponse, hop);
        }

        if (unwrappedResponse[0] !== 0x01) {
            throw new Error('Circuit extension failed');
        }

        // Derive layer keys
        const layerInfo = new TextEncoder().encode(`tallow-onion-layer-${circuit.id}-${circuit.hops.length}`);
        const keyMaterial = hkdf(sha256, encapResult.sharedSecret, undefined, layerInfo, 64);

        return {
            relay: nextRelay,
            sharedSecret: encapResult.sharedSecret,
            layerKey: keyMaterial.slice(0, 32),
            macKey: keyMaterial.slice(32, 64),
        };
    }

    /**
     * Wrap data in onion layer encryption
     */
    private async wrapLayer(data: Uint8Array, hop: CircuitHop): Promise<Uint8Array> {
        const encrypted = await pqCrypto.encrypt(data, hop.layerKey);

        // Format: nonce(12) + ciphertext
        const wrapped = new Uint8Array(encrypted.nonce.length + encrypted.ciphertext.length);
        wrapped.set(encrypted.nonce, 0);
        wrapped.set(encrypted.ciphertext, encrypted.nonce.length);

        return wrapped;
    }

    /**
     * Unwrap one onion layer
     */
    private async unwrapLayer(data: Uint8Array, hop: CircuitHop): Promise<Uint8Array> {
        const nonce = data.slice(0, 12);
        const ciphertext = data.slice(12);

        return pqCrypto.decrypt({ ciphertext, nonce }, hop.layerKey);
    }

    /**
     * Send data through a circuit
     */
    async sendThroughCircuit(circuit: OnionCircuit, data: Uint8Array): Promise<void> {
        if (circuit.state !== 'ready') {
            throw new Error('Circuit not ready');
        }

        if (data.length > MAX_PAYLOAD_SIZE) {
            throw new Error(`Payload too large: ${data.length} > ${MAX_PAYLOAD_SIZE}`);
        }

        // Wrap data in onion layers (innermost first)
        let wrappedData = data;
        for (let i = circuit.hops.length - 1; i >= 0; i--) {
            wrappedData = await this.wrapLayer(wrappedData, circuit.hops[i]!);
        }

        // Send through entry connection
        const message = this.buildMessage(MSG_TYPE.RELAY_DATA, 0, wrappedData, circuit.id);
        const encrypted = circuit.connection.sessionKey
            ? this.encryptMessage(message, circuit.connection.sessionKey)
            : message;

        circuit.connection.socket.send(encrypted);
    }

    /**
     * Destroy a circuit
     */
    async destroyCircuit(circuit: OnionCircuit): Promise<void> {
        if (circuit.state === 'closed') {
            return;
        }

        try {
            // Send destroy message
            const message = this.buildMessage(
                MSG_TYPE.DESTROY_CIRCUIT,
                0,
                new Uint8Array(0),
                circuit.id
            );

            if (circuit.connection.state === 'ready') {
                const encrypted = circuit.connection.sessionKey
                    ? this.encryptMessage(message, circuit.connection.sessionKey)
                    : message;
                circuit.connection.socket.send(encrypted);
            }
        } catch (error) {
            secureLog.warn(`[RelayClient] Error destroying circuit: ${error}`);
        }

        // Securely wipe keys
        for (const hop of circuit.hops) {
            hop.sharedSecret.fill(0);
            hop.layerKey.fill(0);
            hop.macKey.fill(0);
        }

        circuit.state = 'closed';
        this.circuits.delete(circuit.id);

        secureLog.log(`[RelayClient] Circuit ${circuit.id} destroyed`);
    }

    /**
     * Generate unique circuit ID
     */
    private generateCircuitId(): string {
        const bytes = pqCrypto.randomBytes(16);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // =========================================================================
    // Utility Methods
    // =========================================================================

    /**
     * Get active circuit count
     */
    get circuitCount(): number {
        return this.circuits.size;
    }

    /**
     * Get active connection count
     */
    get connectionCount(): number {
        return this.connections.size;
    }

    /**
     * Get circuit by ID
     */
    getCircuit(circuitId: string): OnionCircuit | null {
        return this.circuits.get(circuitId) ?? null;
    }

    /**
     * Cleanup all resources
     */
    async cleanup(): Promise<void> {
        // Destroy all circuits
        for (const circuit of this.circuits.values()) {
            await this.destroyCircuit(circuit).catch(() => {});
        }

        // Close all connections
        for (const connection of this.connections.values()) {
            connection.socket.close();
        }

        this.connections.clear();
        this.circuits.clear();
    }
}

// Export singleton getter
export function getRelayClient(): RelayClient {
    return RelayClient.getInstance();
}

export default RelayClient;
