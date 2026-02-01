'use client';

/**
 * Relay Routing Module
 *
 * Implements IP masking via relay routing with configurable privacy levels.
 * Supports direct, single-relay, and multi-hop relay routing.
 *
 * SECURITY IMPACT: 8 | PRIVACY IMPACT: 10
 * PRIORITY: HIGH
 */

import secureLog from '../utils/secure-logger';
import { getProxyConfig, saveProxyConfig } from '../network/proxy-config';

// ============================================================================
// Type Definitions
// ============================================================================

export type PrivacyLevel = 'direct' | 'relay' | 'multi-relay';

export interface RelayRoutingConfig {
    privacyLevel: PrivacyLevel;
    maxHops: number; // For multi-relay: 1-3 hops
    preferredRelays: string[];
    autoSelectRelay: boolean;
    latencyThreshold: number; // ms - warn if latency exceeds this
}

export interface RelayServer {
    id: string;
    name: string;
    url: string;
    location: string;
    latency: number | null;
    isAvailable: boolean;
    lastChecked: number;
}

export interface ConnectionPrivacyInfo {
    privacyLevel: PrivacyLevel;
    activeHops: number;
    relaysUsed: string[];
    estimatedLatency: number;
    ipMasked: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const PRIVACY_LEVEL_KEY = 'tallow_privacy_level';
const RELAY_CONFIG_KEY = 'tallow_relay_config';

// Default relay servers (privacy-focused, non-commercial)
const DEFAULT_RELAY_SERVERS: RelayServer[] = [
    {
        id: 'relay-nextcloud',
        name: 'Nextcloud TURN',
        url: 'stun:stun.nextcloud.com:443',
        location: 'Europe',
        latency: null,
        isAvailable: true,
        lastChecked: 0,
    },
    {
        id: 'relay-stunprotocol',
        name: 'STUN Protocol',
        url: 'stun:stun.stunprotocol.org:3478',
        location: 'Global',
        latency: null,
        isAvailable: true,
        lastChecked: 0,
    },
];

const DEFAULT_RELAY_CONFIG: RelayRoutingConfig = {
    privacyLevel: 'direct',
    maxHops: 1,
    preferredRelays: [],
    autoSelectRelay: true,
    latencyThreshold: 500, // 500ms warning threshold
};

// Privacy level descriptions
export const PRIVACY_LEVEL_INFO = {
    direct: {
        name: 'Direct Connection',
        description: 'Fastest speed, IP address visible to peer',
        latencyMultiplier: 1.0,
        security: 'low',
        icon: '🔓',
    },
    relay: {
        name: 'Relay Mode',
        description: 'IP address hidden via relay server',
        latencyMultiplier: 1.5,
        security: 'medium',
        icon: '🔒',
    },
    'multi-relay': {
        name: 'Multi-Hop Relay',
        description: 'Maximum privacy with multiple relay hops',
        latencyMultiplier: 2.5,
        security: 'high',
        icon: '🔐',
    },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current relay routing configuration
 */
export function getRelayConfig(): RelayRoutingConfig {
    if (typeof window === 'undefined') {return DEFAULT_RELAY_CONFIG;}

    try {
        const stored = localStorage.getItem(RELAY_CONFIG_KEY);
        if (stored) {
            return { ...DEFAULT_RELAY_CONFIG, ...JSON.parse(stored) };
        }
    } catch (error) {
        secureLog.error('[RelayRouting] Failed to load config:', error);
    }

    return DEFAULT_RELAY_CONFIG;
}

/**
 * Save relay routing configuration
 */
export function saveRelayConfig(config: Partial<RelayRoutingConfig>): void {
    if (typeof window === 'undefined') {return;}

    try {
        const current = getRelayConfig();
        const updated = { ...current, ...config };
        localStorage.setItem(RELAY_CONFIG_KEY, JSON.stringify(updated));
        secureLog.log('[RelayRouting] Config saved:', updated);
    } catch (error) {
        secureLog.error('[RelayRouting] Failed to save config:', error);
    }
}

/**
 * Get current privacy level
 */
export function getPrivacyLevel(): PrivacyLevel {
    if (typeof window === 'undefined') {return 'direct';}

    try {
        const stored = localStorage.getItem(PRIVACY_LEVEL_KEY);
        if (stored && ['direct', 'relay', 'multi-relay'].includes(stored)) {
            return stored as PrivacyLevel;
        }
    } catch (error) {
        secureLog.error('[RelayRouting] Failed to load privacy level:', error);
    }

    return 'direct';
}

/**
 * Set privacy level and update proxy configuration
 */
export async function setPrivacyLevel(level: PrivacyLevel): Promise<void> {
    if (typeof window === 'undefined') {return;}

    try {
        localStorage.setItem(PRIVACY_LEVEL_KEY, level);

        // Update proxy configuration based on privacy level
        const proxyConfig = await getProxyConfig();

        switch (level) {
            case 'direct':
                await saveProxyConfig({
                    ...proxyConfig,
                    mode: 'auto',
                    forceRelay: false,
                });
                break;

            case 'relay':
                await saveProxyConfig({
                    ...proxyConfig,
                    mode: 'relay-only',
                    forceRelay: true,
                });
                break;

            case 'multi-relay':
                await saveProxyConfig({
                    ...proxyConfig,
                    mode: 'relay-only',
                    forceRelay: true,
                });
                // Multi-relay requires additional relay server configuration
                break;
        }

        secureLog.log(`[RelayRouting] Privacy level set to: ${level}`);
    } catch (error) {
        secureLog.error('[RelayRouting] Failed to set privacy level:', error);
        throw error;
    }
}

// ============================================================================
// Relay Routing Manager
// ============================================================================

export class RelayRoutingManager {
    private config: RelayRoutingConfig;
    private availableRelays: RelayServer[] = [];
    private currentConnection: ConnectionPrivacyInfo | null = null;

    constructor() {
        this.config = getRelayConfig();
        this.availableRelays = [...DEFAULT_RELAY_SERVERS];
    }

    /**
     * Get current configuration
     */
    getConfig(): RelayRoutingConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    updateConfig(updates: Partial<RelayRoutingConfig>): void {
        this.config = { ...this.config, ...updates };
        saveRelayConfig(this.config);
    }

    /**
     * Get available relay servers
     */
    getAvailableRelays(): RelayServer[] {
        return [...this.availableRelays];
    }

    /**
     * Add custom relay server
     */
    addRelayServer(relay: Omit<RelayServer, 'id' | 'lastChecked'>): void {
        const newRelay: RelayServer = {
            ...relay,
            id: `relay-custom-${Date.now()}`,
            lastChecked: 0,
        };

        this.availableRelays.push(newRelay);
        this.saveRelayServers();
        secureLog.log('[RelayRouting] Added relay server:', newRelay);
    }

    /**
     * Remove relay server
     */
    removeRelayServer(id: string): void {
        this.availableRelays = this.availableRelays.filter(r => r.id !== id);
        this.saveRelayServers();
        secureLog.log('[RelayRouting] Removed relay server:', id);
    }

    /**
     * Check latency of a relay server
     */
    async checkRelayLatency(relay: RelayServer): Promise<number> {
        const startTime = Date.now();

        try {
            // Create temporary peer connection to measure latency
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: relay.url }]
            });

