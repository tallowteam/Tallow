'use client';

/**
 * Optimized Transfers Context
 * React 19 optimized with context selectors and split contexts
 * Reduces unnecessary re-renders
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { Transfer } from '../types';

// ============================================================================
// SPLIT CONTEXTS - Separate frequently changing state from stable state
// ============================================================================

// Transfer list context (changes when transfers are added/removed)
interface TransferListContextValue {
  transfers: Transfer[];
  addTransfer: (transfer: Transfer) => void;
  removeTransfer: (id: string) => void;
  updateTransfer: (id: string, updates: Partial<Transfer>) => void;
  clearTransfers: () => void;
}

// Transfer progress context (changes frequently during transfers)
interface TransferProgressContextValue {
  uploadProgress: number;
  downloadProgress: number;
  setUploadProgress: (progress: number) => void;
  setDownloadProgress: (progress: number) => void;
  resetProgress: () => void;
}

// Transfer state context (changes during transfer lifecycle)
interface TransferStateContextValue {
  isTransferring: boolean;
  isReceiving: boolean;
  currentFileName: string | null;
  currentFileSize: number;
  currentFileType: string;
  currentTransferPeerId: string | null;
  setIsTransferring: (value: boolean) => void;
  setIsReceiving: (value: boolean) => void;
  setCurrentTransfer: (
    fileName: string | null,
    fileSize: number,
    fileType: string,
    peerId: string | null
  ) => void;
  clearCurrentTransfer: () => void;
}

const TransferListContext = createContext<TransferListContextValue | undefined>(undefined);
const TransferProgressContext = createContext<TransferProgressContextValue | undefined>(undefined);
const TransferStateContext = createContext<TransferStateContextValue | undefined>(undefined);

// ============================================================================
// OPTIMIZED PROVIDER
// ============================================================================

export function OptimizedTransfersProvider({ children }: { children: React.ReactNode }) {
  // Transfer list state
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  // Progress state
  const [uploadProgress, setUploadProgressState] = useState(0);
  const [downloadProgress, setDownloadProgressState] = useState(0);

  // Transfer state
  const [isTransferring, setIsTransferring] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [currentFileSize, setCurrentFileSize] = useState(0);
  const [currentFileType, setCurrentFileType] = useState('');
  const [currentTransferPeerId, setCurrentTransferPeerId] = useState<string | null>(null);

  // Use refs for subscribers to prevent re-renders
  const subscribersRef = useRef(new Set<(transfers: Transfer[]) => void>());

  // Transfer list actions
  const addTransfer = useCallback((transfer: Transfer) => {
    setTransfers((prev) => {
      const updated = [...prev, transfer];
      subscribersRef.current.forEach((fn) => fn(updated));
      return updated;
    });
  }, []);

  const removeTransfer = useCallback((id: string) => {
    setTransfers((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      subscribersRef.current.forEach((fn) => fn(updated));
      return updated;
    });
  }, []);

  const updateTransfer = useCallback((id: string, updates: Partial<Transfer>) => {
    setTransfers((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      subscribersRef.current.forEach((fn) => fn(updated));
      return updated;
    });
  }, []);

  const clearTransfers = useCallback(() => {
    setTransfers([]);
    subscribersRef.current.forEach((fn) => fn([]));
  }, []);

  // Progress actions
  const setUploadProgress = useCallback((progress: number) => {
    setUploadProgressState(Math.min(100, Math.max(0, progress)));
  }, []);

  const setDownloadProgress = useCallback((progress: number) => {
    setDownloadProgressState(Math.min(100, Math.max(0, progress)));
  }, []);

  const resetProgress = useCallback(() => {
    setUploadProgressState(0);
    setDownloadProgressState(0);
  }, []);

  // Transfer state actions
  const setCurrentTransfer = useCallback(
    (fileName: string | null, fileSize: number, fileType: string, peerId: string | null) => {
      setCurrentFileName(fileName);
      setCurrentFileSize(fileSize);
      setCurrentFileType(fileType);
      setCurrentTransferPeerId(peerId);
    },
    []
  );

  const clearCurrentTransfer = useCallback(() => {
    setCurrentFileName(null);
    setCurrentFileSize(0);
    setCurrentFileType('');
    setCurrentTransferPeerId(null);
  }, []);

  // Memoize context values to prevent unnecessary re-renders
  const transferListValue = useMemo<TransferListContextValue>(
    () => ({
      transfers,
      addTransfer,
      removeTransfer,
      updateTransfer,
      clearTransfers,
    }),
    [transfers, addTransfer, removeTransfer, updateTransfer, clearTransfers]
  );

  const progressValue = useMemo<TransferProgressContextValue>(
    () => ({
      uploadProgress,
      downloadProgress,
      setUploadProgress,
      setDownloadProgress,
      resetProgress,
    }),
    [uploadProgress, downloadProgress, setUploadProgress, setDownloadProgress, resetProgress]
  );

  const stateValue = useMemo<TransferStateContextValue>(
    () => ({
      isTransferring,
      isReceiving,
      currentFileName,
      currentFileSize,
      currentFileType,
      currentTransferPeerId,
      setIsTransferring,
      setIsReceiving,
      setCurrentTransfer,
      clearCurrentTransfer,
    }),
    [
      isTransferring,
      isReceiving,
      currentFileName,
      currentFileSize,
      currentFileType,
      currentTransferPeerId,
      setCurrentTransfer,
      clearCurrentTransfer,
    ]
  );

  return (
    <TransferListContext.Provider value={transferListValue}>
      <TransferProgressContext.Provider value={progressValue}>
        <TransferStateContext.Provider value={stateValue}>
          {children}
        </TransferStateContext.Provider>
      </TransferProgressContext.Provider>
    </TransferListContext.Provider>
  );
}

// ============================================================================
// HOOKS - Use only the context slice you need
// ============================================================================

/**
 * Hook to access transfer list
 * Only re-renders when transfer list changes
 */
