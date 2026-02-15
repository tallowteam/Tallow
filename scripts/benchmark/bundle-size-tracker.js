#!/usr/bin/env node

/**
 * Bundle Size Tracker
 * Tracks and compares bundle sizes across builds
 */

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  buildDir: path.join(__dirname, '../../.next'),
  historyFile: path.join(__dirname, '../../reports/bundle-history.json'),
  budgets: {
    // Calibrated against the current production baseline with safety headroom.
    totalGzip: 1400 * 1024, // 1.37MB
    totalRaw: 5000 * 1024, // 4.88MB
    mainChunkGzip: 150 * 1024, // 150KB
    cssGzip: 85 * 1024, // 85KB
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

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = gzipSync(content, { level: 9 });
  return gzipped.length;
}

// =============================================================================
// BUNDLE ANALYZER
// =============================================================================

function analyzeBundle() {
  const staticDir = path.join(CONFIG.buildDir, 'static');

  if (!fs.existsSync(staticDir)) {
    console.error('❌ Build not found. Run `npm run build` first.');
    process.exit(1);
  }

  const results = {
    timestamp: new Date().toISOString(),
    chunks: [],
    totals: {
      raw: 0,
      gzip: 0,
    },
  };

  // Analyze JavaScript chunks
  const chunksDir = path.join(staticDir, 'chunks');
  if (fs.existsSync(chunksDir)) {
    analyzeDirectory(chunksDir, results, 'js');
  }

  // Analyze CSS
  const cssDir = path.join(staticDir, 'css');
  if (fs.existsSync(cssDir)) {
    analyzeDirectory(cssDir, results, 'css');
  }

  // Analyze pages
  const pagesDir = path.join(CONFIG.buildDir, 'static', 'chunks', 'pages');
  if (fs.existsSync(pagesDir)) {
    analyzeDirectory(pagesDir, results, 'page');
  }

  return results;
}

function analyzeDirectory(dir, results, type) {
  const files = getAllFiles(dir);

  files.forEach((file) => {
    const ext = path.extname(file);
    if (ext !== '.js' && ext !== '.css') return;

    const stats = fs.statSync(file);
    const rawSize = stats.size;
    const gzipSize = getGzipSize(file);

    const relativePath = path.relative(CONFIG.buildDir, file);

    results.chunks.push({
      name: relativePath,
      type,
      raw: rawSize,
      gzip: gzipSize,
    });

    results.totals.raw += rawSize;
    results.totals.gzip += gzipSize;
  });
}

function getAllFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  });

  return files;
}

// =============================================================================
// HISTORY MANAGEMENT
// =============================================================================

function loadHistory() {
  if (!fs.existsSync(CONFIG.historyFile)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(CONFIG.historyFile, 'utf-8'));
}

function saveHistory(history) {
  ensureDir(path.dirname(CONFIG.historyFile));
  fs.writeFileSync(CONFIG.historyFile, JSON.stringify(history, null, 2));
}

// =============================================================================
// BUDGET CHECKER
// =============================================================================

function checkBudgets(results) {
  const violations = [];

  // Check total gzip size
  if (results.totals.gzip > CONFIG.budgets.totalGzip) {
    violations.push({
      metric: 'Total Bundle Size (Gzip)',
      actual: formatBytes(results.totals.gzip),
      budget: formatBytes(CONFIG.budgets.totalGzip),
      diff: formatBytes(results.totals.gzip - CONFIG.budgets.totalGzip),
    });
  }

  // Check total raw size
  if (results.totals.raw > CONFIG.budgets.totalRaw) {
    violations.push({
      metric: 'Total Bundle Size (Raw)',
      actual: formatBytes(results.totals.raw),
      budget: formatBytes(CONFIG.budgets.totalRaw),
      diff: formatBytes(results.totals.raw - CONFIG.budgets.totalRaw),
    });
  }

  // Check main chunk
  const mainChunk = results.chunks.find((c) => c.name.includes('main'));
  if (mainChunk && mainChunk.gzip > CONFIG.budgets.mainChunkGzip) {
    violations.push({
      metric: 'Main Chunk Size (Gzip)',
      actual: formatBytes(mainChunk.gzip),
      budget: formatBytes(CONFIG.budgets.mainChunkGzip),
      diff: formatBytes(mainChunk.gzip - CONFIG.budgets.mainChunkGzip),
    });
  }

  // Check CSS
  const cssChunks = results.chunks.filter((c) => c.type === 'css');
  const totalCssGzip = cssChunks.reduce((sum, c) => sum + c.gzip, 0);
  if (totalCssGzip > CONFIG.budgets.cssGzip) {
    violations.push({
      metric: 'Total CSS Size (Gzip)',
      actual: formatBytes(totalCssGzip),
      budget: formatBytes(CONFIG.budgets.cssGzip),
      diff: formatBytes(totalCssGzip - CONFIG.budgets.cssGzip),
    });
  }

  return violations;
}

