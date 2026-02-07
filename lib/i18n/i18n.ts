/**
 * Internationalization (i18n) Configuration for Tallow
 *
 * Supports multiple languages with proper locale formatting and fallback mechanisms.
 * Each language file exports a default object with consistent key structure.
 */

import en from './locales/en';
import fr from './locales/fr';
import de from './locales/de';
import pt from './locales/pt';
import it from './locales/it';

/**
 * Supported language codes and their configuration
 */
export const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    direction: 'ltr',
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    direction: 'ltr',
  },
} as const;

/**
 * Default language for the application
 */
export const DEFAULT_LANGUAGE = 'en' as const;

/**
 * Language code type
 */
export type LanguageCode = keyof typeof LANGUAGES;

/**
 * Translation messages for each language
 */
export const messages = {
  en,
  fr,
  de,
  pt,
  it,
} as const;

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
 * Detect user's preferred language
 * @returns Language code based on browser settings
 */
export function detectLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const browserLanguage = navigator.language?.split('-')[0] || DEFAULT_LANGUAGE;
  return (browserLanguage as LanguageCode) in LANGUAGES
    ? (browserLanguage as LanguageCode)
    : DEFAULT_LANGUAGE;
}

/**
 * Get stored language from localStorage
 * @returns Stored language code or null
 */
export function getStoredLanguage(): LanguageCode | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('tallow-language');
  return (stored as LanguageCode) in LANGUAGES ? (stored as LanguageCode) : null;
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
  if (stored) return stored;

  const detected = detectLanguage();
  if (detected in LANGUAGES) return detected;

  return DEFAULT_LANGUAGE;
}

/**
 * Validate language code
 * @param language - Language code to validate
 * @returns true if valid, false otherwise
 */
export function isValidLanguage(language: string): language is LanguageCode {
  return language in LANGUAGES;
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
