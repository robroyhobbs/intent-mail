# Domain Verification Specification

## 1. Overview

- **Product positioning**: Feature for IntentMail multi-tenant SaaS email platform
- **Core concept**: Let users add custom sender domains (e.g., `mail.acme.com`) and verify them via their email provider's domain API. Verified domains unlock sending from that domain.
- **Priority**: High (production readiness for custom branding)
- **Target user**: GROWTH and ENTERPRISE plan customers who want branded sender addresses
- **Project scope**: New Domain model, provider-delegated verification, send-time enforcement, dashboard UI

## 2. Architecture

### Data Layer

```
Organization (existing)
  │
  ├── EmailProvider (existing, has apiKey + config)
  │       │
  │       └── Domain (NEW)
  │             ├── id
  │             ├── organizationId
  │             ├── providerId (FK → EmailProvider)
  │             ├── domain (e.g., "mail.acme.com")
  │             ├── status: PENDING | VERIFIED | FAILED
  │             ├── providerDomainId (provider's internal ID)
  │             ├── dnsRecords: Json (records provider says to add)
  │             ├── lastCheckedAt
  │             ├── verifiedAt
  │             ├── createdAt / updatedAt
  │             └── unique(organizationId, domain)
  │
  └── Brand (existing, has fromEmail)
        └── Send route checks: fromEmail domain must be VERIFIED in Domain table
```

### Rendering Layer

Dashboard pages:

- `/dashboard/domains` — List all domains with status badges
- `/dashboard/domains/new` — Add domain form (select provider, enter domain)
- `/dashboard/domains/[id]` — Domain detail: DNS records to add + verify button

### Key Subsystems

1. **Provider Domain Adapters** — Each provider class gets `addDomain()`, `verifyDomain()`, `removeDomain()` <!-- critique: 2026-02-11 — dropped getDomainRecords(), records stored from addDomain() -->
2. **Send-time Enforcement** — In the send route, after resolving Brand.fromEmail, check that the email's domain is verified (GROWTH+ plans only)
3. **Dashboard UI** — CRUD for domains with DNS record display and verification status

## 3. Detailed Behavior

### 3.1 Provider Domain APIs

Each provider implements domain operations differently:

**Resend** (`resend` SDK):

- `client.domains.create({ name })` → returns domain with DNS records
- `client.domains.verify(domainId)` → triggers re-check
- `client.domains.get(domainId)` → returns status + records
- `client.domains.remove(domainId)` → removes domain

**SendGrid** (REST API):

- `POST /v3/whitelabel/domains` → authenticate domain
- `POST /v3/whitelabel/domains/{id}/validate` → verify DNS
- `GET /v3/whitelabel/domains/{id}` → check status
- `DELETE /v3/whitelabel/domains/{id}` → remove

**Mailgun** (REST API):

- `POST /v3/domains` → add domain
- `PUT /v3/domains/{domain}/verify` → verify DNS
- `GET /v3/domains/{domain}` → check status + records
- `DELETE /v3/domains/{domain}` → remove

**Postmark** (REST API):

- `POST /domains` → create sender domain
- `PUT /domains/{id}/verifyDkim` + `PUT /domains/{id}/verifyReturnPath` → verify
- `GET /domains/{id}` → status
- `DELETE /domains/{id}` → remove

**AWS SES**: Not supported in v1 (SES uses identity verification, different model). Show "not supported" message.

### 3.2 Add Domain Flow

```
User enters domain (e.g., "mail.acme.com")
  → Select which provider to verify with
  → Call provider.addDomain(domain)
  → Provider returns DNS records to add
  → Store Domain record with status: PENDING, dnsRecords: [...]
  → Show DNS records to user in dashboard
```

### 3.3 Verify Domain Flow

```
User clicks "Verify" button
  → Call provider.verifyDomain(providerDomainId)
  → Provider checks DNS propagation
  → If verified: update Domain.status = VERIFIED, set verifiedAt
  → If not: update Domain.status = PENDING (still waiting)
  → If failed: update Domain.status = FAILED with error
  → Show result to user
```

### 3.4 Send-time Enforcement

In `src/app/api/v1/emails/send/route.ts`, after resolving the Brand:

```
if (limits.customDomain) {
  // Only enforce for plans that HAVE custom domain support
  const emailDomain = fromEmail.split("@")[1]
  const verifiedDomain = await db.domain.findFirst({
    where: { organizationId, domain: emailDomain, status: "VERIFIED" }
  })
  if (!verifiedDomain) {
    return 400 DOMAIN_NOT_VERIFIED
  }
}
```

**Important**: FREE/STARTER plans skip this check entirely — they use provider's shared domain, no custom domain needed.

### 3.5 Remove Domain

```
User clicks "Remove" in dashboard
  → Call provider.removeDomain(providerDomainId)
  → Delete Domain record from database
  → If Brand.fromEmail uses this domain, warn but don't block
```

## 4. User Experience

### Add Domain Flow

