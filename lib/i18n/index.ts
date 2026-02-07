/**
 * Internationalization (i18n) System
 * Barrel export for all i18n modules
 */

// Core
export { I18nProvider } from './i18n-provider';
export { useTranslation, useT, useLocale } from './use-translation';

// Types
export type {
  Locale,
  LocaleInfo,
  TranslationKeys,
  TranslationData,
  InterpolationParams,
  PluralRules,
  TranslationFile,
} from './types';
export { SUPPORTED_LOCALES } from './types';

// RTL Support
export {
  isRTL,
  getTextDirection,
  applyTextDirection,
  getLogicalValue,
  mirrorTransform,
  getAlignment,
  getOppositeAlignment,
} from './rtl-support';

// Formatting
export {
  formatNumber,
  formatDate,
  formatDateTime,
  formatFileSize,
  formatRelativeTime,
  formatPercent,
  formatCurrency,
  formatList,
  formatDuration,
  formatOrdinal,
} from './locale-formatting';

// Missing Detection (Development)
export {
  detectMissingTranslations,
  detectExtraTranslations,
  getMissingKeysReport,
  logMissingTranslations,
  logExtraTranslations,
  logTranslationCoverage,
  validateTranslationStructure,
  generateTranslationReport,
  findUntranslatedKeys,
} from './missing-detection';
