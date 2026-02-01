/**
 * mDNS/Bonjour/Zeroconf Type Definitions for TALLOW
 *
 * This module defines all types for the mDNS discovery system including:
 * - Service definitions (_tallow._tcp.local)
 * - TXT record formats
 * - WebSocket bridge protocol messages
 * - Device and capability types
 */

// ============================================================================
// Service Constants
// ============================================================================

/** mDNS service type for Tallow devices */
export const MDNS_SERVICE_TYPE = '_tallow._tcp.local';

/** Default port for file transfers */
export const TRANSFER_PORT = 53317;

/** Default port for the WebSocket bridge daemon */
export const DAEMON_WS_PORT = 53318;

/** Protocol version for compatibility checking */
export const PROTOCOL_VERSION = '1.0.0';

// ============================================================================
// Platform Types
// ============================================================================

/**
 * Supported platform types for devices
 */
export type TallowPlatform =
  | 'web'
  | 'ios'
  | 'android'
  | 'macos'
  | 'windows'
  | 'linux';

/**
 * Device capabilities supported by Tallow
 */
export type TallowCapability =
  | 'pqc'      // Post-quantum cryptography
  | 'chat'     // Real-time messaging
  | 'folder'   // Folder/directory transfer
  | 'resume'   // Resumable transfers
  | 'screen'   // Screen sharing
  | 'group';   // Group transfers

// ============================================================================
// TXT Record Types
// ============================================================================

/**
 * TXT record fields advertised via mDNS
 */
export interface MDNSTxtRecord {
  /** Protocol version (e.g., "1.0.0") */
  version: string;
  /** Unique device identifier */
  deviceId: string;
  /** User-defined device name */
  deviceName: string;
  /** Operating system/platform */
  platform: TallowPlatform;
  /** Comma-separated list of capabilities */
  capabilities: string;
  /** Public key fingerprint for authentication */
  fingerprint: string;
  /** Optional: timestamp of last update */
  timestamp?: string;
}

/**
 * Parsed capabilities from TXT record
 */
export interface ParsedCapabilities {
  supportsPQC: boolean;
  supportsChat: boolean;
  supportsFolder: boolean;
  supportsResume: boolean;
  supportsScreen: boolean;
  supportsGroupTransfer: boolean;
}

// ============================================================================
// Device Types
// ============================================================================

/**
 * Full device information discovered via mDNS
 */
export interface TallowDevice {
  /** Unique device identifier */
  id: string;
  /** User-friendly device name */
  name: string;
  /** Operating system/platform */
  platform: TallowPlatform;
  /** IP address (IPv4 or IPv6) */
  ip: string;
  /** Transfer port */
  port: number;
  /** Protocol version */
  version: string;
  /** Raw capabilities string */
  capabilities: string;
  /** Parsed capabilities */
  parsedCapabilities: ParsedCapabilities;
  /** Public key fingerprint */
  fingerprint: string;
  /** Discovery timestamp */
  discoveredAt: number;
  /** Last seen timestamp */
  lastSeen: number;
  /** Whether device is currently online */
  isOnline: boolean;
  /** Discovery source */
  source: 'mdns' | 'signaling' | 'manual';
}

/**
 * Minimal device info for advertising
 */
export interface TallowDeviceAdvertisement {
  /** Unique device identifier */
  id: string;
  /** User-friendly device name */
  name: string;
  /** Operating system/platform */
  platform: TallowPlatform;
  /** Capabilities to advertise */
  capabilities: TallowCapability[];
  /** Public key fingerprint */
  fingerprint: string;
}

// ============================================================================
// WebSocket Bridge Protocol Types
// ============================================================================

/**
 * Client -> Daemon: Start discovery
 */
export interface WSStartDiscoveryMessage {
  type: 'start-discovery';
  /** Optional filter by platform */
  platformFilter?: TallowPlatform[] | undefined;
}

/**
 * Client -> Daemon: Stop discovery
 */
export interface WSStopDiscoveryMessage {
  type: 'stop-discovery';
}

/**
 * Client -> Daemon: Start advertising this device
 */
export interface WSAdvertiseMessage {
  type: 'advertise';
  device: TallowDeviceAdvertisement;
}

/**
 * Client -> Daemon: Stop advertising
 */
export interface WSStopAdvertisingMessage {
  type: 'stop-advertising';
}

/**
 * Client -> Daemon: Get current devices
 */
export interface WSGetDevicesMessage {
  type: 'get-devices';
}

/**
 * Client -> Daemon: Ping for keepalive
 */
export interface WSPingMessage {
  type: 'ping';
  timestamp: number;
}

/**
 * Union of all client messages
 */
export type WSClientMessage =
  | WSStartDiscoveryMessage
  | WSStopDiscoveryMessage
  | WSAdvertiseMessage
  | WSStopAdvertisingMessage
  | WSGetDevicesMessage
  | WSPingMessage;

/**
 * Daemon -> Client: Device found
 */
export interface WSDeviceFoundMessage {
  type: 'device-found';
  device: TallowDevice;
}

