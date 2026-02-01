/**
 * Search Utilities
 * Fuzzy search using Fuse.js with recent searches and caching
 */

import Fuse from 'fuse.js';
import type { IFuseOptions, FuseResultMatch, RangeTuple } from 'fuse.js';
import { secureLog } from '../utils/secure-logger';
import { SEARCH_INDEX, type SearchItem } from './search-index';

/**
 * Fuse.js configuration for optimal search results
 */
const FUSE_OPTIONS: IFuseOptions<SearchItem> = {
  keys: [
    { name: 'title', weight: 3 }, // Title is most important
    { name: 'description', weight: 2 },
    { name: 'content', weight: 1.5 },
    { name: 'keywords', weight: 2.5 },
    { name: 'tags', weight: 2 },
    { name: 'category', weight: 1 },
  ],
  threshold: 0.4, // 0 = exact match, 1 = match anything
  distance: 100, // Maximum distance to search
  minMatchCharLength: 2, // Minimum characters to trigger search
  includeScore: true,
  includeMatches: true,
  useExtendedSearch: false,
  ignoreLocation: true, // Search anywhere in the string
};

/**
 * Initialize Fuse.js instance
 */
let fuseInstance: Fuse<SearchItem> | null = null;

function getFuseInstance(): Fuse<SearchItem> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(SEARCH_INDEX, FUSE_OPTIONS);
  }
  return fuseInstance;
}

/**
 * Search result with score and highlights
 */
export interface SearchResult {
  item: SearchItem;
  score: number;
  matches?: FuseResultMatch[];
  highlights?: {
    field: string;
    value: string;
    indices: RangeTuple[];
  }[];
}

/**
 * Search options
 */
export interface SearchOptions {
  /** Maximum number of results to return */
  limit?: number;
  /** Filter by type */
  type?: SearchItem['type'];
  /** Filter by category */
  category?: string;
  /** Filter by tags */
  tags?: string[];
  /** Minimum score (0-1, lower is better) */
  minScore?: number;
}

/**
 * Perform fuzzy search
 */
export function search(
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  if (!query || query.length < 2) {
    return [];
  }

  const fuse = getFuseInstance();
  const results = fuse.search(query);

  // Apply filters
  let filteredResults = results.map((result) => {
    const matches = result.matches ? [...result.matches] : undefined;
    const highlights = matches?.map((match) => ({
      field: match.key || '',
      value: match.value || '',
      indices: match.indices as RangeTuple[],
    }));

    return {
      item: result.item,
      score: result.score || 0,
      ...(matches ? { matches } : {}),
      ...(highlights ? { highlights } : {}),
    };
  });

  // Filter by type
  if (options.type) {
    filteredResults = filteredResults.filter(
      (result) => result.item.type === options.type
    );
  }

  // Filter by category
  if (options.category) {
    filteredResults = filteredResults.filter(
      (result) => result.item.category === options.category
    );
  }

  // Filter by tags
  if (options.tags && options.tags.length > 0) {
    filteredResults = filteredResults.filter((result) =>
      options.tags!.some((tag) => result.item.tags.includes(tag))
    );
  }

  // Filter by minimum score
  if (options.minScore !== undefined) {
    filteredResults = filteredResults.filter(
      (result) => result.score <= options.minScore!
    );
  }

  // Limit results
  if (options.limit) {
    filteredResults = filteredResults.slice(0, options.limit);
  }

  return filteredResults;
}

/**
 * Get search suggestions based on partial query
 */
export function getSearchSuggestions(
  query: string,
  limit: number = 5
): string[] {
  if (!query || query.length < 2) {
    return [];
  }

  const results = search(query, { limit: limit * 2 });
  const suggestions = new Set<string>();

  // Extract unique titles from results
  results.forEach((result) => {
    if (suggestions.size < limit) {
      suggestions.add(result.item.title);
    }
  });

  return Array.from(suggestions);
}

/**
 * Recent searches storage (localStorage)
 */
const RECENT_SEARCHES_KEY = 'tallow_recent_searches';
const MAX_RECENT_SEARCHES = 10;

/**
 * Save search to recent searches
 */
export function saveRecentSearch(query: string): void {
  if (typeof window === 'undefined' || !query || query.length < 2) {
    return;
  }

  try {
    const recent = getRecentSearches();
    const filtered = recent.filter((q) => q !== query);
    filtered.unshift(query);

    const updated = filtered.slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (error) {
    // Silently fail if localStorage is not available
    secureLog.error('Failed to save recent search:', error);
  }
}

/**
 * Get recent searches
 */
export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    secureLog.error('Failed to get recent searches:', error);
    return [];
  }
}

/**
 * Clear recent searches
 */
export function clearRecentSearches(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    secureLog.error('Failed to clear recent searches:', error);
  }
}

/**
 * Remove specific recent search
 */
export function removeRecentSearch(query: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const recent = getRecentSearches();
    const filtered = recent.filter((q) => q !== query);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
  } catch (error) {
    secureLog.error('Failed to remove recent search:', error);
  }
}

/**
 * Highlight matching text in search results
 */
export function highlightMatch(
  text: string,
  indices: RangeTuple[]
): { text: string; isHighlight: boolean }[] {
  const result: { text: string; isHighlight: boolean }[] = [];
  let lastIndex = 0;

  // Sort indices by start position
  const sortedIndices = indices.sort((a, b) => {
    const startA = a[0];
    const startB = b[0];
    return (startA !== undefined && startB !== undefined) ? startA - startB : 0;
  });

  sortedIndices.forEach(([start, end]) => {
    // Check if start and end are defined
    if (start === undefined || end === undefined) {
      return;
    }

    // Add non-highlighted text before match
    if (start > lastIndex) {
      result.push({
        text: text.slice(lastIndex, start),
        isHighlight: false,
      });
    }

    // Add highlighted text
    result.push({
      text: text.slice(start, end + 1),
      isHighlight: true,
    });

    lastIndex = end + 1;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    result.push({
      text: text.slice(lastIndex),
      isHighlight: false,
    });
  }

  return result;
}

/**
 * Get popular searches (from recent searches)
 */
export function getPopularSearches(limit: number = 5): string[] {
  const recent = getRecentSearches();
  return recent.slice(0, limit);
}

/**
 * Search with autocomplete
 */
export interface AutocompleteResult {
  query: string;
  results: SearchResult[];
  suggestions: string[];
  recentSearches: string[];
}

export function searchWithAutocomplete(
  query: string,
  options: SearchOptions = {}
): AutocompleteResult {
  const results = search(query, { ...options, limit: options.limit || 10 });
  const suggestions = getSearchSuggestions(query, 5);
  const recentSearches = getRecentSearches();

  return {
    query,
    results,
    suggestions,
    recentSearches,
  };
}
