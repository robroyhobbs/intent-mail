# Execution Plan: webhooks

## Overview

Add webhook endpoints for Resend, SendGrid, and Postmark. Signature verification, event normalization, EmailLog status updates, complaint auto-unsubscribe. Inline per-route design (no separate normalizer abstraction).

## Prerequisites

- Email client with working send pipeline and EmailLog model
- WebhookEvent model in Prisma (already exists)
- Unsubscribe module for complaint auto-unsubscribe
- All 3 providers implemented (Resend, SendGrid, Postmark)

---

## Phase 0: Shared Types + Event Processor

### Description

Create `src/lib/email/webhooks/types.ts` with normalized event types and `src/lib/email/webhooks/processor.ts` that takes a normalized event, stores it in WebhookEvent, updates EmailLog, and auto-unsubscribes on complaints.

### Tests

#### Happy Path
- [x] processWebhookEvent stores raw event in WebhookEvent table
- [x] processWebhookEvent updates EmailLog status to DELIVERED
- [x] processWebhookEvent updates EmailLog status to BOUNCED with bouncedAt
- [x] processWebhookEvent updates EmailLog status to COMPLAINED with complainedAt
- [x] processWebhookEvent updates EmailLog status to OPENED with openedAt
- [x] processWebhookEvent updates EmailLog status to CLICKED with clickedAt
- [x] complaint event triggers recordUnsubscribe with source "complaint"

#### Bad Path
- [x] unknown providerMessageId stores event but skips EmailLog update
- [x] DB error on WebhookEvent create returns error
- [x] DB error on EmailLog update does not prevent WebhookEvent storage
- [x] invalid eventType is ignored gracefully

#### Edge Cases
- [x] duplicate event is idempotent (timestamps only set if null)
- [x] deferred event stores in WebhookEvent but no EmailLog status change
- [x] complaint on email with no brandId skips auto-unsubscribe gracefully
- [x] status only advances forward (OPENED cannot regress to DELIVERED)

#### Security
- [x] processor does not expose internal error details in return value
- [x] raw payload stored as-is for forensics

#### Data Leak
- [x] processWebhookEvent does not log recipient email addresses
- [x] error returns do not include payload details

#### Data Damage
- [x] concurrent events for same messageId don't corrupt EmailLog
- [x] complaint auto-unsubscribe failure does not prevent event storage

### E2E Gate

```bash
cd /Users/robroyhobbs/work/intentmail && npx vitest run src/lib/email/webhooks/processor.test.ts
```

### Acceptance Criteria

- [x] All 6 test categories pass
- [x] `src/lib/email/webhooks/types.ts` exports NormalizedWebhookEvent and WebhookEventType
- [x] `src/lib/email/webhooks/processor.ts` exports processWebhookEvent
- [x] Complaint events trigger auto-unsubscribe
- [x] Forward-only status progression enforced

---

## Phase 1: Webhook Route Handlers (Resend, SendGrid, Postmark)

### Description

Create webhook endpoint for each provider at `/api/webhooks/{provider}`. Each route: reads raw body, verifies signature, parses and normalizes events inline, calls processWebhookEvent.

### Tests

#### Happy Path
- [x] Resend: valid svix signature passes verification
- [x] Resend: email.delivered event normalizes correctly
- [x] Resend: email.bounced event normalizes correctly
- [x] SendGrid: valid signature passes verification
- [x] SendGrid: delivered event normalizes correctly
- [x] SendGrid: bounce event normalizes correctly
- [x] Postmark: valid webhook token passes verification
- [x] Postmark: Delivery event normalizes correctly
- [x] Postmark: Bounce event normalizes correctly

#### Bad Path
- [x] Resend: invalid svix signature returns 401
- [x] Resend: missing signature headers returns 401
- [x] SendGrid: invalid signature returns 401
- [x] SendGrid: missing signature header returns 401
- [x] Postmark: wrong webhook token returns 401
- [x] Postmark: missing token returns 401
- [x] All: malformed JSON body returns 400
- [x] All: empty body returns 400

#### Edge Cases
- [x] Resend: batch of multiple events processes all
- [x] SendGrid: array of events processes all
- [x] Postmark: single event (not array) processes correctly
- [x] Provider sends event for unknown messageId — stores but doesn't crash

#### Security
- [x] Webhook secrets loaded from provider config, not hardcoded
- [x] Raw body preserved for signature verification (not re-serialized)
- [x] 401 response does not reveal expected signature

#### Data Leak
- [x] Error responses do not include webhook secrets
- [x] Error responses do not include provider config details

#### Data Damage
- [x] Signature verification failure does not process any events
- [x] Partial batch failure does not prevent other events from processing

### E2E Gate

```bash
# TypeScript compiles
cd /Users/robroyhobbs/work/intentmail && npx tsc --noEmit

# Build passes
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -5

# All tests pass
cd /Users/robroyhobbs/work/intentmail && npx vitest run src/lib/email/webhooks/
```

### Acceptance Criteria

- [x] All 6 test categories pass
- [x] POST /api/webhooks/resend processes Resend webhook events
- [x] POST /api/webhooks/sendgrid processes SendGrid webhook events
- [x] POST /api/webhooks/postmark processes Postmark webhook events
- [x] All routes verify signatures before processing
- [x] Production build passes

---

## Final E2E Verification

```bash
# Full build
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -10

# All webhook tests pass
cd /Users/robroyhobbs/work/intentmail && npx vitest run src/lib/email/webhooks/
```

## Risk Mitigation

| Risk | Mitigation | Contingency |
|------|------------|-------------|
| Provider webhook format changes | Raw event stored | Manual replay from WebhookEvent |
| Svix library dependency | Use crypto directly for HMAC | Svix is well-maintained |
| High event volume | Process synchronously for now | Add queue if needed |
| Missing webhook secret | Fail closed (401) | Log warning for operator |

## References

- [Intent](./webhooks.intent.md)
