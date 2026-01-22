# IntentMail

**AI-Native Intent-Driven Email System**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

---

## What is Intent-Based Email?

Traditional email systems hardcode copy into templates. Every change requires a developer. Marketing becomes bottlenecked by engineering sprints.

**IntentMail separates concerns:**

| Layer | Who Owns It | Example |
|-------|-------------|---------|
| **Intent** | Product | "welcome", "password-reset", "invoice" |
| **Brand** | Marketing | Voice, tone, phrases to use/avoid |
| **Content** | AI | Generated text matching intent + brand |

```
Traditional:
  subject: "Welcome to Acme, ${userName}!"
  body: "Thanks for signing up. Click here to get started..."
  → Hardcoded. Change requires deploy.

Intent-Based:
  intent: "welcome"
  data: { userName: "John" }
  → AI generates on-brand content. Marketing edits prompts, not code.
```

---

## Why Intent-Based?

### For Product/Engineering

```javascript
// Before: Hardcoded strings everywhere
await sendEmail({
  to: user.email,
  subject: `Welcome to Acme, ${user.name}!`,
  html: `<h1>Thanks for joining!</h1><p>Hi ${user.name}...</p>`
});

// After: Intent-driven
await sendEmail({
  intent: 'welcome',
  to: user.email,
  data: { userName: user.name }
});
```

- Define **what** emails exist, not **how** they read
- No copy changes in code
- Consistent API across all email types

### For Marketing

- Edit brand voice without developer help
- Customize prompts via UI
- Preview emails instantly
- A/B test messaging without deploys
- Consistent voice across all touchpoints

### The Tradeoff Matrix

| Challenge | Traditional | Intent-Based |
|-----------|-------------|--------------|
| Copy change | Dev ticket → sprint → deploy | Edit prompt, instant |
| New email type | Build template, write copy | Define intent + data |
| Brand consistency | Manual enforcement | AI enforces guidelines |
| Personalization | Complex conditionals | AI adapts naturally |
| A/B testing | Code changes per variant | AI generates variations |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      YOUR APP                                │
│                                                              │
│   POST /api/v1/send                                         │
│   { intent: "welcome", to: "user@example.com", data: {} }   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       INTENTMAIL                             │
│                                                              │
│   Intent          Brand           Template                   │
│   "welcome"   +   voice/tone  +   layout     →  Email       │
│                                                              │
│                         │                                    │
│                         ▼                                    │
│              ┌─────────────────────┐                        │
│              │     Claude AI       │                        │
│              │  Generates content  │                        │
│              └─────────────────────┘                        │
│                         │                                    │
│                         ▼                                    │
│              ┌─────────────────────┐                        │
│              │   Email Provider    │                        │
│              │  Resend / SMTP      │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

- **Intent-Driven** - Define email purposes, AI handles the words
- **Multi-Brand** - Manage distinct brand voices and styles
- **AI Generation** - Claude generates subject, body, CTAs
- **Developer API** - REST API with key auth, rate limiting, usage tracking
- **Credit Billing** - Optional PaymentKit integration for monetization
- **Blocklet Ready** - Deploy standalone or to Blocklet Server

---

## Deployment Options

### Option 1: Standalone (No Blocklet Server)

Run as a regular Node.js/Express server anywhere.

```bash
# Clone
git clone https://github.com/robroyhobbs/intent-mail.git
cd intent-mail

# Install
npm install

# Configure
cp .env.example .env
# Edit .env:
#   ANTHROPIC_API_KEY=sk-ant-xxx
#   EMAIL_PROVIDER=resend
#   RESEND_API_KEY=re_xxx

# Run
npm run dev          # Development (localhost:3030)
npm run build        # Production build
npm start            # Production server
```

**Deploy anywhere:** Heroku, Railway, Render, AWS, GCP, your own server.

### Option 2: Blocklet Server

Deploy as a Blocklet for additional features (DID auth, PaymentKit, inter-blocklet communication).

```bash
# Build and bundle
npm run bundle

# Deploy to your Blocklet Server
blocklet deploy .blocklet/bundle --endpoint https://your-server.com

# Or upload manually via Blocklet Server dashboard
```

**Blocklet Server Benefits:**
- Component calls between Blocklets (no API keys needed)
- DID-based authentication
- PaymentKit credit billing
- Centralized secrets management
- Automatic HTTPS

### Option 3: Blocklet Store

Once published, install directly from Blocklet Store with one click.

---

## Quick Start

### 1. Configure Environment

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-xxx      # AI content generation

# Email Provider (choose one)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxx

# Or SMTP
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password

