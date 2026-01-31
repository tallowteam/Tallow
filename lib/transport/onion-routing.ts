'use client';

/**
 * Onion Routing Implementation
 *
 * Provides multi-hop encrypted routing for anonymous P2P transfers.
 * Each hop uses separate ML-KEM-768 + X25519 key exchange with AES-256-GCM encryption.
 *
 * Architecture:
 * - Entry relays: Accept client connections (first hop)
 * - Middle relays: Forward encrypted data (intermediate hops)
 * - Exit relays: Connect to destination peers (final hop)
 *
 * Protocol:
 * CLIENT -> ENTRY: Establish PQC session, send onion packet
 * ENTRY -> MIDDLE: Peel one layer, forward
 * MIDDLE -> EXIT: Peel one layer, forward
 * EXIT -> DESTINATION: Final decryption, deliver to peer
 */

import { pqCrypto, HybridPublicKey } from '../crypto/pqc-crypto';
import {
    getRelayDirectory,
    getRelayClient,
    RelayNodeInfo,
    OnionCircuit as RelayOnionCircuit,
} from '../relay';
import secureLog from '../utils/secure-logger';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';

// ============================================================================
// Constants
// ============================================================================

const ONION_LAYER_INFO = new TextEncoder().encode('tallow-onion-layer-v1');
const MAX_HOPS = 3;
const MIN_HOPS = 1;
const DEFAULT_HOPS = 3;
const CIRCUIT_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PAYLOAD_SIZE = 64 * 1024; // 64KB

// ============================================================================
// Types
// ============================================================================

export interface RelayNode {
    /** Unique relay ID */
    id: string;
    /** Relay's public key for encryption */
    publicKey: HybridPublicKey;
    /** Relay endpoint (WebSocket URL) */
    endpoint: string;
    /** Relay reputation/trust score */
    trustScore: number;
    /** Whether relay is currently reachable */
    online: boolean;
    /** Latency in ms */
    latency?: number;
}

export interface OnionLayer {
    /** Next hop address (relay endpoint or final destination) */
    nextHop: string;
    /** Session key for this layer */
    sessionKey: Uint8Array;
    /** Nonce for this layer */
    nonce: Uint8Array;
}

export interface OnionPacket {
    /** Encrypted layers (peeled by each relay) */
    encryptedPayload: Uint8Array;
    /** Total size for routing */
    totalSize: number;
    /** Circuit ID for this path */
    circuitId: string;
}

export interface OnionCircuit {
    /** Unique circuit identifier */
    id: string;
    /** Ordered list of relay nodes in the path */
    path: RelayNode[];
    /** Encryption keys for each layer (in order) */
    layerKeys: Uint8Array[];
    /** Creation timestamp */
    createdAt: number;
    /** Whether circuit is established */
    established: boolean;
    /** Internal circuit reference */
    _internal?: RelayOnionCircuit;
}

export interface OnionRoutingConfig {
    /** Whether onion routing is enabled */
    enabled: boolean;
    /** Number of hops (1-3) */
    hopCount: number;
    /** Preferred relay nodes (if any) */
    preferredRelays?: string[];
    /** Whether to use random path selection */
    randomPath: boolean;
    /** Preferred geographic regions for relay selection */
    preferredRegions?: string[];
    /** Maximum latency per hop in ms */
    maxLatencyPerHop?: number;
}

export interface OnionRoutingStatus {
    /** Whether onion routing is available */
    available: boolean;
    /** Feature status */
    status: 'unavailable' | 'initializing' | 'ready' | 'degraded';
    /** Status message */
    message: string;
    /** Number of available relays */
    relayCount: number;
    /** Number of active circuits */
    circuitCount: number;
}

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Error thrown when onion routing is unavailable
 */
export class OnionRoutingUnavailableError extends Error {
    constructor(message?: string) {
        super(message || 'Onion routing is not available. Insufficient relay nodes or network issues.');
        this.name = 'OnionRoutingUnavailableError';
    }
}

/**
 * Error thrown for circuit-related failures
 */
export class CircuitBuildError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CircuitBuildError';
    }
}

// ============================================================================
// Onion Router Class
// ============================================================================

