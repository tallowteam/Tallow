# Quick Reference Card

Fast lookup for toast notifications and drag & drop components.

## Toast Notifications

### Import
```tsx
import { toast } from '@/lib/utils/toast';
```

### Quick Examples

```tsx
// Success
toast.success('Done!');

// Error (persistent)
toast.error('Failed', { action: { label: 'Retry', onClick: retry } });

// Warning
toast.warning('Check this');

// Info
toast.info('New update');

// Loading
const id = toast.loading('Processing...');
toast.dismiss(id);

// With Undo
toast.withUndo('Deleted file', () => restore());

// Promise
toast.promise(asyncOp(), {
  loading: 'Working...',
  success: 'Done!',
  error: 'Failed'
});
```

### Specialized Helpers

| Helper | Usage |
|--------|-------|
| `toast.fileCopied(name)` | File copied |
| `toast.fileDownloaded(name)` | File downloaded |
| `toast.fileUploaded(name, count?)` | File(s) uploaded |
| `toast.fileDeleted(name, onUndo?)` | File deleted with undo |
| `toast.connected(device)` | Device connected |
| `toast.disconnected(device?)` | Device disconnected |
| `toast.connectionError(error)` | Connection failed |
| `toast.transferStarted(name)` | Transfer started |
| `toast.transferComplete(name, onDownload?)` | Transfer done |
| `toast.transferFailed(error)` | Transfer failed |
| `toast.copiedToClipboard(content?)` | Copied to clipboard |
| `toast.settingsSaved()` | Settings saved |
| `toast.settingsReset(onUndo?)` | Settings reset |
| `toast.encryptionEnabled()` | Encryption active |
| `toast.securityWarning(msg)` | Security warning |

### Common Options

```tsx
toast.success('Message', {
  description: 'Additional info',
  duration: 5000,
  action: {
    label: 'Click me',
    onClick: () => {},
    icon: <Icon />
  },
  persist: true,
  id: 'unique-id'
});
```

## Drag & Drop

### Import
```tsx
import { DragDropZone } from '@/components/ui/drag-drop-zone';
```

### Basic Usage

```tsx
<DragDropZone onFilesDropped={(files) => handle(files)}>
  <div className="p-8 border-2 border-dashed rounded-3xl">
    Drop files here
  </div>
</DragDropZone>
```

### Full Props

```tsx
<DragDropZone
  onFilesDropped={(files) => {}}
  onFolderDropped={(files) => {}}
  accept="image/*,video/*"
  multiple={true}
  disabled={false}
  maxSize={100 * 1024 * 1024}
  allowFolders={true}
  showPreview={true}
  className="custom-class"
>
  {children}
</DragDropZone>
```

### Common Patterns

#### Image Upload
```tsx
<DragDropZone
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  onFilesDropped={(files) => uploadImages(files)}
>
  {/* UI */}
</DragDropZone>
```

#### Folder Backup
```tsx
<DragDropZone
  allowFolders={true}
  onFolderDropped={(files) => backup(files)}
  showPreview={true}
>
  {/* UI */}
</DragDropZone>
```

#### With Validation
```tsx
<DragDropZone
  onFilesDropped={(files) => {
    const valid = Array.from(files).filter(f => {
      if (f.size > maxSize) {
        toast.error(`${f.name} too large`);
        return false;
      }
      return true;
    });
    handleFiles(valid);
  }}
>
  {/* UI */}
</DragDropZone>
```

## File Size Formatting

```tsx
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
```

## Integration in FileSelector

Already integrated! The FileSelector now:
- Uses DragDropZone
- Shows toast on file add
- Supports undo on file remove

```tsx
// In FileSelector component
toast.fileUploaded(
  files.length === 1 ? files[0].name : `${files.length} files`,
  files.length
);
```

## Keyboard Shortcuts

### Toast
- `Esc` - Dismiss focused toast
- `Tab` - Navigate between action buttons
- `Enter/Space` - Trigger action

### Drag & Drop
- `Enter/Space` - Open file picker (when focused)
- `Tab` - Navigate to drop zone

## Accessibility

### Toast
- ARIA live regions
- Keyboard navigation
- Screen reader announcements
- High contrast support

### Drag & Drop
- Keyboard fallback
- ARIA labels
- Focus management
- Touch-friendly

## Styling

### Toast Colors
- Success: `#22c55e` (green)
- Error: `#ef4444` (red)
- Warning: `#fbbf24` (amber)
- Info: `#3b82f6` (blue)

### Animations
- Duration: 200-300ms
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Respects `prefers-reduced-motion`

## Testing

Visit `/ui-demo` to test all features interactively.

## Documentation

- `TOAST_SYSTEM.md` - Full toast docs
- `DRAG_DROP_SYSTEM.md` - Full drag & drop docs
- `TOAST_MIGRATION.md` - Migration guide
- `UI_ENHANCEMENTS_SUMMARY.md` - Complete summary

## Common Issues

### Toast not showing
- Check Toaster is in Providers
- Verify import path
- Check toast-styles.css is loaded

### Drag overlay not appearing
- Ensure showPreview={true}
- Check Framer Motion is installed
- Verify z-index not blocked

### Undo not working
- Provide onUndo callback
- Don't dismiss manually
- Wait for auto-dismiss

## Performance Tips

1. **Avoid toast spam** - Queue handles this
2. **Use useCallback** for drop handlers
3. **Lazy load file previews**
4. **Batch file operations**
5. **Debounce drag events** - Built-in

## Browser Support

- ✓ Chrome/Edge (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Mobile browsers
- ⚠ Folder detection requires webkit

## Examples Repository

See `components/ui/toast-examples.tsx` for complete examples.

## Getting Help

1. Check documentation files
2. Visit `/ui-demo`
3. Review examples component
4. Check browser console
5. Test in different browsers

---

**Quick Start**: Import toast, use helpers, add DragDropZone. That's it! 🚀
