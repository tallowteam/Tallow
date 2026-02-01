'use client';

/**
 * mDNS WebSocket Bridge Client
 *
 * Connects to the local mDNS daemon via WebSocket to enable
 * browser-based applications to use mDNS discovery.
 *
 * The daemon runs locally and handles actual mDNS operations,
 * while this client provides a clean API for web applications.
 */

import {
  type TallowDevice,
  type TallowDeviceAdvertisement,
  type TallowPlatform,
  type WSClientMessage,
  type WSStartDiscoveryMessage,
  type BridgeConnectionState,
  type MDNSBridgeOptions,
  type MDNSBridgeEvents,
  DAEMON_WS_PORT,
  isValidDaemonMessage,
} from './mdns-types';
import secureLog from '@/lib/utils/secure-logger';

// Default configuration
const DEFAULT_OPTIONS: Required<MDNSBridgeOptions> = {
  daemonUrl: `ws://localhost:${DAEMON_WS_PORT}`,
  autoReconnect: true,
  reconnectDelay: 2000,
  maxReconnectAttempts: 10,
  pingInterval: 30000,
  connectionTimeout: 5000,
};

/**
 * WebSocket bridge client for mDNS discovery
 */
export class MDNSBridge {
  private ws: WebSocket | null = null;
  private options: Required<MDNSBridgeOptions>;
  private events: MDNSBridgeEvents = {};
  private state: BridgeConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private connectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private devices: Map<string, TallowDevice> = new Map();
  private isDiscovering = false;
  private isAdvertising = false;
  private advertisedDevice: TallowDeviceAdvertisement | null = null;
  private messageQueue: WSClientMessage[] = [];

