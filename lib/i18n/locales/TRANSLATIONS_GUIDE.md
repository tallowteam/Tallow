# Translation Files Guide

Complete internationalization (i18n) support for Tallow with 22 languages, including newly added Nordic and Thai translations.

## Overview

This directory contains translation files for all supported languages in the Tallow application. Each file exports a default object with consistent categories and keys for seamless integration across the UI.

## Supported Languages

### New Translations (Added)
- **Swedish** (`sv.ts`) - Informal register using "du"
- **Norwegian Bokmål** (`no.ts`) - Norwegian variant with informal register
- **Danish** (`da.ts`) - Informal register using "du"
- **Finnish** (`fi.ts`) - Proper Finnish with 15 grammatical cases
- **Thai** (`th.ts`) - Thai script with polite register

### Existing Translations
- English (`en.ts`)
- Spanish (`es.ts`)
- French (`fr.ts`)
- German (`de.ts`)
- Portuguese (`pt.ts`)
- Italian (`it.ts`)
- Dutch (`nl.ts`)
- Russian (`ru.ts`)
- Arabic (`ar.ts`)
- Hebrew (`he.ts`)
- Hindi (`hi.ts`)
- Chinese Simplified (`zh-CN.ts`)
- Chinese Traditional (`zh-TW.ts`)
- Japanese (`ja.ts`)
- Korean (`ko.ts`)
- Turkish (`tr.ts`)
- Polish (`pl.ts`)

## Translation Structure

Each translation file follows the same structure with 13 main categories:

```typescript
export default {
  common: { ... },      // Basic UI labels and buttons
  nav: { ... },         // Navigation menu items
  hero: { ... },        // Landing page hero section
  features: { ... },    // Feature descriptions
  transfer: { ... },    // File transfer UI messages
  security: { ... },    // Security-related content
  pricing: { ... },     // Pricing plans and billing
  settings: { ... },    // User preferences and configuration
  chat: { ... },        // Messaging and communication
  friends: { ... },     // Contacts and friend management
  notifications: { ... }, // System and user notifications
  errors: { ... },      // Error messages
  a11y: { ... },        // Accessibility labels
}
```

## Categories and Keys

### common (18 keys)
Basic UI elements and general application text:
- `appName` - Application name
- `tagline` - Short application description
- `loading` - Loading indicator text
- `cancel` - Cancel button
- `confirm` - Confirm button
- `save` - Save button
- `delete` - Delete button
- `close` - Close button
- `back` - Back button
- `next` - Next button
- `search` - Search text
- `noResults` - No results found message
- `retry` - Retry action
- `ok` - OK confirmation
- `yes` - Yes response
- `no` - No response
- `error` - Error label
- `success` - Success message
- `warning` - Warning label
- `info` - Information label

### nav (8 keys)
Navigation and menu items:
- `home` - Home page
- `features` - Features page
- `security` - Security page
- `pricing` - Pricing page
- `docs` - Documentation
- `about` - About page
- `transfer` - Transfer section
- `settings` - Settings page

### hero (4 keys)
Landing page hero section:
- `title` - Main headline
- `subtitle` - Subheading text
- `cta` - Primary call-to-action button
- `secondaryCta` - Secondary action button

### features (8 keys)
Feature descriptions and highlights:
- `localSharing` - Local network file sharing
- `internetSharing` - Internet-based file sharing
- `friendsSharing` - Sharing with trusted friends
- `encryption` - End-to-end encryption
- `speed` - Speed capability
- `privacy` - Privacy features
- `noLimits` - No file size limits
- `crossPlatform` - Cross-platform compatibility

### transfer (14 keys)
File transfer interface and messages:
- `dropFiles` - Drag and drop prompt
- `scanning` - Device discovery in progress
- `noDevices` - No devices found message
- `sendTo` - Send to recipient
- `receiving` - Receiving files
- `complete` - Transfer completed
- `failed` - Transfer failed
- `speed` - Current transfer speed
- `cancel` - Cancel transfer
- `pause` - Pause transfer
- `resume` - Resume transfer
- `retry` - Retry transfer
- `queue` - Transfer queue
- `history` - Transfer history
- `clearHistory` - Clear history action

### security (6 keys)
Security-related information:
- `e2e` - End-to-end encryption
- `pqc` - Post-quantum cryptography
- `zeroKnowledge` - Zero-knowledge proofs
- `noServer` - No server monitoring
- `openSource` - Open source project
- `auditLog` - Audit logging

