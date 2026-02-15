#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const REQUIRED_SECURITY_DOCS = [
  'app/security/page.tsx',
  'docs/security/THREAT_MODEL_MATRIX.md',
];

const REQUIRED_SECURITY_PAGE_PHRASES = [
  'zero-knowledge architecture',
  'never have access to encryption keys or plaintext data',
  'files are encrypted on your device before any network activity begins',
];

const REQUIRED_APPROVERS = ['002', '019', '078'];

const FORBIDDEN_SERVER_PATTERNS = [
  {
    name: 'Node fs import in API route',
    regex: /from\s+['"](?:node:)?fs(?:\/promises)?['"]/,
  },
  {
    name: 'Direct file write operation in API route',
    regex: /\b(writeFile|writeFileSync|createWriteStream|appendFile|appendFileSync)\b/,
  },
  {
    name: 'Server-side decrypt call in API route',
    regex: /\bdecrypt[A-Za-z0-9_]*\s*\(/,
  },
];

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function findLatestFile(directoryPath, matcher) {
  if (!fs.existsSync(directoryPath)) {
    return null;
  }

  const candidates = fs
    .readdirSync(directoryPath)
    .filter((file) => matcher.test(file))
    .map((file) => ({
      file,
      fullPath: path.join(directoryPath, file),
      mtimeMs: fs.statSync(path.join(directoryPath, file)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return candidates.length > 0 ? candidates[0] : null;
}

function resolveReleaseSignoffPath(explicitReleaseTag) {
  const signoffDirectory = path.join(process.cwd(), 'release-signoffs');

  if (explicitReleaseTag) {
    const explicitPath = path.join(signoffDirectory, `${explicitReleaseTag}.json`);
    return fs.existsSync(explicitPath)
      ? { release: explicitReleaseTag, fullPath: explicitPath }
      : null;
  }

  const latest = findLatestFile(signoffDirectory, /^v\d+\.\d+\.\d+\.json$/);
  if (!latest) {
    return null;
  }

  return {
    release: latest.file.replace(/\.json$/, ''),
    fullPath: latest.fullPath,
  };
}

function evidenceExists(evidencePath) {
  if (typeof evidencePath !== 'string' || evidencePath.trim().length === 0) {
    return false;
  }

  if (/^https?:\/\//i.test(evidencePath)) {
    return true;
  }

  return fs.existsSync(path.join(process.cwd(), evidencePath));
}

function checkRequiredDocs() {
  const missing = REQUIRED_SECURITY_DOCS.filter(
    (relativePath) => !fs.existsSync(path.join(process.cwd(), relativePath))
  );

  return {
    name: 'Required zero-knowledge docs/pages exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? REQUIRED_SECURITY_DOCS.map((doc) => `present: ${doc}`)
      : missing.map((doc) => `missing: ${doc}`),
  };
}

function checkSecurityPageClaims() {
  const securityPagePath = path.join(process.cwd(), 'app/security/page.tsx');
  if (!fs.existsSync(securityPagePath)) {
    return {
      name: 'Security page asserts zero-knowledge constraints',
      pass: false,
      details: ['missing: app/security/page.tsx'],
    };
  }

  const content = fs.readFileSync(securityPagePath, 'utf8').toLowerCase();
  const missingPhrases = REQUIRED_SECURITY_PAGE_PHRASES.filter((phrase) => !content.includes(phrase));

  return {
    name: 'Security page asserts zero-knowledge constraints',
    pass: missingPhrases.length === 0,
    details: missingPhrases.length === 0
      ? REQUIRED_SECURITY_PAGE_PHRASES.map((phrase) => `found: "${phrase}"`)
      : missingPhrases.map((phrase) => `missing phrase: "${phrase}"`),
  };
}

function checkLatestFeatureVerification() {
  const reportsDirectory = path.join(process.cwd(), 'reports');
  const latestVerificationReport = findLatestFile(reportsDirectory, /^verification-\d{4}-\d{2}-\d{2}\.json$/);

  if (!latestVerificationReport) {
    return {
      name: 'Latest feature verification confirms zero-knowledge feature',
      pass: false,
      details: ['No reports/verification-YYYY-MM-DD.json report found'],
    };
  }

  const report = readJson(latestVerificationReport.fullPath);
  const result = Array.isArray(report.results)
    ? report.results.find((item) => item && item.id === 'zero-knowledge')
    : null;

  if (!result) {
    return {
      name: 'Latest feature verification confirms zero-knowledge feature',
      pass: false,
      details: [`Report missing zero-knowledge feature result: ${toPosix(path.relative(process.cwd(), latestVerificationReport.fullPath))}`],
    };
  }

  return {
    name: 'Latest feature verification confirms zero-knowledge feature',
    pass: result.status === 'verified',
    details: [
      `report: ${toPosix(path.relative(process.cwd(), latestVerificationReport.fullPath))}`,
      `status: ${result.status}`,
      `confidence: ${result.confidence}`,
    ],
  };
}

function collectRouteFiles(directoryPath, collector = []) {
  if (!fs.existsSync(directoryPath)) {
    return collector;
  }

  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      collectRouteFiles(fullPath, collector);
      continue;
    }

    if (entry.isFile() && entry.name === 'route.ts') {
      collector.push(fullPath);
    }
  }

  return collector;
}

function findLineNumber(content, regex) {
  const match = regex.exec(content);
  if (!match || typeof match.index !== 'number') {
    return null;
  }

  const prefix = content.slice(0, match.index);
  return prefix.split(/\r?\n/).length;
}

function checkApiRoutesForPlaintextRetention() {
  const routeFiles = collectRouteFiles(path.join(process.cwd(), 'app', 'api'));
  const violations = [];

  for (const filePath of routeFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const rule of FORBIDDEN_SERVER_PATTERNS) {
      const line = findLineNumber(content, rule.regex);
      if (line !== null) {
        violations.push({
          file: toPosix(path.relative(process.cwd(), filePath)),
          rule: rule.name,
          line,
        });
      }
    }
  }

  return {
    name: 'API routes avoid plaintext persistence/decrypt logic',
    pass: violations.length === 0,
    details: violations.length === 0
      ? [`scanned ${routeFiles.length} API route files with zero violations`]
      : violations.map((violation) => `${violation.file}:${violation.line} (${violation.rule})`),
  };
}

function checkSecurityReleaseApprovals(explicitReleaseTag) {
  const signoffRef = resolveReleaseSignoffPath(explicitReleaseTag);
  if (!signoffRef) {
    return {
      name: 'Release signoff includes required security approvers (002/019/078)',
      pass: false,
      details: explicitReleaseTag
        ? [`missing signoff file: release-signoffs/${explicitReleaseTag}.json`]
        : ['No release-signoffs/v*.json file found'],
    };
  }

  const payload = readJson(signoffRef.fullPath);
  const signoffs = Array.isArray(payload.signoffs) ? payload.signoffs : [];
  const byApprover = new Map(
    signoffs
      .filter((entry) => entry && typeof entry.approver === 'string')
      .map((entry) => [entry.approver, entry])
  );

  const failures = [];
  for (const approver of REQUIRED_APPROVERS) {
    const signoff = byApprover.get(approver);
    if (!signoff) {
      failures.push(`${approver}: missing signoff entry`);
      continue;
    }

    if (signoff.status !== 'approved') {
      failures.push(`${approver}: status=${String(signoff.status)}`);
    }

    if (!evidenceExists(signoff.evidence)) {
      failures.push(`${approver}: invalid evidence path/link`);
    }
  }

  return {
    name: 'Release signoff includes required security approvers (002/019/078)',
    pass: failures.length === 0,
    details: failures.length === 0
      ? [
          `release: ${signoffRef.release}`,
          `source: ${toPosix(path.relative(process.cwd(), signoffRef.fullPath))}`,
        ]
      : failures,
  };
}

function buildMarkdownReport(report) {
  const lines = [
    '# Zero-Knowledge Release Verification',
    '',
    `Generated: ${report.timestamp}`,
    report.release ? `Release: ${report.release}` : 'Release: not specified',
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

function safeWriteFile(basePath, content) {
  const extension = path.extname(basePath);
  const stem = basePath.slice(0, extension ? -extension.length : undefined);

  const attempts = Array.from({ length: 6 }, (_, index) => {
    if (index === 0) {
      return basePath;
    }
    return `${stem}-${index}${extension}`;
  });

  for (const attemptPath of attempts) {
    try {
      fs.writeFileSync(attemptPath, content, 'utf8');
      return attemptPath;
    } catch (error) {
      if (!(error && typeof error === 'object' && error.code === 'EPERM')) {
        throw error;
      }
    }
  }

  throw new Error(`Unable to write report after retries due to EPERM: ${basePath}`);
}

function main() {
  const explicitReleaseTag = process.argv[2];
  const reportsDirectory = path.join(process.cwd(), 'reports');
  ensureDirectory(reportsDirectory);

  const checks = [
    checkRequiredDocs(),
    checkSecurityPageClaims(),
    checkLatestFeatureVerification(),
    checkApiRoutesForPlaintextRetention(),
    checkSecurityReleaseApprovals(explicitReleaseTag),
  ];

  const report = {
    timestamp: new Date().toISOString(),
    release: explicitReleaseTag || null,
    checks,
    passed: checks.every((check) => check.pass),
  };

  const reportStamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `zero-knowledge-release-${reportStamp}.json`);
  const mdPath = path.join(reportsDirectory, `zero-knowledge-release-${reportStamp}.md`);

  const persistedJsonPath = safeWriteFile(jsonPath, JSON.stringify(report, null, 2));
  const markdownContent = buildMarkdownReport(report);
  const persistedMdPath = safeWriteFile(mdPath, markdownContent);

  console.log(`[verify-zero-knowledge-release] JSON: ${persistedJsonPath}`);
  console.log(`[verify-zero-knowledge-release] Markdown: ${persistedMdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
