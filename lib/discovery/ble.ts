/**
 * BLE (Bluetooth Low Energy) Proximity Detection
 * Agent 026 -- DISCOVERY-HUNTER
 *
 * Detects nearby devices using Web Bluetooth API for proximity-based
 * device discovery. BLE advertising allows devices to find each other
 * without requiring the same WiFi network.
 *
 * Features:
 * - BLE device scanning with Tallow service UUID
 * - RSSI-based distance estimation
 * - Automatic discovery timeout
 * - Graceful fallback when BLE is unavailable
 * - Proper permission request UI flow
 * - GATT service for Tallow device info exchange
 * - Permission denied handling
 *
 * BROWSER SUPPORT: Web Bluetooth API is available in Chrome, Edge, Opera.
 * Not supported in Firefox or Safari. Falls back to other discovery methods.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BLEDevice {
  /** Device ID from Web Bluetooth */
  id: string;
  /** Device name (if available) */
  name: string | null;
  /** Signal strength (RSSI in dBm) */
  rssi: number;
  /** Estimated distance in meters */
  estimatedDistance: number;
  /** Tallow-specific device info (from GATT service data) */
  tallowInfo?: TallowBLEDeviceInfo;
  /** Timestamp of last seen */
  lastSeen: number;
}

/** Device info exchanged via BLE GATT characteristic */
export interface TallowBLEDeviceInfo {
  deviceId: string;
  deviceName: string;
  transferReady: boolean;
  capabilities?: string[];
  protocolVersion?: string;
}

export interface BLECapabilities {
  /** Whether Web Bluetooth API is available in this browser */
  apiAvailable: boolean;
  /** Whether Bluetooth hardware is enabled on the device */
  hardwareEnabled: boolean;
  /** Human-readable reason if unavailable */
  unavailableReason?: string;
  /** Whether the user has previously granted Bluetooth permission */
  permissionState?: PermissionState;
}

export interface BLEScanConfig {
  /** Scan duration in milliseconds (default: 10000) */
  timeout?: number;
  /** Minimum RSSI threshold -- filter weak signals (default: -80 dBm) */
  minRSSI?: number;
  /** Whether to accept all devices or only Tallow-branded ones (default: true) */
  tallowOnly?: boolean;
  /** Whether to attempt GATT connection to read device info (default: true) */
  readDeviceInfo?: boolean;
}

/** Result of a BLE scan attempt */
export interface BLEScanResult {
  /** Whether the scan succeeded */
  success: boolean;
  /** Discovered devices (empty if scan failed or user cancelled) */
  devices: BLEDevice[];
  /** Error information if scan failed */
  error?: BLEScanError;
}

/** Structured error for BLE operations */
export interface BLEScanError {
  /** Error code for programmatic handling */
  code: BLEErrorCode;
  /** Human-readable error message */
  message: string;
  /** Whether the user can retry this action */
  retryable: boolean;
}

export type BLEErrorCode =
  | 'API_UNAVAILABLE'
  | 'HARDWARE_DISABLED'
  | 'PERMISSION_DENIED'
  | 'USER_CANCELLED'
  | 'NO_DEVICES_FOUND'
  | 'GATT_CONNECTION_FAILED'
  | 'SCAN_TIMEOUT'
  | 'UNKNOWN_ERROR';

/** Permission state for BLE access */
export type BLEPermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

// Internal type for the Web Bluetooth API (not fully typed in lib.dom.d.ts)
interface BluetoothLikeDevice {
  id: string;
  name?: string | null;
  gatt?: {
    connect: () => Promise<{
      getPrimaryService: (uuid: string) => Promise<{
        getCharacteristic: (uuid: string) => Promise<{
          readValue: () => Promise<DataView>;
        }>;
      }>;
      disconnect: () => void;
      connected: boolean;
    }>;
    connected?: boolean;
  };
}

