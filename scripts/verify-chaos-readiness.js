#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const CHAOS_SCENARIO_CATALOG_PATH = path.join(ROOT, 'docs', 'governance', 'CHAOS_SCENARIO_CATALOG.json');
const CHAOS_TEST_FILES = [
  'tests/unit/network/firewall-detection.test.ts',
  'tests/unit/network/nat-detection.test.ts',
  'tests/unit/network/data-channel-nat-ordering.test.ts',
  'tests/unit/transfer/resumable-transfer.test.ts',
  'tests/unit/storage/transfer-state.test.ts',
  'tests/unit/sync/sync-engine.test.ts',
  'tests/unit/security/incident-response-drill.test.ts',
];

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function checkScenarioCatalogSchema() {
  if (!fs.existsSync(CHAOS_SCENARIO_CATALOG_PATH)) {
    return {
      name: 'Chaos scenario catalog exists',
      pass: false,
      details: ['missing docs/governance/CHAOS_SCENARIO_CATALOG.json'],
      catalog: null,
    };
  }

  const catalog = readJson(CHAOS_SCENARIO_CATALOG_PATH);
  const failures = [];
  if (!Array.isArray(catalog.scenarios) || catalog.scenarios.length === 0) {
    failures.push('scenarios must be a non-empty array');
  } else {
    catalog.scenarios.forEach((scenario, index) => {
      const prefix = `scenarios[${index}]`;
      if (typeof scenario.id !== 'string' || scenario.id.trim() === '') {
        failures.push(`${prefix}.id must be non-empty string`);
      }
      if (typeof scenario.testFile !== 'string' || scenario.testFile.trim() === '') {
        failures.push(`${prefix}.testFile must be non-empty string`);
      }
      if (typeof scenario.testMarker !== 'string' || scenario.testMarker.trim() === '') {
        failures.push(`${prefix}.testMarker must be non-empty string`);
      }
    });
  }

  return {
    name: 'Chaos scenario catalog exists',
    pass: failures.length === 0,
    details: failures.length === 0 ? [`catalog contains ${catalog.scenarios.length} scenarios`] : failures,
    catalog,
  };
}

function checkScenarioCoverage(catalog) {
  if (!catalog || !Array.isArray(catalog.scenarios)) {
    return {
      name: 'Every cataloged chaos scenario maps to an executable test marker',
      pass: false,
      details: ['catalog missing or invalid'],
      coveredScenarios: 0,
      totalScenarios: 0,
    };
  }

  const failures = [];
  let coveredScenarios = 0;

  for (const scenario of catalog.scenarios) {
    const absolutePath = path.join(ROOT, scenario.testFile);
    if (!fs.existsSync(absolutePath)) {
      failures.push(`${scenario.id}: missing file ${scenario.testFile}`);
      continue;
    }

    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    if (!fileContent.includes(scenario.testMarker)) {
      failures.push(`${scenario.id}: marker not found "${scenario.testMarker}" in ${scenario.testFile}`);
      continue;
    }

    coveredScenarios += 1;
  }

  return {
    name: 'Every cataloged chaos scenario maps to an executable test marker',
    pass: failures.length === 0,
    details:
      failures.length === 0
        ? [`mapped ${coveredScenarios}/${catalog.scenarios.length} scenarios to tests`]
        : failures,
    coveredScenarios,
    totalScenarios: catalog.scenarios.length,
  };
}

function runVitestSuite(reportPath) {
  const vitestCliPath = path.join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');
  if (!fs.existsSync(vitestCliPath)) {
    console.error(`[verify-chaos-readiness] Missing Vitest CLI at ${vitestCliPath}. Run npm install first.`);
    return 1;
  }

  const args = [
    vitestCliPath,
    'run',
    ...CHAOS_TEST_FILES,
    '--reporter=json',
    `--outputFile=${reportPath}`,
  ];

  console.log(`[verify-chaos-readiness] Running ${CHAOS_TEST_FILES.length} targeted chaos suites...`);
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });

  if (typeof result.status !== 'number') {
    if (result.error) {
      console.error(`[verify-chaos-readiness] Failed to spawn Vitest: ${result.error.message}`);
    }
    return 1;
  }

  return result.status;
}

function writeMarkdownReport(report, outputPath) {
  const failedSuites = (report.vitest?.testResults || []).filter((suite) => suite.status !== 'passed');
  const lines = [
    '# Chaos Readiness Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    '## Policy Checks',
    ...report.checks.map((check) => `- ${check.pass ? '[PASS]' : '[FAIL]'} ${check.name}`),
    '',
  ];

  report.checks.forEach((check) => {
    lines.push(`### ${check.name}`);
    check.details.forEach((detail) => lines.push(`- ${detail}`));
    lines.push('');
  });

  lines.push('## Suite Scope');
  CHAOS_TEST_FILES.forEach((file) => lines.push(`- \`${file}\``));
  lines.push('');

  lines.push('## Vitest Summary');
  lines.push(`- Success: ${report.vitest.success ? 'PASS' : 'FAIL'}`);
  lines.push(`- Test suites: ${report.vitest.numPassedTestSuites}/${report.vitest.numTotalTestSuites} passed`);
  lines.push(`- Tests: ${report.vitest.numPassedTests}/${report.vitest.numTotalTests} passed`);
  lines.push(`- Failed suites: ${report.vitest.numFailedTestSuites}`);
  lines.push(`- Failed tests: ${report.vitest.numFailedTests}`);
  lines.push('');

  if (failedSuites.length > 0) {
    lines.push('## Failed Suites');
    failedSuites.forEach((suite) => lines.push(`- \`${suite.name}\``));
    lines.push('');
  }

  lines.push('## Summary');
  lines.push(`- Overall: ${report.passed ? 'PASS' : 'FAIL'}`);
  lines.push('');

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const reportsDirectory = path.join(ROOT, 'reports');
  ensureDirectory(reportsDirectory);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonReportPath = path.join(reportsDirectory, `chaos-readiness-${stamp}.json`);
  const markdownReportPath = path.join(reportsDirectory, `chaos-readiness-${stamp}.md`);
  const vitestJsonPath = path.join(reportsDirectory, `chaos-readiness-vitest-${stamp}.json`);

  const catalogCheck = checkScenarioCatalogSchema();
  const scenarioCoverageCheck = checkScenarioCoverage(catalogCheck.catalog);
  const checks = [catalogCheck, scenarioCoverageCheck];

  const exitCode = runVitestSuite(vitestJsonPath);
  if (!fs.existsSync(vitestJsonPath)) {
    console.error(`[verify-chaos-readiness] Missing JSON output: ${vitestJsonPath}`);
    process.exit(exitCode || 1);
  }

  const vitestReport = readJson(vitestJsonPath);
  const report = {
    timestamp: new Date().toISOString(),
    checks,
    vitest: vitestReport,
    passed: checks.every((check) => check.pass) && exitCode === 0 && vitestReport.success === true,
  };

  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownReportPath);

  console.log(`[verify-chaos-readiness] JSON: ${jsonReportPath}`);
  console.log(`[verify-chaos-readiness] Markdown: ${markdownReportPath}`);

  if (!report.passed) {
    process.exit(exitCode || 1);
  }
}

main();
