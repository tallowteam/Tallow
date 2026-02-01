/**
 * useSectionInView Hook
 *
 * Tracks section visibility using IntersectionObserver and integrates
 * with the Zustand scroll animation store for Euveka-style animations.
 *
 * Features:
 * - IntersectionObserver-based visibility tracking
 * - Automatic section registration/unregistration
 * - Scroll progress within section
 * - Animation triggering on first view
 * - Multiple threshold support
 * - Integration with animation store
 */

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useScrollAnimationStore, type SectionVisibility } from '@/lib/stores/scroll-animation-store';

export interface UseSectionInViewOptions {
  /** Section identifier (required for store registration) */
  sectionId: string;
  /** Intersection threshold(s) - single value or array */
  threshold?: number | number[];
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Root element for intersection observer */
  root?: Element | null;
  /** Callback when section enters view */
  onEnter?: () => void;
  /** Callback when section leaves view */
  onLeave?: () => void;
  /** Callback when intersection ratio changes */
  onIntersectionChange?: (ratio: number) => void;
  /** Whether to trigger animation only once */
  triggerOnce?: boolean;
  /** Delay before triggering enter callback (ms) */
  enterDelay?: number;
  /** Animation ID to auto-start when section enters view */
  animationId?: string;
  /** Whether to track scroll progress within section */
  trackScrollProgress?: boolean;
}

export interface UseSectionInViewReturn {
  /** Ref to attach to the section element */
  ref: React.RefObject<HTMLElement | null>;
  /** Whether section is currently in view */
  isInView: boolean;
  /** Current intersection ratio (0-1) */
  intersectionRatio: number;
  /** Whether section has ever been in view */
  hasBeenInView: boolean;
  /** Scroll progress within section (0-1) */
  scrollProgress: number;
  /** Section state from store */
  section: SectionVisibility | undefined;
  /** Manually set as active section */
  setAsActive: () => void;
}

export function useSectionInView(
  options: UseSectionInViewOptions
): UseSectionInViewReturn {
  const {
    sectionId,
    threshold = 0.1,
    rootMargin = '0px',
    root = null,
    onEnter,
    onLeave,
    onIntersectionChange,
    triggerOnce = false,
    enterDelay = 0,
    animationId,
    trackScrollProgress = false,
  } = options;

  // Refs
  const elementRef = useRef<HTMLElement | null>(null);
  const enterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTriggeredRef = useRef(false);
  const wasInViewRef = useRef(false);

  // Local state for immediate updates
  const [isInView, setIsInView] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);

  // Store actions and state
  const {
    sections,
    registerSection,
    unregisterSection,
    updateSectionVisibility,
    updateSectionScrollProgress,
    setActiveSection,
    startAnimation,
    scrollY,
    animationPreferences,
  } = useScrollAnimationStore();

  const section = sections[sectionId];

  // Register section on mount
  useEffect(() => {
    registerSection(sectionId);
    return () => {
      unregisterSection(sectionId);
      if (enterTimeoutRef.current) {
        clearTimeout(enterTimeoutRef.current);
      }
    };
  }, [sectionId, registerSection, unregisterSection]);

  // Handle intersection callback
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) {return;}

      const nowInView = entry.isIntersecting;
      const ratio = entry.intersectionRatio;

      // Update local state
      setIsInView(nowInView);
      setIntersectionRatio(ratio);

      // Update store
      updateSectionVisibility(sectionId, nowInView, ratio);

      // Notify ratio change
      onIntersectionChange?.(ratio);

      // Handle enter/leave callbacks
      if (nowInView && !wasInViewRef.current) {
        // Entering view
        if (triggerOnce && hasTriggeredRef.current) {
          wasInViewRef.current = nowInView;
          return;
        }

        hasTriggeredRef.current = true;

        // Start animation if specified
        if (animationId) {
          startAnimation(animationId);
        }

        // Call onEnter with optional delay
        if (onEnter) {
          if (enterDelay > 0 && !animationPreferences.reducedMotion) {
            enterTimeoutRef.current = setTimeout(onEnter, enterDelay);
          } else {
            onEnter();
          }
        }
      } else if (!nowInView && wasInViewRef.current) {
        // Leaving view
        if (enterTimeoutRef.current) {
          clearTimeout(enterTimeoutRef.current);
        }
        onLeave?.();
      }

      wasInViewRef.current = nowInView;
    },
    [
      sectionId,
      updateSectionVisibility,
      onIntersectionChange,
      triggerOnce,
      animationId,
      startAnimation,
      onEnter,
      onLeave,
      enterDelay,
      animationPreferences.reducedMotion,
    ]
  );

  // Set up IntersectionObserver
  useEffect(() => {
    const element = elementRef.current;
    if (!element) {return;}

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
      root,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, root, handleIntersection]);

  // Track scroll progress within section
  useEffect(() => {
    if (!trackScrollProgress || !elementRef.current) {return;}

    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    const elementTop = rect.top + scrollY;
    const elementHeight = rect.height;
    const viewportHeight = window.innerHeight;

    // Calculate progress (0 = just entering, 1 = just leaving)
    const scrolledPast = scrollY + viewportHeight - elementTop;
    const totalScrollDistance = elementHeight + viewportHeight;
    const progress = Math.max(0, Math.min(1, scrolledPast / totalScrollDistance));

    updateSectionScrollProgress(sectionId, progress);
  }, [scrollY, sectionId, trackScrollProgress, updateSectionScrollProgress]);

  // Set as active section
  const setAsActive = useCallback(() => {
    setActiveSection(sectionId);
  }, [sectionId, setActiveSection]);

  return {
    ref: elementRef,
    isInView,
    intersectionRatio,
    hasBeenInView: section?.hasBeenInView ?? false,
    scrollProgress: section?.scrollProgress ?? 0,
    section,
    setAsActive,
  };
}

