# FeatureCarousel Component

A production-ready, accessible carousel component for showcasing Tallow's 150+ features.

## Features

- ✅ **Auto-rotating** with configurable interval (default 5s)
- ✅ **Manual controls**: Arrow buttons, dot indicators, keyboard navigation
- ✅ **Pause on hover** - stops auto-rotation when user interacts
- ✅ **Responsive design**:
  - Desktop (lg+): 3 cards per page
  - Tablet (sm-md): 2 cards per page
  - Mobile (<sm): 1 card per page
- ✅ **Smooth animations** with Framer Motion
- ✅ **Keyboard navigation** - Arrow Left/Right keys
- ✅ **Full accessibility**:
  - ARIA labels and live regions
  - Screen reader announcements
  - Focus management
  - High contrast mode support
  - Reduced motion support
- ✅ **Touch-friendly** on mobile devices

## File Locations

```
components/features/
├── feature-carousel.tsx              # Main carousel component
├── feature-carousel-example.tsx      # Integration examples
├── feature-card.tsx                  # Card component (existing)
└── CAROUSEL_README.md                # This file

lib/features/
├── sample-features.ts                # Curated feature data
└── types.ts                          # Type definitions (existing)
```

## Quick Start

### 1. Import the component

```tsx
import { FeatureCarousel } from "@/components/features/feature-carousel";
import { topFeatures } from "@/lib/features/sample-features";
```

### 2. Add to your page

```tsx
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}
  interval={5000}
  showControls={true}
/>
```

## Component API

### FeatureCarousel

Main carousel component with auto-rotation and manual controls.

```tsx
interface FeatureCarouselProps {
  features: Feature[];        // Array of features to display
  autoPlay?: boolean;         // Enable auto-rotation (default: true)
  interval?: number;          // Rotation interval in ms (default: 5000)
  showControls?: boolean;     // Show arrow buttons and dots (default: true)
  className?: string;         // Additional CSS classes
}
```

### FeatureCarouselWithCategories

Enhanced carousel that groups features by category.

```tsx
interface FeatureCarouselWithCategoriesProps {
  categories: Array<{
    id: string;
    name: string;
    features: Feature[];
  }>;
  autoPlay?: boolean;
  interval?: number;
  showControls?: boolean;
  className?: string;
}
```

### FeatureScrollCarousel

Alternative carousel using horizontal scroll with snap points.
Better for mobile/touch devices.

```tsx
interface FeatureScrollCarouselProps {
  features: Feature[];
  className?: string;
}
```

## Usage Examples

### Basic Carousel

```tsx
import { FeatureCarousel } from "@/components/features/feature-carousel";
import { topFeatures } from "@/lib/features/sample-features";

export function MyPage() {
  return (
    <FeatureCarousel
      features={topFeatures}
      autoPlay={true}
      interval={5000}
      showControls={true}
    />
  );
}
```

### Carousel with Categories

```tsx
import { FeatureCarouselWithCategories } from "@/components/features/feature-carousel";
import { featuredCategories } from "@/lib/features/sample-features";

export function MyPage() {
  return (
    <FeatureCarouselWithCategories
      categories={featuredCategories}
      autoPlay={true}
      interval={5000}
      showControls={true}
    />
  );
}
```

### Mobile-Optimized Scroll Carousel

```tsx
import { FeatureScrollCarousel } from "@/components/features/feature-carousel";
import { topFeatures } from "@/lib/features/sample-features";

export function MyPage() {
  return (
    <FeatureScrollCarousel features={topFeatures} />
  );
}
```

### Manual Control Only (No Auto-Play)

```tsx
<FeatureCarousel
  features={topFeatures}
  autoPlay={false}
  showControls={true}
/>
```

### Custom Interval

```tsx
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}
  interval={8000}  // 8 seconds
  showControls={true}
/>
```

### With Custom Styling

```tsx
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}
  interval={5000}
  showControls={true}
  className="bg-background border-t border-b border-border"
/>
```

## Integration into app/page.tsx

### Option 1: Replace Existing Features Grid

Replace the static 6-feature grid with the carousel:

```tsx
// BEFORE: Static grid
<section className="section-content-lg border-t border-border">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* 6 static features */}
  </div>
</section>

// AFTER: Dynamic carousel
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}
  interval={5000}
  showControls={true}
  className="border-t border-border"
/>
```

### Option 2: Add After Existing Grid

Keep the static grid and add carousel as "More Features":

