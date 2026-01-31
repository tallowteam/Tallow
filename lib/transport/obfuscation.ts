'use client';

/**
 * Traffic Obfuscation Module
 *
 * Implements comprehensive traffic analysis resistance:
 * - Protocol obfuscation (disguise WebRTC/WebSocket as HTTPS)
 * - Packet padding to uniform sizes
 * - Timing obfuscation with cryptographic jitter
 * - Domain fronting support
 * - Cover traffic generation
 * - Anti-fingerprinting measures
 *
 * SECURITY IMPACT: 10 | PRIVACY IMPACT: 10
 * PRIORITY: CRITICAL
 */

import secureLog from '../utils/secure-logger';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Main obfuscation configuration
 */
export interface ObfuscationConfig {
  // Padding configuration
  minPacketSize: number;      // Minimum packet size (pad small packets up to this)
  maxPacketSize: number;      // Maximum packet size (fragment large packets)
  paddingMode: 'uniform' | 'random' | 'exponential';

  // Timing configuration
  minDelay: number;           // Minimum inter-packet delay (ms)
  maxDelay: number;           // Maximum delay with jitter (ms)
  timingMode: 'constant' | 'jittered' | 'burst';
  burstSize?: number;         // Number of packets in a burst
  burstInterval?: number;     // Interval between bursts (ms)

  // Protocol disguise
  disguiseAs: 'https' | 'websocket' | 'webrtc' | 'http2';

  // Domain fronting
  frontDomain?: string;       // CDN domain to front through
  targetDomain?: string;      // Actual target domain (hidden)

  // Cover traffic
  enableCoverTraffic: boolean;
  coverTrafficRate: number;   // Packets per second
  coverTrafficVariance: number; // Variance in rate (0-1)

  // Anti-fingerprinting
  randomizeHeaders: boolean;
  mimicBrowser: boolean;
  browserProfile?: 'chrome' | 'firefox' | 'safari' | 'edge';

  // Advanced options
  enableChunking: boolean;
  targetBitrate: number;      // Target bitrate in bits per second
  decoyProbability: number;   // Probability of sending decoy traffic (0-1)
}

/**
 * Obfuscated packet structure
 */
export interface ObfuscatedPacket {
  data: Uint8Array;
  type: PacketType;
  sequenceNumber: number;
  timestamp: number;
  flags: PacketFlags;
}

/**
 * Packet types for the obfuscation layer
 */
export enum PacketType {
  DATA = 0x01,
  PADDING = 0x02,
  DECOY = 0x03,
  COVER = 0x04,
  CONTROL = 0x05,
  HEARTBEAT = 0x06,
  END = 0xFF,
}

/**
 * Packet flags for metadata
 */
export interface PacketFlags {
  isFragmented: boolean;
  fragmentIndex: number;
  totalFragments: number;
  hasMore: boolean;
  isCompressed: boolean;
  priority: 'low' | 'normal' | 'high';
}

/**
 * Protocol disguise headers
 */
export interface DisguiseHeaders {
  'Content-Type': string;
  'X-Request-ID': string;
  'Accept-Encoding': string;
  'Cache-Control': string;
  'User-Agent'?: string;
  [key: string]: string | undefined;
}

/**
 * Domain fronting configuration
 */
export interface DomainFrontConfig {
  frontDomain: string;        // Visible domain (e.g., cdn.cloudflare.com)
  targetDomain: string;       // Hidden target (e.g., tallow.app)
  sniHost: string;            // SNI hostname (usually frontDomain)
  httpHost: string;           // HTTP Host header (targetDomain)
}

/**
 * Transfer statistics for obfuscation
 */
export interface ObfuscationStats {
  originalSize: number;
  paddedSize: number;
  totalPackets: number;
  dataPackets: number;
  paddingPackets: number;
  decoyPackets: number;
  coverPackets: number;
  averageBitrate: number;
  timingVariance: number;
  overheadPercentage: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: ObfuscationConfig = {
  // Padding - pad to common sizes to blend with HTTPS traffic
  minPacketSize: 1024,          // 1KB minimum
  maxPacketSize: 16384,         // 16KB maximum (common TLS record size)
  paddingMode: 'uniform',

  // Timing - add enough jitter to prevent timing analysis
  minDelay: 1,                  // 1ms minimum
  maxDelay: 50,                 // 50ms maximum jitter
  timingMode: 'jittered',

  // Protocol disguise
  disguiseAs: 'https',

  // Cover traffic
  enableCoverTraffic: true,
  coverTrafficRate: 2,          // 2 packets/second baseline
  coverTrafficVariance: 0.3,    // 30% variance

  // Anti-fingerprinting
  randomizeHeaders: true,
  mimicBrowser: true,
  browserProfile: 'chrome',

  // Advanced
  enableChunking: true,
  targetBitrate: 1_000_000,     // 1 Mbps
  decoyProbability: 0.15,       // 15% decoy traffic
};

// Common TLS record sizes to blend with
const TLS_RECORD_SIZES = [1460, 2920, 4380, 8760, 16384];

// Browser User-Agents for fingerprint mimicking
const BROWSER_USER_AGENTS: Record<string, string> = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
};

