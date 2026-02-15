'use client';

/**
 * WebRTC Data Channel Manager for Group Transfers
 *
 * Provides reliable data channel creation and management for multi-peer
 * file transfers with connection state tracking and error recovery.
 *
 * Features:
 * - Multiple simultaneous peer connections (2-10 recipients)
 * - Connection quality monitoring
 * - Automatic reconnection with exponential backoff
 * - Graceful error handling
 * - Bandwidth throttling support
 * - Connection state management
 *
 * Architecture:
 * - Each recipient gets independent RTCPeerConnection
 * - Data channels configured for ordered, reliable delivery
 * - ICE candidate filtering for privacy
 * - Connection health monitoring
 */

import { getPrivateTransport, type TransportStats } from '../transport/private-webrtc';
import secureLog from '../utils/secure-logger';
import {
  detectNATType,
  getConnectionStrategy,
  getOptimizedICEConfig,
  type NATType,
  type NATDetectionResult,
  type ConnectionStrategyResult,
} from '../network/nat-detection';
import { recordWebRTCConnection, recordError, activeConnections, turnRelayUsage } from '../monitoring/metrics';

// ============================================================================
// Type Definitions
// ============================================================================

export type DataChannelState = 'connecting' | 'open' | 'closing' | 'closed' | 'failed';
export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';

/**
 * RTCDataChannel stats from WebRTC statistics API
 */
interface RTCDataChannelStats {
  type: 'data-channel';
  bytesReceived?: number;
  bytesSent?: number;
  messagesReceived?: number;
  messagesSent?: number;
  label?: string;
  protocol?: string;
  dataChannelIdentifier?: number;
  state?: RTCDataChannelState;
}

export interface DataChannelConfig {
  ordered: boolean;
  maxRetransmits?: number;
  maxPacketLifeTime?: number;
  label?: string;
  protocol?: string;
}

export interface PeerChannelInfo {
  peerId: string;
  peerName: string;
  socketId: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  state: DataChannelState;
  quality: ConnectionQuality;
  isInitiator: boolean;
  createdAt: number;
  connectedAt?: number;
  lastActivity?: number;
  stats: PeerConnectionStats;
}

export interface PeerConnectionStats {
  bytesReceived: number;
  bytesSent: number;
  packetsLost: number;
  roundTripTime: number; // ms
  bandwidth: number; // bytes per second
  jitter: number; // ms
}

export interface DataChannelManagerConfig {
  maxPeers?: number;
  iceServers?: RTCIceServer[];
  connectionTimeout?: number;
  reconnectAttempts?: number;
  statsInterval?: number;
  enablePrivacyMode?: boolean;
  bandwidthLimit?: number; // bytes per second per peer
  enableNATDetection?: boolean;
  turnServer?: string;
  turnCredentials?: { username: string; credential: string };
}

export interface DataChannelEvents {
  onPeerConnected?: (peerId: string, dataChannel: RTCDataChannel) => void;
  onPeerDisconnected?: (peerId: string, reason: string) => void;
  onPeerError?: (peerId: string, error: Error) => void;
  onQualityChange?: (peerId: string, quality: ConnectionQuality) => void;
  onMessage?: (peerId: string, data: string | ArrayBuffer) => void;
  onNATDetected?: (result: NATDetectionResult) => void;
  onConnectionStrategyDetermined?: (peerId: string, strategy: ConnectionStrategyResult) => void;
  /**
   * Called when an ICE restart offer needs to be sent to the remote peer.
   * The caller MUST relay this offer via the signaling server and return
   * the remote peer's answer. If this callback is not provided, ICE
   * restart offers will be created but never delivered (the original bug).
   */
  onICERestartNeeded?: (
    peerId: string,
    offer: RTCSessionDescriptionInit,
  ) => Promise<RTCSessionDescriptionInit>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<DataChannelManagerConfig> = {
  maxPeers: 10,
  iceServers: [],
  connectionTimeout: 30000, // 30 seconds
  reconnectAttempts: 3,
  statsInterval: 2000, // 2 seconds
  enablePrivacyMode: true,
  bandwidthLimit: 0, // unlimited
  enableNATDetection: true,
  turnServer: '',
  turnCredentials: { username: '', credential: '' },
};

// Optimized for maximum throughput with app-level reliability
const DATA_CHANNEL_CONFIG: DataChannelConfig = {
  ordered: false, // Unordered for max speed (app handles ordering)
  maxRetransmits: 0, // No WebRTC retransmits (app handles reliability)
  label: 'tallow-group-transfer',
  protocol: 'pqc-v1',
};

// Backpressure thresholds
const BUFFER_HIGH_THRESHOLD = 16 * 1024 * 1024; // 16MB - pause sending
const BUFFER_LOW_THRESHOLD = 4 * 1024 * 1024; // 4MB - resume sending

// ICE-BREAKER Agent 022: exponential backoff 1s -> 2s -> 4s (max 3 retries)
const RECONNECT_DELAYS = [1000, 2000, 4000]; // ms - exponential backoff
const PING_INTERVAL = 5000; // 5 seconds
const ACTIVITY_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// Data Channel Manager
// ============================================================================

export class DataChannelManager {
  private peers: Map<string, PeerChannelInfo> = new Map();
  private config: Required<DataChannelManagerConfig>;
  private events: DataChannelEvents = {};
  private privateTransport: ReturnType<typeof getPrivateTransport>;
  private statsIntervals: Map<string, NodeJS.Timeout> = new Map();
  private pingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();

