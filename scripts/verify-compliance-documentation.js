#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(process.cwd(), 'reports');
const RELEASE_SIGNOFFS_DIR = path.join(process.cwd(), 'release-signoffs');
const COMPLIANCE_DOCS_DIR = path.join(process.cwd(), 'docs', 'compliance');

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
}

function findLatestFile(directoryPath, matcher) {
  if (!fs.existsSync(directoryPath)) {
    return null;
  }

  const candidates = fs
    .readdirSync(directoryPath)
    .filter((file) => matcher.test(file))
    .map((file) => {
      const fullPath = path.join(directoryPath, file);
      return {
        file,
        fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs,
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return candidates.length > 0 ? candidates[0] : null;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function safeWriteFile(basePath, content) {
  const extension = path.extname(basePath);
  const stem = basePath.slice(0, extension ? -extension.length : undefined);
  const attempts = Array.from({ length: 6 }, (_, index) => {
    if (index === 0) {
      return basePath;
    }
    return `${stem}-${index}${extension}`;
  });

  for (const attemptPath of attempts) {
    try {
      fs.writeFileSync(attemptPath, content, 'utf8');
      return attemptPath;
    } catch (error) {
      if (!(error && typeof error === 'object' && error.code === 'EPERM')) {
        throw error;
      }
    }
  }

  throw new Error(`Unable to write report after retries due to EPERM: ${basePath}`);
}

function buildArtifactIndex(explicitReleaseTag) {
  const releaseTag = explicitReleaseTag || null;
  const index = {
    releaseTag,
    generatedAt: new Date().toISOString(),
    artifacts: [],
  };

  const latestZeroKnowledge = findLatestFile(REPORTS_DIR, /^zero-knowledge-release-.*\.json$/);
  const latestFips = findLatestFile(REPORTS_DIR, /^fips-compliance-.*\.json$/);
  const latestAccessibility = findLatestFile(REPORTS_DIR, /^accessibility-floor-.*\.json$/);
  const latestOwnership = findLatestFile(REPORTS_DIR, /^checklist-ownership-.*\.json$/);
  const latestStability = findLatestFile(REPORTS_DIR, /^stability-discipline-.*\.json$/);
  const latestBranchProtection = findLatestFile(REPORTS_DIR, /^branch-protection-.*\.json$/);
  const latestDesignToken = findLatestFile(REPORTS_DIR, /^design-token-drift-.*\.json$/);

  const signoffFile = releaseTag
    ? path.join(RELEASE_SIGNOFFS_DIR, `${releaseTag}.json`)
    : findLatestFile(RELEASE_SIGNOFFS_DIR, /^v\d+\.\d+\.\d+\.json$/)?.fullPath;

  const candidates = [
    { id: 'zero-knowledge-release', ref: latestZeroKnowledge },
    { id: 'fips-compliance', ref: latestFips },
    { id: 'accessibility-floor', ref: latestAccessibility },
    { id: 'checklist-ownership', ref: latestOwnership },
    { id: 'stability-discipline', ref: latestStability },
    { id: 'branch-protection', ref: latestBranchProtection },
    { id: 'design-token-drift', ref: latestDesignToken },
  ];

  candidates.forEach((candidate) => {
    if (!candidate.ref) {
      index.artifacts.push({
        id: candidate.id,
        status: 'missing',
        path: null,
      });
      return;
    }

    let status = 'present';
    try {
      const json = readJson(candidate.ref.fullPath);
      if (typeof json.passed === 'boolean') {
        status = json.passed ? 'pass' : 'fail';
      } else if (typeof json.success === 'boolean') {
        status = json.success ? 'pass' : 'fail';
      }
    } catch {
      status = 'present';
    }

    index.artifacts.push({
      id: candidate.id,
      status,
      path: toPosix(path.relative(process.cwd(), candidate.ref.fullPath)),
    });
  });

  if (signoffFile && fs.existsSync(signoffFile)) {
    index.artifacts.push({
      id: 'release-signoffs',
      status: 'present',
      path: toPosix(path.relative(process.cwd(), signoffFile)),
    });
  } else {
    index.artifacts.push({
      id: 'release-signoffs',
      status: 'missing',
      path: releaseTag ? `release-signoffs/${releaseTag}.json` : null,
    });
  }

  return index;
}

function buildMarkdown(index) {
  const lines = [
    '# Compliance Documentation (Auto-Generated)',
    '',
    `Generated: ${index.generatedAt}`,
    `Release: ${index.releaseTag || 'latest-available'}`,
    '',
    '## Artifact Status',
  ];

  index.artifacts.forEach((artifact) => {
    const marker = artifact.status === 'pass'
      ? '[PASS]'
      : artifact.status === 'fail'
      ? '[FAIL]'
      : artifact.status === 'missing'
      ? '[MISSING]'
      : '[PRESENT]';
    lines.push(`- ${marker} ${artifact.id}${artifact.path ? ` -> \`${artifact.path}\`` : ''}`);
  });

  lines.push('');
  lines.push('## Notes');
  lines.push('- This document is generated by `scripts/verify-compliance-documentation.js`.');
  lines.push('- FIPS module validation is tracked by `verify:fips:compliance` and included above when available.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function main() {
  const explicitReleaseTag = process.argv[2] || null;

  ensureDirectory(REPORTS_DIR);
  ensureDirectory(COMPLIANCE_DOCS_DIR);

  const index = buildArtifactIndex(explicitReleaseTag);
  const markdown = buildMarkdown(index);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportJsonPath = path.join(REPORTS_DIR, `compliance-documentation-${stamp}.json`);
  const reportMdPath = path.join(REPORTS_DIR, `compliance-documentation-${stamp}.md`);
  const docName = explicitReleaseTag
    ? `COMPLIANCE_AUTOGEN_${explicitReleaseTag}.md`
    : 'COMPLIANCE_AUTOGEN_LATEST.md';
  const complianceDocPath = path.join(COMPLIANCE_DOCS_DIR, docName);

  const persistedJsonPath = safeWriteFile(reportJsonPath, JSON.stringify(index, null, 2));
  const persistedMdPath = safeWriteFile(reportMdPath, markdown);
  const persistedComplianceDocPath = safeWriteFile(complianceDocPath, markdown);

  console.log(`[verify-compliance-documentation] JSON: ${toPosix(path.relative(process.cwd(), persistedJsonPath))}`);
  console.log(`[verify-compliance-documentation] Markdown: ${toPosix(path.relative(process.cwd(), persistedMdPath))}`);
  console.log(`[verify-compliance-documentation] Compliance doc: ${toPosix(path.relative(process.cwd(), persistedComplianceDocPath))}`);

  const hasFailingArtifact = index.artifacts.some((artifact) => artifact.status === 'fail');
  if (hasFailingArtifact) {
    process.exit(1);
  }
}

main();
