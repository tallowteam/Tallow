# TransferCelebration - Quick Reference

## Import

```tsx
import { TransferCelebration } from '@/components/transfer';
```

## Basic Usage

```tsx
<TransferCelebration
  show={true}
  fileName="photo.jpg"
  onDismiss={() => console.log('Dismissed')}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `show` | `boolean` | Show/hide celebration |
| `fileName` | `string` | File name to display |
| `onDismiss` | `() => void` | Called after 3s auto-dismiss |

## Animation Timeline

```
0ms     ▸ Overlay fades in
0-600ms ▸ Checkmark bounces and draws
0-800ms ▸ Confetti particles burst
400ms   ▸ Success message fades in
3000ms  ▸ Auto-dismiss starts
3300ms  ▸ Animation complete
```

## Customization

### Change Auto-Dismiss Time

Edit `TransferCelebration.tsx`:

```tsx
setTimeout(() => {
  setIsVisible(false);
  setTimeout(onDismiss, 300);
}, 3000); // ← Change this value
```

### Modify Particle Count

Edit `TransferCelebration.tsx`:

```tsx
{[...Array(12)].map((_, i) => ( // ← Change 12
  <div className={styles.particle} />
))}
```

### Custom Colors

Edit `TransferCelebration.module.css`:

```css
.checkmarkCircle,
.checkmarkCheck {
  stroke: var(--success-500); /* Change this */
}
```

## Accessibility

- ✅ ARIA live region announces completion
- ✅ Respects `prefers-reduced-motion`
- ✅ Keyboard accessible (ESC dismisses via parent)
- ✅ Screen reader friendly

## Mobile Support

Auto-responsive:
- 640px+: Full size (120px checkmark)
- <640px: Compact (100px checkmark, smaller particles)

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome/Edge | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Mobile | ✅ Full |

## Common Issues

**Celebration doesn't show:**
- Check `show={true}` is set
- Verify component is in DOM
- Check z-index conflicts (uses 9999)

**Particles don't animate:**
- Browser must support CSS `cos()` and `sin()`
- Check if reduced motion is enabled
- Verify CSS variables are set

**Auto-dismiss fails:**
- Ensure `onDismiss` callback exists
- Check console for useEffect errors

## Files

- `TransferCelebration.tsx` - Component logic
- `TransferCelebration.module.css` - Styles & animations
- `CELEBRATION_README.md` - Full documentation
- `TransferProgress.tsx` - Integration example

## Related

- `TransferProgress` - Shows progress with celebration
- `AnimatedSection` - Scroll animations
- `Toast` - Notification system
