#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, 'reports');

const CORE_COPY_FILES = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/features/page.tsx',
  'app/how-it-works/page.tsx',
  'app/security/page.tsx',
  'app/privacy/page.tsx',
  'app/terms/page.tsx',
  'app/about/page.tsx',
  'app/docs/page.tsx',
  'app/pricing/page.tsx',
  'app/transfer/page.tsx',
  'components/layout/Header.tsx',
  'components/layout/Footer.tsx',
  'components/transfer/DropZone.tsx',
];

const METADATA_FILES = [
  'app/layout.tsx',
  'app/features/page.tsx',
  'app/how-it-works/page.tsx',
  'app/security/page.tsx',
  'app/privacy/page.tsx',
  'app/terms/page.tsx',
  'app/about/page.tsx',
  'app/docs/page.tsx',
  'app/pricing/page.tsx',
];

const INTERNAL_LINKS = [
  '/',
  '/features',
  '/how-it-works',
  '/docs',
  '/about',
  '/transfer',
  '/security',
  '/pricing',
  '/privacy',
  '/terms',
  '/docs/api',
  '/docs/guides/security',
  '/docs/guides',
  '/security#faq',
];

const TYPO_PATTERNS = [
  /\bteh\b/gi,
  /\brecieve\b/gi,
  /\bseperate\b/gi,
  /\boccured\b/gi,
  /\bdefinately\b/gi,
  /\bwierd\b/gi,
  /\badress\b/gi,
];

const BANNED_PHRASES = [
  /direct p2p/gi,
  /quantum computer safe/gi,
  /privacy first/gi,
  /we have no knowledge/gi,
  /total end-to-end encryption/gi,
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

function collectLineMatches(content, pattern) {
  const lines = content.split('\n');
  const matches = [];
  lines.forEach((line, index) => {
    if (pattern.test(line)) {
      matches.push({ line: index + 1, text: line.trim() });
    }
    pattern.lastIndex = 0;
  });
  return matches;
}

function routeExists(route) {
  const pathname = route.split('#')[0].split('?')[0];
  if (!pathname.startsWith('/')) {
    return false;
  }
  if (pathname === '/') {
    return fs.existsSync(path.join(ROOT, 'app', 'page.tsx'));
  }

  const segments = pathname.slice(1).split('/').filter(Boolean);
  const routeDir = path.join(ROOT, 'app', ...segments);
  const candidates = [
    path.join(routeDir, 'page.tsx'),
    path.join(routeDir, 'page.ts'),
    path.join(routeDir, 'page.jsx'),
    path.join(routeDir, 'page.js'),
    path.join(routeDir, 'page.mdx'),
  ];
  return candidates.some((candidate) => fs.existsSync(candidate));
}

function verifyCopyMarkers() {
  const checks = [
    {
      id: 'header-docs-label',
      file: 'components/layout/Header.tsx',
      pattern: /href:\s*'\/docs',\s*label:\s*'DOCS'/,
    },
    {
      id: 'transfer-error-copy',
      file: 'app/transfer/page.tsx',
      pattern: /Oops,\s*something unexpected happened/,
    },
    {
      id: 'transfer-statistics-copy',
      file: 'app/transfer/page.tsx',
      pattern: /performance metrics, and data usage patterns/,
    },
    {
      id: 'transfer-notifications-copy',
      file: 'app/transfer/page.tsx',
      pattern: /Real-time alerts for incoming transfers/,
    },
    {
      id: 'dropzone-error-copy',
      file: 'components/transfer/DropZone.tsx',
      pattern: /drop zone had trouble loading/i,
    },
    {
      id: 'landing-speed-clarity',
      file: 'app/page.tsx',
      pattern: /full local network speed/i,
    },
    {
      id: 'features-comparison',
      file: 'app/features/page.tsx',
      pattern: /How Tallow Compares/,
    },
    {
      id: 'education-journey',
      file: 'app/features/page.tsx',
      pattern: /Your secure transfer journey/,
    },
  ];

  const failures = [];
  const results = checks.map((check) => {
    const content = readFile(check.file) || '';
    const pass = check.pattern.test(content);
    if (!pass) {
      failures.push(`Missing copy marker "${check.id}" in ${check.file}`);
    }
    return { ...check, pass };
  });

  return { pass: failures.length === 0, failures, results };
}

function verifySpellcheckAndTone() {
  const typoFindings = [];
  const bannedPhraseFindings = [];

  CORE_COPY_FILES.forEach((file) => {
    const content = readFile(file);
    if (!content) {
      typoFindings.push({
        file,
        issue: 'missing-file',
        details: [{ line: 0, text: 'File not found' }],
      });
      return;
    }

    TYPO_PATTERNS.forEach((pattern) => {
      const matches = collectLineMatches(content, pattern);
      if (matches.length > 0) {
        typoFindings.push({ file, issue: pattern.source, details: matches });
      }
    });

    BANNED_PHRASES.forEach((pattern) => {
      const matches = collectLineMatches(content, pattern);
      if (matches.length > 0) {
        bannedPhraseFindings.push({ file, issue: pattern.source, details: matches });
      }
    });
  });

  const failures = [];
  if (typoFindings.length > 0) {
    failures.push(`Typos found in ${typoFindings.length} file/pattern combinations.`);
  }
  if (bannedPhraseFindings.length > 0) {
    failures.push(`Banned copy phrases found in ${bannedPhraseFindings.length} file/pattern combinations.`);
  }

  return {
    pass: failures.length === 0,
    failures,
    typoFindings,
    bannedPhraseFindings,
  };
}

function verifyLinks() {
  const failures = [];
  const placeholderFindings = [];

  CORE_COPY_FILES.forEach((file) => {
    const content = readFile(file);
    if (!content) {
      return;
    }
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/href\s*=\s*["']\/#["']/.test(line) || /href\s*=\s*["']#["']/.test(line)) {
        placeholderFindings.push({
          file,
          line: index + 1,
          text: line.trim(),
        });
      }
    });
  });

  if (placeholderFindings.length > 0) {
    failures.push(`Found ${placeholderFindings.length} placeholder links.`);
  }

  const routeChecks = INTERNAL_LINKS.map((link) => {
    const pass = routeExists(link);
    if (!pass) {
      failures.push(`Route target missing for link: ${link}`);
    }
    return { link, pass };
  });

  const featuresPage = readFile('app/features/page.tsx') || '';
  const expectedJourneyLinks = ['/features', '/how-it-works', '/security#faq', '/docs'];
  expectedJourneyLinks.forEach((journeyLink) => {
    const regex = new RegExp(`href=\\\"${journeyLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\\"`);
    if (!regex.test(featuresPage)) {
      failures.push(`Education journey link missing: ${journeyLink}`);
    }
  });

  return {
    pass: failures.length === 0,
    failures,
    placeholderFindings,
    routeChecks,
  };
}