# Optional
DEFAULT_FROM_EMAIL=hello@yourcompany.com
DEFAULT_FROM_NAME=Your Company
```

### 2. Start the Server

```bash
npm run dev
```

### 3. Create an API Key

Open http://localhost:3030, go to Settings → API Keys, create a key.

### 4. Send Your First Email

```bash
curl -X POST http://localhost:3030/api/v1/send \
  -H "x-api-key: ek_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "default",
    "intent": "welcome",
    "to": "user@example.com",
    "data": {
      "userName": "John"
    }
  }'
```

### 5. Preview Without Sending

```bash
curl -X POST http://localhost:3030/api/v1/send/preview \
  -H "x-api-key: ek_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "default",
    "intent": "welcome",
    "data": { "userName": "John" }
  }'
```

---

## API Reference

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/send` | POST | Send an email |
| `/api/v1/send/preview` | POST | Preview without sending |
| `/api/v1/send/batch` | POST | Send to multiple recipients |
| `/api/v1/keys` | GET/POST | Manage API keys |
| `/api/v1/keys/:id` | DELETE | Revoke a key |
| `/api/v1/usage` | GET | Usage statistics |
| `/api/v1/brands` | GET | List brands |
| `/api/v1/intents` | GET | List intents |

### Authentication

```bash
# Header (recommended)
x-api-key: ek_live_your_api_key

# Or Bearer token
Authorization: Bearer ek_live_your_api_key
```

### Rate Limits

| Tier | Requests/Min | Daily Limit |
|------|--------------|-------------|
| free | 10 | 50 |
| starter | 60 | 1,000 |
| pro | 300 | 10,000 |
| enterprise | 1,000 | Unlimited |

### Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request |
| 401 | Invalid API key |
| 402 | Insufficient credits |
| 429 | Rate limit exceeded |

---

## Blocklet Integration

When running on Blocklet Server, other Blocklets can call IntentMail directly:

```javascript
import Component from '@blocklet/sdk/lib/component';

// No API key needed - automatic auth
await Component.call('intentmail', 'send', {
  brand: 'default',
  intent: 'welcome',
  to: 'user@example.com',
  data: { userName: 'John' }
});
```

**Available Actions:** `send`, `preview`, `listBrands`, `listIntents`, `getBrand`, `getIntent`

---

## Pricing (When Credits Enabled)

| Operation | Credits |
|-----------|---------|
| Email sent | 0.01 |
| AI input tokens | 0.001 / 1K |
| AI output tokens | 0.003 / 1K |
| Preview | Free |

Enable with: `EMAIL_REQUIRE_CREDITS=true`

---

## Project Structure

```
intentmail/
├── api/                    # Express backend
│   ├── routes/v1/          # API endpoints
│   ├── services/           # Business logic
│   ├── middlewares/        # Auth, rate limit
│   └── libs/               # Config, payment
├── lib/                    # Shared library
│   ├── brands/             # Brand definitions
│   ├── intents/            # Intent definitions
│   └── templates/          # Email templates
├── src/                    # React frontend
├── docs/                   # Documentation
├── blocklet.yml            # Blocklet config
└── blocklet.md             # Store listing
```

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Installation & first email |
| [API Reference](docs/api-reference.md) | Complete API docs |
| [Intents Guide](docs/intents-guide.md) | Creating & customizing intents |
| [Brands Guide](docs/brands-guide.md) | Setting up brand voices |
| [Integration Guide](docs/integration-guide.md) | Framework examples |
| [Configuration](docs/configuration.md) | All environment variables |
| [Troubleshooting](docs/troubleshooting.md) | Common issues |

---

## Integration Examples

### Node.js

```javascript
const response = await fetch('https://your-server/api/v1/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'ek_live_your_api_key'
  },
  body: JSON.stringify({
    brand: 'default',
    intent: 'welcome',
    to: 'user@example.com',
    data: { userName: 'John' }
  })
});
```

### Python

```python
import requests

response = requests.post(
    'https://your-server/api/v1/send',
    headers={'x-api-key': 'ek_live_your_api_key'},
    json={
        'brand': 'default',
        'intent': 'welcome',
        'to': 'user@example.com',
        'data': {'userName': 'John'}
    }
)
```

### cURL

```bash
curl -X POST https://your-server/api/v1/send \
  -H "x-api-key: ek_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"brand":"default","intent":"welcome","to":"user@example.com","data":{"userName":"John"}}'
```

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

Apache-2.0

---

## Credits

Built with [Anthropic Claude](https://anthropic.com), [Blocklet SDK](https://www.arcblock.io/docs/blocklet-developer), [Express](https://expressjs.com), [React](https://reactjs.org), [Resend](https://resend.com), [PaymentKit](https://github.com/blocklet/payment-kit)

---

**Questions?** [Open an issue](https://github.com/robroyhobbs/intent-mail/issues)
