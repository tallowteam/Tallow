/**
 * Lighthouse Performance Configuration and Core Web Vitals Tracking
 *
 * Real-time performance monitoring with Lighthouse-aligned metrics
 * and automated performance issue detection.
 *
 * @module lib/performance/lighthouse-config
 */

// ============================================================================
// TYPES
// ============================================================================

export interface LighthouseTargets {
  /** First Contentful Paint (ms) */
  fcp: number;
  /** Largest Contentful Paint (ms) */
  lcp: number;
  /** Time to Interactive (ms) */
  tti: number;
  /** Total Blocking Time (ms) */
  tbt: number;
  /** Cumulative Layout Shift (score) */
  cls: number;
  /** Speed Index (ms) */
  si: number;
  /** First Input Delay (ms) - legacy */
  fid: number;
  /** Interaction to Next Paint (ms) */
  inp: number;
}

export interface PerformanceReport {
  timestamp: number;
  url: string;
  metrics: CoreWebVitalsMetrics;
  score: number;
  rating: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  issues: PerformanceIssue[];
  opportunities: PerformanceOpportunity[];
  diagnostics: PerformanceDiagnostics;
}

export interface CoreWebVitalsMetrics {
  fcp?: number;
  lcp?: number;
  tti?: number;
  tbt?: number;
  cls?: number;
  si?: number;
  fid?: number;
  inp?: number;
  ttfb?: number;
}

export interface PerformanceIssue {
  metric: string;
  value: number;
  target: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  solution: string;
}

export interface PerformanceOpportunity {
  title: string;
  description: string;
  estimatedSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'low' | 'medium' | 'high';
}

export interface PerformanceDiagnostics {
  largestContentfulElement: string | null;
  totalBlockingTime: number;
  layoutShiftElements: string[];
  longTasks: number;
  resourcesCount: number;
  resourcesSize: number;
  mainThreadWork: number;
}

// ============================================================================
// LIGHTHOUSE PERFORMANCE TARGETS
// ============================================================================

/**
 * Lighthouse performance targets based on Google recommendations
 *
 * These represent "good" thresholds for Core Web Vitals.
 * Meeting these targets typically results in a Lighthouse score of 90+.
 */
export const LIGHTHOUSE_TARGETS: LighthouseTargets = {
  // First Contentful Paint - when first content appears
  fcp: 1500, // < 1.5s is good

  // Largest Contentful Paint - when main content is visible
  lcp: 2500, // < 2.5s is good

  // Time to Interactive - when page is fully interactive
  tti: 3000, // < 3.0s is good

  // Total Blocking Time - sum of blocking time from long tasks
  tbt: 200, // < 200ms is good

  // Cumulative Layout Shift - visual stability score
  cls: 0.1, // < 0.1 is good

  // Speed Index - how quickly content is visually displayed
  si: 3000, // < 3.0s is good

  // First Input Delay - responsiveness to first interaction (legacy)
  fid: 100, // < 100ms is good

  // Interaction to Next Paint - responsiveness metric
  inp: 200, // < 200ms is good
};

/**
 * Stricter targets for high-performance applications
 */
export const STRICT_LIGHTHOUSE_TARGETS: LighthouseTargets = {
  fcp: 1000,
  lcp: 1800,
  tti: 2500,
  tbt: 150,
  cls: 0.05,
  si: 2000,
  fid: 50,
  inp: 100,
};

/**
 * Relaxed targets for content-heavy applications
 */
export const RELAXED_LIGHTHOUSE_TARGETS: LighthouseTargets = {
  fcp: 2000,
  lcp: 3500,
  tti: 4000,
  tbt: 300,
  cls: 0.15,
  si: 4000,
  fid: 150,
  inp: 300,
};

// ============================================================================
// CORE WEB VITALS TRACKING
// ============================================================================

const metricsCache: CoreWebVitalsMetrics = {};
let observers: PerformanceObserver[] = [];

/**
 * Check Core Web Vitals using PerformanceObserver API
 *
 * @example
 * const report = await checkVitals();
 * console.log(`LCP: ${report.metrics.lcp}ms`);
 */
