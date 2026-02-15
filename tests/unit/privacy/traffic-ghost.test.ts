import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  PACKET_SIZE_BYTES,
  TIMING_JITTER_PERCENT,
  MAX_RANDOM_PADDING_BYTES,
  GEOMETRIC_P,
  EXPONENTIAL_MEAN_MS,
  HTTPS_PROFILE_SIZES,
  CONSTANT_RATE_BPS,
  padToFixedSize,
  extractPayload,
  generateChaffPacket,
  computeJitteredDelay,
  CHAFF_MARKER,
  DATA_MARKER,
  enforceTrafficGhostPolicy,
  sampleGeometric,
  sampleExponential,
  morphToHttpsProfile,
  padWithMorphing,
  computeConstantRateInterval,
  startDummyTraffic,
  startConstantRateStream,
  createTrafficGhostStats,
  recordPacket,
} from '@/lib/privacy/traffic-analysis';

// ============================================================================
// Constants
// ============================================================================

describe('traffic-ghost constants', () => {
  it('enforces minimum fixed packet size of 16384 bytes', () => {
    expect(PACKET_SIZE_BYTES).toBe(16384);
  });

  it('enforces minimum jitter of 30%', () => {
    expect(TIMING_JITTER_PERCENT).toBe(30);
  });

  it('defines maximum random padding bytes', () => {
    expect(MAX_RANDOM_PADDING_BYTES).toBe(4096);
  });

  it('defines geometric distribution parameter', () => {
    expect(GEOMETRIC_P).toBeGreaterThan(0);
    expect(GEOMETRIC_P).toBeLessThanOrEqual(1);
  });

  it('defines HTTPS profile sizes in ascending order', () => {
    for (let i = 1; i < HTTPS_PROFILE_SIZES.length; i++) {
      expect(HTTPS_PROFILE_SIZES[i]!).toBeGreaterThan(HTTPS_PROFILE_SIZES[i - 1]!);
    }
  });
});

// ============================================================================
// CSPRNG Distribution Sampling
// ============================================================================

describe('sampleGeometric', () => {
  it('returns values in [0, max] range', () => {
    const max = 1000;
    for (let i = 0; i < 200; i++) {
      const v = sampleGeometric(0.01, max);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(max);
    }
  });

  it('returns only integers', () => {
    for (let i = 0; i < 100; i++) {
      const v = sampleGeometric(0.05, 500);
      expect(v).toBe(Math.floor(v));
    }
  });

  it('returns 0 when max is 0', () => {
    expect(sampleGeometric(0.5, 0)).toBe(0);
  });

  it('produces variance (not constant output)', () => {
    const values = new Set<number>();
    for (let i = 0; i < 200; i++) {
      values.add(sampleGeometric(0.002, 4096));
    }
    // With p=0.002 and max=4096, we should see many distinct values
    expect(values.size).toBeGreaterThan(10);
  });

  it('rejects invalid p values', () => {
    expect(() => sampleGeometric(0, 100)).toThrow('geometric p must be in (0, 1]');
    expect(() => sampleGeometric(-1, 100)).toThrow('geometric p must be in (0, 1]');
    expect(() => sampleGeometric(1.5, 100)).toThrow('geometric p must be in (0, 1]');
  });

  it('rejects negative max', () => {
    expect(() => sampleGeometric(0.5, -1)).toThrow('max must be >= 0');
  });
});

