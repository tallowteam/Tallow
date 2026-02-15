#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'security', 'CLOUDFLARE_OPERATOR_POLICY.md');
const TUNNEL_CONFIG_PATH = path.join(ROOT, 'cloudflare', 'tunnel', 'config.yml');
const TUNNEL_COMPOSE_PATH = path.join(ROOT, 'cloudflare', 'tunnel', 'docker-compose.cloudflared.yml');
const EDGE_WORKER_PATH = path.join(ROOT, 'cloudflare', 'workers', 'signaling-edge-worker.js');
const WAF_RULES_PATH = path.join(ROOT, 'cloudflare', 'waf', 'waf-rules.json');
const R2_CLIENT_PATH = path.join(ROOT, 'lib', 'cloud', 'cloudflare-r2.ts');
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
    POLICY_PATH,
    TUNNEL_CONFIG_PATH,
    TUNNEL_COMPOSE_PATH,
    EDGE_WORKER_PATH,
    WAF_RULES_PATH,
    R2_CLIENT_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/'));

  return {
    name: 'Cloudflare operator baseline files exist',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['policy, tunnel, worker, waf, r2, and workflow files found'] : missing.map((item) => `missing: ${item}`),
  };
}

function checkTunnelAlwaysActive(composeContent, configContent) {
  const composeRequired = [
    'cloudflared:',
    'restart: unless-stopped',
    'CLOUDFLARE_TUNNEL_TOKEN',
    'command: tunnel --config /etc/cloudflared/config.yml run',
  ];
  const configRequired = [
    'tallow.manisahome.com',
    'signal.tallow.manisahome.com',
    'service: http_status:404',
  ];
  const missing = [];

  composeRequired.forEach((token) => {
    if (!composeContent.includes(token)) {
      missing.push(`tunnel compose missing token: ${token}`);
    }
  });
  configRequired.forEach((token) => {
    if (!configContent.includes(token)) {
      missing.push(`tunnel config missing token: ${token}`);
    }
  });

  return {
    name: 'Cloudflare tunnel is configured as always-on with explicit ingress',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['tunnel compose defines always-on restart and ingress routes for app + signaling']
      : missing,
  };
}

function checkR2EncryptionAtRest(r2Content) {
  const matches = r2Content.match(/x-amz-server-side-encryption'\s*:\s*'AES256'/g) || [];
  const hasContext = r2Content.includes('encrypted BEFORE leaving the sender device');

  const pass = matches.length >= 2 && hasContext;
  const details = pass
    ? ['R2 upload paths enforce AES256 server-side encryption and preserve E2E encryption context']
    : [
        `expected >=2 AES256 SSE headers, found ${matches.length}`,
        hasContext ? 'e2e context string present' : 'missing e2e context string',
      ];

  return {
    name: 'R2 fallback enforces encryption-at-rest for stored ciphertext',
    pass,
    details,
  };
}

function checkEdgeWorker(workerContent) {
  const required = [
    'export default',
    'async fetch(request, env)',
    'SIGNALING_ORIGIN',
    "cache-control', 'no-store'",
    "'x-tallow-edge', 'cloudflare-worker'",
  ];
  const missing = required.filter((token) => !workerContent.includes(token));

  return {
    name: 'Edge worker is defined for signaling proxy behavior',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['edge worker fetch handler proxies signaling with cache bypass']
      : missing.map((token) => `missing token: ${token}`),
  };
}

function checkWafEnabled(wafContent) {
  let parsed;
  try {
    parsed = JSON.parse(wafContent);
  } catch (error) {
    return {
      name: 'WAF policy is enabled with explicit rules',
      pass: false,
      details: [`invalid JSON: ${error instanceof Error ? error.message : String(error)}`],
    };
  }

  const rules = Array.isArray(parsed.rules) ? parsed.rules : [];
  const enabledRules = rules.filter((rule) => rule && rule.enabled === true);

  const pass = parsed.waf && parsed.waf.enabled === true && rules.length > 0 && enabledRules.length === rules.length;
  return {
    name: 'WAF policy is enabled with explicit rules',
    pass,
    details: pass
      ? [`waf enabled with ${rules.length} enabled rules`]
      : [
          `waf.enabled=${String(parsed?.waf?.enabled)}`,
          `rules=${rules.length}`,
          `enabledRules=${enabledRules.length}`,
        ],
  };
}

function checkPolicyDocument(policyContent) {
  const required = [
    'Cloudflare Tunnel',
    'R2 uploads enforce server-side encryption',
    'Cloudflare Worker',
    'Cloudflare WAF',
    'npm run verify:cloudflare:operator',
  ];
  const missing = required.filter((token) => !policyContent.includes(token));

  return {
    name: 'Cloudflare operator policy document is present and actionable',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['policy captures tunnel, r2, worker, waf, and verifier enforcement']
      : missing.map((token) => `missing policy token: ${token}`),
  };
}

function checkWorkflowGates(ciContent, releaseContent) {
  const failures = [];
  const required = ['cloudflare-operator:', 'npm run verify:cloudflare:operator'];

  required.forEach((token) => {
    if (!ciContent.includes(token)) {
      failures.push(`ci.yml missing token: ${token}`);
    }
    if (!releaseContent.includes(token)) {
      failures.push(`release.yml missing token: ${token}`);
    }
  });

  return {
    name: 'CI/release workflows enforce cloudflare operator verification',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['cloudflare operator gate is wired in CI and release workflows']
      : failures,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Cloudflare Operator Verification',
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
    const policyContent = readFile(POLICY_PATH);
    const configContent = readFile(TUNNEL_CONFIG_PATH);
    const composeContent = readFile(TUNNEL_COMPOSE_PATH);
    const workerContent = readFile(EDGE_WORKER_PATH);
    const wafContent = readFile(WAF_RULES_PATH);
    const r2Content = readFile(R2_CLIENT_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkTunnelAlwaysActive(composeContent, configContent));
    checks.push(checkR2EncryptionAtRest(r2Content));
    checks.push(checkEdgeWorker(workerContent));
    checks.push(checkWafEnabled(wafContent));
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
  const jsonPath = path.join(reportsDirectory, `cloudflare-operator-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `cloudflare-operator-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-cloudflare-operator] JSON: ${jsonPath}`);
  console.log(`[verify-cloudflare-operator] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
