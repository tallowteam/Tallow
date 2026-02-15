#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PRICING_CONFIG_PATH = path.join(ROOT, 'lib', 'payments', 'pricing-config.ts');
const PRICING_PAGE_PATH = path.join(ROOT, 'app', 'pricing', 'page.tsx');
const WEBHOOK_PATH = path.join(ROOT, 'app', 'api', 'stripe', 'webhook', 'route.ts');
const SUBSCRIPTION_STORE_PATH = path.join(ROOT, 'lib', 'payments', 'subscription-store.ts');
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
    PRICING_CONFIG_PATH,
    PRICING_PAGE_PATH,
    WEBHOOK_PATH,
    SUBSCRIPTION_STORE_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];
  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/'));

  return {
    name: 'Pricing architecture files exist',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['pricing, webhook, state store, and workflow files found'] : missing.map((item) => `missing: ${item}`),
  };
}

function checkFourTierPricing(configContent, pricingPageContent) {
  const failures = [];

  const tierLineMatch = configContent.match(/export\s+type\s+PlanTier\s*=\s*([^;]+);/);
  if (!tierLineMatch) {
    failures.push('missing PlanTier definition');
  } else {
    const tierLine = tierLineMatch[1];
    ['free', 'pro', 'business', 'enterprise'].forEach((tier) => {
      if (!tierLine.includes(`'${tier}'`)) {
        failures.push(`PlanTier missing '${tier}'`);
      }
    });
  }

  ['free:', 'pro:', 'business:', 'enterprise:'].forEach((token) => {
    if (!configContent.includes(token)) {
      failures.push(`PRICING_PLANS missing token: ${token}`);
    }
  });

  const pageTierTokens = ["'free', 'pro', 'business', 'enterprise'", 'Choose Enterprise'];
  if (!pageTierTokens.some((token) => pricingPageContent.includes(token))) {
    failures.push('pricing page does not expose all four tiers');
  }

  return {
    name: 'Pricing includes Free, Pro, Business, and Enterprise tiers',
    pass: failures.length === 0,
    details: failures.length === 0 ? ['four-tier pricing exists in config and is rendered on pricing page'] : failures,
  };
}

function checkStripePriceIds(configContent) {
  const required = [
    'PRO_MONTHLY',
    'PRO_YEARLY',
    'BUSINESS_MONTHLY',
    'BUSINESS_YEARLY',
    'ENTERPRISE_MONTHLY',
    'ENTERPRISE_YEARLY',
  ];
  const missing = required.filter((token) => !configContent.includes(token));

  return {
    name: 'Stripe price map covers Pro/Business/Enterprise monthly and yearly plans',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['all required Stripe price identifiers are present'] : missing.map((token) => `missing token: ${token}`),
  };
}

function checkWebhookIdempotency(webhookContent) {
  const required = [
    'const processedEvents = new Set<string>()',
    'function isEventProcessed(eventId: string): boolean',
    'function markEventProcessed(eventId: string): void',
    'if (isEventProcessed(event.id))',
    'markEventProcessed(event.id)',
  ];
  const missing = required.filter((token) => !webhookContent.includes(token));

  return {
    name: 'Stripe webhooks apply idempotency checks',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['webhook handler guards against duplicate event processing'] : missing.map((token) => `missing token: ${token}`),
  };
}

function checkNoLocalPaymentData(subscriptionStoreContent) {
  const bannedTokens = [
    'cardNumber',
    'card_number',
    'cvc',
    'cvv',
    'paymentMethod',
    'payment_method',
    'billingAddress',
    'bankAccount',
  ];
  const hits = bannedTokens.filter((token) => subscriptionStoreContent.includes(token));

  return {
    name: 'Client subscription store avoids local raw payment data',
    pass: hits.length === 0,
    details: hits.length === 0
      ? ['no raw payment method fields found in local subscription store']
      : hits.map((token) => `found potential payment data token: ${token}`),
  };
}

function checkWorkflowGates(ciContent, releaseContent) {
  const failures = [];
  const required = ['pricing-architecture:', 'npm run verify:pricing:architecture'];

  required.forEach((token) => {
    if (!ciContent.includes(token)) {
      failures.push(`ci.yml missing token: ${token}`);
    }
    if (!releaseContent.includes(token)) {
      failures.push(`release.yml missing token: ${token}`);
    }
  });

  return {
    name: 'CI/release workflows enforce pricing architecture verification',
    pass: failures.length === 0,
    details: failures.length === 0 ? ['pricing architecture gate is wired in CI and release workflows'] : failures,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Pricing Architecture Verification',
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
    const configContent = readFile(PRICING_CONFIG_PATH);
    const pricingPageContent = readFile(PRICING_PAGE_PATH);
    const webhookContent = readFile(WEBHOOK_PATH);
    const subscriptionStoreContent = readFile(SUBSCRIPTION_STORE_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkFourTierPricing(configContent, pricingPageContent));
    checks.push(checkStripePriceIds(configContent));
    checks.push(checkWebhookIdempotency(webhookContent));
    checks.push(checkNoLocalPaymentData(subscriptionStoreContent));
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
  const jsonPath = path.join(reportsDirectory, `pricing-architecture-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `pricing-architecture-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-pricing-architecture] JSON: ${jsonPath}`);
  console.log(`[verify-pricing-architecture] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
