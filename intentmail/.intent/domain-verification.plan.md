# Execution Plan: domain-verification

## Overview

Add custom sender domain management to IntentMail. Users on GROWTH/ENTERPRISE plans add domains, verify them via their email provider's API (Resend, SendGrid, Mailgun, Postmark), and the send route enforces that fromEmail uses a verified domain.

## Prerequisites

- Existing EmailProvider model with encrypted API keys and provider-specific config
- Existing provider classes: ResendProvider, SendGridProvider, MailgunProvider, PostmarkProvider, AwsSesProvider
- `customDomain: boolean` in PlanLimits (true for GROWTH/ENTERPRISE)
- Brand.fromEmail field (free-text, nullable)

---

## Phase 0: Schema + Provider Domain Adapters + Send Enforcement

### Description

Add the Domain Prisma model, implement `addDomain()`, `verifyDomain()`, `removeDomain()` on each provider class, and add send-time domain verification check in the send route. This phase delivers the complete backend — everything except the dashboard UI.

### Tests

#### Happy Path

- [x] Domain model creates with correct fields (orgId, providerId, domain, status PENDING)
- [x] Resend addDomain() calls client.domains.create and returns DNS records
- [x] Resend verifyDomain() calls client.domains.verify and returns status
- [x] Resend removeDomain() calls client.domains.remove
- [x] SendGrid addDomain() calls POST /whitelabel/domains and returns DNS records
- [x] SendGrid verifyDomain() calls POST /whitelabel/domains/{id}/validate
- [x] Mailgun addDomain() calls POST /v3/domains
- [x] Mailgun verifyDomain() calls PUT /v3/domains/{domain}/verify
- [x] Postmark addDomain() calls POST /domains and returns DKIM + return-path records
- [x] Postmark verifyDomain() calls both verifyDkim and verifyReturnPath endpoints
- [x] Send route allows sending when fromEmail domain is verified (GROWTH plan)
- [x] Send route skips domain check for FREE/STARTER plans (customDomain: false)
- [x] Send route skips domain check for ENTERPRISE plan with verified domain

#### Bad Path

- [x] addDomain() with invalid domain string returns error (not throws)
- [x] addDomain() when provider API fails returns { success: false, error }
- [x] verifyDomain() when DNS not propagated returns status: PENDING (not FAILED)
- [x] verifyDomain() with invalid providerDomainId returns error
- [x] removeDomain() when provider API fails returns { success: false, error }
- [x] AWS SES addDomain() returns null (not supported)
- [x] AWS SES verifyDomain() returns null (not supported)
- [x] Send route returns 400 DOMAIN_NOT_VERIFIED when fromEmail domain not verified (GROWTH+)
- [x] Send route returns 400 DOMAIN_NOT_VERIFIED when domain exists but status is PENDING
- [x] Duplicate domain (same org + domain) rejected by unique constraint

#### Edge Cases

- [x] Domain with subdomain (e.g., "mail.acme.com") handled correctly
- [x] Domain case-insensitive: "Mail.Acme.com" normalized to lowercase
- [x] Brand.fromEmail is null: send route skips domain check (uses provider default)
- [x] Provider has addDomain but domain record already exists at provider: handle gracefully
- [x] Postmark split verification: both DKIM and return-path must pass for VERIFIED status
- [x] Organization has multiple providers: domain tied to specific provider

#### Security

- [x] Domain operations require authenticated session (organization context)
- [x] Cannot add domain for another organization's provider
- [x] Provider API key decryption only happens server-side (never exposed to client)
- [x] Domain name validated: no protocol prefix, no path, no special characters

#### Data Leak

- [x] Provider API errors do not expose API key in error messages
- [x] DNS records shown to user do not include provider internal IDs in a way that leaks info
- [x] DOMAIN_NOT_VERIFIED error does not reveal which domains ARE verified

#### Data Damage

- [x] addDomain: if DB write fails after provider.addDomain() succeeds, domain exists at provider but not in DB (orphan) — acceptable, user can re-add
- [x] removeDomain: provider.removeDomain() called before DB delete — if DB delete fails, domain gone from provider but still in DB (stale) — next remove attempt will clean up
- [x] Prisma unique constraint prevents duplicate domains per org
- [x] Domain status updates are atomic single-field updates

### E2E Gate

```bash
cd /Users/robroyhobbs/work/intentmail && npx vitest run src/lib/domains/ --passWithNoTests 2>&1 | tail -10

# Verify Prisma schema is valid
npx prisma validate 2>&1 | tail -3

# Verify build passes
pnpm build 2>&1 | tail -5
```

### Acceptance Criteria

