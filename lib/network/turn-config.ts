/**
 * TURN Server Configuration and Management
 *
 * Server-side module for TURN server credential generation and management.
 * This module is used by the API route to generate credentials -- it must NOT
 * have 'use client' since it handles secrets (shared keys, API tokens).
 *
 * Supported TURN providers (in fallback order):
 *   1. Cloudflare TURN Service (managed, global edge network)
 *   2. Twilio Network Traversal Service (managed, fallback)
 *   3. Self-hosted coturn server (HMAC-based credential generation)
 *   4. Static environment variable credentials (last resort)
 *
 * Credential generation:
 *   - Cloudflare TURN: temporary credentials via REST API
 *   - Twilio TURN: temporary credentials via REST API (NTS tokens)
 *   - Coturn: HMAC-SHA1 based time-limited credentials (RFC 5766 LTCs)
 *   - Static: raw credentials from env vars (no rotation)
 *
 * Transport coverage:
 *   Each provider generates both UDP and TCP TURN URLs to ensure
 *   connectivity through restrictive firewalls that block UDP.
 *
 * SECURITY IMPACT: 7 | PRIVACY IMPACT: 6
 * PRIORITY: HIGH
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface TURNServerEntry {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

export interface TURNCredentialSet {
  /** ICE servers ready for RTCPeerConnection */
  iceServers: RTCIceServerInit[];
  /** Credential expiry timestamp (ms since epoch) */
  expiresAt: number;
  /** TTL in seconds */
  ttl: number;
  /** Which provider generated these credentials */
  provider: TURNProvider;
}

export type TURNProvider = 'cloudflare' | 'twilio' | 'coturn' | 'static' | 'none';

