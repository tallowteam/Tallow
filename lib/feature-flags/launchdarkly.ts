/**
 * LaunchDarkly Feature Flags Configuration
 * Provides centralized feature flag management for controlled rollouts
 */

'use client';

import { LDClient, LDFlagSet, LDContext, LDFlagValue } from 'launchdarkly-js-client-sdk';
import { secureLog } from '../utils/secure-logger';

/**
 * JSON-serializable data for tracking events
 */
export type TrackEventData = Record<string, string | number | boolean | null | undefined>;

/**
 * User attributes for identification
 */
export type UserAttributes = Record<string, LDFlagValue>;

// Feature flag keys
export const FeatureFlags = {
  VOICE_COMMANDS: 'voice-commands',
  CAMERA_CAPTURE: 'camera-capture',
  METADATA_STRIPPING: 'metadata-stripping',
  ONE_TIME_TRANSFERS: 'one-time-transfers',
  PQC_ENCRYPTION: 'pqc-encryption',
  ADVANCED_PRIVACY: 'advanced-privacy',
  QR_CODE_SHARING: 'qr-code-sharing',
  EMAIL_SHARING: 'email-sharing',
  LINK_EXPIRATION: 'link-expiration',
  CUSTOM_THEMES: 'custom-themes',
  MOBILE_APP_PROMO: 'mobile-app-promo',
  DONATION_PROMPTS: 'donation-prompts',
} as const;

export type FeatureFlagKey = typeof FeatureFlags[keyof typeof FeatureFlags];

/**
 * Default feature flag values (fallback when LaunchDarkly is unavailable)
 */
export const DEFAULT_FLAGS: Record<FeatureFlagKey, boolean> = {
  [FeatureFlags.VOICE_COMMANDS]: false,
  [FeatureFlags.CAMERA_CAPTURE]: true,
  [FeatureFlags.METADATA_STRIPPING]: true,
  [FeatureFlags.ONE_TIME_TRANSFERS]: true,
  [FeatureFlags.PQC_ENCRYPTION]: true,
  [FeatureFlags.ADVANCED_PRIVACY]: true,
  [FeatureFlags.QR_CODE_SHARING]: true,
  [FeatureFlags.EMAIL_SHARING]: true,
  [FeatureFlags.LINK_EXPIRATION]: false,
  [FeatureFlags.CUSTOM_THEMES]: false,
  [FeatureFlags.MOBILE_APP_PROMO]: false,
  [FeatureFlags.DONATION_PROMPTS]: true,
};

/**
 * LaunchDarkly client instance
 */
let ldClient: LDClient | null = null;

/**
 * Track if we've already logged the "not configured" message
 * to avoid spamming console on every page load
 */
let hasLoggedNotConfigured = false;

/**
 * Initialize LaunchDarkly client
 */
export async function initLaunchDarkly(userId?: string): Promise<LDClient | null> {
  if (typeof window === 'undefined') {
    // Server-side is expected, don't warn
    return null;
  }

  const clientSideId = process.env['NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID'];

  if (!clientSideId) {
    // Only log once per session to avoid console spam
    if (!hasLoggedNotConfigured) {
      secureLog.debug('[LaunchDarkly] Client ID not configured. Using default feature flags.');
      hasLoggedNotConfigured = true;
    }
    return null;
  }

  if (ldClient) {
    return ldClient;
  }

  try {
    const { initialize } = await import('launchdarkly-js-client-sdk');

    // Create user context
    const context: LDContext = {
      kind: 'user',
      key: userId || generateAnonymousUserId(),
      anonymous: !userId,
    };

    // Initialize client
    ldClient = initialize(clientSideId, context, {
      // Respect user privacy
      sendEvents: process.env.NODE_ENV === 'production',

      // Stream updates for real-time flag changes
      streaming: true,

      // Bootstrap with default flags
      bootstrap: DEFAULT_FLAGS,

      // Evaluate all flags on initialization
      evaluationReasons: process.env.NODE_ENV === 'development',

      // Application metadata
      application: {
        id: 'tallow',
        version: process.env['NEXT_PUBLIC_APP_VERSION'] || '1.0.0',
      },
    });

    // Wait for initialization
    await ldClient.waitForInitialization();

    secureLog.log('[LaunchDarkly] Initialized successfully');

    return ldClient;
  } catch (error) {
    secureLog.error('[LaunchDarkly] Initialization failed:', error);
    return null;
  }
}

