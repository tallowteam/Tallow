# Hooks Documentation Index

Welcome to the comprehensive Hooks Documentation for Tallow. This guide provides complete API reference for all 17+ custom React hooks used throughout the application.

## Quick Start

1. **New to Tallow hooks?** Start with [Quick Reference](./QUICK_REFERENCE.md)
2. **Need implementation examples?** Check [README.md](./README.md)
3. **Looking for specific hook?** Use the [Interactive Documentation](./page.tsx)

## All Hooks

### Transfer Management
- **[useFileTransfer](./page.tsx?hook=use-file-transfer)** - File selection and drag-and-drop
- **[useResumableTransfer](./page.tsx?hook=use-resumable-transfer)** - Connection recovery and resumption
- **[useP2PConnection](./page.tsx?hook=use-p2p-connection)** - WebRTC with encryption

### Device Discovery
- **[useUnifiedDiscovery](./page.tsx?hook=use-unified-discovery)** - mDNS + signaling discovery
- **[useNATOptimizedConnection](./page.tsx?hook=use-nat-optimized-connection)** - NAT optimization

### Chat & Messaging
- **[useChatIntegration](./page.tsx?hook=use-chat-integration)** - Encrypted chat in transfers
- **[useChatVisibility](./page.tsx?hook=use-chat-visibility)** - Chat visibility management

### Security & Privacy
- **[useOnionRouting](./page.tsx?hook=use-onion-routing)** - Privacy-preserving routing
- **[usePQCManager](./page.tsx?hook=use-pqc-manager)** - Post-quantum cryptography
- **[useSecureStorage](./page.tsx?hook=use-secure-storage)** - Encrypted storage

### Media & Capture
- **[useScreenCapture](./page.tsx?hook=use-screen-capture)** - Screen sharing

### UI & UX
- **[usePerformance](./page.tsx?hook=use-performance)** - Performance monitoring
- **[useIntersectionObserver](./page.tsx?hook=use-intersection-observer)** - Viewport detection
- **[useKeyboardShortcut](./page.tsx?hook=use-keyboard-shortcut)** - Keyboard management
- **[useNotifications](./page.tsx?hook=use-notifications)** - Notifications

### Accessibility
- **[useFocusTrap](./page.tsx?hook=use-focus-trap)** - Focus management

## Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| **page.tsx** | Interactive documentation with sidebar | All developers |
| **page.module.css** | Responsive styling | Front-end developers |
| **README.md** | Usage patterns and best practices | Developers new to hooks |
| **QUICK_REFERENCE.md** | Cheat sheet with all hooks | Experienced developers |
| **INDEX.md** | This file | Navigation |

## Features by Category

### File Transfer
```typescript
// Easy file selection
const { files, addFiles, handleDrop } = useFileTransfer();

// Resume interrupted transfers
const { sendFile, resumeTransfer, progress } = useResumableTransfer();

// Peer-to-peer encrypted transfer
const { initializeAsInitiator, sendFile } = useP2PConnection();
```

### Device Discovery
```typescript
// Find devices on network
const { devices, startDiscovery } = useUnifiedDiscovery();

// Optimize connections by NAT type
const { detectLocalNAT, strategy } = useNATOptimizedConnection();
```

### Security
```typescript
// Post-quantum encryption
const { generateKeyPair, encrypt, decrypt } = usePQCManager();

// Privacy-preserving routing
const { routeData, selectPath } = useOnionRouting();

// Persistent encrypted storage
const { createTransfer, saveChunkData } = useSecureStorage();
```

### Performance
```typescript
// Track performance metrics
const { markStart, markEnd, metrics } = usePerformance();

// Detect when elements appear
const { ref, isVisible } = useIntersectionObserver();
```

## Common Patterns

### Basic Hook Usage
```typescript
import { useMyHook } from '@/lib/hooks/use-my-hook';

function MyComponent() {
  const { state, action } = useMyHook();

  return <button onClick={action}>{state}</button>;
}
```

