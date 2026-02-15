#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const INCIDENT_MODULE_PATH = path.join(ROOT, 'lib', 'security', 'incident-response.ts');
const DRILL_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'security', 'incident-response-drill.test.ts');
const DEPLOYMENT_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'deployment.yml');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');
const POLICY_PATH = path.join(ROOT, 'docs', 'security', 'INCIDENT_RESPONSE_POLICY.md');
const POSTMORTEM_TEMPLATE_PATH = path.join(ROOT, 'docs', 'security', 'INCIDENT_POSTMORTEM_TEMPLATE.md');

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function checkFilesExist() {
  const missing = [];
  const requiredFiles = [
    INCIDENT_MODULE_PATH,
    DRILL_TEST_PATH,
    DEPLOYMENT_WORKFLOW_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
    POLICY_PATH,
    POSTMORTEM_TEMPLATE_PATH,
  ];

  requiredFiles.forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      missing.push(path.relative(ROOT, filePath).replace(/\\/g, '/'));
    }
  });

  return {
    name: 'Incident readiness files exist',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['incident module, tests, policy docs, and workflow files found'] : missing.map((file) => `missing: ${file}`),
  };
}

function checkCriticalResponseTimeline(incidentContent) {
  const match = incidentContent.match(/critical:\s*\{[\s\S]*?responseTimeMinutes:\s*(\d+)/);
  const minutes = match ? Number(match[1]) : Number.NaN;
  const pass = Number.isFinite(minutes) && minutes <= 15;

  return {
    name: 'P0 incident response timeline is 15 minutes or less',
    pass,
    details: pass ? [`critical responseTimeMinutes=${minutes}`] : ['critical responseTimeMinutes missing or greater than 15'],
  };
}

function checkBreachNotificationSla(incidentContent, policyContent) {
  const breachProcedureMatch = incidentContent.match(/data_breach:\s*\{[\s\S]*?notificationRequired:\s*(true|false)/);
  const notificationRequired = breachProcedureMatch ? breachProcedureMatch[1] === 'true' : false;
  const policyHas72h = policyContent.includes('72h') || policyContent.includes('72 hours');

  const pass = notificationRequired && policyHas72h;
  return {
    name: 'Data breach flow requires notification and documents 72h SLA',
    pass,
    details: pass
      ? ['data_breach notificationRequired=true and policy defines 72h breach-notification deadline']
      : ['missing data_breach notification requirement and/or 72h policy deadline'],
  };
}

function checkDrillCoverage(drillContent) {
  const requiredTokens = [
    'simulates a critical key-compromise incident through full lifecycle',
    'enforces critical response timeline',
    "getResponseTimeline('critical')",
    "expect(timeline.responseTimeMinutes).toBeLessThanOrEqual(15)",
  ];
  const missing = requiredTokens.filter((token) => !drillContent.includes(token));

  return {
    name: 'Incident drill tests cover lifecycle + timeline invariants',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['drill tests include full lifecycle and critical timeline assertions'] : missing.map((token) => `missing token: ${token}`),
  };
}

function checkPolicyAndTemplate(policyContent, templateContent) {
  const policyTokens = ['P0', '15 minutes', '72h', 'post-mortem', 'no-blame'];
  const templateTokens = ['Incident Summary', 'Timeline', 'Root Cause', 'Action Items', 'No-blame'];
  const missing = [];

  policyTokens.forEach((token) => {
    if (!policyContent.toLowerCase().includes(token.toLowerCase())) {
      missing.push(`policy missing token: ${token}`);
    }
  });
  templateTokens.forEach((token) => {
    if (!templateContent.toLowerCase().includes(token.toLowerCase())) {
      missing.push(`template missing token: ${token}`);
    }
  });

  return {
    name: 'Incident policy and post-mortem template define required process',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['policy and template include P0/72h/no-blame/post-mortem requirements'] : missing,
  };
}

function checkWorkflowAutomation(deploymentContent) {
  const requiredTokens = ['Create incident issue', "labels: ['incident', 'deployment', 'automated']"];
  const missing = requiredTokens.filter((token) => !deploymentContent.includes(token));

  return {
    name: 'Deployment workflow auto-files incident issue on rollback failure',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['deployment rollback path auto-creates incident issue with incident label'] : missing.map((token) => `missing token: ${token}`),
  };
}

function checkCiReleaseGates(ciContent, releaseContent) {
  const failures = [];
  const requiredTokens = ['incident-readiness:', 'npm run verify:incident:readiness'];

  requiredTokens.forEach((token) => {
    if (!ciContent.includes(token)) {
      failures.push(`ci.yml missing token: ${token}`);
    }
    if (!releaseContent.includes(token)) {
      failures.push(`release.yml missing token: ${token}`);
    }
  });

  return {
    name: 'CI/release workflows enforce incident readiness verification',
    pass: failures.length === 0,
    details: failures.length === 0 ? ['incident-readiness gate is wired in both CI and release workflows'] : failures,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Incident Readiness Verification',
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
    const incidentContent = readFile(INCIDENT_MODULE_PATH);
    const drillContent = readFile(DRILL_TEST_PATH);
    const deploymentContent = readFile(DEPLOYMENT_WORKFLOW_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);
    const policyContent = readFile(POLICY_PATH);
    const templateContent = readFile(POSTMORTEM_TEMPLATE_PATH);

    checks.push(checkCriticalResponseTimeline(incidentContent));
    checks.push(checkBreachNotificationSla(incidentContent, policyContent));
    checks.push(checkDrillCoverage(drillContent));
    checks.push(checkPolicyAndTemplate(policyContent, templateContent));
    checks.push(checkWorkflowAutomation(deploymentContent));
    checks.push(checkCiReleaseGates(ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const reportsDirectory = path.join(ROOT, 'reports');
  ensureDirectory(reportsDirectory);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `incident-readiness-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `incident-readiness-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-incident-readiness] JSON: ${jsonPath}`);
  console.log(`[verify-incident-readiness] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
