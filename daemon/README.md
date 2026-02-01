# TALLOW mDNS Daemon

Local network device discovery daemon for TALLOW file transfer application.

## Overview

This daemon enables browser-based applications to discover devices on the local network using mDNS/Bonjour/Zeroconf. Since browsers cannot directly use mDNS, this daemon acts as a bridge, providing a WebSocket API for web clients.

## Features

- **mDNS Discovery**: Find other TALLOW devices on the local network
- **mDNS Advertisement**: Announce this device to other TALLOW clients
- **WebSocket API**: Simple JSON-based protocol for browser clients
- **Cross-Platform**: Works on macOS, Windows, and Linux
- **Docker Support**: Run in containers for easy deployment

## Installation

### From npm

```bash
npm install -g @tallow/mdns-daemon
```

### From source

```bash
cd daemon
npm install
npm run build
npm link
```

### Using Docker

```bash
docker build -t tallow-mdns-daemon .
docker run -d --name tallow-daemon --net=host tallow-mdns-daemon
```

Note: `--net=host` is required for mDNS multicast to work properly.

## Usage

### Basic Usage

```bash
# Start daemon with defaults
tallow-daemon

# Custom WebSocket port
tallow-daemon --port 8080

# Auto-advertise this device
tallow-daemon --advertise

# Custom device name
tallow-daemon --device-name "My PC"
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--help` | `-h` | Show help | - |
| `--version` | `-v` | Show version | - |
| `--port <port>` | `-p` | WebSocket server port | 53318 |
| `--advertise` | `-a` | Auto-advertise on startup | false |
| `--device-id <id>` | - | Custom device ID | auto-generated |
| `--device-name <name>` | - | Custom device name | hostname |
| `--verbose` | - | Enable verbose logging | false |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `TALLOW_WS_PORT` | WebSocket port (overrides --port) |
| `TALLOW_DEVICE_ID` | Device ID |
| `TALLOW_DEVICE_NAME` | Device name |
| `DEBUG` | Enable debug logging (DEBUG=mdns*) |

## WebSocket API

Connect to `ws://localhost:53318` to interact with the daemon.

### Client Messages

#### Start Discovery

```json
{
  "type": "start-discovery",
  "platformFilter": ["macos", "windows"]  // optional
}
```

#### Stop Discovery

```json
{
  "type": "stop-discovery"
}
```

#### Advertise Device

```json
{
  "type": "advertise",
  "device": {
    "id": "ABC123DEF456",
    "name": "My Browser",
    "platform": "web",
    "capabilities": ["pqc", "chat", "folder"],
    "fingerprint": "abc12345"
  }
}
```

#### Stop Advertising

```json
{
  "type": "stop-advertising"
}
```

#### Get Devices

```json
{
  "type": "get-devices"
}
```

#### Ping (Keepalive)

```json
{
  "type": "ping",
  "timestamp": 1706123456789
}
```

### Server Messages

#### Device Found

```json
{
  "type": "device-found",
  "device": {
    "id": "XYZ789GHI012",
    "name": "MacBook Pro",
    "platform": "macos",
    "ip": "192.168.1.100",
    "port": 53317,
    "version": "1.0.0",
    "capabilities": "pqc,chat,folder,group",
    "fingerprint": "xyz78901",
    "discoveredAt": 1706123456789,
    "lastSeen": 1706123456789,
    "isOnline": true,
    "source": "mdns"
  }
}
```

#### Device Lost

```json
{
  "type": "device-lost",
  "deviceId": "XYZ789GHI012"
}
```

#### Device List

```json
{
  "type": "device-list",
  "devices": [...]
}
```

#### Status

```json
{
  "type": "status",
  "status": "discovering",
  "isDiscovering": true,
  "isAdvertising": false,
  "deviceCount": 3
}
```

#### Error

```json
{
  "type": "error",
  "message": "Failed to start discovery",
  "code": "MDNS_ERROR"
}
```

#### Pong

```json
{
  "type": "pong",
  "timestamp": 1706123456789,
  "serverTime": 1706123456790
}
```

## mDNS Service

The daemon advertises and discovers services with type `_tallow._tcp.local`.

### TXT Record Fields

| Field | Description | Example |
|-------|-------------|---------|
| `version` | Protocol version | "1.0.0" |
| `deviceId` | Unique device ID | "ABC123DEF456" |
| `deviceName` | User-friendly name | "MacBook Pro" |
| `platform` | Device platform | "macos" |
| `capabilities` | Comma-separated caps | "pqc,chat,folder" |
| `fingerprint` | Public key fingerprint | "abc12345" |
| `timestamp` | Last update time | "1706123456789" |

### Capabilities

| Capability | Description |
|------------|-------------|
| `pqc` | Post-quantum cryptography |
| `chat` | Real-time messaging |
| `folder` | Directory transfer |
| `resume` | Resumable transfers |
| `screen` | Screen sharing |
| `group` | Group transfers |

## Integration

### JavaScript/TypeScript

Use the `mdns-bridge.ts` client in the TALLOW web app:

```typescript
import { getMDNSBridge } from '@/lib/discovery/mdns-bridge';

const bridge = getMDNSBridge();

// Connect to daemon
await bridge.connect();

// Set up event handlers
bridge.on('onDeviceFound', (device) => {
  console.log('Found:', device.name);
});

// Start discovery
bridge.startDiscovery();

// Advertise this device
bridge.advertise({
  id: 'my-device-id',
  name: 'My Browser',
  platform: 'web',
  capabilities: ['pqc', 'chat'],
  fingerprint: 'abc123',
});
```

### React Hook

```tsx
import { useUnifiedDiscovery } from '@/lib/hooks/use-unified-discovery';

function DeviceList() {
  const {
    devices,
    isMdnsAvailable,
    isDiscovering,
    startDiscovery,
  } = useUnifiedDiscovery();

  return (
    <div>
      <p>mDNS: {isMdnsAvailable ? 'Available' : 'Not available'}</p>
      <ul>
        {devices.map(device => (
          <li key={device.id}>
            {device.name} ({device.source})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run with debug logging
npm run dev:debug

# Build for production
npm run build

# Run production build
npm start
```

## Troubleshooting

### mDNS not working on Linux

Install Avahi:

```bash
sudo apt-get install avahi-daemon libavahi-compat-libdnssd-dev
sudo systemctl start avahi-daemon
```

### Port already in use

Change the WebSocket port:

```bash
tallow-daemon --port 8080
```

### Devices not appearing

1. Ensure all devices are on the same network
2. Check firewall allows UDP port 5353 (mDNS) and TCP port 53317 (transfer)
3. Verify Bonjour/Avahi service is running

### Docker container can't see local network

Use `--net=host` for proper mDNS multicast:

```bash
docker run --net=host tallow-mdns-daemon
```

## License

MIT