export async function checkVitals(
  targets: LighthouseTargets = LIGHTHOUSE_TARGETS
): Promise<PerformanceReport> {
  if (typeof window === 'undefined') {
    return createEmptyReport();
  }

  // Initialize metrics collection
  await collectMetrics();

  // Calculate performance score
  const score = calculatePerformanceScore(metricsCache, targets);
  const rating = getPerformanceRating(score);

  // Identify issues
  const issues = identifyIssues(metricsCache, targets);

  // Generate opportunities
  const opportunities = generateOpportunities(metricsCache, issues);

  // Collect diagnostics
  const diagnostics = collectDiagnostics();

  return {
    timestamp: Date.now(),
    url: window.location.href,
    metrics: { ...metricsCache },
    score,
    rating,
    issues,
    opportunities,
    diagnostics,
  };
}

/**
 * Collect metrics using PerformanceObserver
 */
async function collectMetrics(): Promise<void> {
  // Clear previous observers
  cleanupObservers();

  // Collect paint timings (FCP)
  if ('PerformanceObserver' in window) {
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            metricsCache.fcp = entry.startTime;
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      observers.push(paintObserver);
    } catch {
      // Paint timing not supported
    }

    // Collect largest contentful paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number;
          loadTime?: number;
        };
        metricsCache.lcp = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observers.push(lcpObserver);
    } catch {
      // LCP not supported
    }

    // Collect layout shifts (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<
          PerformanceEntry & { value?: number; hadRecentInput?: boolean }
        >) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value || 0;
            metricsCache.cls = clsValue;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observers.push(clsObserver);
    } catch {
      // Layout shift not supported
    }
  }

  // Use web-vitals library for accurate measurements
  try {
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

    onFCP((metric) => {
      metricsCache.fcp = metric.value;
    });

    onLCP((metric) => {
      metricsCache.lcp = metric.value;
    });

    onCLS((metric) => {
      metricsCache.cls = metric.value;
    });

    onTTFB((metric) => {
      metricsCache.ttfb = metric.value;
    });

    onINP((metric) => {
      metricsCache.inp = metric.value;
    });
  } catch {
    // web-vitals not available
  }

  // Calculate derived metrics
  calculateDerivedMetrics();
}

/**
 * Calculate derived metrics (TTI, TBT, SI)
 */
function calculateDerivedMetrics(): void {
  if (typeof performance === 'undefined') {return;}

  // Time to Interactive (TTI) - approximate using navigation timing
  const navEntries = performance.getEntriesByType(
    'navigation'
  ) as PerformanceNavigationTiming[];
  if (navEntries.length > 0) {
    const nav = navEntries[0];
    if (nav) {
      metricsCache.tti = nav.domInteractive - nav.fetchStart;
    }
  }

  // Total Blocking Time (TBT) - sum of long task durations
  const longTasks = performance.getEntriesByType('longtask');
  metricsCache.tbt = longTasks.reduce((sum, task) => {
    const blockingTime = Math.max(0, task.duration - 50);
    return sum + blockingTime;
  }, 0);

  // Speed Index - approximate from paint timings
  // This is a simplified calculation; real SI requires video analysis
  if (metricsCache.fcp && metricsCache.lcp) {
    metricsCache.si = (metricsCache.fcp + metricsCache.lcp) / 2;
  }
}

/**
 * Cleanup performance observers
 */
function cleanupObservers(): void {
  observers.forEach((observer) => observer.disconnect());
  observers = [];
}

// ============================================================================
// PERFORMANCE SCORING
// ============================================================================

/**
 * Calculate overall performance score (0-100)
 *
 * Weighted scoring based on Lighthouse methodology:
 * - LCP: 25%
 * - TBT: 30%
 * - FCP: 10%
 * - SI: 10%
 * - CLS: 25%
 */
