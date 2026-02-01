# FeatureFilters Quick Reference

## Import

```tsx
import { FeatureFilters, parseFiltersFromURL, serializeFiltersToURL } from "@/components/features"
import type { FilterOptions, FeatureCategory } from "@/lib/features/types"
```

## Basic Usage

```tsx
const [filters, setFilters] = useState<FilterOptions>({})

<FeatureFilters
  options={filters}
  onChange={setFilters}
  availableCategories={categories}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `FilterOptions` | Yes | Current filter state |
| `onChange` | `(options: FilterOptions) => void` | Yes | Filter change handler |
| `availableCategories` | `FeatureCategory[]` | Yes | Available categories |
| `className` | `string` | No | Custom CSS classes |

## FilterOptions Type

```tsx
interface FilterOptions {
  categories?: string[]           // ["security", "transfer"]
  status?: FeatureStatus[]       // ["production", "beta"]
  complexity?: FeatureComplexity[] // ["beginner", "advanced"]
  tags?: string[]                // ["encryption", "webrtc"]
  searchQuery?: string           // "quantum"
}
```

## Filter Types

### Categories
All 16 feature categories with counts

### Status
- `production` - Live features
- `beta` - Testing features
- `planned` - Upcoming features
- `experimental` - Early stage

### Complexity
- `beginner` - Easy
- `intermediate` - Moderate
- `advanced` - Expert

### Tags
Dynamic tags from features with search

## URL Sync

### Parse from URL
```tsx
const searchParams = useSearchParams()
const filters = parseFiltersFromURL(searchParams)
```

### Serialize to URL
```tsx
const queryString = serializeFiltersToURL(filters)
// "categories=security&status=production"
```

## Filter Logic

```tsx
const filtered = useMemo(() => {
  let result = [...features]

  // Category
  if (filters.categories?.length) {
    result = result.filter(f => filters.categories!.includes(f.categoryId))
  }

  // Status
  if (filters.status?.length) {
    result = result.filter(f => filters.status!.includes(f.status))
  }

  // Complexity
  if (filters.complexity?.length) {
    result = result.filter(f =>
      f.complexity && filters.complexity!.includes(f.complexity)
    )
  }

  // Tags (OR logic)
  if (filters.tags?.length) {
    result = result.filter(f =>
      filters.tags!.some(tag => f.tags?.includes(tag))
    )
  }

  return result
}, [features, filters])
```

## Chip Colors

- **Category**: Blue
- **Status**: Green
- **Complexity**: Yellow
- **Tags**: Purple

## Keyboard Shortcuts

- `Tab` - Navigate dropdowns
- `Enter/Space` - Open dropdown
- `Arrow Keys` - Navigate items
- `Escape` - Close dropdown

## ARIA Labels

All controls have proper ARIA labels:
- Filter dropdowns: `aria-label="Filter by [type]"`
- Remove buttons: `aria-label="Remove [type] filter: [value]"`
- Clear all: `aria-label="Clear all filters"`
- Active count: `aria-label="[count] active filters"`

## Animations

- Chips: Fade in/out (200ms)
- Badge: Pulse on change
- Dropdowns: Built-in Radix animations

## Mobile Optimizations

- Horizontal scroll for chips
- Touch-friendly targets (44x44px)
- Responsive dropdown sizing

## Common Patterns

### With URL Persistence
```tsx
const searchParams = useSearchParams()
const [filters, setFilters] = useState(() => parseFiltersFromURL(searchParams))
```

### With Redux
```tsx
const filters = useAppSelector(state => state.features.filters)
const dispatch = useAppDispatch()
<FeatureFilters options={filters} onChange={f => dispatch(setFilters(f))} />
```

### With Analytics
```tsx
const handleChange = (f: FilterOptions) => {
  setFilters(f)
  analytics.track("Features Filtered", { count: getActiveFilterCount(f) })
}
```

### Sticky Header
```tsx
<FeatureFilters className="sticky top-0 z-50 bg-background" />
```

## Performance Tips

1. **Memoize filters**: Use `useMemo` for filter logic
2. **Debounce changes**: Optional for heavy computations
3. **Virtual scroll**: For large result lists
4. **Code split**: Lazy load if not immediately visible

## Testing Selectors

```tsx
// Dropdowns
screen.getByLabelText("Filter by category")
screen.getByLabelText("Filter by status")

// Chips
screen.getByLabelText(/Remove Category filter/)

// Clear button
screen.getByLabelText("Clear all filters")

// Active count
screen.getByLabelText(/\d+ active filters/)
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Filters not persisting | Use `"use client"` directive |
| URL not updating | Check router.replace is available |
| Tags not showing | Ensure features have `tags` array |
| Performance issues | Implement memoization |

## Files

- Component: `components/features/feature-filters.tsx`
- Types: `lib/features/types.ts`
- Tests: `components/features/feature-filters.test.tsx`
- Examples: `components/features/feature-filters.example.tsx`
- Docs: `components/features/FEATURE_FILTERS_README.md`
- Integration: `components/features/FEATURE_FILTERS_INTEGRATION.md`

## Support

- Documentation: See README.md in same directory
- Examples: See example.tsx in same directory
- Issues: GitHub Issues
