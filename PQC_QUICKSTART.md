# 🚀 Post-Quantum Crypto - Quick Start Guide

## ✅ Installation Complete!

The following PQC (Post-Quantum Cryptography) components have been added to Tallow:

### 📁 New Files Created

```
Tallow/
├── lib/
│   ├── crypto/
│   │   ├── pqc-crypto.ts              ← Core PQC service
│   │   └── file-encryption-pqc.ts     ← File encryption with PQC
│   ├── transfer/
│   │   └── pqc-transfer-manager.ts    ← Transfer orchestration
│   └── hooks/
│       └── use-pqc-transfer.ts        ← React hook for easy integration
├── components/
│   └── transfer/
│       └── pqc-transfer-demo.tsx      ← Demo component
├── app/
│   └── pqc-test/
│       └── page.tsx                   ← Test page
├── PQC_INTEGRATION.md                 ← Full documentation
└── PQC_QUICKSTART.md                  ← This file
```

---

## 🔧 Installation Steps

### 1. Install Dependencies

```bash
cd Tallow
npm install @noble/curves @noble/hashes pqc-kyber
```

### 2. Verify Installation

```bash
npm run dev
```

The app should start without errors. Navigate to:
- http://localhost:3000/pqc-test - Test page

---

## 🎯 Quick Usage Examples

### Example 1: Basic PQC Transfer

```typescript
import { pqCrypto } from '@/lib/crypto/pqc-crypto';

// Generate keypair
const keyPair = await pqCrypto.generateHybridKeypair();

// Serialize for sharing
const publicKey = pqCrypto.serializePublicKey(keyPair);

// Share publicKey with peer...
```

### Example 2: Using React Hook

```typescript
'use client';

import { usePQCTransfer } from '@/lib/hooks/use-pqc-transfer';
import { Button } from '@/components/ui/button';

export function MyTransferComponent() {
  const transfer = usePQCTransfer({
    onTransferComplete: (blob, filename) => {
      console.log('Received:', filename);
      // Download blob
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    },
  });

  const handleSend = async () => {
    // 1. Initialize
    const myKey = await transfer.initializeSender();
    console.log('Share this key:', myKey);

    // 2. Get peer's key (from user input/QR code)
    const peerKey = prompt('Enter peer key:');
    await transfer.setPeerPublicKey(peerKey);

    // 3. Select file
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await transfer.sendFile(file);
      }
    };
    input.click();
  };

  return (
    <div>
      <Button onClick={handleSend}>Send with PQC</Button>
      {transfer.isTransferring && (
        <p>Progress: {transfer.progress.toFixed(0)}%</p>
      )}
    </div>
  );
}
```

### Example 3: File Encryption Only

```typescript
import { fileEncryption } from '@/lib/crypto/file-encryption-pqc';
import { pqCrypto } from '@/lib/crypto/pqc-crypto';

// Encrypt file
const key = pqCrypto.randomBytes(32);
const encrypted = await fileEncryption.encrypt(file, key);

// Later, decrypt
const decrypted = await fileEncryption.decrypt(encrypted, key);
```

---

## 🧪 Testing Your Integration

### Test 1: Crypto Functions

```typescript
import { pqCrypto } from '@/lib/crypto/pqc-crypto';

async function testCrypto() {
  console.log('Testing PQC crypto...');

  // Test keypair generation
  const keyPair = await pqCrypto.generateHybridKeypair();
  console.log('✓ Keypair generated');

  // Test key exchange
  const alice = await pqCrypto.generateHybridKeypair();
  const bob = await pqCrypto.generateHybridKeypair();

  const { ciphertext, sharedSecret: aliceSecret } = await pqCrypto.encapsulate(
    bob.kyberPublicKey,
    bob.x25519PublicKey
  );
  console.log('✓ Encapsulation complete');

  const bobSecret = await pqCrypto.decapsulate(ciphertext, bob);
  console.log('✓ Decapsulation complete');

  // Verify secrets match
  const match = pqCrypto.constantTimeEqual(aliceSecret, bobSecret);
  console.log('✓ Secrets match:', match);

  return match;
}

testCrypto();
```

### Test 2: File Encryption

```typescript
import { fileEncryption } from '@/lib/crypto/file-encryption-pqc';
import { pqCrypto } from '@/lib/crypto/pqc-crypto';

async function testFileEncryption() {
  // Create test file
  const testFile = new File(['Hello, World!'], 'test.txt', {
    type: 'text/plain',
  });

  // Encrypt
  const key = pqCrypto.randomBytes(32);
  const encrypted = await fileEncryption.encrypt(testFile, key);
  console.log('✓ File encrypted');

  // Decrypt
  const decrypted = await fileEncryption.decrypt(encrypted, key);
  console.log('✓ File decrypted');

  // Verify
  const text = await decrypted.text();
  console.log('✓ Content matches:', text === 'Hello, World!');

  return text === 'Hello, World!';
}

testFileEncryption();
```

### Test 3: Visit Test Page

Navigate to: **http://localhost:3000/pqc-test**

