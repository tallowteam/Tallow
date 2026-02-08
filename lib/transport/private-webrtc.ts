'use client';

/**
 * Private WebRTC Transport Module
 *
 * Implements TURN-only WebRTC for maximum privacy with traffic obfuscation.
 * Forces all connections through relay servers to prevent IP leaks.
 *
 * Features:
 * - TURN-only mode for IP leak prevention
 * - Traffic obfuscation integration
 * - Packet padding for uniform sizes
 * - Timing obfuscation for traffic analysis resistance
 * - Domain fronting support
 * - Anti-fingerprinting measures
 *
 * SECURITY IMPACT: 10 | PRIVACY IMPACT: 10
 * PRIORITY: CRITICAL
 */

import secureLog from '../utils/secure-logger';
import {
  TrafficObfuscator,
  getTrafficObfuscator,
  type ObfuscationConfig,
  type ObfuscatedPacket,
  PacketType,
} from './obfuscation';
import {
  PacketPadder,
  getPacketPadder,
  PaddingMode,
  type PaddingConfig,
} from './packet-padding';
import {
  TimingObfuscator,
  getTimingObfuscator,
  TimingMode,
  type TimingConfig,
} from './timing-obfuscation';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PrivateTransportConfig {
    turnServer?: string;
    forceRelay?: boolean;
    allowDirect?: boolean;
    logCandidates?: boolean;
    onIpLeakDetected?: (candidate: RTCIceCandidate) => void;

    // Obfuscation settings
    enableObfuscation?: boolean;
    obfuscationConfig?: Partial<ObfuscationConfig>;
    paddingConfig?: Partial<PaddingConfig>;
    timingConfig?: Partial<TimingConfig>;

    // Domain fronting
    enableDomainFronting?: boolean;
    frontDomain?: string;
    targetDomain?: string;

    // Anti-fingerprinting
    enableAntiFingerprinting?: boolean;
    browserProfile?: 'chrome' | 'firefox' | 'safari' | 'edge';
}

export interface TransportStats {
    totalCandidates: number;
    relayCandidates: number;
    filteredCandidates: number;
    connectionType: 'relay' | 'direct' | 'none';
    isPrivate: boolean;

    // Obfuscation stats
    obfuscationEnabled: boolean;
    packetsObfuscated: number;
    bytesOriginal: number;
    bytesPadded: number;
    overheadPercentage: number;
    averageDelay: number;
}

// ============================================================================
// Constants
// ============================================================================

