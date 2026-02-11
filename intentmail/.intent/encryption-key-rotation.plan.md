# Execution Plan: encryption-key-rotation

## Overview

Add key chain support to AES-256-GCM encryption so ENCRYPTION_KEY can be rotated without data loss. No schema migration needed — try keys in order, re-encrypt lazily on read.

## Prerequisites

- `src/lib/encryption.ts` exists with current encrypt/decrypt
- `src/lib/email/client.ts` calls decrypt at line 299
- No DB changes needed (CRITIQUE: version column dropped)

## Phase 0: Core Encryption Module

### Description

Update `src/lib/encryption.ts` to support a key chain (current + old keys) and add `decryptWithRotation()`. Existing `encrypt()` and `decrypt()` signatures stay backward-compatible.

### Tests

#### Happy Path
- [ ] encrypt/decrypt roundtrip works with single key (existing behavior)
- [ ] decrypt succeeds with current key when no old keys configured
- [ ] decrypt falls back to old key when current key fails
- [ ] decryptWithRotation returns `rotated: false` when current key works
- [ ] decryptWithRotation returns `rotated: true` with new ciphertext when old key used
- [ ] re-encrypted data decrypts correctly with current key

#### Bad Path
- [ ] decrypt throws when no key succeeds
- [ ] decrypt throws when encrypted data is corrupted
- [ ] decrypt throws when IV is corrupted
- [ ] encrypt throws when ENCRYPTION_KEY is missing
- [ ] decrypt handles empty encrypted string gracefully
- [ ] decrypt handles empty IV string gracefully

#### Edge Cases
- [ ] works with no ENCRYPTION_KEYS_OLD set (single key, no rotation)
- [ ] works with multiple old keys (3+ in chain)
- [ ] works with empty ENCRYPTION_KEYS_OLD string
- [ ] handles ENCRYPTION_KEYS_OLD with trailing comma
- [ ] re-encryption produces different ciphertext (new random IV) but same plaintext

#### Security
- [ ] old keys are not exposed in error messages
- [ ] GCM auth tag prevents silent decryption with wrong key (no corrupted plaintext)
- [ ] key derivation uses SHA-256 consistently for all keys in chain

#### Data Leak
- [ ] error messages don't contain key material
- [ ] error messages don't contain plaintext on partial decrypt
- [ ] decryptWithRotation doesn't log sensitive data

#### Data Damage
- [ ] failed decrypt doesn't modify any state
- [ ] decryptWithRotation returns original ciphertext unchanged if current key works
- [ ] concurrent calls to decryptWithRotation are safe (stateless function)

### E2E Gate

```bash
# Run encryption tests
cd /Users/robroyhobbs/work/intentmail && npx vitest run src/lib/encryption --reporter=verbose 2>&1 || echo "No test file yet — create during implementation"
```

### Acceptance Criteria

- [ ] All 6 test categories pass
- [ ] encrypt() signature unchanged: `(text) => { encrypted, iv }`
- [ ] decrypt() signature unchanged: `(encrypted, iv) => string`
- [ ] new decryptWithRotation() function exported
- [ ] getKeyChain() reads ENCRYPTION_KEY + ENCRYPTION_KEYS_OLD

---

## Phase 1: Caller Integration + Config

### Description

Wire `decryptWithRotation()` into the email send path (`client.ts`) so provider credentials are lazily re-encrypted. Update `.env.example` with new variable.

### Tests

#### Happy Path
- [ ] email send works when provider credential is on current key
- [ ] email send works when provider credential is on old key (and re-encrypts)
- [ ] after re-encryption, subsequent sends use current key directly

#### Bad Path
- [ ] email send fails gracefully when all keys fail to decrypt provider credential
- [ ] re-encryption DB update failure doesn't block email send (send still works)

#### Edge Cases
- [ ] concurrent email sends for same provider during rotation (both try re-encrypt)
- [ ] provider with no encrypted key (shouldn't happen but defensive)

#### Security
- [ ] decrypted API key is not logged during re-encryption
- [ ] re-encrypted value is written atomically (Prisma update)

#### Data Leak
- [ ] error response for failed decrypt doesn't mention key rotation
- [ ] console.error doesn't log the provider API key

#### Data Damage
- [ ] if re-encrypt write fails, original ciphertext is unchanged in DB
- [ ] email send completes even if re-encrypt save fails (non-blocking)

### E2E Gate

```bash
# Build passes
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -5

# Verify .env.example has new var
grep "ENCRYPTION_KEYS_OLD" /Users/robroyhobbs/work/intentmail/.env.example
```

### Acceptance Criteria

- [ ] client.ts uses decryptWithRotation instead of decrypt
- [ ] lazy re-encryption updates DB on old-key decrypt
- [ ] re-encryption failure is non-blocking (email still sends)
- [ ] .env.example documents ENCRYPTION_KEYS_OLD
- [ ] build passes

---

## Final E2E Verification

```bash
# Full build
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -10

# Encryption tests
cd /Users/robroyhobbs/work/intentmail && npx vitest run src/lib/encryption --reporter=verbose 2>&1
```

## Risk Mitigation

| Risk | Mitigation | Contingency |
|------|------------|-------------|
| GCM auth tag false positive | Cryptographically impossible — GCM guarantees authenticity | N/A |
| Re-encrypt write fails mid-send | Make re-encrypt non-blocking (try/catch, don't await in critical path) | Provider stays on old key, re-encrypts next time |
| Multiple old keys slow down decrypt | Max realistic keys: 3-4, each GCM attempt is µs | Not a concern until 100+ keys |

## References

- [Intent](./encryption-key-rotation.intent.md)
- [Overview](./encryption-key-rotation.overview.md)
