/**
 * Stripe Webhook API Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/stripe/webhook/route';
import type Stripe from 'stripe';

// Mock dependencies
vi.mock('@/lib/stripe/config', () => ({
  getStripe: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}));

vi.mock('@/lib/utils/secure-logger', () => ({
  secureLog: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Stripe Webhook API', () => {
  const validSignature = 'whsec_test_signature';
  const webhookSecret = 'whsec_test_secret';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env['STRIPE_WEBHOOK_SECRET'] = webhookSecret;
  });

  it('should process checkout.session.completed event', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          amount_total: 1000,
          currency: 'usd',
        } as Stripe.Checkout.Session,
      },
      created: Date.now(),
      livemode: false,
      api_version: '2023-10-16',
      object: 'event',
      pending_webhooks: 0,
      request: null,
    };

    const { getStripe } = await import('@/lib/stripe/config');
    vi.mocked(getStripe).mockReturnValueOnce({
      webhooks: {
        constructEvent: vi.fn(() => mockEvent),
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/v1/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': validSignature,
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  it('should process payment_intent.succeeded event', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_test_456',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 1000,
          currency: 'usd',
        } as Stripe.PaymentIntent,
      },
      created: Date.now(),
      livemode: false,
      api_version: '2023-10-16',
      object: 'event',
      pending_webhooks: 0,
      request: null,
    };

    const { getStripe } = await import('@/lib/stripe/config');
    vi.mocked(getStripe).mockReturnValueOnce({
      webhooks: {
        constructEvent: vi.fn(() => mockEvent),
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/v1/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': validSignature,
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  it('should reject webhook without signature', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/stripe/webhook', {
      method: 'POST',
      body: '{}',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing stripe-signature header');
  });

  it('should reject webhook when secret not configured', async () => {
    delete process.env['STRIPE_WEBHOOK_SECRET'];

    const request = new NextRequest('http://localhost:3000/api/v1/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': validSignature,
      },
      body: '{}',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Webhook secret not configured');
  });

  it('should reject webhook with invalid signature', async () => {
    const { getStripe } = await import('@/lib/stripe/config');
    vi.mocked(getStripe).mockReturnValueOnce({
      webhooks: {
        constructEvent: vi.fn(() => {
          throw new Error('Invalid signature');
        }),
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/v1/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'invalid_signature',
      },
      body: '{}',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Webhook Error');
  });

  it('should handle duplicate events with idempotency', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_duplicate_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
        } as Stripe.Checkout.Session,
      },
      created: Date.now(),
      livemode: false,
      api_version: '2023-10-16',
      object: 'event',
      pending_webhooks: 0,
      request: null,
    };

    const { getStripe } = await import('@/lib/stripe/config');
    vi.mocked(getStripe).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => mockEvent),
      },
    } as any);

    // First request
    const request1 = new NextRequest('http://localhost:3000/api/v1/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': validSignature,
      },
      body: JSON.stringify(mockEvent),
    });

    const response1 = await POST(request1);
    const data1 = await response1.json();

    expect(response1.status).toBe(200);
    expect(data1.received).toBe(true);

    // Duplicate request
    const request2 = new NextRequest('http://localhost:3000/api/v1/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': validSignature,
      },
      body: JSON.stringify(mockEvent),
    });

    const response2 = await POST(request2);
    const data2 = await response2.json();

    expect(response2.status).toBe(200);
    expect(data2.cached).toBe(true);
  });

  it('should handle unhandled event types', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_test_789',
      type: 'customer.created' as any,
      data: {
        object: {} as any,
      },
      created: Date.now(),
      livemode: false,
      api_version: '2023-10-16',
      object: 'event',
      pending_webhooks: 0,
      request: null,
    };

    const { getStripe } = await import('@/lib/stripe/config');
    vi.mocked(getStripe).mockReturnValueOnce({
      webhooks: {
        constructEvent: vi.fn(() => mockEvent),
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/v1/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': validSignature,
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });
});
