/**
 * Pluralization Tests
 * Tests plural rules for all 22 languages
 */

import { describe, it, expect } from 'vitest';
import {
  getPluralCategory,
  pluralize,
  pluralizeObject,
  getOrdinal,
  getCommonPlural,
} from '@/lib/i18n/plurals';
import type { LanguageCode } from '@/lib/i18n/language-context';

describe('Plural Rules', () => {
  describe('English (en)', () => {
    it('should return "one" for 1', () => {
      expect(getPluralCategory(1, 'en')).toBe('one');
    });

    it('should return "other" for 0, 2+', () => {
      expect(getPluralCategory(0, 'en')).toBe('other');
      expect(getPluralCategory(2, 'en')).toBe('other');
      expect(getPluralCategory(100, 'en')).toBe('other');
    });
  });

  describe('French (fr)', () => {
    it('should return "one" for 0 and 1', () => {
      expect(getPluralCategory(0, 'fr')).toBe('one');
      expect(getPluralCategory(1, 'fr')).toBe('one');
    });

    it('should return "other" for 2+', () => {
      expect(getPluralCategory(2, 'fr')).toBe('other');
      expect(getPluralCategory(100, 'fr')).toBe('other');
    });
  });

  describe('Russian (ru)', () => {
    it('should return "one" for 1, 21, 31, etc.', () => {
      expect(getPluralCategory(1, 'ru')).toBe('one');
      expect(getPluralCategory(21, 'ru')).toBe('one');
      expect(getPluralCategory(101, 'ru')).toBe('one');
    });

    it('should return "few" for 2-4, 22-24, etc.', () => {
      expect(getPluralCategory(2, 'ru')).toBe('few');
      expect(getPluralCategory(3, 'ru')).toBe('few');
      expect(getPluralCategory(4, 'ru')).toBe('few');
      expect(getPluralCategory(22, 'ru')).toBe('few');
    });

    it('should return "many" for 0, 5-20, 25-30, etc.', () => {
      expect(getPluralCategory(0, 'ru')).toBe('many');
      expect(getPluralCategory(5, 'ru')).toBe('many');
      expect(getPluralCategory(11, 'ru')).toBe('many');
      expect(getPluralCategory(20, 'ru')).toBe('many');
    });
  });

  describe('Arabic (ar)', () => {
    it('should return "zero" for 0', () => {
      expect(getPluralCategory(0, 'ar')).toBe('zero');
    });

    it('should return "one" for 1', () => {
      expect(getPluralCategory(1, 'ar')).toBe('one');
    });

    it('should return "two" for 2', () => {
      expect(getPluralCategory(2, 'ar')).toBe('two');
    });

    it('should return "few" for 3-10', () => {
      expect(getPluralCategory(3, 'ar')).toBe('few');
      expect(getPluralCategory(10, 'ar')).toBe('few');
    });

    it('should return "many" for 11-99', () => {
      expect(getPluralCategory(11, 'ar')).toBe('many');
      expect(getPluralCategory(99, 'ar')).toBe('many');
    });

    it('should return "other" for 100+', () => {
      expect(getPluralCategory(100, 'ar')).toBe('other');
      expect(getPluralCategory(101, 'ar')).toBe('other');
    });
  });

  describe('Polish (pl)', () => {
    it('should return "one" for 1', () => {
      expect(getPluralCategory(1, 'pl')).toBe('one');
    });

    it('should return "few" for 2-4, 22-24, etc.', () => {
      expect(getPluralCategory(2, 'pl')).toBe('few');
      expect(getPluralCategory(3, 'pl')).toBe('few');
      expect(getPluralCategory(4, 'pl')).toBe('few');
      expect(getPluralCategory(22, 'pl')).toBe('few');
    });

    it('should return "many" for 0, 5-21, 25+, etc.', () => {
      expect(getPluralCategory(0, 'pl')).toBe('many');
      expect(getPluralCategory(5, 'pl')).toBe('many');
      expect(getPluralCategory(11, 'pl')).toBe('many');
      expect(getPluralCategory(25, 'pl')).toBe('many');
    });
  });

  describe('Chinese/Japanese/Korean (no plurals)', () => {
    const languages: LanguageCode[] = ['zh', 'ja', 'ko', 'th', 'vi', 'id'];

    it.each(languages)('%s should always return "other"', (lang) => {
      expect(getPluralCategory(0, lang)).toBe('other');
      expect(getPluralCategory(1, lang)).toBe('other');
      expect(getPluralCategory(2, lang)).toBe('other');
      expect(getPluralCategory(100, lang)).toBe('other');
    });
  });

  describe('Hebrew (he)', () => {
    it('should return "one" for 1', () => {
      expect(getPluralCategory(1, 'he')).toBe('one');
    });

    it('should return "two" for 2', () => {
      expect(getPluralCategory(2, 'he')).toBe('two');
    });

    it('should return "many" for 20, 30, 40, etc.', () => {
      expect(getPluralCategory(20, 'he')).toBe('many');
      expect(getPluralCategory(30, 'he')).toBe('many');
    });

    it('should return "other" for most numbers', () => {
      expect(getPluralCategory(3, 'he')).toBe('other');
      expect(getPluralCategory(15, 'he')).toBe('other');
    });
  });
});

