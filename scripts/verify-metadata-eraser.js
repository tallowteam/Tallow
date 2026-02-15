#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'METADATA_ERASER_POLICY.md');
const IMPL_PATH = path.join(ROOT, 'lib', 'privacy', 'metadata-eraser.ts');
const TEST_PATH = path.join(ROOT, 'tests', 'unit', 'privacy', 'metadata-eraser.test.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:metadata:eraser';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:metadata:eraser';

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
    IMPL_PATH,
    TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Metadata eraser policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required metadata-eraser files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkImplementationInvariants(content) {
  const findings = [];
  const requiredTokens = [
    'EPOCH_TIMESTAMP',
    'MIN_PAD_SIZE',
    'DOCUMENT_METADATA_TYPES',
  ];

  for (const token of requiredTokens) {
    if (!content.includes(token)) {
      findings.push(`missing metadata-eraser invariant token: ${token}`);
    }
  }

  return {
    name: 'Metadata eraser module enforces epoch timestamps, padding, and document type handling',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['metadata-eraser.ts includes all METADATA-ERASER invariant tokens']
      : findings,
  };
}

function checkTestCoverage(content) {
  const findings = [];
  const requiredTests = [
    'generates random hex transfer filename',
    'validates transfer filename format',
    'filename encryption and decryption round-trip',
  ];

  for (const token of requiredTests) {
    if (!content.includes(token)) {
      findings.push(`missing metadata-eraser test case: ${token}`);
    }
  }

  return {
    name: 'Unit tests cover metadata eraser filename encryption and transfer name invariants',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['metadata-eraser tests validate filename generation, format validation, and encryption round-trip']
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
    name: 'Metadata eraser gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs metadata-eraser verification',
          '.github/workflows/release.yml runs metadata-eraser verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Metadata Eraser Verification',
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
    const implContent = readFile(IMPL_PATH);
    const testContent = readFile(TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkImplementationInvariants(implContent));
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
  const jsonPath = path.join(outputDirectory, `metadata-eraser-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `metadata-eraser-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-metadata-eraser] JSON: ${jsonPath}`);
  console.log(`[verify-metadata-eraser] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
