#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, 'reports');
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'RESPONSIVE_COMMANDER_POLICY.md');
const RESPONSIVE_SPEC_PATH = path.join(ROOT, 'tests', 'e2e', 'responsive.spec.ts');
const TRANSFER_SPEC_PATH = path.join(ROOT, 'tests', 'e2e', 'transfer-page.spec.ts');

const REQUIRED_TOUCH_TARGET_TOKEN = 'toBeGreaterThanOrEqual(44)';
const REQUIRED_MIN_VIEWPORT_TOKEN = 'viewport: { width: 320, height: 568 }';
const REQUIRED_KEYBOARD_TEST_TOKEN = 'should activate mode card with keyboard';
const MIN_EXPECTED_SCENARIOS = 20;
const MIN_MATRIX_PASSED = 400;

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

function readJson(filePath) {
  const text = readFile(filePath).replace(/^\uFEFF/, '');
  return JSON.parse(text);
}

function getLatestReport(prefix) {
  if (!fs.existsSync(REPORTS_DIR)) {
    return null;
  }

  const candidates = fs
    .readdirSync(REPORTS_DIR)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.json'))
    .map((name) => path.join(REPORTS_DIR, name))
    .map((filePath) => ({ filePath, mtimeMs: fs.statSync(filePath).mtimeMs }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (candidates.length === 0) {
    return null;
  }

  return candidates[0].filePath;
}

function checkBaselineFiles() {
  const required = [POLICY_PATH, RESPONSIVE_SPEC_PATH, TRANSFER_SPEC_PATH];
  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Responsive policy and core E2E specs exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['policy and required responsive/transfer E2E specs are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkResponsiveSpec(content) {
  const details = [];
  let pass = true;

  if (!content.includes(REQUIRED_MIN_VIEWPORT_TOKEN)) {
    pass = false;
    details.push(`missing minimum viewport token: ${REQUIRED_MIN_VIEWPORT_TOKEN}`);
  } else {
    details.push('minimum 320px viewport coverage token found');
  }

  const touchTargetMatches = content.split(REQUIRED_TOUCH_TARGET_TOKEN).length - 1;
  if (touchTargetMatches < 2) {
    pass = false;
    details.push(`expected at least 2 occurrences of ${REQUIRED_TOUCH_TARGET_TOKEN}, found ${touchTargetMatches}`);
  } else {
    details.push(`44px touch-target assertions found: ${touchTargetMatches}`);
  }

  return {
    name: 'Responsive E2E spec enforces 320px and 44px thresholds',
    pass,
    details,
  };
}

function checkKeyboardCoverage(content) {
  return {
    name: 'Transfer E2E coverage includes keyboard mode activation (no hover-only path)',
    pass: content.includes(REQUIRED_KEYBOARD_TEST_TOKEN),
    details: content.includes(REQUIRED_KEYBOARD_TEST_TOKEN)
      ? ['keyboard activation test exists in tests/e2e/transfer-page.spec.ts']
      : [`missing token: ${REQUIRED_KEYBOARD_TEST_TOKEN}`],
  };
}

function checkResponsiveRunArtifact() {
  const latestPath = getLatestReport('responsive-commander-');
  if (!latestPath) {
    return {
      name: 'Responsive commander run artifact exists and passes',
      pass: false,
      details: ['missing reports/responsive-commander-*.json'],
    };
  }

  const report = readJson(latestPath);
  const stats = report.stats || {};
  const errors = Array.isArray(report.errors) ? report.errors : [];

  const failures = [];
  if (errors.length > 0) {
    failures.push(`report errors present: ${errors.length}`);
  }
  if ((stats.unexpected || 0) !== 0) {
    failures.push(`unexpected tests not zero: ${stats.unexpected}`);
  }
  if ((stats.expected || 0) < MIN_EXPECTED_SCENARIOS) {
    failures.push(`expected test count below threshold (${MIN_EXPECTED_SCENARIOS}): ${stats.expected || 0}`);
  }

  return {
    name: 'Responsive commander run artifact exists and passes',
    pass: failures.length === 0,
    details: failures.length === 0
      ? [
          `latest artifact: ${toPosix(path.relative(ROOT, latestPath))}`,
          `stats: expected=${stats.expected}, skipped=${stats.skipped}, unexpected=${stats.unexpected}, flaky=${stats.flaky}`,
        ]
      : failures,
  };
}

function checkInfiltrationEvidence() {
  const latestPath = getLatestReport('e2e-infiltration-');
  if (!latestPath) {
    return {
      name: 'Mobile project coverage remains enforced by infiltration matrix',
      pass: false,
      details: ['missing reports/e2e-infiltration-*.json'],
    };
  }

  const report = readJson(latestPath);
  const details = [];
  let pass = report.passed === true;

  details.push(`latest infiltration artifact: ${toPosix(path.relative(ROOT, latestPath))}`);

  const projectCheck = (report.checks || []).find((check) =>
    /Required browser\/device projects/.test(check.name || '')
  );
  if (!projectCheck || projectCheck.pass !== true) {
    pass = false;
    details.push('required browser/device project check is missing or failed');
  } else {
    details.push('required browser/device project check passed');
  }

  const matrixCheck = (report.checks || []).find((check) =>
    /Cross-project matrix evidence/.test(check.name || '')
  );

  if (!matrixCheck || matrixCheck.pass !== true) {
    pass = false;
    details.push('cross-project matrix evidence check is missing or failed');
  } else {
    const summaryLine = (matrixCheck.details || []).find((line) => /matrix summary:/i.test(line));
    if (!summaryLine) {
      pass = false;
      details.push('matrix summary line missing');
    } else {
      const parsed = {};
      summaryLine.replace(/(passed|skipped|flaky|failed)=(\d+)/g, (_, key, value) => {
        parsed[key] = Number(value);
        return _;
      });

      if ((parsed.failed || 0) !== 0) {
        pass = false;
        details.push(`matrix failed count is not zero: ${parsed.failed}`);
      }
      if ((parsed.passed || 0) < MIN_MATRIX_PASSED) {
        pass = false;
        details.push(`matrix passed count below threshold (${MIN_MATRIX_PASSED}): ${parsed.passed || 0}`);
      }
      details.push(`matrix summary parsed: passed=${parsed.passed || 0}, failed=${parsed.failed || 0}`);
    }
  }

  return {
    name: 'Mobile project coverage remains enforced by infiltration matrix',
    pass,
    details,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Responsive Commander Verification',
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
  const baseline = checkBaselineFiles();
  checks.push(baseline);

  if (baseline.pass) {
    const responsiveSpecContent = readFile(RESPONSIVE_SPEC_PATH);
    const transferSpecContent = readFile(TRANSFER_SPEC_PATH);

    checks.push(checkResponsiveSpec(responsiveSpecContent));
    checks.push(checkKeyboardCoverage(transferSpecContent));
    checks.push(checkResponsiveRunArtifact());
    checks.push(checkInfiltrationEvidence());
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `responsive-commander-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `responsive-commander-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-responsive-commander] JSON: ${jsonPath}`);
  console.log(`[verify-responsive-commander] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
