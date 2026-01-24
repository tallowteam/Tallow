'use client';

/**
 * React Hook for Post-Quantum File Transfers
 * Drop-in replacement for existing transfer logic
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { PQCTransferManager } from '../transfer/pqc-transfer-manager';
import { toast } from 'sonner';

export interface UsePQCTransferOptions {
  onTransferComplete?: (blob: Blob, filename: string) => void;
  onError?: (error: Error) => void;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024 * 1024; // 4GB

export interface TransferState {
  isNegotiating: boolean;
  isTransferring: boolean;
  progress: number;
  error: string | null;
  sessionReady: boolean;
}

export function usePQCTransfer(options: UsePQCTransferOptions = {}) {
  const [state, setState] = useState<TransferState>({
    isNegotiating: false,
    isTransferring: false,
    progress: 0,
    error: null,
    sessionReady: false,
  });

  const managerRef = useRef<PQCTransferManager | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Use refs for callbacks to avoid stale closures in dependency arrays
  const onTransferCompleteRef = useRef(options.onTransferComplete);
  const onErrorRef = useRef(options.onError);
  useEffect(() => {
    onTransferCompleteRef.current = options.onTransferComplete;
    onErrorRef.current = options.onError;
  }, [options.onTransferComplete, options.onError]);

  /**
   * Initialize as sender
   */
  const initializeSender = useCallback(async () => {
    // Destroy previous manager if any
    if (managerRef.current) {
      managerRef.current.destroy();
      managerRef.current = null;
    }

    setState((prev) => ({ ...prev, isNegotiating: true, error: null }));

    try {
      const manager = new PQCTransferManager();
      await manager.initializeSession('send');

      // Setup callbacks
      manager.onProgress((progress) => {
        setState((prev) => ({ ...prev, progress }));
      });

      manager.onError((error) => {
        setState((prev) => ({ ...prev, error: error.message, isTransferring: false }));
        onErrorRef.current?.(error);
      });

      managerRef.current = manager;

      // Return public key for sharing
      const publicKey = manager.getPublicKey();
      const publicKeyHex = Array.from(publicKey)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      toast.success('Session initialized', {
        description: 'Share your public key with the receiver',
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
  }, []);

  /**
   * Initialize as receiver
   */
  const initializeReceiver = useCallback(async () => {
    // Destroy previous manager if any
    if (managerRef.current) {
      managerRef.current.destroy();
      managerRef.current = null;
    }

    setState((prev) => ({ ...prev, isNegotiating: true, error: null }));

    try {
      const manager = new PQCTransferManager();
      await manager.initializeSession('receive');

      // Setup callbacks
      manager.onProgress((progress) => {
        setState((prev) => ({ ...prev, progress }));
      });

      manager.onComplete((blob, filename) => {
        setState((prev) => ({
          ...prev,
          isTransferring: false,
          progress: 100,
        }));

        onTransferCompleteRef.current?.(blob, filename);

        toast.success('File received successfully!', {
          description: filename,
        });
      });

      manager.onError((error) => {
        setState((prev) => ({ ...prev, error: error.message, isTransferring: false }));
        onErrorRef.current?.(error);
      });

      managerRef.current = manager;

      // Return public key
      const publicKey = manager.getPublicKey();
      const publicKeyHex = Array.from(publicKey)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      toast.success('Receiver initialized', {
        description: 'Share your public key with the sender',
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
  }, []);

  /**
   * Set peer's public key
   */
  const setPeerPublicKey = useCallback(async (publicKeyHex: string) => {
    if (!managerRef.current) {
      throw new Error('Manager not initialized');
    }

    try {
      // Convert hex to bytes
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

    toast.info('Data channel connected');
  }, []);

  /**
   * Send file
   */
  const sendFile = useCallback(async (file: File) => {
    if (!managerRef.current) {
      throw new Error('Manager not initialized');
    }

    if (!state.sessionReady) {
      throw new Error('Session not ready - exchange keys first');
    }

    if (state.isTransferring) {
      throw new Error('Transfer already in progress');
    }

    if (file.size === 0) {
      throw new Error('Cannot send empty file');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large (max 4GB)');
    }

    setState((prev) => ({ ...prev, isTransferring: true, progress: 0, error: null }));

    try {
      await managerRef.current.sendFile(file);

      setState((prev) => ({
        ...prev,
        isTransferring: false,
        progress: 100,
      }));

      toast.success('File sent successfully!');
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: (error as Error).message,
        isTransferring: false,
      }));
      throw error;
    }
  }, [state.sessionReady, state.isTransferring]);

  /**
   * Cleanup
   */
  useEffect(() => {
    return () => {
      managerRef.current?.destroy();
      dataChannelRef.current?.close();
    };
  }, []);

  return {
    // State
    ...state,

    // Actions
    initializeSender,
    initializeReceiver,
    setPeerPublicKey,
    setDataChannel,
    sendFile,

    // Utils
    getSessionInfo: () => managerRef.current?.getSessionInfo(),
  };
}
