#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'PWA_ENGINEER_POLICY.md');
const MANIFEST_PATH = path.join(ROOT, 'public', 'manifest.json');
const SERVICE_WORKER_PATH = path.join(ROOT, 'public', 'sw.js');
const LAYOUT_PATH = path.join(ROOT, 'app', 'layout.tsx');
const PERF_INIT_PATH = path.join(ROOT, 'lib', 'performance', 'PerformanceInit.tsx');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:pwa:engineer';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:pwa:engineer';

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

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function checkRequiredFiles() {
  const required = [
    POLICY_PATH,
    MANIFEST_PATH,
    SERVICE_WORKER_PATH,
    LAYOUT_PATH,
    PERF_INIT_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = required
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'PWA policy, manifest, service worker, and workflow files exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required PWA engineer files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function checkManifest(manifestContent) {
  const findings = [];
  let manifest;

  try {
    manifest = JSON.parse(manifestContent);
  } catch (error) {
    return {
      name: 'Manifest defines installable PWA metadata',
      pass: false,
      details: [`manifest JSON parse failed: ${error instanceof Error ? error.message : String(error)}`],
    };
  }

  if (manifest.start_url !== '/') {
    findings.push(`manifest.start_url should be "/", found "${manifest.start_url}"`);
  }
  if (!['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display)) {
    findings.push(`manifest.display should be installable mode, found "${manifest.display}"`);
  }
  if (manifest.scope !== '/') {
    findings.push(`manifest.scope should be "/", found "${manifest.scope}"`);
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const has192 = icons.some((icon) => icon && icon.sizes && String(icon.sizes).includes('192x192'));
  const has512 = icons.some((icon) => icon && icon.sizes && String(icon.sizes).includes('512x512'));
  if (!has192) {
    findings.push('manifest missing 192x192 icon');
  }
  if (!has512) {
    findings.push('manifest missing 512x512 icon');
  }

  return {
    name: 'Manifest defines installable PWA metadata',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['manifest includes installable display/start_url/scope/icons metadata'] : findings,
  };
}

function checkLayoutAndRegistration(layoutContent, performanceInitContent) {
  const findings = [];

  if (!/manifest:\s*'\/manifest\.json'/.test(layoutContent)) {
    findings.push('app/layout.tsx metadata is missing manifest: \'/manifest.json\'');
  }
  if (!/import\s+\{\s*PerformanceInit\s*\}\s+from\s+'@\/lib\/performance\/PerformanceInit';/.test(layoutContent)) {
    findings.push('app/layout.tsx missing PerformanceInit import');
  }
  if (!/<PerformanceInit\s*\/>/.test(layoutContent)) {
    findings.push('app/layout.tsx missing <PerformanceInit /> mount');
  }
  if (!/navigator\.serviceWorker[\s\S]*\.register\('\/sw\.js'/.test(performanceInitContent)) {
    findings.push('PerformanceInit is not registering /sw.js service worker');
  }
  if (!/process\.env\.NODE_ENV\s*!==\s*'production'/.test(performanceInitContent)) {
    findings.push('PerformanceInit missing production-only service worker guard');
  }

  return {
    name: 'Root layout references manifest and mounts production SW registration',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['layout + performance init correctly wire manifest and SW registration'] : findings,
  };
}

function checkOfflineScope(serviceWorkerContent) {
  const findings = [];

  if (!/PRECACHE_PAGES\s*=\s*\[[\s\S]*'\/transfer'/.test(serviceWorkerContent)) {
    findings.push('sw.js precache list missing /transfer');
  }
  if (!/PRECACHE_PAGES\s*=\s*\[[\s\S]*'\/settings'/.test(serviceWorkerContent)) {
    findings.push('sw.js precache list missing /settings');
  }
  if (!/request\.mode === 'navigate'[\s\S]*staleWhileRevalidate\(request,\s*PAGES_CACHE\)/.test(serviceWorkerContent)) {
    findings.push('navigation requests are not routed through stale-while-revalidate');
  }
  if (!/url\.pathname\.startsWith\('\/api\/'\)/.test(serviceWorkerContent)) {
    findings.push('service worker missing network-only exclusion for API routes');
  }
  if (!/url\.pathname\.includes\('socket\.io'\)\s*\|\|\s*url\.pathname\.includes\('ws'\)/.test(serviceWorkerContent)) {
    findings.push('service worker missing signaling/WebSocket network-only exclusion');
  }
  if (!/You are offline/.test(serviceWorkerContent)) {
    findings.push('offline fallback text "You are offline" is missing');
  }
  if (!/requires a network connection for peer-to-peer file transfers/.test(serviceWorkerContent)) {
    findings.push('offline fallback does not communicate transfer network requirement');
  }

  return {
    name: 'Service worker enforces offline website scope and online transfer boundaries',
    pass: findings.length === 0,
    details: findings.length === 0 ? ['sw.js caches website routes while preserving network-only transfer boundaries'] : findings,
  };
}

function checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent) {
  const findings = [];
  const packageJson = JSON.parse(packageJsonContent);

  if (!(packageJson.scripts || {})[REQUIRED_SCRIPT_NAME]) {
    findings.push(`missing package script: ${REQUIRED_SCRIPT_NAME}`);
  }
  if (!ciContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    findings.push(`CI workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }
  if (!releaseContent.includes(REQUIRED_WORKFLOW_COMMAND)) {
    findings.push(`release workflow missing command: ${REQUIRED_WORKFLOW_COMMAND}`);
  }

  return {
    name: 'PWA engineer gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs PWA engineer verification',
            '.github/workflows/release.yml runs PWA engineer verification',
          ]
        : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# PWA Engineer Verification',
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
    const manifestContent = readFile(MANIFEST_PATH);
    const serviceWorkerContent = readFile(SERVICE_WORKER_PATH);
    const layoutContent = readFile(LAYOUT_PATH);
    const performanceInitContent = readFile(PERF_INIT_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkManifest(manifestContent));
    checks.push(checkLayoutAndRegistration(layoutContent, performanceInitContent));
    checks.push(checkOfflineScope(serviceWorkerContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `pwa-engineer-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `pwa-engineer-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-pwa-engineer] JSON: ${jsonPath}`);
  console.log(`[verify-pwa-engineer] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
