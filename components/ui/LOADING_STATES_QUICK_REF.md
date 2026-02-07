# Loading States Quick Reference

## Import Statements

```tsx
// UI Components
import {
  Spinner,
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonDeviceCard,
  SpinnerOverlay,
  SpinnerInline,
} from '@/components/ui';

// Transfer Loading States
import {
  DeviceDiscoveryLoading,
  FileProcessingLoading,
  TransferQueueLoading,
  RoomConnectLoading,
  ScanningAnimation,
} from '@/components/transfer/LoadingStates';
```

## Common Patterns

### Button Loading
```tsx
<Button loading={isLoading} onClick={handleClick}>
  Submit
</Button>
```

### Page Loading
```tsx
if (isLoading) return <SpinnerPage message="Loading..." />;
```

### List Loading
```tsx
{isLoading ? <SkeletonList items={5} /> : <DataList items={data} />}
```

### Inline Loading
```tsx
<SpinnerInline text="Refreshing..." />
```

### File Upload
```tsx
<FileDropZone loading={isProcessing} onFilesSelected={handleFiles} />
```

### Device Discovery
```tsx
{isScanning && devices.length === 0 && <DeviceDiscoveryLoading count={3} />}
```

## Spinner Types

```tsx
<Spinner type="circular" />  // Default spinning circle
<Spinner type="dots" />      // Three dots
<Spinner type="bars" />      // Vertical bars
<Spinner type="pulse" />     // Pulsing ring
<Spinner type="ring" />      // Double ring
```

## Skeleton Variants

```tsx
<Skeleton width="200px" height="20px" />                    // Basic
<Skeleton variant="text" lines={3} />                       // Text
<Skeleton variant="circular" width="48px" height="48px" />  // Avatar
<Skeleton animation="shimmer" />                            // With shimmer
```

## Transfer States

```tsx
// Scanning for devices
<DeviceDiscoveryLoading count={3} />

// Processing files
<FileProcessingLoading fileName="file.pdf" progress={45} />

// Connecting to room
<RoomConnectLoading message="Connecting..." />

// Transfer queue
<TransferQueueLoading items={3} />
```

## Accessibility

```tsx
// Always provide labels
<Spinner label="Loading data..." />

// Use aria-busy
<div aria-busy={isLoading}>
  {isLoading ? <Skeleton /> : <Content />}
</div>

// Screen reader only text
<span className="sr-only">Loading...</span>
```

## Best Practices

1. **Minimum Display Time**: Show loaders for at least 500ms
2. **Match Content Shape**: Use skeletons that match final layout
3. **Provide Context**: Always include meaningful messages
4. **Respect Reduced Motion**: All components auto-adapt
5. **Progressive Loading**: Show skeleton → partial → complete

## File Locations

- `components/ui/Spinner.tsx` - Main spinner component
- `components/ui/Skeleton.tsx` - Skeleton components
- `components/transfer/LoadingStates.tsx` - Transfer-specific states
- `components/ui/LoadingStatesDemo.tsx` - Live demo

## See Also

- Full Guide: `LOADING_STATES_GUIDE.md`
- Demo: Import and render `<LoadingStatesDemo />`
- Example: `components/transfer/TransferPageExample.tsx`
