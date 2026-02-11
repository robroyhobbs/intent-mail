# Execution Plan: unsubscribe

## Overview

Add RFC 8058 one-click unsubscribe to IntentMail. HMAC-signed tokens, per-brand scope, silent skip on send, List-Unsubscribe headers on all emails.

## Prerequisites

- Email client (`src/lib/email/client.ts`) with working send pipeline
- Encryption module with `ENCRYPTION_KEY` env var
- All 4 email providers implemented (Resend, SendGrid, Postmark, AWS SES)
- Prisma schema with Organization and Brand models

---

## Phase 0: Token Module + Prisma Model + Unsubscribe Endpoint

### Description

Create `src/lib/email/unsubscribe.ts` with HMAC token generation/verification and DB operations. Add Unsubscribe model to Prisma. Create the API endpoint for one-click unsubscribe (POST) and browser confirmation page (GET with confirm button).

### Tests

#### Happy Path

- [x] generateUnsubscribeToken produces a token with payload and HMAC
- [x] verifyUnsubscribeToken returns correct orgId, brandId, email
- [x] roundtrip: generate then verify returns original data
- [x] recordUnsubscribe inserts into DB (mock)
- [x] isUnsubscribed returns true for unsubscribed email
- [x] isUnsubscribed returns false for non-unsubscribed email
- [x] POST /api/v1/unsubscribe with valid token returns 200
- [x] GET /unsubscribe with valid token renders confirmation page

#### Bad Path

- [x] verifyUnsubscribeToken returns null for tampered HMAC
- [x] verifyUnsubscribeToken returns null for empty string
- [x] verifyUnsubscribeToken returns null for missing dot separator
- [x] verifyUnsubscribeToken returns null for truncated payload
- [x] verifyUnsubscribeToken returns null for payload with wrong field count
- [x] POST /api/v1/unsubscribe with invalid token returns 400
- [x] POST /api/v1/unsubscribe with missing token returns 400
- [x] recordUnsubscribe handles DB error gracefully

#### Edge Cases

- [x] POST with already-unsubscribed email returns 200 (idempotent)
- [x] token with email containing special chars (+ . @) works correctly
- [x] token with very long email address (254 chars) works
- [x] generateUnsubscribeToken with colon in brandId still parses correctly
- [x] buildUnsubscribeUrl uses APP_URL env var for domain

#### Security

- [x] token cannot be forged without ENCRYPTION_KEY
- [x] token does not reveal email when ENCRYPTION_KEY is unknown
- [x] POST endpoint requires no authentication (email clients send automatically)
- [x] HMAC uses timing-safe comparison to prevent timing attacks

#### Data Leak

- [x] error response for invalid token does not include expected HMAC
- [x] error response does not reveal whether email exists in system
- [x] unsubscribe confirmation page does not display full email address

#### Data Damage

- [x] concurrent unsubscribe requests for same email don't cause duplicate rows (upsert)
- [x] DB failure on recordUnsubscribe does not crash endpoint (returns 500)

### E2E Gate

```bash
cd /Users/robroyhobbs/work/intentmail && npx tsx src/lib/email/unsubscribe.test.ts
```

### Acceptance Criteria

- [x] All 6 test categories pass
- [x] `src/lib/email/unsubscribe.ts` exports: generateUnsubscribeToken, verifyUnsubscribeToken, isUnsubscribed, recordUnsubscribe, buildUnsubscribeUrl
- [x] Prisma schema has Unsubscribe model with unique constraint
- [x] POST /api/v1/unsubscribe handles RFC 8058 one-click
- [x] GET /unsubscribe shows confirmation page with POST button

---

## Phase 1: Wire into Email Client + Provider Headers

### Description

Add `headers` field to `EmailProviderSendOptions`. Update all 4 providers to pass custom headers. In `sendEmail()`, check unsubscribe status before sending (skip silently) and inject List-Unsubscribe headers into every email.

### Tests

#### Happy Path

- [x] sendEmail injects List-Unsubscribe header with valid token URL
- [x] sendEmail injects List-Unsubscribe-Post header
- [x] sendEmail skips delivery for unsubscribed recipient (returns success)
- [x] sendEmail delivers normally for non-unsubscribed recipient
- [x] Resend provider passes headers through to API
- [x] SendGrid provider passes headers through to API
- [x] Postmark provider passes headers through to API
- [x] AWS SES provider passes headers through to API

#### Bad Path

- [x] sendEmail sends email even if unsubscribe check DB fails (fail open)
- [x] missing NEXT_PUBLIC_APP_URL falls back to reasonable default for unsub URL
- [x] provider handles undefined headers gracefully (no crash)

#### Edge Cases

- [x] unsubscribed from Brand A can still receive Brand B emails
- [x] silent skip returns success:true with no messageId
- [x] headers field is optional in EmailProviderSendOptions (backward compatible)

#### Security

- [x] unsubscribe URL in header uses HTTPS
- [x] headers cannot be overridden by caller (injected by system)
- [x] API key for email provider is separate from ENCRYPTION_KEY for tokens

#### Data Leak

- [x] silent skip does not log that recipient was unsubscribed
- [x] unsubscribe token in header does not expose raw email

#### Data Damage

- [x] unsubscribe check failure does not prevent email delivery
- [x] adding headers does not affect existing email content

### E2E Gate

```bash
# TypeScript compiles
cd /Users/robroyhobbs/work/intentmail && npx tsc --noEmit

# Build passes
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -5

# All tests pass
cd /Users/robroyhobbs/work/intentmail && npx tsx src/lib/email/unsubscribe.test.ts
```

### Acceptance Criteria

- [x] All 6 test categories pass
- [x] `EmailProviderSendOptions` has optional `headers` field
- [x] All 4 providers pass headers to their respective SDKs
- [x] `sendEmail` checks unsubscribe before generating email
- [x] `sendEmail` injects List-Unsubscribe and List-Unsubscribe-Post headers
- [x] Production build passes

---

## Final E2E Verification

```bash
# Full build
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -10

# All test files pass
cd /Users/robroyhobbs/work/intentmail && npx tsx src/lib/email/unsubscribe.test.ts
```

## Risk Mitigation

| Risk                           | Mitigation                                                 | Contingency                                      |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------------ |
| HMAC key rotation              | Reuses ENCRYPTION_KEY which already has rotation support   | Old tokens still work via key chain              |
| Provider header support varies | Each provider SDK tested individually                      | Fallback: skip headers for unsupported providers |
| DB migration on production     | Additive only (new table), no data loss                    | Rollback: drop table                             |
| Email client link prefetchers  | GET page shows confirm button (POST), not auto-unsubscribe | Safe from bots                                   |

## References

- [Intent](./unsubscribe.intent.md)
