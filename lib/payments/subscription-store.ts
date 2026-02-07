/**
 * Subscription Store - Zustand State Management
 * Manages user subscription state with localStorage persistence
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '../stores/storage';
import { PlanTier, getPlan } from './pricing-config';
import type { SubscriptionInfo } from './stripe-service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SubscriptionState {
  // Subscription Data
  plan: PlanTier;
  customerId?: string;
  subscriptionId?: string;
  status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;

  // Feature Access
  maxFileSize: number;
  maxTransfersPerDay: number;
  maxRecipients: number;

  // Usage Tracking (client-side only, server should validate)
  transfersToday: number;
  lastTransferReset: Date;

  // Loading States
  isLoading: boolean;
  isCheckingSubscription: boolean;

  // Error State
  error?: string;
}

export interface SubscriptionActions {
  // Subscription Management
  setSubscription: (info: SubscriptionInfo) => void;
  updatePlan: (plan: PlanTier) => void;
  clearSubscription: () => void;

  // Usage Tracking
  incrementTransfers: () => void;
  resetDailyTransfers: () => void;

  // Subscription Checks
  checkSubscription: () => Promise<void>;
  hasFeature: (feature: keyof typeof getPlan) => boolean;

  // Loading & Error States
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
}

export type SubscriptionStore = SubscriptionState & SubscriptionActions;

// ============================================================================
// DEFAULT STATE
// ============================================================================

const FREE_PLAN = getPlan('free');

const DEFAULT_STATE: SubscriptionState = {
  plan: 'free',
  maxFileSize: FREE_PLAN.features.maxFileSize,
  maxTransfersPerDay: FREE_PLAN.features.maxTransfersPerDay,
  maxRecipients: FREE_PLAN.features.maxRecipients,
  transfersToday: 0,
  lastTransferReset: new Date(),
  isLoading: false,
  isCheckingSubscription: false,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useSubscriptionStore = create<SubscriptionStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...DEFAULT_STATE,

        // ====================================================================
        // SUBSCRIPTION MANAGEMENT
        // ====================================================================

        setSubscription: (info: SubscriptionInfo) => {
          const planConfig = getPlan(info.plan);

          set({
            plan: info.plan,
            customerId: info.customerId,
            subscriptionId: info.id,
            status: info.status,
            currentPeriodEnd: info.currentPeriodEnd,
            cancelAtPeriodEnd: info.cancelAtPeriodEnd,
            maxFileSize: planConfig.features.maxFileSize,
            maxTransfersPerDay: planConfig.features.maxTransfersPerDay,
            maxRecipients: planConfig.features.maxRecipients,
            error: undefined,
          });
        },

        updatePlan: (plan: PlanTier) => {
          const planConfig = getPlan(plan);

          set({
            plan,
            maxFileSize: planConfig.features.maxFileSize,
            maxTransfersPerDay: planConfig.features.maxTransfersPerDay,
            maxRecipients: planConfig.features.maxRecipients,
          });
        },

        clearSubscription: () => {
          set({
            ...DEFAULT_STATE,
            transfersToday: get().transfersToday,
            lastTransferReset: get().lastTransferReset,
          });
        },

        // ====================================================================
        // USAGE TRACKING
        // ====================================================================

        incrementTransfers: () => {
          const state = get();
          const now = new Date();
          const lastReset = new Date(state.lastTransferReset);

          // Reset if it's a new day
          if (now.getDate() !== lastReset.getDate() ||
              now.getMonth() !== lastReset.getMonth() ||
              now.getFullYear() !== lastReset.getFullYear()) {
            set({
              transfersToday: 1,
              lastTransferReset: now,
            });
          } else {
            set({
              transfersToday: state.transfersToday + 1,
            });
          }
        },

        resetDailyTransfers: () => {
          set({
            transfersToday: 0,
            lastTransferReset: new Date(),
          });
        },

        // ====================================================================
        // SUBSCRIPTION CHECKS
        // ====================================================================

        checkSubscription: async () => {
          const state = get();

          // Don't check if no customer ID
          if (!state.customerId) {
            return;
          }

          set({ isCheckingSubscription: true, error: undefined });

          try {
            // Call API to verify subscription
            const response = await fetch('/api/stripe/subscription', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });

            if (!response.ok) {
              throw new Error('Failed to check subscription');
            }

            const data = await response.json();

            if (data.subscription) {
              get().setSubscription(data.subscription);
            } else {
              // No active subscription - revert to free
              get().clearSubscription();
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to check subscription',
            });
            console.error('Subscription check failed:', error);
          } finally {
            set({ isCheckingSubscription: false });
          }
        },

        hasFeature: (feature: keyof typeof getPlan) => {
          const state = get();
          const planConfig = getPlan(state.plan);
          const value = planConfig.features[feature];

          if (typeof value === 'boolean') {
            return value;
          }
          if (typeof value === 'number') {
            return value > 0;
          }

          return false;
        },

        // ====================================================================
        // LOADING & ERROR STATES
        // ====================================================================

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setError: (error: string | undefined) => {
          set({ error });
        },
      }),
      {
        name: 'tallow-subscription-store',
        storage: createJSONStorage(() => safeStorage),
        partialize: (state) => ({
          // Only persist essential data
          plan: state.plan,
          customerId: state.customerId,
          subscriptionId: state.subscriptionId,
          status: state.status,
          currentPeriodEnd: state.currentPeriodEnd,
          cancelAtPeriodEnd: state.cancelAtPeriodEnd,
          maxFileSize: state.maxFileSize,
          maxTransfersPerDay: state.maxTransfersPerDay,
          maxRecipients: state.maxRecipients,
          transfersToday: state.transfersToday,
          lastTransferReset: state.lastTransferReset,
        }),
        // Merge strategy for hydration
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<SubscriptionState>;

          return {
            ...currentState,
            ...persisted,
            // Convert date strings back to Date objects
            currentPeriodEnd: persisted.currentPeriodEnd
              ? new Date(persisted.currentPeriodEnd)
              : undefined,
            lastTransferReset: persisted.lastTransferReset
              ? new Date(persisted.lastTransferReset)
              : new Date(),
            // Reset loading states
            isLoading: false,
            isCheckingSubscription: false,
            error: undefined,
          };
        },
      }
    ),
    { name: 'SubscriptionStore' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectPlan = (state: SubscriptionStore) => state.plan;
export const selectCustomerId = (state: SubscriptionStore) => state.customerId;
export const selectSubscriptionId = (state: SubscriptionStore) => state.subscriptionId;
export const selectStatus = (state: SubscriptionStore) => state.status;
export const selectCurrentPeriodEnd = (state: SubscriptionStore) => state.currentPeriodEnd;
export const selectCancelAtPeriodEnd = (state: SubscriptionStore) => state.cancelAtPeriodEnd;
export const selectMaxFileSize = (state: SubscriptionStore) => state.maxFileSize;
export const selectMaxTransfersPerDay = (state: SubscriptionStore) => state.maxTransfersPerDay;
export const selectMaxRecipients = (state: SubscriptionStore) => state.maxRecipients;
export const selectTransfersToday = (state: SubscriptionStore) => state.transfersToday;
export const selectIsLoading = (state: SubscriptionStore) => state.isLoading;
export const selectIsCheckingSubscription = (state: SubscriptionStore) => state.isCheckingSubscription;
export const selectError = (state: SubscriptionStore) => state.error;

/**
 * Check if user has active subscription
 */
