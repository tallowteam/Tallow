# Animations Quick Reference

## CSS Animation Classes Available

### Global Utilities (`app/globals.css`)

```css
/* Fade Animations */
.animate-fade-in         /* Opacity 0→1, 300ms */
.animate-fade-up         /* Fade + translateY(20px→0), 500ms */
.animate-fade-down       /* Fade + translateY(-20px→0), 500ms */

/* Transform Animations */
.animate-scale-in        /* Scale 0.95→1, 300ms */

/* Continuous Animations */
.animate-pulse           /* Opacity pulse, 2s infinite */
.animate-pulse-glow      /* Box-shadow pulse, 2s infinite */
.animate-spin            /* Rotate 360deg, 1s infinite */
.animate-bounce          /* Vertical bounce, 2s infinite */
.animate-float           /* Slow float, 6s infinite */
.animate-shimmer         /* Background sweep, 2s infinite */
.animate-shimmer-reverse /* Reverse sweep, 2s infinite */
.animate-glow-pulse      /* Purple glow pulse, 2s infinite */
.animate-border-glow     /* Border color pulse, 2s infinite */

/* Hover Effects */
.hover-glow              /* Box-shadow on hover */
.hover-lift              /* translateY(-4px) + shadow */
.hover-scale             /* scale(1.02) on hover */
.hover-lift-scale        /* Combined lift + scale */

/* Delay Classes */
.animate-delay-100       /* 100ms delay */
.animate-delay-200       /* 200ms delay */
.animate-delay-300       /* 300ms delay */
/* ... up to 800ms */

/* Fill Modes */
.animate-fill-both       /* both */
.animate-fill-forwards   /* forwards */
```

---

## Component-Specific Animations

### Hero Section
```tsx
// Gradient text shimmer (auto-applied)
<span className={styles.heroTitleGradient}>Quantum-safe.</span>

// Badge dot pulse (auto-applied)
<span className={styles.badgeDot} />
```

### Feature Cards
```tsx
// Hover effects automatically applied to:
<div className={styles.featureCard}>
  <div className={styles.featureIcon}>
    <Icon /> {/* Scales 1.1 on card hover */}
  </div>
</div>
```

### Buttons
```tsx
// All button states pre-configured
<Button variant="primary">Click Me</Button>
// Hover: brightness increase + glow
// Active: scale(0.98) press effect
// Loading: smooth spinner rotation
```

### Badges
```tsx
// Dot pulse automatically applied
<Badge dot>New</Badge>
```

### Transfer Page Tabs
```tsx
// Tab activate animation + shimmer on active
<button className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}>
  <Icon /> {/* Scales 1.05 on hover */}
</button>
```

### File Drop Zone
```tsx
// Pulse border when dragging
<div className={styles.dragging}>
  {/* Pulsing purple border + glow */}
</div>
```

### Device Cards
```tsx
// Hover glow + lift + scale
<div className={styles.deviceCard}>
  <div className={styles.deviceIcon}>
    <svg className={styles.deviceSvg} />
    {/* Icon scales 1.1 on card hover */}
  </div>
</div>
```

---

## Custom Keyframes Available

```css
@keyframes fade-up
@keyframes fade-down
@keyframes fade-left
@keyframes fade-right
@keyframes fade-in
@keyframes scale-in
@keyframes slide-in-right
@keyframes slide-in-bottom
@keyframes pulse
@keyframes pulse-glow
@keyframes pulse-dot
@keyframes spin
@keyframes shimmer
@keyframes shimmer-reverse
@keyframes bounce
@keyframes float
@keyframes gradient-shift
@keyframes glow-pulse
@keyframes border-glow
@keyframes tab-activate
@keyframes device-glow
@keyframes pulse-border
```

---

## Easing Functions

```css
--ease-linear:    linear
--ease-in:        cubic-bezier(0.4, 0, 1, 1)
--ease-out:       cubic-bezier(0, 0, 0.2, 1)
--ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1)
--ease-smooth:    cubic-bezier(0.16, 1, 0.3, 1)    /* Premium */
--ease-bounce:    cubic-bezier(0.34, 1.56, 0.64, 1) /* Spring */
```

