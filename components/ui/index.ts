/**
 * UI Components Export Hub
 * Central export point for all UI components
 *
 * All interactive components implement WCAG 2.1 compliant touch targets:
 * - Minimum 44x44px touch target on mobile devices
 * - Responsive sizing (larger on mobile, optimized on desktop)
 * - Adequate spacing between interactive elements
 */

// Base UI Components
export * from './avatar';
export * from './badge';
export * from './button';
export * from './card';
export * from './checkbox';
export * from './dialog';
export * from './alert-dialog';
export * from './dropdown-menu';
export * from './input';
export * from './label';
export * from './popover';
export * from './progress';
export * from './scroll-area';
export * from './select';
export * from './separator';
export * from './slider';
export * from './switch';
export * from './tabs';
export * from './textarea';
export * from './tooltip';
export * from './sonner';
export * from './alert';

// Euveka Icon System
export * from './icon';
export * from './tallow-icons';

// Animated Components
export * from './button-animated';
export * from './skeleton';
export * from './motion';
export * from './animated-counter';
export * from './scroll-progress';
export * from './animated-link';
// Export animated-icon components with explicit names to avoid conflict with icon.tsx
export {
  AnimatedIcon as AnimatedIconWrapper,
  IconButton as AnimatedIconButton,
} from './animated-icon';
export * from './success-animation';

// Responsive Layout Components
export * from './responsive-container';
export * from './responsive-grid';
export * from './drag-drop-zone';
export * from './pqc-status-badge';

// Empty State Components (Euveka Style)
export * from './empty-state';
export * from './empty-state-presets';

// Error State Components (Euveka Style)
export * from './error-states';
