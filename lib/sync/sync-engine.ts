/**
 * Multi-Device Sync Engine
 * Agent 029 — SYNC-COORDINATOR
 *
 * Synchronizes device state, contacts, and settings across
 * multiple devices owned by the same user. Uses encrypted
 * WebSocket channels for real-time sync with conflict resolution.
 */

export interface VectorClock {
  [deviceId: string]: number;
}

export interface SyncState {
  deviceId: string;
  timestamp: number;
  vectorClock: VectorClock;
  data: {
    contacts?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    transfers?: Record<string, unknown>;
    custom?: Record<string, unknown>;
  };
  checksum: string;
}

export interface SyncMessage {
  type: 'register' | 'state-push' | 'state-pull' | 'state-update' | 'conflict' | 'ack';
  deviceId: string;
  timestamp: number;
  payload: unknown;
  signature?: string;
}

export interface SyncConflict {
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  localClock: VectorClock;
  remoteClock: VectorClock;
  resolution?: 'local' | 'remote' | 'merge';
}

export interface SyncConfig {
  relayUrl?: string;
  encryptionKey?: CryptoKey;
  deviceId?: string;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  maxOfflineQueue?: number;
}

export interface DeviceRegistration {
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  publicKey: string;
  registeredAt: number;
  lastSeen: number;
}

type SyncEventType = 'connected' | 'disconnected' | 'state-changed' | 'conflict' | 'error';
type SyncEventListener = (data: unknown) => void;

const DEFAULT_CONFIG = {
  relayUrl: process.env.NEXT_PUBLIC_RELAY_URL || 'ws://localhost:3001',
  reconnectDelay: 5000,
  heartbeatInterval: 30000,
  maxOfflineQueue: 100,
};

export class SyncEngine {
  private config: Required<Omit<SyncConfig, 'encryptionKey'>> & { encryptionKey?: CryptoKey };
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private localState: SyncState | null = null;
  private vectorClock: VectorClock = {};
  private offlineQueue: SyncMessage[] = [];
  private eventListeners: Map<SyncEventType, Set<SyncEventListener>> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private encryptionKey?: CryptoKey;
  private deviceRegistration: DeviceRegistration | null = null;

  constructor(config: SyncConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      deviceId: config.deviceId || this.generateDeviceId(),
      ...(config.encryptionKey ? { encryptionKey: config.encryptionKey } : {}),
    };

