/**
 * Bandwidth Monitor (Agent 027 - BANDWIDTH-ANALYST)
 *
 * Production-grade connection quality monitoring with:
 * - 100ms sampling intervals for responsive adaptive bitrate
 * - Real RTT measurement via DataChannel ping/pong protocol
 * - EWMA-smoothed RTT (alpha = 0.125, per RFC 6298)
 * - Jitter = |RTT_current - RTT_smoothed| (RFC 6298 RTTVAR)
 * - Rolling averages: 1s (instant), 5s (short-term), 30s (long-term)
 * - Bandwidth spike/drop detection with hysteresis
 * - Direct feed into AdaptiveBitrateController
 *
 * Integrates with:
 * - lib/transfer/adaptive-bitrate.ts for chunk size adaptation
 * - lib/webrtc/data-channel.ts for backpressure signals
 */

// ============================================================================
// TYPES
// ============================================================================

/** Connection quality level derived from combined metrics */
export type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

/** A single throughput sample taken at the sampling interval */
export interface BandwidthSample {
  /** Timestamp of the sample (ms since epoch) */
  timestamp: number;
  /** Bytes transferred in this sample window */
  bytesTransferred: number;
  /** Duration of the sample window in ms */
  durationMs: number;
  /** Calculated throughput in bytes per second */
  throughputBps: number;
}

/** RTT measurement from a single ping/pong exchange */
export interface RTTSample {
  /** Timestamp when ping was sent */
  timestamp: number;
  /** Raw round-trip time in ms */
  rtt: number;
  /** EWMA-smoothed RTT in ms */
  smoothedRtt: number;
  /** RTT jitter (variation) in ms */
  jitter: number;
}

/** Rolling average window for throughput */
export interface RollingAverage {
  /** Window duration in ms */
  windowMs: number;
  /** Label for this window (e.g., "1s", "5s", "30s") */
  label: string;
  /** Current averaged throughput in bytes/sec */
  throughputBps: number;
  /** Number of samples in this window */
  sampleCount: number;
}

/** Bandwidth change event for spike/drop detection */
export interface BandwidthChangeEvent {
  /** Type of change */
  type: 'spike' | 'drop';
  /** Previous throughput (5s average) in bytes/sec */
  previousBps: number;
  /** Current throughput (1s average) in bytes/sec */
  currentBps: number;
  /** Ratio of change (current/previous) */
  ratio: number;
  /** Timestamp of detection */
  timestamp: number;
}

/** Recommended chunk size from bandwidth analysis */
export interface ChunkSizeRecommendation {
  /** Recommended chunk size in bytes */
  chunkSize: number;
  /** Reason for the recommendation */
  reason: string;
  /** Whether compression should be enabled */
  enableCompression: boolean;
  /** Recommended concurrency level */
  concurrency: number;
}

/** Full bandwidth report for UI and logging */
export interface BandwidthReport {
  /** Current instantaneous throughput (latest sample) in bytes/sec */
  currentThroughput: number;
  /** 1-second rolling average throughput in bytes/sec */
  instantAverage: number;
  /** 5-second rolling average throughput in bytes/sec */
  shortTermAverage: number;
  /** 30-second rolling average throughput in bytes/sec */
  longTermAverage: number;
  /** Peak throughput observed in bytes/sec */
  peakThroughput: number;
  /** Latest raw RTT in ms */
  rtt: number;
  /** EWMA-smoothed RTT in ms */
  smoothedRtt: number;
  /** RTT jitter in ms */
  jitter: number;
  /** Current quality level */
  qualityLevel: QualityLevel;
  /** Whether auto-downgrade has been triggered */
  isDowngraded: boolean;
  /** Number of quality transitions observed */
  transitionCount: number;
  /** Current chunk size recommendation */
  recommendation: ChunkSizeRecommendation;
  /** Total bytes monitored */
  totalBytes: number;
  /** Total monitoring duration in ms */
  monitoringDurationMs: number;
  /** Timestamp of the report */
  timestamp: number;
}

