# Rich Notifications Implementation Guide

Complete guide for implementing and using rich notifications with file preview thumbnails in the Tallow project.

## Overview

The rich notifications system extends the existing Toast component to support:
- Image preview thumbnails (48x48px)
- File previews with name and size
- Transfer progress indicators
- Multiple action buttons
- Backward compatibility with existing toasts

## Component API

### Toast Component

#### ToastPreview Interface

```typescript
interface ToastPreview {
  type: 'image' | 'file' | 'transfer';
  src?: string;           // Image URL for image preview
  fileName?: string;       // File name to display
  fileSize?: string;       // Human-readable file size (e.g., "2.4 MB")
  progress?: number;       // Progress percentage (0-100)
}
```

#### ToastAction Interface

```typescript
interface ToastAction {
  label: string;
  onClick: () => void;
}
```

#### ToastProps Interface

```typescript
interface ToastProps {
  id: string;
  title?: string;
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
  action?: ToastAction;        // Single action (legacy)
  actions?: ToastAction[];     // Multiple actions (new)
  preview?: ToastPreview;      // Rich content preview
}
```

## Usage Examples

### 1. Image Preview Notification

```typescript
import { useToast } from '@/components/ui/ToastProvider';

const toast = useToast();

toast.addToast({
  title: 'Image Received',
  message: 'vacation-photo.jpg',
  variant: 'success',
  duration: 7000,
  preview: {
    type: 'image',
    src: 'https://example.com/image.jpg',
    fileName: 'vacation-photo.jpg',
    fileSize: '2.4 MB',
  },
  actions: [
    {
      label: 'View',
      onClick: () => window.open(imageSrc, '_blank'),
    },
    {
      label: 'Save',
      onClick: () => saveImage(),
    },
  ],
});
```

### 2. File Preview Notification

```typescript
toast.addToast({
  title: 'File Ready',
  message: 'document.pdf is ready to transfer',
  variant: 'info',
  duration: 10000,
  preview: {
    type: 'file',
    fileName: 'presentation-final.pdf',
    fileSize: '5.2 MB',
  },
  actions: [
    {
      label: 'Accept',
      onClick: () => acceptTransfer(),
    },
    {
      label: 'Reject',
      onClick: () => rejectTransfer(),
    },
  ],
});
```

### 3. Transfer Progress Notification

```typescript
// Initial notification
const toastId = toast.addToast({
  title: 'Transferring',
  message: 'video-recording.mp4',
  variant: 'info',
  duration: Infinity, // Don't auto-dismiss
  preview: {
    type: 'transfer',
    fileName: 'video-recording.mp4',
    progress: 0,
  },
});

// Update progress (you'll need to implement toast updating)
// On completion:
toast.removeToast(toastId);
toast.success('Transfer complete', {
  preview: {
    type: 'transfer',
    fileName: 'video-recording.mp4',
    progress: 100,
  },
});
```

### 4. Incoming Transfer Request

```typescript
toast.addToast({
  title: 'Incoming Transfer Request',
  message: 'John\'s iPhone wants to send you a file',
  variant: 'warning',
  duration: 30000,
  preview: {
    type: 'file',
    fileName: 'budget-2024.xlsx',
    fileSize: '1.8 MB',
  },
  actions: [
    {
      label: 'Accept',
      onClick: () => acceptTransfer(),
    },
    {
      label: 'Reject',
      onClick: () => rejectTransfer(),
    },
  ],
});
```

## Notification Manager Integration

The `notificationManager` utility now includes helper methods for rich notifications:

### showFileNotification

```typescript
await notificationManager.showFileNotification(
  'document.pdf',
  '5.2 MB',
  'https://example.com/thumbnail.jpg' // Optional thumbnail
);
```

### showTransferNotification

```typescript
await notificationManager.showTransferNotification(
  'transfer-123',
  75, // Progress percentage
  'video.mp4'
);
```

### showImageNotification

```typescript
await notificationManager.showImageNotification(
  'https://example.com/image.jpg',
  'photo.jpg'
);
```

## Styling

### CSS Custom Properties Used

The rich notifications use the following CSS custom properties:

```css
/* Backgrounds */
--bg-base
--bg-surface
--bg-elevated
--bg-overlay
--bg-hover

/* Borders */
--border-default
--border-strong
--border-focus

/* Text */
--text-primary
--text-secondary
--text-tertiary

/* Colors */
--accent
--success-500
--error-500
--warning-500
--info-500

/* Spacing */
--space-1 through --space-8

/* Border Radius */
--radius-sm
--radius-md
--radius-lg
--radius-full

/* Transitions */
--transition-fast
--transition-base
```

### Custom Styling

You can customize the appearance by overriding CSS classes:

