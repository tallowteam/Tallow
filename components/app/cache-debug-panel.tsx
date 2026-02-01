'use client';

import { useEffect, useState } from 'react';
import {
  getCacheStats,
  clearCache,
  clearAllCaches,
  formatBytes,
  getStorageQuota,
  logCacheStats,
  type CacheStats,
} from '@/lib/utils/cache-stats';
import { useServiceWorker } from '@/lib/hooks/use-service-worker';
import { Database, Trash2, RefreshCw, Info } from 'lucide-react';

/**
 * Cache Debug Panel
 * Developer tool for monitoring and managing service worker caches
 * Only shown in development mode
 */
export function CacheDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<CacheStats[]>([]);
  const [quota, setQuota] = useState<{
    usage: number;
    quota: number;
    percentage: number;
  } | null>(null);
  const { isRegistered, preloadPQCChunks } = useServiceWorker();

  // Only show in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isOpen && isDevelopment) {
      loadStats();
    }
  }, [isOpen, isDevelopment]);

  const loadStats = async () => {
    const cacheStats = await getCacheStats();
    setStats(cacheStats);

    const quotaInfo = await getStorageQuota();
    setQuota(quotaInfo);
  };

  const handleClearCache = async (cacheName: string) => {
    const cleared = await clearCache(cacheName);
    if (cleared) {
      await loadStats();
    }
  };

  const handleClearAll = async () => {
    const cleared = await clearAllCaches();
    if (cleared > 0) {
      await loadStats();
    }
  };

  if (!isDevelopment) {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-purple-600 p-3 text-white shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        aria-label="Toggle cache debug panel"
      >
        <Database className="h-5 w-5" />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 max-h-[600px] overflow-auto rounded-lg border bg-background shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 border-b bg-background p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Cache Debug Panel</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => logCacheStats()}
                  className="rounded p-1 hover:bg-muted"
                  title="Log to console"
                >
                  <Info className="h-4 w-4" />
                </button>
                <button
                  onClick={loadStats}
                  className="rounded p-1 hover:bg-muted"
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded p-1 hover:bg-muted"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Service Worker Status */}
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div
                className={`h-2 w-2 rounded-full ${
                  isRegistered ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-muted-foreground">
                {isRegistered ? 'Service Worker Active' : 'Service Worker Inactive'}
              </span>
            </div>

            {/* Storage Quota */}
            {quota && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Storage Used</span>
                  <span className="font-mono">
                    {formatBytes(quota.usage)} / {formatBytes(quota.quota)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-white/80"
                    style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                  />
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {quota.percentage.toFixed(1)}% used
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-b p-4">
            <div className="flex gap-2">
              <button
                onClick={preloadPQCChunks}
                className="flex-1 rounded bg-[#fefefc] px-3 py-2 text-sm font-medium text-[#191610] hover:bg-[#fefefc]/80 dark:text-[#fefefc] dark:bg-[#fefefc]/20 dark:hover:bg-[#fefefc]/30"
              >
                Preload PQC
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 rounded bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                <Trash2 className="h-3 w-3" />
                Clear All
              </button>
            </div>
          </div>

          {/* Cache List */}
          <div className="divide-y">
            {stats.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No caches found
              </div>
            ) : (
              stats.map((cache) => (
                <div key={cache.name} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{cache.name}</div>
                      <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                        <div>{cache.items} items</div>
                        <div className="font-mono">{formatBytes(cache.size)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleClearCache(cache.name)}
                      className="rounded p-1 hover:bg-muted"
                      title="Clear cache"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>

                  {cache.oldestItem && (
                    <div className="mt-2 truncate text-xs text-muted-foreground">
                      Oldest: {new URL(cache.oldestItem).pathname}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          {stats.length > 0 && (
            <div className="border-t bg-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Total</span>
                <div className="space-y-1 text-right">
                  <div>
                    {stats.reduce((sum, cache) => sum + cache.items, 0)} items
                  </div>
                  <div className="font-mono">
                    {formatBytes(
                      stats.reduce((sum, cache) => sum + cache.size, 0)
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
