/**
 * Euveka-Style Stats Components
 *
 * Design System:
 * - Large elegant numbers with thin typography (Cormorant Garamond 300)
 * - Subtle descriptive labels
 * - Horizontal layout with dashed separators
 * - Scroll-triggered count-up animations
 * - White glow effects (dark mode)
 * - Reduced motion support
 */

// Stat Counter
export {
  StatCounter,
  PercentageStat,
  SpeedStat,
  TimeStat,
  CountStat,
  useAnimatedValue,
  type StatCounterProps,
  type PercentageStatProps,
  type SpeedStatProps,
  type TimeStatProps,
  type CountStatProps,
  type UseAnimatedValueOptions,
} from './stat-counter';

// Stats Row & Grid
export {
  StatsRow,
  StatsGrid,
  TallowStatsSection,
  type StatItem,
  type StatsRowProps,
  type StatsGridProps,
  type TallowStatsSectionProps,
} from './stats-row';

// Default export
export { default } from './stats-row';
