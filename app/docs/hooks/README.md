# Hooks Documentation

Complete reference guide for all custom React hooks in Tallow.

## Quick Navigation

### Transfer Hooks
- **useFileTransfer** - File selection and drag-and-drop management
- **useResumableTransfer** - Resumable file transfers with connection recovery
- **useP2PConnection** - P2P WebRTC connections with encryption

### Discovery Hooks
- **useUnifiedDiscovery** - Unified device discovery (mDNS + signaling)
- **useNATOptimizedConnection** - NAT-aware connection optimization

### Chat Hooks
- **useChatIntegration** - Encrypted chat in transfer sessions
- **useChatVisibility** - Chat visibility management

### Security Hooks
- **useOnionRouting** - Privacy-preserving onion routing
- **usePQCManager** - Post-quantum cryptography operations
- **useSecureStorage** - Encrypted IndexedDB storage

### Media Hooks
- **useScreenCapture** - Screen sharing functionality

### UI Hooks
- **usePerformance** - Performance metrics and monitoring
- **useIntersectionObserver** - Viewport detection for lazy loading
- **useKeyboardShortcut** - Global keyboard shortcuts
- **useNotifications** - Toast and browser notifications

### Utility Hooks
- **useFocusTrap** - Focus management for modals

## Usage Patterns

### Basic Hook Import
```tsx
import { useFileTransfer } from '@/lib/hooks/use-file-transfer';

function MyComponent() {
  const { files, addFiles } = useFileTransfer();
  return <div>{files.length} files selected</div>;
}
```

### Hook with Callbacks
```tsx
import { useResumableTransfer } from '@/lib/hooks/use-resumable-transfer';

function TransferComponent() {
  const { isTransferring, progress } = useResumableTransfer({
    onTransferComplete: (blob, filename) => {
      console.log('Transfer complete:', filename);
    },
    onError: (error) => {
      console.error('Transfer failed:', error);
    },
  });

  return <progress value={progress} max={100} />;
}
```

### Async Hooks
```tsx
import { usePQCManager } from '@/lib/hooks/use-pqc-manager';

function PQCComponent() {
  const { isInitialized, generateKeyPair } = usePQCManager({
    autoInit: true,
  });

  const handleGenerate = async () => {
    const keyPair = await generateKeyPair();
    // Use keypair
  };

  return !isInitialized ? <p>Loading...</p> : <button onClick={handleGenerate}>Generate</button>;
}
```

## Key Features

### Transfer Management
- Full file lifecycle management (selection, sending, resumption)
- Resumable transfers with connection recovery
- P2P encrypted file sharing
- Backpressure handling for optimal throughput

### Network Optimization
- Unified device discovery (local + internet)
- NAT type detection and adaptation
- TURN server health monitoring
- Adaptive connection strategies

### Security
- Post-quantum cryptography (ML-KEM-768 + X25519)
- Encrypted storage (IndexedDB)
- Onion routing for privacy
- Peer verification with SAS

### Performance
- Core Web Vitals tracking
- Long task detection
- Render time measurement
- Idle callback scheduling

### Accessibility
- Focus trapping for modals
- Keyboard shortcut management
- Motion preferences detection
- Intersection observer for animations

## State Management

Hooks manage their own state and provide:
- **State** - Current status of the operation
- **Actions** - Functions to control behavior
- **Callbacks** - Handlers for events

Example:
```tsx
const {
  // State
  isLoading,
  error,
  data,

  // Actions
  fetchData,
  reset,

  // Callbacks (often in useEffect)
} = useMyHook();
```

## Error Handling

Most hooks provide error state:
```tsx
const { error, isInitialized } = useSecureStorage();

if (error) {
  console.error('Storage error:', error);
}
```

## Performance Considerations

### Memoization
Hooks use `useCallback` and `useMemo` to prevent unnecessary re-renders:
```tsx
const { sendFile } = useP2PConnection();
// sendFile is memoized and won't change unless dependencies change
```

