# Loading States & Skeleton Screens Guide

Complete guide to implementing loading states throughout the Tallow application.

## Table of Contents
- [Overview](#overview)
- [Components](#components)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Accessibility](#accessibility)

## Overview

Tallow provides a comprehensive set of loading state components including:
- **Spinners**: Multiple variants for different contexts
- **Skeletons**: Placeholder components that match the shape of content
- **Specialized Loading States**: Purpose-built for transfer operations

All components support:
- Multiple animation types
- Reduced motion preferences
- Dark/light theme adaptation
- Full TypeScript support

## Components

### Spinner

The main loading indicator component with multiple variants.

#### Variants
- `circular` (default): Classic spinning circle
- `dots`: Three animated dots
- `bars`: Animated vertical bars
- `pulse`: Pulsing ring effect
- `ring`: Double ring spinner

#### Sizes
`xs` | `sm` | `md` | `lg` | `xl`

#### Colors
- `primary`: Accent color (default)
- `secondary`: Secondary text color
- `white`: White color (for dark backgrounds)
- `current`: Inherits current color

#### Example
```tsx
import { Spinner } from '@/components/ui';

// Basic usage
<Spinner />

// With options
<Spinner
  size="lg"
  type="pulse"
  variant="primary"
  speed="fast"
/>

// Centered in container
<Spinner center />
```

### Skeleton

Placeholder component that mimics the shape of content being loaded.

#### Variants
- `default`: Basic rectangle
- `text`: Single or multiple text lines
- `circular`: Circle shape (for avatars)
- `rectangular`: Explicit rectangle

#### Animations
- `pulse` (default): Opacity pulsing
- `shimmer`: Horizontal shimmer effect
- `wave`: Wave animation with overlay
- `none`: No animation

#### Example
```tsx
import { Skeleton } from '@/components/ui';

// Single line
<Skeleton width="200px" height="20px" />

// Multiple text lines
<Skeleton variant="text" lines={3} spacing="md" />

// Avatar
<Skeleton variant="circular" width="48px" height="48px" />

// Different animations
<Skeleton animation="shimmer" width="100%" height="40px" />
```

### Compound Skeleton Components

Pre-built skeleton patterns for common UI elements.

#### SkeletonCard
```tsx
import { SkeletonCard } from '@/components/ui';

<SkeletonCard />
```

#### SkeletonList
```tsx
import { SkeletonList } from '@/components/ui';

<SkeletonList items={5} />
```

#### SkeletonTable
```tsx
import { SkeletonTable } from '@/components/ui';

<SkeletonTable rows={10} columns={4} />
```

#### SkeletonDeviceCard
```tsx
import { SkeletonDeviceCard } from '@/components/ui';

<SkeletonDeviceCard />
```

### Compound Spinner Components

#### SpinnerOverlay
Full-screen overlay with spinner and message.

```tsx
import { SpinnerOverlay } from '@/components/ui';

const [isLoading, setIsLoading] = useState(false);

<SpinnerOverlay
  visible={isLoading}
  label="Processing transfer..."
  blur={true}
/>
```

#### SpinnerInline
Inline spinner with optional text.

```tsx
import { SpinnerInline } from '@/components/ui';

<SpinnerInline text="Loading data..." />
```

#### SpinnerPage
Full-page loading state.

```tsx
import { SpinnerPage } from '@/components/ui';

<SpinnerPage message="Loading application..." />
```

## Transfer-Specific Loading States

### DeviceDiscoveryLoading
Shows skeleton screens while scanning for devices.

```tsx
import { DeviceDiscoveryLoading } from '@/components/transfer/LoadingStates';

<DeviceDiscoveryLoading count={3} />
```

### FileProcessingLoading
Displays file processing status with optional progress.

```tsx
import { FileProcessingLoading } from '@/components/transfer/LoadingStates';

<FileProcessingLoading
  fileName="document.pdf"
  progress={45}
/>
```

### TransferQueueLoading
Loading state for transfer queue.

```tsx
import { TransferQueueLoading } from '@/components/transfer/LoadingStates';

<TransferQueueLoading items={3} />
```

### TransferHistoryLoading
Loading state for transfer history.

```tsx
import { TransferHistoryLoading } from '@/components/transfer/LoadingStates';

<TransferHistoryLoading items={5} />
```

### RoomConnectLoading
Multi-step loading animation for room connections.

```tsx
import { RoomConnectLoading } from '@/components/transfer/LoadingStates';

<RoomConnectLoading message="Connecting to room..." />
```

### ScanningAnimation
Specialized scanning animation with pulsing rings.

```tsx
import { ScanningAnimation } from '@/components/transfer/LoadingStates';

<ScanningAnimation />
```

### UploadAnimation
Animated upload indicator.

```tsx
import { UploadAnimation } from '@/components/transfer/LoadingStates';

<UploadAnimation />
```

## Usage Examples

### Button with Loading State

```tsx
import { Button } from '@/components/ui';
import { useState } from 'react';

function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    await someAsyncOperation();
    setIsLoading(false);
  };

  return (
    <Button loading={isLoading} onClick={handleClick}>
      Send Files
    </Button>
  );
}
```

### Page with Loading State

```tsx
'use client';

import { useState, useEffect } from 'react';
import { SpinnerPage } from '@/components/ui';

export default function MyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then((data) => {
      setData(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <SpinnerPage message="Loading data..." />;
  }

  return <div>{/* Your content */}</div>;
}
```

### List with Skeleton

```tsx
import { SkeletonList } from '@/components/ui';

function DeviceList({ devices, isLoading }) {
  if (isLoading) {
    return <SkeletonList items={5} />;
  }

  return (
    <div>
      {devices.map(device => (
        <DeviceCard key={device.id} device={device} />
      ))}
    </div>
  );
}
```

### File Drop Zone with Loading

```tsx
import { FileDropZone } from '@/components/transfer/FileDropZone';
import { useState } from 'react';

function UploadArea() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = async (files) => {
    setIsProcessing(true);
    await processFiles(files);
    setIsProcessing(false);
  };

  return (
    <FileDropZone
      onFilesSelected={handleFiles}
      loading={isProcessing}
    />
  );
}
```

### Progressive Loading

```tsx
import { DeviceDiscoveryLoading } from '@/components/transfer/LoadingStates';

function DeviceDiscovery() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    startScanning();

    // Show skeleton for minimum time
    const timer = setTimeout(() => setIsInitialLoading(false), 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading && devices.length === 0) {
    return <DeviceDiscoveryLoading count={3} />;
  }

  return <div>{/* Device list */}</div>;
}
```

## Best Practices

### 1. Match Content Shape
Use skeleton screens that match the shape of the actual content:

```tsx
// Good: Matches the final layout
<SkeletonDeviceCard />

// Avoid: Generic loading that doesn't match
<Spinner center />
```

### 2. Minimum Display Time
Always show loading states for a minimum duration to avoid flashing:

```tsx
const MIN_LOADING_TIME = 500; // ms

useEffect(() => {
  const startTime = Date.now();

  fetchData().then(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);

    setTimeout(() => setIsLoading(false), remaining);
  });
}, []);
```

### 3. Progressive Enhancement
Show immediate feedback, then refine:

```tsx
// 1. Show skeleton immediately
<SkeletonList items={5} />

// 2. Replace with partial data as it arrives
{partialData.map(item => <Item key={item.id} {...item} />)}

// 3. Show complete state
{allData.map(item => <Item key={item.id} {...item} />)}
```

### 4. Use Appropriate Variants
Choose the right loading indicator for the context:

```tsx
// Button actions
<Button loading={isLoading}>Submit</Button>

// Inline data refresh
<SpinnerInline text="Refreshing..." />

// Full page load
<SpinnerPage message="Loading..." />

// Content sections
<Skeleton animation="shimmer" />
```

### 5. Provide Context
Always include meaningful loading messages:

```tsx
// Good
<SpinnerOverlay visible={true} label="Uploading files..." />

// Better
<FileProcessingLoading fileName="document.pdf" progress={45} />
```

## Accessibility

### ARIA Attributes
All loading components include proper ARIA attributes:

```tsx
// Spinner
<div role="status" aria-live="polite">
  <Spinner />
  <span className="sr-only">Loading...</span>
</div>

// Skeleton
<div aria-live="polite" aria-busy="true">
  <Skeleton />
</div>
```

### Screen Reader Text
Always provide screen reader text:

```tsx
<Spinner label="Loading devices..." />
```

### Reduced Motion
All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .spinner,
  .skeleton {
    animation: none;
  }
}
```

### Focus Management
Ensure focus is managed during loading states:

```tsx
// Disable interactive elements during loading
<Button disabled={isLoading} loading={isLoading}>
  Submit
</Button>

// Prevent interaction with overlay
<SpinnerOverlay visible={isLoading} />
```

## Animation Performance

### GPU Acceleration
Loading components use GPU-accelerated properties:

```css
/* Good: GPU accelerated */
transform: translateX(0);
opacity: 1;

/* Avoid: Not GPU accelerated */
left: 0;
margin-left: 0;
```

### Optimized Animations
Animations are optimized for performance:

```css
/* Use will-change sparingly */
.spinner {
  will-change: transform;
}

/* Disable during reduced motion */
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    will-change: auto;
  }
}
```

## Demo

View all loading states in action:

```tsx
import { LoadingStatesDemo } from '@/components/ui/LoadingStatesDemo';

<LoadingStatesDemo />
```

## File Locations

```
components/
├── ui/
│   ├── Spinner.tsx              # Main spinner component
│   ├── Spinner.module.css
│   ├── Skeleton.tsx             # Main skeleton component
│   ├── Skeleton.module.css
│   ├── LoadingStatesDemo.tsx    # Demo showcase
│   └── index.ts                 # Exports
└── transfer/
    ├── LoadingStates.tsx        # Transfer-specific loading states
    └── LoadingStates.module.css
```

## TypeScript Support

All components are fully typed:

```tsx
import type { SpinnerProps, SkeletonProps } from '@/components/ui';

const props: SpinnerProps = {
  size: 'lg',
  variant: 'primary',
  type: 'circular',
  speed: 'normal',
};
```

## CSS Custom Properties

Loading states use design tokens from `globals.css`:

```css
var(--color-accent)           /* Spinner color */
var(--color-surface)          /* Skeleton background */
var(--duration-1000)          /* Animation duration */
var(--ease-in-out)           /* Animation timing */
```

## Browser Support

Loading states work in all modern browsers with graceful degradation:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

Fallbacks are provided for older browsers:
- CSS animations degrade gracefully
- backdrop-filter has fallback backgrounds
- Transforms use vendor prefixes where needed
