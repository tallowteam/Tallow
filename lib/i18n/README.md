# Internationalization (i18n) System

Complete translation system for Tallow supporting English, French, German, Portuguese (Brazilian), and Italian.

## Quick Start

### Using Translations in React Components

```tsx
'use client';

import { useI18n } from '@/lib/i18n';

export function MyComponent() {
  const { t, language, setLanguage } = useI18n();

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <button onClick={() => setLanguage('fr')}>
        {t('common.appName')}
      </button>
    </div>
  );
}
```

### Using Translations in Server Components

```tsx
import { getServerTranslation } from '@/lib/i18n';

export function MyServerComponent({
  language = 'en',
}: {
  language?: string;
}) {
  const { translations } = getServerTranslation(language);

  return (
    <div>
      <h1>{translations.hero.title}</h1>
      <p>{translations.hero.subtitle}</p>
    </div>
  );
}
```

## Supported Languages

| Code | Name | Native Name | Direction |
|------|------|------------|-----------|
| en | English | English | LTR |
| fr | French | Français | LTR |
| de | German | Deutsch | LTR |
| pt | Portuguese (Brazil) | Português (Brasil) | LTR |
| it | Italian | Italiano | LTR |

## Translation Structure

All translation files follow the same key structure organized into categories:

### common
General UI labels, buttons, and common messages
- appName, tagline, loading, cancel, confirm, save, delete, close, back, next, search, noResults, retry, ok, yes, no, error, success, warning, info

### nav
Navigation menu items and links
- home, features, security, pricing, docs, about, transfer, settings

### hero
Landing page hero section content
- title, subtitle, cta, secondaryCta

### features
Feature descriptions and details
- localSharing, internetSharing, friendsSharing, encryption, speed, privacy, noLimits, crossPlatform

### transfer
File transfer UI and messages
- dropFiles, scanning, noDevices, sendTo, receiving, complete, failed, speed, cancel, pause, resume, retry, queue, history, clearHistory

### security
Security-related content
- e2e, pqc, zeroKnowledge, noServer, openSource, auditLog

### pricing
Pricing plans and billing
- free, pro, business, perMonth, getStarted, features, popular

### settings
User preferences and configuration
- theme, language, deviceName, privacy, notifications, connection, about, dark, light, highContrast, colorblind

### chat
Messaging and communication
- typingIndicator, messagePlaceholder, send, encrypted, delivered, read

### friends
Contacts and friend management
- addFriend, pairingCode, online, offline, lastSeen, removeFriend, block

### notifications
System and user notifications
- transferComplete, newDevice, friendRequest, error, connectionLost

### errors
Error messages and recovery
- connectionFailed, timeout, cryptoError, noCamera, noPermission, fileTooBig, unsupported

### a11y
Accessibility labels and announcements
- skipToContent, openMenu, closeMenu, darkMode, lightMode, loading, progress

## Language-Specific Features

### French (fr)
- Uses formal "vous" form for respectful communication
- Proper French typography with spaces before : ; ! ?
- Gender agreements for nouns and adjectives
- Example: "Partagez les fichiers de manière sécurisée"

### German (de)
- Uses formal "Sie" form for respectful communication
- Proper compound nouns following German rules
- All nouns capitalized per German grammar standards
- Example: "Dateiübertragung", "Verschlüsselung", "Peer-to-Peer"

### Portuguese - Brazilian (pt)
- Uses informal "você" form for friendlier user experience
- Brazilian Portuguese spelling and vocabulary
- Casual but professional tone
- Example: "Compartilhe os arquivos com segurança"

### Italian (it)
- Uses formal "Lei" form for respectful communication
- Standard Italian terminology
- Professional and friendly tone
- Example: "Condivida i file in modo sicuro"

## useI18n Hook API

### Methods

#### `t(key: string, params?: Record<string, string | number>): string`
Get translated string for a key with optional interpolation.

```tsx
// Simple translation
t('common.ok') // "OK"

// With interpolation
t('transfer.speed', { speed: '5.2 MB' }) // "5.2 MB/s"
```

#### `setLanguage(language: LanguageCode): void`
Change the active language and update localStorage.

```tsx
setLanguage('fr') // Switch to French
```

#### `setHtmlAttributes(): void`
Update HTML lang attribute and text direction for accessibility.

### Properties

- `language: LanguageCode` - Current active language
- `translations: object` - Complete translations for current language
- `availableLanguages: object` - Configuration for all supported languages

## Core Functions

### `getTranslations(language: LanguageCode | string)`
Get translations for a specific language.

