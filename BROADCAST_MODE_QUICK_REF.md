# Broadcast Mode - Quick Reference Card

## 🚀 Quick Start (30 seconds)

### Add to existing component
```tsx
<DeviceDiscovery
  selectedFiles={files}
  onDeviceSelect={handleDevice}
  onBroadcastStart={() => console.log('Broadcasting!')} // That's it!
/>
```

**Done!** Broadcast button auto-appears when 2+ devices are available.

---

## 📦 Import Statements

```tsx
// UI Component (easiest)
import { DeviceDiscovery } from '@/components/transfer/DeviceDiscovery';

// Advanced API
import {
  createBroadcastTransfer,
  broadcastFile,
  isBroadcastAvailable,
  getBroadcastDeviceCount,
  type BroadcastTransferOptions,
  type BroadcastTransferResult,
} from '@/lib/transfer/broadcast-transfer';
```

---

## 🎯 Common Patterns

### Pattern 1: Basic (Auto-UI)
```tsx
<DeviceDiscovery
  selectedFiles={[file]}
  onDeviceSelect={(d) => console.log(d)}
  onBroadcastStart={() => showToast('Broadcasting...')}
/>
```

### Pattern 2: Custom Progress
```tsx
const broadcast = createBroadcastTransfer({
  onOverallProgress: (progress) => {
    setProgress(progress);
  },
});

await broadcast.start(file);
```

### Pattern 3: Error Handling
```tsx
const broadcast = createBroadcastTransfer({
  onRecipientError: (id, error) => {
    console.error(`${id} failed:`, error);
  },
  onComplete: (result) => {
    console.log('Success:', result.successfulRecipients.length);
    console.log('Failed:', result.failedRecipients.length);
  },
});
```

### Pattern 4: Bandwidth Limit
```tsx
const broadcast = createBroadcastTransfer({
  bandwidthLimitPerRecipient: 10 * 1024 * 1024, // 10 MB/s
});
```

### Pattern 5: One-Shot
```tsx
const result = await broadcastFile(file, {
  onComplete: (r) => console.log('Done!', r),
});
```

---

## ✅ DO / ❌ DON'T

### ✅ DO
```tsx
// Use .getState() in plain functions
const state = useDeviceStore.getState();
const devices = state.devices;

// Always cleanup
try {
  await broadcast.start(file);
} finally {
  broadcast.destroy(); // REQUIRED
}

// Handle errors
onRecipientError: (id, err) => console.error(err)
```

### ❌ DON'T
```tsx
// Don't use hook subscription in plain functions
const { devices } = useDeviceStore(); // ❌ Causes Turbopack loop

// Don't forget cleanup
await broadcast.start(file); // ❌ Missing .destroy()

// Don't ignore partial failures
await broadcast.start(file);
// ❌ Check result.failedRecipients
```

---

## 🔍 Helper Functions

### Check availability
```tsx
if (isBroadcastAvailable()) {
  // Broadcast is possible
}
```

### Get device count
```tsx
const count = getBroadcastDeviceCount();
console.log(`${count} devices available`);
```

### Exclude devices
```tsx
const count = getBroadcastDeviceCount({
  excludeDeviceIds: ['device-1', 'device-2'],
  includeSelf: false,
});
```

---

## 📊 TypeScript Types

### Options
```typescript
interface BroadcastTransferOptions {
  bandwidthLimitPerRecipient?: number;
  excludeDeviceIds?: string[];
  includeSelf?: boolean;
  onRecipientProgress?: (id: string, progress: number, speed: number) => void;
  onRecipientComplete?: (id: string) => void;
  onRecipientError?: (id: string, error: Error) => void;
  onOverallProgress?: (progress: number) => void;
  onComplete?: (result: BroadcastTransferResult) => void;
}
```

### Result
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

### Status
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

---

## 🛠️ API Methods

### BroadcastTransfer
```typescript
const broadcast = createBroadcastTransfer(options);

await broadcast.start(file);          // Start transfer
broadcast.stop();                     // Cancel transfer
const status = broadcast.getStatus(); // Get current status
const id = broadcast.getBroadcastId(); // Get broadcast ID
broadcast.destroy();                  // Cleanup (REQUIRED)
```

---

## 🎨 UI States

### Hidden (0-1 devices)
```
[Scan Status Bar]
[Device Grid]
```

### Visible (2+ devices, with files)
```
[Scan Status Bar]
┌─────────────────────────────┐
│ 📡 Send to All (3 devices) →│ ← Click to broadcast
└─────────────────────────────┘
[Device Grid]
```

