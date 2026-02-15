/**
 * Discovery Controller -- Plain TypeScript Module
 *
 * Manages device discovery lifecycle OUTSIDE of React's hook system.
 * This prevents the React compiler / Turbopack from transforming
 * store.getState() calls into reactive subscriptions, which would cause
 * infinite re-render loops.
 *
 * All store access is via .getState() -- never via the hook form.
 * Because this module's functions don't start with "use" and are not
 * inside a React component/hook, the compiler leaves them alone.
 *
 * === Discovery Priority (Agent 026) ===
 *
 * 1. Room-based discovery (highest) -- devices sharing a room code see
 *    each other via the signaling server. This is the primary browser-
 *    compatible replacement for mDNS.
 *
 * 2. LAN detection -- the signaling server compares connecting clients'
 *    IP addresses. Devices on the same public IP are flagged as "same LAN"
 *    which enables direct WebRTC connections without TURN.
 *
 * 3. BLE proximity -- if Web Bluetooth API is available, short-range
 *    discovery via Bluetooth Low Energy.
 *
 * 4. Manual code entry -- always available as a fallback. The user types
 *    a room code or device ID to connect directly.
 */

import { useDeviceStore } from '@/lib/stores/device-store';
import { getUnifiedDiscovery, type UnifiedDevice } from '@/lib/discovery/unified-discovery';
import {
  bleDiscoveryController,
  type BLEDevice,
  type BLEScanResult,
  type BLEScanConfig,
  type BLEDiscoveryState,
} from '@/lib/discovery/ble';
import type { Device, Platform } from '@/lib/types';
import secureLog from '@/lib/utils/secure-logger';

// ============================================================================
// TYPES
// ============================================================================

/** Discovery method with priority ordering */
export type DiscoveryMethod = 'room' | 'lan' | 'ble' | 'signaling' | 'manual';

/** Source tag for how a device was discovered */
export interface DiscoverySource {
  method: DiscoveryMethod;
  /** Priority rank (lower = higher priority, 1-based) */
  priority: number;
  /** Human-readable label for the UI */
  label: string;
}

/** Discovery priority ranking */
export const DISCOVERY_PRIORITY: Record<DiscoveryMethod, DiscoverySource> = {
  room: { method: 'room', priority: 1, label: 'Same Room' },
  lan: { method: 'lan', priority: 2, label: 'Same Network' },
  ble: { method: 'ble', priority: 3, label: 'Nearby (Bluetooth)' },
  signaling: { method: 'signaling', priority: 4, label: 'Online' },
  manual: { method: 'manual', priority: 5, label: 'Manual' },
};

/** Extended device info with discovery source metadata */
export interface DiscoveredDeviceInfo {
  device: Device;
  source: DiscoverySource;
  /** Room code if discovered via room */
  roomCode?: string;
  /** Whether device is on the same LAN */
  sameLan?: boolean;
  /** BLE device info if discovered via Bluetooth */
  bleInfo?: BLEDevice;
}

export interface DiscoveryStatus {
  isScanning: boolean;
  deviceCount: number;
  mdnsAvailable: boolean;
  signalingConnected: boolean;
  bleAvailable: boolean;
  bleScanning: boolean;
  currentRoom: string | null;
  lanDetected: boolean;
  error: string | null;
  /** Active discovery methods */
  activeMethods: DiscoveryMethod[];
}

/** Room-based discovery state */
interface RoomDiscoveryState {
  roomCode: string;
  members: Map<string, RoomMember>;
  joined: boolean;
}

