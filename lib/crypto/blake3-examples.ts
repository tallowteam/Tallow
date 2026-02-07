/**
 * BLAKE3 Usage Examples for Tallow
 *
 * This file demonstrates how to integrate BLAKE3 into the existing
 * Tallow codebase as an alternative to SHA-256 and HKDF.
 */

import {
  hash,
  blake3Hex,
  deriveKey,
  keyedHash,
  createHasher,
  constantTimeEqual,
} from './blake3';

// ============================================================================
// Example 1: File Integrity Verification
// ============================================================================

/**
 * Compute file hash using BLAKE3 (faster than SHA-256)
 *
 * Use case: Verify file integrity after transfer
 */
export async function computeFileHash(file: File): Promise<string> {
  const hasher = createHasher();

  // Process file in chunks (streaming)
  const chunkSize = 64 * 1024; // 64KB chunks
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    const buffer = await chunk.arrayBuffer();
    hasher.update(new Uint8Array(buffer));
    offset += chunkSize;
  }

  return hasher.finalizeHex();
}

/**
 * Verify file hash
 */
export async function verifyFileHash(file: File, expectedHash: string): Promise<boolean> {
  const actualHash = await computeFileHash(file);
  return actualHash === expectedHash;
}

// ============================================================================
// Example 2: Key Derivation for File Encryption
// ============================================================================

/**
 * Derive encryption keys from shared secret (alternative to HKDF)
 *
 * Use case: Derive multiple keys from a single shared secret
 */
export function deriveEncryptionKeys(sharedSecret: Uint8Array): {
  encryptionKey: Uint8Array;
  authKey: Uint8Array;
  nonceKey: Uint8Array;
} {
  // Derive separate keys for different purposes using different contexts
  const encryptionKey = deriveKey('tallow-encryption-v1', sharedSecret);
  const authKey = deriveKey('tallow-auth-v1', sharedSecret);
  const nonceKey = deriveKey('tallow-nonce-v1', sharedSecret);

  return { encryptionKey, authKey, nonceKey };
}

/**
 * Alternative implementation using streaming
 */
export function deriveSessionKeys(
  sharedSecret: Uint8Array,
  sessionId: string
): Uint8Array[] {
  const keys: Uint8Array[] = [];
  const contexts = ['encryption', 'authentication', 'integrity'];

  for (const context of contexts) {
    const fullContext = `tallow-${context}-${sessionId}`;
    const key = deriveKey(fullContext, sharedSecret);
    keys.push(key);
  }

  return keys;
}

// ============================================================================
// Example 3: Content-Addressed Storage
// ============================================================================

/**
 * Generate content-based ID for files
 *
 * Use case: Deduplication, content-addressed storage
 */
export function generateContentId(data: Uint8Array): string {
  return blake3Hex(data);
}

/**
 * Check if content already exists
 */
export async function hasContentBeenSeen(
  data: Uint8Array,
  seenHashes: Set<string>
): Promise<boolean> {
  const contentId = generateContentId(data);
  return seenHashes.has(contentId);
}

// ============================================================================
// Example 4: Message Authentication (MAC)
// ============================================================================

/**
 * Create authenticated message using BLAKE3 keyed hash
 *
 * Use case: Ensure message authenticity and integrity
 */
export function createAuthenticatedMessage(
  key: Uint8Array,
  message: Uint8Array
): {
  message: Uint8Array;
  mac: Uint8Array;
} {
  const mac = keyedHash(key, message);
  return { message, mac };
}

/**
 * Verify authenticated message
 */
export function verifyAuthenticatedMessage(
  key: Uint8Array,
  message: Uint8Array,
  receivedMac: Uint8Array
): boolean {
  const expectedMac = keyedHash(key, message);
  return constantTimeEqual(expectedMac, receivedMac);
}

// ============================================================================
// Example 5: Chunked File Processing
// ============================================================================

/**
 * Process large file in chunks with progress reporting
 *
 * Use case: Hash large files without loading into memory
 */
export async function hashFileWithProgress(
  file: File,
  onProgress?: (percent: number) => void
): Promise<Uint8Array> {
  const hasher = createHasher();
  const chunkSize = 1024 * 1024; // 1MB chunks
  let processedBytes = 0;

  while (processedBytes < file.size) {
    const chunk = file.slice(processedBytes, processedBytes + chunkSize);
    const buffer = await chunk.arrayBuffer();
    hasher.update(new Uint8Array(buffer));

    processedBytes += chunk.size;

    if (onProgress) {
      const percent = (processedBytes / file.size) * 100;
      onProgress(percent);
    }
  }

  return hasher.finalize();
}

