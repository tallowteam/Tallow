'use client';

/**
 * NAT Type Detection for WebRTC Connection Strategy
 * Agent 022 -- ICE-BREAKER
 *
 * Detects the NAT type of the local network to optimize WebRTC connection
 * establishment. Different NAT types require different strategies:
 *
 * - FULL_CONE: Most permissive, direct connections usually work
 * - RESTRICTED: Direct connections work with cooperation
 * - PORT_RESTRICTED: More restrictive, may need TURN fallback
 * - SYMMETRIC: Most restrictive, often requires TURN relay
 * - BLOCKED: UDP blocked, TURN over TCP required
 * - UNKNOWN: Detection failed, use conservative strategy
 *
 * Based on RFC 3489/5389 STUN NAT classification.
 *
 * Key improvements (Agent 022 audit):
 * 1. Dual-server STUN probing: separate RTCPeerConnection per server pair
 *    to accurately compare mapped endpoints across different destinations.
 * 2. Diverse STUN server list with Google, Cloudflare, Mozilla, and Twilio
 *    for resilience against individual server failures.
 * 3. Improved symmetric NAT detection using per-server endpoint comparison.
 * 4. Higher confidence scores when multiple independent observations agree.
 */

import secureLog from '../utils/secure-logger';

// ============================================================================
// Type Definitions
// ============================================================================

export type NATType =
  | 'FULL_CONE'
  | 'RESTRICTED'
  | 'PORT_RESTRICTED'
  | 'SYMMETRIC'
  | 'BLOCKED'
  | 'UNKNOWN';

export interface NATDetectionResult {
  type: NATType;
  publicIP?: string;
  mappedPort?: number;
  confidence: number;
  detectionTime: number;
  candidateCount: number;
  srflxCount: number;
  relayCount: number;
  hostCount: number;
}

export interface NATDetectionOptions {
  timeout?: number;
  stunServers?: string[];
  includeRelay?: boolean;
}

export type ConnectionStrategy = 'direct' | 'turn_fallback' | 'turn_only';

export interface ConnectionStrategyResult {
  strategy: ConnectionStrategy;
  directTimeout: number;
  useTURN: boolean;
  prioritizeRelay: boolean;
  reason: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * STUN servers from diverse providers for accurate multi-server probing.
 * We intentionally use servers from different organizations so that
 * symmetric NAT (which assigns a different mapped port per destination)
 * produces observable differences.
 *
 * Provider diversity:
 * - Google (most widely deployed, but may be blocked in some regions)
 * - Cloudflare (global CDN, high availability)
 * - Mozilla (open-source friendly, different IP range)
 */
const DEFAULT_STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun.cloudflare.com:3478',
  'stun:stun.services.mozilla.com:3478',
];

const DEFAULT_TIMEOUT = 5000;

// Cache duration for NAT detection results (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// ============================================================================
// NAT Detection Implementation
// ============================================================================

interface CachedResult {
  result: NATDetectionResult;
  timestamp: number;
}

let cachedDetection: CachedResult | null = null;
let detectionInProgress: Promise<NATDetectionResult> | null = null;

interface ParsedCandidate {
  type: string;
  ip: string | null;
  port: number | null;
  protocol: string | null;
  relatedAddress: string | null;
  relatedPort: number | null;
}

/**
 * Parse ICE candidate to extract useful information
 */
function parseCandidate(candidate: RTCIceCandidate): ParsedCandidate {
  const parts = candidate.candidate.split(' ');
  const result: ParsedCandidate = {
    type: candidate.type || 'unknown',
    ip: null,
    port: null,
    protocol: null,
    relatedAddress: null,
    relatedPort: null,
  };

  // Standard candidate format: candidate:foundation component protocol priority ip port typ type ...
  if (parts.length >= 8) {
    result.ip = parts[4] ?? null;
    const portStr = parts[5];
    result.port = portStr ? parseInt(portStr, 10) : null;
    result.protocol = parts[2]?.toLowerCase() ?? null;

    // Look for raddr and rport (related address/port)
    const raddrIndex = parts.indexOf('raddr');
    const rportIndex = parts.indexOf('rport');

    const relatedAddr = raddrIndex !== -1 ? parts[raddrIndex + 1] : undefined;
    const relatedPortStr = rportIndex !== -1 ? parts[rportIndex + 1] : undefined;

    if (relatedAddr !== undefined) {
      result.relatedAddress = relatedAddr;
    }
    if (relatedPortStr !== undefined) {
      result.relatedPort = parseInt(relatedPortStr, 10);
    }
  }

  return result;
}

