'use client';

/**
 * Transport Protocol Selector
 *
 * Intelligently selects the optimal transport protocol based on:
 * - Browser support (WebTransport, WebRTC, WebSocket)
 * - Network conditions (NAT type, latency, bandwidth)
 * - Use case requirements (reliability, latency, throughput)
 * - Privacy considerations (relay preference, IP leak prevention)
 *
 * Priority Order:
 * 1. WebTransport (HTTP/3 QUIC) - Best latency and throughput
 * 2. WebRTC DataChannel (UDP) - Good latency, NAT traversal
 * 3. WebSocket (TCP) - Universal fallback, reliable
 *
 * Decision Matrix:
 * ┌─────────────────┬──────────────┬─────────────┬─────────────┐
 * │ Use Case        │ WebTransport │ WebRTC DC   │ WebSocket   │
 * ├─────────────────┼──────────────┼─────────────┼─────────────┤
 * │ Large files     │ ✓✓✓ Best     │ ✓✓ Good     │ ✓ Fallback  │
 * │ Real-time video │ ✓✓✓ Best     │ ✓✓✓ Best    │ ✗ Too slow  │
 * │ Chat messages   │ ✓✓ Good      │ ✓✓ Good     │ ✓✓✓ Best    │
 * │ Low latency     │ ✓✓✓ 5-20ms   │ ✓✓ 10-50ms  │ ✓ 20-100ms  │
 * │ Behind NAT      │ ✓✓ HTTP/3    │ ✓✓✓ STUN    │ ✓✓✓ Always  │
 * │ Browser support │ ✓ Chrome 97+ │ ✓✓✓ All     │ ✓✓✓ All     │
 * └─────────────────┴──────────────┴─────────────┴─────────────┘
 *
 * PERFORMANCE IMPACT: 10 | LATENCY IMPACT: 10
 * PRIORITY: HIGH
 */

import { isWebTransportSupported, getWebTransportSupport } from './webtransport';
import { detectNATType, type NATType } from '../network/nat-detection';
import secureLog from '../utils/secure-logger';
import { addBreadcrumb } from '../monitoring/sentry';

// ============================================================================
// Type Definitions
// ============================================================================

export type TransportProtocol = 'webtransport' | 'webrtc' | 'websocket';

export interface TransportOptions {
  // Use case requirements
  requireLowLatency?: boolean; // < 20ms RTT
  requireHighThroughput?: boolean; // > 10 MB/s
  requireReliability?: boolean; // Guaranteed delivery
  requireUnreliable?: boolean; // Datagrams for real-time
  requireBidirectional?: boolean; // Two-way communication

  // Network constraints
  natType?: NATType; // Detected NAT type
  behindFirewall?: boolean;
  requireNATTraversal?: boolean;

  // Privacy settings
  requirePrivacy?: boolean; // Force relay/TURN
  allowDirect?: boolean; // Allow direct P2P

  // Browser/environment
  browserSupport?: BrowserSupport;
  serverUrl?: string; // For WebTransport/WebSocket

  // Performance preferences
  preferLatency?: boolean; // Optimize for latency vs throughput
  preferThroughput?: boolean;
  maxLatencyMs?: number; // Maximum acceptable latency
  minBandwidthMbps?: number; // Minimum bandwidth requirement

  // Fallback behavior
  allowFallback?: boolean; // Try next best transport
  strictRequirements?: boolean; // Fail if requirements not met
}

export interface BrowserSupport {
  webTransport: boolean;
  webRTC: boolean;
  webSocket: boolean;
  http3: boolean;
}

export interface TransportCapabilities {
  protocol: TransportProtocol;
  latency: 'low' | 'medium' | 'high'; // < 20ms, < 50ms, > 50ms
  throughput: 'high' | 'medium' | 'low'; // > 10 MB/s, > 1 MB/s, < 1 MB/s
  reliability: 'guaranteed' | 'best-effort' | 'unreliable';
  natTraversal: 'excellent' | 'good' | 'poor';
  privacyScore: number; // 0-10
  supportScore: number; // 0-10 (browser compatibility)
}

