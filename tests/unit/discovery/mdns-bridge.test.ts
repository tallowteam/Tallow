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

// Mock WebSocket class
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

// Store WebSocket instances for testing
let mockWebSocketInstances: MockWebSocket[] = [];

// Mock secure-logger
vi.mock('@/lib/utils/secure-logger', () => ({
  default: {
    log: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MDNSBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocketInstances = [];

    // Mock global WebSocket
    vi.stubGlobal('WebSocket', Object.assign(MockWebSocket, {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  const getLatestWS = () => mockWebSocketInstances[mockWebSocketInstances.length - 1];

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

      const connectPromise = bridge.connect();

      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();

      const result = await connectPromise;

      expect(result).toBe(true);
      expect(bridge.getState()).toBe('connected');
      expect(bridge.isConnected()).toBe(true);
    });

    it('should disconnect properly', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      bridge.disconnect();

      expect(bridge.getState()).toBe('disconnected');
      expect(bridge.isConnected()).toBe(false);
      expect(bridge.getDevices()).toEqual([]);
    });

    it('should not connect when already connected', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const connectPromise1 = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise1;

      const result = await bridge.connect();

      expect(result).toBe(true);
    });

    it('should handle WebSocket error during connection', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge({ autoReconnect: false });

      const onError = vi.fn();
      bridge.setEventHandlers({ onError });

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateError(new Event('error'));
      getLatestWS()?.simulateClose();

      const result = await connectPromise;

      expect(result).toBe(false);
      expect(onError).toHaveBeenCalled();
    });

    it('should return false when connecting in SSR environment', async () => {
      const originalWindow = global.window;
      (global as any).window = undefined;

      vi.resetModules();
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const result = await bridge.connect();

      expect(result).toBe(false);

      (global as any).window = originalWindow;
    });
  });

  describe('Discovery Operations', () => {
    it('should start discovery and send message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      bridge.startDiscovery();

      const ws = getLatestWS()!;
      const discoveryMsg = ws.sentMessages.find(m => JSON.parse(m).type === 'start-discovery');

      expect(discoveryMsg).toBeDefined();
    });

    it('should start discovery with platform filter', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      bridge.startDiscovery(['macos', 'windows']);

      const ws = getLatestWS()!;
      const discoveryMsg = ws.sentMessages.find(m => {
        const parsed = JSON.parse(m);
        return parsed.type === 'start-discovery' && parsed.platformFilter;
      });

      expect(discoveryMsg).toBeDefined();
      expect(JSON.parse(discoveryMsg!).platformFilter).toEqual(['macos', 'windows']);
    });

    it('should stop discovery and send message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      bridge.startDiscovery();
      bridge.stopDiscovery();

      const ws = getLatestWS()!;
      const stopMsg = ws.sentMessages.find(m => JSON.parse(m).type === 'stop-discovery');

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

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      bridge.refreshDevices();

      const ws = getLatestWS()!;
      const refreshMsg = ws.sentMessages.find(m => JSON.parse(m).type === 'get-devices');

      expect(refreshMsg).toBeDefined();
    });
  });

  describe('Advertising Operations', () => {
    it('should advertise device', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      const advertisement: TallowDeviceAdvertisement = {
        id: 'TEST123',
        name: 'Test Device',
        platform: 'web',
        capabilities: ['pqc', 'chat'],
        fingerprint: 'abc123',
      };

      bridge.advertise(advertisement);

      expect(bridge.getIsAdvertising()).toBe(true);
      expect(bridge.getAdvertisedDevice()).toEqual(advertisement);

      const ws = getLatestWS()!;
      const advertiseMsg = ws.sentMessages.find(m => JSON.parse(m).type === 'advertise');

      expect(advertiseMsg).toBeDefined();
      expect(JSON.parse(advertiseMsg!).device).toEqual(advertisement);
    });

    it('should stop advertising', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      bridge.advertise({
        id: 'TEST123',
        name: 'Test Device',
        platform: 'web',
        capabilities: [],
        fingerprint: 'abc',
      });

      bridge.stopAdvertising();

      expect(bridge.getIsAdvertising()).toBe(false);
      expect(bridge.getAdvertisedDevice()).toBeNull();

      const ws = getLatestWS()!;
      const stopMsg = ws.sentMessages.find(m => JSON.parse(m).type === 'stop-advertising');

      expect(stopMsg).toBeDefined();
    });
  });

  describe('Message Handling', () => {
    it('should handle device-found message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const onDeviceFound = vi.fn();
      bridge.setEventHandlers({ onDeviceFound });

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      const device: TallowDevice = {
        id: 'DEVICE1',
        name: 'Test Device',
        platform: 'macos',
        ip: '192.168.1.100',
        port: 53317,
        version: '1.0.0',
        capabilities: 'pqc,chat',
        parsedCapabilities: {
          supportsPQC: true,
          supportsChat: true,
          supportsFolder: false,
          supportsResume: false,
          supportsScreen: false,
          supportsGroupTransfer: false,
        },
        fingerprint: 'abc123',
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true,
        source: 'mdns',
      };

      getLatestWS()?.simulateMessage(JSON.stringify({
        type: 'device-found',
        device,
      }));

      expect(onDeviceFound).toHaveBeenCalledWith(device);
      expect(bridge.getDevices()).toHaveLength(1);
      expect(bridge.getDevice('DEVICE1')).toEqual(device);
    });

    it('should handle device-lost message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const onDeviceLost = vi.fn();
      bridge.setEventHandlers({ onDeviceLost });

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      // First add a device
      const device: TallowDevice = {
        id: 'DEVICE1',
        name: 'Test Device',
        platform: 'macos',
        ip: '192.168.1.100',
        port: 53317,
        version: '1.0.0',
        capabilities: 'pqc',
        parsedCapabilities: {
          supportsPQC: true,
          supportsChat: false,
          supportsFolder: false,
          supportsResume: false,
          supportsScreen: false,
          supportsGroupTransfer: false,
        },
        fingerprint: 'abc',
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true,
        source: 'mdns',
      };

      getLatestWS()?.simulateMessage(JSON.stringify({
        type: 'device-found',
        device,
      }));

      expect(bridge.getDevices()).toHaveLength(1);

      // Now remove it
      getLatestWS()?.simulateMessage(JSON.stringify({
        type: 'device-lost',
        deviceId: 'DEVICE1',
      }));

      expect(onDeviceLost).toHaveBeenCalledWith('DEVICE1');
      expect(bridge.getDevices()).toHaveLength(0);
    });

    it('should handle device-updated message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const onDeviceUpdated = vi.fn();
      bridge.setEventHandlers({ onDeviceUpdated });

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      const device: TallowDevice = {
        id: 'DEVICE1',
        name: 'Updated Device',
        platform: 'macos',
        ip: '192.168.1.100',
        port: 53317,
        version: '1.0.0',
        capabilities: 'pqc',
        parsedCapabilities: {
          supportsPQC: true,
          supportsChat: false,
          supportsFolder: false,
          supportsResume: false,
          supportsScreen: false,
          supportsGroupTransfer: false,
        },
        fingerprint: 'abc',
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true,
        source: 'mdns',
      };

      getLatestWS()?.simulateMessage(JSON.stringify({
        type: 'device-updated',
        device,
      }));

      expect(onDeviceUpdated).toHaveBeenCalledWith(device);
    });

    it('should handle device-list message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const onDeviceList = vi.fn();
      bridge.setEventHandlers({ onDeviceList });

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      const devices: TallowDevice[] = [
        {
          id: 'DEVICE1',
          name: 'Device 1',
          platform: 'macos',
          ip: '192.168.1.100',
          port: 53317,
          version: '1.0.0',
          capabilities: 'pqc',
          parsedCapabilities: {
            supportsPQC: true,
            supportsChat: false,
            supportsFolder: false,
            supportsResume: false,
            supportsScreen: false,
            supportsGroupTransfer: false,
          },
          fingerprint: 'abc',
          discoveredAt: Date.now(),
          lastSeen: Date.now(),
          isOnline: true,
          source: 'mdns',
        },
        {
          id: 'DEVICE2',
          name: 'Device 2',
          platform: 'windows',
          ip: '192.168.1.101',
          port: 53317,
          version: '1.0.0',
          capabilities: 'chat',
          parsedCapabilities: {
            supportsPQC: false,
            supportsChat: true,
            supportsFolder: false,
            supportsResume: false,
            supportsScreen: false,
            supportsGroupTransfer: false,
          },
          fingerprint: 'xyz',
          discoveredAt: Date.now(),
          lastSeen: Date.now(),
          isOnline: true,
          source: 'mdns',
        },
      ];

      getLatestWS()?.simulateMessage(JSON.stringify({
        type: 'device-list',
        devices,
      }));

      expect(onDeviceList).toHaveBeenCalledWith(devices);
      expect(bridge.getDevices()).toHaveLength(2);
    });

    it('should handle error message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const onError = vi.fn();
      bridge.setEventHandlers({ onError });

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      getLatestWS()?.simulateMessage(JSON.stringify({
        type: 'error',
        message: 'Something went wrong',
        code: 'ERR001',
      }));

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0].message).toBe('Something went wrong');
    });

    it('should handle status message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      getLatestWS()?.simulateMessage(JSON.stringify({
        type: 'status',
        status: 'discovering',
        isDiscovering: true,
        isAdvertising: true,
        deviceCount: 5,
      }));

      expect(bridge.isConnected()).toBe(true);
    });

    it('should handle pong message', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      // Pong is a keepalive response, should not throw
      getLatestWS()?.simulateMessage(JSON.stringify({
        type: 'pong',
        timestamp: Date.now(),
        serverTime: Date.now(),
      }));

      expect(bridge.isConnected()).toBe(true);
    });

    it('should ignore invalid messages', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      // Invalid message type
      getLatestWS()?.simulateMessage(JSON.stringify({
        type: 'invalid-type',
      }));

      // Invalid JSON
      getLatestWS()?.simulateMessage('not json');

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
        onStatusChange: vi.fn(),
        onError: vi.fn(),
      };

      bridge.setEventHandlers(handlers);

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      expect(handlers.onStatusChange).toHaveBeenCalledWith('connected');
    });

    it('should set single event handler with on()', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const onDeviceFound = vi.fn();
      bridge.on('onDeviceFound', onDeviceFound);

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      const device: TallowDevice = {
        id: 'DEVICE1',
        name: 'Test',
        platform: 'web',
        ip: '127.0.0.1',
        port: 53317,
        version: '1.0.0',
        capabilities: '',
        parsedCapabilities: {
          supportsPQC: false,
          supportsChat: false,
          supportsFolder: false,
          supportsResume: false,
          supportsScreen: false,
          supportsGroupTransfer: false,
        },
        fingerprint: '',
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true,
        source: 'mdns',
      };

      getLatestWS()?.simulateMessage(JSON.stringify({
        type: 'device-found',
        device,
      }));

      expect(onDeviceFound).toHaveBeenCalledWith(device);
    });

    it('should remove event handler with off()', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const onDeviceFound = vi.fn();
      bridge.on('onDeviceFound', onDeviceFound);
      bridge.off('onDeviceFound');

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      getLatestWS()?.simulateMessage(JSON.stringify({
        type: 'device-found',
        device: {
          id: 'DEVICE1',
          name: 'Test',
          platform: 'web',
          ip: '127.0.0.1',
          port: 53317,
          version: '1.0.0',
          capabilities: '',
          parsedCapabilities: {},
          fingerprint: '',
          discoveredAt: Date.now(),
          lastSeen: Date.now(),
          isOnline: true,
          source: 'mdns',
        },
      }));

      expect(onDeviceFound).not.toHaveBeenCalled();
    });

    it('should notify onStatusChange for state transitions', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const onStatusChange = vi.fn();
      bridge.on('onStatusChange', onStatusChange);

      const connectPromise = bridge.connect();

      // Should call with 'connecting'
      expect(onStatusChange).toHaveBeenCalledWith('connecting');

      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      // Should call with 'connected'
      expect(onStatusChange).toHaveBeenCalledWith('connected');
    });
  });

  describe('Message Queue', () => {
    it('should queue messages when disconnected', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      // Send messages while disconnected (they should be queued)
      bridge.startDiscovery();
      bridge.refreshDevices();

      // Messages should be queued (no WebSocket yet)
      expect(bridge.getState()).toBe('disconnected');
    });

    it('should process queued messages on connect', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      // Queue messages while disconnected
      bridge.refreshDevices();

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      // Check that queued message was sent
      const ws = getLatestWS()!;
      const getDevicesMsg = ws.sentMessages.find(m => JSON.parse(m).type === 'get-devices');

      expect(getDevicesMsg).toBeDefined();
    });
  });

  describe('Reconnection Logic', () => {
    it('should attempt to reconnect on disconnect when autoReconnect is true', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge({
        autoReconnect: true,
        reconnectDelay: 100,
        maxReconnectAttempts: 3,
      });

      const onStatusChange = vi.fn();
      bridge.setEventHandlers({ onStatusChange });

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      // Simulate disconnect
      getLatestWS()?.simulateClose();

      expect(bridge.getState()).toBe('reconnecting');
      expect(onStatusChange).toHaveBeenCalledWith('reconnecting');
    });

    it('should not reconnect when autoReconnect is false', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge({
        autoReconnect: false,
      });

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      // Simulate disconnect
      getLatestWS()?.simulateClose();

      expect(bridge.getState()).toBe('disconnected');
    });
  });

  describe('Destroy', () => {
    it('should cleanup all resources on destroy', async () => {
      const { MDNSBridge } = await import('@/lib/discovery/mdns-bridge');
      const bridge = new MDNSBridge();

      const onDeviceFound = vi.fn();
      bridge.setEventHandlers({ onDeviceFound });

      const connectPromise = bridge.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      getLatestWS()?.simulateOpen();
      await connectPromise;

      bridge.destroy();

      expect(bridge.getState()).toBe('disconnected');
      expect(bridge.getDevices()).toEqual([]);
    });
  });
});

