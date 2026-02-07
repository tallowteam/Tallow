# Visual Code Generator for Room Sharing

A lightweight, dependency-free visual code generator for sharing Tallow room codes. This creates deterministic, scannable visual patterns that serve as an alternative to traditional QR codes.

## Features

- **Zero Dependencies**: Pure TypeScript/JavaScript implementation
- **Deterministic**: Same input always generates the same visual code
- **Customizable**: Multiple color schemes and grid sizes
- **SVG-Based**: Scalable vector graphics for crisp display at any size
- **Enhanced Mode**: Includes QR-like corner markers for orientation
- **Lightweight**: Minimal code footprint

## Architecture

### Visual Code Structure

The visual code consists of:
1. **Grid Pattern**: A matrix of colored circles/squares derived from the room code
2. **Corner Markers**: Three positioning squares (similar to QR codes) for orientation
3. **Background**: White background with rounded corners
4. **Optional Text**: Can include URL text at the bottom

### Generation Process

```
Room Code → Hash Function → Color Grid → SVG Generation → Data URL
```

1. **Hashing**: The room code is hashed to generate deterministic values
2. **Color Mapping**: Hash values are mapped to colors based on the selected scheme
3. **Grid Layout**: Colors are arranged in a grid pattern
4. **SVG Rendering**: The pattern is rendered as an SVG with corner markers
5. **Encoding**: SVG is converted to a base64 data URL for display

## API Reference

### `generateVisualCodeData(data, gridSize, scheme)`

Generates the underlying grid data structure.

**Parameters:**
- `data: string` - The data to encode (room code or URL)
- `gridSize: number` - Size of the grid (default: 8)
- `scheme: 'monochrome' | 'gradient' | 'accent'` - Color scheme (default: 'accent')

**Returns:** `string[][]` - 2D array of color values

### `generateVisualCodeSVG(data, options)`

Generates an SVG visual code.

**Parameters:**
- `data: string` - The data to encode
- `options: VisualCodeOptions` - Configuration options

**Returns:** `string` - SVG markup

### `generateVisualCodeDataURL(data, options)`

Generates a data URL for the visual code.

**Parameters:**
- `data: string` - The data to encode
- `options: VisualCodeOptions` - Configuration options

**Returns:** `string` - Data URL (`data:image/svg+xml;base64,...`)

### `generateEnhancedVisualCode(url, options)`

Generates an enhanced visual code with QR-like corner markers.

**Parameters:**
- `url: string` - The URL to encode
- `options: VisualCodeOptions` - Configuration options

**Returns:** `string` - SVG markup

### `generateEnhancedVisualCodeDataURL(url, options)`

Generates a data URL for the enhanced visual code.

**Parameters:**
- `url: string` - The URL to encode
- `options: VisualCodeOptions` - Configuration options

**Returns:** `string` - Data URL

### `downloadVisualCode(data, filename, options)`

Downloads the visual code as an SVG file.

**Parameters:**
- `data: string` - The data to encode
- `filename: string` - Download filename (default: 'room-code.svg')
- `options: VisualCodeOptions` - Configuration options

**Returns:** `void`

## Options

```typescript
interface VisualCodeOptions {
  size?: number;           // Output size in pixels (default: 256)
  gridSize?: number;       // Grid dimensions (default: 8 for simple, 12 for enhanced)
  colorScheme?: 'monochrome' | 'gradient' | 'accent'; // Color scheme
  includeUrl?: boolean;    // Include URL text in SVG (default: false)
  padding?: number;        // Internal padding (default: 16)
}
```

## Usage Examples

### Basic Usage

```typescript
import { generateEnhancedVisualCodeDataURL } from '@/lib/utils/qr-code-generator';

const roomCode = 'ABC123';
const url = `https://tallow.app/transfer?room=${roomCode}`;

// Generate data URL for display
const dataUrl = generateEnhancedVisualCodeDataURL(url);

