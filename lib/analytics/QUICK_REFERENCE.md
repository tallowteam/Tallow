# Plausible Analytics - Quick Reference

## Setup (One-Time)

### 1. Environment Variables
```bash
# .env.local
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=tallow.io
```

### 2. Wrap App
```tsx
// app/layout.tsx
import { AnalyticsProvider } from '@/lib/analytics';
import { CookieBanner } from '@/components/ui';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AnalyticsProvider>
          {children}
          <CookieBanner />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
```

---

## Usage

### Import Hook
```tsx
import { useAnalytics } from '@/lib/analytics';

const analytics = useAnalytics();
```

### Pre-defined Events

```tsx
// Transfer started
analytics.trackTransferStarted({
  method: 'local' | 'internet' | 'friends',
  fileCount: 3
});

// Transfer completed
analytics.trackTransferCompleted({
  method: 'local',
  totalSize: 1048576,      // bytes
  duration: 5000           // ms
});

// Room created
analytics.trackRoomCreated();

// Room joined
analytics.trackRoomJoined();

// Friend added
analytics.trackFriendAdded();

// Theme changed
analytics.trackThemeChanged({ theme: 'dark' | 'light' | 'system' });

// Language changed
analytics.trackLanguageChanged({ locale: 'en' });
```

### Custom Events

```tsx
// Simple event
analytics.trackEvent('button_clicked');

// Event with properties
analytics.trackEvent('feature_used', {
  feature: 'password_protection',
  enabled: 'true'
});

// Error tracking
analytics.trackEvent('error_occurred', {
  errorType: 'network',
  errorMessage: 'Connection failed'
});
```

---

## Components

### Cookie Banner
```tsx
import { CookieBanner } from '@/components/ui';

// Basic
<CookieBanner />

// With options
<CookieBanner
  privacyUrl="/privacy"
  showDecline={true}
  message="Custom message..."
/>
```

---

## Direct Access

### Import Singleton
```tsx
import { analytics } from '@/lib/analytics';

// Check if enabled
if (analytics.isEnabled()) {
  analytics.trackEvent('custom_event');
}

// Set consent
analytics.setConsent(true);   // Enable
analytics.setConsent(false);  // Disable

// Track pageview
analytics.trackPageview('/custom-path');
```

---

## Common Patterns

### Track Button Click
```tsx
<Button onClick={() => {
  analytics.trackEvent('button_clicked', {
    buttonName: 'download',
    section: 'hero'
  });
  handleClick();
}}>
  Download
</Button>
```

### Track Form Submit
```tsx
const handleSubmit = async (data) => {
  analytics.trackEvent('form_submitted', {
    formName: 'contact'
  });

  await submitForm(data);
};
```

### Track Feature Usage
```tsx
const enableFeature = (feature) => {
  analytics.trackEvent('feature_enabled', {
    feature
  });

  setFeatureEnabled(true);
};
```

### Track Error
```tsx
try {
  await riskyOperation();
} catch (error) {
  analytics.trackEvent('error_occurred', {
    operation: 'riskyOperation',
    error: error.message
  });

  throw error;
}
```

---

## Privacy Controls

### Check DNT Status
```tsx
// Automatically respected - no action needed
// DNT header disables analytics automatically
```

### User Consent
```tsx
const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

const handleToggle = (enabled) => {
  setAnalyticsEnabled(enabled);
  analytics.setConsent(enabled);
};

<Toggle
  checked={analyticsEnabled}
  onChange={handleToggle}
  label="Enable Analytics"
/>
```

### Check Status
```tsx
if (analytics.isEnabled()) {
  // Analytics is active
} else {
  // Analytics disabled (DNT or user preference)
}
```

---

## Testing

### Development Console
```tsx
// Check initialization
[Analytics] Initialized with domain: tallow.io
[Analytics] Pageview tracked: /

// Check script load
[Plausible] Script loaded successfully

// Check events
[Plausible] Event tracked: transfer_started
```

### Verify in Network Tab
```
POST https://plausible.io/api/event
{
  "n": "transfer_started",    // Event name
  "u": "https://tallow.io/",  // URL
  "d": "tallow.io",           // Domain
  "p": {"method": "local"}    // Props
}
```

### Test Page
```tsx
// app/test-analytics/page.tsx
'use client';

import { useAnalytics } from '@/lib/analytics';
import { Button } from '@/components/ui';

export default function TestPage() {
  const analytics = useAnalytics();

  return (
    <div>
      <p>Status: {analytics.isEnabled() ? 'Enabled' : 'Disabled'}</p>

      <Button onClick={() => analytics.trackEvent('test_event')}>
        Test Event
      </Button>

      <Button onClick={() => analytics.trackTransferStarted({
        method: 'local',
        fileCount: 1
      })}>
        Test Transfer
      </Button>
    </div>
  );
}
```

---

## Best Practices

### Event Naming
✅ Use snake_case: `transfer_started`, `button_clicked`
❌ Avoid spaces: `Transfer Started`, `Button Clicked`

### Property Values
✅ Simple types: strings, numbers
❌ Complex objects, arrays, functions

### No PII
✅ Track: `fileCount: 3`, `method: 'local'`
❌ Avoid: `fileName: 'passport.pdf'`, `userEmail: 'user@email.com'`

### Conditional Tracking
```tsx
// ✅ Check before tracking
if (analytics.isEnabled()) {
  analytics.trackEvent('event');
}

// ✅ Or just track (checks internally)
analytics.trackEvent('event');
```

---

## Props & Types

### Pre-defined Event Props

```typescript
// Transfer Started
interface TransferStartedProps {
  method: 'local' | 'internet' | 'friends';
  fileCount: number;
}

// Transfer Completed
interface TransferCompletedProps {
  method: 'local' | 'internet' | 'friends';
  totalSize: number;    // bytes
  duration: number;     // milliseconds
}

// Theme Changed
interface ThemeChangedProps {
  theme: 'dark' | 'light' | 'system';
}

// Language Changed
interface LanguageChangedProps {
  locale: string;
}

// Custom Event
interface PlausibleEventProps {
  [key: string]: string | number | boolean;
}
```

---

## Troubleshooting

### Script Not Loading
- Check env var: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`
- Disable ad blocker
- Check console for errors

### Events Not Tracking
- Verify `analytics.isEnabled()` returns `true`
- Check DNT is not enabled
- Verify script loaded: `window.plausible` exists
- Check network tab for API calls

### Cookie Banner Not Showing
- Check localStorage accessible
- Clear `tallow-analytics-consent` in localStorage
- Clear `tallow-banner-dismissed` in localStorage

---

## Resources

- 📚 [Full Documentation](./README.md)
- 💡 [Integration Examples](./EXAMPLE.md)
- 🌐 [Plausible Docs](https://plausible.io/docs)
- 🔒 [Privacy Policy](https://plausible.io/privacy)
