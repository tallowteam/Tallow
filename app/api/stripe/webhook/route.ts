import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import Stripe from 'stripe';
import { secureLog } from '@/lib/utils/secure-logger';
import { addDeprecationHeaders } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    const response = NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
    return addDeprecationHeaders(response, '/api/v1/stripe/webhook');
  }

  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
  if (!webhookSecret) {
    const response = NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 503 }
    );
    return addDeprecationHeaders(response, '/api/v1/stripe/webhook');
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    secureLog.error('Webhook signature verification failed:', message);
    const response = NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
    return addDeprecationHeaders(response, '/api/v1/stripe/webhook');
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

  const response = NextResponse.json({ received: true });
  return addDeprecationHeaders(response, '/api/v1/stripe/webhook');
}
