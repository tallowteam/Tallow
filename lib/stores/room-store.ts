'use client';

/**
 * Room Store
 * Manages room state for internet P2P transfers via room codes
 */

import { create } from 'zustand';
import type { RoomMember, TransferRoom } from '@/lib/rooms/transfer-room-manager';

export type RoomConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'joining'
  | 'in-room'
  | 'error';

export interface RoomStoreState {
  // Connection state
  connectionStatus: RoomConnectionStatus;
  connectionError: string | null;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | null;

  // Current room
  currentRoom: TransferRoom | null;
  roomCode: string | null;
  isHost: boolean;

  // Room members
  members: RoomMember[];
  memberCount: number;

  // Actions
  setConnectionStatus: (status: RoomConnectionStatus) => void;
  setConnectionError: (error: string | null) => void;
  setConnectionQuality: (quality: 'excellent' | 'good' | 'fair' | 'poor' | null) => void;

  setCurrentRoom: (room: TransferRoom | null) => void;
  setRoomCode: (code: string | null) => void;
  setIsHost: (isHost: boolean) => void;

  setMembers: (members: RoomMember[]) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (memberId: string) => void;
  updateMember: (memberId: string, updates: Partial<RoomMember>) => void;

  // Composite actions
  joinRoom: (room: TransferRoom) => void;
  leaveRoom: () => void;
  reset: () => void;
}

const initialState = {
  connectionStatus: 'disconnected' as RoomConnectionStatus,
  connectionError: null,
  connectionQuality: null,
  currentRoom: null,
  roomCode: null,
  isHost: false,
  members: [],
  memberCount: 0,
};

export const useRoomStore = create<RoomStoreState>((set) => ({
  ...initialState,

  // Connection status
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setConnectionError: (error) => set({ connectionError: error }),
  setConnectionQuality: (quality) => set({ connectionQuality: quality }),

  // Room
  setCurrentRoom: (room) => set({
    currentRoom: room,
    roomCode: room?.code ?? null,
    members: room ? Array.from(room.members.values()) : [],
    memberCount: room?.members.size ?? 0,
  }),
  setRoomCode: (code) => set({ roomCode: code }),
  setIsHost: (isHost) => set({ isHost }),

  // Members
  setMembers: (members) => set({
    members,
    memberCount: members.length,
  }),
  addMember: (member) => set((state) => ({
    members: [...state.members, member],
    memberCount: state.memberCount + 1,
  })),
  removeMember: (memberId) => set((state) => ({
    members: state.members.filter(m => m.id !== memberId),
    memberCount: Math.max(0, state.memberCount - 1),
  })),
  updateMember: (memberId, updates) => set((state) => ({
    members: state.members.map(m =>
      m.id === memberId ? { ...m, ...updates } : m
    ),
  })),

  // Composite actions
  joinRoom: (room) => set({
    currentRoom: room,
    roomCode: room.code,
    connectionStatus: 'in-room',
    members: Array.from(room.members.values()),
    memberCount: room.members.size,
    connectionError: null,
  }),
  leaveRoom: () => set({
    ...initialState,
  }),
  reset: () => set(initialState),
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectConnectionStatus = (state: RoomStoreState) => state.connectionStatus;
export const selectIsConnected = (state: RoomStoreState) =>
  state.connectionStatus === 'connected' || state.connectionStatus === 'in-room';
export const selectIsInRoom = (state: RoomStoreState) => state.connectionStatus === 'in-room';
export const selectConnectionError = (state: RoomStoreState) => state.connectionError;
export const selectConnectionQuality = (state: RoomStoreState) => state.connectionQuality;

export const selectCurrentRoom = (state: RoomStoreState) => state.currentRoom;
export const selectRoomCode = (state: RoomStoreState) => state.roomCode;
export const selectIsHost = (state: RoomStoreState) => state.isHost;

export const selectMembers = (state: RoomStoreState) => state.members;
export const selectMemberCount = (state: RoomStoreState) => state.memberCount;
export const selectOnlineMembers = (state: RoomStoreState) =>
  state.members.filter(m => m.isOnline);
export const selectHostMember = (state: RoomStoreState) =>
  state.members.find(m => m.isOwner);
