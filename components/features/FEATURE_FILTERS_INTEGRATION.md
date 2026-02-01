# FeatureFilters Integration Guide

Quick reference for integrating the FeatureFilters component into your Tallow features page.

## Quick Start (5 Minutes)

### 1. Import the Component

```tsx
import { FeatureFilters } from "@/components/features"
import type { FilterOptions, FeatureCategory } from "@/lib/features/types"
```

### 2. Add State Management

```tsx
const [filters, setFilters] = useState<FilterOptions>({})
```

### 3. Render the Component

```tsx
<FeatureFilters
  options={filters}
  onChange={setFilters}
  availableCategories={categories}
/>
```

### 4. Filter Your Features

```tsx
const filteredFeatures = useMemo(() => {
  return applyFilters(allFeatures, filters)
}, [allFeatures, filters])
```

## Complete Integration Example

```tsx
"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import {
  FeatureFilters,
  parseFiltersFromURL,
} from "@/components/features"
import type {
  FilterOptions,
  FeatureCategory,
  Feature,
} from "@/lib/features/types"

export default function FeaturesPage() {
  // Initialize filters from URL
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FilterOptions>(() =>
    parseFiltersFromURL(searchParams)
  )

  // Your feature categories (from API, static data, etc.)
  const categories: FeatureCategory[] = [
    // ... your categories
  ]

  // Filter features based on active filters
  const filteredFeatures = useMemo(() => {
    let features: Feature[] = []

    // Collect all features
    categories.forEach((category) => {
      features = [...features, ...category.features]
    })

    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      features = features.filter((feature) => {
        const category = categories.find((cat) =>
          cat.features.some((f) => f.id === feature.id)
        )
        return category && filters.categories!.includes(category.id)
      })
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      features = features.filter((feature) =>
        filters.status!.includes(feature.status)
      )
    }

    // Apply complexity filter
    if (filters.complexity && filters.complexity.length > 0) {
      features = features.filter(
        (feature) =>
          feature.complexity && filters.complexity!.includes(feature.complexity)
      )
    }

    // Apply tags filter (OR logic - match any tag)
    if (filters.tags && filters.tags.length > 0) {
      features = features.filter((feature) =>
        filters.tags!.some((tag) => feature.tags?.includes(tag))
      )
    }

    return features
  }, [filters, categories])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Features</h1>

      {/* Filter Component */}
      <FeatureFilters
        options={filters}
        onChange={setFilters}
        availableCategories={categories}
        className="mb-8"
      />

      {/* Results Count */}
      <div className="mb-4 text-muted-foreground">
        Showing {filteredFeatures.length} feature
        {filteredFeatures.length !== 1 ? "s" : ""}
      </div>

      {/* Features Display */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredFeatures.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>

      {/* Empty State */}
      {filteredFeatures.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            No features match your filters.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filter criteria.
          </p>
        </div>
      )}
    </div>
  )
}
```

## Filter Logic Implementation

### Basic Filter Function

```tsx
function applyFilters(
  features: Feature[],
  filters: FilterOptions
): Feature[] {
  let filtered = [...features]

  // Category filter
  if (filters.categories?.length) {
    filtered = filtered.filter((f) =>
      filters.categories!.includes(f.categoryId)
    )
  }

  // Status filter
  if (filters.status?.length) {
    filtered = filtered.filter((f) => filters.status!.includes(f.status))
  }

  // Complexity filter
  if (filters.complexity?.length) {
    filtered = filtered.filter(
      (f) => f.complexity && filters.complexity!.includes(f.complexity)
    )
  }

  // Tags filter (OR logic)
  if (filters.tags?.length) {
    filtered = filtered.filter((f) =>
      filters.tags!.some((tag) => f.tags?.includes(tag))
    )
  }

  return filtered
}
```

### Advanced Filter Function (AND logic for tags)

```tsx
function applyFiltersStrict(
  features: Feature[],
  filters: FilterOptions
): Feature[] {
  let filtered = [...features]

  // ... other filters same as above ...

  // Tags filter (AND logic - must have ALL tags)
  if (filters.tags?.length) {
    filtered = filtered.filter((f) =>
      filters.tags!.every((tag) => f.tags?.includes(tag))
    )
  }

  return filtered
}
```

## URL Persistence

### Server Component with searchParams

```tsx
import { parseFiltersFromURL } from "@/components/features"

export default function FeaturesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const urlSearchParams = new URLSearchParams(
    searchParams as Record<string, string>
  )
  const initialFilters = parseFiltersFromURL(urlSearchParams)

  return <FeaturesClientPage initialFilters={initialFilters} />
}
```

### Client Component with useSearchParams

```tsx
"use client"

import { useSearchParams } from "next/navigation"
import { parseFiltersFromURL } from "@/components/features"

export function FeaturesClientPage() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState(() =>
    parseFiltersFromURL(searchParams)
  )

  // Component automatically syncs to URL
  return <FeatureFilters {...props} />
}
```

## Performance Optimization

### Memoize Filter Logic

```tsx
const filteredFeatures = useMemo(() => {
  return applyFilters(allFeatures, filters)
}, [allFeatures, filters])
```

### Debounce Filter Changes (Optional)

```tsx
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"

const debouncedFilters = useDebouncedValue(filters, 300)

const filteredFeatures = useMemo(() => {
  return applyFilters(allFeatures, debouncedFilters)
}, [allFeatures, debouncedFilters])
```

### Virtual Scrolling for Large Lists

```tsx
import { useVirtualizer } from "@tanstack/react-virtual"

const rowVirtualizer = useVirtualizer({
  count: filteredFeatures.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 200,
})
```

## State Management Integration

### With Redux

