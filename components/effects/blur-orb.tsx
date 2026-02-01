'use client';

/**
 * Performance-Optimized Blur Orb Component
 *
 * Euveka-style decorative blur orb that automatically:
 * - Disables on mobile/touch devices
 * - Reduces blur amount on tablets
 * - Uses CSS containment for performance
 * - Respects reduced motion preferences
 */

import { memo } from 'react';
import { usePerformanceMode, getOptimizedBlur } from '@/lib/hooks/use-performance-mode';
import { cn } from '@/lib/utils';

interface BlurOrbProps {
  /** Size preset for the orb */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Position preset */
  position?: 'center' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'custom';
  /** Custom position styles (when position='custom') */
  customPosition?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  /** Opacity of the orb (0-1) */
  opacity?: number;
  /** Color of the orb */
  color?: 'white' | 'warm' | 'accent';
  /** Additional classes */
  className?: string;
}

const sizeConfig = {
  sm: { width: 200, height: 150, blur: 40 },
  md: { width: 400, height: 300, blur: 60 },
  lg: { width: 600, height: 450, blur: 80 },
  xl: { width: 800, height: 600, blur: 120 },
};

const positionClasses = {
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'top-right': 'top-[20%] right-[15%]',
  'top-left': 'top-[20%] left-[15%]',
  'bottom-right': 'bottom-[20%] right-[15%]',
  'bottom-left': 'bottom-[30%] left-[10%]',
  custom: '',
};

const colorMap = {
  white: 'rgba(255, 255, 255,',
  warm: 'rgba(254, 254, 252,',
  accent: 'rgba(84, 74, 54,',
};

export const BlurOrb = memo(function BlurOrb({
  size = 'lg',
  position = 'center',
  customPosition,
  opacity = 0.02,
  color = 'white',
  className,
}: BlurOrbProps) {
  const perf = usePerformanceMode();

  // Don't render blur orbs on mobile/low-power devices
  if (perf.reduceBlur) {
    return null;
  }

  const config = sizeConfig[size];
  const effectiveBlur = getOptimizedBlur(config.blur, perf);
  const colorBase = colorMap[color];

  return (
    <div
      className={cn(
        'absolute rounded-full pointer-events-none',
        positionClasses[position],
        className
      )}
      style={{
        width: config.width,
        height: config.height,
        backgroundColor: `${colorBase}${opacity})`,
        filter: `blur(${effectiveBlur}px)`,
        willChange: 'auto',
        contain: 'strict',
        contentVisibility: 'auto',
        ...customPosition,
      }}
      aria-hidden="true"
    />
  );
});

BlurOrb.displayName = 'BlurOrb';

export default BlurOrb;
