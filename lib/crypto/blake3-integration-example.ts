/**
 * BLAKE3 Integration Example for Tallow
 *
 * This file shows how to integrate BLAKE3 into existing Tallow components.
 * Copy relevant patterns into your actual implementation.
 */

import { hash, deriveKey, createHasher, constantTimeEqual } from './blake3';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';

// ============================================================================
// Example 1: Enhanced PQC Key Combination
// ============================================================================

/**
 * Alternative implementation of combineSecrets using BLAKE3
 * Can be used in pqc-crypto.ts as a faster alternative to HKDF-SHA256
 */
export function combineSecretsBLAKE3(
  kyberSecret: Uint8Array,
  x25519Secret: Uint8Array
): Uint8Array {
  // Concatenate secrets as input key material
  const ikm = new Uint8Array(kyberSecret.length + x25519Secret.length);
  ikm.set(kyberSecret, 0);
  ikm.set(x25519Secret, kyberSecret.length);

  // Use BLAKE3 key derivation instead of HKDF-SHA256
  // This is 2-3x faster while providing same security
  const combined = deriveKey('tallow-hybrid-v1', ikm);

  // Zero intermediate buffer
  ikm.fill(0);

  return combined;
}

/**
 * Comparison: BLAKE3 vs HKDF-SHA256
 */
export function compareKeyDerivation(
  kyberSecret: Uint8Array,
  x25519Secret: Uint8Array
): {
  hkdfKey: Uint8Array;
  blake3Key: Uint8Array;
  timeDiff: number;
} {
  const ikm = new Uint8Array(kyberSecret.length + x25519Secret.length);
  ikm.set(kyberSecret, 0);
  ikm.set(x25519Secret, kyberSecret.length);

  // HKDF-SHA256 (existing method)
  const start1 = performance.now();
  const info = new TextEncoder().encode('tallow-hybrid-v1');
  const hkdfKey = hkdf(sha256, ikm, undefined, info, 32);
  const hkdfTime = performance.now() - start1;

  // BLAKE3 (new method)
  const start2 = performance.now();
  const blake3Key = deriveKey('tallow-hybrid-v1', ikm);
  const blake3Time = performance.now() - start2;

  return {
    hkdfKey,
    blake3Key,
    timeDiff: hkdfTime - blake3Time,
  };
}

// ============================================================================
// Example 2: Enhanced Key Management with BLAKE3
// ============================================================================

/**
 * Alternative KDF functions for key-management.ts using BLAKE3
 */
export class BLAKE3KeyDerivation {
  /**
   * Derive root key from shared secret (faster than HKDF)
   */
  static kdfRootKey(currentRoot: Uint8Array, dhOutput: Uint8Array): Uint8Array {
    const combined = new Uint8Array(currentRoot.length + dhOutput.length);
    combined.set(currentRoot, 0);
    combined.set(dhOutput, currentRoot.length);
    return deriveKey('tallow-root-key-v1', combined);
  }

  /**
   * Derive chain key from root key
   */
  static kdfChainKey(rootKey: Uint8Array, direction: 'send' | 'receive'): Uint8Array {
    const context = `tallow-${direction}-chain-v1`;
    return deriveKey(context, rootKey);
  }

  /**
   * Derive message key from chain key
   */
  static kdfMessageKey(chainKey: Uint8Array): Uint8Array {
    return deriveKey('tallow-message-key-v1', chainKey);
  }

  /**
   * Ratchet chain key forward
   */
  static ratchetChainKey(chainKey: Uint8Array): Uint8Array {
    return deriveKey('tallow-chain-ratchet-v1', chainKey);
  }
}

// ============================================================================
// Example 3: File Integrity in Transfer System
// ============================================================================

/**
 * File integrity verification using BLAKE3
 * Can be integrated into transfer-manager.ts
 */
export class FileIntegrityVerifier {
  /**
   * Compute file hash with progress reporting
   */
  static async computeFileHash(
    file: File | Blob,
    onProgress?: (percent: number) => void
  ): Promise<{
    hash: Uint8Array;
    hexHash: string;
  }> {
    const hasher = createHasher();
    const chunkSize = 64 * 1024; // 64KB chunks
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

    const hashBytes = hasher.finalize();
    const hexHash = hasher.finalizeHex();

    return { hash: hashBytes, hexHash };
  }

  /**
   * Verify file against expected hash
   */
  static async verifyFileHash(
    file: File | Blob,
    expectedHash: string | Uint8Array
  ): Promise<boolean> {
    const { hash: actualHash, hexHash } = await this.computeFileHash(file);

    if (typeof expectedHash === 'string') {
      return hexHash === expectedHash;
    } else {
      return constantTimeEqual(actualHash, expectedHash);
    }
  }

