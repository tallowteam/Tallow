#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'docs', 'governance', 'I18N_DIPLOMAT_POLICY.md');
const I18N_CONFIG_PATH = path.join(ROOT, 'lib', 'i18n', 'i18n.ts');
const LOCALES_INDEX_PATH = path.join(ROOT, 'lib', 'i18n', 'locales', 'index.ts');
const I18N_TYPES_PATH = path.join(ROOT, 'lib', 'i18n', 'types.ts');
const RTL_SUPPORT_PATH = path.join(ROOT, 'lib', 'i18n', 'rtl-support.ts');
const LOCALE_FORMATTING_PATH = path.join(ROOT, 'lib', 'i18n', 'locale-formatting.ts');
const MISSING_DETECTION_PATH = path.join(ROOT, 'lib', 'i18n', 'missing-detection.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const CI_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'ci.yml');
const RELEASE_WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'release.yml');

const REQUIRED_SCRIPT_NAME = 'verify:i18n:diplomat';
const REQUIRED_WORKFLOW_COMMAND = 'npm run verify:i18n:diplomat';
const EXPECTED_LOCALE_COUNT = 22;

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

function checkRequiredFiles() {
  const requiredFiles = [
    POLICY_PATH,
    I18N_CONFIG_PATH,
    LOCALES_INDEX_PATH,
    I18N_TYPES_PATH,
    RTL_SUPPORT_PATH,
    LOCALE_FORMATTING_PATH,
    MISSING_DETECTION_PATH,
    PACKAGE_JSON_PATH,
    CI_WORKFLOW_PATH,
    RELEASE_WORKFLOW_PATH,
  ];

  const missing = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toPosix(path.relative(ROOT, filePath)));

  return {
    name: 'i18n policy, runtime modules, and workflows exist',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? ['all required i18n diplomat files are present']
        : missing.map((item) => `missing: ${item}`),
  };
}

function extractLocaleImports(localesIndexContent) {
  const imports = [];
  const importPattern = /^import\s+\w+\s+from\s+['"]\.\/([^'"]+)['"];?/gm;
  let match = importPattern.exec(localesIndexContent);
  while (match) {
    imports.push(match[1]);
    match = importPattern.exec(localesIndexContent);
  }
  return imports;
}

function extractLocaleTypeValues(typesContent) {
  const typeMatch = typesContent.match(/export type Locale\s*=\s*([\s\S]*?);/);
  if (!typeMatch) {
    return [];
  }

  const values = new Set();
  const valuePattern = /'([^']+)'/g;
  let match = valuePattern.exec(typeMatch[1]);
  while (match) {
    values.add(match[1]);
    match = valuePattern.exec(typeMatch[1]);
  }

  return Array.from(values);
}

function checkLocaleInventory(localesIndexContent, i18nContent, typesContent) {
  const findings = [];
  const importedLocales = extractLocaleImports(localesIndexContent);
  const localeTypes = extractLocaleTypeValues(typesContent);

  if (importedLocales.length !== EXPECTED_LOCALE_COUNT) {
    findings.push(
      `expected ${EXPECTED_LOCALE_COUNT} locale imports in lib/i18n/locales/index.ts, found ${importedLocales.length}`
    );
  }
  if (localeTypes.length < EXPECTED_LOCALE_COUNT) {
    findings.push(`expected at least ${EXPECTED_LOCALE_COUNT} locale values in lib/i18n/types.ts, found ${localeTypes.length}`);
  }
  if (!/LANGUAGES:\s*Record<LocaleCode,\s*LanguageConfig>\s*=\s*LOCALE_CODES\.reduce/.test(i18nContent)) {
    findings.push('i18n runtime registry is not derived from LOCALE_CODES');
  }
  if (!/export type LanguageCode\s*=\s*LocaleCode;/.test(i18nContent)) {
    findings.push('LanguageCode is not aligned to LocaleCode');
  }
  if (!/export const messages\s*=\s*locales;/.test(i18nContent)) {
    findings.push('messages map is not bound to locales index');
  }
  if (!/const baseLanguage = normalizedBrowserLanguage\.split\('-'\)\[0\]/.test(i18nContent)) {
    findings.push('base-language browser fallback is missing in detectLanguage');
  }

  return {
    name: 'Locale inventory and runtime language registry cover 22 locales',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? [
            `locale imports in index.ts: ${importedLocales.length}`,
            `locale type values in types.ts: ${localeTypes.length}`,
            'runtime registry derives from LOCALE_CODES with full LocaleCode coverage',
          ]
        : findings,
  };
}

