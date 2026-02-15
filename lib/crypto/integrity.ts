/**
 * Merkle Tree Integrity Verification
 * Agent 009 -- HASH-ORACLE
 *
 * Builds Merkle trees from file chunks for integrity verification.
 * Uses BLAKE3 for all hashing (Agent 009 mandate: BLAKE3 preferred).
 *
 * Features:
 * - Per-chunk BLAKE3 hash verification
 * - Efficient partial retransmission (only re-send failed chunks)
 * - Streaming tree construction (process chunks as they arrive)
 * - Proof generation for individual chunk verification
 * - Full-file root hash verification on transfer completion
 */

import {
  hash as blake3Hash,
  hashChunkToHex,
  verifyChunkHash,
  constantTimeEqual,
} from './hashing';

// ============================================================================
// TYPES
// ============================================================================

export interface MerkleNode {
  hash: Uint8Array;
  left?: MerkleNode;
  right?: MerkleNode;
  /** Chunk index (leaf nodes only) */
  chunkIndex?: number;
}

export interface MerkleTree {
  root: MerkleNode;
  rootHash: string;
  leafCount: number;
  depth: number;
}

export interface MerkleProof {
  chunkIndex: number;
  chunkHash: Uint8Array;
  siblings: Array<{ hash: Uint8Array; position: 'left' | 'right' }>;
  rootHash: string;
}

export interface ChunkIntegrity {
  index: number;
  hash: string;
  size: number;
  verified: boolean;
}

export interface FileIntegrityManifest {
  /** Merkle root hash (hex) -- transmitted before file transfer begins. */
  rootHash: string;
  /** Per-chunk BLAKE3 hashes (hex) in index order. */
  chunkHashes: string[];
  /** Total number of chunks. */
  totalChunks: number;
  /** Original file size in bytes. */
  fileSize: number;
}

// ============================================================================
// HASHING (BLAKE3)
// ============================================================================

function hashData(data: Uint8Array): Uint8Array {
  return blake3Hash(data);
}

function hashPair(left: Uint8Array, right: Uint8Array): Uint8Array {
  const combined = new Uint8Array(left.length + right.length);
  combined.set(left, 0);
  combined.set(right, left.length);
  return hashData(combined);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// MERKLE TREE CONSTRUCTION
// ============================================================================

/**
 * Build a Merkle tree from an array of chunk data.
 * Every chunk is hashed -- no skipping, no sampling.
 */
export function buildMerkleTree(chunks: Uint8Array[]): MerkleTree {
  if (chunks.length === 0) {
    throw new Error('Cannot build Merkle tree from zero chunks');
  }

  // Hash all leaf nodes (every chunk hashed -- Agent 009 mandate)
  const leaves: MerkleNode[] = chunks.map((chunk, i) => ({
    hash: hashData(chunk),
    chunkIndex: i,
  }));

  // Build tree bottom-up
  let currentLevel = leaves;
  let depth = 0;

  while (currentLevel.length > 1) {
    const nextLevel: MerkleNode[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i]!;
      const right = currentLevel[i + 1] ?? left; // Duplicate last node if odd

      nextLevel.push({
        hash: hashPair(left.hash, right.hash),
        left,
        ...(currentLevel[i + 1] ? { right } : {}),
      });
    }

    currentLevel = nextLevel;
    depth++;
  }

  const root = currentLevel[0]!;

  return {
    root,
    rootHash: toHex(root.hash),
    leafCount: leaves.length,
    depth,
  };
}

/**
 * Build a Merkle tree from pre-computed chunk hashes (hex strings).
 */
export function buildMerkleTreeFromHashes(hashes: string[]): MerkleTree {
  if (hashes.length === 0) {
    throw new Error('Cannot build Merkle tree from zero hashes');
  }

  const leaves: MerkleNode[] = hashes.map((hex, i) => ({
    hash: new Uint8Array(hex.match(/.{2}/g)!.map(b => parseInt(b, 16))),
    chunkIndex: i,
  }));

  let currentLevel = leaves;
  let depth = 0;

  while (currentLevel.length > 1) {
    const nextLevel: MerkleNode[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i]!;
      const right = currentLevel[i + 1] ?? left;

      nextLevel.push({
        hash: hashPair(left.hash, right.hash),
        left,
        ...(currentLevel[i + 1] ? { right } : {}),
      });
    }

    currentLevel = nextLevel;
    depth++;
  }

  const root = currentLevel[0]!;

  return {
    root,
    rootHash: toHex(root.hash),
    leafCount: leaves.length,
    depth,
  };
}

// ============================================================================
// FILE INTEGRITY MANIFEST
// ============================================================================

