/**
 * Focus Trap Hook
 * Manages focus within a container (modals, dialogs, etc.)
 */

import { useEffect, useRef } from 'react';

export interface UseFocusTrapOptions {
  enabled?: boolean;
  initialFocus?: HTMLElement | (() => HTMLElement | null);
  finalFocus?: HTMLElement | (() => HTMLElement | null);
}

export function useFocusTrap(options: UseFocusTrapOptions = {}) {
  const { enabled = true, initialFocus, finalFocus } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) {return;}

    const container = containerRef.current;
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    const getFocusableElements = (): HTMLElement[] => {
      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll(selectors));
    };

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) {return;}

    // Focus initial element
    let initialElement: HTMLElement | null = null;
    if (typeof initialFocus === 'function') {
      initialElement = initialFocus();
    } else if (initialFocus) {
      initialElement = initialFocus;
    } else {
      initialElement = focusableElements[0] || null;
    }

    if (initialElement) {
      initialElement.focus();
    }

    // Handle tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {return;}

      const focusable = getFocusableElements();
      if (focusable.length === 0) {return;}

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      let targetElement: HTMLElement | null = null;
      if (typeof finalFocus === 'function') {
        targetElement = finalFocus();
      } else if (finalFocus) {
        targetElement = finalFocus;
      } else {
        targetElement = previouslyFocusedRef.current;
      }

      if (targetElement && targetElement !== document.activeElement) {
        targetElement.focus();
      }
    };
  }, [enabled, initialFocus, finalFocus]);

  return containerRef;
}
