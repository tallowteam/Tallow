/**
 * OnionRoutingManager Integration Tests
 *
 * Comprehensive integration tests that verify OnionRoutingManager works
 * with mock relay infrastructure, testing the full flow from initialization
 * through circuit building and data routing.
 *
 * Test coverage (44 tests):
 * - Setup: Mock RelayDirectoryService with predictable relay nodes
 * - Initialization: bootstrap relays, config updates, event emission
 * - Circuit Building: selectRelayPath, createOnionLayers, path diversity
 * - Data Routing: routeThroughOnion with mock relay, stats updates, failure handling
 * - Edge Cases: insufficient relays, disabled mode, cleanup
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable security/detect-object-injection */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';

// ============================================================================
// Mock Modules - must be at top level before any imports
// ============================================================================

// Create global test storage accessible from mock factory
const createGlobalTestStorage = () => {
  if (!(globalThis as any).__onionTestStore) {
    (globalThis as any).__onionTestStore = {
      relays: new Map(),
      circuits: new Map(),
      circuitIdCounter: 0,
    };
  }
  return (globalThis as any).__onionTestStore;
};

vi.mock('@/lib/relay', () => {
  // Create relay storage
  interface RelayInfo {
    id: string;
    publicKey: { kyberPublicKey: Uint8Array; x25519PublicKey: Uint8Array };
    publicKeyBase64: string;
    endpoint: string;
    roles: string[];
    region: string;
    trustScore: number;
    bandwidth: number;
    latency: number;
    online: boolean;
    lastSeen: number;
    version: string;
  }

  interface Circuit {
    id: string;
    hops: Array<{ relay: RelayInfo; layerKey: Uint8Array }>;
    state: string;
    createdAt: number;
    destination: string;
  }

  // Access global storage
  const getStore = () => {
    if (!(globalThis as any).__onionTestStore) {
      (globalThis as any).__onionTestStore = {
        relays: new Map<string, RelayInfo>(),
        circuits: new Map<string, Circuit>(),
        circuitIdCounter: 0,
      };
    }
    return (globalThis as any).__onionTestStore;
  };

  const mockRelayDirectory = {
    isInitialized: false,
    initialize: vi.fn(async () => {
      mockRelayDirectory.isInitialized = true;
    }),
    refreshDirectory: vi.fn(async () => {}),
    getRelays: vi.fn(() => {
      const store = getStore();
      return Array.from(store.relays.values()).filter((r: RelayInfo) => r.online);
    }),
    getRelay: vi.fn((id: string) => {
      const store = getStore();
      return store.relays.get(id) || null;
    }),
    cleanup: vi.fn(() => {
      mockRelayDirectory.isInitialized = false;
    }),
  };

  const mockRelayClient = {
    buildCircuit: vi.fn(async (path: RelayInfo[], destination: string) => {
      const store = getStore();
      store.circuitIdCounter++;
      const circuitId = `circuit-${store.circuitIdCounter}`;
      const circuit: Circuit = {
        id: circuitId,
        hops: path.map((relay) => ({
          relay,
          layerKey: new Uint8Array(32).fill(4),
        })),
        state: 'ready',
        createdAt: Date.now(),
        destination,
      };
      store.circuits.set(circuitId, circuit);
      return circuit;
    }),
    sendThroughCircuit: vi.fn(async () => {}),
    destroyCircuit: vi.fn(async (circuit: Circuit) => {
      const store = getStore();
      store.circuits.delete(circuit.id);
    }),
    cleanup: vi.fn(async () => {
      const store = getStore();
      store.circuits.clear();
    }),
  };

  return {
    getRelayDirectory: vi.fn(() => mockRelayDirectory),
    getRelayClient: vi.fn(() => mockRelayClient),
  };
});

