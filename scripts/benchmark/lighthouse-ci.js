#!/usr/bin/env node

/**
 * Lighthouse CI Benchmark Runner
 * Runs Lighthouse audits and tracks performance over time
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  port: Number(process.env.LIGHTHOUSE_PORT || 4173),
  routes: ['/', '/transfer', '/features', '/how-it-works'],
  numberOfRuns: 3,
  budgets: {
    performance: 90,
    accessibility: 95,
    bestPractices: 95,
    seo: 90,
    lcp: 2500, // ms
    fcp: 1000, // ms
    cls: 0.1,
    tbt: 200, // ms
    speedIndex: 3000, // ms
    tti: 2000, // ms
    totalByteWeight: 1600000, // 1.6MB
  },
  outputDir: path.join(__dirname, '../../reports/lighthouse'),
};

// =============================================================================
// UTILITIES
// =============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

function formatMs(ms) {
  return ms.toFixed(0) + ' ms';
}

function formatScore(score) {
  return (score * 100).toFixed(0);
}

function getBaseUrl() {
  return `http://localhost:${CONFIG.port}`;
}

function buildUrls() {
  const baseUrl = getBaseUrl();
  return CONFIG.routes.map((route) => `${baseUrl}${route}`);
}

function getNpmCliPath() {
  try {
    return require.resolve('npm/bin/npm-cli.js');
  } catch {
    const candidates = [
      path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
      process.env.APPDATA
        ? path.join(process.env.APPDATA, 'npm', 'node_modules', 'npm', 'bin', 'npm-cli.js')
        : null,
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }
}

function getNpmInvocationArgs(args) {
  const npmCliPath = getNpmCliPath();
  if (!npmCliPath) {
    throw new Error('Unable to resolve npm CLI path (npm/bin/npm-cli.js).');
  }

  return [npmCliPath, ...args];
}

function runCommand(command, args, label, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      windowsHide: true,
      env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} failed with code ${code}`));
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function waitForServerReady(timeoutMs = 120000) {
  const baseUrl = getBaseUrl();
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { method: 'GET' });
      if (response.status < 500) {
        return;
      }
    } catch {
      // keep polling until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for server readiness at ${baseUrl}`);
}

async function warmupRoutes(urls) {
  for (const url of urls) {
    try {
      await fetch(url, { method: 'GET' });
    } catch {
      // Warmup is best-effort; continue so Lighthouse can capture the real failure.
    }
  }
}

function startProductionServer() {
  return spawn(process.execPath, getNpmInvocationArgs(['run', 'start']), {
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
    env: {
      ...process.env,
      PORT: String(CONFIG.port),
    },
  });
}

function stopServer(serverProcess) {
  return new Promise((resolve) => {
    if (!serverProcess || serverProcess.killed) {
      resolve();
      return;
    }

    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/pid', String(serverProcess.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });

      killer.on('close', () => resolve());
      killer.on('error', () => resolve());
      return;
    }

    let done = false;
    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      resolve();
    };

    serverProcess.once('exit', finish);
    serverProcess.kill('SIGTERM');
    setTimeout(finish, 5000);
  });
}

function resolveChromePath() {
  try {
    const { chromium } = require('@playwright/test');
    const executablePath = chromium.executablePath();
    return executablePath && executablePath.length > 0 ? executablePath : null;
  } catch {
    return null;
  }
}

// =============================================================================
// LIGHTHOUSE RUNNER
// =============================================================================

async function runLighthouse(url, outputPath) {
  console.log(`\nðŸ“Š Running Lighthouse for: ${url}`);

  return new Promise((resolve) => {
    let lighthouseCliPath;
    try {
      lighthouseCliPath = require.resolve('lighthouse/cli/index.js');
    } catch {
      console.error('Could not resolve local Lighthouse CLI. Ensure "lighthouse" is installed.');
      resolve(false);
      return;
    }

    const args = [
      lighthouseCliPath,
      url,
      '--output=json',
      `--output-path=${outputPath}`,
      '--chrome-flags=--headless --no-sandbox --disable-gpu',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--preset=desktop',
      '--quiet',
    ];

    const chromePath = resolveChromePath();
    if (chromePath) {
      args.push(`--chrome-path=${chromePath}`);
    }

    const lighthouse = spawn(process.execPath, args, {
      stdio: 'inherit',
      shell: false,
      windowsHide: true,
    });

    lighthouse.on('close', (code) => {
      if (code === 0) {
        console.log(`âœ… Lighthouse audit complete: ${outputPath}`);
        resolve(true);
      } else {
        console.error(`âŒ Lighthouse audit failed with code ${code}`);
        resolve(false);
      }
    });

    lighthouse.on('error', (error) => {
      console.error(`âŒ Lighthouse audit failed:`, error.message);
      resolve(false);
    });
  });
}

// =============================================================================
// RESULTS PARSER
// =============================================================================

function parseResults(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  return {
    url: data.finalUrl,
    fetchTime: data.fetchTime,
    scores: {
      performance: data.categories.performance.score,
      accessibility: data.categories.accessibility.score,
      bestPractices: data.categories['best-practices'].score,
      seo: data.categories.seo.score,
    },
    metrics: {
      fcp: data.audits['first-contentful-paint'].numericValue,
      lcp: data.audits['largest-contentful-paint'].numericValue,
      cls: data.audits['cumulative-layout-shift'].numericValue,
      tbt: data.audits['total-blocking-time'].numericValue,
      speedIndex: data.audits['speed-index'].numericValue,
      tti: data.audits.interactive.numericValue,
    },
    resources: {
      totalByteWeight: data.audits['total-byte-weight'].numericValue,
      requests: data.audits['network-requests'].details?.items?.length || 0,
    },
  };
}

// =============================================================================
// BUDGET CHECKER
// =============================================================================

function checkBudgets(results) {
  const violations = [];

  // Check scores
  if (results.scores.performance < CONFIG.budgets.performance / 100) {
    violations.push({
      metric: 'Performance Score',
      actual: formatScore(results.scores.performance),
      budget: CONFIG.budgets.performance,
    });
  }

  if (results.scores.accessibility < CONFIG.budgets.accessibility / 100) {
    violations.push({
      metric: 'Accessibility Score',
      actual: formatScore(results.scores.accessibility),
      budget: CONFIG.budgets.accessibility,
    });
  }

  if (results.scores.bestPractices < CONFIG.budgets.bestPractices / 100) {
    violations.push({
      metric: 'Best Practices Score',
      actual: formatScore(results.scores.bestPractices),
      budget: CONFIG.budgets.bestPractices,
    });
  }

  if (results.scores.seo < CONFIG.budgets.seo / 100) {
    violations.push({
      metric: 'SEO Score',
      actual: formatScore(results.scores.seo),
      budget: CONFIG.budgets.seo,
    });
  }

  // Check metrics
  if (results.metrics.lcp > CONFIG.budgets.lcp) {
    violations.push({
      metric: 'LCP',
      actual: formatMs(results.metrics.lcp),
      budget: formatMs(CONFIG.budgets.lcp),
    });
  }

  if (results.metrics.fcp > CONFIG.budgets.fcp) {
    violations.push({
      metric: 'FCP',
      actual: formatMs(results.metrics.fcp),
      budget: formatMs(CONFIG.budgets.fcp),
    });
  }

  if (results.metrics.cls > CONFIG.budgets.cls) {
    violations.push({
      metric: 'CLS',
      actual: results.metrics.cls.toFixed(3),
      budget: CONFIG.budgets.cls,
    });
  }

  if (results.metrics.tbt > CONFIG.budgets.tbt) {
    violations.push({
      metric: 'TBT',
      actual: formatMs(results.metrics.tbt),
      budget: formatMs(CONFIG.budgets.tbt),
    });
  }

  if (results.resources.totalByteWeight > CONFIG.budgets.totalByteWeight) {
    violations.push({
      metric: 'Total Byte Weight',
      actual: formatBytes(results.resources.totalByteWeight),
      budget: formatBytes(CONFIG.budgets.totalByteWeight),
    });
  }

  return violations;
}

// =============================================================================
// REPORT GENERATOR
// =============================================================================

function generateReport(allResults) {
  const timestamp = new Date().toISOString();
  let report = `
# Lighthouse Performance Report
Generated: ${timestamp}
Target server: ${getBaseUrl()} (production build)

## Summary

| URL | Performance | Accessibility | Best Practices | SEO |
|-----|-------------|---------------|----------------|-----|
`;

  allResults.forEach((result) => {
    report += `| ${result.url} | ${formatScore(result.scores.performance)} | ${formatScore(result.scores.accessibility)} | ${formatScore(result.scores.bestPractices)} | ${formatScore(result.scores.seo)} |\n`;
  });

  report += `\n## Core Web Vitals\n\n`;
  report += `| URL | LCP | FCP | CLS | TBT | Speed Index | TTI |\n`;
  report += `|-----|-----|-----|-----|-----|-------------|-----|\n`;

  allResults.forEach((result) => {
    report += `| ${result.url} | ${formatMs(result.metrics.lcp)} | ${formatMs(result.metrics.fcp)} | ${result.metrics.cls.toFixed(3)} | ${formatMs(result.metrics.tbt)} | ${formatMs(result.metrics.speedIndex)} | ${formatMs(result.metrics.tti)} |\n`;
  });

  report += `\n## Resource Metrics\n\n`;
  report += `| URL | Total Size | Requests |\n`;
  report += `|-----|------------|----------|\n`;

  allResults.forEach((result) => {
    report += `| ${result.url} | ${formatBytes(result.resources.totalByteWeight)} | ${result.resources.requests} |\n`;
  });

  // Budget violations
  let hasViolations = false;
  allResults.forEach((result) => {
    const violations = checkBudgets(result);
    if (violations.length > 0) {
      hasViolations = true;
      report += `\n## Budget Violations for ${result.url}\n\n`;
      report += `| Metric | Actual | Budget |\n`;
      report += `|--------|--------|--------|\n`;
      violations.forEach((v) => {
        report += `| ${v.metric} | ${v.actual} | ${v.budget} |\n`;
      });
    }
  });

  if (!hasViolations) {
    report += `\n## All Performance Budgets Met\n`;
  }

  return report;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('Starting Lighthouse CI Benchmarks\n');

  ensureDir(CONFIG.outputDir);

  const targetUrls = buildUrls();
  const allResults = [];
  const useExistingServer = process.env.LIGHTHOUSE_USE_EXISTING_SERVER === '1';
  let serverProcess = null;
  let exitCode = 0;

  try {
    if (!useExistingServer) {
      console.log(`Building production bundle for ${getBaseUrl()} ...`);
      await runCommand(
        process.execPath,
        getNpmInvocationArgs(['run', 'build']),
        'Production build'
      );

      console.log(`Starting production server on ${getBaseUrl()} ...`);
      serverProcess = startProductionServer();
      await waitForServerReady();
      console.log('Production server ready\n');
    } else {
      console.log(`Using existing server at ${getBaseUrl()}\n`);
    }

    await warmupRoutes(targetUrls);

    for (const url of targetUrls) {
      const urlSlug = url.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const outputPath = path.join(
        CONFIG.outputDir,
        `lighthouse-${urlSlug}-${Date.now()}.json`
      );

      const success = await runLighthouse(url, outputPath);
      if (!success) {
        exitCode = 1;
        continue;
      }

      const results = parseResults(outputPath);
      allResults.push(results);

      console.log('\nResults:');
      console.log(`  Performance: ${formatScore(results.scores.performance)}`);
      console.log(`  Accessibility: ${formatScore(results.scores.accessibility)}`);
      console.log(`  Best Practices: ${formatScore(results.scores.bestPractices)}`);
      console.log(`  SEO: ${formatScore(results.scores.seo)}`);
      console.log(`  LCP: ${formatMs(results.metrics.lcp)}`);
      console.log(`  FCP: ${formatMs(results.metrics.fcp)}`);
      console.log(`  CLS: ${results.metrics.cls.toFixed(3)}`);
      console.log(`  Total Size: ${formatBytes(results.resources.totalByteWeight)}`);
    }

    const report = generateReport(allResults);
    const reportPath = path.join(
      CONFIG.outputDir,
      `lighthouse-report-${Date.now()}.md`
    );
    fs.writeFileSync(reportPath, report);
    console.log(`\nReport saved to: ${reportPath}\n`);

    allResults.forEach((result) => {
      const violations = checkBudgets(result);
      if (violations.length > 0) {
        console.error(`\nPerformance budget violations found for ${result.url}`);
        exitCode = 1;
      }
    });

    return exitCode;
  } finally {
    if (!useExistingServer) {
      await stopServer(serverProcess);
    }
  }
}

main()
  .then((code) => {
    process.exit(code ?? 0);
  })
  .catch((error) => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });

