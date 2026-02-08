/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events for subscription management
 * https://stripe.com/docs/webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse, ApiErrors } from '@/lib/api/response';
import { getStripeService } from '@/lib/payments/stripe-service';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Increase body size limit for webhook payloads
export const maxDuration = 10; // 10 seconds max

// ============================================================================
// WEBHOOK EVENT HANDLERS
// ============================================================================

/**
 * Handle checkout.session.completed event
 * Triggered when a customer completes checkout
 */
async function handleCheckoutSessionCompleted(
  event: Stripe.CheckoutSessionCompletedEvent
): Promise<void> {
  const session = event.data.object;

  console.log('Checkout session completed:', {
    sessionId: session.id,
    customerId: session.customer,
    subscriptionId: session.subscription,
    mode: session.mode,
  });

  // If this is a subscription checkout, the subscription will be created
  // and we'll receive a customer.subscription.created event
  if (session.mode === 'subscription' && session.subscription) {
    console.log('Subscription created via checkout:', session.subscription);

    // TODO: Create/update user record in database
    // TODO: Send welcome email
    // TODO: Provision access to premium features
  }

  // If this is a one-time payment
  if (session.mode === 'payment') {
    console.log('One-time payment completed:', session.payment_intent);

    // TODO: Handle one-time payment fulfillment
  }
}

/**
 * Handle customer.subscription.created event
 * Triggered when a new subscription is created
 */
async function handleSubscriptionCreated(
  event: Stripe.CustomerSubscriptionCreatedEvent
): Promise<void> {
  const subscription = event.data.object;
  const stripeService = getStripeService();

  console.log('Subscription created:', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    plan: stripeService.getPlanFromSubscription(subscription),
  });

  // TODO: Update user record with subscription
  // TODO: Grant access to premium features
  // TODO: Send confirmation email
}

/**
 * Handle customer.subscription.updated event
 * Triggered when subscription details change (plan upgrade/downgrade, status change)
 */
async function handleSubscriptionUpdated(
  event: Stripe.CustomerSubscriptionUpdatedEvent
): Promise<void> {
  const subscription = event.data.object;
  const previousAttributes = event.data.previous_attributes;
  const stripeService = getStripeService();

  console.log('Subscription updated:', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    plan: stripeService.getPlanFromSubscription(subscription),
    previousAttributes,
  });

  // Handle plan changes
  if (previousAttributes?.items) {
    const oldPlan = stripeService.getPlanFromSubscription({
      ...subscription,
      items: previousAttributes.items,
    });
    const newPlan = stripeService.getPlanFromSubscription(subscription);

    if (oldPlan !== newPlan) {
      console.log(`Plan changed from ${oldPlan} to ${newPlan}`);
      // TODO: Update user's plan in database
      // TODO: Send plan change confirmation email
    }
  }

  // Handle status changes
  if (previousAttributes?.status) {
    console.log(`Status changed from ${previousAttributes.status} to ${subscription.status}`);

    // Handle subscription becoming active
    if (subscription.status === 'active' && previousAttributes.status !== 'active') {
      // TODO: Activate premium features
      // TODO: Send activation email
    }

    // Handle subscription being paused or past due
    if (subscription.status === 'past_due') {
      // TODO: Send payment retry notification
      // TODO: Limit feature access (grace period)
    }

    // Handle subscription cancellation
    if (subscription.status === 'canceled') {
      // TODO: Revoke premium access
      // TODO: Send cancellation confirmation
    }
  }

  // Handle cancel_at_period_end changes
  if (
    previousAttributes?.cancel_at_period_end !== undefined &&
    subscription.cancel_at_period_end !== previousAttributes.cancel_at_period_end
  ) {
    if (subscription.cancel_at_period_end) {
      console.log('Subscription set to cancel at period end');
      // TODO: Send cancellation scheduled email
    } else {
      console.log('Subscription cancellation reversed');
      // TODO: Send subscription resumed email
    }
  }
}

/**
 * Handle customer.subscription.deleted event
 * Triggered when subscription is canceled or expires
 */
async function handleSubscriptionDeleted(
  event: Stripe.CustomerSubscriptionDeletedEvent
): Promise<void> {
  const subscription = event.data.object;

  console.log('Subscription deleted:', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    endedAt: subscription.ended_at,
    canceledAt: subscription.canceled_at,
  });

  // TODO: Revoke premium access
  // TODO: Downgrade user to free plan in database
  // TODO: Send subscription ended email
  // TODO: Optionally ask for feedback
}

/**
 * Handle invoice.payment_succeeded event
 * Triggered when payment is successful (including renewals)
 */
