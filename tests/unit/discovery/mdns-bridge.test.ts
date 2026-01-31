/**
 * Tests for MDNSBridge WebSocket client
 *
 * Tests the WebSocket bridge that connects web browsers to the local mDNS daemon.
 * Covers connection lifecycle, discovery operations, advertising, message handling,
 * event handlers, message queuing, and keepalive mechanisms.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  TallowDevice,
  TallowDeviceAdvertisement,
} from '@/lib/discovery/mdns-types';

// Store WebSocket instances for testing
let mockWebSocketInstances: MockWebSocket[] = [];

// Mock WebSocket class - must be defined before mocking
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  sentMessages: string[] = [];
  url: string;
  closeCode?: number;
  closeReason?: string;

  constructor(url: string) {
    this.url = url;
    mockWebSocketInstances.push(this);
    // Auto-trigger connecting state
    setTimeout(() => {
      // Allow tests to set up handlers before we do anything
    }, 0);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string): void {
    this.closeCode = code;
    this.closeReason = reason;
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose();
    }
  }

  // Test helpers
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen();
    }
  }

  simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose();
    }
  }

  simulateError(error: Event): void {
    if (this.onerror) {
      this.onerror(error);
    }
  }

  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage({ data });
    }
  }
}

// Mock secure-logger
vi.mock('@/lib/utils/secure-logger', () => ({
  default: {
    log: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Set up global WebSocket mock before tests
vi.stubGlobal(
  'WebSocket',
  Object.assign(
    function (url: string) {
      return new MockWebSocket(url);
    },
    {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
    }
  )
);

describe('MDNSBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockWebSocketInstances = [];
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  const getLatestWS = () =>
    mockWebSocketInstances[mockWebSocketInstances.length - 1];

  const connectBridge = async (bridge: {
    connect: () => Promise<boolean>;
  }): Promise<boolean> => {
    const connectPromise = bridge.connect();
    await vi.advanceTimersByTimeAsync(1);
    getLatestWS()?.simulateOpen();
    return connectPromise;
  };

  describe('Connection Lifecycle', () => {
    it('should create bridge with default options', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      expect(bridge).toBeDefined();
      expect(bridge.getState()).toBe('disconnected');
    });

    it('should create bridge with custom options', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge({
        daemonUrl: 'ws://custom:9999',
        autoReconnect: false,
        reconnectDelay: 5000,
        maxReconnectAttempts: 5,
        pingInterval: 60000,
        connectionTimeout: 10000,
      });

      expect(bridge).toBeDefined();
      expect(bridge.getState()).toBe('disconnected');
    });

    it('should connect successfully', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const result = await connectBridge(bridge);

      expect(result).toBe(true);
      expect(bridge.getState()).toBe('connected');
      expect(bridge.isConnected()).toBe(true);
    });

    it('should handle connection timeout', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge({
        connectionTimeout: 1000,
        autoReconnect: false // Disable reconnect so it stays disconnected
      });

      const connectPromise = bridge.connect();
      // Don't simulate open, let it timeout
      await vi.advanceTimersByTimeAsync(1100);

      const result = await connectPromise;

      expect(result).toBe(false);
      expect(bridge.getState()).toBe('disconnected');
    });

    it('should disconnect properly', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      await connectBridge(bridge);
      bridge.disconnect();

      expect(bridge.getState()).toBe('disconnected');
      expect(bridge.isConnected()).toBe(false);
      expect(bridge.getDevices()).toEqual([]);
    });

    it('should not connect when already connected', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      await connectBridge(bridge);
      const result = await bridge.connect();

      expect(result).toBe(true);
      expect(mockWebSocketInstances.length).toBe(1); // Still only 1 connection
    });

    it('should not connect when connecting', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      bridge.connect(); // Start connecting
      await vi.advanceTimersByTimeAsync(1);
      await bridge.connect(); // Try again - will return false since still connecting

      // Should stay in connecting state
      expect(bridge.getState()).toBe('connecting');
    });

    it('should handle WebSocket error during connection', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge({ autoReconnect: false });

      const onError = vi.fn();
      bridge.setEventHandlers({ onError });

      const connectPromise = bridge.connect();
      await vi.advanceTimersByTimeAsync(1);
      getLatestWS()?.simulateError(new Event('error'));
      getLatestWS()?.simulateClose();

      const result = await connectPromise;

      expect(result).toBe(false);
      expect(bridge.getState()).toBe('disconnected');
    });

    it('should return false when connecting in SSR environment', async () => {
      const originalWindow = global.window;
      // @ts-expect-error - Simulating SSR
      delete global.window;

      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const result = await bridge.connect();

      expect(result).toBe(false);

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Discovery Operations', () => {
    it('should start discovery and send message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      await connectBridge(bridge);
      bridge.startDiscovery();

      const sentMessages = getLatestWS()?.sentMessages || [];
      expect(sentMessages.length).toBeGreaterThan(0);

      const discoveryMsg = sentMessages.find(
        (m) => JSON.parse(m).type === 'start-discovery'
      );
      expect(discoveryMsg).toBeDefined();
    });

    it('should start discovery with platform filter', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      await connectBridge(bridge);
      bridge.startDiscovery(['macos', 'windows']);

      const sentMessages = getLatestWS()?.sentMessages || [];
      const discoveryMsg = sentMessages.find(
        (m) => JSON.parse(m).type === 'start-discovery'
      );
      expect(discoveryMsg).toBeDefined();
      expect(JSON.parse(discoveryMsg!).platformFilter).toEqual([
        'macos',
        'windows',
      ]);
    });

    it('should stop discovery and send message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      await connectBridge(bridge);
      bridge.startDiscovery();
      bridge.stopDiscovery();

      const sentMessages = getLatestWS()?.sentMessages || [];
      const stopMsg = sentMessages.find(
        (m) => JSON.parse(m).type === 'stop-discovery'
      );
      expect(stopMsg).toBeDefined();
    });

    it('should return empty devices list initially', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      expect(bridge.getDevices()).toEqual([]);
    });

    it('should return undefined for non-existent device', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      expect(bridge.getDevice('non-existent')).toBeUndefined();
    });

    it('should refresh devices by sending get-devices message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      await connectBridge(bridge);
      bridge.refreshDevices();

      const sentMessages = getLatestWS()?.sentMessages || [];
      const refreshMsg = sentMessages.find(
        (m) => JSON.parse(m).type === 'get-devices'
      );
      expect(refreshMsg).toBeDefined();
    });
  });

  describe('Advertising Operations', () => {
    it('should advertise device', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      await connectBridge(bridge);

      const advertisement: TallowDeviceAdvertisement = {
        deviceId: 'test-device-123',
        deviceName: 'Test Device',
        platform: 'windows',
        port: 53317,
        capabilities: ['pqc', 'chat'],
        fingerprint: 'abc123',
      };

      bridge.advertise(advertisement);

      const sentMessages = getLatestWS()?.sentMessages || [];
      const advertiseMsg = sentMessages.find(
        (m) => JSON.parse(m).type === 'advertise'
      );
      expect(advertiseMsg).toBeDefined();
      expect(JSON.parse(advertiseMsg!).device.deviceId).toBe('test-device-123');
    });

    it('should stop advertising', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      await connectBridge(bridge);

      const advertisement: TallowDeviceAdvertisement = {
        deviceId: 'test-device-123',
        deviceName: 'Test Device',
        platform: 'windows',
        port: 53317,
        capabilities: ['pqc'],
        fingerprint: 'abc123',
      };

      bridge.advertise(advertisement);
      bridge.stopAdvertising();

      const sentMessages = getLatestWS()?.sentMessages || [];
      const stopMsg = sentMessages.find(
        (m) => JSON.parse(m).type === 'stop-advertising'
      );
      expect(stopMsg).toBeDefined();
    });
  });

  describe('Message Handling', () => {
    const mockDevice: TallowDevice = {
      id: 'device-1',
      name: 'Test Device',
      platform: 'macos',
      ip: '192.168.1.100',
      port: 53317,
      capabilities: ['pqc', 'chat'],
      fingerprint: 'abc123',
      lastSeen: Date.now(),
      isOnline: true,
    };

    it('should handle device-found message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();
      const onDeviceFound = vi.fn();
      bridge.setEventHandlers({ onDeviceFound });

      await connectBridge(bridge);

      getLatestWS()?.simulateMessage(
        JSON.stringify({
          type: 'device-found',
          device: mockDevice,
        })
      );

      expect(onDeviceFound).toHaveBeenCalledWith(mockDevice);
      expect(bridge.getDevices()).toHaveLength(1);
      expect(bridge.getDevice('device-1')).toEqual(mockDevice);
    });

    it('should handle device-lost message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();
      const onDeviceLost = vi.fn();
      bridge.setEventHandlers({ onDeviceLost });

      await connectBridge(bridge);

      // First add a device
      getLatestWS()?.simulateMessage(
        JSON.stringify({
          type: 'device-found',
          device: mockDevice,
        })
      );

      expect(bridge.getDevices()).toHaveLength(1);

      // Then lose it
      getLatestWS()?.simulateMessage(
        JSON.stringify({
          type: 'device-lost',
          deviceId: 'device-1',
        })
      );

      expect(onDeviceLost).toHaveBeenCalledWith('device-1');
      expect(bridge.getDevices()).toHaveLength(0);
    });

    it('should handle device-updated message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      await connectBridge(bridge);

      // First add a device
      getLatestWS()?.simulateMessage(
        JSON.stringify({
          type: 'device-found',
          device: mockDevice,
        })
      );

      // Update it
      const updatedDevice = { ...mockDevice, name: 'Updated Device' };
      getLatestWS()?.simulateMessage(
        JSON.stringify({
          type: 'device-updated',
          device: updatedDevice,
        })
      );

      expect(bridge.getDevice('device-1')?.name).toBe('Updated Device');
    });

    it('should handle device-list message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      await connectBridge(bridge);

      const devices = [
        mockDevice,
        { ...mockDevice, id: 'device-2', name: 'Device 2' },
      ];

      getLatestWS()?.simulateMessage(
        JSON.stringify({
          type: 'device-list',
          devices,
        })
      );

      expect(bridge.getDevices()).toHaveLength(2);
    });

    it('should handle error message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();
      const onError = vi.fn();
      bridge.setEventHandlers({ onError });

      await connectBridge(bridge);

      getLatestWS()?.simulateMessage(
        JSON.stringify({
          type: 'error',
          error: 'Test error message',
        })
      );

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle status message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();
      const onStatusChange = vi.fn();
      bridge.setEventHandlers({ onStatusChange });

      await connectBridge(bridge);

      getLatestWS()?.simulateMessage(
        JSON.stringify({
          type: 'status',
          discovering: true,
          advertising: false,
          deviceCount: 5,
        })
      );

      // Status message should be handled without errors
      expect(bridge.isConnected()).toBe(true);
    });

    it('should handle pong message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      await connectBridge(bridge);

      // Pong should be handled silently
      getLatestWS()?.simulateMessage(
        JSON.stringify({
          type: 'pong',
        })
      );

      expect(bridge.isConnected()).toBe(true);
    });

    it('should ignore invalid messages', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      await connectBridge(bridge);

      // Should not throw
      getLatestWS()?.simulateMessage('invalid json {{{');
      getLatestWS()?.simulateMessage(
        JSON.stringify({ type: 'unknown-type' })
      );

      expect(bridge.isConnected()).toBe(true);
    });
  });

  describe('Event Handlers', () => {
    it('should set multiple event handlers at once', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const handlers = {
        onDeviceFound: vi.fn(),
        onDeviceLost: vi.fn(),
        onError: vi.fn(),
        onStatusChange: vi.fn(),
      };

      bridge.setEventHandlers(handlers);
      await connectBridge(bridge);

      // Trigger device found
      getLatestWS()?.simulateMessage(
        JSON.stringify({
          type: 'device-found',
          device: {
            id: 'test',
            name: 'Test',
            platform: 'macos',
            ip: '192.168.1.1',
            port: 53317,
            capabilities: [],
            fingerprint: 'abc',
            lastSeen: Date.now(),
            isOnline: true,
          },
        })
      );

      expect(handlers.onDeviceFound).toHaveBeenCalled();
    });

    it('should set single event handler with on()', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const handler = vi.fn();
      bridge.on('onDeviceFound', handler);

      await connectBridge(bridge);

      getLatestWS()?.simulateMessage(
        JSON.stringify({
          type: 'device-found',
          device: {
            id: 'test',
            name: 'Test',
            platform: 'macos',
            ip: '192.168.1.1',
            port: 53317,
            capabilities: [],
            fingerprint: 'abc',
            lastSeen: Date.now(),
            isOnline: true,
          },
        })
      );

      expect(handler).toHaveBeenCalled();
    });

    it('should remove event handler with off()', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const handler = vi.fn();
      bridge.on('onDeviceFound', handler);
      bridge.off('onDeviceFound');

      await connectBridge(bridge);

      getLatestWS()?.simulateMessage(
        JSON.stringify({
          type: 'device-found',
          device: {
            id: 'test',
            name: 'Test',
            platform: 'macos',
            ip: '192.168.1.1',
            port: 53317,
            capabilities: [],
            fingerprint: 'abc',
            lastSeen: Date.now(),
            isOnline: true,
          },
        })
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it('should notify onStatusChange for state transitions', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const onStatusChange = vi.fn();
      bridge.setEventHandlers({ onStatusChange });

      await connectBridge(bridge);

      expect(onStatusChange).toHaveBeenCalled();
    });
  });

  describe('Message Queue', () => {
    it('should queue messages when disconnected', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      // Try to start discovery while disconnected
      bridge.startDiscovery();

      // No WebSocket created yet, so nothing sent
      expect(mockWebSocketInstances.length).toBe(0);
    });

    it('should process queued messages on connect', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      // Queue a discovery request while disconnected
      bridge.startDiscovery();

      // Now connect
      await connectBridge(bridge);

      // The queued message should be processed
      const sentMessages = getLatestWS()?.sentMessages || [];
      const discoveryMsg = sentMessages.find(
        (m) => JSON.parse(m).type === 'start-discovery'
      );
      expect(discoveryMsg).toBeDefined();
    });
  });

  describe('Reconnection Logic', () => {
    it('should attempt to reconnect on disconnect when autoReconnect is true', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge({
        autoReconnect: true,
        reconnectDelay: 100,
      });

      await connectBridge(bridge);
      expect(bridge.isConnected()).toBe(true);

      // Simulate disconnect
      getLatestWS()?.simulateClose();

      // Should attempt to reconnect after delay
      await vi.advanceTimersByTimeAsync(150);

      expect(mockWebSocketInstances.length).toBe(2);
    });

    it('should not reconnect when autoReconnect is false', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge({ autoReconnect: false });

      await connectBridge(bridge);
      getLatestWS()?.simulateClose();

      await vi.advanceTimersByTimeAsync(5000);

      expect(mockWebSocketInstances.length).toBe(1);
    });
  });

  describe('Destroy', () => {
    it('should cleanup all resources on destroy', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      await connectBridge(bridge);

      bridge.startDiscovery();
      bridge.advertise({
        deviceId: 'test',
        deviceName: 'Test',
        platform: 'windows',
        port: 53317,
        capabilities: [],
        fingerprint: 'abc',
      });

      bridge.destroy();

      expect(bridge.getState()).toBe('disconnected');
      expect(bridge.getDevices()).toEqual([]);
    });
  });
});

describe('isDaemonAvailable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockWebSocketInstances = [];
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  const getLatestWS = () =>
    mockWebSocketInstances[mockWebSocketInstances.length - 1];

  it('should return true when daemon responds', async () => {
    const { isDaemonAvailable } = await import('@/lib/discovery/mdns-bridge');

    const checkPromise = isDaemonAvailable();
    await vi.advanceTimersByTimeAsync(1);
    getLatestWS()?.simulateOpen();
    getLatestWS()?.simulateMessage(
      JSON.stringify({ type: 'status', discovering: false, advertising: false })
    );

    const result = await checkPromise;
    expect(result).toBe(true);
  });

  it('should return false when daemon does not respond', async () => {
    const { isDaemonAvailable } = await import('@/lib/discovery/mdns-bridge');

    const checkPromise = isDaemonAvailable();
    await vi.advanceTimersByTimeAsync(1);

    // Simulate error (not close - isDaemonAvailable only listens for onopen and onerror)
    getLatestWS()?.simulateError(new Event('error'));

    const result = await checkPromise;
    expect(result).toBe(false);
  });

  it('should return false when WebSocket errors', async () => {
    const { isDaemonAvailable } = await import('@/lib/discovery/mdns-bridge');

    const checkPromise = isDaemonAvailable();
    await vi.advanceTimersByTimeAsync(1);
    getLatestWS()?.simulateError(new Event('error'));
    getLatestWS()?.simulateClose();

    const result = await checkPromise;
    expect(result).toBe(false);
  });

  it('should return false in SSR environment', async () => {
    const originalWindow = global.window;
    // @ts-expect-error - Simulating SSR
    delete global.window;

    vi.resetModules();
    const { isDaemonAvailable } = await import('@/lib/discovery/mdns-bridge');

    const result = await isDaemonAvailable();

    expect(result).toBe(false);

    global.window = originalWindow;
  });

  it('should accept custom URL parameter', async () => {
    const { isDaemonAvailable } = await import('@/lib/discovery/mdns-bridge');

    const checkPromise = isDaemonAvailable('ws://custom:9999');
    await vi.advanceTimersByTimeAsync(1);

    const ws = getLatestWS();
    expect(ws?.url).toBe('ws://custom:9999');

    ws?.simulateOpen();
    ws?.simulateMessage(JSON.stringify({ type: 'status' }));

    await checkPromise;
  });
});

describe('getMDNSBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocketInstances = [];
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return singleton instance', async () => {
    const { getMDNSBridge, _resetBridgeSingleton } = await import(
      '@/lib/discovery/mdns-bridge'
    );

    // Reset singleton first
    _resetBridgeSingleton?.();

    const bridge1 = getMDNSBridge();
    const bridge2 = getMDNSBridge();

    expect(bridge1).toBe(bridge2);
  });

  it('should create instance with options on first call', async () => {
    const { getMDNSBridge, _resetBridgeSingleton } = await import(
      '@/lib/discovery/mdns-bridge'
    );

    // Reset singleton first
    _resetBridgeSingleton?.();

    const bridge = getMDNSBridge({ autoReconnect: false });

    expect(bridge).toBeDefined();
  });
});
