# QR Code Integration Guide

Quick reference for integrating visual codes into Tallow components.

## Quick Start

### 1. Import the Generator

```typescript
import { generateEnhancedVisualCodeDataURL } from '@/lib/utils/qr-code-generator';
```

### 2. Generate Visual Code

```typescript
const roomCode = 'ABC123';
const url = `${window.location.origin}/transfer?room=${roomCode}`;

const visualCodeUrl = generateEnhancedVisualCodeDataURL(url, {
  size: 256,
  gridSize: 12,
  colorScheme: 'monochrome',
});
```

### 3. Display in Component

```tsx
<img
  src={visualCodeUrl}
  alt={`Visual code for room ${roomCode}`}
  style={{ width: 256, height: 256 }}
/>
```

## Integration Points

### RoomCodeConnect Component

**Location**: `components/transfer/RoomCodeConnect.tsx`

**Features Added**:
- Show/Hide visual code button
- Visual code display with animation
- Download functionality
- Responsive design

**Usage**:
```tsx
// The visual code is automatically available when:
// 1. User is in a room (isInRoom === true)
// 2. User is the host (isHost === true)

// Click "Show Visual Code" button to display
// Click "Download" to save as SVG file
```

### State Management

```typescript
const [showQRCode, setShowQRCode] = useState(false);

const handleToggleQRCode = useCallback(() => {
  setShowQRCode(prev => !prev);
}, []);
```

### Download Handler

```typescript
const handleDownloadQRCode = useCallback(() => {
  if (!activeRoomCode) return;

  const baseUrl = window.location.origin;
  const shareableLink = `${baseUrl}/transfer?room=${activeRoomCode}`;

  downloadVisualCode(shareableLink, `tallow-room-${activeRoomCode}.svg`, {
    size: 512,
    gridSize: 12,
    colorScheme: 'monochrome',
  });

  toast.success('QR code downloaded!');
}, [activeRoomCode, toast]);
```

## Styling

### CSS Modules Approach

All styles use CSS modules with design tokens:

```css
/* QR Code Container */
.qrCodeContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  animation: slideDown 0.3s ease-out;
}

/* QR Code Image */
.qrCodeImage {
  display: block;
  width: 256px;
  height: 256px;
  image-rendering: crisp-edges;
}
```

### Design Tokens Used

- `--space-*`: Spacing system
- `--color-*`: Color palette
- `--radius-*`: Border radius
- `--font-*`: Typography
- `--transition-*`: Animations

## Component Structure

```tsx
{isHost && (
  <>
    {/* Share Buttons */}
    <div className={styles.shareButtons}>
      {/* Share Link, Copy Code buttons */}
    </div>

    {/* QR Code Toggle Button */}
    <button
      onClick={handleToggleQRCode}
      className={styles.qrButton}
      aria-label={showQRCode ? 'Hide visual code' : 'Show visual code'}
      aria-expanded={showQRCode}
    >
      <QRCodeIcon />
      <span>{showQRCode ? 'Hide Visual Code' : 'Show Visual Code'}</span>
    </button>

    {/* QR Code Display (conditional) */}
    {showQRCode && (
      <div className={styles.qrCodeContainer}>
        <div className={styles.qrCodeWrapper}>
          <img
            src={generateEnhancedVisualCodeDataURL(url, options)}
            alt={`Visual code for room ${activeRoomCode}`}
            className={styles.qrCodeImage}
          />
        </div>
        <p className={styles.qrCodeHint}>
          Scan or share this visual code to join the room
        </p>
        <button
          onClick={handleDownloadQRCode}
          className={styles.downloadButton}
        >
          <DownloadIcon />
          <span>Download</span>
        </button>
      </div>
    )}
  </>
)}
```

## Configuration Options

### Recommended Settings

#### For Display (Web)
```typescript
{
  size: 256,              // Good for most screens
  gridSize: 12,           // Balance between detail and readability
  colorScheme: 'monochrome', // High contrast
  padding: 16,            // Standard padding
}
```

#### For Download (Print)
```typescript
{
  size: 512,              // Higher resolution
  gridSize: 12,           // Keep consistent
  colorScheme: 'monochrome', // Best for printing
  padding: 32,            // More breathing room
}
```

#### For Sharing (Social)
```typescript
{
  size: 1024,             // Social media optimal
  gridSize: 16,           // More detail
  colorScheme: 'accent',  // Brand colors
  padding: 48,            // Extra padding for cropping
}
```

## Accessibility

### ARIA Labels