  /**
   * Create Merkle tree for chunked transfer verification
   */
  static buildChunkMerkleTree(chunks: Uint8Array[]): {
    root: Uint8Array;
    proof: Uint8Array[][];
  } {
    // Hash each chunk
    const leafHashes = chunks.map(chunk => hash(chunk));

    // Build Merkle tree
    let currentLevel = leafHashes;
    const proof: Uint8Array[][] = [];

    while (currentLevel.length > 1) {
      const nextLevel: Uint8Array[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          // Combine pair
          const combined = new Uint8Array(64);
          combined.set(currentLevel[i]!, 0);
          combined.set(currentLevel[i + 1]!, 32);
          nextLevel.push(hash(combined));
        } else {
          // Odd node
          nextLevel.push(currentLevel[i]!);
        }
      }

      proof.push(currentLevel);
      currentLevel = nextLevel;
    }

    return {
      root: currentLevel[0]!,
      proof,
    };
  }
}

// ============================================================================
// Example 4: Content-Addressed Storage
// ============================================================================

/**
 * Content-addressed file storage using BLAKE3
 */
export class ContentAddressedStorage {
  private storage = new Map<string, Uint8Array>();

  /**
   * Store data by its content hash
   */
  store(data: Uint8Array): string {
    const hasher = createHasher();
    hasher.update(data);
    const contentId = hasher.finalizeHex();

    // Only store if not already present (automatic deduplication)
    if (!this.storage.has(contentId)) {
      this.storage.set(contentId, data);
    }

    return contentId;
  }

  /**
   * Retrieve data by content hash
   */
  retrieve(contentId: string): Uint8Array | null {
    return this.storage.get(contentId) || null;
  }

  /**
   * Verify stored data integrity
   */
  verify(contentId: string): boolean {
    const data = this.storage.get(contentId);
    if (!data) {return false;}

    const hasher = createHasher();
    hasher.update(data);
    const actualId = hasher.finalizeHex();

    return actualId === contentId;
  }

  /**
   * Check if content exists without retrieving it
   */
  has(contentId: string): boolean {
    return this.storage.has(contentId);
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    totalItems: number;
    totalBytes: number;
    uniqueContent: number;
  } {
    let totalBytes = 0;
    for (const data of this.storage.values()) {
      totalBytes += data.length;
    }

    return {
      totalItems: this.storage.size,
      totalBytes,
      uniqueContent: this.storage.size,
    };
  }
}

// ============================================================================
// Example 5: Transfer Receipt Generation
// ============================================================================

/**
 * Generate cryptographic receipt for file transfers
 */
export class TransferReceiptGenerator {
  /**
   * Generate transfer receipt
   */
  static generateReceipt(params: {
    fileHash: Uint8Array;
    fileName: string;
    fileSize: number;
    timestamp: number;
    senderId: string;
    receiverId: string;
  }): {
    receipt: Uint8Array;
    receiptHex: string;
  } {
    const hasher = createHasher();

    // Add all receipt components
    hasher.update(params.fileHash);
    hasher.update(new TextEncoder().encode(params.fileName));

    // Add file size
    const sizeBytes = new Uint8Array(8);
    new DataView(sizeBytes.buffer).setBigUint64(0, BigInt(params.fileSize), false);
    hasher.update(sizeBytes);

    // Add timestamp
    const timestampBytes = new Uint8Array(8);
    new DataView(timestampBytes.buffer).setBigUint64(0, BigInt(params.timestamp), false);
    hasher.update(timestampBytes);

    // Add peer identities
    hasher.update(new TextEncoder().encode(params.senderId));
    hasher.update(new TextEncoder().encode(params.receiverId));

    const receipt = hasher.finalize();
    const receiptHex = hasher.finalizeHex();

    return { receipt, receiptHex };
  }

  /**
   * Verify transfer receipt
   */
  static verifyReceipt(
    params: {
      fileHash: Uint8Array;
      fileName: string;
      fileSize: number;
      timestamp: number;
      senderId: string;
      receiverId: string;
    },
    expectedReceipt: Uint8Array | string
  ): boolean {
    const { receipt, receiptHex } = this.generateReceipt(params);

    if (typeof expectedReceipt === 'string') {
      return receiptHex === expectedReceipt;
    } else {
      return constantTimeEqual(receipt, expectedReceipt);
    }
  }
}

// ============================================================================
// Example 6: Session Key Derivation
// ============================================================================

/**
 * Derive multiple session keys from shared secret
 */
export function deriveTransferSessionKeys(
  sharedSecret: Uint8Array,
  sessionId: string
): {
  encryptionKey: Uint8Array;
  authenticationKey: Uint8Array;
  integrityKey: Uint8Array;
  nonceKey: Uint8Array;
} {
  return {
    encryptionKey: deriveKey(`tallow-encryption-${sessionId}`, sharedSecret),
    authenticationKey: deriveKey(`tallow-auth-${sessionId}`, sharedSecret),
    integrityKey: deriveKey(`tallow-integrity-${sessionId}`, sharedSecret),
    nonceKey: deriveKey(`tallow-nonce-${sessionId}`, sharedSecret),
  };
}

// ============================================================================
// Example 7: Performance Comparison Utility
// ============================================================================

