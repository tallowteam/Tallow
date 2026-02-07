# Asian Language Implementation Guide

## Overview

This guide provides developers with everything needed to integrate and maintain the four new Asian language translations (Simplified Chinese, Traditional Chinese, Japanese, and Korean) in the Tallow application.

---

## Quick Start

### 1. Basic Usage in React Components

```typescript
import { useI18n } from '@/lib/i18n';

export function MyComponent() {
  const { t, locale } = useI18n();

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>Current locale: {locale}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### 2. Direct Locale Import

```typescript
import { locales } from '@/lib/i18n/locales';

// Access directly
const chineseHero = locales['zh-CN'].hero.title;
const japaneseFeature = locales['ja'].features.localSharing;
```

### 3. Server-Side Rendering (SSR)

```typescript
import { getServerTranslation } from '@/lib/i18n';

export async function getServerProps(context: GetServerPropsContext) {
  const locale = context.locale || 'en';
  const t = getServerTranslation(locale);

  return {
    props: {
      title: t('hero.title'),
    },
  };
}
```

---

## File Structure

```
lib/i18n/
├── locales/
│   ├── en.ts                          # English reference
│   ├── zh-CN.ts                       # Simplified Chinese
│   ├── zh-TW.ts                       # Traditional Chinese
│   ├── ja.ts                          # Japanese
│   ├── ko.ts                          # Korean
│   ├── index.ts                       # Central export
│   ├── ASIAN_LANGUAGES_README.md      # Language guide
│   └── IMPLEMENTATION_GUIDE.md        # This file
├── i18n.ts                           # Core utilities
├── useI18n.ts                        # React hook
├── useTranslation.ts                 # Alternative hook
└── types.ts                          # Type definitions
```

---

## Locale Codes and Metadata

### Supported Locale Codes

```typescript
type LocaleCode =
  | 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'nl' | 'ru'
  | 'ar' | 'he' | 'hi'
  | 'zh-CN' | 'zh-TW' | 'ja' | 'ko'
  | 'tr' | 'pl' | 'sv' | 'no' | 'da' | 'fi' | 'th';
```

### Metadata Example

```typescript
import { LOCALE_METADATA } from '@/lib/i18n/locales';

console.log(LOCALE_METADATA['ja']);
// {
//   name: 'Japanese',
//   nativeName: '日本語',
//   dir: 'ltr',
//   script: 'Japanese (Hiragana, Katakana, Kanji)',
//   region: 'Japan'
// }

console.log(LOCALE_METADATA['zh-CN']);
// {
//   name: 'Simplified Chinese',
//   nativeName: '简体中文',
//   dir: 'ltr',
//   script: 'Han (Simplified)',
//   region: 'Mainland China'
// }
```

---

## Language Detection and Selection

### 1. Browser Language Detection

```typescript
import { getLocaleFromBrowser, matchLocale } from '@/lib/i18n';

// Get user's browser language
const browserLang = getLocaleFromBrowser();
// Might return: 'ja-JP', 'zh-CN', 'ko-KR', 'en-US'

// Match to available locales
const matched = matchLocale(browserLang, ['en', 'ja', 'zh-CN', 'ko']);
// Returns: 'ja' if browser language is Japanese variant
```

### 2. Locale Switching Component

```typescript
import { locales, LOCALE_METADATA, type LocaleCode } from '@/lib/i18n/locales';
import { useI18n } from '@/lib/i18n';

export function LocaleSwitcher() {
  const { setLocale, locale } = useI18n();

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value as LocaleCode)}>
      {Object.entries(LOCALE_METADATA).map(([code, meta]) => (
        <option key={code} value={code}>
          {meta.nativeName} ({meta.name})
        </option>
      ))}
    </select>
  );
}
```

### 3. Using Browser Preferences as Default

```typescript
import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { getLocaleFromBrowser, matchLocale } from '@/lib/i18n';
import { LOCALE_CODES } from '@/lib/i18n/locales';

export function useAutoDetectLocale() {
  const { setLocale } = useI18n();

  useEffect(() => {
    const browserLang = getLocaleFromBrowser();
    const matched = matchLocale(browserLang, LOCALE_CODES as string[]);

    if (matched) {
      setLocale(matched);
    }
  }, [setLocale]);
}
```

---

## Working with Translation Keys

### Type-Safe Translation Access

```typescript
import { locales } from '@/lib/i18n/locales';

// Type-safe key access
const locale = locales['ja'];
const appName = locale.common.appName;        // ✓ OK
const wrongKey = locale.common.invalidKey;    // ✗ TypeScript error

// All keys available:
locale.common.loading;
locale.nav.home;
locale.hero.title;
locale.features.encryption;
locale.transfer.sendTo;
locale.security.e2e;
locale.pricing.pro;
locale.settings.theme;
locale.chat.send;
locale.friends.addFriend;
locale.notifications.error;
locale.errors.connectionFailed;
locale.a11y.skipToContent;
```

### Accessing Nested Translations

```typescript
// With React hook
const { t } = useI18n();
t('common.appName');           // 'Tallow'
t('hero.title');               // Locale-specific title
t('transfer.dropFiles');       // Locale-specific drop zone text

