/**
 * Service Registry
 *
 * Tracks discovered mDNS services and manages device state.
 * Handles device lifecycle (found, updated, lost) with TTL-based expiration.
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

/**
 * Platform types
 */
export type TallowPlatform =
  | 'web'
  | 'ios'
  | 'android'
  | 'macos'
  | 'windows'
  | 'linux';

/**
 * Parsed capabilities
 */
export interface ParsedCapabilities {
  supportsPQC: boolean;
  supportsChat: boolean;
  supportsFolder: boolean;
  supportsResume: boolean;
  supportsScreen: boolean;
  supportsGroupTransfer: boolean;
}

/**
 * Registered device
 */
export interface RegisteredDevice {
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
  /** TTL timer */
  ttlTimer?: NodeJS.Timeout;
}

/**
 * TXT record from mDNS
 */
export interface TxtRecord {
  version?: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
  capabilities?: string;
  fingerprint?: string;
  timestamp?: string;
}

/**
 * Registry events
 */
export interface RegistryEvents {
  'device-found': (device: RegisteredDevice) => void;
  'device-lost': (deviceId: string) => void;
  'device-updated': (device: RegisteredDevice) => void;
}

// ============================================================================
// Constants
// ============================================================================

/** Default TTL for devices in milliseconds */
const DEFAULT_TTL = 120000; // 2 minutes

/** Cleanup interval for expired devices */
const CLEANUP_INTERVAL = 30000; // 30 seconds

// ============================================================================
// Service Registry Class
// ============================================================================

/**
 * Registry for discovered mDNS services
 */
export class ServiceRegistry extends EventEmitter {
  private devices: Map<string, RegisteredDevice> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private ttl: number;

  constructor(ttl: number = DEFAULT_TTL) {
    super();
    this.ttl = ttl;
  }

