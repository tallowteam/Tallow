# Feedback Components - Installation Guide

## Quick Start (3 Steps)

### 1. Verify Files
All feedback component files should be in:
```
C:\Users\aamir\Documents\Apps\Tallow\components\feedback\
```

Check that you have:
- ✅ Toast.tsx / Toast.module.css
- ✅ ToastProvider.tsx / ToastProvider.module.css
- ✅ Alert.tsx / Alert.module.css
- ✅ Progress.tsx / Progress.module.css
- ✅ Skeleton.tsx / Skeleton.module.css
- ✅ EmptyState.tsx / EmptyState.module.css
- ✅ ErrorBoundary.tsx / ErrorBoundary.module.css
- ✅ ConfirmDialog.tsx / ConfirmDialog.module.css
- ✅ index.ts (barrel export)

### 2. Add ToastProvider to Root Layout

Edit `C:\Users\aamir\Documents\Apps\Tallow\app\layout.tsx`:

```tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/feedback'; // Add this
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  // ... existing metadata
};

export const viewport: Viewport = {
  // ... existing viewport
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {/* Wrap children with ToastProvider */}
        <ToastProvider position="top-right" maxToasts={5}>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

### 3. Start Using Components

Import in any page or component:

```tsx
import {
  useToastHelpers,
  Alert,
  Progress,
  Skeleton,
  EmptyState,
  ErrorBoundary,
  ConfirmDialog,
} from '@/components/feedback';

export function MyComponent() {
  const toast = useToastHelpers();

  const handleSuccess = () => {
    toast.success('Operation completed!');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Toast</button>
      <Progress value={75} showLabel />
      <Alert variant="info">This is an alert</Alert>
    </div>
  );
}
```

---

## Verify Installation

### Test Toast Notifications

Create a test page to verify everything works:

`C:\Users\aamir\Documents\Apps\Tallow\app\feedback-test\page.tsx`:

```tsx
'use client';

import { useToastHelpers } from '@/components/feedback';
import { Button } from '@/components/ui/Button';

export default function FeedbackTestPage() {
  const toast = useToastHelpers();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Feedback Components Test</h1>
      <Button onClick={() => toast.success('It works!')}>
        Test Toast
      </Button>
    </div>
  );
}
```

Visit `http://localhost:3000/feedback-test` and click the button. You should see a green toast notification in the top-right corner.

---

## TypeScript Setup

No additional TypeScript configuration needed! All types are exported from the components.

For better IntelliSense, ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## Common Integration Points

### 1. File Upload Progress

Replace existing progress indicators:

```tsx
import { Progress, useToastHelpers } from '@/components/feedback';

function FileUpload() {
  const toast = useToastHelpers();
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file: File) => {
    try {
      await uploadWithProgress(file, setProgress);
      toast.success('File uploaded successfully!');
    } catch (error) {
      toast.error('Upload failed', {
        action: { label: 'Retry', onClick: () => handleUpload(file) }
      });
    }
  };

  return <Progress value={progress} showLabel />;
}
```

### 2. Loading States

Replace spinners with skeletons:

```tsx
import { Skeleton, SkeletonGroup } from '@/components/feedback';

function DeviceList() {
  const { devices, loading } = useDevices();

  if (loading) {
    return (
      <div>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} style={{ marginBottom: '1rem' }}>
            <Skeleton variant="circle" width={48} height={48} />
            <SkeletonGroup count={2} variant="text" />
          </div>
        ))}
      </div>
    );
  }

  return <>{/* Render devices */}</>;
}
```

### 3. Empty States

Replace "no data" messages:

```tsx
import { EmptyState } from '@/components/feedback';

function TransferHistory() {
  const { transfers } = useTransfers();

  if (transfers.length === 0) {
    return (
      <EmptyState
        title="No transfer history"
        description="Your completed transfers will appear here."
        action={{
          label: 'Start a transfer',
          onClick: () => router.push('/app')
        }}
      />
    );
  }

  return <>{/* Render transfers */}</>;
}
```

### 4. Error Boundaries

Wrap pages and major sections:

```tsx
import { ErrorBoundary } from '@/components/feedback';

// In app layout or page
export default function AppPage() {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Log to your error tracking service
        console.error('Error caught:', error, errorInfo);
      }}
    >
      <YourAppContent />
    </ErrorBoundary>
  );
}
```

### 5. Confirmation Dialogs

Replace window.confirm:

```tsx
import { ConfirmDialog, useToastHelpers } from '@/components/feedback';
import { useState } from 'react';

function FileManager() {
  const toast = useToastHelpers();
  const [showDelete, setShowDelete] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const handleDeleteClick = (fileId: string) => {
    setFileToDelete(fileId);
    setShowDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (fileToDelete) {
      await deleteFile(fileToDelete);
      setShowDelete(false);
      toast.success('File deleted');
    }
  };

  return (
    <>
      {/* Your file list */}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleConfirmDelete}
        title="Delete file?"
        message="This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
      />
    </>
  );
}
```

### 6. Form Validation

