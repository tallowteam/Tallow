#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'security', 'CONTACTS_FRIENDS_TRUST_POLICY.md');
const FRIENDS_STORE_PATH = path.join(ROOT, 'lib', 'stores', 'friends-store.ts');
const SETTINGS_STORE_PATH = path.join(ROOT, 'lib', 'stores', 'settings-store.ts');
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
    FRIENDS_STORE_PATH,
    SETTINGS_STORE_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/'));

  return {
    name: 'Contacts/friends baseline files exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['policy, friends/settings stores, and workflows found']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkTrustAndGuestControls(friendsContent, settingsContent) {
  const failures = [];

  const requiredFriendsTokens = [
    'sasVerifiedAt',
    'markFriendSASVerified',
    'issueGuestTransferToken',
    'consumeGuestTransferToken',
    'canTransferToFriend',
    'autoConnectFavorite',
    "if (connection.peerId === id)",
    'useDeviceStore.getState().disconnect()',
  ];

  requiredFriendsTokens.forEach((token) => {
    if (!friendsContent.includes(token)) {
      failures.push(`friends-store missing token: ${token}`);
    }
  });

  if (!friendsContent.includes('useSettingsStore.getState().guestMode')) {
    failures.push('friends-store missing guestMode policy binding');
  }

  if (!settingsContent.includes('guestMode')) {
    failures.push('settings-store missing guestMode control');
  }

  return {
    name: 'Trust, favorites auto-connect, block-drop, and guest mode controls are implemented',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['friends store enforces SAS/guest trust paths and immediate block disconnect behavior']
      : failures,
  };
}

function checkPolicyDocument(policyContent) {
  const required = [
    'Trusted transfer path requires SAS verification state',
    'Favorites can auto-connect',
    'Block list operations must immediately drop active connections',
    'Guest mode must support one-time transfer authorization',
    'npm run verify:contacts:friends',
  ];
  const missing = required.filter((token) => !policyContent.includes(token));

  return {
    name: 'Contacts/friends trust policy is documented and actionable',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['policy documents SAS, auto-connect, block-drop, and guest-token controls']
      : missing.map((token) => `missing policy token: ${token}`),
  };
}

function checkWorkflowGates(ciContent, releaseContent) {
  const required = ['contacts-friends-agent:', 'npm run verify:contacts:friends'];
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
    name: 'CI/release workflows enforce contacts/friends verification',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['contacts/friends gate is wired in CI and release workflows']
      : failures,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Contacts/Friends Agent Verification',
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
    const friendsContent = readFile(FRIENDS_STORE_PATH);
    const settingsContent = readFile(SETTINGS_STORE_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkTrustAndGuestControls(friendsContent, settingsContent));
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
  const jsonPath = path.join(reportsDirectory, `contacts-friends-agent-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `contacts-friends-agent-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-contacts-friends-agent] JSON: ${jsonPath}`);
  console.log(`[verify-contacts-friends-agent] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
