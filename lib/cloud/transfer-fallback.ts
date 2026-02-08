'use client';

/**
 * Transfer Fallback Orchestrator
 *
 * Manages the multi-tier transfer strategy for file delivery:
 *
 *   Tier 1: Direct P2P (WebRTC data channel)
 *     - Fastest, zero server involvement
 *     - Works when NATs are permissive or both peers on same LAN
 *
 *   Tier 2: TURN relay (WebRTC via relay server)
 *     - Moderate latency, still real-time streaming
 *     - Works behind symmetric NATs and restrictive firewalls
 *
 *   Tier 3: R2 cloud transfer (Cloudflare R2 object storage)
 *     - Last resort, store-and-forward model
 *     - Sender encrypts + uploads, receiver downloads + decrypts
 *     - Highest latency but most reliable (works through any network)
 *     - Files auto-expire after 24 hours and are deleted after download
 *
 * All tiers maintain E2E encryption. The server or relay never sees plaintext.
 *
 * SECURITY IMPACT: 8 | PRIVACY IMPACT: 9
 * PRIORITY: CRITICAL
 */

import secureLog from '../utils/secure-logger';
import { getR2Client, isR2Available, type R2UploadProgress } from './cloudflare-r2';

// ============================================================================
// Type Definitions
// ============================================================================

export type TransferTier = 'direct_p2p' | 'turn_relay' | 'r2_cloud';

export type TransferPhase =
  | 'idle'
  | 'attempting_p2p'
  | 'attempting_turn'
  | 'encrypting'
  | 'uploading'
  | 'sharing_link'
  | 'downloading'
  | 'decrypting'
  | 'cleaning_up'
  | 'complete'
  | 'failed';

export interface TransferFallbackConfig {
  /** Timeout for direct P2P attempt in ms (default: 15000) */
  p2pTimeout?: number;
  /** Timeout for TURN relay attempt in ms (default: 10000) */
  turnTimeout?: number;
  /** Maximum file size for R2 fallback in bytes (default: 5GB) */
  maxR2FileSize?: number;
  /** Whether to enable R2 cloud fallback (default: true if configured) */
  enableR2Fallback?: boolean;
  /** Key prefix for R2 uploads (default: 'transfers/') */
  r2KeyPrefix?: string;
  /** Auto-delete from R2 after download (default: true) */
  autoCleanup?: boolean;
}

export interface TransferProgress {
  /** Current transfer tier */
  tier: TransferTier;
  /** Current phase */
  phase: TransferPhase;
  /** Bytes transferred */
  bytesTransferred: number;
  /** Total bytes */
  totalBytes: number;
  /** Transfer percentage (0-100) */
  percentage: number;
  /** Transfer speed in bytes/second */
  speed: number;
  /** Estimated time remaining in seconds */
  eta: number;
  /** Human-readable status message */
  message: string;
}

export interface TransferResult {
  /** Whether the transfer succeeded */
  success: boolean;
  /** Which tier delivered the file */
  tier: TransferTier;
  /** Total transfer time in ms */
  duration: number;
  /** Total bytes transferred */
  bytesTransferred: number;
  /** Error message if failed */
  error?: string;
  /** R2 object key (if R2 tier used) */
  r2Key?: string;
  /** Presigned download URL (if R2 tier used, for receiver) */
  downloadUrl?: string;
}

export interface R2TransferInfo {
  /** R2 object key */
  key: string;
  /** Presigned download URL */
  downloadUrl: string;
  /** URL expiry timestamp */
  expiresAt: number;
  /** File size in bytes */
  size: number;
  /** Encryption metadata needed for decryption */
  encryptionMetadata: Record<string, string>;
}

export interface EncryptionProvider {
  /** Encrypt data before upload */
  encrypt(data: ArrayBuffer): Promise<{ encrypted: ArrayBuffer; metadata: Record<string, string> }>;
  /** Decrypt data after download */
  decrypt(data: ArrayBuffer, metadata: Record<string, string>): Promise<ArrayBuffer>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<TransferFallbackConfig> = {
  p2pTimeout: 15000,
  turnTimeout: 10000,
  maxR2FileSize: 5 * 1024 * 1024 * 1024, // 5 GB
  enableR2Fallback: true,
  r2KeyPrefix: 'transfers/',
  autoCleanup: true,
};

// ============================================================================
// Transfer Fallback Orchestrator
// ============================================================================

export class TransferFallback {
  private config: Required<TransferFallbackConfig>;
  private currentPhase: TransferPhase = 'idle';
  private progressCallbacks: Array<(progress: TransferProgress) => void> = [];
  private aborted = false;
  private speedTracker = new SpeedTracker();

