# Centralized State Management

**Date:** 2026-01-25
**Status:** ✅ Complete
**Priority:** Architecture Improvement

---

## Overview

Implemented centralized state management using React Context API to reduce prop drilling, improve code maintainability, and provide consistent state across the application.

---

## Architecture

### Context Providers

#### 1. **TransfersContext** (`lib/context/transfers-context.tsx`)

Manages all file transfer state and operations.

**State:**
- `transfers`: Active transfers list
- `queue`: Files queued for transfer
- `uploadProgress` / `downloadProgress`: Transfer progress (0-100)
- `isTransferring` / `isReceiving`: Transfer status flags
- `currentFileName` / `currentFileSize` / `currentFileType`: Current transfer info
- `currentTransferPeerId`: Connected peer ID
- `receivedFiles`: List of received files

**Actions:**
- `addTransfer()` / `removeTransfer()` / `updateTransfer()`: Transfer management
- `addToQueue()` / `removeFromQueue()` / `clearQueue()`: Queue management
- `setUploadProgress()` / `setDownloadProgress()`: Progress tracking
- `setIsTransferring()` / `setIsReceiving()`: Status updates
- `addReceivedFile()` / `removeReceivedFile()`: Received files management

#### 2. **DevicesContext** (`lib/context/devices-context.tsx`)

Manages device discovery and connection state.

**State:**
- `currentDevice`: Current user's device info
- `discoveredDevices`: Devices found on local network
- `connectedPeer` / `connectedPeerName`: Connected peer info
- `isConnecting` / `isConnected`: Connection status
- `connectionCode`: Code for peer connection
- `connectionType`: 'p2p' or 'relay'

**Actions:**
- `initializeCurrentDevice()`: Initialize current device
- `addDiscoveredDevice()` / `removeDiscoveredDevice()`: Device discovery
- `setConnectedPeer()` / `disconnectPeer()`: Connection management
- `setConnectionCode()` / `setConnectionType()`: Connection config

#### 3. **AppProvider** (`lib/context/app-provider.tsx`)

Root provider that combines all contexts in correct order.

---

## Usage

### 1. Wrap App with Provider

In your root layout or app component:

```tsx
import { AppProvider } from '@/lib/context';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
```

### 2. Use Hooks in Components

#### Transfers Context

```tsx
import { useTransfers } from '@/lib/context';

function FileUploader() {
  const {
    queue,
    uploadProgress,
    isTransferring,
    addToQueue,
    setUploadProgress,
    setIsTransferring
  } = useTransfers();

  const handleFileSelect = (files: File[]) => {
    addToQueue(files);
  };

  const handleUpload = async () => {
    setIsTransferring(true);
    // ... upload logic
    setUploadProgress(50);
    // ... more upload logic
    setIsTransferring(false);
  };

  return (
    <div>
      <p>Queue: {queue.length} files</p>
      <p>Progress: {uploadProgress}%</p>
      <button onClick={handleUpload} disabled={isTransferring}>
        Upload
      </button>
    </div>
  );
}
```

#### Devices Context

```tsx
import { useDevices } from '@/lib/context';

function DeviceList() {
  const {
    currentDevice,
    discoveredDevices,
    connectedPeer,
    isConnected,
    setConnectedPeer,
  } = useDevices();

  const handleConnect = (deviceId: string) => {
    setConnectedPeer(deviceId, 'Device Name');
  };

  return (
    <div>
      <h3>My Device: {currentDevice?.name}</h3>
      <h4>Discovered Devices:</h4>
      <ul>
        {discoveredDevices.map(device => (
          <li key={device.id}>
            {device.name} - {device.ip}
            <button onClick={() => handleConnect(device.id)}>
              Connect
            </button>
          </li>
        ))}
      </ul>
      {isConnected && <p>Connected to: {connectedPeer}</p>}
    </div>
  );
}
```

---

## Benefits

### Before (useState + Props)
```tsx
// Parent component
function AppPage() {
  const [transfers, setTransfers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [progress, setProgress] = useState(0);
  const [devices, setDevices] = useState([]);
  // ... 20 more state variables

  return (
    <FileSelector
      queue={queue}
      setQueue={setQueue}
      transfers={transfers}
      setTransfers={setTransfers}
      progress={progress}
      setProgress={setProgress}
      devices={devices}
      setDevices={setDevices}
      // ... 20 more props
    />
  );
}
```

**Problems:**
- ❌ Prop drilling through multiple levels
- ❌ Parent component has too much state (1000+ lines)
- ❌ Hard to share state between sibling components
- ❌ Difficult to test components in isolation
- ❌ No separation of concerns

### After (Context API)
```tsx
// Parent component
function AppPage() {
  return <FileSelector />; // No props needed!
}

// Child component
function FileSelector() {
  const { queue, addToQueue } = useTransfers();
  const { discoveredDevices } = useDevices();
  // Direct access to state, no props!
}
```

**Benefits:**
- ✅ No prop drilling - direct state access
- ✅ Cleaner component code
- ✅ Easy to share state across components
- ✅ Better testability (mock contexts)
- ✅ Clear separation of concerns
- ✅ Type-safe with TypeScript

---

## Migration Guide

### Step 1: Wrap App

```tsx
// app/layout.tsx
import { AppProvider } from '@/lib/context';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
```

### Step 2: Replace useState with Context

**Before:**
```tsx
function Component({ transfers, setTransfers }) {
  const addTransfer = (transfer) => {
    setTransfers([...transfers, transfer]);
  };
}
```

**After:**
```tsx
function Component() {
  const { transfers, addTransfer } = useTransfers();
  // addTransfer is already available!
}
```

