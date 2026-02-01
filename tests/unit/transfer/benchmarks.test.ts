import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TransferBenchmark,
  formatThroughput,
  formatBytes,
  type BenchmarkStats,
} from '@/lib/transfer/benchmarks';

describe('TransferBenchmark', () => {
  let benchmark: TransferBenchmark;

  beforeEach(() => {
    benchmark = new TransferBenchmark({
      sampleInterval: 100, // Faster for testing
      windowSize: 10,
      rttInterval: 100,
      enableDetailedLogging: false,
    });
  });

  describe('Lifecycle', () => {
    it('should start and stop correctly', () => {
      expect(() => benchmark.start()).not.toThrow();
      expect(() => benchmark.stop()).not.toThrow();
    });

    it('should initialize stats', () => {
      benchmark.start();
      const stats = benchmark.getStats();

      expect(stats.totalBytes).toBe(0);
      expect(stats.sampleCount).toBe(0);
      expect(stats.avgThroughput).toBe(0);
    });

    it('should reset state on start', () => {
      benchmark.start();
      benchmark.recordBytes(1000);
      benchmark.stop();

      benchmark.start();
      const stats = benchmark.getStats();

      expect(stats.totalBytes).toBe(0);
    });
  });

  describe('Byte Recording', () => {
    it('should record bytes', async () => {
      benchmark.start();

      benchmark.recordBytes(1000);
      benchmark.recordBytes(2000);

      await new Promise((resolve) => setTimeout(resolve, 150)); // Wait for sample

      const stats = benchmark.getStats();
      expect(stats.totalBytes).toBe(3000);
    });

    it('should calculate throughput', async () => {
      benchmark.start();

      // Record 1MB per sample (100ms)
      for (let i = 0; i < 5; i++) {
        benchmark.recordBytes(1024 * 1024);
        await new Promise((resolve) => setTimeout(resolve, 110));
      }

      const stats = benchmark.getStats();

      // Should be approximately 10 MB/s (1MB / 0.1s)
      expect(stats.avgThroughput).toBeGreaterThan(5_000_000);
      expect(stats.avgThroughput).toBeLessThan(15_000_000);
    });

    it('should track peak throughput', async () => {
      benchmark.start();

      // Slow transfer
      benchmark.recordBytes(100_000);
      await new Promise((resolve) => setTimeout(resolve, 110));

      // Fast transfer
      benchmark.recordBytes(2_000_000);
      await new Promise((resolve) => setTimeout(resolve, 110));

      // Slow transfer
      benchmark.recordBytes(100_000);
      await new Promise((resolve) => setTimeout(resolve, 110));

      const stats = benchmark.getStats();

      expect(stats.peakThroughput).toBeGreaterThan(stats.avgThroughput);
      expect(stats.peakThroughput).toBeGreaterThan(10_000_000); // > 10 MB/s peak
    });
  });

  describe('RTT Recording', () => {
    it('should record RTT measurements', () => {
      benchmark.start();

      benchmark.recordRTT(10);
      benchmark.recordRTT(15);
      benchmark.recordRTT(12);

      const stats = benchmark.getStats();
      expect(stats.minRTT).toBeGreaterThan(0);
      expect(stats.avgRTT).toBeGreaterThan(0);
    });

    it('should calculate jitter', async () => {
      benchmark.start();

      // Record varying RTT
      const rtts = [10, 50, 15, 45, 20, 40];
      for (const rtt of rtts) {
        benchmark.recordRTT(rtt);
        benchmark.recordBytes(100_000);
        await new Promise((resolve) => setTimeout(resolve, 110));
      }

      const stats = benchmark.getStats();
      expect(stats.jitter).toBeGreaterThan(0);
      expect(stats.jitter).toBeGreaterThan(5); // Significant variance
    });

    it('should track min and max RTT', () => {
      benchmark.start();

      benchmark.recordRTT(20);
      benchmark.recordRTT(5);
      benchmark.recordRTT(50);
      benchmark.recordRTT(15);

      const stats = benchmark.getStats();
      expect(stats.minRTT).toBe(5);
      expect(stats.maxRTT).toBe(50);
    });
  });

  describe('Packet Loss', () => {
    it('should record packet loss', async () => {
      benchmark.start();

      benchmark.recordPacketLoss(0);
      benchmark.recordBytes(100_000);
      await new Promise((resolve) => setTimeout(resolve, 110));

      benchmark.recordPacketLoss(5);
      benchmark.recordBytes(100_000);
      await new Promise((resolve) => setTimeout(resolve, 110));

      const stats = benchmark.getStats();
      expect(stats.avgPacketLoss).toBeGreaterThan(0);
    });

    it('should track max packet loss', async () => {
      benchmark.start();

      for (let i = 0; i < 3; i++) {
        benchmark.recordPacketLoss(i * 2); // 0, 2, 4
        benchmark.recordBytes(100_000);
        await new Promise((resolve) => setTimeout(resolve, 110));
      }

      const stats = benchmark.getStats();
      expect(stats.maxPacketLoss).toBeGreaterThan(0);
    });
  });

  describe('Quality Score', () => {
    it('should give high score for excellent conditions', async () => {
      benchmark.start();

      // Excellent conditions
      for (let i = 0; i < 5; i++) {
        benchmark.recordBytes(1_000_000);
        benchmark.recordRTT(5);
        benchmark.recordPacketLoss(0);
        await new Promise((resolve) => setTimeout(resolve, 110));
      }

      const stats = benchmark.getStats();
      expect(stats.qualityScore).toBeGreaterThan(80);
    });

    it('should give low score for poor conditions', async () => {
      benchmark.start();

      // Poor conditions
      for (let i = 0; i < 5; i++) {
        benchmark.recordBytes(10_000);
        benchmark.recordRTT(300);
        benchmark.recordPacketLoss(10);
        await new Promise((resolve) => setTimeout(resolve, 110));
      }

      const stats = benchmark.getStats();
      expect(stats.qualityScore).toBeLessThan(50);
    });

    it('should penalize high jitter', async () => {
      benchmark.start();

      // High jitter
      const rtts = [10, 100, 10, 100, 10];
      for (const rtt of rtts) {
        benchmark.recordBytes(500_000);
        benchmark.recordRTT(rtt);
        benchmark.recordPacketLoss(0);
        await new Promise((resolve) => setTimeout(resolve, 110));
      }

      const stats = benchmark.getStats();
      expect(stats.qualityScore).toBeLessThan(90);
    });
  });

  describe('Bottleneck Detection', () => {
    it('should detect network bandwidth bottleneck', async () => {
      benchmark.start();

      // High packet loss
      for (let i = 0; i < 5; i++) {
        benchmark.recordBytes(100_000);
        benchmark.recordRTT(20);
        benchmark.recordPacketLoss(10);
        await new Promise((resolve) => setTimeout(resolve, 110));
      }

      const stats = benchmark.getStats();
      expect(stats.bottleneck).toBe('network-bandwidth');
      expect(stats.recommendation).toContain('congestion');
    });

    it('should detect network latency bottleneck', async () => {
      benchmark.start();

      // High latency
      for (let i = 0; i < 5; i++) {
        benchmark.recordBytes(500_000);
        benchmark.recordRTT(250);
        benchmark.recordPacketLoss(0);
        await new Promise((resolve) => setTimeout(resolve, 110));
      }

      const stats = benchmark.getStats();
      expect(stats.bottleneck).toBe('network-latency');
      expect(stats.recommendation).toContain('latency');
    });

    it('should detect no bottleneck for good performance', async () => {
      benchmark.start();

      // Good performance
      for (let i = 0; i < 5; i++) {
        benchmark.recordBytes(2_000_000);
        benchmark.recordRTT(10);
        benchmark.recordPacketLoss(0);
        await new Promise((resolve) => setTimeout(resolve, 110));
      }

      const stats = benchmark.getStats();
      expect(stats.bottleneck).toBe('none');
      expect(stats.recommendation).toContain('Excellent');
    });

    it('should detect backpressure bottleneck', async () => {
      benchmark.start();

      // Highly variable throughput (backpressure symptom)
      const bytes = [5_000_000, 100_000, 5_000_000, 100_000, 5_000_000];
      for (const b of bytes) {
        benchmark.recordBytes(b);
        benchmark.recordRTT(10);
        benchmark.recordPacketLoss(0);
        await new Promise((resolve) => setTimeout(resolve, 110));
      }

      const stats = benchmark.getStats();
      expect(stats.bottleneck).toBe('backpressure');
      expect(stats.recommendation).toContain('buffer');
    });
  });

  describe('Callbacks', () => {
    it('should trigger sample callback', async () => {
      const samples: any[] = [];

      benchmark.onSampleTaken((sample) => {
        samples.push(sample);
      });

      benchmark.start();

      benchmark.recordBytes(1_000_000);
      await new Promise((resolve) => setTimeout(resolve, 150));

      benchmark.recordBytes(1_000_000);
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(samples.length).toBeGreaterThan(0);
      expect(samples[0]).toHaveProperty('throughput');
      expect(samples[0]).toHaveProperty('timestamp');
    });

    it('should trigger stats update callback', async () => {
      let statsUpdates = 0;
      let lastStats: BenchmarkStats | null = null;

      benchmark.onStatsUpdated((stats) => {
        statsUpdates++;
        lastStats = stats;
      });

      benchmark.start();

      // Record enough samples to trigger update
      for (let i = 0; i < 5; i++) {
        benchmark.recordBytes(1_000_000);
        await new Promise((resolve) => setTimeout(resolve, 110));
      }

      expect(statsUpdates).toBeGreaterThan(0);
      expect(lastStats).not.toBeNull();
      expect(lastStats?.avgThroughput).toBeGreaterThan(0);
    });
  });

  describe('Window Management', () => {
    it('should maintain window size', async () => {
      benchmark = new TransferBenchmark({
        sampleInterval: 100,
        windowSize: 3,
      });

      benchmark.start();

      // Record more samples than window size
      for (let i = 0; i < 10; i++) {
        benchmark.recordBytes(100_000);
        await new Promise((resolve) => setTimeout(resolve, 110));
      }

      const samples = benchmark.getSamples();
      expect(samples.length).toBeLessThanOrEqual(3);
    });

    it('should use only recent samples for stats', async () => {
      benchmark = new TransferBenchmark({
        sampleInterval: 100,
        windowSize: 2,
      });

      benchmark.start();

      // Old samples (slow)
      benchmark.recordBytes(100_000);
      await new Promise((resolve) => setTimeout(resolve, 110));

      benchmark.recordBytes(100_000);
      await new Promise((resolve) => setTimeout(resolve, 110));

      // New samples (fast)
      benchmark.recordBytes(5_000_000);
      await new Promise((resolve) => setTimeout(resolve, 110));

      benchmark.recordBytes(5_000_000);
      await new Promise((resolve) => setTimeout(resolve, 110));

      const stats = benchmark.getStats();

      // Should reflect fast transfer, not slow
      expect(stats.avgThroughput).toBeGreaterThan(10_000_000);
    });
  });

  describe('Reset', () => {
    it('should reset all state', async () => {
      benchmark.start();

      benchmark.recordBytes(1_000_000);
      benchmark.recordRTT(50);
      benchmark.recordPacketLoss(5);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(benchmark.getStats().totalBytes).toBeGreaterThan(0);

      benchmark.reset();

      const stats = benchmark.getStats();
      expect(stats.totalBytes).toBe(0);
      expect(stats.sampleCount).toBe(0);
      expect(stats.avgThroughput).toBe(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('formatThroughput', () => {
    it('should format Kbps', () => {
      const result = formatThroughput(100_000); // 0.8 Mbps
      expect(result).toContain('Kbps');
    });

    it('should format Mbps', () => {
      const result = formatThroughput(25_000_000); // 200 Mbps
      expect(result).toContain('Mbps');
      expect(result).toContain('200');
    });

    it('should format Gbps', () => {
      const result = formatThroughput(250_000_000); // 2 Gbps
      expect(result).toContain('Gbps');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(500)).toContain('B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toContain('KB');
      expect(formatBytes(1024 * 10)).toContain('KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toContain('MB');
      expect(formatBytes(1024 * 1024 * 50)).toContain('MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toContain('GB');
    });
  });
});
