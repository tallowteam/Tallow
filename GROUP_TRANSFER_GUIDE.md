# Group Transfer Feature Guide

## Overview

The Group Transfer feature enables sending files to multiple recipients simultaneously using a 1-to-many WebRTC architecture with independent post-quantum encryption (ML-KEM-768 + X25519) for each recipient connection.

## Architecture

### Multi-Peer Connection Model

```
                    Sender
                      |
        +-------------+-------------+-------------+
        |             |             |             |
    Recipient 1   Recipient 2   Recipient 3   Recipient 4
        |             |             |             |
    ML-KEM-768    ML-KEM-768    ML-KEM-768    ML-KEM-768
    + X25519      + X25519      + X25519      + X25519
```

### Key Components

1. **GroupTransferManager** (`lib/transfer/group-transfer-manager.ts`)
   - Orchestrates multiple PQCTransferManager instances
   - Manages parallel transfers with independent progress tracking
   - Handles graceful failure of individual connections
   - Implements bandwidth throttling across peers

2. **useGroupTransfer** (`lib/hooks/use-group-transfer.ts`)
   - React hook for group transfer state management
   - Provides callbacks for progress and completion
   - Integrates with TransfersContext

3. **RecipientSelector** (`components/app/RecipientSelector.tsx`)
   - Multi-select UI for choosing recipients
   - Search and filter capabilities
   - Visual selection feedback

4. **GroupTransferProgress** (`components/app/GroupTransferProgress.tsx`)
   - Real-time progress tracking for each recipient
   - Aggregate statistics (total speed, success/failure counts)
   - Individual recipient status indicators

5. **GroupTransferConfirmDialog** (`components/app/GroupTransferConfirmDialog.tsx`)
   - Pre-transfer confirmation with statistics
   - Security and performance information
   - Warning for large transfers

## Usage

### Basic Integration

```tsx
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';
import { RecipientSelector } from '@/components/app/RecipientSelector';
import { GroupTransferProgress } from '@/components/app/GroupTransferProgress';

function MyComponent() {
  const {
    isInitializing,
    isTransferring,
    groupState,
    initializeGroupTransfer,
    sendToAll,
    cancel,
  } = useGroupTransfer({
    bandwidthLimitPerRecipient: 1024 * 1024, // 1 MB/s
    onRecipientComplete: (id, name) => {
      console.log(`Transfer completed to ${name}`);
    },
    onComplete: (result) => {
      console.log('All transfers completed:', result);
    },
  });

  // ... component logic
}
```

### Step-by-Step Transfer Flow

#### 1. Recipient Selection

```tsx
<RecipientSelector
  open={showSelector}
  onOpenChange={setShowSelector}
  availableDevices={devices}
  selectedDeviceIds={selectedIds}
  onSelectionChange={setSelectedIds}
  onConfirm={handleConfirm}
  minRecipients={1}
  maxRecipients={10}
/>
```

#### 2. Initialize Group Transfer

```tsx
// Create data channels for each recipient
const recipientsWithChannels = await Promise.all(
  selectedRecipients.map(async (device) => {
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
  transferId,
  file.name,
  file.size,
  recipientsWithChannels
);
```

#### 3. Start Transfer

```tsx
const result = await sendToAll(file);

console.log('Transfer result:', {
  totalRecipients: result.totalRecipients,
  successful: result.successfulRecipients,
  failed: result.failedRecipients,
  totalTime: result.totalTime,
});
```

#### 4. Monitor Progress

```tsx
{groupState && (
  <GroupTransferProgress
    open={showProgress}
    onOpenChange={setShowProgress}
    groupState={groupState}
    onRecipientNameLookup={(id) => getRecipientName(id)}
  />
)}
```

## Features

### 1. Independent Encryption

Each recipient receives files through an independently encrypted channel:
- Separate ML-KEM-768 key exchange
- Independent X25519 shared secrets
- Unique session keys per recipient

### 2. Parallel Transfer

Files are sent simultaneously to all recipients:
- Non-blocking parallel execution
- Independent progress tracking
- No recipient holds up others

### 3. Graceful Failure Handling

Individual failures don't affect other transfers:
- Continue on partial failure
- Track success/failure per recipient
- Detailed error reporting

### 4. Bandwidth Management

Control bandwidth usage across all peers:
```tsx
useGroupTransfer({
  bandwidthLimitPerRecipient: 500 * 1024, // 500 KB/s per recipient
})
```

### 5. Progress Tracking

Monitor transfer at multiple levels:
- Overall progress (aggregate)
- Per-recipient progress
- Transfer speed per recipient
- ETA calculations

## API Reference

### GroupTransferManager

#### Constructor
```typescript
new GroupTransferManager(options?: GroupTransferOptions)
```

**Options:**
- `bandwidthLimitPerRecipient`: Bytes per second limit per recipient
- `onRecipientProgress`: Called when recipient progress updates
- `onRecipientComplete`: Called when recipient transfer completes
- `onRecipientError`: Called when recipient transfer fails
- `onOverallProgress`: Called when overall progress updates
- `onComplete`: Called when all transfers complete

#### Methods

**initializeGroupTransfer**
```typescript
async initializeGroupTransfer(
  transferId: string,
  fileName: string,
  fileSize: number,
  recipients: Array<{
    info: RecipientInfo;
    dataChannel: RTCDataChannel;
  }>
): Promise<void>
```

