# Animation Quick Reference Card

**TALLOW Framer Motion System**

---

## 🚀 Import Patterns

```typescript
// Presets
import { fadeInUp, springs, easings } from '@/lib/animations/presets';

// Components
import { AnimatedList, AnimatedListItem } from '@/lib/animations';
import { AnimatedProgressBar, CircularProgress } from '@/lib/animations';
import { Skeleton, SkeletonCard } from '@/lib/animations';

// Hooks
import { useReducedMotion } from '@/lib/animations';
```

---

## 🎨 Common Animations

### Fade In

```tsx
import { fadeInUp } from '@/lib/animations/presets';

<motion.div variants={fadeInUp} initial="initial" animate="animate">
  Content
</motion.div>
```

### Scale

```tsx
import { scaleIn } from '@/lib/animations/presets';

<motion.div variants={scaleIn} initial="initial" animate="animate">
  Content
</motion.div>
```

### Slide

```tsx
import { slideInRight } from '@/lib/animations/presets';

<motion.div variants={slideInRight} initial="initial" animate="animate">
  Content
</motion.div>
```

---

## 📜 List Animations

```tsx
import { AnimatedList, AnimatedListItem } from '@/lib/animations';

<AnimatedList staggerDelay={0.05}>
  {items.map(item => (
    <AnimatedListItem key={item.id}>
      {item.content}
    </AnimatedListItem>
  ))}
</AnimatedList>
```

---

## 📊 Progress

### Linear Progress

```tsx
import { AnimatedProgressBar } from '@/lib/animations';

<AnimatedProgressBar
  progress={75}
  variant="primary"
  shimmer
  showPercentage
/>
```

### Circular Progress

```tsx
import { CircularProgress } from '@/lib/animations';

<CircularProgress
  progress={60}
  size={120}
  showPercentage
/>
```

### Transfer Speed

```tsx
import { TransferSpeed, ETACountdown } from '@/lib/animations';

<TransferSpeed bytesPerSecond={1024000} />
<ETACountdown seconds={120} />
```

---

## 💀 Skeletons

### Text

```tsx
import { SkeletonText } from '@/lib/animations';

<SkeletonText lines={3} lineHeight="md" />
```

### Card

```tsx
import { SkeletonCard } from '@/lib/animations';

<SkeletonCard showImage lines={3} />
```

### Transfer

```tsx
import { SkeletonTransfer } from '@/lib/animations';

<SkeletonTransfer showProgress />
```

---

## 🔧 Springs

```typescript
import { springs } from '@/lib/animations/presets';

// Fast
springs.snappy

// Default
springs.standard

// Smooth
springs.gentle

// Playful
springs.bouncy
```

---

## 🎯 Hover Effects

```tsx
import { hoverScale } from '@/lib/animations/presets';

<motion.button
  initial="rest"
  whileHover="hover"
  whileTap="tap"
  variants={hoverScale(1.05, 0.95)}
>
  Click me
</motion.button>
```

---

## ♿ Reduced Motion

```tsx
import { useReducedMotion } from '@/lib/animations';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <StaticVersion />;
  }

  return <AnimatedVersion />;
}
```

---

## 🎬 Page Transitions

```tsx
import { PageTransition } from '@/lib/animations';

export default function Page() {
  return (
    <PageTransition>
      <YourContent />
    </PageTransition>
  );
}
```

---

## ⚡ GPU Hints

```tsx
import { gpuAcceleration } from '@/lib/animations';

<div style={gpuAcceleration}>
  {/* Animated content */}
</div>
```

---

## 📏 Best Practices

### ✅ Do

```tsx
// GPU accelerated
{ x: 100, y: 50, scale: 1.2, opacity: 1 }

// Use presets
transition={springs.standard}

// Respect reduced motion
const reduced = useReducedMotion();
```

### ❌ Don't

```tsx
// ❌ Causes reflow
{ width: 200, height: 100 }

// ❌ Not GPU accelerated
{ backgroundColor: '#fff' }

// ❌ Too slow
duration: 2
```

---

## 🎉 Complete Example

```tsx
import {
  AnimatedList,
  AnimatedListItem,
  AnimatedProgressBar,
  TransferSpeed,
  ETACountdown,
  CompletionCelebration,
  SkeletonTransfer,
  useReducedMotion,
} from '@/lib/animations';

function FileTransferList({ transfers, loading }) {
  const prefersReducedMotion = useReducedMotion();

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonTransfer key={i} showProgress />
        ))}
      </div>
    );
  }

  return (
    <AnimatedList staggerDelay={0.05}>
      {transfers.map(transfer => (
        <AnimatedListItem key={transfer.id}>
          <div className="space-y-3">
            <h3>{transfer.fileName}</h3>
            <AnimatedProgressBar
              progress={transfer.progress}
              shimmer={!prefersReducedMotion}
            />
            <div className="flex justify-between">
              <TransferSpeed bytesPerSecond={transfer.speed} />
              <ETACountdown seconds={transfer.eta} />
            </div>
            <CompletionCelebration
              show={transfer.complete}
              message="Transfer complete!"
            />
          </div>
        </AnimatedListItem>
      ))}
    </AnimatedList>
  );
}
```

---

## 📚 Full Documentation

See: `lib/animations/ANIMATION_SYSTEM.md`

---

*framer-motion-pro • 2026-01-30*
