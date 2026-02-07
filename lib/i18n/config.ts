/**
 * i18n Configuration
 * Centralized settings for internationalization
 * Supports: Arabic (RTL), Hebrew (RTL), Hindi (LTR)
 */

import { locales, LOCALE_METADATA, type LocaleCode } from './locales';

export const I18N_CONFIG = {
  // Default locale
  defaultLocale: 'ar' as LocaleCode,

  // Supported locales
  supportedLocales: Object.keys(locales) as LocaleCode[],

  // Metadata for all locales
  localeMetadata: LOCALE_METADATA,

  // Storage key for locale preference
  storageKey: 'tallow_locale',

  // Cookie name for locale
  cookieName: 'NEXT_LOCALE',

  // Enable locale-specific features
  features: {
    detectBrowserLanguage: true,
    persistLocale: true,
    fallbackLocale: 'ar' as LocaleCode,
  },
} as const;

/**
 * Get all RTL locales
 */
export function getRTLLocales(): LocaleCode[] {
  return (Object.keys(I18N_CONFIG.localeMetadata) as LocaleCode[]).filter(
    (locale) => I18N_CONFIG.localeMetadata[locale].dir === 'rtl',
  );
}

/**
 * Get all LTR locales
 */
export function getLTRLocales(): LocaleCode[] {
  return (Object.keys(I18N_CONFIG.localeMetadata) as LocaleCode[]).filter(
    (locale) => I18N_CONFIG.localeMetadata[locale].dir === 'ltr',
  );
}

/**
 * Check if locale is RTL
 */
export function isRTLLocale(locale: LocaleCode): boolean {
  return I18N_CONFIG.localeMetadata[locale].dir === 'rtl';
}

/**
 * Get text direction for locale
 */
export function getTextDirection(locale: LocaleCode): 'ltr' | 'rtl' {
  return I18N_CONFIG.localeMetadata[locale].dir;
}

/**
 * Get native name for locale
 */
export function getLocaleName(locale: LocaleCode): string {
  return I18N_CONFIG.localeMetadata[locale].nativeName;
}

export default I18N_CONFIG;
