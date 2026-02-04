/**
 * Accessibility Provider
 * Provides accessibility context and preference detection
 * WCAG 2.1: Global accessibility state management
 */

'use client';

import React, { ReactNode, createContext, useContext } from 'react';
import {
  A11yPreferences,
  getA11yPreferences,
  setA11yPreferences,
  subscribeToA11yChanges,
} from '@/lib/accessibility/a11y-config';

interface A11yContextType {
  preferences: A11yPreferences;
  updatePreferences: (updates: Partial<A11yPreferences>) => void;
  resetPreferences: () => void;
}

const A11yContext = createContext<A11yContextType | undefined>(undefined);

export interface A11yProviderProps {
  children: ReactNode;
}

export function A11yProvider({ children }: A11yProviderProps) {
  const [preferences, setPreferences] = React.useState<A11yPreferences>(() =>
    getA11yPreferences()
  );

  React.useEffect(() => {
    return subscribeToA11yChanges(setPreferences);
  }, []);

  const updatePreferences = (updates: Partial<A11yPreferences>) => {
    setA11yPreferences(updates);
  };

  const resetPreferences = () => {
    setPreferences(getA11yPreferences());
  };

  const value: A11yContextType = {
    preferences,
    updatePreferences,
    resetPreferences,
  };

  return (
    <A11yContext.Provider value={value}>
      <A11yInitializer preferences={preferences} />
      {children}
    </A11yContext.Provider>
  );
}

/**
 * Hook to use accessibility context
 */
export function useA11y(): A11yContextType {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error('useA11y must be used within A11yProvider');
  }
  return context;
}

/**
 * Internal component to apply accessibility settings to DOM
 */
function A11yInitializer({ preferences }: { preferences: A11yPreferences }) {
  React.useEffect(() => {
    const root = document.documentElement;

    // Apply reduced motion
    if (preferences.reducedMotion) {
      root.style.setProperty('--reduce-motion', '1');
      root.classList.add('reduce-motion');
    } else {
      root.style.removeProperty('--reduce-motion');
      root.classList.remove('reduce-motion');
    }

    // Apply high contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply font size multiplier
    if (preferences.fontSizeMultiplier !== 1) {
      root.style.setProperty(
        '--font-size-multiplier',
        String(preferences.fontSizeMultiplier)
      );
      root.classList.add('font-size-adjusted');
    } else {
      root.style.removeProperty('--font-size-multiplier');
      root.classList.remove('font-size-adjusted');
    }

    // Apply focus indicator style
    root.setAttribute('data-focus-indicators', preferences.focusIndicators);

    // Apply keyboard-only mode
    if (preferences.keyboardOnly) {
      root.classList.add('keyboard-only');
    } else {
      root.classList.remove('keyboard-only');
    }
  }, [preferences]);

  return null;
}

/**
 * Global CSS for accessibility settings
 */
export const A11Y_CSS = `
:root {
  --font-size-multiplier: 1;
  --reduce-motion: 0;
  --focus-outline-width: 2px;
  --focus-outline-offset: 2px;
}

/* Reduced motion */
.reduce-motion,
.reduce-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

/* High contrast mode */
.high-contrast {
  --text-color: #000;
  --bg-color: #fff;
  --focus-color: #000;
}

.high-contrast * {
  border-color: #000 !important;
  color: #000 !important;
}

/* Font size adjustment */
.font-size-adjusted {
  font-size: calc(1rem * var(--font-size-multiplier));
}

.font-size-adjusted * {
  font-size: calc(1em * var(--font-size-multiplier));
}

/* Enhanced focus indicators */
[data-focus-indicators='enhanced'] *:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
}

[data-focus-indicators='high-contrast'] *:focus-visible {
  outline: 4px solid #000;
  outline-offset: 2px;
  background-color: #ffff00;
}

/* Keyboard-only mode - hide focus on non-keyboard interactions */
.keyboard-only *:focus:not(:focus-visible) {
  outline: none;
}
`;
