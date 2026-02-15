#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'RALPH_WIGGUM_AUTOMATION_POLICY.md');
const ORCHESTRATOR_PATH = path.join(ROOT, 'scripts', 'ralph-wiggum-orchestrator.js');
const RELEASE_SIGNOFF_PATH = path.join(ROOT, 'release-signoffs', 'v0.1.0.json');
const TEMPLATE_SIGNOFF_PATH = path.join(ROOT, 'release-signoffs', 'TEMPLATE.json');
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function checkFilesExist() {
  const required = [
    POLICY_PATH,
    ORCHESTRATOR_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/'));

  return {
    name: 'Ralph orchestrator baseline files exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['policy, orchestrator script, and workflow files found']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkOvernightCircuitProgressDone(orchestratorContent) {
  const required = [
    'DEFAULT_ITERATIONS',
    'CIRCUIT_BREAKER_THRESHOLD = 3',
    'PROGRESS_INTERVAL = 10',
    'if (iteration % PROGRESS_INTERVAL === 0)',
    '<promise>DONE</promise>',
  ];
  const missing = required.filter((token) => !orchestratorContent.includes(token));

  return {
    name: 'Overnight loop, circuit breaker, progress cadence, and DONE output are implemented',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['orchestrator encodes overnight run loop semantics with progress and circuit breaker controls']
      : missing.map((token) => `missing token: ${token}`),
  };
}

function checkCipherSignoffGuard(orchestratorContent) {
  const required = [
    "const CIPHER_AGENT_ID = '002'",
    'hasCipherSignoff',
    'blocked crypto-modifying task',
    'allowCryptoTasks && hasSignoff',
  ];
  const missing = required.filter((token) => !orchestratorContent.includes(token));

  return {
    name: 'Crypto modifications are blocked without CIPHER sign-off',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['orchestrator enforces CIPHER sign-off check for crypto-modifying tasks']
      : missing.map((token) => `missing token: ${token}`),
  };
}

function checkSignoffArtifacts() {
  const candidates = [RELEASE_SIGNOFF_PATH, TEMPLATE_SIGNOFF_PATH].filter((filePath) => fs.existsSync(filePath));
  if (candidates.length === 0) {
    return {
      name: 'Sign-off artifacts include CIPHER approver',
      pass: false,
      details: ['missing release-signoffs/v0.1.0.json and release-signoffs/TEMPLATE.json'],
    };
  }

  let found = false;
  const scanned = [];
  for (const candidate of candidates) {
    try {
      const parsed = readJson(candidate);
      const approvals = Array.isArray(parsed.approvals)
        ? parsed.approvals
        : Array.isArray(parsed.signoffs)
          ? parsed.signoffs
          : [];
      const hasCipher = approvals.some((entry) => {
        if (!entry || typeof entry !== 'object') {
          return false;
        }
        const id = String(entry.approverId || entry.approver || '');
        const status = String(entry.status || '').toLowerCase();
        const hasSignatureTimestamp = Boolean(entry.signedAt || entry.approvedAt);
        return id === '002' && (status === 'approved' || status === 'signed' || hasSignatureTimestamp);
      });
      scanned.push(`${path.relative(ROOT, candidate).replace(/\\/g, '/')} => ${hasCipher ? 'cipher-approved' : 'no-cipher-approval'}`);
      if (hasCipher) {
        found = true;
      }
    } catch (error) {
      scanned.push(`${path.relative(ROOT, candidate).replace(/\\/g, '/')} => parse-error (${error instanceof Error ? error.message : String(error)})`);
    }
  }

  return {
    name: 'Sign-off artifacts include CIPHER approver',
    pass: found,
    details: found ? scanned : [...scanned, 'no artifact contained an approved/signed CIPHER entry (approverId 002)'],
  };
}

function checkPolicyDocument(policyContent) {
  const required = [
    'Circuit breaker triggers after 3 consecutive failures',
    'Progress is reported every 10 iterations',
    'Completion emits `<promise>DONE</promise>`',
    'Crypto-modifying operations are denied unless CIPHER sign-off evidence is present',
    'npm run verify:ralph:wiggum',
  ];
  const missing = required.filter((token) => !policyContent.includes(token));

  return {
    name: 'Ralph policy is documented and actionable',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['policy captures runtime constraints and verifier command']
      : missing.map((token) => `missing policy token: ${token}`),
  };
}

function checkWorkflowGates(ciContent, releaseContent) {
  const required = ['ralph-wiggum:', 'npm run verify:ralph:wiggum'];
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
    name: 'CI/release workflows enforce Ralph verifier gate',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['Ralph gate is wired in CI and release workflows']
      : failures,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Ralph Wiggum Verification',
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
    const orchestratorContent = readFile(ORCHESTRATOR_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkOvernightCircuitProgressDone(orchestratorContent));
    checks.push(checkCipherSignoffGuard(orchestratorContent));
    checks.push(checkSignoffArtifacts());
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
  const jsonPath = path.join(reportsDirectory, `ralph-wiggum-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `ralph-wiggum-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-ralph-wiggum] JSON: ${jsonPath}`);
  console.log(`[verify-ralph-wiggum] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
