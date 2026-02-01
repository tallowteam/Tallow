# mDNS/Bonjour/Zeroconf Discovery Implementation

## Overview

Complete mDNS discovery system for TALLOW enabling local network device discovery via Bonjour/Zeroconf protocol. The system includes a WebSocket bridge daemon for browser access and seamlessly integrates with the existing signaling server discovery.

## Architecture

```
+------------------+     +------------------+     +------------------+
|   Web Browser    |     |  mDNS Daemon     |     |   Other Devices  |
|                  |     |                  |     |                  |
|  +------------+  |     |  +------------+  |     |  +------------+  |
|  | Unified    |<------>|  | WebSocket  |  |     |  | mDNS       |  |
|  | Discovery  |  | WS  |  | Server     |  |     |  | Client     |  |
|  +------------+  |     |  +------------+  |     |  +------------+  |
|        |         |     |        |         |     |        |         |
|  +------------+  |     |  +------------+  |     |  +------------+  |
|  | mDNS       |  |     |  | mDNS       |<------>|  | mDNS       |  |
|  | Bridge     |  |     |  | Server     |  mDNS  |  | Server     |  |
|  +------------+  |     |  +------------+  |     |  +------------+  |
|        |         |     +------------------+     +------------------+
|  +------------+  |
|  | Signaling  |<---------> Signaling Server (Internet)
|  | Discovery  |  |
|  +------------+  |
+------------------+
```

## Files Created

### Web Library (`lib/discovery/`)

| File | Description |
|------|-------------|
| `mdns-types.ts` | Type definitions for mDNS service, TXT records, and WebSocket protocol |
| `mdns-bridge.ts` | WebSocket client for connecting to local mDNS daemon |
| `unified-discovery.ts` | Merges mDNS and signaling discovery seamlessly |
| `index.ts` | Module exports |
| `local-discovery.ts` | Updated with documentation (existing file) |

### React Hook (`lib/hooks/`)

| File | Description |
|------|-------------|
| `use-unified-discovery.ts` | React hook for unified device discovery |

### Daemon (`daemon/`)

| File | Description |
|------|-------------|
| `package.json` | Node.js package configuration |
| `tsconfig.json` | TypeScript configuration |
| `src/index.ts` | Daemon entry point with CLI |
| `src/mdns-server.ts` | mDNS advertisement and discovery |
| `src/websocket-server.ts` | WebSocket API for web clients |
| `src/service-registry.ts` | Device tracking and TTL management |
| `Dockerfile` | Container build configuration |
| `README.md` | Daemon documentation |

### Tests (`tests/unit/discovery/`)

| File | Description |
|------|-------------|
| `mdns-types.test.ts` | Type and utility function tests |
| `unified-discovery.test.ts` | Unified discovery manager tests |

### Examples (`components/examples/`)

| File | Description |
|------|-------------|
| `unified-discovery-example.tsx` | React component example |

## Service Definition

- **Type**: `_tallow._tcp.local`
- **Transfer Port**: 53317
- **Daemon WS Port**: 53318

### TXT Records

| Field | Description | Example |
|-------|-------------|---------|
| `version` | Protocol version | "1.0.0" |
| `deviceId` | Unique device ID | "ABC123DEF456" |
| `deviceName` | User-friendly name | "MacBook Pro" |
| `platform` | OS platform | "macos" |
| `capabilities` | Feature flags | "pqc,chat,folder,group" |
| `fingerprint` | Public key fingerprint | "abc12345" |

## WebSocket Protocol

### Client -> Daemon

```typescript
// Start discovery
{ type: 'start-discovery', platformFilter?: ['macos', 'windows'] }

// Stop discovery
{ type: 'stop-discovery' }

// Advertise device
{ type: 'advertise', device: { id, name, platform, capabilities, fingerprint } }

// Stop advertising
{ type: 'stop-advertising' }

// Get current devices
{ type: 'get-devices' }

// Keepalive ping
{ type: 'ping', timestamp: number }
```

### Daemon -> Client

```typescript
// Device found
{ type: 'device-found', device: TallowDevice }

// Device lost
{ type: 'device-lost', deviceId: string }

// Device updated
{ type: 'device-updated', device: TallowDevice }

// Device list
{ type: 'device-list', devices: TallowDevice[] }

// Error
{ type: 'error', message: string, code?: string }

// Status
{ type: 'status', isDiscovering, isAdvertising, deviceCount }

// Pong
{ type: 'pong', timestamp, serverTime }
```

## Usage

### React Hook (Recommended)

```tsx
import { useUnifiedDiscovery } from '@/lib/hooks/use-unified-discovery';

function DeviceList() {
  const {
    devices,
    isDiscovering,
    isMdnsAvailable,
    startDiscovery,
    stopDiscovery,
    getBestConnectionMethod,
  } = useUnifiedDiscovery();

  return (
    <ul>
      {devices.map(device => (
        <li key={device.id}>
          {device.name} ({device.source})
          <button onClick={() => connect(device.id, getBestConnectionMethod(device.id))}>
            Connect
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### Direct API Usage

```typescript
import { getUnifiedDiscovery } from '@/lib/discovery';

const discovery = getUnifiedDiscovery();

// Start discovery
await discovery.start();

// Listen for devices
discovery.onDevicesChanged((devices) => {
  console.log('Devices:', devices);
});

// Advertise this device
discovery.advertise();

// Get best connection method
const method = discovery.getBestConnectionMethod(deviceId);
// Returns: 'direct' (mDNS) | 'signaling' | null
```

### Running the Daemon

```bash
# Install and run
cd daemon
npm install
npm run dev

# Or with Docker
docker build -t tallow-mdns-daemon .
docker run --net=host tallow-mdns-daemon
```

## Key Features

1. **Automatic Fallback**: Uses mDNS when daemon available, falls back to signaling
2. **Unified Device List**: Merges devices from both sources seamlessly
3. **Best Connection Selection**: Automatically chooses optimal connection method
4. **Cross-Platform**: Works on macOS, Windows, Linux (daemon) and all browsers (client)
5. **Type-Safe**: Full TypeScript support with strict types
6. **React Integration**: Ready-to-use hooks for React applications
7. **TTL-Based Expiration**: Automatic device cleanup when offline
8. **Keepalive Support**: WebSocket ping/pong for connection health

## Test Results

```
 Tests: 51 passed
 - mdns-types.test.ts: 32 tests
 - unified-discovery.test.ts: 19 tests
```

## Dependencies

### Web Library (existing project)
- No new dependencies required

### Daemon (separate package)
- `bonjour-service`: mDNS/Bonjour implementation
- `multicast-dns`: Low-level mDNS support
- `ws`: WebSocket server
- `uuid`: Unique ID generation

## Platform Support

| Platform | mDNS Support | Notes |
|----------|--------------|-------|
| macOS | Native Bonjour | Works out of the box |
| Windows | Bonjour SDK | Requires Bonjour Print Services |
| Linux | Avahi | Install `avahi-daemon` |
| Docker | Host network | Requires `--net=host` |
| Browser | Via daemon | WebSocket bridge required |

## Security Considerations

1. **Local Network Only**: mDNS only works on local network
2. **Fingerprint Verification**: Verify device fingerprints before connecting
3. **WebSocket Local**: Daemon only binds to localhost by default
4. **No Sensitive Data**: TXT records contain no sensitive information

## Future Enhancements

1. Service mesh support for multi-network discovery
2. Encrypted mDNS TXT records
3. Daemon auto-install via npm postinstall
4. Native browser extension for direct mDNS access
5. Mobile app integration (iOS/Android)
