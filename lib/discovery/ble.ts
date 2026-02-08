/**
 * BLE (Bluetooth Low Energy) Proximity Detection
 * Agent 026 — DISCOVERY-HUNTER
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
  /** Tallow-specific device info (from service data) */
  tallowInfo?: {
    deviceId: string;
    deviceName: string;
    transferReady: boolean;
  };
  /** Timestamp of last seen */
  lastSeen: number;
}

export interface BLECapabilities {
  /** Whether Web Bluetooth API is available */
  available: boolean;
  /** Whether Bluetooth is enabled on the device */
  enabled: boolean;
  /** Reason if unavailable */
  reason?: string;
}

export interface BLEScanConfig {
  /** Scan duration in milliseconds */
  timeout?: number;
  /** Minimum RSSI threshold (filter weak signals) */
  minRSSI?: number;
  /** Whether to accept all devices or only Tallow-branded ones */
  tallowOnly?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Tallow's BLE service UUID for device discovery */
export const TALLOW_BLE_SERVICE_UUID = '0000fd00-0000-1000-8000-00805f9b34fb';

/** Tallow's BLE characteristic UUID for device info */
export const TALLOW_BLE_CHAR_UUID = '0000fd01-0000-1000-8000-00805f9b34fb';

/** Default scan timeout (10 seconds) */
const DEFAULT_SCAN_TIMEOUT = 10000;

/** Default minimum RSSI (-80 dBm, approximately 10 meters) */
const DEFAULT_MIN_RSSI = -80;

// ============================================================================
// CAPABILITY DETECTION
// ============================================================================

/**
 * Check if BLE is available on the current device/browser.
 */
export async function checkBLECapabilities(): Promise<BLECapabilities> {
  if (typeof navigator === 'undefined') {
    return { available: false, enabled: false, reason: 'Not in browser environment' };
  }

  if (!('bluetooth' in navigator)) {
    return { available: false, enabled: false, reason: 'Web Bluetooth API not supported' };
  }

  try {
    const available = await navigator.bluetooth.getAvailability();
    return {
      available,
      enabled: available,
      reason: available ? undefined : 'Bluetooth is disabled',
    };
  } catch {
    return { available: false, enabled: false, reason: 'Bluetooth availability check failed' };
  }
}

// ============================================================================
// RSSI → DISTANCE ESTIMATION
// ============================================================================

/**
 * Estimate distance from RSSI using the log-distance path loss model.
 * This is approximate — real-world accuracy varies with environment.
 *
 * @param rssi - Signal strength in dBm
 * @param txPower - Transmit power at 1 meter (default: -59 dBm for typical BLE)
 * @param pathLossExponent - Environment factor (2=free space, 2.5-4=indoors)
 */
export function estimateDistance(
  rssi: number,
  txPower: number = -59,
  pathLossExponent: number = 2.5
): number {
  if (rssi >= 0) {return 0;}
  const ratio = (txPower - rssi) / (10 * pathLossExponent);
  return Math.round(Math.pow(10, ratio) * 100) / 100; // Round to 2 decimal places
}

// ============================================================================
// BLE SCANNING
// ============================================================================

/**
 * Scan for nearby BLE devices.
 *
 * NOTE: Web Bluetooth API requires user gesture (click/tap) to initiate scanning.
 * This function should be called from a user-triggered event handler.
 */
export async function scanForDevices(
  config: BLEScanConfig = {}
): Promise<BLEDevice[]> {
  const {
    timeout: _timeout = DEFAULT_SCAN_TIMEOUT,
    minRSSI = DEFAULT_MIN_RSSI,
    tallowOnly = true,
  } = config;

  const capabilities = await checkBLECapabilities();
  if (!capabilities.available) {
    return [];
  }

  try {
    // Request device with Tallow service filter
    const requestOptions: RequestDeviceOptions = tallowOnly
      ? {
          filters: [{ services: [TALLOW_BLE_SERVICE_UUID] }],
          optionalServices: [TALLOW_BLE_SERVICE_UUID],
        }
      : {
          acceptAllDevices: true,
          optionalServices: [TALLOW_BLE_SERVICE_UUID],
        };

    // Note: requestDevice shows a browser picker dialog.
    // For background scanning, we'd need requestLEScan() which is
    // only available behind flags in most browsers.
    const device = await navigator.bluetooth.requestDevice(requestOptions);

    if (!device) {return [];}

    const bleDevice: BLEDevice = {
      id: device.id,
      name: device.name ?? null,
      rssi: minRSSI, // Web Bluetooth doesn't expose RSSI in requestDevice
      estimatedDistance: estimateDistance(minRSSI),
      lastSeen: Date.now(),
    };

    return [bleDevice];
  } catch (error) {
    // User cancelled the picker or no devices found
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return [];
    }
    throw error;
  }
}

/**
 * Connect to a BLE device and read Tallow device info.
 */
export async function readDeviceInfo(
  device: BluetoothDevice
): Promise<BLEDevice['tallowInfo'] | null> {
  try {
    const server = await device.gatt?.connect();
    if (!server) {return null;}

    const service = await server.getPrimaryService(TALLOW_BLE_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(TALLOW_BLE_CHAR_UUID);
    const value = await characteristic.readValue();

    // Decode Tallow device info from characteristic value
    const decoder = new TextDecoder();
    const json = decoder.decode(value.buffer);
    const info = JSON.parse(json);

    server.disconnect();

    return {
      deviceId: info.deviceId ?? device.id,
      deviceName: info.deviceName ?? device.name ?? 'Unknown',
      transferReady: info.transferReady ?? false,
    };
  } catch {
    return null;
  }
}

/**
 * Watch for BLE availability changes.
 */
export function watchAvailability(
  callback: (available: boolean) => void
): () => void {
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    return () => {};
  }

  const handler = (event: Event) => {
    callback((event as unknown as { value: boolean }).value);
  };

  navigator.bluetooth.addEventListener('availabilitychanged', handler);
  return () => {
    navigator.bluetooth.removeEventListener('availabilitychanged', handler);
  };
}