/** Configuration for BandwidthMonitor */
export interface BandwidthMonitorConfig {
  /** Throughput sample interval in ms (default: 100) */
  sampleIntervalMs?: number;
  /** RTT ping interval in ms (default: 250) */
  rttIntervalMs?: number;
  /** Maximum samples to retain per rolling window (default: 300 = 30s at 100ms) */
  maxSamples?: number;
  /** Throughput threshold for auto-downgrade in bytes/s (default: 100KB/s) */
  downgradeThresholdBps?: number;
  /** Throughput threshold for auto-upgrade in bytes/s (default: 1MB/s) */
  upgradeThresholdBps?: number;
  /** Spike detection ratio: current/average triggers spike (default: 2.0) */
  spikeRatio?: number;
  /** Drop detection ratio: current/average triggers drop (default: 0.3) */
  dropRatio?: number;
  /** Callback when quality level changes */
  onQualityChange?: (level: QualityLevel, report: BandwidthReport) => void;
  /** Callback when auto-downgrade triggers */
  onDowngrade?: (report: BandwidthReport) => void;
  /** Callback when bandwidth spike or drop is detected */
  onBandwidthChange?: (event: BandwidthChangeEvent) => void;
  /** Callback on each sample for real-time UI updates */
  onSample?: (report: BandwidthReport) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default 100ms sampling for responsive adaptation */
const DEFAULT_SAMPLE_INTERVAL_MS = 100;

/** RTT pings every 250ms for smooth EWMA */
const DEFAULT_RTT_INTERVAL_MS = 250;

/** Keep 300 samples = 30 seconds at 100ms interval */
const DEFAULT_MAX_SAMPLES = 300;

const DEFAULT_DOWNGRADE_THRESHOLD_BPS = 100 * 1024; // 100 KB/s
const DEFAULT_UPGRADE_THRESHOLD_BPS = 1024 * 1024;  // 1 MB/s
const DEFAULT_SPIKE_RATIO = 2.0;
const DEFAULT_DROP_RATIO = 0.3;

/**
 * EWMA smoothing factor for RTT.
 * Alpha = 0.125 per RFC 6298 (TCP retransmission timer).
 * Lower alpha = more smoothing = less reactive to spikes.
 */
const RTT_EWMA_ALPHA = 0.125;

/**
 * EWMA smoothing factor for jitter (RTTVAR).
 * Beta = 0.25 per RFC 6298.
 */
const JITTER_EWMA_BETA = 0.25;

/** Quality thresholds (bytes per second) */
const QUALITY_THRESHOLDS: Record<QualityLevel, number> = {
  excellent: 10 * 1024 * 1024, // > 10 MB/s
  good: 1 * 1024 * 1024,      // > 1 MB/s
  fair: 256 * 1024,            // > 256 KB/s
  poor: 64 * 1024,             // > 64 KB/s
  critical: 0,                 // below 64 KB/s
};

/** Chunk size tiers for adaptive sizing */
const CHUNK_TIERS = {
  EXCELLENT: 1024 * 1024,      // 1 MB
  GOOD: 256 * 1024,            // 256 KB
  FAIR: 64 * 1024,             // 64 KB
  POOR: 16 * 1024,             // 16 KB
} as const;

/** Rolling average window definitions */
const ROLLING_WINDOWS = [
  { windowMs: 1_000, label: '1s' },
  { windowMs: 5_000, label: '5s' },
  { windowMs: 30_000, label: '30s' },
] as const;

/**
 * Protocol message types for RTT measurement over DataChannel.
 * Uses a compact binary prefix to avoid JSON parsing overhead on the hot path.
 *
 * Wire format: first 4 bytes = magic prefix, then payload.
 * - Ping: [0x54, 0x50, 0x4E, 0x47] + uint32 sequence + float64 timestamp
 * - Pong: [0x54, 0x50, 0x4F, 0x47] + uint32 sequence + float64 timestamp (echoed)
 */
const PING_MAGIC = new Uint8Array([0x54, 0x50, 0x4e, 0x47]); // "TPNG"
const PONG_MAGIC = new Uint8Array([0x54, 0x50, 0x4f, 0x47]); // "TPOG"
const RTT_MESSAGE_SIZE = 16; // 4 magic + 4 seq + 8 timestamp

// ============================================================================
// RTT MEASURER
// ============================================================================

/**
 * Measures RTT by sending ping messages over a DataChannel and
 * processing pong responses. Uses binary protocol for minimal overhead.
 */
export class RTTMeasurer {
  private smoothedRtt: number = 0;
  private jitter: number = 0;
  private lastRawRtt: number = 0;
  private sequence: number = 0;
  private pendingPings: Map<number, number> = new Map(); // seq -> sendTimestamp
  private samples: RTTSample[] = [];
  private maxSamples: number;
  private initialized: boolean = false;

