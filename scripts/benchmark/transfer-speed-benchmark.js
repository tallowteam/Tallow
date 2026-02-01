#!/usr/bin/env node

/**
 * Transfer Speed Benchmark
 * Benchmarks file transfer speeds under various conditions
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  outputDir: path.join(__dirname, '../../reports/transfer-benchmarks'),
  testSizes: [
    1024, // 1KB
    10 * 1024, // 10KB
    100 * 1024, // 100KB
    1024 * 1024, // 1MB
    10 * 1024 * 1024, // 10MB
    100 * 1024 * 1024, // 100MB
  ],
  iterations: 3,
  targets: {
    // Target speeds in bytes per second
    small: 1024 * 1024, // 1MB/s for small files
    medium: 10 * 1024 * 1024, // 10MB/s for medium files
    large: 50 * 1024 * 1024, // 50MB/s for large files
  },
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
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond) {
  const mbps = (bytesPerSecond * 8) / (1024 * 1024);
  return mbps.toFixed(2) + ' Mbps';
}

function formatDuration(ms) {
  if (ms < 1000) return ms.toFixed(0) + ' ms';
  return (ms / 1000).toFixed(2) + ' s';
}

function generateTestData(size) {
  return crypto.randomBytes(size);
}

// =============================================================================
// ENCRYPTION BENCHMARKS
// =============================================================================

async function benchmarkEncryption(data) {
  const startTime = process.hrtime.bigint();

  // Simulate ChaCha20-Poly1305 encryption
  const cipher = crypto.createCipheriv(
    'chacha20-poly1305',
    crypto.randomBytes(32),
    crypto.randomBytes(12),
    { authTagLength: 16 }
  );

  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  const endTime = process.hrtime.bigint();
  const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds

  return {
    size: data.length,
    duration,
    throughput: (data.length / (duration / 1000)), // bytes per second
  };
}

// =============================================================================
// CHUNKING BENCHMARKS
// =============================================================================

function benchmarkChunking(data, chunkSize = 64 * 1024) {
  const startTime = process.hrtime.bigint();

  const chunks = [];
  let offset = 0;

  while (offset < data.length) {
    const end = Math.min(offset + chunkSize, data.length);
    chunks.push(data.slice(offset, end));
    offset = end;
  }

  const endTime = process.hrtime.bigint();
  const duration = Number(endTime - startTime) / 1e6;

  return {
    size: data.length,
    chunks: chunks.length,
    chunkSize,
    duration,
    throughput: (data.length / (duration / 1000)),
  };
}

// =============================================================================
// COMPRESSION BENCHMARKS
// =============================================================================

async function benchmarkCompression(data) {
  const { gzipSync } = require('zlib');

  const startTime = process.hrtime.bigint();
  const compressed = gzipSync(data, { level: 6 });
  const endTime = process.hrtime.bigint();

  const duration = Number(endTime - startTime) / 1e6;

  return {
    originalSize: data.length,
    compressedSize: compressed.length,
    ratio: (compressed.length / data.length * 100).toFixed(2) + '%',
    duration,
    throughput: (data.length / (duration / 1000)),
  };
}

// =============================================================================
// HASH BENCHMARKS
// =============================================================================

function benchmarkHashing(data) {
  const startTime = process.hrtime.bigint();
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  const endTime = process.hrtime.bigint();

  const duration = Number(endTime - startTime) / 1e6;

  return {
    size: data.length,
    hash: hash.substring(0, 16) + '...',
    duration,
    throughput: (data.length / (duration / 1000)),
  };
}

// =============================================================================
// BENCHMARK RUNNER
// =============================================================================

async function runBenchmarks() {
  console.log('🚀 Starting transfer speed benchmarks\n');

  const results = {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    },
    benchmarks: [],
  };

  for (const size of CONFIG.testSizes) {
    console.log(`\n📊 Benchmarking ${formatBytes(size)}...`);

    const testData = generateTestData(size);

    const sizeResults = {
      size,
      encryption: [],
      chunking: [],
      compression: [],
      hashing: [],
    };

    // Run multiple iterations
    for (let i = 0; i < CONFIG.iterations; i++) {
      console.log(`  Iteration ${i + 1}/${CONFIG.iterations}`);

      // Encryption
      const encResult = await benchmarkEncryption(testData);
      sizeResults.encryption.push(encResult);

      // Chunking
      const chunkResult = benchmarkChunking(testData);
      sizeResults.chunking.push(chunkResult);

      // Compression (only for files < 10MB)
      if (size <= 10 * 1024 * 1024) {
        const compResult = await benchmarkCompression(testData);
        sizeResults.compression.push(compResult);
      }

      // Hashing
      const hashResult = benchmarkHashing(testData);
      sizeResults.hashing.push(hashResult);
    }

    // Calculate averages
    sizeResults.averages = {
      encryption: average(sizeResults.encryption, 'throughput'),
      chunking: average(sizeResults.chunking, 'throughput'),
      compression: sizeResults.compression.length > 0 ? average(sizeResults.compression, 'throughput') : 0,
      hashing: average(sizeResults.hashing, 'throughput'),
    };

    results.benchmarks.push(sizeResults);

    // Display results
    console.log(`  Encryption: ${formatSpeed(sizeResults.averages.encryption)}`);
    console.log(`  Chunking: ${formatSpeed(sizeResults.averages.chunking)}`);
    if (sizeResults.averages.compression > 0) {
      console.log(`  Compression: ${formatSpeed(sizeResults.averages.compression)}`);
    }
    console.log(`  Hashing: ${formatSpeed(sizeResults.averages.hashing)}`);
  }

  return results;
}

function average(arr, key) {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((acc, item) => acc + item[key], 0);
  return sum / arr.length;
}

// =============================================================================
// REPORT GENERATOR
// =============================================================================

function generateReport(results) {
  let report = `
# Transfer Speed Benchmark Report
Generated: ${results.timestamp}

## System Information
- Platform: ${results.system.platform}
- Architecture: ${results.system.arch}
- Node Version: ${results.system.nodeVersion}

## Benchmark Results

### Encryption Performance (ChaCha20-Poly1305)

| File Size | Average Speed | Target | Status |
|-----------|---------------|--------|--------|
`;

  results.benchmarks.forEach((b) => {
    const target = getTarget(b.size);
    const status = b.averages.encryption >= target ? '✅ Pass' : '❌ Fail';
    report += `| ${formatBytes(b.size)} | ${formatSpeed(b.averages.encryption)} | ${formatSpeed(target)} | ${status} |\n`;
  });

  report += `\n### Chunking Performance\n\n`;
  report += `| File Size | Average Speed | Chunks |\n`;
  report += `|-----------|---------------|--------|\n`;

  results.benchmarks.forEach((b) => {
    const chunks = b.chunking[0]?.chunks || 0;
    report += `| ${formatBytes(b.size)} | ${formatSpeed(b.averages.chunking)} | ${chunks} |\n`;
  });

  report += `\n### Compression Performance (Gzip Level 6)\n\n`;
  report += `| File Size | Average Speed | Compression Ratio |\n`;
  report += `|-----------|---------------|-------------------|\n`;

  results.benchmarks.forEach((b) => {
    if (b.compression.length > 0) {
      const ratio = b.compression[0].ratio;
      report += `| ${formatBytes(b.size)} | ${formatSpeed(b.averages.compression)} | ${ratio} |\n`;
    }
  });

  report += `\n### Hashing Performance (SHA-256)\n\n`;
  report += `| File Size | Average Speed |\n`;
  report += `|-----------|---------------|\n`;

  results.benchmarks.forEach((b) => {
    report += `| ${formatBytes(b.size)} | ${formatSpeed(b.averages.hashing)} |\n`;
  });

  // Performance summary
  const failures = results.benchmarks.filter(b => b.averages.encryption < getTarget(b.size));
  if (failures.length > 0) {
    report += `\n## ⚠️ Performance Issues\n\n`;
    report += `The following file sizes did not meet performance targets:\n\n`;
    failures.forEach((b) => {
      report += `- ${formatBytes(b.size)}: ${formatSpeed(b.averages.encryption)} (target: ${formatSpeed(getTarget(b.size))})\n`;
    });
  } else {
    report += `\n## ✅ All Performance Targets Met!\n`;
  }

  return report;
}

function getTarget(size) {
  if (size < 100 * 1024) return CONFIG.targets.small;
  if (size < 10 * 1024 * 1024) return CONFIG.targets.medium;
  return CONFIG.targets.large;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  // Ensure output directory
  ensureDir(CONFIG.outputDir);

  // Run benchmarks
  const results = await runBenchmarks();

  // Save raw results
  const jsonPath = path.join(CONFIG.outputDir, `benchmark-${Date.now()}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Raw results saved to: ${jsonPath}`);

  // Generate and save report
  const report = generateReport(results);
  const reportPath = path.join(CONFIG.outputDir, `benchmark-report-${Date.now()}.md`);
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Report saved to: ${reportPath}\n`);

  // Check for failures
  const failures = results.benchmarks.filter(b => b.averages.encryption < getTarget(b.size));
  if (failures.length > 0) {
    console.error('❌ Some benchmarks did not meet performance targets');
    process.exit(1);
  } else {
    console.log('✅ All benchmarks passed!');
  }
}

main().catch((error) => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});
