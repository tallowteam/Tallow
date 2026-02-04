# Tallow Animation System - Quick Reference

## Setup (One Time)

```tsx
// app/layout.tsx
import '@/lib/animations/animations.css';
```

## Import Components

```tsx
import {
  FadeIn,
  GradientText,
  GlowEffect,
  GridPattern,
  Spotlight,
  TypeWriter,
  Counter,
} from '@/components/effects';
```

## Common Patterns

### Fade In on Scroll
```tsx
<FadeIn direction="up" delay={100}>
  <h1>Content</h1>
</FadeIn>
```

### Animated Gradient Text
```tsx
<GradientText colors={['#FF6B6B', '#4ECDC4']} animate>
  Beautiful Text
</GradientText>
```

### Stats Counter
```tsx
<Counter end={1000} suffix="+" duration={2000} />
```

### Typewriter Effect
```tsx
<TypeWriter text="Welcome!" speed={50} cursor />
```

### Background Pattern
```tsx
<GridPattern strokeColor="#333" fade />
```

### Glow Effect
```tsx
<div style={{ position: 'relative' }}>
  <GlowEffect color="#4ECDC4" pulse />
  <h1>Content</h1>
</div>
```

### Spotlight
```tsx
<SpotlightContainer>
  <Spotlight color="#4ECDC4" size={600} />
  <div>Content</div>
</SpotlightContainer>
```

## Hero Section Template

```tsx
<section style={{ position: 'relative', overflow: 'hidden' }}>
  {/* Background */}
  <GridPattern fade />
  <GlowEffect color="#4ECDC4" position="top" />

  {/* Content */}
  <FadeIn direction="up" delay={200}>
    <GradientText colors={['#FF6B6B', '#4ECDC4']} animate fontSize="4rem">
      Tallow
    </GradientText>
  </FadeIn>

  <FadeIn direction="up" delay={400}>
    <TypeWriter text="Secure. Private. Fast." />
  </FadeIn>

  <FadeIn direction="up" delay={600}>
    <CounterGrid
      stats={[
        { value: 10000, label: 'Users', suffix: '+' },
        { value: 99.9, label: 'Uptime', suffix: '%' },
      ]}
    />
  </FadeIn>
</section>
```

## Props Cheat Sheet

### FadeIn
- `direction`: 'up' | 'down' | 'left' | 'right' | 'none'
- `delay`: number (ms)
- `duration`: number (ms, default: 500)
- `once`: boolean (default: true)

### GradientText
- `colors`: string[]
- `animate`: boolean
- `fontSize`: string
- `angle`: number (degrees)

### GlowEffect
- `color`: string
- `intensity`: number (blur radius)
- `pulse`: boolean
- `opacity`: number (0-1)

### Counter
- `end`: number
- `duration`: number (ms)
- `suffix`: string
- `prefix`: string
- `separator`: string

### TypeWriter
- `text`: string | string[]
- `speed`: number (ms per char)
- `cursor`: boolean
- `loop`: boolean

## Performance Tips

✓ Use `once` for one-time animations
✓ Stagger multiple animations
✓ Limit simultaneous animations
✓ Use GPU-accelerated properties (transform, opacity)
✓ Test with reduced motion enabled

## Accessibility

All components automatically respect `prefers-reduced-motion`.

Test with:
```tsx
import { useReducedMotion } from '@/lib/animations/useReducedMotion';

const prefersReducedMotion = useReducedMotion();
```

## File Structure

```
lib/animations/
├── index.ts              # Constants & utilities
├── animations.css        # Keyframes
├── useInView.ts         # Scroll detection
└── useReducedMotion.ts  # A11y hook

components/effects/
├── FadeIn.tsx
├── GradientText.tsx
├── GlowEffect.tsx
├── GridPattern.tsx
├── Spotlight.tsx
├── TypeWriter.tsx
├── Counter.tsx
└── index.ts             # Exports
```

## Bundle Size: ~15KB

Comparison:
- Tallow: 15KB ✓
- Framer Motion: 55KB
- React Spring: 35KB

## Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
