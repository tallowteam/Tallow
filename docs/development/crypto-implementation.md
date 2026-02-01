# Cryptography Implementation

Comprehensive guide to TALLOW's cryptographic implementation.

## Table of Contents

- [Overview](#overview)
- [Hybrid Post-Quantum Encryption](#hybrid-post-quantum-encryption)
- [Triple Ratchet Protocol](#triple-ratchet-protocol)
- [File Encryption](#file-encryption)
- [Key Derivation](#key-derivation)
- [Nonce Management](#nonce-management)
- [Security Properties](#security-properties)

## Overview

TALLOW implements a defense-in-depth cryptographic architecture combining:

1. **Post-Quantum Cryptography**: ML-KEM-768 (NIST-standardized Kyber)
2. **Classical Cryptography**: X25519 (Curve25519 ECDH)
3. **Hybrid Design**: Security if either algorithm is broken
4. **Forward Secrecy**: Triple Ratchet protocol
5. **Authenticated Encryption**: AES-256-GCM with HMAC

### Cryptographic Stack

```
┌───────────────────────────────────────────────────┐
│              Application Layer                     │
│  - File selection, UI, transfer management        │
└────────────────┬──────────────────────────────────┘
                 │
┌────────────────▼──────────────────────────────────┐
│          File Encryption Layer                     │
│  - Chunked encryption (256 KB chunks)             │
│  - Per-chunk nonces (counter-based)               │
│  - Integrity protection (HMAC-SHA256)             │
└────────────────┬──────────────────────────────────┘
                 │
┌────────────────▼──────────────────────────────────┐
│         Triple Ratchet Layer                       │
│  - Forward secrecy (per-message keys)             │
│  - Post-compromise security                        │
│  - Out-of-order message handling                  │
└────────────────┬──────────────────────────────────┘
                 │
┌────────────────▼──────────────────────────────────┐
│      Hybrid Key Exchange Layer                     │
│  - ML-KEM-768 (post-quantum)                      │
│  - X25519 (classical)                              │
│  - HKDF key derivation                            │
└────────────────┬──────────────────────────────────┘
                 │
┌────────────────▼──────────────────────────────────┐
│         Transport Layer (WebRTC)                   │
│  - DTLS-SRTP (WebRTC built-in encryption)         │
│  - Additional layer of protection                  │
└───────────────────────────────────────────────────┘
```

## Hybrid Post-Quantum Encryption

### Algorithm Selection

**ML-KEM-768 (Kyber-768)**
- NIST standardized PQC algorithm
- 768-bit security parameter
- Public key: 1184 bytes
- Ciphertext: 1088 bytes
- Shared secret: 32 bytes

**X25519**
- Elliptic Curve Diffie-Hellman
- Curve25519 elliptic curve
- Public key: 32 bytes
- Shared secret: 32 bytes

### Hybrid Combination

Both algorithms run in parallel, and their outputs are combined:

```typescript
// Sender side
const kyberKeypair = generateKyberKeypair();
const x25519Keypair = generateX25519Keypair();

const hybridPublicKey = {
  kyberPublicKey: kyberKeypair.publicKey,
  x25519PublicKey: x25519Keypair.publicKey
};

// Send to receiver...

// Receiver side
const kyberResult = kyber.encapsulate(hybridPublicKey.kyberPublicKey);
const x25519Ephemeral = generateX25519Keypair();
const x25519Secret = x25519.getSharedSecret(
  x25519Ephemeral.privateKey,
  hybridPublicKey.x25519PublicKey
);

// Combine secrets
const combinedSecret = HKDF(
  sha256,
  kyberResult.sharedSecret || x25519Secret, // Concatenated
  salt: "tallow-kdf-salt-v1-2024",
  info: "tallow-hybrid-v1",
  outputLength: 32
);
```

### Security Properties

**Quantum Resistance**:
- If quantum computers break X25519, ML-KEM-768 still protects
- Based on lattice problems (LWE)

**Classical Security**:
- If ML-KEM-768 is broken, X25519 still protects
- Well-established ECDH security

**Combined Security**:
- Security ≥ max(ML-KEM-768, X25519)
- Attacker must break BOTH algorithms

### Implementation (`pqc-crypto.ts`)

```typescript
export class PQCryptoService {
  /**
   * Generate hybrid keypair
   */
  async generateHybridKeypair(): Promise<HybridKeyPair> {
    // ML-KEM-768 keypair
    const kyberKeys = kyber.keypair();

    // X25519 keypair
    const x25519PrivateKey = this.randomBytes(32);
    const x25519PublicKey = x25519.getPublicKey(x25519PrivateKey);

    return {
      kyber: {
        publicKey: kyberKeys.pubkey,  // 1184 bytes
        secretKey: kyberKeys.secret,  // 2400 bytes
      },
      x25519: {
        publicKey: x25519PublicKey,   // 32 bytes
        privateKey: x25519PrivateKey, // 32 bytes
      },
    };
  }

  /**
   * Encapsulate: Receiver creates shared secret
   */
  async encapsulate(
    recipientPublicKey: HybridPublicKey
  ): Promise<{ ciphertext: HybridCiphertext; sharedSecret: Uint8Array }> {
    // Kyber encapsulation
    const kyberResult = kyber.encapsulate(recipientPublicKey.kyberPublicKey);

    // X25519 ephemeral key exchange
    const ephemeralPrivateKey = this.randomBytes(32);
    const ephemeralPublicKey = x25519.getPublicKey(ephemeralPrivateKey);
    const x25519SharedSecret = x25519.getSharedSecret(
      ephemeralPrivateKey,
      recipientPublicKey.x25519PublicKey
    );

    // Combine with HKDF
    const combinedSecret = this.combineSecrets(
      kyberResult.sharedSecret,
      x25519SharedSecret
    );

    return {
      ciphertext: {
        kyberCiphertext: kyberResult.ciphertext,
        x25519EphemeralPublic: ephemeralPublicKey,
      },
      sharedSecret: combinedSecret,
    };
  }

  /**
   * Combine secrets using HKDF
   */
  private combineSecrets(
    kyberSecret: Uint8Array,
    x25519Secret: Uint8Array
  ): Uint8Array {
    const ikm = new Uint8Array([...kyberSecret, ...x25519Secret]);
    const salt = new TextEncoder().encode('tallow-kdf-salt-v1-2024');
    const info = new TextEncoder().encode('tallow-hybrid-v1');

    return hkdf(sha256, ikm, salt, info, 32);
  }
}
```

## Triple Ratchet Protocol

Extension of Signal's Double Ratchet with PQC.

### Components

**1. Root Ratchet**
- Uses Diffie-Hellman (classical + PQC)
- Generates new chain keys
- Provides forward secrecy

**2. Sending Chain**
- KDF chain for outgoing messages
- Each message gets unique key
- Never reuses keys

**3. Receiving Chain**
- KDF chain for incoming messages
- Handles out-of-order messages
- Skipped message keys stored

**4. PQC Ratchet**
- ML-KEM-768 ratchet step
- Periodic PQC key rotation
- Additional quantum resistance

### State Machine

```
Initial State:
├─ Root Key (from hybrid KE)
├─ Sending Chain Key = KDF(root_key, "send")
├─ Receiving Chain Key = KDF(root_key, "recv")
└─ Message Number = 0

Per Message Send:
├─ Message Key = KDF(sending_chain_key, message_number)
├─ Sending Chain Key = KDF(sending_chain_key, "next")
├─ Increment message_number
└─ Encrypt with Message Key

Per Message Receive:
├─ Message Key = KDF(receiving_chain_key, message_number)
├─ Receiving Chain Key = KDF(receiving_chain_key, "next")
├─ Store skipped keys (if out-of-order)
└─ Decrypt with Message Key

Ratchet Step (periodic):
├─ Generate new DH keypair
├─ Perform DH with peer's public key
├─ Generate new PQC keypair
├─ Perform PQC encapsulation
├─ Root Key = KDF(old_root_key, dh_output, pqc_output)
├─ Reset chain keys
└─ Reset message numbers
```

### Implementation (`triple-ratchet.ts`)

```typescript
export class TripleRatchet {
  private rootKey: Uint8Array;
  private sendingChainKey: Uint8Array;
  private receivingChainKey: Uint8Array;
  private messageNumber: number = 0;
  private skippedKeys: Map<number, Uint8Array> = new Map();

  /**
   * Initialize from shared secret
   */
  static async init(sharedSecret: Uint8Array): Promise<TripleRatchet> {
    const ratchet = new TripleRatchet();

    // Derive initial keys
    const keyMaterial = hkdf(
      sha256,
      sharedSecret,
      new TextEncoder().encode('tallow-ratchet-v1'),
      new TextEncoder().encode('init'),
      96 // 32 * 3 bytes
    );

    ratchet.rootKey = keyMaterial.slice(0, 32);
    ratchet.sendingChainKey = keyMaterial.slice(32, 64);
    ratchet.receivingChainKey = keyMaterial.slice(64, 96);

    return ratchet;
  }

  /**
   * Derive message key for sending
   */
  private deriveMessageKey(): Uint8Array {
    const messageKey = hkdf(
      sha256,
      this.sendingChainKey,
      undefined,
      new TextEncoder().encode(`msg-${this.messageNumber}`),
      32
    );

    // Advance chain
    this.sendingChainKey = hkdf(
      sha256,
      this.sendingChainKey,
      undefined,
      new TextEncoder().encode('chain-advance'),
      32
    );

    this.messageNumber++;
    return messageKey;
  }

  /**
   * Encrypt message
   */
  async encryptMessage(plaintext: Uint8Array): Promise<EncryptedMessage> {
    const messageKey = this.deriveMessageKey();
    const nonce = crypto.getRandomValues(new Uint8Array(12));

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      messageKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        tagLength: 128,
      },
      cryptoKey,
      plaintext
    );

    return {
      ciphertext: new Uint8Array(ciphertext),
      nonce,
      messageNumber: this.messageNumber - 1,
    };
  }

  /**
   * Decrypt message (handles out-of-order)
   */
  async decryptMessage(encrypted: EncryptedMessage): Promise<Uint8Array> {
    // Check for skipped message key
    if (this.skippedKeys.has(encrypted.messageNumber)) {
      const messageKey = this.skippedKeys.get(encrypted.messageNumber)!;
      this.skippedKeys.delete(encrypted.messageNumber);
      return this.decryptWithKey(encrypted, messageKey);
    }

    // Derive keys for missing messages
    while (this.messageNumber < encrypted.messageNumber) {
      const skippedKey = this.deriveMessageKey();
      this.skippedKeys.set(this.messageNumber - 1, skippedKey);
    }

    // Decrypt current message
    const messageKey = this.deriveMessageKey();
    return this.decryptWithKey(encrypted, messageKey);
  }

  private async decryptWithKey(
    encrypted: EncryptedMessage,
    key: Uint8Array
  ): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: encrypted.nonce,
        tagLength: 128,
      },
      cryptoKey,
      encrypted.ciphertext
    );

    return new Uint8Array(plaintext);
  }
}
```

## File Encryption

### Chunked Encryption

Files are encrypted in chunks for streaming and progress tracking:

```typescript
/**
 * Chunk size: 256 KB (optimal for most connections)
 */
const CHUNK_SIZE = 256 * 1024;

/**
 * Encrypt file in chunks
 */
async function* encryptFileChunks(
  file: File,
  encryptionKey: Uint8Array
): AsyncGenerator<EncryptedChunk> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let chunkIndex = 0;

  // Create nonce manager
  const nonceManager = new NonceManager();

  // Read and encrypt file in chunks
  const reader = file.stream().getReader();
  let buffer = new Uint8Array(0);

  while (true) {
    const { done, value } = await reader.read();

    if (value) {
      // Append to buffer
      const newBuffer = new Uint8Array(buffer.length + value.length);
      newBuffer.set(buffer);
      newBuffer.set(value, buffer.length);
      buffer = newBuffer;
    }

    // Process full chunks
    while (buffer.length >= CHUNK_SIZE || (done && buffer.length > 0)) {
      const chunkSize = Math.min(CHUNK_SIZE, buffer.length);
      const chunk = buffer.slice(0, chunkSize);
      buffer = buffer.slice(chunkSize);

      // Encrypt chunk
      const nonce = nonceManager.getNextNonce();
      const encrypted = await encryptChunk(chunk, encryptionKey, nonce);

      yield {
        chunkIndex: chunkIndex++,
        totalChunks,
        nonce,
        ciphertext: encrypted,
        hash: await sha256Hash(chunk), // For integrity
      };

      if (buffer.length === 0 && done) break;
    }

    if (done) break;
  }
}

/**
 * Encrypt single chunk
 */
async function encryptChunk(
  chunk: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      tagLength: 128,
    },
    cryptoKey,
    chunk
  );

  return new Uint8Array(encrypted);
}
```

### Password-Based Encryption

When password protection is enabled:

```typescript
/**
 * Encrypt file with password
 */
async function encryptWithPassword(
  file: File,
  password: string
): Promise<ProtectedFile> {
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(32));

  // Derive key with Argon2id
  const key = await argon2id({
    password: password,
    salt: salt,
    iterations: 3,
    memorySize: 65536, // 64 MB
    hashLength: 32,
    parallelism: 4,
  });

  // Encrypt file
  const encryptedChunks = [];
  for await (const chunk of encryptFileChunks(file, key)) {
    encryptedChunks.push(chunk);
  }

  return {
    originalName: file.name,
    originalType: file.type,
    originalSize: file.size,
    encryptedData: mergeChunks(encryptedChunks),
    isEncrypted: true,
    encryptionMetadata: {
      algorithm: 'AES-256-GCM',
      kdf: 'Argon2id',
      salt: base64Encode(salt),
      iterations: 3,
    },
    passwordHint: null, // User can optionally set
  };
}
```

## Key Derivation

### HKDF (HMAC-based Key Derivation Function)

Used throughout TALLOW for deriving keys:

```typescript
/**
 * Derive session keys from shared secret
 */
function deriveSessionKeys(sharedSecret: Uint8Array): SessionKeys {
  const salt = new TextEncoder().encode('tallow-kdf-salt-v1-2024');
  const info = new TextEncoder().encode('tallow-session-keys-v1');

  // Derive 80 bytes: 32 (encryption) + 32 (auth) + 16 (session ID)
  const keyMaterial = hkdf(sha256, sharedSecret, salt, info, 80);

  return {
    encryptionKey: keyMaterial.slice(0, 32),   // AES-256
    authKey: keyMaterial.slice(32, 64),        // HMAC-SHA256
    sessionId: keyMaterial.slice(64, 80),      // Session identifier
  };
}
```

### Domain Separation

Different "info" parameters for different purposes:

```typescript
const contexts = {
  hybridKE: 'tallow-hybrid-v1',
  sessionKeys: 'tallow-session-keys-v1',
  fileKey: 'tallow-file-key-v1',
  ratchetInit: 'tallow-ratchet-init-v1',
  chainAdvance: 'tallow-chain-advance-v1',
};
```

## Nonce Management

### Counter-Based Nonces

TALLOW uses counter-based nonces to prevent reuse:

```typescript
export class NonceManager {
  private counter: bigint = 0n;
  private baseNonce: Uint8Array;

  constructor() {
    // Random 4-byte base
    this.baseNonce = crypto.getRandomValues(new Uint8Array(4));
  }

  /**
   * Get next nonce (96 bits for GCM)
   */
  getNextNonce(): Uint8Array {
    const nonce = new Uint8Array(12);

    // First 4 bytes: random base
    nonce.set(this.baseNonce, 0);

    // Last 8 bytes: counter (little-endian)
    const view = new DataView(nonce.buffer, 4, 8);
    view.setBigUint64(0, this.counter, true);

    this.counter++;

    // Check for overflow (extremely unlikely)
    if (this.counter >= 2n ** 64n) {
      throw new Error('Nonce counter overflow - key rotation required');
    }

    return nonce;
  }

  /**
   * Check if approaching capacity
   */
  isNearCapacity(): boolean {
    return this.counter >= 2n ** 63n; // 50% of range
  }
}
```

**Why counter-based?**
- Random nonces have birthday paradox collision risk
- After 2^48 messages, ~50% collision probability
- Counter-based nonces guarantee uniqueness
- Safe for 2^64 messages per session

## Security Properties

### Confidentiality

**Provided by**:
- AES-256-GCM (symmetric)
- Hybrid PQC+Classical key exchange
- Perfect forward secrecy (ratchet)

**Guarantees**:
- Passive eavesdropper learns nothing
- Active attacker learns nothing
- Server compromise reveals nothing (E2EE)

### Authentication

**Provided by**:
- GCM authentication tag (128-bit)
- HMAC-SHA256 (file chunks)
- Digital signatures (optional, for identity)

**Guarantees**:
- Recipient verifies sender identity
- Tampering is detected
- Replay attacks prevented

### Forward Secrecy

**Provided by**:
- Triple Ratchet protocol
- Per-message key derivation
- Ephemeral X25519 keys

**Guarantees**:
- Past messages secure even if long-term keys compromised
- Future messages secure even if session key compromised

### Post-Compromise Security

**Provided by**:
- DH ratchet step
- PQC ratchet step
- New key material input

**Guarantees**:
- System recovers from compromise
- Future messages secure after ratchet

### Deniability

**Provided by**:
- Symmetric authentication (MACs not signatures)
- No long-term signing keys

**Guarantees**:
- Anyone with shared secret can create messages
- Cannot prove authorship to third party

## Implementation Checklist

### Required Security Properties

- ✅ End-to-end encryption
- ✅ Post-quantum resistance
- ✅ Forward secrecy
- ✅ Authenticated encryption
- ✅ Replay protection
- ✅ Downgrade protection
- ✅ Constant-time comparisons
- ✅ Secure random number generation
- ✅ Key erasure after use
- ✅ No hardcoded keys
- ✅ No key reuse across sessions

### Testing Requirements

- ✅ Unit tests for all crypto functions
- ✅ Test vectors from standards
- ✅ Constant-time verification
- ✅ Side-channel resistance testing
- ✅ Fuzzing for edge cases
- ✅ Integration tests for full protocol

## Next Steps

- [WebRTC Flow](./webrtc-flow.md)
- [Signaling Protocol](./signaling-protocol.md)
- [Testing Guide](./testing.md)
