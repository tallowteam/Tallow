/**
 * Discovery Controller — Plain TypeScript Module
 *
 * Manages device discovery lifecycle OUTSIDE of React's hook system.
 * This prevents the React compiler / Turbopack from transforming
 * store.getState() calls into reactive subscriptions, which would cause
 * infinite re-render loops.
 *
 * All store access is via .getState() — never via the hook form.
 * Because this module's functions don't start with "use" and are not
 * inside a React component/hook, the compiler leaves them alone.
 */

import { useDeviceStore } from '@/lib/stores/device-store';
import { getUnifiedDiscovery, type UnifiedDevice } from '@/lib/discovery/unified-discovery';
import type { Device, Platform } from '@/lib/types';
import secureLog from '@/lib/utils/secure-logger';

// ============================================================================
// TYPES
// ============================================================================

export interface DiscoveryStatus {
  isScanning: boolean;
  deviceCount: number;
  mdnsAvailable: boolean;
  signalingConnected: boolean;
  error: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('win')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
  if (ua.includes('android')) return 'android';
  return 'web';
}

const PLATFORM_MAP: Record<string, Platform> = {
  windows: 'windows',
  macos: 'macos',
  linux: 'linux',
  android: 'android',
  ios: 'ios',
  web: 'web',
  desktop: 'web',
  mobile: 'android',
  app: 'ios',
};

function mapDevice(unified: UnifiedDevice): Device {
  return {
    id: unified.id,
    name: unified.name,
    platform: PLATFORM_MAP[unified.platform.toLowerCase()] || 'web',
    ip: unified.ip || null,
    port: unified.port || null,
    isOnline: unified.isOnline,
    isFavorite: false,
    lastSeen: unified.lastSeen.getTime(),
    avatar: null,
  };
}

function createThisDevice(name: string, platform: Platform): Device {
  return {
    id: 'this-device',
    name: name || 'This Device',
    platform,
    ip: null,
    port: null,
    isOnline: true,
    isFavorite: false,
    lastSeen: Date.now(),
    avatar: null,
  };
}

// ============================================================================
// CONTROLLER SINGLETON
// ============================================================================

class DeviceDiscoveryController {
  private unsubscribe: (() => void) | null = null;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private _started = false;
  private _deviceName = 'This Device';

  status: DiscoveryStatus = {
    isScanning: false,
    deviceCount: 0,
    mdnsAvailable: false,
    signalingConnected: false,
    error: null,
  };

  /** Start device discovery and sync with the device store */
  start = (deviceName?: string): void => {
    if (this._started) return;
    this._started = true;

    if (deviceName) this._deviceName = deviceName;

    secureLog.log('[DiscoveryController] Starting discovery');

    // Mark store as scanning
    useDeviceStore.getState().startScanning();

    const discovery = getUnifiedDiscovery();

    // Subscribe to device change events
    this.unsubscribe = discovery.onDevicesChanged(
      (devices: UnifiedDevice[]) => this.handleDevicesChanged(devices),
    );

    // Kick off the async start — errors are handled internally
    discovery.start().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to start discovery';
      secureLog.error('[DiscoveryController] Start failed:', err);
      useDeviceStore.getState().setScanError(msg);
      this.status.error = msg;
    });

    // Auto-refresh every 10 seconds
    this.refreshInterval = setInterval(() => {
      if (this._started) discovery.refresh();
    }, 10_000);

    this.status.isScanning = true;
  };

  /** Stop device discovery */
  stop = (): void => {
    if (!this._started) return;
    this._started = false;

    secureLog.log('[DiscoveryController] Stopping discovery');

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    getUnifiedDiscovery().stop();
    this.status.isScanning = false;
    // NOTE: We intentionally do NOT call store.stopScanning() here to
    // avoid triggering Zustand mutations during React cleanup.
  };

  /** Trigger a manual refresh */
  refresh = (): void => {
    getUnifiedDiscovery().refresh();
  };

  /** Update the device name (e.g. when settings change) */
  setDeviceName = (name: string): void => {
    this._deviceName = name;
  };

  // --------------------------------------------------------------------------
  // Private
  // --------------------------------------------------------------------------

  private handleDevicesChanged(unifiedDevices: UnifiedDevice[]): void {
    try {
      const store = useDeviceStore.getState();
      const mapped = unifiedDevices.map(mapDevice);

      const thisDevice = createThisDevice(this._deviceName, detectPlatform());

      // Preserve favourite flags from the existing store
      const withFavorites = mapped.map((device) => {
        const existing = store.devices.find((d) => d.id === device.id);
        return existing ? { ...device, isFavorite: existing.isFavorite } : device;
      });

      store.setDevices([thisDevice, ...withFavorites]);

      const dStatus = getUnifiedDiscovery().getStatus();
      this.status = {
        isScanning: true,
        deviceCount: unifiedDevices.length,
        mdnsAvailable: dStatus.mdnsAvailable,
        signalingConnected: dStatus.signalingConnected,
        error: null,
      };

      secureLog.log('[DiscoveryController] Updated devices:', withFavorites.length + 1);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update devices';
      secureLog.error('[DiscoveryController] Error:', error);
      useDeviceStore.getState().setScanError(msg);
      this.status.error = msg;
    }
  }
}

/** Singleton instance shared across the app */
export const discoveryController = new DeviceDiscoveryController();