This page provides an interactive demo where you can:
1. Test sender/receiver roles
2. Exchange keys
3. Send test files
4. Verify encryption works end-to-end

---

## 🔗 Integration with Existing App

### Option 1: Add PQC Toggle to Main App

Edit `app/app/page.tsx`:

```typescript
import { usePQCTransfer } from '@/lib/hooks/use-pqc-transfer';
import { useState } from 'react';

export default function AppPage() {
  const [usePQC, setUsePQC] = useState(false);

  const pqcTransfer = usePQCTransfer({
    onTransferComplete: (blob, filename) => {
      // Handle received file
      downloadFile(blob, filename);
    },
  });

  // Add toggle in UI
  return (
    <div>
      {/* Existing UI... */}

      <label>
        <input
          type="checkbox"
          checked={usePQC}
          onChange={(e) => setUsePQC(e.target.checked)}
        />
        Use Post-Quantum Encryption
      </label>

      {usePQC && (
        <div>
          {/* PQC-specific UI */}
          <button onClick={() => pqcTransfer.initializeSender()}>
            Initialize PQC Sender
          </button>
          {/* ... */}
        </div>
      )}
    </div>
  );
}
```

### Option 2: Add Link to Test Page

Edit `app/app/page.tsx` or your nav component:

```typescript
import Link from 'next/link';
import { Shield } from 'lucide-react';

// Add to your navigation
<Link href="/pqc-test">
  <Button variant="outline">
    <Shield className="w-4 h-4 mr-2" />
    PQC Test
  </Button>
</Link>
```

### Option 3: Replace Existing Crypto

For complete migration, replace old crypto imports:

```typescript
// Old
import { encryptFileWithPassword } from '@/lib/transfer/file-encryption';

// New
import { fileEncryption } from '@/lib/crypto/file-encryption-pqc';
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Exchange public keys over authenticated channels (QR code, existing encrypted connection)
- Verify key fingerprints when possible
- Use unique sessions for each transfer
- Clear sensitive data from memory after use

### ❌ DON'T:
- Store secret keys in localStorage/cookies
- Share secret keys (only public keys)
- Reuse session keys across transfers
- Trust unauthenticated key exchange

---

## 📊 Performance Tuning

### For Large Files (>100MB):

```typescript
// Use streaming encryption
const stream = fileEncryption.streamEncrypt(largeFile, encryptionKey);

for await (const chunk of stream) {
  // Send chunk immediately
  sendChunk(chunk);
}
```

### Adjust Chunk Size:

Edit `lib/crypto/file-encryption-pqc.ts`:

```typescript
// Small chunks = more overhead but better progress updates
const CHUNK_SIZE = 64 * 1024; // 64KB

// Large chunks = less overhead but coarser progress
const CHUNK_SIZE = 1024 * 1024; // 1MB
```

---

## 🐛 Troubleshooting

### Error: "Failed to load Kyber"

**Cause**: `pqc-kyber` package not installed

**Fix**:
```bash
npm install pqc-kyber
```

### Error: "Session not ready"

**Cause**: Trying to transfer before key exchange

**Fix**: Call `setPeerPublicKey()` first:
```typescript
await transfer.setPeerPublicKey(peerKey);
// Now ready to transfer
await transfer.sendFile(file);
```

### Error: "Hash mismatch"

**Cause**: File corrupted during transfer

**Fix**: Implement retry logic or reduce chunk size

### Slow Performance

**Cause**: Too many small chunks

**Fix**: Increase `CHUNK_SIZE` in file-encryption-pqc.ts

---

## 📚 Next Steps

1. ✅ **Test the demo page**: http://localhost:3000/pqc-test
2. 📖 **Read full docs**: See `PQC_INTEGRATION.md`
3. 🧪 **Run tests**: Create test suite for your use case
4. 🔗 **Integrate**: Add PQC to your main app
5. 🚀 **Deploy**: Test in production with real devices

---

## 🆘 Need Help?

- 📖 **Full Documentation**: `PQC_INTEGRATION.md`
- 🧪 **Test Page**: http://localhost:3000/pqc-test
- 💬 **Issues**: Check console for detailed error messages

---

## ✨ What's Included

### Cryptography:
- ✅ ML-KEM-768 (Kyber) - Post-quantum KEM
- ✅ X25519 - Classical ECDH
- ✅ Hybrid key exchange
- ✅ AES-256-GCM encryption
- ✅ BLAKE3 hashing
- ✅ Constant-time operations

### Features:
- ✅ File encryption/decryption
- ✅ Chunked transfer with progress
- ✅ Per-chunk integrity verification
- ✅ Full file hash verification
- ✅ Session key derivation
- ✅ Public key serialization

### Developer Experience:
- ✅ React hooks for easy integration
- ✅ TypeScript with full type safety
- ✅ Demo component
- ✅ Test page
- ✅ Comprehensive documentation

---

## 🎉 You're Ready!

Your Tallow app now has **quantum-resistant file transfer** capabilities!

Start by visiting: **http://localhost:3000/pqc-test**

Happy encrypting! 🔐🚀
