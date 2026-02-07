# React Hook Wrappers

This directory contains React hook wrappers for Tallow's core library modules. These hooks provide React-friendly APIs with automatic state management and cleanup.

## New Library Wrappers

### 1. `useScreenCapture` - Screen Sharing Hook

Wraps `lib/webrtc/screen-sharing.ts` as a React hook.

**Features:**
- State management for capture status
- Automatic cleanup on unmount
- Quality and framerate controls
- PQC protection status tracking

**Example:**
```tsx
import { useScreenCapture } from '@/lib/hooks';

function ScreenShareComponent() {
  const {
    isCapturing,
    stream,
    error,
    startCapture,
    stopCapture,
    updateQuality
  } = useScreenCapture({
    quality: '1080p',
    shareAudio: false
  });

  const handleStart = async () => {
    const capturedStream = await startCapture();
    if (capturedStream) {
      videoRef.current.srcObject = capturedStream;
    }
  };

  return (
    <div>
      {isCapturing ? (
        <button onClick={stopCapture}>Stop Sharing</button>
      ) : (
        <button onClick={handleStart}>Start Sharing</button>
      )}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### 2. `useSecureStorage` - Encrypted IndexedDB Hook

Wraps `lib/storage/transfer-state-db.ts` for persistent storage.

**Features:**
- Transfer metadata management
- Chunk storage and tracking
- Resumable transfer support
- Auto-initialization

**Example:**
```tsx
import { useSecureStorage } from '@/lib/hooks';

function TransferManager() {
  const {
    isReady,
    createTransfer,
    saveChunkData,
    getResumable
  } = useSecureStorage();

  const handleNewTransfer = async () => {
    await createTransfer(
      transferId,
      fileName,
      fileType,
      fileSize,
      fileHash,
      chunkSize,
      peerId,
      'send'
    );
  };

  const loadResumable = async () => {
    const transfers = await getResumable();
    console.log('Resumable transfers:', transfers);
  };

  return (
    <div>
      {isReady ? (
        <button onClick={handleNewTransfer}>Create Transfer</button>
      ) : (
        <p>Initializing storage...</p>
      )}
    </div>
  );
}
```

### 3. `usePQCManager` - Post-Quantum Cryptography Hook

Wraps `lib/crypto/pqc-crypto.ts` for hybrid PQC operations.

**Features:**
- Lazy initialization
- ML-KEM-768 + X25519 hybrid crypto
- Session key derivation
- Encryption/decryption with AES-256-GCM

**Example:**
```tsx
import { usePQCManager } from '@/lib/hooks';

function SecureTransfer() {
  const {
    isInitialized,
    generateKeyPair,
    encapsulate,
    encrypt,
    decrypt
  } = usePQCManager();

  const handleGenerateKeys = async () => {
    const keyPair = await generateKeyPair();
    console.log('Generated PQC keypair:', keyPair);
  };

  const handleEncrypt = async (data: Uint8Array, key: Uint8Array) => {
    const encrypted = await encrypt(data, key);
    if (encrypted) {
      console.log('Encrypted:', encrypted);
    }
  };

  return (
    <div>
      {isInitialized ? (
        <button onClick={handleGenerateKeys}>Generate Keys</button>
      ) : (
        <p>Initializing PQC...</p>
      )}
    </div>
  );
}
```

## Design Principles

All hooks follow these principles:

1. **Thin Wrappers** - Delegate to underlying modules, don't duplicate logic
2. **'use client' Directive** - All hooks are client-side only
3. **Automatic Cleanup** - Use `useEffect` cleanup functions
4. **Error Handling** - Return errors in state, don't throw
5. **TypeScript** - Full type safety with exported interfaces
6. **NO Direct Zustand Access** - Use `.getState()` in plain functions to avoid Turbopack infinite loops

## State Management Pattern

```tsx
const [state, setState] = useState(initialState);
const managerRef = useRef<ManagerClass | null>(null);

useEffect(() => {
  // Initialize manager
  managerRef.current = new ManagerClass();

  // Cleanup
  return () => {
    managerRef.current?.dispose();
  };
}, []);

const someMethod = useCallback(async () => {
  if (!managerRef.current) {
    setError('Not initialized');
    return null;
  }

  try {
    return await managerRef.current.doSomething();
  } catch (error) {
    setError(error.message);
    return null;
  }
}, []);
```

## Import Patterns

```tsx
// Individual import
import { useScreenCapture } from '@/lib/hooks/use-screen-capture';

// From index (recommended)
import { useScreenCapture, useSecureStorage, usePQCManager } from '@/lib/hooks';
```

## Testing

These hooks can be tested with React Testing Library:

```tsx
import { renderHook, act } from '@testing-library/react';
import { useScreenCapture } from '@/lib/hooks';

test('useScreenCapture initializes correctly', () => {
  const { result } = renderHook(() => useScreenCapture());

  expect(result.current.isCapturing).toBe(false);
  expect(result.current.stream).toBeNull();
});

test('useScreenCapture starts capture', async () => {
  const { result } = renderHook(() => useScreenCapture());

  await act(async () => {
    await result.current.startCapture();
  });

  expect(result.current.isCapturing).toBe(true);
});
```

## Files

- `use-screen-capture.ts` - Screen sharing hook
- `use-secure-storage.ts` - Encrypted storage hook
- `use-pqc-manager.ts` - Post-quantum cryptography hook
- `index.ts` - Central export hub

## Related Documentation

- Screen Sharing: `lib/webrtc/screen-sharing.ts`
- Storage: `lib/storage/transfer-state-db.ts`
- PQC Crypto: `lib/crypto/pqc-crypto.ts`
