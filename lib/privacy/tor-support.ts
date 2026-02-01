'use client';

/**
 * Tor Support Module
 *
 * Detects Tor browser and automatically optimizes settings for Tor usage.
 * Auto-enables relay-only mode and disables WebRTC for Tor users.
 *
 * SECURITY IMPACT: 8 | PRIVACY IMPACT: 10
 * PRIORITY: HIGH
 */

import secureLog from '../utils/secure-logger';
import { saveProxyConfig } from '../network/proxy-config';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TorDetectionResult {
    isTorBrowser: boolean;
    isTorNetwork: boolean;
    confidence: 'low' | 'medium' | 'high' | 'confirmed';
    detectionMethods: string[];
    recommendedSettings: TorOptimizedSettings;
}

export interface TorOptimizedSettings {
    forceRelay: boolean;
    disableWebRTC: boolean;
    connectionTimeout: number;
    maxRetries: number;
    retryDelay: number;
    preferOnionServices: boolean;
}

// ============================================================================
// Constants
// ============================================================================

// Tor Browser user agent patterns
const TOR_USER_AGENT_PATTERNS = [
    /tor browser/i,
    /torbrowser/i,
];

// Tor Browser specific characteristics
const TOR_BROWSER_RESOLUTIONS = [
    [1000, 1000],
    [1200, 1000],
    [1400, 1000],
    [1600, 1000],
    [1000, 900],
    [1200, 900],
];

// Tor exit node detection services
const TOR_CHECK_SERVICES = [
    'https://check.torproject.org/api/ip',
];

// Optimized settings for Tor
const TOR_OPTIMIZED_SETTINGS: TorOptimizedSettings = {
    forceRelay: true,
    disableWebRTC: true,
    connectionTimeout: 60000, // 60 seconds (Tor is slower)
    maxRetries: 5,
    retryDelay: 5000,
    preferOnionServices: true,
};

// ============================================================================
// Tor Detection Functions
// ============================================================================

/**
 * Check if user agent indicates Tor Browser
 */
function checkUserAgent(): boolean {
    const userAgent = navigator.userAgent;
    return TOR_USER_AGENT_PATTERNS.some(pattern => pattern.test(userAgent));
}

/**
 * Check if screen resolution matches Tor Browser
 */
function checkScreenResolution(): boolean {
    try {
        const width = window.screen.width;
        const height = window.screen.height;

        return TOR_BROWSER_RESOLUTIONS.some(
            ([w, h]) => width === w && height === h
        );
    } catch {
        return false;
    }
}

/**
 * Check for Tor Browser specific features
 */
function checkBrowserFeatures(): { isTorLike: boolean; signals: string[] } {
    const signals: string[] = [];
    let score = 0;

    try {
        // Tor Browser blocks certain APIs
        if (!(navigator as any).getBattery) {
            signals.push('Battery API blocked');
            score++;
        }

        // Tor Browser typically has timezone set to UTC
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone === 'UTC') {
            signals.push('UTC timezone');
            score++;
        }

        // Tor Browser resists fingerprinting
        if (navigator.hardwareConcurrency === 2) {
            signals.push('Limited hardware concurrency');
            score++;
        }

        // Tor Browser typically disables WebGL
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            signals.push('WebGL disabled');
            score++;
        }

        // Check for reduced language list (fingerprinting resistance)
        if (navigator.languages.length <= 2) {
            signals.push('Limited language list');
            score++;
        }

        // Tor Browser disables deviceMemory
        if (!('deviceMemory' in navigator)) {
            signals.push('Device memory API blocked');
            score++;
        }

    } catch (error) {
        secureLog.error('[TorSupport] Feature detection error:', error);
    }

    // If 3 or more signals match, likely Tor Browser
    return {
        isTorLike: score >= 3,
        signals,
    };
}

/**
 * Check if connected via Tor network
 */
async function checkTorNetwork(): Promise<boolean> {
    for (const service of TOR_CHECK_SERVICES) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(service, {
                signal: controller.signal,
                cache: 'no-store',
            });
            clearTimeout(timeout);

            if (response.ok) {
                const data = await response.json();
                // Tor Project API returns { IsTor: true } if using Tor
                if (data.IsTor === true) {
                    secureLog.log('[TorSupport] Confirmed: Using Tor network');
                    return true;
                }
            }
        } catch (error) {
            secureLog.warn(`[TorSupport] Tor network check failed for ${service}:`, error);
        }
    }

    return false;
}

// ============================================================================
// Tor Detection Class
// ============================================================================

export class TorDetector {
    private cachedResult: TorDetectionResult | null = null;
    private cacheExpiry: number = 0;
    private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

