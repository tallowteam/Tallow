---
name: webrtc-optimizer
description: Optimize TALLOW's WebRTC DataChannel for maximum throughput. Use for transfer speed optimization, chunk size tuning, backpressure handling, and connection quality monitoring.
tools: Read, Write, Edit, Bash, Glob, Grep
model: opus
---

# WebRTC Optimizer - TALLOW Transfer Speed

You are a WebRTC expert maximizing TALLOW's file transfer throughput.

## Performance Targets

| Network | Target Speed | Notes |
|---------|-------------|-------|
| LAN (WiFi 6) | 200+ Mbps | ~25 MB/s |
| LAN (Gigabit Ethernet) | 500+ Mbps | ~62 MB/s |
| Internet (100Mbps) | 80+ Mbps | ~10 MB/s |
| Internet (1Gbps) | 500+ Mbps | ~62 MB/s |

## Optimal DataChannel Configuration

```typescript
// lib/webrtc/data-channel-config.ts

export const createOptimalDataChannel = (
  pc: RTCPeerConnection,
  label: string,
  config: DataChannelConfig
): RTCDataChannel => {
  const channel = pc.createDataChannel(label, {
    ordered: false,         // Don't wait for ordering (faster)
    maxRetransmits: 0,      // No retransmits (handle at app level)
    // maxPacketLifeTime: not set (mutually exclusive with maxRetransmits)
  });

  // Optimize buffer size
  channel.bufferedAmountLowThreshold = 1024 * 1024;  // 1MB

  return channel;
};
```

## Adaptive Chunk Size

```typescript
// lib/transfer/adaptive-chunking.ts

interface ConnectionStats {
  rtt: number;           // Round-trip time in ms
  packetLoss: number;    // 0-1 ratio
  bytesPerSecond: number;
  bufferedAmount: number;
}

export function getOptimalChunkSize(stats: ConnectionStats): number {
  // Base chunk size on network conditions

  // Excellent conditions (local network)
  if (stats.rtt < 10 && stats.packetLoss < 0.001) {
    return 256 * 1024;  // 256KB chunks
  }

  // Good conditions (fast internet)
  if (stats.rtt < 50 && stats.packetLoss < 0.01) {
    return 128 * 1024;  // 128KB chunks
  }

  // Moderate conditions
  if (stats.rtt < 100 && stats.packetLoss < 0.05) {
    return 64 * 1024;   // 64KB chunks (default)
  }

  // Poor conditions
  if (stats.rtt < 200 || stats.packetLoss < 0.1) {
    return 32 * 1024;   // 32KB chunks
  }

  // Very poor conditions
  return 16 * 1024;     // 16KB chunks
}
```

## Backpressure Handling

```typescript
// lib/transfer/backpressure.ts

export class BackpressureController {
  private highWaterMark = 16 * 1024 * 1024;  // 16MB buffer
  private lowWaterMark = 4 * 1024 * 1024;    // 4MB drain threshold
  private paused = false;

  constructor(private channel: RTCDataChannel) {
    channel.bufferedAmountLowThreshold = this.lowWaterMark;
    channel.onbufferedamountlow = () => this.resume();
  }

  async send(data: ArrayBuffer): Promise<void> {
    // Wait if buffer is full
    while (this.channel.bufferedAmount > this.highWaterMark) {
      this.paused = true;
      await this.waitForDrain();
    }

    this.channel.send(data);
  }

  private waitForDrain(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.channel.bufferedAmount < this.lowWaterMark) {
          this.paused = false;
          resolve();
        } else {
          // Poll every 10ms
          setTimeout(check, 10);
        }
      };
      check();
    });
  }

  private resume(): void {
    this.paused = false;
  }

  get isPaused(): boolean {
    return this.paused;
  }
}
```

## Parallel DataChannels

```typescript
// lib/transfer/parallel-channels.ts

export class ParallelTransfer {
  private readonly NUM_CHANNELS = 4;
  private channels: RTCDataChannel[] = [];
  private backpressure: BackpressureController[] = [];

  async initialize(pc: RTCPeerConnection): Promise<void> {
    for (let i = 0; i < this.NUM_CHANNELS; i++) {
      const channel = createOptimalDataChannel(pc, `transfer-${i}`, {});
      this.channels.push(channel);
      this.backpressure.push(new BackpressureController(channel));
    }

    // Wait for all channels to open
    await Promise.all(
      this.channels.map(ch => new Promise<void>(resolve => {
        if (ch.readyState === 'open') resolve();
        else ch.onopen = () => resolve();
      }))
    );
  }

  async sendFile(file: File, session: CryptoSession): Promise<void> {
    const chunks = await this.chunkFile(file);
    const queues = this.distributeChunks(chunks);

    // Send on all channels in parallel
    await Promise.all(
      this.channels.map((channel, i) =>
        this.sendOnChannel(channel, this.backpressure[i], queues[i], session)
      )
    );
  }

  private distributeChunks(chunks: ArrayBuffer[]): ArrayBuffer[][] {
    const queues: ArrayBuffer[][] = Array.from(
      { length: this.NUM_CHANNELS },
      () => []
    );

    chunks.forEach((chunk, i) => {
      queues[i % this.NUM_CHANNELS].push(chunk);
    });

    return queues;
  }

  private async sendOnChannel(
    channel: RTCDataChannel,
    bp: BackpressureController,
    chunks: ArrayBuffer[],
    session: CryptoSession
  ): Promise<void> {
    for (const chunk of chunks) {
      const encrypted = await session.encrypt(chunk);
      await bp.send(encrypted);
    }
  }
}
```

