/**
 * Feature Page Types
 *
 * Type definitions specifically for the Features page components.
 * These types complement the existing feature catalog types in types.ts
 * with page-specific structures for filtering, display, and interaction.
 */

import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

/**
 * Feature category enumeration for categorizing features.
 *
 * Used for filtering and organizing features on the Features page.
 * Each category represents a core value proposition of the application.
 *
 * @example
 * ```typescript
 * const feature: PageFeature = {
 *   id: 'pqc-encryption',
 *   category: FeatureCategory.SECURITY,
 *   // ...
 * };
 * ```
 */
export enum FeatureCategory {
  /** Security-focused features like encryption, authentication, and protection */
  SECURITY = 'security',
  /** Performance and speed-related features like P2P transfer and optimization */
  SPEED = 'speed',
  /** Privacy-focused features like anonymity, metadata stripping, and data protection */
  PRIVACY = 'privacy',
  /** Collaboration features like group transfer, screen sharing, and chat */
  COLLABORATION = 'collaboration',
}

/**
 * Feature interface for the Features page.
 *
 * Represents a single feature to be displayed on the Features page.
 * Uses i18n keys for title and description to support internationalization.
 *
 * @example
 * ```typescript
 * import { Shield } from 'lucide-react';
 *
 * const encryptionFeature: PageFeature = {
 *   id: 'e2e-encryption',
 *   title: 'features.encryption.title',
 *   description: 'features.encryption.description',
 *   icon: Shield,
 *   category: FeatureCategory.SECURITY,
 *   highlight: true,
 *   demoComponent: EncryptionDemo,
 * };
 * ```
 */
export interface PageFeature {
  /**
   * Unique identifier for the feature.
   * Used for keys in lists and for navigation/linking.
   */
  id: string;

  /**
   * i18n translation key for the feature title.
   * Will be resolved to localized text at render time.
   */
  title: string;

  /**
   * i18n translation key for the feature description.
   * Should provide a brief explanation of the feature.
   */
  description: string;

  /**
   * Lucide icon component to visually represent the feature.
   * Should be imported from 'lucide-react'.
   */
  icon: LucideIcon;

  /**
   * Category this feature belongs to.
   * Used for filtering and organizing features on the page.
   */
  category: FeatureCategory;

  /**
   * Whether this feature should be visually highlighted.
   * Highlighted features may have different styling or placement.
   * @default false
   */
  highlight?: boolean;

  /**
   * Optional demo component to show interactive demonstration.
   * Rendered when user expands or clicks on the feature.
   */
  demoComponent?: ComponentType;
}

/**
 * State interface for feature filtering.
 *
 * Tracks the current filter state for the Features page,
 * including active categories, search query, and sort options.
 *
 * @example
 * ```typescript
 * const [filterState, setFilterState] = useState<FeatureFilterState>({
 *   activeCategories: [FeatureCategory.SECURITY],
 *   searchQuery: '',
 *   showHighlightedOnly: false,
 *   sortBy: 'category',
 * });
 * ```
 */
export interface FeatureFilterState {
  /**
   * List of currently active category filters.
   * Empty array means show all categories.
   */
  activeCategories: FeatureCategory[];

  /**
   * Current search query string.
   * Used to filter features by title/description.
   */
  searchQuery: string;

  /**
   * Whether to show only highlighted features.
   * @default false
   */
  showHighlightedOnly: boolean;

  /**
   * How to sort the displayed features.
   * - 'category': Group by category
   * - 'alphabetical': Sort A-Z by title
   * - 'highlighted': Show highlighted first
   */
  sortBy: 'category' | 'alphabetical' | 'highlighted';
}

/**
 * Props interface for feature section components.
 *
 * Used for components that render a section of features,
 * typically grouped by category or other criteria.
 *
 * @example
 * ```typescript
 * function SecuritySection(props: FeatureSectionProps) {
 *   return (
 *     <section className={props.className}>
 *       <h2>{props.title}</h2>
 *       <p>{props.description}</p>
 *       <div className="grid">
 *         {props.features.map(f => <FeatureCard key={f.id} feature={f} />)}
 *       </div>
 *     </section>
 *   );
 * }
 * ```
 */
export interface FeatureSectionProps {
  /**
   * Section title (can be i18n key or localized string).
   */
  title: string;

  /**
   * Optional section description.
   */
  description?: string;

  /**
   * Array of features to display in this section.
   */
  features: PageFeature[];

  /**
   * Category for this section (used for styling/icons).
   */
  category?: FeatureCategory;

