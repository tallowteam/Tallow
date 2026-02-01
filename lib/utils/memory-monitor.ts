/**
 * Memory Monitor Utility
 * Tracks memory usage and detects potential leaks in development
 */

import secureLog from './secure-logger';

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  timestamp: number;
}

class MemoryMonitor {
  private samples: MemoryStats[] = [];
  private maxSamples = 100;
  private warningThreshold = 0.9; // 90% of heap
  private criticalThreshold = 0.95; // 95% of heap
  private monitoringInterval: NodeJS.Timeout | null = null;
  private enabled = false;
  private isDevelopment = process.env.NODE_ENV === 'development';
  private lastCriticalAlert = 0;
  private alertCooldown = 60000; // 1 minute cooldown between critical alerts

  /**
   * Start monitoring memory usage
   */
  start(intervalMs = 5000): void {
    // Adjust thresholds based on environment
    if (this.isDevelopment) {
      // More relaxed thresholds in dev mode (dev builds use more memory)
      this.warningThreshold = 0.95; // 95% of heap
      this.criticalThreshold = 0.99; // 99% of heap (only actual critical issues)
    } else {
      // Production thresholds
      this.warningThreshold = 0.85; // 85% of heap
      this.criticalThreshold = 0.95; // 95% of heap
    }

    if (typeof window !== 'undefined') {
      // Client-side monitoring using performance.memory (Chrome only)
      this.startClientMonitoring(intervalMs);
    } else if (typeof process !== 'undefined' && typeof process.memoryUsage === 'function') {
      // Server-side monitoring using process.memoryUsage
      this.startServerMonitoring(intervalMs);
    }
  }

  /**
   * Client-side memory monitoring
   */
  private startClientMonitoring(intervalMs: number): void {
    if (!('memory' in performance)) {
      secureLog.warn('[MemoryMonitor] performance.memory not available');
      return;
    }

    this.enabled = true;
    this.monitoringInterval = setInterval(() => {
      const memory = (performance as any).memory;
      if (!memory) {return;}

      const stats: MemoryStats = {
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: 0,
        rss: 0,
        timestamp: Date.now(),
      };

      this.recordSample(stats);
      this.checkThresholds(stats);
    }, intervalMs);
  }

  /**
   * Server-side memory monitoring
   */
  private startServerMonitoring(intervalMs: number): void {
    this.enabled = true;
    this.monitoringInterval = setInterval(() => {
      const memory = process.memoryUsage();

      const stats: MemoryStats = {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
        rss: memory.rss,
        timestamp: Date.now(),
      };

      this.recordSample(stats);
      this.checkThresholds(stats);
    }, intervalMs);
  }

  /**
   * Record memory sample
   */
  private recordSample(stats: MemoryStats): void {
    this.samples.push(stats);

    // Keep only recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  /**
   * Check if memory usage exceeds thresholds
   */
  private checkThresholds(stats: MemoryStats): void {
    const heapUsage = stats.heapUsed / stats.heapTotal;
    const now = Date.now();

    if (heapUsage >= this.criticalThreshold) {
      // Apply cooldown to prevent log spam
      if (now - this.lastCriticalAlert >= this.alertCooldown) {
        secureLog.error(
          `[MemoryMonitor] CRITICAL: Heap usage at ${(heapUsage * 100).toFixed(1)}%`,
          `(${this.formatBytes(stats.heapUsed)} / ${this.formatBytes(stats.heapTotal)})`,
          this.isDevelopment ? ' [Dev mode - expected to be higher]' : ''
        );
        this.lastCriticalAlert = now;
        this.triggerGarbageCollection();
      }
    } else if (heapUsage >= this.warningThreshold) {
      // In dev mode, only log warnings if console logging is enabled
      if (!this.isDevelopment || (typeof window !== 'undefined' && localStorage.getItem('debug') === 'true')) {
        secureLog.warn(
          `[MemoryMonitor] WARNING: Heap usage at ${(heapUsage * 100).toFixed(1)}%`,
          `(${this.formatBytes(stats.heapUsed)} / ${this.formatBytes(stats.heapTotal)})`
        );
      }
    }
  }

  /**
   * Detect memory leaks by analyzing growth trends
   */
  detectLeaks(): boolean {
    if (this.samples.length < 10) {
      return false;
    }

    // Get recent samples (last 10)
    const recent = this.samples.slice(-10);

    // Calculate average growth rate
    let totalGrowth = 0;
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];
      if (prev && curr) {
        const growth = (curr.heapUsed - prev.heapUsed) / prev.heapUsed;
        totalGrowth += growth;
      }
    }

