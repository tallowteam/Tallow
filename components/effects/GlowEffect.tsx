/**
 * GlowEffect Component
 *
 * Creates a glow/blur effect with optional pulse animation.
 * Performance optimized with CSS filters.
 */

'use client';

import { CSSProperties } from 'react';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';

export interface GlowEffectProps {
  /**
   * Glow color
   * @default '#ffffff'
   */
  color?: string;

  /**
   * Glow intensity (blur radius in pixels)
   * @default 20
   */
  intensity?: number;

  /**
   * Enable pulse animation
   * @default false
   */
  pulse?: boolean;

  /**
   * Pulse duration in seconds
   * @default 2
   */
  pulseDuration?: number;

  /**
   * Glow opacity (0-1)
   * @default 0.5
   */
  opacity?: number;

  /**
   * Position of the glow
   * @default 'center'
   */
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'custom';

  /**
   * Custom position (only used if position is 'custom')
   */
  customPosition?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };

  /**
   * Size of the glow element
   * @default { width: '300px', height: '300px' }
   */
  size?: {
    width: string;
    height: string;
  };

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
   * Border radius
   * @default '50%'
   */
  borderRadius?: string;
}

/**
 * GlowEffect component for decorative glow effects
 *
 * @example
 * ```tsx
 * <div style={{ position: 'relative' }}>
 *   <GlowEffect color="#4ECDC4" pulse intensity={30} />
 *   <h1>Content with Glow</h1>
 * </div>
 * ```
 */
export function GlowEffect({
  color = '#ffffff',
  intensity = 20,
  pulse = false,
  pulseDuration = 2,
  opacity = 0.5,
  position = 'center',
  customPosition,
  size = { width: '300px', height: '300px' },
  className = '',
  style = {},
  zIndex = -1,
  borderRadius = '50%',
}: GlowEffectProps) {
  const prefersReducedMotion = useReducedMotion();

  // Position styles
  const getPositionStyles = (): CSSProperties => {
    if (position === 'custom' && customPosition) {
      return customPosition;
    }

    const basePosition: CSSProperties = {
      position: 'absolute',
      transform: 'translate(-50%, -50%)',
    };

    switch (position) {
      case 'center':
        return {
          ...basePosition,
          top: '50%',
          left: '50%',
        };
      case 'top':
        return {
          ...basePosition,
          top: '0%',
          left: '50%',
        };
      case 'bottom':
        return {
          ...basePosition,
          top: '100%',
          left: '50%',
        };
      case 'left':
        return {
          ...basePosition,
          top: '50%',
          left: '0%',
        };
      case 'right':
        return {
          ...basePosition,
          top: '50%',
          left: '100%',
        };
      default:
        return basePosition;
    }
  };

  const glowStyles: CSSProperties = {
    ...getPositionStyles(),
    width: size.width,
    height: size.height,
    background: color,
    borderRadius,
    filter: `blur(${intensity}px)`,
    opacity,
    zIndex,
    pointerEvents: 'none',
    willChange: pulse && !prefersReducedMotion ? 'filter, opacity' : 'auto',
    ...style,
  };

  // Add pulse animation if enabled and user doesn't prefer reduced motion
  if (pulse && !prefersReducedMotion) {
    glowStyles.animation = `glow ${pulseDuration}s ease-in-out infinite`;
  }

  return <div className={className} style={glowStyles} />;
}

/**
 * Multi-color glow effect
 *
 * @example
 * ```tsx
 * <MultiGlow
 *   colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
 *   pulse
 * />
 * ```
 */
export function MultiGlow({
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'],
  spacing = 100,
  ...props
}: Omit<GlowEffectProps, 'color' | 'position'> & {
  colors?: string[];
  spacing?: number;
}) {
  return (
    <>
      {colors.map((color, index) => (
        <GlowEffect
          key={index}
          color={color}
          position="custom"
          customPosition={{
            top: `${50 + Math.sin(index * 2) * spacing}%`,
            left: `${50 + Math.cos(index * 2) * spacing}%`,
          }}
          {...props}
        />
      ))}
    </>
  );
}

/**
 * Animated gradient glow that shifts colors
 *
 * @example
 * ```tsx
 * <GradientGlow
 *   colors={['#FF6B6B', '#4ECDC4']}
 *   intensity={40}
 * />
 * ```
 */
export function GradientGlow({
  colors = ['#FF6B6B', '#4ECDC4'],
  angle = 45,
  ...props
}: Omit<GlowEffectProps, 'color'> & {
  colors?: string[];
  angle?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const gradient = `linear-gradient(${angle}deg, ${colors.join(', ')})`;

  const gradientGlowStyle: CSSProperties = {
    background: gradient,
    backgroundSize: '200% 200%',
  };

  if (!prefersReducedMotion) {
    gradientGlowStyle.animation = 'gradientShift 3s ease infinite';
  }

  return <GlowEffect {...props} style={gradientGlowStyle} />;
}

/**
 * Spotlight-style glow that follows content
 *
 * @example
 * ```tsx
 * <div style={{ position: 'relative' }}>
 *   <SpotlightGlow color="#4ECDC4" />
 *   <h1>Highlighted Content</h1>
 * </div>
 * ```
 */
export function SpotlightGlow({
  color = '#ffffff',
  size = '150%',
  ...props
}: Omit<GlowEffectProps, 'size'> & {
  size?: string;
}) {
  return (
    <GlowEffect
      color={color}
      position="center"
      size={{ width: size, height: size }}
      opacity={0.15}
      intensity={60}
      {...props}
    />
  );
}
