# TALLOW Animation System

**GPU-Optimized Framer Motion Animations**

Complete animation library with reduced motion support, optimal performance, and minimal bundle impact.

---

## 🚀 Quick Start

```tsx
import {
  fadeInUp,
  AnimatedList,
  AnimatedListItem,
  AnimatedProgressBar,
  useReducedMotion,
} from '@/lib/animations';

// Basic animation
<motion.div variants={fadeInUp} initial="initial" animate="animate">
  Content fades in from below
</motion.div>

// Staggered list
<AnimatedList staggerDelay={0.05}>
  {items.map(item => (
    <AnimatedListItem key={item.id}>
      {item.content}
    </AnimatedListItem>
  ))}
</AnimatedList>

// Progress bar
<AnimatedProgressBar progress={75} shimmer showPercentage />
```

---

## 📚 Documentation

### Main Guides
- **[ANIMATION_SYSTEM.md](./ANIMATION_SYSTEM.md)** - Complete documentation
- **[USAGE_EXAMPLES.tsx](./USAGE_EXAMPLES.tsx)** - Working code examples
- **[Quick Reference Card](../../ANIMATION_QUICK_REFERENCE_CARD.md)** - Cheat sheet

### Reports
- **[Optimization Report](../../FRAMER_MOTION_OPTIMIZATION_COMPLETE.md)** - Full audit
- **[Optimization Summary](../../ANIMATION_OPTIMIZATION_SUMMARY.md)** - Executive summary

---

## 📦 What's Included

### Animation Presets
- **45+ variants** - Fade, scale, slide, rotate animations
- **6 spring configs** - Optimized for different use cases
- **8 easing curves** - Material Design and custom
- **GPU hints** - Performance optimization

### List Animations
- `AnimatedList` - Staggered entrance
- `AnimatedListItem` - Directional animations
- `AnimatedGrid` - Grid with stagger
- `CardGrid` - Cards with hover
- `SortableList` - Reorderable lists
- `MasonryGrid` - Pinterest-style
- `InfiniteScrollList` - Auto-loading

### Progress Animations
- `AnimatedProgressBar` - Linear progress
- `CircularProgress` - Ring indicator
- `TransferSpeed` - Speed display
- `ETACountdown` - Time remaining
- `CompletionCelebration` - Success animation
- `PulseLoader` - Loading dots
- `SkeletonShimmer` - Placeholder

### Skeleton Loading
- `Skeleton` - Base component
- `SkeletonText` - Text placeholder
- `SkeletonCard` - Card placeholder
- `SkeletonList` - List placeholder
- `SkeletonTable` - Table placeholder
- `SkeletonGrid` - Grid placeholder
- `SkeletonTransfer` - Transfer placeholder
- `SkeletonForm` - Form placeholder

---

## ⚡ Performance

### GPU-Accelerated
All animations use only GPU-accelerated properties:
- ✅ `transform` (x, y, scale, rotate)
- ✅ `opacity`
- ❌ No layout properties (width, height, etc.)

### Optimized Springs
```tsx
import { springs } from '@/lib/animations/presets';

springs.snappy    // Fast (stiffness: 500)
springs.standard  // Default (stiffness: 300)
springs.gentle    // Smooth (stiffness: 120)
springs.bouncy    // Playful (stiffness: 400)
```

### Bundle Size
- **Presets:** ~3KB gzipped
- **List animations:** ~4KB gzipped
- **Progress animations:** ~5KB gzipped
- **Skeleton animations:** ~4KB gzipped
- **Total:** ~16KB gzipped

Tree-shakeable - only import what you need!

---

## ♿ Accessibility

### Automatic Reduced Motion
All components respect `prefers-reduced-motion`:

```tsx
const prefersReducedMotion = useReducedMotion();

if (prefersReducedMotion) {
  return <StaticVersion />;
}

return <AnimatedVersion />;
```

### User Override
```tsx
import { useReducedMotionSetting } from '@/lib/animations';

const { reducedMotion, setReducedMotion } = useReducedMotionSetting();
```

---

## 📖 Component Categories

### 1. Presets (`presets.ts`)
Ready-to-use animation variants:
```tsx
import {
  fadeInUp, scaleIn, slideInRight,
  hoverScale, springs, easings
} from '@/lib/animations/presets';
```

### 2. List Components (`list-animations.tsx`)
Staggered and grid animations:
```tsx
import {
  AnimatedList, AnimatedListItem,
  AnimatedGrid, CardGrid
} from '@/lib/animations';
```

### 3. Progress Components (`progress-animations.tsx`)
Transfer and loading indicators:
```tsx
import {
  AnimatedProgressBar, CircularProgress,
  TransferSpeed, ETACountdown
} from '@/lib/animations';
```

### 4. Skeleton Components (`skeleton-animations.tsx`)
Loading placeholders:
```tsx
import {
  Skeleton, SkeletonCard,
  SkeletonTransfer, SkeletonGrid
} from '@/lib/animations';
```

---

## 🎯 Common Use Cases

### File Transfer UI
```tsx
import {
  AnimatedProgressBar,
  TransferSpeed,
  ETACountdown,
  CompletionCelebration,
} from '@/lib/animations';

<div className="space-y-4">
  <AnimatedProgressBar progress={progress} shimmer />
  <div className="flex justify-between">
    <TransferSpeed bytesPerSecond={speed} />
    <ETACountdown seconds={eta} />
  </div>
  <CompletionCelebration show={complete} />
</div>
```

