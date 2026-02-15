#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'DOCUMENTATION_SCRIBE_POLICY.md');
const API_SPEC_PATH = path.join(ROOT, 'lib', 'docs', 'openapi.ts');
const API_DOCS_ROUTE_PATH = path.join(ROOT, 'app', 'api', 'docs', 'route.ts');
const API_DIR = path.join(ROOT, 'app', 'api');
const STORYBOOK_MAIN_PATH = path.join(ROOT, '.storybook', 'main.ts');
const STORYBOOK_PREVIEW_PATH = path.join(ROOT, '.storybook', 'preview.ts');
const COMPONENT_TABLE_PATH = path.join(ROOT, 'docs', 'governance', 'COMPONENT_PROPS_TABLES.md');
const ARCHITECTURE_INDEX_PATH = path.join(ROOT, 'docs', 'governance', 'ARCHITECTURE_DIAGRAM_INDEX.md');
const ARCHITECTURE_SOURCE_PATH = path.join(ROOT, 'lib', 'docs', 'architecture-diagrams.ts');
const ARCHITECTURE_PAGE_PATH = path.join(ROOT, 'app', 'docs', 'architecture', 'page.tsx');
const WHITEPAPER_PATH = path.join(ROOT, 'docs', 'security', 'SECURITY_WHITEPAPER.md');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function resolveReportsDirectory() {
  const preferredDirectory = path.join(ROOT, 'reports');
  ensureDirectory(preferredDirectory);

  const probePath = path.join(preferredDirectory, '.write-probe');
  try {
    fs.writeFileSync(probePath, 'ok', 'utf8');
    fs.unlinkSync(probePath);
    return preferredDirectory;
  } catch {
    const fallbackDirectory = path.join(ROOT, 'verification-reports');
    ensureDirectory(fallbackDirectory);
    return fallbackDirectory;
  }
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function toPosix(filePath) {
  return filePath.replace(/\\/g, '/');
}

function walk(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files = [];
  entries.forEach((entry) => {
    const absolutePath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolutePath));
      return;
    }
    files.push(absolutePath);
  });
  return files;
}

