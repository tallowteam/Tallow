#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'CLI_OPERATOR_POLICY.md');
const CLI_ROOT_PATH = path.join(ROOT, 'tallow-cli');
const ROOT_COMMAND_PATH = path.join(ROOT, 'tallow-cli', 'internal', 'cli', 'root.go');
const SEND_COMMAND_PATH = path.join(ROOT, 'tallow-cli', 'internal', 'cli', 'send.go');
const RECEIVE_COMMAND_PATH = path.join(ROOT, 'tallow-cli', 'internal', 'cli', 'receive.go');
const PROTOCOL_CODES_PATH = path.join(ROOT, 'tallow-cli', 'pkg', 'protocol', 'codes.go');
const PROTOCOL_CODES_TEST_PATH = path.join(ROOT, 'tallow-cli', 'pkg', 'protocol', 'codes_test.go');
const TRANSFER_SENDER_PATH = path.join(ROOT, 'tallow-cli', 'internal', 'transfer', 'sender.go');
const TRANSFER_RECEIVER_PATH = path.join(ROOT, 'tallow-cli', 'internal', 'transfer', 'receiver.go');
const CLI_README_PATH = path.join(ROOT, 'tallow-cli', 'README.md');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:cli:operator';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:cli:operator';

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

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
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
    CLI_ROOT_PATH,
    ROOT_COMMAND_PATH,
    SEND_COMMAND_PATH,
    RECEIVE_COMMAND_PATH,
    PROTOCOL_CODES_PATH,
    PROTOCOL_CODES_TEST_PATH,
    TRANSFER_SENDER_PATH,
    TRANSFER_RECEIVER_PATH,
    CLI_README_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'CLI operator policy, command files, transfer paths, tests, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required CLI operator files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkCommandSurface(rootContent, sendContent, receiveContent) {
  const findings = [];

  if (!/Use:\s+"tallow"/.test(rootContent)) {
    findings.push('root command usage is not set to "tallow"');
  }
  if (!/Use:\s+"send <file>"/.test(sendContent)) {
    findings.push('send command usage is missing "send <file>"');
  }
  if (!/Use:\s+"receive <code>"/.test(receiveContent)) {
    findings.push('receive command usage is missing "receive <code>"');
  }
  if (!/tallow send document\.pdf/.test(rootContent)) {
    findings.push('root command help/examples do not include send usage');
  }
  if (!/tallow receive alpha-beta-gamma/.test(rootContent)) {
    findings.push('root command help/examples do not include receive usage');
  }

  return {
    name: 'CLI exposes send/receive commands with explicit usage contracts',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['send/receive command surfaces and root examples are present'] : findings,
  };
}

