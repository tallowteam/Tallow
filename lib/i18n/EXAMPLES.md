# i18n Usage Examples

Real-world examples of using the i18n system in Tallow.

## 1. Basic Translation Usage

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function Header() {
  const { t } = useI18n();

  return (
    <section>
      <h1>{t('common.appName')}</h1>
      <p>{t('common.tagline')}</p>
      <button>{t('common.confirm')}</button>
    </section>
  );
}
```

## 2. Locale Switcher

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';
import { getLocaleMetadata } from '@/lib/i18n/useTranslation';

export function LocaleSwitcher() {
  const { locale, setLocale, availableLocales } = useI18n();

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      {availableLocales.map((loc) => (
        <option key={loc} value={loc}>
          {getLocaleMetadata(loc).nativeName}
        </option>
      ))}
    </select>
  );
}
```

## 3. RTL-Aware Navigation

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function Navigation() {
  const { t, isRTL } = useI18n();

  const navItems = [
    { key: 'nav.home', href: '/' },
    { key: 'nav.features', href: '/features' },
    { key: 'nav.security', href: '/security' },
    { key: 'nav.pricing', href: '/pricing' },
  ];

  return (
    <nav dir={isRTL ? 'rtl' : 'ltr'}>
      {navItems.map((item) => (
        <a key={item.key} href={item.href}>
          {t(item.key as any)}
        </a>
      ))}
    </nav>
  );
}
```

## 4. Hero Section with Dynamic Direction

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function Hero() {
  const { t, textDirection } = useI18n();

  return (
    <main dir={textDirection}>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <div className="flex gap-4">
        <button>{t('hero.cta')}</button>
        <button>{t('hero.secondaryCta')}</button>
      </div>
    </main>
  );
}
```

## 5. Dynamic Status Messages

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function TransferStatus({ status }) {
  const { t } = useI18n();

  // status can be: scanning, receiving, complete, failed
  const message = t(`transfer.${status}`);

  return <p className="status">{message}</p>;
}

// Usage:
// <TransferStatus status="scanning" /> -> "جاري البحث عن الأجهزة..."
// <TransferStatus status="complete" /> -> "اكتمل بنجاح"
```

## 6. Error Message List

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function ErrorDisplay({ errorType }) {
  const { t } = useI18n();

  const errorTypes = [
    'connectionFailed',
    'timeout',
    'cryptoError',
    'noCamera',
    'noPermission',
  ];

  return (
    <div className="error-container">
      {errorTypes.map((error) => (
        <p key={error}>{t(`errors.${error}`)}</p>
      ))}
    </div>
  );
}
```

## 7. Settings Form

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function Settings() {
  const { t, locale, setLocale, isRTL } = useI18n();

  return (
    <form dir={isRTL ? 'rtl' : 'ltr'}>
      <fieldset>
        <legend>{t('settings.language')}</legend>
        <select value={locale} onChange={(e) => setLocale(e.target.value)}>
          <option value="ar">العربية</option>
          <option value="he">עברית</option>
          <option value="hi">हिन्दी</option>
        </select>
      </fieldset>

      <fieldset>
        <legend>{t('settings.theme')}</legend>
        <select>
          <option value="auto">Auto</option>
          <option value="dark">{t('settings.dark')}</option>
          <option value="light">{t('settings.light')}</option>
        </select>
      </fieldset>

      <fieldset>
        <legend>{t('settings.deviceName')}</legend>
        <input type="text" />
      </fieldset>

      <button type="submit">{t('common.save')}</button>
    </form>
  );
}
```

## 8. Chat Interface

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function Chat() {
  const { t, isRTL } = useI18n();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="chat">
      <div className="message">
        <p>Hello!</p>
        <span className="encrypted">{t('chat.encrypted')}</span>
        <span className="status">{t('chat.delivered')}</span>
      </div>

      <input
        type="text"
        placeholder={t('chat.messagePlaceholder')}
      />
      <button>{t('chat.send')}</button>

      <p className="typing">{t('chat.typingIndicator')}</p>
    </div>
  );
}
```

## 9. Accessibility Features

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function AccessibleLayout() {
  const { t } = useI18n();

  return (
    <>
      {/* Skip link */}
      <a href="#main-content" className="sr-only">
        {t('a11y.skipToContent')}
      </a>

      {/* Menu button */}
      <button aria-label={t('a11y.openMenu')}>
        ☰
      </button>

      {/* Loading indicator */}
      <div role="status" aria-label={t('a11y.loading')}>
        <p>{t('common.loading')}</p>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-label={t('a11y.progress')}
        aria-valuenow={50}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* Color mode toggle */}
      <button aria-label={t('a11y.darkMode')}>
        Toggle Theme
      </button>
    </>
  );
}
```

## 10. Feature Cards

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function Features() {
  const { t } = useI18n();

  const features = [
    'localSharing',
    'internetSharing',
    'friendsSharing',
    'encryption',
    'speed',
    'privacy',
    'noLimits',
    'crossPlatform',
  ];

  return (
    <div className="grid">
      {features.map((feature) => (
        <div key={feature} className="card">
          <h3>{t(`features.${feature}`)}</h3>
        </div>
      ))}
    </div>
  );
}
```

