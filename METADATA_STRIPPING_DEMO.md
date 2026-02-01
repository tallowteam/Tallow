# Metadata Stripping Demo Component

## Overview

The `MetadataStrippingDemo` component is an interactive educational tool that demonstrates Tallow's automatic metadata stripping capabilities. It provides a visual, side-by-side comparison showing how sensitive EXIF data is removed from images before transfer.

## Component Location

**File:** `C:\Users\aamir\Documents\Apps\Tallow\components\demos\metadata-stripping-demo.tsx`

## Features

### Core Functionality

- **Interactive File Selection**: Simulated file upload experience
- **Before/After Comparison**: Side-by-side cards showing original vs cleaned files
- **Metadata Visualization**: Detailed display of sensitive EXIF data
- **Real-time Stripping Simulation**: Loading states and animations
- **Educational Content**: Privacy risk explanations and best practices

### Displayed Metadata Types

1. **GPS Location Data**
   - Latitude, Longitude, Altitude
   - Risk indicator showing location tracking concerns

2. **Camera/Device Information**
   - Make, Model, Software version
   - Device fingerprinting warnings

3. **Timestamp Information**
   - Date/time original, Date/time digitized
   - Timeline reconstruction risks

4. **Author Information**
   - Artist name, Copyright data
   - Identity protection concerns

### UI Components Used

- `Button` from `@/components/ui/button`
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` from `@/components/ui/card`
- Lucide React icons:
  - `Image`, `Shield`, `MapPin`, `Camera`, `Calendar`, `X`
  - `Upload`, `AlertTriangle`, `CheckCircle`

## Usage

### Basic Integration

```tsx
import { MetadataStrippingDemo } from '@/components/demos/metadata-stripping-demo';

function PrivacyPage() {
  return (
    <div className="container mx-auto p-8">
      <MetadataStrippingDemo />
    </div>
  );
}
```

### Standalone Page

A demo page is available at:

**Route:** `/metadata-demo`
**File:** `C:\Users\aamir\Documents\Apps\Tallow\app\metadata-demo\page.tsx`

Visit the page to see the component in action.

### Export from Index

```tsx
// Import via barrel export
import { MetadataStrippingDemo } from '@/components/demos';
```

## Component Structure

### State Management

```tsx
const [fileName, setFileName] = useState<string | null>(null);
const [isStripping, setIsStripping] = useState(false);
const [isStripped, setIsStripped] = useState(false);
const [showMetadata, setShowMetadata] = useState(false);
```

### Mock Metadata

The component uses realistic mock data to simulate actual EXIF information:

```tsx
const MOCK_METADATA: MockMetadata = {
  gps: {
    latitude: '37.7749° N',
    longitude: '122.4194° W',
    altitude: '52m above sea level',
  },
  camera: {
    make: 'Apple',
    model: 'iPhone 14 Pro',
    software: 'iOS 17.2.1',
  },
  timestamp: {
    dateTimeOriginal: '2024-03-15 14:23:45',
    dateTimeDigitized: '2024-03-15 14:23:45',
  },
  author: {
    artist: 'John Doe',
    copyright: 'Copyright 2024',
  },
};
```

## Design Patterns

### Theme Support

The component fully supports light and dark modes using Tailwind's `dark:` variant:

```tsx
<div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
```

### Responsive Layout

- **Mobile**: Single column layout
- **Tablet/Desktop**: Side-by-side comparison (using `lg:grid-cols-2`)

### Visual States

1. **Initial State**: File upload prompt
2. **Metadata Display**: Shows original file with all metadata
3. **Stripping State**: Loading animation
4. **Complete State**: Clean file with success indicators

### Color Coding

- **Amber/Yellow**: Warnings about metadata presence
- **Red**: Critical privacy risks (GPS data)
- **Blue**: Informational (camera data)
- **Purple**: Timestamps
- **Orange**: Author info
- **Green**: Success state after stripping

## Accessibility

- Semantic HTML structure
- Descriptive aria-labels on interactive elements
- Color contrast ratios meet WCAG standards
- Keyboard navigation support via Button components
- Screen reader friendly status messages

## Animations

- Smooth transitions on state changes (`transition-all duration-300`)
- Ring highlights for active cards
- Pulse animation on loading states
- Opacity transitions between states

## Educational Content

### Privacy Risk Banner

Explains why metadata is dangerous:
- Location tracking
- Device fingerprinting
- Timeline reconstruction
- Identity exposure

### "Why Remove Metadata?" Section

Four key privacy risks with icons:
1. Location Tracking (MapPin)
2. Device Fingerprinting (Camera)
3. Timeline Reconstruction (Calendar)
4. Identity Protection (Shield)

### "How Tallow Protects You" Section

Three-step process:
1. Automatic Detection
2. Smart Stripping
3. Secure Transfer

## Integration with Real Metadata Stripper

To integrate with actual metadata stripping functionality:

```tsx
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';
import { extractMetadata, stripMetadata } from '@/lib/privacy/metadata-stripper';

