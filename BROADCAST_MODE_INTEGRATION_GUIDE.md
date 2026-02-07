# Broadcast Mode Integration Guide

## Quick Start

### 1. Basic Integration (DeviceDiscovery Component)

The simplest way to use broadcast mode is through the existing `DeviceDiscovery` component, which now includes a "Send to All" button:

```tsx
import { DeviceDiscovery } from '@/components/transfer/DeviceDiscovery';
import { useState } from 'react';
import type { Device } from '@/lib/types';

function MyTransferPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  return (
    <DeviceDiscovery
      selectedFiles={selectedFiles}
      onDeviceSelect={(device) => {
        console.log('Single device selected:', device);
      }}
      onBroadcastStart={() => {
        console.log('Broadcasting to all devices!');
      }}
    />
  );
}
```

**That's it!** The broadcast button will automatically appear when:
- 2 or more devices are discovered (excluding self)
- Files are selected

### 2. Custom Broadcast Implementation

For advanced use cases, use the `broadcast-transfer` module directly:

```tsx
import { createBroadcastTransfer } from '@/lib/transfer/broadcast-transfer';

async function customBroadcast(file: File) {
  const broadcast = createBroadcastTransfer({
    onRecipientProgress: (recipientId, progress, speed) => {
      console.log(`Device ${recipientId}: ${progress}%`);
    },
    onComplete: (result) => {
      console.log('Broadcast complete!', result);
    },
  });

  try {
    await broadcast.start(file);
  } finally {
    broadcast.destroy(); // Always cleanup!
  }
}
```

## Real-World Examples

### Example 1: Toast Notifications on Broadcast

```tsx
'use client';

import { useState } from 'react';
import { DeviceDiscovery } from '@/components/transfer/DeviceDiscovery';
import { useToast } from '@/components/ui/ToastProvider';

export default function TransferPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { showToast } = useToast();

  const handleBroadcastStart = () => {
    showToast({
      title: 'Broadcasting',
      message: 'Sending file to all devices...',
      variant: 'info',
      duration: 3000,
    });
  };

  return (
    <DeviceDiscovery
      selectedFiles={selectedFiles}
      onDeviceSelect={(device) => {
        console.log('Selected:', device);
      }}
      onBroadcastStart={handleBroadcastStart}
    />
  );
}
```

### Example 2: Progress Tracking with State

```tsx
'use client';

import { useState } from 'react';
import { createBroadcastTransfer } from '@/lib/transfer/broadcast-transfer';
import type { BroadcastTransferStatus } from '@/lib/transfer/broadcast-transfer';

function BroadcastDemo() {
  const [status, setStatus] = useState<BroadcastTransferStatus | null>(null);

  const handleBroadcast = async (file: File) => {
    const broadcast = createBroadcastTransfer({
      onOverallProgress: (progress) => {
        setStatus((prev) => {
          if (!prev) return null;
          return { ...prev, totalProgress: progress };
        });
      },
      onComplete: (result) => {
        console.log('Broadcast complete!');
        console.log(`Success: ${result.successfulRecipients.length}`);
        console.log(`Failed: ${result.failedRecipients.length}`);
      },
    });

    try {
      const result = await broadcast.start(file);
      setStatus(broadcast.getStatus());
    } finally {
      broadcast.destroy();
    }
  };

  return (
    <div>
      {status && (
        <div>
          <p>Progress: {status.totalProgress}%</p>
          <p>Success: {status.successCount}</p>
          <p>Failed: {status.failureCount}</p>
          <p>Pending: {status.pendingCount}</p>
        </div>
      )}
    </div>
  );
}
```

### Example 3: Bandwidth-Limited Broadcast