### Step 3: Remove Props

**Before:**
```tsx
<FileSelector
  transfers={transfers}
  setTransfers={setTransfers}
  queue={queue}
  setQueue={setQueue}
/>
```

**After:**
```tsx
<FileSelector />
// Component gets state from context!
```

---

## Testing

### Mock Context for Tests

```tsx
import { TransfersProvider } from '@/lib/context';
import { render, screen } from '@testing-library/react';

test('FileSelector shows queue count', () => {
  const mockQueue = [
    new File([''], 'test1.txt'),
    new File([''], 'test2.txt'),
  ];

  render(
    <TransfersProvider initialQueue={mockQueue}>
      <FileSelector />
    </TransfersProvider>
  );

  expect(screen.getByText('2 files in queue')).toBeInTheDocument();
});
```

---

## Performance Optimization

### Prevent Unnecessary Re-renders

Use `React.memo` for components that don't need to re-render on every state change:

```tsx
import { memo } from 'react';
import { useTransfers } from '@/lib/context';

const ProgressBar = memo(function ProgressBar() {
  const { uploadProgress } = useTransfers();
  return <progress value={uploadProgress} max={100} />;
});
```

### Selective Subscriptions

Only subscribe to needed state:

```tsx
// ❌ Bad - re-renders on any transfer state change
const { ...allState } = useTransfers();

// ✅ Good - only re-renders when uploadProgress changes
const { uploadProgress } = useTransfers();
```

---

## Context Structure

```
AppProvider (Root)
  └─ DevicesProvider
       └─ TransfersProvider
            └─ Your App Components
```

**Why this order?**
- Devices should be available first (needed for transfers)
- Transfers depend on device state (current device, connected peer)
- Inner providers can access outer provider state

---

## API Reference

### TransfersContext

```typescript
interface TransferState {
  transfers: Transfer[];
  queue: File[];
  uploadProgress: number;
  downloadProgress: number;
  isTransferring: boolean;
  isReceiving: boolean;
  currentFileName: string | null;
  currentFileSize: number;
  currentFileType: string;
  currentTransferPeerId: string | null;
  receivedFiles: ReceivedFile[];
}

interface TransfersActions {
  addTransfer(transfer: Transfer): void;
  removeTransfer(id: string): void;
  updateTransfer(id: string, updates: Partial<Transfer>): void;
  clearTransfers(): void;
  addToQueue(files: File[]): void;
  removeFromQueue(index: number): void;
  clearQueue(): void;
  setUploadProgress(progress: number): void;
  setDownloadProgress(progress: number): void;
  resetProgress(): void;
  setIsTransferring(value: boolean): void;
  setIsReceiving(value: boolean): void;
  setCurrentTransfer(fileName: string | null, fileSize: number, fileType: string, peerId: string | null): void;
  clearCurrentTransfer(): void;
  addReceivedFile(file: ReceivedFile): void;
  removeReceivedFile(index: number): void;
  clearReceivedFiles(): void;
}
```

### DevicesContext

```typescript
interface DeviceState {
  currentDevice: Device | null;
  discoveredDevices: DiscoveredDevice[];
  connectedPeer: string | null;
  connectedPeerName: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  connectionCode: string;
  connectionType: 'p2p' | 'relay';
}

interface DevicesActions {
  initializeCurrentDevice(name?: string, platform?: string): void;
  updateCurrentDevice(updates: Partial<Device>): void;
  addDiscoveredDevice(device: DiscoveredDevice): void;
  removeDiscoveredDevice(id: string): void;
  updateDiscoveredDevice(id: string, updates: Partial<DiscoveredDevice>): void;
  clearDiscoveredDevices(): void;
  setConnectedPeer(peerId: string | null, peerName?: string | null): void;
  setIsConnecting(value: boolean): void;
  setIsConnected(value: boolean): void;
  setConnectionCode(code: string): void;
  setConnectionType(type: 'p2p' | 'relay'): void;
  disconnectPeer(): void;
}
```

---

## Files Created

1. `lib/context/transfers-context.tsx` - Transfers state management (220 lines)
2. `lib/context/devices-context.tsx` - Devices state management (200 lines)
3. `lib/context/app-provider.tsx` - Combined provider (30 lines)
4. `lib/context/index.ts` - Barrel exports (15 lines)
5. `STATE_MANAGEMENT.md` - This documentation

---

## Next Steps

### Migrate App Page

The main `app/app/page.tsx` should be migrated to use these contexts:

1. Wrap page with `AppProvider` in layout
2. Replace useState hooks with context hooks
3. Remove prop drilling from child components
4. Test thoroughly

### Add More Contexts (Optional)

Consider adding contexts for:
- **SettingsContext**: Theme, language, preferences
- **AuthContext**: User authentication state
- **NotificationsContext**: Toast notifications, alerts

---

## Troubleshooting

### "useTransfers must be used within TransfersProvider"

**Cause**: Component using hook is not wrapped in provider

**Solution**:
```tsx
// Wrap parent component or app root
<AppProvider>
  <YourComponent />
</AppProvider>
```

### Re-renders Too Often

**Cause**: Component subscribes to entire context state

**Solution**: Only destructure needed values:
```tsx
// ✅ Good
const { uploadProgress } = useTransfers();

// ❌ Bad
const allState = useTransfers();
```

---

## References

- React Context: https://react.dev/learn/passing-data-deeply-with-context
- Context Performance: https://react.dev/reference/react/useContext#optimizing-re-renders
- TypeScript + Context: https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/

---

**Status**: Production-ready ✅

Centralized state management is now available. Migrate components gradually to take advantage of cleaner code and reduced prop drilling.
