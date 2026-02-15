#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'security', 'AUTOMATION_ENGINEER_POLICY.md');
const SCHEDULED_TRANSFER_PATH = path.join(ROOT, 'lib', 'transfer', 'scheduled-transfer.ts');
const TEMPLATE_PATH = path.join(ROOT, 'lib', 'transfer', 'transfer-templates.ts');
const SECURE_STORAGE_PATH = path.join(ROOT, 'lib', 'storage', 'secure-storage.ts');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

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
  return fs.readFileSync(filePath, 'utf8');
}

function checkFilesExist() {
  const required = [
    POLICY_PATH,
    SCHEDULED_TRANSFER_PATH,
    TEMPLATE_PATH,
    SECURE_STORAGE_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/'));

  return {
    name: 'Automation engineer baseline files exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['policy, automation modules, secure storage, and workflows found']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkScheduledTransferReauth(content) {
  const required = [
    'REAUTH_WINDOW_MS',
    'reauthenticateScheduledTransfers',
    'hasFreshScheduledTransferReauth',
    'Re-authentication required before scheduled transfer execution',
  ];
  const missing = required.filter((token) => !content.includes(token));

  return {
    name: 'Scheduled transfers enforce re-authentication',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['scheduled-transfer runtime requires fresh auth before automated execution']
      : missing.map((token) => `missing token: ${token}`),
  };
}

function checkEncryptedTemplateStorage(templateContent, scheduledContent) {
  const failures = [];

  if (!templateContent.includes("import secureStorage from '../storage/secure-storage'")) {
    failures.push('transfer-templates missing secureStorage import');
  }
  if (!templateContent.includes('secureStorage.setItem(STORAGE_KEY')) {
    failures.push('transfer-templates missing secureStorage.setItem persistence');
  }

  if (!scheduledContent.includes("import secureStorage from '../storage/secure-storage'")) {
    failures.push('scheduled-transfer missing secureStorage import');
  }
  if (!scheduledContent.includes('secureStorage.setItem(STORAGE_KEY')) {
    failures.push('scheduled-transfer missing secureStorage.setItem persistence');
  }

  return {
    name: 'Templates and scheduled transfers are encrypted at rest',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['automation storage paths use secure storage encryption flow']
      : failures,
  };
}

function checkPolicyDocument(content) {
  const required = [
    'Scheduled transfer execution requires fresh re-authentication',
    'Transfer templates must be encrypted at rest',
    'Scheduled transfer state must be encrypted at rest',
    'npm run verify:automation:engineer',
  ];
  const missing = required.filter((token) => !content.includes(token));

  return {
    name: 'Automation engineer policy is documented and actionable',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['policy documents reauth + encrypted-at-rest controls and verifier command']
      : missing.map((token) => `missing policy token: ${token}`),
  };
}

function checkWorkflowGates(ciContent, releaseContent) {
  const required = ['automation-engineer:', 'npm run verify:automation:engineer'];
  const failures = [];

  required.forEach((token) => {
    if (!ciContent.includes(token)) {
      failures.push(`ci.yml missing token: ${token}`);
    }
    if (!releaseContent.includes(token)) {
      failures.push(`release.yml missing token: ${token}`);
    }
  });

  return {
    name: 'CI/release workflows enforce automation engineer verification',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['automation engineer gate is wired in CI and release workflows']
      : failures,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Automation Engineer Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    '## Checks',
    ...report.checks.map((check) => `- ${check.pass ? '[PASS]' : '[FAIL]'} ${check.name}`),
    '',
  ];

  report.checks.forEach((check) => {
    lines.push(`### ${check.name}`);
    check.details.forEach((detail) => lines.push(`- ${detail}`));
    lines.push('');
  });

  lines.push('## Summary');
  lines.push(`- Overall: ${report.passed ? 'PASS' : 'FAIL'}`);
  lines.push('');

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const checks = [];
  const filesExist = checkFilesExist();
  checks.push(filesExist);

  if (filesExist.pass) {
    const policyContent = readFile(POLICY_PATH);
    const scheduledContent = readFile(SCHEDULED_TRANSFER_PATH);
    const templateContent = readFile(TEMPLATE_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkScheduledTransferReauth(scheduledContent));
    checks.push(checkEncryptedTemplateStorage(templateContent, scheduledContent));
    checks.push(checkPolicyDocument(policyContent));
    checks.push(checkWorkflowGates(ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const reportsDirectory = resolveReportsDirectory();

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `automation-engineer-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `automation-engineer-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-automation-engineer] JSON: ${jsonPath}`);
  console.log(`[verify-automation-engineer] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
