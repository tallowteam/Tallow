/**
 * Performance Metrics Utilities
 * Track and measure performance improvements from service worker and caching
 */

import { warn, log } from '@/lib/utils/secure-logger';

export interface PerformanceMetrics {
  // Service Worker metrics
  swRegistrationTime: number | null;
  swActivationTime: number | null;
  swUpdateCheckTime: number | null;

  // Cache metrics
  cacheHitRate: number | null;
  cacheMissRate: number | null;
  averageCacheResponseTime: number | null;

  // Load metrics
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  timeToInteractive: number | null;
  totalBlockingTime: number | null;

  // Network metrics
  offlineTime: number;
  onlineTime: number;
  connectionChanges: number;
}

/**
 * Performance metrics tracker
 */
class PerformanceTracker {
  private metrics: Partial<PerformanceMetrics> = {
    offlineTime: 0,
    onlineTime: 0,
    connectionChanges: 0,
  };

  // private startTime: number = Date.now();  // Unused: for future session duration tracking
  private lastConnectionState: boolean = navigator.onLine;
  private lastConnectionChange: number = Date.now();

  constructor() {
    this.setupListeners();
  }

  /**
   * Setup event listeners for automatic tracking
   */
  private setupListeners(): void {
    // Track connection changes
    window.addEventListener('online', () => this.handleConnectionChange(true));
    window.addEventListener('offline', () => this.handleConnectionChange(false));

    // Track performance metrics
    if ('performance' in window && 'PerformanceObserver' in window) {
      this.setupPerformanceObservers();
    }

    // Track service worker events
    if ('serviceWorker' in navigator) {
      this.setupServiceWorkerTracking();
    }
  }

  /**
   * Handle connection state changes
   */
  private handleConnectionChange(isOnline: boolean): void {
    const now = Date.now();
    const duration = now - this.lastConnectionChange;

    if (this.lastConnectionState) {
      this.metrics.onlineTime = (this.metrics.onlineTime || 0) + duration;
    } else {
      this.metrics.offlineTime = (this.metrics.offlineTime || 0) + duration;
    }

    this.metrics.connectionChanges = (this.metrics.connectionChanges || 0) + 1;
    this.lastConnectionState = isOnline;
    this.lastConnectionChange = now;
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers(): void {
    try {
      // First Contentful Paint
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
          }
        }
      });
      paintObserver.observe({ type: 'paint', buffered: true });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.metrics.largestContentfulPaint = lastEntry.startTime;
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Time to Interactive (approximate using long tasks)
      const longTaskObserver = new PerformanceObserver((list) => {
        let totalBlockingTime = 0;
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            totalBlockingTime += entry.duration - 50;
          }
        }
        this.metrics.totalBlockingTime = totalBlockingTime;
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch (error) {
      warn('[Performance] Failed to setup observers:', error);
    }
  }

  /**
   * Setup service worker performance tracking
   */
  private async setupServiceWorkerTracking(): Promise<void> {
    try {
      const startTime = performance.now();
      const registration = await navigator.serviceWorker.ready;
      const endTime = performance.now();

      this.metrics.swRegistrationTime = endTime - startTime;

      // Track activation time
      if (registration.active) {
        this.metrics.swActivationTime = performance.now();
      }
    } catch (error) {
      warn('[Performance] Failed to track service worker:', error);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      swRegistrationTime: this.metrics.swRegistrationTime || null,
      swActivationTime: this.metrics.swActivationTime || null,
      swUpdateCheckTime: this.metrics.swUpdateCheckTime || null,
      cacheHitRate: this.metrics.cacheHitRate || null,
      cacheMissRate: this.metrics.cacheMissRate || null,
      averageCacheResponseTime: this.metrics.averageCacheResponseTime || null,
      firstContentfulPaint: this.metrics.firstContentfulPaint || null,
      largestContentfulPaint: this.metrics.largestContentfulPaint || null,
      timeToInteractive: this.metrics.timeToInteractive || null,
      totalBlockingTime: this.metrics.totalBlockingTime || null,
      offlineTime: this.metrics.offlineTime || 0,
      onlineTime: this.metrics.onlineTime || 0,
      connectionChanges: this.metrics.connectionChanges || 0,
    };
  }

  /**
   * Log metrics to console
   */
  logMetrics(): void {
    const metrics = this.getMetrics();

    log('📊 Performance Metrics');
    log('Service Worker');
    log(`Registration: ${this.formatTime(metrics.swRegistrationTime)}`);
    log(`Activation: ${this.formatTime(metrics.swActivationTime)}`);
    log('Core Web Vitals');
    log(`FCP: ${this.formatTime(metrics.firstContentfulPaint)}`);
    log(`LCP: ${this.formatTime(metrics.largestContentfulPaint)}`);
    log(`TBT: ${this.formatTime(metrics.totalBlockingTime)}`);
    log('Network');
    log(`Online Time: ${this.formatDuration(metrics.onlineTime)}`);
    log(`Offline Time: ${this.formatDuration(metrics.offlineTime)}`);
    log(`Connection Changes: ${metrics.connectionChanges}`);
  }

  /**
   * Format time in milliseconds
   */
  private formatTime(ms: number | null): string {
    if (ms === null) {return 'N/A';}
    return `${ms.toFixed(2)}ms`;
  }

  /**
   * Format duration in seconds
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      offlineTime: 0,
      onlineTime: 0,
      connectionChanges: 0,
    };
    // this.startTime = Date.now();  // Unused: for future session duration tracking
    this.lastConnectionChange = Date.now();
  }
}

// Singleton instance
let tracker: PerformanceTracker | null = null;

/**
 * Get or create performance tracker instance
 */
