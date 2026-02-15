#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const POLICY_PATH = path.join(process.cwd(), 'docs', 'governance', 'STABILITY_DISCIPLINE_POLICY.md');
const MATRIX_PATH = path.join(process.cwd(), 'docs', 'governance', 'EXPANSION_SEQUENCE.json');
const CI_WORKFLOW_PATH = path.join(process.cwd(), '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(process.cwd(), '.github', 'workflows', 'release.yml');

const REQUIRED_CI_WORKFLOW_TOKENS = [
  'lint',
  'unit-test',
  'security-scan',
  'chaos-readiness',
  'e2e-infiltration',
  'cicd-pipeline',
  'docker-commander',
  'cloudflare-operator',
  'incident-readiness',
  'pricing-architecture',
  'email-courier',
  'analytics-privacy',
  'marketing-operative',
  'documentation-scribe',
  'automation-engineer',
  'room-system-architect',
  'contacts-friends-agent',
  'ralph-wiggum',
  'zero-knowledge-verification',
  'accessibility-floor',
];

const REQUIRED_RELEASE_WORKFLOW_TOKENS = [
  'verify-security-signoffs',
  'chaos-readiness',
  'e2e-infiltration',
  'cicd-pipeline',
  'docker-commander',
  'cloudflare-operator',
  'incident-readiness',
  'pricing-architecture',
  'email-courier',
  'analytics-privacy',
  'marketing-operative',
  'documentation-scribe',
  'automation-engineer',
  'room-system-architect',
  'contacts-friends-agent',
  'ralph-wiggum',
  'zero-knowledge-verification',
  'checklist-ownership',
  'accessibility-floor',
  'stability-discipline',
];

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function resolveReportsDirectory() {
  const preferredDirectory = path.join(process.cwd(), 'reports');
  ensureDirectory(preferredDirectory);

  const probePath = path.join(preferredDirectory, '.write-probe');
  try {
    fs.writeFileSync(probePath, 'ok', 'utf8');
    fs.unlinkSync(probePath);
    return preferredDirectory;
  } catch {
    const fallbackDirectory = path.join(process.cwd(), 'verification-reports');
    ensureDirectory(fallbackDirectory);
    return fallbackDirectory;
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function checkPolicyAndMatrixExist() {
  const missing = [];
  if (!fs.existsSync(POLICY_PATH)) {
    missing.push('docs/governance/STABILITY_DISCIPLINE_POLICY.md');
  }
  if (!fs.existsSync(MATRIX_PATH)) {
    missing.push('docs/governance/EXPANSION_SEQUENCE.json');
  }

  return {
    name: 'Policy and expansion sequence exist',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['policy and sequence files found'] : missing.map((item) => `missing: ${item}`),
  };
}

function checkMatrixSchema() {
  if (!fs.existsSync(MATRIX_PATH)) {
    return {
      name: 'Expansion sequence defines prerequisites, success criteria, and evidence format',
      pass: false,
      details: ['missing expansion sequence file'],
    };
  }

  const matrix = readJson(MATRIX_PATH);
  const failures = [];

  if (!Array.isArray(matrix.baselineGates) || matrix.baselineGates.length === 0) {
    failures.push('baselineGates must be a non-empty array');
  }

  if (!Array.isArray(matrix.categories) || matrix.categories.length === 0) {
    failures.push('categories must be a non-empty array');
  } else {
    matrix.categories.forEach((category, index) => {
      const prefix = `category[${index}]`;
      if (typeof category.id !== 'string' || category.id.trim().length === 0) {
        failures.push(`${prefix} missing id`);
      }
      if (typeof category.owner !== 'string' || category.owner.trim().length === 0) {
        failures.push(`${prefix} missing owner`);
      }
      if (!Array.isArray(category.prerequisites) || category.prerequisites.length === 0) {
        failures.push(`${prefix} missing prerequisites`);
      }
      if (!Array.isArray(category.successCriteria) || category.successCriteria.length === 0) {
        failures.push(`${prefix} missing successCriteria`);
      }
      if (!Array.isArray(category.evidenceFormat) || category.evidenceFormat.length === 0) {
        failures.push(`${prefix} missing evidenceFormat`);
      }
      if (category.requiresBaselineGreen !== true) {
        failures.push(`${prefix} requiresBaselineGreen must be true`);
      }
      if (typeof category.priority !== 'number') {
        failures.push(`${prefix} priority must be numeric`);
      }
    });
  }

  return {
    name: 'Expansion sequence defines prerequisites, success criteria, and evidence format',
    pass: failures.length === 0,
    details: failures.length === 0 ? ['all categories have prerequisites, measurable criteria, and evidence format'] : failures,
  };
}

function checkPriorityZeroCoreTransfer() {
  if (!fs.existsSync(MATRIX_PATH)) {
    return {
      name: 'Core secure transfer is Priority 0 and baseline-gated',
      pass: false,
      details: ['missing expansion sequence file'],
    };
  }

  const matrix = readJson(MATRIX_PATH);
  const core = Array.isArray(matrix.categories)
    ? matrix.categories.find((category) => category && category.id === 'core-secure-transfer')
    : null;

  if (!core) {
    return {
      name: 'Core secure transfer is Priority 0 and baseline-gated',
      pass: false,
      details: ['missing category: core-secure-transfer'],
    };
  }

  const pass = core.priority === 0 && core.requiresBaselineGreen === true;
  return {
    name: 'Core secure transfer is Priority 0 and baseline-gated',
    pass,
    details: pass
      ? ['core-secure-transfer priority=0 and requiresBaselineGreen=true']
      : [`core-secure-transfer priority=${String(core.priority)}, requiresBaselineGreen=${String(core.requiresBaselineGreen)}`],
  };
}

function checkSequencingIsExplicit() {
  if (!fs.existsSync(MATRIX_PATH)) {
    return {
      name: 'Expansion sequencing uses explicit prerequisite chain',
      pass: false,
      details: ['missing expansion sequence file'],
    };
  }

  const matrix = readJson(MATRIX_PATH);
  const categories = Array.isArray(matrix.categories) ? matrix.categories : [];
  const failures = [];

  for (let index = 1; index < categories.length; index += 1) {
    const previous = categories[index - 1];
    const current = categories[index];
    if (typeof current.priority !== 'number' || typeof previous.priority !== 'number') {
      continue;
    }
    if (current.priority <= previous.priority) {
      failures.push(`priority not strictly increasing between ${previous.id} and ${current.id}`);
    }

    if (!Array.isArray(current.prerequisites) || current.prerequisites.length === 0) {
      failures.push(`${current.id} has no prerequisites`);
    }
  }

  return {
    name: 'Expansion sequencing uses explicit prerequisite chain',
    pass: failures.length === 0,
    details: failures.length === 0 ? ['priorities increase and each category declares prerequisites'] : failures,
  };
}

function checkWorkflowsGateBaseline() {
  const missingFiles = [];
  if (!fs.existsSync(CI_WORKFLOW_PATH)) {
    missingFiles.push('.github/workflows/ci.yml');
  }
  if (!fs.existsSync(RELEASE_WORKFLOW_PATH)) {
    missingFiles.push('.github/workflows/release.yml');
  }

  if (missingFiles.length > 0) {
    return {
      name: 'CI/Release workflows gate expansion behind baseline checks',
      pass: false,
      details: missingFiles.map((item) => `missing: ${item}`),
    };
  }

  const ciContent = fs.readFileSync(CI_WORKFLOW_PATH, 'utf8');
  const releaseContent = fs.readFileSync(RELEASE_WORKFLOW_PATH, 'utf8');
  const failures = [];

  REQUIRED_CI_WORKFLOW_TOKENS.forEach((token) => {
    if (!ciContent.includes(token)) {
      failures.push(`ci.yml missing token: ${token}`);
    }
  });

  REQUIRED_RELEASE_WORKFLOW_TOKENS.forEach((token) => {
    if (!releaseContent.includes(token)) {
      failures.push(`release.yml missing token: ${token}`);
    }
  });

  return {
    name: 'CI/Release workflows gate expansion behind baseline checks',
    pass: failures.length === 0,
    details: failures.length === 0 ? ['required baseline gate tokens found in CI and release workflows'] : failures,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Stability Discipline Verification',
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
  const checks = [
    checkPolicyAndMatrixExist(),
    checkMatrixSchema(),
    checkPriorityZeroCoreTransfer(),
    checkSequencingIsExplicit(),
    checkWorkflowsGateBaseline(),
  ];

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const reportsDirectory = resolveReportsDirectory();

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `stability-discipline-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `stability-discipline-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-stability-discipline] JSON: ${jsonPath}`);
  console.log(`[verify-stability-discipline] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
