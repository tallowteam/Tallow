# Animation System Documentation

## Overview

This document describes the comprehensive animation system implemented in Tallow, featuring Framer Motion for smooth 60fps animations, skeleton loading states, and full accessibility support.

## Features

- **Smooth 60fps Animations**: Optimized for performance across all devices
- **Accessibility First**: Respects `prefers-reduced-motion` setting
- **Skeleton Loading**: Progressive loading states for better UX
- **Micro-interactions**: Delightful button and card animations
- **Page Transitions**: Smooth navigation between routes
- **Responsive**: Animations adapt to device capabilities

## Quick Start

### 1. Using Animated Components

```tsx
import { AnimatedCard, AnimatedList, AnimatedListItem } from '@/lib/animations';

function MyComponent() {
  return (
    <AnimatedList>
      {items.map(item => (
        <AnimatedListItem key={item.id}>
          <AnimatedCard hoverEffect>
            {item.content}
          </AnimatedCard>
        </AnimatedListItem>
      ))}
    </AnimatedList>
  );
}
```

### 2. Using Skeleton Loaders

```tsx
import { DeviceListSkeleton, TransferCardSkeleton } from '@/components/ui/skeleton';

function LoadingState() {
  return isLoading ? <DeviceListSkeleton count={3} /> : <ActualContent />;
}
```

### 3. Page Transitions

```tsx
import { PageTransition } from '@/lib/animations/page-transition';

export default function Page() {
  return (
    <PageTransition>
      <YourPageContent />
    </PageTransition>
  );
}
```

## Animation Variants

### Available Variants

- `fadeVariants` - Simple fade in/out
- `fadeUpVariants` - Fade with slide from bottom
- `fadeDownVariants` - Fade with slide from top
- `scaleVariants` - Scale animation
- `slideLeftVariants` - Slide from left
- `slideRightVariants` - Slide from right
- `popVariants` - Bouncy scale animation
- `staggerContainerVariants` - Container for staggered children

### Example Usage

```tsx
import { motion } from 'framer-motion';
import { fadeUpVariants } from '@/lib/animations/motion-config';

function Component() {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      Content
    </motion.div>
  );
}
```

## Skeleton Components

### Pre-built Skeletons

- `DeviceListSkeleton` - Loading state for device discovery
- `TransferCardSkeleton` - Loading state for file transfers
- `FileListSkeleton` - Loading state for file selection
- `SettingsSkeleton` - Loading state for settings page
- `TransferProgressSkeleton` - Loading during transfer init

### Custom Skeletons

```tsx
import { Skeleton, SkeletonText, SkeletonAvatar } from '@/components/ui/skeleton';

function CustomSkeleton() {
  return (
    <div className="flex gap-4">
      <SkeletonAvatar width={48} height={48} />
      <div className="flex-1 space-y-2">
        <SkeletonText className="w-3/4" />
        <SkeletonText className="w-1/2" />
      </div>
    </div>
  );
}
```

## Animated Component Library

### AnimatedContainer

General purpose animated container with multiple variants:

```tsx
<AnimatedContainer variant="fadeUp" delay={0.2}>
  <Content />
</AnimatedContainer>
```

### AnimatedList & AnimatedListItem

For lists with stagger animation:

```tsx
<AnimatedList>
  {items.map((item, index) => (
    <AnimatedListItem key={item.id}>
      {item.content}
    </AnimatedListItem>
  ))}
</AnimatedList>
```

### AnimatedCard

Cards with hover effects:

```tsx
<AnimatedCard hoverEffect>
  <CardContent />
</AnimatedCard>
```

### AnimatedModal

Modal with backdrop and content animations:

```tsx
<AnimatedModal isOpen={isOpen} onClose={handleClose}>
  <ModalContent />
</AnimatedModal>
```

### AnimatedCollapse

Collapsible content with smooth height animation:

```tsx
<AnimatedCollapse isOpen={isExpanded}>
  <CollapsibleContent />
</AnimatedCollapse>
```

## Micro-interactions

### Button Animations

Buttons automatically get hover and tap animations:

```tsx
import { motion } from 'framer-motion';
import { buttonVariants } from '@/lib/animations/motion-config';

<motion.button
  variants={buttonVariants}
  whileHover="hover"
  whileTap="tap"
>
  Click me
</motion.button>
```

