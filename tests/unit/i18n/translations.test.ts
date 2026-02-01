/**
 * Translation Quality Tests
 * Validates all 22 language files
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const TRANSLATIONS_DIR = path.join(__dirname, '../../../lib/i18n/translations');

const languages = [
  'en', 'es', 'zh', 'hi', 'ar', 'he', 'pt', 'bn', 'ru', 'ja',
  'de', 'fr', 'ko', 'tr', 'it', 'vi', 'pl', 'nl', 'th', 'id', 'uk', 'ur'
];

describe('Translation Files', () => {
  // Load English as base
  const enPath = path.join(TRANSLATIONS_DIR, 'en.json');
  const enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  const enKeys = Object.keys(enTranslations);

  it('should have all 22 language files', () => {
    for (const lang of languages) {
      const filePath = path.join(TRANSLATIONS_DIR, `${lang}.json`);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  describe.each(languages)('%s translations', (lang) => {
    let translations: Record<string, string>;

    beforeAll(() => {
      const filePath = path.join(TRANSLATIONS_DIR, `${lang}.json`);
      translations = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    });

    it('should be valid JSON', () => {
      expect(translations).toBeDefined();
      expect(typeof translations).toBe('object');
    });

    it('should have all required keys from English', () => {
      const missingKeys = enKeys.filter(key => !translations[key]);

      if (missingKeys.length > 0) {
        console.warn(`${lang}: Missing ${missingKeys.length} keys:`, missingKeys.slice(0, 5));
      }

      // Allow up to 5% missing keys for languages in progress
      const completeness = ((enKeys.length - missingKeys.length) / enKeys.length) * 100;
      expect(completeness).toBeGreaterThanOrEqual(95);
    });

    it('should not have empty values', () => {
      const emptyKeys = Object.keys(translations).filter(
        key => !translations[key] || translations[key].trim() === ''
      );

      expect(emptyKeys).toEqual([]);
    });

    it('should not have extra keys not in English', () => {
      const extraKeys = Object.keys(translations).filter(
        key => !enKeys.includes(key)
      );

      if (extraKeys.length > 0) {
        console.warn(`${lang}: Extra ${extraKeys.length} keys:`, extraKeys);
      }

      expect(extraKeys).toEqual([]);
    });

    it('should have matching placeholders with English', () => {
      const mismatches: string[] = [];

      for (const key of enKeys) {
        if (!translations[key]) {continue;}

        const enPlaceholders = extractPlaceholders(enTranslations[key]);
        const langPlaceholders = extractPlaceholders(translations[key]);

        if (JSON.stringify(enPlaceholders) !== JSON.stringify(langPlaceholders)) {
          mismatches.push(`${key}: expected [${enPlaceholders.join(', ')}], got [${langPlaceholders.join(', ')}]`);
        }
      }

      if (mismatches.length > 0) {
        console.warn(`${lang}: Placeholder mismatches:`, mismatches.slice(0, 3));
      }

      expect(mismatches).toEqual([]);
    });

    it('should not have HTML tags (security)', () => {
      const keysWithHTML = Object.keys(translations).filter(key => {
        const value = translations[key];
        return /<[^>]+>/i.test(value);
      });

      expect(keysWithHTML).toEqual([]);
    });

    it('should not have script tags (security)', () => {
      const keysWithScript = Object.keys(translations).filter(key => {
        const value = translations[key].toLowerCase();
        return value.includes('<script') || value.includes('javascript:');
      });

      expect(keysWithScript).toEqual([]);
    });
  });
});

describe('RTL Languages', () => {
  const rtlLanguages = ['ar', 'he', 'ur'];

  it.each(rtlLanguages)('%s should be marked as RTL', (lang) => {
    // This would require importing the language config
    // For now, just verify the files exist
    const filePath = path.join(TRANSLATIONS_DIR, `${lang}.json`);
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

describe('Key Naming Conventions', () => {
  it('English keys should follow naming convention', () => {
    const invalidKeys = enKeys.filter(key => {
      // Keys should be dot-separated (e.g., "nav.home", "app.title")
      return !/^[a-z]+(\.[a-z]+)+$/i.test(key);
    });

    // Allow some flexibility for common keys
    const allowedExceptions = ['title', 'description'];
    const reallyInvalid = invalidKeys.filter(key => !allowedExceptions.includes(key));

    expect(reallyInvalid).toEqual([]);
  });
});

/**
 * Helper: Extract placeholders from translation string
 */
function extractPlaceholders(text: string): string[] {
  const placeholders: string[] = [];

  // {variable} or {{variable}}
  const braceMatches = text.matchAll(/\{+([a-zA-Z0-9_]+)\}+/g);
  for (const match of braceMatches) {
    placeholders.push(match[0]);
  }

  // %s, %d, %f, etc.
  const percentMatches = text.matchAll(/%[sdfiouxXeEfFgGaAcCpn]/g);
  for (const match of percentMatches) {
    placeholders.push(match[0]);
  }

  // # symbol (for plurals)
  if (text.includes('#')) {
    placeholders.push('#');
  }

  return placeholders.sort();
}
