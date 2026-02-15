#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const POLICY_PATH = path.join(process.cwd(), 'docs', 'governance', 'FORM_VALIDATION_POLICY.md');
const SCOPE_PATH = path.join(process.cwd(), 'docs', 'governance', 'FORM_POLICY_SCOPE.json');

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function evaluateRule(rule, content) {
  switch (rule) {
    case 'imports-form-policy':
      return content.includes('@/lib/forms/form-policy');
    case 'no-alert':
      return !/\balert\s*\(/.test(content);
    case 'has-label':
      return /<label\b/.test(content) || /\blabel=/.test(content);
    case 'has-error-channel':
      return /role=["']alert["']/.test(content) || /error=\{/.test(content) || /toast\?\.(error|warning)\(/.test(content);
    case 'has-focus-management':
      return /focusFieldById\s*\(/.test(content) || /\.focus\s*\(/.test(content) || /\bautoFocus\b/.test(content);
    default:
      return false;
  }
}

function buildReport() {
  const failures = [];
  const fileResults = [];

  if (!fs.existsSync(POLICY_PATH)) {
    failures.push('Missing policy document: docs/governance/FORM_VALIDATION_POLICY.md');
  }

  if (!fs.existsSync(SCOPE_PATH)) {
    failures.push('Missing scope definition: docs/governance/FORM_POLICY_SCOPE.json');
    return {
      timestamp: new Date().toISOString(),
      passed: false,
      failures,
      fileResults,
    };
  }

  const scope = readJson(SCOPE_PATH);
  const files = Array.isArray(scope.files) ? scope.files : [];

  files.forEach((fileSpec, index) => {
    const relativePath = typeof fileSpec.path === 'string' ? fileSpec.path : '';
    const rules = Array.isArray(fileSpec.rules) ? fileSpec.rules : [];
    const absolutePath = path.join(process.cwd(), relativePath);

    if (!relativePath) {
      failures.push(`Scope entry ${index} missing path`);
      return;
    }

    if (!fs.existsSync(absolutePath)) {
      failures.push(`Missing governed form file: ${relativePath}`);
      return;
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    const ruleResults = rules.map((rule) => ({
      rule,
      pass: evaluateRule(rule, content),
    }));

    const failedRules = ruleResults.filter((ruleResult) => !ruleResult.pass).map((ruleResult) => ruleResult.rule);
    if (failedRules.length > 0) {
      failures.push(`${relativePath} failed rules: ${failedRules.join(', ')}`);
    }

    fileResults.push({
      file: relativePath,
      checks: ruleResults,
      pass: failedRules.length === 0,
    });
  });

  return {
    timestamp: new Date().toISOString(),
    passed: failures.length === 0,
    failures,
    fileResults,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Form Validation Policy Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    `Overall: ${report.passed ? 'PASS' : 'FAIL'}`,
    '',
    '## File Checks',
  ];

  report.fileResults.forEach((fileResult) => {
    lines.push(`- ${fileResult.pass ? '[PASS]' : '[FAIL]'} ${fileResult.file}`);
    fileResult.checks.forEach((check) => {
      lines.push(`  - ${check.pass ? '[PASS]' : '[FAIL]'} ${check.rule}`);
    });
  });

  if (report.failures.length > 0) {
    lines.push('');
    lines.push('## Failures');
    report.failures.forEach((failure) => lines.push(`- ${failure}`));
  }

  lines.push('');
  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const report = buildReport();
  const reportsDirectory = path.join(process.cwd(), 'reports');
  ensureDirectory(reportsDirectory);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `form-policy-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `form-policy-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-form-policy] JSON: ${toPosix(path.relative(process.cwd(), jsonPath))}`);
  console.log(`[verify-form-policy] Markdown: ${toPosix(path.relative(process.cwd(), mdPath))}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
