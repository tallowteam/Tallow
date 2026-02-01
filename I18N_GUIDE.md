# Internationalization (i18n) Guide

## Overview

Tallow supports 22 languages with full internationalization, including RTL (Right-to-Left) text direction for Arabic, Hebrew, and Urdu. This guide covers translation, locale formatting, and RTL support.

## Supported Languages

| Code | Language | Native Name | RTL |
|------|----------|-------------|-----|
| en | English | English | No |
| es | Spanish | Español | No |
| zh | Chinese | 中文 | No |
| hi | Hindi | हिन्दी | No |
| ar | Arabic | العربية | Yes |
| he | Hebrew | עברית | Yes |
| pt | Portuguese | Português | No |
| bn | Bengali | বাংলা | No |
| ru | Russian | Русский | No |
| ja | Japanese | 日本語 | No |
| de | German | Deutsch | No |
| fr | French | Français | No |
| ko | Korean | 한국어 | No |
| tr | Turkish | Türkçe | No |
| it | Italian | Italiano | No |
| vi | Vietnamese | Tiếng Việt | No |
| pl | Polish | Polski | No |
| nl | Dutch | Nederlands | No |
| th | Thai | ไทย | No |
| id | Indonesian | Bahasa Indonesia | No |
| uk | Ukrainian | Українська | No |
| ur | Urdu | اردو | Yes |

## Translation Files

Translation files are located in `/lib/i18n/translations/`:

```
lib/i18n/translations/
├── en.json
├── es.json
├── zh.json
├── ar.json
├── he.json
├── ...
└── ur.json
```

### Translation File Structure

Each file follows this JSON structure:

```json
{
  "nav.features": "Features",
  "nav.howItWorks": "How it works",
  "home.hero.title1": "Share Files",
  "app.send": "Send",
  "app.receive": "Receive"
}
```

### Key Naming Convention

- Dot notation: `section.component.element`
- Lowercase with camelCase for specifics
- Examples:
  - `nav.features` - Navigation features link
  - `home.hero.title` - Homepage hero title
  - `app.send` - App send button

## Using Translations

### Basic Usage

```typescript
import { useLanguage } from '@/lib/i18n/language-context';

function MyComponent() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t('home.hero.title')}</h1>
      <button>{t('app.send')}</button>
    </div>
  );
}
```

### With Language Info

```typescript
import { useLanguage } from '@/lib/i18n/language-context';

function MyComponent() {
  const { t, language, currentLanguage, isRTL, setLanguage } = useLanguage();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <p>Current: {currentLanguage.nativeName}</p>
      <button onClick={() => setLanguage('es')}>
        Switch to Spanish
      </button>
    </div>
  );
}
```

### Language Context API

```typescript
interface LanguageContextType {
  language: LanguageCode;           // Current language code
  setLanguage: (lang: LanguageCode) => void;  // Change language
  t: (key: string) => string;       // Translate function
  currentLanguage: Language;         // Full language object
  isRTL: boolean;                    // Is RTL language
  isLoading: boolean;                // Translation loading state
}
```

## Locale Formatting

### Date Formatting

```typescript
import { formatDate, formatTime, formatDateTime } from '@/lib/i18n/locale-formatter';

const date = new Date();

// Format date according to locale
formatDate(date, 'en');  // "January 25, 2026"
formatDate(date, 'de');  // "25. Januar 2026"
formatDate(date, 'ar');  // "٢٥ يناير ٢٠٢٦"

// Format time
formatTime(date, 'en');  // "02:30 PM"
formatTime(date, 'de');  // "14:30"

// Format date and time
formatDateTime(date, 'fr');  // "25 janvier 2026 à 14:30"
```

### Relative Time

```typescript
import { formatRelativeTime } from '@/lib/i18n/locale-formatter';

const yesterday = new Date(Date.now() - 86400000);

formatRelativeTime(yesterday, 'en');  // "yesterday"
formatRelativeTime(yesterday, 'es');  // "ayer"
formatRelativeTime(yesterday, 'ar');  // "أمس"
```

### Number Formatting