/** Mapped endpoint from a single STUN server probe. */
interface ServerProbeEndpoint {
  serverUrl: string;
  ip: string;
  port: number;
  relatedAddress?: string;
  relatedPort?: number;
}

/**
 * Probe a single STUN server with a dedicated RTCPeerConnection and
 * return the first srflx (server-reflexive) endpoint observed.
 *
 * Using a separate PC per server is critical for symmetric NAT detection:
 * a symmetric NAT allocates a different mapped port for each distinct
 * destination, so the same local port probed against two different STUN
 * servers will produce different external ports.
 */
async function probeSingleServer(
  serverUrl: string,
  timeout: number,
): Promise<ServerProbeEndpoint | null> {
  if (typeof RTCPeerConnection === 'undefined') {
    return null;
  }

  return new Promise<ServerProbeEndpoint | null>((resolve) => {
    const timer = setTimeout(() => {
      try { pc.close(); } catch { /* ignore */ }
      resolve(null);
    }, timeout);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: serverUrl }],
      iceCandidatePoolSize: 0,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && event.candidate.type === 'srflx') {
        const parsed = parseCandidate(event.candidate);
        if (parsed.ip !== null && parsed.port !== null) {
          clearTimeout(timer);
          try { pc.close(); } catch { /* ignore */ }
          const endpoint: ServerProbeEndpoint = {
            serverUrl,
            ip: parsed.ip,
            port: parsed.port,
          };
          if (parsed.relatedAddress !== null) {
            endpoint.relatedAddress = parsed.relatedAddress;
          }
          if (parsed.relatedPort !== null) {
            endpoint.relatedPort = parsed.relatedPort;
          }
          resolve(endpoint);
          return;
        }
      }
    };

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer);
        try { pc.close(); } catch { /* ignore */ }
        resolve(null);
      }
    };

    pc.createDataChannel('nat-probe');
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(() => {
        clearTimeout(timer);
        try { pc.close(); } catch { /* ignore */ }
        resolve(null);
      });
  });
}

/**
 * Detect NAT type using ICE candidate gathering.
 *
 * Improved approach (Agent 022):
 * 1. Probe STUN servers from different providers in parallel using
 *    separate RTCPeerConnection instances.
 * 2. Additionally run a combined-server probe to collect all candidate
 *    types (host, srflx, relay) for classification fallback.
 * 3. Compare mapped endpoints across independent probes to detect
 *    symmetric NAT with high confidence.
 */
export async function detectNATType(
  options: NATDetectionOptions = {},
): Promise<NATDetectionResult> {
  const {
    timeout = DEFAULT_TIMEOUT,
    stunServers = DEFAULT_STUN_SERVERS,
  } = options;

  // Check cache first
  if (cachedDetection && Date.now() - cachedDetection.timestamp < CACHE_DURATION) {
    secureLog.log('[NAT Detection] Returning cached result');
    return cachedDetection.result;
  }

  // If detection is already in progress, wait for it
  if (detectionInProgress) {
    return detectionInProgress;
  }

  // Start new detection
  detectionInProgress = performDetection(stunServers, timeout);

  try {
    const result = await detectionInProgress;
    cachedDetection = { result, timestamp: Date.now() };
    return result;
  } finally {
    detectionInProgress = null;
  }
}

