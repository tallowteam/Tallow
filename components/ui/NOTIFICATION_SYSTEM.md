# Notification System Documentation

Complete notification/toast system for transfer events, connection events, and user feedback in the Tallow app.

## Overview

The notification system consists of:

1. **Toast Notifications** - In-app visual notifications
2. **Browser Notifications** - Native OS notifications when app is in background
3. **Sound Alerts** - Audio feedback for important events
4. **Notification Manager** - Centralized notification handling
5. **Settings Integration** - User preferences for notifications

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Toast UI    │  │   Dialog UI  │  │  Settings UI │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Hooks Layer                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  useNotifications() - Main notification hook         │   │
│  │  useNotificationIntegration() - Store integration    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Notification Manager                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Toast coordination                                 │   │
│  │  • Browser notifications                              │   │
│  │  • Sound playback                                     │   │
│  │  • Settings enforcement                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Toast Provider & Settings Store             │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Toast Provider

Already integrated in `app/layout.tsx`:

```tsx
import { ToastProvider } from '@/components/ui/ToastProvider';

<ToastProvider position="bottom-right" maxToasts={5}>
  {children}
</ToastProvider>
```

### Toast Component

Individual toast notification with variants, actions, and auto-dismiss.

**Props:**
- `id: string` - Unique identifier
- `title?: string` - Optional title
- `message: string` - Main message
- `variant?: 'success' | 'error' | 'warning' | 'info'` - Visual style
- `duration?: number` - Auto-dismiss time in ms (default: 5000)
- `action?: { label: string; onClick: () => void }` - Optional action button
- `onClose: (id: string) => void` - Close callback

### Incoming Transfer Dialog

Shows a modal dialog when receiving an incoming transfer request.

```tsx
import { IncomingTransferDialog } from '@/components/transfer';

<IncomingTransferDialog
  open={showDialog}
  deviceName="MacBook Pro"
  fileName="document.pdf"
  fileSize={2048576}
  fileType="application/pdf"
  onAccept={() => {/* Accept transfer */}}
  onReject={() => {/* Reject transfer */}}
  timeout={30000} // Auto-reject after 30s
/>
```

## Hooks

### useNotifications()

Main hook for showing notifications.

```tsx
import { useNotifications } from '@/lib/hooks/use-notifications';

function MyComponent() {
  const notifications = useNotifications();

  // Basic toasts
  notifications.success('File uploaded!');
  notifications.error('Upload failed');
  notifications.warning('Low disk space');
  notifications.info('New device available');

  // Transfer notifications
  notifications.notifyTransferStarted('file.pdf', 'MacBook Pro');
  notifications.notifyTransferComplete('file.pdf', 'received');
  notifications.notifyTransferFailed('file.pdf', 'Connection lost', onRetry);

  // Connection notifications
  notifications.notifyConnectionEstablished('MacBook Pro', 'p2p');
  notifications.notifyConnectionLost('MacBook Pro');

  // Device notifications
  notifications.notifyDeviceDiscovered('New iPhone');

  // Incoming transfer request
  notifications.notifyIncomingTransferRequest(
    'MacBook Pro',
    'document.pdf',
    () => {/* Accept */},
    () => {/* Reject */}
  );

  // Browser notifications
  notifications.requestPermission();

  return <div>...</div>;
}
```

### useNotificationIntegration()

Automatically shows notifications based on store events. Use in your main app component:

```tsx
import { useNotificationIntegration } from '@/lib/integrations/notification-integration';

function App() {
  const notifications = useNotificationIntegration();

  // Notifications are now automatic for:
  // - Connection status changes
  // - Device discovery
  // - Transfer completion/failure

  return <div>...</div>;
}
```

## Settings

User notification preferences are stored in `useSettingsStore`:

```tsx
import { useSettingsStore } from '@/lib/stores';

const settings = useSettingsStore();

// Notification settings
settings.notificationSound // Enable/disable sound
settings.browserNotifications // Enable/disable browser notifications
settings.toastPosition // Toast position on screen
settings.notifyOnTransferComplete // Show transfer complete notifications
settings.notifyOnIncomingTransfer // Show incoming transfer notifications
settings.notifyOnConnectionChange // Show connection notifications
settings.notifyOnDeviceDiscovered // Show device discovery notifications

// Update settings
settings.setNotificationSound(true);
settings.setBrowserNotifications(true);
settings.setToastPosition('bottom-right');
settings.setNotifyOnTransferComplete(true);
```