// With direct import
import { locales } from '@/lib/i18n/locales';

const locale = locales['zh-CN'];
locale.common.tagline;         // '安全的对等文件传输'
locale.features.encryption;    // '端到端加密'
```

---

## Localizing UI Components

### Example 1: Button Component

```typescript
import { useI18n } from '@/lib/i18n';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  translationKey: string;
  onClick?: () => void;
}

export function LocalizedButton({ variant, translationKey, onClick }: ButtonProps) {
  const { t } = useI18n();

  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {t(translationKey)}
    </button>
  );
}

// Usage
<LocalizedButton variant="primary" translationKey="common.save" />
<LocalizedButton variant="secondary" translationKey="transfer.cancel" />
```

### Example 2: Form Field Component

```typescript
import { useI18n } from '@/lib/i18n';

interface FormFieldProps {
  name: string;
  placeholderKey: string;
  labelKey: string;
  value: string;
  onChange: (value: string) => void;
}

export function LocalizedFormField({
  name,
  placeholderKey,
  labelKey,
  value,
  onChange,
}: FormFieldProps) {
  const { t } = useI18n();

  return (
    <div className="form-group">
      <label htmlFor={name}>{t(labelKey)}</label>
      <input
        id={name}
        type="text"
        placeholder={t(placeholderKey)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// Usage
<LocalizedFormField
  name="deviceName"
  labelKey="settings.deviceName"
  placeholderKey="settings.deviceNamePlaceholder"
  value={name}
  onChange={setName}
/>
```

### Example 3: Error Display

```typescript
import { useI18n } from '@/lib/i18n';

interface ErrorAlertProps {
  errorKey: string;
  details?: string;
}

export function LocalizedErrorAlert({ errorKey, details }: ErrorAlertProps) {
  const { t } = useI18n();

  return (
    <div className="alert alert-error">
      <strong>{t(errorKey)}</strong>
      {details && <p>{details}</p>}
    </div>
  );
}

// Usage
<LocalizedErrorAlert errorKey="errors.connectionFailed" />
<LocalizedErrorAlert
  errorKey="errors.fileTooBig"
  details="Maximum file size is 10GB"
/>
```

---

## Language-Specific Formatting

### Character Width Considerations

Different languages have different character widths and line heights:

```css
/* CSS for CJK (Chinese, Japanese, Korean) text */
.cjk-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Noto Sans CJK JP', 'Noto Sans CJK SC', sans-serif;
  line-height: 1.6;  /* Slightly more line height for CJK */
  letter-spacing: 0.02em;
}

/* For mixed content (CJK + Latin) */
.mixed-text {
  word-break: break-word;
  overflow-wrap: break-word;
}
```

### Text Length Buffer

Plan UI layouts to accommodate:
- English: baseline
- Chinese: 60-80% of English length
- Japanese: 70-90% of English length
- Korean: 70-85% of English length

```typescript
// Example: Responsive button width
function ResponsiveButton({ label }: { label: string }) {
  const { locale } = useI18n();

  const widthClass =
    locale === 'en' ? 'w-32' :
    ['zh-CN', 'zh-TW'].includes(locale) ? 'w-24' :
    ['ja', 'ko'].includes(locale) ? 'w-28' :
    'w-32';

  return <button className={widthClass}>{label}</button>;
}
```

---

## Testing Translations

### Unit Tests for Translations

```typescript
import { locales, LOCALE_CODES } from '@/lib/i18n/locales';

describe('Translations', () => {
  it('should have all required keys in all locales', () => {
    const requiredKeys = [
      'common.appName',
      'nav.home',
      'hero.title',
      'transfer.dropFiles',
      'errors.connectionFailed',
    ];

    LOCALE_CODES.forEach((localeCode) => {
      const locale = locales[localeCode];

      requiredKeys.forEach((keyPath) => {
        const keys = keyPath.split('.');
        let value: any = locale;

        keys.forEach((key) => {
          expect(value[key]).toBeDefined();
          value = value[key];
        });
      });
    });
  });

  it('should not have undefined translations', () => {
    LOCALE_CODES.forEach((localeCode) => {
      const locale = locales[localeCode];

      const checkValues = (obj: any, path = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const fullPath = path ? `${path}.${key}` : key;

          if (typeof value === 'object') {
            checkValues(value, fullPath);
          } else {
            expect(value).toBeDefined();
            expect(value).not.toBeNull();
            expect(typeof value).toBe('string');
          }
        });
      };

      checkValues(locale);
    });
  });
});
```

### Visual Testing for CJK

```typescript
import { render, screen } from '@testing-library/react';
import { useI18n } from '@/lib/i18n';