// ============================================================================
// Example 6: Deriving Deterministic Nonces
// ============================================================================

/**
 * Derive deterministic nonce from session info
 *
 * Use case: Create reproducible nonces for specific contexts
 * WARNING: Only use for specific protocols that require deterministic nonces
 */
export function deriveDeterministicNonce(
  sessionKey: Uint8Array,
  counter: bigint,
  context: string
): Uint8Array {
  // Combine context, counter, and session key
  const contextBytes = new TextEncoder().encode(context);
  const counterBytes = new Uint8Array(8);
  new DataView(counterBytes.buffer).setBigUint64(0, counter, false);

  const combined = new Uint8Array(
    contextBytes.length + counterBytes.length + sessionKey.length
  );
  combined.set(contextBytes, 0);
  combined.set(counterBytes, contextBytes.length);
  combined.set(sessionKey, contextBytes.length + counterBytes.length);

  const nonceMaterial = hash(combined);
  return nonceMaterial.slice(0, 12); // 96-bit nonce for AES-GCM
}

// ============================================================================
// Example 7: Integration with PQC Crypto
// ============================================================================

/**
 * Derive keys from hybrid shared secret (Kyber + X25519)
 *
 * Use case: Alternative to HKDF in pqc-crypto.ts
 */
export function deriveHybridKeys(
  kyberSecret: Uint8Array,
  x25519Secret: Uint8Array
): {
  sessionKey: Uint8Array;
  chainKey: Uint8Array;
} {
  // Combine both secrets
  const combined = new Uint8Array(kyberSecret.length + x25519Secret.length);
  combined.set(kyberSecret, 0);
  combined.set(x25519Secret, kyberSecret.length);

  // Derive multiple keys
  const sessionKey = deriveKey('tallow-hybrid-session-v1', combined);
  const chainKey = deriveKey('tallow-hybrid-chain-v1', combined);

  return { sessionKey, chainKey };
}

// ============================================================================
// Example 8: Password Verification
// ============================================================================

/**
 * Hash password with salt (for verification, NOT for key derivation)
 *
 * NOTE: For actual password-based key derivation, use Argon2id
 * This is only for password verification/storage
 */
export function hashPasswordForStorage(password: string, salt: Uint8Array): Uint8Array {
  const passwordBytes = new TextEncoder().encode(password);
  const combined = new Uint8Array(salt.length + passwordBytes.length);
  combined.set(salt, 0);
  combined.set(passwordBytes, salt.length);

  return hash(combined);
}

/**
 * Verify password against stored hash
 */
export function verifyPassword(
  password: string,
  salt: Uint8Array,
  storedHash: Uint8Array
): boolean {
  const computedHash = hashPasswordForStorage(password, salt);
  return constantTimeEqual(computedHash, storedHash);
}

// ============================================================================
// Example 9: Merkle Tree Construction
// ============================================================================

/**
 * Build Merkle tree for file chunks
 *
 * Use case: Verify partial file transfers
 */
export function buildMerkleTree(chunks: Uint8Array[]): {
  root: Uint8Array;
  tree: Uint8Array[][];
} {
  const tree: Uint8Array[][] = [];

  // Leaf level - hash each chunk
  tree.push(chunks.map(chunk => hash(chunk)));

  // Build tree upwards
  while (tree[tree.length - 1]!.length > 1) {
    const currentLevel = tree[tree.length - 1]!;
    const nextLevel: Uint8Array[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        // Hash pair
        const combined = new Uint8Array(64);
        combined.set(currentLevel[i]!, 0);
        combined.set(currentLevel[i + 1]!, 32);
        nextLevel.push(hash(combined));
      } else {
        // Odd node, promote as-is
        nextLevel.push(currentLevel[i]!);
      }
    }

    tree.push(nextLevel);
  }

  return {
    root: tree[tree.length - 1]![0]!,
    tree,
  };
}

/**
 * Verify chunk against Merkle proof
 */
