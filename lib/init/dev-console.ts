/**
 * Development Console Initialization
 * Sets up console cleanup and debug controls for development
 */

'use client';

import { installConsoleCleanup } from '@/lib/utils/console-cleanup';

/**
 * Initialize development console configuration
 * Only runs once when the app loads
 */
export function initDevConsole() {
  // Only run in browser
  if (typeof window === 'undefined') {
    return;
  }

  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Prevent multiple initializations
  if ((window as any).__devConsoleInitialized) {
    return;
  }

  (window as any).__devConsoleInitialized = true;

  // Install console cleanup (suppresses non-essential logs)
  installConsoleCleanup();

  // Print helpful debug instructions (only once on first load)
  const hasSeenInstructions = sessionStorage.getItem('debug-instructions-seen');

  if (!hasSeenInstructions) {
    const isDebugEnabled =
      localStorage.getItem('DEBUG') === 'true' ||
      sessionStorage.getItem('DEBUG') === 'true';

    if (!isDebugEnabled) {
      console.log(
        '%c🔧 Tallow Development Mode',
        'background: #0ea5e9; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
      );
      console.log(
        '%cConsole is in quiet mode. To enable debug logs:',
        'color: #64748b; font-weight: normal;'
      );
      console.log(
        '%clocalStorage.setItem("DEBUG", "true")',
        'background: #1e293b; color: #fefefc; padding: 2px 6px; border-radius: 3px; font-family: monospace;'
      );
      console.log(
        '%cThen refresh the page.',
        'color: #64748b; font-weight: normal;'
      );
      console.log(' ');
    } else {
      console.log(
        '%c🐛 Debug Mode Enabled',
        'background: #22c55e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
      );
      console.log(
        '%cAll debug logs are visible. To disable:',
        'color: #64748b; font-weight: normal;'
      );
      console.log(
        '%clocalStorage.removeItem("DEBUG")',
        'background: #1e293b; color: #fefefc; padding: 2px 6px; border-radius: 3px; font-family: monospace;'
      );
      console.log(' ');
    }

    sessionStorage.setItem('debug-instructions-seen', 'true');
  }
}

// Auto-initialize when module is imported
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Use setTimeout to ensure this runs after the app has mounted
  setTimeout(initDevConsole, 0);
}
