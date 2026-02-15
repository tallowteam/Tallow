/**
 * Room Store Unit Tests
 *
 * Tests the room store Zustand implementation including:
 * - Initial state
 * - Connection status management
 * - Room management (join, leave, reset)
 * - Member management (add, remove, update)
 * - Connection quality tracking
 * - Room state transitions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useRoomStore } from '@/lib/stores/room-store';
import type { RoomMember, TransferRoom } from '@/lib/rooms/transfer-room-manager';

describe('RoomStore', () => {
  // Helper to create mock room member
  const createMockMember = (overrides?: Partial<RoomMember>): RoomMember => ({
    id: `member-${Math.random().toString(36).substring(2, 9)}`,
    name: 'Test Member',
    platform: 'windows',
    isOwner: false,
    isOnline: true,
    joinedAt: Date.now(),
    lastSeenAt: Date.now(),
    ...overrides,
  });

  // Helper to create mock transfer room
  const createMockRoom = (overrides?: Partial<TransferRoom>): TransferRoom => {
    const members = new Map<string, RoomMember>();
    const member1 = createMockMember({ id: 'member-1', isOwner: true });
    const member2 = createMockMember({ id: 'member-2' });
    members.set('member-1', member1);
    members.set('member-2', member2);

    return {
      code: 'ROOM1234',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      members,
      maxMembers: 10,
      isActive: true,
      ...overrides,
    };
  };

  // Reset store state before each test
  beforeEach(() => {
    useRoomStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have disconnected status', () => {
      const state = useRoomStore.getState();
      expect(state.connectionStatus).toBe('disconnected');
    });

    it('should have no connection error', () => {
      const state = useRoomStore.getState();
      expect(state.connectionError).toBeNull();
    });

    it('should have no connection quality', () => {
      const state = useRoomStore.getState();
      expect(state.connectionQuality).toBeNull();
    });

    it('should have no current room', () => {
      const state = useRoomStore.getState();
      expect(state.currentRoom).toBeNull();
      expect(state.roomCode).toBeNull();
    });

    it('should not be host', () => {
      const state = useRoomStore.getState();
      expect(state.isHost).toBe(false);
    });

    it('should have empty members list', () => {
      const state = useRoomStore.getState();
      expect(state.members).toEqual([]);
      expect(state.memberCount).toBe(0);
    });
  });

  describe('Connection Status Management', () => {
    describe('setConnectionStatus', () => {
      it('should set disconnected status', () => {
        useRoomStore.getState().setConnectionStatus('disconnected');

        const state = useRoomStore.getState();
        expect(state.connectionStatus).toBe('disconnected');
      });

      it('should set connecting status', () => {
        useRoomStore.getState().setConnectionStatus('connecting');

        const state = useRoomStore.getState();
        expect(state.connectionStatus).toBe('connecting');
      });

      it('should set connected status', () => {
        useRoomStore.getState().setConnectionStatus('connected');

        const state = useRoomStore.getState();
        expect(state.connectionStatus).toBe('connected');
      });

      it('should set joining status', () => {
        useRoomStore.getState().setConnectionStatus('joining');

        const state = useRoomStore.getState();
        expect(state.connectionStatus).toBe('joining');
      });

      it('should set in-room status', () => {
        useRoomStore.getState().setConnectionStatus('in-room');

        const state = useRoomStore.getState();
        expect(state.connectionStatus).toBe('in-room');
      });

      it('should set error status', () => {
        useRoomStore.getState().setConnectionStatus('error');

        const state = useRoomStore.getState();
        expect(state.connectionStatus).toBe('error');
      });
    });

    describe('setConnectionError', () => {
      it('should set connection error', () => {
        useRoomStore.getState().setConnectionError('Connection failed');

        const state = useRoomStore.getState();
        expect(state.connectionError).toBe('Connection failed');
      });

      it('should clear connection error', () => {
        useRoomStore.getState().setConnectionError('Connection failed');
        useRoomStore.getState().setConnectionError(null);

        const state = useRoomStore.getState();
        expect(state.connectionError).toBeNull();
      });
    });

    describe('setConnectionQuality', () => {
      it('should set excellent quality', () => {
        useRoomStore.getState().setConnectionQuality('excellent');

        const state = useRoomStore.getState();
        expect(state.connectionQuality).toBe('excellent');
      });

      it('should set good quality', () => {
        useRoomStore.getState().setConnectionQuality('good');

        const state = useRoomStore.getState();
        expect(state.connectionQuality).toBe('good');
      });

      it('should set fair quality', () => {
        useRoomStore.getState().setConnectionQuality('fair');

        const state = useRoomStore.getState();
        expect(state.connectionQuality).toBe('fair');
      });

      it('should set poor quality', () => {
        useRoomStore.getState().setConnectionQuality('poor');

        const state = useRoomStore.getState();
        expect(state.connectionQuality).toBe('poor');
      });

      it('should clear quality', () => {
        useRoomStore.getState().setConnectionQuality('good');
        useRoomStore.getState().setConnectionQuality(null);

        const state = useRoomStore.getState();
        expect(state.connectionQuality).toBeNull();
      });
    });
  });

  describe('Room Management', () => {
    describe('setCurrentRoom', () => {
      it('should set current room', () => {
        const room = createMockRoom();
        useRoomStore.getState().setCurrentRoom(room);

        const state = useRoomStore.getState();
        expect(state.currentRoom).toEqual(room);
      });

      it('should extract room code', () => {
        const room = createMockRoom({ code: 'TEST5678' });
        useRoomStore.getState().setCurrentRoom(room);

        const state = useRoomStore.getState();
        expect(state.roomCode).toBe('TEST5678');
      });

      it('should convert members map to array', () => {
        const room = createMockRoom();
        useRoomStore.getState().setCurrentRoom(room);

        const state = useRoomStore.getState();
        expect(state.members).toHaveLength(2);
        expect(Array.isArray(state.members)).toBe(true);
      });

      it('should set member count', () => {
        const room = createMockRoom();
        useRoomStore.getState().setCurrentRoom(room);

        const state = useRoomStore.getState();
        expect(state.memberCount).toBe(2);
      });

      it('should clear room when null is passed', () => {
        const room = createMockRoom();
        useRoomStore.getState().setCurrentRoom(room);
        useRoomStore.getState().setCurrentRoom(null);

        const state = useRoomStore.getState();
        expect(state.currentRoom).toBeNull();
        expect(state.roomCode).toBeNull();
        expect(state.members).toEqual([]);
        expect(state.memberCount).toBe(0);
      });
    });

    describe('setRoomCode', () => {
      it('should set room code', () => {
        useRoomStore.getState().setRoomCode('ABCD1234');

        const state = useRoomStore.getState();
        expect(state.roomCode).toBe('ABCD1234');
      });

      it('should clear room code', () => {
        useRoomStore.getState().setRoomCode('ABCD1234');
        useRoomStore.getState().setRoomCode(null);

        const state = useRoomStore.getState();
        expect(state.roomCode).toBeNull();
      });
    });

    describe('setIsHost', () => {
      it('should set host flag to true', () => {
        useRoomStore.getState().setIsHost(true);

        const state = useRoomStore.getState();
        expect(state.isHost).toBe(true);
      });

      it('should set host flag to false', () => {
        useRoomStore.getState().setIsHost(true);
        useRoomStore.getState().setIsHost(false);

        const state = useRoomStore.getState();
        expect(state.isHost).toBe(false);
      });
    });

    describe('joinRoom', () => {
      it('should set room and update status', () => {
        const room = createMockRoom({ code: 'JOINED99' });
        useRoomStore.getState().joinRoom(room);

        const state = useRoomStore.getState();
        expect(state.currentRoom).toEqual(room);
        expect(state.roomCode).toBe('JOINED99');
        expect(state.connectionStatus).toBe('in-room');
      });

      it('should clear connection error', () => {
        useRoomStore.getState().setConnectionError('Previous error');

        const room = createMockRoom();
        useRoomStore.getState().joinRoom(room);

        const state = useRoomStore.getState();
        expect(state.connectionError).toBeNull();
      });

      it('should set members from room', () => {
        const room = createMockRoom();
        useRoomStore.getState().joinRoom(room);

        const state = useRoomStore.getState();
        expect(state.members).toHaveLength(2);
        expect(state.memberCount).toBe(2);
      });
    });

    describe('leaveRoom', () => {
      it('should reset room state', () => {
        const room = createMockRoom();
        useRoomStore.getState().joinRoom(room);

        useRoomStore.getState().leaveRoom();

        const state = useRoomStore.getState();
        expect(state.currentRoom).toBeNull();
        expect(state.roomCode).toBeNull();
        expect(state.connectionStatus).toBe('disconnected');
        expect(state.members).toEqual([]);
        expect(state.memberCount).toBe(0);
      });

      it('should reset connection quality', () => {
        const room = createMockRoom();
        useRoomStore.getState().joinRoom(room);
        useRoomStore.getState().setConnectionQuality('good');

        useRoomStore.getState().leaveRoom();

        const state = useRoomStore.getState();
        expect(state.connectionQuality).toBeNull();
      });

      it('should clear error', () => {
        const room = createMockRoom();
        useRoomStore.getState().joinRoom(room);
        useRoomStore.getState().setConnectionError('Some error');

        useRoomStore.getState().leaveRoom();

        const state = useRoomStore.getState();
        expect(state.connectionError).toBeNull();
      });
    });

    describe('reset', () => {
      it('should reset all state to initial values', () => {
        const room = createMockRoom();
        useRoomStore.getState().joinRoom(room);
        useRoomStore.getState().setConnectionQuality('excellent');
        useRoomStore.getState().setIsHost(true);

        useRoomStore.getState().reset();

        const state = useRoomStore.getState();
        expect(state.connectionStatus).toBe('disconnected');
        expect(state.connectionError).toBeNull();
        expect(state.connectionQuality).toBeNull();
        expect(state.currentRoom).toBeNull();
        expect(state.roomCode).toBeNull();
        expect(state.isHost).toBe(false);
        expect(state.members).toEqual([]);
        expect(state.memberCount).toBe(0);
      });
    });
  });

  describe('Member Management', () => {
    describe('setMembers', () => {
      it('should set members array', () => {
        const members = [
          createMockMember({ id: 'member-1' }),
          createMockMember({ id: 'member-2' }),
        ];

        useRoomStore.getState().setMembers(members);

        const state = useRoomStore.getState();
        expect(state.members).toEqual(members);
        expect(state.memberCount).toBe(2);
      });

      it('should update member count', () => {
        const members = [createMockMember(), createMockMember(), createMockMember()];

        useRoomStore.getState().setMembers(members);

        const state = useRoomStore.getState();
        expect(state.memberCount).toBe(3);
      });

      it('should clear members when empty array is passed', () => {
        const members = [createMockMember()];
        useRoomStore.getState().setMembers(members);

        useRoomStore.getState().setMembers([]);

        const state = useRoomStore.getState();
        expect(state.members).toEqual([]);
        expect(state.memberCount).toBe(0);
      });
    });

    describe('addMember', () => {
      it('should add member to list', () => {
        const member = createMockMember({ id: 'member-1', name: 'New Member' });

        useRoomStore.getState().addMember(member);

        const state = useRoomStore.getState();
        expect(state.members).toHaveLength(1);
        expect(state.members[0]).toEqual(member);
      });

      it('should increment member count', () => {
        const member = createMockMember();

        useRoomStore.getState().addMember(member);

        const state = useRoomStore.getState();
        expect(state.memberCount).toBe(1);
      });

      it('should add multiple members', () => {
        const member1 = createMockMember({ id: 'member-1' });
        const member2 = createMockMember({ id: 'member-2' });

        useRoomStore.getState().addMember(member1);
        useRoomStore.getState().addMember(member2);

        const state = useRoomStore.getState();
        expect(state.members).toHaveLength(2);
        expect(state.memberCount).toBe(2);
      });
    });

    describe('removeMember', () => {
      it('should remove member from list', () => {
        const member1 = createMockMember({ id: 'member-1' });
        const member2 = createMockMember({ id: 'member-2' });

        useRoomStore.getState().addMember(member1);
        useRoomStore.getState().addMember(member2);

        useRoomStore.getState().removeMember('member-1');

        const state = useRoomStore.getState();
        expect(state.members).toHaveLength(1);
        expect(state.members[0]?.id).toBe('member-2');
      });

      it('should decrement member count', () => {
        const member = createMockMember({ id: 'member-1' });
        useRoomStore.getState().addMember(member);

        useRoomStore.getState().removeMember('member-1');

        const state = useRoomStore.getState();
        expect(state.memberCount).toBe(0);
      });

      it('should not go below zero member count', () => {
        useRoomStore.getState().removeMember('non-existent');

        const state = useRoomStore.getState();
        expect(state.memberCount).toBe(0);
      });

      it('should handle removing non-existent member', () => {
        const member = createMockMember({ id: 'member-1' });
        useRoomStore.getState().addMember(member);

        useRoomStore.getState().removeMember('non-existent');

        const state = useRoomStore.getState();
        expect(state.members).toHaveLength(1);
        expect(state.members[0]?.id).toBe('member-1');
      });
    });

    describe('updateMember', () => {
      it('should update member properties', () => {
        const member = createMockMember({
          id: 'member-1',
          name: 'Original Name',
          isOnline: true,
        });
        useRoomStore.getState().addMember(member);

        useRoomStore.getState().updateMember('member-1', {
          name: 'Updated Name',
          isOnline: false,
        });

        const state = useRoomStore.getState();
        expect(state.members[0]?.name).toBe('Updated Name');
        expect(state.members[0]?.isOnline).toBe(false);
      });

      it('should preserve other properties', () => {
        const member = createMockMember({
          id: 'member-1',
          name: 'Test',
          platform: 'windows',
          isOwner: true,
        });
        useRoomStore.getState().addMember(member);

        useRoomStore.getState().updateMember('member-1', { name: 'Updated' });

        const state = useRoomStore.getState();
        expect(state.members[0]?.platform).toBe('windows');
        expect(state.members[0]?.isOwner).toBe(true);
      });

      it('should not affect other members', () => {
        const member1 = createMockMember({ id: 'member-1', name: 'Member 1' });
        const member2 = createMockMember({ id: 'member-2', name: 'Member 2' });

        useRoomStore.getState().addMember(member1);
        useRoomStore.getState().addMember(member2);

        useRoomStore.getState().updateMember('member-1', { name: 'Updated' });

        const state = useRoomStore.getState();
        expect(state.members[1]?.name).toBe('Member 2');
      });

      it('should handle updating non-existent member', () => {
        const member = createMockMember({ id: 'member-1', name: 'Test' });
        useRoomStore.getState().addMember(member);

        useRoomStore.getState().updateMember('non-existent', { name: 'Updated' });

        const state = useRoomStore.getState();
        expect(state.members[0]?.name).toBe('Test');
      });
    });
  });

  describe('State Transitions', () => {
    it('should transition from disconnected to connecting', () => {
      useRoomStore.getState().setConnectionStatus('disconnected');
      useRoomStore.getState().setConnectionStatus('connecting');

      const state = useRoomStore.getState();
      expect(state.connectionStatus).toBe('connecting');
    });

    it('should transition from connecting to connected', () => {
      useRoomStore.getState().setConnectionStatus('connecting');
      useRoomStore.getState().setConnectionStatus('connected');

      const state = useRoomStore.getState();
      expect(state.connectionStatus).toBe('connected');
    });

    it('should transition from connected to joining', () => {
      useRoomStore.getState().setConnectionStatus('connected');
      useRoomStore.getState().setConnectionStatus('joining');

      const state = useRoomStore.getState();
      expect(state.connectionStatus).toBe('joining');
    });

    it('should transition to in-room via joinRoom', () => {
      const room = createMockRoom();
      useRoomStore.getState().setConnectionStatus('joining');
      useRoomStore.getState().joinRoom(room);

      const state = useRoomStore.getState();
      expect(state.connectionStatus).toBe('in-room');
    });

    it('should transition to disconnected via leaveRoom', () => {
      const room = createMockRoom();
      useRoomStore.getState().joinRoom(room);
      useRoomStore.getState().leaveRoom();

      const state = useRoomStore.getState();
      expect(state.connectionStatus).toBe('disconnected');
    });

    it('should transition to error on connection failure', () => {
      useRoomStore.getState().setConnectionStatus('connecting');
      useRoomStore.getState().setConnectionStatus('error');
      useRoomStore.getState().setConnectionError('Connection timeout');

      const state = useRoomStore.getState();
      expect(state.connectionStatus).toBe('error');
      expect(state.connectionError).toBe('Connection timeout');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle complete room lifecycle', () => {
      // Start disconnected
      expect(useRoomStore.getState().connectionStatus).toBe('disconnected');

      // Start connecting
      useRoomStore.getState().setConnectionStatus('connecting');
      expect(useRoomStore.getState().connectionStatus).toBe('connecting');

      // Connected to server
      useRoomStore.getState().setConnectionStatus('connected');
      expect(useRoomStore.getState().connectionStatus).toBe('connected');

      // Joining room
      useRoomStore.getState().setConnectionStatus('joining');
      expect(useRoomStore.getState().connectionStatus).toBe('joining');

      // Successfully joined
      const room = createMockRoom();
      useRoomStore.getState().joinRoom(room);

      const joinState = useRoomStore.getState();
      expect(joinState.connectionStatus).toBe('in-room');
      expect(joinState.currentRoom).toEqual(room);
      expect(joinState.memberCount).toBe(2);

      // Leave room
      useRoomStore.getState().leaveRoom();

      const leaveState = useRoomStore.getState();
      expect(leaveState.connectionStatus).toBe('disconnected');
      expect(leaveState.currentRoom).toBeNull();
      expect(leaveState.memberCount).toBe(0);
    });

    it('should handle member join/leave during session', () => {
      const room = createMockRoom();
      useRoomStore.getState().joinRoom(room);

      // Member joins
      const newMember = createMockMember({ id: 'member-3', name: 'New Member' });
      useRoomStore.getState().addMember(newMember);

      let state = useRoomStore.getState();
      expect(state.memberCount).toBe(3);

      // Member leaves
      useRoomStore.getState().removeMember('member-2');

      state = useRoomStore.getState();
      expect(state.memberCount).toBe(2);
    });

    it('should handle connection quality degradation', () => {
      const room = createMockRoom();
      useRoomStore.getState().joinRoom(room);

      useRoomStore.getState().setConnectionQuality('excellent');
      expect(useRoomStore.getState().connectionQuality).toBe('excellent');

      useRoomStore.getState().setConnectionQuality('good');
      expect(useRoomStore.getState().connectionQuality).toBe('good');

      useRoomStore.getState().setConnectionQuality('fair');
      expect(useRoomStore.getState().connectionQuality).toBe('fair');

      useRoomStore.getState().setConnectionQuality('poor');
      expect(useRoomStore.getState().connectionQuality).toBe('poor');
    });

    it('should handle host transfer', () => {
      const room = createMockRoom();
      useRoomStore.getState().joinRoom(room);
      useRoomStore.getState().setIsHost(false);

      // Current host leaves, we become host
      useRoomStore.getState().removeMember('member-1');
      useRoomStore.getState().setIsHost(true);

      const state = useRoomStore.getState();
      expect(state.isHost).toBe(true);
      expect(state.memberCount).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle setting null room when no room exists', () => {
      useRoomStore.getState().setCurrentRoom(null);

      const state = useRoomStore.getState();
      expect(state.currentRoom).toBeNull();
    });

    it('should handle leaving room when not in room', () => {
      useRoomStore.getState().leaveRoom();

      const state = useRoomStore.getState();
      expect(state.connectionStatus).toBe('disconnected');
    });

    it('should handle adding duplicate members', () => {
      const member = createMockMember({ id: 'member-1', name: 'Test' });

      useRoomStore.getState().addMember(member);
      useRoomStore.getState().addMember(member);

      const state = useRoomStore.getState();
      // Both members are added (no deduplication in current implementation)
      expect(state.memberCount).toBe(2);
    });

    it('should handle empty members map in room', () => {
      const room = createMockRoom({ members: new Map() });

      useRoomStore.getState().setCurrentRoom(room);

      const state = useRoomStore.getState();
      expect(state.members).toEqual([]);
      expect(state.memberCount).toBe(0);
    });

    it('should handle rapid status changes', () => {
      useRoomStore.getState().setConnectionStatus('connecting');
      useRoomStore.getState().setConnectionStatus('connected');
      useRoomStore.getState().setConnectionStatus('disconnected');
      useRoomStore.getState().setConnectionStatus('connecting');

      const state = useRoomStore.getState();
      expect(state.connectionStatus).toBe('connecting');
    });
  });
});
