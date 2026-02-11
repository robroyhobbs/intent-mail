# Email Scheduling/Queue Specification

## 1. Overview

- **Product positioning:** Deferred email delivery with full lifecycle management
- **Core concept:** Use Upstash QStash as a serverless queue to schedule emails for future delivery. Emails are enqueued with a target timestamp; QStash calls back to a dedicated endpoint at the scheduled time to perform the actual send. Users can cancel or reschedule pending emails via API and dashboard.
- **Priority:** P2 (enhances existing send pipeline, not blocking)
- **Target user:** API consumers scheduling campaigns, dashboard users managing pending emails
- **Project scope:** QStash integration + scheduled send endpoint + cancel/reschedule API + dashboard UI for pending emails

## 2. Architecture

### Current State

```
POST /api/v1/emails/send { scheduledFor: "..." }
         ↓
client.ts → provider.send({ scheduledAt })
         ↓
Provider handles timing (if supported)
No cancel/reschedule, no visibility
```

### Target State

```
POST /api/v1/emails/send { scheduledFor: "..." }
         ↓
Create EmailLog with status: SCHEDULED
         ↓
Publish to QStash with delay = scheduledFor - now
QStash returns messageId → store as qstashMessageId
         ↓
... time passes ...
         ↓
QStash calls POST /api/internal/scheduled-send
         ↓
Re-check: unsubscribed? cancelled?
         ↓
If valid → sendEmail() (normal pipeline, no scheduledFor)
Update EmailLog: SCHEDULED → SENT
         ↓
If cancelled/unsubscribed → skip, update status
```

### New Files

```
src/lib/queue/qstash.ts              ← QStash client: publish/cancel/reschedule (single file)
src/app/api/internal/scheduled-send/route.ts  ← QStash callback endpoint
src/app/api/v1/emails/scheduled/route.ts       ← List pending scheduled emails
src/app/api/v1/emails/scheduled/[id]/route.ts  ← Cancel/reschedule
src/app/(dashboard)/dashboard/emails/scheduled/page.tsx ← Dashboard UI
```

### Modified Files

```
src/app/api/v1/emails/send/route.ts  ← Route to scheduler when scheduledFor present
src/lib/email/client.ts              ← Skip provider scheduledAt (we handle it)
prisma/schema.prisma                 ← Add qstashMessageId, scheduledFor to EmailLog
```

## 3. Detailed Behavior

### 3.1 QStash Integration

```typescript
// src/lib/queue/qstash.ts
import { Client } from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export async function publishScheduledEmail(
  emailLogId: string,
  scheduledFor: Date,
): Promise<string> {
  const delay = Math.max(
    0,
    Math.floor((scheduledFor.getTime() - Date.now()) / 1000),
  );
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/internal/scheduled-send`;

  const result = await qstash.publishJSON({
    url: callbackUrl,
    body: { emailLogId },
    delay,
  });

  return result.messageId;
}

export async function cancelScheduledEmail(
  qstashMessageId: string,
): Promise<void> {
  await qstash.messages.delete(qstashMessageId);
}
```

### 3.2 Scheduling Flow

When `scheduledFor` is present in the send API:

1. Validate brand, intent, provider exist (same as normal send)
2. Check unsubscribe status (skip if unsubscribed now)
3. Store the original EmailRequest params (brandId, intentId, to, data, etc.) as JSON on EmailLog
4. Create EmailLog with `status: SCHEDULED`, `scheduledFor`, `scheduledRequest`
5. Publish to QStash with delay
6. Store `qstashMessageId` on EmailLog
7. Return `{ success: true, messageId: emailLogId, scheduled: true }`

### 3.3 Callback Endpoint

`POST /api/internal/scheduled-send` — called by QStash at scheduled time.

1. Verify QStash signature (using `@upstash/qstash` Receiver)
2. Read `emailLogId` from body
3. Load EmailLog — if status !== SCHEDULED, skip (already cancelled)
4. Re-check unsubscribe status — if unsubscribed, mark CANCELLED
5. Load stored `scheduledRequest` params from EmailLog
6. Call `sendEmail()` with stored request params (reuses full normal pipeline — AI generation, provider send, etc.)
7. Update EmailLog: status → SENT, sentAt → now
8. Update provider stats

### 3.4 Cancel/Reschedule

**Cancel:** `DELETE /api/v1/emails/scheduled/:id`

1. Find EmailLog by id, verify organizationId, status === SCHEDULED
2. Call `cancelScheduledEmail(qstashMessageId)`
3. Update EmailLog: status → CANCELLED

**Reschedule:** `PATCH /api/v1/emails/scheduled/:id`

1. Find EmailLog by id, verify organizationId, status === SCHEDULED
2. Cancel old QStash message
3. Publish new QStash message with new delay
4. Update EmailLog: scheduledFor, qstashMessageId

### 3.5 Dashboard UI

`/dashboard/emails/scheduled` — table of pending scheduled emails with:

- Recipient, subject, brand, scheduled time
- Status filter (SCHEDULED only by default)
- Cancel button (sets status → CANCELLED)
- Reschedule action (date picker → PATCH)

### 3.6 Schema Changes

```prisma
model EmailLog {
  // ... existing fields
  scheduledFor      DateTime?
  scheduledRequest  Json?      // Original EmailRequest params for re-send at callback time
  qstashMessageId   String?
}

