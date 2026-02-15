#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, 'reports');

const REQUIRED_DOCS = [
  {
    path: 'docs/governance/COPY_OPERATIONS_PROGRAM.md',
    requiredSnippets: [
      'A/B Test CTA Variants',
      'Monitor User Feedback',
      'Update Placeholder Text on Feature Launch',
      'Quarterly Copy Audit',
      'Update Meta Descriptions',
      'Track SEO Performance',
      'Monitor Competitor Positioning',
      'Gather User Feedback',
      'Refine Error Messages Using Analytics',
      'Evidence Artifacts',
    ],
  },
  {
    path: 'docs/governance/COPY_OPERATIONS_TRACKER.md',
    requiredSnippets: [
      'A/B test CTA variants',
      'Monitor user feedback',
      'Update placeholder text when features launch',
      'Quarterly copy audit',
      'Update meta descriptions',
      'Track SEO performance',
      'Monitor competitor positioning',
      'Gather user feedback',
      'Refine error messages based on analytics',
      'Current Verification Snapshot',
    ],
  },
];

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function verifyDocuments() {
  const failures = [];
  const results = REQUIRED_DOCS.map((doc) => {
    const content = readFile(doc.path);
    if (!content) {
      failures.push(`Missing required document: ${doc.path}`);
      return {
        file: doc.path,
        pass: false,
        missingSnippets: doc.requiredSnippets,
      };
    }

    const missingSnippets = doc.requiredSnippets.filter((snippet) => !content.includes(snippet));
    if (missingSnippets.length > 0) {
      failures.push(`Document ${doc.path} is missing ${missingSnippets.length} required section markers.`);
    }

    return {
      file: doc.path,
      pass: missingSnippets.length === 0,
      missingSnippets,
    };
  });

  return {
    pass: failures.length === 0,
    failures,
    results,
  };
}

function buildReport() {
  const docs = verifyDocuments();
  const failures = [...docs.failures];

  return {
    timestamp: new Date().toISOString(),
    passed: failures.length === 0,
    failures,
    sections: {
      documents: docs,
    },
  };
}

function writeMarkdown(report, outputPath) {
  const lines = [
    '# Copy Operations Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    `Overall: ${report.passed ? 'PASS' : 'FAIL'}`,
    '',
    '## Document Checks',
  ];

  report.sections.documents.results.forEach((result) => {
    lines.push(`- ${result.pass ? '[PASS]' : '[FAIL]'} ${result.file}`);
    if (result.missingSnippets.length > 0) {
      result.missingSnippets.forEach((snippet) => {
        lines.push(`  - Missing: ${snippet}`);
      });
    }
  });

  if (report.failures.length > 0) {
    lines.push('');
    lines.push('## Failures');
    report.failures.forEach((failure) => lines.push(`- ${failure}`));
  }

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const report = buildReport();
  ensureDirectory(REPORTS_DIR);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(REPORTS_DIR, `copy-operations-${stamp}.json`);
  const mdPath = path.join(REPORTS_DIR, `copy-operations-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdown(report, mdPath);

  console.log(`[verify-copy-operations] JSON: ${toPosix(path.relative(ROOT, jsonPath))}`);
  console.log(`[verify-copy-operations] Markdown: ${toPosix(path.relative(ROOT, mdPath))}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();

