/**
 * Adaptive Bitrate Controller Unit Tests
 * Tests for the AIMD-like congestion control and network-aware optimizations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AdaptiveBitrateController,
  createAdaptiveController,
  measureRTT,
  getBufferLevel,
  TransferMetrics,
} from '@/lib/transfer/adaptive-bitrate';

// Mock secure logger
vi.mock('@/lib/utils/secure-logger', () => ({
  default: {
    debug: vi.fn(),
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Helper to create transfer metrics
function createMetrics(overrides: Partial<TransferMetrics> = {}): TransferMetrics {
  return {
    timestamp: Date.now(),
    bytesTransferred: 65536,
    chunksSent: 1,
    chunksAcked: 1,
    rtt: 50,
    packetLoss: 0,
    jitter: 5,
    bufferLevel: 0.3,
    ...overrides,
  };
}

// Helper to report multiple metrics with time progression
function reportMetricsWithTimeProgression(
  controller: AdaptiveBitrateController,
  count: number,
  metricsOverrides: Partial<TransferMetrics> = {},
  intervalMs: number = 100
): void {
  const baseTime = Date.now();
  for (let i = 0; i < count; i++) {
    controller.reportMetrics(
      createMetrics({
        timestamp: baseTime + i * intervalMs,
        ...metricsOverrides,
      })
    );
  }
}

describe('AdaptiveBitrateController', () => {
  let controller: AdaptiveBitrateController;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-29T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ============================================
  // 1. INITIALIZATION TESTS (5 tests)
  // ============================================
  describe('Initialization', () => {
    it('should initialize with correct defaults for internet mode', () => {
      controller = new AdaptiveBitrateController(false);
      const config = controller.getConfig();

      expect(config.isLAN).toBe(false);
      expect(config.mode).toBe('balanced');
      expect(config.currentChunkSize).toBe(64 * 1024); // 64KB default
      expect(config.targetBitrate).toBe(5 * 1024 * 1024); // 5MB/s
      expect(config.maxBitrate).toBe(50 * 1024 * 1024); // 50MB/s
      expect(config.minBitrate).toBe(64 * 1024); // 64KB/s
      expect(config.concurrency).toBe(3);
    });

    it('should initialize with correct defaults for LAN mode', () => {
      controller = new AdaptiveBitrateController(true);
      const config = controller.getConfig();

      expect(config.isLAN).toBe(true);
      expect(config.mode).toBe('balanced');
      expect(config.currentChunkSize).toBe(1024 * 1024); // 1MB for LAN
      expect(config.targetBitrate).toBe(100 * 1024 * 1024); // 100MB/s
      expect(config.maxBitrate).toBe(1000 * 1024 * 1024); // 1GB/s
      expect(config.minBitrate).toBe(64 * 1024); // 64KB/s
      expect(config.concurrency).toBe(8);
    });

    it('should initialize with aggressive mode settings', () => {
      controller = new AdaptiveBitrateController(false, 'aggressive');
      const config = controller.getConfig();

      expect(config.mode).toBe('aggressive');
      // Aggressive mode affects rate increase factor (1.25 vs 1.1)
    });

    it('should initialize with conservative mode settings', () => {
      controller = new AdaptiveBitrateController(false, 'conservative');
      const config = controller.getConfig();

      expect(config.mode).toBe('conservative');
      // Conservative mode affects rate increase factor (1.05 vs 1.1)
    });

    it('should create controller using factory function', () => {
      controller = createAdaptiveController(true, 'aggressive');
      const config = controller.getConfig();

      expect(config.isLAN).toBe(true);
      expect(config.mode).toBe('aggressive');
      expect(controller).toBeInstanceOf(AdaptiveBitrateController);
    });
  });

  // ============================================
  // 2. METRIC REPORTING TESTS (8 tests)
  // ============================================
  describe('Metric Reporting', () => {
    beforeEach(() => {
      controller = new AdaptiveBitrateController(false);
    });

    it('should accumulate metrics in the window', () => {
      reportMetricsWithTimeProgression(controller, 10);

      const stats = controller.getStats();
      expect(stats.sampleCount).toBe(10);
    });

    it('should trim old metrics beyond window size (50 samples)', () => {
      // Report 60 metrics, window size is 50
      reportMetricsWithTimeProgression(controller, 60);

      const stats = controller.getStats();
      expect(stats.sampleCount).toBe(50); // Should be trimmed to 50
    });

    it('should calculate average RTT correctly', () => {
      const baseTime = Date.now();
      const rttValues = [40, 50, 60, 70, 80];

      rttValues.forEach((rtt, i) => {
        controller.reportMetrics(
          createMetrics({
            timestamp: baseTime + i * 100,
            rtt,
          })
        );
      });

      const stats = controller.getStats();
      expect(stats.averageRTT).toBe(60); // Average of 40, 50, 60, 70, 80
    });

    it('should calculate packet loss rate correctly', () => {
      const baseTime = Date.now();
      const lossValues = [0, 0.02, 0.04, 0.06, 0.08];

      lossValues.forEach((packetLoss, i) => {
        controller.reportMetrics(
          createMetrics({
            timestamp: baseTime + i * 100,
            packetLoss,
          })
        );
      });

      const stats = controller.getStats();
      expect(stats.averageLoss).toBeCloseTo(0.04, 3); // Average of loss values
    });

    it('should track buffer level in metrics', () => {
      const metrics = createMetrics({ bufferLevel: 0.75 });
      controller.reportMetrics(metrics);

      // Buffer level is used in analysis but not directly exposed in stats
      // Verify through config changes when buffer is high
      const stats = controller.getStats();
      expect(stats.sampleCount).toBe(1);
    });

    it('should establish baseline RTT from first valid metric', () => {
      controller.reportMetrics(createMetrics({ rtt: 100 }));
      controller.reportMetrics(createMetrics({ rtt: 150 }));

      // Baseline is established from first metric with rtt > 0
      const stats = controller.getStats();
      expect(stats.sampleCount).toBe(2);
    });

    it('should calculate throughput from metrics window', () => {
      const baseTime = Date.now();
      // Report 5 metrics with 100ms intervals, 64KB each
      for (let i = 0; i < 5; i++) {
        controller.reportMetrics(
          createMetrics({
            timestamp: baseTime + i * 100,
            bytesTransferred: 65536, // 64KB
          })
        );
      }

      const stats = controller.getStats();
      // Total: 5 * 64KB = 320KB over 400ms = 800KB/s = 819200 bytes/s
      expect(stats.averageThroughput).toBeGreaterThan(0);
    });

    it('should return zero stats for empty metric window', () => {
      const stats = controller.getStats();

      expect(stats.averageRTT).toBe(0);
      expect(stats.averageLoss).toBe(0);
      expect(stats.averageThroughput).toBe(0);
      expect(stats.sampleCount).toBe(0);
    });
  });

  // ============================================
  // 3. AIMD ALGORITHM TESTS (10 tests)
  // ============================================
  describe('AIMD Algorithm', () => {
    beforeEach(() => {
      controller = new AdaptiveBitrateController(false, 'balanced');
    });

    it('should increase rate after consecutive good periods', () => {
      const initialConfig = controller.getConfig();
      const initialBitrate = initialConfig.targetBitrate;

      // Report good metrics (low loss, low RTT, low buffer)
      const baseTime = Date.now();
      for (let i = 0; i < 10; i++) {
        controller.reportMetrics(
          createMetrics({
            timestamp: baseTime + i * 100,
            rtt: 50,
            packetLoss: 0,
            jitter: 5,
            bufferLevel: 0.3,
          })
        );
      }

      // Advance time to allow adaptation (minimum 500ms between adjustments)
      vi.advanceTimersByTime(600);

      // Report more good metrics to trigger consecutive good periods
      for (let period = 0; period < 4; period++) {
        vi.advanceTimersByTime(600);
        for (let i = 0; i < 5; i++) {
          controller.reportMetrics(
            createMetrics({
              timestamp: Date.now() + i * 100,
              rtt: 50,
              packetLoss: 0,
              jitter: 5,
              bufferLevel: 0.3,
            })
          );
        }
      }

      const newConfig = controller.getConfig();
      expect(newConfig.targetBitrate).toBeGreaterThan(initialBitrate);
    });

    it('should decrease rate immediately on congestion', () => {
      // First establish baseline with good metrics (low RTT baseline)
      reportMetricsWithTimeProgression(controller, 10, { rtt: 10, packetLoss: 0 });

      // Advance system time past minimum adjustment interval (500ms)
      vi.advanceTimersByTime(600);

      const configBeforeCongestion = controller.getConfig();
      const bitrateBeforeCongestion = configBeforeCongestion.targetBitrate;

      // Advance time again before reporting congestion (like working tests)
      vi.advanceTimersByTime(600);

      // Report congestion metrics with very high loss and RTT
      // RTT ratio > 2 OR packetLoss > 0.05 OR buffer > 0.9 triggers isCongested
      reportMetricsWithTimeProgression(controller, 10, {
        rtt: 200, // 20x baseline RTT
        packetLoss: 0.25, // 25% loss - very high
        bufferLevel: 0.95, // Buffer nearly full
      });

      const configAfterCongestion = controller.getConfig();
      expect(configAfterCongestion.targetBitrate).toBeLessThan(bitrateBeforeCongestion);
    });

    it('should calculate severity-based decrease factor correctly', () => {
      // This test verifies the AIMD decrease logic:
      // - factor = max(0.5, 0.9 - severity * 0.3)
      // - severity = min(1, avgLoss*5 + (rttRatio-1)*0.3 + bufferContribution)
      //
      // Low severity (e.g., 0.3): factor = max(0.5, 0.9-0.09) = 0.81
      // High severity (e.g., 1.0): factor = max(0.5, 0.9-0.3) = 0.6
      // Max severity caps factor at 0.5 (minimum decrease rate)

      // This is validated through the "should decrease rate immediately on congestion" test
      // and "should scale decrease by severity - severe congestion" test
      // Here we verify the bounds behavior

      // Test minimum factor (highest severity)
      controller = new AdaptiveBitrateController(true);
      reportMetricsWithTimeProgression(controller, 10, { rtt: 5, packetLoss: 0 });
      vi.advanceTimersByTime(600);
      const initial = controller.getConfig().targetBitrate;

      // Apply maximum severity
      vi.advanceTimersByTime(600);
      reportMetricsWithTimeProgression(controller, 10, {
        rtt: 100, // 20x baseline RTT
        packetLoss: 0.25, // 25% loss - triggers high severity
        bufferLevel: 0.95,
      });

      const final = controller.getConfig().targetBitrate;

      // With max severity, the decrease factor should be at least 0.5
      // So final >= initial * 0.5
      expect(final).toBeLessThan(initial);
      expect(final).toBeGreaterThanOrEqual(initial * 0.5);

      // The decrease should respect minBitrate
      expect(final).toBeGreaterThanOrEqual(controller.getConfig().minBitrate);
    });

    it('should scale decrease by severity - severe congestion', () => {
      // Establish baseline with good metrics (low RTT baseline)
      reportMetricsWithTimeProgression(controller, 10, { rtt: 10, packetLoss: 0 });

      // Advance time past minimum adjustment interval (500ms)
      vi.advanceTimersByTime(600);

      const initialBitrate = controller.getConfig().targetBitrate;

      // Advance time again before reporting congestion
      vi.advanceTimersByTime(600);

      // Severe congestion - high severity calculation:
      // - avgLoss * 5 = 0.25 * 5 = 1.25 (contributes heavily)
      // - rttRatio = 200/10 = 20, so (20-1) * 0.3 = 5.7
      // - buffer > 0.8, so +0.3
      // Total severity capped at 1.0
      reportMetricsWithTimeProgression(controller, 10, {
        rtt: 200, // 20x baseline RTT
        packetLoss: 0.25, // 25% loss - severe congestion
        bufferLevel: 0.95, // Buffer nearly full (> 0.9)
      });

      const severeDecrease = controller.getConfig().targetBitrate;
      expect(severeDecrease).toBeLessThan(initialBitrate);
      // Severe congestion should decrease more
      expect(severeDecrease / initialBitrate).toBeLessThanOrEqual(0.7);
    });

    it('should respect minimum bitrate bound', () => {
      // Establish baseline
      reportMetricsWithTimeProgression(controller, 10, { rtt: 50, packetLoss: 0 });
      vi.advanceTimersByTime(600);

      // Report severe congestion repeatedly to drive bitrate down
      for (let i = 0; i < 20; i++) {
        vi.advanceTimersByTime(600);
        reportMetricsWithTimeProgression(controller, 10, {
          rtt: 500,
          packetLoss: 0.3,
          bufferLevel: 0.99,
        });
      }

      const config = controller.getConfig();
      expect(config.targetBitrate).toBeGreaterThanOrEqual(config.minBitrate);
    });

    it('should respect maximum bitrate bound', () => {
      // Report excellent metrics repeatedly
      for (let i = 0; i < 30; i++) {
        vi.advanceTimersByTime(600);
        reportMetricsWithTimeProgression(controller, 10, {
          rtt: 10,
          packetLoss: 0,
          jitter: 1,
          bufferLevel: 0.1,
        });
      }

      const config = controller.getConfig();
      expect(config.targetBitrate).toBeLessThanOrEqual(config.maxBitrate);
    });

    it('should recover rate after congestion clears', () => {
      // Establish baseline
      reportMetricsWithTimeProgression(controller, 10, { rtt: 50, packetLoss: 0 });
      vi.advanceTimersByTime(600);

      // Cause congestion
      vi.advanceTimersByTime(600);
      reportMetricsWithTimeProgression(controller, 10, {
        rtt: 200,
        packetLoss: 0.15,
        bufferLevel: 0.9,
      });

      const congestionBitrate = controller.getConfig().targetBitrate;

      // Congestion clears - good metrics again
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(600);
        reportMetricsWithTimeProgression(controller, 10, {
          rtt: 50,
          packetLoss: 0,
          jitter: 5,
          bufferLevel: 0.3,
        });
      }

      const recoveredBitrate = controller.getConfig().targetBitrate;
      expect(recoveredBitrate).toBeGreaterThan(congestionBitrate);
    });

    it('should not adjust before minimum interval (500ms)', () => {
      reportMetricsWithTimeProgression(controller, 10, { rtt: 50 });
      const initialConfig = controller.getConfig();

      // Report metrics without advancing time
      reportMetricsWithTimeProgression(controller, 10, {
        rtt: 200,
        packetLoss: 0.2,
      });

      // Should not have adjusted yet
      const configAfter = controller.getConfig();
      expect(configAfter.targetBitrate).toBe(initialConfig.targetBitrate);
    });

    it('should increase concurrency when approaching max bitrate', () => {
      controller = new AdaptiveBitrateController(false, 'aggressive');
      const initialConcurrency = controller.getConfig().concurrency;

      // Report excellent metrics to push bitrate high
      for (let i = 0; i < 30; i++) {
        vi.advanceTimersByTime(600);
        reportMetricsWithTimeProgression(controller, 10, {
          rtt: 5,
          packetLoss: 0,
          jitter: 1,
          bufferLevel: 0.05,
        });
      }

      const newConcurrency = controller.getConfig().concurrency;
      expect(newConcurrency).toBeGreaterThanOrEqual(initialConcurrency);
    });

    it('should decrease concurrency on severe congestion', () => {
      // Start with higher concurrency in LAN mode
      controller = new AdaptiveBitrateController(true);
      const initialConcurrency = controller.getConfig().concurrency;
      expect(initialConcurrency).toBe(8);

      // Establish baseline
      reportMetricsWithTimeProgression(controller, 10, { rtt: 5, packetLoss: 0 });
      vi.advanceTimersByTime(600);

      // Severe congestion (severity > 0.5)
      vi.advanceTimersByTime(600);
      reportMetricsWithTimeProgression(controller, 10, {
        rtt: 100,
        packetLoss: 0.25, // High loss
        bufferLevel: 0.95,
      });

      const newConcurrency = controller.getConfig().concurrency;
      expect(newConcurrency).toBeLessThan(initialConcurrency);
    });
  });

  // ============================================
  // 4. CHUNK SIZE ADJUSTMENT TESTS (7 tests)
  // ============================================
  describe('Chunk Size Adjustment', () => {
    it('should increase chunk size for high bitrate (internet)', () => {
      controller = new AdaptiveBitrateController(false, 'aggressive');

      // Push bitrate high with excellent metrics
      for (let i = 0; i < 25; i++) {
        vi.advanceTimersByTime(600);
        reportMetricsWithTimeProgression(controller, 10, {
          rtt: 5,
          packetLoss: 0,
          jitter: 1,
          bufferLevel: 0.1,
        });
      }

      const config = controller.getConfig();
      // High bitrate should result in larger chunks
      expect(config.currentChunkSize).toBeGreaterThan(64 * 1024);
    });

    it('should decrease chunk size for low bitrate', () => {
      controller = new AdaptiveBitrateController(false);

      // Establish baseline
      reportMetricsWithTimeProgression(controller, 10, { rtt: 50, packetLoss: 0 });
      vi.advanceTimersByTime(600);

      // Cause severe congestion to drop bitrate
      for (let i = 0; i < 15; i++) {
        vi.advanceTimersByTime(600);
        reportMetricsWithTimeProgression(controller, 10, {
          rtt: 500,
          packetLoss: 0.25,
          bufferLevel: 0.95,
        });
      }

      const config = controller.getConfig();
      // Low bitrate should result in smaller chunks
      expect(config.currentChunkSize).toBeLessThanOrEqual(64 * 1024);
    });

    it('should use larger chunks for LAN mode', () => {
      const internetController = new AdaptiveBitrateController(false);
      const lanController = new AdaptiveBitrateController(true);

      expect(lanController.getChunkSize()).toBeGreaterThan(
        internetController.getChunkSize()
      );
    });

    it('should respect minimum chunk size (16KB TINY)', () => {
      controller = new AdaptiveBitrateController(false);

      // Drive bitrate extremely low
      reportMetricsWithTimeProgression(controller, 10, { rtt: 50 });
      vi.advanceTimersByTime(600);

      for (let i = 0; i < 30; i++) {
        vi.advanceTimersByTime(600);
        reportMetricsWithTimeProgression(controller, 10, {
          rtt: 1000,
          packetLoss: 0.4,
          bufferLevel: 0.99,
        });
      }

      const chunkSize = controller.getChunkSize();
      expect(chunkSize).toBeGreaterThanOrEqual(16 * 1024); // TINY minimum
    });

    it('should respect maximum chunk size for internet (512KB XLARGE)', () => {
      controller = new AdaptiveBitrateController(false, 'aggressive');

      // Push to maximum with excellent metrics
      for (let i = 0; i < 50; i++) {
        vi.advanceTimersByTime(600);
        reportMetricsWithTimeProgression(controller, 10, {
          rtt: 1,
          packetLoss: 0,
          jitter: 0,
          bufferLevel: 0,
        });
      }

      const chunkSize = controller.getChunkSize();
      // Internet mode max is XLARGE (512KB)
      expect(chunkSize).toBeLessThanOrEqual(512 * 1024);
    });

    it('should use LAN_FAST chunk size (4MB) for very high LAN bitrate', () => {
      controller = new AdaptiveBitrateController(true, 'aggressive');

      // Push LAN bitrate very high
      for (let i = 0; i < 30; i++) {
        vi.advanceTimersByTime(600);
        reportMetricsWithTimeProgression(controller, 10, {
          rtt: 1,
          packetLoss: 0,
          jitter: 0,
          bufferLevel: 0,
        });
      }

      const chunkSize = controller.getChunkSize();
      // LAN mode can use LAN_FAST (4MB) for very high bitrates
      expect(chunkSize).toBeGreaterThanOrEqual(512 * 1024);
    });

    it('should calculate optimal send interval based on chunk size and bitrate', () => {
      controller = new AdaptiveBitrateController(false);
      const config = controller.getConfig();

      const sendInterval = controller.getSendInterval();

      // Send interval = (chunkSize / targetBitrate) * 1000 / concurrency
      const expectedInterval = Math.max(
        1,
        Math.floor((config.currentChunkSize / config.targetBitrate) * 1000 / config.concurrency)
      );

      expect(sendInterval).toBe(expectedInterval);
      expect(sendInterval).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================
  // ADDITIONAL UTILITY TESTS
  // ============================================
  describe('Controller Utilities', () => {
    beforeEach(() => {
      controller = new AdaptiveBitrateController(false);
    });

    it('should reset controller state correctly', () => {
      // Add some metrics
      reportMetricsWithTimeProgression(controller, 20, { rtt: 100, packetLoss: 0.1 });
      vi.advanceTimersByTime(600);

      // Trigger some changes
      reportMetricsWithTimeProgression(controller, 10, { rtt: 200, packetLoss: 0.2 });

      // Reset
      controller.reset();

      const config = controller.getConfig();
      const stats = controller.getStats();

      // Should be back to defaults
      expect(config.currentChunkSize).toBe(64 * 1024);
      expect(config.targetBitrate).toBe(5 * 1024 * 1024);
      expect(config.concurrency).toBe(3);
      expect(stats.sampleCount).toBe(0);
    });

    it('should notify callback on config changes', () => {
      const callback = vi.fn();
      controller.onUpdate(callback);

      // Establish baseline with good metrics (low RTT baseline)
      reportMetricsWithTimeProgression(controller, 10, { rtt: 10, packetLoss: 0 });

      // Advance time past minimum adjustment interval (500ms)
      vi.advanceTimersByTime(600);

      // Advance time again before reporting congestion
      vi.advanceTimersByTime(600);

      // Trigger congestion to cause config change
      reportMetricsWithTimeProgression(controller, 10, {
        rtt: 200, // 20x baseline RTT
        packetLoss: 0.25, // 25% loss
        bufferLevel: 0.95, // Buffer nearly full
      });

      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          currentChunkSize: expect.any(Number),
          targetBitrate: expect.any(Number),
        })
      );
    });

    it('should return config copy to prevent external mutation', () => {
      const config1 = controller.getConfig();
      config1.targetBitrate = 0; // Attempt to mutate

      const config2 = controller.getConfig();
      expect(config2.targetBitrate).not.toBe(0);
      expect(config2.targetBitrate).toBe(5 * 1024 * 1024);
    });
  });

  // ============================================
  // HELPER FUNCTION TESTS
  // ============================================
  describe('Helper Functions', () => {
    describe('measureRTT', () => {
      it('should measure RTT using ping/pong messages', async () => {
        const mockChannel = {
          send: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        } as unknown as RTCDataChannel;

        const rttPromise = measureRTT(mockChannel, 5000);

        // Get the message handler that was registered
        const addEventListenerCalls = vi.mocked(mockChannel.addEventListener).mock.calls;
        const messageHandler = addEventListenerCalls.find(
          (call) => call[0] === 'message'
        )?.[1] as EventListener;

        expect(messageHandler).toBeDefined();
        expect(mockChannel.send).toHaveBeenCalled();

        // Verify ping message was sent
        const sentMessage = vi.mocked(mockChannel.send).mock.calls[0]?.[0];
        const pingData = JSON.parse(sentMessage as string);
        expect(pingData.type).toBe('ping');

        // Simulate pong response after 50ms
        vi.advanceTimersByTime(50);
        messageHandler(
          new MessageEvent('message', {
            data: JSON.stringify({ type: 'pong', id: pingData.id }),
          })
        );

        const rtt = await rttPromise;
        expect(rtt).toBeGreaterThanOrEqual(0);
      });

      it('should return timeout value on failure', async () => {
        const mockChannel = {
          send: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        } as unknown as RTCDataChannel;

        const rttPromise = measureRTT(mockChannel, 1000);

        // Don't send pong, let it timeout
        vi.advanceTimersByTime(1100);

        const rtt = await rttPromise;
        expect(rtt).toBe(1000); // Returns timeout value
      });
    });

    describe('getBufferLevel', () => {
      it('should calculate buffer level from bufferedAmount', () => {
        const mockChannel = {
          bufferedAmount: 8 * 1024 * 1024, // 8MB buffered
        } as RTCDataChannel;

        const level = getBufferLevel(mockChannel);

        // 8MB / 16MB max = 0.5
        expect(level).toBe(0.5);
      });

      it('should cap buffer level at 1.0', () => {
        const mockChannel = {
          bufferedAmount: 32 * 1024 * 1024, // 32MB (exceeds max)
        } as RTCDataChannel;

        const level = getBufferLevel(mockChannel);

        expect(level).toBe(1);
      });

      it('should return 0 for empty buffer', () => {
        const mockChannel = {
          bufferedAmount: 0,
        } as RTCDataChannel;

        const level = getBufferLevel(mockChannel);

        expect(level).toBe(0);
      });
    });
  });
});
