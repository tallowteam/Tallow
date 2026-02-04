/**
 * Skip to Content Link Component
 * Allows keyboard users to skip repetitive navigation
 * WCAG 2.1: 2.4.1 Bypass Blocks (Level A)
 */

'use client';

import { ButtonHTMLAttributes } from 'react';
import styles from './SkipLink.module.css';

export interface SkipLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  targetId?: string;
  label?: string;
}

export function SkipLink({
  targetId = 'main-content',
  label = 'Skip to main content',
  onClick,
  ...props
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }

    onClick?.(e);
  };

  return (
    <button
      className={styles.skipLink}
      onClick={handleClick}
      aria-label={label}
      {...props}
    >
      {label}
    </button>
  );
}

/**
 * Multiple skip links component
 */
export interface SkipLinksProps {
  links?: Array<{ id: string; label: string }>;
}

export function SkipLinks({
  links = [
    { id: 'main-content', label: 'Skip to main content' },
    { id: 'footer', label: 'Skip to footer' },
  ],
}: SkipLinksProps) {
  return (
    <nav className={styles.skipLinks} aria-label="Skip links">
      {links.map((link) => (
        <SkipLink key={link.id} targetId={link.id} label={link.label} />
      ))}
    </nav>
  );
}