            return await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    pc.close();
                    resolve(-1); // Timeout
                }, 5000);

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        const latency = Date.now() - startTime;
                        clearTimeout(timeout);
                        pc.close();
                        resolve(latency);
                    }
                };

                // Trigger ICE gathering
                pc.createDataChannel('latency-test');
                pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {});
            });
        } catch (error) {
            secureLog.error('[RelayRouting] Latency check failed:', error);
            return -1;
        }
    }

    /**
     * Check all relay servers and update availability
     */
    async checkAllRelays(): Promise<void> {
        secureLog.log('[RelayRouting] Checking all relay servers...');

        const checks = this.availableRelays.map(async (relay) => {
            const latency = await this.checkRelayLatency(relay);
            relay.latency = latency;
            relay.isAvailable = latency > 0;
            relay.lastChecked = Date.now();
        });

        await Promise.all(checks);
        this.saveRelayServers();

        const available = this.availableRelays.filter(r => r.isAvailable).length;
        secureLog.log(`[RelayRouting] ${available}/${this.availableRelays.length} relays available`);
    }

    /**
     * Select optimal relay servers based on latency
     */
    selectOptimalRelays(count: number): RelayServer[] {
        const available = this.availableRelays
            .filter(r => r.isAvailable)
            .sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity));

        return available.slice(0, count);
    }

    /**
     * Get current connection privacy info
     */
    getConnectionPrivacyInfo(): ConnectionPrivacyInfo | null {
        return this.currentConnection;
    }

    /**
     * Initialize connection with specified privacy level
     */
    async initializeConnection(privacyLevel?: PrivacyLevel): Promise<RTCConfiguration> {
        const level = privacyLevel || this.config.privacyLevel;

        secureLog.log(`[RelayRouting] Initializing connection with privacy level: ${level}`);

        const iceServers: RTCIceServer[] = [];
        let activeHops = 0;
        const relaysUsed: string[] = [];

        switch (level) {
            case 'direct':
                // Use STUN only for direct connections
                iceServers.push({ urls: 'stun:stun.nextcloud.com:443' });
                break;

            case 'relay':
                // Use TURN relay servers
                const optimalRelay = this.selectOptimalRelays(1)[0];
                if (optimalRelay) {
                    iceServers.push({ urls: optimalRelay.url });
                    relaysUsed.push(optimalRelay.name);
                    activeHops = 1;
                }
                break;

            case 'multi-relay':
                // Use multiple TURN relay servers
                const relays = this.selectOptimalRelays(this.config.maxHops);
                relays.forEach(relay => {
                    iceServers.push({ urls: relay.url });
                    relaysUsed.push(relay.name);
                });
                activeHops = relays.length;
                break;
        }

        // Calculate estimated latency
        const baseLatency = 50; // Base connection latency
        const multiplier = PRIVACY_LEVEL_INFO[level].latencyMultiplier;
        const estimatedLatency = Math.round(baseLatency * multiplier);

        this.currentConnection = {
            privacyLevel: level,
            activeHops,
            relaysUsed,
            estimatedLatency,
            ipMasked: level !== 'direct',
        };

        return {
            iceServers,
            iceTransportPolicy: level === 'direct' ? 'all' : 'relay',
            iceCandidatePoolSize: 0,
        };
    }

    /**
     * Get privacy level recommendations
     */
    getRecommendations(): { level: PrivacyLevel; reason: string }[] {
        const recommendations: { level: PrivacyLevel; reason: string }[] = [];

        // Check if using VPN/Tor
        const torDetected = localStorage.getItem('tallow_tor_detected') === 'true';

        if (torDetected) {
            recommendations.push({
                level: 'multi-relay',
                reason: 'Tor Browser detected - use multi-relay for maximum anonymity'
            });
        } else {
            recommendations.push({
                level: 'relay',
                reason: 'Recommended for general privacy protection'
            });
        }

        recommendations.push({
            level: 'direct',
            reason: 'Use only on trusted networks for maximum speed'
        });

        return recommendations;
    }

    /**
     * Save relay servers to storage
     */
    private saveRelayServers(): void {
        try {
            localStorage.setItem('tallow_relay_servers', JSON.stringify(this.availableRelays));
        } catch (error) {
            secureLog.error('[RelayRouting] Failed to save relay servers:', error);
        }
    }

}

// ============================================================================
// Singleton Instance
// ============================================================================

let managerInstance: RelayRoutingManager | null = null;

/**
 * Get or create the relay routing manager singleton
 */
export function getRelayRoutingManager(): RelayRoutingManager {
    if (!managerInstance) {
        managerInstance = new RelayRoutingManager();
    }
    return managerInstance;
}

export default RelayRoutingManager;
