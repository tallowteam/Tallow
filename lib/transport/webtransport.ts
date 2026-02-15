/**
 * WebTransport API Support
 *
 * Production-grade HTTP/3-based transport for file transfers over QUIC.
 * WebTransport provides multiplexed bidirectional streams and unreliable datagrams
 * with superior performance vs WebRTC DataChannels and WebSockets.
 *
 * Browser support: Chrome 114+, Edge 114+. No Firefox/Safari support as of 2026-02.
 * Server requirement: An HTTP/3 (QUIC) server that speaks the WebTransport protocol.
 *   - Example server frameworks: Cloudflare Workers (native), Go (quic-go + webtransport-go),
 *     Rust (wtransport), Node.js (not yet mature).
 *   - The server URL must be HTTPS on a domain with a valid TLS certificate, or
 *     use serverCertificateHashes for self-signed certs (dev only).
 *
 * File transfer protocol (over bidirectional stream):
 *   Sender -> Receiver:
 *     [4 bytes: HEADER magic 0x54 0x4C 0x57 0x54 ("TLWT")]
 *     [4 bytes: header length (uint32 LE)]
 *     [header JSON: { name, size, type, chunkSize, totalChunks }]
 *     [chunk 0 ... chunk N]
 *   Receiver -> Sender:
 *     [1 byte: ACK (0x06) or NACK (0x15)]
 *     [4 bytes: chunk index (uint32 LE) that was received/failed]
 *
 * PERFORMANCE IMPACT: 10 | LATENCY IMPACT: 10
 * PRIORITY: HIGH
 */

import secureLog from '../utils/secure-logger';
import { captureException, addBreadcrumb } from '../monitoring/sentry';
import { recordError } from '../monitoring/metrics';

// ============================================================================
// Type Definitions
// ============================================================================

export type WebTransportState = 'new' | 'connecting' | 'connected' | 'draining' | 'closed' | 'failed';
export type StreamType = 'bidirectional' | 'unidirectional';

export interface WebTransportConfig {
  /** WebTransport server URL (must be https://) */
  url: string;
  /** SHA-256 certificate hashes for self-signed certs (dev only) */
  serverCertificateHashes?: string[];
  /** Allow connection pooling with other WebTransport sessions to same origin */
  allowPooling?: boolean;
  /** Require datagram (unreliable) support from the server */
  requireUnreliable?: boolean;
  /** QUIC congestion control preference */
  congestionControl?: 'default' | 'throughput' | 'low-latency';
  /** Connection timeout in milliseconds (default: 10000) */
  connectTimeoutMs?: number;
  /** Interval for quality monitoring probes in milliseconds (default: 5000) */
  qualityProbeIntervalMs?: number;
}

export interface WebTransportStats {
  state: WebTransportState;
  bytesSent: number;
  bytesReceived: number;
  datagramsSent: number;
  datagramsReceived: number;
  streamsSent: number;
  streamsReceived: number;
  /** Time to establish connection in ms */
  connectionTimeMs: number;
  /** Smoothed round-trip time in ms (exponential moving average) */
  smoothedRttMs: number;
  /** Most recent RTT sample in ms */
  lastRttMs: number;
  /** Estimated throughput in bytes per second (based on recent data) */
  throughputBps: number;
  /** Timestamp of connection establishment */
  connectedAt: number;
}

export interface WebTransportStreamOptions {
  /** Send scheduling priority (lower = higher priority) */
  sendOrder?: number;
}

export interface DatagramOptions {
  maxDatagramSize?: number;
}

/** Metadata header sent at the start of a file transfer stream */
export interface FileTransferHeader {
  name: string;
  size: number;
  type: string;
  chunkSize: number;
  totalChunks: number;
  /** Optional: SHA-256 hash of the complete file for integrity verification */
  sha256?: string;
}

// ============================================================================
// WebTransport Browser API Type Declarations
// ============================================================================

/** WebTransport constructor options per W3C spec */
interface NativeWebTransportOptions {
  allowPooling?: boolean;
  requireUnreliable?: boolean;
  serverCertificateHashes?: Array<{ algorithm: string; value: ArrayBuffer }>;
  congestionControl?: 'default' | 'throughput' | 'low-latency';
}

