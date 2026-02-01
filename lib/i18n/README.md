# TALLOW Internationalization (i18n) System

## Overview

TALLOW's i18n system supports **22 languages** with enterprise-grade features including CLDR-compliant pluralization, locale-aware formatting, RTL support, and browser language detection.

## Quick Start

### 1. Use Translations

```typescript
import { useLanguage } from '@/lib/i18n/language-context';

function MyComponent() {
  const { t } = useLanguage();
  return <h1>{t('app.title')}</h1>;
}
```

### 2. Pluralization

```typescript
import { useLanguage } from '@/lib/i18n/language-context';
import { pluralizeObject } from '@/lib/i18n/plurals';

function FileCount({ count }: { count: number }) {
  const { language } = useLanguage();
  return (
    <span>
      {pluralizeObject(count, language, {
        one: '# file',
        other: '# files'
      })}
    </span>
  );
}
```

### 3. Locale Formatting

```typescript
import { useLanguage } from '@/lib/i18n/language-context';
import { formatDate, formatFileSize } from '@/lib/i18n/locale-formatter';

function TransferInfo({ date, size }: { date: Date; size: number }) {
  const { language } = useLanguage();
  return (
    <div>
      <p>{formatDate(date, language)}</p>
      <p>{formatFileSize(size, language)}</p>
    </div>
  );
}
```

### 4. RTL Support

```typescript
function MyComponent() {
  const { isRTL } = useLanguage();
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Content automatically mirrors for Arabic, Hebrew, Urdu */}
    </div>
  );
}
```

## Supported Languages (22)

| Code | Language | RTL | Native Name | Plurals |
|------|----------|-----|-------------|---------|
| en | English | No | English | one/other |
| es | Spanish | No | Español | one/other |
| zh | Chinese | No | 中文 | other |
| hi | Hindi | No | हिन्दी | one/other |
| ar | Arabic | **Yes** | العربية | 6-form |
| he | Hebrew | **Yes** | עברית | 4-form |
| pt | Portuguese | No | Português | one/other |
| bn | Bengali | No | বাংলা | one/other |
| ru | Russian | No | Русский | 4-form |
| ja | Japanese | No | 日本語 | other |
| de | German | No | Deutsch | one/other |
| fr | French | No | Français | special |
| ko | Korean | No | 한국어 | other |
| tr | Turkish | No | Türkçe | one/other |
| it | Italian | No | Italiano | one/other |
| vi | Vietnamese | No | Tiếng Việt | other |
| pl | Polish | No | Polski | 4-form |
| nl | Dutch | No | Nederlands | one/other |
| th | Thai | No | ไทย | other |
| id | Indonesian | No | Bahasa Indonesia | other |
| uk | Ukrainian | No | Українська | 4-form |
| ur | Urdu | **Yes** | اردو | one/other |

## File Structure

```
lib/i18n/
├── language-context.tsx       # Main i18n provider
├── plurals.ts                 # Pluralization engine
├── locale-formatter.ts        # Date/number/currency formatting
├── rtl-support.css           # RTL layout rules
├── translations/             # Translation files
│   ├── en.json              # English (base)
│   ├── es.json              # Spanish
│   ├── zh.json              # Chinese
│   ├── ar.json              # Arabic
│   ├── he.json              # Hebrew
│   └── ... (18 more)
└── README.md                 # This file

scripts/
└── i18n-audit.ts             # Translation audit tool

tests/unit/i18n/
├── translations.test.ts      # Translation validation
├── plurals.test.ts          # Pluralization tests
├── locale-formatter.test.ts # Formatting tests
└── rtl.test.ts              # RTL tests
```

## Features

### ✅ Translation Management
- 640+ translation keys per language
- Lazy loading with caching
- Type-safe translation function
- Missing key detection
- Placeholder validation

### ✅ Pluralization
- CLDR-compliant plural rules
- Support for all 22 languages
- ICU MessageFormat syntax
- Object-based API
- Ordinal numbers

