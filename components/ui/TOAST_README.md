# Toast Notification System

A production-ready, accessible toast notification system for React applications with TypeScript support.

## Features

- **4 Variants**: Success, Error, Warning, Info
- **Auto-dismiss**: Configurable duration with visual progress indicator
- **Animations**: Smooth enter/exit animations with reduced motion support
- **Stacking**: Support for multiple toasts displayed simultaneously
- **Actions**: Optional action buttons within toasts
- **Accessibility**: Full ARIA support with semantic HTML
- **Customizable**: Position, duration, max toasts, and more
- **TypeScript**: Full type safety and IntelliSense support
- **Responsive**: Mobile-optimized layout
- **Persistent Toasts**: Option for toasts that don't auto-dismiss

## Installation

The toast system is already installed as part of the UI component library.

```tsx
import { ToastProvider, useToast } from '@/components/ui';
```

## Quick Start

### 1. Setup Provider

Wrap your application with `ToastProvider`:

```tsx
// app/layout.tsx
import { ToastProvider } from '@/components/ui';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider position="bottom-right" maxToasts={5}>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

### 2. Use in Components

```tsx
'use client';

import { useToast } from '@/components/ui';

export function MyComponent() {
  const { success, error, warning, info } = useToast();

  const handleAction = async () => {
    try {
      await someAsyncOperation();
      success('Operation completed successfully!');
    } catch (err) {
      error('Operation failed. Please try again.');
    }
  };

  return <button onClick={handleAction}>Perform Action</button>;
}
```

## API Reference

### ToastProvider Props

```typescript
interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number; // Default: 5
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center'; // Default: 'bottom-right'
}
```

### useToast Hook

Returns an object with the following methods:

```typescript
interface ToastContextValue {
  // Convenience methods
  success: (message: string, options?: Partial<ToastOptions>) => string;
  error: (message: string, options?: Partial<ToastOptions>) => string;
  warning: (message: string, options?: Partial<ToastOptions>) => string;
  info: (message: string, options?: Partial<ToastOptions>) => string;

  // Advanced method
  addToast: (options: ToastOptions) => string;

  // Management
  removeToast: (id: string) => void;
  clearAll: () => void;

  // State
  toasts: ToastProps[];
}
```

### Toast Options

```typescript
interface ToastOptions {
  message: string;              // Required: Toast message
  variant?: ToastVariant;       // 'success' | 'error' | 'warning' | 'info'
  title?: string;               // Optional title
  duration?: number;            // Duration in ms (default: 5000)
                                // Use Infinity for persistent toasts
  action?: {                    // Optional action button
    label: string;
    onClick: () => void;
  };
}
```

## Usage Examples

### Basic Usage

```tsx
const { success, error, warning, info } = useToast();

// Simple success message
success('File uploaded successfully!');

// Error with custom duration
error('Connection failed', { duration: 7000 });

// Warning with title
warning('Storage almost full', {
  title: 'Warning',
  duration: 6000
});

// Info message
info('New version available');
```

### With Titles

```tsx
const { success, error } = useToast();

success('Your changes have been saved', {
  title: 'Success',
  duration: 5000
});

error('Unable to connect to server', {
  title: 'Connection Error',
  duration: 7000
});
```

### With Action Buttons

```tsx
const { addToast } = useToast();

addToast({
  variant: 'info',
  title: 'Download Ready',
  message: 'Your file is ready to download',
  action: {
    label: 'Download Now',
    onClick: () => {
      // Handle download
      window.open('/download/file.pdf', '_blank');
    }
  }
});
```

### Persistent Toasts

```tsx
const { addToast } = useToast();

// Toast that stays until manually closed
addToast({
  variant: 'warning',
  title: 'Important',
  message: 'Please review before proceeding',
  duration: Infinity
});
```

### Custom Duration

```tsx
const { info } = useToast();

// 10 second toast
info('This message will stay for 10 seconds', {
  duration: 10000
});

// 2 second toast
info('Quick message', {
  duration: 2000
});
```

### Multiple Toasts

```tsx
const { success } = useToast();

// Show multiple toasts at once
success('First file uploaded');
success('Second file uploaded');
success('Third file uploaded');
```

### Programmatic Control

```tsx
const { addToast, removeToast } = useToast();

// Store the toast ID
const toastId = addToast({
  variant: 'info',
  message: 'Processing...',
  duration: Infinity
});

// Later, remove specific toast
setTimeout(() => {
  removeToast(toastId);
}, 3000);
```

### Clear All Toasts

```tsx
const { clearAll } = useToast();

