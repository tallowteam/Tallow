'use client';

/**
 * Packet Padding Module
 *
 * Implements packet size normalization for traffic analysis resistance.
 * Pads packets to uniform sizes to prevent size-based fingerprinting.
 *
 * Features:
 * - Uniform packet sizes (blend with TLS records)
 * - Random padding modes
 * - MTU-aware fragmentation
 * - PKCS#7-style padding removal
 *
 * SECURITY IMPACT: 9 | PRIVACY IMPACT: 9
 * PRIORITY: HIGH
 */

import secureLog from '../utils/secure-logger';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Padding configuration options
 */
export interface PaddingConfig {
  // Size configuration
  minSize: number;              // Minimum packet size
  maxSize: number;              // Maximum packet size
  targetSizes: number[];        // Target sizes to pad to (for uniform mode)

  // Mode configuration
  mode: PaddingMode;
  alignment: number;            // Align to multiples of this value

  // Fragmentation
  enableFragmentation: boolean;
  mtu: number;                  // Maximum transmission unit

  // Security options
  useCryptoPadding: boolean;    // Use cryptographically random padding
  includeIntegrity: boolean;    // Include integrity check in padding
}

/**
 * Padding modes for different privacy/performance tradeoffs
 */
export enum PaddingMode {
  // Pad to fixed sizes that match common TLS records
  UNIFORM = 'uniform',

  // Pad to random sizes within range
  RANDOM = 'random',

  // Pad to power-of-2 sizes
  POWER_OF_TWO = 'power_of_two',

  // Pad to nearest multiple of alignment
  ALIGNED = 'aligned',

  // Exponential padding (more padding for smaller packets)
  EXPONENTIAL = 'exponential',

  // No padding (maximum performance, minimum privacy)
  NONE = 'none',
}

/**
 * Padded packet structure
 */
export interface PaddedPacket {
  data: Uint8Array;
  originalSize: number;
  paddedSize: number;
  paddingSize: number;
  isFragmented: boolean;
  fragmentIndex: number;
  totalFragments: number;
  checksum?: number | undefined;
}

/**
 * Padding statistics
 */
export interface PaddingStats {
  totalPackets: number;
  totalOriginalBytes: number;
  totalPaddedBytes: number;
  averageOverhead: number;
  fragmentedPackets: number;
}

// ============================================================================
// Constants
// ============================================================================

// Common TLS record sizes for uniform padding
const TLS_RECORD_SIZES = [
  512,      // Small requests
  1024,     // 1KB
  1460,     // MTU - headers
  2048,     // 2KB
  2920,     // 2x MTU
  4096,     // 4KB
  4380,     // 3x MTU
  8192,     // 8KB
  8760,     // 6x MTU
  16384,    // Maximum TLS record
];

// Power of 2 sizes for POWER_OF_TWO mode
const POWER_OF_TWO_SIZES = [
  256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536,
];

const DEFAULT_CONFIG: PaddingConfig = {
  minSize: 512,
  maxSize: 16384,
  targetSizes: TLS_RECORD_SIZES,
  mode: PaddingMode.UNIFORM,
  alignment: 64,
  enableFragmentation: true,
  mtu: 1400,  // Conservative MTU for WebRTC
  useCryptoPadding: true,
  includeIntegrity: true,
};

// Magic bytes for packet header
const PACKET_MAGIC = 0x54504144; // "TPAD"

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate cryptographically random bytes
 */
function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate random integer in range [min, max]
 */
function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  const bytes = randomBytes(4);
  const value = new DataView(bytes.buffer).getUint32(0, false);
  return min + (value % range);
}

/**
 * Calculate CRC32 checksum for integrity
 */
function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  const table = getCRC32Table();

  for (let i = 0; i < data.length; i++) {
    const byte = data[i] ?? 0;
    crc = (crc >>> 8) ^ (table[(crc ^ byte) & 0xFF] ?? 0);
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// CRC32 lookup table (computed once)
let crc32Table: Uint32Array | null = null;

function getCRC32Table(): Uint32Array {
  if (crc32Table) {
    return crc32Table;
  }

  crc32Table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    crc32Table[i] = crc;
  }

  return crc32Table;
}

