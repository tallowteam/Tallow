/**
 * Performance Monitoring Utilities
 *
 * Comprehensive performance monitoring including Core Web Vitals,
 * custom marks, error tracking, and reporting.
 *
 * @module lib/performance/monitoring
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  context?: Record<string, unknown>;
}

export interface PerformanceBudget {
  /** Largest Contentful Paint (ms) */
  lcp: number;
  /** First Input Delay (ms) - deprecated, use INP */
  fid: number;
  /** Interaction to Next Paint (ms) */
  inp: number;
  /** Cumulative Layout Shift (score) */
  cls: number;
  /** First Contentful Paint (ms) */
  fcp: number;
  /** Time to First Byte (ms) */
  ttfb: number;
  /** Total bundle size (bytes) */
  bundleSize: number;
  /** JS bundle size (bytes) */
  jsSize: number;
  /** CSS bundle size (bytes) */
  cssSize: number;
}

export interface PerformanceReport {
  timestamp: number;
  url: string;
  metrics: PerformanceMetric[];
  marks: PerformanceMark[];
  measures: PerformanceMeasure[];
  resources: ResourceTiming[];
  navigation: NavigationTiming | null;
  budgetViolations: BudgetViolation[];
}

export interface PerformanceMark {
  name: string;
  startTime: number;
  duration: number;
  detail?: unknown;
}

export interface PerformanceMeasure {
  name: string;
  startTime: number;
  duration: number;
  startMark?: string;
  endMark?: string;
}

export interface ResourceTiming {
  name: string;
  initiatorType: string;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
}

export interface NavigationTiming {
  domContentLoaded: number;
  domComplete: number;
  loadComplete: number;
  ttfb: number;
  dns: number;
  tcp: number;
  tls: number;
}

export interface BudgetViolation {
  metric: string;
  budget: number;
  actual: number;
  overBy: number;
  severity: 'warning' | 'critical';
}

export type MetricHandler = (metric: PerformanceMetric) => void;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Core Web Vitals thresholds based on Google's recommendations
 */
export const CORE_WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

/**
 * Default performance budget
 */
export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  lcp: 2500,
  fid: 100,
  inp: 200,
  cls: 0.1,
  fcp: 1800,
  ttfb: 800,
  bundleSize: 250 * 1024, // 250KB
  jsSize: 150 * 1024, // 150KB
  cssSize: 50 * 1024, // 50KB
};

// ============================================================================
// METRIC RATING
// ============================================================================

/**
 * Get rating for a metric value
 */
export function getMetricRating(
  metricName: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold =
    CORE_WEB_VITALS_THRESHOLDS[
      metricName as keyof typeof CORE_WEB_VITALS_THRESHOLDS
    ];

  if (!threshold) return 'needs-improvement';

  if (value <= threshold.good) return 'good';
  if (value > threshold.poor) return 'poor';
  return 'needs-improvement';
}

// ============================================================================
// CORE WEB VITALS TRACKING
// ============================================================================

const metricHandlers: MetricHandler[] = [];

/**
 * Register a handler for performance metrics
 */
export function onMetric(handler: MetricHandler): () => void {
  metricHandlers.push(handler);
  return () => {
    const index = metricHandlers.indexOf(handler);
    if (index > -1) metricHandlers.splice(index, 1);
  };
}

/**
 * Emit a metric to all handlers
 */
function emitMetric(metric: PerformanceMetric): void {
  metricHandlers.forEach((handler) => {
    try {
      handler(metric);
    } catch (error) {
      console.error('[Performance] Metric handler error:', error);
    }
  });
}

/**
 * Initialize Core Web Vitals tracking
 *
 * @example
 * initCoreWebVitals((metric) => {
 *   analytics.track('web_vital', metric);
 * });
 */
export async function initCoreWebVitals(
  handler?: MetricHandler
): Promise<void> {
  if (typeof window === 'undefined') return;

  if (handler) {
    onMetric(handler);
  }

  try {
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

    const createHandler =
      (name: string) =>
      (metric: { value: number; rating: string; delta: number; id: string }) => {
        emitMetric({
          name,
          value: metric.value,
          rating: metric.rating as 'good' | 'needs-improvement' | 'poor',
          timestamp: Date.now(),
          context: {
            delta: metric.delta,
            id: metric.id,
          },
        });
      };

    onCLS(createHandler('CLS'));
    onFCP(createHandler('FCP'));
    onLCP(createHandler('LCP'));
    onTTFB(createHandler('TTFB'));
    onINP(createHandler('INP'));
  } catch (error) {
    console.warn('[Performance] Failed to initialize Web Vitals:', error);
  }
}

// ============================================================================
// CUSTOM PERFORMANCE MARKS
// ============================================================================

const marks = new Map<string, number>();

/**
 * Mark the start of a performance measurement
 *
 * @example
 * markStart('heavy-computation');
 * // ... do work
 * const duration = markEnd('heavy-computation');
 */
