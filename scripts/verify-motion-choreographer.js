#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'MOTION_CHOREOGRAPHER_POLICY.md');
const TOKENS_PATH = path.join(ROOT, 'lib', 'ui', 'motion-choreographer.ts');
const MODE_SELECTOR_CSS_PATH = path.join(ROOT, 'components', 'transfer', 'modeselector.module.css');
const SIDEBAR_CSS_PATH = path.join(ROOT, 'components', 'transfer', 'sidebar.module.css');
const DROPZONE_CSS_PATH = path.join(ROOT, 'components', 'transfer', 'dropzone.module.css');
const TEST_PATH = path.join(ROOT, 'tests', 'unit', 'ui', 'motion-choreographer.test.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:motion:choreographer';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:motion:choreographer';

const TRANSITION_ALLOWLIST = new Set(['transform', 'opacity', 'none']);

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
  const requiredFiles = [
    POLICY_PATH,
    TOKENS_PATH,
    MODE_SELECTOR_CSS_PATH,
    SIDEBAR_CSS_PATH,
    DROPZONE_CSS_PATH,
    TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Motion policy, transfer styles, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required motion-choreographer files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkMotionTokenContract(tokensContent) {
  const failures = [];
  const requiredTokens = [
    'MOTION_DURATION_MS = 300',
    'MOTION_CARD_HOVER_Y_PX = -2',
    'MOTION_TAP_SCALE = 0.98',
    "'transform'",
    "'opacity'",
    'isCompositorSafeMotionProperty',
  ];

  for (const token of requiredTokens) {
    if (!tokensContent.includes(token)) {
      failures.push(`missing motion token contract: ${token}`);
    }
  }

  return {
    name: 'Motion token contract defines duration/hover/tap/compositor-safe allowlist',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['motion token contract exports 300ms baseline, -2px hover, 0.98 tap, and transform/opacity allowlist']
      : failures,
  };
}

function checkModeSelectorMotion(modeSelectorCssContent) {
  const failures = [];
  const requiredTokens = [
    'transition: transform 300ms',
    'opacity 300ms',
    '.card:hover',
    'transform: translateY(-2px);',
    '.card:active',
    'transform: scale(0.98);',
  ];

  for (const token of requiredTokens) {
    if (!modeSelectorCssContent.includes(token)) {
      failures.push(`mode selector missing motion token: ${token}`);
    }
  }

  return {
    name: 'Mode-selector cards enforce 300ms hover/tap motion contract',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['mode cards use 300ms transform/opacity transitions with hover -2px and tap scale 0.98']
      : failures,
  };
}

function checkSidebarMotion(sidebarCssContent) {
  const failures = [];
  const requiredTokens = [
    '.modeButton:active',
    '.panelButton:active',
    '.mobileTab:active',
    'transform: scale(0.98);',
    'transform: translateY(-2px);',
    'transition: transform 300ms',
    'opacity 300ms',
  ];

  for (const token of requiredTokens) {
    if (!sidebarCssContent.includes(token)) {
      failures.push(`sidebar missing motion token: ${token}`);
    }
  }

  return {
    name: 'Sidebar buttons enforce tap-scale and compositor-safe transitions',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['sidebar mode/panel/mobile buttons use hover -2px and tap scale 0.98 with 300ms transform/opacity transitions']
      : failures,
  };
}

function checkDropZoneMotion(dropzoneCssContent) {
  const failures = [];
  const requiredTokens = [
    '.card:hover',
    '.card:active',
    '.dropZone:hover',
    '.dropZone:active',
    '.browseButton:active',
    '.cameraButton:active',
    '.removeButton:active',
    '.sendButton:active',
    'transform: translateY(-2px);',
    'transform: scale(0.98);',
    'transition: transform 300ms',
    'opacity 300ms',
  ];

  for (const token of requiredTokens) {
    if (!dropzoneCssContent.includes(token)) {
      failures.push(`drop zone missing motion token: ${token}`);
    }
  }

  return {
    name: 'Drop-zone cards/buttons enforce hover and tap motion contract',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['drop-zone surfaces use hover -2px, tap scale 0.98, and 300ms transform/opacity transitions']
      : failures,
  };
}

function splitByTopLevelCommas(value) {
  const segments = [];
  let current = '';
  let depth = 0;

  for (const char of value) {
    if (char === '(') {
      depth += 1;
      current += char;
      continue;
    }

    if (char === ')') {
      depth = Math.max(0, depth - 1);
      current += char;
      continue;
    }

    if (char === ',' && depth === 0) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        segments.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail.length > 0) {
    segments.push(tail);
  }

  return segments;
}

function checkCompositorSafeTransitions(cssByPath) {
  const failures = [];

  for (const [filePath, cssContent] of Object.entries(cssByPath)) {
    const transitions = cssContent.match(/transition:\s*([^;]+);/g) || [];

    for (const transitionDeclaration of transitions) {
      const value = transitionDeclaration.replace(/^transition:\s*/, '').replace(/;$/, '').trim();
      const segments = splitByTopLevelCommas(value);

      for (const segment of segments) {
        const property = segment.split(/\s+/)[0];
        if (!TRANSITION_ALLOWLIST.has(property)) {
          failures.push(`${filePath} has non-compositor transition property: ${property}`);
        }
      }
    }
  }

  return {
    name: 'Governed transfer motion transitions animate only transform + opacity',
    pass: failures.length === 0,
    details: failures.length === 0
      ? ['all governed transfer motion transitions are compositor-safe (transform/opacity only)']
      : failures,
  };
}

function checkTests(testContent) {
  const missing = [];
  const requiredCases = [
    'exposes 300ms as the default motion duration',
    'locks card hover and tap motion values',
    'only allows compositor-safe motion properties',
  ];

  for (const token of requiredCases) {
    if (!testContent.includes(token)) {
      missing.push(`missing test case: ${token}`);
    }
  }

  return {
    name: 'Unit tests assert motion token and compositor-safe contracts',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['motion token unit tests cover duration, hover/tap constants, and compositor-safe property guard']
      : missing,
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
    name: 'Motion choreographer gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs motion-choreographer verification',
          '.github/workflows/release.yml runs motion-choreographer verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Motion Choreographer Verification',
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
    const tokensContent = readFile(TOKENS_PATH);
    const modeSelectorCssContent = readFile(MODE_SELECTOR_CSS_PATH);
    const sidebarCssContent = readFile(SIDEBAR_CSS_PATH);
    const dropzoneCssContent = readFile(DROPZONE_CSS_PATH);
    const testContent = readFile(TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkMotionTokenContract(tokensContent));
    checks.push(checkModeSelectorMotion(modeSelectorCssContent));
    checks.push(checkSidebarMotion(sidebarCssContent));
    checks.push(checkDropZoneMotion(dropzoneCssContent));
    checks.push(
      checkCompositorSafeTransitions({
        'components/transfer/modeselector.module.css': modeSelectorCssContent,
        'components/transfer/sidebar.module.css': sidebarCssContent,
        'components/transfer/dropzone.module.css': dropzoneCssContent,
      })
    );
    checks.push(checkTests(testContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `motion-choreographer-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `motion-choreographer-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-motion-choreographer] JSON: ${jsonPath}`);
  console.log(`[verify-motion-choreographer] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
