/**
 * Accessibility Configuration
 * Manages user accessibility preferences
 * WCAG 2.1: 1.4.3 Contrast (Enhanced), 2.3.3 Animation from Interactions (Level AAA)
 */

export interface A11yPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSizeMultiplier: number; // 1 = normal, 1.2 = 20% larger, etc
  screenReaderMode: boolean;
  keyboardOnly: boolean;
  focusIndicators: 'default' | 'enhanced' | 'high-contrast';
}

const DEFAULT_PREFERENCES: A11yPreferences = {
  reducedMotion: false,
  highContrast: false,
  fontSizeMultiplier: 1,
  screenReaderMode: false,
  keyboardOnly: false,
  focusIndicators: 'default',
};

const STORAGE_KEY = 'tallow-a11y-preferences';

/**
 * Get user's motion preferences from system
 */
export function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get user's contrast preferences from system
 */
export function getPrefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(prefers-contrast: more)').matches ||
    window.matchMedia('(forced-colors: active)').matches
  );
}

/**
 * Get user's color scheme preference from system
 */
export function getPrefersColorScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Detect if user is likely using a screen reader
 */
export function isScreenReaderActive(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for common screen reader presence indicators
  const ua = navigator.userAgent.toLowerCase();
  const srIndicators = [
    'jaws',
    'nvda',
    'voiceover',
    'narrator',
    'windowseyes',
    'supernova',
  ];

  return srIndicators.some((indicator) => ua.includes(indicator));
}

/**
 * Manage accessibility preferences
 */
class A11yConfigManager {
  private preferences: A11yPreferences;
  private listeners: Set<(prefs: A11yPreferences) => void> = new Set();

  constructor() {
    this.preferences = this.loadPreferences();
    this.setupMediaQueryListeners();
  }

  /**
   * Load preferences from storage
   */
  private loadPreferences(): A11yPreferences {
    if (typeof window === 'undefined') {
      return DEFAULT_PREFERENCES;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch {
      // Silently fail if localStorage is not available
    }

    // Detect system preferences
    return {
      ...DEFAULT_PREFERENCES,
      reducedMotion: getPrefersReducedMotion(),
      highContrast: getPrefersHighContrast(),
      screenReaderMode: isScreenReaderActive(),
    };
  }

  /**
   * Save preferences to storage
   */
  private savePreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Setup media query listeners for system preference changes
   */
  private setupMediaQueryListeners(): void {
    if (typeof window === 'undefined') return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');

    const handleChange = () => {
      this.preferences = {
        ...this.preferences,
        reducedMotion: motionQuery.matches,
        highContrast: contrastQuery.matches,
      };
      this.notifyListeners();
    };

    // Use addEventListener if available, fallback to deprecated addListener
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', handleChange);
      contrastQuery.addEventListener('change', handleChange);
    } else {
      motionQuery.addListener(handleChange);
      contrastQuery.addListener(handleChange);
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): A11yPreferences {
    return { ...this.preferences };
  }

  /**
   * Update preferences
   */
  updatePreferences(updates: Partial<A11yPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
    this.notifyListeners();
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.preferences = this.loadPreferences();
    this.notifyListeners();
  }

  /**
   * Subscribe to preference changes
   */
  subscribe(listener: (prefs: A11yPreferences) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.preferences));
  }
}

// Singleton instance
let configManager: A11yConfigManager | null = null;

function getConfigManager(): A11yConfigManager {
  if (!configManager) {
    configManager = new A11yConfigManager();
  }
  return configManager;
}

/**
 * Get accessibility preferences
 */
export function getA11yPreferences(): A11yPreferences {
  return getConfigManager().getPreferences();
}

/**
 * Update accessibility preferences
 */
export function setA11yPreferences(updates: Partial<A11yPreferences>): void {
  getConfigManager().updatePreferences(updates);
}

/**
 * Reset accessibility preferences
 */
export function resetA11yPreferences(): void {
  getConfigManager().reset();
}

/**
 * Subscribe to accessibility preference changes
 */
export function subscribeToA11yChanges(
  listener: (prefs: A11yPreferences) => void
): () => void {
  return getConfigManager().subscribe(listener);
}

/**
 * React hook for accessibility preferences
 */
export function useA11yPreferences() {
  const [preferences, setPreferences] = React.useState<A11yPreferences>(() =>
    getA11yPreferences()
  );

  React.useEffect(() => {
    return subscribeToA11yChanges(setPreferences);
  }, []);

  return {
    preferences,
    updatePreferences: setA11yPreferences,
    resetPreferences: resetA11yPreferences,
  };
}

import React from 'react';
