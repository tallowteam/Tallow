'use client';

/**
 * Timing Obfuscation Module
 *
 * Implements timing analysis prevention through:
 * - Cryptographically random inter-packet delays
 * - Constant bitrate shaping
 * - Traffic pattern normalization
 * - Burst detection avoidance
 *
 * Timing attacks can reveal:
 * - File sizes through total transfer time
 * - Activity patterns through packet timing
 * - Content types through timing signatures
 *
 * SECURITY IMPACT: 9 | PRIVACY IMPACT: 10
 * PRIORITY: HIGH
 */

import secureLog from '../utils/secure-logger';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Timing obfuscation configuration
 */
export interface TimingConfig {
  // Delay configuration
  mode: TimingMode;
  minDelayMs: number;           // Minimum delay between packets
  maxDelayMs: number;           // Maximum delay between packets
  baseDelayMs: number;          // Base delay for jittered mode

  // Constant bitrate settings
  targetBitrate: number;        // Target bits per second
  bitrateVariance: number;      // Allowed variance (0-1)

  // Burst protection
  burstSize: number;            // Packets before forced pause
  burstPauseMs: number;         // Pause duration after burst

  // Pattern randomization
  patternEntropy: number;       // Entropy level (0-1, higher = more random)

  // Adaptive timing
  adaptiveEnabled: boolean;     // Adjust timing based on network conditions
  adaptiveSampleSize: number;   // Number of samples for adaptation
}

/**
 * Timing modes for different use cases
 */
export enum TimingMode {
  // Random delays from cryptographically secure source
  RANDOM = 'random',

  // Constant bitrate with jitter
  CONSTANT_BITRATE = 'constant_bitrate',

  // Exponential distribution (mimics natural traffic)
  EXPONENTIAL = 'exponential',

  // Poisson distribution (mimics web browsing)
  POISSON = 'poisson',

  // Uniform distribution
  UNIFORM = 'uniform',

  // Burst mode with pauses
  BURST = 'burst',

  // Adaptive timing based on network
  ADAPTIVE = 'adaptive',

  // No timing obfuscation
  NONE = 'none',
}

/**
 * Packet timing information
 */
export interface PacketTiming {
  scheduledTime: number;        // When packet should be sent
  actualTime?: number;          // When packet was actually sent
  delay: number;                // Delay from previous packet
  jitter: number;               // Deviation from expected delay
  burstIndex: number;           // Position in current burst
}

/**
 * Timing statistics
 */
export interface TimingStats {
  totalPackets: number;
  totalDelayMs: number;
  averageDelayMs: number;
  minDelayMs: number;
  maxDelayMs: number;
  jitterMs: number;             // Standard deviation of delays
  currentBitrate: number;
  burstCount: number;
}

/**
 * Network condition sample
 */
interface NetworkSample {
  timestamp: number;
  rtt: number;
  throughput: number;
  packetLoss: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: TimingConfig = {
  mode: TimingMode.CONSTANT_BITRATE,
  minDelayMs: 1,
  maxDelayMs: 100,
  baseDelayMs: 10,
  targetBitrate: 1_000_000,     // 1 Mbps
  bitrateVariance: 0.2,         // 20% variance
  burstSize: 10,
  burstPauseMs: 50,
  patternEntropy: 0.7,
  adaptiveEnabled: true,
  adaptiveSampleSize: 10,
};

// Web browsing timing characteristics
const WEB_BROWSING_PROFILE = {
  meanDelayMs: 50,
  burstProbability: 0.3,
  idleProbability: 0.2,
  burstPackets: 5,
};

// Streaming timing characteristics
const STREAMING_PROFILE = {
  packetIntervalMs: 20,
  variance: 0.1,
  bufferBursts: true,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate cryptographically random bytes
 */
function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate cryptographically random float in [0, 1)
 */
function randomFloat(): number {
  const bytes = randomBytes(4);
  return new DataView(bytes.buffer).getUint32(0, false) / 0xFFFFFFFF;
}

/**
 * Generate random integer in [min, max]
 */
function randomInt(min: number, max: number): number {
  return Math.floor(min + randomFloat() * (max - min + 1));
}

/**
 * Generate exponentially distributed delay
 */
function exponentialDelay(mean: number): number {
  // Inverse transform sampling for exponential distribution
  return -mean * Math.log(1 - randomFloat());
}

/**
 * Generate Poisson-distributed delay
 */
function poissonDelay(lambda: number): number {
  // Using Knuth's algorithm for Poisson
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= randomFloat();
  } while (p > L);

  return k - 1;
}

/**
 * Generate Gaussian random with Box-Muller transform
 * (Exported for use in custom timing implementations)
 */
export function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = randomFloat();
  const u2 = randomFloat();

  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}

