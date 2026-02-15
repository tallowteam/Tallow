/**
 * Transport Protocol Selector & Negotiator
 *
 * Selects the optimal transport protocol and negotiates it with the remote peer
 * through the signaling server. Both peers must agree on the transport before
 * data flows.
 *
 * Fallback chain (deterministic order):
 *   1. WebTransport (HTTP/3 QUIC) -- best latency + throughput, Chrome 114+
 *   2. WebRTC DataChannel         -- universal, NAT-traversing, P2P
 *   3. WebSocket relay             -- always works, last resort
 *
 * Experimental / future protocols (gated behind feature flags):
 *   - Raw QUIC: requires native client, not browser-available
 *   - MPTCP (Multipath TCP): OS-level, no browser API
 *   These are NOT attempted during negotiation. They exist only as type
 *   declarations for future extensibility.
 *
 * Decision Matrix:
 *   +------------------+--------------+-------------+-------------+
 *   | Use Case         | WebTransport | WebRTC DC   | WebSocket   |
 *   +------------------+--------------+-------------+-------------+
 *   | Large files      |  Best        |  Good       |  Fallback   |
 *   | Real-time video  |  Best        |  Best       |  Too slow   |
 *   | Chat messages    |  Good        |  Good       |  Best       |
 *   | Low latency      |  5-20ms      |  10-50ms    |  20-100ms   |
 *   | Behind NAT       |  HTTP/3 443  |  STUN/TURN  |  Always     |
 *   | Browser support  |  Chrome 114+ |  All        |  All        |
 *   +------------------+--------------+-------------+-------------+
 *
 * PERFORMANCE IMPACT: 10 | LATENCY IMPACT: 10
 * PRIORITY: HIGH
 */

import { isWebTransportSupported, WebTransportConnection } from './webtransport';
import { detectNATType, type NATType } from '../network/nat-detection';
import secureLog from '../utils/secure-logger';
import { addBreadcrumb } from '../monitoring/sentry';

// ============================================================================
// Type Definitions
// ============================================================================

/** Protocols that are actively supported and negotiated. */
export type TransportProtocol = 'webtransport' | 'webrtc' | 'websocket';

/**
 * Experimental protocols that exist as type declarations only.
 * These are NOT used in negotiation -- they require native clients or
 * OS-level features that browsers do not expose.
 */
export type ExperimentalProtocol = 'quic-raw' | 'mptcp';

export interface TransportOptions {
  // Use case requirements
  requireLowLatency?: boolean;
  requireHighThroughput?: boolean;
  requireReliability?: boolean;
  requireUnreliable?: boolean;
  requireBidirectional?: boolean;

  // Network constraints
  natType?: NATType;
  behindFirewall?: boolean;
  requireNATTraversal?: boolean;

  // Privacy settings
  requirePrivacy?: boolean;
  allowDirect?: boolean;

  // Browser/environment
  browserSupport?: BrowserSupport;
  /** WebTransport / WebSocket server URL. Required for those protocols. */
  serverUrl?: string;

  // Performance preferences
  preferLatency?: boolean;
  preferThroughput?: boolean;
  maxLatencyMs?: number;
  minBandwidthMbps?: number;

  // Fallback behavior
  /** If true, automatically try the next protocol in the chain on failure (default: true) */
  allowFallback?: boolean;
  /** If true, throw instead of falling back when the top pick fails requirements */
  strictRequirements?: boolean;
  /** Timeout for each individual transport probe/connect attempt in ms (default: 8000) */
  probeTimeoutMs?: number;
}

export interface BrowserSupport {
  webTransport: boolean;
  webRTC: boolean;
  webSocket: boolean;
  http3: boolean;
}

export interface TransportCapabilities {
  protocol: TransportProtocol;
  latency: 'low' | 'medium' | 'high';
  throughput: 'high' | 'medium' | 'low';
  reliability: 'guaranteed' | 'best-effort' | 'unreliable';
  natTraversal: 'excellent' | 'good' | 'poor';
  privacyScore: number;   // 0-10
  supportScore: number;   // 0-10 (browser compatibility)
}

export interface TransportSelectionResult {
  selected: TransportProtocol;
  reason: string;
  fallbacks: TransportProtocol[];
  capabilities: TransportCapabilities;
  warnings: string[];
  requiresServer: boolean;
  estimatedLatency: number;   // ms
  estimatedBandwidth: number; // Mbps
}