// SECURITY: TURN credentials are now fetched from secure server endpoint
// instead of being exposed in client-side environment variables
const FORCE_RELAY = process.env['NEXT_PUBLIC_FORCE_RELAY'] !== 'false';
const ALLOW_DIRECT = !FORCE_RELAY || process.env['NEXT_PUBLIC_ALLOW_DIRECT'] === 'true';

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

    // Obfuscation components
    private obfuscator: TrafficObfuscator | null = null;
    private padder: PacketPadder | null = null;
    private timer: TimingObfuscator | null = null;
    private coverTrafficActive: boolean = false;

    constructor(config: PrivateTransportConfig = {}) {
        this.config = {
            turnServer: config.turnServer,
            forceRelay: config.forceRelay ?? FORCE_RELAY,
            allowDirect: config.allowDirect ?? ALLOW_DIRECT,
            logCandidates: config.logCandidates ?? true,
            enableObfuscation: config.enableObfuscation ?? false,
            enableDomainFronting: config.enableDomainFronting ?? false,
            enableAntiFingerprinting: config.enableAntiFingerprinting ?? true,
            browserProfile: config.browserProfile ?? 'chrome',
            ...(config.onIpLeakDetected ? { onIpLeakDetected: config.onIpLeakDetected } : {}),
            ...(config.obfuscationConfig ? { obfuscationConfig: config.obfuscationConfig } : {}),
            ...(config.paddingConfig ? { paddingConfig: config.paddingConfig } : {}),
            ...(config.timingConfig ? { timingConfig: config.timingConfig } : {}),
            ...(config.frontDomain ? { frontDomain: config.frontDomain } : {}),
            ...(config.targetDomain ? { targetDomain: config.targetDomain } : {}),
        };

        this.stats = {
            totalCandidates: 0,
            relayCandidates: 0,
            filteredCandidates: 0,
            connectionType: 'none',
            isPrivate: true,
            obfuscationEnabled: false,
            packetsObfuscated: 0,
            bytesOriginal: 0,
            bytesPadded: 0,
            overheadPercentage: 0,
            averageDelay: 0,
        };

        // Initialize obfuscation if enabled
        if (this.config.enableObfuscation) {
            this.initializeObfuscation();
        }
    }

    /**
     * Initialize obfuscation components
     */
    private initializeObfuscation(): void {
        // Build obfuscation config
        const obfuscationDefaults: Partial<ObfuscationConfig> = {
            minPacketSize: 1024,
            maxPacketSize: 16384,
            paddingMode: 'uniform',
            timingMode: 'jittered',
            minDelay: 1,
            maxDelay: 50,
            disguiseAs: 'https',
            enableCoverTraffic: true,
            coverTrafficRate: 2,
            randomizeHeaders: true,
            mimicBrowser: this.config.enableAntiFingerprinting ?? true,
            enableChunking: true,
            decoyProbability: 0.15,
        };

        // Add browserProfile if defined
        if (this.config.browserProfile) {
            obfuscationDefaults.browserProfile = this.config.browserProfile;
        }

        // Merge with user config
        let obfuscationConfig: Partial<ObfuscationConfig>;
        if (this.config.obfuscationConfig) {
            obfuscationConfig = { ...obfuscationDefaults, ...this.config.obfuscationConfig };
        } else {
            obfuscationConfig = obfuscationDefaults;
        }

        // Initialize traffic obfuscator
        this.obfuscator = getTrafficObfuscator(obfuscationConfig);

        // Build padding config
        const paddingDefaults: Partial<PaddingConfig> = {
            mode: PaddingMode.UNIFORM,
            minSize: 512,
            maxSize: 16384,
            useCryptoPadding: true,
            includeIntegrity: true,
        };

        const paddingConfig = this.config.paddingConfig
            ? { ...paddingDefaults, ...this.config.paddingConfig }
            : paddingDefaults;

        // Initialize packet padder
        this.padder = getPacketPadder(paddingConfig);

        // Build timing config
        const timingDefaults: Partial<TimingConfig> = {
            mode: TimingMode.CONSTANT_BITRATE,
            targetBitrate: 1_000_000,
            bitrateVariance: 0.2,
            minDelayMs: 1,
            maxDelayMs: 100,
            adaptiveEnabled: true,
        };

        const timingConfig = this.config.timingConfig
            ? { ...timingDefaults, ...this.config.timingConfig }
            : timingDefaults;

        // Initialize timing obfuscator
        this.timer = getTimingObfuscator(timingConfig);

        // Configure domain fronting if enabled
        if (this.config.enableDomainFronting && this.config.frontDomain && this.config.targetDomain) {
            this.obfuscator.configureDomainFronting(
                this.config.frontDomain,
                this.config.targetDomain
            );
        }

        this.stats.obfuscationEnabled = true;
        secureLog.log('[PrivateTransport] Obfuscation initialized');
    }

    /**
     * Enable or disable obfuscation at runtime
     */
    setObfuscationEnabled(enabled: boolean): void {
        if (enabled && !this.obfuscator) {
            this.initializeObfuscation();
        } else if (!enabled) {
            this.stopCoverTraffic();
            this.stats.obfuscationEnabled = false;
        } else {
            this.stats.obfuscationEnabled = enabled;
        }
    }

    /**
     * Check if obfuscation is enabled
     */
    isObfuscationEnabled(): boolean {
        return this.stats.obfuscationEnabled && this.obfuscator !== null;
    }

    // ==========================================================================
    // RTCConfiguration Generation
    // ==========================================================================

    /**
     * Get the private RTCConfiguration
     * Forces relay-only connections when privacy mode is enabled
     *
     * SECURITY: This method returns config with empty iceServers.
     * Call fetchTURNCredentials() first to get credentials from server endpoint.
     */
    getRTCConfiguration(): RTCConfiguration {
        const forceRelay = this.config.forceRelay;

        const iceServers: RTCIceServer[] = [];

        // Only add STUN servers if not in relay-only mode (non-Google for privacy)
        if (!forceRelay) {
            iceServers.push(
                { urls: 'stun:stun.nextcloud.com:443' },
                { urls: 'stun:stun.stunprotocol.org:3478' }
            );
        } else {
            secureLog.warn('[PrivateTransport] relay-only mode enabled. Call fetchTURNCredentials() to fetch TURN servers from /api/turn/credentials');
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
     * Fetch TURN credentials from server endpoint
     * SECURITY: Credentials are fetched server-side to prevent exposure
     *
     * @param ttl - Credential time-to-live in seconds (default: 12 hours)
     * @returns RTCConfiguration with TURN servers, or null on error
     */
    async fetchTURNCredentials(ttl: number = 43200): Promise<RTCConfiguration | null> {
        try {
            const response = await fetch(`/api/turn/credentials?ttl=${ttl}`);

            if (!response.ok) {
                secureLog.error('[PrivateTransport] Failed to fetch TURN credentials:', response.statusText);
                return null;
            }

            const data = await response.json() as {
                iceServers: RTCIceServer[];
                expiresAt: number;
                ttl: number;
                provider: string;
            };

            if (!data.iceServers || data.iceServers.length === 0) {
                secureLog.warn('[PrivateTransport] No TURN servers available from endpoint');
                return null;
            }

            const config = this.getRTCConfiguration();
            config.iceServers = [...(config.iceServers || []), ...data.iceServers];

            secureLog.log(`[PrivateTransport] TURN credentials fetched (provider: ${data.provider}, expires: ${new Date(data.expiresAt).toISOString()})`);

            return config;
        } catch (error) {
            secureLog.error('[PrivateTransport] Error fetching TURN credentials:', error);
            return null;
        }
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

        // Check config for relay-only mode
        const forceRelay = this.config.forceRelay;

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
        if (!ipMatch) {return false;}

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
        if (!this.config.forceRelay) {return sdp;}

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
            if (!line.startsWith('a=candidate:')) {return true;}
            if (line.includes('typ relay')) {return true;}

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

    // ==========================================================================
    // Traffic Obfuscation Methods
    // ==========================================================================

    /**
     * Obfuscate outgoing data with padding, timing, and protocol disguise
     */
    async obfuscateData(data: Uint8Array): Promise<Uint8Array[]> {
        if (!this.obfuscator || !this.stats.obfuscationEnabled) {
            return [data];
        }

        const packets = await this.obfuscator.obfuscateWithDisguise(data);

        // Update stats
        this.stats.packetsObfuscated += packets.length;
        this.stats.bytesOriginal += data.length;
        this.stats.bytesPadded += packets.reduce((sum, p) => sum + p.length, 0);
        this.stats.overheadPercentage = ((this.stats.bytesPadded - this.stats.bytesOriginal) /
                                          this.stats.bytesOriginal) * 100;

        return packets;
    }

    /**
     * Deobfuscate incoming data
     */
    deobfuscateData(packets: Uint8Array[]): Uint8Array | null {
        if (!this.obfuscator || !this.stats.obfuscationEnabled) {
            return packets[0] || null;
        }

        return this.obfuscator.deobfuscateFromDisguise(packets);
    }

    /**
     * Pad a single packet to uniform size
     */
    padPacket(data: Uint8Array): Uint8Array {
        if (!this.padder || !this.stats.obfuscationEnabled) {
            return data;
        }

        const padded = this.padder.pad(data);
        return padded.data;
    }

    /**
     * Unpad a packet to extract original data
     */
    unpadPacket(padded: Uint8Array): Uint8Array | null {
        if (!this.padder || !this.stats.obfuscationEnabled) {
            return padded;
        }

        return this.padder.unpad(padded);
    }

    /**
     * Apply timing delay before sending
     */
    async applyTimingDelay(packetSize: number = 1024): Promise<void> {
        if (!this.timer || !this.stats.obfuscationEnabled) {
            return;
        }

        await this.timer.waitForDelay(packetSize);

        // Update average delay stat
        const timerStats = this.timer.getStats();
        this.stats.averageDelay = timerStats.averageDelayMs;
    }

    /**
     * Get timing delay value without waiting
     */
    getTimingDelay(packetSize: number = 1024): number {
        if (!this.timer || !this.stats.obfuscationEnabled) {
            return 0;
        }

        return this.timer.calculateDelay(packetSize);
    }

    /**
     * Stream data with full obfuscation (async generator)
     */
    async *streamObfuscated(data: Uint8Array): AsyncGenerator<Uint8Array> {
        if (!this.obfuscator || !this.stats.obfuscationEnabled) {
            yield data;
            return;
        }

        for await (const packet of this.obfuscator.streamObfuscated(data)) {
            // Apply timing delay
            if (this.timer) {
                await this.timer.waitForDelay(packet.data.length);
            }

            // Wrap in protocol disguise
            yield this.obfuscator.wrapInProtocolFrame(packet.data);
        }
    }

    /**
     * Start cover traffic generation
     */
    startCoverTraffic(sendFunc: (data: Uint8Array) => void): void {
        if (!this.obfuscator || this.coverTrafficActive) {
            return;
        }

        this.coverTrafficActive = true;
        this.obfuscator.startCoverTraffic((packet: ObfuscatedPacket) => {
            sendFunc(packet.data);
        });

        secureLog.log('[PrivateTransport] Cover traffic started');
    }

    /**
     * Stop cover traffic generation
     */
    stopCoverTraffic(): void {
        if (!this.obfuscator || !this.coverTrafficActive) {
            return;
        }

        this.coverTrafficActive = false;
        this.obfuscator.stopCoverTraffic();

        secureLog.log('[PrivateTransport] Cover traffic stopped');
    }

    /**
     * Check if data is cover traffic (should be discarded)
     */
    isCoverTraffic(data: Uint8Array): boolean {
        if (data.length < 1) {
            return false;
        }

        const type = data[0];
        return type === PacketType.COVER || type === PacketType.DECOY;
    }

    /**
     * Record network sample for adaptive timing
     */
    recordNetworkCondition(rtt: number, throughput: number, packetLoss: number): void {
        if (this.timer) {
            this.timer.recordNetworkSample(rtt, throughput, packetLoss);
        }
    }

    /**
     * Get domain fronting headers for HTTP requests
     */
    getDomainFrontHeaders(): Record<string, string> | null {
        if (!this.obfuscator || !this.obfuscator.isDomainFrontingEnabled()) {
            return null;
        }

        return this.obfuscator.getDomainFrontHeaders();
    }

    /**
     * Get domain fronted URL
     */
    getDomainFrontedUrl(path: string): string | null {
        if (!this.obfuscator || !this.obfuscator.isDomainFrontingEnabled()) {
            return null;
        }

        return this.obfuscator.getFrontedUrl(path);
    }

    /**
     * Configure domain fronting at runtime
     */
    configureDomainFronting(frontDomain: string, targetDomain: string): void {
        if (this.obfuscator) {
            this.obfuscator.configureDomainFronting(frontDomain, targetDomain);
            this.config.frontDomain = frontDomain;
            this.config.targetDomain = targetDomain;
            this.config.enableDomainFronting = true;
        }
    }

    /**
     * Set obfuscation mode
     */
    setObfuscationMode(mode: 'stealth' | 'balanced' | 'performance'): void {
        if (!this.obfuscator || !this.timer) {
            return;
        }

        switch (mode) {
            case 'stealth':
                // Maximum obfuscation, lower performance
                this.obfuscator.updateConfig({
                    paddingMode: 'uniform',
                    timingMode: 'jittered',
                    maxDelay: 100,
                    enableCoverTraffic: true,
                    decoyProbability: 0.25,
                });
                this.timer.setMode(TimingMode.CONSTANT_BITRATE);
                this.timer.setTargetBitrate(500_000); // 500 Kbps
                break;

            case 'balanced':
                // Moderate obfuscation and performance
                this.obfuscator.updateConfig({
                    paddingMode: 'uniform',
                    timingMode: 'jittered',
                    maxDelay: 50,
                    enableCoverTraffic: true,
                    decoyProbability: 0.15,
                });
                this.timer.setMode(TimingMode.CONSTANT_BITRATE);
                this.timer.setTargetBitrate(1_000_000); // 1 Mbps
                break;

            case 'performance':
                // Minimal obfuscation, maximum performance
                this.obfuscator.updateConfig({
                    paddingMode: 'random',
                    timingMode: 'burst',
                    maxDelay: 20,
                    enableCoverTraffic: false,
                    decoyProbability: 0.05,
                });
                this.timer.setMode(TimingMode.BURST);
                this.timer.setTargetBitrate(5_000_000); // 5 Mbps
                break;
        }

        secureLog.log('[PrivateTransport] Obfuscation mode set to:', mode);
    }

    /**
     * Get obfuscation statistics
     */
    getObfuscationStats(): {
        enabled: boolean;
        packets: number;
        bytesOriginal: number;
        bytesPadded: number;
        overhead: number;
        avgDelay: number;
        coverTrafficActive: boolean;
        domainFrontingEnabled: boolean;
    } {
        return {
            enabled: this.stats.obfuscationEnabled,
            packets: this.stats.packetsObfuscated,
            bytesOriginal: this.stats.bytesOriginal,
            bytesPadded: this.stats.bytesPadded,
            overhead: this.stats.overheadPercentage,
            avgDelay: this.stats.averageDelay,
            coverTrafficActive: this.coverTrafficActive,
            domainFrontingEnabled: this.obfuscator?.isDomainFrontingEnabled() ?? false,
        };
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
            obfuscationEnabled: this.stats.obfuscationEnabled,
            packetsObfuscated: 0,
            bytesOriginal: 0,
            bytesPadded: 0,
            overheadPercentage: 0,
            averageDelay: 0,
        };
        this.candidateLog = [];

        // Reset obfuscation components
        if (this.obfuscator) {
            this.obfuscator.resetStats();
        }
        if (this.padder) {
            this.padder.resetStats();
        }
        if (this.timer) {
            this.timer.reset();
        }
    }

    /**
     * Destroy and cleanup all resources
     */
    destroy(): void {
        this.stopCoverTraffic();
        this.reset();

        if (this.obfuscator) {
            this.obfuscator.destroy();
            this.obfuscator = null;
        }

        this.padder = null;
        this.timer = null;
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
        privateTransportInstance.destroy();
        privateTransportInstance = null;
    }
}

// ============================================================================
// Convenience Functions for Obfuscation
// ============================================================================

/**
 * Enable obfuscation on the default transport instance
 */
export function enableObfuscation(config?: Partial<ObfuscationConfig>): void {
    const transportConfig: PrivateTransportConfig = { enableObfuscation: true };
    if (config) {
        transportConfig.obfuscationConfig = config;
    }
    const transport = getPrivateTransport(transportConfig);
    transport.setObfuscationEnabled(true);
}

/**
 * Disable obfuscation on the default transport instance
 */
export function disableObfuscation(): void {
    const transport = getPrivateTransport();
    transport.setObfuscationEnabled(false);
}

/**
 * Quick obfuscate data using default settings
 */
export async function obfuscateData(data: Uint8Array): Promise<Uint8Array[]> {
    const transport = getPrivateTransport({ enableObfuscation: true });
    return transport.obfuscateData(data);
}

/**
 * Quick deobfuscate data using default settings
 */
export function deobfuscateData(packets: Uint8Array[]): Uint8Array | null {
    const transport = getPrivateTransport({ enableObfuscation: true });
    return transport.deobfuscateData(packets);
}

/**
 * Set obfuscation mode
 */
export function setObfuscationMode(mode: 'stealth' | 'balanced' | 'performance'): void {
    const transport = getPrivateTransport({ enableObfuscation: true });
    transport.setObfuscationMode(mode);
}

export default PrivateTransport;
