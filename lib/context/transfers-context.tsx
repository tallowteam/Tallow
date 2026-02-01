'use client';

/**
 * Transfers Context
 * Centralized state management for file transfers
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Transfer } from '../types';

export interface TransferState {
  // Active transfers
  transfers: Transfer[];
  // Transfer queue
  queue: File[];
  // Transfer progress
  uploadProgress: number;
  downloadProgress: number;
  // Transfer status
  isTransferring: boolean;
  isReceiving: boolean;
  // Current transfer info
  currentFileName: string | null;
  currentFileSize: number;
  currentFileType: string;
  currentTransferPeerId: string | null;
}

export interface ReceivedFile {
  name: string;
  type: string;
  size: number;
  blob: Blob;
  receivedAt: Date;
  relativePath?: string;
}

interface TransfersContextValue extends TransferState {
  // Actions
  addTransfer: (transfer: Transfer) => void;
  removeTransfer: (id: string) => void;
  updateTransfer: (id: string, updates: Partial<Transfer>) => void;
  clearTransfers: () => void;

  // Queue management
  addToQueue: (files: File[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;

  // Progress tracking
  setUploadProgress: (progress: number) => void;
  setDownloadProgress: (progress: number) => void;
  resetProgress: () => void;

  // Transfer state
  setIsTransferring: (value: boolean) => void;
  setIsReceiving: (value: boolean) => void;
  setCurrentTransfer: (fileName: string | null, fileSize: number, fileType: string, peerId: string | null) => void;
  clearCurrentTransfer: () => void;

  // Received files
  receivedFiles: ReceivedFile[];
  addReceivedFile: (file: ReceivedFile) => void;
  removeReceivedFile: (index: number) => void;
  clearReceivedFiles: () => void;
}

const TransfersContext = createContext<TransfersContextValue | undefined>(undefined);

/**
 * Transfers Provider
 */
export function TransfersProvider({ children }: { children: React.ReactNode }) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [queue, setQueue] = useState<File[]>([]);
  const [uploadProgress, setUploadProgressState] = useState(0);
  const [downloadProgress, setDownloadProgressState] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [currentFileSize, setCurrentFileSize] = useState(0);
  const [currentFileType, setCurrentFileType] = useState('');
  const [currentTransferPeerId, setCurrentTransferPeerId] = useState<string | null>(null);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);

  // Transfer management
  const addTransfer = useCallback((transfer: Transfer) => {
    setTransfers(prev => [...prev, transfer]);
  }, []);

  const removeTransfer = useCallback((id: string) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTransfer = useCallback((id: string, updates: Partial<Transfer>) => {
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const clearTransfers = useCallback(() => {
    setTransfers([]);
  }, []);

  // Queue management
  const addToQueue = useCallback((files: File[]) => {
    setQueue(prev => [...prev, ...files]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Progress tracking
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

  // Transfer state
  const setCurrentTransfer = useCallback((
    fileName: string | null,
    fileSize: number,
    fileType: string,
    peerId: string | null
  ) => {
    setCurrentFileName(fileName);
    setCurrentFileSize(fileSize);
    setCurrentFileType(fileType);
    setCurrentTransferPeerId(peerId);
  }, []);

  const clearCurrentTransfer = useCallback(() => {
    setCurrentFileName(null);
    setCurrentFileSize(0);
    setCurrentFileType('');
    setCurrentTransferPeerId(null);
  }, []);

  // Received files
  const addReceivedFile = useCallback((file: ReceivedFile) => {
    setReceivedFiles(prev => [...prev, file]);
  }, []);

  const removeReceivedFile = useCallback((index: number) => {
    setReceivedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearReceivedFiles = useCallback(() => {
    setReceivedFiles([]);
  }, []);

  // Memoize context value to prevent unnecessary re-renders (React 18 optimization)
  const contextValue = useMemo<TransfersContextValue>(() => ({
    // State
    transfers,
    queue,
    uploadProgress,
    downloadProgress,
    isTransferring,
    isReceiving,
    currentFileName,
    currentFileSize,
    currentFileType,
    currentTransferPeerId,
    receivedFiles,

    // Actions
    addTransfer,
    removeTransfer,
    updateTransfer,
    clearTransfers,
    addToQueue,
    removeFromQueue,
    clearQueue,
    setUploadProgress,
    setDownloadProgress,
    resetProgress,
    setIsTransferring,
    setIsReceiving,
    setCurrentTransfer,
    clearCurrentTransfer,
    addReceivedFile,
    removeReceivedFile,
    clearReceivedFiles,
  }), [
    transfers,
    queue,
    uploadProgress,
    downloadProgress,
    isTransferring,
    isReceiving,
    currentFileName,
    currentFileSize,
    currentFileType,
    currentTransferPeerId,
    receivedFiles,
    addTransfer,
    removeTransfer,
    updateTransfer,
    clearTransfers,
    addToQueue,
    removeFromQueue,
    clearQueue,
    setUploadProgress,
    setDownloadProgress,
    resetProgress,
    setIsTransferring,
    setIsReceiving,
    setCurrentTransfer,
    clearCurrentTransfer,
    addReceivedFile,
    removeReceivedFile,
    clearReceivedFiles,
  ]);

  return (
    <TransfersContext.Provider value={contextValue}>
      {children}
    </TransfersContext.Provider>
  );
}

/**
 * Hook to use transfers context
 */
export function useTransfers() {
  const context = useContext(TransfersContext);
  if (!context) {
    throw new Error('useTransfers must be used within TransfersProvider');
  }
  return context;
}

export default TransfersContext;
