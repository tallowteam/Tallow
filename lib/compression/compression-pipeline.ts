/**
 * File Compression Pipeline
 *
 * Implements intelligent file compression for P2P transfers using native browser APIs.
 * Analyzes files to determine compressibility and applies compression when beneficial.
 * Supports multiple algorithms:
 * - gzip, deflate: Fast, general-purpose (native browser)
 * - LZ4: Ultra-fast for LAN transfers
 * - Zstd: Fast with good ratio for internet
 * - Brotli: Text-optimized, 30-50% better than gzip
 * - LZMA: Maximum compression ratio (archival)
 */

import { detectFileType, isCompressible } from './magic-numbers';
import { compressLZ4, decompressLZ4 } from './lz4';
import { compressZstd, decompressZstd, ZstdLevel } from './zstd';

// Optional imports for Brotli and LZMA (may not exist yet)
let compressBrotli: any = null;
let decompressBrotli: any = null;
let getRecommendedQuality: any = null;
let compressLZMA: any = null;
let decompressLZMA: any = null;

try {
  const brotli = require('./brotli');
  compressBrotli = brotli.compressBrotli;
  decompressBrotli = brotli.decompressBrotli;
  getRecommendedQuality = brotli.getRecommendedQuality;
} catch {
  // Brotli not available
}

try {
  const lzma = require('./lzma');
  compressLZMA = lzma.compressLZMA;
  decompressLZMA = lzma.decompressLZMA;
} catch {
  // LZMA not available
}

/**
 * Result of file compressibility analysis
 */
export interface CompressibilityAnalysis {
  isCompressible: boolean;
  detectedType: string | null;
  reason: string;
  estimatedRatio?: number;
  sampleSize?: number;
}

/**
 * Compression algorithms supported by the pipeline
 */
export type CompressionAlgorithm =
  | 'gzip'
  | 'deflate'
  | 'deflate-raw'
  | 'lz4'
  | 'zstd'
  | 'brotli'
  | 'lzma'
  | 'none';

/**
 * Statistics from compression/decompression operations
 */
export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  ratio: number;
  timeTaken: number;
  algorithm: CompressionAlgorithm;
  skipped: boolean;
  skipReason?: string;
}

/**
 * Result of file compression
 */
export interface CompressionResult {
  data: ArrayBuffer;
  stats: CompressionStats;
}

/**
 * Sample size for compression ratio testing (64 KB)
 */
const SAMPLE_SIZE = 64 * 1024;

/**
 * Minimum compression ratio to justify compression (1.1x = 10% reduction)
 */
const MIN_COMPRESSION_RATIO = 1.1;

/**
 * Maximum file size to read magic bytes from (16 bytes is sufficient)
 */
const MAGIC_BYTES_SIZE = 16;

/**
 * Analyze if a file is worth compressing by checking its type.
 *
 * @param file - File to analyze
 * @returns Promise resolving to compressibility analysis
 */
export async function analyzeCompressibility(file: File): Promise<CompressibilityAnalysis> {
  // Read first 16 bytes to detect file type
  const headerSize = Math.min(file.size, MAGIC_BYTES_SIZE);
  const headerBlob = file.slice(0, headerSize);
  const headerBuffer = await headerBlob.arrayBuffer();

  const detectedType = detectFileType(headerBuffer);
  const compressible = isCompressible(detectedType);

  if (!compressible) {
    return {
      isCompressible: false,
      detectedType,
      reason: `File type ${detectedType || 'detected'} is already compressed`,
    };
  }

  // For compressible files, perform a sample test if file is large enough
  if (file.size > SAMPLE_SIZE) {
    const sampleResult = await sampleTest(file);
    return {
      isCompressible: sampleResult.ratio >= MIN_COMPRESSION_RATIO,
      detectedType,
      reason:
        sampleResult.ratio >= MIN_COMPRESSION_RATIO
          ? `Sample compression ratio: ${sampleResult.ratio.toFixed(2)}x`
          : `Sample compression ratio too low: ${sampleResult.ratio.toFixed(2)}x (minimum: ${MIN_COMPRESSION_RATIO}x)`,
      estimatedRatio: sampleResult.ratio,
      sampleSize: sampleResult.sampleSize,
    };
  }

  return {
    isCompressible: true,
    detectedType,
    reason: 'File type is compressible',
  };
}

