'use client';

import { forwardRef, HTMLAttributes, ReactNode, useState } from 'react';
import styles from './DataList.module.css';

export interface DataListItem {
  key: string;
  label: string;
  value: ReactNode;
  copyable?: boolean;
  tooltip?: string;
}

export interface DataListProps extends HTMLAttributes<HTMLDivElement> {
  items: DataListItem[];
  variant?: 'vertical' | 'horizontal';
  compact?: boolean;
}

export const DataList = forwardRef<HTMLDivElement, DataListProps>(
  ({ items, variant = 'vertical', compact = false, className = '', ...props }, ref) => {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const handleCopy = async (value: string, key: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    };

    const truncateValue = (value: string, maxLength: number = 50): string => {
      if (value.length <= maxLength) return value;
      return `${value.substring(0, maxLength)}...`;
    };

    const renderValue = (item: DataListItem) => {
      const valueStr = String(item.value);
      const isTruncated = valueStr.length > 50;

      return (
        <div className={styles.valueWrapper}>
          <span
            className={styles.value}
            title={isTruncated || item.tooltip ? valueStr : undefined}
          >
            {isTruncated ? truncateValue(valueStr) : item.value}
          </span>
          {item.copyable && (
            <button
              onClick={() => handleCopy(valueStr, item.key)}
              className={styles.copyButton}
              aria-label={`Copy ${item.label}`}
              type="button"
            >
              {copiedKey === item.key ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          )}
        </div>
      );
    };

    const containerClasses = [
      styles.dataList,
      styles[variant],
      compact ? styles.compact : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={containerClasses} {...props}>
        {items.map((item) => (
          <div key={item.key} className={styles.item}>
            <dt className={styles.label}>{item.label}</dt>
            <dd className={styles.valueContainer}>{renderValue(item)}</dd>
          </div>
        ))}
      </div>
    );
  }
);

DataList.displayName = 'DataList';
