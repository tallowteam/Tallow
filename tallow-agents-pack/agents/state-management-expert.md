---
name: state-management-expert
description:
  "PROACTIVELY use for complex client state management, Zustand stores, React
  Context patterns, WebRTC state synchronization, and real-time state handling.
  Essential for Tallow's transfer and connection state."
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

# State Management Expert

**Role**: Senior state management architect specializing in Zustand, React
Context, and real-time state synchronization for WebRTC applications.

**Model Tier**: Sonnet 4.5 (Complex state logic)

---

## Core Expertise

### 1. Zustand Mastery

- Store creation and organization
- Middleware (devtools, persist, immer, subscribeWithSelector)
- Slices pattern for large stores
- Selectors and performance optimization
- TypeScript integration

### 2. React Context Patterns

- Provider composition
- Context splitting for performance
- Reducer patterns with useReducer
- Avoiding context hell

### 3. Real-Time State

- WebRTC connection state machines
- Transfer progress tracking
- Peer discovery state
- Optimistic updates with rollback

### 4. State Persistence

- localStorage/sessionStorage strategies
- IndexedDB for large data
- Hydration and SSR considerations
- State migration patterns

---

## Tallow State Architecture

### State Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        STATE HIERARCHY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SERVER STATE (RSC)          URL STATE (searchParams)           │
│  ├─ User settings            ├─ Room code (?room=ABC123)        │
│  ├─ Room data                ├─ Peer ID (?peer=xyz)             │
│  └─ Initial transfers        └─ View mode (?view=grid)          │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ZUSTAND STORE (Client)      REACT CONTEXT (Cross-cutting)      │
│  ├─ WebRTC connections       ├─ Theme (dark/light)              │
│  ├─ Transfer progress        ├─ Notifications                   │
│  ├─ Discovered peers         └─ Modal state                     │
│  ├─ Security status                                             │
│  └─ Room membership                                             │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  LOCAL STATE (useState)                                         │
│  ├─ Form inputs                                                 │
│  ├─ UI toggles (dropdowns, modals)                              │
│  └─ Component-specific state                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Main Zustand Store

