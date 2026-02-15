/**
 * Onboarding Hook Unit Tests
 *
 * Tests the onboarding flow hook including:
 * - Initial state (not completed, not active)
 * - Start/next/back/skip flow
 * - Persistence to localStorage
 * - Step completion tracking
 * - Reset behavior
 * - Progress calculation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from '@/lib/hooks/use-onboarding';

describe('useOnboarding', () => {
  let mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    mockLocalStorage = {};

    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
    });

    // Mock window for SSR check
    vi.stubGlobal('window', {});
  });

  describe('initial state', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.state.completed).toBe(false);
      expect(result.current.state.isActive).toBe(false);
      expect(result.current.state.currentStep).toBe(0);
      expect(result.current.state.steps).toHaveLength(5);
      expect(result.current.shouldShow).toBe(true);
    });

    it('loads state from localStorage', () => {
      mockLocalStorage['tallow-onboarding'] = JSON.stringify({
        completed: true,
        currentStep: 0,
        steps: [],
        isActive: false,
        completedAt: Date.now(),
        version: 1,
      });

      const { result } = renderHook(() => useOnboarding());
      expect(result.current.state.completed).toBe(true);
    });

    it('ignores outdated version in localStorage', () => {
      mockLocalStorage['tallow-onboarding'] = JSON.stringify({
        completed: true,
        version: 0, // Old version
      });

      const { result } = renderHook(() => useOnboarding());
      expect(result.current.state.completed).toBe(false);
    });

    it('handles corrupted localStorage', () => {
      mockLocalStorage['tallow-onboarding'] = 'invalid-json{';

      const { result } = renderHook(() => useOnboarding());
      expect(result.current.state.completed).toBe(false);
    });
  });

  describe('onboarding flow', () => {
    it('starts onboarding', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      expect(result.current.state.isActive).toBe(true);
      expect(result.current.state.currentStep).toBe(0);
    });

    it('moves to next step', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.next();
      });

      expect(result.current.state.currentStep).toBe(1);
    });

    it('moves back to previous step', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
        result.current.next();
        result.current.next();
      });

      act(() => {
        result.current.back();
      });

      expect(result.current.state.currentStep).toBe(1);
    });

    it('does not go below step 0', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.back();
      });

      expect(result.current.state.currentStep).toBe(0);
    });

    it('completes onboarding when reaching last step', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      // Move through all steps
      for (let i = 0; i < result.current.state.steps.length; i++) {
        act(() => {
          result.current.next();
        });
      }

      expect(result.current.state.completed).toBe(true);
      expect(result.current.state.isActive).toBe(false);
    });
  });

  describe('step navigation', () => {
    it('goes to specific step', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.goTo(3);
      });

      expect(result.current.state.currentStep).toBe(3);
    });

    it('clamps step index to valid range', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.goTo(999);
      });

      expect(result.current.state.currentStep).toBe(
        result.current.state.steps.length - 1
      );
    });

    it('does not go to negative step', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.goTo(-5);
      });

      expect(result.current.state.currentStep).toBe(0);
    });
  });

  describe('step completion', () => {
    it('marks current step as completed', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.complete();
      });

      expect(result.current.state.steps[0]?.completed).toBe(true);
    });

    it('advances to next step on complete', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      const initialStep = result.current.state.currentStep;

      act(() => {
        result.current.complete();
      });

      expect(result.current.state.currentStep).toBe(initialStep + 1);
    });

    it('completes onboarding when all steps done', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      // Complete all steps
      const stepCount = result.current.state.steps.length;
      for (let i = 0; i < stepCount; i++) {
        act(() => {
          result.current.complete();
        });
      }

      expect(result.current.state.completed).toBe(true);
    });
  });

  describe('skip functionality', () => {
    it('skips entire onboarding', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.skip();
      });

      expect(result.current.state.completed).toBe(true);
      expect(result.current.state.isActive).toBe(false);
    });

    it('sets completedAt timestamp', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      const before = Date.now();

      act(() => {
        result.current.skip();
      });

      const after = Date.now();

      expect(result.current.state.completedAt).not.toBeNull();
      expect(result.current.state.completedAt!).toBeGreaterThanOrEqual(before);
      expect(result.current.state.completedAt!).toBeLessThanOrEqual(after);
    });
  });

  describe('reset functionality', () => {
    it('resets onboarding to initial state', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
        result.current.next();
        result.current.complete();
        result.current.skip();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.state.completed).toBe(false);
      expect(result.current.state.isActive).toBe(false);
      expect(result.current.state.currentStep).toBe(0);
      expect(result.current.state.completedAt).toBeNull();
    });

    it('clears all step completions', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
        result.current.complete();
        result.current.complete();
      });

      act(() => {
        result.current.reset();
      });

      const allIncomplete = result.current.state.steps.every(
        step => !step.completed
      );
      expect(allIncomplete).toBe(true);
    });
  });

  describe('dismiss functionality', () => {
    it('dismisses active onboarding', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.state.isActive).toBe(false);
    });

    it('does not mark as completed on dismiss', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.state.completed).toBe(false);
    });
  });

  describe('progress calculation', () => {
    it('calculates progress percentage', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.progress).toBe(0);

      act(() => {
        result.current.start();
        result.current.complete();
      });

      expect(result.current.progress).toBeGreaterThan(0);
      expect(result.current.progress).toBeLessThanOrEqual(100);
    });

    it('reaches 100% when all steps completed', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      const stepCount = result.current.state.steps.length;
      for (let i = 0; i < stepCount; i++) {
        act(() => {
          result.current.complete();
        });
      }

      expect(result.current.progress).toBe(100);
    });
  });

  describe('current step', () => {
    it('returns current step when active', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      expect(result.current.currentStep).not.toBeNull();
      expect(result.current.currentStep?.id).toBe('welcome');
    });

    it('returns null when not active', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.currentStep).toBeNull();
    });

    it('updates current step on navigation', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.next();
      });

      expect(result.current.currentStep?.id).toBe('select-mode');
    });
  });

  describe('shouldShow flag', () => {
    it('returns true when not completed and not active', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.shouldShow).toBe(true);
    });

    it('returns false when completed', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
        result.current.skip();
      });

      expect(result.current.shouldShow).toBe(false);
    });

    it('returns false when active', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      expect(result.current.shouldShow).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    it('persists state to localStorage', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'tallow-onboarding',
        expect.stringContaining('"isActive":true')
      );
    });

    it('persists completion', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.start();
        result.current.skip();
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'tallow-onboarding',
        expect.stringContaining('"completed":true')
      );
    });

    it('handles localStorage errors gracefully', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          throw new Error('Storage full');
        }),
      });

      const { result } = renderHook(() => useOnboarding());

      expect(() => {
        act(() => {
          result.current.start();
        });
      }).not.toThrow();
    });
  });

  describe('default steps', () => {
    it('includes welcome step', () => {
      const { result } = renderHook(() => useOnboarding());

      const welcomeStep = result.current.state.steps.find(s => s.id === 'welcome');
      expect(welcomeStep).toBeDefined();
      expect(welcomeStep?.title).toContain('Welcome');
    });

    it('includes all required steps', () => {
      const { result } = renderHook(() => useOnboarding());

      const stepIds = result.current.state.steps.map(s => s.id);
      expect(stepIds).toContain('welcome');
      expect(stepIds).toContain('select-mode');
      expect(stepIds).toContain('discover-devices');
      expect(stepIds).toContain('drop-files');
      expect(stepIds).toContain('security');
    });

    it('has proper step metadata', () => {
      const { result } = renderHook(() => useOnboarding());

      result.current.state.steps.forEach(step => {
        expect(step.id).toBeTruthy();
        expect(step.title).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(step.completed).toBe(false);
      });
    });
  });
});
