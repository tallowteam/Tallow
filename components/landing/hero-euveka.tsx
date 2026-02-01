'use client';

/**
 * EUVEKA-Style Hero Component
 *
 * Exact replica of euveka.com hero styling:
 * - Clip-path reveal for headlines
 * - Custom expo-out easing [0.16, 1, 0.3, 1]
 * - Floating blur orbs (84px blur)
 * - Scroll indicator with animated dot
 * - Split text animation support
 * - Full reduced motion support
 */

import * as React from 'react';
import { motion, useScroll, useTransform, useReducedMotion, type Easing, type Variants } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollIndicator } from './scroll-indicator';
import {
  EUVEKA_COLORS,
  EUVEKA_DURATIONS,
  EUVEKA_EASING,
  EUVEKA_BLUR,
  EUVEKA_STAGGER,
  euvekaHeadlineVariants,
  euvekaSubheadlineVariants,
  euvekaNavVariants,
  euvekaCTAVariants,
  createOrbFloatVariants,
} from '@/lib/animations/euveka-tokens';

// =============================================================================
// TYPES
// =============================================================================

export interface HeroEuvekaProps {
  /** Main headline text (use \n for line breaks) */
  headline?: string;
  /** Subheadline text */
  subheadline?: string;
  /** CTA button text */
  ctaText?: string;
  /** CTA button href */
  ctaHref?: string;
  /** Secondary CTA text */
  secondaryCtaText?: string;
  /** Secondary CTA href */
  secondaryCtaHref?: string;
  /** Background color */
  backgroundColor?: string;
  /** Whether to show scroll indicator */
  showScrollIndicator?: boolean;
  /** Number of floating orbs */
  orbCount?: number;
  /** Whether to animate headline as split text */
  splitTextAnimation?: boolean;
  /** Additional class names */
  className?: string;
  /** Children to render below CTA */
  children?: React.ReactNode;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_BACKGROUND = EUVEKA_COLORS.dark;
const GRID_SIZE = 80;

const ORB_POSITIONS = [
  { top: '15%', left: '10%', size: 180, delay: 0 },
  { top: '60%', left: '85%', size: 140, delay: 0.5 },
  { top: '75%', left: '20%', size: 120, delay: 1 },
  { top: '25%', right: '15%', size: 160, delay: 0.3 },
  { bottom: '20%', right: '30%', size: 100, delay: 0.8 },
  { top: '45%', left: '50%', size: 200, delay: 0.6 },
];

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: EUVEKA_DURATIONS.slow,
      staggerChildren: EUVEKA_STAGGER.relaxed,
      delayChildren: 0.2,
    },
  },
};

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

/**
 * Grid Pattern Background
 */
