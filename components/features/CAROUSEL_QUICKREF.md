# FeatureCarousel - Quick Reference

## Installation

✅ **No installation needed** - All dependencies already included:
- Framer Motion ✅
- Lucide React ✅
- Existing FeatureCard component ✅

## Usage

### Basic Import

```tsx
import { FeatureCarousel } from "@/components/features/feature-carousel";
import { topFeatures } from "@/lib/features/sample-features";
```

### Basic Usage

```tsx
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}
  interval={5000}
  showControls={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `features` | `Feature[]` | Required | Array of features to display |
| `autoPlay` | `boolean` | `true` | Enable auto-rotation |
| `interval` | `number` | `5000` | Rotation interval (ms) |
| `showControls` | `boolean` | `true` | Show arrows and dots |
| `className` | `string` | `undefined` | Additional CSS classes |

## Common Patterns

### Show 20 Random Features

```tsx
import { getRandomFeatures } from "@/lib/features/sample-features";

<FeatureCarousel features={getRandomFeatures(20)} />
```

### Show Security Features Only

```tsx
import { getFeaturesByTag } from "@/lib/features/sample-features";

<FeatureCarousel features={getFeaturesByTag("security")} />
```

### Manual Control Only

```tsx
<FeatureCarousel
  features={topFeatures}
  autoPlay={false}
  showControls={true}
/>
```

### Slower Auto-Play

```tsx
<FeatureCarousel
  features={topFeatures}
  interval={8000}  // 8 seconds
/>
```

### With Custom Styling

```tsx
<FeatureCarousel
  features={topFeatures}
  className="bg-muted/30 py-32"
/>
```

## Variants

### Standard Carousel

```tsx
import { FeatureCarousel } from "@/components/features/feature-carousel";

<FeatureCarousel features={topFeatures} />
```

### Categorized Carousel

```tsx
import { FeatureCarouselWithCategories } from "@/components/features/feature-carousel";
import { featuredCategories } from "@/lib/features/sample-features";

<FeatureCarouselWithCategories categories={featuredCategories} />
```

### Mobile Scroll Carousel

```tsx
import { FeatureScrollCarousel } from "@/components/features/feature-carousel";

<FeatureScrollCarousel features={topFeatures} />
```

## Responsive Behavior

| Breakpoint | Cards Per Page | Navigation |
|------------|----------------|------------|
| Desktop (lg+) | 3 | Side arrows |
| Tablet (sm-md) | 2 | Bottom buttons |
| Mobile (<sm) | 1 | Bottom buttons |

## Keyboard Shortcuts

- `Arrow Left` - Previous page
- `Arrow Right` - Next page
- `Tab` - Focus controls
- `Enter/Space` - Activate control

## Integration

### Add to Landing Page

**File**: `app/page.tsx`

```tsx
// 1. Add imports at top
import { FeatureCarousel } from "@/components/features/feature-carousel";
import { topFeatures } from "@/lib/features/sample-features";

// 2. Add carousel in render (after existing features grid)
export default function Home() {
  return (
    <div>
      {/* ... existing sections ... */}

      <FeatureCarousel
        features={topFeatures}
        autoPlay={true}
        interval={5000}
        showControls={true}
        className="border-t border-border"
      />

      {/* ... rest of page ... */}
    </div>
  );
}
```

## Accessibility

- ✅ ARIA labels and live regions
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus indicators
- ✅ High contrast mode
- ✅ Reduced motion support

## Features

- ✅ Auto-rotating with pause on hover
- ✅ Manual controls (arrows, dots)
- ✅ Keyboard navigation
- ✅ Smooth animations
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Touch-friendly
- ✅ Production-ready

## Files

| File | Purpose |
|------|---------|
| `feature-carousel.tsx` | Main component |
| `sample-features.ts` | Feature data |
| `feature-carousel-example.tsx` | Usage examples |
| `CAROUSEL_README.md` | Full documentation |
| `CAROUSEL_INTEGRATION.md` | Integration guide |

## Troubleshooting

### Not showing

```tsx
// Check imports
import { FeatureCarousel } from "@/components/features/feature-carousel";
import { topFeatures } from "@/lib/features/sample-features";

// Verify features array
console.log(topFeatures.length); // Should be 30
```

### Not auto-rotating

```tsx
// Ensure autoPlay is true and interval is set
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}  // Must be true
  interval={5000}   // Must be > 0
/>
```

### TypeScript errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run dev
```

## Support

- Full docs: `CAROUSEL_README.md`
- Integration: `CAROUSEL_INTEGRATION.md`
- Examples: `feature-carousel-example.tsx`
- GitHub issues: For bugs/questions

## Version

**v1.0.0** - Production Ready ✅
