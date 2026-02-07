# Hooks Quick Reference Card

## All Hooks at a Glance

### Transfer Hooks
```
useFileTransfer()
├─ files: FileWithData[]
├─ addFiles, removeFile, clearFiles
├─ handleDragOver, handleDrop
└─ getTotalSize, getFileById

useResumableTransfer(options?)
├─ isTransferring, progress, sessionReady
├─ initializeSender, initializeReceiver
├─ sendFile, resumeTransfer
└─ autoResumeEnabled, autoResumeCountdown

useP2PConnection()
├─ state.isConnected, state.verificationPending
├─ initializeAsInitiator, acceptConnection
├─ sendFile, sendFiles, downloadReceivedFile
└─ confirmVerification, failVerification
```

### Discovery Hooks
```
useUnifiedDiscovery(options?)
├─ devices: UnifiedDevice[]
├─ startDiscovery, stopDiscovery, refresh
├─ isDiscovering, isMdnsAvailable, isSignalingConnected
└─ getBestConnectionMethod, advertise

useNATOptimizedConnection(options?)
├─ localNAT, remoteNAT, strategy
├─ detectLocalNAT, setRemoteNAT
├─ shouldUseTURN, bestTURNServer
└─ recordConnectionSuccess, recordConnectionFailure
```

### Chat Hooks
```
useChatIntegration(options)
├─ chatManager: ChatManager | null
├─ isReady, unreadCount
└─ resetUnreadCount

useChatVisibility()
├─ isChatOpen, unreadCount
├─ openChat, closeChat, toggleChat
└─ incrementUnread
```

### Security Hooks
```
useOnionRouting(initialConfig?)
├─ isAvailable, isInitialized, isLoading
├─ config, stats, relayNodes
├─ routeData, selectPath, refreshRelays
└─ closeCircuit

usePQCManager(options?)
├─ isInitialized, error
├─ generateKeyPair, encapsulate, decapsulate
├─ encrypt, decrypt, hash, mac
└─ randomBytes, serializePublicKey

useSecureStorage(options?)
├─ isReady, error
├─ createTransfer, getTransfer, updateTransfer
├─ saveChunkData, getChunkData, getResumable
└─ removeTransfer, cleanupExpired, getStats
```

### Media Hooks
```
useScreenCapture(options?)
├─ isCapturing, isPaused, stream
├─ startCapture, stopCapture
├─ pauseCapture, resumeCapture
├─ updateQuality, updateFrameRate
└─ toggleAudio, markAsPQCProtected
```

### UI Hooks
```
usePerformance(options?)
├─ markStart, markEnd, measure
├─ metrics: PerformanceMetric[]
└─ longTasks: PerformanceEntry[]

useIntersectionObserver<T>(options?)
├─ ref: React.Ref<T>
├─ isIntersecting, hasIntersected
└─ isVisible

useKeyboardShortcut(id, shortcut)
├─ Registers shortcut with:
│  ├─ key, ctrlKey, shiftKey, handler
│  └─ Auto-cleanup on unmount
└─ (No return value)

useNotifications()
├─ notify, success, error, warning, info
├─ notifyTransferStarted, notifyTransferComplete
├─ notifyConnectionEstablished, notifyConnectionLost
└─ requestPermission, isBrowserNotificationsAvailable
```

### Utility Hooks
```
useFocusTrap(containerRef, enabled?)
├─ Traps focus within container
├─ Restores focus on unmount
└─ (No return value)
```

## Import Statements

```typescript
// Transfer
import { useFileTransfer } from '@/lib/hooks/use-file-transfer';
import { useResumableTransfer } from '@/lib/hooks/use-resumable-transfer';
import { useP2PConnection } from '@/lib/hooks/use-p2p-connection';

// Discovery
import { useUnifiedDiscovery, useMdnsDiscovery, useSignalingDiscovery } from '@/lib/hooks/use-unified-discovery';
import { useNATOptimizedConnection } from '@/lib/hooks/use-nat-optimized-connection';

// Chat
import { useChatIntegration, useChatVisibility } from '@/lib/hooks/use-chat-integration';

// Security
import { useOnionRouting, useOnionRoutingMode, useRelaySelection, useOnionStats } from '@/lib/hooks/use-onion-routing';
import { usePQCManager } from '@/lib/hooks/use-pqc-manager';
import { useSecureStorage } from '@/lib/hooks/use-secure-storage';

// Media
import { useScreenCapture } from '@/lib/hooks/use-screen-capture';

// UI
import { usePerformance, useRenderTime, useAsyncTiming, useIdleCallback, useIntersectionLoad } from '@/lib/hooks/use-performance';
import { useIntersectionObserver, useStaggeredIntersectionObserver, useReducedMotion } from '@/lib/hooks/use-intersection-observer';
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut';
import { useNotifications } from '@/lib/hooks/use-notifications';

// Utility
import { useFocusTrap } from '@/lib/accessibility/use-focus-trap';
```

## Common Patterns

