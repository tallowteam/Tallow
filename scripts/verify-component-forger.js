#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'COMPONENT_FORGER_POLICY.md');
const CVA_PATH = path.join(ROOT, 'lib', 'ui', 'cva.ts');
const BUTTON_PATH = path.join(ROOT, 'components', 'ui', 'Button.tsx');
const INPUT_PATH = path.join(ROOT, 'components', 'ui', 'Input.tsx');
const CARD_PATH = path.join(ROOT, 'components', 'ui', 'Card.tsx');
const FORGER_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'ui', 'component-forger.test.ts');
const BUTTON_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'components', 'Button.test.tsx');
const INPUT_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'components', 'Input.test.tsx');
const CARD_TEST_PATH = path.join(ROOT, 'tests', 'unit', 'components', 'Card.test.tsx');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:component:forger';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:component:forger';

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
    CVA_PATH,
    BUTTON_PATH,
    INPUT_PATH,
    CARD_PATH,
    FORGER_TEST_PATH,
    BUTTON_TEST_PATH,
    INPUT_TEST_PATH,
    CARD_TEST_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'Component forger policy, implementation, tests, and workflows exist',
    pass: missing.length === 0,
    details: missing.length === 0
      ? ['all required component-forger files are present']
      : missing.map((item) => `missing: ${item}`),
  };
}

function checkCvaUtility(cvaContent) {
  const findings = [];
  const requiredTokens = [
    'export function cva',
    'variants?: Record<string, Record<string, string | undefined>>',
    'defaultVariants?: Record<string, string>',
    'className?: string',
  ];

  for (const token of requiredTokens) {
    if (!cvaContent.includes(token)) {
      findings.push(`missing CVA utility token: ${token}`);
    }
  }

  return {
    name: 'CVA utility is present with typed variant configuration',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['typed CVA utility is defined in lib/ui/cva.ts']
      : findings,
  };
}

function checkComponentContracts(name, content, requiredTokens) {
  const findings = [];
  for (const token of requiredTokens) {
    if (!content.includes(token)) {
      findings.push(`missing ${name} token: ${token}`);
    }
  }

  const forbiddenPatterns = [
    { pattern: /:\s*any\b/, description: 'forbidden any type usage' },
    { pattern: /\sas\s+[A-Za-z_<{]/, description: 'forbidden type assertion usage' },
  ];

  for (const rule of forbiddenPatterns) {
    if (rule.pattern.test(content)) {
      findings.push(`${name} contains ${rule.description}`);
    }
  }

  return {
    name: `${name} follows forwardRef + CVA + displayName + no-any/no-assertion contract`,
    pass: findings.length === 0,
    details: findings.length === 0
      ? [`${name} satisfies governed component construction invariants`]
      : findings,
  };
}

function checkTests(forgerTestContent, buttonTestContent, inputTestContent, cardTestContent) {
  const findings = [];
  const requiredForgerTests = [
    'applies default variants when no overrides are provided',
    'applies explicit variant overrides and custom className',
    'ignores unknown variant selections and keeps base classes',
  ];
  const requiredComponentTestTokens = [
    { content: buttonTestContent, token: 'Ref Forwarding', name: 'Button test suite' },
    { content: inputTestContent, token: 'Ref Forwarding', name: 'Input test suite' },
    { content: cardTestContent, token: 'forwards ref to card element', name: 'Card test suite' },
    { content: cardTestContent, token: 'forwards ref to card header element', name: 'Card test suite' },
    { content: cardTestContent, token: 'forwards ref to card content element', name: 'Card test suite' },
    { content: cardTestContent, token: 'forwards ref to card footer element', name: 'Card test suite' },
  ];

  for (const token of requiredForgerTests) {
    if (!forgerTestContent.includes(token)) {
      findings.push(`missing component-forger test case: ${token}`);
    }
  }

  for (const item of requiredComponentTestTokens) {
    if (!item.content.includes(item.token)) {
      findings.push(`${item.name} missing token: ${item.token}`);
    }
  }

  return {
    name: 'Unit tests cover CVA contracts and ref-forwarding in governed components',
    pass: findings.length === 0,
    details: findings.length === 0
      ? ['component-forger unit coverage includes CVA behavior and ref-forwarding contracts']
      : findings,
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
    name: 'Component-forger gate is wired in package scripts and CI/release workflows',
    pass: findings.length === 0,
    details: findings.length === 0
      ? [
          `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
          '.github/workflows/ci.yml runs component-forger verification',
          '.github/workflows/release.yml runs component-forger verification',
        ]
      : findings,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# Component Forger Verification',
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
    const cvaContent = readFile(CVA_PATH);
    const buttonContent = readFile(BUTTON_PATH);
    const inputContent = readFile(INPUT_PATH);
    const cardContent = readFile(CARD_PATH);
    const forgerTestContent = readFile(FORGER_TEST_PATH);
    const buttonTestContent = readFile(BUTTON_TEST_PATH);
    const inputTestContent = readFile(INPUT_TEST_PATH);
    const cardTestContent = readFile(CARD_TEST_PATH);
    const packageJsonContent = readFile(PACKAGE_JSON_PATH);
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkCvaUtility(cvaContent));
    checks.push(
      checkComponentContracts('Button', buttonContent, [
        'forwardRef<HTMLButtonElement, ButtonProps>',
        'Button.displayName = \'Button\'',
        'buttonVariants = cva(',
      ])
    );
    checks.push(
      checkComponentContracts('Input', inputContent, [
        'forwardRef<HTMLInputElement, InputProps>',
        'Input.displayName = \'Input\'',
        'inputWrapperVariants = cva(',
        'inputFieldWrapperVariants = cva(',
      ])
    );
    checks.push(
      checkComponentContracts('Card', cardContent, [
        'forwardRef<HTMLDivElement, CardProps>',
        'Card.displayName = \'Card\'',
        'CardHeader.displayName = \'CardHeader\'',
        'CardContent.displayName = \'CardContent\'',
        'CardFooter.displayName = \'CardFooter\'',
        'cardVariants = cva(',
      ])
    );
    checks.push(checkTests(forgerTestContent, buttonTestContent, inputTestContent, cardTestContent));
    checks.push(checkScriptAndWorkflow(packageJsonContent, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `component-forger-verification-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `component-forger-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, markdownPath);

  console.log(`[verify-component-forger] JSON: ${jsonPath}`);
  console.log(`[verify-component-forger] Markdown: ${markdownPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
