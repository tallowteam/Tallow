/**
 * Web Vitals Tracking
 *
 * Tracks Core Web Vitals (CLS, FID, LCP, TTFB, INP) using the web-vitals
 * library. Logs metrics in development and exports a reportWebVitals
 * function compatible with Next.js instrumentation.
 *
 * @module lib/performance/web-vitals
 */

// ============================================================================
// TYPES
// ============================================================================

export interface WebVitalMetric {
  /** Metric name: CLS, FID, LCP, TTFB, INP, FCP */
  name: 'CLS' | 'FID' | 'LCP' | 'TTFB' | 'INP' | 'FCP';
  /** The metric value */
  value: number;
  /** Rating based on Google thresholds */
  rating: 'good' | 'needs-improvement' | 'poor';
  /** Delta since last report */
  delta: number;
  /** Unique metric ID */
  id: string;
  /** Navigation type */
  navigationType?: string;
}

export type WebVitalHandler = (metric: WebVitalMetric) => void;

// ============================================================================
// THRESHOLDS (Google recommendations)
// ============================================================================

const THRESHOLDS: Record<string, { good: number; poor: number; unit: string }> = {
  CLS: { good: 0.1, poor: 0.25, unit: '' },
  FID: { good: 100, poor: 300, unit: 'ms' },
  LCP: { good: 2500, poor: 4000, unit: 'ms' },
  TTFB: { good: 800, poor: 1800, unit: 'ms' },
  INP: { good: 200, poor: 500, unit: 'ms' },
  FCP: { good: 1800, poor: 3000, unit: 'ms' },
};

// ============================================================================
// DEVELOPMENT CONSOLE LOGGING
// ============================================================================

const RATING_COLORS: Record<string, string> = {
  good: '#0CCE6B',
  'needs-improvement': '#FFA400',
  poor: '#FF4E42',
};

/**
 * Format a metric value for display with appropriate precision.
 */
function formatValue(name: string, value: number): string {
  const threshold = THRESHOLDS[name];
  if (!threshold) {
    return value.toFixed(2);
  }

  if (name === 'CLS') {
    return value.toFixed(3);
  }

  return `${Math.round(value)}${threshold.unit}`;
}

/**
 * Log a Web Vital metric to the console with color-coded rating.
 * Only active in development mode.
 */
function logMetricToConsole(metric: WebVitalMetric): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const color = RATING_COLORS[metric.rating] || '#999';
  const threshold = THRESHOLDS[metric.name];
  const formattedValue = formatValue(metric.name, metric.value);

  const thresholdInfo = threshold
    ? ` (good: <${formatValue(metric.name, threshold.good)}, poor: >${formatValue(metric.name, threshold.poor)})`
    : '';

  console.log(
    `%c[Web Vitals] ${metric.name}: ${formattedValue} (${metric.rating})${thresholdInfo}`,
    `color: ${color}; font-weight: bold;`
  );
}

// ============================================================================
// METRIC COLLECTION
// ============================================================================

const collectedMetrics: WebVitalMetric[] = [];
const handlers: WebVitalHandler[] = [];

/**
 * Register a handler to receive web vital metrics.
 * Returns a cleanup function to unregister.
 */
export function onWebVital(handler: WebVitalHandler): () => void {
  handlers.push(handler);
  return () => {
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  };
}

/**
 * Get all collected metrics so far.
 */
export function getCollectedMetrics(): ReadonlyArray<WebVitalMetric> {
  return collectedMetrics;
}

/**
 * Internal: process a metric from web-vitals library.
 */
function processMetric(rawMetric: {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
  navigationType?: string;
}): void {
  const metric: WebVitalMetric = {
    name: rawMetric.name as WebVitalMetric['name'],
    value: rawMetric.value,
    rating: rawMetric.rating as WebVitalMetric['rating'],
    delta: rawMetric.delta,
    id: rawMetric.id,
    ...(rawMetric.navigationType !== undefined ? { navigationType: rawMetric.navigationType } : {}),
  };

  collectedMetrics.push(metric);

  // Log in development
  logMetricToConsole(metric);

  // Notify all registered handlers
  for (const handler of handlers) {
    try {
      handler(metric);
    } catch {
      // Swallow handler errors to avoid breaking metric collection
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

let initialized = false;

/**
 * Initialize Core Web Vitals tracking.
 * Dynamically imports the web-vitals library to avoid increasing the
 * initial bundle size. Safe to call multiple times (idempotent).
 *
 * @example
 * // In a client component or useEffect:
 * import { initWebVitals } from '@/lib/performance/web-vitals';
 * initWebVitals();
 *
 * @example
 * // With a custom handler for analytics:
 * initWebVitals((metric) => {
 *   analytics.track('web_vital', {
 *     name: metric.name,
 *     value: metric.value,
 *     rating: metric.rating,
 *   });
 * });
 */
export async function initWebVitals(handler?: WebVitalHandler): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  if (handler) {
    onWebVital(handler);
  }

  if (initialized) {
    return;
  }

  initialized = true;

  try {
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

    onCLS(processMetric);
    onFCP(processMetric);
    onLCP(processMetric);
    onTTFB(processMetric);
    onINP(processMetric);
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Web Vitals] Failed to initialize. Is web-vitals installed?');
    }
  }
}

// ============================================================================
// NEXT.JS REPORT WEB VITALS
// ============================================================================

/**
 * Next.js compatible reportWebVitals export.
 * Use this in your instrumentation or layout to automatically
 * track Core Web Vitals.
 *
 * @example
 * // app/layout.tsx or instrumentation.ts
 * export { reportWebVitals } from '@/lib/performance/web-vitals';
 */
export function reportWebVitals(metric: {
  id: string;
  name: string;
  startTime: number;
  value: number;
  label: 'web-vital' | 'custom';
}): void {
  if (metric.label !== 'web-vital') {
    return;
  }

  const threshold = THRESHOLDS[metric.name];
  let rating: WebVitalMetric['rating'] = 'needs-improvement';

  if (threshold) {
    if (metric.value <= threshold.good) {
      rating = 'good';
    } else if (metric.value > threshold.poor) {
      rating = 'poor';
    }
  }

  processMetric({
    name: metric.name,
    value: metric.value,
    rating,
    delta: metric.value,
    id: metric.id,
  });
}

// ============================================================================
// PERFORMANCE SUMMARY
// ============================================================================

/**
 * Get a summary of all collected Web Vitals.
 * Useful for sending a batch report at the end of a session.
 */
export function getWebVitalsSummary(): Record<string, {
  value: number;
  rating: string;
  formatted: string;
}> {
  const summary: Record<string, {
    value: number;
    rating: string;
    formatted: string;
  }> = {};

  // Use the latest value for each metric
  for (const metric of collectedMetrics) {
    summary[metric.name] = {
      value: metric.value,
      rating: metric.rating,
      formatted: formatValue(metric.name, metric.value),
    };
  }

  return summary;
}
