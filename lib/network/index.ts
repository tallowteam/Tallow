'use client';

/**
 * Network Module - Central Export Hub
 * Re-exports network utilities from concrete module files.
 *
 * Note: using `export *` prevents drift between this barrel and
 * individual module named exports.
 */

export * from './nat-detection';
export * from './network-interfaces';
export * from './firewall-detection';
export * from './turn-health';
export * from './connection-strategy';
export * from './idle-cleanup';
export * from './proxy-config';
export {
  NetworkInterfaceSelector,
  getNetworkInterfaceSelector,
  isLocalIP,
  getBestInterface,
  type NetworkInterfaceType,
} from './interface-selector';
export * from './udp-broadcast';
export * from './hotspot-mode';
