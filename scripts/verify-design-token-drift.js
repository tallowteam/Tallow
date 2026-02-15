#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const POLICY_PATH = path.join(process.cwd(), 'docs', 'governance', 'DESIGN_TOKEN_POLICY.md');
const BASELINE_PATH = path.join(process.cwd(), 'docs', 'governance', 'DESIGN_TOKEN_DRIFT_BASELINE.json');

const SCAN_ROOTS = [
  path.join(process.cwd(), 'app'),
  path.join(process.cwd(), 'components', 'ui'),
  path.join(process.cwd(), 'components', 'transfer'),
];

const SOURCE_EXTENSIONS = new Set([
  '.css',
  '.scss',
  '.sass',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
]);

const EXCLUDED_PATTERNS = [
  /(?:^|[\\/])docs(?:[\\/]|$)/,
  /\.test\./,
  /\.spec\./,
  /\.example\./,
  /\.stories\./,
  /README/i,
  /\.md$/i,
];

const COLOR_LITERAL_REGEX = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
}

function shouldSkipFile(filePath) {
  const normalized = toPosix(path.relative(process.cwd(), filePath));
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(normalized));
}

function getSourceFiles(directoryPath, files = []) {
  if (!fs.existsSync(directoryPath)) {
    return files;
  }

  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      getSourceFiles(fullPath, files);
      return;
    }

    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      return;
    }

    if (shouldSkipFile(fullPath)) {
      return;
    }

    files.push(fullPath);
  });

  return files;
}

function isVarFallback(content, index) {
  const lookback = content.slice(Math.max(0, index - 100), index);
  const varIndex = lookback.lastIndexOf('var(');
  if (varIndex === -1) {
    return false;
  }

  const afterVar = lookback.slice(varIndex);
  return afterVar.includes(',');
}

function countColorLiterals(content) {
  let count = 0;
  let match;
  while ((match = COLOR_LITERAL_REGEX.exec(content)) !== null) {
    if (isVarFallback(content, match.index)) {
      continue;
    }
    count += 1;
  }
  return count;
}

function scanViolations() {
  const violations = {};
  const files = SCAN_ROOTS.flatMap((rootPath) => getSourceFiles(rootPath, []));

  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const count = countColorLiterals(content);
    if (count > 0) {
      const relativePath = toPosix(path.relative(process.cwd(), filePath));
      violations[relativePath] = count;
    }
  });

  return violations;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeBaseline(violations) {
  const baseline = {
    generatedAt: new Date().toISOString(),
    scope: {
      roots: SCAN_ROOTS.map((rootPath) => toPosix(path.relative(process.cwd(), rootPath))),
      excludedPatterns: EXCLUDED_PATTERNS.map((pattern) => pattern.toString()),
    },
    violations,
  };

  ensureDirectory(path.dirname(BASELINE_PATH));
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2), 'utf8');
}

function createVerificationResult(currentViolations, baselineViolations) {
  const newFiles = [];
  const increased = [];
  const unchanged = [];
  const improved = [];

  const baselineEntries = baselineViolations || {};

  Object.entries(currentViolations).forEach(([filePath, count]) => {
    const baselineCount = baselineEntries[filePath];
    if (baselineCount === undefined) {
      newFiles.push({ file: filePath, current: count });
      return;
    }

    if (count > baselineCount) {
      increased.push({ file: filePath, baseline: baselineCount, current: count });
      return;
    }

    if (count < baselineCount) {
      improved.push({ file: filePath, baseline: baselineCount, current: count });
      return;
    }

    unchanged.push({ file: filePath, current: count });
  });

  return {
    newFiles,
    increased,
    unchanged,
    improved,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Design Token Drift Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    `Overall: ${report.passed ? 'PASS' : 'FAIL'}`,
    '',
    '## Summary',
    `- Files with tracked literals (current): ${report.currentFiles}`,
    `- New violating files: ${report.newFiles.length}`,
    `- Files with increased literals: ${report.increased.length}`,
    `- Files improved vs baseline: ${report.improved.length}`,
    '',
  ];

  if (report.newFiles.length > 0) {
    lines.push('## New Violating Files');
    report.newFiles.forEach((item) => {
      lines.push(`- ${item.file}: ${item.current}`);
    });
    lines.push('');
  }

  if (report.increased.length > 0) {
    lines.push('## Increased Violations');
    report.increased.forEach((item) => {
      lines.push(`- ${item.file}: baseline=${item.baseline}, current=${item.current}`);
    });
    lines.push('');
  }

  if (report.improved.length > 0) {
    lines.push('## Improved Files');
    report.improved.forEach((item) => {
      lines.push(`- ${item.file}: baseline=${item.baseline}, current=${item.current}`);
    });
    lines.push('');
  }

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const shouldUpdateBaseline = process.argv.includes('--update-baseline');

  if (!fs.existsSync(POLICY_PATH)) {
    console.error('[verify-design-token-drift] Missing policy document: docs/governance/DESIGN_TOKEN_POLICY.md');
    process.exit(1);
  }

  const currentViolations = scanViolations();

  if (shouldUpdateBaseline) {
    writeBaseline(currentViolations);
    console.log('[verify-design-token-drift] Baseline updated: docs/governance/DESIGN_TOKEN_DRIFT_BASELINE.json');
  }

  if (!fs.existsSync(BASELINE_PATH)) {
    console.error('[verify-design-token-drift] Missing baseline. Run with --update-baseline first.');
    process.exit(1);
  }

  const baseline = readJson(BASELINE_PATH);
  const baselineViolations = baseline.violations || {};
  const diff = createVerificationResult(currentViolations, baselineViolations);

  const report = {
    timestamp: new Date().toISOString(),
    passed: diff.newFiles.length === 0 && diff.increased.length === 0,
    currentFiles: Object.keys(currentViolations).length,
    baselineFiles: Object.keys(baselineViolations).length,
    newFiles: diff.newFiles,
    increased: diff.increased,
    improved: diff.improved,
  };

  const reportsDirectory = path.join(process.cwd(), 'reports');
  ensureDirectory(reportsDirectory);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `design-token-drift-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `design-token-drift-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-design-token-drift] JSON: ${toPosix(path.relative(process.cwd(), jsonPath))}`);
  console.log(`[verify-design-token-drift] Markdown: ${toPosix(path.relative(process.cwd(), mdPath))}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
