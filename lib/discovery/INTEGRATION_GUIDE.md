# Group Discovery Integration Guide

## Overview

This guide explains how to integrate device discovery with group transfers in the Tallow application.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (React Components using useGroupDiscovery hook)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Hook Layer (useGroupDiscovery)                  │
│  • Device selection UI state                                │
│  • Connection orchestration                                 │
│  • Toast notifications                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│        Group Discovery Manager (Business Logic)             │
│  • Device filtering & prioritization                        │
│  • Capability validation                                    │
│  • Multi-device connection                                  │
│  • Transfer partner tracking                                │
└─────────┬────────────────────────────┬─────────────────────┘
          │                            │
┌─────────▼────────────┐    ┌──────────▼──────────────────────┐
│  Local Discovery     │    │  Connection Manager              │
│  • WebSocket         │    │  • Multi-peer connections        │
│  • Device presence   │    │  • Connection pooling            │
│  • Capabilities      │    │  • Signaling encryption          │
└──────────────────────┘    └──────────────────────────────────┘
```

## Core Components

### 1. Local Discovery (`local-discovery.ts`)

Enhanced with:
- Device capabilities (group transfer support, PQC)
- Connection quality tracking
- Transfer history
- Prioritization algorithms

### 2. My Devices Storage (`my-devices.ts`)

Enhanced with:
- Transfer statistics
- Recent transfer partners
- Group transfer capability flag

### 3. Connection Manager (`connection-manager.ts`)

Enhanced with:
- Multi-peer connection orchestration
- Connection pooling
- Simultaneous connection handling
- Per-peer signaling

### 4. Group Discovery Manager (`group-discovery-manager.ts`)

New component that:
- Discovers group-capable devices
- Validates device capabilities
- Creates WebRTC connections
- Tracks connection quality
- Manages connection lifecycle

### 5. React Hook (`use-group-discovery.ts`)

New hook providing:
- Device discovery state
- Device selection management
- Connection orchestration
- Real-time updates
- Error handling

## Usage Examples

### Basic Group Transfer Flow

```typescript
import { useGroupDiscovery } from '@/lib/hooks/use-group-discovery';
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';

function GroupTransferComponent() {
  const {
    discoveredDevices,
    selectedDevices,
    connectedDevices,
    isDiscovering,
    isConnecting,
    startDiscovery,
    selectDevice,
    deselectDevice,
    connectToSelectedDevices,
  } = useGroupDiscovery({
    autoStart: true,
    discoveryOptions: {
      maxDevices: 10,
      requirePQC: true,
      preferRecentPartners: true,
    },
  });

  const {
    initializeGroupTransfer,
    sendToAll,
    groupState,
  } = useGroupTransfer({
    bandwidthLimitPerRecipient: 1024 * 1024 * 5, // 5 MB/s per recipient
  });

  const handleSendFile = async (file: File) => {
    // Step 1: Connect to selected devices
    const connectionResult = await connectToSelectedDevices();

    if (!connectionResult || connectionResult.successCount === 0) {
      return;
    }

    // Step 2: Initialize group transfer
    const recipients = connectedDevices.map(device => ({
      info: {
        id: device.id,
        name: device.name,
        deviceId: device.id,
      },
      dataChannel: device.dataChannel!,
    }));

    await initializeGroupTransfer(
      crypto.randomUUID(),
      file.name,
      file.size,
      recipients
    );

    // Step 3: Send file to all recipients
    await sendToAll(file);
  };

  return (
    <div>
      {/* Discovery UI */}
      <button onClick={startDiscovery} disabled={isDiscovering}>
        {isDiscovering ? 'Discovering...' : 'Find Devices'}
      </button>

      {/* Device List */}
      {discoveredDevices.map(device => (
        <div key={device.id}>
          <input
            type="checkbox"
            checked={selectedDevices.some(d => d.id === device.id)}
            onChange={(e) => {
              if (e.target.checked) {
                selectDevice(device);
              } else {
                deselectDevice(device.id);
              }
            }}
          />
          <span>{device.name}</span>
          {device.capabilities?.supportsGroupTransfer && (
            <span>✓ Group Transfer</span>
          )}
        </div>
      ))}

      {/* File Selection and Send */}
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleSendFile(file);
        }}
      />
    </div>
  );
}
```

### Advanced Discovery with Filtering

```typescript
import { getGroupDiscoveryManager } from '@/lib/discovery/group-discovery-manager';

