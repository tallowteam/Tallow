# Post-Quantum Cryptography Integration Guide

## Overview

Tallow now supports **post-quantum secure file transfers** using hybrid cryptography:

- **ML-KEM-768** (Kyber) - Post-quantum key encapsulation
- **X25519** - Classical elliptic curve key exchange
- **AES-256-GCM** - Symmetric encryption via Web Crypto API
- **BLAKE3** - Fast cryptographic hashing

This provides **quantum-resistant security** while maintaining compatibility with current systems.

---

## 🔐 Security Architecture

### Hybrid Key Exchange

```
┌─────────────┐                    ┌─────────────┐
│   Sender    │                    │  Receiver   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ 1. Generate Keypairs             │
       │    - ML-KEM-768                  │
       │    - X25519                      │
       │                                  │
       │ 2. Exchange Public Keys          │
       │ ──────────────────────────────>  │
       │                                  │
       │ 3. Encapsulate (Sender)          │
       │    - Kyber Encapsulation         │
       │    - X25519 ECDH                 │
       │                                  │
       │ 4. Send Ciphertext               │
       │ ──────────────────────────────>  │
       │                                  │
       │                    5. Decapsulate│
       │                       - Kyber    │
       │                       - X25519   │
       │                                  │
       │ 6. Derive Session Keys (BLAKE3)  │
       │    - Encryption Key              │
       │    - Auth Key                    │
       │                                  │
       │ 7. Transfer Encrypted File       │
       │ ──────────────────────────────>  │
       └──────────────────────────────────┘
```

### Why Hybrid?

1. **Forward Compatibility**: If quantum computers break one system, the other still protects you
2. **Best of Both Worlds**: ML-KEM-768 quantum resistance + X25519 proven security
3. **Defense in Depth**: Attacker must break BOTH systems to compromise data

---

## 📦 Installation

### 1. Install Dependencies

```bash
npm install @noble/curves @noble/hashes pqc-kyber
```

### 2. Verify Installation

```bash
npm list @noble/curves @noble/hashes pqc-kyber
```

Expected output:
```
├── @noble/curves@1.x.x
├── @noble/hashes@1.x.x
└── pqc-kyber@1.x.x
```

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { PQCTransferManager } from '@/lib/transfer/pqc-transfer-manager';

// Initialize sender
const sender = new PQCTransferManager();
await sender.initializeSession('send');

// Get public key to share
const senderPublicKey = sender.getPublicKey();

// Initialize receiver
const receiver = new PQCTransferManager();
await receiver.initializeSession('receive');
const receiverPublicKey = receiver.getPublicKey();

// Exchange keys (in your app, share these via QR code, etc.)
await sender.setPeerPublicKey(receiverPublicKey);
await receiver.setPeerPublicKey(senderPublicKey);

// Send file
const file = new File(['Hello World'], 'test.txt');
await sender.sendFile(file);
```

### Using the React Hook

```typescript
import { usePQCTransfer } from '@/lib/hooks/use-pqc-transfer';

function MyComponent() {
  const transfer = usePQCTransfer({
    onTransferComplete: (blob, filename) => {
      console.log('Received:', filename);
      // Download or process blob
    },
    onError: (error) => {
      console.error('Transfer error:', error);
    },
  });

  const handleSend = async () => {
    // Initialize as sender
    const myPublicKey = await transfer.initializeSender();

    // Share myPublicKey with receiver...

    // After receiving peer's public key:
    await transfer.setPeerPublicKey(peerPublicKey);

    // Send file
    await transfer.sendFile(selectedFile);
  };

  return (
    <div>
      <button onClick={handleSend}>Send File</button>
      {transfer.isTransferring && (
        <progress value={transfer.progress} max={100} />
      )}
    </div>
  );
}
```

---

## 🎨 UI Integration

### Option 1: Use Demo Component

```typescript
import { PQCTransferDemo } from '@/components/transfer/pqc-transfer-demo';

export default function Page() {
  return <PQCTransferDemo />;
}
```

### Option 2: Integrate into Existing App

Update `app/app/page.tsx`:

```typescript
import { usePQCTransfer } from '@/lib/hooks/use-pqc-transfer';

export default function AppPage() {
  const pqcTransfer = usePQCTransfer({
    onTransferComplete: handleFileReceived,
  });

  // Replace existing transfer logic with PQC version
  const handleStartTransfer = async () => {
    if (mode === 'send') {
      await pqcTransfer.sendFile(selectedFiles[0]);
    }
  };

  // ... rest of your component
}
```

---

## 🔧 Configuration

### Adjust Chunk Size

In `lib/crypto/file-encryption-pqc.ts`:

```typescript
const CHUNK_SIZE = 64 * 1024; // 64KB (default)
// For faster transfers on good connections:
const CHUNK_SIZE = 1024 * 1024; // 1MB
```

### Custom Key Derivation

```typescript
import { pqCrypto } from '@/lib/crypto/pqc-crypto';

// Derive custom keys
const customKeys = pqCrypto.deriveSessionKeys(sharedSecret);
// Returns: { encryptionKey, authKey, sessionId }
```

### Error Handling

```typescript
try {
  await transfer.sendFile(file);
} catch (error) {
  if (error.message.includes('hash mismatch')) {
    // File corrupted during transfer
    toast.error('Transfer failed - file corrupted');
  } else if (error.message.includes('Session not ready')) {
    // Need to exchange keys first
    toast.error('Please exchange keys first');
  } else {
    // Generic error
    toast.error('Transfer failed');
  }
}
```

---

## 🧪 Testing

### Unit Tests

Create `lib/crypto/__tests__/pqc-crypto.test.ts`:

```typescript
import { pqCrypto } from '../pqc-crypto';

