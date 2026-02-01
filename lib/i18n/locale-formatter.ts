/**
 * Locale-aware formatting utilities
 * Handles dates, times, numbers, file sizes, and currency for all supported languages
 */

import type { LanguageCode } from './language-context';

/**
 * Get browser's Intl locale for a language code
 */
function getLocale(language: LanguageCode): string {
  const localeMap: Record<LanguageCode, string> = {
    en: 'en-US',
    es: 'es-ES',
    zh: 'zh-CN',
    hi: 'hi-IN',
    ar: 'ar-SA',
    he: 'he-IL',
    pt: 'pt-BR',
    bn: 'bn-BD',
    ru: 'ru-RU',
    ja: 'ja-JP',
    de: 'de-DE',
    fr: 'fr-FR',
    ko: 'ko-KR',
    tr: 'tr-TR',
    it: 'it-IT',
    vi: 'vi-VN',
    pl: 'pl-PL',
    nl: 'nl-NL',
    th: 'th-TH',
    id: 'id-ID',
    uk: 'uk-UA',
    ur: 'ur-PK',
  };
  return localeMap[language] || 'en-US';
}

/**
 * Format a date according to locale
 */
export function formatDate(
  date: Date | number | string,
  language: LanguageCode,
  options?: Intl.DateTimeFormatOptions
): string {
  const locale = getLocale(language);
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateObj.toLocaleDateString();
  }
}

/**
 * Format a time according to locale
 */
export function formatTime(
  date: Date | number | string,
  language: LanguageCode,
  options?: Intl.DateTimeFormatOptions
): string {
  const locale = getLocale(language);
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Time formatting error:', error);
    return dateObj.toLocaleTimeString();
  }
}

/**
 * Format a date and time according to locale
 */
export function formatDateTime(
  date: Date | number | string,
  language: LanguageCode,
  options?: Intl.DateTimeFormatOptions
): string {
  const locale = getLocale(language);
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return dateObj.toLocaleString();
  }
}

/**
 * Format relative time (e.g., "5 minutes ago", "in 2 hours")
 */
export function formatRelativeTime(
  date: Date | number | string,
  language: LanguageCode
): string {
  const locale = getLocale(language);
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffSec) < 60) {
      return rtf.format(diffSec, 'second');
    } else if (Math.abs(diffMin) < 60) {
      return rtf.format(diffMin, 'minute');
    } else if (Math.abs(diffHour) < 24) {
      return rtf.format(diffHour, 'hour');
    } else if (Math.abs(diffDay) < 7) {
      return rtf.format(diffDay, 'day');
    } else if (Math.abs(diffWeek) < 4) {
      return rtf.format(diffWeek, 'week');
    } else if (Math.abs(diffMonth) < 12) {
      return rtf.format(diffMonth, 'month');
    } else {
      return rtf.format(diffYear, 'year');
    }
  } catch (error) {
    console.error('Relative time formatting error:', error);
    // Fallback
    if (Math.abs(diffMin) < 1) {return 'just now';}
    if (Math.abs(diffMin) < 60) {return `${Math.abs(diffMin)} minutes ago`;}
    if (Math.abs(diffHour) < 24) {return `${Math.abs(diffHour)} hours ago`;}
    return formatDate(dateObj, language);
  }
}

/**
 * Format a number according to locale
 */
export function formatNumber(
  num: number,
  language: LanguageCode,
  options?: Intl.NumberFormatOptions
): string {
  const locale = getLocale(language);

  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch (error) {
    console.error('Number formatting error:', error);
    return num.toString();
  }
}

/**
 * Format a percentage
 */
