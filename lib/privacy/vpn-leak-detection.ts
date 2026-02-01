'use client';

/**
 * VPN Leak Detection Module
 *
 * Detects VPN/proxy usage and potential IP leaks via WebRTC.
 * Provides warnings when VPN is detected and recommends relay-only mode.
 *
 * SECURITY IMPACT: 9 | PRIVACY IMPACT: 10
 * PRIORITY: CRITICAL
 */

import secureLog from '../utils/secure-logger';

// ============================================================================
// Type Definitions
// ============================================================================

export interface IPInfo {
    localIP: string | null;
    publicIP: string | null;
    webRTCIPs: string[];
    vpnDetected: boolean;
    leakDetected: boolean;
    timestamp: number;
}

export interface VPNDetectionResult {
    isVPNLikely: boolean;
    hasWebRTCLeak: boolean;
    publicIP: string | null;
    leakedIPs: string[];
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface PrivacyCheckListener {
    onVPNDetected?: (result: VPNDetectionResult) => void;
    onIPLeakDetected?: (leakedIPs: string[]) => void;
    onCheckComplete?: (result: VPNDetectionResult) => void;
}

// ============================================================================
// Constants
// ============================================================================

// IP lookup services (privacy-respecting, no Google)
const IP_LOOKUP_SERVICES = [
    'https://api.ipify.org?format=json',
    'https://ifconfig.me/ip',
    'https://icanhazip.com',
];

// Private IP ranges (RFC 1918 + others)
const PRIVATE_IP_PATTERNS = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^169\.254\./,              // Link-local (169.254.0.0/16)
    /^127\./,                   // Loopback
    /^::1$/,                    // IPv6 loopback
    /^fe80:/i,                  // IPv6 link-local
    /^fc00:/i,                  // IPv6 unique local
    /^fd00:/i,                  // IPv6 unique local
];

