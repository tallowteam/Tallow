/**
 * Onboarding Flow Hook
 * Agent 045 — ONBOARD-GUIDE
 *
 * Manages first-time user experience with a 5-step progressive onboarding tour.
 * Renders BEFORE mode selection on first visit so Steps 1-2 are reachable.
 *
 * Progressive disclosure strategy:
 *   Visit 1 — full 5-step guided tour
 *   Visit 2 — condensed 2-step tips (welcome + mode reminder)
 *   Visit 3+ — no automatic onboarding (accessible via help menu reset)
 *
 * Steps:
 * 1. Welcome — "Send files securely to any device"
 * 2. Explain modes — "Local Network (same WiFi) vs Internet (anywhere)"
 * 3. Guide mode selection — highlight the mode selector
 * 4. Guide device discovery / code entry
 * 5. Guide file selection and transfer
 *
 * Storage format uses a version key so new features can re-trigger onboarding.
 *
 * CRITICAL: All localStorage access is in plain functions (not hooks) to avoid
 * Turbopack's aggressive Zustand transform. This hook only uses React.useState
 * and React.useCallback — no external store subscriptions.
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type OnboardingStepId =
  | 'welcome'
  | 'explain-modes'
  | 'select-mode'
  | 'discover-devices'
  | 'drop-files';

export type StepPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';
export type StepAction = 'click' | 'drag' | 'observe';

/** Where in the flow this step lives relative to mode selection */
export type StepPhase = 'pre-mode' | 'post-mode';

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  /** CSS selector for the element to spotlight. Undefined = no spotlight (centered card). */
  target?: string;
  position: StepPosition;
  action: StepAction;
  completed: boolean;
  /** Whether this step renders before or after mode selection */
  phase: StepPhase;
}

export interface OnboardingState {
  /** Whether onboarding has been completed (or skipped) for this version */
  completed: boolean;
  /** Current step index (0-based) */
  currentStep: number;
  /** All onboarding steps */
  steps: OnboardingStep[];
  /** Whether the guided tour is currently active */
  isActive: boolean;
  /** Timestamp of completion (ms since epoch), null if not yet completed */
  completedAt: number | null;
  /** Schema version — bump to re-trigger onboarding after major feature releases */
  version: number;
  /** How many times the user has completed (or skipped) onboarding */
  visitCount: number;
  /** Whether the user explicitly dismissed (not skipped) mid-tour */
  dismissed: boolean;
}

export interface UseOnboardingReturn {
  /** Full onboarding state */
  state: OnboardingState;
  /** Whether the welcome card should auto-appear (first visit, not completed, not active) */
  shouldShow: boolean;
  /** Current step data, or null when inactive */
  currentStep: OnboardingStep | null;
  /** Progress percentage 0-100 */
  progress: number;
  /** Whether the current step is in the pre-mode phase */
  isPreModePhase: boolean;
  /** Whether the current step is in the post-mode phase */
  isPostModePhase: boolean;
  /** Start the guided tour */
  start: () => void;
  /** Advance to next step (marks current as completed) */
  next: () => void;
  /** Go back one step */
  back: () => void;
  /** Jump to a specific step index */
  goTo: (stepIndex: number) => void;
  /** Mark current step completed and advance */
  complete: () => void;
  /** Skip onboarding entirely (marks as completed, increments visitCount) */
  skip: () => void;
  /** Reset onboarding to fresh state (for testing or help menu) */
  reset: () => void;
  /** Dismiss tour without completing — can be re-shown later */
  dismiss: () => void;
  /** Advance past all pre-mode steps (called when user selects a mode) */
  advancePastPreMode: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'tallow-onboarding-v2';
const CURRENT_VERSION = 2;

/** Maximum visit count before onboarding stops auto-showing */
const MAX_AUTO_SHOW_VISITS = 1;

const FULL_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Send files securely to any device',
    description:
      'Tallow transfers files directly between devices with post-quantum encryption. Your data never touches a server.',
    position: 'center',
    action: 'observe',
    completed: false,
    phase: 'post-mode',
  },
  {
    id: 'discover-devices',
    title: 'Find a device on your network',
    description:
      'Nearby devices appear as cards in the grid. Switch to Remote mode to use room codes for transfers across the internet.',
    target: '[data-onboarding="device-grid"], [data-onboarding="remote-connect"]',
    position: 'bottom',
    action: 'observe',
    completed: false,
    phase: 'post-mode',
  },
  {
    id: 'drop-files',
    title: 'Select files and send',
    description:
      'Drag files anywhere or click Browse, then tap a device card to send. You can also drag files directly onto a device.',
    target: '[data-onboarding="file-selector"]',
    position: 'bottom',
    action: 'drag',
    completed: false,
    phase: 'post-mode',
  },
];

/** Condensed steps for second visit */
const CONDENSED_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome back to Tallow',
    description: 'Devices nearby will appear in the grid. Drop files and tap a device to send.',
    position: 'center',
    action: 'observe',
    completed: false,
    phase: 'post-mode',
  },
  {
    id: 'drop-files',
    title: 'Drag files to transfer',
    description:
      'Drop files anywhere, then click a device card. Or drag files directly onto a device for instant send.',
    target: '[data-onboarding="file-selector"]',
    position: 'bottom',
    action: 'drag',
    completed: false,
    phase: 'post-mode',
  },
];