/**
 * Main onion routing manager
 */
export class OnionRouter {
    private static instance: OnionRouter;
    private circuits: Map<string, OnionCircuit> = new Map();
    private config: OnionRoutingConfig;
    private relayCache: RelayNode[] = [];
    private isInitialized = false;
    private initPromise: Promise<void> | null = null;

    constructor(config?: Partial<OnionRoutingConfig>) {
        this.config = {
            enabled: false,
            hopCount: DEFAULT_HOPS,
            randomPath: true,
            ...config,
        };
    }

    static getInstance(config?: Partial<OnionRoutingConfig>): OnionRouter {
        if (!OnionRouter.instance) {
            OnionRouter.instance = new OnionRouter(config);
        }
        return OnionRouter.instance;
    }

    /**
     * Initialize the onion routing system
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this.doInitialize();
        await this.initPromise;
    }

    private async doInitialize(): Promise<void> {
        secureLog.log('[OnionRouter] Initializing onion routing system');

        try {
            // Initialize relay directory
            const directory = getRelayDirectory();
            await directory.initialize();

            // Refresh relay cache
            await this.refreshRelays();

            this.isInitialized = true;
            secureLog.log(`[OnionRouter] Initialized with ${this.relayCache.length} relays`);
        } catch (error) {
            secureLog.error('[OnionRouter] Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Check if onion routing is enabled
     */
    isEnabled(): boolean {
        return this.config.enabled;
    }

    /**
     * Check if onion routing is available (has enough relays)
     */
    isAvailable(): boolean {
        return this.isInitialized && this.relayCache.length >= this.config.hopCount;
    }

    /**
     * Get current status
     */
    getStatus(): OnionRoutingStatus {
        if (!this.isInitialized) {
            return {
                available: false,
                status: 'unavailable',
                message: 'Onion routing not initialized. Call initialize() first.',
                relayCount: 0,
                circuitCount: 0,
            };
        }

        const relayCount = this.relayCache.length;
        const circuitCount = this.circuits.size;

        if (relayCount === 0) {
            return {
                available: false,
                status: 'unavailable',
                message: 'No relay nodes available. Check network connectivity.',
                relayCount,
                circuitCount,
            };
        }

        if (relayCount < this.config.hopCount) {
            return {
                available: true,
                status: 'degraded',
                message: `Limited relay availability (${relayCount} relays). Path diversity may be reduced.`,
                relayCount,
                circuitCount,
            };
        }

        return {
            available: true,
            status: 'ready',
            message: `Onion routing ready with ${relayCount} relays.`,
            relayCount,
            circuitCount,
        };
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<OnionRoutingConfig>): void {
        this.config = { ...this.config, ...config };

        if (config.hopCount !== undefined) {
            this.config.hopCount = Math.max(MIN_HOPS, Math.min(MAX_HOPS, config.hopCount));
        }

        secureLog.log('[OnionRouter] Configuration updated:', this.config);
    }

    /**
     * Get current configuration
     */
    getConfig(): OnionRoutingConfig {
        return { ...this.config };
    }

    /**
     * Refresh relay list from directory
     */
    async refreshRelays(): Promise<void> {
        const directory = getRelayDirectory();

        if (!this.isInitialized) {
            await directory.initialize();
        }

        await directory.refreshDirectory();

        // Convert to internal RelayNode format
        const relays = directory.getRelays();
        this.relayCache = relays.map(r => this.convertRelayInfo(r));

        secureLog.log(`[OnionRouter] Refreshed relay cache: ${this.relayCache.length} relays`);
    }

    /**
     * Convert RelayNodeInfo to RelayNode
     */
    private convertRelayInfo(info: RelayNodeInfo): RelayNode {
        return {
            id: info.id,
            publicKey: info.publicKey,
            endpoint: info.endpoint,
            trustScore: info.trustScore,
            online: info.online,
            latency: info.latency,
        };
    }