    /**
     * Perform comprehensive Tor detection
     */
    async detectTor(useCache = true): Promise<TorDetectionResult> {
        // Return cached result if valid
        if (useCache && this.cachedResult && Date.now() < this.cacheExpiry) {
            secureLog.log('[TorDetector] Using cached result');
            return this.cachedResult;
        }

        secureLog.log('[TorDetector] Starting Tor detection...');

        const detectionMethods: string[] = [];
        let confidenceScore = 0;

        // 1. Check user agent
        const isUserAgentTor = checkUserAgent();
        if (isUserAgentTor) {
            detectionMethods.push('Tor Browser user agent detected');
            confidenceScore += 40;
        }

        // 2. Check screen resolution
        const isResolutionTor = checkScreenResolution();
        if (isResolutionTor) {
            detectionMethods.push('Tor Browser screen resolution detected');
            confidenceScore += 20;
        }

        // 3. Check browser features
        const { isTorLike, signals } = checkBrowserFeatures();
        if (isTorLike) {
            detectionMethods.push(`Tor Browser features detected: ${signals.join(', ')}`);
            confidenceScore += 30;
        }

        // 4. Check if on Tor network (async, may fail)
        let isTorNetwork = false;
        try {
            isTorNetwork = await checkTorNetwork();
            if (isTorNetwork) {
                detectionMethods.push('Confirmed connection via Tor network');
                confidenceScore += 50;
            }
        } catch (error) {
            secureLog.warn('[TorDetector] Network check failed:', error);
        }

        // Determine confidence level
        let confidence: 'low' | 'medium' | 'high' | 'confirmed';
        if (confidenceScore >= 80 || isTorNetwork) {
            confidence = 'confirmed';
        } else if (confidenceScore >= 50) {
            confidence = 'high';
        } else if (confidenceScore >= 30) {
            confidence = 'medium';
        } else {
            confidence = 'low';
        }

        const result: TorDetectionResult = {
            isTorBrowser: confidenceScore >= 40,
            isTorNetwork,
            confidence,
            detectionMethods,
            recommendedSettings: TOR_OPTIMIZED_SETTINGS,
        };

        // Cache result
        this.cachedResult = result;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;

        secureLog.log('[TorDetector] Detection complete:', result);

        return result;
    }

    /**
     * Quick synchronous check (no network requests)
     */
    quickCheck(): boolean {
        const isUserAgentTor = checkUserAgent();
        const isResolutionTor = checkScreenResolution();
        const { isTorLike } = checkBrowserFeatures();

        return isUserAgentTor || isResolutionTor || isTorLike;
    }

    /**
     * Clear cached results
     */
    clearCache(): void {
        this.cachedResult = null;
        this.cacheExpiry = 0;
    }

    /**
     * Get optimal settings for Tor
     */
    getOptimalSettings(): TorOptimizedSettings {
        return { ...TOR_OPTIMIZED_SETTINGS };
    }
}

// ============================================================================
// Auto-Configuration
// ============================================================================

/**
 * Automatically configure app for Tor usage
 */
export async function autoConfigureForTor(): Promise<boolean> {
    const detector = new TorDetector();
    const result = await detector.detectTor();

    if (result.isTorBrowser || result.isTorNetwork) {
        secureLog.log('[TorSupport] Tor detected, applying optimized settings...');

        try {
            // Apply Tor-optimized proxy configuration
            await saveProxyConfig({
                mode: 'relay-only',
                forceRelay: true,
                connectionTimeout: result.recommendedSettings.connectionTimeout,
                maxRetries: result.recommendedSettings.maxRetries,
                retryDelay: result.recommendedSettings.retryDelay,
            });

            // Store Tor detection state
            localStorage.setItem('tallow_tor_detected', 'true');
            localStorage.setItem('tallow_tor_confidence', result.confidence);

            secureLog.log('[TorSupport] Tor-optimized settings applied successfully');
            return true;
        } catch (error) {
            secureLog.error('[TorSupport] Failed to apply Tor settings:', error);
            return false;
        }
    }

    return false;
}

/**
 * Check if Tor was previously detected
 */
export function wasTorDetected(): boolean {
    return localStorage.getItem('tallow_tor_detected') === 'true';
}

/**
 * Reset Tor detection state
 */
export function resetTorDetection(): void {
    localStorage.removeItem('tallow_tor_detected');
    localStorage.removeItem('tallow_tor_confidence');
}

// ============================================================================
// Singleton Instance
// ============================================================================

let detectorInstance: TorDetector | null = null;

/**
 * Get or create the Tor detector singleton
 */
export function getTorDetector(): TorDetector {
    if (!detectorInstance) {
        detectorInstance = new TorDetector();
    }
    return detectorInstance;
}

export default TorDetector;
