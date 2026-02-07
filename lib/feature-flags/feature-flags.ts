/**
 * Feature Flags System
 *
 * A lightweight, self-contained feature flag management system that supports:
 * - Default flag values
 * - Remote configuration via API
 * - Local storage overrides
 * - URL parameter overrides
 *
 * Override precedence: URL params > localStorage > remote > defaults
 */

'use client';

import { secureLog } from '../utils/secure-logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type FeatureFlagKey =
  | 'chat_enabled'
  | 'voice_memos'
  | 'location_sharing'
  | 'screen_sharing'
  | 'broadcast_mode'
  | 'scheduled_transfers'
  | 'team_workspaces'
  | 'browser_extension_api'
  | 'advanced_compression'
  | 'delta_sync'
  | 'webauthn'
  | 'webtransport'
  | 'plausible_analytics'
  | 'sentry_tracking'
  | 'i18n_enabled'
  | 'guest_mode'
  | 'experimental_pqc'
  | 'debug_mode';

export type FeatureFlagValues = Record<FeatureFlagKey, boolean>;

type FlagChangeListener = (flag: FeatureFlagKey, enabled: boolean) => void;

// ============================================================================
// DEFAULT FLAG VALUES
// ============================================================================

const DEFAULT_FLAGS: FeatureFlagValues = {
  // Core features - enabled by default
  chat_enabled: true,
  voice_memos: true,
  location_sharing: false, // Privacy-sensitive, disabled by default
  screen_sharing: true,
  broadcast_mode: true,
  scheduled_transfers: true,
  team_workspaces: true,

  // Integration features
  browser_extension_api: true,

  // Advanced features
  advanced_compression: true,
  delta_sync: true,

  // Authentication
  webauthn: true,

  // Experimental transport
  webtransport: false, // Experimental, disabled by default

  // Analytics & tracking - disabled by default for privacy
  plausible_analytics: false,
  sentry_tracking: false,

  // Localization
  i18n_enabled: true,

  // Privacy features
  guest_mode: true,

  // Experimental features - disabled by default
  experimental_pqc: false,

  // Developer features
  debug_mode: false,
};

// ============================================================================
// FEATURE FLAGS SINGLETON
// ============================================================================

class FeatureFlagsManager {
  private flags: FeatureFlagValues;
  private listeners: Set<FlagChangeListener>;
  private initialized: boolean;
  private remoteFlags: Partial<FeatureFlagValues> | null;

  constructor() {
    this.flags = { ...DEFAULT_FLAGS };
    this.listeners = new Set();
    this.initialized = false;
    this.remoteFlags = null;
  }

