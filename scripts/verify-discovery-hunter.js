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
  { path: 'docs/governance/DISCOVERY_HUNTER_POLICY.md', label: 'Governance policy' },
  { path: 'scripts/verify-discovery-hunter.js', label: 'Verifier script' },
  { path: 'tests/unit/network/discovery-hunter.test.ts', label: 'Unit test suite' },
  { path: 'lib/discovery/discovery-controller.ts', label: 'Discovery controller' },
  { path: 'lib/discovery/unified-discovery.ts', label: 'Unified discovery' },
  { path: 'lib/discovery/local-discovery.ts', label: 'Local discovery' },
  { path: 'lib/discovery/mdns-bridge.ts', label: 'mDNS bridge' },
  { path: 'lib/discovery/mdns-types.ts', label: 'mDNS types' },
  { path: 'lib/discovery/ble.ts', label: 'BLE discovery' },
  { path: 'lib/discovery/index.ts', label: 'Discovery barrel exports' },
];

for (const file of requiredFiles) {
  check(`File exists: ${file.label}`, fileExists(file.path), toPosix(file.path));
}

// --- 2. Discovery controller uses .getState() pattern ---

const controllerPath = path.join(ROOT, 'lib', 'discovery', 'discovery-controller.ts');
if (fs.existsSync(controllerPath)) {
  const content = readFile(controllerPath);

  check(
    'Discovery controller uses .getState() pattern',
    content.includes('.getState()'),
    'Plain function wrapping .getState() calls'
  );

  check(
    'Discovery controller does NOT import React hooks',
    !content.includes('useState') && !content.includes('useEffect'),
    'No React hook imports in discovery-controller.ts'
  );
}

// --- 3. mDNS service type ---

const mdnsTypesPath = path.join(ROOT, 'lib', 'discovery', 'mdns-types.ts');
if (fs.existsSync(mdnsTypesPath)) {
  const content = readFile(mdnsTypesPath);

  check(
    'mDNS uses _tallow._tcp.local service type',
    content.includes('_tallow._tcp'),
    '_tallow._tcp.local service type defined'
  );
}

// --- 4. BLE service UUID ---

const blePath = path.join(ROOT, 'lib', 'discovery', 'ble.ts');
if (fs.existsSync(blePath)) {
  const content = readFile(blePath);

  check(
    'BLE defines service UUID',
    content.includes('0000fd00') || content.includes('serviceUUID') || content.includes('SERVICE_UUID'),
    'BLE service UUID defined'
  );
}

// --- 5. npm script registered ---

const pkgPath = path.join(ROOT, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(readFile(pkgPath));
  check(
    'npm script "verify:discovery:hunter" registered',
    pkg.scripts && pkg.scripts['verify:discovery:hunter'],
    'package.json scripts.verify:discovery:hunter'
  );
}

// --- 6. CI workflow includes verifier ---

const ciPath = path.join(ROOT, '.github', 'workflows', 'ci.yml');
if (fs.existsSync(ciPath)) {
  const ciContent = readFile(ciPath);
  check(
    'CI workflow runs discovery hunter verifier',
    ciContent.includes('npm run verify:discovery:hunter'),
    '.github/workflows/ci.yml contains verify:discovery:hunter'
  );
}

// --- 7. Release workflow includes verifier ---

const releasePath = path.join(ROOT, '.github', 'workflows', 'release.yml');
if (fs.existsSync(releasePath)) {
  const releaseContent = readFile(releasePath);
  check(
    'Release workflow runs discovery hunter verifier',
    releaseContent.includes('npm run verify:discovery:hunter'),
    '.github/workflows/release.yml contains verify:discovery:hunter'
  );
}

// ============================================================================
// REPORT
// ============================================================================

const total = passed + failed;
const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
const overall = failed === 0 ? 'PASS' : 'FAIL';

console.log('\n====================================================');
console.log('  DISCOVERY HUNTER POLICY VERIFICATION (Agent 026)');
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

const jsonPath = path.join(reportsDir, `discovery-hunter-verification-${ts}.json`);
const mdPath = path.join(reportsDir, `discovery-hunter-verification-${ts}.md`);

fs.writeFileSync(jsonPath, JSON.stringify({
  agent: 'DISCOVERY_HUNTER (026)',
  timestamp: ts,
  overall,
  total,
  passed,
  failed,
  passRate: parseFloat(passRate),
  checks,
}, null, 2));

let md = `# Discovery Hunter Verification\n\nGenerated: ${ts}\n\n## Checks\n`;
for (const c of checks) {
  md += `- [${c.status}] ${c.name}\n`;
  if (c.status === 'FAIL') {
    md += `  - Detail: ${c.detail}\n`;
  }
}
md += `\n## Summary\n- Overall: ${overall}\n- Pass Rate: ${passRate}%\n\n`;
fs.writeFileSync(mdPath, md);

console.error(`[verify-discovery-hunter] JSON: ${jsonPath}`);
console.error(`[verify-discovery-hunter] Markdown: ${mdPath}`);
process.exit(overall === 'PASS' ? 0 : 1);
