#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'CLIPBOARD_AGENT_POLICY.md');
const CLIPBOARD_PANEL_PATH = path.join(ROOT, 'components', 'transfer', 'ClipboardPanel.tsx');
const CLIPBOARD_AUTO_SEND_PATH = path.join(ROOT, 'lib', 'clipboard', 'auto-send.ts');
const CLIPBOARD_MONITOR_PATH = path.join(ROOT, 'lib', 'clipboard', 'clipboard-monitor.ts');
const TRANSFER_PAGE_PATH = path.join(ROOT, 'app', 'transfer', 'page.tsx');
const FEATURE_FLAGS_PATH = path.join(ROOT, 'lib', 'feature-flags', 'feature-flags.ts');
const TEST_PATH = path.join(ROOT, 'tests', 'unit', 'clipboard', 'auto-send-consent.test.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:clipboard:agent';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:clipboard:agent';

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
  const required = [
    POLICY_PATH,
    CLIPBOARD_PANEL_PATH,
    CLIPBOARD_AUTO_SEND_PATH,
    CLIPBOARD_MONITOR_PATH,
    TRANSFER_PAGE_PATH,
    FEATURE_FLAGS_PATH,
    TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Clipboard policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required clipboard agent files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkOptInDefaults(panelContent, flagsContent) {
  const findings = [];

  if (!/const \[isEnabled,\s*setIsEnabled\] = useState\(false\);/.test(panelContent)) {
    findings.push('ClipboardPanel does not default to disabled state');
  }
  if (!/clipboard_sharing:\s*false,/.test(flagsContent)) {
    findings.push('feature flags do not default clipboard_sharing to false');
  }

  return {
    name: 'Clipboard sharing is opt-in by default',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['panel and feature flag defaults are disabled'] : findings,
  };
}

function checkConsentEnforcement(autoSendContent, testContent) {
  const findings = [];

  const requiredConsentGuards = [
    'if (!callbacks.onConfirmationRequired) {',
    'const confirmed = await callbacks.onConfirmationRequired(',
  ];

  for (const token of requiredConsentGuards) {
    if (!autoSendContent.includes(token)) {
      findings.push(`auto-send missing consent guard token: ${token}`);
    }
  }

  if (!/handleFilePaste[\s\S]*onConfirmationRequired/.test(autoSendContent)) {
    findings.push('file clipboard flow missing confirmation enforcement');
  }
  if (!/handleImagePaste[\s\S]*onConfirmationRequired/.test(autoSendContent)) {
    findings.push('image clipboard flow missing confirmation enforcement');
  }
  if (!/handleTextPaste[\s\S]*onConfirmationRequired/.test(autoSendContent)) {
    findings.push('text clipboard flow missing confirmation enforcement');
  }

  const requiredTests = [
    'does not send pasted text when user declines confirmation',
    'never auto-sends clipboard payloads when confirmation callback is absent',
    'requires confirmation before file payloads are queued for send',
  ];
  for (const testName of requiredTests) {
    if (!testContent.includes(testName)) {
      findings.push(`missing consent unit test: ${testName}`);
    }
  }

  return {
    name: 'Clipboard send path enforces explicit per-send consent',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['consent guards and unit coverage are present'] : findings,
  };
}

function checkPayloadSupport(monitorContent, autoSendContent) {
  const findings = [];

  if (!/onFilePasted/.test(monitorContent) || !/onFilePasted/.test(autoSendContent)) {
    findings.push('file clipboard payload handling is incomplete');
  }
  if (!/onImagePasted/.test(monitorContent) || !/onImagePasted/.test(autoSendContent)) {
    findings.push('image clipboard payload handling is incomplete');
  }
  if (!/onTextPasted/.test(monitorContent) || !/onTextPasted/.test(autoSendContent)) {
    findings.push('text clipboard payload handling is incomplete');
  }

  return {
    name: 'Clipboard flow supports text, image, and file payloads',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['monitor and auto-send handle file/image/text payloads'] : findings,
  };
}

function checkEncryptedTransferPath(panelContent, transferPageContent) {
  const findings = [];

  if (!/addToQueue/.test(panelContent)) {
    findings.push('ClipboardPanel is not dispatching through transfer queue');
  }
  if (!/enableEncryption:\s*true/.test(transferPageContent)) {
    findings.push('transfer orchestrator is not configured with enableEncryption: true');
  }
  if (!/ClipboardPanel/.test(transferPageContent)) {
    findings.push('transfer settings view does not mount ClipboardPanel');
  }

  return {
    name: 'Clipboard payloads flow through encryption-enabled transfer runtime',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['clipboard panel dispatch and encryption-enabled transfer runtime are linked'] : findings,
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
    name: 'Clipboard agent gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs clipboard agent verification',
            '.github/workflows/release.yml runs clipboard agent verification',
          ]
        : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Clipboard Agent Verification',
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
    const panelContent = readFile(CLIPBOARD_PANEL_PATH);
    const autoSendContent = readFile(CLIPBOARD_AUTO_SEND_PATH);
    const monitorContent = readFile(CLIPBOARD_MONITOR_PATH);
    const transferPageContent = readFile(TRANSFER_PAGE_PATH);
    const flagsContent = readFile(FEATURE_FLAGS_PATH);
    const testContent = readFile(TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkOptInDefaults(panelContent, flagsContent));
    checks.push(checkConsentEnforcement(autoSendContent, testContent));
    checks.push(checkPayloadSupport(monitorContent, autoSendContent));
    checks.push(checkEncryptedTransferPath(panelContent, transferPageContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `clipboard-agent-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `clipboard-agent-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-clipboard-agent] JSON: ${jsonPath}`);
  console.log(`[verify-clipboard-agent] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
