'use client';

/**
 * Relay Directory Service
 *
 * Provides relay discovery, registration, and health checking for the
 * TALLOW onion routing network. Supports both self-hosted relay networks
 * and bootstrap relays for initial connections.
 *
 * Architecture:
 * - Entry relays: Accept client connections, first hop
 * - Middle relays: Forward encrypted data, intermediate hops
 * - Exit relays: Connect to destination peers, final hop
 */

import { pqCrypto, HybridPublicKey } from '../crypto/pqc-crypto';
import secureLog from '../utils/secure-logger';

// ============================================================================
// Constants
// ============================================================================

const RELAY_DIRECTORY_VERSION = 1;
const RELAY_HEALTH_CHECK_INTERVAL_MS = 60000; // Check relay health every minute
const RELAY_STALE_THRESHOLD_MS = 300000; // Consider relay stale after 5 minutes
const MIN_TRUST_SCORE = 0.5;

// Bootstrap relay directory URLs (fallback for initial discovery)
const BOOTSTRAP_DIRECTORY_URLS = [
    // Primary directory (self-hosted)
    process.env['NEXT_PUBLIC_RELAY_DIRECTORY_URL'] || '',
    // Fallback directories
    'https://relay-directory.tallow.network/v1/relays',
].filter(Boolean);

// ============================================================================
// Types
// ============================================================================

export type RelayRole = 'entry' | 'middle' | 'exit' | 'any';

export interface RelayNodeInfo {
    /** Unique relay identifier (derived from public key hash) */
    id: string;
    /** Relay's hybrid public key (ML-KEM-768 + X25519) */
    publicKey: HybridPublicKey;
    /** Serialized public key for transmission */
    publicKeyBase64: string;
    /** WebSocket endpoint URL */
    endpoint: string;
    /** Relay role capabilities */
    roles: RelayRole[];
    /** Geographic region (for path diversity) */
    region: string;
    /** Trust score (0-1, based on uptime and performance) */
    trustScore: number;
    /** Available bandwidth in bytes/sec */
    bandwidth: number;
    /** Current latency in ms (measured) */
    latency: number;
    /** Whether relay is currently online */
    online: boolean;
    /** Last successful health check timestamp */
    lastSeen: number;
    /** Relay version string */
    version: string;
    /** Ed25519 signature of relay metadata (for authenticity) */
    signature?: string | undefined;
}

export interface RelayDirectoryConfig {
    /** Directory service URLs to query */
    directoryUrls: string[];
    /** Health check interval in ms */
    healthCheckInterval: number;
    /** Minimum trust score for relay selection */
    minTrustScore: number;
    /** Whether to use bootstrap relays if directory is unavailable */
    useBootstrapRelays: boolean;
    /** Custom bootstrap relays */
    customRelays?: RelayNodeInfo[];
}

export interface RelaySelectionCriteria {
    /** Required relay role */
    role: RelayRole;
    /** Preferred geographic regions (for diversity) */
    preferredRegions?: string[] | undefined;
    /** Excluded relay IDs (to avoid reuse in same circuit) */
    excludeIds?: string[] | undefined;
    /** Minimum bandwidth requirement */
    minBandwidth?: number | undefined;
    /** Maximum latency requirement */
    maxLatency?: number | undefined;
}

// ============================================================================
// Bootstrap Relays
// ============================================================================

/**
 * Generate bootstrap relay node info with proper PQC keys.
 * These are hardcoded relays used when directory service is unavailable.
 */
async function generateBootstrapRelay(
    id: string,
    endpoint: string,
    region: string,
    roles: RelayRole[]
): Promise<RelayNodeInfo> {
    // Generate a deterministic keypair for the relay based on its ID
    // In production, these would be pre-generated and the public keys stored
    const keyPair = await pqCrypto.generateHybridKeypair();
    const publicKey = pqCrypto.getPublicKey(keyPair);
    const publicKeyBase64 = btoa(String.fromCharCode(...pqCrypto.serializePublicKey(publicKey)));

    return {
        id,
        publicKey,
        publicKeyBase64,
        endpoint,
        roles,
        region,
        trustScore: 0.8, // Bootstrap relays have high initial trust
        bandwidth: 100 * 1024 * 1024, // 100 MB/s
        latency: 50, // Assume low latency initially
        online: true,
        lastSeen: Date.now(),
        version: `tallow-relay-${RELAY_DIRECTORY_VERSION}.0.0`,
    };
}

