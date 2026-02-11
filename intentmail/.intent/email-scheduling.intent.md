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

> [!SYNCED] Last synced: 2026-02-11 from commit b0728ef

```typescript
// src/lib/queue/qstash.ts
import { Client, Receiver } from "@upstash/qstash";

// Lazy initialization — avoids crash if env vars missing at import time
function getClient(): Client { ... }
function getReceiver(): Receiver { ... }

export async function publishScheduledEmail(
  emailLogId: string,
  scheduledFor: Date,
): Promise<string> {
  const delay = Math.max(
    0,
    Math.floor((scheduledFor.getTime() - Date.now()) / 1000),
  );
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/internal/scheduled-send`;

  const result = await getClient().publishJSON({
    url: callbackUrl,
    body: { emailLogId },
    delay,
  });

  return result.messageId;
}

export async function cancelScheduledEmail(
  qstashMessageId: string,
): Promise<void> {
  // Silently succeeds on 404 (message already delivered/deleted)
  await getClient().messages.delete(qstashMessageId);
}

export async function verifyQStashSignature(
  signature: string,
  body: string,
): Promise<boolean> {
  return getReceiver().verify({ signature, body });
}
```

### 3.2 Scheduling Flow

> [!SYNCED] Last synced: 2026-02-11 from commit b0728ef

When `scheduledFor` is present and in the future in the send API:

1. Validate brand, intent, provider exist (same as normal send)
2. Check unsubscribe status (skip if unsubscribed now)
3. Build `scheduledRequest` JSON from original params (brandId, intentId, to, data, etc.)
4. Create EmailLog with `status: SCHEDULED`, `scheduledFor`, `scheduledRequest`
5. Publish to QStash with delay
6. Update EmailLog with `qstashMessageId`
7. Return `{ data: { messageId, to, status: "scheduled", scheduled: true, scheduledFor } }`
8. **On QStash failure:** delete orphaned EmailLog (rollback)

Note: `scheduledFor` was removed from the `EmailRequest` type — scheduling is handled at the route level, not in the email client.

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

> [!SYNCED] Last synced: 2026-02-11 from commit b0728ef

**Cancel:** `DELETE /api/v1/emails/scheduled/:id`

1. Find EmailLog by id, verify organizationId, status === SCHEDULED
2. Call `cancelScheduledEmail(qstashMessageId)` — best-effort, logs warning on failure
3. Update EmailLog: status → CANCELLED
4. Response: `{ data: { id, status: "cancelled" } }`

**Reschedule:** `PATCH /api/v1/emails/scheduled/:id` with `{ scheduledFor: ISO string }`

1. Find EmailLog by id, verify organizationId, status === SCHEDULED
2. Validate new `scheduledFor` is in the future
3. **Publish new QStash message first** (rollback safety — if this fails, old message stays)
4. Cancel old QStash message (best-effort)
5. Update EmailLog: scheduledFor, qstashMessageId
6. Response: `{ data: { id, status: "scheduled", scheduledFor } }`

**List:** `GET /api/v1/emails/scheduled?page=1&limit=20`

1. API key auth with `email:send` scope
2. Query SCHEDULED emails for organization, sorted by `scheduledFor ASC`
3. Select excludes internal fields (scheduledRequest, qstashMessageId)
4. Response: `{ data: [...], pagination: { page, limit, total, totalPages } }`

### 3.5 Dashboard UI

> [!SYNCED] Last synced: 2026-02-11 from commit b0728ef

`/dashboard/emails/scheduled` — server-rendered page (force-dynamic) showing SCHEDULED emails:

- Table columns: Recipient (+ intent slug), Subject, Brand, Scheduled For, Status badge, Actions
- Empty state with Clock icon when no scheduled emails
- Cancel button with `confirm()` dialog, calls DELETE endpoint, refreshes page
- Reschedule: datetime-local input with client-side past-date validation, calls PATCH endpoint
- Loading state on buttons prevents rapid double-clicks
- Sidebar nav: "Scheduled" link with Clock icon between "Emails" and "Analytics"

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

> [!SYNCED] Last synced: 2026-02-11 from commit b0728ef

Verification is handled via `verifyQStashSignature()` exported from `qstash.ts` (see 3.1).

In the callback route:

```typescript
const signature = request.headers.get("upstash-signature");
if (!signature)
  return NextResponse.json({ error: "Missing signature" }, { status: 401 });

const isValid = await verifyQStashSignature(signature, rawBody);
if (!isValid)
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
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

## 8. Finalized Implementation Details

> Synced on: 2026-02-11
> From: commits 214870d..b0728ef (Phases 0-3)

### Module Structure

```
src/lib/queue/
├── qstash.ts                    # QStash client (publish/cancel/verify) — lazy init
├── qstash.test.ts               # 20 unit tests
├── scheduling.test.ts           # 25 tests (scheduling flow + callback)
└── scheduled-api.test.ts        # 22 tests (list/cancel/reschedule API)

src/app/api/internal/
└── scheduled-send/route.ts      # QStash callback (signature-verified)

src/app/api/v1/emails/scheduled/
├── route.ts                     # GET list (paginated)
└── [id]/route.ts                # DELETE cancel, PATCH reschedule

src/app/(dashboard)/dashboard/emails/scheduled/
└── page.tsx                     # Server-rendered scheduled emails table

src/components/emails/
└── scheduled-actions.tsx        # Client component (cancel/reschedule UI)
```

### Key Implementation Decisions

| Decision                     | Final Choice                              | Rationale                                                |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| QStash client init           | Lazy via `getClient()`/`getReceiver()`    | Avoids crash if env vars missing at import               |
| Reschedule order             | Publish new first, cancel old second      | Rollback safety: if publish fails, old stays             |
| QStash cancel failure        | Best-effort, log warning, still update DB | Message may already be delivered                         |
| scheduledFor in EmailRequest | Removed from type                         | Scheduling handled at route level, not client            |
| Dashboard filter             | Always SCHEDULED, no toggle               | Simplest MVP; other statuses visible on main emails page |
| Orphan cleanup               | Delete EmailLog on QStash publish failure | Prevents SCHEDULED records with no QStash message        |

### Test Coverage

- 67 total tests (20 + 25 + 22)
- All 6 IDD categories covered per phase: Happy Path, Bad Path, Edge Cases, Security, Data Leak, Data Damage
- Status: all passing
