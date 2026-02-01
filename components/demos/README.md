# Transfer Speed Demo Component

A visually engaging React component that demonstrates P2P file transfer with chunking, real-time metrics, and animated visualizations.

## Features

- **Simulated File Transfer**: Mock 50MB file transfer with realistic behavior
- **Real-time Speed Graph**: SVG-based speed visualization with 50 data points
- **Transfer Metrics**: Speed (MB/s), Progress (%), ETA, Chunks sent/total
- **Chunking Visualization**: Shows 64KB chunks being transmitted
- **Playback Controls**: Start, Pause, and Reset buttons
- **Network Simulation**: Dynamically changes between network quality levels (excellent, good, fair, poor)
- **WebRTC Stats**: Display DataChannel statistics (buffer, RTT, packet loss)
- **Smooth Animations**: Powered by Framer Motion
- **Theme-aware**: Adapts to light/dark themes
- **Fully Responsive**: Mobile-friendly design

## Usage

### Basic Usage

```tsx
import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';

export default function DemoPage() {
  return (
    <div className="p-8">
      <TransferSpeedDemo />
    </div>
  );
}
```

### In a Dialog/Modal

```tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';

export function TransferDemoModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View Transfer Demo</Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>File Transfer Demo</DialogTitle>
        </DialogHeader>
        <TransferSpeedDemo />
      </DialogContent>
    </Dialog>
  );
}
```

### As Part of Onboarding

```tsx
import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';

export function OnboardingStep() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">See How Fast P2P Transfer Is</h2>
        <p className="text-muted-foreground">
          Experience the speed of direct peer-to-peer file transfer
        </p>
      </div>

      <TransferSpeedDemo />

      <div className="flex justify-end">
        <Button onClick={() => nextStep()}>Continue</Button>
      </div>
    </div>
  );
}
```

### Embedded in Documentation

```tsx
import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';

export function DocumentationPage() {
  return (
    <article className="prose dark:prose-invert max-w-none">
      <h1>Understanding P2P File Transfer</h1>

      <p>
        Tallow uses WebRTC DataChannels for direct peer-to-peer file transfer.
        Files are split into chunks for efficient transmission.
      </p>

      <div className="not-prose my-8">
        <TransferSpeedDemo />
      </div>

      <h2>How Chunking Works</h2>
      <p>
        Files are divided into 64KB chunks, each transmitted independently...
      </p>
    </article>
  );
}
```

## Component Details

### Transfer Simulation

The component simulates realistic file transfer with:

- **File Size**: 50MB (configurable in code)
- **Chunk Size**: 64KB (standard for WebRTC DataChannels)
- **Update Interval**: 100ms (smooth real-time updates)
- **Max Speed**: 15 MB/s theoretical maximum
- **Network Quality**: Randomly fluctuates between excellent/good/fair/poor

### Visual Elements

1. **Progress Bar**: Animated progress indicator with percentage
2. **Speed Graph**: Real-time line graph showing transfer speed over time
3. **Metrics Cards**: Display current speed, ETA, chunks, and network quality
4. **Chunk Indicators**: Show last 10 chunks with status (pending/sending/sent)
5. **WebRTC Stats Panel**: Display DataChannel statistics

### Metrics Displayed

| Metric | Description |
|--------|-------------|
| Speed | Current transfer speed in MB/s or KB/s |
| ETA | Estimated time remaining (seconds/minutes/hours) |
| Progress | Percentage and bytes transferred/total |
| Chunks | Number of 64KB chunks sent vs total |
| Network | Current network quality simulation |
| Buffered Amount | Simulated WebRTC buffer size |
| Channel State | DataChannel connection state |
| Packets Sent | Total chunks transmitted |
| Packet Loss | Simulated packet loss percentage |
| RTT | Round-trip time in milliseconds |

### Animations

The component uses Framer Motion for:

- Progress bar smooth transitions
- Chunk indicator entry/exit animations
- Completion celebration animation
- Pulsing "Live" indicator
- Rotating loading spinner on sending chunks

## Customization

### Adjust File Size

```tsx
// In transfer-speed-demo.tsx
const FILE_SIZE = 100 * 1024 * 1024; // 100MB instead of 50MB
```

### Change Chunk Size

```tsx
// In transfer-speed-demo.tsx
const CHUNK_SIZE = 128 * 1024; // 128KB instead of 64KB
```

### Modify Speed Limits

```tsx
// In transfer-speed-demo.tsx
const MAX_SPEED = 20 * 1024 * 1024; // 20 MB/s max speed
```

### Adjust Graph Points

```tsx
// In transfer-speed-demo.tsx
const GRAPH_POINTS = 100; // Show more data points on graph
```

## Accessibility

- Keyboard navigation support via Button components
- ARIA labels on interactive elements
- Color-blind friendly status indicators
- Motion-safe considerations (respects prefers-reduced-motion)

## Performance

- Uses `requestAnimationFrame` for smooth 60fps animations
- Efficient state updates with minimal re-renders
- SVG-based graph for lightweight rendering
- Cleanup on unmount to prevent memory leaks

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14.3+)
- All browsers with Framer Motion support

## Dependencies

- `framer-motion`: Smooth animations
- `lucide-react`: Icons
- `@/components/ui/button`: Button component
- `@/components/ui/card`: Card layout
- `@/components/ui/progress`: Progress bar
- `@/lib/utils`: Utility functions (cn)

## Educational Value

This component is perfect for:

- Demonstrating P2P transfer concepts to users
- Showing the benefits of chunked file transfer
- Explaining WebRTC DataChannel capabilities
- Onboarding new users to the platform
- Marketing materials and landing pages
- Technical documentation and blog posts
- Developer tutorials

## Future Enhancements

Potential improvements:

- [ ] Export transfer metrics as JSON
- [ ] Add pause/resume with chunk tracking
- [ ] Multiple concurrent file simulation
- [ ] User-adjustable file size slider
- [ ] Network condition selector
- [ ] Real WebRTC connection integration
- [ ] Transfer history log
- [ ] Screenshot/share functionality

## License

Part of the Tallow project. See project root for license information.
