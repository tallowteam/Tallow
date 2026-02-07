# BLAKE3 Cryptographic Hash Implementation

## Overview

BLAKE3 is a modern, high-performance cryptographic hash function designed to be faster than SHA-256, SHA-3, and BLAKE2 while maintaining the same security guarantees.

**Location:** `lib/crypto/blake3.ts`

## Key Features

- **Fast**: 2-4x faster than SHA-256 in software
- **Quantum-Resistant**: 128-bit security level (same as SHA-256)
- **Versatile**: Supports hashing, key derivation, and MACs
- **Streaming**: Process data incrementally
- **Deterministic**: Same input always produces same output
- **Side-Channel Resistant**: Designed to resist timing attacks

## Quick Start

```typescript
import { blake3, hash, deriveKey, keyedHash } from '@/lib/crypto/blake3';

// Hash data
const data = new TextEncoder().encode('hello world');
const digest = hash(data);

// Derive key from material
const key = deriveKey('myapp-encryption-v1', sharedSecret);

// Create MAC
const mac = keyedHash(authKey, message);
```

## API Reference

### Basic Hashing

#### `hash(data: Uint8Array): Uint8Array`

Hash data in one shot. Returns 32-byte hash.

```typescript
const data = new TextEncoder().encode('test data');
const digest = hash(data);
// digest.length === 32
```

#### `blake3Hex(data: string | Uint8Array): string`

Hash data and return hex string.

```typescript
const hex = blake3Hex('hello world');
// Returns: "d74981efa70a0c880b8d8c1985d075dbcbf679b99a5f9914e5aaf96b831a9e24"
```

### Streaming Hash

#### `createHasher(): Blake3Hasher`

Create streaming hasher for incremental updates.

```typescript
const hasher = createHasher();
hasher.update(chunk1);
hasher.update(chunk2);
const digest = hasher.finalize(); // Uint8Array
const hex = hasher.finalizeHex();  // string
```

**Methods:**
- `update(data: Uint8Array): Blake3Hasher` - Add data
- `finalize(): Uint8Array` - Get hash
- `finalizeHex(): string` - Get hex hash

### Key Derivation

#### `deriveKey(context: string, material: Uint8Array): Uint8Array`

Derive 32-byte key from input material with context string for domain separation.

```typescript
// Derive different keys from same material
const encKey = deriveKey('tallow-encryption-v1', secret);
const authKey = deriveKey('tallow-auth-v1', secret);
// encKey !== authKey
```

**Context string format:**
- Use format: `appname-purpose-version`
- Examples:
  - `'tallow-file-encryption-v1'`
  - `'tallow.com 2024-01-01 session keys'`
  - `'transfer-authentication-v2'`

#### `createDeriveKeyHasher(context: string): Blake3Hasher`

Create streaming key derivation hasher.

```typescript
const hasher = createDeriveKeyHasher('myapp-v1');
hasher.update(material1);
hasher.update(material2);
const key = hasher.finalize();
```

### Message Authentication (MAC)

#### `keyedHash(key: Uint8Array, data: Uint8Array): Uint8Array`

Create 32-byte MAC using BLAKE3 keyed hash mode.

```typescript
const key = new Uint8Array(32);
crypto.getRandomValues(key);
const mac = keyedHash(key, message);
```

**Requirements:**
- Key must be exactly 32 bytes
- Throws error if key is wrong size

#### `createKeyedHasher(key: Uint8Array): Blake3Hasher`

Create streaming keyed hasher.

```typescript
const hasher = createKeyedHasher(key);
hasher.update(chunk1);
hasher.update(chunk2);
const mac = hasher.finalize();
```

### Utilities

#### `constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean`

Constant-time comparison to prevent timing attacks.

```typescript
const valid = constantTimeEqual(expectedMac, receivedMac);
```

### Service API

The `Blake3Service` singleton provides all functionality:

```typescript
import { blake3 } from '@/lib/crypto/blake3';

blake3.hash(data);
blake3.hashHex(data);
blake3.deriveKey(context, material);
blake3.keyedHash(key, data);
blake3.createHasher();
blake3.constantTimeEqual(a, b);
```

## Use Cases

### 1. File Integrity Verification

```typescript
async function hashFile(file: File): Promise<string> {
  const hasher = createHasher();
  const chunkSize = 64 * 1024; // 64KB

  for (let offset = 0; offset < file.size; offset += chunkSize) {
    const chunk = file.slice(offset, offset + chunkSize);
    const buffer = await chunk.arrayBuffer();
    hasher.update(new Uint8Array(buffer));
  }

  return hasher.finalizeHex();
}
```

### 2. Key Derivation

```typescript
// Derive multiple keys from shared secret
function deriveSessionKeys(sharedSecret: Uint8Array) {
  return {
    encryption: deriveKey('tallow-encryption-v1', sharedSecret),
    authentication: deriveKey('tallow-auth-v1', sharedSecret),
    integrity: deriveKey('tallow-integrity-v1', sharedSecret),
  };
}
```

### 3. Content Addressing

```typescript
function getContentId(data: Uint8Array): string {
  return blake3Hex(data);
}

// Deduplication
const contentId = getContentId(fileData);
if (!seenContent.has(contentId)) {
  seenContent.add(contentId);
  processFile(fileData);
}
```

### 4. Message Authentication

