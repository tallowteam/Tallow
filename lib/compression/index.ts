/**
 * Compression Pipeline Module
 *
 * Intelligent file compression system for P2P transfers with multiple algorithms.
 *
 * Features:
 * - Magic byte detection to identify file types
 * - Automatic skip of already-compressed formats (JPEG, PNG, MP4, ZIP, etc.)
 * - Sample-based compression ratio estimation
 * - Native CompressionStream/DecompressionStream API usage
 * - LZ4 for fast LAN transfers (pure TypeScript)
 * - Zstd for internet transfers (pure TypeScript)
 * - Brotli compression for text-heavy files
 * - LZMA compression for maximum compression ratio
 * - Automatic algorithm selection based on connection type
 * - Comprehensive statistics and progress tracking
 *
 * Compression Algorithm Selection:
 * - **LZ4**: Ultra-fast, optimized for LAN (speed priority)
 * - **gzip/deflate**: Fast, general-purpose (default)
 * - **Zstd**: Better ratio, optimized for internet (balanced)
 * - **Brotli**: Text-optimized, 30-50% better than gzip
 * - **LZMA**: Maximum ratio, 40-60% better than gzip (slowest)
 *
 * Usage Example:
 * ```typescript
 * import { compressFile, compressFileAuto, analyzeCompressibility, selectCompression } from '@/lib/compression';
 *
 * // Analyze a file
 * const analysis = await analyzeCompressibility(file);
 * console.log(`File is ${analysis.isCompressible ? 'compressible' : 'not compressible'}`);
 *
 * // Auto-select based on connection
 * const result = await compressFileAuto(file, 'lan', 'speed');
 *
 * // Manual algorithm selection
 * const lz4Result = await compressFile(file, 'lz4');
 * console.log(`Compressed ${lz4Result.stats.originalSize} to ${lz4Result.stats.compressedSize}`);
 * console.log(`Ratio: ${lz4Result.stats.ratio.toFixed(2)}x`);
 *
 * // Decompress data
 * const decompressed = await decompressFile(result.data, 'lz4', originalSize);
 * ```
 */

// Core compression functions
import { analyzeCompressibility } from './compression-pipeline';
export {
  analyzeCompressibility,
  compressFile,
  decompressFile,
  sampleTest,
  compressFiles,
  calculateAggregateStats,
  formatBytes,
  formatDuration,
} from './compression-pipeline';

// Magic number detection
import { detectFileType } from './magic-numbers';
export { detectFileType, isCompressible, getFileTypeDescription } from './magic-numbers';

// LZ4 compression (fast, optimized for LAN)
export {
  compressLZ4,
  decompressLZ4,
  isLZ4Compressed,
  getLZ4Stats,
  benchmarkLZ4,
} from './lz4';

// Zstd compression (better ratio, optimized for internet)
export {
  compressZstd,
  decompressZstd,
  isZstdCompressed,
  getZstdStats,
  benchmarkZstd,
  ZstdLevel,
} from './zstd';

// Brotli compression (text-optimized) - conditional export
let brotliExports = {};
try {
  brotliExports = require('./brotli');
} catch {
  // Brotli not available
}
export const {
  compressBrotli,
  decompressBrotli,
  isBrotliSupported,
  isBrotliCompressed,
  compressBrotliStream,
  decompressBrotliStream,
  getEstimatedCompressionRatio: getBrotliEstimatedRatio,
  getRecommendedQuality: getBrotliRecommendedQuality,
} = brotliExports as any;

// LZMA compression (maximum ratio) - conditional export
let lzmaExports = {};
try {
  lzmaExports = require('./lzma');
} catch {
  // LZMA not available
}
export const {
  compressLZMA,
  decompressLZMA,
  isLZMACompressed,
  getEstimatedLZMARatio,
  isLZMARecommended,
} = lzmaExports as any;

// Type exports
export type {
  CompressibilityAnalysis,
  CompressionStats,
  CompressionResult,
} from './compression-pipeline';

export type { BrotliQuality } from './brotli';

/**
 * Compression algorithm types
 */
export type CompressionAlgorithm =
  | 'gzip'
  | 'deflate'
  | 'deflate-raw'
  | 'brotli'
  | 'lzma'
  | 'none';

/**
 * Compression priority modes
 */
export type CompressionPriority = 'speed' | 'balanced' | 'size';

/**
 * File content type for compression selection
 */
export type FileContentType = 'text' | 'binary' | 'mixed' | 'unknown';

/**
 * Detect content type of a file based on magic bytes and extension.
 *
 * @param file - File to analyze
 * @returns Content type classification
 */
