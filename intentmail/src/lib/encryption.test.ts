/**
 * Encryption key rotation tests
 * Run: npx tsx src/lib/encryption.test.ts
 */
import { strict as assert } from 'node:assert'

// Store original env to restore after each test
const originalEnv = { ...process.env }

function resetEnv() {
  delete process.env.ENCRYPTION_KEY
  delete process.env.ENCRYPTION_KEYS_OLD
}

function restoreEnv() {
  Object.assign(process.env, originalEnv)
  if (!originalEnv.ENCRYPTION_KEYS_OLD) delete process.env.ENCRYPTION_KEYS_OLD
}

// Dynamic import to pick up env changes
async function loadModule() {
  // We need to re-import each time since getKeyChain reads env on each call
  const mod = await import('./encryption')
  return mod
}

let passed = 0
let failed = 0

async function test(name: string, fn: () => Promise<void>) {
  resetEnv()
  try {
    await fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (e: unknown) {
    failed++
    const msg = e instanceof Error ? e.message : String(e)
    console.log(`  ✗ ${name}`)
    console.log(`    ${msg}`)
  } finally {
    restoreEnv()
  }
}

async function run() {
  const { encrypt, decrypt, decryptWithRotation } = await loadModule()

  console.log('\n=== Happy Path ===')

  await test('encrypt/decrypt roundtrip with single key', async () => {
    process.env.ENCRYPTION_KEY = 'test-key-alpha'
    const { encrypted, iv } = encrypt('hello world')
    const result = decrypt(encrypted, iv)
    assert.equal(result, 'hello world')
  })

  await test('decrypt succeeds with current key when no old keys', async () => {
    process.env.ENCRYPTION_KEY = 'test-key-beta'
    const { encrypted, iv } = encrypt('secret data')
    const result = decrypt(encrypted, iv)
    assert.equal(result, 'secret data')
  })

  await test('decrypt falls back to old key when current key fails', async () => {
    // Encrypt with key-1
    process.env.ENCRYPTION_KEY = 'key-1'
    const { encrypted, iv } = encrypt('my secret')

    // Rotate: key-2 is current, key-1 is old
    process.env.ENCRYPTION_KEY = 'key-2'
    process.env.ENCRYPTION_KEYS_OLD = 'key-1'

    const result = decrypt(encrypted, iv)
    assert.equal(result, 'my secret')
  })

  await test('decryptWithRotation returns rotated:false when current key works', async () => {
    process.env.ENCRYPTION_KEY = 'current-key'
    const { encrypted, iv } = encrypt('data')
    const result = decryptWithRotation(encrypted, iv)
    assert.equal(result.rotated, false)
    assert.equal(result.decrypted, 'data')
  })

  await test('decryptWithRotation returns rotated:true with new ciphertext when old key used', async () => {
    // Encrypt with old key
    process.env.ENCRYPTION_KEY = 'old-key'
    const { encrypted, iv } = encrypt('rotate me')

    // Rotate keys
    process.env.ENCRYPTION_KEY = 'new-key'
    process.env.ENCRYPTION_KEYS_OLD = 'old-key'

    const result = decryptWithRotation(encrypted, iv)
    assert.equal(result.rotated, true)
    assert.equal(result.decrypted, 'rotate me')
    assert.ok('newEncrypted' in result && result.newEncrypted)
    assert.ok('newIv' in result && result.newIv)
  })

  await test('re-encrypted data decrypts correctly with current key', async () => {
    // Encrypt with old key
    process.env.ENCRYPTION_KEY = 'old-key'
    const { encrypted, iv } = encrypt('important data')

    // Rotate keys
    process.env.ENCRYPTION_KEY = 'new-key'
    process.env.ENCRYPTION_KEYS_OLD = 'old-key'

    const result = decryptWithRotation(encrypted, iv)
    assert.equal(result.rotated, true)

    if (result.rotated) {
      // Remove old keys — only current key available
      delete process.env.ENCRYPTION_KEYS_OLD
      const decrypted = decrypt(result.newEncrypted, result.newIv)
      assert.equal(decrypted, 'important data')
    }
  })

  console.log('\n=== Bad Path ===')

  await test('decrypt throws when no key succeeds', async () => {
    process.env.ENCRYPTION_KEY = 'key-A'
    const { encrypted, iv } = encrypt('data')

    process.env.ENCRYPTION_KEY = 'key-B'
    delete process.env.ENCRYPTION_KEYS_OLD

    assert.throws(() => decrypt(encrypted, iv), /no valid key found/)
  })

  await test('decrypt throws when encrypted data is corrupted', async () => {
    process.env.ENCRYPTION_KEY = 'test-key'
    const { iv } = encrypt('data')
    assert.throws(() => decrypt('deadbeef' + '0'.repeat(32), iv), /no valid key found/)
  })

  await test('decrypt throws when IV is corrupted', async () => {
    process.env.ENCRYPTION_KEY = 'test-key'
    const { encrypted } = encrypt('data')
    assert.throws(() => decrypt(encrypted, '00'.repeat(16)), /no valid key found/)
  })

  await test('encrypt throws when ENCRYPTION_KEY is missing', async () => {
    delete process.env.ENCRYPTION_KEY
    assert.throws(() => encrypt('data'), /ENCRYPTION_KEY environment variable is required/)
  })

  await test('decrypt handles empty encrypted string', async () => {
    process.env.ENCRYPTION_KEY = 'test-key'
    assert.throws(() => decrypt('', '00'.repeat(16)), /no valid key found/)
  })

  await test('decrypt handles empty IV string', async () => {
    process.env.ENCRYPTION_KEY = 'test-key'
    const { encrypted } = encrypt('data')
    assert.throws(() => decrypt(encrypted, ''), /no valid key found/)
  })

  console.log('\n=== Edge Cases ===')

  await test('works with no ENCRYPTION_KEYS_OLD set', async () => {
    process.env.ENCRYPTION_KEY = 'only-key'
    delete process.env.ENCRYPTION_KEYS_OLD
    const { encrypted, iv } = encrypt('solo key')
    assert.equal(decrypt(encrypted, iv), 'solo key')
  })

  await test('works with multiple old keys (3+ in chain)', async () => {
    process.env.ENCRYPTION_KEY = 'key-v1'
    const { encrypted, iv } = encrypt('old data')

    process.env.ENCRYPTION_KEY = 'key-v4'
    process.env.ENCRYPTION_KEYS_OLD = 'key-v3,key-v2,key-v1'

    assert.equal(decrypt(encrypted, iv), 'old data')
  })

  await test('works with empty ENCRYPTION_KEYS_OLD string', async () => {
    process.env.ENCRYPTION_KEY = 'my-key'
    process.env.ENCRYPTION_KEYS_OLD = ''
    const { encrypted, iv } = encrypt('test')
    assert.equal(decrypt(encrypted, iv), 'test')
  })

  await test('handles ENCRYPTION_KEYS_OLD with trailing comma', async () => {
    process.env.ENCRYPTION_KEY = 'key-v1'
    const { encrypted, iv } = encrypt('trailing comma')

    process.env.ENCRYPTION_KEY = 'key-v2'
    process.env.ENCRYPTION_KEYS_OLD = 'key-v1,'

    assert.equal(decrypt(encrypted, iv), 'trailing comma')
  })

  await test('re-encryption produces different ciphertext but same plaintext', async () => {
    process.env.ENCRYPTION_KEY = 'old'
    const { encrypted: e1, iv: iv1 } = encrypt('same text')

    process.env.ENCRYPTION_KEY = 'new'
    process.env.ENCRYPTION_KEYS_OLD = 'old'
    const result = decryptWithRotation(e1, iv1)

    assert.equal(result.rotated, true)
    if (result.rotated) {
      // New ciphertext should differ (random IV)
      assert.notEqual(result.newEncrypted, e1)
      assert.notEqual(result.newIv, iv1)

      // But plaintext matches
      delete process.env.ENCRYPTION_KEYS_OLD
      assert.equal(decrypt(result.newEncrypted, result.newIv), 'same text')
    }
  })

  console.log('\n=== Security ===')

  await test('GCM auth tag prevents silent decryption with wrong key', async () => {
    process.env.ENCRYPTION_KEY = 'correct-key'
    const { encrypted, iv } = encrypt('sensitive')

    process.env.ENCRYPTION_KEY = 'wrong-key'
    delete process.env.ENCRYPTION_KEYS_OLD

    // Should throw, not return corrupted data
    assert.throws(() => decrypt(encrypted, iv), /no valid key found/)
  })

  await test('key derivation uses SHA-256 consistently', async () => {
    // Same key string should produce same encryption behavior
    process.env.ENCRYPTION_KEY = 'deterministic-key'
    const { encrypted, iv } = encrypt('test')

    // Re-import won't matter — same env = same derived key
    assert.equal(decrypt(encrypted, iv), 'test')
  })

  console.log('\n=== Data Leak ===')

  await test('error messages do not contain key material', async () => {
    process.env.ENCRYPTION_KEY = 'super-secret-key-12345'
    const { encrypted, iv } = encrypt('data')

    process.env.ENCRYPTION_KEY = 'different-key'
    try {
      decrypt(encrypted, iv)
      assert.fail('Should have thrown')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      assert.ok(!msg.includes('super-secret'), 'Error should not contain key')
      assert.ok(!msg.includes('different-key'), 'Error should not contain key')
    }
  })

  await test('error messages do not contain plaintext', async () => {
    process.env.ENCRYPTION_KEY = 'key-x'
    const { encrypted, iv } = encrypt('my-password-123')

    process.env.ENCRYPTION_KEY = 'key-y'
    try {
      decrypt(encrypted, iv)
      assert.fail('Should have thrown')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      assert.ok(!msg.includes('my-password-123'), 'Error should not contain plaintext')
    }
  })

  console.log('\n=== Data Damage ===')

  await test('failed decrypt does not modify any state', async () => {
    process.env.ENCRYPTION_KEY = 'key-a'
    const { encrypted, iv } = encrypt('original')

    process.env.ENCRYPTION_KEY = 'key-b'
    try { decrypt(encrypted, iv) } catch { /* expected */ }

    // Original data still works with original key
    process.env.ENCRYPTION_KEY = 'key-a'
    assert.equal(decrypt(encrypted, iv), 'original')
  })

  await test('decryptWithRotation returns original ciphertext unchanged if current key works', async () => {
    process.env.ENCRYPTION_KEY = 'current'
    const { encrypted, iv } = encrypt('keep same')
    const result = decryptWithRotation(encrypted, iv)

    assert.equal(result.rotated, false)
    assert.equal(result.decrypted, 'keep same')
    // No newEncrypted/newIv properties
    assert.ok(!('newEncrypted' in result))
  })

  await test('concurrent decryptWithRotation calls are safe (stateless)', async () => {
    process.env.ENCRYPTION_KEY = 'old'
    const { encrypted, iv } = encrypt('concurrent test')

    process.env.ENCRYPTION_KEY = 'new'
    process.env.ENCRYPTION_KEYS_OLD = 'old'

    // Run multiple concurrent calls
    const results = await Promise.all([
      Promise.resolve(decryptWithRotation(encrypted, iv)),
      Promise.resolve(decryptWithRotation(encrypted, iv)),
      Promise.resolve(decryptWithRotation(encrypted, iv)),
    ])

    for (const r of results) {
      assert.equal(r.decrypted, 'concurrent test')
      assert.equal(r.rotated, true)
    }
  })

  // Summary
  console.log(`\n${'='.repeat(40)}`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log(`${'='.repeat(40)}\n`)

  if (failed > 0) process.exit(1)
}

run().catch(e => {
  console.error('Test runner error:', e)
  process.exit(1)
})