/**
 * Hook for tracking multiple sections at once
 */
export interface UseMultipleSectionsOptions {
  /** Section IDs to track */
  sectionIds: string[];
  /** Shared intersection threshold */
  threshold?: number | number[];
  /** Shared root margin */
  rootMargin?: string;
  /** Callback when active section changes */
  onActiveSectionChange?: (sectionId: string | null) => void;
}

export function useMultipleSections(options: UseMultipleSectionsOptions) {
  const { sectionIds, onActiveSectionChange } = options;

  const { sections, activeSectionId, setActiveSection, registerSection, unregisterSection } =
    useScrollAnimationStore();

  // Register all sections
  useEffect(() => {
    sectionIds.forEach((id) => registerSection(id));
    return () => {
      sectionIds.forEach((id) => unregisterSection(id));
    };
  }, [sectionIds, registerSection, unregisterSection]);

  // Track which section is most visible
  useEffect(() => {
    let mostVisibleSection: string | null = null;
    let maxRatio = 0;

    for (const id of sectionIds) {
      const section = sections[id];
      if (section && section.isInView && section.intersectionRatio > maxRatio) {
        maxRatio = section.intersectionRatio;
        mostVisibleSection = id;
      }
    }

    if (mostVisibleSection !== activeSectionId) {
      setActiveSection(mostVisibleSection);
      onActiveSectionChange?.(mostVisibleSection);
    }
  }, [sections, sectionIds, activeSectionId, setActiveSection, onActiveSectionChange]);

  // Get visible sections
  const visibleSections = sectionIds.filter((id) => sections[id]?.isInView);

  // Get viewed sections
  const viewedSections = sectionIds.filter((id) => sections[id]?.hasBeenInView);

  return {
    sections: sectionIds.map((id) => sections[id]),
    activeSectionId,
    visibleSections,
    viewedSections,
    setActiveSection,
  };
}

/**
 * Simple hook that just returns whether an element is in view
 */
export function useInView(
  ref: React.RefObject<Element | null>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {return;}

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry?.isIntersecting ?? false);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options.threshold, options.rootMargin, options.root]);

  return isInView;
}

export default useSectionInView;
