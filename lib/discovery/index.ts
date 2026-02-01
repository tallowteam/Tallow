/**
 * Discovery Module Exports
 *
 * This module provides comprehensive device discovery for TALLOW:
 *
 * 1. **Local Discovery** (Signaling Server)
 *    - Works over the internet via signaling server
 *    - Uses WebRTC for peer-to-peer connections
 *
 * 2. **mDNS Discovery** (Bonjour/Zeroconf)
 *    - Local network discovery via mDNS daemon
 *    - Lower latency, no internet required
 *
 * 3. **Unified Discovery**
 *    - Combines mDNS and signaling seamlessly
 *    - Automatic fallback when mDNS unavailable
 *    - Prioritizes direct connections
 *
 * @module discovery
 */

// ============================================================================
// mDNS Types
// ============================================================================

export {
  // Constants
  MDNS_SERVICE_TYPE,
  TRANSFER_PORT,
  DAEMON_WS_PORT,
  PROTOCOL_VERSION,

  // Types
  type TallowPlatform,
  type TallowCapability,
  type MDNSTxtRecord,
  type ParsedCapabilities,
  type TallowDevice,
  type TallowDeviceAdvertisement,

  // WebSocket Protocol Types
  type WSClientMessage,
  type WSDaemonMessage,
  type WSStartDiscoveryMessage,
  type WSStopDiscoveryMessage,
  type WSAdvertiseMessage,
  type WSStopAdvertisingMessage,
  type WSGetDevicesMessage,
  type WSPingMessage,
  type WSDeviceFoundMessage,
  type WSDeviceLostMessage,
  type WSDeviceUpdatedMessage,
  type WSDeviceListMessage,
  type WSErrorMessage,
  type WSStatusMessage,
  type WSPongMessage,

  // Bridge Types
  type BridgeConnectionState,
  type MDNSBridgeOptions,
  type MDNSBridgeEvents,

  // Utility Functions
  parseCapabilities,
  serializeCapabilities,
  createDeviceFromRecord,
  isValidTxtRecord,
  isValidClientMessage,
  isValidDaemonMessage,
} from './mdns-types';

// ============================================================================
// mDNS Bridge (WebSocket Client)
// ============================================================================

export {
  MDNSBridge,
  getMDNSBridge,
  isDaemonAvailable,
} from './mdns-bridge';

// ============================================================================
// Local Discovery (Signaling Server)
// ============================================================================

export {
  getLocalDiscovery,
  type DiscoveredDevice,
  type DeviceCapabilities,
  type LocalSignalingEvents,
  type PresenceData,
} from './local-discovery';

// ============================================================================
// Group Discovery Manager
// ============================================================================

export {
  GroupDiscoveryManager,
  getGroupDiscoveryManager,
  type GroupDiscoveryOptions,
  type DiscoveredDeviceWithChannel,
  type GroupDiscoveryResult,
} from './group-discovery-manager';

// ============================================================================
// Unified Discovery (mDNS + Signaling)
// ============================================================================

export {
  UnifiedDiscoveryManager,
  getUnifiedDiscovery,
  resetUnifiedDiscovery,
} from './unified-discovery';

export type {
  UnifiedDevice,
  UnifiedDiscoveryOptions,
  DiscoverySource,
} from './unified-discovery';

// ============================================================================
// Default Export
// ============================================================================

// Note: All discovery functions are available as named exports.
// Use the named exports for full type safety:
//   import { getUnifiedDiscovery, getLocalDiscovery, getMDNSBridge } from '@/lib/discovery';
//
// The default export provides lazy-loaded versions for code splitting.
