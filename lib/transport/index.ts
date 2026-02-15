'use client';

/**
 * Transport Layer Module Index
 *
 * Exports all transport layer components for privacy-preserving communication:
 * - Traffic obfuscation (protocol disguise, domain fronting)
 * - Packet padding (size normalization)
 * - Timing obfuscation (traffic analysis resistance)
 * - Private WebRTC (TURN-only, IP leak prevention)
 * - Onion routing (multi-hop relay - experimental)
 */

// ============================================================================
// Traffic Obfuscation
// ============================================================================

export {
  TrafficObfuscator,
  getTrafficObfuscator,
  resetTrafficObfuscator,
  trafficObfuscator,
  PacketType,
  type ObfuscationConfig,
  type ObfuscatedPacket,
  type PacketFlags,
  type DisguiseHeaders,
  type DomainFrontConfig,
  type ObfuscationStats,
} from './obfuscation';

// ============================================================================
// Packet Padding
// ============================================================================

export {
  PacketPadder,
  getPacketPadder,
  resetPacketPadder,
  quickPad,
  quickUnpad,
  PaddingMode,
  type PaddingConfig,
  type PaddedPacket,
  type PaddingStats,
} from './packet-padding';

// ============================================================================
// Timing Obfuscation
// ============================================================================

export {
  TimingObfuscator,
  getTimingObfuscator,
  resetTimingObfuscator,
  applyTimingDelay,
  getTimingDelay,
  TimingMode,
  type TimingConfig,
  type PacketTiming,
  type TimingStats,
} from './timing-obfuscation';

// ============================================================================
// Private WebRTC Transport
// ============================================================================

export {
  PrivateTransport,
  getPrivateTransport,
  resetPrivateTransport,
  enableObfuscation,
  disableObfuscation,
  obfuscateData,
  deobfuscateData,
  setObfuscationMode,
  type PrivateTransportConfig,
  type TransportStats,
} from './private-webrtc';

// ============================================================================
// Onion Routing (Experimental)
// ============================================================================

export {
  OnionRouter,
  isOnionRoutingAvailable,
  getOnionRoutingStatus,
  discoverRelays,
  buildCircuit,
  wrapInOnionLayers,
  unwrapOnionLayer,
  OnionRoutingUnavailableError,
  defaultOnionConfig,
  type RelayNode,
  type OnionLayer,
  type OnionPacket,
  type OnionCircuit,
  type OnionRoutingConfig,
} from './onion-routing';

// ============================================================================
// WebTransport API (HTTP/3 QUIC)
// ============================================================================

export {
  WebTransportConnection,
  connect,
  isWebTransportSupported,
  getWebTransportSupport,
  readStream,
  writeStream,
  pipeStreams,
  type WebTransportState,
  type StreamType,
  type WebTransportConfig,
  type WebTransportStats,
  type WebTransportStreamOptions,
  type DatagramOptions,
  type FileTransferHeader,
} from './webtransport';

// ============================================================================
// Transport Protocol Selection & Negotiation
// ============================================================================

export {
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
  type TransportProtocol,
  type ExperimentalProtocol,
  type TransportOptions,
  type BrowserSupport,
  type TransportCapabilities,
  type TransportSelectionResult,
  type TransportNegotiationMessage,
  type NegotiationResult,
  type TransportQuality,
  type QuicRawConfig,
  type MptcpConfig,
} from './transport-selector';

// ============================================================================
// Quick Start Presets
// ============================================================================

import { getPrivateTransport as getTransport } from './private-webrtc';

/**
 * Initialize transport with maximum privacy (stealth mode)
 * - TURN-only connections
 * - Full obfuscation enabled
 * - Cover traffic active
 * - Maximum padding
 */
export function initializeStealthMode(): void {
  const transport = getTransport({
    forceRelay: true,
    enableObfuscation: true,
    enableAntiFingerprinting: true,
  });
  transport.setObfuscationMode('stealth');
}

/**
 * Initialize transport with balanced privacy/performance
 * - TURN-only connections
 * - Obfuscation enabled with moderate settings
 */
export function initializeBalancedMode(): void {
  const transport = getTransport({
    forceRelay: true,
    enableObfuscation: true,
    enableAntiFingerprinting: true,
  });
  transport.setObfuscationMode('balanced');
}

/**
 * Initialize transport with maximum performance
 * - Direct connections allowed
 * - Minimal obfuscation
 */
export function initializePerformanceMode(): void {
  const transport = getTransport({
    forceRelay: false,
    enableObfuscation: true,
    enableAntiFingerprinting: false,
  });
  transport.setObfuscationMode('performance');
}

/**
 * Initialize transport with domain fronting
 * - Routes traffic through CDN
 * - Hides actual destination
 */
export function initializeWithDomainFronting(
  frontDomain: string,
  targetDomain: string
): void {
  const transport = getTransport({
    forceRelay: true,
    enableObfuscation: true,
    enableDomainFronting: true,
    frontDomain,
    targetDomain,
  });
  transport.setObfuscationMode('stealth');
}
