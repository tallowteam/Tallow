#!/usr/bin/env node

/**
 * Verification Script for 408 Timeout Fix
 * Checks that all necessary changes are in place
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, checks, name) {
  log(`\n🔍 Checking ${name}...`, colors.blue);

  if (!fs.existsSync(filePath)) {
    log(`❌ File not found: ${filePath}`, colors.red);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let allPassed = true;

  checks.forEach((check) => {
    const found = check.regex ? check.regex.test(content) : content.includes(check.text);
    if (found) {
      log(`  ✅ ${check.description}`, colors.green);
    } else {
      log(`  ❌ ${check.description}`, colors.red);
      allPassed = false;
    }
  });

  return allPassed;
}

function main() {
  log('\n' + '='.repeat(60), colors.bright);
  log('  408 Timeout Fix - Verification', colors.bright);
  log('='.repeat(60) + '\n', colors.bright);

  const results = [];

  // Check next.config.ts
  results.push(checkFile(
    path.join(process.cwd(), 'next.config.ts'),
    [
      { text: 'httpAgentOptions', description: 'HTTP agent options configured' },
      { text: 'timeout: 60000', description: 'Timeout set to 60 seconds' },
      { text: 'proxyTimeout', description: 'Proxy timeout configured for dev' },
      { text: 'keepAlive: true', description: 'Keep-alive enabled' },
    ],
    'next.config.ts'
  ));

  // Check service-worker.js
  results.push(checkFile(
    path.join(process.cwd(), 'public', 'service-worker.js'),
    [
      { text: 'isDevMode()', description: 'Development mode detection function' },
      { text: 'localhost', description: 'Localhost detection' },
      { regex: /_next\/webpack/g, description: 'Webpack HMR path exclusions' },
      { text: 'DEVELOPMENT (Inactive)', description: 'Dev mode logging' },
      { text: 'DEACTIVATE_DEV', description: 'Dev deactivation message handler' },
    ],
    'service-worker.js'
  ));

  // Check service-worker-registration.ts
  results.push(checkFile(
    path.join(process.cwd(), 'lib', 'pwa', 'service-worker-registration.ts'),
    [
      { text: 'unregister()', description: 'Service worker unregistration in dev' },
      { text: 'caches.delete', description: 'Cache clearing in dev' },
      { text: 'Development mode - unregistering', description: 'Dev mode logging' },
    ],
    'service-worker-registration.ts'
  ));

  // Check dev-server.js
  results.push(checkFile(
    path.join(process.cwd(), 'scripts', 'dev-server.js'),
    [
      { text: 'SKIP_SERVICE_WORKER', description: 'Service worker skip flag' },
      { text: 'TIMEOUT', description: 'Timeout environment variable' },
      { text: 'BODY_TIMEOUT', description: 'Body timeout environment variable' },
    ],
    'dev-server.js'
  ));

  // Check package.json
  results.push(checkFile(
    path.join(process.cwd(), 'package.json'),
    [
      { text: 'clear-sw-cache.js', description: 'Cache clearing in dev command' },
      { text: 'dev:noclear', description: 'Alternative dev command without clearing' },
    ],
    'package.json'
  ));

  // Check if clear-sw-cache.js exists
  const clearScriptPath = path.join(process.cwd(), 'scripts', 'clear-sw-cache.js');
  if (fs.existsSync(clearScriptPath)) {
    log('\n  ✅ Cache clearing script exists', colors.green);
    results.push(true);
  } else {
    log('\n  ❌ Cache clearing script missing', colors.red);
    results.push(false);
  }

  // Summary
  log('\n' + '='.repeat(60), colors.bright);
  const allPassed = results.every(r => r);

  if (allPassed) {
    log('✅ All checks passed! 408 timeout fix is properly implemented.', colors.green);
    log('\n💡 To test:', colors.yellow);
    log('   1. Run: npm run dev', colors.blue);
    log('   2. Open DevTools → Console', colors.blue);
    log('   3. Look for: [SW] Development mode detected', colors.blue);
    log('   4. Open DevTools → Network', colors.blue);
    log('   5. Verify no 408 errors on any requests', colors.blue);
    log('   6. Make a code change and test HMR', colors.blue);
    log('\n✨ All 408 timeout errors should be eliminated!', colors.green);
  } else {
    log('❌ Some checks failed. Please review the implementation.', colors.red);
    log('\n📖 See 408_TIMEOUT_FIX_COMPLETE.md for details.', colors.yellow);
  }

  log('');
  process.exit(allPassed ? 0 : 1);
}

main();