### pricing (7 keys)
Pricing and subscription plans:
- `free` - Free plan
- `pro` - Professional plan
- `business` - Business plan
- `perMonth` - Per month billing
- `getStarted` - Get started button
- `features` - Plan features
- `popular` - Mark as popular

### settings (12 keys)
User preferences and configuration:
- `theme` - Theme selection
- `language` - Language selection
- `deviceName` - Device name
- `privacy` - Privacy settings
- `notifications` - Notification settings
- `connection` - Connection settings
- `about` - About section
- `dark` - Dark theme
- `light` - Light theme
- `highContrast` - High contrast theme
- `colorblind` - Colorblind-friendly theme

### chat (6 keys)
Messaging and communication:
- `typingIndicator` - User is typing
- `messagePlaceholder` - Input placeholder text
- `send` - Send message
- `encrypted` - Encrypted indicator
- `delivered` - Message delivered status
- `read` - Message read status

### friends (7 keys)
Contact and friend management:
- `addFriend` - Add friend action
- `pairingCode` - Device pairing code
- `online` - Friend is online
- `offline` - Friend is offline
- `lastSeen` - Last seen timestamp
- `removeFriend` - Remove friend action
- `block` - Block friend action

### notifications (5 keys)
System and user notifications:
- `transferComplete` - Transfer finished notification
- `newDevice` - New device connected
- `friendRequest` - Friend request received
- `error` - Error notification
- `connectionLost` - Connection lost notification

### errors (7 keys)
Error messages and descriptions:
- `connectionFailed` - Connection failure
- `timeout` - Operation timeout
- `cryptoError` - Cryptographic operation error
- `noCamera` - Camera not available
- `noPermission` - Permission denied
- `fileTooBig` - File size exceeds limit
- `unsupported` - Unsupported feature

### a11y (7 keys)
Accessibility labels and announcements:
- `skipToContent` - Skip to main content link
- `openMenu` - Open navigation menu
- `closeMenu` - Close navigation menu
- `darkMode` - Dark mode toggle label
- `lightMode` - Light mode toggle label
- `loading` - Loading announcement
- `progress` - Progress indicator label

## Language-Specific Features

### Swedish (sv.ts)
- Informal register using "du" (singular you)
- Consistent with Swedish UI conventions
- Examples:
  - "Börja nu" (Start now)
  - "Skicka till" (Send to)

### Norwegian Bokmål (no.ts)
- Norwegian Bokmål variety (most common in Norway)
- Informal register
- Examples:
  - "Kom i gang" (Get started)
  - "Sikker end-to-end filoverføring" (Secure end-to-end file transfer)

### Danish (da.ts)
- Informal register using "du"
- Danish spelling conventions
- Examples:
  - "Kom i gang" (Get started)
  - "Drop filer her" (Drop files here)

