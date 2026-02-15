#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const CHECKLIST_PATH = path.join(process.cwd(), 'REMAINING_IMPLEMENTATION_CHECKLIST.md');

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

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
}

function sanitizeSlug(value) {
  return value
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

function extractEvidencePath(line) {
  const evidenceBlock = line.match(/\[(evidence|partial):\s*([^\]]+)\]/i);
  if (evidenceBlock) {
    const body = evidenceBlock[2];
    const tickMatch = body.match(/`([^`]+)`/);
    if (tickMatch) {
      return tickMatch[1];
    }

    const fileMatch = body.match(/(?:reports|docs|release-signoffs|tests|scripts|\.github)\/[A-Za-z0-9_./:-]+/);
    if (fileMatch) {
      return fileMatch[0];
    }
  }

  const inlineTick = line.match(/`([^`]+)`/);
  if (inlineTick) {
    return inlineTick[1];
  }

  return null;
}

function deriveOwner(line, context) {
  const agentMatch = line.match(/AGENT\s+(\d{3})/);
  if (agentMatch) {
    return `AGENT ${agentMatch[1]}`;
  }

  const directorMatch = line.match(/(DC-[A-Z]+)\s*\((\d{3})\)/);
  if (directorMatch) {
    return `${directorMatch[1]} (${directorMatch[2]})`;
  }

  const leadMatch = line.match(/Lead:\s*([^)]+)\)/);
  if (leadMatch) {
    return leadMatch[1].trim();
  }

  if (line.includes('RAMSAD (001)')) {
    return 'RAMSAD (001)';
  }

  if (context.section.startsWith('A)')) {
    return 'Directorate Owners';
  }

  if (context.section.startsWith('B)')) {
    return 'QA + Ops';
  }

  if (context.section.startsWith('C)')) {
    return 'Leadership Signoff Chain';
  }

  if (context.section.startsWith('D)')) {
    return 'RAMSAD (001)';
  }

  if (context.section.startsWith('E)')) {
    return 'Checklist Maintainers';
  }

  if (context.subsection.startsWith('F1)')) {
    return 'Governance Council';
  }

  if (context.subsection.startsWith('F2)')) {
    return 'Stability Council';
  }

  if (context.subsection.startsWith('F3)')) {
    return 'Security Directorate';
  }

  if (context.subsection.startsWith('F4)')) {
    return 'Network Reliability Directorate';
  }

  if (context.subsection.startsWith('F5)')) {
    return 'UX + Frontend Directorate';
  }

  if (context.subsection.startsWith('F6)')) {
    return 'Platform Directorate';
  }

  if (context.subsection.startsWith('F7)')) {
    return 'QA + Ops Directorate';
  }

  if (context.subsection.startsWith('F8)')) {
    return 'Execution Program Office';
  }

  if (context.subsection.startsWith('F9)')) {
    return 'Release Gate Owners';
  }

  return 'Checklist Maintainers';
}

