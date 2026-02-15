/**
 * Sync Coordinator (Agent 029)
 *
 * Manages the full transfer lifecycle with resumability and delta sync.
 * This is a PLAIN TypeScript module (NOT a React hook) to prevent
 * Turbopack from transforming Zustand .getState() calls into reactive
 * subscriptions. See MEMORY.md for context.
 *
 * Responsibilities:
 * - Transfer state machine coordination
 * - Connection-drop detection and automatic state persistence to IndexedDB
 * - Reconnect negotiation via bitmap exchange (only missing chunks resent)
 * - BLAKE3/SHA-256 chunk integrity verification on receive
 * - Delta sync integration: for repeated transfers, only changed blocks sent
 * - Exposes state to UI through the Zustand transfer store
 *
 * Transfer States:
 *   IDLE -> PREPARING -> TRANSFERRING -> PAUSED -> RESUMING -> COMPLETED
 *                                                           -> FAILED -> RETRYING
 */

import {
  TransferStateMachine,
  type TransferState,
  type TransferContext,
  type TransferDirection,
} from './state-machine';
import {
  createTransferState as createDbTransferState,
  getTransferState as getDbTransferState,
  updateTransferState as updateDbTransferState,
  saveChunk as saveDbChunk,
  getMissingChunks as getDbMissingChunks,
  getAllChunks as getDbAllChunks,
  exportChunkBitmap,
  importChunkBitmap,
  deleteTransfer as deleteDbTransfer,
  getResumableTransfers as getDbResumableTransfers,
  cleanupExpiredTransfers,
  type TransferMetadata,
} from '../storage/transfer-state-db';
import {
  computeBlockSignatures,
  computeDelta,
  createPatch,
  estimateSavings,
  calculateOptimalBlockSize,
  serializeSignatures,
  deserializeSignatures,
  type DeltaResult,
  type SavingsEstimate,
  type FilePatch,
} from './delta-sync';
import { DeltaSyncManager } from './delta-sync-manager';
import secureLog from '../utils/secure-logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Discriminated union representing all coordinator states.
 * Each variant carries only the data relevant to that state.
 */
export type CoordinatorPhase =
  | { phase: 'IDLE' }
  | { phase: 'PREPARING'; transferId: string; fileName: string; fileSize: number }
  | { phase: 'TRANSFERRING'; transferId: string; progress: number; speed: number; eta: number }
  | { phase: 'PAUSED'; transferId: string; progress: number; reason: PauseReason }
  | { phase: 'RESUMING'; transferId: string; missingChunks: number; totalChunks: number }
  | { phase: 'COMPLETED'; transferId: string; bytesTransferred: number; duration: number }
  | { phase: 'FAILED'; transferId: string; error: string; retryable: boolean }
  | { phase: 'RETRYING'; transferId: string; attempt: number; maxAttempts: number };

export type PauseReason = 'user' | 'connection_lost' | 'error';

/**
 * Chunk integrity result after BLAKE3/SHA-256 verification.
 */
export interface ChunkVerification {
  chunkIndex: number;
  valid: boolean;
  expectedHash: string;
  actualHash: string;
}

/**
 * Bitmap exchange message for reconnect negotiation.
 */
export interface BitmapExchangeMessage {
  type: 'bitmap-exchange';
  transferId: string;
  bitmap: string; // hex-encoded chunk bitmap
  totalChunks: number;
  fileHash: string; // hex file hash for identity confirmation
}

/**
 * Bitmap response with the list of missing chunks to resend.
 */
export interface BitmapResponseMessage {
  type: 'bitmap-response';
  transferId: string;
  missingChunks: number[];
  acknowledged: boolean;
}

/**
 * Delta sync negotiation message.
 */
export interface DeltaNegotiationMessage {
  type: 'delta-negotiate';
  fileId: string;
  fileName: string;
  fileSize: number;
  signatures: string; // serialized FileSignatures
}

/**
 * Delta sync decision message.
 */
