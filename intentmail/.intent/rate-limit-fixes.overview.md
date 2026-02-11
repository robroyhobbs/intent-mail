# Rate Limit Fixes: Wire up broken monthly quota enforcement

## One sentence
Fix the monthly email quota counter that exists in schema but is never incremented or reset.

## Why?
The rate limiting infrastructure (Upstash sliding window, plan limits, quota check in send route) is all in place, but the monthly counter (`emailsUsedThisMonth`) is always 0 because nothing increments it after a send. Every org effectively has unlimited monthly emails despite the quota check.

## Core experience

```
Before (broken):
  Send email → quota check passes (counter = 0 forever) → send succeeds
  Dashboard shows: "Emails Sent: 423 (last 30 days)" ← arbitrary window

After (fixed):
  Send email → quota check (lazy reset if cycle expired) → send succeeds → counter += 1
  At limit → 429 QUOTA_EXCEEDED with Retry-After header
  Dashboard shows: "750 / 1,000 emails this month — Resets Feb 15"
```

## Architecture

```
sendEmail()
  ↓ success
db.organization.update({ emailsUsedThisMonth: { increment: 1 } })

checkMonthlyQuota(org)
  ↓ cycle expired?
  ↓ yes → reset counter to 0, advance billingCycleStart
  ↓ no  → check emailsUsedThisMonth < plan limit
```

## Key decisions

| Question | Choice | Why |
|----------|--------|-----|
| Where to count | sendEmail() | Catches immediate + scheduled sends |
| Cycle reset | Lazy (on check) | No cron, no worker, simple |
| Race conditions | Accept ±1 | Not worth locking for email counts |
| Dashboard | Billing cycle view | More useful than 30-day window |

## Scope

**In:** Counter increment, lazy reset, dashboard update
**Out:** Usage notifications, per-key display, rate limit analytics

## Risk + Mitigation

| Risk | Fix |
|------|-----|
| Lazy reset race | Prisma `increment` is atomic; ±1 acceptable |
| Counter drift | EmailLog is audit source; counter is fast-path only |
| Increment failure | Log warning, don't fail the send |

## Next steps
1. `/intent-critique` → check for over-engineering
2. `/intent-plan` → generate phased TDD plan
3. `/intent-build-now` → execute
