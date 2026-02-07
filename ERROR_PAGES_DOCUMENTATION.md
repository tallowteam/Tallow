# Error Pages Documentation

Premium Euveka dark aesthetic error pages for Tallow - designed to maintain brand excellence even in error states.

## Overview

Three specialized error pages providing a consistent, premium user experience:

1. **404 Not Found** - Missing pages
2. **Error Boundary** - Runtime errors
3. **Global Error** - Critical failures

All pages feature the signature Euveka dark aesthetic with animated gradients, floating particles, and responsive design.

---

## Files Created

### 1. 404 Not Found Page

**Files:**
- `c:\Users\aamir\Documents\Apps\Tallow\app\not-found.tsx`
- `c:\Users\aamir\Documents\Apps\Tallow\app\not-found.module.css`

**Features:**
- Massive "404" gradient text (8rem - 15rem responsive)
- Animated gradient shift (white → purple spectrum)
- Pulsing orb background effect
- Floating particle animation (5 particles)
- Subtle grid pattern overlay
- Two action buttons: "Go Home" + "Open App"
- Full viewport dark background (#0a0a0a)
- Fully responsive with mobile optimizations

**Design Elements:**
```css
/* Gradient Text */
linear-gradient(
  135deg,
  #ffffff 0%,
  #e0e0ff 20%,
  #b8b8ff 40%,
  #9a9aff 60%,
  #5e5ce6 80%,
  #4c4ad1 100%
)

/* Background Orb */
radial-gradient(
  circle at center,
  rgba(94, 92, 230, 0.2) 0%,
  rgba(154, 154, 255, 0.1) 30%,
  transparent 70%
)
```

**Animations:**
- `orbPulse` - 8s background orb breathing effect
- `gradientShift` - 6s gradient color movement
- `glowPulse` - 4s text glow effect
- `float` - 15-22s particle floating

---

### 2. Error Boundary Page

**Files:**
- `c:\Users\aamir\Documents\Apps\Tallow\app\error.tsx`
- `c:\Users\aamir\Documents\Apps\Tallow\app\error.module.css`

**Features:**
- Animated error icon with ripple effect
- "Something went wrong" gradient heading
- Error message display (development only)
- Sanitized error output for production
- Two actions: "Try Again" + "Go Home"
- Red-tinted orb background for error state
- Monospace code block for technical details

**Error Message Styling:**
```css
/* Error Code Block */
background: rgba(230, 92, 92, 0.05);
border: 1px solid rgba(230, 92, 92, 0.2);
font-family: var(--font-mono);
color: #ffb8b8;
backdrop-filter: blur(10px);
```

**Icon Animation:**
```css
/* Floating Icon */
@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Ripple Effect */
@keyframes ripple {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}
```

**Error Display Logic:**
- Development: Shows full error message
- Production: Shows generic friendly message
- Logs to console in development mode
- Includes error digest for tracking

---

### 3. Global Error Page

**Files:**
- `c:\Users\aamir\Documents\Apps\Tallow\app\global-error.tsx`

**Features:**
- Inline styles (no CSS modules, layout unavailable)
- Complete HTML/body wrapper (required for global errors)
- Critical error icon and messaging
- "Try Again" button with reset functionality
- "Go Home" link to root
- Same Euveka aesthetic using inline styles

**Special Considerations:**
- Must include `<html>` and `<body>` tags
- Cannot use layout components
- Inline styles only (no external CSS)
- Catches errors in root layout
- Last resort error handler

---

## Design System

### Color Palette

**Background:**
```css
--bg-base: #09090b;          /* Near-black base */
--bg-surface: #18181b;       /* Elevated surfaces */
--bg-elevated: #27272a;      /* Cards, modals */
```

**Purple Accent:**
```css
--primary-400: #9a9aff;      /* Light purple */
--primary-500: #5e5ce6;      /* Base purple */
--primary-600: #4c4ad1;      /* Dark purple */
```

**Text:**
```css
--text-primary: #fafafa;     /* White text */
--text-secondary: #a1a1aa;   /* Muted text */
--text-tertiary: #71717a;    /* Very muted */
```

**Error Colors:**
```css
Error Orb: rgba(230, 92, 92, 0.15)
Error Text: #ffb8b8
Error Border: rgba(230, 92, 92, 0.2)
```

---

### Typography

**404 Number:**
```css
font-size: clamp(8rem, 20vw, 15rem);
font-weight: 800;
letter-spacing: -0.05em;
```

**Error Heading:**
```css
font-size: clamp(2rem, 5vw, 3rem);
font-weight: 700;
letter-spacing: -0.03em;
```

**Body Text:**
```css
font-size: clamp(1rem, 2vw, 1.125rem);
line-height: 1.6;
```

---

## Button Styles

### Primary Button
```css
background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
padding: 0.875rem 2rem;
border-radius: 0.625rem;
transition: all 0.2s ease;
```

**Hover Effects:**
- Translates up 2px
- Box shadow: `0 12px 24px -8px rgba(94, 92, 230, 0.5)`
- Gradient overlay fade-in

### Ghost Button
```css
background: rgba(255, 255, 255, 0.03);
border: 1px solid rgba(255, 255, 255, 0.1);
backdrop-filter: blur(10px);
```

**Hover Effects:**
- Background brightens to 0.06
- Border brightens to 0.15
- Translates up 2px

---

## Animations

### Background Effects

**Orb Pulse (8s):**
```css
0%, 100% {
  transform: translate(-50%, -50%) scale(1);
  opacity: 0.6;
}
50% {
  transform: translate(-50%, -50%) scale(1.2);
  opacity: 0.8;
}
```

**Gradient Shift (6s):**
```css
0%, 100% { background-position: 0% 50%; }
50% { background-position: 100% 50%; }
```

**Particle Float (15-22s):**
```css
0% {
  transform: translateY(100vh) scale(0);
  opacity: 0;
}
10% { opacity: 1; }
90% { opacity: 1; }
100% {
  transform: translateY(-100vh) scale(1);
  opacity: 0;
}
```

---

## Responsive Design

### Mobile Breakpoint (max-width: 640px)

**Layout Adjustments:**
- Reduced padding: 1.5rem
- Smaller 404 text: clamp minimum 6rem
- Smaller error icon: 60px
- Stacked button layout
- Full-width buttons with max-width: 300px
- Smaller background orb: 500-600px

**Typography:**
```css
/* Mobile */
.notFoundNumber { font-size: clamp(6rem, 18vw, 12rem); }
.heading { font-size: clamp(1.5rem, 4vw, 2rem); }
.description { font-size: clamp(0.875rem, 2vw, 1rem); }
```

---

## Accessibility

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .backgroundOrb,
  .particle,
  .notFoundNumber::after,
  .heading,
  .errorIcon {
    animation: none;
  }

  .buttonPrimary:hover,
  .buttonGhost:hover {
    transform: none;
  }
}
```

### Focus States

All interactive elements include visible focus states:
```css
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
```

---

## Usage Examples

### Testing 404 Page

Navigate to any non-existent route:
```
http://localhost:3000/this-page-does-not-exist
```

### Testing Error Boundary

Create a component that throws an error:
```tsx
'use client';

