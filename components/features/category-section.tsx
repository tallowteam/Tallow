"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeatureCard, FeatureCardGrid } from "./feature-card";
import type {
  FeatureCategory,
  CategorySectionProps,
} from "@/lib/features/types";

/**
 * Category color mapping for icon backgrounds
 * Each category gets a distinct color scheme
 */
const categoryColors: Record<
  string,
  {
    bg: string;
    icon: string;
    border: string;
  }
> = {
  encryption: {
    bg: "bg-blue-100 dark:bg-blue-950 high-contrast:bg-blue-200 high-contrast:dark:bg-blue-900",
    icon: "text-blue-600 dark:text-blue-400 high-contrast:text-blue-900 high-contrast:dark:text-blue-100",
    border: "border-blue-300 dark:border-blue-800",
  },
  transfer: {
    bg: "bg-purple-100 dark:bg-purple-950 high-contrast:bg-purple-200 high-contrast:dark:bg-purple-900",
    icon: "text-purple-600 dark:text-purple-400 high-contrast:text-purple-900 high-contrast:dark:text-purple-100",
    border: "border-purple-300 dark:border-purple-800",
  },
  network: {
    bg: "bg-green-100 dark:bg-green-950 high-contrast:bg-green-200 high-contrast:dark:bg-green-900",
    icon: "text-green-600 dark:text-green-400 high-contrast:text-green-900 high-contrast:dark:text-green-100",
    border: "border-green-300 dark:border-green-800",
  },
  privacy: {
    bg: "bg-orange-100 dark:bg-orange-950 high-contrast:bg-orange-200 high-contrast:dark:bg-orange-900",
    icon: "text-orange-600 dark:text-orange-400 high-contrast:text-orange-900 high-contrast:dark:text-orange-100",
    border: "border-orange-300 dark:border-orange-800",
  },
  security: {
    bg: "bg-red-100 dark:bg-red-950 high-contrast:bg-red-200 high-contrast:dark:bg-red-900",
    icon: "text-red-600 dark:text-red-400 high-contrast:text-red-900 high-contrast:dark:text-red-100",
    border: "border-red-300 dark:border-red-800",
  },
  ui: {
    bg: "bg-pink-100 dark:bg-pink-950 high-contrast:bg-pink-200 high-contrast:dark:bg-pink-900",
    icon: "text-pink-600 dark:text-pink-400 high-contrast:text-pink-900 high-contrast:dark:text-pink-100",
    border: "border-pink-300 dark:border-pink-800",
  },
  api: {
    bg: "bg-indigo-100 dark:bg-indigo-950 high-contrast:bg-indigo-200 high-contrast:dark:bg-indigo-900",
    icon: "text-indigo-600 dark:text-indigo-400 high-contrast:text-indigo-900 high-contrast:dark:text-indigo-100",
    border: "border-indigo-300 dark:border-indigo-800",
  },
  monitoring: {
    bg: "bg-cyan-100 dark:bg-cyan-950 high-contrast:bg-cyan-200 high-contrast:dark:bg-cyan-900",
    icon: "text-cyan-600 dark:text-cyan-400 high-contrast:text-cyan-900 high-contrast:dark:text-cyan-100",
    border: "border-cyan-300 dark:border-cyan-800",
  },
  default: {
    bg: "bg-gray-100 dark:bg-gray-800 high-contrast:bg-gray-200 high-contrast:dark:bg-gray-700",
    icon: "text-gray-600 dark:text-gray-400 high-contrast:text-gray-900 high-contrast:dark:text-gray-100",
    border: "border-gray-300 dark:border-gray-600",
  },
};

/**
 * Get category color scheme
 */
const getCategoryColors = (categoryId: string) => {
  const lowerCaseId = categoryId.toLowerCase();
  // First check if direct match exists
  if (categoryColors[lowerCaseId]) {
    return categoryColors[lowerCaseId];
  }
  // Then check for partial match
  const partialMatch = Object.keys(categoryColors).find((key) =>
    lowerCaseId.includes(key)
  );
  if (partialMatch && categoryColors[partialMatch]) {
    return categoryColors[partialMatch];
  }
  // Return default using index signature access
  return categoryColors["default"];
};

