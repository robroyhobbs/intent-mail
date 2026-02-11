import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { Plan } from "@prisma/client";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// Allow-all fallback when Redis is not configured
const ALLOW_ALL: RateLimitResult = {
  success: true,
  limit: 999999,
  remaining: 999999,
  reset: 0,
};

function createRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

function createRateLimiters(redis: Redis) {
  return {
    FREE: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      prefix: "ratelimit:free",
    }),
    STARTER: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(500, "1 m"),
      prefix: "ratelimit:starter",
    }),
    GROWTH: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(2000, "1 m"),
      prefix: "ratelimit:growth",
    }),
    ENTERPRISE: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10000, "1 m"),
      prefix: "ratelimit:enterprise",
    }),
  };
}

const redis = createRedis();
const rateLimiters = redis ? createRateLimiters(redis) : null;

export async function checkRateLimit(
  identifier: string,
  plan: Plan,
  customLimit?: number,
): Promise<RateLimitResult> {
  if (!rateLimiters || !redis) return ALLOW_ALL;

  if (customLimit) {
    const customLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(customLimit, "1 m"),
      prefix: `ratelimit:custom:${identifier}`,
    });
    const result = await customLimiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  const limiter = rateLimiters[plan];
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function getRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}
