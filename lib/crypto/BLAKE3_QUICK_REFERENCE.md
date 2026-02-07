# BLAKE3 Quick Reference Card

## Import

```typescript
import { hash, blake3Hex, deriveKey, keyedHash, createHasher, blake3 } from '@/lib/crypto/blake3';
```

## Common Operations

### Hash Data (One-Shot)
```typescript
const data = new TextEncoder().encode('hello');
const digest = hash(data);           // Uint8Array (32 bytes)
const hex = blake3Hex('hello');      // string (64 hex chars)
```

### Hash Large Data (Streaming)
```typescript
const hasher = createHasher();
hasher.update(chunk1);
hasher.update(chunk2);
const digest = hasher.finalize();    // Uint8Array
const hex = hasher.finalizeHex();    // string
```

### Derive Keys
```typescript
// Derive different keys from same material
const encKey = deriveKey('app-encryption-v1', sharedSecret);
const macKey = deriveKey('app-mac-v1', sharedSecret);
```

### Message Authentication (MAC)
```typescript
const key = new Uint8Array(32);
crypto.getRandomValues(key);
const mac = keyedHash(key, message);

// Verify
const valid = constantTimeEqual(mac, receivedMac);
```

## File Operations

### Hash File
```typescript
async function hashFile(file: File): Promise<string> {
  const hasher = createHasher();
  const chunkSize = 64 * 1024;

  for (let offset = 0; offset < file.size; offset += chunkSize) {
    const chunk = file.slice(offset, offset + chunkSize);
    const buffer = await chunk.arrayBuffer();
    hasher.update(new Uint8Array(buffer));
  }

  return hasher.finalizeHex();
}
```

### Hash with Progress
```typescript
async function hashWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<Uint8Array> {
  const hasher = createHasher();
  const chunkSize = 1024 * 1024;
  let processed = 0;

  while (processed < file.size) {
    const chunk = file.slice(processed, processed + chunkSize);
    const buffer = await chunk.arrayBuffer();
    hasher.update(new Uint8Array(buffer));
    processed += chunk.size;
    onProgress((processed / file.size) * 100);
  }

  return hasher.finalize();
}
```

## Key Derivation Patterns

### Multiple Keys from Shared Secret
```typescript
function deriveSessionKeys(secret: Uint8Array) {
  return {
    encryption: deriveKey('tallow-encryption-v1', secret),
    authentication: deriveKey('tallow-auth-v1', secret),
    integrity: deriveKey('tallow-integrity-v1', secret),
  };
}
```

### Combine Two Secrets
```typescript
function combineSecrets(secret1: Uint8Array, secret2: Uint8Array): Uint8Array {
  const combined = new Uint8Array(secret1.length + secret2.length);
  combined.set(secret1, 0);
  combined.set(secret2, secret1.length);
  return deriveKey('tallow-combined-v1', combined);
}
```

## Service API

```typescript
// All functions available via singleton
blake3.hash(data);
blake3.hashHex(data);
blake3.deriveKey(context, material);
blake3.keyedHash(key, data);
blake3.createHasher();
blake3.constantTimeEqual(a, b);
```

## Migration from SHA-256

```typescript
// BEFORE
import { sha256 } from '@noble/hashes/sha2.js';
const hash = sha256(data);

// AFTER
import { hash } from '@/lib/crypto/blake3';
const digest = hash(data);
```

## Migration from HKDF

```typescript
// BEFORE
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
const key = hkdf(sha256, material, salt, info, 32);

// AFTER
import { deriveKey } from '@/lib/crypto/blake3';
const key = deriveKey('myapp-v1', material);
```

## Context String Format

Use format: `appname-purpose-version`

**Good Examples:**
- `'tallow-file-encryption-v1'`
- `'tallow-session-keys-v2'`
- `'tallow.com 2024-01-01 transfer'`

**Bad Examples:**
- `'encryption'` (too generic)
- `'v1'` (no purpose)
- `'test'` (not descriptive)