  constructor(options: MDNSBridgeOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  /**
   * Connect to the mDNS daemon
   */
  async connect(): Promise<boolean> {
    if (this.state === 'connected' || this.state === 'connecting') {
      return this.state === 'connected';
    }

    // Prevent SSR issues
    if (typeof window === 'undefined') {
      return false;
    }

    this.setState('connecting');

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.options.daemonUrl);

        // Connection timeout
        this.connectionTimeoutTimer = setTimeout(() => {
          if (this.state === 'connecting') {
            secureLog.warn('[MDNSBridge] Connection timeout');
            this.handleDisconnect();
            resolve(false);
          }
        }, this.options.connectionTimeout);

        this.ws.onopen = () => {
          this.clearConnectionTimeout();
          this.setState('connected');
          this.reconnectAttempts = 0;
          secureLog.log('[MDNSBridge] Connected to daemon');

          // Start ping keepalive
          this.startPing();

          // Process queued messages
          this.processMessageQueue();

          // Re-advertise if we were advertising
          if (this.advertisedDevice) {
            this.advertise(this.advertisedDevice);
          }

          // Resume discovery if we were discovering
          if (this.isDiscovering) {
            this.send({ type: 'start-discovery' });
          }

          resolve(true);
        };

        this.ws.onclose = () => {
          secureLog.log('[MDNSBridge] Disconnected from daemon');
          this.handleDisconnect();
          if (this.state === 'connecting') {
            resolve(false);
          }
        };

        this.ws.onerror = (error) => {
          secureLog.error('[MDNSBridge] WebSocket error:', error);
          this.events.onError?.(new Error('WebSocket connection error'));
          if (this.state === 'connecting') {
            resolve(false);
          }
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        secureLog.error('[MDNSBridge] Failed to connect:', error);
        this.setState('error');
        this.events.onError?.(error instanceof Error ? error : new Error(String(error)));
        resolve(false);
      }
    });
  }

  /**
   * Disconnect from the daemon
   */
  disconnect(): void {
    this.stopPing();
    this.clearConnectionTimeout();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.devices.clear();
    this.setState('disconnected');
    this.isDiscovering = false;
    this.isAdvertising = false;
    secureLog.log('[MDNSBridge] Disconnected');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection state
   */
  getState(): BridgeConnectionState {
    return this.state;
  }

  // ============================================================================
  // Discovery Operations
  // ============================================================================

  /**
   * Start discovering mDNS devices
   */
  startDiscovery(platformFilter?: TallowPlatform[]): void {
    this.isDiscovering = true;

    const message: WSStartDiscoveryMessage = {
      type: 'start-discovery',
      platformFilter,
    };

    this.send(message);
    secureLog.log('[MDNSBridge] Started discovery');
  }

  /**
   * Stop discovering mDNS devices
   */
  stopDiscovery(): void {
    this.isDiscovering = false;
    this.send({ type: 'stop-discovery' });
    secureLog.log('[MDNSBridge] Stopped discovery');
  }

  /**
   * Get currently discovered devices
   */
  getDevices(): TallowDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get a specific device by ID
   */
  getDevice(deviceId: string): TallowDevice | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Request current device list from daemon
   */
  refreshDevices(): void {
    this.send({ type: 'get-devices' });
  }

  // ============================================================================
  // Advertising Operations
  // ============================================================================

  /**
   * Start advertising this device via mDNS
   */
  advertise(device: TallowDeviceAdvertisement): void {
    this.advertisedDevice = device;
    this.isAdvertising = true;

    this.send({
      type: 'advertise',
      device,
    });

    secureLog.log('[MDNSBridge] Started advertising:', device.name);
  }

  /**
   * Stop advertising this device
   */
  stopAdvertising(): void {
    this.advertisedDevice = null;
    this.isAdvertising = false;

    this.send({ type: 'stop-advertising' });
    secureLog.log('[MDNSBridge] Stopped advertising');
  }

  /**
   * Check if currently advertising
   */
  getIsAdvertising(): boolean {
    return this.isAdvertising;
  }

  /**
   * Get advertised device info
   */
  getAdvertisedDevice(): TallowDeviceAdvertisement | null {
    return this.advertisedDevice;
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Set event handlers
   */
  setEventHandlers(events: MDNSBridgeEvents): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Set a single event handler
   */
  on<K extends keyof MDNSBridgeEvents>(
    event: K,
    handler: MDNSBridgeEvents[K]
  ): void {
    this.events[event] = handler;
  }

  /**
   * Remove an event handler
   */
  off<K extends keyof MDNSBridgeEvents>(event: K): void {
    delete this.events[event];
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setState(state: BridgeConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.events.onStatusChange?.(state);
    }
  }

  private send(message: WSClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later
      this.messageQueue.push(message);
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as unknown;

      if (!isValidDaemonMessage(message)) {
        secureLog.warn('[MDNSBridge] Invalid message received:', data);
        return;
      }

      switch (message.type) {
        case 'device-found':
          this.handleDeviceFound(message.device);
          break;

        case 'device-lost':
          this.handleDeviceLost(message.deviceId);
          break;

        case 'device-updated':
          this.handleDeviceUpdated(message.device);
          break;

        case 'device-list':
          this.handleDeviceList(message.devices);
          break;

        case 'error':
          secureLog.error('[MDNSBridge] Daemon error:', message.message);
          this.events.onError?.(new Error(message.message));
          break;

        case 'status':
          this.isDiscovering = message.isDiscovering;
          this.isAdvertising = message.isAdvertising;
          break;

        case 'pong':
          // Keepalive response - connection is healthy
          break;
      }
    } catch (error) {
      secureLog.error('[MDNSBridge] Failed to parse message:', error);
    }
  }

  private handleDeviceFound(device: TallowDevice): void {
    this.devices.set(device.id, device);
    this.events.onDeviceFound?.(device);
    secureLog.log('[MDNSBridge] Device found:', device.name);
  }

  private handleDeviceLost(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      this.devices.delete(deviceId);
      this.events.onDeviceLost?.(deviceId);
      secureLog.log('[MDNSBridge] Device lost:', device.name);
    }
  }

  private handleDeviceUpdated(device: TallowDevice): void {
    this.devices.set(device.id, device);
    this.events.onDeviceUpdated?.(device);
  }

  private handleDeviceList(devices: TallowDevice[]): void {
    this.devices.clear();
    devices.forEach((device) => {
      this.devices.set(device.id, device);
    });
    this.events.onDeviceList?.(devices);
  }

  private handleDisconnect(): void {
    this.clearConnectionTimeout();
    this.stopPing();
    this.ws = null;

    if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.setState('reconnecting');
      this.scheduleReconnect();
    } else {
      this.setState('disconnected');
      this.devices.clear();
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectAttempts++;

    const delay = this.options.reconnectDelay * Math.min(this.reconnectAttempts, 5);
    secureLog.log(`[MDNSBridge] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({
        type: 'ping',
        timestamp: Date.now(),
      });
    }, this.options.pingInterval);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    this.disconnect();
    this.events = {};
    this.messageQueue = [];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let bridgeInstance: MDNSBridge | null = null;

/**
 * Get the singleton mDNS bridge instance
 */
export function getMDNSBridge(options?: MDNSBridgeOptions): MDNSBridge {
  if (!bridgeInstance) {
    bridgeInstance = new MDNSBridge(options);
  }
  return bridgeInstance;
}

/**
 * Check if the mDNS daemon is available
 */
export async function isDaemonAvailable(
  url: string = `ws://localhost:${DAEMON_WS_PORT}`
): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 2000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    } catch {
      resolve(false);
    }
  });
}

export default MDNSBridge;
