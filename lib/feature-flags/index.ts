/**
 * Feature Flags
 * Central export for all feature flag utilities
 */

// Standalone feature flags system (recommended)
export {
  default as FeatureFlags,
  isEnabled,
  setFlag,
  getAllFlags,
  resetFlag,
  resetAllFlags,
  subscribe,
  getDefaultValue,
  refresh,
} from './feature-flags';

export type { FeatureFlagKey, FeatureFlagValues } from './feature-flags';

// React hooks
export {
  useFeatureFlag,
  useFeatureFlags,
  useFeatureFlagToggle,
  useFeatureFlagReset,
  useFeatureFlagDefault,
  useFeatureFlagsReady,
  // Convenience hooks
  useChatEnabled,
  useVoiceMemosEnabled,
  useLocationSharingEnabled,
  useScreenSharingEnabled,
  useBroadcastModeEnabled,
  useScheduledTransfersEnabled,
  useTeamWorkspacesEnabled,
  useBrowserExtensionAPIEnabled,
  useAdvancedCompressionEnabled,
  useDeltaSyncEnabled,
  useWebAuthnEnabled,
  useWebTransportEnabled,
  usePlausibleAnalyticsEnabled,
  useSentryTrackingEnabled,
  useI18nEnabled,
  useGuestModeEnabled,
  useExperimentalPQCEnabled,
  useDebugModeEnabled,
} from './use-feature-flag';

// LaunchDarkly client (legacy - kept for backward compatibility)
export {
  FeatureFlags as LaunchDarklyFlags,
  DEFAULT_FLAGS as LaunchDarklyDefaults,
  initLaunchDarkly,
  getLaunchDarklyClient,
  getFeatureFlag as getLaunchDarklyFlag,
  getAllFeatureFlags as getAllLaunchDarklyFlags,
  trackFeatureFlagEvent,
  identifyUser,
  closeLaunchDarkly,
  onFlagChange,
  flushEvents,
} from './launchdarkly';

export type { FeatureFlagKey as LaunchDarklyFlagKey } from './launchdarkly';

// React context (legacy - kept for backward compatibility)
export {
  FeatureFlagsProvider,
  useFeatureFlagsContext,
} from './feature-flags-context';
