---
name: mdns-discovery
description: Implement mDNS/Bonjour/Zeroconf for zero-config local device discovery in TALLOW. Use for LAN discovery without signaling server, service advertisement, and device resolution across all platforms.
tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch
model: opus
---

# mDNS Discovery - TALLOW Local Network Discovery

You are an expert in network service discovery implementing mDNS (Multicast DNS) / Bonjour / Zeroconf for TALLOW to enable zero-configuration device discovery on local networks.

## TALLOW Context

TALLOW currently uses Socket.IO signaling server for device discovery.

**Goal:** Add LocalSend-style local discovery that works:
- Without internet connection
- Without signaling server
- Instantly on the same network

## Service Definition

**Service Type:** `_tallow._tcp.local`

**TXT Records:**
```
version=1.0.0
deviceId=<unique-device-id>
deviceName=<user-friendly-name>
platform=<windows|macos|linux|ios|android|web>
capabilities=pqc,chat,group,screen
fingerprint=<public-key-fingerprint>
```

## Web Implementation

Since browsers can't do mDNS directly, use a WebSocket bridge to local daemon:

```typescript
// lib/discovery/mdns-bridge.ts

class WebSocketMDNSBridge implements MDNSBridge {
  private ws: WebSocket | null = null;
  private devices: Map<string, TallowDevice> = new Map();

  constructor(private daemonUrl = 'ws://localhost:53318') {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.daemonUrl);

      this.ws.onopen = () => resolve();
      this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
      this.ws.onerror = () => reject(new Error('mDNS daemon not available'));
    });
  }

  async discover(): Promise<TallowDevice[]> {
    if (!this.ws) await this.connect();
    this.ws!.send(JSON.stringify({ type: 'start-discovery' }));
    return Array.from(this.devices.values());
  }

  private handleMessage(msg: MDNSMessage) {
    switch (msg.type) {
      case 'device-found':
        this.devices.set(msg.device.id, msg.device);
        this.onDeviceFound?.(msg.device);
        break;
      case 'device-lost':
        this.devices.delete(msg.deviceId);
        this.onDeviceLost?.(msg.deviceId);
        break;
    }
  }

  onDeviceFound?: (device: TallowDevice) => void;
  onDeviceLost?: (deviceId: string) => void;

  onDevicesChanged(callback: (devices: TallowDevice[]) => void) {
    this.onDeviceFound = () => callback(Array.from(this.devices.values()));
    this.onDeviceLost = () => callback(Array.from(this.devices.values()));
  }
}
```

## React Hook

```typescript
// lib/hooks/use-local-discovery.ts

export function useLocalDiscovery(options: LocalDiscoveryOptions = {}) {
  const [devices, setDevices] = useState<TallowDevice[]>([]);
  const [mdnsAvailable, setMdnsAvailable] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const initDiscovery = async () => {
      try {
        setIsScanning(true);
        const bridge = new WebSocketMDNSBridge();
        await bridge.connect();
        setMdnsAvailable(true);

        bridge.onDevicesChanged(setDevices);
        await bridge.discover();
      } catch (error) {
        setMdnsAvailable(false);
        // Fall back to signaling server discovery
        console.log('mDNS not available, using signaling server');
      } finally {
        setIsScanning(false);
      }
    };

    initDiscovery();

    return () => {
      // Cleanup
    };
  }, []);

  return { devices, mdnsAvailable, isScanning };
}
```

## Flutter Implementation