// Reserved/special IP ranges
const RESERVED_IP_PATTERNS = [
    /^0\./,                     // Current network
    /^100\.6[4-9]\./,           // Carrier-grade NAT
    /^100\.[7-9]\d\./,
    /^100\.1[0-1]\d\./,
    /^100\.12[0-7]\./,
    /^192\.0\.0\./,             // IETF Protocol Assignments
    /^192\.0\.2\./,             // TEST-NET-1
    /^198\.51\.100\./,          // TEST-NET-2
    /^203\.0\.113\./,           // TEST-NET-3
    /^224\./,                   // Multicast
    /^240\./,                   // Reserved for future use
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an IP address is private/local
 */
function isPrivateIP(ip: string): boolean {
    return PRIVATE_IP_PATTERNS.some(pattern => pattern.test(ip));
}

/**
 * Check if an IP address is reserved/special
 */
function isReservedIP(ip: string): boolean {
    return RESERVED_IP_PATTERNS.some(pattern => pattern.test(ip));
}

/**
 * Extract IP addresses from WebRTC ICE candidates
 */
function extractIPsFromCandidate(candidate: string): string[] {
    const ips: string[] = [];

    // IPv4 pattern
    const ipv4Regex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;
    const ipv4Matches = candidate.match(ipv4Regex);
    if (ipv4Matches) {
        ips.push(...ipv4Matches);
    }

    // IPv6 pattern (simplified)
    const ipv6Regex = /([a-fA-F0-9]{1,4}(:[a-fA-F0-9]{1,4}){7})/g;
    const ipv6Matches = candidate.match(ipv6Regex);
    if (ipv6Matches) {
        ips.push(...ipv6Matches);
    }

    return ips;
}

// ============================================================================
// VPN Leak Detection Class
// ============================================================================

export class VPNLeakDetector {
    private listeners: PrivacyCheckListener[] = [];
    private cachedResult: VPNDetectionResult | null = null;
    private cacheExpiry: number = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    private lastWarningTime = 0;
    private lastWarningIPCount = 0;
    private readonly WARNING_THROTTLE_MS = 5000; // Show warning at most once per 5 seconds

    /**
     * Add a listener for privacy check events
     */
    addListener(listener: PrivacyCheckListener): void {
        this.listeners.push(listener);
    }

    /**
     * Remove a listener
     */
    removeListener(listener: PrivacyCheckListener): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Perform comprehensive privacy check
     */
    async performPrivacyCheck(useCache = true): Promise<VPNDetectionResult> {
        // Return cached result if valid
        if (useCache && this.cachedResult && Date.now() < this.cacheExpiry) {
            secureLog.log('[VPNLeakDetector] Using cached result');
            return this.cachedResult;
        }

        secureLog.log('[VPNLeakDetector] Starting comprehensive privacy check...');

        const result: VPNDetectionResult = {
            isVPNLikely: false,
            hasWebRTCLeak: false,
            publicIP: null,
            leakedIPs: [],
            recommendations: [],
            riskLevel: 'low',
        };

        try {
            // 1. Get public IP address
            result.publicIP = await this.getPublicIP();

            // 2. Detect WebRTC IP leaks
            const webRTCIPs = await this.detectWebRTCLeaks();

            // 3. Analyze results
            this.analyzeResults(result, webRTCIPs);

            // 4. Generate recommendations
            this.generateRecommendations(result);

            // 5. Notify listeners
            this.notifyListeners(result);

            // Cache result
            this.cachedResult = result;
            this.cacheExpiry = Date.now() + this.CACHE_DURATION;

            secureLog.log('[VPNLeakDetector] Privacy check complete:', result);

        } catch (error) {
            secureLog.error('[VPNLeakDetector] Privacy check failed:', error);
            result.riskLevel = 'medium';
            result.recommendations.push('Privacy check failed. Enable relay-only mode for maximum protection.');
        }

        return result;
    }

    /**
     * Get public IP address from external service
     */
    private async getPublicIP(): Promise<string | null> {
        for (const service of IP_LOOKUP_SERVICES) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(service, {
                    signal: controller.signal,
                    cache: 'no-store',
                });
                clearTimeout(timeout);

                if (response.ok) {
                    const text = await response.text();
                    // Handle both JSON and plain text responses
                    let ip: string;
                    try {
                        const json = JSON.parse(text);
                        ip = json.ip || text.trim();
                    } catch {
                        ip = text.trim();
                    }

                    secureLog.log(`[VPNLeakDetector] Public IP detected: ${ip.substring(0, 8)}...`);
                    return ip;
                }
            } catch (error) {
                secureLog.warn(`[VPNLeakDetector] Failed to fetch IP from ${service}:`, error);
                continue;
            }
        }

        secureLog.warn('[VPNLeakDetector] Could not determine public IP from any service');
        return null;
    }

    /**
     * Detect IP leaks via WebRTC
     */
    private async detectWebRTCLeaks(): Promise<string[]> {
        return new Promise((resolve) => {
            const ips = new Set<string>();
            let pc: RTCPeerConnection | null = null;
            const warningShown = false; // Track if we've already shown a warning for this check

            const timeout = setTimeout(() => {
                if (pc) {pc.close();}

                // Show consolidated warning after all IPs are collected
                if (ips.size > 0 && !warningShown) {
                    this.logLeakWarning(ips.size);
                }

                resolve(Array.from(ips));
            }, 3000);

            try {
                // Create a temporary RTCPeerConnection
                pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.nextcloud.com:443' },
                        { urls: 'stun:stun.stunprotocol.org:3478' }
                    ]
                });

                // Create a dummy data channel to trigger ICE gathering
                pc.createDataChannel('');

                pc.onicecandidate = (event) => {
                    if (!event.candidate) {return;}

                    const candidate = event.candidate.candidate;
                    const extractedIPs = extractIPsFromCandidate(candidate);

                    extractedIPs.forEach(ip => {
                        // Only collect non-private IPs
                        if (!isPrivateIP(ip) && !isReservedIP(ip)) {
                            const isNewIP = !ips.has(ip);
                            ips.add(ip);

                            // Log individual IP at debug level only (not warning)
                            if (isNewIP) {
                                secureLog.log(`[VPNLeakDetector] WebRTC IP detected: ${ip.substring(0, 8)}...`);
                            }
                        }
                    });
                };

                // Create and set local description to start ICE gathering
                if (pc) {
                    pc.createOffer().then(offer => pc && pc.setLocalDescription(offer)).catch(() => {});
                }

            } catch (error) {
                secureLog.error('[VPNLeakDetector] WebRTC leak detection failed:', error);
                clearTimeout(timeout);
                resolve([]);
            }
        });
    }

    /**
     * Log a throttled warning about IP leaks
     * Only shows warning once per WARNING_THROTTLE_MS period
     */
    private logLeakWarning(ipCount: number): void {
        const now = Date.now();

        // Throttle warnings - only show if enough time has passed OR IP count changed
        if (
            now - this.lastWarningTime < this.WARNING_THROTTLE_MS &&
            ipCount === this.lastWarningIPCount
        ) {
            // Skip duplicate warning
            return;
        }

        this.lastWarningTime = now;
        this.lastWarningIPCount = ipCount;

        secureLog.warn(
            `[VPNLeakDetector] WebRTC IP leak detected: ${ipCount} IP${ipCount !== 1 ? 's' : ''} found`
        );
    }

    /**
     * Analyze detection results
     */
    private analyzeResults(result: VPNDetectionResult, webRTCIPs: string[]): void {
        // Check for WebRTC leaks
        if (webRTCIPs.length > 0) {
            result.hasWebRTCLeak = true;
            result.leakedIPs = webRTCIPs;

            // If leaked IPs differ from public IP, VPN is likely being used
            if (result.publicIP && !webRTCIPs.includes(result.publicIP)) {
                result.isVPNLikely = true;
            }
        }

        // Determine risk level
        if (result.hasWebRTCLeak && result.isVPNLikely) {
            result.riskLevel = 'critical';
        } else if (result.hasWebRTCLeak) {
            result.riskLevel = 'high';
        } else if (result.isVPNLikely) {
            result.riskLevel = 'medium';
        } else {
            result.riskLevel = 'low';
        }
    }

    /**
     * Generate privacy recommendations
     */
    private generateRecommendations(result: VPNDetectionResult): void {
        if (result.hasWebRTCLeak) {
            result.recommendations.push(
                'WebRTC IP leak detected! Your real IP may be exposed.',
                'Enable "Relay-only mode" in settings to prevent IP leaks.',
                'Consider using a browser with WebRTC disabled or controlled.'
            );
        }

        if (result.isVPNLikely) {
            result.recommendations.push(
                'VPN/Proxy detected. Use relay-only mode to prevent IP leaks.',
                'Ensure your VPN has a kill switch enabled.',
                'Consider using Tor Browser for maximum anonymity.'
            );
        }

        if (result.riskLevel === 'low') {
            result.recommendations.push(
                'No immediate privacy concerns detected.',
                'For maximum privacy, consider enabling relay-only mode.'
            );
        }
    }

    /**
     * Notify all listeners of check results
     */
    private notifyListeners(result: VPNDetectionResult): void {
        this.listeners.forEach(listener => {
            try {
                if (result.isVPNLikely && listener.onVPNDetected) {
                    listener.onVPNDetected(result);
                }

                if (result.hasWebRTCLeak && listener.onIPLeakDetected) {
                    listener.onIPLeakDetected(result.leakedIPs);
                }

                if (listener.onCheckComplete) {
                    listener.onCheckComplete(result);
                }
            } catch (error) {
                secureLog.error('[VPNLeakDetector] Listener notification failed:', error);
            }
        });
    }

    /**
     * Clear cached results
     */
    clearCache(): void {
        this.cachedResult = null;
        this.cacheExpiry = 0;
    }

    /**
     * Quick check: Just detect WebRTC leaks (faster)
     */
    async quickLeakCheck(): Promise<string[]> {
        return await this.detectWebRTCLeaks();
    }

    /**
     * Check if Tor Browser is being used
     */
    isTorBrowser(): boolean {
        // Tor Browser typically has specific user agent patterns
        const userAgent = navigator.userAgent.toLowerCase();

        // Check for Tor Browser specific markers
        if (userAgent.includes('tor browser')) {
            return true;
        }

        // Check for reduced fingerprinting (Tor Browser resists fingerprinting)
        try {
            // Tor Browser typically rounds screen dimensions
            const screenWidth = window.screen.width;
            const screenHeight = window.screen.height;

            // Common Tor Browser resolutions
            const torResolutions = [
                [1000, 1000], [1200, 1000], [1400, 1000], [1600, 1000]
            ];

            const isTorResolution = torResolutions.some(
                ([w, h]) => screenWidth === w && screenHeight === h
            );

            if (isTorResolution) {
                secureLog.log('[VPNLeakDetector] Tor Browser likely detected (screen resolution)');
                return true;
            }
        } catch (_error) {
            // Error accessing screen info might indicate privacy protections
        }

        return false;
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let detectorInstance: VPNLeakDetector | null = null;

/**
 * Get or create the VPN leak detector singleton
 */
export function getVPNLeakDetector(): VPNLeakDetector {
    if (!detectorInstance) {
        detectorInstance = new VPNLeakDetector();
    }
    return detectorInstance;
}

/**
 * Perform a quick privacy check on app load
 */
export async function performStartupPrivacyCheck(): Promise<VPNDetectionResult> {
    const detector = getVPNLeakDetector();
    return await detector.performPrivacyCheck();
}

export default VPNLeakDetector;
