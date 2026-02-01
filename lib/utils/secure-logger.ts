/**
 * Secure Logger with DEBUG mode support
 * - Production: Only errors (sanitized)
 * - Development: Only shows logs when DEBUG=true in localStorage/sessionStorage
 * - Errors: Always shown in development, sanitized in production
 *
 * Usage:
 * - Enable debug logs: localStorage.setItem('DEBUG', 'true')
 * - Disable debug logs: localStorage.removeItem('DEBUG')
 * - Check status: localStorage.getItem('DEBUG')
 */

const isDev = process.env.NODE_ENV === 'development';

// Check if DEBUG mode is enabled
// Supports both localStorage and process.env for flexibility
const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') {
    // Server-side: check environment variable
    return process.env['DEBUG'] === 'true' || process.env['NEXT_PUBLIC_DEBUG'] === 'true';
  }

  // Client-side: check localStorage/sessionStorage
  try {
    return (
      localStorage.getItem('DEBUG') === 'true' ||
      sessionStorage.getItem('DEBUG') === 'true' ||
      (window as any).__DEBUG__ === true
    );
  } catch {
    return false;
  }
};

// Console log categories for filtering
export enum LogCategory {
  SW = '[SW]',           // Service Worker
  FONT = '[FONT]',       // Font loading
  HMR = '[HMR]',         // Hot Module Replacement
  PERF = '[PERF]',       // Performance
  CRYPTO = '[CRYPTO]',   // Cryptography operations
  P2P = '[P2P]',         // P2P connections
  TRANSFER = '[TRANSFER]', // File transfers
  UI = '[UI]',           // UI interactions
  GENERAL = '',          // General logs
}

export const secureLog = {
  /**
   * Standard log - only shown when DEBUG=true in development
   */
  log: (...args: unknown[]) => {
    if (isDev && isDebugEnabled()) {
      console.log(...args);
    }
  },

  /**
   * Warning log - only shown when DEBUG=true in development
   */
  warn: (...args: unknown[]) => {
    if (isDev && isDebugEnabled()) {
      console.warn(...args);
    }
  },

  /**
   * Error log - always shown but sanitized in production
   */
  error: (...args: unknown[]) => {
    if (isDev) {
      console.error(...args);
    } else {
      // In production, only log generic error indicator
      console.error('An error occurred');
    }
  },

  /**
   * Debug log - only shown when DEBUG=true in development
   */
  debug: (...args: unknown[]) => {
    if (isDev && isDebugEnabled()) {
      console.debug(...args);
    }
  },

  /**
   * Info log - only shown when DEBUG=true in development
   */
  info: (...args: unknown[]) => {
    if (isDev && isDebugEnabled()) {
      console.info(...args);
    }
  },

  /**
   * Force log - always shown in development (use sparingly)
   * Use for critical development information that should always be visible
   */
  force: (...args: unknown[]) => {
    if (isDev) {
      console.log('🔧', ...args);
    }
  },

  /**
   * Categorized log - helps with filtering specific types of logs
   */
  category: (category: LogCategory, ...args: unknown[]) => {
    if (isDev && isDebugEnabled()) {
      console.log(category, ...args);
    }
  },
};

// Named exports for convenience
export const log = secureLog.log;
export const warn = secureLog.warn;
export const error = secureLog.error;
export const debug = secureLog.debug;
export const info = secureLog.info;
export const force = secureLog.force;

// Helper to enable/disable debug mode
export const debugControl = {
  enable: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('DEBUG', 'true');
      console.log('🐛 Debug mode enabled. Refresh to see debug logs.');
    }
  },
  disable: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('DEBUG');
      sessionStorage.removeItem('DEBUG');
      console.log('✅ Debug mode disabled. Console will be quiet.');
    }
  },
  status: () => {
    if (typeof window !== 'undefined') {
      const enabled = isDebugEnabled();
      console.log(`Debug mode: ${enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
      if (!enabled) {
        console.log('To enable: localStorage.setItem("DEBUG", "true")');
      }
      return enabled;
    }
    return false;
  },
};

// Expose debug control globally for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).__debugControl = debugControl;
}

export default secureLog;
