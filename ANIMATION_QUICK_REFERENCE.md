# Animation Quick Reference

## Imports

```tsx
// Animation system
import {
  AnimatedContainer,
  AnimatedList,
  AnimatedListItem,
  AnimatedCard,
  AnimatedModal,
  PageTransition,
} from '@/lib/animations';

// Skeleton components
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  DeviceListSkeleton,
  TransferCardSkeleton,
} from '@/components/ui/skeleton';

// Enhanced components
import { ButtonAnimated } from '@/components/ui/button-animated';
import { DeviceListAnimated } from '@/components/devices/device-list-animated';
import { TransferQueueAnimated } from '@/components/transfer/transfer-queue-animated';

// Hooks
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
```

## Common Patterns

### Fade In Content
```tsx
<AnimatedContainer variant="fadeUp">
  <YourContent />
</AnimatedContainer>
```

### Animated List
```tsx
<AnimatedList>
  {items.map(item => (
    <AnimatedListItem key={item.id}>
      <ItemContent />
    </AnimatedListItem>
  ))}
</AnimatedList>
```

### Loading State
```tsx
{isLoading ? (
  <DeviceListSkeleton count={3} />
) : (
  <DeviceList devices={devices} />
)}
```

### Animated Button
```tsx
<ButtonAnimated ripple onClick={handleClick}>
  Click Me
</ButtonAnimated>
```

### Modal Dialog
```tsx
<AnimatedModal isOpen={open} onClose={handleClose}>
  <ModalContent />
</AnimatedModal>
```

### Page Transition
```tsx
export default function Page() {
  return (
    <PageTransition>
      <PageContent />
    </PageTransition>
  );
}
```

## Animation Variants

| Variant | Use Case |
|---------|----------|
| `fade` | Simple fade in/out |
| `fadeUp` | Content appearing from bottom |
| `fadeDown` | Content appearing from top |
| `scale` | Zoom in effect |
| `pop` | Bouncy scale (alerts, badges) |
| `slideLeft` | Slide from left |
| `slideRight` | Slide from right |

## Skeleton Components

| Component | Use Case |
|-----------|----------|
| `DeviceListSkeleton` | Loading devices |
| `TransferCardSkeleton` | Loading transfers |
| `FileListSkeleton` | Loading files |
| `SettingsSkeleton` | Loading settings |
| `SkeletonCard` | Generic card loading |

## Custom Animations

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

## Accessibility

```tsx
// Check reduced motion preference
const prefersReducedMotion = useReducedMotion();

// Conditional animation
<motion.div
  animate={prefersReducedMotion ? {} : { y: [-10, 0] }}
>
  Content
</motion.div>
```

## Props Reference

### AnimatedContainer
- `variant`: Animation type
- `delay`: Delay in seconds
- `className`: Additional classes

### Skeleton
- `variant`: 'default' | 'text' | 'circular' | 'rectangular'
- `animation`: 'shimmer' | 'pulse' | 'none'
- `width`: Number or string
- `height`: Number or string

### ButtonAnimated
- All standard button props
- `ripple`: Enable ripple effect
- `pulse`: Enable pulse animation

## Performance Tips

1. Use `transform` and `opacity` for animations
2. Avoid animating `width`, `height`, `top`, `left`
3. Use `layout` prop sparingly
4. Add `willChange` for frequently animated elements
5. Always wrap conditionals with `AnimatePresence`

## Common Issues

**Issue**: Animation doesn't work
**Fix**: Add `'use client'` directive at top of file

**Issue**: Exit animation skipped
**Fix**: Wrap with `<AnimatePresence>`

**Issue**: Layout shift
**Fix**: Use skeleton with matching dimensions

**Issue**: Performance lag
**Fix**: Check for layout animations, use transform instead

## Testing

```bash
# Visual regression tests
npm run test

# Performance profiling
Open Chrome DevTools > Performance > Record

# Accessibility
# Enable reduced motion in OS settings
# Or use browser DevTools emulation
```

## File Locations

```
lib/
  animations/
    motion-config.ts          # Animation variants
    animated-components.tsx   # Reusable components
    page-transition.tsx       # Page transitions
    index.ts                  # Exports

components/
  ui/
    skeleton.tsx             # Skeleton system
    button-animated.tsx      # Animated button

  devices/
    device-list-animated.tsx # Animated device list

  transfer/
    transfer-card-animated.tsx   # Animated transfer card
    transfer-queue-animated.tsx  # Animated queue

  examples/
    animation-showcase.tsx   # Live examples
```

## Quick Commands

```bash
# Run dev server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Resources

- Full Docs: `ANIMATIONS.md`
- Integration: `ANIMATION_INTEGRATION_GUIDE.md`
- Summary: `ANIMATIONS_IMPLEMENTATION_SUMMARY.md`
- Showcase: Visit `/animation-showcase` (after adding route)
