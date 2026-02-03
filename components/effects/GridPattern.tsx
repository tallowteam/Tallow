/**
 * GridPattern Component
 *
 * SVG-based background grid pattern with fade at edges.
 * Lightweight and performant.
 */

'use client';

import { CSSProperties } from 'react';

export interface GridPatternProps {
  /**
   * Grid cell width
   * @default 40
   */
  width?: number;

  /**
   * Grid cell height
   * @default 40
   */
  height?: number;

  /**
   * Grid line color
   * @default '#333333'
   */
  strokeColor?: string;

  /**
   * Grid line width
   * @default 1
   */
  strokeWidth?: number;

  /**
   * Grid line opacity
   * @default 0.2
   */
  opacity?: number;

  /**
   * Enable fade at edges
   * @default true
   */
  fade?: boolean;

  /**
   * Fade intensity (0-1)
   * @default 0.8
   */
  fadeIntensity?: number;

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
   * Animated grid lines
   * @default false
   */
  animated?: boolean;

  /**
   * Animation duration in seconds
   * @default 20
   */
  animationDuration?: number;
}

/**
 * GridPattern component for background decoration
 *
 * @example
 * ```tsx
 * <div style={{ position: 'relative' }}>
 *   <GridPattern strokeColor="#4ECDC4" fade />
 *   <div>Content over grid</div>
 * </div>
 * ```
 */
export function GridPattern({
  width = 40,
  height = 40,
  strokeColor = '#333333',
  strokeWidth = 1,
  opacity = 0.2,
  fade = true,
  fadeIntensity = 0.8,
  className = '',
  style = {},
  zIndex = -1,
  animated = false,
  animationDuration = 20,
}: GridPatternProps) {
  const patternId = `grid-pattern-${Math.random().toString(36).substr(2, 9)}`;
  const maskId = `grid-mask-${Math.random().toString(36).substr(2, 9)}`;

  const containerStyles: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    zIndex,
    pointerEvents: 'none',
    overflow: 'hidden',
    ...style,
  };

  const svgStyles: CSSProperties = {
    width: '100%',
    height: '100%',
  };

  if (animated) {
    svgStyles.animation = `float ${animationDuration}s ease-in-out infinite`;
  }

  return (
    <div className={className} style={containerStyles}>
      <svg style={svgStyles}>
        <defs>
          {/* Grid pattern definition */}
          <pattern
            id={patternId}
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${width} 0 L 0 0 0 ${height}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              opacity={opacity}
            />
          </pattern>

          {/* Radial gradient mask for fade effect */}
          {fade && (
            <radialGradient id={maskId}>
              <stop offset="0%" stopColor="white" stopOpacity={fadeIntensity} />
              <stop offset="70%" stopColor="white" stopOpacity={fadeIntensity * 0.5} />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          )}
        </defs>

        {/* Apply grid pattern */}
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
          mask={fade ? `url(#${maskId})` : undefined}
        />
      </svg>
    </div>
  );
}

/**
 * Dotted grid pattern variant
 *
 * @example
 * ```tsx
 * <DotPattern spacing={30} size={2} color="#4ECDC4" />
 * ```
 */