```tsx
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { setFilters } from "@/store/slices/featuresSlice"

export function FeaturesPageWithRedux() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector((state) => state.features.filters)

  const handleFilterChange = (newFilters: FilterOptions) => {
    dispatch(setFilters(newFilters))
  }

  return (
    <FeatureFilters
      options={filters}
      onChange={handleFilterChange}
      availableCategories={categories}
    />
  )
}
```

### With Zustand

```tsx
import { useFeatureStore } from "@/store/features"

export function FeaturesPageWithZustand() {
  const { filters, setFilters } = useFeatureStore()

  return (
    <FeatureFilters
      options={filters}
      onChange={setFilters}
      availableCategories={categories}
    />
  )
}
```

### With Context

```tsx
import { useFeatureContext } from "@/contexts/FeatureContext"

export function FeaturesPageWithContext() {
  const { filters, setFilters } = useFeatureContext()

  return (
    <FeatureFilters
      options={filters}
      onChange={setFilters}
      availableCategories={categories}
    />
  )
}
```

## Analytics Integration

### Track Filter Changes

```tsx
const handleFilterChange = (newFilters: FilterOptions) => {
  setFilters(newFilters)

  // Track with analytics
  analytics.track("Features Filtered", {
    categories: newFilters.categories?.length || 0,
    status: newFilters.status?.length || 0,
    complexity: newFilters.complexity?.length || 0,
    tags: newFilters.tags?.length || 0,
  })
}
```

### Track Filter Usage

```tsx
useEffect(() => {
  if (Object.keys(filters).length > 0) {
    analytics.track("Feature Filter Applied", {
      filterTypes: Object.keys(filters),
      totalFilters: getActiveFilterCount(filters),
    })
  }
}, [filters])
```

## Styling Customization

### Custom Theme

```tsx
<FeatureFilters
  {...props}
  className="
    bg-gradient-to-r from-blue-50 to-purple-50
    dark:from-blue-950 dark:to-purple-950
    border-2 border-primary/20
    rounded-xl shadow-lg
    sticky top-0 z-50
  "
/>
```

### Override Filter Colors

```tsx
// In your global CSS or Tailwind config
.filter-chip-category {
  @apply bg-indigo-500/10 text-indigo-700 dark:text-indigo-300;
}

.filter-chip-status {
  @apply bg-emerald-500/10 text-emerald-700 dark:text-emerald-300;
}
```

## Accessibility Considerations

### Focus Management

```tsx
useEffect(() => {
  // Announce filter changes to screen readers
  const announcement = document.createElement("div")
  announcement.setAttribute("role", "status")
  announcement.setAttribute("aria-live", "polite")
  announcement.className = "sr-only"
  announcement.textContent = `Showing ${filteredFeatures.length} features`
  document.body.appendChild(announcement)

  return () => document.body.removeChild(announcement)
}, [filteredFeatures.length])
```

### Keyboard Shortcuts

```tsx
useEffect(() => {
  const handleKeyboard = (e: KeyboardEvent) => {
    // Ctrl/Cmd + K to focus search/filters
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault()
      document.querySelector('[aria-label="Filter by category"]')?.focus()
    }
  }

  document.addEventListener("keydown", handleKeyboard)
  return () => document.removeEventListener("keydown", handleKeyboard)
}, [])
```

## Mobile Optimization

### Sticky Filters on Mobile

```tsx
<FeatureFilters
  {...props}
  className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm md:static"
/>
```

### Bottom Sheet for Mobile (Future Enhancement)

```tsx
import { useMediaQuery } from "@/lib/hooks/use-media-query"

const isMobile = useMediaQuery("(max-width: 768px)")

return isMobile ? (
  <BottomSheet>
    <FeatureFilters {...props} />
  </BottomSheet>
) : (
  <FeatureFilters {...props} />
)
```

## Testing Integration

### E2E Test Example

```typescript
import { test, expect } from "@playwright/test"

test("filter features workflow", async ({ page }) => {
  await page.goto("/features")

  // Open category filter
  await page.click('[aria-label="Filter by category"]')
  await page.click('text=Security & Encryption')

  // Verify filter chip appears
  await expect(page.locator("text=Category: Security")).toBeVisible()

  // Verify URL updated
  await expect(page).toHaveURL(/categories=security/)

  // Verify filtered results
  const featureCards = page.locator('[data-testid="feature-card"]')
  await expect(featureCards).toHaveCount(await featureCards.count())

  // Clear filters
  await page.click('[aria-label="Clear all filters"]')
  await expect(page.locator("text=Category: Security")).not.toBeVisible()
})
```

## Troubleshooting

### Filters Not Persisting in URL

Make sure you're using the client component with `useSearchParams`:

```tsx
"use client"

import { useSearchParams } from "next/navigation"
```

### Filters Not Updating

Ensure you're passing a proper onChange handler:

```tsx
const [filters, setFilters] = useState<FilterOptions>({})

<FeatureFilters
  options={filters}
  onChange={setFilters} // Not onChange={() => {}}
  {...props}
/>
```

### Tags Not Showing

Verify your features have tags defined:

```tsx
const feature: Feature = {
  id: "pqc",
  title: "Post-Quantum Cryptography",
  // ... other props
  tags: ["encryption", "quantum-safe"], // Add tags here
}
```

### Performance Issues with Large Lists

Implement virtual scrolling or pagination:

```tsx
import { useVirtualizer } from "@tanstack/react-virtual"
// or
import { Pagination } from "@/components/ui/pagination"
```

## Support

For additional help:
- Documentation: [FEATURE_FILTERS_README.md](./FEATURE_FILTERS_README.md)
- Examples: [feature-filters.example.tsx](./feature-filters.example.tsx)
- Tests: [feature-filters.test.tsx](./feature-filters.test.tsx)
- GitHub Issues: [Create Issue](https://github.com/your-repo/issues)
