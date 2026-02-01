#!/usr/bin/env node

/**
 * Performance Regression Test
 * Detects performance regressions by comparing against baseline
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  baselineFile: path.join(__dirname, '../../reports/performance-baseline.json'),
  historyFile: path.join(__dirname, '../../reports/performance-history.json'),
  outputDir: path.join(__dirname, '../../reports'),
  thresholds: {
    // Maximum allowed regression percentage
    lighthouse: 5, // 5% regression allowed
    bundleSize: 10, // 10% increase allowed
    transferSpeed: 10, // 10% decrease allowed
    memory: 20, // 20% increase allowed
  },
};

// =============================================================================
// UTILITIES
// =============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadJSON(filePath, defaultValue = null) {
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveJSON(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// =============================================================================
// BASELINE MANAGEMENT
// =============================================================================

function loadBaseline() {
  return loadJSON(CONFIG.baselineFile);
}

function saveBaseline(data) {
  saveJSON(CONFIG.baselineFile, {
    ...data,
    timestamp: new Date().toISOString(),
  });
  console.log('✅ Baseline saved');
}

function loadHistory() {
  return loadJSON(CONFIG.historyFile, []);
}

function saveHistory(history) {
  // Keep only last 50 runs
  const trimmed = history.slice(-50);
  saveJSON(CONFIG.historyFile, trimmed);
}

// =============================================================================
// METRICS COLLECTION
// =============================================================================

function collectCurrentMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    lighthouse: collectLighthouseMetrics(),
    bundleSize: collectBundleSizeMetrics(),
    transferSpeed: collectTransferSpeedMetrics(),
  };

  return metrics;
}

function collectLighthouseMetrics() {
  // Try to load the most recent Lighthouse report
  const lighthouseDir = path.join(__dirname, '../../reports/lighthouse');

  if (!fs.existsSync(lighthouseDir)) {
    console.warn('⚠️  No Lighthouse reports found');
    return null;
  }

  const files = fs
    .readdirSync(lighthouseDir)
    .filter((f) => f.endsWith('.json') && f.startsWith('lighthouse-'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.warn('⚠️  No Lighthouse reports found');
    return null;
  }

  const latestReport = path.join(lighthouseDir, files[0]);
  const data = JSON.parse(fs.readFileSync(latestReport, 'utf-8'));

  return {
    performance: data.categories.performance.score,
    lcp: data.audits['largest-contentful-paint'].numericValue,
    fcp: data.audits['first-contentful-paint'].numericValue,
    cls: data.audits['cumulative-layout-shift'].numericValue,
    tbt: data.audits['total-blocking-time'].numericValue,
    tti: data.audits.interactive.numericValue,
  };
}

function collectBundleSizeMetrics() {
  const historyFile = path.join(__dirname, '../../reports/bundle-history.json');

  if (!fs.existsSync(historyFile)) {
    console.warn('⚠️  No bundle size history found');
    return null;
  }

  const history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
  if (history.length === 0) {
    return null;
  }

  const latest = history[history.length - 1];
  return {
    totalRaw: latest.totals.raw,
    totalGzip: latest.totals.gzip,
  };
}

function collectTransferSpeedMetrics() {
  const benchmarkDir = path.join(__dirname, '../../reports/transfer-benchmarks');

  if (!fs.existsSync(benchmarkDir)) {
    console.warn('⚠️  No transfer benchmarks found');
    return null;
  }

  const files = fs
    .readdirSync(benchmarkDir)
    .filter((f) => f.endsWith('.json') && f.startsWith('benchmark-'))
    .sort()
    .reverse();

  if (files.length === 0) {
    return null;
  }

  const latestBenchmark = path.join(benchmarkDir, files[0]);
  const data = JSON.parse(fs.readFileSync(latestBenchmark, 'utf-8'));

  // Get average encryption speed across all file sizes
  const avgEncryption =
    data.benchmarks.reduce((sum, b) => sum + b.averages.encryption, 0) /
    data.benchmarks.length;

  return {
    avgEncryptionSpeed: avgEncryption,
  };
}

// =============================================================================
// REGRESSION DETECTION
// =============================================================================

function detectRegressions(baseline, current) {
  if (!baseline) {
    console.log('ℹ️  No baseline found. Current metrics will be used as baseline.');
    return { regressions: [], improvements: [] };
  }

  const regressions = [];
  const improvements = [];

  // Lighthouse regressions
  if (baseline.lighthouse && current.lighthouse) {
    // Performance score (higher is better)
    const perfChange =
      ((current.lighthouse.performance - baseline.lighthouse.performance) /
        baseline.lighthouse.performance) *
      100;
    if (perfChange < -CONFIG.thresholds.lighthouse) {
      regressions.push({
        metric: 'Lighthouse Performance Score',
        baseline: (baseline.lighthouse.performance * 100).toFixed(0),
        current: (current.lighthouse.performance * 100).toFixed(0),
        change: perfChange.toFixed(2) + '%',
      });
    } else if (perfChange > CONFIG.thresholds.lighthouse) {
      improvements.push({
        metric: 'Lighthouse Performance Score',
        change: perfChange.toFixed(2) + '%',
      });
    }

    // LCP (lower is better)
    const lcpChange =
      ((current.lighthouse.lcp - baseline.lighthouse.lcp) /
        baseline.lighthouse.lcp) *
      100;
    if (lcpChange > CONFIG.thresholds.lighthouse) {
      regressions.push({
        metric: 'Largest Contentful Paint (LCP)',
        baseline: baseline.lighthouse.lcp.toFixed(0) + 'ms',
        current: current.lighthouse.lcp.toFixed(0) + 'ms',
        change: '+' + lcpChange.toFixed(2) + '%',
      });
    } else if (lcpChange < -CONFIG.thresholds.lighthouse) {
      improvements.push({
        metric: 'Largest Contentful Paint (LCP)',
        change: lcpChange.toFixed(2) + '%',
      });
    }

    // CLS (lower is better)
    const clsChange =
      ((current.lighthouse.cls - baseline.lighthouse.cls) /
        baseline.lighthouse.cls) *
      100;
    if (clsChange > CONFIG.thresholds.lighthouse) {
      regressions.push({
        metric: 'Cumulative Layout Shift (CLS)',
        baseline: baseline.lighthouse.cls.toFixed(3),
        current: current.lighthouse.cls.toFixed(3),
        change: '+' + clsChange.toFixed(2) + '%',
      });
    } else if (clsChange < -CONFIG.thresholds.lighthouse) {
      improvements.push({
        metric: 'Cumulative Layout Shift (CLS)',
        change: clsChange.toFixed(2) + '%',
      });
    }
  }

  // Bundle size regressions
  if (baseline.bundleSize && current.bundleSize) {
    const sizeChange =
      ((current.bundleSize.totalGzip - baseline.bundleSize.totalGzip) /
        baseline.bundleSize.totalGzip) *
      100;
    if (sizeChange > CONFIG.thresholds.bundleSize) {
      regressions.push({
        metric: 'Bundle Size (Gzip)',
        baseline: formatBytes(baseline.bundleSize.totalGzip),
        current: formatBytes(current.bundleSize.totalGzip),
        change: '+' + sizeChange.toFixed(2) + '%',
      });
    } else if (sizeChange < -CONFIG.thresholds.bundleSize) {
      improvements.push({
        metric: 'Bundle Size (Gzip)',
        change: sizeChange.toFixed(2) + '%',
      });
    }
  }

  // Transfer speed regressions
  if (baseline.transferSpeed && current.transferSpeed) {
    const speedChange =
      ((current.transferSpeed.avgEncryptionSpeed -
        baseline.transferSpeed.avgEncryptionSpeed) /
        baseline.transferSpeed.avgEncryptionSpeed) *
      100;
    if (speedChange < -CONFIG.thresholds.transferSpeed) {
      regressions.push({
        metric: 'Average Encryption Speed',
        baseline: formatSpeed(baseline.transferSpeed.avgEncryptionSpeed),
        current: formatSpeed(current.transferSpeed.avgEncryptionSpeed),
        change: speedChange.toFixed(2) + '%',
      });
    } else if (speedChange > CONFIG.thresholds.transferSpeed) {
      improvements.push({
        metric: 'Average Encryption Speed',
        change: '+' + speedChange.toFixed(2) + '%',
      });
    }
  }

  return { regressions, improvements };
}

function formatBytes(bytes) {
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond) {
  const mbps = (bytesPerSecond * 8) / (1024 * 1024);
  return mbps.toFixed(2) + ' Mbps';
}

// =============================================================================
// REPORT GENERATOR
// =============================================================================

function generateReport(current, baseline, results) {
  let report = `
# Performance Regression Report
Generated: ${current.timestamp}

## Summary
`;

  if (results.regressions.length === 0) {
    report += `\n✅ **No performance regressions detected!**\n`;
  } else {
    report += `\n⚠️  **${results.regressions.length} regression(s) detected**\n`;
  }

  if (results.improvements.length > 0) {
    report += `\n🎉 **${results.improvements.length} improvement(s) detected**\n`;
  }

  if (results.regressions.length > 0) {
    report += `\n## Regressions\n\n`;
    report += `| Metric | Baseline | Current | Change |\n`;
    report += `|--------|----------|---------|--------|\n`;
    results.regressions.forEach((r) => {
      report += `| ${r.metric} | ${r.baseline} | ${r.current} | ${r.change} |\n`;
    });
  }

  if (results.improvements.length > 0) {
    report += `\n## Improvements\n\n`;
    report += `| Metric | Change |\n`;
    report += `|--------|--------|\n`;
    results.improvements.forEach((i) => {
      report += `| ${i.metric} | ${i.change} |\n`;
    });
  }

  return report;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'set-baseline') {
    console.log('📊 Setting performance baseline...\n');
    const metrics = collectCurrentMetrics();
    saveBaseline(metrics);
    return;
  }

  console.log('🔍 Running performance regression test...\n');

  // Collect current metrics
  const current = collectCurrentMetrics();

  // Load baseline
  const baseline = loadBaseline();

  // Detect regressions
  const results = detectRegressions(baseline, current);

  // Save to history
  const history = loadHistory();
  history.push(current);
  saveHistory(history);

  // Generate report
  const report = generateReport(current, baseline, results);
  const reportPath = path.join(
    CONFIG.outputDir,
    `performance-regression-${Date.now()}.md`
  );
  fs.writeFileSync(reportPath, report);

  console.log(report);
  console.log(`\n📄 Report saved to: ${reportPath}\n`);

  // Exit with error if regressions detected
  if (results.regressions.length > 0) {
    console.error('❌ Performance regressions detected!');
    process.exit(1);
  } else {
    console.log('✅ No performance regressions!');
  }
}

main().catch((error) => {
  console.error('❌ Regression test failed:', error);
  process.exit(1);
});
