#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');
const DEPLOYMENT_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'deployment.yml');

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function checkFilesExist() {
  const missing = [];
  if (!fs.existsSync(CI_WORKFLOW_PATH)) {
    missing.push('.github/workflows/ci.yml');
  }
  if (!fs.existsSync(RELEASE_WORKFLOW_PATH)) {
    missing.push('.github/workflows/release.yml');
  }
  if (!fs.existsSync(DEPLOYMENT_WORKFLOW_PATH)) {
    missing.push('.github/workflows/deployment.yml');
  }

  return {
    name: 'Required CI/CD workflow files exist',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['ci.yml, release.yml, deployment.yml found'] : missing.map((item) => `missing: ${item}`),
  };
}

function checkPrGateCoverage(ciContent) {
  const requiredTokens = [
    'pull_request:',
    'lint:',
    'unit-test:',
    'integration-test:',
    'e2e-test:',
    'Run ESLint',
    'Type check',
  ];
  const missing = requiredTokens.filter((token) => !ciContent.includes(token));

  return {
    name: 'PR pipeline enforces lint + type-check + unit + integration + E2E gates',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['all required PR gate tokens found in ci.yml'] : missing.map((token) => `missing token: ${token}`),
  };
}

function checkMainAutoDeploysToStaging(deploymentContent) {
  const requiredTokens = [
    'push:',
    '- main',
    'Deploy to staging (Green)',
    'green.tallow.manisahome.com',
    'Run smoke tests on green',
  ];
  const missing = requiredTokens.filter((token) => !deploymentContent.includes(token));

  return {
    name: 'Main branch auto-deploy path includes staging deployment and smoke validation',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['deployment.yml contains push-to-main staging (green) automation'] : missing.map((token) => `missing token: ${token}`),
  };
}

function checkTaggedReleaseToProduction(releaseContent) {
  const requiredTokens = [
    "tags:",
    "- 'v*.*.*'",
    'deploy-release:',
    "environment:",
    'name: production',
    "if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')",
  ];
  const missing = requiredTokens.filter((token) => !releaseContent.includes(token));

  return {
    name: 'Tagged releases auto-deploy to production',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['release.yml contains tagged production deployment automation'] : missing.map((token) => `missing token: ${token}`),
  };
}

function checkNoManualOnlyDeployment(deploymentContent, releaseContent) {
  const deploymentHasPush = deploymentContent.includes('on:') && deploymentContent.includes('push:') && deploymentContent.includes('- main');
  const releaseHasTagPush = releaseContent.includes('on:') && releaseContent.includes('push:') && releaseContent.includes("tags:") && releaseContent.includes("- 'v*.*.*'");
  const pass = deploymentHasPush && releaseHasTagPush;

  return {
    name: 'Deployment paths are triggerable without manual workflow-dispatch input',
    pass,
    details: pass
      ? ['staging deployment is push-triggered on main and production release is push-triggered on version tags']
      : ['missing automatic push-based trigger for staging and/or tagged production deployments'],
  };
}

function writeMarkdownReport(report, mdPath) {
  const lines = [
    '# CI/CD Pipeline Verification',
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
  const checks = [];
  const filesExist = checkFilesExist();
  checks.push(filesExist);

  if (filesExist.pass) {
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);
    const deploymentContent = readFile(DEPLOYMENT_WORKFLOW_PATH);

    checks.push(checkPrGateCoverage(ciContent));
    checks.push(checkMainAutoDeploysToStaging(deploymentContent));
    checks.push(checkTaggedReleaseToProduction(releaseContent));
    checks.push(checkNoManualOnlyDeployment(deploymentContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const reportsDirectory = path.join(ROOT, 'reports');
  ensureDirectory(reportsDirectory);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `cicd-pipeline-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `cicd-pipeline-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-cicd-pipeline] JSON: ${jsonPath}`);
  console.log(`[verify-cicd-pipeline] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
