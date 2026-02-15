'use client';

/**
 * Network Interface Detection and Selection
 * Provides utilities for detecting network interfaces, filtering by type,
 * and selecting preferred interfaces for transfers.
 */

import secureLog from '@/lib/utils/secure-logger';

export interface NetworkInterface {
    name: string;
    type: 'ethernet' | 'wifi' | 'cellular' | 'vpn' | 'virtual' | 'unknown';
    isActive: boolean;
    isPreferred: boolean;
    estimatedSpeed: number; // Mbps
    addresses: string[];
}

export interface NetworkConfig {
    preferredInterface: string | null;
    allowedTypes: NetworkInterface['type'][];
    preferLAN: boolean;
    allowCellular: boolean;
    forceRelay: boolean;
}

const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
    preferredInterface: null,
    allowedTypes: ['ethernet', 'wifi', 'vpn'],
    preferLAN: true,
    allowCellular: false,
    forceRelay: false,
};

const STORAGE_KEY = 'tallow-network-config';

/**
 * Detect network connection type
 */
export function getConnectionType(): 'ethernet' | 'wifi' | 'cellular' | 'unknown' {
    if (typeof navigator === 'undefined') {return 'unknown';}

    // Use Network Information API if available
    const connection = (navigator as Navigator & {
        connection?: { type?: string; effectiveType?: string }
    }).connection;

    if (connection?.type) {
        switch (connection.type) {
            case 'ethernet':
                return 'ethernet';
            case 'wifi':
                return 'wifi';
            case 'cellular':
                return 'cellular';
            default:
                return 'unknown';
        }
    }

    // Fallback: estimate from effective type
    if (connection?.effectiveType) {
        switch (connection.effectiveType) {
            case '4g':
                return 'wifi'; // Assume WiFi-like speed
            case '3g':
            case '2g':
            case 'slow-2g':
                return 'cellular';
            default:
                return 'unknown';
        }
    }

    return 'unknown';
}

/**
 * Estimate connection speed in Mbps
 */
export function estimateConnectionSpeed(): number {
    if (typeof navigator === 'undefined') {return 100;} // Default assumption

    const connection = (navigator as Navigator & {
        connection?: { downlink?: number; effectiveType?: string }
    }).connection;

    if (connection?.downlink) {
        return connection.downlink;
    }

    // Estimate from effective type
    if (connection?.effectiveType) {
        switch (connection.effectiveType) {
            case '4g':
                return 20;
            case '3g':
                return 2;
            case '2g':
                return 0.1;
            case 'slow-2g':
                return 0.05;
            default:
                return 10;
        }
    }

    return 100; // Assume good connection
}

/**
 * Check if on a metered connection
 */
export function isMeteredConnection(): boolean {
    if (typeof navigator === 'undefined') {return false;}

    const connection = (navigator as Navigator & {
        connection?: { saveData?: boolean }
    }).connection;

    return connection?.saveData === true;
}

/**
 * Check if connection is high-speed (likely LAN)
 */
export function isHighSpeedConnection(): boolean {
    const speed = estimateConnectionSpeed();
    return speed >= 50; // 50 Mbps or higher
}

/**
 * Check if we're on a local network (same subnet heuristics)
 */
export async function isLocalNetwork(targetIp?: string): Promise<boolean> {
    if (!targetIp) {
        // Without target IP, use connection speed heuristic
        return isHighSpeedConnection() && getConnectionType() !== 'cellular';
    }

    // Check if target is in private IP ranges
    const privateRanges = [
        /^10\./,           // 10.0.0.0/8
        /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
        /^192\.168\./,     // 192.168.0.0/16
        /^127\./,          // Loopback
        /^169\.254\./,     // Link-local
        /^fc00:/i,         // IPv6 ULA
        /^fe80:/i,         // IPv6 link-local
    ];

    return privateRanges.some(range => range.test(targetIp));
}

/**
 * Load network configuration from storage
 */
export function loadNetworkConfig(): NetworkConfig {
    if (typeof localStorage === 'undefined') {return DEFAULT_NETWORK_CONFIG;}

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_NETWORK_CONFIG, ...JSON.parse(stored) };
        }
    } catch (error) {
        secureLog.error('Failed to load network config:', error);
    }

    return DEFAULT_NETWORK_CONFIG;
}

/**
 * Save network configuration to storage
 */
export function saveNetworkConfig(config: Partial<NetworkConfig>): void {
    if (typeof localStorage === 'undefined') {return;}

    try {
        const current = loadNetworkConfig();
        const updated = { ...current, ...config };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        secureLog.error('Failed to save network config:', error);
    }
}

/**
 * Get available network interfaces (limited in browsers)
 * Uses WebRTC ICE candidates to detect local IPs
 */
