# Group Discovery Quick Reference

## Quick Start

### 1. Simple Group Transfer

```typescript
import { useGroupDiscovery } from '@/lib/hooks/use-group-discovery';
import { useGroupTransfer } from '@/lib/hooks/use-group-transfer';

function MyComponent() {
  const discovery = useGroupDiscovery({ autoStart: true });
  const transfer = useGroupTransfer();

  const handleSend = async (file: File) => {
    // Select devices manually or use discovery.selectAllDevices()

    // Connect to devices
    const result = await discovery.connectToSelectedDevices();

    // Initialize and send
    await transfer.initializeGroupTransfer(
      crypto.randomUUID(),
      file.name,
      file.size,
      result.devices.map(d => ({
        info: { id: d.id, name: d.name, deviceId: d.id },
        dataChannel: d.dataChannel!,
      }))
    );

    await transfer.sendToAll(file);
  };
}
```

## Common Patterns

### Discover Devices

```typescript
// Auto-start discovery
const { discoveredDevices } = useGroupDiscovery({ autoStart: true });

// Manual discovery
const { startDiscovery } = useGroupDiscovery();
await startDiscovery();

// Refresh device list
refreshDevices();
```

### Select Devices

```typescript
// Select single device
selectDevice(device);

// Deselect device
deselectDevice(deviceId);

// Select all
selectAllDevices();

// Clear selection
clearSelection();

// Check if selected
const isSelected = isDeviceSelected(deviceId);
```

### Connect to Devices

```typescript
// Connect with default timeout (30s)
const result = await connectToSelectedDevices();

// Connect with custom timeout
const result = await connectToSelectedDevices(60000);

// Check result
console.log(`Connected: ${result.successCount}`);
console.log(`Failed: ${result.failedCount}`);
```

### Filter Devices

```typescript
// By group transfer capability
const { discoveryOptions } = useGroupDiscovery({
  discoveryOptions: {
    maxDevices: 10,
    requirePQC: true,
    preferRecentPartners: true,
  }
});

// Manually filter
const capableDevices = discoveredDevices.filter(
  d => d.capabilities?.supportsGroupTransfer
);
```

### Track Progress

```typescript
const { groupState } = useGroupTransfer();

// Overall progress
console.log(`Progress: ${groupState?.totalProgress}%`);

// Per-recipient
groupState?.recipients.forEach(r => {
  console.log(`${r.name}: ${r.progress}%`);
  console.log(`Status: ${r.status}`);
  console.log(`Speed: ${r.speed} bytes/s`);
});
```

## API Cheat Sheet

### useGroupDiscovery Hook

```typescript
const {
  // State
  discoveredDevices,      // All discovered devices
  selectedDevices,        // Currently selected devices
  connectedDevices,       // Devices with active connections
  isDiscovering,         // Discovery in progress
  isConnecting,          // Connection in progress
  selectedCount,         // Number of selected devices
  connectedCount,        // Number of connected devices
  error,                 // Last error message

  // Computed
  hasSelectedDevices,    // selectedCount > 0
  hasConnectedDevices,   // connectedCount > 0

  // Actions
  startDiscovery,
  refreshDevices,
  selectDevice,
  deselectDevice,
  selectAllDevices,
  clearSelection,
  connectToSelectedDevices,
  disconnectAll,
  markTransferComplete,

  // Utilities
  isDeviceSelected,
  isDeviceConnected,
  getDeviceById,
} = useGroupDiscovery(options);
```

### useGroupTransfer Hook

```typescript
const {
  // State
  isInitializing,
  isTransferring,
  isCompleted,
  groupState,
  result,
  error,

  // Actions
  initializeGroupTransfer,
  sendToAll,
  cancel,
  reset,

  // Utilities
  getRecipientName,
} = useGroupTransfer(options);
```

### GroupDiscoveryManager

```typescript
import { getGroupDiscoveryManager } from '@/lib/discovery/group-discovery-manager';

const manager = getGroupDiscoveryManager();

// Discover devices
const devices = await manager.discoverGroupTransferDevices({
  minDevices: 2,
  maxDevices: 10,
  requirePQC: true,
  preferRecentPartners: true,
  connectionTimeout: 30000,
});

// Validate devices
const { valid, invalid } = manager.validateDevicesForGroupTransfer(devices);

// Connect to devices
const result = await manager.connectToDevices(valid, { timeout: 30000 });

// Track transfer
await manager.markTransferComplete(deviceId, true, bytesSent);

// Cleanup
manager.closeDeviceConnection(deviceId);
manager.closeAllConnections();
manager.destroy();
```

### Local Discovery

```typescript
import { getLocalDiscovery } from '@/lib/discovery/local-discovery';

const discovery = getLocalDiscovery();

// Control discovery
discovery.start();
discovery.stop();
discovery.refresh();

// Get devices
const devices = discovery.getDevices();
const groupDevices = discovery.getGroupTransferCapableDevices();
const prioritized = discovery.getPrioritizedDevices();

// Listen for updates
const unsubscribe = discovery.onDevicesChanged((devices) => {
  console.log('Devices:', devices);
});

// Device info
discovery.updateDeviceInfo(deviceId, name, platform, capabilities);
discovery.updateConnectionQuality(deviceId, 'excellent');
discovery.markTransferComplete(deviceId);

// Capabilities
discovery.setMyCapabilities({ supportsGroupTransfer: true });
const caps = discovery.getMyCapabilities();
```

### Connection Manager