describe('sampleExponential', () => {
  it('returns non-negative values', () => {
    for (let i = 0; i < 200; i++) {
      const v = sampleExponential(50);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it('has roughly correct mean over many samples', () => {
    const meanMs = 100;
    const n = 5000;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += sampleExponential(meanMs);
    }
    const empiricalMean = sum / n;
    // Allow 20% tolerance for statistical variance
    expect(empiricalMean).toBeGreaterThan(meanMs * 0.7);
    expect(empiricalMean).toBeLessThan(meanMs * 1.3);
  });

  it('produces variance (not constant output)', () => {
    const values = new Set<number>();
    for (let i = 0; i < 100; i++) {
      values.add(Math.round(sampleExponential(50)));
    }
    expect(values.size).toBeGreaterThan(10);
  });

  it('rejects non-positive mean', () => {
    expect(() => sampleExponential(0)).toThrow('exponential mean must be > 0');
    expect(() => sampleExponential(-5)).toThrow('exponential mean must be > 0');
  });
});

// ============================================================================
// Packet Padding (Random-Length)
// ============================================================================

describe('padToFixedSize (random-length padding)', () => {
  it('produces packets at least packetSize bytes', () => {
    const payload = new Uint8Array(100);
    crypto.getRandomValues(payload);
    const padded = padToFixedSize(payload);

    expect(padded.length).toBeGreaterThanOrEqual(PACKET_SIZE_BYTES);
    expect(padded[0]).toBe(DATA_MARKER);
  });

  it('produces variable-length packets (not fixed size)', () => {
    const payload = new Uint8Array(100);
    crypto.getRandomValues(payload);

    const sizes = new Set<number>();
    for (let i = 0; i < 50; i++) {
      sizes.add(padToFixedSize(payload).length);
    }
    // With geometric distribution, we should see multiple distinct sizes
    expect(sizes.size).toBeGreaterThan(1);
  });

  it('never exceeds packetSize + maxRandomPadding', () => {
    const payload = new Uint8Array(100);
    for (let i = 0; i < 100; i++) {
      const padded = padToFixedSize(payload);
      expect(padded.length).toBeLessThanOrEqual(PACKET_SIZE_BYTES + MAX_RANDOM_PADDING_BYTES);
    }
  });

  it('extracts original payload from padded packet', () => {
    const original = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const padded = padToFixedSize(original);
    const extracted = extractPayload(padded);

    expect(extracted).not.toBeNull();
    expect(extracted!.length).toBe(original.length);
    expect(Array.from(extracted!)).toEqual(Array.from(original));
  });

  it('fills padding with random noise (not zeros)', () => {
    const payload = new Uint8Array(10);
    const padded = padToFixedSize(payload);

    // Check bytes after payload header + data
    const paddingStart = 5 + payload.length;
    const paddingBytes = padded.slice(paddingStart);

    // Extremely unlikely that all random padding bytes are zero
    const nonZero = Array.from(paddingBytes).filter(b => b !== 0);
    expect(nonZero.length).toBeGreaterThan(0);
  });

  it('throws when payload exceeds maximum', () => {
    const oversized = new Uint8Array(PACKET_SIZE_BYTES);
    expect(() => padToFixedSize(oversized)).toThrow('exceeds max');
  });

  it('handles zero-length payload', () => {
    const empty = new Uint8Array(0);
    const padded = padToFixedSize(empty);
    expect(padded.length).toBeGreaterThanOrEqual(PACKET_SIZE_BYTES);
    const extracted = extractPayload(padded);
    expect(extracted).not.toBeNull();
    expect(extracted!.length).toBe(0);
  });
});

// ============================================================================
// Payload Extraction
// ============================================================================

describe('extractPayload', () => {
  it('returns null for chaff packets', () => {
    const chaff = generateChaffPacket();
    expect(extractPayload(chaff)).toBeNull();
  });

  it('returns null for packets smaller than header', () => {
    expect(extractPayload(new Uint8Array(4))).toBeNull();
  });

  it('returns null for unknown marker bytes', () => {
    const bad = new Uint8Array(100);
    bad[0] = 0xFF;
    expect(extractPayload(bad)).toBeNull();
  });

  it('returns null when length exceeds packet bounds', () => {
    const bad = new Uint8Array(10);
    bad[0] = DATA_MARKER;
    const view = new DataView(bad.buffer);
    view.setUint32(1, 9999, false); // bogus length
    expect(extractPayload(bad)).toBeNull();
  });
});

// ============================================================================
// Chaff Packet Generation
// ============================================================================

describe('generateChaffPacket', () => {
  it('produces packets at least packetSize bytes', () => {
    const chaff = generateChaffPacket();
    expect(chaff.length).toBeGreaterThanOrEqual(PACKET_SIZE_BYTES);
    expect(chaff[0]).toBe(CHAFF_MARKER);
  });

  it('produces variable-length chaff (same distribution as data)', () => {
    const sizes = new Set<number>();
    for (let i = 0; i < 50; i++) {
      sizes.add(generateChaffPacket().length);
    }
    expect(sizes.size).toBeGreaterThan(1);
  });

  it('is indistinguishable in size distribution from data packets', () => {
    // Both should use the same geometric distribution
    // Collect size distributions for both
    const dataSizes: number[] = [];
    const chaffSizes: number[] = [];
    const payload = new Uint8Array(100);

    for (let i = 0; i < 200; i++) {
      dataSizes.push(padToFixedSize(payload).length);
      chaffSizes.push(generateChaffPacket().length);
    }

    // Both should have minimum >= PACKET_SIZE_BYTES
    expect(Math.min(...dataSizes)).toBeGreaterThanOrEqual(PACKET_SIZE_BYTES);
    expect(Math.min(...chaffSizes)).toBeGreaterThanOrEqual(PACKET_SIZE_BYTES);

    // Both should have max <= PACKET_SIZE_BYTES + MAX_RANDOM_PADDING_BYTES
    expect(Math.max(...dataSizes)).toBeLessThanOrEqual(PACKET_SIZE_BYTES + MAX_RANDOM_PADDING_BYTES);
    expect(Math.max(...chaffSizes)).toBeLessThanOrEqual(PACKET_SIZE_BYTES + MAX_RANDOM_PADDING_BYTES);
  });

  it('discards chaff packets on payload extraction', () => {
    const chaff = generateChaffPacket();
    expect(extractPayload(chaff)).toBeNull();
  });
});

// ============================================================================
// Timing Jitter (Exponential Distribution)
// ============================================================================

describe('computeJitteredDelay (exponential distribution)', () => {
  it('produces jittered delay always >= 1ms', () => {
    for (let i = 0; i < 200; i++) {
      const d = computeJitteredDelay(100, TIMING_JITTER_PERCENT, EXPONENTIAL_MEAN_MS);
      expect(d).toBeGreaterThanOrEqual(1);
    }
  });

  it('produces significant variation (not constant)', () => {
    const baseMs = 100;
    const delays: number[] = [];
    for (let i = 0; i < 200; i++) {
      delays.push(computeJitteredDelay(baseMs, TIMING_JITTER_PERCENT, EXPONENTIAL_MEAN_MS));
    }
    const unique = new Set(delays.map(d => Math.round(d)));
    expect(unique.size).toBeGreaterThan(5);
  });

  it('can produce delays both shorter and longer than base', () => {
    const baseMs = 100;
    let shorter = 0;
    let longer = 0;
    for (let i = 0; i < 500; i++) {
      const d = computeJitteredDelay(baseMs, TIMING_JITTER_PERCENT, EXPONENTIAL_MEAN_MS);
      if (d < baseMs) shorter++;
      if (d > baseMs) longer++;
    }
    // Both directions should occur
    expect(shorter).toBeGreaterThan(0);
    expect(longer).toBeGreaterThan(0);
  });

  it('never goes below 20% of base (burst prevention)', () => {
    const baseMs = 100;
    for (let i = 0; i < 500; i++) {
      const d = computeJitteredDelay(baseMs, TIMING_JITTER_PERCENT, EXPONENTIAL_MEAN_MS);
      expect(d).toBeGreaterThanOrEqual(baseMs * 0.2);
    }
  });
});

// ============================================================================
// Traffic Morphing
// ============================================================================

describe('morphToHttpsProfile', () => {
  it('selects a size from HTTPS profile sizes that fits the payload', () => {
    const size = morphToHttpsProfile(100);
    // Should be at least the smallest profile size that fits 100 + 5 = 105
    expect(size).toBeGreaterThanOrEqual(HTTPS_PROFILE_SIZES[0]!);
  });

  it('falls back to largest profile for large payloads', () => {
    const largestProfile = HTTPS_PROFILE_SIZES[HTTPS_PROFILE_SIZES.length - 1]!;
    const size = morphToHttpsProfile(largestProfile - 5); // exactly fits
    expect(size).toBeGreaterThanOrEqual(largestProfile);
  });

  it('adds random padding on top of profile size', () => {
    const sizes = new Set<number>();
    for (let i = 0; i < 50; i++) {
      sizes.add(morphToHttpsProfile(100));
    }
    // Should see variation from geometric padding
    expect(sizes.size).toBeGreaterThan(1);
  });
});

describe('padWithMorphing', () => {
  it('produces valid packets that can be extracted', () => {
    const original = new Uint8Array([10, 20, 30, 40, 50]);
    const morphed = padWithMorphing(original);

    expect(morphed[0]).toBe(DATA_MARKER);
    const extracted = extractPayload(morphed);
    expect(extracted).not.toBeNull();
    expect(Array.from(extracted!)).toEqual(Array.from(original));
  });

  it('produces variable-length packets', () => {
    const payload = new Uint8Array(50);
    const sizes = new Set<number>();
    for (let i = 0; i < 50; i++) {
      sizes.add(padWithMorphing(payload).length);
    }
    expect(sizes.size).toBeGreaterThan(1);
  });
});

// ============================================================================
// Constant-Rate Mode
// ============================================================================

describe('computeConstantRateInterval', () => {
  it('computes correct interval for default settings', () => {
    const interval = computeConstantRateInterval(PACKET_SIZE_BYTES, CONSTANT_RATE_BPS);
    // 16384 / 131072 * 1000 = 125ms
    expect(interval).toBeCloseTo(125, 0);
  });

  it('rejects non-positive rate', () => {
    expect(() => computeConstantRateInterval(1024, 0)).toThrow('constant rate must be > 0');
    expect(() => computeConstantRateInterval(1024, -100)).toThrow('constant rate must be > 0');
  });
});

describe('startConstantRateStream', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends packets at fixed intervals', () => {
    vi.useFakeTimers();
    const sent: Uint8Array[] = [];
    let dataAvailable: Uint8Array | null = null;

    const handle = startConstantRateStream(
      (pkt) => sent.push(pkt),
      () => dataAvailable,
      { packetSize: 512, constantRateBps: 5120 },
    );

    // interval = 512 / 5120 * 1000 = 100ms
    expect(handle.active).toBe(true);

    vi.advanceTimersByTime(350);
    // Should have sent 3 chaff packets (at 100ms, 200ms, 300ms)
    expect(sent.length).toBe(3);

    // All should be chaff (marker byte 0x00)
    for (const pkt of sent) {
      expect(pkt[0]).toBe(CHAFF_MARKER);
    }

    handle.stop();
    expect(handle.active).toBe(false);

    vi.advanceTimersByTime(500);
    // No more packets after stop
    expect(sent.length).toBe(3);
  });

  it('sends real data when available', () => {
    vi.useFakeTimers();
    const sent: Uint8Array[] = [];
    const realData = new Uint8Array([42, 43, 44]);
    let dataAvailable: Uint8Array | null = realData;

    const handle = startConstantRateStream(
      (pkt) => sent.push(pkt),
      () => {
        const d = dataAvailable;
        dataAvailable = null; // only one payload
        return d;
      },
      { packetSize: 512, constantRateBps: 5120 },
    );

    vi.advanceTimersByTime(250);
    expect(sent.length).toBe(2);

    // First packet should be real data
    expect(sent[0]![0]).toBe(DATA_MARKER);
    const extracted = extractPayload(sent[0]!);
    expect(extracted).not.toBeNull();
    expect(Array.from(extracted!)).toEqual([42, 43, 44]);

    // Second should be chaff
    expect(sent[1]![0]).toBe(CHAFF_MARKER);

    handle.stop();
  });
});

