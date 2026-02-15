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
  { path: 'docs/governance/BANDWIDTH_ANALYST_POLICY.md', label: 'Governance policy' },
  { path: 'scripts/verify-bandwidth-analyst.js', label: 'Verifier script' },
  { path: 'tests/unit/network/bandwidth-analyst.test.ts', label: 'Unit test suite' },
  { path: 'lib/network/bandwidth-monitor.ts', label: 'Bandwidth monitor' },
  { path: 'lib/network/network-quality.ts', label: 'Network quality' },
  { path: 'lib/transfer/adaptive-bitrate.ts', label: 'Adaptive bitrate' },
];

for (const file of requiredFiles) {
  check(`File exists: ${file.label}`, fileExists(file.path), toPosix(file.path));
}

// --- 2. Bandwidth monitor has quality levels ---

const monitorPath = path.join(ROOT, 'lib', 'network', 'bandwidth-monitor.ts');
if (fs.existsSync(monitorPath)) {
  const content = readFile(monitorPath);

  check(
    'Bandwidth monitor defines quality levels',
    content.includes('QualityLevel') || content.includes('qualityLevel'),
    'QualityLevel type in bandwidth-monitor.ts'
  );

  check(
    'Bandwidth monitor has auto-downgrade logic',
    content.includes('downgrade') || content.includes('Downgrade'),
    'Auto-downgrade mechanism'
  );

  check(
    'Bandwidth monitor has continuous sampling',
    content.includes('interval') || content.includes('setInterval') || content.includes('sample'),
    'Continuous sampling mechanism'
  );

  check(
    'Bandwidth monitor exports BandwidthMonitor class',
    content.includes('BandwidthMonitor'),
    'BandwidthMonitor class export'
  );
}

// --- 3. Network quality monitoring ---

const qualityPath = path.join(ROOT, 'lib', 'network', 'network-quality.ts');
if (fs.existsSync(qualityPath)) {
  const content = readFile(qualityPath);

  check(
    'Network quality monitors RTT',
    content.includes('RTT') || content.includes('rtt') || content.includes('roundTrip'),
    'RTT monitoring in network-quality.ts'
  );

  check(
    'Network quality monitors packet loss',
    content.includes('packetLoss') || content.includes('PacketLoss') || content.includes('loss'),
    'Packet loss monitoring'
  );
}

// --- 4. npm script registered ---

const pkgPath = path.join(ROOT, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(readFile(pkgPath));
  check(
    'npm script "verify:bandwidth:analyst" registered',
    pkg.scripts && pkg.scripts['verify:bandwidth:analyst'],
    'package.json scripts.verify:bandwidth:analyst'
  );
}

// --- 5. CI workflow includes verifier ---

const ciPath = path.join(ROOT, '.github', 'workflows', 'ci.yml');
if (fs.existsSync(ciPath)) {
  const ciContent = readFile(ciPath);
  check(
    'CI workflow runs bandwidth analyst verifier',
    ciContent.includes('npm run verify:bandwidth:analyst'),
    '.github/workflows/ci.yml contains verify:bandwidth:analyst'
  );
}

// --- 6. Release workflow includes verifier ---

const releasePath = path.join(ROOT, '.github', 'workflows', 'release.yml');
if (fs.existsSync(releasePath)) {
  const releaseContent = readFile(releasePath);
  check(
    'Release workflow runs bandwidth analyst verifier',
    releaseContent.includes('npm run verify:bandwidth:analyst'),
    '.github/workflows/release.yml contains verify:bandwidth:analyst'
  );
}

// ============================================================================
// REPORT
// ============================================================================

const total = passed + failed;
const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
const overall = failed === 0 ? 'PASS' : 'FAIL';

console.log('\n====================================================');
console.log('  BANDWIDTH ANALYST POLICY VERIFICATION (Agent 027)');
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

const jsonPath = path.join(reportsDir, `bandwidth-analyst-verification-${ts}.json`);
const mdPath = path.join(reportsDir, `bandwidth-analyst-verification-${ts}.md`);

fs.writeFileSync(jsonPath, JSON.stringify({
  agent: 'BANDWIDTH_ANALYST (027)',
  timestamp: ts,
  overall,
  total,
  passed,
  failed,
  passRate: parseFloat(passRate),
  checks,
}, null, 2));

let md = `# Bandwidth Analyst Verification\n\nGenerated: ${ts}\n\n## Checks\n`;
for (const c of checks) {
  md += `- [${c.status}] ${c.name}\n`;
  if (c.status === 'FAIL') {
    md += `  - Detail: ${c.detail}\n`;
  }
}
md += `\n## Summary\n- Overall: ${overall}\n- Pass Rate: ${passRate}%\n\n`;
fs.writeFileSync(mdPath, md);

console.error(`[verify-bandwidth-analyst] JSON: ${jsonPath}`);
console.error(`[verify-bandwidth-analyst] Markdown: ${mdPath}`);
process.exit(overall === 'PASS' ? 0 : 1);
