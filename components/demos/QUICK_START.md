# Transfer Speed Demo - Quick Start Guide

## 5-Minute Integration

### Step 1: Import the Component

```tsx
import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';
```

### Step 2: Add to Your Page

```tsx
export default function MyPage() {
  return (
    <div className="container mx-auto p-8">
      <TransferSpeedDemo />
    </div>
  );
}
```

### Step 3: View It!

Navigate to your page and click "Start" to see the demo in action.

---

## Common Use Cases

### Use Case 1: Landing Page Demo

```tsx
// app/page.tsx or landing page
import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';

export default function LandingPage() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4">
          See P2P Transfer in Action
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Experience the speed and privacy of direct peer-to-peer file transfer
        </p>
        <TransferSpeedDemo />
      </div>
    </section>
  );
}
```

### Use Case 2: Modal/Dialog Demo

```tsx
import { useState } from 'react';
import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';
import { Button } from '@/components/ui/button';

export function DemoButton() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      <Button onClick={() => setShowDemo(true)}>
        Try Interactive Demo
      </Button>

      {showDemo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Transfer Demo</h2>
                <Button variant="ghost" onClick={() => setShowDemo(false)}>
                  Close
                </Button>
              </div>
              <TransferSpeedDemo />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### Use Case 3: Documentation Page

```tsx
import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';

export default function DocsPage() {
  return (
    <article className="prose dark:prose-invert max-w-4xl mx-auto p-8">
      <h1>Understanding P2P Transfer</h1>

      <p>
        Tallow uses WebRTC DataChannels for direct peer-to-peer file transfer.
        Files are split into 64KB chunks for efficient transmission.
      </p>

      <h2>Interactive Demo</h2>
      <div className="not-prose my-8">
        <TransferSpeedDemo />
      </div>

      <h2>How It Works</h2>
      <p>
        The demo above simulates a 50MB file transfer with realistic network
        conditions. Watch the speed graph and chunk indicators to understand
        the transfer process.
      </p>
    </article>
  );
}
```

### Use Case 4: Feature Comparison

```tsx
import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';

export function ComparisonSection() {
  return (
    <div className="grid lg:grid-cols-2 gap-8 p-8">
      {/* Traditional Method */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold">Traditional Upload</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>✗ Upload to server first</li>
          <li>✗ Then download from server</li>
          <li>✗ Slower speeds (server bottleneck)</li>
          <li>✗ Files stored on third-party servers</li>
          <li>✗ Additional costs for storage</li>
        </ul>
      </div>

      {/* P2P Method */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold">Tallow P2P Transfer</h3>
        <TransferSpeedDemo />
      </div>
    </div>
  );
}
```

---

## Customization Quick Reference

### Change File Size

```tsx
// In transfer-speed-demo.tsx, line 23
const FILE_SIZE = 100 * 1024 * 1024; // 100MB
```

### Change Transfer Speed

```tsx
// In transfer-speed-demo.tsx, line 26
const MAX_SPEED = 20 * 1024 * 1024; // 20 MB/s
```

### More Graph Points

```tsx
// In transfer-speed-demo.tsx, line 25
const GRAPH_POINTS = 100; // Smoother graph
```

---

## Styling Tips

### Add Custom Wrapper Styling

```tsx
<div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8 rounded-3xl">
  <TransferSpeedDemo />
</div>
```

### Center on Page

```tsx
<div className="min-h-screen flex items-center justify-center p-4">
  <TransferSpeedDemo />
</div>
```

### Full Width Container

```tsx
<div className="w-full max-w-6xl mx-auto">
  <TransferSpeedDemo />
</div>
```

---

## Troubleshooting

### Issue: Component not rendering

**Solution**: Ensure you're using it in a Client Component

```tsx
'use client'; // Add this at the top of your file

import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';
```

### Issue: Animations not smooth

**Solution**: Check if `framer-motion` is installed

```bash
npm install framer-motion
```

### Issue: Styles look broken

**Solution**: Ensure Tailwind CSS is configured correctly and all UI components exist

---

## Next Steps

1. **Try the demo**: Navigate to `/transfer-demo`
2. **Read full docs**: See `components/demos/README.md`
3. **View examples**: Check `components/demos/transfer-speed-demo-examples.tsx`
4. **Customize**: Modify constants to fit your needs

---

## Quick Copy-Paste Templates

### Template 1: Simple Demo Page

```tsx
'use client';

import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Transfer Demo</h1>
          <p className="text-muted-foreground">
            See P2P file transfer in action
          </p>
        </div>
        <TransferSpeedDemo />
      </div>
    </div>
  );
}
```

### Template 2: Marketing Section

```tsx
'use client';

import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';

export function MarketingDemo() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Lightning-Fast P2P Transfer
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the speed and privacy of direct peer-to-peer connections
          </p>
        </div>
        <TransferSpeedDemo />
      </div>
    </section>
  );
}
```

### Template 3: With Description Below

```tsx
'use client';

import { TransferSpeedDemo } from '@/components/demos/transfer-speed-demo';

export function DemoWithInfo() {
  return (
    <div className="space-y-8">
      <TransferSpeedDemo />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-muted/30">
          <h3 className="font-bold mb-2">64KB Chunks</h3>
          <p className="text-sm text-muted-foreground">
            Files split into optimal chunks for WebRTC DataChannels
          </p>
        </div>
        <div className="p-6 rounded-xl bg-muted/30">
          <h3 className="font-bold mb-2">Real-time Metrics</h3>
          <p className="text-sm text-muted-foreground">
            Monitor speed, progress, and network conditions live
          </p>
        </div>
        <div className="p-6 rounded-xl bg-muted/30">
          <h3 className="font-bold mb-2">Adaptive Speed</h3>
          <p className="text-sm text-muted-foreground">
            Automatically adjusts to network quality
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## File Locations

- **Main Component**: `C:\Users\aamir\Documents\Apps\Tallow\components\demos\transfer-speed-demo.tsx`
- **Demo Page**: `C:\Users\aamir\Documents\Apps\Tallow\app\transfer-demo\page.tsx`
- **Documentation**: `C:\Users\aamir\Documents\Apps\Tallow\components\demos\README.md`
- **Examples**: `C:\Users\aamir\Documents\Apps\Tallow\components\demos\transfer-speed-demo-examples.tsx`

---

## Support

For more information:
- Check the full README: `components/demos/README.md`
- View implementation summary: `TRANSFER_SPEED_DEMO_SUMMARY.md`
- Explore integration examples: `components/demos/transfer-speed-demo-examples.tsx`
