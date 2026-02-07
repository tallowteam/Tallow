# WebTransport Implementation Guide

## Overview

WebTransport is a modern protocol for client-server communication built on HTTP/3 and QUIC, offering significant performance advantages over WebRTC DataChannels and WebSockets for P2P file transfers.

## Quick Start

### Basic Connection

```typescript
import { connect, isWebTransportSupported } from '@/lib/transport/webtransport';

// Check browser support
if (!isWebTransportSupported()) {
  console.log('WebTransport not supported, falling back to WebRTC');
  return;
}

// Connect to WebTransport server
const connection = await connect('https://relay.example.com:4433/transfer');

console.log('Connected!', connection.getStats());
```

### Using Transport Selector (Recommended)

```typescript
import { selectBestTransport } from '@/lib/transport/transport-selector';

// Automatically select optimal transport
const result = await selectBestTransport({
  requireHighThroughput: true,
  requireLowLatency: true,
  serverUrl: 'https://relay.example.com:4433/transfer',
});

console.log('Selected:', result.selected); // 'webtransport', 'webrtc', or 'websocket'
console.log('Estimated latency:', result.estimatedLatency, 'ms');
console.log('Estimated bandwidth:', result.estimatedBandwidth, 'Mbps');

if (result.selected === 'webtransport') {
  const connection = await connect(result.capabilities.protocol);
  // Use connection...
}
```

## Features Comparison

| Feature | WebTransport | WebRTC | WebSocket |
|---------|--------------|--------|-----------|
| Latency | 5-20ms | 10-50ms | 20-100ms |
| Throughput | >10 MB/s | 5-15 MB/s | 1-5 MB/s |
| Protocol | HTTP/3 QUIC | UDP (SRTP) | TCP (TLS) |
| NAT Traversal | Via HTTPS (good) | STUN/TURN (excellent) | Via HTTP (excellent) |
| Browser Support | Chrome 97+ | All modern | All modern |
| Unreliable Datagrams | ✓ Native | ✓ Configurable | ✗ TCP only |
| Multiplexing | ✓ No HOL blocking | ✓ Multiple channels | ✗ Single stream |
| 0-RTT | ✓ QUIC 0-RTT | ✗ Full handshake | ✗ Full handshake |

## API Reference

### WebTransportConnection

```typescript
class WebTransportConnection {
  // Connection
  connect(url?: string): Promise<void>
  close(closeInfo?: { closeCode?: number; reason?: string }): void

  // State
  getState(): WebTransportState
  isConnected(): boolean
  getStats(): WebTransportStats

  // Streams
  createBidirectionalStream(options?: WebTransportStreamOptions): Promise<{
    readable: ReadableStream<Uint8Array>
    writable: WritableStream<Uint8Array>
  }>
  createUnidirectionalStream(options?: WebTransportStreamOptions): Promise<WritableStream<Uint8Array>>

  // Datagrams (unreliable, low-latency)
  sendDatagram(data: Uint8Array): Promise<void>
  receiveDatagram(): Promise<Uint8Array>
  getMaxDatagramSize(): number

  // Event handlers
  onclose?: (closeInfo: CloseInfo) => void
  onerror?: (error: Error) => void
  onstatechange?: (state: WebTransportState) => void
  ondatagram?: (data: Uint8Array) => void
  onincomingstream?: (stream: WebTransportBidirectionalStream) => void
}
```

### Transport Selector

```typescript
// Automatic selection
selectBestTransport(options: TransportOptions): Promise<TransportSelectionResult>

// Use-case specific
selectForFileTransfer(serverUrl?: string): Promise<TransportSelectionResult>
selectForRealtime(serverUrl?: string): Promise<TransportSelectionResult>
selectForChat(serverUrl?: string): Promise<TransportSelectionResult>
selectForSignaling(serverUrl?: string): Promise<TransportSelectionResult>
selectForPrivacy(serverUrl?: string): Promise<TransportSelectionResult>

// Support detection
detectBrowserSupport(): BrowserSupport
isTransportSupported(protocol: TransportProtocol): boolean
getTransportCapabilities(protocol: TransportProtocol): TransportCapabilities
```

## Usage Examples

### File Transfer with Streams

