# Refactoring Guide

## Overview

This document describes the major refactoring work completed to improve code quality, maintainability, and documentation across the Tallow codebase.

## Table of Contents

- [Custom Hooks](#custom-hooks)
- [JSDoc Documentation](#jsdoc-documentation)
- [TypeDoc Configuration](#typedoc-configuration)
- [App Page Refactoring](#app-page-refactoring)
- [Benefits](#benefits)
- [Usage Examples](#usage-examples)

## Custom Hooks

We've extracted complex state management logic into reusable custom hooks, following React best practices.

### 1. `useDeviceConnection`

**Location**: `lib/hooks/use-device-connection.ts`

**Purpose**: Manages device connections and local network discovery.

**Features**:
- Connection type management (local, internet, friends)
- Local device discovery with configurable polling
- Connection state tracking
- Error handling and reporting
- Callback support for events

**Key Functions**:
- `setConnectionType()` - Set connection mode
- `connectToDevice()` - Initiate device connection
- `markConnected()` - Mark connection as established
- `disconnect()` - Close connection
- `startDiscovery()` / `stopDiscovery()` - Control local discovery

**Usage**:
```tsx
const {
  connectionType,
  isConnecting,
  connectedDeviceId,
  discoveredDevices,
  connectToDevice,
  disconnect
} = useDeviceConnection({
  enableDiscovery: true,
  onConnectionSuccess: (id, name) => {
    toast.success(`Connected to ${name}`);
  }
});
```

### 2. `useP2PSession`

**Location**: `lib/hooks/use-p2p-session.ts`

**Purpose**: Manages P2P session lifecycle and connection codes.

**Features**:
- Connection code generation (short codes & word phrases)
- Session lifecycle management
- Code format switching
- Session timeout support
- Metadata tracking

**Key Functions**:
- `generateCode()` - Generate new connection code
- `setCodeFormat()` - Switch between code formats
- `startSession()` - Begin new session
- `endSession()` - Terminate session
- `setPeerCode()` - Set peer's connection code

**Usage**:
```tsx
const {
  sessionId,
  connectionCode,
  codeFormat,
  isActive,
  setCodeFormat,
  regenerateCode,
  startSession
} = useP2PSession({
  defaultCodeFormat: 'words',
  autoGenerate: true,
  onSessionStart: (id) => console.log('Session started:', id)
});
```

### 3. `useTransferState`

**Location**: `lib/hooks/use-transfer-state.ts`

**Purpose**: Manages file transfer state and progress tracking.

**Features**:
- Multi-file transfer support
- Real-time progress tracking
- Speed calculation
- ETA estimation
- Automatic history recording
- Per-file and overall progress

**Key Functions**:
- `startTransfer()` - Begin file transfer
- `updateFileProgress()` - Update transfer progress
- `completeTransfer()` - Mark transfer complete
- `cancelTransfer()` - Cancel ongoing transfer
- `formatSpeed()` / `formatTimeRemaining()` - Format utilities

**Usage**:
```tsx
const {
  status,
  currentFile,
  overallProgress,
  overallSpeed,
  estimatedTimeRemaining,
  startTransfer,
  updateFileProgress,
  completeTransfer
} = useTransferState({
  saveToHistory: true,
  onTransferComplete: (files) => {
    toast.success(`Transferred ${files.length} files`);
  }
});
```

### 4. Enhanced `useFileTransfer`

**Location**: `lib/hooks/use-file-transfer.ts`

**Enhancements**:
- Added comprehensive JSDoc documentation
- Improved type safety
- Better error handling

**Features** (existing + documented):
- Drag-and-drop support
- File picker integration
- Multi-file selection
- File management utilities

## JSDoc Documentation

All hooks, components, and utilities now include comprehensive JSDoc comments following best practices.

### Documentation Standards

Each exported function/hook includes:

1. **File-level documentation**:
```typescript
/**
 * @fileoverview Brief description of the file's purpose
 * @module path/to/module
 */
```

2. **Interface documentation**:
```typescript
/**
 * Description of the interface
 * @interface InterfaceName
 */
export interface InterfaceName {
  /** Property description */
  property: type;
}
```

3. **Function documentation**:
```typescript
/**
 * Function description
 *
 * @param {Type} paramName - Parameter description
 * @returns {ReturnType} Return value description
 *
 * @example
 * ```typescript
 * const result = functionName(param);
 * ```
 */
export function functionName(paramName: Type): ReturnType {
  // Implementation
}
```

### Documentation Coverage

- **Hooks**: 100% coverage
  - `useDeviceConnection`
  - `useP2PSession`
  - `useTransferState`
  - `useFileTransfer`
  - `useP2PConnection`
  - `usePQCTransfer`

- **Utilities**: File transfer utilities fully documented
  - `downloadFile()`
  - `downloadFiles()`
  - `formatFileSize()`
  - `formatSpeed()`
  - `formatTime()`
  - `getFileExtension()`
  - `getMimeType()`

## TypeDoc Configuration

### Setup

We've configured TypeDoc for automated API documentation generation.

**Configuration File**: `typedoc.json`

**Features**:
- Automatic documentation from JSDoc comments
- Multiple entry points (app, components, lib)
- GitHub-style themes (dark/light)
- Search functionality
- Version tracking
- Git integration

### npm Scripts

```bash
# Generate documentation
npm run docs

# Watch mode (regenerates on file changes)
npm run docs:watch

# Serve documentation locally
npm run docs:serve
```

### Output

Documentation is generated in `docs/api/` directory with:
- Full API reference
- Type definitions
- Usage examples
- Cross-referenced navigation
- Search index

### Viewing Documentation

After running `npm run docs`, open `docs/api/index.html` in a browser or run:

```bash
npm run docs:serve
```

Then navigate to `http://localhost:3000`

## App Page Refactoring

### Before

- **File**: `app/app/page.tsx`
- **Lines**: ~1850 lines
- **Issues**:
  - Monolithic component
  - Mixed concerns
  - Hard to test
  - Difficult to maintain

### Refactoring Strategy

The large app page can now be refactored using the new hooks:

```tsx
// Before: 1850 lines of mixed state and logic

// After: Clean separation of concerns
export default function AppPage() {
  const { t } = useLanguage();

  // Device connection management
  const deviceConnection = useDeviceConnection({
    enableDiscovery: true
  });

  // Session management
  const session = useP2PSession({
    defaultCodeFormat: 'words',
    autoGenerate: true
  });

  // Transfer state management
  const transfer = useTransferState({
    saveToHistory: true
  });

  // File selection
  const files = useFileTransfer();

  // Render UI (under 300 lines)
  return (
    <div>
      {/* UI components using hook data */}
    </div>
  );
}
```

### Recommended Next Steps

To complete the refactoring of `app/app/page.tsx`:

1. **Extract UI Components**:
   - `ConnectionSelector` - Connection type selection
   - `SessionCodeDisplay` - Code display and sharing
   - `FileTransferPanel` - File selection and transfer UI
   - `DeviceConnectionStatus` - Connection status indicator

2. **Use Custom Hooks**:
   - Replace inline state with `useDeviceConnection`
   - Replace session logic with `useP2PSession`
   - Replace transfer tracking with `useTransferState`

3. **Separate Concerns**:
   - Move WebRTC logic to separate service
   - Extract signaling logic to utility functions
   - Create dedicated error handling utilities

## Benefits

### Code Quality

1. **Modularity**: Logic separated into focused, reusable hooks
2. **Testability**: Hooks can be tested in isolation
3. **Type Safety**: Full TypeScript coverage with strict typing
4. **Maintainability**: Smaller, focused files are easier to maintain

### Developer Experience

1. **Documentation**: Comprehensive JSDoc comments
2. **IntelliSense**: Better IDE autocomplete and hints
3. **Examples**: Usage examples in documentation
4. **Discoverability**: TypeDoc-generated browseable docs

### Performance

1. **Code Splitting**: Smaller components enable better splitting
2. **Memoization**: Easier to identify optimization opportunities
3. **Re-renders**: Reduced unnecessary re-renders with focused state

### Collaboration

1. **Onboarding**: New developers can reference documentation
2. **Standards**: Established patterns for consistency
3. **Review**: Smaller changes easier to review
4. **Knowledge Sharing**: Self-documenting code

## Usage Examples

### Example 1: Simple Send Flow

```tsx
function SendPage() {
  const session = useP2PSession({ autoGenerate: true });
  const files = useFileTransfer();
  const transfer = useTransferState();

  const handleSend = async () => {
    transfer.startTransfer(files.files, 'send');
    // Send logic...
  };

  return (
    <div>
      <CodeDisplay code={session.connectionCode} />
      <FileSelector {...files} />
      <Button onClick={handleSend}>Send</Button>
    </div>
  );
}
```

### Example 2: Local Discovery

```tsx
function LocalTransfer() {
  const connection = useDeviceConnection({
    enableDiscovery: true,
    discoveryInterval: 3000,
    onDeviceDiscovered: (device) => {
      toast.info(`Found device: ${device.name}`);
    }
  });

  return (
    <DeviceList
      devices={connection.discoveredDevices}
      onConnect={connection.connectToDevice}
    />
  );
}
```

### Example 3: Transfer Progress

```tsx
function TransferProgress() {
  const transfer = useTransferState({
    onProgressUpdate: (progress) => {
      console.log(`Progress: ${progress}%`);
    }
  });

  return (
    <div>
      <Progress value={transfer.overallProgress} />
      <p>Speed: {transfer.formatSpeed(transfer.overallSpeed)}</p>
      <p>ETA: {transfer.formatTimeRemaining(transfer.estimatedTimeRemaining)}</p>
    </div>
  );
}
```

## Migration Guide

### Step 1: Install TypeDoc

```bash
npm install --save-dev typedoc
```

### Step 2: Import New Hooks

```tsx
import { useDeviceConnection } from '@/lib/hooks/use-device-connection';
import { useP2PSession } from '@/lib/hooks/use-p2p-session';
import { useTransferState } from '@/lib/hooks/use-transfer-state';
```

### Step 3: Replace Inline State

Instead of:
```tsx
const [isConnecting, setIsConnecting] = useState(false);
const [connectedDevice, setConnectedDevice] = useState(null);
const [connectionError, setConnectionError] = useState(null);
```

Use:
```tsx
const {
  isConnecting,
  connectedDeviceId,
  connectionError,
  connectToDevice
} = useDeviceConnection();
```

### Step 4: Generate Documentation

```bash
npm run docs
```

## Testing

### Hook Testing

Test hooks using React Testing Library:

```tsx
import { renderHook, act } from '@testing-library/react';
import { useP2PSession } from '@/lib/hooks/use-p2p-session';

test('generates connection code on mount', () => {
  const { result } = renderHook(() =>
    useP2PSession({ autoGenerate: true })
  );

  expect(result.current.connectionCode).toBeTruthy();
});
```

### Component Testing

Test components using hooks:

```tsx
import { render, screen } from '@testing-library/react';
import { useTransferState } from '@/lib/hooks/use-transfer-state';

function TestComponent() {
  const transfer = useTransferState();
  return <div>{transfer.status}</div>;
}

test('initial status is idle', () => {
  render(<TestComponent />);
  expect(screen.getByText('idle')).toBeInTheDocument();
});
```

## Best Practices

### 1. Hook Composition

Combine hooks for complex scenarios:

```tsx
function useCompleteTransferFlow() {
  const connection = useDeviceConnection();
  const session = useP2PSession();
  const transfer = useTransferState();

  return {
    connection,
    session,
    transfer,
    isReady: connection.isConnected && session.isActive
  };
}
```

### 2. Error Boundaries

Wrap components using hooks in error boundaries:

```tsx
<ErrorBoundary fallback={<ErrorUI />}>
  <TransferComponent />
</ErrorBoundary>
```

### 3. Cleanup

Hooks handle cleanup automatically, but ensure proper unmounting:

```tsx
useEffect(() => {
  const connection = useDeviceConnection();

  return () => {
    connection.disconnect();
  };
}, []);
```

### 4. Type Safety

Always use TypeScript interfaces:

```tsx
import { TransferMode, TransferStatus } from '@/lib/hooks/use-transfer-state';

const mode: TransferMode = 'send';
const status: TransferStatus = 'transferring';
```

## Troubleshooting

### Issue: Hook Not Found

**Solution**: Check import path and ensure file exists

```tsx
// Correct
import { useP2PSession } from '@/lib/hooks/use-p2p-session';

// Incorrect
import { useP2PSession } from '@/hooks/use-p2p-session';
```

### Issue: TypeDoc Generation Fails

**Solution**: Check for TypeScript errors first

```bash
npm run type-check
```

### Issue: Stale Closures

**Solution**: Use refs for callbacks in hooks

```tsx
const callbackRef = useRef(callback);
useEffect(() => {
  callbackRef.current = callback;
}, [callback]);
```

## Contributing

When adding new hooks or utilities:

1. Add comprehensive JSDoc comments
2. Include usage examples
3. Add TypeScript types
4. Write unit tests
5. Update this documentation
6. Regenerate TypeDoc

## Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JSDoc Reference](https://jsdoc.app/)
- [TypeDoc Documentation](https://typedoc.org/)

## License

This refactoring follows the same license as the Tallow project.
