#!/usr/bin/env node

/**
 * Clear Service Workers and Caches Script
 * Run this before starting the dev server to ensure clean state
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function clearNextCache() {
  const nextDir = path.join(process.cwd(), '.next');

  if (fs.existsSync(nextDir)) {
    log('🧹 Clearing .next cache...', colors.blue);
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      log('✅ .next cache cleared', colors.green);
    } catch (error) {
      log(`⚠️  Failed to clear .next cache: ${error.message}`, colors.yellow);
    }
  } else {
    log('✅ No .next cache to clear', colors.green);
  }
}

function createDevModeNotice() {
  const noticeFile = path.join(process.cwd(), 'public', 'sw-dev-mode.txt');
  const notice = `
Service Worker Development Mode
================================

The service worker is DISABLED in development mode to prevent conflicts
with Next.js Hot Module Replacement (HMR) and webpack dev server.

This prevents:
- 408 Request Timeout errors
- Failed resource loads
- Stale cached content during development

The service worker will be active in production builds.

Generated: ${new Date().toISOString()}
`;

  try {
    fs.writeFileSync(noticeFile, notice);
    log('✅ Created service worker dev mode notice', colors.green);
  } catch (error) {
    log(`⚠️  Failed to create notice file: ${error.message}`, colors.yellow);
  }
}

function main() {
  log('\n' + '='.repeat(60), colors.blue);
  log('  Clearing Service Workers and Caches', colors.blue);
  log('='.repeat(60) + '\n', colors.blue);

  clearNextCache();
  createDevModeNotice();

  log('\n✨ Ready to start dev server!', colors.green);
  log('💡 Tip: Run "npm run dev" to start the development server\n', colors.yellow);
}

main();
