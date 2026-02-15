#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'SYNC_COORDINATOR_POLICY.md');
const STATE_MACHINE_PATH = path.join(ROOT, 'lib', 'transfer', 'state-machine.ts');
const RESUMABLE_TRANSFER_PATH = path.join(ROOT, 'lib', 'transfer', 'resumable-transfer.ts');
const DELTA_SYNC_PATH = path.join(ROOT, 'lib', 'transfer', 'delta-sync.ts');
const DELTA_SYNC_MANAGER_PATH = path.join(ROOT, 'lib', 'transfer', 'delta-sync-manager.ts');
const STORE_ACTIONS_PATH = path.join(ROOT, 'lib', 'transfer', 'store-actions.ts');
const TRANSFER_STATE_DB_PATH = path.join(ROOT, 'lib', 'storage', 'transfer-state-db.ts');
const TEST_PATH = path.join(ROOT, 'tests', 'unit', 'transfer', 'sync-coordinator.test.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:sync:coordinator';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:sync:coordinator';

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

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
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

// ============================================================================
// CHECKS
// ============================================================================

const results = [];
let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    results.push({ name, status: 'PASS', detail });
    passed++;
  } else {
    results.push({ name, status: 'FAIL', detail });
    failed++;
  }
}

// --- 1. Required files exist ---

const requiredFiles = [
  { path: POLICY_PATH, label: 'Governance policy' },
  { path: STATE_MACHINE_PATH, label: 'Transfer state machine' },
  { path: RESUMABLE_TRANSFER_PATH, label: 'Resumable transfer manager' },
  { path: DELTA_SYNC_PATH, label: 'Delta sync module' },
  { path: DELTA_SYNC_MANAGER_PATH, label: 'Delta sync manager' },
  { path: STORE_ACTIONS_PATH, label: 'Store actions (plain TS)' },
  { path: TRANSFER_STATE_DB_PATH, label: 'Transfer state DB (IndexedDB)' },
  { path: TEST_PATH, label: 'Sync coordinator test suite' },
];

for (const file of requiredFiles) {
  check(
    `File exists: ${file.label}`,
    fs.existsSync(file.path),
    toPosix(path.relative(ROOT, file.path))
  );
}

// --- 2. State machine has required states ---

if (fs.existsSync(STATE_MACHINE_PATH)) {
  const smContent = readFile(STATE_MACHINE_PATH);
  const requiredStates = ['idle', 'negotiating', 'transferring', 'paused', 'resuming', 'complete', 'failed'];

  for (const state of requiredStates) {
    check(
      `State machine defines '${state}' state`,
      smContent.includes(`'${state}'`),
      `TransferState union in state-machine.ts`
    );
  }

  check(
    'State machine supports serialization',
    smContent.includes('serialize') && smContent.includes('deserialize'),
    'serialize() and deserialize() methods present'
  );

  check(
    'State machine supports PAUSE event',
    smContent.includes("'PAUSE'"),
    'PAUSE event in TransferEvent union'
  );

  check(
    'State machine supports RESUME event',
    smContent.includes("'RESUME'"),
    'RESUME event in TransferEvent union'
  );

  check(
    'State machine supports RETRY event',
    smContent.includes("'RETRY'"),
    'RETRY event in TransferEvent union'
  );
}

// --- 3. Resumable transfer has chunk bitmap exchange ---

if (fs.existsSync(RESUMABLE_TRANSFER_PATH)) {
  const rtContent = readFile(RESUMABLE_TRANSFER_PATH);

  check(
    'Resumable transfer uses chunk bitmap',
    rtContent.includes('chunkBitmap') || rtContent.includes('chunk_bitmap') || rtContent.includes('Bitmap'),
    'Chunk bitmap for resume protocol'
  );

  check(
    'Resumable transfer sends resume-request',
    rtContent.includes('resume-request'),
    'resume-request message type'
  );

  check(
    'Resumable transfer handles resume-response',
    rtContent.includes('resume-response'),
    'resume-response message type'
  );

  check(
    'Resumable transfer requests missing chunks',
    rtContent.includes('resume-chunk-request'),
    'resume-chunk-request message type'
  );
}

// --- 4. Delta sync implements block signatures ---

if (fs.existsSync(DELTA_SYNC_PATH)) {
  const dsContent = readFile(DELTA_SYNC_PATH);

  check(
    'Delta sync computes block signatures',
    dsContent.includes('computeBlockSignatures'),
    'computeBlockSignatures function'
  );

  check(
    'Delta sync computes delta',
    dsContent.includes('computeDelta'),
    'computeDelta function'
  );

  check(
    'Delta sync creates patch',
    dsContent.includes('createPatch'),
    'createPatch function'
  );

  check(
    'Delta sync applies patch',
    dsContent.includes('applyPatch'),
    'applyPatch function'
  );

  check(
    'Delta sync estimates savings',
    dsContent.includes('estimateSavings'),
    'estimateSavings function'
  );

  check(
    'Delta sync uses SHA-256',
    dsContent.includes('SHA-256'),
    'SHA-256 hashing for block integrity'
  );
}

// --- 5. IndexedDB persistence layer ---