    /**
     * Select relays for a circuit
     */
    selectRelaysForCircuit(
        availableRelays: RelayNode[],
        hopCount: number,
        preferredRelays?: string[]
    ): RelayNode[] {
        if (availableRelays.length < hopCount) {
            throw new OnionRoutingUnavailableError(
                `Not enough relays: need ${hopCount}, have ${availableRelays.length}`
            );
        }

        // Filter online relays
        const onlineRelays = availableRelays.filter(r => r.online);
        if (onlineRelays.length < hopCount) {
            throw new OnionRoutingUnavailableError(
                `Not enough online relays: need ${hopCount}, have ${onlineRelays.length}`
            );
        }

        // Sort by trust score
        const sortedRelays = [...onlineRelays].sort((a, b) => b.trustScore - a.trustScore);

        const selected: RelayNode[] = [];

        // Prefer specified relays if available
        if (preferredRelays && preferredRelays.length > 0) {
            for (const id of preferredRelays) {
                const relay = sortedRelays.find(r => r.id === id);
                if (relay && selected.length < hopCount) {
                    selected.push(relay);
                }
            }
        }

        // Fill remaining slots with random high-trust relays
        const remaining = sortedRelays.filter(r => !selected.includes(r));
        while (selected.length < hopCount && remaining.length > 0) {
            const randBytes = pqCrypto.randomBytes(4);
            const b0 = randBytes[0] ?? 0;
            const b1 = randBytes[1] ?? 0;
            const b2 = randBytes[2] ?? 0;
            const b3 = randBytes[3] ?? 0;
            const randomIndex = (b0 | (b1 << 8) | (b2 << 16) | ((b3 & 0x7f) << 24)) % remaining.length;
            const relay = remaining.splice(randomIndex, 1)[0];
            if (relay) {
                selected.push(relay);
            }
        }

        return selected;
    }

    /**
     * Create a new circuit to a destination
     */
    async createCircuit(destination: string): Promise<OnionCircuit | null> {
        if (!this.config.enabled) {
            secureLog.warn('[OnionRouter] Onion routing is disabled');
            return null;
        }

        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.relayCache.length < this.config.hopCount) {
            throw new OnionRoutingUnavailableError(
                `Insufficient relays: need ${this.config.hopCount}, have ${this.relayCache.length}`
            );
        }

        // Select relays for the circuit
        const relays = this.selectRelaysForCircuit(
            this.relayCache,
            this.config.hopCount,
            this.config.preferredRelays
        );

        secureLog.log(`[OnionRouter] Building circuit with ${relays.length} hops to ${destination}`);

        // Build the circuit using the relay client
        const directory = getRelayDirectory();
        const relayInfos = relays.map(r => directory.getRelay(r.id)).filter(Boolean) as RelayNodeInfo[];

        if (relayInfos.length < relays.length) {
            throw new CircuitBuildError('Some relays are no longer available');
        }

        const client = getRelayClient();
        const internalCircuit = await client.buildCircuit(relayInfos, destination);

        // Create our circuit wrapper
        const circuit: OnionCircuit = {
            id: internalCircuit.id,
            path: relays,
            layerKeys: internalCircuit.hops.map(h => h.layerKey),
            createdAt: Date.now(),
            established: internalCircuit.state === 'ready',
            _internal: internalCircuit,
        };

        this.circuits.set(circuit.id, circuit);

        // Schedule circuit cleanup
        setTimeout(() => {
            this.closeCircuit(circuit.id);
        }, CIRCUIT_LIFETIME_MS);

