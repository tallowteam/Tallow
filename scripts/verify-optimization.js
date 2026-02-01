#!/usr/bin/env node

/**
 * Verify Development Server Optimization
 * Checks that all optimizations are properly configured
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  bright: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

const checks = {
  files: [
    { path: '.dev.env', description: 'Development environment config' },
    { path: 'next.dev.config.ts', description: 'Dev-optimized Next.js config' },
    { path: '.watchmanconfig', description: 'File watching configuration' },
    { path: 'lib/utils/memory-monitor.ts', description: 'Memory monitoring' },
    { path: 'lib/utils/cleanup-manager.ts', description: 'Resource cleanup' },
    { path: 'components/app/dev-tools-panel.tsx', description: 'Dev tools panel' },
    { path: 'scripts/dev-server.js', description: 'Optimized dev starter' },
    { path: 'scripts/health-check.js', description: 'Health check script' },
  ],
  docs: [
    { path: 'DEV_SERVER_OPTIMIZATION.md', description: 'Complete guide' },
    { path: 'DEV_SERVER_QUICK_START.md', description: 'Quick reference' },
    { path: 'DX_OPTIMIZATION_SUMMARY.md', description: 'Executive summary' },
    { path: 'README_DEV_SETUP.md', description: 'Setup guide' },
    { path: 'CHANGES_DEV_OPTIMIZATION.md', description: 'Change log' },
    { path: 'DEV_OPTIMIZATION_INDEX.md', description: 'Documentation index' },
  ],
};

function checkFile(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    const stats = fs.statSync(fullPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    log(`✅ ${description}`, colors.green);
    log(`   ${filePath} (${sizeKB} KB)`, colors.reset);
    return true;
  } else {
    log(`❌ ${description}`, colors.red);
    log(`   Missing: ${filePath}`, colors.reset);
    return false;
  }
}

function checkPackageJson() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    const requiredScripts = [
      'dev',
      'dev:simple',
      'health',
      'health:watch',
    ];

    let allPresent = true;
    for (const script of requiredScripts) {
      if (packageJson.scripts[script]) {
        log(`✅ Script: ${script}`, colors.green);
      } else {
        log(`❌ Script: ${script}`, colors.red);
        allPresent = false;
      }
    }

    return allPresent;
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, colors.red);
    return false;
  }
}

function checkServiceWorkerDisabled() {
  try {
    const swRegPath = path.join(process.cwd(), 'lib/pwa/service-worker-registration.ts');
    const content = fs.readFileSync(swRegPath, 'utf8');

    if (content.includes('NODE_ENV === \'development\'') &&
        content.includes('SKIP_SERVICE_WORKER')) {
      log('✅ Service worker disabled in development', colors.green);
      return true;
    } else {
      log('❌ Service worker not properly disabled', colors.red);
      return false;
    }
  } catch (error) {
    log(`⚠️  Could not verify service worker config: ${error.message}`, colors.yellow);
    return false;
  }
}

function checkProvidersIntegration() {
  try {
    const providersPath = path.join(process.cwd(), 'components/providers.tsx');
    const content = fs.readFileSync(providersPath, 'utf8');

    if (content.includes('DevToolsPanel')) {
      log('✅ Dev tools panel integrated', colors.green);
      return true;
    } else {
      log('❌ Dev tools panel not integrated', colors.red);
      return false;
    }
  } catch (error) {
    log(`⚠️  Could not verify providers integration: ${error.message}`, colors.yellow);
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(60), colors.bright);
  log('  Development Server Optimization Verification', colors.bright);
  log('='.repeat(60) + '\n', colors.bright);

  let totalChecks = 0;
  let passedChecks = 0;

  // Check configuration files
  log('📄 Configuration Files:', colors.blue);
  log('─'.repeat(60));
  for (const file of checks.files) {
    totalChecks++;
    if (checkFile(file.path, file.description)) {
      passedChecks++;
    }
  }
  log('');

  // Check documentation
  log('📚 Documentation:', colors.blue);
  log('─'.repeat(60));
  for (const doc of checks.docs) {
    totalChecks++;
    if (checkFile(doc.path, doc.description)) {
      passedChecks++;
    }
  }
  log('');

  // Check package.json scripts
  log('📦 Package Scripts:', colors.blue);
  log('─'.repeat(60));
  totalChecks++;
  if (checkPackageJson()) {
    passedChecks++;
  }
  log('');

  // Check service worker configuration
  log('⚙️  Configuration Checks:', colors.blue);
  log('─'.repeat(60));
  totalChecks++;
  if (checkServiceWorkerDisabled()) {
    passedChecks++;
  }
  totalChecks++;
  if (checkProvidersIntegration()) {
    passedChecks++;
  }
  log('');

  // Summary
  log('─'.repeat(60));
  const percentage = ((passedChecks / totalChecks) * 100).toFixed(1);
  const status = passedChecks === totalChecks ? colors.green : colors.yellow;

  log(`\n${status}Results: ${passedChecks}/${totalChecks} checks passed (${percentage}%)${colors.reset}\n`);

  if (passedChecks === totalChecks) {
    log('✅ All optimizations verified successfully!', colors.green);
    log('\nYou can now start the optimized dev server:', colors.blue);
    log('  npm run dev\n', colors.bright);
    return 0;
  } else {
    log('⚠️  Some checks failed. Review the output above.', colors.yellow);
    log('\nTroubleshooting:', colors.blue);
    log('  1. Ensure all files were created properly', colors.reset);
    log('  2. Check file permissions', colors.reset);
    log('  3. Review error messages above', colors.reset);
    log('  4. Consult DEV_SERVER_OPTIMIZATION.md\n', colors.reset);
    return 1;
  }
}

main()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    log(`\n❌ Verification failed: ${error.message}`, colors.red);
    process.exit(1);
  });
