# AnimatedSection Component

**Euveka-level scroll reveal animations for React + Next.js**

A production-ready, TypeScript-strict animated section component with IntersectionObserver-based scroll reveals, stagger support, and extensive customization.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Animation Types](#animation-types)
- [Stagger Support](#stagger-support)
- [Advanced Examples](#advanced-examples)
- [Performance](#performance)
- [Accessibility](#accessibility)
- [Browser Support](#browser-support)

---

## Features

- **8 animation types** - fadeInUp, fadeInDown, fadeInLeft, fadeInRight, fadeInScale, slideUp, blur, none
- **Stagger support** - Animate children with cascading delays
- **Custom timing** - Control duration, easing, and delay
- **IntersectionObserver** - Efficient scroll-based triggers
- **Reduced motion** - Respects `prefers-reduced-motion`
- **TypeScript strict** - Full type safety
- **CSS Modules** - Zero runtime JS for animations
- **Semantic HTML** - Render as any element (div, section, article, etc.)
- **Zero dependencies** - Only uses React hooks

---

## Installation

The component is already included in the Tallow project:

```tsx
import { AnimatedSection } from '@/components/ui/AnimatedSection';
```

---

## Basic Usage

### Default (Fade In Up)

```tsx
<AnimatedSection>
  <h1>This will fade in from bottom</h1>
</AnimatedSection>
```

### Choose Animation Type

```tsx
<AnimatedSection animation="fadeInScale">
  <Card>Scales up while fading in</Card>
</AnimatedSection>
```

### Stagger Children

```tsx
<AnimatedSection animation="fadeInUp" staggerChildren>
  <Card>Appears first</Card>
  <Card>100ms later</Card>
  <Card>200ms later</Card>
</AnimatedSection>
```

---

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Content to animate |
| `animation` | `AnimationType` | `'fadeInUp'` | Animation type (see below) |
| `staggerChildren` | `boolean` | `false` | Enable staggered child animations |
| `staggerDelay` | `number` | `100` | Delay between each child (ms) |
| `threshold` | `number` | `0.1` | IntersectionObserver threshold (0-1) |
| `rootMargin` | `string` | `'0px 0px -50px 0px'` | IntersectionObserver root margin |
| `triggerOnce` | `boolean` | `true` | Only animate once when entering viewport |
| `duration` | `number` | `0.6` | Animation duration in seconds |
| `easing` | `string` | `'cubic-bezier(0.16, 1, 0.3, 1)'` | CSS easing function |
| `delay` | `number` | `0` | Initial delay before animation (ms) |
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | HTML element to render |
| `style` | `CSSProperties` | - | Additional inline styles |

### AnimationType

```typescript
type AnimationType =
  | 'fadeInUp'      // Fade + slide up from bottom (default)
  | 'fadeInDown'    // Fade + slide down from top
  | 'fadeInLeft'    // Fade + slide from right to left
  | 'fadeInRight'   // Fade + slide from left to right
  | 'fadeInScale'   // Fade + scale up from 0.95
  | 'slideUp'       // Pure slide, no fade
  | 'blur'          // Blur-in effect
  | 'none';         // Instant, no animation
```

---

## Animation Types

### fadeInUp (Default)
Fades in while sliding up from bottom. Most common pattern.

```tsx
<AnimatedSection animation="fadeInUp">
  <Content />
</AnimatedSection>
```

**Use cases**: Hero sections, feature cards, text blocks

---

### fadeInDown
Fades in while sliding down from top.

```tsx
<AnimatedSection animation="fadeInDown">
  <Header />
</AnimatedSection>
```

**Use cases**: Headers, navigation, dropdown content

---

### fadeInLeft
Fades in while sliding from right to left.

```tsx
<AnimatedSection animation="fadeInLeft">
  <Image />
</AnimatedSection>
```

**Use cases**: Images, cards (left side), alternating content

---

### fadeInRight
Fades in while sliding from left to right.

```tsx
<AnimatedSection animation="fadeInRight">
  <Image />
</AnimatedSection>
```

**Use cases**: Images, cards (right side), alternating content

---

### fadeInScale
Fades in while scaling up from 0.95 to 1.

```tsx
<AnimatedSection animation="fadeInScale">
  <Card />
</AnimatedSection>
```

**Use cases**: Cards, modals, featured content, CTAs

---

### slideUp
Pure slide animation without fade. Element stays opaque.

```tsx
<AnimatedSection animation="slideUp">
  <Panel />
</AnimatedSection>
```

**Use cases**: Panels, sections with background colors

---

### blur
Blurs in from blurred to clear. Premium effect.

```tsx
<AnimatedSection animation="blur">
  <PremiumContent />
</AnimatedSection>
```

**Use cases**: Premium features, hero images, testimonials

---

### none
Instant appearance, no animation. Respects reduced motion preference.

```tsx
<AnimatedSection animation="none">
  <CriticalContent />
</AnimatedSection>
```

**Use cases**: Critical content, reduced motion fallback

---

## Stagger Support

Animate child elements with cascading delays.

### Basic Stagger

```tsx
<AnimatedSection staggerChildren>
  <Card>Item 1 - 0ms</Card>
  <Card>Item 2 - 100ms</Card>
  <Card>Item 3 - 200ms</Card>
</AnimatedSection>
```

### Custom Stagger Delay

```tsx
<AnimatedSection staggerChildren staggerDelay={150}>
  <Card>Item 1 - 0ms</Card>
  <Card>Item 2 - 150ms</Card>
  <Card>Item 3 - 300ms</Card>
</AnimatedSection>
```

### Fast Stagger (50ms)

```tsx
<AnimatedSection
  animation="fadeInScale"
  staggerChildren
  staggerDelay={50}
>
  {items.map(item => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</AnimatedSection>
```

### Slow Stagger (200ms)

```tsx
<AnimatedSection
  animation="fadeInUp"
  staggerChildren
  staggerDelay={200}
>
  <FeatureCard />
  <FeatureCard />
  <FeatureCard />
</AnimatedSection>
```

---

## Advanced Examples

### Feature Grid with Stagger

```tsx
<AnimatedSection
  animation="fadeInUp"
  staggerChildren
  staggerDelay={100}
  threshold={0.2}
>
  <div className="grid grid-cols-3 gap-6">
    <FeatureCard icon="🚀" title="Fast" />
    <FeatureCard icon="🔒" title="Secure" />
    <FeatureCard icon="🌐" title="Cross-platform" />
  </div>
</AnimatedSection>
```

### Hero Section with Sequential Reveals

```tsx
<AnimatedSection
  animation="fadeInUp"
  staggerChildren
  staggerDelay={200}
  duration={0.8}
>
  <h1>Welcome to Tallow</h1>
  <p>Secure, fast file sharing</p>
  <div className="flex gap-4">
    <Button>Get Started</Button>
    <Button variant="outline">Learn More</Button>
  </div>
</AnimatedSection>
```

### Alternating Content Layout

```tsx
<>
  <AnimatedSection animation="fadeInLeft">
    <div className="flex items-center">
      <Image src="/feature1.png" />
      <div>Feature 1 description</div>
    </div>
  </AnimatedSection>

  <AnimatedSection animation="fadeInRight">
    <div className="flex items-center">
      <div>Feature 2 description</div>
      <Image src="/feature2.png" />
    </div>
  </AnimatedSection>
</>
```

### Custom Timing & Easing

```tsx
<AnimatedSection
  animation="fadeInScale"
  duration={1.2}
  easing="cubic-bezier(0.68, -0.55, 0.265, 1.55)" // Bounce
  delay={300}
>
  <Card>Custom animation timing</Card>
</AnimatedSection>
```

### Trigger Every Time (Not Just Once)

```tsx
<AnimatedSection
  animation="fadeInUp"
  triggerOnce={false}
>
  <Content>Animates every time you scroll past</Content>
</AnimatedSection>
```

### High Threshold (80% Visible)

```tsx
<AnimatedSection
  animation="fadeInUp"
  threshold={0.8}
>
  <Content>Only animates when 80% visible</Content>
</AnimatedSection>
```

### Custom Root Margin

```tsx
<AnimatedSection
  animation="fadeInUp"
  rootMargin="0px 0px -200px 0px"
>
  <Content>Triggers 200px before entering viewport</Content>
</AnimatedSection>
```

### Semantic HTML Elements

```tsx
// Render as section
<AnimatedSection as="section" animation="fadeInUp">
  <h2>Section Title</h2>
</AnimatedSection>

// Render as article
<AnimatedSection as="article" animation="fadeInLeft">
  <ArticleContent />
</AnimatedSection>

// Render as header
<AnimatedSection as="header" animation="fadeInDown">
  <Logo />
</AnimatedSection>
```

### Premium Blur Effect

```tsx
<AnimatedSection
  animation="blur"
  duration={1}
  threshold={0.3}
>
  <div className="premium-feature">
    <h2>Premium Feature</h2>
    <p>Smooth blur-in effect</p>
  </div>
</AnimatedSection>
```

### Fast Micro-Interactions

```tsx
<AnimatedSection
  animation="fadeInScale"
  staggerChildren
  staggerDelay={50}
  duration={0.3}
>
  <div className="grid grid-cols-4 gap-4">
    {items.map(item => (
      <MicroCard key={item.id}>{item.name}</MicroCard>
    ))}
  </div>
</AnimatedSection>
```

---

## Performance

### Optimization Techniques

1. **CSS-based animations** - No JavaScript during animation
2. **IntersectionObserver** - Efficient scroll detection
3. **Will-change hints** - GPU acceleration where needed
4. **Reduced motion** - Respects user preferences
5. **Trigger once** - Default behavior prevents re-renders

### Performance Tips

```tsx
// Good: Trigger once (default)
<AnimatedSection animation="fadeInUp">
  <Content />
</AnimatedSection>

// Use sparingly: Trigger every time
<AnimatedSection animation="fadeInUp" triggerOnce={false}>
  <Content />
</AnimatedSection>
```

### Bundle Size

- Component: ~2KB gzipped
- CSS: ~1.5KB gzipped
- Total: ~3.5KB gzipped

---

## Accessibility

### Reduced Motion Support

The component automatically respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  /* All animations disabled */
  animation: none !important;
  opacity: 1 !important;
  transform: none !important;
}
```

### Manual Reduced Motion

```tsx
<AnimatedSection animation="none">
  <Content>Instantly visible, no animation</Content>
</AnimatedSection>
```

### Semantic HTML

```tsx
// Use semantic elements for better accessibility
<AnimatedSection as="section" aria-labelledby="features-heading">
  <h2 id="features-heading">Features</h2>
  <FeatureGrid />
</AnimatedSection>
```

### Focus Management

Animations don't interfere with keyboard navigation or screen readers.

---

## Browser Support

- **Chrome/Edge**: 51+ (IntersectionObserver)
- **Firefox**: 55+
- **Safari**: 12.1+
- **Mobile**: iOS 12.2+, Android 5+

### Polyfill

Not needed for modern browsers. For older browsers, use:

```bash
npm install intersection-observer
```

```tsx
// polyfills.ts
import 'intersection-observer';
```

---

## CSS Custom Properties

The component uses CSS custom properties for timing:

```css
:root {
  --animation-duration: 0.6s;
  --animation-easing: cubic-bezier(0.16, 1, 0.3, 1);
  --animation-delay: 0ms;
  --stagger-delay: 100ms;
}
```

These can be overridden via inline styles:

```tsx
<AnimatedSection
  style={{
    '--animation-duration': '1s',
    '--animation-easing': 'ease-in-out'
  } as CSSProperties}
>
  <Content />
</AnimatedSection>
```

---

## Common Patterns

### Landing Page Hero

```tsx
<AnimatedSection
  animation="fadeInUp"
  staggerChildren
  staggerDelay={200}
  duration={0.8}
  as="section"
>
  <h1>Hero Title</h1>
  <p>Hero description</p>
  <Button>Get Started</Button>
</AnimatedSection>
```

### Feature Grid (3 columns)

```tsx
<AnimatedSection
  animation="fadeInScale"
  staggerChildren
  staggerDelay={100}
>
  <div className="grid grid-cols-3 gap-6">
    <FeatureCard />
    <FeatureCard />
    <FeatureCard />
  </div>
</AnimatedSection>
```

### Testimonials

```tsx
<AnimatedSection
  animation="blur"
  duration={1}
  threshold={0.3}
>
  <TestimonialCard />
</AnimatedSection>
```

### Pricing Cards

```tsx
<AnimatedSection
  animation="fadeInUp"
  staggerChildren
  staggerDelay={150}
>
  <div className="flex gap-8">
    <PricingCard />
    <PricingCard featured />
    <PricingCard />
  </div>
</AnimatedSection>
```

### Stats Section

```tsx
<AnimatedSection
  animation="fadeInUp"
  staggerChildren
  staggerDelay={100}
  threshold={0.5}
>
  <div className="grid grid-cols-4 gap-4">
    <Stat label="Users" value="10K+" />
    <Stat label="Files" value="1M+" />
    <Stat label="Countries" value="150+" />
    <Stat label="Uptime" value="99.9%" />
  </div>
</AnimatedSection>
```

---

## Migration Guide

### From Old AnimatedSection

```tsx
// Old API
<AnimatedSection animation="fade-up" delay={100} />

// New API
<AnimatedSection animation="fadeInUp" delay={100} />
```

### Animation Name Changes

| Old | New |
|-----|-----|
| `fade-up` | `fadeInUp` |
| `fade-down` | `fadeInDown` |
| `fade-left` | `fadeInLeft` |
| `fade-right` | `fadeInRight` |
| `scale-in` | `fadeInScale` |
| `fade-in` | `fadeInUp` (use blur for pure fade) |

---

## TypeScript

### Full Type Safety

```typescript
import { AnimatedSection, type AnimatedSectionProps, type AnimationType } from '@/components/ui/AnimatedSection';

const props: AnimatedSectionProps = {
  animation: 'fadeInUp',
  staggerChildren: true,
  staggerDelay: 100,
  duration: 0.6,
};

const animationType: AnimationType = 'blur';
```

### Custom Wrapper Component

```tsx
import { AnimatedSection, type AnimatedSectionProps } from '@/components/ui/AnimatedSection';

interface FeatureGridProps extends Omit<AnimatedSectionProps, 'animation'> {
  features: Feature[];
}

export function FeatureGrid({ features, ...props }: FeatureGridProps) {
  return (
    <AnimatedSection
      animation="fadeInScale"
      staggerChildren
      {...props}
    >
      <div className="grid grid-cols-3 gap-6">
        {features.map(feature => (
          <FeatureCard key={feature.id} {...feature} />
        ))}
      </div>
    </AnimatedSection>
  );
}
```

---

## Troubleshooting

### Animation not triggering

**Issue**: Element appears instantly without animation

**Solutions**:
1. Check if `prefers-reduced-motion` is enabled
2. Verify element is below viewport on page load
3. Ensure `threshold` value allows for trigger
4. Check `rootMargin` isn't preventing trigger

```tsx
// Debug mode
<AnimatedSection
  animation="fadeInUp"
  threshold={0.1}
  rootMargin="0px"
  triggerOnce={false}
>
  <Content />
</AnimatedSection>
```

### Stagger not working

**Issue**: All children animate at once

**Solution**: Ensure `staggerChildren` is true

```tsx
// Correct
<AnimatedSection staggerChildren>
  <Child />
  <Child />
</AnimatedSection>

// Wrong
<AnimatedSection>
  <Child />
  <Child />
</AnimatedSection>
```

### Performance issues

**Issue**: Janky animations

**Solutions**:
1. Reduce `staggerDelay`
2. Use `slideUp` instead of `blur`
3. Increase `threshold`
4. Enable `triggerOnce`

```tsx
// Optimized
<AnimatedSection
  animation="slideUp"
  staggerChildren
  staggerDelay={50}
  triggerOnce
>
  <Content />
</AnimatedSection>
```

---

## Credits

- Design inspired by Euveka, Linear, and Vercel
- Built with React 18+ and TypeScript
- Uses IntersectionObserver API
- CSS Modules for styling

---

## License

Part of the Tallow project. See main LICENSE file.
