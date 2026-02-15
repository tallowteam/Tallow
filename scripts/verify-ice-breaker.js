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
  { path: 'docs/governance/ICE_BREAKER_POLICY.md', label: 'Governance policy' },
  { path: 'scripts/verify-ice-breaker.js', label: 'Verifier script' },
  { path: 'tests/unit/network/ice-breaker.test.ts', label: 'Unit test suite' },
  { path: 'lib/webrtc/ice.ts', label: 'ICE management' },
  { path: 'lib/network/nat-detection.ts', label: 'NAT detection' },
  { path: 'lib/network/connection-strategy.ts', label: 'Connection strategy' },
  { path: 'lib/network/turn-config.ts', label: 'TURN configuration' },
];

for (const file of requiredFiles) {
  check(`File exists: ${file.label}`, fileExists(file.path), toPosix(file.path));
}

// --- 2. NAT detection defines required types ---

const natPath = path.join(ROOT, 'lib', 'network', 'nat-detection.ts');
if (fs.existsSync(natPath)) {
  const content = readFile(natPath);

  check(
    'NAT detection exports NATType',
    content.includes('NATType'),
    'NATType type exported from nat-detection.ts'
  );

  check(
    'NAT detection handles SYMMETRIC type',
    content.includes('SYMMETRIC'),
    'SYMMETRIC NAT type defined'
  );

  check(
    'NAT detection handles BLOCKED type',
    content.includes('BLOCKED'),
    'BLOCKED NAT type defined'
  );

  check(
    'NAT detection exports detectNATType function',
    content.includes('detectNATType'),
    'detectNATType function'
  );
}

// --- 3. Connection strategy handles symmetric+symmetric ---

const strategyPath = path.join(ROOT, 'lib', 'network', 'connection-strategy.ts');
if (fs.existsSync(strategyPath)) {
  const content = readFile(strategyPath);

  check(
    'Connection strategy exports getConnectionStrategy',
    content.includes('getConnectionStrategy'),
    'getConnectionStrategy function'
  );

  check(
    'Connection strategy references TURN_ONLY',
    content.includes('TURN_ONLY') || content.includes('turn_only') || content.includes('turnOnly'),
    'TURN_ONLY strategy for symmetric+symmetric'
  );
}

// --- 4. ICE module references NAT type ---

const icePath = path.join(ROOT, 'lib', 'webrtc', 'ice.ts');
if (fs.existsSync(icePath)) {
  const content = readFile(icePath);

  check(
    'ICE module imports NATType',
    content.includes('NATType'),
    'NATType referenced in ice.ts'
  );

  check(
    'ICE module configures STUN servers',
    content.includes('stun') || content.includes('STUN'),
    'STUN server configuration in ice.ts'
  );

  check(
    'ICE module configures TURN servers',
    content.includes('turn') || content.includes('TURN'),
    'TURN server configuration in ice.ts'
  );
}

// --- 5. npm script registered ---

const pkgPath = path.join(ROOT, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(readFile(pkgPath));
  check(
    'npm script "verify:ice:breaker" registered',
    pkg.scripts && pkg.scripts['verify:ice:breaker'],
    'package.json scripts.verify:ice:breaker'
  );
}

// --- 6. CI workflow includes verifier ---

const ciPath = path.join(ROOT, '.github', 'workflows', 'ci.yml');
if (fs.existsSync(ciPath)) {
  const ciContent = readFile(ciPath);
  check(
    'CI workflow runs ICE breaker verifier',
    ciContent.includes('npm run verify:ice:breaker'),
    '.github/workflows/ci.yml contains verify:ice:breaker'
  );
}

// --- 7. Release workflow includes verifier ---

const releasePath = path.join(ROOT, '.github', 'workflows', 'release.yml');
if (fs.existsSync(releasePath)) {
  const releaseContent = readFile(releasePath);
  check(
    'Release workflow runs ICE breaker verifier',
    releaseContent.includes('npm run verify:ice:breaker'),
    '.github/workflows/release.yml contains verify:ice:breaker'
  );
}

// ============================================================================
// REPORT
// ============================================================================

const total = passed + failed;
const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
const overall = failed === 0 ? 'PASS' : 'FAIL';

console.log('\n====================================================');
console.log('  ICE BREAKER POLICY VERIFICATION (Agent 022)');
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

const jsonPath = path.join(reportsDir, `ice-breaker-verification-${ts}.json`);
const mdPath = path.join(reportsDir, `ice-breaker-verification-${ts}.md`);

fs.writeFileSync(jsonPath, JSON.stringify({
  agent: 'ICE_BREAKER (022)',
  timestamp: ts,
  overall,
  total,
  passed,
  failed,
  passRate: parseFloat(passRate),
  checks,
}, null, 2));

let md = `# ICE Breaker Verification\n\nGenerated: ${ts}\n\n## Checks\n`;
for (const c of checks) {
  md += `- [${c.status}] ${c.name}\n`;
  if (c.status === 'FAIL') {
    md += `  - Detail: ${c.detail}\n`;
  }
}
md += `\n## Summary\n- Overall: ${overall}\n- Pass Rate: ${passRate}%\n\n`;
fs.writeFileSync(mdPath, md);

console.error(`[verify-ice-breaker] JSON: ${jsonPath}`);
console.error(`[verify-ice-breaker] Markdown: ${mdPath}`);
process.exit(overall === 'PASS' ? 0 : 1);
