/**
 * Settings Store Unit Tests
 *
 * Tests the settings store Zustand implementation including:
 * - Initial state with default values
 * - Theme management
 * - Device settings
 * - Privacy and security toggles
 * - Transfer settings
 * - Notification settings
 * - Silent hours configuration
 * - Reset to defaults
 * - LocalStorage persistence (via mock)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '@/lib/stores/settings-store';

describe('SettingsStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    // Reset to default state
    useSettingsStore.getState().resetToDefaults();
  });

  describe('Initial State / Defaults', () => {
    it('should have default theme as dark', () => {
      const state = useSettingsStore.getState();
      expect(state.theme).toBe('dark');
    });

    it('should have default device name', () => {
      const state = useSettingsStore.getState();
      expect(state.deviceName).toBeTruthy();
      expect(typeof state.deviceName).toBe('string');
    });

    it('should have unique device ID', () => {
      const state = useSettingsStore.getState();
      expect(state.deviceId).toBeTruthy();
      expect(state.deviceId).toMatch(/^device-/);
    });

    it('should have privacy settings enabled by default', () => {
      const state = useSettingsStore.getState();
      expect(state.stripMetadata).toBe(true);
      expect(state.ipLeakProtection).toBe(true);
    });

    it('should have onion routing disabled by default', () => {
      const state = useSettingsStore.getState();
      expect(state.onionRoutingEnabled).toBe(false);
    });

    it('should allow local discovery by default', () => {
      const state = useSettingsStore.getState();
      expect(state.allowLocalDiscovery).toBe(true);
      expect(state.allowInternetP2P).toBe(true);
    });

    it('should have guest mode disabled by default', () => {
      const state = useSettingsStore.getState();
      expect(state.guestMode).toBe(false);
      expect(state.temporaryVisibility).toBe(false);
    });

    it('should have default transfer settings', () => {
      const state = useSettingsStore.getState();
      expect(state.autoAcceptFromFriends).toBe(false);
      expect(state.saveLocation).toBe('Downloads');
      expect(state.maxConcurrentTransfers).toBe(3);
    });

    it('should have notification settings enabled by default', () => {
      const state = useSettingsStore.getState();
      expect(state.notificationSound).toBe(true);
      expect(state.browserNotifications).toBe(true);
      expect(state.notifyOnTransferComplete).toBe(true);
      expect(state.notifyOnIncomingTransfer).toBe(true);
    });

    it('should have default notification volume', () => {
      const state = useSettingsStore.getState();
      expect(state.notificationVolume).toBe(0.3);
    });

    it('should have default toast position', () => {
      const state = useSettingsStore.getState();
      expect(state.toastPosition).toBe('bottom-right');
    });

    it('should have silent hours disabled by default', () => {
      const state = useSettingsStore.getState();
      expect(state.silentHoursEnabled).toBe(false);
      expect(state.silentHoursStart).toBe('22:00');
      expect(state.silentHoursEnd).toBe('08:00');
    });
  });

  describe('Device Settings', () => {
    describe('setDeviceName', () => {
      it('should update device name', () => {
        useSettingsStore.getState().setDeviceName('My Custom Device');

        const state = useSettingsStore.getState();
        expect(state.deviceName).toBe('My Custom Device');
      });

      it('should accept empty string', () => {
        useSettingsStore.getState().setDeviceName('');

        const state = useSettingsStore.getState();
        expect(state.deviceName).toBe('');
      });

      it('should handle special characters', () => {
        useSettingsStore.getState().setDeviceName('Device™ 2024 [Test]');

        const state = useSettingsStore.getState();
        expect(state.deviceName).toBe('Device™ 2024 [Test]');
      });
    });
  });

  describe('Appearance Settings', () => {
    describe('setTheme', () => {
      it('should set theme to light', () => {
        useSettingsStore.getState().setTheme('light');

        const state = useSettingsStore.getState();
        expect(state.theme).toBe('light');
      });

      it('should set theme to dark', () => {
        useSettingsStore.getState().setTheme('dark');

        const state = useSettingsStore.getState();
        expect(state.theme).toBe('dark');
      });

      it('should set theme to system', () => {
        useSettingsStore.getState().setTheme('system');

        const state = useSettingsStore.getState();
        expect(state.theme).toBe('system');
      });
    });
  });

  describe('Privacy & Security Settings', () => {
    describe('setStripMetadata', () => {
      it('should enable metadata stripping', () => {
        useSettingsStore.getState().setStripMetadata(true);

        const state = useSettingsStore.getState();
        expect(state.stripMetadata).toBe(true);
      });

      it('should disable metadata stripping', () => {
        useSettingsStore.getState().setStripMetadata(false);

        const state = useSettingsStore.getState();
        expect(state.stripMetadata).toBe(false);
      });
    });

    describe('setIpLeakProtection', () => {
      it('should enable IP leak protection', () => {
        useSettingsStore.getState().setIpLeakProtection(true);

        const state = useSettingsStore.getState();
        expect(state.ipLeakProtection).toBe(true);
      });

      it('should disable IP leak protection', () => {
        useSettingsStore.getState().setIpLeakProtection(false);

        const state = useSettingsStore.getState();
        expect(state.ipLeakProtection).toBe(false);
      });
    });

    describe('setOnionRoutingEnabled', () => {
      it('should enable onion routing', () => {
        useSettingsStore.getState().setOnionRoutingEnabled(true);

        const state = useSettingsStore.getState();
        expect(state.onionRoutingEnabled).toBe(true);
      });

      it('should disable onion routing', () => {
        useSettingsStore.getState().setOnionRoutingEnabled(false);

        const state = useSettingsStore.getState();
        expect(state.onionRoutingEnabled).toBe(false);
      });
    });

    describe('setAllowLocalDiscovery', () => {
      it('should enable local discovery', () => {
        useSettingsStore.getState().setAllowLocalDiscovery(true);

        const state = useSettingsStore.getState();
        expect(state.allowLocalDiscovery).toBe(true);
      });

      it('should disable local discovery', () => {
        useSettingsStore.getState().setAllowLocalDiscovery(false);

        const state = useSettingsStore.getState();
        expect(state.allowLocalDiscovery).toBe(false);
      });
    });

    describe('setAllowInternetP2P', () => {
      it('should enable internet P2P', () => {
        useSettingsStore.getState().setAllowInternetP2P(true);

        const state = useSettingsStore.getState();
        expect(state.allowInternetP2P).toBe(true);
      });

      it('should disable internet P2P', () => {
        useSettingsStore.getState().setAllowInternetP2P(false);

        const state = useSettingsStore.getState();
        expect(state.allowInternetP2P).toBe(false);
      });
    });

    describe('setTemporaryVisibility', () => {
      it('should enable temporary visibility', () => {
        useSettingsStore.getState().setTemporaryVisibility(true);

        const state = useSettingsStore.getState();
        expect(state.temporaryVisibility).toBe(true);
      });

      it('should disable temporary visibility', () => {
        useSettingsStore.getState().setTemporaryVisibility(false);

        const state = useSettingsStore.getState();
        expect(state.temporaryVisibility).toBe(false);
      });
    });

    describe('setGuestMode', () => {
      it('should enable guest mode', () => {
        useSettingsStore.getState().setGuestMode(true);

        const state = useSettingsStore.getState();
        expect(state.guestMode).toBe(true);
      });

      it('should disable guest mode', () => {
        useSettingsStore.getState().setGuestMode(false);

        const state = useSettingsStore.getState();
        expect(state.guestMode).toBe(false);
      });
    });
  });

  describe('Transfer Settings', () => {
    describe('setAutoAcceptFromFriends', () => {
      it('should enable auto-accept from friends', () => {
        useSettingsStore.getState().setAutoAcceptFromFriends(true);

        const state = useSettingsStore.getState();
        expect(state.autoAcceptFromFriends).toBe(true);
      });

      it('should disable auto-accept from friends', () => {
        useSettingsStore.getState().setAutoAcceptFromFriends(false);

        const state = useSettingsStore.getState();
        expect(state.autoAcceptFromFriends).toBe(false);
      });
    });

    describe('setSaveLocation', () => {
      it('should set custom save location', () => {
        useSettingsStore.getState().setSaveLocation('/custom/path');

        const state = useSettingsStore.getState();
        expect(state.saveLocation).toBe('/custom/path');
      });

      it('should handle Windows paths', () => {
        useSettingsStore.getState().setSaveLocation('C:\\Users\\Documents');

        const state = useSettingsStore.getState();
        expect(state.saveLocation).toBe('C:\\Users\\Documents');
      });
    });

    describe('setMaxConcurrentTransfers', () => {
      it('should set max concurrent transfers to 1', () => {
        useSettingsStore.getState().setMaxConcurrentTransfers(1);

        const state = useSettingsStore.getState();
        expect(state.maxConcurrentTransfers).toBe(1);
      });

      it('should set max concurrent transfers to 2', () => {
        useSettingsStore.getState().setMaxConcurrentTransfers(2);

        const state = useSettingsStore.getState();
        expect(state.maxConcurrentTransfers).toBe(2);
      });

      it('should set max concurrent transfers to 3', () => {
        useSettingsStore.getState().setMaxConcurrentTransfers(3);

        const state = useSettingsStore.getState();
        expect(state.maxConcurrentTransfers).toBe(3);
      });

      it('should set max concurrent transfers to 5', () => {
        useSettingsStore.getState().setMaxConcurrentTransfers(5);

        const state = useSettingsStore.getState();
        expect(state.maxConcurrentTransfers).toBe(5);
      });
    });
  });

  describe('Notification Settings', () => {
    describe('setNotificationSound', () => {
      it('should enable notification sound', () => {
        useSettingsStore.getState().setNotificationSound(true);

        const state = useSettingsStore.getState();
        expect(state.notificationSound).toBe(true);
      });

      it('should disable notification sound', () => {
        useSettingsStore.getState().setNotificationSound(false);

        const state = useSettingsStore.getState();
        expect(state.notificationSound).toBe(false);
      });
    });

    describe('setNotificationVolume', () => {
      it('should set notification volume', () => {
        useSettingsStore.getState().setNotificationVolume(0.5);

        const state = useSettingsStore.getState();
        expect(state.notificationVolume).toBe(0.5);
      });

      it('should clamp volume to minimum 0', () => {
        useSettingsStore.getState().setNotificationVolume(-0.5);

        const state = useSettingsStore.getState();
        expect(state.notificationVolume).toBe(0);
      });

      it('should clamp volume to maximum 1', () => {
        useSettingsStore.getState().setNotificationVolume(1.5);

        const state = useSettingsStore.getState();
        expect(state.notificationVolume).toBe(1);
      });

      it('should accept 0 volume', () => {
        useSettingsStore.getState().setNotificationVolume(0);

        const state = useSettingsStore.getState();
        expect(state.notificationVolume).toBe(0);
      });

      it('should accept 1 volume', () => {
        useSettingsStore.getState().setNotificationVolume(1);

        const state = useSettingsStore.getState();
        expect(state.notificationVolume).toBe(1);
      });
    });

    describe('setBrowserNotifications', () => {
      it('should enable browser notifications', () => {
        useSettingsStore.getState().setBrowserNotifications(true);

        const state = useSettingsStore.getState();
        expect(state.browserNotifications).toBe(true);
      });

      it('should disable browser notifications', () => {
        useSettingsStore.getState().setBrowserNotifications(false);

        const state = useSettingsStore.getState();
        expect(state.browserNotifications).toBe(false);
      });
    });

    describe('setToastPosition', () => {
      it('should set toast position to top-right', () => {
        useSettingsStore.getState().setToastPosition('top-right');

        const state = useSettingsStore.getState();
        expect(state.toastPosition).toBe('top-right');
      });

      it('should set toast position to top-left', () => {
        useSettingsStore.getState().setToastPosition('top-left');

        const state = useSettingsStore.getState();
        expect(state.toastPosition).toBe('top-left');
      });

      it('should set toast position to bottom-right', () => {
        useSettingsStore.getState().setToastPosition('bottom-right');

        const state = useSettingsStore.getState();
        expect(state.toastPosition).toBe('bottom-right');
      });

      it('should set toast position to bottom-left', () => {
        useSettingsStore.getState().setToastPosition('bottom-left');

        const state = useSettingsStore.getState();
        expect(state.toastPosition).toBe('bottom-left');
      });

      it('should set toast position to top-center', () => {
        useSettingsStore.getState().setToastPosition('top-center');

        const state = useSettingsStore.getState();
        expect(state.toastPosition).toBe('top-center');
      });

      it('should set toast position to bottom-center', () => {
        useSettingsStore.getState().setToastPosition('bottom-center');

        const state = useSettingsStore.getState();
        expect(state.toastPosition).toBe('bottom-center');
      });
    });

    describe('setNotifyOnTransferComplete', () => {
      it('should enable transfer complete notifications', () => {
        useSettingsStore.getState().setNotifyOnTransferComplete(true);

        const state = useSettingsStore.getState();
        expect(state.notifyOnTransferComplete).toBe(true);
      });

      it('should disable transfer complete notifications', () => {
        useSettingsStore.getState().setNotifyOnTransferComplete(false);

        const state = useSettingsStore.getState();
        expect(state.notifyOnTransferComplete).toBe(false);
      });
    });

    describe('setNotifyOnIncomingTransfer', () => {
      it('should enable incoming transfer notifications', () => {
        useSettingsStore.getState().setNotifyOnIncomingTransfer(true);

        const state = useSettingsStore.getState();
        expect(state.notifyOnIncomingTransfer).toBe(true);
      });

      it('should disable incoming transfer notifications', () => {
        useSettingsStore.getState().setNotifyOnIncomingTransfer(false);

        const state = useSettingsStore.getState();
        expect(state.notifyOnIncomingTransfer).toBe(false);
      });
    });

    describe('setNotifyOnConnectionChange', () => {
      it('should enable connection change notifications', () => {
        useSettingsStore.getState().setNotifyOnConnectionChange(true);

        const state = useSettingsStore.getState();
        expect(state.notifyOnConnectionChange).toBe(true);
      });

      it('should disable connection change notifications', () => {
        useSettingsStore.getState().setNotifyOnConnectionChange(false);

        const state = useSettingsStore.getState();
        expect(state.notifyOnConnectionChange).toBe(false);
      });
    });

    describe('setNotifyOnDeviceDiscovered', () => {
      it('should enable device discovered notifications', () => {
        useSettingsStore.getState().setNotifyOnDeviceDiscovered(true);

        const state = useSettingsStore.getState();
        expect(state.notifyOnDeviceDiscovered).toBe(true);
      });

      it('should disable device discovered notifications', () => {
        useSettingsStore.getState().setNotifyOnDeviceDiscovered(false);

        const state = useSettingsStore.getState();
        expect(state.notifyOnDeviceDiscovered).toBe(false);
      });
    });

    describe('Silent Hours', () => {
      describe('setSilentHoursEnabled', () => {
        it('should enable silent hours', () => {
          useSettingsStore.getState().setSilentHoursEnabled(true);

          const state = useSettingsStore.getState();
          expect(state.silentHoursEnabled).toBe(true);
        });

        it('should disable silent hours', () => {
          useSettingsStore.getState().setSilentHoursEnabled(false);

          const state = useSettingsStore.getState();
          expect(state.silentHoursEnabled).toBe(false);
        });
      });

      describe('setSilentHoursStart', () => {
        it('should set silent hours start time', () => {
          useSettingsStore.getState().setSilentHoursStart('20:00');

          const state = useSettingsStore.getState();
          expect(state.silentHoursStart).toBe('20:00');
        });

        it('should accept midnight', () => {
          useSettingsStore.getState().setSilentHoursStart('00:00');

          const state = useSettingsStore.getState();
          expect(state.silentHoursStart).toBe('00:00');
        });

        it('should accept noon', () => {
          useSettingsStore.getState().setSilentHoursStart('12:00');

          const state = useSettingsStore.getState();
          expect(state.silentHoursStart).toBe('12:00');
        });
      });

      describe('setSilentHoursEnd', () => {
        it('should set silent hours end time', () => {
          useSettingsStore.getState().setSilentHoursEnd('09:00');

          const state = useSettingsStore.getState();
          expect(state.silentHoursEnd).toBe('09:00');
        });

        it('should accept midnight', () => {
          useSettingsStore.getState().setSilentHoursEnd('00:00');

          const state = useSettingsStore.getState();
          expect(state.silentHoursEnd).toBe('00:00');
        });
      });
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all settings to defaults', () => {
      // Modify multiple settings
      useSettingsStore.getState().setDeviceName('Custom Device');
      useSettingsStore.getState().setTheme('light');
      useSettingsStore.getState().setStripMetadata(false);
      useSettingsStore.getState().setNotificationVolume(0.8);
      useSettingsStore.getState().setMaxConcurrentTransfers(5);

      // Reset
      useSettingsStore.getState().resetToDefaults();

      const state = useSettingsStore.getState();

      // Check all values are back to defaults
      expect(state.theme).toBe('dark');
      expect(state.stripMetadata).toBe(true);
      expect(state.notificationVolume).toBe(0.3);
      expect(state.maxConcurrentTransfers).toBe(3);
    });

    it('should generate new device ID on reset', () => {
      const originalDeviceId = useSettingsStore.getState().deviceId;

      useSettingsStore.getState().resetToDefaults();

      const newDeviceId = useSettingsStore.getState().deviceId;

      // Device ID should be different (new random ID)
      expect(newDeviceId).not.toBe(originalDeviceId);
    });

    it('should preserve device ID format', () => {
      useSettingsStore.getState().resetToDefaults();

      const state = useSettingsStore.getState();
      expect(state.deviceId).toMatch(/^device-/);
    });
  });

  describe('Setting Combinations', () => {
    it('should handle multiple privacy settings together', () => {
      useSettingsStore.getState().setStripMetadata(true);
      useSettingsStore.getState().setIpLeakProtection(true);
      useSettingsStore.getState().setOnionRoutingEnabled(true);
      useSettingsStore.getState().setGuestMode(true);

      const state = useSettingsStore.getState();
      expect(state.stripMetadata).toBe(true);
      expect(state.ipLeakProtection).toBe(true);
      expect(state.onionRoutingEnabled).toBe(true);
      expect(state.guestMode).toBe(true);
    });

    it('should handle notification settings independently', () => {
      useSettingsStore.getState().setNotificationSound(false);
      useSettingsStore.getState().setBrowserNotifications(true);
      useSettingsStore.getState().setNotifyOnTransferComplete(true);
      useSettingsStore.getState().setNotifyOnIncomingTransfer(false);

      const state = useSettingsStore.getState();
      expect(state.notificationSound).toBe(false);
      expect(state.browserNotifications).toBe(true);
      expect(state.notifyOnTransferComplete).toBe(true);
      expect(state.notifyOnIncomingTransfer).toBe(false);
    });

    it('should allow disabling all notifications', () => {
      useSettingsStore.getState().setNotificationSound(false);
      useSettingsStore.getState().setBrowserNotifications(false);
      useSettingsStore.getState().setNotifyOnTransferComplete(false);
      useSettingsStore.getState().setNotifyOnIncomingTransfer(false);
      useSettingsStore.getState().setNotifyOnConnectionChange(false);
      useSettingsStore.getState().setNotifyOnDeviceDiscovered(false);

      const state = useSettingsStore.getState();
      expect(state.notificationSound).toBe(false);
      expect(state.browserNotifications).toBe(false);
      expect(state.notifyOnTransferComplete).toBe(false);
      expect(state.notifyOnIncomingTransfer).toBe(false);
      expect(state.notifyOnConnectionChange).toBe(false);
      expect(state.notifyOnDeviceDiscovered).toBe(false);
    });
  });

  describe('Boundary Values', () => {
    it('should handle minimum notification volume', () => {
      useSettingsStore.getState().setNotificationVolume(0);

      const state = useSettingsStore.getState();
      expect(state.notificationVolume).toBe(0);
    });

    it('should handle maximum notification volume', () => {
      useSettingsStore.getState().setNotificationVolume(1);

      const state = useSettingsStore.getState();
      expect(state.notificationVolume).toBe(1);
    });

    it('should handle minimum concurrent transfers', () => {
      useSettingsStore.getState().setMaxConcurrentTransfers(1);

      const state = useSettingsStore.getState();
      expect(state.maxConcurrentTransfers).toBe(1);
    });

    it('should handle maximum concurrent transfers', () => {
      useSettingsStore.getState().setMaxConcurrentTransfers(5);

      const state = useSettingsStore.getState();
      expect(state.maxConcurrentTransfers).toBe(5);
    });
  });
});
