/**
 * Onion Routing Integration Tests
 * Unit tests for onion routing functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the relay client to prevent actual network connections
vi.mock('@/lib/relay/relay-client', () => {
  const mockClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    cleanup: vi.fn().mockResolvedValue(undefined),
    send: vi.fn().mockResolvedValue(undefined),
    sendData: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    on: vi.fn(),
    off: vi.fn(),
    removeAllListeners: vi.fn(),
    buildCircuit: vi.fn().mockResolvedValue({
      id: 'test-circuit',
      path: [],
      layerKeys: [],
      createdAt: Date.now(),
      established: true,
    }),
  };
  return {
    RelayClient: vi.fn().mockImplementation(() => mockClient),
    getRelayClient: vi.fn(() => mockClient),
  };
});

// Mock relay directory to return predictable test relays
const mockRelays = [
  {
    id: 'relay-1',
    endpoint: 'wss://relay1.test',
    publicKey: { kyberPublicKey: new Uint8Array(32), x25519PublicKey: new Uint8Array(32) },
    publicKeyBase64: 'test-key-1',
    roles: ['entry', 'middle', 'exit'],
    region: 'us-east',
    trustScore: 0.98,
    bandwidth: 100000000,
    latency: 50,
    online: true,
    lastSeen: Date.now(),
    version: '1.0.0',
  },
  {
    id: 'relay-2',
    endpoint: 'wss://relay2.test',
    publicKey: { kyberPublicKey: new Uint8Array(32), x25519PublicKey: new Uint8Array(32) },
    publicKeyBase64: 'test-key-2',
    roles: ['entry', 'middle', 'exit'],
    region: 'eu-west',
    trustScore: 0.96,
    bandwidth: 80000000,
    latency: 80,
    online: true,
    lastSeen: Date.now(),
    version: '1.0.0',
  },
  {
    id: 'relay-3',
    endpoint: 'wss://relay3.test',
    publicKey: { kyberPublicKey: new Uint8Array(32), x25519PublicKey: new Uint8Array(32) },
    publicKeyBase64: 'test-key-3',
    roles: ['entry', 'middle', 'exit'],
    region: 'ap-south',
    trustScore: 0.94,
    bandwidth: 60000000,
    latency: 120,
    online: true,
    lastSeen: Date.now(),
    version: '1.0.0',
  },
];

vi.mock('@/lib/relay/relay-directory', () => {
  const mockDirectory = {
    fetchRelays: vi.fn().mockResolvedValue(mockRelays),
    startHealthCheck: vi.fn(),
    stopHealthCheck: vi.fn(),
    cleanup: vi.fn().mockResolvedValue(undefined),
    getHealthyRelays: vi.fn().mockReturnValue(mockRelays),
    on: vi.fn(),
    off: vi.fn(),
    removeAllListeners: vi.fn(),
  };
  return {
    RelayDirectoryService: vi.fn().mockImplementation(() => mockDirectory),
    getRelayDirectory: vi.fn(() => mockDirectory),
  };
});

// Mock the entire relay module
vi.mock('@/lib/relay', () => {
  const mockClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    cleanup: vi.fn().mockResolvedValue(undefined),
    send: vi.fn().mockResolvedValue(undefined),
    sendData: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    on: vi.fn(),
    off: vi.fn(),
    removeAllListeners: vi.fn(),
    buildCircuit: vi.fn().mockResolvedValue({
      id: 'test-circuit',
      path: [],
      layerKeys: [],
      createdAt: Date.now(),
      established: true,
    }),
  };
  const mockDirectory = {
    fetchRelays: vi.fn().mockResolvedValue([]),
    startHealthCheck: vi.fn(),
    stopHealthCheck: vi.fn(),
    cleanup: vi.fn().mockResolvedValue(undefined),
    getHealthyRelays: vi.fn().mockReturnValue([]),
    on: vi.fn(),
    off: vi.fn(),
    removeAllListeners: vi.fn(),
  };
  return {
    getRelayClient: vi.fn(() => mockClient),
    getRelayDirectory: vi.fn(() => mockDirectory),
    RelayClient: vi.fn().mockImplementation(() => mockClient),
    RelayDirectoryService: vi.fn().mockImplementation(() => mockDirectory),
  };
});

import {
  OnionRoutingManager,
  DEFAULT_ONION_CONFIG,
  getOnionRoutingManager,
  initializeOnionRouting,
  cleanupOnionRouting,
} from '@/lib/transport/onion-routing-integration';

describe('OnionRoutingManager', () => {
  let manager: OnionRoutingManager;

  beforeEach(() => {
    manager = new OnionRoutingManager();
  });

  afterEach(async () => {
    await manager.cleanup();
  });

  describe('Initialization', () => {
    it('initializes with default config', () => {
      expect(manager.getConfig()).toEqual(DEFAULT_ONION_CONFIG);
    });

    it('initializes with custom config', () => {
      const customManager = new OnionRoutingManager({ mode: 'multi-hop', numHops: 5 });
      const config = customManager.getConfig();
      expect(config.mode).toBe('multi-hop');
      expect(config.numHops).toBe(5);
    });

    it('fetches relay nodes on initialization', async () => {
      await manager.initialize();
      const nodes = manager.getRelayNodes();
      expect(nodes.length).toBeGreaterThan(0);
    });

    it('emits initialized event', async () => {
      const initSpy = vi.fn();
      manager.on('initialized', initSpy);

      await manager.initialize();
      expect(initSpy).toHaveBeenCalled();
    });

    it('does not initialize twice', async () => {
      await manager.initialize();
      const nodes1 = manager.getRelayNodes();

      await manager.initialize();
      const nodes2 = manager.getRelayNodes();

      expect(nodes1).toEqual(nodes2);
    });
  });

  describe('Configuration', () => {
    it('updates configuration', () => {
      manager.updateConfig({ mode: 'single-hop' });
      expect(manager.getConfig().mode).toBe('single-hop');
    });

    it('emits configUpdated event', () => {
      const spy = vi.fn();
      manager.on('configUpdated', spy);

      manager.updateConfig({ numHops: 4 });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ numHops: 4 })
      );
    });

    it('preserves other config values when updating', () => {
      const originalConfig = manager.getConfig();
      manager.updateConfig({ numHops: 4 });

      const newConfig = manager.getConfig();
      expect(newConfig.mode).toBe(originalConfig.mode);
      expect(newConfig.numHops).toBe(4);
    });
  });

  describe('Relay Path Selection', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('selects optimal relay path', async () => {
      const path = await manager.selectRelayPath(3);
      expect(path).toHaveLength(3);
      expect(path[0]).toHaveProperty('id');
      expect(path[0]).toHaveProperty('address');
      expect(path[0]).toHaveProperty('publicKey');
    });

    it('throws error if insufficient nodes', async () => {
      await expect(manager.selectRelayPath(10)).rejects.toThrow(
        'Insufficient relay nodes'
      );
    });

    it('emits pathSelected event', async () => {
      const spy = vi.fn();
      manager.on('pathSelected', spy);

      await manager.selectRelayPath(2);
      expect(spy).toHaveBeenCalled();
    });

    it('filters nodes by trust score', async () => {
      manager.updateConfig({ minTrustScore: 0.95 });
      const path = await manager.selectRelayPath(1);

      expect(path[0]!.trustScore).toBeGreaterThanOrEqual(0.95);
    });

    it('filters nodes by latency', async () => {
      manager.updateConfig({ maxLatency: 100 });
      const path = await manager.selectRelayPath(1);

      expect(path[0]!.latency).toBeLessThanOrEqual(100);
    });

    it('uses random selection strategy', async () => {
      manager.updateConfig({ relaySelectionStrategy: 'random' });
      const path = await manager.selectRelayPath(3);

      expect(path).toHaveLength(3);
    });

    it('uses optimal selection strategy', async () => {
      manager.updateConfig({ relaySelectionStrategy: 'optimal' });
      const path = await manager.selectRelayPath(3);

      expect(path).toHaveLength(3);
      // First node should have highest composite score
    });

    it('uses regional selection strategy', async () => {
      manager.updateConfig({
        relaySelectionStrategy: 'regional',
        preferredRegions: ['us-east'],
      });
      const path = await manager.selectRelayPath(1);

      expect(path).toHaveLength(1);
    });
  });

  describe('Onion Layers', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('creates onion layers', async () => {
      const data = new ArrayBuffer(100);
      const path = await manager.selectRelayPath(3);
      const layers = await manager.createOnionLayers(data, path);

      expect(layers).toHaveLength(3);
      expect(layers[0]).toHaveProperty('nodeId');
      expect(layers[0]).toHaveProperty('encryptedData');
      expect(layers[0]).toHaveProperty('iv');
      expect(layers[0]).toHaveProperty('mac');
    });

    it('peels onion layer', async () => {
      const data = new ArrayBuffer(100);
      const path = await manager.selectRelayPath(1);
      const layers = await manager.createOnionLayers(data, path);

      const firstLayer = layers[0];
      if (firstLayer) {
        const result = await manager.peelOnionLayer(firstLayer);
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('nextNodeId');
      }
    });
  });

  describe('Data Routing', () => {
    beforeEach(async () => {
      await manager.initialize();
      manager.updateConfig({ mode: 'multi-hop' });
    });

    it('throws error if routing is disabled', async () => {
      manager.updateConfig({ mode: 'disabled' });

      await expect(
        manager.routeThroughOnion('test-1', new ArrayBuffer(100), 'destination')
      ).rejects.toThrow('Onion routing is disabled');
    });

    it('routes data through onion network', async () => {
      const data = new ArrayBuffer(100);

      await expect(
        manager.routeThroughOnion('test-2', data, 'destination')
      ).resolves.not.toThrow();
    });

    it('emits transferComplete event on success', async () => {
      const spy = vi.fn();
      manager.on('transferComplete', spy);

      await manager.routeThroughOnion('test-3', new ArrayBuffer(100), 'dest');

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          transferId: 'test-3',
          path: expect.any(Array),
        })
      );
    });

    it('updates statistics on transfer', async () => {
      const statsBefore = manager.getStats();
      await manager.routeThroughOnion('test-4', new ArrayBuffer(100), 'dest');
      const statsAfter = manager.getStats();

      expect(statsAfter.totalTransfers).toBe(statsBefore.totalTransfers + 1);
      expect(statsAfter.successfulTransfers).toBe(
        statsBefore.successfulTransfers + 1
      );
      expect(statsAfter.bytesTransferred).toBeGreaterThan(
        statsBefore.bytesTransferred
      );
    });

    it('tracks active paths during transfer', async () => {
      const promise = manager.routeThroughOnion('test-5', new ArrayBuffer(100), 'dest');

      // Path should be active during transfer
      // (In real implementation, this would be checked mid-transfer)

      await promise;

      // Path should be removed after transfer
      const activePaths = manager.getActivePaths();
      expect(activePaths.has('test-5')).toBe(false);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await manager.initialize();
      manager.updateConfig({ mode: 'multi-hop' });
    });

    it('returns initial statistics', () => {
      const stats = manager.getStats();
      expect(stats.totalTransfers).toBe(0);
      expect(stats.successfulTransfers).toBe(0);
      expect(stats.failedTransfers).toBe(0);
      expect(stats.averageLatency).toBe(0);
    });

    it('updates average latency', async () => {
      await manager.routeThroughOnion('test-6', new ArrayBuffer(100), 'dest');
      const stats = manager.getStats();

      expect(stats.averageLatency).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('clears all data on cleanup', async () => {
      await manager.cleanup();

      expect(manager.getRelayNodes()).toHaveLength(0);
      expect(manager.getActivePaths().size).toBe(0);
    });

    it('removes all listeners on cleanup', async () => {
      const spy = vi.fn();
      manager.on('initialized', spy);

      await manager.cleanup();
      manager.emit('initialized');

      expect(spy).not.toHaveBeenCalled();
    });
  });
});

describe('Global Manager Functions', () => {
  afterEach(async () => {
    await cleanupOnionRouting();
  });

  it('returns global manager instance', () => {
    const manager1 = getOnionRoutingManager();
    const manager2 = getOnionRoutingManager();

    expect(manager1).toBe(manager2);
  });

  it('initializes global manager', async () => {
    const manager = await initializeOnionRouting({ mode: 'single-hop' });

    expect(manager).toBeDefined();
    expect(manager.getConfig().mode).toBe('single-hop');
  });

  it('cleans up global manager', async () => {
    await initializeOnionRouting();
    await cleanupOnionRouting();

    // Should create new instance after cleanup
    const manager = getOnionRoutingManager();
    expect(manager.getRelayNodes()).toHaveLength(0);
  });
});