// ============================================================================
// TimingObfuscator Class
// ============================================================================

export class TimingObfuscator {
  private config: TimingConfig;
  private stats: TimingStats;
  private lastSendTime: number = 0;
  private burstCounter: number = 0;
  private delays: number[] = [];
  private networkSamples: NetworkSample[] = [];
  private adaptedBitrate: number | null = null;

  constructor(config: Partial<TimingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = this.initStats();
  }

  private initStats(): TimingStats {
    return {
      totalPackets: 0,
      totalDelayMs: 0,
      averageDelayMs: 0,
      minDelayMs: Infinity,
      maxDelayMs: 0,
      jitterMs: 0,
      currentBitrate: this.config.targetBitrate,
      burstCount: 0,
    };
  }

  // ==========================================================================
  // Delay Calculation
  // ==========================================================================

  /**
   * Calculate delay for next packet
   */
  calculateDelay(packetSize: number = 1024): number {
    let delay: number;

    switch (this.config.mode) {
      case TimingMode.RANDOM:
        delay = this.calculateRandomDelay();
        break;

      case TimingMode.CONSTANT_BITRATE:
        delay = this.calculateConstantBitrateDelay(packetSize);
        break;

      case TimingMode.EXPONENTIAL:
        delay = this.calculateExponentialDelay();
        break;

      case TimingMode.POISSON:
        delay = this.calculatePoissonDelay();
        break;

      case TimingMode.UNIFORM:
        delay = this.calculateUniformDelay();
        break;

      case TimingMode.BURST:
        delay = this.calculateBurstDelay();
        break;

      case TimingMode.ADAPTIVE:
        delay = this.calculateAdaptiveDelay(packetSize);
        break;

      case TimingMode.NONE:
        delay = 0;
        break;

      default:
        delay = this.config.baseDelayMs;
    }

    // Ensure delay is within bounds
    delay = Math.max(this.config.minDelayMs, Math.min(delay, this.config.maxDelayMs));

    // Update statistics
    this.updateStats(delay);

    return delay;
  }

  /**
   * Calculate purely random delay
   */
  private calculateRandomDelay(): number {
    return randomInt(this.config.minDelayMs, this.config.maxDelayMs);
  }

  /**
   * Calculate delay for constant bitrate
   */
  private calculateConstantBitrateDelay(packetSize: number): number {
    const bitrate = this.adaptedBitrate ?? this.config.targetBitrate;
    const bytesPerMs = bitrate / 8 / 1000;
    const baseDelay = packetSize / bytesPerMs;

    // Add variance
    const variance = this.config.bitrateVariance * baseDelay;
    const jitter = (randomFloat() - 0.5) * 2 * variance;

    return Math.max(0, baseDelay + jitter);
  }

  /**
   * Calculate exponentially distributed delay
   */
  private calculateExponentialDelay(): number {
    return exponentialDelay(this.config.baseDelayMs);
  }

  /**
   * Calculate Poisson-distributed delay
   */
  private calculatePoissonDelay(): number {
    // Lambda = expected packets per second
    const lambda = 1000 / this.config.baseDelayMs;
    const packets = poissonDelay(lambda);
    return packets > 0 ? 1000 / packets : this.config.baseDelayMs;
  }

  /**
   * Calculate uniformly distributed delay
   */
  private calculateUniformDelay(): number {
    const range = this.config.maxDelayMs - this.config.minDelayMs;
    return this.config.minDelayMs + randomFloat() * range;
  }

  /**
   * Calculate delay in burst mode
   */
  private calculateBurstDelay(): number {
    this.burstCounter++;

    // Check if we've completed a burst
    if (this.burstCounter >= this.config.burstSize) {
      this.burstCounter = 0;
      this.stats.burstCount++;

      // Add jitter to burst pause
      const pauseJitter = randomFloat() * 0.3 * this.config.burstPauseMs;
      return this.config.burstPauseMs + pauseJitter;
    }

    // Within burst, use minimal delay
    return this.config.minDelayMs + randomFloat() * 5;
  }