/**
 * Get Lucide icon component by name
 */
const getIconComponent = (iconName?: string): React.ComponentType<any> => {
  if (!iconName) {
    return LucideIcons.Folder;
  }

  // Convert to PascalCase (e.g., "shield-check" -> "ShieldCheck")
  const componentName = iconName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  const IconComponent = (LucideIcons as any)[componentName];
  return IconComponent || LucideIcons.Folder;
};

/**
 * Framer Motion variants for smooth animations
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

/**
 * CategorySection Component
 *
 * Displays a category of features with accordion-style expand/collapse functionality.
 * Supports "Show More/Less" for large feature lists and staggered animations.
 *
 * @example
 * ```tsx
 * <CategorySection
 *   category={encryptionCategory}
 *   expanded={true}
 *   variant="compact"
 *   showMore={true}
 *   maxFeaturesBeforeFold={6}
 *   onToggle={() => setExpanded(!expanded)}
 * />
 * ```
 *
 * Features:
 * - Accordion expand/collapse with smooth height animations
 * - Show More/Less for large feature lists
 * - Category icon with colored background
 * - Feature count badge
 * - Keyboard navigation (Space/Enter to toggle)
 * - ARIA attributes for accessibility
 * - Responsive grid layout (3-col desktop, 2-col tablet, 1-col mobile)
 * - Staggered children animations
 * - Full dark mode and high contrast support
 */
