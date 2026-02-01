/**
 * Scroll Animation Store - Zustand State Management
 *
 * Manages scroll position, section visibility, animation completion states,
 * and theme preferences for Euveka-style scroll animations.
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SectionVisibility {
  id: string;
  isInView: boolean;
  intersectionRatio: number;
  hasBeenInView: boolean;
  firstViewedAt: number | null;
  scrollProgress: number;
}

export interface AnimationState {
  id: string;
  isComplete: boolean;
  startedAt: number | null;
  completedAt: number | null;
  progress: number;
  variant: 'initial' | 'animate' | 'exit' | 'hover' | 'tap';
}

export type EuvekaTheme = 'dark' | 'light' | 'system';

export interface AnimationPreferences {
  reducedMotion: boolean;
  isSystemPreference: boolean;
  enableSpringAnimations: boolean;
  enableGlowEffects: boolean;
  enableParallax: boolean;
  speedMultiplier: number;
  enableStagger: boolean;
  staggerDelay: number;
}

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

export type ScrollDirection = 'up' | 'down' | 'none';

export interface ScrollAnimationState {
  scrollY: number;
  scrollX: number;
  scrollProgress: number;
  scrollDirection: ScrollDirection;
  lastScrollY: number;
  isScrolling: boolean;
  scrollVelocity: number;
  sections: Record<string, SectionVisibility>;
  activeSectionId: string | null;
  animations: Record<string, AnimationState>;
  euvekaTheme: EuvekaTheme;
  resolvedTheme: 'dark' | 'light';
  animationPreferences: AnimationPreferences;
  springConfigs: {
    default: SpringConfig;
    tight: SpringConfig;
    loose: SpringConfig;
    bouncy: SpringConfig;
  };

  setScrollPosition: (y: number, x?: number) => void;
  setScrollProgress: (progress: number) => void;
  setScrollDirection: (direction: ScrollDirection) => void;
  setIsScrolling: (isScrolling: boolean) => void;
  setScrollVelocity: (velocity: number) => void;
  registerSection: (id: string) => void;
  unregisterSection: (id: string) => void;
  updateSectionVisibility: (id: string, isInView: boolean, intersectionRatio?: number) => void;
  updateSectionScrollProgress: (id: string, progress: number) => void;
  setActiveSection: (id: string | null) => void;
  registerAnimation: (id: string, variant?: AnimationState['variant']) => void;
  unregisterAnimation: (id: string) => void;
  startAnimation: (id: string) => void;
  completeAnimation: (id: string) => void;
  updateAnimationProgress: (id: string, progress: number) => void;
  setAnimationVariant: (id: string, variant: AnimationState['variant']) => void;
  resetAnimation: (id: string) => void;
  resetAllAnimations: () => void;
  setEuvekaTheme: (theme: EuvekaTheme) => void;
  setResolvedTheme: (theme: 'dark' | 'light') => void;
  setReducedMotion: (value: boolean | null) => void;
  toggleReducedMotion: () => void;
  updateAnimationPreferences: (prefs: Partial<AnimationPreferences>) => void;
  getSectionById: (id: string) => SectionVisibility | undefined;
  getAnimationById: (id: string) => AnimationState | undefined;
  getVisibleSections: () => SectionVisibility[];
  getCompletedAnimations: () => AnimationState[];
  getSpringConfig: (type?: 'default' | 'tight' | 'loose' | 'bouncy') => SpringConfig;
}

const DEFAULT_ANIMATION_PREFERENCES: AnimationPreferences = {
  reducedMotion: false,
  isSystemPreference: true,
  enableSpringAnimations: true,
  enableGlowEffects: true,
  enableParallax: true,
  speedMultiplier: 1,
  enableStagger: true,
  staggerDelay: 50,
};

const EUVEKA_SPRING_CONFIGS = {
  default: { stiffness: 300, damping: 20, mass: 0.8 },
  tight: { stiffness: 400, damping: 30, mass: 0.5 },
  loose: { stiffness: 200, damping: 25, mass: 1 },
  bouncy: { stiffness: 500, damping: 15, mass: 0.8 },
};

export const useScrollAnimationStore = create<ScrollAnimationState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          scrollY: 0,
          scrollX: 0,
          scrollProgress: 0,
          scrollDirection: 'none',
          lastScrollY: 0,
          isScrolling: false,
          scrollVelocity: 0,
          sections: {},
          activeSectionId: null,
          animations: {},
          euvekaTheme: 'dark',
          resolvedTheme: 'dark',
          animationPreferences: DEFAULT_ANIMATION_PREFERENCES,
          springConfigs: EUVEKA_SPRING_CONFIGS,

          setScrollPosition: (y: number, x: number = 0) => {
            const lastY = get().scrollY;
            const direction: ScrollDirection = y > lastY ? 'down' : y < lastY ? 'up' : 'none';
            set({ scrollY: y, scrollX: x, lastScrollY: lastY, scrollDirection: direction, scrollVelocity: Math.abs(y - lastY) });
          },

          setScrollProgress: (progress: number) => set({ scrollProgress: Math.max(0, Math.min(1, progress)) }),
          setScrollDirection: (direction: ScrollDirection) => set({ scrollDirection: direction }),
          setIsScrolling: (isScrolling: boolean) => set({ isScrolling }),
          setScrollVelocity: (velocity: number) => set({ scrollVelocity: velocity }),

          registerSection: (id: string) => set((state) => ({
            sections: { ...state.sections, [id]: { id, isInView: false, intersectionRatio: 0, hasBeenInView: false, firstViewedAt: null, scrollProgress: 0 } },
          })),

          unregisterSection: (id: string) => set((state) => {
            const newSections = { ...state.sections };
            delete newSections[id];
            return { sections: newSections, activeSectionId: state.activeSectionId === id ? null : state.activeSectionId };
          }),

          updateSectionVisibility: (id: string, isInView: boolean, intersectionRatio: number = 0) => set((state) => {
            const section = state.sections[id];
            if (!section) {return state;}
            const now = Date.now();
            return {
              sections: {
                ...state.sections,
                [id]: { ...section, isInView, intersectionRatio, hasBeenInView: section.hasBeenInView || isInView, firstViewedAt: isInView && !section.hasBeenInView ? now : section.firstViewedAt },
              },
            };
          }),

          updateSectionScrollProgress: (id: string, progress: number) => set((state) => {
            const section = state.sections[id];
            if (!section) {return state;}
            return { sections: { ...state.sections, [id]: { ...section, scrollProgress: Math.max(0, Math.min(1, progress)) } } };
          }),

          setActiveSection: (id: string | null) => set({ activeSectionId: id }),

          registerAnimation: (id: string, variant: AnimationState['variant'] = 'initial') => set((state) => ({
            animations: { ...state.animations, [id]: { id, isComplete: false, startedAt: null, completedAt: null, progress: 0, variant } },
          })),

          unregisterAnimation: (id: string) => set((state) => {
            const newAnimations = { ...state.animations };
            delete newAnimations[id];
            return { animations: newAnimations };
          }),

          startAnimation: (id: string) => set((state) => {
            const animation = state.animations[id];
            if (!animation) {return state;}
            return { animations: { ...state.animations, [id]: { ...animation, startedAt: Date.now(), isComplete: false, progress: 0, variant: 'animate' } } };
          }),

          completeAnimation: (id: string) => set((state) => {
            const animation = state.animations[id];
            if (!animation) {return state;}
            return { animations: { ...state.animations, [id]: { ...animation, isComplete: true, completedAt: Date.now(), progress: 1 } } };
          }),

          updateAnimationProgress: (id: string, progress: number) => set((state) => {
            const animation = state.animations[id];
            if (!animation) {return state;}
            return { animations: { ...state.animations, [id]: { ...animation, progress: Math.max(0, Math.min(1, progress)) } } };
          }),

          setAnimationVariant: (id: string, variant: AnimationState['variant']) => set((state) => {
            const animation = state.animations[id];
            if (!animation) {return state;}
            return { animations: { ...state.animations, [id]: { ...animation, variant } } };
          }),

          resetAnimation: (id: string) => set((state) => {
            const animation = state.animations[id];
            if (!animation) {return state;}
            return { animations: { ...state.animations, [id]: { ...animation, isComplete: false, startedAt: null, completedAt: null, progress: 0, variant: 'initial' } } };
          }),

          resetAllAnimations: () => set((state) => {
            const resetAnimations: Record<string, AnimationState> = {};
            for (const [id, animation] of Object.entries(state.animations)) {
              resetAnimations[id] = { ...animation, isComplete: false, startedAt: null, completedAt: null, progress: 0, variant: 'initial' };
            }
            return { animations: resetAnimations };
          }),

          setEuvekaTheme: (theme: EuvekaTheme) => set({ euvekaTheme: theme }),
          setResolvedTheme: (theme: 'dark' | 'light') => set({ resolvedTheme: theme }),

          setReducedMotion: (value: boolean | null) => set((state) => ({
            animationPreferences: { ...state.animationPreferences, reducedMotion: value ?? false, isSystemPreference: value === null },
          })),

          toggleReducedMotion: () => set((state) => ({
            animationPreferences: { ...state.animationPreferences, reducedMotion: !state.animationPreferences.reducedMotion, isSystemPreference: false },
          })),

          updateAnimationPreferences: (prefs: Partial<AnimationPreferences>) => set((state) => ({
            animationPreferences: { ...state.animationPreferences, ...prefs },
          })),

          getSectionById: (id: string) => get().sections[id],
          getAnimationById: (id: string) => get().animations[id],
          getVisibleSections: () => Object.values(get().sections).filter((s) => s.isInView),
          getCompletedAnimations: () => Object.values(get().animations).filter((a) => a.isComplete),

          getSpringConfig: (type = 'default') => {
            const { animationPreferences, springConfigs } = get();
            if (animationPreferences.reducedMotion) {return { stiffness: 1000, damping: 1000, mass: 0.1 };}
            const config = springConfigs[type] || springConfigs.default;
            return { stiffness: config.stiffness * animationPreferences.speedMultiplier, damping: config.damping, mass: config.mass / animationPreferences.speedMultiplier };
          },
        }),
        { name: 'tallow-scroll-animation-store', partialize: (state) => ({ animationPreferences: state.animationPreferences, euvekaTheme: state.euvekaTheme }) }
      )
    ),
    { name: 'ScrollAnimationStore' }
  )
);

// Selectors
export const selectScrollProgress = (state: ScrollAnimationState) => state.scrollProgress;
export const selectScrollDirection = (state: ScrollAnimationState) => state.scrollDirection;
export const selectActiveSection = (state: ScrollAnimationState) => state.activeSectionId ? state.sections[state.activeSectionId] : null;
export const selectVisibleSections = (state: ScrollAnimationState) => Object.values(state.sections).filter((s) => s.isInView);
export const selectViewedSections = (state: ScrollAnimationState) => Object.values(state.sections).filter((s) => s.hasBeenInView);
export const createSectionSelector = (sectionId: string) => (state: ScrollAnimationState) => state.sections[sectionId];
export const createAnimationSelector = (animationId: string) => (state: ScrollAnimationState) => state.animations[animationId];
export const selectReducedMotion = (state: ScrollAnimationState) => state.animationPreferences.reducedMotion;
export const selectAnimationPreferences = (state: ScrollAnimationState) => state.animationPreferences;
export const selectEuvekaTheme = (state: ScrollAnimationState) => state.euvekaTheme;
export const selectResolvedTheme = (state: ScrollAnimationState) => state.resolvedTheme;
export const selectSpringConfig = (type: 'default' | 'tight' | 'loose' | 'bouncy' = 'default') => (state: ScrollAnimationState) => state.getSpringConfig(type);
export const selectHasRunningAnimations = (state: ScrollAnimationState) => Object.values(state.animations).some((a) => a.startedAt !== null && !a.isComplete);
export const selectOverallAnimationProgress = (state: ScrollAnimationState) => {
  const animations = Object.values(state.animations);
  if (animations.length === 0) {return 0;}
  return animations.reduce((sum, a) => sum + a.progress, 0) / animations.length;
};
export const selectIsNearTop = (threshold: number = 100) => (state: ScrollAnimationState) => state.scrollY < threshold;
export const selectIsNearBottom = (threshold: number = 100) => (state: ScrollAnimationState) => {
  if (typeof window === 'undefined') {return false;}
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return state.scrollY > maxScroll - threshold;
};
