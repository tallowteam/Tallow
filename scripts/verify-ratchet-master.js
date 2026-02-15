#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'RATCHET_MASTER_POLICY.md');
const TRIPLE_RATCHET_PATH = path.join(ROOT, 'lib', 'crypto', 'triple-ratchet.ts');
const SPARSE_RATCHET_PATH = path.join(ROOT, 'lib', 'crypto', 'sparse-pq-ratchet.ts');
const TEST_PATH = path.join(ROOT, 'tests', 'unit', 'crypto', 'ratchet-master.test.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:ratchet:master';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:ratchet:master';

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

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function checkRequiredFiles() {
  const requiredFiles = [
    POLICY_PATH,
    TRIPLE_RATCHET_PATH,
    SPARSE_RATCHET_PATH,
    TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Ratchet master policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required ratchet-master files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkTripleRatchet(content) {
  const findings = [];
  const requiredTokens = [
    'DH_RATCHET_MESSAGE_INTERVAL = 1000',
    'TRIPLE_RATCHET_MAX_SKIP = 1000',
    'sendMessageNumber % DH_RATCHET_MESSAGE_INTERVAL === 0',
    'this.state.dr.needsSendRatchet || shouldIntervalRatchet',
    'skippedKeys: Map<string, Uint8Array>',
    'this.state.skippedKeys.size < TRIPLE_RATCHET_MAX_SKIP',
    'this.secureDelete(this.state.dr.ourDHKeyPair.privateKey)',
  ];

  for (const token of requiredTokens) {
    if (!content.includes(token)) {
      findings.push(`missing triple-ratchet token: ${token}`);
    }
  }

  return {
    name: 'Triple ratchet enforces 1000-message DH cadence and out-of-order handling',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['triple ratchet includes periodic DH cadence, skipped-key handling, and key wipe paths']
      : findings,
  };
}

function checkSparseRatchet(content) {
  const findings = [];
  const requiredTokens = [
    'SPARSE_PQ_RATCHET_MESSAGE_THRESHOLD = 100',
    'this.state.messageCount >= SPARSE_PQ_RATCHET_MESSAGE_THRESHOLD',
    'this.secureDelete(this.state.ourKeyPair.kyber.secretKey)',
    'this.secureDelete(this.state.ourKeyPair.x25519.privateKey)',
  ];

  for (const token of requiredTokens) {
    if (!content.includes(token)) {
      findings.push(`missing sparse-pq-ratchet token: ${token}`);
    }
  }

  return {
    name: 'Sparse PQ ratchet enforces 100-message cadence and key destruction',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['sparse PQ ratchet threshold and key wipe paths are present']
      : findings,
  };
}

function checkTestCoverage(content) {
  const findings = [];
  const requiredTests = [
    'enforces DH ratchet cadence at 1000 messages',
    'caps skipped message-key cache at 1000 entries',
    'enforces sparse PQ ratchet cadence at 100 messages',
  ];

  for (const token of requiredTests) {
    if (!content.includes(token)) {
      findings.push(`missing ratchet-master test case: ${token}`);
    }
  }

  return {
    name: 'Unit tests cover ratchet cadence and skip-cache thresholds',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['ratchet-master tests validate DH/PQ cadence and out-of-order cap invariants']
      : findings,
  };
}

function checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent) {
  const findings = [];
  const packageJson = JSON.parse(packageJsonContent);

  if (!(packageJson.scripts || {})[REQUIRED_SCRIPT_NAME]) {
    findings.push(`missing package script: ${REQUIRED_SCRIPT_NAME}`);
  }
  if (!ciContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    findings.push(`CI workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }
  if (!releaseContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    findings.push(`release workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }

  return {
    name: 'Ratchet-master gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs ratchet-master verification',
          '.github/workflows/release.yml runs ratchet-master verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Ratchet Master Verification',
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
    const tripleContent = readFile(TRIPLE_RATCHET_PATH);
    const sparseContent = readFile(SPARSE_RATCHET_PATH);
    const testContent = readFile(TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkTripleRatchet(tripleContent));
    checks.push(checkSparseRatchet(sparseContent));
    checks.push(checkTestCoverage(testContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `ratchet-master-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `ratchet-master-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-ratchet-master] JSON: ${jsonPath}`);
  console.log(`[verify-ratchet-master] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
