/**
 * Pricing Configuration
 * Central configuration for pricing plans, features, and Stripe price IDs
 */

// ============================================================================
// PLAN TYPES
// ============================================================================

export type PlanTier = 'free' | 'pro' | 'business';

export interface PlanFeatures {
  // File Transfer Limits
  maxFileSize: number; // bytes
  maxTransfersPerDay: number;
  maxRecipients: number;

  // Performance & Infrastructure
  priorityRelay: boolean;
  priorityTurnServers: boolean;
  bandwidthPriority: boolean;

  // Team Features
  teamMembers: number;
  sharedRooms: boolean;
  teamAnalytics: boolean;

  // Storage
  transferHistory: number; // days
  transferAnalytics: boolean;

  // Support
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  responseTime?: string;

  // Advanced Features
  customRoomCodes: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  ssoIntegration: boolean;
  selfHostedOption: boolean;
  customBranding: boolean;
}

export interface PricingPlan {
  id: PlanTier;
  name: string;
  description: string;
  price: number; // USD per month (0 for free)
  priceId: string; // Stripe Price ID
  popular?: boolean;
  features: PlanFeatures;
  included: string[]; // User-facing feature list
  limitations?: string[]; // What's not included
}

// ============================================================================
// STRIPE PRICE IDS
// ============================================================================

/**
 * Stripe Price IDs
 * Replace with actual Price IDs from Stripe Dashboard
 * Test mode: price_test_*
 * Live mode: price_*
 */
export const STRIPE_PRICE_IDS = {
  FREE: 'price_free', // Free plan has no Stripe price
  PRO_MONTHLY: process.env['NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY'] || 'price_test_pro_monthly',
  PRO_YEARLY: process.env['NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY'] || 'price_test_pro_yearly',
  BUSINESS_MONTHLY: process.env['NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY'] || 'price_test_business_monthly',
  BUSINESS_YEARLY: process.env['NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_YEARLY'] || 'price_test_business_yearly',
} as const;

/**
 * Valid price IDs for validation
 */
export const VALID_PRICE_IDS = Object.values(STRIPE_PRICE_IDS).filter(id => id !== 'price_free');

// ============================================================================
// PLAN FEATURES DEFINITIONS
// ============================================================================

const FREE_FEATURES: PlanFeatures = {
  // Transfer Limits
  maxFileSize: 5 * 1024 * 1024 * 1024, // 5 GB
  maxTransfersPerDay: 50,
  maxRecipients: 5,

  // Performance
  priorityRelay: false,
  priorityTurnServers: false,
  bandwidthPriority: false,

  // Team
  teamMembers: 1,
  sharedRooms: false,
  teamAnalytics: false,

  // Storage
  transferHistory: 7, // days
  transferAnalytics: false,

  // Support
  supportLevel: 'community',

  // Advanced
  customRoomCodes: false,
  apiAccess: false,
  webhooks: false,
  ssoIntegration: false,
  selfHostedOption: false,
  customBranding: false,
};

const PRO_FEATURES: PlanFeatures = {
  // Transfer Limits
  maxFileSize: 50 * 1024 * 1024 * 1024, // 50 GB
  maxTransfersPerDay: 500,
  maxRecipients: 10,

  // Performance
  priorityRelay: true,
  priorityTurnServers: true,
  bandwidthPriority: true,

  // Team
  teamMembers: 5,
  sharedRooms: true,
  teamAnalytics: true,

  // Storage
  transferHistory: 30, // days
  transferAnalytics: true,

  // Support
  supportLevel: 'email',
  responseTime: '24 hours',

  // Advanced
  customRoomCodes: true,
  apiAccess: false,
  webhooks: false,
  ssoIntegration: false,
  selfHostedOption: false,
  customBranding: false,
};

const BUSINESS_FEATURES: PlanFeatures = {
  // Transfer Limits
  maxFileSize: Infinity, // No limit
  maxTransfersPerDay: Infinity, // No limit
  maxRecipients: Infinity, // No limit

  // Performance
  priorityRelay: true,
  priorityTurnServers: true,
  bandwidthPriority: true,

  // Team
  teamMembers: Infinity, // No limit
  sharedRooms: true,
  teamAnalytics: true,

  // Storage
  transferHistory: 365, // 1 year
  transferAnalytics: true,

  // Support
  supportLevel: 'dedicated',
  responseTime: '4 hours',

  // Advanced
  customRoomCodes: true,
  apiAccess: true,
  webhooks: true,
  ssoIntegration: true,
  selfHostedOption: true,
  customBranding: true,
};

// ============================================================================
// PRICING PLANS
// ============================================================================

export const PRICING_PLANS: Record<PlanTier, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'For personal use and small transfers',
    price: 0,
    priceId: STRIPE_PRICE_IDS.FREE,
    features: FREE_FEATURES,
    included: [
      'Unlimited file transfers',
      'End-to-end encryption',
      'Post-quantum cryptography',
      'Up to 5 recipients',
      'Local device discovery',
      'Resumable transfers',
      '5 GB per file',
      '50 transfers per day',
      '7 day transfer history',
    ],
    limitations: [
      'No priority relay servers',
      'No team features',
      'No analytics',
      'Community support only',
    ],
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For power users and small teams',
    price: 9.99,
    priceId: STRIPE_PRICE_IDS.PRO_MONTHLY,
    popular: true,
    features: PRO_FEATURES,
    included: [
      'Everything in Free',
      'Up to 10 recipients',
      '50 GB per file',
      '500 transfers per day',
      'Priority TURN servers',
      'Transfer analytics',
      'Custom room codes',
      '30 day transfer history',
      'Team features (up to 5)',
      'Email support (24h)',
    ],
    limitations: [
      'No API access',
      'No SSO integration',
      'No self-hosted option',
    ],
  },

  business: {
    id: 'business',
    name: 'Business',
    description: 'For organizations with custom needs',
    price: 24.99,
    priceId: STRIPE_PRICE_IDS.BUSINESS_MONTHLY,
    features: BUSINESS_FEATURES,
    included: [
      'Everything in Pro',
      'Unlimited file size',
      'Unlimited transfers',
      'Unlimited recipients',
      'Unlimited team members',
      'API access',
      'Webhook integrations',
      'SSO/SAML integration',
      'Self-hosted option',
      'Custom branding',
      '1 year transfer history',
      'Dedicated support (4h)',
    ],
  },
};

