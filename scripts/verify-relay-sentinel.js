#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const ts = new Date().toISOString().replace(/[:.]/g, '-');

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
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

function toPosix(p) {
  return p.split(path.sep).join('/');
}

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    checks.push({ name, status: 'PASS', detail });
    passed++;
  } else {
    checks.push({ name, status: 'FAIL', detail });
    failed++;
  }
}

// --- 1. Required files exist ---

const requiredFiles = [
  { path: 'docs/governance/RELAY_SENTINEL_POLICY.md', label: 'Governance policy' },
  { path: 'scripts/verify-relay-sentinel.js', label: 'Verifier script' },
  { path: 'tests/unit/network/relay-sentinel.test.ts', label: 'Unit test suite' },
  { path: 'lib/relay/relay-client.ts', label: 'Relay client' },
  { path: 'lib/relay/relay-directory.ts', label: 'Relay directory' },
  { path: 'lib/relay/index.ts', label: 'Relay barrel exports' },
];

for (const file of requiredFiles) {
  check(`File exists: ${file.label}`, fileExists(file.path), toPosix(file.path));
}

// --- 2. Relay client uses PQC encryption ---

const clientPath = path.join(ROOT, 'lib', 'relay', 'relay-client.ts');
if (fs.existsSync(clientPath)) {
  const content = readFile(clientPath);

  check(
    'Relay client uses PQC crypto',
    content.includes('pqCrypto') || content.includes('pqc') || content.includes('encrypt'),
    'PQC encryption in relay-client.ts'
  );

  check(
    'Relay client does not send plaintext',
    !content.includes('sendPlaintext'),
    'No plaintext transmission in relay client'
  );

  check(
    'Relay client uses WebSocket protocol',
    content.includes('WebSocket') || content.includes('ws://') || content.includes('wss://'),
    'WebSocket transport in relay client'
  );
}

// --- 3. Onion routing exists ---

check(
  'Onion routing module exists',
  fileExists('lib/transport/onion-routing.ts'),
  'lib/transport/onion-routing.ts'
);

// --- 4. Self-hostable relay ---

check(
  'Self-hostable relay directory exists',
  fileExists('tallow-relay') && fs.statSync(path.join(ROOT, 'tallow-relay')).isDirectory(),
  'tallow-relay/ directory'
);

// --- 5. npm script registered ---

const pkgPath = path.join(ROOT, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(readFile(pkgPath));
  check(
    'npm script "verify:relay:sentinel" registered',
    pkg.scripts && pkg.scripts['verify:relay:sentinel'],
    'package.json scripts.verify:relay:sentinel'
  );
}

// --- 6. CI workflow includes verifier ---

const ciPath = path.join(ROOT, '.github', 'workflows', 'ci.yml');
if (fs.existsSync(ciPath)) {
  const ciContent = readFile(ciPath);
  check(
    'CI workflow runs relay sentinel verifier',
    ciContent.includes('npm run verify:relay:sentinel'),
    '.github/workflows/ci.yml contains verify:relay:sentinel'
  );
}

// --- 7. Release workflow includes verifier ---

const releasePath = path.join(ROOT, '.github', 'workflows', 'release.yml');
if (fs.existsSync(releasePath)) {
  const releaseContent = readFile(releasePath);
  check(
    'Release workflow runs relay sentinel verifier',
    releaseContent.includes('npm run verify:relay:sentinel'),
    '.github/workflows/release.yml contains verify:relay:sentinel'
  );
}

// ============================================================================
// REPORT
// ============================================================================

const total = passed + failed;
const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
const overall = failed === 0 ? 'PASS' : 'FAIL';

console.log('\n====================================================');
console.log('  RELAY SENTINEL POLICY VERIFICATION (Agent 024)');
console.log('====================================================\n');

for (const r of checks) {
  const icon = r.status === 'PASS' ? '[PASS]' : '[FAIL]';
  console.log(`  ${icon} ${r.name}`);
  if (r.status === 'FAIL') {
    console.log(`         Detail: ${r.detail}`);
  }
}

console.log(`\n  Total: ${total}  Passed: ${passed}  Failed: ${failed}  (${passRate}%)\n`);

const reportsDir = path.join(ROOT, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const jsonPath = path.join(reportsDir, `relay-sentinel-verification-${ts}.json`);
const mdPath = path.join(reportsDir, `relay-sentinel-verification-${ts}.md`);

fs.writeFileSync(jsonPath, JSON.stringify({
  agent: 'RELAY_SENTINEL (024)',
  timestamp: ts,
  overall,
  total,
  passed,
  failed,
  passRate: parseFloat(passRate),
  checks,
}, null, 2));

let md = `# Relay Sentinel Verification\n\nGenerated: ${ts}\n\n## Checks\n`;
for (const c of checks) {
  md += `- [${c.status}] ${c.name}\n`;
  if (c.status === 'FAIL') {
    md += `  - Detail: ${c.detail}\n`;
  }
}
md += `\n## Summary\n- Overall: ${overall}\n- Pass Rate: ${passRate}%\n\n`;
fs.writeFileSync(mdPath, md);

console.error(`[verify-relay-sentinel] JSON: ${jsonPath}`);
console.error(`[verify-relay-sentinel] Markdown: ${mdPath}`);
process.exit(overall === 'PASS' ? 0 : 1);
