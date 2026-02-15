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
import { PQCTransferManager } from '../transfer/pqc-transfer-manager';
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
  pqcSessionReady: boolean;
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

export interface UseTransferOrchestratorReturn {
  state: TransferOrchestratorState;
  connectToDevice: (device: Device) => Promise<void>;
  disconnect: () => void;
  sendFiles: (files: File[]) => Promise<void>;
  p2pState: ReturnType<typeof useP2PConnection>['state'];
  currentTransfer: ReturnType<typeof useP2PConnection>['currentTransfer'];
  receivedFiles: ReturnType<typeof useP2PConnection>['receivedFiles'];
  natState: ReturnType<typeof useNATOptimizedConnection> | null;
  confirmVerification: ReturnType<typeof useP2PConnection>['confirmVerification'];
  failVerification: ReturnType<typeof useP2PConnection>['failVerification'];
  skipVerification: ReturnType<typeof useP2PConnection>['skipVerification'];
}

/**
 * Custom hook for orchestrating real P2P file transfers.
 *
 * All Zustand store mutations go through plain helper functions
 * in lib/transfer/store-actions.ts so the compiler cannot convert
 * them into reactive subscriptions.
 */
export function useTransferOrchestrator(
  options: TransferOrchestratorOptions = {}
): UseTransferOrchestratorReturn {
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
    pqcSessionReady: false,
  });

  // Hooks
  const p2pConnection = useP2PConnection();
  const natOptimized = useNATOptimizedConnection({
    autoDetectNAT: enableNATOptimization,
    enableTURNHealth: enableNATOptimization,
  });

  // Refs
  const encryptionKey = useRef<Uint8Array | null>(null);
  const pqcManagerRef = useRef<PQCTransferManager | null>(null);
  const pqcHandshakeStartedRef = useRef(false);
  const currentTransferIdRef = useRef<string | null>(null);

  const parsePQCMessageType = useCallback((raw: string): string | null => {
    try {
      const parsed = JSON.parse(raw) as { type?: unknown };
      return typeof parsed.type === 'string' ? parsed.type : null;
    } catch {
      return null;
    }
  }, []);

  const resetPQCState = useCallback(() => {
    pqcManagerRef.current?.destroy();
    pqcManagerRef.current = null;
    pqcHandshakeStartedRef.current = false;
    currentTransferIdRef.current = null;
    setState((prev) => ({ ...prev, pqcSessionReady: false }));
  }, []);

  /**
   * Initialize or reuse PQC transfer manager
   */
  const ensurePQCManager = useCallback(async (): Promise<PQCTransferManager> => {
    if (pqcManagerRef.current) {
      if (p2pConnection.dataChannel) {
        pqcManagerRef.current.setDataChannel(p2pConnection.dataChannel);
      }
      return pqcManagerRef.current;
    }

    const manager = new PQCTransferManager();
    await manager.initializeSession('send');

    manager.onSessionReady(() => {
      setState((prev) => ({ ...prev, pqcSessionReady: true }));
    });

    manager.onProgress((progress) => {
      const transferId = currentTransferIdRef.current;
      if (transferId) {
        transferUpdateProgress(transferId, progress);
        transferSetUploadProgress(progress);
      }
    });

    manager.onComplete((blob, filename) => {
      void (async () => {
        setState((prev) => ({ ...prev, isReceiving: true }));
        transferSetReceiving(true);

        try {
          await downloadFile(blob, filename);
          setState((prev) => ({ ...prev, isReceiving: false }));
        } catch (error) {
          setState((prev) => ({
            ...prev,
            isReceiving: false,
            error: error instanceof Error ? error.message : 'Failed to receive file',
          }));
        } finally {
          transferSetReceiving(false);
        }
      })();
    });

    manager.onError((error) => {
      setState((prev) => ({
        ...prev,
        error: error.message,
        isTransferring: false,
      }));
    });

    if (p2pConnection.dataChannel) {
      manager.setDataChannel(p2pConnection.dataChannel);
    }

    pqcManagerRef.current = manager;
    return manager;
  }, [p2pConnection.dataChannel]);

  /**
   * Wait until PQC key exchange completes
   */
  const waitForPQCSessionReady = useCallback(async (timeoutMs = 15000) => {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      if (pqcManagerRef.current?.isReady()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 75));
    }

    throw new Error('PQC key exchange did not complete in time');
  }, []);

  /**
   * Ensure PQC handshake is active before sending file payloads
   */
  const ensurePQCHandshake = useCallback(async () => {
    const manager = await ensurePQCManager();

    if (!p2pConnection.dataChannel || p2pConnection.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not ready for PQC transfer');
    }

    manager.setDataChannel(p2pConnection.dataChannel);

    if (manager.isReady()) {
      return manager;
    }

    if (!pqcHandshakeStartedRef.current) {
      manager.startKeyExchange();
      pqcHandshakeStartedRef.current = true;
    }

    await waitForPQCSessionReady();
    return manager;
  }, [ensurePQCManager, p2pConnection.dataChannel, waitForPQCSessionReady]);

  /**
   * Connect to a device for P2P transfer
   */
  const connectToDevice = useCallback(async (device: Device) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    deviceStartConnecting(device.id, device.name);

    try {
      resetPQCState();

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
          pqcSessionReady: false,
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
    resetPQCState,
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
      const pqcManager = await ensurePQCHandshake();

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
            algorithm: 'AES-256-GCM',
            keyExchange: 'Hybrid',
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
        currentTransferIdRef.current = transferId;
        setState(prev => ({ ...prev, currentTransferId: transferId }));

        secureLog.log('[TransferOrchestrator] Starting PQC file transfer:', file.name);
        await pqcManager.sendFile(file);

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
      currentTransferIdRef.current = null;
      transferClearCurrent();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
      setState(prev => ({
        ...prev,
        isTransferring: false,
        error: errorMessage,
        currentTransferId: null,
      }));

      const activeTransferId = currentTransferIdRef.current;
      if (activeTransferId) {
        transferUpdate(activeTransferId, {
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
      currentTransferIdRef.current = null;

      secureLog.error('[TransferOrchestrator] Transfer failed:', error);
      throw error;
    }
  }, [
    state.isConnected,
    state.connectedDevice,
    ensurePQCHandshake,
    enableEncryption,
  ]);

  /**
   * Disconnect from current peer.
   * Uses plain store-actions functions (not hook-based store access).
   */
  const disconnect = useCallback(() => {
    resetPQCState();
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
  }, [p2pConnection, resetPQCState]);

  /**
   * Route PQC protocol messages to the transfer manager.
   */
  useEffect(() => {
    p2pConnection.onMessage((payload) => {
      if (typeof payload !== 'string') {
        return;
      }

      const messageType = parsePQCMessageType(payload);
      if (!messageType) {
        return;
      }

      const pqcTypes = new Set([
        'public-key',
        'key-exchange',
        'key-rotation',
        'file-metadata',
        'chunk',
        'ack',
        'error',
        'complete',
      ]);

      if (!pqcTypes.has(messageType)) {
        return;
      }

      void (async () => {
        try {
          const manager = await ensurePQCManager();

          if (p2pConnection.dataChannel) {
            manager.setDataChannel(p2pConnection.dataChannel);
          }

          if (messageType === 'public-key' && !pqcHandshakeStartedRef.current) {
            manager.startKeyExchange();
            pqcHandshakeStartedRef.current = true;
          }

          await manager.handleIncomingMessage(payload);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'PQC message handling failed';
          setState((prev) => ({ ...prev, error: message }));
          secureLog.error('[TransferOrchestrator] PQC message handling failed:', error);
        }
      })();
    });
  }, [ensurePQCManager, p2pConnection, parsePQCMessageType]);

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
  }, [p2pConnection]);

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
      pqcManagerRef.current?.destroy();
      pqcManagerRef.current = null;
      currentTransferIdRef.current = null;
      performFullDisconnect(
        () => p2pRef.current.disconnect(),
        encryptionKey,
      );
    };
  }, []);  

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
