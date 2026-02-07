# Signal Strength and Network Quality Monitoring

Complete implementation of signal strength estimation, proximity detection, and network quality monitoring for Tallow's peer-to-peer connections.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Component Usage](#component-usage)
- [Integration Examples](#integration-examples)
- [Performance Considerations](#performance-considerations)

## Overview

The signal strength system provides real-time network quality monitoring for WebRTC peer connections, including:

- **Signal Level Estimation**: WiFi-style 5-bar indicator based on RTT and packet loss
- **Proximity Detection**: Classify devices as nearby, local, or remote
- **Continuous Monitoring**: Periodic measurement of RTT, packet loss, and jitter
- **Device Prioritization**: Sort devices by connection quality
- **Visual Indicators**: Animated signal bars with color coding

## Features

### Signal Strength Estimation

```typescript
import { estimateSignalStrength, getSignalBars } from '@/lib/network/signal-strength';

// Estimate signal level from RTT and packet loss
const level = estimateSignalStrength(25, 1.2); // 'good'
const bars = getSignalBars(level); // 4
```

**Signal Levels:**
- `excellent`: < 20ms RTT, < 0.5% packet loss (5 bars, green)
- `good`: 20-50ms RTT, < 2% packet loss (4 bars, green)
- `fair`: 50-100ms RTT, < 5% packet loss (3 bars, yellow)
- `poor`: 100-200ms RTT, < 10% packet loss (2 bars, red)
- `disconnected`: > 200ms RTT or > 50% packet loss (1 bar, gray)

### RTT Measurement

```typescript
import { measureRTT, measurePacketLoss } from '@/lib/network/signal-strength';

// Measure RTT from WebRTC connection
const rtt = await measureRTT(peerConnection); // 25.3 (ms)
const packetLoss = await measurePacketLoss(peerConnection); // 1.2 (%)
```

Uses `RTCPeerConnection.getStats()` to extract:
- `currentRoundTripTime` from candidate pairs
- `roundTripTime` from remote-inbound-rtp stats
- `packetsLost` and `packetsReceived` for packet loss calculation

### Proximity Detection

```typescript
import { estimateProximity, sortDevicesByProximity } from '@/lib/network/signal-strength';

// Classify proximity from RTT
const proximity = estimateProximity(8); // 'nearby'

// Sort devices by proximity
const rttMap = new Map([
  ['device-1', 8],
  ['device-2', 45],
  ['device-3', 120],
]);
const sorted = sortDevicesByProximity(devices, rttMap);
```

**Proximity Levels:**
- `nearby`: < 10ms (same device or very close LAN)
- `local`: 10-50ms (same local network)
- `remote`: > 50ms (internet connection)

### Network Quality Monitor

```typescript
import { NetworkQualityMonitor } from '@/lib/network/network-quality';

// Create monitor with 3-second interval
const monitor = new NetworkQualityMonitor({
  measurementInterval: 3000,
  sampleSize: 10,
  smoothingFactor: 0.3,
});

// Add peer connections to monitor
monitor.addPeer('peer-1', peerConnection1);
monitor.addPeer('peer-2', peerConnection2);

// Listen for quality changes
monitor.on('quality-change', (event) => {
  console.log(`Quality: ${event.previousQuality} → ${event.newQuality}`);
});

monitor.on('signal-change', (event) => {
  console.log(`Signal: ${event.previousLevel} → ${event.newLevel}`);
});

// Get current metrics
const metrics = monitor.getMetrics('peer-1');
console.log(metrics.rtt, metrics.signalLevel, metrics.jitter);
```

## Architecture

### File Structure

```
lib/network/
├── signal-strength.ts        # Core signal estimation and RTT measurement
└── network-quality.ts         # Continuous monitoring with EventEmitter

components/transfer/
├── SignalIndicator.tsx        # Visual signal bars component
├── SignalIndicator.module.css # Animated signal bar styles
└── DeviceDiscoveryWithSignal.example.tsx # Integration example
```

### Data Flow

```
RTCPeerConnection
      ↓
measureRTT() / measurePacketLoss()
      ↓
estimateSignalStrength()
      ↓
SignalLevel (excellent/good/fair/poor/disconnected)
      ↓
SignalIndicator component
      ↓
Visual bars (animated, color-coded)
```

### Monitoring Flow

```
NetworkQualityMonitor
      ↓
Periodic measurements (every 2-3s)
      ↓
Smoothing + Jitter calculation
      ↓
Quality change detection
      ↓
Events: 'quality-change', 'signal-change', 'metrics-update'
      ↓
UI updates
```

## API Reference

### `signal-strength.ts`

#### Functions

**`estimateSignalStrength(rttMs: number, packetLoss: number): SignalLevel`**
- Estimates signal quality from RTT and packet loss
- Returns: `'excellent' | 'good' | 'fair' | 'poor' | 'disconnected'`

**`getSignalBars(level: SignalLevel): 1 | 2 | 3 | 4 | 5`**
- Converts signal level to number of bars
- Returns: 1-5 bars for display

**`getSignalColor(level: SignalLevel): string`**
- Gets CSS color for signal level
- Returns: CSS custom property name

**`measureRTT(peerConnection: RTCPeerConnection): Promise<number | null>`**
- Measures RTT from WebRTC stats
- Returns: RTT in milliseconds or null if unavailable

**`measurePacketLoss(peerConnection: RTCPeerConnection): Promise<number>`**
- Measures packet loss percentage
- Returns: 0-100 (percentage)

**`estimateProximity(rttMs: number): ProximityLevel`**
- Classifies proximity from RTT
- Returns: `'nearby' | 'local' | 'remote'`

**`sortDevicesByProximity(devices: Device[], rtts: Map<string, number>): Device[]`**
- Sorts devices by proximity (nearest first)
- Tie-breakers: favorites first, online first, alphabetical

**`groupDevicesByProximity(devices: Device[], rtts: Map<string, number>): Record<ProximityLevel, Device[]>`**
- Groups devices by proximity level
- Returns: Object with nearby/local/remote arrays

**`calculateJitter(rttMeasurements: number[]): number`**
- Calculates jitter (standard deviation of RTT)
- Returns: Jitter in milliseconds

**`smoothRTT(currentRTT: number, previousSmoothed: number, alpha: number): number`**
- Smooths RTT using exponential moving average
- Alpha: 0-1 (default: 0.3, higher = more weight to current)

### `network-quality.ts`

#### `NetworkQualityMonitor` Class

**Constructor**
```typescript
new NetworkQualityMonitor({
  measurementInterval?: number,  // Default: 2000ms
  sampleSize?: number,           // Default: 10 samples
  smoothingFactor?: number,      // Default: 0.3
  autoStart?: boolean,           // Default: true
})
```

**Methods**

- `addPeer(peerId: string, peerConnection: RTCPeerConnection): void`
- `removePeer(peerId: string): void`
- `getMetrics(peerId: string): NetworkQualityMetrics | null`
- `getAllMetrics(): Map<string, NetworkQualityMetrics>`
- `start(): void` - Start monitoring
- `stop(): void` - Stop monitoring
- `destroy(): void` - Cleanup and remove all listeners
- `updateConfig(config: Partial<NetworkQualityMonitorConfig>): void`

**Events**

- `'metrics-update'`: Emitted on each measurement
  ```typescript
  { peerId: string, metrics: NetworkQualityMetrics }
  ```

- `'quality-change'`: Emitted when quality level changes
  ```typescript
  {
    peerId: string,
    previousQuality: ConnectionQuality,
    newQuality: ConnectionQuality,
    metrics: NetworkQualityMetrics
  }
  ```

- `'signal-change'`: Emitted when signal level changes
  ```typescript
  {
    peerId: string,
    previousLevel: SignalLevel,
    newLevel: SignalLevel,
    metrics: NetworkQualityMetrics
  }
  ```

- `'error'`: Emitted on measurement errors
  ```typescript
  { peerId?: string, error: Error }
  ```

**NetworkQualityMetrics Interface**
```typescript
{
  peerId: string;
  rtt: number;              // Current RTT in ms
  smoothedRtt: number;      // Exponentially smoothed RTT
  packetLoss: number;       // 0-100 percentage
  jitter: number;           // Standard deviation of RTT
  signalLevel: SignalLevel;
  proximity: ProximityLevel;
  quality: ConnectionQuality;
  timestamp: number;
  measurementCount: number;
}
```

## Component Usage

### `SignalIndicator` Component

```tsx
import { SignalIndicator } from '@/components/transfer/SignalIndicator';

// Basic usage
<SignalIndicator level="good" />

// With label
<SignalIndicator level="excellent" showLabel />

// Small size
<SignalIndicator level="fair" size="sm" />

// With tooltip
<SignalIndicator level="poor" showTooltip tooltipContent="RTT: 150ms" />
```

**Props:**
- `level: SignalLevel` - Required signal level
- `showLabel?: boolean` - Show text label (default: false)
- `size?: 'sm' | 'md'` - Size variant (default: 'md')
- `showTooltip?: boolean` - Show hover tooltip (default: false)
- `tooltipContent?: string` - Custom tooltip text
- `className?: string` - Additional CSS class

### Compact Variant

```tsx
import { CompactSignalIndicator } from '@/components/transfer/SignalIndicator';

// Minimal display for device cards
<CompactSignalIndicator level="good" />
```

### With RTT Display

```tsx
import { SignalIndicatorWithRTT } from '@/components/transfer/SignalIndicator';

<SignalIndicatorWithRTT level="good" rttMs={25} showLabel />
```

## Integration Examples

### 1. Basic Device Card Integration

```tsx
import { CompactSignalIndicator } from '@/components/transfer/SignalIndicator';
import { estimateSignalStrength } from '@/lib/network/signal-strength';

function DeviceCard({ device, rtt, packetLoss }) {
  const signalLevel = estimateSignalStrength(rtt, packetLoss);

  return (
    <div className={styles.deviceCard}>
      <h3>{device.name}</h3>
      <CompactSignalIndicator level={signalLevel} />
    </div>
  );
}
```

### 2. Continuous Monitoring

```tsx
import { useEffect, useState } from 'react';
import { NetworkQualityMonitor } from '@/lib/network/network-quality';

function TransferView({ peerConnection, peerId }) {
  const [monitor] = useState(() => new NetworkQualityMonitor());
  const [signalLevel, setSignalLevel] = useState('disconnected');

  useEffect(() => {
    monitor.addPeer(peerId, peerConnection);

    monitor.on('signal-change', (event) => {
      if (event.peerId === peerId) {
        setSignalLevel(event.newLevel);
      }
    });

    return () => {
      monitor.removePeer(peerId);
    };
  }, [peerConnection, peerId, monitor]);

  return <SignalIndicator level={signalLevel} showLabel />;
}
```

### 3. Device Sorting by Proximity

```tsx
import { sortDevicesByProximity } from '@/lib/network/signal-strength';

function DeviceList({ devices, rttMap }) {
  const sortedDevices = sortDevicesByProximity(devices, rttMap);

  return (
    <div>
      {sortedDevices.map(device => (
        <DeviceCard key={device.id} device={device} />
      ))}
    </div>
  );
}
```

### 4. Custom Hook for Network Quality

```tsx
import { useEffect, useState } from 'react';
import { NetworkQualityMonitor } from '@/lib/network/network-quality';

export function useNetworkQuality(peerConnection, peerId) {
  const [metrics, setMetrics] = useState(null);
  const [monitor] = useState(() => new NetworkQualityMonitor());

  useEffect(() => {
    if (!peerConnection) return;

    monitor.addPeer(peerId, peerConnection);
    monitor.on('metrics-update', ({ peerId: id, metrics: m }) => {
      if (id === peerId) setMetrics(m);
    });

    return () => monitor.removePeer(peerId);
  }, [peerConnection, peerId, monitor]);

  return {
    signalLevel: metrics?.signalLevel ?? 'disconnected',
    rtt: metrics?.rtt ?? null,
    quality: metrics?.quality ?? 'disconnected',
  };
}
```

## Performance Considerations

### Measurement Intervals

- **Default: 2000ms (2 seconds)** - Good balance for UI updates
- **Fast: 1000ms** - More responsive, higher CPU usage
- **Slow: 5000ms** - Lower overhead, delayed quality detection

```typescript
// Low-latency scenario (gaming, real-time collaboration)
const monitor = new NetworkQualityMonitor({ measurementInterval: 1000 });

// File transfer scenario
const monitor = new NetworkQualityMonitor({ measurementInterval: 3000 });
```

### Sample Size

- **Default: 10 samples** - Accurate jitter calculation
- **Small: 5 samples** - Faster response to changes
- **Large: 20 samples** - More stable measurements

### Smoothing Factor

- **Default: 0.3** - Balanced responsiveness
- **High: 0.5-0.7** - React faster to RTT changes
- **Low: 0.1-0.2** - More stable, slower to change

### Memory Management

```typescript
// Always destroy monitor when component unmounts
useEffect(() => {
  const monitor = new NetworkQualityMonitor();

  return () => {
    monitor.destroy(); // Clears timers and listeners
  };
}, []);
```

### Batch Updates

The monitor processes all peers in parallel during each measurement cycle:

```typescript
// Efficient: all peers measured simultaneously
const monitor = new NetworkQualityMonitor();
monitor.addPeer('peer-1', pc1);
monitor.addPeer('peer-2', pc2);
monitor.addPeer('peer-3', pc3);
// Single measurement cycle measures all 3 peers in parallel
```

## Testing

### Manual Testing

```tsx
import { SignalIndicatorDemo } from '@/components/transfer/SignalIndicator';

// Renders all signal levels for visual verification
<SignalIndicatorDemo />
```

### Unit Testing

```typescript
import { estimateSignalStrength, getSignalBars } from '@/lib/network/signal-strength';

describe('Signal Strength', () => {
  it('should estimate excellent signal', () => {
    expect(estimateSignalStrength(15, 0.3)).toBe('excellent');
    expect(getSignalBars('excellent')).toBe(5);
  });

  it('should handle high packet loss', () => {
    expect(estimateSignalStrength(30, 12)).toBe('poor');
  });
});
```

## Troubleshooting

### No RTT Measurements

**Problem:** `measureRTT()` returns `null`

**Solutions:**
- Ensure peer connection is in 'connected' state
- Check that ICE gathering is complete
- Verify data channels are open
- Wait for first few packets to be exchanged

### Unstable Signal Levels

**Problem:** Signal level fluctuates rapidly

**Solutions:**
- Increase smoothing factor (e.g., 0.2 instead of 0.3)
- Increase sample size (e.g., 15 instead of 10)
- Increase measurement interval (e.g., 3000ms instead of 2000ms)

### High Memory Usage

**Problem:** Memory grows over time

**Solutions:**
- Call `monitor.destroy()` when done
- Limit number of monitored peers
- Reduce sample size
- Remove inactive peers with `monitor.removePeer()`

## Future Enhancements

- [ ] Bandwidth estimation from transfer rates
- [ ] Network type detection (WiFi, Ethernet, Cellular)
- [ ] Historical metrics with graphing
- [ ] Adaptive quality recommendations
- [ ] Congestion detection algorithms
- [ ] Multi-path connection support

## License

MIT License - Part of the Tallow project
