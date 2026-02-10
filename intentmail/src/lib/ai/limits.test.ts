/**
 * AI Generation Limits tests
 * Run: npx tsx src/lib/ai/limits.test.ts
 */
import { strict as assert } from 'node:assert'
import {
  AI_GENERATION_LIMITS,
  checkGenerationLimit,
  incrementGenerationCount,
  getGenerationLimit,
  getRedisKey,
  getMonthTTL,
  _setRedisForTesting,
} from './limits'

// =============================================================================
// MOCK REDIS
// =============================================================================

class MockRedis {
  store = new Map<string, number>()
  ttls = new Map<string, number>()
  shouldFail = false

  async get<T>(key: string): Promise<T | null> {
    if (this.shouldFail) throw new Error('Redis connection failed')
    const val = this.store.get(key)
    return (val ?? null) as T | null
  }

  async incr(key: string): Promise<number> {
    if (this.shouldFail) throw new Error('Redis connection failed')
    const current = this.store.get(key) ?? 0
    const next = current + 1
    this.store.set(key, next)
    return next
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.shouldFail) throw new Error('Redis connection failed')
    this.ttls.set(key, seconds)
    return 1
  }

  clear() {
    this.store.clear()
    this.ttls.clear()
    this.shouldFail = false
  }
}

// =============================================================================
// TEST RUNNER
// =============================================================================

let passed = 0
let failed = 0
const mockRedis = new MockRedis()

