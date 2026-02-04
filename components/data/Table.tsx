'use client';

import { forwardRef, HTMLAttributes, ReactNode, useState, useMemo } from 'react';
import styles from './Table.module.css';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  columns: TableColumn<T>[];
  data: T[];
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  rowKey?: keyof T | ((row: T) => string);
  stickyHeader?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

export const Table = forwardRef<HTMLDivElement, TableProps>(
  (
    {
      columns,
      data,
      selectable = false,
      selectedRows = [],
      onSelectionChange,
      loading = false,
      emptyMessage = 'No data available',
      rowKey = 'id',
      stickyHeader = false,
      onSort,
      className = '',
      ...props
    },
    ref
  ) => {
    const [sortConfig, setSortConfig] = useState<{
      key: string;
      direction: 'asc' | 'desc';
    } | null>(null);

    const getRowId = (row: any): string => {
      if (typeof rowKey === 'function') {
        return rowKey(row);
      }
      return String(row[rowKey]);
    };

    const handleSort = (key: string) => {
      const column = columns.find((col) => col.key === key);
      if (!column?.sortable) return;

      const direction =
        sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';

      setSortConfig({ key, direction });
      onSort?.(key, direction);
    };

    const sortedData = useMemo(() => {
      if (!sortConfig) return data;

      return [...data].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal === bVal) return 0;

        const comparison = aVal > bVal ? 1 : -1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }, [data, sortConfig]);

    const handleSelectAll = () => {
      if (selectedRows.length === data.length) {
        onSelectionChange?.([]);
      } else {
        onSelectionChange?.(data.map((row) => getRowId(row)));
      }
    };

    const handleSelectRow = (rowId: string) => {
      const newSelection = selectedRows.includes(rowId)
        ? selectedRows.filter((id) => id !== rowId)
        : [...selectedRows, rowId];
      onSelectionChange?.(newSelection);
    };

    const allSelected = data.length > 0 && selectedRows.length === data.length;
    const someSelected = selectedRows.length > 0 && !allSelected;

    return (
      <div
        ref={ref}
        className={`${styles.tableContainer} ${className}`}
        {...props}
      >
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={stickyHeader ? styles.stickyHeader : ''}>
              <tr>
                {selectable && (
                  <th className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = someSelected;
                        }
                      }}
                      onChange={handleSelectAll}
                      aria-label="Select all rows"
                      className={styles.checkbox}
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    style={{ width: column.width, textAlign: column.align }}
                    className={column.sortable ? styles.sortable : ''}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className={styles.headerContent}>
                      <span>{column.header}</span>
                      {column.sortable && (
                        <span className={styles.sortIcon}>
                          {sortConfig?.key === column.key ? (
                            sortConfig.direction === 'asc' ? '↑' : '↓'
                          ) : (
                            '↕'
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className={styles.loadingCell}
                  >
                    <div className={styles.loadingContent}>
                      <div className={styles.spinner} />
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className={styles.emptyCell}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                sortedData.map((row) => {
                  const rowId = getRowId(row);
                  const isSelected = selectedRows.includes(rowId);

                  return (
                    <tr
                      key={rowId}
                      className={isSelected ? styles.selectedRow : ''}
                    >
                      {selectable && (
                        <td className={styles.checkboxCell}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(rowId)}
                            aria-label={`Select row ${rowId}`}
                            className={styles.checkbox}
                          />
                        </td>
                      )}
                      {columns.map((column) => {
                        const value = row[column.key];
                        return (
                          <td
                            key={column.key}
                            style={{ textAlign: column.align }}
                          >
                            {column.render ? column.render(value, row) : value}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

Table.displayName = 'Table';
