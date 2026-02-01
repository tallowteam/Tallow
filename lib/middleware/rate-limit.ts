/**
 * Rate Limiting Middleware
 * Centralized rate limiting for API routes
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Custom key generator (defaults to IP address)
   */
  keyGenerator?: (request: NextRequest) => string;

  /**
   * Custom error message
   */
  message?: string;

  /**
   * Custom error status code
   */
  statusCode?: number;

  /**
   * Skip rate limiting for certain requests
   */
  skip?: (request: NextRequest) => boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

/**
 * Rate Limiter Class
 * Thread-safe in-memory rate limiting
 */
export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: Required<RateLimitConfig>;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: RateLimitConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator.bind(this),
      message: config.message || 'Too many requests',
      statusCode: config.statusCode || 429,
      skip: config.skip || (() => false),
    };

    // Start cleanup interval (every minute)
    this.startCleanup();
  }

  /**
   * Default key generator: IP address
   */
  private defaultKeyGenerator(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const forwardedIp = forwarded?.split(',')[0]?.trim();
    return forwardedIp || realIp || 'unknown';
  }

  /**
   * Check if request should be rate limited
   * Returns NextResponse error if limited, null if allowed
   */
  check(request: NextRequest): NextResponse | null {
    // Skip if configured
    if (this.config.skip(request)) {
      return null;
    }

    const key = this.config.keyGenerator(request);
    const now = Date.now();

    const entry = this.store.get(key);

    if (!entry) {
      // First request from this key
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
      });
      return this.addRateLimitHeaders(null, 1, this.config.maxRequests, now + this.config.windowMs);
    }

    // Check if window has expired
    if (now >= entry.resetTime) {
      // Reset window
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
      });
      return this.addRateLimitHeaders(null, 1, this.config.maxRequests, now + this.config.windowMs);
    }

    // Within window - check limit
    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return this.addRateLimitHeaders(
        NextResponse.json(
          { error: this.config.message },
          {
            status: this.config.statusCode,
            headers: {
              'Retry-After': retryAfter.toString(),
            },
          }
        ),
        this.config.maxRequests,
        this.config.maxRequests,
        entry.resetTime,
        true
      );
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);

    return this.addRateLimitHeaders(
      null,
      entry.count,
      this.config.maxRequests,
      entry.resetTime
    );
  }

  /**
   * Add rate limit headers to response
   */
  private addRateLimitHeaders(
    response: NextResponse | null,
    current: number,
    max: number,
    resetTime: number,
    _limited = false
  ): NextResponse | null {
    const headers = {
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': Math.max(0, max - current).toString(),
      'X-RateLimit-Reset': Math.floor(resetTime / 1000).toString(),
    };

    if (!response) {
      // No response to modify - create a dummy response to attach headers
      // In practice, the route handler should add these headers
      return null;
    }

    // Add headers to error response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {return;}

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now >= entry.resetTime) {
          this.store.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }

  /**
   * Get current stats for a key
   */
  getStats(request: NextRequest): { count: number; remaining: number; resetTime: number } | null {
    const key = this.config.keyGenerator(request);
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(request: NextRequest): void {
    const key = this.config.keyGenerator(request);
    this.store.delete(key);
  }
}

/**
 * Create a rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Preset: Strict rate limiter (3 requests/minute)
 */
export const strictRateLimiter = createRateLimiter({
  maxRequests: 3,
  windowMs: 60000, // 1 minute
  message: 'Too many requests. Please try again later.',
});

/**
 * Preset: Moderate rate limiter (5 requests/minute)
 */
export const moderateRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60000, // 1 minute
  message: 'Too many requests. Please try again later.',
});

/**
 * Preset: Generous rate limiter (10 requests/minute)
 */
export const generousRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  message: 'Too many requests. Please try again later.',
});

/**
 * Preset: API rate limiter (100 requests/minute)
 */
export const apiRateLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  message: 'API rate limit exceeded. Please try again later.',
});

export default {
  RateLimiter,
  createRateLimiter,
  strictRateLimiter,
  moderateRateLimiter,
  generousRateLimiter,
  apiRateLimiter,
};