  /**
   * Start the registry
   */
  start(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, CLEANUP_INTERVAL);
  }

  /**
   * Stop the registry
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Clear all TTL timers
    this.devices.forEach((device) => {
      if (device.ttlTimer) {
        clearTimeout(device.ttlTimer);
      }
    });

    this.devices.clear();
  }

  /**
   * Register or update a device
   */
  registerDevice(
    txtRecord: TxtRecord,
    ip: string,
    port: number,
    source: 'mdns' | 'signaling' | 'manual' = 'mdns'
  ): RegisteredDevice | null {
    // Validate TXT record
    if (!this.isValidTxtRecord(txtRecord)) {
      console.warn('[Registry] Invalid TXT record:', txtRecord);
      return null;
    }

    const deviceId = txtRecord.deviceId!;
    const now = Date.now();
    const existing = this.devices.get(deviceId);

    // Parse capabilities
    const parsedCapabilities = this.parseCapabilities(txtRecord.capabilities || '');

    // Create or update device
    const device: RegisteredDevice = {
      id: deviceId,
      name: txtRecord.deviceName || `Device-${deviceId.slice(-4)}`,
      platform: this.validatePlatform(txtRecord.platform),
      ip,
      port,
      version: txtRecord.version || '1.0.0',
      capabilities: txtRecord.capabilities || '',
      parsedCapabilities,
      fingerprint: txtRecord.fingerprint || '',
      discoveredAt: existing?.discoveredAt || now,
      lastSeen: now,
      isOnline: true,
      source,
    };

    // Clear existing TTL timer
    if (existing?.ttlTimer) {
      clearTimeout(existing.ttlTimer);
    }

    // Set new TTL timer
    device.ttlTimer = setTimeout(() => {
      this.markOffline(deviceId);
    }, this.ttl);

    // Store device
    this.devices.set(deviceId, device);

    // Emit appropriate event
    if (existing) {
      this.emit('device-updated', this.sanitizeDevice(device));
    } else {
      this.emit('device-found', this.sanitizeDevice(device));
    }

    return device;
  }

  /**
   * Refresh a device's TTL (heartbeat)
   */
  refreshDevice(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    if (!device) {
      return false;
    }

    device.lastSeen = Date.now();
    device.isOnline = true;

    // Reset TTL timer
    if (device.ttlTimer) {
      clearTimeout(device.ttlTimer);
    }
    device.ttlTimer = setTimeout(() => {
      this.markOffline(deviceId);
    }, this.ttl);

    return true;
  }

  /**
   * Mark a device as offline
   */
  markOffline(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.isOnline = false;
      if (device.ttlTimer) {
        clearTimeout(device.ttlTimer);
        device.ttlTimer = undefined;
      }
      this.emit('device-lost', deviceId);
    }
  }

  /**
   * Remove a device
   */
  removeDevice(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    if (device) {
      if (device.ttlTimer) {
        clearTimeout(device.ttlTimer);
      }
      this.devices.delete(deviceId);
      this.emit('device-lost', deviceId);
      return true;
    }
    return false;
  }

  /**
   * Get a device by ID
   */
  getDevice(deviceId: string): RegisteredDevice | undefined {
    const device = this.devices.get(deviceId);
    return device ? this.sanitizeDevice(device) : undefined;
  }

  /**
   * Get all devices
   */
  getAllDevices(): RegisteredDevice[] {
    return Array.from(this.devices.values())
      .filter((d) => d.isOnline)
      .map((d) => this.sanitizeDevice(d));
  }

  /**
   * Get all devices (including offline)
   */
  getAllDevicesIncludingOffline(): RegisteredDevice[] {
    return Array.from(this.devices.values()).map((d) => this.sanitizeDevice(d));
  }

  /**
   * Get device count
   */
  getDeviceCount(): number {
    return Array.from(this.devices.values()).filter((d) => d.isOnline).length;
  }

  /**
   * Check if device exists
   */
  hasDevice(deviceId: string): boolean {
    return this.devices.has(deviceId);
  }

  /**
   * Filter devices by platform
   */
  getDevicesByPlatform(platforms: TallowPlatform[]): RegisteredDevice[] {
    const platformSet = new Set(platforms);
    return this.getAllDevices().filter((d) => platformSet.has(d.platform));
  }

  /**
   * Filter devices by capability
   */
  getDevicesWithCapability(capability: keyof ParsedCapabilities): RegisteredDevice[] {
    return this.getAllDevices().filter((d) => d.parsedCapabilities[capability]);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Validate TXT record
   */
  private isValidTxtRecord(record: TxtRecord): boolean {
    return (
      typeof record.deviceId === 'string' &&
      record.deviceId.length > 0
    );
  }

  /**
   * Validate and normalize platform
   */
  private validatePlatform(platform: string | undefined): TallowPlatform {
    const valid: TallowPlatform[] = ['web', 'ios', 'android', 'macos', 'windows', 'linux'];
    if (platform && valid.includes(platform as TallowPlatform)) {
      return platform as TallowPlatform;
    }
    return 'web';
  }

  /**
   * Parse capabilities string
   */
  private parseCapabilities(capString: string): ParsedCapabilities {
    const caps = capString.toLowerCase().split(',').map((c) => c.trim());
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
   * Remove internal properties from device
   */
  private sanitizeDevice(device: RegisteredDevice): RegisteredDevice {
    const { ttlTimer: _ttl, ...sanitized } = device;
    return sanitized as RegisteredDevice;
  }

  /**
   * Cleanup expired devices
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredThreshold = now - this.ttl * 2; // Double TTL for full removal

    this.devices.forEach((device, deviceId) => {
      if (!device.isOnline && device.lastSeen < expiredThreshold) {
        this.devices.delete(deviceId);
      }
    });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let registryInstance: ServiceRegistry | null = null;

/**
 * Get the singleton service registry
 */
export function getServiceRegistry(): ServiceRegistry {
  if (!registryInstance) {
    registryInstance = new ServiceRegistry();
  }
  return registryInstance;
}

export default ServiceRegistry;
