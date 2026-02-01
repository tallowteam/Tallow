'use client';

/**
 * Focus Management Hooks
 * React hooks for WCAG-compliant focus management
 */

import { useEffect, useRef, useState } from 'react';
import { trapFocus, moveFocusTo, FocusManager } from '../utils/focus-management';

/**
 * Hook to trap focus within a component (for modals, dialogs)
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      const cleanup = trapFocus(containerRef.current);
      return cleanup;
    }
    return undefined;
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to save and restore focus
 */
export function useFocusRestore(isActive: boolean) {
  const focusManager = useRef(new FocusManager());

  useEffect(() => {
    if (isActive) {
      focusManager.current.saveFocus();

      return () => {
        focusManager.current.restoreFocus();
      };
    }
    return undefined;
  }, [isActive]);
}

/**
 * Hook to move focus to an element on mount
 */
export function useAutoFocus(shouldFocus: boolean = true) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      // Small delay to ensure element is fully rendered
      const timer = setTimeout(() => {
        if (elementRef.current) {
          moveFocusTo(elementRef.current);
        }
      }, 50);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [shouldFocus]);

  return elementRef;
}

/**
 * Hook to announce messages to screen readers
 */
export function useAnnouncement() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create temporary live region
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;

    document.body.appendChild(liveRegion);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  };

  return { announce };
}

/**
 * Hook to manage focus within a roving tabindex pattern
 * Useful for toolbars, menus, radio groups
 */
export function useRovingTabindex(itemCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    let nextIndex = index;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (index + 1) % itemCount;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (index - 1 + itemCount) % itemCount;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = itemCount - 1;
        break;
      default:
        return;
    }

    setActiveIndex(nextIndex);
    itemRefs.current[nextIndex]?.focus();
  };

  const getItemProps = (index: number) => ({
    ref: (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    },
    tabIndex: index === activeIndex ? 0 : -1,
    onKeyDown: (e: KeyboardEvent) => handleKeyDown(e, index),
    onFocus: () => setActiveIndex(index),
  });

  return { activeIndex, getItemProps };
}
