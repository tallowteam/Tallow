/**
 * CSRF Protection Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-1234',
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
});

describe('CSRF Protection', () => {
  beforeEach(() => {
    // Clear any existing CSRF tokens
    vi.clearAllMocks();
  });

  describe('generateCSRFToken', () => {
    it('should generate a valid CSRF token', async () => {
      const { generateCSRFToken } = await import('@/lib/security/csrf');
      const token = generateCSRFToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);
    });

    it('should generate unique tokens', async () => {
      const { generateCSRFToken } = await import('@/lib/security/csrf');
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('requireCSRFToken', () => {
    it('should reject requests without CSRF token', async () => {
      const { requireCSRFToken } = await import('@/lib/security/csrf');

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });

      const response = requireCSRFToken(request);
      expect(response).toBeDefined();
      expect(response?.status).toBe(403);
    });

    it('should accept requests with valid CSRF token in header', async () => {
      const { requireCSRFToken, generateCSRFToken } = await import('@/lib/security/csrf');

      const token = generateCSRFToken();
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token,
          'Cookie': `csrf_token=${token}`,
        },
      });

      const response = requireCSRFToken(request);
      expect(response).toBeNull();
    });

    it('should reject requests with mismatched tokens', async () => {
      const { requireCSRFToken } = await import('@/lib/security/csrf');

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': 'token1',
          'Cookie': 'csrf_token=token2',
        },
      });

      const response = requireCSRFToken(request);
      expect(response).toBeDefined();
      expect(response?.status).toBe(403);
    });

    it('should allow GET requests without CSRF token', async () => {
      const { requireCSRFToken } = await import('@/lib/security/csrf');

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      const response = requireCSRFToken(request);
      expect(response).toBeNull();
    });
  });

  describe('withCSRF', () => {
    it('should add CSRF token to request headers', async () => {
      const { withCSRF, generateCSRFToken } = await import('@/lib/security/csrf');

      const token = generateCSRFToken();
      const init = withCSRF({
        method: 'POST',
      }, token);

      expect(init.headers).toBeDefined();
      const headers = init.headers as Record<string, string>;
      expect(headers['X-CSRF-Token']).toBe(token);
    });

    it('should preserve existing headers', async () => {
      const { withCSRF, generateCSRFToken } = await import('@/lib/security/csrf');

      const token = generateCSRFToken();
      const init = withCSRF({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }, token);

      const headers = init.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-CSRF-Token']).toBe(token);
    });
  });
});
