# Tallow WASM Integration Guide

Complete guide for integrating tallow-wasm into the Tallow application.

## Quick Start

### 1. Build WASM Module

```bash
cd tallow-wasm
make build
```

This creates `pkg/` directory with:
- `tallow_wasm.js` - JavaScript bindings
- `tallow_wasm_bg.wasm` - WebAssembly binary
- `tallow_wasm.d.ts` - TypeScript definitions
- `package.json` - NPM package metadata

### 2. Install in Tallow

```bash
# From tallow root directory
npm install ./tallow-wasm/pkg
```

Or link for development:

```bash
cd tallow-wasm/pkg
npm link

cd ../..
npm link tallow-wasm
```

### 3. Initialize in Application

In `lib/init/wasm-init.ts`:

```typescript
import init, * as wasm from 'tallow-wasm';

let wasmInitialized = false;

export async function initializeWasm(): Promise<void> {
  if (wasmInitialized) return;

  try {
    await init();
    wasmInitialized = true;
    console.log('WASM initialized:', wasm.version());
  } catch (error) {
    console.error('WASM initialization failed:', error);
    throw error;
  }
}

export function isWasmAvailable(): boolean {
  return wasmInitialized;
}
```

Call during app initialization in `app/layout.tsx`:

```typescript
import { initializeWasm } from '@/lib/init/wasm-init';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeWasm().catch(console.error);
  }, []);

  return <html>{children}</html>;
}
```

## Integration Points

### 1. Post-Quantum Key Exchange

**Replace:** `lib/crypto/pqc-crypto.ts`

```typescript
import * as wasm from 'tallow-wasm';

export class PQCrypto {
  static async generateKeypair() {
    const kp = wasm.hybrid_keypair();
    return {
      mlkem: {
        publicKey: kp.mlkem_public_key,
        secretKey: kp.mlkem_secret_key,
      },
      x25519: {
        publicKey: kp.x25519_public_key,
        secretKey: kp.x25519_secret_key,
      },
    };
  }

  static async initiatorEncapsulate(
    responderMLKemPub: Uint8Array,
    responderX25519Pub: Uint8Array,
    context: string
  ) {
    const result = wasm.hybrid_encapsulate(
      responderMLKemPub,
      responderX25519Pub,
      context
    );

    return {
      sessionKey: result.sessionKey,
      mlkemCiphertext: result.mlkemCiphertext,
      x25519Public: result.x25519Public,
    };
  }

  static async responderDecapsulate(
    mlkemSecret: Uint8Array,
    mlkemCiphertext: Uint8Array,
    x25519Secret: Uint8Array,
    x25519Public: Uint8Array,
    context: string
  ): Promise<Uint8Array> {
    return wasm.hybrid_decapsulate(
      mlkemSecret,
      mlkemCiphertext,
      x25519Secret,
      x25519Public,
      context
    );
  }
}
```

### 2. File Encryption

**Replace:** `lib/crypto/file-encryption.ts`

```typescript
import * as wasm from 'tallow-wasm';

export class FileEncryption {
  private session: wasm.TransferSession | null = null;

  async initSession(sessionKey: Uint8Array, sessionId: string) {
    this.session = new wasm.TransferSession(sessionKey, sessionId);
  }

  async encryptChunk(chunk: Uint8Array): Promise<Uint8Array> {
    if (!this.session) throw new Error('Session not initialized');
    return this.session.encrypt_chunk(chunk);
  }

  async decryptChunk(encryptedChunk: Uint8Array): Promise<Uint8Array> {
    if (!this.session) throw new Error('Session not initialized');
    return this.session.decrypt_chunk(encryptedChunk);
  }

  async encryptFile(file: File, progressCallback?: (progress: number) => void) {
    const sessionKey = wasm.aes_generate_key();
    const sessionId = wasm.generate_session_id();
    const session = new wasm.TransferSession(sessionKey, sessionId);

    const chunkSize = wasm.calculate_optimal_chunk_size(file.size);
    const chunker = new wasm.FileChunker(file.size, chunkSize);

    session.set_chunk_count(chunker.total_chunks);

    const encryptedChunks: Uint8Array[] = [];

    for (let i = 0; i < chunker.total_chunks; i++) {
      const offset = chunker.chunk_offset(i);
      const length = chunker.chunk_length(i);

      const chunk = await file.slice(offset, offset + length).arrayBuffer();
      const encrypted = session.encrypt_chunk(new Uint8Array(chunk));

      encryptedChunks.push(encrypted);

      if (progressCallback) {
        progressCallback(session.progress);
      }
    }

    return {
      sessionKey,
      sessionId,
      encryptedChunks,
    };
  }
}
```

