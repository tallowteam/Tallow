/**
 * Bundle Size Analysis and Budget Management
 *
 * Comprehensive bundle analysis with route-level granularity,
 * size budgets, and automatic violation detection.
 *
 * @module lib/performance/bundle-analyzer
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ModuleSize {
  name: string;
  size: number;
  gzippedSize: number;
  type: 'js' | 'css' | 'wasm' | 'other';
  chunks: string[];
}

export interface RouteSize {
  path: string;
  jsSize: number;
  cssSize: number;
  wasmSize: number;
  totalSize: number;
  gzippedJsSize: number;
  gzippedCssSize: number;
  gzippedTotalSize: number;
  modules: ModuleSize[];
  largestModules: ModuleSize[];
}

export interface BundleReport {
  timestamp: number;
  totalSize: number;
  gzippedSize: number;
  jsSize: number;
  cssSize: number;
  wasmSize: number;
  gzippedJsSize: number;
  gzippedCssSize: number;
  routes: RouteSize[];
  largestModules: ModuleSize[];
  sharedChunks: ModuleSize[];
  budgetViolations: BudgetViolation[];
}

export interface BudgetViolation {
  type: 'route' | 'total' | 'module' | 'asset';
  target: string;
  metric: string;
  budget: number;
  actual: number;
  overBy: number;
  percentOver: number;
  severity: 'warning' | 'critical';
  recommendation: string;
}

export interface BundleBudgets {
  /** Maximum gzipped JS per route (bytes) */
  js: number;
  /** Maximum gzipped CSS per route (bytes) */
  css: number;
  /** Maximum gzipped images per route (bytes) */
  images: number;
  /** Maximum gzipped WASM per route (bytes) */
  wasm: number;
  /** Maximum total gzipped size per route (bytes) */
  total: number;
  /** Maximum total bundle size (all routes combined) (bytes) */
  totalBundle: number;
  /** Maximum size for a single module (bytes) */
  maxModuleSize: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default bundle size budgets (all sizes in bytes, gzipped)
 *
 * Based on Web Performance Best Practices:
 * - Total JS < 200KB gzipped (optimal for 3G connections)
 * - Critical CSS < 50KB gzipped
 * - Total bundle < 750KB gzipped
 */
export const BUNDLE_BUDGETS: BundleBudgets = {
  js: 200_000, // 200KB gzipped JS per route
  css: 50_000, // 50KB gzipped CSS per route
  images: 500_000, // 500KB gzipped images per route
  wasm: 100_000, // 100KB gzipped WASM per route
  total: 750_000, // 750KB total per route
  totalBundle: 2_000_000, // 2MB total bundle size
  maxModuleSize: 150_000, // 150KB max single module
};

/**
 * Stricter budgets for performance-critical routes
 */
export const STRICT_BUNDLE_BUDGETS: BundleBudgets = {
  js: 150_000, // 150KB
  css: 30_000, // 30KB
  images: 300_000, // 300KB
  wasm: 50_000, // 50KB
  total: 500_000, // 500KB
  totalBundle: 1_500_000, // 1.5MB
  maxModuleSize: 100_000, // 100KB
};

/**
 * Relaxed budgets for feature-rich routes
 */
export const RELAXED_BUNDLE_BUDGETS: BundleBudgets = {
  js: 300_000, // 300KB
  css: 75_000, // 75KB
  images: 750_000, // 750KB
  wasm: 200_000, // 200KB
  total: 1_000_000, // 1MB
  totalBundle: 3_000_000, // 3MB
  maxModuleSize: 200_000, // 200KB
};

/**
 * Compression ratios for estimation (gzipped)
 */
const COMPRESSION_RATIOS = {
  js: 0.3, // ~70% compression
  css: 0.25, // ~75% compression
  html: 0.2, // ~80% compression
  json: 0.15, // ~85% compression
  wasm: 0.9, // ~10% compression (already optimized)
  images: 1.0, // No additional compression
};

// ============================================================================
// BUNDLE ANALYSIS
// ============================================================================

/**
 * Analyze bundle size from browser resource timings
 *
 * @example
 * const report = analyzeBundleSize();
 * console.log(`Total bundle: ${(report.gzippedSize / 1024).toFixed(2)} KB`);
 */
