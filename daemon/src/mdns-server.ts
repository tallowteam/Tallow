/**
 * mDNS Server
 *
 * Handles mDNS/Bonjour/Zeroconf service advertisement and discovery.
 * Uses multicast-dns for low-level mDNS operations and bonjour-service
 * for higher-level service management.
 */

import Bonjour, { type Browser, type Service } from 'bonjour-service';
import type { TxtRecord } from './service-registry.js';
import { EventEmitter } from 'events';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import {
  ServiceRegistry,
  getServiceRegistry,
  type RegisteredDevice,
  type TallowPlatform,
} from './service-registry.js';

// ============================================================================
// Constants
// ============================================================================

/** mDNS service type for Tallow */
export const SERVICE_TYPE = 'tallow';

/** mDNS protocol */
export const SERVICE_PROTOCOL = 'tcp';

/** Full service type string */
export const FULL_SERVICE_TYPE = `_${SERVICE_TYPE}._${SERVICE_PROTOCOL}`;

/** Default transfer port */
export const TRANSFER_PORT = 53317;

/** Protocol version */
export const PROTOCOL_VERSION = '1.0.0';

/** Query interval for continuous discovery */
export const QUERY_INTERVAL = 10000; // 10 seconds

// ============================================================================
// Types
// ============================================================================

/**
 * Device advertisement options
 */
export interface AdvertiseOptions {
  /** Device ID */
  deviceId: string;
  /** Device name */
  deviceName: string;
  /** Platform type */
  platform: TallowPlatform;
  /** Capabilities array */
  capabilities: string[];
  /** Public key fingerprint */
  fingerprint: string;
  /** Transfer port (default: 53317) */
  port?: number;
}

/**
 * mDNS server events
 */
export interface MDNSServerEvents {
  'device-found': (device: RegisteredDevice) => void;
  'device-lost': (deviceId: string) => void;
  'device-updated': (device: RegisteredDevice) => void;
  'error': (error: Error) => void;
  'started': () => void;
  'stopped': () => void;
}

// ============================================================================
// mDNS Server Class
// ============================================================================

/**
 * mDNS server for service discovery and advertisement
 */
export class MDNSServer extends EventEmitter {
  private bonjour: Bonjour | null = null;
  private browser: Browser | null = null;
  private service: Service | null = null;
  private registry: ServiceRegistry;
  private isRunning = false;
  private isDiscovering = false;
  private isAdvertising = false;
  private queryTimer: NodeJS.Timeout | null = null;
  private currentAdvertisement: AdvertiseOptions | null = null;