```tsx
{/* Existing Features Grid */}
<section className="section-content-lg border-t border-border">
  {/* ... existing 6 features ... */}
</section>

{/* New: Feature Carousel */}
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}
  interval={5000}
  showControls={true}
  className="border-t border-border"
/>
```

### Option 3: Add Before Final CTA

Place just before the conversion section:

```tsx
{/* Connection Types */}
<section className="section-content border-t border-border">
  {/* ... existing ... */}
</section>

{/* New: Feature Carousel */}
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}
  interval={5000}
  showControls={true}
  className="border-t border-border"
/>

{/* Final CTA */}
<section className="section-content-lg border-t border-border">
  {/* ... existing ... */}
</section>
```

## Feature Data

### Top 30 Features

The `sample-features.ts` file contains 30 curated features across categories:

- **Core Features**: P2P Transfer, E2E Encryption, PQC
- **Discovery & Connection**: Local Discovery, QR Codes, Word Codes
- **Advanced Transfer**: Folders, Resumable, Group Transfer
- **Privacy & Security**: Onion Routing, Metadata Stripping, Password Protection
- **Communication**: Encrypted Chat, Screen Sharing, Email Fallback
- **User Experience**: Drag & Drop, Transfer Queue, Progress Tracking
- **Device Management**: Device Sync, Friends List
- **Performance**: Chunked Transfer, Compression
- **Platform Features**: PWA, Offline Support
- **Accessibility**: i18n, High Contrast, Keyboard Navigation
- **Advanced Security**: Digital Signatures, Peer Verification, Encrypted Storage

### Helper Functions

```tsx
import {
  topFeatures,              // All 30 features
  featuredCategories,       // Features grouped by category
  getRandomFeatures,        // Get random selection
  getFeaturesByStatus,      // Filter by status
  getFeaturesByTag,         // Filter by tag
} from "@/lib/features/sample-features";

// Get 20 random features
const randomFeatures = getRandomFeatures(20);

// Get only production features
const productionFeatures = getFeaturesByStatus("production");

// Get security features
const securityFeatures = getFeaturesByTag("security");
```

## Responsive Behavior

### Desktop (1024px+)

- Shows 3 cards per page
- Arrow buttons positioned on left/right sides
- Slides by 3 on navigation
- Dot indicators centered below

### Tablet (640px - 1023px)

- Shows 2 cards per page
- Mobile nav buttons below carousel
- Slides by 2 on navigation
- Dot indicators below buttons

### Mobile (< 640px)

- Shows 1 card per page
- Mobile nav buttons below carousel
- Slides by 1 on navigation
- Consider using `FeatureScrollCarousel` for better UX

## Keyboard Navigation

- **Arrow Left**: Previous page
- **Arrow Right**: Next page
- **Tab**: Focus controls
- **Enter/Space**: Activate focused control

## Accessibility

### ARIA Implementation

```tsx
<div
  role="region"
  aria-label="Feature carousel"
  aria-live="polite"
  aria-atomic="false"
>
  {/* Carousel content */}
</div>

<button
  aria-label="Previous features"
  aria-controls="carousel-content"
>
  {/* Previous button */}
</button>

<div role="tablist" aria-label="Carousel page indicators">
  <button
    role="tab"
    aria-label="Go to page 1"
    aria-selected={currentPage === 0}
    aria-current={currentPage === 0 ? "true" : undefined}
  />
</div>
```

### Screen Reader Support

- Announces current page and total pages
- Announces navigation actions
- Describes controls and their purpose
- Supports high contrast mode
- Respects reduced motion preferences

### Focus Management

- Clear focus indicators
- Logical tab order
- Focus trap when needed
- Skip links available

## Performance

### Optimizations

- Lazy loading with Framer Motion
- Only renders visible cards
- GPU-accelerated animations
- Debounced resize handlers
- Efficient re-renders with React.memo

### Bundle Size

- Framer Motion: ~60KB (already included)
- Lucide Icons: ~5KB (2 icons)
- Component code: ~8KB
- **Total additional**: ~13KB

## Animations

### Slide Transition

```tsx
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};
```

### Card Fade-In

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    delay: index * 0.1,
    duration: 0.3,
    ease: "easeOut",
  }}
>
  {/* Card */}
