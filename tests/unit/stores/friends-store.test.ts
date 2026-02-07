/**
 * Friends Store Unit Tests
 *
 * Tests the friends store Zustand implementation including:
 * - Initial state
 * - Friend management (add, update, remove)
 * - Friend status updates (online/offline, trusted)
 * - Pending requests
 * - Pairing code generation and validation
 * - Block list management
 * - Friend search and filtering
 * - Transfer count tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFriendsStore } from '@/lib/stores/friends-store';
import type { Friend, PendingRequest, PairingSession } from '@/lib/stores/friends-store';
import type { Platform } from '@/lib/types';

describe('FriendsStore', () => {
  // Helper to create mock friend
  const createMockFriend = (overrides?: Partial<Friend>): Friend => ({
    id: `friend-${Math.random().toString(36).substring(2, 9)}`,
    name: 'Test Friend',
    platform: 'windows' as Platform,
    publicKey: `pk_${Date.now()}`,
    pairingCode: 'ABCD1234',
    isOnline: false,
    lastSeen: Date.now(),
    isTrusted: false,
    avatar: null,
    addedAt: Date.now(),
    notes: null,
    transferCount: 0,
    lastTransferAt: null,
    ...overrides,
  });

  // Helper to create mock pending request
  const createMockPendingRequest = (overrides?: Partial<PendingRequest>): PendingRequest => ({
    id: `request-${Math.random().toString(36).substring(2, 9)}`,
    name: 'Requesting Device',
    platform: 'android' as Platform,
    publicKey: `pk_${Date.now()}`,
    pairingCode: 'WXYZ5678',
    requestedAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes from now
    ...overrides,
  });

  // Reset store state before each test
  beforeEach(() => {
    useFriendsStore.setState({
      friends: [],
      pendingRequests: [],
      blockedIds: [],
      currentPairingSession: null,
      isLoading: false,
      isInitialized: false,
    });
  });

  describe('Initial State', () => {
    it('should have empty friends array', () => {
      const state = useFriendsStore.getState();
      expect(state.friends).toEqual([]);
    });

    it('should have empty pending requests', () => {
      const state = useFriendsStore.getState();
      expect(state.pendingRequests).toEqual([]);
    });

    it('should have empty block list', () => {
      const state = useFriendsStore.getState();
      expect(state.blockedIds).toEqual([]);
    });

    it('should have no current pairing session', () => {
      const state = useFriendsStore.getState();
      expect(state.currentPairingSession).toBeNull();
    });

    it('should not be initialized', () => {
      const state = useFriendsStore.getState();
      expect(state.isInitialized).toBe(false);
    });
  });

  describe('Friend Management', () => {
    describe('addFriend', () => {
      it('should add a new friend', () => {
        const friend = createMockFriend({ id: 'friend-1', name: 'Friend 1' });
        useFriendsStore.getState().addFriend(friend);

        const state = useFriendsStore.getState();
        expect(state.friends).toHaveLength(1);
        expect(state.friends[0]).toEqual(friend);
      });

      it('should update existing friend when adding duplicate', () => {
        const friend1 = createMockFriend({ id: 'friend-1', name: 'Friend 1' });
        const friend2 = createMockFriend({ id: 'friend-1', name: 'Friend 1 Updated' });

        useFriendsStore.getState().addFriend(friend1);
        useFriendsStore.getState().addFriend(friend2);

        const state = useFriendsStore.getState();
        expect(state.friends).toHaveLength(1);
        expect(state.friends[0]?.name).toBe('Friend 1 Updated');
      });

      it('should add multiple different friends', () => {
        const friend1 = createMockFriend({ id: 'friend-1' });
        const friend2 = createMockFriend({ id: 'friend-2' });

        useFriendsStore.getState().addFriend(friend1);
        useFriendsStore.getState().addFriend(friend2);

        const state = useFriendsStore.getState();
        expect(state.friends).toHaveLength(2);
      });
    });

    describe('addFriendByCode', () => {
      it('should create and add a friend', () => {
        const friend = useFriendsStore.getState().addFriendByCode('CODE1234', 'New Friend', 'macos');

        const state = useFriendsStore.getState();
        expect(state.friends).toHaveLength(1);
        expect(friend.name).toBe('New Friend');
        expect(friend.platform).toBe('macos');
        expect(friend.pairingCode).toBe('CODE1234');
      });

      it('should generate unique friend ID', () => {
        const friend1 = useFriendsStore.getState().addFriendByCode('CODE1', 'Friend 1', 'windows');
        const friend2 = useFriendsStore.getState().addFriendByCode('CODE2', 'Friend 2', 'linux');

        expect(friend1.id).not.toBe(friend2.id);
      });

      it('should set default values for new friend', () => {
        const friend = useFriendsStore.getState().addFriendByCode('CODE1234', 'New Friend', 'ios');

        expect(friend.isOnline).toBe(false);
        expect(friend.isTrusted).toBe(false);
        expect(friend.transferCount).toBe(0);
        expect(friend.avatar).toBeNull();
        expect(friend.notes).toBeNull();
      });
    });

    describe('updateFriend', () => {
      it('should update friend properties', () => {
        const friend = createMockFriend({ id: 'friend-1', name: 'Original', isOnline: false });
        useFriendsStore.getState().addFriend(friend);

        useFriendsStore.getState().updateFriend('friend-1', {
          name: 'Updated',
          isOnline: true,
        });

        const state = useFriendsStore.getState();
        expect(state.friends[0]?.name).toBe('Updated');
        expect(state.friends[0]?.isOnline).toBe(true);
      });

      it('should not modify other friends', () => {
        const friend1 = createMockFriend({ id: 'friend-1', name: 'Friend 1' });
        const friend2 = createMockFriend({ id: 'friend-2', name: 'Friend 2' });

        useFriendsStore.getState().addFriend(friend1);
        useFriendsStore.getState().addFriend(friend2);

        useFriendsStore.getState().updateFriend('friend-1', { name: 'Updated' });

        const state = useFriendsStore.getState();
        expect(state.friends[0]?.name).toBe('Updated');
        expect(state.friends[1]?.name).toBe('Friend 2');
      });

      it('should handle non-existent friend gracefully', () => {
        const friend = createMockFriend({ id: 'friend-1' });
        useFriendsStore.getState().addFriend(friend);

        useFriendsStore.getState().updateFriend('non-existent', { name: 'Updated' });

        const state = useFriendsStore.getState();
        expect(state.friends).toHaveLength(1);
      });
    });

    describe('removeFriend', () => {
      it('should remove friend from list', () => {
        const friend = createMockFriend({ id: 'friend-1' });
        useFriendsStore.getState().addFriend(friend);

        useFriendsStore.getState().removeFriend('friend-1');

        const state = useFriendsStore.getState();
        expect(state.friends).toHaveLength(0);
      });

      it('should not affect other friends', () => {
        const friend1 = createMockFriend({ id: 'friend-1' });
        const friend2 = createMockFriend({ id: 'friend-2' });

        useFriendsStore.getState().addFriend(friend1);
        useFriendsStore.getState().addFriend(friend2);

        useFriendsStore.getState().removeFriend('friend-1');

        const state = useFriendsStore.getState();
        expect(state.friends).toHaveLength(1);
        expect(state.friends[0]?.id).toBe('friend-2');
      });
    });

    describe('clearFriends', () => {
      it('should remove all friends', () => {
        const friend1 = createMockFriend({ id: 'friend-1' });
        const friend2 = createMockFriend({ id: 'friend-2' });

        useFriendsStore.getState().addFriend(friend1);
        useFriendsStore.getState().addFriend(friend2);

        useFriendsStore.getState().clearFriends();

        const state = useFriendsStore.getState();
        expect(state.friends).toHaveLength(0);
      });
    });

    describe('toggleFavorite', () => {
      it('should toggle isTrusted to true', () => {
        const friend = createMockFriend({ id: 'friend-1', isTrusted: false });
        useFriendsStore.getState().addFriend(friend);

        useFriendsStore.getState().toggleFavorite('friend-1');

        const state = useFriendsStore.getState();
        expect(state.friends[0]?.isTrusted).toBe(true);
      });

      it('should toggle isTrusted to false', () => {
        const friend = createMockFriend({ id: 'friend-1', isTrusted: true });
        useFriendsStore.getState().addFriend(friend);

        useFriendsStore.getState().toggleFavorite('friend-1');

        const state = useFriendsStore.getState();
        expect(state.friends[0]?.isTrusted).toBe(false);
      });
    });
  });

  describe('Friend Status', () => {
    describe('setFriendOnline', () => {
      it('should set friend online', () => {
        const friend = createMockFriend({ id: 'friend-1', isOnline: false });
        useFriendsStore.getState().addFriend(friend);

        useFriendsStore.getState().setFriendOnline('friend-1', true);

        const state = useFriendsStore.getState();
        expect(state.friends[0]?.isOnline).toBe(true);
      });

      it('should set friend offline and update lastSeen', () => {
        const friend = createMockFriend({ id: 'friend-1', isOnline: true, lastSeen: 1000 });
        useFriendsStore.getState().addFriend(friend);

        const beforeTime = Date.now();
        useFriendsStore.getState().setFriendOnline('friend-1', false);
        const afterTime = Date.now();

        const state = useFriendsStore.getState();
        expect(state.friends[0]?.isOnline).toBe(false);
        expect(state.friends[0]?.lastSeen).toBeGreaterThanOrEqual(beforeTime);
        expect(state.friends[0]?.lastSeen).toBeLessThanOrEqual(afterTime);
      });

      it('should preserve lastSeen when going online', () => {
        const lastSeen = Date.now() - 10000;
        const friend = createMockFriend({ id: 'friend-1', isOnline: false, lastSeen });
        useFriendsStore.getState().addFriend(friend);

        useFriendsStore.getState().setFriendOnline('friend-1', true);

        const state = useFriendsStore.getState();
        expect(state.friends[0]?.lastSeen).toBe(lastSeen);
      });
    });

    describe('setFriendTrusted', () => {
      it('should set friend as trusted', () => {
        const friend = createMockFriend({ id: 'friend-1', isTrusted: false });
        useFriendsStore.getState().addFriend(friend);

        useFriendsStore.getState().setFriendTrusted('friend-1', true);

        const state = useFriendsStore.getState();
        expect(state.friends[0]?.isTrusted).toBe(true);
      });

      it('should set friend as untrusted', () => {
        const friend = createMockFriend({ id: 'friend-1', isTrusted: true });
        useFriendsStore.getState().addFriend(friend);

        useFriendsStore.getState().setFriendTrusted('friend-1', false);

        const state = useFriendsStore.getState();
        expect(state.friends[0]?.isTrusted).toBe(false);
      });
    });

    describe('updateFriendLastSeen', () => {
      it('should update lastSeen timestamp', () => {
        const friend = createMockFriend({ id: 'friend-1', lastSeen: 1000 });
        useFriendsStore.getState().addFriend(friend);

        const beforeTime = Date.now();
        useFriendsStore.getState().updateFriendLastSeen('friend-1');
        const afterTime = Date.now();

        const state = useFriendsStore.getState();
        expect(state.friends[0]?.lastSeen).toBeGreaterThanOrEqual(beforeTime);
        expect(state.friends[0]?.lastSeen).toBeLessThanOrEqual(afterTime);
      });
    });

    describe('incrementTransferCount', () => {
      it('should increment transfer count', () => {
        const friend = createMockFriend({ id: 'friend-1', transferCount: 0 });
        useFriendsStore.getState().addFriend(friend);

        useFriendsStore.getState().incrementTransferCount('friend-1');

        const state = useFriendsStore.getState();
        expect(state.friends[0]?.transferCount).toBe(1);
      });

      it('should update lastTransferAt', () => {
        const friend = createMockFriend({ id: 'friend-1', lastTransferAt: null });
        useFriendsStore.getState().addFriend(friend);

        const beforeTime = Date.now();
        useFriendsStore.getState().incrementTransferCount('friend-1');
        const afterTime = Date.now();

        const state = useFriendsStore.getState();
        expect(state.friends[0]?.lastTransferAt).toBeGreaterThanOrEqual(beforeTime);
        expect(state.friends[0]?.lastTransferAt).toBeLessThanOrEqual(afterTime);
      });

      it('should increment multiple times', () => {
        const friend = createMockFriend({ id: 'friend-1', transferCount: 0 });
        useFriendsStore.getState().addFriend(friend);

        useFriendsStore.getState().incrementTransferCount('friend-1');
        useFriendsStore.getState().incrementTransferCount('friend-1');
        useFriendsStore.getState().incrementTransferCount('friend-1');

        const state = useFriendsStore.getState();
        expect(state.friends[0]?.transferCount).toBe(3);
      });
    });
  });

  describe('Pending Requests', () => {
    describe('addPendingRequest', () => {
      it('should add a pending request', () => {
        const request = createMockPendingRequest();
        useFriendsStore.getState().addPendingRequest(request);

        const state = useFriendsStore.getState();
        expect(state.pendingRequests).toHaveLength(1);
        expect(state.pendingRequests[0]).toEqual(request);
      });

      it('should update existing request', () => {
        const request1 = createMockPendingRequest({ id: 'request-1', name: 'Request 1' });
        const request2 = createMockPendingRequest({ id: 'request-1', name: 'Request 1 Updated' });

        useFriendsStore.getState().addPendingRequest(request1);
        useFriendsStore.getState().addPendingRequest(request2);

        const state = useFriendsStore.getState();
        expect(state.pendingRequests).toHaveLength(1);
        expect(state.pendingRequests[0]?.name).toBe('Request 1 Updated');
      });

      it('should filter out expired requests', () => {
        const expired = createMockPendingRequest({
          id: 'request-1',
          expiresAt: Date.now() - 1000, // Expired
        });
        const valid = createMockPendingRequest({
          id: 'request-2',
          expiresAt: Date.now() + 300000, // Valid
        });

        useFriendsStore.getState().addPendingRequest(expired);
        useFriendsStore.getState().addPendingRequest(valid);

        const state = useFriendsStore.getState();
        expect(state.pendingRequests).toHaveLength(1);
        expect(state.pendingRequests[0]?.id).toBe('request-2');
      });
    });

    describe('acceptRequest', () => {
      it('should convert request to friend', () => {
        const request = createMockPendingRequest({
          id: 'request-1',
          name: 'New Friend',
          platform: 'linux',
        });
        useFriendsStore.getState().addPendingRequest(request);

        const friend = useFriendsStore.getState().acceptRequest('request-1');

        expect(friend).not.toBeNull();
        expect(friend?.name).toBe('New Friend');
        expect(friend?.platform).toBe('linux');

        const state = useFriendsStore.getState();
        expect(state.friends).toHaveLength(1);
        expect(state.pendingRequests).toHaveLength(0);
      });

      it('should set friend as online when accepted', () => {
        const request = createMockPendingRequest({ id: 'request-1' });
        useFriendsStore.getState().addPendingRequest(request);

        const friend = useFriendsStore.getState().acceptRequest('request-1');

        expect(friend?.isOnline).toBe(true);
      });

      it('should return null for non-existent request', () => {
        const friend = useFriendsStore.getState().acceptRequest('non-existent');

        expect(friend).toBeNull();
      });
    });

    describe('rejectRequest', () => {
      it('should remove request from list', () => {
        const request = createMockPendingRequest({ id: 'request-1' });
        useFriendsStore.getState().addPendingRequest(request);

        useFriendsStore.getState().rejectRequest('request-1');

        const state = useFriendsStore.getState();
        expect(state.pendingRequests).toHaveLength(0);
      });

      it('should not affect other requests', () => {
        const request1 = createMockPendingRequest({ id: 'request-1' });
        const request2 = createMockPendingRequest({ id: 'request-2' });

        useFriendsStore.getState().addPendingRequest(request1);
        useFriendsStore.getState().addPendingRequest(request2);

        useFriendsStore.getState().rejectRequest('request-1');

        const state = useFriendsStore.getState();
        expect(state.pendingRequests).toHaveLength(1);
        expect(state.pendingRequests[0]?.id).toBe('request-2');
      });
    });

    describe('clearPendingRequests', () => {
      it('should remove all pending requests', () => {
        const request1 = createMockPendingRequest();
        const request2 = createMockPendingRequest();

        useFriendsStore.getState().addPendingRequest(request1);
        useFriendsStore.getState().addPendingRequest(request2);

        useFriendsStore.getState().clearPendingRequests();

        const state = useFriendsStore.getState();
        expect(state.pendingRequests).toHaveLength(0);
      });
    });

    describe('cleanExpiredRequests', () => {
      it('should remove expired requests', () => {
        const expired = createMockPendingRequest({
          id: 'request-1',
          expiresAt: Date.now() - 1000,
        });
        const valid = createMockPendingRequest({
          id: 'request-2',
          expiresAt: Date.now() + 300000,
        });

        useFriendsStore.setState({ pendingRequests: [expired, valid] });
        useFriendsStore.getState().cleanExpiredRequests();

        const state = useFriendsStore.getState();
        expect(state.pendingRequests).toHaveLength(1);
        expect(state.pendingRequests[0]?.id).toBe('request-2');
      });
    });
  });

  describe('Block List', () => {
    describe('blockFriend', () => {
      it('should add friend to block list', () => {
        useFriendsStore.getState().blockFriend('friend-1');

        const state = useFriendsStore.getState();
        expect(state.blockedIds).toContain('friend-1');
      });

      it('should remove friend from friends list', () => {
        const friend = createMockFriend({ id: 'friend-1' });
        useFriendsStore.getState().addFriend(friend);

        useFriendsStore.getState().blockFriend('friend-1');

        const state = useFriendsStore.getState();
        expect(state.friends).toHaveLength(0);
        expect(state.blockedIds).toContain('friend-1');
      });

      it('should not add duplicate to block list', () => {
        useFriendsStore.getState().blockFriend('friend-1');
        useFriendsStore.getState().blockFriend('friend-1');

        const state = useFriendsStore.getState();
        expect(state.blockedIds.filter(id => id === 'friend-1')).toHaveLength(1);
      });
    });

    describe('unblockFriend', () => {
      it('should remove friend from block list', () => {
        useFriendsStore.getState().blockFriend('friend-1');
        useFriendsStore.getState().unblockFriend('friend-1');

        const state = useFriendsStore.getState();
        expect(state.blockedIds).not.toContain('friend-1');
      });
    });

    describe('isBlocked', () => {
      it('should return true for blocked friend', () => {
        useFriendsStore.getState().blockFriend('friend-1');

        const result = useFriendsStore.getState().isBlocked('friend-1');

        expect(result).toBe(true);
      });

      it('should return false for non-blocked friend', () => {
        const result = useFriendsStore.getState().isBlocked('friend-1');

        expect(result).toBe(false);
      });
    });
  });

  describe('Pairing', () => {
    describe('generatePairingCode', () => {
      it('should generate a pairing session', () => {
        const session = useFriendsStore.getState().generatePairingCode();

        expect(session).toBeDefined();
        expect(session.code).toBeTruthy();
        expect(session.code).toHaveLength(8);
        expect(session.isActive).toBe(true);
      });

      it('should store session in state', () => {
        useFriendsStore.getState().generatePairingCode();

        const state = useFriendsStore.getState();
        expect(state.currentPairingSession).not.toBeNull();
      });

      it('should set expiration time', () => {
        const session = useFriendsStore.getState().generatePairingCode();

        expect(session.expiresAt).toBeGreaterThan(Date.now());
        expect(session.expiresAt).toBeLessThan(Date.now() + 6 * 60 * 1000); // Less than 6 minutes
      });

      it('should generate unique codes', () => {
        const session1 = useFriendsStore.getState().generatePairingCode();
        useFriendsStore.getState().cancelPairingSession();
        const session2 = useFriendsStore.getState().generatePairingCode();

        // High probability they're different
        expect(session1.code).not.toBe(session2.code);
      });

      it('should clear expired session before generating new one', () => {
        const expiredSession: PairingSession = {
          id: 'session-1',
          code: 'EXPIRED1',
          publicKey: 'pk_expired',
          createdAt: Date.now() - 10 * 60 * 1000,
          expiresAt: Date.now() - 5 * 60 * 1000,
          isActive: true,
        };

        useFriendsStore.setState({ currentPairingSession: expiredSession });

        const newSession = useFriendsStore.getState().generatePairingCode();

        expect(newSession.code).not.toBe('EXPIRED1');
      });
    });

    describe('cancelPairingSession', () => {
      it('should clear current pairing session', () => {
        useFriendsStore.getState().generatePairingCode();
        useFriendsStore.getState().cancelPairingSession();

        const state = useFriendsStore.getState();
        expect(state.currentPairingSession).toBeNull();
      });
    });

    describe('validatePairingCode', () => {
      it('should return true for valid code', () => {
        const session = useFriendsStore.getState().generatePairingCode();
        const isValid = useFriendsStore.getState().validatePairingCode(session.code);

        expect(isValid).toBe(true);
      });

      it('should return false for invalid code', () => {
        useFriendsStore.getState().generatePairingCode();
        const isValid = useFriendsStore.getState().validatePairingCode('INVALID1');

        expect(isValid).toBe(false);
      });

      it('should return false when no session exists', () => {
        const isValid = useFriendsStore.getState().validatePairingCode('ANYCODE1');

        expect(isValid).toBe(false);
      });

      it('should return false for expired session', () => {
        const expiredSession: PairingSession = {
          id: 'session-1',
          code: 'EXPIRED1',
          publicKey: 'pk_expired',
          createdAt: Date.now() - 10 * 60 * 1000,
          expiresAt: Date.now() - 1000,
          isActive: true,
        };

        useFriendsStore.setState({ currentPairingSession: expiredSession });

        const isValid = useFriendsStore.getState().validatePairingCode('EXPIRED1');

        expect(isValid).toBe(false);
      });

      it('should clear expired session', () => {
        const expiredSession: PairingSession = {
          id: 'session-1',
          code: 'EXPIRED1',
          publicKey: 'pk_expired',
          createdAt: Date.now() - 10 * 60 * 1000,
          expiresAt: Date.now() - 1000,
          isActive: true,
        };

        useFriendsStore.setState({ currentPairingSession: expiredSession });

        useFriendsStore.getState().validatePairingCode('EXPIRED1');

        const state = useFriendsStore.getState();
        expect(state.currentPairingSession).toBeNull();
      });
    });

    describe('cleanExpiredPairingSessions', () => {
      it('should clear expired session', () => {
        const expiredSession: PairingSession = {
          id: 'session-1',
          code: 'EXPIRED1',
          publicKey: 'pk_expired',
          createdAt: Date.now() - 10 * 60 * 1000,
          expiresAt: Date.now() - 1000,
          isActive: true,
        };

        useFriendsStore.setState({ currentPairingSession: expiredSession });
        useFriendsStore.getState().cleanExpiredPairingSessions();

        const state = useFriendsStore.getState();
        expect(state.currentPairingSession).toBeNull();
      });

      it('should preserve valid session', () => {
        const session = useFriendsStore.getState().generatePairingCode();
        useFriendsStore.getState().cleanExpiredPairingSessions();

        const state = useFriendsStore.getState();
        expect(state.currentPairingSession?.code).toBe(session.code);
      });
    });
  });

  describe('Search', () => {
    describe('searchFriends', () => {
      it('should find friends by name', () => {
        const friend1 = createMockFriend({ name: 'Alice' });
        const friend2 = createMockFriend({ name: 'Bob' });
        const friend3 = createMockFriend({ name: 'Charlie' });

        useFriendsStore.getState().addFriend(friend1);
        useFriendsStore.getState().addFriend(friend2);
        useFriendsStore.getState().addFriend(friend3);

        const results = useFriendsStore.getState().searchFriends('ali');

        expect(results).toHaveLength(1);
        expect(results[0]?.name).toBe('Alice');
      });

      it('should be case insensitive', () => {
        const friend = createMockFriend({ name: 'TestFriend' });
        useFriendsStore.getState().addFriend(friend);

        const results = useFriendsStore.getState().searchFriends('testfriend');

        expect(results).toHaveLength(1);
      });

      it('should find friends by platform', () => {
        const friend1 = createMockFriend({ name: 'Friend 1', platform: 'windows' });
        const friend2 = createMockFriend({ name: 'Friend 2', platform: 'macos' });

        useFriendsStore.getState().addFriend(friend1);
        useFriendsStore.getState().addFriend(friend2);

        const results = useFriendsStore.getState().searchFriends('mac');

        expect(results).toHaveLength(1);
        expect(results[0]?.platform).toBe('macos');
      });

      it('should find friends by notes', () => {
        const friend1 = createMockFriend({ name: 'Friend 1', notes: 'Work colleague' });
        const friend2 = createMockFriend({ name: 'Friend 2', notes: 'Family member' });

        useFriendsStore.getState().addFriend(friend1);
        useFriendsStore.getState().addFriend(friend2);

        const results = useFriendsStore.getState().searchFriends('colleague');

        expect(results).toHaveLength(1);
        expect(results[0]?.notes).toBe('Work colleague');
      });

      it('should return empty array when no matches', () => {
        const friend = createMockFriend({ name: 'Alice' });
        useFriendsStore.getState().addFriend(friend);

        const results = useFriendsStore.getState().searchFriends('xyz');

        expect(results).toHaveLength(0);
      });
    });

    describe('getFriendByPublicKey', () => {
      it('should find friend by public key', () => {
        const friend = createMockFriend({ publicKey: 'pk_unique123' });
        useFriendsStore.getState().addFriend(friend);

        const result = useFriendsStore.getState().getFriendByPublicKey('pk_unique123');

        expect(result).toEqual(friend);
      });

      it('should return undefined for non-existent public key', () => {
        const result = useFriendsStore.getState().getFriendByPublicKey('pk_nonexistent');

        expect(result).toBeUndefined();
      });
    });

    describe('getFriendByPairingCode', () => {
      it('should find friend by pairing code', () => {
        const friend = createMockFriend({ pairingCode: 'UNIQUE12' });
        useFriendsStore.getState().addFriend(friend);

        const result = useFriendsStore.getState().getFriendByPairingCode('UNIQUE12');

        expect(result).toEqual(friend);
      });

      it('should return undefined for non-existent pairing code', () => {
        const result = useFriendsStore.getState().getFriendByPairingCode('NOTFOUND');

        expect(result).toBeUndefined();
      });
    });
  });

  describe('Selectors', () => {
    describe('getFriendById', () => {
      it('should return friend by ID', () => {
        const friend = createMockFriend({ id: 'friend-1', name: 'Test' });
        useFriendsStore.getState().addFriend(friend);

        const result = useFriendsStore.getState().getFriendById('friend-1');

        expect(result).toEqual(friend);
      });

      it('should return undefined for non-existent ID', () => {
        const result = useFriendsStore.getState().getFriendById('non-existent');

        expect(result).toBeUndefined();
      });
    });

    describe('getOnlineFriends', () => {
      it('should return only online friends', () => {
        const online1 = createMockFriend({ id: 'friend-1', isOnline: true });
        const offline1 = createMockFriend({ id: 'friend-2', isOnline: false });
        const online2 = createMockFriend({ id: 'friend-3', isOnline: true });

        useFriendsStore.getState().addFriend(online1);
        useFriendsStore.getState().addFriend(offline1);
        useFriendsStore.getState().addFriend(online2);

        const result = useFriendsStore.getState().getOnlineFriends();

        expect(result).toHaveLength(2);
        expect(result.every(f => f.isOnline)).toBe(true);
      });
    });

    describe('getOfflineFriends', () => {
      it('should return only offline friends', () => {
        const online1 = createMockFriend({ id: 'friend-1', isOnline: true });
        const offline1 = createMockFriend({ id: 'friend-2', isOnline: false });
        const offline2 = createMockFriend({ id: 'friend-3', isOnline: false });

        useFriendsStore.getState().addFriend(online1);
        useFriendsStore.getState().addFriend(offline1);
        useFriendsStore.getState().addFriend(offline2);

        const result = useFriendsStore.getState().getOfflineFriends();

        expect(result).toHaveLength(2);
        expect(result.every(f => !f.isOnline)).toBe(true);
      });
    });

    describe('getTrustedFriends', () => {
      it('should return only trusted friends', () => {
        const trusted1 = createMockFriend({ id: 'friend-1', isTrusted: true });
        const notTrusted = createMockFriend({ id: 'friend-2', isTrusted: false });
        const trusted2 = createMockFriend({ id: 'friend-3', isTrusted: true });

        useFriendsStore.getState().addFriend(trusted1);
        useFriendsStore.getState().addFriend(notTrusted);
        useFriendsStore.getState().addFriend(trusted2);

        const result = useFriendsStore.getState().getTrustedFriends();

        expect(result).toHaveLength(2);
        expect(result.every(f => f.isTrusted)).toBe(true);
      });
    });

    describe('getRecentFriends', () => {
      it('should return friends sorted by lastTransferAt', () => {
        const friend1 = createMockFriend({ id: 'friend-1', lastTransferAt: 1000 });
        const friend2 = createMockFriend({ id: 'friend-2', lastTransferAt: 3000 });
        const friend3 = createMockFriend({ id: 'friend-3', lastTransferAt: 2000 });

        useFriendsStore.getState().addFriend(friend1);
        useFriendsStore.getState().addFriend(friend2);
        useFriendsStore.getState().addFriend(friend3);

        const result = useFriendsStore.getState().getRecentFriends();

        expect(result[0]?.id).toBe('friend-2');
        expect(result[1]?.id).toBe('friend-3');
        expect(result[2]?.id).toBe('friend-1');
      });

      it('should limit results to specified count', () => {
        const friends = Array.from({ length: 10 }, (_, i) =>
          createMockFriend({ id: `friend-${i}`, lastTransferAt: i * 1000 })
        );

        friends.forEach(f => useFriendsStore.getState().addFriend(f));

        const result = useFriendsStore.getState().getRecentFriends(3);

        expect(result).toHaveLength(3);
      });

      it('should default to 5 friends', () => {
        const friends = Array.from({ length: 10 }, (_, i) =>
          createMockFriend({ id: `friend-${i}`, lastTransferAt: i * 1000 })
        );

        friends.forEach(f => useFriendsStore.getState().addFriend(f));

        const result = useFriendsStore.getState().getRecentFriends();

        expect(result).toHaveLength(5);
      });
    });

    describe('getFriendsCount', () => {
      it('should return total friend count', () => {
        const friend1 = createMockFriend();
        const friend2 = createMockFriend();

        useFriendsStore.getState().addFriend(friend1);
        useFriendsStore.getState().addFriend(friend2);

        const count = useFriendsStore.getState().getFriendsCount();

        expect(count).toBe(2);
      });
    });

    describe('getPendingRequestsCount', () => {
      it('should return pending requests count', () => {
        const request1 = createMockPendingRequest();
        const request2 = createMockPendingRequest();

        useFriendsStore.getState().addPendingRequest(request1);
        useFriendsStore.getState().addPendingRequest(request2);

        const count = useFriendsStore.getState().getPendingRequestsCount();

        expect(count).toBe(2);
      });
    });
  });

  describe('Loading States', () => {
    it('should set loading state', () => {
      useFriendsStore.getState().setLoading(true);

      const state = useFriendsStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it('should set initialized state', () => {
      useFriendsStore.getState().setInitialized();

      const state = useFriendsStore.getState();
      expect(state.isInitialized).toBe(true);
    });
  });
});
