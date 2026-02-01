'use client';

/**
 * React Hook for Transfer Room Management
 * Provides state and methods for managing transfer rooms
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { TransferRoomManager, TransferRoom, RoomMember, RoomConfig } from '../rooms/transfer-room-manager';
import { getDeviceId } from '../auth/user-identity';
import secureLog from '../utils/secure-logger';
import { toAppError } from '../utils/error-handling';

export interface UseTransferRoomState {
  room: TransferRoom | null;
  members: RoomMember[];
  isConnected: boolean;
  isOwner: boolean;
  isInRoom: boolean;
  error: string | null;
}

export function useTransferRoom(deviceName: string) {
  const [state, setState] = useState<UseTransferRoomState>({
    room: null,
    members: [],
    isConnected: false,
    isOwner: false,
    isInRoom: false,
    error: null,
  });

  const managerRef = useRef<TransferRoomManager | null>(null);
  const deviceId = getDeviceId();

  // Initialize manager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new TransferRoomManager(deviceId, deviceName);

      // Setup event handlers
      managerRef.current.onConnectionReady(() => {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      });

      managerRef.current.onMemberJoined((member) => {
        secureLog.log('[Room Hook] Member joined:', member.deviceName);
        updateMembers();
      });

      managerRef.current.onMemberLeft((memberId) => {
        secureLog.log('[Room Hook] Member left:', memberId);
        updateMembers();
      });

      managerRef.current.onFileOffer((offer) => {
        secureLog.log('[Room Hook] File offer received:', offer.fileName);
      });

      managerRef.current.onRoomClosed(() => {
        secureLog.log('[Room Hook] Room closed by owner');
        setState(prev => ({
          ...prev,
          room: null,
          members: [],
          isInRoom: false,
          isOwner: false,
          error: 'Room has been closed by the owner',
        }));
      });

      managerRef.current.onMembersUpdated((members) => {
        setState(prev => ({ ...prev, members }));
      });

      // Connect to signaling server
      managerRef.current.connect().catch((error) => {
        secureLog.error('[Room Hook] Connection failed:', error);
        setState(prev => ({ ...prev, error: error.message }));
      });
    }

    return () => {
      managerRef.current?.disconnect();
      managerRef.current = null;
    };
  }, [deviceId, deviceName]);

  const updateMembers = useCallback(() => {
    if (managerRef.current) {
      const members = managerRef.current.getRoomMembers();
      const room = managerRef.current.getCurrentRoom();
      const isOwner = managerRef.current.isOwner();
      setState(prev => ({
        ...prev,
        members,
        room,
        isOwner,
      }));
    }
  }, []);

  const createRoom = useCallback(async (config: RoomConfig = {}) => {
    if (!managerRef.current) {
      throw new Error('Room manager not initialized');
    }

    try {
      const room = await managerRef.current.createRoom(config);
      setState(prev => ({
        ...prev,
        room,
        members: Array.from(room.members.values()),
        isInRoom: true,
        isOwner: true,
        error: null,
      }));
      return room;
    } catch (error: unknown) {
      const appError = toAppError(error, {
        operation: 'room-creation',
        component: 'useTransferRoom',
      });
      setState(prev => ({ ...prev, error: appError.message }));
      throw appError;
    }
  }, []);

  const joinRoom = useCallback(async (code: string, password?: string) => {
    if (!managerRef.current) {
      throw new Error('Room manager not initialized');
    }

    try {
      const room = await managerRef.current.joinRoom(code, password);
      setState(prev => ({
        ...prev,
        room,
        members: Array.from(room.members.values()),
        isInRoom: true,
        isOwner: false,
        error: null,
      }));
      return room;
    } catch (error: unknown) {
      const appError = toAppError(error, {
        operation: 'room-join',
        component: 'useTransferRoom',
      });
      setState(prev => ({ ...prev, error: appError.message }));
      throw appError;
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.leaveRoom();
      setState(prev => ({
        ...prev,
        room: null,
        members: [],
        isInRoom: false,
        isOwner: false,
      }));
    }
  }, []);

  const closeRoom = useCallback(() => {
    if (!managerRef.current) {return;}

    try {
      managerRef.current.closeRoom();
      setState(prev => ({
        ...prev,
        room: null,
        members: [],
        isInRoom: false,
        isOwner: false,
      }));
    } catch (error: unknown) {
      const appError = toAppError(error, {
        operation: 'room-close',
        component: 'useTransferRoom',
      });
      setState(prev => ({ ...prev, error: appError.message }));
    }
  }, []);

  const broadcastFileOffer = useCallback((fileName: string, fileSize: number) => {
    if (!managerRef.current) {
      throw new Error('Not in a room');
    }
    managerRef.current.broadcastFileOffer(fileName, fileSize);
  }, []);

  const getRoomUrl = useCallback(() => {
    return managerRef.current?.getRoomUrl() || '';
  }, []);

  return {
    ...state,
    createRoom,
    joinRoom,
    leaveRoom,
    closeRoom,
    broadcastFileOffer,
    getRoomUrl,
  };
}
