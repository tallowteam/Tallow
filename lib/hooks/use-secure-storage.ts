'use client';

/**
 * @fileoverview React hook wrapper for encrypted IndexedDB storage
 * @module hooks/use-secure-storage
 *
 * Thin wrapper around lib/storage/transfer-state-db.ts
 * Provides React-friendly API for encrypted persistent storage.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  TransferMetadata,
  ChunkData,
  createTransferState,
  getTransferState,
  updateTransferState,
  saveChunk,
  getChunk,
  getAllChunks,
  getMissingChunks,
  isChunkReceived,
  getResumableTransfers,
  deleteTransfer,
  cleanupExpiredTransfers,
  getTransferStats
} from '@/lib/storage/transfer-state-db';
import { SessionKeys } from '@/lib/crypto/pqc-crypto-lazy';

/**
 * Options for secure storage hook
 */
export interface UseSecureStorageOptions {
  /** Auto-initialize on mount (default: true) */
  autoInit?: boolean;
  /** Callback when initialization fails */
  onInitError?: (error: string) => void;
  /** Callback when storage is ready */
  onReady?: () => void;
}

/**
 * Custom hook for encrypted IndexedDB storage
 *
 * Wraps transfer-state-db.ts as a React hook with state management
 * for transfer metadata, chunks, and resumable transfers.
 *
 * @param {UseSecureStorageOptions} options - Configuration options
 * @returns Storage state and methods
 *
 * @example
 * ```tsx
 * const {
 *   isReady,
 *   error,
 *   createTransfer,
 *   getTransfer,
 *   saveChunkData,
 *   getResumable
 * } = useSecureStorage();
 *
 * // Create a transfer
 * await createTransfer(
 *   transferId,
 *   fileName,
 *   fileType,
 *   fileSize,
 *   fileHash,
 *   chunkSize,
 *   peerId,
 *   'send'
 * );
 *
 * // Save chunk
 * await saveChunkData(transferId, chunkIndex, data, nonce, hash);
 * ```
 */