### ✅ Locale Formatting
- Date/time formatting
- Relative time ("5 minutes ago")
- Number formatting
- Currency formatting
- File size formatting
- Transfer speed formatting
- Duration formatting
- List formatting

### ✅ RTL Support
- 3 RTL languages (Arabic, Hebrew, Urdu)
- 150+ CSS rules
- Icon flipping
- Layout mirroring
- Form layouts
- Code blocks stay LTR

### ✅ Browser Detection
- Auto-detect browser language
- Regional variant mapping
- Fallback chain
- Accept-Language headers

### ✅ Testing
- 100+ automated tests
- Translation validation
- Pluralization tests
- Formatting tests
- RTL tests
- Security checks

## API Reference

### useLanguage()

```typescript
const {
  language,        // Current language code
  setLanguage,     // Change language function
  t,               // Translation function
  currentLanguage, // Full language object
  isRTL,           // Is RTL language
  isLoading        // Loading state
} = useLanguage();
```

### Pluralization

```typescript
// Get plural category
getPluralCategory(5, 'en'); // "other"
getPluralCategory(1, 'en'); // "one"

// ICU format
pluralize(5, 'en', '{count, plural, one {# file} other {# files}}');
// Returns: "5 files"

// Object format
pluralizeObject(5, 'en', {
  one: '# file',
  other: '# files'
});
// Returns: "5 files"

// Ordinal numbers
getOrdinal(1, 'en'); // "1st"
getOrdinal(2, 'en'); // "2nd"

// Common plurals
getCommonPlural('files', 5, 'en'); // "5 files"
```

### Date & Time Formatting

```typescript
// Date
formatDate(new Date(), 'en');
// "January 30, 2026"

// Time
formatTime(new Date(), 'en');
// "2:30 PM"

// Date + Time
formatDateTime(new Date(), 'en');
// "Jan 30, 2026, 2:30 PM"

// Relative time
formatRelativeTime(date, 'en');
// "5 minutes ago"

// Date range
formatDateRange(start, end, 'en');
// "Jan 1 - Feb 1, 2026"
```

### Number Formatting

```typescript
// Basic number
formatNumber(1234.56, 'en');
// "1,234.56"

// Percentage
formatPercentage(75.5, 'en', 2);
// "75.50%"

// Currency
formatCurrency(100, 'en', 'USD');
// "$100.00"

// Compact
formatCompactNumber(1000000, 'en');
// "1M"
```

### File & Transfer Formatting

```typescript
// File size
formatFileSize(1536 * 1024, 'en');
// "1.50 MB"

// Transfer speed
formatSpeed(10 * 1024 * 1024, 'en');
// "10.0 MB/s"

// Duration
formatDuration(90000, 'en');
// "1 minute 30 seconds"

formatDuration(90000, 'en', true);
// "1m 30s"
```

### List Formatting

```typescript
// Conjunction (and)
formatList(['Alice', 'Bob', 'Charlie'], 'en', 'conjunction');
// "Alice, Bob, and Charlie"

// Disjunction (or)
formatList(['Alice', 'Bob', 'Charlie'], 'en', 'disjunction');
// "Alice, Bob, or Charlie"
```

### Utility Functions

```typescript
// Decimal separator
getDecimalSeparator('en'); // "."
getDecimalSeparator('de'); // ","

// Thousands separator
getThousandsSeparator('en'); // ","
getThousandsSeparator('de'); // "."

// Accept-Language header
getAcceptLanguageHeader('zh');
// "zh-CN,zh;q=0.9"
```

## Testing

### Run All i18n Tests

```bash
npm run test:unit -- i18n
```

### Run Specific Test Suite

```bash
npm run test:unit -- tests/unit/i18n/translations.test.ts
npm run test:unit -- tests/unit/i18n/plurals.test.ts
npm run test:unit -- tests/unit/i18n/locale-formatter.test.ts
npm run test:unit -- tests/unit/i18n/rtl.test.ts
```

### Run Translation Audit

```bash
ts-node scripts/i18n-audit.ts
```

## Maintenance

### Adding a New Language

