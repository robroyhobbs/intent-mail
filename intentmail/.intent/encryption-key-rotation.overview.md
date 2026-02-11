# Encryption Key Rotation: Versioned key support for AES-256-GCM credentials

## One sentence

Add key versioning so ENCRYPTION_KEY can be rotated without losing access to existing encrypted provider API keys.

## Why?

If the current `ENCRYPTION_KEY` env var changes (compromised, rotated per policy, or lost), all stored email provider credentials become permanently unrecoverable. There's no way to transition.

## Core experience

```
Operator rotates key:
  1. Move old ENCRYPTION_KEY to ENCRYPTION_KEYS_OLD
  2. Set new ENCRYPTION_KEY
  3. Deploy — zero downtime, zero migration

On next API call using a provider:
  decrypt(ciphertext, iv, keyVersion=1) → tries current key → fails
                                        → tries old key → succeeds
                                        → re-encrypts with current key → saves
                                        → returns plaintext

All future reads use new key automatically.
```

## Architecture

```
src/lib/encryption.ts
├── getKeyChain()            ← reads ENCRYPTION_KEY + ENCRYPTION_KEYS_OLD
├── encrypt(text)            ← always uses current key, returns keyVersion
├── decrypt(enc, iv, ver)    ← tries current, falls back to old keys
└── decryptWithRotation()    ← decrypt + re-encrypt if old key used

prisma/schema.prisma
└── EmailProvider
    └── encryptionKeyVersion Int @default(1)   ← NEW

Callers (3 files):
├── api/v1/providers/route.ts         ← store version on create
├── api/v1/providers/[id]/route.ts    ← store version on update, re-encrypt on read
└── lib/email/client.ts               ← re-encrypt on read during send
```

## Key decisions

| Question | Choice | Why |
|----------|--------|-----|
| Re-encrypt when? | Lazy on read | Zero downtime, self-healing, no migration script |
| Old keys where? | ENCRYPTION_KEYS_OLD env | Simple, universal, no infra |
| Version where? | DB column | Queryable, clean |
| Default version? | 1 | Existing records just work |

## Scope

**In:** Key chain, versioned encrypt/decrypt, lazy re-encrypt, schema migration, caller updates
**Out:** Batch CLI, dashboard UI, KMS/HSM, auto-rotation scheduling

## Next steps

1. `/intent-critique` — check for over-engineering
2. `/intent-plan` — phased TDD execution
3. `/intent-build-now` — implement
4. `/intent-sync` — sync back
