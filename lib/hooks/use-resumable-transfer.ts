'use client';

/**
 * React Hook for Resumable Transfers
 * Provides UI-friendly interface for resumable transfer functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ResumablePQCTransferManager, ResumeOptions } from '../transfer/resumable-transfer';
import { getResumableTransfers, getTransferStats } from '../storage/transfer-state-db';
import { toast } from 'sonner';
import secureLog from '../utils/secure-logger';

export interface ResumableTransferState {
  isNegotiating: boolean;
  isTransferring: boolean;
  isResuming: boolean;
  progress: number;
  error: string | null;
  sessionReady: boolean;
  connectionLost: boolean;
  currentTransferId: string | null;
}

export interface ResumableTransferItem {
  transferId: string;
  fileName: string;
  fileSize: number;
  progress: number;
  receivedChunks: number;
  totalChunks: number;
  lastUpdated: Date;
  canResume: boolean;
}

export interface UseResumableTransferOptions extends ResumeOptions {
  onTransferComplete?: (blob: Blob, filename: string, relativePath?: string) => void;
  onError?: (error: Error) => void;
  onConnectionLost?: () => void;
  onResumeAvailable?: (transferId: string, progress: number) => void;
}

export function useResumableTransfer(options: UseResumableTransferOptions = {}) {
  const [state, setState] = useState<ResumableTransferState>({
    isNegotiating: false,
    isTransferring: false,
    isResuming: false,
    progress: 0,
    error: null,
    sessionReady: false,
    connectionLost: false,
    currentTransferId: null,
  });

  const [resumableTransfers, setResumableTransfers] = useState<ResumableTransferItem[]>([]);
  const [autoResumeEnabled, setAutoResumeEnabled] = useState<boolean>(
    options.autoResume ?? true
  );
  const [autoResumeCountdown, setAutoResumeCountdown] = useState<number>(0);

  const managerRef = useRef<ResumablePQCTransferManager | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const autoResumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs for callbacks to avoid stale closures
  const onTransferCompleteRef = useRef(options.onTransferComplete);
  const onErrorRef = useRef(options.onError);
  const onConnectionLostRef = useRef(options.onConnectionLost);
  const onResumeAvailableRef = useRef(options.onResumeAvailable);

  useEffect(() => {
    onTransferCompleteRef.current = options.onTransferComplete;
    onErrorRef.current = options.onError;
    onConnectionLostRef.current = options.onConnectionLost;
    onResumeAvailableRef.current = options.onResumeAvailable;
  }, [
    options.onTransferComplete,
    options.onError,
    options.onConnectionLost,
    options.onResumeAvailable,
  ]);

  /**
   * Load resumable transfers on mount
   */
  useEffect(() => {
    loadResumableTransfers();
  }, []);

  /**
   * Load resumable transfers from IndexedDB
   */
  const loadResumableTransfers = useCallback(async () => {
    try {
      const transfers = await getResumableTransfers();
      const items: ResumableTransferItem[] = [];

      for (const transfer of transfers) {
        const stats = await getTransferStats(transfer.transferId);
        items.push({
          transferId: transfer.transferId,
          fileName: transfer.fileName,
          fileSize: transfer.fileSize,
          progress: stats.progress,
          receivedChunks: stats.receivedChunks,
          totalChunks: stats.totalChunks,
          lastUpdated: transfer.lastUpdated,
          canResume: stats.missingChunks > 0,
        });
      }

      setResumableTransfers(items);
    } catch (error) {
      secureLog.error('Failed to load resumable transfers:', error);
    }
  }, []);

  /**
   * Initialize as sender
   */
  const initializeSender = useCallback(async () => {
    if (managerRef.current) {
      managerRef.current.destroy();
      managerRef.current = null;
    }

    setState((prev) => ({ ...prev, isNegotiating: true, error: null }));

    try {
      const manager = new ResumablePQCTransferManager({
        autoResume: autoResumeEnabled,
        ...options,
      });

      await manager.initializeSession('send');

      // Setup callbacks
      manager.onProgress((progress) => {
        setState((prev) => ({ ...prev, progress }));
      });

      manager.onError((error) => {
        setState((prev) => ({ ...prev, error: error.message, isTransferring: false }));
        onErrorRef.current?.(error);
      });

      manager.onConnectionLost(() => {
        setState((prev) => ({ ...prev, connectionLost: true }));
        onConnectionLostRef.current?.();
        handleConnectionLost();
      });

      manager.onResumeAvailable((transferId, progress) => {
        onResumeAvailableRef.current?.(transferId, progress);
        toast.info('Resume available', {
          description: `Transfer ${progress.toFixed(1)}% complete`,
        });
      });

      managerRef.current = manager;

      const publicKey = manager.getPublicKey();
      const publicKeyHex = Array.from(publicKey)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      toast.success('Session initialized', {
        description: 'Ready to send files',
      });

      return publicKeyHex;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: (error as Error).message,
        isNegotiating: false,
      }));
      throw error;
    }
  }, [autoResumeEnabled, options]);

  /**
   * Initialize as receiver
   */
  const initializeReceiver = useCallback(async () => {
    if (managerRef.current) {
      managerRef.current.destroy();
      managerRef.current = null;
    }

    setState((prev) => ({ ...prev, isNegotiating: true, error: null }));

    try {
      const manager = new ResumablePQCTransferManager({
        autoResume: autoResumeEnabled,
        ...options,
      });

      await manager.initializeSession('receive');

      // Setup callbacks
      manager.onProgress((progress) => {
        setState((prev) => ({ ...prev, progress }));
      });

      manager.onComplete((blob, filename, relativePath) => {
        setState((prev) => ({
          ...prev,
          isTransferring: false,
          progress: 100,
        }));

        onTransferCompleteRef.current?.(blob, filename, relativePath);

        toast.success('File received successfully!', {
          description: filename,
        });

        loadResumableTransfers();
      });

      manager.onError((error) => {
        setState((prev) => ({ ...prev, error: error.message, isTransferring: false }));
        onErrorRef.current?.(error);
      });

      manager.onConnectionLost(() => {
        setState((prev) => ({ ...prev, connectionLost: true }));
        onConnectionLostRef.current?.();
        handleConnectionLost();
      });

      manager.onResumeAvailable((transferId, progress) => {
        onResumeAvailableRef.current?.(transferId, progress);
        toast.info('Resume available', {
          description: `Transfer ${progress.toFixed(1)}% complete`,
        });
      });

      managerRef.current = manager;

      const publicKey = manager.getPublicKey();
      const publicKeyHex = Array.from(publicKey)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      toast.success('Receiver initialized', {
        description: 'Ready to receive files',
      });

      return publicKeyHex;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: (error as Error).message,
        isNegotiating: false,
      }));
      throw error;
    }
  }, [autoResumeEnabled, options, loadResumableTransfers]);

  /**
   * Set peer's public key
   */
  const setPeerPublicKey = useCallback(async (publicKeyHex: string) => {
    if (!managerRef.current) {
      throw new Error('Manager not initialized');
    }

    try {
      const publicKey = new Uint8Array(
        publicKeyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      );

      await managerRef.current.setPeerPublicKey(publicKey);

      setState((prev) => ({
        ...prev,
        sessionReady: true,
        isNegotiating: false,
      }));

      toast.success('Key exchange complete', {
        description: 'Session is ready for transfer',
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: (error as Error).message,
        isNegotiating: false,
      }));
      throw error;
    }
  }, []);

  /**
   * Set WebRTC data channel
   */
  const setDataChannel = useCallback((dataChannel: RTCDataChannel) => {
    if (!managerRef.current) {
      throw new Error('Manager not initialized');
    }

    dataChannelRef.current = dataChannel;
    managerRef.current.setDataChannel(dataChannel);

    // Monitor connection state
    dataChannel.addEventListener('close', () => {
      setState((prev) => ({ ...prev, connectionLost: true }));
      handleConnectionLost();
    });

    toast.info('Data channel connected');
  }, []);

  /**
   * Send file
   */
  const sendFile = useCallback(async (file: File, relativePath?: string) => {
    if (!managerRef.current) {
      throw new Error('Manager not initialized');
    }

    if (!state.sessionReady) {
      throw new Error('Session not ready - exchange keys first');
    }

    if (state.isTransferring) {
      throw new Error('Transfer already in progress');
    }

    setState((prev) => ({ ...prev, isTransferring: true, progress: 0, error: null }));

    try {
      await managerRef.current.sendFile(file, relativePath);

      setState((prev) => ({
        ...prev,
        isTransferring: false,
        progress: 100,
      }));

      toast.success('File sent successfully!');
      loadResumableTransfers();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: (error as Error).message,
        isTransferring: false,
      }));
      throw error;
    }
  }, [state.sessionReady, state.isTransferring, loadResumableTransfers]);

  /**
   * Resume a transfer
   */
  const resumeTransfer = useCallback(async (transferId: string) => {
    if (!managerRef.current) {
      throw new Error('Manager not initialized');
    }

    setState((prev) => ({
      ...prev,
      isResuming: true,
      error: null,
      currentTransferId: transferId,
    }));

    toast.info('Resuming transfer...', {
      description: 'Requesting missing chunks from peer',
    });

    try {
      await managerRef.current.resumeTransfer(transferId);

      setState((prev) => ({
        ...prev,
        isResuming: false,
        isTransferring: true,
      }));

      toast.success('Transfer resumed', {
        description: 'Receiving missing chunks',
      });

      loadResumableTransfers();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: (error as Error).message,
        isResuming: false,
      }));

      toast.error('Failed to resume transfer', {
        description: (error as Error).message,
      });

      throw error;
    }
  }, [loadResumableTransfers]);

  /**
   * Delete a resumable transfer
   */
  const deleteResumableTransfer = useCallback(async (transferId: string) => {
    if (!managerRef.current) {
      throw new Error('Manager not initialized');
    }

    try {
      await managerRef.current.deleteTransfer(transferId);
      toast.success('Transfer deleted');
      loadResumableTransfers();
    } catch (error) {
      toast.error('Failed to delete transfer');
      throw error;
    }
  }, [loadResumableTransfers]);

  /**
   * Handle connection lost
   */
  const handleConnectionLost = useCallback(() => {
    setState((prev) => ({ ...prev, connectionLost: true }));

    toast.error('Connection lost', {
      description: 'Transfer paused. You can resume when reconnected.',
      duration: 10000,
    });

    loadResumableTransfers();

    // Auto-resume countdown if enabled
    if (autoResumeEnabled && state.currentTransferId) {
      let countdown = 10;
      setAutoResumeCountdown(countdown);

      autoResumeTimerRef.current = setInterval(() => {
        countdown--;
        setAutoResumeCountdown(countdown);

        if (countdown <= 0) {
          if (autoResumeTimerRef.current) {
            clearInterval(autoResumeTimerRef.current);
          }
          // Attempt auto-resume
          if (state.currentTransferId) {
            resumeTransfer(state.currentTransferId);
          }
        }
      }, 1000);
    }
  }, [autoResumeEnabled, state.currentTransferId, loadResumableTransfers, resumeTransfer]);

  /**
   * Cancel auto-resume countdown
   */
  const cancelAutoResume = useCallback(() => {
    if (autoResumeTimerRef.current) {
      clearInterval(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    setAutoResumeCountdown(0);
  }, []);

  /**
   * Toggle auto-resume setting
   */
  const toggleAutoResume = useCallback((enabled: boolean) => {
    setAutoResumeEnabled(enabled);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('tallow_auto_resume_enabled', String(enabled));
    }

    toast.success(`Auto-resume ${enabled ? 'enabled' : 'disabled'}`);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    // Load auto-resume setting
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tallow_auto_resume_enabled');
      if (saved !== null) {
        setAutoResumeEnabled(saved === 'true');
      }
    }

    return () => {
      managerRef.current?.destroy();
      dataChannelRef.current?.close();
      if (autoResumeTimerRef.current) {
        clearInterval(autoResumeTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    ...state,
    resumableTransfers,
    autoResumeEnabled,
    autoResumeCountdown,

    // Actions
    initializeSender,
    initializeReceiver,
    setPeerPublicKey,
    setDataChannel,
    sendFile,
    resumeTransfer,
    deleteResumableTransfer,
    loadResumableTransfers,
    cancelAutoResume,
    toggleAutoResume,

    // Utils
    getSessionInfo: () => managerRef.current?.getSessionInfo(),
  };
}

export default useResumableTransfer;