const GridPattern = React.memo(function GridPattern({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={cn('absolute inset-0 w-full h-full', className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="euveka-grid-pattern"
          x="0"
          y="0"
          width={GRID_SIZE}
          height={GRID_SIZE}
          patternUnits="userSpaceOnUse"
        >
          <line
            x1={GRID_SIZE}
            y1="0"
            x2={GRID_SIZE}
            y2={GRID_SIZE}
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.08"
          />
          <line
            x1="0"
            y1={GRID_SIZE}
            x2={GRID_SIZE}
            y2={GRID_SIZE}
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.08"
          />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#euveka-grid-pattern)" />
    </svg>
  );
});

GridPattern.displayName = 'GridPattern';

/**
 * Floating Blur Orb
 * Uses 84px blur as per EUVEKA spec
 */
const BlurOrb = React.memo(function BlurOrb({
  style,
  size = 120,
  delay = 0,
  reducedMotion = false,
}: {
  style?: React.CSSProperties;
  size?: number;
  delay?: number;
  reducedMotion?: boolean;
}) {
  const floatVariants = React.useMemo(() => createOrbFloatVariants(delay), [delay]);

  // Merge styles safely for motion component
  const orbStyle = React.useMemo(() => ({
    width: size,
    height: size,
    background: `radial-gradient(circle, ${EUVEKA_COLORS.lightAlpha[15]} 0%, ${EUVEKA_COLORS.lightAlpha[10]} 50%, transparent 70%)`,
    filter: `blur(${EUVEKA_BLUR.orb}px)`,
    top: style?.top,
    left: style?.left,
    right: style?.right,
    bottom: style?.bottom,
  }), [size, style?.top, style?.left, style?.right, style?.bottom]);

  // Handle variants to avoid undefined issues with exactOptionalPropertyTypes
  const orbVariants = reducedMotion ? {} : floatVariants;
  const orbAnimate = reducedMotion ? 'initial' : 'animate';

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={orbStyle}
      variants={orbVariants}
      initial="initial"
      animate={orbAnimate}
      aria-hidden="true"
    />
  );
});

BlurOrb.displayName = 'BlurOrb';

/**
 * Minimal Navigation Bar
 */
const MinimalNav = React.memo(function MinimalNav({
  ctaText = 'Get Started',
  ctaHref = '/app',
}: {
  ctaText?: string;
  ctaHref?: string;
}) {
  return (
    <motion.nav
      className="absolute top-0 left-0 right-0 z-50 px-6 sm:px-8 lg:px-12 py-6"
      variants={euvekaNavVariants}
      aria-label="Main navigation"
    >
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-light tracking-wider hover:opacity-80 transition-opacity duration-300"
          style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            color: EUVEKA_COLORS.light,
          }}
        >
          TALLOW
        </Link>
        <Button
          asChild
          variant="outline"
          size="sm"
          className={cn(
            'rounded-full px-6',
            'border-[1px] transition-all duration-300',
            'hover:bg-[#fefefc] hover:text-[#191610]'
          )}
          style={{
            borderColor: EUVEKA_COLORS.lightAlpha[30],
            color: EUVEKA_COLORS.light,
          }}
        >
          <Link href={ctaHref}>{ctaText}</Link>
        </Button>
      </div>
    </motion.nav>
  );
});

MinimalNav.displayName = 'MinimalNav';

/**
 * Stagger container for split text
 */
const splitTextContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: EUVEKA_STAGGER.tight,
      delayChildren: 0,
    },
  },
};

const splitTextCharVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    rotateX: -90,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: EUVEKA_DURATIONS.slow,
      ease: EUVEKA_EASING as Easing,
    },
  },
};

/**
 * Split Text Animation Component
 * Animates each character individually
 */
