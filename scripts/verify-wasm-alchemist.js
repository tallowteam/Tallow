#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'WASM_ALCHEMIST_POLICY.md');
const WASM_LOADER_PATH = path.join(ROOT, 'lib', 'wasm', 'wasm-loader.ts');
const WASM_PERFORMANCE_BRIDGE_PATH = path.join(ROOT, 'lib', 'wasm', 'performance-bridge.ts');
const WASM_INDEX_PATH = path.join(ROOT, 'lib', 'wasm', 'index.ts');
const COMPRESSION_BRIDGE_PATH = path.join(ROOT, 'lib', 'wasm', 'compression-bridge.ts');
const CHUNKING_BRIDGE_PATH = path.join(ROOT, 'lib', 'wasm', 'chunking-bridge.ts');
const CRYPTO_WORKER_PATH = path.join(ROOT, 'lib', 'workers', 'crypto.worker.ts');
const TRANSFER_BENCHMARKS_PATH = path.join(ROOT, 'reports', 'transfer-benchmarks');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:wasm:alchemist';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:wasm:alchemist';

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function resolveReportsDirectory() {
  const preferredDirectory = path.join(ROOT, 'reports');
  ensureDirectory(preferredDirectory);

  const probePath = path.join(preferredDirectory, '.write-probe');
  try {
    fs.writeFileSync(probePath, 'ok', 'utf8');
    fs.unlinkSync(probePath);
    return preferredDirectory;
  } catch {
    const fallbackDirectory = path.join(ROOT, 'verification-reports');
    ensureDirectory(fallbackDirectory);
    return fallbackDirectory;
  }
}

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
}

function readFile(filePath) {
  const buffer = fs.readFileSync(filePath);

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString('utf16le');
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.allocUnsafe(buffer.length - (buffer.length % 2));
    for (let i = 0; i < swapped.length; i += 2) {
      swapped[i] = buffer[i + 1];
      swapped[i + 1] = buffer[i];
    }
    return swapped.toString('utf16le');
  }

  return buffer.toString('utf8');
}

