#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const ANALYTICS_PATH = path.join(ROOT, 'lib', 'analytics', 'plausible.ts');
const ANALYTICS_PROVIDER_PATH = path.join(ROOT, 'lib', 'analytics', 'analytics-provider.tsx');
const COOKIE_BANNER_PATH = path.join(ROOT, 'components', 'ui', 'CookieBanner.tsx');
const FLAGS_ROUTE_PATH = path.join(ROOT, 'app', 'api', 'flags', 'route.ts');
const SENTRY_PATH = path.join(ROOT, 'lib', 'monitoring', 'sentry.ts');
const PRIVACY_PAGE_PATH = path.join(ROOT, 'app', 'privacy', 'page.tsx');
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
    ANALYTICS_PATH,
    ANALYTICS_PROVIDER_PATH,
    COOKIE_BANNER_PATH,
    FLAGS_ROUTE_PATH,
    SENTRY_PATH,
    PRIVACY_PAGE_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/'));

  return {
    name: 'Analytics privacy files exist',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['analytics, privacy, and workflow files found'] : missing.map((item) => `missing: ${item}`),
  };
}

function checkConsentFailClosed(analyticsContent, bannerContent) {
  const failures = [];
  const analyticsRequired = [
    "localStorage.getItem('tallow-analytics-consent')",
    "return consent === 'true'",
    'return false; // Fail closed for privacy',
  ];
  const bannerRequired = [
    'showDecline = true',
    "localStorage.setItem('tallow-analytics-consent', 'false')",
    'analytics.setConsent(false)',
  ];

  analyticsRequired.forEach((token) => {
    if (!analyticsContent.includes(token)) {
      failures.push(`missing analytics token: ${token}`);
    }
  });
  bannerRequired.forEach((token) => {
    if (!bannerContent.includes(token)) {
      failures.push(`missing cookie banner token: ${token}`);
    }
  });

  return {
    name: 'Analytics consent is explicit and fail-closed by default',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['consent requires explicit opt-in and includes decline path']
      : failures,
  };
}

function checkNoCookieTracking(analyticsContent, providerContent, bannerContent) {
  const disallowedPatterns = [
    /document\.cookie/i,
    /request\.cookies/i,
    /set-cookie/i,
  ];
  const joined = `${analyticsContent}\n${providerContent}\n${bannerContent}`;
  const matches = disallowedPatterns.filter((pattern) => pattern.test(joined)).map((pattern) => pattern.toString());

  return {
    name: 'Analytics path avoids cookie-based tracking mechanisms',
    pass: matches.length === 0,
    details: matches.length === 0
      ? ['no cookie read/write primitives found in analytics provider/banner path']
      : matches.map((match) => `disallowed pattern detected: ${match}`),
  };
}

function checkAggregateOnlyMetrics(analyticsContent) {
  const requiredSignals = [
    'TransferStartedProps',
    'TransferCompletedProps',
    'fileCount',
    'totalSize',
    'duration',
  ];
  const bannedTokens = [
    'email',
    'phone',
    'fullName',
    'firstName',
    'lastName',
    'address',
    'ssn',
    'cardNumber',
    'creditCard',
    'ipAddress',
  ];

  const missingRequired = requiredSignals.filter((token) => !analyticsContent.includes(token));
  const bannedHits = bannedTokens.filter((token) => analyticsContent.includes(token));
  const failures = [
    ...missingRequired.map((token) => `missing aggregate signal token: ${token}`),
    ...bannedHits.map((token) => `potential PII token found in analytics payload code: ${token}`),
  ];

  return {
    name: 'Analytics events stay aggregate and avoid PII fields',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['analytics payload helpers are aggregate-only and contain no PII field names']
      : failures,
  };
}

function checkSentryPIIScrubbing(sentryContent) {
  const required = [
    'beforeSend',
    'scrubPII',
    'scrubObjectPII',
    'sendDefaultPii: false',
    'hashUserIdSync',
  ];
  const missing = required.filter((token) => !sentryContent.includes(token));

  return {
    name: 'Error tracking path strips PII before emission',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['Sentry pipeline uses pre-send scrubbing and disables default PII sending']
      : missing.map((token) => `missing token: ${token}`),
  };
}

function checkFlagsDefaultDisabled(flagsContent) {
  const required = [
    'plausible_analytics: false',
    'sentry_tracking: false',
  ];
  const missing = required.filter((token) => !flagsContent.includes(token));

  return {
    name: 'Analytics and tracking flags are disabled by default',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['feature flag defaults disable plausible analytics and sentry tracking']
      : missing.map((token) => `missing default-disabled token: ${token}`),
  };
}

function checkPrivacyPolicyDisclosesOptIn(privacyContent) {
  const required = [
    'analytics are',
    'off by default',
    'enabled only with explicit',
  ];
  const missing = required.filter((token) => !privacyContent.toLowerCase().includes(token));

  return {
    name: 'Privacy policy documents analytics opt-in behavior',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['privacy page states analytics are optional and default-disabled']
      : missing.map((token) => `privacy policy missing phrase: ${token}`),
  };
}

function checkWorkflowGates(ciContent, releaseContent) {
  const failures = [];
  const required = ['analytics-privacy:', 'npm run verify:analytics:privacy'];

  required.forEach((token) => {
    if (!ciContent.includes(token)) {
      failures.push(`ci.yml missing token: ${token}`);
    }
    if (!releaseContent.includes(token)) {
      failures.push(`release.yml missing token: ${token}`);
    }
  });

  return {
    name: 'CI/release workflows enforce analytics privacy verification',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['analytics privacy gate is wired in CI and release workflows']
      : failures,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Analytics Privacy Verification',
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
    const analyticsContent = readFile(ANALYTICS_PATH);
    const providerContent = readFile(ANALYTICS_PROVIDER_PATH);
    const bannerContent = readFile(COOKIE_BANNER_PATH);
    const flagsContent = readFile(FLAGS_ROUTE_PATH);
    const sentryContent = readFile(SENTRY_PATH);
    const privacyContent = readFile(PRIVACY_PAGE_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkConsentFailClosed(analyticsContent, bannerContent));
    checks.push(checkNoCookieTracking(analyticsContent, providerContent, bannerContent));
    checks.push(checkAggregateOnlyMetrics(analyticsContent));
    checks.push(checkSentryPIIScrubbing(sentryContent));
    checks.push(checkFlagsDefaultDisabled(flagsContent));
    checks.push(checkPrivacyPolicyDisclosesOptIn(privacyContent));
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
  const jsonPath = path.join(reportsDirectory, `analytics-privacy-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `analytics-privacy-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-analytics-privacy] JSON: ${jsonPath}`);
  console.log(`[verify-analytics-privacy] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