// =============================================================================
// COMPARISON
// =============================================================================

function compareWithPrevious(current, previous) {
  if (!previous) return null;

  const diff = {
    raw: current.totals.raw - previous.totals.raw,
    gzip: current.totals.gzip - previous.totals.gzip,
  };

  const percentChange = {
    raw: ((diff.raw / previous.totals.raw) * 100).toFixed(2),
    gzip: ((diff.gzip / previous.totals.gzip) * 100).toFixed(2),
  };

  return { diff, percentChange };
}

// =============================================================================
// REPORT GENERATOR
// =============================================================================

function generateReport(results, comparison) {
  let report = `
# Bundle Size Report
Generated: ${results.timestamp}

## Summary

| Metric | Size (Raw) | Size (Gzip) |
|--------|------------|-------------|
| Total | ${formatBytes(results.totals.raw)} | ${formatBytes(results.totals.gzip)} |
`;

  if (comparison) {
    report += `\n## Change from Previous Build\n\n`;
    report += `| Metric | Change | Percentage |\n`;
    report += `|--------|--------|------------|\n`;
    report += `| Raw | ${comparison.diff.raw >= 0 ? '+' : ''}${formatBytes(comparison.diff.raw)} | ${comparison.percentChange.raw}% |\n`;
    report += `| Gzip | ${comparison.diff.gzip >= 0 ? '+' : ''}${formatBytes(comparison.diff.gzip)} | ${comparison.percentChange.gzip}% |\n`;
  }

  // Top 10 largest chunks
  const topChunks = [...results.chunks]
    .sort((a, b) => b.gzip - a.gzip)
    .slice(0, 10);

  report += `\n## Top 10 Largest Chunks (Gzip)\n\n`;
  report += `| Chunk | Raw | Gzip | Type |\n`;
  report += `|-------|-----|------|------|\n`;

  topChunks.forEach((chunk) => {
    report += `| ${chunk.name} | ${formatBytes(chunk.raw)} | ${formatBytes(chunk.gzip)} | ${chunk.type} |\n`;
  });

  // Budget violations
  const violations = checkBudgets(results);
  if (violations.length > 0) {
    report += `\n## ⚠️ Budget Violations\n\n`;
    report += `| Metric | Actual | Budget | Over Budget |\n`;
    report += `|--------|--------|--------|-------------|\n`;
    violations.forEach((v) => {
      report += `| ${v.metric} | ${v.actual} | ${v.budget} | ${v.diff} |\n`;
    });
  } else {
    report += `\n## ✅ All Budgets Met!\n`;
  }

  return report;
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  console.log('📦 Analyzing bundle size...\n');

  // Analyze current build
  const results = analyzeBundle();

  console.log('Bundle Size Summary:');
  console.log(`  Raw: ${formatBytes(results.totals.raw)}`);
  console.log(`  Gzip: ${formatBytes(results.totals.gzip)}`);
  console.log(`  Chunks: ${results.chunks.length}`);

  // Load history
  const history = loadHistory();
  const previous = history[history.length - 1];

  // Compare with previous
  const comparison = compareWithPrevious(results, previous);
  if (comparison) {
    console.log('\nChange from previous build:');
    console.log(`  Raw: ${comparison.diff.raw >= 0 ? '+' : ''}${formatBytes(comparison.diff.raw)} (${comparison.percentChange.raw}%)`);
    console.log(`  Gzip: ${comparison.diff.gzip >= 0 ? '+' : ''}${formatBytes(comparison.diff.gzip)} (${comparison.percentChange.gzip}%)`);
  }

  // Save to history
  history.push(results);
  // Keep only last 30 builds
  if (history.length > 30) {
    history.shift();
  }
  saveHistory(history);

  // Generate report
  const report = generateReport(results, comparison);
  const reportPath = path.join(__dirname, '../../reports/bundle-size-report.md');
  ensureDir(path.dirname(reportPath));
  fs.writeFileSync(reportPath, report);

  console.log(`\n✅ Report saved to: ${reportPath}`);

  // Check budgets
  const violations = checkBudgets(results);
  if (violations.length > 0) {
    console.error('\n❌ Bundle size budget violations:');
    violations.forEach((v) => {
      console.error(`  ${v.metric}: ${v.actual} (budget: ${v.budget}, over by ${v.diff})`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All bundle size budgets met!');
  }
}

main();