export function analyzeBundleSize(
  budgets: BundleBudgets = BUNDLE_BUDGETS
): BundleReport {
  if (typeof performance === 'undefined' || typeof window === 'undefined') {
    return createEmptyReport();
  }

  // Get all resource timings
  const resources = performance.getEntriesByType(
    'resource'
  ) as PerformanceResourceTiming[];

  // Categorize resources
  const modules: ModuleSize[] = [];
  let totalSize = 0;
  let jsSize = 0;
  let cssSize = 0;
  let wasmSize = 0;

  resources.forEach((resource) => {
    const size = resource.transferSize || resource.encodedBodySize || 0;
    if (size === 0) {return;}

    const url = new URL(resource.name, window.location.origin);
    const pathname = url.pathname;
    const ext = pathname.split('.').pop()?.toLowerCase() || '';

    let type: ModuleSize['type'] = 'other';
    let gzippedSize = size;

    if (ext === 'js' || pathname.includes('/_next/static/chunks/')) {
      type = 'js';
      jsSize += size;
      gzippedSize = Math.round(size * COMPRESSION_RATIOS.js);
    } else if (ext === 'css') {
      type = 'css';
      cssSize += size;
      gzippedSize = Math.round(size * COMPRESSION_RATIOS.css);
    } else if (ext === 'wasm') {
      type = 'wasm';
      wasmSize += size;
      gzippedSize = Math.round(size * COMPRESSION_RATIOS.wasm);
    }

    if (type !== 'other') {
      totalSize += size;
      modules.push({
        name: pathname,
        size,
        gzippedSize,
        type,
        chunks: extractChunkNames(pathname),
      });
    }
  });

  // Calculate gzipped sizes
  const gzippedJsSize = Math.round(jsSize * COMPRESSION_RATIOS.js);
  const gzippedCssSize = Math.round(cssSize * COMPRESSION_RATIOS.css);
  const gzippedSize = gzippedJsSize + gzippedCssSize + Math.round(wasmSize * COMPRESSION_RATIOS.wasm);

  // Find largest modules
  const largestModules = [...modules]
    .sort((a, b) => b.gzippedSize - a.gzippedSize)
    .slice(0, 20);

  // Group by routes
  const routes = groupByRoutes(modules);

  // Identify shared chunks
  const sharedChunks = modules.filter((m) =>
    m.name.includes('vendors') ||
    m.name.includes('common') ||
    m.name.includes('shared') ||
    m.name.includes('framework')
  );

  // Check budgets
  const budgetViolations = checkBudget(
    {
      totalSize,
      gzippedSize,
      jsSize,
      cssSize,
      wasmSize,
      gzippedJsSize,
      gzippedCssSize,
      routes,
      largestModules,
    },
    budgets
  );

  return {
    timestamp: Date.now(),
    totalSize,
    gzippedSize,
    jsSize,
    cssSize,
    wasmSize,
    gzippedJsSize,
    gzippedCssSize,
    routes,
    largestModules,
    sharedChunks,
    budgetViolations,
  };
}

/**
 * Extract chunk names from module path
 */
function extractChunkNames(pathname: string): string[] {
  const chunks: string[] = [];

  // Extract from Next.js chunk patterns
  const chunkMatch = pathname.match(/\/chunks\/([^/]+)/);
  if (chunkMatch?.[1]) {
    chunks.push(chunkMatch[1]);
  }

  // Extract from page patterns
  const pageMatch = pathname.match(/\/pages\/([^/]+)/);
  if (pageMatch?.[1]) {
    chunks.push(pageMatch[1]);
  }

  return chunks;
}

/**
 * Group modules by routes
 */
function groupByRoutes(modules: ModuleSize[]): RouteSize[] {
  const routeMap = new Map<string, ModuleSize[]>();

  modules.forEach((module) => {
    // Try to extract route from module name
    let route = '/';

    // Next.js page pattern
    const pageMatch = module.name.match(/\/pages(\/[^?]*)/);
    if (pageMatch) {
      route = pageMatch[1] || '/';
    }

    // App router pattern
    const appMatch = module.name.match(/\/app(\/[^?]*)/);
    if (appMatch) {
      route = appMatch[1] || '/';
    }

    // Shared chunks go to all routes
    if (
      module.name.includes('vendors') ||
      module.name.includes('framework') ||
      module.name.includes('main')
    ) {
      route = '_shared';
    }

    const existing = routeMap.get(route) || [];
    existing.push(module);
    routeMap.set(route, existing);
  });

  // Convert to RouteSize objects
  const routes: RouteSize[] = [];

  routeMap.forEach((routeModules, path) => {
    const jsModules = routeModules.filter((m) => m.type === 'js');
    const cssModules = routeModules.filter((m) => m.type === 'css');
    const wasmModules = routeModules.filter((m) => m.type === 'wasm');

    const jsSize = jsModules.reduce((sum, m) => sum + m.size, 0);
    const cssSize = cssModules.reduce((sum, m) => sum + m.size, 0);
    const wasmSize = wasmModules.reduce((sum, m) => sum + m.size, 0);
    const totalSize = jsSize + cssSize + wasmSize;

    const gzippedJsSize = jsModules.reduce((sum, m) => sum + m.gzippedSize, 0);
    const gzippedCssSize = cssModules.reduce((sum, m) => sum + m.gzippedSize, 0);
    const gzippedWasmSize = wasmModules.reduce((sum, m) => sum + m.gzippedSize, 0);
    const gzippedTotalSize = gzippedJsSize + gzippedCssSize + gzippedWasmSize;

    const largestModules = [...routeModules]
      .sort((a, b) => b.gzippedSize - a.gzippedSize)
      .slice(0, 10);

    routes.push({
      path,
      jsSize,
      cssSize,
      wasmSize,
      totalSize,
      gzippedJsSize,
      gzippedCssSize,
      gzippedTotalSize,
      modules: routeModules,
      largestModules,
    });
  });

  return routes.sort((a, b) => b.gzippedTotalSize - a.gzippedTotalSize);
}

