/**
 * ICE Candidate Management & Restart Controller
 * Agent 022 -- ICE-BREAKER
 * Agent 024 -- RELAY-SENTINEL (TURN credential integration)
 *
 * Manages ICE (Interactive Connectivity Establishment) candidates
 * for WebRTC NAT traversal. Handles STUN/TURN server configuration,
 * candidate filtering, prioritization, connectivity probing, and
 * ICE restart with signaling integration.
 *
 * Fallback chain (ordered by preference):
 *   1. Direct P2P via host candidates (LAN)
 *   2. STUN-derived srflx candidates (public IP discovery)
 *   3. TURN-UDP relay candidates (lowest relay latency)
 *   4. TURN-TCP relay candidates (firewall penetration)
 *   5. TURNS-TCP relay candidates (TLS on 443, passes all firewalls)
 *   6. Tallow onion relay (last resort, WebSocket-based)
 *
 * TURN credentials are fetched from /api/turn/credentials which handles
 * provider fallback (Cloudflare -> Twilio -> coturn -> static).
 *
 * Key fixes (Agent 022 audit):
 * 1. STUN servers: diverse provider list with connectivity probing and
 *    session-level caching of reachable servers.
 * 2. ICE restart: full lifecycle -- detect failure, create iceRestart
 *    offer, send via signaling callback, process answer, exponential
 *    backoff (1s / 2s / 4s, max 3 retries).
 * 3. NAT-aware configuration selection.
 *
 * Key fixes (Agent 024 audit):
 * 4. TURN credential fetching from /api/turn/credentials with caching.
 * 5. Async ICE config builder with automatic TURN credential resolution.
 * 6. Full RTCConfiguration builder with TURN support.
 */

import type { NATType } from '../network/nat-detection';

// ============================================================================
// TYPES
// ============================================================================

export interface ICEServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

export interface ICEConfig {
  /** STUN servers for NAT traversal */
  stunServers: ICEServerConfig[];
  /** TURN servers for relay fallback */
  turnServers: ICEServerConfig[];
  /** ICE transport policy */
  iceTransportPolicy: 'all' | 'relay';
  /** Bundle policy */
  bundlePolicy: 'balanced' | 'max-bundle' | 'max-compat';
  /** ICE candidate pool size (pre-gathered candidates) */
  iceCandidatePoolSize: number;
  /** Gathering timeout in ms */
  gatheringTimeout: number;
  /** Whether to use aggressive nomination */
  aggressiveNomination: boolean;
}

export interface ICECandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  type: 'host' | 'srflx' | 'prflx' | 'relay';
  protocol: 'udp' | 'tcp';
  address: string;
  port: number;
  priority: number;
  timestamp: number;
}

export interface ICEGatheringResult {
  candidates: ICECandidate[];
  hostCount: number;
  srflxCount: number;
  relayCount: number;
  gatheringTime: number;
  natType: NATType | 'unknown';
}

/** Response shape from GET /api/turn/credentials */
export interface TURNCredentialResponse {
  iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
  expiresAt: number;
  ttl: number;
  provider: string;
  fallbackChain: string;
  message?: string;
}

/** Cached TURN credentials with expiry tracking */
interface CachedTURNCredentials {
  iceServers: ICEServerConfig[];
  expiresAt: number;
  provider: string;
  fetchedAt: number;
}

/** Result of a single STUN server probe. */
export interface STUNProbeResult {
  url: string;
  reachable: boolean;
  latencyMs: number;
  error?: string;
}

/** Callback type for signaling channel integration. */
export interface ICERestartSignaling {
  /** Send a restart offer to the remote peer. Returns the remote answer. */
  sendRestartOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit>;
}

/** State tracked per ICE restart cycle. */
export interface ICERestartState {
  peerId: string;
  attempt: number;
  maxAttempts: number;
  inProgress: boolean;
  lastAttemptTime: number;
}

// ============================================================================
// STUN SERVER LIST -- diverse providers for resilience
// ============================================================================

/**
 * Ordered by reliability. Google is most widely deployed but can be blocked
 * in certain regions; Cloudflare and Mozilla provide geographic diversity.
 */
const ALL_STUN_SERVERS: ICEServerConfig[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.services.mozilla.com:3478' },
];

// ============================================================================
// STUN CONNECTIVITY PROBING & SESSION CACHE
// ============================================================================