  constructor(maxSamples: number = 120) {
    this.maxSamples = maxSamples;
  }

  /**
   * Create a ping message to send over the DataChannel.
   * Returns an ArrayBuffer ready for channel.send().
   */
  createPing(): ArrayBuffer {
    const seq = this.sequence++;
    const now = performance.now();
    this.pendingPings.set(seq, now);

    const buffer = new ArrayBuffer(RTT_MESSAGE_SIZE);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    // Write magic
    bytes.set(PING_MAGIC, 0);
    // Write sequence
    view.setUint32(4, seq, true);
    // Write timestamp
    view.setFloat64(8, now, true);

    return buffer;
  }

  /**
   * Create a pong response from a received ping.
   * Returns null if the message is not a ping.
   */
  static createPong(data: ArrayBuffer): ArrayBuffer | null {
    if (data.byteLength !== RTT_MESSAGE_SIZE) return null;

    const bytes = new Uint8Array(data);

    // Verify ping magic
    if (bytes[0] !== PING_MAGIC[0] ||
        bytes[1] !== PING_MAGIC[1] ||
        bytes[2] !== PING_MAGIC[2] ||
        bytes[3] !== PING_MAGIC[3]) {
      return null;
    }

    // Copy the message and replace magic with pong magic
    const pong = new ArrayBuffer(RTT_MESSAGE_SIZE);
    const pongBytes = new Uint8Array(pong);
    pongBytes.set(bytes);
    pongBytes.set(PONG_MAGIC, 0);

    return pong;
  }

  /**
   * Check if an incoming message is an RTT protocol message (ping or pong).
   */
  static isRTTMessage(data: ArrayBuffer): boolean {
    if (data.byteLength !== RTT_MESSAGE_SIZE) return false;
    const bytes = new Uint8Array(data);

    const isPing = bytes[0] === PING_MAGIC[0] &&
                   bytes[1] === PING_MAGIC[1] &&
                   bytes[2] === PING_MAGIC[2] &&
                   bytes[3] === PING_MAGIC[3];

    const isPong = bytes[0] === PONG_MAGIC[0] &&
                   bytes[1] === PONG_MAGIC[1] &&
                   bytes[2] === PONG_MAGIC[2] &&
                   bytes[3] === PONG_MAGIC[3];

    return isPing || isPong;
  }

  /**
   * Check if an incoming message is a ping (needs pong response).
   */
  static isPing(data: ArrayBuffer): boolean {
    if (data.byteLength !== RTT_MESSAGE_SIZE) return false;
    const bytes = new Uint8Array(data);
    return bytes[0] === PING_MAGIC[0] &&
           bytes[1] === PING_MAGIC[1] &&
           bytes[2] === PING_MAGIC[2] &&
           bytes[3] === PING_MAGIC[3];
  }

  /**
   * Process a received pong message and update RTT estimates.
   * Returns the RTT sample or null if not a valid pong.
   */
  processPong(data: ArrayBuffer): RTTSample | null {
    if (data.byteLength !== RTT_MESSAGE_SIZE) return null;

    const bytes = new Uint8Array(data);

    // Verify pong magic
    if (bytes[0] !== PONG_MAGIC[0] ||
        bytes[1] !== PONG_MAGIC[1] ||
        bytes[2] !== PONG_MAGIC[2] ||
        bytes[3] !== PONG_MAGIC[3]) {
      return null;
    }

    const view = new DataView(data);
    const seq = view.getUint32(4, true);
    const sendTime = this.pendingPings.get(seq);

    if (sendTime === undefined) return null;

    this.pendingPings.delete(seq);

    const now = performance.now();
    const rawRtt = now - sendTime;
    this.lastRawRtt = rawRtt;

    // EWMA smoothing (RFC 6298)
    if (!this.initialized) {
      // First measurement: initialize directly
      this.smoothedRtt = rawRtt;
      this.jitter = rawRtt / 2;
      this.initialized = true;
    } else {
      // RTTVAR (jitter) = (1 - beta) * RTTVAR + beta * |SRTT - R|
      this.jitter = (1 - JITTER_EWMA_BETA) * this.jitter +
                    JITTER_EWMA_BETA * Math.abs(this.smoothedRtt - rawRtt);
      // SRTT = (1 - alpha) * SRTT + alpha * R
      this.smoothedRtt = (1 - RTT_EWMA_ALPHA) * this.smoothedRtt +
                         RTT_EWMA_ALPHA * rawRtt;
    }

    // Clean up stale pending pings (older than 5 seconds)
    const staleThreshold = now - 5000;
    for (const [pendingSeq, pendingSendTime] of this.pendingPings) {
      if (pendingSendTime < staleThreshold) {
        this.pendingPings.delete(pendingSeq);
      }
    }

    const sample: RTTSample = {
      timestamp: Date.now(),
      rtt: rawRtt,
      smoothedRtt: this.smoothedRtt,
      jitter: this.jitter,
    };

    this.samples.push(sample);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    return sample;
  }

