# Encryption Key Rotation Specification

## 1. Overview

- **Product positioning:** Security hardening for IntentMail's credential encryption
- **Core concept:** Add key versioning to AES-256-GCM encryption so `ENCRYPTION_KEY` can be rotated without losing access to existing encrypted provider credentials
- **Priority:** P0 (security)
- **Target user:** Platform operator (self or DevOps)
- **Project scope:** Single module (`src/lib/encryption.ts`) + 1 schema migration + update callers

## 2. Architecture

### Current State

```
ENCRYPTION_KEY (env) → SHA-256 → 32-byte key
                                      ↓
              encrypt(text) → { encrypted: hex+authTag, iv: hex }
              decrypt(encrypted, iv) → text
```

Only `EmailProvider.apiKeyEncrypted` + `EmailProvider.apiKeyIv` use encryption.

### Target State

```
ENCRYPTION_KEY (env)      → current key (version N)
ENCRYPTION_KEYS_OLD (env) → "key1,key2" (versions N-1, N-2, ...)

encrypt(text) → { encrypted, iv, keyVersion: N }
decrypt(encrypted, iv, keyVersion) →
  1. Try current key if keyVersion matches
  2. Try old keys in order
  3. On success with old key → re-encrypt with current key, return { decrypted, reEncrypted }
```

### Schema Change

None. No DB migration needed. <!-- CRITIQUE: dropped encryptionKeyVersion column — try keys in order instead, GCM auth tag validates instantly -->

## 3. Detailed Behavior

### Key Resolution

```typescript
// Environment
ENCRYPTION_KEY = "current-secret-key";
ENCRYPTION_KEYS_OLD = "previous-key,original-key"; // optional

// Key chain (ordered: current first, then old)
keys = [deriveKey(ENCRYPTION_KEY), ...oldKeys.map((k) => deriveKey(k))];
```

<!-- CRITIQUE: removed ENCRYPTION_KEY_VERSION env var — auto-derived, not needed -->
<!-- CRITIQUE: removed version numbers from key chain — just ordered array, try in sequence -->

When you rotate:

1. Move current `ENCRYPTION_KEY` value to start of `ENCRYPTION_KEYS_OLD`
2. Set new `ENCRYPTION_KEY`
3. Deploy — that's it

### Encrypt (always uses current key)

```typescript
export function encrypt(text: string): { encrypted: string; iv: string };
```

- Uses first key in chain (current) only
- Signature unchanged from existing code

### Decrypt (tries current, falls back to old)

```typescript
export function decrypt(encrypted: string, iv: string): string;
```

- Tries current key first
- If GCM auth tag fails → tries old keys in order
- Returns plaintext on first success
- Throws if no key succeeds
- Signature unchanged from existing code (backward compatible)

### Lazy Re-encryption

New function for callers that need transparent rotation:

```typescript
export function decryptWithRotation(
  encrypted: string,
  iv: string,
):
  | { decrypted: string; rotated: false }
  | { decrypted: string; rotated: true; newEncrypted: string; newIv: string };
```

```typescript
// In provider routes / email client
const result = decryptWithRotation(provider.apiKeyEncrypted, provider.apiKeyIv);
if (result.rotated) {
  await prisma.emailProvider.update({
    where: { id: provider.id },
    data: {
      apiKeyEncrypted: result.newEncrypted,
      apiKeyIv: result.newIv,
    },
  });
}
```

### Error Handling

- All keys fail → throw `EncryptionError('Failed to decrypt: no valid key found')`
- Missing `ENCRYPTION_KEY` → throw on startup (existing behavior)
- Missing `ENCRYPTION_KEYS_OLD` → fine, only current key available (no rotation history)

## 4. Files to Modify

| File                                     | Change                                                     |
| ---------------------------------------- | ---------------------------------------------------------- |
| `src/lib/encryption.ts`                  | Add key chain, `decryptWithRotation()`                     |
| `src/app/api/v1/providers/[id]/route.ts` | Lazy re-encrypt on GET                                     |
| `src/lib/email/client.ts`                | Lazy re-encrypt when reading provider credentials for send |
| `.env.example`                           | Add `ENCRYPTION_KEYS_OLD`                                  |

## 5. Decisions Summary

| Decision               | Choice                                        | Rationale                                                                     |
| ---------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| Re-encryption strategy | Lazy on read                                  | Zero downtime, no migration script, self-healing                              |
| Old key storage        | `ENCRYPTION_KEYS_OLD` comma-separated env var | Simple, works everywhere, no infra change                                     |
| Version tracking       | None — try keys in order                      | CRITIQUE: GCM auth tag validates instantly, 2-3 keys max, no DB column needed |
| Key derivation         | Keep SHA-256                                  | Consistent with existing, env var is raw key material not password            |

## 6. MVP Scope

**In:**

- Key chain from environment variables (`ENCRYPTION_KEY` + `ENCRYPTION_KEYS_OLD`)
- `decrypt()` tries keys in order, GCM auth tag validates
- `decryptWithRotation()` for lazy re-encrypt on read
- Update callers (2 files: providers route + email client)

**Out:**

- Batch migration CLI
- Key rotation UI in dashboard
- HSM/KMS integration
- Automatic key rotation scheduling
- Key rotation for non-provider fields (none exist currently)

## 7. Risks

| Risk                                | Mitigation                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| Lost ENCRYPTION_KEY before rotation | Document: backup key before rotating. No code fix for this.                                     |
| Race condition during re-encrypt    | Prisma update is atomic per row. Worst case: two concurrent reads both re-encrypt (idempotent). |