async function performDetection(
  stunServers: string[],
  timeout: number,
): Promise<NATDetectionResult> {
  const startTime = performance.now();

  // Check if RTCPeerConnection is available
  if (typeof RTCPeerConnection === 'undefined') {
    return {
      type: 'UNKNOWN',
      confidence: 0,
      detectionTime: performance.now() - startTime,
      candidateCount: 0,
      srflxCount: 0,
      relayCount: 0,
      hostCount: 0,
    };
  }

  // --- Phase 1: Dual-server probing for symmetric NAT detection ---
  //
  // Pick servers from different providers (at least 2) to maximize the
  // chance of getting mapped endpoints from distinct STUN servers.
  const probeServers = selectDiverseServers(stunServers, 3);
  const probePromises = probeServers.map((url) => probeSingleServer(url, timeout));

  // --- Phase 2: Combined-server probe for full candidate gathering ---
  const combinedPromise = performCombinedGathering(stunServers, timeout);

  // Run both phases in parallel.
  const [probeResults, combined] = await Promise.all([
    Promise.all(probePromises),
    combinedPromise,
  ]);

  const detectionTime = performance.now() - startTime;

  // Collect successful endpoints from per-server probes.
  const endpoints: ServerProbeEndpoint[] = probeResults.filter(
    (r): r is ServerProbeEndpoint => r !== null,
  );

  // Analyze using both independent probes and combined gathering.
  const result = analyzeNATTypeImproved(
    endpoints,
    combined.srflxCandidates,
    combined.hostCandidates,
    combined.relayCandidates,
    combined.totalCandidates,
    detectionTime,
  );

  secureLog.log('[NAT Detection] Completed', {
    type: result.type,
    confidence: result.confidence,
    independentProbes: endpoints.length,
    candidates: combined.totalCandidates,
    srflx: combined.srflxCandidates.length,
    host: combined.hostCandidates.length,
    relay: combined.relayCandidates.length,
    time: `${detectionTime.toFixed(0)}ms`,
  });

  return result;
}

/**
 * Select servers from diverse providers to maximize probing accuracy.
 * Picks at most `count` servers, preferring different providers.
 */
function selectDiverseServers(servers: string[], count: number): string[] {
  // Classify by provider hostname prefix.
  const providerBuckets = new Map<string, string[]>();

  for (const url of servers) {
    // Extract hostname from "stun:hostname:port"
    const match = url.match(/stun:([^:]+)/);
    const hostname = match?.[1] ?? url;
    // Provider key is the domain minus numbering: stun.l.google.com -> google
    let provider = 'other';
    if (hostname.includes('google')) {provider = 'google';}
    else if (hostname.includes('cloudflare')) {provider = 'cloudflare';}
    else if (hostname.includes('mozilla')) {provider = 'mozilla';}
    else if (hostname.includes('twilio')) {provider = 'twilio';}

    if (!providerBuckets.has(provider)) {
      providerBuckets.set(provider, []);
    }
    providerBuckets.get(provider)!.push(url);
  }

  // Pick one from each provider, round-robin until we have enough.
  const selected: string[] = [];
  const providers = Array.from(providerBuckets.values());
  let idx = 0;

  while (selected.length < count && providers.length > 0) {
    const bucket = providers[idx % providers.length];
    if (bucket && bucket.length > 0) {
      selected.push(bucket.shift()!);
    }
    if (bucket && bucket.length === 0) {
      providers.splice(idx % providers.length, 1);
      if (providers.length === 0) {break;}
    } else {
      idx++;
    }
  }

  return selected;
}

/** Results from combined-server gathering. */
interface CombinedGatheringResult {
  srflxCandidates: Array<{
    ip: string;
    port: number;
    relatedAddress?: string;
    relatedPort?: number;
  }>;
  hostCandidates: Array<{ ip: string; port: number }>;
  relayCandidates: Array<{ ip: string; port: number }>;
  totalCandidates: number;
}

/**
 * Run a single RTCPeerConnection with all STUN servers to gather the
 * full set of candidates (including host and relay types).
 */