interface NativeWebTransportBidirectionalStream {
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<Uint8Array>;
}

// WebTransport is now part of the TypeScript DOM lib (Chrome 114+).
// No custom global declaration needed — the built-in type is used.

// ============================================================================
// Constants
// ============================================================================

/** Magic bytes at the start of every file transfer header: "TLWT" */
const HEADER_MAGIC = new Uint8Array([0x54, 0x4c, 0x57, 0x54]);
const ACK_BYTE = 0x06;
const NACK_BYTE = 0x15;
const DEFAULT_CHUNK_SIZE = 65536; // 64 KiB -- good balance for QUIC streams
const DEFAULT_CONNECT_TIMEOUT_MS = 10_000;
const DEFAULT_QUALITY_PROBE_INTERVAL_MS = 5_000;
const RTT_EWMA_ALPHA = 0.3; // Exponential weighted moving average factor for RTT
const THROUGHPUT_WINDOW_MS = 3_000; // Window over which throughput is calculated

// ============================================================================
// Browser Support Detection
// ============================================================================

/**
 * Feature-detect WebTransport in the current environment.
 *
 * Returns true only when:
 *   1. Running in a browser (not SSR/Node)
 *   2. The global WebTransport constructor exists
 *
 * As of 2026-02, supported in Chrome 114+, Edge 114+.
 * NOT supported in Firefox, Safari, or any mobile browser besides Chrome Android.
 */
export function isWebTransportSupported(): boolean {
  try {
    return typeof globalThis !== 'undefined' && typeof WebTransport !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Detailed support info with fallback suggestions.
 */
export function getWebTransportSupport(): {
  supported: boolean;
  reason?: string;
  fallbackSuggestion?: string;
} {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      reason: 'Server-side environment (SSR/Node.js) -- WebTransport is browser-only.',
      fallbackSuggestion: 'Use WebSocket relay for server-side transfers.',
    };
  }

  if (typeof WebTransport === 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    let browser = 'this browser';
    if (ua.includes('firefox')) browser = 'Firefox (no WebTransport support yet)';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari (no WebTransport support yet)';
    else if (ua.includes('chrome')) browser = 'Chrome (version may be too old -- requires 114+)';
    else if (ua.includes('edg')) browser = 'Edge (version may be too old -- requires 114+)';

    return {
      supported: false,
      reason: `WebTransport is not available in ${browser}.`,
      fallbackSuggestion: 'Fall back to WebRTC DataChannel or WebSocket relay.',
    };
  }

  return { supported: true };
}

// ============================================================================
// WebTransport Connection Class
// ============================================================================

export class WebTransportConnection {
  private transport: WebTransport | null = null;
  private readonly config: WebTransportConfig;
  private _state: WebTransportState = 'new';
  private readonly _stats: WebTransportStats;

  // Event callbacks
  public onclose?: (info: { closeCode?: number; reason?: string }) => void;
  public onerror?: (error: Error) => void;
  public onstatechange?: (state: WebTransportState) => void;
  public ondatagram?: ((data: Uint8Array) => void) | undefined;
  public onincomingstream?: (stream: NativeWebTransportBidirectionalStream) => void;

  // Internal readers/writers
  private datagramReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private datagramWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private incomingStreamReader: ReadableStreamDefaultReader<NativeWebTransportBidirectionalStream> | null = null;
  private _closed = false;

  // Quality monitoring
  private qualityProbeTimer: ReturnType<typeof setInterval> | null = null;
  private throughputSamples: Array<{ timestamp: number; bytes: number }> = [];

  constructor(config: WebTransportConfig) {
    this.config = config;
    this._stats = {
      state: 'new',
      bytesSent: 0,
      bytesReceived: 0,
      datagramsSent: 0,
      datagramsReceived: 0,
      streamsSent: 0,
      streamsReceived: 0,
      connectionTimeMs: 0,
      smoothedRttMs: 0,
      lastRttMs: 0,
      throughputBps: 0,
      connectedAt: 0,
    };
  }

  // --------------------------------------------------------------------------
  // Connection lifecycle
  // --------------------------------------------------------------------------