```typescript
import { formatNumber, formatPercent } from '@/lib/i18n/locale-formatter';

formatNumber(1234567.89, 'en');  // "1,234,567.89"
formatNumber(1234567.89, 'de');  // "1.234.567,89"
formatNumber(1234567.89, 'ar');  // "١٬٢٣٤٬٥٦٧٫٨٩"

formatPercent(0.856, 'en');      // "86%"
formatPercent(0.856, 'fr');      // "86 %"
```

### Currency Formatting

```typescript
import { formatCurrency } from '@/lib/i18n/locale-formatter';

formatCurrency(99.99, 'USD', 'en');  // "$99.99"
formatCurrency(99.99, 'USD', 'de');  // "99,99 $"
formatCurrency(99.99, 'EUR', 'fr');  // "99,99 €"
formatCurrency(99.99, 'JPY', 'ja');  // "¥100"
```

### File Size Formatting

```typescript
import { formatFileSize } from '@/lib/i18n/locale-formatter';

formatFileSize(1024, 'en');       // "1.00 KB"
formatFileSize(1048576, 'de');    // "1,00 MB"
formatFileSize(1073741824, 'ar'); // "١٫٠٠ GB"
```

### List Formatting

```typescript
import { formatList } from '@/lib/i18n/locale-formatter';

const items = ['Apple', 'Banana', 'Orange'];

formatList(items, 'en');  // "Apple, Banana, and Orange"
formatList(items, 'de');  // "Apple, Banana und Orange"
formatList(items, 'ja');  // "Apple、Banana、Orange"
```

## RTL (Right-to-Left) Support

### Automatic Direction

The language context automatically sets the text direction:

```typescript
// When language is Arabic, Hebrew, or Urdu
<html dir="rtl">
```

### RTL-Aware Styling

RTL CSS is automatically applied from `/lib/i18n/rtl-support.css`:

```css
/* Automatically flips for RTL */
[dir="rtl"] .text-left {
  text-align: right !important;
}

[dir="rtl"] .flex-row {
  flex-direction: row-reverse;
}
```

### Manual RTL Control

```typescript
import { useLanguage } from '@/lib/i18n/language-context';

function MyComponent() {
  const { isRTL } = useLanguage();

  return (
    <div className={isRTL ? 'rtl-specific-class' : 'ltr-specific-class'}>
      Content
    </div>
  );
}
```

### RTL CSS Classes

Pre-built RTL utilities:

```css
/* Force LTR for specific elements */
.ltr {
  direction: ltr !important;
  text-align: left !important;
}

/* Force RTL for specific elements */
.rtl {
  direction: rtl !important;
  text-align: right !important;
}

/* Don't flip these icons */
.icon-no-flip {
  transform: none !important;
}
```

### Common RTL Patterns

```typescript
// Icons that should flip
<ChevronRight className={isRTL ? 'transform scale-x-[-1]' : ''} />

// Icons that should NOT flip (search, settings, etc.)
<Search className="icon-no-flip" />

// Margins and padding
<div className={isRTL ? 'mr-4' : 'ml-4'}>
  Content
</div>

// Or use RTL-aware spacing
<div className="ps-4"> {/* padding-start, auto-flips */}
  Content
</div>
```

## Language Selector

The language dropdown component is at `/components/language-dropdown.tsx`:

```typescript
import { LanguageDropdown } from '@/components/language-dropdown';

function Navigation() {
  return (
    <nav>
      <LanguageDropdown />
    </nav>
  );
}
```

### Custom Language Selector

```typescript
import { useLanguage, languages } from '@/lib/i18n/language-context';

function CustomSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
```

## Adding a New Language

### 1. Create Translation File

Create `/lib/i18n/translations/[code].json`:

```json
{
  "nav.features": "Translated text",
  "nav.howItWorks": "Translated text",
  ...
}
```

**Tip**: Copy `en.json` and translate all keys.

### 2. Update Language Context

Edit `/lib/i18n/language-context.tsx`:

```typescript
export type LanguageCode =
  | 'en' | 'es' | ... | 'newlang';

export const languages: Language[] = [
  ...
  { code: 'newlang', name: 'Language Name', nativeName: 'Native Name', rtl: false },
];
```

### 3. Add Locale Mapping

Edit `/lib/i18n/locale-formatter.ts`:

```typescript
const LOCALE_MAP_EXTENDED: Record<string, string> = {
  ...
  newlang: 'locale-code',  // e.g., 'pt-BR'
};
```

### 4. Test

1. Switch to new language
2. Verify all translations
3. Test RTL if applicable
4. Check locale formatting

## Translation Best Practices

### 1. Use Placeholders

For dynamic content, use template strings:

```typescript
// Translation file
{
  "app.transferProgress": "Transferring {fileName}... {percent}%"
}

// Usage
const message = t('app.transferProgress')
  .replace('{fileName}', file.name)
  .replace('{percent}', progress.toString());
```

### 2. Context-Specific Keys

Provide context in key names:

```typescript
// Good
"button.send.label": "Send"
"button.send.aria": "Send files to recipient"

// Bad
"send": "Send"
```

### 3. Handle Plurals

English example:

```json
{
  "files.count.one": "{count} file",
  "files.count.other": "{count} files"
}
```

Usage:

```typescript
const count = files.length;
const key = count === 1 ? 'files.count.one' : 'files.count.other';
t(key).replace('{count}', count.toString());
```

### 4. Keep Keys Organized

Group by feature/page:

```json
{
  "nav.*": "Navigation items",
  "home.*": "Homepage content",
  "app.*": "App UI",
  "settings.*": "Settings page",
  "errors.*": "Error messages"
}
```

### 5. Fallback to English

Missing translations automatically fall back to English:

```typescript
t('missing.key');  // Returns English version or key itself
```

## Testing Translations

### Visual Testing

1. Switch to each language
2. Check layout (especially RTL)
3. Verify text fits in UI
4. Test responsive breakpoints

### Automated Testing

```typescript
import { languages } from '@/lib/i18n/language-context';

test('all languages have required keys', () => {
  const requiredKeys = ['nav.features', 'app.send', 'app.receive'];

  languages.forEach((lang) => {
    const translations = require(`./translations/${lang.code}.json`);

    requiredKeys.forEach((key) => {
      expect(translations[key]).toBeDefined();
    });
  });
});
```

## Common Issues

### Text Overflow

Some languages use longer words (German, Finnish). Ensure:
- Flexible layouts
- Text truncation with ellipsis
- Responsive font sizes

```css
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### RTL Layout Breaks

Test RTL languages thoroughly:
- Icons should flip (except universal ones)
- Margins/padding should swap
- Flex direction should reverse
- Text alignment should flip

### Font Support

Ensure fonts support all characters:
- Arabic: Use fonts with Arabic glyphs
- Chinese: Use fonts with CJK support
- Emoji: Use fonts with emoji support

Current fonts support Latin, Cyrillic, Greek, and basic symbols.

## Performance

### Lazy Loading Translations

Translations are loaded dynamically:

```typescript
// Only loaded when language is selected
const mod = await import(`@/lib/i18n/translations/${lang}.json`);
```

### Caching

Translations are cached after first load:

```typescript
const translationCache: Record<LanguageCode, Record<string, string>> = {};
```

### Bundle Size

Each translation file is ~5-8KB. Only active language is loaded.

## Accessibility

### Language Attribute

```html
<html lang="en">  <!-- Auto-updates on language change -->
```

### Text Direction

```html
<html dir="ltr">  <!-- Auto-updates to rtl for RTL languages -->
```

### ARIA Labels

Translate ARIA labels:

```json
{
  "button.close.aria": "Close dialog",
  "button.menu.aria": "Open navigation menu"
}
```

Usage:

```tsx
<button aria-label={t('button.close.aria')}>
  <X />
</button>
```

## Resources

- [MDN i18n Guide](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization)
- [W3C i18n Best Practices](https://www.w3.org/International/quicktips/)
- [RTL Styling Guide](https://rtlstyling.com/)
- [Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

## Contributing Translations

To contribute a new translation:

1. Fork the repository
2. Create translation file for your language
3. Follow the key structure from `en.json`
4. Add language to `language-context.tsx`
5. Add locale mapping to `locale-formatter.ts`
6. Test thoroughly
7. Submit a pull request

Please ensure:
- All keys are translated
- Text fits in UI
- Locale formatting works
- RTL support (if applicable)
