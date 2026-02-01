/**
 * Factory Functions for Creating Type-Safe Objects
 *
 * Provides factory functions to create objects with all required
 * properties initialized to safe defaults.
 *
 * @module utils/factory
 */

import type { Device, FileInfo, Transfer, Settings } from '../types';
import type { Platform, TransferDirection } from '../types';
import { generateUUID } from './uuid';

// ============================================================================
// Device Factories
// ============================================================================

/**
 * Create a Device object with default values
 *
 * @param partial - Partial device data
 * @returns Complete Device object
 *
 * @example
 * ```typescript
 * const device = createDevice({
 *   id: 'device-1',
 *   name: 'My Laptop',
 *   platform: 'windows'
 * });
 * ```
 */
export function createDevice(
  partial: Partial<Device> & Pick<Device, 'id' | 'name' | 'platform'>
): Device {
  return {
    ip: null,
    port: null,
    avatar: null,
    isOnline: false,
    isFavorite: false,
    lastSeen: Date.now(),
    ...partial,
  };
}

/**
 * Create a Device from browser/device detection
 *
 * @param name - Device name
 * @param platform - Device platform (optional, auto-detected)
 * @returns Device object
 */
export function createDeviceFromBrowser(
  name?: string,
  platform?: Platform
): Device {
  const detectedPlatform = platform ?? detectPlatform();
  const deviceName = name ?? getDefaultDeviceName(detectedPlatform);

  return createDevice({
    id: generateUUID(),
    name: deviceName,
    platform: detectedPlatform,
    isOnline: true,
  });
}

/**
 * Detect current platform
 */
function detectPlatform(): Platform {
  if (typeof window === 'undefined') {return 'web';}

  const ua = window.navigator.userAgent.toLowerCase();

  if (ua.includes('android')) {return 'android';}
  if (ua.includes('iphone') || ua.includes('ipad')) {return 'ios';}
  if (ua.includes('win')) {return 'windows';}
  if (ua.includes('mac')) {return 'macos';}
  if (ua.includes('linux')) {return 'linux';}

  return 'web';
}

/**
 * Get default device name for platform
 */
function getDefaultDeviceName(platform: Platform): string {
  switch (platform) {
    case 'windows':
      return 'Windows PC';
    case 'macos':
      return 'Mac';
    case 'linux':
      return 'Linux PC';
    case 'android':
      return 'Android Device';
    case 'ios':
      return 'iPhone';
    case 'web':
      return 'Web Browser';
    default:
      return 'Unknown Device';
  }
}

// ============================================================================
// File Factories
// ============================================================================

/**
 * Create FileInfo from File object
 *
 * @param file - Browser File object
 * @param options - Additional options
 * @returns FileInfo object
 *
 * @example
 * ```typescript
 * const fileInfo = createFileInfo(file, {
 *   path: 'documents/file.pdf',
 *   thumbnail: dataUrl
 * });
 * ```
 */
export function createFileInfo(
  file: File,
  options?: {
    id?: string;
    path?: string;
    thumbnail?: string;
    hash?: string;
  }
): FileInfo {
  return {
    id: options?.id ?? generateUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    path: options?.path ?? null,
    thumbnail: options?.thumbnail ?? null,
    hash: options?.hash ?? '',
  };
}

/**
 * Create multiple FileInfo objects from FileList
 *
 * @param files - FileList or File array
 * @returns Array of FileInfo objects
 */
export function createFileInfoList(files: FileList | File[]): FileInfo[] {
  const fileArray = Array.from(files);
  return fileArray.map((file) => createFileInfo(file));
}

// ============================================================================
// Transfer Factories
// ============================================================================

/**
 * Create a Transfer object with default values
 *
 * @param partial - Partial transfer data
 * @returns Complete Transfer object
 *
 * @example
 * ```typescript
 * const transfer = createTransfer({
 *   id: 'transfer-1',
 *   files: [fileInfo],
 *   from: senderDevice,
 *   to: receiverDevice,
 *   direction: 'send'
 * });
 * ```
 */
export function createTransfer(
  partial: Partial<Transfer> &
    Pick<Transfer, 'id' | 'files' | 'from' | 'to' | 'direction'>
): Transfer {
  const totalSize = partial.files.reduce((sum, file) => sum + file.size, 0);

  return {
    status: 'pending',
    progress: 0,
    speed: 0,
    startTime: null,
    endTime: null,
    error: null,
    totalSize,
    transferredSize: 0,
    eta: null,
    quality: 'disconnected',
    encryptionMetadata: null,
    ...partial,
  };
}

