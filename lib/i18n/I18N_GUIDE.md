# Tallow i18n System Documentation

Comprehensive internationalization (i18n) system for Tallow supporting Arabic (RTL), Hebrew (RTL), and Hindi (LTR) with proper text direction handling.

## Overview

The i18n system provides:
- Multi-language support: Arabic, Hebrew, Hindi
- Automatic RTL/LTR layout handling
- React Context-based translation management
- TypeScript type safety
- Persistent locale preferences
- Accessibility-first design

## Supported Languages

| Language | Code | Direction | Script | Region |
|----------|------|-----------|--------|--------|
| Arabic | `ar` | RTL | Arabic | Middle East & North Africa |
| Hebrew | `he` | RTL | Hebrew | Israel |
| Hindi | `hi` | LTR | Devanagari | India |

## Project Structure

```
lib/i18n/
├── locales/
│   ├── ar.ts              # Arabic (RTL) - Modern Standard Arabic
│   ├── he.ts              # Hebrew (RTL) - Modern Hebrew
│   ├── hi.ts              # Hindi (LTR) - Devanagari script
│   └── index.ts           # Central locale exports
├── config.ts              # Configuration & utility functions
├── I18nProvider.tsx       # React context provider component
├── useTranslation.ts      # Translation utility functions
└── I18N_GUIDE.md          # This documentation
```

## Translation Categories

All locales include comprehensive translations organized by category:

### 1. common (19 keys)
Generic UI strings used throughout the application
- appName, tagline, loading, cancel, confirm, save, delete, close, back, next, search, noResults, retry, ok, yes, no, error, success, warning, info

### 2. nav (8 keys)
Navigation menu items
- home, features, security, pricing, docs, about, transfer, settings

### 3. hero (4 keys)
Hero section headline and CTAs
- title, subtitle, cta, secondaryCta

### 4. features (8 keys)
Feature descriptions and benefits
- localSharing, internetSharing, friendsSharing, encryption, speed, privacy, noLimits, crossPlatform

### 5. transfer (15 keys)
File transfer UI and status messages
- dropFiles, scanning, noDevices, sendTo, receiving, complete, failed, speed, cancel, pause, resume, retry, queue, history, clearHistory

### 6. security (6 keys)
Security features and descriptions
- e2e, pqc, zeroKnowledge, noServer, openSource, auditLog

### 7. pricing (7 keys)
Pricing page content
- free, pro, business, perMonth, getStarted, features, popular

### 8. settings (11 keys)
Settings interface labels
- theme, language, deviceName, privacy, notifications, connection, about, dark, light, highContrast, colorblind

### 9. chat (6 keys)
Chat/messaging interface strings
- typingIndicator, messagePlaceholder, send, encrypted, delivered, read

### 10. friends (7 keys)
Friend management interface
- addFriend, pairingCode, online, offline, lastSeen, removeFriend, block

### 11. notifications (5 keys)
Notification messages
- transferComplete, newDevice, friendRequest, error, connectionLost

### 12. errors (7 keys)
Error messages and status
- connectionFailed, timeout, cryptoError, noCamera, noPermission, fileTooBig, unsupported

### 13. a11y (7 keys)
Accessibility labels and descriptions
- skipToContent, openMenu, closeMenu, darkMode, lightMode, loading, progress

## Getting Started

### 1. Setup Provider

Wrap your Next.js app with `I18nProvider`:

```tsx
// app/layout.tsx
import { I18nProvider } from '@/lib/i18n/I18nProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

### 2. Use Translations in Components

```tsx
// components/Header.tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function Header() {
  const { t, locale, isRTL, setLocale } = useI18n();

  return (
    <header dir={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t('common.appName')}</h1>
      <nav>
        <a href="/">{t('nav.home')}</a>
        <a href="/features">{t('nav.features')}</a>
        <a href="/security">{t('nav.security')}</a>
      </nav>

      <select value={locale} onChange={(e) => setLocale(e.target.value)}>
        <option value="ar">العربية</option>
        <option value="he">עברית</option>
        <option value="hi">हिन्दी</option>
      </select>
    </header>
  );
}
```

### 3. RTL/LTR Handling

The provider automatically sets `dir` and `lang` on the HTML element:

```tsx
// Automatic in provider, but you can also use locally
const { isRTL, textDirection } = useI18n();

// Method 1: Use dir attribute (recommended)
<div dir={textDirection}>
  Content automatically aligns based on direction
</div>

// Method 2: Conditional styling
<div className={isRTL ? 'rtl-container' : 'ltr-container'}>
  Content
</div>

