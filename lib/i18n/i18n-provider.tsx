/**
 * I18n Provider - Internationalization Context
 * Manages locale state, lazy loading translations, and localStorage persistence
 */

'use client';

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Locale, TranslationKeys } from './types';
import { SUPPORTED_LOCALES } from './types';
import { applyTextDirection } from './rtl-support';
import {
  getMissingKeysReport,
  logMissingTranslations,
  logTranslationCoverage,
} from './missing-detection';

const STORAGE_KEY = 'tallow-locale';
const DEFAULT_LOCALE: Locale = 'en';

/**
 * English translations (reference/fallback)
 */
const EN_TRANSLATIONS: TranslationKeys = {
  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.close': 'Close',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.search': 'Search',
  'common.settings': 'Settings',
  'common.language': 'Language',

  // Navigation
  'nav.home': 'Home',
  'nav.features': 'Features',
  'nav.security': 'Security',
  'nav.pricing': 'Pricing',
  'nav.docs': 'Docs',
  'nav.openApp': 'Open App',

  // Hero Section
  'hero.title': 'Secure File Transfer, Quantum-Safe',
  'hero.subtitle': 'Share files peer-to-peer with military-grade encryption. No servers, no tracking, just pure privacy.',
  'hero.cta.primary': 'Start Transferring',
  'hero.cta.secondary': 'Learn More',

  // Features
  'features.title': 'Why Choose Tallow?',
  'features.subtitle': 'Industry-leading security meets blazing-fast performance',
  'features.p2p.title': 'True Peer-to-Peer',
  'features.p2p.description': 'Direct connection between devices. Your files never touch our servers.',
  'features.encryption.title': 'Post-Quantum Encryption',
  'features.encryption.description': 'Future-proof security with Kyber-1024 and ChaCha20-Poly1305.',
  'features.speed.title': 'Lightning Fast',
  'features.speed.description': 'Transfer files at full network speed with parallel chunking.',

  // Transfer
  'transfer.selectFiles': 'Select Files',
  'transfer.dropFiles': 'Drop files here',
  'transfer.connecting': 'Connecting...',
  'transfer.connected': 'Connected',
  'transfer.transferring': 'Transferring',
  'transfer.complete': 'Transfer Complete',
  'transfer.failed': 'Transfer Failed',

  // File Management
  'files.count': '{{count}} file',
  'files.count_plural': '{{count}} files',
  'files.size': 'Size: {{size}}',
  'files.uploaded': 'Uploaded',
  'files.downloading': 'Downloading',

  // Security
  'security.encrypted': 'Encrypted',
  'security.verified': 'Verified',
  'security.quantum': 'Quantum-Safe',

  // Errors
  'error.network': 'Network error occurred',
  'error.fileSize': 'File size exceeds limit',
  'error.upload': 'Upload failed',
  'error.download': 'Download failed',
  'error.connection': 'Connection lost',

  // Accessibility
  'a11y.skipToContent': 'Skip to main content',
  'a11y.menu': 'Open navigation menu',
  'a11y.closeMenu': 'Close navigation menu',
  'a11y.darkMode': 'Switch to dark mode',
  'a11y.lightMode': 'Switch to light mode',

  // Footer
  'footer.copyright': '© {{year}} Tallow. All rights reserved.',
  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms of Service',
  'footer.contact': 'Contact',
};

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translations: TranslationKeys;
  isLoading: boolean;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: Locale;
}

/**
 * Detect browser language preference
 */
function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') {return DEFAULT_LOCALE;}

  const browserLang = navigator.language || (navigator as any).userLanguage;

  // Try exact match first
  const exactMatch = SUPPORTED_LOCALES.find(
    l => l.code === browserLang || l.code === browserLang.toLowerCase()
  );
  if (exactMatch) {return exactMatch.code;}

  // Try language code only (e.g., 'en' from 'en-US')
  const langCode = browserLang.split('-')[0];
  const langMatch = SUPPORTED_LOCALES.find(l => l.code.startsWith(langCode));
  if (langMatch) {return langMatch.code;}

  return DEFAULT_LOCALE;
}

/**
 * Lazy load translation file for a locale
 */
async function loadTranslations(locale: Locale): Promise<Partial<TranslationKeys>> {
  if (locale === 'en') {
    return EN_TRANSLATIONS;
  }

  try {
    // Dynamic import with proper error handling
    const module = await import(`./translations/${locale}.ts`);
    return module.default || module.translations || {};
  } catch (error) {
    console.warn(`Failed to load translations for ${locale}, falling back to English:`, error);
    return {};
  }
}

export function I18nProvider({ children, defaultLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale || DEFAULT_LOCALE);
  const [translations, setTranslations] = useState<TranslationKeys>(EN_TRANSLATIONS);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load translations for the current locale
   */
  const loadLocaleTranslations = useCallback(async (newLocale: Locale) => {
    setIsLoading(true);

    try {
      const localeTranslations = await loadTranslations(newLocale);

      // Merge with English fallback
      const mergedTranslations: TranslationKeys = {
        ...EN_TRANSLATIONS,
        ...localeTranslations,
      };

      setTranslations(mergedTranslations);

      // Log missing translations in development
      if (process.env.NODE_ENV === 'development' && newLocale !== 'en') {
        const report = getMissingKeysReport(
          newLocale,
          localeTranslations,
          EN_TRANSLATIONS
        );

        logMissingTranslations(newLocale, report.missing);
        logTranslationCoverage(
          newLocale,
          report.coverage,
          Object.keys(EN_TRANSLATIONS).length,
          report.missing.length
        );
      }
    } catch (error) {
      console.error(`Error loading translations for ${newLocale}:`, error);
      setTranslations(EN_TRANSLATIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Set locale with persistence and RTL support
   */
  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (newLocale === locale) {return;}

      setLocaleState(newLocale);

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, newLocale);
      } catch (error) {
        console.warn('Failed to save locale to localStorage:', error);
      }

      // Apply text direction
      applyTextDirection(newLocale);

      // Load translations
      loadLocaleTranslations(newLocale);
    },
    [locale, loadLocaleTranslations]
  );

  /**
   * Initialize locale on mount
   */
  useEffect(() => {
    let initialLocale = defaultLocale || DEFAULT_LOCALE;

    // Try to load from localStorage
    try {
      const storedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (storedLocale && SUPPORTED_LOCALES.some(l => l.code === storedLocale)) {
        initialLocale = storedLocale;
      }
    } catch (error) {
      console.warn('Failed to read locale from localStorage:', error);
    }

    // Detect browser locale if no stored preference
    if (!defaultLocale && !localStorage.getItem(STORAGE_KEY)) {
      initialLocale = detectBrowserLocale();
    }

    // Apply initial locale
    if (initialLocale !== locale) {
      setLocaleState(initialLocale);
      applyTextDirection(initialLocale);
    }

    // Load translations
    loadLocaleTranslations(initialLocale);
  }, [defaultLocale, locale, loadLocaleTranslations]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      translations,
      isLoading,
    }),
    [locale, setLocale, translations, isLoading]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
