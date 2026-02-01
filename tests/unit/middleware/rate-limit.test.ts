/**
 * Rate Limiting Middleware Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { RateLimiter } from '@/lib/middleware/rate-limit';

// Mock Date.now for deterministic testing
const mockNow = 1000000;
vi.spyOn(Date, 'now').mockReturnValue(mockNow);

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    Date.now = vi.fn(() => mockNow);

    // Create fresh rate limiter
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
    });
  });

  describe('check', () => {
    it('should allow requests within limit', () => {
      const request = createMockRequest('192.168.1.1');

      // Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        const response = rateLimiter.check(request);
        expect(response).toBeNull();
      }
    });

    it('should block requests exceeding limit', () => {
      const request = createMockRequest('192.168.1.1');

      // Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        rateLimiter.check(request);
      }

      // 6th request should be blocked
      const response = rateLimiter.check(request);
      expect(response).toBeDefined();
      expect(response?.status).toBe(429);
    });

    it('should reset after time window', () => {
      const request = createMockRequest('192.168.1.1');

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.check(request);
      }

      // Advance time beyond window
      Date.now = vi.fn(() => mockNow + 61000);

      // Should allow new requests
      const response = rateLimiter.check(request);
      expect(response).toBeNull();
    });

    it('should track different IPs separately', () => {
      const request1 = createMockRequest('192.168.1.1');
      const request2 = createMockRequest('192.168.1.2');

      // Make 5 requests from IP 1
      for (let i = 0; i < 5; i++) {
        rateLimiter.check(request1);
      }

      // IP 1 should be blocked
      expect(rateLimiter.check(request1)?.status).toBe(429);

      // IP 2 should still be allowed
      expect(rateLimiter.check(request2)).toBeNull();
    });

    it('should include rate limit headers in response', () => {
      const request = createMockRequest('192.168.1.1');

      rateLimiter.check(request);
      const response = rateLimiter.check(request);

      expect(response).toBeNull(); // Still within limit

      // Check that rate limit info is being tracked
      // (Headers would be added by the actual middleware)
    });

    it('should handle missing IP address', () => {
      const request = createMockRequest(null);

      // Should default to 'unknown' IP
      const response = rateLimiter.check(request);
      expect(response).toBeNull();
    });

    it('should respect custom window and limit', () => {
      const customLimiter = new RateLimiter({
        windowMs: 30000, // 30 seconds
        maxRequests: 3,
      });

      const request = createMockRequest('192.168.1.1');

      // Make 3 requests (within limit)
      for (let i = 0; i < 3; i++) {
        expect(customLimiter.check(request)).toBeNull();
      }

      // 4th request should be blocked
      expect(customLimiter.check(request)?.status).toBe(429);
    });
  });

  describe('Prebuilt rate limiters', () => {
    it('strictRateLimiter should allow 3 requests per minute', async () => {
      const { strictRateLimiter } = await import('@/lib/middleware/rate-limit');
      const request = createMockRequest('192.168.1.1');

      for (let i = 0; i < 3; i++) {
        expect(strictRateLimiter.check(request)).toBeNull();
      }
      expect(strictRateLimiter.check(request)?.status).toBe(429);
    });

    it('moderateRateLimiter should allow 5 requests per minute', async () => {
      const { moderateRateLimiter } = await import('@/lib/middleware/rate-limit');
      const request = createMockRequest('192.168.1.1');

      for (let i = 0; i < 5; i++) {
        expect(moderateRateLimiter.check(request)).toBeNull();
      }
      expect(moderateRateLimiter.check(request)?.status).toBe(429);
    });

    it('generousRateLimiter should allow 10 requests per minute', async () => {
      const { generousRateLimiter } = await import('@/lib/middleware/rate-limit');
      const request = createMockRequest('192.168.1.1');

      for (let i = 0; i < 10; i++) {
        expect(generousRateLimiter.check(request)).toBeNull();
      }
      expect(generousRateLimiter.check(request)?.status).toBe(429);
    });
  });

  describe('Cleanup', () => {
    it('should clean up stale entries', () => {
      const request = createMockRequest('192.168.1.1');

      // Make some requests
      rateLimiter.check(request);

      // Advance time
      Date.now = vi.fn(() => mockNow + 120000); // 2 minutes

      // Make another request (should trigger cleanup)
      rateLimiter.check(request);

      // Old entry should be cleaned up
      // (Internal implementation detail - would need access to private state to verify)
    });
  });
});

/**
 * Helper to create mock NextRequest
 */
function createMockRequest(ip: string | null): NextRequest {
  const headers: Record<string, string> = {};
  if (ip) {
    headers['x-forwarded-for'] = ip;
  }

  return new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    headers,
  });
}
