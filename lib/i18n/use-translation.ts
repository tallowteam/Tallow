/**
 * useTranslation Hook
 * Provides translation functionality with interpolation and pluralization
 */

'use client';

import { useContext } from 'react';
import { I18nContext } from './i18n-provider';
import type { TranslationKeys, InterpolationParams } from './types';

/**
 * Translation hook with type-safe keys
 */
export function useTranslation() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }

  const { locale, setLocale, translations, isLoading } = context;

  /**
   * Translate a key with optional interpolation parameters
   */
  const t = (
    key: keyof TranslationKeys,
    params?: InterpolationParams
  ): string => {
    let translation = translations[key] || key;

    // Handle pluralization if count is provided
    if (params && 'count' in params) {
      const count = params.count as number;
      const pluralKey = `${key}_plural` as keyof TranslationKeys;

      // Use plural form if available and count !== 1
      if (count !== 1 && translations[pluralKey]) {
        translation = translations[pluralKey];
      }
    }

    // Handle interpolation
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        const placeholder = new RegExp(`\\{\\{\\s*${paramKey}\\s*\\}\\}`, 'g');
        translation = translation.replace(placeholder, String(paramValue));
      });
    }

    return translation;
  };

  /**
   * Check if a translation key exists
   */
  const hasTranslation = (key: keyof TranslationKeys): boolean => {
    return key in translations;
  };

  /**
   * Get raw translation without interpolation
   */
  const getRaw = (key: keyof TranslationKeys): string => {
    return translations[key] || key;
  };

  /**
   * Translate with React components support (for future implementation)
   */
  const tComponent = (
    key: keyof TranslationKeys,
    components?: Record<string, React.ReactNode>
  ): React.ReactNode => {
    const translation = translations[key] || key;

    if (!components) {
      return translation;
    }

    // Split by component placeholders like <bold>text</bold>
    // This is a simplified implementation
    return translation;
  };

  return {
    t,
    locale,
    setLocale,
    isLoading,
    hasTranslation,
    getRaw,
    tComponent,
  };
}

/**
 * Hook to get only the translate function
 * Useful when you don't need locale or setLocale
 */
export function useT() {
  const { t } = useTranslation();
  return t;
}

/**
 * Hook to get only the locale
 */
export function useLocale() {
  const { locale, setLocale } = useTranslation();
  return { locale, setLocale };
}
