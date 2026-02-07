/**
 * LZ4 Compression Algorithm
 *
 * Pure TypeScript implementation of LZ4 block compression.
 * LZ4 is optimized for speed over compression ratio, making it ideal for real-time
 * P2P file transfers over LAN where bandwidth is high but CPU efficiency matters.
 *
 * Format:
 * - Magic number: 0x04 0x22 0x4D 0x18 (for framed format)
 * - Block format: sequences of (token, literal, offset, match)
 * - Token byte: high 4 bits = literal length, low 4 bits = match length
 *
 * References:
 * - LZ4 Block Format: https://github.com/lz4/lz4/blob/dev/doc/lz4_Block_format.md
 * - LZ4 Frame Format: https://github.com/lz4/lz4/blob/dev/doc/lz4_frame_format.md
 */

/**
 * LZ4 magic number for framed format
 */
const LZ4_MAGIC_NUMBER = 0x184D2204; // Little-endian: 0x04 0x22 0x4D 0x18

/**
 * LZ4 compression constants
 */
const MIN_MATCH = 4; // Minimum match length
const MFLIMIT = 12; // Match finder limit
const HASH_LOG = 12; // Hash table size (2^12 = 4096)
const HASH_SIZE = 1 << HASH_LOG;
const HASH_MASK = HASH_SIZE - 1;
const MAX_DISTANCE = 65535; // Maximum offset distance (16-bit)

/**
 * Check if data is LZ4 compressed by verifying magic number.
 *
 * @param data - Data to check
 * @returns true if data has LZ4 magic number
 */
export function isLZ4Compressed(data: Uint8Array): boolean {
  if (data.length < 4) return false;

  const magic =
    (data[0] ?? 0) | ((data[1] ?? 0) << 8) | ((data[2] ?? 0) << 16) | ((data[3] ?? 0) << 24);

  return magic === LZ4_MAGIC_NUMBER;
}

/**
 * Hash function for LZ4 match finding.
 *
 * @param data - Input data
 * @param pos - Position to hash
 * @returns Hash value
 */
function hash4(data: Uint8Array, pos: number): number {
  // Read 4 bytes as little-endian 32-bit integer
  const value =
    (data[pos] ?? 0) |
    ((data[pos + 1] ?? 0) << 8) |
    ((data[pos + 2] ?? 0) << 16) |
    ((data[pos + 3] ?? 0) << 24);

  // Hash using multiply-shift
  return ((value * 2654435761) >>> (32 - HASH_LOG)) & HASH_MASK;
}

/**
 * Find match length between two positions in data.
 *
 * @param data - Input data
 * @param pos1 - First position
 * @param pos2 - Second position
 * @param maxLen - Maximum match length to check
 * @returns Length of matching bytes
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
 * Compress data using LZ4 block compression.
 *
 * @param data - Input data to compress
 * @returns Compressed data with LZ4 frame header
 */
