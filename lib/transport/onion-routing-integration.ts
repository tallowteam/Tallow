/**
 * Onion Routing Integration
 *
 * Provides integration between the onion routing system and TALLOW's
 * file transfer infrastructure. This module bridges the circuit-based
 * routing with the transfer manager for anonymous file transfers.
 */

import { EventEmitter } from 'events';
import {
    OnionRouter,
    OnionCircuit,
    enableOnionRouting,
    disableOnionRouting,
    getOnionRoutingStatus,
} from './onion-routing';
import { getRelayDirectory } from '../relay';
import { secureLog } from '../utils/secure-logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Onion routing modes
 */
export type OnionRoutingMode = 'disabled' | 'single-hop' | 'multi-hop' | 'tor';

/**
 * Extended relay node information for UI display
 */
export interface RelayNode {
    id: string;
    address: string;
    publicKey: string;
    region: string;
    latency: number;
    reliability: number;
    bandwidth: number;
    trustScore: number;
}

/**
 * Onion layer representation
 */
export interface OnionLayer {
    nodeId: string;
    encryptedData: ArrayBuffer;
    iv: Uint8Array;
    mac: Uint8Array;
}

/**
 * Extended configuration for the integration layer
 */
export interface OnionRoutingConfig {
    mode: OnionRoutingMode;
    numHops: number;
    preferredRegions: string[];
    minTrustScore: number;
    minBandwidth: number;
    maxLatency: number;
    relaySelectionStrategy: 'random' | 'optimal' | 'regional';
    torBridges: string[];
    enableTorBrowser: boolean;
}

/**
 * Routing statistics
 */
