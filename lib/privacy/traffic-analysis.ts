/**
 * AGENT 014 - TRAFFIC-GHOST
 *
 * Traffic analysis resistance for privacy mode.
 *
 * Techniques employed:
 * 1. Random-length padding (geometric distribution) -- no fixed-size fingerprint
 * 2. Exponential-distribution timing jitter -- matches natural network variance
 * 3. Dummy (chaff) traffic generation -- encrypted null payloads at random intervals
 * 4. Traffic morphing -- shapes burst/size profile to resemble HTTPS browsing
 * 5. Constant-rate mode -- optional fixed bitrate for highest-threat users
 *
 * All randomness sourced from crypto.getRandomValues() (CSPRNG).
 *
 * SECURITY IMPACT: 9 | PRIVACY IMPACT: 10
 * PRIORITY: CRITICAL
 */

// ============================================================================
// Constants
// ============================================================================

/** Minimum packet size in bytes (privacy mode floor) */
export const PACKET_SIZE_BYTES = 16384; // 16 KiB -- minimum, not fixed

/** Timing jitter minimum percent -- policy floor */
export const TIMING_JITTER_PERCENT = 30;

/** Base inter-packet interval in milliseconds */
export const BASE_INTERVAL_MS = 50;

/** Magic byte prefix for chaff (noise) packets -- only meaningful pre-encryption */
export const CHAFF_MARKER = 0x00;

/** Magic byte prefix for real data packets -- only meaningful pre-encryption */
export const DATA_MARKER = 0x01;

/**
 * Maximum additional random padding in bytes.
 * The geometric distribution adds 0..MAX_RANDOM_PADDING_BYTES on top of
 * the base packet size. This prevents packet-size fingerprinting.
 */
export const MAX_RANDOM_PADDING_BYTES = 4096;

/**
 * Geometric distribution probability parameter for random padding.
 * Lower values = more variance in padding sizes.
 * p=0.002 yields mean ~500 bytes, spread across 0..MAX_RANDOM_PADDING_BYTES.
 */
export const GEOMETRIC_P = 0.002;

/** Default mean for exponential timing jitter in milliseconds */
export const EXPONENTIAL_MEAN_MS = 15;

/** Dummy traffic mean interval in milliseconds (idle period chaff) */
export const DUMMY_TRAFFIC_MEAN_INTERVAL_MS = 200;

/** Minimum dummy traffic interval to prevent CPU spin */
export const DUMMY_TRAFFIC_MIN_INTERVAL_MS = 20;

/**
 * Common HTTPS response sizes observed in real browsing.
 * Traffic morphing selects from these to shape packet sizes.
 */
export const HTTPS_PROFILE_SIZES: readonly number[] = [
  537, 1024, 1460, 2048, 2920, 4096, 5840, 8192, 11680, 16384,
] as const;

/** Constant-rate mode bitrate in bytes per second (default 128 KiB/s) */
export const CONSTANT_RATE_BPS = 131072;

// ============================================================================
// Types
// ============================================================================

export interface TrafficGhostConfig {
  /** Whether traffic analysis protection is enabled */
  enabled: boolean;
  /** Minimum packet size in bytes (actual size = base + random padding) */
  packetSize: number;
  /** Base inter-packet interval in ms */
  baseIntervalMs: number;
  /** Timing jitter percentage -- policy minimum (actual jitter uses exponential distribution) */
  jitterPercent: number;
  /** Maximum random padding added on top of packetSize (geometric distribution) */
  maxRandomPadding: number;
  /** Geometric distribution parameter for padding sizes (0 < p <= 1) */
  geometricP: number;
  /** Mean of exponential distribution for timing jitter (ms) */
  exponentialMeanMs: number;
  /** Whether to enable dummy traffic during idle periods */
  dummyTrafficEnabled: boolean;
  /** Mean interval between dummy packets (ms) */
  dummyTrafficMeanIntervalMs: number;
  /** Whether to morph traffic to resemble HTTPS browsing patterns */
  trafficMorphingEnabled: boolean;
  /** Whether to use constant-rate mode (fixed bitrate regardless of data) */
  constantRateEnabled: boolean;
  /** Constant-rate target in bytes per second */
  constantRateBps: number;
}

