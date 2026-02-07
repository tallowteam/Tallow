/**
 * I18nProvider Context & Component
 * Provides translations and locale context to React components
 * Supports: Arabic (RTL), Hebrew (RTL), Hindi (LTR)
 */

'use client';

import React, { createContext, useContext, useCallback, useMemo, useEffect, useState } from 'react';
import { locales, LOCALE_METADATA, type LocaleCode, LOCALE_CODES } from './locales';
import { I18N_CONFIG, getTextDirection, isRTLLocale } from './config';
import type { Translations } from './locales/ar';

interface I18nContextValue {
  // Current locale
  locale: LocaleCode;

  // Change locale
  setLocale: (locale: LocaleCode) => void;

  // Translation function
  t: (key: string, defaultValue?: string) => string;

  // Get full translations object
  getTranslations: () => Translations;

  // Locale metadata
  localeMetadata: typeof LOCALE_METADATA[LocaleCode];

  // Text direction
  textDirection: 'ltr' | 'rtl';

  // Convenience flag for RTL
  isRTL: boolean;

  // All available locales
  availableLocales: LocaleCode[];
}

/**
 * I18n Context
 */
const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/**
 * Get translation by dot notation path
 */
function getTranslationByPath(obj: any, path: string): string {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    value = value?.[key];
    if (typeof value !== 'object' && value !== undefined) {
      return String(value);
    }
  }

  return path; // Fallback to key if not found
}

interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: LocaleCode;
  onLocaleChange?: (locale: LocaleCode) => void;
}

/**
 * I18nProvider Component
 * Wraps your app to provide translation context
 *
 * Usage:
 * <I18nProvider defaultLocale="ar">
 *   <App />
 * </I18nProvider>
 */
export function I18nProvider({
  children,
  defaultLocale = I18N_CONFIG.defaultLocale,
  onLocaleChange,
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<LocaleCode>(defaultLocale);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize locale from storage on mount
  useEffect(() => {
    setIsMounted(true);

    if (I18N_CONFIG.features.persistLocale && typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem(I18N_CONFIG.storageKey) as LocaleCode | null;
      if (savedLocale && LOCALE_CODES.includes(savedLocale)) {
        setLocaleState(savedLocale);
      }
    }
  }, []);

  // Update document dir attribute when locale changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const dir = getTextDirection(locale);
      document.documentElement.dir = dir;
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((newLocale: LocaleCode) => {
    if (!LOCALE_CODES.includes(newLocale)) {
      console.warn(`Invalid locale: ${newLocale}`);
      return;
    }

    setLocaleState(newLocale);

    // Persist locale preference
    if (I18N_CONFIG.features.persistLocale && typeof window !== 'undefined') {
      localStorage.setItem(I18N_CONFIG.storageKey, newLocale);
    }

    // Notify parent component
    onLocaleChange?.(newLocale);
  }, [onLocaleChange]);

  const translations = useMemo(() => locales[locale], [locale]);
  const metadata = useMemo(() => LOCALE_METADATA[locale], [locale]);
  const textDirection = useMemo(() => getTextDirection(locale), [locale]);
  const isRTL = useMemo(() => isRTLLocale(locale), [locale]);

  const t = useCallback(
    (key: string, defaultValue?: string): string => {
      const result = getTranslationByPath(translations, key);
      return result === key && defaultValue ? defaultValue : result;
    },
    [translations],
  );

  const getTranslations = useCallback(() => translations, [translations]);

  const value: I18nContextValue = {
    locale,
    setLocale,
    t,
    getTranslations,
    localeMetadata: metadata,
    textDirection,
    isRTL,
    availableLocales: LOCALE_CODES,
  };

  // Don't render until client-side hydration is complete
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * useI18n Hook
 * Access translation context in components
 *
 * Usage:
 * const { t, locale, isRTL } = useI18n();
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}

export default I18nProvider;
