/**
 * Metrics Module
 *
 * Central module for application metrics with helper functions
 * for common operations. This provides a clean API for recording
 * metrics throughout the application.
 *
 * Usage:
 * ```typescript
 * import { recordTransfer, recordConnection, recordError } from '@/lib/metrics';
 *
 * // Record a successful transfer
 * recordTransfer(1024000, 5.2, 'success', 'p2p', 'image/png');
 *
 * // Record a connection
 * recordConnection('webrtc', true, 'local');
 *
 * // Record an error
 * recordError('crypto', 'Key generation failed');
 * ```
 */

import { getRegistry, Counter, Gauge, Histogram, Summary } from './prometheus';

/**
 * Get pre-configured metric instances
 */
export function getMetrics() {
  const registry = getRegistry();

  return {
    // Transfer metrics
    transfersTotal: registry.get('transfers_total') as Counter,
    transferBytesTotal: registry.get('transfer_bytes_total') as Counter,
    transferDuration: registry.get('transfer_duration') as Histogram,
    fileSize: registry.get('file_size') as Histogram,

    // Connection metrics
    activeConnections: registry.get('active_connections') as Gauge,
    peerConnections: registry.get('peer_connections') as Counter,
    webrtcConnections: registry.get('webrtc_connections') as Counter,
    webrtcConnectionTime: registry.get('webrtc_connection_time') as Histogram,

    // Encryption metrics
    encryptionOperations: registry.get('encryption_operations') as Counter,
    encryptionDuration: registry.get('encryption_duration') as Histogram,

    // Discovery metrics
    discoveryDevices: registry.get('discovery_devices') as Gauge,

    // Room metrics
    roomsActive: registry.get('rooms_active') as Gauge,
    roomsTotal: registry.get('rooms_total') as Counter,

    // Error metrics
    errorsTotal: registry.get('errors_total') as Counter,

    // Network metrics
    networkLatency: registry.get('network_latency') as Histogram,

    // Metadata metrics
    metadataStripped: registry.get('metadata_stripped') as Counter,

    // Memory metrics
    memoryUsage: registry.get('memory_usage') as Gauge,
  };
}

/**
 * Record a file transfer
 *
 * @param bytes - Number of bytes transferred
 * @param duration - Transfer duration in seconds
 * @param status - Transfer status: 'success', 'failed', or 'cancelled'
 * @param method - Transfer method: 'p2p' or 'relay'
 * @param fileType - MIME type or file extension (e.g., 'image/png', 'application/pdf')
 */
export function recordTransfer(
  bytes: number,
  duration: number,
  status: 'success' | 'failed' | 'cancelled',
  method: 'p2p' | 'relay' = 'p2p',
  fileType: string = 'unknown'
): void {
  const metrics = getMetrics();

  // Increment transfer counter
  metrics.transfersTotal.inc({ status });

  // Track bytes transferred (only for successful transfers)
  if (status === 'success') {
    metrics.transferBytesTotal.inc({ direction: 'sent' }, bytes);
    metrics.fileSize.observe({ file_type: fileType }, bytes);
  }

  // Record transfer duration
  metrics.transferDuration.observe({ status, method }, duration);
}

/**
 * Record bytes transferred
 *
 * @param bytes - Number of bytes
 * @param direction - Transfer direction: 'sent' or 'received'
 */
export function recordBytes(bytes: number, direction: 'sent' | 'received'): void {
  const metrics = getMetrics();
  metrics.transferBytesTotal.inc({ direction }, bytes);
}

/**
 * Record a peer connection
 *
 * @param type - Connection type: 'webrtc', 'websocket', 'relay', 'local', 'internet', 'friend'
 * @param success - Whether connection was successful
 * @param connectionType - Optional WebRTC connection type: 'host', 'srflx', 'relay', etc.
 */
export function recordConnection(
  type: 'webrtc' | 'websocket' | 'relay' | 'local' | 'internet' | 'friend',
  success: boolean = true,
  connectionType?: string
): void {
  const metrics = getMetrics();

  // Increment peer connection counter
  metrics.peerConnections.inc({ type });

  // Track WebRTC-specific metrics
  if (type === 'webrtc') {
    const status = success ? 'success' : 'failed';
    metrics.webrtcConnections.inc({ status, connection_type: connectionType || 'unknown' });
  }
}

/**
 * Record active connection change
 *
 * @param type - Connection type
 * @param delta - Change in active connections (+1 for new, -1 for closed)
 */
export function updateActiveConnections(
  type: 'webrtc' | 'websocket' | 'relay' | 'local' | 'internet',
  delta: number
): void {
  const metrics = getMetrics();

  if (delta > 0) {
    metrics.activeConnections.inc({ type }, delta);
  } else if (delta < 0) {
    metrics.activeConnections.dec({ type }, Math.abs(delta));
  }
}

/**
 * Record WebRTC connection establishment time
 *
 * @param duration - Time in seconds to establish connection
 * @param connectionType - Type of connection: 'host', 'srflx', 'relay', etc.
 */
export function recordWebRTCConnectionTime(
  duration: number,
  connectionType: string = 'unknown'
): void {
  const metrics = getMetrics();
  metrics.webrtcConnectionTime.observe({ connection_type: connectionType }, duration);
}

/**
 * Record a cryptographic operation
 *
 * @param algorithm - Algorithm used: 'ml-kem', 'chacha20', 'aes-gcm', 'ed25519', etc.
 * @param operation - Operation type: 'encrypt', 'decrypt', 'sign', 'verify', 'keygen'
 * @param duration - Operation duration in seconds
 */
