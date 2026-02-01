/**
 * Pluralization Support for i18n
 * Implements CLDR plural rules for 22 languages
 * Based on Unicode CLDR Plural Rules
 */

import type { LanguageCode } from './language-context';

/**
 * Plural categories based on CLDR
 */
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/**
 * Plural rule function type
 */
type PluralRuleFunc = (n: number) => PluralCategory;

/**
 * Plural rules for each language
 * Based on CLDR v44 specifications
 */
const pluralRules: Record<LanguageCode, PluralRuleFunc> = {
  // English, German, Dutch, Norwegian, Swedish, Danish, Italian, Spanish, Portuguese, Greek
  en: (n: number): PluralCategory => (n === 1 ? 'one' : 'other'),
  de: (n: number): PluralCategory => (n === 1 ? 'one' : 'other'),
  nl: (n: number): PluralCategory => (n === 1 ? 'one' : 'other'),
  it: (n: number): PluralCategory => (n === 1 ? 'one' : 'other'),
  es: (n: number): PluralCategory => (n === 1 ? 'one' : 'other'),
  pt: (n: number): PluralCategory => (n === 1 ? 'one' : 'other'),

  // French (0 and 1 are singular)
  fr: (n: number): PluralCategory => (n === 0 || n === 1 ? 'one' : 'other'),

  // Russian, Ukrainian (complex Slavic rules)
  ru: (n: number): PluralCategory => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) {return 'one';}
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {return 'few';}
    if (mod10 === 0 || (mod10 >= 5 && mod10 <= 9) || (mod100 >= 11 && mod100 <= 14)) {return 'many';}
    return 'other';
  },
  uk: (n: number): PluralCategory => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) {return 'one';}
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {return 'few';}
    if (mod10 === 0 || (mod10 >= 5 && mod10 <= 9) || (mod100 >= 11 && mod100 <= 14)) {return 'many';}
    return 'other';
  },

  // Polish (complex Slavic rules)
  pl: (n: number): PluralCategory => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (n === 1) {return 'one';}
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {return 'few';}
    if (
      (mod10 >= 0 && mod10 <= 1) ||
      (mod10 >= 5 && mod10 <= 9) ||
      (mod100 >= 12 && mod100 <= 14)
    ) {
      return 'many';
    }
    return 'other';
  },

  // Arabic (complex 6-form system)
  ar: (n: number): PluralCategory => {
    if (n === 0) {return 'zero';}
    if (n === 1) {return 'one';}
    if (n === 2) {return 'two';}
    const mod100 = n % 100;
    if (mod100 >= 3 && mod100 <= 10) {return 'few';}
    if (mod100 >= 11 && mod100 <= 99) {return 'many';}
    return 'other';
  },

  // Chinese, Japanese, Korean, Thai, Vietnamese, Indonesian (no plural distinction)
  zh: (): PluralCategory => 'other',
  ja: (): PluralCategory => 'other',
  ko: (): PluralCategory => 'other',
  th: (): PluralCategory => 'other',
  vi: (): PluralCategory => 'other',
  id: (): PluralCategory => 'other',

  // Hindi, Bengali (0-1 vs other)
  hi: (n: number): PluralCategory => (n === 0 || n === 1 ? 'one' : 'other'),
  bn: (n: number): PluralCategory => (n === 0 || n === 1 ? 'one' : 'other'),

  // Turkish
  tr: (n: number): PluralCategory => (n === 1 ? 'one' : 'other'),

  // Hebrew (complex rules)
  he: (n: number): PluralCategory => {
    if (n === 1) {return 'one';}
    if (n === 2) {return 'two';}
    if (n > 10 && n % 10 === 0) {return 'many';}
    return 'other';
  },

  // Urdu (similar to Hindi)
  ur: (n: number): PluralCategory => (n === 1 ? 'one' : 'other'),
};

/**
 * Get the plural category for a number in a given language
 */