function checkCodePhraseFlow(sendContent, receiveContent, protocolCodesContent, protocolCodesTestContent) {
  const findings = [];

  if (!/protocol\.GenerateRoomCode/.test(sendContent)) {
    findings.push('send flow does not generate a room code phrase');
  }
  if (!/protocol\.NormalizeRoomCode/.test(receiveContent)) {
    findings.push('receive flow does not normalize room code input');
  }
  if (!/protocol\.ValidateRoomCode/.test(receiveContent)) {
    findings.push('receive flow does not validate room code input');
  }
  if (!/fmt\.Printf\("Code:\s*%s\\n", code\)/.test(sendContent) && !/Code:\s*%s/.test(sendContent)) {
    findings.push('send flow does not print generated code phrase');
  }
  if (!/func GenerateRoomCode\(/.test(protocolCodesContent)) {
    findings.push('protocol codes package missing GenerateRoomCode');
  }
  if (!/func ValidateRoomCode\(/.test(protocolCodesContent)) {
    findings.push('protocol codes package missing ValidateRoomCode');
  }
  if (!/func NormalizeRoomCode\(/.test(protocolCodesContent)) {
    findings.push('protocol codes package missing NormalizeRoomCode');
  }
  if (!/TestGenerateRoomCode/.test(protocolCodesTestContent)) {
    findings.push('protocol code tests missing TestGenerateRoomCode');
  }

  return {
    name: 'Send/receive code phrase generation + normalization/validation are enforced',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['code phrase and protocol code validation paths are present with tests'] : findings,
  };
}

function checkSecureHandshake(sendContent, receiveContent) {
  const findings = [];

  if (!/performPAKESender\(/.test(sendContent)) {
    findings.push('send flow missing PAKE sender handshake');
  }
  if (!/performPAKEReceiver\(/.test(receiveContent)) {
    findings.push('receive flow missing PAKE receiver handshake');
  }
  if (!/performHybridExchange\(/.test(sendContent)) {
    findings.push('send flow missing hybrid exchange');
  }
  if (!/performHybridExchangeReceiver\(/.test(receiveContent)) {
    findings.push('receive flow missing hybrid exchange receiver path');
  }
  if (!/crypto\.Blake3DeriveKey\("tallow-final-key-v1"/.test(sendContent)) {
    findings.push('send flow missing final key derivation domain separator');
  }
  if (!/crypto\.Blake3DeriveKey\("tallow-final-key-v1"/.test(receiveContent)) {
    findings.push('receive flow missing final key derivation domain separator');
  }

  return {
    name: 'CLI transfer path enforces PAKE + hybrid exchange + final key derivation',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['secure handshake primitives are present in send and receive paths'] : findings,
  };
}

function checkTransferPath(sendContent, receiveContent, senderContent, receiverContent) {
  const findings = [];

  if (!/sender\.Prepare\(\)/.test(sendContent)) {
    findings.push('send flow missing sender.Prepare()');
  }
  if (!/sender\.Send\(ctx\)/.test(sendContent)) {
    findings.push('send flow missing sender.Send(ctx)');
  }
  if (!/receiver\.Receive\(ctx\)/.test(receiveContent)) {
    findings.push('receive flow missing receiver.Receive(ctx)');
  }
  if (!/receiver\.OutputPath\(\)/.test(receiveContent)) {
    findings.push('receive flow missing output-path reporting');
  }
  if (!/tryLocalDiscovery\(/.test(sendContent) || !/connectToRelay\(/.test(sendContent)) {
    findings.push('send flow missing local-discovery to relay fallback chain');
  }
  if (!/tryLocalConnection\(/.test(receiveContent) || !/connectToRelay\(/.test(receiveContent)) {
    findings.push('receive flow missing local-discovery to relay fallback chain');
  }
  if (!/type Sender struct/.test(senderContent)) {
    findings.push('transfer sender implementation missing sender type');
  }
  if (!/type Receiver struct/.test(receiverContent)) {
    findings.push('transfer receiver implementation missing receiver type');
  }

  return {
    name: 'CLI send/receive transfer execution and fallback network path exist',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['transfer preparation, send/receive execution, and fallback paths are present'] : findings,
  };
}

function checkReadmeCoverage(readmeContent) {
  const findings = [];

  if (!/## Quick Start/.test(readmeContent)) {
    findings.push('CLI README missing Quick Start section');
  }
  if (!/tallow send document\.pdf/.test(readmeContent)) {
    findings.push('CLI README missing send quick-start command');
  }
  if (!/tallow receive alpha-bear-cat/.test(readmeContent)) {
    findings.push('CLI README missing receive quick-start command');
  }
  if (!/## Commands Reference/.test(readmeContent)) {
    findings.push('CLI README missing commands reference section');
  }

  return {
    name: 'CLI documentation includes send/receive quick-start and command reference',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['README covers send/receive quick-start and command reference'] : findings,
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
    name: 'CLI operator gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs CLI operator verification',
            '.github/workflows/release.yml runs CLI operator verification',
          ]
        : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# CLI Operator Verification',
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
  const requiredFiles = checkRequiredFiles();
  checks.push(requiredFiles);

  if (requiredFiles.pass) {
    const rootContent = readFile(ROOT_COMMAND_PATH);
    const sendContent = readFile(SEND_COMMAND_PATH);
    const receiveContent = readFile(RECEIVE_COMMAND_PATH);
    const protocolCodesContent = readFile(PROTOCOL_CODES_PATH);
    const protocolCodesTestContent = readFile(PROTOCOL_CODES_TEST_PATH);
    const senderContent = readFile(TRANSFER_SENDER_PATH);
    const receiverContent = readFile(TRANSFER_RECEIVER_PATH);
    const readmeContent = readFile(CLI_README_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkCommandSurface(rootContent, sendContent, receiveContent));
    checks.push(checkCodePhraseFlow(sendContent, receiveContent, protocolCodesContent, protocolCodesTestContent));
    checks.push(checkSecureHandshake(sendContent, receiveContent));
    checks.push(checkTransferPath(sendContent, receiveContent, senderContent, receiverContent));
    checks.push(checkReadmeCoverage(readmeContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `cli-operator-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `cli-operator-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-cli-operator] JSON: ${jsonPath}`);
  console.log(`[verify-cli-operator] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
