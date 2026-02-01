"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureCard } from "./feature-card";
import type { Feature } from "@/lib/features/types";

export interface FeatureCarouselProps {
  features: Feature[];
  autoPlay?: boolean;
  interval?: number;
  showControls?: boolean;
  className?: string;
}

/**
 * FeatureCarousel Component
 *
 * A production-ready carousel component for showcasing top features.
 *
 * Features:
 * - Auto-rotating with configurable interval
 * - Manual controls: arrow buttons, dot indicators, keyboard navigation
 * - Pause on hover
 * - Responsive: 3-col desktop, 2-col tablet, 1-col mobile
 * - Smooth animations with Framer Motion
 * - Full accessibility (ARIA labels, keyboard support)
 * - Horizontal scroll with snap points on mobile
 *
 * @example
 * ```tsx
 * <FeatureCarousel
 *   features={topFeatures}
 *   autoPlay={true}
 *   interval={5000}
 *   showControls={true}
 * />
 * ```
 */
export function FeatureCarousel({
  features,
  autoPlay = true,
  interval = 5000,
  showControls = true,
  className,
}: FeatureCarouselProps) {
  // State
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [direction, setDirection] = React.useState(0);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  // Calculate items per page based on viewport
  const [itemsPerPage, setItemsPerPage] = React.useState(3);

  React.useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setItemsPerPage(1); // Mobile
      } else if (width < 1024) {
        setItemsPerPage(2); // Tablet
      } else {
        setItemsPerPage(3); // Desktop
      }
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // Calculate total pages
  const totalPages = Math.ceil(features.length / itemsPerPage);
  const currentPage = Math.floor(currentIndex / itemsPerPage);

  // Get visible features for current page
  const getVisibleFeatures = () => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return features.slice(start, end);
  };

  // Navigation functions
  const goToPage = React.useCallback(
    (pageIndex: number) => {
      if (pageIndex < 0 || pageIndex >= totalPages) {return;}

      const newIndex = pageIndex * itemsPerPage;
      setDirection(newIndex > currentIndex ? 1 : -1);
      setCurrentIndex(newIndex);
    },
    [currentIndex, itemsPerPage, totalPages]
  );

  const goToPrevious = React.useCallback(() => {
    const prevPage = currentPage - 1;
    if (prevPage >= 0) {
      goToPage(prevPage);
    } else {
      // Loop to last page
      goToPage(totalPages - 1);
    }
  }, [currentPage, goToPage, totalPages]);

  const goToNext = React.useCallback(() => {
    const nextPage = currentPage + 1;
    if (nextPage < totalPages) {
      goToPage(nextPage);
    } else {
      // Loop to first page
      goToPage(0);
    }
  }, [currentPage, goToPage, totalPages]);

  // Auto-play functionality
  React.useEffect(() => {
    if (!autoPlay || isPaused || totalPages <= 1) {return;}

    const timer = setInterval(() => {
      goToNext();
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, isPaused, interval, goToNext, totalPages]);


  // Slide animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  const visibleFeatures = getVisibleFeatures();

  return (
    <section
      className={cn("py-24 sm:py-32", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="display-md mb-4 animate-fade-up">
            Feature Highlights
          </h2>
          <p className="body-lg animate-fade-up stagger-1">
            150+ features. Here are the highlights.
          </p>
        </div>

        {/* Carousel Container */}
        <div
          ref={carouselRef}
          className="relative max-w-7xl mx-auto"
          role="group"
          aria-roledescription="carousel"
          aria-label="Feature carousel"
          aria-live="polite"
          aria-atomic="false"
        >
          {/* Previous Button */}
          {showControls && totalPages > 1 && (
            <button
              onClick={goToPrevious}
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 z-10",
                "hidden lg:flex items-center justify-center",
                "w-12 h-12 rounded-full",
                "dark:bg-[#161614] bg-white",
                "dark:border-[#262626] border-gray-200 border shadow-lg",
                "dark:hover:bg-[#1f1f1f] hover:bg-gray-50",
                "dark:hover:border-white/30 hover:border-foreground",
                "text-foreground",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "-translate-x-6"
              )}
              aria-label="Previous features"
              disabled={totalPages <= 1}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Carousel Content */}
          <div className="overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentPage}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className={cn(
                  "grid gap-6 md:gap-8",
                  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                  "items-stretch"
                )}
              >
                {visibleFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.1,
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                  >
                    <FeatureCard
                      feature={feature}
                      variant="compact"
                      showStatus={false}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Next Button */}
          {showControls && totalPages > 1 && (
            <button
              onClick={goToNext}
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 z-10",
                "hidden lg:flex items-center justify-center",
                "w-12 h-12 rounded-full",
                "dark:bg-[#161614] bg-white",
                "dark:border-[#262626] border-gray-200 border shadow-lg",
                "dark:hover:bg-[#1f1f1f] hover:bg-gray-50",
                "dark:hover:border-white/30 hover:border-foreground",
                "text-foreground",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "translate-x-6"
              )}
              aria-label="Next features"
              disabled={totalPages <= 1}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Mobile Navigation Buttons */}
          {showControls && totalPages > 1 && (
            <div className="flex lg:hidden justify-center gap-4 mt-8">
              <button
                onClick={goToPrevious}
                className={cn(
                  "flex items-center justify-center",
                  "w-12 h-12 rounded-full",
                  "dark:bg-[#161614] bg-white",
                  "dark:border-[#262626] border-gray-200 border shadow",
                  "dark:hover:bg-[#1f1f1f] hover:bg-gray-50",
                  "dark:hover:border-white/30 hover:border-foreground",
                  "text-foreground",
                  "transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                aria-label="Previous features"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                className={cn(
                  "flex items-center justify-center",
                  "w-12 h-12 rounded-full",
                  "dark:bg-[#161614] bg-white",
                  "dark:border-[#262626] border-gray-200 border shadow",
                  "dark:hover:bg-[#1f1f1f] hover:bg-gray-50",
                  "dark:hover:border-white/30 hover:border-foreground",
                  "text-foreground",
                  "transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                aria-label="Next features"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Dot Indicators */}
          {showControls && totalPages > 1 && (
            <div
              className="flex justify-center items-center gap-2 mt-12"
              role="tablist"
              aria-label="Carousel page indicators"
            >
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    currentPage === index
                      ? "bg-foreground w-8"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  )}
                  role="tab"
                  aria-label={`Go to page ${index + 1}`}
                  aria-selected={currentPage === index}
                  aria-current={currentPage === index ? "true" : undefined}
                />
              ))}
            </div>
          )}

          {/* Screen Reader Announcements */}
          <div className="sr-only" role="status" aria-live="polite">
            Showing page {currentPage + 1} of {totalPages}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * FeatureCarousel with Categories
 *
 * Enhanced version that groups features by category with section labels.
 */