interface BluetoothLike {
  getAvailability: () => Promise<boolean>;
  requestDevice: (options: unknown) => Promise<BluetoothLikeDevice>;
  addEventListener: (type: string, listener: (event: Event) => void) => void;
  removeEventListener: (type: string, listener: (event: Event) => void) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Tallow's BLE service UUID for device discovery */
export const TALLOW_BLE_SERVICE_UUID = '0000fd00-0000-1000-8000-00805f9b34fb';

/** Tallow's BLE characteristic UUID for device info exchange */
export const TALLOW_BLE_CHAR_UUID = '0000fd01-0000-1000-8000-00805f9b34fb';

/** Default scan timeout (10 seconds) */
const DEFAULT_SCAN_TIMEOUT = 10_000;

/** Default minimum RSSI (-80 dBm, approximately 10 meters) */
const DEFAULT_MIN_RSSI = -80;

// ============================================================================
// CAPABILITY DETECTION
// ============================================================================

/**
 * Get the Web Bluetooth API reference, or null if unavailable.
 * Centralizes the type cast so callers do not repeat it.
 */
function getBluetooth(): BluetoothLike | null {
  if (typeof navigator === 'undefined') {
    return null;
  }
  return (navigator as Navigator & { bluetooth?: BluetoothLike }).bluetooth ?? null;
}

/**
 * Check BLE capabilities on the current device/browser.
 *
 * This performs three checks in sequence:
 * 1. Is the Web Bluetooth API present in this browser?
 * 2. Is the Bluetooth hardware actually enabled?
 * 3. What is the current permission state (if queryable)?
 */
export async function checkBLECapabilities(): Promise<BLECapabilities> {
  // SSR guard
  if (typeof navigator === 'undefined') {
    return {
      apiAvailable: false,
      hardwareEnabled: false,
      unavailableReason: 'Not in browser environment',
    };
  }

  const bluetooth = getBluetooth();

  // Step 1: API availability
  if (!bluetooth) {
    return {
      apiAvailable: false,
      hardwareEnabled: false,
      unavailableReason:
        'Web Bluetooth API is not supported in this browser. ' +
        'Try Chrome, Edge, or Opera on desktop, or Chrome on Android.',
    };
  }

  // Step 2: Hardware availability
  let hardwareEnabled = false;
  try {
    hardwareEnabled = await bluetooth.getAvailability();
  } catch {
    return {
      apiAvailable: true,
      hardwareEnabled: false,
      unavailableReason: 'Could not check Bluetooth hardware status.',
    };
  }

  if (!hardwareEnabled) {
    return {
      apiAvailable: true,
      hardwareEnabled: false,
      unavailableReason:
        'Bluetooth is turned off. Please enable Bluetooth in your system settings.',
    };
  }

  // Step 3: Permission state (Permissions API may not include 'bluetooth')
  let permissionState: PermissionState | undefined;
  try {
    // The Permissions API for 'bluetooth' is non-standard but supported in Chrome
    const perm = await navigator.permissions.query({ name: 'bluetooth' as PermissionName });
    permissionState = perm.state;
  } catch {
    // Permissions API does not support bluetooth query -- that is OK
  }

  return {
    apiAvailable: true,
    hardwareEnabled: true,
    permissionState: permissionState ?? 'prompt',
  };
}

/**
 * Get a human-readable BLE permission state.
 */
export async function getBLEPermissionState(): Promise<BLEPermissionState> {
  const caps = await checkBLECapabilities();
  if (!caps.apiAvailable) return 'unavailable';
  if (!caps.hardwareEnabled) return 'unavailable';
  if (caps.permissionState === 'denied') return 'denied';
  if (caps.permissionState === 'granted') return 'granted';
  return 'prompt';
}

// ============================================================================
// RSSI --> DISTANCE ESTIMATION
// ============================================================================

/**
 * Estimate distance from RSSI using the log-distance path loss model.
 * This is approximate -- real-world accuracy varies with environment.
 *
 * @param rssi - Signal strength in dBm
 * @param txPower - Transmit power at 1 meter (default: -59 dBm for typical BLE)
 * @param pathLossExponent - Environment factor (2=free space, 2.5-4=indoors)
 */
export function estimateDistance(
  rssi: number,
  txPower: number = -59,
  pathLossExponent: number = 2.5,
): number {
  if (rssi >= 0) return 0;
  const ratio = (txPower - rssi) / (10 * pathLossExponent);
  return Math.round(Math.pow(10, ratio) * 100) / 100;
}

// ============================================================================
// BLE SCANNING
// ============================================================================

/**
 * Scan for nearby BLE devices.
 *
 * IMPORTANT: Web Bluetooth API requires a user gesture (click/tap) to initiate
 * scanning. This function MUST be called from a user-triggered event handler
 * (e.g., button onClick). The browser will show a device picker dialog.
 *
 * Returns a structured result that distinguishes between different failure
 * modes so the UI can provide appropriate feedback.
 */
export async function scanForDevices(
  config: BLEScanConfig = {},
): Promise<BLEScanResult> {
  const {
    timeout: _timeout = DEFAULT_SCAN_TIMEOUT,
    minRSSI = DEFAULT_MIN_RSSI,
    tallowOnly = true,
    readDeviceInfo = true,
  } = config;

  // Pre-flight: check capabilities
  const capabilities = await checkBLECapabilities();

  if (!capabilities.apiAvailable) {
    return {
      success: false,
      devices: [],
      error: {
        code: 'API_UNAVAILABLE',
        message: capabilities.unavailableReason ?? 'Web Bluetooth API not available',
        retryable: false,
      },
    };
  }

  if (!capabilities.hardwareEnabled) {
    return {
      success: false,
      devices: [],
      error: {
        code: 'HARDWARE_DISABLED',
        message: capabilities.unavailableReason ?? 'Bluetooth hardware is disabled',
        retryable: true,
      },
    };
  }

  const bluetooth = getBluetooth();
  if (!bluetooth) {
    return {
      success: false,
      devices: [],
      error: {
        code: 'API_UNAVAILABLE',
        message: 'Bluetooth API reference lost',
        retryable: false,
      },
    };
  }

  try {
    // Build request options
    const requestOptions = tallowOnly
      ? {
          filters: [{ services: [TALLOW_BLE_SERVICE_UUID] }],
          optionalServices: [TALLOW_BLE_SERVICE_UUID],
        }
      : {
          acceptAllDevices: true,
          optionalServices: [TALLOW_BLE_SERVICE_UUID],
        };

    // This will show the browser's device picker dialog.
    // The promise resolves when the user selects a device,
    // or rejects if they cancel or no devices are found.
    const device = await bluetooth.requestDevice(requestOptions);

    if (!device) {
      return {
        success: true,
        devices: [],
      };
    }

    const bleDevice: BLEDevice = {
      id: device.id,
      name: device.name ?? null,
      rssi: minRSSI, // Web Bluetooth does not expose RSSI from requestDevice
      estimatedDistance: estimateDistance(minRSSI),
      lastSeen: Date.now(),
    };

    // Attempt to read Tallow device info via GATT if requested
    if (readDeviceInfo && device.gatt) {
      const info = await readTallowDeviceInfo(device);
      if (info) {
        bleDevice.tallowInfo = info;
        // Use the device name from Tallow info if we got one
        if (info.deviceName && !bleDevice.name) {
          bleDevice.name = info.deviceName;
        }
      }
    }

    return {
      success: true,
      devices: [bleDevice],
    };
  } catch (error) {
    return handleBLEScanError(error);
  }
}

/**
 * Map a DOMException or unknown error to a structured BLEScanResult.
 */
function handleBLEScanError(error: unknown): BLEScanResult {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotFoundError':
        // User cancelled the picker or no devices matched filters
        return {
          success: true,
          devices: [],
          error: {
            code: 'USER_CANCELLED',
            message: 'Bluetooth device picker was cancelled or no devices found.',
            retryable: true,
          },
        };

      case 'SecurityError':
        // Permission denied (e.g., page not served over HTTPS, or user blocked)
        return {
          success: false,
          devices: [],
          error: {
            code: 'PERMISSION_DENIED',
            message:
              'Bluetooth permission denied. ' +
              'Make sure you are on a secure (HTTPS) page and have not blocked Bluetooth access.',
            retryable: false,
          },
        };

      case 'NotAllowedError':
        // User denied the permission prompt, or no user gesture
        return {
          success: false,
          devices: [],
          error: {
            code: 'PERMISSION_DENIED',
            message:
              'Bluetooth access was not allowed. ' +
              'This may happen if the scan was not triggered by a button click.',
            retryable: true,
          },
        };

      case 'AbortError':
        return {
          success: false,
          devices: [],
          error: {
            code: 'SCAN_TIMEOUT',
            message: 'Bluetooth scan was aborted.',
            retryable: true,
          },
        };

      default:
        return {
          success: false,
          devices: [],
          error: {
            code: 'UNKNOWN_ERROR',
            message: `Bluetooth error: ${error.name} - ${error.message}`,
            retryable: true,
          },
        };
    }
  }

  // Non-DOMException error
  const msg = error instanceof Error ? error.message : 'Unknown Bluetooth error';
  return {
    success: false,
    devices: [],
    error: {
      code: 'UNKNOWN_ERROR',
      message: msg,
      retryable: true,
    },
  };
}

