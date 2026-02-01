'use client';

/**
 * Unified Discovery Manager
 *
 * Merges mDNS (local network) and signaling server (internet) discovery
 * into a seamless experience. Automatically falls back to signaling
 * when mDNS daemon is unavailable.
 *
 * Priority:
 * 1. mDNS devices (lower latency, more reliable)
 * 2. Signaling server devices (works across networks)
 */

import { getLocalDiscovery, type DiscoveredDevice, type DeviceCapabilities } from './local-discovery';
import { getMDNSBridge, isDaemonAvailable, type MDNSBridge } from './mdns-bridge';
import {
  type TallowDevice,
  type TallowDeviceAdvertisement,
  type TallowCapability,
  type TallowPlatform,
  DAEMON_WS_PORT,
} from './mdns-types';
import { getDeviceId } from '@/lib/auth/user-identity';
import secureLog from '@/lib/utils/secure-logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Discovery source priority
 */
export type DiscoverySource = 'mdns' | 'signaling' | 'both';

/**
 * Unified device combining mDNS and signaling info
 */
export interface UnifiedDevice {
  /** Unique device identifier */
  id: string;
  /** User-friendly device name */
  name: string;
  /** Platform type */
  platform: string;
  /** Discovery source */
  source: DiscoverySource;
  /** Whether device is online */
  isOnline: boolean;
  /** Last seen timestamp */
  lastSeen: Date;
  /** IP address (from mDNS) */
  ip?: string | undefined;
  /** Port (from mDNS) */
  port?: number | undefined;
  /** Socket ID (from signaling) */
  socketId?: string | undefined;
  /** Device capabilities */
  capabilities?: DeviceCapabilities | undefined;
  /** Connection quality */
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor' | undefined;
  /** Public key fingerprint */
  fingerprint?: string | undefined;
  /** Whether device is available via mDNS */
  hasMdns: boolean;
  /** Whether device is available via signaling */
  hasSignaling: boolean;
}

/**
 * Discovery options
 */
export interface UnifiedDiscoveryOptions {
  /** Enable mDNS discovery (requires local daemon) */
  enableMdns?: boolean;
  /** Enable signaling server discovery */
  enableSignaling?: boolean;
  /** Prefer mDNS over signaling when both available */
  preferMdns?: boolean;
  /** Daemon WebSocket URL */
  daemonUrl?: string;
  /** Auto-advertise this device */
  autoAdvertise?: boolean;
}

/**
 * Device change callback
 */
type DeviceCallback = (devices: UnifiedDevice[]) => void;

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Required<UnifiedDiscoveryOptions> = {
  enableMdns: true,
  enableSignaling: true,
  preferMdns: true,
  daemonUrl: `ws://localhost:${DAEMON_WS_PORT}`,
  autoAdvertise: true,
};

// ============================================================================
// Unified Discovery Manager
// ============================================================================

/**
 * Unified discovery manager combining mDNS and signaling discovery
 */
export class UnifiedDiscoveryManager {
  private options: Required<UnifiedDiscoveryOptions>;
  private mdnsBridge: MDNSBridge | null = null;
  private signalingDiscovery = getLocalDiscovery();
  private devices: Map<string, UnifiedDevice> = new Map();
  private listeners: Set<DeviceCallback> = new Set();
  private started = false;
  private mdnsAvailable = false;
  private myDeviceId: string = '';
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: UnifiedDiscoveryOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    if (typeof window !== 'undefined') {
      this.myDeviceId = getDeviceId();
    }
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Start unified discovery
   */
  async start(): Promise<void> {
    if (this.started) {return;}
    this.started = true;

    secureLog.log('[UnifiedDiscovery] Starting unified discovery');

    // Start signaling discovery
    if (this.options.enableSignaling) {
      await this.startSignalingDiscovery();
    }

    // Try to start mDNS discovery
    if (this.options.enableMdns) {
      await this.startMdnsDiscovery();
    }

    // Periodic check for mDNS daemon availability
    this.checkInterval = setInterval(() => {
      if (!this.mdnsAvailable && this.options.enableMdns) {
        this.checkMdnsDaemon();
      }
    }, 10000);
  }

  /**
   * Stop all discovery
   */
  stop(): void {
    if (!this.started) {return;}
    this.started = false;

    secureLog.log('[UnifiedDiscovery] Stopping unified discovery');

    // Stop periodic check
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Stop mDNS
    if (this.mdnsBridge) {
      this.mdnsBridge.stopDiscovery();
      this.mdnsBridge.stopAdvertising();
      this.mdnsBridge.disconnect();
      this.mdnsBridge = null;
    }
    this.mdnsAvailable = false;

    // Stop signaling
    this.signalingDiscovery.stop();

    // Clear devices
    this.devices.clear();
    this.notifyListeners();
  }

