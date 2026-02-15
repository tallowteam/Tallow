#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
}

function extractAlertBlocks(rulesContent) {
  const lines = rulesContent.split(/\r?\n/);
  const blocks = [];
  let current = null;

  for (const line of lines) {
    const alertMatch = line.match(/^\s*-\s*alert:\s*(\S+)/);
    if (alertMatch) {
      if (current) {
        blocks.push(current);
      }
      current = {
        name: alertMatch[1],
        lines: [line],
      };
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    blocks.push(current);
  }

  return blocks;
}

function findAlert(blocks, name) {
  return blocks.find((block) => block.name === name);
}

function writeReports(report) {
  const outputDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const jsonPath = path.join(outputDir, `monitoring-readiness-${stamp}.json`);
  const mdPath = path.join(outputDir, `monitoring-readiness-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const lines = [
    '# Monitoring Readiness Validation',
    `Generated: ${report.timestamp}`,
    '',
    '## Checks',
    ...report.checks.map((check) => `- ${check.pass ? '[PASS]' : '[FAIL]'} ${check.name}`),
    '',
    '## Required Dashboards',
    ...report.dashboards.map((dash) => `- ${dash.exists ? '[PASS]' : '[FAIL]'} ${dash.file}`),
    '',
    '## Required Alerts',
    ...report.alerts.map((alert) => `- ${alert.pass ? '[PASS]' : '[FAIL]'} ${alert.name}`),
    '',
    '## Summary',
    `- Overall: ${report.passed ? 'PASS' : 'FAIL'}`,
  ];

  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8');
  return { jsonPath, mdPath };
}

function main() {
  const rulesPath = path.join(process.cwd(), 'monitoring', 'alerting', 'prometheus-rules.yml');
  const alertManagerPath = path.join(process.cwd(), 'monitoring', 'alerting', 'alertmanager.yml');
  const dashboardFiles = [
    'monitoring/grafana/tallow-overview.json',
    'monitoring/grafana/tallow-performance.json',
    'monitoring/grafana/tallow-transfers.json',
    'monitoring/grafana/tallow-errors.json',
  ];

  ensureFile(rulesPath);
  ensureFile(alertManagerPath);

  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  const alertManagerContent = fs.readFileSync(alertManagerPath, 'utf8');
  const alertBlocks = extractAlertBlocks(rulesContent);

  const checks = [];

  const dashboards = dashboardFiles.map((file) => ({
    file,
    exists: fs.existsSync(path.join(process.cwd(), file)),
  }));
  checks.push({
    name: 'Grafana dashboards exist for overview/errors/performance/transfers',
    pass: dashboards.every((d) => d.exists),
  });

  const serviceDownAlert = findAlert(alertBlocks, 'ServiceDown');
  const apiErrorRateAlert = findAlert(alertBlocks, 'HighAPIErrorRate');
  const latencyAlert = findAlert(alertBlocks, 'HighConnectionTime');

  const alerts = [
    {
      name: 'ServiceDown',
      pass: !!serviceDownAlert,
    },
    {
      name: 'HighAPIErrorRate (>5%)',
      pass:
        !!apiErrorRateAlert &&
        apiErrorRateAlert.lines.join('\n').includes('> 0.05'),
    },
    {
      name: 'HighConnectionTime (>10s)',
      pass:
        !!latencyAlert &&
        latencyAlert.lines.join('\n').includes('> 10'),
    },
  ];
  checks.push({
    name: 'Prometheus rules include server down, >5% error rate, and >10s latency alerts',
    pass: alerts.every((a) => a.pass),
  });

  const alertRoutingPass =
    alertManagerContent.includes("receiver: 'critical-alerts'") &&
    alertManagerContent.includes("receiver: 'performance-alerts'") &&
    alertManagerContent.includes("receiver: 'security-alerts'");
  checks.push({
    name: 'Alertmanager routes critical/performance/security notifications',
    pass: alertRoutingPass,
  });

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    dashboards,
    alerts,
    passed: checks.every((check) => check.pass),
  };

  const reportPaths = writeReports(report);
  console.log(`[verify-monitoring-readiness] JSON: ${reportPaths.jsonPath}`);
  console.log(`[verify-monitoring-readiness] Markdown: ${reportPaths.mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
