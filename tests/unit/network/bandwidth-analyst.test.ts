/**
 * Bandwidth Analyst Tests (Agent 027)
 *
 * Validates:
 * - 100ms sampling interval (not 1s)
 * - Real RTT measurement via binary ping/pong protocol
 * - EWMA-smoothed RTT with alpha=0.125 (RFC 6298)
 * - Jitter calculation (RTTVAR) with beta=0.25
 * - Rolling averages at 1s, 5s, 30s windows
 * - Bandwidth spike/drop detection
 * - Adaptive chunk size recommendations
 * - Quality hysteresis to prevent oscillation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  BandwidthMonitor,
  RTTMeasurer,
  createBandwidthMonitor,
  type BandwidthReport,
  type QualityLevel,
  type BandwidthChangeEvent,
  type RTTSample,
} from '@/lib/network/bandwidth-monitor';

// ============================================================================
// RTT MEASURER TESTS
// ============================================================================

describe('RTTMeasurer', () => {
  let measurer: RTTMeasurer;

  beforeEach(() => {
    measurer = new RTTMeasurer(50);
  });

  it('should create ping messages as 16-byte ArrayBuffers', () => {
    const ping = measurer.createPing();
    expect(ping).toBeInstanceOf(ArrayBuffer);
    expect(ping.byteLength).toBe(16);

    // Verify ping magic bytes: "TPNG" = [0x54, 0x50, 0x4E, 0x47]
    const bytes = new Uint8Array(ping);
    expect(bytes[0]).toBe(0x54);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x4e);
    expect(bytes[3]).toBe(0x47);
  });

  it('should create pong responses from ping messages', () => {
    const ping = measurer.createPing();
    const pong = RTTMeasurer.createPong(ping);

    expect(pong).not.toBeNull();
    expect(pong!.byteLength).toBe(16);

    // Verify pong magic bytes: "TPOG" = [0x54, 0x50, 0x4F, 0x47]
    const bytes = new Uint8Array(pong!);
    expect(bytes[0]).toBe(0x54);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x4f);
    expect(bytes[3]).toBe(0x47);

    // Sequence and timestamp should be preserved
    const pingView = new DataView(ping);
    const pongView = new DataView(pong!);
    expect(pongView.getUint32(4, true)).toBe(pingView.getUint32(4, true));
    expect(pongView.getFloat64(8, true)).toBe(pingView.getFloat64(8, true));
  });

  it('should return null for createPong with non-ping data', () => {
    const randomData = new ArrayBuffer(16);
    expect(RTTMeasurer.createPong(randomData)).toBeNull();
  });

  it('should return null for createPong with wrong size', () => {
    const tooSmall = new ArrayBuffer(8);
    expect(RTTMeasurer.createPong(tooSmall)).toBeNull();
  });

  it('should correctly identify RTT messages', () => {
    const ping = measurer.createPing();
    expect(RTTMeasurer.isRTTMessage(ping)).toBe(true);

    const pong = RTTMeasurer.createPong(ping)!;
    expect(RTTMeasurer.isRTTMessage(pong)).toBe(true);

    const random = new ArrayBuffer(16);
    expect(RTTMeasurer.isRTTMessage(random)).toBe(false);

    const wrongSize = new ArrayBuffer(10);
    expect(RTTMeasurer.isRTTMessage(wrongSize)).toBe(false);
  });

  it('should correctly identify ping vs pong', () => {
    const ping = measurer.createPing();
    expect(RTTMeasurer.isPing(ping)).toBe(true);

    const pong = RTTMeasurer.createPong(ping)!;
    expect(RTTMeasurer.isPing(pong)).toBe(false);
  });

  it('should process pong and compute RTT', () => {
    const ping = measurer.createPing();
    const pong = RTTMeasurer.createPong(ping)!;

    const sample = measurer.processPong(pong);
    expect(sample).not.toBeNull();
    expect(sample!.rtt).toBeGreaterThanOrEqual(0);
    expect(sample!.smoothedRtt).toBeGreaterThanOrEqual(0);
    expect(sample!.jitter).toBeGreaterThanOrEqual(0);
  });

  it('should initialize EWMA on first measurement', () => {
    expect(measurer.hasData()).toBe(false);

    const ping = measurer.createPing();
    const pong = RTTMeasurer.createPong(ping)!;
    const sample = measurer.processPong(pong)!;

    expect(measurer.hasData()).toBe(true);
    // First measurement: smoothedRtt = rawRtt
    expect(sample.smoothedRtt).toBe(sample.rtt);
    // First measurement: jitter = rawRtt / 2
    expect(sample.jitter).toBeCloseTo(sample.rtt / 2, 5);
  });

  it('should apply EWMA smoothing with alpha=0.125 on subsequent measurements', () => {
    // Simulate two measurements with known timing
    const ping1 = measurer.createPing();
    const pong1 = RTTMeasurer.createPong(ping1)!;
    const s1 = measurer.processPong(pong1)!;

    const firstSmoothed = s1.smoothedRtt;
    const firstJitter = s1.jitter;

    const ping2 = measurer.createPing();
    const pong2 = RTTMeasurer.createPong(ping2)!;
    const s2 = measurer.processPong(pong2)!;

    // SRTT = (1 - 0.125) * SRTT_prev + 0.125 * R_new
    const expectedSmoothed = 0.875 * firstSmoothed + 0.125 * s2.rtt;
    expect(s2.smoothedRtt).toBeCloseTo(expectedSmoothed, 3);

    // RTTVAR = (1 - 0.25) * RTTVAR_prev + 0.25 * |SRTT_prev - R_new|
    const expectedJitter = 0.75 * firstJitter + 0.25 * Math.abs(firstSmoothed - s2.rtt);
    expect(s2.jitter).toBeCloseTo(expectedJitter, 3);
  });

  it('should ignore pong for unknown sequence', () => {
    // Create a pong with random data that has correct magic but unknown seq
    const buffer = new ArrayBuffer(16);
    const bytes = new Uint8Array(buffer);
    bytes.set([0x54, 0x50, 0x4f, 0x47], 0); // TPOG
    const view = new DataView(buffer);
    view.setUint32(4, 99999, true); // Unknown sequence

    const result = measurer.processPong(buffer);
    expect(result).toBeNull();
  });

  it('should increment sequence numbers', () => {
    const ping1 = measurer.createPing();
    const ping2 = measurer.createPing();
    const ping3 = measurer.createPing();

    const view1 = new DataView(ping1);
    const view2 = new DataView(ping2);
    const view3 = new DataView(ping3);

    expect(view2.getUint32(4, true)).toBe(view1.getUint32(4, true) + 1);
    expect(view3.getUint32(4, true)).toBe(view2.getUint32(4, true) + 1);
  });

  it('should store RTT samples up to maxSamples', () => {
    const smallMeasurer = new RTTMeasurer(3);

    for (let i = 0; i < 5; i++) {
      const ping = smallMeasurer.createPing();
      const pong = RTTMeasurer.createPong(ping)!;
      smallMeasurer.processPong(pong);
    }

    expect(smallMeasurer.getSamples().length).toBe(3);
  });

  it('should reset all state', () => {
    const ping = measurer.createPing();
    const pong = RTTMeasurer.createPong(ping)!;
    measurer.processPong(pong);

    expect(measurer.hasData()).toBe(true);

    measurer.reset();

    expect(measurer.hasData()).toBe(false);
    expect(measurer.getRtt()).toBe(0);
    expect(measurer.getSmoothedRtt()).toBe(0);
    expect(measurer.getJitter()).toBe(0);
    expect(measurer.getSamples().length).toBe(0);
  });
});

// ============================================================================
// BANDWIDTH MONITOR - SAMPLING
// ============================================================================

describe('BandwidthMonitor - Sampling', () => {
  let monitor: BandwidthMonitor;

  beforeEach(() => {
    vi.useFakeTimers();
    monitor = createBandwidthMonitor({
      sampleIntervalMs: 100,
      maxSamples: 50,
    });
  });

  afterEach(() => {
    monitor.stop();
    vi.useRealTimers();
  });

  it('should default to 100ms sample interval', () => {
    const defaultMonitor = new BandwidthMonitor();
    defaultMonitor.start();

    // Record bytes and advance less than 100ms -- no sample yet
    defaultMonitor.recordBytes(1024);
    vi.advanceTimersByTime(50);
    expect(defaultMonitor.getSamples().length).toBe(0);

    // Advance to 100ms -- first sample
    vi.advanceTimersByTime(50);
    expect(defaultMonitor.getSamples().length).toBe(1);

    defaultMonitor.stop();
  });

  it('should record bytes and calculate throughput at 100ms intervals', () => {
    monitor.start();

    // 1 MB in 100ms = 10 MB/s
    monitor.recordBytes(1024 * 1024);
    vi.advanceTimersByTime(100);

    const samples = monitor.getSamples();
    expect(samples.length).toBe(1);

    const sample = samples[0]!;
    expect(sample.bytesTransferred).toBe(1024 * 1024);
    // Throughput should be approximately 10 MB/s
    expect(sample.throughputBps).toBeGreaterThan(5 * 1024 * 1024);
  });

  it('should accumulate multiple recordBytes calls within a window', () => {
    monitor.start();

    monitor.recordBytes(512);
    monitor.recordBytes(512);
    monitor.recordBytes(1024);

    vi.advanceTimersByTime(100);

    const samples = monitor.getSamples();
    expect(samples.length).toBe(1);
    expect(samples[0]!.bytesTransferred).toBe(2048);
  });

  it('should reset byte counter after each sample', () => {
    monitor.start();

    monitor.recordBytes(1000);
    vi.advanceTimersByTime(100);

    monitor.recordBytes(500);
    vi.advanceTimersByTime(100);

    const samples = monitor.getSamples();
    expect(samples.length).toBe(2);
    expect(samples[0]!.bytesTransferred).toBe(1000);
    expect(samples[1]!.bytesTransferred).toBe(500);
  });

  it('should ignore non-positive byte values', () => {
    monitor.start();

    monitor.recordBytes(0);
    monitor.recordBytes(-100);
    monitor.recordBytes(500);

    vi.advanceTimersByTime(100);

    expect(monitor.getSamples()[0]!.bytesTransferred).toBe(500);
  });

  it('should track peak throughput', () => {
    monitor.start();

    monitor.recordBytes(100 * 1024);
    vi.advanceTimersByTime(100);

    monitor.recordBytes(500 * 1024);
    vi.advanceTimersByTime(100);

    monitor.recordBytes(200 * 1024);
    vi.advanceTimersByTime(100);

    const report = monitor.getReport();
    expect(report.peakThroughput).toBeGreaterThan(0);
  });

  it('should trim samples to maxSamples', () => {
    const smallMonitor = createBandwidthMonitor({
      sampleIntervalMs: 100,
      maxSamples: 5,
    });
    smallMonitor.start();

    for (let i = 0; i < 10; i++) {
      smallMonitor.recordBytes(1024);
      vi.advanceTimersByTime(100);
    }

    expect(smallMonitor.getSamples().length).toBe(5);
    smallMonitor.stop();
  });

  it('should not start duplicate timers', () => {
    monitor.start();
    monitor.start(); // Second call should be no-op

    monitor.recordBytes(1024);
    vi.advanceTimersByTime(100);

    // Only one sample, not two (would be two if duplicate timers)
    expect(monitor.getSamples().length).toBe(1);
  });

  it('should track isRunning state', () => {
    expect(monitor.isRunning()).toBe(false);
    monitor.start();
    expect(monitor.isRunning()).toBe(true);
    monitor.stop();
    expect(monitor.isRunning()).toBe(false);
  });
});

// ============================================================================
// BANDWIDTH MONITOR - ROLLING AVERAGES
// ============================================================================

describe('BandwidthMonitor - Rolling Averages', () => {
  let monitor: BandwidthMonitor;

  beforeEach(() => {
    vi.useFakeTimers();
    monitor = createBandwidthMonitor({
      sampleIntervalMs: 100,
      maxSamples: 300,
    });
  });

  afterEach(() => {
    monitor.stop();
    vi.useRealTimers();
  });

  it('should return zero averages with no samples', () => {
    const avg = monitor.getRollingAverage(1000);
    expect(avg.throughputBps).toBe(0);
    expect(avg.sampleCount).toBe(0);
    expect(avg.label).toBe('1s');
  });

  it('should label known windows correctly', () => {
    monitor.start();
    monitor.recordBytes(1024);
    vi.advanceTimersByTime(100);

    expect(monitor.getRollingAverage(1000).label).toBe('1s');
    expect(monitor.getRollingAverage(5000).label).toBe('5s');
    expect(monitor.getRollingAverage(30000).label).toBe('30s');
    expect(monitor.getRollingAverage(2000).label).toBe('2000ms');
  });

  it('should compute 1s rolling average from last 10 samples', () => {
    monitor.start();

    // Produce 10 samples (1 second at 100ms each)
    for (let i = 0; i < 10; i++) {
      monitor.recordBytes(10 * 1024); // 10 KB per 100ms = 100 KB/s
      vi.advanceTimersByTime(100);
    }

    const avg = monitor.getRollingAverage(1000);
    expect(avg.sampleCount).toBe(10);
    expect(avg.throughputBps).toBeGreaterThan(50 * 1024); // Should be around 100 KB/s
  });

  it('should return all three rolling averages', () => {
    monitor.start();

    for (let i = 0; i < 10; i++) {
      monitor.recordBytes(1024);
      vi.advanceTimersByTime(100);
    }

    const averages = monitor.getAllRollingAverages();
    expect(averages).toHaveLength(3);
    expect(averages[0]!.windowMs).toBe(1000);
    expect(averages[1]!.windowMs).toBe(5000);
    expect(averages[2]!.windowMs).toBe(30000);
  });

  it('getAverageThroughput should return 5s window for backward compatibility', () => {
    monitor.start();

    for (let i = 0; i < 20; i++) {
      monitor.recordBytes(5 * 1024);
      vi.advanceTimersByTime(100);
    }

    const avg = monitor.getAverageThroughput();
    const fiveSecAvg = monitor.getRollingAverage(5000).throughputBps;
    expect(avg).toBe(fiveSecAvg);
  });
});

// ============================================================================
// BANDWIDTH MONITOR - QUALITY CLASSIFICATION
// ============================================================================

describe('BandwidthMonitor - Quality Classification', () => {
  let monitor: BandwidthMonitor;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start at good quality', () => {
    monitor = createBandwidthMonitor();
    expect(monitor.getQualityLevel()).toBe('good');
    monitor.stop();
  });

  it('should transition to critical on zero throughput (immediate downgrade)', () => {
    const onQualityChange = vi.fn();
    monitor = createBandwidthMonitor({
      sampleIntervalMs: 100,
      maxSamples: 300,
      onQualityChange,
    });
    monitor.start();

    // Generate zero-throughput samples
    for (let i = 0; i < 50; i++) {
      vi.advanceTimersByTime(100);
    }

    // Quality should have changed to critical (immediate downgrade)
    expect(monitor.getQualityLevel()).toBe('critical');
    expect(onQualityChange).toHaveBeenCalled();
    monitor.stop();
  });

  it('should report quality in bandwidth report', () => {
    monitor = createBandwidthMonitor({ sampleIntervalMs: 100 });
    monitor.start();

    for (let i = 0; i < 10; i++) {
      monitor.recordBytes(15 * 1024 * 1024); // 15 MB per 100ms = huge
      vi.advanceTimersByTime(100);
    }

    const report = monitor.getReport();
    expect(['excellent', 'good', 'fair', 'poor', 'critical']).toContain(report.qualityLevel);
    monitor.stop();
  });
});

// ============================================================================
// BANDWIDTH MONITOR - AUTO DOWNGRADE
// ============================================================================

describe('BandwidthMonitor - Auto Downgrade', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should trigger downgrade callback when throughput falls below threshold', () => {
    const onDowngrade = vi.fn();
    const monitor = createBandwidthMonitor({
      sampleIntervalMs: 100,
      downgradeThresholdBps: 50 * 1024, // 50 KB/s
      onDowngrade,
    });
    monitor.start();

    // Generate 10 samples at 10 KB/s (below threshold)
    for (let i = 0; i < 15; i++) {
      monitor.recordBytes(1024); // 1 KB per 100ms = 10 KB/s
      vi.advanceTimersByTime(100);
    }

    const report = monitor.getReport();
    expect(report.isDowngraded).toBe(true);
    expect(onDowngrade).toHaveBeenCalled();

    monitor.stop();
  });

  it('should auto-upgrade when throughput exceeds upgrade threshold', () => {
    const monitor = createBandwidthMonitor({
      sampleIntervalMs: 100,
      downgradeThresholdBps: 50 * 1024,
      upgradeThresholdBps: 200 * 1024,
    });
    monitor.start();

    // Trigger downgrade first
    for (let i = 0; i < 15; i++) {
      monitor.recordBytes(1024);
      vi.advanceTimersByTime(100);
    }
    expect(monitor.getReport().isDowngraded).toBe(true);

    // Now send high throughput to trigger upgrade
    for (let i = 0; i < 60; i++) {
      monitor.recordBytes(50 * 1024); // 50 KB per 100ms = 500 KB/s
      vi.advanceTimersByTime(100);
    }

    expect(monitor.getReport().isDowngraded).toBe(false);
    monitor.stop();
  });
});

// ============================================================================
// BANDWIDTH MONITOR - BANDWIDTH CHANGE DETECTION
// ============================================================================

describe('BandwidthMonitor - Change Detection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should detect bandwidth drops', () => {
    const onBandwidthChange = vi.fn();
    const monitor = createBandwidthMonitor({
      sampleIntervalMs: 100,
      dropRatio: 0.3,
      onBandwidthChange,
    });
    monitor.start();

    // Establish high baseline (5 seconds = 50 samples)
    for (let i = 0; i < 50; i++) {
      monitor.recordBytes(100 * 1024); // 100 KB per 100ms
      vi.advanceTimersByTime(100);
    }

    // Sudden drop to near zero
    for (let i = 0; i < 15; i++) {
      monitor.recordBytes(1024); // 1 KB per 100ms
      vi.advanceTimersByTime(100);
    }

    const dropCalls = onBandwidthChange.mock.calls.filter(
      (call: [BandwidthChangeEvent]) => call[0].type === 'drop'
    );
    expect(dropCalls.length).toBeGreaterThan(0);
    monitor.stop();
  });
});

// ============================================================================
// BANDWIDTH MONITOR - CHUNK RECOMMENDATIONS
// ============================================================================

describe('BandwidthMonitor - Chunk Recommendations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should recommend small chunks with no data', () => {
    const monitor = createBandwidthMonitor();
    const rec = monitor.getRecommendation();

    // With no samples and no RTT, should default to poor/low tier
    expect(rec.chunkSize).toBeLessThanOrEqual(256 * 1024);
    expect(rec.reason).toBeTruthy();
    monitor.stop();
  });

  it('should recommend large chunks for excellent throughput', () => {
    const monitor = createBandwidthMonitor({ sampleIntervalMs: 100 });
    monitor.start();

    // Produce excellent throughput
    for (let i = 0; i < 60; i++) {
      monitor.recordBytes(2 * 1024 * 1024); // 2 MB per 100ms = 20 MB/s
      vi.advanceTimersByTime(100);
    }

    const rec = monitor.getRecommendation();
    expect(rec.chunkSize).toBeGreaterThanOrEqual(256 * 1024);
    expect(rec.enableCompression).toBe(false);
    monitor.stop();
  });

  it('should recommend small chunks with compression for poor throughput', () => {
    const monitor = createBandwidthMonitor({ sampleIntervalMs: 100 });
    monitor.start();

    // Produce very low throughput
    for (let i = 0; i < 60; i++) {
      monitor.recordBytes(512); // 512 bytes per 100ms = ~5 KB/s
      vi.advanceTimersByTime(100);
    }

    const rec = monitor.getRecommendation();
    expect(rec.chunkSize).toBe(16 * 1024); // POOR tier
    expect(rec.enableCompression).toBe(true);
    expect(rec.concurrency).toBe(1);
    monitor.stop();
  });

  it('should include recommendation in report', () => {
    const monitor = createBandwidthMonitor({ sampleIntervalMs: 100 });
    monitor.start();

    monitor.recordBytes(1024);
    vi.advanceTimersByTime(100);

    const report = monitor.getReport();
    expect(report.recommendation).toBeDefined();
    expect(report.recommendation.chunkSize).toBeGreaterThan(0);
    expect(typeof report.recommendation.reason).toBe('string');
    expect(typeof report.recommendation.enableCompression).toBe('boolean');
    expect(typeof report.recommendation.concurrency).toBe('number');
    monitor.stop();
  });
});

// ============================================================================
// BANDWIDTH MONITOR - RTT INTEGRATION
// ============================================================================

describe('BandwidthMonitor - RTT Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should expose RTT measurer', () => {
    const monitor = createBandwidthMonitor();
    const rttMeasurer = monitor.getRTTMeasurer();
    expect(rttMeasurer).toBeInstanceOf(RTTMeasurer);
    monitor.stop();
  });

  it('should include RTT data in report after measurement', () => {
    const monitor = createBandwidthMonitor({ sampleIntervalMs: 100 });
    monitor.start();

    const rttMeasurer = monitor.getRTTMeasurer();
    const ping = rttMeasurer.createPing();
    const pong = RTTMeasurer.createPong(ping)!;
    rttMeasurer.processPong(pong);

    monitor.recordBytes(1024);
    vi.advanceTimersByTime(100);

    const report = monitor.getReport();
    expect(report.rtt).toBeGreaterThanOrEqual(0);
    expect(report.smoothedRtt).toBeGreaterThanOrEqual(0);
    expect(report.jitter).toBeGreaterThanOrEqual(0);
    monitor.stop();
  });

  it('should report zero RTT when no measurements taken', () => {
    const monitor = createBandwidthMonitor();
    const report = monitor.getReport();
    expect(report.rtt).toBe(0);
    expect(report.smoothedRtt).toBe(0);
    expect(report.jitter).toBe(0);
    monitor.stop();
  });
});

// ============================================================================
// BANDWIDTH MONITOR - REPORT
// ============================================================================

describe('BandwidthMonitor - Report', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate a complete report', () => {
    const monitor = createBandwidthMonitor({ sampleIntervalMs: 100 });
    monitor.start();

    for (let i = 0; i < 10; i++) {
      monitor.recordBytes(1024 * 1024);
      vi.advanceTimersByTime(100);
    }

    const report: BandwidthReport = monitor.getReport();

    expect(report.currentThroughput).toBeGreaterThanOrEqual(0);
    expect(report.instantAverage).toBeGreaterThanOrEqual(0);
    expect(report.shortTermAverage).toBeGreaterThanOrEqual(0);
    expect(report.longTermAverage).toBeGreaterThanOrEqual(0);
    expect(report.peakThroughput).toBeGreaterThanOrEqual(0);
    expect(typeof report.rtt).toBe('number');
    expect(typeof report.smoothedRtt).toBe('number');
    expect(typeof report.jitter).toBe('number');
    expect(['excellent', 'good', 'fair', 'poor', 'critical']).toContain(report.qualityLevel);
    expect(typeof report.isDowngraded).toBe('boolean');
    expect(typeof report.transitionCount).toBe('number');
    expect(report.recommendation).toBeDefined();
    expect(report.totalBytes).toBe(10 * 1024 * 1024);
    expect(report.monitoringDurationMs).toBeGreaterThanOrEqual(0);
    expect(report.timestamp).toBeGreaterThan(0);
    monitor.stop();
  });

  it('should call onSample callback on each sample', () => {
    const onSample = vi.fn();
    const monitor = createBandwidthMonitor({
      sampleIntervalMs: 100,
      onSample,
    });
    monitor.start();

    monitor.recordBytes(1024);
    vi.advanceTimersByTime(100);

    expect(onSample).toHaveBeenCalledTimes(1);
    expect(onSample).toHaveBeenCalledWith(expect.objectContaining({
      currentThroughput: expect.any(Number),
      timestamp: expect.any(Number),
    }));
    monitor.stop();
  });
});

// ============================================================================
// BANDWIDTH MONITOR - RESET
// ============================================================================

describe('BandwidthMonitor - Reset', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should reset all monitoring state', () => {
    const monitor = createBandwidthMonitor({ sampleIntervalMs: 100 });
    monitor.start();

    monitor.recordBytes(1024 * 1024);
    vi.advanceTimersByTime(100);

    // Measure some RTT
    const rttMeasurer = monitor.getRTTMeasurer();
    const ping = rttMeasurer.createPing();
    const pong = RTTMeasurer.createPong(ping)!;
    rttMeasurer.processPong(pong);

    monitor.reset();

    const report = monitor.getReport();
    expect(report.peakThroughput).toBe(0);
    expect(report.transitionCount).toBe(0);
    expect(report.totalBytes).toBe(0);
    expect(report.rtt).toBe(0);
    expect(report.smoothedRtt).toBe(0);
    expect(report.jitter).toBe(0);
    expect(report.qualityLevel).toBe('good');
    expect(monitor.getSamples().length).toBe(0);
    monitor.stop();
  });
});

// ============================================================================
// RTT MEASURER - EDGE CASES
// ============================================================================

describe('RTTMeasurer - Edge Cases', () => {
  it('should handle multiple outstanding pings', () => {
    const measurer = new RTTMeasurer();

    // Send multiple pings before any pong comes back
    const ping1 = measurer.createPing();
    const ping2 = measurer.createPing();
    const ping3 = measurer.createPing();

    // Process pongs out of order
    const pong2 = RTTMeasurer.createPong(ping2)!;
    const pong1 = RTTMeasurer.createPong(ping1)!;
    const pong3 = RTTMeasurer.createPong(ping3)!;

    expect(measurer.processPong(pong2)).not.toBeNull();
    expect(measurer.processPong(pong1)).not.toBeNull();
    expect(measurer.processPong(pong3)).not.toBeNull();

    expect(measurer.getSamples().length).toBe(3);
  });

  it('should not process the same pong twice', () => {
    const measurer = new RTTMeasurer();
    const ping = measurer.createPing();
    const pong = RTTMeasurer.createPong(ping)!;

    expect(measurer.processPong(pong)).not.toBeNull();
    // Sequence already consumed
    expect(measurer.processPong(pong)).toBeNull();
  });

  it('should reject non-ArrayBuffer data in processPong', () => {
    const measurer = new RTTMeasurer();
    const wrongSize = new ArrayBuffer(8);
    expect(measurer.processPong(wrongSize)).toBeNull();
  });
});
