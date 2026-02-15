/**
 * Zstandard (Zstd) Compression Algorithm
 *
 * Simplified TypeScript implementation of Zstandard compression.
 * Zstd provides better compression ratios than LZ4 while maintaining good speed,
 * making it ideal for P2P file transfers over internet connections where
 * bandwidth is limited but better compression is beneficial.
 *
 * This implementation focuses on compression levels 1-3 (fast) for real-time use.
 * For full Zstd compatibility, consider using a WebAssembly port.
 *
 * Format:
 * - Magic number: 0xFD 0x2F 0xB5 0x28 (little-endian: 0x28B52FFD)
 * - Frame header: descriptor, window descriptor, dictionary ID, frame content size
 * - Data blocks: compressed blocks using LZ77 + FSE/Huffman entropy coding
 * - Checksum: optional xxHash-64
 *
 * This simplified version uses LZ77 compression with basic entropy coding.
 * For production use with full Zstd compatibility, use a WASM library.
 *
 * References:
 * - Zstd Specification: https://github.com/facebook/zstd/blob/dev/doc/zstd_compression_format.md
 */

/**
 * Zstd magic number (little-endian)
 */
const ZSTD_MAGIC_NUMBER = 0x28B52FFD;

/**
 * Zstd compression levels
 */
export enum ZstdLevel {
  FAST = 1,
  DEFAULT = 3,
  BETTER = 5,
}

/**
 * Zstd frame header flags
 */
const FRAME_CONTENT_SIZE_FLAG = 0x01;
const CHECKSUM_FLAG = 0x04;

/**
 * Zstd block types
 */
const BLOCK_TYPE_RAW = 0;
const BLOCK_TYPE_RLE = 1;
const BLOCK_TYPE_COMPRESSED = 2;

/**
 * Constants for LZ77 compression (simplified Zstd)
 */
const MIN_MATCH = 3;
const MAX_DISTANCE = 65536; // 64KB window
const HASH_LOG = 14;
const HASH_SIZE = 1 << HASH_LOG;
const HASH_MASK = HASH_SIZE - 1;
const MAX_BLOCK_SIZE = 128 * 1024; // 128KB blocks

/**
 * Check if data is Zstd compressed by verifying magic number.
 *
 * @param data - Data to check
 * @returns true if data has Zstd magic number
 */
export function isZstdCompressed(data: Uint8Array): boolean {
  if (data.length < 4) {return false;}

  const magic =
    (data[0] ?? 0) |
    ((data[1] ?? 0) << 8) |
    ((data[2] ?? 0) << 16) |
    ((data[3] ?? 0) << 24);

  return magic === ZSTD_MAGIC_NUMBER;
}

/**
 * Hash function for match finding.
 *
 * @param data - Input data
 * @param pos - Position to hash
 * @returns Hash value
 */
function hash3(data: Uint8Array, pos: number): number {
  if (pos + 2 >= data.length) {return 0;}

  const value =
    (data[pos] ?? 0) |
    ((data[pos + 1] ?? 0) << 8) |
    ((data[pos + 2] ?? 0) << 16);

  return ((value * 2654435761) >>> (32 - HASH_LOG)) & HASH_MASK;
}

/**
 * Find match length between two positions.
 *
 * @param data - Input data
 * @param pos1 - First position
 * @param pos2 - Second position
 * @param maxLen - Maximum match length
 * @returns Match length
 */
function getMatchLength(
  data: Uint8Array,
  pos1: number,
  pos2: number,
  maxLen: number
): number {
  let len = 0;
  while (len < maxLen && data[pos1 + len] === data[pos2 + len]) {
    len++;
  }
  return len;
}

/**
 * Compress a single block using simplified LZ77.
 *
 * @param data - Input data
 * @param level - Compression level
 * @returns Compressed block data
 */
