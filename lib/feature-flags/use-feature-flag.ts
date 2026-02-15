/**
 * Feature Flag Hooks
 *
 * React hooks for accessing and managing feature flags with automatic
 * re-rendering when flags change.
 */

'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import featureFlags, { FeatureFlagKey, FeatureFlagValues } from './feature-flags';

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to check if a feature flag is enabled
 * Automatically re-renders when the flag value changes
 *
 * @param flag - The feature flag key to check
 * @returns boolean indicating if the flag is enabled
 *
 * @example
 * const isChatEnabled = useFeatureFlag('chat_enabled');
 *
 * if (isChatEnabled) {
 *   return <ChatComponent />;
 * }
 */
export function useFeatureFlag(flag: FeatureFlagKey): boolean {
  // Track initialization state
  const [, setIsInitialized] = useState(featureFlags.isInitialized());

  // Wait for initialization on mount
  useEffect(() => {
    if (!featureFlags.isInitialized()) {
      featureFlags.initialize().then(() => {
        setIsInitialized(true);
      });
    }
  }, []);

  // Use external store to subscribe to flag changes
  const enabled = useSyncExternalStore(
    // Subscribe function
    (callback) => {
      const unsubscribe = featureFlags.subscribe((changedFlag, _enabled) => {
        // Only trigger callback if the specific flag we're watching changed
        if (changedFlag === flag) {
          callback();
        }
      });

      return unsubscribe;
    },
    // Get snapshot
    () => featureFlags.isEnabled(flag),
    // Get server snapshot (always use default on server)
    () => featureFlags.getDefaultValue(flag)
  );

  return enabled;
}

/**
 * Hook to get all feature flags
 * Automatically re-renders when any flag value changes
 *
 * @returns Object containing all feature flags
 *
 * @example
 * const flags = useFeatureFlags();
 *
 * if (flags.chat_enabled && flags.voice_memos) {
 *   return <AdvancedChat />;
 * }
 */
export function useFeatureFlags(): FeatureFlagValues {
  // Track initialization state
  const [, setIsInitialized] = useState(featureFlags.isInitialized());

  // Wait for initialization on mount
  useEffect(() => {
    if (!featureFlags.isInitialized()) {
      featureFlags.initialize().then(() => {
        setIsInitialized(true);
      });
    }
  }, []);

  // Use external store to subscribe to flag changes
  const flags = useSyncExternalStore(
    // Subscribe function - any flag change triggers update
    (callback) => featureFlags.subscribe(callback),
    // Get snapshot
    () => featureFlags.getAllFlags(),
    // Get server snapshot (not used on server)
    () => featureFlags.getAllFlags()
  );

  return flags;
}

/**
 * Hook to toggle a feature flag
 * Returns current value and setter function
 *
 * @param flag - The feature flag key
 * @returns [enabled, setEnabled] tuple
 *
 * @example
 * const [debugMode, setDebugMode] = useFeatureFlagToggle('debug_mode');
 *
 * <Toggle
 *   checked={debugMode}
 *   onChange={setDebugMode}
 *   label="Debug Mode"
 * />
 */
export function useFeatureFlagToggle(flag: FeatureFlagKey): [boolean, (enabled: boolean) => void] {
  const enabled = useFeatureFlag(flag);

  const setEnabled = (newValue: boolean) => {
    featureFlags.setFlag(flag, newValue);
  };

  return [enabled, setEnabled];
}

/**
 * Hook to reset a feature flag to its default value
 *
 * @param flag - The feature flag key
 * @returns Function to reset the flag
 *
 * @example
 * const resetDebugMode = useFeatureFlagReset('debug_mode');
 *
 * <Button onClick={resetDebugMode}>
 *   Reset to Default
 * </Button>
 */
export function useFeatureFlagReset(flag: FeatureFlagKey): () => void {
  return () => {
    featureFlags.resetFlag(flag);
  };
}

/**
 * Hook to get the default value of a feature flag
 *
 * @param flag - The feature flag key
 * @returns Default boolean value
 *
 * @example
 * const defaultValue = useFeatureFlagDefault('chat_enabled');
 */
export function useFeatureFlagDefault(flag: FeatureFlagKey): boolean {
  return featureFlags.getDefaultValue(flag);
}