export interface TransportSelectionResult {
  selected: TransportProtocol;
  reason: string;
  fallbacks: TransportProtocol[];
  capabilities: TransportCapabilities;
  warnings: string[];
  requiresServer: boolean;
  estimatedLatency: number; // ms
  estimatedBandwidth: number; // Mbps
}

// ============================================================================
// Browser Support Detection
// ============================================================================

/**
 * Detect all supported transport protocols in current browser
 */
export function detectBrowserSupport(): BrowserSupport {
  if (typeof window === 'undefined') {
    return {
      webTransport: false,
      webRTC: false,
      webSocket: false,
      http3: false,
    };
  }

  return {
    webTransport: isWebTransportSupported(),
    webRTC: 'RTCPeerConnection' in window,
    webSocket: 'WebSocket' in window,
    http3: isWebTransportSupported(), // WebTransport implies HTTP/3 support
  };
}

/**
 * Check if a specific transport is supported
 */
export function isTransportSupported(protocol: TransportProtocol): boolean {
  const support = detectBrowserSupport();

  switch (protocol) {
    case 'webtransport':
      return support.webTransport;
    case 'webrtc':
      return support.webRTC;
    case 'websocket':
      return support.webSocket;
    default:
      return false;
  }
}

// ============================================================================
// Transport Capabilities
// ============================================================================

/**
 * Get capabilities of a transport protocol
 */
export function getTransportCapabilities(protocol: TransportProtocol): TransportCapabilities {
  switch (protocol) {
    case 'webtransport':
      return {
        protocol: 'webtransport',
        latency: 'low', // 5-20ms typical
        throughput: 'high', // > 10 MB/s with HTTP/3
        reliability: 'guaranteed', // QUIC reliability
        natTraversal: 'good', // HTTP/3 over 443, but needs server
        privacyScore: 8, // TLS 1.3, but server sees IP
        supportScore: 6, // Chrome 97+, Edge 97+, limited support
      };

    case 'webrtc':
      return {
        protocol: 'webrtc',
        latency: 'low', // 10-50ms typical
        throughput: 'high', // > 5 MB/s with good connection
        reliability: 'best-effort', // Can configure ordered/unordered
        natTraversal: 'excellent', // STUN/TURN designed for NAT
        privacyScore: 9, // Can use TURN relay, E2E encryption
        supportScore: 10, // Universal browser support
      };

    case 'websocket':
      return {
        protocol: 'websocket',
        latency: 'medium', // 20-100ms typical
        throughput: 'medium', // 1-5 MB/s typical
        reliability: 'guaranteed', // TCP reliability
        natTraversal: 'excellent', // Works everywhere (HTTP upgrade)
        privacyScore: 7, // TLS, but TCP head-of-line blocking
        supportScore: 10, // Universal support
      };

    default:
      throw new Error(`Unknown protocol: ${protocol}`);
  }
}

// ============================================================================
// Transport Selection Algorithm
// ============================================================================

/**
 * Select the best transport protocol based on requirements
 */
