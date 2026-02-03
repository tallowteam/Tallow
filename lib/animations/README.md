# Tallow Animation System

Production-ready animation utilities and effect components built with React 19, TypeScript, and native CSS animations.

## Features

- **Zero Dependencies**: Pure CSS animations with React hooks
- **Performance Optimized**: 60fps animations using GPU acceleration
- **Accessibility First**: Full support for `prefers-reduced-motion`
- **Lightweight**: ~15KB total (minified)
- **TypeScript**: Full type safety and IntelliSense
- **Composable**: Mix and match components and utilities
- **Mobile Friendly**: Responsive and touch-optimized

## Quick Start

### Import Animations CSS

Add to your main layout or global CSS:

```tsx
import '@/lib/animations/animations.css';
```

### Basic Usage

```tsx
import { FadeIn } from '@/components/effects';

export default function Page() {
  return (
    <FadeIn direction="up" delay={100}>
      <h1>Animated Content</h1>
    </FadeIn>
  );
}
```

## Core Utilities

### Animation Constants

```tsx
import { DURATION, EASING } from '@/lib/animations';

// Duration presets (ms)
DURATION.fast;      // 200ms
DURATION.normal;    // 300ms
DURATION.slow;      // 500ms

// Easing functions
EASING.easeOut;     // cubic-bezier(0.16, 1, 0.3, 1)
EASING.spring;      // cubic-bezier(0.34, 1.56, 0.64, 1)
EASING.bounce;      // cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### useInView Hook

Detect when elements enter the viewport:

```tsx
import { useInView } from '@/lib/animations/useInView';

function Component() {
  const { ref, isInView } = useInView({
    threshold: 0.5,
    once: true,
  });

  return (
    <div ref={ref}>
      {isInView ? 'Visible!' : 'Not visible yet'}
    </div>
  );
}
```

### useReducedMotion Hook

Respect user's motion preferences:

```tsx
import { useReducedMotion } from '@/lib/animations/useReducedMotion';

function Component() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={prefersReducedMotion ? 'no-animation' : 'animated'}>
      Content
    </div>
  );
}
```

## Effect Components

### FadeIn

Fade in with directional options:

```tsx
<FadeIn direction="up" delay={100} duration={500}>
  <h1>Fades in from bottom</h1>
</FadeIn>

// Stagger children
<FadeInStagger staggerDelay={100}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</FadeInStagger>
```

**Props:**
- `direction`: 'up' | 'down' | 'left' | 'right' | 'none'
- `delay`: number (ms)
- `duration`: number (ms)
- `distance`: number (pixels)
- `once`: boolean
- `threshold`: number (0-1)

### GradientText

Animated gradient text:

```tsx
<GradientText
  colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
  animate
  fontSize="3rem"
>
  Beautiful Gradient
</GradientText>

// With presets
<PresetGradientText preset="sunset" animate>
  Sunset Colors
</PresetGradientText>
```

**Available Presets:**
- `sunset`, `ocean`, `forest`, `fire`, `purple`, `blue`, `pink`, `gold`, `silver`, `rainbow`, `monochrome`, `neon`, `pastel`

### GlowEffect

Decorative glow/blur effects:

```tsx
<div style={{ position: 'relative' }}>
  <GlowEffect color="#4ECDC4" pulse intensity={30} />
  <h1>Content with Glow</h1>
</div>

// Multi-color glow
<MultiGlow colors={['#FF6B6B', '#4ECDC4', '#45B7D1']} pulse />
```

**Props:**
- `color`: string
- `intensity`: number (blur radius)
- `pulse`: boolean
- `opacity`: number (0-1)
- `position`: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'custom'

### GridPattern

SVG-based background patterns:

```tsx
<GridPattern
  width={40}
  height={40}
  strokeColor="#333333"
  fade
/>

// Variants
<DotPattern spacing={30} size={2} color="#4ECDC4" />
<DiagonalPattern spacing={20} angle={45} />
<HexagonPattern size={30} />
```

### Spotlight

Mouse-following spotlight effect:

```tsx
<SpotlightContainer>
  <Spotlight color="#4ECDC4" size={600} />
  <div>Your content</div>
</SpotlightContainer>

// Gradient spotlight
<GradientSpotlight colors={['#FF6B6B', '#4ECDC4']} />

// Pulse spotlight
<PulseSpotlight color="#4ECDC4" pulseDuration={2} />
```

**Props:**
- `size`: number (diameter)
- `color`: string
- `opacity`: number (0-1)
- `blur`: number
- `smooth`: boolean
- `smoothing`: number (0-1)

### TypeWriter

Character-by-character typing animation:

```tsx
<TypeWriter
  text="Welcome to Tallow"
  speed={50}
  cursor
/>

// Multiple lines
<MultiLineTypeWriter
  lines={['Line 1', 'Line 2', 'Line 3']}
  speed={50}
/>

// Rotating text
<RotatingTypeWriter
  texts={['Fast', 'Secure', 'Private']}
  prefix="Tallow is "
/>
```

**Props:**
- `text`: string | string[]
- `speed`: number (ms per character)
- `cursor`: boolean
- `loop`: boolean
- `deleteAfterTyping`: boolean

### Counter

Animated number counter:

```tsx
<Counter
  end={1000}
  duration={2000}
  separator=","
  suffix="+"
