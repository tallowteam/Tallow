#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, 'reports');
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'ONBOARD_GUIDE_POLICY.md');
const HOOK_PATH = path.join(ROOT, 'lib', 'hooks', 'use-onboarding.ts');
const COACH_PATH = path.join(ROOT, 'components', 'transfer', 'OnboardingCoach.tsx');
const TRANSFER_PAGE_PATH = path.join(ROOT, 'app', 'transfer', 'page.tsx');
const UNIT_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'hooks', 'use-onboarding.test.ts');
const E2E_TEST_PATH = path.join(ROOT, 'tests', 'e2e', 'transfer-page.spec.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_HOOK_TOKENS = [
  "STORAGE_KEY = 'tallow-onboarding'",
  'const DEFAULT_STEPS',
  "target: '[data-onboarding=\"mode-selector\"]'",
  "target: '[data-onboarding=\"device-list\"]'",
  "target: '[data-onboarding=\"drop-zone\"]'",
  'const skip = useCallback',
  'const dismiss = useCallback',
];

const REQUIRED_COACH_TOKENS = [
  '60-second setup',
  'Start guided setup',
  'Skip onboarding',
  'Remind me later',
  'Next step',
];

const REQUIRED_PAGE_TOKENS = [
  'useOnboarding',
  '<OnboardingCoach',
  'onSkip={onboarding.skip}',
  'onDismiss={onboarding.dismiss}',
];

const REQUIRED_UNIT_TEST_TOKEN = 'skips entire onboarding';
const REQUIRED_E2E_TEST_TOKEN = 'should run skippable progressive onboarding guide';
const REQUIRED_SCRIPT_NAME = 'verify:onboarding:guide';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:onboarding:guide';

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
    HOOK_PATH,
    COACH_PATH,
    TRANSFER_PAGE_PATH,
    UNIT_TEST_PATH,
    E2E_TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Onboarding policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required onboarding files are present']
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

function checkUnitAndE2ETestCoverage(unitContent, e2eContent) {
  const missing = [];
  if (!unitContent.includes(REQUIRED_UNIT_TEST_TOKEN)) {
    missing.push(`unit test coverage token missing: ${REQUIRED_UNIT_TEST_TOKEN}`);
  }
  if (!e2eContent.includes(REQUIRED_E2E_TEST_TOKEN)) {
    missing.push(`e2e coverage token missing: ${REQUIRED_E2E_TEST_TOKEN}`);
  }

  return {
    name: 'Onboarding is covered by unit and e2e tests',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['unit and e2e onboarding coverage tokens found']
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
    name: 'Onboarding gate is wired in package scripts and workflows',
    pass: missing.length === 0,
    details: missing.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs onboarding verifier',
          '.github/workflows/release.yml runs onboarding verifier',
        ]
      : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Onboard Guide Verification',
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
    const hookContent = readFile(HOOK_PATH);
    const coachContent = readFile(COACH_PATH);
    const pageContent = readFile(TRANSFER_PAGE_PATH);
    const unitTestContent = readFile(UNIT_TEST_PATH);
    const e2eTestContent = readFile(E2E_TEST_PATH);
    const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkTokenSet('Onboarding hook defines progressive guided targets and skip/dismiss actions', hookContent, REQUIRED_HOOK_TOKENS));
    checks.push(checkTokenSet('Onboarding coach exposes guided and skippable controls', coachContent, REQUIRED_COACH_TOKENS));
    checks.push(checkTokenSet('Transfer page integrates onboarding coach callbacks', pageContent, REQUIRED_PAGE_TOKENS));
    checks.push(checkUnitAndE2ETestCoverage(unitTestContent, e2eTestContent));
    checks.push(checkScriptAndWorkflow(packageJson, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `onboard-guide-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `onboard-guide-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-onboard-guide] JSON: ${jsonPath}`);
  console.log(`[verify-onboard-guide] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