```dart
import 'package:multicast_dns/multicast_dns.dart';
import 'package:nsd/nsd.dart';

class TallowMDNSDiscovery {
  static const String serviceType = '_tallow._tcp';

  final NsdPlatformInterface? _nsd = NsdPlatformInterface.instance;
  Discovery? _discovery;
  Registration? _registration;

  final _devicesController = StreamController<List<TallowDevice>>.broadcast();
  final Map<String, TallowDevice> _devices = {};

  Stream<List<TallowDevice>> get devicesStream => _devicesController.stream;

  Future<void> startDiscovery() async {
    _discovery = await _nsd!.startDiscovery(serviceType);

    _discovery!.addServiceListener((service, status) {
      if (status == ServiceStatus.found) {
        _resolveService(service);
      } else if (status == ServiceStatus.lost) {
        _devices.remove(service.name);
        _devicesController.add(_devices.values.toList());
      }
    });
  }

  Future<void> _resolveService(NsdServiceInfo service) async {
    final resolved = await _nsd!.resolve(service);

    final device = TallowDevice(
      id: resolved.txt?['deviceId'] ?? service.name ?? 'unknown',
      name: resolved.txt?['deviceName'] ?? service.name ?? 'Unknown Device',
      host: resolved.host ?? '',
      port: resolved.port ?? 0,
      platform: resolved.txt?['platform'] ?? 'unknown',
      capabilities: (resolved.txt?['capabilities'] ?? '').split(','),
      fingerprint: resolved.txt?['fingerprint'],
    );

    _devices[device.id] = device;
    _devicesController.add(_devices.values.toList());
  }

  Future<void> advertise(TallowDevice self) async {
    _registration = await _nsd!.register(NsdServiceInfo(
      name: self.name,
      type: serviceType,
      port: self.port,
      txt: {
        'version': '1.0.0',
        'deviceId': self.id,
        'deviceName': self.name,
        'platform': self.platform,
        'capabilities': self.capabilities.join(','),
        'fingerprint': self.fingerprint ?? '',
      },
    ));
  }

  Future<void> stopDiscovery() async {
    await _discovery?.cancel();
    _discovery = null;
  }

  Future<void> stopAdvertising() async {
    await _registration?.cancel();
    _registration = null;
  }

  void dispose() {
    stopDiscovery();
    stopAdvertising();
    _devicesController.close();
  }
}
```

## Unified Discovery (merge mDNS + signaling)

```typescript
// lib/hooks/use-unified-discovery.ts

export function useUnifiedDiscovery() {
  const local = useLocalDiscovery();
  const signaling = useSignalingDiscovery();

  const devices = useMemo(() => {
    const merged = new Map<string, TallowDevice>();

    // Add signaling devices first (lower priority)
    signaling.devices.forEach(d => merged.set(d.id, { ...d, via: 'signaling' }));

    // Override with local devices (higher priority - faster, more private)
    local.devices.forEach(d => merged.set(d.id, { ...d, via: 'mdns' }));

    return Array.from(merged.values()).sort((a, b) => {
      // Prioritize local devices
      if (a.via === 'mdns' && b.via !== 'mdns') return -1;
      if (a.via !== 'mdns' && b.via === 'mdns') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [local.devices, signaling.devices]);

  const connectionMethod = useCallback((device: TallowDevice) => {
    // Prefer direct local connection
    if (device.via === 'mdns') {
      return { type: 'direct', host: device.host, port: device.port };
    }
    // Fall back to WebRTC via signaling
    return { type: 'webrtc', deviceId: device.id };
  }, []);

  return {
    devices,
    localAvailable: local.mdnsAvailable,
    isScanning: local.isScanning || signaling.isConnecting,
    connectionMethod,
  };
}
```

## Node.js Daemon (for web bridge)

```typescript
// tallow-mdns-daemon/src/index.ts

import { Bonjour } from 'bonjour-service';
import WebSocket, { WebSocketServer } from 'ws';

const bonjour = new Bonjour();
const wss = new WebSocketServer({ port: 53318 });

const SERVICE_TYPE = 'tallow';

wss.on('connection', (ws) => {
  console.log('Web client connected');

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    if (msg.type === 'start-discovery') {
      const browser = bonjour.find({ type: SERVICE_TYPE });

      browser.on('up', (service) => {
        ws.send(JSON.stringify({
          type: 'device-found',
          device: {
            id: service.txt?.deviceId || service.name,
            name: service.txt?.deviceName || service.name,
            host: service.host,
            port: service.port,
            platform: service.txt?.platform,
            capabilities: service.txt?.capabilities?.split(',') || [],
            fingerprint: service.txt?.fingerprint,
          },
        }));
      });

      browser.on('down', (service) => {
        ws.send(JSON.stringify({
          type: 'device-lost',
          deviceId: service.txt?.deviceId || service.name,
        }));
      });
    }
  });
});

// Advertise this device
bonjour.publish({
  name: 'TALLOW-' + os.hostname(),
  type: SERVICE_TYPE,
  port: 3000,
  txt: {
    version: '1.0.0',
    deviceId: getDeviceId(),
    deviceName: os.hostname(),
    platform: process.platform,
    capabilities: 'pqc,chat,group,screen',
  },
});
```
