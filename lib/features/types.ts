/**
 * Feature Catalog Types
 * Type definitions for the complete Tallow feature catalog
 */

// import { LucideIcon } from 'lucide-react';

/**
 * Feature status badge
 */
export type FeatureStatus = 'production' | 'beta' | 'planned' | 'experimental';

/**
 * Feature complexity level
 */
export type FeatureComplexity = 'beginner' | 'intermediate' | 'advanced';

/**
 * Technical specifications for a feature
 */
export interface TechSpecs {
  protocol?: string;
  algorithm?: string;
  chunkSize?: string;
  encryption?: string;
  maxFileSize?: string;
  performance?: string;
  browserSupport?: string[];
  dependencies?: string[];
  [key: string]: string | string[] | undefined;
}

/**
 * Code example for a feature
 */
export interface CodeExample {
  language: 'typescript' | 'javascript' | 'bash' | 'python' | 'go' | 'rust';
  code: string;
  description?: string;
}

/**
 * Individual feature definition
 */
export interface Feature {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  complexity?: FeatureComplexity;
  icon?: string; // Lucide icon name
  location: string; // File path in codebase
  techSpecs?: TechSpecs;
  codeExamples?: CodeExample[];
  relatedFeatures?: string[]; // Feature IDs
  documentation?: string; // Help article URL
  tags?: string[];
  metadata?: {
    linesOfCode?: number;
    testCoverage?: number;
    lastUpdated?: string;
    contributors?: string[];
  };
}

/**
 * Category of features
 */
export interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  features: Feature[];
  subcategories?: FeatureSubcategory[];
  order?: number; // Display order
}

/**
 * Subcategory within a category
 */
export interface FeatureSubcategory {
  id: string;
  name: string;
  description?: string;
  features: Feature[];
}

/**
 * Complete feature catalog
 */
export interface FeatureCatalog {
  version: string;
  lastUpdated: string;
  totalFeatures: number;
  categories: FeatureCategory[];
  metadata?: {
    linesOfCode?: number;
    testCoverage?: number;
    contributors?: number;
  };
}

/**
 * Search index entry
 */
export interface SearchIndexEntry {
  id: string;
  type: 'feature' | 'category' | 'help' | 'api' | 'page';
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  url: string;
  icon?: string;
  score?: number; // Search relevance score
}

/**
 * Filter options
 */
export interface FilterOptions {
  categories?: string[];
  status?: FeatureStatus[];
  complexity?: FeatureComplexity[];
  tags?: string[];
  searchQuery?: string;
}

/**
 * Feature card variant
 */
export type FeatureCardVariant = 'compact' | 'detailed' | 'interactive';

/**
 * Props for FeatureCard component
 */
export interface FeatureCardProps {
  feature: Feature;
  variant?: FeatureCardVariant;
  showStatus?: boolean;
  showTechSpecs?: boolean;
  showCodeExample?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Props for CategorySection component
 */
export interface CategorySectionProps {
  category: FeatureCategory;
  expanded?: boolean;
  onToggle?: () => void;
  variant?: FeatureCardVariant;
  showMore?: boolean;
  maxFeaturesBeforeFold?: number;
  className?: string;
}

/**
 * Props for FeatureDetailDialog component
 */
export interface FeatureDetailDialogProps {
  feature: Feature;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatedFeatures?: Feature[];
}

/**
 * Props for FeatureSearch component
 */
export interface FeatureSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onResultSelect?: (result: SearchIndexEntry) => void;
  className?: string;
}

/**
 * Props for FeatureFilters component
 */
export interface FeatureFiltersProps {
  options: FilterOptions;
  onChange: (options: FilterOptions) => void;
  availableCategories: FeatureCategory[];
  className?: string;
}