export function getPerformanceTracker(): PerformanceTracker {
  if (!tracker) {
    tracker = new PerformanceTracker();
  }
  return tracker;
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return getPerformanceTracker().getMetrics();
}

/**
 * Log performance metrics to console
 */
export function logPerformanceMetrics(): void {
  getPerformanceTracker().logMetrics();
}

/**
 * Export metrics as JSON string
 */
export function exportPerformanceMetrics(): string {
  return getPerformanceTracker().exportMetrics();
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics(): void {
  getPerformanceTracker().reset();
}

/**
 * Measure cache performance
 */
export async function measureCachePerformance(): Promise<{
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
}> {
  if (!('performance' in window)) {
    return {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
    };
  }

  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  let cacheHits = 0;
  let cacheMisses = 0;

  for (const entry of entries) {
    // Check if response came from cache (transferSize will be 0 or very small)
    if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
      cacheHits++;
    } else {
      cacheMisses++;
    }
  }

  const totalRequests = cacheHits + cacheMisses;
  const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

  return {
    totalRequests,
    cacheHits,
    cacheMisses,
    hitRate,
  };
}

/**
 * Get Core Web Vitals
 */
export function getCoreWebVitals(): {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  fid: number | null;
  ttfb: number | null;
} {
  const vitals = {
    fcp: null as number | null,
    lcp: null as number | null,
    cls: null as number | null,
    fid: null as number | null,
    ttfb: null as number | null,
  };

  if (!('performance' in window)) {
    return vitals;
  }

  // First Contentful Paint
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
  if (fcpEntry) {
    vitals.fcp = fcpEntry.startTime;
  }

  // Time to First Byte
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigationEntry) {
    vitals.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
  }

  return vitals;
}

/**
 * Compare performance before and after caching
 */
export interface PerformanceComparison {
  metric: string;
  before: number | null;
  after: number | null;
  improvement: number | null;
  improvementPercentage: number | null;
}

export function comparePerformance(
  before: PerformanceMetrics,
  after: PerformanceMetrics
): PerformanceComparison[] {
  const comparisons: PerformanceComparison[] = [];

  const metrics = [
    { key: 'firstContentfulPaint', label: 'First Contentful Paint' },
    { key: 'largestContentfulPaint', label: 'Largest Contentful Paint' },
    { key: 'totalBlockingTime', label: 'Total Blocking Time' },
    { key: 'swRegistrationTime', label: 'SW Registration Time' },
  ] as const;

  for (const { key, label } of metrics) {
    const beforeValue = before[key];
    const afterValue = after[key];

    let improvement: number | null = null;
    let improvementPercentage: number | null = null;

    if (beforeValue !== null && afterValue !== null) {
      improvement = beforeValue - afterValue;
      improvementPercentage = (improvement / beforeValue) * 100;
    }

    comparisons.push({
      metric: label,
      before: beforeValue,
      after: afterValue,
      improvement,
      improvementPercentage,
    });
  }

  return comparisons;
}

// Auto-start tracking in browser
if (typeof window !== 'undefined') {
  getPerformanceTracker();
}
