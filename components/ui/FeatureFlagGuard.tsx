/**
 * Feature Flag Guard Component
 *
 * Conditionally renders children based on feature flag state.
 * Useful for hiding/showing features without code changes.
 */

'use client';

import { ReactNode } from 'react';
import { useFeatureFlag, useFeatureFlags } from '@/lib/feature-flags/use-feature-flag';
import { FeatureFlagKey } from '@/lib/feature-flags/feature-flags';

// ============================================================================
// TYPES
// ============================================================================

export interface FeatureFlagGuardProps {
  /**
   * The feature flag key to check
   */
  flag: FeatureFlagKey;

  /**
   * Content to render when flag is enabled
   */
  children: ReactNode;

  /**
   * Optional content to render when flag is disabled
   */
  fallback?: ReactNode;

  /**
   * If true, inverts the logic (renders children when flag is disabled)
   * @default false
   */
  invert?: boolean;

  /**
   * Optional loading state while flags are initializing
   */
  loading?: ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * FeatureFlagGuard Component
 *
 * Conditionally renders children based on feature flag state.
 *
 * @example
 * // Basic usage - show only when enabled
 * <FeatureFlagGuard flag="chat_enabled">
 *   <ChatComponent />
 * </FeatureFlagGuard>
 *
 * @example
 * // With fallback content
 * <FeatureFlagGuard
 *   flag="team_workspaces"
 *   fallback={<ComingSoonBanner />}
 * >
 *   <TeamWorkspaceUI />
 * </FeatureFlagGuard>
 *
 * @example
 * // Inverted logic - show when disabled
 * <FeatureFlagGuard flag="debug_mode" invert>
 *   <ProductionOnlyFeature />
 * </FeatureFlagGuard>
 */
export function FeatureFlagGuard({
  flag,
  children,
  fallback = null,
  invert = false,
  loading: _loading = null,
}: FeatureFlagGuardProps) {
  const isEnabled = useFeatureFlag(flag);

  // Determine if we should render children
  const shouldRender = invert ? !isEnabled : isEnabled;

  // Render children or fallback based on flag state
  return <>{shouldRender ? children : fallback}</>;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Multiple flag guard - requires ALL flags to be enabled
 *
 * @example
 * <FeatureFlagGuardAll flags={['chat_enabled', 'voice_memos']}>
 *   <VoiceChatComponent />
 * </FeatureFlagGuardAll>
 */
export function FeatureFlagGuardAll({
  flags,
  children,
  fallback = null,
}: {
  flags: FeatureFlagKey[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const allFlags = useFeatureFlags();
  const allEnabled = flags.every((flag) => allFlags[flag]);

  return <>{allEnabled ? children : fallback}</>;
}

/**
 * Multiple flag guard - requires ANY flag to be enabled
 *
 * @example
 * <FeatureFlagGuardAny flags={['screen_sharing', 'voice_memos']}>
 *   <MediaFeaturesSection />
 * </FeatureFlagGuardAny>
 */
export function FeatureFlagGuardAny({
  flags,
  children,
  fallback = null,
}: {
  flags: FeatureFlagKey[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const allFlags = useFeatureFlags();
  const anyEnabled = flags.some((flag) => allFlags[flag]);

  return <>{anyEnabled ? children : fallback}</>;
}

/**
 * Feature flag guard with render props pattern
 *
 * @example
 * <FeatureFlagGuardRender flag="debug_mode">
 *   {(isEnabled) => (
 *     <Button variant={isEnabled ? 'primary' : 'secondary'}>
 *       {isEnabled ? 'Debug Mode On' : 'Debug Mode Off'}
 *     </Button>
 *   )}
 * </FeatureFlagGuardRender>
 */
export function FeatureFlagGuardRender({
  flag,
  children,
}: {
  flag: FeatureFlagKey;
  children: (isEnabled: boolean) => ReactNode;
}) {
  const isEnabled = useFeatureFlag(flag);

  return <>{children(isEnabled)}</>;
}