  /** Get the latest raw RTT in ms */
  getRtt(): number {
    return this.lastRawRtt;
  }

  /** Get the EWMA-smoothed RTT in ms */
  getSmoothedRtt(): number {
    return this.smoothedRtt;
  }

  /** Get the current jitter (RTTVAR) in ms */
  getJitter(): number {
    return this.jitter;
  }

  /** Get all RTT samples */
  getSamples(): readonly RTTSample[] {
    return this.samples;
  }

  /** Whether at least one RTT measurement has completed */
  hasData(): boolean {
    return this.initialized;
  }

  /** Reset all state */
  reset(): void {
    this.smoothedRtt = 0;
    this.jitter = 0;
    this.lastRawRtt = 0;
    this.sequence = 0;
    this.pendingPings.clear();
    this.samples = [];
    this.initialized = false;
  }
}

// ============================================================================
// BANDWIDTH MONITOR
// ============================================================================

/**
 * Production bandwidth monitor with 100ms sampling, RTT measurement,
 * rolling averages, and adaptive chunk sizing recommendations.
 *
 * Usage:
 * ```typescript
 * const monitor = new BandwidthMonitor({
 *   sampleIntervalMs: 100,
 *   onQualityChange: (level, report) => updateUI(report),
 *   onBandwidthChange: (event) => logEvent(event),
 * });
 *
 * monitor.start();
 *
 * // During transfer, report bytes as they are sent/received:
 * monitor.recordBytes(chunkSize);
 *
 * // Periodically feed RTT via the RTTMeasurer:
 * const rttMeasurer = monitor.getRTTMeasurer();
 * const ping = rttMeasurer.createPing();
 * dataChannel.send(ping);
 *
 * // On pong receipt:
 * rttMeasurer.processPong(pongData);
 * ```
 */
export class BandwidthMonitor {
  private samples: BandwidthSample[] = [];
  private config: Required<BandwidthMonitorConfig>;
  private sampleTimer: ReturnType<typeof setInterval> | null = null;
  private rttTimer: ReturnType<typeof setInterval> | null = null;
  private currentQuality: QualityLevel = 'good';
  private isDowngraded: boolean = false;
  private transitionCount: number = 0;
  private peakThroughput: number = 0;
  private bytesInCurrentWindow: number = 0;
  private totalBytesTracked: number = 0;
  private lastSampleTime: number = 0;
  private startTime: number = 0;
  private rttMeasurer: RTTMeasurer;
  private dataChannel: RTCDataChannel | null = null;

  // Hysteresis: prevent oscillation by requiring consecutive confirmations
  private consecutiveQualityReadings: number = 0;
  private pendingQuality: QualityLevel | null = null;
  private static readonly QUALITY_HYSTERESIS_COUNT = 3;

