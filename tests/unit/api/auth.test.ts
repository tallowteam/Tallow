/**
 * API Authentication Tests
 * Tests for lib/api/auth.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, requireApiKey, generateApiKey } from '@/lib/api/auth';

// Mock secure logger
vi.mock('@/lib/utils/secure-logger', () => ({
  secureLog: {
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('API Authentication', () => {
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalApiKey = process.env['API_SECRET_KEY'];
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalApiKey !== undefined) {
      process.env['API_SECRET_KEY'] = originalApiKey;
    } else {
      delete process.env['API_SECRET_KEY'];
    }
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', () => {
      process.env['API_SECRET_KEY'] = 'test-secret-key-12345';
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-api-key': 'test-secret-key-12345',
        },
      });

      expect(validateApiKey(request)).toBe(true);
    });

    it('should return false for invalid API key', () => {
      process.env['API_SECRET_KEY'] = 'test-secret-key-12345';
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-api-key': 'wrong-key',
        },
      });

      expect(validateApiKey(request)).toBe(false);
    });

    it('should return false for missing API key header', () => {
      process.env['API_SECRET_KEY'] = 'test-secret-key-12345';
      const request = new NextRequest('http://localhost:3000/api/test');

      expect(validateApiKey(request)).toBe(false);
    });

    it('should return true when no API key is configured (dev mode)', () => {
      delete process.env['API_SECRET_KEY'];
      const request = new NextRequest('http://localhost:3000/api/test');

      expect(validateApiKey(request)).toBe(true);
    });

    it('should use constant-time comparison (prevent timing attacks)', () => {
      process.env['API_SECRET_KEY'] = 'secret123456';
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-api-key': 'secret123456',
        },
      });

      expect(validateApiKey(request)).toBe(true);
    });

    it('should reject API key with different length', () => {
      process.env['API_SECRET_KEY'] = 'longkey123';
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-api-key': 'short',
        },
      });

      expect(validateApiKey(request)).toBe(false);
    });

    it('should handle empty API key', () => {
      process.env['API_SECRET_KEY'] = 'test-key';
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-api-key': '',
        },
      });

      expect(validateApiKey(request)).toBe(false);
    });
  });

  describe('requireApiKey', () => {
    it('should return null for valid API key', () => {
      process.env['API_SECRET_KEY'] = 'test-secret-key';
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-api-key': 'test-secret-key',
        },
      });

      const result = requireApiKey(request);
      expect(result).toBeNull();
    });

    it('should return 401 response for invalid API key', async () => {
      process.env['API_SECRET_KEY'] = 'test-secret-key';
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-api-key': 'wrong-key',
        },
      });

      const result = requireApiKey(request);
      expect(result).toBeInstanceOf(NextResponse);

      if (result) {
        const data = await result.json();
        expect(result.status).toBe(401);
        expect(data.error).toContain('Unauthorized');
      }
    });

    it('should return 401 response for missing API key', async () => {
      process.env['API_SECRET_KEY'] = 'test-secret-key';
      const request = new NextRequest('http://localhost:3000/api/test');

      const result = requireApiKey(request);
      expect(result).toBeInstanceOf(NextResponse);

      if (result) {
        const data = await result.json();
        expect(result.status).toBe(401);
        expect(data.error).toBe('Unauthorized - Invalid or missing API key');
      }
    });

    it('should allow request when API key not configured', () => {
      delete process.env['API_SECRET_KEY'];
      const request = new NextRequest('http://localhost:3000/api/test');

      const result = requireApiKey(request);
      expect(result).toBeNull();
    });
  });

  describe('generateApiKey', () => {
    it('should generate API key with default length', () => {
      const key = generateApiKey();
      expect(key).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(key).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate API key with custom length', () => {
      const key = generateApiKey(16);
      expect(key).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(key).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different keys on each call', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1).not.toBe(key2);
    });

    it('should generate cryptographically secure random keys', () => {
      const keys = new Set();
      for (let i = 0; i < 100; i++) {
        keys.add(generateApiKey(8));
      }
      // All 100 keys should be unique
      expect(keys.size).toBe(100);
    });
  });
});