// HTTP/2 pseudo-headers for protocol disguise (exported for future HTTP/2 disguise mode)
export const HTTP2_HEADERS = [
  ':method', ':path', ':scheme', ':authority',
  'accept', 'accept-encoding', 'accept-language',
  'cache-control', 'content-type', 'user-agent',
] as const;

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
 * Generate cryptographically random integer in range [min, max]
 */
function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  const bytes = randomBytes(4);
  const value = new DataView(bytes.buffer).getUint32(0, false);
  return min + (value % range);
}

/**
 * Generate cryptographically random float in range [0, 1)
 */
function randomFloat(): number {
  const bytes = randomBytes(4);
  return new DataView(bytes.buffer).getUint32(0, false) / 0xFFFFFFFF;
}

/**
 * Generate exponential random delay for natural-looking timing
 */
function exponentialDelay(mean: number): number {
  return -mean * Math.log(1 - randomFloat());
}

/**
 * Calculate nearest TLS record size for uniform padding
 */
function nearestTLSSize(size: number): number {
  for (const tlsSize of TLS_RECORD_SIZES) {
    if (size <= tlsSize) {
      return tlsSize;
    }
  }
  return TLS_RECORD_SIZES[TLS_RECORD_SIZES.length - 1] ?? 16384;
}

// ============================================================================
// Traffic Obfuscator Class
// ============================================================================

export class TrafficObfuscator {
  private config: ObfuscationConfig;
  private stats: ObfuscationStats;
  private sequenceNumber: number = 0;
  private coverTrafficInterval: ReturnType<typeof setInterval> | null = null;
  private domainFrontConfig: DomainFrontConfig | null = null;

  constructor(config: Partial<ObfuscationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = this.initStats();

    // Initialize domain fronting if configured
    if (this.config.frontDomain && this.config.targetDomain) {
      this.domainFrontConfig = {
        frontDomain: this.config.frontDomain,
        targetDomain: this.config.targetDomain,
        sniHost: this.config.frontDomain,
        httpHost: this.config.targetDomain,
      };
    }
  }

  private initStats(): ObfuscationStats {
    return {
      originalSize: 0,
      paddedSize: 0,
      totalPackets: 0,
      dataPackets: 0,
      paddingPackets: 0,
      decoyPackets: 0,
      coverPackets: 0,
      averageBitrate: 0,
      timingVariance: 0,
      overheadPercentage: 0,
    };
  }

  // ==========================================================================
  // Packet Padding
  // ==========================================================================

  /**
   * Pad data to uniform size based on configured mode
   */
  padToUniformSize(data: Uint8Array): Uint8Array {
    const originalSize = data.length;
    let targetSize: number;

    switch (this.config.paddingMode) {
      case 'uniform':
        // Pad to nearest TLS record size
        targetSize = nearestTLSSize(originalSize + 5); // +5 for header
        break;

      case 'random':
        // Pad to random size between min and max
        targetSize = randomInt(
          Math.max(originalSize + 5, this.config.minPacketSize),
          this.config.maxPacketSize
        );
        break;

      case 'exponential':
        // Pad with exponentially distributed extra padding
        const extraPadding = Math.floor(exponentialDelay(this.config.maxPacketSize / 4));
        targetSize = Math.min(originalSize + 5 + extraPadding, this.config.maxPacketSize);
        break;

      default:
        targetSize = nearestTLSSize(originalSize + 5);
    }

    // Ensure minimum size
    targetSize = Math.max(targetSize, this.config.minPacketSize);

    // Create padded packet: [type:1][size:4][data][padding]
    const padded = new Uint8Array(targetSize);
    const view = new DataView(padded.buffer);

    padded[0] = PacketType.DATA;
    view.setUint32(1, originalSize, false);
    padded.set(data, 5);

    // Fill padding with random bytes
    const padding = randomBytes(targetSize - 5 - originalSize);
    padded.set(padding, 5 + originalSize);

    this.stats.originalSize += originalSize;
    this.stats.paddedSize += targetSize;
    this.stats.dataPackets++;

    return padded;
  }

