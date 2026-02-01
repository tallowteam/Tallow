# FeatureCarousel Integration Guide

Quick guide to add the FeatureCarousel to your landing page.

## Step 1: Import the Component

Add these imports to the top of `app/page.tsx`:

```tsx
import { FeatureCarousel } from "@/components/features/feature-carousel";
import { topFeatures } from "@/lib/features/sample-features";
```

## Step 2: Choose Integration Method

### Option A: Replace Existing Features Grid (Recommended)

Replace the static 6-feature grid with the dynamic carousel:

```tsx
// FIND THIS SECTION (around line 124):
{/* Features Grid */}
<section className="section-content-lg border-t border-border">
  <div className="container mx-auto px-6">
    <div className="text-center mb-16">
      <p className="label mb-4 animate-fade-up">{t("home.features.eyebrow")}</p>
      <h2 className="display-md animate-fade-up stagger-1">
        {t("home.features.title")}
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {features.map((feature, i) => (
        // ... 6 static features ...
      ))}
    </div>
  </div>
</section>

// REPLACE WITH:
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}
  interval={5000}
  showControls={true}
  className="border-t border-border"
/>
```

### Option B: Add After Existing Grid

Keep the static grid and add carousel below:

```tsx
{/* Existing Features Grid */}
<section className="section-content-lg border-t border-border">
  {/* ... keep existing 6 features ... */}
</section>

{/* NEW: Feature Carousel */}
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}
  interval={5000}
  showControls={true}
  className="border-t border-border"
/>
```

### Option C: Add Before Final CTA

Place just before the conversion section:

```tsx
{/* Connection Types */}
<section className="section-content border-t border-border">
  {/* ... existing ... */}
</section>

{/* NEW: Feature Carousel */}
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}
  interval={5000}
  showControls={true}
  className="border-t border-border"
/>

{/* Donation Section */}
<DonationSection />
```

## Step 3: Test

1. Start the dev server: `npm run dev`
2. Open `http://localhost:3000`
3. Verify carousel is visible and auto-rotating
4. Test manual controls (arrows, dots)
5. Test keyboard navigation (Arrow Left/Right)
6. Test responsive behavior (resize window)
7. Test pause on hover

## Customization

### Change Auto-Play Speed

```tsx
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}
  interval={8000}  // 8 seconds instead of 5
  showControls={true}
/>
```

### Disable Auto-Play

```tsx
<FeatureCarousel
  features={topFeatures}
  autoPlay={false}  // Manual control only
  showControls={true}
/>
```

### Hide Controls

```tsx
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}
  interval={5000}
  showControls={false}  // No arrows or dots
/>
```

### Show Specific Features

```tsx
import { getFeaturesByTag } from "@/lib/features/sample-features";

// Show only security features
<FeatureCarousel
  features={getFeaturesByTag("security")}
  autoPlay={true}
  interval={5000}
  showControls={true}
/>
```

### Custom Styling

```tsx
<FeatureCarousel
  features={topFeatures}
  autoPlay={true}
  interval={5000}
  showControls={true}
  className="bg-muted/30 border-y border-border py-32"
/>
```

## Alternative: Mobile-Optimized Scroll Carousel

For better mobile UX, use the scroll variant:

```tsx
import { FeatureScrollCarousel } from "@/components/features/feature-carousel";

<FeatureScrollCarousel features={topFeatures} />
```

## Alternative: Categorized Carousel

Show features grouped by category:

```tsx
import { FeatureCarouselWithCategories } from "@/components/features/feature-carousel";
import { featuredCategories } from "@/lib/features/sample-features";

<FeatureCarouselWithCategories
  categories={featuredCategories}
  autoPlay={true}
  interval={5000}
  showControls={true}
/>
```

## Complete Example

Here's a complete section you can copy-paste:

```tsx
{/* Feature Carousel */}
<section className="border-t border-border">
  <FeatureCarousel
    features={topFeatures}
    autoPlay={true}
    interval={5000}
    showControls={true}
  />
</section>
```

## Troubleshooting

### Carousel not showing

1. Check imports are correct
2. Verify `topFeatures` is imported
3. Check no CSS conflicts
4. Open browser console for errors

### TypeScript errors

1. Ensure `@/lib/features/sample-features` exists
2. Verify `Feature` type is imported
3. Check `feature-carousel.tsx` is compiled

### Styling issues

1. Verify Tailwind CSS is working
2. Check `globals.css` is loaded
3. Clear Next.js cache: `rm -rf .next`
4. Rebuild: `npm run dev`

### Performance issues

1. Reduce `interval` (increase speed)
2. Use `FeatureScrollCarousel` on mobile
3. Disable `autoPlay` for slower devices

## Next Steps

1. Test on different devices
2. Add analytics tracking
3. Customize feature selection
4. Add deep linking to features
5. Integrate with search/filters

## Files Created

- `components/features/feature-carousel.tsx` - Main component
- `components/features/feature-carousel-example.tsx` - Examples
- `lib/features/sample-features.ts` - Feature data
- `components/features/CAROUSEL_README.md` - Full docs
- `components/features/CAROUSEL_INTEGRATION.md` - This file

## Support

See `CAROUSEL_README.md` for full documentation.
