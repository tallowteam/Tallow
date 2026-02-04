'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import styles from './Tag.module.css';

export interface TagProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
  icon?: ReactNode;
  children: ReactNode;
}

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      variant = 'default',
      size = 'md',
      removable = false,
      onRemove,
      icon,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const tagClasses = [
      styles.tag,
      styles[variant],
      styles[size],
      removable ? styles.removable : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.();
    };

    return (
      <span ref={ref} className={tagClasses} {...props}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.content}>{children}</span>
        {removable && (
          <button
            type="button"
            className={styles.removeButton}
            onClick={handleRemove}
            aria-label="Remove tag"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Tag.displayName = 'Tag';

export interface TagGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
}

export const TagGroup = forwardRef<HTMLDivElement, TagGroupProps>(
  ({ children, spacing = 'md', className = '', ...props }, ref) => {
    const groupClasses = [styles.tagGroup, styles[`spacing${spacing}`], className]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={groupClasses} {...props}>
        {children}
      </div>
    );
  }
);

TagGroup.displayName = 'TagGroup';
