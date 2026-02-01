'use client';

/**
 * Scroll Progress Components
 * Page scroll progress indicators
 * Fixed at top or customizable position
 */

import * as React from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * ScrollProgress - Horizontal progress bar fixed at top
 */
export interface ScrollProgressProps {
  /** Container element to track (defaults to window) */
  container?: React.RefObject<HTMLElement | null>;
  /** Position of the progress bar */
  position?: 'top' | 'bottom';
  /** Height of the progress bar */
  height?: number;
  /** Background color (track) */
  trackColor?: string;
  /** Progress bar color */
  progressColor?: string;
  /** Whether to use gradient */
  gradient?: boolean;
  /** Gradient colors (if gradient is true) */
  gradientColors?: string[];
  /** Z-index of the progress bar */
  zIndex?: number;
  /** Class name for the container */
  className?: string;
  /** Class name for the progress bar */
  progressClassName?: string;
  /** Whether to show percentage text */
  showPercentage?: boolean;
  /** Spring animation config */
  springConfig?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
}

export function ScrollProgress({
  container,
  position = 'top',
  height = 3,
  trackColor = 'transparent',
  progressColor,
  gradient = false,
  gradientColors = ['#fefefc', '#fefefc', '#b2987d'],
  zIndex = 50,
  className,
  progressClassName,
  showPercentage = false,
  springConfig = { stiffness: 100, damping: 30, mass: 0.5 },
}: ScrollProgressProps) {
  const prefersReducedMotion = useReducedMotion();

  // Handle container properly for useScroll
  const scrollOptions = container?.current
    ? { container: container as React.RefObject<HTMLElement> }
    : {};
  const { scrollYProgress } = useScroll(scrollOptions);

  // Apply spring animation for smooth progress (unless reduced motion)
  const scaleX = useSpring(scrollYProgress, prefersReducedMotion ? {} : springConfig);

  // Calculate percentage for display
  const percentage = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const [displayPercentage, setDisplayPercentage] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = percentage.on('change', (value) => {
      setDisplayPercentage(Math.round(value));
    });
    return unsubscribe;
  }, [percentage]);

  const getGradient = () => {
    if (!gradient || gradientColors.length < 2) {return undefined;}
    return `linear-gradient(90deg, ${gradientColors.join(', ')})`;
  };

  const positionStyles = {
    top: { top: 0 },
    bottom: { bottom: 0 },
  };

  return (
    <div
      className={cn('fixed left-0 right-0', className)}
      style={{
        ...positionStyles[position],
        zIndex,
        height,
        backgroundColor: trackColor,
      }}
      role="progressbar"
      aria-valuenow={displayPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
    >
      <motion.div
        className={cn('h-full origin-left', progressClassName)}
        style={{
          scaleX,
          background: gradient ? getGradient() : progressColor || 'hsl(var(--primary))',
        }}
      />
      {showPercentage && (
        <span className="sr-only">{displayPercentage}% scrolled</span>
      )}
    </div>
  );
}

ScrollProgress.displayName = 'ScrollProgress';

/**
 * ScrollProgressCircle - Circular scroll progress indicator
 */
export interface ScrollProgressCircleProps {
  /** Size of the circle (diameter in pixels) */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Track color */
  trackColor?: string;
  /** Progress color */
  progressColor?: string;
  /** Whether to show percentage */
  showPercentage?: boolean;
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Offset from edge (pixels) */
  offset?: number;
  /** Z-index */
  zIndex?: number;
  /** Class name */
  className?: string;
  /** Whether to show scroll-to-top button when clicked */
  scrollToTop?: boolean;
  /** Container element to track */
  container?: React.RefObject<HTMLElement | null>;
}

