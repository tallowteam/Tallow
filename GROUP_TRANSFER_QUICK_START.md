# Group Transfer Quick Start Guide

Quick reference for using the enhanced group transfer components in Tallow.

## Basic Setup (5 minutes)

### 1. Install Dependencies

The enhanced components use:
- ✅ `framer-motion` (already in project)
- ✅ `@radix-ui` components (already in project)
- ✅ `lucide-react` icons (already in project)

No new dependencies needed!

---

## Complete Example

### Step 1: Import Components

```tsx
import { RecipientSelector } from '@/components/app/RecipientSelector';
import { GroupTransferProgress } from '@/components/app/GroupTransferProgress';
import { GroupTransferConfirmDialog } from '@/components/app/GroupTransferConfirmDialog';
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';
import { Device } from '@/lib/types';
```

### Step 2: Set Up State

```tsx
function GroupTransferDemo() {
  // Device management
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

  // Dialog states
  const [showSelector, setShowSelector] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // File to transfer
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Group transfer hook
  const {
    initializeGroupTransfer,
    sendToAll,
    cancel,
    reset,
    isInitializing,
    isTransferring,
    groupState,
    completedCount,
    failedCount,
  } = useGroupTransfer({
    bandwidthLimitPerRecipient: 1024 * 1024, // 1 MB/s per recipient
    onRecipientComplete: (id, name) => {
      console.log(`✅ Completed: ${name}`);
    },
    onRecipientError: (id, name, error) => {
      console.error(`❌ Failed: ${name} - ${error}`);
    },
    onComplete: (result) => {
      console.log('Transfer complete:', result);
      setShowProgress(false);
    },
  });

  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

### Step 3: Add UI Components

```tsx
return (
  <div className="p-6 space-y-4">
    {/* Trigger button */}
    <Button onClick={() => setShowSelector(true)}>
      Send to Multiple Devices
    </Button>

    {/* Step 1: Select Recipients */}
    <RecipientSelector
      open={showSelector}
      onOpenChange={setShowSelector}
      availableDevices={availableDevices}
      selectedDeviceIds={selectedDeviceIds}
      onSelectionChange={setSelectedDeviceIds}
      onConfirm={() => {
        setShowSelector(false);
        setShowConfirm(true);
      }}
      minRecipients={1}
      maxRecipients={10}
    />

    {/* Step 2: Confirm Transfer */}
    <GroupTransferConfirmDialog
      open={showConfirm}
      onOpenChange={setShowConfirm}
      files={selectedFile ? [selectedFile] : []}
      recipients={availableDevices.filter(d =>
        selectedDeviceIds.includes(d.id)
      )}
      onConfirm={async () => {
        setShowConfirm(false);
        setShowProgress(true);

        // Initialize and send
        await initializeGroupTransfer(
          crypto.randomUUID(),
          selectedFile!.name,
          selectedFile!.size,
          // ... prepare recipients
        );

        await sendToAll(selectedFile!);
      }}
      onCancel={() => {
        setShowConfirm(false);
        reset();
      }}
    />

    {/* Step 3: Show Progress */}
    {groupState && (
      <GroupTransferProgress
        open={showProgress}
        onOpenChange={setShowProgress}
        groupState={groupState}
        onRecipientNameLookup={(id) => {
          const device = availableDevices.find(d => d.id === id);
          return device?.name || id;
        }}
      />
    )}
  </div>
);
```

---

## Keyboard Shortcuts

### RecipientSelector

| Shortcut | Action |
|----------|--------|
| `Ctrl+A` / `Cmd+A` | Select all devices |
| `Escape` | Clear selection or close |
| `Arrow Up/Down` | Navigate device list |
| `Enter` / `Space` | Toggle selection |
| `Tab` | Navigate UI elements |

### GroupTransferProgress

| Shortcut | Action |
|----------|--------|
| `Escape` | Close dialog |
| `Tab` | Navigate through recipients |

---

## Toast Notifications

All toasts are automatic! The hook handles:

### Initialization
- ⏳ Loading: "Initializing group transfer..."
- ✅ Success: "Group transfer initialized"
- ❌ Error: "Failed to initialize group transfer"

### Per-Recipient
- ✅ Success: "Transfer completed - Successfully sent to [Name]"
- ❌ Error: "Transfer failed - Failed to send to [Name]"

### Completion
- ✅ All succeeded: "Group transfer completed successfully!"
- ⚠️ Partial: "Group transfer partially completed"
- ❌ All failed: "Group transfer failed"

### Cancellation
- ℹ️ Info: "Group transfer cancelled"

No manual toast calls needed!

---

## Customization

### Colors

Change avatar colors in `RecipientSelector.tsx`:

```tsx
const colors = [
  'bg-blue-500',    // Your brand color
  'bg-green-500',   // Success color
  'bg-purple-500',  // Alternative 1
  'bg-orange-500',  // Alternative 2
  'bg-pink-500',    // Alternative 3
  'bg-teal-500',    // Alternative 4
];
```

### Animation Speed

Change animation duration in components:

```tsx
// Faster animations
transition={{ duration: 0.2 }}

