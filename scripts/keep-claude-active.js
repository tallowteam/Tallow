#!/usr/bin/env node

/**
 * Keep Claude Code Active - Auto Progress Script
 * This script simulates activity to prevent Claude Code from timing out
 */

const robot = require('robotjs');

// Configuration
const CONFIG = {
  intervalSeconds: process.env.INTERVAL || 30,
  key: process.env.KEY || 'k',
  autoAccept: process.env.AUTO_ACCEPT !== 'false',
  verbose: process.env.VERBOSE === 'true'
};

console.log('\x1b[36m%s\x1b[0m', '=== Claude Code Keep-Alive Script ===');
console.log('\x1b[32m%s\x1b[0m', `Interval: ${CONFIG.intervalSeconds} seconds`);
console.log('\x1b[32m%s\x1b[0m', `Key to press: ${CONFIG.key}`);
console.log('\x1b[32m%s\x1b[0m', `Auto-accept: ${CONFIG.autoAccept}`);
console.log('');
console.log('\x1b[33m%s\x1b[0m', 'Press Ctrl+C to stop');
console.log('\x1b[33m%s\x1b[0m', 'Starting in 3 seconds...');

// Check if robotjs is available
try {
  require.resolve('robotjs');
} catch (e) {
  console.log('');
  console.log('\x1b[31m%s\x1b[0m', 'ERROR: robotjs not installed');
  console.log('\x1b[33m%s\x1b[0m', 'Install with: npm install robotjs');
  console.log('\x1b[33m%s\x1b[0m', 'Alternative: Use the PowerShell version (keep-claude-active.ps1)');
  process.exit(1);
}

let iteration = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false });
}

async function simulateActivity() {
  try {
    iteration++;
    const timestamp = getTimestamp();

    console.log('\x1b[36m%s\x1b[0m', `[${timestamp}] Iteration #${iteration}`);

    // Simulate key press (type and immediately delete)
    if (CONFIG.key) {
      if (CONFIG.verbose) {
        console.log('\x1b[90m%s\x1b[0m', `  → Pressing '${CONFIG.key}' key...`);
      }

      robot.keyTap(CONFIG.key);
      await sleep(100);
      robot.keyTap('backspace');

      console.log('\x1b[32m%s\x1b[0m', '  ✓ Key pressed and erased');
    }

    // Auto-accept progress (simulate Enter key)
    if (CONFIG.autoAccept) {
      await sleep(500);

      if (CONFIG.verbose) {
        console.log('\x1b[90m%s\x1b[0m', '  → Auto-accepting progress...');
      }

      robot.keyTap('enter');
      console.log('\x1b[32m%s\x1b[0m', '  ✓ Progress accepted');
    }

    // Wait for next iteration
    console.log('\x1b[90m%s\x1b[0m', `  ⏳ Waiting ${CONFIG.intervalSeconds} seconds...`);
    console.log('');

  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `  ✗ Error: ${error.message}`);
  }
}

async function main() {
  // Initial delay
  await sleep(3000);

  console.log('');
  console.log('\x1b[32m%s\x1b[0m', '✓ Script started');
  console.log('');

  // Run continuously
  const intervalMs = CONFIG.intervalSeconds * 1000;

  // Run first iteration immediately
  await simulateActivity();

  // Then repeat on interval
  const timer = setInterval(simulateActivity, intervalMs);

  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('');
    console.log('\x1b[33m%s\x1b[0m', '=== Script Terminated ===');
    clearInterval(timer);
    process.exit(0);
  });
}

main().catch(error => {
  console.error('\x1b[31m%s\x1b[0m', `Fatal error: ${error.message}`);
  process.exit(1);
});
