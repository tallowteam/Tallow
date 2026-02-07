'use client';

/**
 * UDP Broadcast Discovery
 *
 * Provides UDP broadcast-based device discovery for local networks.
 * Since browsers cannot do raw UDP, this works via the daemon WebSocket bridge.
 *
 * Protocol:
 * - Broadcasts JSON messages to the local network
 * - Discovers devices without requiring mDNS/Bonjour
 * - Falls back gracefully when daemon is unavailable
 */

import { getDeviceId } from '@/lib/auth/user-identity';
import { DAEMON_WS_PORT } from '@/lib/discovery/mdns-types';
import secureLog from '@/lib/utils/secure-logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Broadcast message types
 */
export type BroadcastMessageType =
  | 'discover'      // Request other devices to announce
  | 'announce'      // Announce presence
  | 'goodbye';      // Leaving network

/**
 * Base broadcast message
 */
interface BaseBroadcastMessage {
  type: BroadcastMessageType;
  deviceId: string;
  timestamp: number;
  version: string;
}

/**
 * Discovery request message
 */
interface DiscoverMessage extends BaseBroadcastMessage {
  type: 'discover';
}

/**
 * Announcement message
 */
interface AnnounceMessage extends BaseBroadcastMessage {
  type: 'announce';
  deviceName: string;
  platform: string;
  port: number;
  capabilities: string[];
  fingerprint: string;
}

/**
 * Goodbye message
 */
interface GoodbyeMessage extends BaseBroadcastMessage {
  type: 'goodbye';
}

/**
 * Union of all broadcast messages
 */
export type BroadcastMessage = DiscoverMessage | AnnounceMessage | GoodbyeMessage;

/**
 * Received broadcast data
 */
export interface ReceivedBroadcast {
  message: BroadcastMessage;
  senderIP: string;
  senderPort: number;
  receivedAt: Date;
}

/**
 * Broadcast options
 */
export interface UDPBroadcastOptions {
  /** Daemon WebSocket URL */
  daemonUrl?: string;
  /** Broadcast port */
  port?: number;
  /** Broadcast interval in ms */
  broadcastInterval?: number;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Maximum reconnect attempts */
  maxReconnectAttempts?: number;
  /** Connection timeout in ms */
  connectionTimeout?: number;
}

/**
 * Broadcast callback
 */
type BroadcastCallback = (broadcast: ReceivedBroadcast) => void;

// ============================================================================
// Constants
// ============================================================================

/** Default broadcast port */
const DEFAULT_BROADCAST_PORT = 53319;

/** Default broadcast interval */
const DEFAULT_BROADCAST_INTERVAL = 5000; // 5 seconds

/** Protocol version */
const PROTOCOL_VERSION = '1.0.0';

/** Default daemon URL */
const DEFAULT_DAEMON_URL = `ws://localhost:${DAEMON_WS_PORT}`;

// ============================================================================
// WebSocket Protocol Messages
// ============================================================================

/**
 * Client -> Daemon: Send UDP broadcast
 */
interface WSSendBroadcastMessage {
  type: 'send-broadcast';
  data: Uint8Array | number[];
  port: number;
}

/**
 * Client -> Daemon: Start listening for broadcasts
 */
interface WSStartListeningMessage {
  type: 'start-broadcast-listen';
  port: number;
}

/**
 * Client -> Daemon: Stop listening
 */
interface WSStopListeningMessage {
  type: 'stop-broadcast-listen';
}

/**
 * Daemon -> Client: Broadcast received
 */
interface WSBroadcastReceivedMessage {
  type: 'broadcast-received';
  data: number[];
  senderIP: string;
  senderPort: number;
}

/**
 * Union of all WebSocket messages
 */
type WSBroadcastClientMessage =
  | WSSendBroadcastMessage
  | WSStartListeningMessage
  | WSStopListeningMessage;

type WSBroadcastDaemonMessage = WSBroadcastReceivedMessage;

// ============================================================================
// UDP Broadcast Class
// ============================================================================

/**
 * UDP broadcast discovery client
 */
export class UDPBroadcast {
  private options: Required<UDPBroadcastOptions>;
  private ws: WebSocket | null = null;
  private listeners: Set<BroadcastCallback> = new Set();
  private isConnected = false;
  private isListening = false;
  private broadcastTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private myDeviceId: string = '';
  private myDeviceName: string = '';
  private myPlatform: string = '';
  private myPort: number = 53317;
  private myCapabilities: string[] = ['pqc', 'chat', 'folder', 'group'];
  private myFingerprint: string = '';