// ============================================================================
// BUDGET CHECKING
// ============================================================================

/**
 * Check bundle sizes against budgets
 */
export function checkBudget(
  data: Pick<
    BundleReport,
    | 'totalSize'
    | 'gzippedSize'
    | 'jsSize'
    | 'cssSize'
    | 'wasmSize'
    | 'gzippedJsSize'
    | 'gzippedCssSize'
    | 'routes'
    | 'largestModules'
  >,
  budgets: BundleBudgets = BUNDLE_BUDGETS
): BudgetViolation[] {
  const violations: BudgetViolation[] = [];

  // Check total bundle size
  if (data.gzippedSize > budgets.totalBundle) {
    const overBy = data.gzippedSize - budgets.totalBundle;
    const percentOver = (overBy / budgets.totalBundle) * 100;
    violations.push({
      type: 'total',
      target: 'bundle',
      metric: 'Total Bundle Size',
      budget: budgets.totalBundle,
      actual: data.gzippedSize,
      overBy,
      percentOver,
      severity: percentOver > 50 ? 'critical' : 'warning',
      recommendation: `Reduce total bundle size by ${formatBytes(
        overBy
      )}. Consider code splitting, lazy loading, or removing unused dependencies.`,
    });
  }

  // Check per-route budgets
  data.routes.forEach((route) => {
    if (route.path === '_shared') {return;} // Skip shared chunks

    // Check JS budget
    if (route.gzippedJsSize > budgets.js) {
      const overBy = route.gzippedJsSize - budgets.js;
      const percentOver = (overBy / budgets.js) * 100;
      violations.push({
        type: 'route',
        target: route.path,
        metric: 'JavaScript Size',
        budget: budgets.js,
        actual: route.gzippedJsSize,
        overBy,
        percentOver,
        severity: percentOver > 50 ? 'critical' : 'warning',
        recommendation: `Route "${route.path}" exceeds JS budget by ${formatBytes(
          overBy
        )}. Consider splitting large modules or lazy loading features.`,
      });
    }

    // Check CSS budget
    if (route.gzippedCssSize > budgets.css) {
      const overBy = route.gzippedCssSize - budgets.css;
      const percentOver = (overBy / budgets.css) * 100;
      violations.push({
        type: 'route',
        target: route.path,
        metric: 'CSS Size',
        budget: budgets.css,
        actual: route.gzippedCssSize,
        overBy,
        percentOver,
        severity: percentOver > 50 ? 'critical' : 'warning',
        recommendation: `Route "${route.path}" exceeds CSS budget by ${formatBytes(
          overBy
        )}. Consider removing unused styles or extracting critical CSS.`,
      });
    }

    // Check total route budget
    if (route.gzippedTotalSize > budgets.total) {
      const overBy = route.gzippedTotalSize - budgets.total;
      const percentOver = (overBy / budgets.total) * 100;
      violations.push({
        type: 'route',
        target: route.path,
        metric: 'Total Route Size',
        budget: budgets.total,
        actual: route.gzippedTotalSize,
        overBy,
        percentOver,
        severity: percentOver > 50 ? 'critical' : 'warning',
        recommendation: `Route "${route.path}" exceeds total budget by ${formatBytes(
          overBy
        )}. Optimize assets and code for this route.`,
      });
    }
  });

  // Check individual module sizes
  data.largestModules.forEach((module) => {
    if (module.gzippedSize > budgets.maxModuleSize) {
      const overBy = module.gzippedSize - budgets.maxModuleSize;
      const percentOver = (overBy / budgets.maxModuleSize) * 100;
      violations.push({
        type: 'module',
        target: module.name,
        metric: 'Module Size',
        budget: budgets.maxModuleSize,
        actual: module.gzippedSize,
        overBy,
        percentOver,
        severity: percentOver > 50 ? 'critical' : 'warning',
        recommendation: `Module "${module.name}" is too large (${formatBytes(
          module.gzippedSize
        )}). Consider splitting into smaller chunks or lazy loading.`,
      });
    }
  });

  return violations.sort((a, b) => b.percentOver - a.percentOver);
}