vi.mock('@/lib/transport/onion-routing', () => {
  const { EventEmitter } = require('events');

  // Access global storage for circuits
  const getStore = () => {
    if (!(globalThis as any).__onionTestStore) {
      (globalThis as any).__onionTestStore = {
        relays: new Map(),
        circuits: new Map(),
        circuitIdCounter: 0,
      };
    }
    return (globalThis as any).__onionTestStore;
  };

  class MockOnionRouter extends EventEmitter {
    private static _instance: MockOnionRouter | null = null;
    private circuits = new Map();
    private config = { enabled: false, hopCount: 3, randomPath: true };
    private isInitialized = false;
    private relayCache: any[] = [];

    static getInstance() {
      if (!MockOnionRouter._instance) {
        MockOnionRouter._instance = new MockOnionRouter();
      }
      return MockOnionRouter._instance;
    }

    static resetInstance() {
      MockOnionRouter._instance = null;
    }

    async initialize() {
      if (this.isInitialized) {return;}
      const store = getStore();
      this.relayCache = Array.from(store.relays.values()).filter((r: any) => r.online);
      this.isInitialized = true;
    }

    isEnabled() {
      return this.config.enabled;
    }

    isAvailable() {
      return this.isInitialized && this.relayCache.length >= this.config.hopCount;
    }

    setConfig(config: any) {
      this.config = { ...this.config, ...config };
    }

    getConfig() {
      return { ...this.config };
    }

    async createCircuit(_destination: string) {
      if (!this.config.enabled) {return null;}
      const store = getStore();
      store.circuitIdCounter++;
      const circuitId = `circuit-${store.circuitIdCounter}`;

      // Get path from relay cache
      const path = this.relayCache.slice(0, this.config.hopCount);

      const circuit = {
        id: circuitId,
        path,
        layerKeys: path.map(() => new Uint8Array(32).fill(4)),
        createdAt: Date.now(),
        established: true,
        hops: path.map((relay: any) => ({
          relay,
          layerKey: new Uint8Array(32).fill(4),
        })),
        state: 'ready',
        _internal: { id: circuitId, state: 'ready', path, hops: path.map((r: any) => ({ relay: r, layerKey: new Uint8Array(32) })) },
      };

      this.circuits.set(circuitId, circuit);
      return circuit;
    }

    async sendThroughCircuit(circuitId: string, payload: Uint8Array, _destination: string) {
      const circuit = this.circuits.get(circuitId);
      if (!circuit) {return null;}
      return { encryptedPayload: payload, totalSize: payload.length, circuitId };
    }

    closeCircuit(circuitId: string) {
      this.circuits.delete(circuitId);
    }

    closeAllCircuits() {
      this.circuits.clear();
    }

    async cleanup() {
      this.closeAllCircuits();
      this.relayCache = [];
      this.isInitialized = false;
    }
  }

  return {
    OnionRouter: MockOnionRouter,
    getOnionRoutingStatus: vi.fn(() => ({
      available: true,
      status: 'ready',
      message: 'Mock ready',
      relayCount: 6,
      circuitCount: 0,
    })),
    enableOnionRouting: vi.fn(async (config?: any) => {
      const router = MockOnionRouter.getInstance();
      await router.initialize();
      router.setConfig({ ...config, enabled: true });
      return router;
    }),
    disableOnionRouting: vi.fn(() => {
      const router = MockOnionRouter.getInstance();
      router.setConfig({ enabled: false });
      router.closeAllCircuits();
    }),
  };
});

// ============================================================================
// Imports (after mocks)
// ============================================================================

import {
  OnionRoutingManager,
  getOnionRoutingManager,
  initializeOnionRouting,
  cleanupOnionRouting,
} from '@/lib/transport/onion-routing-integration';

import { getRelayDirectory, getRelayClient } from '@/lib/relay';

// ============================================================================
// Test Helpers
// ============================================================================

interface MockRelayInfo {
  id: string;
  publicKey: { kyberPublicKey: Uint8Array; x25519PublicKey: Uint8Array };
  publicKeyBase64: string;
  endpoint: string;
  roles: string[];
  region: string;
  trustScore: number;
  bandwidth: number;
  latency: number;
  online: boolean;
  lastSeen: number;
  version: string;
}

function createMockRelay(
  id: string,
  region: string,
  trustScore: number,
  latency: number,
  bandwidth: number,
  online = true
): MockRelayInfo {
  return {
    id,
    publicKey: {
      kyberPublicKey: new Uint8Array(1184).fill(1),
      x25519PublicKey: new Uint8Array(32).fill(2),
    },
    publicKeyBase64: 'mockBase64Key',
    endpoint: `wss://relay-${id}.test`,
    roles: ['entry', 'middle', 'exit'],
    region,
    trustScore,
    bandwidth,
    latency,
    online,
    lastSeen: Date.now(),
    version: 'test-1.0.0',
  };
}

