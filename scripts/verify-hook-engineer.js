#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'HOOK_ENGINEER_POLICY.md');
const TRANSFER_HOOK_PATH = path.join(ROOT, 'lib', 'hooks', 'use-transfer-orchestrator.ts');
const ROOM_HOOK_PATH = path.join(ROOT, 'lib', 'hooks', 'use-room-connection.ts');
const P2P_HOOK_PATH = path.join(ROOT, 'lib', 'hooks', 'use-p2p-connection.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:hook:engineer';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:hook:engineer';

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

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
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

function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function checkRequiredFiles() {
  const requiredFiles = [
    POLICY_PATH,
    TRANSFER_HOOK_PATH,
    ROOM_HOOK_PATH,
    P2P_HOOK_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Hook engineer policy, core hooks, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required hook engineer files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkExplicitReturnTypes(transferContent, roomContent, p2pContent) {
  const missing = [];

  if (!/export function useTransferOrchestrator\s*\([\s\S]*?\)\s*:\s*UseTransferOrchestratorReturn/.test(transferContent)) {
    missing.push('useTransferOrchestrator missing explicit UseTransferOrchestratorReturn annotation');
  }
  if (!/export function useRoomConnection\s*\([\s\S]*?\)\s*:\s*UseRoomConnectionReturn/.test(roomContent)) {
    missing.push('useRoomConnection missing explicit UseRoomConnectionReturn annotation');
  }
  if (!/export function useP2PConnection\s*\(\)\s*:\s*UseP2PConnectionReturn/.test(p2pContent)) {
    missing.push('useP2PConnection missing explicit UseP2PConnectionReturn annotation');
  }

  return {
    name: 'Core WebRTC hooks expose explicit return types',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['all core hooks define explicit return types'] : missing,
  };
}

function checkJsDocCoverage(transferContent, roomContent, p2pContent) {
  const missing = [];

  if (!/\/\*\*[\s\S]*?export function useTransferOrchestrator/.test(transferContent)) {
    missing.push('useTransferOrchestrator missing JSDoc block');
  }
  if (!/\/\*\*[\s\S]*?export function useRoomConnection/.test(roomContent)) {
    missing.push('useRoomConnection missing JSDoc block');
  }
  if (!/\/\*\*[\s\S]*?export function useP2PConnection/.test(p2pContent)) {
    missing.push('useP2PConnection missing JSDoc block');
  }

  return {
    name: 'Core WebRTC hooks are documented with JSDoc',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['JSDoc blocks found for all core hooks'] : missing,
  };
}

function checkCleanupDiscipline(transferContent, roomContent, p2pContent) {
  const missing = [];

  if (!/useEffect\(\(\)\s*=>[\s\S]*?return\s*\(\)\s*=>[\s\S]*?performFullDisconnect/.test(transferContent)) {
    missing.push('useTransferOrchestrator missing unmount cleanup with performFullDisconnect');
  }
  if (!/useEffect\(\(\)\s*=>[\s\S]*?return\s*\(\)\s*=>[\s\S]*?disconnect\(\)/.test(roomContent)) {
    missing.push('useRoomConnection missing disconnect cleanup on unmount');
  }
  if (!/useEffect\(\(\)\s*=>[\s\S]*?return\s*\(\)\s*=>[\s\S]*?disconnect\(\)/.test(p2pContent)) {
    missing.push('useP2PConnection missing disconnect cleanup on unmount');
  }

  return {
    name: 'Core hooks clean up side effects and WebRTC connections on unmount',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['core hooks include useEffect cleanup and teardown paths'] : missing,
  };
}

function checkNoGetStateInCoreHooks(transferContent, roomContent, p2pContent) {
  const findings = [];
  const transferRuntime = stripComments(transferContent);
  const roomRuntime = stripComments(roomContent);
  const p2pRuntime = stripComments(p2pContent);

  if (/\.getState\(/.test(transferRuntime)) {
    findings.push('useTransferOrchestrator uses .getState()');
  }
  if (/\.getState\(/.test(roomRuntime)) {
    findings.push('useRoomConnection uses .getState()');
  }
  if (/\.getState\(/.test(p2pRuntime)) {
    findings.push('useP2PConnection uses .getState()');
  }

  return {
    name: 'Core WebRTC hooks avoid direct Zustand .getState() access',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['no .getState() usage found in core hooks'] : findings,
  };
}

function checkScriptAndWorkflow(packageJson, ciContent, releaseContent) {
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
    name: 'Hook engineer gate is wired in package scripts and workflows',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs hook engineer verification',
            '.github/workflows/release.yml runs hook engineer verification',
          ]
        : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Hook Engineer Verification',
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
    const transferContent = readFile(TRANSFER_HOOK_PATH);
    const roomContent = readFile(ROOM_HOOK_PATH);
    const p2pContent = readFile(P2P_HOOK_PATH);
    const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkExplicitReturnTypes(transferContent, roomContent, p2pContent));
    checks.push(checkJsDocCoverage(transferContent, roomContent, p2pContent));
    checks.push(checkCleanupDiscipline(transferContent, roomContent, p2pContent));
    checks.push(checkNoGetStateInCoreHooks(transferContent, roomContent, p2pContent));
    checks.push(checkScriptAndWorkflow(packageJson, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `hook-engineer-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `hook-engineer-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-hook-engineer] JSON: ${jsonPath}`);
  console.log(`[verify-hook-engineer] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