export function verifyMerkleProof(
  chunk: Uint8Array,
  chunkIndex: number,
  proof: Uint8Array[],
  root: Uint8Array
): boolean {
  let currentHash = hash(chunk);
  let currentIndex = chunkIndex;

  for (const siblingHash of proof) {
    const combined = new Uint8Array(64);

    if (currentIndex % 2 === 0) {
      // Current is left child
      combined.set(currentHash, 0);
      combined.set(siblingHash, 32);
    } else {
      // Current is right child
      combined.set(siblingHash, 0);
      combined.set(currentHash, 32);
    }

    currentHash = hash(combined);
    currentIndex = Math.floor(currentIndex / 2);
  }

  return constantTimeEqual(currentHash, root);
}

// ============================================================================
// Example 10: Integration with Transfer System
// ============================================================================

/**
 * Generate transfer receipt hash
 *
 * Use case: Verify file was transferred correctly
 */
export function generateTransferReceipt(
  fileHash: Uint8Array,
  timestamp: number,
  senderId: string,
  receiverId: string
): string {
  const hasher = createHasher();

  // Add all receipt components
  hasher.update(fileHash);

  const timestampBytes = new Uint8Array(8);
  new DataView(timestampBytes.buffer).setBigUint64(0, BigInt(timestamp), false);
  hasher.update(timestampBytes);

  hasher.update(new TextEncoder().encode(senderId));
  hasher.update(new TextEncoder().encode(receiverId));

  return hasher.finalizeHex();
}

/**
 * Verify transfer receipt
 */
export function verifyTransferReceipt(
  fileHash: Uint8Array,
  timestamp: number,
  senderId: string,
  receiverId: string,
  expectedReceipt: string
): boolean {
  const computedReceipt = generateTransferReceipt(
    fileHash,
    timestamp,
    senderId,
    receiverId
  );
  return computedReceipt === expectedReceipt;
}

// ============================================================================
// Migration Guide: SHA-256 to BLAKE3
// ============================================================================

/**
 * BEFORE (SHA-256):
 *
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const fileHash = sha256(fileData);
 *
 * AFTER (BLAKE3):
 *
 * import { hash } from '@/lib/crypto/blake3';
 * const fileHash = hash(fileData);
 */

/**
 * BEFORE (HKDF key derivation):
 *
 * import { hkdf } from '@noble/hashes/hkdf.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const key = hkdf(sha256, sharedSecret, salt, info, 32);
 *
 * AFTER (BLAKE3 key derivation):
 *
 * import { deriveKey } from '@/lib/crypto/blake3';
 * const key = deriveKey('myapp-encryption-v1', sharedSecret);
 */

/**
 * BEFORE (HMAC):
 *
 * const cryptoKey = await crypto.subtle.importKey(
 *   'raw',
 *   key,
 *   { name: 'HMAC', hash: 'SHA-256' },
 *   false,
 *   ['sign']
 * );
 * const mac = await crypto.subtle.sign('HMAC', cryptoKey, data);
 *
 * AFTER (BLAKE3 keyed hash):
 *
 * import { keyedHash } from '@/lib/crypto/blake3';
 * const mac = keyedHash(key, data);
 */

// ============================================================================
// Performance Notes
// ============================================================================

/**
 * BLAKE3 vs SHA-256 Performance:
 *
 * - Small files (<1KB): Similar performance
 * - Medium files (1KB-1MB): BLAKE3 2-3x faster
 * - Large files (>1MB): BLAKE3 2-4x faster (JS implementation)
 *
 * For production use with large files, consider:
 * 1. WASM implementation (blake3-wasm npm package)
 * 2. Web Workers for parallel processing
 * 3. Native implementation (node-blake3 for Node.js)
 *
 * Current implementation is optimized for correctness and
 * compatibility, not raw performance.
 */

/**
 * Example: Using Web Worker for large files
 *
 * // In worker thread:
 * self.onmessage = async (e) => {
 *   const hasher = createHasher();
 *   const chunks = e.data.chunks;
 *
 *   for (const chunk of chunks) {
 *     hasher.update(chunk);
 *   }
 *
 *   self.postMessage({ hash: hasher.finalize() });
 * };
 *
 * // In main thread:
 * const worker = new Worker('./hash-worker.js');
 * worker.postMessage({ chunks: fileChunks });
 * worker.onmessage = (e) => {
 *   const fileHash = e.data.hash;
 *   // Use hash...
 * };
 */

export default {
  computeFileHash,
  verifyFileHash,
  deriveEncryptionKeys,
  generateContentId,
  createAuthenticatedMessage,
  verifyAuthenticatedMessage,
  hashFileWithProgress,
  buildMerkleTree,
  verifyMerkleProof,
  generateTransferReceipt,
  verifyTransferReceipt,
};
