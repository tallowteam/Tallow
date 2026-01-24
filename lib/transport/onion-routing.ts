'use client';

/**
 * Onion Routing
 * 
 * Optional multi-hop relay routing for high-security transfers.
 * Each relay only knows the previous and next hop, not the full path.
 * 
 * This is Tallow's advantage over Signal - true P2P with optional
 * anonymity enhancement when needed.
 * 
 * WARNING: This is experimental and requires a network of relay nodes.
 */

import { pqCrypto, HybridPublicKey, EncryptedData } from '../crypto/pqc-crypto';
import secureLog from '../utils/secure-logger';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';

// ============================================================================
// Constants
// ============================================================================

const ONION_LAYER_INFO = new TextEncoder().encode('tallow-onion-layer-v1');
const MAX_HOPS = 3;
const RELAY_DISCOVERY_TIMEOUT_MS = 5000;

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
// Relay Discovery (Simulated - would need real relay network)
// ============================================================================

/**
 * Discover available relay nodes
 * In production, this would query a relay directory server
 */
export async function discoverRelays(): Promise<RelayNode[]> {
    // Simulated relay discovery
    // In production, this would:
    // 1. Query decentralized relay directory
    // 2. Verify relay signatures
    // 3. Test connectivity and latency

    secureLog.log('[OnionRouting] Relay discovery not implemented - returning empty list');
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
        const randomIndex = (randBytes[0] | (randBytes[1] << 8) | (randBytes[2] << 16) | ((randBytes[3] & 0x7f) << 24)) % remaining.length;
        selected.push(remaining.splice(randomIndex, 1)[0]);
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
    finalDestination: string
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
 */
export class OnionRouter {
    private circuits: Map<string, OnionCircuit> = new Map();
    private config: OnionRoutingConfig;
    private relayCache: RelayNode[] = [];

    constructor(config: OnionRoutingConfig) {
        this.config = config;
    }

    /**
     * Check if onion routing is enabled
     */
    isEnabled(): boolean {
        return this.config.enabled;
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<OnionRoutingConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Refresh relay list
     */
    async refreshRelays(): Promise<void> {
        this.relayCache = await discoverRelays();
    }

    /**
     * Create a new circuit to a destination
     */
    async createCircuit(destination: string): Promise<OnionCircuit | null> {
        if (!this.config.enabled) {
            return null;
        }

        if (this.relayCache.length < this.config.hopCount) {
            secureLog.warn('[OnionRouter] Not enough relays available');
            return null;
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
                        key[i] = random[i];
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
        if (!circuit) return null;

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

export const defaultOnionConfig: OnionRoutingConfig = {
    enabled: false, // Disabled by default - user must opt-in
    hopCount: 3,
    randomPath: true,
};

// ============================================================================
// Export
// ============================================================================

export default OnionRouter;
