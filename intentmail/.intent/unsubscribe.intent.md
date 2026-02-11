# One-Click Unsubscribe (RFC 8058) Specification

## 1. Overview

- **Product positioning:** Legal compliance feature — required by CAN-SPAM, GDPR, and Gmail/Yahoo sender requirements (Feb 2024+)
- **Core concept:** Every sent email includes List-Unsubscribe and List-Unsubscribe-Post headers. Recipients can one-click unsubscribe. Unsubscribed recipients are silently skipped on future sends.
- **Priority:** P0 (legal requirement, blocks production use)
- **Target user:** Email recipients (unsubscribe) and IntentMail API consumers (transparent skip)
- **Project scope:** New Prisma model + token module + unsubscribe endpoint + header injection + send-time check

## 2. Architecture

### Current State

```
sendEmail() → generateEmail() → provider.send()
                                  ↓
                          No unsubscribe headers
                          No recipient filtering
```

### Target State

```
POST /api/v1/emails/send
    ↓
sendEmail()
    ↓
Check Unsubscribe table ──→ Found? → Return success (skip silently)
    ↓ (not unsubscribed)
generateEmail()
    ↓
Build unsubscribe URL with HMAC token
    ↓
Inject List-Unsubscribe + List-Unsubscribe-Post headers
    ↓
provider.send(options + headers)
    ↓
Email delivered with one-click unsubscribe

─────────────────────────────────────

Recipient clicks unsubscribe:
    ↓
POST /api/v1/unsubscribe?token=xxx     (RFC 8058 one-click)
  or
GET /unsubscribe?token=xxx              (browser link)
    ↓
Verify HMAC token
    ↓
Insert into Unsubscribe table
    ↓
Return confirmation
```

### New Files

```
src/lib/email/unsubscribe.ts       ← Token gen/verify, check, record
src/app/api/v1/unsubscribe/route.ts ← POST (RFC 8058) + GET (browser)
src/app/unsubscribe/page.tsx        ← Browser confirmation page
```

### Modified Files

```
prisma/schema.prisma               ← Add Unsubscribe model
src/lib/email/types.ts              ← Add headers to EmailProviderSendOptions
src/lib/email/client.ts             ← Check unsub + inject headers
src/lib/email/providers/resend.ts   ← Pass headers
src/lib/email/providers/sendgrid.ts ← Pass headers
src/lib/email/providers/postmark.ts ← Pass headers
src/lib/email/providers/aws-ses.ts  ← Pass headers
```

## 3. Detailed Behavior

### 3.1 Unsubscribe Token (HMAC-SHA256)

Stateless token — no DB storage needed for validation.

```typescript
import { createHmac } from 'crypto'

function generateUnsubscribeToken(orgId: string, brandId: string, email: string): string {
  const payload = `${orgId}:${brandId}:${email}`
  const hmac = createHmac('sha256', process.env.ENCRYPTION_KEY!)
    .update(payload)
    .digest('base64url')
  // Token = base64url(payload) + '.' + hmac
  return Buffer.from(payload).toString('base64url') + '.' + hmac
}

function verifyUnsubscribeToken(token: string): { orgId: string; brandId: string; email: string } | null {
  const [payloadB64, hmac] = token.split('.')
  if (!payloadB64 || !hmac) return null
  const payload = Buffer.from(payloadB64, 'base64url').toString()
  const expected = createHmac('sha256', process.env.ENCRYPTION_KEY!)
    .update(payload)
    .digest('base64url')
  if (hmac !== expected) return null
  const [orgId, brandId, email] = payload.split(':')
  if (!orgId || !brandId || !email) return null
  return { orgId, brandId, email }
}
```

### 3.2 Unsubscribe Scope: Per-Brand

- Unsubscribing from Brand X does NOT unsubscribe from Brand Y (same org)
- DB key: `(organizationId, brandId, email)` unique constraint

### 3.3 Prisma Model

```prisma
model Unsubscribe {
  id             String   @id @default(cuid())
  organizationId String
  brandId        String
  email          String
  source         String   @default("one-click") // "one-click" | "link" | "api" | "complaint"
  unsubscribedAt DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  brand        Brand        @relation(fields: [brandId], references: [id], onDelete: Cascade)

  @@unique([organizationId, brandId, email])
  @@index([organizationId, email])
}
```

### 3.4 Email Headers (RFC 8058)

```
List-Unsubscribe: <https://app.intentmail.com/api/v1/unsubscribe?token=xxx>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

Both headers are required for RFC 8058 compliance. Gmail requires the POST header.

### 3.5 Send-Time Check

```typescript
// In sendEmail(), before generateEmail():
const isUnsubscribed = await db.unsubscribe.findUnique({
  where: {
    organizationId_brandId_email: {
      organizationId,
      brandId,
      email: to,
    },
  },
})

if (isUnsubscribed) {
  return {
    success: true, // Silent skip — caller doesn't need to know
    messageId: undefined,
    email: {} as GeneratedEmail,
  }
}
```

### 3.6 Provider Header Injection

Add `headers` to `EmailProviderSendOptions`:

```typescript
export interface EmailProviderSendOptions {
  // ...existing fields
  headers?: Record<string, string>
}
```

Each provider passes headers through their SDK:
- **Resend**: `headers` field in send options
- **SendGrid**: `headers` field in personalization
- **Postmark**: `Headers` array in send options
- **AWS SES**: `Headers` in raw message or `MessageTag`

### 3.7 Unsubscribe Endpoint

**POST /api/v1/unsubscribe** (RFC 8058 one-click):
- No authentication required (email clients send this automatically)
- Verify HMAC token
- Insert into Unsubscribe table (upsert — idempotent)
- Return 200 OK

**GET /unsubscribe** (browser confirmation page):
- Verify token
- Show simple "You've been unsubscribed" page
- Insert into Unsubscribe table on page load

### 3.8 Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid token | Return 400, do not unsubscribe |
| Already unsubscribed | Return 200 (idempotent) |
| DB error on check | Skip check, send email (fail open) |
| DB error on unsubscribe | Return 500, log error |
| Missing ENCRYPTION_KEY | Throw at startup |

## 4. Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Per-brand | Granular control, less aggressive |
| Token | HMAC-SHA256 stateless | No DB storage, instant validation, reuses ENCRYPTION_KEY |
| Block mode | Skip silently | Caller transparency, no API breaking changes |
| Headers | RFC 8058 compliant | Gmail/Yahoo requirement since Feb 2024 |
| Confirmation page | Simple server-rendered | No JS needed, works in all email clients |

## 5. MVP Scope

**In:**
- HMAC token generation/verification
- List-Unsubscribe + List-Unsubscribe-Post headers on all emails
- POST endpoint for one-click unsubscribe (RFC 8058)
- GET page for browser-based unsubscribe
- Send-time check with silent skip
- Unsubscribe model in Prisma
- All 4 providers updated to pass headers

**Out:**
- Re-subscribe mechanism
- Preference center (choose which emails to receive)
- Unsubscribe analytics/dashboard
- Bulk unsubscribe import
- Unsubscribe via API (admin endpoint)
- Custom unsubscribe page branding

## 6. Risks

| Risk | Mitigation |
|------|------------|
| Token brute force | HMAC-SHA256 with 256-bit key is computationally infeasible |
| Replay attacks | Idempotent — replaying an unsubscribe does nothing harmful |
| Email enumeration | Token doesn't reveal email without ENCRYPTION_KEY |
| DB failure on check | Fail open — send email rather than block |
| Schema migration | additive only — no data loss |