  /**
   * Refresh discovery
   */
  async refresh(): Promise<void> {
    secureLog.log('[UnifiedDiscovery] Refreshing discovery');

    // Refresh signaling
    this.signalingDiscovery.refresh();

    // Refresh mDNS
    if (this.mdnsBridge?.isConnected()) {
      this.mdnsBridge.refreshDevices();
    } else if (this.options.enableMdns) {
      // Try to reconnect to mDNS daemon
      await this.startMdnsDiscovery();
    }
  }

  // ============================================================================
  // Signaling Discovery
  // ============================================================================

  private async startSignalingDiscovery(): Promise<void> {
    // Listen for signaling device changes
    this.signalingDiscovery.onDevicesChanged((devices) => {
      this.mergeSignalingDevices(devices);
    });

    // Start signaling discovery
    await this.signalingDiscovery.start();
  }

  private mergeSignalingDevices(devices: DiscoveredDevice[]): void {
    // Update signaling devices in unified map
    devices.forEach((device) => {
      const existing = this.devices.get(device.id);

      if (existing) {
        // Merge with existing device
        existing.hasSignaling = true;
        existing.socketId = device.socketId;
        existing.lastSeen = device.lastSeen;
        existing.isOnline = device.isOnline;
        existing.capabilities = device.capabilities;
        existing.connectionQuality = device.connectionQuality;

        // Update source
        if (existing.hasMdns) {
          existing.source = 'both';
        }
      } else {
        // Add new signaling-only device
        this.devices.set(device.id, {
          id: device.id,
          name: device.name,
          platform: device.platform,
          source: 'signaling',
          isOnline: device.isOnline,
          lastSeen: device.lastSeen,
          socketId: device.socketId,
          capabilities: device.capabilities,
          connectionQuality: device.connectionQuality,
          hasMdns: false,
          hasSignaling: true,
        });
      }
    });

    // Mark signaling-only devices as offline if not in list
    const signalingIds = new Set(devices.map((d) => d.id));
    this.devices.forEach((device, id) => {
      if (device.hasSignaling && !device.hasMdns && !signalingIds.has(id)) {
        device.isOnline = false;
        device.hasSignaling = false;
      }
    });

    // Remove offline devices with no sources
    this.devices.forEach((device, id) => {
      if (!device.hasMdns && !device.hasSignaling) {
        this.devices.delete(id);
      }
    });

    this.notifyListeners();
  }

  // ============================================================================
  // mDNS Discovery
  // ============================================================================

  private async startMdnsDiscovery(): Promise<void> {
    // Check if daemon is available
    this.mdnsAvailable = await isDaemonAvailable(this.options.daemonUrl);

    if (!this.mdnsAvailable) {
      secureLog.log('[UnifiedDiscovery] mDNS daemon not available, using signaling only');
      return;
    }

    secureLog.log('[UnifiedDiscovery] mDNS daemon available, connecting');

    // Get or create bridge
    this.mdnsBridge = getMDNSBridge({
      daemonUrl: this.options.daemonUrl,
      autoReconnect: true,
    });

    // Set up event handlers
    this.mdnsBridge.setEventHandlers({
      onDeviceFound: (device) => this.handleMdnsDeviceFound(device),
      onDeviceLost: (deviceId) => this.handleMdnsDeviceLost(deviceId),
      onDeviceUpdated: (device) => this.handleMdnsDeviceUpdated(device),
      onDeviceList: (devices) => this.handleMdnsDeviceList(devices),
      onStatusChange: (status) => {
        if (status === 'disconnected' || status === 'error') {
          this.mdnsAvailable = false;
          this.clearMdnsDevices();
        }
      },
      onError: (error) => {
        secureLog.error('[UnifiedDiscovery] mDNS bridge error:', error);
      },
    });

    // Connect to daemon
    const connected = await this.mdnsBridge.connect();

    if (connected) {
      // Start discovery
      this.mdnsBridge.startDiscovery();

      // Auto-advertise if enabled
      if (this.options.autoAdvertise) {
        this.advertise();
      }
    } else {
      this.mdnsAvailable = false;
    }
  }

  private async checkMdnsDaemon(): Promise<void> {
    if (this.mdnsAvailable) {return;}

    const available = await isDaemonAvailable(this.options.daemonUrl);
    if (available && !this.mdnsAvailable) {
      secureLog.log('[UnifiedDiscovery] mDNS daemon became available');
      await this.startMdnsDiscovery();
    }
  }

