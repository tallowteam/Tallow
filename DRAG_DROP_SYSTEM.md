# Drag & Drop System

Enhanced drag & drop UI for Tallow with animated overlays, file previews, and visual feedback.

## Overview

The drag & drop system provides:
- Animated drag overlay with file count
- File type detection and preview icons
- Folder drag & drop support
- Visual feedback animations
- File count badge during drag
- Smooth entry/exit animations
- Particle effects
- Mobile-friendly
- WCAG compliant

## Components

### DragDropZone

Main drag & drop wrapper component with visual feedback.

## Installation

Import in your components:

```tsx
import { DragDropZone } from '@/components/ui/drag-drop-zone';
```

## Basic Usage

### Simple File Drop

```tsx
<DragDropZone onFilesDropped={(files) => handleFiles(files)}>
  <div className="p-8 border-2 border-dashed rounded-3xl">
    <p>Drop files here</p>
  </div>
</DragDropZone>
```

### With Folder Support

```tsx
<DragDropZone
  onFilesDropped={handleFiles}
  onFolderDropped={handleFolder}
  allowFolders={true}
>
  <div className="p-8 border-2 border-dashed rounded-3xl">
    <p>Drop files or folders here</p>
  </div>
</DragDropZone>
```

### Full Configuration

```tsx
<DragDropZone
  onFilesDropped={handleFiles}
  onFolderDropped={handleFolder}
  accept="image/*,video/*"
  multiple={true}
  disabled={false}
  maxSize={100 * 1024 * 1024} // 100MB
  allowFolders={true}
  showPreview={true}
>
  {children}
</DragDropZone>
```

## Features in Detail

### Animated Overlay

When dragging files over the zone:
- Smooth fade-in animation
- Scale effect
- Backdrop blur
- Dashed border highlight

### File Count Badge

Shows number of files being dragged:
- Prominent badge with count
- File vs files pluralization
- Folder indicator if present
- Smooth slide-up animation

### File Type Preview

Displays relevant icons based on file types:
- Images: Image icon
- Videos: Video icon
- Audio: Music icon
- Documents: Document icon
- Archives: Archive icon
- Folders: Folder icon

Multiple icons shown if mixed file types.

### Visual Feedback

- Border changes to accent color
- Background becomes translucent
- Icons animate with bounce effect
- Particle effects around the drop zone
- Smooth transitions on enter/leave

### Folder Detection

Automatically detects:
- Folder drag events
- Mixed files and folders
- Shows folder icon in preview
- Calls appropriate callback

## Props

```typescript
interface DragDropZoneProps {
  // Callbacks
  onFilesDropped: (files: FileList) => void;
  onFolderDropped?: (files: FileList) => void;

  // Configuration
  accept?: string;              // MIME types to accept
  multiple?: boolean;           // Allow multiple files (default: true)
  disabled?: boolean;           // Disable drop zone
  maxSize?: number;             // Max file size in bytes
  allowFolders?: boolean;       // Allow folder drops (default: true)
  showPreview?: boolean;        // Show file preview (default: true)

  // Styling
  className?: string;
  children?: React.ReactNode;
}
```

## Integration with FileSelector

The FileSelector component already uses DragDropZone:

```tsx
<DragDropZone
  onFilesDropped={handleFilesDropped}
  multiple={true}
  allowFolders={false}
  showPreview={true}
>
  <Card className="p-8 border-2 border-dashed rounded-3xl">
    {/* File selector content */}
  </Card>
</DragDropZone>
```

## Styling

### Custom Overlay Styling

The overlay uses Framer Motion for animations:

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  {/* Overlay content */}
</motion.div>
```

### Theme Integration

Automatically uses theme colors:
- `--accent` for active state
- `--card` for background
- `--border` for borders
- `--foreground` for text

### Particle Effects

Animated particles scatter on drag:
```tsx
{[...Array(6)].map((_, i) => (
  <motion.div
    className="absolute w-2 h-2 bg-accent rounded-full"
    animate={{
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      scale: [0, 1, 0],
      opacity: [0, 0.6, 0],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      delay: i * 0.2,
    }}
  />
))}
```

## Examples

### Image Upload

```tsx
<DragDropZone
  accept="image/*"
  onFilesDropped={(files) => {
    Array.from(files).forEach(file => {
      uploadImage(file);
    });
  }}
  maxSize={5 * 1024 * 1024} // 5MB
