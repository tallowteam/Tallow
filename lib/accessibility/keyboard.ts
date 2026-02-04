/**
 * Keyboard Navigation Utilities
 * Provides helpers for keyboard event handling
 * WCAG 2.1: 2.1.1 Keyboard (Level A), 2.1.2 No Keyboard Trap (Level A)
 */

import React from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyboardOptions {
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

/**
 * Check if a keyboard event matches specific key
 */
export function isKey(event: KeyboardEvent, key: string, options: KeyboardOptions = {}): boolean {
  const {
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false,
  } = options;

  return (
    event.key.toLowerCase() === key.toLowerCase() &&
    event.ctrlKey === ctrlKey &&
    event.shiftKey === shiftKey &&
    event.altKey === altKey &&
    event.metaKey === metaKey
  );
}

/**
 * Check if key is printable
 */
export function isPrintable(event: KeyboardEvent): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey;
}

/**
 * Check if key is arrow key
 */
export function isArrowKey(event: KeyboardEvent): boolean {
  return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
}

/**
 * Check if key is a navigation key (Tab, Enter, Space, Escape, etc)
 */
export function isNavigationKey(event: KeyboardEvent): boolean {
  return [
    'Tab',
    'Enter',
    ' ',
    'Escape',
    'Home',
    'End',
    'PageUp',
    'PageDown',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
  ].includes(event.key);
}

/**
 * Handle arrow key navigation in list
 */
export function handleArrowKeyNavigation(
  event: KeyboardEvent,
  currentIndex: number,
  itemCount: number,
  options: {
    circular?: boolean;
    horizontal?: boolean;
  } = {}
): number {
  const { circular = true, horizontal = false } = options;

  if (event.key === 'ArrowUp' || (!horizontal && event.key === 'ArrowLeft')) {
    event.preventDefault();
    if (currentIndex === 0) {
      return circular ? itemCount - 1 : 0;
    }
    return currentIndex - 1;
  }

  if (event.key === 'ArrowDown' || (!horizontal && event.key === 'ArrowRight')) {
    event.preventDefault();
    if (currentIndex === itemCount - 1) {
      return circular ? 0 : itemCount - 1;
    }
    return currentIndex + 1;
  }

  if (horizontal && event.key === 'ArrowLeft') {
    event.preventDefault();
    if (currentIndex === 0) {
      return circular ? itemCount - 1 : 0;
    }
    return currentIndex - 1;
  }

  if (horizontal && event.key === 'ArrowRight') {
    event.preventDefault();
    if (currentIndex === itemCount - 1) {
      return circular ? 0 : itemCount - 1;
    }
    return currentIndex + 1;
  }

  return currentIndex;
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation(
  itemCount: number,
  onSelect?: (index: number) => void,
  options: {
    circular?: boolean;
    horizontal?: boolean;
    initialIndex?: number;
  } = {}
) {
  const { circular = true, horizontal = false, initialIndex = 0 } = options;
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  const handleKeyDown = (event: KeyboardEvent) => {
    const newIndex = handleArrowKeyNavigation(
      event,
      currentIndex,
      itemCount,
      { circular, horizontal }
    );

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      onSelect?.(newIndex);
    }

    // Handle Enter/Space for selection
    if (isKey(event, 'Enter') || isKey(event, ' ')) {
      event.preventDefault();
      onSelect?.(currentIndex);
    }

    // Handle Home/End keys
    if (isKey(event, 'Home')) {
      event.preventDefault();
      setCurrentIndex(0);
      onSelect?.(0);
    }

    if (isKey(event, 'End')) {
      event.preventDefault();
      setCurrentIndex(itemCount - 1);
      onSelect?.(itemCount - 1);
    }
  };

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
  };
}

/**
 * Hook for keyboard event handler
 */
export function useKeyDown(key: string | string[], handler: KeyHandler, options?: KeyboardOptions) {
  const keys = Array.isArray(key) ? key : [key];

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (keys.some((k) => isKey(event, k, options))) {
        handler(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keys, handler, options]);
}

/**
 * Hook for Escape key handler
 */
export function useEscapeKey(handler: () => void, enabled = true) {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isKey(event, 'Escape')) {
        event.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handler, enabled]);
}

/**
 * Hook for Enter key handler
 */
export function useEnterKey(handler: () => void, enabled = true) {
  return useKeyDown('Enter', () => handler(), undefined);
}
