# Metadata Stripping Demo - Quick Start Guide

## Instant Usage

### 1. Import the Component

```tsx
import { MetadataStrippingDemo } from '@/components/demos/metadata-stripping-demo';
```

### 2. Add to Your Page

```tsx
export default function Page() {
  return (
    <div className="container mx-auto p-8">
      <MetadataStrippingDemo />
    </div>
  );
}
```

### 3. View the Demo

Visit: `/metadata-demo` or integrate into any page.

---

## File Locations

| File | Path |
|------|------|
| Component | `C:\Users\aamir\Documents\Apps\Tallow\components\demos\metadata-stripping-demo.tsx` |
| Demo Page | `C:\Users\aamir\Documents\Apps\Tallow\app\metadata-demo\page.tsx` |
| Index Export | `C:\Users\aamir\Documents\Apps\Tallow\components\demos\index.ts` |
| Full Docs | `C:\Users\aamir\Documents\Apps\Tallow\METADATA_STRIPPING_DEMO.md` |

---

## Key Features

- Interactive before/after comparison
- Visual metadata display (GPS, Camera, Timestamps, Author)
- Privacy risk explanations
- Loading states and animations
- Fully responsive design
- Theme-aware (light/dark mode)
- Production-ready TypeScript

---

## Component Props

**None required** - Works out of the box!

The component is self-contained with all state management internal.

---

## Demo Flow

1. **Initial**: Shows "Select Demo Image" button
2. **Metadata Display**: Shows original file with all EXIF data highlighted
3. **Stripping**: Click "Strip Metadata" button (1.5s loading simulation)
4. **Complete**: Side-by-side shows clean file with success indicators
5. **Reset**: "Try Another Image" button to restart

---

## Metadata Types Shown

| Type | Icon | Color | Privacy Risk |
|------|------|-------|--------------|
| GPS Location | MapPin | Red | Location tracking |
| Camera Info | Camera | Blue | Device fingerprinting |
| Timestamps | Calendar | Purple | Timeline reconstruction |
| Author Data | X | Orange | Identity exposure |

---

## Integration with Real Metadata Stripper

```tsx
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';

const { isProcessing, checkMetadata, processFile } = useMetadataStripper();

// Check metadata
const metadata = await checkMetadata(file);

// Strip metadata
const cleanFile = await processFile(file);
```

---

## Customization Quick Tips

### Change Mock Data

Edit `MOCK_METADATA` in the component:

```tsx
const MOCK_METADATA = {
  gps: {
    latitude: 'YOUR_LAT',
    longitude: 'YOUR_LONG',
    altitude: 'YOUR_ALT',
  },
  // ... etc
};
```

### Adjust Timing

Change simulation delay:

```tsx
// Line ~115 in component
await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds
```

### Add Custom Content

Extend the educational sections at the bottom of the component.

---

## Styling

All styles use Tailwind CSS classes. Key patterns:

- **Cards**: `rounded-lg border`
- **Spacing**: `space-y-4`, `gap-6`
- **Responsive**: `grid-cols-1 lg:grid-cols-2`
- **Dark Mode**: `dark:bg-X dark:text-Y`
- **Transitions**: `transition-all duration-300`

---

## Icons Used

From `lucide-react`:

```tsx
import {
  Image,
  Shield,
  MapPin,
  Camera,
  Calendar,
  X,
  Upload,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
```

---

## Testing

### Quick Manual Test

1. Open `/metadata-demo`
2. Click "Select Demo Image"
3. Verify metadata appears on left card
4. Click "Strip Metadata"
5. Wait for loading (1.5s)
6. Verify right card shows success
7. Click "Try Another Image"
8. Verify reset works

### Automated Test Snippet

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

test('basic flow', async () => {
  render(<MetadataStrippingDemo />);

  fireEvent.click(screen.getByText(/Select Demo Image/i));
  expect(screen.getByText(/GPS Location/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText(/Strip Metadata/i));

  await waitFor(() => {
    expect(screen.getByText(/All Metadata Removed/i)).toBeInTheDocument();
  });
});
```

---

## Common Issues

### Icons Not Showing

```bash
npm install lucide-react
```

### Styles Not Applied

Check `tailwind.config.ts` includes:

```ts
content: [
  './components/**/*.{ts,tsx}',
  './app/**/*.{ts,tsx}',
],
```

### TypeScript Errors

Ensure `@/components/ui/button` and `@/components/ui/card` exist.

---

## Related Components

- `PQCEncryptionDemo` - Shows post-quantum encryption
- `FileSelector` - Real file upload component
- `TransferProgress` - Actual transfer progress

---

## Need Help?

1. Check full documentation: `METADATA_STRIPPING_DEMO.md`
2. Review component source code (well-commented)
3. Look at real metadata stripper: `lib/privacy/metadata-stripper.ts`

---

**Ready to Use!** Just import and add to any page. No configuration needed.