export function ScrollProgressCircle({
  size = 48,
  strokeWidth = 3,
  trackColor,
  progressColor,
  showPercentage = true,
  position = 'bottom-right',
  offset = 24,
  zIndex = 50,
  className,
  scrollToTop = true,
  container,
}: ScrollProgressCircleProps) {
  const prefersReducedMotion = useReducedMotion();

  // Handle container properly for useScroll
  const scrollOptions = container?.current
    ? { container: container as React.RefObject<HTMLElement> }
    : {};
  const { scrollYProgress } = useScroll(scrollOptions);

  // Spring animation for smooth progress
  const progress = useSpring(
    scrollYProgress,
    prefersReducedMotion
      ? {}
      : {
          stiffness: 100,
          damping: 30,
          mass: 0.5,
        }
  );

  // Calculate percentage
  const percentage = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const [displayPercentage, setDisplayPercentage] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const unsubscribePercentage = percentage.on('change', (value) => {
      setDisplayPercentage(Math.round(value));
      setIsVisible(value > 5); // Show after 5% scroll
    });
    return unsubscribePercentage;
  }, [percentage]);

  // Calculate SVG properties
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // Create stroke dash offset motion value
  const strokeDashoffset = useTransform(
    progress,
    (p: number) => circumference * (1 - p)
  );

  // Position styles
  const positionStyles: Record<string, React.CSSProperties> = {
    'bottom-right': { bottom: offset, right: offset },
    'bottom-left': { bottom: offset, left: offset },
    'top-right': { top: offset, right: offset },
    'top-left': { top: offset, left: offset },
  };

  const handleClick = () => {
    if (scrollToTop) {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  };

  return (
    <motion.button
      className={cn(
        'fixed flex items-center justify-center rounded-full',
        'bg-background/80 backdrop-blur-sm border border-border',
        'shadow-lg transition-colors',
        scrollToTop && 'cursor-pointer hover:bg-background',
        className
      )}
      style={{
        ...positionStyles[position],
        width: size,
        height: size,
        zIndex,
      } as any}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0.8,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
      onClick={handleClick}
      aria-label={
        scrollToTop
          ? `${displayPercentage}% scrolled, click to scroll to top`
          : `${displayPercentage}% scrolled`
      }
      role="progressbar"
      aria-valuenow={displayPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track circle - EUVEKA styled */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          className="stroke-[#e5dac7] dark:stroke-[#544a36]"
          style={trackColor ? { stroke: trackColor } : undefined}
        />
        {/* Progress circle - EUVEKA styled */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          className="stroke-[#fefefc]"
          style={{
            strokeDashoffset,
            ...(progressColor ? { stroke: progressColor } : {}),
          }}
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-xs font-medium text-foreground">
          {displayPercentage}
        </span>
      )}
    </motion.button>
  );
}

ScrollProgressCircle.displayName = 'ScrollProgressCircle';

/**
 * ScrollIndicator - Subtle scroll down indicator
 */
export interface ScrollIndicatorProps {
  /** Text to display */
  text?: string;
  /** Whether to hide after scrolling */
  hideOnScroll?: boolean;
  /** Scroll threshold to hide (pixels) */
  hideThreshold?: number;
  /** Class name */
  className?: string;
  /** Animation type */
  animation?: 'bounce' | 'pulse' | 'arrow';
}

export function ScrollIndicator({
  text = 'Scroll',
  hideOnScroll = true,
  hideThreshold = 100,
  className,
  animation = 'bounce',
}: ScrollIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (!hideOnScroll) {return;}

    const handleScroll = () => {
      setIsVisible(window.scrollY < hideThreshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hideOnScroll, hideThreshold]);

  const getAnimationVariant = (): { y?: number | number[]; opacity?: number | number[]; transition?: object } => {
    if (prefersReducedMotion) {
      return { y: 0, opacity: 1 };
    }

    switch (animation) {
      case 'bounce':
        return {
          y: [0, 8, 0],
          transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'pulse':
        return {
          opacity: [1, 0.5, 1],
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'arrow':
        return {
          y: [0, 4, 0],
          opacity: [1, 0.7, 1],
          transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
        };
      default:
        return { y: 0, opacity: 1 };
    }
  };

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center gap-2 text-muted-foreground',
        className
      )}
      initial={{ opacity: 1 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
    >
      {text && <span className="text-sm">{text}</span>}
      <motion.div animate={getAnimationVariant()}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

ScrollIndicator.displayName = 'ScrollIndicator';

/**
 * SectionProgress - Progress indicator for sections
 * Shows which section is currently in view
 */
export interface SectionProgressProps {
  /** Section IDs to track */
  sections: Array<{
    id: string;
    label: string;
  }>;
  /** Position on screen */
  position?: 'left' | 'right';
  /** Offset from edge (pixels) */
  offset?: number;
  /** Class name */
  className?: string;
  /** Active dot color */
  activeColor?: string;
  /** Inactive dot color */
  inactiveColor?: string;
}

export function SectionProgress({
  sections,
  position = 'right',
  offset = 24,
  className,
  activeColor = '#fefefc',
  inactiveColor = '#b2987d',
}: SectionProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeSection, setActiveSection] = React.useState(sections[0]?.id || '');

  React.useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (!element) {return;}

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(section.id);
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [sections]);

  const handleClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  };

  const positionStyles: Record<string, React.CSSProperties> = {
    left: { left: offset },
    right: { right: offset },
  };

  return (
    <nav
      className={cn(
        'fixed top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40',
        className
      )}
      style={positionStyles[position]}
      aria-label="Section navigation"
    >
      {sections.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => handleClick(section.id)}
            className="group flex items-center gap-2"
            aria-current={isActive ? 'true' : undefined}
          >
            <motion.div
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                backgroundColor: isActive ? activeColor : inactiveColor,
              }}
              animate={
                isActive && !prefersReducedMotion
                  ? { scale: [1, 1.3, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.3 }}
            />
            <span
              className={cn(
                'text-xs whitespace-nowrap transition-opacity',
                position === 'right' ? 'order-first' : 'order-last',
                'opacity-0 group-hover:opacity-100',
                isActive && 'opacity-100 font-medium'
              )}
              style={{ color: isActive ? activeColor : undefined }}
            >
              {section.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

SectionProgress.displayName = 'SectionProgress';
