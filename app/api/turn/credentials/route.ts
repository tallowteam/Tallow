/**
 * TURN Credentials API Endpoint
 *
 * GET /api/turn/credentials
 *
 * Returns temporary TURN server credentials for WebRTC NAT traversal.
 * Credentials are time-limited (12 hours default) and generated using the
 * first available provider in the fallback chain:
 *
 *   1. Cloudflare TURN (managed service, global edge, primary)
 *   2. Twilio NTS (managed service, global, fallback)
 *   3. Coturn HMAC-SHA1 long-term credentials (self-hosted)
 *   4. Static credentials from environment variables (last resort)
 *
 * All providers generate TURN URLs for both UDP and TCP transports to
 * ensure connectivity through restrictive firewalls.
 *
 * Security:
 *   - Rate limited to 10 requests/minute per IP
 *   - Credentials expire after 12 hours (configurable via ?ttl= query param)
 *   - HMAC-based credential generation prevents credential forgery
 *   - Shared secrets and API tokens never exposed to clients
 *   - Response includes expiry timestamp for client-side caching
 *   - No-store cache headers prevent credential caching by intermediaries
 *
 * Fallback chain:
 *   P2P (direct) -> STUN -> TURN-UDP -> TURN-TCP -> TURNS-TCP -> Relay
 *
 * Environment variables:
 *   Cloudflare TURN:
 *     - CLOUDFLARE_TURN_API_TOKEN
 *     - CLOUDFLARE_TURN_KEY_ID
 *     - CLOUDFLARE_TURN_TTL (optional, seconds, default 43200)
 *
 *   Twilio NTS:
 *     - TWILIO_ACCOUNT_SID
 *     - TWILIO_AUTH_TOKEN
 *     - TWILIO_TURN_TTL (optional, seconds, default 43200)
 *
 *   Self-hosted coturn:
 *     - COTURN_HOST (hostname or IP)
 *     - COTURN_SHARED_SECRET
 *     - COTURN_PORT (optional, default 3478)
 *     - COTURN_TLS_PORT (optional, default 443)
 *     - COTURN_REALM (optional)
 *     - COTURN_TTL (optional, seconds, default 43200)
 *
 *   Static fallback:
 *     - TURN_SERVER_URL (or NEXT_PUBLIC_TURN_SERVER)
 *     - TURN_USERNAME (or NEXT_PUBLIC_TURN_USERNAME)
 *     - TURN_CREDENTIAL (or NEXT_PUBLIC_TURN_CREDENTIAL)
 */

import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse, ApiErrors } from '@/lib/api/response';
import { createRateLimiter } from '@/lib/middleware/rate-limit';
import {
  resolveCredentials,
  getTurnConfigSummary,
  type TURNCredentialSet,
  type TURNProvider,
} from '@/lib/network/turn-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// Constants
// ============================================================================

/** Maximum allowed TTL in seconds (12 hours) */
const MAX_CREDENTIAL_TTL = 43200;

/** Minimum allowed TTL in seconds (5 minutes) */
const MIN_CREDENTIAL_TTL = 300;

// ============================================================================
// Rate Limiter
// ============================================================================

const turnRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000, // 1 minute
  message: 'Too many TURN credential requests. Please try again later.',
});

// ============================================================================
// Response Types
// ============================================================================

interface TURNCredentialResponse {
  /** ICE servers ready for RTCPeerConnection configuration */
  iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
  /** Credential expiry timestamp (ms since epoch) */
  expiresAt: number;
  /** TTL in seconds */
  ttl: number;
  /** Which provider generated these credentials */
  provider: TURNProvider;
  /** Fallback chain position description */
  fallbackChain: string;
}

// ============================================================================
// GET Handler
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  // --- Rate limiting ---
  const rateLimitResult = turnRateLimiter.check(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    // --- Parse and validate TTL ---
    const url = new URL(request.url);
    const requestedTtl = url.searchParams.get('ttl');

    let ttlSeconds = MAX_CREDENTIAL_TTL;
    if (requestedTtl) {
      const parsed = parseInt(requestedTtl, 10);
      if (isNaN(parsed) || parsed < MIN_CREDENTIAL_TTL || parsed > MAX_CREDENTIAL_TTL) {
        return ApiErrors.badRequest(
          `Invalid TTL parameter. Must be between ${MIN_CREDENTIAL_TTL} and ${MAX_CREDENTIAL_TTL} seconds.`
        );
      }
      ttlSeconds = parsed;
    }

    // --- Resolve credentials from fallback chain ---
    const credentials: TURNCredentialSet = await resolveCredentials(ttlSeconds);

    // --- Build response ---
    const response: TURNCredentialResponse = {
      iceServers: credentials.iceServers.map((s) => ({
        urls: s.urls,
        ...(s.username ? { username: s.username } : {}),
        ...(s.credential ? { credential: s.credential } : {}),
      })),
      expiresAt: credentials.expiresAt,
      ttl: credentials.ttl,
      provider: credentials.provider,
      fallbackChain: 'P2P -> STUN -> TURN-UDP -> TURN-TCP -> TURNS-TCP -> Relay',
    };

    // If no TURN servers are configured, return 200 with empty iceServers
    // and a helpful message. The client will fall back to STUN-only.
    if (credentials.provider === 'none') {
      return jsonResponse(
        {
          ...response,
          message:
            'No TURN servers configured. Connections will use STUN only. ' +
            'Set CLOUDFLARE_TURN_API_TOKEN + CLOUDFLARE_TURN_KEY_ID, or ' +
            'TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN, or ' +
            'COTURN_HOST + COTURN_SHARED_SECRET to enable TURN.',
        },
        200,
        {
          // No credential caching needed when there are no credentials
          'Cache-Control': 'no-store',
        }
      );
    }

    // Return credentials with appropriate cache headers.
    // Cache for at most 80% of the TTL to ensure clients refresh before expiry.
    const cacheMaxAge = Math.floor(credentials.ttl * 0.8);

    return jsonResponse(response, 200, {
      'Cache-Control': `private, no-store, max-age=${cacheMaxAge}`,
    });
  } catch (error) {
    console.error('[TURN API] Unexpected error:', error);
    return ApiErrors.internalError('Failed to generate TURN credentials');
  }
}

// ============================================================================
// HEAD Handler (health check without credential generation)
// ============================================================================

export async function HEAD(_request: NextRequest): Promise<NextResponse> {
  const summary = getTurnConfigSummary();

  return new NextResponse(null, {
    status: summary.totalSources > 0 ? 200 : 503,
    headers: {
      'X-TURN-Providers': summary.availableProviders.join(',') || 'none',
      'X-TURN-Provider-Count': summary.totalSources.toString(),
    },
  });
}
