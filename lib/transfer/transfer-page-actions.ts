/**
 * Transfer Page Actions — Plain TypeScript Module
 *
 * Provides derived state and read helpers for the transfer page UI
 * (device grid, per-device transfer progress, auto-accept logic).
 *
 * !! TURBOPACK / REACT COMPILER CONSTRAINT !!
 * This module is intentionally a PLAIN TypeScript file — no React imports,
 * no hooks, no "use" prefix on any export. Turbopack aggressively transforms
 * any function that begins with "use" or lives inside a React component/hook,
 * converting `.getState()` calls into full reactive subscriptions and injecting
 * the result into effect dependency arrays. That causes infinite re-render
 * loops. By keeping all Zustand `.getState()` reads in a plain module the
 * compiler leaves them untouched.
 *
 * Components should:
 *   READ  — `useStore(selector)` with a selector (safe reactive subscription)
 *   WRITE — call functions exported from this module (safe from compiler)
 *
 * See: lib/transfer/store-actions.ts for the same pattern applied to
 *      transfer/device store mutations.
 */

import { useDeviceStore } from '@/lib/stores/device-store';
import { useFriendsStore } from '@/lib/stores/friends-store';
import { useTransferStore } from '@/lib/stores/transfer-store';
import type { Transfer } from '@/lib/types';
import type {
  DeviceGridItem,
  DeviceTransferState,
} from '@/components/transfer/transfer-types';

// Re-export so existing imports from this module continue to work
export type { DeviceGridItem, DeviceTransferState };

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

/**
 * Map a TransferStatus (from the shared types) to the simplified status
 * shown on device cards.
 */
function mapTransferStatus(
  status: Transfer['status'],
): DeviceTransferState['status'] | null {
  switch (status) {
    case 'connecting':
    case 'initializing':
    case 'key-exchange':
    case 'pending':
    case 'paused':
      return 'connecting';
    case 'transferring':
    case 'resuming':
    case 'verifying':
      return 'transferring';
    default:
      // completed, failed, cancelled — not shown as active
      return null;
  }
}

/**
 * Extract the primary file name from a Transfer.
 * Falls back to 'Unknown' if no files are present.
 */
function primaryFileName(transfer: Transfer): string {
  const first = transfer.files?.[0];
  return first?.name ?? 'Unknown';
}

/**
 * Extract the device ID that a transfer is associated with.
 * Uses the peer device (the "other side") from the from/to fields,
 * choosing whichever is not the local device.  If neither has data,
 * falls back to the transfer ID itself.
 */