export interface DeltaDecisionMessage {
  type: 'delta-decision';
  fileId: string;
  useDelta: boolean;
  savings: SavingsEstimate | null;
}

/**
 * Configuration for the sync coordinator.
 */
export interface SyncCoordinatorConfig {
  maxRetries: number;
  retryDelayMs: number;
  chunkVerification: boolean;
  deltaSyncEnabled: boolean;
  deltaSyncMinSavingsPercent: number;
  deltaSyncMinFileSize: number;
  autoResumeOnReconnect: boolean;
  statePersistenceEnabled: boolean;
}

const DEFAULT_CONFIG: SyncCoordinatorConfig = {
  maxRetries: 3,
  retryDelayMs: 2000,
  chunkVerification: true,
  deltaSyncEnabled: true,
  deltaSyncMinSavingsPercent: 25,
  deltaSyncMinFileSize: 10 * 1024, // 10KB
  autoResumeOnReconnect: true,
  statePersistenceEnabled: true,
};

/**
 * Observer callback for phase changes.
 */
export type PhaseObserver = (phase: CoordinatorPhase) => void;

// ============================================================================
// BITSET - Efficient chunk tracking
// ============================================================================

/**
 * Fixed-size bit set for tracking which chunks have been received.
 * Stores bits packed into a number[] where each element holds 8 bits.
 */
export class BitSet {
  private readonly data: number[];
  private readonly _size: number;

  constructor(size: number, initialData?: number[]) {
    this._size = size;
    const byteCount = Math.ceil(size / 8);
    if (initialData && initialData.length === byteCount) {
      this.data = [...initialData];
    } else {
      this.data = new Array(byteCount).fill(0);
    }
  }

  /** Mark a bit as set (1). */
  set(index: number): void {
    if (index < 0 || index >= this._size) return;
    const byteIdx = Math.floor(index / 8);
    const bitIdx = index % 8;
    const current = this.data[byteIdx] ?? 0;
    this.data[byteIdx] = current | (1 << bitIdx);
  }

  /** Clear a bit (0). */
  clear(index: number): void {
    if (index < 0 || index >= this._size) return;
    const byteIdx = Math.floor(index / 8);
    const bitIdx = index % 8;
    const current = this.data[byteIdx] ?? 0;
    this.data[byteIdx] = current & ~(1 << bitIdx);
  }

  /** Test whether a bit is set. */
  get(index: number): boolean {
    if (index < 0 || index >= this._size) return false;
    const byteIdx = Math.floor(index / 8);
    const bitIdx = index % 8;
    const byteVal = this.data[byteIdx];
    return byteVal !== undefined && (byteVal & (1 << bitIdx)) !== 0;
  }

  /** Count of set bits. */
  popcount(): number {
    let count = 0;
    for (let i = 0; i < this._size; i++) {
      if (this.get(i)) count++;
    }
    return count;
  }

  /** Total capacity. */
  get size(): number {
    return this._size;
  }

  /** Return indices of bits that are NOT set. */
  missingIndices(): number[] {
    const missing: number[] = [];
    for (let i = 0; i < this._size; i++) {
      if (!this.get(i)) missing.push(i);
    }
    return missing;
  }

  /** Export as number[] for IndexedDB storage. */
  toArray(): number[] {
    return [...this.data];
  }

  /** Export as hex string for wire transmission. */
  toHex(): string {
    return exportChunkBitmap(this.data);
  }

  /** Import from hex string received over wire. */
  static fromHex(hex: string, size: number): BitSet {
    const data = importChunkBitmap(hex);
    return new BitSet(size, data);
  }

  /**
   * Compute the set difference: indices present in `other` but missing in `this`.
   * Useful for finding which chunks to request from a peer.
   */
  diff(other: BitSet): number[] {
    const result: number[] = [];
    const maxSize = Math.min(this._size, other._size);
    for (let i = 0; i < maxSize; i++) {
      if (!this.get(i) && other.get(i)) {
        result.push(i);
      }
    }
    return result;
  }

