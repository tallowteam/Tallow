/**
 * Missing Translation Detection
 * Development tool to identify missing or extra translation keys
 */

import { Locale, TranslationKeys } from './types';

/**
 * Recursively detect missing keys in translations compared to reference
 */
export function detectMissingTranslations(
  translations: Record<string, unknown>,
  reference: Record<string, unknown>,
  prefix: string = ''
): string[] {
  const missing: string[] = [];

  for (const key in reference) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (!(key in translations)) {
      missing.push(fullKey);
    } else if (
      typeof reference[key] === 'object' &&
      reference[key] !== null &&
      typeof translations[key] === 'object' &&
      translations[key] !== null
    ) {
      // Recursively check nested objects
      const nestedMissing = detectMissingTranslations(
        translations[key] as Record<string, unknown>,
        reference[key] as Record<string, unknown>,
        fullKey
      );
      missing.push(...nestedMissing);
    }
  }

  return missing;
}

/**
 * Detect extra keys that exist in translations but not in reference
 */
export function detectExtraTranslations(
  translations: Record<string, unknown>,
  reference: Record<string, unknown>,
  prefix: string = ''
): string[] {
  const extra: string[] = [];

  for (const key in translations) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (!(key in reference)) {
      extra.push(fullKey);
    } else if (
      typeof reference[key] === 'object' &&
      reference[key] !== null &&
      typeof translations[key] === 'object' &&
      translations[key] !== null
    ) {
      // Recursively check nested objects
      const nestedExtra = detectExtraTranslations(
        translations[key] as Record<string, unknown>,
        reference[key] as Record<string, unknown>,
        fullKey
      );
      extra.push(...nestedExtra);
    }
  }

  return extra;
}

/**
 * Get comprehensive missing keys report for a locale
 */
export function getMissingKeysReport(
  locale: Locale,
  translations: Partial<TranslationKeys>,
  reference: TranslationKeys
): {
  missing: string[];
  extra: string[];
  coverage: number;
} {
  const missing = detectMissingTranslations(
    translations as Record<string, unknown>,
    reference as Record<string, unknown>
  );

  const extra = detectExtraTranslations(
    translations as Record<string, unknown>,
    reference as Record<string, unknown>
  );

  const totalKeys = Object.keys(reference).length;
  const translatedKeys = totalKeys - missing.length;
  const coverage = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0;

  return {
    missing,
    extra,
    coverage,
  };
}

/**
 * Log missing translations in development mode
 */
export function logMissingTranslations(
  locale: Locale,
  missing: string[]
): void {
  if (process.env.NODE_ENV !== 'development' || missing.length === 0) {
    return;
  }

  console.group(`🌐 Missing translations for locale: ${locale}`);
  missing.forEach(key => {
    console.warn(`  ❌ ${key}`);
  });
  console.groupEnd();
}

/**
 * Log extra translations in development mode
 */
export function logExtraTranslations(
  locale: Locale,
  extra: string[]
): void {
  if (process.env.NODE_ENV !== 'development' || extra.length === 0) {
    return;
  }

  console.group(`🌐 Extra translations for locale: ${locale}`);
  extra.forEach(key => {
    console.info(`  ℹ️  ${key}`);
  });
  console.groupEnd();
}

/**
 * Log translation coverage statistics
 */
export function logTranslationCoverage(
  locale: Locale,
  coverage: number,
  totalKeys: number,
  missingCount: number
): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const emoji = coverage === 100 ? '✅' : coverage >= 90 ? '⚠️' : '❌';
  console.log(
    `${emoji} Translation coverage for ${locale}: ${coverage.toFixed(1)}% (${totalKeys - missingCount}/${totalKeys} keys)`
  );
}

/**
 * Validate translation file structure
 */
export function validateTranslationStructure(
  translations: unknown
): translations is Record<string, unknown> {
  if (typeof translations !== 'object' || translations === null) {
    console.error('Translation file must export an object');
    return false;
  }

  return true;
}

/**
 * Generate a report of all translations
 */
export function generateTranslationReport(
  locales: Locale[],
  allTranslations: Record<Locale, Partial<TranslationKeys>>,
  reference: TranslationKeys
): {
  locale: Locale;
  coverage: number;
  missing: number;
  extra: number;
}[] {
  return locales.map(locale => {
    const report = getMissingKeysReport(
      locale,
      allTranslations[locale] || {},
      reference
    );

    return {
      locale,
      coverage: report.coverage,
      missing: report.missing.length,
      extra: report.extra.length,
    };
  });
}

/**
 * Find untranslated keys across all locales
 */
export function findUntranslatedKeys(
  locales: Locale[],
  allTranslations: Record<Locale, Partial<TranslationKeys>>,
  reference: TranslationKeys
): string[] {
  const untranslated = new Set<string>();

  locales.forEach(locale => {
    const report = getMissingKeysReport(
      locale,
      allTranslations[locale] || {},
      reference
    );

    report.missing.forEach(key => untranslated.add(key));
  });

  return Array.from(untranslated).sort();
}
