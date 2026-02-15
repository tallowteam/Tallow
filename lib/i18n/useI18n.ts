/**
 * useI18n Hook for React Components
 *
 * Provides translation functionality with language switching,
 * dynamic message interpolation, and pluralization support.
 *
 * Usage:
 * ```tsx
 * const { t, language, setLanguage } = useI18n();
 * return <button>{t('common.ok')}</button>;
 * ```
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getTranslations,
  getEffectiveLanguage,
  setStoredLanguage,
  isValidLanguage,
  LanguageCode,
  LANGUAGES,
} from './i18n';

interface UseI18nReturn {
  /**
   * Get translated string for a key with optional interpolation
   * @param key - Translation key in dot notation (e.g., "common.ok")
   * @param params - Optional parameters for string interpolation
   * @returns Translated string
   */
  t: (key: string, params?: Record<string, string | number>) => string;

  /**
   * Current active language code
   */
  language: LanguageCode;

  /**
   * Change active language
   * @param language - New language code
   */
  setLanguage: (language: LanguageCode) => void;

  /**
   * Get translations object for current language
   */
  translations: typeof import('./locales/en').default;

  /**
   * Available languages
   */
  availableLanguages: typeof LANGUAGES;

  /**
   * Set HTML lang attribute and direction
   */
  setHtmlAttributes: () => void;
}

/**
 * Custom hook for internationalization
 * @returns i18n functions and state
 */
export function useI18n(): UseI18nReturn {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  // Initialize on client side only
  useEffect(() => {
    const effective = getEffectiveLanguage();
    setLanguageState(effective);
  }, []);

  // Get current translations
  const translations = getTranslations(language);

  /**
   * Get nested value from object using dot notation
   */
  const getNestedValue = (obj: any, path: string): string => {
    return path.split('.').reduce((current, key) => {
      return current?.[key] ?? `[${path}]`;
    }, obj);
  };

  /**
   * Interpolate parameters into string
   */
  const interpolate = (
    message: string,
    params?: Record<string, string | number>
  ): string => {
    if (!params || typeof message !== 'string') {return message;}

    return message.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return String(params[key] ?? `{{${key}}}`);
    });
  };

  /**
   * Translate and interpolate
   */
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const message = getNestedValue(translations, key);
      return interpolate(message, params);
    },
    [translations]
  );

  /**
   * Change language and update localStorage
   */
  const handleSetLanguage = useCallback((newLanguage: LanguageCode) => {
    if (isValidLanguage(newLanguage)) {
      setLanguageState(newLanguage);
      setStoredLanguage(newLanguage);
      setHtmlAttributes(newLanguage);
    }
  }, []);

  /**
   * Update HTML lang and dir attributes
   */
  const setHtmlAttributes = useCallback((lang?: LanguageCode) => {
    const langToUse = lang || language;
    if (typeof document !== 'undefined') {
      const langConfig = LANGUAGES[langToUse];
      document.documentElement.lang = langConfig.code;
      document.documentElement.dir = langConfig.direction;
    }
  }, [language]);

  // Set HTML attributes on language change
  useEffect(() => {
    setHtmlAttributes();
  }, [language, setHtmlAttributes]);

  return {
    t,
    language,
    setLanguage: handleSetLanguage,
    translations,
    availableLanguages: LANGUAGES,
    setHtmlAttributes,
  };
}

/**
 * SSR-safe translation function
 * Use this for server components or static generation
 */
export function getServerTranslation(language: LanguageCode | string) {
  return {
    translations: getTranslations(language),
    language: isValidLanguage(language) ? language : 'en',
  };
}

/**
 * Hook alias for i18n context providers.
 */
export const useI18nProvider = () => useI18n();
