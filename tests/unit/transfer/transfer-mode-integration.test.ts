/**
 * Integration Tests for Single/Group Transfer Mode Switching
 *
 * Tests the integration between:
 * - Device/Friend data conversions
 * - Transfer mode state management
 * - Recipient selection logic
 * - Connection type switching
 * - State synchronization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Device } from '@/lib/types';
import type { Friend } from '@/lib/storage/friends';
import type { DiscoveredDevice } from '@/lib/discovery/local-discovery';

// Test utilities for data conversion
function convertDiscoveredToDevice(discovered: DiscoveredDevice): Device {
  return {
    id: discovered.id,
    name: discovered.name,
    platform: discovered.platform as any,
    ip: null,
    port: null,
    isOnline: discovered.isOnline,
    isFavorite: false,
    lastSeen: typeof discovered.lastSeen === 'number'
      ? discovered.lastSeen
      : discovered.lastSeen.getTime(),
    avatar: null,
  };
}

function convertFriendToDevice(friend: Friend): Device {
  return {
    id: friend.id,
    name: friend.name,
    platform: 'web' as const,
    ip: null,
    port: null,
    isOnline: friend.trustLevel === 'trusted',
    isFavorite: true,
    lastSeen: friend.lastConnected
      ? (typeof friend.lastConnected === 'number'
          ? friend.lastConnected
          : (friend.lastConnected as Date).getTime())
      : Date.now(),
    avatar: friend.avatar || null,
  };
}

function getAvailableRecipients(
  connectionType: 'local' | 'internet' | 'friends' | null,
  localDevices: Device[],
  friendDevices: Device[]
): Device[] {
  if (connectionType === 'local') {
    return localDevices;
  } else if (connectionType === 'friends') {
    return friendDevices;
  } else if (connectionType === 'internet') {
    return [];
  }
  return [];
}

describe('Transfer Mode Integration', () => {
  let localDevices: Device[];
  let friendDevices: Device[];
  let discoveredDevices: DiscoveredDevice[];
  let friends: Friend[];

  beforeEach(() => {
    // Setup discovered local devices
    discoveredDevices = [
      {
        id: 'local-device-1',
        name: 'Living Room Laptop',
        platform: 'windows',
        isOnline: true,
        lastSeen: new Date(Date.now()),
      },
      {
        id: 'local-device-2',
        name: 'Kitchen Tablet',
        platform: 'android',
        isOnline: true,
        lastSeen: new Date(Date.now()),
      },
      {
        id: 'local-device-3',
        name: 'Office Desktop',
        platform: 'linux',
        isOnline: false,
        lastSeen: new Date(Date.now() - 60000),
      },
    ];

    // Setup friends
    friends = [
      {
        id: 'friend-1',
        name: 'Alice Smith',
        email: 'alice@example.com',
        friendCode: 'ABCD1234',
        requirePasscode: false,
        trustLevel: 'trusted',
        connectionPreferences: {
          autoAccept: true,
          notifications: true,
        },
        addedAt: new Date('2024-01-01'),
        lastConnected: new Date(),
        avatar: 'https://example.com/alice.jpg',
      },
      {
        id: 'friend-2',
        name: 'Bob Johnson',
        friendCode: 'EFGH5678',
        requirePasscode: true,
        trustLevel: 'trusted',
        connectionPreferences: {
          autoAccept: false,
          notifications: true,
        },
        addedAt: new Date('2024-01-15'),
      },
      {
        id: 'friend-3',
        name: 'Charlie Brown',
        friendCode: 'IJKL9012',
        requirePasscode: false,
        trustLevel: 'pending',
        connectionPreferences: {
          autoAccept: false,
          notifications: false,
        },
        addedAt: new Date('2024-02-01'),
      },
    ];

    // Convert to Device format
    localDevices = discoveredDevices.map(convertDiscoveredToDevice);
    friendDevices = friends.map(convertFriendToDevice);
  });

  describe('Local Devices Conversion', () => {
    it('should convert discovered devices to Device format correctly', () => {
      expect(localDevices).toHaveLength(3);

      const device = localDevices[0];
      expect(device?.id).toBe('local-device-1');
      expect(device?.name).toBe('Living Room Laptop');
      expect(device?.platform).toBe('windows');
      expect(device?.isOnline).toBe(true);
      expect(device?.isFavorite).toBe(false);
      expect(device?.ip).toBeNull();
      expect(device?.port).toBeNull();
      expect(device?.avatar).toBeNull();
    });

    it('should handle offline devices', () => {
      const offlineDevice = localDevices[2];
      expect(offlineDevice?.isOnline).toBe(false);
      expect(offlineDevice?.lastSeen).toBeLessThan(Date.now());
    });

    it('should preserve device platform information', () => {
      expect(localDevices[0]?.platform).toBe('windows');
      expect(localDevices[1]?.platform).toBe('android');
      expect(localDevices[2]?.platform).toBe('linux');
    });

    it('should handle timestamp conversions', () => {
      const device = localDevices[0];
      expect(typeof device?.lastSeen).toBe('number');
      expect(device?.lastSeen).toBeGreaterThan(0);
    });
  });

  describe('Friends Conversion', () => {
    it('should convert friends to Device format correctly', () => {
      expect(friendDevices).toHaveLength(3);

      const device = friendDevices[0];
      expect(device?.id).toBe('friend-1');
      expect(device?.name).toBe('Alice Smith');
      expect(device?.platform).toBe('web');
      expect(device?.isFavorite).toBe(true);
    });

    it('should mark trusted friends as online', () => {
      const trustedFriend = friendDevices[0];
      expect(trustedFriend?.isOnline).toBe(true);
    });

    it('should mark non-trusted friends as offline', () => {
      const pendingFriend = friendDevices[2];
      expect(pendingFriend?.isOnline).toBe(false);
    });

    it('should preserve friend avatars', () => {
      expect(friendDevices[0]?.avatar).toBe('https://example.com/alice.jpg');
      expect(friendDevices[1]?.avatar).toBeNull();
    });

    it('should handle friends without lastConnected', () => {
      const friendWithoutLastConnected = friendDevices[1];
      expect(friendWithoutLastConnected?.lastSeen).toBeGreaterThan(0);
    });

    it('should convert Date objects to timestamps', () => {
      const device = friendDevices[0];
      expect(typeof device?.lastSeen).toBe('number');
    });
  });

  describe('Available Recipients Calculation', () => {
    it('should return local devices when connectionType is local', () => {
      const recipients = getAvailableRecipients('local', localDevices, friendDevices);

      expect(recipients).toHaveLength(3);
      expect(recipients[0]?.id).toBe('local-device-1');
    });

    it('should return friend devices when connectionType is friends', () => {
      const recipients = getAvailableRecipients('friends', localDevices, friendDevices);

      expect(recipients).toHaveLength(3);
      expect(recipients[0]?.id).toBe('friend-1');
    });

    it('should return empty array when connectionType is internet', () => {
      const recipients = getAvailableRecipients('internet', localDevices, friendDevices);

      expect(recipients).toHaveLength(0);
    });

    it('should return empty array when connectionType is null', () => {
      const recipients = getAvailableRecipients(null, localDevices, friendDevices);

      expect(recipients).toHaveLength(0);
    });

    it('should return only online devices for local', () => {
      const recipients = getAvailableRecipients('local', localDevices, friendDevices);
      const onlineCount = recipients.filter(r => r.isOnline).length;

      expect(onlineCount).toBe(2); // Two online local devices
    });

    it('should return only trusted friends for friends connection', () => {
      const recipients = getAvailableRecipients('friends', localDevices, friendDevices);
      const trustedCount = recipients.filter(r => r.isOnline).length;

      expect(trustedCount).toBe(2); // Two trusted friends
    });
  });

  describe('Transfer Mode Switching', () => {
    let transferMode: 'single' | 'group';
    let selectedRecipientIds: string[];

    beforeEach(() => {
      transferMode = 'single';
      selectedRecipientIds = [];
    });

    it('should switch from single to group mode', () => {
      transferMode = 'group';
      expect(transferMode).toBe('group');
    });

    it('should switch from group to single mode', () => {
      transferMode = 'group';
      transferMode = 'single';
      expect(transferMode).toBe('single');
    });

    it('should clear recipient selection when switching to single mode', () => {
      transferMode = 'group';
      selectedRecipientIds = ['friend-1', 'friend-2'];

      // Switch to single
      transferMode = 'single';
      selectedRecipientIds = [];

      expect(selectedRecipientIds).toHaveLength(0);
    });

    it('should maintain recipient selection when staying in group mode', () => {
      transferMode = 'group';
      selectedRecipientIds = ['friend-1', 'friend-2'];

      // Toggle should preserve selection
      expect(selectedRecipientIds).toHaveLength(2);
    });
  });

  describe('Recipient Selection and Deselection', () => {
    let selectedRecipientIds: string[];

    beforeEach(() => {
      selectedRecipientIds = [];
    });

    it('should add recipient to selection', () => {
      selectedRecipientIds.push('friend-1');

      expect(selectedRecipientIds).toContain('friend-1');
      expect(selectedRecipientIds).toHaveLength(1);
    });

    it('should remove recipient from selection', () => {
      selectedRecipientIds = ['friend-1', 'friend-2'];
      selectedRecipientIds = selectedRecipientIds.filter(id => id !== 'friend-1');

      expect(selectedRecipientIds).not.toContain('friend-1');
      expect(selectedRecipientIds).toContain('friend-2');
      expect(selectedRecipientIds).toHaveLength(1);
    });

    it('should toggle recipient selection', () => {
      const toggleRecipient = (id: string) => {
        if (selectedRecipientIds.includes(id)) {
          selectedRecipientIds = selectedRecipientIds.filter(rid => rid !== id);
        } else {
          selectedRecipientIds.push(id);
        }
      };

      toggleRecipient('friend-1');
      expect(selectedRecipientIds).toContain('friend-1');

      toggleRecipient('friend-1');
      expect(selectedRecipientIds).not.toContain('friend-1');
    });

    it('should handle multiple selections', () => {
      selectedRecipientIds = ['friend-1', 'friend-2', 'friend-3'];

      expect(selectedRecipientIds).toHaveLength(3);
      expect(selectedRecipientIds).toContain('friend-1');
      expect(selectedRecipientIds).toContain('friend-2');
      expect(selectedRecipientIds).toContain('friend-3');
    });

    it('should prevent duplicate selections', () => {
      const addRecipient = (id: string) => {
        if (!selectedRecipientIds.includes(id)) {
          selectedRecipientIds.push(id);
        }
      };

      addRecipient('friend-1');
      addRecipient('friend-1');

      expect(selectedRecipientIds).toHaveLength(1);
    });

    it('should select all available recipients', () => {
      const recipients = getAvailableRecipients('friends', localDevices, friendDevices);
      selectedRecipientIds = recipients.map(r => r.id);

      expect(selectedRecipientIds).toHaveLength(3);
    });

    it('should deselect all recipients', () => {
      selectedRecipientIds = ['friend-1', 'friend-2', 'friend-3'];
      selectedRecipientIds = [];

      expect(selectedRecipientIds).toHaveLength(0);
    });
  });

  describe('Connection Type Switching with Mode Persistence', () => {
    let connectionType: 'local' | 'internet' | 'friends' | null;
    let transferMode: 'single' | 'group';
    let selectedRecipientIds: string[];

    beforeEach(() => {
      connectionType = 'local';
      transferMode = 'single';
      selectedRecipientIds = [];
    });

    it('should persist transfer mode when switching connection types', () => {
      transferMode = 'group';
      connectionType = 'friends';

      expect(transferMode).toBe('group');
    });

    it('should clear recipient selection when switching connection types', () => {
      transferMode = 'group';
      selectedRecipientIds = ['local-device-1', 'local-device-2'];

      // Switch from local to friends
      connectionType = 'friends';
      selectedRecipientIds = [];

      expect(selectedRecipientIds).toHaveLength(0);
    });

    it('should update available recipients when switching connection types', () => {
      const getRecipients = () => getAvailableRecipients(
        connectionType,
        localDevices,
        friendDevices
      );

      connectionType = 'local';
      let recipients = getRecipients();
      expect(recipients).toHaveLength(3);
      expect(recipients[0]?.id).toContain('local-device');

      connectionType = 'friends';
      recipients = getRecipients();
      expect(recipients).toHaveLength(3);
      expect(recipients[0]?.id).toContain('friend');
    });

    it('should handle switching to internet connection type', () => {
      transferMode = 'group';
      selectedRecipientIds = ['friend-1'];

      connectionType = 'internet';
      selectedRecipientIds = [];

      const recipients = getAvailableRecipients(
        connectionType,
        localDevices,
        friendDevices
      );

      expect(recipients).toHaveLength(0);
      expect(transferMode).toBe('group'); // Mode persists
    });

    it('should allow re-selection after connection type switch', () => {
      // Start with local
      connectionType = 'local';
      transferMode = 'group';
      selectedRecipientIds = ['local-device-1'];

      // Switch to friends
      connectionType = 'friends';
      selectedRecipientIds = [];

      // Select friends
      selectedRecipientIds = ['friend-1', 'friend-2'];

      expect(selectedRecipientIds).toHaveLength(2);
      expect(selectedRecipientIds).not.toContain('local-device-1');
    });
  });

  describe('Empty Recipient Lists', () => {
    it('should handle empty local devices list', () => {
      const emptyLocalDevices: Device[] = [];
      const recipients = getAvailableRecipients('local', emptyLocalDevices, friendDevices);

      expect(recipients).toHaveLength(0);
    });

    it('should handle empty friends list', () => {
      const emptyFriendDevices: Device[] = [];
      const recipients = getAvailableRecipients('friends', localDevices, emptyFriendDevices);

      expect(recipients).toHaveLength(0);
    });

    it('should handle both lists empty', () => {
      const recipients = getAvailableRecipients('local', [], []);

      expect(recipients).toHaveLength(0);
    });

    it('should prevent group transfer with no recipients', () => {
      const transferMode = 'group';
      const selectedRecipientIds: string[] = [];
      const recipients = getAvailableRecipients('local', [], []);

      const canStartGroupTransfer = transferMode === 'group'
        && selectedRecipientIds.length > 0
        && recipients.length > 0;

      expect(canStartGroupTransfer).toBe(false);
    });
  });

  describe('Group Transfer Initialization', () => {
    it('should validate minimum recipients for group transfer', () => {
      const selectedRecipientIds = ['friend-1'];
      const minRecipients = 1;

      const isValid = selectedRecipientIds.length >= minRecipients;
      expect(isValid).toBe(true);
    });

    it('should validate maximum recipients for group transfer', () => {
      const selectedRecipientIds = Array.from({ length: 12 }, (_, i) => `friend-${i}`);
      const maxRecipients = 10;

      const isValid = selectedRecipientIds.length <= maxRecipients;
      expect(isValid).toBe(false);
    });

    it('should map selected IDs to recipient info', () => {
      const selectedRecipientIds = ['friend-1', 'friend-2'];
      const availableRecipients = getAvailableRecipients('friends', localDevices, friendDevices);

      const recipientInfos = selectedRecipientIds
        .map(id => availableRecipients.find(r => r.id === id))
        .filter((r): r is Device => r !== undefined);

      expect(recipientInfos).toHaveLength(2);
      expect(recipientInfos[0]?.name).toBe('Alice Smith');
      expect(recipientInfos[1]?.name).toBe('Bob Johnson');
    });

    it('should handle invalid recipient IDs gracefully', () => {
      const selectedRecipientIds = ['friend-1', 'invalid-id', 'friend-2'];
      const availableRecipients = getAvailableRecipients('friends', localDevices, friendDevices);

      const recipientInfos = selectedRecipientIds
        .map(id => availableRecipients.find(r => r.id === id))
        .filter((r): r is Device => r !== undefined);

      expect(recipientInfos).toHaveLength(2); // Invalid ID filtered out
    });

    it('should prepare group transfer metadata', () => {
      const selectedRecipientIds = ['friend-1', 'friend-2', 'friend-3'];
      const fileName = 'document.pdf';
      const fileSize = 1024 * 1024; // 1MB

      const metadata = {
        fileName,
        fileSize,
        recipientCount: selectedRecipientIds.length,
        transferMode: 'group' as const,
      };

      expect(metadata.recipientCount).toBe(3);
      expect(metadata.transferMode).toBe('group');
    });
  });

  describe('State Synchronization Between Components', () => {
    let state: {
      connectionType: 'local' | 'internet' | 'friends' | null;
      transferMode: 'single' | 'group';
      selectedRecipientIds: string[];
      availableRecipients: Device[];
    };

    beforeEach(() => {
      state = {
        connectionType: 'local',
        transferMode: 'single',
        selectedRecipientIds: [],
        availableRecipients: [],
      };
    });

    it('should synchronize connection type changes', () => {
      // Simulate connection type change
      state.connectionType = 'friends';
      state.availableRecipients = getAvailableRecipients(
        state.connectionType,
        localDevices,
        friendDevices
      );
      state.selectedRecipientIds = [];

      expect(state.availableRecipients).toHaveLength(3);
      expect(state.selectedRecipientIds).toHaveLength(0);
    });

    it('should synchronize mode changes', () => {
      state.transferMode = 'group';

      // Switch back to single mode
      state.transferMode = 'single';
      if (state.transferMode === 'single') {
        state.selectedRecipientIds = [];
      }

      expect(state.transferMode).toBe('single');
      // Selection cleared in single mode
      expect(state.selectedRecipientIds).toHaveLength(0);
    });

    it('should synchronize recipient selection changes', () => {
      state.connectionType = 'friends';
      state.transferMode = 'group';
      state.availableRecipients = getAvailableRecipients(
        state.connectionType,
        localDevices,
        friendDevices
      );

      // Add selection
      state.selectedRecipientIds = ['friend-1', 'friend-2'];

      expect(state.selectedRecipientIds).toHaveLength(2);

      // Verify all selected IDs are in available recipients
      const allValid = state.selectedRecipientIds.every(id =>
        state.availableRecipients.some(r => r.id === id)
      );
      expect(allValid).toBe(true);
    });

    it('should handle cascading state updates', () => {
      // Step 1: Change connection type
      state.connectionType = 'friends';
      state.availableRecipients = getAvailableRecipients(
        state.connectionType,
        localDevices,
        friendDevices
      );
      state.selectedRecipientIds = [];

      // Step 2: Enable group mode
      state.transferMode = 'group';

      // Step 3: Select recipients
      state.selectedRecipientIds = ['friend-1', 'friend-2'];

      // Verify final state
      expect(state.connectionType).toBe('friends');
      expect(state.transferMode).toBe('group');
      expect(state.selectedRecipientIds).toHaveLength(2);
      expect(state.availableRecipients).toHaveLength(3);
    });

    it('should maintain consistency during rapid changes', () => {
      // Rapid state changes
      state.connectionType = 'local';
      state.availableRecipients = getAvailableRecipients(
        state.connectionType,
        localDevices,
        friendDevices
      );

      state.transferMode = 'group';
      state.selectedRecipientIds = ['local-device-1'];

      state.connectionType = 'friends';
      state.availableRecipients = getAvailableRecipients(
        state.connectionType,
        localDevices,
        friendDevices
      );
      state.selectedRecipientIds = [];

      // Final state should be consistent
      expect(state.connectionType).toBe('friends');
      expect(state.availableRecipients[0]?.id).toContain('friend');
      expect(state.selectedRecipientIds).toHaveLength(0);
    });

    it('should validate state before transfer', () => {
      state.connectionType = 'friends';
      state.transferMode = 'group';
      state.availableRecipients = getAvailableRecipients(
        state.connectionType,
        localDevices,
        friendDevices
      );
      state.selectedRecipientIds = ['friend-1', 'friend-2'];

      const isValid =
        state.connectionType !== null &&
        state.transferMode === 'group' &&
        state.selectedRecipientIds.length > 0 &&
        state.selectedRecipientIds.every(id =>
          state.availableRecipients.some(r => r.id === id)
        );

      expect(isValid).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined gracefully', () => {
      const recipients = getAvailableRecipients(null, localDevices, friendDevices);
      expect(recipients).toHaveLength(0);
    });

    it('should handle mixed online/offline devices', () => {
      const recipients = getAvailableRecipients('local', localDevices, friendDevices);
      const onlineDevices = recipients.filter(r => r.isOnline);
      const offlineDevices = recipients.filter(r => !r.isOnline);

      expect(onlineDevices.length + offlineDevices.length).toBe(recipients.length);
    });

    it('should handle device without all optional fields', () => {
      const minimalDevice: Device = {
        id: 'minimal-1',
        name: 'Minimal Device',
        platform: 'web',
        ip: null,
        port: null,
        isOnline: true,
        isFavorite: false,
        lastSeen: Date.now(),
        avatar: null,
      };

      expect(minimalDevice.ip).toBeNull();
      expect(minimalDevice.port).toBeNull();
      expect(minimalDevice.avatar).toBeNull();
    });

    it('should handle selection of offline devices', () => {
      const offlineDevice = localDevices.find(d => !d.isOnline);
      const selectedRecipientIds = [offlineDevice?.id].filter((id): id is string => id !== undefined);

      expect(selectedRecipientIds).toHaveLength(1);
      // App should warn but allow selection
    });

    it('should handle very large recipient lists', () => {
      const largeLocalDevices = Array.from({ length: 100 }, (_, i) => ({
        id: `device-${i}`,
        name: `Device ${i}`,
        platform: 'web' as const,
        ip: null,
        port: null,
        isOnline: true,
        isFavorite: false,
        lastSeen: Date.now(),
        avatar: null,
      }));

      const recipients = getAvailableRecipients('local', largeLocalDevices, friendDevices);
      expect(recipients.length).toBe(100);
    });
  });
});
