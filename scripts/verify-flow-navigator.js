#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'FLOW_NAVIGATOR_POLICY.md');
const SIDEBAR_COMPONENT_PATH = path.join(ROOT, 'components', 'transfer', 'Sidebar.tsx');
const SIDEBAR_CSS_PATH = path.join(ROOT, 'components', 'transfer', 'sidebar.module.css');
const TRANSFER_E2E_PATH = path.join(ROOT, 'tests', 'e2e', 'transfer-page.spec.ts');
const NAVIGATION_E2E_PATH = path.join(ROOT, 'tests', 'e2e', 'navigation.spec.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:flow:navigator';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:flow:navigator';

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
    SIDEBAR_COMPONENT_PATH,
    SIDEBAR_CSS_PATH,
    TRANSFER_E2E_PATH,
    NAVIGATION_E2E_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(ROOT, filePath).split(path.sep).join('/'));

  return {
    name: 'Flow navigator policy, sources, tests, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required flow navigator files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkNavigationSemantics(sidebarContent) {
  const findings = [];

  if (!/data-nav-surface="desktop-sidebar"/.test(sidebarContent)) {
    findings.push('desktop sidebar data-nav-surface marker is missing');
  }
  if (!/data-nav-surface="mobile-tabbar"/.test(sidebarContent)) {
    findings.push('mobile tabbar data-nav-surface marker is missing');
  }
  if (!/aria-current=\{activeMode === mode\.id \? 'true' : undefined\}/.test(sidebarContent)) {
    findings.push('active mode buttons are missing aria-current semantics');
  }
  if (!/role="tab"/.test(sidebarContent) || !/aria-selected=/.test(sidebarContent)) {
    findings.push('panel navigation is missing tab role/aria-selected semantics');
  }

  return {
    name: 'Transfer navigation surfaces expose orientation semantics',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['desktop/mobile markers + active-state aria semantics are present'] : findings,
  };
}

function checkResponsiveExclusivity(sidebarCssContent) {
  const findings = [];

  if (!/\.mobileTabBar\s*\{\s*display:\s*none;/.test(sidebarCssContent)) {
    findings.push('mobile tab bar default hidden state is missing');
  }
  if (!/@media \(max-width: 768px\)[\s\S]*?\.sidebar\s*\{\s*display:\s*none;/.test(sidebarCssContent)) {
    findings.push('mobile breakpoint does not hide desktop sidebar');
  }
  if (!/@media \(max-width: 768px\)[\s\S]*?\.mobileTabBar[\s\S]*?display:\s*flex;/.test(sidebarCssContent)) {
    findings.push('mobile breakpoint does not show mobile tab bar');
  }

  return {
    name: 'Responsive CSS enforces sidebar/tabbar exclusivity',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['desktop/mobile nav visibility split confirmed in sidebar CSS'] : findings,
  };
}

function checkE2ECoverage(transferSpecContent, navigationSpecContent) {
  const findings = [];

  if (!/should show only one navigation surface per viewport/.test(transferSpecContent)) {
    findings.push('transfer e2e spec missing nav-surface exclusivity test');
  }
  if (!/data-nav-surface="desktop-sidebar"/.test(transferSpecContent)) {
    findings.push('transfer e2e spec does not assert desktop sidebar marker');
  }
  if (!/data-nav-surface="mobile-tabbar"/.test(transferSpecContent)) {
    findings.push('transfer e2e spec does not assert mobile tabbar marker');
  }
  if (!/should support browser back button across primary routes/.test(navigationSpecContent)) {
    findings.push('navigation e2e spec missing browser back-button test');
  }
  if (!/page\.goBack\(\)/.test(navigationSpecContent)) {
    findings.push('navigation e2e spec lacks explicit page.goBack assertions');
  }

  return {
    name: 'E2E coverage includes exclusivity and browser back-button behavior',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['flow navigator e2e assertions detected in transfer + navigation suites'] : findings,
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
    name: 'Flow navigator gate is wired in package scripts and workflows',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs flow navigator verification',
            '.github/workflows/release.yml runs flow navigator verification',
          ]
        : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Flow Navigator Verification',
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
    const sidebarContent = readFile(SIDEBAR_COMPONENT_PATH);
    const sidebarCssContent = readFile(SIDEBAR_CSS_PATH);
    const transferSpecContent = readFile(TRANSFER_E2E_PATH);
    const navigationSpecContent = readFile(NAVIGATION_E2E_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkNavigationSemantics(sidebarContent));
    checks.push(checkResponsiveExclusivity(sidebarCssContent));
    checks.push(checkE2ECoverage(transferSpecContent, navigationSpecContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `flow-navigator-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `flow-navigator-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-flow-navigator] JSON: ${jsonPath}`);
  console.log(`[verify-flow-navigator] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
