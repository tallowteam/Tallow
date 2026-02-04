/**
 * Custom Render Utilities
 * Provides custom render function with all necessary providers
 */

import { ReactElement, ReactNode } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';

// Type for wrapper props
interface WrapperProps {
  children: ReactNode;
}

/**
 * Custom render function that wraps components with all necessary providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Wrapper component with all providers
  function Wrapper({ children }: WrapperProps) {
    return <>{children}</>;
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

/**
 * Re-export everything from Testing Library
 */
export * from '@testing-library/react';
export { customRender as render };