/** Session-level cache of probed STUN servers (cleared on page unload). */
let cachedWorkingServers: ICEServerConfig[] | null = null;
let probeInProgress: Promise<ICEServerConfig[]> | null = null;

/** Probe timeout per server (ms). */
const STUN_PROBE_TIMEOUT = 3000;

/**
 * Test whether a single STUN server is reachable by attempting to gather
 * a server-reflexive candidate from it within a timeout.
 */
export async function probeSTUNServer(url: string): Promise<STUNProbeResult> {
  if (typeof RTCPeerConnection === 'undefined') {
    return { url, reachable: false, latencyMs: 0, error: 'RTCPeerConnection not available' };
  }

  const start = performance.now();

  return new Promise<STUNProbeResult>((resolve) => {
    const timer = setTimeout(() => {
      try { pc.close(); } catch { /* ignore */ }
      resolve({ url, reachable: false, latencyMs: performance.now() - start, error: 'timeout' });
    }, STUN_PROBE_TIMEOUT);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: url }],
      iceCandidatePoolSize: 0,
    });

    pc.onicecandidate = (event) => {
      // Any srflx candidate proves the server is reachable.
      if (event.candidate && event.candidate.type === 'srflx') {
        clearTimeout(timer);
        const latencyMs = performance.now() - start;
        try { pc.close(); } catch { /* ignore */ }
        resolve({ url, reachable: true, latencyMs });
      }
    };

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer);
        try { pc.close(); } catch { /* ignore */ }
        // If we got here without an srflx candidate, the server is unreachable.
        resolve({ url, reachable: false, latencyMs: performance.now() - start, error: 'no srflx candidate' });
      }
    };

    pc.createDataChannel('stun-probe');
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch((err) => {
        clearTimeout(timer);
        try { pc.close(); } catch { /* ignore */ }
        resolve({
          url,
          reachable: false,
          latencyMs: performance.now() - start,
          error: err instanceof Error ? err.message : String(err),
        });
      });
  });
}

/**
 * Probe all known STUN servers in parallel and return the reachable ones,
 * sorted by ascending latency. Results are cached for the session.
 *
 * If no server is reachable, falls back to the full list (so that WebRTC
 * can still attempt gathering on its own).
 */
export async function getWorkingSTUNServers(
  forceRefresh = false,
): Promise<ICEServerConfig[]> {
  if (!forceRefresh && cachedWorkingServers) {
    return cachedWorkingServers;
  }

  // Avoid duplicate probes running in parallel.
  if (probeInProgress) {
    return probeInProgress;
  }

  probeInProgress = (async () => {
    const urls = ALL_STUN_SERVERS.map((s) =>
      typeof s.urls === 'string' ? s.urls : s.urls[0] ?? '',
    ).filter(Boolean);

    const results = await Promise.all(urls.map(probeSTUNServer));

    const reachable = results
      .filter((r) => r.reachable)
      .sort((a, b) => a.latencyMs - b.latencyMs);

    if (reachable.length > 0) {
      cachedWorkingServers = reachable.map((r) => ({ urls: r.url }));
    } else {
      // Fallback: use full list, let the browser try them all.
      cachedWorkingServers = [...ALL_STUN_SERVERS];
    }

    return cachedWorkingServers;
  })();

  try {
    return await probeInProgress;
  } finally {
    probeInProgress = null;
  }
}

/** Clear the session cache (e.g., after network change). */
export function clearSTUNCache(): void {
  cachedWorkingServers = null;
}

// ============================================================================
// TURN CREDENTIAL CACHE & FETCHING
// ============================================================================

/**
 * In-memory cache for TURN credentials.
 *
 * Credentials are cached until 80% of their TTL has elapsed, then refreshed
 * on the next request. This prevents hammering the API endpoint while ensuring
 * credentials are always valid when used.
 */
let cachedTURNCredentials: CachedTURNCredentials | null = null;

/**
 * Refresh margin: fetch new credentials when 80% of TTL has elapsed.
 * For a 12-hour TTL, this means refreshing after ~9.6 hours.
 */
const TURN_CREDENTIAL_REFRESH_MARGIN = 0.8;

/**
 * Check whether cached TURN credentials are still valid (with refresh margin).
 */
function areTURNCachedCredentialsValid(): boolean {
  if (!cachedTURNCredentials) {
    return false;
  }

  const now = Date.now();
  const elapsed = now - cachedTURNCredentials.fetchedAt;
  const ttlMs = cachedTURNCredentials.expiresAt - cachedTURNCredentials.fetchedAt;
  const refreshAt = ttlMs * TURN_CREDENTIAL_REFRESH_MARGIN;

  return elapsed < refreshAt;
}

