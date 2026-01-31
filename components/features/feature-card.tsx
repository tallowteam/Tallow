"use client";

import * as React from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  Feature,
  FeatureCardProps,
  FeatureCardVariant,
  FeatureStatus,
} from "@/lib/features/types";

/**
 * Status badge color mapping with full theme support
 */
const statusColors: Record<
  FeatureStatus,
  {
    bg: string;
    text: string;
    border: string;
  }
> = {
  production: {
    bg: "bg-green-100 dark:bg-green-950 high-contrast:bg-green-200 high-contrast:dark:bg-green-900",
    text: "text-green-800 dark:text-green-200 high-contrast:text-green-900 high-contrast:dark:text-green-100",
    border: "border-green-300 dark:border-green-800 high-contrast:border-green-600",
  },
  beta: {
    bg: "bg-yellow-100 dark:bg-yellow-950 high-contrast:bg-yellow-200 high-contrast:dark:bg-yellow-900",
    text: "text-yellow-800 dark:text-yellow-200 high-contrast:text-yellow-900 high-contrast:dark:text-yellow-100",
    border: "border-yellow-300 dark:border-yellow-800 high-contrast:border-yellow-600",
  },
  planned: {
    bg: "bg-gray-100 dark:bg-gray-800 high-contrast:bg-gray-200 high-contrast:dark:bg-gray-700",
    text: "text-gray-800 dark:text-gray-200 high-contrast:text-gray-900 high-contrast:dark:text-gray-100",
    border: "border-gray-300 dark:border-gray-600 high-contrast:border-gray-500",
  },
  experimental: {
    bg: "bg-purple-100 dark:bg-purple-950 high-contrast:bg-purple-200 high-contrast:dark:bg-purple-900",
    text: "text-purple-800 dark:text-purple-200 high-contrast:text-purple-900 high-contrast:dark:text-purple-100",
    border: "border-purple-300 dark:border-purple-800 high-contrast:border-purple-600",
  },
};

/**
 * Icon cache to prevent repeated lookups
 * Improves performance when rendering many feature cards
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconCache = new Map<string, React.ComponentType<any>>();

/**
 * Get Lucide icon component by name with caching
 * Caches icon lookups to avoid repeated object access overhead
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getIconComponent = (iconName?: string): React.ComponentType<any> => {
  if (!iconName) {
    return LucideIcons.FileText;
  }

  // Check cache first
  const cached = iconCache.get(iconName);
  if (cached) {
    return cached;
  }

  // Convert to PascalCase (e.g., "file-text" -> "FileText")
  const componentName = iconName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[componentName];
  const result = IconComponent || LucideIcons.FileText;

  // Cache for future lookups
  iconCache.set(iconName, result);

  return result;
};

/**
 * Status Badge Component
 */
const StatusBadge = ({ status }: { status: FeatureStatus }) => {
  const colors = statusColors[status];

  return (
    <Badge
      className={cn(
        "uppercase tracking-wider font-semibold border",
        colors.bg,
        colors.text,
        colors.border
      )}
      aria-label={`Status: ${status}`}
    >
      {status}
    </Badge>
  );
};

/**
 * Tech Specs Display
 */
