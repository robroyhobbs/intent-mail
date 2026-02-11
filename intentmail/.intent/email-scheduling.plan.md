# Execution Plan: email-scheduling

## Overview

Add deferred email delivery with full lifecycle management using Upstash QStash. Emails with `scheduledFor` are enqueued to QStash instead of sent immediately. QStash calls back at the scheduled time to trigger the normal `sendEmail()` pipeline. Users can cancel or reschedule pending emails via API and dashboard.

## Prerequisites

- Existing `sendEmail()` pipeline in `src/lib/email/client.ts`
- EmailLog model with status tracking in Prisma schema
- API key authentication with scopes
- Unsubscribe checking already in `sendEmail()`
- `@upstash/qstash` package (installed in Phase 0)
- Environment variables: `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`

---

## Phase 0: Schema Changes + QStash Client

### Description

Add SCHEDULED/CANCELLED status to EmailStatus enum, add scheduling fields to EmailLog, install `@upstash/qstash`, and create the QStash client module (`src/lib/queue/qstash.ts`) with publish and cancel functions.

### Tests

#### Happy Path

- [x] publishScheduledEmail returns a messageId string
- [x] publishScheduledEmail calculates correct delay in seconds (scheduledFor - now)
- [x] cancelScheduledEmail calls qstash.messages.delete with correct messageId
- [x] Prisma schema accepts SCHEDULED and CANCELLED as EmailStatus values
- [x] EmailLog can be created with scheduledFor, scheduledRequest, and qstashMessageId fields

#### Bad Path

- [x] publishScheduledEmail throws when QStash client rejects (invalid token)
- [x] publishScheduledEmail throws when callback URL is malformed
- [x] cancelScheduledEmail throws when messageId does not exist in QStash
- [x] cancelScheduledEmail throws when QStash returns network error
- [x] Creating EmailLog with scheduledRequest as non-JSON fails validation

#### Edge Cases

- [x] publishScheduledEmail with scheduledFor in the past results in delay = 0 (immediate)
- [x] publishScheduledEmail with scheduledFor exactly now results in delay = 0
- [x] publishScheduledEmail with scheduledFor 30 days in future calculates correct large delay
- [x] cancelScheduledEmail is idempotent when called on already-deleted message (catch and log)

#### Security

- [x] QStash client does not expose QSTASH_TOKEN in error messages or logs
- [x] publishScheduledEmail only accepts HTTPS callback URLs in production
- [x] scheduledRequest JSON does not contain decrypted API keys or secrets

#### Data Leak

- [x] Error from QStash publish does not expose internal callback URL to API consumers
- [x] QStash messageId is opaque — does not leak organization or email details

#### Data Damage

- [x] If QStash publish fails, no EmailLog is created (atomic: publish first, then create)
- [x] If EmailLog creation fails after QStash publish, the orphaned QStash message is cancelled

### E2E Gate

```bash
# Verify schema migration succeeds
cd /Users/robroyhobbs/work/intentmail && npx prisma generate

# Verify QStash client module compiles
npx tsc --noEmit src/lib/queue/qstash.ts 2>&1 || true

# Run unit tests for QStash client
pnpm test -- --grep "qstash" --passWithNoTests

# Verify full build passes
pnpm build 2>&1 | tail -5
```

### Acceptance Criteria

- [x] `@upstash/qstash` installed as dependency
- [x] Prisma schema has SCHEDULED, CANCELLED in EmailStatus enum
- [x] EmailLog has scheduledFor (DateTime?), scheduledRequest (Json?), qstashMessageId (String?)
- [x] `src/lib/queue/qstash.ts` exports publishScheduledEmail and cancelScheduledEmail
- [x] All 6 test categories pass
- [x] Build succeeds

---

## Phase 1: Scheduling Flow + Callback Endpoint

### Description

Modify the send route to detect `scheduledFor` and route through QStash instead of sending immediately. Create the internal callback endpoint (`/api/internal/scheduled-send`) with QStash signature verification that loads stored request params and calls `sendEmail()`. Modify `client.ts` to skip passing `scheduledAt` to the provider (we handle it via QStash).

### Tests

#### Happy Path

- [ ] POST /api/v1/emails/send with scheduledFor creates EmailLog with status SCHEDULED
- [ ] POST /api/v1/emails/send with scheduledFor stores request params in scheduledRequest JSON
- [ ] POST /api/v1/emails/send with scheduledFor returns { scheduled: true, messageId }
- [ ] POST /api/v1/emails/send without scheduledFor sends immediately (no change to existing flow)
- [ ] POST /api/internal/scheduled-send with valid signature loads EmailLog and calls sendEmail()
- [ ] POST /api/internal/scheduled-send updates EmailLog from SCHEDULED to SENT on success
- [ ] Callback endpoint re-checks unsubscribe status before sending
- [ ] Callback endpoint updates provider stats after successful send

#### Bad Path