**startKeyExchange**
```typescript
async startKeyExchange(): Promise<void>
```

**sendToAll**
```typescript
async sendToAll(file: File): Promise<GroupTransferResult>
```

**cancel**
```typescript
cancel(): void
```

**getState**
```typescript
getState(): GroupTransferState | null
```

### useGroupTransfer Hook

**Returns:**
```typescript
{
  isInitializing: boolean;
  isTransferring: boolean;
  isCompleted: boolean;
  groupState: GroupTransferState | null;
  result: GroupTransferResult | null;
  error: string | null;
  initializeGroupTransfer: (transferId, fileName, fileSize, recipients) => Promise<void>;
  sendToAll: (file: File) => Promise<GroupTransferResult>;
  cancel: () => void;
  reset: () => void;
  getRecipientName: (recipientId: string) => string;
}
```

### GroupTransferState

```typescript
interface GroupTransferState {
  transferId: string;
  fileName: string;
  fileSize: number;
  recipients: GroupTransferRecipient[];
  totalProgress: number; // 0-100
  successCount: number;
  failureCount: number;
  pendingCount: number;
  status: 'preparing' | 'transferring' | 'completed' | 'partial' | 'failed';
  bandwidthLimit?: number;
}
```

### GroupTransferResult

```typescript
interface GroupTransferResult {
  transferId: string;
  fileName: string;
  totalRecipients: number;
  successfulRecipients: string[];
  failedRecipients: { id: string; error: string }[];
  totalTime: number; // milliseconds
}
```

## Security Considerations

### 1. Independent Key Exchange

Each recipient performs independent ML-KEM-768 + X25519 key exchange:
- No key reuse across recipients
- Each connection has unique session keys
- Compromise of one channel doesn't affect others

### 2. Encryption Per Recipient

Files are encrypted independently for each recipient:
- Different nonces per recipient
- Separate authentication tags
- No shared encryption state

### 3. Connection Integrity

Each WebRTC connection is independently verified:
- Separate data channels
- Independent connection state
- Isolated failure domains

## Performance Optimization

### 1. Bandwidth Throttling

```typescript
// Limit per-recipient bandwidth
useGroupTransfer({
  bandwidthLimitPerRecipient: 1024 * 1024, // 1 MB/s
})
```

### 2. Parallel Efficiency

The system automatically manages:
- Concurrent chunk sending
- Backpressure handling
- Buffer management per channel

### 3. Progress Updates

Progress updates are batched to reduce overhead:
- 100ms update interval
- Aggregated statistics
- Efficient state propagation

## Error Handling

### Common Scenarios

#### 1. Partial Failure
```typescript
onComplete: (result) => {
  if (result.failedRecipients.length > 0) {
    // Some transfers failed
    console.log('Failed recipients:', result.failedRecipients);
    // Show retry UI for failed recipients
  }
}
```

#### 2. Connection Loss
```typescript
onRecipientError: (id, name, error) => {
  if (error.includes('connection')) {
    // Connection lost during transfer
    // Option to retry
  }
}
```

#### 3. Key Exchange Timeout
```typescript
// Automatically handled with 30s timeout
// Failed recipients marked with status: 'failed'
```

## Testing

### Unit Tests
```bash
npm test lib/transfer/group-transfer-manager.test.ts
npm test lib/hooks/use-group-transfer.test.ts
```

### Integration Tests
```bash
npm test tests/e2e/group-transfer.spec.ts
```

## Best Practices

### 1. Limit Recipients
- Recommend max 10 recipients for performance
- UI enforces configurable limits

### 2. Bandwidth Management
- Set appropriate per-recipient limits
- Monitor total network usage

### 3. User Feedback
- Show clear progress indicators
- Report failures with actionable messages
- Provide retry options for failed transfers

### 4. File Size Considerations
- Warn users about large transfers
- Consider splitting very large files
- Show estimated transfer times

## Troubleshooting

### Issue: All transfers fail immediately
- **Cause**: Data channels not open
- **Solution**: Ensure WebRTC connections established before initializing

### Issue: Some recipients timeout
- **Cause**: Network issues or firewall
- **Solution**: Check TURN server configuration, retry failed transfers

### Issue: Slow transfer speeds
- **Cause**: Bandwidth limits too low or network congestion
- **Solution**: Adjust bandwidth limits, check network capacity

### Issue: Memory issues with many recipients
- **Cause**: Too many concurrent connections
- **Solution**: Reduce max recipients or implement batching

## Future Enhancements

1. **Resume Support**: Resume failed transfers
2. **Folder Support**: Send entire folders to multiple recipients
3. **Priority Queuing**: Prioritize certain recipients
4. **Bandwidth Auto-adjustment**: Dynamically adjust based on network
5. **Recipient Grouping**: Save recipient groups for quick selection

## Related Documentation

- [PQC Transfer Manager](./lib/transfer/pqc-transfer-manager.ts)
- [WebRTC Connection Setup](./lib/hooks/use-p2p-connection.ts)
- [Transfers Context](./lib/context/transfers-context.tsx)
- [Security Guide](./SECURITY_ENHANCEMENTS.md)
