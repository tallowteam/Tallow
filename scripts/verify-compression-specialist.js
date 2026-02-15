#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'COMPRESSION_SPECIALIST_POLICY.md');
const PIPELINE_PATH = path.join(ROOT, 'lib', 'compression', 'compression-pipeline.ts');
const INDEX_PATH = path.join(ROOT, 'lib', 'compression', 'index.ts');
const ZSTD_PATH = path.join(ROOT, 'lib', 'compression', 'zstd.ts');
const TEST_PATH = path.join(ROOT, 'tests', 'unit', 'compression', 'compression-pipeline.test.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:compression:specialist';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:compression:specialist';

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
    PIPELINE_PATH,
    INDEX_PATH,
    ZSTD_PATH,
    TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(ROOT, filePath).split(path.sep).join('/'));

  return {
    name: 'Compression specialist policy, code paths, tests, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required compression specialist files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkEntropyGate(pipelineContent) {
  const findings = [];

  if (!/const HIGH_ENTROPY_THRESHOLD = 7\.5;/.test(pipelineContent)) {
    findings.push('missing HIGH_ENTROPY_THRESHOLD = 7.5 constant');
  }
  if (!/function calculateShannonEntropy\(bytes: Uint8Array\): number/.test(pipelineContent)) {
    findings.push('missing calculateShannonEntropy helper');
  }
  if (!/entropy > HIGH_ENTROPY_THRESHOLD/.test(pipelineContent)) {
    findings.push('analyzeCompressibility missing entropy threshold gate');
  }
  if (!/High entropy sample/.test(pipelineContent)) {
    findings.push('entropy skip reason text is missing');
  }

  return {
    name: 'Entropy-first gate skips files above 7.5 bits/byte',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['entropy gate constants and skip condition found'] : findings,
  };
}

function checkAlgorithmDefaults(pipelineContent, indexContent, zstdContent) {
  const findings = [];

  if (!/compressZstd\(input,\s*ZstdLevel\.DEFAULT\)/.test(pipelineContent)) {
    findings.push('Zstd compression path is not using ZstdLevel.DEFAULT');
  }
  if (!/DEFAULT = 3,/.test(zstdContent)) {
    findings.push('ZstdLevel.DEFAULT is not pinned to level 3');
  }
  if (!/if \(priority === 'speed'\)\s*\{\s*return 'lz4';\s*\}/.test(indexContent)) {
    findings.push('speed priority does not route to lz4');
  }

  const lzmaReturnMatches = indexContent.match(/return 'lzma';/g) || [];
  if (lzmaReturnMatches.length !== 1) {
    findings.push(`expected exactly one lzma return path, found ${lzmaReturnMatches.length}`);
  }
  if (!/if \(priority === 'size'\)[\s\S]*return 'lzma';/.test(indexContent)) {
    findings.push('lzma return is not scoped to size-priority branch');
  }

  return {
    name: 'Compression defaults enforce Zstd level-3 + LZ4 speed + LZMA max mode',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['algorithm routing and defaults match policy'] : findings,
  };
}

function checkUnitEvidence(testContent) {
  const findings = [];

  if (!/should skip high-entropy files before compression/.test(testContent)) {
    findings.push('missing high-entropy compression skip unit test');
  }
  if (!/expect\(analysis\.reason\)\.toContain\('High entropy sample'\)/.test(testContent)) {
    findings.push('high-entropy unit test does not assert entropy skip reason');
  }
  if (!/expect\(analysis\.reason\)\.toContain\('7\.5'\)/.test(testContent)) {
    findings.push('high-entropy unit test does not assert threshold detail');
  }

  return {
    name: 'Unit tests cover entropy skip behavior',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['high-entropy test coverage found in compression pipeline tests'] : findings,
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
    name: 'Compression specialist gate is wired in package scripts and workflows',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs compression specialist verification',
            '.github/workflows/release.yml runs compression specialist verification',
          ]
        : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Compression Specialist Verification',
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
    const pipelineContent = readFile(PIPELINE_PATH);
    const indexContent = readFile(INDEX_PATH);
    const zstdContent = readFile(ZSTD_PATH);
    const testContent = readFile(TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkEntropyGate(pipelineContent));
    checks.push(checkAlgorithmDefaults(pipelineContent, indexContent, zstdContent));
    checks.push(checkUnitEvidence(testContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `compression-specialist-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `compression-specialist-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-compression-specialist] JSON: ${jsonPath}`);
  console.log(`[verify-compression-specialist] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
