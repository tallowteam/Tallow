/**
 * Theme Toggle Component
 * Accessible button to toggle between light and dark themes
 */

'use client';

import React from 'react';
import { useTheme } from './use-theme';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Theme Toggle Button Component
 */
export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      type="button"
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}

/**
 * Sun Icon (Light Mode)
 */
function SunIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="theme-icon sun-icon"
    >
      <circle
        cx="10"
        cy="10"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 1V3M10 17V19M19 10H17M3 10H1M16.364 16.364L14.95 14.95M5.05 5.05L3.636 3.636M16.364 3.636L14.95 5.05M5.05 14.95L3.636 16.364"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Moon Icon (Dark Mode)
 */
function MoonIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="theme-icon moon-icon"
    >
      <path
        d="M18 10.5C17.742 12.99 16.481 15.244 14.5 16.768C12.519 18.292 10 18.946 7.5 18.583C5 18.22 2.756 16.865 1.268 14.804C-0.22 12.743 -0.398 10.151 0.757 7.929C1.912 5.707 3.997 4.066 6.5 3.5C6.5 5.5 7.29 7.419 8.732 8.864C10.174 10.309 12.087 11.167 14.09 11.25C15.435 11.309 16.778 11.06 18 10.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Default Theme Toggle Styles
 */
export const themeToggleStyles = `
.theme-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-md, 0.5rem);
  cursor: pointer;
  transition: all 150ms ease-in-out;
  color: var(--color-foreground-secondary, #a1a1a1);
}

.theme-toggle:hover {
  background: var(--color-background-secondary, rgba(255, 255, 255, 0.05));
  color: var(--color-foreground-primary, #ffffff);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--color-accent-primary, #7c3aed);
  outline-offset: 2px;
}

.theme-toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.theme-icon {
  width: 100%;
  height: 100%;
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.theme-toggle:hover .theme-icon {
  transform: rotate(20deg) scale(1.1);
}

.sun-icon {
  animation: rotate-rays 20s linear infinite;
}

@keyframes rotate-rays {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.theme-toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
}

@media (prefers-reduced-motion: reduce) {
  .theme-toggle,
  .theme-icon,
  .sun-icon {
    transition: none !important;
    animation: none !important;
  }
}
`;