export interface PaddedPacket {
  /** Packet payload (variable size with random padding) */
  data: Uint8Array;
  /** Whether this is a real data packet or chaff */
  isChaff: boolean;
  /** Scheduled send time (with jitter applied) */
  scheduledMs: number;
}

/** Callback invoked by the dummy traffic generator with each chaff packet */
export type DummyTrafficCallback = (packet: Uint8Array) => void;

/** Handle returned by startDummyTraffic to allow stopping */
export interface DummyTrafficHandle {
  /** Stop generating dummy traffic */
  stop: () => void;
  /** Whether the generator is currently active */
  readonly active: boolean;
}

/** Statistics tracked by the traffic shaper */
export interface TrafficGhostStats {
  /** Total packets sent (data + chaff) */
  totalPackets: number;
  /** Total chaff packets sent */
  chaffPackets: number;
  /** Total data packets sent */
  dataPackets: number;
  /** Total bytes sent (including padding) */
  totalBytesSent: number;
  /** Total actual payload bytes (excluding padding) */
  payloadBytesSent: number;
  /** Average padding overhead ratio */
  averageOverhead: number;
}

// ============================================================================
// Default Config
// ============================================================================

export const TRAFFIC_GHOST_DEFAULTS: TrafficGhostConfig = {
  enabled: false,
  packetSize: PACKET_SIZE_BYTES,
  baseIntervalMs: BASE_INTERVAL_MS,
  jitterPercent: TIMING_JITTER_PERCENT,
  maxRandomPadding: MAX_RANDOM_PADDING_BYTES,
  geometricP: GEOMETRIC_P,
  exponentialMeanMs: EXPONENTIAL_MEAN_MS,
  dummyTrafficEnabled: true,
  dummyTrafficMeanIntervalMs: DUMMY_TRAFFIC_MEAN_INTERVAL_MS,
  trafficMorphingEnabled: true,
  constantRateEnabled: false,
  constantRateBps: CONSTANT_RATE_BPS,
};

// ============================================================================
// CSPRNG Utilities
// ============================================================================

/**
 * Generate a cryptographically random float in [0, 1).
 * Uses crypto.getRandomValues for all randomness.
 */
function cryptoRandomFloat(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  // Divide by 2^32 to get [0, 1)
  return (buf[0]! >>> 0) / 0x100000000;
}

/**
 * Sample from a geometric distribution truncated to [0, max].
 *
 * Uses the inverse CDF method: X = floor(ln(1-U) / ln(1-p))
 * where U ~ Uniform(0,1) and p is the success probability.
 *
 * This yields variable-length padding that is not uniformly distributed
 * (most packets get small padding, some get large), making size patterns
 * harder to fingerprint than either fixed or uniform-random padding.
 *
 * @param p - Success probability parameter (0 < p <= 1). Smaller p = larger mean.
 * @param max - Maximum value (truncation point)
 * @returns Integer in [0, max]
 */
export function sampleGeometric(p: number, max: number): number {
  if (p <= 0 || p > 1) {
    throw new Error(`TRAFFIC-GHOST: geometric p must be in (0, 1]. Got: ${p}`);
  }
  if (max < 0) {
    throw new Error(`TRAFFIC-GHOST: max must be >= 0. Got: ${max}`);
  }
  if (max === 0) return 0;

  const u = cryptoRandomFloat();
  // Avoid log(0) -- if u is exactly 0 (astronomically unlikely), clamp
  const uClamped = Math.max(u, Number.EPSILON);
  const raw = Math.floor(Math.log(1 - uClamped) / Math.log(1 - p));
  return Math.min(Math.max(0, raw), max);
}

/**
 * Sample from an exponential distribution with the given mean.
 *
 * Uses inverse CDF: X = -mean * ln(1 - U), U ~ Uniform(0,1).
 *
 * Exponential inter-arrival times are characteristic of Poisson processes
 * (natural network traffic). This makes TALLOW's timing indistinguishable
 * from normal network jitter, unlike uniform jitter which has a flat
 * distribution that is trivially detectable.
 *
 * @param meanMs - Mean of the distribution in milliseconds
 * @returns Non-negative delay in milliseconds
 */
export function sampleExponential(meanMs: number): number {
  if (meanMs <= 0) {
    throw new Error(`TRAFFIC-GHOST: exponential mean must be > 0. Got: ${meanMs}`);
  }
  const u = cryptoRandomFloat();
  const uClamped = Math.max(u, Number.EPSILON);
  return -meanMs * Math.log(1 - uClamped);
}

