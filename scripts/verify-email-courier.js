#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const EMAIL_API_ROUTE_PATH = path.join(ROOT, 'app', 'api', 'email', 'send', 'route.ts');
const EMAIL_TEMPLATE_PATH = path.join(ROOT, 'lib', 'email', 'email-templates.ts');
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
    EMAIL_API_ROUTE_PATH,
    EMAIL_TEMPLATE_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];
  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/'));

  return {
    name: 'Email courier files exist',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['email API/template and workflow files found'] : missing.map((item) => `missing: ${item}`),
  };
}

function checkUnsubscribeSupport(apiRouteContent, templateContent) {
  const requiredTokens = [
    'withUnsubscribeFooter',
    'List-Unsubscribe',
    'unsubscribe@tallow.app',
    'Unsubscribe',
  ];
  const failures = [];

  requiredTokens.forEach((token) => {
    const inApi = apiRouteContent.includes(token);
    const inTemplate = templateContent.includes(token);
    if (!inApi && !inTemplate) {
      failures.push(`missing token in API/template: ${token}`);
    }
  });

  return {
    name: 'Outgoing emails include unsubscribe controls',
    pass: failures.length === 0,
    details: failures.length === 0 ? ['unsubscribe footer and List-Unsubscribe headers are present'] : failures,
  };
}

function checkNoTrackingPixels(apiRouteContent, templateContent) {
  const pixelPattern = /<img[^>]*(width=['"]?1['"]?|height=['"]?1['"]?)[^>]*>/i;
  const trackingPixelPattern = /tracking\s*pixel/i;

  const foundInApi = pixelPattern.test(apiRouteContent) || trackingPixelPattern.test(apiRouteContent);
  const foundInTemplate = pixelPattern.test(templateContent) || trackingPixelPattern.test(templateContent);

  const pass = !foundInApi && !foundInTemplate;
  return {
    name: 'Email delivery path avoids tracking pixels',
    pass,
    details: pass
      ? ['no 1x1 tracking pixel patterns found in API/template content']
      : ['tracking pixel-like patterns detected in email API/template'],
  };
}

function checkResponsiveTemplateBaseline(templateContent) {
  const requiredTokens = [
    'meta name="viewport"',
    'max-width: 100%',
  ];
  const missing = requiredTokens.filter((token) => !templateContent.includes(token));

  return {
    name: 'Email templates include mobile-responsive baseline',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['viewport + max-width mobile-safe formatting found'] : missing.map((token) => `missing token: ${token}`),
  };
}

function checkPrivacyRespectingApiFlow(apiRouteContent) {
  const requiredTokens = [
    'sanitizeEmailInput',
    'validateEmailDetailed',
    'sanitizeText',
    'requireCSRFToken',
    'emailRateLimiter',
  ];
  const missing = requiredTokens.filter((token) => !apiRouteContent.includes(token));

  return {
    name: 'Email API enforces privacy-respecting validation and abuse controls',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['input sanitization, CSRF, and rate-limiting controls are active'] : missing.map((token) => `missing token: ${token}`),
  };
}

function checkWorkflowGates(ciContent, releaseContent) {
  const failures = [];
  const required = ['email-courier:', 'npm run verify:email:courier'];

  required.forEach((token) => {
    if (!ciContent.includes(token)) {
      failures.push(`ci.yml missing token: ${token}`);
    }
    if (!releaseContent.includes(token)) {
      failures.push(`release.yml missing token: ${token}`);
    }
  });

  return {
    name: 'CI/release workflows enforce email courier verification',
    pass: failures.length === 0,
    details: failures.length === 0 ? ['email courier gate is wired in CI and release workflows'] : failures,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Email Courier Verification',
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
    const apiRouteContent = readFile(EMAIL_API_ROUTE_PATH);
    const templateContent = readFile(EMAIL_TEMPLATE_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkUnsubscribeSupport(apiRouteContent, templateContent));
    checks.push(checkNoTrackingPixels(apiRouteContent, templateContent));
    checks.push(checkResponsiveTemplateBaseline(templateContent));
    checks.push(checkPrivacyRespectingApiFlow(apiRouteContent));
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
  const jsonPath = path.join(reportsDirectory, `email-courier-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `email-courier-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-email-courier] JSON: ${jsonPath}`);
  console.log(`[verify-email-courier] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
