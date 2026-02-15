/**
 * Trust Actions -- Plain TypeScript Module
 * Agent 048 -- TRUST-BUILDER
 *
 * Wraps all Zustand store access for trust/verification in plain
 * functions that live OUTSIDE React hooks. This prevents the React
 * compiler / Turbopack from transforming .getState() calls into
 * reactive subscriptions (see MEMORY.md).
 *
 * Functions here are called by components and hooks but never directly
 * import store hooks at the call site.
 */

import { useFriendsStore } from '@/lib/stores/friends-store';
import { useDeviceStore } from '@/lib/stores/device-store';
import { generateSASCode, handleSASMismatch } from '@/lib/crypto/sas';
import type { SASCode, SASDisplayMode } from '@/lib/crypto/sas';
import type { Friend } from '@/lib/stores/friends-store';

// ============================================================================
// TRUST LEVEL TYPES
// ============================================================================

/**
 * Trust levels form a progression:
 *   new -> connected -> verified -> trusted
 *
 * Each level is a superset of the previous. Users can only advance
 * forward, never backward (except by removing the contact entirely).
 */
export type TrustLevel = 'new' | 'connected' | 'verified' | 'trusted';

/**
 * Information about the current connection's security posture.
 * Used by the Security Info panel to explain what's happening in
 * plain English.
 */
export interface SecurityInfo {
  /** Human-readable encryption description */
  encryption: string;
  /** Technical algorithm identifier */
  algorithm: string;
  /** Whether post-quantum encryption is active */
  postQuantum: boolean;
  /** Connection path description */
  connectionPath: string;
  /** Whether traffic goes through a relay */
  isRelayed: boolean;
  /** Current trust level of the connection */
  trustLevel: TrustLevel;
  /** Human-readable trust level description */
  trustDescription: string;
  /** Whether SAS verification has been completed */
  sasVerified: boolean;
  /** When SAS was last verified (ISO string or null) */
  sasVerifiedAt: string | null;
  /** Key fingerprint for display (truncated, hex) */
  keyFingerprint: string | null;
}

// ============================================================================
// TRUST LEVEL COMPUTATION
// ============================================================================

/**
 * Compute the trust level for a given device.
 * This reads the friends store to check if the device is known,
 * verified, or trusted.
 */
export function computeTrustLevel(deviceId: string | null): TrustLevel {
  if (!deviceId) return 'new';

  const friend = useFriendsStore.getState().getFriendById(deviceId);
  if (!friend) return 'new';

  if (friend.isTrusted && friend.sasVerifiedAt) return 'trusted';
  if (friend.sasVerifiedAt) return 'verified';
  return 'connected';
}

/**
 * Get a human-readable description for each trust level.
 * These descriptions use plain English -- no jargon.
 */
export function getTrustLevelDescription(level: TrustLevel): string {
  switch (level) {
    case 'new':
      return 'First time connecting to this device';
    case 'connected':
      return 'Device is connected but not yet verified';
    case 'verified':
      return "You've confirmed this device's identity using a security code";
    case 'trusted':
      return 'This device is in your trusted contacts list';
  }
}

// ============================================================================
// BADGE TOOLTIP TEXT
// ============================================================================

export const BADGE_TOOLTIPS = {
  quantumSafe:
    'Your connection uses post-quantum encryption that protects against both current and future quantum computers',
  verified:
    "You've confirmed this device's identity using a security code",
  trusted:
    'This device is in your trusted contacts list',
  newDevice:
    'First time connecting to this device',
  endToEnd:
    'Only you and the recipient can see your files -- no one else, not even Tallow',
  zeroKnowledge:
    'We never see your files. Keys stay on sender and receiver devices.',
} as const;

// ============================================================================
// SECURITY INFO ASSEMBLY
// ============================================================================

/**
 * Assemble the full security information for the current connection.
 * Reads from device and friends stores (Turbopack-safe: plain function).
 */