// ============================================================================
// Packet Padding (Random-Length, Geometric Distribution)
// ============================================================================

/**
 * Pad a data chunk to at least `packetSize` bytes, plus random additional
 * padding drawn from a geometric distribution.
 *
 * Packet format (pre-encryption):
 *   [marker: 1 byte][payload length: 4 bytes BE][payload: N bytes][random noise: R bytes]
 *
 * The total size = 5 + N + R, where R is random.
 * After encryption, the marker byte is indistinguishable from random data.
 *
 * @param payload - The real data to embed
 * @param packetSize - Minimum packet size (default: PACKET_SIZE_BYTES)
 * @param maxRandomPadding - Maximum additional random padding (default: MAX_RANDOM_PADDING_BYTES)
 * @param geometricP - Geometric distribution parameter (default: GEOMETRIC_P)
 * @returns Padded packet (variable length)
 */
export function padToFixedSize(
  payload: Uint8Array,
  packetSize: number = PACKET_SIZE_BYTES,
  maxRandomPadding: number = MAX_RANDOM_PADDING_BYTES,
  geometricP: number = GEOMETRIC_P,
): Uint8Array {
  const headerSize = 5; // 1 marker + 4 length
  if (payload.length > packetSize - headerSize) {
    throw new Error(
      `Payload (${payload.length} bytes) exceeds max for packet size ${packetSize} (max ${packetSize - headerSize})`,
    );
  }

  // Draw random additional padding from geometric distribution
  const randomPadding = sampleGeometric(geometricP, maxRandomPadding);
  const totalSize = packetSize + randomPadding;

  const packet = new Uint8Array(totalSize);
  // Marker byte
  packet[0] = DATA_MARKER;
  // 4-byte big-endian length
  const view = new DataView(packet.buffer);
  view.setUint32(1, payload.length, false);
  // Copy payload
  packet.set(payload, headerSize);
  // Fill remainder with cryptographically random noise
  const noiseLength = totalSize - headerSize - payload.length;
  if (noiseLength > 0) {
    const noise = new Uint8Array(noiseLength);
    crypto.getRandomValues(noise);
    packet.set(noise, headerSize + payload.length);
  }

  return packet;
}

/**
 * Extract the real payload from a padded packet.
 * Returns null if the packet is chaff or malformed.
 */
export function extractPayload(packet: Uint8Array): Uint8Array | null {
  if (packet.length < 5) return null;
  if (packet[0] === CHAFF_MARKER) return null;
  if (packet[0] !== DATA_MARKER) return null;

  const view = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);
  const length = view.getUint32(1, false);
  if (length > packet.length - 5) return null;

  return packet.slice(5, 5 + length);
}

// ============================================================================
// Chaff (Dummy) Packet Generation
// ============================================================================

/**
 * Generate a chaff (noise) packet.
 *
 * The chaff packet uses the same variable-length sizing as data packets
 * (geometric distribution for additional padding), making it
 * indistinguishable from a data packet after encryption.
 *
 * @param packetSize - Base packet size (default: PACKET_SIZE_BYTES)
 * @param maxRandomPadding - Maximum additional random padding (default: MAX_RANDOM_PADDING_BYTES)
 * @param geometricP - Geometric distribution parameter (default: GEOMETRIC_P)
 * @returns Chaff packet filled with cryptographically random data
 */
export function generateChaffPacket(
  packetSize: number = PACKET_SIZE_BYTES,
  maxRandomPadding: number = MAX_RANDOM_PADDING_BYTES,
  geometricP: number = GEOMETRIC_P,
): Uint8Array {
  // Match the same size distribution as real packets
  const randomPadding = sampleGeometric(geometricP, maxRandomPadding);
  const totalSize = packetSize + randomPadding;

  const packet = new Uint8Array(totalSize);
  packet[0] = CHAFF_MARKER;
  // Fill with cryptographically random noise (entire packet except marker)
  const noise = new Uint8Array(totalSize - 1);
  crypto.getRandomValues(noise);
  packet.set(noise, 1);
  return packet;
}

// ============================================================================
// Timing Jitter (Exponential Distribution)
// ============================================================================

