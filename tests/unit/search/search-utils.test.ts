/**
 * Search Utilities Tests
 * Tests for fuzzy search, recent searches, and autocomplete
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  search,
  getSearchSuggestions,
  saveRecentSearch,
  getRecentSearches,
  clearRecentSearches,
  removeRecentSearch,
  searchWithAutocomplete,
  highlightMatch,
} from '@/lib/search/search-utils';

describe('Search Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('search()', () => {
    it('returns empty array for empty query', () => {
      const results = search('');
      expect(results).toEqual([]);
    });

    it('returns empty array for single character query', () => {
      const results = search('a');
      expect(results).toEqual([]);
    });

    it('finds results for "encryption"', () => {
      const results = search('encryption');
      expect(results.length).toBeGreaterThan(0);
      // Check that at least one result contains "encryption" in title, description, or tags
      const hasEncryption = results.some(
        (r) =>
          r.item.title.toLowerCase().includes('encryption') ||
          r.item.description.toLowerCase().includes('encryption') ||
          r.item.tags.some((tag) => tag.includes('encryption'))
      );
      expect(hasEncryption).toBe(true);
    });

    it('finds results for "quantum"', () => {
      const results = search('quantum');
      expect(results.length).toBeGreaterThan(0);
      const titles = results.map((r) => r.item.title.toLowerCase());
      expect(titles.some((t) => t.includes('quantum'))).toBe(true);
    });

    it('finds results for "privacy"', () => {
      const results = search('privacy');
      expect(results.length).toBeGreaterThan(0);
    });

    it('handles typos with fuzzy matching', () => {
      const results = search('encrypshun'); // Typo
      expect(results.length).toBeGreaterThan(0);
    });

    it('limits results when limit option is provided', () => {
      const results = search('transfer', { limit: 3 });
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('filters by type', () => {
      const results = search('help', { type: 'help' });
      expect(results.every((r) => r.item.type === 'help')).toBe(true);
    });

    it('filters by category', () => {
      const results = search('security', { category: 'Security' });
      expect(results.every((r) => r.item.category === 'Security')).toBe(true);
    });

    it('returns results with scores', () => {
      const results = search('encryption');
      expect(results.length).toBeGreaterThan(0);
      expect(typeof results[0]!.score).toBe('number');
      expect(results[0]!.score).toBeGreaterThanOrEqual(0);
    });

    it('returns results sorted by relevance', () => {
      const results = search('quantum');
      if (results.length > 1) {
        // Scores should be in ascending order (lower score = better match)
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i]!.score).toBeLessThanOrEqual(results[i + 1]!.score);
        }
      }
    });
  });

  describe('getSearchSuggestions()', () => {
    it('returns empty array for empty query', () => {
      const suggestions = getSearchSuggestions('');
      expect(suggestions).toEqual([]);
    });

    it('returns suggestions for "enc"', () => {
      const suggestions = getSearchSuggestions('enc');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('returns unique suggestions', () => {
      const suggestions = getSearchSuggestions('transfer');
      const uniqueSuggestions = new Set(suggestions);
      expect(suggestions.length).toBe(uniqueSuggestions.size);
    });

    it('respects limit parameter', () => {
      const suggestions = getSearchSuggestions('security', 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Recent Searches', () => {
    it('saves recent search', () => {
      saveRecentSearch('encryption');
      const recent = getRecentSearches();
      expect(recent).toContain('encryption');
    });

    it('returns empty array initially', () => {
      const recent = getRecentSearches();
      expect(recent).toEqual([]);
    });

    it('adds new search to beginning of list', () => {
      saveRecentSearch('first');
      saveRecentSearch('second');
      const recent = getRecentSearches();
      expect(recent[0]).toBe('second');
      expect(recent[1]).toBe('first');
    });

    it('removes duplicate and adds to beginning', () => {
      saveRecentSearch('test');
      saveRecentSearch('other');
      saveRecentSearch('test'); // Duplicate
      const recent = getRecentSearches();
      expect(recent[0]).toBe('test');
      expect(recent.filter((q) => q === 'test')).toHaveLength(1);
    });

    it('limits to maximum 10 searches', () => {
      for (let i = 0; i < 15; i++) {
        saveRecentSearch(`search${i}`);
      }
      const recent = getRecentSearches();
      expect(recent.length).toBeLessThanOrEqual(10);
    });

    it('clears all recent searches', () => {
      saveRecentSearch('test1');
      saveRecentSearch('test2');
      clearRecentSearches();
      const recent = getRecentSearches();
      expect(recent).toEqual([]);
    });

    it('removes specific recent search', () => {
      saveRecentSearch('test1');
      saveRecentSearch('test2');
      saveRecentSearch('test3');
      removeRecentSearch('test2');
      const recent = getRecentSearches();
      expect(recent).not.toContain('test2');
      expect(recent).toContain('test1');
      expect(recent).toContain('test3');
    });

    it('ignores empty queries', () => {
      saveRecentSearch('');
      const recent = getRecentSearches();
      expect(recent).toEqual([]);
    });

    it('ignores single character queries', () => {
      saveRecentSearch('a');
      const recent = getRecentSearches();
      expect(recent).toEqual([]);
    });
  });

  describe('searchWithAutocomplete()', () => {
    it('returns autocomplete object', () => {
      const result = searchWithAutocomplete('encryption');
      expect(result).toHaveProperty('query');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('recentSearches');
    });

    it('includes query in result', () => {
      const result = searchWithAutocomplete('test');
      expect(result.query).toBe('test');
    });

    it('includes search results', () => {
      const result = searchWithAutocomplete('encryption');
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('includes suggestions', () => {
      const result = searchWithAutocomplete('security');
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('includes recent searches', () => {
      saveRecentSearch('previous search');
      const result = searchWithAutocomplete('new search');
      expect(Array.isArray(result.recentSearches)).toBe(true);
      expect(result.recentSearches).toContain('previous search');
    });
  });

  describe('highlightMatch()', () => {
    it('highlights single match', () => {
      const text = 'Hello World';
      const indices: [number, number][] = [[0, 4]]; // "Hello"
      const result = highlightMatch(text, indices);

      expect(result[0]).toEqual({ text: 'Hello', isHighlight: true });
      expect(result[1]).toEqual({ text: ' World', isHighlight: false });
    });

    it('highlights multiple matches', () => {
      const text = 'foo bar baz';
      const indices: [number, number][] = [
        [0, 2], // "foo"
        [8, 10], // "baz"
      ];
      const result = highlightMatch(text, indices);

      expect(result.length).toBeGreaterThanOrEqual(3); // "foo", " bar ", "baz"
      expect(result[0]!.isHighlight).toBe(true); // "foo"
      expect(result[1]!.isHighlight).toBe(false); // " bar "
      expect(result[2]!.isHighlight).toBe(true); // "baz"
    });

    it('handles empty indices', () => {
      const text = 'No highlights';
      const indices: [number, number][] = [];
      const result = highlightMatch(text, indices);

      expect(result.length).toBe(1);
      expect(result[0]!).toEqual({ text: 'No highlights', isHighlight: false });
    });

    it('handles consecutive matches', () => {
      const text = 'abcdef';
      const indices: [number, number][] = [
        [0, 1], // "ab"
        [2, 3], // "cd"
      ];
      const result = highlightMatch(text, indices);

      expect(result[0]!.isHighlight).toBe(true); // "ab"
      expect(result[1]!.isHighlight).toBe(true); // "cd"
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters in query', () => {
      const results = search('p2p'); // Contains number
      expect(results.length).toBeGreaterThan(0);
    });

    it('handles case-insensitive search', () => {
      const results1 = search('ENCRYPTION');
      const results2 = search('encryption');
      expect(results1.length).toBe(results2.length);
    });

    it('handles queries with spaces', () => {
      const results = search('quantum resistant');
      expect(results.length).toBeGreaterThan(0);
    });

    it('handles very long queries', () => {
      const longQuery = 'a'.repeat(100);
      const results = search(longQuery);
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
