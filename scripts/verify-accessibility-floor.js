#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const POLICY_PATH = path.join(process.cwd(), 'docs', 'governance', 'ACCESSIBILITY_FLOOR_POLICY.md');
const LIGHTHOUSE_DIR = path.join(process.cwd(), 'reports', 'lighthouse');
const ACCESSIBILITY_SPEC_PATH = path.join(process.cwd(), 'tests', 'e2e', 'accessibility.spec.ts');
const E2E_WORKFLOW_PATH = path.join(process.cwd(), '.github', 'workflows', 'e2e.yml');

const REQUIRED_ROUTES = ['/', '/transfer', '/features', '/how-it-works'];
const ACCESSIBILITY_SCORE_MIN = 0.95;
const REQUIRED_AUDITS = [
  'color-contrast',
  'skip-link',
  'target-size',
];

const REQUIRED_TEST_PHRASES = [
  'should tab through interactive elements on homepage',
  'should activate buttons with Enter key',
  'should activate buttons with Space key',
  'should navigate through settings with keyboard',
  'should close modals with Escape key',
  'should have skip to main content link',
];

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
}

function normalizeRoute(routeLike) {
  if (!routeLike || typeof routeLike !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(routeLike);
    const pathname = parsed.pathname || '/';
    if (pathname === '/') {
      return '/';
    }
    return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  } catch {
    return null;
  }
}

function collectLighthouseReports() {
  if (!fs.existsSync(LIGHTHOUSE_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(LIGHTHOUSE_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(LIGHTHOUSE_DIR, file));

  const reports = [];
  files.forEach((filePath) => {
    try {
      const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const route = normalizeRoute(json.finalDisplayedUrl || json.finalUrl || json.requestedUrl);
      if (!route) {
        return;
      }

      reports.push({
        filePath,
        route,
        fetchTime: Date.parse(json.fetchTime || '') || fs.statSync(filePath).mtimeMs,
        categories: json.categories || {},
        audits: json.audits || {},
      });
    } catch {
      // Ignore malformed artifacts; verifier focuses on valid reports.
    }
  });

  return reports;
}

function selectLatestByRoute(reports) {
  const latestByRoute = new Map();
  reports.forEach((report) => {
    const previous = latestByRoute.get(report.route);
    if (!previous || report.fetchTime > previous.fetchTime) {
      latestByRoute.set(report.route, report);
    }
  });
  return latestByRoute;
}

function checkLighthouseAccessibility() {
  const reports = collectLighthouseReports();
  const latestByRoute = selectLatestByRoute(reports);
  const failures = [];
  const details = [];

  REQUIRED_ROUTES.forEach((route) => {
    const report = latestByRoute.get(route);
    if (!report) {
      failures.push(`missing lighthouse JSON report for route: ${route}`);
      return;
    }

    const accessibilityCategory = report.categories.accessibility;
    const accessibilityScore = accessibilityCategory && typeof accessibilityCategory.score === 'number'
      ? accessibilityCategory.score
      : null;

    if (accessibilityScore === null || accessibilityScore < ACCESSIBILITY_SCORE_MIN) {
      failures.push(`route ${route} accessibility score below threshold: ${String(accessibilityScore)}`);
    } else {
      details.push(`route ${route} accessibility=${Math.round(accessibilityScore * 100)} from ${toPosix(path.relative(process.cwd(), report.filePath))}`);
    }

    REQUIRED_AUDITS.forEach((auditId) => {
      const audit = report.audits[auditId];
      if (!audit) {
        failures.push(`route ${route} missing audit: ${auditId}`);
        return;
      }

      if (auditId === 'color-contrast' && audit.score !== 1) {
        failures.push(`route ${route} color-contrast score=${String(audit.score)}`);
        return;
      }

      if (auditId !== 'color-contrast' && audit.score === 0) {
        failures.push(`route ${route} audit ${auditId} score=0`);
      }
    });
  });

  return {
    name: 'Lighthouse accessibility and contrast floor',
    pass: failures.length === 0,
    details: failures.length === 0 ? details : failures,
  };
}

function checkAccessibilitySuiteCoverage() {
  if (!fs.existsSync(ACCESSIBILITY_SPEC_PATH)) {
    return {
      name: 'Accessibility E2E suite includes keyboard and skip-link coverage',
      pass: false,
      details: ['missing tests/e2e/accessibility.spec.ts'],
    };
  }

  const content = fs.readFileSync(ACCESSIBILITY_SPEC_PATH, 'utf8');
  const missing = REQUIRED_TEST_PHRASES.filter((phrase) => !content.includes(phrase));

  return {
    name: 'Accessibility E2E suite includes keyboard and skip-link coverage',
    pass: missing.length === 0,
    details: missing.length === 0
      ? [`coverage phrases found in ${toPosix(path.relative(process.cwd(), ACCESSIBILITY_SPEC_PATH))}`]
      : missing.map((phrase) => `missing test phrase: "${phrase}"`),
  };
}

function checkAccessibilityWorkflow() {
  if (!fs.existsSync(E2E_WORKFLOW_PATH)) {
    return {
      name: 'CI workflow runs accessibility suite',
      pass: false,
      details: ['missing .github/workflows/e2e.yml'],
    };
  }

  const content = fs.readFileSync(E2E_WORKFLOW_PATH, 'utf8');
  const requiredTokens = [
    'accessibility:',
    'Run accessibility tests',
    'tests/e2e/accessibility.spec.ts',
  ];

  const missingTokens = requiredTokens.filter((token) => !content.includes(token));
  return {
    name: 'CI workflow runs accessibility suite',
    pass: missingTokens.length === 0,
    details: missingTokens.length === 0
      ? ['accessibility job and test command found in e2e workflow']
      : missingTokens.map((token) => `missing token: ${token}`),
  };
}

function buildMarkdownReport(report) {
  const lines = [
    '# Accessibility Floor Verification',
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
  return `${lines.join('\n')}\n`;
}

function main() {
  const checks = [];

  if (!fs.existsSync(POLICY_PATH)) {
    checks.push({
      name: 'Accessibility floor policy exists',
      pass: false,
      details: ['missing docs/governance/ACCESSIBILITY_FLOOR_POLICY.md'],
    });
  } else {
    checks.push({
      name: 'Accessibility floor policy exists',
      pass: true,
      details: ['present: docs/governance/ACCESSIBILITY_FLOOR_POLICY.md'],
    });
  }

  checks.push(checkLighthouseAccessibility());
  checks.push(checkAccessibilitySuiteCoverage());
  checks.push(checkAccessibilityWorkflow());

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const reportsDirectory = path.join(process.cwd(), 'reports');
  ensureDirectory(reportsDirectory);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `accessibility-floor-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `accessibility-floor-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(mdPath, buildMarkdownReport(report), 'utf8');

  console.log(`[verify-accessibility-floor] JSON: ${toPosix(path.relative(process.cwd(), jsonPath))}`);
  console.log(`[verify-accessibility-floor] Markdown: ${toPosix(path.relative(process.cwd(), mdPath))}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