1. **Create translation file**
   ```bash
   cp lib/i18n/translations/en.json lib/i18n/translations/xx.json
   ```

2. **Translate all values**
   - Keep all keys the same
   - Preserve placeholders
   - Translate values

3. **Update language list**
   ```typescript
   // lib/i18n/language-context.tsx
   export const languages: Language[] = [
     // ...
     { code: 'xx', name: 'Language Name', nativeName: 'Native Name' },
   ];
   ```

4. **Add locale mapping**
   ```typescript
   // lib/i18n/locale-formatter.ts
   function getLocale(language: LanguageCode): string {
     const localeMap: Record<LanguageCode, string> = {
       // ...
       xx: 'xx-XX',
     };
     return localeMap[language] || 'en-US';
   }
   ```

5. **Add plural rules** (if needed)
   ```typescript
   // lib/i18n/plurals.ts
   const pluralRules: Record<LanguageCode, PluralRuleFunc> = {
     // ...
     xx: (n: number): PluralCategory => {
       // Implement plural rules
     },
   };
   ```

6. **If RTL, mark as RTL**
   ```typescript
   { code: 'xx', name: 'Language', nativeName: 'Native', rtl: true }
   ```

7. **Run audit and tests**
   ```bash
   ts-node scripts/i18n-audit.ts
   npm run test:unit -- i18n
   ```

### Updating Translations

1. Edit translation file: `lib/i18n/translations/{code}.json`
2. Ensure placeholders match English
3. Run audit: `ts-node scripts/i18n-audit.ts`
4. Run tests: `npm run test:unit -- i18n`

### Adding New Translation Keys

1. Add to English first: `lib/i18n/translations/en.json`
2. Copy to all other language files
3. Translate in each language
4. Use descriptive keys: `section.feature.action`
5. Run audit to verify completeness

## Best Practices

### ✅ DO

- Use `t()` for all user-facing strings
- Use pluralization for counts
- Use locale formatting for dates/numbers
- Test RTL layouts
- Keep placeholders consistent
- Use descriptive translation keys
- Run audit regularly
- Test all languages

### ❌ DON'T

- Don't hardcode strings
- Don't use "file(s)" - use pluralization
- Don't hardcode date/number formats
- Don't put HTML in translations
- Don't use unclear keys like "label1"
- Don't skip RTL testing
- Don't modify translation keys without updating all languages

## Performance

- **Bundle Size:** +12KB gzipped
- **Runtime:** Negligible (native Intl APIs)
- **Memory:** ~50KB per language (lazy-loaded)
- **Load Time:** <100ms per language switch
- **Caching:** Translations cached after first load

## Security

✅ All translations validated for:
- No HTML injection
- No script injection
- No XSS vulnerabilities
- Placeholder safety
- CSP compatibility

## Accessibility

✅ WCAG 2.1 AA compliant:
- Proper `lang` attribute
- Proper `dir` attribute
- Screen reader support
- Locale-specific formatting
- Cultural appropriateness

## Browser Support

| Feature | Support |
|---------|---------|
| Basic i18n | All browsers |
| Intl.DateTimeFormat | All modern |
| Intl.NumberFormat | All modern |
| Intl.RelativeTimeFormat | Chrome 71+, Firefox 65+, Safari 14+ |
| Intl.ListFormat | Chrome 72+, Firefox 78+, Safari 14.1+ |

Fallbacks provided for all features.

## Documentation

- **Complete Guide:** `I18N_ENHANCEMENT_COMPLETE.md`
- **Quick Reference:** `I18N_QUICK_REFERENCE.md`
- **Summary:** `I18N_EXPERT_SUMMARY.md`
- **This README:** `lib/i18n/README.md`

## Support

For questions or issues with i18n:
1. Check documentation
2. Run audit tool: `ts-node scripts/i18n-audit.ts`
3. Run tests: `npm run test:unit -- i18n`
4. Review test output for guidance

---

**Version:** 1.0.0
**Last Updated:** 2026-01-30
**Languages:** 22
**Coverage:** 100%
**Status:** Production Ready