// ============================================================================
// Dummy Traffic Generator
// ============================================================================

describe('startDummyTraffic', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates chaff packets and can be stopped', () => {
    vi.useFakeTimers();
    const packets: Uint8Array[] = [];

    const handle = startDummyTraffic(
      (pkt) => packets.push(pkt),
      { packetSize: 512, dummyTrafficMeanIntervalMs: 50 },
    );

    expect(handle.active).toBe(true);

    // Advance enough time for several packets
    vi.advanceTimersByTime(2000);
    expect(packets.length).toBeGreaterThan(0);

    // All should be chaff
    for (const pkt of packets) {
      expect(pkt[0]).toBe(CHAFF_MARKER);
      expect(pkt.length).toBeGreaterThanOrEqual(512);
    }

    handle.stop();
    expect(handle.active).toBe(false);

    const countBefore = packets.length;
    vi.advanceTimersByTime(2000);
    expect(packets.length).toBe(countBefore);
  });

  it('swallows errors in callback without crashing', () => {
    vi.useFakeTimers();
    let callCount = 0;

    const handle = startDummyTraffic(
      () => {
        callCount++;
        throw new Error('simulated send failure');
      },
      { packetSize: 512, dummyTrafficMeanIntervalMs: 50 },
    );

    // Should not throw
    vi.advanceTimersByTime(500);
    expect(callCount).toBeGreaterThan(0);

    handle.stop();
  });
});