  /**
   * Initialize the feature flags system
   * Loads flags from all sources in order: defaults > remote > localStorage > URL
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Start with defaults
      this.flags = { ...DEFAULT_FLAGS };

      // Load remote flags
      await this.loadRemoteFlags();

      // Apply remote flags if available
      if (this.remoteFlags) {
        this.flags = { ...this.flags, ...this.remoteFlags };
      }

      // Apply localStorage overrides
      this.loadLocalStorageFlags();

      // Apply URL parameter overrides
      this.loadURLFlags();

      this.initialized = true;

      secureLog.log('[FeatureFlags] Initialized with flags:', this.flags);
    } catch (error) {
      secureLog.error('[FeatureFlags] Initialization error:', error);
      // Continue with defaults on error
      this.flags = { ...DEFAULT_FLAGS };
      this.initialized = true;
    }
  }

  /**
   * Load flags from remote API endpoint
   */
  private async loadRemoteFlags(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const response = await fetch('/api/flags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Don't cache flag requests
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        this.remoteFlags = data.flags || {};
        secureLog.debug('[FeatureFlags] Loaded remote flags:', this.remoteFlags);
      } else {
        secureLog.warn('[FeatureFlags] Failed to load remote flags:', response.status);
      }
    } catch (error) {
      // Remote flags are optional, don't throw
      secureLog.debug('[FeatureFlags] Remote flags unavailable:', error);
    }
  }

  /**
   * Load flags from localStorage
   */
  private loadLocalStorageFlags(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem('tallow-feature-flags');
      if (stored) {
        const localFlags = JSON.parse(stored) as Partial<FeatureFlagValues>;

        // Only apply valid flags
        Object.keys(localFlags).forEach((key) => {
          if (this.isValidFlagKey(key)) {
            this.flags[key as FeatureFlagKey] = localFlags[key as FeatureFlagKey] ?? this.flags[key as FeatureFlagKey];
          }
        });

        secureLog.debug('[FeatureFlags] Loaded localStorage flags');
      }
    } catch (error) {
      secureLog.error('[FeatureFlags] Error loading localStorage flags:', error);
    }
  }

  /**
   * Load flags from URL parameters
   * Format: ?flags=chat_enabled:true,debug_mode:true
   */
  private loadURLFlags(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const flagsParam = params.get('flags');

      if (flagsParam) {
        const flagPairs = flagsParam.split(',');

        flagPairs.forEach((pair) => {
          const [key, value] = pair.split(':');

          if (key && value && this.isValidFlagKey(key.trim())) {
            const flagKey = key.trim() as FeatureFlagKey;
            const flagValue = value.trim().toLowerCase() === 'true';
            this.flags[flagKey] = flagValue;
          }
        });

        secureLog.debug('[FeatureFlags] Loaded URL flags');
      }
    } catch (error) {
      secureLog.error('[FeatureFlags] Error loading URL flags:', error);
    }
  }

  /**
   * Check if a string is a valid feature flag key
   */
  private isValidFlagKey(key: string): key is FeatureFlagKey {
    return key in DEFAULT_FLAGS;
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flag: FeatureFlagKey): boolean {
    if (!this.initialized) {
      // Return default if not initialized
      return DEFAULT_FLAGS[flag];
    }

    return this.flags[flag];
  }

  /**
   * Set a feature flag value (persists to localStorage)
   */
  setFlag(flag: FeatureFlagKey, enabled: boolean): void {
    const previousValue = this.flags[flag];
    this.flags[flag] = enabled;

    // Persist to localStorage
    this.saveToLocalStorage();

    // Notify listeners if value changed
    if (previousValue !== enabled) {
      this.notifyListeners(flag, enabled);
    }

    secureLog.debug(`[FeatureFlags] Set ${flag} = ${enabled}`);
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlagValues {
    return { ...this.flags };
  }

  /**
   * Reset a flag to its default value
   */
  resetFlag(flag: FeatureFlagKey): void {
    this.setFlag(flag, DEFAULT_FLAGS[flag]);
  }

  /**
   * Reset all flags to defaults
   */
  resetAllFlags(): void {
    this.flags = { ...DEFAULT_FLAGS };
    this.saveToLocalStorage();

    // Notify all listeners
    Object.keys(this.flags).forEach((key) => {
      const flagKey = key as FeatureFlagKey;
      this.notifyListeners(flagKey, this.flags[flagKey]);
    });

    secureLog.log('[FeatureFlags] Reset all flags to defaults');
  }

  /**
   * Save current flags to localStorage
   */
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem('tallow-feature-flags', JSON.stringify(this.flags));
    } catch (error) {
      secureLog.error('[FeatureFlags] Error saving to localStorage:', error);
    }
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(listener: FlagChangeListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of a flag change
   */
  private notifyListeners(flag: FeatureFlagKey, enabled: boolean): void {
    this.listeners.forEach((listener) => {
      try {
        listener(flag, enabled);
      } catch (error) {
        secureLog.error('[FeatureFlags] Listener error:', error);
      }
    });
  }

  /**
   * Get default value for a flag
   */
  getDefaultValue(flag: FeatureFlagKey): boolean {
    return DEFAULT_FLAGS[flag];
  }

  /**
   * Check if flags are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Refresh remote flags
   */
  async refresh(): Promise<void> {
    await this.loadRemoteFlags();

    if (this.remoteFlags) {
      // Apply remote flags (without overriding localStorage or URL flags)
      Object.keys(this.remoteFlags).forEach((key) => {
        const flagKey = key as FeatureFlagKey;
        // Only update if not overridden locally
        if (!this.hasLocalOverride(flagKey)) {
          const newValue = this.remoteFlags![flagKey];
          if (newValue !== undefined && newValue !== this.flags[flagKey]) {
            this.flags[flagKey] = newValue;
            this.notifyListeners(flagKey, newValue);
          }
        }
      });
    }
  }

  /**
   * Check if a flag has a local override (localStorage or URL)
   */
  private hasLocalOverride(flag: FeatureFlagKey): boolean {
    // Check localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tallow-feature-flags');
        if (stored) {
          const localFlags = JSON.parse(stored) as Partial<FeatureFlagValues>;
          if (flag in localFlags) {
            return true;
          }
        }
      } catch {
        // Ignore errors
      }

      // Check URL params
      try {
        const params = new URLSearchParams(window.location.search);
        const flagsParam = params.get('flags');
        if (flagsParam && flagsParam.includes(flag)) {
          return true;
        }
      } catch {
        // Ignore errors
      }
    }

    return false;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

const featureFlags = new FeatureFlagsManager();

// Auto-initialize on client side
if (typeof window !== 'undefined') {
  featureFlags.initialize().catch((error) => {
    secureLog.error('[FeatureFlags] Auto-initialization failed:', error);
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default featureFlags;

export const FeatureFlags = featureFlags;

// Export utility functions
export const isEnabled = (flag: FeatureFlagKey) => featureFlags.isEnabled(flag);
export const setFlag = (flag: FeatureFlagKey, enabled: boolean) => featureFlags.setFlag(flag, enabled);
export const getAllFlags = () => featureFlags.getAllFlags();
export const resetFlag = (flag: FeatureFlagKey) => featureFlags.resetFlag(flag);
export const resetAllFlags = () => featureFlags.resetAllFlags();
export const subscribe = (listener: FlagChangeListener) => featureFlags.subscribe(listener);
export const getDefaultValue = (flag: FeatureFlagKey) => featureFlags.getDefaultValue(flag);
export const refresh = () => featureFlags.refresh();