        secureLog.log(`[OnionRouter] Circuit ${circuit.id} established`);
        return circuit;
    }

    /**
     * Send data through a circuit
     */
    async sendThroughCircuit(
        circuitId: string,
        payload: Uint8Array,
        destination: string
    ): Promise<OnionPacket | null> {
        const circuit = this.circuits.get(circuitId);
        if (!circuit || !circuit.established) {
            return null;
        }

        if (payload.length > MAX_PAYLOAD_SIZE) {
            throw new Error(`Payload too large: ${payload.length} > ${MAX_PAYLOAD_SIZE}`);
        }

        // Use the relay client to send through the internal circuit
        if (circuit._internal) {
            const client = getRelayClient();
            await client.sendThroughCircuit(circuit._internal, payload);
        }

        // Also wrap in onion layers for verification
        const packet = await wrapInOnionLayers(payload, circuit, destination);
        return packet;
    }

    /**
     * Close a circuit
     */
    closeCircuit(circuitId: string): void {
        const circuit = this.circuits.get(circuitId);
        if (!circuit) {
            return;
        }

        // Destroy internal circuit
        if (circuit._internal) {
            const client = getRelayClient();
            client.destroyCircuit(circuit._internal).catch(() => {});
        }

        // Securely wipe layer keys
        for (const key of circuit.layerKeys) {
            try {
                const random = crypto.getRandomValues(new Uint8Array(key.length));
                for (let i = 0; i < key.length; i++) {
                    const randomValue = random[i];
                    if (randomValue !== undefined) {
                        key[i] = randomValue;
                    }
                }
                key.fill(0);
            } catch {
                key.fill(0);
            }
        }

        this.circuits.delete(circuitId);
        secureLog.log(`[OnionRouter] Circuit ${circuitId} closed`);
    }

    /**
     * Close all circuits
     */
    closeAllCircuits(): void {
        for (const circuitId of this.circuits.keys()) {
            this.closeCircuit(circuitId);
        }
    }

    /**
     * Get circuit info for debugging
     */
    getCircuitInfo(circuitId: string): {
        id: string;
        hopCount: number;
        age: number;
        established: boolean;
    } | null {
        const circuit = this.circuits.get(circuitId);
        if (!circuit) {
            return null;
        }

        return {
            id: circuit.id,
            hopCount: circuit.path.length,
            age: Date.now() - circuit.createdAt,
            established: circuit.established,
        };
    }

    /**
     * Get all active circuits
     */
    getActiveCircuits(): Array<{ id: string; hopCount: number; age: number }> {
        return Array.from(this.circuits.values()).map(c => ({
            id: c.id,
            hopCount: c.path.length,
            age: Date.now() - c.createdAt,
        }));
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        this.closeAllCircuits();

        const client = getRelayClient();
        await client.cleanup();

        const directory = getRelayDirectory();
        directory.cleanup();

        this.relayCache = [];
        this.isInitialized = false;
        this.initPromise = null;
    }
}

// ============================================================================
// Standalone Functions
// ============================================================================

/**
 * Check if onion routing is available
 */
export function isOnionRoutingAvailable(): boolean {
    try {
        const router = OnionRouter.getInstance();
        return router.isAvailable();
    } catch {
        return false;
    }
}

/**
 * Get the current onion routing status
 */
export function getOnionRoutingStatus(): OnionRoutingStatus {
    try {
        const router = OnionRouter.getInstance();
        return router.getStatus();
    } catch {
        return {
            available: false,
            status: 'unavailable',
            message: 'Onion routing system not initialized.',
            relayCount: 0,
            circuitCount: 0,
        };
    }
}

/**
 * Discover available relay nodes
 */
export async function discoverRelays(options?: { throwOnEmpty?: boolean }): Promise<RelayNode[]> {
    try {
        const router = OnionRouter.getInstance();
        await router.initialize();
        await router.refreshRelays();

        const status = router.getStatus();

        if (status.relayCount === 0 && options?.throwOnEmpty) {
            throw new OnionRoutingUnavailableError(
                'No relay nodes available. The relay network may be unreachable.'
            );
        }

        // Return converted relays from the router's cache
        const directory = getRelayDirectory();
        return directory.getRelays().map(r => ({
            id: r.id,
            publicKey: r.publicKey,
            endpoint: r.endpoint,
            trustScore: r.trustScore,
            online: r.online,
            latency: r.latency,
        }));
    } catch (error) {
        if (options?.throwOnEmpty) {
            throw error;
        }
        return [];
    }
}

/**
 * Select relays for a circuit (standalone function)
 */
export function selectRelaysForCircuit(
    availableRelays: RelayNode[],
    hopCount: number,
    preferredRelays?: string[]
): RelayNode[] {
    const router = OnionRouter.getInstance();
    return router.selectRelaysForCircuit(availableRelays, hopCount, preferredRelays);
}

/**
 * Build an onion circuit through multiple relays
 */
