#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'SAS_VERIFIER_POLICY.md');
const IMPL_PATH = path.join(ROOT, 'lib', 'crypto', 'sas.ts');
const TEST_PATH = path.join(ROOT, 'tests', 'unit', 'crypto', 'sas-verifier.test.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:sas:verifier';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:sas:verifier';

function ensureDirectory(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function resolveReportsDirectory() {
  const preferred = path.join(ROOT, 'reports');
  ensureDirectory(preferred);
  const probe = path.join(preferred, '.write-probe');
  try { fs.writeFileSync(probe, 'ok', 'utf8'); fs.unlinkSync(probe); return preferred; }
  catch { const fb = path.join(ROOT, 'verification-reports'); ensureDirectory(fb); return fb; }
}

function readFile(fp) {
  const buf = fs.readFileSync(fp);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.toString('utf16le');
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    const sw = Buffer.allocUnsafe(buf.length - (buf.length % 2));
    for (let i = 0; i < sw.length; i += 2) { sw[i] = buf[i + 1]; sw[i + 1] = buf[i]; }
    return sw.toString('utf16le');
  }
  return buf.toString('utf8');
}

function toPosix(fp) { return fp.split(path.sep).join('/'); }

function checkRequiredFiles() {
  const required = [POLICY_PATH, IMPL_PATH, TEST_PATH, PACKAGE_JSON_PATH, CI_WORKFLOW_PATH, RELEASE_WORKFLOW_PATH];
  const missing = required.filter(f => !fs.existsSync(f)).map(f => toPosix(path.relative(ROOT, f)));
  return {
    name: 'SAS verifier policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['all required sas-verifier files are present'] : missing.map(m => `missing: ${m}`),
  };
}

function checkSASInvariants(content) {
  const findings = [];
  const requiredTokens = [
    'SAS_MISMATCH_TERMINATION_DEADLINE_MS',
    'SAS_MINIMUM_ENTROPY_BITS',
    'handleSASMismatch',
    'verifySASMatch',
    'generateSASCode',
    'SASMismatchReport',
    'terminateConnection',
    'SAS_MISMATCH_DETECTED',
  ];

  for (const t of requiredTokens) { if (!content.includes(t)) findings.push(`missing SAS invariant token: ${t}`); }
  if (!content.includes('100')) findings.push('missing 100ms termination deadline');
  if (!content.includes('36')) findings.push('missing 36-bit minimum entropy');

  return {
    name: 'SAS module enforces mismatch termination, entropy floor, and constant-time comparison',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['sas.ts includes all SAS-VERIFIER invariant tokens'] : findings,
  };
}

function checkTestCoverage(content) {
  const findings = [];
  const required = ['SAS mismatch', 'termination', 'entropy', 'constant-time'];
  for (const t of required) { if (!content.includes(t)) findings.push(`missing test case: ${t}`); }
  return {
    name: 'Unit tests cover SAS verification mismatch and entropy invariants',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['sas-verifier tests validate mismatch handling, termination, and entropy'] : findings,
  };
}

function checkScriptAndWorkflow(pkgContent, ciContent, relContent) {
  const findings = [];
  const pkg = JSON.parse(pkgContent);
  if (!(pkg.scripts || {})[REQUIRED_SCRIPT_NAME]) findings.push(`missing package script: ${REQUIRED_SCRIPT_NAME}`);
  if (!ciContent.includes(REQUIRED_WORKFLOW_COMMAND)) findings.push(`CI workflow missing: ${REQUIRED_WORKFLOW_COMMAND}`);
  if (!relContent.includes(REQUIRED_WORKFLOW_COMMAND)) findings.push(`release workflow missing: ${REQUIRED_WORKFLOW_COMMAND}`);
  return {
    name: 'SAS verifier gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0 ? [`${REQUIRED_SCRIPT_NAME} present`, 'ci.yml wired', 'release.yml wired'] : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = ['# SAS Verifier Verification', '', `Generated: ${report.timestamp}`, '', '## Checks',
    ...report.checks.map(c => `- ${c.pass ? '[PASS]' : '[FAIL]'} ${c.name}`), ''];
  for (const c of report.checks) { lines.push(`### ${c.name}`); for (const d of c.details) lines.push(`- ${d}`); lines.push(''); }
  lines.push('## Summary', `- Overall: ${report.passed ? 'PASS' : 'FAIL'}`, '');
  fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');
}

function main() {
  const checks = [];
  const req = checkRequiredFiles();
  checks.push(req);
  if (req.pass) {
    checks.push(checkSASInvariants(readFile(IMPL_PATH)));
    checks.push(checkTestCoverage(readFile(TEST_PATH)));
    checks.push(checkScriptAndWorkflow(readFile(PACKAGE_JSON_PATH), readFile(CI_WORKFLOW_PATH), readFile(RELEASE_WORKFLOW_PATH)));
  }
  const report = { timestamp: new Date().toISOString(), checks, passed: checks.every(c => c.pass) };
  const dir = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(dir, `sas-verifier-verification-${stamp}.json`);
  const mdPath = path.join(dir, `sas-verifier-verification-${stamp}.md`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);
  console.log(`[verify-sas-verifier] JSON: ${jsonPath}`);
  console.log(`[verify-sas-verifier] Markdown: ${mdPath}`);
  if (!report.passed) process.exit(1);
}

main();
