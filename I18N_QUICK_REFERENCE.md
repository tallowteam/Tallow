# TALLOW I18N Quick Reference

## 1. Basic Translation

```typescript
import { useLanguage } from '@/lib/i18n/language-context';

function MyComponent() {
  const { t, language, isRTL } = useLanguage();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t('app.title')}</h1>
      <p>{t('app.subtitle')}</p>
    </div>
  );
}
```

## 2. Pluralization

```typescript
import { pluralizeObject } from '@/lib/i18n/plurals';
import { useLanguage } from '@/lib/i18n/language-context';

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

## 3. Date & Time Formatting

```typescript
import { formatDate, formatRelativeTime } from '@/lib/i18n/locale-formatter';
import { useLanguage } from '@/lib/i18n/language-context';

function TransferDate({ date }: { date: Date }) {
  const { language } = useLanguage();

  return (
    <div>
      <p>Date: {formatDate(date, language)}</p>
      <p>Relative: {formatRelativeTime(date, language)}</p>
    </div>
  );
}
```

## 4. File Size & Speed

```typescript
import { formatFileSize, formatSpeed } from '@/lib/i18n/locale-formatter';
import { useLanguage } from '@/lib/i18n/language-context';

function TransferStats({ size, speed }: { size: number; speed: number }) {
  const { language } = useLanguage();

  return (
    <div>
      <p>Size: {formatFileSize(size, language)}</p>
      <p>Speed: {formatSpeed(speed, language)}</p>
    </div>
  );
}
```

## 5. Number & Currency

```typescript
import { formatNumber, formatCurrency } from '@/lib/i18n/locale-formatter';
import { useLanguage } from '@/lib/i18n/language-context';

function DonationAmount({ amount }: { amount: number }) {
  const { language } = useLanguage();

  return (
    <div>
      <p>{formatCurrency(amount, language, 'USD')}</p>
      <p>{formatNumber(amount, language)} users</p>
    </div>
  );
}
```

## 6. RTL-Aware Styling

```tsx
function MyComponent() {
  const { isRTL } = useLanguage();

  return (
    <div className={isRTL ? 'rtl' : ''}>
      {/* Directional icon - will flip in RTL */}
      <ChevronRightIcon className="icon-directional" />

      {/* Non-directional icon - never flips */}
      <SearchIcon className="icon-no-flip" />

      {/* Code stays LTR even in RTL */}
      <code className="ltr">const x = 5;</code>
    </div>
  );
}
```

## 7. Language Switcher

```typescript
import { useLanguage, languages } from '@/lib/i18n/language-context';

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
```

## 8. Testing Translations

```bash
# Run translation audit
ts-node scripts/i18n-audit.ts

# Run i18n tests
npm run test:unit -- i18n

# Run specific test file
npm run test:unit -- tests/unit/i18n/plurals.test.ts
```

## 9. Common Plural Forms

```typescript
import { getCommonPlural } from '@/lib/i18n/plurals';
import { useLanguage } from '@/lib/i18n/language-context';

function TimeRemaining({ minutes }: { minutes: number }) {
  const { language } = useLanguage();

  return (
    <p>{getCommonPlural('minutes', minutes, language)} remaining</p>
  );
}

// Available: files, items, users, minutes, hours, days, seconds
```

## 10. Adding New Translation Keys

```json
// 1. Add to lib/i18n/translations/en.json
{
  "myFeature.title": "My Feature",
  "myFeature.description": "Description with {count} items"
}

// 2. Copy to all other language files and translate
// 3. Run audit
ts-node scripts/i18n-audit.ts