  constructor(config?: TransferFallbackConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    secureLog.log('[TransferFallback] Initialized', {
      p2pTimeout: `${this.config.p2pTimeout}ms`,
      turnTimeout: `${this.config.turnTimeout}ms`,
      r2Enabled: this.config.enableR2Fallback,
      r2Available: isR2Available(),
    });
  }

  // ==========================================================================
  // Sender-side Operations
  // ==========================================================================

  /**
   * Attempt to send a file using the tiered fallback strategy
   *
   * @param data - Raw file data (will be encrypted before R2 upload)
   * @param peerId - Target peer identifier
   * @param encryption - Encryption provider for E2E encryption
   * @param p2pSend - Callback to attempt direct P2P send
   * @param turnSend - Callback to attempt TURN relay send
   * @returns Transfer result indicating which tier succeeded
   */
  async sendFile(
    data: ArrayBuffer,
    peerId: string,
    encryption: EncryptionProvider,
    p2pSend: (data: ArrayBuffer) => Promise<boolean>,
    turnSend: (data: ArrayBuffer) => Promise<boolean>
  ): Promise<TransferResult> {
    const startTime = Date.now();
    this.aborted = false;

    secureLog.log('[TransferFallback] Starting tiered send', {
      peerId,
      size: data.byteLength,
    });

    // -----------------------------------------------------------------------
    // Tier 1: Direct P2P
    // -----------------------------------------------------------------------
    try {
      this.setPhase('attempting_p2p');
      this.emitProgress('direct_p2p', 0, data.byteLength, 'Attempting direct P2P transfer...');

      const p2pSuccess = await this.withTimeout(
        p2pSend(data),
        this.config.p2pTimeout,
        'P2P transfer timeout'
      );

      if (p2pSuccess && !this.aborted) {
        this.setPhase('complete');
        this.emitProgress('direct_p2p', data.byteLength, data.byteLength, 'Transfer complete via P2P');

        secureLog.log('[TransferFallback] P2P transfer succeeded');
        return {
          success: true,
          tier: 'direct_p2p',
          duration: Date.now() - startTime,
          bytesTransferred: data.byteLength,
        };
      }
    } catch (error) {
      secureLog.warn('[TransferFallback] P2P attempt failed:', error);
    }

    if (this.aborted) {
      return this.abortedResult(startTime);
    }

    // -----------------------------------------------------------------------
    // Tier 2: TURN Relay
    // -----------------------------------------------------------------------
    try {
      this.setPhase('attempting_turn');
      this.emitProgress('turn_relay', 0, data.byteLength, 'Attempting TURN relay transfer...');

      const turnSuccess = await this.withTimeout(
        turnSend(data),
        this.config.turnTimeout,
        'TURN relay transfer timeout'
      );

      if (turnSuccess && !this.aborted) {
        this.setPhase('complete');
        this.emitProgress('turn_relay', data.byteLength, data.byteLength, 'Transfer complete via TURN relay');

        secureLog.log('[TransferFallback] TURN relay transfer succeeded');
        return {
          success: true,
          tier: 'turn_relay',
          duration: Date.now() - startTime,
          bytesTransferred: data.byteLength,
        };
      }
    } catch (error) {
      secureLog.warn('[TransferFallback] TURN relay attempt failed:', error);
    }

    if (this.aborted) {
      return this.abortedResult(startTime);
    }

    // -----------------------------------------------------------------------
    // Tier 3: R2 Cloud Transfer
    // -----------------------------------------------------------------------
    if (!this.config.enableR2Fallback || !isR2Available()) {
      this.setPhase('failed');
      secureLog.error('[TransferFallback] All transfer methods exhausted, R2 fallback not available');
      return {
        success: false,
        tier: 'r2_cloud',
        duration: Date.now() - startTime,
        bytesTransferred: 0,
        error: 'All transfer methods failed and R2 cloud fallback is not configured',
      };
    }

    if (data.byteLength > this.config.maxR2FileSize) {
      this.setPhase('failed');
      return {
        success: false,
        tier: 'r2_cloud',
        duration: Date.now() - startTime,
        bytesTransferred: 0,
        error: `File too large for R2 fallback: ${data.byteLength} bytes exceeds ${this.config.maxR2FileSize} limit`,
      };
    }

    try {
      return await this.sendViaR2(data, peerId, encryption, startTime);
    } catch (error) {
      this.setPhase('failed');
      const errorMsg = error instanceof Error ? error.message : String(error);
      secureLog.error('[TransferFallback] R2 cloud transfer failed:', error);
      return {
        success: false,
        tier: 'r2_cloud',
        duration: Date.now() - startTime,
        bytesTransferred: 0,
        error: `R2 cloud transfer failed: ${errorMsg}`,
      };
    }
  }

