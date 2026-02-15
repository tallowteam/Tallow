'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  ColumnDef,
  SortDirection,
  SortState,
} from '@/lib/ui/table-tactician';
import {
  DEFAULT_OVERSCAN,
  DEFAULT_ROW_HEIGHT_PX,
  MIN_COLUMN_WIDTH_PX,
  computeVirtualRange,
  filterRows,
  sortRows,
} from '@/lib/ui/table-tactician';
import styles from './VirtualTable.module.css';

// ---------------------------------------------------------------------------
// Public prop types
// ---------------------------------------------------------------------------

export interface VirtualTableProps<T, K extends string = string> {
  /** Row data array */
  data: ReadonlyArray<T>;
  /** Column definitions */
  columns: ReadonlyArray<ColumnDef<T, K>>;
  /** Fixed row height in pixels. Default 48. */
  rowHeight?: number;
  /** Rows rendered above/below the viewport. Default 5. */
  overscan?: number;
  /** Maximum viewport height in px. Defaults to 600. */
  maxHeight?: number;
  /** Unique key extractor per row */
  getRowId: (row: T) => string;
  /** Text extractor for filtering (combines all searchable text per row) */
  getSearchText?: (row: T) => string;

  // -- Callbacks -----------------------------------------------------------
  /** Called when sort state changes */
  onSort?: (sort: SortState<K>) => void;
  /** Called when filter query changes */
  onFilter?: (query: string) => void;
  /** Called when selection changes. Receives the set of selected row IDs. */
  onSelect?: (selectedIds: ReadonlySet<string>) => void;

  // -- Feature toggles -----------------------------------------------------
  /** Show the filter/search toolbar. Default true if data.length > 10. */
  showFilter?: boolean;
  /** Enable row selection checkboxes. Default false. */
  selectable?: boolean;
  /** Enable column resizing. Default false. */
  resizable?: boolean;
  /** Show the bottom status bar. Default true. */
  showStatusBar?: boolean;

  // -- Controlled sort (optional) ------------------------------------------
  /** Controlled sort state. If provided, component becomes controlled. */
  sort?: SortState<K>;

  // -- Accessibility -------------------------------------------------------
  /** Accessible label for the grid */
  ariaLabel?: string;

  // -- Empty state ---------------------------------------------------------
  /** Content to show when there are no rows */
  emptyContent?: React.ReactNode;

  // -- Class name overrides ------------------------------------------------
  className?: string;
}

// ---------------------------------------------------------------------------
// Helper: next sort direction cycle
// ---------------------------------------------------------------------------

function nextSortDirection(current: SortDirection): SortDirection {
  if (current === 'none') return 'asc';
  if (current === 'asc') return 'desc';
  return 'none';
}

// ---------------------------------------------------------------------------
// Helper: aria-sort mapping
// ---------------------------------------------------------------------------

function toAriaSortValue(
  dir: SortDirection,
): 'ascending' | 'descending' | 'none' {
  if (dir === 'asc') return 'ascending';
  if (dir === 'desc') return 'descending';
  return 'none';
}

// ---------------------------------------------------------------------------
// SortArrow sub-component
// ---------------------------------------------------------------------------

