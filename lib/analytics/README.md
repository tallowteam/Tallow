# Plausible Analytics Integration

Privacy-friendly analytics for Tallow using Plausible.io. No cookies, no PII, respects Do Not Track.

## Features

- **Privacy-First**: No cookies, no personal data collection
- **DNT Compliant**: Respects Do Not Track browser setting
- **Lightweight**: Small script size, minimal performance impact
- **GDPR Compliant**: No consent banner required (but we show one anyway)
- **Event Tracking**: Custom events for key user actions
- **Automatic Pageviews**: Tracks navigation automatically

## Installation

### 1. Environment Variables

Add to your `.env.local`:

```bash
# Required: Your Plausible domain
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=tallow.io

# Optional: Custom API host (if self-hosting Plausible)
NEXT_PUBLIC_PLAUSIBLE_API_HOST=https://plausible.io
```

### 2. Wrap Your App

Update `app/layout.tsx`:

```tsx
import { AnalyticsProvider } from '@/lib/analytics';
import { CookieBanner } from '@/components/ui';

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

### 3. Configure Plausible Dashboard

1. Sign up at [plausible.io](https://plausible.io)
2. Add your domain (e.g., `tallow.io`)
3. Configure custom events (optional):
   - `transfer_started`
   - `transfer_completed`
   - `room_created`
   - `room_joined`
   - `friend_added`
   - `theme_changed`
   - `language_changed`

## Usage

### Automatic Pageview Tracking

The `AnalyticsProvider` automatically tracks pageviews on route changes.

### Custom Event Tracking

```tsx
import { useAnalytics } from '@/lib/analytics';

export function TransferButton() {
  const analytics = useAnalytics();

  const handleTransfer = () => {
    // Start transfer logic...

    // Track event
    analytics.trackTransferStarted({
      method: 'local',
      fileCount: 3
    });
  };

  return <button onClick={handleTransfer}>Transfer Files</button>;
}
```

### Pre-defined Events

```tsx
import { useAnalytics } from '@/lib/analytics';

const analytics = useAnalytics();

// Transfer events
analytics.trackTransferStarted({
  method: 'local' | 'internet' | 'friends',
  fileCount: number
});

analytics.trackTransferCompleted({
  method: 'local' | 'internet' | 'friends',
  totalSize: number,    // bytes
  duration: number      // milliseconds
});

// Room events
analytics.trackRoomCreated();
analytics.trackRoomJoined();

// Social events
analytics.trackFriendAdded();

// Settings events
analytics.trackThemeChanged({ theme: 'dark' | 'light' | 'system' });
analytics.trackLanguageChanged({ locale: 'en' | 'es' | 'fr' });

// Custom events
analytics.trackEvent('button_clicked', {
  buttonName: 'download',
  section: 'hero'
});
```

### Direct Analytics Access

```tsx
import { analytics } from '@/lib/analytics';

// Check if enabled
if (analytics.isEnabled()) {
  analytics.trackEvent('custom_event', { foo: 'bar' });
}

// Set consent
analytics.setConsent(true);  // Enable
analytics.setConsent(false); // Disable

// Track pageview manually
analytics.trackPageview('/custom-path');
```

## Cookie Banner

The `CookieBanner` component shows a dismissible privacy notice.

### Basic Usage

```tsx
import { CookieBanner } from '@/components/ui';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <CookieBanner />
    </>
  );
}
```

### Custom Configuration

```tsx
<CookieBanner
  privacyUrl="/privacy"
  message="Custom privacy message..."
  showDecline={true}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `privacyUrl` | `string` | `/privacy` | Link to privacy policy |
| `message` | `string` | Default message | Custom banner text |
| `showDecline` | `boolean` | `false` | Show decline button |

## Privacy Features

### Do Not Track

Analytics automatically respects the DNT header:

```tsx
// Automatically disabled if DNT is enabled
navigator.doNotTrack === '1'  // Disabled
window.doNotTrack === '1'     // Disabled
```

### User Consent

Users can opt-out via the cookie banner or programmatically:

```tsx
import { analytics } from '@/lib/analytics';

// Disable analytics
analytics.setConsent(false);

// Enable analytics
analytics.setConsent(true);
```

Consent is stored in `localStorage`:
- Key: `tallow-analytics-consent`
- Values: `'true'` | `'false'` | `null` (default enabled)

### No Cookies

Plausible doesn't use cookies. All tracking is:
- Cookieless
- Anonymous
- GDPR compliant
- No PII collected

## Testing

### Development Environment

Analytics is disabled in development by default. To test:

1. Set environment variables:
   ```bash
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=localhost
   ```

2. Check browser console for logs:
   ```
   [Analytics] Initialized with domain: localhost
   [Analytics] Pageview tracked: /
   [Plausible] Script loaded successfully
   ```

3. Use Plausible's test mode:
   ```
   https://plausible.io/your-domain.com/settings/visibility
   ```

### Verify Events

Open browser console and check for Plausible network requests:

```
POST https://plausible.io/api/event
```

Payload includes:
- `n`: Event name
- `u`: URL
- `d`: Domain
- `p`: Props (if any)

## Troublesho.oting

### Script Not Loading

Check:
1. Environment variable is set: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`
2. Domain is correct in Plausible dashboard
3. No ad blockers preventing script load
4. Browser console for errors

### Events Not Tracking

Verify:
1. Analytics is enabled: `analytics.isEnabled()`
2. DNT is not enabled
3. Script has loaded: Check for `window.plausible`
4. Event name doesn't have spaces (use underscore)

### Cookie Banner Not Showing

Check:
1. `localStorage` is accessible
2. Consent not already given
3. Banner not already dismissed
4. Component is rendered (client-side only)

## Self-Hosting Plausible

To self-host Plausible:

1. Follow [official guide](https://plausible.io/docs/self-hosting)
2. Update environment variables:
   ```bash
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com
   NEXT_PUBLIC_PLAUSIBLE_API_HOST=https://your-plausible-instance.com
   ```

## Performance

- Script size: ~1KB (gzipped)
- No cookies: Zero overhead
- Async loading: No render blocking
- Event queue: Handles early events

## Security

- No third-party cookies
- No fingerprinting
- No cross-site tracking
- Respects privacy headers
- HTTPS only

## TypeScript Support

Full TypeScript support with type definitions:

```tsx
import type {
  PlausibleEventProps,
  TransferStartedProps,
  TransferCompletedProps,
  ThemeChangedProps,
  LanguageChangedProps
} from '@/lib/analytics';
```

## Example Integration

See complete example in `lib/analytics/EXAMPLE.md`.

## Resources

- [Plausible Documentation](https://plausible.io/docs)
- [Privacy Policy](https://plausible.io/privacy)
- [GDPR Compliance](https://plausible.io/data-policy)
- [Self-Hosting Guide](https://plausible.io/docs/self-hosting)

## License

This integration follows Plausible's open-source MIT license.
