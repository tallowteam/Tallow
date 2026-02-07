# QR Scanner Component

A production-ready QR code scanner component for quick device pairing via camera, built with the native BarcodeDetector API.

## Features

- **Native BarcodeDetector API**: Uses built-in browser API for optimal performance
- **Camera Access**: Requests and manages camera permissions
- **Real-time Scanning**: Continuous QR code detection with visual feedback
- **Flash Toggle**: Enable/disable camera flash (if supported)
- **Manual Entry Fallback**: Input room codes manually if scanning fails
- **Responsive Design**: Full-screen on mobile, modal on desktop
- **Error Handling**: Graceful fallback for permission denied or unsupported browsers
- **Accessibility**: WCAG 2.1 compliant with proper ARIA labels
- **Dark Theme**: Matches project design tokens

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 83+ | ✅ Full | Native BarcodeDetector |
| Edge 83+ | ✅ Full | Native BarcodeDetector |
| Opera 69+ | ✅ Full | Native BarcodeDetector |
| Chrome Android 83+ | ✅ Full | Native BarcodeDetector + Flash |
| Safari/iOS | ⚠️ Partial | Manual entry only |
| Firefox | ⚠️ Partial | Manual entry only |

## Installation

The component is ready to use. No additional dependencies required for basic functionality.

### Optional: Enhanced Compatibility

For broader browser support (Safari, Firefox), install a QR decoding library:

```bash
npm install jsqr
```

Then update `lib/utils/barcode-detector-polyfill.ts` to use jsQR in the `detectBarcodesManual` function.

## Usage

### Basic Usage

```tsx
import { QRScanner } from '@/components/transfer/QRScanner';

function MyComponent() {
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (data: string) => {
    console.log('Scanned data:', data);
    // Process the scanned room code
    setShowScanner(false);
  };

  return (
    <>
      <button onClick={() => setShowScanner(true)}>
        Scan QR Code
      </button>

      <QRScanner
        isOpen={showScanner}
        onScan={handleScan}
        onClose={() => setShowScanner(false)}
      />
    </>
  );
}
```

### Integration with RoomCodeConnect

```tsx
import { QRScanner } from '@/components/transfer/QRScanner';
import { RoomCodeConnect } from '@/components/transfer/RoomCodeConnect';

function TransferPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  const handleScan = (data: string) => {
    // Extract room code from URL
    let code = data;
    if (data.includes('/transfer?room=')) {
      const url = new URL(data);
      code = url.searchParams.get('room') || data;
    }

    setRoomCode(code.toUpperCase());
    setShowScanner(false);
  };

  return (
    <>
      {/* Scan Button */}
      <button onClick={() => setShowScanner(true)}>
        <QRIcon />
        Scan QR Code
      </button>

      {/* Room Connect */}
      <RoomCodeConnect
        selectedFiles={selectedFiles}
        initialRoomCode={roomCode}
        onConnect={(code) => console.log('Connected:', code)}
      />

      {/* Scanner Modal */}
      <QRScanner
        isOpen={showScanner}
        onScan={handleScan}
        onClose={() => setShowScanner(false)}
      />
    </>
  );
}
```

### Check Browser Support

```tsx
import { testBarcodeDetector } from '@/lib/utils/barcode-detector-polyfill';

useEffect(() => {
  const checkSupport = async () => {
    const result = await testBarcodeDetector();

    if (!result.working) {
      console.warn('QR scanning not fully supported');
      // Show manual entry by default
    }
  };

  checkSupport();
}, []);
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls modal visibility |
| `onScan` | `(data: string) => void` | Yes | Callback when QR code is detected |
| `onClose` | `() => void` | Yes | Callback to close the scanner |

## States

The scanner has 5 distinct states:

1. **idle**: Initial state, requesting permission
2. **scanning**: Camera active, scanning for QR codes
3. **detected**: QR code found, processing
4. **error**: Generic error (no camera, etc.)
5. **permission-denied**: User denied camera access

## Features

### Camera Permission

The scanner requests camera permission automatically when opened:

```tsx
// Permission flow
isOpen → Request Permission → Camera Access → Start Scanning
```

If permission is denied, users can:
- Retry permission request
- Enter room code manually

### Flash/Torch Toggle

Automatically detects if device supports camera flash:

```tsx
const capabilities = videoTrack.getCapabilities();
if (capabilities.torch) {
  // Show flash toggle button
}
```

### QR Code Detection

Scans for QR codes every 300ms:

```tsx
const detector = new BarcodeDetector({ formats: ['qr_code'] });
const results = await detector.detect(videoElement);
```

### URL Parsing

Automatically extracts room codes from Tallow URLs:

```tsx
// Input: https://tallow.app/transfer?room=ABC123
// Output: ABC123

