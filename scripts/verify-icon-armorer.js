#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'ICON_ARMORER_POLICY.md');
const TOKENS_PATH = path.join(ROOT, 'lib', 'ui', 'icon-armor.ts');
const HISTORY_PATH = path.join(ROOT, 'components', 'transfer', 'TransferHistory.tsx');
const PROGRESS_PATH = path.join(ROOT, 'components', 'transfer', 'TransferProgress.tsx');
const PROGRESS_CSS_PATH = path.join(ROOT, 'components', 'transfer', 'TransferProgress.module.css');
const TEST_PATH = path.join(ROOT, 'tests', 'unit', 'ui', 'icon-armor.test.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:icon:armorer';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:icon:armorer';

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
    TOKENS_PATH,
    HISTORY_PATH,
    PROGRESS_PATH,
    PROGRESS_CSS_PATH,
    TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Policy, icon tokens, transfer icon surfaces, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required icon-armorer files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkIconTokenAllowlist(tokensContent) {
  const missing = [];
  const requiredTokens = [
    'sm: 16',
    'md: 20',
    'lg: 24',
    'xl: 32',
    'regular: 1.5',
    'bold: 2',
    'var(--success)',
    'var(--warning)',
    'var(--destructive)',
  ];

  for (const token of requiredTokens) {
    if (!tokensContent.includes(token)) {
      missing.push(`missing token: ${token}`);
    }
  }

  return {
    name: 'Icon tokens define allowed size/stroke/security-color allowlists',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['icon armor tokens define 16/20/24/32 sizes, 1.5/2 strokes, and semantic security colors']
      : missing,
  };
}

function checkTransferIconUsage(historyContent, progressContent) {
  const failures = [];
  const requiredHistoryTokens = [
    "from '@/lib/ui/icon-armor'",
    'ICON_SIZES.sm',
    'ICON_SIZES.xl',
    'ICON_STROKES.bold',
    'var(--warning)',
    'var(--success)',
  ];
  const requiredProgressTokens = [
    "from '@/lib/ui/icon-armor'",
    'ICON_SIZES.sm',
    'ICON_SIZES.xl',
    'ICON_STROKES.bold',
    'processingIcon',
  ];

  for (const token of requiredHistoryTokens) {
    if (!historyContent.includes(token)) {
      failures.push(`transfer history missing token: ${token}`);
    }
  }
  for (const token of requiredProgressTokens) {
    if (!progressContent.includes(token)) {
      failures.push(`transfer progress missing token: ${token}`);
    }
  }

  return {
    name: 'Transfer history/progress surfaces consume icon armor tokens consistently',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['transfer icon surfaces consume centralized icon size/stroke tokens with semantic security colors']
      : failures,
  };
}

function checkProcessingMotionAndReducedMotion(cssContent) {
  const failures = [];
  const requiredTokens = [
    '.processingIcon',
    '@keyframes iconPulse',
    '@media (prefers-reduced-motion: reduce)',
    'animation: none',
  ];

  for (const token of requiredTokens) {
    if (!cssContent.includes(token)) {
      failures.push(`missing CSS token: ${token}`);
    }
  }

  return {
    name: 'Processing icon animation includes reduced-motion fallback',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['processing icon animation is present and disabled under reduced-motion preference']
      : failures,
  };
}

function checkTests(testContent) {
  const missing = [];
  const requiredCases = [
    'exposes the allowed icon size set',
    'exposes the allowed stroke widths',
    'validates icon size allowlist',
  ];

  for (const token of requiredCases) {
    if (!testContent.includes(token)) {
      missing.push(`missing test case: ${token}`);
    }
  }

  return {
    name: 'Unit tests assert icon token contracts',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['icon token unit tests cover size, stroke, and allowlist behavior']
      : missing,
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
    name: 'Icon armorer gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs icon-armorer verification',
          '.github/workflows/release.yml runs icon-armorer verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Icon Armorer Verification',
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
    const tokensContent = readFile(TOKENS_PATH);
    const historyContent = readFile(HISTORY_PATH);
    const progressContent = readFile(PROGRESS_PATH);
    const progressCssContent = readFile(PROGRESS_CSS_PATH);
    const testContent = readFile(TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkIconTokenAllowlist(tokensContent));
    checks.push(checkTransferIconUsage(historyContent, progressContent));
    checks.push(checkProcessingMotionAndReducedMotion(progressCssContent));
    checks.push(checkTests(testContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `icon-armorer-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `icon-armorer-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-icon-armorer] JSON: ${jsonPath}`);
  console.log(`[verify-icon-armorer] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
