# Notification System - Quick Reference

## Setup

```tsx
// Already configured in app/layout.tsx
import { ToastProvider } from '@/components/ui/ToastProvider';

<ToastProvider position="bottom-right" maxToasts={5}>
  {children}
</ToastProvider>
```

## Basic Usage

```tsx
import { useNotifications } from '@/lib/hooks/use-notifications';

function MyComponent() {
  const notifications = useNotifications();

  // Basic toasts
  notifications.success('Success!');
  notifications.error('Error occurred');
  notifications.warning('Warning message');
  notifications.info('Information');

  // With title
  notifications.success('File uploaded successfully!', {
    title: 'Upload Complete',
  });

  // With action
  notifications.error('Upload failed', {
    action: {
      label: 'Retry',
      onClick: () => retry(),
    },
  });
}
```

## Transfer Notifications

```tsx
// Transfer started
notifications.notifyTransferStarted('file.pdf', 'MacBook Pro');

// Transfer complete
notifications.notifyTransferComplete('file.pdf', 'received');

// Transfer failed
notifications.notifyTransferFailed('file.pdf', 'Error message', () => retry());
```

## Connection Notifications

```tsx
// Connected
notifications.notifyConnectionEstablished('MacBook Pro', 'p2p');

// Disconnected
notifications.notifyConnectionLost('MacBook Pro');
```

## Device Notifications

```tsx
notifications.notifyDeviceDiscovered('New iPhone');
```

## Incoming Transfer Request

```tsx
// Show dialog with accept/reject
notifications.notifyIncomingTransferRequest(
  'MacBook Pro',
  'document.pdf',
  () => acceptTransfer(),
  () => rejectTransfer()
);
```

## Settings

```tsx
import { useSettingsStore } from '@/lib/stores';

const settings = useSettingsStore();

// Enable/disable notifications
settings.setNotificationSound(true);
settings.setBrowserNotifications(true);
settings.setNotifyOnTransferComplete(true);
settings.setNotifyOnIncomingTransfer(true);
settings.setNotifyOnConnectionChange(true);
settings.setNotifyOnDeviceDiscovered(false);

// Change toast position
settings.setToastPosition('bottom-right');
```

## Auto-Integration

```tsx
// Add to your main app component
import { useNotificationIntegration } from '@/lib/integrations/notification-integration';

function App() {
  useNotificationIntegration(); // Automatic notifications for store events
  return <div>...</div>;
}
```

## Dismissing Toasts

```tsx
// Dismiss specific
const id = notifications.success('Done!');
notifications.dismiss(id);

// Dismiss all
notifications.dismissAll();
```

## Browser Notifications

```tsx
// Request permission
await notifications.requestPermission();

// Check status
const isAvailable = notifications.isBrowserNotificationsAvailable;
const isDenied = notifications.isBrowserNotificationsDenied;
```

## Incoming Transfer Dialog

```tsx
import { IncomingTransferDialog } from '@/components/transfer';

<IncomingTransferDialog
  open={show}
  deviceName="MacBook Pro"
  fileName="document.pdf"
  fileSize={2048576}
  fileType="application/pdf"
  onAccept={() => accept()}
  onReject={() => reject()}
/>
```

## Toast Variants

- `success` - Green, checkmark icon
- `error` - Red, error icon
- `warning` - Yellow, warning icon
- `info` - Blue, info icon

## Toast Positions

- `top-right`
- `top-left`
- `bottom-right` (default)
- `bottom-left`
- `top-center`
- `bottom-center`

## Duration

```tsx
// Default: 5000ms
notifications.success('Default');

// Custom duration
notifications.info('Quick message', { duration: 2000 });

// Never auto-dismiss
notifications.info('Important', { duration: Infinity });
```

## Files

### Hooks
- `lib/hooks/use-notifications.ts` - Main hook
- `lib/hooks/use-toast.ts` - Toast hook

### Components
- `components/ui/Toast.tsx` - Toast component
- `components/ui/ToastProvider.tsx` - Provider
- `components/transfer/IncomingTransferDialog.tsx` - Transfer dialog

### Utils
- `lib/utils/browser-notifications.ts` - Browser notifications
- `lib/utils/notification-manager.ts` - Central manager

### Integration
- `lib/integrations/notification-integration.ts` - Store integration