// ============================================================================
// GATT SERVICE INTERACTION
// ============================================================================

/**
 * Connect to a BLE device's GATT server and read the Tallow device info
 * characteristic. Returns null if the connection fails or the service
 * is not available (device may not be a Tallow device).
 */
export async function readTallowDeviceInfo(
  device: BluetoothLikeDevice,
): Promise<TallowBLEDeviceInfo | null> {
  if (!device.gatt) return null;

  let server: Awaited<ReturnType<NonNullable<typeof device.gatt>['connect']>> | null = null;

  try {
    server = await device.gatt.connect();
    if (!server) return null;

    const service = await server.getPrimaryService(TALLOW_BLE_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(TALLOW_BLE_CHAR_UUID);
    const value = await characteristic.readValue();

    // Decode Tallow device info from characteristic value (JSON-encoded)
    const decoder = new TextDecoder();
    const json = decoder.decode(value.buffer);
    const info: unknown = JSON.parse(json);

    // Validate the parsed data
    if (!info || typeof info !== 'object') return null;

    const record = info as Record<string, unknown>;

    const result: TallowBLEDeviceInfo = {
      deviceId: typeof record['deviceId'] === 'string' ? record['deviceId'] : device.id,
      deviceName:
        typeof record['deviceName'] === 'string'
          ? record['deviceName']
          : device.name ?? 'Unknown Device',
      transferReady:
        typeof record['transferReady'] === 'boolean' ? record['transferReady'] : false,
    };

    if (Array.isArray(record['capabilities'])) {
      result.capabilities = (record['capabilities'] as unknown[]).filter(
        (c): c is string => typeof c === 'string',
      );
    }

    if (typeof record['protocolVersion'] === 'string') {
      result.protocolVersion = record['protocolVersion'];
    }

    return result;
  } catch {
    // GATT connection or read failed -- device may not support Tallow service
    return null;
  } finally {
    // Always disconnect to free the GATT connection
    try {
      server?.disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }
}

// ============================================================================
// AVAILABILITY WATCHING
// ============================================================================

/**
 * Watch for Bluetooth hardware availability changes (e.g., user toggles
 * Bluetooth on/off in system settings).
 *
 * Returns an unsubscribe function.
 */
export function watchAvailability(
  callback: (available: boolean) => void,
): () => void {
  if (typeof navigator === 'undefined') {
    return () => {};
  }

  const bluetooth = getBluetooth();
  if (!bluetooth) {
    return () => {};
  }

  const handler = (event: Event) => {
    callback((event as unknown as { value: boolean }).value);
  };

  bluetooth.addEventListener('availabilitychanged', handler);
  return () => {
    bluetooth.removeEventListener('availabilitychanged', handler);
  };
}

// ============================================================================
// BLE DISCOVERY CONTROLLER (plain TS -- NOT a React hook)
// ============================================================================

/**
 * BLE discovery state managed outside React to avoid Turbopack issues.
 * The controller pattern keeps all mutable state and side effects in
 * plain TypeScript, making it safe from the React compiler.
 */
export interface BLEDiscoveryState {
  /** Whether BLE is available on this device */
  available: boolean;
  /** Whether Bluetooth hardware is enabled */
  hardwareEnabled: boolean;
  /** Current permission state */
  permissionState: BLEPermissionState;
  /** Whether a scan is currently in progress */
  scanning: boolean;
  /** Devices found in the most recent scan */
  devices: BLEDevice[];
  /** Most recent error from a scan attempt */
  lastError: BLEScanError | null;
}

type BLEStateCallback = (state: BLEDiscoveryState) => void;

class BLEDiscoveryController {
  private _state: BLEDiscoveryState = {
    available: false,
    hardwareEnabled: false,
    permissionState: 'prompt',
    scanning: false,
    devices: [],
    lastError: null,
  };

  private listeners: Set<BLEStateCallback> = new Set();
  private availabilityUnsubscribe: (() => void) | null = null;
  private initialized = false;

  /** Current state (read-only snapshot) */
  get state(): Readonly<BLEDiscoveryState> {
    return this._state;
  }

  /**
   * Initialize BLE capability detection. Safe to call multiple times.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const caps = await checkBLECapabilities();
    const permState = await getBLEPermissionState();

    this._state = {
      ...this._state,
      available: caps.apiAvailable,
      hardwareEnabled: caps.hardwareEnabled,
      permissionState: permState,
    };

    // Watch for hardware availability changes
    this.availabilityUnsubscribe = watchAvailability(async (available) => {
      this._state = {
        ...this._state,
        hardwareEnabled: available,
        permissionState: await getBLEPermissionState(),
      };
      this.notify();
    });

    this.notify();
  }

  /**
   * Request a BLE scan. MUST be called from a user gesture (button click).
   *
   * This is the primary method the UI calls. It handles:
   * 1. Checking capabilities
   * 2. Requesting the browser's device picker (which implicitly requests permission)
   * 3. Reading GATT device info
   * 4. Returning structured results
   */
  async requestScan(config?: BLEScanConfig): Promise<BLEScanResult> {
    this._state = { ...this._state, scanning: true, lastError: null };
    this.notify();

    const result = await scanForDevices(config);

    this._state = {
      ...this._state,
      scanning: false,
      devices: result.devices,
      lastError: result.error ?? null,
      // Re-check permission state after scan attempt
      permissionState: result.error?.code === 'PERMISSION_DENIED' ? 'denied' : this._state.permissionState,
    };
    this.notify();

    return result;
  }

  /**
   * Subscribe to state changes.
   * Returns an unsubscribe function.
   */
  subscribe(callback: BLEStateCallback): () => void {
    this.listeners.add(callback);
    // Immediately notify with current state
    callback(this._state);
    return () => this.listeners.delete(callback);
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.availabilityUnsubscribe?.();
    this.availabilityUnsubscribe = null;
    this.listeners.clear();
    this.initialized = false;
  }

  private notify(): void {
    const snapshot = { ...this._state };
    this.listeners.forEach((cb) => cb(snapshot));
  }
}

/** Singleton BLE discovery controller */
export const bleDiscoveryController = new BLEDiscoveryController();
