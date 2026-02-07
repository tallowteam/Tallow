/**
 * Device Store Unit Tests
 *
 * Tests the device store Zustand implementation including:
 * - Initial state
 * - Device management (add, update, remove, clear)
 * - Device selection and recent devices
 * - Favorites management
 * - Connection state management
 * - Discovery state management
 * - Device deduplication
 * - Selectors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDeviceStore } from '@/lib/stores/device-store';
import type { Device } from '@/lib/types';
import type { Platform } from '@/lib/types';

describe('DeviceStore', () => {
  // Helper to create mock devices
  const createMockDevice = (overrides?: Partial<Device>): Device => ({
    id: `device-${Math.random().toString(36).substring(2, 9)}`,
    name: 'Test Device',
    platform: 'windows' as Platform,
    ip: '192.168.1.100',
    port: 8080,
    isOnline: true,
    isFavorite: false,
    lastSeen: Date.now(),
    avatar: null,
    ...overrides,
  });

  // Reset store state before each test
  beforeEach(() => {
    useDeviceStore.setState({
      devices: [],
      favoriteDeviceIds: [],
      recentDeviceIds: [],
      selectedDeviceId: null,
      selectedDevice: null,
      connection: {
        status: 'idle',
        peerId: null,
        peerName: null,
        connectionType: null,
        error: null,
        timestamp: null,
      },
      discovery: {
        isScanning: false,
        lastScanAt: null,
        scanDuration: 0,
        error: null,
      },
      isLoading: false,
      isInitialized: false,
    });
  });

  describe('Initial State', () => {
    it('should have empty devices array', () => {
      const state = useDeviceStore.getState();
      expect(state.devices).toEqual([]);
    });

    it('should have no selected device', () => {
      const state = useDeviceStore.getState();
      expect(state.selectedDevice).toBeNull();
      expect(state.selectedDeviceId).toBeNull();
    });

    it('should have idle connection status', () => {
      const state = useDeviceStore.getState();
      expect(state.connection.status).toBe('idle');
    });

    it('should not be scanning', () => {
      const state = useDeviceStore.getState();
      expect(state.discovery.isScanning).toBe(false);
    });

    it('should not be initialized', () => {
      const state = useDeviceStore.getState();
      expect(state.isInitialized).toBe(false);
    });
  });

  describe('Device Management', () => {
    describe('addDevice', () => {
      it('should add a new device', () => {
        const device = createMockDevice({ id: 'device-1', name: 'Device 1' });
        useDeviceStore.getState().addDevice(device);

        const state = useDeviceStore.getState();
        expect(state.devices).toHaveLength(1);
        expect(state.devices[0]).toEqual(device);
      });

      it('should update existing device when adding duplicate', () => {
        const device1 = createMockDevice({ id: 'device-1', name: 'Device 1' });
        const device2 = createMockDevice({ id: 'device-1', name: 'Device 1 Updated' });

        useDeviceStore.getState().addDevice(device1);
        useDeviceStore.getState().addDevice(device2);

        const state = useDeviceStore.getState();
        expect(state.devices).toHaveLength(1);
        expect(state.devices[0]?.name).toBe('Device 1 Updated');
      });

      it('should add multiple different devices', () => {
        const device1 = createMockDevice({ id: 'device-1' });
        const device2 = createMockDevice({ id: 'device-2' });

        useDeviceStore.getState().addDevice(device1);
        useDeviceStore.getState().addDevice(device2);

        const state = useDeviceStore.getState();
        expect(state.devices).toHaveLength(2);
      });
    });

    describe('setDevices', () => {
      it('should replace all devices', () => {
        const device1 = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device1);

        const newDevices = [
          createMockDevice({ id: 'device-2' }),
          createMockDevice({ id: 'device-3' }),
        ];
        useDeviceStore.getState().setDevices(newDevices);

        const state = useDeviceStore.getState();
        expect(state.devices).toHaveLength(2);
        expect(state.devices).toEqual(newDevices);
      });

      it('should update selectedDevice if it exists in new devices', () => {
        const device1 = createMockDevice({ id: 'device-1', name: 'Device 1' });
        const device2 = createMockDevice({ id: 'device-1', name: 'Device 1 Updated' });

        useDeviceStore.getState().addDevice(device1);
        useDeviceStore.getState().selectDevice(device1);

        useDeviceStore.getState().setDevices([device2]);

        const state = useDeviceStore.getState();
        expect(state.selectedDevice?.name).toBe('Device 1 Updated');
      });

      it('should clear selectedDevice if not in new devices', () => {
        const device1 = createMockDevice({ id: 'device-1' });
        const device2 = createMockDevice({ id: 'device-2' });

        useDeviceStore.getState().addDevice(device1);
        useDeviceStore.getState().selectDevice(device1);

        useDeviceStore.getState().setDevices([device2]);

        const state = useDeviceStore.getState();
        expect(state.selectedDevice).toBeNull();
      });
    });

    describe('updateDevice', () => {
      it('should update device properties', () => {
        const device = createMockDevice({ id: 'device-1', name: 'Original', isOnline: true });
        useDeviceStore.getState().addDevice(device);

        useDeviceStore.getState().updateDevice('device-1', {
          name: 'Updated',
          isOnline: false
        });

        const state = useDeviceStore.getState();
        expect(state.devices[0]?.name).toBe('Updated');
        expect(state.devices[0]?.isOnline).toBe(false);
      });

      it('should not modify other devices', () => {
        const device1 = createMockDevice({ id: 'device-1', name: 'Device 1' });
        const device2 = createMockDevice({ id: 'device-2', name: 'Device 2' });

        useDeviceStore.getState().addDevice(device1);
        useDeviceStore.getState().addDevice(device2);

        useDeviceStore.getState().updateDevice('device-1', { name: 'Updated' });

        const state = useDeviceStore.getState();
        expect(state.devices[0]?.name).toBe('Updated');
        expect(state.devices[1]?.name).toBe('Device 2');
      });

      it('should update selectedDevice if selected', () => {
        const device = createMockDevice({ id: 'device-1', name: 'Original' });
        useDeviceStore.getState().addDevice(device);
        useDeviceStore.getState().selectDevice(device);

        useDeviceStore.getState().updateDevice('device-1', { name: 'Updated' });

        const state = useDeviceStore.getState();
        expect(state.selectedDevice?.name).toBe('Updated');
      });

      it('should handle non-existent device gracefully', () => {
        const device = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device);

        useDeviceStore.getState().updateDevice('non-existent', { name: 'Updated' });

        const state = useDeviceStore.getState();
        expect(state.devices).toHaveLength(1);
        expect(state.devices[0]?.id).toBe('device-1');
      });

      it('should preserve undefined fields', () => {
        const device = createMockDevice({
          id: 'device-1',
          name: 'Device',
          ip: '192.168.1.100',
          port: 8080
        });
        useDeviceStore.getState().addDevice(device);

        useDeviceStore.getState().updateDevice('device-1', { name: 'Updated' });

        const state = useDeviceStore.getState();
        expect(state.devices[0]?.ip).toBe('192.168.1.100');
        expect(state.devices[0]?.port).toBe(8080);
      });
    });

    describe('removeDevice', () => {
      it('should remove device from list', () => {
        const device = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device);

        useDeviceStore.getState().removeDevice('device-1');

        const state = useDeviceStore.getState();
        expect(state.devices).toHaveLength(0);
      });

      it('should clear selection if selected device is removed', () => {
        const device = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device);
        useDeviceStore.getState().selectDevice(device);

        useDeviceStore.getState().removeDevice('device-1');

        const state = useDeviceStore.getState();
        expect(state.selectedDevice).toBeNull();
        expect(state.selectedDeviceId).toBeNull();
      });

      it('should remove from favorites', () => {
        const device = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device);
        useDeviceStore.getState().toggleFavorite('device-1');

        useDeviceStore.getState().removeDevice('device-1');

        const state = useDeviceStore.getState();
        expect(state.favoriteDeviceIds).not.toContain('device-1');
      });

      it('should remove from recent devices', () => {
        const device = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device);
        useDeviceStore.getState().addToRecent('device-1');

        useDeviceStore.getState().removeDevice('device-1');

        const state = useDeviceStore.getState();
        expect(state.recentDeviceIds).not.toContain('device-1');
      });
    });

    describe('clearDevices', () => {
      it('should remove all devices', () => {
        const device1 = createMockDevice({ id: 'device-1' });
        const device2 = createMockDevice({ id: 'device-2' });

        useDeviceStore.getState().addDevice(device1);
        useDeviceStore.getState().addDevice(device2);

        useDeviceStore.getState().clearDevices();

        const state = useDeviceStore.getState();
        expect(state.devices).toHaveLength(0);
      });

      it('should clear selection', () => {
        const device = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device);
        useDeviceStore.getState().selectDevice(device);

        useDeviceStore.getState().clearDevices();

        const state = useDeviceStore.getState();
        expect(state.selectedDevice).toBeNull();
        expect(state.selectedDeviceId).toBeNull();
      });
    });
  });

  describe('Device Selection', () => {
    describe('selectDevice', () => {
      it('should select a device', () => {
        const device = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device);

        useDeviceStore.getState().selectDevice(device);

        const state = useDeviceStore.getState();
        expect(state.selectedDevice).toEqual(device);
        expect(state.selectedDeviceId).toBe('device-1');
      });

      it('should add to recent devices', () => {
        const device = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device);

        useDeviceStore.getState().selectDevice(device);

        const state = useDeviceStore.getState();
        expect(state.recentDeviceIds).toContain('device-1');
      });

      it('should clear selection when null is passed', () => {
        const device = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device);
        useDeviceStore.getState().selectDevice(device);

        useDeviceStore.getState().selectDevice(null);

        const state = useDeviceStore.getState();
        expect(state.selectedDevice).toBeNull();
        expect(state.selectedDeviceId).toBeNull();
      });

      it('should move device to front of recent list', () => {
        const device1 = createMockDevice({ id: 'device-1' });
        const device2 = createMockDevice({ id: 'device-2' });

        useDeviceStore.getState().addDevice(device1);
        useDeviceStore.getState().addDevice(device2);

        useDeviceStore.getState().selectDevice(device1);
        useDeviceStore.getState().selectDevice(device2);

        const state = useDeviceStore.getState();
        expect(state.recentDeviceIds[0]).toBe('device-2');
        expect(state.recentDeviceIds[1]).toBe('device-1');
      });
    });

    describe('selectDeviceById', () => {
      it('should select device by ID', () => {
        const device = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device);

        useDeviceStore.getState().selectDeviceById('device-1');

        const state = useDeviceStore.getState();
        expect(state.selectedDeviceId).toBe('device-1');
        expect(state.selectedDevice).toEqual(device);
      });

      it('should handle non-existent device ID', () => {
        useDeviceStore.getState().selectDeviceById('non-existent');

        const state = useDeviceStore.getState();
        expect(state.selectedDeviceId).toBe('non-existent');
        expect(state.selectedDevice).toBeNull();
      });

      it('should clear selection when null is passed', () => {
        const device = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device);
        useDeviceStore.getState().selectDeviceById('device-1');

        useDeviceStore.getState().selectDeviceById(null);

        const state = useDeviceStore.getState();
        expect(state.selectedDevice).toBeNull();
      });
    });
  });

  describe('Favorites', () => {
    describe('toggleFavorite', () => {
      it('should add device to favorites', () => {
        const device = createMockDevice({ id: 'device-1', isFavorite: false });
        useDeviceStore.getState().addDevice(device);

        useDeviceStore.getState().toggleFavorite('device-1');

        const state = useDeviceStore.getState();
        expect(state.favoriteDeviceIds).toContain('device-1');
        expect(state.devices[0]?.isFavorite).toBe(true);
      });

      it('should remove device from favorites', () => {
        const device = createMockDevice({ id: 'device-1', isFavorite: true });
        useDeviceStore.getState().addDevice(device);
        useDeviceStore.getState().toggleFavorite('device-1');

        useDeviceStore.getState().toggleFavorite('device-1');

        const state = useDeviceStore.getState();
        expect(state.favoriteDeviceIds).not.toContain('device-1');
        expect(state.devices[0]?.isFavorite).toBe(false);
      });

      it('should update selectedDevice if selected', () => {
        const device = createMockDevice({ id: 'device-1', isFavorite: false });
        useDeviceStore.getState().addDevice(device);
        useDeviceStore.getState().selectDevice(device);

        useDeviceStore.getState().toggleFavorite('device-1');

        const state = useDeviceStore.getState();
        expect(state.selectedDevice?.isFavorite).toBe(true);
      });
    });

    describe('setFavorite', () => {
      it('should set favorite to true', () => {
        const device = createMockDevice({ id: 'device-1', isFavorite: false });
        useDeviceStore.getState().addDevice(device);

        useDeviceStore.getState().setFavorite('device-1', true);

        const state = useDeviceStore.getState();
        expect(state.favoriteDeviceIds).toContain('device-1');
        expect(state.devices[0]?.isFavorite).toBe(true);
      });

      it('should set favorite to false', () => {
        const device = createMockDevice({ id: 'device-1', isFavorite: true });
        useDeviceStore.getState().addDevice(device);
        useDeviceStore.getState().setFavorite('device-1', true);

        useDeviceStore.getState().setFavorite('device-1', false);

        const state = useDeviceStore.getState();
        expect(state.favoriteDeviceIds).not.toContain('device-1');
        expect(state.devices[0]?.isFavorite).toBe(false);
      });

      it('should not add duplicate to favorites', () => {
        const device = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device);

        useDeviceStore.getState().setFavorite('device-1', true);
        useDeviceStore.getState().setFavorite('device-1', true);

        const state = useDeviceStore.getState();
        const favoriteCount = state.favoriteDeviceIds.filter(id => id === 'device-1').length;
        expect(favoriteCount).toBe(1);
      });
    });
  });

  describe('Recent Devices', () => {
    describe('addToRecent', () => {
      it('should add device to recent list', () => {
        useDeviceStore.getState().addToRecent('device-1');

        const state = useDeviceStore.getState();
        expect(state.recentDeviceIds).toContain('device-1');
      });

      it('should move device to front if already in list', () => {
        useDeviceStore.getState().addToRecent('device-1');
        useDeviceStore.getState().addToRecent('device-2');
        useDeviceStore.getState().addToRecent('device-1');

        const state = useDeviceStore.getState();
        expect(state.recentDeviceIds[0]).toBe('device-1');
      });

      it('should limit recent devices to 10', () => {
        for (let i = 0; i < 15; i++) {
          useDeviceStore.getState().addToRecent(`device-${i}`);
        }

        const state = useDeviceStore.getState();
        expect(state.recentDeviceIds).toHaveLength(10);
      });

      it('should keep most recent 10 devices', () => {
        for (let i = 0; i < 15; i++) {
          useDeviceStore.getState().addToRecent(`device-${i}`);
        }

        const state = useDeviceStore.getState();
        expect(state.recentDeviceIds[0]).toBe('device-14');
        expect(state.recentDeviceIds).not.toContain('device-0');
      });
    });

    describe('clearRecent', () => {
      it('should clear recent devices list', () => {
        useDeviceStore.getState().addToRecent('device-1');
        useDeviceStore.getState().addToRecent('device-2');

        useDeviceStore.getState().clearRecent();

        const state = useDeviceStore.getState();
        expect(state.recentDeviceIds).toHaveLength(0);
      });
    });
  });

  describe('Connection Management', () => {
    describe('startConnecting', () => {
      it('should set connecting status', () => {
        useDeviceStore.getState().startConnecting('peer-1', 'Peer Name');

        const state = useDeviceStore.getState();
        expect(state.connection.status).toBe('connecting');
        expect(state.connection.peerId).toBe('peer-1');
        expect(state.connection.peerName).toBe('Peer Name');
      });

      it('should set timestamp', () => {
        const beforeTime = Date.now();
        useDeviceStore.getState().startConnecting('peer-1');
        const afterTime = Date.now();

        const state = useDeviceStore.getState();
        expect(state.connection.timestamp).toBeGreaterThanOrEqual(beforeTime);
        expect(state.connection.timestamp).toBeLessThanOrEqual(afterTime);
      });

      it('should clear previous error', () => {
        useDeviceStore.getState().setConnectionError('Previous error');
        useDeviceStore.getState().startConnecting('peer-1');

        const state = useDeviceStore.getState();
        expect(state.connection.error).toBeNull();
      });

      it('should handle missing peer name', () => {
        useDeviceStore.getState().startConnecting('peer-1');

        const state = useDeviceStore.getState();
        expect(state.connection.peerName).toBeNull();
      });
    });

    describe('setConnected', () => {
      it('should set connected status with p2p type', () => {
        useDeviceStore.getState().startConnecting('peer-1');
        useDeviceStore.getState().setConnected('p2p');

        const state = useDeviceStore.getState();
        expect(state.connection.status).toBe('connected');
        expect(state.connection.connectionType).toBe('p2p');
      });

      it('should set connected status with relay type', () => {
        useDeviceStore.getState().startConnecting('peer-1');
        useDeviceStore.getState().setConnected('relay');

        const state = useDeviceStore.getState();
        expect(state.connection.status).toBe('connected');
        expect(state.connection.connectionType).toBe('relay');
      });

      it('should preserve peerId and peerName', () => {
        useDeviceStore.getState().startConnecting('peer-1', 'Peer Name');
        useDeviceStore.getState().setConnected('p2p');

        const state = useDeviceStore.getState();
        expect(state.connection.peerId).toBe('peer-1');
        expect(state.connection.peerName).toBe('Peer Name');
      });
    });

    describe('setConnectionError', () => {
      it('should set error status and message', () => {
        useDeviceStore.getState().setConnectionError('Connection failed');

        const state = useDeviceStore.getState();
        expect(state.connection.status).toBe('error');
        expect(state.connection.error).toBe('Connection failed');
      });

      it('should preserve other connection properties', () => {
        useDeviceStore.getState().startConnecting('peer-1', 'Peer Name');
        useDeviceStore.getState().setConnectionError('Connection failed');

        const state = useDeviceStore.getState();
        expect(state.connection.peerId).toBe('peer-1');
        expect(state.connection.peerName).toBe('Peer Name');
      });
    });

    describe('disconnect', () => {
      it('should reset connection state', () => {
        useDeviceStore.getState().startConnecting('peer-1', 'Peer Name');
        useDeviceStore.getState().setConnected('p2p');

        useDeviceStore.getState().disconnect();

        const state = useDeviceStore.getState();
        expect(state.connection.status).toBe('idle');
        expect(state.connection.peerId).toBeNull();
        expect(state.connection.peerName).toBeNull();
        expect(state.connection.connectionType).toBeNull();
        expect(state.connection.error).toBeNull();
        expect(state.connection.timestamp).toBeNull();
      });
    });
  });

  describe('Discovery Management', () => {
    describe('startScanning', () => {
      it('should set scanning to true', () => {
        useDeviceStore.getState().startScanning();

        const state = useDeviceStore.getState();
        expect(state.discovery.isScanning).toBe(true);
      });

      it('should set lastScanAt timestamp', () => {
        const beforeTime = Date.now();
        useDeviceStore.getState().startScanning();
        const afterTime = Date.now();

        const state = useDeviceStore.getState();
        expect(state.discovery.lastScanAt).toBeGreaterThanOrEqual(beforeTime);
        expect(state.discovery.lastScanAt).toBeLessThanOrEqual(afterTime);
      });

      it('should reset scanDuration', () => {
        useDeviceStore.setState({
          discovery: {
            isScanning: false,
            lastScanAt: null,
            scanDuration: 5000,
            error: null
          }
        });

        useDeviceStore.getState().startScanning();

        const state = useDeviceStore.getState();
        expect(state.discovery.scanDuration).toBe(0);
      });

      it('should clear previous error', () => {
        useDeviceStore.getState().setScanError('Previous error');
        useDeviceStore.getState().startScanning();

        const state = useDeviceStore.getState();
        expect(state.discovery.error).toBeNull();
      });
    });

    describe('stopScanning', () => {
      it('should set scanning to false', () => {
        useDeviceStore.getState().startScanning();
        useDeviceStore.getState().stopScanning();

        const state = useDeviceStore.getState();
        expect(state.discovery.isScanning).toBe(false);
      });

      it('should calculate scan duration', () => {
        useDeviceStore.getState().startScanning();

        // Wait a bit to have actual duration
        const waitPromise = new Promise(resolve => setTimeout(resolve, 50));

        return waitPromise.then(() => {
          useDeviceStore.getState().stopScanning();

          const state = useDeviceStore.getState();
          expect(state.discovery.scanDuration).toBeGreaterThan(0);
        });
      });

      it('should preserve lastScanAt', () => {
        useDeviceStore.getState().startScanning();
        const scanTime = useDeviceStore.getState().discovery.lastScanAt;

        useDeviceStore.getState().stopScanning();

        const state = useDeviceStore.getState();
        expect(state.discovery.lastScanAt).toBe(scanTime);
      });
    });

    describe('setScanError', () => {
      it('should set error message', () => {
        useDeviceStore.getState().setScanError('Scan failed');

        const state = useDeviceStore.getState();
        expect(state.discovery.error).toBe('Scan failed');
      });

      it('should stop scanning', () => {
        useDeviceStore.getState().startScanning();
        useDeviceStore.getState().setScanError('Scan failed');

        const state = useDeviceStore.getState();
        expect(state.discovery.isScanning).toBe(false);
      });
    });
  });

  describe('Loading States', () => {
    describe('setLoading', () => {
      it('should set loading to true', () => {
        useDeviceStore.getState().setLoading(true);

        const state = useDeviceStore.getState();
        expect(state.isLoading).toBe(true);
      });

      it('should set loading to false', () => {
        useDeviceStore.getState().setLoading(true);
        useDeviceStore.getState().setLoading(false);

        const state = useDeviceStore.getState();
        expect(state.isLoading).toBe(false);
      });
    });

    describe('setInitialized', () => {
      it('should set initialized to true', () => {
        useDeviceStore.getState().setInitialized();

        const state = useDeviceStore.getState();
        expect(state.isInitialized).toBe(true);
      });
    });
  });

  describe('Selectors', () => {
    describe('getDeviceById', () => {
      it('should return device by ID', () => {
        const device = createMockDevice({ id: 'device-1', name: 'Test Device' });
        useDeviceStore.getState().addDevice(device);

        const result = useDeviceStore.getState().getDeviceById('device-1');

        expect(result).toEqual(device);
      });

      it('should return undefined for non-existent ID', () => {
        const result = useDeviceStore.getState().getDeviceById('non-existent');

        expect(result).toBeUndefined();
      });
    });

    describe('getOnlineDevices', () => {
      it('should return only online devices', () => {
        const online1 = createMockDevice({ id: 'device-1', isOnline: true });
        const offline1 = createMockDevice({ id: 'device-2', isOnline: false });
        const online2 = createMockDevice({ id: 'device-3', isOnline: true });

        useDeviceStore.getState().addDevice(online1);
        useDeviceStore.getState().addDevice(offline1);
        useDeviceStore.getState().addDevice(online2);

        const result = useDeviceStore.getState().getOnlineDevices();

        expect(result).toHaveLength(2);
        expect(result.every(d => d.isOnline)).toBe(true);
      });
    });

    describe('getOfflineDevices', () => {
      it('should return only offline devices', () => {
        const online1 = createMockDevice({ id: 'device-1', isOnline: true });
        const offline1 = createMockDevice({ id: 'device-2', isOnline: false });
        const offline2 = createMockDevice({ id: 'device-3', isOnline: false });

        useDeviceStore.getState().addDevice(online1);
        useDeviceStore.getState().addDevice(offline1);
        useDeviceStore.getState().addDevice(offline2);

        const result = useDeviceStore.getState().getOfflineDevices();

        expect(result).toHaveLength(2);
        expect(result.every(d => !d.isOnline)).toBe(true);
      });
    });

    describe('getFavoriteDevices', () => {
      it('should return only favorite devices', () => {
        const fav1 = createMockDevice({ id: 'device-1' });
        const notFav = createMockDevice({ id: 'device-2' });
        const fav2 = createMockDevice({ id: 'device-3' });

        useDeviceStore.getState().addDevice(fav1);
        useDeviceStore.getState().addDevice(notFav);
        useDeviceStore.getState().addDevice(fav2);

        useDeviceStore.getState().toggleFavorite('device-1');
        useDeviceStore.getState().toggleFavorite('device-3');

        const result = useDeviceStore.getState().getFavoriteDevices();

        expect(result).toHaveLength(2);
        expect(result.map(d => d.id)).toEqual(['device-1', 'device-3']);
      });
    });

    describe('getRecentDevices', () => {
      it('should return recent devices in order', () => {
        const device1 = createMockDevice({ id: 'device-1' });
        const device2 = createMockDevice({ id: 'device-2' });
        const device3 = createMockDevice({ id: 'device-3' });

        useDeviceStore.getState().addDevice(device1);
        useDeviceStore.getState().addDevice(device2);
        useDeviceStore.getState().addDevice(device3);

        useDeviceStore.getState().addToRecent('device-1');
        useDeviceStore.getState().addToRecent('device-2');
        useDeviceStore.getState().addToRecent('device-3');

        const result = useDeviceStore.getState().getRecentDevices();

        expect(result).toHaveLength(3);
        expect(result.map(d => d.id)).toEqual(['device-3', 'device-2', 'device-1']);
      });

      it('should filter out devices that no longer exist', () => {
        const device1 = createMockDevice({ id: 'device-1' });
        useDeviceStore.getState().addDevice(device1);
        useDeviceStore.getState().addToRecent('device-1');
        useDeviceStore.getState().addToRecent('device-2'); // Doesn't exist

        const result = useDeviceStore.getState().getRecentDevices();

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe('device-1');
      });
    });
  });
});
