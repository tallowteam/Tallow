/**
 * Stripe Checkout API Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/stripe/create-checkout-session/route';

// Mock dependencies
vi.mock('@/lib/security/csrf', () => ({
  requireCSRFToken: vi.fn(() => null),
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
  strictRateLimiter: {
    check: vi.fn(() => null),
  },
}));

vi.mock('@/lib/stripe/config', () => ({
  getStripe: vi.fn(() => ({
    checkout: {
      sessions: {
        create: vi.fn(async () => ({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/test',
        })),
      },
    },
  })),
  isStripeConfigured: vi.fn(() => true),
}));

describe('Stripe Checkout API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create checkout session successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ amount: 1000 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://checkout.stripe.com/test');
  });

  it('should reject amount below minimum', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ amount: 50 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Minimum donation is $1.00');
  });

  it('should reject amount above maximum', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ amount: 100000000 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('exceeds maximum');
  });

  it('should reject missing amount', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should reject non-numeric amount', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ amount: 'invalid' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return error when Stripe is not configured', async () => {
    const { isStripeConfigured } = await import('@/lib/stripe/config');
    vi.mocked(isStripeConfigured).mockReturnValueOnce(false);

    const request = new NextRequest('http://localhost:3000/api/v1/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ amount: 1000 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Stripe is not configured');
  });

  it('should respect CSRF protection', async () => {
    const { requireCSRFToken } = await import('@/lib/security/csrf');
    vi.mocked(requireCSRFToken).mockReturnValueOnce({
      status: 403,
      json: async () => ({ error: 'CSRF token missing' }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/v1/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ amount: 1000 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it('should respect rate limiting', async () => {
    const { strictRateLimiter } = await import('@/lib/middleware/rate-limit');
    vi.mocked(strictRateLimiter.check).mockReturnValueOnce({
      status: 429,
      json: async () => ({ error: 'Too many requests' }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/v1/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ amount: 1000 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it('should handle Stripe errors gracefully', async () => {
    const { getStripe } = await import('@/lib/stripe/config');
    vi.mocked(getStripe).mockReturnValueOnce({
      checkout: {
        sessions: {
          create: vi.fn(async () => {
            throw new Error('Stripe API error');
          }),
        },
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/v1/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ amount: 1000 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create checkout session');
  });
});
