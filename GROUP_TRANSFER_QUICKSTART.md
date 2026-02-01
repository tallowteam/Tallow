# Group Transfer Quick Start Guide

Get group file transfers working in your Tallow app in under 30 minutes.

## 5-Minute Overview

Group transfer lets users send files to multiple recipients simultaneously with independent post-quantum encryption for each connection.

**What you get:**
- Send files to up to 10 recipients at once
- Real-time progress for each recipient
- Graceful handling when some recipients fail
- Bandwidth management to prevent overload
- Beautiful UI with accessibility support

## Prerequisites

- Tallow app already running
- WebRTC connections working
- TypeScript/React knowledge

## Installation (Already Done!)

All files are already created. You just need to integrate them.

### Files Created

```
lib/
  transfer/
    group-transfer-manager.ts       ← Core logic
  hooks/
    use-group-transfer.ts            ← React hook
  types.ts                           ← Updated types

components/
  app/
    RecipientSelector.tsx            ← Select recipients UI
    GroupTransferProgress.tsx        ← Progress tracking UI
    GroupTransferConfirmDialog.tsx   ← Confirmation UI
    GroupTransferExample.tsx         ← Complete example
  ui/
    checkbox.tsx                     ← UI component (new)
```

## Quick Integration (15 Minutes)

### Step 1: Import the Hook (2 minutes)

```tsx
// app/app/page.tsx
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';
import { RecipientSelector } from '@/components/app/RecipientSelector';
import { GroupTransferProgress } from '@/components/app/GroupTransferProgress';
import { GroupTransferConfirmDialog } from '@/components/app/GroupTransferConfirmDialog';
```

### Step 2: Add State (3 minutes)

```tsx
export default function AppPage() {
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    isTransferring,
    groupState,
    initializeGroupTransfer,
    sendToAll,
  } = useGroupTransfer({
    bandwidthLimitPerRecipient: 1024 * 1024, // 1 MB/s
  });

  // Your existing device state
  const devices = [...]; // Your existing devices array
}
```

### Step 3: Add UI Button (2 minutes)

```tsx
<Button onClick={() => {
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowRecipientSelector(true);
    }
  };
  input.click();
}}>
  <Users className="w-4 h-4 mr-2" />
  Send to Multiple Recipients
</Button>
```

### Step 4: Add Dialogs (5 minutes)

```tsx
{/* Recipient Selection */}
<RecipientSelector
  open={showRecipientSelector}
  onOpenChange={setShowRecipientSelector}
  availableDevices={devices}
  selectedDeviceIds={selectedDeviceIds}
  onSelectionChange={setSelectedDeviceIds}
  onConfirm={() => {
    setShowRecipientSelector(false);
    setShowConfirmDialog(true);
  }}
/>

{/* Confirmation */}
<GroupTransferConfirmDialog
  open={showConfirmDialog}
  onOpenChange={setShowConfirmDialog}
  files={selectedFile ? [selectedFile] : []}
  recipients={devices.filter(d => selectedDeviceIds.includes(d.id))}
  onConfirm={async () => {
    // Start transfer (see Step 5)
  }}
/>

{/* Progress */}
{groupState && (
  <GroupTransferProgress
    open={isTransferring}
    onOpenChange={() => {}}
    groupState={groupState}
  />
)}
```

### Step 5: Implement Transfer Logic (3 minutes)

```tsx
const handleStartTransfer = async () => {
  if (!selectedFile) return;

  // Get selected recipients
  const recipients = devices.filter(d => selectedDeviceIds.includes(d.id));

  // Create data channels (use your existing WebRTC setup)
  const recipientsWithChannels = await Promise.all(
    recipients.map(async (device) => {
      const dataChannel = await createDataChannelForDevice(device.id);
      return {
        info: {
          id: device.id,
          name: device.name,
          deviceId: device.id,
        },
        dataChannel,
      };
    })
  );

  // Initialize group transfer
  await initializeGroupTransfer(
    generateUUID(),
    selectedFile.name,
    selectedFile.size,
    recipientsWithChannels
  );

  // Send file
  await sendToAll(selectedFile);
};
```

## WebRTC Setup

The key is implementing `createDataChannelForDevice()`:

```tsx
const createDataChannelForDevice = async (deviceId: string): Promise<RTCDataChannel> => {
  // Get or create peer connection for this device
  const peerConnection = await getPeerConnection(deviceId);

  // Create data channel
  const channel = peerConnection.createDataChannel('file-transfer', {
    ordered: true,
  });

  // Wait for channel to open
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);

    channel.onopen = () => {
      clearTimeout(timeout);
      resolve();
    };

    channel.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Channel error'));
    };
  });

  return channel;
};
```