  /**
   * Calculate delay adaptively based on network conditions
   */
  private calculateAdaptiveDelay(packetSize: number): number {
    if (this.networkSamples.length < this.config.adaptiveSampleSize) {
      // Not enough samples, use constant bitrate
      return this.calculateConstantBitrateDelay(packetSize);
    }

    // Calculate average network conditions
    const avgRtt = this.networkSamples.reduce((sum, s) => sum + s.rtt, 0) /
                   this.networkSamples.length;
    const avgThroughput = this.networkSamples.reduce((sum, s) => sum + s.throughput, 0) /
                          this.networkSamples.length;
    const avgLoss = this.networkSamples.reduce((sum, s) => sum + s.packetLoss, 0) /
                    this.networkSamples.length;

    // Adjust bitrate based on conditions
    let adjustedBitrate = this.config.targetBitrate;

    // Reduce bitrate if RTT is high
    if (avgRtt > 100) {
      adjustedBitrate *= 0.8;
    }

    // Reduce bitrate if packet loss is high
    if (avgLoss > 0.05) {
      adjustedBitrate *= (1 - avgLoss);
    }

    // Cap at measured throughput
    if (avgThroughput > 0) {
      adjustedBitrate = Math.min(adjustedBitrate, avgThroughput * 0.9);
    }

    this.adaptedBitrate = adjustedBitrate;

    // Calculate delay
    const bytesPerMs = adjustedBitrate / 8 / 1000;
    const baseDelay = packetSize / bytesPerMs;

    // Add jitter
    return baseDelay + (randomFloat() - 0.5) * this.config.bitrateVariance * baseDelay;
  }

  // ==========================================================================
  // Timing Application
  // ==========================================================================

  /**
   * Get timing info for next packet
   */
  getPacketTiming(packetSize: number = 1024): PacketTiming {
    const delay = this.calculateDelay(packetSize);
    const now = Date.now();

    // Calculate expected jitter from previous packets
    let jitter = 0;
    if (this.delays.length > 0) {
      const avgDelay = this.delays.reduce((a, b) => a + b, 0) / this.delays.length;
      jitter = delay - avgDelay;
    }

    return {
      scheduledTime: Math.max(now, this.lastSendTime + delay),
      delay,
      jitter,
      burstIndex: this.burstCounter,
    };
  }

  /**
   * Wait for appropriate delay before sending
   */
  async waitForDelay(packetSize: number = 1024): Promise<void> {
    const timing = this.getPacketTiming(packetSize);
    const now = Date.now();
    const waitTime = timing.scheduledTime - now;

    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastSendTime = Date.now();
  }

  /**
   * Create a rate limiter for controlled sending
   */
  createRateLimiter(): (callback: () => void) => void {
    const queue: (() => void)[] = [];
    let processing = false;

    const processQueue = async () => {
      if (processing || queue.length === 0) {
        return;
      }

      processing = true;

      while (queue.length > 0) {
        const callback = queue.shift();
        if (callback) {
          await this.waitForDelay();
          callback();
        }
      }

      processing = false;
    };

    return (callback: () => void) => {
      queue.push(callback);
      processQueue();
    };
  }

  /**
   * Async generator for timed packet emission
   */
  async *timedEmitter<T>(packets: T[], getSizeFunc?: (packet: T) => number): AsyncGenerator<T> {
    for (const packet of packets) {
      const size = getSizeFunc ? getSizeFunc(packet) : 1024;
      await this.waitForDelay(size);
      yield packet;
    }
  }

  // ==========================================================================
  // Network Condition Tracking
  // ==========================================================================

  /**
   * Record a network sample for adaptive timing
   */
  recordNetworkSample(rtt: number, throughput: number, packetLoss: number): void {
    const sample: NetworkSample = {
      timestamp: Date.now(),
      rtt,
      throughput,
      packetLoss,
    };

    this.networkSamples.push(sample);

    // Keep only recent samples
    const maxAge = 30000; // 30 seconds
    const cutoff = Date.now() - maxAge;
    this.networkSamples = this.networkSamples.filter(s => s.timestamp > cutoff);

    // Limit number of samples
    if (this.networkSamples.length > this.config.adaptiveSampleSize * 2) {
      this.networkSamples = this.networkSamples.slice(-this.config.adaptiveSampleSize);
    }
  }

  /**
   * Get current network quality assessment
   */
  getNetworkQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
    if (this.networkSamples.length < 3) {
      return 'unknown';
    }

    const avgRtt = this.networkSamples.reduce((sum, s) => sum + s.rtt, 0) /
                   this.networkSamples.length;
    const avgLoss = this.networkSamples.reduce((sum, s) => sum + s.packetLoss, 0) /
                    this.networkSamples.length;

