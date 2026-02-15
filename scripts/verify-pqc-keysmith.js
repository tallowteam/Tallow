#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'PQC_KEYSMITH_POLICY.md');
const PQC_CRYPTO_PATH = path.join(ROOT, 'lib', 'crypto', 'pqc-crypto.ts');
const TEST_PATH = path.join(ROOT, 'tests', 'unit', 'crypto', 'pqc-keysmith.test.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:pqc:keysmith';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:pqc:keysmith';

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
    PQC_CRYPTO_PATH,
    TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'PQC keysmith policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required pqc-keysmith files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkPqcCryptoInvariants(content) {
  const findings = [];
  const requiredTokens = [
    'PQC_DOMAIN_SESSION_ENCRYPTION_KEY',
    'PQC_DOMAIN_SESSION_AUTH_KEY',
    'PQC_DOMAIN_SESSION_ID',
    'deriveBlake3Key',
    'deriveBlake3Key(PQC_DOMAIN_SESSION_ENCRYPTION_KEY',
    'deriveBlake3Key(PQC_DOMAIN_SESSION_AUTH_KEY',
    'deriveBlake3Key(PQC_DOMAIN_SESSION_ID',
    'private secureZero(data: Uint8Array | null | undefined): void',
    'finally {',
    'this.secureZero(kyberSharedSecretMaterial)',
    'this.secureZero(x25519SharedSecretMaterial)',
    'this.secureZero(ephemeralPrivateKey)',
    'crypto.getRandomValues(new Uint8Array(length))',
  ];

  for (const token of requiredTokens) {
    if (!content.includes(token)) {
      findings.push(`missing pqc invariant token: ${token}`);
    }
  }

  return {
    name: 'PQC crypto service enforces CSPRNG, BLAKE3 domains, and zeroization',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['pqc-crypto includes CSPRNG generation, BLAKE3 domain-separated derivation, and ephemeral zeroization']
      : findings,
  };
}

function checkTestCoverage(content) {
  const findings = [];
  const requiredTests = [
    'defines explicit BLAKE3 domain separation contexts',
    'derives distinct session keys from one shared secret',
    'uses CSPRNG-backed random byte generation',
  ];

  for (const token of requiredTests) {
    if (!content.includes(token)) {
      findings.push(`missing pqc-keysmith test case: ${token}`);
    }
  }

  return {
    name: 'Unit tests cover keysmith domain and randomness invariants',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['pqc-keysmith tests validate domain separation contexts and CSPRNG outputs']
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
    name: 'PQC keysmith gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs pqc-keysmith verification',
          '.github/workflows/release.yml runs pqc-keysmith verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# PQC Keysmith Verification',
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
    const pqcContent = readFile(PQC_CRYPTO_PATH);
    const testContent = readFile(TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkPqcCryptoInvariants(pqcContent));
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
  const jsonPath = path.join(outputDirectory, `pqc-keysmith-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `pqc-keysmith-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-pqc-keysmith] JSON: ${jsonPath}`);
  console.log(`[verify-pqc-keysmith] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
