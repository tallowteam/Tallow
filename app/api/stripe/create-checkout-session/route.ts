import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe/config';
import { secureLog } from '@/lib/utils/secure-logger';
import { requireCSRFToken } from '@/lib/security/csrf';
import { strictRateLimiter } from '@/lib/middleware/rate-limit';
import { addDeprecationHeaders } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  // Rate limiting (3 requests/minute per IP)
  const rateLimitResponse = strictRateLimiter.check(request);
  if (rateLimitResponse) {
    return addDeprecationHeaders(rateLimitResponse, '/api/v1/stripe/create-checkout-session');
  }

  // Validate CSRF token for non-GET requests
  const csrfError = requireCSRFToken(request);
  if (csrfError) {
    return addDeprecationHeaders(csrfError, '/api/v1/stripe/create-checkout-session');
  }

  if (!isStripeConfigured()) {
    const response = NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 }
    );
    return addDeprecationHeaders(response, '/api/v1/stripe/create-checkout-session');
  }

  try {
    const { amount } = await request.json();

    if (!amount || typeof amount !== 'number' || amount < 100) {
      const response = NextResponse.json(
        { error: 'Invalid amount. Minimum donation is $1.00.' },
        { status: 400 }
      );
      return addDeprecationHeaders(response, '/api/v1/stripe/create-checkout-session');
    }

    if (amount > 99999900) {
      const response = NextResponse.json(
        { error: 'Amount exceeds maximum.' },
        { status: 400 }
      );
      return addDeprecationHeaders(response, '/api/v1/stripe/create-checkout-session');
    }

    const stripe = getStripe();
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Tallow Donation',
              description: 'Support open-source, private file sharing',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/donate/cancel`,
    });

    const response = NextResponse.json({ url: session.url });
    return addDeprecationHeaders(response, '/api/v1/stripe/create-checkout-session');
  } catch (error) {
    secureLog.error('Stripe checkout error:', error);
    const response = NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
    return addDeprecationHeaders(response, '/api/v1/stripe/create-checkout-session');
  }
}
