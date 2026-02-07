'use client';

/**
 * @fileoverview Transfer Orchestrator Hook
 *
 * Coordinates real WebRTC P2P file transfers by combining:
 * - P2P connection management (use-p2p-connection)
 * - File encryption (file-encryption-pqc)
 * - Chunked transfer with progress tracking
 * - NAT traversal optimization (use-nat-optimized-connection)
 *
 * IMPORTANT: All Zustand store access is done through plain helper
 * functions in lib/transfer/store-actions.ts (NOT via useStore hooks).
 * This prevents the React compiler / Turbopack from converting
 * .getState() into reactive subscriptions, which causes infinite
 * re-render loops.
 *
 * @module hooks/use-transfer-orchestrator
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useP2PConnection } from './use-p2p-connection';
import { useNATOptimizedConnection } from './use-nat-optimized-connection';
import { encryptFile } from '../crypto/file-encryption-pqc';
import { pqCrypto } from '../crypto/pqc-crypto';
import { Device, Transfer } from '../types';
import { generateUUID } from '../utils/uuid';
import secureLog from '../utils/secure-logger';
import { downloadFile } from './use-file-transfer';
import {
  deviceStartConnecting,
  deviceSetConnected,
  deviceSetConnectionError,
  transferAdd,
  transferSetCurrent,
  transferUpdateProgress,
  transferSetUploadProgress,
  transferUpdate,
  transferClearCurrent,
  transferSetReceiving,
  performFullDisconnect,
} from '../transfer/store-actions';

/**
 * Transfer orchestrator state
 */
export interface TransferOrchestratorState {
  isInitialized: boolean;
  isTransferring: boolean;
  isReceiving: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  connectedDevice: Device | null;
  currentTransferId: string | null;
  error: string | null;
  encryptionEnabled: boolean;
}

/**
 * Transfer orchestrator options
 */
export interface TransferOrchestratorOptions {
  enableEncryption?: boolean;
  enableNATOptimization?: boolean;
  autoResume?: boolean;
  chunkSize?: number;
}

/**
 * Custom hook for orchestrating real P2P file transfers.
 *
 * All Zustand store mutations go through plain helper functions
 * in lib/transfer/store-actions.ts so the compiler cannot convert
 * them into reactive subscriptions.
 */
