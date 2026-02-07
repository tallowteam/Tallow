# Translation Files Quick Reference

Fast lookup for developers using Tallow translations.

## All Supported Languages (22)

| Code | Language | Native Name | Script | Dir | Region |
|------|----------|-------------|--------|-----|--------|
| en | English | English | Latin | LTR | US/Global |
| sv | Swedish | Svenska | Latin | LTR | Sweden |
| no | Norwegian | Norsk | Latin | LTR | Norway |
| da | Danish | Dansk | Latin | LTR | Denmark |
| fi | Finnish | Suomi | Latin | LTR | Finland |
| th | Thai | ไทย | Thai | LTR | Thailand |
| es | Spanish | Español | Latin | LTR | Spain |
| fr | French | Français | Latin | LTR | France |
| de | German | Deutsch | Latin | LTR | Germany |
| pt | Portuguese | Português | Latin | LTR | Portugal |
| it | Italian | Italiano | Latin | LTR | Italy |
| nl | Dutch | Nederlands | Latin | LTR | Netherlands |
| ru | Russian | Русский | Cyrillic | LTR | Russia |
| tr | Turkish | Türkçe | Latin | LTR | Turkey |
| pl | Polish | Polski | Latin | LTR | Poland |
| ar | Arabic | العربية | Arabic | RTL | Middle East |
| he | Hebrew | עברית | Hebrew | RTL | Israel |
| hi | Hindi | हिन्दी | Devanagari | LTR | India |
| ja | Japanese | 日本語 | Japanese (Kanji+Hiragana+Katakana) | LTR | Japan |
| ko | Korean | 한국어 | Hangul | LTR | South Korea |
| zh-CN | Chinese (Simplified) | 简体中文 | Han (Simplified) | LTR | Mainland China |
| zh-TW | Chinese (Traditional) | 繁體中文 | Han (Traditional) | LTR | Taiwan |

## Common Translation Keys

### All Categories at a Glance

```
common     → appName, tagline, loading, cancel, confirm, save, delete, close,
             back, next, search, noResults, retry, ok, yes, no, error, success,
             warning, info

nav        → home, features, security, pricing, docs, about, transfer, settings

hero       → title, subtitle, cta, secondaryCta

features   → localSharing, internetSharing, friendsSharing, encryption, speed,
             privacy, noLimits, crossPlatform

transfer   → dropFiles, scanning, noDevices, sendTo, receiving, complete, failed,
             speed, cancel, pause, resume, retry, queue, history, clearHistory

security   → e2e, pqc, zeroKnowledge, noServer, openSource, auditLog

pricing    → free, pro, business, perMonth, getStarted, features, popular

settings   → theme, language, deviceName, privacy, notifications, connection,
             about, dark, light, highContrast, colorblind

chat       → typingIndicator, messagePlaceholder, send, encrypted, delivered, read

friends    → addFriend, pairingCode, online, offline, lastSeen, removeFriend, block

notifications → transferComplete, newDevice, friendRequest, error, connectionLost

errors     → connectionFailed, timeout, cryptoError, noCamera, noPermission,
             fileTooBig, unsupported

a11y       → skipToContent, openMenu, closeMenu, darkMode, lightMode, loading,
             progress
```

## Usage Examples

### React Hook Usage
```typescript
import { useI18n } from '@/lib/i18n/useI18n';

function MyComponent() {
  const { t } = useI18n();
  return <h1>{t('hero.title')}</h1>;
}
```

### Direct Access
```typescript
import { locales } from '@/lib/i18n/locales';

const text = locales.sv.hero.title;
const thaiText = locales.th.common.appName;
const norwegianError = locales.no.errors.connectionFailed;
```

### Helper Functions
```typescript
import { getTranslation, getTranslationKey } from '@/lib/i18n/locales';

// Get full locale object
const finnish = getTranslation('fi');

// Get specific key with fallback
const text = getTranslationKey('da', 'transfer.complete', 'Done');
```

## New Language Specifics

### Swedish (sv)
- Informal "du" register
- Includes: ä, ö, å
- Example: "Börja nu" (Start now)

### Norwegian Bokmål (no)
- Informal "du" register
- Includes: ø, æ, å
- Example: "Kom i gang" (Get started)

### Danish (da)
- Informal "du" register
- Includes: ø, æ, å
- Example: "Drop filer her" (Drop files here)

### Finnish (fi)
- 15 grammatical cases
- Complex morphology
- Includes: ä, ö
- Example: "Turvallinen P2P-tiedostojen siirto"

