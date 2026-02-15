'use client';

/**
 * Room Connection Hook
 * Manages room creation, joining, and P2P connections via room codes
 */

import { useEffect, useCallback, useRef } from 'react';
import { useRoomStore } from '@/lib/stores/room-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { TransferRoomManager, type RoomMember, type TransferRoom } from '@/lib/rooms/transfer-room-manager';
import { generateSecureRoomCode } from '@/lib/rooms/room-security';
import secureLog from '@/lib/utils/secure-logger';

export interface UseRoomConnectionOptions {
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Room expiration time in milliseconds (default: 1 hour) */
  expiresIn?: number;
  /** Maximum members allowed (default: 10) */
  maxMembers?: number;
  /** Callbacks */
  onMemberJoined?: (member: RoomMember) => void;
  onMemberLeft?: (memberId: string) => void;
  onRoomClosed?: () => void;
  onConnectionReady?: () => void;
  onError?: (error: Error) => void;
}

export interface UseRoomConnectionReturn {
  // Connection state
  isConnected: boolean;
  isInRoom: boolean;
  connectionStatus: string;
  connectionError: string | null;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | null;

  // Room state
  currentRoom: TransferRoom | null;
  roomCode: string | null;
  isHost: boolean;
  members: RoomMember[];
  memberCount: number;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  createRoom: (password?: string) => Promise<string>;
  joinRoom: (code: string, password?: string) => Promise<void>;
  leaveRoom: () => void;

  // Utility
  getRoomUrl: () => string;
  isRoomEncrypted: () => boolean;
}

const DEFAULT_EXPIRATION = 60 * 60 * 1000; // 1 hour
const DEFAULT_MAX_MEMBERS = 10;

