'use client';

/**
 * Focus Trap Hook
 * WCAG 2.1 AA: Ensures keyboard focus stays within modal/dialog
 * Prevents focus from escaping to background content
 */

import { useEffect, useRef, useCallback } from 'react';
import { getFocusableElements } from '@/lib/utils/focus-management';

export interface UseFocusTrapOptions {
  /**
   * Whether the focus trap is active
   */
  enabled?: boolean;

  /**
   * Whether to focus the first element when trap activates
   * @default true
   */
  initialFocus?: boolean;

  /**
   * Whether to restore focus to previously focused element when trap deactivates
   * @default true
   */
  restoreFocus?: boolean;

  /**
   * Callback when user tries to escape (e.g., pressing Escape)
   */
  onEscape?: () => void;
}

export function useFocusTrap(options: UseFocusTrapOptions = {}) {
  const {
    enabled = true,
    initialFocus = true,
    restoreFocus = true,
    onEscape,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle tab key navigation to trap focus
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!containerRef.current || !enabled) {
        return;
      }

      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Handle Tab key
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements(containerRef.current);

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        // Shift + Tab on first element -> focus last
        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
          return;
        }

        // Tab on last element -> focus first
        if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
          return;
        }
      }
    },
    [enabled, onEscape]
  );

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return;
    }

    // Save previously focused element
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // Focus first element
    if (initialFocus) {
      const focusableElements = getFocusableElements(containerRef.current);
      const firstElement = focusableElements[0];

      if (firstElement) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          firstElement.focus();
        }, 10);
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Remove event listener
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to previously focused element
      if (restoreFocus && previousFocusRef.current) {
        setTimeout(() => {
          previousFocusRef.current?.focus();
        }, 10);
      }
    };
  }, [enabled, initialFocus, restoreFocus, handleKeyDown]);

  return containerRef;
}

/**
 * Simple focus trap for dialog/modal usage
 * Returns ref to attach to container element
 */
export function useFocusTrapDialog(isOpen: boolean, onClose?: () => void) {
  return useFocusTrap({
    enabled: isOpen,
    initialFocus: true,
    restoreFocus: true,
    ...(onClose ? { onEscape: onClose } : {}),
  });
}

export default useFocusTrap;
