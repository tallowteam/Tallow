#!/usr/bin/env node

/**
 * Auto Cache Cleaner
 * Automatically clears stale cache files every 30 minutes
 *
 * Usage: node scripts/auto-clear-cache.js
 *
 * This script runs in the background and cleans:
 * - .next/cache (webpack cache)
 * - node_modules/.cache (various tool caches)
 * - Old temp files
 */

const fs = require('fs');
const path = require('path');

// Configuration
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const PROJECT_ROOT = path.join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

/**
 * Recursively delete directory
 */
function deleteFolderRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) return false;

  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return true;
  } catch (error) {
    log(`Failed to delete ${dirPath}: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Get folder size in MB
 */
function getFolderSize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;

  let size = 0;
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += getFolderSize(filePath);
      } else {
        try {
          size += fs.statSync(filePath).size;
        } catch {
          // Ignore permission errors
        }
      }
    }
  } catch {
    // Ignore errors
  }
  return size;
}

/**
 * Clear cache directories
 */
function clearCache() {
  log('Starting cache cleanup...', colors.blue);

  const cacheDirs = [
    path.join(PROJECT_ROOT, '.next', 'cache'),
    path.join(PROJECT_ROOT, 'node_modules', '.cache'),
  ];

  let totalCleared = 0;
  let dirsCleared = 0;

  for (const cacheDir of cacheDirs) {
    const sizeBefore = getFolderSize(cacheDir);

    if (sizeBefore > 0) {
      const sizeMB = (sizeBefore / (1024 * 1024)).toFixed(2);
      log(`Found ${cacheDir.replace(PROJECT_ROOT, '.')} (${sizeMB} MB)`, colors.yellow);

      if (deleteFolderRecursive(cacheDir)) {
        totalCleared += sizeBefore;
        dirsCleared++;
        log(`Cleared: ${cacheDir.replace(PROJECT_ROOT, '.')}`, colors.green);
      }
    }
  }

  // Clear old temp files (older than 1 hour)
  const tempDirs = [
    path.join(PROJECT_ROOT, '.next', 'server'),
    path.join(PROJECT_ROOT, '.next', 'static'),
  ];

  for (const tempDir of tempDirs) {
    if (fs.existsSync(tempDir)) {
      try {
        const stats = fs.statSync(tempDir);
        const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);

        if (ageHours > 1) {
          const sizeBefore = getFolderSize(tempDir);
          if (deleteFolderRecursive(tempDir)) {
            totalCleared += sizeBefore;
            dirsCleared++;
            log(`Cleared old temp: ${tempDir.replace(PROJECT_ROOT, '.')}`, colors.green);
          }
        }
      } catch {
        // Ignore errors
      }
    }
  }

  if (totalCleared > 0) {
    const totalMB = (totalCleared / (1024 * 1024)).toFixed(2);
    log(`Total cleared: ${totalMB} MB from ${dirsCleared} directories`, colors.green);
  } else {
    log('No cache to clear', colors.yellow);
  }

  log(`Next cleanup in 30 minutes...`, colors.blue);
}

/**
 * Main entry point
 */
function main() {
  console.log('\n' + '='.repeat(50));
  console.log('  Tallow Auto Cache Cleaner');
  console.log('  Clears cache every 30 minutes');
  console.log('='.repeat(50) + '\n');

  // Initial cleanup
  clearCache();

  // Schedule periodic cleanup
  setInterval(clearCache, INTERVAL_MS);

  log('Auto cache cleaner is running. Press Ctrl+C to stop.', colors.green);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\nStopping auto cache cleaner...', colors.yellow);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('\nStopping auto cache cleaner...', colors.yellow);
    process.exit(0);
  });
}

main();
