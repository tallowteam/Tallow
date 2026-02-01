"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, X, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type {
  FilterOptions,
  FeatureFiltersProps,
  FeatureStatus,
  FeatureComplexity,
  FeatureCategory,
} from "@/lib/features/types"

// Filter chip color mapping
const FILTER_COLORS = {
  category: "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20",
  status: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
  complexity: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
  tags: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
} as const

// Status options
const STATUS_OPTIONS: FeatureStatus[] = ["production", "beta", "planned", "experimental"]

// Complexity options
const COMPLEXITY_OPTIONS: FeatureComplexity[] = ["beginner", "intermediate", "advanced"]

/**
 * Parse filter options from URL search parameters
 */
export function parseFiltersFromURL(searchParams: URLSearchParams): FilterOptions {
  const filters: FilterOptions = {}

  const categories = searchParams.get("categories")
  if (categories) {
    filters.categories = categories.split(",").filter(Boolean)
  }

  const status = searchParams.get("status")
  if (status) {
    filters.status = status.split(",").filter(Boolean) as FeatureStatus[]
  }

  const complexity = searchParams.get("complexity")
  if (complexity) {
    filters.complexity = complexity.split(",").filter(Boolean) as FeatureComplexity[]
  }

  const tags = searchParams.get("tags")
  if (tags) {
    filters.tags = tags.split(",").filter(Boolean)
  }

  const searchQuery = searchParams.get("q")
  if (searchQuery) {
    filters.searchQuery = searchQuery
  }

  return filters
}

/**
 * Serialize filter options to URL query string
 */
export function serializeFiltersToURL(filters: FilterOptions): string {
  const params = new URLSearchParams()

  if (filters.categories && filters.categories.length > 0) {
    params.set("categories", filters.categories.join(","))
  }

  if (filters.status && filters.status.length > 0) {
    params.set("status", filters.status.join(","))
  }

  if (filters.complexity && filters.complexity.length > 0) {
    params.set("complexity", filters.complexity.join(","))
  }

  if (filters.tags && filters.tags.length > 0) {
    params.set("tags", filters.tags.join(","))
  }

  if (filters.searchQuery) {
    params.set("q", filters.searchQuery)
  }

  return params.toString()
}

/**
 * Calculate total active filter count
 */
function getActiveFilterCount(filters: FilterOptions): number {
  let count = 0
  if (filters.categories) {count += filters.categories.length}
  if (filters.status) {count += filters.status.length}
  if (filters.complexity) {count += filters.complexity.length}
  if (filters.tags) {count += filters.tags.length}
  return count
}

/**
 * Collect all unique tags from features
 */
function collectAllTags(categories: FeatureCategory[]): string[] {
  const tagSet = new Set<string>()
  categories.forEach((category) => {
    category.features.forEach((feature) => {
      feature.tags?.forEach((tag) => tagSet.add(tag))
    })
  })
  return Array.from(tagSet).sort()
}

/**
 * Filter Chip Component
 */
interface FilterChipProps {
  type: keyof typeof FILTER_COLORS
  label: string
  value: string
  onRemove: () => void
}