// Slower animations
transition={{ duration: 0.5 }}

// Spring animations
transition={{ type: 'spring', stiffness: 300, damping: 25 }}
```

### Bandwidth Limits

Set per-recipient bandwidth limit:

```tsx
useGroupTransfer({
  bandwidthLimitPerRecipient: 1024 * 1024 * 2, // 2 MB/s
})
```

### Max Recipients

Limit how many recipients can be selected:

```tsx
<RecipientSelector
  maxRecipients={20}  // Up to 20 recipients
  minRecipients={2}   // At least 2 required
/>
```

---

## Accessibility Features

### Automatic
- ✅ ARIA labels on all icons
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus indicators
- ✅ Status announcements

### Custom ARIA

Add custom labels:

```tsx
<RecipientSelector
  title="Select Team Members"
  description="Choose who will receive this file"
/>
```

---

## Mobile Optimizations

### Automatic
- ✅ 44x44px minimum touch targets
- ✅ Responsive layouts
- ✅ Smooth scrolling
- ✅ Text truncation
- ✅ Button stacking on narrow screens

### Swipe Gestures (Future)

```tsx
import { useSwipeToDismiss } from '@/lib/hooks/use-swipe-gestures';

const { dismissProps } = useSwipeToDismiss(() => {
  removeRecipient(id);
}, 'left');

<div {...dismissProps}>
  <Badge>Swipe me left to remove</Badge>
</div>
```

---

## Performance Tips

### 1. Memoize Device List

```tsx
const availableDevices = useMemo(() =>
  devices.filter(d => d.isOnline),
  [devices]
);
```

### 2. Debounce Search (Optional)

```tsx
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);
```

### 3. Virtualize Long Lists (Future)

For 100+ devices, consider react-window:

```tsx
import { FixedSizeList } from 'react-window';
```

---

## Troubleshooting

### Issue: Animations are janky

**Solution**: Check for:
- Large images causing layout shifts
- Too many simultaneous animations
- Missing `will-change` optimization

```tsx
// Add to slow elements
style={{ willChange: 'transform' }}
```

### Issue: Toasts not appearing

**Solution**: Ensure Toaster is in root layout:

```tsx
// app/layout.tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

### Issue: State not updating

**Solution**: Check polling interval is running:

```tsx
// Hook polls every 200ms during transfer
// Make sure isTransferring is true
console.log(isTransferring); // Should be true
```

### Issue: Keyboard shortcuts not working

**Solution**: Ensure dialog is open and has focus:

```tsx
// Auto-focus is built in, but you can force it:
useEffect(() => {
  if (open) {
    searchInputRef.current?.focus();
  }
}, [open]);
```

