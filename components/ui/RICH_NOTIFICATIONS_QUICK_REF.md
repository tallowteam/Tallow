# Rich Notifications Quick Reference

## Quick Start

### Image Preview Notification
```typescript
toast.addToast({
  title: 'Image Received',
  message: 'photo.jpg',
  variant: 'success',
  preview: {
    type: 'image',
    src: 'https://example.com/thumb.jpg',
    fileName: 'photo.jpg',
    fileSize: '2.4 MB',
  },
  actions: [
    { label: 'View', onClick: () => {} },
    { label: 'Save', onClick: () => {} },
  ],
});
```

### File Preview Notification
```typescript
toast.addToast({
  title: 'File Ready',
  message: 'Document ready to transfer',
  variant: 'info',
  preview: {
    type: 'file',
    fileName: 'document.pdf',
    fileSize: '5.2 MB',
  },
  actions: [
    { label: 'Accept', onClick: () => {} },
    { label: 'Reject', onClick: () => {} },
  ],
});
```

### Transfer Progress Notification
```typescript
toast.addToast({
  title: 'Transferring',
  message: 'video.mp4',
  variant: 'info',
  duration: Infinity,
  preview: {
    type: 'transfer',
    fileName: 'video.mp4',
    progress: 75, // 0-100
  },
});
```

## Notification Manager Helpers

### File Notification
```typescript
await notificationManager.showFileNotification(
  'document.pdf',
  '5.2 MB',
  'https://example.com/thumbnail.jpg' // optional
);
```

### Transfer Notification
```typescript
await notificationManager.showTransferNotification(
  'transfer-123',
  75, // progress percentage
  'video.mp4'
);
```

### Image Notification
```typescript
await notificationManager.showImageNotification(
  'https://example.com/image.jpg',
  'photo.jpg'
);
```

## Preview Types

### Image Preview
- Shows 48x48px thumbnail
- Supports lazy loading
- Rounded corners with border
- Falls back to file icon if no src

```typescript
preview: {
  type: 'image',
  src: string,      // Image URL
  fileName: string, // Display name
  fileSize: string, // e.g., "2.4 MB"
}
```

### File Preview
- Shows file icon
- Displays file name and size
- Compact layout

```typescript
preview: {
  type: 'file',
  fileName: string,
  fileSize: string,
}
```

### Transfer Preview
- Mini progress bar
- Percentage display
- Real-time updates

```typescript
preview: {
  type: 'transfer',
  fileName: string,
  progress: number, // 0-100
}
```

## Action Buttons

### Single Action (Legacy)
```typescript
action: {
  label: 'View',
  onClick: () => {},
}
```

### Multiple Actions (New)
```typescript
actions: [
  { label: 'Accept', onClick: () => {} },
  { label: 'Reject', onClick: () => {} },
  { label: 'View', onClick: () => {} },
]
```

## Styling

### CSS Classes
- `.richToast` - Rich notification wrapper
- `.previewContainer` - Preview wrapper (48x48px)
- `.previewImage` - Image thumbnail
- `.previewFile` - File preview layout
- `.previewTransfer` - Transfer preview layout
- `.actionsRow` - Action buttons container
- `.actionButton` - Individual action button

### Customization
```css
.previewImage {
  width: 64px;
  height: 64px;
  border-radius: 12px;
}

.actionButton {
  background: var(--accent);
  color: white;
}
```

## Duration Guidelines

```typescript
5000   // Quick info
7000   // File received
10000  // Action required
30000  // Critical (accept/reject)
Infinity // Progress (manual dismiss)
```

## Format Helper

```typescript
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}
```

## Responsive Behavior

- Desktop: Full width with side-by-side actions
- Mobile: Stacked layout with full-width buttons
- Max width: 500px (rich), 480px (standard)
- Min width: 360px (rich), 320px (standard)

## Accessibility

- All images have alt text
- Keyboard navigation supported
- Screen reader announcements
- Focus indicators on buttons
- Reduced motion support

## Common Patterns

### Accept/Reject Transfer
```typescript
toast.addToast({
  title: 'Incoming Transfer',
  message: 'Device wants to send a file',
  variant: 'warning',
  duration: 30000,
  preview: { type: 'file', fileName: 'doc.pdf', fileSize: '1.8 MB' },
  actions: [
    { label: 'Accept', onClick: () => acceptTransfer() },
    { label: 'Reject', onClick: () => rejectTransfer() },
  ],
});
```

### View Image
```typescript
toast.success('Image received', {
  preview: { type: 'image', src: url, fileName: 'photo.jpg' },
  actions: [{ label: 'View', onClick: () => window.open(url) }],
});
```

### Progress Updates
```typescript
// Start
const id = toast.addToast({
  message: 'Transferring...',
  duration: Infinity,
  preview: { type: 'transfer', fileName: 'file.mp4', progress: 0 },
});

// Update (implement toast update)
// updateToast(id, { preview: { ...preview, progress: 50 } });

// Complete
toast.removeToast(id);
toast.success('Transfer complete');
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All features gracefully degrade on older browsers.
