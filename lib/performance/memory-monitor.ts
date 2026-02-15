/**
 * Memory Monitoring and Management
 *
 * Tracks JavaScript heap usage, detects memory pressure,
 * and provides utilities for memory cleanup and optimization.
 *
 * @module lib/performance/memory-monitor
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MemoryUsage {
  /** Used JS heap size (bytes) */
  usedJSHeapSize: number;
  /** Total JS heap size (bytes) */
  totalJSHeapSize: number;
  /** JS heap size limit (bytes) */
  jsHeapSizeLimit: number;
  /** Memory usage percentage (0-1) */
  usagePercent: number;
  /** Memory supported */
  supported: boolean;
}

export interface MemoryPressure {
  /** Under memory pressure */
  pressured: boolean;
  /** Severity level */
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  /** Recommended action */
  action: 'none' | 'cleanup' | 'aggressive-cleanup' | 'emergency';
}

export interface MemoryCleanupOptions {
  /** Clear resource caches */
  clearCaches?: boolean;
  /** Release WebRTC connections */
  releaseWebRTC?: boolean;
  /** Clear transfer buffers */
  clearBuffers?: boolean;
  /** Force garbage collection (if available) */
  forceGC?: boolean;
  /** Clear IndexedDB caches */
  clearIndexedDB?: boolean;
}

export interface MemoryStats {
  current: MemoryUsage;
  pressure: MemoryPressure;
  trend: 'increasing' | 'stable' | 'decreasing';
  leakDetected: boolean;
  recommendations: string[];
}

// ============================================================================
// MEMORY USAGE TRACKING
// ============================================================================

let memoryLimit: number | null = null;
const memoryHistory: number[] = [];
const MAX_HISTORY = 20;

/**
 * Get current memory usage
 *
 * Uses performance.memory API (Chrome only) or estimates
 *
 * @example
 * const memory = getMemoryUsage();
 * if (memory && memory.usagePercent > 0.8) {
 *   // High memory usage, trigger cleanup
 * }
 */
export function getMemoryUsage(): MemoryUsage | null {
  if (typeof performance === 'undefined') {
    return null;
  }

  // Check if memory API is available (Chrome)
  const perfMemory = (performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }).memory;

  if (!perfMemory) {
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      usagePercent: 0,
      supported: false,
    };
  }

  const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = perfMemory;

  // Apply custom limit if set
  const effectiveLimit = memoryLimit || jsHeapSizeLimit;
  const usagePercent = effectiveLimit > 0 ? usedJSHeapSize / effectiveLimit : 0;

  // Track history
  memoryHistory.push(usedJSHeapSize);
  if (memoryHistory.length > MAX_HISTORY) {
    memoryHistory.shift();
  }

  return {
    usedJSHeapSize,
    totalJSHeapSize,
    jsHeapSizeLimit: effectiveLimit,
    usagePercent,
    supported: true,
  };
}

/**
 * Check if under memory pressure
 *
 * @example
 * if (isMemoryPressured()) {
 *   // Reduce memory usage
 *   clearCaches();
 * }
 */
export function isMemoryPressured(): boolean {
  const memory = getMemoryUsage();
  if (!memory || !memory.supported) {return false;}

  // Pressured if using > 80% of heap
  return memory.usagePercent > 0.8;
}

/**
 * Get memory pressure details
 */
export function getMemoryPressure(): MemoryPressure {
  const memory = getMemoryUsage();

  if (!memory || !memory.supported) {
    return {
      pressured: false,
      severity: 'none',
      action: 'none',
    };
  }

  const { usagePercent } = memory;

  // Critical: > 95%
  if (usagePercent > 0.95) {
    return {
      pressured: true,
      severity: 'critical',
      action: 'emergency',
    };
  }

  // High: > 90%
  if (usagePercent > 0.9) {
    return {
      pressured: true,
      severity: 'high',
      action: 'aggressive-cleanup',
    };
  }

  // Medium: > 80%
  if (usagePercent > 0.8) {
    return {
      pressured: true,
      severity: 'medium',
      action: 'cleanup',
    };
  }

  // Low: > 70%
  if (usagePercent > 0.7) {
    return {
      pressured: true,
      severity: 'low',
      action: 'cleanup',
    };
  }

  return {
    pressured: false,
    severity: 'none',
    action: 'none',
  };
}

// ============================================================================
// MEMORY LIMIT MANAGEMENT
// ============================================================================

/**
 * Set soft memory limit
 *
 * Enforces a memory budget below the actual heap limit
 *
 * @example
 * setMemoryLimit(512); // 512 MB soft limit
 */
export function setMemoryLimit(maxMB: number): void {
  memoryLimit = maxMB * 1024 * 1024; // Convert MB to bytes
}

/**
 * Clear memory limit (use browser default)
 */
export function clearMemoryLimit(): void {
  memoryLimit = null;
}

/**
 * Get current memory limit
 */
export function getMemoryLimit(): number | null {
  return memoryLimit;
}

// ============================================================================
// MEMORY CLEANUP
// ============================================================================

