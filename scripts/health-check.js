#!/usr/bin/env node

/**
 * Development Server Health Check
 * Verifies dev server is running optimally
 */

const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function checkMetrics() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/api/metrics', (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          // Parse Prometheus metrics format
          const lines = data.split('\n');
          const metrics = {};

          for (const line of lines) {
            if (line.startsWith('#') || !line.trim()) continue;

            const [key, value] = line.split(' ');
            if (key && value) {
              metrics[key] = parseFloat(value);
            }
          }

          resolve(metrics);
        } catch (error) {
          resolve(null);
        }
      });
    });

    req.on('error', () => {
      resolve(null);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function main() {
  log('\n🏥 Development Server Health Check\n', colors.blue);

  // Check if server is running
  log('Checking server status...', colors.blue);
  const isRunning = await checkServerRunning();

  if (!isRunning) {
    log('❌ Server is not running on http://localhost:3000', colors.red);
    log('\nStart the server with: npm run dev\n', colors.yellow);
    process.exit(1);
  }

  log('✅ Server is running\n', colors.green);

  // Check metrics
  log('Fetching metrics...', colors.blue);
  const metrics = await checkMetrics();

  if (!metrics) {
    log('⚠️  Could not fetch metrics', colors.yellow);
    log('✅ Server is healthy but metrics endpoint not available\n', colors.green);
    process.exit(0);
  }

  log('✅ Metrics available\n', colors.green);

  // Display health information
  log('📊 Health Report:', colors.blue);
  log('─'.repeat(50));

  // Process memory
  if (metrics['process_resident_memory_bytes']) {
    const memoryMB = metrics['process_resident_memory_bytes'] / (1024 * 1024);
    const memoryGB = memoryMB / 1024;

    let memoryStatus = colors.green;
    let memoryMessage = 'Good';

    if (memoryGB > 3) {
      memoryStatus = colors.red;
      memoryMessage = 'High - consider restarting';
    } else if (memoryGB > 2) {
      memoryStatus = colors.yellow;
      memoryMessage = 'Elevated - monitor closely';
    }

    log(`\nMemory Usage: ${memoryStatus}${formatBytes(metrics['process_resident_memory_bytes'])}${colors.reset}`);
    log(`Status: ${memoryStatus}${memoryMessage}${colors.reset}`);
  }

  // Heap memory
  if (metrics['nodejs_heap_size_used_bytes'] && metrics['nodejs_heap_size_total_bytes']) {
    const heapUsed = metrics['nodejs_heap_size_used_bytes'];
    const heapTotal = metrics['nodejs_heap_size_total_bytes'];
    const heapPercent = (heapUsed / heapTotal) * 100;

    let heapStatus = colors.green;
    let heapMessage = 'Good';

    if (heapPercent > 90) {
      heapStatus = colors.red;
      heapMessage = 'Critical - restart required';
    } else if (heapPercent > 70) {
      heapStatus = colors.yellow;
      heapMessage = 'Warning - may need restart';
    }

    log(`\nHeap Usage: ${heapStatus}${formatBytes(heapUsed)} / ${formatBytes(heapTotal)} (${heapPercent.toFixed(1)}%)${colors.reset}`);
    log(`Status: ${heapStatus}${heapMessage}${colors.reset}`);
  }

  // Event loop lag
  if (metrics['nodejs_eventloop_lag_seconds']) {
    const lagMs = metrics['nodejs_eventloop_lag_seconds'] * 1000;

    let lagStatus = colors.green;
    let lagMessage = 'Good';

    if (lagMs > 100) {
      lagStatus = colors.red;
      lagMessage = 'High - server may be overloaded';
    } else if (lagMs > 50) {
      lagStatus = colors.yellow;
      lagMessage = 'Elevated - monitor performance';
    }

    log(`\nEvent Loop Lag: ${lagStatus}${lagMs.toFixed(2)}ms${colors.reset}`);
    log(`Status: ${lagStatus}${lagMessage}${colors.reset}`);
  }

  // Active requests
  if (metrics['http_requests_total']) {
    log(`\nTotal Requests: ${metrics['http_requests_total']}`);
  }

  log('\n' + '─'.repeat(50));

  // Overall health assessment
  const memoryGB = metrics['process_resident_memory_bytes'] / (1024 * 1024 * 1024);
  const heapPercent = (metrics['nodejs_heap_size_used_bytes'] / metrics['nodejs_heap_size_total_bytes']) * 100;
  const lagMs = (metrics['nodejs_eventloop_lag_seconds'] || 0) * 1000;

  if (memoryGB > 3 || heapPercent > 90 || lagMs > 100) {
    log('\n⚠️  Overall Health: CRITICAL', colors.red);
    log('Recommendation: Restart the development server', colors.yellow);
  } else if (memoryGB > 2 || heapPercent > 70 || lagMs > 50) {
    log('\n⚠️  Overall Health: WARNING', colors.yellow);
    log('Recommendation: Monitor closely, restart if issues persist', colors.yellow);
  } else {
    log('\n✅ Overall Health: GOOD', colors.green);
    log('Server is operating normally', colors.green);
  }

  log('\n💡 Tips:', colors.blue);
  log('   • View memory in dev tools panel (orange button)', colors.reset);
  log('   • Run this check periodically during development', colors.reset);
  log('   • Restart server if memory exceeds 3GB', colors.reset);
  log('   • Clear cache if experiencing issues: rm -rf .next\n', colors.reset);
}

main().catch((error) => {
  log(`\n❌ Health check failed: ${error.message}`, colors.red);
  process.exit(1);
});