export interface OnionRoutingStats {
    totalTransfers: number;
    successfulTransfers: number;
    failedTransfers: number;
    averageLatency: number;
    currentHops: number;
    activeRelays: number;
    bytesTransferred: number;
    circuitsBuilt: number;
    circuitsActive: number;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_ONION_CONFIG: OnionRoutingConfig = {
    mode: 'disabled',
    numHops: 3,
    preferredRegions: [],
    minTrustScore: 0.7,
    minBandwidth: 10 * 1024 * 1024, // 10 MB/s
    maxLatency: 500, // 500ms
    relaySelectionStrategy: 'optimal',
    torBridges: [],
    enableTorBrowser: false,
};

/**
 * Feature status for UI display
 */
export const ONION_ROUTING_STATUS = {
    available: true, // Now available with relay infrastructure
    status: 'ready' as const,
    label: 'Ready',
    message: 'Onion routing is available. Enable it in privacy settings for anonymous transfers.',
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if onion routing is available
 */
export function isOnionRoutingAvailable(): boolean {
    const status = getOnionRoutingStatus();
    return status.available;
}

/**
 * Error for onion routing operations
 */
export class OnionRoutingNotImplementedError extends Error {
    constructor(operation: string) {
        super(`Onion routing operation "${operation}" failed: Check relay connectivity and configuration.`);
        this.name = 'OnionRoutingError';
    }
}

// ============================================================================
// Onion Routing Manager
// ============================================================================

/**
 * Onion Routing Manager
 * Central coordinator for onion routing functionality
 */
export class OnionRoutingManager extends EventEmitter {
    private config: OnionRoutingConfig;
    private relayNodes: Map<string, RelayNode>;
    private activePaths: Map<string, string[]>; // transferId -> [nodeIds]
    private stats: OnionRoutingStats;
    private isInitialized: boolean;
    private router: OnionRouter | null = null;
    private activeCircuits: Map<string, OnionCircuit> = new Map();

    constructor(config?: Partial<OnionRoutingConfig>) {
        super();
        this.config = { ...DEFAULT_ONION_CONFIG, ...config };
        this.relayNodes = new Map();
        this.activePaths = new Map();
        this.stats = {
            totalTransfers: 0,
            successfulTransfers: 0,
            failedTransfers: 0,
            averageLatency: 0,
            currentHops: 0,
            activeRelays: 0,
            bytesTransferred: 0,
            circuitsBuilt: 0,
            circuitsActive: 0,
        };
        this.isInitialized = false;
    }

    /**
     * Initialize onion routing system
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            secureLog.log('[OnionRoutingManager] Initializing onion routing');

            // Initialize the core router
            this.router = OnionRouter.getInstance();
            await this.router.initialize();

            // Fetch available relay nodes
            await this.fetchRelayNodes();

            // Initialize Tor if enabled
            if (this.config.enableTorBrowser) {
                await this.initializeTor();
            }

            this.isInitialized = true;
            this.emit('initialized');

            secureLog.log('[OnionRoutingManager] Initialization complete');
        } catch (error) {
            secureLog.error('[OnionRoutingManager] Initialization failed:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Fetch available relay nodes from the directory
     */
    private async fetchRelayNodes(): Promise<void> {
        try {
            const directory = getRelayDirectory();
            await directory.refreshDirectory();

            const relays = directory.getRelays();

            for (const relay of relays) {
                const uiRelay: RelayNode = {
                    id: relay.id,
                    address: relay.endpoint,
                    publicKey: relay.publicKeyBase64,
                    region: relay.region,
                    latency: relay.latency,
                    reliability: relay.online ? 0.95 : 0,
                    bandwidth: relay.bandwidth,
                    trustScore: relay.trustScore,
                };
                this.relayNodes.set(relay.id, uiRelay);
            }

            this.stats.activeRelays = this.relayNodes.size;
            this.emit('relaysUpdated', Array.from(this.relayNodes.values()));

            secureLog.log(`[OnionRoutingManager] Loaded ${relays.length} relay nodes`);
        } catch (error) {
            secureLog.error('[OnionRoutingManager] Failed to fetch relays:', error);
            throw error;
        }
    }

    /**
     * Initialize Tor connection (placeholder for future Tor integration)
     */
    private async initializeTor(): Promise<void> {
        // TODO: Implement Tor initialization
        // Check if Tor Browser is available
        // Connect to Tor network
        // Configure bridges if needed
        secureLog.log('[OnionRoutingManager] Tor integration not yet implemented');
    }

    /**
     * Select optimal relay path based on configuration
     */
    async selectRelayPath(numHops: number = this.config.numHops): Promise<RelayNode[]> {
        const availableNodes = Array.from(this.relayNodes.values()).filter(
            (node) =>
                node.trustScore >= this.config.minTrustScore &&
                node.bandwidth >= this.config.minBandwidth &&
                node.latency <= this.config.maxLatency
        );

        if (availableNodes.length < numHops) {
            throw new Error(
                `Insufficient relay nodes: need ${numHops}, have ${availableNodes.length}`
            );
        }

        const path: RelayNode[] = [];

        switch (this.config.relaySelectionStrategy) {
            case 'random': {
                // Cryptographically random selection
                const shuffled = [...availableNodes];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const randBytes = new Uint8Array(4);
                    crypto.getRandomValues(randBytes);
                    const j = (randBytes[0]! | (randBytes[1]! << 8)) % (i + 1);
                    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
                }
                path.push(...shuffled.slice(0, numHops));
                break;
            }

            case 'optimal': {
                // Sort by composite score (reliability * trustScore / latency)
                const scored = availableNodes
                    .map((node) => ({
                        node,
                        score: (node.reliability * node.trustScore * 1000) / (node.latency + 1),
                    }))
                    .sort((a, b) => b.score - a.score);

                path.push(...scored.slice(0, numHops).map((s) => s.node));
                break;
            }

            case 'regional': {
                // Prefer nodes in preferred regions
                const regional = availableNodes.filter((node) =>
                    this.config.preferredRegions.includes(node.region)
                );
                const nonRegional = availableNodes.filter(
                    (node) => !this.config.preferredRegions.includes(node.region)
                );

                const combined = [...regional, ...nonRegional];
                path.push(...combined.slice(0, numHops));
                break;
            }
        }

        this.emit('pathSelected', path);
        return path;
    }

    /**
     * Create onion layers for data encryption
     */
    async createOnionLayers(
        data: ArrayBuffer,
        path: RelayNode[]
    ): Promise<OnionLayer[]> {
        const layers: OnionLayer[] = [];

        // Start with the innermost layer (destination)
        let encryptedData = data;

        // Wrap in layers from destination to entry node
        for (let i = path.length - 1; i >= 0; i--) {
            const node = path[i];
            if (!node) {
                continue;
            }

            // Generate IV for this layer
            const iv = crypto.getRandomValues(new Uint8Array(12));

            // TODO: Use actual PQC encryption
            // For now, create layer structure
            const layer: OnionLayer = {
                nodeId: node.id,
                encryptedData,
                iv,
                mac: new Uint8Array(32), // Placeholder for MAC
            };

            layers.unshift(layer);

            // Simulate wrapping in next layer
            encryptedData = new ArrayBuffer(encryptedData.byteLength + 64);
        }

        return layers;
    }

    /**
     * Peel onion layer (decrypt)
     */
    async peelOnionLayer(layer: OnionLayer): Promise<{
        data: ArrayBuffer;
        nextNodeId: string | null;
    }> {
        // TODO: Implement actual decryption using the circuit's layer keys
        // For now, simulate decryption
        return {
            data: layer.encryptedData,
            nextNodeId: null, // Last hop
        };
    }

    /**
     * Route data through onion network
     */
    async routeThroughOnion(
        transferId: string,
        data: ArrayBuffer,
        destination: string
    ): Promise<void> {
        if (this.config.mode === 'disabled') {
            throw new OnionRoutingNotImplementedError('Onion routing is disabled');
        }

        if (!this.router) {
            throw new OnionRoutingNotImplementedError('Router not initialized');
        }

        this.stats.totalTransfers++;

        try {
            // Create or get circuit for this transfer
            let circuit: OnionCircuit | null | undefined = this.activeCircuits.get(transferId);

            if (!circuit) {
                // Build new circuit
                circuit = await this.router.createCircuit(destination);

                if (!circuit) {
                    throw new Error('Failed to create circuit');
                }

                this.activeCircuits.set(transferId, circuit);
                this.stats.circuitsBuilt++;
                this.stats.circuitsActive++;
            }

            // Send data through circuit
            const payload = new Uint8Array(data);
            await this.router.sendThroughCircuit(circuit.id, payload, destination);

            // Update stats
            this.stats.successfulTransfers++;
            this.stats.bytesTransferred += data.byteLength;
            this.stats.currentHops = circuit.path.length;

            // Track path for this transfer
            this.activePaths.set(transferId, circuit.path.map(r => r.id));

            this.emit('transferComplete', { transferId, destination, bytesTransferred: data.byteLength });
        } catch (error) {
            this.stats.failedTransfers++;
            this.emit('transferFailed', { transferId, error });
            throw error;
        }
    }

    /**
     * Close circuit for a transfer
     */
    closeTransferCircuit(transferId: string): void {
        const circuit = this.activeCircuits.get(transferId);
        if (circuit && this.router) {
            this.router.closeCircuit(circuit.id);
            this.activeCircuits.delete(transferId);
            this.activePaths.delete(transferId);
            this.stats.circuitsActive--;
        }
    }

    /**
     * Update latency statistics
     */
    updateLatencyStats(latency: number): void {
        const total = this.stats.totalTransfers;
        if (total > 0) {
            this.stats.averageLatency =
                (this.stats.averageLatency * (total - 1) + latency) / total;
        }
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<OnionRoutingConfig>): void {
        const wasEnabled = this.config.mode !== 'disabled';
        this.config = { ...this.config, ...config };

        // Handle mode changes
        if (config.mode !== undefined) {
            if (config.mode === 'disabled' && wasEnabled) {
                // Disable onion routing
                disableOnionRouting();
            } else if (config.mode !== 'disabled' && !wasEnabled) {
                // Enable onion routing
                const hopCount = config.numHops || this.config.numHops;
                const regions = config.preferredRegions;
                enableOnionRouting({
                    hopCount,
                    ...(regions ? { preferredRegions: regions } : {}),
                }).catch(err => {
                    secureLog.error('[OnionRoutingManager] Failed to enable:', err);
                });
            }
        }

        this.emit('configUpdated', this.config);
    }

    /**
     * Get current configuration
     */
    getConfig(): OnionRoutingConfig {
        return { ...this.config };
    }

    /**
     * Get statistics
     */
    getStats(): OnionRoutingStats {
        return { ...this.stats };
    }

    /**
     * Get available relay nodes
     */
    getRelayNodes(): RelayNode[] {
        return Array.from(this.relayNodes.values());
    }

    /**
     * Get active paths
     */
    getActivePaths(): Map<string, string[]> {
        return new Map(this.activePaths);
    }

    /**
     * Refresh relay list
     */
    async refreshRelays(): Promise<void> {
        await this.fetchRelayNodes();
    }

    /**
     * Cleanup
     */
    async cleanup(): Promise<void> {
        // Close all active circuits
        for (const transferId of this.activeCircuits.keys()) {
            this.closeTransferCircuit(transferId);
        }

        if (this.router) {
            await this.router.cleanup();
        }

        this.relayNodes.clear();
        this.activePaths.clear();
        this.activeCircuits.clear();
        this.isInitialized = false;
        this.removeAllListeners();
    }
}

// ============================================================================
// Global Instance
// ============================================================================

let globalManager: OnionRoutingManager | null = null;

/**
 * Get global onion routing manager
 */
export function getOnionRoutingManager(): OnionRoutingManager {
    if (!globalManager) {
        globalManager = new OnionRoutingManager();
    }
    return globalManager;
}

/**
 * Initialize global onion routing
 */
export async function initializeOnionRouting(
    config?: Partial<OnionRoutingConfig>
): Promise<OnionRoutingManager> {
    const manager = getOnionRoutingManager();
    if (config) {
        manager.updateConfig(config);
    }
    await manager.initialize();
    return manager;
}

/**
 * Cleanup global onion routing
 */
export async function cleanupOnionRouting(): Promise<void> {
    if (globalManager) {
        await globalManager.cleanup();
        globalManager = null;
    }
}
