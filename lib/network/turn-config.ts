'use client';

/**
 * TURN Server Configuration and Management
 *
 * Provides TURN server configuration for WebRTC NAT traversal.
 * Supports multiple TURN server sources:
 *
 *   1. Environment variables (TURN_SERVER_URL, TURN_USERNAME, TURN_CREDENTIAL)
 *   2. Cloudflare TURN Service (api.cloudflare.com managed TURN)
 *   3. Self-hosted coturn server (HMAC-based credential generation)
 *
 * TURN servers relay WebRTC traffic when direct P2P fails due to
 * symmetric NATs, firewalls, or restrictive network policies.
 *
 * Credential generation:
 *   - Cloudflare TURN: temporary credentials via REST API
 *   - Coturn: HMAC-SHA1 based time-limited credentials (RFC 5766 LTCs)
 *
 * SECURITY IMPACT: 7 | PRIVACY IMPACT: 6
 * PRIORITY: HIGH
 */

import secureLog from '../utils/secure-logger';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TURNServerEntry {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

export interface TURNCredentials {
  username: string;
  credential: string;
  /** Credential expiry timestamp (ms since epoch) */
  expiresAt: number;
  /** TURN server URLs these credentials are valid for */
  urls: string[];
}

export interface CloudflareTURNConfig {
  /** Cloudflare API token with TURN permissions */
  apiToken: string;
  /** Cloudflare account ID */
  accountId: string;
  /** Credential TTL in seconds (default: 43200 = 12 hours) */
  ttlSeconds?: number;
}

export interface CoturnConfig {
  /** Coturn server URL(s) (e.g., 'turn:turn.example.com:3478') */
  urls: string[];
  /** Shared secret for HMAC credential generation */
  sharedSecret: string;
  /** Credential TTL in seconds (default: 43200 = 12 hours) */
  ttlSeconds?: number;
  /** Realm for coturn authentication */
  realm?: string;
}

export interface TURNConfigOptions {
  /** Environment variable TURN servers */
  envServers?: TURNServerEntry[];
  /** Cloudflare TURN configuration */
  cloudflare?: CloudflareTURNConfig;
  /** Coturn self-hosted configuration */
  coturn?: CoturnConfig;
  /** Preferred TURN provider order */
  preferenceOrder?: Array<'env' | 'cloudflare' | 'coturn'>;
}

export interface TURNTestResult {
  /** Server that was tested */
  server: RTCIceServer;
  /** Whether the test succeeded */
  success: boolean;
  /** Round-trip latency in ms */
  latency: number;
  /** Error message if test failed */
  error?: string;
  /** Whether a relay candidate was found */
  relayFound: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CREDENTIAL_TTL = 43200; // 12 hours in seconds
const TURN_TEST_TIMEOUT = 10000; // 10 seconds for connectivity test
const CLOUDFLARE_TURN_API_BASE = 'https://rtc.live.cloudflare.com/v1';

// ============================================================================
// Environment Variable Configuration
// ============================================================================

/**
 * Get TURN servers from environment variables
 *
 * Reads:
 *   - NEXT_PUBLIC_TURN_SERVER (or TURN_SERVER_URL)
 *   - NEXT_PUBLIC_TURN_USERNAME (or TURN_USERNAME)
 *   - NEXT_PUBLIC_TURN_CREDENTIAL (or TURN_CREDENTIAL)
 *   - NEXT_PUBLIC_TURN_BACKUP_SERVER (optional backup)
 *   - NEXT_PUBLIC_TURN_BACKUP_USERNAME
 *   - NEXT_PUBLIC_TURN_BACKUP_CREDENTIAL
 */
export function getEnvTurnServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [];

  // Primary TURN server
  const primaryUrl = process.env['NEXT_PUBLIC_TURN_SERVER'] ?? process.env['TURN_SERVER_URL'];
  const primaryUsername = process.env['NEXT_PUBLIC_TURN_USERNAME'] ?? process.env['TURN_USERNAME'];
  const primaryCredential = process.env['NEXT_PUBLIC_TURN_CREDENTIAL'] ?? process.env['TURN_CREDENTIAL'];

  if (primaryUrl && primaryUsername && primaryCredential) {
    servers.push({
      urls: primaryUrl,
      username: primaryUsername,
      credential: primaryCredential,
    });
  }

  // Backup TURN server
  const backupUrl = process.env['NEXT_PUBLIC_TURN_BACKUP_SERVER'];
  const backupUsername = process.env['NEXT_PUBLIC_TURN_BACKUP_USERNAME'];
  const backupCredential = process.env['NEXT_PUBLIC_TURN_BACKUP_CREDENTIAL'];

  if (backupUrl && backupUsername && backupCredential) {
    servers.push({
      urls: backupUrl,
      username: backupUsername,
      credential: backupCredential,
    });
  }

  return servers;
}

// ============================================================================
// Cloudflare TURN Integration
// ============================================================================

/**
 * Request temporary TURN credentials from Cloudflare TURN service
 *
 * Cloudflare TURN (part of Cloudflare Calls / WebRTC) provides
 * managed TURN servers with global coverage and automatic scaling.
 *
 * API: POST /v1/turn/keys/{keyId}/credentials/generate
 */
export async function getCloudflareCredentials(
  config: CloudflareTURNConfig
): Promise<TURNCredentials> {
  const ttl = config.ttlSeconds ?? DEFAULT_CREDENTIAL_TTL;

  secureLog.log('[TURN Config] Requesting Cloudflare TURN credentials', {
    accountId: config.accountId.substring(0, 8) + '...',
    ttl: `${ttl}s`,
  });

  try {
    const response = await fetch(
      `${CLOUDFLARE_TURN_API_BASE}/turn/keys/${config.accountId}/credentials/generate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl }),
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

    const iceServers = data.iceServers;

    const credentials: TURNCredentials = {
      username: iceServers.username,
      credential: iceServers.credential,
      expiresAt: Date.now() + ttl * 1000,
      urls: iceServers.urls,
    };

    secureLog.log('[TURN Config] Cloudflare credentials obtained', {
      urls: credentials.urls.length,
      expiresIn: `${ttl}s`,
    });

    return credentials;
  } catch (error) {
    secureLog.error('[TURN Config] Failed to get Cloudflare TURN credentials:', error);
    throw error;
  }
}

/**
 * Convert Cloudflare TURN credentials to RTCIceServer format
 */
export async function getCloudflareIceServers(
  config: CloudflareTURNConfig
): Promise<RTCIceServer[]> {
  const credentials = await getCloudflareCredentials(config);

  return [{
    urls: credentials.urls,
    username: credentials.username,
    credential: credentials.credential,
  }];
}

// ============================================================================
// Coturn Self-Hosted Configuration
// ============================================================================

/**
 * Get coturn configuration from environment or direct config
 *
 * Reads:
 *   - COTURN_URLS (comma-separated)
 *   - COTURN_SHARED_SECRET
 *   - COTURN_REALM (optional)
 *   - COTURN_TTL (optional, seconds)
 */
export function getCoturnConfig(): CoturnConfig | null {
  const urls = process.env['COTURN_URLS'];
  const sharedSecret = process.env['COTURN_SHARED_SECRET'];

  if (!urls || !sharedSecret) {
    return null;
  }

  return {
    urls: urls.split(',').map(u => u.trim()),
    sharedSecret,
    realm: process.env['COTURN_REALM'],
    ttlSeconds: process.env['COTURN_TTL'] ? parseInt(process.env['COTURN_TTL'], 10) : DEFAULT_CREDENTIAL_TTL,
  };
}

/**
 * Generate time-limited TURN credentials for coturn
 *
 * Uses HMAC-SHA1 as specified in the coturn long-term credentials mechanism.
 * The username is formatted as "timestamp:randomId" and the credential
 * is HMAC-SHA1(sharedSecret, username).
 *
 * This follows the coturn --use-auth-secret mechanism (RFC 5766 LTCs):
 *   username = "expiryTimestamp:userId"
 *   credential = base64(HMAC-SHA1(shared_secret, username))
 */
export async function generateCoturnCredentials(
  config: CoturnConfig,
  userId?: string
): Promise<TURNCredentials> {
  const ttl = config.ttlSeconds ?? DEFAULT_CREDENTIAL_TTL;
  const expiresAt = Math.floor(Date.now() / 1000) + ttl;
  const userPart = userId ?? Math.random().toString(36).substring(2, 10);
  const username = `${expiresAt}:${userPart}`;

  // HMAC-SHA1 credential generation (coturn standard)
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(config.sharedSecret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(username)
  );

  // Base64 encode the HMAC result
  const signatureBytes = new Uint8Array(signatureBuffer);
  const credential = btoa(
    Array.from(signatureBytes).map(b => String.fromCharCode(b)).join('')
  );

  secureLog.log('[TURN Config] Generated coturn credentials', {
    username: username.substring(0, 20) + '...',
    expiresIn: `${ttl}s`,
    urls: config.urls.length,
  });

  return {
    username,
    credential,
    expiresAt: expiresAt * 1000, // Convert to ms
    urls: config.urls,
  };
}

/**
 * Convert coturn credentials to RTCIceServer format
 */
export async function getCoturnIceServers(config: CoturnConfig): Promise<RTCIceServer[]> {
  const credentials = await generateCoturnCredentials(config);

  return [{
    urls: credentials.urls,
    username: credentials.username,
    credential: credentials.credential,
  }];
}

// ============================================================================
// Unified TURN Server Resolution
// ============================================================================

/**
 * Get all configured TURN servers, resolved from all available sources
 *
 * Resolves TURN servers in the configured preference order and
 * returns a merged list. Credentials from dynamic sources (Cloudflare, coturn)
 * are fetched fresh with each call.
 *
 * @param options - Configuration options for all TURN sources
 * @returns Array of RTCIceServer entries ready for WebRTC
 */
export async function getTurnServers(options?: TURNConfigOptions): Promise<RTCIceServer[]> {
  const servers: RTCIceServer[] = [];
  const order = options?.preferenceOrder ?? ['env', 'cloudflare', 'coturn'];

  for (const source of order) {
    try {
      switch (source) {
        case 'env': {
          const envServers = options?.envServers
            ? options.envServers.map(s => ({
                urls: s.urls,
                username: s.username,
                credential: s.credential,
              } as RTCIceServer))
            : getEnvTurnServers();
          servers.push(...envServers);
          break;
        }

        case 'cloudflare': {
          if (options?.cloudflare) {
            const cfServers = await getCloudflareIceServers(options.cloudflare);
            servers.push(...cfServers);
          } else {
            // Try from env vars
            const apiToken = process.env['CLOUDFLARE_TURN_API_TOKEN'];
            const accountId = process.env['CLOUDFLARE_TURN_ACCOUNT_ID'];
            if (apiToken && accountId) {
              const cfServers = await getCloudflareIceServers({ apiToken, accountId });
              servers.push(...cfServers);
            }
          }
          break;
        }

        case 'coturn': {
          if (options?.coturn) {
            const coturnServers = await getCoturnIceServers(options.coturn);
            servers.push(...coturnServers);
          } else {
            const coturnConfig = getCoturnConfig();
            if (coturnConfig) {
              const coturnServers = await getCoturnIceServers(coturnConfig);
              servers.push(...coturnServers);
            }
          }
          break;
        }
      }
    } catch (error) {
      secureLog.warn(`[TURN Config] Failed to get servers from ${source}:`, error);
      // Continue to next source
    }
  }

  secureLog.log('[TURN Config] Resolved TURN servers', {
    total: servers.length,
    sources: order.join(', '),
  });

  return servers;
}

// ============================================================================
// TURN Server Connectivity Testing
// ============================================================================

/**
 * Test TURN server connectivity
 *
 * Creates a temporary RTCPeerConnection with the given TURN server
 * and checks if a relay candidate can be gathered.
 *
 * @param server - RTCIceServer to test
 * @param timeout - Test timeout in ms (default 10000)
 * @returns Test result with success status and latency
 */
export async function testTurnServer(
  server: RTCIceServer,
  timeout: number = TURN_TEST_TIMEOUT
): Promise<TURNTestResult> {
  // Check if RTCPeerConnection is available (browser-only)
  if (typeof RTCPeerConnection === 'undefined') {
    return {
      server,
      success: false,
      latency: 0,
      error: 'RTCPeerConnection not available (server-side environment)',
      relayFound: false,
    };
  }

  const startTime = performance.now();

  return new Promise<TURNTestResult>((resolve) => {
    const timer = setTimeout(() => {
      pc.close();
      resolve({
        server,
        success: false,
        latency: performance.now() - startTime,
        error: 'TURN connectivity test timeout',
        relayFound: false,
      });
    }, timeout);

    const pc = new RTCPeerConnection({
      iceServers: [server],
      iceCandidatePoolSize: 0,
    });

    let relayFound = false;

    pc.onicecandidate = (event) => {
      if (event.candidate?.type === 'relay') {
        relayFound = true;
        const latency = performance.now() - startTime;
        clearTimeout(timer);
        pc.close();
        resolve({
          server,
          success: true,
          latency,
          relayFound: true,
        });
      }
    };

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer);
        const latency = performance.now() - startTime;
        pc.close();
        resolve({
          server,
          success: relayFound,
          latency,
          error: relayFound ? undefined : 'No relay candidate found -- TURN server may be unreachable',
          relayFound,
        });
      }
    };

    // Create data channel to trigger ICE gathering
    pc.createDataChannel('turn-test');

    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(error => {
        clearTimeout(timer);
        pc.close();
        resolve({
          server,
          success: false,
          latency: performance.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
          relayFound: false,
        });
      });
  });
}

/**
 * Test all configured TURN servers and return results
 *
 * Tests each server in parallel and returns results sorted by latency.
 */
export async function testAllTurnServers(
  servers?: RTCIceServer[]
): Promise<TURNTestResult[]> {
  const serversToTest = servers ?? await getTurnServers();

  if (serversToTest.length === 0) {
    secureLog.warn('[TURN Config] No TURN servers configured for testing');
    return [];
  }

  secureLog.log('[TURN Config] Testing TURN servers', {
    count: serversToTest.length,
  });

  const results = await Promise.all(
    serversToTest.map(server => testTurnServer(server))
  );

  // Sort by success first, then by latency
  results.sort((a, b) => {
    if (a.success !== b.success) {
      return a.success ? -1 : 1;
    }
    return a.latency - b.latency;
  });

  const successful = results.filter(r => r.success).length;

  secureLog.log('[TURN Config] TURN server test results', {
    total: results.length,
    successful,
    failed: results.length - successful,
    bestLatency: results[0]?.latency ? `${results[0].latency.toFixed(0)}ms` : 'N/A',
  });

  return results;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the best available TURN server (lowest latency, healthy)
 */
export async function getBestTurnServer(): Promise<RTCIceServer | null> {
  const results = await testAllTurnServers();
  const best = results.find(r => r.success);
  return best?.server ?? null;
}

/**
 * Check if any TURN server is configured
 */
export function isTurnConfigured(): boolean {
  const envServers = getEnvTurnServers();
  if (envServers.length > 0) {
    return true;
  }

  const hasCloudflareTurn = !!(
    process.env['CLOUDFLARE_TURN_API_TOKEN'] &&
    process.env['CLOUDFLARE_TURN_ACCOUNT_ID']
  );

  const hasCoturn = !!(
    process.env['COTURN_URLS'] &&
    process.env['COTURN_SHARED_SECRET']
  );

  return hasCloudflareTurn || hasCoturn;
}

/**
 * Get a summary of TURN configuration for diagnostics
 */
export function getTurnConfigSummary(): {
  envConfigured: boolean;
  cloudflareConfigured: boolean;
  coturnConfigured: boolean;
  totalSources: number;
} {
  const envConfigured = getEnvTurnServers().length > 0;
  const cloudflareConfigured = !!(
    process.env['CLOUDFLARE_TURN_API_TOKEN'] &&
    process.env['CLOUDFLARE_TURN_ACCOUNT_ID']
  );
  const coturnConfigured = getCoturnConfig() !== null;

  return {
    envConfigured,
    cloudflareConfigured,
    coturnConfigured,
    totalSources: [envConfigured, cloudflareConfigured, coturnConfigured].filter(Boolean).length,
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  getEnvTurnServers,
  getCloudflareCredentials,
  getCloudflareIceServers,
  getCoturnConfig,
  generateCoturnCredentials,
  getCoturnIceServers,
  getTurnServers,
  testTurnServer,
  testAllTurnServers,
  getBestTurnServer,
  isTurnConfigured,
  getTurnConfigSummary,
};
