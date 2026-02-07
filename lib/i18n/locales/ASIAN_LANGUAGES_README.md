# Asian Language Translations for Tallow

This document covers the four Asian language translation files added to the Tallow project: Simplified Chinese, Traditional Chinese, Japanese, and Korean.

## Files Created

### 1. Simplified Chinese (zh-CN) — `zh-CN.ts`

**Standard:** Mainland China conventions
**Character Set:** Simplified Han characters (简体汉字)
**Region:** Mainland China, Singapore
**Target Audience:** Mandarin speakers in mainland China

**Key Features:**
- Uses simplified characters for modern readability
- Follows Mainland China writing conventions
- Uses "您" for formal "you" and standard terminology
- Regional terms match Mainland usage patterns (e.g., "云端" for cloud, "文件" for files)

**Example Translations:**
- `appName`: "Tallow" (kept as-is)
- `tagline`: "安全的对等文件传输" (Secure peer-to-peer file transfer)
- `hero.title`: "快速、安全的文件传输" (Fast and secure file transfer)

---

### 2. Traditional Chinese (zh-TW) — `zh-TW.ts`

**Standard:** Taiwan conventions
**Character Set:** Traditional Han characters (繁體汉字)
**Region:** Taiwan, Hong Kong, Macau
**Target Audience:** Mandarin speakers in Taiwan and traditional Chinese-speaking regions

**Key Features:**
- Uses traditional characters for cultural authenticity
- Follows Taiwan writing conventions and terminology
- Regional terms match Taiwan usage patterns (e.g., "雲端" for cloud, "裝置" for devices)
- Uses formal polite forms

**Example Translations:**
- `appName`: "Tallow"
- `tagline`: "安全的對等檔案傳輸" (Traditional characters)
- `hero.title`: "快速、安全的檔案傳輸"
- `settings.deviceName`: "裝置名稱" (Device name, Taiwan style)

**Note:** Main differences from zh-CN:
- Traditional vs. Simplified characters
- Terminology differences (e.g., 文件 → 檔案, 云端 → 雲端, 设备 → 裝置)
- Regional spelling conventions

---

### 3. Japanese (ja) — `ja.ts`

**Standard:** Modern Japanese with formal politeness
**Character Set:** Mixed hiragana (ひらがな), katakana (カタクナ), and kanji (漢字)
**Region:** Japan
**Target Audience:** Native Japanese speakers

**Key Features:**
- Uses natural mix of kanji, hiragana, and katakana
- Polite formal style (です/ます form) throughout
- Foreign terms rendered in katakana for clarity
- Natural rhythm and phrasing for Japanese audience

**Example Translations:**
- `appName`: "Tallow" (kept in katakana where needed)
- `tagline`: "安全なピアツーピアファイル転送" (Safe peer-to-peer file transfer)
- `hero.title`: "高速で安全なファイル転送"
- `loading`: "読み込み中" (Loading)
- `chat.typingIndicator`: "入力中..." (Typing)

**Grammar Notes:**
- All verbs use polite -ます form
- Respectful titles and terms
- Common technical terms rendered in standard katakana

---

### 4. Korean (ko) — `ko.ts`

**Standard:** Modern Korean with formal politeness
**Character Set:** Hangul (한글) exclusively
**Region:** South Korea
**Target Audience:** Native Korean speakers

**Key Features:**
- Uses Hangul exclusively (100% pure Hangul, no hanja)
- Formal polite style (합니다체) for user-facing content
- Natural Korean phrasing and idioms
- Clear, accessible language for all users

**Example Translations:**
- `appName`: "Tallow"
- `tagline`: "안전한 피어투피어 파일 전송" (Safe peer-to-peer file transfer)
- `hero.title`: "빠르고 안전한 파일 전송"
- `loading`: "로딩 중"
- `friends.addFriend`: "친구 추가" (Add friend)

**Grammar Notes:**
- All verbs use formal -ます style (습니다/ㅂ니다)
- Respectful and accessible tone
- Modern, contemporary Korean usage

---

## Translation Categories

All four files include the following standard categories with consistent keys:

### common
Basic UI labels and buttons used throughout the application.
```
appName, tagline, loading, cancel, confirm, save, delete, close, back, next,
search, noResults, retry, ok, yes, no, error, success, warning, info
```

### nav
Navigation menu items and page links.
```
home, features, security, pricing, docs, about, transfer, settings
```

### hero
Landing page hero section and main call-to-action.
```
title, subtitle, cta, secondaryCta
```

### features
Feature descriptions for the application.
```
localSharing, internetSharing, friendsSharing, encryption, speed, privacy,
noLimits, crossPlatform
```

### transfer
File transfer interface and status messages.
```
dropFiles, scanning, noDevices, sendTo, receiving, complete, failed, speed,
cancel, pause, resume, retry, queue, history, clearHistory
```

### security
Security features and highlights.
```
e2e, pqc, zeroKnowledge, noServer, openSource, auditLog
```

### pricing
Pricing and plan information.
```
free, pro, business, perMonth, getStarted, features, popular
```

