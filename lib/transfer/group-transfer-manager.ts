'use client';

/**
 * Group Transfer Manager
 * Manages simultaneous file transfers to multiple recipients
 *
 * Architecture:
 * - 1-to-many WebRTC connections (sender maintains N peer connections)
 * - Each recipient gets independent PQCTransferManager with ML-KEM-768 + X25519
 * - Parallel transfer with independent progress tracking
 * - Graceful handling of individual connection failures
 * - Bandwidth management across all peers
 * - Uses DataChannelManager for WebRTC connection management
 */

import { PQCTransferManager, TransferStatus } from './pqc-transfer-manager';
import { DataChannelManager, DataChannelManagerConfig } from '../webrtc/data-channel';
import { getSignalingClient } from '../signaling/socket-signaling';
import secureLog from '../utils/secure-logger';
import { generateUUID } from '../utils/uuid';
import type { ConnectionQuality, AppError } from '../types/shared';
import { createNetworkError, createTransferError, toAppError } from '../utils/error-handling';
import { z } from 'zod';
import { isGroupAnswerMessage, isGroupICECandidateMessage } from '../types/messaging-types';
import { recordTransfer, recordError } from '../monitoring/metrics';

// Input validation schema for recipient information
const RecipientInfoSchema = z.object({
  id: z.string().uuid('Invalid recipient ID format'),
  name: z.string()
    .min(1, 'Recipient name cannot be empty')
    .max(100, 'Recipient name too long')
    .regex(/^[a-zA-Z0-9 _-]+$/, 'Recipient name contains invalid characters'),
  deviceId: z.string()
    .min(1, 'Device ID cannot be empty')
    .max(50, 'Device ID too long'),
  socketId: z.string()
    .min(1, 'Socket ID cannot be empty')
    .max(100, 'Socket ID too long'),
});

export interface RecipientInfo {
  id: string;
  name: string;
  deviceId: string;
  socketId: string; // Socket.IO socket ID for signaling
}

export interface GroupTransferRecipient extends RecipientInfo {
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  manager: PQCTransferManager;
  status: TransferStatus;
  progress: number;
  error: AppError | null;
  speed: number; // bytes per second
  startTime: number | null;
  endTime: number | null;
  connectionQuality: ConnectionQuality;
}

export interface GroupTransferState {
  transferId: string;
  fileName: string;
  fileSize: number;
  recipients: GroupTransferRecipient[];
  totalProgress: number; // aggregate progress (0-100)
  successCount: number;
  failureCount: number;
  pendingCount: number;
  status: 'preparing' | 'transferring' | 'completed' | 'partial' | 'failed';
  bandwidthLimit: number | null; // bytes per second per recipient
}

export interface GroupTransferOptions {
  bandwidthLimitPerRecipient?: number; // bytes per second
  onRecipientProgress?: (recipientId: string, progress: number, speed: number) => void;
  onRecipientComplete?: (recipientId: string) => void;
  onRecipientError?: (recipientId: string, error: Error) => void;
  onOverallProgress?: (progress: number) => void;
  onComplete?: (results: GroupTransferResult) => void;
}

export interface GroupTransferResult {
  transferId: string;
  fileName: string;
  totalRecipients: number;
  successfulRecipients: string[];
  failedRecipients: Array<{ id: string; error: AppError }>;
  totalTime: number; // milliseconds
}

/**
 * Group Transfer Manager
 * Orchestrates parallel transfers to multiple recipients
 */
export class GroupTransferManager {
  private state: GroupTransferState | null = null;
  private options: GroupTransferOptions;
  private transferStartTime: number = 0;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private dataChannelManager: DataChannelManager | null = null;
  private signalingClient = getSignalingClient();
  private groupId: string;

  constructor(options: GroupTransferOptions = {}) {
    this.options = options;
    this.groupId = generateUUID();
  }