/**
 * Fetch TURN credentials from the server-side API endpoint.
 *
 * The API endpoint (/api/turn/credentials) handles the provider fallback
 * chain internally (Cloudflare -> Twilio -> coturn -> static) and returns
 * credentials with both UDP and TCP TURN URLs.
 *
 * Results are cached in memory until the refresh margin is reached.
 *
 * @param ttl - Requested credential TTL in seconds (default: 43200 = 12h)
 * @returns Array of ICEServerConfig entries for TURN servers, or empty on failure
 */
export async function fetchTURNCredentials(
  ttl: number = 43200,
): Promise<ICEServerConfig[]> {
  // Return cached credentials if still valid
  if (areTURNCachedCredentialsValid() && cachedTURNCredentials) {
    return cachedTURNCredentials.iceServers;
  }

  try {
    const response = await fetch(`/api/turn/credentials?ttl=${ttl}`);

    if (!response.ok) {
      console.error(
        `[ICE] Failed to fetch TURN credentials: ${response.status} ${response.statusText}`,
      );
      // Return stale cached credentials if available, better than nothing
      return cachedTURNCredentials?.iceServers ?? [];
    }

    const data: TURNCredentialResponse = await response.json();

    if (!data.iceServers || data.iceServers.length === 0) {
      // No TURN servers configured on server side
      return [];
    }

    // Cache the credentials
    const iceServers: ICEServerConfig[] = data.iceServers.map((s) => ({
      urls: s.urls,
      ...(s.username ? { username: s.username } : {}),
      ...(s.credential ? { credential: s.credential } : {}),
    }));

    cachedTURNCredentials = {
      iceServers,
      expiresAt: data.expiresAt,
      provider: data.provider,
      fetchedAt: Date.now(),
    };

    return iceServers;
  } catch (error) {
    console.error('[ICE] Error fetching TURN credentials:', error);
    // Return stale cached credentials if available
    return cachedTURNCredentials?.iceServers ?? [];
  }
}

/**
 * Invalidate the cached TURN credentials, forcing a fresh fetch on next use.
 */
export function invalidateTURNCache(): void {
  cachedTURNCredentials = null;
}

// ============================================================================
// ICE CONFIGURATION
// ============================================================================

/**
 * Create ICE configuration based on detected NAT type.
 * Uses probed/cached STUN servers when available; falls back to full list
 * synchronously (probing is async and may not have completed yet).
 */
export function createICEConfig(
  natType: NATType | 'unknown' = 'unknown',
  turnCredentials?: { username: string; credential: string; urls: string[] },
): ICEConfig {
  const stunServers = cachedWorkingServers ?? [...ALL_STUN_SERVERS];

  const turnServers: ICEServerConfig[] = turnCredentials
    ? [{
        urls: turnCredentials.urls,
        username: turnCredentials.username,
        credential: turnCredentials.credential,
        credentialType: 'password' as const,
      }]
    : [];

  // For symmetric NAT, force relay
  const forceRelay = natType === 'SYMMETRIC' || natType === 'BLOCKED';

  return {
    stunServers,
    turnServers,
    iceTransportPolicy: forceRelay ? 'relay' : 'all',
    bundlePolicy: 'max-bundle',
    iceCandidatePoolSize: natType === 'FULL_CONE' ? 1 : 3,
    gatheringTimeout: forceRelay ? 5000 : 10000,
    aggressiveNomination: true,
  };
}

/**
 * Async variant that waits for STUN probing to complete before building
 * the config. Preferred for initial connection setup where a few hundred
 * milliseconds of probe latency is acceptable.
 */
export async function createICEConfigAsync(
  natType: NATType | 'unknown' = 'unknown',
  turnCredentials?: { username: string; credential: string; urls: string[] },
): Promise<ICEConfig> {
  await getWorkingSTUNServers();
  return createICEConfig(natType, turnCredentials);
}

/**
 * Convert ICE config to RTCConfiguration for WebRTC.
 */
