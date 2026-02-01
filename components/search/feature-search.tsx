'use client';

/**
 * Feature Search Component
 * Cmd+K style search dialog for features, help, and pages
 */

import { useEffect, useState, useCallback, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import {
  search,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  removeRecentSearch,
  type SearchResult,
} from '@/lib/search/search-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * SearchResultItem - Memoized for React 18 performance optimization
 * Prevents unnecessary re-renders when parent list updates
 */
interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onSelect: (result: SearchResult) => void;
}

const SearchResultItem = memo(function SearchResultItem({
  result,
  isSelected,
  onSelect,
}: SearchResultItemProps) {
  return (
    <button
      onClick={() => onSelect(result)}
      className={`w-full flex items-start gap-3 px-3 py-3 rounded-md text-left transition-colors ${
        isSelected ? 'bg-primary/10' : 'hover:bg-muted'
      }`}
    >
      {/* Type Badge */}
      <div className="flex-shrink-0">
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-xs font-medium ${
            result.item.type === 'feature'
              ? 'bg-white/10 text-white dark:bg-white/20 dark:text-white/80'
              : result.item.type === 'help'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : result.item.type === 'setting'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          {result.item.type[0]?.toUpperCase() ?? '?'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{result.item.title}</div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {result.item.description}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {result.item.category}
          </span>
          {result.score < 0.3 && (
            <span className="text-xs font-medium text-primary">Exact match</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 text-muted-foreground">
        <ArrowRight className="h-4 w-4" />
      </div>
    </button>
  );
});

SearchResultItem.displayName = 'SearchResultItem';

export interface FeatureSearchProps {
  /** Force open state (controlled) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Show trigger button (default: true) */
  showTrigger?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum results to show */
  maxResults?: number;
}

export function FeatureSearch({
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
  placeholder = 'Search features, help, settings...',
  maxResults = 8,
}: FeatureSearchProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use controlled open if provided
  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = onOpenChange || setIsOpen;

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Perform search
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      // Simulate async search (in real app, this could be debounced)
      setTimeout(() => {
        const searchResults = search(searchQuery, { limit: maxResults });
        setResults(searchResults);
        setSelectedIndex(0);
        setIsSearching(false);
      }, 100);
    },
    [maxResults]
  );

  // Handle query change
  const handleQueryChange = (value: string) => {
    setQuery(value);
    performSearch(value);
  };

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    saveRecentSearch(result.item.title);
    setRecentSearches(getRecentSearches());
    setOpen(false);
    setQuery('');
    setResults([]);
    router.push(result.item.url);
  };

  // Handle recent search click
  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    performSearch(recentQuery);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const resultsToShow = query ? results : [];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < resultsToShow.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && resultsToShow.length > 0) {
      e.preventDefault();
      const selectedResult = resultsToShow[selectedIndex];
      if (selectedResult) {
        handleSelectResult(selectedResult);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Clear all recent searches
  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  // Remove single recent search
  const handleRemoveRecent = (recentQuery: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentSearch(recentQuery);
    setRecentSearches(getRecentSearches());
  };

  const showRecent = !query && recentSearches.length > 0;
  const showResults = query && results.length > 0;
  const showNoResults = query && results.length === 0 && !isSearching;

  return (
    <>
      {/* Trigger Button */}
      {showTrigger && (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="relative gap-2"
          aria-label="Search (Cmd+K)"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:inline-flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      )}

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="sr-only">Search</DialogTitle>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full bg-transparent pl-10 pr-10 py-3 text-base outline-none"
                aria-label="Search"
                autoComplete="off"
                spellCheck="false"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </DialogHeader>

          {/* Results Container */}
          <div className="max-h-[400px] overflow-y-auto px-2 pb-2">
            {/* Loading State */}
            {isSearching && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Searching...
              </div>
            )}

            {/* Recent Searches */}
            {showRecent && (
              <div className="p-2">
                <div className="flex items-center justify-between mb-2 px-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Recent Searches
                  </div>
                  <button
                    onClick={handleClearRecent}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((recentQuery, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(recentQuery)}
                      className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md hover:bg-muted text-left group"
                    >
                      <span className="flex-1 truncate text-sm">
                        {recentQuery}
                      </span>
                      <button
                        onClick={(e) => handleRemoveRecent(recentQuery, e)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {showResults && (
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2 px-2 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Results ({results.length})
                </div>
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <SearchResultItem
                      key={result.item.id}
                      result={result}
                      isSelected={index === selectedIndex}
                      onSelect={handleSelectResult}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {showNoResults && (
              <EmptyState
                icon={Search}
                title="No results found"
                description={`We couldn't find anything matching "${query}". Try a different search term.`}
                actionLabel="Clear Search"
                onAction={() => {
                  setQuery('');
                  setResults([]);
                  inputRef.current?.focus();
                }}
                variant="muted"
                size="sm"
              />
            )}

            {/* Empty State */}
            {!query && recentSearches.length === 0 && (
              <EmptyState
                icon={Sparkles}
                title="Start searching"
                description='Try "encryption", "privacy", or "settings"'
                variant="primary"
                size="sm"
                animated={false}
              />
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <kbd className="px-2 py-1 rounded border bg-muted">↑↓</kbd>
              <span>Navigate</span>
              <kbd className="px-2 py-1 rounded border bg-muted">Enter</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded border bg-muted">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
