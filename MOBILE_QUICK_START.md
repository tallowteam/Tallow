# Mobile Features - Quick Start Guide

## Installation Complete ✅

All mobile features have been successfully installed and configured.

## What's Included

### 1. Web Share API - Share files to native apps
### 2. Camera Integration - Capture photos and videos
### 3. Touch Gestures - Swipe, pinch, pull, long-press
### 4. Mobile Components - Optimized UI for mobile devices

## Quick Integration

### Add Camera to File Upload

```typescript
// In your file upload component
import { useState } from 'react';
import { CameraCapture } from '@/components/app/CameraCapture';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

export function FileUpload() {
  const [cameraOpen, setCameraOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setCameraOpen(true)}>
        <Camera className="w-4 h-4 mr-2" />
        Take Photo
      </Button>

      <CameraCapture
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={(media) => {
          // Convert captured media to File
          const file = new File(
            [media.blob],
            `photo-${Date.now()}.${media.type === 'photo' ? 'jpg' : 'webm'}`,
            { type: media.blob.type }
          );
          // Upload the file
          uploadFile(file);
        }}
        mode="photo"
      />
    </>
  );
}
```

### Add Web Share to Downloaded Files

```typescript
// In your ReceivedFilesDialog or similar
import { useWebShare } from '@/lib/hooks/use-web-share';
import { Share2, Copy } from 'lucide-react';

export function FileActions({ file }: { file: File }) {
  const { share, canShare } = useWebShare();

  const handleShare = async () => {
    await share({
      files: [file],
      title: `Share ${file.name}`,
    });
  };

  return canShare ? (
    <Button onClick={handleShare}>
      <Share2 className="w-4 h-4 mr-2" />
      Share
    </Button>
  ) : (
    <Button onClick={() => navigator.clipboard.writeText(file.name)}>
      <Copy className="w-4 h-4 mr-2" />
      Copy Link
    </Button>
  );
}
```

### Enable Gestures on Transfer Cards

```typescript
// components/transfer/transfer-card.tsx already updated
// Just use it with enableGestures prop

<TransferCard
  transfer={transfer}
  onDelete={(id) => deleteTransfer(id)}
  onRetry={(id) => retryTransfer(id)}
  enableGestures={true}  // Enable swipe gestures
/>
```

### Add Gesture Settings to Settings Page

```typescript
// In app/app/settings/page.tsx
import { MobileGestureSettings } from '@/components/app/MobileGestureSettings';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Your existing settings */}

      {/* Add Mobile Gesture Settings */}
      <MobileGestureSettings />
    </div>
  );
}
```

### Add File Preview with Zoom

```typescript
import { FilePreview } from '@/components/app/FilePreview';

export function ImageGallery() {
  const [previewFile, setPreviewFile] = useState(null);

  return (
    <>
      {/* Your images */}
      <img
        src={image.url}
        onClick={() => setPreviewFile(image)}
        className="cursor-pointer"
      />

      {/* Preview dialog */}
      {previewFile && (
        <FilePreview
          open={!!previewFile}
          onOpenChange={(open) => !open && setPreviewFile(null)}
          file={previewFile}
          enableGestures={true}  // Enable pinch-to-zoom
          onDownload={() => downloadFile(previewFile)}
        />
      )}
    </>
  );
}
```

## Test Your Implementation

### 1. Run Unit Tests
```bash
npm run test:unit -- mobile-features
```

### 2. Run E2E Tests (mobile viewport)
```bash
npm run test -- mobile-features
```

### 3. Manual Testing

#### Camera:
1. Click camera button
2. Grant permission
3. Take photo/video
4. Preview and send

#### Web Share:
1. Download a file
2. Click share button (on mobile)
3. Share to WhatsApp/Email/etc.

#### Gestures:
1. Go to Settings → Mobile Gestures
2. Enable gestures
3. Swipe left on transfer = Delete
4. Swipe right on failed = Retry
5. Pinch image = Zoom

## Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Camera | ✅ 53+ | ✅ 11+ | ✅ 36+ | ✅ 79+ |
| Web Share | ✅ 89+ | ✅ 14+ | ⚠️ 103+ | ✅ 93+ |
| Gestures | ✅ All | ✅ All | ✅ All | ✅ All |

## Configuration

### Gesture Settings (localStorage)
Key: `tallow_gesture_settings`

```json
{
  "swipeToDelete": true,
  "swipeToRetry": true,
  "pinchToZoom": true,
  "pullToRefresh": false
}
```

### Camera Constraints
```typescript
{
  video: {
    facingMode: 'environment',  // back camera
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  audio: true,  // for video mode
}
```

## Troubleshooting

### Camera not working
- ✅ Check HTTPS (required for camera)
- ✅ Grant camera permission
- ✅ Close other apps using camera
- ✅ Try different browser

### Web Share not available
- ✅ Use HTTPS
- ✅ Test on mobile device
- ✅ Update browser
- ✅ Fallback to copy works

### Gestures not responsive
- ✅ Enable in settings
- ✅ Test on touch device
- ✅ Check console for errors
- ✅ Verify gesture thresholds

## Performance Tips

1. **Lazy load camera component**
```typescript
const CameraCapture = dynamic(() => import('@/components/app/CameraCapture'), {
  ssr: false,
});
```

2. **Cleanup media blobs**
```typescript
useEffect(() => {
  return () => {
    if (capturedMedia?.dataUrl) {
      URL.revokeObjectURL(capturedMedia.dataUrl);
    }
  };
}, [capturedMedia]);
```

3. **Debounce gesture handlers**
```typescript
const handleSwipe = useMemo(
  () => debounce(() => deleteItem(), 300),
  []
);
```

## Next Steps

1. Add camera button to your file upload UI
2. Enable gestures on transfer cards
3. Add mobile gesture settings to settings page
4. Test on real mobile devices
5. Monitor performance metrics

## Documentation

- 📖 [Full Documentation](./MOBILE_FEATURES.md)
- 📋 [Implementation Summary](./MOBILE_IMPLEMENTATION_SUMMARY.md)
- 🧪 [Unit Tests](./tests/unit/mobile-features.test.ts)
- 🎭 [E2E Tests](./tests/e2e/mobile-features.spec.ts)

## Demo Component

See all features in action:

```typescript
import { MobileFeaturesDemo } from '@/components/app/MobileFeaturesDemo';

// Add to a demo/playground page
<MobileFeaturesDemo />
```

## Support

For issues or questions:
1. Check browser compatibility
2. Verify HTTPS is enabled
3. Test on actual mobile devices
4. Review console for errors
5. Check documentation

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** January 2026