const SplitText = React.memo(function SplitText({
  text,
  className,
  reducedMotion = false,
}: {
  text: string;
  className?: string;
  reducedMotion?: boolean;
}) {
  const characters = text.split('');

  if (reducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <motion.span
      className={cn('inline-block', className)}
      variants={splitTextContainerVariants}
    >
      {characters.map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          className="inline-block"
          variants={splitTextCharVariants}
          style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
});

SplitText.displayName = 'SplitText';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const HeroEuveka = React.forwardRef<HTMLElement, HeroEuvekaProps>(
  function HeroEuveka(
    {
      headline = 'Transfer Without\nLimits',
      subheadline = 'End-to-end encrypted file sharing with post-quantum security. No accounts, no tracking, no limits.',
      ctaText = 'Start Transfer',
      ctaHref = '/app',
      secondaryCtaText,
      secondaryCtaHref,
      backgroundColor = DEFAULT_BACKGROUND,
      showScrollIndicator = true,
      orbCount = 5,
      splitTextAnimation = false,
      className,
      children,
    },
    ref
  ) {
    const prefersReducedMotion = useReducedMotion();
    const { scrollYProgress } = useScroll();

    // Parallax transforms (disabled for reduced motion)
    const headlineY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
    const gridOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    const orbsOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

    // Memoized orbs data
    const orbs = React.useMemo(() => {
      return ORB_POSITIONS.slice(0, orbCount).map((pos, index) => ({
        ...pos,
        key: `orb-${index}`,
      }));
    }, [orbCount]);

    // Split headline into lines
    const headlineLines = headline.split('\n');

    return (
      <motion.section
        ref={ref}
        className={cn('relative min-h-screen w-full overflow-hidden', className)}
        style={{ backgroundColor }}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        aria-label="Hero section"
      >
        {/* Grid Pattern Background */}
        <motion.div
          className="absolute inset-0"
          style={{
            color: EUVEKA_COLORS.light,
            opacity: prefersReducedMotion ? 1 : gridOpacity,
          }}
        >
          <GridPattern />
        </motion.div>

        {/* Floating Blur Orbs */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: prefersReducedMotion ? 1 : orbsOpacity }}
        >
          {orbs.map((orb) => (
            <BlurOrb
              key={orb.key}
              size={orb.size}
              delay={orb.delay}
              reducedMotion={Boolean(prefersReducedMotion)}
              style={{
                top: orb.top,
                left: orb.left,
                right: orb.right,
                bottom: orb.bottom,
              }}
            />
          ))}
        </motion.div>

        {/* Minimal Navigation */}
        <MinimalNav ctaText={ctaText} ctaHref={ctaHref} />

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 lg:px-12">
          <motion.div
            className="max-w-5xl mx-auto text-center"
            style={{ y: prefersReducedMotion ? 0 : headlineY }}
          >
            {/* Main Headline with Clip-Path Reveal */}
            <motion.h1
              className="font-light tracking-tight leading-[0.95]"
              style={{
                fontSize: 'clamp(3rem, 10vw, 8rem)',
                letterSpacing: '-0.03em',
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
                color: EUVEKA_COLORS.light,
              }}
              variants={euvekaHeadlineVariants}
            >
              {headlineLines.map((line, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <br />}
                  {splitTextAnimation ? (
                    <SplitText
                      text={line}
                      reducedMotion={Boolean(prefersReducedMotion)}
                    />
                  ) : (
                    <span className="block">{line}</span>
                  )}
                </React.Fragment>
              ))}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="mt-8 sm:mt-12 max-w-2xl mx-auto"
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                lineHeight: 1.6,
                color: EUVEKA_COLORS.lightAlpha[70],
              }}
              variants={euvekaSubheadlineVariants}
            >
              {subheadline}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={euvekaCTAVariants}
            >
              {/* Primary CTA */}
              <Button
                asChild
                size="lg"
                className={cn(
                  'h-16 px-12 text-lg rounded-full border-0',
                  'transition-all duration-500',
                  'hover:scale-[1.02]'
                )}
                style={{
                  backgroundColor: EUVEKA_COLORS.light,
                  color: EUVEKA_COLORS.dark,
                  boxShadow: `0 0 40px ${EUVEKA_COLORS.lightAlpha[15]}`,
                }}
              >
                <Link href={ctaHref}>{ctaText}</Link>
              </Button>

              {/* Secondary CTA (optional) */}
              {secondaryCtaText && secondaryCtaHref && (
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className={cn(
                    'h-16 px-12 text-lg rounded-full',
                    'transition-all duration-300',
                    'hover:bg-white/5'
                  )}
                  style={{
                    color: EUVEKA_COLORS.lightAlpha[70],
                  }}
                >
                  <Link href={secondaryCtaHref}>{secondaryCtaText}</Link>
                </Button>
              )}
            </motion.div>

            {/* Optional children */}
            {children && <div className="mt-12">{children}</div>}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <ScrollIndicator
            text="SCROLL TO REVEAL"
            color={EUVEKA_COLORS.light}
            bottom={32}
          />
        )}

        {/* Bottom Gradient Fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${backgroundColor}, transparent)`,
          }}
          aria-hidden="true"
        />
      </motion.section>
    );
  }
);

HeroEuveka.displayName = 'HeroEuveka';

// =============================================================================
// EXPORTS
// =============================================================================

export default HeroEuveka;
export { GridPattern, BlurOrb, MinimalNav, SplitText };
