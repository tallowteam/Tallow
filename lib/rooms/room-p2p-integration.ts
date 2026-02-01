'use client';

/**
 * Integration layer between Transfer Rooms and P2P Connections
 * Manages WebRTC connections for all room members
 */

import { TransferRoomManager, RoomMember } from './transfer-room-manager';
import { PQCTransferManager } from '../transfer/pqc-transfer-manager';
import secureLog from '../utils/secure-logger';

export interface RoomP2PConnection {
  memberId: string;
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  pqcManager: PQCTransferManager;
}

/**
 * Manages P2P connections for all members in a transfer room
 */
export class RoomP2PIntegration {
  private roomManager: TransferRoomManager;
  private connections: Map<string, RoomP2PConnection> = new Map();
  private onFileReceivedCallback?: (file: { blob: Blob; name: string; senderId: string }) => void;

  constructor(roomManager: TransferRoomManager) {
    this.roomManager = roomManager;
    this.setupRoomEventHandlers();
  }

  /**
   * Setup room event handlers
   */
  private setupRoomEventHandlers(): void {
    // When a new member joins, establish P2P connection
    this.roomManager.onMemberJoined((member) => {
      if (!member.isOwner) {
        this.initiateConnectionToMember(member);
      }
    });

    // When a member leaves, close their connection
    this.roomManager.onMemberLeft((memberId) => {
      this.closeConnectionToMember(memberId);
    });

    // When room is closed, close all connections
    this.roomManager.onRoomClosed(() => {
      this.closeAllConnections();
    });
  }

  /**
   * Initiate P2P connection to a room member
   */
  private async initiateConnectionToMember(member: RoomMember): Promise<void> {
    try {
      secureLog.log('[Room P2P] Initiating connection to:', member.deviceName);

      // Create peer connection (using existing private transport)
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      // Create data channel
      const dataChannel = pc.createDataChannel('fileTransfer', { ordered: true });

      // Initialize PQC transfer manager
      const pqcManager = new PQCTransferManager();
      await pqcManager.initializeSession('send');
      pqcManager.setDataChannel(dataChannel);

      // Setup data channel handlers
      dataChannel.onopen = () => {
        secureLog.log('[Room P2P] Data channel open to:', member.deviceName);
        pqcManager.startKeyExchange();
      };

      dataChannel.onmessage = async (event) => {
        const handled = await pqcManager.handleIncomingMessage(event.data);
        if (!handled) {
          // Handle other message types if needed
        }
      };

      // Handle received files
      pqcManager.onComplete((blob, filename) => {
        this.onFileReceivedCallback?.({
          blob,
          name: filename,
          senderId: member.id,
        });
      });

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering
      await this.waitForIceGathering(pc);

      // Send offer via signaling (implementation depends on signaling setup)
      // This would integrate with the existing Socket.IO signaling

      // Store connection
      this.connections.set(member.id, {
        memberId: member.id,
        peerConnection: pc,
        dataChannel,
        pqcManager,
      });

      secureLog.log('[Room P2P] Connection initiated to:', member.deviceName);
    } catch (error) {
      secureLog.error('[Room P2P] Failed to initiate connection:', error);
    }
  }

  /**
   * Wait for ICE gathering
   */
  private waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        secureLog.warn('[Room P2P] ICE gathering timeout');
        resolve();
      }, 10000);

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          resolve();
        }
      };
    });
  }

  /**
   * Send file to all room members
   */
  async broadcastFile(file: File, onProgress?: (memberId: string, progress: number) => void): Promise<void> {
    const sendPromises: Promise<void>[] = [];

    // First, broadcast file offer via room manager
    this.roomManager.broadcastFileOffer(file.name, file.size);

    // Then send file via P2P to each connected member
    for (const [memberId, connection] of this.connections.entries()) {
      if (connection.pqcManager.isReady()) {
        const sendPromise = connection.pqcManager.sendFile(file).then(() => {
          secureLog.log('[Room P2P] File sent to:', memberId);
        });
        sendPromises.push(sendPromise);

        // Setup progress tracking
        connection.pqcManager.onProgress((progress) => {
          onProgress?.(memberId, progress);
        });
      } else {
        secureLog.warn('[Room P2P] Connection not ready for:', memberId);
      }
    }

    await Promise.all(sendPromises);
  }

  /**
   * Send file to specific room member
   */
  async sendFileToMember(memberId: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
    const connection = this.connections.get(memberId);

    if (!connection) {
      throw new Error('No connection to member');
    }

    if (!connection.pqcManager.isReady()) {
      throw new Error('Connection not ready');
    }

    connection.pqcManager.onProgress((progress) => {
      onProgress?.(progress);
    });

    await connection.pqcManager.sendFile(file);
  }

  /**
   * Close connection to a specific member
   */
  private closeConnectionToMember(memberId: string): void {
    const connection = this.connections.get(memberId);

    if (connection) {
      connection.dataChannel.close();
      connection.peerConnection.close();
      connection.pqcManager.destroy();
      this.connections.delete(memberId);
      secureLog.log('[Room P2P] Connection closed to:', memberId);
    }
  }

  /**
   * Close all P2P connections
   */
  closeAllConnections(): void {
    for (const [_memberId, connection] of this.connections.entries()) {
      connection.dataChannel.close();
      connection.peerConnection.close();
      connection.pqcManager.destroy();
    }
    this.connections.clear();
    secureLog.log('[Room P2P] All connections closed');
  }

  /**
   * Get connection status for a member
   */
  getConnectionStatus(memberId: string): 'connected' | 'connecting' | 'disconnected' {
    const connection = this.connections.get(memberId);

    if (!connection) {
      return 'disconnected';
    }

    const state = connection.peerConnection.connectionState;
    if (state === 'connected') {return 'connected';}
    if (state === 'connecting' || state === 'new') {return 'connecting';}
    return 'disconnected';
  }

  /**
   * Event handler for received files
   */
  onFileReceived(callback: (file: { blob: Blob; name: string; senderId: string }) => void): void {
    this.onFileReceivedCallback = callback;
  }

  /**
   * Get list of connected members
   */
  getConnectedMembers(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.closeAllConnections();
  }
}