async function handleInvoicePaymentSucceeded(
  event: Stripe.InvoicePaymentSucceededEvent
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;

  console.log('Invoice payment succeeded:', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId: invoice.subscription,
    amount: invoice.amount_paid,
    billing_reason: invoice.billing_reason,
  });

  // First payment (subscription created)
  if (invoice.billing_reason === 'subscription_create') {
    // TODO: Send welcome email with receipt
  }

  // Recurring payment (renewal)
  if (invoice.billing_reason === 'subscription_cycle') {
    // TODO: Send payment receipt
    // TODO: Extend subscription period in database
  }
}

/**
 * Handle invoice.payment_failed event
 * Triggered when payment fails (card declined, insufficient funds)
 */
async function handleInvoicePaymentFailed(
  event: Stripe.InvoicePaymentFailedEvent
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;

  console.log('Invoice payment failed:', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId: invoice.subscription,
    amount: invoice.amount_due,
    attemptCount: invoice.attempt_count,
  });

  // TODO: Send payment failed notification email
  // TODO: Provide link to update payment method
  // TODO: If multiple failures, consider downgrading access

  // Stripe automatically retries failed payments
  // After final retry failure, subscription status becomes 'past_due'
}

/**
 * Handle invoice.upcoming event
 * Triggered 1 week before subscription renewal
 */
async function handleInvoiceUpcoming(
  event: Stripe.InvoiceUpcomingEvent
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;

  console.log('Upcoming invoice:', {
    customerId: invoice.customer,
    subscriptionId: invoice.subscription,
    amount: invoice.amount_due,
    periodEnd: invoice.period_end,
  });

  // TODO: Send renewal reminder email
  // TODO: Allow user to update payment method before charge
}

/**
 * Handle customer.updated event
 * Triggered when customer details change
 */
async function handleCustomerUpdated(
  event: Stripe.CustomerUpdatedEvent
): Promise<void> {
  const customer = event.data.object;

  console.log('Customer updated:', {
    customerId: customer.id,
    email: customer.email,
  });

  // TODO: Sync customer data with database
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

/**
 * Track processed webhook events to prevent duplicates
 * In production, use Redis or database for persistence
 */
const processedEvents = new Set<string>();

/**
 * Check if event has already been processed (idempotency)
 */
function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

/**
 * Mark event as processed
 */
function markEventProcessed(eventId: string): void {
  processedEvents.add(eventId);

  // Clean up old events after 24 hours (simple in-memory implementation)
  // In production, use TTL in Redis or database cleanup job
  setTimeout(() => {
    processedEvents.delete(eventId);
  }, 24 * 60 * 60 * 1000);
}

/**
 * Main webhook handler
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return ApiErrors.badRequest('Missing stripe-signature header');
    }

    // Verify webhook signature
    const stripeService = getStripeService();
    let event: Stripe.Event;

    try {
      event = stripeService.verifyWebhookSignature(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return ApiErrors.unauthorized('Invalid signature');
    }

    // Check for duplicate events (idempotency)
    if (isEventProcessed(event.id)) {
      console.log('Duplicate webhook event ignored:', event.id);
      return jsonResponse({ received: true, duplicate: true }, 200);
    }

    // Log webhook event
    console.log('Webhook event received:', {
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString(),
    });

    // Process event asynchronously
    // Return 200 immediately to acknowledge receipt
    // Stripe expects response within 5 seconds
    processWebhookEvent(event).catch(error => {
      console.error('Webhook processing error:', error);
      // TODO: Send to error monitoring (Sentry)
    });

    // Mark as processed
    markEventProcessed(event.id);

    return jsonResponse({ received: true }, 200);
  } catch (error) {
    console.error('Webhook handler error:', error);
    return ApiErrors.internalError('Webhook processing failed');
  }
}

/**
 * Process webhook event (async)
 */
async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      // Checkout events
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event as Stripe.CheckoutSessionCompletedEvent);
        break;

      // Subscription lifecycle events
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event as Stripe.CustomerSubscriptionCreatedEvent);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event as Stripe.CustomerSubscriptionUpdatedEvent);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event as Stripe.CustomerSubscriptionDeletedEvent);
        break;

      // Invoice events
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event as Stripe.InvoicePaymentSucceededEvent);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event as Stripe.InvoicePaymentFailedEvent);
        break;

      case 'invoice.upcoming':
        await handleInvoiceUpcoming(event as Stripe.InvoiceUpcomingEvent);
        break;

      // Customer events
      case 'customer.updated':
        await handleCustomerUpdated(event as Stripe.CustomerUpdatedEvent);
        break;

      default:
        console.log('Unhandled webhook event type:', event.type);
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    throw error;
  }
}

// ============================================================================
// METHOD NOT ALLOWED HANDLER
// ============================================================================

async function handleOtherMethods(_request: NextRequest): Promise<NextResponse> {
  return ApiErrors.methodNotAllowed(['POST']);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const POST = handlePOST;
export const GET = handleOtherMethods;
export const PUT = handleOtherMethods;
export const DELETE = handleOtherMethods;
export const PATCH = handleOtherMethods;
