/**
 * Email Retry Manager
 * Implements exponential backoff retry logic for failed email deliveries
 */

import { secureLog } from '../utils/secure-logger';
import type { EmailRetryPolicy } from './types';
import { DEFAULT_RETRY_POLICY } from './types';

export interface RetryAttempt {
  attempt: number;
  timestamp: number;
  error?: string;
  nextRetryAt?: number;
}

export interface RetryState {
  emailId: string;
  attempts: RetryAttempt[];
  lastError?: string;
  nextRetryAt?: number;
  maxRetriesReached: boolean;
}

/**
 * Calculate next retry delay using exponential backoff
 */
export function calculateRetryDelay(
  attemptNumber: number,
  policy: EmailRetryPolicy = DEFAULT_RETRY_POLICY
): number {
  const delay = Math.min(
    policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attemptNumber),
    policy.maxDelayMs
  );

  // Add jitter (±10%) to prevent thundering herd
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Check if error is retryable based on policy
 */
export function isRetryableError(
  error: Error | string,
  policy: EmailRetryPolicy = DEFAULT_RETRY_POLICY
): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorCode = typeof error === 'object' && 'code' in error
    ? (error as any).code
    : '';

  return policy.retryableErrors.some(retryableError => {
    return errorMessage.includes(retryableError) || errorCode === retryableError;
  });
}

/**
 * Email Retry Manager
 */
export class EmailRetryManager {
  private retryStates = new Map<string, RetryState>();
  private policy: EmailRetryPolicy;
  private retryTimers = new Map<string, NodeJS.Timeout>();

  constructor(policy: EmailRetryPolicy = DEFAULT_RETRY_POLICY) {
    this.policy = policy;
  }

  /**
   * Record a failed attempt
   */
  recordFailure(emailId: string, error: Error | string): RetryState {
    let state = this.retryStates.get(emailId);

    if (!state) {
      state = {
        emailId,
        attempts: [],
        maxRetriesReached: false,
      };
      this.retryStates.set(emailId, state);
    }

    const attemptNumber = state.attempts.length;
    const shouldRetry = attemptNumber < this.policy.maxRetries &&
                       isRetryableError(error, this.policy);

    const attempt: RetryAttempt = {
      attempt: attemptNumber,
      timestamp: Date.now(),
      error: typeof error === 'string' ? error : error.message,
    };

    if (shouldRetry) {
      const delay = calculateRetryDelay(attemptNumber, this.policy);
      attempt.nextRetryAt = Date.now() + delay;
      state.nextRetryAt = attempt.nextRetryAt;
    } else {
      state.maxRetriesReached = true;
    }

    state.attempts.push(attempt);
    if (attempt.error !== undefined) {
      state.lastError = attempt.error;
    }

    secureLog.log(
      `[RetryManager] Recorded failure for ${emailId}: attempt ${attemptNumber}, ` +
      `shouldRetry=${shouldRetry}`
    );

    return state;
  }

  /**
   * Get retry state for an email
   */
  getRetryState(emailId: string): RetryState | null {
    return this.retryStates.get(emailId) || null;
  }

  /**
   * Check if email should be retried
   */
  shouldRetry(emailId: string): boolean {
    const state = this.retryStates.get(emailId);
    if (!state) {return false;}

    return !state.maxRetriesReached &&
           state.attempts.length < this.policy.maxRetries &&
           (!state.nextRetryAt || Date.now() >= state.nextRetryAt);
  }

  /**
   * Schedule automatic retry
   */
  scheduleRetry(
    emailId: string,
    retryCallback: () => Promise<void>
  ): void {
    const state = this.retryStates.get(emailId);
    if (!state || !state.nextRetryAt) {return;}

    // Clear existing timer
    const existingTimer = this.retryTimers.get(emailId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const delay = Math.max(0, state.nextRetryAt - Date.now());

    const timer = setTimeout(async () => {
      secureLog.log(`[RetryManager] Retrying email ${emailId}`);

      try {
        await retryCallback();
        this.clearRetryState(emailId);
      } catch (error) {
        secureLog.error(`[RetryManager] Retry failed for ${emailId}:`, error);
      }

      this.retryTimers.delete(emailId);
    }, delay);

    this.retryTimers.set(emailId, timer);

    secureLog.log(
      `[RetryManager] Scheduled retry for ${emailId} in ${delay}ms`
    );
  }

  /**
   * Clear retry state (called on success)
   */
  clearRetryState(emailId: string): void {
    const timer = this.retryTimers.get(emailId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(emailId);
    }

    this.retryStates.delete(emailId);
    secureLog.log(`[RetryManager] Cleared retry state for ${emailId}`);
  }

  /**
   * Get all emails pending retry
   */
  getPendingRetries(): RetryState[] {
    return Array.from(this.retryStates.values()).filter(
      state => !state.maxRetriesReached && state.nextRetryAt
    );
  }

  /**
   * Update retry policy
   */
  updatePolicy(policy: Partial<EmailRetryPolicy>): void {
    this.policy = { ...this.policy, ...policy };
    secureLog.log('[RetryManager] Updated retry policy');
  }

  /**
   * Clear all retry states and timers
   */
  clearAll(): void {
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer);
    }

    this.retryTimers.clear();
    this.retryStates.clear();

    secureLog.log('[RetryManager] Cleared all retry states');
  }

  /**
   * Get retry statistics
   */
  getStats(): {
    totalEmails: number;
    pendingRetries: number;
    maxRetriesReached: number;
    averageAttempts: number;
  } {
    const states = Array.from(this.retryStates.values());
    const totalEmails = states.length;
    const pendingRetries = states.filter(
      s => !s.maxRetriesReached && s.nextRetryAt
    ).length;
    const maxRetriesReached = states.filter(s => s.maxRetriesReached).length;
    const averageAttempts = totalEmails > 0
      ? states.reduce((sum, s) => sum + s.attempts.length, 0) / totalEmails
      : 0;

    return {
      totalEmails,
      pendingRetries,
      maxRetriesReached,
      averageAttempts,
    };
  }
}

// Singleton instance
let retryManagerInstance: EmailRetryManager | null = null;

/**
 * Get global retry manager instance
 */
export function getRetryManager(): EmailRetryManager {
  if (!retryManagerInstance) {
    retryManagerInstance = new EmailRetryManager();
  }
  return retryManagerInstance;
}

export default {
  EmailRetryManager,
  getRetryManager,
  calculateRetryDelay,
  isRetryableError,
};