```typescript
import { connect, writeStream, readStream } from '@/lib/transport/webtransport';

async function sendFile(connection: WebTransportConnection, file: File) {
  // Create bidirectional stream
  const { writable, readable } = await connection.createBidirectionalStream({
    sendOrder: 10, // Priority
  });

  // Send file data
  const fileData = new Uint8Array(await file.arrayBuffer());
  await writeStream(writable, fileData, 16384); // 16KB chunks

  // Wait for acknowledgment
  const ack = await readStream(readable);
  console.log('File sent, ACK received:', ack);
}

async function receiveFile(connection: WebTransportConnection) {
  connection.onincomingstream = async (stream) => {
    // Receive file data
    const fileData = await readStream(stream.readable);

    // Send acknowledgment
    const writer = stream.writable.getWriter();
    await writer.write(new Uint8Array([0x01])); // ACK
    await writer.close();

    console.log('File received:', fileData.byteLength, 'bytes');
  };
}
```

### Real-time Data with Datagrams

```typescript
import { connect } from '@/lib/transport/webtransport';

async function sendVideoFrames(connection: WebTransportConnection) {
  // Datagrams for low-latency, unreliable delivery (like UDP)
  const maxSize = connection.getMaxDatagramSize();
  console.log('Max datagram size:', maxSize, 'bytes');

  // Set up datagram receiver
  connection.ondatagram = (frameData) => {
    console.log('Received video frame:', frameData.byteLength, 'bytes');
    // Decode and display frame
  };

  // Send video frames
  const videoFrame = new Uint8Array(1200); // Must fit in datagram
  await connection.sendDatagram(videoFrame);
}
```

### Parallel File Upload

```typescript
import { connect } from '@/lib/transport/webtransport';

async function uploadFilesParallel(
  connection: WebTransportConnection,
  files: File[]
) {
  const uploads = files.map(async (file, index) => {
    // Create stream with priority (higher = more important)
    const stream = await connection.createUnidirectionalStream({
      sendOrder: files.length - index, // Upload in reverse order
    });

    const writer = stream.getWriter();

    // Send file metadata
    const metadata = new TextEncoder().encode(JSON.stringify({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    await writer.write(metadata);

    // Send file data in chunks
    const chunkSize = 16384;
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    for (let offset = 0; offset < data.byteLength; offset += chunkSize) {
      const chunk = data.slice(offset, offset + chunkSize);
      await writer.write(chunk);
    }

    await writer.close();
    console.log('Uploaded:', file.name);
  });

  await Promise.all(uploads);
  console.log('All files uploaded!');
}
```

### Connection State Management

```typescript
import { WebTransportConnection } from '@/lib/transport/webtransport';

const connection = new WebTransportConnection({
  url: 'https://relay.example.com:4433/transfer',
  congestionControl: 'throughput', // or 'low-latency'
  allowPooling: true,
});

// State change handler
connection.onstatechange = (state) => {
  console.log('State:', state);
  switch (state) {
    case 'connecting':
      showStatus('Connecting...');
      break;
    case 'connected':
      showStatus('Connected!');
      enableTransferUI();
      break;
    case 'closed':
      showStatus('Connection closed');
      disableTransferUI();
      break;
    case 'failed':
      showStatus('Connection failed');
      tryFallback();
      break;
  }
};

// Error handler
connection.onerror = (error) => {
  console.error('Connection error:', error);
  notifyUser(`Connection error: ${error.message}`);
};

// Close handler
connection.onclose = (closeInfo) => {
  console.log('Closed:', closeInfo.reason, 'Code:', closeInfo.closeCode);
};

await connection.connect();
```

### Stream Piping

```typescript
import { connect, pipeStreams } from '@/lib/transport/webtransport';

async function mirrorStream(
  connection: WebTransportConnection,
  inputStream: ReadableStream<Uint8Array>
) {
  // Create output stream
  const outputStream = await connection.createUnidirectionalStream();

  // Pipe input directly to output (efficient, no buffering)
  await pipeStreams(inputStream, outputStream);

  console.log('Stream mirrored successfully');
}

// Example: Mirror webcam to remote peer
async function streamWebcam(connection: WebTransportConnection) {
  const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
  const videoTrack = mediaStream.getVideoTracks()[0];

  if (!videoTrack) return;

  // Create MediaStreamTrackProcessor (experimental)
  const processor = new (window as any).MediaStreamTrackProcessor({ track: videoTrack });
  const reader = processor.readable.getReader();

  // Create WebTransport stream
  const stream = await connection.createUnidirectionalStream();
  const writer = stream.getWriter();

  // Pipe frames
  try {
    while (true) {
      const { value: frame, done } = await reader.read();
      if (done) break;

      // Encode frame and send
      const encodedFrame = await encodeVideoFrame(frame);
      await writer.write(encodedFrame);

      frame.close();
    }
  } finally {
    await writer.close();
  }
}
```

