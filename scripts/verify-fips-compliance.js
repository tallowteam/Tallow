#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const POLICY_PATH = path.join(process.cwd(), 'docs', 'security', 'FIPS_VALIDATION_POLICY.md');
const ENCRYPTION_MODULE_PATH = path.join(process.cwd(), 'lib', 'transfer', 'encryption.ts');
const GDPR_AUDIT_PATH = path.join(process.cwd(), 'lib', 'compliance', 'gdpr-audit.ts');
const CCPA_AUDIT_PATH = path.join(process.cwd(), 'lib', 'compliance', 'ccpa-audit.ts');
const RELEASE_SIGNOFFS_DIR = path.join(process.cwd(), 'release-signoffs');
const SECURITY_REPORTS_DIR = path.join(process.cwd(), 'reports', 'security');

const REQUIRED_POLICY_PHRASES = [
  'FIPS 140-3',
  'NEXT_PUBLIC_TALLOW_FIPS_MODE',
  'AES-GCM',
  'SHA-256',
  'release-signoffs',
];

const REQUIRED_ENCRYPTION_PHRASES = [
  'NEXT_PUBLIC_TALLOW_FIPS_MODE',
  'ChaCha20-Poly1305 is disabled when FIPS mode is enabled. Use AES-GCM.',
  'export function isFipsModeEnabled',
];

const REQUIRED_RETENTION_PHRASES = [
  {
    filePath: GDPR_AUDIT_PATH,
    phrases: [
      'No server-side retention (no accounts, no databases)',
      'File contents: NEVER stored (zero retention)',
    ],
  },
  {
    filePath: CCPA_AUDIT_PATH,
    phrases: [
      'No server-side storage to delete',
      'Tallow does NOT sell personal information',
    ],
  },
];

const REQUIRED_FIPS_EVIDENCE_PHRASES = [
  'FIPS Compliance Validation',
  'Approved algorithms',
  'AES-GCM',
  'SHA-256',
  'release-signoffs',
];