export async function buildCircuit(
    relays: RelayNode[],
    _finalDestination: string
): Promise<OnionCircuit> {
    const circuitId = generateCircuitId();
    const layerKeys: Uint8Array[] = [];

    // Establish keys with each relay
    for (const relay of relays) {
        // Encapsulate to relay's public key
        const result = await pqCrypto.encapsulate(relay.publicKey);

        // Derive layer key
        const layerKey = hkdf(sha256, result.sharedSecret, undefined, ONION_LAYER_INFO, 32);
        layerKeys.push(layerKey);
    }

    return {
        id: circuitId,
        path: relays,
        layerKeys,
        createdAt: Date.now(),
        established: true,
    };
}

/**
 * Generate a unique circuit ID
 */
function generateCircuitId(): string {
    const bytes = pqCrypto.randomBytes(16);
    return Array.from(bytes).map((b: number) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Wrap payload in multiple encryption layers
 */
export async function wrapInOnionLayers(
    payload: Uint8Array,
    circuit: OnionCircuit,
    finalDestination: string
): Promise<OnionPacket> {
    let encryptedPayload = payload;

    // Add destination as final layer
    const destinations = [...circuit.path.map(r => r.endpoint), finalDestination];

    // Wrap from inside out (final destination first)
    for (let i = circuit.layerKeys.length - 1; i >= 0; i--) {
        const layerKey = circuit.layerKeys[i];
        if (!layerKey) {
            continue;
        }
        const nextHop = destinations[i + 1];

        // Create layer header with next hop
        const header = new TextEncoder().encode(JSON.stringify({
            nextHop,
            payloadSize: encryptedPayload.length,
        }));

        // Combine header + payload
        const combined = new Uint8Array(4 + header.length + encryptedPayload.length);
        new DataView(combined.buffer).setUint32(0, header.length, false);
        combined.set(header, 4);
        combined.set(encryptedPayload, 4 + header.length);

        // Encrypt this layer
        const encrypted = await pqCrypto.encrypt(combined, layerKey);

        // Combine nonce + ciphertext for next layer
        encryptedPayload = new Uint8Array(encrypted.nonce.length + encrypted.ciphertext.length);
        encryptedPayload.set(encrypted.nonce, 0);
        encryptedPayload.set(encrypted.ciphertext, encrypted.nonce.length);
    }

    return {
        encryptedPayload,
        totalSize: encryptedPayload.length,
        circuitId: circuit.id,
    };
}

/**
 * Unwrap one layer of an onion packet
 */
export async function unwrapOnionLayer(
    packet: OnionPacket,
    layerKey: Uint8Array
): Promise<{
    nextHop: string;
    innerPayload: Uint8Array;
}> {
    // Extract nonce (first 12 bytes) and ciphertext
    const nonce = packet.encryptedPayload.slice(0, 12);
    const ciphertext = packet.encryptedPayload.slice(12);

    // Decrypt this layer
    const decrypted = await pqCrypto.decrypt({ ciphertext, nonce }, layerKey);

    // Parse header
    const headerLength = new DataView(decrypted.buffer, decrypted.byteOffset).getUint32(0, false);
    const header = new TextDecoder().decode(decrypted.slice(4, 4 + headerLength));
    const { nextHop, payloadSize } = JSON.parse(header);

    // Extract inner payload
    const innerPayload = decrypted.slice(4 + headerLength, 4 + headerLength + payloadSize);

    return { nextHop, innerPayload };
}

// ============================================================================
// Default Configuration
// ============================================================================

export const defaultOnionConfig: OnionRoutingConfig = {
    enabled: true, // Now enabled by default since we have relay infrastructure
    hopCount: DEFAULT_HOPS,
    randomPath: true,
};

/**
 * Enable onion routing
 */
export async function enableOnionRouting(config?: Partial<OnionRoutingConfig>): Promise<OnionRouter> {
    const router = OnionRouter.getInstance();
    await router.initialize();
    router.setConfig({ ...config, enabled: true });
    return router;
}

/**
 * Disable onion routing
 */
export function disableOnionRouting(): void {
    const router = OnionRouter.getInstance();
    router.setConfig({ enabled: false });
    router.closeAllCircuits();
}

// ============================================================================
// Export
// ============================================================================

export default OnionRouter;