export function DotPattern({
  spacing = 30,
  size = 2,
  color = '#333333',
  opacity = 0.3,
  fade = true,
  className = '',
  style = {},
  zIndex = -1,
}: {
  spacing?: number;
  size?: number;
  color?: string;
  opacity?: number;
  fade?: boolean;
  className?: string;
  style?: CSSProperties;
  zIndex?: number;
}) {
  const patternId = `dot-pattern-${Math.random().toString(36).substr(2, 9)}`;
  const maskId = `dot-mask-${Math.random().toString(36).substr(2, 9)}`;

  const containerStyles: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    zIndex,
    pointerEvents: 'none',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div className={className} style={containerStyles}>
      <svg width="100%" height="100%">
        <defs>
          {/* Dot pattern definition */}
          <pattern
            id={patternId}
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={spacing / 2}
              cy={spacing / 2}
              r={size}
              fill={color}
              opacity={opacity}
            />
          </pattern>

          {/* Radial gradient mask for fade effect */}
          {fade && (
            <radialGradient id={maskId}>
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="70%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          )}
        </defs>

        {/* Apply dot pattern */}
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
          mask={fade ? `url(#${maskId})` : undefined}
        />
      </svg>
    </div>
  );
}

/**
 * Diagonal lines pattern
 *
 * @example
 * ```tsx
 * <DiagonalPattern spacing={20} angle={45} color="#4ECDC4" />
 * ```
 */
export function DiagonalPattern({
  spacing = 20,
  angle = 45,
  strokeWidth = 1,
  color = '#333333',
  opacity = 0.2,
  fade = true,
  className = '',
  style = {},
  zIndex = -1,
}: {
  spacing?: number;
  angle?: number;
  strokeWidth?: number;
  color?: string;
  opacity?: number;
  fade?: boolean;
  className?: string;
  style?: CSSProperties;
  zIndex?: number;
}) {
  const patternId = `diagonal-pattern-${Math.random().toString(36).substr(2, 9)}`;
  const maskId = `diagonal-mask-${Math.random().toString(36).substr(2, 9)}`;

  const containerStyles: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    zIndex,
    pointerEvents: 'none',
    overflow: 'hidden',
    transform: `rotate(${angle}deg)`,
    ...style,
  };

  return (
    <div className={className} style={containerStyles}>
      <svg width="100%" height="100%">
        <defs>
          {/* Diagonal lines pattern */}
          <pattern
            id={patternId}
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1={spacing}
              x2={spacing}
              y2="0"
              stroke={color}
              strokeWidth={strokeWidth}
              opacity={opacity}
            />
          </pattern>

          {/* Radial gradient mask for fade effect */}
          {fade && (
            <radialGradient id={maskId}>
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="70%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          )}
        </defs>

        {/* Apply diagonal pattern */}
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
          mask={fade ? `url(#${maskId})` : undefined}
        />
      </svg>
    </div>
  );
}

/**
 * Hexagon pattern
 *
 * @example
 * ```tsx
 * <HexagonPattern size={30} color="#4ECDC4" />
 * ```
 */
export function HexagonPattern({
  size = 30,
  strokeWidth = 1,
  color = '#333333',
  opacity = 0.2,
  fade = true,
  className = '',
  style = {},
  zIndex = -1,
}: {
  size?: number;
  strokeWidth?: number;
  color?: string;
  opacity?: number;
  fade?: boolean;
  className?: string;
  style?: CSSProperties;
  zIndex?: number;
}) {
  const patternId = `hexagon-pattern-${Math.random().toString(36).substr(2, 9)}`;
  const maskId = `hexagon-mask-${Math.random().toString(36).substr(2, 9)}`;

  const width = size * Math.sqrt(3);
  const height = size * 2;

  const containerStyles: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    zIndex,
    pointerEvents: 'none',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div className={className} style={containerStyles}>
      <svg width="100%" height="100%">
        <defs>
          {/* Hexagon pattern */}
          <pattern
            id={patternId}
            width={width}
            height={height * 0.75}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`
                M ${width / 2} 0
                L ${width} ${size / 2}
                L ${width} ${(size * 3) / 2}
                L ${width / 2} ${size * 2}
                L 0 ${(size * 3) / 2}
                L 0 ${size / 2}
                Z
              `}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              opacity={opacity}
            />
          </pattern>

          {/* Radial gradient mask for fade effect */}
          {fade && (
            <radialGradient id={maskId}>
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="70%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          )}
        </defs>

        {/* Apply hexagon pattern */}
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
          mask={fade ? `url(#${maskId})` : undefined}
        />
      </svg>
    </div>
  );
}
