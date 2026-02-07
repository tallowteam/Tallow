/**
 * Payments Module
 * Centralized exports for payment-related functionality
 */

// Pricing Configuration
export {
  PRICING_PLANS,
  STRIPE_PRICE_IDS,
  VALID_PRICE_IDS,
  PLAN_COMPARISON,
  getPlan,
  getPlanByPriceId,
  isValidPriceId,
  getTierByPriceId,
  formatPrice,
  formatFileSize,
  hasFeature,
  getLimit,
  exceedsLimit,
  type PlanTier,
  type PlanFeatures,
  type PricingPlan,
  type ComparisonFeature,
} from './pricing-config';

// Stripe Service
export {
  StripeService,
  getStripeService,
  type CreateCheckoutSessionParams,
  type CheckoutSessionResult,
  type SubscriptionInfo,
} from './stripe-service';

// Subscription Store
export {
  useSubscriptionStore,
  selectPlan,
  selectCustomerId,
  selectSubscriptionId,
  selectStatus,
  selectCurrentPeriodEnd,
  selectCancelAtPeriodEnd,
  selectMaxFileSize,
  selectMaxTransfersPerDay,
  selectMaxRecipients,
  selectTransfersToday,
  selectIsLoading,
  selectIsCheckingSubscription,
  selectError,
  selectIsSubscribed,
  selectCanTransfer,
  selectRemainingTransfers,
  selectIsExpiringSoon,
  selectPlanConfig,
  useHasFeature,
  useFeatureLimit,
  type SubscriptionState,
  type SubscriptionActions,
  type SubscriptionStore,
} from './subscription-store';