// ============================================================================
// Relay Directory Service
// ============================================================================

export class RelayDirectoryService {
    private static instance: RelayDirectoryService;
    private config: RelayDirectoryConfig;
    private relayCache: Map<string, RelayNodeInfo> = new Map();
    private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
    private isInitialized = false;
    private bootstrapRelays: RelayNodeInfo[] = [];

    private constructor(config?: Partial<RelayDirectoryConfig>) {
        this.config = {
            directoryUrls: BOOTSTRAP_DIRECTORY_URLS,
            healthCheckInterval: RELAY_HEALTH_CHECK_INTERVAL_MS,
            minTrustScore: MIN_TRUST_SCORE,
            useBootstrapRelays: true,
            ...config,
        };
    }

    static getInstance(config?: Partial<RelayDirectoryConfig>): RelayDirectoryService {
        if (!RelayDirectoryService.instance) {
            RelayDirectoryService.instance = new RelayDirectoryService(config);
        }
        return RelayDirectoryService.instance;
    }

    /**
     * Initialize the relay directory service
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        secureLog.log('[RelayDirectory] Initializing relay directory service');

        // Initialize bootstrap relays first (always available)
        await this.initializeBootstrapRelays();

        // Try to fetch from directory service
        await this.refreshDirectory();

        // Start health check timer
        this.startHealthChecks();

        this.isInitialized = true;
        secureLog.log(`[RelayDirectory] Initialized with ${this.relayCache.size} relays`);
    }

    /**
     * Initialize bootstrap relays for fallback connectivity
     */
    private async initializeBootstrapRelays(): Promise<void> {
        // Get relay URL base from environment or use default
        const relayBase = process.env['NEXT_PUBLIC_RELAY_URL'] || 'wss://relay.tallow.network';

        // Create bootstrap relays for each region
        const bootstrapConfigs = [
            { id: 'bootstrap-us-east-1', endpoint: `${relayBase}/us-east-1`, region: 'us-east', roles: ['entry', 'middle', 'exit'] as RelayRole[] },
            { id: 'bootstrap-eu-west-1', endpoint: `${relayBase}/eu-west-1`, region: 'eu-west', roles: ['entry', 'middle', 'exit'] as RelayRole[] },
            { id: 'bootstrap-ap-south-1', endpoint: `${relayBase}/ap-south-1`, region: 'ap-south', roles: ['entry', 'middle', 'exit'] as RelayRole[] },
            { id: 'bootstrap-us-west-1', endpoint: `${relayBase}/us-west-1`, region: 'us-west', roles: ['entry', 'middle'] as RelayRole[] },
            { id: 'bootstrap-eu-central-1', endpoint: `${relayBase}/eu-central-1`, region: 'eu-central', roles: ['middle', 'exit'] as RelayRole[] },
        ];

        for (const config of bootstrapConfigs) {
            const relay = await generateBootstrapRelay(
                config.id,
                config.endpoint,
                config.region,
                config.roles
            );
            this.bootstrapRelays.push(relay);
            this.relayCache.set(relay.id, relay);
        }

        // Add any custom relays from config
        if (this.config.customRelays) {
            for (const relay of this.config.customRelays) {
                this.relayCache.set(relay.id, relay);
            }
        }

        secureLog.log(`[RelayDirectory] Initialized ${this.bootstrapRelays.length} bootstrap relays`);
    }