  constructor(config: BandwidthMonitorConfig = {}) {
    this.config = {
      sampleIntervalMs: config.sampleIntervalMs ?? DEFAULT_SAMPLE_INTERVAL_MS,
      rttIntervalMs: config.rttIntervalMs ?? DEFAULT_RTT_INTERVAL_MS,
      maxSamples: config.maxSamples ?? DEFAULT_MAX_SAMPLES,
      downgradeThresholdBps: config.downgradeThresholdBps ?? DEFAULT_DOWNGRADE_THRESHOLD_BPS,
      upgradeThresholdBps: config.upgradeThresholdBps ?? DEFAULT_UPGRADE_THRESHOLD_BPS,
      spikeRatio: config.spikeRatio ?? DEFAULT_SPIKE_RATIO,
      dropRatio: config.dropRatio ?? DEFAULT_DROP_RATIO,
      onQualityChange: config.onQualityChange ?? (() => {}),
      onDowngrade: config.onDowngrade ?? (() => {}),
      onBandwidthChange: config.onBandwidthChange ?? (() => {}),
      onSample: config.onSample ?? (() => {}),
    };

    this.rttMeasurer = new RTTMeasurer(this.config.maxSamples);
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  /** Start continuous monitoring at the configured interval */
  start(): void {
    if (this.sampleTimer !== null) return; // Already running

    const now = Date.now();
    this.lastSampleTime = now;
    this.startTime = now;

    // Throughput sampling at 100ms
    this.sampleTimer = setInterval(() => {
      this.takeSample();
    }, this.config.sampleIntervalMs);

    // RTT pings at 250ms (if a data channel is attached)
    this.rttTimer = setInterval(() => {
      this.sendRttPing();
    }, this.config.rttIntervalMs);
  }

  /** Stop all monitoring timers */
  stop(): void {
    if (this.sampleTimer !== null) {
      clearInterval(this.sampleTimer);
      this.sampleTimer = null;
    }
    if (this.rttTimer !== null) {
      clearInterval(this.rttTimer);
      this.rttTimer = null;
    }
  }

  /** Whether the monitor is currently running */
  isRunning(): boolean {
    return this.sampleTimer !== null;
  }

  // --------------------------------------------------------------------------
  // Data Channel Attachment (for RTT)
  // --------------------------------------------------------------------------

  /**
   * Attach a DataChannel for RTT measurement.
   * The monitor will send ping messages and process pong responses.
   * The caller must route incoming pong ArrayBuffers to processPong().
   */
  attachDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;
  }

  /** Detach the data channel */
  detachDataChannel(): void {
    this.dataChannel = null;
  }

  /** Get the RTT measurer for external ping/pong handling */
  getRTTMeasurer(): RTTMeasurer {
    return this.rttMeasurer;
  }

  // --------------------------------------------------------------------------
  // Byte Recording
  // --------------------------------------------------------------------------

  /** Record bytes transferred during this sample window */
  recordBytes(bytes: number): void {
    if (bytes <= 0) return;
    this.bytesInCurrentWindow += bytes;
    this.totalBytesTracked += bytes;
  }

  // --------------------------------------------------------------------------
  // Sampling
  // --------------------------------------------------------------------------

  /** Take a throughput sample */
  private takeSample(): void {
    const now = Date.now();
    const durationMs = now - this.lastSampleTime;

    // Avoid division by zero or negative durations
    if (durationMs <= 0) return;

    const bytesTransferred = this.bytesInCurrentWindow;
    const throughputBps = (bytesTransferred / durationMs) * 1000;

    const sample: BandwidthSample = {
      timestamp: now,
      bytesTransferred,
      durationMs,
      throughputBps,
    };

    this.samples.push(sample);

    // Trim to max samples
    while (this.samples.length > this.config.maxSamples) {
      this.samples.shift();
    }

    // Reset window
    this.bytesInCurrentWindow = 0;
    this.lastSampleTime = now;

    // Update peak
    if (throughputBps > this.peakThroughput) {
      this.peakThroughput = throughputBps;
    }

    // Detect bandwidth changes
    this.detectBandwidthChanges();

    // Evaluate quality
    this.evaluateQuality();

    // Notify listener
    this.config.onSample(this.getReport());
  }

  /** Send an RTT ping if a data channel is attached and open */
  private sendRttPing(): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') return;

    try {
      const ping = this.rttMeasurer.createPing();
      this.dataChannel.send(ping);
    } catch {
      // Channel may have closed between check and send; ignore
    }
  }

  // --------------------------------------------------------------------------
  // Rolling Averages
  // --------------------------------------------------------------------------

