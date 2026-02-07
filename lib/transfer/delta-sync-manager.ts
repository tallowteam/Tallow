/**
 * Delta Sync Manager
 *
 * Manages delta synchronization sessions with signature caching and
 * automatic cleanup. Coordinates the delta sync workflow between peers.
 *
 * Features:
 * - In-memory signature cache with LRU eviction
 * - Session management for delta sync operations
 * - Automatic cache cleanup
 * - Progress tracking
 * - Error handling and recovery
 */

import {
  computeBlockSignatures,
  computeDelta,
  createPatch,
  applyPatch,
  estimateSavings,
  calculateOptimalBlockSize,
  serializeSignatures,
  deserializeSignatures,
  serializePatch,
  deserializePatch,
  validateSignatures,
  validatePatch,
  type FileSignatures,
  type FilePatch,
  type DeltaResult,
  type SavingsEstimate,
} from './delta-sync';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DeltaSyncSession {
  fileId: string;
  fileName: string;
  fileSize: number;
  blockSize: number;
  localSignatures: FileSignatures | null;
  remoteSignatures: FileSignatures | null;
  delta: DeltaResult | null;
  patch: FilePatch | null;
  status: 'idle' | 'computing' | 'comparing' | 'patching' | 'complete' | 'error';
  progress: number; // 0-100
  error: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CacheEntry {
  fileId: string;
  fileName: string;
  fileSize: number;
  lastModified: number;
  signatures: FileSignatures;
  accessCount: number;
  lastAccessedAt: number;
  createdAt: number;
}

export interface DeltaSyncOptions {
  maxCacheSize?: number; // Maximum number of signatures to cache
  cacheExpiryMs?: number; // Cache expiry time in milliseconds
  blockSize?: number; // Override automatic block size calculation
  autoCleanup?: boolean; // Automatically cleanup old cache entries
}

export interface SyncResult {
  success: boolean;
  fileId: string;
  delta: DeltaResult;
  patch: FilePatch | null;
  savings: SavingsEstimate;
  error: string | null;
}

export interface SyncProgress {
  phase: 'signatures' | 'delta' | 'patch' | 'apply' | 'complete';
  progress: number; // 0-100
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_CACHE_SIZE = 100;
const DEFAULT_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// ============================================================================
// DELTA SYNC MANAGER
// ============================================================================

export class DeltaSyncManager {
  private signatureCache: Map<string, CacheEntry> = new Map();
  private sessions: Map<string, DeltaSyncSession> = new Map();
  private options: Required<DeltaSyncOptions>;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: DeltaSyncOptions = {}) {
    this.options = {
      maxCacheSize: options.maxCacheSize ?? DEFAULT_MAX_CACHE_SIZE,
      cacheExpiryMs: options.cacheExpiryMs ?? DEFAULT_CACHE_EXPIRY_MS,
      blockSize: options.blockSize ?? 0, // 0 means auto-calculate
      autoCleanup: options.autoCleanup ?? true,
    };

    if (this.options.autoCleanup) {
      this.startAutoCleanup();
    }
  }

  // ========================================================================
  // SESSION MANAGEMENT
  // ========================================================================

  /**
   * Initialize delta sync for a file
   * Computes and caches signatures
   */
  async initDeltaSync(fileId: string, file: File): Promise<FileSignatures> {
    // Check if signatures are already cached and valid
    const cached = this.getCachedSignatures(fileId, file.lastModified);
    if (cached) {
      return cached;
    }

    // Create session
    const session = this.createSession(fileId, file.name, file.size);
    session.status = 'computing';
    session.progress = 0;

    try {
      // Compute optimal block size
      const blockSize = this.options.blockSize || calculateOptimalBlockSize(file.size);
      session.blockSize = blockSize;

      // Compute signatures
      const signatures = await computeBlockSignatures(file, blockSize);

      // Update session
      session.localSignatures = signatures;
      session.status = 'idle';
      session.progress = 100;

      // Cache signatures
      this.cacheSignatures(fileId, file.name, file.size, file.lastModified, signatures);

      return signatures;
    } catch (error) {
      session.status = 'error';
      session.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      session.updatedAt = Date.now();
    }
  }

  /**
   * Perform delta sync for a file update
   * Compares local and remote signatures, creates patch
   */
  async syncFile(
    fileId: string,
    updatedFile: File,
    peerSignatures: FileSignatures
  ): Promise<SyncResult> {
    // Validate peer signatures
    if (!validateSignatures(peerSignatures)) {
      return {
        success: false,
        fileId,
        delta: { unchanged: [], changed: [], added: [], removed: [] },
        patch: null,
        savings: {
          originalBytes: 0,
          patchBytes: 0,
          savedBytes: 0,
          savingsPercent: 0,
          efficiency: 'poor',
        },
        error: 'Invalid peer signatures',
      };
    }

    const session = this.getOrCreateSession(fileId, updatedFile.name, updatedFile.size);
    session.remoteSignatures = peerSignatures;

    try {
      // Phase 1: Compute local signatures
      session.status = 'computing';
      session.progress = 0;

      const blockSize = peerSignatures.blockSize;
      session.blockSize = blockSize;

      const localSignatures = await computeBlockSignatures(updatedFile, blockSize);
      session.localSignatures = localSignatures;
      session.progress = 25;

      // Phase 2: Compute delta
      session.status = 'comparing';
      const delta = computeDelta(localSignatures, peerSignatures);
      session.delta = delta;
      session.progress = 50;

      // Calculate savings
      const totalBlocks = Math.max(
        localSignatures.blocks.length,
        peerSignatures.blocks.length
      );
      const savings = estimateSavings(delta, totalBlocks, blockSize);

      // Phase 3: Create patch (only if there are changes)
      session.status = 'patching';
      let patch: FilePatch | null = null;

      const hasChanges = delta.changed.length > 0 || delta.added.length > 0;
      if (hasChanges) {
        patch = await createPatch(updatedFile, delta, blockSize);
        session.patch = patch;
      }

      session.progress = 100;
      session.status = 'complete';

      return {
        success: true,
        fileId,
        delta,
        patch,
        savings,
        error: null,
      };
    } catch (error) {
      session.status = 'error';
      session.error = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        fileId,
        delta: { unchanged: [], changed: [], added: [], removed: [] },
        patch: null,
        savings: {
          originalBytes: 0,
          patchBytes: 0,
          savedBytes: 0,
          savingsPercent: 0,
          efficiency: 'poor',
        },
        error: session.error,
      };
    } finally {
      session.updatedAt = Date.now();
    }
  }

  /**
   * Apply a received patch to reconstruct updated file
   */
  async applyReceivedPatch(
    fileId: string,
    originalFile: File,
    patch: FilePatch
  ): Promise<Blob> {
    // Validate patch
    if (!validatePatch(patch)) {
      throw new Error('Invalid patch structure');
    }

    const session = this.getOrCreateSession(fileId, originalFile.name, originalFile.size);
    session.status = 'patching';
    session.progress = 0;

    try {
      const result = await applyPatch(
        originalFile,
        patch,
        patch.delta,
        patch.blockSize
      );

      session.status = 'complete';
      session.progress = 100;

      return result;
    } catch (error) {
      session.status = 'error';
      session.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      session.updatedAt = Date.now();
    }
  }

  // ========================================================================
  // CACHE MANAGEMENT
  // ========================================================================

  /**
   * Get cached signatures if still valid
   */
  private getCachedSignatures(
    fileId: string,
    lastModified: number
  ): FileSignatures | null {
    const entry = this.signatureCache.get(fileId);

    if (!entry) {
      return null;
    }

    // Check if file was modified
    if (entry.lastModified !== lastModified) {
      this.signatureCache.delete(fileId);
      return null;
    }

    // Check if entry expired
    const now = Date.now();
    if (now - entry.createdAt > this.options.cacheExpiryMs) {
      this.signatureCache.delete(fileId);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = now;

    return entry.signatures;
  }

  /**
   * Cache signatures with LRU eviction
   */
  private cacheSignatures(
    fileId: string,
    fileName: string,
    fileSize: number,
    lastModified: number,
    signatures: FileSignatures
  ): void {
    // Check cache size limit
    if (this.signatureCache.size >= this.options.maxCacheSize) {
      this.evictLRU();
    }

    const now = Date.now();
    const entry: CacheEntry = {
      fileId,
      fileName,
      fileSize,
      lastModified,
      signatures,
      accessCount: 1,
      lastAccessedAt: now,
      createdAt: now,
    };

    this.signatureCache.set(fileId, entry);
  }

  /**
   * Evict least recently used cache entry
   */
  private evictLRU(): void {
    let oldestEntry: [string, CacheEntry] | null = null;
    let oldestAccessTime = Infinity;

    this.signatureCache.forEach((entry, key) => {
      if (entry.lastAccessedAt < oldestAccessTime) {
        oldestAccessTime = entry.lastAccessedAt;
        oldestEntry = [key, entry];
      }
    });

    if (oldestEntry) {
      this.signatureCache.delete(oldestEntry[0]);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): number {
    const now = Date.now();
    let cleared = 0;

    this.signatureCache.forEach((entry, fileId) => {
      if (now - entry.createdAt > this.options.cacheExpiryMs) {
        this.signatureCache.delete(fileId);
        cleared++;
      }
    });

    return cleared;
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.signatureCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    entries: Array<{
      fileId: string;
      fileName: string;
      accessCount: number;
      age: number;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.signatureCache.values()).map(entry => ({
      fileId: entry.fileId,
      fileName: entry.fileName,
      accessCount: entry.accessCount,
      age: now - entry.createdAt,
    }));

    return {
      size: this.signatureCache.size,
      maxSize: this.options.maxCacheSize,
      entries,
    };
  }

  // ========================================================================
  // SESSION HELPERS
  // ========================================================================

  private createSession(
    fileId: string,
    fileName: string,
    fileSize: number
  ): DeltaSyncSession {
    const now = Date.now();
    const session: DeltaSyncSession = {
      fileId,
      fileName,
      fileSize,
      blockSize: 0,
      localSignatures: null,
      remoteSignatures: null,
      delta: null,
      patch: null,
      status: 'idle',
      progress: 0,
      error: null,
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(fileId, session);
    return session;
  }

  private getOrCreateSession(
    fileId: string,
    fileName: string,
    fileSize: number
  ): DeltaSyncSession {
    const existing = this.sessions.get(fileId);
    if (existing) {
      return existing;
    }
    return this.createSession(fileId, fileName, fileSize);
  }

  /**
   * Get session information
   */
  getSession(fileId: string): DeltaSyncSession | null {
    return this.sessions.get(fileId) || null;
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): DeltaSyncSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clear a specific session
   */
  clearSession(fileId: string): void {
    this.sessions.delete(fileId);
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessions.clear();
  }

  // ========================================================================
  // CLEANUP
  // ========================================================================

  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const cleared = this.clearExpiredCache();
      if (cleared > 0) {
        console.log(`[DeltaSyncManager] Cleared ${cleared} expired cache entries`);
      }
    }, CLEANUP_INTERVAL_MS);
  }

  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Destroy manager and cleanup resources
   */
  destroy(): void {
    this.stopAutoCleanup();
    this.clearCache();
    this.clearAllSessions();
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Export signatures for transmission
   */
  exportSignatures(fileId: string): string | null {
    const entry = this.signatureCache.get(fileId);
    if (!entry) {
      return null;
    }
    return serializeSignatures(entry.signatures);
  }

  /**
   * Import signatures from peer
   */
  importSignatures(json: string): FileSignatures {
    return deserializeSignatures(json);
  }

  /**
   * Export patch for transmission
   */
  exportPatch(patch: FilePatch): { metadata: string; blocks: ArrayBuffer[] } {
    return serializePatch(patch);
  }

  /**
   * Import patch from peer
   */
  importPatch(metadata: string, blocks: ArrayBuffer[]): FilePatch {
    return deserializePatch(metadata, blocks);
  }

  /**
   * Check if file has cached signatures
   */
  hasSignatures(fileId: string): boolean {
    return this.signatureCache.has(fileId);
  }

  /**
   * Get signatures for a file (from cache only)
   */
  getSignatures(fileId: string): FileSignatures | null {
    const entry = this.signatureCache.get(fileId);
    return entry ? entry.signatures : null;
  }
}

// ============================================================================
// SINGLETON INSTANCE (OPTIONAL)
// ============================================================================

let defaultManager: DeltaSyncManager | null = null;

/**
 * Get or create default manager instance
 */
export function getDefaultManager(options?: DeltaSyncOptions): DeltaSyncManager {
  if (!defaultManager) {
    defaultManager = new DeltaSyncManager(options);
  }
  return defaultManager;
}

/**
 * Reset default manager instance
 */
export function resetDefaultManager(): void {
  if (defaultManager) {
    defaultManager.destroy();
    defaultManager = null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DeltaSyncManager;