    /**
     * Refresh relay directory from remote services
     */
    async refreshDirectory(): Promise<void> {
        for (const url of this.config.directoryUrls) {
            if (!url) {continue;}

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'X-Tallow-Version': String(RELAY_DIRECTORY_VERSION),
                    },
                    signal: AbortSignal.timeout(10000),
                });

                if (!response.ok) {
                    continue;
                }

                const data = await response.json();

                if (data.relays && Array.isArray(data.relays)) {
                    for (const relayData of data.relays) {
                        const relay = this.parseRelayData(relayData);
                        if (relay && relay.trustScore >= this.config.minTrustScore) {
                            this.relayCache.set(relay.id, relay);
                        }
                    }

                    secureLog.log(`[RelayDirectory] Loaded ${data.relays.length} relays from directory`);
                    return; // Success, don't try other URLs
                }
            } catch (error) {
                secureLog.warn(`[RelayDirectory] Failed to fetch from ${url}:`, error);
            }
        }

        // If all directory services failed, rely on bootstrap relays
        if (this.config.useBootstrapRelays && this.bootstrapRelays.length > 0) {
            secureLog.warn('[RelayDirectory] Using bootstrap relays as fallback');
        }
    }

    /**
     * Parse relay data from directory response
     */
    private parseRelayData(data: Record<string, unknown>): RelayNodeInfo | null {
        try {
            if (!data['id'] || !data['publicKey'] || !data['endpoint']) {
                return null;
            }

            // Deserialize public key
            const publicKeyBytes = Uint8Array.from(atob(data['publicKey'] as string), c => c.charCodeAt(0));
            const publicKey = pqCrypto.deserializePublicKey(publicKeyBytes);

            const result: RelayNodeInfo = {
                id: data['id'] as string,
                publicKey,
                publicKeyBase64: data['publicKey'] as string,
                endpoint: data['endpoint'] as string,
                roles: (data['roles'] as RelayRole[]) || ['any'],
                region: (data['region'] as string) || 'unknown',
                trustScore: (data['trustScore'] as number) || 0.5,
                bandwidth: (data['bandwidth'] as number) || 10 * 1024 * 1024,
                latency: (data['latency'] as number) || 100,
                online: (data['online'] as boolean) ?? true,
                lastSeen: (data['lastSeen'] as number) || Date.now(),
                version: (data['version'] as string) || 'unknown',
            };

            if (data['signature']) {
                result.signature = data['signature'] as string;
            }

            return result;
        } catch (error) {
            secureLog.error('[RelayDirectory] Failed to parse relay data:', error);
            return null;
        }
    }

    /**
     * Start periodic health checks for cached relays
     */
    private startHealthChecks(): void {
        if (this.healthCheckTimer) {
            return;
        }

        this.healthCheckTimer = setInterval(async () => {
            await this.performHealthChecks();
        }, this.config.healthCheckInterval);
    }

    /**
     * Stop health check timer
     */
    stopHealthChecks(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
    }

    /**
     * Perform health checks on all cached relays
     */
    private async performHealthChecks(): Promise<void> {
        const now = Date.now();
        const checks: Promise<boolean>[] = [];

        for (const [id, relay] of this.relayCache.entries()) {
            // Skip recently checked relays
            if (now - relay.lastSeen < this.config.healthCheckInterval / 2) {
                continue;
            }

            checks.push(this.checkRelayHealth(id));
        }

        await Promise.allSettled(checks);

        // Remove stale relays (but keep bootstrap relays)
        for (const [id, relay] of this.relayCache.entries()) {
            if (now - relay.lastSeen > RELAY_STALE_THRESHOLD_MS) {
                const isBootstrap = this.bootstrapRelays.some(b => b.id === id);
                if (!isBootstrap) {
                    this.relayCache.delete(id);
                    secureLog.log(`[RelayDirectory] Removed stale relay: ${id}`);
                } else {
                    // Mark bootstrap relay as offline but keep it
                    relay.online = false;
                }
            }
        }
    }

    /**
     * Check health of a specific relay
     */
    async checkRelayHealth(relayId: string): Promise<boolean> {
        const relay = this.relayCache.get(relayId);
        if (!relay) {
            return false;
        }

        const startTime = Date.now();

        try {
            // Create WebSocket connection to check latency
            const ws = new WebSocket(relay.endpoint);

            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    ws.close();
                    reject(new Error('Connection timeout'));
                }, 5000);

                ws.onopen = () => {
                    clearTimeout(timeout);
                    ws.close();
                    resolve();
                };

                ws.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Connection failed'));
                };
            });

            // Update relay info
            relay.latency = Date.now() - startTime;
            relay.lastSeen = Date.now();
            relay.online = true;

            // Adjust trust score based on health check success
            relay.trustScore = Math.min(1, relay.trustScore + 0.01);

            return true;
        } catch {
            // Mark as offline and reduce trust score
            relay.online = false;
            relay.trustScore = Math.max(0, relay.trustScore - 0.05);

            return false;
        }
    }

    /**
     * Get all available relays
     */
    getRelays(): RelayNodeInfo[] {
        return Array.from(this.relayCache.values()).filter(r => r.online);
    }

    /**
     * Get relays by role
     */
    getRelaysByRole(role: RelayRole): RelayNodeInfo[] {
        return this.getRelays().filter(r =>
            r.roles.includes(role) || r.roles.includes('any')
        );
    }

    /**
     * Select relay based on criteria
     */
    selectRelay(criteria: RelaySelectionCriteria): RelayNodeInfo | null {
        let candidates = this.getRelaysByRole(criteria.role);

        // Filter by excluded IDs
        if (criteria.excludeIds && criteria.excludeIds.length > 0) {
            candidates = candidates.filter(r => !criteria.excludeIds!.includes(r.id));
        }

        // Filter by minimum bandwidth
        if (criteria.minBandwidth) {
            candidates = candidates.filter(r => r.bandwidth >= criteria.minBandwidth!);
        }

        // Filter by maximum latency
        if (criteria.maxLatency) {
            candidates = candidates.filter(r => r.latency <= criteria.maxLatency!);
        }

        // Prefer relays in specified regions
        if (criteria.preferredRegions && criteria.preferredRegions.length > 0) {
            const preferred = candidates.filter(r =>
                criteria.preferredRegions!.includes(r.region)
            );
            if (preferred.length > 0) {
                candidates = preferred;
            }
        }

        if (candidates.length === 0) {
            return null;
        }

        // Weight by trust score and bandwidth, penalize by latency
        const weighted = candidates.map(r => ({
            relay: r,
            score: (r.trustScore * 0.4) +
                   (Math.min(r.bandwidth / (100 * 1024 * 1024), 1) * 0.3) +
                   (Math.max(0, 1 - r.latency / 500) * 0.3),
        }));

        // Sort by score
        weighted.sort((a, b) => b.score - a.score);

        // Select from top candidates with some randomization
        const topCount = Math.min(3, weighted.length);
        const randBytes = pqCrypto.randomBytes(4);
        const randIndex = (randBytes[0]! | (randBytes[1]! << 8)) % topCount;

        return weighted[randIndex]?.relay ?? null;
    }

    /**
     * Select multiple relays for a circuit path
     */
    selectCircuitPath(hopCount: number, preferredRegions?: string[]): RelayNodeInfo[] {
        const path: RelayNodeInfo[] = [];
        const usedIds: string[] = [];
        const usedRegions: string[] = [];

        // Select entry relay
        const entry = this.selectRelay({
            role: 'entry',
            preferredRegions,
            excludeIds: usedIds,
        });

        if (!entry) {
            throw new Error('No entry relay available');
        }

        path.push(entry);
        usedIds.push(entry.id);
        usedRegions.push(entry.region);

        // Select middle relays (if hop count > 2)
        for (let i = 1; i < hopCount - 1; i++) {
            const middle = this.selectRelay({
                role: 'middle',
                excludeIds: usedIds,
                // Prefer different regions for diversity
                preferredRegions: preferredRegions?.filter(r => !usedRegions.includes(r)),
            });

            if (!middle) {
                throw new Error('No middle relay available');
            }

            path.push(middle);
            usedIds.push(middle.id);
            usedRegions.push(middle.region);
        }

        // Select exit relay
        if (hopCount >= 2) {
            const exit = this.selectRelay({
                role: 'exit',
                excludeIds: usedIds,
                preferredRegions: preferredRegions?.filter(r => !usedRegions.includes(r)),
            });

            if (!exit) {
                throw new Error('No exit relay available');
            }

            path.push(exit);
        }

        return path;
    }

    /**
     * Get relay by ID
     */
    getRelay(id: string): RelayNodeInfo | null {
        return this.relayCache.get(id) ?? null;
    }

    /**
     * Get relay count
     */
    get relayCount(): number {
        return this.getRelays().length;
    }

    /**
     * Check if directory has enough relays for onion routing
     */
    hasEnoughRelays(hopCount: number): boolean {
        const entryCount = this.getRelaysByRole('entry').length;
        const middleCount = this.getRelaysByRole('middle').length;
        const exitCount = this.getRelaysByRole('exit').length;
        const anyCount = this.getRelaysByRole('any').length;

        // Need at least 1 entry, (hopCount-2) middles, and 1 exit
        // 'any' relays can fill any role
        return (
            (entryCount + anyCount >= 1) &&
            (middleCount + anyCount >= Math.max(0, hopCount - 2)) &&
            (exitCount + anyCount >= 1)
        );
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        this.stopHealthChecks();
        this.relayCache.clear();
        this.isInitialized = false;
    }
}

// Export singleton getter
export function getRelayDirectory(config?: Partial<RelayDirectoryConfig>): RelayDirectoryService {
    return RelayDirectoryService.getInstance(config);
}

export default RelayDirectoryService;