const manager = getGroupDiscoveryManager();

// Discover devices with specific requirements
const devices = await manager.discoverGroupTransferDevices({
  minDevices: 2,
  maxDevices: 5,
  requirePQC: true,
  preferRecentPartners: true,
  connectionTimeout: 30000,
});

// Validate devices
const validation = manager.validateDevicesForGroupTransfer(devices);

console.log('Valid devices:', validation.valid);
console.log('Invalid devices:', validation.invalid);

// Connect to devices
const result = await manager.connectToDevices(validation.valid);

console.log(`Connected to ${result.successCount} devices in ${result.duration}ms`);
```

### Direct Discovery API Usage

```typescript
import { getLocalDiscovery } from '@/lib/discovery/local-discovery';

const discovery = getLocalDiscovery();

// Start discovery
discovery.start();

// Listen for device updates
const unsubscribe = discovery.onDevicesChanged((devices) => {
  console.log('Discovered devices:', devices);
});

// Get group-capable devices
const groupDevices = discovery.getGroupTransferCapableDevices();

// Get prioritized devices
const prioritized = discovery.getPrioritizedDevices();

// Check device capabilities
const capabilities = discovery.getDeviceCapabilities('device-id');
console.log('Supports group transfer:', capabilities?.supportsGroupTransfer);

// Update my capabilities
discovery.setMyCapabilities({
  supportsGroupTransfer: true,
  supportsPQC: true,
  maxConnections: 15,
});

// Cleanup
unsubscribe();
discovery.stop();
```

### Connection Manager Multi-Peer Usage

```typescript
import { getConnectionManager } from '@/lib/signaling/connection-manager';

const manager = getConnectionManager();

// Set connection limit
manager.setMaxConcurrentConnections(10);

// Connect to multiple peers
const result = await manager.connectToMultiplePeers(
  ['socket-id-1', 'socket-id-2', 'socket-id-3'],
  {
    timeout: 30000,
    onPeerConnected: (socketId) => {
      console.log('Connected to:', socketId);
    },
    onPeerFailed: (socketId, error) => {
      console.error('Failed to connect:', socketId, error);
    },
  }
);

console.log('Successful connections:', result.successful);
console.log('Failed connections:', result.failed);

// Get connection states
const state = manager.getMultiPeerConnectionState('socket-id');
console.log('Connection status:', state?.status);

// Get all connected peers
const connectedPeers = manager.getConnectedPeers();

// Send to specific peer
await manager.sendOfferToPeer('socket-id', offer);
```

### Transfer Statistics Tracking

```typescript
import {
  updateTransferStats,
  addRecentTransferPartner,
  getRecentTransferPartners,
} from '@/lib/storage/my-devices';

// After successful transfer
await updateTransferStats(
  currentDeviceId,
  true, // success
  1024 * 1024 * 50, // 50 MB sent
  0 // 0 bytes received
);

// Track transfer partner
await addRecentTransferPartner(currentDeviceId, recipientDeviceId);