### File Transfer
```typescript
const { files, addFiles, handleDrop } = useFileTransfer();
```

### Resumable Transfer
```typescript
const { sendFile, progress, isTransferring } = useResumableTransfer({
  onTransferComplete: (blob, filename) => { /* handle */ },
  onError: (error) => { /* handle */ }
});
```

### P2P Connection
```typescript
const { initializeAsInitiator, acceptConnection, sendFile } = useP2PConnection();
const offer = await initializeAsInitiator();
// Share offer...
const answer = await acceptConnection(offer);
// Send answer...
await sendFile(file);
```

### Device Discovery
```typescript
const { devices, isDiscovering, startDiscovery } = useUnifiedDiscovery({
  autoStart: true,
  enableMdns: true,
  enableSignaling: true
});
```

### NAT Optimization
```typescript
const { localNAT, strategy, shouldUseTURN } = useNATOptimizedConnection({
  autoDetectNAT: true,
  enableTURNHealth: true
});
```

### Secure Chat
```typescript
const { chatManager, isReady, unreadCount } = useChatIntegration({
  dataChannel,
  sessionKeys,
  currentUserId,
  currentUserName
});
```

### Onion Routing
```typescript
const { isAvailable, routeData, selectPath } = useOnionRouting({
  mode: 'multi-hop'
});
```

### Post-Quantum Crypto
```typescript
const { generateKeyPair, encrypt, decrypt } = usePQCManager({
  autoInit: true
});
```

### Secure Storage
```typescript
const { createTransfer, saveChunkData, getResumable } = useSecureStorage({
  autoInit: true
});
```

### Screen Capture
```typescript
const { startCapture, stream, quality } = useScreenCapture({
  quality: '1080p',
  frameRate: 30,
  shareAudio: false
});
```

### Performance
```typescript
const { markStart, markEnd, metrics } = usePerformance({
  trackWebVitals: true
});
```

### Intersection Observer
```typescript
const { ref, isVisible } = useIntersectionObserver({
  threshold: 0.2,
  triggerOnce: true
});
```

### Keyboard Shortcuts
```typescript
useKeyboardShortcut('save', {
  key: 's',
  ctrlKey: true,
  handler: () => save()
});
```

### Notifications
```typescript
const { notify, notifyTransferComplete } = useNotifications();
notify({ message: 'Hello', variant: 'success' });
notifyTransferComplete('file.pdf', 'received');
```

### Focus Trap
```typescript
const modalRef = useRef(null);
useFocusTrap(modalRef, isOpen);
```

## Type Definitions

### Key Types
```typescript
// FileWithData
interface FileWithData extends FileInfo {
  file: File;
}

// P2PConnectionState
interface P2PConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionCode: string;
  peerId: string | null;
  verificationPending: boolean;
  verificationSession: VerificationSession | null;
}

// UnifiedDevice
interface UnifiedDevice {
  id: string;
  name: string;
  source: 'mdns' | 'signaling';
  capabilities?: DeviceCapabilities;
  hasMdns: boolean;
  hasSignaling: boolean;
}

// HybridKeyPair (PQC)
interface HybridKeyPair {
  publicKey: HybridPublicKey;
  secretKey: Uint8Array;
}

// TransferMetadata (Storage)
interface TransferMetadata {
  transferId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileHash: Uint8Array;
  direction: 'send' | 'receive';
  peerId: string;
  createdAt: Date;
  lastUpdated: Date;
}
```

## Error Handling

```typescript
// Check initialization
if (!isInitialized) {
  return <p>Loading...</p>;
}

// Check errors
if (error) {
  return <p>Error: {error.message || error}</p>;
}

// Try-catch for async operations
try {
  await sendFile(file);
} catch (error) {
  console.error('Failed:', error);
}
```

## Performance Tips

1. **Memoize callbacks** - Pass to hook callbacks in dependencies
2. **Avoid re-initialization** - Use autoInit where available
3. **Clean up effects** - Hooks do this automatically
4. **Check before using** - Verify isReady/isInitialized
5. **Handle errors** - All hooks provide error state

## Security Notes

⚠️ **Important Patterns**
- DH key exchange validates against low-order points
- Nonce management prevents replay attacks
- Focus trap required for modal accessibility
- All crypto uses secure random sources
- Onion routing for IP privacy
- Post-quantum algorithms for future-proofing

## Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
❌ IE 11

## Troubleshooting Quick Links

- **Hooks not initializing?** - Check autoInit option
- **Transfer stalling?** - Monitor connection state
- **High CPU usage?** - Check for infinite effect loops
- **Storage errors?** - Verify IndexedDB is available
- **Focus issues?** - Use useFocusTrap for modals
- **Performance slow?** - Use usePerformance to measure

## Related Docs

- Full documentation: `/docs/hooks`
- API reference: `/docs/api`
- Security guide: `/docs/security`
- Performance tips: `/docs/performance`

---

**Last Updated:** February 2026
**Version:** 1.0
**Status:** Production Ready