describe('pluralize()', () => {
  it('should format English plurals', () => {
    const template = '{count, plural, one {# file} other {# files}}';

    expect(pluralize(0, 'en', template)).toBe('0 files');
    expect(pluralize(1, 'en', template)).toBe('1 file');
    expect(pluralize(2, 'en', template)).toBe('2 files');
    expect(pluralize(100, 'en', template)).toBe('100 files');
  });

  it('should format French plurals', () => {
    const template = '{count, plural, one {# fichier} other {# fichiers}}';

    expect(pluralize(0, 'fr', template)).toBe('0 fichier');
    expect(pluralize(1, 'fr', template)).toBe('1 fichier');
    expect(pluralize(2, 'fr', template)).toBe('2 fichiers');
  });

  it('should format Russian plurals', () => {
    const template = '{count, plural, one {# файл} few {# файла} many {# файлов} other {# файлов}}';

    expect(pluralize(1, 'ru', template)).toBe('1 файл');
    expect(pluralize(2, 'ru', template)).toBe('2 файла');
    expect(pluralize(5, 'ru', template)).toBe('5 файлов');
    expect(pluralize(21, 'ru', template)).toBe('21 файл');
  });

  it('should format Arabic plurals', () => {
    const template = '{count, plural, zero {لا ملفات} one {# ملف} two {# ملفان} few {# ملفات} many {# ملفاً} other {# ملف}}';

    expect(pluralize(0, 'ar', template)).toBe('لا ملفات');
    expect(pluralize(1, 'ar', template)).toBe('1 ملف');
    expect(pluralize(2, 'ar', template)).toBe('2 ملفان');
    expect(pluralize(5, 'ar', template)).toBe('5 ملفات');
    expect(pluralize(15, 'ar', template)).toBe('15 ملفاً');
  });
});

describe('pluralizeObject()', () => {
  it('should work with object-based forms', () => {
    const forms = {
      one: '# file',
      other: '# files',
    };

    expect(pluralizeObject(1, 'en', forms)).toBe('1 file');
    expect(pluralizeObject(5, 'en', forms)).toBe('5 files');
  });

  it('should handle {count} placeholders', () => {
    const forms = {
      one: 'You have {count} unread message',
      other: 'You have {count} unread messages',
    };

    expect(pluralizeObject(1, 'en', forms)).toBe('You have 1 unread message');
    expect(pluralizeObject(10, 'en', forms)).toBe('You have 10 unread messages');
  });
});

describe('getOrdinal()', () => {
  it('should format English ordinals', () => {
    expect(getOrdinal(1, 'en')).toBe('1st');
    expect(getOrdinal(2, 'en')).toBe('2nd');
    expect(getOrdinal(3, 'en')).toBe('3rd');
    expect(getOrdinal(4, 'en')).toBe('4th');
    expect(getOrdinal(11, 'en')).toBe('11th');
    expect(getOrdinal(21, 'en')).toBe('21st');
    expect(getOrdinal(22, 'en')).toBe('22nd');
    expect(getOrdinal(23, 'en')).toBe('23rd');
    expect(getOrdinal(100, 'en')).toBe('100th');
  });

  it('should return number for non-English languages', () => {
    expect(getOrdinal(1, 'es')).toBe('1');
    expect(getOrdinal(2, 'fr')).toBe('2');
  });
});

describe('getCommonPlural()', () => {
  it('should format common plurals', () => {
    expect(getCommonPlural('files', 0, 'en')).toBe('no files');
    expect(getCommonPlural('files', 1, 'en')).toBe('1 file');
    expect(getCommonPlural('files', 5, 'en')).toBe('5 files');

    expect(getCommonPlural('minutes', 1, 'en')).toBe('1 minute');
    expect(getCommonPlural('hours', 2, 'en')).toBe('2 hours');
    expect(getCommonPlural('days', 3, 'en')).toBe('3 days');
  });
});

describe('Edge Cases', () => {
  it('should handle negative numbers', () => {
    expect(getPluralCategory(-1, 'en')).toBe('one');
    expect(getPluralCategory(-5, 'en')).toBe('other');
  });

  it('should handle decimal numbers (use floor)', () => {
    expect(getPluralCategory(1.5, 'en')).toBe('one');
    expect(getPluralCategory(2.7, 'en')).toBe('other');
  });

  it('should handle very large numbers', () => {
    expect(getPluralCategory(1000000, 'en')).toBe('other');
    expect(getPluralCategory(1000001, 'ru')).toBe('one');
  });
});