/**
 * Create a file integrity manifest from raw chunk data.
 * The sender computes this BEFORE transfer and transmits the rootHash first.
 */
export function createFileIntegrityManifest(
  chunks: Uint8Array[],
  fileSize: number,
): FileIntegrityManifest {
  const chunkHashes = chunks.map(chunk => hashChunkToHex(chunk));
  const tree = buildMerkleTreeFromHashes(chunkHashes);

  return {
    rootHash: tree.rootHash,
    chunkHashes,
    totalChunks: chunks.length,
    fileSize,
  };
}

/**
 * Verify a complete file transfer against a previously received manifest.
 * This is the "full file hash verified on completion" gate.
 *
 * Returns an object with:
 * - `valid`: true if root hash matches
 * - `corruptedChunks`: indices of chunks whose hashes do not match
 */
export function verifyFileIntegrity(
  receivedChunks: Uint8Array[],
  manifest: FileIntegrityManifest,
): { valid: boolean; corruptedChunks: number[] } {
  if (receivedChunks.length !== manifest.totalChunks) {
    return {
      valid: false,
      corruptedChunks: [],
    };
  }

  const corruptedChunks: number[] = [];

  // Check every chunk hash
  for (let i = 0; i < receivedChunks.length; i++) {
    const chunk = receivedChunks[i]!;
    const expectedHex = manifest.chunkHashes[i]!;
    if (!verifyChunkHash(chunk, expectedHex)) {
      corruptedChunks.push(i);
    }
  }

  if (corruptedChunks.length > 0) {
    return { valid: false, corruptedChunks };
  }

  // Rebuild Merkle tree from received chunk hashes and verify root
  const receivedHashes = receivedChunks.map(chunk => hashChunkToHex(chunk));
  const tree = buildMerkleTreeFromHashes(receivedHashes);

  const enc = new TextEncoder();
  const rootMatch = constantTimeEqual(
    enc.encode(tree.rootHash),
    enc.encode(manifest.rootHash),
  );

  return { valid: rootMatch, corruptedChunks: rootMatch ? [] : [] };
}

// ============================================================================
// PROOF GENERATION & VERIFICATION
// ============================================================================

/**
 * Generate a Merkle proof for a specific chunk index.
 */
export function generateProof(tree: MerkleTree, chunkIndex: number): MerkleProof | null {
  if (chunkIndex < 0 || chunkIndex >= tree.leafCount) { return null; }

  const siblings: MerkleProof['siblings'] = [];

  function findPath(node: MerkleNode, target: number): boolean {
    if (node.chunkIndex === target && !node.left && !node.right) {
      return true;
    }

    if (node.left && findPath(node.left, target)) {
      if (node.right) {
        siblings.push({ hash: node.right.hash, position: 'right' });
      }
      return true;
    }

    if (node.right && findPath(node.right, target)) {
      if (node.left) {
        siblings.push({ hash: node.left.hash, position: 'left' });
      }
      return true;
    }

    return false;
  }

  const found = findPath(tree.root, chunkIndex);
  if (!found) { return null; }

  // Find the leaf hash
  function findLeaf(node: MerkleNode): Uint8Array | null {
    if (node.chunkIndex === chunkIndex) { return node.hash; }
    if (node.left) {
      const result = findLeaf(node.left);
      if (result) { return result; }
    }
    if (node.right) {
      const result = findLeaf(node.right);
      if (result) { return result; }
    }
    return null;
  }

  const chunkHash = findLeaf(tree.root);
  if (!chunkHash) { return null; }

  return {
    chunkIndex,
    chunkHash,
    siblings,
    rootHash: tree.rootHash,
  };
}

/**
 * Verify a Merkle proof against the expected root hash.
 *
 * SECURITY: Uses constant-time comparison to prevent timing oracle attacks.
 * An attacker who can measure verification time must not learn anything
 * about how many bytes of the root hash matched.
 */
export function verifyProof(proof: MerkleProof): boolean {
  let currentHash = proof.chunkHash;

  for (const sibling of proof.siblings) {
    if (sibling.position === 'right') {
      currentHash = hashPair(currentHash, sibling.hash);
    } else {
      currentHash = hashPair(sibling.hash, currentHash);
    }
  }

  const enc = new TextEncoder();
  return constantTimeEqual(
    enc.encode(toHex(currentHash)),
    enc.encode(proof.rootHash),
  );
}

/**
 * Verify a single chunk against its expected hash.
 */
export function verifyChunk(
  chunkData: Uint8Array,
  expectedHash: string,
): boolean {
  return verifyChunkHash(chunkData, expectedHash);
}

/**
 * Hash a single chunk and return hex string.
 */
export function hashChunk(chunkData: Uint8Array): string {
  return hashChunkToHex(chunkData);
}