Use Alert for form errors:

```tsx
import { Alert } from '@/components/feedback';

function LoginForm() {
  const [errors, setErrors] = useState<string[]>([]);

  return (
    <form>
      {errors.length > 0 && (
        <Alert variant="error" title="Validation Error" dismissible>
          <ul>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}
      {/* Form fields */}
    </form>
  );
}
```

---

## Customization

### Custom Toast Positions

Available positions:
- `top-right` (default)
- `top-left`
- `top-center`
- `bottom-right`
- `bottom-left`
- `bottom-center`

```tsx
<ToastProvider position="bottom-center" maxToasts={3}>
  <App />
</ToastProvider>
```

### Custom Toast Duration

Default is 5000ms (5 seconds):

```tsx
// Longer duration
toast.success('Saved!', { duration: 7000 });

// No auto-dismiss
toast.info('Important!', { duration: 0 });

// Shorter duration
toast.info('Quick message', { duration: 2000 });
```

### Custom Icons

All icon components accept custom icons:

```tsx
import { Alert } from '@/components/feedback';
import { CustomIcon } from './icons';

<Alert variant="success" icon={<CustomIcon />}>
  Custom icon alert
</Alert>
```

---

## Testing

### Unit Testing Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from '@/components/feedback';

describe('Alert', () => {
  it('renders with title and message', () => {
    render(
      <Alert variant="success" title="Success">
        Operation completed
      </Alert>
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('calls onDismiss when close button clicked', () => {
    const handleDismiss = jest.fn();

    render(
      <Alert dismissible onDismiss={handleDismiss}>
        Test alert
      </Alert>
    );

    fireEvent.click(screen.getByLabelText('Dismiss alert'));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { ToastProvider, useToastHelpers } from '@/components/feedback';

function TestComponent() {
  const toast = useToastHelpers();

  return (
    <button onClick={() => toast.success('Test toast')}>
      Show Toast
    </button>
  );
}

describe('Toast Integration', () => {
  it('shows toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Toast'));

    await waitFor(() => {
      expect(screen.getByText('Test toast')).toBeInTheDocument();
    });
  });
});
```

---

## Troubleshooting

### Toast Not Showing

1. Verify ToastProvider is in root layout
2. Check that you're using `useToastHelpers()` inside a component
3. Ensure the component is within the ToastProvider tree

```tsx
// ❌ Wrong - outside provider
const toast = useToastHelpers(); // Error!

function App() {
  return <ToastProvider>...</ToastProvider>;
}

// ✅ Correct - inside provider
function App() {
  return (
    <ToastProvider>
      <MyComponent />
    </ToastProvider>
  );
}

function MyComponent() {
  const toast = useToastHelpers(); // Works!
  return <button onClick={() => toast.success('Hi')}>Test</button>;
}
```

### TypeScript Errors

If you see "Cannot find module '@/components/feedback'":

1. Check `tsconfig.json` has path mapping:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

2. Restart your TypeScript server in VS Code:
   - Ctrl+Shift+P
   - "TypeScript: Restart TS Server"

### CSS Not Loading

If styles aren't applied:

1. Ensure CSS Modules are enabled in `next.config.ts`:
```ts
const nextConfig = {
  // CSS Modules enabled by default in Next.js
};
```

2. Check that `.module.css` files are in the same directory as `.tsx` files

3. Clear Next.js cache:
```bash
rm -rf .next
npm run dev
```

### Portal Issues

If toasts aren't appearing at the top level:

1. Ensure `document.body` exists (components are client-side only)
2. Check z-index in CSS (should use `--z-tooltip`)
3. Verify no conflicting fixed/absolute positioning in parent elements

---

## Performance Tips

1. **Limit Toast Count**
   ```tsx
   <ToastProvider maxToasts={3}> // Don't show too many at once
   ```

2. **Use Skeleton Over Spinners**
   - Skeletons match content layout
   - Better perceived performance
   - Less distracting

3. **Lazy Load Demo Component**
   ```tsx
   const FeedbackDemo = lazy(() => import('@/components/feedback/FeedbackDemo'));
   ```

4. **Memoize Callbacks**
   ```tsx
   const handleSuccess = useCallback(() => {
     toast.success('Done!');
   }, [toast]);
   ```

---

## Next Steps

1. ✅ Install components (add ToastProvider)
2. ✅ Test with simple toast
3. ✅ Replace existing notifications
4. ✅ Add error boundaries to pages
5. ✅ Use progress in file transfers
6. ✅ Use skeletons for loading
7. ✅ Use empty states in lists
8. ✅ Add confirmation dialogs

---

## Support

- Full documentation: `components/feedback/README.md`
- Quick reference: `components/feedback/QUICK_REFERENCE.md`
- Examples: `components/feedback/FeedbackDemo.tsx`
- Summary: `FEEDBACK_COMPONENTS_SUMMARY.md`

---

## Version

- React: 19.2.3
- TypeScript: 5.x (strict mode)
- Next.js: 16.x
- Created: 2026-02-03
