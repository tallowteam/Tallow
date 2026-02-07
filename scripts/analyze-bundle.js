#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 *
 * Analyzes Next.js build output and checks against performance budgets
 *
 * Usage:
 *   npm run analyze-bundle
 *   node scripts/analyze-bundle.js
 */

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

// ============================================================================
// CONSTANTS
// ============================================================================

const NEXT_DIR = path.join(process.cwd(), '.next');
const BUILD_MANIFEST = path.join(NEXT_DIR, 'build-manifest.json');
const STATIC_DIR = path.join(NEXT_DIR, 'static');

const BUDGETS = {
  js: 200_000, // 200KB gzipped
  css: 50_000, // 50KB gzipped
  total: 750_000, // 750KB total per route
  totalBundle: 2_000_000, // 2MB total
  maxModuleSize: 150_000, // 150KB max single file
};

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// ============================================================================
// MAIN ANALYSIS
// ============================================================================

async function analyzeBundle() {
  console.log(`${COLORS.bold}${COLORS.cyan}Bundle Size Analysis${COLORS.reset}\n`);

  // Check if build exists
  if (!fs.existsSync(NEXT_DIR)) {
    console.error(
      `${COLORS.red}Error: .next directory not found. Run 'next build' first.${COLORS.reset}`
    );
    process.exit(1);
  }

  try {
    // Load build manifest
    const manifest = JSON.parse(fs.readFileSync(BUILD_MANIFEST, 'utf8'));

    // Analyze each route
    const routes = analyzeRoutes(manifest);

    // Analyze chunks
    const chunks = analyzeChunks();

    // Calculate totals
    const totals = calculateTotals(routes, chunks);

    // Check budgets
    const violations = checkBudgets(routes, chunks, totals);

    // Print results
    printResults(routes, chunks, totals, violations);

    // Exit with error if critical violations
    const criticalViolations = violations.filter((v) => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      console.error(
        `\n${COLORS.red}${COLORS.bold}${criticalViolations.length} critical budget violations!${COLORS.reset}`
      );
      process.exit(1);
    }

    console.log(`\n${COLORS.green}${COLORS.bold}✓ Bundle analysis complete${COLORS.reset}`);
  } catch (error) {
    console.error(`${COLORS.red}Error analyzing bundle:${COLORS.reset}`, error);
    process.exit(1);
  }
}

// ============================================================================
// ROUTE ANALYSIS
// ============================================================================

function analyzeRoutes(manifest) {
  const routes = {};

  // Analyze each page
  Object.entries(manifest.pages).forEach(([route, files]) => {
    const jsFiles = files.filter((f) => f.endsWith('.js'));
    const cssFiles = files.filter((f) => f.endsWith('.css'));

    const jsSize = jsFiles.reduce((sum, file) => sum + getFileSize(file), 0);
    const cssSize = cssFiles.reduce((sum, file) => sum + getFileSize(file), 0);
    const gzippedJsSize = jsFiles.reduce(
      (sum, file) => sum + getGzippedSize(file),
      0
    );
    const gzippedCssSize = cssFiles.reduce(
      (sum, file) => sum + getGzippedSize(file),
      0
    );

    routes[route] = {
      path: route,
      files: files.length,
      jsSize,
      cssSize,
      totalSize: jsSize + cssSize,
      gzippedJsSize,
      gzippedCssSize,
      gzippedTotalSize: gzippedJsSize + gzippedCssSize,
      jsFiles,
      cssFiles,
    };
  });

  return routes;
}

// ============================================================================
// CHUNK ANALYSIS
// ============================================================================

function analyzeChunks() {
  const chunks = [];

  if (!fs.existsSync(STATIC_DIR)) {
    return chunks;
  }

  // Find all JS and CSS files
  const chunkDirs = ['chunks', 'css'];

  chunkDirs.forEach((dir) => {
    const dirPath = path.join(STATIC_DIR, dir);
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.css'))) {
        const size = stat.size;
        const gzippedSize = getGzippedSizeFromPath(filePath);

        chunks.push({
          name: file,
          type: file.endsWith('.js') ? 'js' : 'css',
          size,
          gzippedSize,
          path: filePath,
        });
      }
    });
  });

  // Sort by size
  chunks.sort((a, b) => b.gzippedSize - a.gzippedSize);

  return chunks;
}

// ============================================================================
// UTILITIES
// ============================================================================

function getFileSize(file) {
  try {
    const filePath = path.join(NEXT_DIR, file);
    const stat = fs.statSync(filePath);
    return stat.size;
  } catch {
    return 0;
  }
}

function getGzippedSize(file) {
  try {
    const filePath = path.join(NEXT_DIR, file);
    return getGzippedSizeFromPath(filePath);
  } catch {
    return 0;
  }
}

