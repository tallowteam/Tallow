# QR Code Quick Reference Card

**Visual Code Generator for Tallow Room Sharing**

## 🚀 Quick Start

```typescript
import { generateEnhancedVisualCodeDataURL } from '@/lib/utils/qr-code-generator';

const roomCode = 'ABC123';
const url = `${window.location.origin}/transfer?room=${roomCode}`;
const visualCode = generateEnhancedVisualCodeDataURL(url);

<img src={visualCode} alt="Room code" />
```

## 📦 Core Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `generateEnhancedVisualCodeDataURL(url, options)` | Generate enhanced visual code | Data URL |
| `generateVisualCodeDataURL(data, options)` | Generate simple visual code | Data URL |
| `downloadVisualCode(data, filename, options)` | Download as SVG | void |

## ⚙️ Options

```typescript
interface VisualCodeOptions {
  size?: number;           // Default: 256
  gridSize?: number;       // Default: 12
  colorScheme?: 'monochrome' | 'gradient' | 'accent'; // Default: 'accent'
  includeUrl?: boolean;    // Default: false
  padding?: number;        // Default: 16
}
```

## 🎨 Presets

### Web Display
```typescript
{ size: 256, gridSize: 12, colorScheme: 'monochrome' }
```

### Download/Print
```typescript
{ size: 512, gridSize: 12, colorScheme: 'monochrome' }
```

### Social Media
```typescript
{ size: 1024, gridSize: 16, colorScheme: 'accent' }
```

## 🔧 Component Integration

### Show Visual Code
```tsx
const [showQRCode, setShowQRCode] = useState(false);

<button onClick={() => setShowQRCode(!showQRCode)}>
  Show Visual Code
</button>

{showQRCode && (
  <img src={generateEnhancedVisualCodeDataURL(url)} alt="Code" />
)}
```

### Download Handler
```typescript
import { downloadVisualCode } from '@/lib/utils/qr-code-generator';

const handleDownload = () => {
  downloadVisualCode(url, `room-${roomCode}.svg`, {
    size: 512,
    colorScheme: 'monochrome',
  });
};
```

## 🎯 CSS Modules Styling

```css
.qrCodeImage {
  display: block;
  width: 256px;
  height: 256px;
  image-rendering: crisp-edges;
}
```

## ♿ Accessibility

```tsx
<button
  onClick={handleToggle}
  aria-label={show ? 'Hide visual code' : 'Show visual code'}
  aria-expanded={show}
>
  Show Code
</button>

<img
  src={visualCode}
  alt={`Visual code for room ${roomCode}`}
/>
```

## 🧪 Testing

```typescript
import { generateEnhancedVisualCodeDataURL } from '@/lib/utils/qr-code-generator';

test('generates consistent codes', () => {
  const code1 = generateEnhancedVisualCodeDataURL('test');
  const code2 = generateEnhancedVisualCodeDataURL('test');
  expect(code1).toBe(code2);
});
```

## 📁 File Locations

- **Generator**: `lib/utils/qr-code-generator.ts`
- **Component**: `components/transfer/RoomCodeConnect.tsx`
- **Tests**: `lib/utils/qr-code-generator.test.ts`
- **Demo**: `components/transfer/VisualCodeDemo.tsx`

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Blurry image | Add `image-rendering: crisp-edges` |
| Different codes each time | Ensure URL is consistent |
| Download not working | Check user interaction triggered it |
| Not displaying | Verify host status and room state |

## 💡 Tips

- Generate once, store in state
- Use monochrome for best readability
- Size 256px is optimal for web
- Use 512px+ for downloads
- Test on mobile devices

## 📊 Performance

- **Generation**: < 1ms
- **Size**: 2-5KB per code
- **Dependencies**: Zero
- **Bundle**: +3KB

## 🔗 Resources

- **Docs**: `lib/utils/QR_CODE_README.md`
- **Integration**: `components/transfer/QR_CODE_INTEGRATION_GUIDE.md`
- **Summary**: `QR_CODE_FEATURE_SUMMARY.md`

---

**Version**: 1.0.0 | **Date**: 2026-02-06