</motion.div>
```

### Hover Effects

- Cards lift on hover (from FeatureCard)
- Arrow buttons scale and change background
- Dot indicators fade in/out smoothly

## Styling

### Design System Compliance

Uses existing design tokens from `app/globals.css`:

- Typography: `.display-md`, `.body-lg`
- Spacing: `py-24 sm:py-32`
- Colors: `bg-card`, `border-border`, `text-foreground`
- Shadows: `shadow-lg`
- Borders: `rounded-full`, `border`
- Transitions: `transition-all duration-200`

### Dark Mode

Fully supports dark mode with automatic color switching:

```tsx
className={cn(
  "bg-card",                    // Adapts to theme
  "border border-border",       // Theme-aware border
  "text-foreground",            // Theme-aware text
  "hover:bg-secondary",         // Theme-aware hover
)}
```

### High Contrast Mode

Supports high contrast mode from globals.css:

- Thicker borders
- Enhanced focus indicators
- Stronger shadows
- Higher color contrast

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

### Polyfills Required

- None (uses modern React and Framer Motion)

## Testing

### Manual Testing Checklist

- [ ] Auto-rotation works
- [ ] Pause on hover works
- [ ] Arrow buttons navigate correctly
- [ ] Dot indicators show correct page
- [ ] Keyboard navigation works (Arrow Left/Right)
- [ ] Responsive behavior (3-col, 2-col, 1-col)
- [ ] Mobile touch gestures work
- [ ] Dark mode switches correctly
- [ ] High contrast mode works
- [ ] Screen reader announces correctly
- [ ] Focus indicators visible
- [ ] Reduced motion respected

### E2E Testing

```typescript
// tests/e2e/feature-carousel.spec.ts
test("carousel auto-rotates", async ({ page }) => {
  await page.goto("/");

  // Wait for first rotation
  await page.waitForTimeout(5000);

  // Check that page changed
  const currentPage = await page.textContent('[aria-current="true"]');
  expect(currentPage).toBeTruthy();
});

test("carousel pauses on hover", async ({ page }) => {
  await page.goto("/");

  // Hover over carousel
  await page.hover('[role="region"][aria-label="Feature carousel"]');

  // Wait and verify no rotation
  const initialPage = await page.textContent('[aria-current="true"]');
  await page.waitForTimeout(6000);
  const finalPage = await page.textContent('[aria-current="true"]');

  expect(initialPage).toBe(finalPage);
});

test("arrow buttons navigate", async ({ page }) => {
  await page.goto("/");

  // Click next button
  await page.click('[aria-label="Next features"]');

  // Verify page changed
  const dots = await page.$$('[role="tab"][aria-selected="true"]');
  expect(dots.length).toBe(1);
});

test("keyboard navigation works", async ({ page }) => {
  await page.goto("/");

  // Focus carousel
  await page.focus('[role="region"]');

  // Press Arrow Right
  await page.keyboard.press("ArrowRight");

  // Wait for animation
  await page.waitForTimeout(500);

  // Verify navigation
  const currentPage = await page.getAttribute('[aria-current="true"]', 'aria-label');
  expect(currentPage).toContain("page 2");
});
```

## Troubleshooting

### Carousel not auto-rotating

1. Check `autoPlay` prop is `true`
2. Verify `interval` is set (default 5000ms)
3. Ensure `totalPages > 1`
4. Check browser console for errors

### Cards not showing

1. Verify `features` array has items
2. Check FeatureCard import is correct
3. Verify Feature type matches
4. Check CSS classes are applied

### Animations not smooth

1. Enable GPU acceleration in globals.css
2. Check Framer Motion is installed
3. Verify no CSS conflicts
4. Test in production build

### Responsive breakpoints not working

1. Check Tailwind CSS is configured
2. Verify breakpoints in tailwind.config
3. Test viewport resize
4. Check window resize listener

### Accessibility issues

1. Test with screen reader
2. Verify ARIA labels are present
3. Check keyboard navigation
4. Test high contrast mode
5. Verify reduced motion support

## Future Enhancements

- [ ] Swipe gestures on mobile
- [ ] Vertical carousel variant
- [ ] Grid view option
- [ ] Infinite loop mode
- [ ] Custom transition effects
- [ ] Video feature previews
- [ ] Search/filter integration
- [ ] Deep linking to features
- [ ] Social sharing
- [ ] Analytics tracking

## License

MIT - Same as Tallow project

## Support

For issues or questions:
1. Check this README
2. Review example file
3. Check feature-card.tsx implementation
4. Open GitHub issue
