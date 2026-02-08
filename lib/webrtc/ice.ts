/**
 * ICE Candidate Management
 * Agent 022 — ICE-BREAKER
 *
 * Manages ICE (Interactive Connectivity Establishment) candidates
 * for WebRTC NAT traversal. Handles STUN/TURN server configuration,
 * candidate filtering, prioritization, and aggressive nomination.
 *
 * Strategy:
 * 1. Gather host candidates (local addresses)
 * 2. Gather srflx candidates (STUN-derived public addresses)
 * 3. If symmetric NAT detected, add relay candidates (TURN)
 * 4. Use aggressive nomination for faster connection
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

// ============================================================================
// DEFAULT STUN/TURN SERVERS
// ============================================================================

const DEFAULT_STUN_SERVERS: ICEServerConfig[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

// ============================================================================
// ICE CONFIGURATION
// ============================================================================

/**
 * Create ICE configuration based on detected NAT type.
 */
export function createICEConfig(
  natType: NATType | 'unknown' = 'unknown',
  turnCredentials?: { username: string; credential: string; urls: string[] }
): ICEConfig {
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
    stunServers: DEFAULT_STUN_SERVERS,
    turnServers,
    iceTransportPolicy: forceRelay ? 'relay' : 'all',
    bundlePolicy: 'max-bundle',
    iceCandidatePoolSize: natType === 'FULL_CONE' ? 1 : 3,
    gatheringTimeout: forceRelay ? 5000 : 10000,
    aggressiveNomination: true,
  };
}

/**
 * Convert ICE config to RTCConfiguration for WebRTC.
 */
export function toRTCConfiguration(config: ICEConfig): RTCConfiguration {
  const iceServers: RTCIceServer[] = [
    ...config.stunServers.map(s => ({
      urls: s.urls,
      username: s.username,
      credential: s.credential,
    })),
    ...config.turnServers.map(s => ({
      urls: s.urls,
      username: s.username,
      credential: s.credential,
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
  } = {}
): ICECandidate[] {
  const {
    allowHost = true,
    allowSrflx = true,
    allowRelay = true,
    allowTcp = true,
    excludePrivateAddresses = false,
  } = policy;

  return candidates.filter(c => {
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
    host: candidates.filter(c => c.type === 'host').length,
    srflx: candidates.filter(c => c.type === 'srflx').length,
    relay: candidates.filter(c => c.type === 'relay').length,
    udp: candidates.filter(c => c.protocol === 'udp').length,
    tcp: candidates.filter(c => c.protocol === 'tcp').length,
  };
}
