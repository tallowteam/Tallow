#!/usr/bin/env node

/**
 * Bundle Size Checker
 * Validates that bundle sizes are within acceptable limits
 * Run after: npm run build
 */

const fs = require('fs');
const path = require('path');

// Bundle size limits (in KB)
const LIMITS = {
  mainBundle: 150,      // Main application bundle
  totalJS: 800,         // Total JavaScript
  totalFonts: 200,      // Total font files
  totalCSS: 100,        // Total CSS
};

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function formatSize(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function getDirectorySize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;

  let totalSize = 0;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  });

  return totalSize;
}

function checkBundleSize() {
  log('\n=== Bundle Size Check ===\n', 'cyan');

  const nextDir = path.join(process.cwd(), '.next');

  if (!fs.existsSync(nextDir)) {
    log('Error: .next directory not found. Run npm run build first.', 'red');
    process.exit(1);
  }

  let hasErrors = false;
  const results = [];

  // Check JavaScript bundles
  const chunksDir = path.join(nextDir, 'static', 'chunks');
  if (fs.existsSync(chunksDir)) {
    const jsSize = getDirectorySize(chunksDir);
    const jsKB = jsSize / 1024;
    const passed = jsKB <= LIMITS.totalJS;

    results.push({
      name: 'Total JavaScript',
      size: formatSize(jsSize),
      limit: LIMITS.totalJS + ' KB',
      passed,
    });

    if (!passed) hasErrors = true;

    // Check main bundle specifically
    const mainBundlePath = path.join(chunksDir, 'app');
    if (fs.existsSync(mainBundlePath)) {
      const mainSize = getDirectorySize(mainBundlePath);
      const mainKB = mainSize / 1024;
      const mainPassed = mainKB <= LIMITS.mainBundle;

      results.push({
        name: 'Main Bundle',
        size: formatSize(mainSize),
        limit: LIMITS.mainBundle + ' KB',
        passed: mainPassed,
      });

      if (!mainPassed) hasErrors = true;
    }
  }

  // Check fonts
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  if (fs.existsSync(fontsDir)) {
    const fontsSize = getDirectorySize(fontsDir);
    const fontsKB = fontsSize / 1024;
    const passed = fontsKB <= LIMITS.totalFonts;

    results.push({
      name: 'Total Fonts',
      size: formatSize(fontsSize),
      limit: LIMITS.totalFonts + ' KB',
      passed,
    });

    if (!passed) hasErrors = true;
  }

  // Check CSS
  const cssDir = path.join(nextDir, 'static', 'css');
  if (fs.existsSync(cssDir)) {
    const cssSize = getDirectorySize(cssDir);
    const cssKB = cssSize / 1024;
    const passed = cssKB <= LIMITS.totalCSS;

    results.push({
      name: 'Total CSS',
      size: formatSize(cssSize),
      limit: LIMITS.totalCSS + ' KB',
      passed,
    });

    if (!passed) hasErrors = true;
  }

  // Print results
  results.forEach(result => {
    const status = result.passed ? '✓' : '✗';
    const color = result.passed ? 'green' : 'red';
    log(`${status} ${result.name}: ${result.size} (limit: ${result.limit})`, color);
  });

  // Summary
  log('', 'reset');
  if (hasErrors) {
    log('❌ Bundle size check FAILED. Some bundles exceed limits.', 'red');
    log('Run ANALYZE=true npm run build to investigate.', 'yellow');
    process.exit(1);
  } else {
    log('✅ Bundle size check PASSED. All bundles within limits.', 'green');
    process.exit(0);
  }
}

// Run the check
try {
  checkBundleSize();
} catch (error) {
  log(`\nError: ${error.message}`, 'red');
  process.exit(1);
}
