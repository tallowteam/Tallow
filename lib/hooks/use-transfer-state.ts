'use client';

/**
 * @fileoverview Custom hook for managing file transfer state and progress
 * @module hooks/use-transfer-state
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { FileInfo } from '@/lib/types';
import { generateUUID } from '@/lib/utils/uuid';
import { addTransferRecord } from '@/lib/storage/transfer-history';
import { error } from '@/lib/utils/secure-logger';

/**
 * Transfer mode types
 */
export type TransferMode = 'send' | 'receive';

/**
 * Transfer status types
 */
export type TransferStatus = 'idle' | 'preparing' | 'connecting' | 'transferring' | 'completed' | 'failed' | 'cancelled';

/**
 * Individual file transfer progress
 */
export interface FileTransferProgress {
  /** File identifier */
  fileId: string;
  /** File name */
  fileName: string;
  /** Total file size in bytes */
  totalSize: number;
  /** Bytes transferred so far */
  transferredSize: number;
  /** Transfer progress percentage (0-100) */
  progress: number;
  /** Transfer speed in bytes per second */
  speed: number;
  /** Estimated time remaining in seconds */
  eta: number | null;
  /** Transfer status */
  status: TransferStatus;
  /** Error message if failed */
  error: string | null;
}

/**
 * Overall transfer state
 */
export interface TransferStateData {
  /** Current transfer mode */
  mode: TransferMode;
  /** Current transfer status */
  status: TransferStatus;
  /** List of files being transferred */
  files: FileInfo[];
  /** Current file being transferred */
  currentFile: FileTransferProgress | null;
  /** Overall progress percentage (0-100) */
  overallProgress: number;
  /** Total bytes to transfer */
  totalBytes: number;
  /** Total bytes transferred */
  transferredBytes: number;
  /** Overall transfer speed in bytes/sec */
  overallSpeed: number;
  /** Estimated time remaining for all files */
  estimatedTimeRemaining: number | null;
  /** Transfer start time */
  startTime: Date | null;
  /** Transfer end time */
  endTime: Date | null;
  /** Error message if transfer failed */
  error: string | null;
  /** Individual file progress tracking */
  fileProgress: Map<string, FileTransferProgress>;
}

/**
 * Options for transfer state hook
 */
export interface UseTransferStateOptions {
  /** Enable automatic history recording */
  saveToHistory?: boolean;
  /** Callback when transfer completes */
  onTransferComplete?: (files: FileInfo[]) => void;
  /** Callback when transfer fails */
  onTransferError?: (error: string) => void;
  /** Callback on progress update */
  onProgressUpdate?: (progress: number) => void;
}

/**
 * Custom hook for managing file transfer state and progress tracking
 *
 * Handles transfer lifecycle, progress calculation, speed estimation,
 * and automatic history recording.
 *
 * @param {UseTransferStateOptions} options - Configuration options
 * @returns Transfer state and control functions
 *
 * @example
 * ```tsx
 * const {
 *   status,
 *   currentFile,
 *   overallProgress,
 *   startTransfer,
 *   updateProgress,
 *   completeTransfer,
 *   cancelTransfer
 * } = useTransferState({
 *   saveToHistory: true,
 *   onTransferComplete: (files) => secureLog.log('Transfer complete:', files)
 * });
 * ```
 */
