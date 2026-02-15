#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'MODAL_MASTER_POLICY.md');
const MODAL_PATH = path.join(ROOT, 'components', 'ui', 'Modal.tsx');
const CONFIRM_DIALOG_PATH = path.join(ROOT, 'components', 'ui', 'ConfirmDialog.tsx');
const FILE_ACTIONS_PATH = path.join(ROOT, 'components', 'transfer', 'FileActions.tsx');
const COMMAND_PALETTE_PATH = path.join(ROOT, 'components', 'transfer', 'TransferCommandPalette.tsx');
const COMMAND_PALETTE_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'components', 'transfer', 'TransferCommandPalette.test.tsx');
const TRANSFER_PAGE_PATH = path.join(ROOT, 'app', 'transfer', 'page.tsx');
const MODAL_TEST_PATH = path.join(ROOT, 'components', 'ui', 'Modal.test.tsx');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:modal:master';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:modal:master';

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
    MODAL_PATH,
    CONFIRM_DIALOG_PATH,
    FILE_ACTIONS_PATH,
    COMMAND_PALETTE_PATH,
    COMMAND_PALETTE_TEST_PATH,
    TRANSFER_PAGE_PATH,
    MODAL_TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Modal policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required modal-master files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkModalFocusEscapeBackdrop(modalContent) {
  const findings = [];
  const requiredTokens = [
    'FocusTrap',
    'focusTrapRef.current = new FocusTrap(modalRef.current)',
    'focusTrapRef.current.activate()',
    'closeOnBackdropClick = true',
    'closeOnEscape = true',
    'data-modal-backdrop',
  ];

  for (const token of requiredTokens) {
    if (!modalContent.includes(token)) {
      findings.push(`missing modal behavior token: ${token}`);
    }
  }

  return {
    name: 'Modal traps focus and supports Escape/backdrop close defaults',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['focus trap and non-critical close behaviors are present in Modal.tsx']
      : findings,
  };
}

function checkDestructiveConfirmation(confirmDialogContent, fileActionsContent, modalTestContent) {
  const findings = [];
  const confirmTokens = [
    'destructive?: boolean',
    "variant={destructive ? 'danger' : 'primary'}",
    'closeOnBackdropClick={!loading}',
    'closeOnEscape={!loading}',
  ];

  for (const token of confirmTokens) {
    if (!confirmDialogContent.includes(token)) {
      findings.push(`missing confirm dialog token: ${token}`);
    }
  }

  if (!fileActionsContent.includes('<ConfirmDialog')) {
    findings.push('File actions do not enforce confirmation dialog for destructive operations');
  }

  if (!modalTestContent.includes('applies destructive variant')) {
    findings.push('Modal test suite missing destructive variant coverage');
  }

  return {
    name: 'Destructive actions require explicit confirmation patterns',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['confirm dialog destructive path is implemented and referenced by transfer file actions']
      : findings,
  };
}

function checkCommandPalette(commandPaletteContent, transferPageContent) {
  const findings = [];
  const commandTokens = [
    "(event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'",
    'onOpenChange(true)',
    'data-command-palette',
    'Search commands...',
  ];
  for (const token of commandTokens) {
    if (!commandPaletteContent.includes(token)) {
      findings.push(`missing command palette token: ${token}`);
    }
  }

  const integrationTokens = [
    'TransferCommandPalette',
    'isCommandPaletteOpen',
    'setIsCommandPaletteOpen(true)',
  ];
  for (const token of integrationTokens) {
    if (!transferPageContent.includes(token)) {
      findings.push(`missing transfer-page integration token: ${token}`);
    }
  }

  return {
    name: 'Power-user command palette is implemented and integrated',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['Ctrl/Cmd+K command palette and transfer-page integration are present']
      : findings,
  };
}

function checkUnitCoverage(modalTestContent, commandPaletteTestContent) {
  const findings = [];

  const requiredModalCases = [
    'calls onClose when backdrop is clicked and closeOnBackdropClick is true',
    'calls onClose when Escape is pressed and closeOnEscape is true',
    'traps focus within modal',
  ];
  for (const testName of requiredModalCases) {
    if (!modalTestContent.includes(testName)) {
      findings.push(`missing modal test case: ${testName}`);
    }
  }

  const requiredCommandCases = [
    'opens via Ctrl+K keyboard shortcut',
    'opens via Cmd+K keyboard shortcut',
    'runs selected command and closes palette',
    'closes when Escape is pressed',
  ];
  for (const testName of requiredCommandCases) {
    if (!commandPaletteTestContent.includes(testName)) {
      findings.push(`missing command palette test case: ${testName}`);
    }
  }

  return {
    name: 'Unit tests cover modal safety and command palette shortcuts',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['modal and command palette tests include required AGENT 042 cases']
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
    name: 'Modal master gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs modal-master verification',
          '.github/workflows/release.yml runs modal-master verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Modal Master Verification',
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
    const modalContent = readFile(MODAL_PATH);
    const confirmDialogContent = readFile(CONFIRM_DIALOG_PATH);
    const fileActionsContent = readFile(FILE_ACTIONS_PATH);
    const commandPaletteContent = readFile(COMMAND_PALETTE_PATH);
    const transferPageContent = readFile(TRANSFER_PAGE_PATH);
    const modalTestContent = readFile(MODAL_TEST_PATH);
    const commandPaletteTestContent = readFile(COMMAND_PALETTE_TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkModalFocusEscapeBackdrop(modalContent));
    checks.push(checkDestructiveConfirmation(confirmDialogContent, fileActionsContent, modalTestContent));
    checks.push(checkCommandPalette(commandPaletteContent, transferPageContent));
    checks.push(checkUnitCoverage(modalTestContent, commandPaletteTestContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `modal-master-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `modal-master-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-modal-master] JSON: ${jsonPath}`);
  console.log(`[verify-modal-master] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