  /**
   * Initialize group transfer session with WebRTC data channels
   */
  async initializeGroupTransfer(
    transferId: string,
    fileName: string,
    fileSize: number,
    recipients: RecipientInfo[]
  ): Promise<void> {
    secureLog.log(`[GroupTransfer] Initializing group transfer: ${fileName} to ${recipients.length} recipients`);

    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients provided');
    }

    if (recipients.length > 10) {
      throw new Error('Maximum 10 recipients allowed for group transfers');
    }

    // VALIDATE ALL RECIPIENTS FIRST - prevents XSS, DoS, and memory exhaustion attacks
    const validatedRecipients: RecipientInfo[] = [];
    for (const info of recipients) {
      try {
        const validated = RecipientInfoSchema.parse(info);
        validatedRecipients.push(validated as RecipientInfo);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          throw createTransferError(
            'TRANSFER_FAILED',
            `Invalid recipient: ${firstError?.message || 'Unknown validation error'}`,
            { details: { recipientData: info } }
          );
        }
        throw error;
      }
    }

    // Use validated recipients for all subsequent operations
    recipients = validatedRecipients;

    // Initialize data channel manager
    const dataChannelConfig: DataChannelManagerConfig = {
      maxPeers: recipients.length,
      enablePrivacyMode: true,
    };
    if (this.options.bandwidthLimitPerRecipient !== undefined) {
      dataChannelConfig.bandwidthLimit = this.options.bandwidthLimitPerRecipient;
    }
    this.dataChannelManager = new DataChannelManager(
      dataChannelConfig,
      {
        onPeerConnected: (peerId, dataChannel) => {
          this.handlePeerConnected(peerId, dataChannel);
        },
        onPeerDisconnected: (peerId, reason) => {
          this.handlePeerDisconnected(peerId, reason);
        },
        onPeerError: (peerId, error) => {
          this.handlePeerError(peerId, error);
        },
        onQualityChange: (peerId, quality) => {
          this.handleQualityChange(peerId, quality);
        },
      }
    );

    // Connect to signaling server if not already connected
    if (!this.signalingClient.isConnected) {
      await this.signalingClient.connect();
    }

    // Setup signaling handlers for this group
    this.setupSignalingHandlers();

    // Initialize state with error handling for each recipient
    const groupRecipients: GroupTransferRecipient[] = [];
    let initialFailureCount = 0;

    for (const info of recipients) {
      let manager: PQCTransferManager;
      let status: TransferStatus = 'pending';
      let error: AppError | null = null;

      try {
        manager = new PQCTransferManager();
      } catch (initError) {
        secureLog.error(`[GroupTransfer] Failed to initialize manager for ${info.name}:`, initError);
        // Mark as failed but still add to recipients list
        status = 'failed';
        error = createTransferError(
          'TRANSFER_FAILED',
          `Failed to initialize transfer for ${info.name}`,
          { details: { originalError: toAppError(initError) } }
        );
        initialFailureCount++;
        // Create a placeholder manager (will not be used)
        manager = {} as PQCTransferManager;
      }

      groupRecipients.push({
        ...info,
        peerConnection: null,
        dataChannel: null,
        manager,
        status,
        progress: 0,
        error,
        speed: 0,
        startTime: null,
        endTime: null,
        connectionQuality: 'disconnected' as const,
      });
    }

    this.state = {
      transferId,
      fileName,
      fileSize,
      recipients: groupRecipients,
      totalProgress: 0,
      successCount: 0,
      failureCount: initialFailureCount,
      pendingCount: groupRecipients.length - initialFailureCount,
      status: 'preparing',
      bandwidthLimit: this.options.bandwidthLimitPerRecipient ?? null,
    };

    // Create WebRTC connections to all recipients
    await this.createPeerConnections(recipients);
  }

  /**
   * Create WebRTC peer connections to all recipients
   */
  private async createPeerConnections(recipients: RecipientInfo[]): Promise<void> {
    if (!this.dataChannelManager) {
      throw new Error('Data channel manager not initialized');
    }

    secureLog.log(`[GroupTransfer] Creating peer connections to ${recipients.length} recipients`);

    // Notify signaling server about group transfer
    this.signalingClient.createGroupTransfer(
      this.groupId,
      this.state!.fileName,
      this.state!.fileSize,
      recipients.map(r => r.socketId)
    );

    // Create connections to each recipient
    const connectionPromises = recipients.map(async (recipient) => {
      try {
        const { offer, dataChannel } = await this.dataChannelManager!.createConnection(
          recipient.id,
          recipient.name,
          recipient.socketId
        );

        // Store data channel reference
        const recipientState = this.state?.recipients.find(r => r.id === recipient.id);
        if (recipientState) {
          recipientState.dataChannel = dataChannel;
        }

        // Send offer via signaling server
        this.signalingClient.sendGroupOffer(this.groupId, recipient.socketId, offer);

        secureLog.log(`[GroupTransfer] Created connection offer for: ${recipient.name}`);
      } catch (error) {
        secureLog.error(`[GroupTransfer] Failed to create connection to ${recipient.name}:`, error);
        this.handleRecipientError(recipient.id, error as Error);
      }
    });

    await Promise.allSettled(connectionPromises);
  }

  /**
   * Setup signaling event handlers for group transfer
   */
  private setupSignalingHandlers(): void {
    // Handle answers from recipients
    this.signalingClient.on('group-answer', async (data: unknown) => {
      if (!isGroupAnswerMessage(data)) {
        secureLog.warn('[GroupTransfer] Received invalid group-answer message');
        return;
      }

      if (data['groupId'] !== this.groupId) {return;}

      try {
        const peerId = this.findPeerIdBySocketId(data['from']);
        if (!peerId) {
          secureLog.warn(`[GroupTransfer] Received answer from unknown peer: ${data['from']}`);
          return;
        }

        await this.dataChannelManager?.completeConnection(peerId, data['answer']);
        secureLog.log(`[GroupTransfer] Completed connection with peer: ${peerId}`);
      } catch (error) {
        secureLog.error(`[GroupTransfer] Failed to handle answer:`, error);
      }
    });

    // Handle ICE candidates
    this.signalingClient.on('group-ice-candidate', async (data: unknown) => {
      if (!isGroupICECandidateMessage(data)) {
        secureLog.warn('[GroupTransfer] Received invalid group-ice-candidate message');
        return;
      }

      if (data['groupId'] !== this.groupId) {return;}

      try {
        const peerId = this.findPeerIdBySocketId(data['from']);
        if (!peerId) {return;}

        await this.dataChannelManager?.addIceCandidate(peerId, data['candidate']);
      } catch (error) {
        secureLog.error(`[GroupTransfer] Failed to add ICE candidate:`, error);
      }
    });
  }

  /**
   * Find peer ID by socket ID
   */
  private findPeerIdBySocketId(socketId: string): string | null {
    const recipient = this.state?.recipients.find(r => r.socketId === socketId);
    return recipient?.id || null;
  }

  /**
   * Handle peer connected event
   */
  private async handlePeerConnected(peerId: string, dataChannel: RTCDataChannel): Promise<void> {
    const recipient = this.state?.recipients.find(r => r.id === peerId);
    if (!recipient) {return;}

    secureLog.log(`[GroupTransfer] Peer connected: ${recipient.name}`);

    // Initialize PQC transfer manager for this peer
    try {
      await recipient.manager.initializeSession('send');
      recipient.manager.setDataChannel(dataChannel);

      // Apply bandwidth limit if configured
      if (this.options.bandwidthLimitPerRecipient) {
        recipient.manager.setBandwidthLimit(this.options.bandwidthLimitPerRecipient);
      }

      // Setup callbacks
      recipient.manager.onProgress((progress) => {
        this.handleRecipientProgress(peerId, progress);
      });

      recipient.manager.onError((error) => {
        this.handleRecipientError(peerId, error);
      });

      recipient.manager.onSessionReady(() => {
        secureLog.log(`[GroupTransfer] Session ready for: ${recipient.name}`);
      });

      // Start key exchange
      recipient.manager.startKeyExchange();
    } catch (error) {
      secureLog.error(`[GroupTransfer] Failed to initialize manager for ${recipient.name}:`, error);
      this.handleRecipientError(peerId, error as Error);
    }
  }

  /**
   * Handle peer disconnected event
   */
  private handlePeerDisconnected(peerId: string, reason: string): void {
    const recipient = this.state?.recipients.find(r => r.id === peerId);
    if (!recipient) {return;}

    secureLog.log(`[GroupTransfer] Peer disconnected: ${recipient.name} (${reason})`);

    if (recipient.status !== 'completed') {
      recipient.status = 'failed';
      recipient.error = createNetworkError('PEER_DISCONNECTED', `Peer disconnected: ${reason}`, {
        details: { peerId, recipientName: recipient.name },
      });
      recipient.endTime = Date.now();
      this.state!.failureCount++;
      this.state!.pendingCount--;

      // Convert AppError to standard Error for callback
      const standardError = new Error(recipient.error.message);
      standardError.name = recipient.error.type;
      this.options.onRecipientError?.(peerId, standardError);
    }
  }

  /**
   * Handle peer error event
   */
  private handlePeerError(peerId: string, error: Error): void {
    const appError = toAppError(error, {
      operation: 'peer-connection',
      component: 'GroupTransferManager',
    });
    this.handleRecipientError(peerId, appError);
  }

  /**
   * Handle quality change event
   */
  private handleQualityChange(peerId: string, quality: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected'): void {
    const recipient = this.state?.recipients.find(r => r.id === peerId);
    if (!recipient) {return;}

    recipient.connectionQuality = quality;
    secureLog.log(`[GroupTransfer] Connection quality for ${recipient.name}: ${quality}`);
  }

  /**
   * Start key exchange with all recipients
   */
  async startKeyExchange(): Promise<void> {
    if (!this.state) {
      throw new Error('Group transfer not initialized');
    }

    secureLog.log('[GroupTransfer] Starting key exchange with all recipients');

    const keyExchangePromises = this.state.recipients.map(async (recipient) => {
      if (recipient.status === 'failed') {
        return; // Skip already failed recipients
      }

      try {
        // Wait for data channel to be open
        if (!recipient.dataChannel) {
          throw new Error('DataChannel not available');
        }
        if (recipient.dataChannel.readyState !== 'open') {
          await this.waitForDataChannelOpen(recipient.dataChannel);
        }

        // Start key exchange
        recipient.manager.startKeyExchange();
        secureLog.log(`[GroupTransfer] Key exchange started for: ${recipient.name}`);
      } catch (error) {
        secureLog.error(`[GroupTransfer] Key exchange failed for ${recipient.name}:`, error);
        this.handleRecipientError(recipient.id, error as Error);
      }
    });

    await Promise.allSettled(keyExchangePromises);
  }

  /**
   * Send file to all recipients in parallel
   */
  async sendToAll(file: File): Promise<GroupTransferResult> {
    if (!this.state) {
      throw new Error('Group transfer not initialized');
    }

    if (file.size === 0) {
      throw new Error('Cannot send empty file');
    }

    secureLog.log(`[GroupTransfer] Starting parallel transfer of ${file.name} to ${this.state.recipients.length} recipients`);

    this.state.status = 'transferring';
    this.transferStartTime = Date.now();

    // Start progress update interval
    this.startProgressUpdates();

    // Send to all recipients in parallel
    const sendPromises = this.state.recipients.map(async (recipient) => {
      if (recipient.status === 'failed') {
        return; // Skip failed recipients
      }

      try {
        recipient.status = 'transferring';
        recipient.startTime = Date.now();

        // Wait for session to be ready (event-based instead of busy-wait)
        const maxWaitTime = 30000; // 30 seconds
        await this.waitForManagerReady(recipient.manager, maxWaitTime);

        // Send file
        await recipient.manager.sendFile(file);

        // Mark as completed
        recipient.status = 'completed';
        recipient.progress = 100;
        recipient.endTime = Date.now();
        this.state!.successCount++;
        this.state!.pendingCount--;

        this.options.onRecipientComplete?.(recipient.id);
        secureLog.log(`[GroupTransfer] Transfer completed for: ${recipient.name}`);
      } catch (error) {
        // Mark as failed
        const appError = createTransferError(
          'TRANSFER_FAILED',
          `Transfer to ${recipient.name} failed`,
          { details: { originalError: toAppError(error) } }
        );
        recipient.status = 'failed';
        recipient.error = appError;
        recipient.endTime = Date.now();
        this.state!.failureCount++;
        this.state!.pendingCount--;

        // Convert AppError to standard Error for callback
        const standardError = new Error(appError.message);
        standardError.name = appError.type;
        this.options.onRecipientError?.(recipient.id, standardError);
        secureLog.error(`[GroupTransfer] Transfer failed for ${recipient.name}:`, appError);
      }
    });

    // Wait for all transfers to complete
    await Promise.allSettled(sendPromises);

    this.stopProgressUpdates();

    // Determine final status
    if (this.state.successCount === this.state.recipients.length) {
      this.state.status = 'completed';
    } else if (this.state.successCount > 0) {
      this.state.status = 'partial';
    } else {
      this.state.status = 'failed';
    }

    const totalTime = Date.now() - this.transferStartTime;

    // Record group transfer metrics
    const durationSeconds = totalTime / 1000;
    for (const recipient of this.state.recipients) {
      if (recipient.status === 'completed') {
        recordTransfer('success', 'p2p', this.state.fileSize, durationSeconds, 'unknown');
      } else if (recipient.status === 'failed') {
        recordTransfer('failed', 'p2p', this.state.fileSize, 0, 'unknown');
        recordError('transfer', 'error');
      }
    }

    // Build result
    const result: GroupTransferResult = {
      transferId: this.state.transferId,
      fileName: this.state.fileName,
      totalRecipients: this.state.recipients.length,
      successfulRecipients: this.state.recipients
        .filter(r => r.status === 'completed')
        .map(r => r.id),
      failedRecipients: this.state.recipients
        .filter(r => r.status === 'failed')
        .map(r => ({
          id: r.id,
          error: r.error ?? createTransferError('TRANSFER_FAILED', 'Unknown error'),
        })),
      totalTime,
    };

    this.options.onComplete?.(result);
    secureLog.log(`[GroupTransfer] Group transfer completed:`, result);

    return result;
  }

  /**
   * Cancel group transfer
   */
  cancel(): void {
    if (!this.state) {return;}

    secureLog.log('[GroupTransfer] Cancelling group transfer');

    this.stopProgressUpdates();

    // Record cancelled transfer metrics for each pending recipient
    const pendingRecipients = this.state.recipients.filter(
      r => r.status !== 'completed' && r.status !== 'failed'
    );
    for (const _recipient of pendingRecipients) {
      recordTransfer('cancelled', 'p2p', this.state.fileSize, 0, 'unknown');
    }

    // Cleanup all recipient managers
    this.state.recipients.forEach(recipient => {
      try {
        recipient.manager.destroy();
      } catch (error) {
        secureLog.error(`[GroupTransfer] Error destroying manager for ${recipient.name}:`, error);
      }
    });

    this.state = null;
  }

  /**
   * Get current state
   */
  getState(): GroupTransferState | null {
    return this.state;
  }

  /**
   * Handle recipient progress update
   */
  private handleRecipientProgress(recipientId: string, progress: number): void {
    if (!this.state) {return;}

    const recipient = this.state.recipients.find(r => r.id === recipientId);
    if (!recipient) {return;}

    recipient.progress = progress;

    // Calculate speed if we have start time
    if (recipient.startTime) {
      const elapsed = (Date.now() - recipient.startTime) / 1000; // seconds
      const bytesTransferred = (this.state.fileSize * progress) / 100;
      recipient.speed = elapsed > 0 ? bytesTransferred / elapsed : 0;
    }

    // Calculate overall progress (average of all recipients)
    const totalProgress = this.state.recipients.reduce((sum, r) => sum + r.progress, 0);
    this.state.totalProgress = totalProgress / this.state.recipients.length;

    this.options.onRecipientProgress?.(recipientId, progress, recipient.speed || 0);
    this.options.onOverallProgress?.(this.state.totalProgress);
  }

  /**
   * Handle recipient error
   */
  private handleRecipientError(recipientId: string, error: Error | AppError): void {
    if (!this.state) {return;}

    const recipient = this.state.recipients.find(r => r.id === recipientId);
    if (!recipient) {return;}

    const appError = toAppError(error, {
      operation: 'file-transfer',
      component: 'GroupTransferManager',
    });

    recipient.status = 'failed';
    recipient.error = appError;
    recipient.endTime = Date.now();

    this.state.failureCount++;
    this.state.pendingCount--;

    // Convert AppError to standard Error for callback
    const standardError = new Error(appError.message);
    standardError.name = appError.type;
    this.options.onRecipientError?.(recipientId, standardError);
    secureLog.error(`[GroupTransfer] Recipient ${recipient.name} failed:`, appError);
  }

  /**
   * Wait for transfer manager to be ready (event-based, not busy-wait)
   */
  private async waitForManagerReady(manager: PQCTransferManager, timeoutMs: number): Promise<void> {
    if (manager.isReady()) {return;} // Already ready

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Key exchange timeout - manager not ready'));
      }, timeoutMs);

      // Poll with exponential backoff to reduce CPU usage
      let pollInterval = 50; // Start with 50ms
      const maxInterval = 1000; // Max 1 second between checks

      const checkReady = () => {
        if (manager.isReady()) {
          clearTimeout(timeoutId);
          resolve();
        } else {
          pollInterval = Math.min(pollInterval * 1.5, maxInterval);
          setTimeout(checkReady, pollInterval);
        }
      };

      checkReady();
    });
  }

  /**
   * Start periodic progress updates
   */
  private startProgressUpdates(): void {
    this.updateInterval = setInterval(() => {
      if (!this.state) {return;}

      // Recalculate overall progress
      const totalProgress = this.state.recipients.reduce((sum, r) => sum + r.progress, 0);
      this.state.totalProgress = totalProgress / this.state.recipients.length;

      this.options.onOverallProgress?.(this.state.totalProgress);
    }, 100); // Update every 100ms
  }

  /**
   * Stop progress updates
   */
  private stopProgressUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Wait for data channel to open
   */
  private waitForDataChannelOpen(dataChannel: RTCDataChannel, timeout = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (dataChannel.readyState === 'open') {
        resolve();
        return;
      }

      const timeoutId = setTimeout(() => {
        dataChannel.removeEventListener('open', onOpen);
        reject(new Error('Data channel open timeout'));
      }, timeout);

      const onOpen = () => {
        clearTimeout(timeoutId);
        dataChannel.removeEventListener('open', onOpen);
        resolve();
      };

      dataChannel.addEventListener('open', onOpen);
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.cancel();

    // Destroy data channel manager
    if (this.dataChannelManager) {
      this.dataChannelManager.destroy();
      this.dataChannelManager = null;
    }

    // Leave group on signaling server
    if (this.signalingClient.isConnected) {
      this.signalingClient.leaveGroupTransfer(this.groupId);
    }
  }

  /**
   * Get group ID
   */
  getGroupId(): string {
    return this.groupId;
  }

  /**
   * Get data channel manager
   */
  getDataChannelManager(): DataChannelManager | null {
    return this.dataChannelManager;
  }

  /**
   * Get connected peer count
   */
  getConnectedPeerCount(): number {
    return this.dataChannelManager?.getConnectedPeers().length || 0;
  }

  /**
   * Get peer connection quality
   */
  getPeerQuality(peerId: string): 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected' | null {
    const recipient = this.state?.recipients.find(r => r.id === peerId);
    return recipient?.connectionQuality || null;
  }
}