export interface RTCIceServerInit {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

export interface CloudflareTURNConfig {
  /** Cloudflare API token with TURN permissions */
  apiToken: string;
  /** Cloudflare TURN key ID (from Cloudflare Calls dashboard) */
  keyId: string;
  /** Credential TTL in seconds (default: 43200 = 12 hours) */
  ttlSeconds?: number;
}

export interface TwilioTURNConfig {
  /** Twilio Account SID */
  accountSid: string;
  /** Twilio Auth Token */
  authToken: string;
  /** Credential TTL in seconds (default: 43200 = 12 hours) */
  ttlSeconds?: number;
}

export interface CoturnConfig {
  /** Coturn server hostname or IP (e.g., 'turn.example.com') */
  host: string;
  /** Coturn server port (default: 3478) */
  port?: number;
  /** TLS port for TURNS (default: 443) */
  tlsPort?: number;
  /** Shared secret for HMAC credential generation */
  sharedSecret: string;
  /** Credential TTL in seconds (default: 43200 = 12 hours) */
  ttlSeconds?: number;
  /** Realm for coturn authentication */
  realm?: string;
}

export interface TURNConfigSummary {
  cloudflareConfigured: boolean;
  twilioConfigured: boolean;
  coturnConfigured: boolean;
  staticConfigured: boolean;
  totalSources: number;
  /** Ordered list of available providers */
  availableProviders: TURNProvider[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CREDENTIAL_TTL = 43200; // 12 hours in seconds
const CLOUDFLARE_TURN_API_BASE = 'https://rtc.live.cloudflare.com/v1';
const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

// ============================================================================
// Environment Variable Readers
// ============================================================================

/**
 * Read Cloudflare TURN configuration from environment variables.
 *
 * Required env vars:
 *   - CLOUDFLARE_TURN_API_TOKEN
 *   - CLOUDFLARE_TURN_KEY_ID
 * Optional:
 *   - CLOUDFLARE_TURN_TTL (seconds, default 43200)
 */
export function getCloudflareConfig(): CloudflareTURNConfig | null {
  const apiToken = process.env['CLOUDFLARE_TURN_API_TOKEN'];
  const keyId = process.env['CLOUDFLARE_TURN_KEY_ID'];

  if (!apiToken || !keyId) {
    return null;
  }

  return {
    apiToken,
    keyId,
    ttlSeconds: process.env['CLOUDFLARE_TURN_TTL']
      ? parseInt(process.env['CLOUDFLARE_TURN_TTL'], 10)
      : DEFAULT_CREDENTIAL_TTL,
  };
}

/**
 * Read Twilio TURN configuration from environment variables.
 *
 * Required env vars:
 *   - TWILIO_ACCOUNT_SID
 *   - TWILIO_AUTH_TOKEN
 * Optional:
 *   - TWILIO_TURN_TTL (seconds, default 43200)
 */
export function getTwilioConfig(): TwilioTURNConfig | null {
  const accountSid = process.env['TWILIO_ACCOUNT_SID'];
  const authToken = process.env['TWILIO_AUTH_TOKEN'];

  if (!accountSid || !authToken) {
    return null;
  }

  return {
    accountSid,
    authToken,
    ttlSeconds: process.env['TWILIO_TURN_TTL']
      ? parseInt(process.env['TWILIO_TURN_TTL'], 10)
      : DEFAULT_CREDENTIAL_TTL,
  };
}

/**
 * Read coturn configuration from environment variables.
 *
 * Required env vars:
 *   - COTURN_HOST (hostname or IP)
 *   - COTURN_SHARED_SECRET
 * Optional:
 *   - COTURN_PORT (default: 3478)
 *   - COTURN_TLS_PORT (default: 443)
 *   - COTURN_REALM
 *   - COTURN_TTL (seconds, default 43200)
 */
export function getCoturnConfig(): CoturnConfig | null {
  const host = process.env['COTURN_HOST'];
  const sharedSecret = process.env['COTURN_SHARED_SECRET'];

  if (!host || !sharedSecret) {
    return null;
  }

  return {
    host,
    sharedSecret,
    port: process.env['COTURN_PORT']
      ? parseInt(process.env['COTURN_PORT'], 10)
      : 3478,
    tlsPort: process.env['COTURN_TLS_PORT']
      ? parseInt(process.env['COTURN_TLS_PORT'], 10)
      : 443,
    realm: process.env['COTURN_REALM'] ?? 'tallow',
    ttlSeconds: process.env['COTURN_TTL']
      ? parseInt(process.env['COTURN_TTL'], 10)
      : DEFAULT_CREDENTIAL_TTL,
  };
}

/**
 * Read static TURN credentials from environment variables.
 *
 * Env vars:
 *   - TURN_SERVER_URL (or NEXT_PUBLIC_TURN_SERVER)
 *   - TURN_USERNAME (or NEXT_PUBLIC_TURN_USERNAME)
 *   - TURN_CREDENTIAL (or NEXT_PUBLIC_TURN_CREDENTIAL)
 */
export function getStaticTurnConfig(): {
  url: string;
  username: string;
  credential: string;
} | null {
  const url =
    process.env['TURN_SERVER_URL'] ??
    process.env['NEXT_PUBLIC_TURN_SERVER'];
  const username =
    process.env['TURN_USERNAME'] ??
    process.env['NEXT_PUBLIC_TURN_USERNAME'];
  const credential =
    process.env['TURN_CREDENTIAL'] ??
    process.env['NEXT_PUBLIC_TURN_CREDENTIAL'];

  if (!url || !username || !credential) {
    return null;
  }

  return { url, username, credential };
}

// ============================================================================
// Cloudflare TURN Credential Generation
// ============================================================================

/**
 * Request temporary TURN credentials from Cloudflare TURN service.
 *
 * Cloudflare TURN (part of Cloudflare Calls) provides managed TURN servers
 * with global edge coverage. The API returns both UDP and TCP TURN URLs.
 *
 * API: POST /v1/turn/keys/{keyId}/credentials/generate
 *
 * @see https://developers.cloudflare.com/calls/turn/
 */
export async function getCloudflareCredentials(
  config: CloudflareTURNConfig
): Promise<TURNCredentialSet> {
  const ttl = config.ttlSeconds ?? DEFAULT_CREDENTIAL_TTL;

  const response = await fetch(
    `${CLOUDFLARE_TURN_API_BASE}/turn/keys/${config.keyId}/credentials/generate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ttl }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `Cloudflare TURN API error (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as {
    iceServers: {
      urls: string[];
      username: string;
      credential: string;
    };
  };

  const iceServers = data.iceServers;

  // Cloudflare returns URLs with both UDP and TCP transports already.
  // Ensure we have both transport variants for maximum connectivity.
  const urls = ensureUdpAndTcpUrls(iceServers.urls);

  return {
    iceServers: [
      {
        urls,
        username: iceServers.username,
        credential: iceServers.credential,
      },
    ],
    expiresAt: Date.now() + ttl * 1000,
    ttl,
    provider: 'cloudflare',
  };
}

// ============================================================================
// Twilio TURN Credential Generation
// ============================================================================

/**
 * Request temporary TURN credentials from Twilio Network Traversal Service.
 *
 * Twilio NTS provides globally distributed TURN servers with automatic
 * credential rotation. Returns ICE servers with STUN and TURN (UDP + TCP).
 *
 * API: POST /2010-04-01/Accounts/{AccountSid}/Tokens.json
 *
 * @see https://www.twilio.com/docs/stun-turn
 */
export async function getTwilioCredentials(
  config: TwilioTURNConfig
): Promise<TURNCredentialSet> {
  const ttl = config.ttlSeconds ?? DEFAULT_CREDENTIAL_TTL;

  // Twilio uses HTTP Basic Auth with AccountSid:AuthToken
  const authHeader = Buffer.from(
    `${config.accountSid}:${config.authToken}`
  ).toString('base64');

  const response = await fetch(
    `${TWILIO_API_BASE}/Accounts/${config.accountSid}/Tokens.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `Ttl=${ttl}`,
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `Twilio NTS API error (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as {
    username: string;
    password: string;
    ttl: string;
    date_created: string;
    date_updated: string;
    account_sid: string;
    ice_servers: Array<{
      url: string;
      urls: string;
      username?: string;
      credential?: string;
    }>;
  };

  // Twilio returns a mix of STUN and TURN servers.
  // Filter to TURN-only entries and ensure UDP+TCP coverage.
  const turnEntries = data.ice_servers.filter(
    (s) => s.urls.startsWith('turn:') || s.urls.startsWith('turns:')
  );

  const iceServers: RTCIceServerInit[] = turnEntries.map((entry) => ({
    urls: entry.urls,
    username: entry.username ?? data.username,
    credential: entry.credential ?? data.password,
  }));

  // If Twilio did not return entries with both UDP and TCP, expand them.
  const allUrls = iceServers.flatMap((s) =>
    Array.isArray(s.urls) ? s.urls : [s.urls]
  );
  const expandedUrls = ensureUdpAndTcpUrls(allUrls);

  // Consolidate into a single ICE server entry with all URLs and shared creds
  const username = turnEntries[0]?.username ?? data.username;
  const credential = turnEntries[0]?.credential ?? data.password;

  return {
    iceServers: [
      {
        urls: expandedUrls,
        username,
        credential,
      },
    ],
    expiresAt: Date.now() + ttl * 1000,
    ttl,
    provider: 'twilio',
  };
}

// ============================================================================
// Coturn HMAC Credential Generation (RFC 5766 Long-Term Credentials)
// ============================================================================

/**
 * Generate time-limited TURN credentials for a self-hosted coturn server.
 *
 * Uses HMAC-SHA1 as specified in the coturn --use-auth-secret mechanism,
 * which implements RFC 5766 long-term credentials:
 *
 *   username = "expiryTimestamp:userId"
 *   credential = base64(HMAC-SHA1(shared_secret, username))
 *
 * The server validates by recomputing the HMAC and checking the timestamp.
 * This is the standard mechanism supported by coturn, Pion TURN, and others.
 *
 * Generates URLs for all four transport variants:
 *   - turn:host:port?transport=udp    (standard UDP)
 *   - turn:host:port?transport=tcp    (TCP fallback)
 *   - turns:host:tlsPort?transport=tcp (TLS-over-TCP for strict firewalls)
 *   - turns:host:tlsPort?transport=udp (DTLS for UDP-capable but TLS-required)
 */
export async function generateCoturnCredentials(
  config: CoturnConfig,
  userId?: string
): Promise<TURNCredentialSet> {
  const ttl = config.ttlSeconds ?? DEFAULT_CREDENTIAL_TTL;
  const expiresAtUnix = Math.floor(Date.now() / 1000) + ttl;

  // Generate a random user ID if none provided
  const userPart =
    userId ??
    Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 36).toString(36)
    ).join('');
  const username = `${expiresAtUnix}:${userPart}`;

  // HMAC-SHA1 credential generation using Node.js crypto (server-side only)
  const { createHmac } = await import('crypto');
  const hmac = createHmac('sha1', config.sharedSecret);
  hmac.update(username);
  const credential = hmac.digest('base64');

  // Build TURN URLs for all transport variants
  const port = config.port ?? 3478;
  const tlsPort = config.tlsPort ?? 443;
  const host = config.host;

  const urls: string[] = [
    `turn:${host}:${port}?transport=udp`,
    `turn:${host}:${port}?transport=tcp`,
    `turns:${host}:${tlsPort}?transport=tcp`,
  ];

  return {
    iceServers: [
      {
        urls,
        username,
        credential,
      },
    ],
    expiresAt: expiresAtUnix * 1000, // Convert to ms
    ttl,
    provider: 'coturn',
  };
}

// ============================================================================
// Static Credential Wrapping
// ============================================================================

/**
 * Wrap static TURN credentials from environment variables into the
 * standard TURNCredentialSet format. These credentials do not rotate,
 * so TTL is advisory only (for client-side cache timing).
 */
export function getStaticCredentials(
  config: { url: string; username: string; credential: string },
  ttlSeconds: number = DEFAULT_CREDENTIAL_TTL
): TURNCredentialSet {
  // Expand static URL into UDP and TCP variants if not already specified
  const urls = ensureUdpAndTcpUrls([config.url]);

  return {
    iceServers: [
      {
        urls,
        username: config.username,
        credential: config.credential,
      },
    ],
    expiresAt: Date.now() + ttlSeconds * 1000,
    ttl: ttlSeconds,
    provider: 'static',
  };
}

// ============================================================================
// Unified Resolution (Fallback Chain)
// ============================================================================

/**
 * Resolve TURN credentials from all available providers in priority order.
 *
 * Fallback chain:
 *   1. Cloudflare TURN (managed, global edge, best latency)
 *   2. Twilio NTS (managed, global, reliable fallback)
 *   3. Self-hosted coturn (HMAC-SHA1 credentials)
 *   4. Static env credentials (no rotation, last resort)
 *
 * Returns credentials from the first provider that succeeds. If a provider
 * is not configured (env vars missing), it is silently skipped. If a configured
 * provider fails (API error), the error is logged and the next provider is tried.
 *
 * @param ttlOverride - Override the TTL for all providers (capped at 12 hours)
 */
export async function resolveCredentials(
  ttlOverride?: number
): Promise<TURNCredentialSet> {
  const maxTtl = DEFAULT_CREDENTIAL_TTL;
  const ttl = ttlOverride
    ? Math.min(ttlOverride, maxTtl)
    : maxTtl;

  // --- Cloudflare TURN ---
  const cfConfig = getCloudflareConfig();
  if (cfConfig) {
    try {
      return await getCloudflareCredentials({ ...cfConfig, ttlSeconds: ttl });
    } catch (error) {
      console.error(
        '[TURN Config] Cloudflare TURN failed, trying next provider:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // --- Twilio NTS ---
  const twilioConfig = getTwilioConfig();
  if (twilioConfig) {
    try {
      return await getTwilioCredentials({ ...twilioConfig, ttlSeconds: ttl });
    } catch (error) {
      console.error(
        '[TURN Config] Twilio NTS failed, trying next provider:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // --- Self-hosted coturn ---
  const coturnConfig = getCoturnConfig();
  if (coturnConfig) {
    try {
      return await generateCoturnCredentials({ ...coturnConfig, ttlSeconds: ttl });
    } catch (error) {
      console.error(
        '[TURN Config] Coturn credential generation failed, trying next provider:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // --- Static credentials ---
  const staticConfig = getStaticTurnConfig();
  if (staticConfig) {
    return getStaticCredentials(staticConfig, ttl);
  }

  // --- No TURN configured ---
  return {
    iceServers: [],
    expiresAt: 0,
    ttl: 0,
    provider: 'none',
  };
}

// ============================================================================
// Configuration Summary (for diagnostics)
// ============================================================================

/**
 * Get a summary of which TURN providers are configured.
 * Does not make any API calls -- only checks environment variables.
 */
export function getTurnConfigSummary(): TURNConfigSummary {
  const cloudflareConfigured = getCloudflareConfig() !== null;
  const twilioConfigured = getTwilioConfig() !== null;
  const coturnConfigured = getCoturnConfig() !== null;
  const staticConfigured = getStaticTurnConfig() !== null;

  const availableProviders: TURNProvider[] = [];
  if (cloudflareConfigured) availableProviders.push('cloudflare');
  if (twilioConfigured) availableProviders.push('twilio');
  if (coturnConfigured) availableProviders.push('coturn');
  if (staticConfigured) availableProviders.push('static');

  return {
    cloudflareConfigured,
    twilioConfigured,
    coturnConfigured,
    staticConfigured,
    totalSources: availableProviders.length,
    availableProviders,
  };
}

// ============================================================================
// TURN URL Helpers
// ============================================================================

/**
 * Ensure a list of TURN URLs includes both UDP and TCP transport variants.
 *
 * WebRTC NAT traversal works best when both UDP and TCP TURN candidates are
 * available. UDP is faster (lower latency), but TCP penetrates more firewalls.
 * TURNS (TLS) on port 443 is the ultimate fallback since it looks like HTTPS
 * traffic and passes through virtually all firewalls.
 *
 * Given a set of TURN URLs, this function ensures we have:
 *   - turn:host:port?transport=udp
 *   - turn:host:port?transport=tcp
 *   - turns:host:443?transport=tcp (if a TURNS URL exists or can be inferred)
 */
export function ensureUdpAndTcpUrls(urls: string[]): string[] {
  const result = new Set<string>();

  for (const url of urls) {
    // Add the original URL as-is
    result.add(url);

    // Parse the URL to extract scheme, host, port, transport
    const match = url.match(
      /^(turns?):([^:?]+)(?::(\d+))?(?:\?transport=(udp|tcp))?$/
    );
    if (!match) {
      // Cannot parse, keep original only
      continue;
    }

    const [, scheme, host = '', portStr, transport] = match;
    const port = portStr ?? (scheme === 'turns' ? '443' : '3478');

    if (scheme === 'turn') {
      // Ensure both UDP and TCP variants exist for plain TURN
      result.add(`turn:${host}:${port}?transport=udp`);
      result.add(`turn:${host}:${port}?transport=tcp`);
    } else if (scheme === 'turns') {
      // TURNS typically uses TCP (TLS over TCP)
      result.add(`turns:${host}:${port}?transport=tcp`);
    }

    // If we have a plain turn:// URL, also add turns:// on 443 for
    // firewall penetration, but only if the host looks like a domain
    // (not an IP, since TLS cert validation would fail)
    if (scheme === 'turn' && !isIPAddress(host) && !transport) {
      result.add(`turns:${host}:443?transport=tcp`);
    }
  }

  return Array.from(result);
}

/**
 * Check whether a string looks like an IP address (v4 or v6).
 */
function isIPAddress(host: string): boolean {
  // IPv4: digits and dots
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return true;
  }
  // IPv6: contains colons
  if (host.includes(':')) {
    return true;
  }
  return false;
}

// ============================================================================
// Export
// ============================================================================

export default {
  getCloudflareConfig,
  getTwilioConfig,
  getCoturnConfig,
  getStaticTurnConfig,
  getCloudflareCredentials,
  getTwilioCredentials,
  generateCoturnCredentials,
  getStaticCredentials,
  resolveCredentials,
  getTurnConfigSummary,
  ensureUdpAndTcpUrls,
};
