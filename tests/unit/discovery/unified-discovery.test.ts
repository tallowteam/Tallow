/**
 * Tests for Unified Discovery Manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/discovery/mdns-bridge', () => ({
  getMDNSBridge: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(true),
    disconnect: vi.fn(),
    startDiscovery: vi.fn(),
    stopDiscovery: vi.fn(),
    advertise: vi.fn(),
    stopAdvertising: vi.fn(),
    refreshDevices: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
    getDevices: vi.fn().mockReturnValue([]),
    setEventHandlers: vi.fn(),
  })),
  isDaemonAvailable: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/lib/discovery/local-discovery', () => ({
  getLocalDiscovery: vi.fn(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    refresh: vi.fn(),
    getDevices: vi.fn().mockReturnValue([]),
    onDevicesChanged: vi.fn((callback) => {
      callback([]);
      return () => {};
    }),
  })),
}));

vi.mock('@/lib/auth/user-identity', () => ({
  getDeviceId: vi.fn().mockReturnValue('TEST123456'),
}));

vi.mock('@/lib/utils/secure-logger', () => ({
  default: {
    log: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('UnifiedDiscoveryManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module state
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create manager with default options', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      expect(manager).toBeDefined();
      expect(manager.getDevices()).toEqual([]);
    });

    it('should create manager with custom options', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager({
        enableMdns: false,
        enableSignaling: true,
        preferMdns: false,
      });

      expect(manager).toBeDefined();
    });
  });

  describe('lifecycle', () => {
    it('should start and stop discovery', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      await manager.start();
      expect(manager.getStatus().started).toBe(true);

      manager.stop();
      expect(manager.getStatus().started).toBe(false);
    });

    it('should not start twice', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      await manager.start();
      await manager.start(); // Should be idempotent

      expect(manager.getStatus().started).toBe(true);
    });

    it('should refresh discovery', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      await manager.start();
      await manager.refresh();

      // Should not throw
      expect(manager.getStatus().started).toBe(true);
    });
  });

  describe('device management', () => {
    it('should return empty device list initially', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      expect(manager.getDevices()).toEqual([]);
    });

    it('should return undefined for non-existent device', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      expect(manager.getDevice('non-existent')).toBeUndefined();
    });

    it('should return empty mDNS devices list', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      expect(manager.getMdnsDevices()).toEqual([]);
    });

    it('should return empty signaling devices list', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      expect(manager.getSignalingDevices()).toEqual([]);
    });
  });

  describe('connection methods', () => {
    it('should return null for non-existent device connection method', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      expect(manager.getBestConnectionMethod('non-existent')).toBeNull();
    });

    it('should return null for direct connection of non-existent device', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      expect(manager.getDirectConnectionInfo('non-existent')).toBeNull();
    });

    it('should return null for signaling connection of non-existent device', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      expect(manager.getSignalingConnectionInfo('non-existent')).toBeNull();
    });
  });

  describe('status', () => {
    it('should report correct initial status', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      const status = manager.getStatus();

      expect(status.started).toBe(false);
      expect(status.deviceCount).toBe(0);
    });

    it('should report mDNS unavailable by default', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      expect(manager.isMdnsAvailable()).toBe(false);
    });
  });

  describe('event handling', () => {
    it('should notify listeners on device change', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      const listener = vi.fn();
      const unsubscribe = manager.onDevicesChanged(listener);

      // Listener should be called immediately with current devices
      expect(listener).toHaveBeenCalledWith([]);

      unsubscribe();
    });

    it('should allow unsubscribing', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      const listener = vi.fn();
      const unsubscribe = manager.onDevicesChanged(listener);

      unsubscribe();

      // After unsubscribe, listener should not be called again
      // (we can't easily test this without triggering device changes)
    });
  });

  describe('cleanup', () => {
    it('should destroy manager properly', async () => {
      const { UnifiedDiscoveryManager } = await import('@/lib/discovery/unified-discovery');
      const manager = new UnifiedDiscoveryManager();

      await manager.start();
      manager.destroy();

      expect(manager.getStatus().started).toBe(false);
      expect(manager.getDevices()).toEqual([]);
    });
  });
});

describe('getUnifiedDiscovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should return singleton instance', async () => {
    const { getUnifiedDiscovery, resetUnifiedDiscovery } = await import('@/lib/discovery/unified-discovery');

    resetUnifiedDiscovery();

    const instance1 = getUnifiedDiscovery();
    const instance2 = getUnifiedDiscovery();

    expect(instance1).toBe(instance2);
  });

  it('should allow resetting singleton', async () => {
    const { getUnifiedDiscovery, resetUnifiedDiscovery } = await import('@/lib/discovery/unified-discovery');

    const instance1 = getUnifiedDiscovery();
    resetUnifiedDiscovery();
    const instance2 = getUnifiedDiscovery();

    expect(instance1).not.toBe(instance2);
  });
});