```tsx
<button
  onClick={handleToggleQRCode}
  aria-label={showQRCode ? 'Hide visual code' : 'Show visual code'}
  aria-expanded={showQRCode}
>
  Show Visual Code
</button>

<img
  src={visualCodeUrl}
  alt={`Visual code for room ${roomCode}`}
  // Descriptive alt text for screen readers
/>
```

### Keyboard Navigation

All buttons are fully keyboard accessible:
- Tab to focus
- Enter/Space to activate
- Escape to close (if applicable)

### High Contrast

The monochrome color scheme provides excellent contrast for users with visual impairments.

## Performance

### Optimization Tips

1. **Generate Once**: Store the data URL in state, don't regenerate on every render
2. **Lazy Loading**: Only generate when the visual code is shown
3. **Memoization**: Use `useMemo` for expensive operations

```typescript
const visualCodeUrl = useMemo(() => {
  if (!showQRCode || !activeRoomCode) return '';

  return generateEnhancedVisualCodeDataURL(
    `${window.location.origin}/transfer?room=${activeRoomCode}`,
    { size: 256, gridSize: 12, colorScheme: 'monochrome' }
  );
}, [showQRCode, activeRoomCode]);
```

### Bundle Size

- Generator function: ~3KB minified
- No external dependencies
- Tree-shakeable exports

## Testing

### Unit Tests

```typescript
import { generateEnhancedVisualCodeDataURL } from '@/lib/utils/qr-code-generator';

describe('Visual Code in RoomCodeConnect', () => {
  it('generates consistent codes', () => {
    const url = 'https://tallow.app/transfer?room=ABC123';
    const code1 = generateEnhancedVisualCodeDataURL(url);
    const code2 = generateEnhancedVisualCodeDataURL(url);
    expect(code1).toBe(code2);
  });

  it('generates different codes for different rooms', () => {
    const code1 = generateEnhancedVisualCodeDataURL('room=ABC123');
    const code2 = generateEnhancedVisualCodeDataURL('room=XYZ789');
    expect(code1).not.toBe(code2);
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('visual code generation', async ({ page }) => {
  // Create a room
  await page.goto('/transfer');
  await page.click('button:has-text("Create a Room")');

  // Wait for room creation
  await page.waitForSelector('[data-testid="room-code"]');

  // Show visual code
  await page.click('button:has-text("Show Visual Code")');

  // Verify image is displayed
  const img = page.locator('img[alt*="Visual code"]');
  await expect(img).toBeVisible();

  // Verify data URL format
  const src = await img.getAttribute('src');
  expect(src).toMatch(/^data:image\/svg\+xml;base64,/);
});
```

## Troubleshooting

### Common Issues

#### Visual Code Not Displaying
**Cause**: `activeRoomCode` is undefined or empty
**Solution**: Ensure user is in a room and is the host

#### Download Not Working
**Cause**: Browser blocking blob URLs
**Solution**: Ensure user interaction triggered the download

#### Blurry Visual Code
**Cause**: Missing `image-rendering: crisp-edges`
**Solution**: Add CSS property to img element

#### Different Codes Each Time
**Cause**: URL changes (protocol, domain, etc.)
**Solution**: Normalize URL format before generation

### Debug Mode

Enable debug logging:

```typescript
const visualCodeUrl = generateEnhancedVisualCodeDataURL(url, options);
console.log('Generated visual code for:', url);
console.log('Data URL length:', visualCodeUrl.length);
```

## Future Enhancements

### Planned Features

1. **Camera Scanning**: Add camera-based visual code recognition
2. **Real QR Codes**: Integrate actual QR code library for better compatibility
3. **Animated Codes**: Add subtle animations for visual interest
4. **Custom Branding**: Allow custom colors and logos
5. **NFC Integration**: Enable tap-to-share on mobile devices

### Contributing

To add new features:

1. Update `qr-code-generator.ts` with new functions
2. Add corresponding tests in `qr-code-generator.test.ts`
3. Update this integration guide
4. Update the main README

## Resources

- **Main Implementation**: `lib/utils/qr-code-generator.ts`
- **Component Integration**: `components/transfer/RoomCodeConnect.tsx`
- **Styles**: `components/transfer/RoomCodeConnect.module.css`
- **Tests**: `lib/utils/qr-code-generator.test.ts`
- **Documentation**: `lib/utils/QR_CODE_README.md`
- **Demo**: `components/transfer/VisualCodeDemo.tsx`

## Support

For issues or questions:
1. Check the main README
2. Review test cases for examples
3. Examine the demo component
4. File an issue on GitHub
