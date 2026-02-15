#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'CRYPTO_TEST_VECTOR_POLICY.md');
const BLAKE3_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'crypto', 'blake3.test.ts');
const SHA3_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'crypto', 'sha3.test.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_BLAKE3_VECTORS = [
  'af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262',
  '6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85',
  'd74981efa70a0c880b8d8c1985d075dbcbf679b99a5f9914e5aaf96b831a9e24',
];

const REQUIRED_SHA3_TOKENS = [
  'Test vectors from FIPS 202 and NIST',
  'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
  '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532',
];

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

function checkRequiredFiles() {
  const requiredPaths = [POLICY_PATH, BLAKE3_TEST_PATH, SHA3_TEST_PATH, PACKAGE_JSON_PATH, CI_WORKFLOW_PATH, RELEASE_WORKFLOW_PATH];
  const missing = requiredPaths
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Policy, test, and workflow files exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required files for crypto vector enforcement are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkBlake3Vectors(content) {
  const missing = REQUIRED_BLAKE3_VECTORS.filter((vector) => !content.includes(vector));

  return {
    name: 'BLAKE3 official vectors are pinned in unit tests',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['official BLAKE3 vectors present in tests/unit/crypto/blake3.test.ts']
      : missing.map((vector) => `missing BLAKE3 vector: ${vector}`),
  };
}

function checkSha3Vectors(content) {
  const missing = REQUIRED_SHA3_TOKENS.filter((token) => !content.includes(token));

  return {
    name: 'SHA3 FIPS/NIST vectors are pinned in unit tests',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['FIPS/NIST SHA3 vectors present in tests/unit/crypto/sha3.test.ts']
      : missing.map((token) => `missing SHA3 token: ${token}`),
  };
}

function checkNoSkippedVectorTests(blake3Content, sha3Content) {
  const badPatterns = ['.skip(', 'describe.skip', 'it.skip', 'test.skip'];
  const issues = [];

  for (const pattern of badPatterns) {
    if (blake3Content.includes(pattern)) {
      issues.push(`tests/unit/crypto/blake3.test.ts contains forbidden skip marker: ${pattern}`);
    }
    if (sha3Content.includes(pattern)) {
      issues.push(`tests/unit/crypto/sha3.test.ts contains forbidden skip marker: ${pattern}`);
    }
  }

  return {
    name: 'Vector suites do not use skipped tests',
    pass: issues.length === 0,
    details: issues.length === 0
      ? ['no skip markers detected in required vector suites']
      : issues,
  };
}

function checkScripts(packageJson) {
  const requiredScripts = ['test:crypto', 'verify:crypto:test-vectors'];
  const missing = requiredScripts.filter((scriptName) => !(packageJson.scripts || {})[scriptName]);

  return {
    name: 'Package scripts expose crypto vector gates',
    pass: missing.length === 0,
    details: missing.length === 0
      ? requiredScripts.map((scriptName) => `${scriptName}: ${packageJson.scripts[scriptName]}`)
      : missing.map((scriptName) => `missing script: ${scriptName}`),
  };
}

function checkWorkflowCommands(ciContent, releaseContent) {
  const missing = [];

  if (!ciContent.includes('npm run verify:crypto:test-vectors')) {
    missing.push('CI workflow missing `npm run verify:crypto:test-vectors`');
  }
  if (!ciContent.includes('npm run test:crypto -- tests/unit/crypto/blake3.test.ts tests/unit/crypto/sha3.test.ts')) {
    missing.push('CI workflow missing explicit BLAKE3/SHA3 vector suite execution');
  }
  if (!releaseContent.includes('npm run verify:crypto:test-vectors')) {
    missing.push('release workflow missing `npm run verify:crypto:test-vectors`');
  }
  if (!releaseContent.includes('npm run test:crypto -- tests/unit/crypto/blake3.test.ts tests/unit/crypto/sha3.test.ts')) {
    missing.push('release workflow missing explicit BLAKE3/SHA3 vector suite execution');
  }

  return {
    name: 'CI and release workflows execute crypto vector gates',
    pass: missing.length === 0,
    details: missing.length === 0
      ? [
          '.github/workflows/ci.yml runs npm run verify:crypto:test-vectors',
          '.github/workflows/ci.yml runs npm run test:crypto -- tests/unit/crypto/blake3.test.ts tests/unit/crypto/sha3.test.ts',
          '.github/workflows/release.yml runs npm run verify:crypto:test-vectors',
          '.github/workflows/release.yml runs npm run test:crypto -- tests/unit/crypto/blake3.test.ts tests/unit/crypto/sha3.test.ts',
        ]
      : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Crypto Test Vector Verification',
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
  const requiredFiles = checkRequiredFiles();
  checks.push(requiredFiles);

  if (requiredFiles.pass) {
    const blake3Content = readFile(BLAKE3_TEST_PATH);
    const sha3Content = readFile(SHA3_TEST_PATH);
    const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
    const ciWorkflowContent = readFile(CI_WORKFLOW_PATH);
    const releaseWorkflowContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkBlake3Vectors(blake3Content));
    checks.push(checkSha3Vectors(sha3Content));
    checks.push(checkNoSkippedVectorTests(blake3Content, sha3Content));
    checks.push(checkScripts(packageJson));
    checks.push(checkWorkflowCommands(ciWorkflowContent, releaseWorkflowContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const reportsDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `crypto-test-vectors-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `crypto-test-vectors-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-crypto-test-vectors] JSON: ${jsonPath}`);
  console.log(`[verify-crypto-test-vectors] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
