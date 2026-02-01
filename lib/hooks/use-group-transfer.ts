'use client';

/**
 * Enhanced React Hook for Group File Transfers
 * Manages state and lifecycle for multi-recipient transfers
 *
 * Features:
 * - Real-time progress tracking
 * - Detailed error reporting
 * - Success/failure summaries
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GroupTransferManager,
  RecipientInfo,
  GroupTransferState,
  GroupTransferResult,
} from '../transfer/group-transfer-manager';
import secureLog from '../utils/secure-logger';

export interface GroupTransferHookState {
  isInitializing: boolean;
  isTransferring: boolean;
  isCompleted: boolean;
  groupState: GroupTransferState | null;
  result: GroupTransferResult | null;
  error: string | null;
}

export interface UseGroupTransferOptions {
  bandwidthLimitPerRecipient?: number;
  onRecipientComplete?: (recipientId: string, recipientName: string) => void;
  onRecipientError?: (recipientId: string, recipientName: string, error: string) => void;
  onComplete?: (result: GroupTransferResult) => void;
}

/**
 * Hook for managing group file transfers
 */
export function useGroupTransfer(options: UseGroupTransferOptions = {}) {
  const [state, setState] = useState<GroupTransferHookState>({
    isInitializing: false,
    isTransferring: false,
    isCompleted: false,
    groupState: null,
    result: null,
    error: null,
  });

  const managerRef = useRef<GroupTransferManager | null>(null);
  const recipientNamesRef = useRef<Map<string, string>>(new Map());
  const completedRecipientsRef = useRef<Set<string>>(new Set());
  const failedRecipientsRef = useRef<Set<string>>(new Set());

  /**
   * Initialize group transfer
   */
  const initializeGroupTransfer = useCallback(
    async (
      transferId: string,
      fileName: string,
      fileSize: number,
      recipients: RecipientInfo[]
    ) => {
      setState((prev) => ({
        ...prev,
        isInitializing: true,
        error: null,
      }));

      try {
        // Store recipient names for callbacks
        recipients.forEach((info) => {
          recipientNamesRef.current.set(info.id, info.name);
        });

        // Reset tracking
        completedRecipientsRef.current.clear();
        failedRecipientsRef.current.clear();

        // Create manager with callbacks
        const manager = new GroupTransferManager({
          ...(options.bandwidthLimitPerRecipient !== undefined ? { bandwidthLimitPerRecipient: options.bandwidthLimitPerRecipient } : {}),
          onRecipientProgress: (recipientId, progress, _speed) => {
            secureLog.log(`[GroupTransfer] Recipient ${recipientId} progress: ${progress}%`);
          },
          onRecipientComplete: (recipientId) => {
            const recipientName = recipientNamesRef.current.get(recipientId) || recipientId;

            // Track completion
            completedRecipientsRef.current.add(recipientId);

            // Call user callback
            options.onRecipientComplete?.(recipientId, recipientName);

            secureLog.log(`[GroupTransfer] Transfer completed to ${recipientName}`);
          },
          onRecipientError: (recipientId, error) => {
            const recipientName = recipientNamesRef.current.get(recipientId) || recipientId;

            // Track failure
            failedRecipientsRef.current.add(recipientId);

            // Call user callback
            options.onRecipientError?.(recipientId, recipientName, error.message);

            secureLog.error(`[GroupTransfer] Transfer failed to ${recipientName}:`, error.message);
          },
          onOverallProgress: (progress) => {
            // Update overall progress
            setState((prev) => {
              if (!prev.groupState) {return prev;}
              return {
                ...prev,
                groupState: {
                  ...prev.groupState,
                  totalProgress: progress,
                },
              };
            });
          },
          onComplete: (result) => {
            options.onComplete?.(result);
            secureLog.log(`[GroupTransfer] Complete: ${result.successfulRecipients.length}/${result.totalRecipients} succeeded`);
          },
        });

        // Initialize (the new API combines initialization and key exchange)
        await manager.initializeGroupTransfer(transferId, fileName, fileSize, recipients);

        managerRef.current = manager;

        setState((prev) => ({
          ...prev,
          isInitializing: false,
          groupState: manager.getState(),
        }));

        secureLog.log(`[GroupTransfer] Initialized for ${fileName} to ${recipients.length} recipients`);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isInitializing: false,
          error: (error as Error).message,
        }));

        secureLog.error('[GroupTransfer] Initialization failed:', error);

        throw error;
      }
    },
    [options]
  );

  /**
   * Send file to all recipients
   */
  const sendToAll = useCallback(async (file: File) => {
    if (!managerRef.current) {
      throw new Error('Group transfer not initialized');
    }

    setState((prev) => ({
      ...prev,
      isTransferring: true,
      error: null,
    }));

    try {
      const result = await managerRef.current.sendToAll(file);

      setState((prev) => ({
        ...prev,
        isTransferring: false,
        isCompleted: true,
        result,
        groupState: managerRef.current!.getState(),
      }));

      return result;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isTransferring: false,
        error: (error as Error).message,
      }));

      secureLog.error('[GroupTransfer] Send failed:', error);

      throw error;
    }
  }, []);

  /**
   * Cancel group transfer
   */
  const cancel = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.cancel();
      managerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isTransferring: false,
      groupState: null,
    }));

    secureLog.log('[GroupTransfer] Cancelled');
  }, []);

  /**
   * Reset state for new transfer
   */
  const reset = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.destroy();
      managerRef.current = null;
    }

    // Clear all tracking
    recipientNamesRef.current.clear();
    completedRecipientsRef.current.clear();
    failedRecipientsRef.current.clear();

    setState({
      isInitializing: false,
      isTransferring: false,
      isCompleted: false,
      groupState: null,
      result: null,
      error: null,
    });
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
      }
    };
  }, []);

  /**
   * Poll for state updates during transfer
   */
  useEffect(() => {
    if (!state.isTransferring || !managerRef.current) {return;}

    const interval = setInterval(() => {
      if (managerRef.current) {
        const currentState = managerRef.current.getState();
        setState((prev) => ({
          ...prev,
          groupState: currentState,
        }));
      }
    }, 200); // Update every 200ms

    return () => clearInterval(interval);
  }, [state.isTransferring]);

  return {
    // State
    ...state,

    // Actions
    initializeGroupTransfer,
    sendToAll,
    cancel,
    reset,

    // Utilities
    getRecipientName: (recipientId: string) =>
      recipientNamesRef.current.get(recipientId) || recipientId,

    // Statistics
    completedCount: completedRecipientsRef.current.size,
    failedCount: failedRecipientsRef.current.size,
  };
}
