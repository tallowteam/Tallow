/**
 * Unit Tests for Device Converters
 *
 * Comprehensive test suite for device conversion utilities.
 * Demonstrates best practices for testing transformation functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  discoveredDeviceToDevice,
  friendToDevice,
  convertDiscoveredDevices,
  convertFriendsToDevices,
  createManualDevice,
  mergeDevices,
  filterOnlineDevices,
  filterFavoriteDevices,
  sortDevicesByLastSeen,
  groupDevicesByPlatform,
} from '@/lib/utils/device-converters';
import type { Device } from '@/lib/types';
import type { DiscoveredDevice } from '@/lib/discovery/local-discovery';
import type { Friend } from '@/lib/storage/friends';

describe('device-converters', () => {
  describe('discoveredDeviceToDevice', () => {
    it('should convert discovered device with Date timestamp', () => {
      const discovered: DiscoveredDevice = {
        id: 'device-123',
        name: 'Test Device',
        platform: 'windows',
        isOnline: true,
        lastSeen: new Date('2026-01-27T10:00:00.000Z'),
      };

      const result = discoveredDeviceToDevice(discovered);

      expect(result).toEqual({
        id: 'device-123',
        name: 'Test Device',
        platform: 'windows',
        ip: null,
        port: null,
        isOnline: true,
        isFavorite: false,
        lastSeen: new Date('2026-01-27T10:00:00.000Z').getTime(),
        avatar: '',
      });
    });

    it('should convert discovered device with numeric timestamp', () => {
      const timestamp = new Date(1706400000000);
      const discovered: DiscoveredDevice = {
        id: 'device-456',
        name: 'Mobile Device',
        platform: 'android',
        isOnline: false,
        lastSeen: timestamp,
      };

      const result = discoveredDeviceToDevice(discovered);

      expect(result.lastSeen).toBe(timestamp.getTime());
      expect(result.isOnline).toBe(false);
    });

    it('should handle old timestamp', () => {
      const oldDate = new Date(Date.now() - 3600000); // 1 hour ago
      const discovered: DiscoveredDevice = {
        id: 'device-789',
        name: 'Offline Device',
        platform: 'ios',
        isOnline: false,
        lastSeen: oldDate,
      };

      const before = Date.now();
      const result = discoveredDeviceToDevice(discovered);
      const after = Date.now();

      expect(result.lastSeen).toBeGreaterThanOrEqual(before);
      expect(result.lastSeen).toBeLessThanOrEqual(after);
    });

    it('should normalize invalid platform to web', () => {
      const discovered: DiscoveredDevice = {
        id: 'device-999',
        name: 'Unknown Device',
        platform: 'invalid-platform' as any,
        isOnline: true,
        lastSeen: new Date(),
      };

      const result = discoveredDeviceToDevice(discovered);

      expect(result.platform).toBe('web');
    });

    it('should normalize case-insensitive platform names', () => {
      const discovered: DiscoveredDevice = {
        id: 'device-888',
        name: 'Case Device',
        platform: 'WINDOWS' as any,
        isOnline: true,
        lastSeen: new Date(),
      };

      const result = discoveredDeviceToDevice(discovered);

      expect(result.platform).toBe('windows');
    });
  });

  describe('friendToDevice', () => {
    it('should convert trusted friend to online device', () => {
      const friend: Friend = {
        id: 'friend-123',
        name: 'John Doe',
        friendCode: 'code123',
        requirePasscode: false,
        trustLevel: 'trusted',
        connectionPreferences: {
          autoAccept: true,
          notifications: true,
        },
        addedAt: new Date('2026-01-01T00:00:00.000Z'),
        publicKey: 'key123',
        lastConnected: new Date('2026-01-27T10:00:00.000Z'),
        avatar: 'https://example.com/avatar.jpg',
      };

      const result = friendToDevice(friend);

      expect(result).toEqual({
        id: 'friend-123',
        name: 'John Doe',
        platform: 'web',
        ip: null,
        port: null,
        isOnline: true,
        isFavorite: true,
        lastSeen: new Date('2026-01-27T10:00:00.000Z').getTime(),
        avatar: 'https://example.com/avatar.jpg',
      });
    });

    it('should convert untrusted friend to offline device', () => {
      const friend: Friend = {
        id: 'friend-456',
        name: 'Jane Smith',
        friendCode: 'code456',
        requirePasscode: false,
        trustLevel: 'pending',
        connectionPreferences: {
          autoAccept: false,
          notifications: true,
        },
        addedAt: new Date(),
        publicKey: 'key456',
        lastConnected: new Date(),
        avatar: '',
      };

      const result = friendToDevice(friend);

      expect(result.isOnline).toBe(false);
      expect(result.isFavorite).toBe(true);
    });

    it('should handle friend without avatar', () => {
      const friend: Friend = {
        id: 'friend-789',
        name: 'Bob Wilson',
        friendCode: 'code789',
        requirePasscode: false,
        trustLevel: 'trusted',
        connectionPreferences: {
          autoAccept: true,
          notifications: true,
        },
        addedAt: new Date(),
        publicKey: 'key789',
        lastConnected: new Date(),
      };

      const result = friendToDevice(friend);

      expect(result.avatar).toBeNull();
    });

    it('should handle friend without lastConnected timestamp', () => {
      const friend: Friend = {
        id: 'friend-999',
        name: 'Alice Johnson',
        friendCode: 'code999',
        requirePasscode: false,
        trustLevel: 'trusted',
        connectionPreferences: {
          autoAccept: true,
          notifications: true,
        },
        addedAt: new Date('2026-01-01T00:00:00.000Z'),
        publicKey: 'key999',
        avatar: '',
      };

      const before = Date.now();
      const result = friendToDevice(friend);
      const after = Date.now();

      expect(result.lastSeen).toBeGreaterThanOrEqual(before);
      expect(result.lastSeen).toBeLessThanOrEqual(after);
    });
  });

  describe('convertDiscoveredDevices', () => {
    it('should convert array of discovered devices', () => {
      const devices: DiscoveredDevice[] = [
        {
          id: 'device-1',
          name: 'Device 1',
          platform: 'windows',
          isOnline: true,
          lastSeen: new Date(),
        },
        {
          id: 'device-2',
          name: 'Device 2',
          platform: 'macos',
          isOnline: false,
          lastSeen: new Date(),
        },
      ];

      const result = convertDiscoveredDevices(devices);

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('device-1');
      expect(result[1]?.id).toBe('device-2');
      expect(result[0]?.isFavorite).toBe(false);
      expect(result[1]?.isFavorite).toBe(false);
    });

    it('should filter out invalid devices', () => {
      const devices: DiscoveredDevice[] = [
        {
          id: 'device-1',
          name: 'Valid Device',
          platform: 'windows',
          isOnline: true,
          lastSeen: new Date(),
        },
        {
          id: '',
          name: 'Invalid ID',
          platform: 'macos',
          isOnline: true,
          lastSeen: new Date(),
        } as any,
        {
          id: 'device-3',
          name: '',
          platform: 'linux',
          isOnline: true,
          lastSeen: new Date(),
        } as any,
        null as any,
        undefined as any,
      ];

      const result = convertDiscoveredDevices(devices);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('device-1');
    });

    it('should handle empty array', () => {
      const result = convertDiscoveredDevices([]);
      expect(result).toEqual([]);
    });
  });

  describe('convertFriendsToDevices', () => {
    it('should convert array of friends', () => {
      const friends: Friend[] = [
        {
          id: 'friend-1',
          name: 'Friend 1',
          friendCode: 'code1',
          requirePasscode: false,
          trustLevel: 'trusted',
          connectionPreferences: {
            autoAccept: true,
            notifications: true,
          },
          addedAt: new Date(),
          publicKey: 'key1',
          lastConnected: new Date(),
          avatar: '',
        },
        {
          id: 'friend-2',
          name: 'Friend 2',
          friendCode: 'code2',
          requirePasscode: false,
          trustLevel: 'pending',
          connectionPreferences: {
            autoAccept: false,
            notifications: true,
          },
          addedAt: new Date(),
          publicKey: 'key2',
          lastConnected: new Date(),
          avatar: 'avatar.jpg',
        },
      ];

      const result = convertFriendsToDevices(friends);

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('friend-1');
      expect(result[0]?.isOnline).toBe(true);
      expect(result[1]?.id).toBe('friend-2');
      expect(result[1]?.isOnline).toBe(false);
      expect(result[0]?.isFavorite).toBe(true);
      expect(result[1]?.isFavorite).toBe(true);
    });

    it('should filter out invalid friends', () => {
      const friends: Friend[] = [
        {
          id: 'friend-1',
          name: 'Valid Friend',
          friendCode: 'code1',
          requirePasscode: false,
          trustLevel: 'trusted',
          connectionPreferences: {
            autoAccept: true,
            notifications: true,
          },
          addedAt: new Date(),
          publicKey: 'key1',
          lastConnected: new Date(),
          avatar: '',
        },
        {
          id: '',
          name: 'Invalid ID',
          trustLevel: 'trusted',
          publicKey: 'key2',
          lastConnected: Date.now(),
          avatar: '',
          verificationStatus: 'verified',
          sharedSecrets: [],
        } as any,
        null as any,
      ];

      const result = convertFriendsToDevices(friends);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('friend-1');
    });
  });

  describe('createManualDevice', () => {
    it('should create device with default platform', () => {
      const result = createManualDevice('192.168.1.100', 'Manual Device');

      expect(result).toMatchObject({
        id: '192.168.1.100',
        name: 'Manual Device',
        platform: 'web',
        ip: null,
        port: null,
        isOnline: true,
        isFavorite: false,
        avatar: '',
      });
      expect(result.lastSeen).toBeGreaterThan(0);
    });

    it('should create device with custom platform', () => {
      const result = createManualDevice('code-123', 'Device ABC', 'android');

      expect(result.platform).toBe('android');
    });
  });

  describe('mergeDevices', () => {
    let localDevices: Device[];
    let friendDevices: Device[];

    beforeEach(() => {
      localDevices = [
        {
          id: 'device-1',
          name: 'Local 1',
          platform: 'windows',
          ip: null,
          port: null,
          isOnline: true,
          isFavorite: false,
          lastSeen: 1000,
          avatar: '',
        },
        {
          id: 'device-2',
          name: 'Local 2',
          platform: 'macos',
          ip: null,
          port: null,
          isOnline: false,
          isFavorite: false,
          lastSeen: 2000,
          avatar: '',
        },
      ];

      friendDevices = [
        {
          id: 'friend-1',
          name: 'Friend 1',
          platform: 'web',
          ip: null,
          port: null,
          isOnline: true,
          isFavorite: true,
          lastSeen: 3000,
          avatar: '',
        },
      ];
    });

    it('should merge multiple device arrays', () => {
      const result = mergeDevices(localDevices, friendDevices);

      expect(result).toHaveLength(3);
      expect(result.map(d => d.id)).toEqual(['device-1', 'device-2', 'friend-1']);
    });

    it('should deduplicate by ID (last wins)', () => {
      const updatedDevice: Device = {
        ...localDevices[0]!,
        name: 'Updated Name',
      };

      const result = mergeDevices(localDevices, [updatedDevice]);

      expect(result).toHaveLength(2);
      const merged = result.find(d => d.id === 'device-1');
      expect(merged?.name).toBe('Updated Name');
    });

    it('should handle empty arrays', () => {
      const result = mergeDevices([], [], localDevices);
      expect(result).toHaveLength(2);
    });
  });

  describe('filterOnlineDevices', () => {
    it('should filter only online devices', () => {
      const devices: Device[] = [
        createManualDevice('1', 'Online 1'),
        { ...createManualDevice('2', 'Offline'), isOnline: false },
        createManualDevice('3', 'Online 2'),
      ];

      const result = filterOnlineDevices(devices);

      expect(result).toHaveLength(2);
      expect(result.every(d => d.isOnline)).toBe(true);
    });

    it('should return empty array if no online devices', () => {
      const devices: Device[] = [
        { ...createManualDevice('1', 'Offline 1'), isOnline: false },
        { ...createManualDevice('2', 'Offline 2'), isOnline: false },
      ];

      const result = filterOnlineDevices(devices);
      expect(result).toEqual([]);
    });
  });

  describe('filterFavoriteDevices', () => {
    it('should filter only favorite devices', () => {
      const devices: Device[] = [
        { ...createManualDevice('1', 'Fav 1'), isFavorite: true },
        createManualDevice('2', 'Not Fav'),
        { ...createManualDevice('3', 'Fav 2'), isFavorite: true },
      ];

      const result = filterFavoriteDevices(devices);

      expect(result).toHaveLength(2);
      expect(result.every(d => d.isFavorite)).toBe(true);
    });
  });

  describe('sortDevicesByLastSeen', () => {
    it('should sort devices by last seen (most recent first)', () => {
      const devices: Device[] = [
        { ...createManualDevice('1', 'Old'), lastSeen: 1000 },
        { ...createManualDevice('2', 'Recent'), lastSeen: 3000 },
        { ...createManualDevice('3', 'Middle'), lastSeen: 2000 },
      ];

      const result = sortDevicesByLastSeen(devices);

      expect(result.map(d => d.lastSeen)).toEqual([3000, 2000, 1000]);
      expect(result.map(d => d.name)).toEqual(['Recent', 'Middle', 'Old']);
    });

    it('should not mutate original array', () => {
      const devices: Device[] = [
        { ...createManualDevice('1', 'A'), lastSeen: 1000 },
        { ...createManualDevice('2', 'B'), lastSeen: 2000 },
      ];

      const original = [...devices];
      sortDevicesByLastSeen(devices);

      expect(devices).toEqual(original);
    });
  });

  describe('groupDevicesByPlatform', () => {
    it('should group devices by platform', () => {
      const devices: Device[] = [
        { ...createManualDevice('1', 'Win 1'), platform: 'windows' },
        { ...createManualDevice('2', 'Mac 1'), platform: 'macos' },
        { ...createManualDevice('3', 'Win 2'), platform: 'windows' },
        { ...createManualDevice('4', 'Android'), platform: 'android' },
      ];

      const result = groupDevicesByPlatform(devices);

      expect(result.size).toBe(3);
      expect(result.get('windows')).toHaveLength(2);
      expect(result.get('macos')).toHaveLength(1);
      expect(result.get('android')).toHaveLength(1);
      expect(result.get('ios')).toBeUndefined();
    });

    it('should handle empty array', () => {
      const result = groupDevicesByPlatform([]);
      expect(result.size).toBe(0);
    });
  });
});
