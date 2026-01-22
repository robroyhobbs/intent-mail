# Email Kit

**AI-Native Intent-Driven Email System**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

---

Email Kit transforms how you send emails by separating **what you want to say** (intents) from **how it looks** (templates) and **who you are** (brands). AI generates contextually appropriate content while maintaining brand consistency.

```
"Send a welcome email to john@example.com"
     ↓
AI generates personalized subject, body, and CTA
     ↓
Email sent with your brand voice and style
```

## Why Email Kit?

| Traditional Email | Email Kit |
|-------------------|-----------|
| Write copy for every email | Define intent once, AI handles the words |
| Inconsistent brand voice | Consistent voice across all communications |
| Hardcoded templates | Dynamic, context-aware content |
| One-size-fits-all | Personalized for each recipient |

## Features

- **Intent-Driven Architecture** - Define email purposes (welcome, password-reset, invoice), let AI handle the words
- **AI Content Generation** - Claude generates subject lines, body content, and CTAs based on context
- **Multi-Brand Support** - Manage distinct brand voices, colors, and visual identities
- **Developer API** - RESTful V1 API with API key authentication
- **Rate Limiting** - Per-key rate limits with tier-based quotas
- **Usage Tracking** - Monitor email sends, AI token usage, and costs
- **Credit-Based Billing** - PaymentKit integration for monetization (optional)
- **Blocklet Ready** - Deploy to Blocklet Server or run standalone

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/robroyhobbs/intent-mail.git
cd intent-mail

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### Environment Setup

```bash
# Required: AI Generation
ANTHROPIC_API_KEY=sk-ant-...

# Required: Email Provider (choose one)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...

# Or use SMTP
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
```

### Send Your First Email

```bash
# 1. Create an API key via the web UI at http://localhost:3030

# 2. Send an email
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

### Preview Without Sending

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

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                          │
│                                                              │
│   POST /api/v1/send                                         │
│   { brand: "acme", intent: "welcome", to: "...", data: {} } │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Email Kit                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Intent    │  │    Brand    │  │  Template   │         │
│  │   Layer     │  │    Layer    │  │   Layer     │         │
│  │             │  │             │  │             │         │
│  │  welcome    │  │  voice      │  │  layouts    │         │
│  │  invoice    │  │  colors     │  │  slots      │         │
│  │  alert      │  │  logo       │  │  styles     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    AI Layer                          │   │
│  │         Claude generates contextual content          │   │
│  │    subject lines • body copy • CTAs • greetings     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Email Provider                            │
│              Resend • SMTP • Console (dev)                  │
└─────────────────────────────────────────────────────────────┘
```

## API Reference

### V1 API (API Key Auth)

All V1 endpoints require an API key via `x-api-key` header or `Authorization: Bearer <key>`.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/send` | POST | Send an email |
| `/api/v1/send/preview` | POST | Preview email without sending |
| `/api/v1/send/batch` | POST | Send to multiple recipients |
| `/api/v1/keys` | GET | List your API keys |
| `/api/v1/keys` | POST | Create a new API key |
| `/api/v1/keys/:id` | DELETE | Revoke an API key |
| `/api/v1/usage` | GET | Get usage statistics |
| `/api/v1/usage/history` | GET | Get usage history |
| `/api/v1/brands` | GET | List available brands |
| `/api/v1/intents` | GET | List available intents |

### Rate Limits

| Tier | Requests/Minute | Daily Limit | Use Case |
|------|-----------------|-------------|----------|
| `free` | 10 | 50 | Testing, development |
| `starter` | 60 | 1,000 | Small applications |
| `pro` | 300 | 10,000 | Production apps |
| `enterprise` | 1,000 | Unlimited | High-volume senders |

### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request (invalid parameters) |
| 401 | Invalid or missing API key |
| 402 | Insufficient credits |
| 429 | Rate limit exceeded |
| 500 | Server error |

## Pricing (When Credits Enabled)

| Operation | Credits | Example |
|-----------|---------|---------|
| Email sent | 0.01 | 100 emails = 1 credit |
| AI input tokens | 0.001 / 1K | 10K tokens = 0.01 credits |
| AI output tokens | 0.003 / 1K | 10K tokens = 0.03 credits |
| Preview | Free | Unlimited previews |

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Installation, setup, first email |
| [API Reference](docs/api-reference.md) | Complete API documentation |
| [Intents Guide](docs/intents-guide.md) | Understanding and customizing intents |
| [Brands Guide](docs/brands-guide.md) | Setting up brand voices |
| [Integration Guide](docs/integration-guide.md) | Framework examples, best practices |
| [Configuration](docs/configuration.md) | Environment variables, settings |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and solutions |

## Configuration

### Required Variables

```bash
# AI Generation
ANTHROPIC_API_KEY=sk-ant-...