### Thai (th)
- Thai script only (ไทย)
- Polite register
- Tone marks and diacritics
- Example: "เริ่มต้นเลย" (Let's start)

## Popular Translations

### Start/Begin
| Language | Text |
|----------|------|
| English | Get Started |
| Swedish | Börja nu |
| Norwegian | Kom i gang |
| Danish | Kom i gang |
| Finnish | Aloita nyt |
| Thai | เริ่มต้นเลย |

### File Transfer
| Language | Transfer Complete |
|----------|-------------------|
| English | Transfer complete |
| Swedish | Överföring slutförd |
| Norwegian | Overføring fullført |
| Danish | Overførsel fuldført |
| Finnish | Siirto valmis |
| Thai | การถ่ายโอนเสร็จสิ้น |

### Security
| Language | End-to-End Encrypted |
|----------|----------------------|
| English | End-to-End Encrypted |
| Swedish | End-to-end-krypterad |
| Norwegian | End-to-end-kryptert |
| Danish | End-to-end-krypteret |
| Finnish | Pään päähän salattu |
| Thai | เข้ารหัสแบบปลายต่อปลาย |

## File Locations

```
lib/i18n/
├── locales/
│   ├── sv.ts                    ← Swedish
│   ├── no.ts                    ← Norwegian
│   ├── da.ts                    ← Danish
│   ├── fi.ts                    ← Finnish
│   ├── th.ts                    ← Thai
│   ├── en.ts                    (English)
│   ├── es.ts, fr.ts, de.ts      (Other languages)
│   ├── index.ts                 ← Central export
│   ├── TRANSLATIONS_GUIDE.md    ← Full documentation
│   └── QUICK_REFERENCE.md       (This file)
├── types.ts
├── useI18n.ts
└── ...
```

## Common Issues & Solutions

### Issue: Missing Key
**Problem**: "undefined" appears in UI
**Solution**: Check `t('category.key')` matches keys in translation file

### Issue: Wrong Language
**Problem**: English shows instead of target language
**Solution**: Verify locale code in `useI18n()` hook (use 'sv', not 'Swedish')

### Issue: Thai Not Displaying
**Problem**: Thai characters show as boxes
**Solution**: Ensure font supports Thai (Noto Sans Thai, etc.)

### Issue: Characters Wrong
**Problem**: Special characters mangled (å, ä, ö, etc.)
**Solution**: Verify UTF-8 encoding in files

## Performance Notes

- Tree-shakeable: Only used translations are bundled
- Small overhead: ~33.5 KB for all 5 new translations
- Lazy-loadable: Can dynamically load less common languages
- Cached: Translation objects are memoized in React

## Testing

### Verify Translation Structure
```bash
# Check all required keys exist
grep -o "[a-z]*:" lib/i18n/locales/sv.ts | sort -u

# Count keys by category
grep "^  [a-z]*: {" lib/i18n/locales/sv.ts | wc -l

# Validate syntax
npx tsc lib/i18n/locales/sv.ts --noEmit
```

### Test in Browser
1. Open browser console
2. `import { locales } from '@/lib/i18n/locales'`
3. `locales.sv.hero.title` (should show Swedish text)
4. `locales.th.common.appName` (should show Thai: "Tallow")

## Contributing Translations

1. Create new file: `lib/i18n/locales/[code].ts`
2. Copy structure from existing file
3. Translate all 109 keys
4. Update `index.ts` exports
5. Add to `LOCALE_METADATA`
6. Test thoroughly
7. Submit for review

## Resources

- Full Guide: `TRANSLATIONS_GUIDE.md`
- Types: `lib/i18n/types.ts`
- Hook: `lib/i18n/useI18n.ts`
- Summary: `TRANSLATION_FILES_SUMMARY.md` (project root)

## At a Glance: New Languages

| Feature | Swedish | Norwegian | Danish | Finnish | Thai |
|---------|---------|-----------|--------|---------|------|
| Keys | 109 | 109 | 109 | 109 | 109 |
| Size | 6.2 KB | 6.4 KB | 6.3 KB | 6.5 KB | 8.1 KB |
| Complex Grammar | No | No | No | Yes (15 cases) | No |
| Special Chars | ä,ö,å | ø,æ,å | ø,æ,å | ä,ö | Thai script |
| Register | Informal | Informal | Informal | Formal | Polite |
| Script | Latin | Latin | Latin | Latin | Thai |
| Dir | LTR | LTR | LTR | LTR | LTR |
| Status | ✓ | ✓ | ✓ | ✓ | ✓ |

---

**Last Updated**: 2026-02-06
**Total Languages**: 22
**New Languages**: 5
**Status**: Production Ready
