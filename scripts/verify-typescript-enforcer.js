#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'TYPESCRIPT_ENFORCER_POLICY.md');
const TS_CONFIG_PATH = path.join(ROOT, 'tsconfig.json');
const CRYPTO_BRANDS_PATH = path.join(ROOT, 'lib', 'types', 'crypto-brands.ts');
const P2P_HOOK_PATH = path.join(ROOT, 'lib', 'hooks', 'use-p2p-connection.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:typescript:enforcer';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:typescript:enforcer';

const CRITICAL_PATHS = [
  path.join(ROOT, 'app', 'api'),
  path.join(ROOT, 'lib', 'crypto'),
  path.join(ROOT, 'lib', 'rooms'),
  path.join(ROOT, 'lib', 'hooks', 'use-p2p-connection.ts'),
  path.join(ROOT, 'lib', 'hooks', 'use-transfer-orchestrator.ts'),
];

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

function readTsConfig(filePath) {
  const parsed = ts.readConfigFile(filePath, ts.sys.readFile);
  if (parsed.error) {
    throw new Error(`failed to parse tsconfig: ${parsed.error.messageText}`);
  }
  return parsed.config || {};
}

function listTsFiles(entryPath) {
  if (!fs.existsSync(entryPath)) {
    return [];
  }

  const stats = fs.statSync(entryPath);
  if (stats.isFile()) {
    if (entryPath.endsWith('.ts') || entryPath.endsWith('.tsx')) {
      return [entryPath];
    }
    return [];
  }

  const files = [];
  const entries = fs.readdirSync(entryPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(entryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTsFiles(fullPath));
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  return files;
}

function listApiRouteFiles() {
  const apiRoot = path.join(ROOT, 'app', 'api');
  if (!fs.existsSync(apiRoot)) {
    return [];
  }

  return listTsFiles(apiRoot).filter((filePath) => path.basename(filePath) === 'route.ts');
}

function checkRequiredFiles() {
  const requiredFiles = [
    POLICY_PATH,
    TS_CONFIG_PATH,
    CRYPTO_BRANDS_PATH,
    P2P_HOOK_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'TypeScript enforcer policy, key type file, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required TypeScript enforcer files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkStrictTsConfig(tsConfig) {
  const compilerOptions = tsConfig.compilerOptions || {};
  const requiredTrueFlags = [
    'strict',
    'noImplicitAny',
    'strictNullChecks',
    'noUncheckedIndexedAccess',
  ];

  const missing = requiredTrueFlags.filter((flag) => compilerOptions[flag] !== true);

  return {
    name: 'TypeScript strict compiler flags are enabled',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? requiredTrueFlags.map((flag) => `${flag}=true`)
        : missing.map((flag) => `expected true: compilerOptions.${flag}`),
  };
}

function checkDirectiveSuppressions() {
  const runtimeFiles = [
    ...listTsFiles(path.join(ROOT, 'app')),
    ...listTsFiles(path.join(ROOT, 'components')),
    ...listTsFiles(path.join(ROOT, 'lib')),
  ];

  const findings = [];
  const suppressionPattern = /@ts-ignore|@ts-expect-error/;

  for (const filePath of runtimeFiles) {
    const content = readFile(filePath);
    if (!suppressionPattern.test(content)) {
      continue;
    }
    findings.push(toPosix(path.relative(ROOT, filePath)));
  }

  return {
    name: 'Runtime code has no TypeScript suppression directives',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? ['no @ts-ignore/@ts-expect-error markers in app/components/lib']
        : findings.map((item) => `suppression directive found: ${item}`),
  };
}

function checkCriticalPathAnyUsage() {
  const filePaths = CRITICAL_PATHS.flatMap((entryPath) => listTsFiles(entryPath));
  const findings = [];
  const forbiddenPattern = /\bas\s+any\b|:\s*any\b/;

  for (const filePath of filePaths) {
    const content = readFile(filePath);
    if (!forbiddenPattern.test(content)) {
      continue;
    }
    findings.push(toPosix(path.relative(ROOT, filePath)));
  }

  return {
    name: 'Security-critical paths avoid `as any` and `: any`',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? ['no `as any` or `: any` markers in critical API/crypto/hook paths']
        : findings.map((item) => `forbidden any marker: ${item}`),
  };
}

function checkApiValidationDiscipline() {
  const routeFiles = listApiRouteFiles();
  const findings = [];

  for (const routePath of routeFiles) {
    const content = readFile(routePath);
    const readsJsonBody = /request\.json\(|req\.json\(/.test(content);
    if (!readsJsonBody) {
      continue;
    }

    const hasValidation =
      /from\s+['"]zod['"]/.test(content) ||
      /safeParse\(/.test(content) ||
      /\.parse\(/.test(content) ||
      /ApiErrors\.badRequest\(/.test(content) ||
      /typeof\s+/.test(content);

    if (!hasValidation) {
      findings.push(toPosix(path.relative(ROOT, routePath)));
    }
  }

  return {
    name: 'API routes that parse JSON perform input validation checks',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? ['all JSON body routes expose schema or structural validation checks']
        : findings.map((item) => `missing validation markers: ${item}`),
  };
}

function checkBrandedKeyTypes() {
  const brandsContent = readFile(CRYPTO_BRANDS_PATH);
  const p2pContent = readFile(P2P_HOOK_PATH);
  const missing = [];

  if (!/\btype\s+PublicKey\b/.test(brandsContent)) {
    missing.push('missing PublicKey branded type');
  }
  if (!/\btype\s+PrivateKey\b/.test(brandsContent)) {
    missing.push('missing PrivateKey branded type');
  }
  if (!/\btype\s+SharedSecret\b/.test(brandsContent)) {
    missing.push('missing SharedSecret branded type');
  }
  if (!/\basPublicKey\b/.test(p2pContent)) {
    missing.push('p2p hook missing PublicKey branding usage');
  }
  if (!/\basSharedSecret\b/.test(p2pContent)) {
    missing.push('p2p hook missing SharedSecret branding usage');
  }

  return {
    name: 'Branded key types exist and are consumed in handshake code',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['PublicKey/PrivateKey/SharedSecret brands are defined and used'] : missing,
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
    name: 'TypeScript enforcer gate is wired in package scripts and workflows',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs TypeScript enforcer verification',
            '.github/workflows/release.yml runs TypeScript enforcer verification',
          ]
        : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# TypeScript Enforcer Verification',
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
    const tsConfig = readTsConfig(TS_CONFIG_PATH);
    const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkStrictTsConfig(tsConfig));
    checks.push(checkDirectiveSuppressions());
    checks.push(checkCriticalPathAnyUsage());
    checks.push(checkApiValidationDiscipline());
    checks.push(checkBrandedKeyTypes());
    checks.push(checkScriptAndWorkflow(packageJson, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `typescript-enforcer-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `typescript-enforcer-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-typescript-enforcer] JSON: ${jsonPath}`);
  console.log(`[verify-typescript-enforcer] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
