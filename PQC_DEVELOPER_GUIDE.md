# PQC Integration - Developer Quick Reference

## Quick Start

### 1. Add PQC Status Badge to Any Component

```tsx
import { PQCStatusBadge } from '@/components/ui/pqc-status-badge';

function MyComponent({ pqcManager }) {
  const isPQCProtected = pqcManager?.isReady() ?? false;

  return (
    <div>
      <h2>My Feature</h2>
      <PQCStatusBadge isProtected={isPQCProtected} />
    </div>
  );
}
```

### 2. Auto-Connect PQC for Screen Sharing

```tsx
import { ScreenShare } from '@/components/app/ScreenShare';
import { PQCTransferManager } from '@/lib/transfer/pqc-transfer-manager';

function MyScreenShareFeature() {
  const [pqcManager] = useState(() => new PQCTransferManager());
  const [peerConnection] = useState(() => new RTCPeerConnection());

  useEffect(() => {
    // Initialize PQC when P2P connection is ready
    if (peerConnection.connectionState === 'connected') {
      pqcManager.initializeSession('send').then(() => {
        pqcManager.startKeyExchange();
      });
    }
  }, [peerConnection.connectionState]);

  return (
    <ScreenShare
      peerConnection={peerConnection}
      pqcManager={pqcManager}
      onStreamReady={(stream) => console.log('Ready with PQC')}
    />
  );
}
```

### 3. Integrate PQC with Chat

```tsx
import { ChatPanel } from '@/components/app/ChatPanel';

function MyChatFeature({ pqcManager }) {
  const isPQCReady = pqcManager?.isReady() ?? false;

  return (
    <ChatPanel
      // ... other props
      isPQCProtected={isPQCReady}
      onSendMessage={async (content) => {
        // Messages automatically encrypted with PQC session keys
        await chat.sendMessage(content);
      }}
    />
  );
}
```

### 4. Group Transfer with PQC

```tsx
import { GroupTransferProgress } from '@/components/app/GroupTransferProgress';

function MyGroupTransfer({ groupState, pqcManager }) {
  return (
    <GroupTransferProgress
      groupState={groupState}
      isPQCProtected={pqcManager?.isReady()}
      onRecipientNameLookup={(id) => getDeviceName(id)}
    />
  );
}
```

## Badge Components Reference

### PQCStatusBadge

Main status indicator for PQC protection.

```tsx
<PQCStatusBadge
  isProtected={true}           // Required: PQC active?
  label="Custom Label"         // Optional: override default label
  compact={false}              // Optional: icon-only mode
  className="my-custom-class"  // Optional: additional CSS
  algorithm="ML-KEM-768 + X25519" // Optional: override algorithm name
  showWarning={false}          // Optional: show red warning if not protected
/>
```

**Props:**
- `isProtected: boolean` - Whether PQC encryption is active
- `label?: string` - Custom label text (default: "Quantum-Resistant")
- `compact?: boolean` - Show icon only (default: false)
- `className?: string` - Additional CSS classes
- `algorithm?: string` - Algorithm name (default: "ML-KEM-768 + X25519")
- `showWarning?: boolean` - Show warning style if not protected

**Variants:**
- Protected: Green shield + "Quantum-Resistant"
- Not Protected: Yellow shield + "Standard Encryption"
- Warning: Red shield + "No PQC Protection"

### PQCAlgorithmBadge

Shows specific cryptographic algorithm.

```tsx
<PQCAlgorithmBadge
  algorithm="ML-KEM-768"    // Options: ML-KEM-768, ML-DSA-65, SLH-DSA, Hybrid
  compact={false}           // Icon-only mode
  className="custom-class"
/>
```

**Available Algorithms:**
- `ML-KEM-768`: Key Encapsulation Mechanism
- `ML-DSA-65`: Digital Signature Algorithm
- `SLH-DSA`: Hash-based Signatures
- `Hybrid`: ML-KEM-768 + X25519 combined

### PQCFeatureBadgeGroup

Shows multiple PQC features at once.

```tsx
<PQCFeatureBadgeGroup
  features={{
    keyExchange: true,      // Show Hybrid KEM badge
    signatures: true,       // Show ML-DSA-65 badge
    encryption: true,       // Show AES-256-GCM badge
    forwardSecrecy: true,   // Show Forward Secrecy badge
  }}
  compact={false}
  className="custom-class"
/>
```

## PQCTransferManager API

### Initialization

```typescript
const manager = new PQCTransferManager();

// Initialize session (call before use)
await manager.initializeSession('send'); // or 'receive'

// Set data channel
manager.setDataChannel(rtcDataChannel);

// Start key exchange (sender only)
manager.startKeyExchange();
```

### Check Status

```typescript
// Check if PQC session is ready
const isReady = manager.isReady();

// Get session info
const session = manager.getSessionInfo();

// Get shared secret for verification
const secret = manager.getSharedSecret();
```

### Event Handlers