### Active (Broadcasting)
```
[Scan Status Bar]
┌─────────────────────────────┐
│ ⟳ Broadcasting...          │ ← Disabled
└─────────────────────────────┘
[Device Grid with progress]
```

---

## 🔒 Security

- ✅ PQC encryption per recipient (ML-KEM-768 + X25519)
- ✅ Input validation (Zod schema)
- ✅ Max 10 recipients (DoS protection)
- ✅ Independent key exchange (no key reuse)
- ✅ Secure logging (no sensitive data)

---

## ⚡ Performance

- **Parallel**: All transfers happen simultaneously
- **Efficient**: Event-based progress (no polling)
- **Lightweight**: ~10MB memory per recipient
- **Fast**: Network-limited transfer speeds

---

## 🐛 Troubleshooting

### Button doesn't appear
```tsx
// Debug device count
const state = useDeviceStore.getState();
const count = state.devices.filter(d =>
  d.isOnline && d.id !== 'this-device'
).length;
console.log('Devices:', count); // Must be >= 2
```

### Broadcast fails
```tsx
// Check file
if (!file || file.size === 0) {
  console.error('Invalid file');
}

// Check devices
const count = getBroadcastDeviceCount();
console.log('Available:', count);
```

### Turbopack loop
```tsx
// ❌ Wrong
const { devices } = useDeviceStore();

// ✅ Correct
const state = useDeviceStore.getState();
const devices = state.devices;
```

---

## 📁 File Structure

```
lib/transfer/
  └─ broadcast-transfer.ts         (NEW - Core module)
  └─ group-transfer-manager.ts     (Existing - Used by broadcast)
  └─ index.ts                      (Updated - Added exports)

components/transfer/
  └─ DeviceDiscovery.tsx           (Updated - Added UI)
  └─ DeviceDiscovery.module.css    (Updated - Added styles)

Documentation/
  └─ BROADCAST_MODE_IMPLEMENTATION.md      (Technical docs)
  └─ BROADCAST_MODE_INTEGRATION_GUIDE.md   (Integration examples)
  └─ BROADCAST_MODE_VISUAL_GUIDE.md        (UI/UX reference)
  └─ BROADCAST_MODE_SUMMARY.md             (Complete summary)
  └─ BROADCAST_MODE_QUICK_REF.md           (This file)
```

---

## 🎯 Example: Complete Flow

```tsx
'use client';

import { useState } from 'react';
import { DeviceDiscovery } from '@/components/transfer/DeviceDiscovery';
import { useToast } from '@/components/ui/ToastProvider';
import type { Device } from '@/lib/types';

export default function TransferPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { showToast } = useToast();

  const handleDeviceSelect = (device: Device) => {
    console.log('Selected device:', device);
    // Handle single device transfer
  };

  const handleBroadcastStart = () => {
    showToast({
      title: 'Broadcasting',
      message: `Sending to all devices...`,
      variant: 'info',
    });
  };

  return (
    <div>
      <h1>File Transfer</h1>

      {/* File selection UI */}
      <input
        type="file"
        onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
      />

      {/* Device discovery with broadcast */}
      <DeviceDiscovery
        selectedFiles={selectedFiles}
        onDeviceSelect={handleDeviceSelect}
        onBroadcastStart={handleBroadcastStart}
      />
    </div>
  );
}
```

---

## 💡 Pro Tips

1. **Always cleanup**: Use try/finally with `.destroy()`
2. **Handle errors**: Use `onRecipientError` callback
3. **Check availability**: Use `isBroadcastAvailable()` before prompting
4. **Monitor progress**: Use `onOverallProgress` for UI updates
5. **Limit bandwidth**: Set `bandwidthLimitPerRecipient` on slow networks
6. **Test failures**: Verify partial success handling

---

## 📚 More Info

- **Full Docs**: See `BROADCAST_MODE_IMPLEMENTATION.md`
- **Examples**: See `BROADCAST_MODE_INTEGRATION_GUIDE.md`
- **Visual Guide**: See `BROADCAST_MODE_VISUAL_GUIDE.md`
- **Summary**: See `BROADCAST_MODE_SUMMARY.md`

---

## ✨ Summary

### For Users
1. Select file
2. Click "Send to All"
3. Done!

### For Developers
1. Add `onBroadcastStart` prop
2. That's it!

```tsx
<DeviceDiscovery
  selectedFiles={files}
  onDeviceSelect={handleDevice}
  onBroadcastStart={() => console.log('🚀')}
/>
```

**Broadcast mode is production-ready!** 🎉