async function performCombinedGathering(
  stunServers: string[],
  timeout: number,
): Promise<CombinedGatheringResult> {
  const iceServers: RTCIceServer[] = stunServers.map((url) => ({ urls: url }));
  const pc = new RTCPeerConnection({ iceServers });

  const srflxCandidates: CombinedGatheringResult['srflxCandidates'] = [];
  const hostCandidates: CombinedGatheringResult['hostCandidates'] = [];
  const relayCandidates: CombinedGatheringResult['relayCandidates'] = [];
  let totalCandidates = 0;

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      totalCandidates++;
      const parsed = parseCandidate(event.candidate);

      if (event.candidate.type === 'srflx' && parsed.ip !== null && parsed.port !== null) {
        const entry: CombinedGatheringResult['srflxCandidates'][number] = {
          ip: parsed.ip,
          port: parsed.port,
        };
        if (parsed.relatedAddress !== null) {
          entry.relatedAddress = parsed.relatedAddress;
        }
        if (parsed.relatedPort !== null) {
          entry.relatedPort = parsed.relatedPort;
        }
        srflxCandidates.push(entry);
      } else if (event.candidate.type === 'host' && parsed.ip !== null && parsed.port !== null) {
        hostCandidates.push({ ip: parsed.ip, port: parsed.port });
      } else if (event.candidate.type === 'relay' && parsed.ip !== null && parsed.port !== null) {
        relayCandidates.push({ ip: parsed.ip, port: parsed.port });
      }
    }
  };

  pc.createDataChannel('nat-detect');

  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
  } catch (error) {
    secureLog.error('[NAT Detection] Failed to create offer:', error);
    pc.close();
    return { srflxCandidates, hostCandidates, relayCandidates, totalCandidates: 0 };
  }

  await new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      secureLog.log('[NAT Detection] ICE gathering timeout');
      resolve();
    }, timeout);

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timeoutId);
        resolve();
      }
    };
  });

  pc.close();

  return { srflxCandidates, hostCandidates, relayCandidates, totalCandidates };
}

/**
 * Improved NAT type analysis using independent per-server probes.
 *
 * The key insight: symmetric NAT allocates a unique external port for
 * each destination. By probing different STUN servers from separate
 * PeerConnections (which the browser binds to the same local port), we
 * can observe whether the mapped external port changes per destination.
 *
 * - Same IP, same port across servers -> cone NAT (full, restricted, or port-restricted)
 * - Same IP, different ports across servers -> symmetric NAT
 * - No srflx candidates -> BLOCKED
 */
function analyzeNATTypeImproved(
  independentEndpoints: ServerProbeEndpoint[],
  combinedSrflx: Array<{
    ip: string;
    port: number;
    relatedAddress?: string;
    relatedPort?: number;
  }>,
  hostCandidates: Array<{ ip: string; port: number }>,
  relayCandidates: Array<{ ip: string; port: number }>,
  totalCandidates: number,
  detectionTime: number,
): NATDetectionResult {
  const baseResult = {
    detectionTime,
    candidateCount: totalCandidates,
    srflxCount: combinedSrflx.length,
    relayCount: relayCandidates.length,
    hostCount: hostCandidates.length,
  };

  // ---------- BLOCKED detection ----------
  if (independentEndpoints.length === 0 && combinedSrflx.length === 0) {
    if (relayCandidates.length > 0) {
      const firstRelay = relayCandidates[0];
      const result: NATDetectionResult = {
        ...baseResult,
        type: 'BLOCKED',
        confidence: 0.9,
      };
      if (firstRelay) {
        result.publicIP = firstRelay.ip;
        result.mappedPort = firstRelay.port;
      }
      return result;
    }

    if (totalCandidates === 0) {
      return { ...baseResult, type: 'BLOCKED', confidence: 0.95 };
    }

    return { ...baseResult, type: 'BLOCKED', confidence: 0.85 };
  }

  // ---------- Use independent probes for symmetric detection ----------
  const firstEndpoint = independentEndpoints[0] ?? combinedSrflx[0];

  const buildResult = (type: NATType, confidence: number): NATDetectionResult => {
    const result: NATDetectionResult = { ...baseResult, type, confidence };
    if (firstEndpoint) {
      result.publicIP = firstEndpoint.ip;
      result.mappedPort = firstEndpoint.port;
    }
    return result;
  };

  // If we have 2+ independent probes, compare their mapped ports.
  if (independentEndpoints.length >= 2) {
    const uniqueIPs = new Set(independentEndpoints.map((e) => e.ip));
    const uniquePorts = new Set(independentEndpoints.map((e) => e.port));

    // Symmetric NAT: same public IP but different mapped ports per server.
    if (uniqueIPs.size === 1 && uniquePorts.size > 1) {
      return buildResult('SYMMETRIC', 0.9);
    }

    // Multiple public IPs is unusual (multi-homed or carrier-grade NAT);
    // treat as symmetric for safety.
    if (uniqueIPs.size > 1) {
      return buildResult('SYMMETRIC', 0.75);
    }

    // Consistent mapping across 2+ diverse servers -> cone NAT.
    // Now determine which cone type from combined gathering data.
    if (uniquePorts.size === 1) {
      return classifyConeNAT(combinedSrflx, baseResult, firstEndpoint);
    }
  }

  // ---------- Fallback: use combined gathering analysis ----------
  return analyzeFromCombinedGathering(
    combinedSrflx,
    hostCandidates,
    relayCandidates,
    totalCandidates,
    detectionTime,
  );
}