```css
/* Custom preview size */
.previewContainer {
  width: 64px;
  height: 64px;
}

/* Custom action button style */
.actionButton {
  background: var(--accent);
  color: white;
}
```

## Accessibility

### Keyboard Navigation

- All action buttons are keyboard accessible
- Close button has proper focus styles
- Toast container has `role="status"` and `aria-live="polite"`

### Screen Readers

- Image previews include alt text from fileName
- Progress indicators include text percentage
- Action buttons have descriptive labels

### Reduced Motion

Users with `prefers-reduced-motion` enabled will see simplified animations.

## Best Practices

### 1. File Size Formatting

Always format file sizes in a human-readable format:

```typescript
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
```

### 2. Image Optimization

For image previews:
- Use appropriate image sizes (48x48px or 96x96px for retina)
- Implement lazy loading
- Use placeholder while loading
- Handle image loading errors

```typescript
preview: {
  type: 'image',
  src: `${imageUrl}?w=96&h=96&fit=crop`, // Use image CDN parameters
  fileName: 'photo.jpg',
  fileSize: formatFileSize(fileSize),
}
```

### 3. Action Button Design

- Use clear, action-oriented labels (Accept/Reject, View/Download)
- Limit to 2-3 actions per notification
- Place primary action first
- Consider destructive action styling

### 4. Duration Guidelines

```typescript
// Quick info
duration: 5000

// File received with preview
duration: 7000

// Action required
duration: 10000

// Critical action (accept/reject)
duration: 30000

// Progress indicators
duration: Infinity // Don't auto-dismiss
```

### 5. Progress Updates

For transfer progress:
- Update at reasonable intervals (every 100ms minimum)
- Show percentage in both text and progress bar
- Include estimated time remaining if available
- Show success notification on completion

## Migration Guide

### From Simple Toast to Rich Toast

Before:
```typescript
toast.success('File received: photo.jpg');
```

After:
```typescript
toast.success('File received', {
  preview: {
    type: 'image',
    src: imageUrl,
    fileName: 'photo.jpg',
    fileSize: '2.4 MB',
  },
  actions: [
    { label: 'View', onClick: () => viewImage() },
  ],
});
```

### Backward Compatibility

All existing toast calls remain functional:
- Simple toasts without `preview` work as before
- Single `action` prop still supported
- New `actions` array provides enhanced functionality

## Performance Considerations

### Image Loading

```typescript
// Preload images before showing notification
const img = new Image();
img.src = thumbnailUrl;
img.onload = () => {
  toast.addToast({
    preview: {
      type: 'image',
      src: thumbnailUrl,
      // ...
    },
  });
};
```

### Memory Management

- Remove toast references after dismissal
- Clean up event listeners
- Cancel pending operations when toast closes

### Batching

For multiple notifications:
```typescript
// Use notification grouping
notificationManager.updateGroupedNotification('transfer', fileName);
```

## Testing

### Unit Tests

```typescript
describe('Rich Toast', () => {
  it('renders image preview', () => {
    render(
      <Toast
        id="1"
        message="Image received"
        onClose={jest.fn()}
        preview={{
          type: 'image',
          src: '/test-image.jpg',
          fileName: 'test.jpg',
        }}
      />
    );

    expect(screen.getByAltText('test.jpg')).toBeInTheDocument();
  });

  it('renders multiple action buttons', () => {
    render(
      <Toast
        id="1"
        message="File ready"
        onClose={jest.fn()}
        actions={[
          { label: 'Accept', onClick: jest.fn() },
          { label: 'Reject', onClick: jest.fn() },
        ]}
      />
    );

    expect(screen.getByText('Accept')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
test('file transfer notification flow', async ({ page }) => {
  // Trigger transfer
  await page.click('[data-testid="send-file"]');

  // Wait for notification
  const toast = page.locator('[data-toast-id]');
  await expect(toast).toBeVisible();

  // Verify preview
  const preview = toast.locator('.previewImage');
  await expect(preview).toBeVisible();

  // Click action
  await toast.locator('button:has-text("View")').click();
});
```

## Troubleshooting

### Images Not Loading

Check:
- Image URL is accessible (CORS)
- Image format is supported
- Network connectivity
- Image CDN configuration

### Actions Not Working

Verify:
- onClick handlers are properly bound
- Toast doesn't close before action completes
- Event propagation is not stopped

### Progress Bar Not Updating

Ensure:
- State updates trigger re-renders
- Progress value is between 0-100
- Duration is set to Infinity for manual control

## Future Enhancements

Potential improvements:
- Toast update API for progress updates
- Video preview support
- Audio waveform visualization
- Document preview (PDF thumbnails)
- Notification history panel
- Notification sound customization
- Toast stacking/grouping UI

## Support

For issues or questions:
- Check the component source code
- Review the demo component
- See the Toast component tests
- Check accessibility documentation
