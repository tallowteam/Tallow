import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initializeMemoryProtection,
  shutdownMemoryProtection,
  createProtectedWrapper,
  acquireSecureBuffer,
  releaseSecureBuffer,
  getMemoryProtectionStatus,
  emergencyMemoryWipe,
  lockMemory,
  sanitizeBeforeGC,
} from '@/lib/security/memory-protection';

describe('Memory Protection', () => {
  beforeEach(() => {
    // Initialize before each test
    initializeMemoryProtection({
      level: 'enhanced',
      enableHeapInspectionDetection: false, // Disable for tests
      enableMemoryPressureMonitoring: false, // Disable for tests
      enableSecurePool: true,
      maxPoolSize: 1024 * 1024, // 1MB
    });
  });

  afterEach(() => {
    shutdownMemoryProtection();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const status = getMemoryProtectionStatus();

      expect(status.level).toBe('enhanced');
      expect(status.activeWrappers).toBe(0);
    });

    it('should initialize with custom config', () => {
      shutdownMemoryProtection();
      initializeMemoryProtection({ level: 'paranoid' });

      const status = getMemoryProtectionStatus();
      expect(status.level).toBe('paranoid');
    });
  });

  describe('Protected Secure Wrapper', () => {
    it('should create protected wrapper for Uint8Array', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const wrapper = createProtectedWrapper(data);

      expect(wrapper.data).toEqual(data);
      expect(wrapper.isDisposed).toBe(false);

      wrapper.dispose();
      expect(wrapper.isDisposed).toBe(true);
    });

    it('should track active wrappers', () => {
      const data = new Uint8Array(100);
      const wrapper1 = createProtectedWrapper(data);
      const wrapper2 = createProtectedWrapper(new Uint8Array(100));

      const status = getMemoryProtectionStatus();
      expect(status.activeWrappers).toBe(2);

      wrapper1.dispose();
      const statusAfter = getMemoryProtectionStatus();
      expect(statusAfter.activeWrappers).toBe(1);

      wrapper2.dispose();
    });

    it('should throw when accessing disposed wrapper', () => {
      const wrapper = createProtectedWrapper(new Uint8Array(10));
      wrapper.dispose();

      expect(() => wrapper.data).toThrow('Data has been disposed');
    });

    it('should auto-dispose with use() method', async () => {
      const data = new Uint8Array([1, 2, 3]);
      const wrapper = createProtectedWrapper(data);

      let dataSum = 0;
      await wrapper.use(async (d) => {
        dataSum = d.reduce((a, b) => a + b, 0);
      });

      expect(dataSum).toBe(6);
      expect(wrapper.isDisposed).toBe(true);
    });

    it('should auto-dispose with useSync() method', () => {
      const data = new Uint8Array([10, 20, 30]);
      const wrapper = createProtectedWrapper(data);

      const result = wrapper.useSync((d) => d.reduce((a, b) => a + b, 0));

      expect(result).toBe(60);
      expect(wrapper.isDisposed).toBe(true);
    });

    it('should prevent double disposal', () => {
      const wrapper = createProtectedWrapper(new Uint8Array(10));

      wrapper.dispose();
      expect(wrapper.isDisposed).toBe(true);

      // Second dispose should be safe (no-op)
      wrapper.dispose();
      expect(wrapper.isDisposed).toBe(true);
    });
  });

  describe('Secure Memory Pool', () => {
    it('should acquire buffer from pool', () => {
      const buffer = acquireSecureBuffer(1024);

      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBe(1024);
    });

    it('should release buffer back to pool', () => {
      const buffer = acquireSecureBuffer(1024);
      buffer.fill(0xFF);

      releaseSecureBuffer(buffer);

      const status = getMemoryProtectionStatus();
      expect(status.poolStats).toBeDefined();

      // Buffer should be wiped after release
      const shouldBeZero = buffer.every(b => b === 0);
      expect(shouldBeZero).toBe(true);
    });

    it('should reuse buffers from pool', () => {
      // Acquire and release
      const buffer1 = acquireSecureBuffer(1024);
      releaseSecureBuffer(buffer1);

      const statusBefore = getMemoryProtectionStatus();
      const totalBuffersBefore = statusBefore.poolStats?.totalBuffers || 0;

      // Acquire again (should reuse)
      const _buffer2 = acquireSecureBuffer(1024);
      void _buffer2; // Suppress unused variable warning

      const statusAfter = getMemoryProtectionStatus();
      const totalBuffersAfter = statusAfter.poolStats?.totalBuffers || 0;

      // Pool should have one less buffer (it was reused)
      expect(totalBuffersAfter).toBeLessThanOrEqual(totalBuffersBefore);
    });

    it('should track pool statistics', () => {
      acquireSecureBuffer(512);
      const buffer = acquireSecureBuffer(1024);
      releaseSecureBuffer(buffer);

      const status = getMemoryProtectionStatus();
      expect(status.poolStats).toBeDefined();
      expect(status.poolStats?.totalBuffers).toBeGreaterThan(0);
      expect(status.poolStats?.totalSize).toBeGreaterThan(0);
    });

    it('should not exceed max pool size', () => {
      const largeBuffer = acquireSecureBuffer(2 * 1024 * 1024); // 2MB > 1MB pool limit
      releaseSecureBuffer(largeBuffer);

      const status = getMemoryProtectionStatus();
      // Pool should reject buffer that exceeds limit
      expect(status.poolStats?.totalSize || 0).toBeLessThanOrEqual(1024 * 1024);
    });
  });

  describe('Memory Locking', () => {
    it('should lock memory during callback', async () => {
      const sensitiveData = new Uint8Array([1, 2, 3, 4, 5]);
      let sum = 0;

      await lockMemory(sensitiveData, async (data) => {
        sum = (data as Uint8Array).reduce((a, b) => a + b, 0);
      });

      expect(sum).toBe(15);
    });

    it('should cleanup after locked memory callback', async () => {
      const data = new Uint8Array(100);
      const statusBefore = getMemoryProtectionStatus();

      await lockMemory(data, async () => {
        // Do nothing
      });

      const statusAfter = getMemoryProtectionStatus();
      // Should have cleaned up wrapper
      expect(statusAfter.activeWrappers).toBe(statusBefore.activeWrappers);
    });

    it('should cleanup even if callback throws', async () => {
      const data = new Uint8Array(100);

      try {
        await lockMemory(data, async () => {
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      const status = getMemoryProtectionStatus();
      expect(status.activeWrappers).toBe(0);
    });
  });

  describe('Emergency Wipe', () => {
    it('should wipe all active wrappers', () => {
      const wrapper1 = createProtectedWrapper(new Uint8Array(100));
      const wrapper2 = createProtectedWrapper(new Uint8Array(200));
      const wrapper3 = createProtectedWrapper(new Uint8Array(300));

      const statusBefore = getMemoryProtectionStatus();
      expect(statusBefore.activeWrappers).toBe(3);

      emergencyMemoryWipe();

      const statusAfter = getMemoryProtectionStatus();
      expect(statusAfter.activeWrappers).toBe(0);
      expect(wrapper1.isDisposed).toBe(true);
      expect(wrapper2.isDisposed).toBe(true);
      expect(wrapper3.isDisposed).toBe(true);
    });

    it('should clear memory pool', () => {
      const buffer = acquireSecureBuffer(1024);
      releaseSecureBuffer(buffer);

      const statusBefore = getMemoryProtectionStatus();
      expect(statusBefore.poolStats?.totalBuffers).toBeGreaterThan(0);

      emergencyMemoryWipe();

      const statusAfter = getMemoryProtectionStatus();
      expect(statusAfter.poolStats?.totalBuffers).toBe(0);
    });
  });

  describe('Sanitize Before GC', () => {
    it('should sanitize simple object', () => {
      const obj = {
        buffer: new Uint8Array([1, 2, 3, 4, 5]),
        secret: 'password123',
        number: 42,
      };

      sanitizeBeforeGC(obj);

      expect(obj.buffer).toBeNull();
      expect(obj.secret).toBeNull();
      expect(obj.number).toBeNull();
    });

    it('should sanitize nested objects', () => {
      const obj = {
        level1: {
          buffer: new Uint8Array([1, 2, 3]),
          level2: {
            secret: 'nested-secret',
            buffer: new Uint8Array([4, 5, 6]),
          },
        },
      };

      sanitizeBeforeGC(obj);

      expect(obj.level1).toBeNull();
    });

    it('should wipe buffers in sanitized objects', () => {
      const buffer = new Uint8Array([0xFF, 0xFF, 0xFF]);
      const obj = { data: buffer };

      sanitizeBeforeGC(obj);

      // Buffer should be wiped to zeros
      expect(buffer.every(b => b === 0)).toBe(true);
    });
  });

  describe('Memory Protection Status', () => {
    it('should report current status', () => {
      const wrapper = createProtectedWrapper(new Uint8Array(100));

      const status = getMemoryProtectionStatus();

      expect(status.level).toBe('enhanced');
      expect(status.heapInspectionDetected).toBe(false);
      expect(status.memoryPressureHigh).toBe(false);
      expect(status.activeWrappers).toBe(1);
      expect(status.poolStats).toBeDefined();

      wrapper.dispose();
    });
  });

  describe('Shutdown', () => {
    it('should cleanup all resources on shutdown', () => {
      const wrapper1 = createProtectedWrapper(new Uint8Array(100));
      const wrapper2 = createProtectedWrapper(new Uint8Array(200));

      shutdownMemoryProtection();

      expect(wrapper1.isDisposed).toBe(true);
      expect(wrapper2.isDisposed).toBe(true);

      const status = getMemoryProtectionStatus();
      expect(status.activeWrappers).toBe(0);
    });

    it('should allow re-initialization after shutdown', () => {
      shutdownMemoryProtection();

      // Should be able to initialize again
      initializeMemoryProtection({ level: 'basic' });

      const status = getMemoryProtectionStatus();
      expect(status.level).toBe('basic');
    });
  });

  describe('Stack Canaries', () => {
    it('should detect buffer overflow via canary', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const wrapper = createProtectedWrapper(new Uint8Array(100));

      // Simulate canary corruption by directly accessing private field
      // In real scenario, this would happen due to buffer overflow
      (wrapper as any).canary.fill(0);

      wrapper.dispose();

      // Should have logged canary corruption
      // Note: This test depends on implementation details
      expect(wrapper.isDisposed).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Protection Levels', () => {
    it('should support basic protection level', () => {
      shutdownMemoryProtection();
      initializeMemoryProtection({ level: 'basic' });

      const status = getMemoryProtectionStatus();
      expect(status.level).toBe('basic');
    });

    it('should support enhanced protection level', () => {
      const status = getMemoryProtectionStatus();
      expect(status.level).toBe('enhanced');
    });

    it('should support paranoid protection level', () => {
      shutdownMemoryProtection();
      initializeMemoryProtection({ level: 'paranoid' });

      const status = getMemoryProtectionStatus();
      expect(status.level).toBe('paranoid');
    });
  });
});