```typescript
// Session ready (PQC key exchange complete)
manager.onSessionReady(() => {
  console.log('PQC encryption active');
});

// File incoming
manager.onFileIncoming((metadata) => {
  console.log('Receiving file:', metadata.size);
});

// Progress updates
manager.onProgress((progress) => {
  console.log('Progress:', progress + '%');
});

// Transfer complete
manager.onComplete((blob, filename) => {
  console.log('Received:', filename);
});

// Verification ready
manager.onVerificationReady((sharedSecret) => {
  // Show SAS verification dialog
});

// Errors
manager.onError((error) => {
  console.error('PQC error:', error);
});
```

### Send Files

```typescript
// Send single file
await manager.sendFile(file);

// Send file with folder path (for folder transfers)
await manager.sendFile(file, 'folder/subfolder/file.txt');
```

### Cleanup

```typescript
// Always destroy when done (wipes sensitive data)
manager.destroy();
```

## Integration Patterns

### Pattern 1: Feature with PQC Auto-Connection

```tsx
function FeatureWithPQC() {
  const pqcManagerRef = useRef<PQCTransferManager | null>(null);
  const [isPQCReady, setIsPQCReady] = useState(false);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);

  useEffect(() => {
    if (!dataChannel) return;

    const initPQC = async () => {
      const manager = new PQCTransferManager();
      await manager.initializeSession('send');
      manager.setDataChannel(dataChannel);

      manager.onSessionReady(() => {
        setIsPQCReady(true);
      });

      manager.startKeyExchange();
      pqcManagerRef.current = manager;
    };

    initPQC();

    return () => {
      pqcManagerRef.current?.destroy();
    };
  }, [dataChannel]);

  return (
    <div>
      <PQCStatusBadge isProtected={isPQCReady} />
      {/* Your feature UI */}
    </div>
  );
}
```

### Pattern 2: Conditional PQC Display

```tsx
function FeatureWithConditionalPQC({ pqcManager }) {
  const isPQCReady = pqcManager?.isReady() ?? false;

  return (
    <div>
      <h2>My Feature</h2>

      {/* Only show badge if PQC is relevant */}
      {pqcManager && (
        <PQCStatusBadge
          isProtected={isPQCReady}
          showWarning={!isPQCReady}
        />
      )}

      {/* Privacy notice with PQC context */}
      <p className={isPQCReady ? 'text-green-600' : 'text-yellow-600'}>
        {isPQCReady
          ? 'Protected with quantum-resistant encryption'
          : 'Standard encryption (not quantum-resistant)'}
      </p>
    </div>
  );
}
```

### Pattern 3: Multiple PQC Indicators

```tsx
function AdvancedFeature({ pqcManager }) {
  const session = pqcManager?.getSessionInfo();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3>Secure Transfer</h3>
          <PQCStatusBadge isProtected={!!session} compact />
        </div>
      </CardHeader>

      <CardContent>
        {session && (
          <PQCFeatureBadgeGroup
            features={{
              keyExchange: true,
              encryption: true,
              forwardSecrecy: !!session.keyRotation,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
```

## Console Warning Pattern

Add warnings for non-PQC operations:

```typescript
function startOperation(peerConnection: RTCPeerConnection, pqcManager?: PQCTransferManager) {
  // Check PQC status
  const isPQCProtected = pqcManager?.isReady() ?? false;

  // Warn if not protected
  if (!isPQCProtected) {
    console.warn(
      '[MyFeature] Starting without PQC protection. ' +
      'Consider establishing PQC connection first for quantum-resistant security.'
    );
  }

  // Proceed with operation
  // ...
}
```

## Common Use Cases

### Use Case 1: Screen Sharing Button

```tsx
function ScreenShareButton({ peerConnection, pqcManager }) {
  const isPQCReady = pqcManager?.isReady() ?? false;

  const handleStartSharing = async () => {
    if (!isPQCReady) {
      // Auto-establish PQC first
      await pqcManager?.initializeSession('send');
      await pqcManager?.startKeyExchange();

      // Wait for PQC ready
      await new Promise(resolve => {
        pqcManager?.onSessionReady(resolve);
      });
    }

    // Now start screen sharing with PQC protection
    // ...
  };

  return (
    <Button onClick={handleStartSharing}>
      <Monitor className="w-4 h-4 mr-2" />
      Share Screen
      {isPQCReady && (
        <ShieldCheck className="w-4 h-4 ml-2 text-green-500" />
      )}
    </Button>
  );
}
```

### Use Case 2: Transfer Status Display

```tsx
function TransferStatus({ transfer, pqcManager }) {
  return (
    <div className="flex items-center gap-2">
      <span>Transferring...</span>
      <Progress value={transfer.progress} />
      <PQCStatusBadge
        isProtected={pqcManager?.isReady()}
        compact
      />
      <PQCAlgorithmBadge algorithm="ML-KEM-768" compact />
    </div>
  );
}
```

### Use Case 3: Security Settings Panel

