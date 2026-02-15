#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'LOADING_ILLUSIONIST_POLICY.md');
const TRANSFER_LOADING_PATH = path.join(ROOT, 'app', 'transfer', 'loading.tsx');
const TRANSFER_LOADING_CSS_PATH = path.join(ROOT, 'app', 'transfer', 'loading.module.css');
const TEST_PATH = path.join(ROOT, 'tests', 'unit', 'components', 'transfer', 'TransferPageLoading.test.tsx');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:loading:illusionist';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:loading:illusionist';

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
    TRANSFER_LOADING_PATH,
    TRANSFER_LOADING_CSS_PATH,
    TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Loading illusionist policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required loading-illusionist files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkLoadingSurface(loadingContent) {
  const findings = [];
  const requiredTokens = [
    'data-transfer-loading',
    'role="status"',
    'aria-live="polite"',
    'aria-busy="true"',
    'Loading transfer workspace...',
    'data-stream-stage="1"',
    'data-stream-stage="2"',
    'data-stream-stage="3"',
    'data-skeleton="top-row"',
    'data-skeleton="bottom-row"',
    'data-skeleton="drop-zone"',
    'data-skeleton="device-list"',
    'data-skeleton="transfer-progress"',
    'data-skeleton="transfer-history"',
  ];

  for (const token of requiredTokens) {
    if (!loadingContent.includes(token)) {
      findings.push(`missing loading surface token: ${token}`);
    }
  }

  return {
    name: 'Transfer loading surface is immediate and non-blank',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['transfer loading route includes status semantics, staged sections, and dashboard-matched skeleton markers']
      : findings,
  };
}

function checkLoadingCss(cssContent) {
  const findings = [];
  const requiredTokens = [
    '@keyframes shimmer',
    '@keyframes streamIn',
    ".streamStage[data-stream-stage='2']",
    ".streamStage[data-stream-stage='3']",
    '@media (prefers-reduced-motion: reduce)',
  ];

  for (const token of requiredTokens) {
    if (!cssContent.includes(token)) {
      findings.push(`missing loading css token: ${token}`);
    }
  }

  return {
    name: 'Loading CSS defines shimmer, progressive stream, and reduced-motion fallback',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['loading stylesheet includes progressive and reduced-motion behavior required for AGENT 039']
      : findings,
  };
}

function checkTests(testContent) {
  const findings = [];
  const requiredCases = [
    'renders an immediate non-blank loading status surface',
    'streams loading sections in progressive stages',
    'matches transfer dashboard panel skeleton structure',
  ];

  for (const testCase of requiredCases) {
    if (!testContent.includes(testCase)) {
      findings.push(`missing test case: ${testCase}`);
    }
  }

  return {
    name: 'Unit tests cover loading immediacy, streaming stages, and layout parity',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['loading unit tests cover AGENT 039 required behavior']
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
    name: 'Loading illusionist gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs loading-illusionist verification',
          '.github/workflows/release.yml runs loading-illusionist verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Loading Illusionist Verification',
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
    const loadingContent = readFile(TRANSFER_LOADING_PATH);
    const loadingCssContent = readFile(TRANSFER_LOADING_CSS_PATH);
    const testContent = readFile(TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkLoadingSurface(loadingContent));
    checks.push(checkLoadingCss(loadingCssContent));
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
  const jsonPath = path.join(outputDirectory, `loading-illusionist-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `loading-illusionist-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-loading-illusionist] JSON: ${jsonPath}`);
  console.log(`[verify-loading-illusionist] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
