'use client';

/**
 * ============================================================================
 * CRITICAL WARNING: ONION ROUTING IS NOT FUNCTIONAL
 * ============================================================================
 *
 * Status: EXPERIMENTAL - NOT READY FOR PRODUCTION
 *
 * This module contains the framework for onion routing, but the relay network
 * infrastructure does not exist yet. The discoverRelays() function returns an
 * empty array, making this feature non-operational.
 *
 * DO NOT enable onion routing in production settings. Any attempt to use
 * onion routing will throw an error with a helpful message.
 *
 * What's missing:
 * - Decentralized relay directory server
 * - Relay node network infrastructure
 * - Relay signature verification
 * - Real connectivity and latency testing
 *
 * Original design intent:
 * Optional multi-hop relay routing for high-security transfers.
 * Each relay only knows the previous and next hop, not the full path.
 * This would be Tallow's advantage over Signal - true P2P with optional
 * anonymity enhancement when needed.
 *
 * ============================================================================
 */

import { pqCrypto, HybridPublicKey } from '../crypto/pqc-crypto';
import secureLog from '../utils/secure-logger';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';

// ============================================================================
// Constants
// ============================================================================

const ONION_LAYER_INFO = new TextEncoder().encode('tallow-onion-layer-v1');
// const MAX_HOPS = 3;  // Unused: for future relay hop limiting
// const RELAY_DISCOVERY_TIMEOUT_MS = 5000;  // Unused: for future relay discovery

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
}

// ============================================================================
// FEATURE STATUS: NOT FUNCTIONAL
// ============================================================================

/**
 * Error thrown when onion routing is attempted but not available
 */
export class OnionRoutingUnavailableError extends Error {
    constructor(message?: string) {
        super(message || 'Onion routing is not available. This feature is experimental and the relay network infrastructure does not exist yet. Please use direct P2P connections instead.');
        this.name = 'OnionRoutingUnavailableError';
    }
}

/**
 * Check if onion routing is available (currently always returns false)
 */
export function isOnionRoutingAvailable(): boolean {
    return false;
}

/**
 * Get the current feature status for UI display
 */
export function getOnionRoutingStatus(): {
    available: boolean;
    status: 'unavailable' | 'experimental' | 'beta' | 'stable';
    message: string;
} {
    return {
        available: false,
        status: 'experimental',
        message: 'Onion routing is experimental and not yet functional. The relay network infrastructure is under development.',
    };
}

// ============================================================================
// Relay Discovery (NOT FUNCTIONAL - Requires relay network infrastructure)
// ============================================================================

/**
 * Discover available relay nodes
 *
 * WARNING: This function always returns an empty array because the relay
 * network infrastructure does not exist yet. Any attempt to use onion
 * routing will fail.
 *
 * @throws OnionRoutingUnavailableError if throwOnEmpty is true
 */
export async function discoverRelays(options?: { throwOnEmpty?: boolean }): Promise<RelayNode[]> {
    // CRITICAL: Relay network does not exist
    // This function is a placeholder for future implementation

    secureLog.warn('[OnionRouting] FEATURE NOT AVAILABLE: Relay network infrastructure does not exist');
    secureLog.warn('[OnionRouting] discoverRelays() returns empty array - onion routing cannot be used');

    if (options?.throwOnEmpty) {
        throw new OnionRoutingUnavailableError(
            'No relay nodes available. The onion routing relay network is not yet implemented.'
        );
    }

    return [];
}

/**
 * Select relays for a circuit
 */
