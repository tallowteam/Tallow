/**
 * Performance Budget Configuration
 *
 * Defines target metrics and provides budget enforcement utilities.
 * Based on Google's Core Web Vitals recommendations and industry best practices.
 *
 * @module lib/performance/budget
 */

// ============================================================================
// PERFORMANCE BUDGET CONFIGURATION
// ============================================================================

/**
 * Core Web Vitals Budget
 *
 * Based on Google's "Good" thresholds:
 * - LCP: < 2.5s (Largest Contentful Paint)
 * - FID: < 100ms (First Input Delay) - deprecated
 * - INP: < 200ms (Interaction to Next Paint)
 * - CLS: < 0.1 (Cumulative Layout Shift)
 *
 * Additional metrics:
 * - FCP: < 1.8s (First Contentful Paint)
 * - TTFB: < 800ms (Time to First Byte)
 */
export const CORE_WEB_VITALS_BUDGET = {
  // Largest Contentful Paint (milliseconds)
  // Target: < 2.5s for "good", < 4s for "needs improvement"
  LCP: {
    target: 2500,
    warning: 3500,
    critical: 4000,
  },

  // First Input Delay (milliseconds) - deprecated, use INP
  FID: {
    target: 100,
    warning: 200,
    critical: 300,
  },

  // Interaction to Next Paint (milliseconds)
  // Replaces FID as of March 2024
  INP: {
    target: 200,
    warning: 400,
    critical: 500,
  },

  // Cumulative Layout Shift (score, unitless)
  // Target: < 0.1 for "good", < 0.25 for "needs improvement"
  CLS: {
    target: 0.1,
    warning: 0.2,
    critical: 0.25,
  },

  // First Contentful Paint (milliseconds)
  FCP: {
    target: 1800,
    warning: 2500,
    critical: 3000,
  },

  // Time to First Byte (milliseconds)
  TTFB: {
    target: 800,
    warning: 1200,
    critical: 1800,
  },
} as const;

/**
 * Bundle Size Budget
 *
 * Targets for JavaScript and CSS bundle sizes.
 * Based on mobile-first approach with 3G network consideration.
 */
export const BUNDLE_SIZE_BUDGET = {
  // Total JavaScript budget (bytes)
  // Target: ~150KB compressed for fast 3G load
  javascript: {
    target: 150 * 1024, // 150KB
    warning: 200 * 1024, // 200KB
    critical: 250 * 1024, // 250KB
  },

  // Initial JavaScript (first load)
  initialJS: {
    target: 100 * 1024, // 100KB
    warning: 130 * 1024, // 130KB
    critical: 170 * 1024, // 170KB
  },

  // Total CSS budget (bytes)
  css: {
    target: 50 * 1024, // 50KB
    warning: 75 * 1024, // 75KB
    critical: 100 * 1024, // 100KB
  },

  // Total bundle (JS + CSS)
  total: {
    target: 200 * 1024, // 200KB
    warning: 275 * 1024, // 275KB
    critical: 350 * 1024, // 350KB
  },

  // Individual chunk size
  chunkSize: {
    target: 50 * 1024, // 50KB
    warning: 75 * 1024, // 75KB
    critical: 100 * 1024, // 100KB
  },

  // Images (per image)
  image: {
    target: 100 * 1024, // 100KB
    warning: 200 * 1024, // 200KB
    critical: 500 * 1024, // 500KB
  },

  // Fonts (total)
  fonts: {
    target: 100 * 1024, // 100KB
    warning: 150 * 1024, // 150KB
    critical: 200 * 1024, // 200KB
  },
} as const;

/**
 * Resource Count Budget
 *
 * Limits on number of resources to reduce HTTP overhead.
 */
export const RESOURCE_COUNT_BUDGET = {
  // Total HTTP requests
  requests: {
    target: 50,
    warning: 75,
    critical: 100,
  },

  // JavaScript files
  scripts: {
    target: 10,
    warning: 15,
    critical: 20,
  },

  // CSS files
  stylesheets: {
    target: 3,
    warning: 5,
    critical: 8,
  },

  // Font files
  fonts: {
    target: 4,
    warning: 6,
    critical: 10,
  },

  // Third-party requests
  thirdParty: {
    target: 10,
    warning: 15,
    critical: 25,
  },
} as const;

/**
 * Page-Specific Budgets
 *
 * Different pages may have different requirements.
 */
export const PAGE_BUDGETS = {
  // Landing page - optimized for conversion
  landing: {
    LCP: 2000,
    CLS: 0.05,
    initialJS: 80 * 1024,
    totalRequests: 30,
  },

  // App page - may be heavier due to functionality
  app: {
    LCP: 2500,
    CLS: 0.1,
    initialJS: 150 * 1024,
    totalRequests: 50,
  },

  // Settings/static pages
  static: {
    LCP: 1500,
    CLS: 0.05,
    initialJS: 50 * 1024,
    totalRequests: 20,
  },
} as const;

// ============================================================================
// BUDGET CHECKING UTILITIES
// ============================================================================

export type BudgetStatus = 'pass' | 'warning' | 'fail';

export interface BudgetResult {
  metric: string;
  value: number;
  target: number;
  warning: number;
  critical: number;
  status: BudgetStatus;
  delta: number;
  deltaPercent: number;
}

/**
 * Check a value against a budget
 */
export function checkBudgetValue(
  metric: string,
  value: number,
  budget: { target: number; warning: number; critical: number }
): BudgetResult {
  let status: BudgetStatus = 'pass';
  if (value > budget.critical) {
    status = 'fail';
  } else if (value > budget.warning) {
    status = 'warning';
  }

  return {
    metric,
    value,
    target: budget.target,
    warning: budget.warning,
    critical: budget.critical,
    status,
    delta: value - budget.target,
    deltaPercent: ((value - budget.target) / budget.target) * 100,
  };
}

