# i18n Quick Start Guide

Get translations working in Tallow in 5 minutes.

## 1. Wrap App with Provider

```tsx
// app/layout.tsx
import { I18nProvider } from '@/lib/i18n/I18nProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <I18nProvider defaultLocale="ar">
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

## 2. Use in Components

```tsx
// components/Header.tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export default function Header() {
  const { t, isRTL } = useI18n();

  return (
    <header dir={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t('common.appName')}</h1>
      <p>{t('common.tagline')}</p>
    </header>
  );
}
```

## 3. Locale Switcher

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export default function LocalePicker() {
  const { locale, setLocale } = useI18n();

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      <option value="ar">العربية</option>
      <option value="he">עברית</option>
      <option value="hi">हिन्दी</option>
    </select>
  );
}
```

## Common Translation Keys

```tsx
const { t } = useI18n();

// Common strings
t('common.appName')      // App name
t('common.loading')      // Loading...
t('common.cancel')       // Cancel
t('common.confirm')      // Confirm
t('common.save')         // Save

// Navigation
t('nav.home')            // Home
t('nav.features')        // Features
t('nav.security')        // Security
t('nav.pricing')         // Pricing

// Hero section
t('hero.title')          // Main title
t('hero.subtitle')       // Subtitle
t('hero.cta')            // Call-to-action button

// Features
t('features.e2e')        // End-to-end encryption
t('features.speed')      // Lightning speed
t('features.privacy')    // Privacy protected

// Transfer
t('transfer.dropFiles')  // Drop files here
t('transfer.scanning')   // Scanning devices...
t('transfer.complete')   // Transfer complete

// Settings
t('settings.theme')      // Theme
t('settings.language')   // Language
t('settings.dark')       // Dark mode
t('settings.light')      // Light mode

// Errors
t('errors.connectionFailed')  // Connection failed
t('errors.timeout')           // Request timeout
```

## RTL/LTR Handling

```tsx
// Automatic - provider sets dir="rtl" or dir="ltr"
// But you can also use locally:

const { isRTL, textDirection } = useI18n();

// Option 1: Use dir attribute (recommended)
<div dir={textDirection}>Content</div>

// Option 2: Check isRTL flag
{isRTL && <RtlStyles />}
{!isRTL && <LtrStyles />}

// Option 3: CSS
// html[dir="rtl"] .button { ... }
// html[dir="ltr"] .button { ... }
```

## Access Locale Info

```tsx
const { locale, localeMetadata, availableLocales } = useI18n();

// Current locale
console.log(locale); // 'ar', 'he', or 'hi'

// Metadata for current locale
console.log(localeMetadata.nativeName); // عربي, עברית, या हिंदी
console.log(localeMetadata.dir);        // 'rtl' or 'ltr'
console.log(localeMetadata.script);     // 'Arabic', 'Hebrew', 'Devanagari'
console.log(localeMetadata.region);     // Geographic region

// All available locales
console.log(availableLocales); // ['ar', 'he', 'hi']
```

## Static Translations (Outside Components)

```ts
import { getStaticTranslation } from '@/lib/i18n/useTranslation';

// In utilities, APIs, etc.
const appName = getStaticTranslation('ar', 'common.appName');
const title = getStaticTranslation('he', 'hero.title');
```

## Full Translations Object

```tsx
const { getTranslations } = useI18n();
const translations = getTranslations();

// Access nested translations
translations.common.appName
translations.nav.features
translations.errors.connectionFailed
```

## Supported Locales

| Code | Language | Direction |
|------|----------|-----------|
| ar   | العربية   | RTL       |
| he   | עברית     | RTL       |
| hi   | हिन्दी    | LTR       |

## Tips

1. Always use dot notation: `t('category.key')`
2. Locales auto-persist to localStorage
3. Direction automatically applied to HTML element
4. Works with Next.js SSR/SSG
5. TypeScript support for all translation keys

## Troubleshooting

**Translations showing as keys?**
- Add `'use client'` to component
- Make sure it's inside `I18nProvider`

**RTL not working?**
- Check `document.documentElement.dir` in browser console
- Should be 'rtl' for Arabic/Hebrew

**Locale not persisting?**
- Browser must allow localStorage
- Check if private browsing is disabled
- Verify `I18N_CONFIG.features.persistLocale === true`

## Full Documentation

See `I18N_GUIDE.md` for complete documentation.
