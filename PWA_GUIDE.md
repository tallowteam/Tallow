# Progressive Web App (PWA) Guide

## Overview

Tallow is now a fully-featured Progressive Web App (PWA), allowing users to install it on their devices for a native app-like experience. This guide covers PWA features, installation, and development.

## Features

### 1. Installability

- **Desktop Installation**: Install Tallow on Windows, macOS, and Linux
- **Mobile Installation**: Install on iOS and Android devices
- **Standalone Mode**: Runs as a standalone app without browser UI
- **App Shortcuts**: Quick access to Send and Receive modes

### 2. Offline Support

- **Service Worker**: Caches critical assets for offline access
- **Offline Page**: Custom offline page when network is unavailable
- **Smart Caching**: Cache-first strategy for static assets
- **Background Sync**: Queues failed requests for retry when online

### 3. Performance

- **Fast Loading**: Cached assets load instantly
- **Reduced Data Usage**: Fewer network requests after initial load
- **Optimized Assets**: Compressed and minified resources

### 4. Native Features

- **Push Notifications**: Receive notifications for file transfers
- **Share Target**: Accept files shared from other apps
- **Protocol Handler**: Handle custom web+tallow:// URLs
- **Badges**: Display notification count on app icon

## Installation

### Desktop (Chrome/Edge)

1. Open Tallow in Chrome or Edge
2. Look for the install icon in the address bar
3. Click "Install" or use the install prompt
4. Tallow will appear as a standalone app

**Keyboard Shortcut**: Chrome Menu → Install Tallow

### Desktop (Safari)

Safari doesn't support PWA installation on desktop. Use Chrome or Edge for full PWA experience.

### iOS (Safari)

1. Open Tallow in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right

**Note**: iOS PWAs have some limitations compared to Android.

### Android (Chrome)

1. Open Tallow in Chrome
2. Tap the install banner or
3. Tap the three-dot menu → "Install app"
4. Confirm installation

## Manifest Configuration

The PWA manifest is located at `/public/manifest.json`:

```json
{
  "name": "Tallow - Peer-to-Peer File Sharing",
  "short_name": "Tallow",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0D0D0D",
  "theme_color": "#0A0A0A"
}
```

### Key Properties

- **name**: Full app name shown during installation
- **short_name**: Name shown on home screen
- **start_url**: URL to open when app launches
- **display**: How the app is displayed (standalone, fullscreen, minimal-ui)
- **background_color**: Splash screen background color
- **theme_color**: Browser UI color
- **icons**: App icons in various sizes (192x192, 512x512)

### App Shortcuts

Quick access shortcuts in the app menu:

```json
"shortcuts": [
  {
    "name": "Send Files",
    "url": "/app?mode=send"
  },
  {
    "name": "Receive Files",
    "url": "/app?mode=receive"
  }
]
```

## Service Worker

The service worker (`/public/sw.js`) handles caching and offline functionality.

### Caching Strategy

1. **Static Cache**: Critical assets cached on install
2. **Dynamic Cache**: Pages cached on first visit
3. **Runtime Cache**: API responses cached temporarily

### Cache Versioning

```javascript
const CACHE_VERSION = 'tallow-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
```

Increment `CACHE_VERSION` when deploying updates to force cache refresh.

### Updating the Service Worker

1. Modify service worker code
2. Increment `CACHE_VERSION`
3. Deploy to production
4. Users will receive update notification
5. Reload to activate new service worker

## Push Notifications

### Request Permission

```typescript
import { requestNotificationPermission } from '@/lib/pwa/push-notifications';

const granted = await requestNotificationPermission();
```

### Show Notification

```typescript
import { showNotification, NotificationPresets } from '@/lib/pwa/push-notifications';

await showNotification(NotificationPresets.fileReceived('document.pdf'));
```

### Subscribe to Push

```typescript
import { subscribeToPush } from '@/lib/pwa/push-notifications';

const subscription = await subscribeToPush(VAPID_PUBLIC_KEY);
```

### Notification Types

Pre-configured notification presets:

- `fileReceived`: File received successfully
- `transferComplete`: File sent successfully
- `transferFailed`: Transfer failed
- `connectionRequest`: Connection request from device
- `newMessage`: New text message

## Using PWA Hooks

### usePWA Hook

```typescript
import { usePWA } from '@/lib/hooks/use-pwa';

function MyComponent() {
  const { isInstalled, canInstall, install, isOnline, needsUpdate, update } = usePWA();

  return (
    <div>
      {canInstall && (
        <button onClick={install}>
          Install App
        </button>
      )}

      {needsUpdate && (
        <button onClick={update}>
          Update Available - Click to Refresh
        </button>
      )}

      <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
    </div>
  );
}
```

### PWA State

- `isInstalled`: App is installed on device
- `isStandalone`: Running as standalone app
- `canInstall`: Install prompt is available
- `isOnline`: Device has network connection
- `needsUpdate`: New service worker update available

## Install Prompt Component