// ============================================================================
// PacketPadder Class
// ============================================================================

export class PacketPadder {
  private config: PaddingConfig;
  private stats: PaddingStats;

  constructor(config: Partial<PaddingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = this.initStats();
  }

  private initStats(): PaddingStats {
    return {
      totalPackets: 0,
      totalOriginalBytes: 0,
      totalPaddedBytes: 0,
      averageOverhead: 0,
      fragmentedPackets: 0,
    };
  }

  // ==========================================================================
  // Size Calculation
  // ==========================================================================

  /**
   * Calculate target size based on padding mode
   */
  calculateTargetSize(dataSize: number): number {
    // Header: magic(4) + originalSize(4) + flags(2) + checksum(4) = 14 bytes
    const headerSize = this.config.includeIntegrity ? 14 : 10;
    const totalNeeded = dataSize + headerSize;

    switch (this.config.mode) {
      case PaddingMode.UNIFORM:
        return this.findNearestTargetSize(totalNeeded);

      case PaddingMode.RANDOM:
        return this.calculateRandomSize(totalNeeded);

      case PaddingMode.POWER_OF_TWO:
        return this.findNearestPowerOfTwo(totalNeeded);

      case PaddingMode.ALIGNED:
        return this.alignToMultiple(totalNeeded);

      case PaddingMode.EXPONENTIAL:
        return this.calculateExponentialSize(dataSize);

      case PaddingMode.NONE:
        return totalNeeded;

      default:
        return this.findNearestTargetSize(totalNeeded);
    }
  }

  /**
   * Find nearest target size from predefined list
   */
  private findNearestTargetSize(needed: number): number {
    for (const size of this.config.targetSizes) {
      if (size >= needed && size >= this.config.minSize && size <= this.config.maxSize) {
        return size;
      }
    }
    // If no suitable size found, use max
    return Math.min(this.config.maxSize, Math.max(needed, this.config.minSize));
  }

  /**
   * Calculate random size within range
   */
  private calculateRandomSize(needed: number): number {
    const min = Math.max(needed, this.config.minSize);
    const max = this.config.maxSize;

    if (min >= max) {
      return min;
    }

    return randomInt(min, max);
  }

  /**
   * Find nearest power of 2
   */
  private findNearestPowerOfTwo(needed: number): number {
    for (const size of POWER_OF_TWO_SIZES) {
      if (size >= needed && size >= this.config.minSize && size <= this.config.maxSize) {
        return size;
      }
    }
    return Math.min(this.config.maxSize, Math.max(needed, this.config.minSize));
  }

  /**
   * Align to multiple of alignment value
   */
  private alignToMultiple(needed: number): number {
    const aligned = Math.ceil(needed / this.config.alignment) * this.config.alignment;
    return Math.min(this.config.maxSize, Math.max(aligned, this.config.minSize));
  }

  /**
   * Calculate exponential padding (more for smaller packets)
   */
  private calculateExponentialSize(dataSize: number): number {
    // Smaller packets get more relative padding
    const ratio = 1 - (dataSize / this.config.maxSize);
    const extraPadding = Math.floor(this.config.maxSize * ratio * ratio * 0.5);
    const needed = dataSize + 14 + extraPadding;
    return Math.min(this.config.maxSize, Math.max(needed, this.config.minSize));
  }

  // ==========================================================================
  // Padding Operations
  // ==========================================================================

