/**
 * Locale-Aware Formatting Utilities
 * Uses Intl API for proper localization
 */

import { Locale } from './types';

/**
 * Format a number according to locale conventions
 */
export function formatNumber(
  n: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(n);
  } catch (error) {
    console.warn(`Failed to format number for locale ${locale}:`, error);
    return n.toString();
  }
}

/**
 * Format a date according to locale conventions
 */
export function formatDate(
  date: Date,
  locale: Locale,
  style: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: style,
    }).format(date);
  } catch (error) {
    console.warn(`Failed to format date for locale ${locale}:`, error);
    return date.toLocaleDateString();
  }
}

/**
 * Format a date and time according to locale conventions
 */
export function formatDateTime(
  date: Date,
  locale: Locale,
  dateStyle: 'short' | 'medium' | 'long' | 'full' = 'medium',
  timeStyle: 'short' | 'medium' | 'long' | 'full' = 'short'
): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle,
      timeStyle,
    }).format(date);
  } catch (error) {
    console.warn(`Failed to format datetime for locale ${locale}:`, error);
    return date.toLocaleString();
  }
}

/**
 * Format file size with appropriate units
 */
export function formatFileSize(bytes: number, locale: Locale): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  if (bytes === 0) {return '0 B';}

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);

  const formattedValue = formatNumber(value, locale, {
    minimumFractionDigits: i === 0 ? 0 : 1,
    maximumFractionDigits: i === 0 ? 0 : 2,
  });

  return `${formattedValue} ${units[i]}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date, locale: Locale): string {
  try {
    const now = new Date();
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

    // Determine the appropriate unit
    const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
      { unit: 'year', seconds: 31536000 },
      { unit: 'month', seconds: 2592000 },
      { unit: 'week', seconds: 604800 },
      { unit: 'day', seconds: 86400 },
      { unit: 'hour', seconds: 3600 },
      { unit: 'minute', seconds: 60 },
      { unit: 'second', seconds: 1 },
    ];

    for (const { unit, seconds } of units) {
      const diff = Math.floor(diffInSeconds / seconds);
      if (Math.abs(diff) >= 1) {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
        return rtf.format(diff, unit);
      }
    }

    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'second');
  } catch (error) {
    console.warn(`Failed to format relative time for locale ${locale}:`, error);
    return date.toLocaleString();
  }
}

/**
 * Format a percentage
 */
export function formatPercent(
  value: number,
  locale: Locale,
  decimals: number = 0
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch (error) {
    console.warn(`Failed to format percentage for locale ${locale}:`, error);
    return `${(value * 100).toFixed(decimals)}%`;
  }
}

/**
 * Format a currency amount
 */
export function formatCurrency(
  amount: number,
  locale: Locale,
  currency: string = 'USD'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    console.warn(`Failed to format currency for locale ${locale}:`, error);
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format a list of items according to locale conventions
 */
export function formatList(
  items: string[],
  locale: Locale,
  type: 'conjunction' | 'disjunction' | 'unit' = 'conjunction'
): string {
  try {
    return new Intl.ListFormat(locale, { type }).format(items);
  } catch (error) {
    console.warn(`Failed to format list for locale ${locale}:`, error);
    return items.join(', ');
  }
}

/**
 * Format duration in a human-readable way
 */
export function formatDuration(
  milliseconds: number,
  locale: Locale,
  options?: {
    units?: ('hour' | 'minute' | 'second')[];
    short?: boolean;
  }
): string {
  const { units = ['hour', 'minute', 'second'], short = false } = options || {};

  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);

  const parts: string[] = [];

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always' });

    if (units.includes('hour') && hours > 0) {
      const formatted = rtf.format(hours, 'hour');
      parts.push(short ? `${hours}h` : formatted.replace(/^in /, ''));
    }
    if (units.includes('minute') && (minutes > 0 || hours > 0)) {
      const formatted = rtf.format(minutes, 'minute');
      parts.push(short ? `${minutes}m` : formatted.replace(/^in /, ''));
    }
    if (units.includes('second') && (seconds > 0 || parts.length === 0)) {
      const formatted = rtf.format(seconds, 'second');
      parts.push(short ? `${seconds}s` : formatted.replace(/^in /, ''));
    }

    return parts.join(' ');
  } catch (error) {
    console.warn(`Failed to format duration for locale ${locale}:`, error);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Get ordinal number (1st, 2nd, 3rd, etc.)
 */
export function formatOrdinal(n: number, locale: Locale): string {
  try {
    const pr = new Intl.PluralRules(locale, { type: 'ordinal' });
    const rule = pr.select(n);

    const suffixes: Record<string, Record<string, string>> = {
      en: { one: 'st', two: 'nd', few: 'rd', other: 'th' },
      es: { other: 'º' },
      fr: { one: 'er', other: 'e' },
      de: { other: '.' },
      pt: { other: 'º' },
      it: { other: 'º' },
      nl: { other: 'e' },
      ru: { other: '-й' },
      ja: { other: '番目' },
      ko: { other: '번째' },
      ar: { other: '' },
      he: { other: '' },
      hi: { other: 'वां' },
      tr: { other: '.' },
      pl: { other: '.' },
      sv: { other: ':e' },
      no: { other: '.' },
      da: { other: '.' },
      fi: { other: '.' },
      th: { other: '' },
      'zh-CN': { other: '第' },
      'zh-TW': { other: '第' },
    };

    const localeSuffixes = suffixes[locale] ?? suffixes['en'] ?? { other: '' };
    const suffix = localeSuffixes[rule] || localeSuffixes.other;

    return `${n}${suffix}`;
  } catch (error) {
    console.warn(`Failed to format ordinal for locale ${locale}:`, error);
    return n.toString();
  }
}