  /**
   * Calculate rolling average throughput for a given time window.
   * Only considers samples within [now - windowMs, now].
   */
  getRollingAverage(windowMs: number): RollingAverage {
    const now = Date.now();
    const cutoff = now - windowMs;
    let label = `${windowMs}ms`;

    // Match known windows for labeling
    for (const w of ROLLING_WINDOWS) {
      if (w.windowMs === windowMs) {
        label = w.label;
        break;
      }
    }

    const windowSamples = this.samples.filter(s => s.timestamp >= cutoff);
    if (windowSamples.length === 0) {
      return { windowMs, label, throughputBps: 0, sampleCount: 0 };
    }

    const totalBytes = windowSamples.reduce((sum, s) => sum + s.bytesTransferred, 0);
    const first = windowSamples[0]!;
    const last = windowSamples[windowSamples.length - 1]!;
    const span = last.timestamp - first.timestamp + last.durationMs;

    const throughputBps = span > 0 ? (totalBytes / span) * 1000 : 0;

    return {
      windowMs,
      label,
      throughputBps,
      sampleCount: windowSamples.length,
    };
  }

  /** Get all three rolling averages: 1s, 5s, 30s */
  getAllRollingAverages(): RollingAverage[] {
    return ROLLING_WINDOWS.map(w => this.getRollingAverage(w.windowMs));
  }

  // --------------------------------------------------------------------------
  // Quality Evaluation
  // --------------------------------------------------------------------------

  /** Evaluate connection quality from combined throughput + RTT metrics */
  private evaluateQuality(): void {
    const shortTermAvg = this.getRollingAverage(5_000).throughputBps;
    const rtt = this.rttMeasurer.getSmoothedRtt();
    const jitter = this.rttMeasurer.getJitter();

    // Composite quality: primarily throughput-based, penalized by RTT/jitter
    let effectiveThroughput = shortTermAvg;

    // RTT penalty: high latency reduces effective quality
    if (rtt > 200) {
      effectiveThroughput *= 0.5;
    } else if (rtt > 100) {
      effectiveThroughput *= 0.7;
    } else if (rtt > 50) {
      effectiveThroughput *= 0.85;
    }

    // Jitter penalty: high variance reduces effective quality
    if (jitter > 100) {
      effectiveThroughput *= 0.6;
    } else if (jitter > 50) {
      effectiveThroughput *= 0.8;
    }

    const newQuality = this.classifyQuality(effectiveThroughput);

    // Hysteresis: require multiple consecutive readings before changing
    if (newQuality !== this.currentQuality) {
      if (newQuality === this.pendingQuality) {
        this.consecutiveQualityReadings++;
      } else {
        this.pendingQuality = newQuality;
        this.consecutiveQualityReadings = 1;
      }

      // Downgrade immediately (1 reading), upgrade requires hysteresis
      const isDowngrade = this.qualityToOrdinal(newQuality) <
                          this.qualityToOrdinal(this.currentQuality);
      const threshold = isDowngrade ? 1 : BandwidthMonitor.QUALITY_HYSTERESIS_COUNT;

      if (this.consecutiveQualityReadings >= threshold) {
        this.transitionCount++;
        this.currentQuality = newQuality;
        this.pendingQuality = null;
        this.consecutiveQualityReadings = 0;
        this.config.onQualityChange(newQuality, this.getReport());
      }
    } else {
      this.pendingQuality = null;
      this.consecutiveQualityReadings = 0;
    }

    // Auto-downgrade check
    if (!this.isDowngraded && shortTermAvg < this.config.downgradeThresholdBps &&
        shortTermAvg > 0 && this.samples.length >= 10) {
      this.isDowngraded = true;
      this.config.onDowngrade(this.getReport());
    }

    // Auto-upgrade check
    if (this.isDowngraded && shortTermAvg > this.config.upgradeThresholdBps) {
      this.isDowngraded = false;
    }
  }

  /** Classify throughput into quality level */
  private classifyQuality(throughputBps: number): QualityLevel {
    if (throughputBps >= QUALITY_THRESHOLDS.excellent) return 'excellent';
    if (throughputBps >= QUALITY_THRESHOLDS.good) return 'good';
    if (throughputBps >= QUALITY_THRESHOLDS.fair) return 'fair';
    if (throughputBps >= QUALITY_THRESHOLDS.poor) return 'poor';
    return 'critical';
  }

