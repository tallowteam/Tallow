# QR Scanner - Quick Reference

## Import

```tsx
import { QRScanner } from '@/components/transfer/QRScanner';
```

## Basic Usage

```tsx
const [showScanner, setShowScanner] = useState(false);

<QRScanner
  isOpen={showScanner}
  onScan={(data) => console.log(data)}
  onClose={() => setShowScanner(false)}
/>
```

## Props

```tsx
interface QRScannerProps {
  isOpen: boolean;              // Controls visibility
  onScan: (data: string) => void;  // Callback with scanned data
  onClose: () => void;          // Close handler
}
```

## States

```tsx
type ScanState =
  | 'idle'              // Initial/permission request
  | 'scanning'          // Camera active
  | 'detected'          // QR found
  | 'error'            // Generic error
  | 'permission-denied' // Camera denied
```

## Features

### Camera Access
- Auto-requests on open
- Prefers back camera (`facingMode: 'environment'`)
- Handles permission errors

### Flash Support
- Auto-detects torch capability
- Toggle button if available
- Mobile-only feature

### Manual Entry
- Fallback input field
- 16-char limit
- Auto-uppercase
- Validates min 4 chars

### URL Parsing
```tsx
// Extracts room code from URLs
"https://tallow.app/transfer?room=ABC123" → "ABC123"
"ABC123" → "ABC123"
```

## Browser Support

| Browser | QR Scan | Manual Entry |
|---------|---------|--------------|
| Chrome 83+ | ✅ | ✅ |
| Edge 83+ | ✅ | ✅ |
| Safari | ❌ | ✅ |
| Firefox | ❌ | ✅ |

## Examples

### Simple Integration
```tsx
function MyComponent() {
  const [show, setShow] = useState(false);

  return (
    <>
      <button onClick={() => setShow(true)}>Scan QR</button>
      <QRScanner
        isOpen={show}
        onScan={(code) => {
          alert(`Scanned: ${code}`);
          setShow(false);
        }}
        onClose={() => setShow(false)}
      />
    </>
  );
}
```

### With Room Connect
```tsx
function Transfer() {
  const [showScanner, setShowScanner] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  return (
    <>
      <button onClick={() => setShowScanner(true)}>
        <QRIcon /> Scan
      </button>

      <RoomCodeConnect initialRoomCode={roomCode} />

      <QRScanner
        isOpen={showScanner}
        onScan={(data) => {
          const url = new URL(data);
          setRoomCode(url.searchParams.get('room') || data);
          setShowScanner(false);
        }}
        onClose={() => setShowScanner(false)}
      />
    </>
  );
}
```

### Check Support
```tsx
import { testBarcodeDetector } from '@/lib/utils/barcode-detector-polyfill';

const [canScan, setCanScan] = useState(false);

useEffect(() => {
  testBarcodeDetector().then((result) => {
    setCanScan(result.working);
  });
}, []);

{canScan && <button onClick={openScanner}>Scan QR</button>}
```

## Styling

Uses CSS Modules with design tokens:

```css
--primary-500: #5E5CE6       /* Purple accent */
--bg-base: rgba(23,23,23,0.95) /* Dark background */
--radius-xl: 1rem             /* Border radius */
```

Responsive breakpoints:
- Desktop: Modal (max 600px)
- Mobile (<768px): Full-screen

## Testing

### Test Data
```tsx
// Direct code
"ABC123"

// Full URL
"https://tallow.app/transfer?room=ABC123"

// With params
"https://tallow.app/transfer?room=ABC123&mode=local"
```

### Test Scenarios
1. Grant permission → Should show video
2. Deny permission → Should show manual entry
3. Scan QR → Should call onScan
4. Click close → Should call onClose
5. Enter manual code → Should call onScan
6. Toggle flash → Should enable/disable torch

## Common Patterns

### Conditional Rendering
```tsx
{hasCamera && (
  <button onClick={() => setShowScanner(true)}>
    Scan QR Code
  </button>
)}
```

### Error Handling
```tsx
<QRScanner
  isOpen={show}
  onScan={(data) => {
    try {
      const url = new URL(data);
      const room = url.searchParams.get('room');
      if (!room) throw new Error('Invalid QR code');
      connect(room);
    } catch (err) {
      toast.error('Invalid QR code');
    }
  }}
  onClose={handleClose}
/>
```

### With Loading State
```tsx
const [scanning, setScanning] = useState(false);

<QRScanner
  isOpen={show}
  onScan={async (data) => {
    setScanning(true);
    await connectToRoom(data);
    setScanning(false);
    setShow(false);
  }}
  onClose={() => setShow(false)}
/>
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Escape | Close scanner |
| Enter | Submit manual code |
| Tab | Navigate controls |

## Accessibility

- ARIA labels on all buttons
- Focus trap in modal
- Screen reader announcements
- Keyboard navigation
- Reduced motion support

## Files

```
components/transfer/
  ├── QRScanner.tsx              # Main component
  ├── QRScanner.module.css       # Styles
  ├── QRScanner.README.md        # Full docs
  ├── QRScanner.QUICK_REFERENCE.md # This file
  └── QRScannerExample.tsx       # Usage examples

lib/utils/
  └── barcode-detector-polyfill.ts # Detection utility
```

## Related

- `RoomCodeConnect.tsx` - Room connection UI
- `qr-code-generator.ts` - QR generation
- `DeviceDiscovery.tsx` - Device pairing
