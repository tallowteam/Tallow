'use client';

/**
 * Transfer Room Manager
 * Manages persistent transfer rooms for multi-user file sharing
 */

import type { Socket } from 'socket.io-client';
import secureLog from '../utils/secure-logger';

// Lazy-load socket.io-client to reduce initial bundle size (~35KB)
let socketModule: typeof import('socket.io-client') | null = null;

async function getSocketIO(): Promise<typeof import('socket.io-client')> {
    if (!socketModule) {
        socketModule = await import('socket.io-client');
    }
    return socketModule;
}
import { generateUUID } from '../utils/uuid';
import {
  deriveRoomEncryptionKey,
  deriveRoomSenderKey,
  encryptRoomMessage,
  decryptRoomMessage,
  type RoomEncryptionKey,
} from './room-crypto';

export interface RoomMember {
  id: string;
  socketId: string;
  deviceName: string;
  deviceId: string;
  joinedAt: Date;
  isOnline: boolean;
  isOwner: boolean;
}

export interface TransferRoom {
  id: string;
  code: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  expiresAt: Date | null;
  members: Map<string, RoomMember>;
  isPasswordProtected: boolean;
  maxMembers: number;
}

export interface RoomConfig {
  name?: string;
  password?: string;
  expiresIn?: number; // milliseconds, null = never
  maxMembers?: number;
}

// Socket payload types for type-safe event handling
export interface RoomMemberPayload {
  id: string;
  socketId: string;
  deviceName: string;
  deviceId: string;
  joinedAt: string;
  isOnline?: boolean;
  isOwner: boolean;
}

export interface FileOfferPayload {
  senderId: string;
  fileName: string;
  fileSize: number;
  roomId?: string;
}

export interface RoomJoinResponse {
  success: boolean;
  room?: {
    id: string;
    code: string;
    name: string;
    ownerId: string;
    createdAt: string;
    expiresAt: string | null;
    members: RoomMemberPayload[];
    isPasswordProtected: boolean;
    maxMembers: number;
  };
  error?: string;
}

export interface EncryptedRoomPayload {
  encrypted: boolean;
  ct: string;
  iv: string;
  sid?: string;
  ts?: number;
  v?: number;
}

export type RoomMessagePayload =
  | { type: 'member-joined'; member: RoomMemberPayload }
  | { type: 'member-left'; memberId: string }
  | { type: 'file-offer'; offer: FileOfferPayload }
  | { type: 'room-closed' }
  | { type: 'member-update'; members: RoomMemberPayload[] };

export interface RoomMessage {
  type: 'member-joined' | 'member-left' | 'file-offer' | 'room-closed' | 'member-update';
  payload: RoomMessagePayload;
  senderId: string;
  timestamp: number;
}

// Generate room code (8 alphanumeric characters)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = new Uint8Array(8);
  crypto.getRandomValues(values);
  let code = '';
  for (let i = 0; i < 8; i++) {
    const value = values[i];
    if (value !== undefined) {
      code += chars[value % chars.length];
    }
  }
  return code;
}

/**
 * Transfer Room Manager
 * Handles room creation, joining, presence tracking, and file notifications
 */
export class TransferRoomManager {
  private socket: Socket | null = null;
  private currentRoom: TransferRoom | null = null;
  private deviceId: string;
  private deviceName: string;
  private onMemberJoinedCallback?: (member: RoomMember) => void;
  private onMemberLeftCallback?: (memberId: string) => void;
  private onFileOfferCallback?: (offer: { senderId: string; fileName: string; fileSize: number }) => void;
  private onRoomClosedCallback?: () => void;
  private onMembersUpdatedCallback?: (members: RoomMember[]) => void;
  private connectionReadyCallback?: () => void;

  // PQC Room Encryption
  private roomEncryptionKey: RoomEncryptionKey | null = null;
  private encryptionEnabled: boolean = true; // Enable by default
  private roomCodeForEncryption: string | null = null;
  private roomPasswordForEncryption: string | undefined;
  private senderKeyCache: Map<string, RoomEncryptionKey> = new Map();