/**
 * Compute a jittered inter-packet delay using an exponential distribution.
 *
 * The delay is: baseMs + exponentialSample(exponentialMeanMs)
 *
 * Exponential jitter matches Poisson-process inter-arrival times observed
 * in real network traffic, making TALLOW indistinguishable from normal
 * HTTPS browsing. Uniform jitter (the previous implementation) produces
 * a flat distribution that traffic analysis can detect.
 *
 * The minimum guaranteed jitter percentage (policy) is still enforced:
 * the exponential mean is set such that the expected jitter exceeds
 * jitterPercent of baseMs.
 *
 * @param baseMs - Base interval in milliseconds (default: BASE_INTERVAL_MS)
 * @param jitterPercent - Policy minimum jitter percentage (default: TIMING_JITTER_PERCENT)
 * @param exponentialMeanMs - Mean of the exponential component (default: EXPONENTIAL_MEAN_MS)
 * @returns Jittered delay in milliseconds (always >= 1)
 */
export function computeJitteredDelay(
  baseMs: number = BASE_INTERVAL_MS,
  jitterPercent: number = TIMING_JITTER_PERCENT,
  exponentialMeanMs: number = EXPONENTIAL_MEAN_MS,
): number {
  // The exponential sample adds positive jitter (delay)
  const exponentialJitter = sampleExponential(exponentialMeanMs);

  // Also apply a random sign to the base so delays can be shorter OR longer
  // This creates asymmetric jitter centered around baseMs
  const signBuf = new Uint8Array(1);
  crypto.getRandomValues(signBuf);
  const shorter = (signBuf[0]! & 1) === 0;

  // Compute the minimum jitter fraction from policy
  const minJitterFraction = jitterPercent / 100;

  // Ensure we meet the policy minimum average jitter
  const effectiveJitter = Math.max(exponentialJitter, baseMs * minJitterFraction * cryptoRandomFloat());

  let delay: number;
  if (shorter) {
    // Shorter delay -- but never below 20% of base to prevent burst patterns
    delay = baseMs - Math.min(effectiveJitter, baseMs * 0.8);
  } else {
    // Longer delay
    delay = baseMs + effectiveJitter;
  }

  return Math.max(1, delay);
}

// ============================================================================
// Dummy Traffic Generator
// ============================================================================

/**
 * Start generating dummy (chaff) traffic at random intervals.
 *
 * During idle periods, this sends encrypted zero-fill packets that are
 * indistinguishable from real traffic after encryption. The inter-packet
 * intervals follow an exponential distribution, matching Poisson-process
 * arrival patterns seen in real HTTPS browsing.
 *
 * The caller provides a callback that receives each chaff packet and is
 * responsible for encrypting and sending it over the wire.
 *
 * @param callback - Function to invoke with each generated chaff packet
 * @param config - Traffic ghost configuration (uses defaults if omitted)
 * @returns Handle with a stop() method to cease dummy traffic
 */
