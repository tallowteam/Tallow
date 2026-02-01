'use client';

/**
 * Enhanced React Hook for Group File Transfers
 * Manages state and lifecycle for multi-recipient transfers with improved UX
 *
 * Features:
 * - Enhanced toast notifications for all transfer events
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
import { toast } from '../utils/toast';
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
 * Hook for managing group file transfers with enhanced UX
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
  const loadingToastRef = useRef<string | number | null>(null);

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

      // Show initializing toast
      const initToastId = toast.loading('Initializing group transfer...', {
        description: `Preparing to send to ${recipients.length} recipients`,
      });

      try {
        // Store recipient names for callbacks
        recipients.forEach((info) => {
          recipientNamesRef.current.set(info.id, info.name);
        });

        // Reset tracking
        completedRecipientsRef.current.clear();
        failedRecipientsRef.current.clear();

        // Create manager with enhanced callbacks
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

            // Show success toast
            toast.success(`Transfer completed`, {
              description: `Successfully sent to ${recipientName}`,
              duration: 3000,
            });
          },
          onRecipientError: (recipientId, error) => {
            const recipientName = recipientNamesRef.current.get(recipientId) || recipientId;

            // Track failure
            failedRecipientsRef.current.add(recipientId);

            // Call user callback
            options.onRecipientError?.(recipientId, recipientName, error.message);

            // Show error toast
            toast.error(`Transfer failed`, {
              description: `Failed to send to ${recipientName}: ${error.message}`,
              persist: false,
              duration: 5000,
            });
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

            // Dismiss loading toast if exists
            if (loadingToastRef.current) {
              toast.dismiss(loadingToastRef.current);
              loadingToastRef.current = null;
            }

            // Show comprehensive summary toast
            if (result.successfulRecipients.length === result.totalRecipients) {
              toast.success('Group transfer completed successfully!', {
                description: `All ${result.totalRecipients} recipients received the file`,
                duration: 5000,
              });
            } else if (result.successfulRecipients.length > 0) {
              toast.warning('Group transfer partially completed', {
                description: `${result.successfulRecipients.length} of ${result.totalRecipients} transfers succeeded. ${result.failedRecipients.length} failed.`,
                duration: 6000,
              });
            } else {
              toast.error('Group transfer failed', {
                description: 'All transfers failed. Please check your connection and try again.',
                persist: true,
              });
            }
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

        // Dismiss init toast and show success
        toast.dismiss(initToastId);
        toast.success('Group transfer initialized', {
          description: `Ready to send ${fileName} to ${recipients.length} recipients`,
          duration: 3000,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isInitializing: false,
          error: (error as Error).message,
        }));

        // Dismiss init toast and show error
        toast.dismiss(initToastId);
        toast.error('Failed to initialize group transfer', {
          description: (error as Error).message,
          persist: true,
        });

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

    // Show persistent loading toast
    loadingToastRef.current = toast.loading('Sending file to all recipients...', {
      description: 'This may take a while depending on file size and network speed',
    });

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

      // Dismiss loading toast
      if (loadingToastRef.current) {
        toast.dismiss(loadingToastRef.current);
        loadingToastRef.current = null;
      }

      // Show error toast
      toast.error('Group transfer failed', {
        description: (error as Error).message,
        persist: true,
      });

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

    // Dismiss loading toast
    if (loadingToastRef.current) {
      toast.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isTransferring: false,
      groupState: null,
    }));

    toast.info('Group transfer cancelled', {
      description: 'All transfers have been stopped',
      duration: 3000,
    });
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

    // Dismiss any toasts
    if (loadingToastRef.current) {
      toast.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
    }

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
      if (loadingToastRef.current) {
        toast.dismiss(loadingToastRef.current);
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