  /**
   * Upload encrypted file to R2 (sender side of Tier 3)
   */
  private async sendViaR2(
    data: ArrayBuffer,
    peerId: string,
    encryption: EncryptionProvider,
    startTime: number
  ): Promise<TransferResult> {
    const r2Client = getR2Client();
    if (!r2Client) {
      throw new Error('R2 client not available');
    }

    // Step 1: Encrypt the file
    this.setPhase('encrypting');
    this.emitProgress('r2_cloud', 0, data.byteLength, 'Encrypting file for cloud transfer...');

    const { encrypted, metadata: encryptionMetadata } = await encryption.encrypt(data);

    if (this.aborted) {
      return this.abortedResult(startTime);
    }

    // Step 2: Upload to R2
    this.setPhase('uploading');
    this.emitProgress('r2_cloud', 0, encrypted.byteLength, 'Uploading encrypted file to cloud...');

    const key = this.generateR2Key(peerId);

    const uploadResult = await r2Client.uploadFile(
      key,
      encrypted,
      {
        ...encryptionMetadata,
        'peer-id': peerId,
        'original-size': data.byteLength.toString(),
      },
      (progress: R2UploadProgress) => {
        this.emitProgress(
          'r2_cloud',
          progress.loaded,
          progress.total,
          `Uploading encrypted file... ${progress.percentage}%`
        );
      }
    );

    if (this.aborted) {
      // Cleanup: delete the uploaded file
      await r2Client.deleteFile(key).catch(() => {});
      return this.abortedResult(startTime);
    }

    // Step 3: Return result with download info for the receiver
    this.setPhase('sharing_link');
    this.emitProgress('r2_cloud', encrypted.byteLength, encrypted.byteLength, 'File uploaded, sharing download link...');

    secureLog.log('[TransferFallback] R2 upload complete, sharing with receiver', {
      key,
      size: encrypted.byteLength,
    });

    return {
      success: true,
      tier: 'r2_cloud',
      duration: Date.now() - startTime,
      bytesTransferred: encrypted.byteLength,
      r2Key: key,
      downloadUrl: uploadResult.downloadUrl,
    };
  }

  // ==========================================================================
  // Receiver-side Operations
  // ==========================================================================

  /**
   * Download and decrypt a file from R2 (receiver side of Tier 3)
   *
   * Called by the receiver after getting the R2TransferInfo from the sender
   * via the signaling channel.
   *
   * @param transferInfo - R2 transfer info from sender
   * @param encryption - Encryption provider for decryption
   * @returns Decrypted file data
   */
  async receiveFromR2(
    transferInfo: R2TransferInfo,
    encryption: EncryptionProvider
  ): Promise<ArrayBuffer> {
    const r2Client = getR2Client();
    if (!r2Client) {
      throw new Error('R2 client not available');
    }

    this.aborted = false;

    secureLog.log('[TransferFallback] Receiving file from R2', {
      key: transferInfo.key,
      size: transferInfo.size,
    });

    // Step 1: Download encrypted file from R2
    this.setPhase('downloading');
    this.emitProgress('r2_cloud', 0, transferInfo.size, 'Downloading encrypted file from cloud...');

    const encryptedBlob = await r2Client.downloadFile(transferInfo.key);
    const encryptedData = await encryptedBlob.arrayBuffer();

    if (this.aborted) {
      throw new Error('Transfer aborted by user');
    }

    this.emitProgress('r2_cloud', encryptedData.byteLength, transferInfo.size, 'Download complete, decrypting...');

    // Step 2: Decrypt the file
    this.setPhase('decrypting');
    const decryptedData = await encryption.decrypt(encryptedData, transferInfo.encryptionMetadata);

    if (this.aborted) {
      throw new Error('Transfer aborted by user');
    }

    // Step 3: Cleanup -- delete from R2 after successful download
    if (this.config.autoCleanup) {
      this.setPhase('cleaning_up');
      this.emitProgress('r2_cloud', decryptedData.byteLength, decryptedData.byteLength, 'Cleaning up cloud storage...');

      try {
        await r2Client.deleteFile(transferInfo.key);
        secureLog.log('[TransferFallback] R2 cleanup successful', { key: transferInfo.key });
      } catch (cleanupError) {
        // Non-fatal: file will auto-expire after 24 hours
        secureLog.warn('[TransferFallback] R2 cleanup failed (file will auto-expire):', cleanupError);
      }
    }

    this.setPhase('complete');
    this.emitProgress('r2_cloud', decryptedData.byteLength, decryptedData.byteLength, 'Transfer complete');

    secureLog.log('[TransferFallback] R2 receive complete', {
      key: transferInfo.key,
      encryptedSize: encryptedData.byteLength,
      decryptedSize: decryptedData.byteLength,
    });

    return decryptedData;
  }

  // ==========================================================================
  // Progress Tracking
  // ==========================================================================