/**
 * Signaling message for transport negotiation between two peers.
 * Sent via the existing signaling server (WebSocket/room system).
 */
export interface TransportNegotiationMessage {
  type: 'transport-offer' | 'transport-answer';
  /** Ordered list of protocols the sender supports, highest preference first */
  supported: TransportProtocol[];
  /** The agreed-upon protocol (only in 'transport-answer') */
  agreed?: TransportProtocol;
  /** Server URL the initiator is willing to use for WebTransport/WebSocket */
  serverUrl?: string;
  /** Peer's browser support snapshot */
  browserSupport: BrowserSupport;
}

/**
 * Result of a full negotiation + connection attempt.
 */
export interface NegotiationResult {
  protocol: TransportProtocol;
  /** The transport object if probed successfully, null if probe was skipped */
  webtransportConnection: WebTransportConnection | null;
  negotiationTimeMs: number;
  attemptedProtocols: TransportProtocol[];
  fallbackUsed: boolean;
}

/**
 * Connection quality snapshot for an active transport.
 */
export interface TransportQuality {
  protocol: TransportProtocol;
  rttMs: number;
  throughputBps: number;
  /** 0.0 to 1.0 */
  quality: number;
  timestamp: number;
}

// ============================================================================
// Experimental Protocol Declarations (FUTURE / GATED)
// ============================================================================

/**
 * QUIC raw transport configuration.
 *
 * STATUS: EXPERIMENTAL -- NOT IMPLEMENTED
 * REASON: Browsers do not expose raw QUIC sockets. This would require a
 *         native client (Electron, Tauri, or CLI). Gated behind the
 *         'experimental-quic-raw' feature flag.
 *
 * When implemented, this would provide:
 *   - Direct QUIC connections without HTTP/3 framing
 *   - Custom congestion control
 *   - 0-RTT resumption
 *   - Multipath QUIC (draft-ietf-quic-multipath)
 */
export interface QuicRawConfig {
  /** @experimental Not implemented. Requires native client. */
  readonly _experimental: true;
  host: string;
  port: number;
  alpn: string[];
  certHashes?: string[];
}

/**
 * MPTCP (Multipath TCP) configuration.
 *
 * STATUS: EXPERIMENTAL -- NOT IMPLEMENTED
 * REASON: MPTCP is an OS-level feature (Linux 5.6+, iOS 14+). No browser
 *         JavaScript API exists. Would require a native transport layer.
 *         Gated behind the 'experimental-mptcp' feature flag.
 *
 * When implemented, this would provide:
 *   - Simultaneous use of WiFi + cellular
 *   - Seamless handover between networks
 *   - Aggregated bandwidth
 */
export interface MptcpConfig {
  /** @experimental Not implemented. Requires OS-level support + native client. */
  readonly _experimental: true;
  subflows: Array<{ address: string; port: number }>;
  scheduler: 'round-robin' | 'lowest-rtt' | 'redundant';
}

// ============================================================================
// Browser Support Detection
// ============================================================================

/**
 * Detect which transport protocols the current browser supports.
 */
export function detectBrowserSupport(): BrowserSupport {
  if (typeof window === 'undefined') {
    return { webTransport: false, webRTC: false, webSocket: false, http3: false };
  }

  const wt = isWebTransportSupported();
  return {
    webTransport: wt,
    webRTC: typeof RTCPeerConnection !== 'undefined',
    webSocket: typeof WebSocket !== 'undefined',
    http3: wt, // WebTransport implies HTTP/3
  };
}

/**
 * Check if a specific transport is supported in this browser.
 */
export function isTransportSupported(protocol: TransportProtocol): boolean {
  const support = detectBrowserSupport();
  switch (protocol) {
    case 'webtransport': return support.webTransport;
    case 'webrtc':       return support.webRTC;
    case 'websocket':    return support.webSocket;
    default:             return false;
  }
}

/**
 * Check if an experimental protocol could theoretically be used.
 * Always returns false in browser environments.
 */
export function isExperimentalProtocolAvailable(_protocol: ExperimentalProtocol): false {
  // These protocols require native clients. Never available in browser.
  return false;
}

// ============================================================================
// Transport Capabilities
// ============================================================================

/**
 * Static capability profile for each transport protocol.
 */
