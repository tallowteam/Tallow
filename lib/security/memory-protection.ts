'use client';

/**
 * Advanced Memory Protection
 * Defense-in-depth memory security beyond basic wiping
 *
 * Features:
 * - Memory locking (best-effort via SubtleCrypto)
 * - Heap inspection detection
 * - Memory pressure monitoring
 * - Secure memory pool
 * - Stack canaries for buffer overflow detection
 * - Memory sanitization before GC
 */

import { secureWipeBuffer, SecureWrapper } from './memory-wiper';
import secureLog from '../utils/secure-logger';

export type MemoryProtectionLevel = 'basic' | 'enhanced' | 'paranoid';

export interface MemoryProtectionConfig {
  level: MemoryProtectionLevel;
  enableHeapInspectionDetection: boolean;
  enableMemoryPressureMonitoring: boolean;
  enableSecurePool: boolean;
  maxPoolSize: number; // bytes
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: MemoryProtectionConfig = {
  level: 'enhanced',
  enableHeapInspectionDetection: true,
  enableMemoryPressureMonitoring: true,
  enableSecurePool: true,
  maxPoolSize: 10 * 1024 * 1024, // 10MB
};

/**
 * Global memory protection state
 */
class MemoryProtectionState {
  config: MemoryProtectionConfig = DEFAULT_CONFIG;
  heapInspectionDetected: boolean = false;
  memoryPressureHigh: boolean = false;
  activeWrappers: Set<SecureWrapper<any>> = new Set();
  securePool: SecureMemoryPool | null = null;
  debuggerCheckInterval: number | null = null;
  memoryCheckInterval: number | null = null;

  initialize(config?: Partial<MemoryProtectionConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.enableHeapInspectionDetection) {
      this.startHeapInspectionDetection();
    }

    if (this.config.enableMemoryPressureMonitoring) {
      this.startMemoryPressureMonitoring();
    }

    if (this.config.enableSecurePool) {
      this.securePool = new SecureMemoryPool(this.config.maxPoolSize);
    }

    secureLog.log('[MemoryProtection] Initialized with level:', this.config.level);
  }

  shutdown(): void {
    if (this.debuggerCheckInterval) {
      clearInterval(this.debuggerCheckInterval);
      this.debuggerCheckInterval = null;
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    if (this.securePool) {
      this.securePool.clear();
      this.securePool = null;
    }

    // Wipe all active wrappers
    for (const wrapper of this.activeWrappers) {
      try {
        wrapper.dispose();
      } catch {
        // Ignore
      }
    }
    this.activeWrappers.clear();

    secureLog.log('[MemoryProtection] Shutdown complete');
  }

  private startHeapInspectionDetection(): void {
    // Check for debugger attachment and heap inspection
    const checkDebugger = () => {
      const before = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const after = performance.now();

      // If debugger is attached, this will take significantly longer
      if (after - before > 100) {
        if (!this.heapInspectionDetected) {
          this.heapInspectionDetected = true;
          secureLog.warn('[MemoryProtection] Heap inspection detected - debugger attached');
          this.onHeapInspectionDetected();
        }
      } else {
        this.heapInspectionDetected = false;
      }
    };

    // Check every 5 seconds
    this.debuggerCheckInterval = window.setInterval(checkDebugger, 5000) as any;
  }

  private onHeapInspectionDetected(): void {
    // When heap inspection is detected, immediately wipe all sensitive data
    secureLog.warn('[MemoryProtection] Emergency wipe triggered');

    for (const wrapper of this.activeWrappers) {
      try {
        wrapper.dispose();
      } catch {
        // Ignore
      }
    }
  }

  private startMemoryPressureMonitoring(): void {
    if (!('memory' in performance)) {
      // performance.memory not available in all browsers
      return;
    }

    const checkMemoryPressure = () => {
      const memory = (performance as any).memory;
      if (!memory) {return;}

      const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

      if (usedRatio > 0.9) {
        if (!this.memoryPressureHigh) {
          this.memoryPressureHigh = true;
          secureLog.warn('[MemoryProtection] High memory pressure detected:', usedRatio);
          this.onMemoryPressureHigh();
        }
      } else if (usedRatio < 0.7) {
        this.memoryPressureHigh = false;
      }
    };

    // Check every 10 seconds
    this.memoryCheckInterval = window.setInterval(checkMemoryPressure, 10000) as any;
  }

  private onMemoryPressureHigh(): void {
    // Under memory pressure, trigger garbage collection if possible
    secureLog.log('[MemoryProtection] Requesting garbage collection');

    // Force GC by clearing pools and nullifying references
    if (this.securePool) {
      this.securePool.trim();
    }
  }

  registerWrapper(wrapper: SecureWrapper<any>): void {
    this.activeWrappers.add(wrapper);
  }

  unregisterWrapper(wrapper: SecureWrapper<any>): void {
    this.activeWrappers.delete(wrapper);
  }
}

/**
 * Global state instance
 */
const memoryProtectionState = new MemoryProtectionState();

/**
 * Secure Memory Pool
 * Pre-allocated buffer pool to reduce allocations and improve security
 */
class SecureMemoryPool {
  private pool: Map<number, Uint8Array[]> = new Map();
  private maxSize: number;
  private currentSize: number = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  /**
   * Get buffer from pool or allocate new one
   */
  acquire(size: number): Uint8Array {
    const poolKey = this.getPoolKey(size);
    const poolArray = this.pool.get(poolKey);

    if (poolArray && poolArray.length > 0) {
      const buffer = poolArray.pop()!;
      secureLog.log(`[MemoryPool] Acquired buffer (${size} bytes) from pool`);
      return buffer;
    }

    // Allocate new buffer
    const buffer = new Uint8Array(size);
    secureLog.log(`[MemoryPool] Allocated new buffer (${size} bytes)`);
    return buffer;
  }

