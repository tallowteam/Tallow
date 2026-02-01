/**
 * FeatureFilters Component Usage Examples
 *
 * Demonstrates various use cases and integration patterns
 * for the FeatureFilters component.
 */

"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import {
  FeatureFilters,
  parseFiltersFromURL,
  serializeFiltersToURL,
} from "./feature-filters"
import type {
  FilterOptions,
  FeatureCategory,
  Feature,
} from "@/lib/features/types"

/**
 * Example 1: Basic Usage
 * Simple filter implementation with local state
 */
export function BasicFilterExample() {
  const [filters, setFilters] = React.useState<FilterOptions>({})

  // Mock categories data
  const mockCategories: FeatureCategory[] = [
    {
      id: "security",
      name: "Security & Encryption",
      description: "Advanced security features",
      icon: "Shield",
      features: [
        {
          id: "pqc",
          title: "Post-Quantum Cryptography",
          description: "Future-proof encryption",
          status: "production",
          complexity: "advanced",
          location: "lib/crypto/pqc",
          tags: ["encryption", "quantum-safe"],
        },
      ],
    },
    {
      id: "transfer",
      name: "File Transfer",
      description: "P2P file sharing",
      icon: "Send",
      features: [
        {
          id: "p2p",
          title: "Peer-to-Peer Transfer",
          description: "Direct device transfers",
          status: "production",
          complexity: "beginner",
          location: "lib/transfer/p2p",
          tags: ["webrtc", "p2p"],
        },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Basic Filter Example</h2>

      <FeatureFilters
        options={filters}
        onChange={setFilters}
        availableCategories={mockCategories}
      />

      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Active Filters:</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(filters, null, 2)}
        </pre>
      </div>
    </div>
  )
}

/**
 * Example 2: URL-Synced Filters
 * Filters persist in URL for shareable filtered views
 */
export function URLSyncedFilterExample() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = React.useState<FilterOptions>(() =>
    searchParams ? parseFiltersFromURL(searchParams) : {}
  )

  const mockCategories: FeatureCategory[] = [
    {
      id: "security",
      name: "Security & Encryption",
      description: "Advanced security features",
      icon: "Shield",
      features: [],
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">URL-Synced Filters</h2>
      <p className="text-muted-foreground">
        Filters are automatically synced to URL. Try sharing the URL with active
        filters!
      </p>

      <FeatureFilters
        options={filters}
        onChange={setFilters}
        availableCategories={mockCategories}
      />

      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Current URL:</h3>
        <code className="text-xs break-all">
          {typeof window !== "undefined"
            ? `${window.location.origin}${window.location.pathname}?${serializeFiltersToURL(filters)}`
            : ""}
        </code>
      </div>
    </div>
  )
}

/**
 * Example 3: Filtered Features Display
 * Complete integration with feature list filtering
 */
export function FilteredFeaturesExample() {
  const [filters, setFilters] = React.useState<FilterOptions>({})

  const mockCategories: FeatureCategory[] = [
    {
      id: "security",
      name: "Security & Encryption",
      description: "Advanced security features",
      icon: "Shield",
      features: [
        {
          id: "pqc",
          title: "Post-Quantum Cryptography",
          description: "Future-proof encryption",
          status: "production",
          complexity: "advanced",
          location: "lib/crypto/pqc",
          tags: ["encryption", "quantum-safe"],
        },
        {
          id: "e2e",
          title: "End-to-End Encryption",
          description: "Secure messaging",
          status: "production",
          complexity: "intermediate",
          location: "lib/crypto/e2e",
          tags: ["encryption", "messaging"],
        },
      ],
    },
    {
      id: "transfer",
      name: "File Transfer",
      description: "P2P file sharing",
      icon: "Send",
      features: [
        {
          id: "p2p",
          title: "Peer-to-Peer Transfer",
          description: "Direct device transfers",
          status: "production",
          complexity: "beginner",
          location: "lib/transfer/p2p",
          tags: ["webrtc", "p2p"],
        },
        {
          id: "resumable",
          title: "Resumable Transfers",
          description: "Resume interrupted transfers",
          status: "beta",
          complexity: "intermediate",
          location: "lib/transfer/resumable",
          tags: ["reliability", "ux"],
        },
      ],
    },
  ]

  // Filter features based on active filters
  const filteredFeatures = React.useMemo(() => {
    let allFeatures: Feature[] = []
    mockCategories.forEach((category) => {
      allFeatures = [...allFeatures, ...category.features]
    })

    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      allFeatures = allFeatures.filter((feature) => {
        const category = mockCategories.find((cat) =>
          cat.features.some((f) => f.id === feature.id)
        )
        return category && filters.categories!.includes(category.id)
      })
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      allFeatures = allFeatures.filter((feature) =>
        filters.status!.includes(feature.status)
      )
    }

    // Apply complexity filter
    if (filters.complexity && filters.complexity.length > 0) {
      allFeatures = allFeatures.filter(
        (feature) =>
          feature.complexity && filters.complexity!.includes(feature.complexity)
      )
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      allFeatures = allFeatures.filter((feature) =>
        filters.tags!.some((tag) => feature.tags?.includes(tag))
      )
    }

    return allFeatures
  }, [filters, mockCategories])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Filtered Features Display</h2>

      <FeatureFilters
        options={filters}
        onChange={setFilters}
        availableCategories={mockCategories}
      />

      <div className="space-y-4">
        <h3 className="font-semibold">
          Matching Features ({filteredFeatures.length})
        </h3>

        {filteredFeatures.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredFeatures.map((feature) => (
              <div
                key={feature.id}
                className="p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <h4 className="font-semibold mb-1">{feature.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {feature.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                    {feature.status}
                  </span>
                  {feature.complexity && (
                    <span className="px-2 py-1 text-xs rounded-full bg-secondary">
                      {feature.complexity}
                    </span>
                  )}
                  {feature.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs rounded-full bg-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground border rounded-lg">
            No features match the selected filters. Try adjusting your criteria.
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Example 4: Controlled Filters with External State
 * Parent component manages filter state
 */
export function ControlledFilterExample() {
  // External state management (could be Redux, Zustand, etc.)
  const [globalFilters, setGlobalFilters] = React.useState<FilterOptions>({
    status: ["production"],
  })

  const mockCategories: FeatureCategory[] = [
    {
      id: "security",
      name: "Security & Encryption",
      description: "Advanced security features",
      icon: "Shield",
      features: [],
    },
  ]

  const handleFilterChange = (newFilters: FilterOptions) => {
    setGlobalFilters(newFilters)
    // Could also trigger analytics, save to preferences, etc.
    console.log("Filters changed:", newFilters)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Controlled Filter Example</h2>

      <FeatureFilters
        options={globalFilters}
        onChange={handleFilterChange}
        availableCategories={mockCategories}
      />

      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">External State:</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(globalFilters, null, 2)}
        </pre>
      </div>
    </div>
  )
}

/**
 * Example 5: Mobile-Optimized Layout
 * Demonstrates responsive behavior
 */
export function MobileFilterExample() {
  const [filters, setFilters] = React.useState<FilterOptions>({})

  const mockCategories: FeatureCategory[] = [
    {
      id: "security",
      name: "Security",
      description: "Security features",
      icon: "Shield",
      features: [],
    },
    {
      id: "transfer",
      name: "Transfer",
      description: "Transfer features",
      icon: "Send",
      features: [],
    },
  ]

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Mobile Filter Example</h2>
      <p className="text-sm text-muted-foreground">
        Resize window to see mobile-optimized behavior
      </p>

      <FeatureFilters
        options={filters}
        onChange={setFilters}
        availableCategories={mockCategories}
        className="sticky top-0 z-10"
      />

      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border rounded-lg">
            <p>Feature {i}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Example 6: Custom Styling
 * Override default styles with custom className
 */
export function CustomStyledFilterExample() {
  const [filters, setFilters] = React.useState<FilterOptions>({})

  const mockCategories: FeatureCategory[] = [
    {
      id: "security",
      name: "Security",
      description: "Security features",
      icon: "Shield",
      features: [],
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Custom Styled Filter</h2>

      <FeatureFilters
        options={filters}
        onChange={setFilters}
        availableCategories={mockCategories}
        className="bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-950 dark:to-purple-950 border-2 border-primary/20 rounded-xl shadow-lg"
      />
    </div>
  )
}

/**
 * Complete Demo Page
 * Shows all examples in one place
 */
export default function FeatureFiltersExamples() {
  return (
    <div className="container mx-auto py-12 space-y-16">
      <div>
        <h1 className="text-4xl font-bold mb-4">FeatureFilters Examples</h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive examples demonstrating various use cases and integration
          patterns for the FeatureFilters component.
        </p>
      </div>

      <BasicFilterExample />
      <URLSyncedFilterExample />
      <FilteredFeaturesExample />
      <ControlledFilterExample />
      <MobileFilterExample />
      <CustomStyledFilterExample />
    </div>
  )
}