describe('PQC Crypto', () => {
  it('should generate keypairs', async () => {
    const keyPair = await pqCrypto.generateHybridKeypair();
    expect(keyPair.kyberPublicKey).toBeDefined();
    expect(keyPair.x25519PublicKey).toBeDefined();
  });

  it('should perform key exchange', async () => {
    const alice = await pqCrypto.generateHybridKeypair();
    const bob = await pqCrypto.generateHybridKeypair();

    // Alice encapsulates
    const { ciphertext, sharedSecret: aliceSecret } =
      await pqCrypto.encapsulate(bob.kyberPublicKey, bob.x25519PublicKey);

    // Bob decapsulates
    const bobSecret = await pqCrypto.decapsulate(ciphertext, bob);

    // Secrets should match
    expect(aliceSecret).toEqual(bobSecret);
  });
});
```

### Integration Tests

```typescript
import { PQCTransferManager } from '../pqc-transfer-manager';

describe('PQC Transfer', () => {
  it('should transfer file end-to-end', async () => {
    const sender = new PQCTransferManager();
    const receiver = new PQCTransferManager();

    await sender.initializeSession('send');
    await receiver.initializeSession('receive');

    // Exchange keys
    await sender.setPeerPublicKey(receiver.getPublicKey());
    await receiver.setPeerPublicKey(sender.getPublicKey());

    // Transfer
    const testFile = new File(['test'], 'test.txt');
    await sender.sendFile(testFile);

    // Verify receiver got the file
    // (needs callback setup)
  });
});
```

---

## 🔍 Security Audit Checklist

- [ ] Keys generated using cryptographically secure random
- [ ] Public keys transmitted over authenticated channel
- [ ] Session keys derived properly from shared secret
- [ ] File chunks authenticated before decryption
- [ ] No plaintext data stored or logged
- [ ] Memory cleared after use (sensitive data)
- [ ] Constant-time comparisons for hashes
- [ ] Error messages don't leak sensitive info

---

## 📊 Performance

### Benchmarks (Approximate)

| Operation | Time | Notes |
|-----------|------|-------|
| Generate Keypair | ~5ms | One-time per session |
| Key Exchange | ~10ms | One-time per session |
| Encrypt 1MB file | ~50ms | Depends on device |
| Decrypt 1MB file | ~60ms | Includes verification |
| BLAKE3 hash 1MB | ~5ms | Very fast |

### Optimization Tips

1. **Large files**: Use streaming encryption
2. **Multiple files**: Reuse session keys
3. **Slow devices**: Increase chunk size to reduce overhead
4. **Fast connections**: Decrease chunk size for better progress updates

---

## 🔒 Security Considerations

### Key Storage

**NEVER** store secret keys in:
- LocalStorage
- SessionStorage
- Cookies
- Plain text files

**DO** store them in:
- Memory only (ephemeral)
- Platform secure storage if needed (future enhancement)

### Key Exchange

The public key exchange MUST happen over an authenticated channel:
- ✅ In-person QR code scan
- ✅ Over existing encrypted connection
- ✅ Signed by trusted certificate
- ❌ Plain HTTP
- ❌ Unauthenticated WebSocket

### Attack Scenarios

| Attack | Mitigation |
|--------|------------|
| Man-in-the-Middle | Authenticate public key exchange |
| File corruption | BLAKE3 verification per chunk |
| Replay attack | Include nonce in encryption |
| Side-channel | Use constant-time operations |
| Quantum computer | ML-KEM-768 provides protection |

---

## 🚨 Migration from Old Crypto

### Step 1: Add PQC alongside existing

```typescript
// Keep old password-based for compatibility
import { encryptFileWithPassword } from '@/lib/transfer/file-encryption';

// Add new PQC
import { fileEncryption } from '@/lib/crypto/file-encryption-pqc';

// Offer user choice
const method = user.prefersPQC ? 'pqc' : 'password';
```

### Step 2: Gradual rollout

```typescript
// Feature flag
const PQC_ENABLED = process.env.NEXT_PUBLIC_PQC_ENABLED === 'true';

if (PQC_ENABLED && peerSupportsPQC) {
  // Use PQC
} else {
  // Fall back to password
}
```

### Step 3: Full migration

Once all users updated, remove old crypto and use PQC exclusively.

---

## 🐛 Troubleshooting

### "Failed to load Kyber"

**Solution**: Check that `pqc-kyber` is installed:
```bash
npm install pqc-kyber
```

### "Session not ready"

**Solution**: Exchange public keys first:
```typescript
await transfer.setPeerPublicKey(peerKey);
```

### "Hash mismatch"

**Solution**: File corrupted during transfer. Implement retry logic.

### Performance issues

**Solution**:
- Reduce chunk size for better perceived performance
- Use Web Workers for encryption (future enhancement)

---

## 📚 References

- [ML-KEM (Kyber) Specification](https://csrc.nist.gov/pubs/fips/203/final)
- [X25519 RFC](https://www.rfc-editor.org/rfc/rfc7748)
- [BLAKE3 Specification](https://github.com/BLAKE3-team/BLAKE3-specs)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

## 🤝 Contributing

When adding features:
1. Maintain backward compatibility
2. Add tests for new crypto operations
3. Update this documentation
4. Run security audit checklist

---

## 📄 License

Same as parent project (MIT)
