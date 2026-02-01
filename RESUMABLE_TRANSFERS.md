# Resumable Transfers

## Overview

Resumable transfers allow users to recover interrupted file transfers without losing progress. The system automatically saves transfer state to IndexedDB and can resume from the exact chunk where the connection was lost.

## Features

### 1. Transfer State Persistence

All transfer metadata and progress is automatically saved to IndexedDB:

- Transfer ID (unique identifier)
- File metadata (name, size, type, hash)
- Chunk tracking (bitmap of received chunks)
- Peer information
- Session keys (for encryption)
- Timestamps (started, last updated)
- Transfer status

### 2. Chunk Tracking

Each file is divided into 64KB chunks. The system tracks:

- **Chunk Bitmap**: Efficient bit array where each bit represents a chunk (1 = received, 0 = missing)
- **Chunk Data**: Stored in IndexedDB with encryption metadata
- **Chunk Hash**: SHA-256 hash for integrity verification
- **Chunk Nonce**: Encryption nonce for decryption

### 3. Resume Protocol

When resuming a transfer, the following protocol is used:

1. **Resume Request**: Sender requests resume with transfer ID
2. **Resume Response**: Receiver responds with chunk bitmap
3. **Chunk Request**: Sender identifies missing chunks and requests them
4. **Chunk Transfer**: Only missing chunks are retransmitted
5. **Verification**: All chunks are verified before completion

### 4. Connection Recovery

The system automatically detects connection loss and:

- Saves current transfer state
- Shows "Connection Lost" banner
- Offers manual resume button
- Optionally auto-resumes after countdown (configurable)

### 5. Auto-Resume

Users can enable auto-resume in settings:

- 10-second countdown after connection loss
- Automatic reconnection attempt
- Resume from exact chunk where interrupted
- Configurable timeout and max attempts

### 6. Transfer Expiration

Transfers are automatically cleaned up after 7 days to prevent disk space issues:

- Expired transfers are deleted on app start
- Users can manually delete transfers anytime
- Completed transfers are kept indefinitely (in history)

## Architecture

### Components

```
lib/storage/transfer-state-db.ts       - IndexedDB storage layer
lib/transfer/resumable-transfer.ts     - Resumable transfer manager
lib/hooks/use-resumable-transfer.ts    - React hook
components/app/ResumableTransferDialog.tsx - UI for resumable transfers
components/app/ConnectionLostBanner.tsx    - Connection lost notification
```

### Data Flow

```
User initiates transfer
    ↓
Transfer state created in IndexedDB
    ↓
Chunks sent/received
    ↓
Each chunk saved to IndexedDB
    ↓
Bitmap updated with received chunks
    ↓
Connection lost?
    ↓ Yes
Transfer paused, state saved
    ↓
User reconnects
    ↓
Resume request sent
    ↓
Peer responds with chunk bitmap
    ↓
Missing chunks identified
    ↓
Only missing chunks requested
    ↓
Transfer completed
    ↓
Transfer state marked complete
```

## Usage

### Basic Usage

```typescript
import { useResumableTransfer } from '@/lib/hooks/use-resumable-transfer';

function FileTransfer() {
  const {
    initializeSender,
    sendFile,
    resumableTransfers,
    resumeTransfer,
    connectionLost,
    autoResumeCountdown,
  } = useResumableTransfer({
    autoResume: true,
    onTransferComplete: (blob, filename) => {
      console.log('Transfer complete:', filename);
    },
    onConnectionLost: () => {
      console.log('Connection lost, transfer paused');
    },
  });

  // Initialize and send file
  const handleSend = async () => {
    await initializeSender();
    await sendFile(file);
  };

  // Resume a transfer
  const handleResume = async (transferId: string) => {
    await resumeTransfer(transferId);
  };

  return (
    <div>
      {connectionLost && (
        <ConnectionLostBanner
          autoResumeCountdown={autoResumeCountdown}
          onResume={() => resumeTransfer(currentTransferId)}
        />
      )}

      <ResumableTransferDialog
        transfers={resumableTransfers}
        onResume={handleResume}
      />
    </div>
  );
}
```

### Advanced Configuration

```typescript
const transfer = useResumableTransfer({
  autoResume: true,              // Enable auto-resume
  resumeTimeout: 30000,          // 30 second timeout
  maxResumeAttempts: 3,          // Max 3 resume attempts
  onTransferComplete: handleComplete,
  onError: handleError,
  onConnectionLost: handleConnectionLost,
  onResumeAvailable: (transferId, progress) => {
    console.log(`Resume available: ${progress}% complete`);
  },
});
```

## Resume Protocol Messages

### Resume Request