// ============================================================================
// STORAGE HELPERS (plain functions — Turbopack-safe)
// ============================================================================

function loadState(): OnboardingState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingState;
    // Version mismatch = re-onboard
    if (parsed.version !== CURRENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state: OnboardingState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

function stepsForVisit(visitCount: number): OnboardingStep[] {
  if (visitCount === 0) {
    return FULL_STEPS.map((s) => ({ ...s }));
  }
  if (visitCount === 1) {
    return CONDENSED_STEPS.map((s) => ({ ...s }));
  }
  // Visit 3+: empty — no auto-onboarding
  return FULL_STEPS.map((s) => ({ ...s }));
}

function buildInitialState(): OnboardingState {
  return {
    completed: false,
    currentStep: 0,
    steps: stepsForVisit(0),
    isActive: false,
    completedAt: null,
    version: CURRENT_VERSION,
    visitCount: 0,
    dismissed: false,
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useOnboarding(): UseOnboardingReturn {
  const [state, setState] = useState<OnboardingState>(() => {
    const saved = loadState();
    if (saved) return saved;
    return buildInitialState();
  });

  // Persist every state change
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveState(state);
  }, [state]);

  // Derived values
  const shouldShow =
    !state.completed &&
    !state.isActive &&
    !state.dismissed &&
    state.visitCount <= MAX_AUTO_SHOW_VISITS;

  const currentStep =
    state.isActive && state.currentStep < state.steps.length
      ? state.steps[state.currentStep] ?? null
      : null;

  const completedCount = state.steps.filter((s) => s.completed).length;
  const progress =
    state.steps.length > 0
      ? Math.round((completedCount / state.steps.length) * 100)
      : 0;

  const isPreModePhase = currentStep?.phase === 'pre-mode';
  const isPostModePhase = currentStep?.phase === 'post-mode';

  // ---- Actions ----

  const start = useCallback(() => {
    setState((prev) => {
      const steps = stepsForVisit(prev.visitCount);
      return {
        ...prev,
        isActive: true,
        currentStep: 0,
        steps,
        completed: false,
        dismissed: false,
        completedAt: null,
      };
    });
  }, []);

  const next = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentStep + 1;
      if (nextIndex >= prev.steps.length) {
        return {
          ...prev,
          completed: true,
          isActive: false,
          completedAt: Date.now(),
          visitCount: prev.visitCount + 1,
        };
      }
      return { ...prev, currentStep: nextIndex };
    });
  }, []);

  const back = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  const goTo = useCallback((stepIndex: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, Math.min(stepIndex, prev.steps.length - 1)),
    }));
  }, []);

  const complete = useCallback(() => {
    setState((prev) => {
      const updatedSteps = prev.steps.map((s, i) =>
        i === prev.currentStep ? { ...s, completed: true } : s
      );
      const nextIndex = prev.currentStep + 1;
      const allDone = nextIndex >= prev.steps.length;
      return {
        ...prev,
        steps: updatedSteps,
        currentStep: allDone ? prev.currentStep : nextIndex,
        completed: allDone,
        isActive: !allDone,
        completedAt: allDone ? Date.now() : null,
        visitCount: allDone ? prev.visitCount + 1 : prev.visitCount,
      };
    });
  }, []);

  const skip = useCallback(() => {
    setState((prev) => ({
      ...prev,
      completed: true,
      isActive: false,
      completedAt: Date.now(),
      visitCount: prev.visitCount + 1,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      completed: false,
      currentStep: 0,
      steps: FULL_STEPS.map((s) => ({ ...s, completed: false })),
      isActive: false,
      completedAt: null,
      version: CURRENT_VERSION,
      visitCount: 0,
      dismissed: false,
    });
  }, []);

  const dismiss = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      dismissed: true,
    }));
  }, []);

  /**
   * Called when the user selects a mode. Advances the tour past all pre-mode
   * steps so post-mode steps (device discovery, file drop) can render inside
   * the dashboard.
   */
  const advancePastPreMode = useCallback(() => {
    setState((prev) => {
      if (!prev.isActive) return prev;

      // Mark all pre-mode steps as completed
      const updatedSteps = prev.steps.map((s) =>
        s.phase === 'pre-mode' ? { ...s, completed: true } : s
      );

      // Find index of first post-mode step
      const firstPostModeIndex = updatedSteps.findIndex(
        (s) => s.phase === 'post-mode'
      );

      if (firstPostModeIndex === -1) {
        // No post-mode steps — onboarding is done
        return {
          ...prev,
          steps: updatedSteps,
          completed: true,
          isActive: false,
          completedAt: Date.now(),
          visitCount: prev.visitCount + 1,
        };
      }

      return {
        ...prev,
        steps: updatedSteps,
        currentStep: firstPostModeIndex,
      };
    });
  }, []);

  return {
    state,
    shouldShow,
    currentStep,
    progress,
    isPreModePhase,
    isPostModePhase,
    start,
    next,
    back,
    goTo,
    complete,
    skip,
    reset,
    dismiss,
    advancePastPreMode,
  };
}
