#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'QRCODE_LINKER_POLICY.md');
const QR_SCANNER_PATH = path.join(ROOT, 'components', 'transfer', 'QRScanner.tsx');
const ROOM_CODE_CONNECT_PATH = path.join(ROOT, 'components', 'transfer', 'RoomCodeConnect.tsx');
const TRANSFER_PAGE_PATH = path.join(ROOT, 'app', 'transfer', 'page.tsx');
const FEATURE_FLAGS_PATH = path.join(ROOT, 'lib', 'feature-flags', 'feature-flags.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:qrcode:linker';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:qrcode:linker';

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

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function checkRequiredFiles() {
  const requiredFiles = [
    POLICY_PATH,
    QR_SCANNER_PATH,
    ROOM_CODE_CONNECT_PATH,
    TRANSFER_PAGE_PATH,
    FEATURE_FLAGS_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'QRCode linker policy, implementation files, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required qrcode-linker files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkScannerReadiness(scannerContent) {
  const findings = [];

  if (!/BarcodeDetector/.test(scannerContent)) {
    findings.push('QRScanner is missing BarcodeDetector integration');
  }
  if (!/setShowManualEntry\(true\)/.test(scannerContent)) {
    findings.push('QRScanner is missing manual-entry fallback');
  }
  if (!/const\s+scanIntervalRef/.test(scannerContent)) {
    findings.push('QRScanner is missing scan interval state');
  }

  const intervalMatch = scannerContent.match(/setInterval\([\s\S]*?,\s*(\d+)\s*\)/);
  if (!intervalMatch) {
    findings.push('QRScanner scan interval was not detected');
  } else {
    const intervalMs = Number.parseInt(intervalMatch[1], 10);
    if (!Number.isFinite(intervalMs) || intervalMs > 500) {
      findings.push(`QRScanner scan interval must be <= 500ms, found ${intervalMatch[1]}ms`);
    }
  }

  if (!/onScan\(data\.trim\(\)\)/.test(scannerContent)) {
    findings.push('QRScanner does not pass scanned payload through onScan');
  }

  return {
    name: 'QR scanner supports camera scan, manual fallback, and sub-500ms scan cadence',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['QRScanner implements scanner loop, fallback, and payload emission'] : findings,
  };
}

function checkOneTapConnect(roomCodeConnectContent, transferPageContent) {
  const findings = [];

  if (!/Scan QR Code/.test(roomCodeConnectContent)) {
    findings.push('RoomCodeConnect is missing "Scan QR Code" UI action');
  }
  if (!/<QRScanner/.test(roomCodeConnectContent)) {
    findings.push('RoomCodeConnect is missing QRScanner integration');
  }
  if (!/handleScannerScan/.test(roomCodeConnectContent)) {
    findings.push('RoomCodeConnect is missing scanner payload handler');
  }
  if (!/joinWithCode\(parsedPayload\.roomCode\)/.test(roomCodeConnectContent)) {
    findings.push('RoomCodeConnect scanner path is not joining room code directly');
  }

  if (!/useSearchParams/.test(transferPageContent)) {
    findings.push('transfer page is missing search param parsing for room links');
  }
  if (!/searchParams\.get\('room'\)/.test(transferPageContent)) {
    findings.push('transfer page is missing room query parsing');
  }
  if (!/searchParams\.get\('expiresAt'\)/.test(transferPageContent)) {
    findings.push('transfer page is missing expiresAt query parsing');
  }
  if (!/setMode\('internet'\)/.test(transferPageContent)) {
    findings.push('transfer page is not auto-switching to internet mode for room links');
  }
  if (!/initialRoomCode/.test(transferPageContent)) {
    findings.push('transfer page is not forwarding parsed room code into RoomCodeConnect');
  }

  return {
    name: 'One-tap QR flow is wired from scanner/link payload to room join',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['scanner and transfer page flow provide one-tap room-link join behavior'] : findings,
  };
}

function checkExpiringPayload(roomCodeConnectContent, transferPageContent) {
  const findings = [];

  if (!/const QR_LINK_TTL_MS =/.test(roomCodeConnectContent)) {
    findings.push('RoomCodeConnect is missing QR link TTL constant');
  }
  if (!/expiresAt/.test(roomCodeConnectContent) || !/URLSearchParams/.test(roomCodeConnectContent)) {
    findings.push('RoomCodeConnect is missing expiring query payload generation');
  }
  if (!/buildShareableLink/.test(roomCodeConnectContent)) {
    findings.push('RoomCodeConnect is missing shared link builder for QR/link output');
  }
  if (!/Date\.now\(\) > parsedPayload\.expiresAt/.test(roomCodeConnectContent)) {
    findings.push('RoomCodeConnect scanner intake is missing expiry rejection logic');
  }
  if (!/Date\.now\(\) > parsedExpiresAt/.test(transferPageContent)) {
    findings.push('transfer page room-link intake is missing expiry rejection logic');
  }

  return {
    name: 'QR links use time-limited payloads with expiry enforcement',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['expiring QR payload generation and expiry rejection paths are present'] : findings,
  };
}

function checkFeatureFlagCoverage(featureFlagsContent) {
  const findings = [];

  if (!/qr_linking/.test(featureFlagsContent)) {
    findings.push('feature flags file is missing qr_linking flag');
  }

  return {
    name: 'QR linking feature flag is defined for staged rollout',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['qr_linking flag is present'] : findings,
  };
}

function checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent) {
  const findings = [];
  const packageJson = JSON.parse(packageJsonContent);

  if (!(packageJson.scripts || {})[REQUIRED_SCRIPT_NAME]) {
    findings.push(`missing package script: ${REQUIRED_SCRIPT_NAME}`);
  }
  if (!ciContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    findings.push(`CI workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }
  if (!releaseContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    findings.push(`release workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }

  return {
    name: 'QRCode linker gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs qrcode linker verification',
            '.github/workflows/release.yml runs qrcode linker verification',
          ]
        : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# QRCode Linker Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    '## Checks',
    ...report.checks.map((check) => `- ${check.pass ? '[PASS]' : '[FAIL]'} ${check.name}`),
    '',
  ];

  for (const check of report.checks) {
    lines.push(`### ${check.name}`);
    for (const detail of check.details) {
      lines.push(`- ${detail}`);
    }
    lines.push('');
  }

  lines.push('## Summary');
  lines.push(`- Overall: ${report.passed ? 'PASS' : 'FAIL'}`);
  lines.push('');

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const checks = [];
  const required = checkRequiredFiles();
  checks.push(required);

  if (required.pass) {
    const scannerContent = readFile(QR_SCANNER_PATH);
    const roomCodeConnectContent = readFile(ROOM_CODE_CONNECT_PATH);
    const transferPageContent = readFile(TRANSFER_PAGE_PATH);
    const featureFlagsContent = readFile(FEATURE_FLAGS_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkScannerReadiness(scannerContent));
    checks.push(checkOneTapConnect(roomCodeConnectContent, transferPageContent));
    checks.push(checkExpiringPayload(roomCodeConnectContent, transferPageContent));
    checks.push(checkFeatureFlagCoverage(featureFlagsContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `qrcode-linker-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `qrcode-linker-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-qrcode-linker] JSON: ${jsonPath}`);
  console.log(`[verify-qrcode-linker] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
