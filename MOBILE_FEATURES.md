# Mobile Features Documentation

This document describes the mobile-specific features implemented in Tallow for enhanced mobile user experience.

## Overview

Tallow includes comprehensive mobile optimizations to provide a native-like experience on smartphones and tablets. These features progressively enhance the desktop experience without breaking functionality.

## Features

### 1. Web Share API Integration

Share received files directly to native apps and contacts using the Web Share API.

#### Implementation

```typescript
import { useWebShare } from '@/lib/hooks/use-web-share';

const { share, canShare, canShareFiles } = useWebShare();

// Share a file
const handleShare = async (file: File) => {
  const success = await share({
    files: [file],
    title: 'Share via Tallow',
    text: 'Check out this file',
  });
};
```

#### Features
- Detect Web Share API support
- Share files to native apps
- Share links and text
- Automatic fallback to copy-to-clipboard on desktop
- Progressive enhancement

#### Browser Support
- Chrome 89+ (desktop & mobile)
- Safari 14+ (iOS & macOS)
- Edge 93+
- Firefox (limited support)

### 2. Camera Integration

Capture photos and videos directly within the app using getUserMedia API.

#### Component Usage

```typescript
import { CameraCapture } from '@/components/app/CameraCapture';
import { CapturedMedia } from '@/lib/hooks/use-media-capture';

function MyComponent() {
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleCapture = (media: CapturedMedia) => {
    console.log('Captured:', media.type, media.blob);
    // Use the captured media
  };

  return (
    <CameraCapture
      open={cameraOpen}
      onOpenChange={setCameraOpen}
      onCapture={handleCapture}
      mode="photo" // or "video"
    />
  );
}
```

#### Features
- Photo capture with preview
- Video recording with duration display
- Camera switching (front/back)
- Preview, retake, and send flow
- Graceful permission handling
- Responsive camera constraints
- Real-time recording timer

#### Constraints
```typescript
const constraints = {
  video: {
    facingMode: 'environment', // back camera
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  audio: true, // for video mode
};
```

### 3. Touch Gestures

Advanced touch gestures using @use-gesture/react for intuitive mobile interactions.

#### Available Gestures

##### Swipe to Delete/Retry
```typescript
import { useSwipeActions } from '@/lib/hooks/use-advanced-gestures';

const { bind, offset, isDragging, swipeDirection, style } = useSwipeActions({
  onSwipeLeft: () => deleteItem(),
  onSwipeRight: () => retryItem(),
  threshold: 100,
  enabled: true,
});

<div {...bind()} style={style}>
  Swipeable content
</div>
```

##### Pinch to Zoom
```typescript
import { usePinchZoom } from '@/lib/hooks/use-advanced-gestures';

const { bind, scale, offset, reset, isZoomed, style } = usePinchZoom({
  minScale: 0.5,
  maxScale: 5,
  enabled: true,
});

<img {...bind()} style={style} src={imageSrc} />
```

##### Pull to Refresh
```typescript
import { usePullToRefresh } from '@/lib/hooks/use-advanced-gestures';

const { bind, pullDistance, isRefreshing, progress } = usePullToRefresh(
  async () => {
    await refreshData();
  },
  { threshold: 80 }
);
```

##### Swipe to Dismiss
```typescript
import { useSwipeToDismiss } from '@/lib/hooks/use-advanced-gestures';

const { bind, offset, opacity, style } = useSwipeToDismiss(
  () => closeDialog(),
  { direction: 'down', threshold: 150 }
);
```

#### Gesture Settings

Users can customize gesture behavior through settings:

```typescript
import { MobileGestureSettings, useGestureSettings } from '@/components/app/MobileGestureSettings';

// In settings page
<MobileGestureSettings />

// In component
const settings = useGestureSettings();
if (settings.swipeToDelete) {
  // Enable swipe to delete
}
```

### 4. Mobile-Optimized Components

#### File Preview with Zoom
```typescript
import { FilePreview } from '@/components/app/FilePreview';

<FilePreview
  open={previewOpen}
  onOpenChange={setPreviewOpen}
  file={{
    name: 'photo.jpg',
    type: 'image/jpeg',
    url: imageUrl,
  }}
  onDownload={handleDownload}
  enableGestures={true}
/>
```

#### Mobile Action Sheet
```typescript
import { MobileActionSheet } from '@/components/app/MobileActionSheet';

<MobileActionSheet
  open={open}
  onOpenChange={setOpen}
  title="Actions"
  actions={[
    { label: 'Share', icon: <Share />, onClick: handleShare },
    { label: 'Delete', icon: <Trash />, onClick: handleDelete, variant: 'destructive' },
  ]}
  enableSwipeDown={true}
/>
```