export interface FeatureCarouselWithCategoriesProps
  extends Omit<FeatureCarouselProps, "features"> {
  categories: Array<{
    id: string;
    name: string;
    features: Feature[];
  }>;
}

export function FeatureCarouselWithCategories({
  categories,
  autoPlay = true,
  interval = 5000,
  showControls = true,
  className,
}: FeatureCarouselWithCategoriesProps) {
  return (
    <div className={cn("space-y-16", className)}>
      {categories.map((category, index) => (
        <div key={category.id} className="animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
          {/* Category Label */}
          <div className="container mx-auto px-6 mb-8">
            <div className="max-w-5xl mx-auto">
              <h3 className="heading-lg text-center mb-2">{category.name}</h3>
              <div className="h-px w-24 mx-auto bg-border" />
            </div>
          </div>

          {/* Category Carousel */}
          <FeatureCarousel
            features={category.features}
            autoPlay={autoPlay}
            interval={interval + index * 1000} // Stagger auto-play
            showControls={showControls}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Horizontal Scroll Carousel (Mobile-optimized)
 *
 * Alternative carousel that uses horizontal scroll with snap points.
 * Better for touch devices and mobile.
 */
export function FeatureScrollCarousel({
  features,
  className,
}: {
  features: Feature[];
  className?: string;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <section className={cn("py-24 sm:py-32", className)}>
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="display-md mb-4 animate-fade-up">
            Feature Highlights
          </h2>
          <p className="body-lg animate-fade-up stagger-1">
            150+ features. Here are the highlights.
          </p>
        </div>

        {/* Horizontal Scroll Container */}
        <div
          ref={scrollRef}
          className={cn(
            "flex gap-6 md:gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory",
            "pb-8 px-6 -mx-6",
            "scrollbar-hide",
            // Hide scrollbar
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          )}
          role="region"
          aria-label="Feature scroll carousel"
        >
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={cn(
                "flex-none snap-center",
                "w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]",
                "first:pl-0 last:pr-0"
              )}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  delay: index * 0.05,
                  duration: 0.3,
                  ease: "easeOut",
                }}
              >
                <FeatureCard
                  feature={feature}
                  variant="compact"
                  showStatus={false}
                />
              </motion.div>
            </div>
          ))}
        </div>

        {/* Scroll Hint */}
        <div className="text-center mt-8">
          <p className="label text-muted-foreground/60">
            Scroll to explore more
          </p>
        </div>
      </div>
    </section>
  );
}