---

## Duration Variables

```css
--duration-75:    75ms
--duration-100:   100ms
--duration-150:   150ms
--duration-200:   200ms    /* Micro-interactions */
--duration-300:   300ms    /* Standard hover */
--duration-500:   500ms    /* Entrance animations */
--duration-700:   700ms
--duration-1000:  1000ms   /* Hero moments */
```

---

## Animation Timing Guide

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Button press | 150-200ms | `ease-smooth` |
| Icon hover | 200ms | `ease-smooth` |
| Card hover | 200-300ms | `ease-smooth` |
| Tab switch | 250-300ms | `ease-smooth` |
| Modal open | 300ms | `ease-out` |
| Page transition | 400ms | `ease-smooth` |
| Entrance animation | 500-600ms | `ease-smooth` |
| Hero shimmer | 2-3s | `ease-in-out` |
| Background glow | 8-15s | `ease-in-out` |

---

## Adding New Animations

### 1. Define Keyframe in CSS
```css
@keyframes my-animation {
  from { /* start state */ }
  to { /* end state */ }
}
```

### 2. Apply to Element
```css
.myElement {
  animation: my-animation 300ms var(--ease-smooth) both;
}
```

### 3. Add Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .myElement {
    animation: none;
  }
}
```

### 4. Use GPU-Accelerated Properties
✅ **Use**: `transform`, `opacity`
❌ **Avoid**: `width`, `height`, `top`, `left`, `margin`, `padding`

---

## Staggered Animations

Use the `useStaggeredIntersectionObserver` hook:

```tsx
const { setRef, isVisible } = useStaggeredIntersectionObserver(
  items.length,
  { threshold: 0.1, triggerOnce: true }
);

{items.map((item, index) => (
  <div
    key={index}
    ref={setRef(index)}
    className={isVisible(index) ? styles.visible : styles.hidden}
    style={{ animationDelay: `${index * 75}ms` }}
  >
    {item}
  </div>
))}
```

---

## Performance Tips

1. **Use `transform` and `opacity`** for animations (GPU-accelerated)
2. **Avoid animating layout properties** (`width`, `height`, etc.)
3. **Use `will-change` sparingly** (only for complex animations)
4. **Keep animation duration under 500ms** for interactions
5. **Use `requestAnimationFrame` for JS animations** (if needed)
6. **Test on mid-range devices** to ensure smooth 60fps

---

## Debugging Animations

### Chrome DevTools
1. Open DevTools → More Tools → Animations
2. Slow down animations for inspection
3. Check for layout thrashing in Performance tab

### Check Animation State
```css
/* Add temporary borders to see animated elements */
.animated-element {
  outline: 2px solid red !important;
}
```

### Verify Reduced Motion
```javascript
// Test in console
window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

---

## Common Patterns

### Hover Lift with Glow
```css
.card {
  transition: transform 200ms var(--ease-smooth),
              box-shadow 200ms var(--ease-smooth);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 20px rgba(94, 92, 230, 0.3);
}
```

### Icon Scale on Parent Hover
```css
.card svg {
  transition: transform 200ms var(--ease-smooth);
}

.card:hover svg {
  transform: scale(1.1);
}
```

### Pulsing Glow
```css
.element {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(94, 92, 230, 0.3); }
  50% { box-shadow: 0 0 20px rgba(94, 92, 230, 0.5); }
}
```

### Shimmer Text
```css
.text {
  background: linear-gradient(
    110deg,
    #fff 30%,
    #5e5ce6 50%,
    #fff 70%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s ease-in-out infinite;
}
```

---

## Accessibility Checklist

- ✅ All animations have `prefers-reduced-motion` fallbacks
- ✅ Animations don't exceed 5 seconds
- ✅ No flashing content (seizure risk)
- ✅ Focus states remain visible
- ✅ Keyboard navigation works with animations
- ✅ Screen readers aren't disrupted

---

## Resources

- [MDN: CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [CSS Easing Functions](https://easings.net/)
- [Cubic Bezier Generator](https://cubic-bezier.com/)
- [Can I Use: CSS Animations](https://caniuse.com/css-animation)
