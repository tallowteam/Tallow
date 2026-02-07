/**
 * TURN Credentials API Endpoint
 *
 * GET /api/turn/credentials
 *
 * Returns temporary TURN server credentials for WebRTC NAT traversal.
 * Credentials are time-limited (12 hours default) and generated using either:
 *
 *   1. Cloudflare TURN API (managed service, preferred)
 *   2. Coturn HMAC-SHA1 long-term credentials (self-hosted)
 *
 * Security:
 *   - Rate limited to 10 requests/minute per IP
 *   - Credentials expire after 12 hours
 *   - HMAC-based credential generation prevents credential forgery
 *   - Shared secret never exposed to clients
 *   - Response includes expiry timestamp for client-side caching
 *
 * Environment variables:
 *   Cloudflare TURN:
 *     - CLOUDFLARE_TURN_API_TOKEN
 *     - CLOUDFLARE_TURN_ACCOUNT_ID
 *     - CLOUDFLARE_TURN_TTL (optional, seconds, default 43200)
 *
 *   Self-hosted coturn:
 *     - COTURN_URLS (comma-separated TURN URLs)
 *     - COTURN_SHARED_SECRET
 *     - COTURN_REALM (optional)
 *     - COTURN_TTL (optional, seconds, default 43200)
 *
 *   Static fallback:
 *     - NEXT_PUBLIC_TURN_SERVER
 *     - NEXT_PUBLIC_TURN_USERNAME
 *     - NEXT_PUBLIC_TURN_CREDENTIAL
 */

import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse, ApiErrors } from '@/lib/api/response';
import { createRateLimiter } from '@/lib/middleware/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CREDENTIAL_TTL = 43200; // 12 hours in seconds

// ============================================================================
// Rate Limiter
// ============================================================================

const turnRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  message: 'Too many TURN credential requests. Please try again later.',
});

// ============================================================================
// Coturn HMAC Credential Generation (server-side only)
// ============================================================================

/**
 * Generate HMAC-SHA1 credentials for coturn
 *
 * coturn --use-auth-secret mechanism:
 *   username = "expiryTimestamp:userId"
 *   credential = base64(HMAC-SHA1(shared_secret, username))
 */
async function generateCoturnCredential(
  sharedSecret: string,
  ttlSeconds: number,
  userId?: string
): Promise<{ username: string; credential: string; expiresAt: number }> {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const userPart = userId ?? Math.random().toString(36).substring(2, 10);
  const username = `${expiresAt}:${userPart}`;

  // HMAC-SHA1 using Node.js crypto (server-side)
  const { createHmac } = await import('crypto');
  const hmac = createHmac('sha1', sharedSecret);
  hmac.update(username);
  const credential = hmac.digest('base64');

  return {
    username,
    credential,
    expiresAt: expiresAt * 1000, // Return in milliseconds
  };
}

// ============================================================================
// Cloudflare TURN Credential Fetching
// ============================================================================

/**
 * Request temporary credentials from Cloudflare TURN API
 */
async function getCloudflareCredentials(
  apiToken: string,
  accountId: string,
  ttlSeconds: number
): Promise<{
  urls: string[];
  username: string;
  credential: string;
  expiresAt: number;
}> {
  const response = await fetch(
    `https://rtc.live.cloudflare.com/v1/turn/keys/${accountId}/credentials/generate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ttl: ttlSeconds }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Cloudflare TURN API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as {
    iceServers: {
      urls: string[];
      username: string;
      credential: string;
    };
  };

  return {
    urls: data.iceServers.urls,
    username: data.iceServers.username,
    credential: data.iceServers.credential,
    expiresAt: Date.now() + ttlSeconds * 1000,
  };
}

// ============================================================================
// GET Handler
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Rate limiting
  const rateLimitResult = turnRateLimiter.check(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    // Determine credential TTL from query params or env
    const url = new URL(request.url);
    const requestedTtl = url.searchParams.get('ttl');
    const ttlSeconds = requestedTtl
      ? Math.min(parseInt(requestedTtl, 10), DEFAULT_CREDENTIAL_TTL)
      : DEFAULT_CREDENTIAL_TTL;

    if (isNaN(ttlSeconds) || ttlSeconds <= 0) {
      return ApiErrors.badRequest('Invalid TTL parameter');
    }

    // -----------------------------------------------------------------------
    // Strategy 1: Cloudflare TURN (managed, preferred)
    // -----------------------------------------------------------------------
    const cfApiToken = process.env['CLOUDFLARE_TURN_API_TOKEN'];
    const cfAccountId = process.env['CLOUDFLARE_TURN_ACCOUNT_ID'];

    if (cfApiToken && cfAccountId) {
      try {
        const credentials = await getCloudflareCredentials(cfApiToken, cfAccountId, ttlSeconds);

        return jsonResponse({
          iceServers: [{
            urls: credentials.urls,
            username: credentials.username,
            credential: credentials.credential,
          }],
          expiresAt: credentials.expiresAt,
          ttl: ttlSeconds,
          provider: 'cloudflare',
        });
      } catch (error) {
        // Log but fall through to coturn
        console.error('[TURN API] Cloudflare TURN credential request failed:', error);
      }
    }

    // -----------------------------------------------------------------------
    // Strategy 2: Self-hosted coturn (HMAC credentials)
    // -----------------------------------------------------------------------
    const coturnUrls = process.env['COTURN_URLS'];
    const coturnSecret = process.env['COTURN_SHARED_SECRET'];

    if (coturnUrls && coturnSecret) {
      const coturnTtl = process.env['COTURN_TTL']
        ? Math.min(parseInt(process.env['COTURN_TTL'], 10), ttlSeconds)
        : ttlSeconds;

      const urls = coturnUrls.split(',').map(u => u.trim());
      const { username, credential, expiresAt } = await generateCoturnCredential(
        coturnSecret,
        coturnTtl
      );

      return jsonResponse({
        iceServers: [{
          urls,
          username,
          credential,
        }],
        expiresAt,
        ttl: coturnTtl,
        provider: 'coturn',
      });
    }

    // -----------------------------------------------------------------------
    // Strategy 3: Static credentials from environment (fallback)
    // -----------------------------------------------------------------------
    const staticUrl = process.env['NEXT_PUBLIC_TURN_SERVER'] ?? process.env['TURN_SERVER_URL'];
    const staticUsername = process.env['NEXT_PUBLIC_TURN_USERNAME'] ?? process.env['TURN_USERNAME'];
    const staticCredential = process.env['NEXT_PUBLIC_TURN_CREDENTIAL'] ?? process.env['TURN_CREDENTIAL'];

    if (staticUrl && staticUsername && staticCredential) {
      // Static credentials do not expire, but we set a TTL for client caching
      return jsonResponse({
        iceServers: [{
          urls: [staticUrl],
          username: staticUsername,
          credential: staticCredential,
        }],
        expiresAt: Date.now() + ttlSeconds * 1000,
        ttl: ttlSeconds,
        provider: 'static',
      });
    }

    // -----------------------------------------------------------------------
    // No TURN configured
    // -----------------------------------------------------------------------
    return jsonResponse(
      {
        iceServers: [],
        expiresAt: 0,
        ttl: 0,
        provider: 'none',
        message: 'No TURN servers configured. P2P connections will rely on STUN only.',
      },
      200
    );
  } catch (error) {
    console.error('[TURN API] Unexpected error:', error);
    return ApiErrors.internalError('Failed to generate TURN credentials');
  }
}
