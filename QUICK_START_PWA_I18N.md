# Quick Start: PWA & i18n

Quick reference for using PWA features and internationalization in Tallow.

## PWA Quick Start

### Check if PWA is installed

```typescript
import { usePWA } from '@/lib/hooks/use-pwa';

function MyComponent() {
  const { isInstalled, isStandalone } = usePWA();

  if (isInstalled) {
    return <p>Thanks for installing Tallow!</p>;
  }
}
```

### Trigger install prompt

```typescript
const { canInstall, install } = usePWA();

if (canInstall) {
  await install();
}
```

### Show notification

```typescript
import { showNotification, NotificationPresets } from '@/lib/pwa/push-notifications';

await showNotification(NotificationPresets.fileReceived('document.pdf'));
```

### Check online status

```typescript
const { isOnline } = usePWA();

if (!isOnline) {
  showOfflineMessage();
}
```

## i18n Quick Start

### Translate text

```typescript
import { useLanguage } from '@/lib/i18n/language-context';

function MyComponent() {
  const { t } = useLanguage();

  return <h1>{t('home.hero.title')}</h1>;
}
```

### Change language

```typescript
const { setLanguage } = useLanguage();

<button onClick={() => setLanguage('es')}>
  Español
</button>
```

### Check RTL

```typescript
const { isRTL } = useLanguage();

<div dir={isRTL ? 'rtl' : 'ltr'}>
  Content
</div>
```

### Format date

```typescript
import { formatDate } from '@/lib/i18n/locale-formatter';

const { language } = useLanguage();
const formatted = formatDate(new Date(), language);
```

### Format number

```typescript
import { formatNumber } from '@/lib/i18n/locale-formatter';

const { language } = useLanguage();
const formatted = formatNumber(1234.56, language);
```

### Format currency

```typescript
import { formatCurrency } from '@/lib/i18n/locale-formatter';

const { language } = useLanguage();
const formatted = formatCurrency(99.99, 'USD', language);
```

## Common Patterns

### Conditional rendering based on install status

```typescript
const { isInstalled } = usePWA();

return (
  <>
    {!isInstalled && <InstallBanner />}
    <AppContent />
  </>
);
```

### Show update available notification

```typescript
const { needsUpdate, update } = usePWA();

{needsUpdate && (
  <div>
    <p>New version available!</p>
    <button onClick={update}>Update Now</button>
  </div>
)}
```

### RTL-aware spacing

```typescript
const { isRTL } = useLanguage();

<div className={isRTL ? 'mr-4' : 'ml-4'}>
  Content
</div>
```

### Language selector

```typescript
import { LanguageDropdown } from '@/components/language-dropdown';

<LanguageDropdown />
```

## File Locations

- **PWA Hook**: `/lib/hooks/use-pwa.ts`
- **Language Context**: `/lib/i18n/language-context.tsx`
- **Locale Formatter**: `/lib/i18n/locale-formatter.ts`
- **Push Notifications**: `/lib/pwa/push-notifications.ts`
- **Service Worker**: `/public/sw.js`
- **Manifest**: `/public/manifest.json`
- **Translations**: `/lib/i18n/translations/*.json`

## Full Documentation

- **PWA**: See [PWA_GUIDE.md](./PWA_GUIDE.md)
- **i18n**: See [I18N_GUIDE.md](./I18N_GUIDE.md)
- **Implementation**: See [PWA_I18N_IMPLEMENTATION.md](./PWA_I18N_IMPLEMENTATION.md)