The install prompt component (`/components/app/install-prompt.tsx`) automatically shows installation options:

- **Auto-display**: Shows after 30 seconds on first visit
- **Dismissible**: Can be dismissed for 7 days
- **Platform-specific**: Different UI for iOS, Android, and desktop
- **Instructions**: Guided installation steps for each platform

## Share Target API

Accept files shared from other apps:

```json
"share_target": {
  "action": "/app",
  "method": "POST",
  "enctype": "multipart/form-data",
  "params": {
    "files": [
      {
        "name": "file",
        "accept": ["*/*"]
      }
    ]
  }
}
```

### Handling Shared Files

```typescript
// In /app/page.tsx
if (request.method === 'POST') {
  const formData = await request.formData();
  const file = formData.get('file');
  // Handle shared file
}
```

## Protocol Handler

Handle custom URLs with the `web+tallow://` protocol:

```json
"protocol_handlers": [
  {
    "protocol": "web+tallow",
    "url": "/app?code=%s"
  }
]
```

### Usage

```html
<a href="web+tallow://CONNECT123">Connect with code</a>
```

## Offline Page

Custom offline page (`/app/offline/page.tsx`) shown when:

- User is offline
- Requested page is not cached
- Network request fails

Features:
- Connection status indicator
- Retry button
- Link to home page
- List of available offline features

## Testing PWA

### Lighthouse Audit

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Click "Generate report"

**Target Score**: 90+ for production

### PWA Checklist

- [x] Served over HTTPS
- [x] Registers a service worker
- [x] Has a web app manifest
- [x] Icons for home screen
- [x] Splash screen configured
- [x] Offline functionality
- [x] Fast initial load
- [x] Installable on all platforms

### Manual Testing

1. **Install Test**: Install app on device
2. **Offline Test**: Disable network, verify offline page
3. **Update Test**: Deploy new version, verify update prompt
4. **Notification Test**: Trigger notification, verify display
5. **Share Test**: Share file to app from another app

## Development

### Running Service Worker Locally

By default, service worker registration is disabled in development. To enable:

```typescript
// lib/pwa/service-worker-registration.ts
if (process.env.NODE_ENV === 'development') {
  console.log('Service Worker registration skipped in development');
  return; // Remove this line to enable in dev
}
```

### Debugging Service Worker

1. Open Chrome DevTools
2. Go to Application tab
3. Click "Service Workers"
4. View registration, status, and errors

### Clear Cache

```typescript
import { clearCaches } from '@/lib/pwa/service-worker-registration';

await clearCaches();
```

### Unregister Service Worker

```typescript
import { unregisterServiceWorker } from '@/lib/pwa/service-worker-registration';

await unregisterServiceWorker();
```

## Deployment

### Production Checklist

1. ✅ Test PWA on all browsers
2. ✅ Verify service worker caching
3. ✅ Test offline functionality
4. ✅ Check manifest.json
5. ✅ Update cache version
6. ✅ Test push notifications
7. ✅ Run Lighthouse audit
8. ✅ Test on mobile devices

### CDN Configuration

Ensure CDN allows service worker:

```nginx
# nginx configuration
location /sw.js {
  add_header Cache-Control "public, max-age=0, must-revalidate";
  add_header Service-Worker-Allowed "/";
}
```

### HTTPS Requirement

PWAs require HTTPS in production. Use:
- Let's Encrypt for free SSL
- Cloudflare for automatic HTTPS
- Vercel/Netlify (HTTPS by default)

## Browser Support

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| Install | ✅ | ✅ | ⚠️ iOS only | ❌ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ❌ | ✅ |
| Share Target | ✅ | ✅ | ❌ | ❌ |
| Background Sync | ✅ | ✅ | ❌ | ❌ |

**Legend**: ✅ Supported | ⚠️ Partial support | ❌ Not supported

## Best Practices

1. **Always use HTTPS** in production
2. **Keep service worker simple** - complex logic can cause issues
3. **Version your caches** - increment on every deployment
4. **Test offline scenarios** - ensure app works without network
5. **Provide fallbacks** - graceful degradation for unsupported features
6. **Monitor cache size** - limit cache to prevent storage issues
7. **Update regularly** - keep service worker up to date

## Troubleshooting

### Service Worker Not Registering

- Check console for errors
- Verify HTTPS is enabled
- Check service worker scope
- Clear browser cache and retry

### Install Prompt Not Showing

- App must be served over HTTPS
- User must not have dismissed recently
- App must meet PWA criteria
- Check browser compatibility

### Offline Page Not Showing

- Verify service worker is active
- Check fetch event handler
- Ensure offline page is cached
- Test network throttling

### Notifications Not Working

- Check notification permission
- Verify HTTPS is enabled
- Test on supported browser
- Check service worker registration

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Service Worker Cookbook](https://serviceworke.rs/)

## Support

For PWA-related issues, please:
1. Check browser console for errors
2. Run Lighthouse audit
3. Review this guide
4. Open an issue on GitHub with details