  /**
   * Public API to pad data (wraps padToUniformSize)
   */
  padData(data: Uint8Array): Uint8Array {
    return this.padToUniformSize(data);
  }

  /**
   * Extract original data from padded packet
   */
  unpadData(paddedData: Uint8Array): Uint8Array | null {
    if (paddedData.length < 5) {
      return null;
    }

    const type = paddedData[0];

    // Skip non-data packets
    if (type === PacketType.DECOY || type === PacketType.COVER || type === PacketType.PADDING) {
      return null;
    }

    if (type !== PacketType.DATA) {
      return null;
    }

    const view = new DataView(paddedData.buffer, paddedData.byteOffset);
    const originalSize = view.getUint32(1, false);

    if (originalSize > paddedData.length - 5) {
      secureLog.warn('[Obfuscation] Invalid packet size');
      return null;
    }

    return paddedData.slice(5, 5 + originalSize);
  }

  /**
   * Fragment large data into multiple packets
   */
  fragmentData(data: Uint8Array): Uint8Array[] {
    if (!this.config.enableChunking || data.length <= this.config.maxPacketSize - 13) {
      return [this.padToUniformSize(data)];
    }

    const fragments: Uint8Array[] = [];
    const maxPayload = this.config.maxPacketSize - 13; // Header: type(1) + size(4) + seq(4) + flags(4)
    const totalFragments = Math.ceil(data.length / maxPayload);

    for (let i = 0; i < totalFragments; i++) {
      const start = i * maxPayload;
      const end = Math.min(start + maxPayload, data.length);
      const chunk = data.slice(start, end);

      // Create fragmented packet
      const packet = new Uint8Array(this.config.maxPacketSize);
      const view = new DataView(packet.buffer);

      packet[0] = PacketType.DATA;
      view.setUint32(1, chunk.length, false);
      view.setUint32(5, this.sequenceNumber++, false);

      // Flags: fragmented(1) | index(2) | total(2) | hasMore(1)
      const flags = (1 << 7) | ((i & 0xFF) << 4) | ((totalFragments & 0x0F) << 1) | (i < totalFragments - 1 ? 1 : 0);
      view.setUint32(9, flags, false);

      packet.set(chunk, 13);

      // Random padding for remaining space
      const padding = randomBytes(this.config.maxPacketSize - 13 - chunk.length);
      packet.set(padding, 13 + chunk.length);

      fragments.push(packet);
    }

    return fragments;
  }

