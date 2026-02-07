/**
 * Skip Link Component
 * Allows keyboard users to skip to main content
 * WCAG 2.1 Level AA - 2.4.1 Bypass Blocks
 */

'use client';

import { useState } from 'react';
import styles from './SkipLink.module.css';

export interface SkipLinkProps {
  targetId?: string;
  label?: string;
}

export function SkipLink({ targetId = 'main-content', label = 'Skip to main content' }: SkipLinkProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(targetId);
    if (target) {
      e.preventDefault();
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick(e as any);
      setIsFocused(false);
    }
  };

  return (
    <a
      href={`#${targetId}`}
      className={`${styles.skipLink} ${isFocused ? styles.focused : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {label}
    </a>
  );
}
