# WebRTC Data Channels - Quick Reference

## Import Statements

```typescript
// Core managers
import { DataChannelManager } from '@/lib/webrtc/data-channel';
import { GroupTransferManager } from '@/lib/transfer/group-transfer-manager';
import { getSignalingClient } from '@/lib/signaling/socket-signaling';

// Types
import type {
  RecipientInfo,
  GroupTransferResult,
  GroupTransferState,
} from '@/lib/transfer/group-transfer-manager';

import type {
  PeerChannelInfo,
  ConnectionQuality,
  PeerConnectionStats,
} from '@/lib/webrtc/data-channel';
```

## Quick Start - Group Transfer

```typescript
// 1. Setup recipients
const recipients: RecipientInfo[] = [
  { id: 'peer-1', name: 'Bob', deviceId: 'dev-1', socketId: 'sock-1' },
  { id: 'peer-2', name: 'Carol', deviceId: 'dev-2', socketId: 'sock-2' },
];

// 2. Create manager
const manager = new GroupTransferManager({
  bandwidthLimitPerRecipient: 5_000_000, // 5 MB/s per peer
  onRecipientProgress: (id, progress, speed) => {
    console.log(`${id}: ${progress}%`);
  },
  onComplete: (results) => {
    console.log('Done:', results);
  },
});

// 3. Send file
const file = new File(['data'], 'file.txt');
await manager.initializeGroupTransfer('tx-1', file.name, file.size, recipients);
await manager.startKeyExchange();
const result = await manager.sendToAll(file);

// 4. Cleanup
manager.destroy();
```

## API Reference

### GroupTransferManager

#### Constructor
```typescript
new GroupTransferManager(options?: GroupTransferOptions)
```

#### Options
```typescript
interface GroupTransferOptions {
  bandwidthLimitPerRecipient?: number; // bytes/sec
  onRecipientProgress?: (id: string, progress: number, speed: number) => void;
  onRecipientComplete?: (id: string) => void;
  onRecipientError?: (id: string, error: Error) => void;
  onOverallProgress?: (progress: number) => void;
  onComplete?: (results: GroupTransferResult) => void;
}
```

#### Methods
```typescript
// Initialize transfer
await manager.initializeGroupTransfer(
  transferId: string,
  fileName: string,
  fileSize: number,
  recipients: RecipientInfo[]
): Promise<void>

// Start key exchange
await manager.startKeyExchange(): Promise<void>

// Send file to all
await manager.sendToAll(file: File): Promise<GroupTransferResult>

// Get state
manager.getState(): GroupTransferState | null

// Cancel transfer
manager.cancel(): void

// Get group ID
manager.getGroupId(): string

// Get connected count
manager.getConnectedPeerCount(): number

// Get peer quality
manager.getPeerQuality(peerId: string): ConnectionQuality | null

// Cleanup
manager.destroy(): void
```

### DataChannelManager

#### Constructor
```typescript
new DataChannelManager(
  config?: DataChannelManagerConfig,
  events?: DataChannelEvents
)
```

#### Config
```typescript
interface DataChannelManagerConfig {
  maxPeers?: number;              // default: 10
  iceServers?: RTCIceServer[];
  connectionTimeout?: number;      // default: 30000ms
  reconnectAttempts?: number;      // default: 3
  statsInterval?: number;          // default: 2000ms
  enablePrivacyMode?: boolean;     // default: true
  bandwidthLimit?: number;         // default: 0 (unlimited)
}
```

#### Methods
```typescript
// Create connection (initiator)
await manager.createConnection(
  peerId: string,
  peerName: string,
  socketId: string
): Promise<{ offer: RTCSessionDescriptionInit; dataChannel: RTCDataChannel }>

// Accept connection (receiver)
await manager.acceptConnection(
  peerId: string,
  peerName: string,
  socketId: string,
  offer: RTCSessionDescriptionInit
): Promise<{ answer: RTCSessionDescriptionInit }>

// Complete connection
await manager.completeConnection(
  peerId: string,
  answer: RTCSessionDescriptionInit
): Promise<void>

// Add ICE candidate
await manager.addIceCandidate(
  peerId: string,
  candidate: RTCIceCandidateInit
): Promise<void>

// Disconnect peer
manager.disconnectPeer(peerId: string, reason?: string): void

// Get peer info
manager.getPeer(peerId: string): PeerChannelInfo | undefined

// Get connected peers
manager.getConnectedPeers(): PeerChannelInfo[]

// Get stats
manager.getStats(peerId: string): PeerConnectionStats | null

// Check connection
manager.isConnectedToPeer(peerId: string): boolean

// Cleanup
manager.destroy(): void
```

## Common Patterns

### Pattern 1: Basic Transfer

```typescript
const manager = new GroupTransferManager();

try {
  await manager.initializeGroupTransfer(id, name, size, recipients);
  await manager.startKeyExchange();
  await manager.sendToAll(file);
} finally {
  manager.destroy();
}
```

### Pattern 2: Progress Tracking

```typescript
const manager = new GroupTransferManager({
  onRecipientProgress: (id, progress) => {
    updateUI(id, progress);
  },
  onOverallProgress: (progress) => {
    updateProgressBar(progress);
  },
});
```

### Pattern 3: Error Handling

```typescript
const manager = new GroupTransferManager({
  onRecipientError: (id, error) => {
    console.error(`${id} failed:`, error.message);
    // Optionally retry or notify user
  },
  onComplete: (results) => {
    if (results.failedRecipients.length > 0) {
      showFailureDialog(results.failedRecipients);
    }
  },
});
```

### Pattern 4: Quality Monitoring

