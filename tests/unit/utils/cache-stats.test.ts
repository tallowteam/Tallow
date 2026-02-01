import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCacheStats,
  getCacheItems,
  clearCache,
  clearAllCaches,
  formatBytes,
  getStorageQuota,
  checkPersistentStorage,
  requestPersistentStorage,
} from '@/lib/utils/cache-stats';

describe('cache-stats utilities', () => {
  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(2048)).toBe('2 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle decimal values', () => {
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });

  describe('getCacheStats', () => {
    beforeEach(() => {
      // Mock caches API
      const mockCache = {
        keys: vi.fn().mockResolvedValue([
          new Request('https://example.com/test1.js'),
          new Request('https://example.com/test2.css'),
        ]),
        match: vi.fn().mockImplementation((_request) => {
          const mockBlob = new Blob(['test content'], { type: 'text/plain' });
          return Promise.resolve(
            new Response(mockBlob, {
              headers: {
                'content-type': 'text/javascript',
                date: new Date().toUTCString(),
              },
            })
          );
        }),
      };

      global.caches = {
        keys: vi.fn().mockResolvedValue(['cache-v1', 'cache-v2']),
        open: vi.fn().mockResolvedValue(mockCache),
        delete: vi.fn().mockResolvedValue(true),
        match: vi.fn(),
        has: vi.fn(),
      } as any;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return cache statistics', async () => {
      const stats = await getCacheStats();

      expect(stats).toHaveLength(2);
      expect(stats[0]?.name).toBe('cache-v1');
      expect(stats[0]?.items).toBe(2);
      expect(stats[0]?.size).toBeGreaterThan(0);
    });

    it('should return empty array when caches API is not available', async () => {
      global.caches = undefined as any;

      const stats = await getCacheStats();

      expect(stats).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      global.caches.keys = vi.fn().mockRejectedValue(new Error('Cache error'));

      const stats = await getCacheStats();

      expect(stats).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getCacheItems', () => {
    beforeEach(() => {
      const mockCache = {
        keys: vi.fn().mockResolvedValue([
          new Request('https://example.com/large.js'),
          new Request('https://example.com/small.css'),
        ]),
        match: vi.fn().mockImplementation((_request: Request) => {
          const size = _request.url.includes('large') ? 10000 : 1000;
          const mockBlob = new Blob([new Array(size).fill('x').join('')]);

          return Promise.resolve(
            new Response(mockBlob, {
              headers: {
                'content-type': 'text/javascript',
                date: new Date().toUTCString(),
              },
            })
          );
        }),
      };

      global.caches = {
        keys: vi.fn(),
        open: vi.fn().mockResolvedValue(mockCache),
        delete: vi.fn(),
        match: vi.fn(),
        has: vi.fn(),
      } as any;
    });

    it('should return cache items sorted by size', async () => {
      const items = await getCacheItems('test-cache');

      expect(items).toHaveLength(2);
      // Should be sorted by size descending
      expect(items[0]?.size).toBeGreaterThan(items[1]?.size ?? 0);
      expect(items[0]?.url).toContain('large');
    });

    it('should return empty array when caches API is not available', async () => {
      global.caches = undefined as any;

      const items = await getCacheItems('test-cache');

      expect(items).toEqual([]);
    });
  });

  describe('clearCache', () => {
    beforeEach(() => {
      global.caches = {
        keys: vi.fn(),
        open: vi.fn(),
        delete: vi.fn().mockResolvedValue(true),
        match: vi.fn(),
        has: vi.fn(),
      } as any;
    });

    it('should clear a specific cache', async () => {
      const result = await clearCache('test-cache');

      expect(result).toBe(true);
      expect(global.caches.delete).toHaveBeenCalledWith('test-cache');
    });

    it('should return false when caches API is not available', async () => {
      global.caches = undefined as any;

      const result = await clearCache('test-cache');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      global.caches.delete = vi.fn().mockRejectedValue(new Error('Delete error'));

      const result = await clearCache('test-cache');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearAllCaches', () => {
    beforeEach(() => {
      global.caches = {
        keys: vi.fn().mockResolvedValue(['cache-1', 'cache-2', 'cache-3']),
        open: vi.fn(),
        delete: vi.fn().mockResolvedValue(true),
        match: vi.fn(),
        has: vi.fn(),
      } as any;
    });

    it('should clear all caches', async () => {
      const count = await clearAllCaches();

      expect(count).toBe(3);
      expect(global.caches.delete).toHaveBeenCalledTimes(3);
    });

    it('should return 0 when caches API is not available', async () => {
      global.caches = undefined as any;

      const count = await clearAllCaches();

      expect(count).toBe(0);
    });

    it('should count only successfully deleted caches', async () => {
      global.caches.delete = vi
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const count = await clearAllCaches();

      expect(count).toBe(2);
    });
  });

  describe('getStorageQuota', () => {
    it('should return storage quota information', async () => {
      const mockEstimate = {
        usage: 1024 * 1024 * 10, // 10 MB
        quota: 1024 * 1024 * 100, // 100 MB
      };

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: vi.fn().mockResolvedValue(mockEstimate),
        },
      });

      const quota = await getStorageQuota();

      expect(quota).toEqual({
        usage: mockEstimate.usage,
        quota: mockEstimate.quota,
        percentage: 10,
      });
    });

    it('should return null when storage API is not available', async () => {
      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: undefined,
      });

      const quota = await getStorageQuota();

      expect(quota).toBeNull();
    });

    it('should handle zero quota', async () => {
      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: vi.fn().mockResolvedValue({ usage: 0, quota: 0 }),
        },
      });

      const quota = await getStorageQuota();

      expect(quota?.percentage).toBe(0);
    });
  });

  describe('checkPersistentStorage', () => {
    it('should check if storage is persisted', async () => {
      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          persisted: vi.fn().mockResolvedValue(true),
        },
      });

      const persisted = await checkPersistentStorage();

      expect(persisted).toBe(true);
    });

    it('should return false when storage API is not available', async () => {
      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: undefined,
      });

      const persisted = await checkPersistentStorage();

      expect(persisted).toBe(false);
    });
  });

  describe('requestPersistentStorage', () => {
    it('should request persistent storage', async () => {
      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          persist: vi.fn().mockResolvedValue(true),
        },
      });

      const result = await requestPersistentStorage();

      expect(result).toBe(true);
    });

    it('should return false when storage API is not available', async () => {
      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: undefined,
      });

      const result = await requestPersistentStorage();

      expect(result).toBe(false);
    });

    it('should handle user denial', async () => {
      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          persist: vi.fn().mockResolvedValue(false),
        },
      });

      const result = await requestPersistentStorage();

      expect(result).toBe(false);
    });
  });
});
