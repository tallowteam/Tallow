'use client';

/**
 * Private WebRTC Transport Module
 * 
 * Implements TURN-only WebRTC for maximum privacy.
 * Forces all connections through relay servers to prevent IP leaks.
 * 
 * SECURITY IMPACT: 7 | PRIVACY IMPACT: 10
 * PRIORITY: CRITICAL
 */

import secureLog from '../utils/secure-logger';
import { getProxyConfig } from '../network/proxy-config';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PrivateTransportConfig {
    turnServer?: string;
    forceRelay?: boolean;
    allowDirect?: boolean;
    logCandidates?: boolean;
    onIpLeakDetected?: (candidate: RTCIceCandidate) => void;
}

export interface TransportStats {
    totalCandidates: number;
    relayCandidates: number;
    filteredCandidates: number;
    connectionType: 'relay' | 'direct' | 'none';
    isPrivate: boolean;
}

// ============================================================================
// Constants
// ============================================================================

// Default TURN server (should be overridden in production)
const DEFAULT_TURN_SERVER = process.env.NEXT_PUBLIC_TURN_SERVER || 'turns:relay.metered.ca:443?transport=tcp';
const TURN_USERNAME = process.env.NEXT_PUBLIC_TURN_USERNAME || '';
const TURN_CREDENTIAL = process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '';

// Only force relay when TURN credentials are actually configured
// Without valid TURN credentials, relay-only mode blocks all connections
const HAS_TURN_CREDENTIALS = !!(process.env.NEXT_PUBLIC_TURN_USERNAME && process.env.NEXT_PUBLIC_TURN_CREDENTIAL);
const FORCE_RELAY = HAS_TURN_CREDENTIALS && process.env.NEXT_PUBLIC_FORCE_RELAY !== 'false';
const ALLOW_DIRECT = !FORCE_RELAY || process.env.NEXT_PUBLIC_ALLOW_DIRECT === 'true';

// IP patterns to filter
const LOCAL_IP_PATTERNS = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^169\.254\./,              // Link-local
    /^127\./,                   // Loopback
    /^::1$/,                    // IPv6 loopback
    /^fe80:/i,                  // IPv6 link-local
    /^fc00:/i,                  // IPv6 unique local
    /^fd00:/i,                  // IPv6 unique local
];

// ============================================================================
// Private Transport Class
// ============================================================================

export class PrivateTransport {
    private config: PrivateTransportConfig;
    private stats: TransportStats;
    private candidateLog: RTCIceCandidate[] = [];

    constructor(config: PrivateTransportConfig = {}) {
        this.config = {
            turnServer: config.turnServer || DEFAULT_TURN_SERVER,
            forceRelay: config.forceRelay ?? FORCE_RELAY,
            allowDirect: config.allowDirect ?? ALLOW_DIRECT,
            logCandidates: config.logCandidates ?? true,
            onIpLeakDetected: config.onIpLeakDetected,
        };

        this.stats = {
            totalCandidates: 0,
            relayCandidates: 0,
            filteredCandidates: 0,
            connectionType: 'none',
            isPrivate: true,
        };
    }

    // ==========================================================================
    // RTCConfiguration Generation
    // ==========================================================================

