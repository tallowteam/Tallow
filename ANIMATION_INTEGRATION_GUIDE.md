# Animation Integration Guide

## Quick Integration Steps

### Step 1: Replace Standard Components with Animated Versions

#### Device List

Replace the standard DeviceList with DeviceListAnimated:

```tsx
// Before
import { DeviceList } from '@/components/devices/device-list';

<DeviceList
  devices={devices}
  isLoading={isLoading}
  onDeviceSelect={handleSelect}
/>

// After
import { DeviceListAnimated } from '@/components/devices/device-list-animated';

<DeviceListAnimated
  devices={devices}
  isLoading={isLoading}
  onDeviceSelect={handleSelect}
/>
```

#### Transfer Queue

Replace TransferQueue with TransferQueueAnimated:

```tsx
// Before
import { TransferQueue } from '@/components/transfer/transfer-queue';

<TransferQueue
  transfers={transfers}
  onPause={handlePause}
/>

// After
import { TransferQueueAnimated } from '@/components/transfer/transfer-queue-animated';

<TransferQueueAnimated
  transfers={transfers}
  onPause={handlePause}
  isLoading={isLoading}
/>
```

### Step 2: Add Page Transitions

Wrap your page content with PageTransition:

```tsx
// app/app/page.tsx
import { PageTransition } from '@/lib/animations/page-transition';

export default function AppPage() {
  return (
    <PageTransition>
      <div className="container">
        {/* Your page content */}
      </div>
    </PageTransition>
  );
}
```

### Step 3: Replace Buttons with Animated Buttons

For buttons that need micro-interactions:

```tsx
// Before
import { Button } from '@/components/ui/button';

<Button onClick={handleClick}>
  Click Me
</Button>

// After
import { ButtonAnimated } from '@/components/ui/button-animated';

<ButtonAnimated onClick={handleClick} ripple>
  Click Me
</ButtonAnimated>
```

### Step 4: Add Loading States

Replace loading spinners with skeleton components:

```tsx
// Before
{isLoading ? (
  <Loader2 className="animate-spin" />
) : (
  <DeviceList devices={devices} />
)}

// After
import { DeviceListSkeleton } from '@/components/ui/skeleton';

{isLoading ? (
  <DeviceListSkeleton count={3} />
) : (
  <DeviceList devices={devices} />
)}
```

## Component Migration Map

### Priority 1: High-Impact Components

1. **Device List** → `DeviceListAnimated`
   - File: `components/devices/device-list-animated.tsx`
   - Benefits: Stagger animations, smooth loading states, animated interactions

2. **Transfer Queue** → `TransferQueueAnimated`
   - File: `components/transfer/transfer-queue-animated.tsx`
   - Benefits: Progress animations, status transitions, smooth updates

3. **Transfer Card** → `TransferCardAnimated`
   - File: `components/transfer/transfer-card-animated.tsx`
   - Benefits: Animated progress bars, status badges, hover effects

### Priority 2: UI Enhancement Components

4. **Buttons** → `ButtonAnimated`
   - File: `components/ui/button-animated.tsx`
   - Benefits: Ripple effects, hover/tap animations, accessibility

5. **Cards** → `AnimatedCard`
   - File: `lib/animations/animated-components.tsx`
   - Benefits: Hover lift effects, smooth transitions

### Priority 3: Layout Components

6. **Page Layouts** → `PageTransition`
   - File: `lib/animations/page-transition.tsx`
   - Benefits: Smooth page transitions, reduced motion support

7. **Lists** → `AnimatedList` + `AnimatedListItem`
   - File: `lib/animations/animated-components.tsx`
   - Benefits: Stagger animations, smooth item additions/removals

## Integration Examples

### Example 1: Main App Page

