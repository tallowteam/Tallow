# Group Transfer with WebRTC Data Channels - Usage Guide

This guide demonstrates how to use the WebRTC data channel implementation for group file transfers in Tallow.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Group Transfer Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Sender (Alice)                                              │
│  ├─ GroupTransferManager                                     │
│  ├─ DataChannelManager                                       │
│  │   ├─ PeerConnection 1 → Bob                              │
│  │   ├─ PeerConnection 2 → Carol                            │
│  │   └─ PeerConnection 3 → Dave                             │
│  └─ SignalingClient (Socket.IO)                             │
│      └─ Coordinates WebRTC setup                            │
│                                                               │
│  Each PeerConnection:                                        │
│  ├─ RTCDataChannel (ordered, reliable)                      │
│  ├─ PQCTransferManager (ML-KEM-768 + X25519)               │
│  ├─ Independent progress tracking                           │
│  └─ Bandwidth throttling                                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Basic Usage

### 1. Initialize Group Transfer Manager

```typescript
import { GroupTransferManager } from '@/lib/transfer/group-transfer-manager';
import { RecipientInfo } from '@/lib/transfer/group-transfer-manager';

// Define recipients
const recipients: RecipientInfo[] = [
  {
    id: 'user-bob-123',
    name: 'Bob',
    deviceId: 'device-bob-456',
    socketId: 'socket-bob-789', // From signaling server
  },
  {
    id: 'user-carol-234',
    name: 'Carol',
    deviceId: 'device-carol-567',
    socketId: 'socket-carol-890',
  },
  {
    id: 'user-dave-345',
    name: 'Dave',
    deviceId: 'device-dave-678',
    socketId: 'socket-dave-901',
  },
];

// Create manager with options
const manager = new GroupTransferManager({
  bandwidthLimitPerRecipient: 5_000_000, // 5 MB/s per recipient
  onRecipientProgress: (recipientId, progress, speed) => {
    console.log(`${recipientId}: ${progress}% at ${speed} bytes/s`);
  },
  onRecipientComplete: (recipientId) => {
    console.log(`${recipientId}: Transfer complete`);
  },
  onRecipientError: (recipientId, error) => {
    console.error(`${recipientId}: Error - ${error.message}`);
  },
  onOverallProgress: (progress) => {
    console.log(`Overall progress: ${progress}%`);
  },
  onComplete: (results) => {
    console.log('Group transfer complete:', results);
  },
});
```

### 2. Initialize Transfer Session

```typescript
// Initialize with file info and recipients
await manager.initializeGroupTransfer(
  'transfer-id-123',
  'presentation.pdf',
  10_485_760, // 10 MB
  recipients
);

// This will:
// 1. Create DataChannelManager
// 2. Connect to signaling server
// 3. Create WebRTC peer connections to all recipients
// 4. Setup data channels for each peer
// 5. Initialize PQC encryption for each connection
```

### 3. Start Key Exchange

```typescript
// Perform hybrid PQC key exchange with all recipients
await manager.startKeyExchange();

// Wait for all sessions to be ready
// The manager will call onSessionReady callbacks automatically
```

### 4. Send File to All Recipients

```typescript
// Send file in parallel to all recipients
const file = new File([fileData], 'presentation.pdf', { type: 'application/pdf' });

const result = await manager.sendToAll(file);

console.log('Transfer result:', {
  fileName: result.fileName,
  totalRecipients: result.totalRecipients,
  successful: result.successfulRecipients.length,
  failed: result.failedRecipients.length,
  totalTime: result.totalTime,
});
```

### 5. Monitor Transfer State

```typescript
// Get current state
const state = manager.getState();

if (state) {
  console.log('Transfer state:', {
    status: state.status,
    totalProgress: state.totalProgress,
    successCount: state.successCount,
    failureCount: state.failureCount,
    pendingCount: state.pendingCount,
  });

  // Check individual recipients
  state.recipients.forEach(recipient => {
    console.log(`${recipient.name}:`, {
      status: recipient.status,
      progress: recipient.progress,
      speed: recipient.speed,
      quality: recipient.connectionQuality,
      error: recipient.error,
    });
  });
}
```

### 6. Cancel Transfer

```typescript
// Cancel ongoing transfer
manager.cancel();
```

### 7. Cleanup