export const selectIsSubscribed = (state: SubscriptionStore): boolean => {
  return state.plan !== 'free' && (state.status === 'active' || state.status === 'trialing');
};

/**
 * Check if user can perform transfer (based on daily limit)
 */
export const selectCanTransfer = (state: SubscriptionStore): boolean => {
  const { transfersToday, maxTransfersPerDay } = state;

  // Unlimited transfers
  if (maxTransfersPerDay === Infinity) {
    return true;
  }

  return transfersToday < maxTransfersPerDay;
};

/**
 * Get remaining transfers for today
 */
export const selectRemainingTransfers = (state: SubscriptionStore): number => {
  const { transfersToday, maxTransfersPerDay } = state;

  // Unlimited transfers
  if (maxTransfersPerDay === Infinity) {
    return Infinity;
  }

  return Math.max(0, maxTransfersPerDay - transfersToday);
};

/**
 * Check if subscription is expiring soon (within 7 days)
 */
export const selectIsExpiringSoon = (state: SubscriptionStore): boolean => {
  if (!state.currentPeriodEnd) {
    return false;
  }

  const now = new Date();
  const end = new Date(state.currentPeriodEnd);
  const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return daysUntilExpiry <= 7;
};

/**
 * Get plan config
 */
export const selectPlanConfig = (state: SubscriptionStore) => {
  return getPlan(state.plan);
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to check if user has a specific feature
 */
export function useHasFeature(feature: keyof ReturnType<typeof getPlan>['features']): boolean {
  return useSubscriptionStore(state => {
    const planConfig = getPlan(state.plan);
    const value = planConfig.features[feature];

    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value > 0;
    }

    return false;
  });
}

/**
 * Hook to get feature limit
 */
export function useFeatureLimit(feature: keyof ReturnType<typeof getPlan>['features']): number {
  return useSubscriptionStore(state => {
    const planConfig = getPlan(state.plan);
    const value = planConfig.features[feature];

    if (typeof value === 'number') {
      return value;
    }

    return 0;
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useSubscriptionStore;
