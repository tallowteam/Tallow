#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'VISUAL_REGRESSION_WATCHER_POLICY.md');
const STORYBOOK_MAIN_PATH = path.join(ROOT, '.storybook', 'main.ts');
const STORYBOOK_PREVIEW_PATH = path.join(ROOT, '.storybook', 'preview.ts');
const COMPONENT_TABLE_PATH = path.join(ROOT, 'docs', 'governance', 'COMPONENT_PROPS_TABLES.md');
const VISUAL_SPEC_PATH = path.join(ROOT, 'tests', 'e2e', 'visual', 'visual-regression.spec.ts');
const E2E_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'e2e.yml');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');

const REQUIRED_SCRIPT_NAME = 'verify:visual:regression';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:visual:regression';

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

function checkRequiredFiles() {
  const requiredFiles = [
    POLICY_PATH,
    STORYBOOK_MAIN_PATH,
    STORYBOOK_PREVIEW_PATH,
    COMPONENT_TABLE_PATH,
    VISUAL_SPEC_PATH,
    E2E_WORKFLOW_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
    PACKAGE_JSON_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(ROOT, filePath).split(path.sep).join('/'));

  return {
    name: 'Visual regression policy, Storybook, test suite, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required visual-regression watcher files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkStorybookCoverage(mainContent, previewContent, componentTableContent) {
  const findings = [];

  if (!/framework:\s*\{[\s\S]*?@storybook\/nextjs/.test(mainContent)) {
    findings.push('storybook main config missing @storybook/nextjs framework');
  }
  if (!/autodocs:\s*'tag'/.test(mainContent)) {
    findings.push('storybook main config missing autodocs tag mode');
  }
  if (!/argTypesRegex:\s*'\^on\[A-Z\]\.\*'/.test(previewContent)) {
    findings.push('storybook preview missing actions argTypesRegex defaults');
  }

  const componentRows = (componentTableContent.match(/^\| `components\//gm) || []).length;
  if (componentRows < 10) {
    findings.push(`component props table appears incomplete (rows: ${componentRows})`);
  }

  return {
    name: 'Storybook + component table baseline is present',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? [`component props rows: ${componentRows}`]
        : findings,
  };
}

function checkVisualSpecCoverage(visualSpecContent) {
  const findings = [];

  for (const theme of ['dark', 'light', 'forest', 'ocean']) {
    if (!new RegExp(`'${theme}'`).test(visualSpecContent)) {
      findings.push(`visual spec missing theme token: ${theme}`);
    }
  }

  if (!/width:\s*320/.test(visualSpecContent)) {
    findings.push('visual spec missing 320px viewport coverage');
  }
  if (!/width:\s*1920/.test(visualSpecContent)) {
    findings.push('visual spec missing 1920px viewport coverage');
  }
  if (!/toHaveScreenshot\(/.test(visualSpecContent)) {
    findings.push('visual spec missing screenshot assertions');
  }
  if (!/animations:\s*'disabled'/.test(visualSpecContent)) {
    findings.push('visual spec should disable animations for stable snapshots');
  }

  return {
    name: 'Visual suite covers themes + viewport extremes with screenshot diffs',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? ['visual spec includes 4 themes, 320/1920 widths, and screenshot diff assertions']
        : findings,
  };
}

function checkWorkflowCoverage(e2eWorkflowContent) {
  const findings = [];

  if (!/name:\s*Visual Regression Tests/.test(e2eWorkflowContent)) {
    findings.push('e2e workflow missing visual-regression job');
  }
  if (!/npx playwright test tests\/e2e\/visual\//.test(e2eWorkflowContent)) {
    findings.push('e2e workflow visual job missing tests/e2e/visual execution');
  }
  if (!/pull_request:/.test(e2eWorkflowContent)) {
    findings.push('e2e workflow missing pull_request trigger');
  }

  return {
    name: 'PR workflow runs visual regression job',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['visual regression job exists and is PR-triggered'] : findings,
  };
}

function checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent) {
  const packageJson = JSON.parse(packageJsonContent);
  const missing = [];

  if (!(packageJson.scripts || {})[REQUIRED_SCRIPT_NAME]) {
    missing.push(`missing package script: ${REQUIRED_SCRIPT_NAME}`);
  }
  if (!ciContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    missing.push(`CI workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }
  if (!releaseContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    missing.push(`release workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }

  return {
    name: 'Visual watcher gate is wired in package scripts and workflows',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs visual watcher verification',
            '.github/workflows/release.yml runs visual watcher verification',
          ]
        : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Visual Regression Watcher Verification',
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
    const storybookMain = readFile(STORYBOOK_MAIN_PATH);
    const storybookPreview = readFile(STORYBOOK_PREVIEW_PATH);
    const componentTable = readFile(COMPONENT_TABLE_PATH);
    const visualSpec = readFile(VISUAL_SPEC_PATH);
    const e2eWorkflow = readFile(E2E_WORKFLOW_PATH);
    const packageJson = readFile(PACKAGE_JSON_PATH);
    const ciWorkflow = readFile(CI_WORKFLOW_PATH);
    const releaseWorkflow = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkStorybookCoverage(storybookMain, storybookPreview, componentTable));
    checks.push(checkVisualSpecCoverage(visualSpec));
    checks.push(checkWorkflowCoverage(e2eWorkflow));
    checks.push(checkScriptAndWorkflow(packageJson, ciWorkflow, releaseWorkflow));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `visual-regression-watcher-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `visual-regression-watcher-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-visual-regression-watcher] JSON: ${jsonPath}`);
  console.log(`[verify-visual-regression-watcher] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
