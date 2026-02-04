# Feedback Components

Production-ready feedback and notification components for Tallow. Built with React 19, TypeScript strict mode, and CSS Modules.

## Components

### Toast Notifications

Portal-based toast notifications with auto-dismiss, stacking, and action buttons.

```tsx
import { ToastProvider, useToastHelpers } from '@/components/feedback';

// Wrap your app with ToastProvider
function App() {
  return (
    <ToastProvider position="top-right" maxToasts={5}>
      <YourApp />
    </ToastProvider>
  );
}

// Use in components
function MyComponent() {
  const toast = useToastHelpers();

  const handleSuccess = () => {
    toast.success('File uploaded successfully!');
  };

  const handleError = () => {
    toast.error('Failed to upload file', {
      duration: 7000,
      action: {
        label: 'Retry',
        onClick: () => console.log('Retry clicked'),
      },
    });
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

**Props:**
- `variant`: `'success' | 'error' | 'warning' | 'info'`
- `message`: Toast message
- `duration`: Auto-dismiss duration (ms), 0 for no auto-dismiss
- `action`: Optional action button `{ label: string, onClick: () => void }`
- `dismissible`: Show close button (default: true)
- `icon`: Custom icon override

**ToastProvider Props:**
- `position`: `'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'`
- `maxToasts`: Maximum number of visible toasts (default: 5)

---

### Alert

Inline alert component for contextual messages.

```tsx
import { Alert } from '@/components/feedback';

function MyComponent() {
  return (
    <Alert variant="success" title="Success!" dismissible>
      Your changes have been saved successfully.
    </Alert>
  );
}
```

**Props:**
- `variant`: `'success' | 'error' | 'warning' | 'info'`
- `title`: Optional alert title
- `children`: Alert content
- `dismissible`: Show close button (default: false)
- `onDismiss`: Callback when dismissed
- `icon`: Custom icon override

---

### Progress

Progress bar with determinate and indeterminate modes.

```tsx
import { Progress } from '@/components/feedback';

function MyComponent() {
  const [progress, setProgress] = useState(0);

  return (
    <>
      {/* Determinate progress */}
      <Progress value={progress} max={100} size="md" showLabel />

      {/* Indeterminate loading */}
      <Progress indeterminate variant="success" />
    </>
  );
}
```

**Props:**
- `value`: Current progress value (0-max)
- `max`: Maximum value (default: 100)
- `size`: `'sm' | 'md' | 'lg'`
- `variant`: `'default' | 'success' | 'warning' | 'error'`
- `showLabel`: Show percentage label
- `indeterminate`: Indeterminate loading animation

---

### Skeleton

Loading skeleton for placeholder content.

```tsx
import { Skeleton, SkeletonGroup } from '@/components/feedback';

function MyComponent() {
  return (
    <>
      {/* Single skeleton */}
      <Skeleton variant="text" width="200px" />
      <Skeleton variant="circle" width={48} height={48} />
      <Skeleton variant="rectangle" height={120} />

      {/* Multiple skeletons */}
      <SkeletonGroup count={3} variant="text" />
    </>
  );
}
```

**Skeleton Props:**
- `variant`: `'text' | 'circle' | 'rectangle'`
- `width`: Width (string or number)
- `height`: Height (string or number)
- `animated`: Enable shimmer animation (default: true)

**SkeletonGroup Props:**
- `count`: Number of skeletons
- `variant`, `width`, `height`: Same as Skeleton
- `gap`: Gap between skeletons

---

### EmptyState

Empty state display for no content scenarios.

```tsx
import { EmptyState } from '@/components/feedback';

function MyComponent() {
  return (
    <EmptyState
      title="No files found"
      description="Upload your first file to get started."
      action={{
        label: 'Upload File',
        onClick: () => console.log('Upload clicked'),
      }}
    />
  );
}
```

**Props:**
- `icon`: Custom icon (optional)
- `title`: Empty state title
- `description`: Description text (optional)
- `action`: Action button `{ label: string, onClick: () => void }`
- `children`: Additional custom content

---

### ErrorBoundary

React Error Boundary with fallback UI.

```tsx
import { ErrorBoundary } from '@/components/feedback';

function App() {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Log to error tracking service
        console.error(error, errorInfo);
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
}

// Custom fallback
function AppWithCustomFallback() {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <div>
          <h1>Oops! {error.message}</h1>
          <button onClick={resetError}>Try again</button>
        </div>
      )}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

**Props:**
- `children`: Children to wrap
- `fallback`: Custom fallback renderer `(error: Error, resetError: () => void) => ReactNode`
- `onError`: Error callback `(error: Error, errorInfo: ErrorInfo) => void`
- `showDetails`: Show error details (stack trace)

---

### ConfirmDialog

Confirmation modal for destructive or important actions.

```tsx
import { ConfirmDialog } from '@/components/feedback';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteFile();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Delete File</button>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="Delete file?"
        message="This action cannot be undone. The file will be permanently deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={loading}
      />
    </>
  );
}
```

**Props:**
- `isOpen`: Dialog open state
- `onClose`: Close handler
- `onConfirm`: Confirm handler (can be async)
- `title`: Dialog title
- `message`: Message content (ReactNode)
- `confirmLabel`: Confirm button label (default: 'Confirm')
- `cancelLabel`: Cancel button label (default: 'Cancel')
- `variant`: `'default' | 'danger'`
- `loading`: Show loading state
- `icon`: Custom icon (set to `null` to hide)

---

## Features

### Accessibility
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support
- High contrast mode support

### Performance
- CSS Modules for scoped styles
- Optimized animations
- Portal-based rendering for overlays
- Reduced motion support

### Design
- Consistent with Tallow design system
- Dark theme optimized
- Smooth animations
- Responsive layouts
- Mobile-friendly

### TypeScript
- Full type safety
- Strict mode enabled
- Exported types for all components
- IntelliSense support

---

## Best Practices

### Toast Notifications
- Keep messages concise (< 50 characters)
- Use appropriate variants (success, error, warning, info)
- Provide actions for recoverable errors
- Set reasonable durations (3-7 seconds)

### Alerts
- Use for important contextual information
- Place near related content
- Make dismissible for non-critical alerts
- Include clear titles

### Progress
- Show progress for long-running operations
- Use indeterminate for unknown duration
- Include labels for accessibility
- Update frequently for smooth animation

### Error Boundaries
- Wrap entire app or major sections
- Log errors to monitoring service
- Provide recovery actions
- Show helpful error messages

### Confirm Dialogs
- Use for destructive actions
- Write clear, specific messages
- Make consequences explicit
- Use danger variant for deletions

---

## Examples

See `C:\Users\aamir\Documents\Apps\Tallow\components\feedback\FeedbackDemo.tsx` for complete usage examples.