- [ ] POST /api/v1/emails/send with scheduledFor but invalid brand returns 404 (before QStash publish)
- [ ] POST /api/v1/emails/send with scheduledFor but invalid intent returns 404 (before QStash publish)
- [ ] POST /api/v1/emails/send with scheduledFor but no provider returns error (before QStash publish)
- [ ] POST /api/internal/scheduled-send with missing signature returns 401
- [ ] POST /api/internal/scheduled-send with invalid signature returns 401
- [ ] POST /api/internal/scheduled-send with non-existent emailLogId returns 200 (no retry)
- [ ] POST /api/internal/scheduled-send with already CANCELLED emailLog returns 200 (skip send)
- [ ] POST /api/internal/scheduled-send with already SENT emailLog returns 200 (skip send)
- [ ] Callback endpoint where sendEmail() fails updates EmailLog to FAILED, returns 200

#### Edge Cases

- [ ] scheduledFor in past (<= now) sends immediately via normal pipeline (no QStash)
- [ ] scheduledFor less than 60 seconds in future still routes through QStash
- [ ] Callback fires but recipient unsubscribed since scheduling — marks CANCELLED, returns 200
- [ ] scheduledRequest contains all original request params needed to reconstruct sendEmail() call
- [ ] Large scheduledRequest JSON (many data fields) stores and retrieves correctly

#### Security

- [ ] Callback endpoint verifies QStash signature using Receiver with signing keys
- [ ] Callback endpoint is not accessible without valid Upstash-Signature header
- [ ] Callback endpoint does not accept requests from arbitrary origins
- [ ] scheduledRequest does not store raw API key — only references (providerId, brandId, etc.)
- [ ] Timing-safe signature comparison (via QStash Receiver library)

#### Data Leak

- [ ] Callback error responses do not expose EmailLog details or organization info
- [ ] Callback endpoint returns generic 200/401 — no detailed error messages to caller
- [ ] Scheduled send response does not expose QStash messageId to API consumers

#### Data Damage

- [ ] EmailLog status transitions are atomic: SCHEDULED→SENT or SCHEDULED→FAILED
- [ ] If callback encounters DB error updating status, returns 500 (QStash will retry)
- [ ] Concurrent callbacks for same emailLogId only send once (check status before send)
- [ ] scheduledFor field on EmailLog is preserved after send (for audit)

### E2E Gate

```bash
# Run scheduling flow tests
cd /Users/robroyhobbs/work/intentmail && pnpm test -- --grep "scheduled" --passWithNoTests

# Verify routes compile
npx tsc --noEmit 2>&1 || true

# Verify build passes
pnpm build 2>&1 | tail -5
```

### Acceptance Criteria

- [ ] Send route detects scheduledFor and creates SCHEDULED EmailLog + publishes to QStash
- [ ] Callback endpoint at /api/internal/scheduled-send verifies QStash signature
- [ ] Callback loads stored request params and calls sendEmail() through normal pipeline
- [ ] client.ts no longer passes scheduledAt to provider when QStash handles scheduling
- [ ] All 6 test categories pass
- [ ] Build succeeds

---

## Phase 2: Cancel/Reschedule API + List Endpoint

### Description

Create REST endpoints for managing scheduled emails: list pending (`GET /api/v1/emails/scheduled`), cancel (`DELETE /api/v1/emails/scheduled/:id`), and reschedule (`PATCH /api/v1/emails/scheduled/:id`). All endpoints require API key auth with appropriate scopes and verify organization ownership.

### Tests

#### Happy Path

- [ ] GET /api/v1/emails/scheduled returns list of SCHEDULED emails for the organization
- [ ] GET /api/v1/emails/scheduled supports pagination (page, limit query params)
- [ ] DELETE /api/v1/emails/scheduled/:id cancels QStash message and sets status CANCELLED
- [ ] PATCH /api/v1/emails/scheduled/:id with new scheduledFor cancels old + publishes new QStash message
- [ ] PATCH /api/v1/emails/scheduled/:id updates scheduledFor and qstashMessageId on EmailLog

#### Bad Path

- [ ] GET /api/v1/emails/scheduled without API key returns 401
- [ ] GET /api/v1/emails/scheduled with key lacking email:send scope returns 403
- [ ] DELETE /api/v1/emails/scheduled/:id with non-existent id returns 404
- [ ] DELETE /api/v1/emails/scheduled/:id with wrong organizationId returns 404 (not 403)
- [ ] DELETE /api/v1/emails/scheduled/:id on already-CANCELLED email returns 400
- [ ] DELETE /api/v1/emails/scheduled/:id on already-SENT email returns 400
- [ ] PATCH /api/v1/emails/scheduled/:id without new scheduledFor returns 400
- [ ] PATCH /api/v1/emails/scheduled/:id with invalid date format returns 400
- [ ] PATCH /api/v1/emails/scheduled/:id on non-SCHEDULED email returns 400

#### Edge Cases

- [ ] GET /api/v1/emails/scheduled with no scheduled emails returns empty array
- [ ] DELETE when QStash cancel fails (message already delivered) — still marks CANCELLED in DB, logs warning
- [ ] PATCH reschedule to a time in the past returns 400
- [ ] Rapid cancel + reschedule on same email — only latest state persists
- [ ] List endpoint sorts by scheduledFor ascending (soonest first)