export async function detectContentType(file: File): Promise<FileContentType> {
  // Check file extension first
  const extension = file.name.split('.').pop()?.toLowerCase();
  const textExtensions = new Set([
    'txt',
    'md',
    'json',
    'xml',
    'html',
    'css',
    'js',
    'ts',
    'jsx',
    'tsx',
    'csv',
    'log',
    'yaml',
    'yml',
    'toml',
    'ini',
    'conf',
    'config',
  ]);

  if (extension && textExtensions.has(extension)) {
    return 'text';
  }

  // Use magic bytes detection
  const mimeType = detectFileType(await file.slice(0, 16).arrayBuffer());

  if (mimeType?.startsWith('text/') || mimeType?.includes('json') || mimeType?.includes('xml')) {
    return 'text';
  }

  if (mimeType?.startsWith('image/') || mimeType?.startsWith('video/') || mimeType?.startsWith('audio/')) {
    return 'binary';
  }

  // Sample the file to check for text content
  const sampleSize = Math.min(file.size, 8192);
  const sample = new Uint8Array(await file.slice(0, sampleSize).arrayBuffer());

  // Count printable ASCII characters
  let printableCount = 0;
  for (const byte of sample) {
    if ((byte >= 0x20 && byte <= 0x7E) || byte === 0x09 || byte === 0x0A || byte === 0x0D) {
      printableCount++;
    }
  }

  const printableRatio = printableCount / sample.length;

  if (printableRatio > 0.9) return 'text';
  if (printableRatio > 0.5) return 'mixed';
  return 'binary';
}

/**
 * Select best compression algorithm for a file.
 *
 * Recommendations:
 * - **Text files + balanced/size priority**: Brotli
 * - **Large text files + size priority**: LZMA
 * - **Binary files**: gzip (fastest)
 * - **Small files**: gzip or deflate
 * - **Speed priority**: gzip/deflate
 *
 * @param file - File to compress
 * @param priority - Compression priority (default: 'balanced')
 * @returns Recommended compression algorithm
 */
export async function selectCompression(
  file: File,
  priority: CompressionPriority = 'balanced'
): Promise<CompressionAlgorithm> {
  // First check if file is compressible
  const analysis = await analyzeCompressibility(file);
  if (!analysis.isCompressible) {
    return 'none';
  }

  // Detect content type
  const contentType = await detectContentType(file);

  // Small files (< 10KB) - use fast compression
  if (file.size < 10 * 1024) {
    return 'gzip';
  }

  // Speed priority - always use gzip
  if (priority === 'speed') {
    return 'gzip';
  }

  // Binary files - use gzip (Brotli/LZMA don't help much)
  if (contentType === 'binary') {
    return 'gzip';
  }

  // Text files with size priority
  if (priority === 'size') {
    // Very large text files (> 10MB) - LZMA for maximum compression
    if (file.size > 10 * 1024 * 1024 && contentType === 'text') {
      return 'lzma';
    }

    // Medium/large text files - Brotli for good ratio + reasonable speed
    if (contentType === 'text' || contentType === 'mixed') {
      return 'brotli';
    }
  }

  // Balanced priority with text content
  if (priority === 'balanced' && (contentType === 'text' || contentType === 'mixed')) {
    // Use Brotli if supported, otherwise gzip
    const { isBrotliSupported } = await import('./brotli');
    return isBrotliSupported() ? 'brotli' : 'gzip';
  }

  // Default to gzip
  return 'gzip';
}

/**
 * Get compression algorithm details.
 *
 * @param algorithm - Compression algorithm
 * @returns Algorithm information
 */
export function getCompressionInfo(algorithm: CompressionAlgorithm): {
  name: string;
  description: string;
  speed: 'fast' | 'medium' | 'slow';
  ratio: 'low' | 'medium' | 'high' | 'very-high';
  bestFor: string;
} {
  const info = {
    gzip: {
      name: 'GZIP',
      description: 'Fast, general-purpose compression using DEFLATE algorithm',
      speed: 'fast' as const,
      ratio: 'medium' as const,
      bestFor: 'General files, binary data, real-time compression',
    },
    deflate: {
      name: 'DEFLATE',
      description: 'Raw DEFLATE compression without gzip headers',
      speed: 'fast' as const,
      ratio: 'medium' as const,
      bestFor: 'Embedded data, streaming, minimal overhead',
    },
    'deflate-raw': {
      name: 'DEFLATE (Raw)',
      description: 'DEFLATE without any headers or checksums',
      speed: 'fast' as const,
      ratio: 'medium' as const,
      bestFor: 'Custom protocols, minimal metadata',
    },
    brotli: {
      name: 'Brotli',
      description: 'Text-optimized compression, 30-50% better than gzip',
      speed: 'medium' as const,
      ratio: 'high' as const,
      bestFor: 'Text files, web assets, JSON, XML, source code',
    },
    lzma: {
      name: 'LZMA',
      description: 'Maximum compression ratio, 40-60% better than gzip',
      speed: 'slow' as const,
      ratio: 'very-high' as const,
      bestFor: 'Large text files, archival, logs, batch processing',
    },
    none: {
      name: 'None',
      description: 'No compression (file already compressed or incompressible)',
      speed: 'fast' as const,
      ratio: 'low' as const,
      bestFor: 'Pre-compressed files (JPEG, PNG, MP4, ZIP)',
    },
  };

  return info[algorithm] || info.gzip;
}