/**
 * Classify cone NAT subtype based on port mapping consistency from
 * combined gathering.
 */
function classifyConeNAT(
  srflxCandidates: Array<{
    ip: string;
    port: number;
    relatedAddress?: string;
    relatedPort?: number;
  }>,
  baseResult: {
    detectionTime: number;
    candidateCount: number;
    srflxCount: number;
    relayCount: number;
    hostCount: number;
  },
  firstEndpoint: { ip: string; port: number } | undefined,
): NATDetectionResult {
  const buildResult = (type: NATType, confidence: number): NATDetectionResult => {
    const result: NATDetectionResult = { ...baseResult, type, confidence };
    if (firstEndpoint) {
      result.publicIP = firstEndpoint.ip;
      result.mappedPort = firstEndpoint.port;
    }
    return result;
  };

  // Check whether external port equals local (related) port -- full cone
  // typically preserves the port mapping.
  const hasPortPreservation = srflxCandidates.some(
    (c) => c.relatedPort !== undefined && c.port === c.relatedPort,
  );

  if (hasPortPreservation) {
    return buildResult('FULL_CONE', 0.85);
  }

  // All srflx candidates share same external port -> restricted cone.
  const uniquePorts = new Set(srflxCandidates.map((c) => c.port));
  if (uniquePorts.size === 1) {
    return buildResult('RESTRICTED', 0.8);
  }

  // Ports vary slightly -> port-restricted cone.
  return buildResult('PORT_RESTRICTED', 0.75);
}

/**
 * Fallback analysis using only the combined gathering candidates.
 * This preserves the original heuristic for when independent probes
 * fail (e.g., only one STUN server responded).
 */
function analyzeFromCombinedGathering(
  srflxCandidates: Array<{
    ip: string;
    port: number;
    relatedAddress?: string;
    relatedPort?: number;
  }>,
  hostCandidates: Array<{ ip: string; port: number }>,
  relayCandidates: Array<{ ip: string; port: number }>,
  totalCandidates: number,
  detectionTime: number,
): NATDetectionResult {
  const baseResult = {
    detectionTime,
    candidateCount: totalCandidates,
    srflxCount: srflxCandidates.length,
    relayCount: relayCandidates.length,
    hostCount: hostCandidates.length,
  };

  if (srflxCandidates.length === 0) {
    if (relayCandidates.length > 0) {
      const firstRelay = relayCandidates[0];
      const result: NATDetectionResult = { ...baseResult, type: 'BLOCKED', confidence: 0.9 };
      if (firstRelay) {
        result.publicIP = firstRelay.ip;
        result.mappedPort = firstRelay.port;
      }
      return result;
    }
    if (totalCandidates === 0) {
      return { ...baseResult, type: 'BLOCKED', confidence: 0.95 };
    }
    return { ...baseResult, type: 'BLOCKED', confidence: 0.85 };
  }

  const uniquePorts = new Set(srflxCandidates.map((c) => c.port));

  const portMappings = new Map<number, Set<number>>();
  srflxCandidates.forEach((c) => {
    if (c.relatedPort) {
      if (!portMappings.has(c.relatedPort)) {
        portMappings.set(c.relatedPort, new Set());
      }
      portMappings.get(c.relatedPort)?.add(c.port);
    }
  });

  let hasConsistentPortMapping = true;
  portMappings.forEach((externalPorts) => {
    if (externalPorts.size > 1) {
      hasConsistentPortMapping = false;
    }
  });

  const firstCandidate = srflxCandidates[0];

  const buildResult = (type: NATType, confidence: number): NATDetectionResult => {
    const result: NATDetectionResult = { ...baseResult, type, confidence };
    if (firstCandidate) {
      result.publicIP = firstCandidate.ip;
      result.mappedPort = firstCandidate.port;
    }
    return result;
  };

  if (uniquePorts.size > srflxCandidates.length / 2 && !hasConsistentPortMapping) {
    return buildResult('SYMMETRIC', 0.8);
  }

  if (hasConsistentPortMapping && uniquePorts.size === 1) {
    return buildResult('FULL_CONE', 0.75);
  }

  if (uniquePorts.size > 1) {
    return buildResult('PORT_RESTRICTED', 0.7);
  }

  return buildResult('RESTRICTED', 0.7);
}