const caches = new Map<string, unknown>();
const buffers = new Set<ArrayBuffer>();
const webrtcConnections = new Set<RTCPeerConnection>();

/**
 * Register cache for cleanup
 */
export function registerCache(name: string, cache: unknown): void {
  caches.set(name, cache);
}

/**
 * Register buffer for cleanup
 */
export function registerBuffer(buffer: ArrayBuffer): void {
  buffers.add(buffer);
}

/**
 * Register WebRTC connection for cleanup
 */
export function registerWebRTCConnection(connection: RTCPeerConnection): void {
  webrtcConnections.add(connection);
}

/**
 * Perform memory cleanup
 *
 * @example
 * await performMemoryCleanup({
 *   clearCaches: true,
 *   releaseWebRTC: true,
 *   clearBuffers: true
 * });
 */
export async function performMemoryCleanup(
  options: MemoryCleanupOptions = {}
): Promise<void> {
  const {
    clearCaches: shouldClearCaches = true,
    releaseWebRTC = true,
    clearBuffers: shouldClearBuffers = true,
    forceGC = true,
    clearIndexedDB = false,
  } = options;

  // Clear registered caches
  if (shouldClearCaches) {
    caches.forEach((cache, name) => {
      try {
        if (cache && typeof cache === 'object' && 'clear' in cache) {
          (cache as { clear: () => void }).clear();
        }
      } catch (error) {
        console.warn(`[Memory] Failed to clear cache "${name}":`, error);
      }
    });
    caches.clear();
  }

  // Clear buffers
  if (shouldClearBuffers) {
    buffers.clear();
  }

  // Release WebRTC connections
  if (releaseWebRTC) {
    webrtcConnections.forEach((conn) => {
      try {
        conn.close();
      } catch (error) {
        console.warn('[Memory] Failed to close WebRTC connection:', error);
      }
    });
    webrtcConnections.clear();
  }

  // Clear browser caches
  if (typeof caches !== 'undefined' && 'caches' in globalThis) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    } catch (error) {
      console.warn('[Memory] Failed to clear browser caches:', error);
    }
  }

  // Clear IndexedDB if requested
  if (clearIndexedDB && typeof indexedDB !== 'undefined') {
    try {
      const dbs = await indexedDB.databases();
      await Promise.all(
        dbs
          .filter((db) => db.name)
          .map((db) => new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(db.name!);
            request.onsuccess = () => resolve(undefined);
            request.onerror = () => reject(request.error);
          }))
      );
    } catch (error) {
      console.warn('[Memory] Failed to clear IndexedDB:', error);
    }
  }

  // Force garbage collection if available (requires --expose-gc flag)
  if (forceGC && typeof globalThis !== 'undefined' && 'gc' in globalThis) {
    try {
      (globalThis as { gc: () => void }).gc();
    } catch {
      // GC not available
    }
  }
}

/**
 * Automatic cleanup based on memory pressure
 */
export async function autoCleanup(): Promise<void> {
  const pressure = getMemoryPressure();

  if (pressure.action === 'emergency') {
    // Critical: clear everything
    await performMemoryCleanup({
      clearCaches: true,
      releaseWebRTC: true,
      clearBuffers: true,
      forceGC: true,
      clearIndexedDB: true,
    });
  } else if (pressure.action === 'aggressive-cleanup') {
    // High: aggressive cleanup
    await performMemoryCleanup({
      clearCaches: true,
      releaseWebRTC: true,
      clearBuffers: true,
      forceGC: true,
      clearIndexedDB: false,
    });
  } else if (pressure.action === 'cleanup') {
    // Medium: normal cleanup
    await performMemoryCleanup({
      clearCaches: true,
      releaseWebRTC: false,
      clearBuffers: true,
      forceGC: false,
      clearIndexedDB: false,
    });
  }
}

// ============================================================================
// MEMORY LEAK DETECTION
// ============================================================================

/**
 * Detect potential memory leaks
 *
 * Analyzes memory growth trend over time
 */
export function detectMemoryLeak(): boolean {
  if (memoryHistory.length < 10) {return false;}

  // Calculate trend: is memory consistently growing?
  let growthCount = 0;
  for (let i = 1; i < memoryHistory.length; i++) {
    if ((memoryHistory[i] ?? 0) > (memoryHistory[i - 1] ?? 0)) {
      growthCount++;
    }
  }

  // If memory grew in > 80% of samples, likely a leak
  const growthPercent = growthCount / (memoryHistory.length - 1);
  return growthPercent > 0.8;
}

/**
 * Get memory trend
 */
export function getMemoryTrend(): 'increasing' | 'stable' | 'decreasing' {
  if (memoryHistory.length < 5) {return 'stable';}

  const recent = memoryHistory.slice(-5);
  const avg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
  const first = recent[0];
  const last = recent[recent.length - 1];
  if (first === undefined || last === undefined) {
    return 'stable';
  }

  const change = (last - first) / avg;

  if (change > 0.1) {return 'increasing';}
  if (change < -0.1) {return 'decreasing';}
  return 'stable';
}

