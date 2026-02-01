#!/usr/bin/env ts-node

/**
 * I18N Translation Audit Tool
 * Checks all 22 language files for:
 * - Missing keys
 * - Extra keys
 * - Placeholder mismatches
 * - Empty values
 * - Translation completeness
 */

import * as fs from 'fs';
import * as path from 'path';

const TRANSLATIONS_DIR = path.join(__dirname, '..', 'lib', 'i18n', 'translations');

// Languages to check
const languages = [
  'en', 'es', 'zh', 'hi', 'ar', 'he', 'pt', 'bn', 'ru', 'ja',
  'de', 'fr', 'ko', 'tr', 'it', 'vi', 'pl', 'nl', 'th', 'id', 'uk', 'ur'
];

interface TranslationFile {
  [key: string]: string;
}

interface AuditResult {
  language: string;
  totalKeys: number;
  missingKeys: string[];
  extraKeys: string[];
  emptyValues: string[];
  placeholderMismatches: Array<{ key: string; expected: string[]; found: string[] }>;
  completeness: number;
}

/**
 * Extract placeholders from a translation string
 * Supports: {var}, {{var}}, %s, %d, etc.
 */
function extractPlaceholders(text: string): string[] {
  const placeholders: string[] = [];

  // {variable} or {{variable}}
  const braceMatches = text.matchAll(/\{+([a-zA-Z0-9_]+)\}+/g);
  for (const match of braceMatches) {
    if (match[0]) placeholders.push(match[0]);
  }

  // %s, %d, %f, etc.
  const percentMatches = text.matchAll(/%[sdfiouxXeEfFgGaAcCpn]/g);
  for (const match of percentMatches) {
    if (match[0]) placeholders.push(match[0]);
  }

  // # symbol (for plurals)
  if (text.includes('#')) {
    placeholders.push('#');
  }

  return placeholders.sort();
}

/**
 * Load translation file
 */
function loadTranslations(language: string): TranslationFile {
  const filePath = path.join(TRANSLATIONS_DIR, `${language}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${language}.json:`, error);
    return {};
  }
}

/**
 * Audit a language file against English (base)
 */
function auditLanguage(language: string, baseTranslations: TranslationFile): AuditResult {
  const translations = loadTranslations(language);
  const baseKeys = Object.keys(baseTranslations);
  const langKeys = Object.keys(translations);

  const missingKeys = baseKeys.filter(key => !langKeys.includes(key));
  const extraKeys = langKeys.filter(key => !baseKeys.includes(key));
  const emptyValues = langKeys.filter(key => !translations[key] || translations[key].trim() === '');

  const placeholderMismatches: AuditResult['placeholderMismatches'] = [];

  // Check placeholder consistency
  for (const key of baseKeys) {
    const baseValue = baseTranslations[key];
    const langValue = translations[key];
    if (langValue && baseValue) {
      const basePlaceholders = extractPlaceholders(baseValue);
      const langPlaceholders = extractPlaceholders(langValue);

      if (JSON.stringify(basePlaceholders) !== JSON.stringify(langPlaceholders)) {
        placeholderMismatches.push({
          key,
          expected: basePlaceholders,
          found: langPlaceholders,
        });
      }
    }
  }

  const completeness = Math.round(
    ((baseKeys.length - missingKeys.length) / baseKeys.length) * 100
  );

  return {
    language,
    totalKeys: baseKeys.length,
    missingKeys,
    extraKeys,
    emptyValues,
    placeholderMismatches,
    completeness,
  };
}

/**
 * Main audit function
 */
function main() {
  console.log('🌍 Tallow I18N Translation Audit\n');
  console.log(`Auditing ${languages.length} languages...\n`);

  // Load English as base
  const baseTranslations = loadTranslations('en');
  const baseKeyCount = Object.keys(baseTranslations).length;

  console.log(`📝 Base (English): ${baseKeyCount} keys\n`);
  console.log('─'.repeat(80));
  console.log('');

  const results: AuditResult[] = [];

  for (const language of languages) {
    if (language === 'en') continue; // Skip base

    const result = auditLanguage(language, baseTranslations);
    results.push(result);

    // Print result
    const status = result.completeness === 100 ? '✅' : '⚠️';
    console.log(`${status} ${language.toUpperCase()} - ${result.completeness}% complete`);

    if (result.missingKeys.length > 0) {
      console.log(`   Missing: ${result.missingKeys.length} keys`);
    }

    if (result.extraKeys.length > 0) {
      console.log(`   Extra: ${result.extraKeys.length} keys`);
    }

    if (result.emptyValues.length > 0) {
      console.log(`   Empty: ${result.emptyValues.length} values`);
    }

    if (result.placeholderMismatches.length > 0) {
      console.log(`   Placeholder issues: ${result.placeholderMismatches.length}`);
    }

    console.log('');
  }

  console.log('─'.repeat(80));
  console.log('');

  // Summary
  const avgCompleteness = Math.round(
    results.reduce((sum, r) => sum + r.completeness, 0) / results.length
  );

  const fullyComplete = results.filter(r => r.completeness === 100).length;
  const needsWork = results.filter(r => r.completeness < 90).length;

  console.log('📊 Summary:');
  console.log(`   Average completeness: ${avgCompleteness}%`);
  console.log(`   Fully complete: ${fullyComplete}/${results.length}`);
  console.log(`   Needs work (<90%): ${needsWork}`);
  console.log('');

  // Detailed issues
  console.log('🔍 Detailed Issues:\n');

  for (const result of results.filter(r => r.completeness < 100 || r.placeholderMismatches.length > 0)) {
    console.log(`\n${result.language.toUpperCase()}:`);

    if (result.missingKeys.length > 0) {
      console.log(`\n  Missing keys (${result.missingKeys.length}):`);
      result.missingKeys.slice(0, 10).forEach(key => {
        console.log(`    - ${key}`);
      });
      if (result.missingKeys.length > 10) {
        console.log(`    ... and ${result.missingKeys.length - 10} more`);
      }
    }

    if (result.extraKeys.length > 0) {
      console.log(`\n  Extra keys (${result.extraKeys.length}):`);
      result.extraKeys.slice(0, 5).forEach(key => {
        console.log(`    - ${key}`);
      });
      if (result.extraKeys.length > 5) {
        console.log(`    ... and ${result.extraKeys.length - 5} more`);
      }
    }

    if (result.placeholderMismatches.length > 0) {
      console.log(`\n  Placeholder mismatches (${result.placeholderMismatches.length}):`);
      result.placeholderMismatches.slice(0, 5).forEach(issue => {
        console.log(`    - ${issue.key}`);
        console.log(`      Expected: [${issue.expected.join(', ')}]`);
        console.log(`      Found: [${issue.found.join(', ')}]`);
      });
      if (result.placeholderMismatches.length > 5) {
        console.log(`    ... and ${result.placeholderMismatches.length - 5} more`);
      }
    }
  }

  console.log('\n');
  console.log('─'.repeat(80));
  console.log('✨ Audit complete!\n');

  // Exit with error if any language is below 80%
  if (results.some(r => r.completeness < 80)) {
    console.log('❌ Some languages are below 80% complete. Please update translations.');
    process.exit(1);
  }
}

main();