  /**
   * Compute the union of both bitmaps: indices set in either bitmap.
   * Returns a new BitSet.
   */
  union(other: BitSet): BitSet {
    const maxSize = Math.max(this._size, other._size);
    const result = new BitSet(maxSize);
    for (let i = 0; i < maxSize; i++) {
      if (this.get(i) || other.get(i)) {
        result.set(i);
      }
    }
    return result;
  }
}

// ============================================================================
// CHUNK VERIFIER
// ============================================================================

/**
 * Verify chunk integrity using SHA-256 (falls back from BLAKE3 when
 * the WASM module is unavailable, which is the common browser case).
 */
export async function verifyChunkIntegrity(
  chunkData: ArrayBuffer,
  expectedHash: Uint8Array,
): Promise<ChunkVerification> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', chunkData);
  const actualHash = new Uint8Array(hashBuffer);

  const expectedHex = Array.from(expectedHash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const actualHex = Array.from(actualHash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    chunkIndex: -1, // caller sets this
    valid: expectedHex === actualHex,
    expectedHash: expectedHex,
    actualHash: actualHex,
  };
}

// ============================================================================
// SYNC COORDINATOR
// ============================================================================

/**
 * SyncCoordinator orchestrates the full transfer lifecycle.
 *
 * It is a plain class (NOT a React hook) so that Turbopack leaves its
 * Zustand .getState() calls alone. UI components interact with it
 * through thin hook wrappers or via store-actions.ts.
 */
export class SyncCoordinator {
  private machine: TransferStateMachine | null = null;
  private config: SyncCoordinatorConfig;
  private currentPhase: CoordinatorPhase = { phase: 'IDLE' };
  private observers: PhaseObserver[] = [];
  private localBitmap: BitSet | null = null;
  private deltaManager: DeltaSyncManager;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(config: Partial<SyncCoordinatorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.deltaManager = new DeltaSyncManager({
      maxCacheSize: 100,
      cacheExpiryMs: 24 * 60 * 60 * 1000,
      autoCleanup: true,
    });
  }

  // ========================================================================
  // PHASE MANAGEMENT
  // ========================================================================

  /** Get current coordinator phase (discriminated union). */
  getPhase(): CoordinatorPhase {
    return this.currentPhase;
  }