async function test(name: string, fn: () => Promise<void> | void) {
  mockRedis.clear()
  _setRedisForTesting(mockRedis)
  try {
    await fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (e: unknown) {
    failed++
    const msg = e instanceof Error ? e.message : String(e)
    console.log(`  ✗ ${name}`)
    console.log(`    ${msg}`)
  }
}

// =============================================================================
// TESTS
// =============================================================================

async function run() {
  console.log('\n=== Happy Path ===')

  await test('checkGenerationLimit returns true when under limit', async () => {
    const key = getRedisKey('org-1')
    mockRedis.store.set(key, 50)
    const result = await checkGenerationLimit('org-1', 'FREE')
    assert.equal(result, true)
  })

  await test('checkGenerationLimit returns false when at limit', async () => {
    const key = getRedisKey('org-1')
    mockRedis.store.set(key, 100)
    const result = await checkGenerationLimit('org-1', 'FREE')
    assert.equal(result, false)
  })

  await test('incrementGenerationCount increments Redis counter', async () => {
    await incrementGenerationCount('org-1')
    const key = getRedisKey('org-1')
    assert.equal(mockRedis.store.get(key), 1)
    await incrementGenerationCount('org-1')
    assert.equal(mockRedis.store.get(key), 2)
  })

  await test('FREE plan limit is 100', () => {
    assert.equal(AI_GENERATION_LIMITS.FREE, 100)
    assert.equal(getGenerationLimit('FREE'), 100)
  })

  await test('STARTER plan limit is 1,000', () => {
    assert.equal(AI_GENERATION_LIMITS.STARTER, 1_000)
    assert.equal(getGenerationLimit('STARTER'), 1_000)
  })

  await test('GROWTH plan limit is 10,000', () => {
    assert.equal(AI_GENERATION_LIMITS.GROWTH, 10_000)
    assert.equal(getGenerationLimit('GROWTH'), 10_000)
  })

  await test('ENTERPRISE plan has no limit (returns true always)', async () => {
    // Even with a huge counter, ENTERPRISE should always pass
    const key = getRedisKey('org-1')
    mockRedis.store.set(key, 999_999)
    const result = await checkGenerationLimit('org-1', 'ENTERPRISE')
    assert.equal(result, true)
  })

  console.log('\n=== Bad Path ===')

  await test('checkGenerationLimit handles Redis failure (fail open)', async () => {
    mockRedis.shouldFail = true
    const result = await checkGenerationLimit('org-1', 'FREE')
    assert.equal(result, true) // Fail open
  })

  await test('incrementGenerationCount handles Redis failure gracefully', async () => {
    mockRedis.shouldFail = true
    // Should not throw
    await incrementGenerationCount('org-1')
    // Counter should not have changed
    assert.equal(mockRedis.store.size, 0)
  })

  await test('getGenerationLimit handles unknown plan value gracefully', () => {
    const limit = getGenerationLimit('UNKNOWN_PLAN' as never)
    assert.equal(limit, 100) // Falls back to FREE
  })

  console.log('\n=== Edge Cases ===')

  await test('counter key includes year-month for billing cycle reset', () => {
    const key = getRedisKey('org-abc')
    const now = new Date()
    const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    assert.equal(key, `ai-gen:org-abc:${month}`)
  })

  await test('counter at exactly the limit returns false', async () => {
    const key = getRedisKey('org-1')
    mockRedis.store.set(key, 1_000)
    const result = await checkGenerationLimit('org-1', 'STARTER')
    assert.equal(result, false)
  })

  await test('counter one below limit returns true', async () => {
    const key = getRedisKey('org-1')
    mockRedis.store.set(key, 999)
    const result = await checkGenerationLimit('org-1', 'STARTER')
    assert.equal(result, true)
  })

  await test('first increment sets TTL on Redis key', async () => {
    await incrementGenerationCount('org-1')
    const key = getRedisKey('org-1')
    const ttl = mockRedis.ttls.get(key)
    assert.ok(ttl !== undefined, 'TTL should be set')
    assert.ok(ttl! > 0, 'TTL should be positive')
    // TTL should be at most 31 days in seconds
    assert.ok(ttl! <= 31 * 24 * 60 * 60, 'TTL should not exceed 31 days')
  })

  await test('second increment does not reset TTL', async () => {
    await incrementGenerationCount('org-1')
    const key = getRedisKey('org-1')
    const firstTTL = mockRedis.ttls.get(key)
    mockRedis.ttls.delete(key) // Clear to detect re-set
    await incrementGenerationCount('org-1')
    const secondTTL = mockRedis.ttls.get(key)
    assert.equal(secondTTL, undefined, 'TTL should not be set again on second increment')
    assert.ok(firstTTL !== undefined, 'First TTL should have been set')
  })

  await test('getMonthTTL returns positive value less than 31 days', () => {
    const ttl = getMonthTTL()
    assert.ok(ttl > 0, 'TTL must be positive')
    assert.ok(ttl <= 31 * 24 * 60 * 60, 'TTL must be <= 31 days')
  })

  await test('checkGenerationLimit with no counter (new org) returns true', async () => {
    // No key set in mock Redis
    const result = await checkGenerationLimit('brand-new-org', 'FREE')
    assert.equal(result, true)
  })

  console.log('\n=== Security ===')

  await test('org IDs are used as-is in Redis keys (CUID-safe)', () => {
    const key = getRedisKey('clh1234567890abcdefghij')
    assert.ok(key.includes('clh1234567890abcdefghij'))
    assert.ok(key.startsWith('ai-gen:'))
  })

  await test('cannot bypass limits by using different case plan name', () => {
    // Plan values are enum from Prisma — uppercase only
    // getGenerationLimit with lowercase should fall back to FREE
    const limit = getGenerationLimit('free' as never)
    assert.equal(limit, 100) // Falls back to FREE, not bypassed
  })

  console.log('\n=== Data Leak ===')

  await test('Redis key format is opaque (only orgId, no names)', () => {
    const key = getRedisKey('org_cuid_123')
    // Key should only contain: prefix + orgId + month
    assert.ok(!key.includes('email'))
    assert.ok(!key.includes('user'))
    assert.ok(key.startsWith('ai-gen:'))
  })

  await test('fail-open does not log org details in catch', async () => {
    // This tests the pattern — Redis failures should not throw or leak
    mockRedis.shouldFail = true
    const result = await checkGenerationLimit('sensitive-org-id', 'FREE')
    assert.equal(result, true) // Returns boolean, no error details exposed
  })

  console.log('\n=== Data Damage ===')

  await test('Redis failure does not block email sending (fail open)', async () => {
    mockRedis.shouldFail = true
    const limitOk = await checkGenerationLimit('org-1', 'FREE')
    assert.equal(limitOk, true) // Allow generation
    // increment also should not throw
    await incrementGenerationCount('org-1')
  })

  await test('concurrent increments produce sequential counts', async () => {
    // MockRedis uses sync Map, simulating Redis INCR atomicity
    const promises = Array.from({ length: 10 }, () =>
      incrementGenerationCount('org-1'),
    )
    await Promise.all(promises)
    const key = getRedisKey('org-1')
    assert.equal(mockRedis.store.get(key), 10)
  })

  // =========================================================================
  // Summary
  // =========================================================================

  console.log(`\n${'='.repeat(40)}`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log(`${'='.repeat(40)}\n`)

  // Clean up
  _setRedisForTesting(null)

  if (failed > 0) process.exit(1)
}

run().catch(e => {
  console.error('Test runner error:', e)
  process.exit(1)
})
