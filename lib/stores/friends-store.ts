/**
 * Friends Store - Zustand State Management
 *
 * Manages friends/contacts for simplified device pairing and trusted transfers.
 * Supports pairing codes, online status tracking, and persistent storage.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';
import { useDeviceStore } from './device-store';
import { useSettingsStore } from './settings-store';
import type { Platform } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Friend/Contact information
 *
 * Represents a trusted device that has been paired via a pairing code.
 */
export interface Friend {
  /** Unique friend identifier */
  id: string;
  /** User-friendly name */
  name: string;
  /** Device platform */
  platform: Platform;
  /** Public key for identity verification */
  publicKey: string;
  /** Pairing code used to establish friendship */
  pairingCode: string;
  /** Whether friend is currently online */
  isOnline: boolean;
  /** Last seen timestamp */
  lastSeen: number;
  /** Whether friend is trusted for auto-accept */
  isTrusted: boolean;
  /** Avatar URL or data URI */
  avatar: string | null;
  /** When friend was added */
  addedAt: number;
  /** Optional notes about this friend */
  notes: string | null;
  /** Number of successful transfers */
  transferCount: number;
  /** Last transfer timestamp */
  lastTransferAt: number | null;
  /** Timestamp of latest SAS verification */
  sasVerifiedAt?: number | null;
}

/**
 * Pending friend request
 */
export interface PendingRequest {
  /** Unique request identifier */
  id: string;
  /** Device name requesting friendship */
  name: string;
  /** Device platform */
  platform: Platform;
  /** Public key for verification */
  publicKey: string;
  /** Pairing code provided */
  pairingCode: string;
  /** Request timestamp */
  requestedAt: number;
  /** Request expiration timestamp */
  expiresAt: number;
}

/**
 * Pairing session for generating codes
 */
export interface PairingSession {
  /** Unique session identifier */
  id: string;
  /** Generated pairing code (8-char alphanumeric) */
  code: string;
  /** Our public key for this session */
  publicKey: string;
  /** Session creation timestamp */
  createdAt: number;
  /** Session expiration timestamp (5 minutes) */
  expiresAt: number;
  /** Whether session is active */
  isActive: boolean;
}

export interface FriendsStoreState {
  // Friend lists
  friends: Friend[];
  pendingRequests: PendingRequest[];
  blockedIds: string[];
  guestTransferTokens: Record<string, string>;

  // Current pairing session
  currentPairingSession: PairingSession | null;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Actions - Friend Management
  addFriend: (friend: Friend) => void;
  addFriendByCode: (code: string, name: string, platform: Platform) => Friend;
  updateFriend: (id: string, updates: Partial<Friend>) => void;
  removeFriend: (id: string) => void;
  clearFriends: () => void;
  toggleFavorite: (id: string) => void;

  // Actions - Friend Status
  setFriendOnline: (id: string, isOnline: boolean) => void;
  setFriendTrusted: (id: string, isTrusted: boolean) => void;
  markFriendSASVerified: (id: string) => void;
  updateFriendLastSeen: (id: string) => void;
  incrementTransferCount: (id: string) => void;

  // Actions - Pending Requests
  addPendingRequest: (request: PendingRequest) => void;
  acceptRequest: (requestId: string) => Friend | null;
  rejectRequest: (requestId: string) => void;
  clearPendingRequests: () => void;
  cleanExpiredRequests: () => void;

  // Actions - Block List
  blockFriend: (id: string) => void;
  unblockFriend: (id: string) => void;
  isBlocked: (id: string) => boolean;
  issueGuestTransferToken: (id: string) => string | null;
  consumeGuestTransferToken: (id: string, token: string) => boolean;
  canTransferToFriend: (id: string, token?: string) => { allowed: boolean; reason: string | null; path: 'trusted' | 'guest' | 'blocked' };
  autoConnectFavorite: () => Friend | null;

  // Actions - Pairing
  generatePairingCode: () => PairingSession;
  cancelPairingSession: () => void;
  validatePairingCode: (code: string) => boolean;
  cleanExpiredPairingSessions: () => void;

  // Actions - Search
  searchFriends: (query: string) => Friend[];
  getFriendByPublicKey: (publicKey: string) => Friend | undefined;
  getFriendByPairingCode: (code: string) => Friend | undefined;

  // Actions - Loading
  setLoading: (isLoading: boolean) => void;
  setInitialized: () => void;

