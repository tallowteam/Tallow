# WebRTC Conduit Policy (AGENT 021)

## Objective

Maximize file transfer throughput through WebRTC DataChannel optimization with explicit backpressure handling, adaptive chunk sizing, and parallel channel support. Guarantee that buffer overflows cannot occur and that throughput adapts to measured network conditions.

## Performance Targets

| Network | Target Throughput | Notes |
|---------|-------------------|-------|
| LAN WiFi 6 | 200+ Mbps (~25 MB/s) | Low latency, minimal loss |
| LAN Gigabit Ethernet | 500+ Mbps (~62 MB/s) | Sub-millisecond RTT |
| Internet 100 Mbps | 80+ Mbps (~10 MB/s) | Variable latency and loss |

## Required Controls

### 1. Backpressure Handling

- DataChannel `bufferedAmount` MUST be checked before every send.
- A high water mark (16 MB) MUST pause sending.
- A low water mark (4 MB) MUST resume sending via `bufferedamountlow` event.
- The `bufferedAmountLowThreshold` property MUST be explicitly set on every DataChannel.
- Polling-based backpressure MUST NOT be used; event-driven flow control is required.

### 2. Adaptive Chunk Sizing

Chunk size MUST be dynamically selected based on measured RTT and packet loss:

| Condition | Chunk Size |
|-----------|-----------|
| RTT < 10ms, loss < 0.1% | 256 KB (LAN) |
| RTT < 50ms, loss < 1% | 128 KB (fast internet) |
| RTT < 100ms, loss < 5% | 64 KB (moderate) |
| RTT < 200ms, loss < 10% | 32 KB (poor) |
| Worse | 16 KB (very poor) |

### 3. Unordered Unreliable DataChannels

- Transfer DataChannels MUST use `ordered: false` for maximum throughput.
- Transfer DataChannels MUST use `maxRetransmits: 0` for app-level reliability.
- App-level chunk retransmission MUST be implemented via hash verification and missing-chunk requests.

### 4. Parallel DataChannels

- Multiple parallel DataChannels (2-4) MUST be available for bandwidth aggregation.
- Chunks MUST be distributed round-robin across available channels.
- Per-channel backpressure MUST be enforced independently.

### 5. Bandwidth Target Constants

- Explicit bandwidth target constants MUST be declared in transfer code.
- LAN target: >= 100 MB/s (bytes per second).
- Internet target: >= 10 MB/s (bytes per second).

### 6. Release Gate

- `npm run verify:webrtc:conduit` MUST pass in CI and release workflows.

## Evidence Anchors

- `lib/transfer/adaptive-bitrate.ts` - Adaptive chunk sizing and AIMD congestion control
- `lib/transfer/file-chunking.ts` - Chunk sizing utilities
- `lib/transfer/p2p-internet.ts` - Single-channel backpressure implementation
- `lib/webrtc/data-channel.ts` - DataChannel manager with backpressure
- `lib/webrtc/parallel-channels.ts` - Parallel channel throughput aggregation
- `lib/network/network-quality.ts` - Network quality monitoring
- `tests/unit/network/webrtc-conduit.test.ts` - Unit tests for conduit controls