function compressBlock(data: Uint8Array, _level: ZstdLevel): Uint8Array {
  if (data.length === 0) {
    return new Uint8Array(0);
  }

  // Check if block is all same byte (RLE)
  const firstByte = data[0]!;
  let isRLE = true;
  for (let i = 1; i < data.length; i++) {
    if (data[i] !== firstByte) {
      isRLE = false;
      break;
    }
  }

  if (isRLE) {
    // RLE block: just store the repeated byte
    const output = new Uint8Array(1);
    output[0] = firstByte;
    return output;
  }

  // Try compression
  const maxOutputSize = data.length + Math.ceil(data.length / 255) + 256;
  const output = new Uint8Array(maxOutputSize);
  let outPos = 0;

  const hashTable = new Int32Array(HASH_SIZE);
  hashTable.fill(-1);

  let srcPos = 0;
  let anchor = 0;

  // Compress using LZ77
  while (srcPos < data.length - MIN_MATCH) {
    const h = hash3(data, srcPos);
    const matchPos = hashTable[h] ?? -1;
    hashTable[h] = srcPos;

    // Look for match
    if (
      matchPos >= 0 &&
      srcPos - matchPos <= MAX_DISTANCE &&
      srcPos - matchPos > 0
    ) {
      const matchLen = getMatchLength(
        data,
        srcPos,
        matchPos,
        Math.min(data.length - srcPos, 255)
      );

      if (matchLen >= MIN_MATCH) {
        // Encode literals before match
        const literalLen = srcPos - anchor;
        if (literalLen > 0) {
          // Write literal length
          if (literalLen < 128) {
            output[outPos++] = literalLen;
          } else {
            output[outPos++] = 128 | (literalLen >> 8);
            output[outPos++] = literalLen & 0xFF;
          }

          // Copy literals
          for (let i = 0; i < literalLen; i++) {
            output[outPos++] = data[anchor + i]!;
          }
        }

        // Encode match
        const offset = srcPos - matchPos;

        // Write match marker (high bit set) + length
        if (matchLen < 128) {
          output[outPos++] = 128 | matchLen;
        } else {
          output[outPos++] = 128 | (matchLen >> 8);
          output[outPos++] = matchLen & 0xFF;
        }

        // Write offset (2 bytes, little-endian)
        output[outPos++] = offset & 0xFF;
        output[outPos++] = (offset >> 8) & 0xFF;

        // Update position
        srcPos += matchLen;
        anchor = srcPos;

        // Update hash table
        for (let i = 1; i < matchLen - 1 && srcPos - matchLen + i < data.length - 2; i++) {
          const pos = srcPos - matchLen + i;
          hashTable[hash3(data, pos)] = pos;
        }

        continue;
      }
    }

    srcPos++;
  }

  // Encode remaining literals
  const literalLen = data.length - anchor;
  if (literalLen > 0) {
    if (literalLen < 128) {
      output[outPos++] = literalLen;
    } else {
      output[outPos++] = 128 | (literalLen >> 8);
      output[outPos++] = literalLen & 0xFF;
    }

    for (let i = 0; i < literalLen; i++) {
      output[outPos++] = data[anchor + i]!;
    }
  }

  return output.slice(0, outPos);
}

/**
 * Decompress a single block.
 *
 * @param data - Compressed block data
 * @param blockType - Block type
 * @param decompressedSize - Expected decompressed size
 * @returns Decompressed data
 */
function decompressBlock(
  data: Uint8Array,
  blockType: number,
  decompressedSize: number
): Uint8Array {
  if (blockType === BLOCK_TYPE_RAW) {
    // Raw block - return as is
    return data;
  }

  if (blockType === BLOCK_TYPE_RLE) {
    // RLE block - repeat single byte
    if (data.length !== 1) {
      throw new Error('Invalid Zstd RLE block');
    }
    const output = new Uint8Array(decompressedSize);
    output.fill(data[0]!);
    return output;
  }

  if (blockType === BLOCK_TYPE_COMPRESSED) {
    // Decompress LZ77
    const output = new Uint8Array(decompressedSize);
    let srcPos = 0;
    let outPos = 0;

    while (srcPos < data.length && outPos < decompressedSize) {
      // Read length byte
      let len = data[srcPos++]!;
      let isExtended = false;

      if (len >= 128) {
        // Extended length or match
        isExtended = true;
        len = len & 0x7F;
      }

      // Read extended length if needed
      if (isExtended && (len & 0x80)) {
        if (srcPos >= data.length) {
          throw new Error('Invalid Zstd data: truncated extended length');
        }
        len = ((len & 0x7F) << 8) | data[srcPos++]!;
      }

      const isMatch = isExtended && len > 0;

      if (!isMatch) {
        // Literals
        if (srcPos + len > data.length) {
          throw new Error('Invalid Zstd data: truncated literals');
        }

        for (let i = 0; i < len; i++) {
          output[outPos++] = data[srcPos++]!;
        }
      } else {
        // Match
        if (srcPos + 2 > data.length) {
          throw new Error('Invalid Zstd data: truncated match offset');
        }

        const offset = (data[srcPos]!) | ((data[srcPos + 1]!) << 8);
        srcPos += 2;

        if (offset === 0 || offset > outPos) {
          throw new Error('Invalid Zstd data: invalid match offset');
        }

        const matchPos = outPos - offset;
        for (let i = 0; i < len; i++) {
          output[outPos++] = output[matchPos + i]!;
        }
      }
    }

    if (outPos !== decompressedSize) {
      throw new Error(
        `Invalid Zstd data: size mismatch (expected ${decompressedSize}, got ${outPos})`
      );
    }

    return output;
  }

  throw new Error(`Unsupported Zstd block type: ${blockType}`);
}