### Card Hover Effects

Cards lift on hover:

```tsx
import { cardHoverVariants } from '@/lib/animations/motion-config';

<motion.div
  variants={cardHoverVariants}
  initial="rest"
  whileHover="hover"
  whileTap="tap"
>
  Card content
</motion.div>
```

### Ripple Effect

Add ripple effect on click:

```tsx
import { RippleEffect } from '@/lib/animations/animated-components';

function Button() {
  const [ripple, setRipple] = useState(false);

  return (
    <button onClick={() => setRipple(true)}>
      <RippleEffect trigger={ripple} />
      Click me
    </button>
  );
}
```

## Accessibility

### Reduced Motion Support

The animation system automatically respects the user's `prefers-reduced-motion` setting:

```tsx
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

function Component() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={prefersReducedMotion ? {} : { y: [-10, 0] }}
    >
      Content
    </motion.div>
  );
}
```

All animation variants automatically use reduced motion when the preference is set.

### Testing Reduced Motion

In your browser DevTools:

1. Open DevTools (F12)
2. Open Command Palette (Cmd/Ctrl + Shift + P)
3. Type "Emulate CSS prefers-reduced-motion"
4. Select "prefers-reduced-motion: reduce"

## Performance Optimization

### GPU Acceleration

Animations use transform and opacity for GPU acceleration:

```tsx
// Good - GPU accelerated
<motion.div animate={{ x: 100, scale: 1.2 }} />

// Avoid - Forces layout recalculation
<motion.div animate={{ width: 100, height: 100 }} />
```

### Will-change Optimization

For frequently animated elements:

```tsx
<motion.div
  style={{ willChange: 'transform, opacity' }}
  animate={{ x: 100 }}
/>
```

### Layout Animations

Use `layout` prop for automatic layout transitions:

```tsx
<motion.div layout>
  <DynamicContent />
</motion.div>
```

## Component Examples

### Animated Device List

```tsx
import { DeviceListAnimated } from '@/components/devices/device-list-animated';

<DeviceListAnimated
  devices={devices}
  isLoading={isLoading}
  onDeviceSelect={handleSelect}
/>
```

### Animated Transfer Queue

```tsx
import { TransferQueueAnimated } from '@/components/transfer/transfer-queue-animated';

<TransferQueueAnimated
  transfers={transfers}
  isLoading={isLoading}
  onPause={handlePause}
  onResume={handleResume}
/>
```

## Custom Animations

### Creating Custom Variants

```tsx
import { createVariants } from '@/lib/animations/motion-config';

const myVariants = createVariants(
  { opacity: 0, scale: 0.8 },  // hidden state
  { opacity: 1, scale: 1 },     // visible state
  { duration: 0.5 }             // transition
);
```

### Stagger Delays

```tsx
import { getStaggerDelay } from '@/lib/animations/motion-config';

{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: getStaggerDelay(index) }}
  >
    {item.content}
  </motion.div>
))}
```

## Best Practices

1. **Keep it Subtle**: Animations should enhance, not distract
2. **Respect User Preferences**: Always support reduced motion
3. **Optimize for Performance**: Use transform and opacity
4. **Meaningful Motion**: Animate with purpose
5. **Consistent Timing**: Use predefined easing curves
6. **Progressive Enhancement**: App works without animations
7. **Test on Devices**: Ensure 60fps on target devices

## Troubleshooting

### Animations Not Working

1. Check if Framer Motion is installed: `npm list framer-motion`
2. Verify component is client-side: Add `'use client'` directive
3. Check for JavaScript errors in console
4. Verify AnimatePresence is wrapping conditional renders

### Performance Issues

1. Reduce number of animated elements
2. Use `layout` prop sparingly
3. Avoid animating expensive properties (width, height)
4. Check for memory leaks with AnimatePresence
5. Profile with Chrome DevTools Performance tab

### Accessibility Issues

1. Test with reduced motion enabled
2. Verify animations don't block interaction
3. Ensure focus management during transitions
4. Test with screen readers

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with hardware acceleration

## Further Reading

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Web Animation Performance](https://web.dev/animations/)
- [Reduced Motion Guide](https://web.dev/prefers-reduced-motion/)
