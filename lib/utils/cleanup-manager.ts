/**
 * Cleanup Manager
 * Handles proper cleanup of resources to prevent memory leaks
 */

import secureLog from './secure-logger';

type CleanupCallback = () => void | Promise<void>;

class CleanupManager {
  private callbacks = new Map<string, CleanupCallback>();
  private timers = new Set<NodeJS.Timeout>();
  private intervals = new Set<NodeJS.Timeout>();
  private listeners = new Map<string, { target: EventTarget; type: string; listener: EventListener }>();

  /**
   * Register a cleanup callback
   */
  register(id: string, callback: CleanupCallback): void {
    if (this.callbacks.has(id)) {
      secureLog.warn(`[CleanupManager] Replacing existing cleanup for: ${id}`);
    }
    this.callbacks.set(id, callback);
  }

  /**
   * Unregister a cleanup callback
   */
  unregister(id: string): void {
    this.callbacks.delete(id);
  }

  /**
   * Create a managed timeout
   */
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    this.timers.add(timer);
    return timer;
  }

  /**
   * Create a managed interval
   */
  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }

  /**
   * Clear a managed timeout
   */
  clearTimeout(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  /**
   * Clear a managed interval
   */
  clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  /**
   * Add a managed event listener
   */
  addEventListener(
    id: string,
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
    this.listeners.set(id, { target, type, listener });
  }

  /**
   * Remove a managed event listener
   */
  removeEventListener(id: string): void {
    const entry = this.listeners.get(id);
    if (entry) {
      entry.target.removeEventListener(entry.type, entry.listener);
      this.listeners.delete(id);
    }
  }

  /**
   * Clean up a specific resource
   */
  async cleanup(id: string): Promise<void> {
    const callback = this.callbacks.get(id);
    if (callback) {
      try {
        await callback();
        this.callbacks.delete(id);
      } catch (error) {
        secureLog.error(`[CleanupManager] Error cleaning up ${id}:`, error);
      }
    }
  }

  /**
   * Clean up all resources
   */
  async cleanupAll(): Promise<void> {
    // Clear all timers
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Clear all intervals
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();

    // Remove all event listeners
    for (const [id, entry] of this.listeners) {
      try {
        entry.target.removeEventListener(entry.type, entry.listener);
      } catch (error) {
        secureLog.error(`[CleanupManager] Error removing listener ${id}:`, error);
      }
    }
    this.listeners.clear();

    // Run all cleanup callbacks
    const cleanupPromises = Array.from(this.callbacks.entries()).map(
      async ([id, callback]) => {
        try {
          await callback();
        } catch (error) {
          secureLog.error(`[CleanupManager] Error in cleanup callback ${id}:`, error);
        }
      }
    );

    await Promise.all(cleanupPromises);
    this.callbacks.clear();

    secureLog.log('[CleanupManager] All resources cleaned up');
  }

  /**
   * Get cleanup stats
   */
  getStats(): {
    callbacks: number;
    timers: number;
    intervals: number;
    listeners: number;
  } {
    return {
      callbacks: this.callbacks.size,
      timers: this.timers.size,
      intervals: this.intervals.size,
      listeners: this.listeners.size,
    };
  }
}

// Singleton instance
export const cleanupManager = new CleanupManager();

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cleanupManager.cleanupAll().catch((error) => {
      secureLog.error('[CleanupManager] Error during page unload cleanup:', error);
    });
  });

  // Clean up on visibility change (page hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Run lighter cleanup when page is hidden
      const stats = cleanupManager.getStats();
      secureLog.log('[CleanupManager] Page hidden, active resources:', stats);
    }
  });
}

export default cleanupManager;

/**
 * React hook for automatic cleanup
 * Note: This should be used with React.useEffect
 * Example: useEffect(() => useCleanup('my-id', () => { ... }), [])
 */
export function useCleanup(id: string, callback: CleanupCallback): () => void {
  if (typeof window === 'undefined') {return () => {};}

  // Register cleanup on mount
  cleanupManager.register(id, callback);

  // Cleanup on unmount
  return () => {
    cleanupManager.cleanup(id).catch((error) => {
      secureLog.error(`[useCleanup] Error cleaning up ${id}:`, error);
    });
  };
}
