# WebTransport Quick Reference

## Installation

WebTransport is built into the browser (Chrome 97+). No npm packages needed for client-side.

## Basic Usage

### 1. Check Support

```typescript
import { isWebTransportSupported, getWebTransportSupport } from '@/lib/transport/webtransport';

if (isWebTransportSupported()) {
  // Use WebTransport
} else {
  const support = getWebTransportSupport();
  console.log(support.reason);
  console.log(support.fallbackSuggestion);
  // Fall back to WebRTC or WebSocket
}
```

### 2. Connect

```typescript
import { connect } from '@/lib/transport/webtransport';

const connection = await connect('https://relay.example.com:4433/transfer');
```

### 3. Send/Receive Data

**Streams (reliable, in-order):**

```typescript
const { readable, writable } = await connection.createBidirectionalStream();

// Send
const writer = writable.getWriter();
await writer.write(new Uint8Array([1, 2, 3]));
await writer.close();

// Receive
const reader = readable.getReader();
const { value, done } = await reader.read();
console.log(value); // Uint8Array
```

**Datagrams (unreliable, low-latency):**

```typescript
// Send
await connection.sendDatagram(new Uint8Array([1, 2, 3]));

// Receive
connection.ondatagram = (data) => {
  console.log('Received:', data);
};
```

### 4. Close

```typescript
connection.close({ closeCode: 0, reason: 'Transfer complete' });
```

## Automatic Transport Selection

```typescript
import { selectBestTransport } from '@/lib/transport/transport-selector';

const result = await selectBestTransport({
  requireHighThroughput: true,
  requireLowLatency: true,
  serverUrl: 'https://relay.example.com:4433/transfer',
});

console.log('Selected:', result.selected); // 'webtransport', 'webrtc', or 'websocket'
console.log('Estimated latency:', result.estimatedLatency, 'ms');
console.log('Estimated bandwidth:', result.estimatedBandwidth, 'Mbps');
```

## File Transfer Example

```typescript
import { connect, writeStream } from '@/lib/transport/webtransport';

async function sendFile(file: File) {
  const connection = await connect('https://relay.example.com:4433/transfer');
  const stream = await connection.createUnidirectionalStream();

  const data = new Uint8Array(await file.arrayBuffer());
  await writeStream(stream, data);

  console.log('File sent!');
}
```

## Event Handlers

```typescript
connection.onstatechange = (state) => {
  console.log('State:', state); // 'connecting' | 'connected' | 'closed' | 'failed'
};

connection.onerror = (error) => {
  console.error('Error:', error);
};

connection.onclose = (closeInfo) => {
  console.log('Closed:', closeInfo.reason);
};

connection.ondatagram = (data) => {
  console.log('Datagram:', data);
};

connection.onincomingstream = (stream) => {
  console.log('Incoming stream:', stream);
};
```

## Performance Options

```typescript
const connection = new WebTransportConnection({
  url: 'https://relay.example.com:4433/transfer',
  congestionControl: 'throughput', // 'default' | 'throughput' | 'low-latency'
  allowPooling: true, // Reuse connections
  requireUnreliable: false, // Require datagram support
});
```

## Stream Priorities

```typescript
// High priority
const metadataStream = await connection.createUnidirectionalStream({
  sendOrder: 100,
});

// Low priority
const dataStream = await connection.createUnidirectionalStream({
  sendOrder: 1,
});
```

## Transport Capabilities

| Feature | WebTransport | WebRTC | WebSocket |
|---------|--------------|--------|-----------|
| Latency | 5-20ms ⭐⭐⭐ | 10-50ms ⭐⭐ | 20-100ms ⭐ |
| Throughput | >10 MB/s ⭐⭐⭐ | 5-15 MB/s ⭐⭐ | 1-5 MB/s ⭐ |
| Browser Support | Chrome 97+ ⭐ | All ⭐⭐⭐ | All ⭐⭐⭐ |
| NAT Traversal | Good ⭐⭐ | Excellent ⭐⭐⭐ | Excellent ⭐⭐⭐ |
| Multiplexing | Yes ⭐⭐⭐ | Limited ⭐⭐ | No ⭐ |
| Datagrams | Yes ⭐⭐⭐ | Yes ⭐⭐ | No ⭐ |

## Use Case Selection

```typescript
import {
  selectForFileTransfer,
  selectForRealtime,
  selectForChat,
  selectForSignaling,
  selectForPrivacy,
} from '@/lib/transport/transport-selector';

// Large file transfers
const fileTransport = await selectForFileTransfer(serverUrl);

// Video/audio streaming
const realtimeTransport = await selectForRealtime(serverUrl);

// Chat messages
const chatTransport = await selectForChat(serverUrl);

// Signaling
const signalingTransport = await selectForSignaling(serverUrl);

// Maximum privacy
const privateTransport = await selectForPrivacy(serverUrl);
```

## Helper Functions

