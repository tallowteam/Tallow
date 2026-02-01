/**
 * Fetch Utilities Tests
 * Tests for lib/utils/fetch.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  secureFetch,
  secureFetchJSON,
  securePost,
  securePut,
  secureDelete,
  secureGet,
} from '@/lib/utils/fetch';

// Mock CSRF protection
vi.mock('@/lib/security/csrf', () => ({
  withCSRF: vi.fn((init?: RequestInit) => ({
    ...init,
    headers: {
      ...init?.headers,
      'X-CSRF-Token': 'mock-csrf-token',
    },
  })),
}));

// Mock global fetch
global.fetch = vi.fn();

describe('Fetch Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('secureFetch', () => {
    it('should add CSRF token to request', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      await secureFetch('http://localhost/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-Token': 'mock-csrf-token',
          }),
        })
      );
    });

    it('should pass through request options', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      await secureFetch('http://localhost/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost/api/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'mock-csrf-token',
          }),
        })
      );
    });
  });

  describe('secureFetchJSON', () => {
    it('should parse JSON response', async () => {
      const mockData = { success: true, data: 'test' };
      const mockResponse = new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      const result = await secureFetchJSON('http://localhost/api/test');

      expect(result).toEqual(mockData);
    });

    it('should throw error on non-ok response', async () => {
      const mockError = { error: 'Not found' };
      const mockResponse = new Response(JSON.stringify(mockError), {
        status: 404,
      });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      await expect(
        secureFetchJSON('http://localhost/api/test')
      ).rejects.toThrow('Not found');
    });

    it('should handle response without JSON body', async () => {
      const mockResponse = new Response('', { status: 500 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      await expect(
        secureFetchJSON('http://localhost/api/test')
      ).rejects.toThrow('HTTP 500');
    });

    it('should handle error with message field', async () => {
      const mockError = { message: 'Custom error message' };
      const mockResponse = new Response(JSON.stringify(mockError), {
        status: 400,
      });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      await expect(
        secureFetchJSON('http://localhost/api/test')
      ).rejects.toThrow('Custom error message');
    });
  });

  describe('securePost', () => {
    it('should send POST request with JSON body', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      const body = { name: 'test', value: 123 };
      await securePost('http://localhost/api/test', body);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost/api/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(body),
        })
      );
    });

    it('should return parsed response', async () => {
      const mockData = { id: 1, created: true };
      const mockResponse = new Response(JSON.stringify(mockData), {
        status: 201,
      });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      const result = await securePost('http://localhost/api/test', {
        name: 'test',
      });

      expect(result).toEqual(mockData);
    });
  });

  describe('securePut', () => {
    it('should send PUT request with JSON body', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      const body = { id: 1, name: 'updated' };
      await securePut('http://localhost/api/test/1', body);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost/api/test/1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(body),
        })
      );
    });
  });

  describe('secureDelete', () => {
    it('should send DELETE request', async () => {
      const mockResponse = new Response(JSON.stringify({ deleted: true }), {
        status: 200,
      });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      await secureDelete('http://localhost/api/test/1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost/api/test/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('secureGet', () => {
    it('should send GET request', async () => {
      const mockData = { items: [1, 2, 3] };
      const mockResponse = new Response(JSON.stringify(mockData), {
        status: 200,
      });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      const result = await secureGet('http://localhost/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost/api/test',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockData);
    });
  });
});
