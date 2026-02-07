# Tallow Metrics Integration Guide

This guide shows how to integrate the Prometheus metrics system into existing Tallow components.

## Table of Contents

1. [Transfer Manager Integration](#transfer-manager-integration)
2. [WebRTC Connection Integration](#webrtc-connection-integration)
3. [Crypto Operations Integration](#crypto-operations-integration)
4. [Discovery Service Integration](#discovery-service-integration)
5. [Room Management Integration](#room-management-integration)
6. [Error Handling Integration](#error-handling-integration)
7. [API Routes Integration](#api-routes-integration)

---

## Transfer Manager Integration

### Location: `lib/transfer/transfer-manager.ts`

```typescript
import {
  recordTransfer,
  recordBytes,
  timedTransfer,
  recordError,
  startTimer,
} from '@/lib/metrics';

class TransferManager {
  async sendFile(file: File, peer: Peer): Promise<void> {
    const stopTimer = startTimer();

    try {
      // Track transfer with automatic timing
      await timedTransfer(
        this.getConnectionType(), // 'p2p' or 'relay'
        async () => {
          await this.performTransfer(file, peer);
        },
        file.size,
        file.type
      );

      // Or manual tracking:
      // await this.performTransfer(file, peer);
      // const duration = stopTimer();
      // recordTransfer(file.size, duration, 'success', 'p2p', file.type);

    } catch (error) {
      const duration = stopTimer();
      recordTransfer(file.size, duration, 'failed', 'p2p', file.type);
      recordError('transfer', 'high');
      throw error;
    }
  }

  private onTransferProgress(bytes: number) {
    // Track bytes as they're transferred
    recordBytes(bytes, 'sent');
  }

  async cancelTransfer(transferId: string): Promise<void> {
    const transfer = this.getTransfer(transferId);
    const duration = (Date.now() - transfer.startTime) / 1000;

    recordTransfer(
      transfer.bytesTransferred,
      duration,
      'cancelled',
      transfer.method,
      transfer.fileType
    );
  }

  private getConnectionType(): 'p2p' | 'relay' {
    return this.usingRelay ? 'relay' : 'p2p';
  }
}
```

---

## WebRTC Connection Integration

### Location: `lib/webrtc/connection-manager.ts`

```typescript
import {
  recordConnection,
  updateActiveConnections,
  recordWebRTCConnectionTime,
  recordNetworkLatency,
  recordError,
} from '@/lib/metrics';

class WebRTCConnectionManager {
  async connect(peer: PeerInfo): Promise<RTCPeerConnection> {
    const startTime = performance.now();

    try {
      const connection = await this.establishConnection(peer);
      const duration = (performance.now() - startTime) / 1000;

      // Get connection type from ICE candidate
      const connectionType = this.getConnectionType(connection);

      // Record successful connection
      recordConnection('webrtc', true, connectionType);
      recordWebRTCConnectionTime(duration, connectionType);

      // Track as active
      updateActiveConnections('webrtc', 1);

      // Monitor latency
      this.startLatencyMonitoring(connection);

      return connection;

    } catch (error) {
      const duration = (performance.now() - startTime) / 1000;

      recordConnection('webrtc', false);
      recordWebRTCConnectionTime(duration, 'failed');
      recordError('network', 'high');

      throw error;
    }
  }

  private onConnectionClosed(connection: RTCPeerConnection) {
    updateActiveConnections('webrtc', -1);
  }

  private getConnectionType(connection: RTCPeerConnection): string {
    const stats = connection.getStats();
    // Extract candidate type (host, srflx, relay)
    return this.extractCandidateType(stats);
  }

  private startLatencyMonitoring(connection: RTCPeerConnection) {
    setInterval(async () => {
      const latency = await this.measureLatency(connection);
      const peerType = this.isLocalPeer(connection) ? 'local' : 'internet';
      recordNetworkLatency(latency, peerType);
    }, 5000); // Every 5 seconds
  }
}
```

---

## Crypto Operations Integration

### Location: `lib/crypto/encryption.ts`

```typescript
import {
  recordEncryption,
  timedEncryption,
  recordError,
} from '@/lib/metrics';

class CryptoService {
  async encryptFile(file: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> {
    return await timedEncryption('aes-gcm', 'encrypt', async () => {
      try {
        return await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: this.generateIV() },
          key,
          file
        );
      } catch (error) {
        recordError('crypto', 'critical');
        throw error;
      }
    });
  }

  async generateMLKEMKeyPair(): Promise<KeyPair> {
    const startTime = performance.now();

    try {
      const keyPair = await this.mlkem.generateKeyPair();
      const duration = (performance.now() - startTime) / 1000;

      recordEncryption('ml-kem', 'keygen', duration);

      return keyPair;

    } catch (error) {
      recordError('crypto', 'critical');
      throw error;
    }
  }

  async signData(data: ArrayBuffer, privateKey: CryptoKey): Promise<ArrayBuffer> {
    const startTime = performance.now();

    try {
      const signature = await crypto.subtle.sign(
        { name: 'Ed25519' },
        privateKey,
        data
      );

      const duration = (performance.now() - startTime) / 1000;
      recordEncryption('ed25519', 'sign', duration);

      return signature;

    } catch (error) {
      recordError('crypto', 'high');
      throw error;
    }
  }
}
```

---

## Discovery Service Integration

### Location: `lib/discovery/mdns-discovery.ts`

```typescript
import { recordDiscoveredDevices } from '@/lib/metrics';

class MDNSDiscoveryService {
  private devices: Map<string, DeviceInfo> = new Map();

  private onDeviceDiscovered(device: DeviceInfo) {
    this.devices.set(device.id, device);
    this.updateMetrics();
  }

  private onDeviceLost(deviceId: string) {
    this.devices.delete(deviceId);
    this.updateMetrics();
  }

  private updateMetrics() {
    recordDiscoveredDevices(this.devices.size);
  }

  private startDiscovery() {
    // Update metrics every 10 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 10000);
  }
}
```

---

## Room Management Integration

### Location: `lib/rooms/room-manager.ts`

```typescript
import {
  recordActiveRooms,
  recordRoom,
  recordError,
} from '@/lib/metrics';

class RoomManager {
  private activeRooms: Map<string, Room> = new Map();

  async createRoom(options: RoomOptions): Promise<Room> {
    try {
      const room = await this.initializeRoom(options);

      this.activeRooms.set(room.id, room);

      // Record room creation
      recordRoom('created');
      recordActiveRooms(this.activeRooms.size);

      return room;

    } catch (error) {
      recordError('storage', 'medium');
      throw error;
    }
  }

  async joinRoom(roomCode: string): Promise<Room> {
    const room = await this.findRoom(roomCode);

    if (!room) {
      recordError('validation', 'low');
      throw new Error('Room not found');
    }

    recordRoom('joined');

    return room;
  }

  async closeRoom(roomId: string): Promise<void> {
    const room = this.activeRooms.get(roomId);

    if (room) {
      await room.close();
      this.activeRooms.delete(roomId);

      recordRoom('closed');
      recordActiveRooms(this.activeRooms.size);
    }
  }

  private onRoomExpired(room: Room) {
    this.activeRooms.delete(room.id);

    recordRoom('expired');
    recordActiveRooms(this.activeRooms.size);
  }
}
```

---

## Error Handling Integration

### Location: `lib/errors/error-handler.ts`

```typescript
import { recordError } from '@/lib/metrics';

class ErrorHandler {
  handleError(error: Error, context?: ErrorContext) {
    const severity = this.determineSeverity(error);
    const type = this.categorizeError(error);

    // Record error metric
    recordError(type, severity);

    // Then handle error (logging, reporting, etc.)
    this.logError(error, context);

    if (severity === 'critical') {
      this.alertTeam(error, context);
    }
  }

  private categorizeError(error: Error): ErrorType {
    if (error instanceof CryptoError) return 'crypto';
    if (error instanceof NetworkError) return 'network';
    if (error instanceof TransferError) return 'transfer';
    if (error instanceof ValidationError) return 'validation';
    if (error instanceof AuthError) return 'auth';
    if (error instanceof StorageError) return 'storage';
    return 'unknown';
  }

  private determineSeverity(error: Error): Severity {
    if (error instanceof CryptoError) return 'critical';
    if (error instanceof NetworkError) return 'high';
    if (error instanceof TransferError) return 'medium';
    return 'low';
  }
}

// Usage in components
try {
  await performOperation();
} catch (error) {
  errorHandler.handleError(error, { component: 'TransferManager' });
  throw error;
}
```

---

## API Routes Integration

### Location: `app/api/*/route.ts`

The API routes already have metrics middleware via `withAPIMetrics`. For custom business logic metrics:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAPIMetrics } from '@/lib/middleware/api-metrics';
import {
  recordTransfer,
  recordError,
  recordMemoryUsage,
} from '@/lib/metrics';

export const GET = withAPIMetrics(async (req: NextRequest) => {
  try {
    // API metrics (duration, status) handled by middleware

    // Custom business logic metrics
    const result = await processRequest(req);

    if (result.type === 'transfer') {
      recordTransfer(
        result.bytes,
        result.duration,
        'success',
        'p2p',
        result.fileType
      );
    }

    // Track memory periodically
    const memUsage = process.memoryUsage();
    recordMemoryUsage(memUsage.heapUsed, 'heap');
    recordMemoryUsage(memUsage.external, 'external');
    recordMemoryUsage(memUsage.rss, 'rss');

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    recordError('network', 'high');
    throw error;
  }
});
```

---

## React Component Integration

### Location: `components/transfer/TransferManager.tsx`

```typescript
import { useEffect } from 'react';
import { recordTransfer, recordError } from '@/lib/metrics';

export function TransferManager() {
  const handleFileTransfer = async (file: File) => {
    const startTime = performance.now();

    try {
      await transferFile(file);

      const duration = (performance.now() - startTime) / 1000;
      recordTransfer(file.size, duration, 'success', 'p2p', file.type);

      showSuccessMessage();

    } catch (error) {
      const duration = (performance.now() - startTime) / 1000;
      recordTransfer(file.size, duration, 'failed', 'p2p', file.type);
      recordError('transfer', 'high');

      showErrorMessage(error);
    }
  };

  return (
    <div>
      <FileDropzone onFileDrop={handleFileTransfer} />
    </div>
  );
}
```

---

## Zustand Store Integration

### Location: `lib/stores/transfer-store.ts`

```typescript
import { create } from 'zustand';
import {
  recordTransfer,
  updateActiveConnections,
  recordError,
} from '@/lib/metrics';

interface TransferStore {
  transfers: Transfer[];
  addTransfer: (transfer: Transfer) => void;
  completeTransfer: (id: string) => void;
  failTransfer: (id: string, error: Error) => void;
}

export const useTransferStore = create<TransferStore>((set, get) => ({
  transfers: [],

  addTransfer: (transfer) => {
    set((state) => ({
      transfers: [...state.transfers, transfer],
    }));

    // No metrics here - recorded when transfer actually completes
  },

  completeTransfer: (id) => {
    const transfer = get().transfers.find(t => t.id === id);

    if (transfer) {
      const duration = (Date.now() - transfer.startTime) / 1000;

      recordTransfer(
        transfer.size,
        duration,
        'success',
        transfer.method,
        transfer.fileType
      );
    }

    set((state) => ({
      transfers: state.transfers.map(t =>
        t.id === id ? { ...t, status: 'completed' } : t
      ),
    }));
  },

  failTransfer: (id, error) => {
    const transfer = get().transfers.find(t => t.id === id);

    if (transfer) {
      const duration = (Date.now() - transfer.startTime) / 1000;

      recordTransfer(
        transfer.size,
        duration,
        'failed',
        transfer.method,
        transfer.fileType
      );

      recordError('transfer', 'high');
    }

    set((state) => ({
      transfers: state.transfers.map(t =>
        t.id === id ? { ...t, status: 'failed', error } : t
      ),
    }));
  },
}));
```

---

## Memory Usage Monitoring

### Location: `lib/monitoring/system-monitor.ts`

```typescript
import { recordMemoryUsage } from '@/lib/metrics';

class SystemMonitor {
  startMonitoring() {
    // Update metrics every 30 seconds
    setInterval(() => {
      this.recordSystemMetrics();
    }, 30000);
  }

  private recordSystemMetrics() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();

      recordMemoryUsage(mem.heapUsed, 'heap');
      recordMemoryUsage(mem.external, 'external');
      recordMemoryUsage(mem.rss, 'rss');
    }
  }
}

// Start monitoring in app initialization
export const systemMonitor = new SystemMonitor();
systemMonitor.startMonitoring();
```

---

## Testing Metrics

```typescript
import { describe, it, expect } from 'vitest';
import { recordTransfer, getMetricsSnapshot } from '@/lib/metrics';

describe('Transfer Metrics', () => {
  it('should record successful transfer', () => {
    recordTransfer(1024, 5.0, 'success', 'p2p', 'text/plain');

    const metrics = getMetricsSnapshot();

    expect(metrics).toContain('tallow_transfers_total{status="success"} 1');
    expect(metrics).toContain('tallow_transfer_bytes_total');
  });
});
```

---

## Deployment Checklist

- [ ] Metrics endpoint accessible at `/api/metrics`
- [ ] Prometheus scrape config updated
- [ ] Grafana dashboard created
- [ ] Alerts configured for critical metrics
- [ ] Metrics endpoint behind internal network
- [ ] No PII or sensitive data in metrics
- [ ] Label cardinality < 10 unique values per label
- [ ] High-frequency operations use sampling
- [ ] Memory usage monitored
- [ ] Error tracking operational

---

## Next Steps

1. **Set up Prometheus**: Configure scraping of `/api/metrics`
2. **Create Grafana dashboards**: Visualize transfer rates, errors, latency
3. **Configure alerts**: Alert on high error rates, slow transfers
4. **Integrate with existing code**: Add metrics to transfer/connection logic
5. **Monitor and tune**: Adjust buckets, labels based on real data