function getGzippedSizeFromPath(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    const compressed = gzipSync(content, { level: 9 });
    return compressed.length;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function calculateTotals(routes, chunks) {
  const totalJsSize = chunks
    .filter((c) => c.type === 'js')
    .reduce((sum, c) => sum + c.size, 0);

  const totalCssSize = chunks
    .filter((c) => c.type === 'css')
    .reduce((sum, c) => sum + c.size, 0);

  const gzippedJsSize = chunks
    .filter((c) => c.type === 'js')
    .reduce((sum, c) => sum + c.gzippedSize, 0);

  const gzippedCssSize = chunks
    .filter((c) => c.type === 'css')
    .reduce((sum, c) => sum + c.gzippedSize, 0);

  return {
    totalSize: totalJsSize + totalCssSize,
    gzippedSize: gzippedJsSize + gzippedCssSize,
    jsSize: totalJsSize,
    cssSize: totalCssSize,
    gzippedJsSize,
    gzippedCssSize,
    routeCount: Object.keys(routes).length,
    chunkCount: chunks.length,
  };
}

// ============================================================================
// BUDGET CHECKING
// ============================================================================

function checkBudgets(routes, chunks, totals) {
  const violations = [];

  // Check total bundle size
  if (totals.gzippedSize > BUDGETS.totalBundle) {
    const overBy = totals.gzippedSize - BUDGETS.totalBundle;
    const percentOver = (overBy / BUDGETS.totalBundle) * 100;

    violations.push({
      type: 'total',
      target: 'bundle',
      metric: 'Total Bundle Size',
      budget: BUDGETS.totalBundle,
      actual: totals.gzippedSize,
      overBy,
      percentOver,
      severity: percentOver > 50 ? 'critical' : 'warning',
    });
  }

  // Check per-route budgets
  Object.values(routes).forEach((route) => {
    // Skip shared routes
    if (route.path === '/_app' || route.path === '/_document') return;

    // Check JS budget
    if (route.gzippedJsSize > BUDGETS.js) {
      const overBy = route.gzippedJsSize - BUDGETS.js;
      const percentOver = (overBy / BUDGETS.js) * 100;

      violations.push({
        type: 'route',
        target: route.path,
        metric: 'JavaScript',
        budget: BUDGETS.js,
        actual: route.gzippedJsSize,
        overBy,
        percentOver,
        severity: percentOver > 50 ? 'critical' : 'warning',
      });
    }

    // Check CSS budget
    if (route.gzippedCssSize > BUDGETS.css) {
      const overBy = route.gzippedCssSize - BUDGETS.css;
      const percentOver = (overBy / BUDGETS.css) * 100;

      violations.push({
        type: 'route',
        target: route.path,
        metric: 'CSS',
        budget: BUDGETS.css,
        actual: route.gzippedCssSize,
        overBy,
        percentOver,
        severity: percentOver > 50 ? 'critical' : 'warning',
      });
    }

    // Check total route budget
    if (route.gzippedTotalSize > BUDGETS.total) {
      const overBy = route.gzippedTotalSize - BUDGETS.total;
      const percentOver = (overBy / BUDGETS.total) * 100;

      violations.push({
        type: 'route',
        target: route.path,
        metric: 'Total',
        budget: BUDGETS.total,
        actual: route.gzippedTotalSize,
        overBy,
        percentOver,
        severity: percentOver > 50 ? 'critical' : 'warning',
      });
    }
  });

  // Check individual chunk sizes
  chunks.forEach((chunk) => {
    if (chunk.gzippedSize > BUDGETS.maxModuleSize) {
      const overBy = chunk.gzippedSize - BUDGETS.maxModuleSize;
      const percentOver = (overBy / BUDGETS.maxModuleSize) * 100;

      violations.push({
        type: 'chunk',
        target: chunk.name,
        metric: 'Chunk Size',
        budget: BUDGETS.maxModuleSize,
        actual: chunk.gzippedSize,
        overBy,
        percentOver,
        severity: percentOver > 50 ? 'critical' : 'warning',
      });
    }
  });

  return violations.sort((a, b) => b.percentOver - a.percentOver);
}

// ============================================================================
// REPORTING
// ============================================================================

function printResults(routes, chunks, totals, violations) {
  // Print totals
  console.log(`${COLORS.bold}Bundle Totals:${COLORS.reset}`);
  console.log(`  Routes: ${totals.routeCount}`);
  console.log(`  Chunks: ${totals.chunkCount}`);
  console.log(
    `  Total Size: ${formatBytes(totals.totalSize)} (uncompressed)`
  );
  console.log(
    `  Total Size: ${formatBytes(totals.gzippedSize)} (gzipped)`
  );
  console.log(`  JavaScript: ${formatBytes(totals.gzippedJsSize)} (gzipped)`);
  console.log(`  CSS: ${formatBytes(totals.gzippedCssSize)} (gzipped)`);

  // Print budget status
  const jsPercent = (totals.gzippedJsSize / BUDGETS.js) * 100;
  const cssPercent = (totals.gzippedCssSize / BUDGETS.css) * 100;
  const totalPercent = (totals.gzippedSize / BUDGETS.totalBundle) * 100;

  console.log(`\n${COLORS.bold}Budget Usage:${COLORS.reset}`);
  console.log(
    `  JavaScript: ${jsPercent.toFixed(1)}% of budget ${getStatusIcon(
      jsPercent
    )}`
  );
  console.log(
    `  CSS: ${cssPercent.toFixed(1)}% of budget ${getStatusIcon(cssPercent)}`
  );
  console.log(
    `  Total: ${totalPercent.toFixed(1)}% of budget ${getStatusIcon(
      totalPercent
    )}`
  );

  // Print largest routes
  console.log(`\n${COLORS.bold}Largest Routes (Top 10):${COLORS.reset}`);
  const sortedRoutes = Object.values(routes).sort(
    (a, b) => b.gzippedTotalSize - a.gzippedTotalSize
  );

  sortedRoutes.slice(0, 10).forEach((route) => {
    const color =
      route.gzippedTotalSize > BUDGETS.total ? COLORS.red : COLORS.green;
    console.log(
      `  ${color}${route.path.padEnd(30)}${COLORS.reset} ${formatBytes(
        route.gzippedTotalSize
      )}`
    );
  });

  // Print largest chunks
  console.log(`\n${COLORS.bold}Largest Chunks (Top 10):${COLORS.reset}`);
  chunks.slice(0, 10).forEach((chunk) => {
    const color =
      chunk.gzippedSize > BUDGETS.maxModuleSize ? COLORS.red : COLORS.green;
    const name = chunk.name.substring(0, 40);
    console.log(
      `  ${color}${name.padEnd(42)}${COLORS.reset} ${formatBytes(
        chunk.gzippedSize
      )}`
    );
  });

  // Print violations
  if (violations.length > 0) {
    console.log(
      `\n${COLORS.bold}${COLORS.yellow}Budget Violations (${violations.length}):${COLORS.reset}`
    );

    violations.slice(0, 10).forEach((v) => {
      const color = v.severity === 'critical' ? COLORS.red : COLORS.yellow;
      console.log(
        `  ${color}[${v.severity.toUpperCase()}] ${v.target}${COLORS.reset}`
      );
      console.log(
        `    ${v.metric}: ${formatBytes(v.actual)} (over by ${formatBytes(
          v.overBy
        )}, ${v.percentOver.toFixed(1)}%)`
      );
    });

    if (violations.length > 10) {
      console.log(`  ... and ${violations.length - 10} more`);
    }
  } else {
    console.log(
      `\n${COLORS.green}${COLORS.bold}✓ All budgets met!${COLORS.reset}`
    );
  }

  // Print recommendations
  const recommendations = getRecommendations(violations, totals);
  if (recommendations.length > 0) {
    console.log(`\n${COLORS.bold}Recommendations:${COLORS.reset}`);
    recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }
}

function getStatusIcon(percent) {
  if (percent < 80) return `${COLORS.green}✓${COLORS.reset}`;
  if (percent < 100) return `${COLORS.yellow}⚠${COLORS.reset}`;
  return `${COLORS.red}✗${COLORS.reset}`;
}

function getRecommendations(violations, totals) {
  const recommendations = [];

  // Bundle size recommendations
  if (totals.gzippedSize > BUDGETS.totalBundle) {
    recommendations.push(
      'Bundle exceeds total budget. Enable code splitting and lazy loading.'
    );
  }

  // Route-specific recommendations
  const routeViolations = violations.filter((v) => v.type === 'route');
  if (routeViolations.length > 0) {
    recommendations.push(
      `${routeViolations.length} route(s) exceed budgets. Consider splitting large modules.`
    );
  }

  // Chunk recommendations
  const chunkViolations = violations.filter((v) => v.type === 'chunk');
  if (chunkViolations.length > 0) {
    recommendations.push(
      `${chunkViolations.length} chunk(s) are too large. Review webpack splitChunks configuration.`
    );
  }

  // CSS recommendations
  if (totals.gzippedCssSize > BUDGETS.css) {
    recommendations.push(
      'CSS bundle is large. Consider CSS modules, critical CSS extraction, or PurgeCSS.'
    );
  }

  return recommendations;
}

// ============================================================================
// RUN
// ============================================================================

analyzeBundle();