export function recordEncryption(
  algorithm: string,
  operation: 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'keygen',
  duration?: number
): void {
  const metrics = getMetrics();

  // Increment operation counter
  metrics.encryptionOperations.inc({ algorithm, operation });

  // Record duration if provided
  if (duration !== undefined) {
    metrics.encryptionDuration.observe({ algorithm, operation }, duration);
  }
}

/**
 * Record discovered devices
 *
 * @param count - Number of devices currently discovered
 */
export function recordDiscoveredDevices(count: number): void {
  const metrics = getMetrics();
  metrics.discoveryDevices.set(count);
}

/**
 * Record active rooms
 *
 * @param count - Number of currently active rooms
 */
export function recordActiveRooms(count: number): void {
  const metrics = getMetrics();
  metrics.roomsActive.set(count);
}

/**
 * Record room creation
 *
 * @param status - Room status: 'created', 'joined', 'expired', 'closed'
 */
export function recordRoom(status: 'created' | 'joined' | 'expired' | 'closed'): void {
  const metrics = getMetrics();
  metrics.roomsTotal.inc({ status });
}

/**
 * Record an error
 *
 * @param type - Error type: 'crypto', 'network', 'transfer', 'validation', 'auth', 'storage'
 * @param severity - Error severity: 'low', 'medium', 'high', 'critical'
 */
export function recordError(
  type: 'crypto' | 'network' | 'transfer' | 'validation' | 'auth' | 'storage' | 'unknown',
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): void {
  const metrics = getMetrics();
  metrics.errorsTotal.inc({ type, severity });
}

/**
 * Record network latency
 *
 * @param latency - Round-trip time in seconds
 * @param peerType - Type of peer: 'local', 'internet', 'relay'
 */
export function recordNetworkLatency(
  latency: number,
  peerType: 'local' | 'internet' | 'relay' = 'internet'
): void {
  const metrics = getMetrics();
  metrics.networkLatency.observe({ peer_type: peerType }, latency);
}

/**
 * Record metadata stripping operation
 *
 * @param fileType - File type that had metadata stripped
 */
export function recordMetadataStripping(fileType: string): void {
  const metrics = getMetrics();
  metrics.metadataStripped.inc({ file_type: fileType });
}

/**
 * Record memory usage
 *
 * @param bytes - Memory usage in bytes
 * @param type - Memory type: 'heap', 'external', 'rss'
 */
export function recordMemoryUsage(
  bytes: number,
  type: 'heap' | 'external' | 'rss' = 'heap'
): void {
  const metrics = getMetrics();
  metrics.memoryUsage.set({ type }, bytes);
}

/**
 * Start a timer for an operation
 * Returns a function to stop the timer and record the duration
 *
 * @param metric - Metric name to record to
 * @returns Stop function that records the elapsed time
 *
 * @example
 * const stopTimer = startTimer('encryption');
 * await performEncryption();
 * const duration = stopTimer();
 * recordEncryption('aes-gcm', 'encrypt', duration);
 */
export function startTimer(_metric?: string): () => number {
  const start = performance.now();

  return (): number => {
    const duration = (performance.now() - start) / 1000; // Convert to seconds
    return duration;
  };
}

/**
 * Convenience helper for timing and recording crypto operations
 *
 * @example
 * await timedEncryption('aes-gcm', 'encrypt', async () => {
 *   return await encrypt(data, key);
 * });
 */
export async function timedEncryption<T>(
  algorithm: string,
  operation: 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'keygen',
  fn: () => Promise<T>
): Promise<T> {
  const stopTimer = startTimer();

  try {
    const result = await fn();
    const duration = stopTimer();
    recordEncryption(algorithm, operation, duration);
    return result;
  } catch (error) {
    const duration = stopTimer();
    recordEncryption(algorithm, operation, duration);
    recordError('crypto', 'high');
    throw error;
  }
}

/**
 * Convenience helper for timing and recording transfers
 *
 * @example
 * await timedTransfer('p2p', async () => {
 *   return await sendFile(file);
 * }, file.size, 'image/png');
 */
export async function timedTransfer<T>(
  method: 'p2p' | 'relay',
  fn: () => Promise<T>,
  bytes: number,
  fileType: string = 'unknown'
): Promise<T> {
  const stopTimer = startTimer();

  try {
    const result = await fn();
    const duration = stopTimer();
    recordTransfer(bytes, duration, 'success', method, fileType);
    return result;
  } catch (error) {
    const duration = stopTimer();
    recordTransfer(bytes, duration, 'failed', method, fileType);
    recordError('transfer', 'high');
    throw error;
  }
}

/**
 * Get current metrics snapshot (for debugging/testing)
 */
export function getMetricsSnapshot(): string {
  const registry = getRegistry();
  return registry.serialize();
}

/**
 * Export all metric types for advanced usage
 */
export { Counter, Gauge, Histogram, Summary, getRegistry } from './prometheus';

/**
 * Export helper for creating custom metrics
 */
export function createCounter(name: string, help: string, labelNames?: string[]): Counter {
  const { Counter } = require('./prometheus');
  return new Counter(name, help, labelNames);
}

export function createGauge(name: string, help: string, labelNames?: string[]): Gauge {
  const { Gauge } = require('./prometheus');
  return new Gauge(name, help, labelNames);
}

export function createHistogram(
  name: string,
  help: string,
  buckets?: number[],
  labelNames?: string[]
): Histogram {
  const { Histogram } = require('./prometheus');
  return new Histogram(name, help, buckets, labelNames);
}

export function createSummary(
  name: string,
  help: string,
  percentiles?: number[],
  labelNames?: string[]
): Summary {
  const { Summary } = require('./prometheus');
  return new Summary(name, help, percentiles, labelNames);
}