function RealMetadataDemo() {
  const { isProcessing, checkMetadata, processFile } = useMetadataStripper();
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    // Extract metadata
    const meta = await checkMetadata(uploadedFile);
    setMetadata(meta);
  };

  const handleStrip = async () => {
    if (!file) return;

    // Strip metadata
    const cleanFile = await processFile(file);
    // Handle clean file...
  };

  // Render UI...
}
```

## Performance Considerations

- **No Heavy Computations**: Uses simulated delays, not actual processing
- **Optimized Re-renders**: Minimal state updates
- **Lazy Loading**: Can be code-split for better initial load
- **Small Bundle Size**: Only imports necessary Lucide icons

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Related Components

- `PQCEncryptionDemo` - Demonstrates post-quantum encryption
- `FileSelector` - Actual file upload component
- `TransferProgress` - Shows real transfer progress

## Related Libraries

- `@/lib/privacy/metadata-stripper.ts` - Core metadata stripping logic
- `@/lib/hooks/use-metadata-stripper.ts` - React hook for metadata operations
- `exifreader` - External library for EXIF parsing

## Customization

### Modify Mock Data

Edit `MOCK_METADATA` constant to show different examples:

```tsx
const MOCK_METADATA: MockMetadata = {
  gps: {
    latitude: '48.8566° N', // Paris coordinates
    longitude: '2.3522° E',
    altitude: '35m above sea level',
  },
  // ... other fields
};
```

### Add More Metadata Fields

Extend the `MockMetadata` interface:

```tsx
interface MockMetadata {
  // ... existing fields
  technical: {
    iso: string;
    aperture: string;
    shutterSpeed: string;
  };
}
```

### Change Animation Timing

Adjust the simulation delay:

```tsx
// From 1500ms to 2000ms
await new Promise((resolve) => setTimeout(resolve, 2000));
```

## Testing Recommendations

### Unit Tests

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MetadataStrippingDemo } from './metadata-stripping-demo';

test('shows file upload button initially', () => {
  render(<MetadataStrippingDemo />);
  expect(screen.getByText(/Select Demo Image/i)).toBeInTheDocument();
});

test('displays metadata after file selection', () => {
  render(<MetadataStrippingDemo />);

  fireEvent.click(screen.getByText(/Select Demo Image/i));

  expect(screen.getByText(/GPS Location/i)).toBeInTheDocument();
  expect(screen.getByText(/Camera Information/i)).toBeInTheDocument();
});

test('strips metadata and shows success state', async () => {
  render(<MetadataStrippingDemo />);

  fireEvent.click(screen.getByText(/Select Demo Image/i));
  fireEvent.click(screen.getByText(/Strip Metadata/i));

  await waitFor(() => {
    expect(screen.getByText(/All Metadata Removed/i)).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('metadata stripping demo flow', async ({ page }) => {
  await page.goto('/metadata-demo');

  // Select demo image
  await page.click('button:has-text("Select Demo Image")');

  // Verify metadata is shown
  await expect(page.locator('text=GPS Location')).toBeVisible();

  // Strip metadata
  await page.click('button:has-text("Strip Metadata")');

  // Wait for completion
  await expect(page.locator('text=All Metadata Removed')).toBeVisible();

  // Verify success state
  await expect(page.locator('text=METADATA REMOVED')).toBeVisible();
});
```

## Future Enhancements

1. **Real File Upload**: Allow users to upload their own images
2. **Live Metadata Extraction**: Show actual EXIF data from uploaded files
3. **Download Clean File**: Let users download the stripped version
4. **Comparison Slider**: Interactive before/after slider
5. **More File Types**: Support video metadata examples
6. **Privacy Score**: Calculate and display privacy risk score
7. **Batch Processing**: Show multiple files being processed
8. **Advanced Options**: Let users choose which metadata to keep/remove

## Troubleshooting

### Component Not Rendering

Check that all dependencies are installed:

```bash
npm install lucide-react class-variance-authority
```

### Styles Not Applied

Ensure Tailwind CSS is properly configured and `globals.css` is imported.

### Icons Missing

Verify lucide-react icons are imported at the top of the component.

## License

Part of the Tallow project. See main project license for details.

## Support

For issues or questions:
- Check component source code and inline comments
- Review Tallow's privacy documentation
- See related metadata stripper library documentation

---

**Last Updated:** 2026-01-26
**Component Version:** 1.0.0
**Tallow Compatibility:** v1.0+