## Notification Types

### Transfer Notifications

#### Transfer Started
```tsx
notifications.notifyTransferStarted('document.pdf', 'MacBook Pro');
```
- Variant: `info`
- Sound: Yes
- Browser notification: Only if in background

#### Transfer Complete
```tsx
notifications.notifyTransferComplete('document.pdf', 'received');
```
- Variant: `success`
- Sound: Yes
- Browser notification: Always (if enabled)
- Direction: `'sent' | 'received'`

#### Transfer Failed
```tsx
notifications.notifyTransferFailed('document.pdf', 'Connection lost', () => retry());
```
- Variant: `error`
- Sound: Yes
- Duration: 7000ms (longer than default)
- Action: Optional retry button

### Connection Notifications

#### Connection Established
```tsx
notifications.notifyConnectionEstablished('MacBook Pro', 'p2p');
```
- Variant: `success`
- Connection type: `'p2p' | 'relay'`
- Shows different message based on connection type

#### Connection Lost
```tsx
notifications.notifyConnectionLost('MacBook Pro');
```
- Variant: `warning`
- Sound: Yes

### Device Notifications

#### Device Discovered
```tsx
notifications.notifyDeviceDiscovered('New iPhone');
```
- Variant: `info`
- Sound: Yes
- Only shows if `notifyOnDeviceDiscovered` is enabled

### Incoming Transfer Request

```tsx
notifications.notifyIncomingTransferRequest(
  'MacBook Pro',
  'document.pdf',
  () => acceptTransfer(),
  () => rejectTransfer()
);
```
- Shows both toast and dialog
- Auto-rejects after 30 seconds
- Action buttons: Accept / Reject
- Browser notification: Always (if enabled)

## Browser Notifications

### Permission Request

Browser notifications require user permission:

```tsx
await notifications.requestPermission();
```

### Auto-Request

Permission is automatically requested when:
1. User enables browser notifications in settings
2. First transfer is initiated

### Checking Status

```tsx
const isAvailable = notifications.isBrowserNotificationsAvailable;
const isDenied = notifications.isBrowserNotificationsDenied;
```

### Background Detection

Browser notifications only show when:
- App is in background (`document.hidden`)
- Permission is granted
- Setting is enabled

## Sound Alerts

### Default Sound

Uses Web Audio API to generate a simple beep:
- Frequency: 800Hz
- Duration: 200ms
- Volume: 0.3 (30%)

### Disabling Sound

```tsx
settings.setNotificationSound(false);
```

## Toast Positions

Available positions:
- `'top-right'`
- `'top-left'`
- `'bottom-right'` (default)
- `'bottom-left'`
- `'top-center'`
- `'bottom-center'`

```tsx
settings.setToastPosition('bottom-right');
```

## Advanced Usage

### Custom Toast with Action

```tsx
notifications.notify({
  title: 'Update Available',
  message: 'Version 2.0 is ready to install',
  variant: 'info',
  duration: Infinity, // Don't auto-dismiss
  action: {
    label: 'Install Now',
    onClick: () => installUpdate(),
  },
});
```

### Dismissing Toasts

```tsx
// Dismiss specific toast
const toastId = notifications.success('Upload complete');
notifications.dismiss(toastId);

// Dismiss all toasts
notifications.dismissAll();
```

### Notification Stack Limit

The system limits toast count to prevent overflow:

```tsx
<ToastProvider maxToasts={5}>
  {/* Oldest toasts are removed when limit is reached */}
</ToastProvider>
```

## Integration Examples

### Transfer Manager Integration

```tsx
// In your transfer manager
const handleTransferComplete = (transfer: Transfer) => {
  notifications.notifyTransferComplete(
    transfer.fileName,
    transfer.direction
  );
};

const handleTransferError = (transfer: Transfer, error: Error) => {
  notifications.notifyTransferFailed(
    transfer.fileName,
    error.message,
    () => retryTransfer(transfer.id)
  );
};
```

### Connection Manager Integration

```tsx
// In your connection manager
const handleConnection = (device: Device, type: 'p2p' | 'relay') => {
  notifications.notifyConnectionEstablished(device.name, type);
};

const handleDisconnection = (device: Device) => {
  notifications.notifyConnectionLost(device.name);
};
```

### Device Discovery Integration

```tsx
// In your discovery manager
const handleDeviceFound = (device: Device) => {
  if (settings.notifyOnDeviceDiscovered) {
    notifications.notifyDeviceDiscovered(device.name);
  }
};
```

