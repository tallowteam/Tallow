# Stripe Payment Integration - Quick Start

Get up and running with Stripe payments in 5 minutes.

## Step 1: Configure Environment Variables

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

Get these from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys).

## Step 2: Create Products in Stripe

1. Go to Stripe Dashboard → Products
2. Create "Tallow Pro" with price $9.99/month
3. Create "Tallow Business" with price $24.99/month
4. Copy the Price IDs (they look like `price_xxx`)

## Step 3: Update Pricing Config (Optional)

If using custom price IDs, set them in `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_your_pro_id
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY=price_your_business_id
```

## Step 4: Set Up Webhook (Production Only)

In Stripe Dashboard → Developers → Webhooks:

1. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
2. Select all subscription events
3. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

For development, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Step 5: Add Checkout Button to Pricing Page

```typescript
// app/pricing/page.tsx
'use client';

import { useState } from 'react';
import { STRIPE_PRICE_IDS } from '@/lib/payments';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade(priceId: string) {
    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/pricing`,
          customerEmail: 'user@example.com', // Get from auth
        }),
      });

      const { url } = await response.json();
      window.location.href = url; // Redirect to Stripe Checkout
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => handleUpgrade(STRIPE_PRICE_IDS.PRO_MONTHLY)}
        disabled={loading}
      >
        Upgrade to Pro
      </button>

      <button
        onClick={() => handleUpgrade(STRIPE_PRICE_IDS.BUSINESS_MONTHLY)}
        disabled={loading}
      >
        Upgrade to Business
      </button>
    </div>
  );
}
```

## Step 6: Check Feature Access

```typescript
'use client';

import { useHasFeature, useFeatureLimit } from '@/lib/payments';

export default function TransferButton() {
  const hasPriorityRelay = useHasFeature('priorityRelay');
  const maxFileSize = useFeatureLimit('maxFileSize');

  return (
    <div>
      {hasPriorityRelay && <span>✓ Priority Relay Enabled</span>}
      <p>Max file size: {maxFileSize / (1024 ** 3)} GB</p>
    </div>
  );
}
```

## Step 7: Track Usage

```typescript
'use client';

import { useSubscriptionStore } from '@/lib/payments';

export default function FileTransfer() {
  const canTransfer = useSubscriptionStore(state => state.canTransfer);
  const incrementTransfers = useSubscriptionStore(state => state.incrementTransfers);
  const remainingTransfers = useSubscriptionStore(state =>
    state.maxTransfersPerDay - state.transfersToday
  );

  async function handleTransfer() {
    if (!canTransfer) {
      alert('Daily transfer limit reached!');
      return;
    }

    // Perform transfer
    await performTransfer();

    // Increment usage
    incrementTransfers();
  }

  return (
    <div>
      <button onClick={handleTransfer} disabled={!canTransfer}>
        Transfer File
      </button>
      <p>{remainingTransfers} transfers remaining today</p>
    </div>
  );
}
```

## Testing

### Test Credit Cards

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- Any future expiry date (e.g., 12/34)
- Any CVV (e.g., 123)

### Test Webhooks Locally

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3: Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
```

## Common Use Cases

### Check Subscription on App Load

```typescript
'use client';

import { useEffect } from 'react';
import { useSubscriptionStore } from '@/lib/payments';

export default function AppLayout() {
  const checkSubscription = useSubscriptionStore(state => state.checkSubscription);

  useEffect(() => {
    checkSubscription(); // Check on mount
  }, [checkSubscription]);

  return <div>{/* Your app */}</div>;
}
```

### Show Upgrade Prompt

```typescript
'use client';

import { useSubscriptionStore, selectPlan } from '@/lib/payments';

export default function UpgradePrompt() {
  const plan = useSubscriptionStore(selectPlan);

  if (plan !== 'free') {
    return null; // Already subscribed
  }

  return (
    <div className="upgrade-banner">
      <p>Unlock unlimited transfers with Pro!</p>
      <a href="/pricing">Upgrade Now</a>
    </div>
  );
}
```

### Display Plan Badge

```typescript
'use client';

import { useSubscriptionStore, selectPlan } from '@/lib/payments';

export default function PlanBadge() {
  const plan = useSubscriptionStore(selectPlan);

  const badges = {
    free: { label: 'Free', color: 'gray' },
    pro: { label: 'Pro', color: 'blue' },
    business: { label: 'Business', color: 'purple' },
  };

  const badge = badges[plan];

  return (
    <span className={`badge badge-${badge.color}`}>
      {badge.label}
    </span>
  );
}
```

## Next Steps

- [ ] Customize success/cancel URLs
- [ ] Add user authentication integration
- [ ] Implement database for subscription storage
- [ ] Set up email notifications
- [ ] Create billing portal for plan management
- [ ] Add analytics for conversion tracking

## Resources

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Webhook Events](https://stripe.com/docs/api/events/types)

## Troubleshooting

**Webhook signature verification fails:**
- Check `STRIPE_WEBHOOK_SECRET` is correct
- Use Stripe CLI for local testing
- Ensure raw request body is used (not parsed JSON)

**Price ID validation fails:**
- Verify price IDs in Stripe Dashboard
- Check environment variables are loaded
- Use test price IDs in development

**Checkout session creation fails:**
- Verify `STRIPE_SECRET_KEY` is set
- Check price ID is active in Stripe
- Ensure success/cancel URLs are valid

**Subscription not updating:**
- Check webhook endpoint is configured
- Review webhook delivery in Stripe Dashboard
- Check server logs for processing errors
