#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'THEME_ALCHEMIST_POLICY.md');
const THEME_PROVIDER_PATH = path.join(ROOT, 'components', 'theme', 'theme-provider.tsx');
const THEME_SCRIPT_PATH = path.join(ROOT, 'components', 'theme', 'theme-script.tsx');
const LAYOUT_PATH = path.join(ROOT, 'app', 'layout.tsx');
const GLOBALS_PATH = path.join(ROOT, 'app', 'globals.css');
const SETTINGS_PAGE_PATH = path.join(ROOT, 'app', 'settings', 'page.tsx');
const VISUAL_SPEC_PATH = path.join(ROOT, 'tests', 'e2e', 'visual', 'visual-regression.spec.ts');
const PROVIDER_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'theme', 'theme-provider.test.tsx');
const SCRIPT_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'theme', 'theme-script.test.tsx');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:theme:alchemist';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:theme:alchemist';

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
    THEME_PROVIDER_PATH,
    THEME_SCRIPT_PATH,
    LAYOUT_PATH,
    GLOBALS_PATH,
    SETTINGS_PAGE_PATH,
    VISUAL_SPEC_PATH,
    PROVIDER_TEST_PATH,
    SCRIPT_TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Theme policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required theme-alchemist files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkThemeBootstrap(themeScriptContent, layoutContent) {
  const findings = [];

  const scriptTokens = [
    "localStorage.getItem('theme')",
    "window.matchMedia('(prefers-color-scheme: dark)').matches",
    "document.documentElement.setAttribute('data-theme', theme)",
    "savedTheme === 'dark'",
    "savedTheme === 'light'",
    "savedTheme === 'forest'",
    "savedTheme === 'ocean'",
  ];
  for (const token of scriptTokens) {
    if (!themeScriptContent.includes(token)) {
      findings.push(`missing theme bootstrap token: ${token}`);
    }
  }

  if (!layoutContent.includes("import { ThemeScript }")) {
    findings.push('app/layout.tsx does not import ThemeScript');
  }
  if (!/<head>[\s\S]*<ThemeScript\s*\/>[\s\S]*<\/head>/m.test(layoutContent)) {
    findings.push('app/layout.tsx is missing <ThemeScript /> in <head>');
  }

  return {
    name: 'No-FOUC theme bootstrap is present before hydration',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['ThemeScript bootstrap and head integration are present']
      : findings,
  };
}

function checkThemeRuntime(providerContent, globalsContent, settingsContent) {
  const findings = [];

  const providerTokens = [
    "document.documentElement.setAttribute('data-theme', theme)",
    "localStorage.setItem('theme', theme)",
  ];
  for (const token of providerTokens) {
    if (!providerContent.includes(token)) {
      findings.push(`missing theme runtime token: ${token}`);
    }
  }

  if (providerContent.includes('setTimeout(')) {
    findings.push('theme-provider contains setTimeout; instant theme switch should be state-driven');
  }

  const globalThemeTokens = [
    "[data-theme='light']",
    "[data-theme='forest']",
    "[data-theme='ocean']",
  ];
  for (const token of globalThemeTokens) {
    if (!globalsContent.includes(token)) {
      findings.push(`missing theme selector: ${token}`);
    }
  }

  const settingsTokens = ["setTheme('dark')", "setTheme('light')", "setTheme('forest')", "setTheme('ocean')"];
  for (const token of settingsTokens) {
    if (!settingsContent.includes(token)) {
      findings.push(`settings UI missing baseline theme control: ${token}`);
    }
  }

  return {
    name: 'Baseline themes are runtime-backed and user-selectable',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['theme provider, CSS selectors, and settings controls cover dark/light/forest/ocean']
      : findings,
  };
}

function checkVisualMatrix(visualSpecContent) {
  const findings = [];

  const requiredTokens = ['dark', 'light', 'forest', 'ocean'];
  for (const token of requiredTokens) {
    if (!new RegExp(`'${token}'`).test(visualSpecContent)) {
      findings.push(`visual spec missing theme token: ${token}`);
    }
  }

  if (!/const THEMES\s*=\s*\[[^\]]+\]/m.test(visualSpecContent)) {
    findings.push('visual spec missing THEMES matrix declaration');
  }

  return {
    name: 'Visual regression matrix includes all baseline themes',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['visual regression spec covers dark/light/forest/ocean themes']
      : findings,
  };
}

function checkTests(providerTestContent, scriptTestContent) {
  const findings = [];

  const providerCases = [
    'uses saved theme on mount',
    'falls back to system preference when no saved theme exists',
    'updates data-theme and localStorage when switching themes',
  ];
  for (const testName of providerCases) {
    if (!providerTestContent.includes(testName)) {
      findings.push(`missing theme-provider test case: ${testName}`);
    }
  }

  const scriptCases = [
    'includes no-FOUC theme bootstrap logic with system preference fallback',
    'supports required dark, light, forest, and ocean themes',
  ];
  for (const testName of scriptCases) {
    if (!scriptTestContent.includes(testName)) {
      findings.push(`missing theme-script test case: ${testName}`);
    }
  }

  return {
    name: 'Unit tests cover no-FOUC and first-visit preference behavior',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['theme-provider and theme-script tests include required AGENT 034 cases']
      : findings,
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
    name: 'Theme alchemist gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs theme-alchemist verification',
          '.github/workflows/release.yml runs theme-alchemist verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Theme Alchemist Verification',
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
    const themeProviderContent = readFile(THEME_PROVIDER_PATH);
    const themeScriptContent = readFile(THEME_SCRIPT_PATH);
    const layoutContent = readFile(LAYOUT_PATH);
    const globalsContent = readFile(GLOBALS_PATH);
    const settingsContent = readFile(SETTINGS_PAGE_PATH);
    const visualSpecContent = readFile(VISUAL_SPEC_PATH);
    const providerTestContent = readFile(PROVIDER_TEST_PATH);
    const scriptTestContent = readFile(SCRIPT_TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkThemeBootstrap(themeScriptContent, layoutContent));
    checks.push(checkThemeRuntime(themeProviderContent, globalsContent, settingsContent));
    checks.push(checkVisualMatrix(visualSpecContent));
    checks.push(checkTests(providerTestContent, scriptTestContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `theme-alchemist-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `theme-alchemist-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-theme-alchemist] JSON: ${jsonPath}`);
  console.log(`[verify-theme-alchemist] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