/**
 * Daemon -> Client: Device lost
 */
export interface WSDeviceLostMessage {
  type: 'device-lost';
  deviceId: string;
}

/**
 * Daemon -> Client: Device updated
 */
export interface WSDeviceUpdatedMessage {
  type: 'device-updated';
  device: TallowDevice;
}

/**
 * Daemon -> Client: Current device list
 */
export interface WSDeviceListMessage {
  type: 'device-list';
  devices: TallowDevice[];
}

/**
 * Daemon -> Client: Error occurred
 */
export interface WSErrorMessage {
  type: 'error';
  message: string;
  code?: string;
}

/**
 * Daemon -> Client: Status update
 */
export interface WSStatusMessage {
  type: 'status';
  status: 'discovering' | 'advertising' | 'idle';
  isDiscovering: boolean;
  isAdvertising: boolean;
  deviceCount: number;
}

/**
 * Daemon -> Client: Pong response
 */
export interface WSPongMessage {
  type: 'pong';
  timestamp: number;
  serverTime: number;
}

/**
 * Union of all daemon messages
 */
export type WSDaemonMessage =
  | WSDeviceFoundMessage
  | WSDeviceLostMessage
  | WSDeviceUpdatedMessage
  | WSDeviceListMessage
  | WSErrorMessage
  | WSStatusMessage
  | WSPongMessage;

// ============================================================================
// Bridge Connection Types
// ============================================================================

/**
 * Connection state for the WebSocket bridge
 */
export type BridgeConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * Bridge client options
 */
export interface MDNSBridgeOptions {
  /** WebSocket daemon URL (default: ws://localhost:53318) */
  daemonUrl?: string;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnection delay in ms */
  reconnectDelay?: number;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  /** Ping interval in ms for keepalive */
  pingInterval?: number;
  /** Connection timeout in ms */
  connectionTimeout?: number;
}

/**
 * Bridge event handlers
 */
export interface MDNSBridgeEvents {
  onDeviceFound?: (device: TallowDevice) => void;
  onDeviceLost?: (deviceId: string) => void;
  onDeviceUpdated?: (device: TallowDevice) => void;
  onDeviceList?: (devices: TallowDevice[]) => void;
  onStatusChange?: (status: BridgeConnectionState) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse capabilities string into structured object
 */
export function parseCapabilities(capString: string): ParsedCapabilities {
  const caps = capString.toLowerCase().split(',').map(c => c.trim());
  return {
    supportsPQC: caps.includes('pqc'),
    supportsChat: caps.includes('chat'),
    supportsFolder: caps.includes('folder'),
    supportsResume: caps.includes('resume'),
    supportsScreen: caps.includes('screen'),
    supportsGroupTransfer: caps.includes('group'),
  };
}

/**
 * Serialize capabilities array to string
 */
export function serializeCapabilities(caps: TallowCapability[]): string {
  return caps.join(',');
}

/**
 * Create a TallowDevice from TXT record and network info
 */
export function createDeviceFromRecord(
  txtRecord: MDNSTxtRecord,
  ip: string,
  port: number,
  source: 'mdns' | 'signaling' | 'manual' = 'mdns'
): TallowDevice {
  const now = Date.now();
  return {
    id: txtRecord.deviceId,
    name: txtRecord.deviceName,
    platform: txtRecord.platform,
    ip,
    port,
    version: txtRecord.version,
    capabilities: txtRecord.capabilities,
    parsedCapabilities: parseCapabilities(txtRecord.capabilities),
    fingerprint: txtRecord.fingerprint,
    discoveredAt: now,
    lastSeen: now,
    isOnline: true,
    source,
  };
}

/**
 * Validate a TXT record has required fields
 */
export function isValidTxtRecord(record: Partial<MDNSTxtRecord>): record is MDNSTxtRecord {
  return (
    typeof record.version === 'string' &&
    typeof record.deviceId === 'string' &&
    typeof record.deviceName === 'string' &&
    typeof record.platform === 'string' &&
    typeof record.capabilities === 'string' &&
    typeof record.fingerprint === 'string' &&
    ['web', 'ios', 'android', 'macos', 'windows', 'linux'].includes(record.platform)
  );
}

/**
 * Check if client message is valid
 */
export function isValidClientMessage(msg: unknown): msg is WSClientMessage {
  if (!msg || typeof msg !== 'object') {return false;}
  const m = msg as { type?: unknown };
  const validTypes = [
    'start-discovery',
    'stop-discovery',
    'advertise',
    'stop-advertising',
    'get-devices',
    'ping',
  ];
  return typeof m.type === 'string' && validTypes.includes(m.type);
}

/**
 * Check if daemon message is valid
 */
export function isValidDaemonMessage(msg: unknown): msg is WSDaemonMessage {
  if (!msg || typeof msg !== 'object') {return false;}
  const m = msg as { type?: unknown };
  const validTypes = [
    'device-found',
    'device-lost',
    'device-updated',
    'device-list',
    'error',
    'status',
    'pong',
  ];
  return typeof m.type === 'string' && validTypes.includes(m.type);
}
