# Resumable Transfer Quick Start

## 5-Minute Setup

### 1. Import the Hook

```typescript
import { useResumableTransfer } from '@/lib/hooks/use-resumable-transfer';
```

### 2. Use in Component

```typescript
function FileTransferComponent() {
  const {
    sendFile,
    resumeTransfer,
    resumableTransfers,
    connectionLost,
    progress,
  } = useResumableTransfer({
    autoResume: true,
    onTransferComplete: (blob, filename) => {
      // Save the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    },
  });

  const handleFileSelect = async (file: File) => {
    await sendFile(file);
  };

  return (
    <div>
      {/* Your UI here */}
    </div>
  );
}
```

### 3. Add UI Components

```typescript
import { ResumableTransferDialog } from '@/components/app/ResumableTransferDialog';
import { ConnectionLostBanner } from '@/components/app/ConnectionLostBanner';

// In your component:
<ConnectionLostBanner
  visible={connectionLost}
  transferId={currentTransferId}
  progress={progress}
  autoResumeEnabled={autoResumeEnabled}
  autoResumeCountdown={autoResumeCountdown}
  onResume={() => resumeTransfer(currentTransferId!)}
  onCancel={cancelAutoResume}
  onDismiss={() => setShowBanner(false)}
/>

<ResumableTransferDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  transfers={resumableTransfers}
  onResume={resumeTransfer}
  onDelete={deleteResumableTransfer}
  onRefresh={loadResumableTransfers}
/>
```

## Common Use Cases

### Send File with Auto-Resume

```typescript
const { sendFile } = useResumableTransfer({ autoResume: true });

await sendFile(selectedFile);
// Connection lost? Transfer automatically paused and saved
// User reconnects? Transfer auto-resumes after 10s countdown
```

### Manual Resume

```typescript
const { resumableTransfers, resumeTransfer } = useResumableTransfer();

// Show list of resumable transfers
resumableTransfers.map(transfer => (
  <button onClick={() => resumeTransfer(transfer.transferId)}>
    Resume {transfer.fileName} ({transfer.progress}%)
  </button>
));
```

### Custom Configuration

```typescript
const transfer = useResumableTransfer({
  autoResume: true,
  resumeTimeout: 60000,      // 60 seconds
  maxResumeAttempts: 5,      // 5 attempts
  onConnectionLost: () => {
    toast.error('Connection lost!');
  },
  onResumeAvailable: (id, progress) => {
    toast.info(`Resume available: ${progress}%`);
  },
});
```

## Key Points

✅ **Automatic**: Transfer state saved automatically
✅ **Transparent**: Works seamlessly without user action
✅ **Efficient**: Only retransmits missing chunks
✅ **Secure**: Encrypted storage, integrity verification
✅ **Configurable**: Customize timeout, attempts, chunk size

## Storage

- Transfer state stored in IndexedDB
- Persists across browser restarts
- Auto-cleanup after 7 days
- Manual cleanup available in settings

## Protocol

1. Connection lost → Transfer paused, state saved
2. Reconnect → Send resume request
3. Peer responds with chunk bitmap
4. Calculate missing chunks
5. Request only missing chunks
6. Complete transfer

## Testing

```bash
npm test tests/unit/resumable-transfer.test.ts
```

## Documentation

- **User Guide**: `RESUMABLE_TRANSFERS.md`
- **API Reference**: `RESUMABLE_TRANSFER_API.md`
- **Implementation**: `RESUMABLE_TRANSFER_IMPLEMENTATION.md`

## Complete Example

See `components/app/ResumableTransferExample.tsx` for a full working example with all features integrated.

---

That's it! Your transfers are now resumable. 🎉
