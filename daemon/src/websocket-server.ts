/**
 * WebSocket Server
 *
 * Provides WebSocket API for web browsers to access mDNS functionality.
 * Bridges the gap between browsers (which cannot use mDNS directly)
 * and local network discovery.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import {
  MDNSServer,
  getMDNSServer,
  type AdvertiseOptions,
} from './mdns-server.js';
import {
  type RegisteredDevice,
  type TallowPlatform,
} from './service-registry.js';

// ============================================================================
// Constants
// ============================================================================

/** Default WebSocket port */
export const DEFAULT_WS_PORT = 53318;

/** Ping interval for client keepalive */
const PING_INTERVAL = 30000; // 30 seconds

// Note: Pong timeout (10000ms) can be implemented for stricter keepalive

// ============================================================================
// Types
// ============================================================================

/**
 * Client message types
 */
interface StartDiscoveryMessage {
  type: 'start-discovery';
  platformFilter?: TallowPlatform[];
}

interface StopDiscoveryMessage {
  type: 'stop-discovery';
}

interface AdvertiseMessage {
  type: 'advertise';
  device: {
    id: string;
    name: string;
    platform: TallowPlatform;
    capabilities: string[];
    fingerprint: string;
  };
}

interface StopAdvertisingMessage {
  type: 'stop-advertising';
}

interface GetDevicesMessage {
  type: 'get-devices';
}

interface PingMessage {
  type: 'ping';
  timestamp: number;
}

type ClientMessage =
  | StartDiscoveryMessage
  | StopDiscoveryMessage
  | AdvertiseMessage
  | StopAdvertisingMessage
  | GetDevicesMessage
  | PingMessage;

/**
 * Server message types
 */
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

interface ErrorMessage {
  type: 'error';
  message: string;
  code?: string;
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

type ServerMessage =
  | DeviceFoundMessage
  | DeviceLostMessage
  | DeviceUpdatedMessage
  | DeviceListMessage
  | ErrorMessage
  | StatusMessage
  | PongMessage;

/**
 * Extended WebSocket with client data
 */
interface TallowWebSocket extends WebSocket {
  isAlive: boolean;
  clientId: string;
  platformFilter?: TallowPlatform[];
}

// ============================================================================
// WebSocket Server Class
// ============================================================================

/**
 * WebSocket server for browser clients
 */
export class TallowWebSocketServer extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private mdns: MDNSServer;
  private clients: Map<string, TallowWebSocket> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private port: number;
  private isRunning = false;

  constructor(port: number = DEFAULT_WS_PORT) {
    super();
    this.port = port;
    this.mdns = getMDNSServer();
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Start the WebSocket server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        resolve();
        return;
      }

      try {
        // Create WebSocket server
        this.wss = new WebSocketServer({
          port: this.port,
          clientTracking: true,
        });

        this.wss.on('listening', () => {
          console.info(`[WebSocket] Server listening on port ${this.port}`);
          this.isRunning = true;
          this.setupMDNSEvents();
          this.startPingInterval();
          resolve();
        });

        this.wss.on('connection', (ws: WebSocket) => {
          this.handleConnection(ws as TallowWebSocket);
        });

        this.wss.on('error', (error) => {
          console.error('[WebSocket] Server error:', error);
          this.emit('error', error);
          if (!this.isRunning) {
            reject(error);
          }
        });
      } catch (error) {
        console.error('[WebSocket] Failed to start server:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop the WebSocket server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isRunning) {
        resolve();
        return;
      }

      // Stop ping interval
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }

      // Close all client connections
      this.clients.forEach((client) => {
        client.close(1000, 'Server shutting down');
      });
      this.clients.clear();

