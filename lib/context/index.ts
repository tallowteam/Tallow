/**
 * Context Barrel Export
 * Central export for all context providers and hooks
 */

export { TransfersProvider, useTransfers } from './transfers-context';
export type { TransferState, ReceivedFile } from './transfers-context';

export { DevicesProvider, useDevices } from './devices-context';
export type { DeviceState, DiscoveredDevice } from './devices-context';

export { SettingsProvider, useSettings } from './settings-context';
export type {
  SettingsState,
  AppSettings,
  PrivacySettings,
  NotificationPreferences,
  AccessibilitySettings,
  ThemeMode,
  LanguageCode,
} from './settings-context';

export { NotificationsProvider, useNotifications } from './notifications-context';
export type {
  NotificationState,
  Notification,
  NotificationGroup,
  NotificationType,
  NotificationPriority,
  NotificationAction,
  ToastOptions,
} from './notifications-context';

export { AppProvider } from './app-provider';

// Notification helpers
export {
  notificationPatterns,
  fileNotifications,
  connectionNotifications,
  transferNotifications,
  securityNotifications,
  settingsNotifications,
  clipboardNotifications,
  createBatchNotificationGroup,
  formatFileSize,
  formatTransferSpeed,
  formatETA,
  createProgressMessage,
} from './notification-helpers';

// Scroll Animation Store (Zustand)
export {
  useScrollAnimationStore,
  selectScrollProgress,
  selectScrollDirection,
  selectActiveSection,
  selectVisibleSections,
  selectViewedSections,
  createSectionSelector,
  createAnimationSelector,
  selectReducedMotion,
  selectAnimationPreferences,
  selectEuvekaTheme,
  selectResolvedTheme,
  selectSpringConfig,
  selectHasRunningAnimations,
  selectOverallAnimationProgress,
  selectIsNearTop,
  selectIsNearBottom,
} from '@/lib/stores';

export type {
  SectionVisibility,
  AnimationState,
  EuvekaTheme,
  AnimationPreferences,
  SpringConfig,
  ScrollDirection,
  ScrollAnimationState,
} from '@/lib/stores';

// Scroll and Animation Hooks
export { useScrollProgress, useElementScrollProgress } from '@/lib/hooks/use-scroll-progress';
export { useSectionInView, useMultipleSections, useInView } from '@/lib/hooks/use-section-in-view';
export {
  useAnimationPreferences,
  useSpringTransition,
  useStaggerDelay,
  useGlowEffect,
  useParallaxEffect,
} from '@/lib/hooks/use-animation-preferences';
export {
  useEuvekaTheme,
  useEuvekaStyles,
  useEuvekaAnimationVariants,
} from '@/lib/hooks/use-euveka-theme';
