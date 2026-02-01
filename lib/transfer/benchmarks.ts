'use client';

/**
 * Transfer Benchmarking Module
 *
 * Measures actual throughput during transfers and reports statistics.
 * Features:
 * - Real-time throughput monitoring
 * - Peak speed tracking
 * - RTT measurement
 * - Bottleneck detection
 * - Statistical analysis
 *
 * Performance targets:
 * - LAN WiFi: 200+ Mbps
 * - LAN Ethernet: 500+ Mbps
 * - Internet: 50+ Mbps
 */

import secureLog from '../utils/secure-logger';

export interface BenchmarkSample {
  timestamp: number;
  bytesTransferred: number;
  duration: number; // ms
  throughput: number; // bytes/sec
  rtt: number; // ms
  packetLoss: number; // 0-1
}

export interface BenchmarkStats {
  // Throughput stats
  avgThroughput: number; // bytes/sec
  peakThroughput: number; // bytes/sec
  minThroughput: number; // bytes/sec
  currentThroughput: number; // bytes/sec

  // Network stats
  avgRTT: number; // ms
  minRTT: number; // ms
  maxRTT: number; // ms
  currentRTT: number; // ms
  jitter: number; // ms (RTT variance)

  // Loss stats
  avgPacketLoss: number; // 0-1
  maxPacketLoss: number; // 0-1

  // Transfer stats
  totalBytes: number;
  totalDuration: number; // ms
  sampleCount: number;

  // Quality assessment
  qualityScore: number; // 0-100
  bottleneck: BottleneckType;
  recommendation: string;
}

export type BottleneckType =
  | 'none'
  | 'network-bandwidth'
  | 'network-latency'
  | 'cpu'
  | 'memory'
  | 'backpressure'
  | 'unknown';

interface BenchmarkConfig {
  sampleInterval: number; // ms between samples
  windowSize: number; // number of samples to keep
  rttInterval: number; // ms between RTT measurements
  enableDetailedLogging: boolean;
}

const DEFAULT_CONFIG: BenchmarkConfig = {
  sampleInterval: 1000, // 1 second
  windowSize: 60, // Keep last 60 samples (1 minute)
  rttInterval: 5000, // 5 seconds
  enableDetailedLogging: false,
};

/**
 * Transfer Benchmark Monitor
 * Tracks and analyzes transfer performance in real-time
 */
export class TransferBenchmark {
  private config: BenchmarkConfig;
  private samples: BenchmarkSample[] = [];
  private startTime: number = 0;
  private lastSampleTime: number = 0;
  private lastSampleBytes: number = 0;
  private totalBytes: number = 0;
  private totalPackets: number = 0;
  private lostPackets: number = 0;
  private isRunning: boolean = false;

  // RTT measurement
  private rttMeasurements: number[] = [];

  // Callbacks
  private onSample?: (sample: BenchmarkSample) => void;
  private onStatsUpdate?: (stats: BenchmarkStats) => void;