/**
 * Test compression on a sample of the file to estimate compression ratio.
 *
 * @param file - File to sample
 * @returns Promise resolving to sample compression statistics
 */
export async function sampleTest(
  file: File
): Promise<{ ratio: number; sampleSize: number; timeTaken: number }> {
  const startTime = performance.now();

  // Read first 64KB as sample
  const sampleSize = Math.min(file.size, SAMPLE_SIZE);
  const sampleBlob = file.slice(0, sampleSize);
  const sampleBuffer = await sampleBlob.arrayBuffer();

  // Compress the sample using gzip
  const compressed = await compressBuffer(sampleBuffer, 'gzip');
  const ratio = sampleSize / compressed.byteLength;
  const timeTaken = performance.now() - startTime;

  return {
    ratio,
    sampleSize,
    timeTaken,
  };
}

/**
 * Compress a file using the specified compression algorithm.
 *
 * @param file - File to compress
 * @param algorithm - Compression algorithm (default: 'gzip')
 * @returns Promise resolving to compression result with stats
 */
export async function compressFile(
  file: File,
  algorithm: CompressionAlgorithm = 'gzip'
): Promise<CompressionResult> {
  const startTime = performance.now();

  // First analyze if compression is worthwhile
  const analysis = await analyzeCompressibility(file);

  if (!analysis.isCompressible) {
    // Return original file without compression
    const buffer = await file.arrayBuffer();
    return {
      data: buffer,
      stats: {
        originalSize: file.size,
        compressedSize: file.size,
        ratio: 1.0,
        timeTaken: performance.now() - startTime,
        algorithm: 'none',
        skipped: true,
        skipReason: analysis.reason,
      },
    };
  }

  // Compress the file
  const buffer = await file.arrayBuffer();
  const compressed = await compressBuffer(buffer, algorithm);

  const timeTaken = performance.now() - startTime;
  const ratio = buffer.byteLength / compressed.byteLength;

  // Check if compression actually helped
  if (ratio < MIN_COMPRESSION_RATIO) {
    return {
      data: buffer,
      stats: {
        originalSize: buffer.byteLength,
        compressedSize: buffer.byteLength,
        ratio: 1.0,
        timeTaken,
        algorithm: 'none',
        skipped: true,
        skipReason: `Compression ratio ${ratio.toFixed(2)}x below threshold ${MIN_COMPRESSION_RATIO}x`,
      },
    };
  }

  return {
    data: compressed,
    stats: {
      originalSize: buffer.byteLength,
      compressedSize: compressed.byteLength,
      ratio,
      timeTaken,
      algorithm,
      skipped: false,
    },
  };
}

/**
 * Compress an ArrayBuffer using the specified algorithm.
 *
 * @param buffer - Buffer to compress
 * @param algorithm - Compression algorithm
 * @returns Promise resolving to compressed ArrayBuffer
 */
