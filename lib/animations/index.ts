/**
 * Animation System Exports
 * Central export point for all animation utilities
 * GPU-optimized, reduced-motion compliant animations
 *
 * EUVEKA Design System Integration:
 * - Custom expo-out easing [0.16, 1, 0.3, 1]
 * - Duration hierarchy: 0.3s/0.5s/0.8s
 * - Clip-path reveals, split text, floating orbs
 */

// Motion configuration and presets
export * from './motion-config';

// EUVEKA animation tokens (exact euveka.com specs)
export {
  // Core tokens
  EUVEKA_EASING,
  EUVEKA_EASING_CSS,
  EUVEKA_DURATIONS,
  EUVEKA_STAGGER,
  EUVEKA_BLUR,
  EUVEKA_COLORS,
  // Transitions
  euvekaTransition,
  euvekaTransitionFast,
  euvekaTransitionSlow,
  euvekaTransitionSlower,
  // Headline animations
  euvekaHeadlineVariants,
  euvekaRevealLeftVariants,
  euvekaRevealRightVariants,
  // Split text
  euvekaSplitTextContainer,
  euvekaSplitTextChar,
  euvekaSplitTextWord,
  // Orb animations
  euvekaOrbFloatVariants,
  createOrbFloatVariants,
  euvekaOrbFloatFastVariants,
  // Scroll indicator
  euvekaScrollIndicatorVariants,
  euvekaScrollDotVariants,
  // Container/stagger
  euvekaStaggerContainer,
  euvekaStaggerItem,
  euvekaStaggerItemScale,
  // Fade animations
  euvekaFadeIn,
  euvekaFadeUp,
  euvekaFadeDown,
  // Scale animations
  euvekaScaleIn,
  euvekaCTAVariants,
  // Hover animations
  euvekaCardHover,
  euvekaButtonHover,
  euvekaLinkUnderline,
  // Nav animations
  euvekaNavVariants,
  euvekaSubheadlineVariants,
  // Reduced motion
  euvekaReducedMotion,
  withEuvekaReducedMotion,
  // Utility functions
  createEuvekaTransition as createEuvekaTransitionFn,
  createEuvekaFadeUp,
  createEuvekaHeadlineReveal,
} from './euveka-tokens';

// Re-export presets except 'easings' which is already exported from motion-config
export {
  springs,
  transitions,
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  scaleOut,
  pop,
  zoom,
  slideInLeft,
  slideInRight,
  slideInUp,
  slideInDown,
  rotateIn,
  flipHorizontal,
  flipVertical,
  staggerContainer,
  staggerItem,
  hoverScale,
  hoverLift,
  hoverGlow,
  pulse,
  shimmer,
  spin,
  bounce,
  progressBar,
  progressCircle,
  countUp,
  modalBackdrop,
  modalContent,
  drawerBottom,
  drawerTop,
  drawerLeft,
  drawerRight,
  notificationSlideIn,
  toastSlideRight,
  pageSlideUp,
  pageFade,
  pageSlideHorizontal,
  collapseVertical,
  gpuAcceleration,
  reducedMotion,
  withReducedMotion,
} from './presets';

// Animated components
export * from './animated-components';

// Page transitions
export * from './page-transition';

// List animations - excluding AnimatedList and AnimatedListItem which are in animated-components
export {
  AnimatedGrid,
  SortableList,
  SortableItem,
  CardGrid,
  RemovableItem,
  MasonryGrid,
  InfiniteScrollList,
  type AnimatedGridProps,
  type SortableListProps,
  type SortableItemProps,
  type CardGridProps,
  type RemovableItemProps,
  type MasonryGridProps,
  type InfiniteScrollListProps,
} from './list-animations';

// Progress animations
export * from './progress-animations';

// Skeleton loading states
export * from './skeleton-animations';

// Micro-interactions (Euveka-style polish)
export * from './micro-interactions';

// Hooks
export { useReducedMotion, useReducedMotionSetting } from '../hooks/use-reduced-motion';