// ============================================================================
// PLAN COMPARISON MATRIX
// ============================================================================

export interface ComparisonFeature {
  category: string;
  items: {
    name: string;
    free: string | boolean;
    pro: string | boolean;
    business: string | boolean;
    tooltip?: string;
  }[];
}

export const PLAN_COMPARISON: ComparisonFeature[] = [
  {
    category: 'File Transfer',
    items: [
      {
        name: 'Max file size',
        free: '5 GB',
        pro: '50 GB',
        business: 'Unlimited',
        tooltip: 'Maximum size per file',
      },
      {
        name: 'Daily transfers',
        free: '50',
        pro: '500',
        business: 'Unlimited',
        tooltip: 'Maximum number of transfers per day',
      },
      {
        name: 'Max recipients',
        free: '5',
        pro: '10',
        business: 'Unlimited',
        tooltip: 'Maximum number of recipients per transfer',
      },
      {
        name: 'End-to-end encryption',
        free: true,
        pro: true,
        business: true,
      },
      {
        name: 'Post-quantum cryptography',
        free: true,
        pro: true,
        business: true,
      },
      {
        name: 'Resumable transfers',
        free: true,
        pro: true,
        business: true,
      },
    ],
  },
  {
    category: 'Performance',
    items: [
      {
        name: 'Priority relay servers',
        free: false,
        pro: true,
        business: true,
        tooltip: 'Faster relay connections with lower latency',
      },
      {
        name: 'Priority TURN servers',
        free: false,
        pro: true,
        business: true,
        tooltip: 'Better NAT traversal with dedicated servers',
      },
      {
        name: 'Bandwidth priority',
        free: false,
        pro: true,
        business: true,
        tooltip: 'Higher bandwidth allocation during transfers',
      },
    ],
  },
  {
    category: 'Team & Collaboration',
    items: [
      {
        name: 'Team members',
        free: '1',
        pro: '5',
        business: 'Unlimited',
      },
      {
        name: 'Shared rooms',
        free: false,
        pro: true,
        business: true,
      },
      {
        name: 'Team analytics',
        free: false,
        pro: true,
        business: true,
      },
      {
        name: 'Custom room codes',
        free: false,
        pro: true,
        business: true,
      },
    ],
  },
  {
    category: 'History & Analytics',
    items: [
      {
        name: 'Transfer history',
        free: '7 days',
        pro: '30 days',
        business: '1 year',
      },
      {
        name: 'Transfer analytics',
        free: false,
        pro: true,
        business: true,
      },
    ],
  },
  {
    category: 'Support',
    items: [
      {
        name: 'Support level',
        free: 'Community',
        pro: 'Email',
        business: 'Dedicated',
      },
      {
        name: 'Response time',
        free: 'Best effort',
        pro: '24 hours',
        business: '4 hours',
      },
    ],
  },
  {
    category: 'Advanced Features',
    items: [
      {
        name: 'API access',
        free: false,
        pro: false,
        business: true,
      },
      {
        name: 'Webhooks',
        free: false,
        pro: false,
        business: true,
      },
      {
        name: 'SSO/SAML',
        free: false,
        pro: false,
        business: true,
      },
      {
        name: 'Self-hosted option',
        free: false,
        pro: false,
        business: true,
      },
      {
        name: 'Custom branding',
        free: false,
        pro: false,
        business: true,
      },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get plan by tier
 */
export function getPlan(tier: PlanTier): PricingPlan {
  return PRICING_PLANS[tier];
}

/**
 * Get plan by price ID
 */
export function getPlanByPriceId(priceId: string): PricingPlan | null {
  for (const plan of Object.values(PRICING_PLANS)) {
    if (plan.priceId === priceId) {
      return plan;
    }
  }
  return null;
}

/**
 * Validate price ID
 */
export function isValidPriceId(priceId: string): boolean {
  return VALID_PRICE_IDS.includes(priceId);
}

/**
 * Get tier by price ID
 */
export function getTierByPriceId(priceId: string): PlanTier | null {
  const plan = getPlanByPriceId(priceId);
  return plan?.id || null;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  if (price === 0) {
    return 'Free';
  }
  return `$${price.toFixed(2)}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === Infinity) {
    return 'Unlimited';
  }
  if (bytes === 0) {
    return '0 B';
  }

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if a feature is available in a plan
 */
export function hasFeature(tier: PlanTier, feature: keyof PlanFeatures): boolean {
  const plan = getPlan(tier);
  const value = plan.features[feature];

  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value > 0;
  }

  return false;
}

/**
 * Get usage limit for a feature
 */
export function getLimit(tier: PlanTier, feature: keyof PlanFeatures): number {
  const plan = getPlan(tier);
  const value = plan.features[feature];

  if (typeof value === 'number') {
    return value;
  }

  return 0;
}

/**
 * Check if user exceeds limit
 */
export function exceedsLimit(
  tier: PlanTier,
  feature: keyof PlanFeatures,
  usage: number
): boolean {
  const limit = getLimit(tier, feature);

  // Infinity means unlimited
  if (limit === Infinity) {
    return false;
  }

  return usage >= limit;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
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
};