    /**
     * Get the private RTCConfiguration
     * Forces relay-only connections when privacy mode is enabled
     * Now reads from user's proxy configuration settings
     */
    getRTCConfiguration(): RTCConfiguration {
        // Get user's proxy configuration
        const proxyConfig = getProxyConfig();
        const forceRelay = proxyConfig.forceRelay || proxyConfig.mode === 'relay-only' || this.config.forceRelay;

        const iceServers: RTCIceServer[] = [];

        // Add custom TURN servers from proxy config
        if (proxyConfig.customTurnServers && proxyConfig.customTurnServers.length > 0) {
            proxyConfig.customTurnServers.forEach(server => {
                iceServers.push({
                    urls: server.urls,
                    username: server.username,
                    credential: server.credential,
                });
            });
        }

        // Add default TURN server if credentials are configured
        if (this.config.turnServer && TURN_USERNAME && TURN_CREDENTIAL) {
            iceServers.push({
                urls: this.config.turnServer,
                username: TURN_USERNAME,
                credential: TURN_CREDENTIAL,
            });
        } else if (forceRelay && proxyConfig.customTurnServers.length === 0) {
            secureLog.warn('[PrivateTransport] relay-only mode enabled but no TURN servers configured - connections may fail');
        }

        // Only add STUN servers if not in relay-only mode (non-Google for privacy)
        if (!forceRelay && proxyConfig.mode !== 'relay-only') {
            iceServers.push(
                { urls: 'stun:stun.nextcloud.com:443' },
                { urls: 'stun:stun.stunprotocol.org:3478' }
            );
        }

        return {
            iceServers,
            // CRITICAL: 'relay' prevents direct connections that leak IPs
            iceTransportPolicy: forceRelay ? 'relay' : 'all',
            // Disable candidate pre-gathering for privacy
            iceCandidatePoolSize: 0,
            // Use unified-plan for modern WebRTC
            // bundlePolicy: 'max-bundle',
            // rtcpMuxPolicy: 'require',
        };
    }

    /**
     * Get configuration for local network (no external STUN needed)
     * Host candidates on LAN work without any ICE servers
     */
    getLocalNetworkConfiguration(): RTCConfiguration {
        return {
            iceServers: [],
            iceTransportPolicy: 'all',
            iceCandidatePoolSize: 0,
        };
    }

    // ==========================================================================
    // IP Leak Prevention
    // ==========================================================================

    /**
     * Filter ICE candidates to remove those that could leak IPs
     * Returns true if candidate is safe, false if it should be filtered
     */
    filterCandidate(candidate: RTCIceCandidate | null): boolean {
        if (!candidate || !candidate.candidate) {
            return true; // Allow null candidates (end-of-candidates)
        }

        this.stats.totalCandidates++;
        const candidateStr = candidate.candidate;

        // Log candidate for monitoring
        if (this.config.logCandidates) {
            this.candidateLog.push(candidate);
            secureLog.log('ICE Candidate:', this.sanitizeCandidateLog(candidateStr));
        }

        // Always allow relay candidates
        if (candidateStr.includes('typ relay')) {
            this.stats.relayCandidates++;
            return true;
        }

        // Check user's proxy config for relay-only mode
        const proxyConfig = getProxyConfig();
        const forceRelay = proxyConfig.forceRelay || proxyConfig.mode === 'relay-only' || this.config.forceRelay;

        // In relay-only mode, filter non-relay candidates
        if (forceRelay) {
            this.stats.filteredCandidates++;

            // Check for potential IP leak
            if (this.containsLocalIP(candidateStr)) {
                secureLog.warn('PrivateTransport: Blocked candidate with local IP in relay-only mode');
                this.config.onIpLeakDetected?.(candidate);
                this.stats.isPrivate = false;
            }

            return false;
        }

        // In normal mode, just log but allow
        return true;
    }

    /**
     * Check if a candidate string contains a local IP
     */
    private containsLocalIP(candidateStr: string): boolean {
        // Extract IP from candidate string
        const ipMatch = candidateStr.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([a-fA-F0-9:]+)/);
        if (!ipMatch) return false;

