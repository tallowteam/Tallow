# Resumable Transfer API Examples

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [State Management](#state-management)
3. [Resume Protocol](#resume-protocol)
4. [Connection Handling](#connection-handling)
5. [UI Integration](#ui-integration)
6. [Error Handling](#error-handling)
7. [Advanced Features](#advanced-features)

## Basic Usage

### Initialize Transfer Manager

```typescript
import { ResumablePQCTransferManager } from '@/lib/transfer/resumable-transfer';

// Create manager with options
const manager = new ResumablePQCTransferManager({
  autoResume: true,
  resumeTimeout: 30000,
  maxResumeAttempts: 3,
});

// Initialize session
await manager.initializeSession('send');

// Set data channel
manager.setDataChannel(dataChannel);

// Exchange keys
const publicKey = manager.getPublicKey();
await manager.setPeerPublicKey(peerPublicKey);

// Send file
await manager.sendFile(file);
```

### Using React Hook

```typescript
import { useResumableTransfer } from '@/lib/hooks/use-resumable-transfer';

function MyComponent() {
  const {
    sendFile,
    resumeTransfer,
    resumableTransfers,
    progress,
    isTransferring,
  } = useResumableTransfer({
    autoResume: true,
    onTransferComplete: (blob, filename) => {
      console.log('Transfer complete:', filename);
    },
  });

  const handleSend = async (file: File) => {
    await sendFile(file);
  };

  const handleResume = async (transferId: string) => {
    await resumeTransfer(transferId);
  };

  return (
    <div>
      <button onClick={() => handleSend(selectedFile)}>Send</button>
      {resumableTransfers.map((transfer) => (
        <button key={transfer.transferId} onClick={() => handleResume(transfer.transferId)}>
          Resume {transfer.fileName} ({transfer.progress.toFixed(1)}%)
        </button>
      ))}
    </div>
  );
}
```

## State Management

### Create Transfer State

```typescript
import { createTransferState } from '@/lib/storage/transfer-state-db';

const metadata = await createTransferState(
  'transfer-123',           // Transfer ID
  'document.pdf',          // File name
  'application/pdf',       // MIME type
  1048576,                 // File size (1MB)
  fileHash,                // SHA-256 hash
  65536,                   // Chunk size (64KB)
  'peer-456',             // Peer ID
  'send',                 // Direction
  sessionKeys             // Optional session keys
);

console.log('Total chunks:', metadata.totalChunks);
console.log('Bitmap size:', metadata.chunkBitmap.length);
```

### Save Chunk

```typescript
import { saveChunk } from '@/lib/storage/transfer-state-db';

// Save received chunk
await saveChunk(
  'transfer-123',          // Transfer ID
  5,                       // Chunk index
  chunkData,              // ArrayBuffer
  nonce,                  // Uint8Array nonce
  hash                    // Uint8Array hash
);

// Automatically updates:
// - Chunk bitmap (sets bit for chunk 5)
// - Received chunks count
// - Last updated timestamp
// - Status (if all chunks received)
```

### Get Transfer Statistics

```typescript
import { getTransferStats } from '@/lib/storage/transfer-state-db';

const stats = await getTransferStats('transfer-123');

console.log('Total chunks:', stats.totalChunks);
console.log('Received chunks:', stats.receivedChunks);
console.log('Missing chunks:', stats.missingChunks);
console.log('Progress:', stats.progress.toFixed(1) + '%');
console.log('Bytes received:', stats.bytesReceived);
```

### Get Missing Chunks

```typescript
import { getMissingChunks } from '@/lib/storage/transfer-state-db';

const missing = await getMissingChunks('transfer-123');

console.log('Missing chunks:', missing);
// Output: [1, 3, 5, 7, 9] (indices of missing chunks)

// Use this to request specific chunks during resume
```

## Resume Protocol

### Send Resume Request

```typescript
// Sender initiates resume
const message = {
  type: 'resume-request',
  payload: {
    transferId: 'transfer-123',
  },
};

dataChannel.send(JSON.stringify(message));
```

### Handle Resume Request (Receiver)

```typescript
import { getTransferState, exportChunkBitmap } from '@/lib/storage/transfer-state-db';

// Receiver handles resume request
async function handleResumeRequest(transferId: string) {
  const metadata = await getTransferState(transferId);

  if (!metadata) {
    // Cannot resume - transfer not found
    return {
      type: 'resume-response',
      payload: {
        transferId,
        chunkBitmap: '',
        canResume: false,
      },
    };
  }

  // Export chunk bitmap as hex string
  const bitmapHex = exportChunkBitmap(metadata.chunkBitmap);

  return {
    type: 'resume-response',
    payload: {
      transferId,
      chunkBitmap: bitmapHex,
      canResume: true,
    },
  };
}
```

### Handle Resume Response (Sender)

```typescript
import { importChunkBitmap, getMissingChunks } from '@/lib/storage/transfer-state-db';

async function handleResumeResponse(transferId: string, chunkBitmapHex: string, canResume: boolean) {
  if (!canResume) {
    console.error('Peer cannot resume transfer');
    return;
  }

  // Import peer's chunk bitmap
  const peerBitmap = importChunkBitmap(chunkBitmapHex);

  // Get our local metadata
  const metadata = await getTransferState(transferId);

  // Calculate missing chunks
  const missing: number[] = [];
  for (let i = 0; i < metadata.totalChunks; i++) {
    const byteIndex = Math.floor(i / 8);
    const bitIndex = i % 8;
    const peerHas = (peerBitmap[byteIndex] & (1 << bitIndex)) !== 0;

    if (!peerHas) {
      missing.push(i);
    }
  }

  console.log(`Resuming: ${missing.length} chunks to send`);

  // Request missing chunks
  return {
    type: 'resume-chunk-request',
    payload: {
      transferId,
      chunkIndices: missing,
    },
  };
}
```

### Send Missing Chunks

```typescript
import { getAllChunks } from '@/lib/storage/transfer-state-db';

async function sendMissingChunks(transferId: string, chunkIndices: number[]) {
  const chunks = await getAllChunks(transferId);

  for (const index of chunkIndices) {
    const chunk = chunks.find((c) => c.chunkIndex === index);

    if (chunk) {
      const message = {
        type: 'chunk',
        payload: {
          index: chunk.chunkIndex,
          data: Array.from(new Uint8Array(chunk.data)),
          nonce: Array.from(chunk.nonce),
          hash: Array.from(chunk.hash),
        },
      };

      dataChannel.send(JSON.stringify(message));
    }
  }
}
```

## Connection Handling

### Detect Connection Loss

```typescript
// Monitor data channel state
dataChannel.addEventListener('close', () => {
  console.log('Connection lost');

  // Save transfer state
  if (currentTransferId) {
    updateTransferState({
      transferId: currentTransferId,
      status: 'paused',
    });
  }

  // Notify user
  showConnectionLostBanner();
});

// Monitor peer connection state
peerConnection.addEventListener('connectionstatechange', () => {
  if (peerConnection.connectionState === 'disconnected') {
    console.log('Peer disconnected');
    handleConnectionLoss();
  }
});
```

### Auto-Resume on Reconnect

```typescript
import { useResumableTransfer } from '@/lib/hooks/use-resumable-transfer';

function TransferComponent() {
  const {
    connectionLost,
    currentTransferId,
    resumeTransfer,
    autoResumeCountdown,
  } = useResumableTransfer({
    autoResume: true,
  });

  useEffect(() => {
    if (connectionLost && autoResumeCountdown === 0 && currentTransferId) {
      // Auto-resume after countdown
      resumeTransfer(currentTransferId);
    }
  }, [connectionLost, autoResumeCountdown, currentTransferId]);

  return (
    <div>
      {connectionLost && autoResumeCountdown > 0 && (
        <p>Auto-resuming in {autoResumeCountdown}s...</p>
      )}
    </div>
  );
}
```

## UI Integration

### Show Resumable Transfers

```typescript
import { getResumableTransfers, getTransferStats } from '@/lib/storage/transfer-state-db';

async function loadResumableTransfers() {
  const transfers = await getResumableTransfers();

  for (const transfer of transfers) {
    const stats = await getTransferStats(transfer.transferId);

    console.log({
      id: transfer.transferId,
      name: transfer.fileName,
      progress: stats.progress,
      canResume: stats.missingChunks > 0,
    });
  }
}
```

### Connection Lost Banner

```tsx
import { ConnectionLostBanner } from '@/components/app/ConnectionLostBanner';

function App() {
  const [connectionLost, setConnectionLost] = useState(false);
  const [currentTransferId, setCurrentTransferId] = useState<string | null>(null);

  return (
    <ConnectionLostBanner
      visible={connectionLost}
      transferId={currentTransferId}
      progress={75}
      autoResumeEnabled={true}
      autoResumeCountdown={10}
      onResume={() => resumeTransfer(currentTransferId!)}
      onCancel={() => setConnectionLost(false)}
      onDismiss={() => setConnectionLost(false)}
    />
  );
}
```

### Resumable Transfer Dialog

```tsx
import { ResumableTransferDialog } from '@/components/app/ResumableTransferDialog';

function App() {
  const [showDialog, setShowDialog] = useState(false);
  const [transfers, setTransfers] = useState<ResumableTransferItem[]>([]);

  return (
    <ResumableTransferDialog
      open={showDialog}
      onOpenChange={setShowDialog}
      transfers={transfers}
      onResume={(transferId) => resumeTransfer(transferId)}
      onDelete={(transferId) => deleteTransfer(transferId)}
      onRefresh={() => loadResumableTransfers()}
      isResuming={false}
    />
  );
}
```

## Error Handling

### Handle Resume Failure

```typescript
async function resumeWithRetry(transferId: string, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Resume attempt ${attempt}/${maxAttempts}`);
      await manager.resumeTransfer(transferId);
      console.log('Resume successful');
      return;
    } catch (error) {
      console.error(`Resume attempt ${attempt} failed:`, error);

      if (attempt === maxAttempts) {
        // Max attempts reached
        await updateTransferState({
          transferId,
          status: 'failed',
          error: 'Max resume attempts exceeded',
        });
        throw new Error('Failed to resume after ' + maxAttempts + ' attempts');
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
```

### Handle Chunk Corruption

```typescript
import { getChunk } from '@/lib/storage/transfer-state-db';

async function verifyChunk(transferId: string, chunkIndex: number): Promise<boolean> {
  const chunk = await getChunk(transferId, chunkIndex);
  if (!chunk) return false;

  // Verify chunk hash
  const computedHash = await crypto.subtle.digest('SHA-256', chunk.data);
  const expectedHash = chunk.hash;

  const hashMatch = new Uint8Array(computedHash).every(
    (byte, i) => byte === expectedHash[i]
  );

  if (!hashMatch) {
    console.error(`Chunk ${chunkIndex} corrupted - hash mismatch`);
    // Request chunk again
    requestChunk(transferId, chunkIndex);
    return false;
  }

  return true;
}
```

### Handle Transfer Expiration

```typescript
import { cleanupExpiredTransfers } from '@/lib/storage/transfer-state-db';

// Run on app startup
async function initializeApp() {
  const deletedCount = await cleanupExpiredTransfers();
  console.log(`Cleaned up ${deletedCount} expired transfers`);
}

// Or manually check expiration
function isTransferExpired(lastUpdated: Date): boolean {
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate > 7;
}
```

## Advanced Features

### Custom Chunk Size

```typescript
// Use smaller chunks for unstable connections
const SMALL_CHUNK_SIZE = 16 * 1024; // 16KB

await createTransferState(
  transferId,
  fileName,
  fileType,
  fileSize,
  fileHash,
  SMALL_CHUNK_SIZE, // Custom chunk size
  peerId,
  direction
);
```

### Parallel Chunk Requests

```typescript
async function requestChunksParallel(transferId: string, chunkIndices: number[], maxParallel = 5) {
  const chunks = await getAllChunks(transferId);

  // Process chunks in batches
  for (let i = 0; i < chunkIndices.length; i += maxParallel) {
    const batch = chunkIndices.slice(i, i + maxParallel);

    await Promise.all(
      batch.map(async (index) => {
        const chunk = chunks.find((c) => c.chunkIndex === index);
        if (chunk) {
          await sendChunk(chunk);
        }
      })
    );
  }
}
```

### Transfer Progress Callback

```typescript
manager.onProgress((progress) => {
  console.log(`Transfer progress: ${progress.toFixed(1)}%`);

  // Update UI
  setProgress(progress);

  // Save to analytics
  trackTransferProgress(transferId, progress);
});
```

### Custom Timeout Configuration

```typescript
const manager = new ResumablePQCTransferManager({
  autoResume: true,
  resumeTimeout: 60000,      // 60 seconds
  maxResumeAttempts: 5,      // 5 attempts
});

// Or change timeout for specific resume
manager.resumeOptions.resumeTimeout = 120000; // 2 minutes
```

### Bandwidth Throttling During Resume

```typescript
// Limit bandwidth during resume to avoid congestion
manager.setBandwidthLimit(500 * 1024); // 500 KB/s

// Resume with throttling
await manager.resumeTransfer(transferId);

// Remove limit after resume
manager.setBandwidthLimit(0); // Unlimited
```

### Transfer State Callbacks

```typescript
const manager = new ResumablePQCTransferManager({
  onConnectionLost: () => {
    console.log('Connection lost - transfer paused');
    notifyUser('Connection lost', 'Transfer paused and saved');
  },
  onResumeAvailable: (transferId, progress) => {
    console.log(`Resume available: ${progress}% complete`);
    showResumeNotification(transferId, progress);
  },
});
```

### Delete Transfer with Confirmation

```typescript
async function deleteTransferWithConfirm(transferId: string) {
  const metadata = await getTransferState(transferId);
  if (!metadata) return;

  const stats = await getTransferStats(transferId);

  const confirmed = confirm(
    `Delete transfer "${metadata.fileName}" (${stats.progress.toFixed(1)}% complete)?`
  );

  if (confirmed) {
    await deleteTransfer(transferId);
    console.log('Transfer deleted');
  }
}
```

## Best Practices

1. **Always verify chunks**: Check hash before accepting chunks
2. **Handle timeouts gracefully**: Set appropriate timeout values
3. **Clean up regularly**: Remove old transfers to free disk space
4. **Monitor connection**: Use connection state callbacks
5. **Save state frequently**: Update state after each chunk
6. **Provide feedback**: Show progress and status to users
7. **Test edge cases**: Empty files, single chunk, large files
8. **Handle errors**: Implement retry logic and error notifications

## Common Patterns

### Complete Transfer Flow

```typescript
// 1. Initialize
const manager = new ResumablePQCTransferManager({ autoResume: true });
await manager.initializeSession('send');

// 2. Exchange keys
manager.setDataChannel(dataChannel);
await manager.setPeerPublicKey(peerPublicKey);

// 3. Send file
await manager.sendFile(file);

// 4. Handle connection loss
manager.onConnectionLost(() => {
  // State automatically saved
  showConnectionLostBanner();
});

// 5. Resume transfer
const transfers = await getResumableTransfers();
if (transfers.length > 0) {
  await manager.resumeTransfer(transfers[0].transferId);
}

// 6. Complete transfer
manager.onComplete((blob, filename) => {
  saveFile(blob, filename);
});

// 7. Cleanup
manager.destroy();
```

This covers all major API usage patterns for resumable transfers!