function parseChecklistItems(content) {
  const lines = content.split(/\r?\n/);
  const items = [];
  const context = {
    section: '',
    subsection: '',
    heading: '',
  };

  lines.forEach((line, index) => {
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      context.section = sectionMatch[1].trim();
      context.subsection = '';
      context.heading = '';
      return;
    }

    const subsectionMatch = line.match(/^###\s+(.+)$/);
    if (subsectionMatch) {
      context.subsection = subsectionMatch[1].trim();
      context.heading = '';
      return;
    }

    const headingMatch = line.match(/^####\s+(.+)$/);
    if (headingMatch) {
      context.heading = headingMatch[1].trim();
      return;
    }

    const itemMatch = line.match(/^- \[( |x)\]\s+(.+)$/);
    if (!itemMatch) {
      return;
    }

    const status = itemMatch[1] === 'x' ? 'done' : 'open';
    const text = itemMatch[2].trim();
    const owner = deriveOwner(text, context);
    const extractedEvidence = extractEvidencePath(text);
    const id = `line-${index + 1}`;

    items.push({
      id,
      line: index + 1,
      status,
      owner,
      evidencePath: extractedEvidence || `reports/checklist-evidence-pending/${sanitizeSlug(id)}-${sanitizeSlug(text)}.md`,
      text,
      section: context.section,
      subsection: context.subsection,
    });
  });

  return items;
}

function writeMarkdownIndex(items, outputPath, generatedAt) {
  const lines = [
    '# Checklist Ownership Index',
    '',
    `Generated: ${generatedAt}`,
    '',
    '| Item ID | Status | Owner | Evidence Path |',
    '| --- | --- | --- | --- |',
  ];

  items.forEach((item) => {
    lines.push(`| ${item.id} | ${item.status} | ${item.owner} | \`${item.evidencePath}\` |`);
  });

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Checklist Ownership Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    '## Summary',
    `- Total checklist items: ${report.totalItems}`,
    `- Items with owner: ${report.itemsWithOwner}`,
    `- Items with evidence path: ${report.itemsWithEvidencePath}`,
    `- Overall: ${report.passed ? 'PASS' : 'FAIL'}`,
    '',
  ];

  if (report.failures.length > 0) {
    lines.push('## Failures');
    report.failures.forEach((failure) => lines.push(`- ${failure}`));
    lines.push('');
  }

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  if (!fs.existsSync(CHECKLIST_PATH)) {
    console.error('[verify-checklist-ownership] Missing REMAINING_IMPLEMENTATION_CHECKLIST.md');
    process.exit(1);
  }

  const checklistContent = fs.readFileSync(CHECKLIST_PATH, 'utf8');
  const items = parseChecklistItems(checklistContent);

  const failures = [];
  items.forEach((item) => {
    if (!item.owner || item.owner.trim().length === 0) {
      failures.push(`${item.id} missing owner`);
    }
    if (!item.evidencePath || item.evidencePath.trim().length === 0) {
      failures.push(`${item.id} missing evidencePath`);
    }
  });

  const report = {
    timestamp: new Date().toISOString(),
    totalItems: items.length,
    itemsWithOwner: items.filter((item) => item.owner && item.owner.trim().length > 0).length,
    itemsWithEvidencePath: items.filter((item) => item.evidencePath && item.evidencePath.trim().length > 0).length,
    passed: failures.length === 0,
    failures,
  };

  const reportsDir = resolveReportsDirectory();

  const governanceDir = path.join(process.cwd(), 'docs', 'governance');
  ensureDirectory(governanceDir);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonReportPath = path.join(reportsDir, `checklist-ownership-${stamp}.json`);
  const mdReportPath = path.join(reportsDir, `checklist-ownership-${stamp}.md`);
  const ownershipIndexPath = path.join(governanceDir, 'CHECKLIST_ITEM_OWNERSHIP_INDEX.md');
  const ownershipIndexJsonPath = path.join(governanceDir, 'CHECKLIST_ITEM_OWNERSHIP_INDEX.json');

  fs.writeFileSync(jsonReportPath, JSON.stringify({ report, items }, null, 2), 'utf8');
  writeMarkdownReport(report, mdReportPath);
  writeMarkdownIndex(items, ownershipIndexPath, report.timestamp);
  fs.writeFileSync(ownershipIndexJsonPath, JSON.stringify(items, null, 2), 'utf8');

  console.log(`[verify-checklist-ownership] JSON report: ${toPosix(path.relative(process.cwd(), jsonReportPath))}`);
  console.log(`[verify-checklist-ownership] Markdown report: ${toPosix(path.relative(process.cwd(), mdReportPath))}`);
  console.log(`[verify-checklist-ownership] Ownership index: ${toPosix(path.relative(process.cwd(), ownershipIndexPath))}`);
  console.log(`[verify-checklist-ownership] Ownership JSON index: ${toPosix(path.relative(process.cwd(), ownershipIndexJsonPath))}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