export function formatPercentage(
  num: number,
  language: LanguageCode,
  decimals: number = 0
): string {
  const locale = getLocale(language);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num / 100);
  } catch (error) {
    console.error('Percentage formatting error:', error);
    return `${num}%`;
  }
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  language: LanguageCode,
  currency: string = 'USD'
): string {
  const locale = getLocale(language);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format file size with locale-aware number formatting
 */
export function formatFileSize(
  bytes: number,
  language: LanguageCode,
  decimals: number = 2
): string {
  if (bytes === 0) {return '0 B';}

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  const formattedNumber = formatNumber(size, language, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${formattedNumber} ${sizes[i]}`;
}

/**
 * Format transfer speed (bytes per second)
 */
export function formatSpeed(
  bytesPerSecond: number,
  language: LanguageCode
): string {
  if (bytesPerSecond === 0) {return '0 B/s';}

  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  const speed = bytesPerSecond / Math.pow(k, i);

  const formattedNumber = formatNumber(speed, language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return `${formattedNumber} ${sizes[i]}`;
}

/**
 * Format duration (milliseconds to human-readable)
 */
export function formatDuration(
  ms: number,
  _language: LanguageCode,
  short: boolean = false
): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return short ? `${days}d ${hours % 24}h` : `${days} days ${hours % 24} hours`;
  }
  if (hours > 0) {
    return short ? `${hours}h ${minutes % 60}m` : `${hours} hours ${minutes % 60} minutes`;
  }
  if (minutes > 0) {
    return short ? `${minutes}m ${seconds % 60}s` : `${minutes} minutes ${seconds % 60} seconds`;
  }
  return short ? `${seconds}s` : `${seconds} seconds`;
}

/**
 * Format compact number (1K, 1M, 1B)
 */
export function formatCompactNumber(
  num: number,
  language: LanguageCode
): string {
  const locale = getLocale(language);

  try {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(num);
  } catch (error) {
    console.error('Compact number formatting error:', error);
    // Fallback
    if (num >= 1000000000) {return `${(num / 1000000000).toFixed(1)}B`;}
    if (num >= 1000000) {return `${(num / 1000000).toFixed(1)}M`;}
    if (num >= 1000) {return `${(num / 1000).toFixed(1)}K`;}
    return num.toString();
  }
}

/**
 * Get decimal separator for a locale
 */
export function getDecimalSeparator(language: LanguageCode): string {
  const locale = getLocale(language);
  const formatted = new Intl.NumberFormat(locale).format(1.1);
  return formatted.charAt(1);
}

/**
 * Get thousands separator for a locale
 */
export function getThousandsSeparator(language: LanguageCode): string {
  const locale = getLocale(language);
  const formatted = new Intl.NumberFormat(locale).format(1000);
  return formatted.charAt(1);
}

/**
 * Format list of items according to locale
 */
export function formatList(
  items: string[],
  language: LanguageCode,
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  const locale = getLocale(language);

  try {
    return new Intl.ListFormat(locale, { type }).format(items);
  } catch (error) {
    console.error('List formatting error:', error);
    // Fallback
    if (items.length === 0) {return '';}
    if (items.length === 1) {return items[0] ?? '';}
    if (items.length === 2) {
      const first = items[0] ?? '';
      const second = items[1] ?? '';
      return type === 'conjunction'
        ? `${first} and ${second}`
        : `${first} or ${second}`;
    }
    const last = items[items.length - 1] ?? '';
    const rest = items.slice(0, -1).join(', ');
    return type === 'conjunction'
      ? `${rest}, and ${last}`
      : `${rest}, or ${last}`;
  }
}

/**
 * Parse a localized date string
 * Note: This is a basic implementation and may need refinement
 */
export function parseLocalizedDate(
  dateString: string,
  _language: LanguageCode
): Date | null {
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    return null;
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
}

/**
 * Format range (e.g., "1-5", "Jan 1 - Feb 1")
 */
export function formatDateRange(
  start: Date | number | string,
  end: Date | number | string,
  language: LanguageCode,
  options?: Intl.DateTimeFormatOptions
): string {
  const locale = getLocale(language);
  const startDate = typeof start === 'string' || typeof start === 'number' ? new Date(start) : start;
  const endDate = typeof end === 'string' || typeof end === 'number' ? new Date(end) : end;

  try {
    const formatter = new Intl.DateTimeFormat(locale, options);
    return formatter.formatRange(startDate, endDate);
  } catch (error) {
    console.error('Date range formatting error:', error);
    return `${formatDate(startDate, language, options)} - ${formatDate(endDate, language, options)}`;
  }
}