  constructor(deviceId: string, deviceName: string) {
    this.deviceId = deviceId;
    this.deviceName = deviceName;
  }

  /**
   * Connect to signaling server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      secureLog.log('[Room] Already connected');
      return;
    }

    const signalingUrl = process.env['NEXT_PUBLIC_SIGNALING_URL'] || 'http://localhost:3001';

    // Lazy-load socket.io-client
    const { io } = await getSocketIO();

    this.socket = io(signalingUrl, {
      path: '/signaling',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.socket!.on('connect', () => {
        clearTimeout(timeout);
        secureLog.log('[Room] Connected to signaling server');
        this.setupSocketHandlers();
        this.connectionReadyCallback?.();
        resolve();
      });

      this.socket!.on('connect_error', (error) => {
        clearTimeout(timeout);
        secureLog.error('[Room] Connection error:', error);
        reject(error);
      });
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.socket) {return;}

    // Room events
    this.socket.on('room-created', (data: { roomId: string; code: string }) => {
      secureLog.log('[Room] Room created:', data.code);
    });

    this.socket.on('room-joined', (data: { roomId: string; members: RoomMemberPayload[] }) => {
      secureLog.log('[Room] Joined room:', data.roomId);
      if (this.currentRoom) {
        // Update members list
        data.members.forEach((member: RoomMemberPayload) => {
          if (!this.currentRoom!.members.has(member.id)) {
            this.currentRoom!.members.set(member.id, {
              id: member.id,
              socketId: member.socketId,
              deviceName: member.deviceName,
              deviceId: member.deviceId,
              joinedAt: new Date(member.joinedAt),
              isOnline: true,
              isOwner: member.isOwner,
            });
          }
        });
        this.onMembersUpdatedCallback?.(Array.from(this.currentRoom.members.values()));
      }
    });

    this.socket.on('room-member-joined', (data: { member: RoomMemberPayload }) => {
      secureLog.log('[Room] Member joined:', data.member.deviceName);
      if (this.currentRoom && !this.currentRoom.members.has(data.member.id)) {
        const member: RoomMember = {
          id: data.member.id,
          socketId: data.member.socketId,
          deviceName: data.member.deviceName,
          deviceId: data.member.deviceId,
          joinedAt: new Date(data.member.joinedAt),
          isOnline: true,
          isOwner: data.member.isOwner,
        };
        this.currentRoom.members.set(member.id, member);
        this.onMemberJoinedCallback?.(member);
        this.onMembersUpdatedCallback?.(Array.from(this.currentRoom.members.values()));
      }
    });

    this.socket.on('room-member-left', (data: { memberId: string }) => {
      secureLog.log('[Room] Member left:', data.memberId);
      if (this.currentRoom) {
        this.currentRoom.members.delete(data.memberId);
        this.onMemberLeftCallback?.(data.memberId);
        this.onMembersUpdatedCallback?.(Array.from(this.currentRoom.members.values()));
      }
    });

    this.socket.on('room-file-offer', async (data: EncryptedRoomPayload | FileOfferPayload) => {
      // Decrypt file offer payload
      const decryptedData = await this.decryptRoomPayload(data);
      const offer = decryptedData as FileOfferPayload;
      secureLog.log('[Room] File offer:', offer.fileName);
      this.onFileOfferCallback?.(offer);
    });

    this.socket.on('room-closed', () => {
      secureLog.log('[Room] Room closed by owner');
      this.currentRoom = null;
      this.onRoomClosedCallback?.();
    });

    this.socket.on('error', (error: { message: string }) => {
      secureLog.error('[Room] Socket error:', error.message);
    });

    // Handle disconnect
    this.socket.on('disconnect', (reason) => {
      secureLog.log('[Room] Disconnected:', reason);
    });

    // Handle reconnect
    this.socket.on('reconnect', () => {
      secureLog.log('[Room] Reconnected');
      // Rejoin current room if exists
      if (this.currentRoom) {
        this.rejoinRoom();
      }
    });
  }

  /**
   * Rejoin room after reconnection
   */
  private rejoinRoom(): void {
    if (!this.socket || !this.currentRoom) {return;}

    this.socket.emit('rejoin-room', {
      roomId: this.currentRoom.id,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
    });
  }

