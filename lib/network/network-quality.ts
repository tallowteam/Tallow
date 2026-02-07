/**
 * Network Quality Monitoring
 *
 * Continuously monitors network quality for active peer connections,
 * tracking RTT, packet loss, jitter, and signal strength changes.
 *
 * @module lib/network/network-quality
 */

import { EventEmitter } from 'events';
import {
  estimateSignalStrength,
  measureRTT,
  measurePacketLoss,
  calculateJitter,
  smoothRTT,
  type SignalLevel,
  type ProximityLevel,
  estimateProximity,
} from './signal-strength';
import type { ConnectionQuality } from '../types/shared';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Network quality metrics for a peer connection
 */
export interface NetworkQualityMetrics {
  /** Peer connection ID */
  peerId: string;
  /** Current round-trip time in milliseconds */
  rtt: number;
  /** Smoothed RTT for stability */
  smoothedRtt: number;
  /** Packet loss percentage (0-100) */
  packetLoss: number;
  /** Jitter in milliseconds */
  jitter: number;
  /** Signal strength level */
  signalLevel: SignalLevel;
  /** Proximity estimation */
  proximity: ProximityLevel;
  /** Connection quality */
  quality: ConnectionQuality;
  /** Last measurement timestamp */
  timestamp: number;
  /** Number of measurements taken */
  measurementCount: number;
}

/**
 * Quality change event data
 */
export interface QualityChangeEvent {
  /** Peer ID */
  peerId: string;
  /** Previous quality level */
  previousQuality: ConnectionQuality;
  /** New quality level */
  newQuality: ConnectionQuality;
  /** Current metrics */
  metrics: NetworkQualityMetrics;
}

/**
 * Signal strength change event data
 */
export interface SignalChangeEvent {
  /** Peer ID */
  peerId: string;
  /** Previous signal level */
  previousLevel: SignalLevel;
  /** New signal level */
  newLevel: SignalLevel;
  /** Current metrics */
  metrics: NetworkQualityMetrics;
}

/**
 * Monitor configuration options
 */
export interface NetworkQualityMonitorConfig {
  /** Measurement interval in milliseconds (default: 2000) */
  measurementInterval?: number;
  /** Number of RTT samples to keep for jitter calculation (default: 10) */
  sampleSize?: number;
  /** Smoothing factor for RTT (0-1, default: 0.3) */
  smoothingFactor?: number;
  /** Enable automatic monitoring (default: true) */
  autoStart?: boolean;
}

// ============================================================================
// NETWORK QUALITY MONITOR CLASS
// ============================================================================

/**
 * Monitors network quality for multiple peer connections
 *
 * Emits events:
 * - 'quality-change': When connection quality changes
 * - 'signal-change': When signal level changes
 * - 'metrics-update': On each measurement cycle
 * - 'error': When measurement fails
 *
 * @example
 * ```typescript
 * const monitor = new NetworkQualityMonitor({ measurementInterval: 3000 });
 *
 * monitor.on('quality-change', (event) => {
 *   console.log(`Quality changed from ${event.previousQuality} to ${event.newQuality}`);
 * });
 *
 * monitor.addPeer('peer-1', peerConnection);
 * monitor.start();
 * ```
 */
