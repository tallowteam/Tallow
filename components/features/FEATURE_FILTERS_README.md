# FeatureFilters Component

A comprehensive, accessible, and performant multi-filter system for the Tallow features catalog. Provides chip-based UI with URL query parameter support for shareable filtered views.

## Features

- **Multi-filter Support**: Filter by categories, status, complexity, and tags
- **URL Synchronization**: Filters persist in URL for shareable links
- **Chip-based UI**: Visual feedback with removable filter chips
- **Accessibility**: Full keyboard navigation, ARIA labels, and screen reader support
- **Mobile Responsive**: Touch-friendly with horizontal scroll on mobile
- **Smooth Animations**: Framer Motion for chip add/remove and dropdown transitions
- **TypeScript**: Full type safety with strict mode
- **Performance**: Memoized computations and efficient re-renders

## Installation

The component is located at `components/features/feature-filters.tsx` and requires the following dependencies:

```bash
npm install framer-motion lucide-react
```

## Basic Usage

```tsx
import { FeatureFilters } from "@/components/features/feature-filters"
import type { FilterOptions, FeatureCategory } from "@/lib/features/types"

function FeaturesPage() {
  const [filters, setFilters] = useState<FilterOptions>({})

  const categories: FeatureCategory[] = [
    // Your feature categories
  ]

  return (
    <FeatureFilters
      options={filters}
      onChange={setFilters}
      availableCategories={categories}
    />
  )
}
```

## Props Interface

```typescript
interface FeatureFiltersProps {
  options: FilterOptions;           // Current filter state
  onChange: (options: FilterOptions) => void;  // Filter change handler
  availableCategories: FeatureCategory[];      // Available categories for filtering
  className?: string;                          // Optional custom className
}

interface FilterOptions {
  categories?: string[];           // Category IDs
  status?: FeatureStatus[];       // production | beta | planned | experimental
  complexity?: FeatureComplexity[]; // beginner | intermediate | advanced
  tags?: string[];                // Custom tags
  searchQuery?: string;           // Search query (for future integration)
}
```

## Filter Types

### 1. Categories
Filter by feature categories. Displays all 16 available categories with feature counts.

```tsx
// Example: Filter by security and transfer categories
const filters = {
  categories: ["security", "transfer"]
}
```

### 2. Status
Filter by feature development status.

```tsx
// Example: Show only production and beta features
const filters = {
  status: ["production", "beta"]
}
```

Options:
- `production` - Live and stable features
- `beta` - Features in testing
- `planned` - Upcoming features
- `experimental` - Early stage features

### 3. Complexity
Filter by feature complexity level.

```tsx
// Example: Show beginner and intermediate features
const filters = {
  complexity: ["beginner", "intermediate"]
}
```

Options:
- `beginner` - Easy to use
- `intermediate` - Moderate complexity
- `advanced` - Expert level

### 4. Tags
Filter by dynamic tags from features. Includes search functionality.

```tsx
// Example: Filter by encryption and webrtc tags
const filters = {
  tags: ["encryption", "webrtc"]
}
```

## URL Synchronization

### Parsing Filters from URL

```tsx
import { parseFiltersFromURL } from "@/components/features/feature-filters"
import { useSearchParams } from "next/navigation"

function MyComponent() {
  const searchParams = useSearchParams()
  const filters = parseFiltersFromURL(searchParams)

  // filters now contains parsed filter options
}
```

### Serializing Filters to URL

```tsx
import { serializeFiltersToURL } from "@/components/features/feature-filters"

const filters: FilterOptions = {
  categories: ["security"],
  status: ["production"]
}

const queryString = serializeFiltersToURL(filters)
// Result: "categories=security&status=production"
```

### URL Format

Filters are encoded as comma-separated values:

```
?categories=security,transfer&status=production,beta&complexity=beginner&tags=encryption,webrtc
```

## Filter Chips

Filter chips are automatically generated for active filters with the following characteristics:

### Color Coding
- **Category**: Blue (`bg-blue-500/10 text-blue-700`)
- **Status**: Green (`bg-green-500/10 text-green-700`)
- **Complexity**: Yellow (`bg-yellow-500/10 text-yellow-700`)
- **Tags**: Purple (`bg-purple-500/10 text-purple-700`)

### Chip Features
- Smooth fade-in/out animations
- Hover scale effect (1.05x)
- Individual remove buttons with ARIA labels
- Touch-friendly size (44x44px minimum)

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate through filter dropdowns
- **Enter/Space**: Open dropdown menus
- **Arrow Keys**: Navigate within dropdown items
- **Escape**: Close dropdown
- **Tab/Shift+Tab**: Navigate between chips

### ARIA Labels
- All buttons have descriptive `aria-label` attributes
- Active filter count announced to screen readers
- Filter changes announced with live regions
- Dropdown menus properly labeled

### Screen Reader Support
```tsx
// Screen reader announcements
<div role="status" aria-live="polite" aria-atomic="true">
  {activeFilterCount} filters active
</div>
```

## Mobile Optimization

### Responsive Behavior
- **Desktop**: Full horizontal layout
- **Tablet**: Wrapped layout with maintained spacing
- **Mobile**:
  - Horizontal scroll for filter chips
  - Touch-optimized tap targets (44x44px)
  - Bottom sheet style dropdowns (future enhancement)

### Touch Gestures
- Tap to open dropdowns
- Swipe to scroll filter chips
- Tap X to remove individual filters

## Animations

All animations are powered by Framer Motion:

### Filter Chip Animations
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.8 }}
  transition={{ duration: 0.2 }}