export function selectRelaysForCircuit(
    availableRelays: RelayNode[],
    hopCount: number,
    preferredRelays?: string[]
): RelayNode[] {
    if (availableRelays.length < hopCount) {
        throw new Error(`Not enough relays: need ${hopCount}, have ${availableRelays.length}`);
    }

    // Sort by trust score
    const sortedRelays = [...availableRelays]
        .filter(r => r.online)
        .sort((a, b) => b.trustScore - a.trustScore);

    // Prefer specified relays if available
    const selected: RelayNode[] = [];
    if (preferredRelays) {
        for (const id of preferredRelays) {
            const relay = sortedRelays.find(r => r.id === id);
            if (relay && selected.length < hopCount) {
                selected.push(relay);
            }
        }
    }

    // Fill remaining slots with random high-trust relays (crypto-safe random)
    const remaining = sortedRelays.filter(r => !selected.includes(r));
    while (selected.length < hopCount && remaining.length > 0) {
        const randBytes = new Uint8Array(4);
        crypto.getRandomValues(randBytes);
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

// ============================================================================
// Circuit Building
// ============================================================================

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

        // In production, send ciphertext to relay to establish session
        secureLog.log('[OnionRouting] Would establish session with relay');
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

// ============================================================================
// Onion Encryption
// ============================================================================

/**
 * Wrap payload in multiple encryption layers
 * Each layer can only be decrypted by the corresponding relay
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
        if (!layerKey) {continue;}
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
 * This is what each relay does to forward the packet
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
// Circuit Management
// ============================================================================

/**
 * Manager for onion routing circuits
 *
 * WARNING: This class is non-functional because the relay network
 * infrastructure does not exist. All operations that require relays
 * will throw OnionRoutingUnavailableError.
 */
export class OnionRouter {
    private circuits: Map<string, OnionCircuit> = new Map();
    private config: OnionRoutingConfig;
    private relayCache: RelayNode[] = [];

    constructor(config: OnionRoutingConfig) {
        this.config = config;
    }

    /**
     * Check if onion routing is enabled in config
     * NOTE: Even if enabled, it will not work without relay infrastructure
     */
    isEnabled(): boolean {
        return this.config.enabled;
    }

    /**
     * Check if onion routing is actually available (functional)
     * Currently always returns false
     */
    isAvailable(): boolean {
        return isOnionRoutingAvailable();
    }

    /**
     * Update configuration
     * WARNING: Enabling onion routing will not make it functional
     */
    setConfig(config: Partial<OnionRoutingConfig>): void {
        if (config.enabled === true) {
            secureLog.warn('[OnionRouter] WARNING: Enabling onion routing, but relay network is not available');
            secureLog.warn('[OnionRouter] This feature is EXPERIMENTAL and will not work');
        }
        this.config = { ...this.config, ...config };
    }

    /**
     * Refresh relay list
     * WARNING: Always returns empty list - relay network does not exist
     */
    async refreshRelays(): Promise<void> {
        this.relayCache = await discoverRelays();
        if (this.relayCache.length === 0) {
            secureLog.warn('[OnionRouter] No relays found - onion routing unavailable');
        }
    }

    /**
     * Create a new circuit to a destination
     *
     * @throws OnionRoutingUnavailableError because relay network does not exist
     */
    async createCircuit(destination: string): Promise<OnionCircuit | null> {
        if (!this.config.enabled) {
            return null;
        }

        // CRITICAL: Always fail because no relays are available
        if (this.relayCache.length === 0) {
            throw new OnionRoutingUnavailableError(
                'Cannot create onion circuit: No relay nodes available. ' +
                'The onion routing feature is experimental and the relay network infrastructure does not exist yet. ' +
                'Please disable onion routing and use direct P2P connections instead.'
            );
        }

        if (this.relayCache.length < this.config.hopCount) {
            throw new OnionRoutingUnavailableError(
                `Insufficient relay nodes: need ${this.config.hopCount}, have ${this.relayCache.length}. ` +
                'The onion routing relay network is not yet implemented.'
            );
        }

        const relays = selectRelaysForCircuit(
            this.relayCache,
            this.config.hopCount,
            this.config.preferredRelays
        );

        const circuit = await buildCircuit(relays, destination);
        this.circuits.set(circuit.id, circuit);

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

        return wrapInOnionLayers(payload, circuit, destination);
    }

    /**
     * Close a circuit
     */
    closeCircuit(circuitId: string): void {
        const circuit = this.circuits.get(circuitId);
        if (circuit) {
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
        }
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
        if (!circuit) {return null;}

        return {
            id: circuit.id,
            hopCount: circuit.path.length,
            age: Date.now() - circuit.createdAt,
            established: circuit.established,
        };
    }
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default configuration
 *
 * IMPORTANT: enabled is false by default and should remain false
 * until the relay network infrastructure is implemented.
 */
export const defaultOnionConfig: OnionRoutingConfig = {
    enabled: false, // MUST remain false - relay network does not exist
    hopCount: 3,
    randomPath: true,
};

/**
 * Attempt to enable onion routing
 *
 * @throws OnionRoutingUnavailableError always, because the feature is not available
 */
export function enableOnionRouting(): never {
    throw new OnionRoutingUnavailableError(
        'Cannot enable onion routing: This feature is experimental and not yet functional. ' +
        'The relay network infrastructure required for onion routing has not been implemented. ' +
        'Please use direct P2P connections for file transfers.'
    );
}

// ============================================================================
// Export
// ============================================================================

export default OnionRouter;
