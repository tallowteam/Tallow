# Toast System - Quick Reference Card

## Setup

```tsx
// app/layout.tsx
import { ToastProvider } from '@/components/ui';

<ToastProvider position="bottom-right" maxToasts={5}>
  {children}
</ToastProvider>
```

## Basic Usage

```tsx
'use client';
import { useToast } from '@/components/ui';

const { success, error, warning, info } = useToast();

// Simple messages
success('Operation successful!');
error('Operation failed');
warning('Please check your data');
info('New update available');
```

## With Options

```tsx
success('File uploaded', {
  title: 'Upload Complete',
  duration: 5000
});

error('Connection lost', {
  title: 'Network Error',
  duration: 7000
});
```

## With Actions

```tsx
const { addToast } = useToast();

addToast({
  variant: 'info',
  message: 'Download ready',
  action: {
    label: 'Download',
    onClick: () => downloadFile()
  }
});
```

## Persistent Toast

```tsx
addToast({
  variant: 'warning',
  message: 'Critical error',
  duration: Infinity  // Won't auto-dismiss
});
```

## Programmatic Control

```tsx
const { addToast, removeToast, clearAll } = useToast();

// Store toast ID
const id = addToast({ variant: 'info', message: 'Processing...' });

// Remove specific toast
removeToast(id);

// Remove all toasts
clearAll();
```

## API Cheat Sheet

### ToastProvider Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | Position | `'bottom-right'` | Toast position |
| `maxToasts` | number | `5` | Max simultaneous toasts |

### Position Options
- `'top-right'` | `'top-left'` | `'top-center'`
- `'bottom-right'` | `'bottom-left'` | `'bottom-center'`

### useToast Methods
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `success()` | `message, options?` | `string` | Success toast |
| `error()` | `message, options?` | `string` | Error toast |
| `warning()` | `message, options?` | `string` | Warning toast |
| `info()` | `message, options?` | `string` | Info toast |
| `addToast()` | `options` | `string` | Custom toast |
| `removeToast()` | `id` | `void` | Remove toast |
| `clearAll()` | - | `void` | Clear all |

### Toast Options
```typescript
{
  message: string;           // Required
  variant?: ToastVariant;    // 'success' | 'error' | 'warning' | 'info'
  title?: string;            // Optional title
  duration?: number;         // Milliseconds (default: 5000)
  action?: {                 // Optional action button
    label: string;
    onClick: () => void;
  };
}
```

## Common Patterns

### File Upload
```tsx
const id = addToast({ variant: 'info', message: 'Uploading...', duration: Infinity });
await upload();
removeToast(id);
success('Upload complete!');
```

### Try-Catch
```tsx
try {
  await operation();
  success('Success!');
} catch (err) {
  error('Failed');
}
```

### With Retry
```tsx
const retry = () => performAction();

addToast({
  variant: 'error',
  message: 'Failed to save',
  action: { label: 'Retry', onClick: retry }
});
```

### Multiple Operations
```tsx
files.forEach(file => {
  success(`${file.name} uploaded`);
});
```

### Network Status
```tsx
window.addEventListener('offline', () => {
  warning('You are offline', { duration: Infinity });
});

window.addEventListener('online', () => {
  success('Connection restored');
});
```

## Duration Guide

| Duration | Use Case |
|----------|----------|
| `2000ms` | Quick confirmation (copied, saved) |
| `3000ms` | Simple success message |
| `5000ms` | Standard message (default) |
| `7000ms` | Error messages |
| `8000ms` | Messages with actions |
| `Infinity` | Critical errors, offline status |

## Variant Guide

| Variant | Color | Use For |
|---------|-------|---------|
| `success` | Green | Successful operations, confirmations |
| `error` | Red | Errors, failures, critical issues |
| `warning` | Orange | Warnings, cautions, non-critical issues |
| `info` | Blue | Information, updates, neutral messages |

## Examples by Use Case

### Clipboard Copy
```tsx
await navigator.clipboard.writeText(text);
success('Copied to clipboard', { duration: 3000 });
```

### Form Validation
```tsx
if (!isValid) {
  warning('Please fill required fields');
  return;
}
```

### Session Expiry
```tsx
warning('Session expiring in 5 minutes', {
  action: { label: 'Extend', onClick: extendSession }
});
```

### Bulk Operations
```tsx
success(`${count} files processed`, {
  title: 'Complete',
  duration: 6000
});
```

## Accessibility

- Keyboard: Close button is keyboard accessible
- Screen Reader: Announces notifications
- ARIA: Proper role and live region
- Reduced Motion: Respects user preferences
- Focus: Non-blocking, doesn't steal focus

## Best Practices

✅ **DO**
- Use appropriate variant for message type
- Keep messages concise (1-2 sentences)
- Set reasonable durations (3-7s)
- Use actions for user responses
- Test with keyboard and screen readers

❌ **DON'T**
- Show too many toasts at once
- Use very long messages
- Set very short durations (<2s)
- Use toasts for critical blocking errors
- Rely solely on color for meaning

## Troubleshooting

**Toast not appearing?**
- ✓ ToastProvider wraps your app
- ✓ Using useToast inside provider
- ✓ No z-index conflicts

**TypeScript errors?**
- ✓ Import types from '@/components/ui'
- ✓ All required props provided
- ✓ Correct variant names

## Files Location

```
components/ui/
├── Toast.tsx                    # Component
├── Toast.module.css             # Styles
├── ToastProvider.tsx            # Provider & hook
├── ToastProvider.module.css     # Container styles
├── ToastDemo.tsx                # Interactive demo
├── Toast.test.tsx               # Tests
├── TOAST_README.md              # Full docs
├── TOAST_QUICK_REFERENCE.md     # This file
└── TOAST_INTEGRATION_EXAMPLES.md # Examples
```

## Testing

```bash
npm test Toast.test.tsx
```

## Demo

Visit `/toast-demo` to see interactive examples.

---

**Need more help?** See `TOAST_README.md` for complete documentation.