// ============================================================================
// Connection Strategy
// ============================================================================

/**
 * Determine the optimal connection strategy based on NAT types
 *
 * @param localNAT - Local peer's NAT type
 * @param remoteNAT - Remote peer's NAT type
 * @returns Connection strategy recommendation
 */
export function getConnectionStrategy(
  localNAT: NATType,
  remoteNAT: NATType,
): ConnectionStrategyResult {
  // Both blocked = TURN only with TCP
  if (localNAT === 'BLOCKED' || remoteNAT === 'BLOCKED') {
    return {
      strategy: 'turn_only',
      directTimeout: 0,
      useTURN: true,
      prioritizeRelay: true,
      reason: 'One or both peers have blocked UDP, TURN relay required',
    };
  }

  // Both symmetric = TURN only (symmetric-to-symmetric rarely works)
  if (localNAT === 'SYMMETRIC' && remoteNAT === 'SYMMETRIC') {
    return {
      strategy: 'turn_only',
      directTimeout: 0,
      useTURN: true,
      prioritizeRelay: true,
      reason: 'Both peers behind symmetric NAT, direct connection unlikely',
    };
  }

  // One symmetric = aggressive TURN fallback
  // Symmetric + cone can sometimes work, but with low probability
  if (localNAT === 'SYMMETRIC' || remoteNAT === 'SYMMETRIC') {
    return {
      strategy: 'turn_fallback',
      directTimeout: 3000, // ICE-BREAKER: 3s direct then TURN
      useTURN: true,
      prioritizeRelay: false,
      reason: 'One peer behind symmetric NAT, quick TURN fallback recommended',
    };
  }

  // Port-restricted on both sides = moderate TURN fallback
  if (localNAT === 'PORT_RESTRICTED' && remoteNAT === 'PORT_RESTRICTED') {
    return {
      strategy: 'turn_fallback',
      directTimeout: 8000, // Try direct for 8 seconds
      useTURN: true,
      prioritizeRelay: false,
      reason: 'Both peers behind port-restricted NAT, TURN fallback available',
    };
  }

  // Mixed restrictive NATs = moderate TURN fallback
  if (
    (localNAT === 'PORT_RESTRICTED' || localNAT === 'RESTRICTED') &&
    (remoteNAT === 'PORT_RESTRICTED' || remoteNAT === 'RESTRICTED')
  ) {
    return {
      strategy: 'turn_fallback',
      directTimeout: 10000, // Try direct for 10 seconds
      useTURN: true,
      prioritizeRelay: false,
      reason: 'Restrictive NAT combination, TURN fallback available',
    };
  }

  // Unknown NAT type = conservative approach
  if (localNAT === 'UNKNOWN' || remoteNAT === 'UNKNOWN') {
    return {
      strategy: 'turn_fallback',
      directTimeout: 8000,
      useTURN: true,
      prioritizeRelay: false,
      reason: 'NAT type unknown, using conservative strategy with TURN fallback',
    };
  }

  // Full cone or open NAT = direct preferred
  // ICE-BREAKER AGENT 022: Both open = 5s direct timeout (fast path)
  return {
    strategy: 'direct',
    directTimeout: 5000, // ICE-BREAKER: 5s for open/full-cone NATs
    useTURN: false,
    prioritizeRelay: false,
    reason: 'Favorable NAT combination, direct connection preferred',
  };
}