function checkRtlSupport(rtlContent, localesIndexContent) {
  const findings = [];

  if (!/RTL_LOCALES:\s*Locale\[\]\s*=\s*\[[^\]]*'ar'/.test(rtlContent)) {
    findings.push('RTL locale list missing Arabic (`ar`)');
  }
  if (!/RTL_LOCALES:\s*Locale\[\]\s*=\s*\[[^\]]*'he'/.test(rtlContent)) {
    findings.push('RTL locale list missing Hebrew (`he`)');
  }
  if (!/document\.documentElement\.setAttribute\('dir',\s*direction\)/.test(rtlContent)) {
    findings.push('document dir attribute is not updated for locale direction');
  }
  if (!/document\.documentElement\.setAttribute\('lang',\s*locale\)/.test(rtlContent)) {
    findings.push('document lang attribute is not updated on locale change');
  }
  if (!/classList\.add\('rtl'\)/.test(rtlContent) || !/classList\.remove\('rtl'\)/.test(rtlContent)) {
    findings.push('rtl class toggling is incomplete');
  }

  if (!/ar:\s*\{[\s\S]*?dir:\s*'rtl'/.test(localesIndexContent)) {
    findings.push('locale metadata for `ar` is not marked rtl');
  }
  if (!/he:\s*\{[\s\S]*?dir:\s*'rtl'/.test(localesIndexContent)) {
    findings.push('locale metadata for `he` is not marked rtl');
  }

  return {
    name: 'RTL locales and document direction controls are enforced',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? ['Arabic and Hebrew RTL handling plus document dir/lang switching verified']
        : findings,
  };
}

function checkLocaleFormatting(formattingContent) {
  const findings = [];

  const requiredFunctions = [
    'formatNumber',
    'formatDate',
    'formatDateTime',
    'formatRelativeTime',
    'formatCurrency',
    'formatList',
  ];

  for (const functionName of requiredFunctions) {
    if (!new RegExp(`export function ${functionName}\\s*\\(`).test(formattingContent)) {
      findings.push(`missing locale formatting helper: ${functionName}`);
    }
  }

  const requiredIntlUsages = [
    'Intl.NumberFormat',
    'Intl.DateTimeFormat',
    'Intl.RelativeTimeFormat',
    'Intl.ListFormat',
  ];
  for (const intlUsage of requiredIntlUsages) {
    if (!formattingContent.includes(intlUsage)) {
      findings.push(`missing Intl usage: ${intlUsage}`);
    }
  }

  return {
    name: 'Locale formatting routes through Intl-aware helpers',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? ['number/date/time/relative/currency/list formatting helpers are present and Intl-backed']
        : findings,
  };
}

function checkMissingTranslationDetection(missingDetectionContent) {
  const findings = [];

  const requiredFunctions = [
    'detectMissingTranslations',
    'detectExtraTranslations',
    'getMissingKeysReport',
    'generateTranslationReport',
    'findUntranslatedKeys',
  ];

  for (const functionName of requiredFunctions) {
    if (!new RegExp(`export function ${functionName}\\s*\\(`).test(missingDetectionContent)) {
      findings.push(`missing translation detection function: ${functionName}`);
    }
  }

  if (!/process\.env\.NODE_ENV\s*!==\s*'development'/.test(missingDetectionContent)) {
    findings.push('development-mode translation logging guards are missing');
  }

  return {
    name: 'Missing-translation detection utilities remain available',
    pass: findings.length === 0,
    details:
      findings.length === 0
        ? ['translation missing/extra detection and reporting helpers are present']
        : findings,
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
    name: 'i18n diplomat gate is wired in package scripts and workflows',
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? [
            `${REQUIRED_SCRIPT_NAME}: ${packageJson.scripts[REQUIRED_SCRIPT_NAME]}`,
            '.github/workflows/ci.yml runs i18n diplomat verification',
            '.github/workflows/release.yml runs i18n diplomat verification',
          ]
        : missing,
  };
}

function writeMarkdownReport(report, outputPath) {
  const lines = [
    '# I18N Diplomat Verification',
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
    const localesIndexContent = readFile(LOCALES_INDEX_PATH);
    const i18nContent = readFile(I18N_CONFIG_PATH);
    const typesContent = readFile(I18N_TYPES_PATH);
    const rtlContent = readFile(RTL_SUPPORT_PATH);
    const formattingContent = readFile(LOCALE_FORMATTING_PATH);
    const missingDetectionContent = readFile(MISSING_DETECTION_PATH);
    const packageJson = JSON.parse(readFile(PACKAGE_JSON_PATH));
    const ciContent = readFile(CI_WORKFLOW_PATH);
    const releaseContent = readFile(RELEASE_WORKFLOW_PATH);

    checks.push(checkLocaleInventory(localesIndexContent, i18nContent, typesContent));
    checks.push(checkRtlSupport(rtlContent, localesIndexContent));
    checks.push(checkLocaleFormatting(formattingContent));
    checks.push(checkMissingTranslationDetection(missingDetectionContent));
    checks.push(checkScriptAndWorkflow(packageJson, ciContent, releaseContent));
  }

  const report = {
    timestamp: new Date().toISOString(),
    checks,
    passed: checks.every((check) => check.pass),
  };

  const outputDirectory = resolveReportsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDirectory, `i18n-diplomat-verification-${stamp}.json`);
  const mdPath = path.join(outputDirectory, `i18n-diplomat-verification-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  writeMarkdownReport(report, mdPath);

  console.log(`[verify-i18n-diplomat] JSON: ${jsonPath}`);
  console.log(`[verify-i18n-diplomat] Markdown: ${mdPath}`);

  if (!report.passed) {
    process.exit(1);
  }
}

main();