  constructor(options: UDPBroadcastOptions = {}) {
    this.options = {
      daemonUrl: options.daemonUrl || DEFAULT_DAEMON_URL,
      port: options.port || DEFAULT_BROADCAST_PORT,
      broadcastInterval: options.broadcastInterval || DEFAULT_BROADCAST_INTERVAL,
      autoReconnect: options.autoReconnect ?? true,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      connectionTimeout: options.connectionTimeout || 5000,
    };

    if (typeof window !== 'undefined') {
      this.myDeviceId = getDeviceId();
      this.myDeviceName = this.generateDeviceName();
      this.myPlatform = this.detectPlatform();
      this.myFingerprint = this.generateFingerprint();
    }
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  /**
   * Connect to daemon and start discovery
   */
  async start(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    // Check browser support
    if (typeof window === 'undefined') {
      return false;
    }

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.options.daemonUrl);

        const timeout = setTimeout(() => {
          if (!this.isConnected) {
            secureLog.warn('[UDPBroadcast] Connection timeout');
            this.handleDisconnect();
            resolve(false);
          }
        }, this.options.connectionTimeout);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          secureLog.log('[UDPBroadcast] Connected to daemon');

          // Start listening for broadcasts
          this.startListening();

          // Start periodic broadcasts
          this.startBroadcasting();

          resolve(true);
        };

        this.ws.onclose = () => {
          secureLog.log('[UDPBroadcast] Disconnected from daemon');
          this.handleDisconnect();
          if (!this.isConnected) {
            resolve(false);
          }
        };