export default function BrokenPage() {
  throw new Error('Test error boundary');
  return <div>This won't render</div>;
}
```

### Testing Global Error

Cause a critical error in the root layout:
```tsx
// app/layout.tsx
export default function RootLayout() {
  throw new Error('Critical layout error');
  // ...
}
```

---

## Implementation Details

### Error Boundary Behavior

**Next.js Error Hierarchy:**
1. Component error → Nearest `error.tsx`
2. Layout error → Parent segment's `error.tsx`
3. Root layout error → `global-error.tsx`

**Reset Function:**
```tsx
// Attempts to re-render the error boundary
<button onClick={reset}>Try Again</button>
```

**Error Logging:**
```tsx
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error boundary caught:', error);
  }
}, [error]);
```

---

## Performance Considerations

### CSS Animations
- GPU-accelerated transforms (translateX, translateY, scale)
- Optimized gradients with background-size
- Will-change hints avoided (unnecessary for simple animations)

### Background Effects
- Absolute positioning prevents layout shifts
- Pointer-events: none for non-interactive elements
- Z-index layering for proper stacking

### Loading Performance
- CSS Modules for automatic code splitting
- Inline styles for global-error (no external CSS loading)
- Minimal JavaScript (only reset handler)

---

## Browser Support

**Minimum Requirements:**
- CSS Grid & Flexbox
- CSS Custom Properties
- CSS Animations
- Backdrop-filter (optional, progressive enhancement)
- Gradient text clipping (graceful degradation)

**Tested On:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Customization Guide

### Changing Colors

**Purple to Blue:**
```css
/* not-found.module.css */
.notFoundNumber {
  background: linear-gradient(
    135deg,
    #ffffff 0%,
    #e0f0ff 20%,
    #b8d8ff 40%,
    #5eb8e6 60%,
    #3b9cd1 80%,
    #2a7db1 100%
  );
}
```

**Error Orb Color:**
```css
/* error.module.css */
.backgroundOrb {
  background: radial-gradient(
    circle at center,
    rgba(230, 140, 92, 0.15) 0%,  /* Orange */
    rgba(255, 200, 154, 0.08) 30%,
    transparent 70%
  );
}
```

### Adjusting Animation Speed

```css
/* Slower, more subtle */
.backgroundOrb {
  animation: orbPulse 12s ease-in-out infinite;
}