# Email Provider
EMAIL_PROVIDER=resend          # resend, smtp, or console
RESEND_API_KEY=re_...          # If using Resend
```

### Optional Variables

```bash
# Billing (optional)
EMAIL_REQUIRE_CREDITS=true
EMAIL_CREDIT_RATE=0.01
AI_INPUT_TOKEN_RATE=0.001
AI_OUTPUT_TOKEN_RATE=0.003

# Defaults
DEFAULT_FROM_EMAIL=noreply@example.com
DEFAULT_FROM_NAME=Your Company
DEFAULT_RATE_LIMIT=60

# Logging
LOG_LEVEL=info                 # error, warn, info, debug
```

See [Configuration Reference](docs/configuration.md) for all options.

## Development

```bash
# Install dependencies
npm install

# Start dev server (API + Client)
npm run dev

# Build for production
npm run build

# Bundle for Blocklet deployment
npm run bundle

# Deploy to Blocklet Server
npm run deploy

# Run linting
npm run lint
```

## Project Structure

```
email-kit/
├── api/                    # Backend (Express + TypeScript)
│   ├── index.ts           # Server entry point
│   ├── libs/              # Shared utilities
│   │   ├── config.ts      # Configuration
│   │   ├── payment.ts     # PaymentKit integration
│   │   └── usageReporting.ts
│   ├── middlewares/       # Express middleware
│   │   ├── apiKeyAuth.ts  # API key validation
│   │   ├── hybridAuth.ts  # Dual auth support
│   │   ├── rateLimit.ts   # Rate limiting
│   │   └── creditCheck.ts # Credit verification
│   ├── routes/v1/         # V1 API routes
│   │   ├── send.ts        # Email sending
│   │   ├── keys.ts        # API key management
│   │   └── usage.ts       # Usage statistics
│   └── services/          # Business logic
│       ├── ai.ts          # AI content generation
│       ├── email.ts       # Email sending
│       ├── apiKey.ts      # API key management
│       └── usage.ts       # Usage tracking
├── lib/                    # Shared library
│   ├── brands/            # Brand definitions
│   ├── intents/           # Intent definitions
│   └── templates/         # Email templates
├── src/                    # Frontend (React)
├── docs/                   # Documentation
├── blocklet.yml           # Blocklet configuration
└── blocklet.md            # Blocklet Store listing
```

## Blocklet Deployment

Email Kit is designed to run as a Blocklet on Blocklet Server:

```bash
# Build and bundle
npm run bundle

# Deploy to your server
npm run deploy
```

Or install directly from [Blocklet Store](https://store.blocklet.dev).

### Blocklet Features

- **Component Calls** - Other Blocklets can call Email Kit directly
- **DID Authentication** - Integrated with Blocklet Server auth
- **PaymentKit** - Credit-based billing when enabled
- **Automatic HTTPS** - Secure by default

## Integration Examples

### Node.js / Express

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
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'ek_live_your_api_key'
    },
    json={
        'brand': 'default',
        'intent': 'welcome',
        'to': 'user@example.com',
        'data': {'userName': 'John'}
    }
)
```

See [Integration Guide](docs/integration-guide.md) for more examples.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a Pull Request

## License

Apache-2.0

## Credits

Built with:
- [Anthropic Claude](https://anthropic.com) - AI content generation
- [Blocklet SDK](https://www.arcblock.io/docs/blocklet-developer) - Deployment platform
- [Express](https://expressjs.com) - Web framework
- [React](https://reactjs.org) - Frontend UI
- [Resend](https://resend.com) - Email delivery
- [PaymentKit](https://github.com/blocklet/payment-kit) - Credit-based billing

---

**Questions?** Open an issue at [GitHub](https://github.com/robroyhobbs/intent-mail/issues)