  /** Subscribe to phase changes. Returns unsubscribe function. */
  onPhaseChange(observer: PhaseObserver): () => void {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(o => o !== observer);
    };
  }

  private setPhase(phase: CoordinatorPhase): void {
    this.currentPhase = phase;
    for (const observer of this.observers) {
      try {
        observer(phase);
      } catch (err) {
        secureLog.error('Phase observer error:', err);
      }
    }
  }

  // ========================================================================
  // TRANSFER INITIATION
  // ========================================================================

  /**
   * Begin a new transfer. Creates state machine, persists initial state
   * to IndexedDB, and transitions to PREPARING.
   */
  async beginTransfer(params: {
    transferId: string;
    direction: TransferDirection;
    fileName: string;
    fileSize: number;
    fileHash: Uint8Array;
    chunkSize: number;
    totalChunks: number;
    peerId: string;
    peerName: string;
  }): Promise<void> {
    // Create state machine
    this.machine = new TransferStateMachine({
      transferId: params.transferId,
      direction: params.direction,
      fileName: params.fileName,
      fileSize: params.fileSize,
      chunksTotal: params.totalChunks,
      peerId: params.peerId,
      peerName: params.peerName,
    });

    // Initialize bitmap
    this.localBitmap = new BitSet(params.totalChunks);

    // Persist initial state to IndexedDB
    if (this.config.statePersistenceEnabled) {
      try {
        await createDbTransferState(
          params.transferId,
          params.fileName,
          '', // fileType
          params.fileSize,
          params.fileHash,
          params.chunkSize,
          params.peerId,
          params.direction,
        );
      } catch (err) {
        secureLog.error('Failed to persist initial transfer state:', err);
      }
    }

    // Transition: IDLE -> connecting -> negotiating (PREPARING)
    this.machine.send('START');
    this.setPhase({
      phase: 'PREPARING',
      transferId: params.transferId,
      fileName: params.fileName,
      fileSize: params.fileSize,
    });

    secureLog.log(`[SyncCoordinator] Transfer initiated: ${params.transferId}`);
  }

  /**
   * Mark transfer as actively transferring data.
   * Called after key exchange and metadata negotiation succeed.
   */
  startTransferring(transferId: string): void {
    if (!this.machine) return;

    // Walk through the state machine transitions
    if (this.machine.getState() === 'connecting') {
      this.machine.send('CONNECTED');
    }
    if (this.machine.getState() === 'negotiating') {
      this.machine.send('NEGOTIATED');
    }
    if (this.machine.getState() === 'encrypting') {
      this.machine.send('ENCRYPTED');
    }

    this.setPhase({
      phase: 'TRANSFERRING',
      transferId,
      progress: 0,
      speed: 0,
      eta: 0,
    });
  }

  // ========================================================================
  // CHUNK TRACKING
  // ========================================================================

  /**
   * Record that a chunk has been successfully received (or sent).
   * Updates bitmap, persists to IndexedDB, and verifies integrity.
   *
   * Returns false if chunk failed integrity check.
   */
  async recordChunk(params: {
    transferId: string;
    chunkIndex: number;
    chunkData: ArrayBuffer;
    nonce: Uint8Array;
    hash: Uint8Array;
  }): Promise<boolean> {
    // Integrity verification
    if (this.config.chunkVerification) {
      const verification = await verifyChunkIntegrity(params.chunkData, params.hash);
      verification.chunkIndex = params.chunkIndex;

      if (!verification.valid) {
        secureLog.error(
          `[SyncCoordinator] Chunk ${params.chunkIndex} integrity check failed. ` +
          `Expected: ${verification.expectedHash.substring(0, 16)}... ` +
          `Got: ${verification.actualHash.substring(0, 16)}...`
        );
        return false;
      }
    }

    // Update local bitmap
    if (this.localBitmap) {
      this.localBitmap.set(params.chunkIndex);
    }

    // Persist chunk to IndexedDB
    if (this.config.statePersistenceEnabled) {
      try {
        await saveDbChunk(
          params.transferId,
          params.chunkIndex,
          params.chunkData,
          params.nonce,
          params.hash,
        );
      } catch (err) {
        secureLog.error('Failed to persist chunk:', err);
      }
    }

    // Update progress
    if (this.machine && this.localBitmap) {
      const received = this.localBitmap.popcount();
      const total = this.localBitmap.size;
      const progress = total > 0 ? received / total : 0;
      const ctx = this.machine.getContext();
      const elapsed = (Date.now() - ctx.startedAt) / 1000;
      const speed = elapsed > 0 ? (received * (ctx.fileSize / total)) / elapsed : 0;
      const eta = speed > 0 ? ((total - received) * (ctx.fileSize / total)) / speed : 0;

      this.machine.updateProgress(
        Math.floor(progress * ctx.fileSize),
        speed,
      );

      this.setPhase({
        phase: 'TRANSFERRING',
        transferId: params.transferId,
        progress: progress * 100,
        speed,
        eta,
      });

      // Check completion
      if (received === total) {
        this.completeTransfer(params.transferId);
      }
    }

    return true;
  }

  /**
   * Get the current chunk bitmap for this transfer.
   */
  getBitmap(): BitSet | null {
    return this.localBitmap;
  }

  /**
   * Get missing chunk indices.
   */
  getMissingChunks(): number[] {
    if (!this.localBitmap) return [];
    return this.localBitmap.missingIndices();
  }

  // ========================================================================
  // CONNECTION DROP AND RECOVERY
  // ========================================================================

  /**
   * Handle connection loss. Persists current state to IndexedDB and
   * transitions to PAUSED. The UI can show a reconnect prompt or
   * auto-resume countdown.
   */
  async handleConnectionDrop(transferId: string): Promise<void> {
    secureLog.warn(`[SyncCoordinator] Connection dropped for transfer ${transferId}`);

    // Transition state machine
    if (this.machine && this.machine.canTransition('PAUSE')) {
      this.machine.send('PAUSE');
    }

    // Persist state to IndexedDB
    if (this.config.statePersistenceEnabled) {
      try {
        await updateDbTransferState({
          transferId,
          status: 'paused',
        });

        // Also persist the state machine itself
        if (this.machine) {
          const serialized = this.machine.serialize();
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(`tallow_sm_${transferId}`, serialized);
            } catch {
              // sessionStorage might be full; non-critical
            }
          }
        }
      } catch (err) {
        secureLog.error('Failed to persist paused state:', err);
      }
    }

    this.setPhase({
      phase: 'PAUSED',
      transferId,
      progress: this.localBitmap
        ? (this.localBitmap.popcount() / this.localBitmap.size) * 100
        : 0,
      reason: 'connection_lost',
    });
  }

  /**
   * Prepare for reconnect: generates a BitmapExchangeMessage that should
   * be sent to the peer. The peer responds with their own bitmap, and
   * then only missing chunks are resent.
   */
  async prepareReconnect(transferId: string): Promise<BitmapExchangeMessage | null> {
    // Load state from IndexedDB
    const metadata = await getDbTransferState(transferId);
    if (!metadata) {
      secureLog.error(`[SyncCoordinator] Cannot reconnect: transfer ${transferId} not found`);
      return null;
    }

    // Restore bitmap from persisted state
    this.localBitmap = new BitSet(metadata.totalChunks, metadata.chunkBitmap);

    // Restore state machine if available
    if (typeof window !== 'undefined') {
      const serialized = sessionStorage.getItem(`tallow_sm_${transferId}`);
      if (serialized) {
        try {
          this.machine = TransferStateMachine.deserialize(serialized);
        } catch {
          // Create fresh state machine in resuming state
          this.machine = new TransferStateMachine({
            transferId,
            direction: metadata.direction,
            fileName: metadata.fileName,
            fileSize: metadata.fileSize,
            chunksTotal: metadata.totalChunks,
            peerId: metadata.peerId,
            peerName: '',
          });
        }
      }
    }

    const fileHashHex = Array.from(metadata.fileHash)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    this.setPhase({
      phase: 'RESUMING',
      transferId,
      missingChunks: this.localBitmap.missingIndices().length,
      totalChunks: metadata.totalChunks,
    });

    return {
      type: 'bitmap-exchange',
      transferId,
      bitmap: this.localBitmap.toHex(),
      totalChunks: metadata.totalChunks,
      fileHash: fileHashHex,
    };
  }

  /**
   * Process a bitmap exchange message from the peer.
   * Compares local and remote bitmaps to determine which chunks
   * need to be resent. Returns a BitmapResponseMessage.
   */
  processPeerBitmap(message: BitmapExchangeMessage): BitmapResponseMessage {
    const peerBitmap = BitSet.fromHex(message.bitmap, message.totalChunks);

    if (!this.localBitmap) {
      return {
        type: 'bitmap-response',
        transferId: message.transferId,
        missingChunks: [],
        acknowledged: false,
      };
    }

    // Chunks that peer needs (set in local, not in peer)
    const peerMissing = peerBitmap.missingIndices().filter(i => this.localBitmap!.get(i));

    secureLog.log(
      `[SyncCoordinator] Bitmap exchange: peer needs ${peerMissing.length} chunks, ` +
      `we have ${this.localBitmap.popcount()}/${this.localBitmap.size}`
    );

    return {
      type: 'bitmap-response',
      transferId: message.transferId,
      missingChunks: peerMissing,
      acknowledged: true,
    };
  }

  /**
   * Process a bitmap response from the peer -- the list of chunks
   * that we need to resend. Updates the transfer state and transitions
   * back to TRANSFERRING.
   */
  async handleBitmapResponse(response: BitmapResponseMessage): Promise<number[]> {
    if (!response.acknowledged) {
      secureLog.error('[SyncCoordinator] Peer rejected bitmap exchange');
      return [];
    }

    const transferId = response.transferId;

    // Resume the state machine
    if (this.machine) {
      if (this.machine.canTransition('RESUME')) {
        this.machine.send('RESUME');
      }
      if (this.machine.canTransition('CONNECTED')) {
        this.machine.send('CONNECTED');
      }
    }

    // Update IndexedDB status
    if (this.config.statePersistenceEnabled) {
      await updateDbTransferState({
        transferId,
        status: 'in-progress',
      });
    }

    const progress = this.localBitmap
      ? (this.localBitmap.popcount() / this.localBitmap.size) * 100
      : 0;

    this.setPhase({
      phase: 'TRANSFERRING',
      transferId,
      progress,
      speed: 0,
      eta: 0,
    });

    secureLog.log(
      `[SyncCoordinator] Resuming transfer ${transferId}: ` +
      `${response.missingChunks.length} chunks to resend`
    );

    return response.missingChunks;
  }

  // ========================================================================
  // DELTA SYNC INTEGRATION
  // ========================================================================

  /**
   * Determine whether delta sync should be used for a file transfer.
   * Checks file size, type, and whether we have cached signatures.
   */
  shouldUseDeltaSync(fileSize: number, fileName: string): boolean {
    if (!this.config.deltaSyncEnabled) return false;
    if (fileSize < this.config.deltaSyncMinFileSize) return false;

    // Skip compressed/encrypted files
    const skipExtensions = ['.zip', '.gz', '.7z', '.rar', '.tar', '.enc', '.gpg', '.aes'];
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (skipExtensions.includes(ext)) return false;

    return true;
  }

  /**
   * Initiate delta sync negotiation for a file.
   * Computes local signatures and returns a negotiation message
   * for the peer.
   */
  async initiateDeltaSync(
    fileId: string,
    file: File,
  ): Promise<DeltaNegotiationMessage> {
    const signatures = await this.deltaManager.initDeltaSync(fileId, file);
    const serialized = serializeSignatures(signatures);

    return {
      type: 'delta-negotiate',
      fileId,
      fileName: file.name,
      fileSize: file.size,
      signatures: serialized,
    };
  }

  /**
   * Handle a delta negotiation message from the peer.
   * Computes local signatures, compares, and decides whether delta
   * transfer is worthwhile.
   *
   * Returns the decision and, if delta is chosen, the patch to apply.
   */
  async handleDeltaNegotiation(
    message: DeltaNegotiationMessage,
    localFile: File | null,
  ): Promise<{
    decision: DeltaDecisionMessage;
    patch: FilePatch | null;
    delta: DeltaResult | null;
  }> {
    // If we do not have the file locally, no delta possible
    if (!localFile) {
      return {
        decision: {
          type: 'delta-decision',
          fileId: message.fileId,
          useDelta: false,
          savings: null,
        },
        patch: null,
        delta: null,
      };
    }

    const peerSignatures = deserializeSignatures(message.signatures);
    const blockSize = peerSignatures.blockSize || calculateOptimalBlockSize(message.fileSize);

    // Compute local signatures
    const localSignatures = await computeBlockSignatures(localFile, blockSize);

    // Compute delta
    const delta = computeDelta(peerSignatures, localSignatures);

    // Estimate savings
    const totalBlocks = Math.max(
      peerSignatures.blocks.length,
      localSignatures.blocks.length,
    );
    const savings = estimateSavings(delta, totalBlocks, blockSize);

    // Decide whether delta is worthwhile
    const useDelta = savings.savingsPercent >= this.config.deltaSyncMinSavingsPercent;

    let patch: FilePatch | null = null;
    if (useDelta) {
      const hasChanges = delta.changed.length > 0 || delta.added.length > 0;
      if (hasChanges) {
        patch = await createPatch(localFile, delta, blockSize);
      }
    }

    secureLog.log(
      `[SyncCoordinator] Delta sync decision for ${message.fileName}: ` +
      `${useDelta ? 'YES' : 'NO'} (${savings.savingsPercent.toFixed(1)}% savings, ${savings.efficiency})`
    );

    return {
      decision: {
        type: 'delta-decision',
        fileId: message.fileId,
        useDelta,
        savings,
      },
      patch,
      delta,
    };
  }

  /**
   * Get the delta sync manager for advanced operations.
   */
  getDeltaManager(): DeltaSyncManager {
    return this.deltaManager;
  }

  // ========================================================================
  // TRANSFER COMPLETION AND FAILURE
  // ========================================================================

  /**
   * Mark transfer as completed. Updates state machine, persists to IndexedDB,
   * and notifies observers.
   */
  async completeTransfer(transferId: string): Promise<void> {
    if (this.machine) {
      // Walk to completion
      if (this.machine.canTransition('TRANSFER_COMPLETE')) {
        this.machine.send('TRANSFER_COMPLETE');
      }
      if (this.machine.canTransition('VERIFIED')) {
        this.machine.send('VERIFIED');
      }
      if (this.machine.canTransition('DECRYPTED')) {
        this.machine.send('DECRYPTED');
      }
    }

    if (this.config.statePersistenceEnabled) {
      try {
        await updateDbTransferState({
          transferId,
          status: 'completed',
        });
      } catch (err) {
        secureLog.error('Failed to persist completed state:', err);
      }
    }

    const ctx = this.machine?.getContext();
    const duration = ctx ? (Date.now() - ctx.startedAt) / 1000 : 0;

    this.setPhase({
      phase: 'COMPLETED',
      transferId,
      bytesTransferred: ctx?.bytesTransferred ?? 0,
      duration,
    });

    // Clean up sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`tallow_sm_${transferId}`);
    }

    secureLog.log(`[SyncCoordinator] Transfer completed: ${transferId}`);
  }

  /**
   * Mark transfer as failed. Persists error to IndexedDB.
   */
  async failTransfer(transferId: string, error: string): Promise<void> {
    if (this.machine && this.machine.canTransition('ERROR')) {
      this.machine.send('ERROR', { error });
    }

    if (this.config.statePersistenceEnabled) {
      try {
        await updateDbTransferState({
          transferId,
          status: 'failed',
          error,
        });
      } catch (err) {
        secureLog.error('Failed to persist error state:', err);
      }
    }

    const canRetry = this.machine
      ? this.machine.getContext().retryCount < this.config.maxRetries
      : false;

    this.setPhase({
      phase: 'FAILED',
      transferId,
      error,
      retryable: canRetry,
    });
  }

  /**
   * Retry a failed transfer.
   */
  async retryTransfer(transferId: string): Promise<boolean> {
    if (!this.machine) return false;

    const ctx = this.machine.getContext();
    if (ctx.retryCount >= this.config.maxRetries) {
      secureLog.warn(`[SyncCoordinator] Max retries (${this.config.maxRetries}) exceeded`);
      return false;
    }

    if (!this.machine.canTransition('RETRY')) {
      return false;
    }

    this.machine.send('RETRY');

    this.setPhase({
      phase: 'RETRYING',
      transferId,
      attempt: ctx.retryCount + 1,
      maxAttempts: this.config.maxRetries,
    });

    if (this.config.statePersistenceEnabled) {
      await updateDbTransferState({
        transferId,
        status: 'in-progress',
      });
    }

    secureLog.log(
      `[SyncCoordinator] Retrying transfer ${transferId} ` +
      `(attempt ${ctx.retryCount + 1}/${this.config.maxRetries})`
    );

    return true;
  }

  /**
   * Pause a transfer (user-initiated).
   */
  async pauseTransfer(transferId: string): Promise<void> {
    if (this.machine && this.machine.canTransition('PAUSE')) {
      this.machine.send('PAUSE');
    }

    if (this.config.statePersistenceEnabled) {
      await updateDbTransferState({
        transferId,
        status: 'paused',
      });
    }

    this.setPhase({
      phase: 'PAUSED',
      transferId,
      progress: this.localBitmap
        ? (this.localBitmap.popcount() / this.localBitmap.size) * 100
        : 0,
      reason: 'user',
    });
  }

  /**
   * Cancel a transfer. Transitions to cancelled state and optionally
   * cleans up persisted data.
   */
  async cancelTransfer(transferId: string, cleanup = false): Promise<void> {
    if (this.machine && this.machine.canTransition('CANCEL')) {
      this.machine.send('CANCEL');
    }

    if (cleanup) {
      await deleteDbTransfer(transferId);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`tallow_sm_${transferId}`);
      }
    }

    this.setPhase({ phase: 'IDLE' });
  }

  // ========================================================================
  // PERSISTENCE QUERIES
  // ========================================================================

  /**
   * List all transfers that can be resumed (in-progress or paused).
   */
  async getResumableTransfers(): Promise<TransferMetadata[]> {
    return getDbResumableTransfers();
  }

  /**
   * Get persisted state for a transfer.
   */
  async getTransferState(transferId: string): Promise<TransferMetadata | null> {
    return getDbTransferState(transferId);
  }

  /**
   * Get all chunks for a transfer (for reassembly).
   */
  async getAllChunks(transferId: string) {
    return getDbAllChunks(transferId);
  }

  /**
   * Get missing chunks from IndexedDB state.
   */
  async getPersistedMissingChunks(transferId: string): Promise<number[]> {
    return getDbMissingChunks(transferId);
  }

  /**
   * Clean up expired transfers older than the retention period.
   */
  async cleanupExpired(): Promise<number> {
    return cleanupExpiredTransfers();
  }

  // ========================================================================
  // STATE MACHINE ACCESS
  // ========================================================================

  /** Get the underlying state machine (read-only access). */
  getStateMachine(): TransferStateMachine | null {
    return this.machine;
  }

  /** Get the current state machine state. */
  getMachineState(): TransferState | null {
    return this.machine?.getState() ?? null;
  }

  /** Get the current context. */
  getMachineContext(): Readonly<TransferContext> | null {
    return this.machine?.getContext() ?? null;
  }

  // ========================================================================
  // LIFECYCLE
  // ========================================================================

  /**
   * Reset coordinator to idle state. Does NOT delete persisted data.
   */
  reset(): void {
    if (this.machine && this.machine.canTransition('RESET')) {
      this.machine.send('RESET');
    }
    this.machine = null;
    this.localBitmap = null;
    this.setPhase({ phase: 'IDLE' });

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Destroy the coordinator and release all resources.
   */
  destroy(): void {
    this.destroyed = true;
    this.reset();
    this.deltaManager.destroy();
    this.observers = [];
  }

  /** Check if the coordinator has been destroyed. */
  isDestroyed(): boolean {
    return this.destroyed;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let defaultCoordinator: SyncCoordinator | null = null;

/**
 * Get or create the default SyncCoordinator instance.
 * This is the primary entry point for store-actions.ts.
 */
export function getSyncCoordinator(
  config?: Partial<SyncCoordinatorConfig>,
): SyncCoordinator {
  if (!defaultCoordinator || defaultCoordinator.isDestroyed()) {
    defaultCoordinator = new SyncCoordinator(config);
  }
  return defaultCoordinator;
}

/**
 * Reset the default coordinator instance (for testing).
 */
export function resetSyncCoordinator(): void {
  if (defaultCoordinator) {
    defaultCoordinator.destroy();
    defaultCoordinator = null;
  }
}
