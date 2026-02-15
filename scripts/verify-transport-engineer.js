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
  { path: 'docs/governance/TRANSPORT_ENGINEER_POLICY.md', label: 'Governance policy' },
  { path: 'scripts/verify-transport-engineer.js', label: 'Verifier script' },
  { path: 'tests/unit/network/transport-engineer.test.ts', label: 'Unit test suite' },
  { path: 'lib/transport/transport-selector.ts', label: 'Transport selector' },
  { path: 'lib/transport/webtransport.ts', label: 'WebTransport client' },
  { path: 'lib/transport/index.ts', label: 'Transport barrel exports' },
];

for (const file of requiredFiles) {
  check(`File exists: ${file.label}`, fileExists(file.path), toPosix(file.path));
}

// --- 2. Transport selector defines priority chain ---

const selectorPath = path.join(ROOT, 'lib', 'transport', 'transport-selector.ts');
if (fs.existsSync(selectorPath)) {
  const content = readFile(selectorPath);

  check(
    'Transport selector references WebTransport',
    content.includes('WebTransport') || content.includes('webtransport'),
    'WebTransport in transport-selector.ts'
  );

  check(
    'Transport selector references WebRTC',
    content.includes('WebRTC') || content.includes('webrtc') || content.includes('DataChannel'),
    'WebRTC in transport-selector.ts'
  );

  check(
    'Transport selector references WebSocket',
    content.includes('WebSocket') || content.includes('websocket'),
    'WebSocket in transport-selector.ts'
  );

  check(
    'Transport selector has fallback logic',
    content.includes('fallback') || content.includes('priority') || content.includes('selectTransport'),
    'Fallback/priority logic in transport selector'
  );
}

// --- 3. WebTransport module exists ---

const wtPath = path.join(ROOT, 'lib', 'transport', 'webtransport.ts');
if (fs.existsSync(wtPath)) {
  const content = readFile(wtPath);

  check(
    'WebTransport module has feature detection',
    content.includes('WebTransport') || content.includes('typeof'),
    'Feature detection for WebTransport'
  );
}

// --- 4. Privacy transport ---

check(
  'Privacy WebRTC module exists',
  fileExists('lib/transport/private-webrtc.ts'),
  'lib/transport/private-webrtc.ts'
);

check(
  'Obfuscation module exists',
  fileExists('lib/transport/obfuscation.ts'),
  'lib/transport/obfuscation.ts'
);

// --- 5. npm script registered ---

const pkgPath = path.join(ROOT, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(readFile(pkgPath));
  check(
    'npm script "verify:transport:engineer" registered',
    pkg.scripts && pkg.scripts['verify:transport:engineer'],
    'package.json scripts.verify:transport:engineer'
  );
}

// --- 6. CI workflow includes verifier ---

const ciPath = path.join(ROOT, '.github', 'workflows', 'ci.yml');
if (fs.existsSync(ciPath)) {
  const ciContent = readFile(ciPath);
  check(
    'CI workflow runs transport engineer verifier',
    ciContent.includes('npm run verify:transport:engineer'),
    '.github/workflows/ci.yml contains verify:transport:engineer'
  );
}

// --- 7. Release workflow includes verifier ---

const releasePath = path.join(ROOT, '.github', 'workflows', 'release.yml');
if (fs.existsSync(releasePath)) {
  const releaseContent = readFile(releasePath);
  check(
    'Release workflow runs transport engineer verifier',
    releaseContent.includes('npm run verify:transport:engineer'),
    '.github/workflows/release.yml contains verify:transport:engineer'
  );
}

// ============================================================================
// REPORT
// ============================================================================

const total = passed + failed;
const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
const overall = failed === 0 ? 'PASS' : 'FAIL';

console.log('\n====================================================');
console.log('  TRANSPORT ENGINEER POLICY VERIFICATION (Agent 025)');
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

const jsonPath = path.join(reportsDir, `transport-engineer-verification-${ts}.json`);
const mdPath = path.join(reportsDir, `transport-engineer-verification-${ts}.md`);

fs.writeFileSync(jsonPath, JSON.stringify({
  agent: 'TRANSPORT_ENGINEER (025)',
  timestamp: ts,
  overall,
  total,
  passed,
  failed,
  passRate: parseFloat(passRate),
  checks,
}, null, 2));

let md = `# Transport Engineer Verification\n\nGenerated: ${ts}\n\n## Checks\n`;
for (const c of checks) {
  md += `- [${c.status}] ${c.name}\n`;
  if (c.status === 'FAIL') {
    md += `  - Detail: ${c.detail}\n`;
  }
}
md += `\n## Summary\n- Overall: ${overall}\n- Pass Rate: ${passRate}%\n\n`;
fs.writeFileSync(mdPath, md);

console.error(`[verify-transport-engineer] JSON: ${jsonPath}`);
console.error(`[verify-transport-engineer] Markdown: ${mdPath}`);
process.exit(overall === 'PASS' ? 0 : 1);