        const ip = ipMatch[0];
        return LOCAL_IP_PATTERNS.some(pattern => pattern.test(ip));
    }

    /**
     * Sanitize candidate for logging (hide actual IPs)
     */
    private sanitizeCandidateLog(candidateStr: string): string {
        // Replace IPs with placeholders for logging
        return candidateStr
            .replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, '[IP_HIDDEN]')
            .replace(/[a-fA-F0-9]{1,4}(:[a-fA-F0-9]{1,4}){7}/g, '[IPv6_HIDDEN]');
    }

    /**
     * Filter SDP to remove local IP information
     */
    filterSDP(sdp: string): string {
        if (!this.config.forceRelay) return sdp;

        let filteredSDP = sdp;

        // Remove local IP addresses from SDP
        LOCAL_IP_PATTERNS.forEach(pattern => {
            // Match IP addresses in various SDP formats
            const ipRegex = new RegExp(
                `(IN IP[46] )(${pattern.source.replace(/\\/g, '').replace(/\^/g, '').replace(/\$/g, '')})`,
                'g'
            );
            filteredSDP = filteredSDP.replace(ipRegex, '$10.0.0.0');
        });

        // Remove candidate lines that contain local IPs
        const lines = filteredSDP.split('\r\n');
        const filteredLines = lines.filter(line => {
            if (!line.startsWith('a=candidate:')) return true;
            if (line.includes('typ relay')) return true;

            // Check for local IPs
            return !LOCAL_IP_PATTERNS.some(pattern => {
                const ipMatch = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
                return ipMatch && pattern.test(ipMatch[0]);
            });
        });

        return filteredLines.join('\r\n');
    }

    // ==========================================================================
    // Monitoring & Statistics
    // ==========================================================================

    /**
     * Get transport statistics
     */
    getStats(): TransportStats {
        return { ...this.stats };
    }

    /**
     * Get all logged candidates (for debugging)
     */
    getCandidateLog(): RTCIceCandidate[] {
        return [...this.candidateLog];
    }

    /**
     * Clear candidate log
     */
    clearLog(): void {
        this.candidateLog = [];
    }

    /**
     * Check if current connection is using relay only
     */
    isRelayOnly(): boolean {
        return this.stats.relayCandidates > 0 &&
            this.stats.filteredCandidates === this.stats.totalCandidates - this.stats.relayCandidates;
    }

    /**
     * Update connection type based on selected candidate pair
     */
    updateConnectionType(peerConnection: RTCPeerConnection): void {
        peerConnection.getStats().then(stats => {
            stats.forEach(report => {
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    const localCandidateId = report.localCandidateId;
                    stats.forEach(candidateReport => {
                        if (candidateReport.id === localCandidateId) {
                            this.stats.connectionType =
                                candidateReport.candidateType === 'relay' ? 'relay' : 'direct';
                        }
                    });
                }
            });
        }).catch((err) => secureLog.error('[WebRTC] Stats error:', err));
    }

    /**
     * Alert if non-relay connection is detected
     */
    monitorConnection(peerConnection: RTCPeerConnection): void {
        const checkConnection = () => {
            this.updateConnectionType(peerConnection);

            if (this.config.forceRelay && this.stats.connectionType === 'direct') {
                secureLog.error('PRIVACY ALERT: Direct connection detected when relay-only was expected!');
                this.stats.isPrivate = false;
            }
        };

        peerConnection.addEventListener('connectionstatechange', () => {
            if (peerConnection.connectionState === 'connected') {
                setTimeout(checkConnection, 1000);
            }
        });
    }

    // ==========================================================================
    // Helper Methods
    // ==========================================================================

    /**
     * Create a peer connection with privacy settings
     */
    createPrivatePeerConnection(): RTCPeerConnection {
        const config = this.getRTCConfiguration();
        const pc = new RTCPeerConnection(config);

        // Set up candidate filtering
        const originalOnIceCandidate = pc.onicecandidate;
        pc.onicecandidate = (event) => {
            if (this.filterCandidate(event.candidate)) {
                originalOnIceCandidate?.call(pc, event);
            } else {
                secureLog.log('PrivateTransport: Filtered non-relay candidate');
            }
        };

        // Monitor connection for privacy compliance
        this.monitorConnection(pc);

        return pc;
    }

    /**
     * Reset statistics
     */
    reset(): void {
        this.stats = {
            totalCandidates: 0,
            relayCandidates: 0,
            filteredCandidates: 0,
            connectionType: 'none',
            isPrivate: true,
        };
        this.candidateLog = [];
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let privateTransportInstance: PrivateTransport | null = null;

/**
 * Get or create the private transport singleton.
 * Config is only applied on first call (when instance is created).
 * Call resetPrivateTransport() to reconfigure.
 */
export function getPrivateTransport(config?: PrivateTransportConfig): PrivateTransport {
    if (!privateTransportInstance) {
        privateTransportInstance = new PrivateTransport(config);
    }
    return privateTransportInstance;
}

/**
 * Reset the singleton (useful for reconfiguration or testing)
 */
export function resetPrivateTransport(): void {
    if (privateTransportInstance) {
        privateTransportInstance.reset();
        privateTransportInstance = null;
    }
}

export default PrivateTransport;
