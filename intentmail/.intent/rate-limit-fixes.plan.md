# Execution Plan: rate-limit-fixes

## Overview

Fix the broken monthly email quota enforcement. The per-minute rate limiting (Upstash) works, but the monthly counter (`emailsUsedThisMonth`) is never incremented and never resets. Wire up the increment in `sendEmail()`, add lazy billing cycle reset in the send route, and update the dashboard to show billing-cycle usage.

## Prerequisites

- Existing `sendEmail()` pipeline in `src/lib/email/client.ts`
- Existing quota check in `src/app/api/v1/emails/send/route.ts`
- `emailsUsedThisMonth` and `billingCycleStart` fields on Organization model
- `getPlanLimits()` in `src/lib/stripe.ts`
- Dashboard overview at `src/app/(dashboard)/dashboard/page.tsx`

---

## Phase 0: Counter Increment + Lazy Reset

### Description

Wire up the monthly email counter: increment `emailsUsedThisMonth` in `sendEmail()` after successful send, and add lazy billing cycle reset logic inline in the send route before the quota check.

### Tests

#### Happy Path

- [x] sendEmail() increments emailsUsedThisMonth by 1 after successful send
- [x] Lazy reset: expired billing cycle resets counter to 0 and advances billingCycleStart
- [x] Quota check blocks sends when emailsUsedThisMonth >= plan limit (returns 429)
- [x] Quota check passes when emailsUsedThisMonth < plan limit
- [x] Enterprise plan (unlimited) skips quota check entirely
- [x] Scheduled sends (via QStash callback) also increment the counter

#### Bad Path

- [x] Increment DB failure does not fail the send response (fire-and-forget with log)
- [x] Lazy reset DB failure does not block the send (proceeds with stale counter)
- [x] Quota exceeded returns 429 with QUOTA_EXCEEDED error code
- [x] Quota exceeded response includes Retry-After header
- [x] Send with invalid organizationId does not increment any counter

#### Edge Cases

- [x] billingCycleStart is null (free plan without Stripe): no lazy reset, counter still works
- [x] emailsUsedThisMonth is exactly at limit: blocked (>=, not >)
- [x] emailsUsedThisMonth is 0 after fresh reset: sends allowed
- [x] Two concurrent sends both try lazy reset: both succeed, counter may be ±1 (acceptable)
- [x] Billing cycle that expired more than 1 month ago: still resets correctly (not double-counted)

#### Security

- [x] Quota check cannot be bypassed by omitting organizationId
- [x] Rate limit headers do not expose internal plan details beyond limit/remaining/reset
- [x] Counter cannot be decremented by external API calls

#### Data Leak

- [x] 429 error response does not expose emailsUsedThisMonth exact count to API consumers
- [x] 429 error response does not expose plan name or billing cycle dates
- [x] Increment failure log does not contain sensitive org data

#### Data Damage

- [x] Prisma `increment: 1` is atomic — no lost increments under concurrency
- [x] Lazy reset uses single `update` call — no partial state between reset and counter clear
- [x] If send fails (provider error), counter is NOT incremented (only on success)

### E2E Gate

```bash
cd /Users/robroyhobbs/work/intentmail && npx vitest run src/lib/queue/ src/lib/email/ --passWithNoTests 2>&1 | tail -10

# Verify build passes
pnpm build 2>&1 | tail -5
```

### Acceptance Criteria

- [x] sendEmail() increments emailsUsedThisMonth after successful send
- [x] Lazy billing cycle reset works inline in send route
- [x] 429 returned when quota exceeded
- [x] Enterprise plan bypasses quota check
- [x] All 6 test categories pass
- [x] Build succeeds

---

## Phase 1: Dashboard Billing Cycle Display

### Description

Replace the "Emails Sent - Last 30 days" card on the dashboard with billing-cycle-aware usage showing `emailsUsedThisMonth / planLimit` with a progress bar. Show reset date only for paid plans.

### Tests

#### Happy Path

- [x] Dashboard shows "Emails This Month" with org.emailsUsedThisMonth value
- [x] Progress bar width matches usage percentage (used/limit)
- [x] Paid plan shows "Resets [date]" based on billingCycleStart + 1 month
- [x] Free plan does NOT show reset date
- [x] Usage alert triggers at 80% of plan limit (existing behavior preserved)

#### Bad Path

- [x] Dashboard renders correctly when emailsUsedThisMonth is 0
- [x] Dashboard renders correctly when plan limit is Infinity (enterprise)
- [x] Dashboard handles missing billingCycleStart gracefully (no crash)

#### Edge Cases

- [x] Enterprise plan shows "Unlimited" instead of numeric limit
- [x] Usage at exactly 100% shows full progress bar
- [x] Usage over 100% (race condition) caps progress bar at 100%

#### Security

- [x] Dashboard page requires authenticated session (existing requireOrganization)
- [x] Organization isolation — only shows current org's usage

#### Data Leak

- [x] Dashboard does not expose raw billingCycleStart date for free plans
- [x] Dashboard does not show other orgs' usage data

#### Data Damage

- [x] Dashboard is read-only — no mutations to emailsUsedThisMonth
- [x] Stale emailsUsedThisMonth value doesn't corrupt display (just shows old number)

### E2E Gate

```bash
cd /Users/robroyhobbs/work/intentmail && pnpm build 2>&1 | tail -5

# Verify TypeScript compiles
npx tsc --noEmit 2>&1 || true
```

### Acceptance Criteria

- [x] Dashboard shows billing cycle usage (used/limit + progress bar)
- [x] Paid plans show reset date, free plans don't
- [x] Enterprise shows "Unlimited"
- [x] All 6 test categories pass
- [x] Build succeeds

---

## Final E2E Verification

```bash
# Full test suite
cd /Users/robroyhobbs/work/intentmail && npx vitest run --passWithNoTests

# Full build
pnpm build

# Verify modified files
ls -la src/lib/email/client.ts
ls -la src/app/api/v1/emails/send/route.ts
ls -la src/app/\(dashboard\)/dashboard/page.tsx
```

## Risk Mitigation

| Risk                         | Mitigation                                      | Contingency                                       |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| Race condition on lazy reset | Prisma atomic update; accept ±1 variance        | EmailLog count is audit source of truth           |
| Counter drift over time      | Counter is fast-path; EmailLog is authoritative | Can re-sync counter from EmailLog count if needed |
| Increment failure            | Fire-and-forget with console.warn               | Email delivery > counting accuracy                |
| Dashboard stale data         | force-dynamic on page                           | Refresh shows latest                              |

## References

- [Intent](./rate-limit-fixes.intent.md)
- [Overview](./rate-limit-fixes.overview.md)