  // Selectors
  getFriendById: (id: string) => Friend | undefined;
  getOnlineFriends: () => Friend[];
  getOfflineFriends: () => Friend[];
  getTrustedFriends: () => Friend[];
  getRecentFriends: (limit?: number) => Friend[];
  getFriendsCount: () => number;
  getPendingRequestsCount: () => number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const PAIRING_SESSION_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a random 8-character alphanumeric pairing code
 * Using crypto.getRandomValues for secure random generation
 */
function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar-looking chars (I, O, 0, 1)
  const array = new Uint8Array(8);

  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for SSR
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Date.now() * (i + 1) % 256); // SSR fallback - non-crypto context
    }
  }

  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[(array[i] ?? 0) % chars.length];
  }

  return code;
}

/**
 * Generate a simple public key (in production, use actual crypto)
 */
function generatePublicKey(): string {
  return `pk_${Date.now()}_${Array.from(crypto.getRandomValues(new Uint8Array(10))).map(b => b.toString(36)).join('').substring(0, 13)}`;
}

/**
 * Check if a pairing session or request has expired
 */
function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

function createGuestToken(): string {
  const random = crypto.getRandomValues(new Uint8Array(10));
  return `guest_${Date.now()}_${Array.from(random).map((value) => value.toString(36)).join('').slice(0, 18)}`;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useFriendsStore = create<FriendsStoreState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // Initial state
          friends: [],
          pendingRequests: [],
          blockedIds: [],
          guestTransferTokens: {},
          currentPairingSession: null,
          isLoading: false,
          isInitialized: false,

          // Friend Management
          addFriend: (friend) =>
            set((state) => {
              const existingIndex = state.friends.findIndex((f) => f.id === friend.id);
              if (existingIndex >= 0) {
                const newFriends = [...state.friends];
                newFriends[existingIndex] = friend;
                return { friends: newFriends };
              }
              return { friends: [...state.friends, friend] };
            }),

          addFriendByCode: (code, name, platform) => {
            const newFriend: Friend = {
              id: `friend_${Date.now()}_${Array.from(crypto.getRandomValues(new Uint8Array(7))).map(b => b.toString(36)).join('').substring(0, 7)}`,
              name,
              platform,
              publicKey: generatePublicKey(),
              pairingCode: code,
              isOnline: false,
              lastSeen: Date.now(),
              isTrusted: false,
              sasVerifiedAt: null,
              avatar: null,
              addedAt: Date.now(),
              notes: null,
              transferCount: 0,
              lastTransferAt: null,
            };

            set((state) => ({
              friends: [...state.friends, newFriend],
            }));

            return newFriend;
          },

          updateFriend: (id, updates) =>
            set((state) => {
              const index = state.friends.findIndex((f) => f.id === id);
              if (index < 0) {return state;}

              const newFriends = [...state.friends];
              const existing = newFriends[index];
              if (!existing) {return state;}

              newFriends[index] = {
                ...existing,
                ...updates,
              };

              return { friends: newFriends };
            }),

          removeFriend: (id) =>
            set((state) => ({
              friends: state.friends.filter((f) => f.id !== id),
            })),

          clearFriends: () => set({ friends: [] }),

          toggleFavorite: (id) =>
            set((state) => {
              const index = state.friends.findIndex((f) => f.id === id);
              if (index < 0) {return state;}

              const newFriends = [...state.friends];
              const existing = newFriends[index];
              if (!existing) {return state;}

              newFriends[index] = {
                ...existing,
                isTrusted: !existing.isTrusted,
              };

              return { friends: newFriends };
            }),

          // Friend Status
          setFriendOnline: (id, isOnline) =>
            set((state) => {
              const index = state.friends.findIndex((f) => f.id === id);
              if (index < 0) {return state;}

              const newFriends = [...state.friends];
              const existing = newFriends[index];
              if (!existing) {return state;}

              newFriends[index] = {
                ...existing,
                isOnline,
                lastSeen: isOnline ? existing.lastSeen : Date.now(),
              };

              return { friends: newFriends };
            }),

          setFriendTrusted: (id, isTrusted) =>
            set((state) => {
              const index = state.friends.findIndex((f) => f.id === id);
              if (index < 0) {return state;}

              const newFriends = [...state.friends];
              const existing = newFriends[index];
              if (!existing) {return state;}

              newFriends[index] = {
                ...existing,
                isTrusted,
              };

              return { friends: newFriends };
            }),

          markFriendSASVerified: (id) =>
            set((state) => {
              const index = state.friends.findIndex((f) => f.id === id);
              if (index < 0) {return state;}

              const newFriends = [...state.friends];
              const existing = newFriends[index];
              if (!existing) {return state;}

              newFriends[index] = {
                ...existing,
                isTrusted: true,
                sasVerifiedAt: Date.now(),
              };

              return { friends: newFriends };
            }),

          updateFriendLastSeen: (id) =>
            set((state) => {
              const index = state.friends.findIndex((f) => f.id === id);
              if (index < 0) {return state;}

              const newFriends = [...state.friends];
              const existing = newFriends[index];
              if (!existing) {return state;}

              newFriends[index] = {
                ...existing,
                lastSeen: Date.now(),
              };

              return { friends: newFriends };
            }),

          incrementTransferCount: (id) =>
            set((state) => {
              const index = state.friends.findIndex((f) => f.id === id);
              if (index < 0) {return state;}

              const newFriends = [...state.friends];
              const existing = newFriends[index];
              if (!existing) {return state;}

              newFriends[index] = {
                ...existing,
                transferCount: existing.transferCount + 1,
                lastTransferAt: Date.now(),
              };

              return { friends: newFriends };
            }),

          // Pending Requests
          addPendingRequest: (request) =>
            set((state) => {
              // Clean expired requests first
              const validRequests = state.pendingRequests.filter(
                (r) => !isExpired(r.expiresAt)
              );

              // Check for duplicates
              const existingIndex = validRequests.findIndex((r) => r.id === request.id);
              if (existingIndex >= 0) {
                const newRequests = [...validRequests];
                newRequests[existingIndex] = request;
                return { pendingRequests: newRequests };
              }

              return { pendingRequests: [...validRequests, request] };
            }),

          acceptRequest: (requestId) => {
            const state = get();
            const request = state.pendingRequests.find((r) => r.id === requestId);
            if (!request) {return null;}

            const newFriend: Friend = {
              id: request.id,
              name: request.name,
              platform: request.platform,
              publicKey: request.publicKey,
              pairingCode: request.pairingCode,
              isOnline: true,
              lastSeen: Date.now(),
              isTrusted: false,
              sasVerifiedAt: null,
              avatar: null,
              addedAt: Date.now(),
              notes: null,
              transferCount: 0,
              lastTransferAt: null,
            };

            set((state) => ({
              friends: [...state.friends, newFriend],
              pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
            }));

            return newFriend;
          },

          rejectRequest: (requestId) =>
            set((state) => ({
              pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
            })),

          clearPendingRequests: () => set({ pendingRequests: [] }),

          cleanExpiredRequests: () =>
            set((state) => ({
              pendingRequests: state.pendingRequests.filter(
                (r) => !isExpired(r.expiresAt)
              ),
            })),

          // Block List
          blockFriend: (id) => {
            const connection = useDeviceStore.getState().connection;
            if (connection.peerId === id) {
              useDeviceStore.getState().disconnect();
            }

            set((state) => ({
              blockedIds: state.blockedIds.includes(id)
                ? state.blockedIds
                : [...state.blockedIds, id],
              friends: state.friends.filter((f) => f.id !== id),
            }));
          },

          unblockFriend: (id) =>
            set((state) => ({
              blockedIds: state.blockedIds.filter((bid) => bid !== id),
            })),

          isBlocked: (id) => get().blockedIds.includes(id),

          issueGuestTransferToken: (id) => {
            const state = get();
            if (state.blockedIds.includes(id)) {
              return null;
            }

            if (!useSettingsStore.getState().guestMode) {
              return null;
            }

            const token = createGuestToken();
            set((prev) => ({
              guestTransferTokens: {
                ...prev.guestTransferTokens,
                [id]: token,
              },
            }));
            return token;
          },

          consumeGuestTransferToken: (id, token) => {
            const state = get();
            const expected = state.guestTransferTokens[id];
            if (!expected || expected !== token) {
              return false;
            }

            set((prev) => {
              const next = { ...prev.guestTransferTokens };
              delete next[id];
              return { guestTransferTokens: next };
            });
            return true;
          },

          canTransferToFriend: (id, token) => {
            const state = get();
            if (state.blockedIds.includes(id)) {
              return { allowed: false, reason: 'Friend is blocked', path: 'blocked' as const };
            }

            const friend = state.friends.find((f) => f.id === id);
            if (!friend) {
              return { allowed: false, reason: 'Friend not found', path: 'blocked' as const };
            }

            if (friend.isTrusted && !!friend.sasVerifiedAt) {
              return { allowed: true, reason: null, path: 'trusted' as const };
            }

            if (token && useSettingsStore.getState().guestMode && state.guestTransferTokens[id] === token) {
              return { allowed: true, reason: null, path: 'guest' as const };
            }

            return {
              allowed: false,
              reason: 'SAS verification required or provide a valid one-time guest token',
              path: 'blocked' as const,
            };
          },

          autoConnectFavorite: () => {
            const state = get();
            const candidate = state.friends.find(
              (friend) => friend.isTrusted && !!friend.sasVerifiedAt && friend.isOnline && !state.blockedIds.includes(friend.id)
            );

            if (!candidate) {
              return null;
            }

            const deviceStore = useDeviceStore.getState();
            deviceStore.startConnecting(candidate.id, candidate.name);
            deviceStore.setConnected('p2p');
            return candidate;
          },

          // Pairing
          generatePairingCode: () => {
            // Clean expired session first
            const state = get();
            if (
              state.currentPairingSession &&
              isExpired(state.currentPairingSession.expiresAt)
            ) {
              set({ currentPairingSession: null });
            }

            const session: PairingSession = {
              id: `session_${Date.now()}`,
              code: generateRandomCode(),
              publicKey: generatePublicKey(),
              createdAt: Date.now(),
              expiresAt: Date.now() + PAIRING_SESSION_DURATION,
              isActive: true,
            };

            set({ currentPairingSession: session });
            return session;
          },

          cancelPairingSession: () => set({ currentPairingSession: null }),

          validatePairingCode: (code) => {
            const state = get();
            if (!state.currentPairingSession) {return false;}
            if (isExpired(state.currentPairingSession.expiresAt)) {
              set({ currentPairingSession: null });
              return false;
            }
            return state.currentPairingSession.code === code;
          },

          cleanExpiredPairingSessions: () => {
            const state = get();
            if (
              state.currentPairingSession &&
              isExpired(state.currentPairingSession.expiresAt)
            ) {
              set({ currentPairingSession: null });
            }
          },

          // Search
          searchFriends: (query) => {
            const lowerQuery = query.toLowerCase();
            return get().friends.filter(
              (f) =>
                f.name.toLowerCase().includes(lowerQuery) ||
                f.platform.toLowerCase().includes(lowerQuery) ||
                (f.notes && f.notes.toLowerCase().includes(lowerQuery))
            );
          },

          getFriendByPublicKey: (publicKey) =>
            get().friends.find((f) => f.publicKey === publicKey),

          getFriendByPairingCode: (code) =>
            get().friends.find((f) => f.pairingCode === code),

          // Loading
          setLoading: (isLoading) => set({ isLoading }),
          setInitialized: () => set({ isInitialized: true }),

          // Selectors
          getFriendById: (id) => get().friends.find((f) => f.id === id),

          getOnlineFriends: () => get().friends.filter((f) => f.isOnline),

          getOfflineFriends: () => get().friends.filter((f) => !f.isOnline),

          getTrustedFriends: () => get().friends.filter((f) => f.isTrusted),

          getRecentFriends: (limit = 5) =>
            [...get().friends]
              .sort((a, b) => (b.lastTransferAt || 0) - (a.lastTransferAt || 0))
              .slice(0, limit),

          getFriendsCount: () => get().friends.length,

          getPendingRequestsCount: () => get().pendingRequests.length,
        }),
        {
          name: 'tallow-friends-store',
          storage: createJSONStorage(() => safeStorage),
          partialize: (state) => ({
            friends: state.friends,
            blockedIds: state.blockedIds,
          }),
        }
      )
    ),
    { name: 'FriendsStore' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectFriends = (state: FriendsStoreState) => state.friends;
export const selectOnlineFriends = (state: FriendsStoreState) =>
  state.friends.filter((f) => f.isOnline);
export const selectOfflineFriends = (state: FriendsStoreState) =>
  state.friends.filter((f) => !f.isOnline);
export const selectTrustedFriends = (state: FriendsStoreState) =>
  state.friends.filter((f) => f.isTrusted);
export const selectPendingRequests = (state: FriendsStoreState) => state.pendingRequests;
export const selectPendingRequestsCount = (state: FriendsStoreState) =>
  state.pendingRequests.length;
export const selectCurrentPairingSession = (state: FriendsStoreState) =>
  state.currentPairingSession;
export const selectFriendsCount = (state: FriendsStoreState) => state.friends.length;
export const selectIsLoading = (state: FriendsStoreState) => state.isLoading;
