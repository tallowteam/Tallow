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
  { path: 'docs/governance/WEBRTC_CONDUIT_POLICY.md', label: 'Governance policy' },
  { path: 'scripts/verify-webrtc-conduit.js', label: 'Verifier script' },
  { path: 'tests/unit/network/webrtc-conduit.test.ts', label: 'Unit test suite' },
  { path: 'lib/webrtc/data-channel.ts', label: 'DataChannel manager' },
  { path: 'lib/webrtc/parallel-channels.ts', label: 'Parallel channels' },
  { path: 'lib/transfer/adaptive-bitrate.ts', label: 'Adaptive bitrate' },
  { path: 'lib/network/network-quality.ts', label: 'Network quality monitor' },
];

for (const file of requiredFiles) {
  check(
    `File exists: ${file.label}`,
    fileExists(file.path),
    toPosix(file.path)
  );
}

// --- 2. Backpressure handling ---

const dataChannelPath = path.join(ROOT, 'lib', 'webrtc', 'data-channel.ts');
if (fs.existsSync(dataChannelPath)) {
  const content = readFile(dataChannelPath);

  check(
    'DataChannel checks bufferedAmount',
    content.includes('bufferedAmount'),
    'bufferedAmount check in data-channel.ts'
  );

  check(
    'DataChannel uses bufferedamountlow event',
    content.includes('bufferedamountlow') || content.includes('onbufferedamountlow'),
    'bufferedamountlow event handler'
  );
}

// --- 3. Adaptive chunk sizing ---

const adaptivePath = path.join(ROOT, 'lib', 'transfer', 'adaptive-bitrate.ts');
if (fs.existsSync(adaptivePath)) {
  const content = readFile(adaptivePath);

  check(
    'Adaptive bitrate declares LAN bandwidth target',
    content.includes('BANDWIDTH_TARGET_LAN'),
    'BANDWIDTH_TARGET_LAN constant'
  );

  check(
    'Adaptive bitrate declares internet bandwidth target',
    content.includes('BANDWIDTH_TARGET_INTERNET'),
    'BANDWIDTH_TARGET_INTERNET constant'
  );
}

// --- 4. Parallel channels ---

const parallelPath = path.join(ROOT, 'lib', 'webrtc', 'parallel-channels.ts');
if (fs.existsSync(parallelPath)) {
  const content = readFile(parallelPath);

  check(
    'Parallel channels module exists and is non-empty',
    content.length > 100,
    'lib/webrtc/parallel-channels.ts'
  );
}

// --- 5. npm script registered ---

const pkgPath = path.join(ROOT, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(readFile(pkgPath));
  check(
    'npm script "verify:webrtc:conduit" registered',
    pkg.scripts && pkg.scripts['verify:webrtc:conduit'],
    'package.json scripts.verify:webrtc:conduit'
  );
}

// --- 6. CI workflow includes verifier ---

const ciPath = path.join(ROOT, '.github', 'workflows', 'ci.yml');
if (fs.existsSync(ciPath)) {
  const ciContent = readFile(ciPath);
  check(
    'CI workflow runs webrtc conduit verifier',
    ciContent.includes('npm run verify:webrtc:conduit'),
    '.github/workflows/ci.yml contains verify:webrtc:conduit'
  );
}

// --- 7. Release workflow includes verifier ---

const releasePath = path.join(ROOT, '.github', 'workflows', 'release.yml');
if (fs.existsSync(releasePath)) {
  const releaseContent = readFile(releasePath);
  check(
    'Release workflow runs webrtc conduit verifier',
    releaseContent.includes('npm run verify:webrtc:conduit'),
    '.github/workflows/release.yml contains verify:webrtc:conduit'
  );
}

// ============================================================================
// REPORT
// ============================================================================

const total = passed + failed;
const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
const overall = failed === 0 ? 'PASS' : 'FAIL';

console.log('\n====================================================');
console.log('  WEBRTC CONDUIT POLICY VERIFICATION (Agent 021)');
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

const jsonPath = path.join(reportsDir, `webrtc-conduit-verification-${ts}.json`);
const mdPath = path.join(reportsDir, `webrtc-conduit-verification-${ts}.md`);

fs.writeFileSync(jsonPath, JSON.stringify({
  agent: 'WEBRTC_CONDUIT (021)',
  timestamp: ts,
  overall,
  total,
  passed,
  failed,
  passRate: parseFloat(passRate),
  checks,
}, null, 2));

let md = `# WebRTC Conduit Verification\n\nGenerated: ${ts}\n\n## Checks\n`;
for (const c of checks) {
  md += `- [${c.status}] ${c.name}\n`;
  if (c.status === 'FAIL') {
    md += `  - Detail: ${c.detail}\n`;
  }
}
md += `\n## Summary\n- Overall: ${overall}\n- Pass Rate: ${passRate}%\n\n`;
fs.writeFileSync(mdPath, md);

console.error(`[verify-webrtc-conduit] JSON: ${jsonPath}`);
console.error(`[verify-webrtc-conduit] Markdown: ${mdPath}`);
process.exit(overall === 'PASS' ? 0 : 1);