const REQUIRED_SECURITY_APPROVERS = ['002', '019'];

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
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
    .filter((fileName) => matcher.test(fileName))
    .map((fileName) => {
      const fullPath = path.join(directoryPath, fileName);
      return {
        fileName,
        fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs,
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  return candidates.length > 0 ? candidates[0] : null;
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

function checkFileContainsAll(filePath, phrases, checkName) {
  if (!fs.existsSync(filePath)) {
    return {
      name: checkName,
      pass: false,
      details: [`missing: ${toPosix(path.relative(process.cwd(), filePath))}`],
    };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const missing = phrases.filter((phrase) => !content.includes(phrase));

  return {
    name: checkName,
    pass: missing.length === 0,
    details: missing.length === 0
      ? [`validated: ${toPosix(path.relative(process.cwd(), filePath))}`]
      : missing.map((phrase) => `missing phrase "${phrase}" in ${toPosix(path.relative(process.cwd(), filePath))}`),
  };
}

function resolveReleaseSignoffPath(explicitReleaseTag) {
  if (explicitReleaseTag) {
    const explicitPath = path.join(RELEASE_SIGNOFFS_DIR, `${explicitReleaseTag}.json`);
    if (!fs.existsSync(explicitPath)) {
      return null;
    }
    return {
      release: explicitReleaseTag,
      filePath: explicitPath,
    };
  }

  const latest = findLatestFile(RELEASE_SIGNOFFS_DIR, /^v\d+\.\d+\.\d+\.json$/);
  if (!latest) {
    return null;
  }

  return {
    release: latest.fileName.replace(/\.json$/, ''),
    filePath: latest.fullPath,
  };
}

function checkRequiredSecurityApprovals(explicitReleaseTag) {
  const signoffRef = resolveReleaseSignoffPath(explicitReleaseTag);
  if (!signoffRef) {
    return {
      name: 'Release signoff has required FIPS approvers (002/019)',
      pass: false,
      details: explicitReleaseTag
        ? [`missing signoff file: release-signoffs/${explicitReleaseTag}.json`]
        : ['no release-signoffs/v*.json file found'],
    };
  }

  const payload = readJson(signoffRef.filePath);
  const signoffs = Array.isArray(payload.signoffs) ? payload.signoffs : [];
  const byApprover = new Map(
    signoffs
      .filter((entry) => entry && typeof entry.approver === 'string')
      .map((entry) => [entry.approver, entry])
  );

  const failures = [];
  REQUIRED_SECURITY_APPROVERS.forEach((approver) => {
    const signoff = byApprover.get(approver);
    if (!signoff) {
      failures.push(`${approver}: missing signoff`);
      return;
    }

    if (signoff.status !== 'approved') {
      failures.push(`${approver}: status must be approved (received "${String(signoff.status)}")`);
    }

    if (typeof signoff.evidence !== 'string' || signoff.evidence.trim().length === 0) {
      failures.push(`${approver}: evidence path missing`);
      return;
    }

    if (!/^https?:\/\//i.test(signoff.evidence)) {
      const evidencePath = path.join(process.cwd(), signoff.evidence);
      if (!fs.existsSync(evidencePath)) {
        failures.push(`${approver}: evidence file not found (${signoff.evidence})`);
      }
    }
  });

  return {
    name: 'Release signoff has required FIPS approvers (002/019)',
    pass: failures.length === 0,
    details: failures.length === 0
      ? [
          `release: ${signoffRef.release}`,
          `source: ${toPosix(path.relative(process.cwd(), signoffRef.filePath))}`,
        ]
      : failures,
    release: signoffRef.release,
  };
}

function checkFipsEvidenceFile(explicitReleaseTag, derivedReleaseTag) {
  const expectedRelease = explicitReleaseTag || derivedReleaseTag || null;
  const expectedPath = expectedRelease
    ? path.join(SECURITY_REPORTS_DIR, `fips-validation-${expectedRelease}.md`)
    : null;

  if (expectedPath && fs.existsSync(expectedPath)) {
    return checkFileContainsAll(
      expectedPath,
      REQUIRED_FIPS_EVIDENCE_PHRASES,
      'Release FIPS validation evidence exists with required assertions'
    );
  }

  const latest = findLatestFile(SECURITY_REPORTS_DIR, /^fips-validation-v\d+\.\d+\.\d+\.md$/);
  if (!latest) {
    return {
      name: 'Release FIPS validation evidence exists with required assertions',
      pass: false,
      details: expectedRelease
        ? [`missing: reports/security/fips-validation-${expectedRelease}.md`]
        : ['no reports/security/fips-validation-v*.md evidence file found'],
    };
  }

  const check = checkFileContainsAll(
    latest.fullPath,
    REQUIRED_FIPS_EVIDENCE_PHRASES,
    'Release FIPS validation evidence exists with required assertions'
  );

  if (check.pass && expectedRelease) {
    check.details.push(`fallback evidence used: ${toPosix(path.relative(process.cwd(), latest.fullPath))}`);
  }

  return check;
}

function checkNoDataRetentionEvidence() {
  const failures = [];
  const details = [];

  REQUIRED_RETENTION_PHRASES.forEach((entry) => {
    if (!fs.existsSync(entry.filePath)) {
      failures.push(`missing: ${toPosix(path.relative(process.cwd(), entry.filePath))}`);
      return;
    }

    const content = fs.readFileSync(entry.filePath, 'utf8');
    const missingPhrases = entry.phrases.filter((phrase) => !content.includes(phrase));

    if (missingPhrases.length > 0) {
      missingPhrases.forEach((phrase) => {
        failures.push(`missing phrase "${phrase}" in ${toPosix(path.relative(process.cwd(), entry.filePath))}`);
      });
      return;
    }

    details.push(`validated: ${toPosix(path.relative(process.cwd(), entry.filePath))}`);
  });

  return {
    name: 'No-data-retention assertions exist in compliance audits',
    pass: failures.length === 0,
    details: failures.length === 0 ? details : failures,
  };
}

function buildMarkdownReport(report) {
  const lines = [
    '# FIPS Compliance Verification',
    '',
    `Generated: ${report.timestamp}`,
    report.release ? `Release: ${report.release}` : 'Release: latest-available',
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
  const explicitReleaseTag = process.argv[2] || null;
  const reportsDirectory = path.join(process.cwd(), 'reports');
  ensureDirectory(reportsDirectory);

  const policyCheck = checkFileContainsAll(
    POLICY_PATH,
    REQUIRED_POLICY_PHRASES,
    'FIPS policy document exists with required controls'
  );

  const encryptionGuardCheck = checkFileContainsAll(
    ENCRYPTION_MODULE_PATH,
    REQUIRED_ENCRYPTION_PHRASES,
    'Transfer encryption enforces FIPS mode by disabling ChaCha20'
  );

  const signoffCheck = checkRequiredSecurityApprovals(explicitReleaseTag);
  const fipsEvidenceCheck = checkFipsEvidenceFile(explicitReleaseTag, signoffCheck.release || null);
  const noRetentionCheck = checkNoDataRetentionEvidence();

  const checks = [
    policyCheck,
    encryptionGuardCheck,
    signoffCheck,
    fipsEvidenceCheck,
    noRetentionCheck,
  ];

  const report = {
    timestamp: new Date().toISOString(),
    release: explicitReleaseTag || signoffCheck.release || null,
    checks,
    passed: checks.every((check) => check.pass),
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `fips-compliance-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `fips-compliance-${stamp}.md`);
  const persistedJsonPath = safeWriteFile(jsonPath, JSON.stringify(report, null, 2));
  const persistedMdPath = safeWriteFile(mdPath, buildMarkdownReport(report));

  console.log(`[verify-fips-compliance] JSON: ${toPosix(path.relative(process.cwd(), persistedJsonPath))}`);
  console.log(`[verify-fips-compliance] Markdown: ${toPosix(path.relative(process.cwd(), persistedMdPath))}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