// Method 3: CSS selectors
/* CSS */
html[dir="rtl"] .button {
  margin-left: auto;
}

html[dir="ltr"] .button {
  margin-right: auto;
}
```

## API Reference

### useI18n Hook

Access translations and locale state in components:

```tsx
const {
  // Current locale
  locale: 'ar' | 'he' | 'hi',

  // Translation function
  t: (key: string, defaultValue?: string) => string,

  // Change locale
  setLocale: (locale: LocaleCode) => void,

  // Full translations object
  getTranslations: () => Translations,

  // Locale metadata
  localeMetadata: {
    name: string,
    nativeName: string,
    dir: 'ltr' | 'rtl',
    script: string,
    region: string,
  },

  // Text direction
  textDirection: 'ltr' | 'rtl',

  // Convenience RTL flag
  isRTL: boolean,

  // All supported locales
  availableLocales: LocaleCode[],
} = useI18n();
```

### getStaticTranslation Function

For translations outside React components:

```ts
import { getStaticTranslation } from '@/lib/i18n/useTranslation';

const appName = getStaticTranslation('ar', 'common.appName'); // تالو
const title = getStaticTranslation('hi', 'hero.title'); // सुरक्षित और तेज़ फ़ाइल स्थानांतरण
```

### Configuration Functions

```ts
import {
  getRTLLocales,      // Returns ['ar', 'he']
  getLTRLocales,      // Returns ['hi', ...]
  isRTLLocale,        // (locale) => boolean
  getTextDirection,   // (locale) => 'ltr' | 'rtl'
  getLocaleName,      // (locale) => string
} from '@/lib/i18n/config';

const rtlLocales = getRTLLocales();
const isArabicRTL = isRTLLocale('ar'); // true
const direction = getTextDirection('he'); // 'rtl'
const hindiName = getLocaleName('hi'); // 'हिन्दी'
```

## Examples

### Locale Picker Component

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';
import { getLocaleName } from '@/lib/i18n/config';

export function LocalePicker() {
  const { locale, setLocale, availableLocales } = useI18n();

  return (
    <div>
      <label htmlFor="locale-select">Select Language:</label>
      <select
        id="locale-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
      >
        {availableLocales.map((loc) => (
          <option key={loc} value={loc}>
            {getLocaleName(loc)}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Dynamic Content with Translations

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function TransferStatus({ status }: { status: 'scanning' | 'complete' | 'failed' }) {
  const { t } = useI18n();

  return (
    <div>
      <p>{t(`transfer.${status}`)}</p>
    </div>
  );
}
```

### Fallback Translations

```tsx
const { t } = useI18n();

// Provide fallback if key doesn't exist
const label = t('settings.unknownOption', 'Unknown Option');
```

### Access All Translations

```tsx
const { getTranslations, locale } = useI18n();
const translations = getTranslations();

const appName = translations.common.appName;
const features = translations.features;
const errors = translations.errors;
```

## Adding New Locales

To add a new language (e.g., French):

1. Create locale file: `lib/i18n/locales/fr.ts`

```ts
const fr = {
  common: {
    appName: 'Tallow',
    tagline: 'Partage de fichiers sécurisé et instantané entre appareils',
    // ... all keys
  },
  // ... all categories
};

export default fr;
```

2. Update `lib/i18n/locales/index.ts`:

```ts
import fr from './fr';

export const locales = {
  ar, he, hi,
  fr, // Add new locale
} as const;

export const LOCALE_METADATA = {
  // ... existing
  fr: {
    name: 'French',
    nativeName: 'Français',
    dir: 'ltr',
    script: 'Latin',
    region: 'France & International',
  },
};
```

3. Test in browser:

```tsx
const { setLocale } = useI18n();
setLocale('fr'); // Now works!
```

## Best Practices

1. **Always use dot notation** for translation keys
   ```ts
   t('common.appName')  // Good
   t('appName')         // Wrong - won't work
   ```

2. **Provide meaningful defaults** for missing keys
   ```ts
   t('missing.key', 'Fallback Text')
   ```

3. **Avoid runtime key generation from user input**
   ```ts
   // Good
   t(`notifications.${validEventType}`)

   // Avoid
   t(userProvidedString)
   ```

4. **Test all directions** when adding new UI
   ```tsx
   // Set locale to 'ar' or 'he' to test RTL
   // Set locale to 'hi' to test LTR
   ```

5. **Use logical CSS properties** for better RTL support
   ```css
   .button {
     margin-inline-start: 1rem;
     padding-inline-end: 1rem;
     text-align: start;
   }
   ```

6. **Component-level locale selection** for modular apps
   ```tsx
   <LocalePicker />
   <Hero />
   <Features />
   ```