export async function selectBestTransport(
  options: TransportOptions = {}
): Promise<TransportSelectionResult> {
  const support = options.browserSupport || detectBrowserSupport();
  const warnings: string[] = [];

  // Detect NAT type if needed and not provided
  let natType = options.natType;
  if (!natType && options.requireNATTraversal) {
    try {
      const natResult = await detectNATType();
      natType = natResult.type;
      addBreadcrumb('transport-selector', `Detected NAT type: ${natType}`);
    } catch (error) {
      warnings.push('Failed to detect NAT type, assuming symmetric NAT');
      natType = 'symmetric';
    }
  }

  // Calculate scores for each transport
  const scores = new Map<TransportProtocol, number>();
  const reasons = new Map<TransportProtocol, string[]>();

  // Score WebTransport
  if (support.webTransport) {
    let score = 100;
    const scoreReasons: string[] = [];

    // Latency advantage
    if (options.requireLowLatency || options.preferLatency) {
      score += 30;
      scoreReasons.push('Best latency (5-20ms)');
    }

    // Throughput advantage
    if (options.requireHighThroughput || options.preferThroughput) {
      score += 25;
      scoreReasons.push('High throughput via HTTP/3 QUIC');
    }

    // Datagram support
    if (options.requireUnreliable) {
      score += 20;
      scoreReasons.push('Native unreliable datagram support');
    }

    // Server requirement
    if (!options.serverUrl) {
      score -= 30;
      scoreReasons.push('Requires server URL');
      warnings.push('WebTransport requires a server URL');
    }

    // NAT traversal
    if (options.requireNATTraversal) {
      score += 10;
      scoreReasons.push('NAT traversal via HTTPS infrastructure');
    }

    scores.set('webtransport', score);
    reasons.set('webtransport', scoreReasons);
  } else {
    scores.set('webtransport', -1);
    reasons.set('webtransport', ['Not supported in this browser']);
  }

  // Score WebRTC
  if (support.webRTC) {
    let score = 90;
    const scoreReasons: string[] = [];

    // NAT traversal excellence
    if (options.requireNATTraversal || natType === 'symmetric' || natType === 'restricted') {
      score += 30;
      scoreReasons.push('Excellent NAT traversal with STUN/TURN');
    }

    // Low latency
    if (options.requireLowLatency || options.preferLatency) {
      score += 20;
      scoreReasons.push('Low latency (10-50ms)');
    }

    // Privacy with TURN
    if (options.requirePrivacy) {
      score += 20;
      scoreReasons.push('Privacy via TURN relay');
    }

    // Universal support
    score += 15;
    scoreReasons.push('Universal browser support');

    // Datagram support
    if (options.requireUnreliable) {
      score += 15;
      scoreReasons.push('Unreliable DataChannel support');
    }

    // Direct P2P
    if (options.allowDirect && !options.requirePrivacy) {
      score += 10;
      scoreReasons.push('Direct P2P connection possible');
    }

    scores.set('webrtc', score);
    reasons.set('webrtc', scoreReasons);
  } else {
    scores.set('webrtc', -1);
    reasons.set('webrtc', ['Not supported in this browser']);
  }

  // Score WebSocket
  if (support.webSocket) {
    let score = 70;
    const scoreReasons: string[] = [];

    // Reliability
    if (options.requireReliability) {
      score += 25;
      scoreReasons.push('Guaranteed delivery via TCP');
    }

    // Universal support
    score += 20;
    scoreReasons.push('Universal browser support');

    // NAT traversal
    if (options.behindFirewall || natType === 'symmetric') {
      score += 20;
      scoreReasons.push('Works behind any firewall (HTTP upgrade)');
    }

    // Server requirement
    if (!options.serverUrl) {
      score -= 30;
      scoreReasons.push('Requires server URL');
      warnings.push('WebSocket requires a server URL');
    }

    // Bidirectional
    if (options.requireBidirectional) {
      score += 10;
      scoreReasons.push('Full-duplex bidirectional');
    }

    // Lower latency penalty
    if (options.requireLowLatency) {
      score -= 20;
      scoreReasons.push('Higher latency than WebTransport/WebRTC');
    }

    // Throughput penalty
    if (options.requireHighThroughput) {
      score -= 15;
      scoreReasons.push('Lower throughput than WebTransport/WebRTC');
    }

    scores.set('websocket', score);
    reasons.set('websocket', scoreReasons);
  } else {
    scores.set('websocket', -1);
    reasons.set('websocket', ['Not supported in this browser']);
  }

  // Find best scoring transport
  const sortedTransports = Array.from(scores.entries())
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedTransports.length === 0) {
    throw new Error('No supported transport protocol found in this browser');
  }

  const [selected, selectedScore] = sortedTransports[0]!;
  const selectedReasons = reasons.get(selected) || [];
  const fallbacks = sortedTransports.slice(1).map(([protocol]) => protocol);

  const capabilities = getTransportCapabilities(selected);

  // Estimate performance
  const estimatedLatency = estimateLatency(selected, natType);
  const estimatedBandwidth = estimateBandwidth(selected, natType);

  // Check strict requirements
  if (options.strictRequirements) {
    if (options.maxLatencyMs && estimatedLatency > options.maxLatencyMs) {
      throw new Error(
        `Selected transport ${selected} has estimated latency ${estimatedLatency}ms, exceeds max ${options.maxLatencyMs}ms`
      );
    }

    if (options.minBandwidthMbps && estimatedBandwidth < options.minBandwidthMbps) {
      throw new Error(
        `Selected transport ${selected} has estimated bandwidth ${estimatedBandwidth}Mbps, below min ${options.minBandwidthMbps}Mbps`
      );
    }
  }

  const result: TransportSelectionResult = {
    selected,
    reason: selectedReasons.join('; '),
    fallbacks,
    capabilities,
    warnings,
    requiresServer: selected === 'webtransport' || selected === 'websocket',
    estimatedLatency,
    estimatedBandwidth,
  };

  secureLog.log('[TransportSelector] Selected transport:', {
    protocol: selected,
    score: selectedScore,
    reasons: selectedReasons,
    fallbacks,
    estimatedLatency: `${estimatedLatency}ms`,
    estimatedBandwidth: `${estimatedBandwidth}Mbps`,
  });

  addBreadcrumb('transport-selector', `Selected ${selected} transport (score: ${selectedScore})`);

  return result;
}

