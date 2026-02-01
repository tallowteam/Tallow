'use client';

/**
 * Resumable Transfer Manager
 * Handles interrupted transfer recovery with chunk tracking
 *
 * Features:
 * - Automatic state persistence
 * - Connection loss detection
 * - Resume protocol with chunk bitmap
 * - Chunk integrity verification
 * - Auto-resume capability
 * - Transfer expiration
 */

import { PQCTransferManager } from './pqc-transfer-manager';
import type { TransferMessage } from './pqc-transfer-manager';
import {
  createTransferState,
  getTransferState,
  updateTransferState,
  saveChunk,
  getAllChunks,
  getResumableTransfers,
  deleteTransfer,
  cleanupExpiredTransfers,
  exportChunkBitmap,
  importChunkBitmap,
  TransferMetadata,
} from '../storage/transfer-state-db';
import { isResumableFileMetadata, isChunkPayload } from '../types/messaging-types';
import secureLog from '../utils/secure-logger';

export interface ResumeRequestMessage {
  type: 'resume-request';
  payload: { transferId: string };
}

export interface ResumeResponseMessage {
  type: 'resume-response';
  payload: { transferId: string; chunkBitmap: string; canResume: boolean };
}

export interface ResumeChunkRequestMessage {
  type: 'resume-chunk-request';
  payload: { transferId: string; chunkIndices: number[] };
}

export interface ChunkMessage {
  type: 'chunk';
  payload: {
    index: number;
    data: number[];
    nonce: number[];
    hash: number[];
  };
}

export type ResumableTransferMessage =
  | TransferMessage
  | ResumeRequestMessage
  | ResumeResponseMessage
  | ResumeChunkRequestMessage
  | ChunkMessage;

export interface ResumeOptions {
  autoResume?: boolean; // Automatically resume on reconnect
  resumeTimeout?: number; // Max time to wait for resume (ms)
  maxResumeAttempts?: number; // Max resume attempts
}

const DEFAULT_RESUME_OPTIONS: ResumeOptions = {
  autoResume: true,
  resumeTimeout: 30000, // 30 seconds
  maxResumeAttempts: 3,
};

const CHUNK_SIZE = 64 * 1024; // 64KB chunks

/**
 * Extended PQC Transfer Manager with resume capability
 */
export class ResumablePQCTransferManager extends PQCTransferManager {
  private currentTransferId: string | null = null;
  private resumeOptions: ResumeOptions;
  private resumeAttempts: number = 0;
  private connectionLostCallback?: () => void;
  private resumeAvailableCallback?: (transferId: string, progress: number) => void;
  private isResuming: boolean = false;

  constructor(options: ResumeOptions = {}) {
    super();
    this.resumeOptions = { ...DEFAULT_RESUME_OPTIONS, ...options };

    // Run cleanup on initialization
    this.cleanupOldTransfers();
  }