const TechSpecs = ({ specs }: { specs: Record<string, string | string[] | undefined> }) => {
  return (
    <div className="space-y-2" role="list" aria-label="Technical specifications">
      {Object.entries(specs).map(([key, value]) => {
        if (!value) {return null;}

        const displayValue = Array.isArray(value) ? value.join(", ") : value;

        return (
          <div
            key={key}
            className="flex justify-between text-sm"
            role="listitem"
          >
            <span className="text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}:
            </span>
            <span className="font-medium text-foreground">{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Code Example Display
 */
const CodeExample = ({
  language,
  code,
  description,
}: {
  language: string;
  code: string;
  description?: string;
}) => {
  return (
    <div className="space-y-2">
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="relative">
        <div className="absolute top-2 right-2 text-xs uppercase tracking-wider text-muted-foreground font-mono">
          {language}
        </div>
        <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
          <code className="text-sm font-mono text-foreground">{code}</code>
        </pre>
      </div>
    </div>
  );
};

/**
 * Compact Variant - Grid display with essential info
 */
const CompactCard = ({
  feature,
  onClick,
  showStatus,
  className,
}: {
  feature: Feature;
  onClick?: () => void;
  showStatus?: boolean;
  className?: string;
}) => {
  const Icon = getIconComponent(feature.icon);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("h-full", className)}
    >
      <Card
        role="article"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
        className={cn(
          "h-full min-h-[220px] cursor-pointer transition-all duration-300",
          "rounded-[2rem] p-6 md:p-8 gap-5 flex flex-col",
          "dark:bg-[#161614] bg-white",
          "dark:border-[#262626] border-gray-200 border",
          "hover:shadow-xl dark:hover:border-white/30 hover:border-foreground",
          "dark:hover:shadow-[0_12px_40px_-12px_rgba(254,254,252,0.15)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "active:translate-y-[-2px] active:scale-[0.98]"
        )}
        aria-label={`Feature: ${feature.title}`}
      >
        <div className="flex items-start gap-4">
          <div
            className="rounded-xl bg-primary/10 p-3 shrink-0"
            aria-hidden="true"
          >
            <Icon className="size-6 text-primary" aria-hidden="true" />
          </div>
          {showStatus && (
            <div className="ml-auto">
              <StatusBadge status={feature.status} />
            </div>
          )}
        </div>

        <div className="space-y-3 flex-1 flex flex-col">
          <h3 className="text-xl font-bold leading-tight tracking-tight text-foreground">
            {feature.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {feature.description}
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * Detailed Variant - Full feature info with tech specs
 */
const DetailedCard = ({
  feature,
  onClick,
  showStatus,
  showTechSpecs,
  showCodeExample,
  className,
}: {
  feature: Feature;
  onClick?: () => void;
  showStatus?: boolean;
  showTechSpecs?: boolean;
  showCodeExample?: boolean;
  className?: string;
}) => {
  const Icon = getIconComponent(feature.icon);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("h-full", className)}
    >
      <Card
        role="article"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
        className={cn(
          "h-full cursor-pointer transition-all duration-300",
          "rounded-[2rem]",
          "dark:bg-[#161614] bg-white",
          "dark:border-[#262626] border-gray-200 border",
          "hover:shadow-xl dark:hover:border-white/30 hover:border-foreground",
          "dark:hover:shadow-[0_12px_40px_-12px_rgba(254,254,252,0.15)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "active:translate-y-[-2px] active:scale-[0.98]"
        )}
        aria-label={`Feature: ${feature.title}`}
      >
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div
                className="rounded-xl bg-primary/10 p-3 shrink-0"
                aria-hidden="true"
              >
                <Icon className="size-8 text-primary" aria-hidden="true" />
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <CardTitle className="display-sm text-2xl">
                  {feature.title}
                </CardTitle>
                {showStatus && <StatusBadge status={feature.status} />}
              </div>
            </div>
          </div>

          <CardDescription className="body-md text-base">
            {feature.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Complexity Badge */}
          {feature.complexity && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Complexity:</span>
              <Badge variant="outline" className="capitalize">
                {feature.complexity}
              </Badge>
            </div>
          )}

          {/* Tech Specs */}
          {showTechSpecs && feature.techSpecs && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                Technical Specifications
              </h4>
              <TechSpecs specs={feature.techSpecs} />
            </div>
          )}

          {/* Code Example */}
          {showCodeExample && feature.codeExamples && feature.codeExamples[0] && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                Code Example
              </h4>
              <CodeExample {...feature.codeExamples[0]} />
            </div>
          )}

          {/* Tags */}
          {feature.tags && feature.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {feature.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Related Features */}
          {feature.relatedFeatures && feature.relatedFeatures.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                Related Features
              </h4>
              <p className="text-sm text-muted-foreground">
                {feature.relatedFeatures.length} related feature
                {feature.relatedFeatures.length > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Interactive Variant - Includes action buttons
 */
const InteractiveCard = ({
  feature,
  onClick,
  showStatus,
  showTechSpecs,
  className,
}: {
  feature: Feature;
  onClick?: () => void;
  showStatus?: boolean;
  showTechSpecs?: boolean;
  className?: string;
}) => {
  const Icon = getIconComponent(feature.icon);
  const hasDemo = feature.status === "production" || feature.status === "beta";
  const hasDocs = !!feature.documentation;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("h-full", className)}
    >
      <Card
        role="article"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
        className={cn(
          "h-full transition-all duration-300",
          "rounded-[2rem]",
          "dark:bg-[#161614] bg-white",
          "dark:border-[#262626] border-gray-200 border",
          "hover:shadow-xl dark:hover:border-white/30 hover:border-foreground",
          "dark:hover:shadow-[0_12px_40px_-12px_rgba(254,254,252,0.15)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-label={`Feature: ${feature.title}`}
      >
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div
                className="rounded-xl bg-primary/10 p-3 shrink-0"
                aria-hidden="true"
              >
                <Icon className="size-8 text-primary" aria-hidden="true" />
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <CardTitle className="display-sm text-2xl">
                  {feature.title}
                </CardTitle>
                {showStatus && <StatusBadge status={feature.status} />}
              </div>
            </div>
          </div>

          <CardDescription className="body-md text-base">
            {feature.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tech Specs */}
          {showTechSpecs && feature.techSpecs && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                Technical Specifications
              </h4>
              <TechSpecs specs={feature.techSpecs} />
            </div>
          )}

          {/* File Location */}
          <div className="flex items-start gap-2 text-sm">
            <LucideIcons.FileCode className="size-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
            <code className="text-xs font-mono text-muted-foreground break-all">
              {feature.location}
            </code>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {hasDemo && (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                aria-label={`Try ${feature.title} demo`}
              >
                <LucideIcons.Play className="size-4" aria-hidden="true" />
                Try Demo
              </Button>
            )}

            {hasDocs && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(feature.documentation, "_blank");
                }}
                aria-label={`View ${feature.title} documentation`}
              >
                <LucideIcons.BookOpen className="size-4" aria-hidden="true" />
                View Docs
              </Button>
            )}

            {!hasDemo && !hasDocs && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                aria-label={`View ${feature.title} details`}
              >
                <LucideIcons.Info className="size-4" aria-hidden="true" />
                Learn More
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * FeatureCard Component - Main export
 *
 * Displays feature information in different variants optimized for different layouts.
 * Supports 3 variants: compact, detailed, and interactive.
 * Fully responsive and accessible with keyboard navigation and ARIA labels.
 *
 * @example
 * ```tsx
 * <FeatureCard
 *   feature={myFeature}
 *   variant="interactive"
 *   showStatus
 *   showTechSpecs
 *   onClick={() => setSelectedFeature(myFeature)}
 * />
 * ```
 */
export const FeatureCard = React.memo(function FeatureCard({
  feature,
  variant = "compact",
  showStatus = true,
  showTechSpecs = false,
  showCodeExample = false,
  onClick,
  className,
}: FeatureCardProps) {
  switch (variant) {
    case "detailed":
      return (
        <DetailedCard
          feature={feature}
          {...(onClick && { onClick })}
          {...(showStatus !== undefined && { showStatus })}
          {...(className && { className })}
          {...(showTechSpecs !== undefined && { showTechSpecs })}
          {...(showCodeExample !== undefined && { showCodeExample })}
        />
      );

    case "interactive":
      return (
        <InteractiveCard
          feature={feature}
          {...(onClick && { onClick })}
          {...(showStatus !== undefined && { showStatus })}
          {...(className && { className })}
          {...(showTechSpecs !== undefined && { showTechSpecs })}
        />
      );

    case "compact":
    default:
      return (
        <CompactCard
          feature={feature}
          {...(onClick && { onClick })}
          {...(showStatus !== undefined && { showStatus })}
          {...(className && { className })}
        />
      );
  }
});

FeatureCard.displayName = 'FeatureCard';

/**
 * Responsive Grid Container for FeatureCards
 * EUVEKA breakpoints: 758px, 1200px, 1400px
 * 4K support at 1536px+
 */
export function FeatureCardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // EUVEKA responsive gaps
        "grid gap-4 sm:gap-5 md:gap-6 lg:gap-8",
        "grid-cols-1", // Mobile: 1 column (< 480px)
        "sm:grid-cols-2", // Small tablet: 2 columns (480-767px)
        "md:grid-cols-2", // Tablet: 2 columns (768-1023px)
        "lg:grid-cols-3", // Desktop: 3 columns (1024-1279px)
        "xl:grid-cols-3", // Large desktop: 3 columns (1280-1535px)
        "2xl:grid-cols-4", // 4K: 4 columns (1536px+)
        "3xl:grid-cols-4", // Ultra-wide: 4 columns (1920px+)
        "4xl:grid-cols-5", // 4K+: 5 columns (2560px+)
        className
      )}
      role="list"
    >
      {children}
    </div>
  );
}

// Export types for convenience
export type { Feature, FeatureCardProps, FeatureCardVariant, FeatureStatus };
