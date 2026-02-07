import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  clearOldCaches,
  forceHardRefresh,
  isServedFromCache,
} from '../../../lib/utils/cache-buster';

// Mock global objects
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
    clear: () => {
      store = {};
    },
  };
})();

describe('Cache Buster', () => {
  beforeEach(() => {
    // Setup mocks
    vi.stubGlobal('localStorage', mockLocalStorage);
    mockLocalStorage.clear();

    // Mock caches API
    const mockCaches = {
      keys: vi.fn().mockResolvedValue(['cache-v1', 'cache-v2']),
      delete: vi.fn().mockResolvedValue(true),
    };
    vi.stubGlobal('caches', mockCaches);

    // Mock service worker
    const mockServiceWorker = {
      getRegistrations: vi.fn().mockResolvedValue([
        { unregister: vi.fn().mockResolvedValue(true) },
        { unregister: vi.fn().mockResolvedValue(true) },
      ]),
    };
    vi.stubGlobal('navigator', {
      serviceWorker: mockServiceWorker,
    });

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });

    // Mock console methods
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('clearOldCaches', () => {
    it('should skip on server-side (window undefined)', async () => {
      vi.stubGlobal('window', undefined);

      const result = await clearOldCaches();
      expect(result).toBeUndefined();
    });

    it('should clear caches when version changes', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'old-version');

      vi.useFakeTimers();
      const promise = clearOldCaches();

      // Fast-forward through the reload timeout
      vi.advanceTimersByTime(2000);

      const result = await promise;

      expect(result).toBe(true);
      expect(global.caches.delete).toHaveBeenCalledWith('cache-v1');
      expect(global.caches.delete).toHaveBeenCalledWith('cache-v2');

      vi.useRealTimers();
    });

    it('should return false when version matches', async () => {
      // Set current version
      mockLocalStorage.setItem('tallow-app-version', '2026-01-29-v1');

      const result = await clearOldCaches();

      expect(result).toBe(false);
      expect(console.info).toHaveBeenCalledWith(
        '[Cache Buster] App version is current:',
        '2026-01-29-v1'
      );
    });

    it('should delete all cache entries', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'old-version');

      vi.useFakeTimers();
      const promise = clearOldCaches();
      vi.advanceTimersByTime(2000);
      await promise;

      expect(global.caches.keys).toHaveBeenCalled();
      expect(global.caches.delete).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should unregister service workers', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'old-version');

      const registrations = await (global.navigator as any).serviceWorker.getRegistrations();
      const unregisterSpy1 = registrations[0].unregister;
      const unregisterSpy2 = registrations[1].unregister;

      vi.useFakeTimers();
      const promise = clearOldCaches();
      vi.advanceTimersByTime(2000);
      await promise;

      expect(unregisterSpy1).toHaveBeenCalled();
      expect(unregisterSpy2).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should remove cache-related localStorage items', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'old-version');
      mockLocalStorage.setItem('tallow-cache-data', 'some-data');
      mockLocalStorage.setItem('sw-precache', 'precache-data');
      mockLocalStorage.setItem('workbox-precache', 'workbox-data');
      mockLocalStorage.setItem('user-settings', 'keep-this');

      vi.useFakeTimers();
      const promise = clearOldCaches();
      vi.advanceTimersByTime(2000);
      await promise;

      expect(mockLocalStorage.getItem('tallow-cache-data')).toBeNull();
      expect(mockLocalStorage.getItem('sw-precache')).toBeNull();
      expect(mockLocalStorage.getItem('workbox-precache')).toBeNull();
      expect(mockLocalStorage.getItem('user-settings')).toBe('keep-this');

      vi.useRealTimers();
    });

    it('should update version after clearing', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'old-version');

      vi.useFakeTimers();
      const promise = clearOldCaches();
      vi.advanceTimersByTime(2000);
      await promise;

      expect(mockLocalStorage.getItem('tallow-app-version')).toBe('2026-01-29-v1');

      vi.useRealTimers();
    });

    it('should reload page after clearing', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'old-version');

      vi.useFakeTimers();
      const reloadSpy = vi.spyOn(window.location, 'reload');

      const promise = clearOldCaches();
      vi.advanceTimersByTime(2000);
      await promise;

      expect(reloadSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should handle errors gracefully', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'old-version');

      // Make caches.keys throw an error
      (global.caches.keys as any).mockRejectedValue(new Error('Cache API error'));

      const result = await clearOldCaches();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        '[Cache Buster] Error clearing caches:',
        expect.any(Error)
      );
    });

    it('should log version mismatch', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'old-version');

      vi.useFakeTimers();
      const promise = clearOldCaches();
      vi.advanceTimersByTime(2000);
      await promise;

      expect(console.info).toHaveBeenCalledWith(
        '[Cache Buster] Version mismatch detected. Clearing old caches...'
      );
      expect(console.info).toHaveBeenCalledWith('[Cache Buster] Old version:', 'old-version');
      expect(console.info).toHaveBeenCalledWith('[Cache Buster] New version:', '2026-01-29-v1');

      vi.useRealTimers();
    });

    it('should work when caches API is unavailable', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'old-version');
      vi.stubGlobal('caches', undefined);

      vi.useFakeTimers();
      const promise = clearOldCaches();
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBe(true);

      vi.useRealTimers();
    });

    it('should work when service worker is unavailable', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'old-version');
      vi.stubGlobal('navigator', { serviceWorker: undefined });

      vi.useFakeTimers();
      const promise = clearOldCaches();
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('forceHardRefresh', () => {
    it('should reload with cache bypass', () => {
      const reloadSpy = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadSpy },
        writable: true,
      });

      forceHardRefresh();

      expect(reloadSpy).toHaveBeenCalledWith(true);
    });

    it('should skip on server-side', () => {
      vi.stubGlobal('window', undefined);

      expect(() => forceHardRefresh()).not.toThrow();
    });
  });

  describe('isServedFromCache', () => {
    it('should return false on server-side', async () => {
      vi.stubGlobal('window', undefined);

      const result = await isServedFromCache();
      expect(result).toBe(false);
    });

    it('should detect service worker controller', async () => {
      vi.stubGlobal('navigator', {
        serviceWorker: {
          controller: { id: 'sw-controller' },
        },
      });

      const result = await isServedFromCache();
      expect(result).toBe(true);
    });

    it('should detect cache via Performance API', async () => {
      vi.stubGlobal('navigator', {
        serviceWorker: { controller: null },
      });

      const mockPerformance = {
        getEntriesByType: vi.fn().mockReturnValue([
          { transferSize: 0 },
        ]),
      };
      vi.stubGlobal('performance', mockPerformance);

      const result = await isServedFromCache();
      expect(result).toBe(true);
    });

    it('should return false when not cached', async () => {
      vi.stubGlobal('navigator', {
        serviceWorker: { controller: null },
      });

      const mockPerformance = {
        getEntriesByType: vi.fn().mockReturnValue([
          { transferSize: 1234 },
        ]),
      };
      vi.stubGlobal('performance', mockPerformance);

      const result = await isServedFromCache();
      expect(result).toBe(false);
    });

    it('should handle missing Performance API', async () => {
      vi.stubGlobal('navigator', {
        serviceWorker: { controller: null },
      });
      vi.stubGlobal('performance', undefined);

      const result = await isServedFromCache();
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      vi.stubGlobal('navigator', {
        serviceWorker: {
          get controller() {
            throw new Error('ServiceWorker error');
          },
        },
      });

      const result = await isServedFromCache();
      expect(result).toBe(false);
    });

    it('should handle empty performance entries', async () => {
      vi.stubGlobal('navigator', {
        serviceWorker: { controller: null },
      });

      const mockPerformance = {
        getEntriesByType: vi.fn().mockReturnValue([]),
      };
      vi.stubGlobal('performance', mockPerformance);

      const result = await isServedFromCache();
      expect(result).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should handle first run (no version)', async () => {
      // No version set
      expect(mockLocalStorage.getItem('tallow-app-version')).toBeNull();

      vi.useFakeTimers();
      const promise = clearOldCaches();
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBe(true);
      expect(mockLocalStorage.getItem('tallow-app-version')).toBe('2026-01-29-v1');

      vi.useRealTimers();
    });

    it('should handle multiple sequential clears', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'v1');

      vi.useFakeTimers();

      // First clear
      const promise1 = clearOldCaches();
      vi.advanceTimersByTime(2000);
      await promise1;

      // Second clear (version now matches)
      const result2 = await clearOldCaches();
      expect(result2).toBe(false);

      vi.useRealTimers();
    });

    it('should remove only cache-related keys, not all', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'old');
      mockLocalStorage.setItem('tallow-cache-test', 'remove-me');
      mockLocalStorage.setItem('user-theme', 'dark');
      mockLocalStorage.setItem('user-name', 'John');
      mockLocalStorage.setItem('sw-something', 'remove-me-too');

      vi.useFakeTimers();
      const promise = clearOldCaches();
      vi.advanceTimersByTime(2000);
      await promise;

      expect(mockLocalStorage.getItem('tallow-cache-test')).toBeNull();
      expect(mockLocalStorage.getItem('sw-something')).toBeNull();
      expect(mockLocalStorage.getItem('user-theme')).toBe('dark');
      expect(mockLocalStorage.getItem('user-name')).toBe('John');

      vi.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null localStorage values', async () => {
      const result = await clearOldCaches();
      expect(result).toBe(true); // No version = treat as update needed
    });

    it('should handle empty cache names array', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'old');
      (global.caches.keys as any).mockResolvedValue([]);

      vi.useFakeTimers();
      const promise = clearOldCaches();
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBe(true);

      vi.useRealTimers();
    });

    it('should handle empty service worker registrations', async () => {
      mockLocalStorage.setItem('tallow-app-version', 'old');
      const mockSW = {
        getRegistrations: vi.fn().mockResolvedValue([]),
      };
      vi.stubGlobal('navigator', { serviceWorker: mockSW });

      vi.useFakeTimers();
      const promise = clearOldCaches();
      vi.advanceTimersByTime(2000);
      const result = await promise;

      expect(result).toBe(true);

      vi.useRealTimers();
    });
  });
});
