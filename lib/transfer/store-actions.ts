/**
 * Transfer Store Actions — Plain TypeScript Module
 *
 * Wraps all Zustand store access for the transfer system in plain
 * functions that live OUTSIDE React hooks. This prevents the React
 * compiler / Turbopack from transforming .getState() calls into
 * reactive subscriptions.
 *
 * Also exposes SyncCoordinator actions so that hooks and components
 * can drive the transfer lifecycle without touching the coordinator
 * class directly (which would risk Turbopack transformation).
 */

import { useDeviceStore } from '@/lib/stores/device-store';
import { useTransferStore } from '@/lib/stores/transfer-store';
import type { Transfer } from '@/lib/types';
import secureLog from '@/lib/utils/secure-logger';
import {
  getSyncCoordinator,
  type CoordinatorPhase,
  type BitmapExchangeMessage,
  type BitmapResponseMessage,
  type DeltaNegotiationMessage,
  type DeltaDecisionMessage,
} from './sync-coordinator';
import type { TransferDirection } from './state-machine';
import type { TransferMetadata } from '@/lib/storage/transfer-state-db';
import type { FilePatch, DeltaResult } from './delta-sync';

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

// ============================================================================
// SYNC COORDINATOR ACTIONS (Agent 029)
//
// These functions wrap the SyncCoordinator singleton so that hooks can
// call them without importing the class directly. All Zustand .getState()
// calls happen in this plain module, safe from Turbopack transforms.
// ============================================================================

/**
 * Begin a new coordinated transfer.
 */
export async function coordinatorBeginTransfer(params: {
  transferId: string;
  direction: TransferDirection;
  fileName: string;
  fileSize: number;
  fileHash: Uint8Array;
  chunkSize: number;
  totalChunks: number;
  peerId: string;
  peerName: string;
}): Promise<void> {
  const coordinator = getSyncCoordinator();
  await coordinator.beginTransfer(params);
}

/**
 * Mark transfer as actively transferring.
 */
export function coordinatorStartTransferring(transferId: string): void {
  getSyncCoordinator().startTransferring(transferId);
}

/**
 * Record a received chunk with integrity verification.
 */
export async function coordinatorRecordChunk(params: {
  transferId: string;
  chunkIndex: number;
  chunkData: ArrayBuffer;
  nonce: Uint8Array;
  hash: Uint8Array;
}): Promise<boolean> {
  return getSyncCoordinator().recordChunk(params);
}

/**
 * Handle connection drop -- persist state and transition to PAUSED.
 */
export async function coordinatorHandleConnectionDrop(transferId: string): Promise<void> {
  await getSyncCoordinator().handleConnectionDrop(transferId);
}

/**
 * Prepare reconnect: build bitmap exchange message for peer.
 */
export async function coordinatorPrepareReconnect(
  transferId: string,
): Promise<BitmapExchangeMessage | null> {
  return getSyncCoordinator().prepareReconnect(transferId);
}

/**
 * Process a bitmap exchange message from the peer.
 */
export function coordinatorProcessPeerBitmap(
  message: BitmapExchangeMessage,
): BitmapResponseMessage {
  return getSyncCoordinator().processPeerBitmap(message);
}

/**
 * Handle bitmap response from peer (list of chunks to resend).
 */
export async function coordinatorHandleBitmapResponse(
  response: BitmapResponseMessage,
): Promise<number[]> {
  return getSyncCoordinator().handleBitmapResponse(response);
}

/**
 * Complete a transfer.
 */
export async function coordinatorCompleteTransfer(transferId: string): Promise<void> {
  await getSyncCoordinator().completeTransfer(transferId);
}

/**
 * Fail a transfer with an error message.
 */
export async function coordinatorFailTransfer(transferId: string, error: string): Promise<void> {
  await getSyncCoordinator().failTransfer(transferId, error);
}

/**
 * Retry a failed transfer.
 */
export async function coordinatorRetryTransfer(transferId: string): Promise<boolean> {
  return getSyncCoordinator().retryTransfer(transferId);
}

/**
 * Pause a transfer (user-initiated).
 */
export async function coordinatorPauseTransfer(transferId: string): Promise<void> {
  await getSyncCoordinator().pauseTransfer(transferId);
}

/**
 * Cancel a transfer.
 */
export async function coordinatorCancelTransfer(
  transferId: string,
  cleanup = false,
): Promise<void> {
  await getSyncCoordinator().cancelTransfer(transferId, cleanup);
}

/**
 * Check if delta sync should be used for a file.
 */
export function coordinatorShouldUseDeltaSync(
  fileSize: number,
  fileName: string,
): boolean {
  return getSyncCoordinator().shouldUseDeltaSync(fileSize, fileName);
}

/**
 * Initiate delta sync negotiation.
 */
export async function coordinatorInitiateDeltaSync(
  fileId: string,
  file: File,
): Promise<DeltaNegotiationMessage> {
  return getSyncCoordinator().initiateDeltaSync(fileId, file);
}

/**
 * Handle delta negotiation from peer.
 */
export async function coordinatorHandleDeltaNegotiation(
  message: DeltaNegotiationMessage,
  localFile: File | null,
): Promise<{
  decision: DeltaDecisionMessage;
  patch: FilePatch | null;
  delta: DeltaResult | null;
}> {
  return getSyncCoordinator().handleDeltaNegotiation(message, localFile);
}

/**
 * Get the current coordinator phase.
 */
export function coordinatorGetPhase(): CoordinatorPhase {
  return getSyncCoordinator().getPhase();
}

/**
 * Subscribe to coordinator phase changes.
 */
export function coordinatorOnPhaseChange(
  observer: (phase: CoordinatorPhase) => void,
): () => void {
  return getSyncCoordinator().onPhaseChange(observer);
}

/**
 * Get all resumable transfers from IndexedDB.
 */
export async function coordinatorGetResumableTransfers(): Promise<TransferMetadata[]> {
  return getSyncCoordinator().getResumableTransfers();
}

/**
 * Reset the coordinator to idle state.
 */
export function coordinatorReset(): void {
  getSyncCoordinator().reset();
}