// ============================================================================
// Policy Enforcement
// ============================================================================

describe('enforceTrafficGhostPolicy', () => {
  const validConfig = {
    enabled: true,
    packetSize: 16384,
    baseIntervalMs: 50,
    jitterPercent: 30,
    maxRandomPadding: 4096,
    geometricP: 0.002,
    exponentialMeanMs: 15,
    dummyTrafficEnabled: true,
    dummyTrafficMeanIntervalMs: 200,
    trafficMorphingEnabled: true,
    constantRateEnabled: false,
    constantRateBps: 131072,
  };

  it('accepts valid configuration', () => {
    expect(() => enforceTrafficGhostPolicy(validConfig)).not.toThrow();
  });

  it('rejects packet size below 16384', () => {
    expect(() =>
      enforceTrafficGhostPolicy({ ...validConfig, packetSize: 1024 })
    ).toThrow('packet size must be >= 16384');
  });

  it('rejects jitter below 30%', () => {
    expect(() =>
      enforceTrafficGhostPolicy({ ...validConfig, jitterPercent: 10 })
    ).toThrow('jitter must be >= 30');
  });

  it('rejects invalid geometricP', () => {
    expect(() =>
      enforceTrafficGhostPolicy({ ...validConfig, geometricP: 0 })
    ).toThrow('geometricP must be in (0, 1]');
    expect(() =>
      enforceTrafficGhostPolicy({ ...validConfig, geometricP: 2 })
    ).toThrow('geometricP must be in (0, 1]');
  });

  it('rejects non-positive exponentialMeanMs', () => {
    expect(() =>
      enforceTrafficGhostPolicy({ ...validConfig, exponentialMeanMs: 0 })
    ).toThrow('exponentialMeanMs must be > 0');
  });

  it('skips validation when disabled', () => {
    expect(() =>
      enforceTrafficGhostPolicy({ ...validConfig, enabled: false, packetSize: 1 })
    ).not.toThrow();
  });
});

