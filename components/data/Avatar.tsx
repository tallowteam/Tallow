'use client';

import { forwardRef, HTMLAttributes, useState } from 'react';
import styles from './Avatar.module.css';

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  src?: string;
  alt: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  fallbackColor?: string;
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getColorFromName = (name: string): string => {
  const colors = [
    '#7c3aed', // purple
    '#6366f1', // indigo
    '#3b82f6', // blue
    '#0ea5e9', // sky
    '#14b8a6', // teal
    '#10b981', // emerald
    '#84cc16', // lime
    '#f59e0b', // amber
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      name,
      size = 'md',
      status,
      fallbackColor,
      className = '',
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);
    const showFallback = !src || imageError;
    const displayName = name || alt;
    const initials = getInitials(displayName);
    const bgColor = fallbackColor || getColorFromName(displayName);

    const avatarClasses = [styles.avatar, styles[size], className]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={avatarClasses} {...props}>
        <div className={styles.avatarContent}>
          {showFallback ? (
            <div className={styles.fallback} style={{ backgroundColor: bgColor }}>
              <span className={styles.initials}>{initials}</span>
            </div>
          ) : (
            <img
              src={src}
              alt={alt}
              className={styles.image}
              onError={() => setImageError(true)}
            />
          )}
        </div>
        {status && (
          <span
            className={`${styles.status} ${styles[status]}`}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ children, max = 5, size = 'md', className = '', ...props }, ref) => {
    const childArray = Array.isArray(children) ? children : [children];
    const displayedChildren = childArray.slice(0, max);
    const remaining = childArray.length - max;

    const groupClasses = [styles.avatarGroup, styles[`group${size}`], className]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={groupClasses} {...props}>
        {displayedChildren}
        {remaining > 0 && (
          <div className={`${styles.avatar} ${styles[size]}`}>
            <div className={styles.avatarContent}>
              <div className={styles.fallback} style={{ backgroundColor: '#666' }}>
                <span className={styles.initials}>+{remaining}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';