  /**
   * Whether the section is initially expanded.
   * @default true
   */
  defaultExpanded?: boolean;

  /**
   * Callback when section expand/collapse state changes.
   */
  onExpandChange?: (expanded: boolean) => void;

  /**
   * Optional CSS class name for styling.
   */
  className?: string;

  /**
   * Test ID for automated testing.
   */
  testId?: string;
}

/**
 * Props interface for feature card components.
 *
 * Used for individual feature card display components
 * that show a single feature with its details.
 *
 * @example
 * ```typescript
 * function FeatureCard({ feature, variant, onClick }: FeatureCardProps) {
 *   const Icon = feature.icon;
 *   return (
 *     <div onClick={onClick} className={variant === 'compact' ? 'small' : 'large'}>
 *       <Icon />
 *       <h3>{t(feature.title)}</h3>
 *       <p>{t(feature.description)}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export interface FeatureCardProps {
  /**
   * The feature to display.
   */
  feature: PageFeature;

  /**
   * Display variant for the card.
   * - 'compact': Minimal display, just icon and title
   * - 'default': Standard display with description
   * - 'expanded': Full display with demo component if available
   * @default 'default'
   */
  variant?: 'compact' | 'default' | 'expanded';

  /**
   * Whether to show the category badge.
   * @default true
   */
  showCategory?: boolean;

  /**
   * Whether to show the demo component (if available).
   * @default false
   */
  showDemo?: boolean;

  /**
   * Callback when the card is clicked.
   */
  onClick?: (feature: PageFeature) => void;

  /**
   * Callback when the card receives focus.
   */
  onFocus?: (feature: PageFeature) => void;

  /**
   * Whether this card is currently selected/active.
   * @default false
   */
  isSelected?: boolean;

  /**
   * Whether the card is in a loading state.
   * @default false
   */
  isLoading?: boolean;

  /**
   * Optional CSS class name for styling.
   */
  className?: string;

  /**
   * Test ID for automated testing.
   */
  testId?: string;
}

/**
 * Props for the main Features page component.
 *
 * Used for the top-level Features page component
 * that orchestrates feature display and filtering.
 */
export interface FeaturesPageProps {
  /**
   * All available features to display.
   */
  features: PageFeature[];

  /**
   * Initial filter state.
   */
  initialFilters?: Partial<FeatureFilterState>;

  /**
   * Whether to show the filter controls.
   * @default true
   */
  showFilters?: boolean;

  /**
   * Whether to show the search bar.
   * @default true
   */
  showSearch?: boolean;

  /**
   * Layout mode for the features grid.
   * @default 'grid'
   */
  layout?: 'grid' | 'list' | 'carousel';

  /**
   * Optional CSS class name for styling.
   */
  className?: string;
}

/**
 * Category metadata for display purposes.
 *
 * Provides display information for each feature category
 * including icon, label, and description.
 */
export interface CategoryMeta {
  /**
   * The category enum value.
   */
  category: FeatureCategory;

  /**
   * i18n key for the category label.
   */
  label: string;

  /**
   * i18n key for the category description.
   */
  description: string;

  /**
   * Icon component for the category.
   */
  icon: LucideIcon;

  /**
   * Color theme for the category (CSS color value or Tailwind class).
   */
  color: string;
}

/**
 * Default filter state for the Features page.
 *
 * @example
 * ```typescript
 * const [filters, setFilters] = useState<FeatureFilterState>(defaultFilterState);
 * ```
 */
export const defaultFilterState: FeatureFilterState = {
  activeCategories: [],
  searchQuery: '',
  showHighlightedOnly: false,
  sortBy: 'category',
};

/**
 * Type guard to check if a value is a valid FeatureCategory.
 *
 * @param value - The value to check
 * @returns True if value is a valid FeatureCategory
 *
 * @example
 * ```typescript
 * const category = 'security';
 * if (isFeatureCategory(category)) {
 *   // category is typed as FeatureCategory
 * }
 * ```
 */
export function isFeatureCategory(value: unknown): value is FeatureCategory {
  return Object.values(FeatureCategory).includes(value as FeatureCategory);
}

/**
 * Get all category values as an array.
 *
 * @returns Array of all FeatureCategory values
 *
 * @example
 * ```typescript
 * const allCategories = getAllCategories();
 * // ['security', 'speed', 'privacy', 'collaboration']
 * ```
 */
export function getAllCategories(): FeatureCategory[] {
  return Object.values(FeatureCategory);
}