  /**
   * Pad a single packet
   */
  pad(data: Uint8Array): PaddedPacket {
    const targetSize = this.calculateTargetSize(data.length);
    const headerSize = this.config.includeIntegrity ? 14 : 10;
    const paddingSize = targetSize - data.length - headerSize;

    // Create padded packet
    const padded = new Uint8Array(targetSize);
    const view = new DataView(padded.buffer);

    // Write header
    view.setUint32(0, PACKET_MAGIC, false);           // Magic bytes
    view.setUint32(4, data.length, false);            // Original size
    view.setUint16(8, this.encodeFlags(false, 0, 1), false); // Flags

    // Write data
    padded.set(data, 10);

    // Generate padding
    const padding = this.config.useCryptoPadding
      ? randomBytes(paddingSize)
      : new Uint8Array(paddingSize);

    // Write padding after data
    padded.set(padding, 10 + data.length);

    // Write checksum if enabled
    if (this.config.includeIntegrity) {
      const checksum = crc32(data);
      view.setUint32(targetSize - 4, checksum, false);
    }

    // Update stats
    this.stats.totalPackets++;
    this.stats.totalOriginalBytes += data.length;
    this.stats.totalPaddedBytes += targetSize;
    this.updateAverageOverhead();

    return {
      data: padded,
      originalSize: data.length,
      paddedSize: targetSize,
      paddingSize,
      isFragmented: false,
      fragmentIndex: 0,
      totalFragments: 1,
      checksum: this.config.includeIntegrity ? crc32(data) : undefined,
    };
  }

  /**
   * Unpad a packet and extract original data
   */
  unpad(padded: Uint8Array): Uint8Array | null {
    if (padded.length < 10) {
      secureLog.warn('[PacketPadder] Packet too small');
      return null;
    }

    const view = new DataView(padded.buffer, padded.byteOffset);

    // Verify magic bytes
    const magic = view.getUint32(0, false);
    if (magic !== PACKET_MAGIC) {
      secureLog.warn('[PacketPadder] Invalid packet magic');
      return null;
    }

    // Read original size
    const originalSize = view.getUint32(4, false);
    if (originalSize > padded.length - 10) {
      secureLog.warn('[PacketPadder] Invalid original size');
      return null;
    }

    // Extract data
    const data = padded.slice(10, 10 + originalSize);

    // Verify checksum if present
    if (this.config.includeIntegrity && padded.length >= 14) {
      const storedChecksum = view.getUint32(padded.length - 4, false);
      const computedChecksum = crc32(data);

      if (storedChecksum !== computedChecksum) {
        secureLog.warn('[PacketPadder] Checksum mismatch');
        return null;
      }
    }

    return data;
  }

  /**
   * Pad with fragmentation for large data
   */
  padWithFragmentation(data: Uint8Array): PaddedPacket[] {
    // Calculate maximum payload per fragment
    const headerSize = this.config.includeIntegrity ? 14 : 10;
    const maxPayload = this.config.mtu - headerSize;

    if (data.length <= maxPayload || !this.config.enableFragmentation) {
      return [this.pad(data)];
    }

    const fragments: PaddedPacket[] = [];
    const totalFragments = Math.ceil(data.length / maxPayload);

    for (let i = 0; i < totalFragments; i++) {
      const start = i * maxPayload;
      const end = Math.min(start + maxPayload, data.length);
      const chunk = data.slice(start, end);

      // Create fragment
      const targetSize = this.calculateTargetSize(chunk.length);
      const paddingSize = targetSize - chunk.length - headerSize;

      const fragment = new Uint8Array(targetSize);
      const view = new DataView(fragment.buffer);

      // Write header with fragment info
      view.setUint32(0, PACKET_MAGIC, false);
      view.setUint32(4, chunk.length, false);
      view.setUint16(8, this.encodeFlags(true, i, totalFragments), false);

      // Write data
      fragment.set(chunk, 10);

      // Generate and write padding
      const padding = this.config.useCryptoPadding
        ? randomBytes(paddingSize)
        : new Uint8Array(paddingSize);
      fragment.set(padding, 10 + chunk.length);

      // Write checksum
      if (this.config.includeIntegrity) {
        view.setUint32(targetSize - 4, crc32(chunk), false);
      }

      fragments.push({
        data: fragment,
        originalSize: chunk.length,
        paddedSize: targetSize,
        paddingSize,
        isFragmented: true,
        fragmentIndex: i,
        totalFragments,
        checksum: this.config.includeIntegrity ? crc32(chunk) : undefined,
      });

      this.stats.fragmentedPackets++;
    }

    this.stats.totalPackets += fragments.length;
    this.stats.totalOriginalBytes += data.length;
    this.stats.totalPaddedBytes += fragments.reduce((sum, f) => sum + f.paddedSize, 0);
    this.updateAverageOverhead();

    return fragments;
  }