```json
{
  "type": "resume-request",
  "payload": {
    "transferId": "a1b2c3d4..."
  }
}
```

### Resume Response

```json
{
  "type": "resume-response",
  "payload": {
    "transferId": "a1b2c3d4...",
    "chunkBitmap": "ff00aa55...",  // Hex-encoded bitmap
    "canResume": true
  }
}
```

### Resume Chunk Request

```json
{
  "type": "resume-chunk-request",
  "payload": {
    "transferId": "a1b2c3d4...",
    "chunkIndices": [1, 3, 5, 7, 9]  // Missing chunks
  }
}
```

## Chunk Bitmap Format

The chunk bitmap is a compact bit array where each bit represents a chunk:

- **Bit value 1**: Chunk received
- **Bit value 0**: Chunk missing

Example for 16 chunks:

```
Bitmap: [0b11010101, 0b00110011]
        [byte 0,      byte 1]

Chunks 0-7:  [1,1,0,1,0,1,0,1] (chunks 0,1,3,5 received)
Chunks 8-15: [0,0,1,1,0,0,1,1] (chunks 10,11,14,15 received)
```

The bitmap is transmitted as a hex string: `"d533"`

## Performance

### Storage Efficiency

- Bitmap size: ~1 bit per chunk = 8KB for 4GB file
- Metadata: ~500 bytes per transfer
- Chunk data: Stored as-is (encrypted)

### Resume Efficiency

- Only missing chunks are retransmitted
- No redundant data transfer
- Chunk-level granularity (64KB)
- Average resume savings: 50-99% of data

### Memory Usage

- Chunks stored in IndexedDB (not RAM)
- Streaming decryption (no full file in memory)
- Bitmap loaded on demand
- Automatic cleanup after 7 days

## Security

### Encryption

- All chunks encrypted with AES-256-GCM
- Session keys stored encrypted in IndexedDB
- Chunk integrity verified with SHA-256
- Forward secrecy (ephemeral keys)

### Privacy

- Transfer state stored locally only
- No server-side storage
- Automatic cleanup of old transfers
- Secure deletion of expired data

## Error Handling

### Connection Lost

- Transfer automatically paused
- State saved to IndexedDB
- User notified with banner
- Auto-resume countdown (optional)

### Peer Unavailable

- Transfer marked as paused
- Can resume when peer reconnects
- Graceful degradation

### Corruption Detection

- Chunk hash verification
- File hash verification on completion
- Automatic retry on corruption
- Error notification to user

### Transfer Expiration

- Transfers older than 7 days auto-deleted
- User can manually delete anytime
- Completed transfers kept indefinitely

## Testing

Run the test suite:

```bash
npm test tests/unit/resumable-transfer.test.ts
```

Tests cover:

- Chunk bitmap encoding/decoding
- Chunk tracking and missing chunk detection
- Resume protocol messages
- Transfer statistics calculation
- Chunk integrity verification
- Edge cases (empty, single chunk, large files)

## Limitations

1. **File Size**: Maximum 4GB per file (browser limitation)
2. **Chunk Count**: Maximum 65,536 chunks (4GB / 64KB)
3. **Bitmap Size**: Maximum 8KB per transfer
4. **Expiration**: Transfers expire after 7 days
5. **Concurrent Resumes**: One resume at a time per transfer

## Best Practices

1. **Enable Auto-Resume**: Provides best UX for unstable connections
2. **Monitor Connection**: Use connection state callbacks
3. **Clean Up**: Delete completed/failed transfers manually
4. **Verify Integrity**: Always verify file hash on completion
5. **Handle Errors**: Implement error callbacks for user feedback

## Troubleshooting

### Transfer Not Resuming

- Check if transfer has expired (>7 days)
- Verify peer is online and available
- Check if transfer was manually deleted
- Review browser console for errors

### Missing Chunks

- Verify chunk bitmap is correctly transmitted
- Check network stability during resume
- Ensure IndexedDB is not corrupted
- Try deleting and restarting transfer

### Performance Issues

- Reduce chunk size if network is unstable
- Disable auto-resume if not needed
- Clean up old transfers regularly
- Check IndexedDB quota limits

## Future Enhancements

- [ ] Configurable chunk size
- [ ] Parallel chunk requests
- [ ] Delta synchronization
- [ ] Transfer migration between devices
- [ ] Cloud backup of transfer state
- [ ] Resume across browser restarts
- [ ] Bandwidth throttling during resume
- [ ] Priority queuing for chunks

## API Reference

See JSDoc comments in source files for detailed API documentation:

- `lib/storage/transfer-state-db.ts`
- `lib/transfer/resumable-transfer.ts`
- `lib/hooks/use-resumable-transfer.ts`