```tsx
import { createBroadcastTransfer } from '@/lib/transfer/broadcast-transfer';

async function slowBroadcast(file: File) {
  const broadcast = createBroadcastTransfer({
    // Limit each recipient to 1 MB/s
    bandwidthLimitPerRecipient: 1024 * 1024,

    onRecipientProgress: (recipientId, progress, speed) => {
      const speedMBps = (speed / 1024 / 1024).toFixed(2);
      console.log(`${recipientId}: ${progress}% at ${speedMBps} MB/s`);
    },
  });

  try {
    await broadcast.start(file);
  } finally {
    broadcast.destroy();
  }
}
```

### Example 4: Error Handling with Recovery

```tsx
import { createBroadcastTransfer } from '@/lib/transfer/broadcast-transfer';
import { useToast } from '@/components/ui/ToastProvider';

function BroadcastWithRecovery() {
  const { showToast } = useToast();

  const handleBroadcast = async (file: File) => {
    const broadcast = createBroadcastTransfer({
      onRecipientError: (recipientId, error) => {
        showToast({
          title: 'Transfer Failed',
          message: `Failed to send to ${recipientId}: ${error.message}`,
          variant: 'error',
        });
      },

      onRecipientComplete: (recipientId) => {
        showToast({
          title: 'Transfer Complete',
          message: `Successfully sent to ${recipientId}`,
          variant: 'success',
        });
      },

      onComplete: (result) => {
        const { successfulRecipients, failedRecipients } = result;

        if (failedRecipients.length === 0) {
          showToast({
            title: 'Broadcast Complete',
            message: `Sent to all ${successfulRecipients.length} devices`,
            variant: 'success',
          });
        } else {
          showToast({
            title: 'Broadcast Partially Complete',
            message: `Success: ${successfulRecipients.length}, Failed: ${failedRecipients.length}`,
            variant: 'warning',
          });
        }
      },
    });

    try {
      await broadcast.start(file);
    } catch (error) {
      showToast({
        title: 'Broadcast Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      broadcast.destroy();
    }
  };

  return (
    <button onClick={() => handleBroadcast(myFile)}>
      Broadcast File
    </button>
  );
}
```

### Example 5: Selective Broadcasting (Exclude Devices)

```tsx
import { createBroadcastTransfer } from '@/lib/transfer/broadcast-transfer';

async function selectiveBroadcast(file: File, excludeIds: string[]) {
  const broadcast = createBroadcastTransfer({
    // Don't send to these devices
    excludeDeviceIds: excludeIds,

    // Don't include self
    includeSelf: false,

    onComplete: (result) => {
      console.log('Excluded:', result.devicesExcluded);
      console.log('Included:', result.devicesIncluded);
    },
  });

  try {
    await broadcast.start(file);
  } finally {
    broadcast.destroy();
  }
}

// Usage
selectiveBroadcast(myFile, ['device-1', 'device-2']);
```

### Example 6: Pre-Broadcast Validation

```tsx
import {
  isBroadcastAvailable,
  getBroadcastDeviceCount,
  createBroadcastTransfer,
} from '@/lib/transfer/broadcast-transfer';

async function smartBroadcast(file: File) {
  // Check if broadcast is possible
  if (!isBroadcastAvailable()) {
    console.log('Not enough devices for broadcast');
    return;
  }

  // Get device count
  const deviceCount = getBroadcastDeviceCount();
  console.log(`Broadcasting to ${deviceCount} devices`);

  // Confirm with user
  const confirmed = window.confirm(
    `Send "${file.name}" to all ${deviceCount} devices?`
  );

  if (!confirmed) {
    return;
  }

  // Start broadcast
  const broadcast = createBroadcastTransfer();
  try {
    await broadcast.start(file);
  } finally {
    broadcast.destroy();
  }
}
```

### Example 7: Integration with Transfer Store

