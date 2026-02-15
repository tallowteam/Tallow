// ============================================================================
// Table Tactician -- Virtualization tokens and generic table types
// ============================================================================

// ---------------------------------------------------------------------------
// Virtualization policy constants (verified by scripts/verify-table-tactician.js)
// ---------------------------------------------------------------------------

export const TABLE_VIRTUALIZATION_THRESHOLD = 100 as const;
export const TRANSFER_HISTORY_ROW_HEIGHT_PX = 84 as const;
export const TRANSFER_HISTORY_VIEWPORT_HEIGHT_PX = 504 as const;
export const TRANSFER_HISTORY_OVERSCAN_ROWS = 6 as const;

/** Default row height for generic VirtualTable */
export const DEFAULT_ROW_HEIGHT_PX = 48 as const;

/** Default overscan count -- rows rendered above/below viewport */
export const DEFAULT_OVERSCAN = 5 as const;

/** Minimum column width during resize (px) */
export const MIN_COLUMN_WIDTH_PX = 60 as const;

export function shouldVirtualizeTransferList(totalItems: number): boolean {
  return totalItems > TABLE_VIRTUALIZATION_THRESHOLD;
}

// ---------------------------------------------------------------------------
// Generic column & sort types
// ---------------------------------------------------------------------------

export type SortDirection = 'asc' | 'desc' | 'none';

export interface SortState<K extends string = string> {
  column: K | null;
  direction: SortDirection;
}

/**
 * Column definition for VirtualTable<T>.
 *
 * @typeParam T - The row data type
 * @typeParam K - The column key (usually `keyof T & string`)
 */
export interface ColumnDef<T, K extends string = string> {
  /** Unique column key used for sorting, identification */
  key: K;
  /** Header label shown in <th> */
  header: string;
  /** Render the cell content for a given row */
  cell: (row: T, rowIndex: number) => React.ReactNode;
  /** Optional fixed width in px -- will be used as initial/min width */
  width?: number;
  /** Whether this column is sortable. Default true. */
  sortable?: boolean;
  /** Custom sort comparator. If omitted, defaults to string comparison on cell text. */
  compare?: (a: T, b: T) => number;
  /** Whether this column is visible. Default true. */
  visible?: boolean;
  /** aria-sort label override */
  ariaSortLabel?: string;
}

// ---------------------------------------------------------------------------
// Virtualization math helpers
// ---------------------------------------------------------------------------

export interface VirtualRange {
  /** First rendered row index (includes overscan) */
  startIndex: number;
  /** One-past-last rendered row index (includes overscan) */
  endIndex: number;
  /** Total content height in px */
  totalHeight: number;
  /** Offset (translateY) for the rendered slice container */
  offsetY: number;
}

/**
 * Compute which rows are visible (plus overscan buffer) given current scroll position.
 */
export function computeVirtualRange(
  scrollTop: number,
  viewportHeight: number,
  totalItems: number,
  rowHeight: number,
  overscan: number,
): VirtualRange {
  const totalHeight = totalItems * rowHeight;
  const firstVisible = Math.floor(scrollTop / rowHeight);
  const visibleCount = Math.ceil(viewportHeight / rowHeight);

  const startIndex = Math.max(0, firstVisible - overscan);
  const endIndex = Math.min(totalItems, firstVisible + visibleCount + overscan);
  const offsetY = startIndex * rowHeight;

  return { startIndex, endIndex, totalHeight, offsetY };
}

// ---------------------------------------------------------------------------
// Filter helper
// ---------------------------------------------------------------------------

/**
 * Generic in-memory text filter. Searches every column's cell text output
 * (via `String()`) against the query. Case-insensitive.
 */
export function filterRows<T>(
  rows: ReadonlyArray<T>,
  query: string,
  getText: (row: T) => string,
): T[] {
  if (!query.trim()) return rows as T[];
  const lower = query.toLowerCase();
  return rows.filter((row) => getText(row).toLowerCase().includes(lower));
}

// ---------------------------------------------------------------------------
// Sort helper
// ---------------------------------------------------------------------------

export function sortRows<T, K extends string>(
  rows: ReadonlyArray<T>,
  sort: SortState<K>,
  columns: ReadonlyArray<ColumnDef<T, K>>,
): T[] {
  if (!sort.column || sort.direction === 'none') return rows as T[];

  const col = columns.find((c) => c.key === sort.column);
  if (!col) return rows as T[];

  const dir = sort.direction === 'asc' ? 1 : -1;

  const sorted = [...rows];
  if (col.compare) {
    sorted.sort((a, b) => col.compare!(a, b) * dir);
  } else {
    // Fallback: render cell to string, compare lexicographically
    sorted.sort((a, b) => {
      const aText = String(col.cell(a, 0) ?? '');
      const bText = String(col.cell(b, 0) ?? '');
      return aText.localeCompare(bText) * dir;
    });
  }

  return sorted;
}