    const avgGrowth = totalGrowth / (recent.length - 1);

    // If memory is consistently growing by more than 1% per sample, likely a leak
    if (avgGrowth > 0.01) {
      secureLog.warn(
        `[MemoryMonitor] Possible memory leak detected!`,
        `Average growth rate: ${(avgGrowth * 100).toFixed(2)}% per sample`
      );
      return true;
    }

    return false;
  }

  /**
   * Trigger garbage collection if available
   */
  private triggerGarbageCollection(): void {
    if (typeof global !== 'undefined' && global.gc) {
      secureLog.log('[MemoryMonitor] Triggering garbage collection');
      global.gc();
    }
  }

  /**
   * Get current memory stats
   */
  getStats(): MemoryStats | null {
    return this.samples[this.samples.length - 1] || null;
  }

  /**
   * Get memory statistics report
   */
  getReport(): {
    current: MemoryStats | null;
    average: MemoryStats | null;
    peak: MemoryStats | null;
    leakDetected: boolean;
  } {
    if (this.samples.length === 0) {
      return {
        current: null,
        average: null,
        peak: null,
        leakDetected: false,
      };
    }

    const current = this.samples[this.samples.length - 1]!;

    // Calculate averages
    const average: MemoryStats = {
      heapUsed: this.samples.reduce((sum, s) => sum + s.heapUsed, 0) / this.samples.length,
      heapTotal: this.samples.reduce((sum, s) => sum + s.heapTotal, 0) / this.samples.length,
      external: this.samples.reduce((sum, s) => sum + s.external, 0) / this.samples.length,
      rss: this.samples.reduce((sum, s) => sum + s.rss, 0) / this.samples.length,
      timestamp: Date.now(),
    };

    // Find peak usage
    const peak = this.samples.reduce((max, s) =>
      s.heapUsed > max.heapUsed ? s : max
    , this.samples[0]!);

    return {
      current,
      average,
      peak,
      leakDetected: this.detectLeaks(),
    };
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.enabled = false;
  }

  /**
   * Clear all samples
   */
  clear(): void {
    this.samples = [];
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable verbose logging (useful for debugging memory issues)
   * Call this in browser console: window.memoryMonitor.enableVerboseLogging()
   */
  enableVerboseLogging(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('debug', 'true');
      secureLog.log('[MemoryMonitor] Verbose logging enabled. Reload page to take effect.');
    }
  }

  /**
   * Disable verbose logging
   */
  disableVerboseLogging(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('debug');
      secureLog.log('[MemoryMonitor] Verbose logging disabled. Reload page to take effect.');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): {
    isDevelopment: boolean;
    warningThreshold: number;
    criticalThreshold: number;
    monitoringEnabled: boolean;
  } {
    return {
      isDevelopment: this.isDevelopment,
      warningThreshold: this.warningThreshold,
      criticalThreshold: this.criticalThreshold,
      monitoringEnabled: this.enabled,
    };
  }
}

// Singleton instance
export const memoryMonitor = new MemoryMonitor();

// Expose to window in development for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).memoryMonitor = memoryMonitor;
}

// Auto-start in development with reduced frequency
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    // Client-side: start after page load with less frequent checks
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        memoryMonitor.start(30000); // Check every 30 seconds (reduced from 10s)
      });
    } else {
      memoryMonitor.start(30000);
    }
  } else {
    // Server-side: start immediately with less frequent checks
    memoryMonitor.start(60000); // Check every 60 seconds (reduced from 30s)
  }
}

export default memoryMonitor;