  constructor() {
    super();
    this.registry = getServiceRegistry();

    // Forward registry events
    this.registry.on('device-found', (device) => this.emit('device-found', device));
    this.registry.on('device-lost', (deviceId) => this.emit('device-lost', deviceId));
    this.registry.on('device-updated', (device) => this.emit('device-updated', device));
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Start the mDNS server
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    try {
      this.bonjour = new Bonjour();
      this.registry.start();
      this.isRunning = true;
      console.info('[mDNS] Server started');
      this.emit('started');
    } catch (error) {
      console.error('[mDNS] Failed to start server:', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Stop the mDNS server
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.stopDiscovery();
    this.stopAdvertising();

    if (this.bonjour) {
      this.bonjour.destroy();
      this.bonjour = null;
    }

    this.registry.stop();
    this.isRunning = false;
    console.info('[mDNS] Server stopped');
    this.emit('stopped');
  }

  /**
   * Check if server is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  // ============================================================================
  // Discovery
  // ============================================================================

  /**
   * Start discovering mDNS services
   */
  startDiscovery(platformFilter?: TallowPlatform[]): void {
    if (!this.isRunning || !this.bonjour) {
      console.error('[mDNS] Cannot start discovery: server not running');
      return;
    }

    if (this.isDiscovering) {
      return;
    }

    this.isDiscovering = true;
    console.info('[mDNS] Starting discovery');

    // Create browser for Tallow services
    this.browser = this.bonjour.find({ type: SERVICE_TYPE });

    // Handle service found
    this.browser.on('up', (service: Service) => {
      this.handleServiceFound(service, platformFilter);
    });

    // Handle service lost
    this.browser.on('down', (service: Service) => {
      this.handleServiceLost(service);
    });

    // Start periodic re-query to keep discovery fresh
    this.queryTimer = setInterval(() => {
      if (this.browser) {
        this.browser.update();
      }
    }, QUERY_INTERVAL);
  }

  /**
   * Stop discovering mDNS services
   */
  stopDiscovery(): void {
    if (!this.isDiscovering) {
      return;
    }

    if (this.queryTimer) {
      clearInterval(this.queryTimer);
      this.queryTimer = null;
    }

    if (this.browser) {
      this.browser.stop();
      this.browser = null;
    }

    this.isDiscovering = false;
    console.info('[mDNS] Stopped discovery');
  }

  /**
   * Check if currently discovering
   */
  getIsDiscovering(): boolean {
    return this.isDiscovering;
  }

  /**
   * Manually trigger a discovery update
   */
  refreshDiscovery(): void {
    if (this.browser) {
      this.browser.update();
    }
  }

  // ============================================================================
  // Advertising
  // ============================================================================

  /**
   * Start advertising this device
   */
  startAdvertising(options: AdvertiseOptions): void {
    if (!this.isRunning || !this.bonjour) {
      console.error('[mDNS] Cannot advertise: server not running');
      return;
    }

    // Stop existing advertisement
    this.stopAdvertising();

    const port = options.port || TRANSFER_PORT;
    this.currentAdvertisement = options;

    // Build TXT record
    const txt: Record<string, string> = {
      version: PROTOCOL_VERSION,
      deviceId: options.deviceId,
      deviceName: options.deviceName,
      platform: options.platform,
      capabilities: options.capabilities.join(','),
      fingerprint: options.fingerprint,
      timestamp: Date.now().toString(),
    };

    // Build service name
    const serviceName = `${options.deviceName}-${options.deviceId.slice(-4)}`;

    try {
      // Publish service
      this.service = this.bonjour.publish({
        name: serviceName,
        type: SERVICE_TYPE,
        port: port,
        txt: txt,
      });

      this.isAdvertising = true;
      console.info(`[mDNS] Advertising: ${serviceName} on port ${port}`);
    } catch (error) {
      console.error('[mDNS] Failed to advertise:', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Update advertisement TXT record
   */
  updateAdvertisement(updates: Partial<AdvertiseOptions>): void {
    if (!this.currentAdvertisement || !this.service) {
      return;
    }

    // Merge updates
    this.currentAdvertisement = { ...this.currentAdvertisement, ...updates };

    // Re-publish with updated info
    this.stopAdvertising();
    this.startAdvertising(this.currentAdvertisement);
  }

  /**
   * Stop advertising this device
   */
  stopAdvertising(): void {
    if (!this.isAdvertising) {
      return;
    }

    if (this.service) {
      this.service.stop?.();
      this.service = null;
    }

    this.isAdvertising = false;
    console.info('[mDNS] Stopped advertising');
  }

  /**
   * Check if currently advertising
   */
  getIsAdvertising(): boolean {
    return this.isAdvertising;
  }

  /**
   * Get current advertisement
   */
  getCurrentAdvertisement(): AdvertiseOptions | null {
    return this.currentAdvertisement;
  }

  // ============================================================================
  // Device Access
  // ============================================================================

  /**
   * Get all discovered devices
   */
  getDevices(): RegisteredDevice[] {
    return this.registry.getAllDevices();
  }

  /**
   * Get device by ID
   */
  getDevice(deviceId: string): RegisteredDevice | undefined {
    return this.registry.getDevice(deviceId);
  }

  /**
   * Get device count
   */
  getDeviceCount(): number {
    return this.registry.getDeviceCount();
  }

  // ============================================================================
  // Network Info
  // ============================================================================

  /**
   * Get local IP addresses
   */
  getLocalAddresses(): string[] {
    const addresses: string[] = [];
    const interfaces = os.networkInterfaces();

    for (const name in interfaces) {
      const iface = interfaces[name];
      if (!iface) {continue;}

      for (const addr of iface) {
        // Skip internal and IPv6 link-local
        if (addr.internal) {continue;}
        if (addr.family === 'IPv6' && addr.address.startsWith('fe80')) {continue;}

        addresses.push(addr.address);
      }
    }

    return addresses;
  }

  /**
   * Get primary local IP address
   */
  getPrimaryAddress(): string {
    const addresses = this.getLocalAddresses();

    // Prefer IPv4
    const ipv4 = addresses.find((addr) => !addr.includes(':'));
    if (ipv4) {return ipv4;}

    // Fall back to first address
    return addresses[0] || '127.0.0.1';
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Handle service found
   */
  private handleServiceFound(
    service: Service,
    platformFilter?: TallowPlatform[]
  ): void {
    try {
      // Parse TXT record
      const txt = this.parseTxtRecord(service.txt);
      const deviceId = txt['deviceId'];
      if (!deviceId) {
        console.warn('[mDNS] Service missing deviceId:', service.name);
        return;
      }

      // Filter by platform if specified
      if (platformFilter && platformFilter.length > 0) {
        const platform = txt['platform'] as TallowPlatform;
        if (!platformFilter.includes(platform)) {
          return;
        }
      }

      // Get IP address
      const ip = service.addresses?.[0] || service.referer?.address;
      if (!ip) {
        console.warn('[mDNS] Service has no address:', service.name);
        return;
      }

      // Register device
      this.registry.registerDevice(txt, ip, service.port, 'mdns');
    } catch (error) {
      console.error('[mDNS] Error handling service:', error);
    }
  }

  /**
   * Handle service lost
   */
  private handleServiceLost(service: Service): void {
    try {
      const txt = this.parseTxtRecord(service.txt);
      const deviceId = txt['deviceId'];
      if (deviceId) {
        this.registry.markOffline(deviceId);
      }
    } catch (error) {
      console.error('[mDNS] Error handling service lost:', error);
    }
  }

  /**
   * Parse TXT record from mDNS service
   */
  private parseTxtRecord(txt: Record<string, string | boolean> | string[] | undefined): TxtRecord {
    const result: TxtRecord = {};

    if (!txt) {
      return result;
    }

    if (Array.isArray(txt)) {
      // Array format: ['key=value', 'key=value']
      for (const item of txt) {
        const [key, ...valueParts] = item.split('=');
        if (key) {
          (result as Record<string, string>)[key] = valueParts.join('=');
        }
      }
    } else if (typeof txt === 'object') {
      // Object format: { key: value }
      for (const [key, value] of Object.entries(txt)) {
        (result as Record<string, string>)[key] = String(value);
      }
    }

    return result;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique device ID
 */
export function generateDeviceId(): string {
  return uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase();
}

/**
 * Get default device name based on hostname
 */
export function getDefaultDeviceName(): string {
  const hostname = os.hostname();
  return hostname.split('.')[0] || 'Tallow-Device';
}

/**
 * Detect current platform
 */
export function detectPlatform(): TallowPlatform {
  const platform = os.platform();

  switch (platform) {
    case 'darwin':
      return 'macos';
    case 'win32':
      return 'windows';
    case 'linux':
      return 'linux';
    default:
      return 'linux';
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let mdnsServerInstance: MDNSServer | null = null;

/**
 * Get the singleton mDNS server
 */
export function getMDNSServer(): MDNSServer {
  if (!mdnsServerInstance) {
    mdnsServerInstance = new MDNSServer();
  }
  return mdnsServerInstance;
}

export default MDNSServer;