export function compressLZ4(data: Uint8Array): Uint8Array {
  const srcLen = data.length;

  // Handle empty input
  if (srcLen === 0) {
    // Return minimal valid LZ4 frame: magic + flags + checksum + end mark
    return new Uint8Array([
      0x04, 0x22, 0x4D, 0x18, // Magic number
      0x64, 0x40, 0xA7, // Frame descriptor + checksum
      0x00, 0x00, 0x00, 0x00, // End mark
    ]);
  }

  // Worst case: every byte is a literal + overhead
  // Each sequence needs at least 1 token byte + literals
  // Add frame header (7 bytes) + block header (4 bytes) + end mark (4 bytes)
  const maxCompressedSize = srcLen + Math.ceil(srcLen / 255) + 15;
  const output = new Uint8Array(maxCompressedSize);
  let outPos = 0;

  // Write LZ4 frame header
  // Magic number (4 bytes)
  output[outPos++] = 0x04;
  output[outPos++] = 0x22;
  output[outPos++] = 0x4D;
  output[outPos++] = 0x18;

  // Frame descriptor (1 byte): version 01, block independence, no block checksum, no content size
  output[outPos++] = 0x64;

  // Block max size (1 byte): 64KB (0x40)
  output[outPos++] = 0x40;

  // Header checksum (1 byte): simple checksum of descriptor bytes
  const headerChecksum = ((0x64 + 0x40) >> 8) & 0xFF;
  output[outPos++] = headerChecksum;

  // Reserve space for block size (4 bytes) - will write later
  const blockSizePos = outPos;
  outPos += 4;

  // Start of compressed data
  const compressedStart = outPos;

  // Hash table for match finding (stores positions)
  const hashTable = new Int32Array(HASH_SIZE);
  hashTable.fill(-1);

  let srcPos = 0;
  let anchor = 0; // Start of current literal run

  // Compress data
  while (srcPos < srcLen - MFLIMIT) {
    // Find match
    const h = hash4(data, srcPos);
    const matchPos = hashTable[h] ?? -1;
    hashTable[h] = srcPos;

    // Check if we have a valid match
    if (
      matchPos >= 0 &&
      srcPos - matchPos <= MAX_DISTANCE &&
      data[srcPos] === data[matchPos] &&
      data[srcPos + 1] === data[matchPos + 1] &&
      data[srcPos + 2] === data[matchPos + 2] &&
      data[srcPos + 3] === data[matchPos + 3]
    ) {
      // Found a match
      const matchLength = MIN_MATCH + getMatchLength(
        data,
        srcPos + MIN_MATCH,
        matchPos + MIN_MATCH,
        srcLen - srcPos - MIN_MATCH
      );

      // Encode the sequence
      const literalLength = srcPos - anchor;

      // Write token
      let token = 0;
      const tokenPos = outPos++;

      // Encode literal length
      if (literalLength >= 15) {
        token = 0xF0;
        let len = literalLength - 15;
        while (len >= 255) {
          output[outPos++] = 255;
          len -= 255;
        }
        output[outPos++] = len;
      } else {
        token = literalLength << 4;
      }

      // Copy literals
      for (let i = 0; i < literalLength; i++) {
        output[outPos++] = data[anchor + i]!;
      }

      // Write match offset (little-endian)
      const offset = srcPos - matchPos;
      output[outPos++] = offset & 0xFF;
      output[outPos++] = (offset >> 8) & 0xFF;

      // Encode match length
      const ml = matchLength - MIN_MATCH;
      if (ml >= 15) {
        token |= 0x0F;
        let len = ml - 15;
        while (len >= 255) {
          output[outPos++] = 255;
          len -= 255;
        }
        output[outPos++] = len;
      } else {
        token |= ml;
      }

      // Write token
      output[tokenPos] = token;

      // Update position
      srcPos += matchLength;
      anchor = srcPos;

      // Update hash table for match positions
      for (let i = 1; i < matchLength - 2; i++) {
        const pos = srcPos - matchLength + i;
        if (pos < srcLen - 3) {
          hashTable[hash4(data, pos)] = pos;
        }
      }
    } else {
      // No match, advance
      srcPos++;
    }
  }

  // Encode last literals
  const lastLiterals = srcLen - anchor;
  if (lastLiterals > 0) {
    let token = 0;
    const tokenPos = outPos++;

    if (lastLiterals >= 15) {
      token = 0xF0;
      let len = lastLiterals - 15;
      while (len >= 255) {
        output[outPos++] = 255;
        len -= 255;
      }
      output[outPos++] = len;
    } else {
      token = lastLiterals << 4;
    }

    output[tokenPos] = token;

    // Copy last literals
    for (let i = 0; i < lastLiterals; i++) {
      output[outPos++] = data[anchor + i]!;
    }
  }

  // Write block size (uncompressed bit set if no compression achieved)
  const compressedSize = outPos - compressedStart;
  const blockSize = compressedSize | 0x80000000; // Set high bit to indicate compressed

  output[blockSizePos] = blockSize & 0xFF;
  output[blockSizePos + 1] = (blockSize >> 8) & 0xFF;
  output[blockSizePos + 2] = (blockSize >> 16) & 0xFF;
  output[blockSizePos + 3] = (blockSize >> 24) & 0xFF;

  // Write end mark (block size = 0)
  output[outPos++] = 0x00;
  output[outPos++] = 0x00;
  output[outPos++] = 0x00;
  output[outPos++] = 0x00;

  // Return trimmed output
  return output.slice(0, outPos);
}

/**
 * Decompress LZ4 compressed data.
 *
 * @param data - Compressed data with LZ4 frame
 * @param originalSize - Expected original size (for validation)
 * @returns Decompressed data
 */
