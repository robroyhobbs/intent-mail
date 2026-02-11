# IntentMail

AI-native email platform for SaaS. Define email **intents** — not templates — and let IntentMail generate on-brand, slot-based emails through a single API call.

## How It Works

1. **Define Intents** — Describe *what* an email should accomplish (purpose, tone, urgency, content rules)
2. **Configure Slots** — Structure emails with slots (greeting, body, CTA, signoff) using 7 built-in templates
3. **Send via API** — `POST /api/v1/emails/send` with an intent slug and recipient data
4. **Brand Consistency** — Colors, voice, and style enforced per-brand across every email

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components)
- **Auth:** Clerk (organizations, roles, invite-only access)
- **Database:** PostgreSQL via Prisma ORM
- **Email Providers:** Resend, SendGrid, Postmark (multi-provider with failover)
- **UI:** Tailwind CSS, Radix UI, shadcn/ui components
- **Validation:** Zod
- **Deployment:** Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in Clerk keys, DATABASE_URL, provider API keys

# Push database schema
npx prisma db push

# Start development server
npm run dev
```

## Environment Variables

See `.env.example` for the full list. Required for core functionality:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key |
| `CLERK_SECRET_KEY` | Clerk backend key |
| `ENCRYPTION_KEY` | 64-char hex key for encrypting provider credentials |

Optional (gracefully degraded when missing):

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend email provider |
| `STRIPE_SECRET_KEY` | Billing (not required for private beta) |
| `UPSTASH_REDIS_REST_URL` | Rate limiting (allows all when missing) |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Sign-in, sign-up pages
│   ├── (dashboard)/         # Dashboard pages (intents, brands, providers, etc.)
│   ├── (marketing)/         # Landing page, pricing, docs
│   └── api/
│       └── v1/              # REST API (intents, brands, providers, emails, api-keys)
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── brands/              # Brand management forms
│   ├── intents/             # Intent creation form
│   └── providers/           # Email provider forms
└── lib/
    ├── auth.ts              # Clerk auth helpers, plan limits, org management
    ├── db.ts                # Prisma client
    ├── encryption.ts        # AES-256-GCM for provider credentials
    ├── email/
    │   ├── client.ts        # Email orchestrator (generate + send)
    │   ├── providers/       # Resend, SendGrid, Postmark adapters
    │   ├── templates/       # Slot-based template renderer (7 templates)
    │   └── generation/      # AI content generation
    └── api/
        ├── auth.ts          # API key authentication middleware
        └── rate-limit.ts    # Upstash rate limiting
```

## API

### Send an Email

```bash
curl -X POST https://your-domain.com/api/v1/emails/send \
  -H "Authorization: Bearer im_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "intentSlug": "onboarding.welcome",
    "to": "user@example.com",
    "data": {
      "firstName": "Alice",
      "productName": "Acme",
      "dashboardUrl": "https://app.acme.com"
    }
  }'
```

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/v1/intents` | List/create intents |
| GET/PUT/DELETE | `/api/v1/intents/:id` | Manage single intent |
| GET/POST | `/api/v1/brands` | List/create brands |
| GET/POST | `/api/v1/providers` | List/create email providers |
| POST | `/api/v1/emails/send` | Send an email |
| POST | `/api/v1/emails/preview` | Preview email HTML |
| GET/POST | `/api/v1/api-keys` | Manage API keys |

## Starter Intents

New organizations get 5 pre-configured intents:

| Intent | Slug | Template |
|--------|------|----------|
| Welcome Email | `onboarding.welcome` | simple |
| Purchase Confirmation | `transactional.purchase` | transactional |
| Password Reset | `security.password-reset` | security |
| Trial Expiring | `lifecycle.trial-expiring` | info-box |
| Invoice / Payment Receipt | `billing.invoice` | transactional |

## Plans & Limits

| Plan | Emails/mo | Brands | API Keys | Custom Domain |
|------|-----------|--------|----------|---------------|
| Free | 1,000 | 1 | 2 | No |
| Starter | 10,000 | 3 | 5 | No |
| Growth | 50,000 | 10 | 20 | Yes |
| Enterprise | Unlimited | Unlimited | Unlimited | Yes |

## Domain Verification

Custom sending domains can be verified through the dashboard. IntentMail generates the required DNS records (SPF, DKIM, DMARC) and delegates verification to the connected email provider (Resend, SendGrid).

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production (includes prisma generate)
npm run lint         # ESLint
npm run db:push      # Push Prisma schema to database
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run migrations
```

## License

Private — All rights reserved.
