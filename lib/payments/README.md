# Stripe Payment Integration

Comprehensive Stripe payment integration for Tallow with subscription management, webhooks, and feature-based access control.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Setup](#setup)
- [Pricing Plans](#pricing-plans)
- [API Routes](#api-routes)
- [Client Usage](#client-usage)
- [Webhook Events](#webhook-events)
- [Testing](#testing)
- [Security](#security)

## Overview

The payment system provides:

- **3 subscription tiers**: Free, Pro ($9.99/mo), Business ($24.99/mo)
- **Stripe Checkout** for secure payment processing
- **Webhook handlers** for subscription lifecycle events
- **Client-side store** for subscription state management
- **Feature gating** based on subscription tier
- **Usage tracking** with daily transfer limits

## Features

### Subscription Management

- Create checkout sessions for new subscriptions
- Handle subscription updates (upgrades/downgrades)
- Cancel subscriptions (immediate or at period end)
- Resume canceled subscriptions
- Check subscription status

### Feature Access Control

Each plan includes different features:

**Free Plan:**
- 5 GB max file size
- 50 transfers per day
- Up to 5 recipients
- Community support

**Pro Plan ($9.99/mo):**
- 50 GB max file size
- 500 transfers per day
- Up to 10 recipients
- Priority relay servers
- Transfer analytics
- Email support (24h)

**Business Plan ($24.99/mo):**
- Unlimited file size
- Unlimited transfers
- Unlimited recipients
- API access
- SSO/SAML integration
- Self-hosted option
- Dedicated support (4h)

### Webhook Event Handling

Automatically processes:
- `checkout.session.completed` - Activate subscription
- `customer.subscription.updated` - Update plan/status
- `customer.subscription.deleted` - Deactivate subscription
- `invoice.payment_failed` - Notify user
- `invoice.payment_succeeded` - Send receipt
- `invoice.upcoming` - Renewal reminder

## Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (optional, defaults to test mode)
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_your_pro_monthly_id
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_your_pro_yearly_id
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY=price_your_business_monthly_id
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_YEARLY=price_your_business_yearly_id
```

### 2. Create Stripe Products

In Stripe Dashboard:

1. Create Products:
   - "Tallow Pro"
   - "Tallow Business"

2. Create Prices for each product:
   - Monthly: $9.99/mo (Pro), $24.99/mo (Business)
   - Yearly: $99/yr (Pro), $249/yr (Business) - optional

3. Copy Price IDs to environment variables

### 3. Configure Webhook Endpoint

In Stripe Dashboard → Developers → Webhooks:

1. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
2. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.upcoming`
   - `customer.updated`

3. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Pricing Plans

### Configuration

Plans are defined in `pricing-config.ts`:

```typescript
import { getPlan, PRICING_PLANS } from '@/lib/payments';

// Get plan details
const proPlan = getPlan('pro');
console.log(proPlan.price); // 9.99
console.log(proPlan.features.maxFileSize); // 50 GB

// Check if price ID is valid
import { isValidPriceId } from '@/lib/payments';
if (isValidPriceId(priceId)) {
  // Create checkout session
}
```

### Feature Limits

```typescript
import { getLimit, exceedsLimit } from '@/lib/payments';

// Get limit for feature
const maxSize = getLimit('pro', 'maxFileSize'); // 50 GB

// Check if user exceeds limit
const exceeded = exceedsLimit('pro', 'maxTransfersPerDay', 450); // false
```

## API Routes

### POST /api/stripe/create-checkout-session

Create a Stripe Checkout session for subscription purchase.

**Request:**

```typescript
POST /api/stripe/create-checkout-session
Content-Type: application/json

{
  "priceId": "price_xxx",
  "successUrl": "https://yourdomain.com/success",
  "cancelUrl": "https://yourdomain.com/pricing",
  "customerEmail": "user@example.com", // optional
  "customerId": "cus_xxx", // optional
  "metadata": { // optional
    "userId": "123"
  }
}
```

**Response:**

```typescript
{
  "success": true,
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxx"
}
```

**Errors:**

- `400` - Invalid price ID or validation error
- `503` - Stripe not configured
- `429` - Rate limit exceeded

### POST /api/stripe/webhook

Stripe webhook endpoint for subscription events.

**Security:**
- Verifies webhook signature
- Idempotent (prevents duplicate processing)
- Returns 200 quickly (processes async)

### GET /api/stripe/subscription

Check subscription status for customer.

**Request:**

```typescript
GET /api/stripe/subscription?customerId=cus_xxx
```

**Response:**

```typescript
{
  "hasSubscription": true,
  "subscription": {
    "id": "sub_xxx",
    "plan": "pro",
    "status": "active",
    "currentPeriodEnd": "2024-02-15T00:00:00Z",
    "cancelAtPeriodEnd": false
  }
}
```

## Client Usage

### Subscription Store

The subscription store manages subscription state with localStorage persistence.

```typescript
'use client';

import { useSubscriptionStore, selectPlan, selectCanTransfer } from '@/lib/payments';

export default function MyComponent() {
  const plan = useSubscriptionStore(selectPlan);
  const canTransfer = useSubscriptionStore(selectCanTransfer);
  const incrementTransfers = useSubscriptionStore(state => state.incrementTransfers);

  // Check if user can transfer
  if (!canTransfer) {
    return <div>Daily transfer limit reached. Upgrade to Pro for more transfers.</div>;
  }

  return (
    <button onClick={() => {
      // Perform transfer
      incrementTransfers();
    }}>
      Transfer File
    </button>
  );
}
```

### Feature Access Control

```typescript
import { useHasFeature, useFeatureLimit } from '@/lib/payments';

export default function TransferButton() {
  const hasPriorityRelay = useHasFeature('priorityRelay');
  const maxRecipients = useFeatureLimit('maxRecipients');

  return (
    <div>
      {hasPriorityRelay && <Badge>Priority Relay</Badge>}
      <p>You can send to up to {maxRecipients} recipients</p>
    </div>
  );
}
```

### Creating Checkout Session

```typescript
'use client';

import { useState } from 'react';
import { STRIPE_PRICE_IDS } from '@/lib/payments';

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: STRIPE_PRICE_IDS.PRO_MONTHLY,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/pricing`,
          customerEmail: 'user@example.com',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleUpgrade} disabled={loading}>
      {loading ? 'Loading...' : 'Upgrade to Pro'}
    </button>
  );
}
```

### Checking Subscription Status

```typescript
'use client';

import { useEffect } from 'react';
import { useSubscriptionStore } from '@/lib/payments';

export default function SubscriptionStatus() {
  const checkSubscription = useSubscriptionStore(state => state.checkSubscription);
  const plan = useSubscriptionStore(state => state.plan);
  const isLoading = useSubscriptionStore(state => state.isCheckingSubscription);

  useEffect(() => {
    // Check subscription on mount
    checkSubscription();

    // Check every hour
    const interval = setInterval(checkSubscription, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkSubscription]);

  if (isLoading) {
    return <div>Checking subscription...</div>;
  }

  return <div>Current plan: {plan}</div>;
}
```

## Webhook Events

### Event Processing

All webhook events are processed asynchronously to ensure fast response times:

1. Webhook endpoint returns 200 immediately
2. Event is processed in background
3. Duplicate events are ignored (idempotency)
4. Errors are logged but don't fail the webhook

### Idempotency

The webhook handler prevents duplicate processing using event IDs:

```typescript
// Event is tracked in memory (use Redis in production)
if (isEventProcessed(event.id)) {
  return jsonResponse({ received: true, duplicate: true }, 200);
}

// Process event
await processWebhookEvent(event);

// Mark as processed
markEventProcessed(event.id);
```

### TODO: Database Integration

Current implementation logs events. Add database integration:

```typescript
// In handleSubscriptionCreated
async function handleSubscriptionCreated(event) {
  const subscription = event.data.object;

  // TODO: Update database
  await db.user.update({
    where: { customerId: subscription.customer },
    data: {
      subscriptionId: subscription.id,
      plan: getPlanFromSubscription(subscription),
      subscriptionStatus: subscription.status,
    },
  });

  // TODO: Send welcome email
  await sendEmail({
    to: user.email,
    template: 'subscription-created',
    data: { plan: subscription.plan },
  });
}
```

## Testing

### Test Mode

The system automatically detects test mode when using test API keys:

```typescript
const stripeService = getStripeService();

if (stripeService.isTestMode()) {
  console.log('Running in test mode');
}
```

### Stripe CLI for Webhooks

Test webhooks locally using Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
```

### Test Cards

Use Stripe test cards:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Auth:** `4000 0025 0000 3155`

## Security

### Best Practices

1. **Webhook Signature Verification**
   - Always verify webhook signatures
   - Use `STRIPE_WEBHOOK_SECRET` from environment

2. **Price ID Validation**
   - Validate price IDs against known prices
   - Prevents malicious price manipulation

3. **Rate Limiting**
   - Checkout endpoint: 5 requests/minute
   - Subscription check: 10 requests/minute

4. **Error Handling**
   - Never expose Stripe API errors to client
   - Log errors for debugging
   - Return generic error messages

5. **Idempotency**
   - Prevent duplicate webhook processing
   - Use event IDs for deduplication

### HTTPS Required

Stripe webhooks require HTTPS in production:

```bash
# Development with ngrok
ngrok http 3000

# Update webhook URL in Stripe Dashboard
https://your-subdomain.ngrok.io/api/stripe/webhook
```

## Production Checklist

- [ ] Set production Stripe API keys
- [ ] Create production products and prices
- [ ] Update price IDs in environment variables
- [ ] Configure webhook endpoint with HTTPS
- [ ] Test all webhook events
- [ ] Implement database integration for user subscriptions
- [ ] Set up email notifications for subscription events
- [ ] Monitor webhook delivery in Stripe Dashboard
- [ ] Implement proper error tracking (Sentry)
- [ ] Use Redis for webhook idempotency in distributed systems
- [ ] Set up subscription analytics
- [ ] Create customer support workflow for payment issues

## Support

For issues or questions:

1. Check Stripe Dashboard → Developers → Webhooks for delivery status
2. Review logs for webhook processing errors
3. Test with Stripe CLI locally
4. Contact Stripe support for payment-specific issues

## License

MIT
