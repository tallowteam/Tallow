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

  const focusTarget = () => {
    const target = document.getElementById(targetId) as HTMLElement | null;
    if (!target) {
      return;
    }

    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }

    // Keep hash and focus behavior explicit for consistent cross-browser skip-link behavior.
    if (window.location.hash !== `#${targetId}`) {
      window.history.replaceState(null, '', `#${targetId}`);
    }

    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    focusTarget();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    // Enter already triggers click on anchors. Handle Space explicitly.
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      focusTarget();
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