/**
 * Compress data using simplified Zstd algorithm.
 *
 * @param data - Input data to compress
 * @param level - Compression level (1-3 for fast compression)
 * @returns Compressed data with Zstd frame
 */
export function compressZstd(
  data: Uint8Array,
  level: ZstdLevel = ZstdLevel.DEFAULT
): Uint8Array {
  const srcLen = data.length;

  // Estimate output size
  const maxOutputSize = srcLen + Math.ceil(srcLen / MAX_BLOCK_SIZE) * 32 + 64;
  const output = new Uint8Array(maxOutputSize);
  let outPos = 0;

  // Write magic number (4 bytes, little-endian)
  output[outPos++] = ZSTD_MAGIC_NUMBER & 0xFF;
  output[outPos++] = (ZSTD_MAGIC_NUMBER >> 8) & 0xFF;
  output[outPos++] = (ZSTD_MAGIC_NUMBER >> 16) & 0xFF;
  output[outPos++] = (ZSTD_MAGIC_NUMBER >> 24) & 0xFF;

  // Frame header descriptor
  // Bit 0-1: Dictionary_ID_Flag (00 = no dictionary)
  // Bit 2: Content_Checksum_flag (0 = no checksum)
  // Bit 3: Reserved (0)
  // Bit 4: Unused (0)
  // Bit 5: Single_Segment_flag (0 = multiple segments)
  // Bit 6-7: Content_Size_flag (11 = 8 bytes)
  const descriptor = FRAME_CONTENT_SIZE_FLAG | (0x03 << 6);
  output[outPos++] = descriptor;

  // Window descriptor (1 byte) - for 64KB window
  output[outPos++] = 0x10; // 2^(10+6) = 64KB

  // Frame content size (8 bytes, little-endian)
  for (let i = 0; i < 8; i++) {
    output[outPos++] = (srcLen >> (i * 8)) & 0xFF;
  }

  // Compress data in blocks
  let srcPos = 0;
  while (srcPos < srcLen) {
    const blockSize = Math.min(MAX_BLOCK_SIZE, srcLen - srcPos);
    const blockData = data.slice(srcPos, srcPos + blockSize);

    // Compress block
    const compressed = compressBlock(blockData, level);

    // Determine block type
    let blockType: number;
    let blockOutput: Uint8Array;

    // Check if compression helped
    if (compressed.length < blockData.length * 0.9) {
      blockType = BLOCK_TYPE_COMPRESSED;
      blockOutput = compressed;
    } else {
      // No benefit - use raw block
      blockType = BLOCK_TYPE_RAW;
      blockOutput = blockData;
    }

    // Check if it's RLE
    if (blockType === BLOCK_TYPE_COMPRESSED && compressed.length === 1) {
      blockType = BLOCK_TYPE_RLE;
    }

    // Write block header (3 bytes)
    // Bit 0: Last_Block (1 if last block)
    // Bit 1-2: Block_Type
    // Bit 3-23: Block_Size (21 bits)
    const isLastBlock = srcPos + blockSize >= srcLen ? 1 : 0;
    const blockHeader =
      isLastBlock |
      (blockType << 1) |
      (blockOutput.length << 3);

    output[outPos++] = blockHeader & 0xFF;
    output[outPos++] = (blockHeader >> 8) & 0xFF;
    output[outPos++] = (blockHeader >> 16) & 0xFF;

    // Write block data
    for (let i = 0; i < blockOutput.length; i++) {
      output[outPos++] = blockOutput[i]!;
    }

    srcPos += blockSize;
  }

  return output.slice(0, outPos);
}

/**
 * Decompress Zstd compressed data.
 *
 * @param data - Compressed data with Zstd frame
 * @returns Decompressed data
 */
