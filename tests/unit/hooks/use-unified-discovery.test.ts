/**
 * Unit tests for useUnifiedDiscovery hook
 * Tests device discovery via mDNS and signaling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook as rtlRenderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useUnifiedDiscovery, useMdnsDiscovery, useSignalingDiscovery } from '@/lib/hooks/use-unified-discovery';
import type { UnifiedDevice } from '@/lib/discovery/unified-discovery';

const activeUnmounts: Array<() => void> = [];

function renderHook<T>(callback: () => T) {
  const hook = rtlRenderHook(callback);
  activeUnmounts.push(hook.unmount);
  return hook;
}

afterEach(() => {
  while (activeUnmounts.length > 0) {
    activeUnmounts.pop()?.();
  }
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

// Mock unified discovery
const mockDevices: UnifiedDevice[] = [
  {
    id: 'device-1',
    name: 'Device 1',
    platform: 'windows',
    hasMdns: true,
    hasSignaling: false,
    source: 'mdns',
    ip: '192.168.1.100',
    port: 8080,
    capabilities: {
      supportsPQC: true,
      supportsGroupTransfer: true,
      version: '1.0.0',
    },
    lastSeen: Date.now(),
  },
  {
    id: 'device-2',
    name: 'Device 2',
    platform: 'macos',
    hasMdns: false,
    hasSignaling: true,
    source: 'signaling',
    ip: null,
    port: null,
    capabilities: {
      supportsPQC: false,
      supportsGroupTransfer: true,
      version: '1.0.0',
    },
    lastSeen: Date.now(),
  },
  {
    id: 'device-3',
    name: 'Device 3',
    platform: 'linux',
    hasMdns: true,
    hasSignaling: true,
    source: 'both',
    ip: '192.168.1.102',
    port: 8080,
    capabilities: {
      supportsPQC: true,
      supportsGroupTransfer: false,
      version: '1.0.0',
    },
    lastSeen: Date.now(),
  },
];

let deviceChangeCallback: ((devices: UnifiedDevice[]) => void) | null = null;

const mockUnifiedDiscovery = {
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
  refresh: vi.fn().mockResolvedValue(undefined),
  getStatus: vi.fn(() => ({
    started: true,
    mdnsAvailable: true,
    signalingConnected: true,
    mdnsDeviceCount: 2,
    signalingDeviceCount: 2,
  })),
  onDevicesChanged: vi.fn((callback) => {
    deviceChangeCallback = callback;
    callback(mockDevices); // Initial call
    return () => {
      deviceChangeCallback = null;
    };
  }),
  getBestConnectionMethod: vi.fn((deviceId: string) => {
    const device = mockDevices.find(d => d.id === deviceId);
    if (!device) {return null;}
    if (device.hasMdns) {return 'direct';}
    return 'signaling';
  }),
  getDevice: vi.fn((deviceId: string) => {
    return mockDevices.find(d => d.id === deviceId);
  }),
  advertise: vi.fn(),
  stopAdvertising: vi.fn(),
};

vi.mock('@/lib/discovery/unified-discovery', () => ({
  getUnifiedDiscovery: vi.fn(() => mockUnifiedDiscovery),
}));

describe('useUnifiedDiscovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deviceChangeCallback = null;
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      expect(result.current.devices).toEqual(mockDevices);
      expect(result.current.isDiscovering).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should auto-start discovery when autoStart is true', async () => {
      renderHook(() => useUnifiedDiscovery({ autoStart: true }));

      await waitFor(() => {
        expect(mockUnifiedDiscovery.start).toHaveBeenCalled();
      });
    });

    it('should not auto-start when autoStart is false', () => {
      renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      expect(mockUnifiedDiscovery.start).not.toHaveBeenCalled();
    });
  });

  describe('Discovery Control', () => {
    it('should start discovery', async () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      await act(async () => {
        await result.current.startDiscovery();
      });

      expect(mockUnifiedDiscovery.start).toHaveBeenCalled();
    });

    it('should stop discovery and clear devices', () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      act(() => {
        result.current.stopDiscovery();
      });

      expect(mockUnifiedDiscovery.stop).toHaveBeenCalled();
      expect(result.current.isDiscovering).toBe(false);
      expect(result.current.devices).toEqual([]);
    });

    it('should refresh discovery', async () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockUnifiedDiscovery.refresh).toHaveBeenCalled();
    });

    it('should handle start discovery errors', async () => {
      mockUnifiedDiscovery.start.mockRejectedValueOnce(new Error('Connection failed'));

      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      await act(async () => {
        await result.current.startDiscovery();
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Connection failed');
    });

    it('should handle refresh errors', async () => {
      mockUnifiedDiscovery.refresh.mockRejectedValueOnce(new Error('Refresh failed'));

      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Refresh failed');
    });
  });

  describe('Device Management', () => {
    it('should receive device updates', async () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      await waitFor(() => {
        expect(result.current.devices.length).toBeGreaterThan(0);
      });

      expect(result.current.devices).toHaveLength(3);
    });

    it('should update devices when callback is triggered', async () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      await waitFor(() => {
        expect(result.current.devices.length).toBe(3);
      });

      const newDevices: UnifiedDevice[] = [
        {
          id: 'device-4',
          name: 'Device 4',
          platform: 'android',
          hasMdns: false,
          hasSignaling: true,
          source: 'signaling',
          ip: null,
          port: null,
          capabilities: {
            supportsPQC: true,
            supportsGroupTransfer: true,
            version: '1.0.0',
          },
          lastSeen: Date.now(),
        },
      ];

      act(() => {
        deviceChangeCallback?.(newDevices);
      });

      await waitFor(() => {
        expect(result.current.devices).toHaveLength(1);
      });
    });

    it('should get device by ID', async () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      await waitFor(() => {
        expect(result.current.devices.length).toBeGreaterThan(0);
      });

      const device = result.current.getDevice('device-1');

      expect(device).toBeDefined();
      expect(device?.name).toBe('Device 1');
    });

    it('should return undefined for non-existent device', () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      const device = result.current.getDevice('non-existent');

      expect(device).toBeUndefined();
    });
  });

  describe('Connection Methods', () => {
    it('should get best connection method for mDNS device', async () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      await waitFor(() => {
        expect(result.current.devices.length).toBeGreaterThan(0);
      });

      const method = result.current.getBestConnectionMethod('device-1');

      expect(method).toBe('direct');
    });

    it('should get best connection method for signaling-only device', async () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      await waitFor(() => {
        expect(result.current.devices.length).toBeGreaterThan(0);
      });

      const method = result.current.getBestConnectionMethod('device-2');

      expect(method).toBe('signaling');
    });

    it('should return null for non-existent device', () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      const method = result.current.getBestConnectionMethod('non-existent');

      expect(method).toBeNull();
    });
  });

  describe('Advertising', () => {
    it('should advertise device', () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      act(() => {
        result.current.advertise();
      });

      expect(mockUnifiedDiscovery.advertise).toHaveBeenCalled();
    });

    it('should stop advertising', () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      act(() => {
        result.current.stopAdvertising();
      });

      expect(mockUnifiedDiscovery.stopAdvertising).toHaveBeenCalled();
    });
  });

  describe('Status Information', () => {
    it('should provide discovery status', async () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      await act(async () => {
        await result.current.startDiscovery();
      });

      await waitFor(() => {
        expect(result.current.isDiscovering).toBe(true);
        expect(result.current.isMdnsAvailable).toBe(true);
        expect(result.current.isSignalingConnected).toBe(true);
      });
    });

    it('should provide device counts', async () => {
      const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      await act(async () => {
        await result.current.startDiscovery();
      });

      await waitFor(() => {
        expect(result.current.mdnsDeviceCount).toBe(2);
        expect(result.current.signalingDeviceCount).toBe(2);
      });
    });
  });

  describe('Filtering', () => {
    it('should filter devices by source (mdns)', async () => {
      const { result } = renderHook(() =>
        useUnifiedDiscovery({ autoStart: false, sourceFilter: 'mdns' })
      );

      await waitFor(() => {
        expect(result.current.devices.length).toBeGreaterThan(0);
      });

      // Should only show devices with hasMdns = true
      expect(result.current.devices.every(d => d.hasMdns)).toBe(true);
    });

    it('should filter devices by source (signaling)', async () => {
      const { result } = renderHook(() =>
        useUnifiedDiscovery({ autoStart: false, sourceFilter: 'signaling' })
      );

      await waitFor(() => {
        expect(result.current.devices.length).toBeGreaterThan(0);
      });

      // Should only show devices with hasSignaling = true
      expect(result.current.devices.every(d => d.hasSignaling)).toBe(true);
    });

    it('should filter devices by source (both)', async () => {
      const { result } = renderHook(() =>
        useUnifiedDiscovery({ autoStart: false, sourceFilter: 'both' })
      );

      await waitFor(() => {
        expect(result.current.devices.length).toBeGreaterThan(0);
      });

      // Should only show devices with both hasMdns and hasSignaling = true
      expect(result.current.devices.every(d => d.hasMdns && d.hasSignaling)).toBe(true);
    });

    it('should filter devices by capability (PQC)', async () => {
      const { result } = renderHook(() =>
        useUnifiedDiscovery({
          autoStart: false,
          capabilityFilter: { supportsPQC: true },
        })
      );

      await waitFor(() => {
        expect(result.current.devices.length).toBeGreaterThan(0);
      });

      // Should only show devices that support PQC
      expect(result.current.devices.every(d => d.capabilities?.supportsPQC)).toBe(true);
    });

    it('should filter devices by capability (Group Transfer)', async () => {
      const { result } = renderHook(() =>
        useUnifiedDiscovery({
          autoStart: false,
          capabilityFilter: { supportsGroupTransfer: true },
        })
      );

      await waitFor(() => {
        expect(result.current.devices.length).toBeGreaterThan(0);
      });

      // Should only show devices that support group transfer
      expect(result.current.devices.every(d => d.capabilities?.supportsGroupTransfer)).toBe(true);
    });

    it('should filter by multiple criteria', async () => {
      const { result } = renderHook(() =>
        useUnifiedDiscovery({
          autoStart: false,
          sourceFilter: 'mdns',
          capabilityFilter: { supportsPQC: true },
        })
      );

      await waitFor(() => {
        expect(result.current.devices.length).toBeGreaterThan(0);
      });

      // Should show devices that are mDNS and support PQC
      expect(
        result.current.devices.every(d => d.hasMdns && d.capabilities?.supportsPQC)
      ).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from device changes on unmount', () => {
      const { unmount } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

      expect(mockUnifiedDiscovery.onDevicesChanged).toHaveBeenCalled();

      unmount();

      // Callback should be cleared
      expect(deviceChangeCallback).toBeNull();
    });
  });
});

describe('useMdnsDiscovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deviceChangeCallback = null;
  });

  it('should only use mDNS discovery', async () => {
    const { result } = renderHook(() => useMdnsDiscovery({ autoStart: false }));

    await waitFor(() => {
      expect(result.current.devices.length).toBeGreaterThan(0);
    });

    // All devices should have mDNS
    expect(result.current.devices.every(d => d.hasMdns)).toBe(true);
  });
});

describe('useSignalingDiscovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deviceChangeCallback = null;
  });

  it('should only use signaling discovery', async () => {
    const { result } = renderHook(() => useSignalingDiscovery({ autoStart: false }));

    await waitFor(() => {
      expect(result.current.devices.length).toBeGreaterThan(0);
    });

    // All devices should have signaling
    expect(result.current.devices.every(d => d.hasSignaling)).toBe(true);
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deviceChangeCallback = null;
  });

  it('should handle empty device list', async () => {
    mockUnifiedDiscovery.onDevicesChanged.mockImplementationOnce((callback) => {
      callback([]);
      return () => {};
    });

    const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

    await waitFor(() => {
      expect(result.current.devices).toEqual([]);
    });
  });

  it('should handle rapid device changes', async () => {
    const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

    await waitFor(() => {
      expect(result.current.devices.length).toBe(3);
    });

    // Simulate rapid updates
    act(() => {
      deviceChangeCallback?.([mockDevices[0]]);
      deviceChangeCallback?.([mockDevices[0], mockDevices[1]]);
      deviceChangeCallback?.(mockDevices);
    });

    await waitFor(() => {
      expect(result.current.devices).toHaveLength(3);
    });
  });

  it('should handle status updates when discovery not started', () => {
    mockUnifiedDiscovery.getStatus.mockReturnValueOnce({
      started: false,
      mdnsAvailable: false,
      signalingConnected: false,
      mdnsDeviceCount: 0,
      signalingDeviceCount: 0,
    });

    const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

    expect(result.current.isDiscovering).toBe(false);
    expect(result.current.isMdnsAvailable).toBe(false);
    expect(result.current.isSignalingConnected).toBe(false);
  });

  it('should handle devices without capabilities', async () => {
    const devicesWithoutCaps: UnifiedDevice[] = [
      {
        id: 'device-no-caps',
        name: 'Device No Caps',
        platform: 'web',
        hasMdns: false,
        hasSignaling: true,
        source: 'signaling',
        ip: null,
        port: null,
        capabilities: undefined,
        lastSeen: Date.now(),
      },
    ];

    mockUnifiedDiscovery.onDevicesChanged.mockImplementationOnce((callback) => {
      callback(devicesWithoutCaps);
      return () => {};
    });

    const { result } = renderHook(() =>
      useUnifiedDiscovery({
        autoStart: false,
        capabilityFilter: { supportsPQC: true },
      })
    );

    await waitFor(() => {
      // Should filter out devices without capabilities
      expect(result.current.devices).toEqual([]);
    });
  });
});
