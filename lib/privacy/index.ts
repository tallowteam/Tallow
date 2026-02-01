/**
 * Privacy Module
 *
 * Comprehensive privacy protection features including metadata stripping,
 * VPN leak detection, Tor support, and relay routing.
 */

// Metadata Stripping
export {
  stripMetadata,
  extractMetadata,
  stripMetadataBatch,
  supportsMetadataStripping,
  getMetadataSummary,
  METADATA_SUPPORTED_TYPES,
  type MetadataInfo,
  type StripResult,
} from './metadata-stripper';

// Privacy Settings
export {
  getPrivacySettings,
  updatePrivacySettings,
  resetPrivacySettings,
  addTrustedContact,
  removeTrustedContact,
  isTrustedContact,
  shouldStripMetadata,
  type PrivacySettings,
} from './privacy-settings';

// VPN Leak Detection
export {
  VPNLeakDetector,
  getVPNLeakDetector,
  performStartupPrivacyCheck,
  type VPNDetectionResult,
  type IPInfo,
  type PrivacyCheckListener,
} from './vpn-leak-detection';

// Tor Support
export {
  TorDetector,
  getTorDetector,
  autoConfigureForTor,
  wasTorDetected,
  resetTorDetection,
  type TorDetectionResult,
  type TorOptimizedSettings,
} from './tor-support';

// Relay Routing
export {
  RelayRoutingManager,
  getRelayRoutingManager,
  getPrivacyLevel,
  setPrivacyLevel,
  getRelayConfig,
  saveRelayConfig,
  PRIVACY_LEVEL_INFO,
  type PrivacyLevel,
  type RelayRoutingConfig,
  type RelayServer,
  type ConnectionPrivacyInfo,
} from './relay-routing';
