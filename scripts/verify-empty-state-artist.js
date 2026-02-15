#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'EMPTY_STATE_ARTIST_POLICY.md');
const DEVICE_LIST_PATH = path.join(ROOT, 'components', 'transfer', 'DeviceList.tsx');
const DEVICE_LIST_STYLE_PATH = path.join(ROOT, 'components', 'transfer', 'devicelist.module.css');
const TRANSFER_PROGRESS_PATH = path.join(ROOT, 'components', 'transfer', 'TransferProgress.tsx');
const TRANSFER_PROGRESS_STYLE_PATH = path.join(ROOT, 'components', 'transfer', 'TransferProgress.module.css');
const TRANSFER_HISTORY_PATH = path.join(ROOT, 'components', 'transfer', 'TransferHistory.tsx');
const TRANSFER_HISTORY_STYLE_PATH = path.join(ROOT, 'components', 'transfer', 'transferhistory.module.css');
const UNIT_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'components', 'TransferDashboardPanels.test.tsx');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:empty-states:artist';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:empty-states:artist';

const DEVICE_LIST_TOKENS = [
  '<svg',
  'No nearby devices detected.',
  'Check Wi-Fi',
  'Scan again',
];

const TRANSFER_PROGRESS_TOKENS = [
  '<svg',
  'No active transfers right now.',
  'Pick a nearby device',
  'Choose a device',
];

const TRANSFER_HISTORY_TOKENS = [
  '<svg',
  'No transfer history yet.',
  'Completed and failed transfers will appear here',
  'Start your first transfer',
];

const REQUIRED_STYLE_TOKENS = ['.emptyIcon', '.emptyDescription', '.emptyAction'];
const FORBIDDEN_PLAIN_EMPTY_TOKENS = ['Nothing here.'];
const REQUIRED_UNIT_TEST_TOKENS = [
  'shows guided empty state with actionable CTA',
  'shows guided empty state with start action',
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
    DEVICE_LIST_PATH,
    DEVICE_LIST_STYLE_PATH,
    TRANSFER_PROGRESS_PATH,
    TRANSFER_PROGRESS_STYLE_PATH,
    TRANSFER_HISTORY_PATH,
    TRANSFER_HISTORY_STYLE_PATH,
    UNIT_TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Empty-state policy, components, styles, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required empty-state files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkTokenSet(name, content, tokens) {
  const missing = tokens.filter((token) => !content.includes(token));
  return {
    name,
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required tokens found']
      : missing.map((token) => `missing token: ${token}`),
  };
}

function checkForbiddenTokens(name, content, tokens) {
  const found = tokens.filter((token) => content.includes(token));
  return {
    name,
    pass: found.length === 0,
    details: found.length === 0
      ? ['no forbidden placeholder-only copy detected']
      : found.map((token) => `forbidden token found: ${token}`),
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
    name: 'Empty-state gate is wired in package scripts and workflows',
    pass: missing.length === 0,
    details: missing.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs empty-state verifier',
          '.github/workflows/release.yml runs empty-state verifier',
        ]
      : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Empty State Artist Verification',
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
    const deviceListContent = readFile(DEVICE_LIST_PATH);
    const deviceListStyleContent = readFile(DEVICE_LIST_STYLE_PATH);
    const transferProgressContent = readFile(TRANSFER_PROGRESS_PATH);
    const transferProgressStyleContent = readFile(TRANSFER_PROGRESS_STYLE_PATH);
    const transferHistoryContent = readFile(TRANSFER_HISTORY_PATH);
    const transferHistoryStyleContent = readFile(TRANSFER_HISTORY_STYLE_PATH);
    const unitTestContent = readFile(UNIT_TEST_PATH);
    const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkTokenSet('Device list empty state includes illustration, explanation, and action', deviceListContent, DEVICE_LIST_TOKENS));
    checks.push(checkTokenSet('Active transfer panel empty state includes illustration, explanation, and action', transferProgressContent, TRANSFER_PROGRESS_TOKENS));
    checks.push(checkTokenSet('Transfer history panel empty state includes illustration, explanation, and action', transferHistoryContent, TRANSFER_HISTORY_TOKENS));
    checks.push(checkTokenSet('Device list empty-state styles include icon, description, and action classes', deviceListStyleContent, REQUIRED_STYLE_TOKENS));
    checks.push(checkTokenSet('Transfer progress empty-state styles include icon, description, and action classes', transferProgressStyleContent, REQUIRED_STYLE_TOKENS));
    checks.push(checkTokenSet('Transfer history empty-state styles include icon, description, and action classes', transferHistoryStyleContent, REQUIRED_STYLE_TOKENS));
    checks.push(checkForbiddenTokens('No forbidden placeholder-only empty-state copy is present', `${deviceListContent}\n${transferProgressContent}\n${transferHistoryContent}`, FORBIDDEN_PLAIN_EMPTY_TOKENS));
    checks.push(checkTokenSet('Unit coverage validates guided empty-state actions', unitTestContent, REQUIRED_UNIT_TEST_TOKENS));
    checks.push(checkScriptAndWorkflow(packageJson, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `empty-state-artist-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `empty-state-artist-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-empty-state-artist] JSON: ${jsonPath}`);
  console.log(`[verify-empty-state-artist] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