## Transport Selection Examples

### Automatic Selection for File Transfer

```typescript
import { selectForFileTransfer } from '@/lib/transport/transport-selector';
import { connect as connectWT } from '@/lib/transport/webtransport';
import { createDataChannel } from '@/lib/webrtc/data-channel';

async function startTransfer(file: File, serverUrl?: string) {
  // Let selector choose best transport
  const selection = await selectForFileTransfer(serverUrl);

  console.log('Selected:', selection.selected);
  console.log('Reason:', selection.reason);
  console.log('Fallbacks:', selection.fallbacks);

  if (selection.warnings.length > 0) {
    console.warn('Warnings:', selection.warnings);
  }

  // Use selected transport
  switch (selection.selected) {
    case 'webtransport':
      const wtConn = await connectWT(serverUrl!);
      await sendFileViaWebTransport(wtConn, file);
      break;

    case 'webrtc':
      const rtcConn = await createWebRTCConnection();
      await sendFileViaWebRTC(rtcConn, file);
      break;

    case 'websocket':
      const wsConn = new WebSocket(serverUrl!);
      await sendFileViaWebSocket(wsConn, file);
      break;
  }
}
```

### Real-time Communication Selection

```typescript
import { selectForRealtime } from '@/lib/transport/transport-selector';

async function startVideoCall(serverUrl: string) {
  const selection = await selectForRealtime(serverUrl);

  console.log('Estimated latency:', selection.estimatedLatency, 'ms');
  console.log('Estimated bandwidth:', selection.estimatedBandwidth, 'Mbps');

  if (selection.estimatedLatency > 50) {
    console.warn('High latency detected, video quality may be affected');
  }

  if (selection.selected === 'webtransport') {
    // Use datagrams for video
    const conn = await connectWT(serverUrl);
    await streamVideoWithDatagrams(conn);
  } else if (selection.selected === 'webrtc') {
    // Use unreliable DataChannel
    const pc = await createWebRTCConnection();
    await streamVideoWithDataChannel(pc);
  } else {
    console.warn('WebSocket selected - not optimal for real-time video');
  }
}
```

### Privacy-First Selection

```typescript
import { selectForPrivacy } from '@/lib/transport/transport-selector';

async function startPrivateTransfer(serverUrl: string) {
  const selection = await selectForPrivacy(serverUrl);

  console.log('Privacy score:', selection.capabilities.privacyScore, '/10');

  // Will prefer relay-only connections
  // Will avoid direct P2P that leaks IP
  if (selection.selected === 'webrtc') {
    // Ensure TURN relay is used
    const conn = await createWebRTCConnection({
      forceRelay: true,
      iceTransportPolicy: 'relay',
    });
  }
}
```

### Fallback Chain

```typescript
import { selectBestTransport } from '@/lib/transport/transport-selector';

async function connectWithFallback(serverUrl: string) {
  const selection = await selectBestTransport({
    serverUrl,
    allowFallback: true,
    requireHighThroughput: true,
  });

  console.log('Primary:', selection.selected);
  console.log('Fallbacks:', selection.fallbacks);

  // Try primary
  try {
    return await connectWithProtocol(selection.selected, serverUrl);
  } catch (primaryError) {
    console.error('Primary failed:', primaryError);

    // Try fallbacks
    for (const fallback of selection.fallbacks) {
      try {
        console.log('Trying fallback:', fallback);
        return await connectWithProtocol(fallback, serverUrl);
      } catch (fallbackError) {
        console.error('Fallback failed:', fallback, fallbackError);
      }
    }

    throw new Error('All transport protocols failed');
  }
}
```

## Server Setup (Node.js)

WebTransport requires an HTTP/3 server. Here's a basic setup using Node.js:

