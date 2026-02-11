# IntentMail - Intent Specification

Intent-Driven Development (IDD) specifications for IntentMail, a multi-tenant SaaS platform for AI-native, intent-driven email generation and delivery.

## Architecture Overview

IntentMail replaces static email templates with **intent specifications** that define *what* an email should accomplish. The system generates brand-consistent emails from intent + brand configuration + dynamic data.

```
API Request (intent + brand + data)
        |
        v
  +-----------+     +-----------+     +----------+
  | Auth &    | --> | Intent    | --> | Template |
  | Rate Limit|     | Resolution|     | Rendering|
  +-----------+     +-----------+     +----------+
                                           |
                                           v
                                    +------------+     +----------+
                                    | Validation | --> | Provider |
                                    | & Scoring  |     | Delivery |
                                    +------------+     +----------+
```

## Intent Files

| File | Domain | Description |
|------|--------|-------------|
| `system.intent.yaml` | Platform | System-level architecture and constraints |
| `api-send-email.intent.yaml` | API | Email send endpoint specification |
| `brands.intent.yaml` | Brands | Brand configuration and styling |
| `intents.intent.yaml` | Intents | Email intent/template definitions |
| `providers.intent.yaml` | Providers | BYOP email provider management |
| `auth.intent.yaml` | Auth | Authentication, API keys, and scopes |
| `billing.intent.yaml` | Billing | Plans, quotas, and Stripe integration |
| `templates.intent.yaml` | Templates | Slot-based template system |

## Key Concepts

- **Organization**: Multi-tenant boundary (Clerk-managed)
- **Brand**: Visual identity config (colors, typography, voice, logo)
- **Intent**: Email purpose definition (tone, urgency, structure, content rules)
- **Template**: Slot-based HTML structure (7 built-in templates)
- **Slot**: Composable content unit (11 slot types)
- **Provider**: BYOP email delivery (Resend, SendGrid, Postmark, AWS SES, Mailgun)

## Tech Stack

- Next.js 14 (App Router)
- PostgreSQL + Prisma ORM
- Clerk (auth + orgs)
- Stripe (billing)
- Upstash Redis (rate limiting)
- Handlebars (template rendering)
- Zod (validation)