```typescript
import { getConnectionManager } from '@/lib/signaling/connection-manager';

const manager = getConnectionManager();

// Multi-peer connections
manager.setMaxConcurrentConnections(10);

const result = await manager.connectToMultiplePeers(socketIds, {
  timeout: 30000,
  onPeerConnected: (socketId) => {},
  onPeerFailed: (socketId, error) => {},
});

// Per-peer signaling
await manager.sendOfferToPeer(socketId, offer);
await manager.sendAnswerToPeer(socketId, answer);
await manager.sendIceCandidateToPeer(socketId, candidate);

// Connection pool
const peers = manager.getConnectedPeers();
manager.removePeerFromPool(socketId);
manager.clearMultiPeerConnections();
```

### Device Storage

```typescript
import {
  updateTransferStats,
  addRecentTransferPartner,
  getRecentTransferPartners,
  setGroupTransferSupport,
} from '@/lib/storage/my-devices';

// Track statistics
await updateTransferStats(deviceId, true, bytesSent, bytesReceived);

// Track partners
await addRecentTransferPartner(deviceId, partnerDeviceId);
const partners = await getRecentTransferPartners(deviceId);

// Set capabilities
await setGroupTransferSupport(deviceId, true);
```

## Device Capabilities

```typescript
interface DeviceCapabilities {
  supportsGroupTransfer: boolean;  // Can receive group transfers
  supportsPQC: boolean;            // Has post-quantum crypto
  maxConnections: number;          // Max concurrent connections
  protocolVersion: string;         // Protocol version (e.g., "2.0.0")
}
```

## Connection Quality

```typescript
type Quality = 'excellent' | 'good' | 'fair' | 'poor';

// Excellent: RTT < 50ms
// Good: RTT < 150ms
// Fair: RTT < 300ms
// Poor: RTT >= 300ms
```

## Discovery Options

```typescript
interface GroupDiscoveryOptions {
  minDevices?: number;              // Minimum devices to find
  maxDevices?: number;              // Maximum devices to return
  requirePQC?: boolean;             // Only PQC-capable devices
  preferRecentPartners?: boolean;   // Prioritize recent partners
  connectionTimeout?: number;       // Connection timeout (ms)
}
```

## Transfer Options

```typescript
interface UseGroupTransferOptions {
  bandwidthLimitPerRecipient?: number;  // Bytes per second
  onRecipientComplete?: (id: string, name: string) => void;
  onRecipientError?: (id: string, name: string, error: string) => void;
  onComplete?: (result: GroupTransferResult) => void;
}
```

## Common Errors

### "No devices found"
- Ensure devices are on same network
- Check signaling server is running
- Verify discovery is started

### "Connection timeout"
- Increase timeout value
- Check network connectivity
- Verify peer is online

### "Failed to connect to any devices"
- Validate device capabilities
- Check WebRTC configuration
- Verify STUN/TURN servers

### "Group transfer not supported"
- Device doesn't support group transfers
- Update device software
- Use individual transfers instead

## Performance Tips

1. **Limit concurrent connections** (5-10 recommended)
2. **Set bandwidth limits** to prevent congestion
3. **Prefer recent partners** for better connectivity
4. **Filter by capabilities** before connecting
5. **Close unused connections** promptly

## Security Best Practices

1. **Always validate** device capabilities
2. **Use PQC** when available
3. **Verify** device identity after connection
4. **Encrypt** all signaling messages
5. **Track** transfer statistics for audit

## Troubleshooting

```typescript
// Debug discovery
const discovery = getLocalDiscovery();
console.log('My capabilities:', discovery.getMyCapabilities());
console.log('Discovered devices:', discovery.getDevices());

// Debug connections
const manager = getConnectionManager();
console.log('Connected peers:', manager.getConnectedPeers());
console.log('Connection states:', manager.getAllMultiPeerStates());

// Debug transfers
console.log('Group state:', groupState);
console.log('Recipients:', groupState?.recipients);
```

## Example: Complete Flow

```typescript
function CompleteExample() {
  const discovery = useGroupDiscovery({ autoStart: true });
  const transfer = useGroupTransfer({
    bandwidthLimitPerRecipient: 5 * 1024 * 1024, // 5 MB/s
  });

  const handleTransfer = async (file: File) => {
    try {
      // 1. Ensure devices are discovered
      if (discovery.discoveredDevices.length === 0) {
        await discovery.startDiscovery();
      }

      // 2. Select devices (or use selectAllDevices)
      discovery.discoveredDevices.forEach(device => {
        if (device.capabilities?.supportsGroupTransfer) {
          discovery.selectDevice(device);
        }
      });

      // 3. Connect to selected devices
      const result = await discovery.connectToSelectedDevices(30000);

      if (result.successCount === 0) {
        throw new Error('Could not connect to any devices');
      }

      // 4. Initialize group transfer
      const recipients = result.devices.map(d => ({
        info: {
          id: d.id,
          name: d.name,
          deviceId: d.id,
        },
        dataChannel: d.dataChannel!,
      }));

      await transfer.initializeGroupTransfer(
        crypto.randomUUID(),
        file.name,
        file.size,
        recipients
      );

      // 5. Send file
      const transferResult = await transfer.sendToAll(file);

      // 6. Handle result
      console.log('Transfer complete:', transferResult);

      // 7. Mark devices as transfer partners
      for (const device of result.devices) {
        await discovery.markTransferComplete(
          device.id,
          true,
          file.size
        );
      }

      // 8. Cleanup
      discovery.disconnectAll();
      transfer.reset();

    } catch (error) {
      console.error('Transfer failed:', error);
      // Handle error
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleTransfer(file);
      }} />
    </div>
  );
}
```

## Need More Help?

- See `INTEGRATION_GUIDE.md` for detailed documentation
- See `IMPLEMENTATION_SUMMARY.md` for architecture details
- See `components/examples/group-transfer-example.tsx` for full UI example
