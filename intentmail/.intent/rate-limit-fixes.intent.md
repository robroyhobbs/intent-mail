# Rate Limit Fixes Specification

## 1. Overview

- **Product positioning:** Fix critical gaps in existing rate limiting infrastructure
- **Core concept:** The per-minute rate limiting (Upstash sliding window) and monthly quota schema already exist, but the monthly quota counter is never incremented and never resets. This makes the quota check a no-op. Fix the counter, add lazy billing cycle resets, and update the dashboard to show accurate billing-cycle usage.
- **Priority:** P1 (production readiness — without this, quota enforcement is broken)
- **Target user:** All organizations using the send API
- **Project scope:** Wire up existing infrastructure — no new packages, no new rate limiting strategy

## 2. Architecture

### Current State (Broken)

```
POST /api/v1/emails/send
         ↓
checkRateLimit() → Upstash sliding window ✓ (works)
         ↓
org.emailsUsedThisMonth >= limit? → Always 0 ✗ (never incremented)
         ↓
sendEmail() → provider.send() → success
         ↓
(emailsUsedThisMonth NOT incremented) ✗
(billingCycleStart NOT checked/reset) ✗
```

### Target State (Fixed)

```
POST /api/v1/emails/send
         ↓
checkRateLimit() → Upstash sliding window ✓
         ↓
checkMonthlyQuota(org) → lazy reset if cycle expired → check count
         ↓
sendEmail() → provider.send() → success
         ↓
incrementEmailCount(org.id) → emailsUsedThisMonth += 1
         ↓
Dashboard shows: "X / Y emails this billing cycle"
```

### Modified Files

```
src/lib/email/client.ts              ← Increment counter after successful send
src/lib/auth.ts                      ← Lazy billing cycle reset on org load
src/app/api/v1/emails/send/route.ts  ← Use updated quota check (may already work)
src/app/(dashboard)/dashboard/page.tsx ← Billing cycle usage instead of 30-day count
```

## 3. Detailed Behavior

### 3.1 Increment Email Counter

After `sendEmail()` successfully sends (status = SENT), increment `emailsUsedThisMonth`:

```typescript
// In src/lib/email/client.ts, after successful provider.send()
await db.organization.update({
  where: { id: request.organizationId },
  data: { emailsUsedThisMonth: { increment: 1 } },
});
```

This catches both:

- Immediate sends (API route)
- Scheduled sends (QStash callback → sendEmail())

### 3.2 Lazy Billing Cycle Reset

<!-- critique: 2026-02-11 — simplified from separate function to inline logic -->

Add lazy reset logic inline in the send route, where the quota check already exists:

```typescript
// In send/route.ts, where quota is already checked:
const limits = getPlanLimits(org.plan);

// Lazy reset: if billing cycle expired, reset counter
if (org.billingCycleStart) {
  const nextReset = new Date(org.billingCycleStart);
  nextReset.setMonth(nextReset.getMonth() + 1);
  if (new Date() >= nextReset) {
    await db.organization.update({
      where: { id: org.id },
      data: { emailsUsedThisMonth: 0, billingCycleStart: new Date() },
    });
    org.emailsUsedThisMonth = 0; // Update local ref
  }
}

if (org.emailsUsedThisMonth >= limits.emailsPerMonth) {
  return NextResponse.json({ error: { code: "QUOTA_EXCEEDED", ... } }, { status: 429 });
}
```

No new function — fix the existing inline check.

### 3.3 Dashboard Billing Cycle Display

<!-- critique: 2026-02-11 — reset date only for paid plans -->

Replace the "Emails Sent - Last 30 days" card with billing-cycle-aware usage:

```
Paid plan:
┌──────────────────────────────────┐
│ Emails This Month                │
│ 8,200 / 10,000                  │
│ ████████████████░░░░  82%       │
│ Resets Feb 15, 2026             │
└──────────────────────────────────┘

Free plan (no billingCycleStart):
┌──────────────────────────────────┐
│ Emails This Month                │
│ 750 / 1,000                     │
│ ████████████████░░░░  75%       │
└──────────────────────────────────┘
```

Use `org.emailsUsedThisMonth` and `getPlanLimits(org.plan).emailsPerMonth`. Only show "Resets [date]" when `billingCycleStart` is set (paid plans).

### 3.4 Error Handling

| Scenario                    | Behavior                                                                 |
| --------------------------- | ------------------------------------------------------------------------ |
| Increment fails (DB error)  | Log warning, don't fail the send (email already sent)                    |
| Lazy reset race condition   | Two concurrent resets → emailsUsedThisMonth may be off by 1. Acceptable. |
| billingCycleStart is null   | Skip lazy reset (free plan); counter resets never or on plan upgrade     |
| Enterprise plan (unlimited) | Skip quota check entirely (emailsPerMonth = Infinity)                    |

## 4. Decisions Summary

| Decision                | Choice              | Rationale                                              |
| ----------------------- | ------------------- | ------------------------------------------------------ |
| Where to increment      | sendEmail() client  | Catches both immediate and scheduled sends             |
| Billing cycle reset     | Lazy on check       | No cron needed, simple, works for low-traffic SaaS     |
| Race condition handling | Accept ±1 variance  | Not worth distributed lock complexity for email counts |
| Dashboard metric        | Billing cycle usage | More useful than arbitrary 30-day window               |
| Increment failure       | Log and continue    | Email already sent, don't fail the response            |

## 5. MVP Scope

**In:**

- Increment emailsUsedThisMonth on successful send
- Lazy billing cycle reset
- Dashboard shows billing cycle quota (used/limit + progress bar + reset date)
- Handle null billingCycleStart gracefully

**Out:**

- Per-API-key rate limit display in dashboard
- Rate limit analytics/history
- Real-time usage webhooks
- Admin override of monthly quotas
- Notification emails at 80%/90%/100% usage (future enhancement)

## 6. Risks

| Risk                         | Mitigation                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Race condition on lazy reset | Accept ±1 variance; Prisma's `increment` is atomic                           |
| Counter drift over time      | EmailLog count is source of truth for auditing; counter is for fast checks   |
| Increment failure after send | Fire-and-forget with logging; email delivery is more important than counting |