export function decompressLZ4(data: Uint8Array, originalSize: number): Uint8Array {
  // Verify magic number
  if (!isLZ4Compressed(data)) {
    throw new Error('Invalid LZ4 data: magic number mismatch');
  }

  let srcPos = 7; // Skip magic (4) + descriptor (1) + block size (1) + checksum (1)

  // Read block size
  if (srcPos + 4 > data.length) {
    throw new Error('Invalid LZ4 data: truncated block size');
  }

  const blockSize =
    (data[srcPos]!) |
    ((data[srcPos + 1]!) << 8) |
    ((data[srcPos + 2]!) << 16) |
    ((data[srcPos + 3]!) << 24);

  srcPos += 4;

  if (blockSize === 0) {
    // End mark with no data
    return new Uint8Array(0);
  }

  const isCompressed = (blockSize & 0x80000000) !== 0;
  const actualBlockSize = blockSize & 0x7FFFFFFF;

  if (!isCompressed) {
    // Uncompressed block
    if (srcPos + actualBlockSize > data.length) {
      throw new Error('Invalid LZ4 data: truncated uncompressed block');
    }
    return data.slice(srcPos, srcPos + actualBlockSize);
  }

  // Decompress block
  const output = new Uint8Array(originalSize);
  let outPos = 0;
  const srcEnd = srcPos + actualBlockSize;

  while (srcPos < srcEnd) {
    // Read token
    const token = data[srcPos++]!;

    // Decode literal length
    let literalLength = token >> 4;
    if (literalLength === 15) {
      let len;
      do {
        if (srcPos >= srcEnd) {
          throw new Error('Invalid LZ4 data: truncated literal length');
        }
        len = data[srcPos++]!;
        literalLength += len;
      } while (len === 255);
    }

    // Copy literals
    if (srcPos + literalLength > srcEnd) {
      throw new Error('Invalid LZ4 data: truncated literals');
    }

    for (let i = 0; i < literalLength; i++) {
      output[outPos++] = data[srcPos++]!;
    }

    // Check if we're done
    if (srcPos >= srcEnd) {
      break;
    }

    // Read match offset
    if (srcPos + 2 > srcEnd) {
      throw new Error('Invalid LZ4 data: truncated match offset');
    }

    const offset = (data[srcPos]!) | ((data[srcPos + 1]!) << 8);
    srcPos += 2;

    if (offset === 0) {
      throw new Error('Invalid LZ4 data: zero match offset');
    }

    // Decode match length
    let matchLength = (token & 0x0F) + MIN_MATCH;
    if ((token & 0x0F) === 15) {
      let len;
      do {
        if (srcPos >= srcEnd) {
          throw new Error('Invalid LZ4 data: truncated match length');
        }
        len = data[srcPos++]!;
        matchLength += len;
      } while (len === 255);
    }

    // Copy match
    const matchPos = outPos - offset;
    if (matchPos < 0) {
      throw new Error('Invalid LZ4 data: match offset exceeds output position');
    }

    // Copy byte by byte to handle overlapping matches
    for (let i = 0; i < matchLength; i++) {
      output[outPos++] = output[matchPos + i]!;
    }
  }

  // Validate output size
  if (outPos !== originalSize) {
    throw new Error(
      `Invalid LZ4 data: decompressed size mismatch (expected ${originalSize}, got ${outPos})`
    );
  }

  return output;
}

/**
 * Get compression statistics for LZ4.
 *
 * @param original - Original data
 * @param compressed - Compressed data
 * @returns Compression statistics
 */
export function getLZ4Stats(
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
 * Benchmark LZ4 compression performance.
 *
 * @param data - Data to compress
 * @returns Performance metrics
 */
export function benchmarkLZ4(data: Uint8Array): {
  compressionTime: number;
  decompressionTime: number;
  compressionSpeed: number;
  decompressionSpeed: number;
  ratio: number;
} {
  // Compression benchmark
  const compressStart = performance.now();
  const compressed = compressLZ4(data);
  const compressEnd = performance.now();
  const compressionTime = compressEnd - compressStart;

  // Decompression benchmark
  const decompressStart = performance.now();
  decompressLZ4(compressed, data.length);
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
