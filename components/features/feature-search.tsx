"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import type {
  SearchIndexEntry,
  FeatureSearchProps,
} from "@/lib/features/types";

/**
 * Category color mapping for visual distinction
 */
const categoryColors: Record<
  SearchIndexEntry["type"],
  {
    bg: string;
    text: string;
    border: string;
  }
> = {
  feature: {
    bg: "bg-gray-100 dark:bg-gray-950",
    text: "text-gray-800 dark:text-gray-200",
    border: "border-gray-300 dark:border-gray-800",
  },
  category: {
    bg: "bg-purple-100 dark:bg-purple-950",
    text: "text-purple-800 dark:text-purple-200",
    border: "border-purple-300 dark:border-purple-800",
  },
  help: {
    bg: "bg-green-100 dark:bg-green-950",
    text: "text-green-800 dark:text-green-200",
    border: "border-green-300 dark:border-green-800",
  },
  api: {
    bg: "bg-orange-100 dark:bg-orange-950",
    text: "text-orange-800 dark:text-orange-200",
    border: "border-orange-300 dark:border-orange-800",
  },
  page: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-800 dark:text-gray-200",
    border: "border-gray-300 dark:border-gray-600",
  },
};

/**
 * Category labels for display
 */
const categoryLabels: Record<SearchIndexEntry["type"], string> = {
  feature: "Features",
  category: "Category",
  help: "Help",
  api: "API",
  page: "Pages",
};

/**
 * Get Lucide icon component by name
 */
const getIconComponent = (iconName?: string): React.ComponentType<any> => {
  if (!iconName) {
    return LucideIcons.Search;
  }

  // Convert to PascalCase
  const componentName = iconName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  const IconComponent = (LucideIcons as any)[componentName];
  return IconComponent || LucideIcons.Search;
};

/**
 * Local storage key for recent searches
 */
const RECENT_SEARCHES_KEY = "tallow-recent-searches";
const MAX_RECENT_SEARCHES = 5;

/**
 * Recent searches manager
 */
const recentSearches = {
  get(): string[] {
    if (typeof window === "undefined") {return [];}
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  add(query: string) {
    if (typeof window === "undefined" || !query.trim()) {return;}
    try {
      const current = this.get();
      const filtered = current.filter((q) => q !== query);
      const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Silently fail if localStorage is not available
    }
  },

  clear() {
    if (typeof window === "undefined") {return;}
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Silently fail
    }
  },
};

/**
 * Highlight matching text in search results
 */
const HighlightedText = ({
  text,
  query,
}: {
  text: string;
  query: string;
}) => {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${query})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-900 text-foreground font-semibold"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
};

/**
 * Search result item component
 */
const SearchResultItem = ({
  result,
  query,
  isSelected,
  onClick,
}: {
  result: SearchIndexEntry;
  query: string;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const Icon = getIconComponent(result.icon);
  const colors = categoryColors[result.type];

  return (
    <motion.div
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex items-start gap-4 p-3 rounded-lg cursor-pointer transition-colors",
        "hover:bg-muted focus:bg-muted focus:outline-none",
        isSelected && "bg-muted ring-2 ring-primary"
      )}
      tabIndex={-1}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div
        className="rounded-lg bg-primary/10 p-2 shrink-0"
        aria-hidden="true"
      >
        <Icon className="size-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-foreground line-clamp-1">
            <HighlightedText text={result.title} query={query} />
          </h4>
          <Badge
            className={cn(
              "text-xs shrink-0 border",
              colors.bg,
              colors.text,
              colors.border
            )}
          >
            {categoryLabels[result.type]}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          <HighlightedText text={result.description} query={query} />
        </p>

        {result.category && (
          <p className="text-xs text-muted-foreground/70">
            in {result.category}
          </p>
        )}
      </div>

      {isSelected && (
        <div className="flex items-center shrink-0 text-muted-foreground">
          <LucideIcons.CornerDownLeft className="size-4" />
        </div>
      )}
    </motion.div>
  );
};

/**
 * Loading skeleton for search results
 */
const SearchResultsSkeleton = () => {
  return (
    <div className="space-y-2 p-2" role="status" aria-label="Loading results">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-3 rounded-lg">
          <Skeleton width={36} height={36} className="shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <SkeletonText className="w-2/3 h-4" />
              <Skeleton width={60} height={20} />
            </div>
            <SkeletonText className="w-full h-3" />
            <SkeletonText className="w-4/5 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Empty state when no results found
 */
const EmptyState = ({ query }: { query: string }) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-full bg-muted p-6 mb-4">
        <LucideIcons.SearchX className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No results found
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        No results found for &quot;{query}&quot;. Try different keywords or check
        for typos.
      </p>
    </div>
  );
};

