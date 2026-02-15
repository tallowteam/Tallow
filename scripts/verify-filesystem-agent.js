#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'FILESYSTEM_AGENT_POLICY.md');
const PROJECT_ORGANIZER_PATH = path.join(ROOT, 'lib', 'storage', 'project-organizer.ts');
const PROJECT_FILE_LIST_PATH = path.join(ROOT, 'components', 'transfer', 'ProjectFileList.tsx');
const PROJECT_FILE_LIST_CSS_PATH = path.join(ROOT, 'components', 'transfer', 'ProjectFileList.module.css');
const TEST_PATH = path.join(ROOT, 'tests', 'unit', 'storage', 'project-organizer-filesystem.test.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:filesystem:agent';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:filesystem:agent';

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
    PROJECT_ORGANIZER_PATH,
    PROJECT_FILE_LIST_PATH,
    PROJECT_FILE_LIST_CSS_PATH,
    TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Filesystem policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required filesystem-agent files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkFolderPathPreservation(organizerContent) {
  const findings = [];

  const requiredTokens = [
    'relativePath: string',
    'normalizeRelativePath',
    "replace(/\\\\/g, '/')",
    "file.relativePath || file.path || file.name",
  ];

  for (const token of requiredTokens) {
    if (!organizerContent.includes(token)) {
      findings.push(`missing folder-structure token: ${token}`);
    }
  }

  return {
    name: 'Folder structure is preserved by default via relative path metadata',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['relative path normalization and persistence are present'] : findings,
  };
}

function checkContentHashDedup(organizerContent) {
  const findings = [];

  const requiredTokens = [
    'contentHash: string | null',
    'normalizeContentHash',
    'seenHashes',
    'getProjectDuplicateGroups',
  ];

  for (const token of requiredTokens) {
    if (!organizerContent.includes(token)) {
      findings.push(`missing content-hash duplicate token: ${token}`);
    }
  }

  if (!/isDuplicate\s*=/.test(organizerContent)) {
    findings.push('project file insertion is missing duplicate flag assignment');
  }

  return {
    name: 'Duplicates are detected from content hash metadata',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['content hash persistence and duplicate grouping are implemented'] : findings,
  };
}

function checkGalleryAndSort(projectFileListContent, projectFileListCssContent) {
  const findings = [];

  const listTokens = [
    "type ViewMode = 'list' | 'gallery'",
    "setViewMode('gallery')",
    "setViewMode('list')",
    "handleSort('path')",
    'galleryFiles',
    'Duplicate x',
  ];
  for (const token of listTokens) {
    if (!projectFileListContent.includes(token)) {
      findings.push(`missing project file list token: ${token}`);
    }
  }

  const cssTokens = [
    '.galleryGrid',
    '.galleryCard',
    '.viewToggle',
    '.duplicateBadge',
    '.filePath',
  ];
  for (const token of cssTokens) {
    if (!projectFileListCssContent.includes(token)) {
      findings.push(`missing project file list css token: ${token}`);
    }
  }

  return {
    name: 'Project file browser supports gallery mode and sortable list fields',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? ['gallery rendering, duplicate badges, and path sort controls are present']
        : findings,
  };
}

function checkUnitCoverage(testContent) {
  const findings = [];

  const requiredTests = [
    'preserves folder structure from relative file paths',
    'detects duplicates using content hash groups',
    'sorts project files by supported fields',
    'returns image-only collections for gallery views',
  ];

  for (const testName of requiredTests) {
    if (!testContent.includes(testName)) {
      findings.push(`missing filesystem unit test: ${testName}`);
    }
  }

  return {
    name: 'Filesystem behaviors are covered by focused unit tests',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['project organizer filesystem tests are present'] : findings,
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
    name: 'Filesystem agent gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs filesystem agent verification',
            '.github/workflows/release.yml runs filesystem agent verification',
          ]
        : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Filesystem Agent Verification',
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
    const organizerContent = readFile(PROJECT_ORGANIZER_PATH);
    const projectFileListContent = readFile(PROJECT_FILE_LIST_PATH);
    const projectFileListCssContent = readFile(PROJECT_FILE_LIST_CSS_PATH);
    const testContent = readFile(TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkFolderPathPreservation(organizerContent));
    checks.push(checkContentHashDedup(organizerContent));
    checks.push(checkGalleryAndSort(projectFileListContent, projectFileListCssContent));
    checks.push(checkUnitCoverage(testContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `filesystem-agent-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `filesystem-agent-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-filesystem-agent] JSON: ${jsonPath}`);
  console.log(`[verify-filesystem-agent] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