// Remove all visible toasts
clearAll();
```

## Real-World Examples

### File Upload

```tsx
const { success, error, addToast } = useToast();

async function handleUpload(file: File) {
  const toastId = addToast({
    variant: 'info',
    message: 'Uploading file...',
    duration: Infinity
  });

  try {
    await uploadFile(file);
    removeToast(toastId);
    success('File uploaded successfully!', {
      title: 'Upload Complete'
    });
  } catch (err) {
    removeToast(toastId);
    error('Upload failed. Please try again.', {
      title: 'Upload Error'
    });
  }
}
```

### Form Submission

```tsx
const { success, error } = useToast();

async function handleSubmit(data: FormData) {
  try {
    await submitForm(data);
    success('Your form has been submitted', {
      title: 'Success',
      duration: 5000
    });
  } catch (err) {
    error('Form submission failed. Please check your data.', {
      title: 'Validation Error',
      duration: 7000
    });
  }
}
```

### Network Status

```tsx
const { warning, success } = useToast();

useEffect(() => {
  function handleOnline() {
    success('Connection restored', {
      title: 'Back Online'
    });
  }

  function handleOffline() {
    warning('No internet connection', {
      title: 'Offline',
      duration: Infinity
    });
  }

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, [success, warning]);
```

### Undo Action

```tsx
const { addToast } = useToast();

function handleDelete(item: Item) {
  const deletedItem = item;

  addToast({
    variant: 'info',
    message: `Deleted "${item.name}"`,
    action: {
      label: 'Undo',
      onClick: () => {
        restoreItem(deletedItem);
        success('Item restored');
      }
    },
    duration: 5000
  });

  performDelete(item);
}
```

## Styling

The toast system uses CSS Modules and design tokens from `globals.css`. All styles are fully customizable through CSS variables.

### Available CSS Variables

```css
/* Used by toast system */
--color-success
--color-error
--color-warning
--color-info
--color-surface-elevated
--color-border
--color-text
--color-text-secondary
--z-toast
--radius-lg
--shadow-xl
--transition-base
```

### Custom Styling

Override styles in your own CSS:

```css
/* Custom toast styles */
.toast {
  /* Your custom styles */
}

/* Variant overrides */
.toast.success {
  border-left-color: your-color;
}
```

## Accessibility

The toast system is fully accessible:

- **ARIA Attributes**: `role="status"`, `aria-live="polite"`, `aria-atomic="true"`
- **Keyboard Navigation**: Close button is focusable and keyboard accessible
- **Screen Reader Support**: Proper announcements for all toast types
- **Focus Management**: Doesn't trap or steal focus
- **Reduced Motion**: Respects `prefers-reduced-motion` setting

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile browsers: Latest versions

## Performance

- **Optimized Animations**: Hardware-accelerated CSS animations
- **Automatic Cleanup**: Old toasts are automatically removed
- **Minimal Rerenders**: Optimized with React hooks and memoization
- **Small Bundle Size**: ~3KB gzipped (including styles)

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import { ToastVariant, ToastProps, ToastProviderProps } from '@/components/ui';

// All types are exported and documented
```

## Testing

Comprehensive test suite included:

```bash
npm test Toast.test.tsx
```

Tests cover:
- Basic rendering
- All variants
- Auto-dismiss functionality
- Manual close
- Action buttons
- Multiple toasts
- Position variants
- Accessibility
- Edge cases

## Best Practices

1. **Use appropriate variants**: Match the variant to the message type
2. **Keep messages concise**: Short, clear messages work best
3. **Set reasonable durations**: 3-7 seconds for most messages
4. **Use titles sparingly**: For important or complex notifications
5. **Limit actions**: One action per toast maximum
6. **Consider persistence**: Use `Infinity` duration for critical errors
7. **Don't spam toasts**: Use `maxToasts` to prevent overwhelming users
8. **Test accessibility**: Always test with keyboard and screen readers

## Troubleshooting

### Toast not appearing

- Ensure `ToastProvider` wraps your app
- Check that you're using `useToast` inside the provider
- Verify no CSS conflicts with z-index

### Toasts appearing in wrong position

- Check `position` prop on `ToastProvider`
- Verify no parent elements with `overflow: hidden`

### TypeScript errors

- Ensure you're importing types correctly
- Check that all required props are provided
- Update `@types/react` if needed

## Migration Guide

If migrating from another toast library:

```tsx
// Before (react-toastify)
import { toast } from 'react-toastify';
toast.success('Success!');

// After (Tallow Toast)
import { useToast } from '@/components/ui';
const { success } = useToast();
success('Success!');
```

## License

Part of the Tallow component library.