```typescript
// Destroy manager when done
manager.destroy();
```

## Advanced Usage

### Custom Data Channel Configuration

```typescript
import { DataChannelManager } from '@/lib/webrtc/data-channel';

// Create custom data channel manager
const dataChannelManager = new DataChannelManager(
  {
    maxPeers: 10,
    enablePrivacyMode: true,
    connectionTimeout: 30000,
    reconnectAttempts: 3,
    statsInterval: 2000,
    bandwidthLimit: 5_000_000,
  },
  {
    onPeerConnected: (peerId, dataChannel) => {
      console.log(`Peer connected: ${peerId}`);
    },
    onPeerDisconnected: (peerId, reason) => {
      console.log(`Peer disconnected: ${peerId} - ${reason}`);
    },
    onPeerError: (peerId, error) => {
      console.error(`Peer error: ${peerId}`, error);
    },
    onQualityChange: (peerId, quality) => {
      console.log(`Connection quality changed: ${peerId} - ${quality}`);
    },
    onMessage: (peerId, data) => {
      console.log(`Message from ${peerId}:`, data);
    },
  }
);
```

### Manual Peer Connection Management

```typescript
// Create connection to specific peer
const { offer, dataChannel } = await dataChannelManager.createConnection(
  'peer-id',
  'Peer Name',
  'socket-id'
);

// Send offer via signaling
signalingClient.sendGroupOffer(groupId, 'socket-id', offer);

// When answer received
await dataChannelManager.completeConnection('peer-id', answer);

// Add ICE candidates
await dataChannelManager.addIceCandidate('peer-id', candidate);

// Disconnect specific peer
dataChannelManager.disconnectPeer('peer-id', 'User left');

// Get peer stats
const stats = dataChannelManager.getStats('peer-id');
console.log('Peer stats:', stats);
```

### Connection Quality Monitoring

```typescript
// Monitor connection quality for all peers
setInterval(() => {
  const peers = manager.getDataChannelManager()?.getConnectedPeers() || [];

  peers.forEach(peer => {
    console.log(`${peer.peerName}:`, {
      quality: peer.quality,
      bytesReceived: peer.stats.bytesReceived,
      bytesSent: peer.stats.bytesSent,
      roundTripTime: peer.stats.roundTripTime,
    });
  });
}, 5000);
```

### Bandwidth Distribution

```typescript
// Fair bandwidth distribution across peers
const totalBandwidth = 10_000_000; // 10 MB/s total
const peerCount = recipients.length;
const bandwidthPerPeer = totalBandwidth / peerCount;

const manager = new GroupTransferManager({
  bandwidthLimitPerRecipient: bandwidthPerPeer,
});

// Adjust dynamically based on connection quality
manager.getState()?.recipients.forEach(recipient => {
  if (recipient.connectionQuality === 'excellent') {
    // Allocate more bandwidth
    recipient.manager.setBandwidthLimit(bandwidthPerPeer * 1.5);
  } else if (recipient.connectionQuality === 'poor') {
    // Reduce bandwidth
    recipient.manager.setBandwidthLimit(bandwidthPerPeer * 0.5);
  }
});
```

## React Hook Example

```typescript
import { useState, useEffect, useCallback } from 'react';
import { GroupTransferManager, RecipientInfo } from '@/lib/transfer/group-transfer-manager';

export function useGroupTransfer() {
  const [manager] = useState(() => new GroupTransferManager());
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    // Update state periodically
    const interval = setInterval(() => {
      setState(manager.getState());
    }, 100);

    return () => {
      clearInterval(interval);
      manager.destroy();
    };
  }, [manager]);

  const startTransfer = useCallback(async (
    file: File,
    recipients: RecipientInfo[]
  ) => {
    await manager.initializeGroupTransfer(
      crypto.randomUUID(),
      file.name,
      file.size,
      recipients
    );

    await manager.startKeyExchange();
    const result = await manager.sendToAll(file);

    return result;
  }, [manager]);

  const cancelTransfer = useCallback(() => {
    manager.cancel();
  }, [manager]);

  return {
    state,
    startTransfer,
    cancelTransfer,
    manager,
  };
}
```

## Error Handling

