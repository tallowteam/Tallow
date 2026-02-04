/**
 * Focus Visible Hook
 * Detects keyboard vs mouse focus and applies appropriate styles
 * WCAG 2.1: 2.4.7 Focus Visible (Level AA)
 */

import React from 'react';

export interface FocusVisibleState {
  isFocused: boolean;
  isFocusVisible: boolean;
}

/**
 * Determine if focus should be visible (keyboard focus)
 */
function isFocusVisible(element: Element): boolean {
  if (!element) return false;

  // Check if element has focus-visible class (added by browser/polyfill)
  if (element.matches(':focus-visible')) {
    return true;
  }

  // Fallback: check if we're in keyboard navigation mode
  // This is set by tracking user interactions
  return (window as any).__isKeyboardNavigation === true;
}

/**
 * Hook to track focus visibility
 * Returns state to conditionally apply focus styles
 */
export function useFocusVisible(): FocusVisibleState {
  const [state, setState] = React.useState<FocusVisibleState>({
    isFocused: false,
    isFocusVisible: false,
  });

  const elementRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleFocus = () => {
      setState({
        isFocused: true,
        isFocusVisible: isFocusVisible(element),
      });
    };

    const handleBlur = () => {
      setState({
        isFocused: false,
        isFocusVisible: false,
      });
    };

    const handleMouseDown = () => {
      (window as any).__isKeyboardNavigation = false;
    };

    const handleKeyDown = () => {
      (window as any).__isKeyboardNavigation = true;
    };

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return state;
}

/**
 * Return ref to attach to element
 */
export function useFocusVisibleRef(): React.Ref<HTMLElement> {
  return React.useRef<HTMLElement>(null);
}

/**
 * Combined hook that tracks focus visibility on a given ref
 */
export function useFocusVisibleState(
  ref: React.RefObject<HTMLElement>
): FocusVisibleState {
  const [state, setState] = React.useState<FocusVisibleState>({
    isFocused: false,
    isFocusVisible: false,
  });

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleFocus = () => {
      setState({
        isFocused: true,
        isFocusVisible: isFocusVisible(element),
      });
    };

    const handleBlur = () => {
      setState({
        isFocused: false,
        isFocusVisible: false,
      });
    };

    const handleMouseDown = () => {
      (window as any).__isKeyboardNavigation = false;
    };

    const handleKeyDown = () => {
      (window as any).__isKeyboardNavigation = true;
    };

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref]);

  return state;
}