// ============================================================================
// MONITORING AND REPORTING
// ============================================================================

let monitoringInterval: NodeJS.Timeout | number | null = null;

/**
 * Start memory monitoring
 *
 * @example
 * const cleanup = startMemoryMonitoring((stats) => {
 *   if (stats.pressure.pressured) {
 *     console.warn('Memory pressure detected');
 *   }
 * }, 5000);
 */
export function startMemoryMonitoring(
  callback: (stats: MemoryStats) => void,
  intervalMs = 5000
): () => void {
  // Stop existing monitoring
  if (monitoringInterval) {
    stopMemoryMonitoring();
  }

  const monitor = () => {
    const stats = getMemoryStats();
    callback(stats);

    // Auto-cleanup on high pressure
    if (stats.pressure.action !== 'none') {
      autoCleanup();
    }
  };

  // Initial check
  monitor();

  // Periodic checks
  monitoringInterval = setInterval(monitor, intervalMs);

  return stopMemoryMonitoring;
}

/**
 * Stop memory monitoring
 */
export function stopMemoryMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval as number);
    monitoringInterval = null;
  }
}

/**
 * Get comprehensive memory statistics
 */
export function getMemoryStats(): MemoryStats {
  const current = getMemoryUsage();
  const pressure = getMemoryPressure();
  const trend = getMemoryTrend();
  const leakDetected = detectMemoryLeak();

  const recommendations: string[] = [];

  if (pressure.pressured) {
    recommendations.push('Reduce memory usage by clearing caches');
  }

  if (leakDetected) {
    recommendations.push('Potential memory leak detected - check for unclosed connections');
  }

  if (current && current.usagePercent > 0.7) {
    recommendations.push('Consider lazy loading features to reduce memory footprint');
  }

  if (trend === 'increasing') {
    recommendations.push('Memory usage is growing - monitor for leaks');
  }

  return {
    current: current || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      usagePercent: 0,
      supported: false,
    },
    pressure,
    trend,
    leakDetected,
    recommendations,
  };
}

/**
 * Log memory status to console
 */
export function logMemoryStatus(): void {
  const stats = getMemoryStats();

  console.group('[Memory Status]');

  if (stats.current.supported) {
    console.log('Memory Usage:');
    console.table({
      'Used': formatBytes(stats.current.usedJSHeapSize),
      'Total': formatBytes(stats.current.totalJSHeapSize),
      'Limit': formatBytes(stats.current.jsHeapSizeLimit),
      'Usage': `${(stats.current.usagePercent * 100).toFixed(1)}%`,
    });

    console.log(`Pressure: ${stats.pressure.severity.toUpperCase()}`);
    console.log(`Trend: ${stats.trend}`);
    console.log(`Leak Detected: ${stats.leakDetected ? 'YES' : 'No'}`);

    if (stats.recommendations.length > 0) {
      console.log('Recommendations:');
      stats.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
  } else {
    console.log('Memory monitoring not supported in this browser');
    console.log('Use Chrome/Edge with performance.memory API');
  }

  console.groupEnd();
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) {return '0 B';}

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Create memory guard for async operations
 *
 * Checks memory before and after operation
 *
 * @example
 * await withMemoryGuard(async () => {
 *   // Memory-intensive operation
 * }, 100); // 100 MB max
 */
export async function withMemoryGuard<T>(
  operation: () => Promise<T>,
  maxMemoryMB: number
): Promise<T> {
  const before = getMemoryUsage();

  // Check if we have enough memory
  if (before && before.supported) {
    const available = before.jsHeapSizeLimit - before.usedJSHeapSize;
    const required = maxMemoryMB * 1024 * 1024;

    if (available < required) {
      // Not enough memory, try cleanup
      await performMemoryCleanup();

      const after = getMemoryUsage();
      const newAvailable = after
        ? after.jsHeapSizeLimit - after.usedJSHeapSize
        : 0;

      if (newAvailable < required) {
        throw new Error(
          `Insufficient memory: need ${formatBytes(required)}, have ${formatBytes(
            newAvailable
          )}`
        );
      }
    }
  }

  // Execute operation
  const result = await operation();

  // Check for leaks
  const after = getMemoryUsage();
  if (before && after && after.supported) {
    const growth = after.usedJSHeapSize - before.usedJSHeapSize;
    if (growth > maxMemoryMB * 1024 * 1024 * 1.5) {
      console.warn(
        `[Memory] Operation exceeded memory budget by ${formatBytes(
          growth - maxMemoryMB * 1024 * 1024
        )}`
      );
    }
  }

  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getMemoryUsage,
  isMemoryPressured,
  getMemoryPressure,
  setMemoryLimit,
  clearMemoryLimit,
  getMemoryLimit,
  registerCache,
  registerBuffer,
  registerWebRTCConnection,
  performMemoryCleanup,
  autoCleanup,
  detectMemoryLeak,
  getMemoryTrend,
  startMemoryMonitoring,
  stopMemoryMonitoring,
  getMemoryStats,
  logMemoryStatus,
  withMemoryGuard,
};
