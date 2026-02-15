#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const PACKAGE_JSON_PATH = path.join(process.cwd(), 'package.json');
const LOCKFILE_PATH = path.join(process.cwd(), 'package-lock.json');
const JUSTIFICATIONS_PATH = path.join(
  process.cwd(),
  'docs',
  'governance',
  'DEPENDENCY_JUSTIFICATIONS.json'
);
const WEEKLY_WORKFLOW_PATH = path.join(
  process.cwd(),
  '.github',
  'workflows',
  'dependency-weekly-scan.yml'
);
const RELEASE_WORKFLOW_PATH = path.join(process.cwd(), '.github', 'workflows', 'release.yml');
const CI_WORKFLOW_PATH = path.join(process.cwd(), '.github', 'workflows', 'ci.yml');

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function checkJustificationCoverage() {
  if (!fs.existsSync(PACKAGE_JSON_PATH) || !fs.existsSync(JUSTIFICATIONS_PATH)) {
    return {
      name: 'Every dependency has a justification entry',
      pass: false,
      details: ['missing package.json or docs/governance/DEPENDENCY_JUSTIFICATIONS.json'],
    };
  }

  const packageJson = readJson(PACKAGE_JSON_PATH);
  const justifications = readJson(JUSTIFICATIONS_PATH);
  const runtimeDeps = packageJson.dependencies || {};
  const devDeps = packageJson.devDependencies || {};
  const runtimeJustifications = justifications.runtimeDependencies || {};
  const devJustifications = justifications.devDependencies || {};
  const missing = [];

  for (const dependencyName of Object.keys(runtimeDeps)) {
    const explanation = runtimeJustifications[dependencyName];
    if (typeof explanation !== 'string' || explanation.trim().length === 0) {
      missing.push(`runtime dependency missing justification: ${dependencyName}`);
    }
  }

  for (const dependencyName of Object.keys(devDeps)) {
    const explanation = devJustifications[dependencyName];
    if (typeof explanation !== 'string' || explanation.trim().length === 0) {
      missing.push(`dev dependency missing justification: ${dependencyName}`);
    }
  }

  return {
    name: 'Every dependency has a justification entry',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? [
            `runtime dependencies covered: ${Object.keys(runtimeDeps).length}`,
            `dev dependencies covered: ${Object.keys(devDeps).length}`,
          ]
        : missing,
  };
}

function checkLockfileCommitted() {
  const pass = fs.existsSync(LOCKFILE_PATH);
  return {
    name: 'Lockfile exists in repository',
    pass,
    details: pass ? ['package-lock.json present'] : ['missing package-lock.json'],
  };
}

function checkWeeklyAutomatedScan() {
  if (!fs.existsSync(WEEKLY_WORKFLOW_PATH)) {
    return {
      name: 'Weekly automated dependency scan is configured',
      pass: false,
      details: ['missing .github/workflows/dependency-weekly-scan.yml'],
    };
  }

  const workflow = fs.readFileSync(WEEKLY_WORKFLOW_PATH, 'utf8');
  const requiredTokens = [
    'schedule:',
    'cron:',
    'npm audit',
    'verify:dependencies:justification',
  ];

  const missing = requiredTokens.filter((token) => !workflow.includes(token));
  return {
    name: 'Weekly automated dependency scan is configured',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['dependency weekly scan workflow includes schedule + audit + policy verification']
        : missing.map((token) => `weekly workflow missing token: ${token}`),
  };
}

function checkReleaseSbomArtifacts() {
  if (!fs.existsSync(RELEASE_WORKFLOW_PATH)) {
    return {
      name: 'Release pipeline generates dependency audit and SBOM artifacts',
      pass: false,
      details: ['missing .github/workflows/release.yml'],
    };
  }

  const workflow = fs.readFileSync(RELEASE_WORKFLOW_PATH, 'utf8');
  const requiredTokens = [
    'security-artifacts',
    'Run dependency audit',
    'Generate SBOM',
    'sbom-release.spdx.json',
  ];
  const missing = requiredTokens.filter((token) => !workflow.includes(token));

  return {
    name: 'Release pipeline generates dependency audit and SBOM artifacts',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['release workflow contains dependency audit + SBOM generation/upload steps']
        : missing.map((token) => `release workflow missing token: ${token}`),
  };
}

function checkCiPolicyEnforcement() {
  if (!fs.existsSync(CI_WORKFLOW_PATH)) {
    return {
      name: 'CI enforces dependency policy verification',
      pass: false,
      details: ['missing .github/workflows/ci.yml'],
    };
  }

  const workflow = fs.readFileSync(CI_WORKFLOW_PATH, 'utf8');
  const requiredTokens = ['security-scan', 'verify:dependencies:justification'];
  const missing = requiredTokens.filter((token) => !workflow.includes(token));

  return {
    name: 'CI enforces dependency policy verification',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['ci workflow contains dependency policy verification step']
        : missing.map((token) => `ci workflow missing token: ${token}`),
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Dependency Justification Verification',
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

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const checks = [
    checkJustificationCoverage(),
    checkLockfileCommitted(),
    checkWeeklyAutomatedScan(),
    checkReleaseSbomArtifacts(),
    checkCiPolicyEnforcement(),
  ];

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const reportsDirectory = path.join(process.cwd(), 'reports');
  ensureDirectory(reportsDirectory);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `dependency-justifications-${stamp}.json`);
  const markdownPath = path.join(reportsDirectory, `dependency-justifications-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-dependency-justifications] JSON: ${jsonPath}`);
  console.log(`[verify-dependency-justifications] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
