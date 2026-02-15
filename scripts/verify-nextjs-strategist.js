#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'app');
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'NEXTJS_STRATEGIST_POLICY.md');
const MIDDLEWARE_PATH = path.join(ROOT, 'middleware.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');
const REQUIRED_SCRIPT_NAME = 'verify:nextjs:strategist';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:nextjs:strategist';

const SERVER_DEFAULT_DOC_ROUTES = [
  path.join(ROOT, 'app', 'docs', 'guides', 'page.tsx'),
  path.join(ROOT, 'app', 'docs', 'guides', 'getting-started', 'page.tsx'),
  path.join(ROOT, 'app', 'docs', 'guides', 'local-transfer', 'page.tsx'),
  path.join(ROOT, 'app', 'docs', 'guides', 'internet-transfer', 'page.tsx'),
  path.join(ROOT, 'app', 'docs', 'guides', 'security', 'page.tsx'),
];

const CLIENT_NECESSITY_PATTERN =
  /use(State|Effect|Memo|Callback|Ref|Context|Transition|DeferredValue|Optimistic|ActionState|Id|SyncExternalStore)\s*\(|useRouter\(|usePathname\(|useSearchParams\(|useParams\(|onClick=|onSubmit=|window\.|document\.|navigator\.|localStorage|sessionStorage|dynamic\(|ssr:\s*false/;

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

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
}

function readFile(filePath) {
  const buffer = fs.readFileSync(filePath);

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString('utf16le');
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.allocUnsafe(buffer.length - (buffer.length % 2));
    for (let i = 0; i < swapped.length; i += 2) {
      swapped[i] = buffer[i + 1];
      swapped[i + 1] = buffer[i];
    }
    return swapped.toString('utf16le');
  }

  return buffer.toString('utf8');
}

function listPageRoutes(dirPath) {
  const routes = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      routes.push(...listPageRoutes(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name === 'page.tsx') {
      routes.push(fullPath);
    }
  }
  return routes;
}

function checkRequiredFiles() {
  const requiredFiles = [
    POLICY_PATH,
    MIDDLEWARE_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Next.js strategy policy, middleware, package, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required Next.js strategist files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkRouteLoadingAndErrorCoverage() {
  const pageRoutes = listPageRoutes(APP_DIR);
  const missingCoverage = [];

  for (const pagePath of pageRoutes) {
    const routeDirectory = path.dirname(pagePath);
    const loadingPath = path.join(routeDirectory, 'loading.tsx');
    const errorPath = path.join(routeDirectory, 'error.tsx');

    const missingParts = [];
    if (!fs.existsSync(loadingPath)) {
      missingParts.push('loading.tsx');
    }
    if (!fs.existsSync(errorPath)) {
      missingParts.push('error.tsx');
    }

    if (missingParts.length > 0) {
      missingCoverage.push(
        `${toPosix(path.relative(ROOT, routeDirectory))}: missing ${missingParts.join(', ')}`
      );
    }
  }

  return {
    name: 'Every page route defines loading.tsx and error.tsx',
    pass: missingCoverage.length === 0,
    details:
      missingCoverage.length === 0
        ? [`route segments checked: ${pageRoutes.length}`, 'all page routes include loading/error boundaries']
        : missingCoverage,
  };
}

function checkServerDefaultDocs() {
  const violations = [];
  for (const routePath of SERVER_DEFAULT_DOC_ROUTES) {
    if (!fs.existsSync(routePath)) {
      violations.push(`missing route file: ${toPosix(path.relative(ROOT, routePath))}`);
      continue;
    }

    const content = readFile(routePath);
    if (content.includes("'use client'") || content.includes('"use client"')) {
      violations.push(`server-default route incorrectly marked client: ${toPosix(path.relative(ROOT, routePath))}`);
    }
  }

  return {
    name: 'Static docs guide routes remain Server Components',
    pass: violations.length === 0,
    details: violations.length === 0 ? ['docs guide routes are server-default'] : violations,
  };
}

function checkClientBoundaries(pageRoutes) {
  const suspiciousRoutes = [];
  for (const pagePath of pageRoutes) {
    const content = readFile(pagePath);
    const hasClientDirective = content.includes("'use client'") || content.includes('"use client"');
    if (!hasClientDirective) {
      continue;
    }

    if (!CLIENT_NECESSITY_PATTERN.test(content)) {
      suspiciousRoutes.push(
        `client directive without obvious client-only usage: ${toPosix(path.relative(ROOT, pagePath))}`
      );
    }
  }

  return {
    name: "Client directives are constrained to files with client-only behavior",
    pass: suspiciousRoutes.length === 0,
    details:
      suspiciousRoutes.length === 0
        ? ['all use client page routes include client-only markers']
        : suspiciousRoutes,
  };
}

function checkMiddlewareAuth(content) {
  const requiredTokens = [
    "pathname.startsWith('/admin')",
    'x-admin-key',
    'ADMIN_SECRET_KEY',
    'x-request-id',
  ];

  const missing = requiredTokens.filter((token) => !content.includes(token));
  return {
    name: 'Middleware enforces admin-route authentication and request tracing',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['admin auth gate + request tracing headers detected in middleware']
        : missing.map((token) => `missing token: ${token}`),
  };
}

function checkScriptAndWorkflow(packageJson, ciContent, releaseContent) {
  const missing = [];
  if (!(packageJson.scripts || {})[REQUIRED_SCRIPT_NAME]) {
    missing.push(`missing package script: ${REQUIRED_SCRIPT_NAME}`);
  }
  if (!ciContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    missing.push(`CI workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }
  if (!releaseContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    missing.push(`release workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }

  return {
    name: 'Next.js strategist gate is wired in package scripts and workflows',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs Next.js strategist verification',
            '.github/workflows/release.yml runs Next.js strategist verification',
          ]
        : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Next.js Strategist Verification',
    '',
    `Generated: ${report.timestamp}`,
    '',
    '## Checks',
    ...report.checks.map((check) => `- ${check.pass ? '[PASS]' : '[FAIL]'} ${check.name}`),
    '',
  ];

  for (const check of report.checks) {
    lines.push(`### ${check.name}`);
    for (const detail of check.details) {
      lines.push(`- ${detail}`);
    }
    lines.push('');
  }

  lines.push('## Summary');
  lines.push(`- Overall: ${report.passed ? 'PASS' : 'FAIL'}`);
  lines.push('');

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const checks = [];
  const required = checkRequiredFiles();
  checks.push(required);

  if (required.pass) {
    const pageRoutes = listPageRoutes(APP_DIR);
    const middlewareContent = readFile(MIDDLEWARE_PATH);
    const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkRouteLoadingAndErrorCoverage());
    checks.push(checkServerDefaultDocs());
    checks.push(checkClientBoundaries(pageRoutes));
    checks.push(checkMiddlewareAuth(middlewareContent));
    checks.push(checkScriptAndWorkflow(packageJson, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `nextjs-strategist-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `nextjs-strategist-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-nextjs-strategist] JSON: ${jsonPath}`);
  console.log(`[verify-nextjs-strategist] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
