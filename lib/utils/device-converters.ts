/**
 * Device Conversion Utilities
 *
 * Provides type-safe conversions between different device representations
 * in the Tallow application. Eliminates code duplication and provides
 * a single source of truth for device transformations.
 *
 * @module device-converters
 */

import { Device, Platform } from '@/lib/types';
import { DiscoveredDevice } from '@/lib/discovery/local-discovery';
import { Friend } from '@/lib/storage/friends';

/**
 * Normalize timestamp to number
 *
 * Handles multiple timestamp formats (Date, number, undefined) and
 * converts them to a consistent millisecond timestamp format.
 *
 * @param timestamp - The timestamp in various formats
 * @param fallback - Default value if timestamp is undefined
 * @returns Millisecond timestamp as number
 */
function normalizeTimestamp(
  timestamp: Date | number | undefined,
  fallback: number = Date.now()
): number {
  if (timestamp === undefined) {return fallback;}
  if (typeof timestamp === 'number') {return timestamp;}
  return timestamp.getTime();
}

/**
 * Validate and normalize platform string
 *
 * Ensures platform strings match the Platform type, falling back
 * to 'web' for invalid values.
 *
 * @param platform - Platform string from external source
 * @returns Valid Platform type
 */
function normalizePlatform(platform: string): Platform {
  const validPlatforms: Platform[] = ['windows', 'macos', 'linux', 'android', 'ios', 'web'];
  const normalized = platform.toLowerCase() as Platform;

  if (validPlatforms.includes(normalized)) {
    return normalized;
  }

  return 'web'; // Default fallback
}

/**
 * Convert DiscoveredDevice to Device
 *
 * Transforms a locally discovered device into the standard Device format
 * used throughout the application.
 *
 * @param discovered - The discovered device from local network
 * @returns Standard Device object
 *
 * @example
 * ```typescript
 * const discoveredDevice = {
 *   id: 'device-123',
 *   name: 'John\'s Laptop',
 *   platform: 'windows',
 *   isOnline: true,
 *   lastSeen: new Date(),
 * };
 *
 * const device = discoveredDeviceToDevice(discoveredDevice);
 * // device.platform is safely typed as Platform
 * // device.lastSeen is a number (milliseconds)
 * ```
 */
export function discoveredDeviceToDevice(discovered: DiscoveredDevice): Device {
  return {
    id: discovered.id,
    name: discovered.name,
    platform: normalizePlatform(discovered.platform),
    ip: null,
    port: null,
    isOnline: discovered.isOnline,
    isFavorite: false,
    lastSeen: normalizeTimestamp(discovered.lastSeen),
    avatar: null,
  };
}

/**
 * Convert Friend to Device
 *
 * Transforms a friend record into a Device format for transfer operations.
 * Friends are always marked as favorites and use the 'web' platform.
 *
 * @param friend - The friend record from storage
 * @returns Standard Device object
 *
 * @example
 * ```typescript
 * const friend = {
 *   id: 'friend-456',
 *   name: 'Alice',
 *   trustLevel: 'trusted',
 *   lastConnected: Date.now(),
 *   avatar: 'https://example.com/avatar.jpg',
 * };
 *
 * const device = friendToDevice(friend);
 * // device.isOnline is true only if trustLevel is 'trusted'
 * // device.isFavorite is always true
 * ```
 */
export function friendToDevice(friend: Friend): Device {
  return {
    id: friend.id,
    name: friend.name,
    platform: 'web',
    ip: null,
    port: null,
    isOnline: friend.trustLevel === 'trusted',
    isFavorite: true,
    lastSeen: normalizeTimestamp(friend.lastConnected),
    avatar: friend.avatar || null,
  };
}

/**
 * Batch convert discovered devices to Device array
 *
 * Efficiently converts an array of discovered devices to standard Device format.
 * Filters out any invalid entries during conversion.
 *
 * @param devices - Array of discovered devices
 * @returns Array of standard Device objects
 *
 * @example
 * ```typescript
 * const discoveredDevices = getLocalDiscovery().getDevices();
 * const devices = convertDiscoveredDevices(discoveredDevices);
 *
 * // Use in React component with useMemo
 * const localDevices = useMemo(
 *   () => convertDiscoveredDevices(discoveredDevices),
 *   [discoveredDevices]
 * );
 * ```
 */
