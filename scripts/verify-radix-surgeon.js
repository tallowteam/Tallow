#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'RADIX_SURGEON_POLICY.md');
const TOKENS_PATH = path.join(ROOT, 'lib', 'ui', 'radix-surgeon.ts');
const MODAL_PATH = path.join(ROOT, 'components', 'ui', 'Modal.tsx');
const CONFIRM_DIALOG_PATH = path.join(ROOT, 'components', 'ui', 'ConfirmDialog.tsx');
const COMMAND_PALETTE_PATH = path.join(ROOT, 'components', 'transfer', 'TransferCommandPalette.tsx');
const TOKENS_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'ui', 'radix-surgeon.test.ts');
const MODAL_TEST_PATH = path.join(ROOT, 'components', 'ui', 'Modal.test.tsx');
const COMMAND_PALETTE_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'components', 'transfer', 'TransferCommandPalette.test.tsx');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:radix:surgeon';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:radix:surgeon';

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
    MODAL_PATH,
    CONFIRM_DIALOG_PATH,
    COMMAND_PALETTE_PATH,
    TOKENS_TEST_PATH,
    MODAL_TEST_PATH,
    COMMAND_PALETTE_TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Radix surgeon policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required radix-surgeon files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkTokenContract(tokensContent) {
  const findings = [];
  const requiredTokens = [
    'RADIX_SURGEON_BEHAVIOR_PRIMITIVES',
    "'dialog'",
    "'focus-trap'",
    "'escape-dismiss'",
    "'backdrop-dismiss'",
    'RADIX_SURGEON_COMPOSITION_SURFACES',
    "'components/ui/Modal.tsx'",
    "'components/ui/ConfirmDialog.tsx'",
    "'components/transfer/TransferCommandPalette.tsx'",
    'isRadixSurgeonBehaviorPrimitive',
  ];

  for (const token of requiredTokens) {
    if (!tokensContent.includes(token)) {
      findings.push(`missing radix-surgeon token contract: ${token}`);
    }
  }

  return {
    name: 'Token contract defines behavior primitives and composition surfaces',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['radix-surgeon token contract defines governed behavior and composition surfaces']
      : findings,
  };
}

function checkModalBehavior(modalContent) {
  const findings = [];
  const requiredTokens = [
    'FocusTrap',
    'focusTrapRef.current.activate()',
    'KeyboardKeys.ESCAPE',
    'closeOnBackdropClick = true',
    'closeOnEscape = true',
    'role="dialog"',
    'aria-modal="true"',
    'data-modal-backdrop',
  ];

  for (const token of requiredTokens) {
    if (!modalContent.includes(token)) {
      findings.push(`missing modal behavior token: ${token}`);
    }
  }

  return {
    name: 'Shared modal primitive owns core dialog accessibility behavior',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['modal primitive contains focus trap, dismissal controls, and dialog semantics']
      : findings,
  };
}

function checkCompositionDiscipline(confirmDialogContent, commandPaletteContent) {
  const findings = [];

  if (!confirmDialogContent.includes('<Modal')) {
    findings.push('ConfirmDialog does not compose shared Modal primitive');
  }
  if (!commandPaletteContent.includes('<Modal')) {
    findings.push('TransferCommandPalette does not compose shared Modal primitive');
  }

  const forbiddenTokens = ['createPortal', 'FocusTrap', 'role="dialog"', 'aria-modal="true"'];
  for (const token of forbiddenTokens) {
    if (confirmDialogContent.includes(token)) {
      findings.push(`ConfirmDialog re-implements modal behavior token: ${token}`);
    }
    if (commandPaletteContent.includes(token)) {
      findings.push(`TransferCommandPalette re-implements modal behavior token: ${token}`);
    }
  }

  return {
    name: 'Overlay surfaces compose shared behavior instead of re-implementing it',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['ConfirmDialog and TransferCommandPalette compose Modal without duplicating behavior logic']
      : findings,
  };
}

function checkTests(tokensTestContent, modalTestContent, commandPaletteTestContent) {
  const findings = [];
  const requiredTokenCases = [
    'defines governed behavior primitives for overlay accessibility',
    'defines composition surfaces that consume shared overlay behavior',
    'detects governed behavior primitive identifiers',
  ];
  const requiredModalCases = [
    'calls onClose when Escape is pressed and closeOnEscape is true',
    'calls onClose when backdrop is clicked and closeOnBackdropClick is true',
    'traps focus within modal',
  ];
  const requiredCommandPaletteCases = [
    'opens via Ctrl+K keyboard shortcut',
    'opens via Cmd+K keyboard shortcut',
    'closes when Escape is pressed',
  ];

  for (const testName of requiredTokenCases) {
    if (!tokensTestContent.includes(testName)) {
      findings.push(`missing radix-surgeon token test case: ${testName}`);
    }
  }
  for (const testName of requiredModalCases) {
    if (!modalTestContent.includes(testName)) {
      findings.push(`missing modal behavior test case: ${testName}`);
    }
  }
  for (const testName of requiredCommandPaletteCases) {
    if (!commandPaletteTestContent.includes(testName)) {
      findings.push(`missing command palette behavior test case: ${testName}`);
    }
  }

  return {
    name: 'Unit tests cover behavior invariants and composition surfaces',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['token, modal, and command palette tests cover required AGENT 035 behavior contracts']
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
    name: 'Radix surgeon gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs radix-surgeon verification',
          '.github/workflows/release.yml runs radix-surgeon verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Radix Surgeon Verification',
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
    const modalContent = readFile(MODAL_PATH);
    const confirmDialogContent = readFile(CONFIRM_DIALOG_PATH);
    const commandPaletteContent = readFile(COMMAND_PALETTE_PATH);
    const tokensTestContent = readFile(TOKENS_TEST_PATH);
    const modalTestContent = readFile(MODAL_TEST_PATH);
    const commandPaletteTestContent = readFile(COMMAND_PALETTE_TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkTokenContract(tokensContent));
    checks.push(checkModalBehavior(modalContent));
    checks.push(checkCompositionDiscipline(confirmDialogContent, commandPaletteContent));
    checks.push(checkTests(tokensTestContent, modalTestContent, commandPaletteTestContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `radix-surgeon-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `radix-surgeon-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-radix-surgeon] JSON: ${jsonPath}`);
  console.log(`[verify-radix-surgeon] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