export function getTransportCapabilities(protocol: TransportProtocol): TransportCapabilities {
  switch (protocol) {
    case 'webtransport':
      return {
        protocol: 'webtransport',
        latency: 'low',          // 5-20ms typical
        throughput: 'high',      // >10 MB/s with HTTP/3 QUIC
        reliability: 'guaranteed', // QUIC provides reliability per-stream
        natTraversal: 'good',    // Uses HTTPS port 443, but needs server
        privacyScore: 8,         // TLS 1.3, but server sees client IP
        supportScore: 5,         // Chrome/Edge 114+ only
      };

    case 'webrtc':
      return {
        protocol: 'webrtc',
        latency: 'low',          // 10-50ms typical
        throughput: 'high',      // >5 MB/s with good connection
        reliability: 'best-effort', // Configurable ordered/unordered
        natTraversal: 'excellent',  // STUN/TURN designed for NAT
        privacyScore: 9,         // TURN relay + E2E encryption
        supportScore: 10,        // Universal browser support
      };

    case 'websocket':
      return {
        protocol: 'websocket',
        latency: 'medium',      // 20-100ms typical
        throughput: 'medium',   // 1-5 MB/s typical
        reliability: 'guaranteed', // TCP reliability
        natTraversal: 'excellent', // HTTP upgrade, works everywhere
        privacyScore: 7,        // TLS, but TCP head-of-line blocking
        supportScore: 10,       // Universal support
      };

    default:
      throw new Error(`Unknown protocol: ${protocol}`);
  }
}

// ============================================================================
// Transport Scoring Algorithm
// ============================================================================

/**
 * Score each transport protocol based on requirements and environment.
 * Returns an ordered list of (protocol, score, reasons) tuples.
 */