  /** Convert quality to ordinal for comparison (higher = better) */
  private qualityToOrdinal(q: QualityLevel): number {
    switch (q) {
      case 'excellent': return 4;
      case 'good': return 3;
      case 'fair': return 2;
      case 'poor': return 1;
      case 'critical': return 0;
    }
  }

  // --------------------------------------------------------------------------
  // Bandwidth Change Detection
  // --------------------------------------------------------------------------

  /** Detect spikes and drops by comparing instant vs short-term average */
  private detectBandwidthChanges(): void {
    const instant = this.getRollingAverage(1_000);
    const shortTerm = this.getRollingAverage(5_000);

    // Need sufficient data for meaningful detection
    if (instant.sampleCount < 5 || shortTerm.sampleCount < 20) return;
    if (shortTerm.throughputBps === 0) return;

    const ratio = instant.throughputBps / shortTerm.throughputBps;

    if (ratio >= this.config.spikeRatio) {
      this.config.onBandwidthChange({
        type: 'spike',
        previousBps: shortTerm.throughputBps,
        currentBps: instant.throughputBps,
        ratio,
        timestamp: Date.now(),
      });
    } else if (ratio <= this.config.dropRatio) {
      this.config.onBandwidthChange({
        type: 'drop',
        previousBps: shortTerm.throughputBps,
        currentBps: instant.throughputBps,
        ratio,
        timestamp: Date.now(),
      });
    }
  }

  // --------------------------------------------------------------------------
  // Chunk Size Recommendation
  // --------------------------------------------------------------------------

  /**
   * Generate a chunk size recommendation based on current metrics.
   *
   * Strategy:
   * - High RTT -> larger chunks to amortize round-trip overhead
   * - High jitter -> smaller chunks to reduce retransmission cost
   * - Low bandwidth -> smaller chunks + enable compression
   * - High bandwidth + low RTT -> maximum chunk size
   */
  getRecommendation(): ChunkSizeRecommendation {
    const rtt = this.rttMeasurer.getSmoothedRtt();
    const jitter = this.rttMeasurer.getJitter();
    const shortTermBps = this.getRollingAverage(5_000).throughputBps;
    const hasRttData = this.rttMeasurer.hasData();

    let chunkSize: number;
    let reason: string;
    let enableCompression = false;
    let concurrency = 3;

    // If no RTT data yet, base decision solely on throughput
    if (!hasRttData) {
      if (shortTermBps >= QUALITY_THRESHOLDS.excellent) {
        chunkSize = CHUNK_TIERS.EXCELLENT;
        reason = 'Excellent throughput, no RTT data yet';
        concurrency = 6;
      } else if (shortTermBps >= QUALITY_THRESHOLDS.good) {
        chunkSize = CHUNK_TIERS.GOOD;
        reason = 'Good throughput, no RTT data yet';
        concurrency = 4;
      } else if (shortTermBps >= QUALITY_THRESHOLDS.fair) {
        chunkSize = CHUNK_TIERS.FAIR;
        reason = 'Fair throughput, no RTT data yet';
      } else {
        chunkSize = CHUNK_TIERS.POOR;
        reason = 'Low throughput, no RTT data yet';
        enableCompression = true;
        concurrency = 1;
      }
      return { chunkSize, reason, enableCompression, concurrency };
    }

    // Combined RTT + throughput decision matrix
    if (rtt < 10 && jitter < 5 && shortTermBps >= QUALITY_THRESHOLDS.good) {
      // LAN-like: ultra-low latency, stable, high throughput
      chunkSize = CHUNK_TIERS.EXCELLENT;
      reason = `LAN conditions: RTT=${rtt.toFixed(1)}ms, jitter=${jitter.toFixed(1)}ms`;
      concurrency = 8;
    } else if (rtt < 50 && jitter < 20 && shortTermBps >= QUALITY_THRESHOLDS.fair) {
      // Good internet: low latency, stable
      chunkSize = CHUNK_TIERS.GOOD;
      reason = `Good connection: RTT=${rtt.toFixed(1)}ms, jitter=${jitter.toFixed(1)}ms`;
      concurrency = 4;
    } else if (rtt < 100 && jitter < 50) {
      // Moderate: use medium chunks
      chunkSize = CHUNK_TIERS.FAIR;
      reason = `Moderate connection: RTT=${rtt.toFixed(1)}ms, jitter=${jitter.toFixed(1)}ms`;
      concurrency = 2;
    } else if (jitter > 100) {
      // High jitter: smaller chunks to limit retransmission waste
      chunkSize = CHUNK_TIERS.POOR;
      reason = `High jitter (${jitter.toFixed(1)}ms): small chunks to reduce retransmission cost`;
      enableCompression = true;
      concurrency = 1;
    } else if (rtt > 200) {
      // Very high RTT but stable jitter: larger chunks amortize overhead
      // However if throughput is also low, use smaller chunks
      if (shortTermBps >= QUALITY_THRESHOLDS.fair) {
        chunkSize = CHUNK_TIERS.FAIR;
        reason = `High RTT (${rtt.toFixed(1)}ms) but decent throughput: medium chunks`;
        concurrency = 2;
      } else {
        chunkSize = CHUNK_TIERS.POOR;
        reason = `High RTT (${rtt.toFixed(1)}ms) + low throughput: small chunks`;
        enableCompression = true;
        concurrency = 1;
      }
    } else {
      // Fallback: fair chunks
      chunkSize = CHUNK_TIERS.FAIR;
      reason = `Default: RTT=${rtt.toFixed(1)}ms, jitter=${jitter.toFixed(1)}ms`;
      concurrency = 2;
    }

    // Bandwidth drop override: if throughput is critically low, force small chunks
    if (shortTermBps > 0 && shortTermBps < QUALITY_THRESHOLDS.poor) {
      chunkSize = CHUNK_TIERS.POOR;
      reason = `Critical throughput (${(shortTermBps / 1024).toFixed(0)} KB/s): minimum chunks`;
      enableCompression = true;
      concurrency = 1;
    }

    return { chunkSize, reason, enableCompression, concurrency };
  }

