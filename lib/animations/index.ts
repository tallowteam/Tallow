/**
 * Animation Utilities
 *
 * Production-ready CSS animation utilities with:
 * - Performance-optimized keyframes
 * - Consistent timing functions
 * - Reusable animation classes
 * - Accessibility support
 */

// Animation durations (milliseconds)
export const DURATION = {
  instant: 0,
  fast: 200,
  normal: 300,
  slow: 500,
  slower: 700,
  slowest: 1000,
} as const;

// Easing functions
export const EASING = {
  // Natural motion
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeIn: 'cubic-bezier(0.7, 0, 0.84, 0)',
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',

  // Spring-like
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  softSpring: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',

  // Sharp
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',

  // Bounce
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// CSS keyframe animations
export const keyframes = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes slideDown {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes glow {
    0%, 100% {
      filter: blur(20px);
      opacity: 0.5;
    }
    50% {
      filter: blur(30px);
      opacity: 0.8;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes blink {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }

  /* Reduced motion alternatives */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// Utility function to create animation styles
export const createAnimation = (
  name: string,
  duration: number = DURATION.normal,
  easing: string = EASING.easeOut,
  delay: number = 0,
  fillMode: 'none' | 'forwards' | 'backwards' | 'both' = 'both'
): string => {
  return `${name} ${duration}ms ${easing} ${delay}ms ${fillMode}`;
};

// Stagger delay calculator
export const staggerDelay = (index: number, baseDelay: number = 50): number => {
  return index * baseDelay;
};

// Spring transition utility
export const springTransition = (
  properties: string[] = ['all']
): string => {
  return properties
    .map(prop => `${prop} ${DURATION.slow}ms ${EASING.spring}`)
    .join(', ');
};

// Smooth transition utility
export const smoothTransition = (
  properties: string[] = ['all'],
  duration: number = DURATION.normal
): string => {
  return properties
    .map(prop => `${prop} ${duration}ms ${EASING.easeOut}`)
    .join(', ');
};

// Export types
export type Duration = typeof DURATION[keyof typeof DURATION];
export type Easing = typeof EASING[keyof typeof EASING];
