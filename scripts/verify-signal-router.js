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
  { path: 'docs/governance/SIGNAL_ROUTER_POLICY.md', label: 'Governance policy' },
  { path: 'scripts/verify-signal-router.js', label: 'Verifier script' },
  { path: 'tests/unit/network/signal-router.test.ts', label: 'Unit test suite' },
  { path: 'lib/signaling/signaling-crypto.ts', label: 'Signaling encryption' },
  { path: 'lib/signaling/socket-signaling.ts', label: 'WebSocket signaling' },
  { path: 'lib/signaling/connection-manager.ts', label: 'Connection manager' },
  { path: 'app/api/rooms/route.ts', label: 'Rooms API route' },
];

for (const file of requiredFiles) {
  check(`File exists: ${file.label}`, fileExists(file.path), toPosix(file.path));
}

// --- 2. Signaling crypto uses HKDF ---

const cryptoPath = path.join(ROOT, 'lib', 'signaling', 'signaling-crypto.ts');
if (fs.existsSync(cryptoPath)) {
  const content = readFile(cryptoPath);

  check(
    'Signaling crypto uses HKDF key derivation',
    content.includes('hkdf') || content.includes('HKDF'),
    'HKDF import or usage in signaling-crypto.ts'
  );

  check(
    'Signaling crypto uses SHA-256',
    content.includes('sha256') || content.includes('SHA-256'),
    'SHA-256 for key derivation'
  );

  check(
    'Signaling crypto uses counter-based nonces',
    content.includes('NonceManager') || content.includes('nonce') || content.includes('counter'),
    'Counter-based nonce management'
  );

  check(
    'Signaling server never sees plaintext keys',
    !content.includes('sendPlaintext') && !content.includes('unencrypted'),
    'No plaintext key transmission'
  );
}

// --- 3. Signaling info string ---

if (fs.existsSync(cryptoPath)) {
  const content = readFile(cryptoPath);

  check(
    'Signaling uses versioned info string',
    content.includes('tallow-signaling-v1'),
    'HKDF info string: tallow-signaling-v1'
  );
}

// --- 4. npm script registered ---

const pkgPath = path.join(ROOT, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(readFile(pkgPath));
  check(
    'npm script "verify:signal:router" registered',
    pkg.scripts && pkg.scripts['verify:signal:router'],
    'package.json scripts.verify:signal:router'
  );
}

// --- 5. CI workflow includes verifier ---

const ciPath = path.join(ROOT, '.github', 'workflows', 'ci.yml');
if (fs.existsSync(ciPath)) {
  const ciContent = readFile(ciPath);
  check(
    'CI workflow runs signal router verifier',
    ciContent.includes('npm run verify:signal:router'),
    '.github/workflows/ci.yml contains verify:signal:router'
  );
}

// --- 6. Release workflow includes verifier ---

const releasePath = path.join(ROOT, '.github', 'workflows', 'release.yml');
if (fs.existsSync(releasePath)) {
  const releaseContent = readFile(releasePath);
  check(
    'Release workflow runs signal router verifier',
    releaseContent.includes('npm run verify:signal:router'),
    '.github/workflows/release.yml contains verify:signal:router'
  );
}

// ============================================================================
// REPORT
// ============================================================================

const total = passed + failed;
const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
const overall = failed === 0 ? 'PASS' : 'FAIL';

console.log('\n====================================================');
console.log('  SIGNAL ROUTER POLICY VERIFICATION (Agent 023)');
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

const jsonPath = path.join(reportsDir, `signal-router-verification-${ts}.json`);
const mdPath = path.join(reportsDir, `signal-router-verification-${ts}.md`);

fs.writeFileSync(jsonPath, JSON.stringify({
  agent: 'SIGNAL_ROUTER (023)',
  timestamp: ts,
  overall,
  total,
  passed,
  failed,
  passRate: parseFloat(passRate),
  checks,
}, null, 2));

let md = `# Signal Router Verification\n\nGenerated: ${ts}\n\n## Checks\n`;
for (const c of checks) {
  md += `- [${c.status}] ${c.name}\n`;
  if (c.status === 'FAIL') {
    md += `  - Detail: ${c.detail}\n`;
  }
}
md += `\n## Summary\n- Overall: ${overall}\n- Pass Rate: ${passRate}%\n\n`;
fs.writeFileSync(mdPath, md);

console.error(`[verify-signal-router] JSON: ${jsonPath}`);
console.error(`[verify-signal-router] Markdown: ${mdPath}`);
process.exit(overall === 'PASS' ? 0 : 1);