### settings
User preferences and configuration options.
```
theme, language, deviceName, privacy, notifications, connection, about,
dark, light, highContrast, colorblind
```

### chat
Messaging and communication labels.
```
typingIndicator, messagePlaceholder, send, encrypted, delivered, read
```

### friends
Contact and friend management.
```
addFriend, pairingCode, online, offline, lastSeen, removeFriend, block
```

### notifications
System and user notification messages.
```
transferComplete, newDevice, friendRequest, error, connectionLost
```

### errors
Error messages and failure states.
```
connectionFailed, timeout, cryptoError, noCamera, noPermission,
fileTooBig, unsupported
```

### a11y
Accessibility labels and screen reader announcements.
```
skipToContent, openMenu, closeMenu, darkMode, lightMode, loading, progress
```

---

## Usage in Code

These translation files are integrated with the existing i18n system. Usage pattern:

```typescript
import { locales } from '@/lib/i18n/locales';

// Get translation
const zhCNLocale = locales['zh-CN'];
const appName = zhCNLocale.common.appName; // "Tallow"

// With React hook
const { t } = useI18n();
const title = t('hero.title'); // Automatically uses selected locale
```

---

## Cultural and Linguistic Considerations

### Simplified Chinese (zh-CN)
- Mainstream in Mainland China with 900+ million speakers
- Growing technical market in Asia's largest economy
- Modern, streamlined character set
- Uses contemporary mainland terminology

### Traditional Chinese (zh-TW)
- Important for Taiwan market (23+ million speakers)
- Hong Kong and Macau regions (cultural and technical hubs)
- Preserves cultural heritage through character complexity
- Different vocabulary reflects regional differences

### Japanese (ja)
- 125+ million native speakers in Japan
- Advanced tech market with high digital adoption
- Polite formal Japanese expected in user-facing software
- Mix of scripts requires careful attention to readability

### Korean (ko)
- 80+ million native speakers in South Korea
- Fastest internet speeds in the world, high tech adoption
- Hangul (한글) is uniquely designed for clarity and accessibility
- Formal politeness is cultural expectation in interfaces

---

## Quality Assurance Notes

### Testing the Translations

1. **Character Display**: Verify all characters display correctly
   - Simplified Chinese: 文件, 设备, 云端
   - Traditional Chinese: 檔案, 裝置, 雲端
   - Japanese: ファイル, デバイス, クラウド
   - Korean: 파일, 기기, 클라우드

2. **Length Variations**: These languages have different text lengths
   - Japanese/Korean may be shorter than English
   - Chinese may vary depending on word choice
   - Ensure UI layouts accommodate text variations

3. **RTL/LTR**: All four languages use left-to-right (LTR) text direction
   - No special RTL handling needed (unlike Arabic/Hebrew)

4. **Font Requirements**: Ensure proper fonts support:
   - CJK (Chinese, Japanese, Korean) Unicode ranges
   - Recommended: Noto Sans CJK or system fonts

---

## Integration Checklist

- [x] zh-CN.ts created with all required keys
- [x] zh-TW.ts created with all required keys
- [x] ja.ts created with all required keys
- [x] ko.ts created with all required keys
- [x] Updated locales/index.ts to include Asian languages
- [x] All files use TypeScript const assertions (`as const`)
- [x] Consistent category structure across all files
- [x] Natural, context-appropriate translations

---

## Future Enhancements

1. **Extended Categories**: As the app grows, additional categories may include:
   - `time`: Relative time formatting (e.g., "2 hours ago")
   - `fileSize`: File size units (B, KB, MB, GB, TB)
   - `speed`: Transfer speed units (KB/s, MB/s)

2. **Regional Variants**: Consider future splits:
   - zh-HK (Hong Kong Cantonese area, currently uses zh-TW)
   - ja-JP (already single variant)
   - ko-KR (already single variant)

3. **Pluralization Rules**: Implement plural forms for languages with complex rules

---

## File Statistics

| Language | File | Lines | Keys | Status |
|----------|------|-------|------|--------|
| Simplified Chinese | zh-CN.ts | ~135 | 77 | Complete |
| Traditional Chinese | zh-TW.ts | ~135 | 77 | Complete |
| Japanese | ja.ts | ~135 | 77 | Complete |
| Korean | ko.ts | ~135 | 77 | Complete |

---

## Support and Maintenance

For issues or improvements to Asian language translations:

1. Report character rendering issues
2. Suggest cultural or linguistic improvements
3. Recommend terminology updates
4. Request additional language support

---

## References and Resources

- **Simplified Chinese**: https://en.wikipedia.org/wiki/Simplified_Chinese_characters
- **Traditional Chinese**: https://en.wikipedia.org/wiki/Traditional_Chinese_characters
- **Japanese Writing System**: https://en.wikipedia.org/wiki/Japanese_writing_system
- **Korean Hangul**: https://en.wikipedia.org/wiki/Hangul
- **CLDR (Common Locale Data Repository)**: https://cldr.unicode.org/

---

*Last Updated: 2026-02-06*
*Tallow Project Version: Latest*
