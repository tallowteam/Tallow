'use client';

/**
 * Connection Strategy Selector
 *
 * Intelligently selects optimal connection method based on NAT types
 * and tracks success rates to adaptively improve connection reliability.
 *
 * Features:
 * - Adaptive timeout adjustment based on historical success
 * - Per-strategy success rate tracking
 * - Network condition awareness
 * - Automatic strategy refinement
 */

import secureLog from '../utils/secure-logger';
import type { NATType, ConnectionStrategyResult } from './nat-detection';
import { getConnectionStrategy } from './nat-detection';

// ============================================================================
// Type Definitions
// ============================================================================

export interface StrategyMetrics {
  strategy: string;
  attempts: number;
  successes: number;
  failures: number;
  successRate: number;
  avgConnectionTime: number;
  lastUsed: number;
}

export interface ConnectionAttempt {
  strategy: string;
  localNAT: NATType;
  remoteNAT: NATType;
  startTime: number;
  endTime?: number;
  success: boolean;
  connectionTime?: number;
  failureReason?: string;
  turnUsed: boolean;
}

export interface AdaptiveStrategyResult extends ConnectionStrategyResult {
  estimatedConnectionTime: number;
  confidence: number;
  historicalSuccessRate: number;
  recommendedICEServers: number;
}

export interface StrategyHistory {
  direct: StrategyMetrics;
  turn_fallback: StrategyMetrics;
  turn_only: StrategyMetrics;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_METRICS: StrategyMetrics = {
  strategy: '',
  attempts: 0,
  successes: 0,
  failures: 0,
  successRate: 0,
  avgConnectionTime: 0,
  lastUsed: 0,
};

// Baseline timeouts (ms) - these are adjusted based on success/failure patterns
const BASELINE_TIMEOUTS = {
  direct: 15000,
  turn_fallback: 10000,
  turn_only: 5000,
};

// Timeout adjustment factors
const TIMEOUT_ADJUSTMENT = {
  successFactor: 0.9, // Reduce timeout by 10% on success
  failureFactor: 1.2, // Increase timeout by 20% on failure
  minTimeout: 3000, // Minimum 3 seconds
  maxTimeout: 30000, // Maximum 30 seconds
};

// Success rate thresholds
const QUALITY_THRESHOLDS = {
  excellent: 0.95, // 95%+ success rate
  good: 0.80, // 80%+ success rate
  fair: 0.60, // 60%+ success rate
  poor: 0.40, // Below 40% success rate
};

// ============================================================================
// Connection Strategy Selector Class
// ============================================================================

export class ConnectionStrategySelector {
  private history: StrategyHistory;
  private attempts: ConnectionAttempt[] = [];
  private maxHistorySize = 100;
  private adaptiveTimeouts: Map<string, number> = new Map();

  constructor() {
    this.history = {
      direct: { ...DEFAULT_METRICS, strategy: 'direct' },
      turn_fallback: { ...DEFAULT_METRICS, strategy: 'turn_fallback' },
      turn_only: { ...DEFAULT_METRICS, strategy: 'turn_only' },
    };

    // Initialize with baseline timeouts
    this.adaptiveTimeouts.set('direct', BASELINE_TIMEOUTS.direct);
    this.adaptiveTimeouts.set('turn_fallback', BASELINE_TIMEOUTS.turn_fallback);
    this.adaptiveTimeouts.set('turn_only', BASELINE_TIMEOUTS.turn_only);

    // Load history from storage
    this.loadHistory();
  }