/>
```

### Badge Pulse Animation
```tsx
<Badge className="animate-pulse" />
```

### Dropdown Animations
Built-in Radix UI animations:
- Fade in/out
- Slide from top/bottom
- Zoom in/out

## Performance Optimizations

### Memoization
```tsx
// Components are memoized with React.memo
export const FeatureFilters = React.memo<FeatureFiltersProps>(...)
export const FilterChip = React.memo<FilterChipProps>(...)
export const TagsDropdown = React.memo<TagsDropdownProps>(...)
```

### Efficient Re-renders
- `useCallback` for all event handlers
- `useMemo` for computed values (available tags, filtered items)
- Controlled component pattern prevents unnecessary updates

### Debounced Search
Tag search is local (no debounce needed), but can be enhanced:

```tsx
const debouncedSearch = useDebouncedValue(searchQuery, 300)
```

## Examples

### Basic Filter Implementation

```tsx
import { useState } from "react"
import { FeatureFilters } from "@/components/features"
import type { FilterOptions, FeatureCategory } from "@/lib/features/types"

export function FeaturesPage() {
  const [filters, setFilters] = useState<FilterOptions>({})
  const categories = [] // Your categories

  return (
    <div>
      <FeatureFilters
        options={filters}
        onChange={setFilters}
        availableCategories={categories}
      />
      {/* Your filtered content */}
    </div>
  )
}
```

### URL-Synced Filters

```tsx
"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { FeatureFilters, parseFiltersFromURL } from "@/components/features"

export function FeaturesPageWithURL() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FilterOptions>(() =>
    parseFiltersFromURL(searchParams)
  )

  // Filters automatically sync to URL via the component

  return (
    <FeatureFilters
      options={filters}
      onChange={setFilters}
      availableCategories={categories}
    />
  )
}
```

### Filtered Feature Display

```tsx
function FilteredFeatureList() {
  const [filters, setFilters] = useState<FilterOptions>({})

  const filteredFeatures = useMemo(() => {
    let features = allFeatures

    // Apply category filter
    if (filters.categories?.length) {
      features = features.filter(f =>
        filters.categories!.includes(f.categoryId)
      )
    }

    // Apply status filter
    if (filters.status?.length) {
      features = features.filter(f =>
        filters.status!.includes(f.status)
      )
    }

    // Apply complexity filter
    if (filters.complexity?.length) {
      features = features.filter(f =>
        f.complexity && filters.complexity!.includes(f.complexity)
      )
    }

    // Apply tags filter (OR logic)
    if (filters.tags?.length) {
      features = features.filter(f =>
        filters.tags!.some(tag => f.tags?.includes(tag))
      )
    }

    return features
  }, [filters, allFeatures])

  return (
    <>
      <FeatureFilters
        options={filters}
        onChange={setFilters}
        availableCategories={categories}
      />
      <FeatureList features={filteredFeatures} />
    </>
  )
}
```

### Custom Styling

```tsx
<FeatureFilters
  options={filters}
  onChange={setFilters}
  availableCategories={categories}
  className="sticky top-0 z-50 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950"
/>
```

## Helper Functions

### parseFiltersFromURL

Parses URL search parameters into FilterOptions object.

```typescript
function parseFiltersFromURL(searchParams: URLSearchParams): FilterOptions
```

**Example:**
```tsx
const searchParams = new URLSearchParams("categories=security&status=production")
const filters = parseFiltersFromURL(searchParams)
// { categories: ["security"], status: ["production"] }
```

### serializeFiltersToURL

Serializes FilterOptions object to URL query string.

```typescript
function serializeFiltersToURL(filters: FilterOptions): string
```

**Example:**
```tsx
const filters = { categories: ["security"], status: ["production"] }
const queryString = serializeFiltersToURL(filters)
// "categories=security&status=production"
```

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { FeatureFilters } from "./feature-filters"

describe("FeatureFilters", () => {
  it("renders filter dropdowns", () => {
    render(<FeatureFilters {...props} />)
    expect(screen.getByText("Categories")).toBeInTheDocument()
    expect(screen.getByText("Status")).toBeInTheDocument()
  })

  it("shows active filter count", () => {
    const filters = { categories: ["security"], status: ["production"] }
    render(<FeatureFilters options={filters} {...props} />)
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("removes individual filter on chip click", () => {
    const onChange = jest.fn()
    render(<FeatureFilters options={filters} onChange={onChange} {...props} />)
    fireEvent.click(screen.getByLabelText(/Remove Category filter/))
    expect(onChange).toHaveBeenCalled()
  })
})
```

### E2E Tests

```tsx
import { test, expect } from "@playwright/test"

test("filter features by category", async ({ page }) => {
  await page.goto("/features")

  // Open category dropdown
  await page.click("text=Categories")

  // Select security category
  await page.click("text=Security & Encryption")

  // Verify filter chip appears
  await expect(page.locator("text=Category: Security")).toBeVisible()

  // Verify URL updated
  await expect(page).toHaveURL(/categories=security/)
})
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Known Issues

None currently. Report issues at [GitHub Issues](https://github.com/your-repo/issues).

## Future Enhancements

- [ ] Bottom sheet dropdowns on mobile
- [ ] Filter presets (save/load common filter combinations)
- [ ] Search query integration
- [ ] Filter analytics tracking
- [ ] Export/import filter configurations
- [ ] Advanced filter operators (AND/OR/NOT)
- [ ] Filter history (undo/redo)

## Contributing

Contributions welcome! Please follow the project's coding standards and include tests for new features.

## License

MIT License - see LICENSE file for details.

## Related Components

- [FeatureCard](./feature-card.tsx) - Display individual features
- [CategorySection](./category-section.tsx) - Display feature categories
- [FeatureSearch](./feature-search.tsx) - Search features
- [FeatureDetailDialog](./feature-detail-dialog.tsx) - Feature details modal

## Support

For questions or issues:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Discord: [Join our community](https://discord.gg/your-server)
- Email: support@tallow.app
