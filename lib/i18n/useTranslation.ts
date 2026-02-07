/**
 * useTranslation Hook
 * React hook for accessing translations in components
 * Supports: Arabic (RTL), Hebrew (RTL), Hindi (LTR)
 */

import { useMemo, useCallback } from 'react';
import { locales, LOCALE_METADATA, type LocaleCode } from './locales';
import type { Translations } from './locales/ar';

interface UseTranslationReturn {
  t: (key: keyof Translations | string) => string;
  locale: LocaleCode;
  localeMetadata: typeof LOCALE_METADATA[LocaleCode];
  textDirection: 'ltr' | 'rtl';
  isRTL: boolean;
}

/**
 * Get translation by dot notation path
 * Example: common.appName, nav.home, etc.
 */
function getTranslationByPath(obj: any, path: string): string {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    value = value?.[key];
    if (typeof value !== 'object' && value !== undefined) {
      return value;
    }
  }

  return path; // Fallback to key if not found
}

/**
 * useTranslation Hook
 * Usage: const { t, locale, isRTL } = useTranslation();
 */
export function useTranslation(locale: LocaleCode = 'ar'): UseTranslationReturn {
  const translations = useMemo(() => locales[locale], [locale]);
  const metadata = LOCALE_METADATA[locale];

  const t = useCallback(
    (key: string): string => {
      return getTranslationByPath(translations, key);
    },
    [translations],
  );

  return {
    t,
    locale,
    localeMetadata: metadata,
    textDirection: metadata.dir,
    isRTL: metadata.dir === 'rtl',
  };
}

/**
 * getStaticTranslation
 * For static usage outside of React components
 * Example: const appName = getStaticTranslation('ar', 'common.appName');
 */
export function getStaticTranslation(
  locale: LocaleCode,
  key: string,
): string {
  const translations = locales[locale];
  return getTranslationByPath(translations, key);
}

/**
 * getAllLocales
 * Get all available locales
 */
export function getAllLocales(): LocaleCode[] {
  return Object.keys(locales) as LocaleCode[];
}

/**
 * getLocaleMetadata
 * Get metadata for a specific locale
 */
export function getLocaleMetadata(locale: LocaleCode) {
  return LOCALE_METADATA[locale];
}

export default useTranslation;