```typescript
// stores/tallow-store.ts
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// TYPES
// ============================================================================

interface Peer {
  id: string;
  name: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  platform: 'windows' | 'macos' | 'linux' | 'ios' | 'android';
  discoveryMethod: 'mdns' | 'signaling' | 'room';
  connectionState:
    | 'discovered'
    | 'connecting'
    | 'connected'
    | 'verified'
    | 'failed'
    | 'disconnected';
  lastSeen: Date;
  securityStatus?: SecurityStatus;
}

interface SecurityStatus {
  encryption: 'pqc' | 'classical' | 'hybrid';
  forwardSecrecy: boolean;
  onionRouting: false | 1 | 2 | 3;
  metadataStripped: boolean;
  ipProtected: boolean;
  keyGeneration: number;
  lastKeyRotation: Date;
  sasVerified: boolean;
}

interface Transfer {
  id: string;
  peerId: string;
  peerName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  direction: 'send' | 'receive';
  status:
    | 'queued'
    | 'preparing'
    | 'encrypting'
    | 'transferring'
    | 'verifying'
    | 'complete'
    | 'failed'
    | 'cancelled';
  progress: number; // 0-100
  transferredBytes: number;
  currentSpeed: number; // bytes/sec
  averageSpeed: number;
  estimatedTimeRemaining: number; // seconds
  chunksTotal: number;
  chunksTransferred: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  fileHash?: string; // SHA-256 for verification
}

interface Room {
  code: string;
  isHost: boolean;
  hasPassword: boolean;
  members: Array<{
    peerId: string;
    name: string;
    joinedAt: Date;
    isHost: boolean;
  }>;
  createdAt: Date;
  expiresAt: Date;
}

interface SecuritySettings {
  onionRoutingMode: 'off' | 'single-hop' | 'multi-hop';
  onionHopCount: 1 | 2 | 3;
  metadataStripping: boolean;
  relayOnlyMode: boolean;
  keyRotationInterval: number; // minutes
  advancedPrivacyMode: boolean;
}

interface UIState {
  selectedFiles: File[];
  discoveryActive: boolean;
  showSecurityDetails: boolean;
  activeModal: 'none' | 'room-create' | 'room-join' | 'sas-verify' | 'settings';
  sidebarOpen: boolean;
}

// ============================================================================
// STORE STATE
// ============================================================================

interface TallowState {
  // Peers
  peers: Record<string, Peer>;
  activePeerId: string | null;

  // Transfers
  transfers: Record<string, Transfer>;
  activeTransferId: string | null;
  transferQueue: string[];

  // Room
  room: Room | null;

  // Security
  securitySettings: SecuritySettings;

  // UI
  ui: UIState;

  // Connection
  isOnline: boolean;
  signalingConnected: boolean;
  mdnsConnected: boolean;
}

// ============================================================================
// STORE ACTIONS
// ============================================================================

interface TallowActions {
  // ─── Peer Actions ─────────────────────────────────────────────────────────
  addPeer: (peer: Peer) => void;
  updatePeer: (id: string, updates: Partial<Peer>) => void;
  removePeer: (id: string) => void;
  setActivePeer: (id: string | null) => void;
  clearStaleReers: (maxAgeMs?: number) => void;

  // ─── Transfer Actions ─────────────────────────────────────────────────────
  queueTransfer: (peerId: string, file: File) => string;
  startTransfer: (transferId: string) => void;
  updateTransferProgress: (
    id: string,
    update: {
      progress: number;
      transferredBytes: number;
      currentSpeed: number;
      chunksTransferred: number;
    }
  ) => void;
  completeTransfer: (id: string, fileHash: string) => void;
  failTransfer: (id: string, error: string) => void;
  cancelTransfer: (id: string) => void;
  retryTransfer: (id: string) => void;
  clearCompletedTransfers: () => void;

  // ─── Room Actions ─────────────────────────────────────────────────────────
  setRoom: (room: Room | null) => void;
  addRoomMember: (member: Room['members'][0]) => void;
  removeRoomMember: (peerId: string) => void;
  leaveRoom: () => void;

  // ─── Security Actions ─────────────────────────────────────────────────────
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  setPeerSecurityStatus: (peerId: string, status: SecurityStatus) => void;
  markPeerVerified: (peerId: string) => void;

  // ─── UI Actions ────────────────────────────────────────────────────────────
  setSelectedFiles: (files: File[]) => void;
  addSelectedFiles: (files: File[]) => void;
  removeSelectedFile: (index: number) => void;
  clearSelectedFiles: () => void;
  toggleDiscovery: (active?: boolean) => void;
  setActiveModal: (modal: UIState['activeModal']) => void;
  toggleSidebar: (open?: boolean) => void;

  // ─── Connection Actions ───────────────────────────────────────────────────
  setOnlineStatus: (isOnline: boolean) => void;
  setSignalingConnected: (connected: boolean) => void;
  setMdnsConnected: (connected: boolean) => void;

  // ─── Global Actions ───────────────────────────────────────────────────────
  reset: () => void;
  hydrate: (state: Partial<TallowState>) => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: TallowState = {
  peers: {},
  activePeerId: null,
  transfers: {},
  activeTransferId: null,
  transferQueue: [],
  room: null,
  securitySettings: {
    onionRoutingMode: 'off',
    onionHopCount: 3,
    metadataStripping: true,
    relayOnlyMode: false,
    keyRotationInterval: 5,
    advancedPrivacyMode: false,
  },
  ui: {
    selectedFiles: [],
    discoveryActive: false,
    showSecurityDetails: false,
    activeModal: 'none',
    sidebarOpen: true,
  },
  isOnline: true,
  signalingConnected: false,
  mdnsConnected: false,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useTallowStore = create<TallowState & TallowActions>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          ...initialState,

          // ─── Peer Actions ─────────────────────────────────────────────────
          addPeer: (peer) =>
            set((state) => {
              state.peers[peer.id] = { ...peer, lastSeen: new Date() };
            }),

          updatePeer: (id, updates) =>
            set((state) => {
              if (state.peers[id]) {
                Object.assign(state.peers[id], updates, {
                  lastSeen: new Date(),
                });
              }
            }),

          removePeer: (id) =>
            set((state) => {
              delete state.peers[id];
              if (state.activePeerId === id) {
                state.activePeerId = null;
              }
            }),

          setActivePeer: (id) =>
            set((state) => {
              state.activePeerId = id;
            }),

          clearStalePeers: (maxAgeMs = 30000) =>
            set((state) => {
              const now = Date.now();
              Object.keys(state.peers).forEach((id) => {
                const peer = state.peers[id];
                if (now - peer.lastSeen.getTime() > maxAgeMs) {
                  delete state.peers[id];
                }
              });
            }),

          // ─── Transfer Actions ─────────────────────────────────────────────
          queueTransfer: (peerId, file) => {
            const id = crypto.randomUUID();
            const peer = get().peers[peerId];

            set((state) => {
              state.transfers[id] = {
                id,
                peerId,
                peerName: peer?.name || 'Unknown',
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                direction: 'send',
                status: 'queued',
                progress: 0,
                transferredBytes: 0,
                currentSpeed: 0,
                averageSpeed: 0,
                estimatedTimeRemaining: 0,
                chunksTotal: Math.ceil(file.size / (64 * 1024)), // 64KB chunks
                chunksTransferred: 0,
              };
              state.transferQueue.push(id);
            });

            return id;
          },

          startTransfer: (transferId) =>
            set((state) => {
              if (state.transfers[transferId]) {
                state.transfers[transferId].status = 'preparing';
                state.transfers[transferId].startedAt = new Date();
                state.activeTransferId = transferId;

                // Remove from queue
                const idx = state.transferQueue.indexOf(transferId);
                if (idx > -1) state.transferQueue.splice(idx, 1);
              }
            }),

          updateTransferProgress: (id, update) =>
            set((state) => {
              const transfer = state.transfers[id];
              if (transfer) {
                transfer.progress = update.progress;
                transfer.transferredBytes = update.transferredBytes;
                transfer.currentSpeed = update.currentSpeed;
                transfer.chunksTransferred = update.chunksTransferred;
                transfer.status = 'transferring';

                // Calculate average speed and ETA
                if (transfer.startedAt) {
                  const elapsed =
                    (Date.now() - transfer.startedAt.getTime()) / 1000;
                  transfer.averageSpeed = update.transferredBytes / elapsed;
                  const remaining = transfer.fileSize - update.transferredBytes;
                  transfer.estimatedTimeRemaining =
                    transfer.averageSpeed > 0
                      ? remaining / transfer.averageSpeed
                      : 0;
                }
              }
            }),

          completeTransfer: (id, fileHash) =>
            set((state) => {
              if (state.transfers[id]) {
                state.transfers[id].status = 'complete';
                state.transfers[id].progress = 100;
                state.transfers[id].completedAt = new Date();
                state.transfers[id].fileHash = fileHash;

                if (state.activeTransferId === id) {
                  state.activeTransferId = null;
                }
              }
            }),

          failTransfer: (id, error) =>
            set((state) => {
              if (state.transfers[id]) {
                state.transfers[id].status = 'failed';
                state.transfers[id].error = error;
              }
            }),

          cancelTransfer: (id) =>
            set((state) => {
              if (state.transfers[id]) {
                state.transfers[id].status = 'cancelled';
                if (state.activeTransferId === id) {
                  state.activeTransferId = null;
                }
              }
            }),

          retryTransfer: (id) =>
            set((state) => {
              if (state.transfers[id]) {
                state.transfers[id].status = 'queued';
                state.transfers[id].progress = 0;
                state.transfers[id].transferredBytes = 0;
                state.transfers[id].chunksTransferred = 0;
                state.transfers[id].error = undefined;
                state.transferQueue.push(id);
              }
            }),

          clearCompletedTransfers: () =>
            set((state) => {
              Object.keys(state.transfers).forEach((id) => {
                if (state.transfers[id].status === 'complete') {
                  delete state.transfers[id];
                }
              });
            }),

          // ─── Room Actions ─────────────────────────────────────────────────
          setRoom: (room) =>
            set((state) => {
              state.room = room;
            }),

          addRoomMember: (member) =>
            set((state) => {
              if (state.room) {
                state.room.members.push(member);
              }
            }),

          removeRoomMember: (peerId) =>
            set((state) => {
              if (state.room) {
                state.room.members = state.room.members.filter(
                  (m) => m.peerId !== peerId
                );
              }
            }),

          leaveRoom: () =>
            set((state) => {
              state.room = null;
            }),

          // ─── Security Actions ─────────────────────────────────────────────
          updateSecuritySettings: (settings) =>
            set((state) => {
              Object.assign(state.securitySettings, settings);
            }),

          setPeerSecurityStatus: (peerId, status) =>
            set((state) => {
              if (state.peers[peerId]) {
                state.peers[peerId].securityStatus = status;
              }
            }),

          markPeerVerified: (peerId) =>
            set((state) => {
              if (state.peers[peerId]?.securityStatus) {
                state.peers[peerId].securityStatus!.sasVerified = true;
                state.peers[peerId].connectionState = 'verified';
              }
            }),

          // ─── UI Actions ───────────────────────────────────────────────────
          setSelectedFiles: (files) =>
            set((state) => {
              state.ui.selectedFiles = files;
            }),

          addSelectedFiles: (files) =>
            set((state) => {
              state.ui.selectedFiles = [...state.ui.selectedFiles, ...files];
            }),

          removeSelectedFile: (index) =>
            set((state) => {
              state.ui.selectedFiles.splice(index, 1);
            }),

          clearSelectedFiles: () =>
            set((state) => {
              state.ui.selectedFiles = [];
            }),

          toggleDiscovery: (active) =>
            set((state) => {
              state.ui.discoveryActive = active ?? !state.ui.discoveryActive;
            }),

          setActiveModal: (modal) =>
            set((state) => {
              state.ui.activeModal = modal;
            }),

          toggleSidebar: (open) =>
            set((state) => {
              state.ui.sidebarOpen = open ?? !state.ui.sidebarOpen;
            }),

          // ─── Connection Actions ───────────────────────────────────────────
          setOnlineStatus: (isOnline) =>
            set((state) => {
              state.isOnline = isOnline;
            }),

          setSignalingConnected: (connected) =>
            set((state) => {
              state.signalingConnected = connected;
            }),

          setMdnsConnected: (connected) =>
            set((state) => {
              state.mdnsConnected = connected;
            }),

          // ─── Global Actions ───────────────────────────────────────────────
          reset: () => set(initialState),

          hydrate: (state) =>
            set((current) => {
              Object.assign(current, state);
            }),
        })),
        {
          name: 'tallow-storage',
          version: 1,
          partialize: (state) => ({
            securitySettings: state.securitySettings,
            // Don't persist: peers, transfers, room (ephemeral)
          }),
        }
      )
    ),
    { name: 'TallowStore' }
  )
);
```

