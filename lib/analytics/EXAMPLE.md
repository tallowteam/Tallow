# Analytics Integration Examples

Complete examples showing how to integrate Plausible analytics throughout the Tallow app.

## Table of Contents

1. [App Layout Integration](#app-layout-integration)
2. [Transfer Component](#transfer-component)
3. [Room Management](#room-management)
4. [Settings Component](#settings-component)
5. [Theme Toggle](#theme-toggle)
6. [Friend Management](#friend-management)
7. [Privacy Settings](#privacy-settings)

---

## App Layout Integration

`app/layout.tsx` - Wrap your entire app with AnalyticsProvider:

```tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider, ThemeScript } from '@/components/theme';
import { SkipLink } from '@/components/a11y';
import { AccessibilityProvider } from '@/components/a11y/AccessibilityProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { AnalyticsProvider } from '@/lib/analytics';
import { CookieBanner } from '@/components/ui';
import { PerformanceInit } from '@/lib/performance/PerformanceInit';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Tallow',
  description: 'Secure peer-to-peer file transfers with post-quantum encryption.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <SkipLink targetId="main-content" label="Skip to main content" />
        <ThemeProvider>
          <AccessibilityProvider>
            <AnalyticsProvider>
              <ToastProvider position="bottom-right" maxToasts={5}>
                {children}
                <CookieBanner showDecline={true} />
              </ToastProvider>
            </AnalyticsProvider>
          </AccessibilityProvider>
        </ThemeProvider>
        <PerformanceInit />
      </body>
    </html>
  );
}
```

---

## Transfer Component

`components/transfer/TransferButton.tsx` - Track file transfers:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { useAnalytics } from '@/lib/analytics';
import { useTransferStore } from '@/lib/stores/transfer-store';

export function TransferButton() {
  const analytics = useAnalytics();
  const [isTransferring, setIsTransferring] = useState(false);
  const { startTransfer } = useTransferStore();

  const handleTransfer = async (files: File[]) => {
    try {
      setIsTransferring(true);

      // Track transfer start
      analytics.trackTransferStarted({
        method: 'local', // or 'internet' or 'friends'
        fileCount: files.length
      });

      const startTime = Date.now();

      // Perform transfer
      await startTransfer(files);

      // Track transfer completion
      const duration = Date.now() - startTime;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      analytics.trackTransferCompleted({
        method: 'local',
        totalSize,
        duration
      });

      // Success!
    } catch (error) {
      // Track error (custom event)
      analytics.trackEvent('transfer_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileCount: files.length
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Button
      onClick={() => handleTransfer(selectedFiles)}
      disabled={isTransferring}
    >
      {isTransferring ? 'Transferring...' : 'Send Files'}
    </Button>
  );
}
```

---

## Room Management

`components/rooms/RoomActions.tsx` - Track room events:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { useAnalytics } from '@/lib/analytics';
import { useRoomStore } from '@/lib/stores/room-store';

export function RoomActions() {
  const analytics = useAnalytics();
  const { createRoom, joinRoom } = useRoomStore();
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = async () => {
    try {
      const room = await createRoom();

      // Track room creation
      analytics.trackRoomCreated();

      return room;
    } catch (error) {
      analytics.trackEvent('room_creation_failed', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
    }
  };

  const handleJoinRoom = async (code: string) => {
    try {
      await joinRoom(code);

      // Track room join
      analytics.trackRoomJoined();
    } catch (error) {
      analytics.trackEvent('room_join_failed', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
    }
  };

  return (
    <div>
      <Button onClick={handleCreateRoom}>
        Create Room
      </Button>

      <input
        type="text"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
        placeholder="Enter room code"
      />

      <Button onClick={() => handleJoinRoom(roomCode)}>
        Join Room
      </Button>
    </div>
  );
}
```

---

## Settings Component

`components/settings/SettingsForm.tsx` - Track settings changes:

```tsx
'use client';

import { useAnalytics } from '@/lib/analytics';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Toggle } from '@/components/ui';

export function SettingsForm() {
  const analytics = useAnalytics();
  const {
    stripMetadata,
    setStripMetadata,
    ipLeakProtection,
    setIpLeakProtection,
    onionRoutingEnabled,
    setOnionRoutingEnabled
  } = useSettingsStore();

  const handleMetadataToggle = (enabled: boolean) => {
    setStripMetadata(enabled);

    // Track privacy setting change
    analytics.trackEvent('privacy_setting_changed', {
      setting: 'strip_metadata',
      enabled: enabled ? 'true' : 'false'
    });
  };

  const handleOnionRoutingToggle = (enabled: boolean) => {
    setOnionRoutingEnabled(enabled);

    // Track advanced feature usage
    analytics.trackEvent('privacy_setting_changed', {
      setting: 'onion_routing',
      enabled: enabled ? 'true' : 'false'
    });
  };

  return (
    <div>
      <Toggle
        checked={stripMetadata}
        onChange={handleMetadataToggle}
        label="Strip Metadata"
      />

      <Toggle
        checked={ipLeakProtection}
        onChange={(enabled) => {
          setIpLeakProtection(enabled);
          analytics.trackEvent('privacy_setting_changed', {
            setting: 'ip_leak_protection',
            enabled: enabled ? 'true' : 'false'
          });
        }}
        label="IP Leak Protection"
      />

      <Toggle
        checked={onionRoutingEnabled}
        onChange={handleOnionRoutingToggle}
        label="Onion Routing"
      />
    </div>
  );
}
```

---

## Theme Toggle

`components/theme/ThemeToggle.tsx` - Track theme changes:

```tsx
'use client';

import { useTheme } from '@/components/theme';
import { useAnalytics } from '@/lib/analytics';
import { Button } from '@/components/ui';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const analytics = useAnalytics();

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);

    // Track theme change
    analytics.trackThemeChanged({ theme: newTheme });
  };

  return (
    <div>
      <Button
        onClick={() => handleThemeChange('light')}
        variant={theme === 'light' ? 'primary' : 'secondary'}
      >
        Light
      </Button>

      <Button
        onClick={() => handleThemeChange('dark')}
        variant={theme === 'dark' ? 'primary' : 'secondary'}
      >
        Dark
      </Button>

      <Button
        onClick={() => handleThemeChange('system')}
        variant={theme === 'system' ? 'primary' : 'secondary'}
      >
        System
      </Button>
    </div>
  );
}
```

---

## Friend Management

`components/friends/FriendActions.tsx` - Track social features:

```tsx
'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { useAnalytics } from '@/lib/analytics';
import { useFriendStore } from '@/lib/stores/friend-store';

export function FriendActions() {
  const analytics = useAnalytics();
  const { addFriend, removeFriend } = useFriendStore();
  const [friendCode, setFriendCode] = useState('');

  const handleAddFriend = async (code: string) => {
    try {
      await addFriend(code);

      // Track friend added
      analytics.trackFriendAdded();

      setFriendCode('');
    } catch (error) {
      analytics.trackEvent('friend_add_failed', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId);

      // Track friend removal
      analytics.trackEvent('friend_removed');
    } catch (error) {
      analytics.trackEvent('friend_remove_failed', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
    }
  };

  return (
    <div>
      <Input
        type="text"
        value={friendCode}
        onChange={(e) => setFriendCode(e.target.value)}
        placeholder="Friend code"
      />

      <Button onClick={() => handleAddFriend(friendCode)}>
        Add Friend
      </Button>
    </div>
  );
}
```

---

## Privacy Settings

`components/settings/AnalyticsSettings.tsx` - Let users control analytics:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Toggle } from '@/components/ui';
import { useAnalytics } from '@/lib/analytics';

export function AnalyticsSettings() {
  const analytics = useAnalytics();
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(analytics.isEnabled());
  }, [analytics]);

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    analytics.setConsent(newEnabled);

    // Track the change (if enabled)
    if (newEnabled) {
      analytics.trackEvent('analytics_enabled');
    }
  };

  return (
    <div>
      <h3>Privacy Settings</h3>

      <Toggle
        checked={enabled}
        onChange={handleToggle}
        label="Enable Privacy-Friendly Analytics"
      />

      <p>
        We use Plausible Analytics to understand how visitors use our app.
        No cookies, no personal data, no tracking across sites.
      </p>

      <a href="/privacy" target="_blank" rel="noopener noreferrer">
        Learn more about our privacy policy
      </a>
    </div>
  );
}
```

---

## Advanced: Custom Event Tracking

`lib/analytics/custom-events.ts` - Create reusable event trackers:

```tsx
import { analytics } from '@/lib/analytics';

/**
 * Track download events
 */
export function trackDownload(fileName: string, fileSize: number) {
  analytics.trackEvent('file_downloaded', {
    fileName: fileName.substring(0, 100), // Truncate long names
    fileSizeKB: Math.round(fileSize / 1024)
  });
}

/**
 * Track share events
 */
export function trackShare(method: 'email' | 'link' | 'qr') {
  analytics.trackEvent('share_initiated', {
    method
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsed(feature: string) {
  analytics.trackEvent('feature_used', {
    feature
  });
}

/**
 * Track error events
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  context?: Record<string, string | number>
) {
  analytics.trackEvent('error_occurred', {
    errorType,
    errorMessage: errorMessage.substring(0, 100),
    ...context
  });
}

/**
 * Track conversion events
 */
export function trackConversion(eventName: string, value?: number) {
  analytics.trackEvent(eventName, {
    value: value || 0
  });
}
```

Usage:

```tsx
import { trackDownload, trackShare, trackFeatureUsed } from '@/lib/analytics/custom-events';

// Track download
trackDownload('document.pdf', 1024000);

// Track share
trackShare('email');

// Track feature
trackFeatureUsed('password_protection');
```

---

## Testing Analytics

`app/analytics-test/page.tsx` - Test page for analytics:

```tsx
'use client';

import { Button } from '@/components/ui';
import { useAnalytics } from '@/lib/analytics';

export default function AnalyticsTestPage() {
  const analytics = useAnalytics();

  return (
    <div>
      <h1>Analytics Test Page</h1>

      <p>Enabled: {analytics.isEnabled() ? 'Yes' : 'No'}</p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button onClick={() => analytics.trackEvent('test_event')}>
          Track Test Event
        </Button>

        <Button onClick={() => analytics.trackTransferStarted({ method: 'local', fileCount: 1 })}>
          Track Transfer Started
        </Button>

        <Button onClick={() => analytics.trackTransferCompleted({
          method: 'local',
          totalSize: 1000000,
          duration: 5000
        })}>
          Track Transfer Completed
        </Button>

        <Button onClick={() => analytics.trackRoomCreated()}>
          Track Room Created
        </Button>

        <Button onClick={() => analytics.trackRoomJoined()}>
          Track Room Joined
        </Button>

        <Button onClick={() => analytics.trackFriendAdded()}>
          Track Friend Added
        </Button>

        <Button onClick={() => analytics.trackThemeChanged({ theme: 'dark' })}>
          Track Theme Changed
        </Button>

        <Button onClick={() => analytics.trackLanguageChanged({ locale: 'en' })}>
          Track Language Changed
        </Button>

        <Button onClick={() => analytics.setConsent(false)}>
          Disable Analytics
        </Button>

        <Button onClick={() => analytics.setConsent(true)}>
          Enable Analytics
        </Button>
      </div>
    </div>
  );
}
```

---

## Environment Setup

`.env.local`:

```bash
# Plausible Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=tallow.io
NEXT_PUBLIC_PLAUSIBLE_API_HOST=https://plausible.io
```

`.env.example`:

```bash
# Plausible Analytics (Optional)
# NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com
# NEXT_PUBLIC_PLAUSIBLE_API_HOST=https://plausible.io
```

---

## Summary

Key integration points:

1. **App Layout**: Wrap app with `AnalyticsProvider`
2. **Cookie Banner**: Add `CookieBanner` component
3. **Transfer Events**: Track file transfer lifecycle
4. **Room Events**: Track room creation/joining
5. **Settings**: Track configuration changes
6. **Theme**: Track theme preferences
7. **Friends**: Track social features
8. **Custom Events**: Create reusable event trackers

Remember:
- Always check `analytics.isEnabled()` for conditional tracking
- Keep event names consistent (use snake_case)
- Avoid sending PII in event props
- Test in development with console logs
- Verify in Plausible dashboard