  // --------------------------------------------------------------------------
  // Reporting
  // --------------------------------------------------------------------------

  /** Get comprehensive bandwidth report for UI display and logging */
  getReport(): BandwidthReport {
    const [instant, shortTerm, longTerm] = this.getAllRollingAverages();
    const latestSample = this.samples.length > 0
      ? this.samples[this.samples.length - 1]!
      : null;

    return {
      currentThroughput: latestSample?.throughputBps ?? 0,
      instantAverage: instant!.throughputBps,
      shortTermAverage: shortTerm!.throughputBps,
      longTermAverage: longTerm!.throughputBps,
      peakThroughput: this.peakThroughput,
      rtt: this.rttMeasurer.getRtt(),
      smoothedRtt: this.rttMeasurer.getSmoothedRtt(),
      jitter: this.rttMeasurer.getJitter(),
      qualityLevel: this.currentQuality,
      isDowngraded: this.isDowngraded,
      transitionCount: this.transitionCount,
      recommendation: this.getRecommendation(),
      totalBytes: this.totalBytesTracked,
      monitoringDurationMs: this.startTime > 0 ? Date.now() - this.startTime : 0,
      timestamp: Date.now(),
    };
  }

  /** Get just the current quality level */
  getQualityLevel(): QualityLevel {
    return this.currentQuality;
  }

  /** Get average throughput (5s window, for backward compatibility) */
  getAverageThroughput(): number {
    return this.getRollingAverage(5_000).throughputBps;
  }

  /** Get all bandwidth samples (for charting) */
  getSamples(): readonly BandwidthSample[] {
    return this.samples;
  }

  // --------------------------------------------------------------------------
  // Reset
  // --------------------------------------------------------------------------

  /** Reset all monitoring state while keeping timers running */
  reset(): void {
    this.samples = [];
    this.currentQuality = 'good';
    this.isDowngraded = false;
    this.transitionCount = 0;
    this.peakThroughput = 0;
    this.bytesInCurrentWindow = 0;
    this.totalBytesTracked = 0;
    this.lastSampleTime = Date.now();
    this.startTime = Date.now();
    this.pendingQuality = null;
    this.consecutiveQualityReadings = 0;
    this.rttMeasurer.reset();
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/** Create a bandwidth monitor with the given configuration */
export function createBandwidthMonitor(config?: BandwidthMonitorConfig): BandwidthMonitor {
  return new BandwidthMonitor(config);
}