async function compressBuffer(
  buffer: ArrayBuffer,
  algorithm: CompressionAlgorithm = 'gzip'
): Promise<ArrayBuffer> {
  // Handle custom algorithms
  if (algorithm === 'lz4') {
    const input = new Uint8Array(buffer);
    const compressed = compressLZ4(input);
    return compressed.buffer;
  }

  if (algorithm === 'zstd') {
    const input = new Uint8Array(buffer);
    const compressed = compressZstd(input, ZstdLevel.FAST);
    return compressed.buffer;
  }

  if (algorithm === 'brotli') {
    if (!compressBrotli) {
      throw new Error('Brotli compression not available');
    }
    const input = new Uint8Array(buffer);
    const quality = getRecommendedQuality(input.length, 'balanced');
    const compressed = await compressBrotli(input, quality);
    return compressed.buffer;
  }

  if (algorithm === 'lzma') {
    if (!compressLZMA) {
      throw new Error('LZMA compression not available');
    }
    const input = new Uint8Array(buffer);
    const compressed = compressLZMA(input);
    return compressed.buffer;
  }

  if (algorithm === 'none') {
    return buffer;
  }

  // Use native CompressionStream for gzip, deflate, deflate-raw
  const compressionStream = new CompressionStream(algorithm);

  // Create a readable stream from the buffer
  const readableStream = new Blob([buffer]).stream();

  // Pipe through compression
  const compressedStream = readableStream.pipeThrough(compressionStream);

  // Read all chunks
  const chunks: Uint8Array[] = [];
  const reader = compressedStream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  // Combine chunks into single buffer
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

/**
 * Decompress data using the specified decompression algorithm.
 *
 * @param data - Compressed data to decompress
 * @param algorithm - Decompression algorithm (must match compression algorithm)
 * @param originalSize - Original size (required for LZ4 if not in frame)
 * @returns Promise resolving to decompressed ArrayBuffer
 */
export async function decompressFile(
  data: ArrayBuffer,
  algorithm: CompressionAlgorithm = 'gzip',
  originalSize?: number
): Promise<ArrayBuffer> {
  // Handle custom algorithms
  if (algorithm === 'lz4') {
    const input = new Uint8Array(data);
    // LZ4 frames include size info, but we support manual override
    const decompressed = decompressLZ4(input, originalSize || 0);
    return decompressed.buffer;
  }

  if (algorithm === 'zstd') {
    const input = new Uint8Array(data);
    const decompressed = decompressZstd(input);
    return decompressed.buffer;
  }

  if (algorithm === 'brotli') {
    if (!decompressBrotli) {
      throw new Error('Brotli decompression not available');
    }
    const input = new Uint8Array(data);
    const decompressed = await decompressBrotli(input);
    return decompressed.buffer;
  }

  if (algorithm === 'lzma') {
    if (!decompressLZMA) {
      throw new Error('LZMA decompression not available');
    }
    const input = new Uint8Array(data);
    const decompressed = decompressLZMA(input);
    return decompressed.buffer;
  }

  if (algorithm === 'none') {
    return data;
  }

  // Use native DecompressionStream for gzip, deflate, deflate-raw
  const decompressionStream = new DecompressionStream(algorithm as 'gzip' | 'deflate' | 'deflate-raw');

  // Create a readable stream from the compressed data
  const readableStream = new Blob([data]).stream();

  // Pipe through decompression
  const decompressedStream = readableStream.pipeThrough(decompressionStream);

  // Read all chunks
  const chunks: Uint8Array[] = [];
  const reader = decompressedStream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  // Combine chunks into single buffer
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

/**
 * Compress multiple files in sequence with progress tracking.
 *
 * @param files - Array of files to compress
 * @param onProgress - Callback for progress updates
 * @returns Promise resolving to array of compression results
 */
export async function compressFiles(
  files: File[],
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;
    onProgress?.(i + 1, files.length, file.name);

    const result = await compressFile(file);
    results.push(result);
  }

  return results;
}

/**
 * Calculate total compression statistics for multiple files.
 *
 * @param results - Array of compression results
 * @returns Aggregate compression statistics
 */
export function calculateAggregateStats(results: CompressionResult[]): {
  totalOriginalSize: number;
  totalCompressedSize: number;
  overallRatio: number;
  totalTimeTaken: number;
  filesCompressed: number;
  filesSkipped: number;
} {
  const stats = results.reduce(
    (acc, result) => {
      acc.totalOriginalSize += result.stats.originalSize;
      acc.totalCompressedSize += result.stats.compressedSize;
      acc.totalTimeTaken += result.stats.timeTaken;
      if (result.stats.skipped) {
        acc.filesSkipped++;
      } else {
        acc.filesCompressed++;
      }
      return acc;
    },
    {
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      totalTimeTaken: 0,
      filesCompressed: 0,
      filesSkipped: 0,
    }
  );

  return {
    ...stats,
    overallRatio: stats.totalOriginalSize / stats.totalCompressedSize,
  };
}

/**
 * Format bytes to human-readable string.
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format time duration to human-readable string.
 *
 * @param ms - Time in milliseconds
 * @returns Formatted string (e.g., "1.5s")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