describe('CJK Rendering', () => {
  it('should render Japanese characters correctly', () => {
    function TestComponent() {
      const { t } = useI18n();
      return <div>{t('ja.hero.title')}</div>;
    }

    // Mock Japanese locale
    render(<TestComponent />, { locale: 'ja' });

    const text = screen.getByText(/高速/);
    expect(text).toBeInTheDocument();
  });

  it('should handle traditional Chinese characters', () => {
    // Verify traditional characters are properly encoded
    expect(locales['zh-TW'].common.tagline).toContain('對等');
    expect(locales['zh-TW'].common.tagline).not.toContain('对等');
  });
});
```

---

## Performance Considerations

### Lazy Loading Translations

```typescript
// Only load selected locale to reduce bundle size
import type { Locale } from '@/lib/i18n/types';

async function loadLocale(code: string): Promise<Locale> {
  switch (code) {
    case 'zh-CN':
      return (await import('@/lib/i18n/locales/zh-CN')).default;
    case 'zh-TW':
      return (await import('@/lib/i18n/locales/zh-TW')).default;
    case 'ja':
      return (await import('@/lib/i18n/locales/ja')).default;
    case 'ko':
      return (await import('@/lib/i18n/locales/ko')).default;
    default:
      return (await import('@/lib/i18n/locales/en')).default;
  }
}
```

### Caching Strategy

```typescript
const translationCache = new Map<string, Locale>();

export async function getCachedLocale(code: string): Promise<Locale> {
  if (translationCache.has(code)) {
    return translationCache.get(code)!;
  }

  const locale = await loadLocale(code);
  translationCache.set(code, locale);
  return locale;
}
```

---

## Common Issues and Solutions

### Issue 1: Characters Not Displaying Correctly

**Problem**: Emoji, special characters, or CJK characters appear as boxes

**Solution**:
```css
/* Ensure proper font fallback chain */
body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Noto Sans',
    'Noto Sans CJK JP',
    'Noto Sans CJK SC',
    'Noto Sans CJK KR',
    sans-serif;
}
```

### Issue 2: Text Overflowing UI

**Problem**: Translated text is longer than English and breaks layout

**Solution**:
```css
/* Flexible layout with overflow handling */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  white-space: normal;  /* Allow wrapping */
  word-break: break-word;
  min-height: 44px;  /* Ensure touch target size */
}
```

### Issue 3: Locale Not Switching

**Problem**: Locale change doesn't update UI

**Solution**:
```typescript
// Ensure locale is properly updated in context
import { useI18n } from '@/lib/i18n';

export function useLocaleSync() {
  const { locale, setLocale } = useI18n();

  useEffect(() => {
    // Sync with localStorage
    localStorage.setItem('locale', locale);

    // Update document lang attribute
    document.documentElement.lang = locale;

    // Trigger re-render of all components
    // (useI18n hook should handle this automatically)
  }, [locale]);

  return { locale, setLocale };
}
```

---

## Maintenance and Updates

### Adding New Translation Keys

1. Add key to English (en.ts) first
2. Copy entire file structure
3. Translate each key in all Asian languages
4. Test in all locales
5. Update type definitions if needed

```typescript
// Example: Adding new feature translation

// en.ts
features: {
  // ... existing features
  newFeature: 'New Feature Description',
}

// zh-CN.ts
features: {
  // ... existing features
  newFeature: '新功能说明',
}

// zh-TW.ts
features: {
  // ... existing features
  newFeature: '新功能說明',
}

// ja.ts
features: {
  // ... existing features
  newFeature: '新機能の説明',
}

// ko.ts
features: {
  // ... existing features
  newFeature: '새 기능 설명',
}
```

### Versioning Translations

```typescript
// Add version comment to track updates
/**
 * Japanese Translations for Tallow
 * Version: 1.0.0
 * Last Updated: 2026-02-06
 * Maintainer: [Name/Team]
 */

export default { /* ... */ } as const;
```

---

## Resources for Translators

### Style Guides per Language

**Simplified Chinese (zh-CN)**
- Use simplified characters exclusively
- Mainland China terminology
- Formal but accessible tone
- No traditional characters

**Traditional Chinese (zh-TW)**
- Use traditional characters exclusively
- Taiwan terminology and conventions
- Formal polite register
- No simplified characters

**Japanese (ja)**
- Mix of hiragana, katakana, and kanji naturally
- Polite form (です・ます)
- Technical terms in katakana
- Respectful honorific language where appropriate

**Korean (ko)**
- Hangul only (no hanja/Chinese characters)
- Formal polite style (합니다)
- Modern, contemporary Korean
- Accessible to all users

---

## Next Steps

1. Test all translations in running application
2. Gather user feedback from native speakers
3. Monitor for any rendering issues
4. Plan periodic review cycles for quality assurance
5. Consider expanding to additional Asian languages

---

*For questions or improvements, contact the localization team.*
