import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe/config';
import { secureLog } from '@/lib/utils/secure-logger';
import { requireCSRFToken } from '@/lib/security/csrf';
import { strictRateLimiter } from '@/lib/middleware/rate-limit';

/**
 * API v1: Create Stripe Checkout Session
 * POST /api/v1/stripe/create-checkout-session
 */
export async function POST(request: NextRequest) {
  // CSRF Protection: Prevent cross-site request forgery
  const csrfError = requireCSRFToken(request);
  if (csrfError) {return csrfError;}

  // Rate limiting: 3 requests/minute per IP
  const rateLimitError = strictRateLimiter.check(request);
  if (rateLimitError) {return rateLimitError;}

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 }
    );
  }

  try {
    const { amount } = await request.json();

    if (!amount || typeof amount !== 'number' || amount < 100) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum donation is $1.00.' },
        { status: 400 }
      );
    }

    if (amount > 99999900) {
      return NextResponse.json(
        { error: 'Amount exceeds maximum.' },
        { status: 400 }
      );
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

    return NextResponse.json({ url: session.url });
  } catch (error) {
    secureLog.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