## Performance Tips

### ✅ DO
- Use streaming for files >1KB
- Reuse hashers for multiple operations
- Use appropriate chunk sizes (64KB-1MB)

### ❌ DON'T
- Load entire file into memory
- Create new hasher for every chunk
- Use tiny chunk sizes (<4KB)

## Security Checklist

- ✅ Use 32-byte keys for keyed hashing
- ✅ Use `constantTimeEqual()` for MAC verification
- ✅ Use unique context strings for different purposes
- ✅ Never reuse MACs across contexts
- ❌ Don't use for password hashing (use Argon2id)
- ❌ Don't use random nonces with same key (use counter-based)

## Error Handling

```typescript
try {
  const mac = keyedHash(key, data);
} catch (error) {
  if (error.message.includes('32 bytes')) {
    // Invalid key size
  }
}
```

## TypeScript Types

```typescript
interface Blake3Hasher {
  update(data: Uint8Array): Blake3Hasher;
  finalize(): Uint8Array;
  finalizeHex(): string;
}

// All functions return Uint8Array (32 bytes) except:
blake3Hex(): string  // Returns 64-char hex string
```

## Common Patterns

### Content-Addressed Storage
```typescript
const contentId = blake3Hex(data);
storage.set(contentId, data);
```

### Deduplication
```typescript
const seen = new Set<string>();
const id = blake3Hex(data);
if (!seen.has(id)) {
  seen.add(id);
  processFile(data);
}
```

### Transfer Receipt
```typescript
function createReceipt(fileHash: Uint8Array, timestamp: number): string {
  const hasher = createHasher();
  hasher.update(fileHash);

  const ts = new Uint8Array(8);
  new DataView(ts.buffer).setBigUint64(0, BigInt(timestamp), false);
  hasher.update(ts);

  return hasher.finalizeHex();
}
```

## Debugging

```typescript
// Check hash equality
const hash1 = hash(data);
const hash2 = hash(data);
console.log('Equal:', constantTimeEqual(hash1, hash2)); // true

// View hash
const hex = blake3Hex(data);
console.log('Hash:', hex);

// Check hash properties
const digest = hash(data);
console.log('Length:', digest.length); // 32
console.log('Type:', digest instanceof Uint8Array); // true
```

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { hash, constantTimeEqual } from '@/lib/crypto/blake3';

it('should hash consistently', () => {
  const data = new TextEncoder().encode('test');
  const hash1 = hash(data);
  const hash2 = hash(data);
  expect(constantTimeEqual(hash1, hash2)).toBe(true);
});
```

## Benchmarking

```typescript
const data = new Uint8Array(1024 * 1024); // 1MB
crypto.getRandomValues(data);

const start = performance.now();
const digest = hash(data);
const duration = performance.now() - start;

console.log(`Hashed 1MB in ${duration.toFixed(2)}ms`);
console.log(`Throughput: ${(1 / duration * 1000).toFixed(2)} MB/s`);
```

## Links

- Full documentation: `BLAKE3_README.md`
- Examples: `blake3-examples.ts`
- Tests: `blake3.test.ts`
- Implementation: `blake3.ts`

## When to Use

**Use BLAKE3 for:**
- ✅ File integrity verification
- ✅ Key derivation
- ✅ Content addressing
- ✅ High-throughput hashing
- ✅ New protocols

**Use SHA-256 for:**
- ✅ Hardware acceleration needed
- ✅ Compatibility requirements
- ✅ Existing protocols
- ✅ Interoperability

## Quick Comparison

| Feature | BLAKE3 | SHA-256 |
|---------|--------|---------|
| Speed | 2-4x faster | 1x baseline |
| Output | 32 bytes | 32 bytes |
| Quantum security | 128 bits | 128 bits |
| Key derivation | Built-in | Need HKDF |
| Streaming | Yes | Yes |

---

**Need help?** See `BLAKE3_README.md` for complete documentation.