---

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipientSelector } from './RecipientSelector';

test('selects device on click', () => {
  const mockDevices = [
    { id: '1', name: 'iPhone', platform: 'ios', isOnline: true, isFavorite: false },
  ];

  const mockOnChange = jest.fn();

  render(
    <RecipientSelector
      open={true}
      onOpenChange={() => {}}
      availableDevices={mockDevices}
      selectedDeviceIds={[]}
      onSelectionChange={mockOnChange}
      onConfirm={() => {}}
    />
  );

  const device = screen.getByText('iPhone');
  fireEvent.click(device);

  expect(mockOnChange).toHaveBeenCalledWith(['1']);
});
```

### E2E Tests

```tsx
import { test, expect } from '@playwright/test';

test('complete group transfer flow', async ({ page }) => {
  await page.goto('/');

  // Open selector
  await page.click('text=Send to Multiple Devices');

  // Select 2 devices
  await page.click('text=iPhone');
  await page.click('text=MacBook');

  // Continue
  await page.click('text=Continue with 2 recipients');

  // Confirm
  await page.click('text=Start Transfer');

  // Check progress appears
  await expect(page.locator('text=Group Transfer in Progress')).toBeVisible();
});
```

---

## API Reference

### RecipientSelector Props

```typescript
interface RecipientSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableDevices: Device[];
  selectedDeviceIds: string[];
  onSelectionChange: (deviceIds: string[]) => void;
  onConfirm: () => void;
  minRecipients?: number;      // Default: 1
  maxRecipients?: number;      // Default: 10
  title?: string;              // Default: "Select Recipients"
  description?: string;        // Default: "Choose devices to send files to"
}
```

### GroupTransferProgress Props

```typescript
interface GroupTransferProgressProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupState: GroupTransferState;
  onRecipientNameLookup?: (recipientId: string) => string;
}
```

### useGroupTransfer Hook

```typescript
function useGroupTransfer(options?: {
  bandwidthLimitPerRecipient?: number;
  onRecipientComplete?: (id: string, name: string) => void;
  onRecipientError?: (id: string, name: string, error: string) => void;
  onComplete?: (result: GroupTransferResult) => void;
}): {
  // State
  isInitializing: boolean;
  isTransferring: boolean;
  isCompleted: boolean;
  groupState: GroupTransferState | null;
  result: GroupTransferResult | null;
  error: string | null;
  completedCount: number;
  failedCount: number;

  // Actions
  initializeGroupTransfer: (
    transferId: string,
    fileName: string,
    fileSize: number,
    recipients: Array<{ info: RecipientInfo; dataChannel: RTCDataChannel }>
  ) => Promise<void>;
  sendToAll: (file: File) => Promise<GroupTransferResult>;
  cancel: () => void;
  reset: () => void;

  // Utilities
  getRecipientName: (recipientId: string) => string;
}
```

---

## Next Steps

1. ✅ Copy the enhanced components into your project
2. ✅ Test with sample devices
3. ✅ Customize colors and animations
4. ✅ Add your own business logic
5. ✅ Test on mobile devices
6. ✅ Run accessibility tests
7. ✅ Deploy and monitor

---

## Support

For issues or questions:
- Check `GROUP_TRANSFER_UX_ENHANCEMENTS.md` for detailed docs
- Review component source code comments
- Test with sample data first
- Check console for errors

## Related Files

- `components/app/RecipientSelector.tsx` - Recipient selection UI
- `components/app/GroupTransferProgress.tsx` - Progress visualization
- `components/app/GroupTransferConfirmDialog.tsx` - Transfer confirmation
- `lib/hooks/use-group-transfer.ts` - Transfer state management
- `lib/transfer/group-transfer-manager.ts` - Core transfer logic
- `lib/utils/toast.tsx` - Toast notification system
- `lib/animations/motion-config.ts` - Animation presets