enum EmailStatus {
  PENDING
  QUEUED
  SCHEDULED    // NEW
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  COMPLAINED
  CANCELLED    // NEW
  FAILED
}
```

### 3.7 QStash Signature Verification

```typescript
import { Receiver } from "@upstash/qstash";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

// In the callback route:
const isValid = await receiver.verify({
  signature: request.headers.get("upstash-signature")!,
  body: rawBody,
});
```

### 3.8 Error Handling

| Scenario                           | Behavior                              |
| ---------------------------------- | ------------------------------------- |
| QStash publish fails               | Return error, don't create EmailLog   |
| QStash callback fails              | QStash retries automatically (3x)     |
| EmailLog not found on callback     | Return 200 (prevent QStash retry)     |
| Email already cancelled            | Return 200, skip send                 |
| Unsubscribed at send time          | Mark CANCELLED, return 200            |
| Provider send fails at callback    | Update EmailLog to FAILED, return 200 |
| QStash cancel fails (already sent) | Catch error, log warning              |

## 4. Decisions Summary

| Decision          | Choice                   | Rationale                                               |
| ----------------- | ------------------------ | ------------------------------------------------------- |
| Queue system      | Upstash QStash           | Serverless, no worker process, native Upstash ecosystem |
| Unsubscribe check | At send time (callback)  | Prevents sending to recently unsubscribed users         |
| Email content     | Re-generate at send time | Reuses sendEmail() pipeline, no parallel send path      |
| Cancel flow       | API + Dashboard UI       | Full control for both API consumers and dashboard users |
| QStash auth       | Signature verification   | Prevents spoofed callback requests                      |

## 5. MVP Scope

**In:**

- QStash integration (publish, cancel)
- Scheduled send callback endpoint with signature verification
- Cancel and reschedule via API
- Dashboard UI for viewing/cancelling scheduled emails
- Stored request params for deferred send
- SCHEDULED and CANCELLED status in EmailLog
- Unsubscribe re-check at send time

**Out:**

- Recurring/repeating schedules
- Batch scheduling (multiple recipients in one call)
- Schedule templates (e.g., "send every Monday at 9am")
- Queue monitoring/alerting dashboard
- Rate limiting on scheduled sends

## 6. Risks

| Risk                                    | Mitigation                                         |
| --------------------------------------- | -------------------------------------------------- |
| QStash service outage                   | Emails stay SCHEDULED, can be manually triggered   |
| Clock drift on delay calculation        | Use server-side UTC, QStash handles precision      |
| Large volume of scheduled emails        | QStash handles scale; DB indexed on scheduledFor   |
| Content drift between schedule and send | Acceptable — send-time generation uses latest data |

## 7. Environment Variables

```
QSTASH_TOKEN=                    # QStash API token
QSTASH_CURRENT_SIGNING_KEY=      # For callback verification
QSTASH_NEXT_SIGNING_KEY=         # For key rotation
```