  private handleMdnsDeviceFound(device: TallowDevice): void {
    const existing = this.devices.get(device.id);

    if (existing) {
      // Merge with existing device
      existing.hasMdns = true;
      existing.ip = device.ip;
      existing.port = device.port;
      existing.fingerprint = device.fingerprint;
      existing.lastSeen = new Date(device.lastSeen);
      existing.isOnline = device.isOnline;
      existing.name = device.name;
      existing.platform = device.platform;

      // Update source
      if (existing.hasSignaling) {
        existing.source = 'both';
      } else {
        existing.source = 'mdns';
      }

      // Map mDNS capabilities to DeviceCapabilities
      if (device.parsedCapabilities) {
        existing.capabilities = {
          supportsGroupTransfer: device.parsedCapabilities.supportsGroupTransfer,
          supportsPQC: device.parsedCapabilities.supportsPQC,
          maxConnections: 10,
          protocolVersion: device.version,
        };
      }
    } else {
      // Add new mDNS-only device
      this.devices.set(device.id, {
        id: device.id,
        name: device.name,
        platform: device.platform,
        source: 'mdns',
        isOnline: device.isOnline,
        lastSeen: new Date(device.lastSeen),
        ip: device.ip,
        port: device.port,
        fingerprint: device.fingerprint,
        capabilities: {
          supportsGroupTransfer: device.parsedCapabilities.supportsGroupTransfer,
          supportsPQC: device.parsedCapabilities.supportsPQC,
          maxConnections: 10,
          protocolVersion: device.version,
        },
        hasMdns: true,
        hasSignaling: false,
      });
    }

    this.notifyListeners();
  }

