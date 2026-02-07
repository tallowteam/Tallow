# WebTransport Quick Start

Get started with WebTransport in Tallow in 5 minutes.

## Step 1: Check Browser Support (30 seconds)

```typescript
import { isWebTransportSupported } from '@/lib/transport/webtransport';

if (isWebTransportSupported()) {
  console.log('✓ WebTransport supported!');
} else {
  console.log('✗ WebTransport not supported, will use fallback');
}
```

## Step 2: Automatic Transport Selection (Recommended)

```typescript
import { selectBestTransport } from '@/lib/transport/transport-selector';

const transport = await selectBestTransport({
  serverUrl: 'https://relay.example.com:4433/transfer',
  requireHighThroughput: true,
});

console.log('Selected:', transport.selected); // 'webtransport', 'webrtc', or 'websocket'
console.log('Estimated latency:', transport.estimatedLatency, 'ms');
console.log('Estimated bandwidth:', transport.estimatedBandwidth, 'Mbps');
```

## Step 3: Connect and Transfer

### Option A: Simple File Transfer

```typescript
import { connect, writeStream } from '@/lib/transport/webtransport';

// Connect
const connection = await connect('https://relay.example.com:4433/transfer');

// Create stream
const stream = await connection.createUnidirectionalStream();

// Send file
const fileData = new Uint8Array(await file.arrayBuffer());
await writeStream(stream, fileData);

console.log('✓ File sent!');
```

### Option B: Bidirectional Transfer with Progress

```typescript
import { connect } from '@/lib/transport/webtransport';

const connection = await connect('https://relay.example.com:4433/transfer');

// Create bidirectional stream
const { readable, writable } = await connection.createBidirectionalStream();

// Send file with progress
const writer = writable.getWriter();
const fileData = new Uint8Array(await file.arrayBuffer());
const chunkSize = 16384; // 16KB

for (let offset = 0; offset < fileData.byteLength; offset += chunkSize) {
  const chunk = fileData.slice(offset, offset + chunkSize);
  await writer.write(chunk);

  const progress = (offset / fileData.byteLength) * 100;
  console.log(`Progress: ${progress.toFixed(1)}%`);
}

await writer.close();

// Wait for acknowledgment
const reader = readable.getReader();
const { value } = await reader.read();
console.log('✓ ACK received:', value);
```

### Option C: Real-time Data with Datagrams

```typescript
import { connect } from '@/lib/transport/webtransport';

const connection = await connect('https://relay.example.com:4433/transfer');

// Send datagrams (unreliable, fast)
const videoFrame = new Uint8Array(1200); // Must fit in datagram
await connection.sendDatagram(videoFrame);

// Receive datagrams
connection.ondatagram = (data) => {
  console.log('Received frame:', data.byteLength, 'bytes');
  // Decode and display
};
```

## Step 4: Handle Events

```typescript
connection.onstatechange = (state) => {
  console.log('State:', state);
};

connection.onerror = (error) => {
  console.error('Error:', error);
  // Fall back to WebRTC or WebSocket
};

connection.onclose = (closeInfo) => {
  console.log('Closed:', closeInfo.reason);
};
```

## Complete Example (Copy-Paste Ready)

```typescript
import { selectBestTransport } from '@/lib/transport/transport-selector';
import { connect, writeStream } from '@/lib/transport/webtransport';

async function sendFile(file: File, serverUrl: string) {
  try {
    // 1. Auto-select best transport
    const selection = await selectBestTransport({
      serverUrl,
      requireHighThroughput: true,
    });

    console.log('Using:', selection.selected);

    if (selection.selected !== 'webtransport') {
      console.log('WebTransport not optimal, using:', selection.selected);
      // Handle WebRTC or WebSocket fallback here
      return;
    }

    // 2. Connect
    const connection = await connect(serverUrl);
    console.log('✓ Connected');

    // 3. Send file
    const stream = await connection.createUnidirectionalStream();
    const fileData = new Uint8Array(await file.arrayBuffer());
    await writeStream(stream, fileData, 16384); // 16KB chunks
    console.log('✓ File sent');

    // 4. Get stats
    const stats = connection.getStats();
    console.log('Stats:', {
      bytesSent: stats.bytesSent,
      rtt: stats.rtt + 'ms',
      bandwidth: stats.estimatedBandwidth + ' bytes/s',
    });

    // 5. Close
    connection.close({ reason: 'Transfer complete' });

  } catch (error) {
    console.error('Transfer failed:', error);
    // Implement retry or fallback logic
  }
}

// Usage
const fileInput = document.getElementById('file-input') as HTMLInputElement;
fileInput.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    await sendFile(file, 'https://relay.example.com:4433/transfer');
  }
});
```

