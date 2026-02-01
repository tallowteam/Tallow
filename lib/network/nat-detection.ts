'use client';

/**
 * NAT Type Detection for WebRTC Connection Strategy
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

// Multiple STUN servers for accurate NAT detection
// Using diverse providers to avoid single point of failure
const DEFAULT_STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
  'stun:stun4.l.google.com:19302',
  'stun:stun.nextcloud.com:443',
  'stun:stun.stunprotocol.org:3478',
  'stun:stun.voip.blackberry.com:3478',
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

/**
 * Detect NAT type using ICE candidate gathering
 *
 * This uses a simplified heuristic approach based on the characteristics
 * of gathered ICE candidates. For more accurate detection, a full
 * STUN-based approach with multiple servers would be needed.
 */
export async function detectNATType(
  options: NATDetectionOptions = {}
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
  timeout: number
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

  const iceServers: RTCIceServer[] = stunServers.map((url) => ({ urls: url }));

  const pc = new RTCPeerConnection({ iceServers });
  const candidates: RTCIceCandidate[] = [];
  const srflxCandidates: Array<{
    ip: string;
    port: number;
    relatedAddress?: string;
    relatedPort?: number;
  }> = [];
  const hostCandidates: Array<{ ip: string; port: number }> = [];
  const relayCandidates: Array<{ ip: string; port: number }> = [];

  // Set up candidate collection
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      candidates.push(event.candidate);
      const parsed = parseCandidate(event.candidate);

      if (event.candidate.type === 'srflx' && parsed.ip !== null && parsed.port !== null) {
        const entry: {
          ip: string;
          port: number;
          relatedAddress?: string;
          relatedPort?: number;
        } = {
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

  // Create data channel to trigger ICE gathering
  pc.createDataChannel('nat-detect');

  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
  } catch (error) {
    secureLog.error('[NAT Detection] Failed to create offer:', error);
    pc.close();
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

  // Wait for ICE gathering to complete
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

  const detectionTime = performance.now() - startTime;

  // Analyze candidates to determine NAT type
  const result = analyzeNATType(
    srflxCandidates,
    hostCandidates,
    relayCandidates,
    candidates.length,
    detectionTime
  );

  secureLog.log('[NAT Detection] Completed', {
    type: result.type,
    confidence: result.confidence,
    candidates: candidates.length,
    srflx: srflxCandidates.length,
    host: hostCandidates.length,
    relay: relayCandidates.length,
    time: `${detectionTime.toFixed(0)}ms`,
  });

  return result;
}

/**
 * Analyze gathered candidates to determine NAT type
 */
function analyzeNATType(
  srflxCandidates: Array<{
    ip: string;
    port: number;
    relatedAddress?: string;
    relatedPort?: number;
  }>,
  hostCandidates: Array<{ ip: string; port: number }>,
  relayCandidates: Array<{ ip: string; port: number }>,
  totalCandidates: number,
  detectionTime: number
): NATDetectionResult {
  const baseResult = {
    detectionTime,
    candidateCount: totalCandidates,
    srflxCount: srflxCandidates.length,
    relayCount: relayCandidates.length,
    hostCount: hostCandidates.length,
  };

  // No server-reflexive candidates = blocked or very restrictive
  if (srflxCandidates.length === 0) {
    // If we have relay candidates, UDP is blocked but TCP TURN works
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

    // No candidates at all = completely blocked
    if (totalCandidates === 0) {
      return {
        ...baseResult,
        type: 'BLOCKED',
        confidence: 0.95,
      };
    }

    // Only host candidates = probably blocked
    return {
      ...baseResult,
      type: 'BLOCKED',
      confidence: 0.85,
    };
  }

  // Extract unique external ports
  const uniquePorts = new Set(srflxCandidates.map((c) => c.port));

  // Compare external ports to local ports
  const portMappings = new Map<number, Set<number>>();
  srflxCandidates.forEach((c) => {
    if (c.relatedPort) {
      if (!portMappings.has(c.relatedPort)) {
        portMappings.set(c.relatedPort, new Set());
      }
      portMappings.get(c.relatedPort)?.add(c.port);
    }
  });

  // Analyze port mapping behavior
  let hasConsistentPortMapping = true;
  portMappings.forEach((externalPorts) => {
    if (externalPorts.size > 1) {
      hasConsistentPortMapping = false;
    }
  });

  const firstCandidate = srflxCandidates[0];

  // Helper to build result with optional IP/port
  const buildResult = (
    type: NATType,
    confidence: number
  ): NATDetectionResult => {
    const result: NATDetectionResult = {
      ...baseResult,
      type,
      confidence,
    };
    if (firstCandidate) {
      result.publicIP = firstCandidate.ip;
      result.mappedPort = firstCandidate.port;
    }
    return result;
  };

  // Symmetric NAT: Different external ports for different destinations
  // Detection: If we see different external ports from the same local port
  // when contacting different STUN servers
  if (uniquePorts.size > srflxCandidates.length / 2 && !hasConsistentPortMapping) {
    return buildResult('SYMMETRIC', 0.8);
  }

  // If we have consistent port mapping across servers, it is likely cone NAT
  if (hasConsistentPortMapping && uniquePorts.size === 1) {
    // Full cone: same external endpoint for all internal endpoints
    // This is the most permissive NAT type
    return buildResult('FULL_CONE', 0.75);
  }

  // Port-restricted or address-restricted cone NAT
  // Without additional probing, we cannot distinguish these precisely
  // If ports vary slightly, it is likely port-restricted
  if (uniquePorts.size > 1) {
    return buildResult('PORT_RESTRICTED', 0.7);
  }

  // Default to restricted cone NAT
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
  remoteNAT: NATType
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
      directTimeout: 5000, // Try direct for 5 seconds
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
  // These are the most permissive and should work directly
  return {
    strategy: 'direct',
    directTimeout: 15000, // Give more time for direct connection
    useTURN: false,
    prioritizeRelay: false,
    reason: 'Favorable NAT combination, direct connection preferred',
  };
}

/**
 * Get ICE configuration optimized for the detected NAT type
 */
/**
 * Get optimized ICE configuration based on NAT type
 * Uses multiple STUN servers for redundancy and optimal candidate gathering
 */
export function getOptimizedICEConfig(
  natType: NATType,
  turnServer?: string,
  turnCredentials?: { username: string; credential: string }
): RTCConfiguration {
  // Use diverse STUN servers for redundancy
  const stunServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com:3478' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
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
  remoteNAT: NATType
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
