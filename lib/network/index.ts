'use client';

/**
 * Network Module - Central Export Hub
 * Advanced networking capabilities for peer-to-peer communication
 *
 * This module provides:
 * - NAT type detection and connection strategy optimization
 * - Firewall detection and bypass strategies
 * - Network interface enumeration
 * - TURN server health monitoring
 * - Connection strategy selection (direct vs relay)
 * - Idle connection cleanup
 * - Network proxy configuration
 *
 * @module network
 */

// NAT Detection
export {
  detectNATType,
  getConnectionStrategy,
  type NATType,
  type NATDetectionResult,
  type NATDetectionOptions,
  type ConnectionStrategy,
  type ConnectionStrategyResult,
} from './nat-detection';

// Network Interfaces
export {
  getNetworkInterfaces,
  getLocalIPv4Addresses,
  getLocalIPv6Addresses,
  filterPrivateIPs,
  sortByPreference,
  type NetworkInterface,
  type InterfaceFilter,
} from './network-interfaces';

// Firewall Detection
export {
  detectFirewall,
  detectUDPBlock,
  testFirewallPolicy,
  getFirewallBypassStrategies,
  type FirewallDetectionResult,
  type FirewallPolicy,
  type FirewallBypassStrategy,
} from './firewall-detection';

// TURN Server Health Monitoring
export {
  TURNHealthMonitor,
  monitorTURNServer,
  getTURNHealth,
  selectHealthyTURNServer,
  type TURNServerHealth,
  type TURNHealthMetrics,
  type HealthCheckConfig,
} from './turn-health';

// Connection Strategy Selection
export {
  ConnectionStrategySelector,
  selectOptimalStrategy,
  evaluateConnectionQuality,
  type StrategyEvaluationResult,
  type StrategyScores,
} from './connection-strategy';

// Idle Connection Cleanup
export {
  IdleConnectionManager,
  markConnectionActive,
  cleanupIdleConnections,
  getIdleConnections,
  type IdleConnectionConfig,
  type ConnectionUsageMetrics,
  type IdleCleanupResult,
} from './idle-cleanup';

// Proxy Configuration
export {
  ProxyConfig,
  parseProxyURL,
  validateProxySettings,
  applyProxySettings,
  type ProxySettings,
  type ProxyValidationResult,
} from './proxy-config';

// Network Interface Selector (WebRTC-based)
export {
  NetworkInterfaceSelector,
  getNetworkInterfaceSelector,
  isLocalIP,
  getBestInterface,
  type NetworkInterfaceType,
} from './interface-selector';

// UDP Broadcast Discovery
export {
  UDPBroadcast,
  getUDPBroadcast,
  isUDPBroadcastAvailable,
  type BroadcastMessage,
  type BroadcastMessageType,
  type ReceivedBroadcast,
  type UDPBroadcastOptions,
} from './udp-broadcast';

// Hotspot Detection
export {
  HotspotDetector,
  getHotspotDetector,
  isHotspotMode,
  getHotspotClients,
  type HotspotStatus,
  type HotspotClient,
} from './hotspot-mode';