```tsx
const french = getTranslations('fr');
const title = french.hero.title;
```

### `getEffectiveLanguage(): LanguageCode`
Get the user's preferred language based on:
1. Stored preference (localStorage)
2. Browser detection
3. Default (English)

```tsx
const userLanguage = getEffectiveLanguage();
```

### `detectLanguage(): LanguageCode`
Detect language from browser settings.

```tsx
const browserLang = detectLanguage();
```

### `isValidLanguage(language: string): boolean`
Validate if a language code is supported.

```tsx
if (isValidLanguage('es')) {
  // Spanish is supported
}
```

### `getAvailableLanguages()`
Get array of all available language configurations.

```tsx
const languages = getAvailableLanguages();
languages.forEach(lang => {
  console.log(lang.name, lang.nativeName);
});
```

## Language Picker Component Example

```tsx
'use client';

import { useI18n } from '@/lib/i18n';

export function LanguagePicker() {
  const { language, setLanguage, availableLanguages } = useI18n();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as any)}
    >
      {Object.values(availableLanguages).map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
```

## String Interpolation

Parameters are interpolated using `{{paramName}}` syntax:

```tsx
const message = translations.transfer.speed;
// "{{speed}}/s"

t('transfer.speed', { speed: '5.2 MB' });
// "5.2 MB/s"
```

## Storage

User language preference is stored in `localStorage` under the key `tallow-language`.

```tsx
// Automatically managed by useI18n hook
// But you can also access directly:
import { getStoredLanguage, setStoredLanguage } from '@/lib/i18n';

const stored = getStoredLanguage(); // Get stored preference
setStoredLanguage('fr'); // Store preference
```

## Browser Language Detection

The system automatically detects the user's browser language:

```tsx
// If browser language is French, app starts in French
// If not supported, falls back to English
const effective = getEffectiveLanguage();
```

## Adding New Languages

To add a new language:

1. Create `lib/i18n/locales/[code].ts` with all translation keys
2. Import in `lib/i18n/i18n.ts`
3. Add language config to `LANGUAGES` constant
4. Export in `lib/i18n/index.ts`

Example:

```tsx
// lib/i18n/locales/es.ts
export default {
  common: {
    appName: 'Tallow',
    // ... rest of translations
  },
  // ... other categories
};

// lib/i18n/i18n.ts
import es from './locales/es';

export const LANGUAGES = {
  // ... existing languages
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
  },
};

export const messages = {
  // ... existing languages
  es,
};
```

## Type Safety

All translations are type-safe through TypeScript:

```tsx
const { t } = useI18n();

// TypeScript knows the valid keys
t('common.ok') // ✓ Valid
t('invalid.key') // ✗ Type error (with strict mode)
```

## Accessibility

The system automatically:
- Sets HTML `lang` attribute for screen readers
- Sets HTML `dir` attribute for RTL languages
- Updates on language change
- Supports ARIA announcements

```tsx
// Automatically handled by useI18n
const { setHtmlAttributes } = useI18n();
// document.documentElement.lang is updated
// document.documentElement.dir is updated
```

## Performance Considerations

- Translation objects are static and tree-shaked by bundlers
- No runtime parsing or file loading
- Minimal bundle size impact (< 50KB for all languages)
- localStorage caching reduces browser detection on repeat visits

## Testing Translations

```tsx
import { render, screen } from '@testing-library/react';
import { useI18n } from '@/lib/i18n';

function TestComponent() {
  const { t, setLanguage } = useI18n();
  return (
    <div>
      <p>{t('common.ok')}</p>
      <button onClick={() => setLanguage('fr')}>
        Change to French
      </button>
    </div>
  );
}

test('renders in different languages', () => {
  render(<TestComponent />);
  expect(screen.getByText('OK')).toBeInTheDocument();
});
```

## Files

```
lib/i18n/
├── index.ts              # Main exports
├── i18n.ts              # Core i18n functions and config
├── useI18n.ts           # React hook for translations
├── README.md            # This file
└── locales/
    ├── en.ts            # English translations
    ├── fr.ts            # French translations (formal "vous")
    ├── de.ts            # German translations (formal "Sie")
    ├── pt.ts            # Portuguese (Brazilian) translations
    └── it.ts            # Italian translations (formal "Lei")
```

## Related Documentation

- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization-routing)
- [React i18n Best Practices](https://react.dev)
- [Web Accessibility - Language](https://www.w3.org/WAI/test-evaluate/preliminary/#language)
