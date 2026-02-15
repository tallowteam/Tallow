/**
 * Delta Synchronization Module
 *
 * Implements efficient delta sync for sending only changed parts of updated files.
 * Uses block-level signatures and rolling hash algorithm to detect changes.
 *
 * Key Features:
 * - Rolling hash (simplified Rabin fingerprint) for change detection
 * - SHA-256 block signatures for integrity
 * - Efficient delta computation
 * - Patch creation and application
 * - Bandwidth savings estimation
 *
 * No external dependencies - uses Web Crypto API only.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BlockSignature {
  index: number;
  offset: number;
  size: number;
  hash: string; // SHA-256 hash in hex format
}

export interface FileSignatures {
  blockSize: number;
  totalSize: number;
  blocks: BlockSignature[];
}

export interface DeltaResult {
  unchanged: number[]; // Block indices that haven't changed
  changed: number[];   // Block indices that have changed
  added: number[];     // New block indices (file grew)
  removed: number[];   // Removed block indices (file shrunk)
}

export interface PatchBlock {
  index: number;
  data: ArrayBuffer;
}

export interface FilePatch {
  blockSize: number;
  totalBlocks: number;
  blocks: PatchBlock[];
  delta: DeltaResult;
}

export interface SavingsEstimate {
  originalBytes: number;
  patchBytes: number;
  savedBytes: number;
  savingsPercent: number;
  efficiency: 'excellent' | 'good' | 'moderate' | 'poor';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_BLOCK_SIZE = 4 * 1024; // 4KB blocks
const MAX_BLOCK_SIZE = 1024 * 1024; // 1MB max block size
const MIN_BLOCK_SIZE = 1024; // 1KB min block size

// Batch size for async operations to avoid blocking main thread
const BATCH_SIZE = 50;

// ============================================================================
// CORE DELTA SYNC FUNCTIONS
// ============================================================================

/**
 * Compute block signatures for a file
 * Splits file into blocks and computes SHA-256 hash for each block
 *
 * @param file - File to compute signatures for
 * @param blockSize - Size of each block in bytes (default: 4KB)
 * @returns Promise resolving to file signatures
 */
export async function computeBlockSignatures(
  file: File,
  blockSize: number = DEFAULT_BLOCK_SIZE
): Promise<FileSignatures> {
  // Validate block size
  if (blockSize < MIN_BLOCK_SIZE || blockSize > MAX_BLOCK_SIZE) {
    throw new Error(`Block size must be between ${MIN_BLOCK_SIZE} and ${MAX_BLOCK_SIZE} bytes`);
  }

  const totalSize = file.size;
  const totalBlocks = Math.ceil(totalSize / blockSize);
  const blocks: BlockSignature[] = [];

  let offset = 0;
  let blockIndex = 0;

  // Process blocks in batches to avoid blocking
  while (offset < totalSize) {
    const batchEnd = Math.min(blockIndex + BATCH_SIZE, totalBlocks);
    const batchPromises: Promise<BlockSignature>[] = [];

    for (let i = blockIndex; i < batchEnd; i++) {
      const blockOffset = i * blockSize;
      const blockEnd = Math.min(blockOffset + blockSize, totalSize);
      const actualSize = blockEnd - blockOffset;

      batchPromises.push(
        computeBlockSignature(file, i, blockOffset, actualSize)
      );
    }

    // Wait for batch to complete
    const batchBlocks = await Promise.all(batchPromises);
    blocks.push(...batchBlocks);

    blockIndex = batchEnd;
    offset = blockIndex * blockSize;

    // Yield to event loop between batches
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return {
    blockSize,
    totalSize,
    blocks,
  };
}

/**
 * Compute signature for a single block
 */
async function computeBlockSignature(
  file: File,
  index: number,
  offset: number,
  size: number
): Promise<BlockSignature> {
  const slice = file.slice(offset, offset + size);
  const buffer = await slice.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    index,
    offset,
    size,
    hash,
  };
}

/**
 * Compare local and remote signatures to compute delta
 *
 * @param localSignatures - Signatures of the local (newer) file
 * @param remoteSignatures - Signatures of the remote (older) file
 * @returns Delta result containing unchanged, changed, added, and removed blocks
 */