  /**
   * Register a progress callback
   */
  onProgress(callback: (progress: TransferProgress) => void): () => void {
    this.progressCallbacks.push(callback);
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Get the current transfer phase
   */
  getCurrentPhase(): TransferPhase {
    return this.currentPhase;
  }

  /**
   * Abort the current transfer
   */
  abort(): void {
    this.aborted = true;
    secureLog.log('[TransferFallback] Transfer abort requested');
  }

  /**
   * Check if the transfer has been aborted
   */
  isAborted(): boolean {
    return this.aborted;
  }

  // ==========================================================================
  // Availability Checks
  // ==========================================================================

  /**
   * Get available transfer tiers
   */
  getAvailableTiers(): TransferTier[] {
    const tiers: TransferTier[] = ['direct_p2p', 'turn_relay'];

    if (this.config.enableR2Fallback && isR2Available()) {
      tiers.push('r2_cloud');
    }

    return tiers;
  }

  /**
   * Check if R2 cloud fallback is available
   */
  isR2FallbackAvailable(): boolean {
    return this.config.enableR2Fallback && isR2Available();
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Set the current phase and log it
   */
  private setPhase(phase: TransferPhase): void {
    this.currentPhase = phase;
    secureLog.log('[TransferFallback] Phase:', phase);
  }

  /**
   * Emit progress to all registered callbacks
   */
  private emitProgress(
    tier: TransferTier,
    bytesTransferred: number,
    totalBytes: number,
    message: string
  ): void {
    this.speedTracker.update(bytesTransferred);

    const progress: TransferProgress = {
      tier,
      phase: this.currentPhase,
      bytesTransferred,
      totalBytes,
      percentage: totalBytes > 0 ? Math.round((bytesTransferred / totalBytes) * 100) : 0,
      speed: this.speedTracker.getSpeed(),
      eta: this.speedTracker.getETA(totalBytes - bytesTransferred),
      message,
    };

    for (const callback of this.progressCallbacks) {
      try {
        callback(progress);
      } catch (error) {
        secureLog.error('[TransferFallback] Progress callback error:', error);
      }
    }
  }

  /**
   * Generate a unique R2 key for a transfer
   */
  private generateR2Key(peerId: string): string {
    const timestamp = Date.now();
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const random = Array.from(bytes).map(b => b.toString(36)).join('').substring(0, 8);
    // Sanitize peerId to be URL-safe
    const safePeerId = peerId.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 32);
    return `${this.config.r2KeyPrefix}${safePeerId}/${timestamp}-${random}`;
  }

  /**
   * Wrap a promise with a timeout
   */
  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);

      promise
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Generate an aborted transfer result
   */
  private abortedResult(startTime: number): TransferResult {
    this.setPhase('failed');
    return {
      success: false,
      tier: 'direct_p2p',
      duration: Date.now() - startTime,
      bytesTransferred: 0,
      error: 'Transfer aborted by user',
    };
  }
}

// ============================================================================
// Speed Tracker Utility
// ============================================================================

/**
 * Tracks transfer speed using a sliding window of samples
 */
class SpeedTracker {
  private samples: Array<{ bytes: number; timestamp: number }> = [];
  private windowSize = 5000; // 5 second sliding window

  /**
   * Record a new data point
   */
  update(totalBytes: number): void {
    const now = Date.now();
    this.samples.push({ bytes: totalBytes, timestamp: now });

    // Remove old samples outside the window
    const cutoff = now - this.windowSize;
    this.samples = this.samples.filter(s => s.timestamp >= cutoff);
  }

  /**
   * Get current speed in bytes/second
   */
  getSpeed(): number {
    if (this.samples.length < 2) {
      return 0;
    }

    const oldest = this.samples[0]!;
    const newest = this.samples[this.samples.length - 1]!;
    const timeDiff = (newest.timestamp - oldest.timestamp) / 1000; // seconds
    const bytesDiff = newest.bytes - oldest.bytes;

    if (timeDiff <= 0) {
      return 0;
    }

    return Math.max(0, bytesDiff / timeDiff);
  }

  /**
   * Get estimated time remaining in seconds
   */
  getETA(remainingBytes: number): number {
    const speed = this.getSpeed();
    if (speed <= 0 || remainingBytes <= 0) {
      return 0;
    }
    return remainingBytes / speed;
  }
}

// ============================================================================
// Singleton & Factory
// ============================================================================

let fallbackInstance: TransferFallback | null = null;

/**
 * Get or create the transfer fallback singleton
 */
export function getTransferFallback(config?: TransferFallbackConfig): TransferFallback {
  if (!fallbackInstance) {
    fallbackInstance = new TransferFallback(config);
  }
  return fallbackInstance;
}

/**
 * Create a new transfer fallback instance (non-singleton, for isolated transfers)
 */
export function createTransferFallback(config?: TransferFallbackConfig): TransferFallback {
  return new TransferFallback(config);
}

export default TransferFallback;