- [x] Domain model added to Prisma schema with DomainStatus enum
- [x] Organization model has `domains` relation
- [x] EmailProvider model has `domains` relation
- [x] addDomain/verifyDomain/removeDomain implemented for Resend, SendGrid, Mailgun, Postmark
- [x] AWS SES returns null for domain operations
- [x] Send route enforces verified domain for GROWTH+ plans
- [x] All 6 test categories pass
- [x] Build succeeds

---

## Phase 1: Dashboard UI

### Description

Build the dashboard pages for domain management: list, add, and detail/verify. Include plan gating (GROWTH+ only) and integrate with the main dashboard stats.

### Tests

#### Happy Path

- [x] Domains list page renders with correct columns (Domain, Provider, Status, Added)
- [x] Add domain page shows provider dropdown with active providers only
- [x] Add domain form submits and creates domain via server action
- [x] Domain detail page shows DNS records from stored dnsRecords JSON
- [x] Verify button triggers verifyDomain and updates status display
- [x] Remove button triggers removeDomain and redirects to list
- [x] Status badges show correct colors: PENDING=yellow, VERIFIED=green, FAILED=red
- [x] Dashboard overview shows domain count in stats grid

#### Bad Path

- [x] Add domain with empty domain name shows validation error
- [x] Add domain with no provider selected shows validation error
- [x] Verify fails gracefully: shows error toast, domain stays at current status
- [x] Remove fails gracefully: shows error toast, domain not deleted
- [x] Domains page with zero domains shows empty state

#### Edge Cases

- [x] Organization with no active providers: add domain form shows "No providers configured" message
- [x] Domain list with mix of PENDING/VERIFIED/FAILED statuses renders correctly
- [x] Long domain names truncate properly in table
- [x] DNS records table handles varying number of records per provider

#### Security

- [x] Domains pages require authenticated session (requireOrganization)
- [x] Organization isolation: only shows current org's domains
- [x] FREE/STARTER users see upgrade CTA, not domain management
- [x] Server actions validate organizationId matches session

#### Data Leak

- [x] DNS records display does not expose provider API keys
- [x] Domain detail does not show providerDomainId to users
- [x] Error messages from provider API are sanitized before display

#### Data Damage

- [x] Add domain server action is idempotent (re-submit doesn't create duplicate)
- [x] Remove domain confirms before executing (or shows clear "removed" state)
- [x] Verify button can be clicked multiple times without corruption

### E2E Gate

```bash
cd /Users/robroyhobbs/work/intentmail && pnpm build 2>&1 | tail -5

# Verify TypeScript compiles
npx tsc --noEmit 2>&1 || true

# Verify new pages exist
ls -la src/app/\(dashboard\)/dashboard/domains/page.tsx
ls -la src/app/\(dashboard\)/dashboard/domains/new/page.tsx
ls -la src/app/\(dashboard\)/dashboard/domains/\[id\]/page.tsx
```

### Acceptance Criteria

- [x] Domain list page with status badges and actions
- [x] Add domain page with provider selection and form
- [x] Domain detail page with DNS records and verify/remove buttons
- [x] Plan gating: FREE/STARTER see upgrade CTA
- [x] Dashboard overview shows domains stat
- [x] All 6 test categories pass
- [x] Build succeeds

---

## Final E2E Verification

```bash
# Full test suite
cd /Users/robroyhobbs/work/intentmail && npx vitest run --passWithNoTests

# Full build
pnpm build

# Verify all domain files exist
ls -la src/app/\(dashboard\)/dashboard/domains/page.tsx
ls -la src/app/\(dashboard\)/dashboard/domains/new/page.tsx
ls -la src/app/\(dashboard\)/dashboard/domains/\[id\]/page.tsx
ls -la src/lib/domains/domain-verification.test.ts

# Verify modified provider files
ls -la src/lib/email/providers/resend.ts
ls -la src/lib/email/providers/sendgrid.ts
ls -la src/lib/email/providers/mailgun.ts
ls -la src/lib/email/providers/postmark.ts
```

## Risk Mitigation

| Risk                        | Mitigation                                                               | Contingency                             |
| --------------------------- | ------------------------------------------------------------------------ | --------------------------------------- |
| Provider API differences    | Each provider normalizes to DomainAddResult/DomainVerifyResult types     | Test each provider independently        |
| DNS propagation delays      | Status stays PENDING until user retries verify                           | No timeout — user decides when to retry |
| Provider API failures       | Non-blocking errors returned to user                                     | Domain stays in current status          |
| Orphan domains at provider  | If DB write fails after provider.addDomain(), user can re-add            | Provider deduplicates by domain name    |
| Postmark split verification | verifyDomain() calls both DKIM + return-path; only VERIFIED if both pass | Status stays PENDING if only one passes |

## References

- [Intent](./domain-verification.intent.md)
- [Overview](./domain-verification.overview.md)