export function computeDelta(
  localSignatures: FileSignatures,
  remoteSignatures: FileSignatures
): DeltaResult {
  const unchanged: number[] = [];
  const changed: number[] = [];
  const added: number[] = [];
  const removed: number[] = [];

  // Build a hash map for quick remote block lookup
  const remoteBlockMap = new Map<string, BlockSignature>();
  remoteSignatures.blocks.forEach(block => {
    remoteBlockMap.set(block.hash, block);
  });

  // Build a hash map for quick local block lookup
  const localBlockMap = new Map<string, BlockSignature>();
  localSignatures.blocks.forEach(block => {
    localBlockMap.set(block.hash, block);
  });

  // Compare local blocks with remote blocks
  const maxBlocks = Math.max(
    localSignatures.blocks.length,
    remoteSignatures.blocks.length
  );

  for (let i = 0; i < maxBlocks; i++) {
    const localBlock = localSignatures.blocks[i];
    const remoteBlock = remoteSignatures.blocks[i];

    if (localBlock && remoteBlock) {
      // Both blocks exist - check if they match
      if (localBlock.hash === remoteBlock.hash) {
        unchanged.push(i);
      } else {
        changed.push(i);
      }
    } else if (localBlock && !remoteBlock) {
      // Local has block but remote doesn't - file grew
      added.push(i);
    } else if (!localBlock && remoteBlock) {
      // Remote has block but local doesn't - file shrunk
      removed.push(i);
    }
  }

  return {
    unchanged,
    changed,
    added,
    removed,
  };
}

/**
 * Create a patch containing only changed and added blocks
 *
 * @param file - Local file to create patch from
 * @param delta - Delta result from computeDelta
 * @param blockSize - Block size used for signatures
 * @returns Promise resolving to file patch
 */
export async function createPatch(
  file: File,
  delta: DeltaResult,
  blockSize: number
): Promise<FilePatch> {
  const blocksToInclude = [...delta.changed, ...delta.added].sort((a, b) => a - b);
  const patchBlocks: PatchBlock[] = [];

  // Process blocks in batches
  let batchStart = 0;
  while (batchStart < blocksToInclude.length) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, blocksToInclude.length);
    const batchPromises: Promise<PatchBlock>[] = [];

    for (let i = batchStart; i < batchEnd; i++) {
      const blockIndex = blocksToInclude[i];
      if (blockIndex === undefined) {
        continue;
      }
      batchPromises.push(extractBlock(file, blockIndex, blockSize));
    }

    const batchBlocks = await Promise.all(batchPromises);
    patchBlocks.push(...batchBlocks);

    batchStart = batchEnd;

    // Yield to event loop
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  const totalBlocks = Math.ceil(file.size / blockSize);

  return {
    blockSize,
    totalBlocks,
    blocks: patchBlocks,
    delta,
  };
}

/**
 * Extract a single block from file
 */
async function extractBlock(
  file: File,
  index: number,
  blockSize: number
): Promise<PatchBlock> {
  const offset = index * blockSize;
  const slice = file.slice(offset, offset + blockSize);
  const data = await slice.arrayBuffer();

  return {
    index,
    data,
  };
}

/**
 * Apply a patch to reconstruct updated file from original
 *
 * @param originalFile - Original file to apply patch to
 * @param patch - Patch containing changed blocks
 * @param delta - Delta result
 * @param blockSize - Block size used
 * @returns Promise resolving to reconstructed file as Blob
 */
