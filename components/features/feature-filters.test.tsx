/**
 * FeatureFilters Component Tests
 *
 * Unit tests for helper functions and component logic
 */

import { describe, it, expect } from "vitest"
import {
  parseFiltersFromURL,
  serializeFiltersToURL,
} from "./feature-filters"
import type {
  FilterOptions,
} from "@/lib/features/types"

describe("FeatureFilters Helper Functions", () => {
  describe("parseFiltersFromURL", () => {
    it("parses empty search params", () => {
      const searchParams = new URLSearchParams()
      const filters = parseFiltersFromURL(searchParams)
      expect(filters).toEqual({})
    })

    it("parses single category", () => {
      const searchParams = new URLSearchParams("categories=security")
      const filters = parseFiltersFromURL(searchParams)
      expect(filters).toEqual({ categories: ["security"] })
    })

    it("parses multiple categories", () => {
      const searchParams = new URLSearchParams("categories=security,transfer")
      const filters = parseFiltersFromURL(searchParams)
      expect(filters).toEqual({ categories: ["security", "transfer"] })
    })

    it("parses status filters", () => {
      const searchParams = new URLSearchParams("status=production,beta")
      const filters = parseFiltersFromURL(searchParams)
      expect(filters).toEqual({ status: ["production", "beta"] })
    })

    it("parses complexity filters", () => {
      const searchParams = new URLSearchParams("complexity=beginner,advanced")
      const filters = parseFiltersFromURL(searchParams)
      expect(filters).toEqual({ complexity: ["beginner", "advanced"] })
    })

    it("parses tag filters", () => {
      const searchParams = new URLSearchParams("tags=encryption,webrtc")
      const filters = parseFiltersFromURL(searchParams)
      expect(filters).toEqual({ tags: ["encryption", "webrtc"] })
    })

    it("parses search query", () => {
      const searchParams = new URLSearchParams("q=quantum")
      const filters = parseFiltersFromURL(searchParams)
      expect(filters).toEqual({ searchQuery: "quantum" })
    })

    it("parses all filter types", () => {
      const searchParams = new URLSearchParams(
        "categories=security&status=production&complexity=advanced&tags=encryption&q=crypto"
      )
      const filters = parseFiltersFromURL(searchParams)
      expect(filters).toEqual({
        categories: ["security"],
        status: ["production"],
        complexity: ["advanced"],
        tags: ["encryption"],
        searchQuery: "crypto",
      })
    })

    it("handles empty string values", () => {
      const searchParams = new URLSearchParams("categories=")
      const filters = parseFiltersFromURL(searchParams)
      expect(filters).toEqual({})
    })

    it("filters out empty array elements", () => {
      const searchParams = new URLSearchParams("categories=security,,transfer")
      const filters = parseFiltersFromURL(searchParams)
      expect(filters).toEqual({ categories: ["security", "transfer"] })
    })
  })

  describe("serializeFiltersToURL", () => {
    it("serializes empty filters", () => {
      const queryString = serializeFiltersToURL({})
      expect(queryString).toBe("")
    })

    it("serializes single category", () => {
      const queryString = serializeFiltersToURL({
        categories: ["security"],
      })
      expect(queryString).toBe("categories=security")
    })

    it("serializes multiple categories", () => {
      const queryString = serializeFiltersToURL({
        categories: ["security", "transfer"],
      })
      expect(queryString).toBe("categories=security%2Ctransfer")
    })

    it("serializes status filters", () => {
      const queryString = serializeFiltersToURL({
        status: ["production", "beta"],
      })
      expect(queryString).toBe("status=production%2Cbeta")
    })

    it("serializes complexity filters", () => {
      const queryString = serializeFiltersToURL({
        complexity: ["beginner", "advanced"],
      })
      expect(queryString).toBe("complexity=beginner%2Cadvanced")
    })

    it("serializes tag filters", () => {
      const queryString = serializeFiltersToURL({
        tags: ["encryption", "webrtc"],
      })
      expect(queryString).toBe("tags=encryption%2Cwebrtc")
    })

    it("serializes search query", () => {
      const queryString = serializeFiltersToURL({
        searchQuery: "quantum",
      })
      expect(queryString).toBe("q=quantum")
    })

    it("serializes all filter types", () => {
      const queryString = serializeFiltersToURL({
        categories: ["security"],
        status: ["production", "beta"],
        complexity: ["advanced"],
        tags: ["encryption"],
        searchQuery: "crypto",
      })

      const params = new URLSearchParams(queryString)
      expect(params.get("categories")).toBe("security")
      expect(params.get("status")).toBe("production,beta")
      expect(params.get("complexity")).toBe("advanced")
      expect(params.get("tags")).toBe("encryption")
      expect(params.get("q")).toBe("crypto")
    })

    it("omits empty arrays", () => {
      const queryString = serializeFiltersToURL({
        categories: [],
        status: ["production"],
      })
      expect(queryString).toBe("status=production")
      expect(queryString).not.toContain("categories")
    })

    it("omits undefined values", () => {
      const filters: FilterOptions = {
        categories: ["security"],
      }
      // Conditionally add status only if it has a value
      // This tests that serializeFiltersToURL properly omits missing optional properties
      const queryString = serializeFiltersToURL(filters)
      expect(queryString).toBe("categories=security")
      expect(queryString).not.toContain("status")
    })

    it("handles special characters in search query", () => {
      const queryString = serializeFiltersToURL({
        searchQuery: "quantum + cryptography",
      })
      const params = new URLSearchParams(queryString)
      expect(params.get("q")).toBe("quantum + cryptography")
    })
  })

  describe("Round-trip parsing and serialization", () => {
    it("maintains filter integrity through parse and serialize", () => {
      const original: FilterOptions = {
        categories: ["security", "transfer"],
        status: ["production", "beta"],
        complexity: ["advanced"],
        tags: ["encryption", "webrtc", "p2p"],
        searchQuery: "quantum cryptography",
      }

      const serialized = serializeFiltersToURL(original)
      const parsed = parseFiltersFromURL(new URLSearchParams(serialized))

      expect(parsed).toEqual(original)
    })

    it("handles edge cases with special characters", () => {
      const original: FilterOptions = {
        searchQuery: "test & verify @ 100%",
      }

      const serialized = serializeFiltersToURL(original)
      const parsed = parseFiltersFromURL(new URLSearchParams(serialized))

      expect(parsed).toEqual(original)
    })

    it("handles empty and undefined arrays correctly", () => {
      const original: FilterOptions = {
        categories: ["security"],
      }

      const serialized = serializeFiltersToURL(original)
      const parsed = parseFiltersFromURL(new URLSearchParams(serialized))

      expect(parsed).toEqual(original)
      expect(parsed.status).toBeUndefined()
      expect(parsed.complexity).toBeUndefined()
      expect(parsed.tags).toBeUndefined()
    })
  })

  describe("Filter validation", () => {
    it("handles malformed category values", () => {
      const searchParams = new URLSearchParams("categories=invalid,,security,")
      const filters = parseFiltersFromURL(searchParams)
      expect(filters.categories).toEqual(["invalid", "security"])
    })

    it("preserves case sensitivity", () => {
      const searchParams = new URLSearchParams("categories=Security,TRANSFER")
      const filters = parseFiltersFromURL(searchParams)
      expect(filters.categories).toEqual(["Security", "TRANSFER"])
    })

    it("handles URL-encoded values", () => {
      const searchParams = new URLSearchParams("q=post%20quantum%20cryptography")
      const filters = parseFiltersFromURL(searchParams)
      expect(filters.searchQuery).toBe("post quantum cryptography")
    })
  })
})
