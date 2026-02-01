# TALLOW Animation System

**GPU-Optimized Framer Motion Animations**

Comprehensive animation library with reduced motion support, optimal performance, and minimal bundle impact.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Performance Optimizations](#performance-optimizations)
3. [Animation Presets](#animation-presets)
4. [Component Library](#component-library)
5. [Usage Examples](#usage-examples)
6. [Reduced Motion Support](#reduced-motion-support)
7. [Best Practices](#best-practices)
8. [Bundle Size Impact](#bundle-size-impact)

---

## Overview

TALLOW's animation system is built on Framer Motion with these principles:

- **GPU-accelerated** - Only `transform` and `opacity` properties
- **Reduced motion compliant** - Respects `prefers-reduced-motion`
- **60fps target** - Optimized spring configurations
- **Tree-shakeable** - Import only what you need
- **Type-safe** - Full TypeScript support

---

## Performance Optimizations

### GPU Acceleration

All animations use GPU-accelerated properties only:

```tsx
// ✅ Good - GPU accelerated
{ opacity: 0, x: 20, y: 10, scale: 0.95, rotate: 90 }

// ❌ Bad - Causes repaints
{ width: '100%', height: 200, backgroundColor: '#fff' }
```

### Apply GPU Hints

```tsx
import { gpuAcceleration } from '@/lib/animations';

<div style={gpuAcceleration}>
  {/* Animated content */}
</div>
```

### Spring Configurations

Pre-tuned springs for 60fps performance:

```tsx
import { springs } from '@/lib/animations/presets';

// Gentle - smooth, natural motion
springs.gentle // stiffness: 120, damping: 14

// Standard - most UI interactions
springs.standard // stiffness: 300, damping: 30

// Snappy - micro-interactions
springs.snappy // stiffness: 500, damping: 35

// Bouncy - playful animations
springs.bouncy // stiffness: 400, damping: 15

// Smooth - large movements
springs.smooth // stiffness: 100, damping: 20

// Stiff - immediate feedback
springs.stiff // stiffness: 700, damping: 40
```

---

## Animation Presets

### Fade Animations

```tsx
import { fadeIn, fadeInUp, fadeInDown, fadeInLeft, fadeInRight } from '@/lib/animations/presets';

<motion.div variants={fadeInUp} initial="initial" animate="animate">
  Content fades in from bottom
</motion.div>
```

### Scale Animations

```tsx
import { scaleIn, scaleOut, pop, zoom } from '@/lib/animations/presets';

<motion.div variants={pop} initial="initial" animate="animate">
  Bouncy scale animation
</motion.div>
```

### Slide Animations

```tsx
import { slideInLeft, slideInRight, slideInUp, slideInDown } from '@/lib/animations/presets';

<motion.div variants={slideInRight} initial="initial" animate="animate">
  Slides in from right
</motion.div>
```

### Rotation Animations

```tsx
import { rotateIn, flipHorizontal, flipVertical } from '@/lib/animations/presets';

<motion.div variants={flipHorizontal} initial="initial" animate="animate">
  Flips horizontally
</motion.div>
```

### Hover & Tap Effects

```tsx
import { hoverScale, hoverLift, hoverGlow } from '@/lib/animations/presets';

<motion.button
  initial="rest"
  whileHover="hover"
  whileTap="tap"
  variants={hoverScale(1.05, 0.95)}
>
  Interactive Button
</motion.button>
```

### Loading Animations

```tsx
import { pulse, shimmer, spin, bounce } from '@/lib/animations/presets';

<motion.div variants={spin} animate="animate">
  Spinning loader
</motion.div>
```

---

## Component Library

### List Animations

**AnimatedList** - Staggered entrance animations:

```tsx
import { AnimatedList, AnimatedListItem } from '@/lib/animations';

<AnimatedList staggerDelay={0.05} delayChildren={0.1}>
  {items.map((item) => (
    <AnimatedListItem key={item.id}>
      {item.content}
    </AnimatedListItem>
  ))}
</AnimatedList>
```

**AnimatedGrid** - Grid with stagger:

```tsx
import { AnimatedGrid, AnimatedListItem } from '@/lib/animations';

<AnimatedGrid cols={{ sm: 2, md: 3, lg: 4 }} gap={4}>
  {items.map((item) => (
    <AnimatedListItem key={item.id}>
      {item.content}
    </AnimatedListItem>
  ))}
</AnimatedGrid>
```

**CardGrid** - Animated cards with hover:

```tsx
import { CardGrid } from '@/lib/animations';

<CardGrid hoverEffect cols={{ sm: 1, md: 2, lg: 3 }}>
  {cards.map((card) => (
    <Card key={card.id}>{card.content}</Card>
  ))}
</CardGrid>
```

### Progress Animations

**AnimatedProgressBar** - Smooth progress indication:

```tsx
import { AnimatedProgressBar } from '@/lib/animations';

<AnimatedProgressBar
  progress={75}
  variant="primary"
  shimmer
  showPercentage
/>
```

**CircularProgress** - Ring-style progress:

```tsx
import { CircularProgress } from '@/lib/animations';

<CircularProgress
  progress={60}
  size={120}
  variant="success"
  showPercentage
/>
```

**TransferSpeed** - Real-time speed display:

```tsx
import { TransferSpeed } from '@/lib/animations';

<TransferSpeed bytesPerSecond={1024000} showIcon />
```

**ETACountdown** - Time remaining:

```tsx
import { ETACountdown } from '@/lib/animations';

<ETACountdown seconds={120} />
```

**CompletionCelebration** - Success animation:

```tsx
import { CompletionCelebration } from '@/lib/animations';

<CompletionCelebration
  show={isComplete}
  message="Transfer complete!"
  duration={3000}
  onComplete={() => console.log('Done!')}
/>
```

### Skeleton Loading States

**Skeleton** - Base skeleton component:

```tsx
import { Skeleton } from '@/lib/animations';

<Skeleton width="100%" height="2rem" radius="lg" shimmer />
```

**SkeletonText** - Text placeholder:

```tsx
import { SkeletonText } from '@/lib/animations';

<SkeletonText lines={3} lineHeight="md" lastLineWidth={60} />
```

**SkeletonCard** - Card placeholder:

```tsx
import { SkeletonCard } from '@/lib/animations';

<SkeletonCard showImage imageAspect="video" lines={3} />
```

**SkeletonList** - List placeholder:

```tsx
import { SkeletonList } from '@/lib/animations';

<SkeletonList count={5} showAvatar />
```

**SkeletonTransfer** - Transfer-specific:

```tsx
import { SkeletonTransfer } from '@/lib/animations';

<SkeletonTransfer showProgress />
```

---

## Usage Examples

### Page Transitions

```tsx
import { PageTransition } from '@/lib/animations';

export default function Page() {
  return (
    <PageTransition>
      <div>Your page content</div>
    </PageTransition>
  );
}
```

### File Transfer Progress

```tsx
import { AnimatedProgressBar, TransferSpeed, ETACountdown } from '@/lib/animations';

function TransferProgress({ progress, speed, eta }) {
  return (
    <div className="space-y-3">
      <AnimatedProgressBar
        progress={progress}
        variant="primary"
        shimmer
        showPercentage
      />
      <div className="flex justify-between">
        <TransferSpeed bytesPerSecond={speed} />
        <ETACountdown seconds={eta} />
      </div>
    </div>
  );
}
```

### Loading State

```tsx
import { SkeletonCard, SkeletonGrid } from '@/lib/animations';

function LoadingState() {
  return (
    <SkeletonGrid
      count={6}
      columns={{ sm: 1, md: 2, lg: 3 }}
      cardProps={{ showImage: true, lines: 3 }}
    />
  );
}
```

### Staggered List

```tsx
import { AnimatedList, AnimatedListItem } from '@/lib/animations';

function DeviceList({ devices }) {
  return (
    <AnimatedList staggerDelay={0.05}>
      {devices.map((device) => (
        <AnimatedListItem key={device.id} direction="up">
          <DeviceCard device={device} />
        </AnimatedListItem>
      ))}
    </AnimatedList>
  );
}
```

### Interactive Card

```tsx
import { motion } from 'framer-motion';
import { hoverLift } from '@/lib/animations/presets';

function InteractiveCard() {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={hoverLift(-8)}
      className="rounded-xl border bg-card p-6"
    >
      Card content
    </motion.div>
  );
}
```

---

## Reduced Motion Support

All animations automatically respect `prefers-reduced-motion`:

```tsx
import { useReducedMotion } from '@/lib/animations';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div>Static content</div>;
  }

  return <motion.div animate={{ x: 100 }}>Animated content</motion.div>;
}
```

### User Override

Allow users to override system preference:

```tsx
import { useReducedMotionSetting } from '@/lib/animations';

function MotionSettings() {
  const { reducedMotion, setReducedMotion } = useReducedMotionSetting();

  return (
    <Switch
      checked={reducedMotion ?? false}
      onCheckedChange={setReducedMotion}
    />
  );
}
```

---

## Best Practices

### ✅ Do's

1. **Use GPU-accelerated properties only**
   ```tsx
   <motion.div animate={{ x: 100, opacity: 1, scale: 1.2 }} />
   ```

2. **Apply will-change hints**
   ```tsx
   <div style={{ willChange: 'transform, opacity' }}>
   ```

3. **Use spring presets**
   ```tsx
   import { springs } from '@/lib/animations/presets';
   transition={springs.standard}
   ```

4. **Respect reduced motion**
   ```tsx
   const prefersReducedMotion = useReducedMotion();
   if (prefersReducedMotion) return <StaticVersion />;
   ```

5. **Stagger list animations**
   ```tsx
   <AnimatedList staggerDelay={0.05}>
   ```

### ❌ Don'ts

1. **Don't animate layout properties**
   ```tsx
   // ❌ Bad
   <motion.div animate={{ width: 200, height: 100 }} />

   // ✅ Good
   <motion.div animate={{ scaleX: 2, scaleY: 1 }} />
   ```

2. **Don't animate colors directly**
   ```tsx
   // ❌ Bad
   <motion.div animate={{ backgroundColor: '#fff' }} />

   // ✅ Good - Use CSS transitions
   <div className="transition-colors bg-white" />
   ```

3. **Don't over-animate**
   ```tsx
   // ❌ Too much
   duration: 2

   // ✅ Better
   duration: 0.3
   ```

4. **Don't nest too many motion components**
   ```tsx
   // ❌ Performance issue
   <motion.div><motion.div><motion.div /></motion.div></motion.div>

   // ✅ Better - Animate parent only
   <motion.div><div><div /></div></div>
   ```

---

## Bundle Size Impact

### Tree-Shaking

Import only what you need:

```tsx
// ✅ Good - Tree-shakeable
import { fadeInUp, springs } from '@/lib/animations/presets';

// ❌ Imports everything
import * as animations from '@/lib/animations';
```

### Lazy Loading

Load heavy animations on-demand:

```tsx
import dynamic from 'next/dynamic';

const CompletionCelebration = dynamic(
  () => import('@/lib/animations').then(mod => mod.CompletionCelebration),
  { ssr: false }
);
```

### Size Estimates

| Component | Gzipped Size |
|-----------|-------------|
| Base motion config | ~2KB |
| Presets | ~3KB |
| List animations | ~4KB |
| Progress animations | ~5KB |
| Skeleton animations | ~4KB |
| **Total (all)** | **~18KB** |

Framer Motion core: ~45KB (already included in bundle)

---

## Migration from Old Animations

### Before

```tsx
import { fadeUpVariants, staggerContainerVariants } from '@/lib/animations/motion-config';

<motion.div variants={fadeUpVariants} initial="hidden" animate="visible">
```

### After

```tsx
import { fadeInUp } from '@/lib/animations/presets';

<motion.div variants={fadeInUp} initial="initial" animate="animate">
```

### Why?

- Clearer naming (`fadeInUp` vs `fadeUpVariants`)
- Better organization (presets file)
- More variants available
- GPU optimization hints included

---

## Contributing

When adding new animations:

1. Use GPU-accelerated properties only (`x`, `y`, `scale`, `rotate`, `opacity`)
2. Include reduced motion alternative
3. Document spring configuration
4. Add usage example
5. Test on mobile devices

---

## Performance Monitoring

Check animation performance:

```tsx
import { motion } from 'framer-motion';

<motion.div
  onAnimationStart={() => console.time('animation')}
  onAnimationComplete={() => console.timeEnd('animation')}
  animate={{ x: 100 }}
/>
```

Target: **< 16ms** per frame for 60fps

---

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [GPU Animation Guide](https://www.html5rocks.com/en/tutorials/speed/high-performance-animations/)
- [Reduced Motion Guide](https://web.dev/prefers-reduced-motion/)
- [Web Animations Performance](https://developers.google.com/web/fundamentals/design-and-ux/animations/animations-and-performance)