// Use in JSX
<img src={dataUrl} alt="Room code" />
```

### Custom Options

```typescript
const dataUrl = generateEnhancedVisualCodeDataURL(url, {
  size: 512,              // Larger size
  gridSize: 16,           // More detailed grid
  colorScheme: 'gradient', // Colorful gradient
  padding: 32,            // More padding
});
```

### Download as SVG

```typescript
import { downloadVisualCode } from '@/lib/utils/qr-code-generator';

downloadVisualCode(url, 'my-room-code.svg', {
  size: 1024,
  colorScheme: 'monochrome',
});
```

## Integration with RoomCodeConnect

The visual code is integrated into the `RoomCodeConnect` component:

1. **Show/Hide Toggle**: Hosts can toggle the visual code display
2. **Automatic Generation**: Visual code is generated from the room URL
3. **Download Option**: Users can download the code as an SVG file
4. **Responsive Display**: Code scales appropriately on different devices

### Component Usage

```tsx
// In RoomCodeConnect.tsx
import { generateEnhancedVisualCodeDataURL } from '@/lib/utils/qr-code-generator';

// Generate the visual code
const visualCodeUrl = generateEnhancedVisualCodeDataURL(
  `${window.location.origin}/transfer?room=${roomCode}`,
  { size: 256, gridSize: 12, colorScheme: 'monochrome' }
);

// Display
<img src={visualCodeUrl} alt={`Visual code for room ${roomCode}`} />
```

## Color Schemes

### Monochrome
- **Use Case**: High contrast, easy scanning, professional look
- **Colors**: Black and white patterns
- **Best For**: Printing, accessibility, simple designs

### Accent
- **Use Case**: Brand consistency, visual appeal
- **Colors**: Variations of the accent color (HSL 210)
- **Best For**: Web display, brand alignment

### Gradient
- **Use Case**: Visual variety, artistic designs
- **Colors**: Full color spectrum based on hash values
- **Best For**: Decorative purposes, unique identifiers

## Technical Details

### Hash Function

Uses a simple but effective hash function:
```typescript
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
```

### Color Generation

Colors are generated deterministically from the hash:
```typescript
// For gradient scheme
const hue = hash % 360;
const saturation = 70 + (hash % 30);
const lightness = 50 + (hash % 20);
return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
```

### Corner Markers

Enhanced codes include three corner markers:
- **Top-Left**: 3x3 grid cells
- **Top-Right**: 3x3 grid cells
- **Bottom-Left**: 3x3 grid cells

These provide orientation cues similar to QR codes.

## Performance

- **Generation Time**: < 1ms for typical room codes
- **File Size**: ~2-5KB for base64-encoded SVG
- **Memory Usage**: Minimal (no canvas manipulation)
- **Rendering**: Hardware-accelerated SVG rendering

## Browser Support

Works in all modern browsers that support:
- SVG rendering
- Base64 encoding (`btoa`)
- Data URLs

## Security Considerations

1. **No External Services**: All generation happens client-side
2. **No Telemetry**: No data is sent to external servers
3. **Deterministic Output**: Same input always produces same output
4. **URL Encoding**: URLs are safely encoded in SVG format

## Limitations

- **Not a Real QR Code**: Cannot be scanned by standard QR code readers
- **Visual Identifier**: Primarily serves as a visual verification tool
- **Manual Entry Still Required**: Users must manually enter the room code or URL

## Future Enhancements

Potential improvements:
1. **Actual QR Code Support**: Integrate a proper QR code library
2. **Camera Scanning**: Add camera-based code recognition
3. **NFC Support**: Enable tap-to-share on compatible devices
4. **Animated Codes**: Add subtle animations to the visual pattern
5. **Error Correction**: Implement basic error correction in the pattern

## Testing

Run tests with:
```bash
npm test lib/utils/qr-code-generator.test.ts
```

Test coverage includes:
- Grid generation
- SVG markup validity
- Data URL encoding
- Deterministic output
- Color scheme variations

## License

Part of the Tallow project. See main LICENSE file.
