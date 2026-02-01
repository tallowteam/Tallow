'use client';

import { useEffect, useState } from 'react';
import { memoryMonitor } from '@/lib/utils/memory-monitor';
import { X, Activity, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Development Tools Panel
 * Shows memory usage, performance metrics, and dev controls
 * Only visible in development mode
 */
export function DevToolsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    // Only show in development
    setIsDevelopment(process.env.NODE_ENV === 'development');
  }, []);

  useEffect(() => {
    if (!isDevelopment || !isOpen) {return;}

    const interval = setInterval(() => {
      const report = memoryMonitor.getReport();
      setMemoryStats(report);
    }, 2000);

    return () => clearInterval(interval);
  }, [isDevelopment, isOpen]);

  if (!isDevelopment) {return null;}

  const formatBytes = (bytes: number) => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9998] flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
        aria-label="Toggle dev tools"
        title="Dev Tools"
      >
        <Activity className="h-5 w-5" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-[9999] w-96 rounded-lg border border-border bg-background p-4 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Activity className="h-5 w-5 text-orange-500" />
                Dev Tools
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Memory Stats */}
            {memoryStats && (
              <div className="space-y-3">
                <div className="rounded-lg bg-muted p-3">
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Memory Usage</h4>

                  {memoryStats.current && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Heap Used:</span>
                        <span className="font-mono">{formatBytes(memoryStats.current.heapUsed)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Heap Total:</span>
                        <span className="font-mono">{formatBytes(memoryStats.current.heapTotal)}</span>
                      </div>
                      {memoryStats.current.heapTotal > 0 && (
                        <div className="flex justify-between">
                          <span>Usage:</span>
                          <span className="font-mono">
                            {((memoryStats.current.heapUsed / memoryStats.current.heapTotal) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}

                      {/* Memory usage bar */}
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted-foreground/20">
                        <div
                          className={`h-full transition-all ${
                            (memoryStats.current.heapUsed / memoryStats.current.heapTotal) > 0.9
                              ? 'bg-red-500'
                              : (memoryStats.current.heapUsed / memoryStats.current.heapTotal) > 0.7
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: `${(memoryStats.current.heapUsed / memoryStats.current.heapTotal) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Peak Memory */}
                {memoryStats.peak && (
                  <div className="rounded-lg bg-muted p-3">
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">Peak Memory</h4>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Peak Usage:</span>
                        <span className="font-mono">{formatBytes(memoryStats.peak.heapUsed)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Leak Detection */}
                {memoryStats.leakDetected && (
                  <div className="rounded-lg bg-red-500/10 p-3">
                    <p className="text-sm font-medium text-red-500">
                      ⚠️ Possible memory leak detected!
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Memory is consistently growing. Check for event listeners or timers.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      memoryMonitor.clear();
                      setMemoryStats(null);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Stats
                  </button>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="mt-4 rounded-lg border border-border/50 bg-muted/30 p-3">
              <h4 className="mb-2 text-xs font-medium text-muted-foreground">Dev Tips</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Service worker disabled in dev mode</li>
                <li>• Hot reload optimized for speed</li>
                <li>• Memory monitoring active</li>
                <li>• Check console for detailed logs</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