  constructor(config?: Partial<BenchmarkConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start benchmarking
   */
  start(): void {
    if (this.isRunning) {return;}

    this.isRunning = true;
    this.startTime = Date.now();
    this.lastSampleTime = this.startTime;
    this.lastSampleBytes = 0;
    this.totalBytes = 0;
    this.totalPackets = 0;
    this.lostPackets = 0;
    this.samples = [];
    this.rttMeasurements = [];

    secureLog.log('[Benchmark] Started monitoring transfer');
  }

  /**
   * Stop benchmarking
   */
  stop(): BenchmarkStats {
    if (!this.isRunning) {
      return this.getStats();
    }

    this.isRunning = false;
    const stats = this.getStats();

    if (this.config.enableDetailedLogging) {
      secureLog.log('[Benchmark] Stopped monitoring. Final stats:', {
        avgThroughputMbps: (stats.avgThroughput * 8 / 1_000_000).toFixed(2),
        peakThroughputMbps: (stats.peakThroughput * 8 / 1_000_000).toFixed(2),
        avgRTT: stats.avgRTT.toFixed(2),
        totalMB: (stats.totalBytes / 1_000_000).toFixed(2),
        durationSec: (stats.totalDuration / 1000).toFixed(2),
        qualityScore: stats.qualityScore,
        bottleneck: stats.bottleneck,
      });
    }

    return stats;
  }

  /**
   * Record bytes transferred
   */
  recordBytes(bytes: number): void {
    if (!this.isRunning) {return;}

    this.totalBytes += bytes;
    this.totalPackets++;

    const now = Date.now();
    const elapsed = now - this.lastSampleTime;

    // Take sample at configured interval
    if (elapsed >= this.config.sampleInterval) {
      this.takeSample(now);
    }
  }

  /**
   * Record packet loss
   */
  recordPacketLoss(lost: number): void {
    if (!this.isRunning) {return;}
    this.lostPackets += lost;
  }

  /**
   * Record RTT measurement
   */
  recordRTT(rtt: number): void {
    if (!this.isRunning) {return;}

    this.rttMeasurements.push(rtt);

    // Keep only recent measurements
    if (this.rttMeasurements.length > this.config.windowSize) {
      this.rttMeasurements.shift();
    }
  }

  /**
   * Take a performance sample
   */
  private takeSample(now: number): void {
    const duration = now - this.lastSampleTime;
    const bytesInPeriod = this.totalBytes - this.lastSampleBytes;
    const throughput = (bytesInPeriod / duration) * 1000; // bytes/sec

    const packetsInPeriod = this.totalPackets;
    const lostInPeriod = this.lostPackets;
    const packetLoss = packetsInPeriod > 0 ? lostInPeriod / packetsInPeriod : 0;

    const currentRTT =
      this.rttMeasurements.length > 0
        ? (this.rttMeasurements[this.rttMeasurements.length - 1] ?? 0)
        : 0;

    const sample: BenchmarkSample = {
      timestamp: now,
      bytesTransferred: bytesInPeriod,
      duration,
      throughput,
      rtt: currentRTT,
      packetLoss,
    };

    this.samples.push(sample);

    // Trim old samples
    if (this.samples.length > this.config.windowSize) {
      this.samples.shift();
    }

    // Update state
    this.lastSampleTime = now;
    this.lastSampleBytes = this.totalBytes;

    // Notify callback
    this.onSample?.(sample);

    // Update stats
    if (this.samples.length >= 3) {
      const stats = this.getStats();
      this.onStatsUpdate?.(stats);
    }

    if (this.config.enableDetailedLogging && this.samples.length % 10 === 0) {
      secureLog.log('[Benchmark] Sample:', {
        throughputMbps: (throughput * 8 / 1_000_000).toFixed(2),
        rtt: currentRTT.toFixed(2),
        packetLoss: (packetLoss * 100).toFixed(2) + '%',
      });
    }
  }

  /**
   * Calculate statistics
   */
  getStats(): BenchmarkStats {
    if (this.samples.length === 0) {
      return this.getEmptyStats();
    }

    // Throughput stats
    const throughputs = this.samples.map((s) => s.throughput);
    const avgThroughput = this.average(throughputs);
    const peakThroughput = Math.max(...throughputs);
    const minThroughput = Math.min(...throughputs);
    const currentThroughput = throughputs[throughputs.length - 1] || 0;

    // RTT stats
    const rtts = this.samples.map((s) => s.rtt).filter((r) => r > 0);
    const avgRTT = rtts.length > 0 ? this.average(rtts) : 0;
    const minRTT = rtts.length > 0 ? Math.min(...rtts) : 0;
    const maxRTT = rtts.length > 0 ? Math.max(...rtts) : 0;
    const currentRTT = rtts[rtts.length - 1] || 0;
    const jitter = rtts.length > 1 ? this.stdDev(rtts) : 0;

    // Loss stats
    const losses = this.samples.map((s) => s.packetLoss);
    const avgPacketLoss = this.average(losses);
    const maxPacketLoss = Math.max(...losses);

    // Transfer stats
    const totalDuration = Date.now() - this.startTime;

    // Quality assessment
    const qualityScore = this.calculateQualityScore({
      avgThroughput,
      peakThroughput,
      avgRTT,
      jitter,
      avgPacketLoss,
    });

    const bottleneck = this.detectBottleneck({
      avgThroughput,
      peakThroughput,
      avgRTT,
      jitter,
      avgPacketLoss,
    });

    const recommendation = this.getRecommendation(bottleneck, {
      avgThroughput,
      avgRTT,
      avgPacketLoss,
    });

    return {
      avgThroughput,
      peakThroughput,
      minThroughput,
      currentThroughput,
      avgRTT,
      minRTT,
      maxRTT,
      currentRTT,
      jitter,
      avgPacketLoss,
      maxPacketLoss,
      totalBytes: this.totalBytes,
      totalDuration,
      sampleCount: this.samples.length,
      qualityScore,
      bottleneck,
      recommendation,
    };
  }

  /**
   * Get empty stats structure
   */
  private getEmptyStats(): BenchmarkStats {
    return {
      avgThroughput: 0,
      peakThroughput: 0,
      minThroughput: 0,
      currentThroughput: 0,
      avgRTT: 0,
      minRTT: 0,
      maxRTT: 0,
      currentRTT: 0,
      jitter: 0,
      avgPacketLoss: 0,
      maxPacketLoss: 0,
      totalBytes: this.totalBytes,
      totalDuration: Date.now() - this.startTime,
      sampleCount: 0,
      qualityScore: 0,
      bottleneck: 'unknown',
      recommendation: 'Insufficient data',
    };
  }

  /**
   * Calculate quality score (0-100)
   */
  private calculateQualityScore(metrics: {
    avgThroughput: number;
    peakThroughput: number;
    avgRTT: number;
    jitter: number;
    avgPacketLoss: number;
  }): number {
    let score = 100;

    // Throughput consistency (30 points)
    const throughputStability =
      metrics.peakThroughput > 0
        ? metrics.avgThroughput / metrics.peakThroughput
        : 1;
    score -= (1 - throughputStability) * 30;

    // RTT (30 points)
    if (metrics.avgRTT > 200) {
      score -= 30;
    } else if (metrics.avgRTT > 100) {
      score -= 20;
    } else if (metrics.avgRTT > 50) {
      score -= 10;
    }

    // Jitter (20 points)
    if (metrics.jitter > 50) {
      score -= 20;
    } else if (metrics.jitter > 20) {
      score -= 10;
    } else if (metrics.jitter > 10) {
      score -= 5;
    }

    // Packet loss (20 points)
    score -= metrics.avgPacketLoss * 100 * 0.2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect performance bottleneck
   */
  private detectBottleneck(metrics: {
    avgThroughput: number;
    peakThroughput: number;
    avgRTT: number;
    jitter: number;
    avgPacketLoss: number;
  }): BottleneckType {
    // High packet loss suggests network bandwidth issues
    if (metrics.avgPacketLoss > 0.05) {
      return 'network-bandwidth';
    }

    // High RTT and jitter suggest network latency
    if (metrics.avgRTT > 200 || metrics.jitter > 50) {
      return 'network-latency';
    }

    // Large variation between peak and average suggests backpressure
    const throughputVariation =
      metrics.peakThroughput > 0
        ? 1 - metrics.avgThroughput / metrics.peakThroughput
        : 0;
    if (throughputVariation > 0.5) {
      return 'backpressure';
    }

    // Low throughput with good network conditions suggests CPU/memory
    const throughputMbps = (metrics.avgThroughput * 8) / 1_000_000;
    if (throughputMbps < 10 && metrics.avgRTT < 50 && metrics.avgPacketLoss < 0.01) {
      return 'cpu';
    }

    // All metrics look good
    if (
      metrics.avgPacketLoss < 0.01 &&
      metrics.avgRTT < 50 &&
      throughputVariation < 0.3
    ) {
      return 'none';
    }

    return 'unknown';
  }

  /**
   * Get performance recommendation
   */
  private getRecommendation(
    bottleneck: BottleneckType,
    metrics: {
      avgThroughput: number;
      avgRTT: number;
      avgPacketLoss: number;
    }
  ): string {
    const throughputMbps = (metrics.avgThroughput * 8) / 1_000_000;

    switch (bottleneck) {
      case 'none':
        return `Excellent performance: ${throughputMbps.toFixed(0)} Mbps`;

      case 'network-bandwidth':
        return `Network congestion detected (${(metrics.avgPacketLoss * 100).toFixed(1)}% loss). Consider: reducing chunk size, enabling compression, or using a better connection.`;

      case 'network-latency':
        return `High latency detected (${metrics.avgRTT.toFixed(0)}ms RTT). Consider: using parallel channels, increasing chunk size, or checking network configuration.`;

      case 'backpressure':
        return 'Transfer buffer saturation detected. Receiver may be slower than sender. Consider: reducing parallel transfers, optimizing disk I/O, or increasing buffer size.';

      case 'cpu':
        return 'Low throughput with good network. Possible CPU bottleneck from encryption/compression. Consider: disabling encryption, reducing compression level, or closing background apps.';

      case 'memory':
        return 'Memory pressure detected. Consider: reducing chunk size, limiting parallel transfers, or closing memory-intensive apps.';

      case 'unknown':
        return `Current throughput: ${throughputMbps.toFixed(0)} Mbps. Performance metrics within normal range.`;

      default:
        return 'Performance analysis in progress...';
    }
  }

  /**
   * Calculate average
   */
  private average(values: number[]): number {
    if (values.length === 0) {return 0;}
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private stdDev(values: number[]): number {
    if (values.length < 2) {return 0;}
    const avg = this.average(values);
    const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
    const avgSquareDiff = this.average(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Register sample callback
   */
  onSampleTaken(callback: (sample: BenchmarkSample) => void): void {
    this.onSample = callback;
  }

  /**
   * Register stats update callback
   */
  onStatsUpdated(callback: (stats: BenchmarkStats) => void): void {
    this.onStatsUpdate = callback;
  }

  /**
   * Get current samples
   */
  getSamples(): BenchmarkSample[] {
    return [...this.samples];
  }

  /**
   * Reset benchmark
   */
  reset(): void {
    this.stop();
    this.samples = [];
    this.rttMeasurements = [];
    this.totalBytes = 0;
    this.totalPackets = 0;
    this.lostPackets = 0;
  }
}

/**
 * Format throughput for display
 */
export function formatThroughput(bytesPerSecond: number): string {
  const mbps = (bytesPerSecond * 8) / 1_000_000;

  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(2)} Gbps`;
  } else if (mbps >= 1) {
    return `${mbps.toFixed(2)} Mbps`;
  } else {
    return `${(mbps * 1000).toFixed(2)} Kbps`;
  }
}

/**
 * Format bytes for display
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default TransferBenchmark;
