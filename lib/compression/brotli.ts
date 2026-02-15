/**
 * Brotli Compression Module
 *
 * Provides text-optimized compression using Brotli or fallback to deflate with custom framing.
 * Brotli is specifically designed for text compression and achieves better ratios than gzip
 * for text-heavy content while maintaining reasonable compression speeds.
 *
 * Browser Support:
 * - Chrome 109+, Edge 109+: Native 'br' support in CompressionStream
 * - Safari 16.4+: Native 'br' support
 * - Fallback: Uses deflate with custom framing for older browsers
 *
 * Performance:
 * - Quality 0-3: Fast compression, ~20-30% better than gzip
 * - Quality 4-6: Balanced (default), ~30-40% better than gzip
 * - Quality 7-11: Maximum compression, ~40-50% better than gzip (slow)
 *
 * Usage Example:
 * ```typescript
 * import { compressBrotli, decompressBrotli, isBrotliSupported } from '@/lib/compression/brotli';
 *
 * // Check support
 * if (isBrotliSupported()) {
 *   const compressed = await compressBrotli(data, 6);
 *   const decompressed = await decompressBrotli(compressed);
 * }
 * ```
 */

/**
 * Custom Brotli magic bytes (since Brotli has no standardized magic number).
 * Format: [0xCE, 0xB2, 0xCF, 0x81] = UTF-8 encoding of "βρ" (Greek letters beta, rho)
 * Mnemonic: "Brotli" starts with "Br"
 */
const BROTLI_MAGIC_BYTES = new Uint8Array([0xCE, 0xB2, 0xCF, 0x81]);

/**
 * Header structure for fallback mode:
 * - 4 bytes: Magic bytes (0xCE 0xB2 0xCF 0x81)
 * - 1 byte: Version (0x01)
 * - 1 byte: Quality level (0-11)
 * - 1 byte: Compression type (0x01 = native brotli, 0x02 = deflate fallback)
 * - 1 byte: Reserved (0x00)
 * - 8 bytes: Original size (uint64, little-endian)
 * Total: 16 bytes
 */
const HEADER_SIZE = 16;
const VERSION = 0x01;
const COMPRESSION_TYPE_BROTLI = 0x01;
const COMPRESSION_TYPE_DEFLATE_FALLBACK = 0x02;

/**
 * Brotli quality levels mapping
 * Lower is faster but larger, higher is slower but smaller
 */
export type BrotliQuality = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/**
 * Default quality level (balanced between speed and compression ratio)
 */
const DEFAULT_QUALITY: BrotliQuality = 6;

/**
 * Check if native Brotli compression is supported by the browser.
 *
 * @returns true if CompressionStream supports 'br', false otherwise
 */