  /**
   * Reassemble fragmented packets
   */
  reassemble(fragments: PaddedPacket[]): Uint8Array | null {
    if (fragments.length === 0) {
      return null;
    }

    // Sort by fragment index
    const sorted = [...fragments].sort((a, b) => a.fragmentIndex - b.fragmentIndex);

    // Verify we have all fragments
    const expectedTotal = sorted[0]?.totalFragments ?? 0;
    if (sorted.length !== expectedTotal) {
      secureLog.warn('[PacketPadder] Missing fragments');
      return null;
    }

    // Extract and combine data from each fragment
    const chunks: Uint8Array[] = [];

    for (const fragment of sorted) {
      const unpadded = this.unpad(fragment.data);
      if (!unpadded) {
        secureLog.warn('[PacketPadder] Failed to unpad fragment');
        return null;
      }
      chunks.push(unpadded);
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Encode flags into 16-bit value
   */
  private encodeFlags(isFragmented: boolean, fragmentIndex: number, totalFragments: number): number {
    // Flags format: [fragmented:1][reserved:3][index:6][total:6]
    let flags = 0;
    if (isFragmented) {
      flags |= 0x8000;
    }
    flags |= (fragmentIndex & 0x3F) << 6;
    flags |= (totalFragments & 0x3F);
    return flags;
  }

  /**
   * Decode flags from 16-bit value
   */
  decodeFlags(flags: number): { isFragmented: boolean; fragmentIndex: number; totalFragments: number } {
    return {
      isFragmented: (flags & 0x8000) !== 0,
      fragmentIndex: (flags >> 6) & 0x3F,
      totalFragments: flags & 0x3F,
    };
  }

  /**
   * Update average overhead statistic
   */
  private updateAverageOverhead(): void {
    if (this.stats.totalOriginalBytes > 0) {
      const overhead = (this.stats.totalPaddedBytes - this.stats.totalOriginalBytes) /
                       this.stats.totalOriginalBytes * 100;
      this.stats.averageOverhead = overhead;
    }
  }

  // ==========================================================================
  // Configuration & Statistics
  // ==========================================================================

  /**
   * Get current statistics
   */
  getStats(): PaddingStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = this.initStats();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PaddingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PaddingConfig {
    return { ...this.config };
  }

  /**
   * Set padding mode
   */
  setMode(mode: PaddingMode): void {
    this.config.mode = mode;
  }

  /**
   * Get estimated overhead for a given data size
   */
  estimateOverhead(dataSize: number): number {
    const targetSize = this.calculateTargetSize(dataSize);
    return ((targetSize - dataSize) / dataSize) * 100;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let padderInstance: PacketPadder | null = null;

export function getPacketPadder(config?: Partial<PaddingConfig>): PacketPadder {
  if (!padderInstance) {
    padderInstance = new PacketPadder(config);
  } else if (config) {
    padderInstance.updateConfig(config);
  }
  return padderInstance;
}

export function resetPacketPadder(): void {
  padderInstance = null;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick pad function with default settings
 */
export function quickPad(data: Uint8Array, mode: PaddingMode = PaddingMode.UNIFORM): Uint8Array {
  const padder = getPacketPadder({ mode });
  return padder.pad(data).data;
}

/**
 * Quick unpad function
 */
export function quickUnpad(padded: Uint8Array): Uint8Array | null {
  const padder = getPacketPadder();
  return padder.unpad(padded);
}

export default PacketPadder;
