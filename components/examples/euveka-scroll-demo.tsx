/**
 * Euveka Scroll Animation Demo Component
 *
 * Demonstrates usage of:
 * - useScrollProgress: Global scroll tracking
 * - useSectionInView: Section visibility tracking
 * - useAnimationPreferences: Animation settings
 * - useEuvekaTheme: Theme integration
 *
 * This component showcases Euveka-style scroll animations with:
 * - Black and white color scheme
 * - White glow effects in dark mode
 * - Spring-based animations
 * - Reduced motion support
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  useScrollProgress,
  useSectionInView,
  useAnimationPreferences,
  useEuvekaTheme,
  useStaggerDelay,
  useGlowEffect,
} from '@/lib/context';

// ============================================================================
// SECTION COMPONENT WITH IN-VIEW TRACKING
// ============================================================================

interface AnimatedSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  index: number;
}

function AnimatedSection({
  id,
  title,
  children,
  className,
  index,
}: AnimatedSectionProps) {
  const { ref, isInView, hasBeenInView, scrollProgress, setAsActive } =
    useSectionInView({
      sectionId: id,
      threshold: 0.3,
      trackScrollProgress: true,
      onEnter: () => {
        console.log(`Section ${id} entered view`);
        setAsActive();
      },
    });

  const { getMotionTransition, reducedMotion } = useAnimationPreferences();
  const staggerDelay = useStaggerDelay(index);
  const { enabled: glowEnabled, className: glowClass } = useGlowEffect();

  const transition = getMotionTransition('default');

  return (
    <motion.section
      ref={ref as React.RefObject<HTMLElement>}
      id={id}
      className={cn(
        'min-h-screen flex flex-col items-center justify-center p-8',
        'relative overflow-hidden',
        className
      )}
      initial={{ opacity: 0, y: 50 }}
      animate={
        hasBeenInView
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 50 }
      }
      transition={{
        ...transition,
        delay: reducedMotion ? 0 : staggerDelay / 1000,
      }}
    >
      {/* Section progress indicator */}
      <div
        className="absolute top-0 left-0 h-1 bg-primary transition-all duration-300"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      {/* Content */}
      <motion.div
        className={cn(
          'max-w-2xl text-center',
          glowEnabled && isInView && glowClass
        )}
        whileHover={reducedMotion ? {} : {
          scale: 1.02,
          boxShadow: '0 0 30px rgba(254, 254, 252, 0.3)',
        }}
      >
        <h2 className="font-display text-display-md mb-6 text-gradient-white">
          {title}
        </h2>
        <div className="text-text-secondary">{children}</div>

        {/* Visibility status */}
        <div className="mt-8 text-xs text-text-muted">
          <span className="inline-flex items-center gap-2">
            <span
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                isInView ? 'bg-success-500' : 'bg-muted'
              )}
            />
            {isInView ? 'In View' : 'Out of View'}
          </span>
          <span className="mx-4">|</span>
          <span>Progress: {Math.round(scrollProgress * 100)}%</span>
        </div>
      </motion.div>
    </motion.section>
  );
}

// ============================================================================
// SCROLL PROGRESS INDICATOR
// ============================================================================

function ScrollProgressIndicator() {
  const { progress, direction, isScrolling, velocity, scrollToTop } =
    useScrollProgress();
  const { isDark, glow } = useEuvekaTheme();
  const { reducedMotion } = useAnimationPreferences();

  return (
    <motion.div
      className={cn(
        'fixed top-4 right-4 z-50',
        'p-4 rounded-organic bg-card/80 backdrop-blur-lg',
        'border border-border shadow-elevated'
      )}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="text-sm space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-muted">Progress</span>
          <span className="font-mono text-primary">
            {Math.round(progress * 100)}%
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-text-muted">Direction</span>
          <span
            className={cn(
              'font-mono',
              direction === 'up' && 'text-success-500',
              direction === 'down' && 'text-warning-500',
              direction === 'none' && 'text-text-muted'
            )}
          >
            {direction}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-text-muted">Velocity</span>
          <span className="font-mono text-primary">{velocity.toFixed(0)}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-text-muted">Scrolling</span>
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isScrolling ? 'bg-success-500 animate-pulse' : 'bg-muted'
            )}
          />
        </div>

        {/* Scroll to top button */}
        <motion.button
          onClick={() => scrollToTop(!reducedMotion)}
          className={cn(
            'w-full mt-2 py-2 rounded-lg',
            'bg-primary text-primary-foreground',
            'hover:opacity-90 transition-opacity'
          )}
          {...(reducedMotion
            ? {}
            : {
                whileHover: { scale: 1.02 },
                whileTap: { scale: 0.98 },
              })}
          style={isDark ? { boxShadow: glow.boxShadow } : {}}
        >
          Scroll to Top
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// ANIMATION PREFERENCES PANEL
// ============================================================================