// Input: ABC123
// Output: ABC123
```

### Manual Entry

If scanning fails or is unsupported, users can enter the code manually:

```tsx
<input
  type="text"
  value={manualCode}
  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
  placeholder="ABC123"
  maxLength={16}
/>
```

## Styling

The component uses CSS Modules with project design tokens:

```css
/* Dark theme */
--bg-base: rgba(23, 23, 23, 0.95)
--primary-500: #5E5CE6
--border-default: rgba(255, 255, 255, 0.08)

/* Animations */
- Scan line: 2s linear infinite
- Corner markers: Glowing borders
- Success state: Pulse animation
```

### Responsive Design

- **Desktop**: Modal overlay (max-width: 600px)
- **Mobile**: Full-screen experience
- **Video**: Adapts aspect ratio (4:3 desktop, 3:4 mobile)

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus management
- Screen reader announcements
- Reduced motion support

```css
@media (prefers-reduced-motion: reduce) {
  .scanLine { animation: none; }
}
```

## Performance

- Uses hardware-accelerated video decoding
- Scans at 3.33 FPS (300ms interval) to reduce CPU usage
- Automatically stops scanning when modal is closed
- Cleans up media streams on unmount

## Error Handling

The component handles various error scenarios:

```tsx
// No camera
NotFoundError → "No camera found on this device"

// Permission denied
NotAllowedError → "Camera permission denied"

// Unsupported browser
!BarcodeDetector → "QR scanning not supported"

// Generic errors
Error → "Failed to access camera"
```

## Testing

### Manual Testing Checklist

- [ ] Scanner opens when isOpen=true
- [ ] Camera permission request appears
- [ ] Video feed displays after permission granted
- [ ] QR code detection works
- [ ] Flash toggle works (mobile)
- [ ] Manual entry works
- [ ] Close button works
- [ ] Permission denied shows fallback
- [ ] Unsupported browser shows manual entry
- [ ] Responsive on mobile
- [ ] Dark theme renders correctly

### Browser Testing

Test in these browsers:
- Chrome/Edge (native support)
- Chrome Android (with flash)
- Safari iOS (manual entry)
- Firefox (manual entry)

### QR Code Testing

Test with these QR codes:
- Direct room code: `ABC123`
- Full URL: `https://tallow.app/transfer?room=ABC123`
- URL with other params: `https://tallow.app/transfer?room=ABC123&mode=local`

## Troubleshooting

### Camera not working

1. Check browser permissions
2. Ensure HTTPS (camera requires secure context)
3. Check if camera is already in use
4. Try refreshing the page

### QR codes not detected

1. Ensure good lighting
2. Hold QR code steady within frame
3. Try different distances from camera
4. Use flash if available

### Browser not supported

1. Update browser to latest version
2. Use Chrome/Edge for best experience
3. Fall back to manual entry

## Future Enhancements

- [ ] Add jsQR fallback for unsupported browsers
- [ ] Support multiple QR formats (URL, vCard, etc.)
- [ ] Add haptic feedback on detection (mobile)
- [ ] Save detected codes to history
- [ ] Support scanning from image upload
- [ ] Add QR code validation
- [ ] Improve detection accuracy with image processing

## Related Components

- `RoomCodeConnect.tsx`: Room-based transfer UI
- `qr-code-generator.ts`: Visual code generation
- `barcode-detector-polyfill.ts`: Detection utility

## License

Part of the Tallow project.