export function useSecureStorage(options: UseSecureStorageOptions = {}) {
  const {
    autoInit = true,
    onInitError,
    onReady
  } = options;

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initAttemptedRef = useRef(false);

  // Initialize storage on mount
  useEffect(() => {
    if (!autoInit || initAttemptedRef.current) {return;}

    initAttemptedRef.current = true;

    const initialize = async () => {
      try {
        // Test database access by attempting a read
        // This will trigger DB creation if needed
        await getResumableTransfers();

        setIsReady(true);
        setError(null);
        onReady?.();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize storage';
        setError(errorMessage);
        setIsReady(false);
        onInitError?.(errorMessage);
      }
    };

    initialize();
  }, [autoInit, onInitError, onReady]);

  /**
   * Create a new transfer state
   */
  const createTransfer = useCallback(async (
    transferId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    fileHash: Uint8Array,
    chunkSize: number,
    peerId: string,
    direction: 'send' | 'receive',
    sessionKeys?: SessionKeys,
    encryptedName?: string,
    nameNonce?: Uint8Array,
    encryptedPath?: string,
    pathNonce?: Uint8Array
  ): Promise<TransferMetadata | null> => {
    try {
      const metadata = await createTransferState(
        transferId,
        fileName,
        fileType,
        fileSize,
        fileHash,
        chunkSize,
        peerId,
        direction,
        sessionKeys,
        encryptedName,
        nameNonce,
        encryptedPath,
        pathNonce
      );
      return metadata;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transfer';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Get transfer metadata by ID
   */
  const getTransfer = useCallback(async (transferId: string): Promise<TransferMetadata | null> => {
    try {
      const metadata = await getTransferState(transferId);
      return metadata;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get transfer';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Update transfer metadata
   */
  const updateTransfer = useCallback(async (
    metadata: Partial<TransferMetadata> & { transferId: string }
  ): Promise<boolean> => {
    try {
      await updateTransferState(metadata);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transfer';
      setError(errorMessage);
      return false;
    }
  }, []);

  /**
   * Save chunk data
   */
  const saveChunkData = useCallback(async (
    transferId: string,
    chunkIndex: number,
    data: ArrayBuffer,
    nonce: Uint8Array,
    hash: Uint8Array
  ): Promise<boolean> => {
    try {
      await saveChunk(transferId, chunkIndex, data, nonce, hash);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save chunk';
      setError(errorMessage);
      return false;
    }
  }, []);

  /**
   * Get chunk data by index
   */
  const getChunkData = useCallback(async (
    transferId: string,
    chunkIndex: number
  ): Promise<ChunkData | null> => {
    try {
      const chunk = await getChunk(transferId, chunkIndex);
      return chunk;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get chunk';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Get all chunks for a transfer
   */
  const getAllChunksData = useCallback(async (transferId: string): Promise<ChunkData[]> => {
    try {
      const chunks = await getAllChunks(transferId);
      return chunks;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get chunks';
      setError(errorMessage);
      return [];
    }
  }, []);

  /**
   * Get missing chunk indices
   */
  const getMissingChunkIndices = useCallback(async (transferId: string): Promise<number[]> => {
    try {
      const missing = await getMissingChunks(transferId);
      return missing;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get missing chunks';
      setError(errorMessage);
      return [];
    }
  }, []);

  /**
   * Check if chunk is received
   */
  const checkChunkReceived = useCallback(async (
    transferId: string,
    chunkIndex: number
  ): Promise<boolean> => {
    try {
      const received = await isChunkReceived(transferId, chunkIndex);
      return received;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check chunk');
      return false;
    }
  }, []);

  /**
   * Get all resumable transfers
   */
  const getResumable = useCallback(async (): Promise<TransferMetadata[]> => {
    try {
      const transfers = await getResumableTransfers();
      return transfers;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get resumable transfers';
      setError(errorMessage);
      return [];
    }
  }, []);

  /**
   * Delete a transfer and all its chunks
   */
  const removeTransfer = useCallback(async (transferId: string): Promise<boolean> => {
    try {
      await deleteTransfer(transferId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete transfer';
      setError(errorMessage);
      return false;
    }
  }, []);

  /**
   * Clean up expired transfers (older than 7 days)
   */
  const cleanupExpired = useCallback(async (): Promise<number> => {
    try {
      const count = await cleanupExpiredTransfers();
      return count;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup';
      setError(errorMessage);
      return 0;
    }
  }, []);

  /**
   * Get transfer statistics
   */
  const getStats = useCallback(async (transferId: string): Promise<{
    totalChunks: number;
    receivedChunks: number;
    missingChunks: number;
    progress: number;
    bytesReceived: number;
  } | null> => {
    try {
      const stats = await getTransferStats(transferId);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get stats';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Generic key-value storage methods
   * (For non-transfer data - uses localStorage as fallback)
   */
  const setItem = useCallback(async (key: string, value: string): Promise<boolean> => {
    try {
      localStorage.setItem(`tallow:${key}`, value);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set item');
      return false;
    }
  }, []);

  const getItem = useCallback((key: string): string | null => {
    try {
      return localStorage.getItem(`tallow:${key}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get item');
      return null;
    }
  }, []);

  const removeItem = useCallback(async (key: string): Promise<boolean> => {
    try {
      localStorage.removeItem(`tallow:${key}`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
      return false;
    }
  }, []);

  const clear = useCallback(async (): Promise<boolean> => {
    try {
      // Only clear tallow-prefixed items
      const keys = Object.keys(localStorage).filter(k => k.startsWith('tallow:'));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear storage');
      return false;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isReady,
    error,

    // Transfer methods
    createTransfer,
    getTransfer,
    updateTransfer,
    removeTransfer,
    getResumable,
    cleanupExpired,
    getStats,

    // Chunk methods
    saveChunkData,
    getChunkData,
    getAllChunksData,
    getMissingChunkIndices,
    checkChunkReceived,

    // Generic storage (localStorage fallback)
    setItem,
    getItem,
    removeItem,
    clear,

    // Utilities
    clearError
  };
}

export default useSecureStorage;
