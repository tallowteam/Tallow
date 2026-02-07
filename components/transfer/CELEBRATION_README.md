# TransferCelebration Component

A delightful celebration animation that displays when a file transfer completes successfully. Features a bouncing checkmark, confetti burst, and success message with auto-dismiss functionality.

## Features

- **Animated Checkmark**: Scales up with bounce effect and draws in SVG stroke animation
- **Confetti Particles**: 12 colored particles burst outward in a radial pattern
- **Success Message**: Fades in with file name display
- **Auto-dismiss**: Automatically closes after 3 seconds
- **Accessibility**: Proper ARIA labels, screen reader announcements, and keyboard support
- **Responsive**: Works seamlessly on mobile and desktop
- **Reduced Motion**: Respects `prefers-reduced-motion` - shows simplified animation without particles
- **Pure CSS**: No JavaScript animation libraries required

## Installation

The component is already integrated into `TransferProgress.tsx` and will automatically display when a transfer reaches 100%.

## Usage

### Basic Usage

```tsx
import { TransferCelebration } from '@/components/transfer';

function MyComponent() {
  const [show, setShow] = useState(false);

  return (
    <TransferCelebration
      show={show}
      fileName="vacation-photos.zip"
      onDismiss={() => setShow(false)}
    />
  );
}
```

### Integration with Transfer State

```tsx
import { TransferCelebration } from '@/components/transfer';
import { useTransferStore } from '@/lib/stores/transfer-store';

function TransferUI() {
  const { currentTransfer, progress } = useTransferStore();
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (progress >= 100 && currentTransfer.isTransferring) {
      setShowCelebration(true);
    }
  }, [progress, currentTransfer.isTransferring]);

  return (
    <>
      {/* Your transfer UI */}
      <TransferCelebration
        show={showCelebration}
        fileName={currentTransfer.fileName}
        onDismiss={() => setShowCelebration(false)}
      />
    </>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `show` | `boolean` | Yes | Controls visibility of the celebration overlay |
| `fileName` | `string` | Yes | Name of the transferred file to display |
| `onDismiss` | `() => void` | Yes | Callback triggered when celebration auto-dismisses after 3 seconds |

## Animation Sequence

The celebration follows this timeline:

1. **0ms - 200ms**: Checkmark circle scales from 0 to 1
2. **200ms - 600ms**: Checkmark stroke draws in
3. **0ms - 600ms**: Checkmark bounces (scale 0 → 1.1 → 1)
4. **0ms - 800ms**: Confetti particles burst outward and fade
5. **400ms - 900ms**: Success message fades in from below
6. **3000ms**: Auto-dismiss triggered, 300ms fade out

Total duration: 3.3 seconds (including exit animation)

## Customization

### Colors

The celebration uses CSS custom properties from the design system:

- Checkmark: `--success-500` (green)
- Particles: Cycles through `--accent`, `--success-500`, `--accent-light`, `--primary-400`
- Background: `rgba(0, 0, 0, 0.7)` with `backdrop-filter: blur(4px)`

To customize colors, override these CSS variables:

```css
.overlay {
  --success-500: #your-color;
  --accent: #your-accent-color;
}
```

### Timing

To adjust animation duration, modify the keyframes in `TransferCelebration.module.css`:

```css
/* Checkmark bounce duration */
.checkmarkWrapper {
  animation: checkmark-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* Confetti burst duration */
.particle {
  animation: particle-burst 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

/* Auto-dismiss timing in TransferCelebration.tsx */
const timer = setTimeout(() => {
  setIsVisible(false);
  setTimeout(onDismiss, 300);
}, 3000); // Change this value
```

### Particle Count

To change the number of confetti particles, modify the array length in `TransferCelebration.tsx`:

```tsx
{[...Array(12)].map((_, i) => ( // Change 12 to your desired count
  <div className={styles.particle} /* ... */ />
))}
```

## Accessibility

### Screen Reader Support

- Uses `role="status"` for status updates
- `aria-live="polite"` announces completion without interrupting
- `aria-atomic="true"` ensures entire message is read
- Decorative elements marked with `aria-hidden="true"`

### Keyboard Support

- Overlay can be dismissed by clicking anywhere (handled by React state)
- No keyboard trap - focus is not captured
- Respects user motion preferences

### Reduced Motion

Users who prefer reduced motion will see:
- Simple fade-in checkmark (no bounce)
- No confetti particles
- Simple fade-in text (no slide)
- Faster animations (300ms vs 600-800ms)

## Mobile Responsiveness

On screens below 640px:

- Container width: 400px → 320px
- Checkmark size: 120px → 100px
- Title font size: 24px → 20px
- File name font size: 14px → 12px
- Particle burst radius: 100px → 60px
- Particle size: 8px → 6px

## Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (requires `-webkit-backdrop-filter`)
- **Mobile browsers**: Full support

## Performance

- Pure CSS animations (GPU accelerated)
- No JavaScript animation loops
- Minimal DOM elements (15 particles + 4 text/SVG elements)
- Auto cleanup via React useEffect

## Examples

See `TransferCelebration.example.tsx` for comprehensive usage examples including:

1. Basic usage
2. Multiple file transfers
3. Integration with transfer state
4. Testing and development
5. Accessibility testing

## Technical Details

### CSS Animations

The component uses several CSS animation techniques:

1. **Scale bounce**: `cubic-bezier(0.34, 1.56, 0.64, 1)` for overshoot effect
2. **Stroke dash animation**: `stroke-dasharray` and `stroke-dashoffset` for drawing effect
3. **Trigonometric positioning**: `calc()` with `cos()` and `sin()` for radial particle burst
4. **CSS variables**: Dynamic particle angles and colors via inline styles

### React State Management

- `show` prop controls initial visibility
- Internal `isVisible` state handles exit animation
- `useEffect` manages auto-dismiss timer
- Cleanup prevents memory leaks on unmount

## Troubleshooting

### Celebration doesn't appear

- Check that `show` prop is `true`
- Verify component is mounted in the DOM
- Check z-index conflicts (component uses `z-index: 9999`)

### Particles don't burst

- Check browser support for `cos()` and `sin()` in CSS
- Verify `--particle-angle` CSS variable is being set
- Check if `prefers-reduced-motion` is enabled (particles are hidden)

### Animation is choppy

- Enable hardware acceleration: `will-change: transform`
- Check CPU usage - other heavy processes may affect performance
- Verify GPU acceleration is enabled in browser settings

### Auto-dismiss not working

- Verify `onDismiss` callback is provided and functional
- Check console for errors in useEffect
- Ensure component isn't being unmounted prematurely

## Related Components

- `TransferProgress` - Displays transfer progress with integrated celebration
- `TransferQueue` - Shows queued transfers
- `TransferHistory` - Displays completed transfers
- `AnimatedSection` - Provides scroll-triggered animations

## Credits

Design inspiration from:
- Linear app success animations
- Vercel deployment success feedback
- Stripe payment confirmation animations

Built with:
- React 18+ (Client Components)
- CSS Modules
- Pure CSS animations (no external libraries)
- TypeScript for type safety
