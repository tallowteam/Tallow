#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'TABLE_TACTICIAN_POLICY.md');
const TOKENS_PATH = path.join(ROOT, 'lib', 'ui', 'table-tactician.ts');
const HISTORY_COMPONENT_PATH = path.join(ROOT, 'components', 'transfer', 'TransferHistory.tsx');
const HISTORY_CSS_PATH = path.join(ROOT, 'components', 'transfer', 'TransferHistory.module.css');
const TOKENS_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'ui', 'table-tactician.test.ts');
const HISTORY_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'components', 'TransferDashboardPanels.test.tsx');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:table:tactician';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:table:tactician';

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
    TOKENS_PATH,
    HISTORY_COMPONENT_PATH,
    HISTORY_CSS_PATH,
    TOKENS_TEST_PATH,
    HISTORY_TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Table tactician policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required table-tactician files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkTokenContract(tokensContent) {
  const findings = [];
  const requiredTokens = [
    'TABLE_VIRTUALIZATION_THRESHOLD = 100',
    'TRANSFER_HISTORY_ROW_HEIGHT_PX = 84',
    'TRANSFER_HISTORY_VIEWPORT_HEIGHT_PX = 504',
    'TRANSFER_HISTORY_OVERSCAN_ROWS = 6',
    'shouldVirtualizeTransferList',
    'totalItems > TABLE_VIRTUALIZATION_THRESHOLD',
  ];

  for (const token of requiredTokens) {
    if (!tokensContent.includes(token)) {
      findings.push(`missing table token contract: ${token}`);
    }
  }

  return {
    name: 'Token contract defines >100 virtualization threshold and dimensions',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['table tactician token contract defines threshold and virtualization dimensions']
      : findings,
  };
}

function checkVirtualizationImplementation(componentContent, cssContent) {
  const findings = [];
  const requiredComponentTokens = [
    'shouldVirtualizeTransferList(historyItems.length)',
    'data-virtualized-list',
    'data-transfer-history-virtualized-viewport="true"',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'TRANSFER_HISTORY_ROW_HEIGHT_PX',
    'TRANSFER_HISTORY_VIEWPORT_HEIGHT_PX',
    'TRANSFER_HISTORY_OVERSCAN_ROWS',
    'transform: `translateY(',
  ];
  const requiredCssTokens = [
    '.virtualViewport',
    '.virtualSpacer',
    '.virtualWindow',
    '.virtualRow',
    'will-change: transform',
  ];

  for (const token of requiredComponentTokens) {
    if (!componentContent.includes(token)) {
      findings.push(`transfer history missing virtualization token: ${token}`);
    }
  }
  for (const token of requiredCssTokens) {
    if (!cssContent.includes(token)) {
      findings.push(`transfer history css missing virtualization token: ${token}`);
    }
  }

  return {
    name: 'Transfer history implements governed virtualization path for large lists',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['transfer history uses tokenized virtualization with explicit viewport marker and rAF scroll updates']
      : findings,
  };
}

function checkTests(tokensTestContent, historyTestContent) {
  const findings = [];
  const requiredTokenCases = [
    'defines the virtualization threshold at 100 items',
    'defines transfer history virtualization dimensions',
    'enables virtualization only when the list exceeds 100 items',
  ];
  const requiredHistoryCase = 'virtualizes transfer history when more than 100 items are present';

  for (const token of requiredTokenCases) {
    if (!tokensTestContent.includes(token)) {
      findings.push(`missing token test case: ${token}`);
    }
  }
  if (!historyTestContent.includes(requiredHistoryCase)) {
    findings.push(`missing history virtualization test case: ${requiredHistoryCase}`);
  }

  return {
    name: 'Unit tests cover threshold contract and transfer-history virtualization behavior',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['unit tests cover token contracts and >100 transfer-history virtualization behavior']
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
    name: 'Table tactician gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs table-tactician verification',
          '.github/workflows/release.yml runs table-tactician verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Table Tactician Verification',
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
    const tokensContent = readFile(TOKENS_PATH);
    const historyComponentContent = readFile(HISTORY_COMPONENT_PATH);
    const historyCssContent = readFile(HISTORY_CSS_PATH);
    const tokensTestContent = readFile(TOKENS_TEST_PATH);
    const historyTestContent = readFile(HISTORY_TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkTokenContract(tokensContent));
    checks.push(checkVirtualizationImplementation(historyComponentContent, historyCssContent));
    checks.push(checkTests(tokensTestContent, historyTestContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `table-tactician-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `table-tactician-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-table-tactician] JSON: ${jsonPath}`);
  console.log(`[verify-table-tactician] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