interface RoomMember {
  deviceId: string;
  deviceName: string;
  platform: string;
  socketId: string;
  joinedAt: number;
  isOnline: boolean;
  sameLan: boolean;
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

function createDeviceFromRoomMember(member: RoomMember): Device {
  return {
    id: member.deviceId,
    name: member.deviceName,
    platform: PLATFORM_MAP[member.platform.toLowerCase()] || 'web',
    ip: null,
    port: null,
    isOnline: member.isOnline,
    isFavorite: false,
    lastSeen: member.joinedAt,
    avatar: null,
  };
}

function createDeviceFromBLE(bleDevice: BLEDevice): Device {
  return {
    id: bleDevice.tallowInfo?.deviceId ?? `ble-${bleDevice.id}`,
    name:
      bleDevice.tallowInfo?.deviceName ??
      bleDevice.name ??
      'Bluetooth Device',
    platform: 'web', // BLE does not expose platform
    ip: null,
    port: null,
    isOnline: true,
    isFavorite: false,
    lastSeen: bleDevice.lastSeen,
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

  // Room-based discovery state
  private roomState: RoomDiscoveryState | null = null;

  // Tracks devices by discovery method for priority-based merging
  private devicesByMethod: Map<DiscoveryMethod, Map<string, DiscoveredDeviceInfo>> = new Map();

  // BLE state subscription
  private bleUnsubscribe: (() => void) | null = null;
  private bleDevices: Map<string, BLEDevice> = new Map();

  // LAN detection state
  private lanPeerIds: Set<string> = new Set();

  status: DiscoveryStatus = {
    isScanning: false,
    deviceCount: 0,
    mdnsAvailable: false,
    signalingConnected: false,
    bleAvailable: false,
    bleScanning: false,
    currentRoom: null,
    lanDetected: false,
    error: null,
    activeMethods: [],
  };

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  /** Start device discovery and sync with the device store */
  start = (deviceName?: string): void => {
    if (this._started) return;
    this._started = true;

    if (deviceName) this._deviceName = deviceName;

    secureLog.log('[DiscoveryController] Starting discovery');

    // Mark store as scanning
    useDeviceStore.getState().startScanning();

    // Initialize method tracking maps
    for (const method of Object.keys(DISCOVERY_PRIORITY) as DiscoveryMethod[]) {
      if (!this.devicesByMethod.has(method)) {
        this.devicesByMethod.set(method, new Map());
      }
    }

    // Start unified discovery (mDNS + signaling)
    const discovery = getUnifiedDiscovery();
    this.unsubscribe = discovery.onDevicesChanged(
      (devices: UnifiedDevice[]) => this.handleUnifiedDevicesChanged(devices),
    );

    discovery.start().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to start discovery';
      secureLog.error('[DiscoveryController] Start failed:', err);
      useDeviceStore.getState().setScanError(msg);
      this.status.error = msg;
    });

    // Initialize BLE (non-blocking)
    this.initializeBLE();

    // Auto-refresh every 10 seconds
    this.refreshInterval = setInterval(() => {
      if (this._started) discovery.refresh();
    }, 10_000);

    this.updateStatus();
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

    if (this.bleUnsubscribe) {
      this.bleUnsubscribe();
      this.bleUnsubscribe = null;
    }

    this.roomState = null;
    this.bleDevices.clear();
    this.lanPeerIds.clear();
    this.devicesByMethod.clear();

    getUnifiedDiscovery().stop();

    this.status = {
      isScanning: false,
      deviceCount: 0,
      mdnsAvailable: false,
      signalingConnected: false,
      bleAvailable: false,
      bleScanning: false,
      currentRoom: null,
      lanDetected: false,
      error: null,
      activeMethods: [],
    };
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
  // Room-Based Discovery
  // --------------------------------------------------------------------------

  /**
   * Join a discovery room. Devices sharing the same room code will
   * automatically see each other via the signaling server.
   *
   * This is the primary replacement for mDNS in browser contexts:
   * instead of broadcasting on the LAN, devices join a room identified
   * by a short code (entered or scanned via QR).
   */
  joinRoom = (roomCode: string): void => {
    if (this.roomState?.roomCode === roomCode) return;

    secureLog.log('[DiscoveryController] Joining room:', roomCode);

    this.roomState = {
      roomCode,
      members: new Map(),
      joined: true,
    };

    this.status.currentRoom = roomCode;
    this.updateStatus();
  };

  /** Leave the current discovery room */
  leaveRoom = (): void => {
    if (!this.roomState) return;

    secureLog.log('[DiscoveryController] Leaving room:', this.roomState.roomCode);

    // Remove room-discovered devices
    this.devicesByMethod.get('room')?.clear();
    this.roomState = null;
    this.status.currentRoom = null;

    this.mergeAndSync();
    this.updateStatus();
  };

  /**
   * Called when the signaling server notifies us of room members.
   * This is the callback wired up by the signaling socket handler.
   */
  handleRoomMemberUpdate = (members: RoomMember[]): void => {
    if (!this.roomState) return;

    const roomDevices = this.devicesByMethod.get('room') ?? new Map();
    roomDevices.clear();

    for (const member of members) {
      // Do not add ourselves
      if (member.deviceId === 'this-device') continue;

      const device = createDeviceFromRoomMember(member);
      const source = { ...DISCOVERY_PRIORITY.room };

      roomDevices.set(device.id, {
        device,
        source,
        roomCode: this.roomState.roomCode,
        sameLan: member.sameLan,
      });

      // Track LAN peers
      if (member.sameLan) {
        this.lanPeerIds.add(member.deviceId);
      }
    }

    this.devicesByMethod.set('room', roomDevices);
    this.roomState.members.clear();
    for (const m of members) {
      this.roomState.members.set(m.deviceId, m);
    }

    this.mergeAndSync();
  };

  // --------------------------------------------------------------------------
  // LAN Detection
  // --------------------------------------------------------------------------

  /**
   * Called when the signaling server reports that a peer shares our
   * public IP (i.e., they are on the same LAN behind the same NAT).
   */
  handleLanPeerDetected = (peerId: string): void => {
    this.lanPeerIds.add(peerId);
    this.status.lanDetected = this.lanPeerIds.size > 0;

    // Upgrade any signaling-discovered device to LAN priority
    const signalingDevices = this.devicesByMethod.get('signaling');
    if (signalingDevices?.has(peerId)) {
      const entry = signalingDevices.get(peerId)!;
      const lanDevices = this.devicesByMethod.get('lan') ?? new Map();
      lanDevices.set(peerId, {
        ...entry,
        source: { ...DISCOVERY_PRIORITY.lan },
        sameLan: true,
      });
      this.devicesByMethod.set('lan', lanDevices);
      signalingDevices.delete(peerId);
    }

    this.mergeAndSync();
  };

  /** Check if a specific peer is on the same LAN */
  isPeerOnLan = (peerId: string): boolean => {
    return this.lanPeerIds.has(peerId);
  };

  // --------------------------------------------------------------------------
  // BLE Discovery
  // --------------------------------------------------------------------------

  /**
   * Initialize BLE capability detection (non-blocking).
   * This does NOT start scanning -- it only checks if BLE is available.
   * Actual scanning requires a user gesture.
   */
  private async initializeBLE(): Promise<void> {
    try {
      await bleDiscoveryController.initialize();

      this.bleUnsubscribe = bleDiscoveryController.subscribe((state: BLEDiscoveryState) => {
        this.status.bleAvailable = state.available && state.hardwareEnabled;
        this.status.bleScanning = state.scanning;

        // Sync BLE devices into the method map
        if (state.devices.length > 0) {
          const bleMap = this.devicesByMethod.get('ble') ?? new Map();
          bleMap.clear();

          for (const bleDevice of state.devices) {
            this.bleDevices.set(bleDevice.id, bleDevice);

            const device = createDeviceFromBLE(bleDevice);
            bleMap.set(device.id, {
              device,
              source: { ...DISCOVERY_PRIORITY.ble },
              bleInfo: bleDevice,
            });
          }

          this.devicesByMethod.set('ble', bleMap);
          this.mergeAndSync();
        }
      });
    } catch (err) {
      secureLog.debug('[DiscoveryController] BLE init skipped:', err);
    }
  }

  /**
   * Trigger a BLE scan. MUST be called from a user gesture (button click).
   * Returns the scan result so the UI can show appropriate feedback.
   */
  requestBLEScan = async (config?: BLEScanConfig): Promise<BLEScanResult> => {
    return bleDiscoveryController.requestScan(config);
  };

  /** Get current BLE discovery state */
  getBLEState = (): Readonly<BLEDiscoveryState> => {
    return bleDiscoveryController.state;
  };

  // --------------------------------------------------------------------------
  // Manual Device Entry
  // --------------------------------------------------------------------------

  /**
   * Add a device by manual code entry.
   */
  addManualDevice = (deviceId: string, deviceName: string, platform: Platform = 'web'): void => {
    const device: Device = {
      id: deviceId,
      name: deviceName,
      platform,
      ip: null,
      port: null,
      isOnline: true,
      isFavorite: false,
      lastSeen: Date.now(),
      avatar: null,
    };

    const manualDevices = this.devicesByMethod.get('manual') ?? new Map();
    manualDevices.set(deviceId, {
      device,
      source: { ...DISCOVERY_PRIORITY.manual },
    });
    this.devicesByMethod.set('manual', manualDevices);

    this.mergeAndSync();
  };

  // --------------------------------------------------------------------------
  // Priority-Based Device Merging
  // --------------------------------------------------------------------------

  /**
   * Get the discovery source info for a specific device.
   * Returns the highest-priority source if the device was found by
   * multiple methods.
   */
  getDeviceSource = (deviceId: string): DiscoverySource | null => {
    let bestSource: DiscoverySource | null = null;

    for (const [, methodDevices] of this.devicesByMethod) {
      const entry = methodDevices.get(deviceId);
      if (entry) {
        if (!bestSource || entry.source.priority < bestSource.priority) {
          bestSource = entry.source;
        }
      }
    }

    return bestSource;
  };

  /**
   * Get all discovered devices with their source info, sorted by priority.
   */
  getDiscoveredDevices = (): DiscoveredDeviceInfo[] => {
    const merged = new Map<string, DiscoveredDeviceInfo>();

    // Process methods in priority order (room first, manual last)
    const methods: DiscoveryMethod[] = ['room', 'lan', 'ble', 'signaling', 'manual'];

    for (const method of methods) {
      const methodDevices = this.devicesByMethod.get(method);
      if (!methodDevices) continue;

      for (const [id, info] of methodDevices) {
        if (!merged.has(id)) {
          merged.set(id, info);
        }
        // If already present from a higher-priority method, skip
      }
    }

    return Array.from(merged.values()).sort(
      (a, b) => a.source.priority - b.source.priority,
    );
  };

  // --------------------------------------------------------------------------
  // Private: Event Handlers
  // --------------------------------------------------------------------------

  private handleUnifiedDevicesChanged(unifiedDevices: UnifiedDevice[]): void {
    try {
      const signalingDevices = this.devicesByMethod.get('signaling') ?? new Map();
      signalingDevices.clear();

      for (const unified of unifiedDevices) {
        const device = mapDevice(unified);

        // Check if this peer was detected as on our LAN
        const isLanPeer = this.lanPeerIds.has(device.id);

        if (isLanPeer) {
          const lanDevices = this.devicesByMethod.get('lan') ?? new Map();
          lanDevices.set(device.id, {
            device,
            source: { ...DISCOVERY_PRIORITY.lan },
            sameLan: true,
          });
          this.devicesByMethod.set('lan', lanDevices);
        } else {
          signalingDevices.set(device.id, {
            device,
            source: unified.hasMdns
              ? { ...DISCOVERY_PRIORITY.lan }
              : { ...DISCOVERY_PRIORITY.signaling },
            sameLan: unified.hasMdns,
          });
        }
      }

      this.devicesByMethod.set('signaling', signalingDevices);

      const dStatus = getUnifiedDiscovery().getStatus();
      this.status.mdnsAvailable = dStatus.mdnsAvailable;
      this.status.signalingConnected = dStatus.signalingConnected;

      this.mergeAndSync();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update devices';
      secureLog.error('[DiscoveryController] Error:', error);
      useDeviceStore.getState().setScanError(msg);
      this.status.error = msg;
    }
  }

  /**
   * Merge devices from all methods (priority-based deduplication)
   * and sync the result into the Zustand device store.
   */
  private mergeAndSync(): void {
    try {
      const store = useDeviceStore.getState();
      const allDevices = this.getDiscoveredDevices();

      const thisDevice = createThisDevice(this._deviceName, detectPlatform());

      // Build final device list, preserving favourite flags
      const withFavorites = allDevices.map((info) => {
        const existing = store.devices.find((d) => d.id === info.device.id);
        return existing
          ? { ...info.device, isFavorite: existing.isFavorite }
          : info.device;
      });

      store.setDevices([thisDevice, ...withFavorites]);
      this.updateStatus();

      secureLog.log(
        '[DiscoveryController] Synced devices:',
        withFavorites.length + 1,
        'methods:',
        this.getActiveMethods().join(','),
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to sync devices';
      secureLog.error('[DiscoveryController] Sync error:', error);
      this.status.error = msg;
    }
  }

  private getActiveMethods(): DiscoveryMethod[] {
    const active: DiscoveryMethod[] = [];
    for (const [method, devices] of this.devicesByMethod) {
      if (devices.size > 0) active.push(method);
    }
    return active;
  }

  private updateStatus(): void {
    this.status.isScanning = this._started;
    this.status.activeMethods = this.getActiveMethods();
    this.status.lanDetected = this.lanPeerIds.size > 0;

    // Count all unique devices across methods
    const uniqueIds = new Set<string>();
    for (const [, devices] of this.devicesByMethod) {
      for (const id of devices.keys()) {
        uniqueIds.add(id);
      }
    }
    this.status.deviceCount = uniqueIds.size;
  }
}

/** Singleton instance shared across the app */
export const discoveryController = new DeviceDiscoveryController();
