/* eslint-disable no-console */
/**
 * Console Cleanup Utility
 * Suppresses non-essential development console noise
 * Only runs in development mode, doesn't affect production
 */

// List of patterns to suppress in development console
const SUPPRESS_PATTERNS = [
  // Font preload warnings
  /preload.*font/i,
  /font.*preload/i,
  /resource.*font/i,

  // Service Worker messages (already handled by secure-logger)
  /service worker/i,

  // Fast Refresh / HMR messages
  /fast refresh/i,
  /hmr/i,
  /hot.*module.*replacement/i,
  /webpack.*hmr/i,

  // Next.js development warnings that are non-critical
  /revalidate.*path/i,

  // Webpack build messages
  /webpack.*compiled/i,

  // Performance optimization suggestions (we've already optimized)
  /consider.*preload/i,
  /optimize.*loading/i,
];

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  debug: console.debug,
};

/**
 * Check if a message should be suppressed
 */
function shouldSuppress(args: unknown[]): boolean {
  const message = args.map(arg =>
    typeof arg === 'string' ? arg : JSON.stringify(arg)
  ).join(' ');

  return SUPPRESS_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Install console cleanup filters
 */
export function installConsoleCleanup() {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Only filter if DEBUG mode is disabled
  if (typeof window !== 'undefined') {
    const isDebugEnabled =
      localStorage.getItem('DEBUG') === 'true' ||
      sessionStorage.getItem('DEBUG') === 'true';

    if (isDebugEnabled) {
      // DEBUG mode is on - don't filter anything
      return;
    }
  }

  // Override console methods with filtering
  console.log = (...args: unknown[]) => {
    if (!shouldSuppress(args)) {
      originalConsole.log(...args);
    }
  };

  console.info = (...args: unknown[]) => {
    if (!shouldSuppress(args)) {
      originalConsole.info(...args);
    }
  };

  console.warn = (...args: unknown[]) => {
    if (!shouldSuppress(args)) {
      originalConsole.warn(...args);
    }
  };

  console.debug = (...args: unknown[]) => {
    if (!shouldSuppress(args)) {
      originalConsole.debug(...args);
    }
  };

  // Always preserve console.error - errors should always be visible
  // console.error is not overridden
}

/**
 * Restore original console methods
 */
export function restoreConsole() {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.debug = originalConsole.debug;
}

/**
 * Suppress specific Next.js development warnings
 */
export function suppressNextJsWarnings() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Suppress Next.js font optimization warnings
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const message = args.join(' ');

    // List of specific Next.js warnings to suppress
    const suppressList = [
      'next/font',
      'Font optimization',
      'preload',
    ];

    const shouldSuppress = suppressList.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );

    if (!shouldSuppress) {
      originalWarn(...args);
    }
  };
}

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).__consoleCleanup = {
    install: installConsoleCleanup,
    restore: restoreConsole,
  };
}