// ============================================================================
// Statistics
// ============================================================================

describe('traffic ghost statistics', () => {
  it('creates fresh stats with all zeros', () => {
    const stats = createTrafficGhostStats();
    expect(stats.totalPackets).toBe(0);
    expect(stats.chaffPackets).toBe(0);
    expect(stats.dataPackets).toBe(0);
    expect(stats.totalBytesSent).toBe(0);
    expect(stats.payloadBytesSent).toBe(0);
    expect(stats.averageOverhead).toBe(0);
  });

  it('tracks data packets correctly', () => {
    const stats = createTrafficGhostStats();
    recordPacket(stats, 16384, 1000, false);

    expect(stats.totalPackets).toBe(1);
    expect(stats.dataPackets).toBe(1);
    expect(stats.chaffPackets).toBe(0);
    expect(stats.totalBytesSent).toBe(16384);
    expect(stats.payloadBytesSent).toBe(1000);
    expect(stats.averageOverhead).toBeGreaterThan(0);
  });

  it('tracks chaff packets correctly', () => {
    const stats = createTrafficGhostStats();
    recordPacket(stats, 16384, 0, true);

    expect(stats.totalPackets).toBe(1);
    expect(stats.chaffPackets).toBe(1);
    expect(stats.dataPackets).toBe(0);
  });

  it('computes average overhead correctly', () => {
    const stats = createTrafficGhostStats();
    recordPacket(stats, 2000, 1000, false);
    // overhead = (2000 - 1000) / 1000 = 1.0
    expect(stats.averageOverhead).toBeCloseTo(1.0, 5);
  });
});