```typescript
try {
  await manager.initializeGroupTransfer(transferId, fileName, fileSize, recipients);
  await manager.startKeyExchange();
  const result = await manager.sendToAll(file);

  // Handle partial success
  if (result.failedRecipients.length > 0) {
    console.warn('Some transfers failed:');
    result.failedRecipients.forEach(failed => {
      console.error(`${failed.id}: ${failed.error}`);
    });
  }

  // Handle complete success
  if (result.successfulRecipients.length === recipients.length) {
    console.log('All transfers completed successfully!');
  }
} catch (error) {
  console.error('Group transfer failed:', error);

  // Cleanup on error
  manager.destroy();
}
```

## Performance Considerations

### 1. Recipient Limits

- **Recommended**: 2-5 recipients for optimal performance
- **Maximum**: 10 recipients (enforced by DataChannelManager)
- **Factors**: Network bandwidth, CPU capacity, file size

### 2. Bandwidth Management

```typescript
// Total available bandwidth
const totalBandwidth = 20_000_000; // 20 MB/s

// Reserve bandwidth for overhead
const usableBandwidth = totalBandwidth * 0.8; // 80%

// Distribute among recipients
const perRecipientBandwidth = usableBandwidth / recipients.length;

const manager = new GroupTransferManager({
  bandwidthLimitPerRecipient: perRecipientBandwidth,
});
```

### 3. Connection Quality Thresholds

- **Excellent**: RTT < 100ms, no packet loss
- **Good**: RTT < 200ms, minimal packet loss
- **Fair**: RTT < 500ms, moderate packet loss
- **Poor**: RTT > 500ms or high packet loss
- **Disconnected**: Connection lost

### 4. Memory Optimization

```typescript
// For large files, use streaming
// The PQCTransferManager chunks files automatically
// Default chunk size: 64 KB (configurable)

// Monitor memory usage
console.log('Connected peers:', manager.getConnectedPeerCount());
console.log('Total memory:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');
```

## Security Features

### 1. Post-Quantum Cryptography

- **ML-KEM-768** (Kyber) for quantum-resistant key exchange
- **X25519** for classical key exchange
- **Hybrid approach** combines both for defense-in-depth

### 2. Privacy Protection

- **Relay-only mode**: Prevents IP address leaks
- **TURN servers**: All traffic routed through relay
- **Candidate filtering**: Blocks direct peer-to-peer candidates

### 3. Per-Peer Encryption

Each recipient has independent encryption:
- Unique session keys
- Independent key rotation
- No shared secrets between recipients

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { GroupTransferManager } from '@/lib/transfer/group-transfer-manager';

describe('Group Transfer', () => {
  it('should handle 3 recipients', async () => {
    const manager = new GroupTransferManager();
    const recipients = [/* ... */];
    const file = new File(['test'], 'test.txt');

    await manager.initializeGroupTransfer('test', file.name, file.size, recipients);
    await manager.startKeyExchange();
    const result = await manager.sendToAll(file);

    expect(result.successfulRecipients.length).toBe(3);

    manager.destroy();
  });
});
```

## Troubleshooting

### Connection Failures

```typescript
// Check signaling connection
if (!signalingClient.isConnected) {
  await signalingClient.connect();
}

// Verify peer connectivity
const connectedPeers = manager.getConnectedPeerCount();
console.log(`Connected to ${connectedPeers}/${recipients.length} peers`);

// Check individual peer status
const state = manager.getState();
state?.recipients.forEach(recipient => {
  if (recipient.status === 'failed') {
    console.error(`${recipient.name} failed: ${recipient.error}`);
  }
});
```

### Performance Issues

```typescript
// Reduce bandwidth per peer
manager.getState()?.recipients.forEach(recipient => {
  recipient.manager.setBandwidthLimit(1_000_000); // 1 MB/s
});

// Monitor connection quality
const quality = manager.getPeerQuality('peer-id');
if (quality === 'poor') {
  console.warn('Poor connection quality detected');
}
```

## Next Steps

- Read [ARCHITECTURE.md](../../ARCHITECTURE.md) for system overview
- Check [GROUP_TRANSFER_README.md](../transfer/GROUP_TRANSFER_README.md) for transfer logic
- See [PQC_INTEGRATION.md](../../PQC_INTEGRATION.md) for encryption details
- Review [SECURITY_ENHANCEMENTS.md](../../SECURITY_ENHANCEMENTS.md) for security features
