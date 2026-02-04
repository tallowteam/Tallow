# Feedback Components - Quick Reference

## Import
```tsx
import {
  // Notifications
  ToastProvider,
  useToastHelpers,

  // Components
  Alert,
  Progress,
  Skeleton,
  EmptyState,
  ErrorBoundary,
  ConfirmDialog,

  // Types
  type ToastVariant,
  type AlertVariant,
} from '@/components/feedback';
```

---

## Toast Notifications

### Setup (once in root layout)
```tsx
<ToastProvider position="top-right">
  <App />
</ToastProvider>
```

### Usage
```tsx
const toast = useToastHelpers();

// Simple
toast.success('Saved!');
toast.error('Failed!');
toast.warning('Be careful!');
toast.info('FYI...');

// With action
toast.error('Upload failed', {
  action: { label: 'Retry', onClick: retry }
});

// Custom duration
toast.success('Done!', { duration: 3000 });

// No auto-dismiss
toast.info('Read this', { duration: 0 });
```

---

## Alert

```tsx
// Basic
<Alert variant="success">Saved successfully!</Alert>

// With title
<Alert variant="error" title="Error">
  Something went wrong
</Alert>

// Dismissible
<Alert variant="warning" dismissible onDismiss={handleDismiss}>
  Check this out
</Alert>
```

**Variants:** `success` | `error` | `warning` | `info`

---

## Progress

```tsx
// Determinate
<Progress value={75} max={100} showLabel />

// Indeterminate
<Progress indeterminate />

// Colored
<Progress value={80} variant="success" />
<Progress value={60} variant="warning" />
<Progress value={30} variant="error" />

// Sizes
<Progress value={50} size="sm" />
<Progress value={50} size="md" />
<Progress value={50} size="lg" />
```

---

## Skeleton

```tsx
// Text
<Skeleton variant="text" width="200px" />

// Circle
<Skeleton variant="circle" width={48} height={48} />

// Rectangle
<Skeleton variant="rectangle" height={120} />

// Multiple
<SkeletonGroup count={3} variant="text" />

// No animation
<Skeleton variant="text" animated={false} />
```

---

## EmptyState

```tsx
<EmptyState
  title="No results"
  description="Try a different search term"
  action={{
    label: 'Clear filters',
    onClick: clearFilters
  }}
/>

// With custom icon
<EmptyState
  icon={<CustomIcon />}
  title="Empty"
/>
```

---

## ErrorBoundary

```tsx
// Wrap entire app
<ErrorBoundary>
  <App />
</ErrorBoundary>

// With logging
<ErrorBoundary
  onError={(error, info) => logToSentry(error)}
>
  <App />
</ErrorBoundary>

// Show details in dev
<ErrorBoundary showDetails={isDev}>
  <App />
</ErrorBoundary>

// Custom fallback
<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <h1>Oops!</h1>
      <button onClick={reset}>Retry</button>
    </div>
  )}
>
  <App />
</ErrorBoundary>
```

---

## ConfirmDialog

```tsx
const [open, setOpen] = useState(false);

<ConfirmDialog
  isOpen={open}
  onClose={() => setOpen(false)}
  onConfirm={handleDelete}
  title="Delete file?"
  message="This cannot be undone"
  variant="danger"
  confirmLabel="Delete"
  cancelLabel="Cancel"
/>

// Async confirm
<ConfirmDialog
  onConfirm={async () => {
    await deleteFile();
  }}
  loading={isDeleting}
/>

// No icon
<ConfirmDialog icon={null} {...props} />
```

---

## Common Patterns

### File Upload Flow
```tsx
const toast = useToastHelpers();
const [progress, setProgress] = useState(0);

const upload = async (file: File) => {
  try {
    await uploadFile(file, setProgress);
    toast.success('Upload complete!');
  } catch (error) {
    toast.error('Upload failed', {
      action: { label: 'Retry', onClick: () => upload(file) }
    });
  }
};

return <Progress value={progress} showLabel />;
```

### Loading State
```tsx
const [loading, setLoading] = useState(true);

if (loading) {
  return (
    <div>
      <SkeletonGroup count={3} />
    </div>
  );
}
```

### Empty List
```tsx
if (items.length === 0) {
  return (
    <EmptyState
      title="No items"
      action={{ label: 'Add item', onClick: openAddDialog }}
    />
  );
}
```

### Delete Confirmation
```tsx
const [showConfirm, setShowConfirm] = useState(false);
const toast = useToastHelpers();

const handleDelete = async () => {
  await deleteItem();
  setShowConfirm(false);
  toast.success('Deleted successfully');
};

<Button onClick={() => setShowConfirm(true)}>Delete</Button>
<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete item?"
  message="This action cannot be undone"
  variant="danger"
/>
```

### Form Validation
```tsx
const toast = useToastHelpers();

const handleSubmit = (data: FormData) => {
  if (!validate(data)) {
    toast.error('Please fix the errors');
    return;
  }

  toast.success('Form submitted!');
};

// Or use Alert for inline errors
<Alert variant="error">
  <ul>
    {errors.map(e => <li key={e}>{e}</li>)}
  </ul>
</Alert>
```

---

## Tips

### Toast
- Keep messages short (< 50 chars)
- Use appropriate variants
- Add actions for recoverable errors
- Set duration: 3-7 seconds
- Use `duration: 0` for important messages

### Alert
- Use for contextual information
- Place near related content
- Make dismissible for non-critical
- Include clear titles

### Progress
- Update frequently (> 100ms)
- Use indeterminate for unknown duration
- Always include labels for a11y
- Show during long operations (> 1s)

### Skeleton
- Match content structure
- Use during data fetching
- Don't mix with spinners
- Disable animation if too many

### EmptyState
- Provide clear next steps
- Use friendly language
- Include helpful icons
- Offer actions when possible

### ErrorBoundary
- Wrap entire app or major sections
- Log errors to monitoring
- Provide recovery actions
- Test error states

### ConfirmDialog
- Use for destructive actions
- Write clear messages
- Make consequences explicit
- Use danger variant for deletions

---

## Accessibility

All components include:
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader support
- ✅ Reduced motion support

---

## Variants Reference

### Colors
- `success` - Green (operations succeeded)
- `error` - Red (operations failed)
- `warning` - Orange (caution needed)
- `info` - Blue (informational)
- `danger` - Red (destructive action)

### Sizes
- `sm` - Small (mobile, compact UI)
- `md` - Medium (default, most cases)
- `lg` - Large (emphasis, primary actions)

---

## Performance

- Toasts use portals (no z-index issues)
- CSS animations (GPU accelerated)
- CSS Modules (scoped, tree-shakeable)
- No runtime CSS-in-JS overhead
- Reduced motion supported

---

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers
- ✅ No polyfills needed

---

## File Locations

```
components/feedback/
├── Toast.tsx / Toast.module.css
├── ToastProvider.tsx / ToastProvider.module.css
├── Alert.tsx / Alert.module.css
├── Progress.tsx / Progress.module.css
├── Skeleton.tsx / Skeleton.module.css
├── EmptyState.tsx / EmptyState.module.css
├── ErrorBoundary.tsx / ErrorBoundary.module.css
├── ConfirmDialog.tsx / ConfirmDialog.module.css
├── index.ts (exports)
├── README.md (full docs)
├── QUICK_REFERENCE.md (this file)
└── FeedbackDemo.tsx (examples)
```

---

## Resources

- Full documentation: `components/feedback/README.md`
- Live examples: `components/feedback/FeedbackDemo.tsx`
- Design system: `app/globals.css`
- TypeScript types: All exported from `index.ts`