### With Initialization
```typescript
function MyComponent() {
  const { isReady, error, initialize } = useMyHook({
    autoInit: true,
    onReady: () => console.log('Ready!'),
  });

  if (!isReady) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return <div>Ready to use</div>;
}
```

### With Callbacks
```typescript
function MyComponent() {
  const {
    isLoading,
    data,
  } = useMyHook({
    onSuccess: (result) => {
      console.log('Success!', result);
    },
    onError: (error) => {
      console.error('Error!', error);
    },
  });

  return <div>Status: {isLoading ? 'Loading...' : 'Ready'}</div>;
}
```

## Type Definitions

Most hooks export TypeScript interfaces:

```typescript
// From each hook file
import {
  UseFileTransferOptions,      // Hook options
  FileWithData,                 // Return types
  TransferProgress,
  ReceivedFile,
} from '@/lib/hooks/use-file-transfer';
```

## Error Handling

All hooks provide error state:

```typescript
const { error, isInitialized } = useMyHook();

if (error) {
  return <ErrorMessage error={error} />;
}

if (!isInitialized) {
  return <Loading />;
}
```

## Performance Tips

1. **Lazy initialization** - Use `autoInit: false` for heavy hooks
2. **Memoize** - Use `useCallback` for handlers passed to hooks
3. **Monitor metrics** - Use `usePerformance` to measure impact
4. **Avoid loops** - Check dependency arrays in effects
5. **Clean up** - Let hooks handle cleanup on unmount

## Browser Support

| Browser | Support | Min Version |
|---------|---------|-------------|
| Chrome | ✅ Full | 90+ |
| Firefox | ✅ Full | 88+ |
| Safari | ✅ Full | 14+ |
| Edge | ✅ Full | 90+ |
| IE 11 | ❌ Not supported | - |

## Security Considerations

⚠️ **Important Security Patterns**
- **DH Key Exchange** - Validates against low-order points
- **Nonce Management** - Prevents replay attacks
- **Focus Trap** - Required for modal accessibility
- **Random Sources** - All crypto uses secure random
- **Post-Quantum** - ML-KEM-768 + X25519 hybrid

See [Security Guide](../security.md) for details.

## Troubleshooting

### Hook Not Initializing
- Check `autoInit` option
- Verify browser support
- Check console for errors

### Transfer Stalling
- Monitor connection state
- Check NAT type
- Review network conditions

### Performance Issues
- Use `usePerformance` to measure
- Check for infinite effect loops
- Monitor bundle size

### Storage Problems
- Verify IndexedDB available
- Check quota limits
- Clear expired data with cleanup

## API Reference Links

- [Transfer Hooks](./page.tsx) - Complete API for all transfer hooks
- [Discovery Hooks](./page.tsx) - Device discovery reference
- [Security Hooks](./page.tsx) - Cryptography and privacy reference
- [UI Hooks](./page.tsx) - Performance and accessibility reference

## Code Examples

Each hook includes:
- **Import statement** - How to import the hook
- **Usage example** - Real React component using the hook
- **Parameter types** - All available options
- **Return values** - Everything the hook returns
- **Common patterns** - Best practices for that hook

## Contributing

To add new hooks documentation:

1. Add hook to `hookDetails` object in `page.tsx`
2. Include all required sections (import, signature, params, return, example)
3. Add category section if needed
4. Update README.md with usage pattern
5. Add to QUICK_REFERENCE.md

## Version History

**v1.0** (February 2026)
- Initial documentation for 17 hooks
- Interactive page with sidebar
- Complete API reference
- Quick reference guide

## Support & Feedback

- Check existing documentation first
- Review README.md for patterns
- Examine source files for details
- Report issues with specific hooks

## Related Documentation

- [API Reference](../api.md)
- [Security Guide](../security.md)
- [Performance Guide](../performance.md)
- [Contributing Guide](../../CONTRIBUTING.md)

---

**Last Updated:** February 2026
**Total Hooks:** 17
**Categories:** 7
**Status:** Production Ready

Start with [Interactive Documentation](./page.tsx) or jump to [Quick Reference](./QUICK_REFERENCE.md).