  /**
   * Handle incoming message with resume protocol support
   */
  async handleIncomingMessage(data: string): Promise<boolean> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return false;
    }

    if (!this.isResumableMessage(parsed)) {
      // Fall back to base handler
      return super.handleIncomingMessage(data);
    }

    const message = parsed as ResumableTransferMessage;

    switch (message.type) {
      case 'resume-request':
        await this.handleResumeRequest(message.payload.transferId);
        return true;

      case 'resume-response':
        await this.handleResumeResponse(
          message.payload.transferId,
          message.payload.chunkBitmap,
          message.payload.canResume
        );
        return true;

      case 'resume-chunk-request':
        await this.handleResumeChunkRequest(
          message.payload.transferId,
          message.payload.chunkIndices
        );
        return true;

      case 'chunk':
        // Save chunk to IndexedDB for resume capability
        if (this.currentTransferId) {
          await this.saveReceivedChunk(message.payload);
        }
        return super.handleIncomingMessage(data);

      case 'file-metadata':
        // Create transfer state on metadata
        await this.createTransferStateFromMetadata(message.payload);
        return super.handleIncomingMessage(data);

      default:
        return super.handleIncomingMessage(data);
    }
  }

  /**
   * Send file with resume support
   */
  async sendFile(file: File, relativePath?: string): Promise<void> {
    const session = this.getSessionInfo();
    if (!session || !session.sessionKeys) {
      throw new Error('Session not ready for transfer');
    }

    // Generate transfer ID
    this.currentTransferId = this.generateTransferId();

    // Create transfer state
    const fileHash = await this.hashFile(file);
    await createTransferState(
      this.currentTransferId,
      file.name,
      file.type,
      file.size,
      fileHash,
      CHUNK_SIZE,
      'peer', // TODO: Get actual peer ID
      'send',
      session.sessionKeys
    );

    try {
      // Delegate to base implementation
      await super.sendFile(file, relativePath);

      // Mark as completed
      await updateTransferState({
        transferId: this.currentTransferId,
        status: 'completed',
      });
    } catch (error) {
      // Mark as failed and save state for potential resume
      await updateTransferState({
        transferId: this.currentTransferId,
        status: 'paused',
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Resume a paused transfer
   */
  async resumeTransfer(transferId: string): Promise<void> {
    this.isResuming = true;
    this.resumeAttempts++;

    secureLog.log(`Resuming transfer ${transferId} (attempt ${this.resumeAttempts})`);

    if (this.resumeAttempts > (this.resumeOptions.maxResumeAttempts || 3)) {
      throw new Error('Max resume attempts exceeded');
    }

    const metadata = await getTransferState(transferId);
    if (!metadata) {
      throw new Error('Transfer not found');
    }

    if (metadata.status === 'completed') {
      throw new Error('Transfer already completed');
    }

    this.currentTransferId = transferId;

    // Send resume request to peer
    this.sendResumeRequest(transferId);

    // Wait for resume response
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Resume request timeout'));
      }, this.resumeOptions.resumeTimeout || 30000);

      // Store resolver for resume response
      this.resumeAvailableCallback = (id, progress) => {
        clearTimeout(timeout);
        if (id === transferId) {
          secureLog.log(`Resume available: ${progress.toFixed(1)}% complete`);
          resolve(undefined);
        }
      };
    });

    this.isResuming = false;
  }

  /**
   * Get all resumable transfers
   */
  async getResumableTransfers(): Promise<TransferMetadata[]> {
    return getResumableTransfers();
  }

  /**
   * Delete a transfer
   */
  async deleteTransfer(transferId: string): Promise<void> {
    await deleteTransfer(transferId);
  }

  /**
   * Handle connection lost
   */
  onConnectionLost(callback: () => void): void {
    this.connectionLostCallback = callback;
  }

  /**
   * Handle resume available
   */
  onResumeAvailable(callback: (transferId: string, progress: number) => void): void {
    this.resumeAvailableCallback = callback;
  }

  /**
   * Detect connection state and auto-save
   */
  protected detectConnectionLoss(): void {
    if (this.currentTransferId && !this.isResuming) {
      secureLog.log('Connection lost during transfer, saving state');

      // Mark as paused
      updateTransferState({
        transferId: this.currentTransferId,
        status: 'paused',
      });

      this.connectionLostCallback?.();
    }
  }

  // Private methods

  private isResumableMessage(data: unknown): data is ResumableTransferMessage {
    if (!data || typeof data !== 'object') {return false;}
    const msg = data as Record<string, unknown>;

    return (
      typeof msg['type'] === 'string' &&
      ['resume-request', 'resume-response', 'resume-chunk-request'].includes(msg['type'] as string)
    );
  }

  private async createTransferStateFromMetadata(metadata: unknown): Promise<void> {
    if (!isResumableFileMetadata(metadata)) {
      throw new Error('Invalid metadata format');
    }

    const session = this.getSessionInfo();
    if (!session || !session.sessionKeys) {
      throw new Error('Session not ready');
    }

    this.currentTransferId = this.generateTransferId();

    await createTransferState(
      this.currentTransferId,
      metadata.originalName,
      metadata.mimeCategory,
      metadata.originalSize,
      new Uint8Array(metadata.fileHash),
      CHUNK_SIZE,
      'peer', // TODO: Get actual peer ID
      'receive',
      session.sessionKeys,
      metadata.encryptedName,
      metadata.nameNonce ? new Uint8Array(metadata.nameNonce) : undefined,
      metadata.encryptedPath,
      metadata.pathNonce ? new Uint8Array(metadata.pathNonce) : undefined
    );

    secureLog.log(`Transfer state created: ${this.currentTransferId}`);
  }

  private async saveReceivedChunk(chunkPayload: unknown): Promise<void> {
    if (!this.currentTransferId) {return;}

    if (!isChunkPayload(chunkPayload)) {
      throw new Error('Invalid chunk payload format');
    }

    const chunk = {
      index: chunkPayload.index,
      data: new Uint8Array(chunkPayload.data),
      nonce: new Uint8Array(chunkPayload.nonce),
      hash: new Uint8Array(chunkPayload.hash),
    };

    await saveChunk(
      this.currentTransferId,
      chunk.index,
      chunk.data.buffer,
      chunk.nonce,
      chunk.hash
    );

    secureLog.log(`Chunk ${chunk.index} saved to IndexedDB`);
  }

  private sendResumeRequest(transferId: string): void {
    const message: ResumeRequestMessage = {
      type: 'resume-request',
      payload: { transferId },
    };
    this.sendResumableMessage(message);

    secureLog.log(`Resume request sent for ${transferId}`);
  }

  private async handleResumeRequest(transferId: string): Promise<void> {
    const metadata = await getTransferState(transferId);

    if (!metadata) {
      // Transfer not found, cannot resume
      const notFoundResponse: ResumeResponseMessage = {
        type: 'resume-response',
        payload: {
          transferId,
          chunkBitmap: '',
          canResume: false,
        },
      };
      this.sendResumableMessage(notFoundResponse);
      return;
    }

    // Send chunk bitmap to requester
    const bitmapHex = exportChunkBitmap(metadata.chunkBitmap);

    const response: ResumeResponseMessage = {
      type: 'resume-response',
      payload: {
        transferId,
        chunkBitmap: bitmapHex,
        canResume: true,
      },
    };
    this.sendResumableMessage(response);

    secureLog.log(`Resume response sent: ${metadata.receivedChunks}/${metadata.totalChunks} chunks`);
  }

  private async handleResumeResponse(
    transferId: string,
    chunkBitmapHex: string,
    canResume: boolean
  ): Promise<void> {
    if (!canResume) {
      secureLog.error('Peer cannot resume transfer');
      return;
    }

    // Import peer's chunk bitmap
    const peerBitmap = importChunkBitmap(chunkBitmapHex);

    // Calculate missing chunks
    const metadata = await getTransferState(transferId);
    if (!metadata) {
      secureLog.error('Transfer not found for resume');
      return;
    }

    const missing: number[] = [];
    for (let i = 0; i < metadata.totalChunks; i++) {
      const byteIndex = Math.floor(i / 8);
      const bitIndex = i % 8;
      const byte = peerBitmap[byteIndex];
      const peerHas = byte !== undefined && (byte & (1 << bitIndex)) !== 0;

      if (!peerHas) {
        missing.push(i);
      }
    }

    secureLog.log(`Resuming transfer: ${missing.length} missing chunks`);

    // Request missing chunks
    const chunkRequest: ResumeChunkRequestMessage = {
      type: 'resume-chunk-request',
      payload: {
        transferId,
        chunkIndices: missing,
      },
    };
    this.sendResumableMessage(chunkRequest);

    const progress = ((metadata.totalChunks - missing.length) / metadata.totalChunks) * 100;
    this.resumeAvailableCallback?.(transferId, progress);
  }

  private async handleResumeChunkRequest(
    transferId: string,
    chunkIndices: number[]
  ): Promise<void> {
    const metadata = await getTransferState(transferId);
    if (!metadata) {
      secureLog.error('Transfer not found for chunk request');
      return;
    }

    // Retrieve and send requested chunks
    for (const index of chunkIndices) {
      const chunks = await getAllChunks(transferId);
      const chunk = chunks.find(c => c.chunkIndex === index);

      if (chunk) {
        const chunkMessage: ChunkMessage = {
          type: 'chunk',
          payload: {
            index: chunk.chunkIndex,
            data: Array.from(new Uint8Array(chunk.data)),
            nonce: Array.from(chunk.nonce),
            hash: Array.from(chunk.hash),
          },
        };
        this.sendResumableMessage(chunkMessage);

        secureLog.log(`Resent chunk ${index} to peer`);
      }
    }
  }

  private generateTransferId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async hashFile(file: File): Promise<Uint8Array> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hashBuffer);
  }

  private async cleanupOldTransfers(): Promise<void> {
    try {
      const deleted = await cleanupExpiredTransfers();
      if (deleted > 0) {
        secureLog.log(`Cleaned up ${deleted} expired transfers`);
      }
    } catch (e) {
      secureLog.error('Failed to cleanup expired transfers:', e);
    }
  }

  private sendResumableMessage(message: ResumableTransferMessage): void {
    // Use parent's protected sendMessage method
    // Cast to TransferMessage since the structure is compatible
    this.sendMessage(message as TransferMessage);
  }

  /**
   * Override destroy to save state before cleanup
   */
  destroy(): void {
    if (this.currentTransferId) {
      updateTransferState({
        transferId: this.currentTransferId,
        status: 'paused',
      });
    }

    super.destroy();
  }
}

export default ResumablePQCTransferManager;