### 3. File Hashing

**Replace:** `lib/crypto/hash.ts`

```typescript
import * as wasm from 'tallow-wasm';

export class FileHasher {
  static async hashFile(file: File): Promise<string> {
    const chunkSize = 1024 * 1024; // 1 MB
    const hasher = new wasm.Blake3Hasher();

    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = await file.slice(offset, offset + chunkSize).arrayBuffer();
      hasher.update(new Uint8Array(chunk));
    }

    return hasher.finalize_hex();
  }

  static hashData(data: Uint8Array): Uint8Array {
    return wasm.blake3_hash(data);
  }

  static verifyHash(data: Uint8Array, expectedHash: Uint8Array): boolean {
    return wasm.blake3_verify(expectedHash, data);
  }

  static async generateChunkHashes(chunks: Uint8Array[]): Promise<Uint8Array[]> {
    return wasm.generate_chunk_hashes(chunks);
  }

  static generateMerkleRoot(hashes: Uint8Array[]): Uint8Array {
    return wasm.merkle_root(hashes);
  }
}
```

### 4. Password-Based Encryption

**Replace:** `lib/crypto/password.ts`

```typescript
import * as wasm from 'tallow-wasm';

export class PasswordCrypto {
  static async hashPassword(password: string): Promise<string> {
    return wasm.argon2_hash_password(password);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return wasm.argon2_verify_password(password, hash);
  }

  static async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array,
    keyLength: number = 32
  ): Promise<Uint8Array> {
    return wasm.argon2_derive_key(password, salt, keyLength);
  }

  static generateSalt(): Uint8Array {
    return wasm.argon2_generate_salt();
  }

  // Use with file encryption
  static async encryptFileWithPassword(
    file: File,
    password: string
  ): Promise<{ encrypted: Uint8Array; salt: Uint8Array }> {
    const salt = this.generateSalt();
    const key = await this.deriveKeyFromPassword(password, salt);

    const fileData = new Uint8Array(await file.arrayBuffer());
    const encrypted = wasm.aes_encrypt(key, fileData);

    return { encrypted, salt };
  }

  static async decryptFileWithPassword(
    encrypted: Uint8Array,
    salt: Uint8Array,
    password: string
  ): Promise<Uint8Array> {
    const key = await this.deriveKeyFromPassword(password, salt);
    return wasm.aes_decrypt(key, encrypted);
  }
}
```

### 5. Transfer Session Manager

**New:** `lib/transfer/wasm-transfer-manager.ts`

```typescript
import * as wasm from 'tallow-wasm';

export class WasmTransferManager {
  private session: wasm.TransferSession | null = null;

  async createSession(peerMLKemPub: Uint8Array, peerX25519Pub: Uint8Array) {
    const result = wasm.TransferSession.from_hybrid_encapsulate(
      peerMLKemPub,
      peerX25519Pub,
      crypto.randomUUID()
    );

    this.session = result.session;

    return {
      session: this.session,
      mlkemCiphertext: result.mlkemCiphertext,
      x25519Public: result.x25519Public,
    };
  }

  async acceptSession(
    mlkemSecret: Uint8Array,
    mlkemCiphertext: Uint8Array,
    x25519Secret: Uint8Array,
    x25519Public: Uint8Array
  ) {
    this.session = wasm.TransferSession.from_hybrid_decapsulate(
      mlkemSecret,
      mlkemCiphertext,
      x25519Secret,
      x25519Public,
      crypto.randomUUID()
    );
  }

  async sendFile(file: File, onProgress?: (progress: number) => void) {
    if (!this.session) throw new Error('Session not initialized');

    const chunkSize = wasm.calculate_optimal_chunk_size(file.size);
    const chunker = new wasm.FileChunker(file.size, chunkSize);

    this.session.set_chunk_count(chunker.total_chunks);

    const encryptedChunks: Uint8Array[] = [];

    for (let i = 0; i < chunker.total_chunks; i++) {
      const offset = chunker.chunk_offset(i);
      const length = chunker.chunk_length(i);

      const chunk = await file.slice(offset, offset + length).arrayBuffer();
      const encrypted = this.session.encrypt_chunk_with_metadata(
        new Uint8Array(chunk),
        i
      );

      encryptedChunks.push(encrypted);

      if (onProgress) {
        onProgress(this.session.progress);
      }
    }

    return encryptedChunks;
  }

  async receiveChunks(
    encryptedChunks: Uint8Array[],
    chunkLengths: number[]
  ): Promise<Uint8Array> {
    if (!this.session) throw new Error('Session not initialized');

    const decryptedChunks: Uint8Array[] = [];

    for (let i = 0; i < encryptedChunks.length; i++) {
      const decrypted = this.session.decrypt_chunk_with_metadata(
        encryptedChunks[i],
        i,
        chunkLengths[i]
      );
      decryptedChunks.push(decrypted);
    }

    // Concatenate chunks
    const totalLength = decryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of decryptedChunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  getStats() {
    return this.session?.stats();
  }
}
```

