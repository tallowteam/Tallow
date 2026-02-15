#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'NOTIFICATION_HERALD_POLICY.md');
const NOTIFICATION_HOOK_PATH = path.join(ROOT, 'lib', 'hooks', 'use-notifications.ts');
const NOTIFICATION_MANAGER_PATH = path.join(ROOT, 'lib', 'utils', 'notification-manager.ts');
const TOAST_COMPONENT_PATH = path.join(ROOT, 'components', 'ui', 'Toast.tsx');
const HOOK_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'hooks', 'use-notifications.test.ts');
const TOAST_TEST_PATH = path.join(ROOT, 'components', 'ui', 'Toast.test.tsx');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:notification:herald';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:notification:herald';

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
    NOTIFICATION_HOOK_PATH,
    NOTIFICATION_MANAGER_PATH,
    TOAST_COMPONENT_PATH,
    HOOK_TEST_PATH,
    TOAST_TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Policy, implementation, tests, and workflow files exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required notification-herald files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkSuccessAndErrorSemantics(hookContent, toastContent) {
  const findings = [];

  if (!/notifyTransferComplete[\s\S]*toast\.success\(/.test(hookContent)) {
    findings.push('use-notifications.ts missing success toast in transfer complete flow');
  }
  if (!/notifyTransferFailed[\s\S]*toast\.error\(/.test(hookContent)) {
    findings.push('use-notifications.ts missing error toast in transfer failed flow');
  }
  if (!/notifyTransferFailed[\s\S]*label:\s*'Retry'/.test(hookContent)) {
    findings.push('use-notifications.ts missing retry action label for transfer failure');
  }
  if (!/if\s*\(!duration\s*\|\|\s*duration\s*===\s*Infinity\)\s*{return;}/.test(toastContent)) {
    findings.push('Toast.tsx missing persistent-duration guard for Infinity duration');
  }

  return {
    name: 'Success/error notification semantics and persistent failure path are implemented',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['success toasts, error toasts, retry actions, and Infinity-duration persistence support are present']
      : findings,
  };
}

function checkTransferRequestQuality(hookContent) {
  const findings = [];

  if (!/notifyIncomingTransferRequest/.test(hookContent)) {
    findings.push('use-notifications.ts missing incoming transfer request flow');
  }
  if (!/title:\s*`\$\{deviceName\} wants to send a file`/.test(hookContent)) {
    findings.push('incoming transfer request missing sender-context title');
  }
  if (!/message:\s*fileName/.test(hookContent)) {
    findings.push('incoming transfer request missing file-name message payload');
  }
  if (!/label:\s*'Accept'/.test(hookContent)) {
    findings.push('incoming transfer request missing accept action');
  }
  if (!/setTimeout\(\(\)\s*=>[\s\S]*onReject\(\)/.test(hookContent)) {
    findings.push('incoming transfer request missing timeout-based reject path');
  }

  return {
    name: 'Incoming transfer requests include file context plus accept/reject behavior',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['transfer requests include sender+file context with accept action and timeout rejection']
      : findings,
  };
}

function checkAntiSpamGrouping(managerContent) {
  const findings = [];

  if (!/groupedNotifications\s*=\s*new Map<NotificationGroup,\s*GroupedNotification>\(\)/.test(managerContent)) {
    findings.push('notification-manager.ts missing groupedNotifications state');
  }
  if (!/private updateGroupedNotification/.test(managerContent)) {
    findings.push('notification-manager.ts missing grouped update helper');
  }
  if (!/private getGroupedMessage/.test(managerContent)) {
    findings.push('notification-manager.ts missing grouped message helper');
  }
  if (!/transferComplete[\s\S]*updateGroupedNotification\('transfer'/.test(managerContent)) {
    findings.push('transferComplete flow missing transfer-group anti-spam update');
  }
  if (!/connectionEstablished[\s\S]*updateGroupedNotification\('connection'/.test(managerContent)) {
    findings.push('connectionEstablished flow missing connection-group anti-spam update');
  }
  if (!/connectionLost[\s\S]*updateGroupedNotification\('connection'/.test(managerContent)) {
    findings.push('connectionLost flow missing connection-group anti-spam update');
  }

  return {
    name: 'Notification manager groups related events to reduce spam',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['grouping state and grouped transfer/connection updates are present']
      : findings,
  };
}

function checkRichPayloadSupport(toastContent) {
  const findings = [];

  if (!/export interface ToastPreview/.test(toastContent)) {
    findings.push('Toast.tsx missing ToastPreview interface');
  }
  if (!/type:\s*'image'\s*\|\s*'file'\s*\|\s*'transfer'/.test(toastContent)) {
    findings.push('ToastPreview missing image/file/transfer variants');
  }
  if (!/actions\?:\s*ToastAction\[\]/.test(toastContent)) {
    findings.push('Toast.tsx missing multi-action support');
  }
  if (!/preview\?:\s*ToastPreview/.test(toastContent)) {
    findings.push('Toast.tsx missing rich preview payload support');
  }
  if (!/ToastPreviewComponent/.test(toastContent)) {
    findings.push('Toast.tsx missing preview renderer component');
  }

  return {
    name: 'Toast system supports rich preview payloads and action buttons',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['preview payloads and single/multi-action buttons are implemented in Toast.tsx']
      : findings,
  };
}

function checkTestCoverage(hookTestContent, toastTestContent) {
  const findings = [];

  const requiredHookCases = [
    'should notify incoming transfer request with actions',
    'should auto-reject after timeout',
    'should notify transfer failed with retry action',
  ];
  for (const testCase of requiredHookCases) {
    if (!hookTestContent.includes(testCase)) {
      findings.push(`missing use-notifications hook test case: ${testCase}`);
    }
  }

  const requiredToastCases = [
    'adds toast with action',
    'does not auto-dismiss when duration is Infinity',
    'supports multiple toasts',
  ];
  for (const testCase of requiredToastCases) {
    if (!toastTestContent.includes(testCase)) {
      findings.push(`missing toast test case: ${testCase}`);
    }
  }

  return {
    name: 'Unit tests cover transfer-request actions, persistence, and anti-spam behaviors',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['use-notifications and toast tests include required notification-herald scenarios']
      : findings,
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
    name: 'Notification-herald gate is wired in package scripts and workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs notification-herald verification',
          '.github/workflows/release.yml runs notification-herald verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Notification Herald Verification',
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
    const hookContent = readFile(NOTIFICATION_HOOK_PATH);
    const managerContent = readFile(NOTIFICATION_MANAGER_PATH);
    const toastContent = readFile(TOAST_COMPONENT_PATH);
    const hookTestContent = readFile(HOOK_TEST_PATH);
    const toastTestContent = readFile(TOAST_TEST_PATH);
    const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkSuccessAndErrorSemantics(hookContent, toastContent));
    checks.push(checkTransferRequestQuality(hookContent));
    checks.push(checkAntiSpamGrouping(managerContent));
    checks.push(checkRichPayloadSupport(toastContent));
    checks.push(checkTestCoverage(hookTestContent, toastTestContent));
    checks.push(checkScriptAndWorkflow(packageJson, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `notification-herald-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `notification-herald-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-notification-herald] JSON: ${jsonPath}`);
  console.log(`[verify-notification-herald] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
