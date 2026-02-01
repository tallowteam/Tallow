# Custom Hooks Quick Reference

## Overview

This guide provides a quick reference for all custom hooks in the Tallow application.

## Table of Contents

1. [useDeviceConnection](#usedeviceconnection) - Device discovery and connection
2. [useP2PSession](#usep2psession) - Session management and connection codes
3. [useTransferState](#usetransferstate) - Transfer progress tracking
4. [useFileTransfer](#usefiletransfer) - File selection and management
5. [useP2PConnection](#usep2pconnection) - WebRTC P2P connectivity
6. [usePQCTransfer](#usepqctransfer) - Post-quantum cryptography transfers

---

## useDeviceConnection

**Purpose**: Manage device connections and local network discovery

**Location**: `lib/hooks/use-device-connection.ts`

### Basic Usage

```tsx
import { useDeviceConnection } from '@/lib/hooks/use-device-connection';

const connection = useDeviceConnection({
  enableDiscovery: true,
  discoveryInterval: 5000,
  onConnectionSuccess: (id, name) => console.log(`Connected to ${name}`)
});
```

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `connectionType` | `'local' \| 'internet' \| 'friends' \| null` | Current connection type |
| `isConnecting` | `boolean` | Whether connection is in progress |
| `connectedDeviceId` | `string \| null` | ID of connected device |
| `connectedDeviceName` | `string \| null` | Name of connected device |
| `discoveredDevices` | `DiscoveredDevice[]` | List of local network devices |
| `connectionError` | `string \| null` | Connection error message |
| `isConnected` | `boolean` | Whether currently connected |

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setConnectionType` | `type: ConnectionType` | Set connection mode |
| `connectToDevice` | `deviceId: string, deviceName: string` | Connect to a device |
| `markConnected` | `deviceId: string, deviceName: string` | Mark connection as established |
| `markConnectionFailed` | `error: string` | Mark connection as failed |
| `disconnect` | - | Disconnect from current device |
| `clearError` | - | Clear connection error |
| `startDiscovery` | - | Start local device discovery |
| `stopDiscovery` | - | Stop local device discovery |
| `getCurrentDeviceId` | - | Get current device ID |

### Example: Local Discovery

```tsx
const connection = useDeviceConnection({
  enableDiscovery: true,
  onDeviceDiscovered: (device) => {
    toast.info(`Found: ${device.name}`);
  }
});

return (
  <ul>
    {connection.discoveredDevices.map(device => (
      <li key={device.id} onClick={() => connection.connectToDevice(device.id, device.name)}>
        {device.name}
      </li>
    ))}
  </ul>
);
```

---

## useP2PSession

**Purpose**: Manage P2P session lifecycle and connection codes

**Location**: `lib/hooks/use-p2p-session.ts`

### Basic Usage

```tsx
import { useP2PSession } from '@/lib/hooks/use-p2p-session';

const session = useP2PSession({
  defaultCodeFormat: 'words',
  autoGenerate: true,
  sessionTimeout: 300000 // 5 minutes
});
```

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `sessionId` | `string` | Unique session identifier |
| `connectionCode` | `string` | Connection code for pairing |
| `codeFormat` | `'short' \| 'words'` | Format of connection code |
| `isActive` | `boolean` | Whether session is active |
| `peerCode` | `string \| null` | Peer's connection code |
| `startTime` | `Date \| null` | Session start time |
| `endTime` | `Date \| null` | Session end time |
| `metadata` | `Record<string, any>` | Session metadata |

### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `generateCode` | `format?: CodeFormat` | `string` | Generate new connection code |
| `setCodeFormat` | `format: CodeFormat` | - | Set code format and regenerate |
| `regenerateCode` | - | `string` | Regenerate with current format |
| `formatConnectionCode` | `code: string` | `string` | Format code for display |
| `detectFormat` | `code: string` | `CodeFormat` | Detect code type |
| `setPeerCode` | `code: string` | - | Set peer's connection code |
| `startSession` | `metadata?: object` | - | Start new session |
| `endSession` | - | - | End current session |
| `resetSession` | - | - | Reset and generate new code |
| `updateMetadata` | `metadata: object` | - | Update session metadata |
| `getSessionDuration` | - | `number \| null` | Get session duration in ms |
| `isSessionExpired` | - | `boolean` | Check if session expired |

### Example: Connection Code Display

```tsx
const session = useP2PSession({
  defaultCodeFormat: 'short',
  autoGenerate: true
});

return (
  <div>
    <h2>Your Code: {session.connectionCode}</h2>
    <button onClick={() => session.setCodeFormat('words')}>
      Switch to Words
    </button>
    <button onClick={() => session.regenerateCode()}>
      New Code
    </button>
  </div>
);
```

---

## useTransferState

**Purpose**: Track file transfer state and progress

**Location**: `lib/hooks/use-transfer-state.ts`

### Basic Usage

```tsx
import { useTransferState } from '@/lib/hooks/use-transfer-state';

const transfer = useTransferState({
  saveToHistory: true,
  onTransferComplete: (files) => console.log('Done!', files),
  onProgressUpdate: (progress) => console.log(`${progress}%`)
});
```

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `mode` | `'send' \| 'receive'` | Transfer direction |
| `status` | `TransferStatus` | Current transfer status |
| `files` | `FileInfo[]` | Files being transferred |
| `currentFile` | `FileTransferProgress \| null` | Current file progress |
| `overallProgress` | `number` | Overall progress (0-100) |
| `totalBytes` | `number` | Total bytes to transfer |
| `transferredBytes` | `number` | Bytes transferred so far |
| `overallSpeed` | `number` | Overall transfer speed (B/s) |
| `estimatedTimeRemaining` | `number \| null` | ETA in seconds |
| `startTime` | `Date \| null` | Transfer start time |
| `endTime` | `Date \| null` | Transfer end time |
| `error` | `string \| null` | Error message |
| `isTransferring` | `boolean` | Whether actively transferring |
| `isComplete` | `boolean` | Whether transfer completed |
| `isFailed` | `boolean` | Whether transfer failed |

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setMode` | `mode: TransferMode` | Set transfer mode |
| `setStatus` | `status: TransferStatus` | Set transfer status |
| `startTransfer` | `files: FileInfo[], mode?: TransferMode` | Start new transfer |
| `startFileTransfer` | `file: FileInfo` | Start individual file |
| `updateFileProgress` | `fileId: string, transferred: number, speed?: number` | Update file progress |
| `completeFileTransfer` | `fileId: string` | Mark file as complete |
| `failFileTransfer` | `fileId: string, error: string` | Mark file as failed |
| `completeTransfer` | - | Complete entire transfer |
| `failTransfer` | `error: string` | Fail transfer |
| `cancelTransfer` | - | Cancel transfer |
| `resetTransfer` | - | Reset to idle state |
| `getTransferDuration` | - | Get duration in ms |
| `formatSpeed` | `bytesPerSecond: number` | Format speed string |
| `formatTimeRemaining` | `seconds: number` | Format time string |

### Example: Transfer Progress

```tsx
const transfer = useTransferState();

const handleTransfer = async () => {
  transfer.startTransfer(selectedFiles, 'send');

  for (const file of selectedFiles) {
    transfer.startFileTransfer(file);

    // ... transfer logic ...
    transfer.updateFileProgress(file.id, bytesTransferred, speed);
    transfer.completeFileTransfer(file.id);
  }

  transfer.completeTransfer();
};

return (
  <div>
    <progress value={transfer.overallProgress} max={100} />
    <p>Speed: {transfer.formatSpeed(transfer.overallSpeed)}</p>
    <p>ETA: {transfer.formatTimeRemaining(transfer.estimatedTimeRemaining)}</p>
  </div>
);
```

---

## useFileTransfer

**Purpose**: Manage file selection and drag-and-drop

**Location**: `lib/hooks/use-file-transfer.ts`

### Basic Usage

```tsx
import { useFileTransfer } from '@/lib/hooks/use-file-transfer';

const files = useFileTransfer();
```

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `files` | `FileWithData[]` | Selected files |
| `isDragging` | `boolean` | Whether drag is active |
| `inputRef` | `RefObject<HTMLInputElement>` | File input ref |

### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `addFiles` | `fileList: FileList \| File[]` | `FileWithData[]` | Add files to queue |
| `removeFile` | `id: string` | - | Remove file by ID |
| `clearFiles` | - | - | Clear all files |
| `openFilePicker` | - | - | Open file picker dialog |
| `handleDragOver` | `e: DragEvent` | - | Handle drag over |
| `handleDragLeave` | `e: DragEvent` | - | Handle drag leave |
| `handleDrop` | `e: DragEvent` | - | Handle file drop |
| `handleFileInputChange` | `e: ChangeEvent` | - | Handle input change |
| `getTotalSize` | - | `number` | Get total file size |
| `getFileById` | `id: string` | `FileWithData \| undefined` | Get file by ID |
| `getAllFiles` | - | `File[]` | Get all File objects |

### Utility Functions

| Function | Parameters | Return | Description |
|----------|------------|--------|-------------|
| `downloadFile` | `blob: Blob, filename: string, path?: string` | `Promise<void>` | Download file |
| `downloadFiles` | `files: {blob, name}[]` | `Promise<void>` | Download multiple |
| `formatFileSize` | `bytes: number` | `string` | Format size |
| `formatSpeed` | `bytesPerSecond: number` | `string` | Format speed |
| `formatTime` | `seconds: number` | `string` | Format time |
| `getFileExtension` | `filename: string` | `string` | Get extension |
| `getMimeType` | `filename: string` | `string` | Get MIME type |

### Example: Drag-and-Drop

```tsx
const files = useFileTransfer();

return (
  <div
    onDragOver={files.handleDragOver}
    onDragLeave={files.handleDragLeave}
    onDrop={files.handleDrop}
    className={files.isDragging ? 'dragging' : ''}
  >
    <input
      ref={files.inputRef}
      type="file"
      multiple
      onChange={files.handleFileInputChange}
      hidden
    />

    <button onClick={files.openFilePicker}>
      Select Files
    </button>

    <ul>
      {files.files.map(file => (
        <li key={file.id}>
          {file.name} - {formatFileSize(file.size)}
          <button onClick={() => files.removeFile(file.id)}>×</button>
        </li>
      ))}
    </ul>

    <p>Total: {formatFileSize(files.getTotalSize())}</p>
  </div>
);
```

---

## useP2PConnection

**Purpose**: Manage WebRTC P2P connections with encryption

**Location**: `lib/hooks/use-p2p-connection.ts`

### Basic Usage

```tsx
import { useP2PConnection } from '@/lib/hooks/use-p2p-connection';

const p2p = useP2PConnection();
```

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `state` | `P2PConnectionState` | Connection state |
| `currentTransfer` | `TransferProgress \| null` | Current transfer progress |
| `receivedFiles` | `ReceivedFile[]` | Received files |

### P2PConnectionState

| Property | Type | Description |
|----------|------|-------------|
| `isConnected` | `boolean` | Whether connected |
| `isConnecting` | `boolean` | Whether connecting |
| `connectionCode` | `string` | Connection code |
| `peerId` | `string \| null` | Peer ID |
| `peerName` | `string \| null` | Peer name |
| `error` | `string \| null` | Error message |
| `verificationPending` | `boolean` | Verification pending |
| `verificationSession` | `VerificationSession \| null` | Verification session |

### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `initializeAsInitiator` | - | `Promise<RTCSessionDescriptionInit>` | Initialize as sender |
| `acceptConnection` | `offer: RTCSessionDescriptionInit` | `Promise<RTCSessionDescriptionInit>` | Accept as receiver |
| `completeConnection` | `answer: RTCSessionDescriptionInit` | `Promise<void>` | Complete connection |
| `sendFile` | `file: File, onProgress?: (n) => void` | `Promise<void>` | Send single file |
| `sendFiles` | `files: File[], onProgress?: (i, n) => void` | `Promise<void>` | Send multiple files |
| `downloadReceivedFile` | `file: ReceivedFile` | - | Download received file |
| `onFileReceived` | `callback: (file) => void` | - | Set receive callback |
| `disconnect` | - | - | Close connection |
| `triggerVerification` | - | - | Start peer verification |
| `confirmVerification` | - | - | Confirm verification |
| `failVerification` | - | - | Fail verification |
| `skipVerification` | - | - | Skip verification |

### Example: File Transfer over P2P

```tsx
const p2p = useP2PConnection();

// As initiator
const offer = await p2p.initializeAsInitiator();
// Share offer...

// Receiver sends answer
await p2p.completeConnection(answer);

// Send file
await p2p.sendFile(file, (progress) => {
  console.log(`Progress: ${progress}%`);
});

// Receive files
p2p.onFileReceived((file) => {
  console.log('Received:', file.name);
  p2p.downloadReceivedFile(file);
});
```

---

## usePQCTransfer

**Purpose**: Post-quantum cryptography file transfers

**Location**: `lib/hooks/use-pqc-transfer.ts`

### Basic Usage

```tsx
import { usePQCTransfer } from '@/lib/hooks/use-pqc-transfer';

const pqc = usePQCTransfer({
  onTransferComplete: (blob, filename) => {
    console.log('Transfer complete:', filename);
  }
});
```

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `isNegotiating` | `boolean` | Key exchange in progress |
| `isTransferring` | `boolean` | File transfer active |
| `progress` | `number` | Transfer progress (0-100) |
| `error` | `string \| null` | Error message |
| `sessionReady` | `boolean` | Keys exchanged and ready |

### Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `initializeSender` | - | `Promise<string>` | Initialize as sender, returns public key hex |
| `initializeReceiver` | - | `Promise<string>` | Initialize as receiver, returns public key hex |
| `setPeerPublicKey` | `publicKeyHex: string` | `Promise<void>` | Set peer's public key |
| `setDataChannel` | `dataChannel: RTCDataChannel` | - | Set WebRTC data channel |
| `sendFile` | `file: File` | `Promise<void>` | Send file with PQC encryption |
| `getSessionInfo` | - | `object \| undefined` | Get session information |

### Example: Quantum-Resistant Transfer

```tsx
const pqc = usePQCTransfer({
  onTransferComplete: (blob, filename) => {
    downloadFile(blob, filename);
  }
});

// Sender
const senderPublicKey = await pqc.initializeSender();
// Share public key...

// Exchange keys
await pqc.setPeerPublicKey(receiverPublicKey);

// Set data channel
pqc.setDataChannel(dataChannel);

// Send with quantum protection
await pqc.sendFile(file);
```

---

## Hook Comparison

| Feature | useDeviceConnection | useP2PSession | useTransferState | useFileTransfer | useP2PConnection | usePQCTransfer |
|---------|-------------------|--------------|-----------------|----------------|-----------------|---------------|
| **Primary Use** | Device discovery | Session codes | Progress tracking | File selection | P2P connectivity | Quantum security |
| **State Management** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Event Callbacks** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Async Operations** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Cleanup** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **TypeScript** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **JSDoc Coverage** | 100% | 100% | 100% | 100% | Partial | Partial |

---

## Common Patterns

### Pattern 1: Complete Transfer Flow

```tsx
function TransferApp() {
  const connection = useDeviceConnection({ enableDiscovery: true });
  const session = useP2PSession({ autoGenerate: true });
  const transfer = useTransferState({ saveToHistory: true });
  const files = useFileTransfer();
  const p2p = useP2PConnection();

  const handleSend = async () => {
    transfer.startTransfer(files.files, 'send');

    for (const file of files.getAllFiles()) {
      await p2p.sendFile(file, (progress) => {
        transfer.updateFileProgress(file.id, progress);
      });
    }

    transfer.completeTransfer();
  };

  return (
    <div>
      <ConnectionSelector {...connection} />
      <CodeDisplay {...session} />
      <FileSelector {...files} />
      <TransferProgress {...transfer} />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

### Pattern 2: Quantum-Secure Transfer

```tsx
function SecureTransfer() {
  const pqc = usePQCTransfer();
  const p2p = useP2PConnection();

  useEffect(() => {
    if (p2p.state.isConnected) {
      // Initialize PQC after P2P connection
      pqc.initializeSender().then(publicKey => {
        // Share public key via P2P signaling
      });
    }
  }, [p2p.state.isConnected]);

  return (
    <div>
      {pqc.sessionReady && <SendButton />}
      {pqc.isTransferring && <progress value={pqc.progress} />}
    </div>
  );
}
```

---

## Best Practices

1. **Always use TypeScript**: Hooks are fully typed
2. **Handle cleanup**: Hooks handle cleanup, but disconnect manually if needed
3. **Error boundaries**: Wrap components in error boundaries
4. **Test hooks**: Use `@testing-library/react-hooks` for testing
5. **Callbacks in refs**: Use refs for callbacks to avoid stale closures
6. **Combine hooks**: Compose multiple hooks for complex flows

---

## Documentation

For detailed API documentation, see:
- [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md)
- [CODE_QUALITY_IMPROVEMENTS.md](./CODE_QUALITY_IMPROVEMENTS.md)
- Generated TypeDoc: Run `npm run docs` and open `docs/api/index.html`

---

## Contributing

When creating new hooks:
1. Add comprehensive JSDoc comments
2. Include usage examples
3. Export all types
4. Write unit tests
5. Update this reference guide