### Device List
```tsx
import { AnimatedList, AnimatedListItem } from '@/lib/animations';

<AnimatedList staggerDelay={0.05}>
  {devices.map(device => (
    <AnimatedListItem key={device.id}>
      <DeviceCard device={device} />
    </AnimatedListItem>
  ))}
</AnimatedList>
```

### Loading State
```tsx
import { SkeletonTransfer } from '@/lib/animations';

{isLoading ? (
  <SkeletonTransfer showProgress />
) : (
  <TransferCard data={data} />
)}
```

---

## 🎨 Animation Variants

### Fade
- `fadeIn` - Simple fade
- `fadeInUp` - Fade from below
- `fadeInDown` - Fade from above
- `fadeInLeft` - Fade from left
- `fadeInRight` - Fade from right

### Scale
- `scaleIn` - Scale up
- `scaleOut` - Scale down
- `pop` - Bouncy scale
- `zoom` - Full zoom

### Slide
- `slideInLeft` - From left
- `slideInRight` - From right
- `slideInUp` - From bottom
- `slideInDown` - From top

### Rotation
- `rotateIn` - Spin in
- `flipHorizontal` - 3D flip X
- `flipVertical` - 3D flip Y

### Loading
- `pulse` - Opacity pulse
- `shimmer` - Shine effect
- `spin` - Continuous rotation
- `bounce` - Vertical bounce

---

## 🛠️ Best Practices

### ✅ Do

```tsx
// Use GPU-accelerated properties
<motion.div animate={{ x: 100, opacity: 1 }} />

// Use spring presets
transition={springs.standard}

// Respect reduced motion
const reduced = useReducedMotion();
if (reduced) return <Static />;

// Apply GPU hints
<div style={{ willChange: 'transform, opacity' }} />
```

### ❌ Don't

```tsx
// ❌ Don't animate layout properties
<motion.div animate={{ width: 200 }} />

// ❌ Don't animate colors
<motion.div animate={{ backgroundColor: '#fff' }} />

// ❌ Don't over-animate
duration: 2

// ❌ Don't nest too many motion components
<motion.div><motion.div><motion.div /></motion.div></motion.div>
```

---

## 📊 Performance Targets

- **Frame Rate:** 60fps (16.7ms per frame)
- **Smoothness:** No jank on mobile
- **Bundle Size:** Minimal impact (~16KB)
- **CPU Usage:** Low
- **Battery Impact:** Negligible

---

## 🔄 Migration from Old System

**Before:**
```tsx
import { fadeUpVariants } from '@/lib/animations/motion-config';

<motion.div
  variants={fadeUpVariants}
  initial="hidden"
  animate="visible"
/>
```

**After:**
```tsx
import { fadeInUp } from '@/lib/animations/presets';

<motion.div
  variants={fadeInUp}
  initial="initial"
  animate="animate"
/>
```

**Benefits:**
- Clearer naming
- More variants
- GPU optimization
- Better docs

---

## 🧪 Testing

### Performance
```tsx
// Monitor animation performance
<motion.div
  onAnimationStart={() => console.time('animation')}
  onAnimationComplete={() => console.timeEnd('animation')}
  animate={{ x: 100 }}
/>
```

### Reduced Motion
1. Open DevTools > Rendering
2. Enable "Emulate CSS media feature prefers-reduced-motion"
3. Verify animations are instant

---

## 📞 Support

### Questions?
1. Check [ANIMATION_SYSTEM.md](./ANIMATION_SYSTEM.md)
2. Review [USAGE_EXAMPLES.tsx](./USAGE_EXAMPLES.tsx)
3. Read JSDoc comments in source

### Resources
- [Framer Motion Docs](https://www.framer.com/motion/)
- [GPU Animations](https://web.dev/animations-guide/)
- [Reduced Motion](https://web.dev/prefers-reduced-motion/)

---

## 📝 File Structure

```
lib/animations/
├── README.md                   # This file
├── ANIMATION_SYSTEM.md         # Complete docs
├── USAGE_EXAMPLES.tsx          # Working examples
├── index.ts                    # Main exports
├── motion-config.ts            # Core config
├── presets.ts                  # Animation presets
├── list-animations.tsx         # List components
├── progress-animations.tsx     # Progress components
├── skeleton-animations.tsx     # Skeleton components
├── animated-components.tsx     # Base components
└── page-transition.tsx         # Page transitions
```

---

## ✨ Features

- ✅ GPU-accelerated (60fps)
- ✅ Reduced motion support
- ✅ Tree-shakeable imports
- ✅ TypeScript support
- ✅ Comprehensive docs
- ✅ Working examples
- ✅ Mobile optimized
- ✅ Accessibility compliant
- ✅ Small bundle size
- ✅ Production ready

---

## 🎉 Get Started

1. **Import what you need:**
   ```tsx
   import { fadeInUp, AnimatedList } from '@/lib/animations';
   ```

2. **Use in your components:**
   ```tsx
   <motion.div variants={fadeInUp} initial="initial" animate="animate">
   ```

3. **Check examples:**
   - See [USAGE_EXAMPLES.tsx](./USAGE_EXAMPLES.tsx)

4. **Read full docs:**
   - See [ANIMATION_SYSTEM.md](./ANIMATION_SYSTEM.md)

---

**Ready to animate!** 🚀

*Built with ❤️ by framer-motion-pro*