if (fs.existsSync(TRANSFER_STATE_DB_PATH)) {
  const dbContent = readFile(TRANSFER_STATE_DB_PATH);

  check(
    'Transfer state DB uses IndexedDB',
    dbContent.includes('indexedDB') || dbContent.includes('IndexedDB'),
    'IndexedDB as persistence backend'
  );

  check(
    'Transfer state DB stores chunk bitmap',
    dbContent.includes('chunkBitmap'),
    'chunkBitmap field in transfer metadata'
  );

  check(
    'Transfer state DB supports cleanup',
    dbContent.includes('cleanupExpiredTransfers'),
    'cleanupExpiredTransfers function'
  );

  check(
    'Transfer state DB exports bitmap',
    dbContent.includes('exportChunkBitmap'),
    'exportChunkBitmap for resume protocol'
  );

  check(
    'Transfer state DB imports bitmap',
    dbContent.includes('importChunkBitmap'),
    'importChunkBitmap for resume protocol'
  );
}

// --- 6. Store actions are plain TS (no React hooks) ---

if (fs.existsSync(STORE_ACTIONS_PATH)) {
  const saContent = readFile(STORE_ACTIONS_PATH);

  check(
    'Store actions use getState() pattern',
    saContent.includes('.getState()'),
    'Plain function wrapping .getState() calls'
  );

  check(
    'Store actions do not use React hooks directly',
    !saContent.includes('useState') && !saContent.includes('useEffect') && !saContent.includes('useCallback'),
    'No React hook imports in store-actions.ts'
  );
}

// --- 7. npm script registered ---

if (fs.existsSync(PACKAGE_JSON_PATH)) {
  const pkg = JSON.parse(readFile(PACKAGE_JSON_PATH));
  const scripts = pkg.scripts || {};

  check(
    `npm script "${REQUIRED_SCRIPT_NAME}" registered`,
    Object.prototype.hasOwnProperty.call(scripts, REQUIRED_SCRIPT_NAME),
    `package.json scripts.${REQUIRED_SCRIPT_NAME}`
  );
}

// --- 8. CI workflow includes verifier ---

if (fs.existsSync(CI_WORKFLOW_PATH)) {
  const ciContent = readFile(CI_WORKFLOW_PATH);

  check(
    'CI workflow runs sync coordinator verifier',
    ciContent.includes(REQUIRED_WORKFLOW_COMMAND),
    `.github/workflows/ci.yml contains "${REQUIRED_WORKFLOW_COMMAND}"`
  );
}

// --- 9. Release workflow includes verifier ---

if (fs.existsSync(RELEASE_WORKFLOW_PATH)) {
  const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

  check(
    'Release workflow runs sync coordinator verifier',
    releaseContent.includes(REQUIRED_WORKFLOW_COMMAND),
    `.github/workflows/release.yml contains "${REQUIRED_WORKFLOW_COMMAND}"`
  );
}

// --- 10. Test file covers required scenarios ---

if (fs.existsSync(TEST_PATH)) {
  const testContent = readFile(TEST_PATH);

  check(
    'Test covers state machine lifecycle transitions',
    testContent.includes('state machine') || testContent.includes('TransferStateMachine'),
    'TransferStateMachine lifecycle tests'
  );

  check(
    'Test covers chunk bitmap resume',
    testContent.includes('bitmap') || testContent.includes('missing chunks'),
    'Chunk bitmap and resume-from-last-chunk tests'
  );

  check(
    'Test covers delta sync savings',
    testContent.includes('delta') || testContent.includes('savings'),
    'Delta sync savings estimation tests'
  );

  check(
    'Test covers serialization round-trip',
    testContent.includes('serialize') || testContent.includes('deserialize'),
    'State persistence serialization round-trip tests'
  );
}

// ============================================================================
// REPORT
// ============================================================================

const total = passed + failed;
const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

console.log('\n====================================================');
console.log('  SYNC COORDINATOR POLICY VERIFICATION (Agent 029)');
console.log('====================================================\n');

for (const r of results) {
  const icon = r.status === 'PASS' ? '[PASS]' : '[FAIL]';
  console.log(`  ${icon} ${r.name}`);
  if (r.status === 'FAIL') {
    console.log(`         Detail: ${r.detail}`);
  }
}

console.log(`\n  Total: ${total}  Passed: ${passed}  Failed: ${failed}  (${passRate}%)\n`);

// Write report
const reportsDir = resolveReportsDirectory();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

const jsonReport = {
  agent: 'SYNC_COORDINATOR (029)',
  timestamp: new Date().toISOString(),
  total,
  passed,
  failed,
  passRate: parseFloat(passRate),
  results,
};

const jsonPath = path.join(reportsDir, `sync-coordinator-${timestamp}.json`);
fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf8');

const mdLines = [
  '# Sync Coordinator Verification Report',
  '',
  `**Agent:** SYNC_COORDINATOR (029)`,
  `**Date:** ${new Date().toISOString()}`,
  `**Result:** ${failed === 0 ? 'PASS' : 'FAIL'} (${passRate}%)`,
  '',
  '| Check | Status | Detail |',
  '|-------|--------|--------|',
];

for (const r of results) {
  mdLines.push(`| ${r.name} | ${r.status} | ${r.detail} |`);
}

mdLines.push('');
const mdPath = path.join(reportsDir, `sync-coordinator-${timestamp}.md`);
fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf8');

console.log(`  Reports written to:`);
console.log(`    ${toPosix(path.relative(ROOT, jsonPath))}`);
console.log(`    ${toPosix(path.relative(ROOT, mdPath))}\n`);

if (failed > 0) {
  console.error(`  VERIFICATION FAILED: ${failed} check(s) did not pass.\n`);
  process.exit(1);
}

console.log('  All checks passed.\n');
process.exit(0);