## Demo Component

Test all notification features:

```tsx
import { NotificationDemo } from '@/components/ui/NotificationDemo';

// Shows interactive demo of all notification types
<NotificationDemo />
```

## Accessibility

### ARIA Support

- Toast container has `role="region"` and `aria-label="Notifications"`
- Individual toasts have `role="status"` and `aria-live="polite"`
- Screen readers announce new notifications

### Keyboard Support

- Toasts can be dismissed with close button (keyboard accessible)
- Action buttons are keyboard accessible
- Focus management for dialogs

### Reduced Motion

Respects `prefers-reduced-motion`:
- Disables slide animations
- Uses simple fade transitions

## Files

### Core Files

- `components/ui/Toast.tsx` - Toast component
- `components/ui/Toast.module.css` - Toast styles
- `components/ui/ToastProvider.tsx` - Toast context and provider
- `components/ui/ToastProvider.module.css` - Provider styles
- `lib/hooks/use-toast.ts` - Toast hook re-export
- `lib/hooks/use-notifications.ts` - Main notification hook

### Utilities

- `lib/utils/browser-notifications.ts` - Browser notification manager
- `lib/utils/notification-manager.ts` - Central notification coordinator

### Components

- `components/transfer/IncomingTransferDialog.tsx` - Incoming transfer UI
- `components/transfer/IncomingTransferDialog.module.css` - Dialog styles
- `components/ui/NotificationDemo.tsx` - Demo component

### Integration

- `lib/integrations/notification-integration.ts` - Store integration
- `lib/stores/settings-store.ts` - Settings with notification preferences

## Best Practices

### 1. Use Semantic Variants

```tsx
// Good
notifications.success('File uploaded successfully');
notifications.error('Upload failed: Network error');

// Avoid
notifications.info('Error: Something went wrong'); // Wrong variant
```

### 2. Provide Context

```tsx
// Good
notifications.error('Failed to upload document.pdf: No space left');

// Avoid
notifications.error('Failed'); // Too vague
```

### 3. Use Actions for Recovery

```tsx
// Good
notifications.notifyTransferFailed(fileName, error, () => retry());

// Avoid
notifications.error('Transfer failed'); // No recovery option
```

### 4. Respect User Preferences

```tsx
// Good
if (settings.notifyOnDeviceDiscovered) {
  notifications.notifyDeviceDiscovered(deviceName);
}

// Avoid
// Always showing notifications regardless of settings
```

### 5. Don't Spam

```tsx
// Good - Throttle similar notifications
const lastNotified = useRef<number>(0);
if (Date.now() - lastNotified.current > 5000) {
  notifications.info('Scanning for devices...');
  lastNotified.current = Date.now();
}

// Avoid - Showing notification on every update
onDeviceScan(() => notifications.info('Scanning...'));
```

## Troubleshooting

### Browser Notifications Not Showing

1. Check permission status: `notifications.isBrowserNotificationsAvailable`
2. Ensure setting is enabled: `settings.browserNotifications`
3. Verify app is in background: Browser notifications only show when `document.hidden`

### Sound Not Playing

1. Check setting: `settings.notificationSound`
2. User interaction required: Some browsers block audio until user interacts with page
3. Check browser console for errors

### Toasts Not Appearing

1. Verify ToastProvider is in layout
2. Check that hook is used inside ToastProvider
3. Look for errors in browser console

## TypeScript Types

```tsx
// Toast types
type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Notification options
interface NotifyOptions {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Browser notification options
interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: unknown;
  onClick?: () => void;
}
```

## Performance

### Toast Rendering

- Toasts use CSS animations (hardware accelerated)
- Limited stack size prevents performance issues
- Auto-dismiss prevents toast buildup

### Browser Notifications

- Only shown when app is in background
- Tagged to prevent duplicates
- Automatic cleanup

### Sound Playback

- Uses Web Audio API (efficient)
- Minimal memory footprint
- No external audio files needed

## Summary

The notification system provides:

- ✅ Toast notifications for in-app feedback
- ✅ Browser notifications for background events
- ✅ Sound alerts for important events
- ✅ User preference controls
- ✅ Automatic integration with stores
- ✅ Specialized UI for incoming transfers
- ✅ Full TypeScript support
- ✅ Accessibility compliance
- ✅ Reduced motion support
- ✅ Mobile responsive

All notification types are accessible via the `useNotifications()` hook with full type safety and user preference enforcement.