/**
 * Check all Core Web Vitals against budget
 */
export function checkWebVitalsBudget(metrics: {
  lcp?: number;
  fid?: number;
  inp?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}): BudgetResult[] {
  const results: BudgetResult[] = [];

  if (metrics.lcp !== undefined) {
    results.push(checkBudgetValue('LCP', metrics.lcp, CORE_WEB_VITALS_BUDGET.LCP));
  }
  if (metrics.fid !== undefined) {
    results.push(checkBudgetValue('FID', metrics.fid, CORE_WEB_VITALS_BUDGET.FID));
  }
  if (metrics.inp !== undefined) {
    results.push(checkBudgetValue('INP', metrics.inp, CORE_WEB_VITALS_BUDGET.INP));
  }
  if (metrics.cls !== undefined) {
    results.push(checkBudgetValue('CLS', metrics.cls, CORE_WEB_VITALS_BUDGET.CLS));
  }
  if (metrics.fcp !== undefined) {
    results.push(checkBudgetValue('FCP', metrics.fcp, CORE_WEB_VITALS_BUDGET.FCP));
  }
  if (metrics.ttfb !== undefined) {
    results.push(checkBudgetValue('TTFB', metrics.ttfb, CORE_WEB_VITALS_BUDGET.TTFB));
  }

  return results;
}

/**
 * Check bundle sizes against budget
 */
export function checkBundleBudget(sizes: {
  javascript?: number;
  initialJS?: number;
  css?: number;
  total?: number;
  fonts?: number;
}): BudgetResult[] {
  const results: BudgetResult[] = [];

  if (sizes.javascript !== undefined) {
    results.push(
      checkBudgetValue('JavaScript', sizes.javascript, BUNDLE_SIZE_BUDGET.javascript)
    );
  }
  if (sizes.initialJS !== undefined) {
    results.push(
      checkBudgetValue('Initial JS', sizes.initialJS, BUNDLE_SIZE_BUDGET.initialJS)
    );
  }
  if (sizes.css !== undefined) {
    results.push(checkBudgetValue('CSS', sizes.css, BUNDLE_SIZE_BUDGET.css));
  }
  if (sizes.total !== undefined) {
    results.push(checkBudgetValue('Total', sizes.total, BUNDLE_SIZE_BUDGET.total));
  }
  if (sizes.fonts !== undefined) {
    results.push(checkBudgetValue('Fonts', sizes.fonts, BUNDLE_SIZE_BUDGET.fonts));
  }

  return results;
}

/**
 * Format budget result for display
 */
export function formatBudgetResult(result: BudgetResult): string {
  const statusEmoji = result.status === 'pass' ? '[PASS]' : result.status === 'warning' ? '[WARN]' : '[FAIL]';
  const unit = result.metric === 'CLS' ? '' : result.metric.includes('JS') || result.metric.includes('CSS') ? ' bytes' : 'ms';
  const valueStr = result.metric === 'CLS' ? result.value.toFixed(3) : result.value.toFixed(0);
  const targetStr = result.metric === 'CLS' ? result.target.toFixed(3) : result.target.toFixed(0);

  return `${statusEmoji} ${result.metric}: ${valueStr}${unit} (target: ${targetStr}${unit}, ${result.deltaPercent >= 0 ? '+' : ''}${result.deltaPercent.toFixed(1)}%)`;
}

/**
 * Generate budget report
 */
export function generateBudgetReport(results: BudgetResult[]): string {
  const passing = results.filter((r) => r.status === 'pass');
  const warnings = results.filter((r) => r.status === 'warning');
  const failing = results.filter((r) => r.status === 'fail');

  let report = '# Performance Budget Report\n\n';
  report += `Total: ${results.length} metrics checked\n`;
  report += `- Passing: ${passing.length}\n`;
  report += `- Warnings: ${warnings.length}\n`;
  report += `- Failing: ${failing.length}\n\n`;

  if (failing.length > 0) {
    report += '## Failing Metrics\n\n';
    failing.forEach((r) => {
      report += `- ${formatBudgetResult(r)}\n`;
    });
    report += '\n';
  }

  if (warnings.length > 0) {
    report += '## Warnings\n\n';
    warnings.forEach((r) => {
      report += `- ${formatBudgetResult(r)}\n`;
    });
    report += '\n';
  }

  if (passing.length > 0) {
    report += '## Passing Metrics\n\n';
    passing.forEach((r) => {
      report += `- ${formatBudgetResult(r)}\n`;
    });
  }

  return report;
}

// ============================================================================
// CI/CD INTEGRATION
// ============================================================================

/**
 * Check if budget passes for CI/CD
 * Returns exit code: 0 for pass, 1 for fail
 */
export function checkBudgetCI(results: BudgetResult[]): {
  exitCode: number;
  summary: string;
} {
  const failing = results.filter((r) => r.status === 'fail');
  const warnings = results.filter((r) => r.status === 'warning');

  if (failing.length > 0) {
    return {
      exitCode: 1,
      summary: `Performance budget FAILED: ${failing.length} metric(s) over budget`,
    };
  }

  if (warnings.length > 0) {
    return {
      exitCode: 0,
      summary: `Performance budget PASSED with ${warnings.length} warning(s)`,
    };
  }

  return {
    exitCode: 0,
    summary: 'Performance budget PASSED',
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  CORE_WEB_VITALS_BUDGET,
  BUNDLE_SIZE_BUDGET,
  RESOURCE_COUNT_BUDGET,
  PAGE_BUDGETS,
  checkBudgetValue,
  checkWebVitalsBudget,
  checkBundleBudget,
  formatBudgetResult,
  generateBudgetReport,
  checkBudgetCI,
};
