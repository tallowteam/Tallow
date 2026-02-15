/**
 * Unit tests for usePerformance hook
 * Tests performance monitoring and metrics collection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  usePerformance,
  useRenderTime,
  useAsyncTiming,
  useIdleCallback,
  useIntersectionLoad,
} from '@/lib/hooks/use-performance';
import type { PerformanceMetric } from '@/lib/performance/monitoring';

// Mock performance monitoring functions
const performanceMocks = vi.hoisted(() => ({
  markStart: vi.fn(),
  markEnd: vi.fn(() => 100),
  measure: vi.fn(async (name: string, fn: () => any) => {
    const result = await fn();
    return { result, duration: 100 };
  }),
  initCoreWebVitals: vi.fn(),
  onMetric: vi.fn(() => vi.fn()), // Returns unsubscribe function
  observeLongTasks: vi.fn(() => vi.fn()), // Returns unsubscribe function
}));

const mockMarkStart = performanceMocks.markStart;
const mockMarkEnd = performanceMocks.markEnd;
const mockMeasure = performanceMocks.measure;
const mockInitCoreWebVitals = performanceMocks.initCoreWebVitals;
const mockOnMetric = performanceMocks.onMetric;
const mockObserveLongTasks = performanceMocks.observeLongTasks;

vi.mock('@/lib/performance/monitoring', () => ({
  markStart: performanceMocks.markStart,
  markEnd: performanceMocks.markEnd,
  measure: performanceMocks.measure,
  initCoreWebVitals: performanceMocks.initCoreWebVitals,
  onMetric: performanceMocks.onMetric,
  observeLongTasks: performanceMocks.observeLongTasks,
}));

// Mock performance API
const mockPerformanceNow = vi.fn(() => 1000);
const mockPerformanceMeasure = vi.fn();

global.performance = {
  now: mockPerformanceNow,
  measure: mockPerformanceMeasure,
} as any;

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

global.IntersectionObserver = MockIntersectionObserver as any;

describe('usePerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
  });

  describe('Basic Functionality', () => {
    it('should provide performance monitoring functions', () => {
      const { result } = renderHook(() => usePerformance());

      expect(result.current.markStart).toBeDefined();
      expect(result.current.markEnd).toBeDefined();
      expect(result.current.measure).toBeDefined();
      expect(result.current.metrics).toEqual([]);
      expect(result.current.longTasks).toEqual([]);
    });

    it('should call markStart when invoked', () => {
      const { result } = renderHook(() => usePerformance());

      act(() => {
        result.current.markStart('test-mark');
      });

      expect(mockMarkStart).toHaveBeenCalledWith('test-mark');
    });

    it('should call markEnd when invoked', () => {
      const { result } = renderHook(() => usePerformance());

      act(() => {
        result.current.markEnd('test-mark');
      });

      expect(mockMarkEnd).toHaveBeenCalledWith('test-mark');
    });

    it('should return duration from markEnd', () => {
      const { result } = renderHook(() => usePerformance());
      let duration: number = 0;

      act(() => {
        duration = result.current.markEnd('test-mark');
      });

      expect(duration).toBe(100);
    });
  });

  describe('Web Vitals Tracking', () => {
    it('should initialize Core Web Vitals when enabled', () => {
      renderHook(() => usePerformance({ trackWebVitals: true }));

      expect(mockInitCoreWebVitals).toHaveBeenCalled();
      expect(mockOnMetric).toHaveBeenCalled();
    });

    it('should not initialize Core Web Vitals when disabled', () => {
      renderHook(() => usePerformance({ trackWebVitals: false }));

      expect(mockInitCoreWebVitals).not.toHaveBeenCalled();
    });

    it('should collect metrics', async () => {
      let metricCallback: ((metric: PerformanceMetric) => void) | null = null;

      mockOnMetric.mockImplementationOnce((callback) => {
        metricCallback = callback;
        return vi.fn();
      });

      const { result } = renderHook(() => usePerformance({ trackWebVitals: true }));

      const mockMetric: PerformanceMetric = {
        name: 'CLS',
        value: 0.05,
        rating: 'good',
      };

      act(() => {
        metricCallback?.(mockMetric);
      });

      await waitFor(() => {
        expect(result.current.metrics).toHaveLength(1);
      });

      expect(result.current.metrics[0]).toEqual(mockMetric);
    });

    it('should call onMetric callback when provided', async () => {
      const onMetricCallback = vi.fn();
      let metricCallback: ((metric: PerformanceMetric) => void) | null = null;

      mockOnMetric.mockImplementationOnce((callback) => {
        metricCallback = callback;
        return vi.fn();
      });

      renderHook(() =>
        usePerformance({ trackWebVitals: true, onMetric: onMetricCallback })
      );

      const mockMetric: PerformanceMetric = {
        name: 'LCP',
        value: 2500,
        rating: 'good',
      };

      act(() => {
        metricCallback?.(mockMetric);
      });

      await waitFor(() => {
        expect(onMetricCallback).toHaveBeenCalledWith(mockMetric);
      });
    });

    it('should unsubscribe on unmount', () => {
      const unsubscribe = vi.fn();
      mockOnMetric.mockReturnValueOnce(unsubscribe);

      const { unmount } = renderHook(() => usePerformance({ trackWebVitals: true }));

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Long Tasks Tracking', () => {
    it('should observe long tasks when enabled', () => {
      renderHook(() => usePerformance({ trackLongTasks: true }));

      expect(mockObserveLongTasks).toHaveBeenCalled();
    });

    it('should not observe long tasks when disabled', () => {
      renderHook(() => usePerformance({ trackLongTasks: false }));

      expect(mockObserveLongTasks).not.toHaveBeenCalled();
    });

    it('should collect long tasks', async () => {
      let longTaskCallback: ((entry: PerformanceEntry) => void) | null = null;

      mockObserveLongTasks.mockImplementationOnce((callback) => {
        longTaskCallback = callback;
        return vi.fn();
      });

      const { result } = renderHook(() => usePerformance({ trackLongTasks: true }));

      const mockEntry = {
        name: 'self',
        entryType: 'longtask',
        startTime: 1000,
        duration: 150,
      } as PerformanceEntry;

      act(() => {
        longTaskCallback?.(mockEntry);
      });

      await waitFor(() => {
        expect(result.current.longTasks).toHaveLength(1);
      });

      expect(result.current.longTasks[0]).toEqual(mockEntry);
    });

    it('should call onLongTask callback when provided', async () => {
      const onLongTask = vi.fn();
      let longTaskCallback: ((entry: PerformanceEntry) => void) | null = null;

      mockObserveLongTasks.mockImplementationOnce((callback) => {
        longTaskCallback = callback;
        return vi.fn();
      });

      renderHook(() => usePerformance({ trackLongTasks: true, onLongTask }));

      const mockEntry = {
        name: 'self',
        entryType: 'longtask',
        startTime: 1000,
        duration: 150,
      } as PerformanceEntry;

      act(() => {
        longTaskCallback?.(mockEntry);
      });

      await waitFor(() => {
        expect(onLongTask).toHaveBeenCalledWith(mockEntry);
      });
    });
  });

  describe('Async Measurement', () => {
    it('should measure async operations', async () => {
      const { result } = renderHook(() => usePerformance());

      let measuredResult: { result: string; duration: number } | null = null;

      await act(async () => {
        measuredResult = await result.current.measure('async-op', async () => {
          return 'test-result';
        });
      });

      expect(mockMeasure).toHaveBeenCalledWith('async-op', expect.any(Function));
      expect(measuredResult?.result).toBe('test-result');
      expect(measuredResult?.duration).toBe(100);
    });
  });
});

describe('useRenderTime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
  });

  it('should measure render time', () => {
    mockPerformanceNow
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1050); // End time (after effect)

    const { result } = renderHook(() => useRenderTime('TestComponent'));

    expect(result.current).toBeGreaterThanOrEqual(0);
  });

  it('should attempt to create performance measure', () => {
    const { rerender } = renderHook(() => useRenderTime('TestComponent'));

    rerender();

    expect(mockPerformanceMeasure).toHaveBeenCalled();
  });

  it('should not throw if performance.measure fails', () => {
    mockPerformanceMeasure.mockImplementationOnce(() => {
      throw new Error('Measure failed');
    });

    expect(() => {
      renderHook(() => useRenderTime('TestComponent'));
    }).not.toThrow();
  });

  it('should warn in development for slow renders', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;

    try {
      process.env.NODE_ENV = 'development';

      // useRenderTime reads performance.now() three times:
      // initial ref, render assignment, and effect measurement.
      mockPerformanceNow
        .mockReturnValueOnce(900)
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1025); // 25ms render (> 16ms)

      renderHook(() => useRenderTime('SlowComponent'));

      // Warning should be called in development
      expect(consoleWarn).toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = originalEnv;
      consoleWarn.mockRestore();
    }
  });
});

describe('useAsyncTiming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAsyncTiming());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.lastDuration).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should time async operations', async () => {
    const { result } = renderHook(() => useAsyncTiming());

    let timedResult: string = '';

    await act(async () => {
      timedResult = await result.current.time('test-op', async () => {
        return 'test-result';
      });
    });

    expect(timedResult).toBe('test-result');
    expect(result.current.lastDuration).toBe(100);
    expect(result.current.isLoading).toBe(false);
  });

  it('should set loading state during operation', async () => {
    const { result } = renderHook(() => useAsyncTiming());

    let resolveOperation: ((value: string) => void) | null = null;
    const operation = new Promise<string>((resolve) => {
      resolveOperation = resolve;
    });

    let timedPromise: Promise<string> | null = null;
    act(() => {
      timedPromise = result.current.time('test-op', async () => operation);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolveOperation?.('result');
      await timedPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle errors', async () => {
    const { result } = renderHook(() => useAsyncTiming());

    await act(async () => {
      await expect(
        result.current.time('test-op', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Test error');
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should clear error on new operation', async () => {
    const { result } = renderHook(() => useAsyncTiming());

    // First operation fails
    await act(async () => {
      await expect(
        result.current.time('test-op-1', async () => {
          throw new Error('First error');
        })
      ).rejects.toThrow();
    });

    expect(result.current.error).toBeDefined();

    // Second operation succeeds
    await act(async () => {
      await result.current.time('test-op-2', async () => 'success');
    });

    expect(result.current.error).toBeNull();
  });
});

describe('useIdleCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should schedule callback during idle time', () => {
    const mockRequestIdleCallback = vi.fn((cb) => {
      setTimeout(cb, 0);
      return 1;
    });

    (global as any).requestIdleCallback = mockRequestIdleCallback;

    const { result } = renderHook(() => useIdleCallback());
    const callback = vi.fn();

    act(() => {
      result.current(callback, 2000);
    });

    expect(mockRequestIdleCallback).toHaveBeenCalledWith(
      expect.any(Function),
      { timeout: 2000 }
    );

    delete (global as any).requestIdleCallback;
  });

  it('should fallback to setTimeout when requestIdleCallback not available', () => {
    const mockSetTimeout = vi.spyOn(global, 'setTimeout');

    const { result } = renderHook(() => useIdleCallback());
    const callback = vi.fn();

    act(() => {
      result.current(callback);
    });

    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1);

    mockSetTimeout.mockRestore();
  });

  it('should cancel idle callback on unmount', () => {
    const mockCancelIdleCallback = vi.fn();
    const mockRequestIdleCallback = vi.fn(() => 1);

    (global as any).requestIdleCallback = mockRequestIdleCallback;
    (global as any).cancelIdleCallback = mockCancelIdleCallback;

    const { result, unmount } = renderHook(() => useIdleCallback());

    act(() => {
      result.current(() => {}, 1000);
    });

    unmount();

    expect(mockCancelIdleCallback).toHaveBeenCalledWith(1);

    delete (global as any).requestIdleCallback;
    delete (global as any).cancelIdleCallback;
  });
});

describe('useIntersectionLoad', () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;
  let observerCallback: IntersectionObserverCallback | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();
    observerCallback = null;

    class IntersectionObserverMock {
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = vi.fn();

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }
    }

    global.IntersectionObserver = IntersectionObserverMock as any;
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useIntersectionLoad());

    expect(result.current.isVisible).toBe(false);
    expect(result.current.hasLoaded).toBe(false);
  });

  it('should observe element when ref is set', () => {
    const { result } = renderHook(() => useIntersectionLoad());

    const mockElement = document.createElement('div');

    act(() => {
      result.current.ref(mockElement);
    });

    expect(mockObserve).toHaveBeenCalledWith(mockElement);
  });

  it('should set isVisible when element intersects', () => {
    const { result } = renderHook(() => useIntersectionLoad());

    const mockElement = document.createElement('div');

    act(() => {
      result.current.ref(mockElement);
    });

    act(() => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(result.current.isVisible).toBe(true);
  });

  it('should call onLoad callback when element becomes visible', () => {
    const onLoad = vi.fn();
    const { result } = renderHook(() => useIntersectionLoad({ onLoad }));

    const mockElement = document.createElement('div');

    act(() => {
      result.current.ref(mockElement);
    });

    act(() => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(onLoad).toHaveBeenCalled();
    expect(result.current.hasLoaded).toBe(true);
  });

  it('should only call onLoad once when once=true', () => {
    const onLoad = vi.fn();
    const { result } = renderHook(() => useIntersectionLoad({ onLoad, once: true }));

    const mockElement = document.createElement('div');

    act(() => {
      result.current.ref(mockElement);
    });

    // First intersection
    act(() => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    // Second intersection
    act(() => {
      observerCallback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    act(() => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('should disconnect observer when once=true and loaded', () => {
    const { result } = renderHook(() => useIntersectionLoad({ once: true }));

    const mockElement = document.createElement('div');

    act(() => {
      result.current.ref(mockElement);
    });

    act(() => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should track visibility when once=false', () => {
    const { result } = renderHook(() => useIntersectionLoad({ once: false }));

    const mockElement = document.createElement('div');

    act(() => {
      result.current.ref(mockElement);
    });

    // Enter viewport
    act(() => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(result.current.isVisible).toBe(true);

    // Leave viewport
    act(() => {
      observerCallback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.hasLoaded).toBe(true); // Should remain true
  });

  it('should disconnect observer on unmount', () => {
    const { result, unmount } = renderHook(() => useIntersectionLoad());

    const mockElement = document.createElement('div');

    act(() => {
      result.current.ref(mockElement);
    });

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should handle null ref gracefully', () => {
    const { result } = renderHook(() => useIntersectionLoad());

    expect(() => {
      act(() => {
        result.current.ref(null);
      });
    }).not.toThrow();

    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('should cleanup previous observer when ref changes', () => {
    const { result } = renderHook(() => useIntersectionLoad());

    const element1 = document.createElement('div');
    const element2 = document.createElement('div');

    act(() => {
      result.current.ref(element1);
    });

    expect(mockObserve).toHaveBeenCalledWith(element1);

    act(() => {
      result.current.ref(element2);
    });

    expect(mockDisconnect).toHaveBeenCalled();
    expect(mockObserve).toHaveBeenCalledWith(element2);
  });
});