export const CategorySection = React.memo(function CategorySection({
  category,
  expanded = true,
  onToggle,
  variant = "compact",
  showMore = true,
  maxFeaturesBeforeFold = 6,
  className,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(expanded);
  const [showAllFeatures, setShowAllFeatures] = React.useState(false);

  const contentId = React.useId();
  const Icon = getIconComponent(category.icon);
  const colors = getCategoryColors(category.id);

  const totalFeatures = category.features.length;
  const hasMoreFeatures = totalFeatures > maxFeaturesBeforeFold;
  const displayedFeatures = showAllFeatures
    ? category.features
    : category.features.slice(0, maxFeaturesBeforeFold);
  const hiddenFeaturesCount = totalFeatures - maxFeaturesBeforeFold;

  // Handle controlled vs uncontrolled expansion
  const isControlled = onToggle !== undefined;
  const currentExpanded = isControlled ? expanded : isExpanded;

  const handleToggle = () => {
    if (isControlled) {
      onToggle?.();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  const handleShowMoreToggle = () => {
    setShowAllFeatures(!showAllFeatures);
  };

  return (
    <section
      className={cn(
        "border-b border-border py-12 sm:py-16",
        "transition-all duration-300",
        className
      )}
      aria-labelledby={`category-${category.id}`}
    >
      {/* Category Header - Clickable to expand/collapse */}
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-expanded={currentExpanded}
          aria-controls={contentId}
          className={cn(
            "flex items-start gap-6 w-full text-left cursor-pointer group",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
            "transition-all duration-200"
          )}
        >
          {/* Category Icon */}
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0",
              "transition-all duration-300 group-hover:scale-105",
              colors?.bg,
              "border",
              colors?.border
            )}
            aria-hidden="true"
          >
            <Icon className={cn("size-8", colors?.icon)} />
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-4 flex-wrap">
              <h2
                id={`category-${category.id}`}
                className="display-md text-3xl sm:text-4xl font-light leading-tight flex-1 min-w-0"
              >
                {category.name}
              </h2>

              {/* Feature Count Badge */}
              <Badge
                variant="secondary"
                className={cn(
                  "text-sm font-semibold shrink-0",
                  "transition-colors duration-200"
                )}
                aria-label={`${totalFeatures} features in this category`}
              >
                {totalFeatures} feature{totalFeatures !== 1 ? "s" : ""}
              </Badge>
            </div>

            <p className="body-lg text-base text-muted-foreground mt-3 leading-relaxed">
              {category.description}
            </p>
          </div>

          {/* Expand/Collapse Chevron */}
          <div
            className="shrink-0 mt-2"
            aria-hidden="true"
          >
            <motion.div
              animate={{ rotate: currentExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <LucideIcons.ChevronDown
                className={cn(
                  "size-6 text-muted-foreground",
                  "transition-colors duration-200 group-hover:text-foreground"
                )}
              />
            </motion.div>
          </div>
        </button>
      </motion.div>

      {/* Collapsible Content with AnimatePresence */}
      <AnimatePresence initial={false}>
        {currentExpanded && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: {
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                },
                opacity: {
                  duration: 0.3,
                  delay: 0.1,
                  ease: "easeOut",
                },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: {
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                },
                opacity: {
                  duration: 0.2,
                  ease: "easeIn",
                },
              },
            }}
            className="overflow-hidden"
          >
            <div className="pt-8">
              {/* Feature Cards Grid with Stagger Animation */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <FeatureCardGrid>
                  {displayedFeatures.map((feature) => (
                    <motion.div
                      key={feature.id}
                      variants={itemVariants}
                      layout
                    >
                      <FeatureCard
                        feature={feature}
                        variant={variant}
                        showStatus
                      />
                    </motion.div>
                  ))}
                </FeatureCardGrid>
              </motion.div>

              {/* Show More/Less Button */}
              {showMore && hasMoreFeatures && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="mt-8 flex justify-center"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleShowMoreToggle}
                    className={cn(
                      "gap-2 rounded-full px-8 py-6",
                      "transition-all duration-300",
                      "hover:scale-105 hover:shadow-lg",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                    aria-expanded={showAllFeatures}
                    aria-controls={contentId}
                  >
                    {showAllFeatures ? (
                      <>
                        <LucideIcons.ChevronUp className="size-5" />
                        <span className="font-medium">Show Less</span>
                      </>
                    ) : (
                      <>
                        <LucideIcons.ChevronDown className="size-5" />
                        <span className="font-medium">
                          Show {hiddenFeaturesCount} More Feature
                          {hiddenFeaturesCount !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subcategories Support (Future Enhancement) */}
      {category.subcategories && category.subcategories.length > 0 && (
        <AnimatePresence>
          {currentExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-12 space-y-8"
            >
              {category.subcategories.map((subcategory) => (
                <div
                  key={subcategory.id}
                  className="pl-6 sm:pl-12 border-l-2 border-border"
                >
                  <h3 className="heading-sm text-xl font-semibold mb-4">
                    {subcategory.name}
                  </h3>
                  {subcategory.description && (
                    <p className="body-md text-sm text-muted-foreground mb-6">
                      {subcategory.description}
                    </p>
                  )}
                  <FeatureCardGrid>
                    {subcategory.features.map((feature) => (
                      <FeatureCard
                        key={feature.id}
                        feature={feature}
                        variant={variant}
                        showStatus
                      />
                    ))}
                  </FeatureCardGrid>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </section>
  );
});

CategorySection.displayName = 'CategorySection';

/**
 * CategorySectionSkeleton - Loading state component
 * Shows skeleton UI while category data is being fetched
 */
export function CategorySectionSkeleton() {
  return (
    <div className="border-b border-border py-12 sm:py-16 animate-pulse">
      <div className="flex items-start gap-6">
        {/* Icon skeleton */}
        <div className="w-16 h-16 rounded-2xl bg-muted shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          <div className="h-8 bg-muted rounded-lg w-1/3" />
          <div className="h-4 bg-muted rounded-lg w-2/3" />
        </div>

        {/* Chevron skeleton */}
        <div className="w-6 h-6 bg-muted rounded shrink-0 mt-2" />
      </div>
    </div>
  );
}

// Export types for convenience
export type { FeatureCategory, CategorySectionProps };
