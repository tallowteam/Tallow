/**
 * Internationalization (i18n) Configuration for Tallow
 *
 * Supports multiple languages with proper locale formatting and fallback mechanisms.
 * Each language file exports a default object with consistent key structure.
 */

import locales, { LOCALE_CODES, LOCALE_METADATA, type LocaleCode } from './locales';

/**
 * Supported language codes and their configuration
 */
type LanguageConfig = {
  code: LocaleCode;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
};

export const LANGUAGES: Record<LocaleCode, LanguageConfig> = LOCALE_CODES.reduce(
  (accumulator, code) => {
    const metadata = LOCALE_METADATA[code];
    accumulator[code] = {
      code,
      name: metadata.name,
      nativeName: metadata.nativeName,
      direction: metadata.dir,
    };
    return accumulator;
  },
  {} as Record<LocaleCode, LanguageConfig>
);

/**
 * Default language for the application
 */
export const DEFAULT_LANGUAGE = 'en' as const;

/**
 * Language code type
 */
export type LanguageCode = LocaleCode;

/**
 * Translation messages for each language
 */
export const messages = locales;

/**
 * Get translations for a specific language
 * @param language - Language code
 * @returns Translation object for the language, or English if not found
 */
export function getTranslations(language: LanguageCode | string) {
  const lang = language as LanguageCode;
  return messages[lang] || messages[DEFAULT_LANGUAGE];
}

/**
 * Validate language code
 * @param language - Language code to validate
 * @returns true if valid, false otherwise
 */
export function isValidLanguage(language: string): language is LanguageCode {
  return LOCALE_CODES.includes(language as LanguageCode);
}

/**
 * Detect user's preferred language
 * @returns Language code based on browser settings
 */
export function detectLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const browserLanguage = navigator.language || DEFAULT_LANGUAGE;

  if (isValidLanguage(browserLanguage)) {
    return browserLanguage;
  }

  const normalizedBrowserLanguage = browserLanguage.toLowerCase();
  const exactMatch = LOCALE_CODES.find(
    (code) => code.toLowerCase() === normalizedBrowserLanguage
  );
  if (exactMatch) {
    return exactMatch;
  }

  const baseLanguage = normalizedBrowserLanguage.split('-')[0];
  const baseMatch = LOCALE_CODES.find((code) =>
    code.toLowerCase().startsWith(baseLanguage)
  );

  return baseMatch || DEFAULT_LANGUAGE;
}

/**
 * Get stored language from localStorage
 * @returns Stored language code or null
 */
export function getStoredLanguage(): LanguageCode | null {
  if (typeof window === 'undefined') {return null;}

  const stored = localStorage.getItem('tallow-language');
  if (!stored) {
    return null;
  }

  return isValidLanguage(stored) ? stored : null;
}

/**
 * Save language preference to localStorage
 * @param language - Language code to store
 */
export function setStoredLanguage(language: LanguageCode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tallow-language', language);
  }
}

/**
 * Get the effective language to use
 * Priority: stored preference > browser detection > default
 * @returns Language code to use
 */
export function getEffectiveLanguage(): LanguageCode {
  const stored = getStoredLanguage();
  if (stored) {return stored;}

  const detected = detectLanguage();
  if (detected in LANGUAGES) {return detected;}

  return DEFAULT_LANGUAGE;
}

/**
 * Get all available languages
 * @returns Array of language configurations
 */
export function getAvailableLanguages() {
  return Object.entries(LANGUAGES).map(([code, config]) => ({
    ...config,
    code: code as LanguageCode,
  }));
}