  /**
   * Get optimal connection strategy with adaptive improvements
   */
  getStrategy(localNAT: NATType, remoteNAT: NATType): AdaptiveStrategyResult {
    // Get base strategy from NAT type analysis
    const baseStrategy = getConnectionStrategy(localNAT, remoteNAT);

    // Get historical metrics for this strategy
    const metrics = this.history[baseStrategy.strategy];
    const successRate = metrics.attempts > 0 ? metrics.successRate : 0;

    // Get adaptive timeout
    const timeout = this.getAdaptiveTimeout(baseStrategy.strategy);

    // Estimate connection time based on historical data
    const estimatedTime = metrics.avgConnectionTime > 0
      ? metrics.avgConnectionTime
      : timeout * 0.5; // Assume 50% of timeout if no history

    // Calculate confidence based on sample size and success rate
    const confidence = this.calculateConfidence(metrics.attempts, successRate);

    // Adjust ICE candidate pool size based on strategy
    const recommendedICEServers = this.getRecommendedICEServers(
      baseStrategy.strategy,
      successRate
    );

    const adaptiveStrategy: AdaptiveStrategyResult = {
      ...baseStrategy,
      directTimeout: timeout,
      estimatedConnectionTime: estimatedTime,
      confidence,
      historicalSuccessRate: successRate,
      recommendedICEServers,
    };

    secureLog.log('[Strategy Selector] Selected strategy:', {
      strategy: adaptiveStrategy.strategy,
      timeout: `${timeout}ms`,
      successRate: `${(successRate * 100).toFixed(1)}%`,
      confidence: `${(confidence * 100).toFixed(1)}%`,
      attempts: metrics.attempts,
    });

    return adaptiveStrategy;
  }

  /**
   * Record the start of a connection attempt
   */
  startAttempt(
    strategy: string,
    localNAT: NATType,
    remoteNAT: NATType,
    turnUsed: boolean
  ): string {
    const attemptId = this.generateAttemptId();
    const attempt: ConnectionAttempt = {
      strategy,
      localNAT,
      remoteNAT,
      startTime: Date.now(),
      success: false,
      turnUsed,
    };

    this.attempts.push(attempt);

    // Update metrics
    const metrics = this.history[strategy as keyof StrategyHistory];
    if (metrics) {
      metrics.attempts++;
      metrics.lastUsed = Date.now();
    }

    return attemptId;
  }

  /**
   * Record a successful connection
   */
  recordSuccess(
    strategy: string,
    connectionTime: number
  ): void {
    const attempt = this.findLatestAttempt(strategy);
    if (attempt) {
      attempt.success = true;
      attempt.endTime = Date.now();
      attempt.connectionTime = connectionTime;
    }

    const metrics = this.history[strategy as keyof StrategyHistory];
    if (metrics) {
      metrics.successes++;

      // Update average connection time (exponential moving average)
      if (metrics.avgConnectionTime === 0) {
        metrics.avgConnectionTime = connectionTime;
      } else {
        metrics.avgConnectionTime =
          metrics.avgConnectionTime * 0.7 + connectionTime * 0.3;
      }

      // Recalculate success rate
      metrics.successRate = metrics.successes / metrics.attempts;

      // Adjust timeout downward on success (connection is faster than expected)
      this.adjustTimeout(strategy, true, connectionTime);
    }

    this.saveHistory();

    secureLog.log('[Strategy Selector] Connection succeeded:', {
      strategy,
      time: `${connectionTime}ms`,
      successRate: `${(metrics?.successRate ?? 0 * 100).toFixed(1)}%`,
    });
  }

  /**
   * Record a failed connection
   */
  recordFailure(
    strategy: string,
    reason: string
  ): void {
    const attempt = this.findLatestAttempt(strategy);
    if (attempt) {
      attempt.success = false;
      attempt.endTime = Date.now();
      attempt.failureReason = reason;
    }

    const metrics = this.history[strategy as keyof StrategyHistory];
    if (metrics) {
      metrics.failures++;
      metrics.successRate = metrics.successes / metrics.attempts;

      // Adjust timeout upward on failure
      this.adjustTimeout(strategy, false);
    }

    this.saveHistory();

    secureLog.warn('[Strategy Selector] Connection failed:', {
      strategy,
      reason,
      successRate: `${(metrics?.successRate ?? 0 * 100).toFixed(1)}%`,
    });
  }