/>

// Variants
<PercentageCounter end={95.5} decimals={1} />
<CurrencyCounter end={1250} currency="$" />
<AbbreviatedCounter end={1500000} /> // Shows "1.5M"

// Stat grid
<CounterGrid
  stats={[
    { value: 1000, label: 'Users', suffix: '+' },
    { value: 50, label: 'Countries' },
    { value: 99.9, label: 'Uptime', suffix: '%' },
  ]}
/>
```

**Props:**
- `end`: number
- `start`: number
- `duration`: number (ms)
- `decimals`: number
- `prefix`: string
- `suffix`: string
- `separator`: string
- `easing`: 'linear' | 'easeOutExpo' | 'easeInOutQuad'

## Performance Best Practices

### 1. Use GPU Acceleration

Animations automatically use `transform` and `opacity` for GPU acceleration:

```tsx
// Good - GPU accelerated
transform: translateY(10px)
opacity: 0.5

// Avoid - triggers layout/paint
top: 10px
height: 100px
```

### 2. Limit Simultaneous Animations

```tsx
// Good - stagger animations
<FadeInStagger staggerDelay={50}>
  {items.map(item => <Item key={item.id} />)}
</FadeInStagger>

// Avoid - all at once
{items.map(item => <FadeIn><Item key={item.id} /></FadeIn>)}
```

### 3. Use `once` Option

```tsx
// Good - animate once
<FadeIn once>Content</FadeIn>

// Avoid - repeating animations
<FadeIn once={false}>Content</FadeIn>
```

### 4. Respect Reduced Motion

All components automatically respect `prefers-reduced-motion`. You can also use the hook:

```tsx
const prefersReducedMotion = useReducedMotion();

if (prefersReducedMotion) {
  return <SimpleComponent />;
}
return <AnimatedComponent />;
```

## Advanced Examples

### Hero Section with Multiple Effects

```tsx
function Hero() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background effects */}
      <GridPattern fade />
      <GlowEffect color="#4ECDC4" position="top" />
      <Spotlight color="#4ECDC4" size={800} />

      {/* Content */}
      <FadeIn direction="up" delay={200}>
        <GradientText
          colors={['#FF6B6B', '#4ECDC4']}
          fontSize="4rem"
          animate
        >
          Welcome to Tallow
        </GradientText>
      </FadeIn>

      <FadeIn direction="up" delay={400}>
        <TypeWriter
          text="Secure. Private. Fast."
          speed={50}
          cursor
        />
      </FadeIn>
    </section>
  );
}
```

### Stats Section

```tsx
function Stats() {
  return (
    <section>
      <CounterGrid
        columns={3}
        stats={[
          {
            value: 10000,
            label: 'Active Users',
            suffix: '+',
          },
          {
            value: 99.9,
            label: 'Uptime',
            suffix: '%',
            decimals: 1,
          },
          {
            value: 50,
            label: 'Countries',
          },
        ]}
      />
    </section>
  );
}
```

### Feature Cards

```tsx
function Features() {
  return (
    <FadeInStagger staggerDelay={100}>
      {features.map((feature) => (
        <div key={feature.id} style={{ position: 'relative' }}>
          <SpotlightGlow color={feature.color} />
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </div>
      ))}
    </FadeInStagger>
  );
}
```

## Bundle Size

| Component | Size (min+gzip) |
|-----------|-----------------|
| Core utilities | ~2KB |
| useInView | ~1KB |
| useReducedMotion | ~0.5KB |
| FadeIn | ~1.5KB |
| GradientText | ~1KB |
| GlowEffect | ~1KB |
| GridPattern | ~2KB |
| Spotlight | ~2KB |
| TypeWriter | ~2KB |
| Counter | ~2KB |
| **Total** | **~15KB** |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required APIs

- Intersection Observer (for scroll animations)
- RequestAnimationFrame (for smooth animations)
- CSS Custom Properties (for dynamic styles)

## Troubleshooting

### Animations not working

1. Ensure CSS is imported:
```tsx
import '@/lib/animations/animations.css';
```

2. Check parent has correct positioning:
```tsx
// Parent needs position: relative for absolute effects
<div style={{ position: 'relative' }}>
  <GlowEffect />
</div>
```

### Performance issues

1. Use `once` option to prevent repeated animations
2. Reduce number of simultaneous animations
3. Use `will-change` sparingly
4. Check GPU usage in Chrome DevTools

### Accessibility concerns

All components automatically respect `prefers-reduced-motion`. Test with:

```css
/* Add to DevTools or browser settings */
@media (prefers-reduced-motion: reduce) {
  /* Enabled */
}
```

## Migration from Framer Motion

```tsx
// Before (Framer Motion)
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>

// After (Tallow Animations)
<FadeIn direction="up" duration={500}>
  Content
</FadeIn>
```

**Benefits:**
- ~40KB smaller bundle
- Better tree-shaking
- Native CSS animations (better performance)
- Simpler API

## Contributing

See component source files for implementation details. All components follow these principles:

1. Performance first (60fps target)
2. Accessibility required (prefers-reduced-motion)
3. TypeScript strict mode
4. Zero external dependencies
5. Composable and reusable

## License

MIT - See LICENSE file for details