export function useTransferList() {
  const context = useContext(TransferListContext);
  if (!context) {
    throw new Error('useTransferList must be used within OptimizedTransfersProvider');
  }
  return context;
}

/**
 * Hook to access transfer progress
 * Only re-renders when progress changes
 */
export function useTransferProgress() {
  const context = useContext(TransferProgressContext);
  if (!context) {
    throw new Error('useTransferProgress must be used within OptimizedTransfersProvider');
  }
  return context;
}

/**
 * Hook to access transfer state
 * Only re-renders when transfer state changes
 */
export function useTransferState() {
  const context = useContext(TransferStateContext);
  if (!context) {
    throw new Error('useTransferState must be used within OptimizedTransfersProvider');
  }
  return context;
}

// ============================================================================
// SELECTOR HOOKS - Subscribe to specific values
// ============================================================================

/**
 * Hook to select specific transfer by ID
 * Only re-renders when the specific transfer changes
 */
export function useTransferById(id: string | null): Transfer | null {
  const { transfers } = useTransferList();
  return useMemo(() => {
    if (!id) {return null;}
    return transfers.find((t) => t.id === id) || null;
  }, [transfers, id]);
}

/**
 * Hook to select transfers by status
 * Only re-renders when transfers with the specified status change
 */
export function useTransfersByStatus(status: Transfer['status']): Transfer[] {
  const { transfers } = useTransferList();
  return useMemo(() => {
    return transfers.filter((t) => t.status === status);
  }, [transfers, status]);
}

/**
 * Hook to get active transfers count
 * Only re-renders when the count changes
 */
export function useActiveTransfersCount(): number {
  const { transfers } = useTransferList();
  return useMemo(() => {
    return transfers.filter((t) =>
      ['transferring', 'connecting', 'pending', 'paused'].includes(t.status)
    ).length;
  }, [transfers]);
}

/**
 * Hook to get total transfer size
 * Only re-renders when the total size changes
 */
export function useTotalTransferSize(): number {
  const { transfers } = useTransferList();
  return useMemo(() => {
    return transfers.reduce((acc, t) => acc + t.totalSize, 0);
  }, [transfers]);
}

/**
 * Hook to get transfer speed
 * Only re-renders when speed changes
 */
export function useTransferSpeed(): number {
  const { transfers } = useTransferList();
  return useMemo(() => {
    return transfers
      .filter((t) => t.status === 'transferring')
      .reduce((acc, t) => acc + (t.speed || 0), 0);
  }, [transfers]);
}

export default OptimizedTransfersProvider;