describe('isDaemonAvailable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocketInstances = [];

    vi.stubGlobal('WebSocket', Object.assign(MockWebSocket, {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  const getLatestWS = () => mockWebSocketInstances[mockWebSocketInstances.length - 1];

  it('should return true when daemon responds', async () => {
    const { isDaemonAvailable } = await import('@/lib/discovery/mdns-bridge');

    const checkPromise = isDaemonAvailable();
    await new Promise(resolve => setTimeout(resolve, 10));
    getLatestWS()?.simulateOpen();

    const result = await checkPromise;

    expect(result).toBe(true);
  });

  it('should return false when WebSocket errors', async () => {
    const { isDaemonAvailable } = await import('@/lib/discovery/mdns-bridge');

    const checkPromise = isDaemonAvailable();
    await new Promise(resolve => setTimeout(resolve, 10));
    getLatestWS()?.simulateError(new Event('error'));

    const result = await checkPromise;

    expect(result).toBe(false);
  });

  it('should return false in SSR environment', async () => {
    const originalWindow = global.window;
    (global as any).window = undefined;

    vi.resetModules();
    const { isDaemonAvailable } = await import('@/lib/discovery/mdns-bridge');

    const result = await isDaemonAvailable();

    expect(result).toBe(false);

    (global as any).window = originalWindow;
  });

  it('should accept custom URL parameter', async () => {
    // This test verifies isDaemonAvailable accepts a custom URL parameter
    // The actual connection behavior is tested in other tests
    const { isDaemonAvailable } = await import('@/lib/discovery/mdns-bridge');

    // Should not throw when called with custom URL
    const promise = isDaemonAvailable('ws://custom:9999');

    // Verify it returns a promise
    expect(promise).toBeInstanceOf(Promise);

    // Simulate error to resolve the promise
    await new Promise(resolve => setTimeout(resolve, 10));
    const ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
    if (ws) {
      ws.simulateError(new Event('error'));
    }

    const result = await promise;
    expect(typeof result).toBe('boolean');
  });
});

describe('getMDNSBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockWebSocketInstances = [];

    vi.stubGlobal('WebSocket', Object.assign(MockWebSocket, {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return singleton instance', async () => {
    const { getMDNSBridge } = await import('@/lib/discovery/mdns-bridge');

    const instance1 = getMDNSBridge();
    const instance2 = getMDNSBridge();

    expect(instance1).toBe(instance2);
  });

  it('should create instance with options on first call', async () => {
    const { getMDNSBridge } = await import('@/lib/discovery/mdns-bridge');

    const instance = getMDNSBridge({
      autoReconnect: false,
    });

    expect(instance).toBeDefined();
  });
});
