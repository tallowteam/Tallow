import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env['STRIPE_SECRET_KEY'];
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(key, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripeInstance;
}

export const DONATION_AMOUNTS = [
  { value: 500, label: '$5' },
  { value: 1000, label: '$10' },
  { value: 2500, label: '$25' },
] as const;

export function isStripeConfigured(): boolean {
  return !!(
    process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] &&
    process.env['STRIPE_SECRET_KEY']
  );
}