## Performance Optimization

The i18n system is optimized for performance:

- **Lazy Loading**: Locales loaded at module level, not runtime
- **Memoization**: Translation function and metadata memoized
- **No Rerenders**: Changing non-locale state doesn't trigger translation recomputation
- **Storage**: Optional localStorage caching of locale preference
- **Hydration Safe**: Works correctly with Next.js SSR/SSG

## Accessibility (a11y)

All translations include accessibility labels:

- Skip links
- Menu labels
- Color mode descriptions
- Loading and progress indicators
- Screen reader friendly descriptions

```tsx
// Use a11y translations for accessibility
<a href="#main-content" className="skip-link">
  {t('a11y.skipToContent')}
</a>

<button
  aria-label={t('a11y.darkMode')}
  onClick={toggleDarkMode}
>
  Toggle Theme
</button>
```

## Troubleshooting

### Issue: "useI18n must be used within I18nProvider"

**Solution**: Ensure component is wrapped by `I18nProvider` in app layout:

```tsx
// app/layout.tsx - Correct
<I18nProvider>
  {children}
</I18nProvider>

// components/MyComponent.tsx - Wrapped by provider
<YourComponent />
```

### Issue: Translations showing as keys (e.g., "common.appName")

**Cause**: Likely using client component without proper context

**Solution**:
1. Add `'use client'` directive
2. Verify provider wraps component
3. Check key spelling matches locale file

### Issue: RTL layout not applying

**Cause**: CSS not respecting `dir` attribute

**Solution**: Use `dir="rtl"` on container or update CSS:

```css
/* Use logical properties */
.container {
  margin-inline-start: 1rem;
  text-align: start;
}

/* Or target dir attribute */
html[dir="rtl"] .container {
  text-align: right;
}
```

### Issue: Locale doesn't persist on refresh

**Check**: `I18N_CONFIG.features.persistLocale` is true

```ts
// lib/i18n/config.ts
export const I18N_CONFIG = {
  features: {
    persistLocale: true, // Ensure this is true
  },
};
```

## Language-Specific Notes

### Arabic (ar) - RTL
- Modern Standard Arabic (Fusha)
- Formal register throughout
- Right-to-left text direction
- Used widely in MENA region

### Hebrew (he) - RTL
- Modern Hebrew
- Formal register
- Right-to-left text direction
- Proper handling of punctuation with RTL

### Hindi (hi) - LTR
- Devanagari script
- Formal "आप" form for all text
- Left-to-right direction
- Uses common Hindi tech terms where standard

## Testing

### Unit Testing

```tsx
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n/I18nProvider';

describe('Component with translations', () => {
  it('renders with correct locale', () => {
    render(
      <I18nProvider defaultLocale="ar">
        <MyComponent />
      </I18nProvider>
    );

    expect(screen.getByText('تالو')).toBeInTheDocument();
  });
});
```

### Testing RTL

```tsx
it('applies RTL direction for Arabic', () => {
  const { container } = render(
    <I18nProvider defaultLocale="ar">
      <div dir={document.documentElement.dir}>Content</div>
    </I18nProvider>
  );

  expect(container.firstChild).toHaveAttribute('dir', 'rtl');
});
```

## Migration from Other i18n Systems

If migrating from i18next, react-intl, or similar:

1. Install Tallow i18n files: `lib/i18n/*`
2. Wrap app with `I18nProvider`
3. Replace old hook calls:
   ```ts
   // Old: useTranslation() from i18next
   // New: useI18n() from Tallow
   const { t } = useI18n();
   ```
4. Update keys to dot notation: `common.appName`
5. Test all locales and directions

## Files Overview

| File | Purpose |
|------|---------|
| `lib/i18n/locales/ar.ts` | Arabic translations (RTL) |
| `lib/i18n/locales/he.ts` | Hebrew translations (RTL) |
| `lib/i18n/locales/hi.ts` | Hindi translations (LTR) |
| `lib/i18n/locales/index.ts` | Locale exports and metadata |
| `lib/i18n/config.ts` | Configuration and utilities |
| `lib/i18n/I18nProvider.tsx` | React context provider |
| `lib/i18n/useTranslation.ts` | Translation functions |
| `lib/i18n/I18N_GUIDE.md` | This documentation |

## Support

For issues or questions:
1. Check this documentation
2. Review examples in this guide
3. Check translation file structure
4. Verify provider setup in layout.tsx
5. Test with different locales

## License

Part of the Tallow project. See main LICENSE file.

---

**Last Updated**: 2026-02-06
**Version**: 1.0.0
**Status**: Production Ready