export function startDummyTraffic(
  callback: DummyTrafficCallback,
  config: Partial<TrafficGhostConfig> = {},
): DummyTrafficHandle {
  const merged: TrafficGhostConfig = { ...TRAFFIC_GHOST_DEFAULTS, ...config };
  let active = true;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function scheduleNext(): void {
    if (!active) return;

    // Exponential inter-arrival time
    const intervalMs = Math.max(
      DUMMY_TRAFFIC_MIN_INTERVAL_MS,
      sampleExponential(merged.dummyTrafficMeanIntervalMs),
    );

    timeoutId = setTimeout(() => {
      if (!active) return;

      // Generate a chaff packet with the same size distribution as real packets
      const chaff = generateChaffPacket(
        merged.packetSize,
        merged.maxRandomPadding,
        merged.geometricP,
      );

      try {
        callback(chaff);
      } catch {
        // Swallow errors -- dummy traffic must not crash the transfer layer
      }

      scheduleNext();
    }, intervalMs);
  }

  scheduleNext();

  return {
    stop() {
      active = false;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
    get active() {
      return active;
    },
  };
}

// ============================================================================
// Traffic Morphing (HTTPS Profile Simulation)
// ============================================================================

/**
 * Select a packet size that matches common HTTPS response sizes.
 *
 * Traffic morphing adjusts packet sizes to fit the distribution of
 * regular HTTPS browsing, making TALLOW traffic blend with background
 * web requests. The selected size is the smallest HTTPS profile size
 * that fits the payload, plus random additional padding.
 *
 * @param payloadLength - Actual payload length in bytes
 * @param profileSizes - Array of target sizes to morph towards (default: HTTPS_PROFILE_SIZES)
 * @param maxRandomPadding - Maximum additional padding (default: MAX_RANDOM_PADDING_BYTES)
 * @param geometricP - Geometric distribution parameter (default: GEOMETRIC_P)
 * @returns Target packet size in bytes
 */
export function morphToHttpsProfile(
  payloadLength: number,
  profileSizes: readonly number[] = HTTPS_PROFILE_SIZES,
  maxRandomPadding: number = MAX_RANDOM_PADDING_BYTES,
  geometricP: number = GEOMETRIC_P,
): number {
  const headerSize = 5;
  const needed = payloadLength + headerSize;

  // Find the smallest profile size that fits
  let baseSize = profileSizes[profileSizes.length - 1]!; // fallback to largest
  for (const size of profileSizes) {
    if (size >= needed) {
      baseSize = size;
      break;
    }
  }

  // Add random padding on top (geometric distribution)
  const randomPadding = sampleGeometric(geometricP, maxRandomPadding);
  return baseSize + randomPadding;
}

/**
 * Pad a payload using traffic morphing to match HTTPS browsing patterns.
 *
 * @param payload - The real data to embed
 * @param profileSizes - HTTPS profile sizes to morph towards
 * @returns Padded packet matching an HTTPS profile size (plus random padding)
 */
export function padWithMorphing(
  payload: Uint8Array,
  profileSizes: readonly number[] = HTTPS_PROFILE_SIZES,
): Uint8Array {
  const targetSize = morphToHttpsProfile(payload.length, profileSizes);
  const headerSize = 5;

  const packet = new Uint8Array(targetSize);
  packet[0] = DATA_MARKER;
  const view = new DataView(packet.buffer);
  view.setUint32(1, payload.length, false);
  packet.set(payload, headerSize);

  // Fill remaining space with cryptographically random noise
  const noiseLength = targetSize - headerSize - payload.length;
  if (noiseLength > 0) {
    const noise = new Uint8Array(noiseLength);
    crypto.getRandomValues(noise);
    packet.set(noise, headerSize + payload.length);
  }

  return packet;
}

// ============================================================================
// Constant-Rate Mode
// ============================================================================

/**
 * Compute the fixed inter-packet interval for constant-rate mode.
 *
 * In constant-rate mode, packets are sent at a fixed bitrate regardless
 * of actual data volume. Idle slots are filled with chaff packets.
 * This is the highest-privacy option, suitable for threat models where
 * any traffic variation is dangerous.
 *
 * @param packetSize - Size of each packet in bytes
 * @param targetBps - Target bitrate in bytes per second
 * @returns Fixed interval in milliseconds between packets
 */
export function computeConstantRateInterval(
  packetSize: number = PACKET_SIZE_BYTES,
  targetBps: number = CONSTANT_RATE_BPS,
): number {
  if (targetBps <= 0) {
    throw new Error(`TRAFFIC-GHOST: constant rate must be > 0. Got: ${targetBps}`);
  }
  // interval = packetSize / targetBps * 1000ms
  return (packetSize / targetBps) * 1000;
}

/**
 * Start a constant-rate traffic stream.
 *
 * Sends packets at a fixed bitrate. When real data is available, it is
 * sent; otherwise chaff packets fill the slot. The caller provides
 * a data source function that returns the next payload or null (idle).
 *
 * @param sendFn - Function to send a packet (data or chaff) over the wire
 * @param dataSourceFn - Function that returns the next payload, or null if idle
 * @param config - Traffic ghost configuration
 * @returns Handle to stop the constant-rate stream
 */
export function startConstantRateStream(
  sendFn: (packet: Uint8Array) => void,
  dataSourceFn: () => Uint8Array | null,
  config: Partial<TrafficGhostConfig> = {},
): DummyTrafficHandle {
  const merged: TrafficGhostConfig = { ...TRAFFIC_GHOST_DEFAULTS, ...config };
  const intervalMs = computeConstantRateInterval(
    merged.packetSize,
    merged.constantRateBps,
  );

  let active = true;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  intervalId = setInterval(() => {
    if (!active) return;

    const payload = dataSourceFn();
    let packet: Uint8Array;

    if (payload !== null) {
      // Send real data with padding
      packet = padToFixedSize(
        payload,
        merged.packetSize,
        merged.maxRandomPadding,
        merged.geometricP,
      );
    } else {
      // Send chaff to maintain constant rate
      packet = generateChaffPacket(
        merged.packetSize,
        merged.maxRandomPadding,
        merged.geometricP,
      );
    }

    try {
      sendFn(packet);
    } catch {
      // Swallow -- constant rate must not be interrupted by send errors
    }
  }, intervalMs);

  return {
    stop() {
      active = false;
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
    get active() {
      return active;
    },
  };
}

// ============================================================================
// Policy Enforcement
// ============================================================================

/**
 * Validate that a config meets TRAFFIC-GHOST security minimums.
 *
 * @throws Error if any policy constraint is violated
 */
export function enforceTrafficGhostPolicy(config: TrafficGhostConfig): void {
  if (config.enabled) {
    if (config.packetSize < PACKET_SIZE_BYTES) {
      throw new Error(
        `TRAFFIC-GHOST: packet size must be >= ${PACKET_SIZE_BYTES}. Got: ${config.packetSize}`,
      );
    }
    if (config.jitterPercent < TIMING_JITTER_PERCENT) {
      throw new Error(
        `TRAFFIC-GHOST: jitter must be >= ${TIMING_JITTER_PERCENT}%. Got: ${config.jitterPercent}%`,
      );
    }
    if (config.geometricP <= 0 || config.geometricP > 1) {
      throw new Error(
        `TRAFFIC-GHOST: geometricP must be in (0, 1]. Got: ${config.geometricP}`,
      );
    }
    if (config.exponentialMeanMs <= 0) {
      throw new Error(
        `TRAFFIC-GHOST: exponentialMeanMs must be > 0. Got: ${config.exponentialMeanMs}`,
      );
    }
  }
}

// ============================================================================
// Statistics Helper
// ============================================================================

/**
 * Create a fresh statistics object for traffic tracking.
 */
export function createTrafficGhostStats(): TrafficGhostStats {
  return {
    totalPackets: 0,
    chaffPackets: 0,
    dataPackets: 0,
    totalBytesSent: 0,
    payloadBytesSent: 0,
    averageOverhead: 0,
  };
}

/**
 * Record a sent packet in the statistics tracker.
 *
 * @param stats - Mutable stats object to update
 * @param packetSize - Total size of the packet sent
 * @param payloadSize - Size of the actual payload (0 for chaff)
 * @param isChaff - Whether the packet was chaff
 */
export function recordPacket(
  stats: TrafficGhostStats,
  packetSize: number,
  payloadSize: number,
  isChaff: boolean,
): void {
  stats.totalPackets++;
  stats.totalBytesSent += packetSize;
  stats.payloadBytesSent += payloadSize;

  if (isChaff) {
    stats.chaffPackets++;
  } else {
    stats.dataPackets++;
  }

  if (stats.payloadBytesSent > 0) {
    stats.averageOverhead =
      (stats.totalBytesSent - stats.payloadBytesSent) / stats.payloadBytesSent;
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  // Constants
  PACKET_SIZE_BYTES,
  TIMING_JITTER_PERCENT,
  BASE_INTERVAL_MS,
  CHAFF_MARKER,
  DATA_MARKER,
  MAX_RANDOM_PADDING_BYTES,
  GEOMETRIC_P,
  EXPONENTIAL_MEAN_MS,
  DUMMY_TRAFFIC_MEAN_INTERVAL_MS,
  HTTPS_PROFILE_SIZES,
  CONSTANT_RATE_BPS,

  // Config
  TRAFFIC_GHOST_DEFAULTS,

  // Core packet operations
  padToFixedSize,
  extractPayload,
  generateChaffPacket,

  // Timing
  computeJitteredDelay,

  // Distribution sampling
  sampleGeometric,
  sampleExponential,

  // Dummy traffic
  startDummyTraffic,

  // Traffic morphing
  morphToHttpsProfile,
  padWithMorphing,

  // Constant-rate mode
  computeConstantRateInterval,
  startConstantRateStream,

  // Policy
  enforceTrafficGhostPolicy,

  // Statistics
  createTrafficGhostStats,
  recordPacket,
};
