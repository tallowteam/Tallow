# Device Discovery - Quick Start Guide

## TL;DR

Real device discovery is now wired up. Devices appear automatically via mDNS (local) or signaling (internet).

```typescript
// In your page/component
import { useDeviceDiscovery } from '@/lib/hooks/use-device-discovery';

const { status } = useDeviceDiscovery(); // Auto-starts discovery
const { devices } = useDeviceStore();    // Access discovered devices
```

## Quick Setup

### 1. Start mDNS Daemon (for local discovery)

```bash
cd daemon
npm install
npm run dev
```

Daemon runs on `ws://localhost:53318`

### 2. Configure Signaling Server (for internet discovery)

```bash
# .env.local
NEXT_PUBLIC_SIGNALING_URL=wss://signaling.manisahome.com
```

### 3. Use Discovery in Your Component

```typescript
import { useDeviceDiscovery } from '@/lib/hooks/use-device-discovery';
import { useDeviceStore } from '@/lib/stores/device-store';

export default function MyPage() {
  // Start discovery automatically
  const { status, refresh } = useDeviceDiscovery();

  // Get discovered devices
  const { devices } = useDeviceStore();

  // Filter for online devices
  const onlineDevices = devices.filter(d => d.isOnline);

  return (
    <div>
      {status.isScanning ? (
        <p>Scanning... {status.deviceCount} devices</p>
      ) : (
        <p>Found {onlineDevices.length} devices</p>
      )}

      {onlineDevices.map(device => (
        <div key={device.id}>
          {device.name} - {device.platform}
          {device.id === 'this-device' && <span>You</span>}
        </div>
      ))}

      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

## What You Get

### Devices Array

```typescript
const { devices } = useDeviceStore();

// Each device has:
{
  id: string;           // 'this-device' or unique device ID
  name: string;         // 'iPhone 15 Pro', 'MacBook Pro', etc.
  platform: Platform;   // 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'web'
  ip: string | null;    // '192.168.1.100' (from mDNS)
  port: number | null;  // 8080 (from mDNS)
  isOnline: boolean;    // true if currently available
  isFavorite: boolean;  // user-marked favorite
  lastSeen: number;     // timestamp
  avatar: string | null; // avatar URL/data URI
}
```

### Discovery Status

```typescript
const { status } = useDeviceDiscovery();

// Status provides:
{
  isScanning: boolean;        // true while actively scanning
  deviceCount: number;        // total devices found
  mdnsAvailable: boolean;     // true if mDNS daemon connected
  signalingConnected: boolean; // true if signaling server connected
  error: string | null;       // error message if any
}
```

## "This Device" Card

The discovery hook automatically adds a "This Device" card:

```typescript
{
  id: 'this-device',
  name: 'Windows Desktop', // or 'Mac', 'iPhone', etc.
  platform: 'windows',     // auto-detected
  isOnline: true,
  // ... other fields
}
```

**Check if device is current device:**
```typescript
const isThisDevice = device.id === 'this-device';
```

## API Reference

### useDeviceDiscovery()

```typescript
const {
  status,           // DiscoveryStatus
  refresh,          // () => void - manual refresh
  startDiscovery,   // () => Promise<void> - start discovery
  stopDiscovery,    // () => void - stop discovery
} = useDeviceDiscovery();
```

**Lifecycle:**
- Starts automatically on mount
- Stops automatically on unmount
- Auto-refreshes every 10 seconds

### Device Store Actions

```typescript
const {
  devices,               // Device[] - all discovered devices
  toggleFavorite,        // (id: string) => void
  selectDevice,          // (device: Device) => void
  getDeviceById,         // (id: string) => Device | undefined
  getOnlineDevices,      // () => Device[]
  getFavoriteDevices,    // () => Device[]
} = useDeviceStore();
```

## Common Tasks

### Show Only Online Devices

```typescript
const onlineDevices = devices.filter(d => d.isOnline);
```

### Exclude "This Device"

```typescript
const otherDevices = devices.filter(d => d.id !== 'this-device');
```

### Sort by Last Seen

```typescript
const sortedDevices = [...devices].sort((a, b) => b.lastSeen - a.lastSeen);
```

### Filter by Platform

```typescript
const mobileDevices = devices.filter(d =>
  d.platform === 'ios' || d.platform === 'android'
);
```

### Toggle Favorite

```typescript
const { toggleFavorite } = useDeviceStore();

<button onClick={() => toggleFavorite(device.id)}>
  {device.isFavorite ? '★' : '☆'}
