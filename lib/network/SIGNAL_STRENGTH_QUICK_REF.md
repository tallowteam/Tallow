# Signal Strength Quick Reference

## Installation

```bash
# No installation needed - part of Tallow core
```

## Quick Start

### 1. Measure Signal Quality

```typescript
import { estimateSignalStrength, measureRTT } from '@/lib/network/signal-strength';

// Measure RTT from peer connection
const rtt = await measureRTT(peerConnection);

// Estimate signal level
const level = estimateSignalStrength(rtt, 0); // 'excellent', 'good', 'fair', 'poor', 'disconnected'
```

### 2. Display Signal Indicator

```tsx
import { SignalIndicator } from '@/components/transfer/SignalIndicator';

<SignalIndicator level="good" showLabel />
```

### 3. Monitor Network Quality

```typescript
import { NetworkQualityMonitor } from '@/lib/network/network-quality';

const monitor = new NetworkQualityMonitor();
monitor.addPeer('peer-1', peerConnection);

monitor.on('quality-change', (event) => {
  console.log(`Quality: ${event.newQuality}`);
});
```

### 4. Sort Devices by Proximity

```typescript
import { sortDevicesByProximity } from '@/lib/network/signal-strength';

const rttMap = new Map([
  ['device-1', 8],
  ['device-2', 45],
]);

const sorted = sortDevicesByProximity(devices, rttMap);
```

## Signal Levels

| Level | RTT | Packet Loss | Bars | Color |
|-------|-----|-------------|------|-------|
| Excellent | < 20ms | < 0.5% | 5 | Green |
| Good | 20-50ms | < 2% | 4 | Green |
| Fair | 50-100ms | < 5% | 3 | Yellow |
| Poor | 100-200ms | < 10% | 2 | Red |
| Disconnected | > 200ms | > 50% | 1 | Gray |

## Proximity Levels

| Level | RTT | Description |
|-------|-----|-------------|
| Nearby | < 10ms | Same device or very close LAN |
| Local | 10-50ms | Same local network |
| Remote | > 50ms | Internet connection |

## Common Patterns

### React Hook for Network Quality

```tsx
function useNetworkQuality(peerConnection, peerId) {
  const [monitor] = useState(() => new NetworkQualityMonitor());
  const [signalLevel, setSignalLevel] = useState('disconnected');

  useEffect(() => {
    if (!peerConnection) return;

    monitor.addPeer(peerId, peerConnection);
    monitor.on('signal-change', (e) => {
      if (e.peerId === peerId) setSignalLevel(e.newLevel);
    });

    return () => {
      monitor.removePeer(peerId);
      monitor.destroy();
    };
  }, [peerConnection, peerId]);

  return signalLevel;
}

// Usage
const signalLevel = useNetworkQuality(peerConnection, 'peer-1');
<SignalIndicator level={signalLevel} />
```

### Device Card with Signal

```tsx
function DeviceCard({ device, peerConnection }) {
  const signalLevel = useNetworkQuality(peerConnection, device.id);

  return (
    <div className={styles.card}>
      <h3>{device.name}</h3>
      <CompactSignalIndicator level={signalLevel} />
    </div>
  );
}
```

### Auto-sorting Device List

```tsx
function DeviceList({ devices }) {
  const [rttMap, setRttMap] = useState(new Map());
  const [monitor] = useState(() => new NetworkQualityMonitor());

  useEffect(() => {
    monitor.on('metrics-update', ({ peerId, metrics }) => {
      setRttMap(prev => new Map(prev).set(peerId, metrics.rtt));
    });
  }, [monitor]);

  const sorted = sortDevicesByProximity(devices, rttMap);

  return (
    <div>
      {sorted.map(device => <DeviceCard key={device.id} device={device} />)}
    </div>
  );
}
```

## API Cheat Sheet

### Functions

```typescript
// Signal estimation
estimateSignalStrength(rtt: number, loss: number): SignalLevel
getSignalBars(level: SignalLevel): 1 | 2 | 3 | 4 | 5
getSignalColor(level: SignalLevel): string

// Measurement
measureRTT(pc: RTCPeerConnection): Promise<number | null>
measurePacketLoss(pc: RTCPeerConnection): Promise<number>

// Proximity
estimateProximity(rtt: number): ProximityLevel
getProximityDescription(proximity: ProximityLevel): string

// Device sorting
sortDevicesByProximity(devices: Device[], rtts: Map<string, number>): Device[]
groupDevicesByProximity(devices: Device[], rtts: Map<string, number>): Record<ProximityLevel, Device[]>

// Utilities
calculateJitter(rtts: number[]): number
smoothRTT(current: number, previous: number, alpha?: number): number
```

### NetworkQualityMonitor

```typescript
// Create
const monitor = new NetworkQualityMonitor({
  measurementInterval: 2000,  // ms
  sampleSize: 10,
  smoothingFactor: 0.3,
});

// Manage peers
monitor.addPeer(peerId, peerConnection);
monitor.removePeer(peerId);

// Get data
monitor.getMetrics(peerId): NetworkQualityMetrics | null
monitor.getAllMetrics(): Map<string, NetworkQualityMetrics>

// Control
monitor.start();
monitor.stop();
monitor.destroy();

// Events
monitor.on('metrics-update', ({ peerId, metrics }) => {});
monitor.on('quality-change', ({ peerId, previousQuality, newQuality }) => {});
monitor.on('signal-change', ({ peerId, previousLevel, newLevel }) => {});
monitor.on('error', ({ peerId, error }) => {});
```

### Components

```tsx
// Basic
<SignalIndicator level="good" />

// With label
<SignalIndicator level="excellent" showLabel />

// Small size
<SignalIndicator level="fair" size="sm" />

// Compact (for cards)
<CompactSignalIndicator level="good" />

// With RTT
<SignalIndicatorWithRTT level="good" rttMs={25} showLabel />
```

## Configuration Recommendations

### Real-time Applications
```typescript
new NetworkQualityMonitor({
  measurementInterval: 1000,  // 1 second
  sampleSize: 5,              // Quick response
  smoothingFactor: 0.5,       // Reactive
});
```

### File Transfers
```typescript
new NetworkQualityMonitor({
  measurementInterval: 3000,  // 3 seconds
  sampleSize: 10,             // Stable
  smoothingFactor: 0.3,       // Balanced
});
```

### Background Monitoring
```typescript
new NetworkQualityMonitor({
  measurementInterval: 5000,  // 5 seconds
  sampleSize: 20,             // Very stable
  smoothingFactor: 0.2,       // Smooth
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `measureRTT()` returns `null` | Wait for peer connection to be fully established |
| Signal jumps frequently | Increase `smoothingFactor` or `sampleSize` |
| Memory leak | Call `monitor.destroy()` in cleanup |
| Stale metrics | Check `measurementInterval` isn't too high |
| Inaccurate proximity | Verify RTT measurements are in milliseconds |

## See Also

- [Full Documentation](./SIGNAL_STRENGTH_README.md)
- [Integration Example](../../components/transfer/DeviceDiscoveryWithSignal.example.tsx)
- [Component Demo](../../components/transfer/SignalIndicator.tsx)
