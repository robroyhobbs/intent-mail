# Email Kit

AI-Native Intent-Driven Email System

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

Email Kit transforms how you send emails by separating **what you want to say** (intents) from **how it looks** (templates) and **who you are** (brands). AI generates contextually appropriate content while maintaining brand consistency.

## Features

- **Intent-Driven Architecture** - Define email purposes, let AI handle the words
- **AI Content Generation** - Claude generates subject lines, body content, and CTAs
- **Multi-Brand Support** - Manage distinct brand voices and visual identities
- **Developer API** - RESTful API with API key auth, rate limiting, usage tracking
- **Credit-Based Billing** - PaymentKit integration for monetization
- **Blocklet Ready** - Deploy to Blocklet Server or use standalone

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

## Architecture

```
┌─────────────────────────────────────────┐
│            Your Application             │
├─────────────────────────────────────────┤
│   Intent Layer (what you want to say)   │
│   welcome, password-reset, invoice...   │
├─────────────────────────────────────────┤
│   Brand Layer (who you are)             │
│   voice, colors, logo                   │
├─────────────────────────────────────────┤
│   Template Layer (how it looks)         │
│   layouts, slots, styles                │
├─────────────────────────────────────────┤
│   AI Layer (content generation)         │
│   Claude generates contextual content   │
└─────────────────────────────────────────┘
```

## API Endpoints

### V1 API (API Key Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/send` | POST | Send email |
| `/api/v1/send/preview` | POST | Preview email |
| `/api/v1/send/batch` | POST | Send to multiple recipients |
| `/api/v1/keys` | GET/POST | Manage API keys |
| `/api/v1/usage` | GET | Usage statistics |
| `/api/v1/brands` | GET | List brands |
| `/api/v1/intents` | GET | List intents |

## Configuration

### Required

```bash
# AI Generation
ANTHROPIC_API_KEY=sk-ant-...

# Email Provider (choose one)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...

# Or SMTP
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_USER=user
SMTP_PASS=pass
```

### Optional

```bash
# Billing
EMAIL_REQUIRE_CREDITS=true
EMAIL_CREDIT_RATE=0.01

# Defaults
DEFAULT_FROM_EMAIL=noreply@example.com
DEFAULT_FROM_NAME=Your Company
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
```

## Blocklet Deployment

Email Kit is designed to run as a Blocklet on Blocklet Server:

1. Build and bundle: `npm run bundle`
2. Upload to your Blocklet Server
3. Configure environment variables
4. Start using!

Or install directly from Blocklet Store.

## Project Structure

```
email-kit/
├── api/                 # Backend (Express)
│   ├── routes/v1/      # V1 API routes
│   ├── services/       # Business logic
│   └── middlewares/    # Auth, rate limit, etc.
├── lib/                 # Shared library
│   ├── brands/         # Brand definitions
│   ├── intents/        # Intent definitions
│   └── templates/      # Email templates
├── src/                 # Frontend (React)
├── docs/               # Documentation
└── blocklet.yml        # Blocklet config
```

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