export function markStart(name: string, detail?: unknown): void {
  if (typeof performance === 'undefined') return;

  marks.set(name, performance.now());

  try {
    performance.mark(`${name}-start`, { detail });
  } catch {
    // Ignore if detail is not supported
    performance.mark(`${name}-start`);
  }
}

/**
 * Mark the end and measure duration
 */
export function markEnd(name: string, detail?: unknown): number {
  if (typeof performance === 'undefined') return 0;

  const startTime = marks.get(name);
  const endTime = performance.now();

  try {
    performance.mark(`${name}-end`, { detail });
  } catch {
    performance.mark(`${name}-end`);
  }

  if (startTime) {
    const duration = endTime - startTime;
    marks.delete(name);

    try {
      performance.measure(name, `${name}-start`, `${name}-end`);
    } catch {
      // Measure failed
    }

    return duration;
  }

  return 0;
}

/**
 * Measure a function execution time
 *
 * @example
 * const result = await measure('api-call', () => fetch('/api/data'));
 */
export async function measure<T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  markStart(name);
  try {
    const result = await fn();
    const duration = markEnd(name);
    return { result, duration };
  } catch (error) {
    markEnd(name);
    throw error;
  }
}

/**
 * Decorator for measuring method execution time
 *
 * @example
 * class MyService {
 *   @timed('fetchData')
 *   async fetchData() { ... }
 * }
 */
export function timed(name: string) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      markStart(name);
      try {
        const result = await original.apply(this, args);
        markEnd(name);
        return result;
      } catch (error) {
        markEnd(name);
        throw error;
      }
    };

    return descriptor;
  };
}

// ============================================================================
// RESOURCE TIMING
// ============================================================================

/**
 * Get resource timing entries
 */
export function getResourceTimings(): ResourceTiming[] {
  if (typeof performance === 'undefined') return [];

  const entries = performance.getEntriesByType(
    'resource'
  ) as PerformanceResourceTiming[];

  return entries.map((entry) => ({
    name: entry.name,
    initiatorType: entry.initiatorType,
    duration: entry.duration,
    transferSize: entry.transferSize,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize,
  }));
}

/**
 * Get total resource size by type
 */
export function getResourceSizeByType(): Record<string, number> {
  const timings = getResourceTimings();
  const sizes: Record<string, number> = {};

  timings.forEach((timing) => {
    const type = timing.initiatorType;
    sizes[type] = (sizes[type] || 0) + timing.transferSize;
  });

  return sizes;
}

/**
 * Get slowest resources
 */
export function getSlowestResources(limit = 10): ResourceTiming[] {
  const timings = getResourceTimings();
  return timings.sort((a, b) => b.duration - a.duration).slice(0, limit);
}

/**
 * Get largest resources
 */
export function getLargestResources(limit = 10): ResourceTiming[] {
  const timings = getResourceTimings();
  return timings.sort((a, b) => b.transferSize - a.transferSize).slice(0, limit);
}

// ============================================================================
// NAVIGATION TIMING
// ============================================================================

/**
 * Get navigation timing data
 */
export function getNavigationTiming(): NavigationTiming | null {
  if (typeof performance === 'undefined') return null;

  const entries = performance.getEntriesByType(
    'navigation'
  ) as PerformanceNavigationTiming[];
  const nav = entries[0];

  if (!nav) return null;

  return {
    domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
    domComplete: nav.domComplete - nav.startTime,
    loadComplete: nav.loadEventEnd - nav.startTime,
    ttfb: nav.responseStart - nav.requestStart,
    dns: nav.domainLookupEnd - nav.domainLookupStart,
    tcp: nav.connectEnd - nav.connectStart,
    tls: nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0,
  };
}

// ============================================================================
// BUDGET CHECKING
// ============================================================================

/**
 * Check performance against budget
 */