function SortArrow({ direction }: { direction: SortDirection }) {
  const isActive = direction !== 'none';
  const isDesc = direction === 'desc';
  return (
    <span
      className={`${styles.sortIndicator} ${isActive ? styles.sortIndicatorActive : ''} ${isDesc ? styles.sortIndicatorDesc : ''}`}
      aria-hidden="true"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 2L8 7H2L5 2Z" fill="currentColor" />
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// VirtualTable component
// ---------------------------------------------------------------------------

function VirtualTableInner<T, K extends string = string>(
  props: VirtualTableProps<T, K>,
) {
  const {
    data,
    columns,
    rowHeight = DEFAULT_ROW_HEIGHT_PX,
    overscan = DEFAULT_OVERSCAN,
    maxHeight = 600,
    getRowId,
    getSearchText,
    onSort,
    onFilter,
    onSelect,
    showFilter,
    selectable = false,
    resizable = false,
    showStatusBar = true,
    sort: controlledSort,
    ariaLabel = 'Data table',
    emptyContent,
    className,
  } = props;

  // -- State ---------------------------------------------------------------
  const [internalSort, setInternalSort] = useState<SortState<K>>({
    column: null,
    direction: 'none',
  });
  const sort = controlledSort ?? internalSort;

  const [filterQuery, setFilterQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(maxHeight);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);

  // -- Refs ----------------------------------------------------------------
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingScrollRef = useRef(0);
  const resizingRef = useRef<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  // -- Visible columns -----------------------------------------------------
  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible !== false),
    [columns],
  );

  // -- Filter --------------------------------------------------------------
  const shouldShowFilter =
    showFilter ?? data.length > 10;

  const defaultGetSearchText = useCallback(
    (row: T): string => {
      return visibleColumns
        .map((col) => {
          const val = col.cell(row, 0);
          return typeof val === 'string' || typeof val === 'number'
            ? String(val)
            : '';
        })
        .join(' ');
    },
    [visibleColumns],
  );

  const searchTextFn = getSearchText ?? defaultGetSearchText;

  const filteredData = useMemo(
    () => filterRows(data, filterQuery, searchTextFn),
    [data, filterQuery, searchTextFn],
  );

  // -- Sort ----------------------------------------------------------------
  const processedData = useMemo(
    () => sortRows(filteredData, sort, visibleColumns as ColumnDef<T, K>[]),
    [filteredData, sort, visibleColumns],
  );

  // -- Virtual range -------------------------------------------------------
  const virtualRange = useMemo(
    () =>
      computeVirtualRange(
        scrollTop,
        viewportHeight,
        processedData.length,
        rowHeight,
        overscan,
      ),
    [scrollTop, viewportHeight, processedData.length, rowHeight, overscan],
  );

  const visibleRows = useMemo(
    () => processedData.slice(virtualRange.startIndex, virtualRange.endIndex),
    [processedData, virtualRange.startIndex, virtualRange.endIndex],
  );

  // -- Scroll handler with rAF batching -----------------------------------
  const flushScroll = useCallback(() => {
    setScrollTop(pendingScrollRef.current);
    rafRef.current = null;
  }, []);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      pendingScrollRef.current = e.currentTarget.scrollTop;
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(flushScroll);
      }
    },
    [flushScroll],
  );

  // -- ResizeObserver for dynamic viewport height -------------------------
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          setViewportHeight(height);
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // -- Cleanup rAF on unmount --------------------------------------------
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // -- Sort toggling -------------------------------------------------------
  const handleSortClick = useCallback(
    (colKey: K) => {
      const currentDir =
        sort.column === colKey ? sort.direction : 'none';
      const newDir = nextSortDirection(currentDir);
      const newSort: SortState<K> = {
        column: newDir === 'none' ? null : colKey,
        direction: newDir,
      };
      if (!controlledSort) {
        setInternalSort(newSort);
      }
      onSort?.(newSort);
    },
    [sort, controlledSort, onSort],
  );

  // -- Selection -----------------------------------------------------------
  const handleSelectRow = useCallback(
    (id: string, checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (checked) next.add(id);
        else next.delete(id);
        onSelect?.(next);
        return next;
      });
    },
    [onSelect],
  );

  const handleSelectAll = useCallback(() => {
    const allIds = processedData.map(getRowId);
    const allSelected =
      allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds(new Set());
      onSelect?.(new Set());
    } else {
      const next = new Set(allIds);
      setSelectedIds(next);
      onSelect?.(next);
    }
  }, [processedData, getRowId, selectedIds, onSelect]);

  const allSelected =
    processedData.length > 0 &&
    processedData.every((row) => selectedIds.has(getRowId(row)));
  const someSelected =
    !allSelected &&
    processedData.some((row) => selectedIds.has(getRowId(row)));

  // -- Column resizing -----------------------------------------------------
  const getColumnWidth = useCallback(
    (col: ColumnDef<T, K>): number => {
      return columnWidths[col.key] ?? col.width ?? 150;
    },
    [columnWidths],
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, colKey: string) => {
      e.preventDefault();
      e.stopPropagation();
      const currentWidth =
        columnWidths[colKey] ??
        columns.find((c) => c.key === colKey)?.width ??
        150;
      resizingRef.current = {
        key: colKey,
        startX: e.clientX,
        startWidth: currentWidth,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizingRef.current) return;
        const delta = moveEvent.clientX - resizingRef.current.startX;
        const newWidth = Math.max(
          MIN_COLUMN_WIDTH_PX,
          resizingRef.current.startWidth + delta,
        );
        setColumnWidths((prev) => ({
          ...prev,
          [resizingRef.current!.key]: newWidth,
        }));
      };

      const handleMouseUp = () => {
        resizingRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [columnWidths, columns],
  );

  // -- Filter handler ------------------------------------------------------
  const handleFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setFilterQuery(q);
      onFilter?.(q);
      // Reset scroll to top on new filter
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      setScrollTop(0);
    },
    [onFilter],
  );

  // -- Keyboard navigation -------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const total = processedData.length;
      if (total === 0) return;

      let newIndex = focusedRowIndex;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.min(total - 1, focusedRowIndex + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.max(0, focusedRowIndex - 1);
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = total - 1;
          break;
        case 'PageDown':
          e.preventDefault();
          newIndex = Math.min(
            total - 1,
            focusedRowIndex + Math.floor(viewportHeight / rowHeight),
          );
          break;
        case 'PageUp':
          e.preventDefault();
          newIndex = Math.max(
            0,
            focusedRowIndex - Math.floor(viewportHeight / rowHeight),
          );
          break;
        case ' ':
          if (selectable && focusedRowIndex >= 0) {
            e.preventDefault();
            const row = processedData[focusedRowIndex];
            if (row) {
              const id = getRowId(row);
              handleSelectRow(id, !selectedIds.has(id));
            }
          }
          return;
        default:
          return;
      }

      if (newIndex !== focusedRowIndex) {
        setFocusedRowIndex(newIndex);
        // Scroll to keep focused row visible
        if (scrollRef.current) {
          const rowTop = newIndex * rowHeight;
          const rowBottom = rowTop + rowHeight;
          const currentTop = scrollRef.current.scrollTop;
          const currentBottom = currentTop + viewportHeight;

          if (rowTop < currentTop) {
            scrollRef.current.scrollTop = rowTop;
          } else if (rowBottom > currentBottom) {
            scrollRef.current.scrollTop = rowBottom - viewportHeight;
          }
        }
      }
    },
    [
      focusedRowIndex,
      processedData,
      viewportHeight,
      rowHeight,
      selectable,
      getRowId,
      handleSelectRow,
      selectedIds,
    ],
  );

  // -- Compute total table width -------------------------------------------
  const checkboxWidth = selectable ? 44 : 0;
  const totalTableWidth = useMemo(() => {
    return (
      checkboxWidth +
      visibleColumns.reduce(
        (sum, col) => sum + getColumnWidth(col),
        0,
      )
    );
  }, [checkboxWidth, visibleColumns, getColumnWidth]);

  // -- Render ==============================================================

  if (processedData.length === 0 && emptyContent) {
    return (
      <div
        className={`${styles.tableWrapper} ${className ?? ''}`}
        role="grid"
        aria-label={ariaLabel}
        aria-rowcount={0}
      >
        {shouldShowFilter && (
          <div className={styles.toolbar}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Filter..."
              value={filterQuery}
              onChange={handleFilterChange}
              aria-label="Filter table rows"
            />
          </div>
        )}
        <div className={styles.emptyState}>{emptyContent}</div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.tableWrapper} ${className ?? ''}`}
      role="grid"
      aria-label={ariaLabel}
      aria-rowcount={processedData.length}
      aria-colcount={visibleColumns.length + (selectable ? 1 : 0)}
      onKeyDown={handleKeyDown}
    >
      {/* Toolbar */}
      {shouldShowFilter && (
        <div className={styles.toolbar} role="toolbar" aria-label="Table controls">
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Filter..."
            value={filterQuery}
            onChange={handleFilterChange}
            aria-label="Filter table rows"
          />
          {selectable && selectedIds.size > 0 && (
            <span className={styles.selectionInfo}>
              {selectedIds.size} selected
            </span>
          )}
        </div>
      )}

      {/* Scroll viewport */}
      <div
        ref={scrollRef}
        className={styles.scrollViewport}
        style={{ maxHeight: `${maxHeight}px` }}
        onScroll={handleScroll}
        tabIndex={0}
        role="presentation"
      >
        {/* Sticky header */}
        <div className={styles.thead} role="rowgroup" style={{ minWidth: `${totalTableWidth}px` }}>
          <div className={styles.headerRow} role="row" aria-rowindex={1}>
            {/* Select-all checkbox */}
            {selectable && (
              <div
                className={`${styles.headerCell} ${styles.checkboxCell}`}
                role="columnheader"
              >
                <input
                  type="checkbox"
                  className={`${styles.checkbox} ${someSelected ? styles.checkboxIndeterminate : ''}`}
                  checked={allSelected}
                  onChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </div>
            )}

            {/* Column headers */}
            {visibleColumns.map((col) => {
              const isSortable = col.sortable !== false;
              const colSort: SortDirection =
                sort.column === col.key ? sort.direction : 'none';

              return (
                <div
                  key={col.key}
                  className={`${styles.headerCell} ${isSortable ? styles.headerCellSortable : ''}`}
                  role="columnheader"
                  aria-sort={isSortable ? toAriaSortValue(colSort) : undefined}
                  style={{ width: `${getColumnWidth(col)}px` }}
                  onClick={
                    isSortable
                      ? () => handleSortClick(col.key)
                      : undefined
                  }
                  onKeyDown={
                    isSortable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSortClick(col.key);
                          }
                        }
                      : undefined
                  }
                  tabIndex={isSortable ? 0 : undefined}
                >
                  <span>{col.header}</span>
                  {isSortable && <SortArrow direction={colSort} />}
                  {resizable && (
                    <button
                      className={styles.resizeHandle}
                      onMouseDown={(e) => handleResizeStart(e, col.key)}
                      aria-label={`Resize ${col.header} column`}
                      tabIndex={-1}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Virtual spacer */}
        <div
          className={styles.scrollSpacer}
          style={{
            height: `${virtualRange.totalHeight}px`,
            minWidth: `${totalTableWidth}px`,
          }}
        >
          {/* Positioned slice of visible rows */}
          <div
            className={styles.virtualBody}
            role="rowgroup"
            style={{
              transform: `translateY(${virtualRange.offsetY}px)`,
            }}
          >
            {visibleRows.map((row, localIndex) => {
              const globalIndex =
                virtualRange.startIndex + localIndex;
              const rowId = getRowId(row);
              const isSelected = selectedIds.has(rowId);
              const isFocused = globalIndex === focusedRowIndex;

              return (
                <div
                  key={rowId}
                  className={`${styles.row} ${isSelected ? styles.rowSelected : ''} ${isFocused ? styles.rowFocused : ''}`}
                  role="row"
                  aria-rowindex={globalIndex + 2} /* +2: 1 for header, 1-based */
                  aria-selected={selectable ? isSelected : undefined}
                  style={{ height: `${rowHeight}px` }}
                  onClick={() => setFocusedRowIndex(globalIndex)}
                >
                  {/* Row checkbox */}
                  {selectable && (
                    <div
                      className={`${styles.cell} ${styles.checkboxCell}`}
                      role="gridcell"
                    >
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={isSelected}
                        onChange={(e) =>
                          handleSelectRow(rowId, e.target.checked)
                        }
                        aria-label={`Select row ${globalIndex + 1}`}
                        tabIndex={-1}
                      />
                    </div>
                  )}

                  {/* Data cells */}
                  {visibleColumns.map((col) => (
                    <div
                      key={col.key}
                      className={styles.cell}
                      role="gridcell"
                      style={{ width: `${getColumnWidth(col)}px` }}
                      data-label={col.header}
                    >
                      {col.cell(row, globalIndex)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status bar */}
      {showStatusBar && (
        <div className={styles.statusBar} role="status" aria-live="polite">
          <span>
            {processedData.length} row{processedData.length !== 1 ? 's' : ''}
            {filterQuery && ` (filtered from ${data.length})`}
          </span>
          {sort.column && sort.direction !== 'none' && (
            <span>
              Sorted by{' '}
              {visibleColumns.find((c) => c.key === sort.column)?.header ??
                sort.column}{' '}
              ({sort.direction === 'asc' ? 'ascending' : 'descending'})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * VirtualTable<T> -- A generic, virtualized, sortable, filterable, selectable
 * data table component.
 *
 * Features:
 * - Virtual scrolling: only renders visible rows + overscan buffer (O(visible))
 * - Handles 10,000+ rows without lag
 * - Sortable columns (click header to toggle asc/desc/none)
 * - Filterable (search input filters rows by text content)
 * - Selectable rows (checkbox column for batch operations)
 * - Column resizing (drag header border)
 * - ResizeObserver-based dynamic viewport sizing
 * - Keyboard navigation (arrows, Home, End, PageUp, PageDown, Space to select)
 * - Accessible: role="grid", aria-sort, aria-rowcount, aria-selected
 * - Responsive: table layout on desktop, card layout on mobile
 */
export const VirtualTable = React.memo(VirtualTableInner) as typeof VirtualTableInner;
