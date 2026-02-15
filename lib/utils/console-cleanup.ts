 
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

type ConsoleMethods = {
  log: typeof console.log;
  info: typeof console.info;
  warn: typeof console.warn;
  debug: typeof console.debug;
};

// Store console methods from install-time so tests/apps can restore exactly what they had.
let originalConsole: ConsoleMethods | null = null;
let isInstalled = false;
const WRAPPED_MARKER = '__consoleCleanupWrapped';

function isWrapped(fn: (...args: unknown[]) => unknown): boolean {
  return (fn as { [WRAPPED_MARKER]?: boolean })[WRAPPED_MARKER] === true;
}

/**
 * Check if a message should be suppressed
 */
function shouldSuppress(args: unknown[]): boolean {
  const message = args.map(arg => {
    if (typeof arg === 'string') {
      return arg;
    }

    if (arg === null) {
      return 'null';
    }

    if (arg === undefined) {
      return 'undefined';
    }

    try {
      const serialized = JSON.stringify(arg);
      if (serialized !== undefined) {
        return serialized;
      }
    } catch {
      // Fallback for circular structures and non-serializable values.
    }

    return String(arg);
  }).join(' ');

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

  const baseLog = isWrapped(console.log as (...args: unknown[]) => unknown) && originalConsole
    ? originalConsole.log
    : console.log;
  const baseInfo = isWrapped(console.info as (...args: unknown[]) => unknown) && originalConsole
    ? originalConsole.info
    : console.info;
  const baseWarn = isWrapped(console.warn as (...args: unknown[]) => unknown) && originalConsole
    ? originalConsole.warn
    : console.warn;
  const baseDebug = isWrapped(console.debug as (...args: unknown[]) => unknown) && originalConsole
    ? originalConsole.debug
    : console.debug;

  originalConsole = {
    log: baseLog,
    info: baseInfo,
    warn: baseWarn,
    debug: baseDebug,
  };
  isInstalled = true;

  const passthroughConsole = originalConsole;

  // Override console methods with filtering
  const wrappedLog: typeof console.log = (...args: unknown[]) => {
    if (!shouldSuppress(args)) {
      passthroughConsole.log(...args);
    }
  };
  (wrappedLog as { [WRAPPED_MARKER]?: boolean })[WRAPPED_MARKER] = true;
  console.log = wrappedLog;

  const wrappedInfo: typeof console.info = (...args: unknown[]) => {
    if (!shouldSuppress(args)) {
      passthroughConsole.info(...args);
    }
  };
  (wrappedInfo as { [WRAPPED_MARKER]?: boolean })[WRAPPED_MARKER] = true;
  console.info = wrappedInfo;

  const wrappedWarn: typeof console.warn = (...args: unknown[]) => {
    if (!shouldSuppress(args)) {
      passthroughConsole.warn(...args);
    }
  };
  (wrappedWarn as { [WRAPPED_MARKER]?: boolean })[WRAPPED_MARKER] = true;
  console.warn = wrappedWarn;

  const wrappedDebug: typeof console.debug = (...args: unknown[]) => {
    if (!shouldSuppress(args)) {
      passthroughConsole.debug(...args);
    }
  };
  (wrappedDebug as { [WRAPPED_MARKER]?: boolean })[WRAPPED_MARKER] = true;
  console.debug = wrappedDebug;

  // Always preserve console.error - errors should always be visible
  // console.error is not overridden
}

/**
 * Restore original console methods
 */
export function restoreConsole() {
  if (!isInstalled || originalConsole === null) {
    return;
  }

  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.debug = originalConsole.debug;
  originalConsole = null;
  isInstalled = false;
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
