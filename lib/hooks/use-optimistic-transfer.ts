'use client';

/**
 * useOptimisticTransfer Hook
 * React 19 useOptimistic for instant UI updates during transfers
 */

import { useOptimistic, useCallback, useTransition } from 'react';
import { Transfer } from '@/lib/types';

export interface OptimisticTransferState {
  transfers: Transfer[];
  isPending: boolean;
}

export type TransferAction =
  | { type: 'add'; transfer: Transfer }
  | { type: 'update'; id: string; updates: Partial<Transfer> }
  | { type: 'remove'; id: string }
  | { type: 'pause'; id: string }
  | { type: 'resume'; id: string }
  | { type: 'cancel'; id: string };

/**
 * Optimistic transfer state reducer
 */
function optimisticReducer(
  state: Transfer[],
  action: TransferAction
): Transfer[] {
  switch (action.type) {
    case 'add':
      return [...state, action.transfer];

    case 'update':
      return state.map((t) =>
        t.id === action.id ? { ...t, ...action.updates } : t
      );

    case 'remove':
      return state.filter((t) => t.id !== action.id);

    case 'pause':
      return state.map((t) =>
        t.id === action.id ? { ...t, status: 'paused' as const } : t
      );

    case 'resume':
      return state.map((t) =>
        t.id === action.id ? { ...t, status: 'transferring' as const } : t
      );

    case 'cancel':
      return state.map((t) =>
        t.id === action.id ? { ...t, status: 'cancelled' as const } : t
      );

    default:
      return state;
  }
}

/**
 * Hook for optimistic transfer updates
 * Provides instant UI feedback while async operations complete
 */
export function useOptimisticTransfer(initialTransfers: Transfer[]) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTransfers, updateOptimisticTransfers] = useOptimistic(
    initialTransfers,
    optimisticReducer
  );

  /**
   * Add transfer with optimistic update
   */
  const addTransferOptimistic = useCallback(
    async (transfer: Transfer, onAdd: (transfer: Transfer) => Promise<void>) => {
      startTransition(async () => {
        updateOptimisticTransfers({ type: 'add', transfer });
      });

      try {
        await onAdd(transfer);
      } catch (error) {
        console.error('Failed to add transfer:', error);
        // Transfer will be reverted automatically on re-render
      }
    },
    [updateOptimisticTransfers]
  );

  /**
   * Update transfer with optimistic update
   */
  const updateTransferOptimistic = useCallback(
    async (
      id: string,
      updates: Partial<Transfer>,
      onUpdate: (id: string, updates: Partial<Transfer>) => Promise<void>
    ) => {
      startTransition(async () => {
        updateOptimisticTransfers({ type: 'update', id, updates });
      });

      try {
        await onUpdate(id, updates);
      } catch (error) {
        console.error('Failed to update transfer:', error);
      }
    },
    [updateOptimisticTransfers]
  );

  /**
   * Remove transfer with optimistic update
   */
  const removeTransferOptimistic = useCallback(
    async (id: string, onRemove: (id: string) => Promise<void>) => {
      startTransition(async () => {
        updateOptimisticTransfers({ type: 'remove', id });
      });

      try {
        await onRemove(id);
      } catch (error) {
        console.error('Failed to remove transfer:', error);
      }
    },
    [updateOptimisticTransfers]
  );

  /**
   * Pause transfer with optimistic update
   */
  const pauseTransferOptimistic = useCallback(
    async (id: string, onPause: (id: string) => Promise<void>) => {
      startTransition(async () => {
        updateOptimisticTransfers({ type: 'pause', id });
      });

      try {
        await onPause(id);
      } catch (error) {
        console.error('Failed to pause transfer:', error);
      }
    },
    [updateOptimisticTransfers]
  );

  /**
   * Resume transfer with optimistic update
   */
  const resumeTransferOptimistic = useCallback(
    async (id: string, onResume: (id: string) => Promise<void>) => {
      startTransition(async () => {
        updateOptimisticTransfers({ type: 'resume', id });
      });

      try {
        await onResume(id);
      } catch (error) {
        console.error('Failed to resume transfer:', error);
      }
    },
    [updateOptimisticTransfers]
  );

  /**
   * Cancel transfer with optimistic update
   */
  const cancelTransferOptimistic = useCallback(
    async (id: string, onCancel: (id: string) => Promise<void>) => {
      startTransition(async () => {
        updateOptimisticTransfers({ type: 'cancel', id });
      });

      try {
        await onCancel(id);
      } catch (error) {
        console.error('Failed to cancel transfer:', error);
      }
    },
    [updateOptimisticTransfers]
  );

  return {
    transfers: optimisticTransfers,
    isPending,
    addTransferOptimistic,
    updateTransferOptimistic,
    removeTransferOptimistic,
    pauseTransferOptimistic,
    resumeTransferOptimistic,
    cancelTransferOptimistic,
  };
}

export default useOptimisticTransfer;
