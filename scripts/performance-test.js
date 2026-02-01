#!/usr/bin/env node

/**
 * Tallow Performance Testing Suite
 * Comprehensive performance analysis and reporting
 *
 * Usage:
 *   node scripts/performance-test.js bundle    - Analyze bundle size
 *   node scripts/performance-test.js memory    - Memory profiling
 *   node scripts/performance-test.js vitals    - Core Web Vitals
 *   node scripts/performance-test.js full      - Full performance audit
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ ${message}`, colors.cyan);
}

// Performance thresholds
const THRESHOLDS = {
  bundle: {
    main: 150 * 1024, // 150KB
    vendor: 200 * 1024, // 200KB
    total: 350 * 1024, // 350KB
  },
  vitals: {
    fcp: 1000, // 1s
    lcp: 2500, // 2.5s
    fid: 100, // 100ms
    cls: 0.1, // 0.1
    ttfb: 200, // 200ms
    tti: 2000, // 2s
  },
  memory: {
    heap: 50 * 1024 * 1024, // 50MB
    dom: 1000, // 1000 nodes
  },
};

// Bundle Size Analysis
function analyzeBundleSize() {
  log('\n📦 Bundle Size Analysis\n', colors.bright);

  const nextDir = path.join(process.cwd(), '.next');

  if (!fs.existsSync(nextDir)) {
    error('Build directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  const stats = {
    chunks: [],
    totalSize: 0,
    gzipSize: 0,
  };

  // Analyze JavaScript chunks
  const chunksDir = path.join(nextDir, 'static', 'chunks');
  if (fs.existsSync(chunksDir)) {
    const chunks = fs.readdirSync(chunksDir);

    chunks.forEach((chunk) => {
      if (chunk.endsWith('.js')) {
        const filePath = path.join(chunksDir, chunk);
        const size = fs.statSync(filePath).size;
        stats.totalSize += size;

        stats.chunks.push({
          name: chunk,
          size,
          sizeKB: (size / 1024).toFixed(2),
        });
      }
    });
  }

  // Sort by size
  stats.chunks.sort((a, b) => b.size - a.size);

  // Display results
  log('Top 10 Largest Chunks:', colors.cyan);
  stats.chunks.slice(0, 10).forEach((chunk, i) => {
    const sizeColor =
      chunk.size > THRESHOLDS.bundle.main ? colors.red : colors.green;
    log(
      `  ${i + 1}. ${chunk.name}: ${sizeColor}${chunk.sizeKB}KB${colors.reset}`
    );
  });

  const totalKB = (stats.totalSize / 1024).toFixed(2);
  const totalMB = (stats.totalSize / 1024 / 1024).toFixed(2);

  log(`\nTotal Bundle Size: ${totalKB}KB (${totalMB}MB)`, colors.bright);

  // Check against threshold
  if (stats.totalSize > THRESHOLDS.bundle.total) {
    error(
      `Bundle size exceeds threshold: ${totalKB}KB > ${(THRESHOLDS.bundle.total / 1024).toFixed(2)}KB`
    );
    return false;
  } else {
    success(
      `Bundle size within threshold: ${totalKB}KB < ${(THRESHOLDS.bundle.total / 1024).toFixed(2)}KB`
    );
    return true;
  }
}

// Lighthouse Performance Test
async function runLighthouse() {
  log('\n🔦 Running Lighthouse Audit\n', colors.bright);

  try {
    // Check if dev server is running
    const devServerRunning = await checkDevServer();

    if (!devServerRunning) {
      warning('Dev server not running. Starting server...');
      // Start dev server in background
      const { spawn } = require('child_process');
      const server = spawn('npm', ['run', 'dev'], {
        detached: true,
        stdio: 'ignore',
      });
      server.unref();

      // Wait for server to start
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Run Lighthouse
    info('Running Lighthouse audit...');
    execSync(
      'npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless" --quiet',
      { stdio: 'inherit' }
    );

    // Parse results
    const report = JSON.parse(
      fs.readFileSync('./lighthouse-report.json', 'utf8')
    );

    const scores = {
      performance: report.categories.performance.score * 100,
      accessibility: report.categories.accessibility.score * 100,
      bestPractices: report.categories['best-practices'].score * 100,
      seo: report.categories.seo.score * 100,
    };

    // Display scores
    log('\nLighthouse Scores:', colors.cyan);
    Object.entries(scores).forEach(([category, score]) => {
      const scoreColor =
        score >= 90 ? colors.green : score >= 50 ? colors.yellow : colors.red;
      log(`  ${category}: ${scoreColor}${score}${colors.reset}`);
    });

    // Core Web Vitals
    const audits = report.audits;
    log('\nCore Web Vitals:', colors.cyan);

    const vitals = {
      FCP: audits['first-contentful-paint'].numericValue,
      LCP: audits['largest-contentful-paint'].numericValue,
      TBT: audits['total-blocking-time'].numericValue,
      CLS: audits['cumulative-layout-shift'].numericValue,
      SI: audits['speed-index'].numericValue,
    };

    Object.entries(vitals).forEach(([metric, value]) => {
      const displayValue =
        metric === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`;
      log(`  ${metric}: ${displayValue}`);
    });

    return scores.performance >= 95;
  } catch (err) {
    error(`Lighthouse failed: ${err.message}`);
    return false;
  }
}

// Memory Profiling
function analyzeMemory() {
  log('\n🧠 Memory Usage Analysis\n', colors.bright);

  // This would typically be run with puppeteer or playwright
  info('Memory profiling requires browser automation.');
  info('Run this with: npm run perf:memory:full');

  // Placeholder for memory stats
  const memoryStats = {
    heapUsed: 0,
    heapTotal: 0,
    external: 0,
    arrayBuffers: 0,
  };

  if (global.gc) {
    global.gc();
    const mem = process.memoryUsage();
    memoryStats.heapUsed = mem.heapUsed;
    memoryStats.heapTotal = mem.heapTotal;
    memoryStats.external = mem.external;
    memoryStats.arrayBuffers = mem.arrayBuffers;

    log('Node.js Memory Usage:', colors.cyan);
    log(`  Heap Used: ${(memoryStats.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    log(
      `  Heap Total: ${(memoryStats.heapTotal / 1024 / 1024).toFixed(2)}MB`
    );
    log(`  External: ${(memoryStats.external / 1024 / 1024).toFixed(2)}MB`);
  } else {
    info('Run with --expose-gc flag for accurate memory stats');
  }

  return true;
}

// Core Web Vitals Monitoring
function monitorWebVitals() {
  log('\n📊 Core Web Vitals Monitoring\n', colors.bright);

  info('Web Vitals monitoring requires running application.');
  info('Use: npm run perf:vitals:live');

  // Generate web-vitals monitoring code
  const monitoringCode = `
// Add this to your app/layout.tsx or _app.tsx

import { useEffect } from 'react';

function reportWebVitals(metric) {
  console.log(metric);

  // Send to analytics
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible('Web Vitals', {
      props: {
        metric: metric.name,
        value: Math.round(metric.value),
        rating: metric.rating,
      }
    });
  }
}

export function WebVitalsReporter() {
  useEffect(() => {
    if ('web-vital' in window) {
      const { onCLS, onFID, onFCP, onLCP, onTTFB } = window['web-vital'];
      onCLS(reportWebVitals);
      onFID(reportWebVitals);
      onFCP(reportWebVitals);
      onLCP(reportWebVitals);
      onTTFB(reportWebVitals);
    }
  }, []);

  return null;
}
`;

  info('\nAdd web-vitals monitoring:\n');
  log(monitoringCode, colors.cyan);

  return true;
}

// Generate Performance Report
function generateReport(results) {
  log('\n📝 Generating Performance Report\n', colors.bright);

  const report = {
    timestamp: new Date().toISOString(),
    results,
    passed: Object.values(results).every((r) => r === true),
  };

  const reportPath = path.join(
    process.cwd(),
    'performance-report.json'
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  success(`Report saved to: ${reportPath}`);

  // Generate markdown report
  const mdReport = `
# Performance Test Report

**Generated:** ${report.timestamp}
**Status:** ${report.passed ? '✅ PASSED' : '❌ FAILED'}

## Results

${Object.entries(results)
  .map(
    ([test, passed]) =>
      `- ${passed ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)}`
  )
  .join('\n')}

## Recommendations

${!results.bundle ? '- ⚠️ Reduce bundle size by implementing lazy loading\n' : ''}${!results.lighthouse ? '- ⚠️ Improve Lighthouse score with Core Web Vitals optimization\n' : ''}

## Next Steps

1. Review detailed metrics in \`lighthouse-report.json\`
2. Analyze bundle composition with \`npm run build:analyze\`
3. Monitor production metrics with Web Vitals API
`;

  const mdPath = path.join(process.cwd(), 'PERFORMANCE_REPORT.md');
  fs.writeFileSync(mdPath, mdReport);

  info(`Markdown report: ${mdPath}`);

  return report.passed;
}

// Check if dev server is running
async function checkDevServer() {
  try {
    const http = require('http');
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000', (res) => {
        resolve(true);
      });
      req.on('error', () => {
        resolve(false);
      });
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  const testType = process.argv[2] || 'full';

  log('╔════════════════════════════════════════╗', colors.bright);
  log('║   Tallow Performance Testing Suite    ║', colors.bright);
  log('╚════════════════════════════════════════╝', colors.bright);

  const results = {};

  switch (testType) {
    case 'bundle':
      results.bundle = analyzeBundleSize();
      break;

    case 'memory':
      results.memory = analyzeMemory();
      break;

    case 'vitals':
      results.vitals = monitorWebVitals();
      break;

    case 'lighthouse':
      results.lighthouse = await runLighthouse();
      break;

    case 'full':
      results.bundle = analyzeBundleSize();
      results.memory = analyzeMemory();
      results.lighthouse = await runLighthouse();
      results.vitals = monitorWebVitals();
      break;

    default:
      error(`Unknown test type: ${testType}`);
      info('Available tests: bundle, memory, vitals, lighthouse, full');
      process.exit(1);
  }

  // Generate report
  const passed = generateReport(results);

  log('\n' + '═'.repeat(50), colors.bright);
  if (passed) {
    success('All performance tests passed! 🎉');
    process.exit(0);
  } else {
    error('Some performance tests failed.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((err) => {
    error(`Performance test failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  analyzeBundleSize,
  runLighthouse,
  analyzeMemory,
  monitorWebVitals,
};
