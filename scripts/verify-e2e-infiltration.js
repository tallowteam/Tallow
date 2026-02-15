#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MATRIX_PATH = path.join(ROOT, 'docs', 'governance', 'E2E_INFILTRATION_MATRIX.json');
const PLAYWRIGHT_CONFIG_PATH = path.join(ROOT, 'playwright.config.ts');
const CHECKLIST_PATH = path.join(ROOT, 'REMAINING_IMPLEMENTATION_CHECKLIST.md');

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function checkMatrixFile() {
  if (!fs.existsSync(MATRIX_PATH)) {
    return {
      name: 'E2E infiltration matrix exists',
      pass: false,
      details: ['missing docs/governance/E2E_INFILTRATION_MATRIX.json'],
    };
  }

  const matrix = readJson(MATRIX_PATH);
  const failures = [];

  if (!Array.isArray(matrix.requiredProjects) || matrix.requiredProjects.length === 0) {
    failures.push('requiredProjects must be a non-empty array');
  }
  if (!Array.isArray(matrix.flowCoverage) || matrix.flowCoverage.length === 0) {
    failures.push('flowCoverage must be a non-empty array');
  }
  if (!Array.isArray(matrix.networkProfiles) || matrix.networkProfiles.length === 0) {
    failures.push('networkProfiles must be a non-empty array');
  }
  if (typeof matrix.minimumScenarioCount !== 'number' || matrix.minimumScenarioCount < 1) {
    failures.push('minimumScenarioCount must be a positive number');
  }

  return {
    name: 'E2E infiltration matrix exists',
    pass: failures.length === 0,
    details: failures.length === 0 ? ['matrix schema is valid'] : failures,
  };
}

function checkPlaywrightProjectCoverage(matrix) {
  if (!fs.existsSync(PLAYWRIGHT_CONFIG_PATH)) {
    return {
      name: 'Required browser/device projects are declared in Playwright config',
      pass: false,
      details: ['missing playwright.config.ts'],
    };
  }

  const config = readFile(PLAYWRIGHT_CONFIG_PATH);
  const missing = [];
  for (const project of matrix.requiredProjects) {
    const token = `name: '${project}'`;
    if (!config.includes(token)) {
      missing.push(`missing project token: ${token}`);
    }
  }

  return {
    name: 'Required browser/device projects are declared in Playwright config',
    pass: missing.length === 0,
    details: missing.length === 0 ? [`${matrix.requiredProjects.length} required projects found`] : missing,
  };
}

function checkFlowAndNetworkMarkers(matrix) {
  const failures = [];

  const checks = [
    ...matrix.flowCoverage.map((item) => ({ category: 'flow', item })),
    ...matrix.networkProfiles.map((item) => ({ category: 'network', item })),
  ];

  for (const { category, item } of checks) {
    const filePath = path.join(ROOT, item.file);
    if (!fs.existsSync(filePath)) {
      failures.push(`${category} marker file missing: ${item.file}`);
      continue;
    }
    const content = readFile(filePath);
    if (!content.includes(item.marker)) {
      failures.push(`${category} marker missing in ${item.file}: "${item.marker}"`);
    }
  }

  return {
    name: 'Flow phases and network-profile markers are mapped to executable E2E tests',
    pass: failures.length === 0,
    details: failures.length === 0
      ? [
          `${matrix.flowCoverage.length} flow phase markers found`,
          `${matrix.networkProfiles.length} network profile markers found`,
        ]
      : failures,
  };
}

function parseLatestMatrixEvidence(checklistContent) {
  const pattern = /Re-ran full cross-project Playwright matrix on (\d{4}-\d{2}-\d{2}):[\s\S]*?=> `(\d+) passed`, `(\d+) skipped`, `(\d+) flaky`, `(\d+) failed`/g;
  let match = null;
  let lastMatch = null;
  while ((match = pattern.exec(checklistContent)) !== null) {
    lastMatch = match;
  }

  if (!lastMatch) {
    return null;
  }

  return {
    date: lastMatch[1],
    passed: Number.parseInt(lastMatch[2], 10),
    skipped: Number.parseInt(lastMatch[3], 10),
    flaky: Number.parseInt(lastMatch[4], 10),
    failed: Number.parseInt(lastMatch[5], 10),
  };
}

function checkScenarioVolumeEvidence(matrix) {
  if (!fs.existsSync(CHECKLIST_PATH)) {
    return {
      name: 'Cross-project matrix evidence satisfies scenario-count and failure thresholds',
      pass: false,
      details: ['missing REMAINING_IMPLEMENTATION_CHECKLIST.md'],
    };
  }

  const checklist = readFile(CHECKLIST_PATH);
  const latest = parseLatestMatrixEvidence(checklist);
  if (!latest) {
    return {
      name: 'Cross-project matrix evidence satisfies scenario-count and failure thresholds',
      pass: false,
      details: ['no cross-project Playwright matrix evidence entry found in checklist'],
    };
  }

  const details = [
    `latest matrix date: ${latest.date}`,
    `matrix summary: passed=${latest.passed}, skipped=${latest.skipped}, flaky=${latest.flaky}, failed=${latest.failed}`,
    `required minimum passed scenarios: ${matrix.minimumScenarioCount}`,
  ];

  const pass = latest.passed >= matrix.minimumScenarioCount && latest.failed === 0;
  if (!pass) {
    if (latest.passed < matrix.minimumScenarioCount) {
      details.push(`passed scenarios below threshold: ${latest.passed} < ${matrix.minimumScenarioCount}`);
    }
    if (latest.failed !== 0) {
      details.push(`failed scenarios must be 0 (received ${latest.failed})`);
    }
  }

  return {
    name: 'Cross-project matrix evidence satisfies scenario-count and failure thresholds',
    pass,
    details,
  };
}

function writeMarkdownReport(report, mdPath) {
  const lines = [
    '# E2E Infiltration Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    '## Checks',
    ...report.checks.map((check) => `- ${check.pass ? '[PASS]' : '[FAIL]'} ${check.name}`),
    '',
  ];

  report.checks.forEach((check) => {
    lines.push(`### ${check.name}`);
    check.details.forEach((detail) => lines.push(`- ${detail}`));
    lines.push('');
  });

  lines.push('## Summary');
  lines.push(`- Overall: ${report.passed ? 'PASS' : 'FAIL'}`);
  lines.push('');

  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const matrixExistsCheck = checkMatrixFile();
  let matrix = null;
  if (matrixExistsCheck.pass) {
    matrix = readJson(MATRIX_PATH);
  }

  const checks = [
    matrixExistsCheck,
    ...(matrix
      ? [
          checkPlaywrightProjectCoverage(matrix),
          checkFlowAndNetworkMarkers(matrix),
          checkScenarioVolumeEvidence(matrix),
        ]
      : []),
  ];

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const reportsDirectory = path.join(ROOT, 'reports');
  ensureDirectory(reportsDirectory);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `e2e-infiltration-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `e2e-infiltration-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-e2e-infiltration] JSON: ${jsonPath}`);
  console.log(`[verify-e2e-infiltration] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
