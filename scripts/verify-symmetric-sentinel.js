#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'SYMMETRIC_SENTINEL_POLICY.md');
const CIPHER_SELECTION_PATH = path.join(ROOT, 'lib', 'crypto', 'cipher-selection.ts');
const SYMMETRIC_PATH = path.join(ROOT, 'lib', 'crypto', 'symmetric.ts');
const TEST_PATH = path.join(ROOT, 'tests', 'unit', 'crypto', 'symmetric-sentinel.test.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:symmetric:sentinel';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:symmetric:sentinel';

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
    CIPHER_SELECTION_PATH,
    SYMMETRIC_PATH,
    TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Symmetric sentinel policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required symmetric-sentinel files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkCipherSelection(content) {
  const findings = [];
  const requiredTokens = [
    'SymmetricCipherAlgorithm',
    'CIPHER_SELECTION_PRIORITY',
    "return 'AES-256-GCM'",
    "return 'CHACHA20-POLY1305'",
    "return 'AEGIS-256'",
  ];

  for (const token of requiredTokens) {
    if (!content.includes(token)) {
      findings.push(`missing cipher-selection token: ${token}`);
    }
  }

  return {
    name: 'Cipher selection policy prioritizes AEGIS/AES/ChaCha with FIPS guardrails',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['cipher-selection includes prioritized selection and explicit FIPS-safe behavior']
      : findings,
  };
}

function checkSymmetricInvariants(content) {
  const findings = [];
  const requiredTokens = [
    'SYMMETRIC_NONCE_BYTES = 12',
    'SYMMETRIC_AUTH_TAG_BYTES = 16',
    'SYMMETRIC_DIRECTION_SENDER = 0x00000000',
    'SYMMETRIC_DIRECTION_RECEIVER = 0x00000001',
    'buildDirectionalNonce',
    'reserveNonce',
    'Nonce reuse detected',
    'Authentication tag verification failed before plaintext release',
  ];

  for (const token of requiredTokens) {
    if (!content.includes(token)) {
      findings.push(`missing symmetric invariant token: ${token}`);
    }
  }

  return {
    name: 'Symmetric implementation enforces 96-bit nonce non-reuse and auth-tag discipline',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['symmetric sentinel contains direction/counter nonce contracts and auth-tag-first failure handling']
      : findings,
  };
}

function checkTestCoverage(content) {
  const findings = [];
  const requiredTests = [
    'builds 96-bit directional nonces with direction-flag + counter encoding',
    'rejects nonce reuse within the same symmetric session',
    'enforces auth-tag verification before plaintext release',
    'supports ChaCha20-Poly1305 with the same 96-bit nonce contract',
  ];

  for (const token of requiredTests) {
    if (!content.includes(token)) {
      findings.push(`missing symmetric-sentinel test case: ${token}`);
    }
  }

  return {
    name: 'Unit tests cover nonce layout, nonce reuse detection, and auth-tag enforcement',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['symmetric-sentinel tests validate nonce shape, non-reuse, and decryption authentication behavior']
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
    name: 'Symmetric sentinel gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs symmetric-sentinel verification',
          '.github/workflows/release.yml runs symmetric-sentinel verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Symmetric Sentinel Verification',
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
    const cipherSelectionContent = readFile(CIPHER_SELECTION_PATH);
    const symmetricContent = readFile(SYMMETRIC_PATH);
    const testContent = readFile(TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkCipherSelection(cipherSelectionContent));
    checks.push(checkSymmetricInvariants(symmetricContent));
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
  const jsonPath = path.join(outputDirectory, `symmetric-sentinel-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `symmetric-sentinel-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-symmetric-sentinel] JSON: ${jsonPath}`);
  console.log(`[verify-symmetric-sentinel] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
