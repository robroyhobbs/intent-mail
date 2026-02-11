# Execution Plan: restricted-access

## Overview

Lock IntentMail to invite-only access. Replace public sign-up with waitlist form, store submissions in DB, redirect /sign-up to /waitlist, and update landing page CTAs.

## Prerequisites

- Clerk auth configured with middleware
- Prisma schema with existing models
- Landing page at src/app/(marketing)/page.tsx

---

## Phase 0: Waitlist Model + Form + Redirects

### Description

Add WaitlistEntry Prisma model, create /waitlist page with server action form, redirect /sign-up to /waitlist, update middleware public routes, and update landing page CTAs.

### Tests

#### Happy Path

- [x] Waitlist form renders with email, name, and use case fields
- [x] Form submission creates WaitlistEntry in DB with PENDING status
- [x] Success message shown after submission
- [x] /sign-up redirects to /waitlist
- [x] /sign-in still works for approved users
- [x] Landing page CTAs point to /waitlist
- [x] /waitlist is accessible without auth

#### Bad Path

- [x] Empty email shows validation error (HTML required attribute)
- [x] Invalid email format rejected
- [x] Empty name or use case shows validation error
- [x] Duplicate email submission updates existing entry (no error)

#### Edge Cases

- [x] Very long use case text (> 1000 chars) handled gracefully
- [x] Email with mixed case normalized to lowercase
- [x] Form works without JavaScript (progressive enhancement via server action)

#### Security

- [x] Waitlist form uses server action (no client-side DB access)
- [x] Email validated server-side before DB insert
- [x] No SQL injection via form fields (Prisma parameterized)
- [x] CSRF protection via Next.js server actions

#### Data Leak

- [x] Waitlist form does not reveal which emails are already registered
- [x] Success message is generic (same for new and existing entries)
- [x] Error messages do not expose internal state

#### Data Damage

- [x] Duplicate email upserts (no duplicate rows)
- [x] Form submission is idempotent
- [x] Status field preserved on re-submission (APPROVED stays APPROVED)

### E2E Gate

```bash
cd /Users/robroyhobbs/work/intentmail

# Verify Prisma schema
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma validate 2>&1 | tail -3

# Build
pnpm build 2>&1 | tail -5

# Verify files exist
ls -la src/app/\(marketing\)/waitlist/page.tsx
```

### Acceptance Criteria

- [x] WaitlistEntry model in Prisma schema
- [x] /waitlist page with form and server action
- [x] /sign-up redirects to /waitlist
- [x] Landing page CTAs updated
- [x] Middleware allows /waitlist as public route
- [x] Build succeeds

---

## Final E2E Verification

```bash
cd /Users/robroyhobbs/work/intentmail && pnpm build
```

## Deployment Notes

After code is committed:

1. Enable Clerk Allowlist in Clerk Dashboard → Settings → Restrictions
2. Add approved email addresses to allowlist
3. Deploy to Vercel: `vercel --prod`
4. Configure intentmail.io domain in Vercel dashboard
5. Set environment variables in Vercel project settings

## References

- [Intent](./restricted-access.intent.md)