  /**
   * Reassemble fragmented packets
   */
  reassembleFragments(packets: Uint8Array[]): Uint8Array {
    // Sort by sequence number and combine
    const sorted = packets.sort((a, b) => {
      const seqA = new DataView(a.buffer, a.byteOffset).getUint32(5, false);
      const seqB = new DataView(b.buffer, b.byteOffset).getUint32(5, false);
      return seqA - seqB;
    });

    const chunks: Uint8Array[] = [];
    for (const packet of sorted) {
      const view = new DataView(packet.buffer, packet.byteOffset);
      const size = view.getUint32(1, false);
      chunks.push(packet.slice(13, 13 + size));
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
  // Timing Obfuscation
  // ==========================================================================

  /**
   * Calculate delay before sending next packet
   */
  calculateDelay(): number {
    switch (this.config.timingMode) {
      case 'constant':
        // Fixed delay for constant bitrate
        return this.config.minDelay;

      case 'jittered':
        // Random delay with cryptographic jitter
        return this.config.minDelay + randomInt(0, this.config.maxDelay - this.config.minDelay);

      case 'burst':
        // Burst mode: fast within burst, pause between bursts
        const burstSize = this.config.burstSize || 5;
        const burstInterval = this.config.burstInterval || 100;
        const packetInBurst = this.stats.totalPackets % burstSize;

        if (packetInBurst === burstSize - 1) {
          // End of burst, wait for burst interval
          return burstInterval + randomInt(0, Math.floor(burstInterval * 0.2));
        }
        return this.config.minDelay;

      default:
        return this.config.minDelay;
    }
  }

  /**
   * Sleep for a cryptographically random delay
   */
  async applyTimingDelay(): Promise<void> {
    const delay = this.calculateDelay();
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Calculate timing to achieve target bitrate
   */
  calculateBitrateDelay(packetSize: number): number {
    const bytesPerMs = this.config.targetBitrate / 8 / 1000;
    const baseDelay = packetSize / bytesPerMs;

    // Add jitter
    const jitter = (randomFloat() - 0.5) * 0.2 * baseDelay;
    return Math.max(0, baseDelay + jitter);
  }

  // ==========================================================================
  // Protocol Disguise
  // ==========================================================================

  /**
   * Generate disguise headers to make traffic look like normal HTTPS
   */
  generateDisguiseHeaders(): DisguiseHeaders {
    const requestId = Array.from(randomBytes(16))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const headers: DisguiseHeaders = {
      'Content-Type': this.getContentType(),
      'X-Request-ID': requestId,
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
    };

    if (this.config.mimicBrowser && this.config.browserProfile) {
      const userAgent = BROWSER_USER_AGENTS[this.config.browserProfile];
      if (userAgent) {
        headers['User-Agent'] = userAgent;
      }
    }

    if (this.config.randomizeHeaders) {
      // Add common headers with slight variations
      headers['Accept-Language'] = this.randomAcceptLanguage();
      headers['Sec-Fetch-Mode'] = this.randomSecFetchMode();
      headers['Sec-Fetch-Site'] = 'same-origin';
    }

    return headers;
  }

  private getContentType(): string {
    switch (this.config.disguiseAs) {
      case 'https':
        return 'application/octet-stream';
      case 'websocket':
        return 'application/json';
      case 'webrtc':
        return 'application/sdp';
      case 'http2':
        return 'application/grpc+proto';
      default:
        return 'application/octet-stream';
    }
  }

  private randomAcceptLanguage(): string {
    const languages = ['en-US,en;q=0.9', 'en-GB,en;q=0.9', 'en-US,en;q=0.8,de;q=0.6'];
    const index = randomInt(0, languages.length - 1);
    const selected = languages[index];
    return selected !== undefined ? selected : 'en-US,en;q=0.9';
  }

  private randomSecFetchMode(): string {
    const modes = ['navigate', 'cors', 'no-cors', 'same-origin'];
    const index = randomInt(0, modes.length - 1);
    const selected = modes[index];
    return selected !== undefined ? selected : 'cors';
  }

  /**
   * Wrap packet in HTTP-like frame for protocol disguise
   */
  wrapInProtocolFrame(data: Uint8Array): Uint8Array {
    const headers = this.generateDisguiseHeaders();
    const headerStr = Object.entries(headers)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\r\n');

    // Create HTTP-like frame
    const headerBytes = new TextEncoder().encode(
      `POST /api/v1/transfer HTTP/1.1\r\n${headerStr}\r\nContent-Length: ${data.length}\r\n\r\n`
    );

    const frame = new Uint8Array(headerBytes.length + data.length);
    frame.set(headerBytes, 0);
    frame.set(data, headerBytes.length);

    return frame;
  }

  /**
   * Unwrap packet from protocol frame
   */
  unwrapFromProtocolFrame(frame: Uint8Array): Uint8Array | null {
    // Find end of headers
    const headerEnd = this.findHeaderEnd(frame);
    if (headerEnd === -1) {
      return frame; // Not wrapped, return as-is
    }

    return frame.slice(headerEnd + 4);
  }

  private findHeaderEnd(data: Uint8Array): number {
    // Look for \r\n\r\n
    for (let i = 0; i < data.length - 3; i++) {
      if (data[i] === 0x0D && data[i + 1] === 0x0A &&
          data[i + 2] === 0x0D && data[i + 3] === 0x0A) {
        return i;
      }
    }
    return -1;
  }

  // ==========================================================================
  // Domain Fronting
  // ==========================================================================

  /**
   * Configure domain fronting
   */
  configureDomainFronting(frontDomain: string, targetDomain: string): void {
    this.domainFrontConfig = {
      frontDomain,
      targetDomain,
      sniHost: frontDomain,
      httpHost: targetDomain,
    };
    secureLog.log('[Obfuscation] Domain fronting configured:', frontDomain, '->', targetDomain);
  }

  /**
   * Get domain fronting configuration
   */
  getDomainFrontConfig(): DomainFrontConfig | null {
    return this.domainFrontConfig;
  }

  /**
   * Check if domain fronting is available
   */
  isDomainFrontingEnabled(): boolean {
    return this.domainFrontConfig !== null;
  }

  /**
   * Get the visible (front) URL for domain fronting
   */
  getFrontedUrl(path: string): string {
    if (!this.domainFrontConfig) {
      throw new Error('Domain fronting not configured');
    }
    return `https://${this.domainFrontConfig.frontDomain}${path}`;
  }

  /**
   * Get headers for domain fronting request
   */
  getDomainFrontHeaders(): Record<string, string> {
    if (!this.domainFrontConfig) {
      throw new Error('Domain fronting not configured');
    }
    return {
      'Host': this.domainFrontConfig.httpHost,
      ...this.generateDisguiseHeaders(),
    };
  }

  // ==========================================================================
  // Cover Traffic & Decoys
  // ==========================================================================

  /**
   * Check if decoy should be sent based on probability
   */
  private shouldSendDecoy(): boolean {
    return randomFloat() < this.config.decoyProbability;
  }

  /**
   * Generate a decoy packet
   */
  generateDecoyPacket(): ObfuscatedPacket {
    // Random size similar to data packets
    const size = randomInt(this.config.minPacketSize, this.config.maxPacketSize);
    const data = new Uint8Array(size);

    data[0] = PacketType.DECOY;
    crypto.getRandomValues(data.subarray(1));

    this.stats.decoyPackets++;
    this.stats.totalPackets++;

    return {
      data,
      type: PacketType.DECOY,
      sequenceNumber: this.sequenceNumber++,
      timestamp: Date.now(),
      flags: {
        isFragmented: false,
        fragmentIndex: 0,
        totalFragments: 1,
        hasMore: false,
        isCompressed: false,
        priority: 'low',
      },
    };
  }

  /**
   * Generate cover traffic packet
   */
  generateCoverPacket(): ObfuscatedPacket {
    // Cover traffic mimics idle browsing patterns
    const size = TLS_RECORD_SIZES[randomInt(0, TLS_RECORD_SIZES.length - 1)] ?? 1460;
    const data = new Uint8Array(size);

    data[0] = PacketType.COVER;
    crypto.getRandomValues(data.subarray(1));

    this.stats.coverPackets++;
    this.stats.totalPackets++;

    return {
      data,
      type: PacketType.COVER,
      sequenceNumber: this.sequenceNumber++,
      timestamp: Date.now(),
      flags: {
        isFragmented: false,
        fragmentIndex: 0,
        totalFragments: 1,
        hasMore: false,
        isCompressed: false,
        priority: 'low',
      },
    };
  }

  /**
   * Start cover traffic generation
   */
  startCoverTraffic(onPacket: (packet: ObfuscatedPacket) => void): void {
    if (!this.config.enableCoverTraffic || this.coverTrafficInterval) {
      return;
    }

    const scheduleNext = () => {
      // Calculate interval with variance
      const baseInterval = 1000 / this.config.coverTrafficRate;
      const variance = baseInterval * this.config.coverTrafficVariance;
      const interval = baseInterval + (randomFloat() - 0.5) * 2 * variance;

      this.coverTrafficInterval = setTimeout(() => {
        onPacket(this.generateCoverPacket());
        scheduleNext();
      }, Math.max(10, interval));
    };

    scheduleNext();
    secureLog.log('[Obfuscation] Cover traffic started');
  }

  /**
   * Stop cover traffic generation
   */
  stopCoverTraffic(): void {
    if (this.coverTrafficInterval) {
      clearTimeout(this.coverTrafficInterval);
      this.coverTrafficInterval = null;
      secureLog.log('[Obfuscation] Cover traffic stopped');
    }
  }

  // ==========================================================================
  // Main Obfuscation API
  // ==========================================================================

  /**
   * Obfuscate outgoing data
   */
  async obfuscate(data: Uint8Array): Promise<ObfuscatedPacket[]> {
    const packets: ObfuscatedPacket[] = [];

    // Maybe add leading decoy
    if (this.shouldSendDecoy()) {
      packets.push(this.generateDecoyPacket());
    }

    // Fragment and pad data
    const fragments = this.fragmentData(data);

    for (const fragment of fragments) {
      // Apply timing delay
      await this.applyTimingDelay();

      packets.push({
        data: fragment,
        type: PacketType.DATA,
        sequenceNumber: this.sequenceNumber++,
        timestamp: Date.now(),
        flags: {
          isFragmented: fragments.length > 1,
          fragmentIndex: packets.filter(p => p.type === PacketType.DATA).length,
          totalFragments: fragments.length,
          hasMore: packets.filter(p => p.type === PacketType.DATA).length < fragments.length - 1,
          isCompressed: false,
          priority: 'normal',
        },
      });

      this.stats.totalPackets++;

      // Maybe add trailing decoy
      if (this.shouldSendDecoy()) {
        packets.push(this.generateDecoyPacket());
      }
    }

    return packets;
  }

  /**
   * Deobfuscate incoming data
   */
  deobfuscate(packets: ObfuscatedPacket[]): Uint8Array | null {
    // Filter out decoys and cover traffic
    const dataPackets = packets.filter(p =>
      p.type === PacketType.DATA &&
      p.data[0] === PacketType.DATA
    );

    if (dataPackets.length === 0) {
      return null;
    }

    // Check if fragmented
    const firstPacket = dataPackets[0]!;
    if (firstPacket.flags.isFragmented) {
      return this.reassembleFragments(dataPackets.map(p => p.data));
    }

    // Single packet
    return this.unpadData(firstPacket.data);
  }

  /**
   * Obfuscate with protocol disguise
   */
  async obfuscateWithDisguise(data: Uint8Array): Promise<Uint8Array[]> {
    const packets = await this.obfuscate(data);
    return packets.map(p => this.wrapInProtocolFrame(p.data));
  }

  /**
   * Full deobfuscation pipeline
   */
  deobfuscateFromDisguise(frames: Uint8Array[]): Uint8Array | null {
    const packets: ObfuscatedPacket[] = frames.map((frame, i) => {
      const data = this.unwrapFromProtocolFrame(frame) || frame;
      return {
        data,
        type: data[0] as PacketType,
        sequenceNumber: i,
        timestamp: Date.now(),
        flags: {
          isFragmented: false,
          fragmentIndex: 0,
          totalFragments: 1,
          hasMore: false,
          isCompressed: false,
          priority: 'normal' as const,
        },
      };
    });

    return this.deobfuscate(packets);
  }

  // ==========================================================================
  // Async Generator API (for streaming)
  // ==========================================================================

  /**
   * Stream obfuscated data with constant bitrate
   */
  async *streamObfuscated(
    data: Uint8Array
  ): AsyncGenerator<ObfuscatedPacket> {
    const packets = await this.obfuscate(data);

    for (const packet of packets) {
      const delay = this.calculateBitrateDelay(packet.data.length);
      await new Promise(resolve => setTimeout(resolve, delay));
      yield packet;
    }

    // Send end marker
    yield {
      data: new Uint8Array([PacketType.END]),
      type: PacketType.END,
      sequenceNumber: this.sequenceNumber++,
      timestamp: Date.now(),
      flags: {
        isFragmented: false,
        fragmentIndex: 0,
        totalFragments: 1,
        hasMore: false,
        isCompressed: false,
        priority: 'high',
      },
    };
  }

  /**
   * Receive and reconstruct from obfuscated stream
   */
  async receiveObfuscatedStream(
    stream: AsyncIterable<ObfuscatedPacket>
  ): Promise<Uint8Array> {
    const packets: ObfuscatedPacket[] = [];

    for await (const packet of stream) {
      if (packet.type === PacketType.END) {
        break;
      }
      packets.push(packet);
    }

    return this.deobfuscate(packets) || new Uint8Array(0);
  }

  // ==========================================================================
  // Statistics & Configuration
  // ==========================================================================

  /**
   * Get obfuscation statistics
   */
  getStats(): ObfuscationStats {
    const overhead = this.stats.originalSize > 0
      ? ((this.stats.paddedSize - this.stats.originalSize) / this.stats.originalSize) * 100
      : 0;

    return {
      ...this.stats,
      overheadPercentage: overhead,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = this.initStats();
    this.sequenceNumber = 0;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ObfuscationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ObfuscationConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopCoverTraffic();
    this.resetStats();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let obfuscatorInstance: TrafficObfuscator | null = null;

export function getTrafficObfuscator(config?: Partial<ObfuscationConfig>): TrafficObfuscator {
  if (!obfuscatorInstance) {
    obfuscatorInstance = new TrafficObfuscator(config);
  } else if (config) {
    obfuscatorInstance.updateConfig(config);
  }
  return obfuscatorInstance;
}

export function resetTrafficObfuscator(): void {
  if (obfuscatorInstance) {
    obfuscatorInstance.destroy();
    obfuscatorInstance = null;
  }
}

// Export default instance
export const trafficObfuscator = new TrafficObfuscator();

export default TrafficObfuscator;