```typescript
// server.ts
import { createServer } from '@webtransport/server';
import { readFileSync } from 'fs';

const server = createServer({
  port: 4433,
  host: '0.0.0.0',
  secret: 'your-secret-key',
  cert: readFileSync('cert.pem'),
  key: readFileSync('key.pem'),
});

server.on('session', (session) => {
  console.log('Client connected');

  // Handle incoming streams
  session.incomingBidirectionalStreams.getReader().read().then(({ value: stream }) => {
    if (stream) {
      handleFileUpload(stream);
    }
  });

  // Handle datagrams
  session.datagrams.readable.getReader().read().then(({ value: data }) => {
    if (data) {
      console.log('Received datagram:', data.byteLength, 'bytes');
      // Echo back
      session.datagrams.writable.getWriter().write(data);
    }
  });
});

server.listen();
console.log('WebTransport server listening on port 4433');
```

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 97+ | ✓ Full support |
| Edge | 97+ | ✓ Full support |
| Firefox | - | ✗ Not yet |
| Safari | - | ✗ Not yet |
| Opera | 83+ | ✓ Full support |

**Recommendation:** Always use `isWebTransportSupported()` and implement fallback to WebRTC or WebSocket.

## Performance Optimization

### Congestion Control

```typescript
const connection = new WebTransportConnection({
  url: 'https://relay.example.com:4433/transfer',
  congestionControl: 'throughput', // Optimize for throughput
  // congestionControl: 'low-latency', // Optimize for latency
});
```

### Stream Priorities

```typescript
// High priority for metadata
const metadataStream = await connection.createUnidirectionalStream({
  sendOrder: 100,
});

// Lower priority for bulk data
const dataStream = await connection.createUnidirectionalStream({
  sendOrder: 1,
});
```

### Datagram vs Stream Selection

Use datagrams when:
- Latency is critical (< 20ms)
- Data can be lost (video frames, audio)
- Small messages (< 1200 bytes)

Use streams when:
- Reliability is required
- Large data transfers
- In-order delivery needed

## Troubleshooting

### Connection Failed

```typescript
try {
  await connection.connect();
} catch (error) {
  if (error.message.includes('not supported')) {
    // Browser doesn't support WebTransport
    fallbackToWebRTC();
  } else if (error.message.includes('certificate')) {
    // Self-signed certificate issue
    // Add serverCertificateHashes to config
  } else {
    // Network error
    console.error('Connection failed:', error);
  }
}
```

### Self-Signed Certificates

```typescript
const connection = new WebTransportConnection({
  url: 'https://localhost:4433/transfer',
  serverCertificateHashes: [
    'sha256:ABC123...', // Certificate hash
  ],
});
```

### Datagram Size Limits

```typescript
const maxSize = connection.getMaxDatagramSize();
console.log('Max datagram size:', maxSize); // Usually 1200-1400 bytes

// Split large data into multiple datagrams
function sendLargeData(data: Uint8Array) {
  const chunkSize = maxSize - 100; // Leave room for headers

  for (let offset = 0; offset < data.byteLength; offset += chunkSize) {
    const chunk = data.slice(offset, offset + chunkSize);
    connection.sendDatagram(chunk);
  }
}
```

## Best Practices

1. **Always check browser support** before using WebTransport
2. **Implement fallback** to WebRTC or WebSocket
3. **Use transport selector** for automatic optimal selection
4. **Handle connection state** changes properly
5. **Monitor statistics** for performance optimization
6. **Use datagrams** for real-time data
7. **Use streams** for reliable file transfers
8. **Set stream priorities** for better QoS
9. **Close connections** gracefully
10. **Handle errors** and implement retry logic

## Integration with Tallow

WebTransport is integrated into Tallow's transport layer and can be used alongside WebRTC and WebSocket:

```typescript
import { selectBestTransport } from '@/lib/transport';

// Tallow automatically selects the best transport
const transport = await selectBestTransport({
  requireHighThroughput: true,
  serverUrl: process.env.NEXT_PUBLIC_RELAY_URL,
});

console.log('Using:', transport.selected);
// Output: 'webtransport' (if supported and optimal)
```

## Resources

- [WebTransport Specification](https://w3c.github.io/webtransport/)
- [HTTP/3 (QUIC) Protocol](https://quicwg.org/)
- [Chrome WebTransport Guide](https://web.dev/webtransport/)
- [MDN WebTransport API](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport)