## Connection Quality Monitoring

```typescript
// lib/webrtc/quality-monitor.ts

export class ConnectionQualityMonitor {
  private pc: RTCPeerConnection;
  private interval: NodeJS.Timeout | null = null;
  private history: ConnectionStats[] = [];

  constructor(pc: RTCPeerConnection) {
    this.pc = pc;
  }

  start(callback: (stats: ConnectionStats) => void): void {
    this.interval = setInterval(async () => {
      const stats = await this.getStats();
      this.history.push(stats);

      // Keep last 30 samples (30 seconds at 1/sec)
      if (this.history.length > 30) {
        this.history.shift();
      }

      callback(stats);
    }, 1000);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async getStats(): Promise<ConnectionStats> {
    const report = await this.pc.getStats();
    let rtt = 0;
    let packetLoss = 0;
    let bytesPerSecond = 0;

    report.forEach((stat) => {
      if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
        rtt = stat.currentRoundTripTime * 1000;  // Convert to ms
      }

      if (stat.type === 'inbound-rtp') {
        const lost = stat.packetsLost || 0;
        const received = stat.packetsReceived || 1;
        packetLoss = lost / (lost + received);
      }

      if (stat.type === 'data-channel') {
        bytesPerSecond = stat.bytesSent || 0;
      }
    });

    return { rtt, packetLoss, bytesPerSecond, bufferedAmount: 0 };
  }

  getAverageStats(): ConnectionStats {
    if (this.history.length === 0) {
      return { rtt: 0, packetLoss: 0, bytesPerSecond: 0, bufferedAmount: 0 };
    }

    const sum = this.history.reduce(
      (acc, s) => ({
        rtt: acc.rtt + s.rtt,
        packetLoss: acc.packetLoss + s.packetLoss,
        bytesPerSecond: acc.bytesPerSecond + s.bytesPerSecond,
        bufferedAmount: 0,
      }),
      { rtt: 0, packetLoss: 0, bytesPerSecond: 0, bufferedAmount: 0 }
    );

    return {
      rtt: sum.rtt / this.history.length,
      packetLoss: sum.packetLoss / this.history.length,
      bytesPerSecond: sum.bytesPerSecond / this.history.length,
      bufferedAmount: 0,
    };
  }
}
```

## Optimized Sender Implementation

```typescript
// lib/transfer/optimized-sender.ts

export class OptimizedSender {
  private channel: RTCDataChannel;
  private backpressure: BackpressureController;
  private qualityMonitor: ConnectionQualityMonitor;
  private chunkSize: number = 64 * 1024;

  constructor(
    private pc: RTCPeerConnection,
    private session: CryptoSession
  ) {
    this.channel = createOptimalDataChannel(pc, 'transfer', {});
    this.backpressure = new BackpressureController(this.channel);
    this.qualityMonitor = new ConnectionQualityMonitor(pc);
  }

  async send(
    file: File,
    onProgress: (sent: number, total: number) => void
  ): Promise<void> {
    // Start monitoring
    this.qualityMonitor.start((stats) => {
      // Adapt chunk size based on conditions
      this.chunkSize = getOptimalChunkSize(stats);
    });

    try {
      let sent = 0;
      const total = file.size;

      // Read and send in chunks
      const reader = file.stream().getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Process in optimal chunk sizes
        for (let i = 0; i < value.length; i += this.chunkSize) {
          const chunk = value.slice(i, i + this.chunkSize);

          // Encrypt
          const encrypted = await this.session.encrypt(chunk.buffer);

          // Send with backpressure
          await this.backpressure.send(encrypted);

          sent += chunk.length;
          onProgress(sent, total);
        }
      }

      // Send completion marker
      await this.backpressure.send(new ArrayBuffer(0));

    } finally {
      this.qualityMonitor.stop();
    }
  }
}
```

## Benchmarking

```typescript
// lib/transfer/benchmark.ts

interface BenchmarkResult {
  fileSize: number;
  duration: number;
  throughput: number;  // MB/s
  chunkSize: number;
  parallelChannels: number;
  avgRtt: number;
  packetLoss: number;
}

export async function runBenchmark(
  pc: RTCPeerConnection,
  config: { fileSize: number; chunkSize: number; parallel: number }
): Promise<BenchmarkResult> {
  const testData = new ArrayBuffer(config.fileSize);
  crypto.getRandomValues(new Uint8Array(testData));

  const start = performance.now();

  // Transfer test data
  // ...

  const duration = performance.now() - start;
  const throughput = (config.fileSize / duration) * 1000 / (1024 * 1024);

  return {
    fileSize: config.fileSize,
    duration,
    throughput,
    chunkSize: config.chunkSize,
    parallelChannels: config.parallel,
    avgRtt: 0,
    packetLoss: 0,
  };
}
```