>
  <div className="text-center p-12">
    <ImageIcon className="mx-auto mb-4" />
    <h3>Drop images here</h3>
    <p className="text-sm text-muted-foreground">
      Max 5MB per image
    </p>
  </div>
</DragDropZone>
```

### Folder Backup

```tsx
<DragDropZone
  allowFolders={true}
  onFolderDropped={(files) => {
    backupFolder(files);
  }}
  showPreview={true}
>
  <div className="p-8">
    <FolderIcon className="mx-auto mb-4" />
    <h3>Drop folder to backup</h3>
  </div>
</DragDropZone>
```

### Multi-File Upload with Progress

```tsx
const [uploading, setUploading] = useState(false);

<DragDropZone
  disabled={uploading}
  onFilesDropped={async (files) => {
    setUploading(true);
    const toastId = toast.loading('Uploading files...');

    try {
      await uploadFiles(files);
      toast.dismiss(toastId);
      toast.success(`Uploaded ${files.length} files`);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }}
>
  <div className={uploading ? 'opacity-50' : ''}>
    {/* Upload UI */}
  </div>
</DragDropZone>
```

## Accessibility

### ARIA Support

The component ensures:
- Proper ARIA labels
- Keyboard accessible fallback
- Screen reader announcements
- Focus management

### Keyboard Navigation

Users can:
- Click to open file picker
- Use Enter/Space to activate
- Tab to navigate

### Reduced Motion

Respects `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled */
}
```

## Mobile Support

### Touch Gestures

- Native file drag support on mobile browsers
- Fallback to file input picker
- Touch-friendly target sizes
- Responsive overlay sizing

### Responsive Design

```tsx
@media (max-width: 640px) {
  [data-sonner-toast] {
    max-width: calc(100vw - 2rem) !important;
  }
}
```

## Browser Compatibility

Supports:
- Chrome/Edge (WebKit)
- Firefox
- Safari
- Mobile browsers

Uses polyfills for:
- `webkitGetAsEntry` for folder detection
- `DataTransferItem` for file type detection

## Best Practices

### DO:
- Provide clear visual feedback
- Show file count during drag
- Support both click and drag
- Handle errors gracefully
- Show max file size limits
- Disable during upload

### DON'T:
- Don't accept all file types without validation
- Don't skip size validation
- Don't ignore mobile users
- Don't forget loading states
- Don't hide error messages

## Advanced Usage

### Custom File Validation

```tsx
<DragDropZone
  onFilesDropped={(files) => {
    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} type not allowed`);
        return false;
      }
      return true;
    });

    handleFiles(validFiles);
  }}
>
  {/* Drop zone */}
</DragDropZone>
```

### With Upload Progress

```tsx
const [progress, setProgress] = useState(0);

<DragDropZone
  onFilesDropped={async (files) => {
    for (const file of files) {
      await uploadWithProgress(file, (p) => setProgress(p));
    }
  }}
>
  <div>
    {progress > 0 && (
      <Progress value={progress} className="mt-4" />
    )}
  </div>
</DragDropZone>
```

### Nested Drop Zones

```tsx
<DragDropZone onFilesDropped={handleOuterDrop}>
  <div className="p-8">
    <DragDropZone
      onFilesDropped={handleInnerDrop}
      className="nested-zone"
    >
      <div className="p-4">
        Inner drop zone
      </div>
    </DragDropZone>
  </div>
</DragDropZone>
```

## Performance

### Optimizations

- Uses `useCallback` for handlers
- Debounces drag events
- Lazy loads file previews
- GPU-accelerated animations
- Efficient re-renders

### File Handling

```tsx
// Efficient file processing
const processFiles = useCallback((fileList: FileList) => {
  const files = Array.from(fileList);

  // Process in batches
  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    processBatch(batch);
  }
}, []);
```

## Testing

Component is tested for:
- File drop events
- Folder detection
- Multiple file handling
- Animation triggers
- Error states
- Accessibility compliance

## Troubleshooting

### Files not detected

Check that:
- Drop zone is not disabled
- Browser supports drag & drop
- File types are allowed
- Size limits are not exceeded

### Overlay not showing

Ensure:
- `showPreview` is true
- Framer Motion is installed
- CSS is properly loaded
- Z-index is appropriate

### Folder drop not working

Verify:
- `allowFolders` is true
- `onFolderDropped` callback is provided
- Browser supports folder drag (webkit)

## Related Components

- `FileSelector` - Uses DragDropZone
- `TransferQueue` - Displays upload progress
- `toast` - Shows upload notifications