  /**
   * Get quality assessment for a strategy
   */
  getQualityAssessment(strategy: string): string {
    const metrics = this.history[strategy as keyof StrategyHistory];
    if (!metrics || metrics.attempts < 5) {
      return 'insufficient_data';
    }

    const rate = metrics.successRate;
    if (rate >= QUALITY_THRESHOLDS.excellent) {return 'excellent';}
    if (rate >= QUALITY_THRESHOLDS.good) {return 'good';}
    if (rate >= QUALITY_THRESHOLDS.fair) {return 'fair';}
    return 'poor';
  }

  /**
   * Get all strategy metrics
   */
  getMetrics(): StrategyHistory {
    return { ...this.history };
  }

  /**
   * Get recent connection attempts
   */
  getRecentAttempts(limit: number = 10): ConnectionAttempt[] {
    return this.attempts.slice(-limit);
  }

  /**
   * Reset all metrics (useful for testing or after network changes)
   */
  resetMetrics(): void {
    this.history = {
      direct: { ...DEFAULT_METRICS, strategy: 'direct' },
      turn_fallback: { ...DEFAULT_METRICS, strategy: 'turn_fallback' },
      turn_only: { ...DEFAULT_METRICS, strategy: 'turn_only' },
    };
    this.attempts = [];
    this.adaptiveTimeouts.clear();
    this.adaptiveTimeouts.set('direct', BASELINE_TIMEOUTS.direct);
    this.adaptiveTimeouts.set('turn_fallback', BASELINE_TIMEOUTS.turn_fallback);
    this.adaptiveTimeouts.set('turn_only', BASELINE_TIMEOUTS.turn_only);
    this.saveHistory();
    secureLog.log('[Strategy Selector] Metrics reset');
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      history: this.history,
      recentAttempts: this.getRecentAttempts(20),
      adaptiveTimeouts: Object.fromEntries(this.adaptiveTimeouts),
      timestamp: Date.now(),
    }, null, 2);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Get adaptive timeout for a strategy
   */
  private getAdaptiveTimeout(strategy: string): number {
    return this.adaptiveTimeouts.get(strategy) ?? BASELINE_TIMEOUTS.direct;
  }

  /**
   * Adjust timeout based on success/failure
   */
  private adjustTimeout(
    strategy: string,
    success: boolean,
    actualTime?: number
  ): void {
    const currentTimeout = this.getAdaptiveTimeout(strategy);
    let newTimeout: number;

    if (success && actualTime) {
      // If we succeeded much faster than the timeout, reduce it
      if (actualTime < currentTimeout * 0.5) {
        newTimeout = currentTimeout * TIMEOUT_ADJUSTMENT.successFactor;
      } else {
        // Otherwise keep it the same
        newTimeout = currentTimeout;
      }
    } else {
      // On failure, increase timeout
      newTimeout = currentTimeout * TIMEOUT_ADJUSTMENT.failureFactor;
    }

    // Clamp to min/max
    newTimeout = Math.max(
      TIMEOUT_ADJUSTMENT.minTimeout,
      Math.min(TIMEOUT_ADJUSTMENT.maxTimeout, newTimeout)
    );

    this.adaptiveTimeouts.set(strategy, newTimeout);

    secureLog.log('[Strategy Selector] Timeout adjusted:', {
      strategy,
      old: `${currentTimeout}ms`,
      new: `${newTimeout}ms`,
      reason: success ? 'success' : 'failure',
    });
  }

  /**
   * Calculate confidence based on sample size and success rate
   */
  private calculateConfidence(attempts: number, successRate: number): number {
    if (attempts === 0) {return 0;}

    // Use Wilson score interval for confidence
    // More samples = higher confidence
    // Higher success rate = higher confidence
    const sampleFactor = Math.min(attempts / 50, 1); // Max out at 50 samples
    const rateFactor = successRate;

    return sampleFactor * 0.5 + rateFactor * 0.5;
  }

