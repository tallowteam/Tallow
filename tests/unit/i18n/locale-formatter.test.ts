/**
 * Locale Formatter Tests
 * Tests date, time, number, and currency formatting for all locales
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
  formatCurrency,
  formatFileSize,
  formatSpeed,
  formatDuration,
  formatCompactNumber,
  formatList,
  getDecimalSeparator,
  getThousandsSeparator,
} from '@/lib/i18n/locale-formatter';
import type { LanguageCode } from '@/lib/i18n/language-context';

describe('Date Formatting', () => {
  const testDate = new Date('2024-01-15T14:30:00Z');

  it('should format dates for all languages', () => {
    const languages: LanguageCode[] = ['en', 'es', 'zh', 'ar', 'de', 'fr'];

    for (const lang of languages) {
      const formatted = formatDate(testDate, lang);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    }
  });

  it('should format English dates correctly', () => {
    const formatted = formatDate(testDate, 'en');
    expect(formatted).toContain('January');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });

  it('should format with custom options', () => {
    const formatted = formatDate(testDate, 'en', {
      year: '2-digit',
      month: 'short',
      day: 'numeric',
    });

    expect(formatted).toBeTruthy();
  });
});

describe('Time Formatting', () => {
  const testDate = new Date('2024-01-15T14:30:00Z');

  it('should format time for all languages', () => {
    const languages: LanguageCode[] = ['en', 'es', 'zh', 'ar', 'de', 'fr'];

    for (const lang of languages) {
      const formatted = formatTime(testDate, lang);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    }
  });
});

describe('Relative Time Formatting', () => {
  it('should format seconds ago', () => {
    const now = new Date();
    const fiveSecondsAgo = new Date(now.getTime() - 5000);

    const formatted = formatRelativeTime(fiveSecondsAgo, 'en');
    expect(formatted.toLowerCase()).toContain('second');
  });

  it('should format minutes ago', () => {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const formatted = formatRelativeTime(tenMinutesAgo, 'en');
    expect(formatted.toLowerCase()).toContain('minute');
  });

  it('should format hours ago', () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const formatted = formatRelativeTime(twoHoursAgo, 'en');
    expect(formatted.toLowerCase()).toContain('hour');
  });

  it('should format days ago', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const formatted = formatRelativeTime(threeDaysAgo, 'en');
    expect(formatted.toLowerCase()).toContain('day');
  });
});

describe('Number Formatting', () => {
  it('should format numbers with correct separators', () => {
    expect(formatNumber(1000, 'en')).toBe('1,000');
    expect(formatNumber(1000000, 'en')).toBe('1,000,000');
  });

  it('should format decimals correctly', () => {
    const formatted = formatNumber(1234.56, 'en', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    expect(formatted).toContain('1,234');
    expect(formatted).toContain('56');
  });

  it('should handle different locale separators', () => {
    // German uses . for thousands, , for decimals
    const formatted = formatNumber(1234.56, 'de');
    expect(formatted).toBeTruthy();
  });
});

describe('Percentage Formatting', () => {
  it('should format percentages', () => {
    expect(formatPercentage(50, 'en')).toContain('50');
    expect(formatPercentage(50, 'en')).toContain('%');
  });

  it('should format percentages with decimals', () => {
    const formatted = formatPercentage(33.33, 'en', 2);
    expect(formatted).toContain('33.33');
  });
});

describe('Currency Formatting', () => {
  it('should format USD currency', () => {
    const formatted = formatCurrency(1234.56, 'en', 'USD');
    expect(formatted).toContain('1,234.56');
    expect(formatted).toMatch(/\$|USD/);
  });

  it('should format EUR currency', () => {
    const formatted = formatCurrency(1234.56, 'de', 'EUR');
    expect(formatted).toBeTruthy();
  });

  it('should format different currencies', () => {
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'];

    for (const currency of currencies) {
      const formatted = formatCurrency(100, 'en', currency);
      expect(formatted).toBeTruthy();
    }
  });
});

describe('File Size Formatting', () => {
  it('should format bytes', () => {
    expect(formatFileSize(0, 'en')).toBe('0 B');
    expect(formatFileSize(100, 'en')).toContain('100');
    expect(formatFileSize(100, 'en')).toContain('B');
  });

  it('should format kilobytes', () => {
    const formatted = formatFileSize(1024, 'en');
    expect(formatted).toContain('1');
    expect(formatted).toContain('KB');
  });

  it('should format megabytes', () => {
    const formatted = formatFileSize(1024 * 1024, 'en');
    expect(formatted).toContain('1');
    expect(formatted).toContain('MB');
  });

  it('should format gigabytes', () => {
    const formatted = formatFileSize(1024 * 1024 * 1024, 'en');
    expect(formatted).toContain('1');
    expect(formatted).toContain('GB');
  });

  it('should format terabytes', () => {
    const formatted = formatFileSize(1024 * 1024 * 1024 * 1024, 'en');
    expect(formatted).toContain('1');
    expect(formatted).toContain('TB');
  });

  it('should use locale-specific number formatting', () => {
    const size = 1536 * 1024; // 1.5 MB

    const enFormatted = formatFileSize(size, 'en');
    const deFormatted = formatFileSize(size, 'de');

    expect(enFormatted).toBeTruthy();
    expect(deFormatted).toBeTruthy();
  });
});

describe('Speed Formatting', () => {
  it('should format bytes per second', () => {
    expect(formatSpeed(0, 'en')).toBe('0 B/s');
    expect(formatSpeed(100, 'en')).toContain('100');
    expect(formatSpeed(100, 'en')).toContain('B/s');
  });

  it('should format KB/s', () => {
    const formatted = formatSpeed(1024, 'en');
    expect(formatted).toContain('1.0');
    expect(formatted).toContain('KB/s');
  });

  it('should format MB/s', () => {
    const formatted = formatSpeed(1024 * 1024, 'en');
    expect(formatted).toContain('1.0');
    expect(formatted).toContain('MB/s');
  });

  it('should format GB/s', () => {
    const formatted = formatSpeed(1024 * 1024 * 1024, 'en');
    expect(formatted).toContain('1.0');
    expect(formatted).toContain('GB/s');
  });
});

describe('Duration Formatting', () => {
  it('should format seconds', () => {
    const formatted = formatDuration(5000, 'en');
    expect(formatted).toContain('5');
    expect(formatted.toLowerCase()).toContain('second');
  });

  it('should format minutes', () => {
    const formatted = formatDuration(90000, 'en'); // 1m 30s
    expect(formatted).toContain('1');
    expect(formatted.toLowerCase()).toContain('minute');
  });

  it('should format hours', () => {
    const formatted = formatDuration(3600000, 'en'); // 1h
    expect(formatted).toContain('1');
    expect(formatted.toLowerCase()).toContain('hour');
  });

  it('should format days', () => {
    const formatted = formatDuration(86400000, 'en'); // 1 day
    expect(formatted).toContain('1');
    expect(formatted.toLowerCase()).toContain('day');
  });

  it('should format short form', () => {
    const formatted = formatDuration(90000, 'en', true); // 1m 30s
    expect(formatted).toContain('m');
    expect(formatted).toContain('s');
  });
});

describe('Compact Number Formatting', () => {
  it('should format small numbers normally', () => {
    expect(formatCompactNumber(999, 'en')).toBe('999');
  });

  it('should format thousands with K', () => {
    const formatted = formatCompactNumber(1000, 'en');
    expect(formatted).toContain('1');
    expect(formatted.toUpperCase()).toContain('K');
  });

  it('should format millions with M', () => {
    const formatted = formatCompactNumber(1000000, 'en');
    expect(formatted).toContain('1');
    expect(formatted.toUpperCase()).toContain('M');
  });

  it('should format billions with B', () => {
    const formatted = formatCompactNumber(1000000000, 'en');
    expect(formatted).toContain('1');
    expect(formatted.toUpperCase()).toContain('B');
  });
});

describe('List Formatting', () => {
  it('should format conjunction lists', () => {
    const formatted = formatList(['Alice', 'Bob', 'Charlie'], 'en', 'conjunction');
    expect(formatted).toContain('Alice');
    expect(formatted).toContain('Bob');
    expect(formatted).toContain('Charlie');
    expect(formatted.toLowerCase()).toContain('and');
  });

  it('should format disjunction lists', () => {
    const formatted = formatList(['Alice', 'Bob', 'Charlie'], 'en', 'disjunction');
    expect(formatted).toContain('Alice');
    expect(formatted).toContain('Bob');
    expect(formatted).toContain('Charlie');
    expect(formatted.toLowerCase()).toContain('or');
  });

  it('should handle two items', () => {
    const formatted = formatList(['Alice', 'Bob'], 'en', 'conjunction');
    expect(formatted).toContain('Alice');
    expect(formatted).toContain('Bob');
  });

  it('should handle one item', () => {
    const formatted = formatList(['Alice'], 'en');
    expect(formatted).toBe('Alice');
  });

  it('should handle empty array', () => {
    const formatted = formatList([], 'en');
    expect(formatted).toBe('');
  });
});

describe('Separator Detection', () => {
  it('should detect English decimal separator', () => {
    expect(getDecimalSeparator('en')).toBe('.');
  });

  it('should detect German decimal separator', () => {
    expect(getDecimalSeparator('de')).toBe(',');
  });

  it('should detect English thousands separator', () => {
    expect(getThousandsSeparator('en')).toBe(',');
  });

  it('should detect German thousands separator', () => {
    expect(getThousandsSeparator('de')).toBe('.');
  });
});

describe('Edge Cases', () => {
  it('should handle invalid dates gracefully', () => {
    const invalidDate = new Date('invalid');
    const formatted = formatDate(invalidDate, 'en');
    expect(formatted).toBeTruthy();
  });

  it('should handle very large numbers', () => {
    const formatted = formatNumber(Number.MAX_SAFE_INTEGER, 'en');
    expect(formatted).toBeTruthy();
  });

  it('should handle negative numbers', () => {
    expect(formatNumber(-1234, 'en')).toContain('-');
    expect(formatCurrency(-50, 'en', 'USD')).toContain('-');
  });

  it('should handle zero', () => {
    expect(formatNumber(0, 'en')).toBe('0');
    expect(formatFileSize(0, 'en')).toBe('0 B');
    expect(formatSpeed(0, 'en')).toBe('0 B/s');
  });
});