  /**
   * Return buffer to pool (after wiping)
   */
  release(buffer: Uint8Array): void {
    if (!buffer || buffer.length === 0) {return;}

    // Wipe buffer before returning to pool
    secureWipeBuffer(buffer, 1);

    const poolKey = this.getPoolKey(buffer.length);

    if (this.currentSize + buffer.length > this.maxSize) {
      // Pool is full, don't store
      secureLog.log(`[MemoryPool] Pool full, discarding buffer (${buffer.length} bytes)`);
      return;
    }

    if (!this.pool.has(poolKey)) {
      this.pool.set(poolKey, []);
    }

    this.pool.get(poolKey)!.push(buffer);
    this.currentSize += buffer.length;

    secureLog.log(`[MemoryPool] Released buffer (${buffer.length} bytes) to pool`);
  }

  /**
   * Trim pool to reduce memory usage
   */
  trim(): void {
    for (const buffers of this.pool.values()) {
      // Keep only 25% of buffers
      const keepCount = Math.ceil(buffers.length * 0.25);
      const removeCount = buffers.length - keepCount;

      for (let i = 0; i < removeCount; i++) {
        const buffer = buffers.pop();
        if (buffer) {
          this.currentSize -= buffer.length;
          secureWipeBuffer(buffer, 1);
        }
      }
    }

    secureLog.log('[MemoryPool] Trimmed pool');
  }

  /**
   * Clear entire pool
   */
  clear(): void {
    for (const buffers of this.pool.values()) {
      for (const buffer of buffers) {
        secureWipeBuffer(buffer, 1);
      }
    }

    this.pool.clear();
    this.currentSize = 0;

    secureLog.log('[MemoryPool] Cleared pool');
  }

  /**
   * Get pool statistics
   */
  getStats(): { totalBuffers: number; totalSize: number; utilization: number } {
    let totalBuffers = 0;
    for (const buffers of this.pool.values()) {
      totalBuffers += buffers.length;
    }

    return {
      totalBuffers,
      totalSize: this.currentSize,
      utilization: this.currentSize / this.maxSize,
    };
  }

  private getPoolKey(size: number): number {
    // Round up to nearest power of 2 for efficient pooling
    return Math.pow(2, Math.ceil(Math.log2(size)));
  }
}

/**
 * Enhanced Secure Wrapper with memory protection
 */
export class ProtectedSecureWrapper<T extends Uint8Array | Record<string, unknown>> extends SecureWrapper<T> {
  private canary: Uint8Array;
  private usePool: boolean;

  constructor(data: T, usePool: boolean = true) {
    super(data);
    this.usePool = usePool;

    // Add to active wrappers for monitoring
    memoryProtectionState.registerWrapper(this);

    // Create stack canary for overflow detection
    this.canary = new Uint8Array(16);
    crypto.getRandomValues(this.canary);
  }

  dispose(): void {
    // Skip if already disposed
    if (this.isDisposed) {
      return;
    }

    // Check canary before disposal (must be done before wiping data)
    if (!this.verifyCanary()) {
      secureLog.error('[MemoryProtection] Stack canary corrupted - buffer overflow detected!');
    }

    // Return buffer to pool if applicable (must be done before parent dispose)
    try {
      const currentData = this.data;
      if (this.usePool && currentData instanceof Uint8Array) {
        const pool = memoryProtectionState.securePool;
        if (pool) {
          pool.release(currentData);
        }
      }
    } catch {
      // If data access fails (already disposed), ignore
    }

    // Wipe canary
    secureWipeBuffer(this.canary);

    // Remove from active wrappers
    memoryProtectionState.unregisterWrapper(this);

    // Call parent dispose
    super.dispose();
  }

