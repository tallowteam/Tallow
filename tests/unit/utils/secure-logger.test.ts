/**
 * Secure Logger Tests
 * Tests for lib/utils/secure-logger.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Secure Logger', () => {
  let originalNodeEnv: string | undefined;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalNodeEnv !== undefined) {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true
      });
    } else {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: undefined,
        writable: true,
        configurable: true
      });
    }
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('in development mode', () => {
    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      });
      // Re-import to pick up new NODE_ENV
      vi.resetModules();
    });

    it('should log messages in development', async () => {
      const { secureLog: devLog } = await import('@/lib/utils/secure-logger');
      devLog.log('Test log');
      expect(consoleLogSpy).toHaveBeenCalledWith('Test log');
    });

    it('should warn messages in development', async () => {
      const { secureLog: devLog } = await import('@/lib/utils/secure-logger');
      devLog.warn('Test warning');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Test warning');
    });

    it('should error messages in development', async () => {
      const { secureLog: devLog } = await import('@/lib/utils/secure-logger');
      devLog.error('Test error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Test error');
    });

    it('should debug messages in development', async () => {
      const { secureLog: devLog } = await import('@/lib/utils/secure-logger');
      devLog.debug('Test debug');
      expect(consoleDebugSpy).toHaveBeenCalledWith('Test debug');
    });

    it('should handle multiple arguments', async () => {
      const { secureLog: devLog } = await import('@/lib/utils/secure-logger');
      devLog.log('Test', 'multiple', 'args');
      expect(consoleLogSpy).toHaveBeenCalledWith('Test', 'multiple', 'args');
    });
  });

  describe('in production mode', () => {
    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      });
      vi.resetModules();
    });

    it('should not log messages in production', async () => {
      const { secureLog: prodLog } = await import('@/lib/utils/secure-logger');
      prodLog.log('Test log');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not warn messages in production', async () => {
      const { secureLog: prodLog } = await import('@/lib/utils/secure-logger');
      prodLog.warn('Test warning');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should sanitize error messages in production', async () => {
      const { secureLog: prodLog } = await import('@/lib/utils/secure-logger');
      prodLog.error('Sensitive error info');
      expect(consoleErrorSpy).toHaveBeenCalledWith('An error occurred');
      expect(consoleErrorSpy).not.toHaveBeenCalledWith('Sensitive error info');
    });

    it('should not debug messages in production', async () => {
      const { secureLog: prodLog } = await import('@/lib/utils/secure-logger');
      prodLog.debug('Test debug');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });
});
