# Toast Notification System

Enhanced toast notification system for Tallow using Sonner with custom variants, actions, and undo functionality.

## Overview

The toast system provides:
- Custom toast variants (success, error, warning, info, loading)
- Action buttons with icons
- Undo functionality for reversible actions
- Toast queue management to prevent spam
- Persistent error toasts
- ARIA live regions for accessibility
- Specialized toasts for common operations

## Installation

The toast system is already integrated. Import it in your components:

```tsx
import { toast } from '@/lib/utils/toast';
```

## Basic Usage

### Simple Toasts

```tsx
// Success
toast.success('Operation completed successfully!');

// Error
toast.error('Something went wrong');

// Warning
toast.warning('Please review your settings');

// Info
toast.info('New update available');

// Loading
const toastId = toast.loading('Processing...');
// Later dismiss it
toast.dismiss(toastId);
```

### With Descriptions

```tsx
toast.success('Settings saved', {
  description: 'Your changes have been applied'
});
```

### With Custom Duration

```tsx
toast.info('Connection established', {
  duration: 5000 // 5 seconds
});
```

## Advanced Features

### Toast with Actions

Add clickable actions to toasts:

```tsx
toast.success('File downloaded', {
  action: {
    label: 'Open',
    onClick: () => {
      // Open the file
    },
    icon: <Download className="w-4 h-4" />
  }
});
```

### Persistent Error Toasts

Errors persist by default until dismissed:

```tsx
toast.error('Connection failed', {
  persist: true, // Optional, errors persist by default
  action: {
    label: 'Retry',
    onClick: () => {
      // Retry logic
    }
  }
});
```

### Toast with Undo

Perfect for destructive actions:

```tsx
toast.withUndo('File deleted', () => {
  // Undo the deletion
  restoreFile();
});

// Or use the fileDeleted helper
toast.fileDeleted('document.pdf', () => {
  restoreFile();
});
```

### Promise Toasts

Show loading state and handle success/error automatically:

```tsx
const uploadPromise = uploadFile();

toast.promise(uploadPromise, {
  loading: 'Uploading file...',
  success: (data) => `${data.name} uploaded successfully!`,
  error: 'Upload failed'
});
```

## Specialized Toast Helpers

### File Operations

```tsx
// File copied
toast.fileCopied('document.pdf');

// File downloaded
toast.fileDownloaded('report.xlsx');

// File uploaded (single or multiple)
toast.fileUploaded('image.png');
toast.fileUploaded('5 files', 5);

// File deleted with undo
toast.fileDeleted('old-file.txt', () => restoreFile());
```

### Connection Toasts

```tsx
// Connected
toast.connected('MacBook Pro');

// Disconnected
toast.disconnected('MacBook Pro');

// Connection error with retry
toast.connectionError('Timeout');
```

### Transfer Toasts

```tsx
// Transfer started
toast.transferStarted('large-file.zip');

// Transfer complete with download action
toast.transferComplete('large-file.zip', () => {
  downloadFile();
});

// Transfer failed
toast.transferFailed('Network error');
```

### Clipboard Toasts

```tsx
// Copied to clipboard
toast.copiedToClipboard('Short text');
toast.copiedToClipboard(); // Generic message
```

### Settings Toasts

```tsx
// Settings saved
toast.settingsSaved();

// Settings reset with undo
toast.settingsReset(() => {
  restoreSettings();
});
```

### Security Toasts

```tsx
// Encryption enabled
toast.encryptionEnabled();

// Security warning (longer duration)
toast.securityWarning('Unencrypted connection detected');
```

## Queue Management

The toast system automatically manages a queue to prevent spam:

- Maximum 3 concurrent toasts
- Duplicate messages are suppressed
- Auto-cleanup after toast duration

```tsx
// These will be queued if more than 3 are shown
toast.info('Message 1');
toast.info('Message 2');
toast.info('Message 3');
toast.info('Message 4'); // Queued
```

## Dismissing Toasts

```tsx
// Dismiss a specific toast
const toastId = toast.success('Done');
toast.dismiss(toastId);

// Dismiss all toasts
toast.dismissAll();
```

## Accessibility

All toasts include:
- ARIA live regions for screen readers
- Keyboard navigation support
- Focus management
- High contrast mode support
- Reduced motion support

## Styling

Toasts automatically adapt to your theme:
- Light/dark mode support
- Custom color variants for each type
- Consistent with Tallow's design system
- Smooth animations with easing curves
- Mobile-responsive

## Best Practices

### DO:
- Use `success` for confirmations
- Use `error` for failures (they persist by default)
- Use `warning` for cautions that need attention
- Use `info` for status updates
- Provide undo for destructive actions
- Keep messages concise and clear

### DON'T:
- Don't spam users with too many toasts
- Don't use toasts for critical errors (use dialogs)
- Don't make success toasts persistent
- Don't use loading toasts without dismissing them

## Examples

### File Upload Flow

```tsx
// Start
const toastId = toast.loading('Uploading files...');

try {
  await uploadFiles();
  toast.dismiss(toastId);
  toast.fileUploaded('5 files', 5);
} catch (error) {
  toast.dismiss(toastId);
  toast.error('Upload failed', {
    action: {
      label: 'Retry',
      onClick: () => uploadFiles()
    }
  });
}
```

### Delete with Undo

```tsx
const handleDelete = (file: File) => {
  const backup = file;

  toast.withUndo(`Deleted ${file.name}`, () => {
    // Restore the file
    restoreFile(backup);
  });

  // Perform the deletion
  deleteFile(file);
};
```

### Connection Status

```tsx
connection.on('connect', (device) => {
  toast.connected(device.name);
});

connection.on('disconnect', (device) => {
  toast.disconnected(device.name);
});

connection.on('error', (error) => {
  toast.connectionError(error.message);
});
```

## API Reference

### Main Toast Functions

- `toast.success(message, options?)` - Success toast
- `toast.error(message, options?)` - Error toast (persistent)
- `toast.warning(message, options?)` - Warning toast
- `toast.info(message, options?)` - Info toast
- `toast.loading(message, options?)` - Loading toast
- `toast.withUndo(message, onUndo, options?)` - Toast with undo action

### Specialized Helpers

- `toast.fileCopied(filename)`
- `toast.fileDownloaded(filename)`
- `toast.fileUploaded(filename, count?)`
- `toast.fileDeleted(filename, onUndo?)`
- `toast.connected(deviceName)`
- `toast.disconnected(deviceName?)`
- `toast.connectionError(error)`
- `toast.transferStarted(filename)`
- `toast.transferComplete(filename, downloadAction?)`
- `toast.transferFailed(error)`
- `toast.copiedToClipboard(content?)`
- `toast.settingsSaved()`
- `toast.settingsReset(onUndo?)`
- `toast.encryptionEnabled()`
- `toast.securityWarning(message)`

### Utility Methods

- `toast.dismiss(id?)` - Dismiss specific or all toasts
- `toast.dismissAll()` - Dismiss all toasts
- `toast.promise(promise, options)` - Promise-based toast

### Options Interface

```typescript
interface CustomToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  persist?: boolean;
  id?: string;
}
```

## Testing

Toast examples component available at:
```tsx
import { ToastExamples } from '@/components/ui/toast-examples';
```

Add it to any page to test all toast variants.
