/**
 * Safe Storage Adapter for Zustand Persist
 *
 * Provides SSR-safe localStorage access with fallback to memory storage
 * for server-side rendering and environments where localStorage is unavailable.
 *
 * @module stores/storage
 */

import type { StateStorage } from 'zustand/middleware';

/**
 * In-memory storage fallback for SSR
 */
class MemoryStorage implements StateStorage {
  private storage = new Map<string, string>();

  getItem(name: string): string | null {
    return this.storage.get(name) || null;
  }

  setItem(name: string, value: string): void {
    this.storage.set(name, value);
  }

  removeItem(name: string): void {
    this.storage.delete(name);
  }
}

/**
 * Safe storage that works in both browser and server environments
 */
export const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return window.localStorage.getItem(name);
    } catch (error) {
      console.warn('localStorage.getItem error:', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(name, value);
    } catch (error) {
      console.warn('localStorage.setItem error:', error);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.removeItem(name);
    } catch (error) {
      console.warn('localStorage.removeItem error:', error);
    }
  },
};

/**
 * Create a safe storage instance with custom prefix
 */
export function createSafeStorage(prefix: string = 'tallow'): StateStorage {
  const memoryStorage = new MemoryStorage();
  const isServer = typeof window === 'undefined';

  return {
    getItem: (name: string): string | null => {
      if (isServer) {
        return memoryStorage.getItem(name);
      }
      try {
        return window.localStorage.getItem(`${prefix}:${name}`);
      } catch (error) {
        console.warn('localStorage.getItem error:', error);
        return memoryStorage.getItem(name);
      }
    },
    setItem: (name: string, value: string): void => {
      if (isServer) {
        memoryStorage.setItem(name, value);
        return;
      }
      try {
        window.localStorage.setItem(`${prefix}:${name}`, value);
      } catch (error) {
        console.warn('localStorage.setItem error:', error);
        memoryStorage.setItem(name, value);
      }
    },
    removeItem: (name: string): void => {
      if (isServer) {
        memoryStorage.removeItem(name);
        return;
      }
      try {
        window.localStorage.removeItem(`${prefix}:${name}`);
      } catch (error) {
        console.warn('localStorage.removeItem error:', error);
        memoryStorage.removeItem(name);
      }
    },
  };
}