function checkFilesExist() {
  const required = [
    POLICY_PATH,
    API_SPEC_PATH,
    API_DOCS_ROUTE_PATH,
    STORYBOOK_MAIN_PATH,
    STORYBOOK_PREVIEW_PATH,
    COMPONENT_TABLE_PATH,
    ARCHITECTURE_INDEX_PATH,
    ARCHITECTURE_SOURCE_PATH,
    ARCHITECTURE_PAGE_PATH,
    WHITEPAPER_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/'));

  return {
    name: 'Documentation scribe baseline files exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['api/storybook/architecture/whitepaper/workflow files found']
      : missing.map((item) => `missing: ${item}`),
  };
}

function getApiRoutePaths() {
  if (!fs.existsSync(API_DIR)) {
    return [];
  }

  const files = walk(API_DIR).filter((filePath) => filePath.endsWith(path.join('route.ts')));
  const paths = files
    .map((filePath) => {
      const relativeDir = path.relative(API_DIR, path.dirname(filePath)).replace(/\\/g, '/');
      if (!relativeDir || relativeDir === '.') {
        return '/api';
      }
      const normalized = relativeDir
        .split('/')
        .map((segment) => {
          if (segment.startsWith('[') && segment.endsWith(']')) {
            return `{${segment.slice(1, -1)}}`;
          }
          return segment;
        })
        .join('/');
      return `/api/${normalized}`;
    })
    .sort();

  return [...new Set(paths)];
}

function checkApiCoverage(openApiContent, apiPaths) {
  const missing = apiPaths.filter((apiPath) => {
    const singleQuoted = `'${apiPath}':`;
    const doubleQuoted = `"${apiPath}":`;
    return !openApiContent.includes(singleQuoted) && !openApiContent.includes(doubleQuoted);
  });

  return {
    name: 'Every API endpoint is represented in OpenAPI documentation',
    pass: missing.length === 0,
    details: missing.length === 0
      ? [`openapi paths cover ${apiPaths.length} discovered route handlers`]
      : missing.map((item) => `missing openapi path: ${item}`),
  };
}

function checkApiExamples(openApiContent, apiPaths) {
  const exampleCount = (openApiContent.match(/\bexamples?\b/g) || []).length;
  const pass = exampleCount >= apiPaths.length;

  return {
    name: 'API documentation includes request/response examples',
    pass,
    details: pass
      ? [`openapi example tokens=${exampleCount}, routes=${apiPaths.length}`]
      : [`insufficient example tokens (${exampleCount}) for ${apiPaths.length} routes`],
  };
}

function countComponents() {
  const componentsDir = path.join(ROOT, 'components');
  if (!fs.existsSync(componentsDir)) {
    return 0;
  }

  return walk(componentsDir).filter((filePath) => {
    if (!filePath.endsWith('.tsx')) {
      return false;
    }
    return !/\.(test|stories)\.tsx$/i.test(path.basename(filePath));
  }).length;
}

function checkStorybookCoverage(mainContent, previewContent, tableContent) {
  const failures = [];
  const componentCount = countComponents();
  const trackedMatch = tableContent.match(/Total components tracked:\s*(\d+)/);
  const trackedCount = trackedMatch ? Number(trackedMatch[1]) : 0;

  if (!mainContent.includes('@storybook/nextjs')) {
    failures.push('storybook main config missing @storybook/nextjs framework');
  }
  if (!mainContent.includes('autodocs')) {
    failures.push('storybook main config missing autodocs setting');
  }
  if (!previewContent.includes('argTypesRegex')) {
    failures.push('storybook preview missing actions/controls defaults');
  }
  if (!tableContent.includes('Props Table Schema')) {
    failures.push('component props table missing schema section');
  }
  if (trackedCount < componentCount) {
    failures.push(`component props table under-reports coverage (${trackedCount}/${componentCount})`);
  }

  return {
    name: 'Storybook props-table coverage tracks all components',
    pass: failures.length === 0,
    details: failures.length === 0
      ? [`tracked components=${trackedCount}, discovered components=${componentCount}`]
      : failures,
  };
}

function checkArchitectureIndex(indexContent, sourceContent, pageContent) {
  const failures = [];
  const requiredIndexTokens = [
    'lib/docs/architecture-diagrams.ts',
    'app/docs/architecture/page.tsx',
    'Current Diagram Set',
  ];
  requiredIndexTokens.forEach((token) => {
    if (!indexContent.includes(token)) {
      failures.push(`architecture index missing token: ${token}`);
    }
  });

  const diagramTokenCount = (sourceContent.match(/SYSTEM_OVERVIEW|CRYPTO_ARCHITECTURE|TRANSFER_FLOW|DISCOVERY_FLOW|STATE_MANAGEMENT|DEPLOYMENT_ARCHITECTURE/g) || []).length;
  if (diagramTokenCount < 6) {
    failures.push(`architecture source expected >=6 canonical diagrams, found ${diagramTokenCount}`);
  }

  if (!pageContent.includes('Architecture Diagrams')) {
    failures.push('architecture page missing diagram heading');
  }

  return {
    name: 'Architecture diagrams are indexed and aligned with live sources',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['diagram index references canonical sources and expected diagram set']
      : failures,
  };
}

function checkWhitepaper(whitepaperContent) {
  const required = [
    'Executive Summary',
    'Threat Model',
    'Cryptographic Architecture',
    'Incident Response',
    'Compliance Position',
  ];
  const missing = required.filter((token) => !whitepaperContent.includes(token));

  return {
    name: 'Security whitepaper is published with required sections',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['whitepaper includes strategic security and compliance sections']
      : missing.map((token) => `whitepaper missing section token: ${token}`),
  };
}

function checkPolicyDocument(policyContent) {
  const required = [
    'API endpoints are documented with examples',
    'Component props coverage index',
    'Architecture diagram index',
    'Security whitepaper',
    'npm run verify:documentation:scribe',
  ];
  const missing = required.filter((token) => !policyContent.includes(token));

  return {
    name: 'Documentation scribe policy is documented and actionable',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['policy captures API/storybook/architecture/whitepaper requirements']
      : missing.map((token) => `missing policy token: ${token}`),
  };
}

function checkWorkflowGates(ciContent, releaseContent) {
  const required = ['documentation-scribe:', 'npm run verify:documentation:scribe'];
  const failures = [];

  required.forEach((token) => {
    if (!ciContent.includes(token)) {
      failures.push(`ci.yml missing token: ${token}`);
    }
    if (!releaseContent.includes(token)) {
      failures.push(`release.yml missing token: ${token}`);
    }
  });

  return {
    name: 'CI/release workflows enforce documentation-scribe verification',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['documentation-scribe gate is wired in CI and release workflows']
      : failures,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Documentation Scribe Verification',
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
    const openApiContent = readFile(API_SPEC_PATH);
    const storybookMainContent = readFile(STORYBOOK_MAIN_PATH);
    const storybookPreviewContent = readFile(STORYBOOK_PREVIEW_PATH);
    const componentTableContent = readFile(COMPONENT_TABLE_PATH);
    const architectureIndexContent = readFile(ARCHITECTURE_INDEX_PATH);
    const architectureSourceContent = readFile(ARCHITECTURE_SOURCE_PATH);
    const architecturePageContent = readFile(ARCHITECTURE_PAGE_PATH);
    const whitepaperContent = readFile(WHITEPAPER_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    const apiPaths = getApiRoutePaths();
    checks.push(checkApiCoverage(openApiContent, apiPaths));
    checks.push(checkApiExamples(openApiContent, apiPaths));
    checks.push(checkStorybookCoverage(storybookMainContent, storybookPreviewContent, componentTableContent));
    checks.push(checkArchitectureIndex(architectureIndexContent, architectureSourceContent, architecturePageContent));
    checks.push(checkWhitepaper(whitepaperContent));
    checks.push(checkPolicyDocument(policyContent));
    checks.push(checkWorkflowGates(ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const reportsDirectory = resolveReportsDirectory();

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDirectory, `documentation-scribe-${stamp}.json`);
  const mdPath = path.join(reportsDirectory, `documentation-scribe-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-documentation-scribe] JSON: ${toPosix(path.relative(ROOT, jsonPath))}`);
  console.log(`[verify-documentation-scribe] Markdown: ${toPosix(path.relative(ROOT, mdPath))}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
