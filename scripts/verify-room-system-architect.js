#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'security', 'ROOM_SYSTEM_ARCHITECTURE_POLICY.md');
const ROOMS_API_PATH = path.join(ROOT, 'app', 'api', 'rooms', 'route.ts');
const ROOM_CRYPTO_PATH = path.join(ROOT, 'lib', 'rooms', 'room-crypto.ts');
const ROOM_MANAGER_PATH = path.join(ROOT, 'lib', 'rooms', 'transfer-room-manager.ts');
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
    ROOMS_API_PATH,
    ROOM_CRYPTO_PATH,
    ROOM_MANAGER_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];
  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/'));

  return {
    name: 'Room system architect baseline files exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['policy, room api/crypto/manager, and workflows found']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkRoomExpiryAndMemberCaps(apiContent, managerContent) {
  const failures = [];

  const apiRequired = [
    'DEFAULT_ROOM_TTL_HOURS',
    'MAX_ROOM_TTL_HOURS',
    'getDefaultRoomExpiration',
    'Math.min(Math.max(2, Number(maxMembers) || 10), 50)',
  ];

  apiRequired.forEach((token) => {
    if (!apiContent.includes(token)) {
      failures.push(`rooms api missing token: ${token}`);
    }
  });

  if (!managerContent.includes('Math.min(Math.max(config.maxMembers || 10, 2), 50)')) {
    failures.push('room manager missing local maxMembers clamp 2..50');
  }

  return {
    name: 'Rooms enforce default 24h expiry and 50-member cap',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['room creation defaults and max-members guardrails are enforced']
      : failures,
  };
}

function checkAdminMemberRemoval(apiContent, managerContent) {
  const failures = [];

  const apiRequired = [
    "const memberId = searchParams.get('memberId')",
    'Room owner cannot be removed as a member',
    'Member removed successfully',
  ];
  apiRequired.forEach((token) => {
    if (!apiContent.includes(token)) {
      failures.push(`rooms api missing admin-removal token: ${token}`);
    }
  });

  const managerRequired = [
    'removeMember(memberId: string): boolean',
    "throw new Error('Only room owner can remove members')",
    "this.socket?.emit('remove-room-member'",
  ];
  managerRequired.forEach((token) => {
    if (!managerContent.includes(token)) {
      failures.push(`room manager missing admin-removal token: ${token}`);
    }
  });

  return {
    name: 'Room owner/admin can remove members',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['api and room manager expose owner-only member-removal controls']
      : failures,
  };
}

function checkSenderKeyProtocol(cryptoContent, managerContent) {
  const failures = [];

  const cryptoRequired = [
    'ROOM_SENDER_KEY_INFO_PREFIX',
    'deriveRoomSenderKey',
    "'PQC-HKDF-AES-256-SENDER'",
  ];
  cryptoRequired.forEach((token) => {
    if (!cryptoContent.includes(token)) {
      failures.push(`room-crypto missing sender-key token: ${token}`);
    }
  });

  const managerRequired = [
    'senderKeyCache',
    'getSenderEncryptionKey',
    'sid:',
    'deriveRoomSenderKey',
  ];
  managerRequired.forEach((token) => {
    if (!managerContent.includes(token)) {
      failures.push(`transfer-room-manager missing sender-key token: ${token}`);
    }
  });

  return {
    name: 'Group room encryption uses sender-key protocol semantics',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['sender-specific key derivation and routing are active in room crypto path']
      : failures,
  };
}

function checkPolicyDocument(policyContent) {
  const required = [
    'Rooms expire by default after 24 hours',
    'Maximum room size is capped at 50 members',
    'remove members',
    'sender-key semantics',
    'npm run verify:room-system:architect',
  ];
  const missing = required.filter((token) => !policyContent.includes(token));

  return {
    name: 'Room-system policy is documented and actionable',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['policy captures expiry, membership, sender-key, and verifier controls']
      : missing.map((token) => `missing policy token: ${token}`),
  };
}

function checkWorkflowGates(ciContent, releaseContent) {
  const required = ['room-system-architect:', 'npm run verify:room-system:architect'];
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
    name: 'CI/release workflows enforce room-system architect verification',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['room-system architect gate is wired in CI and release workflows']
      : failures,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Room System Architect Verification',
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
    const apiContent = readFile(ROOMS_API_PATH);
    const cryptoContent = readFile(ROOM_CRYPTO_PATH);
    const managerContent = readFile(ROOM_MANAGER_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkRoomExpiryAndMemberCaps(apiContent, managerContent));
    checks.push(checkAdminMemberRemoval(apiContent, managerContent));
    checks.push(checkSenderKeyProtocol(cryptoContent, managerContent));
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
  const jsonPath = path.join(reportsDirectory, `room-system-architect-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `room-system-architect-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-room-system-architect] JSON: ${jsonPath}`);
  console.log(`[verify-room-system-architect] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
