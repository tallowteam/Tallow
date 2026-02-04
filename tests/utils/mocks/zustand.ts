/**
 * Zustand Store Mocks
 * Utilities for mocking Zustand stores in tests
 */

import { vi } from 'vitest';
import type { DeviceStoreState } from '@/lib/stores/device-store';
import type { Transfer } from '@/lib/types';

/**
 * Create a mock device store with default values
 */
export function createMockDeviceStore(overrides?: Partial<DeviceStoreState>): DeviceStoreState {
  const defaultState: DeviceStoreState = {
    // Device lists
    devices: [],
    favoriteDeviceIds: [],
    recentDeviceIds: [],

    // Selection
    selectedDeviceId: null,
    selectedDevice: null,

    // Connection state
    connection: {
      status: 'idle',
      peerId: null,
      peerName: null,
      connectionType: null,
      error: null,
      timestamp: null,
    },

    // Discovery state
    discovery: {
      isScanning: false,
      lastScanAt: null,
      scanDuration: 0,
      error: null,
    },

    // Loading states
    isLoading: false,
    isInitialized: true,

    // Actions - Device Management
    setDevices: vi.fn(),
    addDevice: vi.fn(),
    updateDevice: vi.fn(),
    removeDevice: vi.fn(),
    clearDevices: vi.fn(),

    // Actions - Selection
    selectDevice: vi.fn(),
    selectDeviceById: vi.fn(),

    // Actions - Favorites
    toggleFavorite: vi.fn(),
    setFavorite: vi.fn(),

    // Actions - Recent
    addToRecent: vi.fn(),
    clearRecent: vi.fn(),

    // Actions - Connection
    startConnecting: vi.fn(),
    setConnected: vi.fn(),
    setConnectionError: vi.fn(),
    disconnect: vi.fn(),

    // Actions - Discovery
    startScanning: vi.fn(),
    stopScanning: vi.fn(),
    setScanError: vi.fn(),

    // Actions - Loading
    setLoading: vi.fn(),
    setInitialized: vi.fn(),

    // Selectors
    getDeviceById: vi.fn(),
    getOnlineDevices: vi.fn(() => []),
    getOfflineDevices: vi.fn(() => []),
    getFavoriteDevices: vi.fn(() => []),
    getRecentDevices: vi.fn(() => []),
  };

  return { ...defaultState, ...overrides };
}

/**
 * Create a mock transfer
 */
export function createMockTransfer(overrides?: Partial<Transfer>): Transfer {
  const defaultTransfer: Transfer = {
    id: 'test-transfer-123',
    files: [
      {
        name: 'test-file.txt',
        size: 1024,
        type: 'text/plain',
        lastModified: Date.now(),
      },
    ],
    totalSize: 1024,
    transferredSize: 512,
    progress: 50,
    speed: 1024,
    eta: 1,
    status: 'transferring',
    direction: 'send',
    peerId: 'peer-123',
    startedAt: Date.now(),
    quality: 'good',
  };

  return { ...defaultTransfer, ...overrides };
}

/**
 * Create a mock device
 */
export function createMockDevice(overrides?: any) {
  return {
    id: 'device-123',
    name: 'Test Device',
    platform: 'desktop',
    ip: '192.168.1.100',
    port: 3000,
    isOnline: true,
    isFavorite: false,
    lastSeen: Date.now(),
    ...overrides,
  };
}

/**
 * Mock useDeviceStore hook
 */
export function mockUseDeviceStore(state?: Partial<DeviceStoreState>) {
  const mockStore = createMockDeviceStore(state);

  return vi.fn((selector?: (state: DeviceStoreState) => any) => {
    if (selector) {
      return selector(mockStore);
    }
    return mockStore;
  });
}

/**
 * Reset all store mocks
 */
export function resetStoreMocks(store: DeviceStoreState) {
  Object.keys(store).forEach((key) => {
    const value = store[key as keyof DeviceStoreState];
    if (typeof value === 'function' && vi.isMockFunction(value)) {
      vi.mocked(value).mockClear();
    }
  });
}