/**
 * Recent searches display
 */
const RecentSearches = ({
  searches,
  onSelect,
  onClear,
}: {
  searches: string[];
  onSelect: (search: string) => void;
  onClear: () => void;
}) => {
  if (searches.length === 0) {return null;}

  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center justify-between px-2 py-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Searches
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-auto py-1 px-2 text-xs"
          aria-label="Clear recent searches"
        >
          Clear
        </Button>
      </div>

      <div className="space-y-1">
        {searches.map((search, index) => (
          <motion.button
            key={index}
            onClick={() => onSelect(search)}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-left hover:bg-muted focus:bg-muted focus:outline-none transition-colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <LucideIcons.Clock className="size-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground flex-1 line-clamp-1">
              {search}
            </span>
            <LucideIcons.ArrowUpRight className="size-3 text-muted-foreground/50 shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

/**
 * Filter type for results
 */
type FilterType = "all" | SearchIndexEntry["type"];

/**
 * Quick filter chips
 */
const QuickFilters = ({
  activeFilter,
  onFilterChange,
  resultCounts,
}: {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  resultCounts: Record<FilterType, number>;
}) => {
  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Features", value: "feature" },
    { label: "Help", value: "help" },
    { label: "API", value: "api" },
    { label: "Pages", value: "page" },
  ];

  return (
    <div
      className="flex flex-wrap gap-2 p-2 border-b border-border"
      role="tablist"
      aria-label="Filter search results"
    >
      {filters.map((filter) => {
        const count = resultCounts[filter.value] || 0;
        const isActive = activeFilter === filter.value;

        return (
          <button
            key={filter.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {filter.label}
            {count > 0 && (
              <span
                className={cn(
                  "ml-1.5 px-1.5 py-0.5 rounded-full text-xs",
                  isActive
                    ? "bg-primary-foreground/20"
                    : "bg-background/50"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Keyboard shortcut badge
 */
const KeyboardShortcut = () => {
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform));
  }, []);

  return (
    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-muted text-xs font-mono text-muted-foreground">
      <span>{isMac ? "⌘" : "Ctrl"}</span>
      <span>K</span>
    </kbd>
  );
};

/**
 * FeatureSearch Component
 *
 * Global search modal with keyboard shortcuts, fuzzy search, and accessibility.
 * Supports Cmd/Ctrl+K shortcut, arrow key navigation, and result filtering.
 *
 * @example
 * ```tsx
 * <FeatureSearch
 *   placeholder="Search features..."
 *   onSearch={(query) => performSearch(query)}
 *   onResultSelect={(result) => navigateTo(result.url)}
 * />
 * ```
 */
export function FeatureSearch({
  placeholder = "Search features, help articles, API docs...",
  onSearch,
  onResultSelect,
  className,
}: FeatureSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [results, setResults] = React.useState<SearchIndexEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [recentSearchesList, setRecentSearchesList] = React.useState<string[]>(
    []
  );
  const [activeFilter, setActiveFilter] = React.useState<FilterType>("all");

  const inputRef = React.useRef<HTMLInputElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  React.useEffect(() => {
    if (open) {
      setRecentSearchesList(recentSearches.get());
    }
  }, [open]);

  // Keyboard shortcut handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search when debounced query changes
  React.useEffect(() => {
    if (debouncedQuery.trim()) {
      setIsSearching(true);
      onSearch?.(debouncedQuery);

      // Simulate search delay (replace with actual search implementation)
      const timer = setTimeout(() => {
        // Mock results - replace with actual search results
        const mockResults: SearchIndexEntry[] = [
          {
            id: "1",
            type: "feature",
            title: "Post-Quantum Encryption",
            description:
              "Military-grade encryption using Kyber-1024 and Dilithium-5",
            content: "Quantum-resistant encryption for secure file transfers",
            category: "Security",
            tags: ["encryption", "quantum", "security"],
            url: "/features/pqc",
            icon: "shield",
          },
          {
            id: "2",
            type: "help",
            title: "Getting Started Guide",
            description: "Learn how to use Tallow for secure file transfers",
            content: "Complete guide for new users",
            category: "Documentation",
            tags: ["guide", "tutorial"],
            url: "/help/getting-started",
            icon: "book-open",
          },
          {
            id: "3",
            type: "api",
            title: "Transfer API",
            description: "REST API for programmatic file transfers",
            content: "API documentation for developers",
            category: "API",
            tags: ["api", "rest", "developer"],
            url: "/api/docs/transfer",
            icon: "code",
          },
        ];

        setResults(mockResults);
        setIsSearching(false);
        setSelectedIndex(0);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setIsSearching(false);
      setSelectedIndex(0);
    }
    return undefined;
  }, [debouncedQuery, onSearch]);

  // Filter results based on active filter
  const filteredResults = React.useMemo(() => {
    if (activeFilter === "all") {return results;}
    return results.filter((result) => result.type === activeFilter);
  }, [results, activeFilter]);

  // Calculate result counts for filters
  const resultCounts = React.useMemo(() => {
    const counts: Record<FilterType, number> = {
      all: results.length,
      feature: 0,
      category: 0,
      help: 0,
      api: 0,
      page: 0,
    };

    results.forEach((result) => {
      counts[result.type]++;
    });

    return counts;
  }, [results]);

  // Reset selected index when filtered results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults.length]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredResults.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case "Enter":
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleResultSelect(filteredResults[selectedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  // Scroll selected result into view
  React.useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[aria-selected="true"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  // Handle result selection
  const handleResultSelect = (result: SearchIndexEntry) => {
    if (query.trim()) {
      recentSearches.add(query);
      setRecentSearchesList(recentSearches.get());
    }
    onResultSelect?.(result);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  // Handle recent search selection
  const handleRecentSearchSelect = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  // Clear recent searches
  const handleClearRecent = () => {
    recentSearches.clear();
    setRecentSearchesList([]);
  };

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setActiveFilter("all");
    }
  }, [open]);

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "relative w-full sm:w-64 justify-start text-sm text-muted-foreground",
          className
        )}
        aria-label="Open search dialog"
      >
        <LucideIcons.Search className="size-4 mr-2" />
        <span className="hidden sm:inline">Search...</span>
        <span className="sm:hidden">Search</span>
        <div className="ml-auto">
          <KeyboardShortcut />
        </div>
      </Button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="backdrop-blur-sm" />
          <DialogContent
            className="max-w-2xl p-0 gap-0 shadow-2xl rounded-2xl overflow-hidden"
            showCloseButton={false}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-label="Search dialog"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <LucideIcons.Search
                className="size-5 text-muted-foreground shrink-0"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={filteredResults.length > 0}
                aria-controls="search-results"
                aria-activedescendant={
                  filteredResults[selectedIndex]
                    ? `result-${filteredResults[selectedIndex].id}`
                    : undefined
                }
                aria-autocomplete="list"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 rounded-md hover:bg-muted transition-colors"
                  aria-label="Clear search"
                >
                  <LucideIcons.X className="size-4 text-muted-foreground" />
                </button>
              )}
              <kbd className="px-2 py-1 rounded-md border border-border bg-muted text-xs font-mono text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Quick Filters */}
            {results.length > 0 && (
              <QuickFilters
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                resultCounts={resultCounts}
              />
            )}

            {/* Results / Recent Searches / Loading / Empty */}
            <div
              ref={resultsRef}
              id="search-results"
              role="listbox"
              aria-label="Search results"
              className="max-h-96 overflow-y-auto"
            >
              {isSearching ? (
                <SearchResultsSkeleton />
              ) : filteredResults.length > 0 ? (
                <motion.div
                  className="p-2 space-y-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AnimatePresence mode="popLayout">
                    {filteredResults.map((result, index) => (
                      <SearchResultItem
                        key={result.id}
                        result={result}
                        query={query}
                        isSelected={index === selectedIndex}
                        onClick={() => handleResultSelect(result)}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Result Count */}
                  <div
                    className="px-2 py-2 text-xs text-muted-foreground text-center border-t border-border"
                    role="status"
                    aria-live="polite"
                  >
                    {filteredResults.length} result
                    {filteredResults.length !== 1 ? "s" : ""}
                    {activeFilter !== "all" &&
                      ` in ${categoryLabels[activeFilter]}`}
                  </div>
                </motion.div>
              ) : query.trim() && !isSearching ? (
                <EmptyState query={query} />
              ) : (
                <RecentSearches
                  searches={recentSearchesList}
                  onSelect={handleRecentSearchSelect}
                  onClear={handleClearRecent}
                />
              )}
            </div>

            {/* Footer with keyboard hints */}
            {filteredResults.length > 0 && (
              <div className="flex items-center gap-4 p-3 border-t border-border bg-muted/50 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono">
                    ↑
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono">
                    ↓
                  </kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono">
                    Enter
                  </kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono">
                    ESC
                  </kbd>
                  <span>Close</span>
                </div>
              </div>
            )}
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}

/**
 * Hook for programmatic control of the search dialog
 */
export function useFeatureSearch() {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