/**
 * Get optimized ICE configuration based on NAT type
 * Uses multiple STUN servers for redundancy and optimal candidate gathering
 */
export function getOptimizedICEConfig(
  natType: NATType,
  turnServer?: string,
  turnCredentials?: { username: string; credential: string },
): RTCConfiguration {
  // Use diverse STUN servers for redundancy
  const stunServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com:3478' },
  ];

  const turnServers: RTCIceServer[] = [];
  if (turnServer && turnCredentials) {
    turnServers.push({
      urls: turnServer,
      username: turnCredentials.username,
      credential: turnCredentials.credential,
    });
  }

  switch (natType) {
    case 'BLOCKED':
      // Only use TURN, prefer TCP relay
      return {
        iceServers: turnServers.length > 0 ? turnServers : stunServers,
        iceTransportPolicy: turnServers.length > 0 ? 'relay' : 'all',
        iceCandidatePoolSize: 0, // Don't pre-gather for relay-only
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      };

    case 'SYMMETRIC':
      // Use both STUN and TURN, prioritize TURN
      // Symmetric NAT requires aggressive candidate gathering
      return {
        iceServers: [...turnServers, ...stunServers],
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 3, // Pre-gather candidates
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      };

    case 'PORT_RESTRICTED':
      // Moderate candidate gathering
      return {
        iceServers: [...stunServers, ...turnServers],
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 5,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      };

    case 'RESTRICTED':
      // Standard configuration
      return {
        iceServers: [...stunServers, ...turnServers],
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 6,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      };

    case 'FULL_CONE':
      // Aggressive candidate gathering for best performance
      // STUN-focused, TURN as backup
      return {
        iceServers: [...stunServers, ...turnServers],
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 8, // Maximum pre-gathering
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      };

    case 'UNKNOWN':
    default:
      // Conservative but comprehensive approach
      return {
        iceServers: [...stunServers, ...turnServers],
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 5,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear the cached NAT detection result
 */
export function clearNATCache(): void {
  cachedDetection = null;
}

/**
 * Get a human-readable description of the NAT type
 */
export function getNATTypeDescription(natType: NATType): string {
  switch (natType) {
    case 'FULL_CONE':
      return 'Full Cone NAT - Most permissive, direct connections work well';
    case 'RESTRICTED':
      return 'Restricted Cone NAT - Direct connections usually work';
    case 'PORT_RESTRICTED':
      return 'Port Restricted Cone NAT - May need relay fallback';
    case 'SYMMETRIC':
      return 'Symmetric NAT - Restrictive, often requires relay';
    case 'BLOCKED':
      return 'UDP Blocked - Relay required';
    case 'UNKNOWN':
    default:
      return 'Unknown - Could not determine NAT type';
  }
}

/**
 * Check if NAT type is considered restrictive
 */
export function isRestrictiveNAT(natType: NATType): boolean {
  return natType === 'SYMMETRIC' || natType === 'BLOCKED';
}

/**
 * Check if direct P2P connection is likely to succeed
 */
export function isDirectConnectionLikely(
  localNAT: NATType,
  remoteNAT: NATType,
): boolean {
  const strategy = getConnectionStrategy(localNAT, remoteNAT);
  return strategy.strategy === 'direct';
}

// ============================================================================
// Export
// ============================================================================

export default {
  detectNATType,
  getConnectionStrategy,
  getOptimizedICEConfig,
  clearNATCache,
  getNATTypeDescription,
  isRestrictiveNAT,
  isDirectConnectionLikely,
};