---

## Selector Hooks

```typescript
// stores/selectors.ts
import { useTallowStore } from './tallow-store';
import { shallow } from 'zustand/shallow';
import { useMemo } from 'react';

// ─── Peer Selectors ─────────────────────────────────────────────────────────

export const useActivePeer = () =>
  useTallowStore((state) =>
    state.activePeerId ? state.peers[state.activePeerId] : null
  );

export const usePeers = () =>
  useTallowStore((state) => Object.values(state.peers), shallow);

export const useConnectedPeers = () =>
  useTallowStore(
    (state) =>
      Object.values(state.peers).filter(
        (p) =>
          p.connectionState === 'connected' || p.connectionState === 'verified'
      ),
    shallow
  );

export const useDiscoveredPeers = () =>
  useTallowStore(
    (state) =>
      Object.values(state.peers).filter(
        (p) => p.connectionState === 'discovered'
      ),
    shallow
  );

export const useVerifiedPeers = () =>
  useTallowStore(
    (state) =>
      Object.values(state.peers).filter(
        (p) => p.connectionState === 'verified'
      ),
    shallow
  );

// ─── Transfer Selectors ─────────────────────────────────────────────────────

export const useActiveTransfer = () =>
  useTallowStore((state) =>
    state.activeTransferId ? state.transfers[state.activeTransferId] : null
  );

export const useTransfers = () =>
  useTallowStore((state) => Object.values(state.transfers), shallow);

export const usePendingTransfers = () =>
  useTallowStore(
    (state) =>
      Object.values(state.transfers).filter((t) =>
        [
          'queued',
          'preparing',
          'encrypting',
          'transferring',
          'verifying',
        ].includes(t.status)
      ),
    shallow
  );

export const useCompletedTransfers = () =>
  useTallowStore(
    (state) =>
      Object.values(state.transfers).filter((t) => t.status === 'complete'),
    shallow
  );

export const useFailedTransfers = () =>
  useTallowStore(
    (state) =>
      Object.values(state.transfers).filter((t) => t.status === 'failed'),
    shallow
  );

export const useTransferQueue = () =>
  useTallowStore((state) => state.transferQueue);

// ─── Room Selectors ─────────────────────────────────────────────────────────

export const useRoom = () => useTallowStore((state) => state.room);
export const useIsInRoom = () => useTallowStore((state) => state.room !== null);
export const useIsRoomHost = () =>
  useTallowStore((state) => state.room?.isHost ?? false);
export const useRoomMembers = () =>
  useTallowStore((state) => state.room?.members ?? []);

// ─── Security Selectors ─────────────────────────────────────────────────────

export const useSecuritySettings = () =>
  useTallowStore((state) => state.securitySettings);

export const useOnionRouting = () =>
  useTallowStore((state) => ({
    mode: state.securitySettings.onionRoutingMode,
    hopCount: state.securitySettings.onionHopCount,
  }));

// ─── UI Selectors ───────────────────────────────────────────────────────────

export const useSelectedFiles = () =>
  useTallowStore((state) => state.ui.selectedFiles);

export const useIsDiscoveryActive = () =>
  useTallowStore((state) => state.ui.discoveryActive);

export const useActiveModal = () =>
  useTallowStore((state) => state.ui.activeModal);

// ─── Connection Selectors ───────────────────────────────────────────────────

export const useConnectionStatus = () =>
  useTallowStore(
    (state) => ({
      isOnline: state.isOnline,
      signalingConnected: state.signalingConnected,
      mdnsConnected: state.mdnsConnected,
    }),
    shallow
  );

// ─── Computed Selectors ─────────────────────────────────────────────────────

export const useTotalTransferProgress = () => {
  const transfers = usePendingTransfers();

  return useMemo(() => {
    if (transfers.length === 0) return null;

    const totalBytes = transfers.reduce((sum, t) => sum + t.fileSize, 0);
    const transferredBytes = transfers.reduce(
      (sum, t) => sum + t.transferredBytes,
      0
    );
    const totalSpeed = transfers.reduce((sum, t) => sum + t.currentSpeed, 0);

    return {
      progress: totalBytes > 0 ? (transferredBytes / totalBytes) * 100 : 0,
      totalBytes,
      transferredBytes,
      speed: totalSpeed,
      count: transfers.length,
    };
  }, [transfers]);
};
```