```tsx
function SecuritySettings({ pqcManager }) {
  const session = pqcManager?.getSessionInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection Security</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span>PQC Protection</span>
            <PQCStatusBadge
              isProtected={!!session}
              label={session ? 'Active' : 'Inactive'}
            />
          </div>

          {/* Details */}
          {session && (
            <>
              <div className="flex items-center justify-between">
                <span>Algorithm</span>
                <PQCAlgorithmBadge algorithm="Hybrid" />
              </div>

              <div className="flex items-center justify-between">
                <span>Key Rotation</span>
                <Badge variant="secondary">
                  {session.keyRotation ? 'Enabled (5 min)' : 'Disabled'}
                </Badge>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## TypeScript Types

```typescript
// PQC Status Badge Props
interface PQCStatusBadgeProps {
  isProtected: boolean;
  label?: string;
  compact?: boolean;
  className?: string;
  algorithm?: string;
  showWarning?: boolean;
}

// PQC Algorithm Badge Props
interface PQCAlgorithmBadgeProps {
  algorithm?: 'ML-KEM-768' | 'ML-DSA-65' | 'SLH-DSA' | 'Hybrid';
  compact?: boolean;
  className?: string;
}

// PQC Feature Badge Group Props
interface PQCFeatureBadgeGroupProps {
  features: {
    keyExchange?: boolean;
    signatures?: boolean;
    encryption?: boolean;
    forwardSecrecy?: boolean;
  };
  compact?: boolean;
  className?: string;
}

// PQC Session Info
interface PQCTransferSession {
  sessionId: string;
  mode: 'send' | 'receive';
  status: 'pending' | 'negotiating' | 'transferring' | 'completed' | 'failed';
  ownKeys: HybridKeyPair;
  peerPublicKey?: HybridPublicKey;
  sharedSecret?: Uint8Array;
  sessionKeys?: SessionKeys;
  keyRotation?: KeyRotationManager;
  rotatingKeys?: RotatingSessionKeys;
}
```

## Styling Customization

### Custom Colors

```tsx
<PQCStatusBadge
  isProtected={true}
  className="bg-purple-600 hover:bg-purple-700" // Custom color
/>
```

### Custom Size

```tsx
<PQCStatusBadge
  isProtected={true}
  className="text-lg px-3 py-1" // Larger badge
  compact={false}
/>
```

### Custom Icon

```tsx
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

<Badge variant="default" className="gap-1 bg-green-600">
  <ShieldCheck className="w-4 h-4" />
  Custom PQC Badge
</Badge>
```

## Testing Utilities

### Mock PQC Manager

```typescript
// For testing components that use PQC
const mockPQCManager = {
  isReady: () => true,
  getSessionInfo: () => ({
    sessionId: 'test-session',
    status: 'transferring',
    // ... other fields
  }),
  getSharedSecret: () => new Uint8Array(32),
  destroy: () => {},
};

// Use in tests
render(<MyComponent pqcManager={mockPQCManager} />);
```

### Test PQC Status Changes

```typescript
test('shows PQC badge when ready', async () => {
  const { rerender } = render(
    <MyComponent pqcManager={{ isReady: () => false }} />
  );

  // Initially not ready
  expect(screen.queryByText(/quantum-resistant/i)).not.toBeInTheDocument();

  // Update to ready
  rerender(<MyComponent pqcManager={{ isReady: () => true }} />);

  // Should show badge
  expect(screen.getByText(/quantum-resistant/i)).toBeInTheDocument();
});
```

## Troubleshooting

### Badge Not Showing

**Problem:** PQC badge doesn't appear
**Solution:** Check that:
1. `pqcManager` prop is passed correctly
2. `isReady()` returns true (key exchange complete)
3. Component re-renders when PQC status changes

### Warning Not Displayed

**Problem:** Console warning not logged
**Solution:** Ensure:
1. Check runs before operation starts
2. `console.warn` not filtered in browser DevTools
3. Production build includes warnings

### Tooltip Not Working

**Problem:** Tooltip doesn't show on hover
**Solution:** Verify:
1. `TooltipProvider` wraps badge component
2. No CSS `pointer-events: none` on parent
3. Tooltip content imported correctly

## Best Practices

1. **Always Destroy PQC Manager**: Call `manager.destroy()` in cleanup to wipe sensitive data
2. **Check Ready State**: Use `isReady()` before operations
3. **Show Warnings**: Help users understand when PQC isn't active
4. **Consistent Placement**: Put badges in headers/titles for visibility
5. **Accessibility**: Don't rely only on color; use icons + text
6. **Error Handling**: Handle PQC initialization failures gracefully
7. **Documentation**: Comment why PQC is needed for each feature

## Resources

- **PQC Manager Docs**: `lib/transfer/pqc-transfer-manager.ts`
- **Badge Components**: `components/ui/pqc-status-badge.tsx`
- **Example Integration**: `app/screen-share-demo/page.tsx`
- **Full Documentation**: `PQC_INTEGRATION_COMPLETE.md`

## Support

For questions or issues:
1. Check console warnings for PQC-related messages
2. Review example integrations in existing components
3. Test with PQC demo page first
4. Verify PQC manager initialization flow

---

**Quick Tip**: Start with `PQCStatusBadge` for basic integration, then add `PQCAlgorithmBadge` for detailed displays.
