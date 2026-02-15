#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const STORES_DIR = path.join(ROOT, 'lib', 'stores');
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'STATE_ARCHITECT_POLICY.md');
const QUERY_PROVIDER_PATH = path.join(ROOT, 'components', 'theme', 'query-provider.tsx');
const LAYOUT_PATH = path.join(ROOT, 'app', 'layout.tsx');
const FEATURE_FLAGS_QUERY_HOOK_PATH = path.join(ROOT, 'lib', 'hooks', 'use-feature-flags-query.ts');
const ADMIN_PAGE_PATH = path.join(ROOT, 'app', 'admin', 'page.tsx');
const TRANSFER_PAGE_PATH = path.join(ROOT, 'app', 'transfer', 'page.tsx');
const SETTINGS_PAGE_PATH = path.join(ROOT, 'app', 'settings', 'page.tsx');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:state:architect';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:state:architect';

const FORBIDDEN_SECRET_PATTERNS = [
  /\bprivateKey\b/i,
  /\bsharedSecret\b/i,
  /\bmnemonic\b/i,
  /\bseedPhrase\b/i,
  /\bpassword\b/i,
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

function listStoreFiles() {
  if (!fs.existsSync(STORES_DIR)) {
    return [];
  }

  return fs
    .readdirSync(STORES_DIR)
    .filter((name) => name.endsWith('-store.ts'))
    .map((name) => path.join(STORES_DIR, name));
}

function checkRequiredFiles() {
  const requiredFiles = [
    POLICY_PATH,
    QUERY_PROVIDER_PATH,
    LAYOUT_PATH,
    FEATURE_FLAGS_QUERY_HOOK_PATH,
    ADMIN_PAGE_PATH,
    TRANSFER_PAGE_PATH,
    SETTINGS_PAGE_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'State policy, React Query integration files, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required state architect files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkReactQueryDependency(packageJson) {
  const dependencies = packageJson.dependencies || {};
  const dependencyValue = dependencies['@tanstack/react-query'];

  return {
    name: 'React Query dependency is declared for server state',
    pass: typeof dependencyValue === 'string' && dependencyValue.length > 0,
    details:
      typeof dependencyValue === 'string' && dependencyValue.length > 0
        ? [`@tanstack/react-query: ${dependencyValue}`]
        : ['missing dependency: @tanstack/react-query'],
  };
}

function checkQueryProviderWiring(layoutContent, providerContent) {
  const missing = [];
  if (!providerContent.includes('QueryClientProvider')) {
    missing.push('query provider missing QueryClientProvider');
  }
  if (!layoutContent.includes('QueryProvider')) {
    missing.push('app/layout.tsx missing QueryProvider usage');
  }

  return {
    name: 'Root layout wires QueryClientProvider through QueryProvider',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['query provider is created and wrapped at root layout'] : missing,
  };
}

function checkServerStateHook(hookContent, adminContent) {
  const missing = [];

  if (!hookContent.includes('useQuery')) {
    missing.push('feature flag hook missing useQuery');
  }
  if (!hookContent.includes('/api/flags')) {
    missing.push('feature flag hook missing /api/flags fetch contract');
  }
  if (!adminContent.includes('useFeatureFlagsQuery')) {
    missing.push('admin page missing useFeatureFlagsQuery consumption');
  }
  if (!adminContent.includes('featureFlagsResponse')) {
    missing.push('admin page missing rendered feature flag state binding');
  }

  return {
    name: 'Server state is consumed through React Query hooks in production UI',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['React Query hook + admin page usage verified'] : missing,
  };
}

function checkShallowSelectors(transferContent, settingsContent) {
  const missing = [];
  if (!transferContent.includes("from 'zustand/react/shallow'")) {
    missing.push('transfer page missing shallow import');
  }
  if (!transferContent.includes('useDeviceStore(') || !transferContent.includes('shallow')) {
    missing.push('transfer page missing shallow selector usage for zustand stores');
  }
  if (!settingsContent.includes("from 'zustand/react/shallow'")) {
    missing.push('settings page missing shallow import');
  }
  if (!settingsContent.includes('useSettingsStore(') || !settingsContent.includes('shallow')) {
    missing.push('settings page missing shallow selector usage');
  }

  return {
    name: 'Composite Zustand subscriptions use shallow selector equality',
    pass: missing.length === 0,
    details: missing.length === 0 ? ['transfer and settings pages use shallow selector objects'] : missing,
  };
}

function checkZustandClientState(storeFiles) {
  if (storeFiles.length === 0) {
    return {
      name: 'Zustand client state baseline exists',
      pass: false,
      details: ['no store files found in lib/stores'],
    };
  }

  const missingCreateImport = [];
  for (const storePath of storeFiles) {
    const content = readFile(storePath);
    if (!content.includes("from 'zustand'")) {
      missingCreateImport.push(`not a zustand store file: ${toPosix(path.relative(ROOT, storePath))}`);
    }
  }

  return {
    name: 'Client state remains centralized in Zustand stores',
    pass: missingCreateImport.length === 0,
    details:
      missingCreateImport.length === 0
        ? [`zustand store files validated: ${storeFiles.length}`]
        : missingCreateImport,
  };
}

function checkNoHighRiskSecretsInStores(storeFiles) {
  const findings = [];

  for (const storePath of storeFiles) {
    const content = readFile(storePath);
    for (const pattern of FORBIDDEN_SECRET_PATTERNS) {
      if (pattern.test(content)) {
        findings.push(`${toPosix(path.relative(ROOT, storePath))}: matched forbidden pattern ${pattern}`);
      }
    }
  }

  return {
    name: 'High-risk secrets are not stored in Zustand store files',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['no forbidden secret markers detected in lib/stores'] : findings,
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
    name: 'State architect gate is wired in package scripts and workflows',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs state architect verification',
            '.github/workflows/release.yml runs state architect verification',
          ]
        : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# State Architect Verification',
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
    const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
    const layoutContent = readFile(LAYOUT_PATH);
    const queryProviderContent = readFile(QUERY_PROVIDER_PATH);
    const hookContent = readFile(FEATURE_FLAGS_QUERY_HOOK_PATH);
    const adminContent = readFile(ADMIN_PAGE_PATH);
    const transferContent = readFile(TRANSFER_PAGE_PATH);
    const settingsContent = readFile(SETTINGS_PAGE_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);
    const storeFiles = listStoreFiles();

    checks.push(checkReactQueryDependency(packageJson));
    checks.push(checkQueryProviderWiring(layoutContent, queryProviderContent));
    checks.push(checkServerStateHook(hookContent, adminContent));
    checks.push(checkShallowSelectors(transferContent, settingsContent));
    checks.push(checkZustandClientState(storeFiles));
    checks.push(checkNoHighRiskSecretsInStores(storeFiles));
    checks.push(checkScriptAndWorkflow(packageJson, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `state-architect-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `state-architect-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-state-architect] JSON: ${jsonPath}`);
  console.log(`[verify-state-architect] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