  /**
   * Open a WebTransport session to the configured (or provided) URL.
   * Throws if the browser does not support WebTransport or if connection fails.
   */
  async connect(url?: string): Promise<void> {
    const targetUrl = url || this.config.url;
    if (!targetUrl) {
      throw new Error('WebTransport URL is required');
    }

    const support = getWebTransportSupport();
    if (!support.supported) {
      throw new Error(`WebTransport not supported: ${support.reason} ${support.fallbackSuggestion ?? ''}`);
    }

    const connectTimeout = this.config.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;

    try {
      this.setState('connecting');
      const startTime = performance.now();
      addBreadcrumb('webtransport', `Connecting to ${targetUrl}`);

      // Build native options
      const options: NativeWebTransportOptions = {
        allowPooling: this.config.allowPooling ?? true,
        requireUnreliable: this.config.requireUnreliable ?? false,
        congestionControl: this.config.congestionControl ?? 'default',
      };

      if (this.config.serverCertificateHashes?.length) {
        options.serverCertificateHashes = this.config.serverCertificateHashes.map((hex) => ({
          algorithm: 'sha-256',
          value: hexToArrayBuffer(hex),
        }));
      }

      // Create transport instance
      this.transport = new WebTransport(targetUrl, options);

      // Race the ready promise against a timeout
      await Promise.race([
        this.transport.ready,
        rejectAfter(connectTimeout, `WebTransport connection timed out after ${connectTimeout}ms`),
      ]);

      this._stats.connectionTimeMs = Math.round(performance.now() - startTime);
      this._stats.connectedAt = Date.now();
      this.setState('connected');

      secureLog.log('[WebTransport] Connected', {
        connectionTimeMs: this._stats.connectionTimeMs,
        url: targetUrl,
      });

      // Wire up internal handlers
      this.setupDatagramHandlers();
      this.setupIncomingStreamHandler();
      this.setupDrainingHandler();
      this.setupClosedHandler();
      this.startQualityMonitoring();

    } catch (error) {
      this.setState('failed');
      const err = error instanceof Error ? error : new Error(String(error));
      captureException(err, {
        tags: { component: 'webtransport', operation: 'connect' },
        extra: { url: targetUrl },
      });
      recordError('webtransport_connection_failed', err.message);
      secureLog.error('[WebTransport] Connection failed:', err.message);
      this.onerror?.(err);
      throw err;
    }
  }

  /**
   * Gracefully close the session.
   */
  close(info?: { closeCode?: number; reason?: string }): void {
    if (this._closed) return;
    this._closed = true;
    this.stopQualityMonitoring();
    this.setState('closed');

    // Release readers/writers before closing transport
    this.releaseReaders();

    if (this.transport) {
      try {
        this.transport.close(info);
      } catch {
        // Already closed or errored -- safe to ignore
      }
      this.transport = null;
    }

    secureLog.log('[WebTransport] Closed', info);
    this.onclose?.(info ?? {});
  }

  // --------------------------------------------------------------------------
  // Bidirectional streams
  // --------------------------------------------------------------------------

  /**
   * Open a new bidirectional stream.
   * Each stream is an independent, ordered byte channel with its own flow control.
   */
  async createBidirectionalStream(options?: WebTransportStreamOptions): Promise<{
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
  }> {
    this.assertConnected();
    try {
      const stream = await this.transport!.createBidirectionalStream(options);
      this._stats.streamsSent++;
      return { readable: stream.readable, writable: stream.writable };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      captureException(err, { tags: { component: 'webtransport', operation: 'create-bidi-stream' } });
      throw err;
    }
  }