function extractDeviceId(transfer: Transfer): string {
  // For a send, the target device is `to`; for a receive, it's `from`.
  if (transfer.direction === 'send') {
    return transfer.to?.id ?? transfer.id;
  }
  return transfer.from?.id ?? transfer.id;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get merged device + friends list for the device grid.
 *
 * Friends are overlaid on top of LAN-discovered devices. If the same device
 * appears in both the friends store and the device store (matched by ID),
 * the friend entry wins — the device is not duplicated.
 *
 * Sort order: friends before non-friends, online before connecting before
 * offline.
 */
export function getMergedDeviceGridItems(): DeviceGridItem[] {
  const devices = useDeviceStore.getState().devices;
  const friends = useFriendsStore.getState().friends;

  // Build a set of friend IDs for fast deduplication.
  const friendIds = new Set(friends.map((f) => f.id));

  const items: DeviceGridItem[] = [];

  // -- Friends first ----------------------------------------------------------
  for (const friend of friends) {
    // Attempt to find a matching LAN device so we can merge presence info.
    const matchingDevice = devices.find((d) => d.id === friend.id);

    items.push({
      id: friend.id,
      name: friend.name,
      platform: friend.platform,
      status: friend.isOnline || matchingDevice?.isOnline ? 'online' : 'offline',
      isFriend: true,
      friendData: friend,
      ...(matchingDevice ? { deviceData: matchingDevice } : {}),
      isPQC: true,
      discoverySource: matchingDevice ? 'lan' : 'signaling',
      avatar: friend.avatar,
    });
  }

  // -- Non-friend LAN devices -------------------------------------------------
  for (const device of devices) {
    if (friendIds.has(device.id)) {
      continue; // already included via the friends loop
    }

    items.push({
      id: device.id,
      name: device.name,
      platform: device.platform,
      status: device.isOnline ? 'online' : 'offline',
      isFriend: false,
      deviceData: device,
      isPQC: true,
      discoverySource: 'lan',
      avatar: device.avatar,
    });
  }

  // -- Sort: friends first, then by status ------------------------------------
  const statusOrder: Record<DeviceGridItem['status'], number> = {
    online: 0,
    connecting: 1,
    offline: 2,
  };

  items.sort((a, b) => {
    // Friends always come before non-friends.
    if (a.isFriend !== b.isFriend) {
      return a.isFriend ? -1 : 1;
    }
    // Within the same group, sort by status.
    return (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
  });

  return items;
}

/**
 * Get per-device transfer state map for inline progress on device cards.
 *
 * Iterates over all transfers in the store and builds a map keyed by the
 * peer device ID. Only "active" transfers (connecting, transferring,
 * verifying, paused) are included. If a device has multiple active
 * transfers, the most recent one (highest progress) wins.
 */
export function getDeviceTransferMap(): Map<string, DeviceTransferState> {
  const transfers = useTransferStore.getState().transfers;
  const map = new Map<string, DeviceTransferState>();

  for (const transfer of transfers) {
    const mappedStatus = mapTransferStatus(transfer.status);
    if (mappedStatus === null) {
      continue; // not an active transfer
    }

    const deviceId = extractDeviceId(transfer);

    // If this device already has an entry, keep the one with higher progress
    // (i.e. the transfer that is further along).
    const existing = map.get(deviceId);
    if (existing && existing.progress >= (transfer.progress ?? 0)) {
      continue;
    }

    map.set(deviceId, {
      deviceId,
      transferId: transfer.id,
      progress: transfer.progress ?? 0,
      status: mappedStatus,
      speed: transfer.speed ?? 0,
      eta: transfer.eta ?? null,
      fileName: primaryFileName(transfer),
      fileSize: transfer.totalSize ?? 0,
      direction: transfer.direction,
    });
  }

  return map;
}

/**
 * Check if a device should auto-accept incoming transfers.
 *
 * A device auto-accepts when it is a trusted friend in the friends store
 * (i.e. `friend.isTrusted === true`). Returns `false` for unknown device
 * IDs, blocked friends, or friends that have not been marked trusted.
 */
export function shouldAutoAccept(deviceId: string): boolean {
  const state = useFriendsStore.getState();

  // Blocked devices never auto-accept.
  if (state.blockedIds.includes(deviceId)) {
    return false;
  }

  const friend = state.friends.find((f) => f.id === deviceId);
  return friend?.isTrusted ?? false;
}

/**
 * Get the count of active transfers (pending, connecting, transferring,
 * paused, resuming, verifying, initializing, key-exchange).
 */
export function getActiveTransferCount(): number {
  const transfers = useTransferStore.getState().transfers;
  const activeStatuses = new Set([
    'pending',
    'initializing',
    'connecting',
    'key-exchange',
    'transferring',
    'paused',
    'resuming',
    'verifying',
  ]);
  return transfers.filter((t) => activeStatuses.has(t.status)).length;
}

/**
 * Get the total number of devices visible in the grid (friends + LAN).
 *
 * This is cheaper than building the full merged list when only the count
 * is needed (e.g. for an empty-state check).
 */
export function getDeviceGridCount(): number {
  const deviceIds = new Set(
    useDeviceStore.getState().devices.map((d) => d.id),
  );
  const friendIds = useFriendsStore.getState().friends.map((f) => f.id);

  // Union of both ID sets.
  for (const id of friendIds) {
    deviceIds.add(id);
  }

  return deviceIds.size;
}

/**
 * Look up a single DeviceGridItem by ID.
 *
 * Useful when a component needs details for one device without
 * rebuilding the full merged list.
 */
export function getDeviceGridItemById(id: string): DeviceGridItem | null {
  const friend = useFriendsStore.getState().friends.find((f) => f.id === id);
  const device = useDeviceStore.getState().devices.find((d) => d.id === id);

  if (!friend && !device) {
    return null;
  }

  if (friend) {
    return {
      id: friend.id,
      name: friend.name,
      platform: friend.platform,
      status: friend.isOnline || device?.isOnline ? 'online' : 'offline',
      isFriend: true,
      friendData: friend,
      ...(device ? { deviceData: device } : {}),
      isPQC: true,
      discoverySource: device ? 'lan' : 'signaling',
      avatar: friend.avatar,
    };
  }

  // device is guaranteed non-null here
  const d = device!;
  return {
    id: d.id,
    name: d.name,
    platform: d.platform,
    status: d.isOnline ? 'online' : 'offline',
    isFriend: false,
    deviceData: d,
    isPQC: true,
    discoverySource: 'lan',
    avatar: d.avatar,
  };
}