### Ref Management
Complex hooks use `useRef` for:
- Manager instances (avoid recreating expensive objects)
- Previous values (comparing state changes)
- Internal state (not triggering re-renders)

### Effect Cleanup
All hooks with effects properly cleanup:
```tsx
useEffect(() => {
  // Setup
  return () => {
    // Cleanup (destroy managers, clear listeners, etc.)
  };
}, [deps]);
```

## Special Patterns

### Turbopack State Access
Some hooks support `getState()` for Turbopack fast refresh:
```tsx
const { getSessionInfo } = useResumableTransfer();
const sessionInfo = getSessionInfo?.();
```

### Singleton Pattern
Certain managers use singleton pattern to avoid duplication:
- PQCryptoService (shared across components)
- UnifiedDiscovery (single discovery instance)

### Custom Compound Hooks
Some libraries provide specialized variants:
```tsx
// Instead of:
const discovery = useUnifiedDiscovery({ enableSignaling: false });

// Use specific hook:
const discovery = useMdnsDiscovery();
```

## Common Use Cases

### File Transfer with Resume
```tsx
function FileTransferApp() {
  const transfer = useResumableTransfer({
    autoResume: true,
    onTransferComplete: (blob, filename) => downloadFile(blob, filename),
  });

  return (
    <div>
      <button onClick={() => transfer.initializeSender()}>
        Send Files
      </button>
      <progress value={transfer.progress} max={100} />
    </div>
  );
}
```

### Device Discovery
```tsx
function DeviceFinder() {
  const { devices, isDiscovering, startDiscovery } = useUnifiedDiscovery();

  useEffect(() => {
    startDiscovery();
  }, []);

  return (
    <ul>
      {devices.map(d => (
        <li key={d.id}>{d.name}</li>
      ))}
    </ul>
  );
}
```

### Secure Chat
```tsx
function SecureChat() {
  const chat = useChatIntegration({
    dataChannel,
    sessionKeys,
    currentUserId: user.id,
    currentUserName: user.name,
  });

  const sendMessage = (text: string) => {
    chat.chatManager?.sendMessage(text);
  };

  return (
    <div>
      <input onKeyDown={(e) => {
        if (e.key === 'Enter') sendMessage(e.currentTarget.value);
      }} />
    </div>
  );
}
```

### Performance Monitoring
```tsx
function PerformanceAware() {
  const { markStart, markEnd, metrics } = usePerformance({
    trackWebVitals: true,
  });

  const handleExpensiveOperation = async () => {
    markStart('expensive');
    await doExpensiveWork();
    const duration = markEnd('expensive');
    console.log('Operation took:', duration, 'ms');
  };

  return <button onClick={handleExpensiveOperation}>Do Work</button>;
}
```

## Best Practices

1. **Initialize early** - Use `autoInit` options when available
2. **Handle errors** - Check error state and handle gracefully
3. **Clean up** - Hooks cleanup automatically on unmount
4. **Memoize callbacks** - Use `useCallback` when passing hook methods
5. **Avoid infinite loops** - Be careful with dependencies
6. **Test thoroughly** - Mock WebRTC, crypto, and storage APIs in tests

## Browser Support

- **Modern browsers** - All features supported
- **Safari** - Most features, fallbacks for some APIs
- **IE11** - Not supported

## Dependencies

- React 18+
- Web APIs (WebRTC, Crypto, IndexedDB, MediaDevices)
- Optional: WASM for crypto operations

## Related Documentation

- [Security Guide](./security.md)
- [API Reference](./api.md)
- [Performance Tips](./performance.md)
- [Troubleshooting](./troubleshooting.md)

## Contributing

When adding new hooks:

1. Follow naming convention: `use{Feature}`
2. Add TypeScript interfaces for options and return type
3. Include JSDoc comments
4. Provide React examples
5. Add to this reference guide

## License

Part of Tallow - Secure file transfer application