function scoreTransports(
  support: BrowserSupport,
  options: TransportOptions,
  natType?: NATType,
): Array<{ protocol: TransportProtocol; score: number; reasons: string[] }> {
  const results: Array<{ protocol: TransportProtocol; score: number; reasons: string[] }> = [];

  // --- WebTransport ---
  if (support.webTransport) {
    let score = 100;
    const reasons: string[] = [];

    if (options.requireLowLatency || options.preferLatency) {
      score += 30;
      reasons.push('Best latency (5-20ms via QUIC)');
    }
    if (options.requireHighThroughput || options.preferThroughput) {
      score += 25;
      reasons.push('High throughput via HTTP/3 multiplexed streams');
    }
    if (options.requireUnreliable) {
      score += 20;
      reasons.push('Native datagram (unreliable) support');
    }
    if (!options.serverUrl) {
      score -= 40;
      reasons.push('No server URL provided (WebTransport requires a server)');
    }
    if (options.requireNATTraversal) {
      score += 10;
      reasons.push('NAT traversal via HTTPS infrastructure');
    }

    results.push({ protocol: 'webtransport', score, reasons });
  } else {
    results.push({ protocol: 'webtransport', score: -1, reasons: ['Not supported in this browser'] });
  }

  // --- WebRTC ---
  if (support.webRTC) {
    let score = 90;
    const reasons: string[] = [];

    if (options.requireNATTraversal || natType === 'SYMMETRIC' || natType === 'RESTRICTED') {
      score += 30;
      reasons.push('Excellent NAT traversal with STUN/TURN');
    }
    if (options.requireLowLatency || options.preferLatency) {
      score += 20;
      reasons.push('Low latency (10-50ms)');
    }
    if (options.requirePrivacy) {
      score += 20;
      reasons.push('Privacy via TURN relay');
    }
    score += 15; // Universal support bonus
    reasons.push('Universal browser support');
    if (options.requireUnreliable) {
      score += 15;
      reasons.push('Unreliable DataChannel mode');
    }
    if (options.allowDirect && !options.requirePrivacy) {
      score += 10;
      reasons.push('Direct P2P connection possible');
    }

    results.push({ protocol: 'webrtc', score, reasons });
  } else {
    results.push({ protocol: 'webrtc', score: -1, reasons: ['Not supported in this browser'] });
  }

  // --- WebSocket ---
  if (support.webSocket) {
    let score = 70;
    const reasons: string[] = [];

    if (options.requireReliability) {
      score += 25;
      reasons.push('Guaranteed delivery via TCP');
    }
    score += 20; // Universal support bonus
    reasons.push('Universal browser support');
    if (options.behindFirewall || natType === 'SYMMETRIC') {
      score += 20;
      reasons.push('Works behind any firewall (HTTP upgrade)');
    }
    if (!options.serverUrl) {
      score -= 40;
      reasons.push('No server URL provided (WebSocket requires a relay server)');
    }
    if (options.requireBidirectional) {
      score += 10;
      reasons.push('Full-duplex bidirectional');
    }
    if (options.requireLowLatency) {
      score -= 20;
      reasons.push('Higher latency than WebTransport/WebRTC (TCP)');
    }
    if (options.requireHighThroughput) {
      score -= 15;
      reasons.push('Lower throughput due to TCP head-of-line blocking');
    }

    results.push({ protocol: 'websocket', score, reasons });
  } else {
    results.push({ protocol: 'websocket', score: -1, reasons: ['Not supported in this browser'] });
  }

  // Sort descending by score, filter out unsupported
  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ============================================================================
// Transport Selection (local, no negotiation)
// ============================================================================

/**
 * Select the best transport protocol based on local requirements.
 * This does NOT negotiate with a peer -- use `negotiateTransport` for that.
 */
export async function selectBestTransport(
  options: TransportOptions = {},
): Promise<TransportSelectionResult> {
  const support = options.browserSupport || detectBrowserSupport();
  const warnings: string[] = [];

  // Detect NAT type if needed
  let natType = options.natType;
  if (!natType && options.requireNATTraversal) {
    try {
      const result = await detectNATType();
      natType = result.type;
      addBreadcrumb('transport-selector', `NAT type: ${natType}`);
    } catch {
      warnings.push('NAT detection failed -- assuming symmetric NAT');
      natType = 'SYMMETRIC';
    }
  }

  const scored = scoreTransports(support, options, natType);
  if (scored.length === 0) {
    throw new Error('No supported transport protocol found in this browser');
  }

  const best = scored[0]!;
  const fallbacks = scored.slice(1).map((s) => s.protocol);
  const capabilities = getTransportCapabilities(best.protocol);
  const estimatedLatency = estimateLatency(best.protocol, natType);
  const estimatedBandwidth = estimateBandwidth(best.protocol, natType);

  // Strict requirement checks
  if (options.strictRequirements) {
    if (options.maxLatencyMs && estimatedLatency > options.maxLatencyMs) {
      throw new Error(
        `${best.protocol} estimated latency ${estimatedLatency}ms exceeds max ${options.maxLatencyMs}ms`,
      );
    }
    if (options.minBandwidthMbps && estimatedBandwidth < options.minBandwidthMbps) {
      throw new Error(
        `${best.protocol} estimated bandwidth ${estimatedBandwidth}Mbps below min ${options.minBandwidthMbps}Mbps`,
      );
    }
  }

  // Add server URL warnings
  if ((best.protocol === 'webtransport' || best.protocol === 'websocket') && !options.serverUrl) {
    warnings.push(`${best.protocol} was selected but no server URL was provided`);
  }

  const result: TransportSelectionResult = {
    selected: best.protocol,
    reason: best.reasons.join('; '),
    fallbacks,
    capabilities,
    warnings,
    requiresServer: best.protocol !== 'webrtc',
    estimatedLatency,
    estimatedBandwidth,
  };

  secureLog.log('[TransportSelector] Selected:', {
    protocol: best.protocol,
    score: best.score,
    fallbacks,
    estimatedLatency: `${estimatedLatency}ms`,
    estimatedBandwidth: `${estimatedBandwidth}Mbps`,
  });

  addBreadcrumb('transport-selector', `Selected ${best.protocol} (score: ${best.score})`);
  return result;
}

// ============================================================================
// Transport Negotiation (two-peer agreement)
// ============================================================================

/**
 * Build a transport offer message to send to the remote peer via signaling.
 * The initiator calls this and sends the result through the signaling channel.
 */
export function createTransportOffer(
  options: TransportOptions = {},
): TransportNegotiationMessage {
  const support = options.browserSupport || detectBrowserSupport();
  const scored = scoreTransports(support, options);

  return {
    type: 'transport-offer',
    supported: scored.map((s) => s.protocol),
    ...(options.serverUrl !== undefined ? { serverUrl: options.serverUrl } : {}),
    browserSupport: support,
  };
}

/**
 * Process a transport offer from the remote peer and produce an answer.
 * Returns the agreed protocol (highest-preference protocol both peers support)
 * and the answer message to send back.
 */
export function processTransportOffer(
  offer: TransportNegotiationMessage,
  localOptions: TransportOptions = {},
): { answer: TransportNegotiationMessage; agreed: TransportProtocol } {
  const localSupport = localOptions.browserSupport || detectBrowserSupport();
  const localScored = scoreTransports(localSupport, localOptions);
  const localProtocols = new Set(localScored.map((s) => s.protocol));

  // Find the best protocol both peers support (use remote preference order,
  // since the initiator's preference is considered authoritative)
  let agreed: TransportProtocol | null = null;
  for (const protocol of offer.supported) {
    if (localProtocols.has(protocol)) {
      agreed = protocol;
      break;
    }
  }

  // If no overlap, fall back to websocket (universally supported)
  if (!agreed) {
    if (localProtocols.has('websocket')) {
      agreed = 'websocket';
    } else {
      throw new Error('No mutually supported transport protocol found');
    }
  }

  secureLog.log('[TransportSelector] Negotiated:', {
    agreed,
    remoteSupported: offer.supported,
    localSupported: localScored.map((s) => s.protocol),
  });

  addBreadcrumb('transport-selector', `Negotiated ${agreed}`);

  const answer: TransportNegotiationMessage = {
    type: 'transport-answer',
    supported: localScored.map((s) => s.protocol),
    agreed,
    ...(localOptions.serverUrl || offer.serverUrl ? { serverUrl: localOptions.serverUrl || offer.serverUrl } : {}),
    browserSupport: localSupport,
  };

  return { answer, agreed };
}

// ============================================================================
// Fallback Chain Execution
// ============================================================================

/**
 * Attempt to establish a transport connection, walking the fallback chain
 * if earlier protocols fail.
 *
 * For WebTransport: actually attempts to connect (probe).
 * For WebRTC / WebSocket: returns immediately (the caller handles setup).
 *
 * @param protocols - Ordered list of protocols to try (best first)
 * @param serverUrl - Server URL for WebTransport/WebSocket
 * @param probeTimeoutMs - Timeout per protocol attempt (default 8000)
 * @returns The first protocol that succeeded, plus any WebTransport connection
 */
export async function attemptWithFallback(
  protocols: TransportProtocol[],
  serverUrl?: string,
  probeTimeoutMs: number = 8000,
): Promise<NegotiationResult> {
  const startTime = performance.now();
  const attempted: TransportProtocol[] = [];

  for (const protocol of protocols) {
    attempted.push(protocol);

    if (protocol === 'webtransport') {
      if (!serverUrl) {
        secureLog.log('[TransportSelector] Skipping WebTransport (no server URL)');
        continue;
      }
      if (!isWebTransportSupported()) {
        secureLog.log('[TransportSelector] Skipping WebTransport (not supported)');
        continue;
      }

      // Actually attempt a WebTransport connection
      try {
        const conn = new WebTransportConnection({
          url: serverUrl,
          connectTimeoutMs: probeTimeoutMs,
        });
        await conn.connect(serverUrl);

        secureLog.log('[TransportSelector] WebTransport probe succeeded');
        return {
          protocol: 'webtransport',
          webtransportConnection: conn,
          negotiationTimeMs: Math.round(performance.now() - startTime),
          attemptedProtocols: attempted,
          fallbackUsed: attempted.length > 1,
        };
      } catch (err) {
        secureLog.log('[TransportSelector] WebTransport probe failed:', err instanceof Error ? err.message : err);
        // Continue to next protocol
      }
    }

    if (protocol === 'webrtc') {
      if (typeof RTCPeerConnection === 'undefined') {
        secureLog.log('[TransportSelector] Skipping WebRTC (not supported)');
        continue;
      }

      // WebRTC is available -- caller will handle peer connection setup
      secureLog.log('[TransportSelector] WebRTC available, selected');
      return {
        protocol: 'webrtc',
        webtransportConnection: null,
        negotiationTimeMs: Math.round(performance.now() - startTime),
        attemptedProtocols: attempted,
        fallbackUsed: attempted.length > 1,
      };
    }

    if (protocol === 'websocket') {
      if (typeof WebSocket === 'undefined') {
        secureLog.log('[TransportSelector] Skipping WebSocket (not supported)');
        continue;
      }

      // WebSocket is available -- caller will handle connection
      secureLog.log('[TransportSelector] WebSocket fallback selected');
      return {
        protocol: 'websocket',
        webtransportConnection: null,
        negotiationTimeMs: Math.round(performance.now() - startTime),
        attemptedProtocols: attempted,
        fallbackUsed: attempted.length > 1,
      };
    }
  }

  throw new Error(
    `All transport protocols failed. Attempted: ${attempted.join(', ')}`,
  );
}

// ============================================================================
// Connection Quality Monitoring
// ============================================================================

/**
 * Sample connection quality for the given transport.
 * Returns a normalized quality score (0.0 = terrible, 1.0 = excellent).
 */
export function assessTransportQuality(
  protocol: TransportProtocol,
  rttMs: number,
  throughputBps: number,
): TransportQuality {
  // Normalize RTT: 0ms = 1.0, 200ms+ = 0.0
  const rttScore = Math.max(0, 1 - rttMs / 200);

  // Normalize throughput: 0 = 0.0, 10 MB/s+ = 1.0
  const throughputScore = Math.min(1, throughputBps / (10 * 1024 * 1024));

  // Weight RTT more for latency-sensitive use cases
  const quality = rttScore * 0.6 + throughputScore * 0.4;

  return {
    protocol,
    rttMs,
    throughputBps,
    quality: Math.round(quality * 100) / 100,
    timestamp: Date.now(),
  };
}

// ============================================================================
// Performance Estimators
// ============================================================================

function estimateLatency(protocol: TransportProtocol, natType?: NATType): number {
  const base: Record<TransportProtocol, number> = {
    webtransport: 10,
    webrtc: 25,
    websocket: 50,
  };
  let latency = base[protocol] ?? 100;

  // NAT overhead
  if ((natType === 'SYMMETRIC' || natType === 'RESTRICTED') && protocol === 'webrtc') {
    latency += 20; // TURN relay overhead
  }

  return latency;
}

function estimateBandwidth(protocol: TransportProtocol, natType?: NATType): number {
  const base: Record<TransportProtocol, number> = {
    webtransport: 15,
    webrtc: 10,
    websocket: 3,
  };
  let bw = base[protocol] ?? 1;

  if (natType === 'SYMMETRIC') {
    bw *= 0.7; // Relay reduces throughput
  }

  return Math.round(bw * 10) / 10;
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function selectForFileTransfer(
  serverUrl?: string,
): Promise<TransportSelectionResult> {
  return selectBestTransport({
    requireHighThroughput: true,
    requireReliability: true,
    requireBidirectional: true,
    preferThroughput: true,
    allowFallback: true,
    ...(serverUrl ? { serverUrl } : {}),
  });
}

export async function selectForRealtime(
  serverUrl?: string,
): Promise<TransportSelectionResult> {
  return selectBestTransport({
    requireLowLatency: true,
    requireUnreliable: true,
    requireBidirectional: true,
    preferLatency: true,
    maxLatencyMs: 50,
    allowFallback: true,
    ...(serverUrl ? { serverUrl } : {}),
  });
}

export async function selectForChat(
  serverUrl?: string,
): Promise<TransportSelectionResult> {
  return selectBestTransport({
    requireReliability: true,
    requireBidirectional: true,
    allowFallback: true,
    ...(serverUrl ? { serverUrl } : {}),
  });
}

export async function selectForSignaling(
  serverUrl?: string,
): Promise<TransportSelectionResult> {
  return selectBestTransport({
    requireReliability: true,
    requireBidirectional: true,
    requireNATTraversal: true,
    allowFallback: true,
    ...(serverUrl ? { serverUrl } : {}),
  });
}

export async function selectForPrivacy(
  serverUrl?: string,
): Promise<TransportSelectionResult> {
  return selectBestTransport({
    requirePrivacy: true,
    allowDirect: false,
    requireReliability: true,
    allowFallback: true,
    ...(serverUrl ? { serverUrl } : {}),
  });
}

// ============================================================================
// Default export
// ============================================================================

export default {
  selectBestTransport,
  detectBrowserSupport,
  isTransportSupported,
  isExperimentalProtocolAvailable,
  getTransportCapabilities,
  createTransportOffer,
  processTransportOffer,
  attemptWithFallback,
  assessTransportQuality,
  selectForFileTransfer,
  selectForRealtime,
  selectForChat,
  selectForSignaling,
  selectForPrivacy,
};
