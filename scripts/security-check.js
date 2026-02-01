#!/usr/bin/env node

/**
 * Security Verification Script
 * Automated checks for common security vulnerabilities
 *
 * Run with: node scripts/security-check.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const issues = {
  critical: [],
  high: [],
  medium: [],
  low: [],
};

let totalFiles = 0;
let scannedFiles = 0;

/**
 * Log with color
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Report an issue
 */
function reportIssue(severity, file, line, message, code) {
  const issue = {
    file: path.relative(process.cwd(), file),
    line,
    message,
    code,
  };
  issues[severity].push(issue);
}

/**
 * Recursively get all TypeScript/JavaScript files
 */
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, .git
      if (!['node_modules', '.next', '.git', 'dist', 'build', '.claude'].includes(file)) {
        getFiles(filePath, fileList);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(filePath);
      totalFiles++;
    }
  });

  return fileList;
}

/**
 * Check for Math.random() in crypto code
 */
function checkMathRandom(content, filePath) {
  const lines = content.split('\n');
  const isCryptoFile = filePath.includes('/crypto/') || filePath.includes('\\crypto\\');

  lines.forEach((line, index) => {
    if (line.includes('Math.random()')) {
      if (isCryptoFile) {
        reportIssue(
          'critical',
          filePath,
          index + 1,
          'Math.random() found in crypto code - use crypto.getRandomValues()',
          line.trim()
        );
      } else if (
        !line.includes('// OK:') &&
        !line.includes('// SAFE:') &&
        !line.includes('test')
      ) {
        reportIssue(
          'medium',
          filePath,
          index + 1,
          'Math.random() found - consider crypto.getRandomValues() for security-sensitive code',
          line.trim()
        );
      }
    }
  });
}

/**
 * Check for console.log in lib/
 */
function checkConsoleLog(content, filePath) {
  const lines = content.split('\n');
  const isLibFile = filePath.includes('/lib/') || filePath.includes('\\lib\\');
  const isTestFile = filePath.includes('.test.') || filePath.includes('.spec.');

  if (!isLibFile || isTestFile) return;

  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

    if (
      /console\.(log|info|debug|warn|error)/.test(line) &&
      !line.includes('secureLog') &&
      !line.includes('// OK:') &&
      !line.includes('// SAFE:')
    ) {
      reportIssue(
        'medium',
        filePath,
        index + 1,
        'console.log found in lib/ - use secure-logger instead',
        line.trim()
      );
    }
  });
}

/**
 * Check for hardcoded secrets/credentials
 */
