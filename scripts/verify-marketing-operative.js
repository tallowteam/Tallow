#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const LANDING_PAGE_PATH = path.join(ROOT, 'app', 'page.tsx');
const LANDING_CSS_PATH = path.join(ROOT, 'app', 'page.module.css');
const POLICY_PATH = path.join(ROOT, 'docs', 'marketing', 'MARKETING_OPERATIVE_POLICY.md');
const LIGHTHOUSE_DIR = path.join(ROOT, 'reports', 'lighthouse');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function checkFilesExist() {
  const required = [
    LANDING_PAGE_PATH,
    LANDING_CSS_PATH,
    POLICY_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];
  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/'));

  return {
    name: 'Marketing operative files exist',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['landing, css, policy, and workflow files found'] : missing.map((item) => `missing: ${item}`),
  };
}

function getLatestLighthouseReport() {
  if (!fs.existsSync(LIGHTHOUSE_DIR)) {
    return null;
  }

  const files = fs
    .readdirSync(LIGHTHOUSE_DIR)
    .filter((name) => /^lighthouse-report-.*\.md$/.test(name))
    .map((name) => {
      const fullPath = path.join(LIGHTHOUSE_DIR, name);
      const stat = fs.statSync(fullPath);
      return { name, fullPath, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return files[0] || null;
}

function checkLighthousePerformanceAndSeo() {
  const latest = getLatestLighthouseReport();
  if (!latest) {
    return {
      name: 'Landing page keeps load-time and SEO floors',
      pass: false,
      details: ['no lighthouse report found in reports/lighthouse'],
    };
  }

  const content = readFile(latest.fullPath);
  const summaryMatch = content.match(/\|\s*http:\/\/localhost:4173\/\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/);
  const vitalsMatch = content.match(/\|\s*http:\/\/localhost:4173\/\s*\|\s*([0-9.]+)\s*ms\s*\|\s*([0-9.]+)\s*ms\s*\|\s*([0-9.]+)\s*\|/);

  if (!summaryMatch || !vitalsMatch) {
    return {
      name: 'Landing page keeps load-time and SEO floors',
      pass: false,
      details: [`failed to parse landing row from ${latest.name}`],
    };
  }

  const performance = Number(summaryMatch[1]);
  const seo = Number(summaryMatch[4]);
  const fcpMs = Number(vitalsMatch[2]);
  const pass = performance >= 90 && seo >= 90 && fcpMs < 2000;

  return {
    name: 'Landing page keeps load-time and SEO floors',
    pass,
    details: [
      `report: reports/lighthouse/${latest.name}`,
      `landing performance=${performance}`,
      `landing seo=${seo}`,
      `landing fcpMs=${fcpMs}`,
      'thresholds: performance>=90, seo>=90, fcpMs<2000',
    ],
  };
}

function checkMobileFirstCss(cssContent) {
  const required = [
    '@media (max-width: 768px)',
    '@media (max-width: 480px)',
    '@media (min-width: 768px)',
    'clamp(',
  ];
  const missing = required.filter((token) => !cssContent.includes(token));

  return {
    name: 'Landing styles keep mobile-first responsive behavior',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['mobile and desktop breakpoints plus fluid scaling are present']
      : missing.map((token) => `missing token: ${token}`),
  };
}

function checkSecurityMessagingAndTrustSignals(landingContent) {
  const required = [
    'QUANTUM-SAFE FILE TRANSFER',
    'Future-proof encryption.',
    'Read the whitepaper',
    'AES ENCRYPTED',
    'ZERO KNOWLEDGE',
    'OPEN SOURCE',
    'POST-QUANTUM SAFE',
  ];
  const missing = required.filter((token) => !landingContent.includes(token));

  return {
    name: 'Landing page keeps security messaging and trust signals prominent',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['security section and trust-strip labels are present on landing page']
      : missing.map((token) => `missing token: ${token}`),
  };
}

function checkPolicyDocument(policyContent) {
  const required = [
    'under 2 seconds',
    'SEO score',
    'mobile-first',
    'Security messaging',
    'Trust signals',
    'npm run verify:marketing:operative',
  ];
  const missing = required.filter((token) => !policyContent.includes(token));

  return {
    name: 'Marketing policy document defines enforceable floors',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['policy captures load, seo, mobile-first, security, and trust expectations']
      : missing.map((token) => `missing policy token: ${token}`),
  };
}

function checkWorkflowGates(ciContent, releaseContent) {
  const failures = [];
  const required = ['marketing-operative:', 'npm run verify:marketing:operative'];

  required.forEach((token) => {
    if (!ciContent.includes(token)) {
      failures.push(`ci.yml missing token: ${token}`);
    }
    if (!releaseContent.includes(token)) {
      failures.push(`release.yml missing token: ${token}`);
    }
  });

  return {
    name: 'CI/release workflows enforce marketing operative verification',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['marketing operative gate is wired in CI and release workflows']
      : failures,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Marketing Operative Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    '## Checks',
    ...report.checks.map((check) => `- ${check.pass ? '[PASS]' : '[FAIL]'} ${check.name}`),
    '',
  ];

  report.checks.forEach((check) => {
    lines.push(`### ${check.name}`);
    check.details.forEach((detail) => lines.push(`- ${detail}`));
    lines.push('');
  });

  lines.push('## Summary');
  lines.push(`- Overall: ${report.passed ? 'PASS' : 'FAIL'}`);
  lines.push('');

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const checks = [];
  const filesExist = checkFilesExist();
  checks.push(filesExist);

  if (filesExist.pass) {
    const landingContent = readFile(LANDING_PAGE_PATH);
    const cssContent = readFile(LANDING_CSS_PATH);
    const policyContent = readFile(POLICY_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkLighthousePerformanceAndSeo());
    checks.push(checkMobileFirstCss(cssContent));
    checks.push(checkSecurityMessagingAndTrustSignals(landingContent));
    checks.push(checkPolicyDocument(policyContent));
    checks.push(checkWorkflowGates(ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const reportsDirectory = path.join(ROOT, 'reports');
  ensureDirectory(reportsDirectory);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `marketing-operative-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `marketing-operative-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-marketing-operative] JSON: ${jsonPath}`);
  console.log(`[verify-marketing-operative] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