export function useRoomConnection(options: UseRoomConnectionOptions = {}): UseRoomConnectionReturn {
  const {
    autoConnect = false,
    expiresIn = DEFAULT_EXPIRATION,
    maxMembers = DEFAULT_MAX_MEMBERS,
    onMemberJoined,
    onMemberLeft,
    onRoomClosed,
    onConnectionReady,
    onError,
  } = options;

  const roomManagerRef = useRef<TransferRoomManager | null>(null);

  // Store state
  const {
    connectionStatus,
    connectionError,
    connectionQuality,
    currentRoom,
    roomCode,
    isHost,
    members,
    memberCount,
    setConnectionStatus,
    setConnectionError,
    setConnectionQuality,
    setCurrentRoom,
    setIsHost,
    setMembers,
    addMember,
    removeMember,
    joinRoom: joinRoomStore,
    leaveRoom: leaveRoomStore,
  } = useRoomStore();

  const { deviceId, deviceName } = useSettingsStore();

  // Initialize room manager
  const getRoomManager = useCallback((): TransferRoomManager => {
    if (!roomManagerRef.current) {
      roomManagerRef.current = new TransferRoomManager(deviceId, deviceName);

      // Setup event handlers
      roomManagerRef.current.onConnectionReady(() => {
        setConnectionStatus('connected');
        onConnectionReady?.();
        secureLog.log('[useRoomConnection] Connected to signaling server');
      });

      roomManagerRef.current.onMemberJoined((member) => {
        secureLog.log('[useRoomConnection] Member joined:', member.deviceName);
        addMember(member);
        onMemberJoined?.(member);
      });

      roomManagerRef.current.onMemberLeft((memberId) => {
        secureLog.log('[useRoomConnection] Member left:', memberId);
        removeMember(memberId);
        onMemberLeft?.(memberId);
      });

      roomManagerRef.current.onMembersUpdated((updatedMembers) => {
        setMembers(updatedMembers);
      });

      roomManagerRef.current.onRoomClosed(() => {
        secureLog.log('[useRoomConnection] Room closed by host');
        leaveRoomStore();
        onRoomClosed?.();
      });
    }
    return roomManagerRef.current;
  }, [
    deviceId,
    deviceName,
    setConnectionStatus,
    addMember,
    removeMember,
    setMembers,
    leaveRoomStore,
    onConnectionReady,
    onMemberJoined,
    onMemberLeft,
    onRoomClosed,
  ]);

  // Connect to signaling server
  const connect = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      setConnectionError(null);

      const manager = getRoomManager();
      await manager.connect();

      setConnectionStatus('connected');
      setConnectionQuality('excellent'); // Signaling connection is good

      secureLog.log('[useRoomConnection] Connected successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Connection failed');
      secureLog.error('[useRoomConnection] Connection failed:', err);
      setConnectionStatus('error');
      setConnectionError(err.message);
      onError?.(err);
      throw err;
    }
  }, [getRoomManager, setConnectionStatus, setConnectionError, setConnectionQuality, onError]);

  // Disconnect from signaling server
  const disconnect = useCallback(() => {
    if (roomManagerRef.current) {
      roomManagerRef.current.disconnect();
      roomManagerRef.current = null;
    }
    leaveRoomStore();
    secureLog.log('[useRoomConnection] Disconnected');
  }, [leaveRoomStore]);

  // Create a new room
  const createRoom = useCallback(async (password?: string): Promise<string> => {
    try {
      setConnectionStatus('connecting');
      setConnectionError(null);

      const manager = getRoomManager();

      // Ensure connected to signaling server
      if (!manager.isConnected()) {
        await manager.connect();
      }

      // Generate secure room code
      const code = generateSecureRoomCode(8);

      // Create room
      const room = await manager.createRoom({
        ...(password !== undefined ? { password } : {}),
        expiresIn,
        maxMembers,
      });

      // Update store
      setCurrentRoom(room);
      setIsHost(true);
      joinRoomStore(room);

      secureLog.log('[useRoomConnection] Room created:', code);

      return code;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to create room');
      secureLog.error('[useRoomConnection] Create room failed:', err);
      setConnectionStatus('error');
      setConnectionError(err.message);
      onError?.(err);
      throw err;
    }
  }, [
    getRoomManager,
    expiresIn,
    maxMembers,
    setConnectionStatus,
    setConnectionError,
    setCurrentRoom,
    setIsHost,
    joinRoomStore,
    onError,
  ]);

  // Join an existing room by code
  const joinRoom = useCallback(async (code: string, password?: string): Promise<void> => {
    try {
      setConnectionStatus('joining');
      setConnectionError(null);

      const manager = getRoomManager();

      // Ensure connected to signaling server
      if (!manager.isConnected()) {
        await manager.connect();
      }

      // Join room
      const room = await manager.joinRoom(code, password);

      // Update store
      setCurrentRoom(room);
      setIsHost(false);
      joinRoomStore(room);

      secureLog.log('[useRoomConnection] Joined room:', code);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to join room');
      secureLog.error('[useRoomConnection] Join room failed:', err);
      setConnectionStatus('error');
      setConnectionError(err.message);
      onError?.(err);
      throw err;
    }
  }, [
    getRoomManager,
    setConnectionStatus,
    setConnectionError,
    setCurrentRoom,
    setIsHost,
    joinRoomStore,
    onError,
  ]);

  // Leave current room
  const leaveRoom = useCallback(() => {
    if (roomManagerRef.current) {
      roomManagerRef.current.leaveRoom();
    }
    leaveRoomStore();
    secureLog.log('[useRoomConnection] Left room');
  }, [leaveRoomStore]);

  // Get shareable room URL
  const getRoomUrl = useCallback((): string => {
    if (roomManagerRef.current) {
      return roomManagerRef.current.getRoomUrl();
    }
    return '';
  }, []);

  // Check if room is encrypted
  const isRoomEncrypted = useCallback((): boolean => {
    if (roomManagerRef.current) {
      return roomManagerRef.current.isRoomEncrypted();
    }
    return false;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect().catch((error) => {
        secureLog.error('[useRoomConnection] Auto-connect failed:', error);
      });
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);  

  // Monitor connection quality based on member updates
  useEffect(() => {
    if (connectionStatus === 'in-room' && memberCount > 0) {
      // Simple heuristic: excellent if we have members
      setConnectionQuality('excellent');
    } else if (connectionStatus === 'connected') {
      setConnectionQuality('good');
    } else if (connectionStatus === 'error') {
      setConnectionQuality('poor');
    }
  }, [connectionStatus, memberCount, setConnectionQuality]);

  return {
    // Connection state
    isConnected: connectionStatus === 'connected' || connectionStatus === 'in-room',
    isInRoom: connectionStatus === 'in-room',
    connectionStatus,
    connectionError,
    connectionQuality,

    // Room state
    currentRoom,
    roomCode,
    isHost,
    members,
    memberCount,

    // Actions
    connect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,

    // Utility
    getRoomUrl,
    isRoomEncrypted,
  };
}
