/**
 * Internationalization Type Definitions
 * Supports 22 languages with RTL support
 */

export type Locale =
  | 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'nl' | 'ru'
  | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'ar' | 'he' | 'hi'
  | 'tr' | 'pl' | 'sv' | 'no' | 'da' | 'fi' | 'th';

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr', flag: '🇵🇹' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr', flag: '🇮🇹' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', dir: 'ltr', flag: '🇳🇱' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr', flag: '🇷🇺' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', dir: 'ltr', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', dir: 'ltr', flag: '🇹🇼' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl', flag: '🇮🇱' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', dir: 'ltr', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', dir: 'ltr', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', dir: 'ltr', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', dir: 'ltr', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', dir: 'ltr', flag: '🇫🇮' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', dir: 'ltr', flag: '🇹🇭' },
];

/**
 * Translation keys interface - defines all translatable strings
 * This should be extended as new translations are added
 */
export interface TranslationKeys {
  // Common
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.cancel': string;
  'common.confirm': string;
  'common.close': string;
  'common.save': string;
  'common.delete': string;
  'common.edit': string;
  'common.search': string;
  'common.settings': string;
  'common.language': string;

  // Navigation
  'nav.home': string;
  'nav.features': string;
  'nav.security': string;
  'nav.pricing': string;
  'nav.docs': string;
  'nav.openApp': string;

  // Hero Section
  'hero.title': string;
  'hero.subtitle': string;
  'hero.cta.primary': string;
  'hero.cta.secondary': string;

  // Features
  'features.title': string;
  'features.subtitle': string;
  'features.p2p.title': string;
  'features.p2p.description': string;
  'features.encryption.title': string;
  'features.encryption.description': string;
  'features.speed.title': string;
  'features.speed.description': string;

  // Transfer
  'transfer.selectFiles': string;
  'transfer.dropFiles': string;
  'transfer.connecting': string;
  'transfer.connected': string;
  'transfer.transferring': string;
  'transfer.complete': string;
  'transfer.failed': string;

  // File Management
  'files.count': string;
  'files.count_plural': string;
  'files.size': string;
  'files.uploaded': string;
  'files.downloading': string;

  // Security
  'security.encrypted': string;
  'security.verified': string;
  'security.quantum': string;

  // Errors
  'error.network': string;
  'error.fileSize': string;
  'error.upload': string;
  'error.download': string;
  'error.connection': string;

  // Accessibility
  'a11y.skipToContent': string;
  'a11y.menu': string;
  'a11y.closeMenu': string;
  'a11y.darkMode': string;
  'a11y.lightMode': string;

  // Footer
  'footer.copyright': string;
  'footer.privacy': string;
  'footer.terms': string;
  'footer.contact': string;
}

/**
 * Translation data structure with nested keys
 */
export type TranslationData = {
  [K in keyof TranslationKeys]: string;
};

/**
 * Interpolation parameters for translations
 */
export type InterpolationParams = Record<string, string | number>;

/**
 * Pluralization rules
 */
export interface PluralRules {
  zero?: string;
  one?: string;
  few?: string;
  many?: string;
  other: string;
}

/**
 * Translation file format
 */
export interface TranslationFile {
  locale: Locale;
  translations: Partial<TranslationData>;
}
