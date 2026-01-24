/**
 * Secure Logger
 * Only logs in development mode, completely silent in production
 * Prevents accidental information leakage through console
 */

const isDev = process.env.NODE_ENV === 'development';

export const secureLog = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // Errors are logged in production but sanitized
    if (isDev) {
      console.error(...args);
    } else {
      // In production, only log generic error indicator
      console.error('An error occurred');
    }
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
};

export default secureLog;