/**
 * Hook to check if feature flags are initialized
 *
 * @returns boolean indicating initialization state
 *
 * @example
 * const isReady = useFeatureFlagsReady();
 *
 * if (!isReady) {
 *   return <Spinner />;
 * }
 */
export function useFeatureFlagsReady(): boolean {
  const [isReady, setIsReady] = useState(featureFlags.isInitialized());

  useEffect(() => {
    if (!featureFlags.isInitialized()) {
      featureFlags.initialize().then(() => {
        setIsReady(true);
      });
    }
  }, []);

  return isReady;
}

// ============================================================================
// CONVENIENCE HOOKS FOR SPECIFIC FLAGS
// ============================================================================

/**
 * Check if chat is enabled
 */
export function useChatEnabled(): boolean {
  return useFeatureFlag('chat_enabled');
}

/**
 * Check if voice memos are enabled
 */
export function useVoiceMemosEnabled(): boolean {
  return useFeatureFlag('voice_memos');
}

/**
 * Check if location sharing is enabled
 */
export function useLocationSharingEnabled(): boolean {
  return useFeatureFlag('location_sharing');
}

/**
 * Check if screen sharing is enabled
 */
export function useScreenSharingEnabled(): boolean {
  return useFeatureFlag('screen_sharing');
}

/**
 * Check if broadcast mode is enabled
 */
export function useBroadcastModeEnabled(): boolean {
  return useFeatureFlag('broadcast_mode');
}

/**
 * Check if scheduled transfers are enabled
 */
export function useScheduledTransfersEnabled(): boolean {
  return useFeatureFlag('scheduled_transfers');
}

/**
 * Check if team workspaces are enabled
 */
export function useTeamWorkspacesEnabled(): boolean {
  return useFeatureFlag('team_workspaces');
}

/**
 * Check if browser extension API is enabled
 */
export function useBrowserExtensionAPIEnabled(): boolean {
  return useFeatureFlag('browser_extension_api');
}

/**
 * Check if share sheet integrations are enabled
 */
export function useShareSheetIntegrationsEnabled(): boolean {
  return useFeatureFlag('share_sheet_integrations');
}

/**
 * Check if NFC pairing is enabled
 */
export function useNFCPairingEnabled(): boolean {
  return useFeatureFlag('nfc_pairing');
}

/**
 * Check if QR linking is enabled
 */
export function useQRLinkingEnabled(): boolean {
  return useFeatureFlag('qr_linking');
}

/**
 * Check if clipboard sharing is enabled
 */
export function useClipboardSharingEnabled(): boolean {
  return useFeatureFlag('clipboard_sharing');
}

/**
 * Check if advanced compression is enabled
 */
export function useAdvancedCompressionEnabled(): boolean {
  return useFeatureFlag('advanced_compression');
}

/**
 * Check if delta sync is enabled
 */
export function useDeltaSyncEnabled(): boolean {
  return useFeatureFlag('delta_sync');
}

/**
 * Check if WebAuthn is enabled
 */
export function useWebAuthnEnabled(): boolean {
  return useFeatureFlag('webauthn');
}

/**
 * Check if WebTransport is enabled
 */
export function useWebTransportEnabled(): boolean {
  return useFeatureFlag('webtransport');
}

/**
 * Check if Plausible analytics is enabled
 */
export function usePlausibleAnalyticsEnabled(): boolean {
  return useFeatureFlag('plausible_analytics');
}

/**
 * Check if Sentry tracking is enabled
 */
export function useSentryTrackingEnabled(): boolean {
  return useFeatureFlag('sentry_tracking');
}

/**
 * Check if i18n is enabled
 */
export function useI18nEnabled(): boolean {
  return useFeatureFlag('i18n_enabled');
}

/**
 * Check if guest mode is enabled
 */
export function useGuestModeEnabled(): boolean {
  return useFeatureFlag('guest_mode');
}

/**
 * Check if experimental PQC is enabled
 */
export function useExperimentalPQCEnabled(): boolean {
  return useFeatureFlag('experimental_pqc');
}

/**
 * Check if debug mode is enabled
 */
export function useDebugModeEnabled(): boolean {
  return useFeatureFlag('debug_mode');
}
