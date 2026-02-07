# TransferRateGraph Component

A real-time transfer rate visualization component using pure SVG line charts.

## Features

- Pure SVG implementation (no external dependencies)
- Shows last 30 seconds of transfer speed
- Auto-scaling Y-axis based on max speed
- Smooth line chart with gradient fill
- Current speed displayed as text overlay
- Compact size (200px x 80px) optimized for transfer UI
- Fully accessible with ARIA labels
- Responsive and mobile-friendly
- Dark mode optimized with CSS variables

## Installation

The component is already integrated into `TransferProgress.tsx` and tracks speed history automatically.

## Props

```typescript
interface TransferRateGraphProps {
  /** Array of speed samples in bytes per second - last 30 samples */
  speeds: number[];

  /** Current transfer speed in bytes per second */
  currentSpeed: number;
}
```

## Usage

### Basic Usage

```tsx
import { TransferRateGraph } from '@/components/transfer';

function MyComponent() {
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const currentSpeed = 5242880; // 5 MB/s in bytes

  return (
    <TransferRateGraph
      speeds={speedHistory}
      currentSpeed={currentSpeed}
    />
  );
}
```

### Tracking Speed History

```tsx
import { useState, useEffect } from 'react';
import { TransferRateGraph } from '@/components/transfer';

function TransferComponent() {
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  useEffect(() => {
    // Update speed every second
    const interval = setInterval(() => {
      const speed = getTransferSpeed(); // Your speed source
      setCurrentSpeed(speed);

      setSpeedHistory(prev => {
        const updated = [...prev, speed];
        // Keep only last 30 samples (30 seconds)
        return updated.slice(-30);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TransferRateGraph
      speeds={speedHistory}
      currentSpeed={currentSpeed}
    />
  );
}
```

### Integration with TransferProgress

The component is automatically integrated into `TransferProgress.tsx`:

```tsx
export function TransferProgress() {
  // ... component logic

  return (
    <div className={styles.container}>
      {/* File info and progress bar */}

      {/* Transfer Rate Graph - shown when speed data is available */}
      {speedHistory.length > 0 && (
        <TransferRateGraph speeds={speedHistory} currentSpeed={currentSpeed} />
      )}
    </div>
  );
}
```

## Styling

The component uses CSS Modules with design tokens from `globals.css`:

### CSS Variables Used

```css
/* Colors */
--accent              /* Line color */
--accent-light        /* Hover state */
--accent-subtle       /* Line glow effect */
--bg-surface          /* Background */
--border-subtle       /* Border and grid lines */
--text-primary        /* Text color */
--text-secondary      /* Label color */
--text-tertiary       /* Grid labels */

/* Spacing */
--space-2, --space-3  /* Padding and gaps */

/* Typography */
--font-size-xs        /* Labels */
--font-size-sm        /* Current speed */
--font-mono           /* Speed display */
--font-weight-medium  /* Label weight */
--font-weight-semibold /* Speed weight */

/* Border Radius */
--radius-md           /* Container corners */

/* Transitions */
--transition-fast     /* Hover effects */
```

### Customization

Override styles by targeting CSS module classes:

```css
/* Custom styles */
.container {
  max-width: 300px; /* Wider graph */
}

.line {
  stroke: var(--success-500); /* Green line */
}

.currentSpeed {
  font-size: var(--font-size-base); /* Larger text */
}
```

## Accessibility

- Semantic SVG with `role="img"`
- ARIA label describing current transfer rate
- Grid lines for visual reference
- Reduced motion support (disables animations)
- Screen reader friendly speed formatting

## Performance

- Efficient SVG rendering (no canvas)
- Memoized calculations with `useMemo`
- Minimal re-renders
- 30-sample limit prevents memory growth
- Auto-cleanup on unmount

## Speed Formatting

Speeds are automatically formatted for readability:

- `< 0.1 MB/s`: Shows in KB/s (e.g., "512.5 KB/s")
- `>= 0.1 MB/s`: Shows in MB/s (e.g., "5.3 MB/s")

## Empty State

When no speed data is available:

```tsx
<div className={styles.emptyState}>
  <span className={styles.emptyText}>Waiting for transfer data...</span>
</div>
```

## Graph Features

### Auto-scaling Y-axis

The Y-axis automatically scales based on the maximum speed in the dataset with 20% headroom:

```typescript
const maxSpeed = Math.ceil(max * 1.2); // Add 20% headroom
```

### Grid Lines

Three horizontal grid lines show speed reference points:
- 100% (max)
- 50% (middle)
- 0% (baseline)

### Gradient Fill

Area below the line uses a gradient from accent color to transparent:

```svg
<linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
  <stop offset="0%" className={styles.gradientStart} />
  <stop offset="100%" className={styles.gradientEnd} />
</linearGradient>
```

### Current Point Indicator

A pulsing circle marks the current speed on the line:

```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.2); }
}
```

## Browser Support

- All modern browsers with SVG support
- IE11+ (with polyfills for Array methods)
- Mobile Safari, Chrome, Firefox

## Related Components

- `TransferProgress` - Main transfer UI with progress bar
- `TransferHistory` - Historical transfer records
- `TransferQueue` - Pending transfers list

## Examples

### High-speed Transfer

```tsx
// Simulating 50 MB/s transfer
const speeds = Array.from({ length: 30 }, (_, i) =>
  50 * 1024 * 1024 + Math.random() * 5 * 1024 * 1024
);

<TransferRateGraph
  speeds={speeds}
  currentSpeed={52428800} // 50 MB/s
/>
```

### Varying Speed

```tsx
// Simulating fluctuating connection
const speeds = Array.from({ length: 30 }, (_, i) => {
  const base = 10 * 1024 * 1024; // 10 MB/s base
  const variation = Math.sin(i / 5) * 5 * 1024 * 1024;
  return base + variation;
});

<TransferRateGraph
  speeds={speeds}
  currentSpeed={speeds[speeds.length - 1]}
/>
```

## Testing

```tsx
import { render, screen } from '@testing-library/react';
import { TransferRateGraph } from './TransferRateGraph';

test('renders empty state when no speeds', () => {
  render(<TransferRateGraph speeds={[]} currentSpeed={0} />);
  expect(screen.getByText(/waiting for transfer data/i)).toBeInTheDocument();
});

test('renders graph with speed data', () => {
  const speeds = [1024 * 1024, 2 * 1024 * 1024, 3 * 1024 * 1024];
  render(<TransferRateGraph speeds={speeds} currentSpeed={speeds[2]} />);

  const graph = screen.getByRole('img');
  expect(graph).toHaveAttribute('aria-label', expect.stringContaining('3.0 MB/s'));
});
```

## Troubleshooting

### Graph not showing

- Ensure `speeds` array has at least 1 sample
- Check that `currentSpeed` is a valid number
- Verify CSS modules are loaded correctly

### Speed values incorrect

- Speeds should be in bytes per second
- Convert MB/s: `mbps * 1024 * 1024`
- Convert KB/s: `kbps * 1024`

### Performance issues

- Limit speed history to 30 samples
- Use `useMemo` for expensive calculations
- Avoid re-creating speed array on every render

## License

Part of the Tallow file transfer application.