export function getSecurityInfo(
  deviceId: string | null,
  mode: 'local' | 'internet' | 'friends',
  sasVerified: boolean,
): SecurityInfo {
  const connectionType = useDeviceStore.getState().connection.connectionType;
  const isRelayed = connectionType === 'relay';
  const trustLevel = computeTrustLevel(deviceId);
  const friend = deviceId
    ? useFriendsStore.getState().getFriendById(deviceId)
    : undefined;

  let connectionPath: string;
  switch (mode) {
    case 'local':
      connectionPath = 'Direct local network connection -- your data never leaves your network';
      break;
    case 'internet':
      connectionPath = isRelayed
        ? 'Connected through an encrypted relay -- your data passes through a relay server but remains encrypted end-to-end'
        : 'Direct peer-to-peer connection over the internet -- your data goes straight to the other device';
      break;
    case 'friends':
      connectionPath = 'Trusted contacts channel -- pre-verified secure connection';
      break;
    default:
      connectionPath = 'Secure connection active';
  }

  const keyFingerprint = friend?.publicKey
    ? truncateFingerprint(friend.publicKey)
    : null;

  return {
    encryption: 'Post-quantum encrypted',
    algorithm: 'ML-KEM-768',
    postQuantum: true,
    connectionPath,
    isRelayed,
    trustLevel,
    trustDescription: getTrustLevelDescription(trustLevel),
    sasVerified,
    sasVerifiedAt: friend?.sasVerifiedAt
      ? new Date(friend.sasVerifiedAt).toISOString()
      : null,
    keyFingerprint,
  };
}

// ============================================================================
// SAS VERIFICATION ACTIONS
// ============================================================================

/**
 * Generate a SAS code from a shared secret for the current session.
 * This wraps the crypto layer's generateSASCode in a Turbopack-safe
 * plain function.
 */
export async function generateSessionSAS(
  sharedSecret: Uint8Array,
  sessionContext?: string,
): Promise<SASCode> {
  return generateSASCode(sharedSecret, sessionContext);
}

/**
 * Handle SAS confirmation: upgrades the trust level in the friends store.
 * Called when the user confirms the SAS codes match.
 */
export function confirmSASVerification(deviceId: string): void {
  const store = useFriendsStore.getState();
  const friend = store.getFriendById(deviceId);

  if (friend) {
    // Existing friend: mark as SAS verified (upgrades trust)
    store.markFriendSASVerified(deviceId);
  }
  // If not a friend yet, the transfer page should add them first
}

/**
 * Handle SAS rejection: terminates the connection and logs the event.
 * Called when the user reports a SAS mismatch.
 *
 * This function:
 * 1. Immediately disconnects the peer connection
 * 2. Logs a security warning via handleSASMismatch
 * 3. Returns the mismatch report for UI display
 */
export async function rejectSASVerification(
  deviceId: string,
  sessionId: string,
  method: SASDisplayMode | 'qr' = 'emoji',
) {
  const disconnect = () => {
    useDeviceStore.getState().disconnect();
  };

  return handleSASMismatch(disconnect, deviceId, sessionId, method);
}

// ============================================================================
// FRIEND STORE QUERIES (Turbopack-safe wrappers)
// ============================================================================

export function getFriendById(id: string): Friend | undefined {
  return useFriendsStore.getState().getFriendById(id);
}

export function markFriendSASVerified(id: string): void {
  useFriendsStore.getState().markFriendSASVerified(id);
}

export function setFriendTrusted(id: string, trusted: boolean): void {
  useFriendsStore.getState().setFriendTrusted(id, trusted);
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Truncate a key fingerprint for display.
 * Shows first 8 and last 8 characters with ellipsis.
 */
function truncateFingerprint(key: string): string {
  const clean = key.replace(/^pk_/, '');
  if (clean.length <= 20) return clean;
  return `${clean.slice(0, 8)}...${clean.slice(-8)}`;
}
