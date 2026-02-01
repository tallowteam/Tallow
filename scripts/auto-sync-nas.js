#!/usr/bin/env node

/**
 * NAS Auto-Sync Bot
 * Automatically syncs the Tallow codebase to NAS storage every 15 minutes
 *
 * Usage: node scripts/auto-sync-nas.js
 *
 * Environment Variables:
 * - NAS_PATH: Path to NAS mount point (default: //NAS/Tallow-Backup)
 * - SYNC_INTERVAL: Sync interval in minutes (default: 15)
 */

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const SYNC_INTERVAL_MS = (parseInt(process.env.SYNC_INTERVAL) || 15) * 60 * 1000;
const PROJECT_ROOT = path.join(__dirname, '..');
const NAS_PATH = process.env.NAS_PATH || '//NAS/Tallow-Backup';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

/**
 * Exclude patterns for sync (node_modules, .next, etc.)
 */
const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'coverage',
  'dist',
  'build',
  '.turbo',
  '.cache',
];

const EXCLUDE_FILES = [
  '*.log',
  '.env.local',
  '.env.development.local',
  '.env.test.local',
  '.env.production.local',
  '*.tsbuildinfo',
];

/**
 * Check if NAS is accessible
 */
function checkNasConnection() {
  try {
    // On Windows, check if the path exists
    if (process.platform === 'win32') {
      // Try to access the NAS path
      const testPath = NAS_PATH.replace(/\//g, '\\');
      return fs.existsSync(testPath);
    }
    // On Unix-like systems, check if mounted
    return fs.existsSync(NAS_PATH);
  } catch {
    return false;
  }
}

/**
 * Sync to NAS using robocopy (Windows) or rsync (Unix)
 */
function syncToNas() {
  log('Starting NAS sync...', colors.blue);

  const startTime = Date.now();
  const isWindows = process.platform === 'win32';
  const targetPath = isWindows ? NAS_PATH.replace(/\//g, '\\') : NAS_PATH;

  try {
    if (isWindows) {
      // Use robocopy on Windows with execFileSync for safety
      const args = [
        PROJECT_ROOT,
        targetPath,
        '/MIR',
        '/MT:4',
        '/R:3',
        '/W:5',
        '/NJH',
        '/NJS',
        '/NDL',
        '/NC',
        '/NS',
        '/NP',
      ];

      // Add exclude directories
      EXCLUDE_DIRS.forEach(dir => {
        args.push('/XD', dir);
      });

      // Add exclude files
      EXCLUDE_FILES.forEach(file => {
        args.push('/XF', file);
      });

      try {
        const result = spawnSync('robocopy', args, {
          encoding: 'utf-8',
          windowsHide: true
        });
        // Robocopy returns exit code < 8 for success
        if (result.status >= 8) {
          throw new Error(`Robocopy failed with exit code ${result.status}`);
        }
      } catch (error) {
        if (error.status && error.status >= 8) {
          throw error;
        }
        // Exit codes < 8 are generally successful
      }
    } else {
      // Use rsync on Unix with execFileSync for safety
      const args = [
        '-avz',
        '--delete',
        ...EXCLUDE_DIRS.map(dir => `--exclude=${dir}`),
        ...EXCLUDE_FILES.map(file => `--exclude=${file}`),
        `${PROJECT_ROOT}/`,
        `${targetPath}/`,
      ];

      execFileSync('rsync', args, { encoding: 'utf-8' });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`NAS sync completed in ${duration}s`, colors.green);
    return true;
  } catch (error) {
    log(`NAS sync failed: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Get project stats using safe exec
 */
function getProjectStats() {
  try {
    const gitStatus = spawnSync('git', ['status', '--porcelain'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8'
    });
    const changedFiles = (gitStatus.stdout || '').split('\n').filter(Boolean).length;

    const gitBranch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8'
    });
    const branch = (gitBranch.stdout || 'unknown').trim();

    return { changedFiles, branch };
  } catch {
    return { changedFiles: 0, branch: 'unknown' };
  }
}

/**
 * Run sync cycle
 */
function runSyncCycle() {
  const stats = getProjectStats();

  log(`Branch: ${stats.branch} | Changed files: ${stats.changedFiles}`, colors.cyan);

  if (!checkNasConnection()) {
    log('NAS not accessible. Skipping sync...', colors.yellow);
    log('Make sure NAS is mounted and NAS_PATH is correct.', colors.yellow);
    log(`Expected path: ${NAS_PATH}`, colors.yellow);
    return;
  }

  syncToNas();
  log(`Next sync in ${SYNC_INTERVAL_MS / 60000} minutes...`, colors.blue);
}

/**
 * Main entry point
 */
function main() {
  console.log('\n' + '='.repeat(50));
  console.log('  Tallow NAS Auto-Sync Bot');
  console.log(`  Syncing to: ${NAS_PATH}`);
  console.log(`  Interval: ${SYNC_INTERVAL_MS / 60000} minutes`);
  console.log('='.repeat(50) + '\n');

  // Initial sync
  runSyncCycle();

  // Schedule periodic sync
  setInterval(runSyncCycle, SYNC_INTERVAL_MS);

  log('NAS auto-sync bot is running. Press Ctrl+C to stop.', colors.green);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\nStopping NAS auto-sync bot...', colors.yellow);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('\nStopping NAS auto-sync bot...', colors.yellow);
    process.exit(0);
  });
}

main();