const FilterChip = React.memo<FilterChipProps>(({ type, label, value, onRemove }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all hover:scale-105",
        FILTER_COLORS[type]
      )}
    >
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter: ${value}`}
        className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-current"
      >
        <X className="size-3" />
      </button>
    </motion.div>
  )
})
FilterChip.displayName = "FilterChip"

/**
 * Tags Dropdown with Search
 */
interface TagsDropdownProps {
  availableTags: string[]
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

const TagsDropdown = React.memo<TagsDropdownProps>(
  ({ availableTags, selectedTags, onChange }) => {
    const [searchQuery, setSearchQuery] = React.useState("")
    const deferredSearchQuery = React.useDeferredValue(searchQuery)

    const filteredTags = React.useMemo(() => {
      if (!deferredSearchQuery) {return availableTags}
      const query = deferredSearchQuery.toLowerCase()
      return availableTags.filter((tag) => tag.toLowerCase().includes(query))
    }, [availableTags, deferredSearchQuery])

    const isStale = searchQuery !== deferredSearchQuery

    const toggleTag = React.useCallback(
      (tag: string) => {
        const newTags = selectedTags.includes(tag)
          ? selectedTags.filter((t) => t !== tag)
          : [...selectedTags, tag]
        onChange(newTags)
      },
      [selectedTags, onChange]
    )

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border border-input px-4 py-2 gap-2 hover:bg-accent"
            aria-label="Filter by tags"
          >
            <Filter className="size-4" />
            Tags
            {selectedTags.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedTags.length}
              </Badge>
            )}
            <ChevronDown className="size-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-64 max-h-80 overflow-y-auto"
        >
          <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-md"
                aria-label="Search tags"
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-60 overflow-y-auto" style={{ opacity: isStale ? 0.7 : 1, transition: 'opacity 150ms' }}>
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={() => toggleTag(tag)}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No tags found
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)
TagsDropdown.displayName = "TagsDropdown"

/**
 * Feature Filters Component
 */
export const FeatureFilters = React.memo<FeatureFiltersProps>(
  ({ options, onChange, availableCategories, className }) => {
    const router = useRouter()

    // Collect all available tags
    const availableTags = React.useMemo(
      () => collectAllTags(availableCategories),
      [availableCategories]
    )

    // Calculate active filter count
    const activeFilterCount = React.useMemo(
      () => getActiveFilterCount(options),
      [options]
    )

    // Sync filters to URL
    React.useEffect(() => {
      const queryString = serializeFiltersToURL(options)
      const newUrl = queryString ? `?${queryString}` : window.location.pathname
      router.replace(newUrl, { scroll: false })
    }, [options, router])

    // Toggle category filter
    const toggleCategory = React.useCallback(
      (categoryId: string) => {
        const categories = options.categories || []
        const newCategories = categories.includes(categoryId)
          ? categories.filter((id) => id !== categoryId)
          : [...categories, categoryId]
        const newOptions = { ...options }
        if (newCategories.length > 0) {
          newOptions.categories = newCategories
        } else {
          delete newOptions.categories
        }
        onChange(newOptions)
      },
      [options, onChange]
    )

    // Toggle status filter
    const toggleStatus = React.useCallback(
      (status: FeatureStatus) => {
        const statuses = options.status || []
        const newStatuses = statuses.includes(status)
          ? statuses.filter((s) => s !== status)
          : [...statuses, status]
        const newOptions = { ...options }
        if (newStatuses.length > 0) {
          newOptions.status = newStatuses
        } else {
          delete newOptions.status
        }
        onChange(newOptions)
      },
      [options, onChange]
    )

    // Toggle complexity filter
    const toggleComplexity = React.useCallback(
      (complexity: FeatureComplexity) => {
        const complexities = options.complexity || []
        const newComplexities = complexities.includes(complexity)
          ? complexities.filter((c) => c !== complexity)
          : [...complexities, complexity]
        const newOptions = { ...options }
        if (newComplexities.length > 0) {
          newOptions.complexity = newComplexities
        } else {
          delete newOptions.complexity
        }
        onChange(newOptions)
      },
      [options, onChange]
    )

    // Update tags
    const updateTags = React.useCallback(
      (tags: string[]) => {
        const newOptions = { ...options }
        if (tags.length > 0) {
          newOptions.tags = tags
        } else {
          delete newOptions.tags
        }
        onChange(newOptions)
      },
      [options, onChange]
    )

    // Remove specific filter
    const removeFilter = React.useCallback(
      (type: keyof FilterOptions, value: string) => {
        const newOptions = { ...options }
        if (type === "categories" && newOptions.categories) {
          newOptions.categories = newOptions.categories.filter((v) => v !== value)
          if (newOptions.categories.length === 0) {delete newOptions.categories}
        } else if (type === "status" && newOptions.status) {
          newOptions.status = newOptions.status.filter((v) => v !== value)
          if (newOptions.status.length === 0) {delete newOptions.status}
        } else if (type === "complexity" && newOptions.complexity) {
          newOptions.complexity = newOptions.complexity.filter((v) => v !== value)
          if (newOptions.complexity.length === 0) {delete newOptions.complexity}
        } else if (type === "tags" && newOptions.tags) {
          newOptions.tags = newOptions.tags.filter((v) => v !== value)
          if (newOptions.tags.length === 0) {delete newOptions.tags}
        }
        onChange(newOptions)
      },
      [options, onChange]
    )

    // Clear all filters
    const clearAllFilters = React.useCallback(() => {
      onChange({})
      // Announce to screen readers
      const announcement = document.createElement("div")
      announcement.setAttribute("role", "status")
      announcement.setAttribute("aria-live", "polite")
      announcement.className = "sr-only"
      announcement.textContent = "All filters cleared"
      document.body.appendChild(announcement)
      setTimeout(() => document.body.removeChild(announcement), 1000)
    }, [onChange])

    return (
      <div
        className={cn(
          "flex flex-col gap-4 bg-background border-b py-4 px-4 lg:px-6",
          className
        )}
        role="region"
        aria-label="Feature filters"
      >
        {/* Filter Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Filter Features</h2>
            {activeFilterCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={activeFilterCount}
              >
                <Badge
                  variant="default"
                  className="animate-pulse"
                  aria-label={`${activeFilterCount} active filters`}
                >
                  {activeFilterCount}
                </Badge>
              </motion.div>
            )}
          </div>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Clear all filters"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-2">
          {/* Categories Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border border-input px-4 py-2 gap-2 hover:bg-accent"
                aria-label="Filter by category"
              >
                <Filter className="size-4" />
                Categories
                {options.categories && options.categories.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {options.categories.length}
                  </Badge>
                )}
                <ChevronDown className="size-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-64 max-h-80 overflow-y-auto"
            >
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableCategories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category.id}
                  checked={options.categories?.includes(category.id) || false}
                  onCheckedChange={() => toggleCategory(category.id)}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  {category.name}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {category.features.length}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border border-input px-4 py-2 gap-2 hover:bg-accent"
                aria-label="Filter by status"
              >
                <Filter className="size-4" />
                Status
                {options.status && options.status.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {options.status.length}
                  </Badge>
                )}
                <ChevronDown className="size-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUS_OPTIONS.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={options.status?.includes(status) || false}
                  onCheckedChange={() => toggleStatus(status)}
                  className="flex items-center gap-3 px-3 py-2 capitalize"
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Complexity Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border border-input px-4 py-2 gap-2 hover:bg-accent"
                aria-label="Filter by complexity"
              >
                <Filter className="size-4" />
                Complexity
                {options.complexity && options.complexity.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {options.complexity.length}
                  </Badge>
                )}
                <ChevronDown className="size-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Filter by Complexity</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COMPLEXITY_OPTIONS.map((complexity) => (
                <DropdownMenuCheckboxItem
                  key={complexity}
                  checked={options.complexity?.includes(complexity) || false}
                  onCheckedChange={() => toggleComplexity(complexity)}
                  className="flex items-center gap-3 px-3 py-2 capitalize"
                >
                  {complexity}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tags Dropdown */}
          <TagsDropdown
            availableTags={availableTags}
            selectedTags={options.tags || []}
            onChange={updateTags}
          />
        </div>

        {/* Active Filter Chips */}
        <AnimatePresence mode="popLayout">
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-thin"
            >
              {/* Category Chips */}
              {options.categories?.map((categoryId) => {
                const category = availableCategories.find((c) => c.id === categoryId)
                return category ? (
                  <FilterChip
                    key={`category-${categoryId}`}
                    type="category"
                    label="Category"
                    value={category.name}
                    onRemove={() => removeFilter("categories", categoryId)}
                  />
                ) : null
              })}

              {/* Status Chips */}
              {options.status?.map((status) => (
                <FilterChip
                  key={`status-${status}`}
                  type="status"
                  label="Status"
                  value={status}
                  onRemove={() => removeFilter("status", status)}
                />
              ))}

              {/* Complexity Chips */}
              {options.complexity?.map((complexity) => (
                <FilterChip
                  key={`complexity-${complexity}`}
                  type="complexity"
                  label="Complexity"
                  value={complexity}
                  onRemove={() => removeFilter("complexity", complexity)}
                />
              ))}

              {/* Tag Chips */}
              {options.tags?.map((tag) => (
                <FilterChip
                  key={`tag-${tag}`}
                  type="tags"
                  label="Tag"
                  value={tag}
                  onRemove={() => removeFilter("tags", tag)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Screen Reader Announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {activeFilterCount > 0
            ? `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active`
            : "No filters active"}
        </div>
      </div>
    )
  }
)
FeatureFilters.displayName = "FeatureFilters"