```typescript
import { readStream, writeStream, pipeStreams } from '@/lib/transport/webtransport';

// Read entire stream
const data = await readStream(stream.readable);

// Write data in chunks
await writeStream(stream.writable, data, 16384);

// Pipe streams
await pipeStreams(inputStream, outputStream);
```

## Error Handling

```typescript
try {
  await connection.connect();
} catch (error) {
  if (error.message.includes('not supported')) {
    // Browser doesn't support WebTransport
    fallbackToWebRTC();
  } else if (error.message.includes('certificate')) {
    // Certificate issue
    console.error('Server certificate error');
  } else {
    // Network error
    console.error('Connection failed:', error);
  }
}
```

## Statistics

```typescript
const stats = connection.getStats();
console.log({
  state: stats.state,
  bytesSent: stats.bytesSent,
  bytesReceived: stats.bytesReceived,
  datagramsSent: stats.datagramsSent,
  datagramsReceived: stats.datagramsReceived,
  streamsSent: stats.streamsSent,
  streamsReceived: stats.streamsReceived,
  rtt: stats.rtt,
  estimatedBandwidth: stats.estimatedBandwidth,
});
```

## Datagram Size Limits

```typescript
const maxSize = connection.getMaxDatagramSize();
console.log('Max datagram size:', maxSize); // Usually 1200-1400 bytes

// Split large data
function sendLargeData(data: Uint8Array) {
  const chunkSize = maxSize - 100; // Leave room for headers
  for (let offset = 0; offset < data.byteLength; offset += chunkSize) {
    const chunk = data.slice(offset, offset + chunkSize);
    connection.sendDatagram(chunk);
  }
}
```

## Common Patterns

### Progress Tracking

```typescript
async function sendFileWithProgress(file: File, onProgress: (percent: number) => void) {
  const connection = await connect('https://relay.example.com:4433/transfer');
  const stream = await connection.createUnidirectionalStream();
  const writer = stream.getWriter();

  const data = new Uint8Array(await file.arrayBuffer());
  const chunkSize = 16384;
  let sent = 0;

  for (let offset = 0; offset < data.byteLength; offset += chunkSize) {
    const chunk = data.slice(offset, offset + chunkSize);
    await writer.write(chunk);
    sent += chunk.byteLength;
    onProgress((sent / data.byteLength) * 100);
  }

  await writer.close();
}
```

### Retry Logic

```typescript
async function connectWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await connect(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Graceful Fallback

```typescript
async function createTransport(serverUrl: string) {
  const selection = await selectBestTransport({ serverUrl });

  try {
    if (selection.selected === 'webtransport') {
      return await connect(serverUrl);
    } else if (selection.selected === 'webrtc') {
      return await createWebRTCConnection();
    } else {
      return new WebSocket(serverUrl);
    }
  } catch (error) {
    // Try fallback
    for (const fallback of selection.fallbacks) {
      try {
        if (fallback === 'webrtc') {
          return await createWebRTCConnection();
        } else if (fallback === 'websocket') {
          return new WebSocket(serverUrl);
        }
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError);
      }
    }
    throw error;
  }
}
```

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 97+ | ✅ Full |
| Edge | 97+ | ✅ Full |
| Opera | 83+ | ✅ Full |
| Firefox | - | ❌ Not yet |
| Safari | - | ❌ Not yet |

**Always check support:**

```typescript
if (!isWebTransportSupported()) {
  // Use WebRTC or WebSocket fallback
}
```

## Server Requirements

- **HTTPS/HTTP3** server with WebTransport support
- **Port 443** or custom port (UDP)
- **TLS 1.3** certificate
- **QUIC** protocol enabled

Example server libraries:
- Node.js: `@webtransport/server`
- Go: `quic-go/webtransport-go`
- Rust: `quinn`
- Python: `aioquic`

## Key Differences from WebRTC

1. **Server-based**: Requires a server (like WebSocket)
2. **HTTP/3**: Uses HTTP/3 protocol stack
3. **No ICE**: No STUN/TURN needed (uses HTTPS)
4. **Better latency**: Lower overhead than WebRTC
5. **Simpler**: No SDP/offer/answer dance
6. **Limited support**: Only Chrome/Edge currently

## When to Use

✅ **Use WebTransport when:**
- Low latency is critical (< 20ms)
- High throughput needed (> 10 MB/s)
- Have a relay server
- Users have Chrome 97+
- Need unreliable datagrams

❌ **Don't use when:**
- Need universal browser support → Use WebSocket
- Need P2P direct connections → Use WebRTC
- Server not available → Use WebRTC
- Users on Firefox/Safari → Use WebRTC

## Resources

- [WebTransport Specification](https://w3c.github.io/webtransport/)
- [Chrome WebTransport Guide](https://web.dev/webtransport/)
- [QUIC Protocol](https://www.chromium.org/quic/)
- [Full Documentation](./WEBTRANSPORT_GUIDE.md)