</button>
```

### Manual Refresh

```typescript
const { refresh } = useDeviceDiscovery();

<button onClick={refresh}>
  Refresh Devices
</button>
```

## Debugging

### Check Discovery Status

```typescript
useEffect(() => {
  console.log('Discovery status:', status);
  console.log('mDNS available:', status.mdnsAvailable);
  console.log('Signaling connected:', status.signalingConnected);
  console.log('Device count:', status.deviceCount);
}, [status]);
```

### Check mDNS Daemon

```bash
# Test WebSocket connection
wscat -c ws://localhost:53318
```

### Check Signaling Server

```bash
# Test WebSocket connection
wscat -c wss://signaling.manisahome.com/signaling
```

### Console Logs

Look for these logs in browser console:

```
[DeviceDiscovery] Starting discovery
[UnifiedDiscovery] mDNS daemon available, connecting
[UnifiedDiscovery] Connected to signaling server
[DeviceDiscovery] Updated devices: 4
```

## Troubleshooting

### No Devices Found

1. **Check mDNS daemon**: `ps aux | grep node` - should see daemon process
2. **Check signaling server**: Open Network tab, look for WebSocket connection
3. **Check firewall**: Ensure ports 53318 (mDNS) and 443 (signaling) are open
4. **Check same network**: For mDNS, devices must be on same LAN

### mDNS Not Working

1. Start daemon: `cd daemon && npm run dev`
2. Check daemon logs for errors
3. Ensure WebSocket not blocked by browser extension
4. Falls back to signaling automatically

### Signaling Not Working

1. Check `NEXT_PUBLIC_SIGNALING_URL` environment variable
2. Verify signaling server is running
3. Check browser Network tab for WebSocket errors
4. Falls back to mDNS automatically

### "This Device" Not Showing

1. Check settings store: `console.log(useSettingsStore.getState())`
2. Verify device ID: `console.log(getDeviceId())`
3. Check platform detection: `console.log(navigator.userAgent)`

## Advanced Usage

### Custom Discovery Options

```typescript
// In a custom hook or component
const discovery = getUnifiedDiscovery({
  enableMdns: true,
  enableSignaling: true,
  preferMdns: true,
  autoAdvertise: true,
});

// Start with options
await discovery.start();

// Get devices with specific capabilities
const pqcDevices = discovery.getDevicesWithCapabilities({
  supportsPQC: true,
  supportsGroupTransfer: true,
});
```

### Connection Quality

```typescript
// Check best connection method
const discovery = getUnifiedDiscovery();
const method = discovery.getBestConnectionMethod(device.id);

if (method === 'direct') {
  // Use mDNS direct connection (faster)
  const info = discovery.getDirectConnectionInfo(device.id);
  console.log('Direct:', info.ip, info.port);
} else if (method === 'signaling') {
  // Use signaling relay (works anywhere)
  const info = discovery.getSignalingConnectionInfo(device.id);
  console.log('Signaling:', info.socketId);
}
```

### Manual Device Addition

```typescript
// Add device manually (coming soon)
const manualDevice: Device = {
  id: 'manual-123',
  name: 'Office PC',
  platform: 'windows',
  ip: '192.168.1.50',
  port: 8080,
  isOnline: true,
  isFavorite: false,
  lastSeen: Date.now(),
  avatar: null,
};

useDeviceStore.getState().addDevice(manualDevice);
```

## Files Reference

| File | Purpose |
|------|---------|
| `lib/hooks/use-device-discovery.ts` | Main discovery hook |
| `lib/discovery/unified-discovery.ts` | Discovery manager |
| `lib/discovery/mdns-bridge.ts` | mDNS WebSocket bridge |
| `lib/discovery/local-discovery.ts` | Signaling discovery |
| `lib/stores/device-store.ts` | Device state management |
| `components/transfer/DeviceDiscovery.tsx` | Device grid UI |
| `daemon/src/mdns-server.ts` | mDNS daemon server |
| `daemon/src/websocket-server.ts` | WebSocket bridge server |

## Next Steps

1. Run `cd daemon && npm run dev` to start mDNS daemon
2. Add `NEXT_PUBLIC_SIGNALING_URL` to `.env.local`
3. Open transfer page in browser
4. Devices should appear automatically within 1-3 seconds

## Support

- Discovery not working? Check console logs
- Need custom behavior? Extend `useDeviceDiscovery`
- Want to contribute? See `DEVICE_DISCOVERY_INTEGRATION.md`