/* Faster, more energetic */
.backgroundOrb {
  animation: orbPulse 4s ease-in-out infinite;
}
```

### Disabling Particles

```tsx
// not-found.tsx
// Comment out or remove:
{/* <div className={styles.floatingParticles}>
  <div className={styles.particle} />
  ...
</div> */}
```

---

## Best Practices

### Error Messages

**Development:**
- Show full error details
- Include stack traces
- Display error digests
- Log to console

**Production:**
- Sanitize error messages
- Show user-friendly text
- Hide technical details
- Track errors with digest

### User Experience

**Clear Actions:**
- Always provide "Go Home" option
- Offer "Try Again" for recoverable errors
- Use descriptive button labels
- Maintain visual hierarchy

**Progressive Enhancement:**
- Works without JavaScript
- Degrades gracefully
- Respects user preferences (reduced motion)
- Accessible to screen readers

---

## Troubleshooting

### Styles Not Applying

**Check CSS Module Import:**
```tsx
import styles from './not-found.module.css'; // Correct
import './not-found.module.css'; // Wrong
```

**Verify Class Names:**
```tsx
<div className={styles.container}> // Correct
<div className="container"> // Wrong (won't apply module styles)
```

### Animations Not Working

**Check Browser Support:**
```css
/* Add vendor prefixes if needed */
-webkit-animation: orbPulse 8s ease-in-out infinite;
animation: orbPulse 8s ease-in-out infinite;
```

**Verify Reduced Motion:**
```tsx
// Test in browser dev tools:
// Rendering → Emulate CSS media feature prefers-reduced-motion: reduce
```

### Global Error Not Showing

**Ensure HTML/Body Tags:**
```tsx
// global-error.tsx MUST include:
return (
  <html lang="en">
    <body>
      {/* content */}
    </body>
  </html>
);
```

---

## Future Enhancements

### Potential Additions

1. **Error Reporting Integration**
   - Sentry error tracking
   - Custom error logging service
   - User feedback form

2. **Enhanced Animations**
   - Parallax scrolling effects
   - Mouse-tracking gradients
   - 3D transforms on hover

3. **Additional Error Types**
   - 403 Forbidden
   - 500 Internal Server Error
   - 503 Service Unavailable
   - Offline mode page

4. **User Engagement**
   - Easter eggs in 404 page
   - Mini-games while error resolves
   - Animated illustrations
   - Humorous error messages

---

## Related Documentation

- **Design System:** `DESIGN_SYSTEM_COMPLETE.md`
- **Component Library:** `components/ui/README.md`
- **Layout Components:** `components/layout/README.md`
- **Accessibility:** `lib/accessibility/`

---

## Summary

All error pages now feature premium Euveka dark aesthetic:

- **Visual Excellence:** Gradient text, animated orbs, floating particles
- **User-Friendly:** Clear actions, helpful messages, intuitive navigation
- **Accessible:** Keyboard navigation, screen reader support, reduced motion
- **Responsive:** Mobile-optimized layouts, fluid typography
- **Performance:** Optimized animations, minimal JavaScript, fast loading

Error states are no longer an afterthought - they're a branded experience that maintains user confidence even when things go wrong.

---

**Created:** 2026-02-06
**Version:** 1.0
**Status:** Production Ready ✅