#### Security

- [ ] Cannot access scheduled emails from another organization
- [ ] Cannot cancel scheduled emails from another organization
- [ ] Cannot reschedule scheduled emails from another organization
- [ ] API key scope check (email:send) required for all endpoints

#### Data Leak

- [ ] List endpoint does not expose scheduledRequest (internal field)
- [ ] List endpoint does not expose qstashMessageId (internal field)
- [ ] Error responses for not-found do not reveal whether the ID exists in another org

#### Data Damage

- [ ] Cancel is idempotent — calling twice does not corrupt state
- [ ] Reschedule atomically: old QStash cancelled before new one published
- [ ] If new QStash publish fails during reschedule, old message is NOT cancelled (rollback)

### E2E Gate

```bash
# Run cancel/reschedule tests
cd /Users/robroyhobbs/work/intentmail && pnpm test -- --grep "scheduled" --passWithNoTests

# Verify routes compile
npx tsc --noEmit 2>&1 || true

# Verify build passes
pnpm build 2>&1 | tail -5
```

### Acceptance Criteria

- [ ] GET /api/v1/emails/scheduled returns paginated list of scheduled emails
- [ ] DELETE /api/v1/emails/scheduled/:id cancels via QStash and updates DB
- [ ] PATCH /api/v1/emails/scheduled/:id reschedules via QStash and updates DB
- [ ] All endpoints enforce organization isolation and API key auth
- [ ] All 6 test categories pass
- [ ] Build succeeds

---

## Phase 3: Dashboard UI

### Description

Create dashboard page at `/dashboard/emails/scheduled` showing pending scheduled emails with cancel and reschedule actions. Add navigation link to sidebar.

### Tests

#### Happy Path

- [ ] Page renders table of SCHEDULED emails with recipient, subject, brand, scheduled time
- [ ] Cancel button calls DELETE endpoint and refreshes page
- [ ] Reschedule action sends PATCH with new date and refreshes page
- [ ] Page shows empty state when no scheduled emails exist
- [ ] Sidebar includes "Scheduled" link under Emails section

#### Bad Path

- [ ] Cancel button shows error toast when API returns error
- [ ] Reschedule with past date shows validation error before API call
- [ ] Page redirects to login when user is not authenticated
- [ ] Page shows error when API call to fetch scheduled emails fails

#### Edge Cases

- [ ] Page handles large list (50+ scheduled emails) with pagination
- [ ] Scheduled time displays in user's local timezone
- [ ] Email that was just cancelled disappears from list after refresh
- [ ] Multiple rapid cancel clicks are debounced (loading state)

#### Security

- [ ] Page requires authenticated session (server-side check)
- [ ] Organization isolation — only shows current org's scheduled emails
- [ ] Cancel/reschedule actions use session auth, not exposed API keys

#### Data Leak

- [ ] Page does not display internal IDs (qstashMessageId, scheduledRequest)
- [ ] Page does not expose API keys or provider details

#### Data Damage

- [ ] Cancel confirmation dialog prevents accidental cancellation
- [ ] Reschedule preserves all original email params (only scheduledFor changes)

### E2E Gate

```bash
# Verify page compiles and builds
cd /Users/robroyhobbs/work/intentmail && pnpm build 2>&1 | tail -5

# Verify sidebar changes compile
npx tsc --noEmit 2>&1 || true
```

### Acceptance Criteria

- [ ] Dashboard page at /dashboard/emails/scheduled renders scheduled emails table
- [ ] Cancel and reschedule actions work via API calls
- [ ] Sidebar navigation includes Scheduled link
- [ ] All 6 test categories pass
- [ ] Build succeeds

---

## Final E2E Verification

```bash
# Full test suite
cd /Users/robroyhobbs/work/intentmail && pnpm test --passWithNoTests

# Full build
pnpm build

# Verify all new routes exist
ls -la src/lib/queue/qstash.ts
ls -la src/app/api/internal/scheduled-send/route.ts
ls -la src/app/api/v1/emails/scheduled/route.ts
ls -la "src/app/api/v1/emails/scheduled/[id]/route.ts"
ls -la "src/app/(dashboard)/dashboard/emails/scheduled/page.tsx"
```

## Risk Mitigation

| Risk                        | Mitigation                                               | Contingency                       |
| --------------------------- | -------------------------------------------------------- | --------------------------------- |
| QStash service outage       | Emails stay SCHEDULED in DB                              | Add manual trigger endpoint later |
| Clock drift on delay        | Use server-side UTC, QStash handles precision            | Acceptable variance < 1s          |
| Orphaned QStash messages    | Cancel QStash on EmailLog creation failure               | Periodic cleanup sweep (future)   |
| Callback replay attacks     | QStash signature verification + status check before send | Idempotent: skip if not SCHEDULED |
| Large scheduledRequest JSON | Prisma Json field has no size limit on PostgreSQL        | Monitor payload sizes             |

## References

- [Intent](./email-scheduling.intent.md)
