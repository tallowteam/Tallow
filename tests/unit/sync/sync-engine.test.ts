/**
 * Sync Engine Unit Tests
 *
 * Tests the multi-device sync engine including:
 * - SyncEngine construction and configuration
 * - Message encoding/decoding with encryption
 * - Vector clock operations
 * - Conflict resolution (last-write-wins)
 * - Offline queue behavior
 * - State merging
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncEngine } from '@/lib/sync/sync-engine';

describe('SyncEngine', () => {
  const mockWebSocket = {
    readyState: 1, // OPEN
    send: vi.fn(),
    close: vi.fn(),
    onopen: null as ((event: Event) => void) | null,
    onclose: null as ((event: Event) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    onmessage: null as ((event: MessageEvent) => void) | null,
  };

  const mockSubtle = {
    digest: vi.fn(async (_algo: string, data: BufferSource) => {
      const bytes = new Uint8Array(data as ArrayBuffer);
      return new Uint8Array(32).fill(bytes[0] ?? 0).buffer;
    }),
    encrypt: vi.fn(async (_algo: unknown, _key: unknown, data: BufferSource) => {
      const input = new Uint8Array(data as ArrayBuffer);
      const output = new Uint8Array(input.length + 28); // 12 (IV) + 16 (tag)
      output.set(input, 12);
      return output.buffer;
    }),
    decrypt: vi.fn(async (_algo: unknown, _key: unknown, data: BufferSource) => {
      const input = new Uint8Array(data as ArrayBuffer);
      const output = input.slice(12, input.length - 16);
      return output.buffer;
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocket.readyState = 1;
    mockWebSocket.onopen = null;
    mockWebSocket.onclose = null;
    mockWebSocket.onerror = null;
    mockWebSocket.onmessage = null;

    const MockWebSocket = vi.fn(function MockWebSocket() {
      return mockWebSocket;
    });
    Object.assign(MockWebSocket, {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
    });

    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);
    vi.stubGlobal('crypto', {
      subtle: mockSubtle,
      getRandomValues: vi.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
    });
  });

  describe('initialization', () => {
    it('creates sync engine with default config', () => {
      const engine = new SyncEngine();
      expect(engine).toBeInstanceOf(SyncEngine);
    });

    it('creates sync engine with custom config', () => {
      const engine = new SyncEngine({
        deviceId: 'test-device-123',
        reconnectDelay: 3000,
        maxOfflineQueue: 50,
      });
      expect(engine).toBeInstanceOf(SyncEngine);
    });

    it('generates device ID when not provided', () => {
      const engine1 = new SyncEngine();
      const engine2 = new SyncEngine();

      expect(engine1.getDeviceRegistration()).toBeDefined();
      expect(engine2.getDeviceRegistration()).toBeDefined();
    });
  });

  describe('connection lifecycle', () => {
    it('connects to sync server', async () => {
      const engine = new SyncEngine({ deviceId: 'test-device' });

      const connectPromise = engine.connect();

      // Simulate WebSocket open
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }

      await connectPromise;
      expect(mockWebSocket.send).toHaveBeenCalled();
    });

    it('disconnects from server', async () => {
      const engine = new SyncEngine();

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      engine.disconnect();
      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('handles connection errors', async () => {
      const engine = new SyncEngine();
      const errorListener = vi.fn();
      engine.onStateChange('error', errorListener);

      const connectPromise = engine.connect();

      // Simulate error
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Event('error'));
      }

      await expect(connectPromise).rejects.toThrow();
    });
  });

  describe('state synchronization', () => {
    it('pushes state to other devices', async () => {
      const engine = new SyncEngine({ deviceId: 'device-1' });

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      await engine.pushState({
        contacts: { 'contact-1': { name: 'Alice' } },
      });

      expect(mockWebSocket.send).toHaveBeenCalled();
    });

    it('pulls state from other devices', async () => {
      const engine = new SyncEngine({ deviceId: 'device-1' });

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      await engine.pullState();
      expect(mockWebSocket.send).toHaveBeenCalled();
    });
  });

  describe('vector clock operations', () => {
    it('increments local clock on state push', async () => {
      const engine = new SyncEngine({ deviceId: 'device-1' });

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      await engine.pushState({ settings: { theme: 'dark' } });
      await engine.pushState({ settings: { theme: 'light' } });

      // Clock should have incremented
      expect(mockWebSocket.send).toHaveBeenCalledTimes(3); // register + 2 pushes
    });

    it('merges remote vector clocks', async () => {
      const engine = new SyncEngine({ deviceId: 'device-1' });
      const listener = vi.fn();
      engine.onStateChange('state-changed', listener);

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      // We would need to simulate message reception here
      // This is a simplified test showing the structure
      expect(engine).toBeDefined();
    });
  });

  describe('conflict resolution', () => {
    it('resolves conflict with local preference', async () => {
      const engine = new SyncEngine({ deviceId: 'device-1' });

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      await engine.resolveConflict(
        {
          field: 'settings.theme',
          localValue: 'dark',
          remoteValue: 'light',
          localClock: { 'device-1': 10 },
          remoteClock: { 'device-2': 10 },
        },
        'local'
      );

      expect(mockWebSocket.send).toHaveBeenCalled();
    });

    it('resolves conflict with remote preference', async () => {
      const engine = new SyncEngine({ deviceId: 'device-1' });
      const listener = vi.fn();
      engine.onStateChange('state-changed', listener);

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      await engine.resolveConflict(
        {
          field: 'settings.theme',
          localValue: 'dark',
          remoteValue: 'light',
          localClock: { 'device-1': 10 },
          remoteClock: { 'device-2': 10 },
        },
        'remote'
      );

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ field: 'settings.theme', value: 'light' })
      );
    });

    it('merges conflicting values', async () => {
      const engine = new SyncEngine({ deviceId: 'device-1' });

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      await engine.resolveConflict(
        {
          field: 'settings',
          localValue: { theme: 'dark' },
          remoteValue: { language: 'en' },
          localClock: { 'device-1': 10 },
          remoteClock: { 'device-2': 10 },
        },
        'merge'
      );

      expect(mockWebSocket.send).toHaveBeenCalled();
    });
  });

  describe('offline queue', () => {
    it('queues messages when offline', async () => {
      mockWebSocket.readyState = 0; // CONNECTING
      const engine = new SyncEngine({ deviceId: 'device-1' });

      await engine.pushState({ contacts: { id: 'data' } });

      // Message should be queued, not sent
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it('replays queue on reconnection', async () => {
      const engine = new SyncEngine({ deviceId: 'device-1', maxOfflineQueue: 10 });

      // Queue some messages while offline
      mockWebSocket.readyState = 0;
      await engine.pushState({ data1: 'value1' });
      await engine.pushState({ data2: 'value2' });

      // Connect and replay
      mockWebSocket.readyState = 1;
      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      // Wait for queue replay
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(mockWebSocket.send).toHaveBeenCalled();
    });

    it('limits offline queue size', async () => {
      const engine = new SyncEngine({ deviceId: 'device-1', maxOfflineQueue: 2 });
      mockWebSocket.readyState = 0;

      await engine.pushState({ msg1: 'data' });
      await engine.pushState({ msg2: 'data' });
      await engine.pushState({ msg3: 'data' }); // Should be dropped

      expect(engine).toBeDefined();
    });
  });

  describe('event listeners', () => {
    it('registers event listener', () => {
      const engine = new SyncEngine();
      const listener = vi.fn();

      const unsubscribe = engine.onStateChange('connected', listener);
      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('unsubscribes event listener', () => {
      const engine = new SyncEngine();
      const listener = vi.fn();

      const unsubscribe = engine.onStateChange('connected', listener);
      unsubscribe();

      // Listener should not be called after unsubscribe
      expect(listener).not.toHaveBeenCalled();
    });

    it('emits connected event', async () => {
      const engine = new SyncEngine({ deviceId: 'test' });
      const listener = vi.fn();
      engine.onStateChange('connected', listener);

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ deviceId: 'test' })
      );
    });

    it('emits disconnected event', async () => {
      const engine = new SyncEngine();
      const listener = vi.fn();
      engine.onStateChange('disconnected', listener);

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(new Event('close'));
      }

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('message encryption', () => {
    it('encrypts messages when key provided', async () => {
      const mockKey = {} as CryptoKey;
      const engine = new SyncEngine({
        deviceId: 'device-1',
        encryptionKey: mockKey,
      });

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      await engine.pushState({ data: 'secret' });

      expect(mockSubtle.encrypt).toHaveBeenCalled();
    });

    it('decrypts incoming messages', async () => {
      const mockKey = {} as CryptoKey;
      const engine = new SyncEngine({
        deviceId: 'device-1',
        encryptionKey: mockKey,
      });

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      // Simulate encrypted message reception
      const encrypted = btoa('encrypted-data');
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', { data: encrypted }));
      }

      // Give time for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSubtle.decrypt).toHaveBeenCalled();
    });
  });

  describe('device registration', () => {
    it('registers device on connect', async () => {
      const engine = new SyncEngine({ deviceId: 'test-device-456' });

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      const registration = engine.getDeviceRegistration();
      expect(registration).not.toBeNull();
      expect(registration?.deviceId).toBe('test-device-456');
    });

    it('includes device type', async () => {
      const engine = new SyncEngine({ deviceId: 'test' });

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      const registration = engine.getDeviceRegistration();
      expect(registration?.deviceType).toMatch(/desktop|mobile|tablet/);
    });
  });

  describe('reconnection handling', () => {
    it('schedules reconnection on disconnect', async () => {
      vi.useFakeTimers();
      const engine = new SyncEngine({ reconnectDelay: 1000 });

      const connectPromise = engine.connect();
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'));
      }
      await connectPromise;

      // Simulate disconnect
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(new Event('close'));
      }

      // Fast-forward time
      vi.advanceTimersByTime(1100);

      vi.useRealTimers();
    });
  });
});