  /**
   * Create a new room
   */
  async createRoom(config: RoomConfig = {}): Promise<TransferRoom> {
    if (!this.socket?.connected) {
      throw new Error('Not connected to signaling server');
    }

    const roomId = generateUUID();
    const roomCode = generateRoomCode();
    const expiresIn = config.expiresIn ?? null;
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : null;

    // Create local room object
    this.currentRoom = {
      id: roomId,
      code: roomCode,
      name: config.name || `Room ${roomCode}`,
      ownerId: this.deviceId,
      createdAt: new Date(),
      expiresAt,
      members: new Map(),
      isPasswordProtected: !!config.password,
      maxMembers: Math.min(Math.max(config.maxMembers || 10, 2), 50),
    };

    // Add self as owner
    const owner: RoomMember = {
      id: this.deviceId,
      socketId: this.socket.id || 'pending',
      deviceName: this.deviceName,
      deviceId: this.deviceId,
      joinedAt: new Date(),
      isOnline: true,
      isOwner: true,
    };
    this.currentRoom.members.set(this.deviceId, owner);

    // Emit create-room event to server
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Room creation timeout'));
      }, 5000);

      this.socket!.emit('create-room', {
        roomId,
        code: roomCode,
        name: this.currentRoom!.name,
        ownerId: this.deviceId,
        ownerName: this.deviceName,
        password: config.password,
        expiresAt: expiresAt?.toISOString(),
        maxMembers: this.currentRoom!.maxMembers,
      }, async (response: { success: boolean; error?: string }) => {
        clearTimeout(timeout);
        if (response.success) {
          // Initialize room encryption with room code and password
          await this.initializeRoomEncryption(roomCode, config.password);
          secureLog.log('[Room] Room created successfully:', roomCode);
          resolve(this.currentRoom!);
        } else {
          reject(new Error(response.error || 'Failed to create room'));
        }
      });
    });
  }

  /**
   * Join an existing room by code
   */
  async joinRoom(code: string, password?: string): Promise<TransferRoom> {
    if (!this.socket?.connected) {
      throw new Error('Not connected to signaling server');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Room join timeout'));
      }, 5000);

      this.socket!.emit('join-room-code', {
        code: code.toUpperCase(),
        deviceId: this.deviceId,
        deviceName: this.deviceName,
        password,
      }, async (response: RoomJoinResponse) => {
        clearTimeout(timeout);
        if (response.success && response.room) {
          // Create local room object
          const room = response.room;
          this.currentRoom = {
            id: room.id,
            code: room.code,
            name: room.name,
            ownerId: room.ownerId,
            createdAt: new Date(room.createdAt),
            expiresAt: room.expiresAt ? new Date(room.expiresAt) : null,
            members: new Map(),
            isPasswordProtected: room.isPasswordProtected,
            maxMembers: room.maxMembers,
          };

          // Add existing members
          room.members.forEach((member: RoomMemberPayload) => {
            this.currentRoom!.members.set(member.id, {
              id: member.id,
              socketId: member.socketId,
              deviceName: member.deviceName,
              deviceId: member.deviceId,
              joinedAt: new Date(member.joinedAt),
              isOnline: member.isOnline ?? true,
              isOwner: member.isOwner,
            });
          });

          // Initialize room encryption with room code and password
          await this.initializeRoomEncryption(code, password);
          secureLog.log('[Room] Joined room successfully:', code);
          resolve(this.currentRoom);
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }

  /**
   * Leave current room
   */
  leaveRoom(): void {
    if (!this.socket || !this.currentRoom) {return;}

    this.socket.emit('leave-transfer-room', {
      roomId: this.currentRoom.id,
      deviceId: this.deviceId,
    });

    this.currentRoom = null;
    this.roomEncryptionKey = null;
    this.roomCodeForEncryption = null;
    this.roomPasswordForEncryption = undefined;
    this.senderKeyCache.clear();
  }

  /**
   * Broadcast file offer to all room members
   */
  async broadcastFileOffer(fileName: string, fileSize: number): Promise<void> {
    if (!this.socket || !this.currentRoom) {
      throw new Error('Not in a room');
    }

    // Encrypt file offer payload
    const payload = {
      roomId: this.currentRoom.id,
      senderId: this.deviceId,
      fileName,
      fileSize,
    };

    const encryptedPayload = await this.encryptRoomPayload(payload);

    this.socket.emit('room-broadcast-file', encryptedPayload);
  }

  /**
   * Get current room
   */
  getCurrentRoom(): TransferRoom | null {
    return this.currentRoom;
  }

  /**
   * Get room members
   */
  getRoomMembers(): RoomMember[] {
    if (!this.currentRoom) {return [];}
    return Array.from(this.currentRoom.members.values());
  }

  /**
   * Check if user is room owner
   */
  isOwner(): boolean {
    if (!this.currentRoom) {return false;}
    return this.currentRoom.ownerId === this.deviceId;
  }

  /**
   * Close room (owner only)
   */
  closeRoom(): void {
    if (!this.socket || !this.currentRoom) {return;}
    if (!this.isOwner()) {
      throw new Error('Only room owner can close the room');
    }

    this.socket.emit('close-room', {
      roomId: this.currentRoom.id,
      ownerId: this.deviceId,
    });

    this.currentRoom = null;
    this.roomEncryptionKey = null;
    this.roomCodeForEncryption = null;
    this.roomPasswordForEncryption = undefined;
    this.senderKeyCache.clear();
  }

  /**
   * Remove a member from the room (owner/admin only).
   */
  removeMember(memberId: string): boolean {
    if (!this.currentRoom) {return false;}
    if (!this.isOwner()) {
      throw new Error('Only room owner can remove members');
    }
    if (memberId === this.deviceId) {
      return false;
    }

    const removed = this.currentRoom.members.delete(memberId);
    if (!removed) {
      return false;
    }

    this.socket?.emit('remove-room-member', {
      roomId: this.currentRoom.id,
      ownerId: this.deviceId,
      memberId,
    });

    this.onMembersUpdatedCallback?.(Array.from(this.currentRoom.members.values()));
    return true;
  }

  /**
   * Get shareable room URL
   */
  getRoomUrl(): string {
    if (!this.currentRoom) {return '';}
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/room/${this.currentRoom.code}`;
  }

  /**
   * Event handlers
   */
  onConnectionReady(callback: () => void): void {
    this.connectionReadyCallback = callback;
  }

  onMemberJoined(callback: (member: RoomMember) => void): void {
    this.onMemberJoinedCallback = callback;
  }

  onMemberLeft(callback: (memberId: string) => void): void {
    this.onMemberLeftCallback = callback;
  }

  onFileOffer(callback: (offer: { senderId: string; fileName: string; fileSize: number }) => void): void {
    this.onFileOfferCallback = callback;
  }

  onRoomClosed(callback: () => void): void {
    this.onRoomClosedCallback = callback;
  }

  onMembersUpdated(callback: (members: RoomMember[]) => void): void {
    this.onMembersUpdatedCallback = callback;
  }

  /**
   * Disconnect from signaling server
   */
  disconnect(): void {
    if (this.currentRoom) {
      this.leaveRoom();
    }
    this.socket?.disconnect();
    this.socket = null;
    this.roomEncryptionKey = null;
    this.roomCodeForEncryption = null;
    this.roomPasswordForEncryption = undefined;
    this.senderKeyCache.clear();
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // ========================================================================
  // PQC Room Encryption Methods
  // ========================================================================

  /**
   * Initialize room encryption key
   * Called after creating or joining a room
   */
  private async initializeRoomEncryption(roomCode: string, password?: string): Promise<void> {
    if (!this.encryptionEnabled) {return;}

    try {
      this.roomCodeForEncryption = roomCode.toUpperCase();
      this.roomPasswordForEncryption = password;
      this.roomEncryptionKey = await deriveRoomEncryptionKey(roomCode, password);
      this.senderKeyCache.clear();
      const ownKey = await deriveRoomSenderKey(roomCode, this.deviceId, password);
      this.senderKeyCache.set(this.deviceId, ownKey);
      secureLog.log('[Room] Initialized PQC room encryption (HKDF-AES-256)');
    } catch (error) {
      secureLog.error('[Room] Failed to initialize room encryption:', error);
      this.encryptionEnabled = false;
    }
  }

  private async getSenderEncryptionKey(senderId: string): Promise<RoomEncryptionKey | null> {
    if (!this.roomCodeForEncryption) {
      return this.roomEncryptionKey;
    }

    const cached = this.senderKeyCache.get(senderId);
    if (cached) {
      return cached;
    }

    try {
      const derived = await deriveRoomSenderKey(
        this.roomCodeForEncryption,
        senderId,
        this.roomPasswordForEncryption
      );
      this.senderKeyCache.set(senderId, derived);
      return derived;
    } catch (error) {
      secureLog.error('[Room] Failed to derive sender key', { error, senderId });
      return this.roomEncryptionKey;
    }
  }

  /**
   * Encrypt room message payload
   */
  private async encryptRoomPayload(data: unknown): Promise<EncryptedRoomPayload | unknown> {
    if (!this.encryptionEnabled || !this.roomEncryptionKey) {
      return data;
    }

    try {
      const senderKey = await this.getSenderEncryptionKey(this.deviceId);
      const encrypted = await encryptRoomMessage(senderKey || this.roomEncryptionKey, data);
      return {
        ...encrypted,
        sid: this.deviceId,
      };
    } catch (error) {
      secureLog.error('[Room] Failed to encrypt message:', error);
      return data; // Fall back to unencrypted
    }
  }

  /**
   * Decrypt room message payload
   */
  private async decryptRoomPayload(data: EncryptedRoomPayload | unknown): Promise<unknown> {
    if (!data || typeof data !== 'object' || !this.roomEncryptionKey) {
      return data;
    }
    const payload = data as Record<string, unknown>;
    if (!payload['encrypted'] || typeof payload['ct'] !== 'string' || typeof payload['iv'] !== 'string') {
      return data;
    }

    try {
      const encryptedData: { ct: string; iv: string; ts?: number; v?: number } = {
        ct: payload['ct'] as string,
        iv: payload['iv'] as string,
        ...(typeof payload['ts'] === 'number' ? { ts: payload['ts'] } : {}),
        ...(typeof payload['v'] === 'number' ? { v: payload['v'] } : {}),
      };

      const senderId = typeof payload['sid'] === 'string' ? payload['sid'] : null;
      const senderKey = senderId ? await this.getSenderEncryptionKey(senderId) : null;
      return await decryptRoomMessage(senderKey || this.roomEncryptionKey, encryptedData);
    } catch (error) {
      secureLog.error('[Room] Failed to decrypt message:', error);
      return data; // Fall back to encrypted data (will fail)
    }
  }

  /**
   * Check if room encryption is active
   */
  isRoomEncrypted(): boolean {
    return this.encryptionEnabled && this.roomEncryptionKey !== null;
  }

  /**
   * Get room encryption status
   */
  getRoomEncryptionStatus(): { encrypted: boolean; algorithm: string | null } {
    if (this.isRoomEncrypted()) {
      return {
        encrypted: true,
        algorithm: this.roomEncryptionKey!.algorithm,
      };
    }
    return {
      encrypted: false,
      algorithm: null,
    };
  }
}
