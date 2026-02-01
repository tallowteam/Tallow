/**
 * Feature Flag Hooks
 * Custom React hooks for accessing and managing feature flags
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFeatureFlagsContext } from '@/lib/feature-flags/feature-flags-context';
import { FeatureFlagKey, FeatureFlags, DEFAULT_FLAGS, onFlagChange } from '@/lib/feature-flags/launchdarkly';

/**
 * Hook to get a single feature flag value
 *
 * @param flagKey - The feature flag key
 * @param defaultValue - Optional default value if flag is not available
 * @returns The current value of the feature flag
 *
 * @example
 * const isVoiceEnabled = useFeatureFlag(FeatureFlags.VOICE_COMMANDS);
 */
export function useFeatureFlag(flagKey: FeatureFlagKey, defaultValue?: boolean): boolean {
  const { flags, loading } = useFeatureFlagsContext();

  if (loading) {
    return defaultValue ?? DEFAULT_FLAGS[flagKey];
  }

  return flags[flagKey] ?? defaultValue ?? DEFAULT_FLAGS[flagKey];
}

/**
 * Hook to get multiple feature flags at once
 *
 * @param flagKeys - Array of feature flag keys
 * @returns Object with flag keys as properties and their values
 *
 * @example
 * const { voiceCommands, cameraCapture } = useFeatureFlags([
 *   FeatureFlags.VOICE_COMMANDS,
 *   FeatureFlags.CAMERA_CAPTURE,
 * ]);
 */
export function useFeatureFlags(flagKeys: FeatureFlagKey[]): Record<string, boolean> {
  const { flags, loading } = useFeatureFlagsContext();

  const result: Record<string, boolean> = {};

  for (const key of flagKeys) {
    if (loading) {
      result[key] = DEFAULT_FLAGS[key];
    } else {
      result[key] = flags[key] ?? DEFAULT_FLAGS[key];
    }
  }

  return result;
}

/**
 * Hook to get all feature flags
 *
 * @returns Object containing all feature flags
 *
 * @example
 * const allFlags = useAllFeatureFlags();
 */
export function useAllFeatureFlags() {
  const { flags, loading } = useFeatureFlagsContext();

  if (loading) {
    return DEFAULT_FLAGS;
  }

  return flags;
}

/**
 * Hook to listen for changes to a specific feature flag
 *
 * @param flagKey - The feature flag key to watch
 * @param callback - Function to call when the flag value changes
 *
 * @example
 * useFlagChangeListener(FeatureFlags.VOICE_COMMANDS, (newValue) => {
 *   secureLog.log('Voice commands enabled:', newValue);
 * });
 */
export function useFlagChangeListener(flagKey: FeatureFlagKey, callback: (newValue: boolean) => void) {
  useEffect(() => {
    const unsubscribe = onFlagChange(flagKey, callback);
    return unsubscribe;
  }, [flagKey, callback]);
}

/**
 * Hook to get feature flag with reactive updates
 * This hook will cause re-renders when the flag value changes
 *
 * @param flagKey - The feature flag key
 * @returns Current value of the feature flag
 *
 * @example
 * const isEnabled = useReactiveFeatureFlag(FeatureFlags.VOICE_COMMANDS);
 */
export function useReactiveFeatureFlag(flagKey: FeatureFlagKey): boolean {
  const initialValue = useFeatureFlag(flagKey);
  const [value, setValue] = useState(initialValue);

  useFlagChangeListener(flagKey, setValue);

  return value;
}

/**
 * Hook to identify user with LaunchDarkly
 *
 * @returns Function to identify a user
 *
 * @example
 * const identifyUser = useIdentifyUser();
 * identifyUser('user-123', { email: 'user@example.com' });
 */
export function useIdentifyUser() {
  const { identify } = useFeatureFlagsContext();
  return useCallback(
    (userId: string, attributes?: Record<string, any>) => {
      return identify(userId, attributes);
    },
    [identify]
  );
}

/**
 * Hook to check if feature flags are still loading
 *
 * @returns Boolean indicating if flags are loading
 *
 * @example
 * const isLoading = useFeatureFlagsLoading();
 * if (isLoading) return <Spinner />;
 */
export function useFeatureFlagsLoading(): boolean {
  const { loading } = useFeatureFlagsContext();
  return loading;
}

/**
 * Hook to get feature flag error state
 *
 * @returns Error object if there was an error loading flags
 *
 * @example
 * const error = useFeatureFlagsError();
 * if (error) secureLog.error('Feature flags error:', error);
 */
export function useFeatureFlagsError(): Error | null {
  const { error } = useFeatureFlagsContext();
  return error;
}

/**
 * Predefined hooks for common feature flags
 * These provide a convenient API for frequently used flags
 */

export function useVoiceCommands(): boolean {
  return useFeatureFlag(FeatureFlags.VOICE_COMMANDS);
}

export function useCameraCapture(): boolean {
  return useFeatureFlag(FeatureFlags.CAMERA_CAPTURE);
}

export function useMetadataStripping(): boolean {
  return useFeatureFlag(FeatureFlags.METADATA_STRIPPING);
}

export function useOneTimeTransfers(): boolean {
  return useFeatureFlag(FeatureFlags.ONE_TIME_TRANSFERS);
}

export function usePQCEncryption(): boolean {
  return useFeatureFlag(FeatureFlags.PQC_ENCRYPTION);
}

export function useAdvancedPrivacy(): boolean {
  return useFeatureFlag(FeatureFlags.ADVANCED_PRIVACY);
}

export function useQRCodeSharing(): boolean {
  return useFeatureFlag(FeatureFlags.QR_CODE_SHARING);
}

export function useEmailSharing(): boolean {
  return useFeatureFlag(FeatureFlags.EMAIL_SHARING);
}

export function useLinkExpiration(): boolean {
  return useFeatureFlag(FeatureFlags.LINK_EXPIRATION);
}

export function useCustomThemes(): boolean {
  return useFeatureFlag(FeatureFlags.CUSTOM_THEMES);
}

export function useMobileAppPromo(): boolean {
  return useFeatureFlag(FeatureFlags.MOBILE_APP_PROMO);
}

export function useDonationPrompts(): boolean {
  return useFeatureFlag(FeatureFlags.DONATION_PROMPTS);
}
