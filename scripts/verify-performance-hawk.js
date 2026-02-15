#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'PERFORMANCE_HAWK_POLICY.md');
const CRYPTO_WORKER_CLIENT_PATH = path.join(ROOT, 'lib', 'crypto', 'crypto-worker-client.ts');
const CRYPTO_WORKER_PATH = path.join(ROOT, 'lib', 'workers', 'crypto.worker.ts');
const DYNAMIC_IMPORTS_PATH = path.join(ROOT, 'lib', 'performance', 'dynamic-imports.ts');
const ADMIN_PAGE_PATH = path.join(ROOT, 'app', 'admin', 'page.tsx');
const BUNDLE_TRACKER_PATH = path.join(ROOT, 'scripts', 'benchmark', 'bundle-size-tracker.js');
const LIGHTHOUSE_RUNNER_PATH = path.join(ROOT, 'scripts', 'benchmark', 'lighthouse-ci.js');
const BUNDLE_REPORT_PATH = path.join(ROOT, 'reports', 'bundle-size-report.md');
const LIGHTHOUSE_REPORTS_DIR = path.join(ROOT, 'reports', 'lighthouse');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:performance:hawk';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:performance:hawk';

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
    CRYPTO_WORKER_CLIENT_PATH,
    CRYPTO_WORKER_PATH,
    DYNAMIC_IMPORTS_PATH,
    ADMIN_PAGE_PATH,
    BUNDLE_TRACKER_PATH,
    LIGHTHOUSE_RUNNER_PATH,
    BUNDLE_REPORT_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Performance policy, benchmark scripts, runtime paths, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required performance hawk files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkCryptoWorkerOffload(clientContent, workerContent) {
  const missing = [];

  if (!/new Worker\(/.test(clientContent)) {
    missing.push('crypto-worker-client missing Worker instantiation');
  }
  if (!/crypto\.worker\.ts/.test(clientContent)) {
    missing.push('crypto-worker-client missing crypto.worker.ts binding');
  }
  for (const op of ['encrypt', 'decrypt', 'hash', 'derive-key']) {
    const hasSwitchCase = new RegExp(`case\\s*['"]${op}['"]\\s*:`).test(workerContent);
    const hasTypeToken = new RegExp(`['"]${op}['"]`).test(workerContent);
    if (!hasSwitchCase && !hasTypeToken) {
      missing.push(`crypto worker missing operation: ${op}`);
    }
  }

  return {
    name: 'Crypto operations are wired for worker execution',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['crypto worker client + worker operation handlers verified']
        : missing,
  };
}

function checkLazyLoading(dynamicContent, adminContent) {
  const missing = [];

  const requiredLazyTokens = ['LazyChatPanel', 'LazyFriendsList', 'LazyTransferHistory', 'getCryptoWorker'];
  for (const token of requiredLazyTokens) {
    if (!dynamicContent.includes(token)) {
      missing.push(`dynamic import helper missing token: ${token}`);
    }
  }
  if (!/import\(['"]qrcode['"]\)/.test(dynamicContent)) {
    missing.push('dynamic import helper missing qrcode lazy import');
  }
  if (!/import\(['"]jszip['"]\)/.test(dynamicContent)) {
    missing.push('dynamic import helper missing jszip lazy import');
  }
  if (!/dynamic\(/.test(adminContent) || !/SimpleChart/.test(adminContent)) {
    missing.push('admin page missing dynamic SimpleChart loading');
  }

  return {
    name: 'Heavy UI/features are lazy-loaded through dynamic import boundaries',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['dynamic loading paths detected for heavy chart and transfer UI modules'] : missing,
  };
}

function checkBenchmarkEvidence(bundleReportContent) {
  const findings = [];

  if (!/All Budgets Met/i.test(bundleReportContent)) {
    findings.push('bundle-size report does not show budget compliance');
  }

  let lighthousePassReports = 0;
  if (fs.existsSync(LIGHTHOUSE_REPORTS_DIR)) {
    const entries = fs.readdirSync(LIGHTHOUSE_REPORTS_DIR);
    for (const entry of entries) {
      if (!entry.endsWith('.md')) {
        continue;
      }
      const content = readFile(path.join(LIGHTHOUSE_REPORTS_DIR, entry));
      if (/All Performance Budgets Met/i.test(content)) {
        lighthousePassReports += 1;
      }
    }
  }

  if (lighthousePassReports === 0) {
    findings.push('no lighthouse report contains "All Performance Budgets Met"');
  }

  return {
    name: 'Bundle and Lighthouse benchmark evidence is present',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? ['bundle report indicates budgets met', `lighthouse budget pass reports found: ${lighthousePassReports}`]
        : findings,
  };
}

function checkPackageScripts(packageJson) {
  const scripts = packageJson.scripts || {};
  const missing = [];

  for (const scriptName of ['bench:bundle', 'bench:lighthouse', 'optimize:images']) {
    if (!scripts[scriptName]) {
      missing.push(`missing package script: ${scriptName}`);
    }
  }

  return {
    name: 'Performance benchmark and image-optimization scripts are configured',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? [
            `bench:bundle: ${scripts['bench:bundle']}`,
            `bench:lighthouse: ${scripts['bench:lighthouse']}`,
            `optimize:images: ${scripts['optimize:images']}`,
          ]
        : missing,
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
    name: 'Performance hawk gate is wired in package scripts and workflows',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs performance hawk verification',
            '.github/workflows/release.yml runs performance hawk verification',
          ]
        : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Performance Hawk Verification',
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
    const clientContent = readFile(CRYPTO_WORKER_CLIENT_PATH);
    const workerContent = readFile(CRYPTO_WORKER_PATH);
    const dynamicContent = readFile(DYNAMIC_IMPORTS_PATH);
    const adminContent = readFile(ADMIN_PAGE_PATH);
    const bundleReportContent = readFile(BUNDLE_REPORT_PATH);
    const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkCryptoWorkerOffload(clientContent, workerContent));
    checks.push(checkLazyLoading(dynamicContent, adminContent));
    checks.push(checkBenchmarkEvidence(bundleReportContent));
    checks.push(checkPackageScripts(packageJson));
    checks.push(checkScriptAndWorkflow(packageJson, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `performance-hawk-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `performance-hawk-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-performance-hawk] JSON: ${jsonPath}`);
  console.log(`[verify-performance-hawk] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
