#!/usr/bin/env node

/**
 * Generate Performance Baseline
 * Creates a baseline performance report for comparison
 *
 * Usage:
 * - Generate baseline: node scripts/generate-baseline.js
 * - Save to custom file: node scripts/generate-baseline.js baseline-v1.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function generateBaseline() {
  log('\n=== Generating Performance Baseline ===\n', 'bright');

  const outputFile = process.argv[2] || 'performance-baseline.json';
  const outputPath = path.join(process.cwd(), outputFile);

  try {
    // Step 1: Ensure build is up to date
    log('Step 1: Building application...', 'cyan');
    execSync('npm run build', { stdio: 'inherit' });

    // Step 2: Run performance tests
    log('\nStep 2: Running performance tests...', 'cyan');
    execSync('node scripts/performance-test.js full', { stdio: 'inherit' });

    // Step 3: Copy report to baseline
    const reportPath = path.join(process.cwd(), 'performance-report.json');

    if (!fs.existsSync(reportPath)) {
      log('\nError: Performance report not found', 'yellow');
      log('Make sure performance tests completed successfully', 'yellow');
      process.exit(1);
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    // Add metadata
    report.baseline = true;
    report.baselineDate = new Date().toISOString();
    report.nodeVersion = process.version;
    report.platform = process.platform;

    // Save baseline
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    log(`\nBaseline saved to: ${outputPath}`, 'green');
    log('\nBaseline Summary:', 'cyan');
    log('─'.repeat(50), 'cyan');

    if (report.results) {
      Object.entries(report.results).forEach(([test, result]) => {
        const status = result.passed ? '✓' : '✗';
        log(`${status} ${test}: ${result.passed ? 'PASS' : 'FAIL'}`, result.passed ? 'green' : 'yellow');
      });
    }

    log('\nNext Steps:', 'cyan');
    log('1. Commit this baseline to version control', 'reset');
    log('2. Use it for performance regression testing', 'reset');
    log('3. Compare future performance reports against this baseline', 'reset');

  } catch (error) {
    log(`\nError generating baseline: ${error.message}`, 'yellow');
    process.exit(1);
  }
}

generateBaseline();