  private handleMdnsDeviceLost(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.hasMdns = false;
      // Delete optional properties instead of setting to undefined
      delete device.ip;
      delete device.port;

      if (device.hasSignaling) {
        device.source = 'signaling';
      } else {
        // Remove device if no sources left
        this.devices.delete(deviceId);
      }

      this.notifyListeners();
    }
  }

  private handleMdnsDeviceUpdated(device: TallowDevice): void {
    this.handleMdnsDeviceFound(device);
  }

  private handleMdnsDeviceList(devices: TallowDevice[]): void {
    // Update all mDNS devices
    const mdnsIds = new Set(devices.map((d) => d.id));

    // Update existing devices
    devices.forEach((device) => {
      this.handleMdnsDeviceFound(device);
    });

    // Mark mDNS devices not in list as lost
    this.devices.forEach((device, id) => {
      if (device.hasMdns && !mdnsIds.has(id)) {
        this.handleMdnsDeviceLost(id);
      }
    });
  }

  private clearMdnsDevices(): void {
    this.devices.forEach((device, id) => {
      if (device.hasMdns) {
        device.hasMdns = false;
        // Delete optional properties instead of setting to undefined
        delete device.ip;
        delete device.port;

        if (!device.hasSignaling) {
          this.devices.delete(id);
        } else {
          device.source = 'signaling';
        }
      }
    });

    this.notifyListeners();
  }

  // ============================================================================
  // Advertising
  // ============================================================================

  /**
   * Advertise this device via mDNS
   */
  advertise(customInfo?: Partial<TallowDeviceAdvertisement>): void {
    if (!this.mdnsBridge?.isConnected()) {
      secureLog.debug('[UnifiedDiscovery] Cannot advertise: mDNS not connected');
      return;
    }

    // Build device advertisement
    const capabilities: TallowCapability[] = ['pqc', 'chat', 'folder', 'group'];
    const platform = this.detectPlatform();
    const deviceName = this.getDeviceName();

    const advertisement: TallowDeviceAdvertisement = {
      id: this.myDeviceId,
      name: deviceName,
      platform,
      capabilities,
      fingerprint: this.generateFingerprint(),
      ...customInfo,
    };

    this.mdnsBridge.advertise(advertisement);
  }

  /**
   * Stop advertising this device
   */
  stopAdvertising(): void {
    this.mdnsBridge?.stopAdvertising();
  }

  // ============================================================================
  // Device Access
  // ============================================================================

  /**
   * Get all discovered devices
   */
  getDevices(): UnifiedDevice[] {
    return Array.from(this.devices.values())
      .filter((d) => d.isOnline)
      .sort((a, b) => {
        // Sort by: both sources > mdns > signaling > lastSeen
        if (a.source === 'both' && b.source !== 'both') {return -1;}
        if (b.source === 'both' && a.source !== 'both') {return 1;}

        if (this.options.preferMdns) {
          if (a.hasMdns && !b.hasMdns) {return -1;}
          if (b.hasMdns && !a.hasMdns) {return 1;}
        }

        return b.lastSeen.getTime() - a.lastSeen.getTime();
      });
  }

  /**
   * Get a specific device by ID
   */
  getDevice(deviceId: string): UnifiedDevice | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Get devices available via mDNS
   */
  getMdnsDevices(): UnifiedDevice[] {
    return this.getDevices().filter((d) => d.hasMdns);
  }

  /**
   * Get devices available via signaling
   */
  getSignalingDevices(): UnifiedDevice[] {
    return this.getDevices().filter((d) => d.hasSignaling);
  }

  /**
   * Get devices with specific capabilities
   */
  getDevicesWithCapabilities(
    required: Partial<DeviceCapabilities>
  ): UnifiedDevice[] {
    return this.getDevices().filter((device) => {
      if (!device.capabilities) {return false;}

      if (required.supportsPQC && !device.capabilities.supportsPQC) {return false;}
      if (required.supportsGroupTransfer && !device.capabilities.supportsGroupTransfer) {return false;}

      return true;
    });
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  /**
   * Subscribe to device changes
   */
  onDevicesChanged(callback: DeviceCallback): () => void {
    this.listeners.add(callback);
    callback(this.getDevices());
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const devices = this.getDevices();
    this.listeners.forEach((cb) => cb(devices));
  }

  // ============================================================================
  // Connection Helpers
  // ============================================================================

  /**
   * Get best connection method for a device
   */
  getBestConnectionMethod(deviceId: string): 'direct' | 'signaling' | null {
    const device = this.devices.get(deviceId);
    if (!device || !device.isOnline) {return null;}

    // Prefer direct connection via mDNS
    if (device.hasMdns && device.ip && device.port) {
      return 'direct';
    }

    // Fall back to signaling
    if (device.hasSignaling && device.socketId) {
      return 'signaling';
    }

    return null;
  }

  /**
   * Get direct connection info for a device
   */
  getDirectConnectionInfo(deviceId: string): { ip: string; port: number } | null {
    const device = this.devices.get(deviceId);
    if (device?.ip && device?.port) {
      return { ip: device.ip, port: device.port };
    }
    return null;
  }

  /**
   * Get signaling connection info for a device
   */
  getSignalingConnectionInfo(deviceId: string): { socketId: string } | null {
    const device = this.devices.get(deviceId);
    if (device?.socketId) {
      return { socketId: device.socketId };
    }
    return null;
  }

  // ============================================================================
  // Status
  // ============================================================================

  /**
   * Check if mDNS is available
   */
  isMdnsAvailable(): boolean {
    return this.mdnsAvailable;
  }

  /**
   * Check if signaling is connected
   */
  isSignalingConnected(): boolean {
    return this.signalingDiscovery.getDevices().length > 0;
  }

  /**
   * Get discovery status
   */
  getStatus(): {
    started: boolean;
    mdnsAvailable: boolean;
    signalingConnected: boolean;
    deviceCount: number;
    mdnsDeviceCount: number;
    signalingDeviceCount: number;
  } {
    return {
      started: this.started,
      mdnsAvailable: this.mdnsAvailable,
      signalingConnected: this.isSignalingConnected(),
      deviceCount: this.devices.size,
      mdnsDeviceCount: this.getMdnsDevices().length,
      signalingDeviceCount: this.getSignalingDevices().length,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private detectPlatform(): TallowPlatform {
    if (typeof navigator === 'undefined') {return 'web';}

    const ua = navigator.userAgent.toLowerCase();

    if (ua.includes('mac')) {return 'macos';}
    if (ua.includes('win')) {return 'windows';}
    if (ua.includes('linux')) {return 'linux';}
    if (ua.includes('iphone') || ua.includes('ipad')) {return 'ios';}
    if (ua.includes('android')) {return 'android';}

    return 'web';
  }

  private getDeviceName(): string {
    const platform = this.detectPlatform();
    const suffix = this.myDeviceId.slice(-4);
    const platformNames: Record<TallowPlatform, string> = {
      web: 'Browser',
      ios: 'iPhone',
      android: 'Android',
      macos: 'Mac',
      windows: 'Windows',
      linux: 'Linux',
    };
    return `${platformNames[platform]}-${suffix}`;
  }

  private generateFingerprint(): string {
    // Generate a simple fingerprint from device ID
    // In production, this should be derived from the public key
    const data = new TextEncoder().encode(this.myDeviceId);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      if (byte !== undefined) {
        hash = ((hash << 5) - hash) + byte;
        hash |= 0;
      }
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.listeners.clear();
    this.devices.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let unifiedDiscoveryInstance: UnifiedDiscoveryManager | null = null;

/**
 * Get the singleton unified discovery manager
 */
export function getUnifiedDiscovery(
  options?: UnifiedDiscoveryOptions
): UnifiedDiscoveryManager {
  if (!unifiedDiscoveryInstance) {
    unifiedDiscoveryInstance = new UnifiedDiscoveryManager(options);
  }
  return unifiedDiscoveryInstance;
}

/**
 * Reset the unified discovery manager (for testing)
 */
export function resetUnifiedDiscovery(): void {
  if (unifiedDiscoveryInstance) {
    unifiedDiscoveryInstance.destroy();
    unifiedDiscoveryInstance = null;
  }
}

export default UnifiedDiscoveryManager;
