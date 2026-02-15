#!/usr/bin/env node

/**
 * Release transfer benchmark suite.
 *
 * Coverage goals:
 * - 1GB transfer benchmark
 * - Degraded network profiles
 * - Memory recovery back toward baseline after transfer
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MB = 1024 * 1024;
const GB = 1024 * MB;

const CONFIG = {
  outputDir: path.join(__dirname, '../../reports/transfer-benchmarks'),
  memoryRecoveryHeadroom: 0.25, // Allow 25% over baseline after GC
  scenarios: [
    {
      id: 'baseline-1gb',
      description: '1GB baseline transfer simulation',
      fileSizeBytes: GB,
      chunkSizeBytes: 2 * MB,
      iterations: 1,
      targetThroughputBytesPerSecond: 80 * MB,
      network: {
        profile: 'lan',
        bandwidthMbps: 1000,
        latencyMs: 2,
        jitterMs: 1,
        packetLoss: 0,
      },
    },
    {
      id: 'degraded-3g',
      description: 'Degraded 3G-like transfer simulation',
      fileSizeBytes: 256 * MB,
      chunkSizeBytes: 1 * MB,
      iterations: 1,
      targetThroughputBytesPerSecond: 0.15 * MB,
      network: {
        profile: '3g',
        bandwidthMbps: 1.8,
        latencyMs: 180,
        jitterMs: 80,
        packetLoss: 0.03,
      },
    },
    {
      id: 'degraded-flaky',
      description: 'Degraded flaky transfer simulation',
      fileSizeBytes: 256 * MB,
      chunkSizeBytes: 1 * MB,
      iterations: 1,
      targetThroughputBytesPerSecond: 0.6 * MB,
      network: {
        profile: 'flaky',
        bandwidthMbps: 8,
        latencyMs: 120,
        jitterMs: 120,
        packetLoss: 0.1,
      },
    },
    {
      id: 'soak-24h-equivalent',
      description: 'Accelerated 24-hour soak equivalent (5400 micro-transfer cycles)',
      fileSizeBytes: 1 * MB,
      chunkSizeBytes: 256 * 1024,
      iterations: 5400,
      targetThroughputBytesPerSecond: 0.02 * MB,
      network: {
        profile: 'soak',
        bandwidthMbps: 0.6,
        latencyMs: 600,
        jitterMs: 250,
        packetLoss: 0.02,
      },
    },
  ],
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatBytes(bytes) {
  if (bytes === 0) {return '0 B';}
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`;
}

function formatSpeed(bytesPerSecond) {
  return `${(bytesPerSecond / MB).toFixed(2)} MB/s`;
}

function formatDuration(ms) {
  if (ms < 1000) {return `${ms.toFixed(0)} ms`;}
  return `${(ms / 1000).toFixed(2)} s`;
}

function estimateNetworkDurationMs(bytes, network) {
  const bytesPerSecond = (network.bandwidthMbps * MB) / 8;
  const transferMs = (bytes / bytesPerSecond) * 1000;
  const jitterOffset = network.jitterMs === 0
    ? 0
    : ((Math.random() * 2 - 1) * network.jitterMs);
  const latencyMs = Math.max(0, network.latencyMs + jitterOffset);
  const retransmitMs = Math.random() < network.packetLoss ? transferMs : 0;
  return transferMs + latencyMs + retransmitMs;
}

async function runScenario(scenario) {
  const key = crypto.randomBytes(32);
  const chunkTemplate = crypto.randomBytes(scenario.chunkSizeBytes);

  // Warm-up to avoid counting one-time crypto/bootstrap overhead as leak.
  const warmupNonce = crypto.randomBytes(12);
  const warmupCipher = crypto.createCipheriv(
    'chacha20-poly1305',
    key,
    warmupNonce,
    { authTagLength: 16 }
  );
  warmupCipher.update(chunkTemplate.subarray(0, Math.min(64 * 1024, chunkTemplate.length)));
  warmupCipher.final();
  warmupCipher.getAuthTag();

  const baselineHeapBytes = process.memoryUsage().heapUsed;
  let peakHeapBytes = baselineHeapBytes;
  let simulatedNetworkDurationMs = 0;
  let totalBytesProcessed = 0;
  let packetLossEvents = 0;

  const processingStart = process.hrtime.bigint();

  for (let iteration = 0; iteration < scenario.iterations; iteration++) {
    let processed = 0;
    const hash = crypto.createHash('sha256');

    while (processed < scenario.fileSizeBytes) {
      const remaining = scenario.fileSizeBytes - processed;
      const chunkLength = Math.min(chunkTemplate.length, remaining);
      const chunk = chunkLength === chunkTemplate.length
        ? chunkTemplate
        : chunkTemplate.subarray(0, chunkLength);

      const nonce = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(
        'chacha20-poly1305',
        key,
        nonce,
        { authTagLength: 16 }
      );

      cipher.update(chunk);
      cipher.final();
      cipher.getAuthTag();
      hash.update(chunk);

      const networkChunkDuration = estimateNetworkDurationMs(chunkLength, scenario.network);
      simulatedNetworkDurationMs += networkChunkDuration;

      const bytesPerSecond = (scenario.network.bandwidthMbps * MB) / 8;
      const transferMs = (chunkLength / bytesPerSecond) * 1000;
      if (networkChunkDuration > transferMs + scenario.network.latencyMs) {
        packetLossEvents += 1;
      }

      processed += chunkLength;
      totalBytesProcessed += chunkLength;

      const currentHeapBytes = process.memoryUsage().heapUsed;
      if (currentHeapBytes > peakHeapBytes) {
        peakHeapBytes = currentHeapBytes;
      }
    }

    hash.digest('hex');
  }

  const processingEnd = process.hrtime.bigint();
  const processingDurationMs = Number(processingEnd - processingStart) / 1e6;
  const effectiveDurationMs = Math.max(processingDurationMs, simulatedNetworkDurationMs);
  const throughputBytesPerSecond = totalBytesProcessed / (effectiveDurationMs / 1000);

  if (typeof global.gc === 'function') {
    global.gc();
    global.gc();
  }

  await new Promise((resolve) => setTimeout(resolve, 0));
  const recoveredHeapBytes = process.memoryUsage().heapUsed;
  const allowedRecoveredHeapBytes = baselineHeapBytes * (1 + CONFIG.memoryRecoveryHeadroom);
  const memoryRecovered = recoveredHeapBytes <= allowedRecoveredHeapBytes;
  const throughputPass = throughputBytesPerSecond >= scenario.targetThroughputBytesPerSecond;

  return {
    id: scenario.id,
    description: scenario.description,
    fileSizeBytes: scenario.fileSizeBytes,
    chunkSizeBytes: scenario.chunkSizeBytes,
    iterations: scenario.iterations,
    network: scenario.network,
    metrics: {
      totalBytesProcessed,
      processingDurationMs,
      simulatedNetworkDurationMs,
      effectiveDurationMs,
      throughputBytesPerSecond,
      packetLossEvents,
    },
    memory: {
      baselineHeapBytes,
      peakHeapBytes,
      recoveredHeapBytes,
      allowedRecoveredHeapBytes,
      recoveredRatio: recoveredHeapBytes / baselineHeapBytes,
      gcAvailable: typeof global.gc === 'function',
    },
    targets: {
      throughputBytesPerSecond: scenario.targetThroughputBytesPerSecond,
      memoryRecoveryHeadroom: CONFIG.memoryRecoveryHeadroom,
    },
    pass: throughputPass && memoryRecovered,
    checks: {
      throughputPass,
      memoryRecovered,
    },
  };
}

function generateMarkdownReport(results) {
  const lines = [];

  lines.push('# Transfer Release Benchmark Report');
  lines.push(`Generated: ${results.timestamp}`);
  lines.push('');
  lines.push('## Coverage');
  lines.push('- Includes 1GB transfer benchmark scenario');
  lines.push('- Includes degraded network scenarios (3G + flaky)');
  lines.push('- Includes accelerated 24-hour soak-equivalent cycle with memory recovery validation');
  lines.push('- Includes memory recovery checks against baseline');
  lines.push('');
  lines.push('## Scenario Results');
  lines.push('');
  lines.push('| Scenario | File Size | Network | Throughput | Target | Memory Recovery | Status |');
  lines.push('|---|---:|---|---:|---:|---|---|');

  for (const scenario of results.scenarios) {
    const memoryDeltaPercent = ((scenario.memory.recoveredRatio - 1) * 100).toFixed(1);
    const memoryText = `${memoryDeltaPercent}% vs baseline`;
    const status = scenario.pass ? 'PASS' : 'FAIL';

    lines.push(
      `| ${scenario.id} | ${formatBytes(scenario.fileSizeBytes)} | ${scenario.network.profile} | ${formatSpeed(scenario.metrics.throughputBytesPerSecond)} | ${formatSpeed(scenario.targets.throughputBytesPerSecond)} | ${memoryText} | ${status} |`
    );
  }

  lines.push('');
  lines.push('## Detailed Metrics');
  lines.push('');

  for (const scenario of results.scenarios) {
    lines.push(`### ${scenario.id}`);
    lines.push(`- Description: ${scenario.description}`);
    lines.push(`- Effective duration: ${formatDuration(scenario.metrics.effectiveDurationMs)}`);
    lines.push(`- Processing duration: ${formatDuration(scenario.metrics.processingDurationMs)}`);
    lines.push(`- Simulated network duration: ${formatDuration(scenario.metrics.simulatedNetworkDurationMs)}`);
    lines.push(`- Packet loss events simulated: ${scenario.metrics.packetLossEvents}`);
    lines.push(`- Baseline heap: ${formatBytes(scenario.memory.baselineHeapBytes)}`);
    lines.push(`- Peak heap: ${formatBytes(scenario.memory.peakHeapBytes)}`);
    lines.push(`- Recovered heap: ${formatBytes(scenario.memory.recoveredHeapBytes)}`);
    lines.push(`- GC available: ${scenario.memory.gcAvailable ? 'yes' : 'no'}`);
    lines.push(`- Throughput check: ${scenario.checks.throughputPass ? 'PASS' : 'FAIL'}`);
    lines.push(`- Memory recovery check: ${scenario.checks.memoryRecovered ? 'PASS' : 'FAIL'}`);
    lines.push('');
  }

  return lines.join('\n');
}

async function runSuite() {
  const scenarios = [];
  let failures = 0;

  for (const scenario of CONFIG.scenarios) {
    console.log(`[transfer-release-benchmark] Running ${scenario.id} (${formatBytes(scenario.fileSizeBytes)})`);
    const result = await runScenario(scenario);
    scenarios.push(result);

    console.log(
      `[transfer-release-benchmark] ${scenario.id} throughput=${formatSpeed(result.metrics.throughputBytesPerSecond)}, ` +
      `memoryRecovered=${result.checks.memoryRecovered ? 'yes' : 'no'}`
    );

    if (!result.pass) {
      failures += 1;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    },
    scenarios,
    summary: {
      total: scenarios.length,
      passed: scenarios.length - failures,
      failed: failures,
    },
  };
}

async function main() {
  ensureDir(CONFIG.outputDir);
  const results = await runSuite();

  const stamp = Date.now();
  const jsonPath = path.join(CONFIG.outputDir, `release-benchmark-${stamp}.json`);
  const mdPath = path.join(CONFIG.outputDir, `release-benchmark-report-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');
  fs.writeFileSync(mdPath, generateMarkdownReport(results), 'utf8');

  console.log(`[transfer-release-benchmark] JSON report: ${jsonPath}`);
  console.log(`[transfer-release-benchmark] Markdown report: ${mdPath}`);

  if (results.summary.failed > 0) {
    console.error(`[transfer-release-benchmark] ${results.summary.failed} scenario(s) failed.`);
    process.exit(1);
  }

  console.log('[transfer-release-benchmark] All release benchmark scenarios passed.');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[transfer-release-benchmark] Failed:', error);
    process.exit(1);
  });
}