1. Navigate to `/dashboard/domains`
2. Click "Add Domain"
3. Select provider from dropdown (only active providers shown)
4. Enter domain name
5. Submit → see DNS records to add at their DNS provider
6. Add records at DNS provider (external)
7. Click "Verify" → see success/pending status

### Domain List

- Table with columns: Domain, Provider, Status (badge), Added, Actions
- Status badge colors: PENDING=yellow, VERIFIED=green, FAILED=red
- Actions: Verify, View Records, Remove

### Plan Gate

- FREE/STARTER: Show "Upgrade to Growth" CTA instead of domain management
- GROWTH/ENTERPRISE: Full domain management UI

## 5. Technical Implementation Guide

### 5.1 Prisma Schema Addition

```prisma
model Domain {
  id               String       @id @default(cuid())
  organizationId   String
  providerId       String
  domain           String
  status           DomainStatus @default(PENDING)
  providerDomainId String?
  dnsRecords       Json         @default("[]")
  lastCheckedAt    DateTime?
  verifiedAt       DateTime?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  organization  Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  provider      EmailProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@unique([organizationId, domain])
  @@index([organizationId])
  @@index([providerId])
}

enum DomainStatus {
  PENDING
  VERIFIED
  FAILED
}
```

### 5.2 Provider Interface Extension

Add to `EmailProvider` interface:

```typescript
// Optional — providers that don't support domains return null
addDomain?(domain: string): Promise<DomainAddResult | null>;
verifyDomain?(domainId: string): Promise<DomainVerifyResult>;
removeDomain?(domainId: string): Promise<{ success: boolean; error?: string }>;
```

<!-- critique: 2026-02-11 — dropped getDomainRecords(), DNS records stored from addDomain() response -->

### 5.3 Dashboard Server Actions

<!-- critique: 2026-02-11 — dropped /api/v1/domains/* REST routes, dashboard-only feature uses server actions -->

Server actions inline in dashboard page files (no separate actions module):

- `addDomain(formData)` — in domains/new/page.tsx
- `verifyDomain(domainId)` — in domains/[id]/page.tsx
- `removeDomain(domainId)` — in domains/[id]/page.tsx

### 5.4 Files to Create/Modify

**New files:**

- `src/app/(dashboard)/dashboard/domains/page.tsx` — Domain list
- `src/app/(dashboard)/dashboard/domains/new/page.tsx` — Add domain form + server action
- `src/app/(dashboard)/dashboard/domains/[id]/page.tsx` — Domain detail + verify/remove actions
- `src/lib/domains/domain-verification.test.ts` — Tests
<!-- critique: 2026-02-11 — removed API route files and separate actions.ts, server actions inline in pages -->

**Modified files:**

- `src/lib/email/providers/index.ts` — Add domain methods to interface
- `src/lib/email/providers/resend.ts` — Implement domain methods
- `src/lib/email/providers/sendgrid.ts` — Implement domain methods
- `src/lib/email/providers/mailgun.ts` — Implement domain methods
- `src/lib/email/providers/postmark.ts` — Implement domain methods
- `src/lib/email/providers/aws-ses.ts` — Return "not supported"
- `src/app/api/v1/emails/send/route.ts` — Add domain verification check
- `src/app/(dashboard)/dashboard/page.tsx` — Add domains stat card

## 6. Decisions Summary

| Decision              | Choice                              | Rationale                                             |
| --------------------- | ----------------------------------- | ----------------------------------------------------- |
| Verification approach | Delegate to provider APIs           | Simpler, provider handles DKIM key generation         |
| Data model            | New Domain Prisma model             | Clean queries, easy dashboard display                 |
| Enforcement point     | Send-time check on fromEmail domain | Doesn't block brand creation, catches at point of use |
| Plan gating           | GROWTH+ only                        | Honors existing `customDomain` flag in PlanLimits     |
| AWS SES support       | Not in v1                           | SES identity verification is a different model        |

## 7. MVP Scope

### Included

- Domain model with PENDING/VERIFIED/FAILED status
- Provider-delegated add/verify/remove for Resend, SendGrid, Mailgun, Postmark
- DNS records display in dashboard
- Send-time fromEmail domain check (GROWTH+ only)
- Dashboard pages: list, add, detail

### Excluded

- Auto-verification polling (user must click "Verify" manually)
- DMARC policy management
- Domain-level analytics
- AWS SES identity verification
- Wildcard domain support

## 8. Risks

| Risk                                          | Mitigation                                                                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Provider API differences                      | Each provider class handles its own API shape; common DomainAddResult/DomainVerifyResult types normalize output |
| DNS propagation delays                        | Show "Pending" status, user retries verification manually                                                       |
| Provider API failures                         | Non-blocking errors shown to user; domain stays in current status                                               |
| Brand.fromEmail mismatch after domain removal | Warn in UI but don't cascade-delete brands; send-time check catches it                                          |

## 9. Open Items

None — all decisions resolved.