  // NAT detection state
  private localNATResult: NATDetectionResult | null = null;
  private peerNATTypes: Map<string, NATType> = new Map();
  private connectionStrategies: Map<string, ConnectionStrategyResult> = new Map();
  private natDetectionPromise: Promise<NATDetectionResult> | null = null;

  constructor(config?: DataChannelManagerConfig, events?: DataChannelEvents) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.events = events || {};

    // Initialize private transport for IP leak prevention
    this.privateTransport = getPrivateTransport({
      forceRelay: this.config.enablePrivacyMode,
      logCandidates: process.env.NODE_ENV === 'development',
      onIpLeakDetected: (candidate) => {
        secureLog.warn('[DataChannel] IP leak detected:', candidate.candidate);
      },
    });

    secureLog.log('[DataChannel] Manager initialized', {
      maxPeers: this.config.maxPeers,
      privacyMode: this.config.enablePrivacyMode,
      natDetection: this.config.enableNATDetection,
    });

    // Start NAT detection in background if enabled
    if (this.config.enableNATDetection) {
      this.detectNAT().catch((err) => {
        secureLog.warn('[DataChannel] Background NAT detection failed:', err);
      });
    }
  }

  // ==========================================================================
  // Peer Connection Management
  // ==========================================================================

  /**
   * Create data channel connection to a peer (as initiator)
   */
  async createConnection(
    peerId: string,
    peerName: string,
    socketId: string
  ): Promise<{ offer: RTCSessionDescriptionInit; dataChannel: RTCDataChannel }> {
    if (this.peers.has(peerId)) {
      throw new Error(`Connection to peer ${peerId} already exists`);
    }

    if (this.peers.size >= this.config.maxPeers) {
      throw new Error(`Maximum peer limit reached (${this.config.maxPeers})`);
    }

    secureLog.log(`[DataChannel] Creating connection to peer: ${peerName}`);

    await this.ensureNATReadyBeforeNegotiation('offer', peerId, peerName);

    // Create peer connection with privacy-preserving config
    const rtcConfig = this.privateTransport.getRTCConfiguration();
    const connection = new RTCPeerConnection(rtcConfig);

    // Create data channel with optimized configuration for maximum throughput
    const dataChannelInit: RTCDataChannelInit = {
      ordered: DATA_CHANNEL_CONFIG.ordered, // false for max speed
      ...(DATA_CHANNEL_CONFIG.maxRetransmits !== undefined ? { maxRetransmits: DATA_CHANNEL_CONFIG.maxRetransmits } : {}),
    };

    if (DATA_CHANNEL_CONFIG.maxPacketLifeTime !== undefined) {
      dataChannelInit.maxPacketLifeTime = DATA_CHANNEL_CONFIG.maxPacketLifeTime;
    }
    if (DATA_CHANNEL_CONFIG.protocol !== undefined) {
      dataChannelInit.protocol = DATA_CHANNEL_CONFIG.protocol;
    }

    const dataChannel = connection.createDataChannel(
      DATA_CHANNEL_CONFIG.label || 'tallow-transfer',
      dataChannelInit
    );

    // Set bufferedAmountLowThreshold for backpressure handling
    dataChannel.bufferedAmountLowThreshold = BUFFER_LOW_THRESHOLD;

    // Store peer info
    const peerInfo: PeerChannelInfo = {
      peerId,
      peerName,
      socketId,
      connection,
      dataChannel,
      state: 'connecting',
      quality: 'disconnected',
      isInitiator: true,
      createdAt: Date.now(),
      stats: {
        bytesReceived: 0,
        bytesSent: 0,
        packetsLost: 0,
        roundTripTime: 0,
        bandwidth: 0,
        jitter: 0,
      },
    };

    this.peers.set(peerId, peerInfo);

    // Setup connection handlers
    this.setupConnectionHandlers(connection, peerId);
    this.setupDataChannelHandlers(dataChannel, peerId);

    // Monitor connection for privacy compliance
    this.privateTransport.monitorConnection(connection);

    // Create offer
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    // Wait for ICE gathering
    await this.waitForIceGathering(connection);

    // Start monitoring
    this.startMonitoring(peerId);

    secureLog.log(`[DataChannel] Created offer for peer: ${peerName}`, {
      ordered: dataChannelInit.ordered,
      maxRetransmits: dataChannelInit.maxRetransmits,
      bufferLowThreshold: BUFFER_LOW_THRESHOLD,
    });

    return { offer: connection.localDescription!, dataChannel };
  }

