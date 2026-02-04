/**
 * Focus Trap Utility
 * Manages focus within a specific element, preventing focus from escaping
 * WCAG 2.1: 2.1.1 Keyboard (Level A), 2.4.3 Focus Order (Level A)
 */

import React from 'react';

interface FocusTrapOptions {
  container: HTMLElement;
  initialFocus?: HTMLElement;
  onEscape?: () => void;
  returnFocus?: boolean;
}

interface FocusTrapHandle {
  activate: () => void;
  deactivate: () => void;
  focusFirst: () => void;
  focusLast: () => void;
}

/**
 * Create a focus trap that confines keyboard focus to a container
 * Useful for modals, dropdowns, and other overlay components
 */
export function createFocusTrap(options: FocusTrapOptions): FocusTrapHandle {
  const { container, initialFocus, onEscape, returnFocus = true } = options;

  let previousActiveElement: HTMLElement | null = null;
  let isActive = false;

  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  function getFocusableElements(): HTMLElement[] {
    return Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((element) => {
      // Check if element is visible
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  function focusFirst(): void {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  function focusLast(): void {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (!isActive) return;

    // Handle Escape key
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }

    // Handle Tab key for focus cycling
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const currentIndex = focusableElements.indexOf(
      document.activeElement as HTMLElement
    );

    if (event.shiftKey) {
      // Shift + Tab
      if (currentIndex <= 0) {
        event.preventDefault();
        focusLast();
      }
    } else {
      // Tab
      if (currentIndex >= focusableElements.length - 1) {
        event.preventDefault();
        focusFirst();
      }
    }
  }

  function activate(): void {
    if (isActive) return;

    isActive = true;

    // Store the currently focused element to restore later
    if (returnFocus) {
      previousActiveElement = document.activeElement as HTMLElement;
    }

    // Set initial focus
    if (initialFocus) {
      initialFocus.focus();
    } else {
      focusFirst();
    }

    // Add keyboard event listener
    container.addEventListener('keydown', handleKeyDown);
  }

  function deactivate(): void {
    if (!isActive) return;

    isActive = false;

    // Remove keyboard event listener
    container.removeEventListener('keydown', handleKeyDown);

    // Restore focus to previous element
    if (returnFocus && previousActiveElement) {
      previousActiveElement.focus();
      previousActiveElement = null;
    }
  }

  return {
    activate,
    deactivate,
    focusFirst,
    focusLast,
  };
}

/**
 * Hook version of focus trap
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options?: Partial<FocusTrapOptions>
): FocusTrapHandle | null {
  const handleRef = React.useRef<FocusTrapHandle | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    handleRef.current = createFocusTrap({
      container: containerRef.current,
      ...options,
    });

    return () => {
      handleRef.current?.deactivate();
    };
  }, [containerRef, options]);

  return handleRef.current;
}
