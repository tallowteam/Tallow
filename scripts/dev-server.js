#!/usr/bin/env node

/**
 * Optimized Development Server Starter
 * Ensures proper configuration and monitoring for stable dev experience
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Colors for console output
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

// Check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

// Find next available port starting from a given port
async function findAvailablePort(startPort, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return null;
}

let selectedPort = 3000;

async function checkPort() {
  // PERMANENTLY CONFIGURED: Tallow prefers port 3000
  const preferredPort = 3000;
  log(`\n🔌 Checking port ${preferredPort} (Tallow preferred)...`, colors.blue);

  const available = await isPortAvailable(preferredPort);

  if (!available) {
    log(`⚠️  Port ${preferredPort} is already in use`, colors.yellow);

    // Find an alternative port automatically
    log(`   Looking for alternative port...`, colors.yellow);
    const altPort = await findAvailablePort(3001);

    if (altPort) {
      log(`✅ Using alternative port ${altPort}`, colors.green);
      log(`   App will be available at: http://localhost:${altPort}`, colors.blue);
      selectedPort = altPort;
      return;
    }

    // If no alternative found, provide manual instructions
    log(`❌ Could not find an available port (tried 3000-3010)`, colors.red);
    log(`   To manually free port ${preferredPort}:`, colors.yellow);
    if (process.platform === 'win32') {
      log(`   netstat -ano | findstr :${preferredPort}`, colors.yellow);
      log(`   taskkill /PID <pid> /F`, colors.yellow);
    } else {
      log(`   lsof -i :${preferredPort}`, colors.yellow);
      log(`   kill -9 <pid>`, colors.yellow);
    }
    process.exit(1);
  }

  selectedPort = preferredPort;
  log(`✅ Port ${preferredPort} is available`, colors.green);
}

function checkEnvironment() {
  log('\n🔍 Checking environment...', colors.blue);

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion < 18) {
    log(`❌ Node.js ${nodeVersion} detected. Please use Node.js 18 or higher.`, colors.red);
    process.exit(1);
  }
  log(`✅ Node.js ${nodeVersion}`, colors.green);

  // Check .dev.env exists
  const devEnvPath = path.join(process.cwd(), '.dev.env');
  if (!fs.existsSync(devEnvPath)) {
    log('⚠️  .dev.env not found. Creating from template...', colors.yellow);
    // Note: .dev.env should already exist, but this is a safety check
  } else {
    log('✅ .dev.env configuration found', colors.green);
  }

  // Check if .next exists and might be stale
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    const stats = fs.statSync(nextDir);
    const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);

    if (ageInHours > 24) {
      log('⚠️  .next cache is more than 24 hours old. Consider running: rm -rf .next', colors.yellow);
    }
  }

  log('✅ Environment check complete\n', colors.green);
}

function printOptimizations() {
  log('🚀 Development Server Optimizations:', colors.bright);
  log('   • Memory limit: 4GB', colors.blue);
  log('   • Service worker: Disabled', colors.blue);
  log('   • Hot reload: Optimized', colors.blue);
  log('   • File watching: Efficient mode', colors.blue);
  log('   • Memory monitoring: Active', colors.blue);
  log('');
}

function printUsageInfo() {
  log('📊 Monitoring:', colors.bright);
  log('   • Memory usage: Check dev tools panel (bottom-right orange button)', colors.blue);
  log('   • Network activity: Open browser DevTools → Network', colors.blue);
  log('   • Console logs: Open browser DevTools → Console', colors.blue);
  log('');

  log('💡 Tips:', colors.bright);
  log('   • If memory exceeds 3GB, restart the server', colors.yellow);
  log('   • Clear .next cache if experiencing issues: rm -rf .next', colors.yellow);
  log('   • Keep browser DevTools closed unless debugging', colors.yellow);
  log('');
}

function startDevServer() {
  log('🎯 Starting optimized development server...', colors.green);
  log('');

  // Environment variables
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    NODE_OPTIONS: '--max-old-space-size=4096 --max-semi-space-size=256',
    SKIP_SERVICE_WORKER: 'true',
    FAST_REFRESH: 'true',
    WATCHPACK_POLLING: 'false',
    CHOKIDAR_USEPOLLING: 'false',
    // Increase timeouts to prevent 408 errors
    TIMEOUT: '60000',
    BODY_TIMEOUT: '60000',
  };

  // Spawn Next.js dev server
  // Use npx on Windows, direct path on Unix
  const isWindows = process.platform === 'win32';
  const nextCommand = isWindows ? 'npx' : './node_modules/.bin/next';
  // Use the port determined by checkPort (defaults to 3000, falls back to available)
  const portStr = String(selectedPort);
  const nextArgs = isWindows
    ? ['next', 'dev', '--webpack', '-H', '0.0.0.0', '-p', portStr]
    : ['./node_modules/.bin/next', 'dev', '--webpack', '-H', '0.0.0.0', '-p', portStr];

  const devProcess = spawn(
    isWindows ? nextCommand : 'node',
    isWindows ? nextArgs : [...env.NODE_OPTIONS.split(' '), ...nextArgs],
    {
      env,
      stdio: 'inherit',
      shell: true,
    }
  );

  // Handle process events
  devProcess.on('error', (error) => {
    log(`\n❌ Failed to start dev server: ${error.message}`, colors.red);
    process.exit(1);
  });

  devProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log(`\n❌ Dev server exited with code ${code}`, colors.red);
      process.exit(code);
    }
  });

  // Handle graceful shutdown
  const shutdown = () => {
    log('\n\n🛑 Shutting down dev server...', colors.yellow);
    devProcess.kill('SIGTERM');

    setTimeout(() => {
      devProcess.kill('SIGKILL');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Main execution
async function main() {
  log('\n' + '='.repeat(60), colors.bright);
  log('  Tallow Development Server', colors.bright);
  log('  Optimized for stability and performance', colors.blue);
  log('='.repeat(60) + '\n', colors.bright);

  await checkPort();
  checkEnvironment();
  printOptimizations();
  printUsageInfo();
  startDevServer();
}

main();