## Browser Compatibility

### Web Share API
| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 89+ | Full |
| Safari | 14+ | Full |
| Edge | 93+ | Full |
| Firefox | 103+ | Partial |

### getUserMedia (Camera)
| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 53+ | Full |
| Safari | 11+ | Full |
| Edge | 79+ | Full |
| Firefox | 36+ | Full |

### Touch Gestures
| Browser | Version | Support |
|---------|---------|---------|
| Chrome | All | Full |
| Safari | All | Full |
| Edge | All | Full |
| Firefox | All | Full |

## Performance Considerations

### Camera
- Uses hardware-accelerated video decoding
- Automatic resolution scaling based on device
- Memory-efficient blob handling
- Proper cleanup on unmount

### Gestures
- Hardware-accelerated CSS transforms
- RAF-based animations
- Passive event listeners
- Debounced gesture callbacks

### File Sharing
- Lazy blob creation
- Efficient file type detection
- Fallback mechanisms
- Progressive enhancement

## Testing

### Unit Tests
```bash
npm run test:unit -- mobile-features
```

### E2E Tests
```bash
npm run test -- mobile-gestures
npm run test -- camera-capture
npm run test -- web-share
```

### Manual Testing Checklist

#### Camera
- [ ] Photo capture works
- [ ] Video recording works
- [ ] Camera switching works
- [ ] Permission prompts display correctly
- [ ] Retake functionality works
- [ ] Preview displays correctly

#### Gestures
- [ ] Swipe left to delete
- [ ] Swipe right to retry
- [ ] Pinch to zoom
- [ ] Pull to refresh
- [ ] Swipe down to dismiss
- [ ] Visual feedback displays

#### Web Share
- [ ] Share button appears on mobile
- [ ] Files share to native apps
- [ ] Fallback works on desktop
- [ ] Copy link works
- [ ] Error handling works

## Progressive Enhancement

All mobile features are built with progressive enhancement:

1. **Detection**: Feature availability is detected at runtime
2. **Fallback**: Desktop-appropriate alternatives are provided
3. **Graceful Degradation**: Features fail gracefully if unsupported
4. **Accessibility**: All features work with keyboard/screen readers

### Example Pattern
```typescript
const { canShare } = useWebShare();

return (
  <>
    {canShare ? (
      <Button onClick={handleShare}>
        <Share /> Share
      </Button>
    ) : (
      <Button onClick={handleCopyLink}>
        <Copy /> Copy Link
      </Button>
    )}
  </>
);
```

## Best Practices

### 1. Always Check Support
```typescript
if (typeof navigator !== 'undefined' && 'share' in navigator) {
  // Use Web Share API
}
```

### 2. Provide Fallbacks
```typescript
const share = canShare ? handleWebShare : handleCopyToClipboard;
```

### 3. Handle Permissions Gracefully
```typescript
try {
  await navigator.mediaDevices.getUserMedia({ video: true });
} catch (err) {
  toast.error('Camera permission denied');
}
```

### 4. Use Touch-Friendly Sizes
```typescript
// Minimum 44x44px touch targets
<Button size="lg" className="min-h-11 min-w-11">
```

### 5. Optimize for Touch
```typescript
// Prevent text selection during gestures
<div className="touch-none select-none">
```

## Accessibility

All mobile features maintain accessibility:

- Keyboard navigation support
- Screen reader announcements
- Focus management
- ARIA labels and descriptions
- High contrast mode support

## Future Enhancements

- [ ] Native file picker integration
- [ ] Haptic feedback on gestures
- [ ] Offline file queue management
- [ ] Background sync for uploads
- [ ] Picture-in-picture for video
- [ ] Advanced camera controls (flash, HDR)
- [ ] Barcode/QR code scanning
- [ ] Gesture customization UI

## Resources

- [Web Share API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- [getUserMedia API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [@use-gesture/react Documentation](https://use-gesture.netlify.app/)
- [Mobile Web Best Practices](https://web.dev/mobile-web/)
- [Touch Events - W3C](https://www.w3.org/TR/touch-events/)

## Support

For issues or questions about mobile features:
- Check browser compatibility tables
- Review error handling in browser console
- Test on actual devices (not just DevTools)
- Verify HTTPS is enabled (required for camera/share)