function calculatePerformanceScore(
  metrics: CoreWebVitalsMetrics,
  targets: LighthouseTargets
): number {
  const scores: number[] = [];
  const weights: number[] = [];

  // FCP score (10%)
  if (metrics.fcp !== undefined) {
    scores.push(getMetricScore(metrics.fcp, targets.fcp, 0.5));
    weights.push(0.1);
  }

  // LCP score (25%)
  if (metrics.lcp !== undefined) {
    scores.push(getMetricScore(metrics.lcp, targets.lcp, 0.5));
    weights.push(0.25);
  }

  // TBT score (30%)
  if (metrics.tbt !== undefined) {
    scores.push(getMetricScore(metrics.tbt, targets.tbt, 0.5));
    weights.push(0.3);
  }

  // SI score (10%)
  if (metrics.si !== undefined) {
    scores.push(getMetricScore(metrics.si, targets.si, 0.5));
    weights.push(0.1);
  }

  // CLS score (25%)
  if (metrics.cls !== undefined) {
    scores.push(getMetricScore(metrics.cls, targets.cls, 0.5));
    weights.push(0.25);
  }

  // Weighted average
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const weightedSum = scores.reduce((sum, score, i) => sum + score * (weights[i] ?? 0), 0);

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Calculate score for individual metric (0-100)
 */
function getMetricScore(
  value: number,
  target: number,
  poorMultiplier: number
): number {
  const poorThreshold = target * (1 + poorMultiplier);

  if (value <= target) {
    // Good: 90-100
    return 90 + (10 * (target - value)) / target;
  } else if (value <= poorThreshold) {
    // Needs improvement: 50-89
    return 50 + (40 * (poorThreshold - value)) / (poorThreshold - target);
  } else {
    // Poor: 0-49
    return Math.max(0, 50 - (50 * (value - poorThreshold)) / poorThreshold);
  }
}

/**
 * Get performance rating from score
 */
function getPerformanceRating(
  score: number
): 'excellent' | 'good' | 'needs-improvement' | 'poor' {
  if (score >= 95) {return 'excellent';}
  if (score >= 90) {return 'good';}
  if (score >= 50) {return 'needs-improvement';}
  return 'poor';
}

// ============================================================================
// ISSUE IDENTIFICATION
// ============================================================================

/**
 * Identify performance issues
 */
function identifyIssues(
  metrics: CoreWebVitalsMetrics,
  targets: LighthouseTargets
): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  // Check FCP
  if (metrics.fcp && metrics.fcp > targets.fcp) {
    const severity = getSeverity(metrics.fcp, targets.fcp, 0.5);
    issues.push({
      metric: 'FCP',
      value: metrics.fcp,
      target: targets.fcp,
      severity,
      impact: 'Users see a blank page for too long',
      solution:
        'Optimize server response time, eliminate render-blocking resources, inline critical CSS',
    });
  }

  // Check LCP
  if (metrics.lcp && metrics.lcp > targets.lcp) {
    const severity = getSeverity(metrics.lcp, targets.lcp, 0.5);
    issues.push({
      metric: 'LCP',
      value: metrics.lcp,
      target: targets.lcp,
      severity,
      impact: 'Main content loads too slowly',
      solution:
        'Optimize largest image/element, preload key resources, reduce server response time',
    });
  }

  // Check TTI
  if (metrics.tti && metrics.tti > targets.tti) {
    const severity = getSeverity(metrics.tti, targets.tti, 0.5);
    issues.push({
      metric: 'TTI',
      value: metrics.tti,
      target: targets.tti,
      severity,
      impact: 'Page takes too long to become interactive',
      solution: 'Reduce JavaScript execution time, split bundles, defer non-critical scripts',
    });
  }

  // Check TBT
  if (metrics.tbt && metrics.tbt > targets.tbt) {
    const severity = getSeverity(metrics.tbt, targets.tbt, 0.5);
    issues.push({
      metric: 'TBT',
      value: metrics.tbt,
      target: targets.tbt,
      severity,
      impact: 'Main thread is blocked, causing poor responsiveness',
      solution:
        'Break up long tasks, use web workers, optimize JavaScript execution',
    });
  }

  // Check CLS
  if (metrics.cls && metrics.cls > targets.cls) {
    const severity = getSeverity(metrics.cls, targets.cls, 0.5);
    issues.push({
      metric: 'CLS',
      value: metrics.cls,
      target: targets.cls,
      severity,
      impact: 'Content shifts unexpectedly, poor visual stability',
      solution:
        'Add width/height to images, reserve space for ads, avoid inserting content above existing content',
    });
  }

  // Check INP
  if (metrics.inp && metrics.inp > targets.inp) {
    const severity = getSeverity(metrics.inp, targets.inp, 0.5);
    issues.push({
      metric: 'INP',
      value: metrics.inp,
      target: targets.inp,
      severity,
      impact: 'Interactions respond too slowly',
      solution:
        'Optimize event handlers, reduce main thread work, use passive event listeners',
    });
  }

  return issues.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

/**
 * Get severity level for metric
 */
function getSeverity(
  value: number,
  target: number,
  poorMultiplier: number
): 'low' | 'medium' | 'high' | 'critical' {
  const poorThreshold = target * (1 + poorMultiplier);
  const criticalThreshold = poorThreshold * 1.5;

  if (value > criticalThreshold) {return 'critical';}
  if (value > poorThreshold) {return 'high';}
  if (value > target * 1.2) {return 'medium';}
  return 'low';
}

// ============================================================================
// OPTIMIZATION OPPORTUNITIES
// ============================================================================

/**
 * Generate performance optimization opportunities
 */
function generateOpportunities(
  _metrics: CoreWebVitalsMetrics,
  issues: PerformanceIssue[]
): PerformanceOpportunity[] {
  const opportunities: PerformanceOpportunity[] = [];

  // High-impact opportunities based on issues
  if (issues.some((i) => i.metric === 'LCP')) {
    opportunities.push({
      title: 'Optimize Largest Contentful Paint',
      description: 'Preload LCP image, optimize image format (WebP/AVIF), use CDN',
      estimatedSavings: 1000,
      difficulty: 'medium',
      priority: 'high',
    });
  }

  if (issues.some((i) => i.metric === 'TBT')) {
    opportunities.push({
      title: 'Reduce JavaScript Execution Time',
      description: 'Code split, lazy load non-critical features, minify bundles',
      estimatedSavings: 500,
      difficulty: 'medium',
      priority: 'high',
    });
  }

  if (issues.some((i) => i.metric === 'CLS')) {
    opportunities.push({
      title: 'Improve Visual Stability',
      description: 'Set image dimensions, reserve space for dynamic content',
      estimatedSavings: 0.05,
      difficulty: 'easy',
      priority: 'high',
    });
  }

  // General opportunities
  opportunities.push(
    {
      title: 'Enable Text Compression',
      description: 'Enable Gzip/Brotli compression for text resources',
      estimatedSavings: 300,
      difficulty: 'easy',
      priority: 'medium',
    },
    {
      title: 'Implement Resource Hints',
      description: 'Add preconnect, dns-prefetch, prefetch for key resources',
      estimatedSavings: 200,
      difficulty: 'easy',
      priority: 'medium',
    },
    {
      title: 'Optimize Critical Rendering Path',
      description: 'Inline critical CSS, defer non-critical CSS',
      estimatedSavings: 400,
      difficulty: 'medium',
      priority: 'high',
    },
    {
      title: 'Implement Service Worker',
      description: 'Cache assets for faster repeat visits',
      estimatedSavings: 800,
      difficulty: 'hard',
      priority: 'medium',
    }
  );

  return opportunities.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

/**
 * Collect performance diagnostics
 */
function collectDiagnostics(): PerformanceDiagnostics {
  const diagnostics: PerformanceDiagnostics = {
    largestContentfulElement: null,
    totalBlockingTime: 0,
    layoutShiftElements: [],
    longTasks: 0,
    resourcesCount: 0,
    resourcesSize: 0,
    mainThreadWork: 0,
  };

  if (typeof performance === 'undefined') {return diagnostics;}

  // Get LCP element
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  if (lcpEntries.length > 0) {
    const lastEntry = lcpEntries[lcpEntries.length - 1] as PerformanceEntry & {
      element?: Element;
    };
    if (lastEntry.element) {
      diagnostics.largestContentfulElement = getElementSelector(lastEntry.element);
    }
  }

  // Count long tasks
  const longTasks = performance.getEntriesByType('longtask');
  diagnostics.longTasks = longTasks.length;
  diagnostics.totalBlockingTime = longTasks.reduce((sum, task) => {
    return sum + Math.max(0, task.duration - 50);
  }, 0);

  // Resource statistics
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  diagnostics.resourcesCount = resources.length;
  diagnostics.resourcesSize = resources.reduce(
    (sum, r) => sum + (r.transferSize || 0),
    0
  );

  // Main thread work (approximate)
  const measures = performance.getEntriesByType('measure');
  diagnostics.mainThreadWork = measures.reduce((sum, m) => sum + m.duration, 0);

  return diagnostics;
}

/**
 * Get CSS selector for element
 */
function getElementSelector(element: Element): string {
  if (element.id) {return `#${element.id}`;}
  if (element.className) {
    const classes = element.className.split(' ').filter(Boolean);
    if (classes.length > 0) {return `.${classes[0]}`;}
  }
  return element.tagName.toLowerCase();
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create empty report for SSR/SSG
 */
function createEmptyReport(): PerformanceReport {
  return {
    timestamp: Date.now(),
    url: '',
    metrics: {},
    score: 0,
    rating: 'poor',
    issues: [],
    opportunities: [],
    diagnostics: {
      largestContentfulElement: null,
      totalBlockingTime: 0,
      layoutShiftElements: [],
      longTasks: 0,
      resourcesCount: 0,
      resourcesSize: 0,
      mainThreadWork: 0,
    },
  };
}

/**
 * Log performance report to console
 */
export function logPerformanceReport(report: PerformanceReport): void {
  console.group('[Performance Report]');

  console.log(`Score: ${report.score}/100 (${report.rating})`);

  console.log('Core Web Vitals:');
  console.table({
    'FCP': report.metrics.fcp ? `${report.metrics.fcp.toFixed(0)}ms` : 'N/A',
    'LCP': report.metrics.lcp ? `${report.metrics.lcp.toFixed(0)}ms` : 'N/A',
    'TTI': report.metrics.tti ? `${report.metrics.tti.toFixed(0)}ms` : 'N/A',
    'TBT': report.metrics.tbt ? `${report.metrics.tbt.toFixed(0)}ms` : 'N/A',
    'CLS': report.metrics.cls ? report.metrics.cls.toFixed(3) : 'N/A',
    'INP': report.metrics.inp ? `${report.metrics.inp.toFixed(0)}ms` : 'N/A',
  });

  if (report.issues.length > 0) {
    console.warn(`${report.issues.length} Issues Found:`);
    console.table(
      report.issues.map((i) => ({
        Metric: i.metric,
        Severity: i.severity,
        Value: i.value,
        Target: i.target,
        Impact: i.impact,
      }))
    );
  }

  if (report.opportunities.length > 0) {
    console.log('Optimization Opportunities:');
    report.opportunities.slice(0, 5).forEach((o, i) => {
      console.log(
        `${i + 1}. [${o.priority.toUpperCase()}] ${o.title} - ${o.description}`
      );
    });
  }

  console.groupEnd();
}

/**
 * Start real-time monitoring
 */
export function startMonitoring(
  callback: (report: PerformanceReport) => void,
  intervalMs = 10000
): () => void {
  const interval = setInterval(async () => {
    const report = await checkVitals();
    callback(report);
  }, intervalMs);

  // Initial check
  checkVitals().then(callback);

  return () => {
    clearInterval(interval);
    cleanupObservers();
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  LIGHTHOUSE_TARGETS,
  STRICT_LIGHTHOUSE_TARGETS,
  RELAXED_LIGHTHOUSE_TARGETS,
  checkVitals,
  logPerformanceReport,
  startMonitoring,
};