function checkHardcodedSecrets(content, filePath) {
  const lines = content.split('\n');
  const secretPatterns = [
    { pattern: /api[_-]?key\s*=\s*['"][^'"]{20,}/i, name: 'API Key' },
    { pattern: /password\s*=\s*['"][^'"]+['"]/i, name: 'Password' },
    { pattern: /secret\s*=\s*['"][^'"]{20,}/i, name: 'Secret' },
    { pattern: /token\s*=\s*['"][^'"]{20,}/i, name: 'Token' },
    { pattern: /bearer\s+[a-zA-Z0-9_-]{20,}/i, name: 'Bearer Token' },
    { pattern: /sk_live_[a-zA-Z0-9]{20,}/i, name: 'Stripe Secret Key' },
    { pattern: /pk_live_[a-zA-Z0-9]{20,}/i, name: 'Stripe Publishable Key' },
  ];

  lines.forEach((line, index) => {
    // Skip comments and test files
    if (
      line.trim().startsWith('//') ||
      line.trim().startsWith('*') ||
      filePath.includes('.test.') ||
      filePath.includes('.spec.') ||
      filePath.includes('.example')
    ) {
      return;
    }

    secretPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(line)) {
        // Check if it's from env vars (safe)
        if (
          line.includes('process.env') ||
          line.includes('import.meta.env') ||
          line.includes('// SAFE:') ||
          line.includes('example') ||
          line.includes('placeholder')
        ) {
          return;
        }

        reportIssue(
          'critical',
          filePath,
          index + 1,
          `Potential hardcoded ${name} - use environment variables`,
          line.trim().substring(0, 80)
        );
      }
    });
  });
}

/**
 * Check for timing-safe comparisons in crypto code
 */
function checkTimingSafeComparisons(content, filePath) {
  const lines = content.split('\n');
  const isCryptoFile = filePath.includes('/crypto/') || filePath.includes('\\crypto\\');

  if (!isCryptoFile) return;

  lines.forEach((line, index) => {
    // Look for hash/MAC comparisons that might not be timing-safe
    if (
      (/hash\s*[!=]==/.test(line) ||
        /mac\s*[!=]==/.test(line) ||
        /signature\s*[!=]==/.test(line)) &&
      !line.includes('timingSafeEqual') &&
      !line.includes('constantTimeEqual') &&
      !line.includes('crypto.timingSafeEqual') &&
      !line.trim().startsWith('//')
    ) {
      reportIssue(
        'medium',
        filePath,
        index + 1,
        'Potential timing attack vulnerability - use crypto.timingSafeEqual()',
        line.trim()
      );
    }
  });
}

/**
 * Check for eval() and new Function()
 */
function checkDangerousCode(content, filePath) {
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

    if (/\beval\s*\(/.test(line) && !line.includes('// SAFE:')) {
      reportIssue(
        'critical',
        filePath,
        index + 1,
        'eval() is dangerous and should be avoided',
        line.trim()
      );
    }

    if (/new\s+Function\s*\(/.test(line) && !line.includes('// SAFE:')) {
      reportIssue(
        'high',
        filePath,
        index + 1,
        'new Function() is dangerous and should be avoided',
        line.trim()
      );
    }

    if (/dangerouslySetInnerHTML/.test(line) && !filePath.includes('.test.')) {
      reportIssue(
        'high',
        filePath,
        index + 1,
        'dangerouslySetInnerHTML found - ensure content is sanitized',
        line.trim()
      );
    }
  });
}

/**
 * Check for insecure imports
 */
function checkInsecureImports(content, filePath) {
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for secure-logger usage in lib/
    const isLibFile = filePath.includes('/lib/') || filePath.includes('\\lib\\');
    if (
      isLibFile &&
      /import.*from\s+['"]@\/lib\/utils\/logger['"]/.test(line) &&
      !line.includes('secure-logger')
    ) {
      reportIssue(
        'low',
        filePath,
        index + 1,
        'Use secure-logger instead of regular logger in lib/',
        line.trim()
      );
    }
  });
}

/**
 * Check for missing memory cleanup in crypto files
 */
function checkMemoryCleanup(content, filePath) {
  const isCryptoFile = filePath.includes('/crypto/') || filePath.includes('\\crypto\\');
  if (!isCryptoFile) return;

  const lines = content.split('\n');
  let inFunction = false;
  let functionName = '';
  let hasKeyMaterial = false;
  let hasCleanup = false;

  lines.forEach((line, index) => {
    // Detect function start
    if (/function\s+\w+|async\s+\w+|=>\s*{/.test(line)) {
      inFunction = true;
      functionName = line.trim();
      hasKeyMaterial = false;
      hasCleanup = false;
    }

    if (inFunction) {
      // Check for key material variables
      if (
        /\b(key|secret|private|signature|hash|mac)\b.*=\s*new\s+Uint8Array/.test(
          line
        ) ||
        /\b(shared|derived|epoch)Secret\b/.test(line)
      ) {
        hasKeyMaterial = true;
      }

      // Check for cleanup
      if (/\.fill\(0\)/.test(line) || /secureDelete\(/.test(line)) {
        hasCleanup = true;
      }

      // Detect function end
      if (line.trim() === '}' && hasKeyMaterial && !hasCleanup) {
        reportIssue(
          'medium',
          filePath,
          index + 1,
          'Key material may not be cleaned up - consider adding .fill(0)',
          functionName.substring(0, 60)
        );
        inFunction = false;
      } else if (line.trim() === '}') {
        inFunction = false;
      }
    }
  });
}

/**
 * Scan a single file
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    checkMathRandom(content, filePath);
    checkConsoleLog(content, filePath);
    checkHardcodedSecrets(content, filePath);
    checkTimingSafeComparisons(content, filePath);
    checkDangerousCode(content, filePath);
    checkInsecureImports(content, filePath);
    checkMemoryCleanup(content, filePath);

    scannedFiles++;
  } catch (error) {
    log(`Error scanning ${filePath}: ${error.message}`, 'red');
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(80));
  log('Security Scan Complete', 'cyan');
  console.log('='.repeat(80));

  log(`\nFiles scanned: ${scannedFiles}/${totalFiles}`, 'blue');

  const total =
    issues.critical.length +
    issues.high.length +
    issues.medium.length +
    issues.low.length;

  if (total === 0) {
    log('\n✓ No security issues found!', 'green');
    return 0;
  }

  log(`\nTotal issues: ${total}`, 'yellow');

  if (issues.critical.length > 0) {
    log(`\n${'='.repeat(80)}`, 'red');
    log(`CRITICAL (${issues.critical.length})`, 'red');
    log('='.repeat(80), 'red');
    issues.critical.forEach((issue) => {
      log(`\n${issue.file}:${issue.line}`, 'red');
      log(`  ${issue.message}`, 'yellow');
      log(`  ${issue.code}`, 'cyan');
    });
  }

  if (issues.high.length > 0) {
    log(`\n${'='.repeat(80)}`, 'magenta');
    log(`HIGH (${issues.high.length})`, 'magenta');
    log('='.repeat(80), 'magenta');
    issues.high.forEach((issue) => {
      log(`\n${issue.file}:${issue.line}`, 'magenta');
      log(`  ${issue.message}`, 'yellow');
      log(`  ${issue.code}`, 'cyan');
    });
  }

  if (issues.medium.length > 0) {
    log(`\n${'='.repeat(80)}`, 'yellow');
    log(`MEDIUM (${issues.medium.length})`, 'yellow');
    log('='.repeat(80), 'yellow');
    issues.medium.forEach((issue) => {
      log(`\n${issue.file}:${issue.line}`, 'yellow');
      log(`  ${issue.message}`, 'reset');
      log(`  ${issue.code}`, 'cyan');
    });
  }

  if (issues.low.length > 0) {
    log(`\n${'='.repeat(80)}`, 'blue');
    log(`LOW (${issues.low.length})`, 'blue');
    log('='.repeat(80), 'blue');
    issues.low.forEach((issue) => {
      log(`\n${issue.file}:${issue.line}`, 'blue');
      log(`  ${issue.message}`, 'reset');
      log(`  ${issue.code}`, 'cyan');
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Exit with error code if critical or high issues found
  if (issues.critical.length > 0 || issues.high.length > 0) {
    log('❌ Critical or high-severity issues found!', 'red');
    return 1;
  } else {
    log('⚠️  Medium or low-severity issues found', 'yellow');
    return 0;
  }
}

/**
 * Main function
 */
function main() {
  log('\n' + '='.repeat(80), 'cyan');
  log('Security Scanner for Tallow', 'cyan');
  log('='.repeat(80) + '\n', 'cyan');

  const rootDir = process.cwd();

  log('Scanning directories:', 'blue');
  log('  - lib/', 'reset');
  log('  - app/', 'reset');
  log('  - components/', 'reset');
  log('  - pages/', 'reset');
  log('', 'reset');

  const dirsToScan = ['lib', 'app', 'components', 'pages'].filter((dir) =>
    fs.existsSync(path.join(rootDir, dir))
  );

  const files = [];
  dirsToScan.forEach((dir) => {
    getFiles(path.join(rootDir, dir), files);
  });

  log(`Found ${totalFiles} files to scan\n`, 'blue');

  const startTime = Date.now();
  files.forEach(scanFile);
  const endTime = Date.now();

  log(`\nScan completed in ${((endTime - startTime) / 1000).toFixed(2)}s`, 'blue');

  const exitCode = printSummary();
  process.exit(exitCode);
}

// Run the scanner
main();
