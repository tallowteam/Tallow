/**
 * Flow Preferences — Plain TypeScript Module
 *
 * Stores and retrieves user flow preferences from localStorage.
 * This is intentionally a plain module (not a hook) to avoid
 * Turbopack/React Compiler infinite loop issues with Zustand stores.
 *
 * @see MEMORY.md — Critical Turbopack constraint
 * @module flow-preferences
 */

// ============================================================================
// TYPES
// ============================================================================

export type TransferMode = 'nearby' | 'remote';

export interface FlowPreferences {
  /** Last mode the user selected */
  lastUsedMode: TransferMode | null;
  /** Timestamp of last mode selection */
  lastUsedModeAt: number | null;
  /** Number of times each mode was selected (for smart defaults) */
  modeUsageCounts: Record<TransferMode, number>;
  /** Whether the user has completed at least one transfer */
  hasCompletedTransfer: boolean;
  /** Version for future migrations */
  version: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'tallow-flow-preferences';
const CURRENT_VERSION = 2;

/** Maximum age before last-used mode is considered stale (7 days) */
const MAX_STALE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const DEFAULT_PREFERENCES: FlowPreferences = {
  lastUsedMode: null,
  lastUsedModeAt: null,
  modeUsageCounts: { nearby: 0, remote: 0 },
  hasCompletedTransfer: false,
  version: CURRENT_VERSION,
};

// ============================================================================
// STORAGE HELPERS
// ============================================================================

function loadPreferences(): FlowPreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PREFERENCES };
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    // ---------------------------------------------------------------
    // v1 -> v2 migration: 3 modes (local/internet/friends) collapsed
    // into 2 modes (nearby/remote). Friends is no longer a separate
    // mode; it is integrated into both nearby and remote flows.
    //   local   -> nearby
    //   internet -> remote
    //   friends  -> nearby
    // Usage counts are merged: nearby = local + friends, remote = internet
    // ---------------------------------------------------------------
    if (parsed.version === 1) {
      const oldCounts = (parsed.modeUsageCounts ?? {}) as Record<string, number>;
      const oldMode = parsed.lastUsedMode as string | null;

      const migrateMode = (mode: string | null): TransferMode | null => {
        if (mode === 'local' || mode === 'friends') return 'nearby';
        if (mode === 'internet') return 'remote';
        return null;
      };

      const migrated: FlowPreferences = {
        lastUsedMode: migrateMode(oldMode),
        lastUsedModeAt: (parsed.lastUsedModeAt as number) ?? null,
        modeUsageCounts: {
          nearby: (oldCounts.local ?? 0) + (oldCounts.friends ?? 0),
          remote: oldCounts.internet ?? 0,
        },
        hasCompletedTransfer: (parsed.hasCompletedTransfer as boolean) ?? false,
        version: CURRENT_VERSION,
      };

      savePreferences(migrated);
      return migrated;
    }

    if (parsed.version !== CURRENT_VERSION) {
      return { ...DEFAULT_PREFERENCES };
    }

    const counts = (parsed.modeUsageCounts ?? {}) as Record<string, number>;

    return {
      lastUsedMode: (parsed.lastUsedMode as TransferMode) ?? null,
      lastUsedModeAt: (parsed.lastUsedModeAt as number) ?? null,
      modeUsageCounts: {
        nearby: counts.nearby ?? 0,
        remote: counts.remote ?? 0,
      },
      hasCompletedTransfer: (parsed.hasCompletedTransfer as boolean) ?? false,
      version: CURRENT_VERSION,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function savePreferences(prefs: FlowPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage full or unavailable -- silently fail
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get the last-used transfer mode, or null if none has been selected
 * or if the preference is stale.
 */
export function getLastUsedMode(): TransferMode | null {
  const prefs = loadPreferences();

  if (!prefs.lastUsedMode || !prefs.lastUsedModeAt) {
    return null;
  }

  const age = Date.now() - prefs.lastUsedModeAt;
  if (age > MAX_STALE_AGE_MS) {
    return null;
  }

  return prefs.lastUsedMode;
}

/**
 * Record that the user selected a transfer mode.
 */
export function recordModeSelection(mode: TransferMode): void {
  const prefs = loadPreferences();
  prefs.lastUsedMode = mode;
  prefs.lastUsedModeAt = Date.now();
  prefs.modeUsageCounts[mode] = (prefs.modeUsageCounts[mode] ?? 0) + 1;
  savePreferences(prefs);
}

/**
 * Record that the user completed a transfer.
 */
export function recordTransferComplete(): void {
  const prefs = loadPreferences();
  prefs.hasCompletedTransfer = true;
  savePreferences(prefs);
}

/**
 * Check whether this is a returning user (has selected a mode before).
 */
export function isReturningUser(): boolean {
  const prefs = loadPreferences();
  return prefs.lastUsedMode !== null;
}

/**
 * Get the full flow preferences object.
 */
export function getFlowPreferences(): FlowPreferences {
  return loadPreferences();
}

/**
 * Determine which mode to auto-select based on:
 * 1. URL search params (room code implies remote mode)
 * 2. Settings constraints (only one mode enabled)
 * 3. Last-used mode for return users
 * 4. Default to 'nearby' for first-time users (no more mode selector gate)
 *
 * Always returns a concrete mode -- never null.
 */
export function resolveAutoSelectMode(options: {
  hasRoomCode: boolean;
  allowLocalDiscovery: boolean;
  allowInternetP2P: boolean;
}): TransferMode {
  // Room code in URL always implies remote mode
  if (options.hasRoomCode) {
    return 'remote';
  }

  // Build the set of available modes
  const availableModes: TransferMode[] = [];
  if (options.allowLocalDiscovery) {
    availableModes.push('nearby');
  }
  if (options.allowInternetP2P) {
    availableModes.push('remote');
  }

  // If only one mode is enabled, auto-select it
  if (availableModes.length === 1) {
    return availableModes[0]!;
  }

  // If neither mode is enabled (edge case), fall back to nearby
  if (availableModes.length === 0) {
    return 'nearby';
  }

  // Return user -- use last-used mode if it is still available
  const lastUsed = getLastUsedMode();
  if (lastUsed && availableModes.includes(lastUsed)) {
    return lastUsed;
  }

  // First-time user -- default to nearby (no mode selector gate)
  return 'nearby';
}