export function useTransferState(options: UseTransferStateOptions = {}) {
  const {
    saveToHistory = true,
    onTransferComplete,
    onTransferError,
    onProgressUpdate
  } = options;

  // State
  const [state, setState] = useState<TransferStateData>({
    mode: 'send',
    status: 'idle',
    files: [],
    currentFile: null,
    overallProgress: 0,
    totalBytes: 0,
    transferredBytes: 0,
    overallSpeed: 0,
    estimatedTimeRemaining: null,
    startTime: null,
    endTime: null,
    error: null,
    fileProgress: new Map()
  });

  // Refs for callbacks
  const onTransferCompleteRef = useRef(onTransferComplete);
  const onTransferErrorRef = useRef(onTransferError);
  const onProgressUpdateRef = useRef(onProgressUpdate);

  useEffect(() => {
    onTransferCompleteRef.current = onTransferComplete;
    onTransferErrorRef.current = onTransferError;
    onProgressUpdateRef.current = onProgressUpdate;
  }, [onTransferComplete, onTransferError, onProgressUpdate]);

  /**
   * Set transfer mode (send or receive)
   *
   * @param {TransferMode} mode - Transfer mode
   */
  const setMode = useCallback((mode: TransferMode) => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  /**
   * Start a new transfer
   *
   * @param {FileInfo[]} files - Files to transfer
   * @param {TransferMode} mode - Transfer mode
   */
  const startTransfer = useCallback((files: FileInfo[], mode: TransferMode = state.mode) => {
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    const startTime = new Date();

    setState({
      mode,
      status: 'preparing',
      files,
      currentFile: null,
      overallProgress: 0,
      totalBytes,
      transferredBytes: 0,
      overallSpeed: 0,
      estimatedTimeRemaining: null,
      startTime,
      endTime: null,
      error: null,
      fileProgress: new Map()
    });
  }, [state.mode]);

  /**
   * Update transfer status
   *
   * @param {TransferStatus} status - New status
   */
  const setStatus = useCallback((status: TransferStatus) => {
    setState(prev => ({ ...prev, status }));
  }, []);

  /**
   * Update progress for a specific file
   *
   * @param {string} fileId - File identifier
   * @param {number} transferredSize - Bytes transferred
   * @param {number} speed - Transfer speed in bytes/sec
   */
  const updateFileProgress = useCallback((fileId: string, transferredSize: number, speed: number = 0) => {
    setState(prev => {
      const fileProgress = new Map(prev.fileProgress);
      const existingProgress = fileProgress.get(fileId);

      if (!existingProgress) {
        // File not found in progress tracking
        return prev;
      }

      const progress = Math.min((transferredSize / existingProgress.totalSize) * 100, 100);
      const remaining = existingProgress.totalSize - transferredSize;
      const eta = speed > 0 ? remaining / speed : null;

      const updatedProgress: FileTransferProgress = {
        ...existingProgress,
        transferredSize,
        progress,
        speed,
        eta,
        status: progress >= 100 ? 'completed' : 'transferring'
      };

      fileProgress.set(fileId, updatedProgress);

      // Calculate overall progress
      const totalTransferred = Array.from(fileProgress.values())
        .reduce((sum, fp) => sum + fp.transferredSize, 0);
      const overallProgress = prev.totalBytes > 0
        ? (totalTransferred / prev.totalBytes) * 100
        : 0;

      // Calculate overall speed (average of active transfers)
      const activeTransfers = Array.from(fileProgress.values())
        .filter(fp => fp.status === 'transferring');
      const overallSpeed = activeTransfers.length > 0
        ? activeTransfers.reduce((sum, fp) => sum + fp.speed, 0) / activeTransfers.length
        : 0;

      // Calculate ETA
      const remainingBytes = prev.totalBytes - totalTransferred;
      const estimatedTimeRemaining = overallSpeed > 0 ? remainingBytes / overallSpeed : null;

      onProgressUpdateRef.current?.(overallProgress);

      return {
        ...prev,
        fileProgress,
        currentFile: updatedProgress,
        transferredBytes: totalTransferred,
        overallProgress,
        overallSpeed,
        estimatedTimeRemaining,
        status: 'transferring'
      };
    });
  }, []);

  /**
   * Start transfer for a specific file
   *
   * @param {FileInfo} file - File to start transferring
   */
  const startFileTransfer = useCallback((file: FileInfo) => {
    setState(prev => {
      const fileProgress = new Map(prev.fileProgress);

      const progress: FileTransferProgress = {
        fileId: file.id,
        fileName: file.name,
        totalSize: file.size,
        transferredSize: 0,
        progress: 0,
        speed: 0,
        eta: null,
        status: 'transferring',
        error: null
      };

      fileProgress.set(file.id, progress);

      return {
        ...prev,
        fileProgress,
        currentFile: progress,
        status: 'transferring'
      };
    });
  }, []);

  /**
   * Mark a file transfer as complete
   *
   * @param {string} fileId - File identifier
   */
  const completeFileTransfer = useCallback((fileId: string) => {
    setState(prev => {
      const fileProgress = new Map(prev.fileProgress);
      const progress = fileProgress.get(fileId);

      if (progress) {
        fileProgress.set(fileId, {
          ...progress,
          transferredSize: progress.totalSize,
          progress: 100,
          status: 'completed',
          eta: 0
        });
      }

      return { ...prev, fileProgress };
    });
  }, []);

  /**
   * Mark a file transfer as failed
   *
   * @param {string} fileId - File identifier
   * @param {string} error - Error message
   */
  const failFileTransfer = useCallback((fileId: string, error: string) => {
    setState(prev => {
      const fileProgress = new Map(prev.fileProgress);
      const progress = fileProgress.get(fileId);

      if (progress) {
        fileProgress.set(fileId, {
          ...progress,
          status: 'failed',
          error
        });
      }

      return { ...prev, fileProgress };
    });
  }, []);

  /**
   * Complete the entire transfer
   */
  const completeTransfer = useCallback(async () => {
    const endTime = new Date();

    setState(prev => ({
      ...prev,
      status: 'completed',
      endTime,
      overallProgress: 100
    }));

    // Save to history if enabled
    if (saveToHistory && state.files.length > 0) {
      try {
        const startedAt = state.startTime || endTime;
        await addTransferRecord({
          id: generateUUID(),
          direction: state.mode,
          files: state.files,
          totalSize: state.totalBytes,
          peerName: 'Peer Device',
          peerId: 'peer',
          status: 'completed',
          startedAt,
          completedAt: endTime,
          duration: endTime.getTime() - startedAt.getTime(),
          speed: state.overallSpeed
        });
      } catch (err) {
        error('Failed to save transfer to history:', err);
      }
    }

    onTransferCompleteRef.current?.(state.files);
  }, [saveToHistory, state.files, state.mode, state.totalBytes, state.overallSpeed, state.startTime]);

  /**
   * Fail the transfer with an error
   *
   * @param {string} error - Error message
   */
  const failTransfer = useCallback((error: string) => {
    const endTime = new Date();

    setState(prev => ({
      ...prev,
      status: 'failed',
      error,
      endTime
    }));

    onTransferErrorRef.current?.(error);
  }, []);

  /**
   * Cancel the transfer
   */
  const cancelTransfer = useCallback(() => {
    const endTime = new Date();

    setState(prev => ({
      ...prev,
      status: 'cancelled',
      endTime
    }));
  }, []);

  /**
   * Reset transfer state to idle
   */
  const resetTransfer = useCallback(() => {
    setState({
      mode: state.mode,
      status: 'idle',
      files: [],
      currentFile: null,
      overallProgress: 0,
      totalBytes: 0,
      transferredBytes: 0,
      overallSpeed: 0,
      estimatedTimeRemaining: null,
      startTime: null,
      endTime: null,
      error: null,
      fileProgress: new Map()
    });
  }, [state.mode]);

  /**
   * Get transfer duration in milliseconds
   *
   * @returns {number | null} Duration or null if not started
   */
  const getTransferDuration = useCallback((): number | null => {
    if (!state.startTime) {return null;}

    const endTime = state.endTime || new Date();
    return endTime.getTime() - state.startTime.getTime();
  }, [state.startTime, state.endTime]);

  /**
   * Format speed for display
   *
   * @param {number} bytesPerSecond - Speed in bytes/sec
   * @returns {string} Formatted speed string
   */
  const formatSpeed = useCallback((bytesPerSecond: number): string => {
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    let size = bytesPerSecond;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }, []);

  /**
   * Format time remaining
   *
   * @param {number | null} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  const formatTimeRemaining = useCallback((seconds: number | null): string => {
    if (seconds === null || !isFinite(seconds) || seconds < 0) {
      return 'Calculating...';
    }

    if (seconds < 60) {
      return `${Math.floor(seconds)}s`;
    }

    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}m ${secs}s`;
    }

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }, []);

  return {
    // State
    mode: state.mode,
    status: state.status,
    files: state.files,
    currentFile: state.currentFile,
    overallProgress: state.overallProgress,
    totalBytes: state.totalBytes,
    transferredBytes: state.transferredBytes,
    overallSpeed: state.overallSpeed,
    estimatedTimeRemaining: state.estimatedTimeRemaining,
    startTime: state.startTime,
    endTime: state.endTime,
    error: state.error,
    fileProgress: state.fileProgress,

    // Computed
    isTransferring: state.status === 'transferring',
    isComplete: state.status === 'completed',
    isFailed: state.status === 'failed',
    isCancelled: state.status === 'cancelled',
    isActive: ['preparing', 'connecting', 'transferring'].includes(state.status),

    // Actions
    setMode,
    setStatus,
    startTransfer,
    startFileTransfer,
    updateFileProgress,
    completeFileTransfer,
    failFileTransfer,
    completeTransfer,
    failTransfer,
    cancelTransfer,
    resetTransfer,

    // Utilities
    getTransferDuration,
    formatSpeed,
    formatTimeRemaining
  };
}

/**
 * Default export
 */
export default useTransferState;
