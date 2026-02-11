# Domain Verification: Custom sender domain management for IntentMail

## One sentence explanation

Let GROWTH/ENTERPRISE users add custom sender domains, verify them via their email provider's API, and enforce that sends use verified domains.

## Why?

Users on higher plans want branded sender addresses (e.g., `hello@mail.acme.com` instead of provider shared domains). Without domain verification, emails may land in spam or be rejected by receiving servers. The existing `customDomain` plan flag is already defined but nothing uses it yet.

## Core experience

```
Add Domain → See DNS Records → Add at DNS Provider → Click Verify → Verified!

┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ User enters  │────>│ Provider API │────>│ Show DNS    │
│ domain name  │     │ creates      │     │ records to  │
│ + provider   │     │ domain       │     │ add         │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌──────────────┐     ┌──────┴──────┐
                    │ Domain       │<────│ User clicks │
                    │ VERIFIED     │     │ "Verify"    │
                    └──────────────┘     └─────────────┘
```

## Architecture

```
Dashboard UI
  /domains          → List domains + status
  /domains/new      → Add domain form
  /domains/[id]     → DNS records + verify button
       │
       ▼
Server Actions / API Routes
  POST /api/v1/domains         → Add domain
  POST /api/v1/domains/[id]/verify → Trigger verification
  DELETE /api/v1/domains/[id]  → Remove domain
       │
       ▼
Provider Domain Adapters (Resend, SendGrid, Mailgun, Postmark)
  addDomain() → verifyDomain() → getDomainRecords() → removeDomain()
       │
       ▼
Prisma Domain Model
  { orgId, providerId, domain, status, dnsRecords, providerDomainId }
       │
       ▼
Send Route Enforcement
  Brand.fromEmail domain must be VERIFIED (GROWTH+ only)
```

## Key decisions

| Question | Choice | Why |
|----------|--------|-----|
| Verification method | Delegate to provider APIs | Provider handles DKIM key gen, simpler |
| Data model | New Domain Prisma model | Clean queries vs JSON blob in EmailProvider.config |
| Enforcement | At send time | Doesn't block brand creation, catches at point of use |
| Plan gating | GROWTH+ only | Honors existing `customDomain: true` on GROWTH/ENTERPRISE |
| AWS SES | Not in v1 | Different identity model, defer |

## Scope

**In**: Domain CRUD, provider-delegated verification (4 providers), DNS record display, send-time enforcement, dashboard pages

**Out**: Auto-polling verification, DMARC management, domain analytics, AWS SES, wildcard domains

## Risk + Mitigation

| Risk | Mitigation |
|------|------------|
| DNS propagation delays | User retries manually; domain stays PENDING |
| Provider API failures | Non-blocking error; domain keeps current status |
| Brand.fromEmail orphaned after domain removal | Warn in UI; send-time check catches it |

## Next steps

1. `/intent-critique` — Check for over-engineering
2. `/intent-plan` — Generate phased TDD plan
3. `/intent-build-now` — Implement
