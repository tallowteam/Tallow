#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'ERROR_DIPLOMAT_POLICY.md');
const ERROR_DIPLOMAT_PATH = path.join(ROOT, 'lib', 'transfer', 'error-diplomat.ts');
const TRANSFER_PAGE_PATH = path.join(ROOT, 'app', 'transfer', 'page.tsx');
const TRANSFER_PAGE_CSS_PATH = path.join(ROOT, 'app', 'transfer', 'page.module.css');
const TEST_PATH = path.join(ROOT, 'tests', 'unit', 'transfer', 'error-diplomat.test.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:error:diplomat';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:error:diplomat';

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
    ERROR_DIPLOMAT_PATH,
    TRANSFER_PAGE_PATH,
    TRANSFER_PAGE_CSS_PATH,
    TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Error diplomat policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required error-diplomat files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkClassifierBehavior(errorDiplomatContent) {
  const findings = [];
  const requiredTokens = [
    "kind: 'crypto'",
    "kind: 'network'",
    "kind: 'file'",
    "kind: 'generic'",
    "message: 'Connection not secure. Reconnect and verify the security code before retrying.'",
    "message: 'Network connection problem. Check your connection and retry.'",
    "message: 'File processing error. Check file access, size, and format, then retry.'",
    "normalized.split('\\n')[0]",
  ];

  for (const token of requiredTokens) {
    if (!errorDiplomatContent.includes(token)) {
      findings.push(`missing classifier token: ${token}`);
    }
  }

  return {
    name: 'Classifier normalizes crypto/network/file/generic transfer failures',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['error classifier includes required AGENT 040 message normalization paths']
      : findings,
  };
}

function checkRecoveryUx(transferPageContent, transferPageCssContent) {
  const findings = [];

  const pageTokens = [
    'class TransferErrorBoundary',
    'handleTransferErrorRecovery',
    'applyTransferError',
    'clearTransferError',
    "'Retry connection'",
    "'Reset secure session'",
    'data-transfer-error-kind',
    'Dismiss',
    'role="alert"',
  ];
  for (const token of pageTokens) {
    if (!transferPageContent.includes(token)) {
      findings.push(`missing transfer-page recovery token: ${token}`);
    }
  }

  const cssTokens = [
    '.statusErrorActions',
    '.statusErrorActionButton',
    '.statusErrorDismissButton',
    '.statusErrorHint',
  ];
  for (const token of cssTokens) {
    if (!transferPageCssContent.includes(token)) {
      findings.push(`missing transfer-page error style token: ${token}`);
    }
  }

  return {
    name: 'Transfer page error surfaces include explicit recovery actions',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['transfer page renders actionable recovery controls for classified errors']
      : findings,
  };
}

function checkTests(testContent) {
  const findings = [];
  const requiredCases = [
    'normalizes crypto failures to secure reconnect guidance',
    'marks network failures as retryable and offers retry language',
    'marks file failures as retryable with clear file guidance',
    'falls back to first-line generic message for unknown errors',
    'returns a default generic retry message when input is empty',
  ];

  for (const testCase of requiredCases) {
    if (!testContent.includes(testCase)) {
      findings.push(`missing test case: ${testCase}`);
    }
  }

  return {
    name: 'Unit tests cover AGENT 040 classifier behavior',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['error diplomat unit tests cover crypto/network/file/generic recovery language']
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
    name: 'Error diplomat gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs error-diplomat verification',
          '.github/workflows/release.yml runs error-diplomat verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Error Diplomat Verification',
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
    const errorDiplomatContent = readFile(ERROR_DIPLOMAT_PATH);
    const transferPageContent = readFile(TRANSFER_PAGE_PATH);
    const transferPageCssContent = readFile(TRANSFER_PAGE_CSS_PATH);
    const testContent = readFile(TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkClassifierBehavior(errorDiplomatContent));
    checks.push(checkRecoveryUx(transferPageContent, transferPageCssContent));
    checks.push(checkTests(testContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `error-diplomat-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `error-diplomat-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-error-diplomat] JSON: ${jsonPath}`);
  console.log(`[verify-error-diplomat] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