/**
 * Get LaunchDarkly client instance
 */
export function getLaunchDarklyClient(): LDClient | null {
  return ldClient;
}

/**
 * Get a feature flag value
 */
export function getFeatureFlag(flagKey: FeatureFlagKey, defaultValue?: boolean): boolean {
  if (!ldClient) {
    return defaultValue ?? DEFAULT_FLAGS[flagKey];
  }

  try {
    return ldClient.variation(flagKey, defaultValue ?? DEFAULT_FLAGS[flagKey]);
  } catch (error) {
    secureLog.error(`[LaunchDarkly] Error getting flag ${flagKey}:`, error);
    return defaultValue ?? DEFAULT_FLAGS[flagKey];
  }
}

/**
 * Get all feature flags
 */
export function getAllFeatureFlags(): LDFlagSet {
  if (!ldClient) {
    return DEFAULT_FLAGS;
  }

  try {
    return ldClient.allFlags();
  } catch (error) {
    secureLog.error('[LaunchDarkly] Error getting all flags:', error);
    return DEFAULT_FLAGS;
  }
}

/**
 * Track a custom event in LaunchDarkly
 */
export function trackFeatureFlagEvent(eventKey: string, data?: TrackEventData, metricValue?: number) {
  if (!ldClient) {
    // Client not initialized is expected behavior when not configured
    secureLog.debug('[LaunchDarkly] Client not initialized - cannot track event');
    return;
  }

  try {
    ldClient.track(eventKey, data, metricValue);
  } catch (error) {
    secureLog.error(`[LaunchDarkly] Error tracking event ${eventKey}:`, error);
  }
}

/**
 * Update user context (e.g., when user logs in)
 */
export async function identifyUser(userId: string, attributes?: UserAttributes) {
  if (!ldClient) {
    // Client not initialized is expected behavior when not configured
    secureLog.debug('[LaunchDarkly] Client not initialized - cannot identify user');
    return;
  }

  try {
    const context: LDContext = {
      kind: 'user',
      key: userId,
      anonymous: false,
      ...attributes,
    };

    await ldClient.identify(context);
    secureLog.log('[LaunchDarkly] User identified:', userId);
  } catch (error) {
    secureLog.error('[LaunchDarkly] Error identifying user:', error);
  }
}

/**
 * Close LaunchDarkly client (cleanup)
 */
export async function closeLaunchDarkly() {
  if (ldClient) {
    try {
      await ldClient.close();
      ldClient = null;
      secureLog.log('[LaunchDarkly] Client closed');
    } catch (error) {
      secureLog.error('[LaunchDarkly] Error closing client:', error);
    }
  }
}

/**
 * Generate anonymous user ID
 */
function generateAnonymousUserId(): string {
  // Check if we have a stored anonymous ID
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('ld-anonymous-id');
    if (stored) {return stored;}

    // Generate new anonymous ID
    const newId = `anon-${crypto.randomUUID()}`;
    localStorage.setItem('ld-anonymous-id', newId);
    return newId;
  }

  return `anon-${Date.now()}`;
}

/**
 * Listen for flag changes
 */
export function onFlagChange(flagKey: FeatureFlagKey, callback: (newValue: boolean) => void) {
  if (!ldClient) {
    // Client not initialized is expected behavior when not configured
    secureLog.debug('[LaunchDarkly] Client not initialized - cannot listen for changes');
    return () => {};
  }

  const listener = (current: LDFlagValue) => {
    callback(current as boolean);
  };

  ldClient.on(`change:${flagKey}`, listener);

  // Return cleanup function
  return () => {
    ldClient?.off(`change:${flagKey}`, listener);
  };
}

/**
 * Flush pending events (useful before page unload)
 */
export async function flushEvents() {
  if (ldClient) {
    try {
      await ldClient.flush();
    } catch (error) {
      secureLog.error('[LaunchDarkly] Error flushing events:', error);
    }
  }
}
