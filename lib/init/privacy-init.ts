'use client';

/**
 * Privacy Initialization Module
 *
 * Runs privacy checks on app startup and auto-configures settings.
 * Detects VPN leaks, Tor usage, and applies optimal privacy settings.
 *
 * PRIORITY: CRITICAL
 */

import secureLog from '../utils/secure-logger';
import { getVPNLeakDetector, VPNDetectionResult } from '../privacy/vpn-leak-detection';
import { getTorDetector, autoConfigureForTor, TorDetectionResult } from '../privacy/tor-support';
import { getPrivacyLevel, setPrivacyLevel } from '../privacy/relay-routing';
import { resetPrivateTransport } from '../transport/private-webrtc';

// ============================================================================
// Initialization State
// ============================================================================

let isInitialized = false;
let initializationPromise: Promise<PrivacyInitResult> | null = null;

export interface PrivacyInitResult {
    success: boolean;
    vpnDetection: VPNDetectionResult | null;
    torDetection: TorDetectionResult | null;
    autoConfigured: boolean;
    warnings: string[];
}

// ============================================================================
// Privacy Initialization
// ============================================================================

/**
 * Initialize privacy features on app startup
 */
export async function initializePrivacyFeatures(): Promise<PrivacyInitResult> {
    // Return existing promise if already initializing
    if (initializationPromise) {
        return initializationPromise;
    }

    // Return cached result if already initialized
    if (isInitialized) {
        return {
            success: true,
            vpnDetection: null,
            torDetection: null,
            autoConfigured: false,
            warnings: [],
        };
    }

    secureLog.log('[PrivacyInit] Starting privacy initialization...');

    initializationPromise = performInitialization();
    const result = await initializationPromise;

    isInitialized = true;
    initializationPromise = null;

    return result;
}

/**
 * Perform the actual initialization
 */
async function performInitialization(): Promise<PrivacyInitResult> {
    const result: PrivacyInitResult = {
        success: false,
        vpnDetection: null,
        torDetection: null,
        autoConfigured: false,
        warnings: [],
    };

    try {
        // 1. Quick Tor detection (synchronous)
        const torDetector = getTorDetector();
        const quickTorCheck = torDetector.quickCheck();

        if (quickTorCheck) {
            secureLog.log('[PrivacyInit] Tor Browser detected (quick check)');

            // Perform full Tor detection
            result.torDetection = await torDetector.detectTor(false);

            if (result.torDetection.isTorBrowser || result.torDetection.isTorNetwork) {
                // Auto-configure for Tor
                const configured = await autoConfigureForTor();
                result.autoConfigured = configured;

                if (configured) {
                    // Reset WebRTC transport to pick up Tor-friendly settings
                    resetPrivateTransport();
                    secureLog.log('[PrivacyInit] Auto-configured for Tor Browser');
                } else {
                    result.warnings.push('Failed to auto-configure for Tor Browser');
                }
            }
        }

        // 2. VPN/IP leak detection (runs in background)
        const vpnDetector = getVPNLeakDetector();

        // Quick leak check first
        const quickLeaks = await vpnDetector.quickLeakCheck();
        if (quickLeaks.length > 0) {
            secureLog.warn(`[PrivacyInit] Quick WebRTC leak check found ${quickLeaks.length} IPs`);

            // Perform full detection
            result.vpnDetection = await vpnDetector.performPrivacyCheck(false);

            // Auto-enable relay mode if leaks detected
            if (result.vpnDetection.hasWebRTCLeak) {
                const currentLevel = getPrivacyLevel();

                if (currentLevel === 'direct') {
                    try {
                        await setPrivacyLevel('relay');
                        // Reset WebRTC transport to pick up new privacy settings
                        resetPrivateTransport();
                        result.autoConfigured = true;
                        secureLog.log('[PrivacyInit] Auto-enabled relay mode due to WebRTC leaks');
                    } catch (_error) {
                        result.warnings.push('Failed to enable relay mode automatically');
                    }
                }
            }

            // Add warnings based on detection
            if (result.vpnDetection.hasWebRTCLeak) {
                result.warnings.push('WebRTC IP leak detected - relay mode recommended');
            }

            if (result.vpnDetection.isVPNLikely) {
                result.warnings.push('VPN/Proxy detected - ensure relay-only mode is enabled');
            }
        }

        // 3. Check if user has previously configured privacy settings
        const hasConfigured = localStorage.getItem('tallow_privacy_configured') === 'true';

        if (!hasConfigured && !result.autoConfigured) {
            // First-time user, suggest default privacy level
            const currentLevel = getPrivacyLevel();

            if (currentLevel === 'direct') {
                // Suggest relay mode for new users
                result.warnings.push(
                    'First-time setup: Consider enabling relay mode for better privacy'
                );
            }
        }

        result.success = true;
        secureLog.log('[PrivacyInit] Privacy initialization complete:', {
            torDetected: !!result.torDetection,
            vpnDetected: !!result.vpnDetection,
            autoConfigured: result.autoConfigured,
            warningCount: result.warnings.length,
        });

    } catch (error) {
        secureLog.error('[PrivacyInit] Initialization failed:', error);
        result.success = false;
        result.warnings.push('Privacy initialization failed - using default settings');
    }

    return result;
}

/**
 * Reset initialization state (for testing)
 */
export function resetPrivacyInitialization(): void {
    isInitialized = false;
    initializationPromise = null;
}

/**
 * Mark privacy as manually configured
 */
export function markPrivacyConfigured(): void {
    localStorage.setItem('tallow_privacy_configured', 'true');
}

/**
 * Check if privacy has been initialized
 */
export function isPrivacyInitialized(): boolean {
    return isInitialized;
}

// ============================================================================
// Startup Hook
// ============================================================================

/**
 * Run privacy check on window load (client-side only)
 */
if (typeof window !== 'undefined') {
    // Run after a short delay to not block initial render
    setTimeout(() => {
        initializePrivacyFeatures().then((result) => {
            if (result.warnings.length > 0) {
                secureLog.warn('[PrivacyInit] Warnings:', result.warnings);
            }
        }).catch((error) => {
            secureLog.error('[PrivacyInit] Startup check failed:', error);
        });
    }, 1000);
}

export default initializePrivacyFeatures;
