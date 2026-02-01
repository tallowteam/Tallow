import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import Stripe from 'stripe';
import { secureLog } from '@/lib/utils/secure-logger';

/**
 * API v1: Stripe Webhook Handler
 * POST /api/v1/stripe/webhook
 */

// Processed event IDs to prevent duplicate processing (idempotency)
const processedEvents = new Set<string>();

// Cleanup old events every hour
setInterval(() => {
  processedEvents.clear();
}, 3600000);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 503 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    secureLog.error('Webhook signature verification failed:', message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  // Idempotency check: prevent duplicate processing
  if (processedEvents.has(event.id)) {
    return NextResponse.json({ received: true, cached: true });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      secureLog.log('Donation received:', {
        amount: session.amount_total,
        currency: session.currency,
        id: session.id,
      });
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      secureLog.log('Payment succeeded:', paymentIntent.id);
      break;
    }

    default:
      // Unhandled event type
      break;
  }

  // Mark as processed
  processedEvents.add(event.id);

  return NextResponse.json({ received: true });
}