## React Hook Example

```typescript
import { useState, useCallback } from 'react';
import { selectBestTransport } from '@/lib/transport/transport-selector';
import { connect, writeStream } from '@/lib/transport/webtransport';

export function useFileTransfer(serverUrl: string) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'transferring' | 'complete' | 'error'>('idle');

  const transferFile = useCallback(async (file: File) => {
    setStatus('transferring');
    setProgress(0);

    try {
      // Select transport
      const selection = await selectBestTransport({
        serverUrl,
        requireHighThroughput: true,
      });

      if (selection.selected === 'webtransport') {
        // Connect
        const connection = await connect(serverUrl);

        // Send with progress
        const stream = await connection.createUnidirectionalStream();
        const writer = stream.getWriter();
        const data = new Uint8Array(await file.arrayBuffer());
        const chunkSize = 16384;

        for (let offset = 0; offset < data.byteLength; offset += chunkSize) {
          const chunk = data.slice(offset, offset + chunkSize);
          await writer.write(chunk);
          setProgress((offset / data.byteLength) * 100);
        }

        await writer.close();
        connection.close();
      }

      setStatus('complete');
      setProgress(100);
    } catch (error) {
      console.error('Transfer failed:', error);
      setStatus('error');
    }
  }, [serverUrl]);

  return { transferFile, progress, status };
}

// Usage in component
function FileUpload() {
  const { transferFile, progress, status } = useFileTransfer('https://relay.example.com:4433/transfer');

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) transferFile(file);
        }}
      />
      {status === 'transferring' && <div>Progress: {progress.toFixed(1)}%</div>}
      {status === 'complete' && <div>✓ Transfer complete!</div>}
      {status === 'error' && <div>✗ Transfer failed</div>}
    </div>
  );
}
```

## Common Patterns

### With Fallback

```typescript
async function createConnection(serverUrl: string) {
  const selection = await selectBestTransport({ serverUrl });

  switch (selection.selected) {
    case 'webtransport':
      return await connect(serverUrl);
    case 'webrtc':
      return await createWebRTCConnection();
    case 'websocket':
      return new WebSocket(serverUrl.replace('https://', 'wss://'));
  }
}
```

### With Retry

```typescript
async function connectWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await connect(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

### With Statistics

```typescript
const connection = await connect(serverUrl);

setInterval(() => {
  const stats = connection.getStats();
  console.log({
    state: stats.state,
    rtt: stats.rtt + 'ms',
    bandwidth: (stats.estimatedBandwidth / 1024 / 1024).toFixed(2) + ' MB/s',
  });
}, 1000);
```

## Troubleshooting

### "WebTransport not supported"
**Solution:** Use transport selector for automatic fallback
```typescript
const selection = await selectBestTransport({ serverUrl });
// Will select webrtc or websocket if webtransport not available
```

### "Connection failed"
**Solution:** Check server is running and accessible
```typescript
try {
  await connection.connect();
} catch (error) {
  console.error('Server not reachable:', error);
  // Try fallback transport
}
```

### "Certificate error"
**Solution:** Add server certificate hash for self-signed certs
```typescript
const connection = new WebTransportConnection({
  url: serverUrl,
  serverCertificateHashes: ['sha256:ABC123...'],
});
```

## Next Steps

1. **Read the full guide:** [WEBTRANSPORT_GUIDE.md](./WEBTRANSPORT_GUIDE.md)
2. **See integration example:** [WEBTRANSPORT_INTEGRATION_EXAMPLE.tsx](./WEBTRANSPORT_INTEGRATION_EXAMPLE.tsx)
3. **Check API reference:** [WEBTRANSPORT_QUICK_REFERENCE.md](./WEBTRANSPORT_QUICK_REFERENCE.md)
4. **Set up server:** See "Server Setup" in the guide

## Key Takeaways

- ✅ Use `selectBestTransport()` for automatic optimization
- ✅ Always implement fallback to WebRTC/WebSocket
- ✅ Use streams for reliable transfers
- ✅ Use datagrams for real-time data
- ✅ Monitor connection state and statistics
- ✅ Handle errors and implement retry logic

Happy transferring! 🚀