```tsx
'use client';

import { createBroadcastTransfer } from '@/lib/transfer/broadcast-transfer';
import { useTransferStore } from '@/lib/stores/transfer-store';

function BroadcastIntegrated() {
  const { addTransfer, updateTransfer } = useTransferStore();

  const handleBroadcast = async (file: File) => {
    const broadcast = createBroadcastTransfer({
      onRecipientProgress: (recipientId, progress, speed) => {
        // Update transfer store
        updateTransfer(recipientId, {
          progress,
          speed,
          status: 'transferring',
        });
      },

      onRecipientComplete: (recipientId) => {
        updateTransfer(recipientId, {
          progress: 100,
          status: 'completed',
        });
      },

      onRecipientError: (recipientId, error) => {
        updateTransfer(recipientId, {
          status: 'failed',
          error: error.message,
        });
      },
    });

    // Add initial transfers to store
    const state = useDeviceStore.getState();
    const devices = state.devices.filter((d) => d.isOnline && d.id !== 'this-device');

    devices.forEach((device) => {
      addTransfer({
        id: device.id,
        fileName: file.name,
        fileSize: file.size,
        recipientId: device.id,
        status: 'pending',
        progress: 0,
      });
    });

    try {
      await broadcast.start(file);
    } finally {
      broadcast.destroy();
    }
  };

  return <button onClick={() => handleBroadcast(myFile)}>Start Broadcast</button>;
}
```

## Helper Functions

### Check Broadcast Availability

```tsx
import { isBroadcastAvailable } from '@/lib/transfer/broadcast-transfer';

function BroadcastButton({ file }: { file: File }) {
  const canBroadcast = isBroadcastAvailable();

  return (
    <button disabled={!canBroadcast}>
      {canBroadcast ? 'Send to All' : 'Not Enough Devices'}
    </button>
  );
}
```

### Get Device Count

```tsx
import { getBroadcastDeviceCount } from '@/lib/transfer/broadcast-transfer';

function DeviceCounter() {
  const count = getBroadcastDeviceCount();

  return <p>{count} devices available for broadcast</p>;
}
```

### One-Shot Broadcast

```tsx
import { broadcastFile } from '@/lib/transfer/broadcast-transfer';

// Convenience function for one-off broadcasts
async function quickBroadcast(file: File) {
  const result = await broadcastFile(file, {
    onComplete: (result) => {
      console.log('Done!', result);
    },
  });

  console.log(result);
}
```

## TypeScript Types

### BroadcastTransferOptions

```typescript
interface BroadcastTransferOptions {
  bandwidthLimitPerRecipient?: number;
  excludeDeviceIds?: string[];
  includeSelf?: boolean;
  onRecipientProgress?: (recipientId: string, progress: number, speed: number) => void;
  onRecipientComplete?: (recipientId: string) => void;
  onRecipientError?: (recipientId: string, error: Error) => void;
  onOverallProgress?: (progress: number) => void;
  onComplete?: (result: BroadcastTransferResult) => void;
}
```

### BroadcastTransferResult

```typescript
interface BroadcastTransferResult {
  broadcastId: string;
  fileName: string;
  totalRecipients: number;
  successfulRecipients: string[];
  failedRecipients: Array<{ id: string; error: AppError }>;
  totalTime: number;
  totalDevicesDiscovered: number;
  devicesIncluded: number;
  devicesExcluded: number;
}
```

### BroadcastTransferStatus

```typescript
interface BroadcastTransferStatus {
  broadcastId: string;
  fileName: string;
  fileSize: number;
  totalDevices: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
  totalProgress: number;
  status: 'preparing' | 'transferring' | 'completed' | 'partial' | 'failed' | 'cancelled';
}
```

## Common Patterns

### Pattern 1: Start → Monitor → Cleanup

```tsx
const broadcast = createBroadcastTransfer({ /* options */ });
try {
  await broadcast.start(file);
} finally {
  broadcast.destroy(); // Always cleanup
}
```

### Pattern 2: Check → Confirm → Broadcast

```tsx
if (!isBroadcastAvailable()) {
  alert('Need at least 2 devices');
  return;
}

const count = getBroadcastDeviceCount();
const confirmed = confirm(`Send to ${count} devices?`);

if (confirmed) {
  await broadcastFile(file);
}
```