function AnimationPreferencesPanel() {
  const {
    preferences,
    reducedMotion,
    setReducedMotion,
    setSpeedMultiplier,
    setGlowEffects,
    setStagger,
    resetToDefaults,
  } = useAnimationPreferences();

  return (
    <motion.div
      className={cn(
        'fixed bottom-4 left-4 z-50',
        'p-4 rounded-organic bg-card/80 backdrop-blur-lg',
        'border border-border shadow-elevated',
        'max-w-xs'
      )}
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <h3 className="font-display text-lg mb-4 text-primary">
        Animation Settings
      </h3>

      <div className="space-y-3 text-sm">
        {/* Reduced Motion */}
        <label className="flex items-center justify-between">
          <span className="text-text-secondary">Reduced Motion</span>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked ? true : null)}
            className="rounded"
          />
        </label>

        {/* Glow Effects */}
        <label className="flex items-center justify-between">
          <span className="text-text-secondary">Glow Effects</span>
          <input
            type="checkbox"
            checked={preferences.enableGlowEffects}
            onChange={(e) => setGlowEffects(e.target.checked)}
            className="rounded"
            disabled={reducedMotion}
          />
        </label>

        {/* Stagger */}
        <label className="flex items-center justify-between">
          <span className="text-text-secondary">Stagger</span>
          <input
            type="checkbox"
            checked={preferences.enableStagger}
            onChange={(e) => setStagger(e.target.checked)}
            className="rounded"
            disabled={reducedMotion}
          />
        </label>

        {/* Speed Multiplier */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-text-secondary">Speed</span>
            <span className="font-mono text-primary">
              {preferences.speedMultiplier.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.25"
            max="2"
            step="0.25"
            value={preferences.speedMultiplier}
            onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
            className="w-full"
            disabled={reducedMotion}
          />
        </div>

        {/* Reset Button */}
        <button
          onClick={resetToDefaults}
          className={cn(
            'w-full py-2 rounded-lg text-xs',
            'bg-muted text-text-secondary',
            'hover:bg-muted/80 transition-colors'
          )}
        >
          Reset to Defaults
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN DEMO COMPONENT
// ============================================================================

export function EuvekaScrollDemo() {
  const { isDark, toggleTheme, mounted } = useEuvekaTheme();

  if (!mounted) {
    return null;
  }

  const sections = [
    {
      id: 'hero',
      title: 'Euveka Design System',
      content:
        'Experience elegant scroll animations with spring physics and white glow effects. This demo showcases the Zustand-based state management for scroll tracking.',
    },
    {
      id: 'features',
      title: 'Key Features',
      content:
        'Global scroll tracking, section visibility detection, animation completion states, reduced motion support, and seamless theme integration.',
    },
    {
      id: 'animations',
      title: 'Spring Animations',
      content:
        'Organic spring-based animations with configurable stiffness, damping, and mass. Adjust the speed multiplier to see how animations respond.',
    },
    {
      id: 'accessibility',
      title: 'Accessibility First',
      content:
        'Full support for reduced motion preferences. The system respects user settings while providing beautiful animations for those who want them.',
    },
    {
      id: 'conclusion',
      title: 'Start Building',
      content:
        'Use useScrollProgress, useSectionInView, and useAnimationPreferences to create engaging scroll experiences.',
    },
  ];

  return (
    <div
      className={cn(
        'min-h-screen',
        isDark ? 'bg-background text-foreground' : 'bg-background text-foreground'
      )}
    >
      {/* Fixed top progress bar */}
      <ProgressBar />

      {/* Scroll Progress Indicator */}
      <ScrollProgressIndicator />

      {/* Animation Preferences Panel */}
      <AnimationPreferencesPanel />

      {/* Theme Toggle */}
      <motion.button
        onClick={toggleTheme}
        className={cn(
          'fixed top-4 left-4 z-50',
          'p-3 rounded-xl',
          'bg-card/80 backdrop-blur-lg',
          'border border-border',
          'text-primary'
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isDark ? 'Light' : 'Dark'}
      </motion.button>

      {/* Sections */}
      {sections.map((section, index) => (
        <AnimatedSection
          key={section.id}
          id={section.id}
          title={section.title}
          index={index}
          className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
        >
          <p className="text-lg leading-relaxed">{section.content}</p>
        </AnimatedSection>
      ))}
    </div>
  );
}

// ============================================================================
// PROGRESS BAR COMPONENT
// ============================================================================

function ProgressBar() {
  const { progress } = useScrollProgress();
  const { isDark, glow } = useEuvekaTheme();
  const { reducedMotion } = useAnimationPreferences();

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-muted/30">
      <motion.div
        className="h-full bg-primary"
        style={{
          width: `${progress * 100}%`,
          boxShadow: isDark ? glow.boxShadow : undefined,
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 100 }}
      />
    </div>
  );
}

export default EuvekaScrollDemo;