function verifyMetadata() {
  const failures = [];
  const results = [];

  METADATA_FILES.forEach((file) => {
    const content = readFile(file);
    if (!content) {
      failures.push(`Missing metadata file: ${file}`);
      results.push({ file, pass: false, reason: 'file-missing' });
      return;
    }

    const checks = {
      hasMetadataExport: /export const metadata\s*:\s*Metadata/.test(content),
      hasTitle: /\btitle\s*:/.test(content),
      hasDescription: /\bdescription\s*:/.test(content),
      hasAlternates: /\balternates\s*:/.test(content),
      hasOpenGraph: /\bopenGraph\s*:/.test(content),
      hasTwitter: /\btwitter\s*:/.test(content),
    };

    const pass = Object.values(checks).every(Boolean);
    if (!pass) {
      failures.push(`Metadata contract incomplete in ${file}`);
    }

    results.push({ file, pass, checks });
  });

  return { pass: failures.length === 0, failures, results };
}

function buildReport() {
  const copyMarkers = verifyCopyMarkers();
  const spellAndTone = verifySpellcheckAndTone();
  const links = verifyLinks();
  const metadata = verifyMetadata();

  const sections = {
    copyMarkers,
    spellAndTone,
    links,
    metadata,
  };

  const failures = Object.values(sections).flatMap((section) => section.failures);
  const passed = failures.length === 0;

  return {
    timestamp: new Date().toISOString(),
    passed,
    failures,
    sections,
  };
}

function writeMarkdown(report, outputPath) {
  const lines = [
    '# Copy Quality Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    `Overall: ${report.passed ? 'PASS' : 'FAIL'}`,
    '',
    '## Sections',
    `- Copy markers: ${report.sections.copyMarkers.pass ? 'PASS' : 'FAIL'}`,
    `- Spell check and tone sweep: ${report.sections.spellAndTone.pass ? 'PASS' : 'FAIL'}`,
    `- Link integrity: ${report.sections.links.pass ? 'PASS' : 'FAIL'}`,
    `- Metadata contract: ${report.sections.metadata.pass ? 'PASS' : 'FAIL'}`,
    '',
  ];

  if (report.failures.length > 0) {
    lines.push('## Failures');
    report.failures.forEach((failure) => lines.push(`- ${failure}`));
    lines.push('');
  }

  lines.push('## Metadata Checks');
  report.sections.metadata.results.forEach((result) => {
    lines.push(`- ${result.pass ? '[PASS]' : '[FAIL]'} ${result.file}`);
  });

  lines.push('');
  lines.push('## Link Route Checks');
  report.sections.links.routeChecks.forEach((check) => {
    lines.push(`- ${check.pass ? '[PASS]' : '[FAIL]'} ${check.link}`);
  });

  lines.push('');
  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const report = buildReport();
  ensureDirectory(REPORTS_DIR);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(REPORTS_DIR, `copy-quality-${stamp}.json`);
  const mdPath = path.join(REPORTS_DIR, `copy-quality-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdown(report, mdPath);

  console.log(`[verify-copy-quality] JSON: ${toPosix(path.relative(ROOT, jsonPath))}`);
  console.log(`[verify-copy-quality] Markdown: ${toPosix(path.relative(ROOT, mdPath))}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