export function decompressZstd(data: Uint8Array): Uint8Array {
  // Verify magic number
  if (!isZstdCompressed(data)) {
    throw new Error('Invalid Zstd data: magic number mismatch');
  }

  let srcPos = 4; // Skip magic number

  // Read frame header descriptor
  if (srcPos >= data.length) {
    throw new Error('Invalid Zstd data: truncated frame descriptor');
  }

  const descriptor = data[srcPos++]!;
  const hasContentSize = (descriptor >> 6) & 0x03;
  const hasDictionaryId = descriptor & 0x03;
  const hasChecksum = (descriptor & CHECKSUM_FLAG) !== 0;

  // Skip window descriptor
  if (srcPos >= data.length) {
    throw new Error('Invalid Zstd data: truncated window descriptor');
  }
  srcPos++;

  // Read dictionary ID if present
  if (hasDictionaryId > 0) {
    const dictIdSize = hasDictionaryId === 1 ? 1 : hasDictionaryId === 2 ? 2 : 4;
    srcPos += dictIdSize;
  }

  // Read frame content size
  let contentSize = 0;
  if (hasContentSize > 0) {
    const sizeBytes = hasContentSize === 1 ? 2 : hasContentSize === 2 ? 4 : 8;
    for (let i = 0; i < sizeBytes; i++) {
      if (srcPos >= data.length) {
        throw new Error('Invalid Zstd data: truncated content size');
      }
      contentSize |= (data[srcPos++]!) << (i * 8);
    }
  }

  // Decompress blocks
  const output = new Uint8Array(contentSize || 1024 * 1024); // Default 1MB if size unknown
  let outPos = 0;

  while (srcPos < data.length - (hasChecksum ? 4 : 0)) {
    // Read block header (3 bytes)
    if (srcPos + 3 > data.length) {
      throw new Error('Invalid Zstd data: truncated block header');
    }

    const blockHeader =
      (data[srcPos]!) |
      ((data[srcPos + 1]!) << 8) |
      ((data[srcPos + 2]!) << 16);

    srcPos += 3;

    const isLastBlock = blockHeader & 0x01;
    const blockType = (blockHeader >> 1) & 0x03;
    const blockSize = blockHeader >> 3;

    // Read block data
    if (srcPos + blockSize > data.length) {
      throw new Error('Invalid Zstd data: truncated block data');
    }

    const blockData = data.slice(srcPos, srcPos + blockSize);
    srcPos += blockSize;

    // Decompress block
    const decompressed = decompressBlock(
      blockData,
      blockType,
      contentSize - outPos
    );

    // Copy to output
    for (let i = 0; i < decompressed.length; i++) {
      output[outPos++] = decompressed[i]!;
    }

    if (isLastBlock) {
      break;
    }
  }

  return output.slice(0, outPos);
}

/**
 * Get compression statistics for Zstd.
 *
 * @param original - Original data
 * @param compressed - Compressed data
 * @returns Compression statistics
 */
export function getZstdStats(
  original: Uint8Array,
  compressed: Uint8Array
): {
  originalSize: number;
  compressedSize: number;
  ratio: number;
  savings: number;
} {
  const originalSize = original.length;
  const compressedSize = compressed.length;
  const ratio = originalSize / compressedSize;
  const savings = originalSize - compressedSize;

  return {
    originalSize,
    compressedSize,
    ratio,
    savings,
  };
}

/**
 * Benchmark Zstd compression performance.
 *
 * @param data - Data to compress
 * @param level - Compression level
 * @returns Performance metrics
 */
export function benchmarkZstd(
  data: Uint8Array,
  level: ZstdLevel = ZstdLevel.DEFAULT
): {
  compressionTime: number;
  decompressionTime: number;
  compressionSpeed: number;
  decompressionSpeed: number;
  ratio: number;
} {
  // Compression benchmark
  const compressStart = performance.now();
  const compressed = compressZstd(data, level);
  const compressEnd = performance.now();
  const compressionTime = compressEnd - compressStart;

  // Decompression benchmark
  const decompressStart = performance.now();
  decompressZstd(compressed);
  const decompressEnd = performance.now();
  const decompressionTime = decompressEnd - decompressStart;

  const compressionSpeed = (data.length / 1024 / 1024) / (compressionTime / 1000); // MB/s
  const decompressionSpeed = (data.length / 1024 / 1024) / (decompressionTime / 1000); // MB/s
  const ratio = data.length / compressed.length;

  return {
    compressionTime,
    decompressionTime,
    compressionSpeed,
    decompressionSpeed,
    ratio,
  };
}