### Pattern 3: Progress → Status → Result

```tsx
const broadcast = createBroadcastTransfer({
  onOverallProgress: (progress) => {
    setProgress(progress);
  },
  onComplete: (result) => {
    setResult(result);
  },
});

await broadcast.start(file);
const status = broadcast.getStatus();
console.log(status);
```

## Best Practices

### ✅ DO

1. **Always cleanup resources**
   ```tsx
   try {
     await broadcast.start(file);
   } finally {
     broadcast.destroy(); // CRITICAL
   }
   ```

2. **Use getState() in non-reactive contexts**
   ```tsx
   const state = useDeviceStore.getState(); // ✅ Correct
   const devices = state.devices;
   ```

3. **Handle errors gracefully**
   ```tsx
   onRecipientError: (id, error) => {
     console.error(`Failed: ${id}`, error);
   }
   ```

4. **Provide user feedback**
   ```tsx
   onComplete: (result) => {
     showToast('Broadcast complete!');
   }
   ```

### ❌ DON'T

1. **Don't use hook subscriptions in plain functions**
   ```tsx
   const { devices } = useDeviceStore(); // ❌ Wrong in plain function
   ```

2. **Don't forget cleanup**
   ```tsx
   await broadcast.start(file);
   // ❌ Missing broadcast.destroy()
   ```

3. **Don't ignore errors**
   ```tsx
   await broadcast.start(file); // ❌ No try/catch
   ```

4. **Don't assume success**
   ```tsx
   const result = await broadcast.start(file);
   // ❌ Check result.failedRecipients.length
   ```

## Troubleshooting

### Issue: Button doesn't appear

**Solution:** Check that:
- At least 2 devices are online (excluding self)
- Files are selected
- Devices are in `devices` array

```tsx
const state = useDeviceStore.getState();
const onlineCount = state.devices.filter(d => d.isOnline && d.id !== 'this-device').length;
console.log('Online devices:', onlineCount);
```

### Issue: Broadcast fails immediately

**Solution:** Check device store state:
```tsx
const state = useDeviceStore.getState();
console.log('Devices:', state.devices);
console.log('Online devices:', state.devices.filter(d => d.isOnline));
```

### Issue: Some transfers fail

**Solution:** Use error callbacks to debug:
```tsx
createBroadcastTransfer({
  onRecipientError: (id, error) => {
    console.error(`Device ${id} failed:`, error);
  },
  onComplete: (result) => {
    console.log('Failed recipients:', result.failedRecipients);
  },
});
```

### Issue: Turbopack infinite loop

**Solution:** Use `.getState()` instead of hook subscription:
```tsx
// ❌ Wrong
const { devices } = useDeviceStore();

// ✅ Correct
const state = useDeviceStore.getState();
const devices = state.devices;
```

## Next Steps

1. **Test the basic integration** - Add `onBroadcastStart` to your `DeviceDiscovery`
2. **Add toast notifications** - Provide user feedback during broadcast
3. **Monitor progress** - Track broadcast status and show progress
4. **Handle errors** - Implement error recovery and retry logic
5. **Optimize bandwidth** - Set appropriate limits for your use case

## Support

For issues or questions:
- Check the main documentation: `BROADCAST_MODE_IMPLEMENTATION.md`
- Review examples above
- Check TypeScript types for API details
- Test with `getBroadcastDeviceCount()` to verify device state

## Summary

Broadcast mode is production-ready and integrates seamlessly with existing Tallow architecture:

- **Simple**: Works out-of-the-box with `DeviceDiscovery`
- **Flexible**: Advanced API for custom implementations
- **Secure**: PQC encryption for each recipient
- **Performant**: Parallel transfers with bandwidth management
- **Accessible**: WCAG 2.1 AA compliant UI
- **Robust**: Graceful error handling and partial success

Start with the basic integration and expand as needed!
