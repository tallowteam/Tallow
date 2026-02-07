/**
 * Accessibility Utilities
 * WCAG AA compliance helpers and focus management
 */

import { prefersReducedMotion } from './device-detection';

/**
 * Trap focus within a container element
 * Useful for modals, dialogs, and popups
 */
export class FocusTrap {
  private container: HTMLElement;
  private previouslyFocused: HTMLElement | null = null;
  private isActive = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Get all focusable elements within container
   */
  private getFocusableElements(): HTMLElement[] {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(this.container.querySelectorAll(selectors));
  }

  /**
   * Handle keyboard navigation within trap
   */
  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') {return;}

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) {return;}

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (!firstElement || !lastElement) {return;}

    // Shift + Tab: moving backwards
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    }
    // Tab: moving forwards
    else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  /**
   * Activate the focus trap
   */
  activate() {
    if (this.isActive) {return;}

    // Store currently focused element
    this.previouslyFocused = document.activeElement as HTMLElement;

    // Focus first focusable element in container
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      const firstElement = focusableElements[0];
      if (firstElement) {
        firstElement.focus();
      }
    }

    // Add event listener
    this.container.addEventListener('keydown', this.handleKeyDown);
    this.isActive = true;
  }

  /**
   * Deactivate the focus trap
   */
  deactivate() {
    if (!this.isActive) {return;}

    // Remove event listener
    this.container.removeEventListener('keydown', this.handleKeyDown);

    // Restore focus to previously focused element
    if (this.previouslyFocused && this.previouslyFocused.focus) {
      this.previouslyFocused.focus();
    }

    this.isActive = false;
  }
}

/**
 * Create a live region for announcing dynamic content to screen readers
 */
export function createLiveRegion(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  let liveRegion = document.getElementById('a11y-live-region');

  // Create live region if it doesn't exist
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'a11y-live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }

  // Update aria-live if priority changed
  if (liveRegion.getAttribute('aria-live') !== priority) {
    liveRegion.setAttribute('aria-live', priority);
  }

  // Announce message
  liveRegion.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = '';
    }
  }, 1000);
}

/**
 * Announce a message to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  createLiveRegion(message, priority);
}

/**
 * Check if element is keyboard focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const tabindex = element.getAttribute('tabindex');
  if (tabindex === '-1') {return false;}

  const tagName = element.tagName.toLowerCase();
  const isNativelyFocusable = ['a', 'button', 'input', 'select', 'textarea'].includes(tagName);

  if (isNativelyFocusable) {
    return !element.hasAttribute('disabled');
  }

  return tabindex !== null;
}

/**
 * Get next focusable element in document order
 */
export function getNextFocusable(current: HTMLElement): HTMLElement | null {
  const allFocusable = Array.from(
    document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );

  const currentIndex = allFocusable.indexOf(current);
  return allFocusable[currentIndex + 1] || null;
}

/**
 * Get previous focusable element in document order
 */
export function getPreviousFocusable(current: HTMLElement): HTMLElement | null {
  const allFocusable = Array.from(
    document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );

  const currentIndex = allFocusable.indexOf(current);
  return allFocusable[currentIndex - 1] || null;
}

/**
 * Generate unique ID for ARIA relationships
 */
let idCounter = 0;
export function generateAriaId(prefix = 'aria'): string {
  return `${prefix}-${++idCounter}-${Date.now()}`;
}

/**
 * Keyboard event helpers
 */
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

/**
 * Check if element is visible to screen readers
 */
export function isVisibleToScreenReaders(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    element.getAttribute('aria-hidden') !== 'true'
  );
}

/**
 * Scroll element into view with smooth behavior if motion not reduced
 */
export function scrollIntoViewAccessible(element: HTMLElement, block: ScrollLogicalPosition = 'nearest'): void {
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
  element.scrollIntoView({ behavior, block });
}
