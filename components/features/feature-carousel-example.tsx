/**
 * FeatureCarousel Integration Example
 *
 * This file demonstrates how to integrate the FeatureCarousel component
 * into the landing page (app/page.tsx).
 *
 * Simply copy the relevant sections into your page component.
 */

"use client";

import { FeatureCarousel, FeatureCarouselWithCategories, FeatureScrollCarousel } from "./feature-carousel";
import { topFeatures, featuredCategories, getRandomFeatures } from "@/lib/features/sample-features";

/**
 * Example 1: Basic Carousel
 * Shows 20 random features with auto-play
 */
export function BasicCarouselExample() {
  return (
    <FeatureCarousel
      features={getRandomFeatures(20)}
      autoPlay
      interval={5000}
      showControls
    />
  );
}

/**
 * Example 2: All Features Carousel
 * Shows all 30+ top features
 */
export function AllFeaturesCarouselExample() {
  return (
    <FeatureCarousel
      features={topFeatures}
      autoPlay
      interval={6000}
      showControls
    />
  );
}

/**
 * Example 3: Carousel with Categories
 * Groups features by category with section labels
 */
export function CategorizedCarouselExample() {
  return (
    <FeatureCarouselWithCategories
      categories={featuredCategories}
      autoPlay
      interval={5000}
      showControls
    />
  );
}

/**
 * Example 4: Mobile-Optimized Scroll Carousel
 * Better for touch devices
 */
export function ScrollCarouselExample() {
  return (
    <FeatureScrollCarousel
      features={getRandomFeatures(20)}
    />
  );
}

/**
 * Example 5: Custom Styling
 * With custom className
 */
export function StyledCarouselExample() {
  return (
    <FeatureCarousel
      features={topFeatures}
      autoPlay
      interval={5000}
      showControls
      className="bg-background border-t border-b border-border"
    />
  );
}

/**
 * Example 6: Manual Control Only
 * No auto-play, user controls only
 */
export function ManualCarouselExample() {
  return (
    <FeatureCarousel
      features={topFeatures}
      autoPlay={false}
      showControls
    />
  );
}

/**
 * ===================================================================
 * INTEGRATION INTO app/page.tsx
 * ===================================================================
 *
 * Add this import at the top of app/page.tsx:
 *
 * import { FeatureCarousel } from "@/components/features/feature-carousel";
 * import { topFeatures } from "@/lib/features/sample-features";
 *
 * Then add the carousel section between existing sections:
 *
 * ```tsx
 * // ... existing sections ...
 *
 * <!-- Features Grid -->
 * <section className="section-content-lg border-t border-border">
 *   {/* ... existing features grid ... *\/}
 * </section>
 *
 * <!-- ADD FEATURE CAROUSEL HERE -->
 * <FeatureCarousel
 *   features={topFeatures}
 *   autoPlay={true}
 *   interval={5000}
 *   showControls={true}
 *   className="border-t border-border"
 * />
 *
 * <!-- Security Callout - Dark -->
 * <section className="section-dark">
 *   {/* ... existing security section ... *\/}
 * </section>
 *
 * // ... rest of page ...
 * ```
 *
 * ===================================================================
 * RECOMMENDED PLACEMENT OPTIONS
 * ===================================================================
 *
 * Option 1: Replace existing features grid
 * - Remove the static 6-feature grid
 * - Replace with FeatureCarousel showing all 30 features
 *
 * Option 2: Add after features grid
 * - Keep existing 6-feature grid
 * - Add carousel below as "More Features"
 *
 * Option 3: Add before final CTA
 * - Place carousel just before the "Ready to start?" section
 * - Acts as final showcase before conversion
 *
 * ===================================================================
 * RESPONSIVE BEHAVIOR
 * ===================================================================
 *
 * Desktop (lg+):
 * - Shows 3 cards per page
 * - Arrow buttons on left/right
 * - Slides by 3 on navigation
 *
 * Tablet (sm-md):
 * - Shows 2 cards per page
 * - Mobile nav buttons below
 * - Slides by 2 on navigation
 *
 * Mobile (<sm):
 * - Shows 1 card per page
 * - Mobile nav buttons below
 * - Slides by 1 on navigation
 * - Consider using FeatureScrollCarousel instead
 *
 * ===================================================================
 * ACCESSIBILITY FEATURES
 * ===================================================================
 *
 * - Keyboard navigation (Arrow Left/Right)
 * - ARIA labels and live regions
 * - Focus management
 * - Screen reader announcements
 * - High contrast mode support
 * - Reduced motion support
 *
 * ===================================================================
 */