export function isBrotliSupported(): boolean {
  try {
    // Test if CompressionStream accepts 'br' format
    const stream = new CompressionStream('br' as CompressionFormat);
    stream.writable.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * Compress data using Brotli compression.
 *
 * Uses native Brotli if supported, falls back to deflate with custom framing.
 *
 * @param data - Data to compress
 * @param quality - Compression quality level (0-11, default: 6)
 * @returns Promise resolving to compressed data with header
 */
export async function compressBrotli(
  data: Uint8Array,
  quality: BrotliQuality = DEFAULT_QUALITY
): Promise<Uint8Array> {
  // Validate quality level
  if (quality < 0 || quality > 11) {
    throw new Error('Brotli quality must be between 0 and 11');
  }

  const useNativeBrotli = isBrotliSupported();
  const compressionType = useNativeBrotli
    ? COMPRESSION_TYPE_BROTLI
    : COMPRESSION_TYPE_DEFLATE_FALLBACK;

  // Compress the data
  let compressedData: Uint8Array;
  if (useNativeBrotli) {
    compressedData = await compressWithNativeBrotli(data);
  } else {
    compressedData = await compressWithDeflateFallback(data);
  }

  // Create header
  const header = createHeader(data.length, quality, compressionType);

  // Combine header and compressed data
  const result = new Uint8Array(header.length + compressedData.length);
  result.set(header, 0);
  result.set(compressedData, header.length);

  return result;
}

/**
 * Decompress Brotli-compressed data.
 *
 * Automatically detects compression type from header and uses appropriate decompression.
 *
 * @param data - Compressed data with header
 * @returns Promise resolving to decompressed data
 */
export async function decompressBrotli(data: Uint8Array): Promise<Uint8Array> {
  // Validate minimum size
  if (data.length < HEADER_SIZE) {
    throw new Error('Invalid Brotli data: too short');
  }

  // Parse header
  const header = parseHeader(data);

  // Extract compressed data (skip header)
  const compressedData = data.slice(HEADER_SIZE);

  // Decompress based on compression type
  if (header.compressionType === COMPRESSION_TYPE_BROTLI) {
    return decompressWithNativeBrotli(compressedData, header.originalSize);
  } else if (header.compressionType === COMPRESSION_TYPE_DEFLATE_FALLBACK) {
    return decompressWithDeflateFallback(compressedData, header.originalSize);
  } else {
    throw new Error(`Unknown compression type: ${header.compressionType}`);
  }
}

/**
 * Check if data is Brotli-compressed by checking magic bytes.
 *
 * @param data - Data to check
 * @returns true if data has Brotli magic bytes
 */
export function isBrotliCompressed(data: Uint8Array): boolean {
  if (data.length < BROTLI_MAGIC_BYTES.length) {
    return false;
  }

  for (let i = 0; i < BROTLI_MAGIC_BYTES.length; i++) {
    if (data[i] !== BROTLI_MAGIC_BYTES[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Compress data using native Brotli (CompressionStream with 'br').
 *
 * @param data - Data to compress
 * @returns Promise resolving to compressed data
 */
async function compressWithNativeBrotli(data: Uint8Array): Promise<Uint8Array> {
  // Note: CompressionStream doesn't support quality parameter yet
  // Some browsers may support it in the future via options parameter
  const compressionStream = new CompressionStream('br' as CompressionFormat);
  return compressWithStream(data, compressionStream);
}

/**
 * Decompress data using native Brotli (DecompressionStream with 'br').
 *
 * @param data - Compressed data
 * @param expectedSize - Expected decompressed size (for validation)
 * @returns Promise resolving to decompressed data
 */
async function decompressWithNativeBrotli(
  data: Uint8Array,
  expectedSize: number
): Promise<Uint8Array> {
  const decompressionStream = new DecompressionStream('br' as CompressionFormat);
  const result = await decompressWithStream(data, decompressionStream);

  // Validate size
  if (result.length !== expectedSize) {
    throw new Error(
      `Decompression size mismatch: expected ${expectedSize}, got ${result.length}`
    );
  }

  return result;
}

/**
 * Compress data using deflate as fallback (when native Brotli is unavailable).
 *
 * @param data - Data to compress
 * @returns Promise resolving to compressed data
 */
async function compressWithDeflateFallback(data: Uint8Array): Promise<Uint8Array> {
  const compressionStream = new CompressionStream('deflate');
  return compressWithStream(data, compressionStream);
}

/**
 * Decompress data using deflate fallback.
 *
 * @param data - Compressed data
 * @param expectedSize - Expected decompressed size (for validation)
 * @returns Promise resolving to decompressed data
 */
async function decompressWithDeflateFallback(
  data: Uint8Array,
  expectedSize: number
): Promise<Uint8Array> {
  const decompressionStream = new DecompressionStream('deflate');
  const result = await decompressWithStream(data, decompressionStream);

  // Validate size
  if (result.length !== expectedSize) {
    throw new Error(
      `Decompression size mismatch: expected ${expectedSize}, got ${result.length}`
    );
  }

  return result;
}

/**
 * Generic compression using a CompressionStream.
 *
 * @param data - Data to compress
 * @param stream - CompressionStream to use
 * @returns Promise resolving to compressed data
 */
async function compressWithStream(
  data: Uint8Array,
  stream: CompressionStream
): Promise<Uint8Array> {
  const readableStream = new Blob([data]).stream();
  const compressedStream = readableStream.pipeThrough(stream);

  const chunks: Uint8Array[] = [];
  const reader = compressedStream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {break;}
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  // Combine chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Generic decompression using a DecompressionStream.
 *
 * @param data - Compressed data
 * @param stream - DecompressionStream to use
 * @returns Promise resolving to decompressed data
 */
async function decompressWithStream(
  data: Uint8Array,
  stream: DecompressionStream
): Promise<Uint8Array> {
  const readableStream = new Blob([data]).stream();
  const decompressedStream = readableStream.pipeThrough(stream);

  const chunks: Uint8Array[] = [];
  const reader = decompressedStream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {break;}
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  // Combine chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Create Brotli header.
 *
 * @param originalSize - Original uncompressed size
 * @param quality - Compression quality level
 * @param compressionType - Compression type identifier
 * @returns Header as Uint8Array
 */
function createHeader(
  originalSize: number,
  quality: BrotliQuality,
  compressionType: number
): Uint8Array {
  const header = new Uint8Array(HEADER_SIZE);

  // Magic bytes (4 bytes)
  header.set(BROTLI_MAGIC_BYTES, 0);

  // Version (1 byte)
  header[4] = VERSION;

  // Quality level (1 byte)
  header[5] = quality;

  // Compression type (1 byte)
  header[6] = compressionType;

  // Reserved (1 byte)
  header[7] = 0x00;

  // Original size (8 bytes, little-endian uint64)
  const sizeView = new DataView(header.buffer, header.byteOffset, header.byteLength);
  // JavaScript numbers are 53-bit safe integers, so we use BigInt for uint64
  sizeView.setBigUint64(8, BigInt(originalSize), true);

  return header;
}

/**
 * Parse Brotli header.
 *
 * @param data - Data containing header
 * @returns Parsed header information
 */
function parseHeader(data: Uint8Array): {
  version: number;
  quality: BrotliQuality;
  compressionType: number;
  originalSize: number;
} {
  // Validate magic bytes
  if (!isBrotliCompressed(data)) {
    throw new Error('Invalid Brotli data: magic bytes mismatch');
  }

  // Validate version
  const version = data[4] ?? 0;
  if (version !== VERSION) {
    throw new Error(`Unsupported Brotli version: ${version}`);
  }

  // Extract fields
  const quality = (data[5] ?? 0) as BrotliQuality;
  const compressionType = data[6] ?? 0;

  // Extract original size (8 bytes, little-endian uint64)
  const sizeView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const originalSize = Number(sizeView.getBigUint64(8, true));

  return {
    version,
    quality,
    compressionType,
    originalSize,
  };
}

/**
 * Compress data using Brotli stream for large files.
 *
 * This provides a streaming interface for compressing large files without
 * loading the entire file into memory.
 *
 * @param readable - ReadableStream of data to compress
 * @param quality - Compression quality level (0-11, default: 6)
 * @returns ReadableStream of compressed data
 */
export function compressBrotliStream(
  readable: ReadableStream<Uint8Array>,
  quality: BrotliQuality = DEFAULT_QUALITY
): ReadableStream<Uint8Array> {
  // Validate quality level
  if (quality < 0 || quality > 11) {
    throw new Error('Brotli quality must be between 0 and 11');
  }

  const useNativeBrotli = isBrotliSupported();
  const compressionType = useNativeBrotli
    ? COMPRESSION_TYPE_BROTLI
    : COMPRESSION_TYPE_DEFLATE_FALLBACK;

  const format = useNativeBrotli ? ('br' as CompressionFormat) : 'deflate';
  const compressionStream = new CompressionStream(format);

  let headerSent = false;

  // Transform stream to inject header before compressed data
  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      if (!headerSent) {
        // Note: We don't know the original size yet in streaming mode
        // We'll use 0 as a sentinel value to indicate streaming mode
        const header = createHeader(0, quality, compressionType);
        controller.enqueue(header);
        headerSent = true;
      }

      controller.enqueue(chunk);
    },
  });

  return readable.pipeThrough(compressionStream).pipeThrough(transformStream);
}

/**
 * Decompress Brotli stream for large files.
 *
 * @param readable - ReadableStream of compressed data with header
 * @returns ReadableStream of decompressed data
 */
export function decompressBrotliStream(
  readable: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  let headerProcessed = false;
  let headerBuffer = new Uint8Array(0);
  let decompressionStream: DecompressionStream | null = null;

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      if (!headerProcessed) {
        // Accumulate data until we have full header
        const combined = new Uint8Array(headerBuffer.length + chunk.length);
        combined.set(headerBuffer);
        combined.set(chunk, headerBuffer.length);
        headerBuffer = combined;

        if (headerBuffer.length >= HEADER_SIZE) {
          // Parse header
          const header = parseHeader(headerBuffer);

          // Create appropriate decompression stream
          const format =
            header.compressionType === COMPRESSION_TYPE_BROTLI
              ? ('br' as CompressionFormat)
              : 'deflate';
          decompressionStream = new DecompressionStream(format);

          // Pass remaining data (after header) to next stage
          const remainingData = headerBuffer.slice(HEADER_SIZE);
          if (remainingData.length > 0) {
            controller.enqueue(remainingData);
          }

          headerProcessed = true;
        }
      } else {
        controller.enqueue(chunk);
      }
    },
  });

  return readable
    .pipeThrough(transformStream)
    .pipeThrough(decompressionStream as unknown as DecompressionStream);
}

/**
 * Get estimated compression ratio for Brotli at given quality level.
 *
 * These are rough estimates based on typical text compression scenarios.
 *
 * @param quality - Quality level (0-11)
 * @returns Estimated compression ratio (e.g., 3.0 = 3x compression)
 */
export function getEstimatedCompressionRatio(quality: BrotliQuality): number {
  // Estimates based on typical text compression
  const ratios: Record<BrotliQuality, number> = {
    0: 2.5,
    1: 2.8,
    2: 3.0,
    3: 3.2,
    4: 3.5,
    5: 3.7,
    6: 4.0,
    7: 4.2,
    8: 4.5,
    9: 4.7,
    10: 5.0,
    11: 5.2,
  };

  return ratios[quality];
}

/**
 * Get recommended quality level based on file size and use case.
 *
 * @param fileSize - Size of file to compress in bytes
 * @param priority - 'speed' for fast compression, 'size' for maximum compression
 * @returns Recommended quality level
 */
export function getRecommendedQuality(
  fileSize: number,
  priority: 'speed' | 'balanced' | 'size' = 'balanced'
): BrotliQuality {
  if (priority === 'speed') {
    // Fast compression for real-time use
    return fileSize < 1024 * 1024 ? 3 : 1; // 1MB threshold
  } else if (priority === 'size') {
    // Maximum compression for archival
    return fileSize < 10 * 1024 * 1024 ? 11 : 9; // 10MB threshold
  } else {
    // Balanced for general use
    if (fileSize < 100 * 1024) {return 6;} // < 100KB
    if (fileSize < 1024 * 1024) {return 5;} // < 1MB
    if (fileSize < 10 * 1024 * 1024) {return 4;} // < 10MB
    return 3; // >= 10MB
  }
}
