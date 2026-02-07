/**
 * Transfer Store Actions — Plain TypeScript Module
 *
 * Wraps all Zustand store access for the transfer system in plain
 * functions that live OUTSIDE React hooks. This prevents the React
 * compiler / Turbopack from transforming .getState() calls into
 * reactive subscriptions.
 */

import { useDeviceStore } from '@/lib/stores/device-store';
import { useTransferStore } from '@/lib/stores/transfer-store';
import type { Transfer } from '@/lib/types';
import secureLog from '@/lib/utils/secure-logger';

// ============================================================================
// DEVICE STORE ACTIONS
// ============================================================================

export function deviceStartConnecting(peerId: string, peerName: string): void {
  useDeviceStore.getState().startConnecting(peerId, peerName);
}

export function deviceSetConnected(type: 'p2p' | 'relay'): void {
  useDeviceStore.getState().setConnected(type);
}

export function deviceSetConnectionError(error: string): void {
  useDeviceStore.getState().setConnectionError(error);
}

export function deviceDisconnect(): void {
  useDeviceStore.getState().disconnect();
}

// ============================================================================
// TRANSFER STORE ACTIONS
// ============================================================================

export function transferAdd(transfer: Transfer): void {
  useTransferStore.getState().addTransfer(transfer);
}

export function transferSetCurrent(
  fileName: string,
  fileSize: number,
  fileType: string,
  deviceId: string,
): void {
  useTransferStore.getState().setCurrentTransfer(fileName, fileSize, fileType, deviceId);
}

export function transferUpdateProgress(transferId: string, progress: number): void {
  useTransferStore.getState().updateTransferProgress(transferId, progress);
}

export function transferSetUploadProgress(progress: number): void {
  useTransferStore.getState().setUploadProgress(progress);
}

export function transferUpdate(transferId: string, updates: Partial<Transfer>): void {
  useTransferStore.getState().updateTransfer(transferId, updates);
}

export function transferClearCurrent(): void {
  useTransferStore.getState().clearCurrentTransfer();
}

export function transferSetReceiving(isReceiving: boolean): void {
  useTransferStore.getState().setIsReceiving(isReceiving);
}

// ============================================================================
// COMBINED ACTIONS
// ============================================================================

/**
 * Full disconnect cleanup — call from effect cleanup or disconnect handler.
 * Wipes encryption key, disconnects P2P, and resets both stores.
 */
export function performFullDisconnect(
  p2pDisconnect: () => void,
  encryptionKey: { current: Uint8Array | null },
): void {
  p2pDisconnect();
  deviceDisconnect();
  transferClearCurrent();

  if (encryptionKey.current) {
    encryptionKey.current.fill(0);
    encryptionKey.current = null;
  }

  secureLog.log('[TransferOrchestrator] Disconnected');
}