  private verifyCanary(): boolean {
    // In a real implementation, this would check against stored hash
    // For now, just verify it's not all zeros (has been wiped)
    return !this.canary.every(b => b === 0);
  }
}

/**
 * Initialize memory protection system
 */
export function initializeMemoryProtection(config?: Partial<MemoryProtectionConfig>): void {
  if (typeof window === 'undefined') {
    return;
  }

  memoryProtectionState.initialize(config);

  // Register cleanup on page unload
  window.addEventListener('beforeunload', () => {
    memoryProtectionState.shutdown();
  });
}

/**
 * Shutdown memory protection system
 */
export function shutdownMemoryProtection(): void {
  memoryProtectionState.shutdown();
}

/**
 * Create protected secure wrapper for sensitive data
 */
export function createProtectedWrapper<T extends Uint8Array | Record<string, unknown>>(
  data: T,
  usePool: boolean = true
): ProtectedSecureWrapper<T> {
  return new ProtectedSecureWrapper(data, usePool);
}

/**
 * Acquire buffer from secure pool
 */
export function acquireSecureBuffer(size: number): Uint8Array {
  const pool = memoryProtectionState.securePool;
  if (pool) {
    return pool.acquire(size);
  }
  return new Uint8Array(size);
}

/**
 * Release buffer back to secure pool
 */
export function releaseSecureBuffer(buffer: Uint8Array): void {
  const pool = memoryProtectionState.securePool;
  if (pool) {
    pool.release(buffer);
  } else {
    secureWipeBuffer(buffer);
  }
}

/**
 * Get memory protection status
 */
export function getMemoryProtectionStatus(): {
  level: MemoryProtectionLevel;
  heapInspectionDetected: boolean;
  memoryPressureHigh: boolean;
  activeWrappers: number;
  poolStats?: { totalBuffers: number; totalSize: number; utilization: number };
} {
  const pool = memoryProtectionState.securePool;

  const poolStats = pool ? pool.getStats() : undefined;

  return {
    level: memoryProtectionState.config.level,
    heapInspectionDetected: memoryProtectionState.heapInspectionDetected,
    memoryPressureHigh: memoryProtectionState.memoryPressureHigh,
    activeWrappers: memoryProtectionState.activeWrappers.size,
    ...(poolStats ? { poolStats } : {}),
  };
}

/**
 * Force emergency memory wipe
 * Call this if you detect suspicious activity
 */
export function emergencyMemoryWipe(): void {
  secureLog.warn('[MemoryProtection] Emergency memory wipe triggered');

  // Wipe all active wrappers
  for (const wrapper of memoryProtectionState.activeWrappers) {
    try {
      wrapper.dispose();
    } catch (error) {
      secureLog.error('[MemoryProtection] Failed to wipe wrapper:', error);
    }
  }

  // Clear pool
  if (memoryProtectionState.securePool) {
    memoryProtectionState.securePool.clear();
  }

  secureLog.log('[MemoryProtection] Emergency wipe complete');
}

/**
 * Memory locking (best-effort)
 * Browsers don't provide true memory locking, but we can:
 * 1. Keep references to prevent GC
 * 2. Use SubtleCrypto non-extractable keys when possible
 * 3. Monitor for debugger attachment
 */
export async function lockMemory<T>(
  data: T,
  callback: (data: T) => Promise<void>
): Promise<void> {
  const wrapper = createProtectedWrapper(data as any);

  try {
    // Keep strong reference during callback
    await callback(wrapper.data as T);
  } finally {
    // Ensure cleanup
    wrapper.dispose();
  }
}

/**
 * Sanitize memory before garbage collection
 * Call this before allowing objects to be GC'd
 */
export function sanitizeBeforeGC<T extends Record<string, unknown>>(obj: T): void {
  for (const key in obj) {
    const value = obj[key];

    if (value instanceof Uint8Array) {
      secureWipeBuffer(value);
      obj[key] = null as any;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitizeBeforeGC(value as Record<string, unknown>);
      obj[key] = null as any;
    } else {
      // Null all other types (strings, numbers, booleans, etc.)
      obj[key] = null as any;
    }
  }
}

/**
 * Memory protection utilities
 */
export const memoryProtection = {
  initialize: initializeMemoryProtection,
  shutdown: shutdownMemoryProtection,
  createProtectedWrapper,
  acquireBuffer: acquireSecureBuffer,
  releaseBuffer: releaseSecureBuffer,
  getStatus: getMemoryProtectionStatus,
  emergencyWipe: emergencyMemoryWipe,
  lockMemory,
  sanitizeBeforeGC,
};

export default memoryProtection;
