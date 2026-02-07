# i18n Quick Reference Guide

## Basic Usage

### In React Components (Client)
```tsx
'use client';
import { useI18n } from '@/lib/i18n';

export function MyComponent() {
  const { t, language, setLanguage } = useI18n();

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <button onClick={() => setLanguage('fr')}>Français</button>
    </div>
  );
}
```

### In Server Components
```tsx
import { getServerTranslation } from '@/lib/i18n';

export function MyServerComponent({
  language = 'en',
}: {
  language?: string;
}) {
  const { translations } = getServerTranslation(language);
  return <h1>{translations.hero.title}</h1>;
}
```

## Language Picker
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

## Translation Keys

### Common Keys
```
common.appName        // "Tallow"
common.loading        // "Loading"
common.cancel         // "Cancel"
common.confirm        // "Confirm"
common.ok             // "OK"
common.error          // "Error"
common.success        // "Success"
```

### Navigation Keys
```
nav.home              // "Home"
nav.features          // "Features"
nav.security          // "Security"
nav.pricing           // "Pricing"
nav.docs              // "Documentation"
nav.settings          // "Settings"
```

### Hero Section
```
hero.title            // "Share files securely, anywhere"
hero.subtitle         // "End-to-end encrypted..."
hero.cta              // "Start Sharing"
hero.secondaryCta     // "View Security"
```

### Features
```
features.localSharing      // "Local Sharing"
features.internetSharing   // "Internet Sharing"
features.encryption        // "Encryption"
features.speed             // "Speed"
features.privacy           // "Privacy"
features.crossPlatform     // "Cross Platform"
```

### Transfer
```
transfer.dropFiles         // "Drop files to share"
transfer.scanning          // "Scanning for devices"
transfer.noDevices         // "No devices found"
transfer.complete          // "Transfer complete"
transfer.failed            // "Transfer failed"
transfer.cancel            // "Cancel Transfer"
transfer.history           // "Transfer History"
```

### Security
```
security.e2e               // "End-to-End Encryption"
security.pqc               // "Post-Quantum Cryptography"
security.zeroKnowledge     // "Zero-Knowledge"
security.openSource        // "Open Source"
```

### Settings
```
settings.theme             // "Theme"
settings.language          // "Language"
settings.deviceName        // "Device Name"
settings.dark              // "Dark"
settings.light             // "Light"
```

### Chat
```
chat.messagePlaceholder    // "Type a message"
chat.send                  // "Send"
chat.encrypted             // "End-to-end encrypted"
chat.delivered             // "Delivered"
chat.read                  // "Read"
```

### Friends
```
friends.addFriend          // "Add Friend"
friends.pairingCode        // "Pairing Code"
friends.online             // "Online"
friends.offline            // "Offline"
friends.removeFriend       // "Remove Friend"
```

### Notifications
```
notifications.transferComplete    // "Transfer complete"
notifications.newDevice           // "New device connected"
notifications.friendRequest        // "Friend request"
notifications.error               // "An error occurred"
notifications.connectionLost       // "Connection lost"
```

### Errors
```
errors.connectionFailed    // "Connection failed"
errors.timeout             // "Request timeout"
errors.cryptoError         // "Encryption error"
errors.noCamera            // "Camera not available"
errors.noPermission        // "Permission denied"
errors.fileTooBig          // "File is too large"
errors.unsupported         // "Feature not supported"
```

### Accessibility
```
a11y.skipToContent         // "Skip to main content"
a11y.openMenu              // "Open menu"
a11y.closeMenu             // "Close menu"
a11y.darkMode              // "Enable dark mode"
a11y.lightMode             // "Enable light mode"
a11y.loading               // "Loading content"
a11y.progress              // "Progress"
```

## String Interpolation

```tsx
// Define in translation file
transfer: {
  speed: '{{speed}}/s'
}

// Use in component
t('transfer.speed', { speed: '5.2 MB' })
// Output: "5.2 MB/s"
```

## Language Codes

| Code | Language | Region |
|------|----------|--------|
| en | English | Universal |
| fr | French | France |
| de | German | Germany |
| pt | Portuguese | Brazil |
| it | Italian | Italy |

## Get Current Language

```tsx
const { language } = useI18n();
console.log(language); // "en", "fr", "de", "pt", or "it"
```

## Get All Available Languages

```tsx
const { availableLanguages } = useI18n();

Object.values(availableLanguages).forEach(lang => {
  console.log(`${lang.code}: ${lang.nativeName}`);
});
// Output:
// en: English
// fr: Français
// de: Deutsch
// pt: Português (Brasil)
// it: Italiano
```

## Detect Browser Language

```tsx
import { detectLanguage, getEffectiveLanguage } from '@/lib/i18n';

const browserLang = detectLanguage();
const effectiveLang = getEffectiveLanguage(); // With fallback
```

## Validate Language

```tsx
import { isValidLanguage } from '@/lib/i18n';

if (isValidLanguage('fr')) {
  // French is supported
}
```

## Storage

Language preference is automatically stored in `localStorage` with key `tallow-language`.

```tsx
// Automatically managed by useI18n hook
const { setLanguage } = useI18n();
setLanguage('fr'); // Also saves to localStorage
```

## Language-Specific Notes

### French (fr)
- Formal "vous" form throughout
- Spaces before punctuation: : ; ! ?
- Gender agreements maintained
- Native speaker: translates to "Vous partagez"

### German (de)
- Formal "Sie" form throughout
- All nouns capitalized
- Compound nouns: Dateiübertragung, Verschlüsselung
- Professional terminology

### Portuguese - Brazilian (pt)
- Informal "você" form for friendliness
- Brazilian spelling (não European)
- More casual tone while professional
- Native speaker: translates to "Você compartilha"

### Italian (it)
- Formal "Lei" form
- Standard Italian terminology
- Professional and courteous
- Native speaker: translates to "Lei condivida"

## Files Location

```
lib/i18n/
├── locales/
│   ├── en.ts  ← English
│   ├── fr.ts  ← French
│   ├── de.ts  ← German
│   ├── pt.ts  ← Portuguese (Brazilian)
│   └── it.ts  ← Italian
├── i18n.ts
├── useI18n.ts
├── index.ts
├── README.md
└── QUICK_REFERENCE.md  ← This file
```

## Common Patterns

### Theme Toggle
```tsx
const { t, setLanguage } = useI18n();
<button>{t('settings.theme')}</button>
```

### Error Display
```tsx
const { t } = useI18n();
throw new Error(t(`errors.${errorType}`));
```

### Loading State
```tsx
const { t } = useI18n();
{isLoading && <p>{t('common.loading')}</p>}
```

### Form Validation
```tsx
const { t } = useI18n();
if (!file) return t('errors.fileNotFound');
if (file.size > maxSize) return t('errors.fileTooBig');
```

## Tips

1. Use dot notation for nested keys: `t('section.subsection.key')`
2. Always use the `t()` function - never hardcode strings
3. Language preference persists via localStorage
4. HTML attributes (lang, dir) update automatically
5. Parameters use `{{key}}` syntax in translation files
6. All supported languages have identical key structures
7. No runtime file loading - all translations are bundled
8. Tree-shaking removes unused language files in production