/**
 * Estimate latency for a transport protocol
 */
function estimateLatency(protocol: TransportProtocol, natType?: NATType): number {
  let baseLatency: number;

  switch (protocol) {
    case 'webtransport':
      baseLatency = 10; // 5-20ms typical
      break;
    case 'webrtc':
      baseLatency = 25; // 10-50ms typical
      break;
    case 'websocket':
      baseLatency = 50; // 20-100ms typical
      break;
    default:
      baseLatency = 100;
  }

  // NAT type impact
  if (natType === 'symmetric' || natType === 'restricted') {
    // May need relay
    if (protocol === 'webrtc') {
      baseLatency += 20; // TURN relay overhead
    }
  }

  return baseLatency;
}

/**
 * Estimate bandwidth for a transport protocol
 */
function estimateBandwidth(protocol: TransportProtocol, natType?: NATType): number {
  let baseBandwidth: number;

  switch (protocol) {
    case 'webtransport':
      baseBandwidth = 15; // 10-20+ Mbps typical
      break;
    case 'webrtc':
      baseBandwidth = 10; // 5-15 Mbps typical
      break;
    case 'websocket':
      baseBandwidth = 3; // 1-5 Mbps typical
      break;
    default:
      baseBandwidth = 1;
  }

  // NAT type impact
  if (natType === 'symmetric') {
    // Relay routing may reduce bandwidth
    baseBandwidth *= 0.7;
  }

  return baseBandwidth;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick transport selection for common use cases
 */
export async function selectForFileTransfer(
  serverUrl?: string
): Promise<TransportSelectionResult> {
  return selectBestTransport({
    requireHighThroughput: true,
    requireReliability: true,
    requireBidirectional: true,
    preferThroughput: true,
    allowFallback: true,
    serverUrl,
  });
}

/**
 * Select transport for real-time communication (video/audio)
 */
export async function selectForRealtime(serverUrl?: string): Promise<TransportSelectionResult> {
  return selectBestTransport({
    requireLowLatency: true,
    requireUnreliable: true, // Datagrams for video
    requireBidirectional: true,
    preferLatency: true,
    maxLatencyMs: 50,
    allowFallback: true,
    serverUrl,
  });
}

/**
 * Select transport for chat messages
 */
export async function selectForChat(serverUrl?: string): Promise<TransportSelectionResult> {
  return selectBestTransport({
    requireReliability: true,
    requireBidirectional: true,
    allowFallback: true,
    serverUrl,
  });
}

/**
 * Select transport for signaling
 */
export async function selectForSignaling(serverUrl?: string): Promise<TransportSelectionResult> {
  return selectBestTransport({
    requireReliability: true,
    requireBidirectional: true,
    requireNATTraversal: true,
    allowFallback: true,
    serverUrl,
  });
}

/**
 * Select transport with maximum privacy
 */
export async function selectForPrivacy(serverUrl?: string): Promise<TransportSelectionResult> {
  return selectBestTransport({
    requirePrivacy: true,
    allowDirect: false,
    requireReliability: true,
    allowFallback: true,
    serverUrl,
  });
}

// ============================================================================
// Export
// ============================================================================

export default {
  selectBestTransport,
  detectBrowserSupport,
  isTransportSupported,
  getTransportCapabilities,
  selectForFileTransfer,
  selectForRealtime,
  selectForChat,
  selectForSignaling,
  selectForPrivacy,
};
