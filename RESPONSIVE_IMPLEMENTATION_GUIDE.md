# Responsive Implementation Guide
## Practical Guide to Implementing Multi-Device UX in Tallow

**Version:** 1.0
**Date:** 2026-01-28
**Quick Start Guide for Developers**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Using Breakpoint Hooks](#using-breakpoint-hooks)
3. [Responsive Components](#responsive-components)
4. [Common Patterns](#common-patterns)
5. [Device-Specific Features](#device-specific-features)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation

All responsive utilities are already included in the project. No additional dependencies needed!

### Basic Usage

```tsx
import { useBreakpoint } from '@/lib/hooks/use-breakpoint';

export function MyComponent() {
  const { breakpoint, isMobile, isTablet } = useBreakpoint();

  return (
    <div>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {!isMobile && !isTablet && <DesktopView />}
    </div>
  );
}
```

---

## Using Breakpoint Hooks

### useBreakpoint

Main hook for responsive behavior:

```tsx
import { useBreakpoint } from '@/lib/hooks/use-breakpoint';

export function ResponsiveComponent() {
  const {
    breakpoint,     // 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'tv'
    width,          // Current window width
    height,         // Current window height
    orientation,    // 'portrait' | 'landscape'
    isMobile,       // Boolean flags
    isTablet,
    isLaptop,
    isDesktop,
    isTV,
    isTouchDevice,  // Has touch capability
    isRetina,       // High DPI display
  } = useBreakpoint();

  return (
    <div>
      <p>Current breakpoint: {breakpoint}</p>
      <p>Screen: {width}x{height}</p>
      <p>Orientation: {orientation}</p>
    </div>
  );
}
```

### useMatchBreakpoint

Check if current breakpoint matches any in a list:

```tsx
import { useMatchBreakpoint } from '@/lib/hooks/use-breakpoint';

export function ConditionalComponent() {
  const isMobileOrTablet = useMatchBreakpoint('mobile', 'tablet');
  const isDesktopOrTV = useMatchBreakpoint('desktop', 'tv');

  return (
    <div>
      {isMobileOrTablet && <CompactLayout />}
      {isDesktopOrTV && <ExpansiveLayout />}
    </div>
  );
}
```

### useResponsiveValue

Get different values per breakpoint:

```tsx
import { useResponsiveValue } from '@/lib/hooks/use-breakpoint';

export function DynamicSizeComponent() {
  const columns = useResponsiveValue({
    mobile: 1,
    tablet: 2,
    laptop: 3,
    desktop: 4,
    tv: 4,
  });

  const fontSize = useResponsiveValue({
    mobile: '14px',
    tablet: '16px',
    desktop: '18px',
    tv: '24px',
  });

  return (
    <div style={{ fontSize }} className={`grid-cols-${columns}`}>
      Content
    </div>
  );
}
```

### useMediaQuery

Custom media query support:

```tsx
import { useMediaQuery } from '@/lib/hooks/use-breakpoint';

export function CustomBreakpointComponent() {
  const isUltraWide = useMediaQuery('(min-aspect-ratio: 21/9)');
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <div>
      {isUltraWide && <UltraWideLayout />}
      {isPortrait && <PortraitLayout />}
      {!prefersReducedMotion && <AnimatedContent />}
    </div>
  );
}
```

---

## Responsive Components

### ResponsiveGrid

Automatically adjusts columns based on breakpoint:

```tsx
import { ResponsiveGrid, FeatureGrid, CardGrid } from '@/components/ui/responsive-grid';

// Custom column configuration
export function CustomGrid() {
  return (
    <ResponsiveGrid
      columns={{
        mobile: 1,
        tablet: 2,
        laptop: 3,
        desktop: 4,
        tv: 4,
      }}
      gap={{
        mobile: 4,
        tablet: 6,
        laptop: 8,
      }}
    >
      {items.map(item => <GridItem key={item.id} {...item} />)}
    </ResponsiveGrid>
  );
}

// Preset feature grid
export function Features() {
  return (
    <FeatureGrid>
      {features.map(feature => <FeatureCard key={feature.id} {...feature} />)}
    </FeatureGrid>
  );
}

// Preset card grid
export function Cards() {
  return (
    <CardGrid dense={false}>
      {cards.map(card => <Card key={card.id} {...card} />)}
    </CardGrid>
  );
}

// Auto-fill grid with minimum width
export function GalleryGrid() {
  return (
    <ResponsiveGrid minChildWidth="250px" autoFill={true}>
      {images.map(img => <Image key={img.id} {...img} />)}
    </ResponsiveGrid>
  );
}
```

### ResponsiveContainer

Consistent padding and max-width:

```tsx
import {
  ResponsiveContainer,
  NarrowContainer,
  WideContainer,
  SectionContainer,
} from '@/components/ui/responsive-container';

// Default container
export function DefaultLayout() {
  return (
    <ResponsiveContainer>
      <h1>Content</h1>
    </ResponsiveContainer>
  );
}

// Narrow for reading
export function ArticleLayout() {
  return (
    <NarrowContainer>
      <article>Long-form content...</article>
    </NarrowContainer>
  );
}

// Wide for dashboards
export function DashboardLayout() {
  return (
    <WideContainer>
      <Dashboard />
    </WideContainer>
  );
}

// Section with vertical spacing
export function PageSection() {
  return (
    <SectionContainer spacing="spacious">
      <h2>Section Title</h2>
      <p>Section content...</p>
    </SectionContainer>
  );
}

// Custom max-width per breakpoint
export function CustomContainer() {
  return (
    <ResponsiveContainer
      maxWidth={{
        mobile: '100%',
        tablet: '600px',
        laptop: '800px',
        desktop: '1000px',
        tv: '1200px',
      }}
      padding={{
        mobile: 4,
        tablet: 6,
        laptop: 8,
      }}
    >
      Content
    </ResponsiveContainer>
  );
}
```

---

## Common Patterns

### Pattern 1: Responsive Typography

```tsx
export function ResponsiveHeading() {
  const { breakpoint } = useBreakpoint();

  const sizeClasses = {
    mobile: 'text-3xl',
    tablet: 'text-4xl',
    laptop: 'text-5xl',
    desktop: 'text-6xl',
    tv: 'text-8xl',
  };

  return (
    <h1 className={`font-serif ${sizeClasses[breakpoint]}`}>
      Responsive Heading
    </h1>
  );
}

// Or using Tailwind responsive classes
export function TailwindHeading() {
  return (
    <h1 className="
      text-3xl          /* Mobile */
      tablet:text-4xl   /* Tablet */
      laptop:text-5xl   /* Laptop */
      desktop:text-6xl  /* Desktop */
      tv:text-8xl       /* TV */
    ">
      Responsive Heading
    </h1>
  );
}
```

### Pattern 2: Conditional Rendering

```tsx
export function ConditionalLayout() {
  const { isMobile, isTablet } = useBreakpoint();

  if (isMobile) {
    return <MobileBottomSheet />;
  }

  if (isTablet) {
    return <TabletSplitView />;
  }

  return <DesktopMultiPanel />;
}
```

### Pattern 3: Responsive Images

```tsx
import Image from 'next/image';

export function ResponsiveImage({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      sizes="
        (max-width: 767px) 100vw,
        (max-width: 1023px) 50vw,
        (max-width: 1439px) 33vw,
        25vw
      "
      className="w-full h-auto"
    />
  );
}
```

### Pattern 4: Responsive Spacing

```tsx
export function ResponsiveCard() {
  return (
    <div className="
      p-4              /* Mobile: 1rem */
      tablet:p-6       /* Tablet: 1.5rem */
      laptop:p-8       /* Laptop: 2rem */
      desktop:p-10     /* Desktop: 2.5rem */
      tv:p-16          /* TV: 4rem */
    ">
      Card Content
    </div>
  );
}
```

### Pattern 5: Responsive Navigation

```tsx
import { ResponsiveNav } from '@/components/navigation/responsive-nav';

export function AppLayout({ children }) {
  return (
    <ResponsiveNav>
      {children}
    </ResponsiveNav>
  );
}
```

### Pattern 6: Touch-Optimized Buttons

```tsx
import { deviceDetection } from '@/lib/utils/device-detection';

export function ResponsiveButton({ children, onClick }) {
  const touchTargetSize = deviceDetection.getOptimalTouchTargetSize();

  return (
    <button
      onClick={onClick}
      className="
        px-6 py-3
        touch-manipulation
        active:scale-95
        transition-transform
      "
      style={{
        minWidth: touchTargetSize,
        minHeight: touchTargetSize,
      }}
    >
      {children}
    </button>
  );
}
```

### Pattern 7: Responsive Modals

```tsx
import { Sheet } from '@/components/ui/sheet';
import { Dialog } from '@/components/ui/dialog';

export function ResponsiveModal({ open, onClose, children }) {
  const { isMobile } = useBreakpoint();

  // Mobile: Bottom sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Centered dialog
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 8: Responsive Forms

```tsx
export function ResponsiveForm() {
  return (
    <form className="
      grid
      grid-cols-1          /* Mobile: Single column */
      tablet:grid-cols-2   /* Tablet: 2 columns */
      laptop:grid-cols-3   /* Laptop: 3 columns */
      gap-4 tablet:gap-6
    ">
      <div className="tablet:col-span-2">
        <label>Name</label>
        <input className="w-full h-12 tablet:h-14" />
      </div>
      <div>
        <label>Email</label>
        <input className="w-full h-12 tablet:h-14" />
      </div>
      <div className="tablet:col-span-3">
        <label>Message</label>
        <textarea className="w-full h-32 tablet:h-40" />
      </div>
    </form>
  );
}
```

---

## Device-Specific Features

### Touch Gestures (Mobile/Tablet)

```tsx
import { useSwipeGestures } from '@/lib/hooks/use-swipe-gestures';

export function SwipeableCard() {
  const { swipeProps } = useSwipeGestures({
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
    onSwipeUp: () => console.log('Swiped up'),
    onSwipeDown: () => console.log('Swiped down'),
  });

  return (
    <div {...swipeProps} className="touch-pan-y">
      Swipeable Content
    </div>
  );
}
```

### Keyboard Navigation (Desktop)

```tsx
export function KeyboardNavigableList() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        // Navigate down
      }
      if (e.key === 'ArrowUp') {
        // Navigate up
      }
      if (e.key === 'Enter') {
        // Select item
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <div>List with keyboard navigation</div>;
}
```

### Remote Control Navigation (TV)

```tsx
import { useTVFocus } from '@/lib/hooks/use-tv-focus';

export function TVGrid() {
  const { containerRef } = useTVFocus();

  return (
    <div ref={containerRef} className="grid grid-cols-4 gap-16">
      {items.map((item, index) => (
        <button
          key={item.id}
          data-focusable
          data-focus-index={index}
          className="
            p-16 rounded-3xl
            focus:scale-110 focus:shadow-2xl
            focus:ring-8 focus:ring-white
            transition-all duration-200
          "
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

### Device Detection

```tsx
import { deviceDetection } from '@/lib/utils/device-detection';

export function DeviceAwareComponent() {
  const deviceInfo = deviceDetection.getDeviceInfo();

  useEffect(() => {
    console.log('Device Type:', deviceInfo.deviceType);
    console.log('Input Method:', deviceInfo.inputMethod);
    console.log('Platform:', deviceInfo.platform);
    console.log('Touch Device:', deviceInfo.capabilities.hasTouch);
    console.log('Supports Hover:', deviceInfo.capabilities.supportsHover);
  }, []);

  return (
    <div>
      {deviceInfo.capabilities.hasTouch && <TouchOptimizedUI />}
      {deviceInfo.capabilities.supportsHover && <HoverEffects />}
    </div>
  );
}
```

---

## Troubleshooting

### Issue: Breakpoint not updating on resize

**Solution:** The hook uses debouncing (150ms) to prevent excessive re-renders. This is normal behavior.

```tsx
// If you need immediate updates, use useMediaQuery
const isSmall = useMediaQuery('(max-width: 767px)');
```

### Issue: Flash of wrong layout on page load

**Solution:** Use CSS to hide content until hydration:

```tsx
export function NoFlashComponent() {
  const { breakpoint } = useBreakpoint();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="opacity-0">Loading...</div>;
  }

  return <div>{breakpoint === 'mobile' ? <Mobile /> : <Desktop />}</div>;
}
```

### Issue: Touch targets too small on mobile

**Solution:** Use optimal touch target sizes:

```tsx
import { deviceDetection } from '@/lib/utils/device-detection';

const minSize = deviceDetection.getOptimalTouchTargetSize();
// Returns: 44px (mobile), 48px (tablet), 80px (TV)

<button style={{ minWidth: minSize, minHeight: minSize }}>
  Button
</button>
```

### Issue: Layout shifts between breakpoints

**Solution:** Use consistent spacing utilities:

```tsx
import { getResponsiveSpacing } from '@/lib/hooks/use-breakpoint';

const { breakpoint } = useBreakpoint();
const spacing = getResponsiveSpacing(breakpoint, 'container');
// Returns pixels: 16, 24, 32, 40, 64
```

### Issue: Images loading wrong size

**Solution:** Use proper sizes attribute:

```tsx
<Image
  src={src}
  alt={alt}
  sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
/>
```

### Issue: TV navigation not working

**Solution:** Ensure focusable elements have required attributes:

```tsx
<button
  data-focusable           // Required
  data-focus-index={0}     // Required for ordering
  className="focus:ring-4" // Visual focus indicator
>
  Item
</button>
```

---

## Best Practices

### 1. Mobile-First Approach

Start with mobile styles, then enhance for larger screens:

```tsx
// Good
<div className="text-sm tablet:text-base laptop:text-lg">

// Avoid
<div className="text-lg laptop:text-base mobile:text-sm">
```

### 2. Touch-Friendly Targets

Always meet minimum touch target sizes:

```tsx
// Good - Minimum 44px
<button className="min-h-[44px] min-w-[44px] px-4 py-2">

// Avoid - Too small for touch
<button className="px-2 py-1">
```

### 3. Consistent Spacing

Use responsive spacing utilities:

```tsx
// Good
<div className="p-4 tablet:p-6 laptop:p-8">

// Avoid - Inconsistent
<div style={{ padding: '15px' }}>
```

### 4. Performance

Avoid unnecessary re-renders:

```tsx
// Good - Memoize breakpoint-dependent values
const columns = useMemo(() => {
  return breakpoint === 'mobile' ? 1 : 3;
}, [breakpoint]);

// Avoid - Recalculates every render
const columns = breakpoint === 'mobile' ? 1 : 3;
```

### 5. Accessibility

Always support keyboard navigation:

```tsx
// Good
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>

// Avoid - Mouse only
<div onClick={handleClick}>
```

---

## Quick Reference

### Breakpoint Values

```
mobile:  0px - 767px
tablet:  768px - 1023px
laptop:  1024px - 1439px
desktop: 1440px - 1919px
tv:      1920px+
```

### Touch Target Sizes

```
Mobile:  44px minimum
Tablet:  48px minimum
Desktop: 36px minimum
TV:      80px minimum
```

### Common Tailwind Classes

```css
/* Breakpoint prefixes */
tablet:      /* 768px+ */
laptop:      /* 1024px+ */
desktop:     /* 1440px+ */
tv:          /* 1920px+ */

/* Touch utilities */
touch-manipulation  /* Disable double-tap zoom */
touch-pan-x        /* Allow horizontal pan only */
touch-pan-y        /* Allow vertical pan only */

/* Safe area (iPhone notch) */
safe-area-top
safe-area-bottom
safe-area-left
safe-area-right
```

---

## Additional Resources

- [Main Optimization Plan](./MULTI_DEVICE_OPTIMIZATION_PLAN.md)
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries)
- [WCAG Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

---

*Last Updated: 2026-01-28*
*Version: 1.0*