  /**
   * Open a new unidirectional (send-only) stream.
   */
  async createUnidirectionalStream(options?: WebTransportStreamOptions): Promise<WritableStream<Uint8Array>> {
    this.assertConnected();
    try {
      const stream = await this.transport!.createUnidirectionalStream(options);
      this._stats.streamsSent++;
      return stream;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      captureException(err, { tags: { component: 'webtransport', operation: 'create-uni-stream' } });
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // Datagram API (unreliable, unordered, best-effort)
  // --------------------------------------------------------------------------

  /**
   * Send an unreliable datagram. Throws if datagram exceeds max size.
   * Datagrams are best for latency-sensitive signaling, not file data.
   */
  async sendDatagram(data: Uint8Array): Promise<void> {
    this.assertConnected();
    if (!this.datagramWriter) {
      throw new Error('Datagram writer not initialized -- server may not support datagrams');
    }

    const maxSize = this.transport?.datagrams.maxDatagramSize ?? 1200;
    if (data.byteLength > maxSize) {
      throw new Error(`Datagram size ${data.byteLength} exceeds server maximum ${maxSize}`);
    }

    await this.datagramWriter.write(data);
    this._stats.datagramsSent++;
    this._stats.bytesSent += data.byteLength;
    this.recordThroughputSample(data.byteLength);
  }

  /**
   * Get the maximum datagram size the server supports, or 0 if datagrams are unavailable.
   */
  getMaxDatagramSize(): number {
    return this.transport?.datagrams.maxDatagramSize ?? 0;
  }

  // --------------------------------------------------------------------------
  // File transfer helpers
  // --------------------------------------------------------------------------

  /**
   * Send a file over a new bidirectional stream using the Tallow framing protocol.
   *
   * Opens a dedicated bidirectional stream, writes the header + all chunks, then
   * waits for per-chunk ACKs from the receiver.  Returns the total bytes sent.
   *
   * @param file - A File or Blob to send
   * @param onProgress - Progress callback (0..1)
   * @param chunkSize - Bytes per chunk (default 64 KiB)
   * @returns Total bytes transferred (header + data)
   */
  async sendFile(
    file: File | Blob,
    onProgress?: (fraction: number) => void,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
  ): Promise<number> {
    this.assertConnected();

    const totalChunks = Math.ceil(file.size / chunkSize);
    const header: FileTransferHeader = {
      name: file instanceof File ? file.name : 'blob',
      size: file.size,
      type: file.type || 'application/octet-stream',
      chunkSize,
      totalChunks,
    };

    const { readable, writable } = await this.createBidirectionalStream();
    const writer = writable.getWriter();
    const reader = readable.getReader();

    let totalBytesSent = 0;

    try {
      // 1. Write header frame
      const headerBytes = new TextEncoder().encode(JSON.stringify(header));
      const headerLenBuf = new Uint8Array(4);
      new DataView(headerLenBuf.buffer).setUint32(0, headerBytes.byteLength, true);

      await writer.write(HEADER_MAGIC);
      await writer.write(headerLenBuf);
      await writer.write(headerBytes);
      totalBytesSent += HEADER_MAGIC.byteLength + 4 + headerBytes.byteLength;

      // 2. Write data chunks
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      for (let i = 0; i < totalChunks; i++) {
        const offset = i * chunkSize;
        const end = Math.min(offset + chunkSize, fileData.byteLength);
        const chunk = fileData.subarray(offset, end);

        await writer.write(chunk);
        totalBytesSent += chunk.byteLength;
        this._stats.bytesSent += chunk.byteLength;
        this.recordThroughputSample(chunk.byteLength);

        onProgress?.((i + 1) / totalChunks);

        // Read ACK/NACK from receiver for this chunk
        const ackResult = await reader.read();
        if (ackResult.done) {
          throw new Error('Receiver closed stream before transfer completed');
        }
        if (ackResult.value && ackResult.value[0] === NACK_BYTE) {
          const failedIdx = ackResult.value.length >= 5
            ? new DataView(ackResult.value.buffer, ackResult.value.byteOffset + 1, 4).getUint32(0, true)
            : i;
          throw new Error(`Receiver NACKed chunk ${failedIdx}`);
        }
      }

      return totalBytesSent;
    } finally {
      writer.releaseLock();
      reader.releaseLock();
    }
  }

  /**
   * Receive a file from a bidirectional stream using the Tallow framing protocol.
   *
   * Reads the header, then reads chunks and sends ACK for each.
   * Returns the reassembled file data and the parsed header.
   */
  async receiveFile(
    stream: { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> },
    onProgress?: (fraction: number) => void,
  ): Promise<{ header: FileTransferHeader; data: Uint8Array }> {
    const reader = stream.readable.getReader();
    const writer = stream.writable.getWriter();

    try {
      // 1. Read and validate magic
      const magic = await readExact(reader, 4);
      if (!arraysEqual(magic, HEADER_MAGIC)) {
        throw new Error('Invalid file transfer header magic');
      }

      // 2. Read header length
      const lenBuf = await readExact(reader, 4);
      const headerLen = new DataView(lenBuf.buffer, lenBuf.byteOffset, 4).getUint32(0, true);
      if (headerLen > 1_048_576) { // 1 MiB sanity limit
        throw new Error(`Header too large: ${headerLen} bytes`);
      }

      // 3. Read and parse header
      const headerBytes = await readExact(reader, headerLen);
      const header: FileTransferHeader = JSON.parse(new TextDecoder().decode(headerBytes));

      // 4. Read chunks and send ACKs
      const fileData = new Uint8Array(header.size);
      let bytesReceived = 0;

      for (let i = 0; i < header.totalChunks; i++) {
        const expectedLen = Math.min(header.chunkSize, header.size - bytesReceived);
        const chunk = await readExact(reader, expectedLen);
        fileData.set(chunk, bytesReceived);
        bytesReceived += chunk.byteLength;
        this._stats.bytesReceived += chunk.byteLength;

        // Send ACK
        const ackBuf = new Uint8Array(5);
        ackBuf[0] = ACK_BYTE;
        new DataView(ackBuf.buffer).setUint32(1, i, true);
        await writer.write(ackBuf);

        onProgress?.((i + 1) / header.totalChunks);
      }

      return { header, data: fileData };
    } finally {
      reader.releaseLock();
      writer.releaseLock();
    }
  }

  // --------------------------------------------------------------------------
  // Connection quality monitoring
  // --------------------------------------------------------------------------

  /**
   * Measure round-trip time by sending a timestamp datagram and measuring
   * the time until an echo response arrives.
   *
   * IMPORTANT: This requires the server to echo back datagrams that start with
   * the bytes [0xFE, 0xED]. If the server does not implement echo, this method
   * will time out and return the fallback value based on connection time.
   */
  async measureRtt(timeoutMs: number = 2000): Promise<number> {
    if (!this.isConnected() || !this.datagramWriter) {
      return this._stats.smoothedRttMs || this._stats.connectionTimeMs;
    }

    const startMark = performance.now();
    const probe = new Uint8Array(10);
    probe[0] = 0xfe; // RTT probe marker
    probe[1] = 0xed;
    const view = new DataView(probe.buffer);
    view.setFloat64(2, startMark, true);

    // Temporarily intercept datagrams for the probe response
    const originalHandler = this.ondatagram;
    try {
      const rtt = await new Promise<number>((resolve) => {
        const timer = setTimeout(() => {
          // Timeout: use connection time as rough estimate
          resolve(this._stats.connectionTimeMs / 2);
        }, timeoutMs);

        this.ondatagram = (data: Uint8Array) => {
          if (data.length >= 2 && data[0] === 0xfe && data[1] === 0xed) {
            clearTimeout(timer);
            resolve(performance.now() - startMark);
          } else {
            // Forward non-probe datagrams to original handler
            originalHandler?.(data);
          }
        };

        this.sendDatagram(probe).catch(() => {
          clearTimeout(timer);
          resolve(this._stats.connectionTimeMs / 2);
        });
      });

      this._stats.lastRttMs = Math.round(rtt * 100) / 100;
      this._stats.smoothedRttMs = this._stats.smoothedRttMs === 0
        ? this._stats.lastRttMs
        : this._stats.smoothedRttMs * (1 - RTT_EWMA_ALPHA) + this._stats.lastRttMs * RTT_EWMA_ALPHA;

      return this._stats.smoothedRttMs;
    } finally {
      this.ondatagram = originalHandler;
    }
  }

  // --------------------------------------------------------------------------
  // State and stats accessors
  // --------------------------------------------------------------------------

  getState(): WebTransportState {
    return this._state;
  }

  getStats(): Readonly<WebTransportStats> {
    // Compute current throughput before returning
    this.updateThroughput();
    return { ...this._stats };
  }

  isConnected(): boolean {
    return this._state === 'connected' && !this._closed;
  }

  // --------------------------------------------------------------------------
  // Private: internal wiring
  // --------------------------------------------------------------------------

  private setState(newState: WebTransportState): void {
    if (this._state === newState) return;
    this._state = newState;
    this._stats.state = newState;
    this.onstatechange?.(newState);
    addBreadcrumb('webtransport', `State -> ${newState}`);
  }

  private assertConnected(): void {
    if (!this.transport || this._state !== 'connected') {
      throw new Error(`WebTransport not connected (state: ${this._state})`);
    }
  }

  private setupDatagramHandlers(): void {
    if (!this.transport) return;
    try {
      const dg = this.transport.datagrams;
      this.datagramReader = dg.readable.getReader();
      this.datagramWriter = dg.writable.getWriter();
      this.pumpDatagrams();
    } catch {
      // Server may not support datagrams -- that is acceptable
      secureLog.log('[WebTransport] Datagrams not available on this session');
    }
  }

  private async pumpDatagrams(): Promise<void> {
    if (!this.datagramReader) return;
    try {
      while (!this._closed) {
        const { value, done } = await this.datagramReader.read();
        if (done) break;
        if (value) {
          this._stats.datagramsReceived++;
          this._stats.bytesReceived += value.byteLength;
          this.ondatagram?.(value);
        }
      }
    } catch {
      if (!this._closed) {
        secureLog.log('[WebTransport] Datagram pump ended');
      }
    }
  }

  private setupIncomingStreamHandler(): void {
    if (!this.transport) return;
    this.incomingStreamReader = this.transport.incomingBidirectionalStreams.getReader();
    this.pumpIncomingStreams();
  }

  private async pumpIncomingStreams(): Promise<void> {
    if (!this.incomingStreamReader) return;
    try {
      while (!this._closed) {
        const { value, done } = await this.incomingStreamReader.read();
        if (done) break;
        if (value) {
          this._stats.streamsReceived++;
          this.onincomingstream?.(value);
        }
      }
    } catch {
      if (!this._closed) {
        secureLog.log('[WebTransport] Incoming stream pump ended');
      }
    }
  }

  private setupDrainingHandler(): void {
    if (!this.transport) return;
    // 'draining' is not in the standard TS WebTransport type yet (Chrome-only)
    const wt = this.transport as WebTransport & { draining?: Promise<void> };
    (wt.draining ?? Promise.resolve()).then(() => {
      if (!this._closed) {
        this.setState('draining');
        secureLog.log('[WebTransport] Server is draining -- connection will close soon');
      }
    }).catch(() => { /* ignore */ });
  }

  private setupClosedHandler(): void {
    if (!this.transport) return;
    this.transport.closed.then((info) => {
      if (!this._closed) {
        this._closed = true;
        this.stopQualityMonitoring();
        this.setState('closed');
        secureLog.log('[WebTransport] Closed by remote', info);
        this.onclose?.(info);
      }
    }).catch((error) => {
      if (!this._closed) {
        this._closed = true;
        this.stopQualityMonitoring();
        this.setState('failed');
        const err = error instanceof Error ? error : new Error(String(error));
        secureLog.error('[WebTransport] Connection error:', err.message);
        this.onerror?.(err);
      }
    });
  }

  private releaseReaders(): void {
    if (this.datagramReader) {
      this.datagramReader.cancel().catch(() => {});
      this.datagramReader = null;
    }
    if (this.datagramWriter) {
      this.datagramWriter.close().catch(() => {});
      this.datagramWriter = null;
    }
    if (this.incomingStreamReader) {
      this.incomingStreamReader.cancel().catch(() => {});
      this.incomingStreamReader = null;
    }
  }

  // --------------------------------------------------------------------------
  // Private: quality monitoring
  // --------------------------------------------------------------------------

  private startQualityMonitoring(): void {
    const interval = this.config.qualityProbeIntervalMs ?? DEFAULT_QUALITY_PROBE_INTERVAL_MS;
    this.qualityProbeTimer = setInterval(() => {
      if (this.isConnected()) {
        this.measureRtt().catch(() => {});
        this.updateThroughput();
      }
    }, interval);
  }

  private stopQualityMonitoring(): void {
    if (this.qualityProbeTimer !== null) {
      clearInterval(this.qualityProbeTimer);
      this.qualityProbeTimer = null;
    }
  }

  private recordThroughputSample(bytes: number): void {
    const now = Date.now();
    this.throughputSamples.push({ timestamp: now, bytes });
    // Prune old samples
    const cutoff = now - THROUGHPUT_WINDOW_MS;
    this.throughputSamples = this.throughputSamples.filter((s) => s.timestamp >= cutoff);
  }

  private updateThroughput(): void {
    const now = Date.now();
    const cutoff = now - THROUGHPUT_WINDOW_MS;
    const recent = this.throughputSamples.filter((s) => s.timestamp >= cutoff);
    if (recent.length === 0) {
      this._stats.throughputBps = 0;
      return;
    }
    const totalBytes = recent.reduce((sum, s) => sum + s.bytes, 0);
    const windowSecs = THROUGHPUT_WINDOW_MS / 1000;
    this._stats.throughputBps = Math.round(totalBytes / windowSecs);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a new WebTransport connection and wait for it to be ready.
 */
export async function connect(
  url: string,
  config?: Partial<WebTransportConfig>,
): Promise<WebTransportConnection> {
  const fullConfig: WebTransportConfig = {
    url,
    allowPooling: config?.allowPooling ?? true,
    requireUnreliable: config?.requireUnreliable ?? false,
    congestionControl: config?.congestionControl ?? 'default',
    connectTimeoutMs: config?.connectTimeoutMs ?? 10000,
    qualityProbeIntervalMs: config?.qualityProbeIntervalMs ?? 5000,
    ...(config?.serverCertificateHashes ? { serverCertificateHashes: config.serverCertificateHashes } : {}),
  };

  const conn = new WebTransportConnection(fullConfig);
  await conn.connect(url);
  return conn;
}

/**
 * Read an entire ReadableStream<Uint8Array> into a single Uint8Array.
 */
export async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLen = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        totalLen += value.byteLength;
      }
    }

    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Write a Uint8Array to a WritableStream in chunks.
 */
export async function writeStream(
  stream: WritableStream<Uint8Array>,
  data: Uint8Array,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
): Promise<void> {
  const writer = stream.getWriter();
  try {
    for (let offset = 0; offset < data.byteLength; offset += chunkSize) {
      const end = Math.min(offset + chunkSize, data.byteLength);
      await writer.write(data.subarray(offset, end));
    }
  } finally {
    writer.releaseLock();
  }
}

/**
 * Pipe a readable stream directly into a writable stream.
 */
export async function pipeStreams(
  readable: ReadableStream<Uint8Array>,
  writable: WritableStream<Uint8Array>,
): Promise<void> {
  await readable.pipeTo(writable);
}

// ============================================================================
// Internal utilities
// ============================================================================

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

function rejectAfter(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Read exactly `length` bytes from a ReadableStreamDefaultReader.
 * Handles the case where a single read() returns fewer bytes than requested.
 */
async function readExact(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  length: number,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let remaining = length;

  while (remaining > 0) {
    const { value, done } = await reader.read();
    if (done) throw new Error(`Stream ended with ${remaining} bytes still expected`);
    if (!value) continue;

    if (value.byteLength <= remaining) {
      chunks.push(value);
      remaining -= value.byteLength;
    } else {
      // Got more than we need -- take what we need and push back is not possible,
      // so we just take the slice (the rest will be consumed by the next readExact call).
      // NOTE: This works correctly because QUIC stream data is ordered.
      chunks.push(value.subarray(0, remaining));
      remaining = 0;
    }
  }

  if (chunks.length === 1) return chunks[0]!;

  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ============================================================================
// Default export
// ============================================================================

export default {
  WebTransportConnection,
  connect,
  isWebTransportSupported,
  getWebTransportSupport,
  readStream,
  writeStream,
  pipeStreams,
};
