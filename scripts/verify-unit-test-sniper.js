#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'UNIT_TEST_SNIPER_POLICY.md');
const BLAKE3_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'crypto', 'blake3.test.ts');
const SHA3_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'crypto', 'sha3.test.ts');
const HOOK_LIFECYCLE_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'hooks', 'hook-lifecycle.test.ts');
const NOTIFICATIONS_HOOK_PATH = path.join(ROOT, 'lib', 'hooks', 'use-notifications.ts');
const VITEST_CONFIG_PATH = path.join(ROOT, 'vitest.config.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:unit:test-sniper';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:unit:test-sniper';

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

const REQUIRED_HOOK_LIFECYCLE_TEST_CASES = [
  'useFileTransfer resets in-memory queue after unmount/remount',
  'useOnboarding restores persisted state after unmount/remount',
  'useNotifications clears pending auto-reject timers on unmount',
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
  const required = [
    POLICY_PATH,
    BLAKE3_TEST_PATH,
    SHA3_TEST_PATH,
    HOOK_LIFECYCLE_TEST_PATH,
    NOTIFICATIONS_HOOK_PATH,
    VITEST_CONFIG_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Policy, test, hook, config, and workflow files exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required files for AGENT 076 verification are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkCryptoVectors(blake3Content, sha3Content) {
  const missing = [];

  for (const vector of REQUIRED_BLAKE3_VECTORS) {
    if (!blake3Content.includes(vector)) {
      missing.push(`missing BLAKE3 vector: ${vector}`);
    }
  }

  for (const token of REQUIRED_SHA3_TOKENS) {
    if (!sha3Content.includes(token)) {
      missing.push(`missing SHA3/FIPS token: ${token}`);
    }
  }

  return {
    name: 'Crypto vector suites contain official NIST/FIPS and BLAKE3 vectors',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['required official vectors found in tests/unit/crypto/blake3.test.ts and tests/unit/crypto/sha3.test.ts']
      : missing,
  };
}

function checkNoSkippedVectorTests(blake3Content, sha3Content) {
  const forbidden = ['.skip(', 'describe.skip', 'it.skip', 'test.skip'];
  const findings = [];

  for (const marker of forbidden) {
    if (blake3Content.includes(marker)) {
      findings.push(`tests/unit/crypto/blake3.test.ts contains forbidden skip marker: ${marker}`);
    }
    if (sha3Content.includes(marker)) {
      findings.push(`tests/unit/crypto/sha3.test.ts contains forbidden skip marker: ${marker}`);
    }
  }

  return {
    name: 'Crypto vector suites do not include skipped tests',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['no skip markers detected in required crypto vector suites']
      : findings,
  };
}

function checkHookLifecycleCoverage(hookLifecycleContent, notificationsHookContent) {
  const findings = [];

  for (const testCase of REQUIRED_HOOK_LIFECYCLE_TEST_CASES) {
    if (!hookLifecycleContent.includes(testCase)) {
      findings.push(`missing lifecycle test case: ${testCase}`);
    }
  }

  if (!hookLifecycleContent.includes('unmount')) {
    findings.push('hook lifecycle suite does not reference unmount behavior');
  }

  if (!notificationsHookContent.includes('incomingTransferTimeoutsRef')) {
    findings.push('use-notifications.ts missing tracked timeout registry for unmount cleanup');
  }
  if (!/useEffect\(\(\)\s*=>\s*{\s*return\s*\(\)\s*=>[\s\S]*incomingTransferTimeoutsRef/.test(notificationsHookContent)) {
    findings.push('use-notifications.ts missing timeout cleanup in useEffect unmount handler');
  }

  return {
    name: 'Hook lifecycle tests and runtime cleanup are enforced',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['hook lifecycle suite covers mount/unmount for file-transfer/onboarding/notifications and runtime timeout cleanup exists']
      : findings,
  };
}

function checkCoverageThresholds(vitestConfigContent) {
  const thresholds = [
    { label: 'lines', regex: /lines\s*:\s*90\b/ },
    { label: 'statements', regex: /statements\s*:\s*90\b/ },
    { label: 'functions', regex: /functions\s*:\s*90\b/ },
    { label: 'branches', regex: /branches\s*:\s*80\b/ },
  ];

  const missing = thresholds
    .filter((threshold) => !threshold.regex.test(vitestConfigContent))
    .map((threshold) => `missing or incorrect coverage threshold: ${threshold.label}`);

  return {
    name: 'Vitest coverage thresholds enforce 90/90/90/80 floor',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['vitest.config.ts includes lines/statements/functions=90 and branches=80 thresholds']
      : missing,
  };
}

function checkScriptAndWorkflow(packageJson, ciContent, releaseContent) {
  const findings = [];
  const scripts = packageJson.scripts || {};

  if (!scripts[REQUIRED_SCRIPT_NAME]) {
    findings.push(`missing package script: ${REQUIRED_SCRIPT_NAME}`);
  }
  if (!ciContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    findings.push(`CI workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }
  if (!releaseContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    findings.push(`release workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }

  return {
    name: 'Unit-test-sniper gate is wired in package scripts and workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs unit-test-sniper verification',
          '.github/workflows/release.yml runs unit-test-sniper verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Unit Test Sniper Verification',
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
    const blake3Content = readFile(BLAKE3_TEST_PATH);
    const sha3Content = readFile(SHA3_TEST_PATH);
    const hookLifecycleContent = readFile(HOOK_LIFECYCLE_TEST_PATH);
    const notificationsHookContent = readFile(NOTIFICATIONS_HOOK_PATH);
    const vitestConfigContent = readFile(VITEST_CONFIG_PATH);
    const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkCryptoVectors(blake3Content, sha3Content));
    checks.push(checkNoSkippedVectorTests(blake3Content, sha3Content));
    checks.push(checkHookLifecycleCoverage(hookLifecycleContent, notificationsHookContent));
    checks.push(checkCoverageThresholds(vitestConfigContent));
    checks.push(checkScriptAndWorkflow(packageJson, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `unit-test-sniper-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `unit-test-sniper-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-unit-test-sniper] JSON: ${jsonPath}`);
  console.log(`[verify-unit-test-sniper] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