  /**
   * Get recommended ICE server count
   */
  private getRecommendedICEServers(
    strategy: string,
    successRate: number
  ): number {
    // More ICE servers for problematic connections
    if (strategy === 'turn_only') {return 2;} // TURN + backup
    if (strategy === 'turn_fallback') {
      return successRate < QUALITY_THRESHOLDS.good ? 6 : 4;
    }
    // Direct connections
    return successRate < QUALITY_THRESHOLDS.fair ? 8 : 6;
  }

  /**
   * Generate unique attempt ID
   */
  private generateAttemptId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Find latest attempt for a strategy
   */
  private findLatestAttempt(strategy: string): ConnectionAttempt | undefined {
    for (let i = this.attempts.length - 1; i >= 0; i--) {
      const attempt = this.attempts[i];
      if (attempt && attempt.strategy === strategy && !attempt.endTime) {
        return attempt;
      }
    }
    return undefined;
  }

  /**
   * Load history from localStorage
   */
  private loadHistory(): void {
    if (typeof window === 'undefined') {return;}

    try {
      const stored = localStorage.getItem('tallow_strategy_history');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.history) {
          this.history = data.history;
        }
        if (data.adaptiveTimeouts) {
          this.adaptiveTimeouts = new Map(Object.entries(data.adaptiveTimeouts));
        }
      }
    } catch (error) {
      secureLog.error('[Strategy Selector] Failed to load history:', error);
    }
  }

  /**
   * Save history to localStorage
   */
  private saveHistory(): void {
    if (typeof window === 'undefined') {return;}

    try {
      // Limit history size
      if (this.attempts.length > this.maxHistorySize) {
        this.attempts = this.attempts.slice(-this.maxHistorySize);
      }

      const data = {
        history: this.history,
        adaptiveTimeouts: Object.fromEntries(this.adaptiveTimeouts),
        lastUpdated: Date.now(),
      };

      localStorage.setItem('tallow_strategy_history', JSON.stringify(data));
    } catch (error) {
      secureLog.error('[Strategy Selector] Failed to save history:', error);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let selectorInstance: ConnectionStrategySelector | null = null;

export function getStrategySelector(): ConnectionStrategySelector {
  if (!selectorInstance) {
    selectorInstance = new ConnectionStrategySelector();
  }
  return selectorInstance;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get comprehensive connection recommendations
 */
export function getConnectionRecommendations(
  localNAT: NATType,
  remoteNAT: NATType
): {
  strategy: AdaptiveStrategyResult;
  quality: string;
  tips: string[];
} {
  const selector = getStrategySelector();
  const strategy = selector.getStrategy(localNAT, remoteNAT);
  const quality = selector.getQualityAssessment(strategy.strategy);

  const tips: string[] = [];

  // Generate helpful tips
  if (quality === 'poor' || quality === 'insufficient_data') {
    tips.push('Enable TURN relay servers for better connectivity');
  }

  if (strategy.strategy === 'turn_only') {
    tips.push('Your network requires TURN relay for connections');
    tips.push('Consider configuring a TURN server for best results');
  }

  if (strategy.historicalSuccessRate < QUALITY_THRESHOLDS.fair) {
    tips.push('Recent connections have been unstable');
    tips.push('Check your network configuration or firewall settings');
  }

  if (localNAT === 'SYMMETRIC' || remoteNAT === 'SYMMETRIC') {
    tips.push('Symmetric NAT detected - direct P2P may be difficult');
    tips.push('TURN relay recommended for reliable connections');
  }

  return { strategy, quality, tips };
}

/**
 * Check if strategy metrics should be reset (e.g., after network change)
 */
export function shouldResetMetrics(lastResetTime: number): boolean {
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - lastResetTime > oneWeek;
}

export default {
  ConnectionStrategySelector,
  getStrategySelector,
  getConnectionRecommendations,
  shouldResetMetrics,
};
