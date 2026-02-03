/**
 * Spotlight Component
 *
 * Mouse-following spotlight effect with performance optimization.
 * Uses RAF (RequestAnimationFrame) for smooth 60fps tracking.
 */

'use client';

import React, { useEffect, useRef, useState, CSSProperties } from 'react';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';

export interface SpotlightProps {
  /**
   * Spotlight size (diameter)
   * @default 400
   */
  size?: number;

  /**
   * Spotlight color
   * @default '#ffffff'
   */
  color?: string;

  /**
   * Spotlight opacity
   * @default 0.15
   */
  opacity?: number;

  /**
   * Blur intensity
   * @default 100
   */
  blur?: number;

  /**
   * Enable smooth following (lerp)
   * @default true
   */
  smooth?: boolean;

  /**
   * Smoothing factor (0-1, lower = smoother)
   * @default 0.15
   */
  smoothing?: number;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Inline styles
   */
  style?: CSSProperties;

  /**
   * Z-index
   * @default -1
   */
  zIndex?: number;

  /**
   * Enable on mobile devices
   * @default false
   */
  enableMobile?: boolean;
}

/**
 * Spotlight component with mouse tracking
 *
 * @example
 * ```tsx
 * <div style={{ position: 'relative' }}>
 *   <Spotlight color="#4ECDC4" size={600} />
 *   <div>Content with spotlight effect</div>
 * </div>
 * ```
 */
export function Spotlight({
  size = 400,
  color = '#ffffff',
  opacity = 0.15,
  blur = 100,
  smooth = true,
  smoothing = 0.15,
  className = '',
  style = {},
  zIndex = -1,
  enableMobile = false,
}: SpotlightProps) {
  const prefersReducedMotion = useReducedMotion();
  const spotlightRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const mousePos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    if (typeof navigator !== 'undefined') {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      );
    }
  }, []);

  useEffect(() => {
    // Don't run on mobile unless explicitly enabled
    if (isMobile && !enableMobile) {
      return;
    }

    // Don't run if user prefers reduced motion
    if (prefersReducedMotion) {
      return;
    }

    const spotlight = spotlightRef.current;
    if (!spotlight) return;

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    // Animation loop with RAF
    const animate = () => {
      if (!spotlight) return;

      if (smooth) {
        // Lerp (linear interpolation) for smooth following
        currentPos.current.x +=
          (mousePos.current.x - currentPos.current.x) * smoothing;
        currentPos.current.y +=
          (mousePos.current.y - currentPos.current.y) * smoothing;
      } else {
        // Direct positioning
        currentPos.current.x = mousePos.current.x;
        currentPos.current.y = mousePos.current.y;
      }

      // Update spotlight position
      spotlight.style.transform = `translate(${currentPos.current.x - size / 2}px, ${
        currentPos.current.y - size / 2
      }px)`;

      rafRef.current = requestAnimationFrame(animate);
    };

    // Start tracking
    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    size,
    smooth,
    smoothing,
    prefersReducedMotion,
    isMobile,
    enableMobile,
  ]);

  // Don't render on mobile unless enabled
  if (isMobile && !enableMobile) {
    return null;
  }

  // Don't render if reduced motion is preferred
  if (prefersReducedMotion) {
    return null;
  }

  const spotlightStyles: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: `${size}px`,
    height: `${size}px`,
    background: color,
    borderRadius: '50%',
    filter: `blur(${blur}px)`,
    opacity,
    pointerEvents: 'none',
    zIndex,
    willChange: 'transform',
    ...style,
  };

  return (
    <div ref={spotlightRef} className={className} style={spotlightStyles} />
  );
}

/**
 * Multi-color spotlight with multiple cursors
 *
 * @example
 * ```tsx
 * <MultiSpotlight
 *   colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
 *   size={500}
 * />
 * ```
 */
export function MultiSpotlight({
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'],
  size = 400,
  opacity = 0.1,
  blur = 100,
  ...props
}: Omit<SpotlightProps, 'color'> & {
  colors?: string[];
}) {
  return (
    <>
      {colors.map((color, index) => (
        <Spotlight
          key={index}
          color={color}
          size={size}
          opacity={opacity}
          blur={blur}
          {...props}
        />
      ))}
    </>
  );
}

/**
 * Gradient spotlight with color shifting
 *
 * @example
 * ```tsx
 * <GradientSpotlight
 *   colors={['#FF6B6B', '#4ECDC4']}
 *   size={600}
 * />
 * ```
 */
export function GradientSpotlight({
  colors = ['#FF6B6B', '#4ECDC4'],
  size = 400,
  opacity = 0.15,
  blur = 100,
  ...props
}: Omit<SpotlightProps, 'color'> & {
  colors?: string[];
}) {
  const gradient = `radial-gradient(circle, ${colors.join(', ')})`;

  return (
    <Spotlight
      size={size}
      opacity={opacity}
      blur={blur}
      style={{ background: gradient }}
      {...props}
    />
  );
}

/**
 * Spotlight with pulse effect
 *
 * @example
 * ```tsx
 * <PulseSpotlight color="#4ECDC4" size={500} />
 * ```
 */
export function PulseSpotlight({
  pulseDuration = 2,
  ...props
}: SpotlightProps & {
  pulseDuration?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  const pulseStyle: CSSProperties = prefersReducedMotion
    ? {}
    : {
        animation: `pulse ${pulseDuration}s ease-in-out infinite`,
      };

  return <Spotlight {...props} style={{ ...props.style, ...pulseStyle }} />;
}

/**
 * Spotlight container - ensures parent has correct positioning
 *
 * @example
 * ```tsx
 * <SpotlightContainer>
 *   <Spotlight />
 *   <div>Your content</div>
 * </SpotlightContainer>
 * ```
 */
export function SpotlightContainer({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const containerStyles: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div className={className} style={containerStyles}>
      {children}
    </div>
  );
}