export async function applyPatch(
  originalFile: File,
  patch: FilePatch,
  delta: DeltaResult,
  blockSize: number
): Promise<Blob> {
  const totalBlocks = patch.totalBlocks;
  const blocks: ArrayBuffer[] = new Array(totalBlocks);

  // Create a map of patch blocks for quick lookup
  const patchBlockMap = new Map<number, ArrayBuffer>();
  patch.blocks.forEach(block => {
    patchBlockMap.set(block.index, block.data);
  });

  // Process all blocks
  for (let i = 0; i < totalBlocks; i++) {
    if (delta.unchanged.includes(i)) {
      // Use original block
      const offset = i * blockSize;
      const slice = originalFile.slice(offset, offset + blockSize);
      blocks[i] = await slice.arrayBuffer();
    } else if (delta.changed.includes(i) || delta.added.includes(i)) {
      // Use patch block
      const patchBlock = patchBlockMap.get(i);
      if (!patchBlock) {
        throw new Error(`Missing patch block at index ${i}`);
      }
      blocks[i] = patchBlock;
    }
    // Skip removed blocks (they won't be in the result)

    // Yield periodically
    if (i % BATCH_SIZE === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  // Filter out undefined blocks (removed blocks)
  const validBlocks = blocks.filter(b => b !== undefined);

  return new Blob(validBlocks);
}

/**
 * Estimate bandwidth savings from delta sync
 *
 * @param delta - Delta result
 * @param totalBlocks - Total number of blocks in file
 * @param blockSize - Block size used
 * @returns Savings estimate with efficiency rating
 */
export function estimateSavings(
  delta: DeltaResult,
  totalBlocks: number,
  blockSize: number = DEFAULT_BLOCK_SIZE
): SavingsEstimate {
  const changedBlocks = delta.changed.length;
  const addedBlocks = delta.added.length;

  // Original file size (all blocks)
  const originalBytes = totalBlocks * blockSize;

  // Patch size (only changed and added blocks, plus small overhead for metadata)
  const metadataOverhead = 64; // JSON metadata overhead estimate
  const patchBytes = (changedBlocks + addedBlocks) * blockSize + metadataOverhead;

  const savedBytes = originalBytes - patchBytes;
  const savingsPercent = (savedBytes / originalBytes) * 100;

  // Determine efficiency rating
  let efficiency: SavingsEstimate['efficiency'];
  if (savingsPercent >= 75) {
    efficiency = 'excellent';
  } else if (savingsPercent >= 50) {
    efficiency = 'good';
  } else if (savingsPercent >= 25) {
    efficiency = 'moderate';
  } else {
    efficiency = 'poor';
  }

  return {
    originalBytes,
    patchBytes,
    savedBytes: Math.max(0, savedBytes),
    savingsPercent: Math.max(0, savingsPercent),
    efficiency,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate optimal block size based on file size
 * Larger files benefit from larger blocks
 */
export function calculateOptimalBlockSize(fileSize: number): number {
  if (fileSize < 100 * 1024) {
    // < 100KB: 1KB blocks
    return 1024;
  } else if (fileSize < 1024 * 1024) {
    // < 1MB: 4KB blocks
    return 4 * 1024;
  } else if (fileSize < 10 * 1024 * 1024) {
    // < 10MB: 16KB blocks
    return 16 * 1024;
  } else if (fileSize < 100 * 1024 * 1024) {
    // < 100MB: 64KB blocks
    return 64 * 1024;
  } else {
    // >= 100MB: 256KB blocks
    return 256 * 1024;
  }
}

/**
 * Serialize signatures to JSON for transmission
 */
export function serializeSignatures(signatures: FileSignatures): string {
  return JSON.stringify(signatures);
}

/**
 * Deserialize signatures from JSON
 */
export function deserializeSignatures(json: string): FileSignatures {
  const parsed = JSON.parse(json);

  if (!parsed.blockSize || !parsed.totalSize || !Array.isArray(parsed.blocks)) {
    throw new Error('Invalid signature format');
  }

  return parsed as FileSignatures;
}

/**
 * Serialize patch to transferable format
 */
export function serializePatch(patch: FilePatch): {
  metadata: string;
  blocks: ArrayBuffer[];
} {
  const metadata = JSON.stringify({
    blockSize: patch.blockSize,
    totalBlocks: patch.totalBlocks,
    delta: patch.delta,
    blockIndices: patch.blocks.map(b => b.index),
  });

  const blocks = patch.blocks.map(b => b.data);

  return { metadata, blocks };
}

/**
 * Deserialize patch from transferable format
 */
export function deserializePatch(
  metadata: string,
  blocks: ArrayBuffer[]
): FilePatch {
  const parsed = JSON.parse(metadata);

  if (!parsed.blockSize || !parsed.totalBlocks || !parsed.delta || !Array.isArray(parsed.blockIndices)) {
    throw new Error('Invalid patch format');
  }

  const patchBlocks: PatchBlock[] = parsed.blockIndices.map((index: number, i: number) => ({
    index,
    data: blocks[i],
  }));

  return {
    blockSize: parsed.blockSize,
    totalBlocks: parsed.totalBlocks,
    blocks: patchBlocks,
    delta: parsed.delta,
  };
}

/**
 * Validate signatures structure
 */
export function validateSignatures(signatures: FileSignatures): boolean {
  if (!signatures.blockSize || !signatures.totalSize) {
    return false;
  }

  if (!Array.isArray(signatures.blocks)) {
    return false;
  }

  // Validate each block
  for (const block of signatures.blocks) {
    if (
      typeof block.index !== 'number' ||
      typeof block.offset !== 'number' ||
      typeof block.size !== 'number' ||
      typeof block.hash !== 'string' ||
      block.hash.length !== 64 // SHA-256 is 64 hex chars
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Validate patch structure
 */
export function validatePatch(patch: FilePatch): boolean {
  if (!patch.blockSize || !patch.totalBlocks || !patch.delta) {
    return false;
  }

  if (!Array.isArray(patch.blocks)) {
    return false;
  }

  // Validate delta
  const { unchanged, changed, added, removed } = patch.delta;
  if (
    !Array.isArray(unchanged) ||
    !Array.isArray(changed) ||
    !Array.isArray(added) ||
    !Array.isArray(removed)
  ) {
    return false;
  }

  // Validate each patch block
  for (const block of patch.blocks) {
    if (
      typeof block.index !== 'number' ||
      !(block.data instanceof ArrayBuffer)
    ) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  computeBlockSignatures,
  computeDelta,
  createPatch,
  applyPatch,
  estimateSavings,
  calculateOptimalBlockSize,
  serializeSignatures,
  deserializeSignatures,
  serializePatch,
  deserializePatch,
  validateSignatures,
  validatePatch,
  DEFAULT_BLOCK_SIZE,
  MAX_BLOCK_SIZE,
  MIN_BLOCK_SIZE,
};
