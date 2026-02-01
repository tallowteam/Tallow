# Group Transfer - Complete API Documentation

**Version:** 1.0.0
**Last Updated:** 2026-01-28
**Status:** Production Ready ✅

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Reference](#api-reference)
4. [Transfer Flow](#transfer-flow)
5. [Encryption & Security](#encryption--security)
6. [Progress Tracking](#progress-tracking)
7. [Error Handling](#error-handling)
8. [Integration Guide](#integration-guide)
9. [Code Examples](#code-examples)
10. [Troubleshooting](#troubleshooting)
11. [Performance Tuning](#performance-tuning)
12. [Testing Strategies](#testing-strategies)
13. [Deployment Guide](#deployment-guide)
14. [Best Practices](#best-practices)

---

## Overview

### What is Group Transfer?

Group Transfer enables sending files to multiple recipients simultaneously using a 1-to-many WebRTC architecture. Each recipient connection is independently encrypted with Post-Quantum Cryptography (ML-KEM-768 + X25519), ensuring maximum security and resilience.

### Key Features

- **Multiple Recipients**: Send to up to 10 recipients simultaneously
- **Independent Encryption**: Each recipient gets unique PQC encryption
- **Parallel Transfer**: Non-blocking concurrent transfers
- **Graceful Failure**: Individual failures don't affect other transfers
- **Bandwidth Management**: Per-recipient bandwidth throttling
- **Progress Tracking**: Real-time per-recipient and aggregate progress
- **Connection Quality Monitoring**: Automatic quality assessment

### Technical Stack

- **WebRTC**: Peer-to-peer data channels
- **Post-Quantum Cryptography**: ML-KEM-768 + X25519 hybrid
- **Socket.IO**: Signaling coordination
- **React Hooks**: State management
- **TypeScript**: Type-safe implementation

---

## Architecture

### Multi-Peer Model

```
                    Sender
                      |
        +-------------+-------------+-------------+
        |             |             |             |
    Recipient 1   Recipient 2   Recipient 3   Recipient 4
        |             |             |             |
  PQC Channel   PQC Channel   PQC Channel   PQC Channel
  ML-KEM-768    ML-KEM-768    ML-KEM-768    ML-KEM-768
   + X25519      + X25519      + X25519      + X25519
```

### Component Hierarchy

```
GroupTransferManager (Core Orchestrator)
    ├── PQCTransferManager (Per Recipient)
    │   ├── KeyManagement (ML-KEM-768 + X25519)
    │   ├── FileEncryption (ChaCha20-Poly1305)
    │   └── ProgressTracking
    ├── DataChannelManager (Connection Management)
    │   ├── WebRTC Connections
    │   ├── Bandwidth Throttling
    │   └── Quality Monitoring
    └── useGroupTransfer (React Hook)
        ├── RecipientSelector (UI Component)
        ├── GroupTransferProgress (UI Component)
        └── GroupTransferConfirmDialog (UI Component)
```

### Data Flow

```
File Selection
    ↓
Recipient Selection (1-10 recipients)
    ↓
Initialize Group Transfer
    ↓
Create WebRTC Data Channels (parallel)
    ↓
Key Exchange (ML-KEM-768 + X25519 per recipient)
    ↓
Send Encrypted Chunks (parallel to all recipients)
    ↓
Track Progress (per recipient + aggregate)
    ↓
Handle Completion/Failure (graceful per-recipient)
    ↓
Generate Results Report
```

### File Structure

```
lib/transfer/
├── group-transfer-manager.ts      # Core orchestrator class
└── pqc-transfer-manager.ts        # Per-recipient transfer

lib/hooks/
└── use-group-transfer.ts          # React hook

lib/webrtc/
└── data-channel.ts                # DataChannelManager

components/app/
├── RecipientSelector.tsx          # Multi-select UI
├── GroupTransferProgress.tsx      # Progress tracking UI
└── GroupTransferConfirmDialog.tsx # Confirmation dialog

tests/
├── unit/transfer/group-transfer-manager.test.ts
└── e2e/group-transfer.spec.ts
```

---

## API Reference

### GroupTransferManager Class

#### Constructor

```typescript
constructor(options?: GroupTransferOptions)
```

**Parameters:**

```typescript
interface GroupTransferOptions {
  bandwidthLimitPerRecipient?: number;  // bytes per second
  onRecipientProgress?: (
    recipientId: string,
    progress: number,
    speed: number
  ) => void;
  onRecipientComplete?: (recipientId: string) => void;
  onRecipientError?: (recipientId: string, error: Error) => void;
  onOverallProgress?: (progress: number) => void;
  onComplete?: (results: GroupTransferResult) => void;
}
```

**Default Options:**

```typescript
{
  bandwidthLimitPerRecipient: undefined,  // No limit
  // Callbacks all optional
}
```

**Example:**

```typescript
const manager = new GroupTransferManager({
  bandwidthLimitPerRecipient: 1024 * 1024, // 1 MB/s per recipient
  onRecipientProgress: (id, progress, speed) => {
    console.log(`${id}: ${progress}% @ ${speed} bytes/s`);
  },
  onComplete: (result) => {
    console.log('All transfers complete:', result);
  },
});
```

#### Methods

##### `initializeGroupTransfer()`

Initialize group transfer session with WebRTC data channels.

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

**Parameters:**
- `transferId`: Unique transfer identifier (UUID)
- `fileName`: Name of file being transferred
- `fileSize`: File size in bytes
- `recipients`: Array of recipient info + data channels

**Throws:**
- `Error('No recipients provided')` - Recipients array empty
- `Error('Maximum 10 recipients allowed')` - Too many recipients
- `Error('Invalid recipient')` - Recipient validation failed

**Example:**

```typescript
const recipients = await Promise.all(
  selectedDevices.map(async (device) => {
    const dataChannel = await createDataChannel(device.id);
    return {
      info: {
        id: device.id,
        name: device.name,
        deviceId: device.id,
        socketId: device.socketId,
      },
      dataChannel,
    };
  })
);

await manager.initializeGroupTransfer(
  generateUUID(),
  'document.pdf',
  1024 * 1024 * 5, // 5 MB
  recipients
);
```

##### `startKeyExchange()`

Initiate PQC key exchange with all recipients.

```typescript
async startKeyExchange(): Promise<void>
```

**Behavior:**
- Initiates ML-KEM-768 + X25519 key exchange in parallel
- 30-second timeout per recipient
- Failed recipients marked as 'failed', others continue
- Throws only if ALL recipients fail

**Example:**

```typescript
try {
  await manager.startKeyExchange();
  console.log('Key exchange complete');
} catch (error) {
  console.error('All key exchanges failed:', error);
}
```

##### `sendToAll()`

Send file to all recipients in parallel.

```typescript
async sendToAll(file: File): Promise<GroupTransferResult>
```

**Parameters:**
- `file`: File object to send

**Returns:**

```typescript
interface GroupTransferResult {
  transferId: string;
  fileName: string;
  totalRecipients: number;
  successfulRecipients: string[];      // Recipient IDs
  failedRecipients: Array<{            // Failed transfers
    id: string;
    error: AppError;
  }>;
  totalTime: number;                   // milliseconds
}
```

**Example:**

```typescript
const file = new File(['content'], 'test.txt');
const result = await manager.sendToAll(file);

console.log('Successful:', result.successfulRecipients.length);
console.log('Failed:', result.failedRecipients.length);
console.log('Total time:', result.totalTime, 'ms');
```

##### `cancel()`

Cancel all ongoing transfers.

```typescript
cancel(): void
```

**Behavior:**
- Stops all active transfers immediately
- Closes all data channels
- Clears all state
- Triggers onComplete with partial results

**Example:**

```typescript
manager.cancel();
console.log('All transfers canceled');
```

##### `getState()`

Get current group transfer state.

```typescript
getState(): GroupTransferState | null
```

**Returns:**

```typescript
interface GroupTransferState {
  transferId: string;
  fileName: string;
  fileSize: number;
  recipients: GroupTransferRecipient[];
  totalProgress: number;      // 0-100 (aggregate)
  successCount: number;
  failureCount: number;
  pendingCount: number;
  status: 'preparing' | 'transferring' | 'completed' | 'partial' | 'failed';
  bandwidthLimit: number | null;
}
```

**Example:**

```typescript
const state = manager.getState();
if (state) {
  console.log(`Overall progress: ${state.totalProgress}%`);
  console.log(`Success: ${state.successCount}/${state.recipients.length}`);
}
```

##### `getRecipientState()`

Get state for a specific recipient.

```typescript
getRecipientState(recipientId: string): GroupTransferRecipient | null
```

**Returns:**

```typescript
interface GroupTransferRecipient extends RecipientInfo {
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  manager: PQCTransferManager;
  status: TransferStatus;     // 'pending' | 'key-exchange' | 'transferring' | 'completed' | 'failed'
  progress: number;           // 0-100
  error: AppError | null;
  speed: number;              // bytes per second
  startTime: number | null;   // Unix timestamp
  endTime: number | null;     // Unix timestamp
  connectionQuality: ConnectionQuality; // 'excellent' | 'good' | 'fair' | 'poor'
}
```

**Example:**

```typescript
const recipient = manager.getRecipientState(recipientId);
if (recipient) {
  console.log(`${recipient.name}: ${recipient.progress}%`);
  console.log(`Speed: ${recipient.speed} bytes/s`);
  console.log(`Quality: ${recipient.connectionQuality}`);
}
```

---

### useGroupTransfer Hook

React hook for group transfer with automatic state management.

#### Signature

```typescript
function useGroupTransfer(
  options?: GroupTransferOptions
): UseGroupTransferResult
```

#### Returns

```typescript
interface UseGroupTransferResult {
  isInitializing: boolean;
  isTransferring: boolean;
  isCompleted: boolean;
  groupState: GroupTransferState | null;
  result: GroupTransferResult | null;
  error: string | null;
  initializeGroupTransfer: (
    transferId: string,
    fileName: string,
    fileSize: number,
    recipients: Array<{
      info: RecipientInfo;
      dataChannel: RTCDataChannel;
    }>
  ) => Promise<void>;
  sendToAll: (file: File) => Promise<GroupTransferResult>;
  cancel: () => void;
  reset: () => void;
  getRecipientName: (recipientId: string) => string;
}
```

#### Example

```typescript
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';

function GroupTransferComponent() {
  const {
    isTransferring,
    groupState,
    initializeGroupTransfer,
    sendToAll,
    cancel,
  } = useGroupTransfer({
    bandwidthLimitPerRecipient: 1024 * 1024,
    onRecipientComplete: (id) => {
      console.log(`Recipient ${id} done`);
    },
  });

  const handleTransfer = async (file: File, recipients: RecipientInfo[]) => {
    const recipientsWithChannels = await createChannels(recipients);
    await initializeGroupTransfer(
      generateUUID(),
      file.name,
      file.size,
      recipientsWithChannels
    );
    await sendToAll(file);
  };

  return (
    <div>
      {isTransferring && (
        <button onClick={cancel}>Cancel Transfer</button>
      )}
      {groupState && (
        <div>Progress: {groupState.totalProgress}%</div>
      )}
    </div>
  );
}
```

---

## Transfer Flow

### Complete Transfer Sequence

```
1. USER SELECTS FILE
   ↓
2. USER SELECTS RECIPIENTS (1-10)
   ↓
3. VALIDATION
   - Validate recipient info (UUID, name regex)
   - Check recipient count (1-10)
   - Validate file (size, type)
   ↓
4. CREATE DATA CHANNELS
   - Parallel WebRTC connection setup
   - STUN/TURN ICE negotiation
   - Data channel creation per recipient
   ↓
5. INITIALIZE GROUP TRANSFER
   - Create GroupTransferManager
   - Create PQCTransferManager per recipient
   - Setup progress tracking
   ↓
6. KEY EXCHANGE (Parallel)
   - ML-KEM-768 encapsulation (per recipient)
   - X25519 ECDH (per recipient)
   - Derive shared secrets
   - 30s timeout per recipient
   ↓
7. SEND FILE (Parallel)
   - Encrypt chunks with ChaCha20-Poly1305
   - Send via WebRTC data channels
   - Apply bandwidth throttling
   - Track progress per recipient
   ↓
8. MONITOR PROGRESS
   - Update every 100ms
   - Aggregate statistics
   - Handle individual failures
   ↓
9. COMPLETION
   - Generate GroupTransferResult
   - Report successes and failures
   - Clean up resources
```

### State Machine

```
IDLE
  ↓
PREPARING (initializeGroupTransfer)
  ↓
KEY_EXCHANGE (startKeyExchange)
  ↓
TRANSFERRING (sendToAll)
  ↓
  ├─→ COMPLETED (all success)
  ├─→ PARTIAL (some success)
  └─→ FAILED (all failed)
  ↓
IDLE (after reset)
```

---

## Encryption & Security

### Independent Encryption Per Recipient

Each recipient receives files through an independently encrypted channel:

```typescript
// For each recipient:
1. ML-KEM-768 Key Exchange
   - Generate keypair
   - Encapsulate with recipient's public key
   - Derive shared secret

2. X25519 ECDH
   - Generate ephemeral keypair
   - Perform ECDH with recipient's key
   - Derive shared secret

3. Combine Secrets
   - shared_secret = ML-KEM_secret XOR X25519_secret

4. Derive Session Keys
   - encryption_key = HKDF(shared_secret, "encryption")
   - auth_key = HKDF(shared_secret, "authentication")

5. Encrypt File Chunks
   - ChaCha20-Poly1305 AEAD
   - Unique nonce per chunk
   - Authentication tag per chunk
```

### Security Properties

- **Quantum Resistance**: ML-KEM-768 protects against quantum attacks
- **Forward Secrecy**: X25519 provides perfect forward secrecy
- **Isolation**: Compromise of one recipient doesn't affect others
- **Authentication**: AEAD ensures integrity and authenticity
- **No Key Reuse**: Each recipient gets unique session keys

### Validation

All recipient data is validated before processing:

```typescript
const RecipientInfoSchema = z.object({
  id: z.string().uuid('Invalid recipient ID format'),
  name: z.string()
    .min(1, 'Recipient name cannot be empty')
    .max(100, 'Recipient name too long')
    .regex(/^[a-zA-Z0-9 _-]+$/, 'Invalid characters'),
  deviceId: z.string()
    .min(1, 'Device ID cannot be empty')
    .max(50, 'Device ID too long'),
  socketId: z.string()
    .min(1, 'Socket ID cannot be empty')
    .max(100, 'Socket ID too long'),
});
```

**Protection Against:**
- XSS attacks (name sanitization)
- DoS attacks (count limits, size limits)
- Memory exhaustion (chunk size limits)
- Invalid data injection (schema validation)

---

## Progress Tracking

### Granular Progress Levels

#### 1. Per-Recipient Progress

```typescript
onRecipientProgress: (recipientId, progress, speed) => {
  console.log(`${recipientId}: ${progress}% @ ${speed} B/s`);
}
```

**Metrics:**
- `progress`: 0-100 percentage
- `speed`: Current transfer speed (bytes/second)
- `startTime`: Transfer start timestamp
- `endTime`: Transfer end timestamp (when complete)

#### 2. Aggregate Progress

```typescript
onOverallProgress: (progress) => {
  console.log(`Overall: ${progress}%`);
}
```

**Calculation:**

```typescript
totalProgress = (
  sum of all recipient progress values
) / number of recipients
```

#### 3. Status Tracking

```typescript
const state = manager.getState();
console.log('Success:', state.successCount);
console.log('Failed:', state.failureCount);
console.log('Pending:', state.pendingCount);
```

### Update Frequency

- **Progress updates**: Every 100ms
- **Statistics updates**: Every 100ms
- **State updates**: On status change

---

## Error Handling

### Error Types

```typescript
type TransferStatus =
  | 'pending'       // Not started
  | 'key-exchange'  // Performing key exchange
  | 'transferring'  // Actively transferring
  | 'completed'     // Successfully completed
  | 'failed';       // Failed with error
```

### Graceful Failure Handling

```typescript
// Individual failures don't stop other transfers
const result = await manager.sendToAll(file);

if (result.failedRecipients.length > 0) {
  console.log('Partial success - some transfers failed');

  // Option 1: Retry failed recipients
  for (const failed of result.failedRecipients) {
    console.error(`${failed.id} failed:`, failed.error);
    // Implement retry logic
  }

  // Option 2: Notify user
  showNotification(
    `${result.successfulRecipients.length} succeeded, ` +
    `${result.failedRecipients.length} failed`
  );
}
```

### Common Error Scenarios

#### 1. Key Exchange Timeout

```typescript
// Automatically handled with 30s timeout
onRecipientError: (id, error) => {
  if (error.message.includes('timeout')) {
    console.error(`${id}: Key exchange timeout`);
    // Recipient marked as 'failed', others continue
  }
}
```

#### 2. Connection Lost During Transfer

```typescript
onRecipientError: (id, error) => {
  if (error.message.includes('connection')) {
    console.error(`${id}: Connection lost`);
    // Implement reconnection logic
    retryRecipient(id);
  }
}
```

#### 3. Bandwidth Saturation

```typescript
// Monitor speed and adjust
onRecipientProgress: (id, progress, speed) => {
  if (speed < expectedSpeed * 0.5) {
    console.warn(`${id}: Low speed detected`);
    // Consider reducing bandwidth limit
  }
}
```

---

## Integration Guide

### Integration with P2P Connection

```typescript
import { useP2PConnection } from '@/lib/hooks/use-p2p-connection';
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';

function P2PGroupTransfer() {
  const { createDataChannel } = useP2PConnection();
  const { initializeGroupTransfer, sendToAll } = useGroupTransfer();

  const sendToMultiple = async (file: File, deviceIds: string[]) => {
    // Create data channels for each recipient
    const recipients = await Promise.all(
      deviceIds.map(async (id) => {
        const channel = await createDataChannel(id);
        return {
          info: {
            id,
            name: getDeviceName(id),
            deviceId: id,
            socketId: getSocketId(id),
          },
          dataChannel: channel,
        };
      })
    );

    await initializeGroupTransfer(
      generateUUID(),
      file.name,
      file.size,
      recipients
    );

    const result = await sendToAll(file);
    return result;
  };

  return <button onClick={() => sendToMultiple(file, devices)}>Send</button>;
}
```

### Integration with Friends List

```typescript
import { useFriends } from '@/lib/storage/friends';
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';

function SendToFriends() {
  const { friends } = useFriends();
  const { initializeGroupTransfer, sendToAll } = useGroupTransfer();

  const sendToAllFriends = async (file: File) => {
    const onlineFriends = friends.filter(f => f.online);

    const recipients = await createChannelsForFriends(onlineFriends);

    await initializeGroupTransfer(
      generateUUID(),
      file.name,
      file.size,
      recipients
    );

    return await sendToAll(file);
  };

  return <button onClick={() => sendToAllFriends(file)}>Send to All Friends</button>;
}
```

### Integration with Transfer Rooms

```typescript
import { useTransferRoom } from '@/lib/hooks/use-transfer-room';

function RoomGroupTransfer() {
  const { room, members } = useTransferRoom();
  const { initializeGroupTransfer, sendToAll } = useGroupTransfer();

  const sendToRoom = async (file: File) => {
    const recipients = members.map(member => ({
      info: {
        id: member.id,
        name: member.name,
        deviceId: member.deviceId,
        socketId: member.socketId,
      },
      dataChannel: member.dataChannel,
    }));

    await initializeGroupTransfer(
      generateUUID(),
      file.name,
      file.size,
      recipients
    );

    return await sendToAll(file);
  };

  return <button onClick={() => sendToRoom(file)}>Send to Room</button>;
}
```

---

## Code Examples

### Example 1: Basic Group Transfer

```typescript
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';
import { Button } from '@/components/ui/button';

function BasicGroupTransfer({ file, recipients }: Props) {
  const {
    isTransferring,
    groupState,
    sendToAll,
  } = useGroupTransfer();

  const handleSend = async () => {
    const recipientsWithChannels = await setupChannels(recipients);
    await initializeGroupTransfer(
      generateUUID(),
      file.name,
      file.size,
      recipientsWithChannels
    );
    await sendToAll(file);
  };

  return (
    <div>
      <Button onClick={handleSend} disabled={isTransferring}>
        Send to {recipients.length} Recipients
      </Button>

      {groupState && (
        <div>Progress: {groupState.totalProgress}%</div>
      )}
    </div>
  );
}
```

### Example 2: With Recipient Selection UI

```typescript
import { useState } from 'react';
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';
import { RecipientSelector } from '@/components/app/RecipientSelector';

function GroupTransferWithSelector({ file, devices }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSelector, setShowSelector] = useState(false);

  const { initializeGroupTransfer, sendToAll } = useGroupTransfer({
    onRecipientComplete: (id) => {
      toast.success(`Transfer to ${id} complete`);
    },
    onComplete: (result) => {
      toast.success(`${result.successfulRecipients.length} transfers completed`);
    },
  });

  const handleConfirm = async () => {
    const selected = devices.filter(d => selectedIds.includes(d.id));
    const recipients = await createChannels(selected);

    await initializeGroupTransfer(
      generateUUID(),
      file.name,
      file.size,
      recipients
    );

    await sendToAll(file);
    setShowSelector(false);
  };

  return (
    <>
      <Button onClick={() => setShowSelector(true)}>
        Select Recipients
      </Button>

      <RecipientSelector
        open={showSelector}
        onOpenChange={setShowSelector}
        availableDevices={devices}
        selectedDeviceIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onConfirm={handleConfirm}
        maxRecipients={10}
      />
    </>
  );
}
```

### Example 3: With Progress Tracking

```typescript
import { GroupTransferProgress } from '@/components/app/GroupTransferProgress';

function GroupTransferWithProgress() {
  const {
    isTransferring,
    groupState,
    sendToAll,
  } = useGroupTransfer();

  return (
    <div>
      {isTransferring && groupState && (
        <GroupTransferProgress
          open={isTransferring}
          onOpenChange={() => {}}
          groupState={groupState}
          onRecipientNameLookup={(id) => getRecipientName(id)}
        />
      )}
    </div>
  );
}
```

### Example 4: With Bandwidth Throttling

```typescript
function ThrottledGroupTransfer() {
  const [bandwidth, setBandwidth] = useState(1024 * 1024); // 1 MB/s

  const { initializeGroupTransfer, sendToAll } = useGroupTransfer({
    bandwidthLimitPerRecipient: bandwidth,
  });

  return (
    <div>
      <label>
        Bandwidth per recipient:
        <select onChange={(e) => setBandwidth(Number(e.target.value))}>
          <option value={512 * 1024}>512 KB/s</option>
          <option value={1024 * 1024}>1 MB/s</option>
          <option value={2 * 1024 * 1024}>2 MB/s</option>
          <option value={0}>Unlimited</option>
        </select>
      </label>
    </div>
  );
}
```

### Example 5: With Error Handling

```typescript
function RobustGroupTransfer() {
  const [failedRecipients, setFailedRecipients] = useState<string[]>([]);

  const {
    sendToAll,
    error,
  } = useGroupTransfer({
    onRecipientError: (id, error) => {
      console.error(`${id} failed:`, error);
      setFailedRecipients(prev => [...prev, id]);
    },
    onComplete: (result) => {
      if (result.failedRecipients.length > 0) {
        toast.error(
          `${result.failedRecipients.length} transfers failed`,
          {
            action: {
              label: 'Retry',
              onClick: () => retryFailed(result.failedRecipients),
            },
          }
        );
      }
    },
  });

  const retryFailed = async (failed: Array<{ id: string }>) => {
    // Re-attempt failed transfers
    const recipientsToRetry = failed.map(f => getRecipient(f.id));
    // ... retry logic
  };

  return (
    <div>
      {error && <Alert variant="destructive">{error}</Alert>}
      {failedRecipients.length > 0 && (
        <Button onClick={() => retryFailed(failedRecipients.map(id => ({ id })))}>
          Retry {failedRecipients.length} Failed Transfers
        </Button>
      )}
    </div>
  );
}
```

### Example 6: Production-Ready Implementation

```typescript
import { useState, useEffect } from 'react';
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';
import { RecipientSelector } from '@/components/app/RecipientSelector';
import { GroupTransferProgress } from '@/components/app/GroupTransferProgress';
import { GroupTransferConfirmDialog } from '@/components/app/GroupTransferConfirmDialog';
import { toast } from 'sonner';

function ProductionGroupTransfer({ file, devices }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const {
    isInitializing,
    isTransferring,
    groupState,
    result,
    error,
    initializeGroupTransfer,
    sendToAll,
    cancel,
    reset,
    getRecipientName,
  } = useGroupTransfer({
    bandwidthLimitPerRecipient: 1024 * 1024, // 1 MB/s
    onRecipientProgress: (id, progress, speed) => {
      console.log(`${getRecipientName(id)}: ${progress}% @ ${speed} B/s`);
    },
    onRecipientComplete: (id) => {
      toast.success(`Transfer to ${getRecipientName(id)} complete`);
    },
    onRecipientError: (id, error) => {
      toast.error(`Transfer to ${getRecipientName(id)} failed: ${error.message}`);
    },
    onComplete: (result) => {
      const successCount = result.successfulRecipients.length;
      const failCount = result.failedRecipients.length;

      if (failCount === 0) {
        toast.success(`All ${successCount} transfers completed successfully`);
      } else {
        toast.warning(`${successCount} succeeded, ${failCount} failed`);
      }

      setShowProgress(false);
    },
  });

  // Show progress when transferring
  useEffect(() => {
    if (isTransferring) {
      setShowProgress(true);
    }
  }, [isTransferring]);

  const handleSelectConfirm = () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    setShowSelector(false);
    setShowConfirm(true);
  };

  const handleConfirmTransfer = async () => {
    setShowConfirm(false);

    try {
      const selected = devices.filter(d => selectedIds.includes(d.id));

      // Create data channels
      const recipients = await Promise.all(
        selected.map(async (device) => {
          const dataChannel = await createDataChannel(device.id);
          return {
            info: {
              id: device.id,
              name: device.name,
              deviceId: device.id,
              socketId: device.socketId,
            },
            dataChannel,
          };
        })
      );

      // Initialize group transfer
      await initializeGroupTransfer(
        generateUUID(),
        file.name,
        file.size,
        recipients
      );

      // Send file
      await sendToAll(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Transfer failed: ${message}`);
      reset();
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowSelector(true)}
        disabled={isInitializing || isTransferring}
      >
        Send to Multiple Recipients
      </Button>

      {/* Recipient Selection */}
      <RecipientSelector
        open={showSelector}
        onOpenChange={setShowSelector}
        availableDevices={devices}
        selectedDeviceIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onConfirm={handleSelectConfirm}
        minRecipients={1}
        maxRecipients={10}
      />

      {/* Transfer Confirmation */}
      <GroupTransferConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        fileName={file.name}
        fileSize={file.size}
        recipientCount={selectedIds.length}
        onConfirm={handleConfirmTransfer}
        onCancel={() => {
          setShowConfirm(false);
          setSelectedIds([]);
        }}
      />

      {/* Progress Tracking */}
      <GroupTransferProgress
        open={showProgress}
        onOpenChange={setShowProgress}
        groupState={groupState}
        onRecipientNameLookup={getRecipientName}
        onCancel={cancel}
      />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Transfer Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Summary */}
      {result && !isTransferring && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">Transfer Complete</h3>
          <div className="space-y-1 text-sm">
            <div>Total Recipients: {result.totalRecipients}</div>
            <div className="text-green-600">
              Successful: {result.successfulRecipients.length}
            </div>
            {result.failedRecipients.length > 0 && (
              <div className="text-red-600">
                Failed: {result.failedRecipients.length}
              </div>
            )}
            <div>Total Time: {(result.totalTime / 1000).toFixed(1)}s</div>
          </div>
          <Button className="mt-2" onClick={reset}>
            Send Another
          </Button>
        </div>
      )}
    </>
  );
}

export default ProductionGroupTransfer;
```

---

## Troubleshooting

### Common Issues

#### Issue 1: All Transfers Fail Immediately

**Symptoms:**
- All recipients show 'failed' status
- Error: "Data channel not open"

**Causes:**
1. WebRTC connections not established
2. Data channels not open
3. ICE candidates not exchanged

**Solutions:**
```typescript
// 1. Verify data channel state before initializing
recipients.forEach(r => {
  if (r.dataChannel.readyState !== 'open') {
    console.error(`${r.info.name}: Data channel not open`);
  }
});

// 2. Wait for channel to open
const waitForChannel = (channel: RTCDataChannel) => {
  return new Promise<void>((resolve, reject) => {
    if (channel.readyState === 'open') {
      resolve();
      return;
    }
    channel.addEventListener('open', () => resolve());
    channel.addEventListener('error', () => reject());
    setTimeout(() => reject(new Error('Timeout')), 10000);
  });
};

// 3. Check TURN server configuration
```

#### Issue 2: Some Recipients Timeout

**Symptoms:**
- Key exchange timeout after 30s
- Some transfers fail, others succeed

**Causes:**
1. Network congestion
2. Firewall blocking
3. Poor connection quality

**Solutions:**
```typescript
// 1. Increase timeout (not recommended)
// 2. Use TURN relay for problematic recipients
const iceServers = [
  {
    urls: 'turn:turn.tallow.app:3478',
    username: 'user',
    credential: 'pass',
  },
];

// 3. Retry failed recipients
const retryFailed = async (failed: Array<{ id: string }>) => {
  for (const { id } of failed) {
    await retryRecipient(id);
  }
};
```

#### Issue 3: Slow Transfer Speeds

**Symptoms:**
- Transfer speed below expected
- Long transfer times

**Causes:**
1. Bandwidth limit too low
2. Network congestion
3. Too many concurrent recipients

**Solutions:**
```typescript
// 1. Increase or remove bandwidth limit
useGroupTransfer({
  bandwidthLimitPerRecipient: 2 * 1024 * 1024, // 2 MB/s
});

// 2. Reduce number of concurrent transfers
const BATCH_SIZE = 5;
const batches = chunk(recipients, BATCH_SIZE);

for (const batch of batches) {
  await sendToBatch(batch);
}

// 3. Monitor and adjust dynamically
onRecipientProgress: (id, progress, speed) => {
  if (speed < expectedSpeed * 0.5) {
    adjustBandwidth(id, bandwidth * 1.2);
  }
}
```

#### Issue 4: Memory Issues with Many Recipients

**Symptoms:**
- Browser becomes slow/unresponsive
- Out of memory errors

**Causes:**
1. Too many concurrent connections (>10)
2. Large files with many recipients
3. Memory leaks in cleanup

**Solutions:**
```typescript
// 1. Enforce recipient limit
const MAX_RECIPIENTS = 10;
if (recipients.length > MAX_RECIPIENTS) {
  throw new Error(`Maximum ${MAX_RECIPIENTS} recipients allowed`);
}

// 2. Batch processing for large recipient lists
const processBatches = async (recipients: RecipientInfo[], file: File) => {
  const batches = chunk(recipients, 10);

  for (const batch of batches) {
    const result = await sendToBatch(batch, file);
    cleanup(); // Clean up after each batch
  }
};

// 3. Proper cleanup
useEffect(() => {
  return () => {
    cancel(); // Cancel all transfers
    reset();  // Reset state
  };
}, []);
```

### Debugging Tools

#### Enable Verbose Logging

```typescript
// Set in environment or code
process.env.DEBUG = 'group-transfer:*';

// In group-transfer-manager.ts
const DEBUG = true;
if (DEBUG) {
  console.log('[GroupTransfer] State:', state);
  console.log('[GroupTransfer] Recipient progress:', recipientId, progress);
}
```

#### Monitor WebRTC Connections

```
Visit chrome://webrtc-internals for detailed diagnostics:
- Active peer connections
- ICE candidate pairs
- Data channel states
- Bandwidth usage
- Packet loss statistics
```

---

## Performance Tuning

### Bandwidth Optimization

```typescript
// Dynamic bandwidth allocation
const adjustBandwidth = (totalBandwidth: number, recipientCount: number) => {
  const perRecipient = Math.floor(totalBandwidth / recipientCount);

  return {
    bandwidthLimitPerRecipient: perRecipient,
  };
};

// Monitor and adjust
onRecipientProgress: (id, progress, speed) => {
  if (speed > bandwidthLimit * 0.9) {
    // Near limit, can increase
    increaseBandwidth(id);
  }
}
```

### Parallel Efficiency

```typescript
// Optimize chunk size for parallel transfers
const CHUNK_SIZE = 64 * 1024; // 64 KB

// Balance between:
// - Smaller chunks: More overhead, better progress granularity
// - Larger chunks: Less overhead, less frequent updates

// Recommended: 64 KB for <10 MB files, 256 KB for >10 MB files
```

### Memory Management

```typescript
// Clean up completed transfers
onRecipientComplete: (id) => {
  const recipient = manager.getRecipientState(id);
  if (recipient) {
    recipient.manager.cleanup();
    recipient.dataChannel?.close();
  }
};

// Limit concurrent operations
const MAX_CONCURRENT = 10;
const semaphore = new Semaphore(MAX_CONCURRENT);

for (const recipient of recipients) {
  await semaphore.acquire();
  transferToRecipient(recipient).finally(() => semaphore.release());
}
```

---

## Testing Strategies

### Unit Testing

```typescript
// tests/unit/transfer/group-transfer-manager.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GroupTransferManager } from '@/lib/transfer/group-transfer-manager';

describe('GroupTransferManager', () => {
  let manager: GroupTransferManager;

  beforeEach(() => {
    manager = new GroupTransferManager();
  });

  it('should initialize with recipients', async () => {
    const recipients = [
      createMockRecipient('recipient-1'),
      createMockRecipient('recipient-2'),
    ];

    await manager.initializeGroupTransfer(
      'transfer-1',
      'test.txt',
      1024,
      recipients
    );

    const state = manager.getState();
    expect(state).not.toBeNull();
    expect(state!.recipients).toHaveLength(2);
  });

  it('should handle parallel transfers', async () => {
    const recipients = [
      createMockRecipient('recipient-1'),
      createMockRecipient('recipient-2'),
    ];

    await manager.initializeGroupTransfer(
      'transfer-1',
      'test.txt',
      1024,
      recipients
    );

    const file = new File(['content'], 'test.txt');
    const result = await manager.sendToAll(file);

    expect(result.successfulRecipients).toHaveLength(2);
    expect(result.failedRecipients).toHaveLength(0);
  });

  it('should handle partial failure', async () => {
    const recipients = [
      createMockRecipient('recipient-1', { shouldFail: false }),
      createMockRecipient('recipient-2', { shouldFail: true }),
    ];

    await manager.initializeGroupTransfer(
      'transfer-1',
      'test.txt',
      1024,
      recipients
    );

    const result = await manager.sendToAll(new File(['content'], 'test.txt'));

    expect(result.successfulRecipients).toHaveLength(1);
    expect(result.failedRecipients).toHaveLength(1);
  });
});
```

### Integration Testing

```typescript
// tests/integration/group-transfer.test.ts
import { renderHook, act } from '@testing-library/react';
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';

describe('useGroupTransfer', () => {
  it('should manage group transfer lifecycle', async () => {
    const { result } = renderHook(() => useGroupTransfer());

    expect(result.current.isTransferring).toBe(false);

    // Initialize
    await act(async () => {
      await result.current.initializeGroupTransfer(
        'transfer-1',
        'test.txt',
        1024,
        mockRecipients
      );
    });

    expect(result.current.groupState).not.toBeNull();

    // Send
    await act(async () => {
      await result.current.sendToAll(mockFile);
    });

    expect(result.current.isCompleted).toBe(true);
  });
});
```

### E2E Testing

```typescript
// tests/e2e/group-transfer.spec.ts
import { test, expect } from '@playwright/test';

test('should send file to multiple recipients', async ({ page }) => {
  await page.goto('/app');

  // Select file
  await page.setInputFiles('input[type=file]', 'test.txt');

  // Open recipient selector
  await page.click('text=Send to Multiple');

  // Select recipients
  await page.click('[data-recipient-id="recipient-1"]');
  await page.click('[data-recipient-id="recipient-2"]');

  // Confirm
  await page.click('text=Confirm');

  // Wait for transfer to complete
  await expect(page.locator('text=Transfer Complete')).toBeVisible({
    timeout: 30000,
  });

  // Verify results
  const successText = await page.locator('[data-testid="success-count"]').textContent();
  expect(successText).toContain('2');
});
```

---

## Deployment Guide

### Environment Variables

```bash
# .env.production
NEXT_PUBLIC_MAX_GROUP_RECIPIENTS=10
NEXT_PUBLIC_DEFAULT_BANDWIDTH_LIMIT=1048576  # 1 MB/s
NEXT_PUBLIC_KEY_EXCHANGE_TIMEOUT=30000        # 30 seconds
```

### Build Configuration

```typescript
// next.config.ts
const config = {
  env: {
    MAX_GROUP_RECIPIENTS: process.env.NEXT_PUBLIC_MAX_GROUP_RECIPIENTS || '10',
  },
};
```

### Production Monitoring

```typescript
// Monitor group transfer performance
import * as Sentry from '@sentry/nextjs';

const manager = new GroupTransferManager({
  onComplete: (result) => {
    // Track success rate
    Sentry.addBreadcrumb({
      category: 'group-transfer',
      message: `Transfer complete: ${result.successfulRecipients.length}/${result.totalRecipients} successful`,
      level: 'info',
    });

    // Alert on high failure rate
    const failureRate = result.failedRecipients.length / result.totalRecipients;
    if (failureRate > 0.3) {
      Sentry.captureMessage(
        `High failure rate in group transfer: ${failureRate * 100}%`,
        'warning'
      );
    }
  },
  onRecipientError: (id, error) => {
    Sentry.captureException(error, {
      tags: {
        feature: 'group-transfer',
        recipientId: id,
      },
    });
  },
});
```

---

## Best Practices

### 1. Recipient Limits

```typescript
// Enforce maximum recipients
const MAX_RECIPIENTS = 10;

if (recipients.length > MAX_RECIPIENTS) {
  toast.error(`Maximum ${MAX_RECIPIENTS} recipients allowed`);
  return;
}
```

### 2. File Size Warnings

```typescript
// Warn for large files
const FILE_SIZE_WARNING = 100 * 1024 * 1024; // 100 MB

if (file.size > FILE_SIZE_WARNING && recipients.length > 5) {
  const confirmed = await confirm(
    `Sending ${fileSize(file.size)} to ${recipients.length} recipients. Continue?`
  );
  if (!confirmed) return;
}
```

### 3. Progress Feedback

```typescript
// Always show progress for group transfers
{isTransferring && (
  <GroupTransferProgress
    groupState={groupState}
    onRecipientNameLookup={getRecipientName}
  />
)}
```

### 4. Error Recovery

```typescript
// Provide retry options
onComplete: (result) => {
  if (result.failedRecipients.length > 0) {
    showRetryDialog({
      failed: result.failedRecipients,
      onRetry: (ids) => retryFailed(ids),
    });
  }
}
```

### 5. Bandwidth Management

```typescript
// Start conservative, increase if needed
const initialBandwidth = 512 * 1024; // 512 KB/s

useGroupTransfer({
  bandwidthLimitPerRecipient: initialBandwidth,
  onRecipientProgress: (id, progress, speed) => {
    // Auto-increase if consistently fast
    if (speed > initialBandwidth * 0.9) {
      increaseBandwidth();
    }
  },
});
```

---

## Conclusion

This comprehensive API documentation covers all aspects of group transfer in Tallow. Key takeaways:

- **1-to-Many Architecture**: Efficient parallel transfers with independent encryption
- **Post-Quantum Security**: ML-KEM-768 + X25519 per recipient
- **Graceful Failure**: Individual failures don't affect others
- **Bandwidth Control**: Per-recipient throttling
- **Production Ready**: Comprehensive error handling, monitoring, and testing

### Quick Links

- **Source Code**: `lib/transfer/group-transfer-manager.ts`
- **React Hook**: `lib/hooks/use-group-transfer.ts`
- **UI Components**: `components/app/Recipient*.tsx`, `GroupTransfer*.tsx`
- **Tests**: `tests/unit/transfer/group-transfer-manager.test.ts`

### Support

For questions or issues:
- GitHub Issues
- Documentation: `/docs`
- Email: support@tallow.app

---

**Last Updated:** 2026-01-28
**Version:** 1.0.0
**Status:** ✅ Production Ready (100/100)
