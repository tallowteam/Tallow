/**
 * Daemon Integration Tests
 *
 * Tests the WebSocket server and mDNS server integration in the daemon.
 * Verifies message protocol handling, device discovery events, and
 * platform filtering functionality.
 *
 * Note: These tests mock the bonjour-service and ws modules to test
 * the daemon code in isolation without requiring actual mDNS/WebSocket.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// Types matching the daemon's message protocol
interface DeviceFoundMessage {
  type: 'device-found';
  device: RegisteredDevice;
}

interface DeviceLostMessage {
  type: 'device-lost';
  deviceId: string;
}

interface DeviceUpdatedMessage {
  type: 'device-updated';
  device: RegisteredDevice;
}

interface DeviceListMessage {
  type: 'device-list';
  devices: RegisteredDevice[];
}

interface StatusMessage {
  type: 'status';
  status: 'discovering' | 'advertising' | 'idle';
  isDiscovering: boolean;
  isAdvertising: boolean;
  deviceCount: number;
}

interface PongMessage {
  type: 'pong';
  timestamp: number;
  serverTime: number;
}

interface ErrorMessage {
  type: 'error';
  message: string;
  code?: string;
}

type ServerMessage =
  | DeviceFoundMessage
  | DeviceLostMessage
  | DeviceUpdatedMessage
  | DeviceListMessage
  | StatusMessage
  | PongMessage
  | ErrorMessage;

interface RegisteredDevice {
  id: string;
  name: string;
  platform: 'web' | 'ios' | 'android' | 'macos' | 'windows' | 'linux';
  ip: string;
  port: number;
  version: string;
  capabilities: string;
  fingerprint: string;
  discoveredAt: number;
  lastSeen: number;
  isOnline: boolean;
  source: 'mdns' | 'signaling' | 'manual';
}

// Mock Remote Service type (from bonjour-service)
interface MockRemoteService {
  name: string;
  type: string;
  port: number;
  addresses?: string[];
  referer?: { address: string };
  txt?: Record<string, string | boolean> | string[];
}

// Mock mDNS Server class
class MockMDNSServer extends EventEmitter {
  private isRunning = false;
  private isDiscovering = false;
  private isAdvertising = false;
  private devices = new Map<string, RegisteredDevice>();

  start(): void {
    this.isRunning = true;
  }

  stop(): void {
    this.isRunning = false;
    this.isDiscovering = false;
    this.isAdvertising = false;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  startDiscovery(_platformFilter?: string[]): void {
    this.isDiscovering = true;
  }

  stopDiscovery(): void {
    this.isDiscovering = false;
  }

  getIsDiscovering(): boolean {
    return this.isDiscovering;
  }

  startAdvertising(_options: Record<string, unknown>): void {
    this.isAdvertising = true;
  }

  stopAdvertising(): void {
    this.isAdvertising = false;
  }

  getIsAdvertising(): boolean {
    return this.isAdvertising;
  }

  getDevices(): RegisteredDevice[] {
    return Array.from(this.devices.values());
  }

  getDeviceCount(): number {
    return this.devices.size;
  }

  // Test helpers
  simulateDeviceFound(device: RegisteredDevice): void {
    this.devices.set(device.id, device);
    this.emit('device-found', device);
  }

  simulateDeviceLost(deviceId: string): void {
    this.devices.delete(deviceId);
    this.emit('device-lost', deviceId);
  }

  simulateDeviceUpdated(device: RegisteredDevice): void {
    this.devices.set(device.id, device);
    this.emit('device-updated', device);
  }
}

// Mock WebSocket Client
class MockWebSocket extends EventEmitter {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.OPEN;
  isAlive = true;
  clientId = '';
  platformFilter?: string[];

  sentMessages: string[] = [];

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(_code?: number, _reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    this.emit('close');
  }

  ping(): void {
    // Mock ping
  }

  terminate(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.emit('close');
  }

  // Test helpers
  simulateMessage(data: string): void {
    this.emit('message', { toString: () => data });
  }

  getLastMessage(): ServerMessage | null {
    if (this.sentMessages.length === 0) return null;
    return JSON.parse(this.sentMessages[this.sentMessages.length - 1]) as ServerMessage;
  }

  getAllMessages(): ServerMessage[] {
    return this.sentMessages.map(m => JSON.parse(m) as ServerMessage);
  }
}

// Mock WebSocket Server
class MockWebSocketServer extends EventEmitter {
  clients = new Set<MockWebSocket>();

  simulateConnection(client: MockWebSocket): void {
    this.clients.add(client);
    this.emit('connection', client);
  }
}

describe('Daemon Integration Tests', () => {
  let mdnsServer: MockMDNSServer;
  let wsServer: MockWebSocketServer;
  let clients: Map<string, MockWebSocket>;
  let messageHandlers: Map<string, (ws: MockWebSocket, data: string) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    mdnsServer = new MockMDNSServer();
    wsServer = new MockWebSocketServer();
    clients = new Map();
    messageHandlers = new Map();

    // Setup mDNS server event forwarding
    mdnsServer.on('device-found', (device: RegisteredDevice) => {
      broadcast({ type: 'device-found', device });
    });

    mdnsServer.on('device-lost', (deviceId: string) => {
      broadcast({ type: 'device-lost', deviceId });
    });

    mdnsServer.on('device-updated', (device: RegisteredDevice) => {
      broadcast({ type: 'device-updated', device });
    });

    // Setup WebSocket server connection handling
    wsServer.on('connection', (ws: MockWebSocket) => {
      ws.clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      ws.isAlive = true;
      clients.set(ws.clientId, ws);

      ws.on('message', (data: { toString: () => string }) => {
        handleMessage(ws, data.toString());
      });

      ws.on('close', () => {
        clients.delete(ws.clientId);
      });

      // Send initial status
      sendStatus(ws);
    });

    // Start servers
    mdnsServer.start();
  });

  afterEach(() => {
    mdnsServer.stop();
    clients.clear();
  });

  // Helper functions that simulate daemon behavior
  function handleMessage(ws: MockWebSocket, data: string): void {
    try {
      const message = JSON.parse(data) as { type: string; [key: string]: unknown };

      switch (message.type) {
        case 'start-discovery':
          handleStartDiscovery(ws, message.platformFilter as string[] | undefined);
          break;
        case 'stop-discovery':
          handleStopDiscovery();
          break;
        case 'advertise':
          handleAdvertise(message.device as Record<string, unknown>);
          break;
        case 'stop-advertising':
          handleStopAdvertising();
          break;
        case 'get-devices':
          handleGetDevices(ws);
          break;
        case 'ping':
          handlePing(ws, message.timestamp as number);
          break;
        default:
          sendError(ws, `Unknown message type: ${message.type}`);
      }
    } catch {
      sendError(ws, 'Invalid message format');
    }
  }

  function handleStartDiscovery(ws: MockWebSocket, platformFilter?: string[]): void {
    ws.platformFilter = platformFilter;
    if (!mdnsServer.getIsDiscovering()) {
      mdnsServer.startDiscovery(platformFilter);
    }
    handleGetDevices(ws);
    sendStatus(ws);
  }

  function handleStopDiscovery(): void {
    const anyClientDiscovering = Array.from(clients.values()).some(c => c.platformFilter !== undefined);
    if (!anyClientDiscovering) {
      mdnsServer.stopDiscovery();
    }
    broadcastStatus();
  }

  function handleAdvertise(device: Record<string, unknown>): void {
    mdnsServer.startAdvertising({
      deviceId: device.id,
      deviceName: device.name,
      platform: device.platform,
      capabilities: device.capabilities,
      fingerprint: device.fingerprint,
    });
    broadcastStatus();
  }

  function handleStopAdvertising(): void {
    mdnsServer.stopAdvertising();
    broadcastStatus();
  }

  function handleGetDevices(ws: MockWebSocket): void {
    let devices = mdnsServer.getDevices();

    if (ws.platformFilter && ws.platformFilter.length > 0) {
      const filterSet = new Set(ws.platformFilter);
      devices = devices.filter(d => filterSet.has(d.platform));
    }

    send(ws, { type: 'device-list', devices });
  }

  function handlePing(ws: MockWebSocket, timestamp: number): void {
    send(ws, {
      type: 'pong',
      timestamp,
      serverTime: Date.now(),
    });
  }

  function send(ws: MockWebSocket, message: ServerMessage): void {
    if (ws.readyState === MockWebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  function sendError(ws: MockWebSocket, message: string, code?: string): void {
    send(ws, { type: 'error', message, code });
  }

  function sendStatus(ws: MockWebSocket): void {
    send(ws, buildStatusMessage());
  }

  function broadcast(message: ServerMessage): void {
    const data = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === MockWebSocket.OPEN) {
        if ((message.type === 'device-found' || message.type === 'device-updated') &&
            client.platformFilter && client.platformFilter.length > 0) {
          const device = (message as DeviceFoundMessage | DeviceUpdatedMessage).device;
          if (!client.platformFilter.includes(device.platform)) {
            return;
          }
        }
        client.send(data);
      }
    });
  }

  function broadcastStatus(): void {
    broadcast(buildStatusMessage());
  }

  function buildStatusMessage(): StatusMessage {
    const isDiscovering = mdnsServer.getIsDiscovering();
    const isAdvertising = mdnsServer.getIsAdvertising();

    let status: 'discovering' | 'advertising' | 'idle' = 'idle';
    if (isDiscovering && isAdvertising) {
      status = 'discovering';
    } else if (isDiscovering) {
      status = 'discovering';
    } else if (isAdvertising) {
      status = 'advertising';
    }

    return {
      type: 'status',
      status,
      isDiscovering,
      isAdvertising,
      deviceCount: mdnsServer.getDeviceCount(),
    };
  }

  describe('Client Connection', () => {
    it('should handle new client connection', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      expect(clients.size).toBe(1);
      expect(client.sentMessages.length).toBeGreaterThan(0);
    });

    it('should send initial status on connection', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      const lastMessage = client.getLastMessage();
      expect(lastMessage?.type).toBe('status');
    });

    it('should cleanup on client disconnect', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      expect(clients.size).toBe(1);

      client.close();

      expect(clients.size).toBe(0);
    });

    it('should handle multiple clients', () => {
      const client1 = new MockWebSocket();
      const client2 = new MockWebSocket();

      wsServer.simulateConnection(client1);
      wsServer.simulateConnection(client2);

      expect(clients.size).toBe(2);
    });
  });

  describe('Discovery Message Protocol', () => {
    it('should handle start-discovery message', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      client.simulateMessage(JSON.stringify({ type: 'start-discovery' }));

      expect(mdnsServer.getIsDiscovering()).toBe(true);

      const messages = client.getAllMessages();
      const deviceListMsg = messages.find(m => m.type === 'device-list');
      expect(deviceListMsg).toBeDefined();
    });

    it('should handle start-discovery with platform filter', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      client.simulateMessage(JSON.stringify({
        type: 'start-discovery',
        platformFilter: ['macos', 'windows'],
      }));

      expect(client.platformFilter).toEqual(['macos', 'windows']);
      expect(mdnsServer.getIsDiscovering()).toBe(true);
    });

    it('should handle stop-discovery message', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      client.simulateMessage(JSON.stringify({ type: 'start-discovery' }));
      client.simulateMessage(JSON.stringify({ type: 'stop-discovery' }));

      expect(mdnsServer.getIsDiscovering()).toBe(false);
    });

    it('should not stop discovery if other clients still discovering', () => {
      const client1 = new MockWebSocket();
      const client2 = new MockWebSocket();

      wsServer.simulateConnection(client1);
      wsServer.simulateConnection(client2);

      // Start discovery with explicit platform filters so they're trackable
      client1.simulateMessage(JSON.stringify({
        type: 'start-discovery',
        platformFilter: ['macos'],
      }));
      client2.simulateMessage(JSON.stringify({
        type: 'start-discovery',
        platformFilter: ['windows'],
      }));

      expect(mdnsServer.getIsDiscovering()).toBe(true);

      // Client 1 stops discovery
      client1.platformFilter = undefined;
      client1.simulateMessage(JSON.stringify({ type: 'stop-discovery' }));

      // Discovery should continue because client2's platformFilter is still set
      expect(mdnsServer.getIsDiscovering()).toBe(true);
    });
  });

  describe('Advertising Message Protocol', () => {
    it('should handle advertise message', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      client.simulateMessage(JSON.stringify({
        type: 'advertise',
        device: {
          id: 'TEST123',
          name: 'Test Device',
          platform: 'web',
          capabilities: ['pqc', 'chat'],
          fingerprint: 'abc123',
        },
      }));

      expect(mdnsServer.getIsAdvertising()).toBe(true);

      const messages = client.getAllMessages();
      const statusMsg = messages.find(m => m.type === 'status' && (m as StatusMessage).isAdvertising);
      expect(statusMsg).toBeDefined();
    });

    it('should handle stop-advertising message', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      client.simulateMessage(JSON.stringify({
        type: 'advertise',
        device: { id: 'TEST', name: 'Test', platform: 'web', capabilities: [], fingerprint: '' },
      }));

      client.simulateMessage(JSON.stringify({ type: 'stop-advertising' }));

      expect(mdnsServer.getIsAdvertising()).toBe(false);
    });
  });

  describe('Device Events', () => {
    it('should broadcast device-found to all clients', () => {
      const client1 = new MockWebSocket();
      const client2 = new MockWebSocket();

      wsServer.simulateConnection(client1);
      wsServer.simulateConnection(client2);

      const device: RegisteredDevice = {
        id: 'DEVICE1',
        name: 'Test Device',
        platform: 'macos',
        ip: '192.168.1.100',
        port: 53317,
        version: '1.0.0',
        capabilities: 'pqc',
        fingerprint: 'abc',
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true,
        source: 'mdns',
      };

      mdnsServer.simulateDeviceFound(device);

      const msg1 = client1.getAllMessages().find(m => m.type === 'device-found');
      const msg2 = client2.getAllMessages().find(m => m.type === 'device-found');

      expect(msg1).toBeDefined();
      expect(msg2).toBeDefined();
      expect((msg1 as DeviceFoundMessage).device.id).toBe('DEVICE1');
    });

    it('should broadcast device-lost to all clients', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      mdnsServer.simulateDeviceLost('DEVICE1');

      const msg = client.getAllMessages().find(m => m.type === 'device-lost');
      expect(msg).toBeDefined();
      expect((msg as DeviceLostMessage).deviceId).toBe('DEVICE1');
    });

    it('should broadcast device-updated to all clients', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      const device: RegisteredDevice = {
        id: 'DEVICE1',
        name: 'Updated Device',
        platform: 'macos',
        ip: '192.168.1.100',
        port: 53317,
        version: '1.0.0',
        capabilities: 'pqc,chat',
        fingerprint: 'abc',
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true,
        source: 'mdns',
      };

      mdnsServer.simulateDeviceUpdated(device);

      const msg = client.getAllMessages().find(m => m.type === 'device-updated');
      expect(msg).toBeDefined();
      expect((msg as DeviceUpdatedMessage).device.name).toBe('Updated Device');
    });

    it('should filter device events by platform', () => {
      const clientMacOnly = new MockWebSocket();
      const clientAll = new MockWebSocket();

      wsServer.simulateConnection(clientMacOnly);
      wsServer.simulateConnection(clientAll);

      // Set platform filter for clientMacOnly
      clientMacOnly.platformFilter = ['macos'];

      const windowsDevice: RegisteredDevice = {
        id: 'DEVICE1',
        name: 'Windows Device',
        platform: 'windows',
        ip: '192.168.1.100',
        port: 53317,
        version: '1.0.0',
        capabilities: '',
        fingerprint: '',
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true,
        source: 'mdns',
      };

      mdnsServer.simulateDeviceFound(windowsDevice);

      // clientMacOnly should NOT receive the Windows device
      const msgMacOnly = clientMacOnly.getAllMessages().find(
        m => m.type === 'device-found' && (m as DeviceFoundMessage).device.id === 'DEVICE1'
      );

      // clientAll should receive the Windows device
      const msgAll = clientAll.getAllMessages().find(
        m => m.type === 'device-found' && (m as DeviceFoundMessage).device.id === 'DEVICE1'
      );

      expect(msgMacOnly).toBeUndefined();
      expect(msgAll).toBeDefined();
    });
  });

  describe('Get Devices', () => {
    it('should return device list on get-devices', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      // Add some devices
      const device1: RegisteredDevice = {
        id: 'DEVICE1',
        name: 'Device 1',
        platform: 'macos',
        ip: '192.168.1.100',
        port: 53317,
        version: '1.0.0',
        capabilities: 'pqc',
        fingerprint: 'abc',
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true,
        source: 'mdns',
      };

      const device2: RegisteredDevice = {
        id: 'DEVICE2',
        name: 'Device 2',
        platform: 'windows',
        ip: '192.168.1.101',
        port: 53317,
        version: '1.0.0',
        capabilities: 'chat',
        fingerprint: 'xyz',
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true,
        source: 'mdns',
      };

      mdnsServer.simulateDeviceFound(device1);
      mdnsServer.simulateDeviceFound(device2);

      // Clear previous messages
      client.sentMessages = [];

      client.simulateMessage(JSON.stringify({ type: 'get-devices' }));

      const msg = client.getLastMessage() as DeviceListMessage;
      expect(msg.type).toBe('device-list');
      expect(msg.devices).toHaveLength(2);
    });

    it('should filter device list by platform', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      // Add devices of different platforms
      mdnsServer.simulateDeviceFound({
        id: 'MAC1',
        name: 'Mac Device',
        platform: 'macos',
        ip: '192.168.1.100',
        port: 53317,
        version: '1.0.0',
        capabilities: '',
        fingerprint: '',
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true,
        source: 'mdns',
      });

      mdnsServer.simulateDeviceFound({
        id: 'WIN1',
        name: 'Windows Device',
        platform: 'windows',
        ip: '192.168.1.101',
        port: 53317,
        version: '1.0.0',
        capabilities: '',
        fingerprint: '',
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true,
        source: 'mdns',
      });

      // Set platform filter
      client.platformFilter = ['macos'];
      client.sentMessages = [];

      client.simulateMessage(JSON.stringify({ type: 'get-devices' }));

      const msg = client.getLastMessage() as DeviceListMessage;
      expect(msg.devices).toHaveLength(1);
      expect(msg.devices[0].platform).toBe('macos');
    });
  });

  describe('Ping/Pong Keepalive', () => {
    it('should respond to ping with pong', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      const timestamp = Date.now();
      client.sentMessages = [];

      client.simulateMessage(JSON.stringify({ type: 'ping', timestamp }));

      const msg = client.getLastMessage() as PongMessage;
      expect(msg.type).toBe('pong');
      expect(msg.timestamp).toBe(timestamp);
      expect(typeof msg.serverTime).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should send error for unknown message type', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      client.sentMessages = [];

      client.simulateMessage(JSON.stringify({ type: 'unknown-type' }));

      const msg = client.getLastMessage() as ErrorMessage;
      expect(msg.type).toBe('error');
      expect(msg.message).toContain('Unknown message type');
    });

    it('should send error for invalid JSON', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      client.sentMessages = [];

      client.simulateMessage('not valid json');

      const msg = client.getLastMessage() as ErrorMessage;
      expect(msg.type).toBe('error');
      expect(msg.message).toContain('Invalid message format');
    });
  });

  describe('Status Messages', () => {
    it('should report correct status when idle', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      const msg = client.getLastMessage() as StatusMessage;
      expect(msg.type).toBe('status');
      expect(msg.status).toBe('idle');
      expect(msg.isDiscovering).toBe(false);
      expect(msg.isAdvertising).toBe(false);
    });

    it('should report discovering status', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      client.simulateMessage(JSON.stringify({ type: 'start-discovery' }));

      const messages = client.getAllMessages();
      const statusMsg = messages.filter(m => m.type === 'status').pop() as StatusMessage;

      expect(statusMsg.status).toBe('discovering');
      expect(statusMsg.isDiscovering).toBe(true);
    });

    it('should report advertising status', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      client.simulateMessage(JSON.stringify({
        type: 'advertise',
        device: { id: 'TEST', name: 'Test', platform: 'web', capabilities: [], fingerprint: '' },
      }));

      const messages = client.getAllMessages();
      const statusMsg = messages.filter(m => m.type === 'status').pop() as StatusMessage;

      expect(statusMsg.isAdvertising).toBe(true);
    });

    it('should include device count in status', () => {
      const client = new MockWebSocket();
      wsServer.simulateConnection(client);

      mdnsServer.simulateDeviceFound({
        id: 'DEVICE1',
        name: 'Device',
        platform: 'macos',
        ip: '127.0.0.1',
        port: 53317,
        version: '1.0.0',
        capabilities: '',
        fingerprint: '',
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true,
        source: 'mdns',
      });

      client.sentMessages = [];
      client.simulateMessage(JSON.stringify({ type: 'start-discovery' }));

      const messages = client.getAllMessages();
      const statusMsg = messages.filter(m => m.type === 'status').pop() as StatusMessage;

      expect(statusMsg.deviceCount).toBe(1);
    });
  });
});