```tsx
// app/app/page.tsx
'use client';

import { PageTransition } from '@/lib/animations/page-transition';
import { DeviceListAnimated } from '@/components/devices/device-list-animated';
import { TransferQueueAnimated } from '@/components/transfer/transfer-queue-animated';
import { AnimatedContainer } from '@/lib/animations/animated-components';

export default function AppPage() {
  return (
    <PageTransition>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with fade-in animation */}
        <AnimatedContainer variant="fadeUp">
          <h1 className="text-3xl font-bold">File Transfer</h1>
        </AnimatedContainer>

        {/* Device selection with animations */}
        <AnimatedContainer variant="fadeUp" delay={0.1}>
          <DeviceListAnimated
            devices={devices}
            isLoading={isLoadingDevices}
            onDeviceSelect={handleDeviceSelect}
          />
        </AnimatedContainer>

        {/* Transfer queue with animations */}
        <AnimatedContainer variant="fadeUp" delay={0.2}>
          <TransferQueueAnimated
            transfers={transfers}
            isLoading={isLoadingTransfers}
            onPause={handlePause}
            onResume={handleResume}
          />
        </AnimatedContainer>
      </div>
    </PageTransition>
  );
}
```

### Example 2: Settings Page with Skeletons

```tsx
// app/app/settings/page.tsx
'use client';

import { PageTransition } from '@/lib/animations/page-transition';
import { SettingsSkeleton } from '@/components/ui/skeleton';
import { AnimatedList, AnimatedListItem } from '@/lib/animations/animated-components';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto p-6">
          <SettingsSkeleton />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <AnimatedList>
          {settings.map((setting) => (
            <AnimatedListItem key={setting.id}>
              <SettingCard setting={setting} />
            </AnimatedListItem>
          ))}
        </AnimatedList>
      </div>
    </PageTransition>
  );
}
```

### Example 3: Modal Dialog

```tsx
import { AnimatedModal } from '@/lib/animations/animated-components';
import { ButtonAnimated } from '@/components/ui/button-animated';

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <ButtonAnimated onClick={() => setShowDialog(true)} ripple>
        Open Dialog
      </ButtonAnimated>

      <AnimatedModal
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Confirm Action</h2>
          <p className="text-muted-foreground mb-6">
            Are you sure you want to proceed?
          </p>
          <div className="flex justify-end gap-2">
            <ButtonAnimated
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </ButtonAnimated>
            <ButtonAnimated onClick={handleConfirm}>
              Confirm
            </ButtonAnimated>
          </div>
        </div>
      </AnimatedModal>
    </>
  );
}
```

## Testing Checklist

After integration, verify:

- [ ] Animations run at 60fps on target devices
- [ ] Reduced motion preference is respected
- [ ] Loading states use skeletons instead of spinners
- [ ] Interactive elements have hover/tap feedback
- [ ] Page transitions are smooth
- [ ] No animation jank or stuttering
- [ ] Accessibility features work (keyboard navigation, screen readers)
- [ ] Performance metrics are acceptable

## Performance Monitoring

Use these tools to verify animation performance:

1. **Chrome DevTools Performance Tab**
   - Record during animations
   - Check for 60fps (16.67ms per frame)
   - Look for layout thrashing

2. **React DevTools Profiler**
   - Check component render times
   - Verify no unnecessary re-renders

3. **Lighthouse**
   - Run performance audit
   - Check for animation-related issues

## Common Gotchas

1. **AnimatePresence Required**: When conditionally rendering animated components, wrap with AnimatePresence
2. **Client Components**: Animated components must be client-side (`'use client'`)
3. **Key Props**: List items need stable keys for smooth animations
4. **Layout Animations**: Use sparingly as they can be expensive
5. **Will-Change**: Don't overuse, only for frequently animated elements

## Rollback Plan

If you encounter issues, you can easily rollback:

1. Keep old components alongside new ones
2. Use feature flags to toggle animations
3. Provide non-animated fallbacks for older browsers
4. Have skeleton-free versions ready

## Support and Resources

- Full documentation: `ANIMATIONS.md`
- Example showcase: `components/examples/animation-showcase.tsx`
- Motion config: `lib/animations/motion-config.ts`
- Skeleton components: `components/ui/skeleton.tsx`