## 11. Notification Center

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function Notifications() {
  const { t } = useI18n();

  const notifications = [
    { id: 1, type: 'transferComplete' },
    { id: 2, type: 'newDevice' },
    { id: 3, type: 'friendRequest' },
  ];

  return (
    <div className="notifications">
      {notifications.map((notif) => (
        <div key={notif.id} className="notification">
          {t(`notifications.${notif.type}`)}
          <button>{t('common.close')}</button>
        </div>
      ))}
    </div>
  );
}
```

## 12. Pricing Table

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function Pricing() {
  const { t } = useI18n();

  const plans = [
    { id: 'free', price: 0, popular: false },
    { id: 'pro', price: 9.99, popular: true },
    { id: 'business', price: 99.99, popular: false },
  ];

  return (
    <div className="pricing">
      {plans.map((plan) => (
        <div key={plan.id} className={plan.popular ? 'card popular' : 'card'}>
          {plan.popular && (
            <span className="badge">{t('pricing.popular')}</span>
          )}
          <h3>{t(`pricing.${plan.id}`)}</h3>
          <p className="price">
            ${plan.price}
            <span>{t('pricing.perMonth')}</span>
          </p>
          <button>{t('pricing.getStarted')}</button>
        </div>
      ))}
    </div>
  );
}
```

## 13. File Transfer Zone

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function TransferZone() {
  const { t, isRTL } = useI18n();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="transfer-zone">
      <div className="drop-area">
        <p>{t('transfer.dropFiles')}</p>
      </div>

      <div className="devices">
        <h3>{t('transfer.sendTo')}</h3>
        <p className="empty">{t('transfer.noDevices')}</p>
      </div>

      <div className="queue">
        <h3>{t('transfer.queue')}</h3>
        <div className="item">
          <span>document.pdf</span>
          <span className="status">{t('transfer.receiving')}</span>
          <button>{t('transfer.pause')}</button>
        </div>
      </div>

      <div className="history">
        <h3>{t('transfer.history')}</h3>
        <button>{t('transfer.clearHistory')}</button>
      </div>
    </div>
  );
}
```

## 14. Friends List

```tsx
'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';

export function FriendsList() {
  const { t } = useI18n();

  const friends = [
    { id: 1, name: 'Ahmed', online: true },
    { id: 2, name: 'Sarah', online: false, lastSeen: '2h ago' },
  ];

  return (
    <ul className="friends">
      {friends.map((friend) => (
        <li key={friend.id}>
          <span className="name">{friend.name}</span>
          <span className={friend.online ? 'online' : 'offline'}>
            {friend.online
              ? t('friends.online')
              : `${t('friends.offline')} - ${t('friends.lastSeen')}`}
          </span>
          <button>{t('common.delete')}</button>
        </li>
      ))}

      <button>{t('friends.addFriend')}</button>
    </ul>
  );
}
```

## 15. Full App Layout Example

```tsx
// app/layout.tsx
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <I18nProvider defaultLocale="ar">
          <Header />
          <main>{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
```

## Static Translation Usage

For use outside React components (utilities, APIs, server actions):

```ts
// lib/utils/helpers.ts
import { getStaticTranslation } from '@/lib/i18n/useTranslation';

export function sendEmail(locale: 'ar' | 'he' | 'hi') {
  const subject = getStaticTranslation(locale, 'common.appName');
  const message = getStaticTranslation(locale, 'common.tagline');

  return {
    subject,
    message,
  };
}

// In API route
export async function GET() {
  const appName = getStaticTranslation('ar', 'common.appName');

  return Response.json({ appName });
}
```

## Testing Example

```tsx
// __tests__/Header.test.tsx
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { Header } from '@/components/Header';

describe('Header', () => {
  it('renders with Arabic locale', () => {
    render(
      <I18nProvider defaultLocale="ar">
        <Header />
      </I18nProvider>
    );

    expect(screen.getByText('تالو')).toBeInTheDocument();
  });

  it('renders with Hebrew locale', () => {
    render(
      <I18nProvider defaultLocale="he">
        <Header />
      </I18nProvider>
    );

    expect(screen.getByText('טלו')).toBeInTheDocument();
  });

  it('applies RTL direction for Arabic', () => {
    const { container } = render(
      <I18nProvider defaultLocale="ar">
        <Header />
      </I18nProvider>
    );

    expect(document.documentElement.dir).toBe('rtl');
  });
});
```

---

For more information, see `I18N_GUIDE.md` or `QUICK_START.md`.
