import { Redis } from '@upstash/redis'
import type { Plan } from '@prisma/client'

// =============================================================================
// GENERATION LIMITS
// =============================================================================

export const AI_GENERATION_LIMITS: Record<Plan, number> = {
  FREE: 100,
  STARTER: 1_000,
  GROWTH: 10_000,
  ENTERPRISE: Infinity,
}

// =============================================================================
// REDIS KEY HELPERS
// =============================================================================

export function getRedisKey(orgId: string): string {
  const now = new Date()
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  return `ai-gen:${orgId}:${month}`
}

export function getMonthTTL(): number {
  const now = new Date()
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return Math.ceil((nextMonth.getTime() - now.getTime()) / 1000)
}

// =============================================================================
// REDIS CLIENT
// =============================================================================

let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return _redis
}

/** @internal For testing only */
export function _setRedisForTesting(redis: unknown) {
  _redis = redis as Redis
}

// =============================================================================
// PUBLIC API
// =============================================================================

export function getGenerationLimit(plan: Plan): number {
  return AI_GENERATION_LIMITS[plan] ?? AI_GENERATION_LIMITS.FREE
}

export async function checkGenerationLimit(orgId: string, plan: Plan): Promise<boolean> {
  if (plan === 'ENTERPRISE') return true

  const limit = getGenerationLimit(plan)

  try {
    const redis = getRedis()
    const key = getRedisKey(orgId)
    const count = await redis.get<number>(key)
    return (count ?? 0) < limit
  } catch {
    // Fail open — don't block emails if Redis is down
    return true
  }
}

export async function incrementGenerationCount(orgId: string): Promise<void> {
  try {
    const redis = getRedis()
    const key = getRedisKey(orgId)
    const count = await redis.incr(key)

    // Set TTL on first increment (when count is 1)
    if (count === 1) {
      await redis.expire(key, getMonthTTL())
    }
  } catch {
    // Non-blocking — don't prevent sends if counter fails
  }
}
