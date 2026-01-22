/**
 * Rate Limiting Middleware
 *
 * Implements sliding window rate limiting based on:
 * - API key (if authenticated)
 * - IP address (fallback)
 *
 * Returns standard rate limit headers:
 * - X-RateLimit-Limit
 * - X-RateLimit-Remaining
 * - X-RateLimit-Reset
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Config, getTierRateLimit } from '../libs/config';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store
// Key: apiKeyId or IP address
// Value: { count, resetTime }
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get identifier for rate limiting
 */
function getRateLimitKey(req: Request): string {
  // Prefer API key ID if available
  if (req.apiKey) {
    return `key:${req.apiKey.id}`;
  }

  // Fall back to IP address
  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown';
  return `ip:${ip}`;
}

/**
 * Get rate limit for the request
 */
function getRateLimit(req: Request): number {
  if (req.apiKey) {
    // Use key's configured rate limit or tier default
    return req.apiKey.rateLimit || getTierRateLimit(req.apiKey.tier);
  }

  // Default for unauthenticated requests
  return Config.tierLimits.free.rateLimit;
}

/**
 * Rate limiting middleware
 *
 * @param options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param options.skipFailedRequests - Don't count failed requests (default: false)
 */
export function rateLimit(
  options: {
    windowMs?: number;
    skipFailedRequests?: boolean;
  } = {}
): RequestHandler {
  const { windowMs = 60 * 1000, skipFailedRequests = false } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = getRateLimitKey(req);
    const limit = getRateLimit(req);
    const now = Date.now();

    // Get or create entry
    let entry = rateLimitStore.get(key);
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Calculate remaining
    const remaining = Math.max(0, limit - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    // Check if rate limited
    if (entry.count >= limit) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${resetSeconds} seconds.`,
        retryAfter: resetSeconds,
        limit,
        resetAt: new Date(entry.resetTime).toISOString(),
      });
    }

    // Increment counter
    entry.count++;

    // Option to decrement on failed requests
    if (skipFailedRequests) {
      res.on('finish', () => {
        if (res.statusCode >= 400 && entry) {
          entry.count = Math.max(0, entry.count - 1);
        }
      });
    }

    next();
  };
}

/**
 * Get current rate limit status for a request
 * Useful for debugging or displaying in responses
 */
export function getRateLimitStatus(req: Request): {
  key: string;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const key = getRateLimitKey(req);
  const limit = getRateLimit(req);
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < Date.now()) {
    return {
      key,
      limit,
      remaining: limit,
      resetTime: Date.now() + 60 * 1000,
    };
  }

  return {
    key,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Reset rate limit for a specific key (admin use)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (testing use)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