export class NetworkQualityMonitor extends EventEmitter {
  private config: Required<NetworkQualityMonitorConfig>;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private metrics: Map<string, NetworkQualityMetrics> = new Map();
  private rttSamples: Map<string, number[]> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config: NetworkQualityMonitorConfig = {}) {
    super();

    this.config = {
      measurementInterval: config.measurementInterval ?? 2000,
      sampleSize: config.sampleSize ?? 10,
      smoothingFactor: config.smoothingFactor ?? 0.3,
      autoStart: config.autoStart ?? true,
    };

    if (this.config.autoStart) {
      this.start();
    }
  }

  // ==========================================================================
  // PEER MANAGEMENT
  // ==========================================================================

  /**
   * Adds a peer connection to monitor
   *
   * @param peerId - Unique peer identifier
   * @param peerConnection - RTCPeerConnection to monitor
   */
  public addPeer(peerId: string, peerConnection: RTCPeerConnection): void {
    if (this.peers.has(peerId)) {
      console.warn(`[NetworkQualityMonitor] Peer ${peerId} already exists, replacing`);
    }

    this.peers.set(peerId, peerConnection);
    this.rttSamples.set(peerId, []);

    // Initialize metrics
    const initialMetrics: NetworkQualityMetrics = {
      peerId,
      rtt: 0,
      smoothedRtt: 0,
      packetLoss: 0,
      jitter: 0,
      signalLevel: 'disconnected',
      proximity: 'remote',
      quality: 'disconnected',
      timestamp: Date.now(),
      measurementCount: 0,
    };

    this.metrics.set(peerId, initialMetrics);

    // If already running, start monitoring this peer immediately
    if (this.isRunning) {
      this.measurePeer(peerId).catch((error) => {
        this.emit('error', { peerId, error });
      });
    }
  }

  /**
   * Removes a peer connection from monitoring
   *
   * @param peerId - Peer identifier to remove
   */
  public removePeer(peerId: string): void {
    this.peers.delete(peerId);
    this.metrics.delete(peerId);
    this.rttSamples.delete(peerId);
  }

  /**
   * Gets current metrics for a peer
   *
   * @param peerId - Peer identifier
   * @returns Current metrics or null if peer not found
   */
  public getMetrics(peerId: string): NetworkQualityMetrics | null {
    return this.metrics.get(peerId) ?? null;
  }

  /**
   * Gets metrics for all peers
   *
   * @returns Map of peer IDs to metrics
   */
  public getAllMetrics(): Map<string, NetworkQualityMetrics> {
    return new Map(this.metrics);
  }

  // ==========================================================================
  // MONITORING CONTROL
  // ==========================================================================

  /**
   * Starts monitoring all peers
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('[NetworkQualityMonitor] Already running');
      return;
    }

    this.isRunning = true;

    // Start periodic measurements
    this.intervalId = setInterval(() => {
      this.measureAllPeers().catch((error) => {
        this.emit('error', { error });
      });
    }, this.config.measurementInterval);

    // Immediate first measurement
    this.measureAllPeers().catch((error) => {
      this.emit('error', { error });
    });
  }

  /**
   * Stops monitoring all peers
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Clears all monitoring data and stops monitoring
   */
  public destroy(): void {
    this.stop();
    this.peers.clear();
    this.metrics.clear();
    this.rttSamples.clear();
    this.removeAllListeners();
  }

  // ==========================================================================
  // MEASUREMENT
  // ==========================================================================

  /**
   * Measures network quality for all peers
   */
  private async measureAllPeers(): Promise<void> {
    const measurementPromises = Array.from(this.peers.keys()).map((peerId) =>
      this.measurePeer(peerId).catch((error) => {
        this.emit('error', { peerId, error });
      })
    );

    await Promise.all(measurementPromises);
  }

  /**
   * Measures network quality for a single peer
   *
   * @param peerId - Peer identifier
   */
  private async measurePeer(peerId: string): Promise<void> {
    const peerConnection = this.peers.get(peerId);
    if (!peerConnection) {
      return;
    }

    const previousMetrics = this.metrics.get(peerId);
    if (!previousMetrics) {
      return;
    }

    try {
      // Measure current RTT and packet loss
      const currentRtt = await measureRTT(peerConnection);
      const packetLoss = await measurePacketLoss(peerConnection);

      // If RTT measurement failed, mark as disconnected
      if (currentRtt === null) {
        this.updateMetrics(peerId, {
          ...previousMetrics,
          signalLevel: 'disconnected',
          quality: 'disconnected',
          timestamp: Date.now(),
        });
        return;
      }

      // Update RTT samples for jitter calculation
      const samples = this.rttSamples.get(peerId) ?? [];
      samples.push(currentRtt);

      // Keep only recent samples
      if (samples.length > this.config.sampleSize) {
        samples.shift();
      }

      this.rttSamples.set(peerId, samples);

      // Calculate smoothed RTT
      const smoothedRtt = smoothRTT(
        currentRtt,
        previousMetrics.smoothedRtt || currentRtt,
        this.config.smoothingFactor
      );

      // Calculate jitter from samples
      const jitter = calculateJitter(samples);

      // Estimate signal level and quality
      const signalLevel = estimateSignalStrength(smoothedRtt, packetLoss);
      const proximity = estimateProximity(smoothedRtt);
      const quality = this.mapSignalToQuality(signalLevel);

      // Update metrics
      const newMetrics: NetworkQualityMetrics = {
        peerId,
        rtt: currentRtt,
        smoothedRtt,
        packetLoss,
        jitter,
        signalLevel,
        proximity,
        quality,
        timestamp: Date.now(),
        measurementCount: previousMetrics.measurementCount + 1,
      };

      this.updateMetrics(peerId, newMetrics);

      // Emit events if quality or signal level changed
      if (previousMetrics.quality !== quality && previousMetrics.measurementCount > 0) {
        this.emit('quality-change', {
          peerId,
          previousQuality: previousMetrics.quality,
          newQuality: quality,
          metrics: newMetrics,
        } as QualityChangeEvent);
      }

      if (previousMetrics.signalLevel !== signalLevel && previousMetrics.measurementCount > 0) {
        this.emit('signal-change', {
          peerId,
          previousLevel: previousMetrics.signalLevel,
          newLevel: signalLevel,
          metrics: newMetrics,
        } as SignalChangeEvent);
      }

      // Always emit metrics update
      this.emit('metrics-update', { peerId, metrics: newMetrics });
    } catch (error) {
      this.emit('error', { peerId, error });
    }
  }

  /**
   * Updates stored metrics for a peer
   *
   * @param peerId - Peer identifier
   * @param metrics - New metrics
   */
  private updateMetrics(peerId: string, metrics: NetworkQualityMetrics): void {
    this.metrics.set(peerId, metrics);
  }

  /**
   * Maps signal level to connection quality
   *
   * @param signalLevel - Signal strength level
   * @returns Connection quality
   */
  private mapSignalToQuality(signalLevel: SignalLevel): ConnectionQuality {
    switch (signalLevel) {
      case 'excellent':
        return 'excellent';
      case 'good':
        return 'good';
      case 'fair':
        return 'fair';
      case 'poor':
        return 'poor';
      case 'disconnected':
        return 'disconnected';
      default:
        return 'disconnected';
    }
  }

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  /**
   * Checks if monitoring is currently running
   */
  public get running(): boolean {
    return this.isRunning;
  }

  /**
   * Gets number of monitored peers
   */
  public get peerCount(): number {
    return this.peers.size;
  }

  /**
   * Gets current configuration
   */
  public getConfig(): Readonly<Required<NetworkQualityMonitorConfig>> {
    return { ...this.config };
  }

  /**
   * Updates configuration (requires restart to take effect)
   *
   * @param config - New configuration options
   */
  public updateConfig(config: Partial<NetworkQualityMonitorConfig>): void {
    const wasRunning = this.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this.config = {
      ...this.config,
      ...config,
    };

    if (wasRunning) {
      this.start();
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a simple network quality monitor for a single peer
 *
 * @param peerId - Peer identifier
 * @param peerConnection - RTCPeerConnection to monitor
 * @param config - Optional configuration
 * @returns Configured monitor instance
 */
export function createNetworkMonitor(
  peerId: string,
  peerConnection: RTCPeerConnection,
  config?: NetworkQualityMonitorConfig
): NetworkQualityMonitor {
  const monitor = new NetworkQualityMonitor(config);
  monitor.addPeer(peerId, peerConnection);
  return monitor;
}
