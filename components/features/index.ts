/**
 * Feature Components Export
 *
 * Centralized exports for all feature-related components
 */

export { FeatureCard, FeatureCardGrid } from "./feature-card";
export type {
  Feature,
  FeatureCardProps,
  FeatureCardVariant,
  FeatureStatus,
} from "./feature-card";

export { CategorySection, CategorySectionSkeleton } from "./category-section";
export type { CategorySectionProps } from "@/lib/features/types";

export { FeatureSearch, useFeatureSearch } from "./feature-search";
export type { FeatureSearchProps, SearchIndexEntry } from "@/lib/features/types";

export { FeatureDetailDialog } from "./feature-detail-dialog";
export type { FeatureDetailDialogProps } from "@/lib/features/types";

export { FeatureFilters, parseFiltersFromURL, serializeFiltersToURL } from "./feature-filters";
export type { FeatureFiltersProps, FilterOptions } from "@/lib/features/types";

export {
  FeatureCarousel,
  FeatureCarouselWithCategories,
  FeatureScrollCarousel,
} from "./feature-carousel";
export type { FeatureCarouselProps, FeatureCarouselWithCategoriesProps } from "./feature-carousel";

export {
  ResponsiveFeaturesGrid,
  ResponsiveSection,
} from "./responsive-features-grid";