export function convertDiscoveredDevices(devices: DiscoveredDevice[]): Device[] {
  return devices
    .filter(device => device && device.id && device.name) // Filter invalid entries
    .map(discoveredDeviceToDevice);
}

/**
 * Batch convert friends to Device array
 *
 * Efficiently converts an array of friends to standard Device format.
 * Filters out any invalid entries during conversion.
 *
 * @param friends - Array of friend records
 * @returns Array of standard Device objects
 *
 * @example
 * ```typescript
 * const friends = getFriends();
 * const devices = convertFriendsToDevices(friends);
 *
 * // Use in React component with useMemo
 * const friendDevices = useMemo(
 *   () => convertFriendsToDevices(friends),
 *   [friends]
 * );
 * ```
 */
export function convertFriendsToDevices(friends: Friend[]): Device[] {
  return friends
    .filter(friend => friend && friend.id && friend.name) // Filter invalid entries
    .map(friendToDevice);
}

/**
 * Create a Device object from manual connection data
 *
 * Used when connecting to a device via IP address or connection code.
 *
 * @param id - Unique device identifier or connection code
 * @param name - Display name for the device
 * @param platform - Operating system platform
 * @returns Standard Device object
 *
 * @example
 * ```typescript
 * const device = createManualDevice('192.168.1.100', 'Device at 192.168.1.100');
 * const codeDevice = createManualDevice('ABC-123', 'Device ABC-123');
 * ```
 */
export function createManualDevice(
  id: string,
  name: string,
  platform: Platform = 'web'
): Device {
  return {
    id,
    name,
    platform,
    ip: null,
    port: null,
    isOnline: true,
    isFavorite: false,
    lastSeen: Date.now(),
    avatar: null,
  };
}

/**
 * Merge device arrays with deduplication
 *
 * Combines multiple device arrays, removing duplicates based on device ID.
 * Later entries override earlier ones if IDs match.
 *
 * @param deviceArrays - Variable number of device arrays to merge
 * @returns Deduplicated array of devices
 *
 * @example
 * ```typescript
 * const allDevices = mergeDevices(localDevices, friendDevices, manualDevices);
 * ```
 */
export function mergeDevices(...deviceArrays: Device[][]): Device[] {
  const deviceMap = new Map<string, Device>();

  for (const devices of deviceArrays) {
    for (const device of devices) {
      deviceMap.set(device.id, device);
    }
  }

  return Array.from(deviceMap.values());
}

/**
 * Filter online devices
 *
 * Returns only devices that are currently marked as online.
 *
 * @param devices - Array of devices to filter
 * @returns Array of online devices only
 */
export function filterOnlineDevices(devices: Device[]): Device[] {
  return devices.filter(device => device.isOnline);
}

/**
 * Filter favorite devices
 *
 * Returns only devices that are marked as favorites.
 *
 * @param devices - Array of devices to filter
 * @returns Array of favorite devices only
 */
export function filterFavoriteDevices(devices: Device[]): Device[] {
  return devices.filter(device => device.isFavorite);
}

/**
 * Sort devices by last seen (most recent first)
 *
 * @param devices - Array of devices to sort
 * @returns Sorted array (does not mutate original)
 */
export function sortDevicesByLastSeen(devices: Device[]): Device[] {
  return [...devices].sort((a, b) => b.lastSeen - a.lastSeen);
}

/**
 * Group devices by platform
 *
 * @param devices - Array of devices to group
 * @returns Map of platform to devices
 *
 * @example
 * ```typescript
 * const devicesByPlatform = groupDevicesByPlatform(allDevices);
 * const windowsDevices = devicesByPlatform.get('windows') || [];
 * ```
 */
export function groupDevicesByPlatform(devices: Device[]): Map<Platform, Device[]> {
  const grouped = new Map<Platform, Device[]>();

  for (const device of devices) {
    const existing = grouped.get(device.platform) || [];
    existing.push(device);
    grouped.set(device.platform, existing);
  }

  return grouped;
}