## Testing (5 Minutes)

### Quick Test

1. **Start your app**
   ```bash
   npm run dev
   ```

2. **Click "Send to Multiple Recipients"**

3. **Select a file**

4. **Select 2-3 recipients**

5. **Click "Continue" and "Start Transfer"**

6. **Watch progress dialog** - should show:
   - Overall progress
   - Per-recipient progress
   - Speed and ETA
   - Success/failure status

### Expected Behavior

✅ Recipients selected correctly
✅ Confirmation shows file details
✅ Transfer starts immediately
✅ Progress updates in real-time
✅ Completion notification shown
✅ Files received by all recipients

### Common Issues

**Issue**: "Data channel not ready"
- **Fix**: Ensure WebRTC connections established first

**Issue**: "Key exchange timeout"
- **Fix**: Check network connectivity, TURN servers

**Issue**: All transfers fail
- **Fix**: Verify data channels are open before initializing

## Examples to Copy

### Minimal Example

```tsx
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';

function MinimalGroupTransfer() {
  const { initializeGroupTransfer, sendToAll } = useGroupTransfer();

  const handleSend = async (file: File, deviceIds: string[]) => {
    const channels = await createChannels(deviceIds);
    await initializeGroupTransfer('id', file.name, file.size, channels);
    await sendToAll(file);
  };

  return <button onClick={() => handleSend(file, devices)}>Send</button>;
}
```

### Full Example

See `components/app/GroupTransferExample.tsx` for complete implementation with all features.

## Configuration

### Bandwidth Limits

```tsx
useGroupTransfer({
  bandwidthLimitPerRecipient: 500 * 1024, // 500 KB/s per recipient
})
```

### Max Recipients

```tsx
<RecipientSelector
  maxRecipients={5} // Limit to 5 recipients
/>
```

### Callbacks

```tsx
useGroupTransfer({
  onRecipientComplete: (id, name) => {
    console.log(`Transfer to ${name} completed`);
  },
  onRecipientError: (id, name, error) => {
    console.error(`Transfer to ${name} failed: ${error}`);
  },
  onComplete: (result) => {
    console.log(`${result.successfulRecipients.length} succeeded`);
  },
})
```

## Next Steps

### After Basic Integration

1. **Add keyboard shortcuts**
   - Ctrl/Cmd + Shift + G for group send

2. **Add settings**
   - Max recipients
   - Default bandwidth limit
   - Auto-retry option

3. **Add analytics**
   - Track usage
   - Monitor success rates
   - Identify issues

4. **Improve UX**
   - Remember last selected recipients
   - Show transfer history
   - Add retry for failed transfers

### Advanced Features

- **Resume transfers**: Handle network interruptions
- **Folder support**: Send entire folders
- **Recipient groups**: Save/load recipient sets
- **Scheduling**: Queue multiple transfers

## Need Help?

### Documentation

- **Full Guide**: `GROUP_TRANSFER_GUIDE.md`
- **API Reference**: Inline JSDoc in source files
- **Architecture**: `GROUP_TRANSFER_ARCHITECTURE.md`
- **Integration**: `INTEGRATION_EXAMPLE.md`

### Examples

- **Complete Example**: `components/app/GroupTransferExample.tsx`
- **Unit Tests**: `tests/unit/transfer/group-transfer-manager.test.ts`

### Debugging

Enable debug logging:
```tsx
import secureLog from '@/lib/utils/secure-logger';
secureLog.setLevel('debug');
```

### Common Questions

**Q: Can I send multiple files?**
A: Currently one file at a time. Multi-file support is planned.

**Q: What's the max file size?**
A: 4GB (inherited from PQCTransferManager)

**Q: How many recipients maximum?**
A: Recommend 10, but configurable. More recipients = more network usage.

**Q: What if some recipients fail?**
A: Transfer continues for successful recipients. Failed ones are clearly marked.

**Q: Is it secure?**
A: Yes! Each recipient has independent ML-KEM-768 + X25519 encryption.

## Success Checklist

- [ ] Imports working
- [ ] UI button added
- [ ] Recipient selection working
- [ ] File selection working
- [ ] Transfer starts successfully
- [ ] Progress shows correctly
- [ ] Completion notification works
- [ ] Files received by all recipients

## Congratulations!

You now have group file transfers working in your app! 🎉

For more advanced usage, see the full documentation in `GROUP_TRANSFER_GUIDE.md`.