---

## WebRTC State Sync

```typescript
// stores/webrtc-sync.ts
import { useTallowStore } from './tallow-store';
import type { WebRTCManager } from '@/lib/webrtc/manager';

export function createWebRTCSyncAdapter(webrtc: WebRTCManager) {
  const store = useTallowStore.getState();

  // ─── Incoming Events from WebRTC ──────────────────────────────────────────

  webrtc.on('peer:discovered', (peer) => {
    store.addPeer({
      id: peer.id,
      name: peer.name,
      deviceType: peer.deviceType,
      platform: peer.platform,
      discoveryMethod: peer.source,
      connectionState: 'discovered',
      lastSeen: new Date(),
    });
  });

  webrtc.on('peer:connecting', (peerId) => {
    store.updatePeer(peerId, { connectionState: 'connecting' });
  });

  webrtc.on('peer:connected', (peerId, securityStatus) => {
    store.updatePeer(peerId, { connectionState: 'connected' });
    if (securityStatus) {
      store.setPeerSecurityStatus(peerId, securityStatus);
    }
  });

  webrtc.on('peer:verified', (peerId) => {
    store.markPeerVerified(peerId);
  });

  webrtc.on('peer:disconnected', (peerId, reason) => {
    store.updatePeer(peerId, { connectionState: 'disconnected' });
  });

  webrtc.on('transfer:progress', (transferId, progress) => {
    store.updateTransferProgress(transferId, progress);
  });

  webrtc.on('transfer:complete', (transferId, fileHash) => {
    store.completeTransfer(transferId, fileHash);
  });

  webrtc.on('transfer:error', (transferId, error) => {
    store.failTransfer(transferId, error);
  });

  // ─── Outgoing: React to Store Changes ─────────────────────────────────────

  // When security settings change, update WebRTC config
  useTallowStore.subscribe(
    (state) => state.securitySettings,
    (settings) => {
      webrtc.updateConfig({
        onionRouting: settings.onionRoutingMode !== 'off',
        hopCount: settings.onionHopCount,
        relayOnly: settings.relayOnlyMode,
        metadataStripping: settings.metadataStripping,
      });
    }
  );

  // When room changes, join/leave signaling
  useTallowStore.subscribe(
    (state) => state.room?.code,
    (code, prevCode) => {
      if (code && !prevCode) {
        webrtc.joinRoom(code);
      } else if (!code && prevCode) {
        webrtc.leaveRoom();
      }
    }
  );

  return {
    cleanup: () => {
      webrtc.removeAllListeners();
    },
  };
}
```

---

## Invocation Examples

```
"Use state-management-expert to design the Zustand store for Tallow"

"Have state-management-expert implement WebRTC state synchronization"

"Get state-management-expert to optimize selectors for transfer progress"

"Use state-management-expert to add persistence for security settings"
```

---

## Coordination with Other Agents

| Task                  | Coordinates With          |
| --------------------- | ------------------------- |
| Component integration | `react-architect`         |
| Type definitions      | `typescript-expert`       |
| WebRTC integration    | Works with WebRTC backend |
| Performance           | `performance-engineer`    |
| Testing               | `test-automator`          |
