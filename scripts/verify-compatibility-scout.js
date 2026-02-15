#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'COMPATIBILITY_SCOUT_POLICY.md');
const PLAYWRIGHT_CONFIG_PATH = path.join(ROOT, 'playwright.config.ts');
const INFILTRATION_MATRIX_PATH = path.join(ROOT, 'docs', 'governance', 'E2E_INFILTRATION_MATRIX.json');
const REPORTS_DIR = path.join(ROOT, 'reports');
const WORKER_BRIDGE_PATH = path.join(ROOT, 'lib', 'workers', 'worker-bridge.ts');
const CRYPTO_FALLBACK_PATH = path.join(ROOT, 'lib', 'workers', 'crypto-fallback.ts');
const WASM_LOADER_PATH = path.join(ROOT, 'lib', 'wasm', 'wasm-loader.ts');
const TRANSPORT_SELECTOR_PATH = path.join(ROOT, 'lib', 'transport', 'transport-selector.ts');

const REQUIRED_PROJECTS = ['chromium', 'firefox', 'webkit', 'mobile-chrome', 'mobile-safari'];
const REQUIRED_MIN_PASSED = 400;

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
  return fs.readFileSync(filePath, 'utf8');
}

function parseLatestInfiltrationReport() {
  if (!fs.existsSync(REPORTS_DIR)) {
    return null;
  }

  const candidates = fs
    .readdirSync(REPORTS_DIR)
    .filter((name) => /^e2e-infiltration-.*\.json$/.test(name))
    .map((name) => path.join(REPORTS_DIR, name))
    .map((filePath) => {
      const stat = fs.statSync(filePath);
      return { filePath, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (candidates.length === 0) {
    return null;
  }

  const reportPath = candidates[0].filePath;
  const report = JSON.parse(readFile(reportPath));

  const matrixSummaryLine = (report.checks || [])
    .flatMap((check) => (Array.isArray(check.details) ? check.details : []))
    .find((detail) => /^matrix summary:/i.test(detail));

  if (!matrixSummaryLine) {
    return {
      reportPath,
      parsed: null,
      passed: report.passed === true,
    };
  }

  const parsed = {};
  matrixSummaryLine.replace(/(passed|skipped|flaky|failed)=(\d+)/g, (_, key, value) => {
    parsed[key] = Number(value);
    return _;
  });

  return {
    reportPath,
    parsed,
    passed: report.passed === true,
  };
}

function checkBaselineFiles() {
  const required = [
    POLICY_PATH,
    PLAYWRIGHT_CONFIG_PATH,
    INFILTRATION_MATRIX_PATH,
    WORKER_BRIDGE_PATH,
    CRYPTO_FALLBACK_PATH,
    WASM_LOADER_PATH,
    TRANSPORT_SELECTOR_PATH,
  ];

  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Compatibility baseline files exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['policy, config, matrix, and fallback implementation files present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkPlaywrightProjects(content) {
  const missing = REQUIRED_PROJECTS.filter(
    (project) => !new RegExp(`name:\\s*['"]${project}['"]`).test(content)
  );

  return {
    name: 'Required browser/device projects are declared',
    pass: missing.length === 0,
    details: missing.length === 0
      ? [`projects present: ${REQUIRED_PROJECTS.join(', ')}`]
      : missing.map((project) => `missing project: ${project}`),
  };
}

function checkE2EEvidence() {
  const latest = parseLatestInfiltrationReport();
  if (!latest) {
    return {
      name: 'Cross-browser matrix evidence meets compatibility threshold',
      pass: false,
      details: ['missing reports/e2e-infiltration-*.json'],
    };
  }

  if (!latest.passed) {
    return {
      name: 'Cross-browser matrix evidence meets compatibility threshold',
      pass: false,
      details: [`latest infiltration report failed: ${toPosix(path.relative(ROOT, latest.reportPath))}`],
    };
  }

  if (!latest.parsed) {
    return {
      name: 'Cross-browser matrix evidence meets compatibility threshold',
      pass: false,
      details: [
        `unable to parse matrix summary from ${toPosix(path.relative(ROOT, latest.reportPath))}`,
      ],
    };
  }

  const failures = [];
  if ((latest.parsed.failed || 0) !== 0) {
    failures.push(`failed scenarios not zero: ${latest.parsed.failed}`);
  }
  if ((latest.parsed.passed || 0) < REQUIRED_MIN_PASSED) {
    failures.push(`passed scenarios below threshold (${REQUIRED_MIN_PASSED}): ${latest.parsed.passed || 0}`);
  }

  return {
    name: 'Cross-browser matrix evidence meets compatibility threshold',
    pass: failures.length === 0,
    details: failures.length === 0
      ? [
          `latest report: ${toPosix(path.relative(ROOT, latest.reportPath))}`,
          `matrix summary: passed=${latest.parsed.passed}, skipped=${latest.parsed.skipped}, flaky=${latest.parsed.flaky}, failed=${latest.parsed.failed}`,
        ]
      : failures,
  };
}

function checkWorkerFallbacks(content) {
  const requiredTokens = [
    "import('./crypto-fallback')",
    'Worker execution failed, falling back to main thread',
    'Main thread fallback',
  ];
  const missing = requiredTokens.filter((token) => !content.includes(token));

  return {
    name: 'Worker crypto operations retain main-thread fallback',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['worker bridge keeps crypto fallback imports and fallback execution paths']
      : missing.map((token) => `missing token: ${token}`),
  };
}

function checkWasmFallbacks(content) {
  const requiredTokens = [
    'isWasmSupported',
    'WebAssembly is not supported in this environment',
    'Fallback to JS implementation',
    'Fallback on any error',
  ];
  const missing = requiredTokens.filter((token) => !content.includes(token));

  return {
    name: 'WASM loader retains graceful JS fallback behavior',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['WASM loader performs support detection and JS fallback on unsupported/error states']
      : missing.map((token) => `missing token: ${token}`),
  };
}

function checkTransportFallbackChain(content) {
  const requiredTokens = [
    "export type TransportProtocol = 'webtransport' | 'webrtc' | 'websocket'",
    'allowFallback',
    'fallback',
  ];
  const missing = requiredTokens.filter((token) => !content.includes(token));

  return {
    name: 'Transport selector preserves fallback chain coverage',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['transport selector keeps webtransport/webrtc/websocket chain with fallback controls']
      : missing.map((token) => `missing token: ${token}`),
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Compatibility Scout Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    '## Checks',
    ...report.checks.map((check) => `- ${check.pass ? '[PASS]' : '[FAIL]'} ${check.name}`),
    '',
  ];

  report.checks.forEach((check) => {
    lines.push(`### ${check.name}`);
    check.details.forEach((detail) => lines.push(`- ${detail}`));
    lines.push('');
  });

  lines.push('## Summary');
  lines.push(`- Overall: ${report.passed ? 'PASS' : 'FAIL'}`);
  lines.push('');

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const checks = [];
  const baseline = checkBaselineFiles();
  checks.push(baseline);

  if (baseline.pass) {
    const playwrightContent = readFile(PLAYWRIGHT_CONFIG_PATH);
    const workerBridgeContent = readFile(WORKER_BRIDGE_PATH);
    const wasmLoaderContent = readFile(WASM_LOADER_PATH);
    const transportSelectorContent = readFile(TRANSPORT_SELECTOR_PATH);

    checks.push(checkPlaywrightProjects(playwrightContent));
    checks.push(checkE2EEvidence());
    checks.push(checkWorkerFallbacks(workerBridgeContent));
    checks.push(checkWasmFallbacks(wasmLoaderContent));
    checks.push(checkTransportFallbackChain(transportSelectorContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const reportsDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `compatibility-scout-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `compatibility-scout-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-compatibility-scout] JSON: ${jsonPath}`);
  console.log(`[verify-compatibility-scout] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();