function checkRequiredFiles() {
  const requiredFiles = [
    POLICY_PATH,
    WASM_LOADER_PATH,
    WASM_PERFORMANCE_BRIDGE_PATH,
    WASM_INDEX_PATH,
    COMPRESSION_BRIDGE_PATH,
    CHUNKING_BRIDGE_PATH,
    CRYPTO_WORKER_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'WASM policy, bridges, worker, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required wasm alchemist files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkAsyncLoaderDiscipline(loaderContent) {
  const findings = [];

  if (!/export function isWasmSupported\(\): boolean/.test(loaderContent)) {
    findings.push('isWasmSupported capability detection is missing');
  }
  if (!/export async function loadWasmModule\(name: string\): Promise<WebAssembly\.Instance>/.test(loaderContent)) {
    findings.push('loadWasmModule async loader signature is missing');
  }
  if (!/const moduleCache = new Map<string,\s*Promise<WasmModule>>\(\)/.test(loaderContent)) {
    findings.push('WASM module cache map is missing');
  }
  if (!/await fetch\(modulePath\)/.test(loaderContent)) {
    findings.push('WASM loader does not fetch module bytes asynchronously');
  }
  if (!/await WebAssembly\.instantiate\(bytes,\s*\{/.test(loaderContent)) {
    findings.push('WASM module instantiation path is missing');
  }
  if (!/if \(!isWasmSupported\(\)\)\s*\{[\s\S]*?throw new Error\('WebAssembly is not supported/.test(loaderContent)) {
    findings.push('WASM unsupported fallback guard is missing');
  }

  return {
    name: 'WASM loader is async, capability-detected, and cached',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? ['async fetch+instantiate loader with cache and support checks verified']
        : findings,
  };
}

function checkHashAccelerationPath(loaderContent, performanceBridgeContent, wasmIndexContent) {
  const findings = [];

  if (!/async hash\(algorithm: 'sha256' \| 'blake3', data: Uint8Array\)/.test(performanceBridgeContent)) {
    findings.push('performance bridge hash router is missing');
  }
  if (!/return this\.wasmCrypto\.hash\(algorithm,\s*data\)/.test(performanceBridgeContent)) {
    findings.push('performance bridge does not route hash to wasm crypto path');
  }
  if (!/return this\.hashJS\(algorithm,\s*data\)/.test(performanceBridgeContent)) {
    findings.push('performance bridge hash JS fallback path is missing');
  }
  if (!/private async hashJS\(algorithm: 'sha256' \| 'blake3', data: Uint8Array\)/.test(performanceBridgeContent)) {
    findings.push('performance bridge hashJS fallback implementation is missing');
  }
  if (!/async hash\(algorithm: 'sha256' \| 'blake3', data: Uint8Array\): Promise<Uint8Array>/.test(loaderContent)) {
    findings.push('WasmCryptoImpl hash path is missing in wasm-loader');
  }
  if (!/return this\.hashJS\(algorithm,\s*data\)/.test(loaderContent)) {
    findings.push('wasm-loader hash fallback to JS is missing');
  }
  if (!/export async function hash\(algorithm: 'sha256' \| 'blake3', data: Uint8Array\): Promise<Uint8Array>/.test(wasmIndexContent)) {
    findings.push('high-level wasm index hash API is missing');
  }

  return {
    name: 'Hash acceleration path exposes WASM-first with JS fallback',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? ['hash routing exists across wasm-loader, performance bridge, and wasm index API']
        : findings,
  };
}

function checkCompressionAndChunkingBridges(compressionContent, chunkingContent, wasmIndexContent) {
  const findings = [];

  if (!/export async function compressWithWasm\(/.test(compressionContent)) {
    findings.push('compression bridge missing compressWithWasm');
  }
  if (!/export async function decompressWithWasm\(/.test(compressionContent)) {
    findings.push('compression bridge missing decompressWithWasm');
  }
  if (!/loadWasmModule\('compression'\)/.test(compressionContent)) {
    findings.push('compression bridge missing compression wasm module load');
  }
  if (!/return compressJS\(data,\s*algorithm\)/.test(compressionContent)) {
    findings.push('compression bridge missing JS compression fallback');
  }
  if (!/return decompressJS\(data,\s*algorithm\)/.test(compressionContent)) {
    findings.push('compression bridge missing JS decompression fallback');
  }

  if (!/export async function chunkBufferWithWasm\(/.test(chunkingContent)) {
    findings.push('chunking bridge missing chunkBufferWithWasm');
  }
  if (!/export function reassembleChunks\(/.test(chunkingContent)) {
    findings.push('chunking bridge missing reassembleChunks');
  }
  if (!/loadWasmModule\('chunking'\)/.test(chunkingContent)) {
    findings.push('chunking bridge missing chunking wasm module load');
  }
  if (!/return chunkJS\(data,\s*chunkSize\)/.test(chunkingContent)) {
    findings.push('chunking bridge missing JS fallback');
  }

  if (!/from '\.\/compression-bridge'/.test(wasmIndexContent)) {
    findings.push('wasm index is not exporting compression bridge');
  }
  if (!/from '\.\/chunking-bridge'/.test(wasmIndexContent)) {
    findings.push('wasm index is not exporting chunking bridge');
  }

  return {
    name: 'Compression and chunking bridges expose async WASM hooks with JS fallback',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['compression/chunking bridge exports and fallback paths verified'] : findings,
  };
}

function checkWorkerIsolation(workerContent) {
  const findings = [];

  if (!/(self|ctx)\.addEventListener\('message'|(self|ctx)\.onmessage\s*=/.test(workerContent)) {
    findings.push('crypto worker is missing message event listener');
  }
  for (const operation of ['encrypt', 'decrypt', 'hash', 'derive-key']) {
    if (!new RegExp(`['"]${operation}['"]`).test(workerContent)) {
      findings.push(`crypto worker missing operation handler token: ${operation}`);
    }
  }
  if (!/postMessage\(/.test(workerContent)) {
    findings.push('crypto worker does not post responses');
  }

  return {
    name: 'Crypto worker remains available for off-main-thread execution',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['worker message loop and core operation handlers verified'] : findings,
  };
}

function checkBenchmarkEvidence(packageJson) {
  const findings = [];
  const details = [];

  const scripts = packageJson.scripts || {};
  if (!scripts['bench:transfer:release']) {
    findings.push('missing package script: bench:transfer:release');
  } else {
    details.push(`bench:transfer:release: ${scripts['bench:transfer:release']}`);
  }

  if (!fs.existsSync(TRANSFER_BENCHMARKS_PATH)) {
    findings.push('missing reports/transfer-benchmarks directory');
  } else {
    const reports = fs
      .readdirSync(TRANSFER_BENCHMARKS_PATH)
      .filter((fileName) => fileName.startsWith('release-benchmark-report-') && fileName.endsWith('.md'))
      .sort();

    if (reports.length === 0) {
      findings.push('no release benchmark markdown report found in reports/transfer-benchmarks');
    } else {
      const latestReportName = reports[reports.length - 1];
      const latestReportPath = path.join(TRANSFER_BENCHMARKS_PATH, latestReportName);
      const latestReportContent = readFile(latestReportPath);
      if (!/baseline-1gb/.test(latestReportContent)) {
        findings.push(`latest release benchmark report missing baseline-1gb scenario: ${latestReportName}`);
      }
      if (!/Throughput check:\s*PASS/.test(latestReportContent)) {
        findings.push(`latest release benchmark report missing throughput PASS markers: ${latestReportName}`);
      }
      details.push(`latest release benchmark report: reports/transfer-benchmarks/${latestReportName}`);
    }
  }

  return {
    name: 'Release benchmark evidence exists for WASM-related transfer performance tracking',
    pass: findings.length === 0,
    details: findings.length === 0 ? details : findings,
  };
}

function checkScriptAndWorkflow(packageJson, ciContent, releaseContent) {
  const missing = [];
  if (!(packageJson.scripts || {})[REQUIRED_SCRIPT_NAME]) {
    missing.push(`missing package script: ${REQUIRED_SCRIPT_NAME}`);
  }
  if (!ciContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    missing.push(`CI workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }
  if (!releaseContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    missing.push(`release workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }

  return {
    name: 'WASM alchemist gate is wired in package scripts and workflows',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs wasm alchemist verification',
            '.github/workflows/release.yml runs wasm alchemist verification',
          ]
        : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# WASM Alchemist Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    '## Checks',
    ...report.checks.map((check) => `- ${check.pass ? '[PASS]' : '[FAIL]'} ${check.name}`),
    '',
  ];

  for (const check of report.checks) {
    lines.push(`### ${check.name}`);
    for (const detail of check.details) {
      lines.push(`- ${detail}`);
    }
    lines.push('');
  }

  lines.push('## Summary');
  lines.push(`- Overall: ${report.passed ? 'PASS' : 'FAIL'}`);
  lines.push('');

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const checks = [];
  const required = checkRequiredFiles();
  checks.push(required);

  if (required.pass) {
    const loaderContent = readFile(WASM_LOADER_PATH);
    const performanceBridgeContent = readFile(WASM_PERFORMANCE_BRIDGE_PATH);
    const wasmIndexContent = readFile(WASM_INDEX_PATH);
    const compressionContent = readFile(COMPRESSION_BRIDGE_PATH);
    const chunkingContent = readFile(CHUNKING_BRIDGE_PATH);
    const workerContent = readFile(CRYPTO_WORKER_PATH);
    const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkAsyncLoaderDiscipline(loaderContent));
    checks.push(checkHashAccelerationPath(loaderContent, performanceBridgeContent, wasmIndexContent));
    checks.push(checkCompressionAndChunkingBridges(compressionContent, chunkingContent, wasmIndexContent));
    checks.push(checkWorkerIsolation(workerContent));
    checks.push(checkBenchmarkEvidence(packageJson));
    checks.push(checkScriptAndWorkflow(packageJson, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `wasm-alchemist-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `wasm-alchemist-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-wasm-alchemist] JSON: ${jsonPath}`);
  console.log(`[verify-wasm-alchemist] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