## React Hooks

**New:** `lib/hooks/use-wasm-crypto.ts`

```typescript
import { useState, useEffect } from 'react';
import { initializeWasm, isWasmAvailable } from '@/lib/init/wasm-init';

export function useWasmCrypto() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isWasmAvailable()) {
      setIsReady(true);
      return;
    }

    initializeWasm()
      .then(() => setIsReady(true))
      .catch(setError);
  }, []);

  return { isReady, error };
}
```

Usage in components:

```typescript
import { useWasmCrypto } from '@/lib/hooks/use-wasm-crypto';

export function FileTransferComponent() {
  const { isReady, error } = useWasmCrypto();

  if (error) return <div>WASM Error: {error.message}</div>;
  if (!isReady) return <div>Loading crypto...</div>;

  return <div>Ready to transfer files securely!</div>;
}
```

## Performance Monitoring

```typescript
import * as wasm from 'tallow-wasm';

export async function runBenchmarks() {
  const results = await wasm.benchmark();

  console.log('WASM Performance:');
  console.log(`ML-KEM Keygen: ${results.mlkem_keygen_ms.toFixed(2)}ms`);
  console.log(`X25519 Keygen: ${results.x25519_keygen_ms.toFixed(2)}ms`);
  console.log(`AES-GCM: ${results.aes_gcm_throughput_mbps.toFixed(0)} MB/s`);
  console.log(`BLAKE3: ${results.blake3_throughput_mbps.toFixed(0)} MB/s`);

  return results;
}
```

## Testing

**New:** `tests/wasm-integration.test.ts`

```typescript
import * as wasm from 'tallow-wasm';

describe('WASM Integration', () => {
  beforeAll(async () => {
    await initializeWasm();
  });

  test('hybrid key exchange', () => {
    const responder = wasm.hybrid_keypair();
    const result = wasm.hybrid_encapsulate(
      responder.mlkem_public_key,
      responder.x25519_public_key,
      'test'
    );

    const key = wasm.hybrid_decapsulate(
      responder.mlkem_secret_key,
      result.mlkemCiphertext,
      responder.x25519_secret_key,
      result.x25519Public,
      'test'
    );

    expect(key).toEqual(result.sessionKey);
  });

  test('file encryption', () => {
    const key = wasm.aes_generate_key();
    const session = new wasm.TransferSession(key, 'test');

    const data = new Uint8Array([1, 2, 3, 4]);
    const encrypted = session.encrypt_chunk(data);
    const decrypted = session.decrypt_chunk(encrypted);

    expect(decrypted).toEqual(data);
  });
});
```

## Deployment

### Next.js Configuration

Add to `next.config.ts`:

```typescript
const config: NextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};
```

### Vercel Deployment

WASM is automatically supported on Vercel. Ensure `pkg/` is committed or built during deployment.

Add to `vercel.json`:

```json
{
  "buildCommand": "cd tallow-wasm && make build && cd .. && npm run build"
}
```

## Troubleshooting

### WASM Not Loading

```typescript
import init from 'tallow-wasm';

async function loadWasm() {
  try {
    // Try default import
    await init();
  } catch (error) {
    // Fallback to explicit path
    await init('/path/to/tallow_wasm_bg.wasm');
  }
}
```

### TypeScript Errors

Ensure types are generated:

```bash
cd tallow-wasm
make build
```

Then check `pkg/tallow_wasm.d.ts` exists.

### Performance Issues

Enable SIMD:

```bash
cd tallow-wasm
RUSTFLAGS="-C target-feature=+simd128" make build
```

Check browser support:

```javascript
if (WebAssembly && 'SIMD' in WebAssembly) {
  console.log('SIMD supported');
}
```

## Next Steps

1. Build WASM module: `cd tallow-wasm && make build`
2. Install in Tallow: `npm install ./tallow-wasm/pkg`
3. Initialize in `app/layout.tsx`
4. Replace crypto implementations in `lib/crypto/`
5. Test with `npm test`
6. Deploy!

## Support

For issues specific to WASM integration:
- Check `tallow-wasm/README.md`
- Run benchmarks: `cd tallow-wasm && make bench`
- File issue with performance stats