export function checkBudget(
  metrics: Record<string, number>,
  budget: Partial<PerformanceBudget> = DEFAULT_PERFORMANCE_BUDGET
): BudgetViolation[] {
  const violations: BudgetViolation[] = [];
  const fullBudget = { ...DEFAULT_PERFORMANCE_BUDGET, ...budget };

  const check = (metric: string, value: number, budgetValue: number) => {
    if (value > budgetValue) {
      const overBy = value - budgetValue;
      const percentOver = (overBy / budgetValue) * 100;
      violations.push({
        metric,
        budget: budgetValue,
        actual: value,
        overBy,
        severity: percentOver > 50 ? 'critical' : 'warning',
      });
    }
  };

  if (metrics.lcp !== undefined) check('LCP', metrics.lcp, fullBudget.lcp);
  if (metrics.fid !== undefined) check('FID', metrics.fid, fullBudget.fid);
  if (metrics.inp !== undefined) check('INP', metrics.inp, fullBudget.inp);
  if (metrics.cls !== undefined) check('CLS', metrics.cls, fullBudget.cls);
  if (metrics.fcp !== undefined) check('FCP', metrics.fcp, fullBudget.fcp);
  if (metrics.ttfb !== undefined) check('TTFB', metrics.ttfb, fullBudget.ttfb);
  if (metrics.bundleSize !== undefined) check('bundleSize', metrics.bundleSize, fullBudget.bundleSize);
  if (metrics.jsSize !== undefined) check('jsSize', metrics.jsSize, fullBudget.jsSize);
  if (metrics.cssSize !== undefined) check('cssSize', metrics.cssSize, fullBudget.cssSize);

  return violations;
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate a complete performance report
 */
export function generateReport(): PerformanceReport {
  const resourceTimings = getResourceTimings();
  const navigationTiming = getNavigationTiming();

  // Get all marks and measures
  const perfMarks = performance.getEntriesByType('mark').map((m) => ({
    name: m.name,
    startTime: m.startTime,
    duration: m.duration,
  }));

  const perfMeasures = performance.getEntriesByType('measure').map((m) => ({
    name: m.name,
    startTime: m.startTime,
    duration: m.duration,
  }));

  // Calculate sizes
  const sizes = getResourceSizeByType();
  const jsSize = sizes.script || 0;
  const cssSize = sizes.css || 0;
  const bundleSize = jsSize + cssSize;

  // Check budget
  const budgetViolations = checkBudget({
    bundleSize,
    jsSize,
    cssSize,
    ttfb: navigationTiming?.ttfb || 0,
  });

  return {
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    metrics: [], // Filled by web vitals callbacks
    marks: perfMarks,
    measures: perfMeasures,
    resources: resourceTimings,
    navigation: navigationTiming,
    budgetViolations,
  };
}

/**
 * Send performance report to analytics
 */
export function sendReport(
  report: PerformanceReport,
  endpoint: string
): Promise<void> {
  if (typeof navigator === 'undefined') return Promise.resolve();

  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    const success = navigator.sendBeacon(endpoint, JSON.stringify(report));
    return Promise.resolve(success ? undefined : undefined);
  }

  // Fallback to fetch with keepalive
  return fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(report),
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
  }).then(() => undefined);
}

// ============================================================================
// LONG TASK DETECTION
// ============================================================================

/**
 * Monitor for long tasks (tasks > 50ms)
 *
 * @example
 * const cleanup = observeLongTasks((task) => {
 *   console.warn('Long task detected:', task);
 * });
 */
export function observeLongTasks(
  callback: (entry: PerformanceEntry) => void
): () => void {
  if (typeof PerformanceObserver === 'undefined') return () => {};

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry);
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
    return () => observer.disconnect();
  } catch {
    // Long task observation not supported
    return () => {};
  }
}

/**
 * Monitor for layout shifts
 */
export function observeLayoutShifts(
  callback: (entry: PerformanceEntry & { value?: number }) => void
): () => void {
  if (typeof PerformanceObserver === 'undefined') return () => {};

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry as PerformanceEntry & { value?: number });
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    return () => observer.disconnect();
  } catch {
    return () => {};
  }
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

/**
 * Log performance summary to console
 */
export function logPerformanceSummary(): void {
  if (typeof console === 'undefined') return;

  const nav = getNavigationTiming();
  const sizes = getResourceSizeByType();
  const slowest = getSlowestResources(5);

  console.group('[Performance Summary]');

  if (nav) {
    console.log('Navigation Timing:');
    console.table({
      'TTFB': `${nav.ttfb.toFixed(0)}ms`,
      'DOM Content Loaded': `${nav.domContentLoaded.toFixed(0)}ms`,
      'DOM Complete': `${nav.domComplete.toFixed(0)}ms`,
      'Load Complete': `${nav.loadComplete.toFixed(0)}ms`,
    });
  }

  console.log('Resource Sizes by Type:');
  console.table(
    Object.entries(sizes).reduce(
      (acc, [type, size]) => {
        acc[type] = `${(size / 1024).toFixed(2)} KB`;
        return acc;
      },
      {} as Record<string, string>
    )
  );

  console.log('Slowest Resources:');
  console.table(
    slowest.map((r) => ({
      name: r.name.split('/').pop(),
      duration: `${r.duration.toFixed(0)}ms`,
      size: `${(r.transferSize / 1024).toFixed(2)} KB`,
    }))
  );

  console.groupEnd();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Constants
  CORE_WEB_VITALS_THRESHOLDS,
  DEFAULT_PERFORMANCE_BUDGET,
  // Rating
  getMetricRating,
  // Core Web Vitals
  initCoreWebVitals,
  onMetric,
  // Marks and Measures
  markStart,
  markEnd,
  measure,
  timed,
  // Resource Timing
  getResourceTimings,
  getResourceSizeByType,
  getSlowestResources,
  getLargestResources,
  // Navigation Timing
  getNavigationTiming,
  // Budget
  checkBudget,
  // Reporting
  generateReport,
  sendReport,
  // Observers
  observeLongTasks,
  observeLayoutShifts,
  // Development
  logPerformanceSummary,
};