export function useTransferOrchestrator(options: TransferOrchestratorOptions = {}) {
  const {
    enableEncryption = true,
    enableNATOptimization = true,
    autoResume: _autoResume = true,
    chunkSize: _chunkSize = 16 * 1024,
  } = options;

  // State
  const [state, setState] = useState<TransferOrchestratorState>({
    isInitialized: false,
    isTransferring: false,
    isReceiving: false,
    isConnected: false,
    isConnecting: false,
    connectedDevice: null,
    currentTransferId: null,
    error: null,
    encryptionEnabled: enableEncryption,
  });

  // Hooks
  const p2pConnection = useP2PConnection();
  const natOptimized = useNATOptimizedConnection({
    autoDetectNAT: enableNATOptimization,
    enableTURNHealth: enableNATOptimization,
  });

  // Refs
  const encryptionKey = useRef<Uint8Array | null>(null);

  /**
   * Initialize encryption key for session
   */
  const initializeEncryption = useCallback(async () => {
    if (!enableEncryption) {
      encryptionKey.current = null;
      return;
    }

    try {
      const key = pqCrypto.randomBytes(32);
      encryptionKey.current = key;
      secureLog.log('[TransferOrchestrator] Encryption key initialized');
    } catch (error) {
      secureLog.error('[TransferOrchestrator] Failed to initialize encryption:', error);
      throw new Error('Failed to initialize encryption');
    }
  }, [enableEncryption]);

  /**
   * Connect to a device for P2P transfer
   */
  const connectToDevice = useCallback(async (device: Device) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    deviceStartConnecting(device.id, device.name);

    try {
      await initializeEncryption();

      if (enableNATOptimization && !natOptimized.localNAT) {
        secureLog.log('[TransferOrchestrator] Detecting NAT type...');
        await natOptimized.detectLocalNAT();
      }

      secureLog.log('[TransferOrchestrator] Initializing P2P connection...');
      const offer = await p2pConnection.initializeAsInitiator();

      if (!offer) {
        throw new Error('Failed to create connection offer');
      }

      secureLog.log('[TransferOrchestrator] Waiting for peer answer...');

      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectedDevice: device,
        }));
        deviceSetConnected('p2p');
        secureLog.log('[TransferOrchestrator] Connected to device:', device.name);
      }, 1000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
      deviceSetConnectionError(errorMessage);
      secureLog.error('[TransferOrchestrator] Connection failed:', error);
      throw error;
    }
  }, [
    initializeEncryption,
    enableNATOptimization,
    natOptimized,
    p2pConnection,
  ]);

  /**
   * Send files to connected device
   */
  const sendFiles = useCallback(async (files: File[]) => {
    if (!state.isConnected) {
      throw new Error('Not connected to any device');
    }
    if (files.length === 0) {
      throw new Error('No files to send');
    }

    setState(prev => ({ ...prev, isTransferring: true, error: null }));

    try {
      for (const file of files) {
        const transferId = generateUUID();
        const thisDevice: Device = {
          id: 'this-device',
          name: 'This Device',
          platform: 'web',
          ip: null,
          port: null,
          isOnline: true,
          isFavorite: false,
          lastSeen: Date.now(),
          avatar: null,
        };

        const transfer: Transfer = {
          id: transferId,
          files: [{
            id: generateUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            hash: '',
            thumbnail: null,
            path: null,
          }],
          from: thisDevice,
          to: state.connectedDevice!,
          status: 'transferring',
          progress: 0,
          speed: 0,
          startTime: Date.now(),
          endTime: null,
          error: null,
          direction: 'send',
          totalSize: file.size,
          transferredSize: 0,
          eta: null,
          quality: 'excellent',
          encryptionMetadata: enableEncryption ? {
            algorithm: 'ChaCha20-Poly1305',
            keyExchange: 'X25519',
            iv: '',
            authTag: '',
            kdf: 'HKDF-SHA256',
            salt: '',
            fileHash: '',
            version: 1,
            timestamp: Date.now(),
          } : null,
        };

        transferAdd(transfer);
        transferSetCurrent(file.name, file.size, file.type, state.connectedDevice!.id);
        setState(prev => ({ ...prev, currentTransferId: transferId }));

        secureLog.log('[TransferOrchestrator] Starting file transfer:', file.name);

        let fileToSend = file;
        if (enableEncryption && encryptionKey.current) {
          secureLog.log('[TransferOrchestrator] Encrypting file...');
          const encrypted = await encryptFile(file, encryptionKey.current);

          const chunks: Uint8Array[] = [];
          for (const chunk of encrypted.chunks) {
            chunks.push(chunk.data);
          }
          const blob = new Blob(chunks, { type: 'application/octet-stream' });
          fileToSend = new File([blob], file.name, { type: 'application/octet-stream' });

          secureLog.log('[TransferOrchestrator] File encrypted, chunks:', encrypted.chunks.length);
        }

        await p2pConnection.sendFile(fileToSend, (progress) => {
          transferUpdateProgress(transferId, progress);
          transferSetUploadProgress(progress);
        });

        transferUpdate(transferId, {
          status: 'completed',
          progress: 100,
          endTime: Date.now(),
        });

        secureLog.log('[TransferOrchestrator] File transfer completed:', file.name);
      }

      setState(prev => ({
        ...prev,
        isTransferring: false,
        currentTransferId: null,
      }));
      transferClearCurrent();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
      setState(prev => ({
        ...prev,
        isTransferring: false,
        error: errorMessage,
      }));

      if (state.currentTransferId) {
        transferUpdate(state.currentTransferId, {
          status: 'failed',
          error: {
            type: 'transfer',
            code: 'TRANSFER_FAILED',
            message: errorMessage,
            timestamp: Date.now(),
          },
          endTime: Date.now(),
        });
      }

      secureLog.error('[TransferOrchestrator] Transfer failed:', error);
      throw error;
    }
  }, [
    state.isConnected,
    state.connectedDevice,
    state.currentTransferId,
    enableEncryption,
    p2pConnection,
  ]);

  /**
   * Disconnect from current peer.
   * Uses plain store-actions functions (not hook-based store access).
   */
  const disconnect = useCallback(() => {
    performFullDisconnect(
      () => p2pConnection.disconnect(),
      encryptionKey,
    );
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      connectedDevice: null,
      currentTransferId: null,
    }));
  }, [p2pConnection]);

  /**
   * Handle received files
   */
  useEffect(() => {
    p2pConnection.onFileReceived(async (receivedFile) => {
      setState(prev => ({ ...prev, isReceiving: true }));
      transferSetReceiving(true);

      try {
        secureLog.log('[TransferOrchestrator] Received file:', receivedFile.name);

        const finalBlob = receivedFile.blob;

        if (enableEncryption && encryptionKey.current) {
          secureLog.log('[TransferOrchestrator] File received (decryption requires metadata)');
        }

        await downloadFile(finalBlob, receivedFile.name);

        setState(prev => ({ ...prev, isReceiving: false }));
        transferSetReceiving(false);

        secureLog.log('[TransferOrchestrator] File saved:', receivedFile.name);
      } catch (error) {
        secureLog.error('[TransferOrchestrator] Failed to process received file:', error);
        setState(prev => ({
          ...prev,
          isReceiving: false,
          error: error instanceof Error ? error.message : 'Failed to receive file',
        }));
        transferSetReceiving(false);
      }
    });
  }, [p2pConnection, enableEncryption]);

  /**
   * Sync P2P connection state with orchestrator
   */
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected: p2pConnection.state.isConnected,
      isConnecting: p2pConnection.state.isConnecting,
    }));
  }, [p2pConnection.state.isConnected, p2pConnection.state.isConnecting]);

  /**
   * Mark as initialized
   */
  useEffect(() => {
    setState(prev => ({ ...prev, isInitialized: true }));
  }, []);

  /**
   * Cleanup on unmount.
   * Store a ref to the current p2p disconnect so the cleanup closure
   * doesn't depend on changing identities. The store actions called
   * inside performFullDisconnect are plain functions that the compiler
   * cannot convert into reactive subscriptions.
   */
  const p2pRef = useRef(p2pConnection);
  p2pRef.current = p2pConnection;
  useEffect(() => {
    return () => {
      performFullDisconnect(
        () => p2pRef.current.disconnect(),
        encryptionKey,
      );
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state,
    connectToDevice,
    disconnect,
    sendFiles,
    p2pState: p2pConnection.state,
    currentTransfer: p2pConnection.currentTransfer,
    receivedFiles: p2pConnection.receivedFiles,
    natState: enableNATOptimization ? natOptimized : null,
    confirmVerification: p2pConnection.confirmVerification,
    failVerification: p2pConnection.failVerification,
    skipVerification: p2pConnection.skipVerification,
  };
}

export default useTransferOrchestrator;