    if (avgRtt < 50 && avgLoss < 0.01) {
      return 'excellent';
    }
    if (avgRtt < 100 && avgLoss < 0.03) {
      return 'good';
    }
    if (avgRtt < 200 && avgLoss < 0.05) {
      return 'fair';
    }
    return 'poor';
  }

  // ==========================================================================
  // Traffic Pattern Mimicry
  // ==========================================================================

  /**
   * Mimic web browsing traffic pattern
   */
  async mimicWebBrowsing<T>(packets: T[]): Promise<T[]> {
    const result: T[] = [];

    for (let i = 0; i < packets.length; i++) {
      const packet = packets[i]!;

      // Decide action based on probability
      const rand = randomFloat();

      if (rand < WEB_BROWSING_PROFILE.idleProbability) {
        // Simulate idle period
        await new Promise(resolve => setTimeout(resolve, randomInt(200, 1000)));
      } else if (rand < WEB_BROWSING_PROFILE.idleProbability + WEB_BROWSING_PROFILE.burstProbability) {
        // Burst of packets
        const burstCount = Math.min(
          WEB_BROWSING_PROFILE.burstPackets,
          packets.length - i
        );

        for (let j = 0; j < burstCount && i + j < packets.length; j++) {
          await new Promise(resolve => setTimeout(resolve, randomInt(5, 20)));
          result.push(packets[i + j]!);
        }
        i += burstCount - 1;
        continue;
      }

      // Normal delay
      const delay = exponentialDelay(WEB_BROWSING_PROFILE.meanDelayMs);
      await new Promise(resolve => setTimeout(resolve, delay));
      result.push(packet);
    }

    return result;
  }

  /**
   * Mimic video streaming traffic pattern
   */
  async *mimicStreaming<T>(packets: T[]): AsyncGenerator<T> {
    for (const packet of packets) {
      // Streaming has regular intervals with slight variance
      const variance = STREAMING_PROFILE.variance * STREAMING_PROFILE.packetIntervalMs;
      const delay = STREAMING_PROFILE.packetIntervalMs + (randomFloat() - 0.5) * 2 * variance;

      await new Promise(resolve => setTimeout(resolve, delay));
      yield packet;
    }
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Update timing statistics
   */
  private updateStats(delay: number): void {
    this.stats.totalPackets++;
    this.stats.totalDelayMs += delay;
    this.stats.averageDelayMs = this.stats.totalDelayMs / this.stats.totalPackets;

    if (delay < this.stats.minDelayMs) {
      this.stats.minDelayMs = delay;
    }
    if (delay > this.stats.maxDelayMs) {
      this.stats.maxDelayMs = delay;
    }

    // Track delays for jitter calculation
    this.delays.push(delay);
    if (this.delays.length > 100) {
      this.delays.shift();
    }

    // Calculate jitter (standard deviation)
    if (this.delays.length > 1) {
      const mean = this.delays.reduce((a, b) => a + b, 0) / this.delays.length;
      const variance = this.delays.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
                       this.delays.length;
      this.stats.jitterMs = Math.sqrt(variance);
    }

    // Update current bitrate
    if (this.stats.averageDelayMs > 0) {
      this.stats.currentBitrate = (8 * 1024) / this.stats.averageDelayMs * 1000;
    }
  }

  /**
   * Get timing statistics
   */
  getStats(): TimingStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = this.initStats();
    this.delays = [];
    this.burstCounter = 0;
  }

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TimingConfig>): void {
    this.config = { ...this.config, ...config };

    // Reset adapted bitrate when config changes
    if (config.targetBitrate !== undefined) {
      this.adaptedBitrate = null;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): TimingConfig {
    return { ...this.config };
  }

  /**
   * Set timing mode
   */
  setMode(mode: TimingMode): void {
    this.config.mode = mode;
    secureLog.log('[TimingObfuscator] Mode set to:', mode);
  }

  /**
   * Set target bitrate
   */
  setTargetBitrate(bitrate: number): void {
    this.config.targetBitrate = bitrate;
    this.adaptedBitrate = null;
  }

  /**
   * Reset state
   */
  reset(): void {
    this.resetStats();
    this.lastSendTime = 0;
    this.networkSamples = [];
    this.adaptedBitrate = null;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let timingInstance: TimingObfuscator | null = null;

export function getTimingObfuscator(config?: Partial<TimingConfig>): TimingObfuscator {
  if (!timingInstance) {
    timingInstance = new TimingObfuscator(config);
  } else if (config) {
    timingInstance.updateConfig(config);
  }
  return timingInstance;
}

export function resetTimingObfuscator(): void {
  if (timingInstance) {
    timingInstance.reset();
    timingInstance = null;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick delay function with default settings
 */
export async function applyTimingDelay(packetSize: number = 1024): Promise<void> {
  const obfuscator = getTimingObfuscator();
  await obfuscator.waitForDelay(packetSize);
}

/**
 * Get delay value without waiting
 */
export function getTimingDelay(packetSize: number = 1024): number {
  const obfuscator = getTimingObfuscator();
  return obfuscator.calculateDelay(packetSize);
}

export default TimingObfuscator;
