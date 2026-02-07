/**
 * Locales Index
 * Central export point for all supported languages
 * Includes 22 languages: English, Spanish, French, German, Portuguese, Italian, Dutch, Russian,
 * Chinese (Simplified & Traditional), Japanese, Korean, Arabic, Hebrew, Hindi, Turkish, Polish,
 * Swedish, Norwegian, Danish, Finnish, and Thai
 */

import en from './en';
import es from './es';
import fr from './fr';
import de from './de';
import pt from './pt';
import it from './it';
import nl from './nl';
import ru from './ru';
import ar from './ar';
import he from './he';
import hi from './hi';
import zhCN from './zh-CN';
import zhTW from './zh-TW';
import ja from './ja';
import ko from './ko';
import tr from './tr';
import pl from './pl';
import sv from './sv';
import no from './no';
import da from './da';
import fi from './fi';
import th from './th';

export const locales = {
  en, // English - LTR
  es, // Spanish - LTR
  fr, // French - LTR
  de, // German - LTR
  pt, // Portuguese - LTR
  it, // Italian - LTR
  nl, // Dutch - LTR
  ru, // Russian - LTR
  ar, // Arabic - RTL
  he, // Hebrew - RTL
  hi, // Hindi - LTR
  'zh-CN': zhCN, // Simplified Chinese - LTR
  'zh-TW': zhTW, // Traditional Chinese - LTR
  ja, // Japanese - LTR
  ko, // Korean - LTR
  tr, // Turkish - LTR
  pl, // Polish - LTR
  sv, // Swedish - LTR
  no, // Norwegian - LTR
  da, // Danish - LTR
  fi, // Finnish - LTR
  th, // Thai - LTR
} as const;

export type LocaleCode = keyof typeof locales;

export const LOCALE_CODES = Object.keys(locales) as LocaleCode[];

export const LOCALE_METADATA: Record<LocaleCode, {
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  script: string;
  region: string;
}> = {
  en: {
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    script: 'Latin',
    region: 'United States / Global',
  },
  es: {
    name: 'Spanish',
    nativeName: 'Español',
    dir: 'ltr',
    script: 'Latin',
    region: 'Spain / Latin America',
  },
  fr: {
    name: 'French',
    nativeName: 'Français',
    dir: 'ltr',
    script: 'Latin',
    region: 'France / Canada',
  },
  de: {
    name: 'German',
    nativeName: 'Deutsch',
    dir: 'ltr',
    script: 'Latin',
    region: 'Germany / Austria / Switzerland',
  },
  pt: {
    name: 'Portuguese',
    nativeName: 'Português',
    dir: 'ltr',
    script: 'Latin',
    region: 'Portugal / Brazil',
  },
  it: {
    name: 'Italian',
    nativeName: 'Italiano',
    dir: 'ltr',
    script: 'Latin',
    region: 'Italy',
  },
  nl: {
    name: 'Dutch',
    nativeName: 'Nederlands',
    dir: 'ltr',
    script: 'Latin',
    region: 'Netherlands / Belgium',
  },
  ru: {
    name: 'Russian',
    nativeName: 'Русский',
    dir: 'ltr',
    script: 'Cyrillic',
    region: 'Russia / Eastern Europe',
  },
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl',
    script: 'Arabic',
    region: 'Middle East & North Africa',
  },
  he: {
    name: 'Hebrew',
    nativeName: 'עברית',
    dir: 'rtl',
    script: 'Hebrew',
    region: 'Israel',
  },
  hi: {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    dir: 'ltr',
    script: 'Devanagari',
    region: 'India',
  },
  'zh-CN': {
    name: 'Simplified Chinese',
    nativeName: '简体中文',
    dir: 'ltr',
    script: 'Han (Simplified)',
    region: 'Mainland China',
  },
  'zh-TW': {
    name: 'Traditional Chinese',
    nativeName: '繁體中文',
    dir: 'ltr',
    script: 'Han (Traditional)',
    region: 'Taiwan',
  },
  ja: {
    name: 'Japanese',
    nativeName: '日本語',
    dir: 'ltr',
    script: 'Japanese (Hiragana, Katakana, Kanji)',
    region: 'Japan',
  },
  ko: {
    name: 'Korean',
    nativeName: '한국어',
    dir: 'ltr',
    script: 'Hangul',
    region: 'South Korea',
  },
  tr: {
    name: 'Turkish',
    nativeName: 'Türkçe',
    dir: 'ltr',
    script: 'Latin',
    region: 'Turkey',
  },
  pl: {
    name: 'Polish',
    nativeName: 'Polski',
    dir: 'ltr',
    script: 'Latin',
    region: 'Poland',
  },
  sv: {
    name: 'Swedish',
    nativeName: 'Svenska',
    dir: 'ltr',
    script: 'Latin',
    region: 'Sweden',
  },
  no: {
    name: 'Norwegian',
    nativeName: 'Norsk',
    dir: 'ltr',
    script: 'Latin',
    region: 'Norway',
  },
  da: {
    name: 'Danish',
    nativeName: 'Dansk',
    dir: 'ltr',
    script: 'Latin',
    region: 'Denmark',
  },
  fi: {
    name: 'Finnish',
    nativeName: 'Suomi',
    dir: 'ltr',
    script: 'Latin',
    region: 'Finland',
  },
  th: {
    name: 'Thai',
    nativeName: 'ไทย',
    dir: 'ltr',
    script: 'Thai',
    region: 'Thailand',
  },
};

export default locales;
