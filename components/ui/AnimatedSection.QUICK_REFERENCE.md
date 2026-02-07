# AnimatedSection - Quick Reference

**Euveka-level scroll reveal animations in 30 seconds**

---

## Import

```tsx
import { AnimatedSection } from '@/components/ui/AnimatedSection';
```

---

## Basic Usage

```tsx
// Default (fade up)
<AnimatedSection>
  <Content />
</AnimatedSection>

// Choose animation
<AnimatedSection animation="fadeInScale">
  <Card />
</AnimatedSection>

// Stagger children
<AnimatedSection staggerChildren>
  <Item />
  <Item />
  <Item />
</AnimatedSection>
```

---

## Animation Types

| Type | Effect | Use Case |
|------|--------|----------|
| `fadeInUp` | Fade + slide up | Hero, features, text (DEFAULT) |
| `fadeInDown` | Fade + slide down | Headers, navigation |
| `fadeInLeft` | Fade + slide left | Images, cards (left) |
| `fadeInRight` | Fade + slide right | Images, cards (right) |
| `fadeInScale` | Fade + scale up | Cards, modals, CTAs |
| `slideUp` | Pure slide | Panels, sections |
| `blur` | Blur to clear | Premium features, heroes |
| `none` | Instant | Critical content |

---

## Props at a Glance

```tsx
<AnimatedSection
  animation="fadeInUp"           // Animation type
  staggerChildren={true}         // Enable stagger
  staggerDelay={100}             // Delay between children (ms)
  threshold={0.1}                // When to trigger (0-1)
  rootMargin="0px 0px -50px 0px" // Trigger offset
  triggerOnce={true}             // Only animate once
  duration={0.6}                 // Duration (seconds)
  easing="cubic-bezier(...)"     // Easing function
  delay={0}                      // Initial delay (ms)
  className="custom"             // Additional classes
  as="section"                   // HTML element
/>
```

---

## Common Patterns

### Hero Section
```tsx
<AnimatedSection animation="fadeInUp" staggerChildren staggerDelay={200}>
  <h1>Title</h1>
  <p>Description</p>
  <Button>CTA</Button>
</AnimatedSection>
```

### Feature Grid
```tsx
<AnimatedSection animation="fadeInScale" staggerChildren>
  <div className="grid grid-cols-3 gap-6">
    <Card />
    <Card />
    <Card />
  </div>
</AnimatedSection>
```

### Alternating Content
```tsx
<AnimatedSection animation="fadeInLeft">
  <LeftContent />
</AnimatedSection>

<AnimatedSection animation="fadeInRight">
  <RightContent />
</AnimatedSection>
```

### Premium Effect
```tsx
<AnimatedSection animation="blur" duration={1}>
  <PremiumContent />
</AnimatedSection>
```

---

## Timing Guide

| Speed | Duration | Use Case |
|-------|----------|----------|
| Fast | 0.3s | Micro-interactions, small cards |
| Normal | 0.6s | Most content (DEFAULT) |
| Slow | 1.2s | Hero sections, premium features |

| Stagger | Delay | Use Case |
|---------|-------|----------|
| Fast | 50ms | Long lists, small items |
| Normal | 100ms | Feature grids (DEFAULT) |
| Slow | 200ms | Hero sections, emphasis |

---

## Accessibility

Automatically respects `prefers-reduced-motion`. No manual handling needed.

```tsx
// Manual override
<AnimatedSection animation="none">
  <CriticalContent />
</AnimatedSection>
```

---

## Performance Tips

1. Use `triggerOnce={true}` (default) for best performance
2. Prefer `slideUp` over `blur` for heavy pages
3. Keep `staggerDelay` under 200ms
4. Use `threshold={0.2}` for faster triggers

---

## Troubleshooting

**Animation not showing?**
- Element below viewport on load? ✓
- `prefers-reduced-motion` disabled? ✓
- `animation="none"` not set? ✓

**Stagger not working?**
- `staggerChildren={true}` set? ✓
- Multiple children present? ✓

**Performance issues?**
- Use `slideUp` instead of `blur`
- Reduce `staggerDelay`
- Enable `triggerOnce`

---

## Examples

See `AnimatedSection.example.tsx` for 23 complete examples.

---

## Full Docs

See `AnimatedSection.README.md` for complete documentation.
