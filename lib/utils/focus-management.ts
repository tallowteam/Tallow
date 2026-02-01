/**
 * Focus Management Utilities
 * WCAG 2.1 AA: Programmatic focus management for keyboard navigation
 */

/**
 * Move focus to an element
 */
export function moveFocusTo(elementOrSelector: HTMLElement | string) {
  const element = typeof elementOrSelector === 'string'
    ? document.querySelector<HTMLElement>(elementOrSelector)
    : elementOrSelector;

  if (element) {
    element.focus();
    // Ensure element is scrolled into view
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Move focus to first focusable element in container
 */
export function moveFocusToFirstFocusable(container: HTMLElement | string) {
  const containerElement = typeof container === 'string'
    ? document.querySelector<HTMLElement>(container)
    : container;

  if (!containerElement) {return;}

  const focusableElement = getFocusableElements(containerElement)[0];
  if (focusableElement) {
    moveFocusTo(focusableElement);
  }
}

/**
 * Get all focusable elements in a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
}

/**
 * Trap focus within a container (for modals/dialogs)
 */
export function trapFocus(container: HTMLElement) {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') {return;}

    // Shift + Tab: focus last element when on first
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    }
    // Tab: focus first element when on last
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Restore focus to previously focused element
 */
export class FocusManager {
  private previouslyFocused: HTMLElement | null = null;

  saveFocus() {
    this.previouslyFocused = document.activeElement as HTMLElement;
  }

  restoreFocus() {
    if (this.previouslyFocused && typeof this.previouslyFocused.focus === 'function') {
      this.previouslyFocused.focus();
    }
    this.previouslyFocused = null;
  }
}

/**
 * Announce message to screen readers without visual display
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