      // Close server
      if (this.wss) {
        this.wss.close(() => {
          console.info('[WebSocket] Server stopped');
          this.isRunning = false;
          resolve();
        });
      } else {
        this.isRunning = false;
        resolve();
      }
    });
  }

  /**
   * Check if server is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  // ============================================================================
  // Connection Handling
  // ============================================================================

  /**
   * Handle new client connection
   */
  private handleConnection(ws: TallowWebSocket): void {
    // Initialize client
    ws.isAlive = true;
    ws.clientId = this.generateClientId();

    // Store client
    this.clients.set(ws.clientId, ws);
    console.info(`[WebSocket] Client connected: ${ws.clientId}`);

    // Handle pong (keepalive response)
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle messages
    ws.on('message', (data) => {
      this.handleMessage(ws, data.toString());
    });

    // Handle close
    ws.on('close', () => {
      console.info(`[WebSocket] Client disconnected: ${ws.clientId}`);
      this.clients.delete(ws.clientId);
    });

    // Handle error
    ws.on('error', (error) => {
      console.error(`[WebSocket] Client error (${ws.clientId}):`, error);
    });

    // Send initial status
    this.sendStatus(ws);
  }

  /**
   * Handle incoming message
   */
  private handleMessage(ws: TallowWebSocket, data: string): void {
    try {
      const message = JSON.parse(data) as ClientMessage;

      switch (message.type) {
        case 'start-discovery':
          this.handleStartDiscovery(ws, message.platformFilter);
          break;

        case 'stop-discovery':
          this.handleStopDiscovery();
          break;

        case 'advertise':
          this.handleAdvertise(message.device);
          break;

        case 'stop-advertising':
          this.handleStopAdvertising();
          break;

        case 'get-devices':
          this.handleGetDevices(ws);
          break;

        case 'ping':
          this.handlePing(ws, message.timestamp);
          break;

        default:
          this.sendError(ws, `Unknown message type: ${(message as { type: string }).type}`);
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
      this.sendError(ws, 'Invalid message format');
    }
  }

  // ============================================================================
  // Message Handlers
  // ============================================================================

  /**
   * Handle start discovery
   */
  private handleStartDiscovery(ws: TallowWebSocket, platformFilter?: TallowPlatform[]): void {
    ws.platformFilter = platformFilter;

    // Start mDNS discovery if not already running
    if (!this.mdns.getIsDiscovering()) {
      this.mdns.startDiscovery(platformFilter);
    }

    // Send current devices to this client
    this.handleGetDevices(ws);
    this.sendStatus(ws);
  }

  /**
   * Handle stop discovery
   */
  private handleStopDiscovery(): void {
    // Only stop if no clients need discovery
    const anyClientDiscovering = Array.from(this.clients.values()).some(
      (c) => c.platformFilter !== undefined
    );

    if (!anyClientDiscovering) {
      this.mdns.stopDiscovery();
    }

    this.broadcastStatus();
  }

  /**
   * Handle advertise
   */
  private handleAdvertise(device: {
    id: string;
    name: string;
    platform: TallowPlatform;
    capabilities: string[];
    fingerprint: string;
  }): void {
    const options: AdvertiseOptions = {
      deviceId: device.id,
      deviceName: device.name,
      platform: device.platform,
      capabilities: device.capabilities,
      fingerprint: device.fingerprint,
    };

    this.mdns.startAdvertising(options);
    this.broadcastStatus();
  }

  /**
   * Handle stop advertising
   */
  private handleStopAdvertising(): void {
    this.mdns.stopAdvertising();
    this.broadcastStatus();
  }

  /**
   * Handle get devices
   */
  private handleGetDevices(ws: TallowWebSocket): void {
    let devices = this.mdns.getDevices();

    // Apply platform filter if set
    if (ws.platformFilter && ws.platformFilter.length > 0) {
      const filterSet = new Set(ws.platformFilter);
      devices = devices.filter((d) => filterSet.has(d.platform));
    }

    this.send(ws, {
      type: 'device-list',
      devices,
    });
  }

  /**
   * Handle ping
   */
  private handlePing(ws: TallowWebSocket, timestamp: number): void {
    this.send(ws, {
      type: 'pong',
      timestamp,
      serverTime: Date.now(),
    });
  }

  // ============================================================================
  // mDNS Event Handling
  // ============================================================================

  /**
   * Set up mDNS event handlers
   */
  private setupMDNSEvents(): void {
    this.mdns.on('device-found', (device: RegisteredDevice) => {
      this.broadcast({
        type: 'device-found',
        device,
      });
    });

    this.mdns.on('device-lost', (deviceId: string) => {
      this.broadcast({
        type: 'device-lost',
        deviceId,
      });
    });

    this.mdns.on('device-updated', (device: RegisteredDevice) => {
      this.broadcast({
        type: 'device-updated',
        device,
      });
    });
  }

  // ============================================================================
  // Message Sending
  // ============================================================================

  /**
   * Send message to a single client
   */
  private send(ws: TallowWebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all clients
   */
  private broadcast(message: ServerMessage): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // Apply platform filter for device messages
        if (
          (message.type === 'device-found' || message.type === 'device-updated') &&
          client.platformFilter &&
          client.platformFilter.length > 0
        ) {
          const filterSet = new Set(client.platformFilter);
          if (!filterSet.has(message.device.platform)) {
            return; // Skip this client
          }
        }
        client.send(data);
      }
    });
  }

  /**
   * Send error to client
   */
  private sendError(ws: TallowWebSocket, message: string, code?: string): void {
    this.send(ws, {
      type: 'error',
      message,
      code,
    });
  }

  /**
   * Send status to a single client
   */
  private sendStatus(ws: TallowWebSocket): void {
    this.send(ws, this.buildStatusMessage());
  }

  /**
   * Broadcast status to all clients
   */
  private broadcastStatus(): void {
    this.broadcast(this.buildStatusMessage());
  }

  /**
   * Build status message
   */
  private buildStatusMessage(): StatusMessage {
    const isDiscovering = this.mdns.getIsDiscovering();
    const isAdvertising = this.mdns.getIsAdvertising();

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
      deviceCount: this.mdns.getDeviceCount(),
    };
  }

  // ============================================================================
  // Keepalive
  // ============================================================================

  /**
   * Start ping interval for keepalive
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          console.info(`[WebSocket] Client timed out: ${clientId}`);
          client.terminate();
          this.clients.delete(clientId);
          return;
        }

        client.isAlive = false;
        client.ping();
      });
    }, PING_INTERVAL);
  }

  // ============================================================================
  // Utility
  // ============================================================================

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let wsServerInstance: TallowWebSocketServer | null = null;

/**
 * Get the singleton WebSocket server
 */
export function getWebSocketServer(port?: number): TallowWebSocketServer {
  if (!wsServerInstance) {
    wsServerInstance = new TallowWebSocketServer(port);
  }
  return wsServerInstance;
}

export default TallowWebSocketServer;
