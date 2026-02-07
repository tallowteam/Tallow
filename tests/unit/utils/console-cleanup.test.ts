import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  installConsoleCleanup,
  restoreConsole,
  suppressNextJsWarnings,
} from '../../../lib/utils/console-cleanup';

describe('Console Cleanup', () => {
  let originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    debug: typeof console.debug;
    error: typeof console.error;
  };

  let originalEnv: string | undefined;
  let mockLocalStorage: Storage;
  let mockSessionStorage: Storage;

  beforeEach(() => {
    // Save original console methods
    originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      debug: console.debug,
      error: console.error,
    };

    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV;

    // Setup mock storage
    const createMockStorage = (): Storage => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
        key: (index: number) => Object.keys(store)[index] || null,
        get length() {
          return Object.keys(store).length;
        },
      };
    };

    mockLocalStorage = createMockStorage();
    mockSessionStorage = createMockStorage();

    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.stubGlobal('sessionStorage', mockSessionStorage);

    // Mock console methods to track calls
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.debug = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore original console
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.debug = originalConsole.debug;
    console.error = originalConsole.error;

    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('installConsoleCleanup', () => {
    it('should not install in production', () => {
      process.env.NODE_ENV = 'production';

      installConsoleCleanup();

      console.log('Test message');
      expect(console.log).toHaveBeenCalledWith('Test message');
    });

    it('should not install when DEBUG is enabled in localStorage', () => {
      process.env.NODE_ENV = 'development';
      mockLocalStorage.setItem('DEBUG', 'true');

      installConsoleCleanup();

      console.log('Font preload warning');
      expect(console.log).toHaveBeenCalledWith('Font preload warning');
    });

    it('should not install when DEBUG is enabled in sessionStorage', () => {
      process.env.NODE_ENV = 'development';
      mockSessionStorage.setItem('DEBUG', 'true');

      installConsoleCleanup();

      console.log('Font preload warning');
      expect(console.log).toHaveBeenCalledWith('Font preload warning');
    });

    it('should suppress font preload warnings', () => {
      process.env.NODE_ENV = 'development';

      // Save and restore to verify interception works
      const logSpy = vi.fn();
      console.log = logSpy;

      installConsoleCleanup();

      console.log('preload font warning');
      console.log('Regular message');

      expect(logSpy).not.toHaveBeenCalledWith('preload font warning');
      expect(logSpy).toHaveBeenCalledWith('Regular message');
    });

    it('should suppress service worker messages', () => {
      process.env.NODE_ENV = 'development';

      const infoSpy = vi.fn();
      console.info = infoSpy;

      installConsoleCleanup();

      console.info('Service worker registered');
      console.info('Important info');

      expect(infoSpy).not.toHaveBeenCalledWith('Service worker registered');
      expect(infoSpy).toHaveBeenCalledWith('Important info');
    });

    it('should suppress Fast Refresh messages', () => {
      process.env.NODE_ENV = 'development';

      const logSpy = vi.fn();
      console.log = logSpy;

      installConsoleCleanup();

      console.log('Fast Refresh enabled');
      console.log('HMR connected');
      console.log('Important log');

      expect(logSpy).not.toHaveBeenCalledWith('Fast Refresh enabled');
      expect(logSpy).not.toHaveBeenCalledWith('HMR connected');
      expect(logSpy).toHaveBeenCalledWith('Important log');
    });

    it('should suppress webpack compiled messages', () => {
      process.env.NODE_ENV = 'development';

      const logSpy = vi.fn();
      console.log = logSpy;

      installConsoleCleanup();

      console.log('webpack compiled successfully');
      console.log('Normal log');

      expect(logSpy).not.toHaveBeenCalledWith('webpack compiled successfully');
      expect(logSpy).toHaveBeenCalledWith('Normal log');
    });

    it('should preserve console.error', () => {
      process.env.NODE_ENV = 'development';

      const errorSpy = vi.fn();
      console.error = errorSpy;

      installConsoleCleanup();

      console.error('This is an error');
      expect(errorSpy).toHaveBeenCalledWith('This is an error');
    });

    it('should handle multiple arguments', () => {
      process.env.NODE_ENV = 'development';

      const logSpy = vi.fn();
      console.log = logSpy;

      installConsoleCleanup();

      console.log('Multiple', 'arguments', 'test');
      expect(logSpy).toHaveBeenCalledWith('Multiple', 'arguments', 'test');
    });

    it('should handle objects and arrays', () => {
      process.env.NODE_ENV = 'development';

      const logSpy = vi.fn();
      console.log = logSpy;

      installConsoleCleanup();

      const obj = { key: 'value' };
      const arr = [1, 2, 3];
      console.log('Object:', obj, 'Array:', arr);

      expect(logSpy).toHaveBeenCalledWith('Object:', obj, 'Array:', arr);
    });

    it('should suppress messages with partial pattern match', () => {
      process.env.NODE_ENV = 'development';

      const warnSpy = vi.fn();
      console.warn = warnSpy;

      installConsoleCleanup();

      console.warn('Consider preloading this resource');
      console.warn('Unrelated warning');

      expect(warnSpy).not.toHaveBeenCalledWith('Consider preloading this resource');
      expect(warnSpy).toHaveBeenCalledWith('Unrelated warning');
    });

    it('should be case-insensitive', () => {
      process.env.NODE_ENV = 'development';

      const logSpy = vi.fn();
      console.log = logSpy;

      installConsoleCleanup();

      console.log('FONT PRELOAD WARNING');
      console.log('font preload warning');
      console.log('Font Preload Warning');

      expect(logSpy).not.toHaveBeenCalledWith('FONT PRELOAD WARNING');
      expect(logSpy).not.toHaveBeenCalledWith('font preload warning');
      expect(logSpy).not.toHaveBeenCalledWith('Font Preload Warning');
    });
  });

  describe('restoreConsole', () => {
    it('should restore original console methods', () => {
      process.env.NODE_ENV = 'development';

      installConsoleCleanup();
      restoreConsole();

      // After restore, messages should not be filtered
      console.log('Font preload warning');
      expect(console.log).toHaveBeenCalledWith('Font preload warning');
    });

    it('should restore all console methods', () => {
      process.env.NODE_ENV = 'development';

      installConsoleCleanup();
      restoreConsole();

      console.log('log test');
      console.info('info test');
      console.warn('warn test');
      console.debug('debug test');

      expect(console.log).toHaveBeenCalledWith('log test');
      expect(console.info).toHaveBeenCalledWith('info test');
      expect(console.warn).toHaveBeenCalledWith('warn test');
      expect(console.debug).toHaveBeenCalledWith('debug test');
    });

    it('should be idempotent', () => {
      process.env.NODE_ENV = 'development';

      installConsoleCleanup();
      restoreConsole();
      restoreConsole(); // Call twice

      expect(() => restoreConsole()).not.toThrow();
    });
  });

  describe('suppressNextJsWarnings', () => {
    it('should not suppress in production', () => {
      process.env.NODE_ENV = 'production';

      const warnSpy = vi.fn();
      console.warn = warnSpy;

      suppressNextJsWarnings();

      console.warn('next/font optimization warning');
      expect(warnSpy).toHaveBeenCalledWith('next/font optimization warning');
    });

    it('should suppress next/font warnings', () => {
      process.env.NODE_ENV = 'development';

      const warnSpy = vi.fn();
      console.warn = warnSpy;

      suppressNextJsWarnings();

      console.warn('next/font optimization warning');
      console.warn('Other warning');

      expect(warnSpy).not.toHaveBeenCalledWith('next/font optimization warning');
      expect(warnSpy).toHaveBeenCalledWith('Other warning');
    });

    it('should suppress font optimization warnings', () => {
      process.env.NODE_ENV = 'development';

      const warnSpy = vi.fn();
      console.warn = warnSpy;

      suppressNextJsWarnings();

      console.warn('Font optimization enabled');
      console.warn('Normal warning');

      expect(warnSpy).not.toHaveBeenCalledWith('Font optimization enabled');
      expect(warnSpy).toHaveBeenCalledWith('Normal warning');
    });

    it('should suppress preload warnings', () => {
      process.env.NODE_ENV = 'development';

      const warnSpy = vi.fn();
      console.warn = warnSpy;

      suppressNextJsWarnings();

      console.warn('Resource should be preloaded');
      console.warn('Important warning');

      expect(warnSpy).not.toHaveBeenCalledWith('Resource should be preloaded');
      expect(warnSpy).toHaveBeenCalledWith('Important warning');
    });

    it('should be case-insensitive', () => {
      process.env.NODE_ENV = 'development';

      const warnSpy = vi.fn();
      console.warn = warnSpy;

      suppressNextJsWarnings();

      console.warn('NEXT/FONT warning');
      console.warn('next/font warning');

      expect(warnSpy).not.toHaveBeenCalledWith('NEXT/FONT warning');
      expect(warnSpy).not.toHaveBeenCalledWith('next/font warning');
    });
  });

  describe('window.__consoleCleanup', () => {
    it('should expose cleanup functions on window', () => {
      process.env.NODE_ENV = 'development';

      // Import should have set window.__consoleCleanup
      expect((window as any).__consoleCleanup).toBeDefined();
      expect((window as any).__consoleCleanup.install).toBe(installConsoleCleanup);
      expect((window as any).__consoleCleanup.restore).toBe(restoreConsole);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined arguments', () => {
      process.env.NODE_ENV = 'development';

      const logSpy = vi.fn();
      console.log = logSpy;

      installConsoleCleanup();

      console.log(null);
      console.log(undefined);
      console.log(null, undefined);

      expect(logSpy).toHaveBeenCalledWith(null);
      expect(logSpy).toHaveBeenCalledWith(undefined);
      expect(logSpy).toHaveBeenCalledWith(null, undefined);
    });

    it('should handle empty strings', () => {
      process.env.NODE_ENV = 'development';

      const logSpy = vi.fn();
      console.log = logSpy;

      installConsoleCleanup();

      console.log('');
      expect(logSpy).toHaveBeenCalledWith('');
    });

    it('should handle circular references in objects', () => {
      process.env.NODE_ENV = 'development';

      const logSpy = vi.fn();
      console.log = logSpy;

      installConsoleCleanup();

      const circular: any = { name: 'test' };
      circular.self = circular;

      // Should not throw
      expect(() => console.log('Object:', circular)).not.toThrow();
    });

    it('should handle symbols', () => {
      process.env.NODE_ENV = 'development';

      const logSpy = vi.fn();
      console.log = logSpy;

      installConsoleCleanup();

      const sym = Symbol('test');
      console.log(sym);

      expect(logSpy).toHaveBeenCalledWith(sym);
    });

    it('should handle functions', () => {
      process.env.NODE_ENV = 'development';

      const logSpy = vi.fn();
      console.log = logSpy;

      installConsoleCleanup();

      const fn = () => 'test';
      console.log(fn);

      expect(logSpy).toHaveBeenCalledWith(fn);
    });
  });

  describe('Integration Tests', () => {
    it('should work with both installConsoleCleanup and suppressNextJsWarnings', () => {
      process.env.NODE_ENV = 'development';

      const logSpy = vi.fn();
      const warnSpy = vi.fn();
      console.log = logSpy;
      console.warn = warnSpy;

      installConsoleCleanup();
      suppressNextJsWarnings();

      console.log('Font preload message');
      console.warn('next/font warning');
      console.log('Normal log');
      console.warn('Normal warning');

      expect(logSpy).not.toHaveBeenCalledWith('Font preload message');
      expect(warnSpy).not.toHaveBeenCalledWith('next/font warning');
      expect(logSpy).toHaveBeenCalledWith('Normal log');
      expect(warnSpy).toHaveBeenCalledWith('Normal warning');
    });

    it('should restore after both are installed', () => {
      process.env.NODE_ENV = 'development';

      installConsoleCleanup();
      suppressNextJsWarnings();
      restoreConsole();

      console.log('Font preload warning');
      console.warn('next/font warning');

      expect(console.log).toHaveBeenCalledWith('Font preload warning');
      expect(console.warn).toHaveBeenCalledWith('next/font warning');
    });

    it('should handle rapid install/restore cycles', () => {
      process.env.NODE_ENV = 'development';

      for (let i = 0; i < 10; i++) {
        installConsoleCleanup();
        restoreConsole();
      }

      expect(() => console.log('test')).not.toThrow();
    });
  });

  describe('Pattern Matching', () => {
    it('should match all suppression patterns', () => {
      process.env.NODE_ENV = 'development';

      const logSpy = vi.fn();
      console.log = logSpy;

      installConsoleCleanup();

      // Test all patterns from SUPPRESS_PATTERNS
      console.log('preload font test');
      console.log('font preload test');
      console.log('resource font test');
      console.log('service worker test');
      console.log('fast refresh test');
      console.log('hmr test');
      console.log('hot module replacement test');
      console.log('webpack hmr test');
      console.log('revalidate path test');
      console.log('webpack compiled test');
      console.log('consider preload test');
      console.log('optimize loading test');

      // None of the above should be called
      expect(logSpy).not.toHaveBeenCalledWith(expect.stringMatching(/preload/i));
      expect(logSpy).not.toHaveBeenCalledWith(expect.stringMatching(/font/i));
      expect(logSpy).not.toHaveBeenCalledWith(expect.stringMatching(/service worker/i));
      expect(logSpy).not.toHaveBeenCalledWith(expect.stringMatching(/hmr/i));
    });
  });
});