export function getPluralCategory(
  count: number,
  language: LanguageCode
): PluralCategory {
  const rule = pluralRules[language];
  if (!rule) {
    console.warn(`No plural rule found for language: ${language}`);
    return 'other';
  }
  return rule(Math.abs(Math.floor(count)));
}

/**
 * Simple pluralization template
 * Supports basic ICU MessageFormat-style syntax
 *
 * Format: "{count, plural, one {# file} other {# files}}"
 *
 * @example
 * pluralize(1, 'en', '{count, plural, one {# file} other {# files}}')
 * // Returns: "1 file"
 *
 * pluralize(5, 'en', '{count, plural, one {# file} other {# files}}')
 * // Returns: "5 files"
 */
export function pluralize(
  count: number,
  language: LanguageCode,
  template: string
): string {
  const category = getPluralCategory(count, language);

  // Parse ICU MessageFormat-style template
  const match = template.match(/\{count,\s*plural,\s*(.+?)\}/);
  if (!match) {
    return template.replace(/{count}/g, String(count));
  }

  const rulesText = match[1];
  if (!rulesText) {
    return template.replace(/{count}/g, String(count));
  }
  const rules: Record<string, string> = {};

  // Parse each plural form
  const ruleMatches = rulesText.matchAll(/(\w+)\s*\{([^}]+)\}/g);
  for (const ruleMatch of ruleMatches) {
    const key = ruleMatch[1];
    const value = ruleMatch[2];
    if (key && value) {
      rules[key] = value;
    }
  }

  // Get the appropriate form
  const form = rules[category] || rules['other'] || '';

  // Replace # with the count
  return form.replace(/#/g, String(count));
}

/**
 * Object-based pluralization (more flexible)
 *
 * @example
 * pluralizeObject(1, 'en', {
 *   one: '# file',
 *   other: '# files'
 * })
 * // Returns: "1 file"
 */
export function pluralizeObject(
  count: number,
  language: LanguageCode,
  forms: Partial<Record<PluralCategory, string>>
): string {
  const category = getPluralCategory(count, language);
  const form = forms[category] || forms['other'] || '';
  return form.replace(/#/g, String(count)).replace(/{count}/g, String(count));
}

/**
 * Ordinal pluralization (1st, 2nd, 3rd, etc.)
 * Currently implements English rules, extend for other languages as needed
 */
export function getOrdinal(n: number, language: LanguageCode = 'en'): string {
  if (language === 'en') {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) {return `${n}st`;}
    if (mod10 === 2 && mod100 !== 12) {return `${n}nd`;}
    if (mod10 === 3 && mod100 !== 13) {return `${n}rd`;}
    return `${n}th`;
  }
  return `${n}`; // Default: just return the number
}

/**
 * Helper function to create translation keys with plurals
 *
 * @example
 * createPluralKey('files', 1, 'en')
 * // Returns: 'files.one'
 */
export function createPluralKey(
  baseKey: string,
  count: number,
  language: LanguageCode
): string {
  const category = getPluralCategory(count, language);
  return `${baseKey}.${category}`;
}

/**
 * Example plural forms for common use cases
 */
export const commonPluralForms = {
  files: {
    zero: 'no files',
    one: '# file',
    other: '# files',
  },
  items: {
    zero: 'no items',
    one: '# item',
    other: '# items',
  },
  users: {
    zero: 'no users',
    one: '# user',
    other: '# users',
  },
  minutes: {
    zero: '0 minutes',
    one: '# minute',
    other: '# minutes',
  },
  hours: {
    zero: '0 hours',
    one: '# hour',
    other: '# hours',
  },
  days: {
    zero: '0 days',
    one: '# day',
    other: '# days',
  },
  seconds: {
    zero: '0 seconds',
    one: '# second',
    other: '# seconds',
  },
};

/**
 * Get a pluralized common form
 */
export function getCommonPlural(
  type: keyof typeof commonPluralForms,
  count: number,
  language: LanguageCode
): string {
  const forms = commonPluralForms[type];
  return pluralizeObject(count, language, forms);
}