/**
 * Compare BLAKE3 vs SHA-256 performance
 */
export async function benchmarkHashFunctions(dataSize: number): Promise<{
  blake3Time: number;
  sha256Time: number;
  speedup: number;
}> {
  const data = new Uint8Array(dataSize);
  crypto.getRandomValues(data);

  // Benchmark BLAKE3
  const blake3Start = performance.now();
  hash(data);
  const blake3Time = performance.now() - blake3Start;

  // Benchmark SHA-256
  const sha256Start = performance.now();
  sha256(data);
  const sha256Time = performance.now() - sha256Start;

  return {
    blake3Time,
    sha256Time,
    speedup: sha256Time / blake3Time,
  };
}

/**
 * Run comprehensive benchmark
 */
export async function runBenchmarkSuite(): Promise<void> {
  console.log('BLAKE3 vs SHA-256 Benchmark Suite');
  console.log('==================================\n');

  const sizes = [
    { label: '1 KB', bytes: 1024 },
    { label: '10 KB', bytes: 10 * 1024 },
    { label: '100 KB', bytes: 100 * 1024 },
    { label: '1 MB', bytes: 1024 * 1024 },
    { label: '10 MB', bytes: 10 * 1024 * 1024 },
  ];

  for (const { label, bytes } of sizes) {
    const result = await benchmarkHashFunctions(bytes);

    console.log(`${label}:`);
    console.log(`  BLAKE3:  ${result.blake3Time.toFixed(2)} ms`);
    console.log(`  SHA-256: ${result.sha256Time.toFixed(2)} ms`);
    console.log(`  Speedup: ${result.speedup.toFixed(2)}x`);
    console.log();
  }
}

// ============================================================================
// Example 8: Migration Helper
// ============================================================================

/**
 * Helper class to gradually migrate from SHA-256 to BLAKE3
 */
export class HashMigrationHelper {
  /**
   * Compute both hashes for verification during migration
   */
  static computeBoth(data: Uint8Array): {
    sha256: Uint8Array;
    blake3: Uint8Array;
  } {
    return {
      sha256: sha256(data),
      blake3: hash(data),
    };
  }

  /**
   * Verify data against either hash type
   */
  static verifyEither(
    data: Uint8Array,
    expectedHash: Uint8Array,
    hashType: 'sha256' | 'blake3'
  ): boolean {
    if (hashType === 'sha256') {
      const actual = sha256(data);
      return constantTimeEqual(actual, expectedHash);
    } else {
      const actual = hash(data);
      return constantTimeEqual(actual, expectedHash);
    }
  }
}

// ============================================================================
// Example 9: Real-World Usage in Component
// ============================================================================

/**
 * Example: File transfer component with BLAKE3 integrity
 */
export class SecureFileTransfer {
  private contentStorage = new ContentAddressedStorage();

  /**
   * Prepare file for transfer
   */
  async prepareFile(file: File): Promise<{
    contentId: string;
    hash: Uint8Array;
    chunks: Uint8Array[];
    merkleRoot: Uint8Array;
  }> {
    // Compute file hash
    const { hash: fileHash } = await FileIntegrityVerifier.computeFileHash(
      file,
      (percent) => console.log(`Hashing: ${percent.toFixed(1)}%`)
    );

    // Split into chunks
    const chunkSize = 64 * 1024;
    const chunks: Uint8Array[] = [];

    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = file.slice(offset, offset + chunkSize);
      const buffer = await chunk.arrayBuffer();
      chunks.push(new Uint8Array(buffer));
    }

    // Build Merkle tree
    const { root } = FileIntegrityVerifier.buildChunkMerkleTree(chunks);

    // Store in content-addressed storage
    const contentId = this.contentStorage.store(new Uint8Array(await file.arrayBuffer()));

    return {
      contentId,
      hash: fileHash,
      chunks,
      merkleRoot: root,
    };
  }

  /**
   * Verify received file
   */
  async verifyReceivedFile(
    file: File,
    expectedHash: string
  ): Promise<boolean> {
    return FileIntegrityVerifier.verifyFileHash(file, expectedHash);
  }

  /**
   * Generate transfer receipt
   */
  generateReceipt(
    fileHash: Uint8Array,
    fileName: string,
    fileSize: number,
    senderId: string,
    receiverId: string
  ): string {
    const { receiptHex } = TransferReceiptGenerator.generateReceipt({
      fileHash,
      fileName,
      fileSize,
      timestamp: Date.now(),
      senderId,
      receiverId,
    });

    return receiptHex;
  }
}

// ============================================================================
// Export Integration Helpers
// ============================================================================

export default {
  combineSecretsBLAKE3,
  BLAKE3KeyDerivation,
  FileIntegrityVerifier,
  ContentAddressedStorage,
  TransferReceiptGenerator,
  deriveTransferSessionKeys,
  benchmarkHashFunctions,
  runBenchmarkSuite,
  HashMigrationHelper,
  SecureFileTransfer,
};