function getBootstrapRelays(): MockRelayInfo[] {
  return [
    createMockRelay('relay-us-1', 'us-east', 0.95, 50, 100 * 1024 * 1024),
    createMockRelay('relay-us-2', 'us-west', 0.90, 75, 80 * 1024 * 1024),
    createMockRelay('relay-eu-1', 'eu-west', 0.92, 100, 90 * 1024 * 1024),
    createMockRelay('relay-eu-2', 'eu-central', 0.88, 120, 70 * 1024 * 1024),
    createMockRelay('relay-ap-1', 'ap-south', 0.85, 150, 60 * 1024 * 1024),
    createMockRelay('relay-ap-2', 'ap-east', 0.80, 200, 50 * 1024 * 1024),
  ];
}

function getTestStore() {
  return createGlobalTestStorage();
}

function resetTestStore() {
  const store = getTestStore();
  store.relays.clear();
  store.circuits.clear();
  store.circuitIdCounter = 0;
  getBootstrapRelays().forEach(r => store.relays.set(r.id, r));
}

// ============================================================================
// Test Suites
// ============================================================================

describe('OnionRoutingManager Integration Tests', () => {
  let manager: OnionRoutingManager;

  beforeEach(() => {
    vi.clearAllMocks();
    resetTestStore();
    manager = new OnionRoutingManager();
  });

  afterEach(async () => {
    await manager.cleanup();
    await cleanupOnionRouting();
  });

  // =========================================================================
  // 1. SETUP TESTS (3 tests)
  // =========================================================================

  describe('Setup: Mock RelayDirectoryService', () => {
    it('should provide predictable relay nodes from mock directory', async () => {
      await manager.initialize();
      const relays = manager.getRelayNodes();

      expect(relays.length).toBe(6);
      expect(relays.map(r => r.id)).toContain('relay-us-1');
      expect(relays.map(r => r.id)).toContain('relay-eu-1');
      expect(relays.map(r => r.id)).toContain('relay-ap-1');
    });

    it('should allow adding relays to mock directory', async () => {
      const store = getTestStore();
      const newRelay = createMockRelay('relay-test-1', 'test-region', 0.99, 10, 200 * 1024 * 1024);
      store.relays.set(newRelay.id, newRelay);

      await manager.initialize();
      const relays = manager.getRelayNodes();

      expect(relays.length).toBe(7);
      expect(relays.find(r => r.id === 'relay-test-1')).toBeDefined();
    });

    it('should allow removing relays from mock directory', async () => {
      const store = getTestStore();
      store.relays.delete('relay-ap-2');

      await manager.initialize();
      const relays = manager.getRelayNodes();

      expect(relays.length).toBe(5);
      expect(relays.find(r => r.id === 'relay-ap-2')).toBeUndefined();
    });
  });

  // =========================================================================
  // 2. INITIALIZATION TESTS (6 tests)
  // =========================================================================

  describe('Initialization Tests', () => {
    it('should bootstrap relays on initialization', async () => {
      await manager.initialize();

      // Verify relays were loaded
      const relays = manager.getRelayNodes();
      expect(relays.length).toBeGreaterThan(0);
      expect(relays.length).toBe(6); // Bootstrap relays count
    });

    it('should propagate config updates correctly', async () => {
      await manager.initialize();

      manager.updateConfig({
        mode: 'multi-hop',
        numHops: 5,
        preferredRegions: ['us-east', 'eu-west'],
      });

      const config = manager.getConfig();
      expect(config.mode).toBe('multi-hop');
      expect(config.numHops).toBe(5);
      expect(config.preferredRegions).toContain('us-east');
    });

    it('should emit initialized event on successful init', async () => {
      const initSpy = vi.fn();
      manager.on('initialized', initSpy);

      await manager.initialize();

      expect(initSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit configUpdated event when config changes', async () => {
      const configSpy = vi.fn();
      manager.on('configUpdated', configSpy);

      manager.updateConfig({ mode: 'single-hop' });

      expect(configSpy).toHaveBeenCalledWith(expect.objectContaining({ mode: 'single-hop' }));
    });

    it('should emit relaysUpdated event after fetching relays', async () => {
      const relaysSpy = vi.fn();
      manager.on('relaysUpdated', relaysSpy);

      await manager.initialize();

      expect(relaysSpy).toHaveBeenCalledWith(expect.any(Array));
      expect(relaysSpy.mock.calls[0][0].length).toBe(6);
    });

    it('should not re-initialize if already initialized', async () => {
      const directory = getRelayDirectory();
      await manager.initialize();
      const initCount1 = (directory.initialize as Mock).mock.calls.length;

      await manager.initialize();
      const initCount2 = (directory.initialize as Mock).mock.calls.length;

      expect(initCount2).toBe(initCount1);
    });
  });

  // =========================================================================
  // 3. CIRCUIT BUILDING TESTS (9 tests)
  // =========================================================================

  describe('Circuit Building Tests', () => {
    beforeEach(async () => {
      await manager.initialize();
      manager.updateConfig({ mode: 'multi-hop', numHops: 3 });
    });

    it('should select correct number of hops for relay path', async () => {
      const path = await manager.selectRelayPath(3);
      expect(path).toHaveLength(3);
    });

    it('should select single hop when requested', async () => {
      const path = await manager.selectRelayPath(1);
      expect(path).toHaveLength(1);
      expect(path[0]!.id).toBeDefined();
    });

    it('should create properly nested onion layers', async () => {
      const data = new ArrayBuffer(256);
      const path = await manager.selectRelayPath(3);
      const layers = await manager.createOnionLayers(data, path);

      expect(layers).toHaveLength(3);
      layers.forEach((layer, index) => {
        expect(layer.nodeId).toBe(path[index]!.id);
        expect(layer.iv).toBeInstanceOf(Uint8Array);
        expect(layer.iv.length).toBe(12);
        expect(layer.mac).toBeInstanceOf(Uint8Array);
        expect(layer.encryptedData).toBeDefined();
      });
    });

    it('should ensure path diversity with no relay reuse', async () => {
      const path = await manager.selectRelayPath(5);
      const uniqueIds = new Set(path.map(r => r.id));
      expect(uniqueIds.size).toBe(5);
    });

    it('should support regional selection strategy', async () => {
      const store = getTestStore();
      store.relays.set('relay-us-3', createMockRelay('relay-us-3', 'us-east', 0.90, 60, 80 * 1024 * 1024));

      await manager.refreshRelays();

      manager.updateConfig({
        relaySelectionStrategy: 'regional',
        preferredRegions: ['us-east', 'eu-west', 'ap-south'],
      });

      const path = await manager.selectRelayPath(3);
      expect(path).toHaveLength(3);
    });

    it('should filter by minimum trust score', async () => {
      manager.updateConfig({ minTrustScore: 0.90 });

      const path = await manager.selectRelayPath(2);

      path.forEach(relay => {
        expect(relay.trustScore).toBeGreaterThanOrEqual(0.90);
      });
    });

    it('should filter by maximum latency', async () => {
      manager.updateConfig({ maxLatency: 100 });

      const path = await manager.selectRelayPath(2);

      path.forEach(relay => {
        expect(relay.latency).toBeLessThanOrEqual(100);
      });
    });

    it('should filter by minimum bandwidth', async () => {
      manager.updateConfig({ minBandwidth: 70 * 1024 * 1024 });

      const path = await manager.selectRelayPath(3);

      path.forEach(relay => {
        expect(relay.bandwidth).toBeGreaterThanOrEqual(70 * 1024 * 1024);
      });
    });

    it('should use random selection strategy', async () => {
      manager.updateConfig({ relaySelectionStrategy: 'random' });

      const path = await manager.selectRelayPath(3);
      expect(path).toHaveLength(3);
    });
  });

  // =========================================================================
  // 4. DATA ROUTING TESTS (9 tests)
  // =========================================================================

  describe('Data Routing Tests', () => {
    beforeEach(async () => {
      await manager.initialize();
      manager.updateConfig({ mode: 'multi-hop', numHops: 3 });
    });

    it('should route data through onion network with mock relay', async () => {
      const data = new ArrayBuffer(1024);
      const transferId = 'transfer-test-1';

      await expect(
        manager.routeThroughOnion(transferId, data, 'peer-destination')
      ).resolves.not.toThrow();

      // Verify stats were updated
      const stats = manager.getStats();
      expect(stats.totalTransfers).toBeGreaterThan(0);
      expect(stats.successfulTransfers).toBeGreaterThan(0);
    });

    it('should update stats after successful transfer', async () => {
      const statsBefore = manager.getStats();

      await manager.routeThroughOnion('transfer-stats-1', new ArrayBuffer(512), 'dest');

      const statsAfter = manager.getStats();
      expect(statsAfter.totalTransfers).toBe(statsBefore.totalTransfers + 1);
      expect(statsAfter.successfulTransfers).toBe(statsBefore.successfulTransfers + 1);
      expect(statsAfter.bytesTransferred).toBe(statsBefore.bytesTransferred + 512);
    });

    it('should increment totalTransfers on each routing call', async () => {
      const statsBefore = manager.getStats();

      await manager.routeThroughOnion('transfer-count-1', new ArrayBuffer(256), 'dest');
      await manager.routeThroughOnion('transfer-count-2', new ArrayBuffer(256), 'dest');

      const statsAfter = manager.getStats();
      expect(statsAfter.totalTransfers).toBe(statsBefore.totalTransfers + 2);
    });

    it('should emit transferComplete event on success', async () => {
      const completeSpy = vi.fn();
      manager.on('transferComplete', completeSpy);

      await manager.routeThroughOnion('transfer-event-1', new ArrayBuffer(128), 'dest');

      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          transferId: 'transfer-event-1',
          destination: 'dest',
          bytesTransferred: 128,
        })
      );
    });

    it('should emit transferComplete with correct bytes', async () => {
      const completeSpy = vi.fn();
      manager.on('transferComplete', completeSpy);

      await manager.routeThroughOnion('bytes-test', new ArrayBuffer(256), 'dest');

      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          transferId: 'bytes-test',
          bytesTransferred: 256,
        })
      );
    });

    it('should track active circuits during transfer', async () => {
      const statsInitial = manager.getStats();
      expect(statsInitial.circuitsActive).toBe(0);

      await manager.routeThroughOnion('transfer-circuit-1', new ArrayBuffer(100), 'dest');

      const statsAfter = manager.getStats();
      expect(statsAfter.circuitsBuilt).toBeGreaterThan(0);
    });

    it('should reuse circuit for same transferId', async () => {
      const client = getRelayClient();

      await manager.routeThroughOnion('reuse-transfer', new ArrayBuffer(100), 'dest');
      const buildCount1 = (client.buildCircuit as Mock).mock.calls.length;

      await manager.routeThroughOnion('reuse-transfer', new ArrayBuffer(100), 'dest');
      const buildCount2 = (client.buildCircuit as Mock).mock.calls.length;

      expect(buildCount2).toBe(buildCount1);
    });

    it('should clean up circuits properly', async () => {
      await manager.routeThroughOnion('cleanup-transfer', new ArrayBuffer(100), 'dest');

      manager.closeTransferCircuit('cleanup-transfer');

      const statsAfter = manager.getStats();
      expect(statsAfter.circuitsActive).toBe(0);
    });

    it('should handle large data transfers', async () => {
      const largeData = new ArrayBuffer(64 * 1024); // 64KB

      await expect(
        manager.routeThroughOnion('large-transfer', largeData, 'dest')
      ).resolves.not.toThrow();

      const stats = manager.getStats();
      expect(stats.bytesTransferred).toBeGreaterThanOrEqual(64 * 1024);
    });
  });

  // =========================================================================
  // 5. EDGE CASES TESTS (10 tests)
  // =========================================================================

  describe('Edge Cases', () => {
    it('should throw error with insufficient relays', async () => {
      const store = getTestStore();
      store.relays.clear();
      store.relays.set('only-relay', createMockRelay('only-relay', 'us-east', 0.95, 50, 100 * 1024 * 1024));

      await manager.initialize();

      await expect(manager.selectRelayPath(3)).rejects.toThrow('Insufficient relay nodes');
    });

    it('should throw error when mode is disabled', async () => {
      await manager.initialize();
      manager.updateConfig({ mode: 'disabled' });

      await expect(
        manager.routeThroughOnion('disabled-test', new ArrayBuffer(100), 'dest')
      ).rejects.toThrow('Onion routing is disabled');
    });

    it('should handle empty data buffer', async () => {
      await manager.initialize();
      manager.updateConfig({ mode: 'multi-hop' });

      await expect(
        manager.routeThroughOnion('empty-data', new ArrayBuffer(0), 'dest')
      ).resolves.not.toThrow();
    });

    it('should handle offline relays gracefully', async () => {
      await manager.initialize();

      const store = getTestStore();
      const relay1 = store.relays.get('relay-us-1');
      const relay2 = store.relays.get('relay-eu-1');
      const relay3 = store.relays.get('relay-ap-1');
      if (relay1) {relay1.online = false;}
      if (relay2) {relay2.online = false;}
      if (relay3) {relay3.online = false;}

      await manager.refreshRelays();

      const path = await manager.selectRelayPath(3);
      expect(path).toHaveLength(3);
    });

    it('should cleanup properly destroy all circuits', async () => {
      await manager.initialize();
      manager.updateConfig({ mode: 'multi-hop' });

      await manager.routeThroughOnion('multi-1', new ArrayBuffer(100), 'dest1');
      await manager.routeThroughOnion('multi-2', new ArrayBuffer(100), 'dest2');
      await manager.routeThroughOnion('multi-3', new ArrayBuffer(100), 'dest3');

      await manager.cleanup();

      expect(manager.getRelayNodes()).toHaveLength(0);
      expect(manager.getActivePaths().size).toBe(0);
      expect(manager.getStats().circuitsActive).toBe(0);
    });

    it('should remove all event listeners on cleanup', async () => {
      const spy = vi.fn();
      manager.on('initialized', spy);
      manager.on('configUpdated', spy);
      manager.on('relaysUpdated', spy);

      await manager.cleanup();

      manager.emit('initialized');
      manager.emit('configUpdated', {});
      manager.emit('relaysUpdated', []);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should handle rapid config changes', async () => {
      await manager.initialize();

      for (let i = 0; i < 10; i++) {
        manager.updateConfig({
          mode: i % 2 === 0 ? 'multi-hop' : 'single-hop',
          numHops: (i % 3) + 1,
        });
      }

      const config = manager.getConfig();
      expect(['multi-hop', 'single-hop', 'disabled']).toContain(config.mode);
    });

    it('should handle concurrent routing requests', async () => {
      await manager.initialize();
      manager.updateConfig({ mode: 'multi-hop' });

      const promises = Array.from({ length: 5 }, (_, i) =>
        manager.routeThroughOnion(`concurrent-${i}`, new ArrayBuffer(100), `dest-${i}`)
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();

      const stats = manager.getStats();
      expect(stats.totalTransfers).toBe(5);
      expect(stats.successfulTransfers).toBe(5);
    });

    it('should handle router not initialized error', async () => {
      // Don't initialize but try to route
      manager.updateConfig({ mode: 'multi-hop' });

      await expect(
        manager.routeThroughOnion('no-init', new ArrayBuffer(100), 'dest')
      ).rejects.toThrow();
    });

    it('should handle invalid transfer id gracefully', async () => {
      await manager.initialize();

      // Close a non-existent circuit should not throw
      expect(() => manager.closeTransferCircuit('non-existent-id')).not.toThrow();
    });
  });

  // =========================================================================
  // 6. GLOBAL MANAGER TESTS (3 tests)
  // =========================================================================

  describe('Global Manager Functions', () => {
    afterEach(async () => {
      await cleanupOnionRouting();
    });

    it('should return singleton global manager', () => {
      const manager1 = getOnionRoutingManager();
      const manager2 = getOnionRoutingManager();

      expect(manager1).toBe(manager2);
    });

    it('should initialize global manager with config', async () => {
      const globalManager = await initializeOnionRouting({
        mode: 'single-hop',
        numHops: 1,
      });

      expect(globalManager).toBeDefined();
      expect(globalManager.getConfig().mode).toBe('single-hop');
    });

    it('should cleanup global manager and create new instance', async () => {
      await initializeOnionRouting();
      await cleanupOnionRouting();

      const newManager = getOnionRoutingManager();
      expect(newManager.getRelayNodes()).toHaveLength(0);
    });
  });

  // =========================================================================
  // 7. STATISTICS TRACKING TESTS (4 tests)
  // =========================================================================

  describe('Statistics Tracking', () => {
    beforeEach(async () => {
      await manager.initialize();
      manager.updateConfig({ mode: 'multi-hop' });
    });

    it('should track current hop count', async () => {
      await manager.routeThroughOnion('stats-hops', new ArrayBuffer(100), 'dest');

      const stats = manager.getStats();
      expect(stats.currentHops).toBeGreaterThan(0);
    });

    it('should track active relays count', async () => {
      const stats = manager.getStats();
      expect(stats.activeRelays).toBe(6);
    });

    it('should track circuits built count', async () => {
      const statsBefore = manager.getStats();

      await manager.routeThroughOnion('circuits-1', new ArrayBuffer(100), 'dest');
      await manager.routeThroughOnion('circuits-2', new ArrayBuffer(100), 'dest');

      const statsAfter = manager.getStats();
      expect(statsAfter.circuitsBuilt).toBeGreaterThan(statsBefore.circuitsBuilt);
    });

    it('should calculate running average latency', () => {
      manager.updateLatencyStats(100);
      manager.updateLatencyStats(200);
      manager.updateLatencyStats(300);

      const stats = manager.getStats();
      expect(stats.averageLatency).toBeDefined();
    });
  });
});