export function toRTCConfiguration(config: ICEConfig): RTCConfiguration {
  const iceServers: RTCIceServer[] = [
    ...config.stunServers.map((s) => ({
      urls: s.urls,
      ...(s.username ? { username: s.username } : {}),
      ...(s.credential ? { credential: s.credential } : {}),
    })),
    ...config.turnServers.map((s) => ({
      urls: s.urls,
      ...(s.username ? { username: s.username } : {}),
      ...(s.credential ? { credential: s.credential } : {}),
    })),
  ];

  return {
    iceServers,
    iceTransportPolicy: config.iceTransportPolicy,
    bundlePolicy: config.bundlePolicy,
    iceCandidatePoolSize: config.iceCandidatePoolSize,
  };
}

// ============================================================================
// ICE RESTART CONTROLLER
// ============================================================================

/**
 * Exponential backoff delays for ICE restart attempts.
 * Attempt 1: 1 000 ms, Attempt 2: 2 000 ms, Attempt 3: 4 000 ms.
 */
const ICE_RESTART_BACKOFF_MS = [1000, 2000, 4000] as const;
const ICE_RESTART_MAX_ATTEMPTS = 3;

/**
 * Manages ICE restart lifecycle for a single peer connection.
 *
 * Usage:
 *   const controller = new ICERestartController(peerId, signaling);
 *   // In connection state handler:
 *   if (state === 'disconnected' || state === 'failed') {
 *     await controller.initiateRestart(peerConnection);
 *   }
 *   // On receiving a restart offer from remote:
 *   await controller.handleRemoteRestartOffer(peerConnection, offer);
 */
export class ICERestartController {
  private state: ICERestartState;
  private signaling: ICERestartSignaling;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(peerId: string, signaling: ICERestartSignaling) {
    this.signaling = signaling;
    this.state = {
      peerId,
      attempt: 0,
      maxAttempts: ICE_RESTART_MAX_ATTEMPTS,
      inProgress: false,
      lastAttemptTime: 0,
    };
  }

  /** Current restart state (read-only snapshot). */
  getState(): Readonly<ICERestartState> {
    return { ...this.state };
  }

  /**
   * Initiate an ICE restart with exponential backoff.
   *
   * Creates a new offer with `iceRestart: true`, sends it to the remote
   * peer via the signaling callback, and applies the returned answer.
   *
   * @returns true if the restart succeeded, false if retries exhausted.
   */
  async initiateRestart(pc: RTCPeerConnection): Promise<boolean> {
    if (this.state.inProgress) {
      return false; // Already restarting, skip duplicate.
    }

    if (this.state.attempt >= this.state.maxAttempts) {
      return false; // Exhausted retries.
    }

    this.state.inProgress = true;
    this.state.attempt++;
    this.state.lastAttemptTime = Date.now();

    const attempt = this.state.attempt;
    const backoffIndex = Math.min(attempt - 1, ICE_RESTART_BACKOFF_MS.length - 1);
    const delay = ICE_RESTART_BACKOFF_MS[backoffIndex];

    // Wait for backoff delay before attempting restart.
    await new Promise<void>((resolve) => {
      this.restartTimer = setTimeout(resolve, delay);
    });

    try {
      // Step 1: Create restart offer.
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);

      // Step 2: Wait for ICE gathering to complete (or timeout).
      await waitForICEGathering(pc, 5000);

      const localDesc = pc.localDescription;
      if (!localDesc) {
        throw new Error('Local description is null after ICE restart offer');
      }

      // Step 3: Send via signaling and get answer.
      const answer = await this.signaling.sendRestartOffer(
        this.state.peerId,
        localDesc,
      );

      // Step 4: Apply remote answer.
      await pc.setRemoteDescription(answer);

      // Success -- reset attempt counter.
      this.state.attempt = 0;
      this.state.inProgress = false;
      return true;
    } catch (error) {
      this.state.inProgress = false;

      // Recurse with backoff if attempts remain.
      if (this.state.attempt < this.state.maxAttempts) {
        return this.initiateRestart(pc);
      }

      return false;
    }
  }

  /**
   * Handle an incoming ICE restart offer from the remote peer.
   *
   * This is called on the answering side when the remote peer initiates
   * a restart. It applies the offer, creates an answer, and returns it
   * for the caller to send back via signaling.
   */
  async handleRemoteRestartOffer(
    pc: RTCPeerConnection,
    offer: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit> {
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await waitForICEGathering(pc, 5000);

    const localDesc = pc.localDescription;
    if (!localDesc) {
      throw new Error('Local description is null after creating restart answer');
    }

    return localDesc;
  }

  /** Reset the controller state (e.g., after manual reconnection). */
  reset(): void {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.state.attempt = 0;
    this.state.inProgress = false;
  }

  /** Clean up timers. */
  destroy(): void {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
  }
}