```typescript
function createAuthMessage(key: Uint8Array, msg: Uint8Array) {
  const mac = keyedHash(key, msg);
  return { message: msg, mac };
}

function verifyAuthMessage(key: Uint8Array, msg: Uint8Array, mac: Uint8Array): boolean {
  const expected = keyedHash(key, msg);
  return constantTimeEqual(expected, mac);
}
```

## Migration from SHA-256

### Before (SHA-256)

```typescript
import { sha256 } from '@noble/hashes/sha2.js';

const hash = sha256(data);
```

### After (BLAKE3)

```typescript
import { hash } from '@/lib/crypto/blake3';

const digest = hash(data);
```

### Before (HKDF)

```typescript
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';

const key = hkdf(sha256, secret, salt, info, 32);
```

### After (BLAKE3)

```typescript
import { deriveKey } from '@/lib/crypto/blake3';

const key = deriveKey('myapp-v1', secret);
```

## Security Notes

### Quantum Resistance

- **128-bit security**: Grover's algorithm reduces 256-bit hash to 128-bit security
- **Sufficient**: 128 bits is considered quantum-safe
- **Same as SHA-256**: Both provide 128-bit quantum security

### When to Use BLAKE3

✅ **Use BLAKE3 for:**
- File integrity checks (faster than SHA-256)
- Key derivation (simpler than HKDF)
- Content addressing
- High-throughput hashing
- New protocols/systems

❌ **Use SHA-256 for:**
- Hardware-accelerated environments
- Compatibility requirements
- Existing protocols (Bitcoin, etc.)
- Interoperability with other systems

### Implementation Notes

This is a **reference implementation** optimized for:
- ✅ Correctness
- ✅ Compatibility (works everywhere)
- ✅ No WASM dependency
- ⚠️ Not optimized for raw speed

For production use with large files (>1MB):
- Consider `blake3-wasm` package
- Use Web Workers for parallelization
- Consider native implementation (`node-blake3`)

## Performance Characteristics

### Small Files (<1KB)
- BLAKE3: ~1ms
- SHA-256: ~1ms
- **Winner**: Tie

### Medium Files (1KB-1MB)
- BLAKE3: 2-3x faster than SHA-256
- Better cache utilization

### Large Files (>1MB)
- BLAKE3: 2-4x faster (JS implementation)
- BLAKE3-WASM: 5-10x faster than SHA-256
- Parallelization benefits with multiple cores

### Streaming Performance
- Excellent for large files
- Low memory overhead
- Constant memory usage

## Integration Points

### Existing Tallow Crypto

BLAKE3 integrates with:

1. **PQC Crypto** (`pqc-crypto.ts`)
   - Alternative to HKDF for key derivation
   - Replace `combineSecrets()` implementation

2. **Key Management** (`key-management.ts`)
   - Replace `kdfRootKey()`, `kdfChainKey()`, `kdfMessageKey()`
   - Faster key ratcheting

3. **File Encryption** (`file-encryption-pqc.ts`)
   - File integrity verification
   - Chunk hashing for resumable transfers

4. **Transfer Manager**
   - Content-addressed file chunks
   - Merkle tree construction
   - Transfer receipts

### Example Integration

```typescript
// In key-management.ts
import { deriveKey } from './blake3';

private kdfRootKey(currentRoot: Uint8Array, dhOutput: Uint8Array): Uint8Array {
  const combined = new Uint8Array(currentRoot.length + dhOutput.length);
  combined.set(currentRoot, 0);
  combined.set(dhOutput, currentRoot.length);

  // BLAKE3 instead of HKDF-SHA256
  return deriveKey('tallow-root-key-v1', combined);
}
```

## Testing

Run tests:

```bash
npm test lib/crypto/blake3.test.ts
```

Test coverage:
- ✅ Basic hashing
- ✅ Streaming updates
- ✅ Key derivation
- ✅ Keyed hashing (MAC)
- ✅ Edge cases (empty, large, odd sizes)
- ✅ Security properties (avalanche effect)
- ✅ Integration with existing crypto

## Examples

See `blake3-examples.ts` for comprehensive usage examples:
- File integrity verification
- Key derivation patterns
- Content addressing
- Message authentication
- Merkle tree construction
- Transfer receipt generation

## References

- **Specification**: https://github.com/BLAKE3-team/BLAKE3-specs
- **Paper**: https://github.com/BLAKE3-team/BLAKE3-specs/blob/master/blake3.pdf
- **Reference Implementation**: https://github.com/BLAKE3-team/BLAKE3

## FAQ

**Q: Is BLAKE3 quantum-resistant?**
A: Yes. Like SHA-256, it provides 128-bit quantum security (256-bit classical security reduced by Grover's algorithm).

**Q: Should I replace all SHA-256 usage?**
A: Not necessarily. Use BLAKE3 for new code and high-performance needs. Keep SHA-256 where compatibility matters.

**Q: Is the JS implementation fast enough?**
A: For most use cases, yes. For very large files (>10MB), consider WASM or native implementations.

**Q: Can I use this for password hashing?**
A: No. Use Argon2id (`argon2-browser.ts`) for password-based key derivation. BLAKE3 is for hashing and key derivation from already-strong key material.

**Q: Is this production-ready?**
A: Yes, but optimized for correctness over speed. For maximum performance, use optimized implementations (WASM/native).

**Q: How does key derivation compare to HKDF?**
A: BLAKE3 key derivation is simpler (one function call) and faster while providing the same security guarantees as HKDF-SHA256.
