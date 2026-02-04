'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  keywords?: string[];
  shortcut?: string[];
  group?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  items: CommandItem[];
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
  recentCommands?: string[];
  onRecentUpdate?: (commandId: string) => void;
  className?: string;
}

/**
 * CommandPalette - Command palette component with fuzzy search
 *
 * Features:
 * - Search input with fuzzy matching
 * - Command groups
 * - Keyboard shortcuts display
 * - Recent commands
 * - Keyboard navigation
 * - Portal rendering
 * - ARIA compliant
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * useEffect(() => {
 *   const handler = (e: KeyboardEvent) => {
 *     if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
 *       e.preventDefault();
 *       setIsOpen(true);
 *     }
 *   };
 *   window.addEventListener('keydown', handler);
 *   return () => window.removeEventListener('keydown', handler);
 * }, []);
 *
 * <CommandPalette
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   items={commands}
 * />
 * ```
 */
export function CommandPalette({
  items,
  isOpen,
  onClose,
  placeholder = 'Type a command or search...',
  recentCommands = [],
  onRecentUpdate,
  className = '',
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fuzzy search implementation
  const fuzzyMatch = (text: string, query: string): boolean => {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    let queryIndex = 0;
    for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
      if (lowerText[i] === lowerQuery[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === lowerQuery.length;
  };

  // Filter and group commands
  const getFilteredItems = () => {
    let filtered = items;

    if (search) {
      filtered = items.filter(item => {
        const searchText = `${item.label} ${item.description || ''} ${item.keywords?.join(' ') || ''}`;
        return fuzzyMatch(searchText, search);
      });
    }

    // Group items
    const grouped = new Map<string, CommandItem[]>();

    // Add recent commands first if no search
    if (!search && recentCommands.length > 0) {
      const recent = items.filter(item => recentCommands.includes(item.id));
      if (recent.length > 0) {
        grouped.set('Recent', recent);
      }
    }

    // Group remaining items
    filtered.forEach(item => {
      const group = item.group || 'Commands';
      if (!grouped.has(group)) {
        grouped.set(group, []);
      }
      // Don't duplicate recent items
      if (search || !recentCommands.includes(item.id)) {
        grouped.get(group)!.push(item);
      }
    });

    return grouped;
  };

  const groupedItems = getFilteredItems();
  const allFilteredItems = Array.from(groupedItems.values()).flat();

  const handleSelect = (item: CommandItem) => {
    item.onSelect();
    onRecentUpdate?.(item.id);
    onClose();
    setSearch('');
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < allFilteredItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : allFilteredItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (allFilteredItems[selectedIndex]) {
          handleSelect(allFilteredItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        setSearch('');
        setSelectedIndex(0);
        break;
    }
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let itemIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Command Palette */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className={`
          fixed top-[20%] left-1/2 -translate-x-1/2 z-50
          w-full max-w-2xl max-h-[60vh]
          bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl
          overflow-hidden
          ${className}
        `}
        style={{
          animation: 'commandPaletteIn 200ms ease-out',
        }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <svg
            className="w-5 h-5 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none text-lg"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div
          ref={listRef}
          className="overflow-y-auto max-h-[calc(60vh-80px)] py-2"
          role="listbox"
        >
          {allFilteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-zinc-500">
              No commands found
            </div>
          ) : (
            Array.from(groupedItems.entries()).map(([group, groupItems]) => (
              <div key={group} className="mb-4 last:mb-0">
                <div className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {group}
                </div>
                {groupItems.map((item) => {
                  const currentIndex = itemIndex++;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      data-index={currentIndex}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3
                        transition-colors duration-150
                        ${
                          isSelected
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-300 hover:bg-zinc-800/50'
                        }
                      `}
                    >
                      {item.icon && (
                        <span className="flex-shrink-0 w-5 h-5" aria-hidden="true">
                          {item.icon}
                        </span>
                      )}

                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium truncate">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-zinc-500 truncate">
                            {item.description}
                          </div>
                        )}
                      </div>

                      {item.shortcut && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.shortcut.map((key, i) => (
                            <kbd
                              key={i}
                              className="px-2 py-1 text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 rounded"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded">↵</kbd>
              to select
            </span>
          </div>
          <span>{allFilteredItems.length} commands</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes commandPaletteIn {
          from {
            opacity: 0;
            transform: translate(-50%, -10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </>
  );
}