/**
 * Create a new transfer from files
 *
 * @param files - Files to transfer
 * @param from - Source device
 * @param to - Destination device
 * @param direction - Transfer direction
 * @returns Transfer object
 */
export function createFileTransfer(
  files: FileInfo[],
  from: Device,
  to: Device,
  direction: TransferDirection
): Transfer {
  return createTransfer({
    id: generateUUID(),
    files,
    from,
    to,
    direction,
  });
}

// ============================================================================
// Settings Factories
// ============================================================================

/**
 * Create default Settings object
 *
 * @param partial - Partial settings to override defaults
 * @returns Complete Settings object
 *
 * @example
 * ```typescript
 * const settings = createDefaultSettings({
 *   deviceName: 'My Custom Device'
 * });
 * ```
 */
export function createDefaultSettings(partial?: Partial<Settings>): Settings {
  const device = createDeviceFromBrowser();

  return {
    deviceName: device.name,
    deviceAvatar: null,
    downloadPath: '',
    port: 9090,
    autoAccept: false,
    requirePin: false,
    pin: null,
    enableNotifications: true,
    enableSound: true,
    encryptionEnabled: true,
    theme: 'system',
    relayServers: [],
    enablePQC: true,
    enableOnionRouting: false,
    ...partial,
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate Device object has all required fields
 *
 * @param device - Device to validate
 * @returns True if valid
 */
export function isValidDevice(device: unknown): device is Device {
  return (
    typeof device === 'object' &&
    device !== null &&
    'id' in device &&
    typeof device.id === 'string' &&
    'name' in device &&
    typeof device.name === 'string' &&
    'platform' in device &&
    typeof device.platform === 'string' &&
    'isOnline' in device &&
    typeof device.isOnline === 'boolean' &&
    'isFavorite' in device &&
    typeof device.isFavorite === 'boolean' &&
    'lastSeen' in device &&
    typeof device.lastSeen === 'number'
  );
}

/**
 * Validate FileInfo object
 *
 * @param file - FileInfo to validate
 * @returns True if valid
 */
export function isValidFileInfo(file: unknown): file is FileInfo {
  return (
    typeof file === 'object' &&
    file !== null &&
    'id' in file &&
    typeof file.id === 'string' &&
    'name' in file &&
    typeof file.name === 'string' &&
    'size' in file &&
    typeof file.size === 'number' &&
    'type' in file &&
    typeof file.type === 'string' &&
    'lastModified' in file &&
    typeof file.lastModified === 'number'
  );
}

/**
 * Validate Transfer object
 *
 * @param transfer - Transfer to validate
 * @returns True if valid
 */
export function isValidTransfer(transfer: unknown): transfer is Transfer {
  return (
    typeof transfer === 'object' &&
    transfer !== null &&
    'id' in transfer &&
    typeof transfer.id === 'string' &&
    'files' in transfer &&
    Array.isArray(transfer.files) &&
    'from' in transfer &&
    isValidDevice(transfer.from) &&
    'to' in transfer &&
    isValidDevice(transfer.to) &&
    'direction' in transfer &&
    (transfer.direction === 'send' || transfer.direction === 'receive')
  );
}

// ============================================================================
// Type Conversion Helpers
// ============================================================================

/**
 * Convert Date to timestamp (for migration)
 *
 * @param value - Date or timestamp
 * @returns Timestamp
 */
export function toTimestamp(value: Date | number | null): number | null {
  if (value === null) {return null;}
  if (typeof value === 'number') {return value;}
  if (value instanceof Date) {return value.getTime();}
  return null;
}

/**
 * Convert timestamp to Date (for display)
 *
 * @param timestamp - Unix timestamp
 * @returns Date object
 */
export function toDate(timestamp: number | null): Date | null {
  if (timestamp === null) {return null;}
  return new Date(timestamp);
}

/**
 * Format timestamp for display
 *
 * @param timestamp - Unix timestamp
 * @param format - Format style
 * @returns Formatted string
 */
export function formatTimestamp(
  timestamp: number | null,
  format: 'full' | 'date' | 'time' | 'relative' = 'full'
): string {
  if (timestamp === null) {return 'Never';}

  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;

  if (format === 'relative') {
    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now';
    }
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    // Less than 1 week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }

  if (format === 'time') {
    return date.toLocaleTimeString();
  }

  if (format === 'date') {
    return date.toLocaleDateString();
  }

  return date.toLocaleString();
}