// ============================================================================
// OPTIMIZATION SUGGESTIONS
// ============================================================================

/**
 * Generate optimization suggestions based on bundle analysis
 */
export function getOptimizationSuggestions(
  report: BundleReport
): string[] {
  const suggestions: string[] = [];

  // Large bundle suggestions
  if (report.gzippedSize > BUNDLE_BUDGETS.totalBundle) {
    suggestions.push(
      'Bundle size exceeds budget. Consider enabling dynamic imports and code splitting.'
    );
  }

  // Route-specific suggestions
  const largeRoutes = report.routes.filter(
    (r) => r.gzippedTotalSize > BUNDLE_BUDGETS.total && r.path !== '_shared'
  );

  if (largeRoutes.length > 0) {
    suggestions.push(
      `${largeRoutes.length} route(s) exceed size budget: ${largeRoutes
        .map((r) => r.path)
        .join(', ')}`
    );
  }

  // Module-specific suggestions
  const largeModules = report.largestModules.filter(
    (m) => m.gzippedSize > BUNDLE_BUDGETS.maxModuleSize
  );

  if (largeModules.length > 0) {
    suggestions.push(
      `${largeModules.length} module(s) are too large. Top offenders: ${largeModules
        .slice(0, 3)
        .map((m) => `${m.name.split('/').pop()} (${formatBytes(m.gzippedSize)})`)
        .join(', ')}`
    );
  }

  // Shared chunk optimization
  const sharedSize = report.sharedChunks.reduce(
    (sum, chunk) => sum + chunk.gzippedSize,
    0
  );

  if (sharedSize > BUNDLE_BUDGETS.js) {
    suggestions.push(
      `Shared chunks are large (${formatBytes(
        sharedSize
      )}). Consider vendor splitting or tree-shaking.`
    );
  }

  // CSS optimization
  if (report.gzippedCssSize > BUNDLE_BUDGETS.css) {
    suggestions.push(
      `CSS bundle is large (${formatBytes(
        report.gzippedCssSize
      )}). Consider critical CSS extraction or CSS modules.`
    );
  }

  return suggestions;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) {return '0 B';}

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Create empty report for SSR/SSG
 */
function createEmptyReport(): BundleReport {
  return {
    timestamp: Date.now(),
    totalSize: 0,
    gzippedSize: 0,
    jsSize: 0,
    cssSize: 0,
    wasmSize: 0,
    gzippedJsSize: 0,
    gzippedCssSize: 0,
    routes: [],
    largestModules: [],
    sharedChunks: [],
    budgetViolations: [],
  };
}

/**
 * Print bundle report to console
 */
export function logBundleReport(report: BundleReport): void {
  console.group('[Bundle Analysis]');

  console.log('Total Bundle Size:');
  console.table({
    'Total (Uncompressed)': formatBytes(report.totalSize),
    'Total (Gzipped)': formatBytes(report.gzippedSize),
    'JavaScript': formatBytes(report.gzippedJsSize),
    'CSS': formatBytes(report.gzippedCssSize),
    'WASM': formatBytes(report.wasmSize),
  });

  if (report.routes.length > 0) {
    console.log('Routes:');
    console.table(
      report.routes.map((r) => ({
        Path: r.path,
        'Total': formatBytes(r.gzippedTotalSize),
        'JS': formatBytes(r.gzippedJsSize),
        'CSS': formatBytes(r.gzippedCssSize),
        'Modules': r.modules.length,
      }))
    );
  }

  if (report.largestModules.length > 0) {
    console.log('Largest Modules (Top 10):');
    console.table(
      report.largestModules.slice(0, 10).map((m) => ({
        Name: m.name.split('/').pop(),
        Type: m.type.toUpperCase(),
        Size: formatBytes(m.gzippedSize),
      }))
    );
  }

  if (report.budgetViolations.length > 0) {
    console.warn(`${report.budgetViolations.length} Budget Violations:`);
    console.table(
      report.budgetViolations.map((v) => ({
        Type: v.type,
        Target: v.target,
        Metric: v.metric,
        'Over By': formatBytes(v.overBy),
        'Percent': `${v.percentOver.toFixed(1)}%`,
        Severity: v.severity,
      }))
    );
  } else {
    console.log('✅ All budgets met!');
  }

  const suggestions = getOptimizationSuggestions(report);
  if (suggestions.length > 0) {
    console.log('Optimization Suggestions:');
    suggestions.forEach((s, i) => console.log(`${i + 1}. ${s}`));
  }

  console.groupEnd();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  analyzeBundleSize,
  checkBudget,
  getOptimizationSuggestions,
  formatBytes,
  logBundleReport,
  BUNDLE_BUDGETS,
  STRICT_BUNDLE_BUDGETS,
  RELAXED_BUNDLE_BUDGETS,
};
