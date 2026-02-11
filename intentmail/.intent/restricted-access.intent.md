# Restricted Access: Invite-Only Launch

## Overview

Lock down IntentMail to pre-approved users only. Public sign-up is replaced with a waitlist form. Approved users are added to Clerk's allowlist and can sign in normally. Waitlist submissions stored in DB for review.

## Responsibilities

**Does:**
- Redirect /sign-up to /waitlist (no public account creation)
- Provide a waitlist form collecting email, name, and use case
- Store waitlist entries in a Prisma model with PENDING/APPROVED/REJECTED status
- Show success message after waitlist submission
- Update landing page CTAs from sign-up to waitlist
- Add /waitlist to public routes in middleware

**Does not:**
- Build an admin UI for managing waitlist (use DB directly for now)
- Send notification emails on submission (manual review for now)
- Integrate Stripe billing (deferred)
- Auto-approve or auto-create Clerk accounts

## Structure

```
Public Routes:
  / (landing) ──→ CTA points to /waitlist
  /waitlist ──→ Form: email + name + use case → DB insert
  /sign-in ──→ Clerk sign-in (for approved users)
  /sign-up ──→ REDIRECTS to /waitlist
  /pricing ──→ Pricing info

Protected Routes:
  /dashboard/* ──→ Requires Clerk auth (unchanged)

Clerk Allowlist (manual):
  Admin adds approved emails in Clerk Dashboard → Allowlist
  User receives invite → signs in at /sign-in
```

## Data Model

```prisma
model WaitlistEntry {
  id        String         @id @default(cuid())
  email     String         @unique
  name      String
  useCase   String
  status    WaitlistStatus @default(PENDING)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
}

enum WaitlistStatus {
  PENDING
  APPROVED
  REJECTED
}
```

## Constraints

- Waitlist form is public (no auth required)
- Email uniqueness enforced — resubmit updates existing entry
- No rate limiting on waitlist form for now (low traffic launch)
- Clerk allowlist is managed via Clerk Dashboard, not API
- Landing page hero CTA changes from "Get Started Free" to "Request Access"
- /sign-in remains unchanged for approved users

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth model | Clerk allowlist | Built-in feature, no custom auth code |
| Waitlist storage | Prisma DB table | Queryable, can build admin UI later |
| Sign-up redirect | /sign-up → /waitlist | Clean UX, no confusing Clerk error |
| Admin approval | Manual (Clerk Dashboard) | Simplest for low-volume launch |
| Form fields | Email + name + use case | Enough context to qualify leads |
