/**
 * GradientText Component
 *
 * Animated gradient text with customizable colors.
 * Responsive font sizing and optional animation.
 */

'use client';

import React, { CSSProperties } from 'react';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';

export interface GradientTextProps {
  /**
   * Text content
   */
  children: React.ReactNode;

  /**
   * Gradient colors (2-4 colors recommended)
   * @default ['#ffffff', '#888888']
   */
  colors?: string[];

  /**
   * Gradient angle in degrees
   * @default 90
   */
  angle?: number;

  /**
   * Enable gradient animation
   * @default false
   */
  animate?: boolean;

  /**
   * Animation duration in seconds
   * @default 3
   */
  animationDuration?: number;

  /**
   * Element tag to render
   * @default 'span'
   */
  as?: keyof React.JSX.IntrinsicElements;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Inline styles
   */
  style?: CSSProperties;

  /**
   * Font size
   */
  fontSize?: string | number;

  /**
   * Font weight
   */
  fontWeight?: string | number;
}

/**
 * GradientText component with optional animation
 *
 * @example
 * ```tsx
 * <GradientText
 *   colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
 *   animate
 *   fontSize="3rem"
 * >
 *   Animated Gradient Text
 * </GradientText>
 * ```
 */
export function GradientText({
  children,
  colors = ['#ffffff', '#888888'],
  angle = 90,
  animate = false,
  animationDuration = 3,
  as: Component = 'span',
  className = '',
  style = {},
  fontSize,
  fontWeight,
}: GradientTextProps) {
  const prefersReducedMotion = useReducedMotion();

  // Build gradient string
  const gradientColors = colors.join(', ');
  const gradient = `linear-gradient(${angle}deg, ${gradientColors})`;

  // For animation, we need a larger gradient background
  const animatedGradient = animate
    ? `linear-gradient(${angle}deg, ${colors.join(', ')}, ${colors[0]})`
    : gradient;

  const gradientStyles: CSSProperties & Record<string, any> = {
    background: animatedGradient,
    backgroundSize: animate ? '200% 200%' : '100% 100%',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    ...(fontSize && { fontSize }),
    ...(fontWeight && { fontWeight }),
    ...style,
  };

  // Add animation if enabled and user doesn't prefer reduced motion
  if (animate && !prefersReducedMotion) {
    gradientStyles.animation = `gradientShift ${animationDuration}s ease infinite`;
  }

  return (
    <Component className={className} style={gradientStyles}>
      {children}
    </Component>
  );
}

/**
 * Predefined gradient presets
 */
export const GradientPresets = {
  sunset: ['#FF512F', '#F09819'],
  ocean: ['#2E3192', '#1BFFFF'],
  forest: ['#134E5E', '#71B280'],
  fire: ['#F00000', '#DC281E'],
  purple: ['#7F00FF', '#E100FF'],
  blue: ['#00C6FF', '#0072FF'],
  pink: ['#FF6B9D', '#C06C84'],
  gold: ['#FFD700', '#FFA500'],
  silver: ['#C0C0C0', '#808080'],
  rainbow: ['#FF0080', '#FF8C00', '#40E0D0', '#4169E1', '#9370DB'],
  monochrome: ['#ffffff', '#888888', '#333333'],
  neon: ['#00F5FF', '#FF00FF', '#00FF00'],
  pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF'],
} as const;

/**
 * GradientText with preset colors
 *
 * @example
 * ```tsx
 * <PresetGradientText preset="sunset" animate>
 *   Beautiful Sunset
 * </PresetGradientText>
 * ```
 */
export function PresetGradientText({
  preset,
  ...props
}: Omit<GradientTextProps, 'colors'> & {
  preset: keyof typeof GradientPresets;
}) {
  const colors = [...GradientPresets[preset]];
  return <GradientText colors={colors} {...props} />;
}

/**
 * Responsive gradient text with automatic font sizing
 *
 * @example
 * ```tsx
 * <ResponsiveGradientText
 *   colors={['#FF6B6B', '#4ECDC4']}
 *   desktopSize="4rem"
 *   mobileSize="2rem"
 * >
 *   Responsive Text
 * </ResponsiveGradientText>
 * ```
 */
export function ResponsiveGradientText({
  desktopSize = '3rem',
  tabletSize = '2.5rem',
  mobileSize = '2rem',
  ...props
}: Omit<GradientTextProps, 'fontSize'> & {
  desktopSize?: string;
  tabletSize?: string;
  mobileSize?: string;
}) {
  const responsiveStyles: CSSProperties = {
    fontSize: mobileSize,
    ...(props.style || {}),
  };

  return (
    <>
      <style jsx>{`
        @media (min-width: 768px) {
          .responsive-gradient {
            font-size: ${tabletSize};
          }
        }
        @media (min-width: 1024px) {
          .responsive-gradient {
            font-size: ${desktopSize};
          }
        }
      `}</style>
      <GradientText
        {...props}
        className={`responsive-gradient ${props.className || ''}`}
        style={responsiveStyles}
      />
    </>
  );
}