  /**
   * Accept incoming connection (as receiver)
   */
  async acceptConnection(
    peerId: string,
    peerName: string,
    socketId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<{ answer: RTCSessionDescriptionInit }> {
    if (this.peers.has(peerId)) {
      throw new Error(`Connection to peer ${peerId} already exists`);
    }

    if (this.peers.size >= this.config.maxPeers) {
      throw new Error(`Maximum peer limit reached (${this.config.maxPeers})`);
    }

    secureLog.log(`[DataChannel] Accepting connection from peer: ${peerName}`);

    await this.ensureNATReadyBeforeNegotiation('answer', peerId, peerName);

    // Create peer connection
    const rtcConfig = this.privateTransport.getRTCConfiguration();
    const connection = new RTCPeerConnection(rtcConfig);

    // Setup data channel handler (will receive channel from peer)
    let dataChannel: RTCDataChannel | null = null;
    connection.ondatachannel = (event) => {
      dataChannel = event.channel;
      const peerInfo = this.peers.get(peerId);
      if (peerInfo) {
        peerInfo.dataChannel = dataChannel;
        this.setupDataChannelHandlers(dataChannel, peerId);
      }
    };

    // Store peer info (without data channel yet)
    const peerInfo: PeerChannelInfo = {
      peerId,
      peerName,
      socketId,
      connection,
      dataChannel: null, // Will be set in ondatachannel
      state: 'connecting',
      quality: 'disconnected',
      isInitiator: false,
      createdAt: Date.now(),
      stats: {
        bytesReceived: 0,
        bytesSent: 0,
        packetsLost: 0,
        roundTripTime: 0,
        bandwidth: 0,
        jitter: 0,
      },
    };

    this.peers.set(peerId, peerInfo);

    // Setup connection handlers
    this.setupConnectionHandlers(connection, peerId);

    // Monitor connection
    this.privateTransport.monitorConnection(connection);

    // Set remote description and create answer
    await connection.setRemoteDescription(offer);
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    // Wait for ICE gathering
    await this.waitForIceGathering(connection);

    // Start monitoring
    this.startMonitoring(peerId);

    secureLog.log(`[DataChannel] Created answer for peer: ${peerName}`);

    return { answer: connection.localDescription! };
  }

  /**
   * Complete connection with answer (initiator side)
   */
  async completeConnection(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerInfo = this.peers.get(peerId);
    if (!peerInfo) {
      throw new Error(`Peer ${peerId} not found`);
    }

    await peerInfo.connection.setRemoteDescription(answer);
    secureLog.log(`[DataChannel] Connection completed for peer: ${peerInfo.peerName}`);
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerInfo = this.peers.get(peerId);
    if (!peerInfo) {
      secureLog.warn(`[DataChannel] Received ICE candidate for unknown peer: ${peerId}`);
      return;
    }

    try {
      await peerInfo.connection.addIceCandidate(candidate);
      secureLog.log(`[DataChannel] Added ICE candidate for peer: ${peerInfo.peerName}`);
    } catch (error) {
      secureLog.error(`[DataChannel] Failed to add ICE candidate:`, error);
    }
  }

  /**
   * Disconnect from a peer
   */
  disconnectPeer(peerId: string, reason: string = 'User requested'): void {
    const peerInfo = this.peers.get(peerId);
    if (!peerInfo) {return;}

    secureLog.log(`[DataChannel] Disconnecting peer: ${peerInfo.peerName} (${reason})`);

    // Stop monitoring
    this.stopMonitoring(peerId);

    // Close data channel
    if (peerInfo.dataChannel) {
      try {
        peerInfo.dataChannel.close();
      } catch (error) {
        secureLog.error(`[DataChannel] Error closing data channel:`, error);
      }
    }

    // Close peer connection
    try {
      peerInfo.connection.close();
    } catch (error) {
      secureLog.error(`[DataChannel] Error closing peer connection:`, error);
    }

    // Remove peer
    this.peers.delete(peerId);
    this.reconnectAttempts.delete(peerId);

    // Notify
    this.events.onPeerDisconnected?.(peerId, reason);
  }

  /**
   * Disconnect all peers
   */
  disconnectAll(): void {
    const peerIds = Array.from(this.peers.keys());
    for (const peerId of peerIds) {
      this.disconnectPeer(peerId, 'Manager shutdown');
    }
  }

  // ==========================================================================
  // Connection Handlers
  // ==========================================================================

  private setupConnectionHandlers(connection: RTCPeerConnection, peerId: string): void {
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        // ICE candidates are handled by signaling server
        // Filter for privacy if needed
        if (this.config.enablePrivacyMode && !this.privateTransport.filterCandidate(event.candidate)) {
          secureLog.log(`[DataChannel] Filtered non-relay ICE candidate for ${peerId}`);
        }
      }
    };

