'use client';

import { forwardRef, HTMLAttributes, ReactNode, useState } from 'react';
import styles from './Timeline.module.css';

export interface TimelineItem {
  id: string;
  title: string;
  description?: ReactNode;
  timestamp?: string;
  icon?: ReactNode;
  iconColor?: string;
  expandable?: boolean;
  expanded?: boolean;
}

export interface TimelineProps extends HTMLAttributes<HTMLDivElement> {
  items: TimelineItem[];
  onToggle?: (id: string) => void;
}

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  ({ items, onToggle, className = '', ...props }, ref) => {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(
      new Set(items.filter((item) => item.expanded).map((item) => item.id))
    );

    const handleToggle = (id: string) => {
      setExpandedItems((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      onToggle?.(id);
    };

    return (
      <div ref={ref} className={`${styles.timeline} ${className}`} {...props}>
        {items.map((item, index) => {
          const isExpanded = expandedItems.has(item.id);
          const isLast = index === items.length - 1;

          return (
            <div key={item.id} className={styles.item}>
              <div className={styles.line}>
                <div
                  className={styles.iconWrapper}
                  style={{
                    backgroundColor: item.iconColor || 'var(--color-accent-primary)',
                  }}
                >
                  {item.icon || (
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
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  )}
                </div>
                {!isLast && <div className={styles.connector} />}
              </div>
              <div className={styles.content}>
                <div className={styles.header}>
                  <div className={styles.titleWrapper}>
                    <h3 className={styles.title}>{item.title}</h3>
                    {item.timestamp && (
                      <time className={styles.timestamp}>{item.timestamp}</time>
                    )}
                  </div>
                  {item.expandable && (
                    <button
                      type="button"
                      className={`${styles.expandButton} ${
                        isExpanded ? styles.expanded : ''
                      }`}
                      onClick={() => handleToggle(item.id)}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      aria-expanded={isExpanded}
                    >
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
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  )}
                </div>
                {item.description && (
                  <div
                    className={`${styles.description} ${
                      item.expandable && !isExpanded ? styles.collapsed : ''
                    }`}
                  >
                    {item.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

Timeline.displayName = 'Timeline';