        this.ws.onerror = (error) => {
          secureLog.error('[UDPBroadcast] WebSocket error:', error);
          if (!this.isConnected) {
            resolve(false);
          }
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        secureLog.error('[UDPBroadcast] Failed to connect:', error);
        resolve(false);
      }
    });
  }

  /**
   * Stop discovery and disconnect
   */
  stop(): void {
    this.stopBroadcasting();
    this.stopListening();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      // Send goodbye message before disconnecting
      this.sendGoodbye();

      // Give it a moment to send
      setTimeout(() => {
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
      }, 100);
    }

    this.isConnected = false;
    this.isListening = false;
  }

  /**
   * Check if connected
   */
  getIsConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // ============================================================================
  // Broadcasting
  // ============================================================================

  /**
   * Start periodic broadcasts
   */
  private startBroadcasting(): void {
    if (this.broadcastTimer) {
      return;
    }

    // Send initial discovery request
    this.sendDiscover();

    // Send periodic announcements
    this.broadcastTimer = setInterval(() => {
      this.sendAnnounce();
    }, this.options.broadcastInterval);
  }

  /**
   * Stop periodic broadcasts
   */
  private stopBroadcasting(): void {
    if (this.broadcastTimer) {
      clearInterval(this.broadcastTimer);
      this.broadcastTimer = null;
    }
  }

  /**
   * Send a broadcast message
   */
  sendBroadcast(message: Uint8Array, port?: number): void {
    if (!this.isConnected || !this.ws) {
      secureLog.warn('[UDPBroadcast] Cannot send: not connected');
      return;
    }

    const broadcastPort = port || this.options.port;

    const msg: WSSendBroadcastMessage = {
      type: 'send-broadcast',
      data: Array.from(message),
      port: broadcastPort,
    };

    this.send(msg);
  }

  /**
   * Send discovery request
   */
  private sendDiscover(): void {
    const message: DiscoverMessage = {
      type: 'discover',
      deviceId: this.myDeviceId,
      timestamp: Date.now(),
      version: PROTOCOL_VERSION,
    };

    this.sendBroadcastMessage(message);
  }

  /**
   * Send announcement
   */
  private sendAnnounce(): void {
    const message: AnnounceMessage = {
      type: 'announce',
      deviceId: this.myDeviceId,
      deviceName: this.myDeviceName,
      platform: this.myPlatform,
      port: this.myPort,
      capabilities: this.myCapabilities,
      fingerprint: this.myFingerprint,
      timestamp: Date.now(),
      version: PROTOCOL_VERSION,
    };

    this.sendBroadcastMessage(message);
  }

  /**
   * Send goodbye message
   */
  private sendGoodbye(): void {
    const message: GoodbyeMessage = {
      type: 'goodbye',
      deviceId: this.myDeviceId,
      timestamp: Date.now(),
      version: PROTOCOL_VERSION,
    };

    this.sendBroadcastMessage(message);
  }

  /**
   * Send a broadcast message (JSON encoded)
   */
  private sendBroadcastMessage(message: BroadcastMessage): void {
    const json = JSON.stringify(message);
    const bytes = new TextEncoder().encode(json);
    this.sendBroadcast(bytes);
  }

  // ============================================================================
  // Listening
  // ============================================================================

  /**
   * Start listening for broadcasts
   */
  private startListening(): void {
    if (this.isListening || !this.ws) {
      return;
    }

    const msg: WSStartListeningMessage = {
      type: 'start-broadcast-listen',
      port: this.options.port,
    };

    this.send(msg);
    this.isListening = true;
  }

  /**
   * Stop listening for broadcasts
   */
  private stopListening(): void {
    if (!this.isListening || !this.ws) {
      return;
    }

    const msg: WSStopListeningMessage = {
      type: 'stop-broadcast-listen',
    };

    this.send(msg);
    this.isListening = false;
  }

  /**
   * Register callback for received broadcasts
   */
  onBroadcastReceived(callback: BroadcastCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Set device information for broadcasts
   */
  setDeviceInfo(info: {
    name?: string;
    platform?: string;
    port?: number;
    capabilities?: string[];
    fingerprint?: string;
  }): void {
    if (info.name) {this.myDeviceName = info.name;}
    if (info.platform) {this.myPlatform = info.platform;}
    if (info.port) {this.myPort = info.port;}
    if (info.capabilities) {this.myCapabilities = info.capabilities;}
    if (info.fingerprint) {this.myFingerprint = info.fingerprint;}
  }

  /**
   * Set broadcast interval
   */
  setBroadcastInterval(intervalMs: number): void {
    this.options.broadcastInterval = intervalMs;

    if (this.broadcastTimer) {
      this.stopBroadcasting();
      this.startBroadcasting();
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Send message to daemon
   */
  private send(message: WSBroadcastClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as WSBroadcastDaemonMessage;

      if (message.type === 'broadcast-received') {
        this.handleBroadcastReceived(message);
      }
    } catch (error) {
      secureLog.error('[UDPBroadcast] Failed to parse message:', error);
    }
  }

  /**
   * Handle received broadcast
   */
  private handleBroadcastReceived(msg: WSBroadcastReceivedMessage): void {
    try {
      // Convert array to Uint8Array
      const bytes = new Uint8Array(msg.data);

      // Decode JSON
      const json = new TextDecoder().decode(bytes);
      const broadcast = JSON.parse(json) as BroadcastMessage;

      // Ignore our own broadcasts
      if (broadcast.deviceId === this.myDeviceId) {
        return;
      }

      // Validate message
      if (!this.isValidBroadcast(broadcast)) {
        secureLog.warn('[UDPBroadcast] Invalid broadcast received');
        return;
      }

      // Notify listeners
      const received: ReceivedBroadcast = {
        message: broadcast,
        senderIP: msg.senderIP,
        senderPort: msg.senderPort,
        receivedAt: new Date(),
      };

      this.listeners.forEach((callback) => {
        try {
          callback(received);
        } catch (error) {
          secureLog.error('[UDPBroadcast] Listener error:', error);
        }
      });

      // If we received a discovery request, send an announcement
      if (broadcast.type === 'discover') {
        // Small random delay to prevent broadcast storm
        const delay = Math.random() * 1000;
        setTimeout(() => this.sendAnnounce(), delay);
      }
    } catch (error) {
      secureLog.error('[UDPBroadcast] Failed to handle broadcast:', error);
    }
  }

  /**
   * Validate broadcast message
   */
  private isValidBroadcast(msg: unknown): msg is BroadcastMessage {
    if (!msg || typeof msg !== 'object') {return false;}

    const m = msg as Partial<BroadcastMessage>;

    return (
      typeof m.type === 'string' &&
      ['discover', 'announce', 'goodbye'].includes(m.type) &&
      typeof m.deviceId === 'string' &&
      typeof m.timestamp === 'number' &&
      typeof m.version === 'string'
    );
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(): void {
    this.isConnected = false;
    this.isListening = false;
    this.stopBroadcasting();

    if (this.ws) {
      this.ws = null;
    }

    // Auto-reconnect if enabled
    if (
      this.options.autoReconnect &&
      this.reconnectAttempts < this.options.maxReconnectAttempts
    ) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectAttempts * 2000, 30000);

    secureLog.log(
      `[UDPBroadcast] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.start();
    }, delay);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Generate device name
   */
  private generateDeviceName(): string {
    const platform = this.detectPlatform();
    const suffix = this.myDeviceId.slice(-4);
    return `${platform}-${suffix}`;
  }

  /**
   * Detect platform
   */
  private detectPlatform(): string {
    if (typeof navigator === 'undefined') {return 'unknown';}

    const ua = navigator.userAgent.toLowerCase();

    if (ua.includes('mac')) {return 'macos';}
    if (ua.includes('win')) {return 'windows';}
    if (ua.includes('linux')) {return 'linux';}
    if (ua.includes('iphone') || ua.includes('ipad')) {return 'ios';}
    if (ua.includes('android')) {return 'android';}

    return 'web';
  }

  /**
   * Generate fingerprint
   */
  private generateFingerprint(): string {
    const data = new TextEncoder().encode(this.myDeviceId);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      if (byte !== undefined) {
        hash = ((hash << 5) - hash) + byte;
        hash |= 0;
      }
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.listeners.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let udpBroadcastInstance: UDPBroadcast | null = null;

/**
 * Get the singleton UDP broadcast instance
 */
export function getUDPBroadcast(options?: UDPBroadcastOptions): UDPBroadcast {
  if (!udpBroadcastInstance) {
    udpBroadcastInstance = new UDPBroadcast(options);
  }
  return udpBroadcastInstance;
}

/**
 * Check if UDP broadcast daemon is available
 */
export async function isUDPBroadcastAvailable(
  daemonUrl: string = DEFAULT_DAEMON_URL
): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(daemonUrl);
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

export default UDPBroadcast;