// Get recent partners for prioritization
const recentPartners = await getRecentTransferPartners(currentDeviceId);
```

## Key Features

### 1. Automatic Device Discovery
- Discovers all devices on local network
- Broadcasts device capabilities
- Real-time device list updates

### 2. Capability Detection
- Group transfer support
- Post-quantum cryptography (PQC)
- Maximum connections
- Protocol version

### 3. Device Prioritization
- Recent transfer partners (highest priority)
- Connection quality
- Last seen time

### 4. Parallel Connections
- Connect to multiple devices simultaneously
- Independent connection attempts
- Graceful failure handling
- Connection pooling

### 5. Connection Quality Tracking
- RTT measurement
- Packet loss detection
- Quality grades: excellent, good, fair, poor
- Automatic priority adjustment

### 6. Transfer History
- Per-device transfer statistics
- Recent partner tracking
- Success/failure rates
- Bandwidth usage

## Error Handling

### Discovery Errors
```typescript
const {
  error,
  startDiscovery,
} = useGroupDiscovery();

if (error) {
  console.error('Discovery error:', error);
  // Retry logic
  setTimeout(startDiscovery, 5000);
}
```

### Connection Errors
```typescript
const result = await manager.connectToDevices(devices);

result.devices.forEach((device, index) => {
  if (result.failed[index]) {
    console.error(
      `Failed to connect to ${device.name}:`,
      result.failed[index].error
    );
  }
});
```

### Transfer Errors
```typescript
const {
  groupState,
  markTransferComplete,
} = useGroupDiscovery();

groupState?.recipients.forEach(recipient => {
  if (recipient.status === 'failed') {
    markTransferComplete(recipient.id, false);
    console.error(`Transfer failed for ${recipient.name}:`, recipient.error);
  }
});
```

## Performance Considerations

### Connection Limits
- Default: 10 concurrent connections
- Adjustable: 1-50 connections
- Browser limitations: ~50 peer connections per page

### Bandwidth Management
- Per-recipient bandwidth limiting
- Adaptive based on connection quality
- Total bandwidth monitoring

### Memory Management
- Automatic cleanup of stale devices
- Connection pool management
- Regular state synchronization

## Security Features

### Privacy-Preserving Discovery
- Hashed device IDs
- No personal info in broadcasts
- Secure data channel exchange

### Encrypted Signaling
- AES-GCM encrypted offers/answers
- Key derivation from connection codes
- Forward secrecy

### Capability Validation
- Verify device capabilities before connection
- Reject incompatible protocol versions
- Validate group transfer support

## Testing

### Unit Tests
```typescript
import { GroupDiscoveryManager } from '@/lib/discovery/group-discovery-manager';

test('discovers group-capable devices', async () => {
  const manager = new GroupDiscoveryManager();
  const devices = await manager.discoverGroupTransferDevices({
    maxDevices: 5,
  });
  expect(devices.length).toBeLessThanOrEqual(5);
});
```

### Integration Tests
```typescript
test('connects to multiple devices', async () => {
  const manager = new GroupDiscoveryManager();
  const devices = await manager.discoverGroupTransferDevices();
  const result = await manager.connectToDevices(devices.slice(0, 3));

  expect(result.successCount).toBeGreaterThan(0);
  expect(result.devices.length).toBeLessThanOrEqual(3);
});
```

## Troubleshooting

### No Devices Discovered
- Ensure signaling server is running
- Check network connectivity
- Verify devices are on same network
- Check firewall settings

### Connection Failures
- Increase connection timeout
- Reduce concurrent connection limit
- Check WebRTC ICE configuration
- Verify STUN/TURN servers

### Poor Performance
- Enable bandwidth limiting
- Reduce number of simultaneous connections
- Check network conditions
- Monitor connection quality

## Best Practices

1. **Always validate devices** before connecting
2. **Handle connection failures gracefully**
3. **Track transfer statistics** for better prioritization
4. **Set appropriate bandwidth limits**
5. **Clean up connections** after transfers
6. **Provide user feedback** during discovery/connection
7. **Implement retry logic** for failed connections
8. **Monitor connection quality** in real-time

## API Reference

See individual file documentation:
- `local-discovery.ts` - Device discovery API
- `group-discovery-manager.ts` - Group connection management
- `connection-manager.ts` - Multi-peer signaling
- `use-group-discovery.ts` - React hook interface
- `my-devices.ts` - Device storage and statistics