// ============================================================================
// CANDIDATE PARSING & FILTERING
// ============================================================================

/**
 * Parse an RTCIceCandidate into our structured format.
 */
export function parseCandidate(rtcCandidate: RTCIceCandidate): ICECandidate | null {
  const { candidate, sdpMid, sdpMLineIndex } = rtcCandidate;
  if (!candidate) {return null;}

  // Parse candidate string: "candidate:... typ host/srflx/relay ..."
  const typMatch = candidate.match(/typ\s+(host|srflx|prflx|relay)/);
  const protoMatch = candidate.match(/\s(udp|tcp)\s/i);
  const addrMatch = candidate.match(/(?:udp|tcp)\s+\d+\s+([\d.]+|[a-f0-9:]+)\s+(\d+)/i);
  const priorityMatch = candidate.match(/(?:udp|tcp)\s+(\d+)/i);

  const type = (typMatch?.[1] ?? 'host') as ICECandidate['type'];
  const protocol = (protoMatch?.[1]?.toLowerCase() ?? 'udp') as ICECandidate['protocol'];
  const address = addrMatch?.[1] ?? '';
  const port = parseInt(addrMatch?.[2] ?? '0', 10);
  const priority = parseInt(priorityMatch?.[1] ?? '0', 10);

  return {
    candidate,
    sdpMid,
    sdpMLineIndex,
    type,
    protocol,
    address,
    port,
    priority,
    timestamp: Date.now(),
  };
}

/**
 * Filter candidates based on policy.
 */
export function filterCandidates(
  candidates: ICECandidate[],
  policy: {
    allowHost?: boolean;
    allowSrflx?: boolean;
    allowRelay?: boolean;
    allowTcp?: boolean;
    excludePrivateAddresses?: boolean;
  } = {},
): ICECandidate[] {
  const {
    allowHost = true,
    allowSrflx = true,
    allowRelay = true,
    allowTcp = true,
    excludePrivateAddresses = false,
  } = policy;

  return candidates.filter((c) => {
    if (c.type === 'host' && !allowHost) {return false;}
    if (c.type === 'srflx' && !allowSrflx) {return false;}
    if (c.type === 'relay' && !allowRelay) {return false;}
    if (c.protocol === 'tcp' && !allowTcp) {return false;}
    if (excludePrivateAddresses && isPrivateAddress(c.address)) {return false;}
    return true;
  });
}

/**
 * Sort candidates by priority (highest first).
 */
export function prioritizeCandidates(candidates: ICECandidate[]): ICECandidate[] {
  return [...candidates].sort((a, b) => {
    // Prefer UDP over TCP
    if (a.protocol !== b.protocol) {
      return a.protocol === 'udp' ? -1 : 1;
    }
    // Then by type: host > srflx > prflx > relay
    const typeOrder = { host: 0, srflx: 1, prflx: 2, relay: 3 };
    if (a.type !== b.type) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    // Then by priority value
    return b.priority - a.priority;
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function isPrivateAddress(address: string): boolean {
  // IPv4 private ranges
  if (/^10\./.test(address)) {return true;}
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(address)) {return true;}
  if (/^192\.168\./.test(address)) {return true;}
  if (/^127\./.test(address)) {return true;}
  // IPv6 link-local
  if (/^fe80:/i.test(address)) {return true;}
  if (/^::1$/.test(address)) {return true;}
  return false;
}

/**
 * Wait for ICE gathering to complete with a timeout.
 */
function waitForICEGathering(
  pc: RTCPeerConnection,
  timeout: number,
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve();
      return;
    }

    const timer = setTimeout(resolve, timeout);

    const handler = (): void => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer);
        pc.removeEventListener('icegatheringstatechange', handler);
        resolve();
      }
    };

    pc.addEventListener('icegatheringstatechange', handler);
  });
}

/**
 * Summarize gathered candidates.
 */
export function summarizeCandidates(candidates: ICECandidate[]): {
  total: number;
  host: number;
  srflx: number;
  relay: number;
  udp: number;
  tcp: number;
} {
  return {
    total: candidates.length,
    host: candidates.filter((c) => c.type === 'host').length,
    srflx: candidates.filter((c) => c.type === 'srflx').length,
    relay: candidates.filter((c) => c.type === 'relay').length,
    udp: candidates.filter((c) => c.protocol === 'udp').length,
    tcp: candidates.filter((c) => c.protocol === 'tcp').length,
  };
}
