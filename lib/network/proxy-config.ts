'use client';

/**
 * Proxy/Relay Configuration
 * Enables Tor-friendly connections and custom relay servers
 * SECURITY: Proxy config (including TURN credentials) is now encrypted in localStorage
 * ENHANCED: TURN credentials are double-encrypted for additional security
 */

import secureStorage from '../storage/secure-storage';
import CredentialEncryption, {
  type EncryptedTurnCredentials,
} from '../security/credential-encryption';

const PROXY_CONFIG_KEY = 'Tallow_proxy_config';

export interface ProxyConfig {
    // Connection mode
    mode: 'auto' | 'relay-only' | 'direct-only';

    // Custom TURN/relay servers (stored encrypted)
    customTurnServers: TurnServer[];

    // Use relay for all connections (Tor-friendly)
    forceRelay: boolean;

    // Connection timeout (ms)
    connectionTimeout: number;

    // Retry settings
    maxRetries: number;
    retryDelay: number;

    // Credential rotation timestamp
    lastCredentialRotation?: number;
}

export interface TurnServer {
    urls: string[];
    username?: string;
    credential?: string;
    credentialType?: 'password' | 'oauth';
}

// Internal storage format with encrypted credentials
interface ProxyConfigStored {
    mode: 'auto' | 'relay-only' | 'direct-only';
    customTurnServers: (EncryptedTurnCredentials | TurnServer)[];
    forceRelay: boolean;
    connectionTimeout: number;
    maxRetries: number;
    retryDelay: number;
    lastCredentialRotation?: number;
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

// Get proxy configuration (decrypts credentials)
export async function getProxyConfig(): Promise<ProxyConfig> {
    if (typeof window === 'undefined') {return DEFAULT_CONFIG;}

    try {
        const stored = await secureStorage.getItem(PROXY_CONFIG_KEY);
        if (stored) {
            const parsed: ProxyConfigStored = JSON.parse(stored);

            // Decrypt TURN server credentials
            const decryptedServers = await CredentialEncryption.decryptCredentials(
                parsed.customTurnServers as EncryptedTurnCredentials[]
            );

            return {
                ...DEFAULT_CONFIG,
                ...parsed,
                customTurnServers: decryptedServers
            };
        }
    } catch { }

    return DEFAULT_CONFIG;
}

// Save proxy configuration (encrypts credentials)
export async function saveProxyConfig(config: Partial<ProxyConfig>): Promise<void> {
    if (typeof window === 'undefined') {return;}

    const current = await getProxyConfig();
    const updated = { ...current, ...config };

    // Encrypt TURN server credentials before storage
    const encryptedServers = await CredentialEncryption.migrateCredentials(
        updated.customTurnServers
    );

    const toStore: ProxyConfigStored = {
        ...updated,
        customTurnServers: encryptedServers,
        lastCredentialRotation: Date.now(),
    };

    await secureStorage.setItem(PROXY_CONFIG_KEY, JSON.stringify(toStore));
}

// Reset to default
export async function resetProxyConfig(): Promise<void> {
    if (typeof window === 'undefined') {return;}
    secureStorage.removeItem(PROXY_CONFIG_KEY);
}

// Get ICE servers for WebRTC (combines default + custom)
export async function getIceServers(): Promise<RTCIceServer[]> {
    const config = await getProxyConfig();

    const servers: RTCIceServer[] = [];

    // Add default STUN servers (unless relay-only)
    if (config.mode !== 'relay-only') {
        DEFAULT_TURN_SERVERS.forEach(server => {
            servers.push({
                urls: server.urls,
                ...(server.username ? { username: server.username } : {}),
                ...(server.credential ? { credential: server.credential } : {}),
            });
        });
    }

    // Add custom TURN servers
    config.customTurnServers.forEach(server => {
        servers.push({
            urls: server.urls,
            ...(server.username ? { username: server.username } : {}),
            ...(server.credential ? { credential: server.credential } : {}),
        });
    });

    return servers;
}

// Get WebRTC configuration
export async function getRTCConfiguration(): Promise<RTCConfiguration> {
    const config = await getProxyConfig();
    const iceServers = await getIceServers();

    return {
        iceServers,
        iceCandidatePoolSize: 10,
        // Force relay if configured (for Tor/proxy users)
        iceTransportPolicy: config.forceRelay ? 'relay' : 'all',
    };
}

// Add custom TURN server (credentials will be encrypted)
export async function addCustomTurnServer(server: TurnServer): Promise<void> {
    const config = await getProxyConfig();
    config.customTurnServers.push(server);
    await saveProxyConfig(config);
}

// Remove custom TURN server
export async function removeCustomTurnServer(index: number): Promise<void> {
    const config = await getProxyConfig();
    config.customTurnServers.splice(index, 1);
    await saveProxyConfig(config);
}

// Rotate TURN credentials (re-encrypt with new keys)
export async function rotateTurnCredentials(): Promise<void> {
    if (typeof window === 'undefined') {return;}

    const config = await getProxyConfig();

    // Re-encrypt all credentials
    const reEncrypted = await CredentialEncryption.migrateCredentials(
        config.customTurnServers
    );

    const toStore: ProxyConfigStored = {
        mode: config.mode,
        customTurnServers: reEncrypted,
        forceRelay: config.forceRelay,
        connectionTimeout: config.connectionTimeout,
        maxRetries: config.maxRetries,
        retryDelay: config.retryDelay,
        lastCredentialRotation: Date.now(),
    };

    await secureStorage.setItem(PROXY_CONFIG_KEY, JSON.stringify(toStore));
}

// Enable relay-only mode (for Tor users)
export async function enableRelayOnlyMode(): Promise<void> {
    await saveProxyConfig({ mode: 'relay-only', forceRelay: true });
}

// Disable relay-only mode
export async function disableRelayOnlyMode(): Promise<void> {
    await saveProxyConfig({ mode: 'auto', forceRelay: false });
}

export default {
    getProxyConfig,
    saveProxyConfig,
    resetProxyConfig,
    getIceServers,
    getRTCConfiguration,
    addCustomTurnServer,
    removeCustomTurnServer,
    rotateTurnCredentials,
    enableRelayOnlyMode,
    disableRelayOnlyMode,
    DEFAULT_TURN_SERVERS,
};