// 4. Use in code
const { t } = useLanguage();
<h1>{t('myFeature.title')}</h1>
```

## Supported Languages (22)

| Code | Language | RTL | Plurals |
|------|----------|-----|---------|
| en | English | No | one/other |
| es | Spanish | No | one/other |
| zh | Chinese | No | other |
| hi | Hindi | No | one/other |
| ar | Arabic | Yes | 6-form |
| he | Hebrew | Yes | one/two/many/other |
| pt | Portuguese | No | one/other |
| bn | Bengali | No | one/other |
| ru | Russian | No | one/few/many/other |
| ja | Japanese | No | other |
| de | German | No | one/other |
| fr | French | No | one/other |
| ko | Korean | No | other |
| tr | Turkish | No | one/other |
| it | Italian | No | one/other |
| vi | Vietnamese | No | other |
| pl | Polish | No | one/few/many/other |
| nl | Dutch | No | one/other |
| th | Thai | No | other |
| id | Indonesian | No | other |
| uk | Ukrainian | No | one/few/many/other |
| ur | Urdu | Yes | one/other |

## RTL Languages (3)

- Arabic (ar)
- Hebrew (he)
- Urdu (ur)

## API Reference

### useLanguage()
```typescript
const {
  language,      // Current language code
  setLanguage,   // Change language
  t,             // Translate function
  currentLanguage, // Full language object
  isRTL,         // Is RTL language
  isLoading      // Loading state
} = useLanguage();
```

### Pluralization Functions
- `getPluralCategory(count, lang)` - Get plural category
- `pluralize(count, lang, template)` - ICU format
- `pluralizeObject(count, lang, forms)` - Object format
- `getOrdinal(n, lang)` - Ordinal numbers
- `getCommonPlural(type, count, lang)` - Common forms

### Formatting Functions
- `formatDate(date, lang, options?)` - Date formatting
- `formatTime(date, lang, options?)` - Time formatting
- `formatDateTime(date, lang, options?)` - Date + Time
- `formatRelativeTime(date, lang)` - "5 minutes ago"
- `formatNumber(num, lang, options?)` - Number formatting
- `formatPercentage(num, lang, decimals?)` - Percentage
- `formatCurrency(amount, lang, currency)` - Currency
- `formatFileSize(bytes, lang, decimals?)` - File size
- `formatSpeed(bps, lang)` - Transfer speed
- `formatDuration(ms, lang, short?)` - Duration
- `formatCompactNumber(num, lang)` - Compact (1K, 1M)
- `formatList(items, lang, type?)` - Lists
- `formatDateRange(start, end, lang, options?)` - Date range

### Utility Functions
- `getDecimalSeparator(lang)` - Get decimal separator
- `getThousandsSeparator(lang)` - Get thousands separator
- `getAcceptLanguageHeader(lang)` - For API requests

## Best Practices

1. **Always use t() for strings** - Never hardcode text
2. **Use pluralization** - Don't use "file(s)"
3. **Use locale formatting** - Don't hardcode date/number formats
4. **Test RTL** - Check layout with ar, he, or ur
5. **Keep placeholders consistent** - Match English structure
6. **Use descriptive keys** - "app.feature.action" not "label1"
7. **Preserve context** - Include surrounding context in translations
8. **Test all languages** - Run audit regularly
9. **Handle errors** - Formatters have fallbacks
10. **Document new keys** - Add comments for context

## Common Mistakes to Avoid

❌ Don't: `<p>{count} file(s)</p>`
✅ Do: `<p>{pluralizeObject(count, language, { one: '# file', other: '# files' })}</p>`

❌ Don't: `<p>{date.toLocaleDateString()}</p>`
✅ Do: `<p>{formatDate(date, language)}</p>`

❌ Don't: `<p>Downloaded {size} bytes</p>`
✅ Do: `<p>Downloaded {formatFileSize(size, language)}</p>`

❌ Don't: Hardcode text direction
✅ Do: `<div dir={isRTL ? 'rtl' : 'ltr'}>`

❌ Don't: Use HTML in translations
✅ Do: Use placeholders and compose in JSX

## Performance Tips

1. Translations are lazy-loaded and cached
2. Use `useMemo` for expensive formatting
3. Formatter functions are optimized with try/catch
4. RTL CSS only applies when needed
5. Browser Intl APIs are used (native performance)

## Debugging

```typescript
// Check current language
console.log(language); // "en"

// Check if translation exists
console.log(t('some.key')); // Returns key if missing

// Check plural category
console.log(getPluralCategory(5, 'ru')); // "many"

// Check RTL status
console.log(isRTL); // true/false
```

---

**Last Updated:** 2026-01-30
**Version:** 1.0.0