    connection.onconnectionstatechange = () => {
      const peerInfo = this.peers.get(peerId);
      if (!peerInfo) {return;}

      const state = connection.connectionState;
      secureLog.log(`[DataChannel] Connection state for ${peerInfo.peerName}: ${state}`);

      if (state === 'connected') {
        peerInfo.connectedAt = Date.now();
        peerInfo.quality = 'good';
        this.events.onQualityChange?.(peerId, 'good');
      } else if (state === 'failed' || state === 'disconnected') {
        this.handleConnectionFailure(peerId);
      }
    };

    connection.onicegatheringstatechange = () => {
      secureLog.log(`[DataChannel] ICE gathering state for ${peerId}: ${connection.iceGatheringState}`);
    };

    connection.oniceconnectionstatechange = () => {
      const peerInfo = this.peers.get(peerId);
      if (!peerInfo) {return;}

      secureLog.log(`[DataChannel] ICE connection state for ${peerInfo.peerName}: ${connection.iceConnectionState}`);

      if (connection.iceConnectionState === 'failed') {
        this.handleConnectionFailure(peerId);
      }
    };
  }

  private setupDataChannelHandlers(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.binaryType = 'arraybuffer';

    dataChannel.onopen = () => {
      const peerInfo = this.peers.get(peerId);
      if (!peerInfo) {return;}

      peerInfo.state = 'open';
      peerInfo.connectedAt = Date.now();
      peerInfo.lastActivity = Date.now();
      secureLog.log(`[DataChannel] Data channel open for ${peerInfo.peerName}`, {
        bufferedAmountLowThreshold: dataChannel.bufferedAmountLowThreshold,
        maxPacketLifeTime: dataChannel.maxPacketLifeTime,
        maxRetransmits: dataChannel.maxRetransmits,
        ordered: dataChannel.ordered,
      });

      // Record successful WebRTC connection metrics
      const connectionType = this.config.enablePrivacyMode ? 'relay' : 'direct';
      recordWebRTCConnection('success', connectionType);

      // Track TURN relay usage if privacy mode is enabled
      if (this.config.enablePrivacyMode) {
        turnRelayUsage.labels().inc();
      }

      this.events.onPeerConnected?.(peerId, dataChannel);

      // Start ping interval
      this.startPingInterval(peerId);
    };

    dataChannel.onclose = () => {
      const peerInfo = this.peers.get(peerId);
      if (peerInfo) {
        peerInfo.state = 'closed';
        secureLog.log(`[DataChannel] Data channel closed for ${peerInfo.peerName}`);

        // Decrement active connections gauge
        activeConnections.dec();
      }
      this.disconnectPeer(peerId, 'Data channel closed');
    };

    dataChannel.onerror = (event) => {
      const peerInfo = this.peers.get(peerId);
      const error = new Error('Data channel error');
      if (peerInfo) {
        secureLog.error(`[DataChannel] Error for ${peerInfo.peerName}:`, event);
        this.events.onPeerError?.(peerId, error);

        // Record WebRTC error
        recordError('network', 'error');
      }
    };

    dataChannel.onmessage = (event) => {
      const peerInfo = this.peers.get(peerId);
      if (peerInfo) {
        peerInfo.lastActivity = Date.now();
      }
      this.events.onMessage?.(peerId, event.data);
    };

    // Backpressure handling: resume sending when buffer drains
    dataChannel.onbufferedamountlow = () => {
      const peerInfo = this.peers.get(peerId);
      if (peerInfo) {
        secureLog.log(`[DataChannel] Buffer drained for ${peerInfo.peerName}, resuming send`);
      }
      // Notify that channel is ready to send more data
      // Application can use this to implement flow control
    };
  }

  /**
   * Check if channel has backpressure (buffer is full)
   */
  hasBackpressure(peerId: string): boolean {
    const peerInfo = this.peers.get(peerId);
    if (!peerInfo || !peerInfo.dataChannel) {return true;}

    const bufferedAmount = peerInfo.dataChannel.bufferedAmount;
    return bufferedAmount >= BUFFER_HIGH_THRESHOLD;
  }

  /**
   * Get current buffer level (0-1)
   */
  getBufferLevel(peerId: string): number {
    const peerInfo = this.peers.get(peerId);
    if (!peerInfo || !peerInfo.dataChannel) {return 1;}

    const bufferedAmount = peerInfo.dataChannel.bufferedAmount;
    return Math.min(1, bufferedAmount / BUFFER_HIGH_THRESHOLD);
  }

  /**
   * Send data with backpressure awareness
   * Returns false if send should be paused due to backpressure
   */
  sendData(peerId: string, data: ArrayBuffer | string): boolean {
    const peerInfo = this.peers.get(peerId);
    if (!peerInfo || !peerInfo.dataChannel || peerInfo.dataChannel.readyState !== 'open') {
      return false;
    }

    // Check backpressure before sending
    if (this.hasBackpressure(peerId)) {
      secureLog.log(`[DataChannel] Backpressure detected for ${peerInfo.peerName}, pausing send`);
      return false;
    }

    try {
      if (typeof data === 'string') {
        peerInfo.dataChannel.send(data);
      } else {
        peerInfo.dataChannel.send(data);
      }
      return true;
    } catch (error) {
      secureLog.error(`[DataChannel] Failed to send data to ${peerId}:`, error);
      return false;
    }
  }

  // ==========================================================================
  // Monitoring & Stats
  // ==========================================================================

  private startMonitoring(peerId: string): void {
    // Start stats collection
    const statsInterval = setInterval(() => {
      this.updateStats(peerId);
    }, this.config.statsInterval);

    this.statsIntervals.set(peerId, statsInterval);
  }

  private stopMonitoring(peerId: string): void {
    const statsInterval = this.statsIntervals.get(peerId);
    if (statsInterval) {
      clearInterval(statsInterval);
      this.statsIntervals.delete(peerId);
    }

    const pingInterval = this.pingIntervals.get(peerId);
    if (pingInterval) {
      clearInterval(pingInterval);
      this.pingIntervals.delete(peerId);
    }
  }

  private async updateStats(peerId: string): Promise<void> {
    const peerInfo = this.peers.get(peerId);
    if (!peerInfo || !peerInfo.dataChannel) {return;}

    try {
      const stats = await peerInfo.connection.getStats();
      let foundStats: RTCDataChannelStats | null = null;

      stats.forEach((report) => {
        if (report.type === 'data-channel') {
          foundStats = report as unknown as RTCDataChannelStats;
        }
      });

      if (foundStats) {
        const dataChannelStats = foundStats as RTCDataChannelStats;
        peerInfo.stats = {
          bytesReceived: dataChannelStats.bytesReceived ?? 0,
          bytesSent: dataChannelStats.bytesSent ?? 0,
          packetsLost: 0, // Not available for data channels
          roundTripTime: 0,
          bandwidth: 0,
          jitter: 0,
        };

        // Update connection quality based on stats
        this.updateConnectionQuality(peerId);
      }
    } catch (error) {
      secureLog.error(`[DataChannel] Failed to update stats for ${peerId}:`, error);
    }
  }

  private updateConnectionQuality(peerId: string): void {
    const peerInfo = this.peers.get(peerId);
    if (!peerInfo) {return;}

    let quality: ConnectionQuality = 'disconnected';

    if (peerInfo.state === 'open') {
      const timeSinceActivity = Date.now() - (peerInfo.lastActivity || Date.now());

      if (timeSinceActivity > ACTIVITY_TIMEOUT) {
        quality = 'poor';
      } else if (timeSinceActivity > ACTIVITY_TIMEOUT / 2) {
        quality = 'fair';
      } else if (peerInfo.stats.roundTripTime > 200) {
        quality = 'fair';
      } else if (peerInfo.stats.roundTripTime > 100) {
        quality = 'good';
      } else {
        quality = 'excellent';
      }
    }

    if (peerInfo.quality !== quality) {
      peerInfo.quality = quality;
      this.events.onQualityChange?.(peerId, quality);
    }
  }

  private startPingInterval(peerId: string): void {
    const interval = setInterval(() => {
      const peerInfo = this.peers.get(peerId);
      if (!peerInfo || peerInfo.state !== 'open' || !peerInfo.dataChannel) {
        clearInterval(interval);
        return;
      }

      try {
        // Send ping message
        peerInfo.dataChannel.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      } catch (error) {
        secureLog.error(`[DataChannel] Failed to send ping to ${peerId}:`, error);
      }
    }, PING_INTERVAL);

    this.pingIntervals.set(peerId, interval);
  }

  // ==========================================================================
  // Error Recovery
  // ==========================================================================

  private handleConnectionFailure(peerId: string): void {
    const peerInfo = this.peers.get(peerId);
    if (!peerInfo) {return;}

    const attempts = this.reconnectAttempts.get(peerId) || 0;

    if (attempts < this.config.reconnectAttempts) {
      secureLog.log(
        `[DataChannel] Connection failed for ${peerInfo.peerName}, ` +
        `attempting ICE restart (${attempts + 1}/${this.config.reconnectAttempts})`,
      );

      this.reconnectAttempts.set(peerId, attempts + 1);

      // ICE-BREAKER Agent 022: exponential backoff 1s -> 2s -> 4s
      const delay = RECONNECT_DELAYS[Math.min(attempts, RECONNECT_DELAYS.length - 1)] || 4000;
      setTimeout(() => {
        this.attemptReconnect(peerId);
      }, delay);
    } else {
      secureLog.error(
        `[DataChannel] Connection failed for ${peerInfo.peerName} ` +
        `after ${attempts} ICE restart attempts`,
      );

      // Record failed WebRTC connection metrics
      const connectionType = this.config.enablePrivacyMode ? 'relay' : 'direct';
      recordWebRTCConnection('failed', connectionType);
      recordError('network', 'error');

      this.disconnectPeer(peerId, 'Connection failed after ICE restart retries');
    }
  }

  /**
   * Attempt ICE restart: create offer with iceRestart:true, send it to
   * the remote peer via signaling, and apply the returned answer.
   *
   * ICE-BREAKER Agent 022 fix: The original implementation created the
   * restart offer but never sent it to the remote peer. The offer is now
   * delivered via the onICERestartNeeded callback, which the caller must
   * wire to the signaling server.
   */
  private async attemptReconnect(peerId: string): Promise<void> {
    const peerInfo = this.peers.get(peerId);
    if (!peerInfo) {return;}

    try {
      // Step 1: Create ICE restart offer.
      const offer = await peerInfo.connection.createOffer({ iceRestart: true });
      await peerInfo.connection.setLocalDescription(offer);

      // Step 2: Wait for ICE gathering to complete.
      await this.waitForIceGathering(peerInfo.connection);

      const localDesc = peerInfo.connection.localDescription;
      if (!localDesc) {
        throw new Error('Local description is null after ICE restart offer');
      }

      // Step 3: Send the restart offer via signaling and get the answer.
      if (!this.events.onICERestartNeeded) {
        secureLog.error(
          `[DataChannel] ICE restart for ${peerInfo.peerName}: ` +
          `no onICERestartNeeded callback registered -- offer cannot be delivered`,
        );
        // Fall through to failure handler so retries/disconnect proceed.
        this.handleConnectionFailure(peerId);
        return;
      }

      secureLog.log(
        `[DataChannel] ICE restart: sending offer to ${peerInfo.peerName} via signaling`,
      );

      const answer = await this.events.onICERestartNeeded(peerId, localDesc);

      // Step 4: Apply the remote answer.
      await peerInfo.connection.setRemoteDescription(answer);

      secureLog.log(
        `[DataChannel] ICE restart completed for ${peerInfo.peerName}`,
      );

      // Reset attempt counter on success.
      this.reconnectAttempts.set(peerId, 0);
    } catch (error) {
      secureLog.error(
        `[DataChannel] ICE restart failed for ${peerInfo.peerName}:`,
        error,
      );
      this.handleConnectionFailure(peerId);
    }
  }

  /**
   * Handle an incoming ICE restart offer from a remote peer.
   * Called by the signaling layer when the remote side initiates a restart.
   *
   * @returns The local answer to send back via signaling.
   */
  async handleRemoteICERestart(
    peerId: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit> {
    const peerInfo = this.peers.get(peerId);
    if (!peerInfo) {
      throw new Error(`Peer ${peerId} not found for ICE restart`);
    }

    secureLog.log(
      `[DataChannel] Handling remote ICE restart from ${peerInfo.peerName}`,
    );

    await peerInfo.connection.setRemoteDescription(offer);
    const answer = await peerInfo.connection.createAnswer();
    await peerInfo.connection.setLocalDescription(answer);

    await this.waitForIceGathering(peerInfo.connection);

    const localDesc = peerInfo.connection.localDescription;
    if (!localDesc) {
      throw new Error('Local description is null after creating restart answer');
    }

    secureLog.log(
      `[DataChannel] ICE restart answer created for ${peerInfo.peerName}`,
    );

    return localDesc;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private waitForIceGathering(connection: RTCPeerConnection): Promise<void> {
    return new Promise<void>((resolve) => {
      if (connection.iceGatheringState === 'complete') {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        secureLog.warn('[DataChannel] ICE gathering timeout, proceeding with available candidates');
        resolve();
      }, this.config.connectionTimeout);

      const handler = () => {
        if (connection.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          connection.removeEventListener('icegatheringstatechange', handler);
          resolve();
        }
      };

      connection.addEventListener('icegatheringstatechange', handler);
    });
  }

  /**
   * Ensure NAT detection completed before WebRTC negotiation starts.
   * This makes connection strategy decisions deterministic and logged.
   */
  private async ensureNATReadyBeforeNegotiation(
    direction: 'offer' | 'answer',
    peerId: string,
    peerName: string
  ): Promise<void> {
    if (!this.config.enableNATDetection) {
      return;
    }

    try {
      const result = await this.detectNAT();
      secureLog.log('[DataChannel] NAT ready before negotiation', {
        direction,
        peerId,
        peerName,
        natType: result.type,
        confidence: result.confidence,
      });
    } catch (error) {
      secureLog.warn('[DataChannel] NAT detection failed before negotiation, continuing with fallback strategy', {
        direction,
        peerId,
        peerName,
        error,
      });
    }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Get peer info
   */
  getPeer(peerId: string): PeerChannelInfo | undefined {
    return this.peers.get(peerId);
  }

  /**
   * Get all connected peers
   */
  getConnectedPeers(): PeerChannelInfo[] {
    return Array.from(this.peers.values()).filter(p => p.state === 'open');
  }

  /**
   * Get all peers
   */
  getAllPeers(): PeerChannelInfo[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get peer count
   */
  getPeerCount(): number {
    return this.peers.size;
  }

  /**
   * Check if connected to peer
   */
  isConnectedToPeer(peerId: string): boolean {
    const peer = this.peers.get(peerId);
    return peer?.state === 'open';
  }

  /**
   * Get connection stats
   */
  getStats(peerId: string): PeerConnectionStats | null {
    const peer = this.peers.get(peerId);
    return peer ? { ...peer.stats } : null;
  }

  /**
   * Get privacy stats
   */
  getPrivacyStats(): TransportStats {
    return this.privateTransport.getStats();
  }

  // ==========================================================================
  // NAT Detection API
  // ==========================================================================

  /**
   * Detect local NAT type
   */
  async detectNAT(): Promise<NATDetectionResult> {
    // Return cached result
    if (this.localNATResult) {
      return this.localNATResult;
    }

    // Wait for in-progress detection
    if (this.natDetectionPromise) {
      return this.natDetectionPromise;
    }

    // Start new detection
    this.natDetectionPromise = detectNATType();

    try {
      this.localNATResult = await this.natDetectionPromise;
      secureLog.log('[DataChannel] NAT detected:', {
        type: this.localNATResult.type,
        confidence: this.localNATResult.confidence,
      });
      this.events.onNATDetected?.(this.localNATResult);
      return this.localNATResult;
    } finally {
      this.natDetectionPromise = null;
    }
  }

  /**
   * Get local NAT detection result
   */
  getLocalNATResult(): NATDetectionResult | null {
    return this.localNATResult;
  }

  /**
   * Get local NAT type
   */
  getLocalNATType(): NATType | null {
    return this.localNATResult?.type ?? null;
  }

  /**
   * Set peer's NAT type (received via signaling)
   */
  setPeerNATType(peerId: string, natType: NATType): void {
    this.peerNATTypes.set(peerId, natType);

    // Calculate connection strategy
    if (this.localNATResult) {
      const strategy = getConnectionStrategy(this.localNATResult.type, natType);
      this.connectionStrategies.set(peerId, strategy);
      secureLog.log('[DataChannel] Connection strategy for', peerId, ':', {
        localNAT: this.localNATResult.type,
        remoteNAT: natType,
        strategy: strategy.strategy,
      });
      this.events.onConnectionStrategyDetermined?.(peerId, strategy);
    }
  }

  /**
   * Get peer's NAT type
   */
  getPeerNATType(peerId: string): NATType | null {
    return this.peerNATTypes.get(peerId) ?? null;
  }

  /**
   * Get connection strategy for a peer
   */
  getConnectionStrategy(peerId: string): ConnectionStrategyResult | null {
    return this.connectionStrategies.get(peerId) ?? null;
  }

  /**
   * Get optimized ICE configuration for a peer
   */
  getOptimizedICEConfig(_peerId: string): RTCConfiguration {
    if (!this.localNATResult) {
      return this.privateTransport.getRTCConfiguration();
    }

    const turnServer = this.config.turnServer || undefined;
    const turnCredentials = this.config.turnCredentials?.username
      ? this.config.turnCredentials
      : undefined;

    return getOptimizedICEConfig(
      this.localNATResult.type,
      turnServer,
      turnCredentials
    );
  }

  /**
   * Check if TURN relay should be used for a peer
   */
  shouldUseTURN(peerId: string): boolean {
    const strategy = this.connectionStrategies.get(peerId);
    return strategy?.useTURN ?? false;
  }

  /**
   * Get recommended timeout for direct connection to peer
   */
  getDirectConnectionTimeout(peerId: string): number {
    const strategy = this.connectionStrategies.get(peerId);
    return strategy?.directTimeout ?? this.config.connectionTimeout;
  }

  /**
   * Destroy manager
   */
  destroy(): void {
    this.disconnectAll();
    this.statsIntervals.clear();
    this.pingIntervals.clear();
    this.reconnectAttempts.clear();
    this.peerNATTypes.clear();
    this.connectionStrategies.clear();
    secureLog.log('[DataChannel] Manager destroyed');
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if WebRTC is supported
 */
export function isWebRTCSupported(): boolean {
  return !!(
    typeof RTCPeerConnection !== 'undefined' &&
    typeof RTCDataChannel !== 'undefined'
  );
}

/**
 * Validate data channel state
 */
export function isDataChannelOpen(dataChannel: RTCDataChannel | null): boolean {
  return dataChannel?.readyState === 'open';
}

export default DataChannelManager;
