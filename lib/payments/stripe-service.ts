/**
 * Stripe Service
 * Centralized service for Stripe payment operations
 */

import Stripe from 'stripe';
import { PlanTier, isValidPriceId, getTierByPriceId } from './pricing-config';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateCheckoutSessionParams {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface SubscriptionInfo {
  id: string;
  customerId: string;
  status: Stripe.Subscription.Status;
  plan: PlanTier;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
}

// ============================================================================
// STRIPE SERVICE CLASS
// ============================================================================

export class StripeService {
  private static instance: StripeService | null = null;
  private stripe: Stripe | null = null;
  private readonly testMode: boolean;

  private constructor() {
    const secretKey = process.env['STRIPE_SECRET_KEY'];
    this.testMode = !secretKey || secretKey.startsWith('sk_test_');

    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-12-15.clover',
        typescript: true,
      });
    } else {
      console.warn('Stripe secret key not configured. Payment features will be disabled.');
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Check if Stripe is configured
   */
  public isConfigured(): boolean {
    return this.stripe !== null;
  }

  /**
   * Check if running in test mode
   */
  public isTestMode(): boolean {
    return this.testMode;
  }

  /**
   * Get Stripe instance
   * @throws Error if Stripe is not configured
   */
  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    return this.stripe;
  }

  // ==========================================================================
  // CHECKOUT SESSIONS
  // ==========================================================================

  /**
   * Create a Stripe Checkout Session
   */
  public async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    const stripe = this.getStripe();

    // Validate price ID
    if (!isValidPriceId(params.priceId)) {
      throw new Error(`Invalid price ID: ${params.priceId}`);
    }

    // Create session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata || {},
      subscription_data: {
        metadata: params.metadata || {},
      },
    };

    // Add customer email or ID
    if (params.customerId) {
      sessionParams.customer = params.customerId;
    } else if (params.customerEmail) {
      sessionParams.customer_email = params.customerEmail;
    }

    // Create the session
    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new Error('Failed to create checkout session: No URL returned');
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Retrieve a checkout session
   */
  public async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    const stripe = this.getStripe();
    return await stripe.checkout.sessions.retrieve(sessionId);
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Get subscription by ID
   */
  public async getSubscription(subscriptionId: string): Promise<SubscriptionInfo | null> {
    try {
      const stripe = this.getStripe();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      return this.formatSubscriptionInfo(subscription);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get subscriptions for a customer
   */
  public async getCustomerSubscriptions(customerId: string): Promise<SubscriptionInfo[]> {
    const stripe = this.getStripe();
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100,
    });

    return subscriptions.data
      .map(sub => this.formatSubscriptionInfo(sub))
      .filter((sub): sub is SubscriptionInfo => sub !== null);
  }

  /**
   * Get active subscription for a customer
   */
  public async getActiveSubscription(customerId: string): Promise<SubscriptionInfo | null> {
    const subscriptions = await this.getCustomerSubscriptions(customerId);

    // Find first active subscription
    const active = subscriptions.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );

    return active || null;
  }

  /**
   * Cancel a subscription
   */
  public async cancelSubscription(
    subscriptionId: string,
    immediate = false
  ): Promise<SubscriptionInfo> {
    const stripe = this.getStripe();

    let subscription: Stripe.Subscription;

    if (immediate) {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    } else {
      // Cancel at period end
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }

    const info = this.formatSubscriptionInfo(subscription);
    if (!info) {
      throw new Error('Failed to format subscription info');
    }

    return info;
  }

  /**
   * Resume a subscription (undo cancel at period end)
   */
  public async resumeSubscription(subscriptionId: string): Promise<SubscriptionInfo> {
    const stripe = this.getStripe();

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    const info = this.formatSubscriptionInfo(subscription);
    if (!info) {
      throw new Error('Failed to format subscription info');
    }

    return info;
  }

  /**
   * Update subscription (change plan)
   */
  public async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ): Promise<SubscriptionInfo> {
    const stripe = this.getStripe();

    // Validate new price ID
    if (!isValidPriceId(newPriceId)) {
      throw new Error(`Invalid price ID: ${newPriceId}`);
    }

    // Get current subscription
    const currentSub = await stripe.subscriptions.retrieve(subscriptionId);
    const firstItem = currentSub.items.data[0];
    if (!firstItem) {
      throw new Error(`Subscription ${subscriptionId} has no items`);
    }

    // Update subscription with new price
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: firstItem.id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });

    const info = this.formatSubscriptionInfo(subscription);
    if (!info) {
      throw new Error('Failed to format subscription info');
    }

    return info;
  }

  // ==========================================================================
  // CUSTOMERS
  // ==========================================================================

  /**
   * Create a customer
   */
  public async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    const stripe = this.getStripe();
    const customerParams: Stripe.CustomerCreateParams = {
      email: params.email,
      metadata: params.metadata || {},
    };
    if (params.name) {
      customerParams.name = params.name;
    }
    return await stripe.customers.create(customerParams);
  }

  /**
   * Get customer by ID
   */
  public async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const stripe = this.getStripe();
      const customer = await stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        return null;
      }

      return customer as Stripe.Customer;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update customer
   */
  public async updateCustomer(
    customerId: string,
    params: Stripe.CustomerUpdateParams
  ): Promise<Stripe.Customer> {
    const stripe = this.getStripe();
    return await stripe.customers.update(customerId, params);
  }

  /**
   * Create a customer portal session
   */
  public async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<string> {
    const stripe = this.getStripe();

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  // ==========================================================================
  // WEBHOOKS
  // ==========================================================================

  /**
   * Verify webhook signature
   */
  public verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret?: string
  ): Stripe.Event {
    const stripe = this.getStripe();
    const webhookSecret = secret || process.env['STRIPE_WEBHOOK_SECRET'];

    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Format subscription info from Stripe subscription
   */
  private formatSubscriptionInfo(subscription: Stripe.Subscription): SubscriptionInfo | null {
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      return null;
    }

    const plan = getTierByPriceId(priceId);
    if (!plan) {
      return null;
    }
    const periodEnd = subscription.items.data[0]?.current_period_end;
    if (!periodEnd) {
      return null;
    }

    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      status: subscription.status,
      plan,
      currentPeriodEnd: new Date(periodEnd * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      priceId,
    };
  }

  /**
   * Check if subscription is active
   */
  public isSubscriptionActive(status: Stripe.Subscription.Status): boolean {
    return ['active', 'trialing'].includes(status);
  }

  /**
   * Get plan tier from subscription
   */
  public getPlanFromSubscription(subscription: Stripe.Subscription): PlanTier | null {
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      return null;
    }
    return getTierByPriceId(priceId);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Get Stripe service instance
 */
export function getStripeService(): StripeService {
  return StripeService.getInstance();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default StripeService;