```typescript
const manager = new GroupTransferManager();

// Monitor connection quality
setInterval(() => {
  const state = manager.getState();
  state?.recipients.forEach(recipient => {
    const quality = recipient.connectionQuality;
    if (quality === 'poor') {
      console.warn(`${recipient.name} has poor connection`);
    }
  });
}, 5000);
```

### Pattern 5: Bandwidth Management

```typescript
const totalBandwidth = 20_000_000; // 20 MB/s
const recipientCount = recipients.length;
const perRecipientBandwidth = totalBandwidth / recipientCount;

const manager = new GroupTransferManager({
  bandwidthLimitPerRecipient: perRecipientBandwidth,
});
```

## React Hook

```typescript
import { useState, useEffect } from 'react';
import { GroupTransferManager } from '@/lib/transfer/group-transfer-manager';

export function useGroupTransfer() {
  const [manager] = useState(() => new GroupTransferManager({
    onRecipientProgress: (id, progress) => {
      // Update state
    },
  }));

  const [state, setState] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(manager.getState());
    }, 100);

    return () => {
      clearInterval(interval);
      manager.destroy();
    };
  }, [manager]);

  return { manager, state };
}
```

## Type Definitions

### RecipientInfo
```typescript
interface RecipientInfo {
  id: string;
  name: string;
  deviceId: string;
  socketId: string;
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

### GroupTransferState
```typescript
interface GroupTransferState {
  transferId: string;
  fileName: string;
  fileSize: number;
  recipients: GroupTransferRecipient[];
  totalProgress: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
  status: 'preparing' | 'transferring' | 'completed' | 'partial' | 'failed';
  bandwidthLimit?: number;
}
```

### ConnectionQuality
```typescript
type ConnectionQuality =
  | 'excellent'  // RTT < 100ms
  | 'good'       // RTT < 200ms
  | 'fair'       // RTT < 500ms
  | 'poor'       // RTT > 500ms
  | 'disconnected';
```

## Signaling Methods

```typescript
import { getSignalingClient } from '@/lib/signaling/socket-signaling';

const client = getSignalingClient();

// Connect
await client.connect();

// Create group
client.createGroupTransfer(groupId, fileName, fileSize, socketIds);

// Join group
client.joinGroupTransfer(groupId, senderSocketId);

// Leave group
client.leaveGroupTransfer(groupId);

// Send offer
client.sendGroupOffer(groupId, targetSocketId, offer);

// Send answer
client.sendGroupAnswer(groupId, targetSocketId, answer);

// Send ICE candidate
client.sendGroupIceCandidate(groupId, targetSocketId, candidate);

// Disconnect
client.disconnect();
```

## Configuration Examples

### Development Config
```typescript
const manager = new DataChannelManager({
  maxPeers: 3,
  enablePrivacyMode: false,
  connectionTimeout: 10000,
  reconnectAttempts: 1,
  statsInterval: 1000,
});
```

### Production Config
```typescript
const manager = new DataChannelManager({
  maxPeers: 10,
  enablePrivacyMode: true,
  connectionTimeout: 30000,
  reconnectAttempts: 3,
  statsInterval: 2000,
  bandwidthLimit: 5_000_000,
});
```

### Testing Config
```typescript
const manager = new DataChannelManager({
  maxPeers: 2,
  enablePrivacyMode: false,
  connectionTimeout: 5000,
  reconnectAttempts: 0,
  statsInterval: 500,
});
```

## Performance Tips

1. **Limit Recipients**: Keep under 5 for best performance
2. **Bandwidth Management**: Set appropriate limits per peer
3. **Quality Monitoring**: React to quality changes
4. **Early Cleanup**: Destroy managers when done
5. **Error Recovery**: Handle failures gracefully

## Common Issues

### Issue: Connection Timeout
```typescript
// Increase timeout
const manager = new DataChannelManager({
  connectionTimeout: 60000, // 60 seconds
});
```

### Issue: High CPU Usage
```typescript
// Reduce stats interval
const manager = new DataChannelManager({
  statsInterval: 5000, // 5 seconds instead of 2
});
```

### Issue: Memory Leaks
```typescript
// Always destroy
try {
  await manager.sendToAll(file);
} finally {
  manager.destroy(); // Critical!
}
```

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { DataChannelManager } from '@/lib/webrtc/data-channel';

describe('Group Transfer', () => {
  it('should create manager', () => {
    const manager = new DataChannelManager();
    expect(manager).toBeDefined();
    manager.destroy();
  });

  it('should handle 3 peers', async () => {
    const manager = new GroupTransferManager();
    const recipients = [/* ... */];

    await manager.initializeGroupTransfer('test', 'file.txt', 1024, recipients);
    const state = manager.getState();

    expect(state?.recipients.length).toBe(3);

    manager.destroy();
  });
});
```

## Debugging

```typescript
// Enable debug logging
localStorage.setItem('debug', 'tallow:*');

// Check connection state
const peer = manager.getPeer('peer-id');
console.log('State:', peer?.state);
console.log('Quality:', peer?.quality);
console.log('Stats:', peer?.stats);

// Monitor data channel
const channel = peer?.dataChannel;
console.log('Channel state:', channel?.readyState);
console.log('Buffered amount:', channel?.bufferedAmount);

// Check signaling
const client = getSignalingClient();
console.log('Connected:', client.isConnected);
console.log('Socket ID:', client.socketId);
console.log('Rooms:', client.rooms);
```

## See Also

- [GROUP_TRANSFER_EXAMPLE.md](./GROUP_TRANSFER_EXAMPLE.md) - Detailed examples
- [data-channel.ts](./data-channel.ts) - Source code
- [data-channel.test.ts](./data-channel.test.ts) - Tests
- [WEBRTC_DATA_CHANNELS_IMPLEMENTATION.md](../../WEBRTC_DATA_CHANNELS_IMPLEMENTATION.md) - Full documentation