    if (config.encryptionKey) {
      this.encryptionKey = config.encryptionKey;
    }
    this.vectorClock[this.config.deviceId] = 0;
  }

  /**
   * Connect to the sync relay server
   */
  async connect(): Promise<void> {
    if (this.connected || this.isSocketOpen()) {
      console.warn('[Sync] Already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      const wsUrl = this.config.relayUrl.replace(/^http/, 'ws') + '/sync';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        console.log('[Sync] Connected to relay server');
        this.connected = true;
        this.startHeartbeat();

        // Register device
        await this.registerDevice();

        // Replay offline queue
        await this.replayOfflineQueue();

        this.emit('connected', { deviceId: this.config.deviceId });
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('[Sync] WebSocket error:', error);
        this.emit('error', { error });
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('[Sync] Connection closed');
        this.connected = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
        this.emit('disconnected', {});
      };

      this.ws.onmessage = async (event) => {
        await this.handleMessage(event.data);
      };
    });
  }

  /**
   * Disconnect from the sync server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
  }

  /**
   * Push local state to other devices
   */
  async pushState(state: Partial<SyncState['data']>): Promise<void> {
    this.incrementClock();

    const syncState: SyncState = {
      deviceId: this.config.deviceId,
      timestamp: Date.now(),
      vectorClock: { ...this.vectorClock },
      data: state,
      checksum: await this.computeChecksum(state),
    };

    this.localState = syncState;

    const message: SyncMessage = {
      type: 'state-push',
      deviceId: this.config.deviceId,
      timestamp: Date.now(),
      payload: syncState,
    };

    await this.sendMessage(message);
  }

  /**
   * Pull latest state from other devices
   */
  async pullState(): Promise<SyncState | null> {
    const message: SyncMessage = {
      type: 'state-pull',
      deviceId: this.config.deviceId,
      timestamp: Date.now(),
      payload: { vectorClock: this.vectorClock },
    };

    await this.sendMessage(message);
    return this.localState;
  }

  /**
   * Resolve a sync conflict
   */
  async resolveConflict(conflict: SyncConflict, resolution: 'local' | 'remote' | 'merge'): Promise<void> {
    conflict.resolution = resolution;

    if (resolution === 'local') {
      // Keep local value, increment clock
      this.incrementClock();
      await this.pushState({ [conflict.field]: conflict.localValue } as Partial<SyncState['data']>);
    } else if (resolution === 'remote') {
      // Accept remote value, update clock
      this.mergeClock(conflict.remoteClock);
      if (this.localState) {
        this.localState.data = {
          ...this.localState.data,
          [conflict.field]: conflict.remoteValue,
        };
      }
      this.emit('state-changed', { field: conflict.field, value: conflict.remoteValue });
    } else if (resolution === 'merge') {
      // Application-specific merge logic
      const merged = this.mergeValues(conflict.localValue, conflict.remoteValue);
      this.incrementClock();
      await this.pushState({ [conflict.field]: merged } as Partial<SyncState['data']>);
    }

    const message: SyncMessage = {
      type: 'conflict',
      deviceId: this.config.deviceId,
      timestamp: Date.now(),
      payload: conflict,
    };

    await this.sendMessage(message);
  }

  /**
   * Register event listener
   */
  onStateChange(event: SyncEventType, listener: SyncEventListener): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  /**
   * Get current device registration
   */
  getDeviceRegistration(): DeviceRegistration | null {
    return this.deviceRegistration;
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(data: string): Promise<void> {
    try {
      const decrypted = await this.decryptMessage(data);
      const message = JSON.parse(decrypted) as SyncMessage;

      switch (message.type) {
        case 'state-update':
          await this.handleStateUpdate(message.payload as SyncState);
          break;

        case 'conflict':
          this.emit('conflict', message.payload);
          break;

        case 'ack':
          console.log('[Sync] Message acknowledged');
          break;

        default:
          console.warn('[Sync] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[Sync] Failed to handle message:', error);
      this.emit('error', { error });
    }
  }

  /**
   * Handle state update from remote device
   */
  private async handleStateUpdate(remoteState: SyncState): Promise<void> {
    if (!this.localState) {
      // No local state, accept remote
      this.localState = remoteState;
      this.mergeClock(remoteState.vectorClock);
      this.emit('state-changed', { state: remoteState });
      return;
    }

    // Compare vector clocks to detect conflicts
    const comparison = this.compareClocks(this.vectorClock, remoteState.vectorClock);

    if (comparison === 'before') {
      // Remote is newer, accept it
      this.localState = remoteState;
      this.mergeClock(remoteState.vectorClock);
      this.emit('state-changed', { state: remoteState });
    } else if (comparison === 'after') {
      // Local is newer, ignore remote
      console.log('[Sync] Local state is newer, ignoring remote update');
    } else if (comparison === 'concurrent') {
      // Concurrent modification, detect conflicts
      const conflicts = this.detectConflicts(this.localState, remoteState);

      if (conflicts.length > 0) {
        console.warn('[Sync] Detected conflicts:', conflicts);
        this.emit('conflict', { conflicts });
      } else {
        // No conflicts, merge states
        this.localState = this.mergeStates(this.localState, remoteState);
        this.mergeClock(remoteState.vectorClock);
        this.emit('state-changed', { state: this.localState });
      }
    }
  }

  /**
   * Send message through WebSocket or queue if offline
   */
  private async sendMessage(message: SyncMessage): Promise<void> {
    const encrypted = await this.encryptMessage(JSON.stringify(message));
    const ws = this.ws;

    if (this.connected && this.isSocketOpen() && ws) {
      ws.send(encrypted);
    } else {
      // Queue for later
      if (this.offlineQueue.length < this.config.maxOfflineQueue) {
        this.offlineQueue.push(message);
      } else {
        console.warn('[Sync] Offline queue full, dropping message');
      }
    }
  }

  /**
   * Register this device with the sync server
   */
  private async registerDevice(): Promise<void> {
    this.deviceRegistration = {
      deviceId: this.config.deviceId,
      deviceName: this.getDeviceName(),
      deviceType: this.getDeviceType(),
      publicKey: await this.getPublicKey(),
      registeredAt: Date.now(),
      lastSeen: Date.now(),
    };

    const message: SyncMessage = {
      type: 'register',
      deviceId: this.config.deviceId,
      timestamp: Date.now(),
      payload: this.deviceRegistration,
    };

    await this.sendMessage(message);
  }

  /**
   * Replay queued messages after reconnection
   */
  private async replayOfflineQueue(): Promise<void> {
    console.log(`[Sync] Replaying ${this.offlineQueue.length} queued messages`);

    while (this.offlineQueue.length > 0) {
      const message = this.offlineQueue.shift()!;
      await this.sendMessage(message);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Encrypt message using AES-256-GCM
   */
  private async encryptMessage(plaintext: string): Promise<string> {
    if (!this.encryptionKey) {
      return plaintext; // No encryption if key not provided
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      data
    );

    // Combine IV and ciphertext
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt message using AES-256-GCM
   */
  private async decryptMessage(ciphertext: string): Promise<string> {
    if (!this.encryptionKey) {
      return ciphertext; // No decryption if key not provided
    }

    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Compute SHA-256 checksum of state data
   */
  private async computeChecksum(data: unknown): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Increment local vector clock
   */
  private incrementClock(): void {
    this.vectorClock[this.config.deviceId] = (this.vectorClock[this.config.deviceId] || 0) + 1;
  }

  /**
   * Merge remote vector clock into local
   */
  private mergeClock(remoteClock: VectorClock): void {
    for (const [deviceId, timestamp] of Object.entries(remoteClock)) {
      this.vectorClock[deviceId] = Math.max(
        this.vectorClock[deviceId] || 0,
        timestamp
      );
    }
  }

  /**
   * Compare two vector clocks
   */
  private compareClocks(
    clock1: VectorClock,
    clock2: VectorClock
  ): 'before' | 'after' | 'concurrent' | 'equal' {
    const allDevices = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);

    let before = false;
    let after = false;

    for (const deviceId of allDevices) {
      const t1 = clock1[deviceId] || 0;
      const t2 = clock2[deviceId] || 0;

      if (t1 < t2) {before = true;}
      if (t1 > t2) {after = true;}
    }

    if (!before && !after) {return 'equal';}
    if (before && !after) {return 'before';}
    if (!before && after) {return 'after';}
    return 'concurrent';
  }

  /**
   * Detect conflicts between local and remote states
   */
  private detectConflicts(local: SyncState, remote: SyncState): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    const allFields = new Set([
      ...Object.keys(local.data),
      ...Object.keys(remote.data),
    ]);

    for (const field of allFields) {
      const localValue = (local.data as Record<string, unknown>)[field];
      const remoteValue = (remote.data as Record<string, unknown>)[field];

      if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
        conflicts.push({
          field,
          localValue,
          remoteValue,
          localClock: local.vectorClock,
          remoteClock: remote.vectorClock,
        });
      }
    }

    return conflicts;
  }

  /**
   * Merge two states (simple last-write-wins)
   */
  private mergeStates(local: SyncState, remote: SyncState): SyncState {
    return {
      deviceId: this.config.deviceId,
      timestamp: Math.max(local.timestamp, remote.timestamp),
      vectorClock: { ...local.vectorClock, ...remote.vectorClock },
      data: { ...local.data, ...remote.data },
      checksum: '', // Will be recomputed
    };
  }

  /**
   * Merge two values (application-specific logic)
   */
  private mergeValues(local: unknown, remote: unknown): unknown {
    // Simple merge: if both are objects, merge them; otherwise use remote
    if (typeof local === 'object' && typeof remote === 'object' && local !== null && remote !== null) {
      return { ...local as object, ...remote as object };
    }
    return remote;
  }

  /**
   * Emit event to listeners
   */
  private emit(event: SyncEventType, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const ws = this.ws;
      if (this.isSocketOpen() && ws) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {return;}

    this.reconnectTimer = setTimeout(() => {
      console.log('[Sync] Attempting to reconnect...');
      this.reconnectTimer = null;
      this.connect().catch(error => {
        console.error('[Sync] Reconnection failed:', error);
      });
    }, this.config.reconnectDelay);
  }

  /**
   * Check whether WebSocket is open, including test environments
   * where WebSocket.OPEN may be missing on the mocked constructor.
   */
  private isSocketOpen(): boolean {
    if (!this.ws) {
      return false;
    }

    const openState = typeof WebSocket !== 'undefined' && typeof WebSocket.OPEN === 'number'
      ? WebSocket.OPEN
      : 1;

    return this.ws.readyState === openState;
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device name from browser
   */
  private getDeviceName(): string {
    return navigator.userAgent || 'Unknown Device';
  }

  /**
   * Detect device type
   */
  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const ua = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Get public key for this device (placeholder for future implementation)
   */
  private async getPublicKey(): Promise<string> {
    // TODO: Implement proper key derivation
    return 'placeholder-public-key';
  }
}
