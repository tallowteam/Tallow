/**
 * Feature Flags API Endpoint
 *
 * GET /api/flags - Returns current feature flag configuration
 *
 * Reads from environment variables with the format:
 * FEATURE_FLAG_CHAT_ENABLED=true
 * FEATURE_FLAG_DEBUG_MODE=false
 *
 * Falls back to defaults if environment variables are not set.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { withAPIMetrics } from '@/lib/middleware/api-metrics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type FeatureFlagKey =
  | 'chat_enabled'
  | 'voice_memos'
  | 'location_sharing'
  | 'screen_sharing'
  | 'broadcast_mode'
  | 'scheduled_transfers'
  | 'team_workspaces'
  | 'browser_extension_api'
  | 'share_sheet_integrations'
  | 'nfc_pairing'
  | 'qr_linking'
  | 'clipboard_sharing'
  | 'advanced_compression'
  | 'delta_sync'
  | 'webauthn'
  | 'webtransport'
  | 'plausible_analytics'
  | 'sentry_tracking'
  | 'i18n_enabled'
  | 'guest_mode'
  | 'experimental_pqc'
  | 'debug_mode';

type FeatureFlagValues = Record<FeatureFlagKey, boolean>;

// ============================================================================
// DEFAULT FLAGS
// ============================================================================

const DEFAULT_FLAGS: FeatureFlagValues = {
  // Core features - enabled by default
  chat_enabled: true,
  voice_memos: true,
  location_sharing: false, // Privacy-sensitive
  screen_sharing: true,
  broadcast_mode: true,
  scheduled_transfers: true,
  team_workspaces: true,

  // Integration features
  browser_extension_api: true,
  share_sheet_integrations: false,
  nfc_pairing: false,
  qr_linking: false,
  clipboard_sharing: false,

  // Advanced features
  advanced_compression: true,
  delta_sync: true,

  // Authentication
  webauthn: true,

  // Experimental transport
  webtransport: false, // Experimental

  // Analytics & tracking - disabled by default for privacy
  plausible_analytics: false,
  sentry_tracking: false,

  // Localization
  i18n_enabled: true,

  // Privacy features
  guest_mode: true,

  // Experimental features
  experimental_pqc: true,

  // Developer features
  debug_mode: false,
};

// ============================================================================
// ENVIRONMENT VARIABLE MAPPING
// ============================================================================

/**
 * Map feature flag keys to environment variable names
 */
const FLAG_ENV_MAP: Record<FeatureFlagKey, string> = {
  chat_enabled: 'FEATURE_FLAG_CHAT_ENABLED',
  voice_memos: 'FEATURE_FLAG_VOICE_MEMOS',
  location_sharing: 'FEATURE_FLAG_LOCATION_SHARING',
  screen_sharing: 'FEATURE_FLAG_SCREEN_SHARING',
  broadcast_mode: 'FEATURE_FLAG_BROADCAST_MODE',
  scheduled_transfers: 'FEATURE_FLAG_SCHEDULED_TRANSFERS',
  team_workspaces: 'FEATURE_FLAG_TEAM_WORKSPACES',
  browser_extension_api: 'FEATURE_FLAG_BROWSER_EXTENSION_API',
  share_sheet_integrations: 'FEATURE_FLAG_SHARE_SHEET_INTEGRATIONS',
  nfc_pairing: 'FEATURE_FLAG_NFC_PAIRING',
  qr_linking: 'FEATURE_FLAG_QR_LINKING',
  clipboard_sharing: 'FEATURE_FLAG_CLIPBOARD_SHARING',
  advanced_compression: 'FEATURE_FLAG_ADVANCED_COMPRESSION',
  delta_sync: 'FEATURE_FLAG_DELTA_SYNC',
  webauthn: 'FEATURE_FLAG_WEBAUTHN',
  webtransport: 'FEATURE_FLAG_WEBTRANSPORT',
  plausible_analytics: 'FEATURE_FLAG_PLAUSIBLE_ANALYTICS',
  sentry_tracking: 'FEATURE_FLAG_SENTRY_TRACKING',
  i18n_enabled: 'FEATURE_FLAG_I18N_ENABLED',
  guest_mode: 'FEATURE_FLAG_GUEST_MODE',
  experimental_pqc: 'FEATURE_FLAG_EXPERIMENTAL_PQC',
  debug_mode: 'FEATURE_FLAG_DEBUG_MODE',
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse a boolean value from environment variable
 * Supports: true, false, 1, 0, yes, no, on, off
 */
function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }

  const normalized = value.toLowerCase().trim();

  switch (normalized) {
    case 'true':
    case '1':
    case 'yes':
    case 'on':
    case 'enabled':
      return true;

    case 'false':
    case '0':
    case 'no':
    case 'off':
    case 'disabled':
      return false;

    default:
      return defaultValue;
  }
}

/**
 * Load feature flags from environment variables
 */
function loadFlagsFromEnvironment(): FeatureFlagValues {
  const flags: FeatureFlagValues = { ...DEFAULT_FLAGS };

  // Read each flag from environment
  (Object.keys(FLAG_ENV_MAP) as FeatureFlagKey[]).forEach((flagKey) => {
    const envVar = FLAG_ENV_MAP[flagKey];
    const envValue = process.env[envVar];
    flags[flagKey] = parseEnvBoolean(envValue, DEFAULT_FLAGS[flagKey]);
  });

  return flags;
}

// ============================================================================
// API HANDLER
// ============================================================================

/**
 * GET /api/flags
 * Returns current feature flag configuration
 */
export const GET = withAPIMetrics(async (_request: NextRequest): Promise<NextResponse> => {
  try {
    // Load flags from environment variables
    const flags = loadFlagsFromEnvironment();

    return jsonResponse(
      {
        flags,
        timestamp: new Date().toISOString(),
        source: 'environment',
      },
      200
    );
  } catch (error) {
    // On error, return defaults
    return jsonResponse(
      {
        flags: DEFAULT_FLAGS,
        timestamp: new Date().toISOString(),
        source: 'defaults',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      200 // Still return 200 with defaults
    );
  }
});
