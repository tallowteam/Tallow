'use client';

/**
 * Proxy/Relay Configuration
 * Enables Tor-friendly connections and custom relay servers
 */

const PROXY_CONFIG_KEY = 'Tallow_proxy_config';

export interface ProxyConfig {
    // Connection mode
    mode: 'auto' | 'relay-only' | 'direct-only';

    // Custom TURN/relay servers
    customTurnServers: TurnServer[];

    // Use relay for all connections (Tor-friendly)
    forceRelay: boolean;

    // Connection timeout (ms)
    connectionTimeout: number;

    // Retry settings
    maxRetries: number;
    retryDelay: number;
}

export interface TurnServer {
    urls: string[];
    username?: string;
    credential?: string;
}

// Default configuration
const DEFAULT_CONFIG: ProxyConfig = {
    mode: 'auto',
    customTurnServers: [],
    forceRelay: false,
    connectionTimeout: 30000,
    maxRetries: 3,
    retryDelay: 2000,
};

// Default STUN servers (privacy-respecting, non-Google)
export const DEFAULT_TURN_SERVERS: TurnServer[] = [
    {
        urls: ['stun:stun.nextcloud.com:443'],
    },
    {
        urls: ['stun:stun.stunprotocol.org:3478'],
    },
];

// Get proxy configuration
export function getProxyConfig(): ProxyConfig {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;

    try {
        const stored = localStorage.getItem(PROXY_CONFIG_KEY);
        if (stored) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
        }
    } catch { }

    return DEFAULT_CONFIG;
}

// Save proxy configuration
export function saveProxyConfig(config: Partial<ProxyConfig>): void {
    if (typeof window === 'undefined') return;

    const current = getProxyConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(PROXY_CONFIG_KEY, JSON.stringify(updated));
}

// Reset to default
export function resetProxyConfig(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PROXY_CONFIG_KEY);
}

// Get ICE servers for WebRTC (combines default + custom)
export function getIceServers(): RTCIceServer[] {
    const config = getProxyConfig();

    const servers: RTCIceServer[] = [];

    // Add default STUN servers (unless relay-only)
    if (config.mode !== 'relay-only') {
        DEFAULT_TURN_SERVERS.forEach(server => {
            servers.push({
                urls: server.urls,
                username: server.username,
                credential: server.credential,
            });
        });
    }

    // Add custom TURN servers
    config.customTurnServers.forEach(server => {
        servers.push({
            urls: server.urls,
            username: server.username,
            credential: server.credential,
        });
    });

    return servers;
}

// Get WebRTC configuration
export function getRTCConfiguration(): RTCConfiguration {
    const config = getProxyConfig();
    const iceServers = getIceServers();

    return {
        iceServers,
        iceCandidatePoolSize: 10,
        // Force relay if configured (for Tor/proxy users)
        iceTransportPolicy: config.forceRelay ? 'relay' : 'all',
    };
}

// Add custom TURN server
export function addCustomTurnServer(server: TurnServer): void {
    const config = getProxyConfig();
    config.customTurnServers.push(server);
    saveProxyConfig(config);
}

// Remove custom TURN server
export function removeCustomTurnServer(index: number): void {
    const config = getProxyConfig();
    config.customTurnServers.splice(index, 1);
    saveProxyConfig(config);
}

// Enable relay-only mode (for Tor users)
export function enableRelayOnlyMode(): void {
    saveProxyConfig({ mode: 'relay-only', forceRelay: true });
}

// Disable relay-only mode
export function disableRelayOnlyMode(): void {
    saveProxyConfig({ mode: 'auto', forceRelay: false });
}

export default {
    getProxyConfig,
    saveProxyConfig,
    resetProxyConfig,
    getIceServers,
    getRTCConfiguration,
    addCustomTurnServer,
    removeCustomTurnServer,
    enableRelayOnlyMode,
    disableRelayOnlyMode,
    DEFAULT_TURN_SERVERS,
};