### Finnish (fi.ts)
- Proper Finnish with grammatically correct case endings
- Employs Finnish 15 grammatical cases appropriately:
  - Nominative: "tiedosto" (file)
  - Genitive: "tiedoston" (file's)
  - Partitive: "tiedostoa" (some file)
  - Inessive: "tiedostossa" (in file)
  - Elative: "tiedostosta" (from file)
  - Illative: "tiedostoon" (into file)
  - Adessive: "tiedostolla" (on file)
  - Ablative: "tiedostolta" (from on file)
  - Allative: "tiedostolle" (to file)
  - Essive: "tiedostona" (as file)
  - Translative: "tiedostoksi" (to become file)
  - And more...
- Examples:
  - "Turvallinen P2P-tiedostojen siirto" (Secure P2P file transfer)
  - "Aloita nyt" (Start now)

### Thai (th.ts)
- Thai script (Thai characters: ไทย)
- Polite register with contextual use of ครับ (khrap - male polite particle) and ค่ะ (kha - female polite particle)
- Standard Thai tone marks and diacritics
- Examples:
  - "เริ่มต้นเลย" (Let's get started)
  - "การถ่ายโอนไฟล์ที่ปลอดภัย" (Secure file transfer)
  - "ความปลอดภัย" (Security)

## Usage in Components

### TypeScript/React Component
```typescript
import { useI18n } from '@/lib/i18n/useI18n';

export function MyComponent() {
  const { t } = useI18n();

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <button>{t('hero.cta')}</button>
    </div>
  );
}
```

### Accessing the index.ts
```typescript
import { locales, getTranslation, getTranslationKey } from '@/lib/i18n/locales';

// Get a full locale translation object
const swedish = locales.sv;

// Using the helper function
const germanTitle = getTranslationKey('de', 'hero.title');

// With fallback
const thaiText = getTranslationKey('th', 'common.loading', 'Loading...');
```

## Adding New Keys

To add new translation keys:

1. Update the structure in all locale files
2. Add the new key to each language file in the appropriate category
3. Update type definitions in `lib/i18n/types.ts` if using strict typing
4. Test translations across all languages

Example for new key "common.help":
```typescript
// In each locale file
common: {
  // ... existing keys
  help: '[Translated help text in each language]',
}
```

## Quality Assurance

### Verification Checklist
- [ ] All 13 categories present in each file
- [ ] All required keys present in each category
- [ ] No missing translations (no empty strings)
- [ ] Consistent terminology across languages
- [ ] Proper grammar and spelling for each language
- [ ] Special characters and diacritics correct
- [ ] Line breaks and formatting preserved
- [ ] Technical terms handled appropriately

### Language-Specific QA

**Swedish/Norwegian/Danish:**
- Proper use of informal "du" forms
- Consistent compound word usage
- Correct special characters (å, ä, ö / ø, æ)

**Finnish:**
- Correct case endings for context
- No invalid case combinations
- Proper vowel harmony
- Correct use of special characters (ä, ö)

**Thai:**
- Correct Thai script (no Latin romanization in UI)
- Proper tone marks
- Contextually appropriate politeness levels
- No mixed scripts (keep Thai separate from English labels when appropriate)

## File Sizes

- Swedish (sv.ts): ~6.2 KB
- Norwegian (no.ts): ~6.4 KB
- Danish (da.ts): ~6.3 KB
- Finnish (fi.ts): ~6.5 KB
- Thai (th.ts): ~8.1 KB (includes Thai Unicode characters)

## Integration Points

Translation files are used throughout the Tallow application:

1. **Navigation** - Menu items and links
2. **Hero Section** - Landing page headlines
3. **Feature Cards** - Feature descriptions
4. **Transfer UI** - File transfer messages
5. **Settings** - User preferences labels
6. **Chat** - Messaging interface
7. **Accessibility** - ARIA labels and announcements
8. **Errors** - Error messages and recovery text
9. **Notifications** - System notifications

## Maintenance

### Regular Updates
- Review translations when new features are added
- Verify accuracy with native speakers periodically
- Update UI text in parallel with translation files
- Test RTL layouts if adding new RTL languages

### Contributing Translations
When adding new languages:

1. Create new file: `lib/i18n/locales/[code].ts`
2. Follow the template structure exactly
3. Use same keys as other languages
4. Add to index.ts exports
5. Update lib/i18n/types.ts locale definitions
6. Test in application UI

## Related Files

- `lib/i18n/types.ts` - Type definitions for locales
- `lib/i18n/locales/index.ts` - Central export point
- `lib/i18n/useI18n.ts` - React hook for translations
- `lib/i18n/use-translation.ts` - Alternative translation hook
- `lib/i18n/locale-formatting.ts` - Locale-specific formatting
- `lib/i18n/rtl-support.ts` - RTL language support

## Testing

To test translations:

```bash
# List all locales
grep "export const LOCALE_CODES" lib/i18n/locales/index.ts

# Check for missing keys
grep -o "[a-z]*:" lib/i18n/locales/en.ts | sort | uniq

# Verify all files have same structure
for file in lib/i18n/locales/*.ts; do
  echo "=== $(basename $file) ==="
  grep -c "appName" "$file"
done
```

## Performance Considerations

- Translation files are tree-shakeable
- Only loaded translations are bundled
- Use dynamic imports for code splitting
- Consider lazy-loading less common languages

## Future Enhancements

- [ ] Add pluralization support for all languages
- [ ] Context-aware translations (formal/informal)
- [ ] Date and time formatting per locale
- [ ] Number and currency formatting
- [ ] RTL support enhancements
- [ ] Community translation contributions
- [ ] Translation management dashboard
- [ ] Automatic translation updates

---

Last Updated: 2026-02-06
Translation Manager Version: 1.0
Total Languages: 22
Status: Production Ready
