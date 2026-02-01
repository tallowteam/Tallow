/**
 * Transfer Store - Zustand State Management
 *
 * Manages file transfers with optimistic updates, batched updates,
 * and efficient state slicing for reduced re-renders.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { Transfer } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TransferStatus =
  | 'pending'
  | 'connecting'
  | 'transferring'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TransferStats {
  totalActive: number;
  totalCompleted: number;
  totalFailed: number;
  totalSize: number;
  totalTransferred: number;
  averageSpeed: number;
  estimatedTimeRemaining: number;
}

export interface TransferStoreState {
  // Transfer data
  transfers: Transfer[];

  // Queue
  queue: File[];

  // Progress tracking (isolated for frequent updates)
  progress: {
    uploadProgress: number;
    downloadProgress: number;
  };

  // Current transfer state
  currentTransfer: {
    fileName: string | null;
    fileSize: number;
    fileType: string;
    peerId: string | null;
    isTransferring: boolean;
    isReceiving: boolean;
  };

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Actions - Transfer Management
  addTransfer: (transfer: Transfer) => void;
  addTransfers: (transfers: Transfer[]) => void;
  updateTransfer: (id: string, updates: Partial<Transfer>) => void;
  updateTransferProgress: (id: string, progress: number, speed?: number) => void;
  removeTransfer: (id: string) => void;
  clearTransfers: () => void;
  clearCompleted: () => void;

  // Actions - Optimistic Updates
  addTransferOptimistic: (transfer: Transfer) => () => void;
  updateTransferOptimistic: (id: string, updates: Partial<Transfer>) => () => void;

  // Actions - Transfer Control
  pauseTransfer: (id: string) => void;
  resumeTransfer: (id: string) => void;
  cancelTransfer: (id: string) => void;
  retryTransfer: (id: string) => void;
  pauseAll: () => void;
  resumeAll: () => void;

  // Actions - Queue
  addToQueue: (files: File[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;

  // Actions - Progress
  setUploadProgress: (progress: number) => void;
  setDownloadProgress: (progress: number) => void;
  resetProgress: () => void;

  // Actions - Current Transfer
  setCurrentTransfer: (
    fileName: string | null,
    fileSize: number,
    fileType: string,
    peerId: string | null
  ) => void;
  setIsTransferring: (value: boolean) => void;
  setIsReceiving: (value: boolean) => void;
  clearCurrentTransfer: () => void;

  // Actions - Loading
  setLoading: (isLoading: boolean) => void;
  setInitialized: () => void;

  // Selectors
  getTransferById: (id: string) => Transfer | undefined;
  getActiveTransfers: () => Transfer[];
  getCompletedTransfers: () => Transfer[];
  getFailedTransfers: () => Transfer[];
  getStats: () => TransferStats;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useTransferStore = create<TransferStoreState>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        // Initial state
        transfers: [],
        queue: [],
        progress: {
          uploadProgress: 0,
          downloadProgress: 0,
        },
        currentTransfer: {
          fileName: null,
          fileSize: 0,
          fileType: '',
          peerId: null,
          isTransferring: false,
          isReceiving: false,
        },
        isLoading: false,
        isInitialized: false,

        // Transfer Management
        addTransfer: (transfer) =>
          set((state) => {
            const existingIndex = state.transfers.findIndex((t) => t.id === transfer.id);
            if (existingIndex >= 0) {
              const newTransfers = [...state.transfers];
              newTransfers[existingIndex] = transfer;
              return { transfers: newTransfers };
            }
            return { transfers: [...state.transfers, transfer] };
          }),

        addTransfers: (newTransfers) =>
          set((state) => {
            const updatedTransfers = [...state.transfers];
            for (const transfer of newTransfers) {
              const existingIndex = updatedTransfers.findIndex((t) => t.id === transfer.id);
              if (existingIndex >= 0) {
                updatedTransfers[existingIndex] = transfer;
              } else {
                updatedTransfers.push(transfer);
              }
            }
            return { transfers: updatedTransfers };
          }),

        updateTransfer: (id, updates) =>
          set((state) => {
            const index = state.transfers.findIndex((t) => t.id === id);
            if (index < 0) {return state;}

            const newTransfers = [...state.transfers];
            const existing = newTransfers[index];
            // Guard check - if transfer doesn't exist, return unchanged state
            if (!existing) {return state;}

            // Explicitly merge to preserve required properties
            newTransfers[index] = {
              id: updates.id ?? existing.id,
              files: updates.files ?? existing.files,
              from: updates.from ?? existing.from,
              to: updates.to ?? existing.to,
              status: updates.status ?? existing.status,
              progress: updates.progress ?? existing.progress,
              speed: updates.speed ?? existing.speed,
              startTime: updates.startTime !== undefined ? updates.startTime : existing.startTime,
              endTime: updates.endTime !== undefined ? updates.endTime : existing.endTime,
              error: updates.error !== undefined ? updates.error : existing.error,
              direction: updates.direction ?? existing.direction,
              totalSize: updates.totalSize ?? existing.totalSize,
              transferredSize: updates.transferredSize ?? existing.transferredSize,
              eta: updates.eta !== undefined ? updates.eta : existing.eta,
              quality: updates.quality ?? existing.quality,
              encryptionMetadata: updates.encryptionMetadata !== undefined ? updates.encryptionMetadata : existing.encryptionMetadata,
            };
            return { transfers: newTransfers };
          }),

        updateTransferProgress: (id, progressValue, speed) =>
          set((state) => {
            const index = state.transfers.findIndex((t) => t.id === id);
            if (index < 0) {return state;}

            const newTransfers = [...state.transfers];
            const existing = newTransfers[index];
            // Guard check - if transfer doesn't exist, return unchanged state
            if (!existing) {return state;}

            newTransfers[index] = {
              ...existing,
              progress: progressValue,
              speed: speed !== undefined ? speed : existing.speed,
            };
            return { transfers: newTransfers };
          }),

        removeTransfer: (id) =>
          set((state) => ({
            transfers: state.transfers.filter((t) => t.id !== id),
          })),

        clearTransfers: () => set({ transfers: [] }),

        clearCompleted: () =>
          set((state) => ({
            transfers: state.transfers.filter(
              (t) => !['completed', 'failed', 'cancelled'].includes(t.status)
            ),
          })),

        // Optimistic Updates - return rollback function
        addTransferOptimistic: (transfer) => {
          const originalTransfers = [...get().transfers];
          set((state) => ({ transfers: [...state.transfers, transfer] }));
          // Return rollback function
          return () => set({ transfers: originalTransfers });
        },

        updateTransferOptimistic: (id, updates) => {
          const original = get().transfers.find((t) => t.id === id);
          if (!original) {return () => {};}

          const originalTransfer = { ...original };
          set((state) => ({
            transfers: state.transfers.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
          }));
          // Return rollback function
          return () =>
            set((state) => ({
              transfers: state.transfers.map((t) =>
                t.id === id ? originalTransfer : t
              ),
            }));
        },

        // Transfer Control
        pauseTransfer: (id) =>
          set((state) => ({
            transfers: state.transfers.map((t) =>
              t.id === id && t.status === 'transferring'
                ? { ...t, status: 'paused' as const }
                : t
            ),
          })),

        resumeTransfer: (id) =>
          set((state) => ({
            transfers: state.transfers.map((t) =>
              t.id === id && t.status === 'paused'
                ? { ...t, status: 'transferring' as const }
                : t
            ),
          })),

        cancelTransfer: (id) =>
          set((state) => ({
            transfers: state.transfers.map((t) =>
              t.id === id ? { ...t, status: 'cancelled' as const } : t
            ),
          })),

        retryTransfer: (id) =>
          set((state) => ({
            transfers: state.transfers.map((t) =>
              t.id === id && ['failed', 'cancelled'].includes(t.status)
                ? { ...t, status: 'pending' as const, progress: 0, error: null }
                : t
            ),
          })),

        pauseAll: () =>
          set((state) => ({
            transfers: state.transfers.map((t) =>
              t.status === 'transferring' ? { ...t, status: 'paused' as const } : t
            ),
          })),

        resumeAll: () =>
          set((state) => ({
            transfers: state.transfers.map((t) =>
              t.status === 'paused' ? { ...t, status: 'transferring' as const } : t
            ),
          })),

        // Queue
        addToQueue: (files) =>
          set((state) => ({ queue: [...state.queue, ...files] })),

        removeFromQueue: (index) =>
          set((state) => ({
            queue: state.queue.filter((_, i) => i !== index),
          })),

        clearQueue: () => set({ queue: [] }),

        // Progress
        setUploadProgress: (progress) =>
          set((state) => ({
            progress: {
              ...state.progress,
              uploadProgress: Math.min(100, Math.max(0, progress)),
            },
          })),

        setDownloadProgress: (progress) =>
          set((state) => ({
            progress: {
              ...state.progress,
              downloadProgress: Math.min(100, Math.max(0, progress)),
            },
          })),

        resetProgress: () =>
          set({
            progress: { uploadProgress: 0, downloadProgress: 0 },
          }),

        // Current Transfer
        setCurrentTransfer: (fileName, fileSize, fileType, peerId) =>
          set((state) => ({
            currentTransfer: {
              ...state.currentTransfer,
              fileName,
              fileSize,
              fileType,
              peerId,
            },
          })),

        setIsTransferring: (value) =>
          set((state) => ({
            currentTransfer: { ...state.currentTransfer, isTransferring: value },
          })),

        setIsReceiving: (value) =>
          set((state) => ({
            currentTransfer: { ...state.currentTransfer, isReceiving: value },
          })),

        clearCurrentTransfer: () =>
          set({
            currentTransfer: {
              fileName: null,
              fileSize: 0,
              fileType: '',
              peerId: null,
              isTransferring: false,
              isReceiving: false,
            },
          }),

        // Loading
        setLoading: (isLoading) => set({ isLoading }),
        setInitialized: () => set({ isInitialized: true }),

        // Selectors
        getTransferById: (id) => get().transfers.find((t) => t.id === id),

        getActiveTransfers: () =>
          get().transfers.filter((t) =>
            ['transferring', 'connecting', 'pending', 'paused'].includes(t.status)
          ),

        getCompletedTransfers: () =>
          get().transfers.filter((t) => t.status === 'completed'),

        getFailedTransfers: () =>
          get().transfers.filter((t) => ['failed', 'cancelled'].includes(t.status)),

        getStats: () => {
          const { transfers } = get();
          const active = transfers.filter((t) =>
            ['transferring', 'connecting', 'pending', 'paused'].includes(t.status)
          );
          const completed = transfers.filter((t) => t.status === 'completed');
          const failed = transfers.filter((t) =>
            ['failed', 'cancelled'].includes(t.status)
          );

          const totalSize = active.reduce((acc, t) => acc + t.totalSize, 0);
          const totalTransferred = active.reduce(
            (acc, t) => acc + (t.totalSize * t.progress) / 100,
            0
          );
          const speeds = active
            .filter((t) => t.speed && t.speed > 0)
            .map((t) => t.speed || 0);
          const averageSpeed =
            speeds.length > 0
              ? speeds.reduce((a, b) => a + b, 0) / speeds.length
              : 0;
          const estimatedTimeRemaining =
            averageSpeed > 0 ? (totalSize - totalTransferred) / averageSpeed : 0;

          return {
            totalActive: active.length,
            totalCompleted: completed.length,
            totalFailed: failed.length,
            totalSize,
            totalTransferred,
            averageSpeed,
            estimatedTimeRemaining,
          };
        },
      })
    ),
    { name: 'TransferStore' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectTransfers = (state: TransferStoreState) => state.transfers;
export const selectActiveTransfers = (state: TransferStoreState) =>
  state.transfers.filter((t) =>
    ['transferring', 'connecting', 'pending', 'paused'].includes(t.status)
  );
export const selectCompletedTransfers = (state: TransferStoreState) =>
  state.transfers.filter((t) =>
    ['completed', 'failed', 'cancelled'].includes(t.status)
  );
export const selectUploadProgress = (state: TransferStoreState) =>
  state.progress.uploadProgress;
export const selectDownloadProgress = (state: TransferStoreState) =>
  state.progress.downloadProgress;
export const selectIsTransferring = (state: TransferStoreState) =>
  state.currentTransfer.isTransferring;
export const selectIsReceiving = (state: TransferStoreState) =>
  state.currentTransfer.isReceiving;
export const selectQueue = (state: TransferStoreState) => state.queue;
export const selectQueueLength = (state: TransferStoreState) => state.queue.length;
export const selectHasActiveTransfers = (state: TransferStoreState) =>
  state.transfers.some((t) =>
    ['transferring', 'connecting', 'pending', 'paused'].includes(t.status)
  );
export const selectTotalSpeed = (state: TransferStoreState) =>
  state.transfers
    .filter((t) => t.status === 'transferring')
    .reduce((acc, t) => acc + (t.speed || 0), 0);