export async function detectNetworkInterfaces(): Promise<NetworkInterface[]> {
    if (typeof RTCPeerConnection === 'undefined') {
        return [];
    }

    const interfaces: NetworkInterface[] = [];
    const seenIPs = new Set<string>();

    try {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        const gatheringComplete = new Promise<void>((resolve) => {
            const timeout = setTimeout(resolve, 5000);
            pc.onicecandidate = (event) => {
                if (!event.candidate) {
                    clearTimeout(timeout);
                    resolve();
                    return;
                }

                const candidate = event.candidate.candidate;
                const match = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
                const matchedIP = match?.[1];
                if (matchedIP && !seenIPs.has(matchedIP)) {
                    const ip = matchedIP;
                    seenIPs.add(ip);

                    // Classify interface type based on IP
                    let type: NetworkInterface['type'] = 'unknown';
                    if (/^192\.168\./.test(ip) || /^10\./.test(ip)) {
                        type = getConnectionType() === 'wifi' ? 'wifi' : 'ethernet';
                    } else if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) {
                        type = 'vpn'; // Often VPN ranges
                    }

                    interfaces.push({
                        name: `Interface ${interfaces.length + 1}`,
                        type,
                        isActive: true,
                        isPreferred: interfaces.length === 0,
                        estimatedSpeed: estimateConnectionSpeed(),
                        addresses: [ip],
                    });
                }
            };
        });

        pc.createDataChannel('');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await gatheringComplete;
        pc.close();

    } catch (error) {
        secureLog.debug('Interface detection failed:', error);
    }

    // Add current connection info if no interfaces detected
    if (interfaces.length === 0) {
        interfaces.push({
            name: 'Default Connection',
            type: getConnectionType(),
            isActive: true,
            isPreferred: true,
            estimatedSpeed: estimateConnectionSpeed(),
            addresses: [],
        });
    }

    return interfaces;
}

/**
 * Filter interfaces based on configuration
 */
export function filterInterfaces(
    interfaces: NetworkInterface[],
    config: NetworkConfig
): NetworkInterface[] {
    return interfaces.filter(iface => {
        // Check if type is allowed
        if (!config.allowedTypes.includes(iface.type)) {
            return false;
        }

        // Check cellular restriction
        if (iface.type === 'cellular' && !config.allowCellular) {
            return false;
        }

        return iface.isActive;
    });
}

// Type guard for interface name
function isValidInterfaceName(name: string | null | undefined): name is string {
    return typeof name === 'string' && name.length > 0;
}

/**
 * Select the best interface for transfer
 */
export function selectBestInterface(
    interfaces: NetworkInterface[],
    config: NetworkConfig
): NetworkInterface | null {
    const filtered = filterInterfaces(interfaces, config);

    if (filtered.length === 0) {return null;}

    // If a preferred interface is set, try to use it
    if (isValidInterfaceName(config.preferredInterface)) {
        const preferredName = config.preferredInterface;
        const preferred = filtered.find(i => i.name === preferredName);
        if (preferred) {return preferred;}
    }

    // Sort by preference: ethernet > wifi > vpn > other
    const priority: Record<NetworkInterface['type'], number> = {
        ethernet: 0,
        wifi: 1,
        vpn: 2,
        virtual: 3,
        cellular: 4,
        unknown: 5,
    };

    filtered.sort((a, b) => {
        // First by type priority
        const typeDiff = priority[a.type] - priority[b.type];
        if (typeDiff !== 0) {return typeDiff;}

        // Then by speed
        return b.estimatedSpeed - a.estimatedSpeed;
    });

    return filtered[0] ?? null;
}

/**
 * Network quality assessment
 */
export interface NetworkQuality {
    grade: 'excellent' | 'good' | 'fair' | 'poor';
    latency: number;
    bandwidth: number;
    stability: number;
    isLAN: boolean;
}

/**
 * Assess network quality for transfer optimization
 */
export async function assessNetworkQuality(): Promise<NetworkQuality> {
    const connectionType = getConnectionType();
    const speed = estimateConnectionSpeed();
    const isLAN = await isLocalNetwork();

    let grade: NetworkQuality['grade'];
    let stability: number;

    if (connectionType === 'ethernet' || (isLAN && speed >= 100)) {
        grade = 'excellent';
        stability = 0.99;
    } else if (connectionType === 'wifi' && speed >= 20) {
        grade = 'good';
        stability = 0.95;
    } else if (speed >= 5) {
        grade = 'fair';
        stability = 0.85;
    } else {
        grade = 'poor';
        stability = 0.7;
    }

    return {
        grade,
        latency: grade === 'excellent' ? 5 : grade === 'good' ? 20 : grade === 'fair' ? 100 : 500,
        bandwidth: speed * 1024 * 1024 / 8, // Convert Mbps to bytes/s
        stability,
        isLAN,
    };
}

/**
 * Monitor network changes
 */
export function onBasicNetworkChange(callback: () => void): () => void {
    if (typeof window === 'undefined') {return () => {};}

    const connection = (navigator as Navigator & {
        connection?: EventTarget
    }).connection;

    const handlers: Array<[EventTarget, string, () => void]> = [];

    // Listen for online/offline
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);
    handlers.push([window, 'online', callback], [window, 'offline', callback]);

    // Listen for connection changes
    if (connection) {
        connection.addEventListener('change', callback);
        handlers.push([connection, 'change', callback]);
    }

    // Cleanup function
    return () => {
        handlers.forEach(([target, event, handler]) => {
            target.removeEventListener(event, handler);
        });
    };
}

export default {
    getConnectionType,
    estimateConnectionSpeed,
    isMeteredConnection,
    isHighSpeedConnection,
    isLocalNetwork,
    loadNetworkConfig,
    saveNetworkConfig,
    detectNetworkInterfaces,
    filterInterfaces,
    selectBestInterface,
    assessNetworkQuality,
    onNetworkChange: onBasicNetworkChange,
};
