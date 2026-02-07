/**
 * RTL (Right-to-Left) Language Support
 * Handles Arabic, Hebrew, and other RTL languages
 */

import { Locale, SUPPORTED_LOCALES } from './types';

/**
 * RTL languages
 */
const RTL_LOCALES: Locale[] = ['ar', 'he'];

/**
 * Check if a locale uses right-to-left text direction
 */
export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Get text direction for a locale
 */
export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  const localeInfo = SUPPORTED_LOCALES.find(l => l.code === locale);
  return localeInfo?.dir || 'ltr';
}

/**
 * Apply text direction to document root
 * This should be called when the locale changes
 */
export function applyTextDirection(locale: Locale): void {
  if (typeof document === 'undefined') return;

  const direction = getTextDirection(locale);
  document.documentElement.setAttribute('dir', direction);
  document.documentElement.setAttribute('lang', locale);

  // Add/remove RTL class for CSS targeting
  if (direction === 'rtl') {
    document.documentElement.classList.add('rtl');
  } else {
    document.documentElement.classList.remove('rtl');
  }
}

/**
 * Get logical property value based on direction
 * Useful for margin/padding adjustments
 */
export function getLogicalValue(
  locale: Locale,
  ltrValue: string,
  rtlValue: string
): string {
  return isRTL(locale) ? rtlValue : ltrValue;
}

/**
 * Mirror CSS transform for RTL
 */
export function mirrorTransform(transform: string, locale: Locale): string {
  if (!isRTL(locale)) return transform;

  // Flip scaleX values
  return transform.replace(/scaleX\((-?\d+(?:\.\d+)?)\)/, (match, value) => {
    return `scaleX(${-parseFloat(value)})`;
  });
}

/**
 * Get appropriate alignment for locale
 */
export function getAlignment(locale: Locale): 'left' | 'right' {
  return isRTL(locale) ? 'right' : 'left';
}

/**
 * Get opposite alignment for locale
 */
export function getOppositeAlignment(locale: Locale): 'left' | 'right' {
  return isRTL(locale) ? 'left' : 'right';
}
