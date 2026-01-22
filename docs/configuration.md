# Configuration Reference

Complete reference for all Email Kit configuration options.

## Environment Variables

### Core Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production) | development | No |
| `PORT` | Server port (non-Blocklet) | 3030 | No |
| `BLOCKLET_PORT` | Server port (Blocklet environment) | Auto | No |

### Email Provider

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EMAIL_PROVIDER` | Provider type: `resend`, `smtp`, `console` | console | No |
| `DEFAULT_FROM_EMAIL` | Sender email address | noreply@example.com | No |
| `DEFAULT_FROM_NAME` | Sender display name | Email Kit | No |

### Resend Provider

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Resend API key | Yes (if using Resend) |

### SMTP Provider

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SMTP_HOST` | SMTP server hostname | - | Yes |
| `SMTP_PORT` | SMTP server port | 587 | No |
| `SMTP_SECURE` | Use TLS (true/false) | false | No |
| `SMTP_USER` | SMTP username | - | Yes |
| `SMTP_PASS` | SMTP password | - | Yes |

### AI Content Generation

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | - | Yes (for AI) |

### Credit-Based Billing

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EMAIL_REQUIRE_CREDITS` | Enable credit billing | false | No |
| `EMAIL_CREDIT_RATE` | Credits per email sent | 0.01 | No |
| `AI_INPUT_TOKEN_RATE` | Credits per 1K input tokens | 0.001 | No |
| `AI_OUTPUT_TOKEN_RATE` | Credits per 1K output tokens | 0.003 | No |

### PaymentKit Integration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PAYMENT_LIVE_MODE` | Use live PaymentKit mode | false | No |
| `PAYMENT_CREDIT_PRICE_ID` | PaymentKit price ID for credits | - | No |
| `PAYMENT_PAGE_URL` | URL for credit purchase page | /payment | No |

### Rate Limiting & Usage

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `USAGE_REPORT_THROTTLE_MS` | Batch reporting interval | 5000 | No |
| `DEFAULT_RATE_LIMIT` | Default requests/minute | 60 | No |

## Rate Limit Tiers

| Tier | Requests/Minute | Daily Limit | Use Case |
|------|-----------------|-------------|----------|
| `free` | 10 | 50 | Testing, development |
| `starter` | 60 | 1,000 | Small applications |
| `pro` | 300 | 10,000 | Production applications |
| `enterprise` | 1,000 | Unlimited | High-volume senders |

## Pricing Configuration

### Credit Calculation

```
Total Credits = (emailCount × EMAIL_CREDIT_RATE)
              + (aiInputTokens / 1000 × AI_INPUT_TOKEN_RATE)
              + (aiOutputTokens / 1000 × AI_OUTPUT_TOKEN_RATE)
```

### Default Pricing

| Operation | Default Rate | Example Cost |
|-----------|--------------|--------------|
| Email sent | 0.01 credits | 100 emails = 1 credit |
| AI input tokens | 0.001 / 1K tokens | 10K tokens = 0.01 credits |
| AI output tokens | 0.003 / 1K tokens | 10K tokens = 0.03 credits |
| Preview | Free | $0 |

### Custom Pricing

Override defaults in environment:

```bash
EMAIL_CREDIT_RATE=0.02        # 2 cents per email
AI_INPUT_TOKEN_RATE=0.002     # $2 per 1M input tokens
AI_OUTPUT_TOKEN_RATE=0.006    # $6 per 1M output tokens
```

## Database Configuration

Email Kit uses SQLite by default. Databases are stored in:

- **Development**: `./data/`
- **Blocklet**: `$BLOCKLET_DATA_DIR/`

### Database Files

| File | Purpose |
|------|---------|
| `email-logs.db` | Email send history |
| `intent-overrides.db` | Marketer customizations |
| `api-keys.db` | API key storage |
| `usage.db` | Usage tracking |

## File Structure

```
email-kit/
├── api/                    # Backend API
│   ├── index.ts           # Express server entry
│   ├── libs/              # Shared utilities
│   │   ├── config.ts      # Configuration
│   │   ├── payment.ts     # PaymentKit integration
│   │   └── usageReporting.ts
│   ├── middlewares/       # Express middleware
│   │   ├── apiKeyAuth.ts
│   │   ├── hybridAuth.ts
│   │   ├── rateLimit.ts
│   │   └── creditCheck.ts
│   ├── routes/            # API routes
│   │   ├── v1/           # Versioned API
│   │   └── *.ts          # Legacy routes
│   └── services/          # Business logic
│       ├── ai.ts          # AI content generation
│       ├── email.ts       # Email sending
│       ├── apiKey.ts      # API key management
│       └── usage.ts       # Usage tracking
├── lib/                    # Shared library
│   ├── brands/            # Brand definitions
│   ├── intents/           # Intent definitions
│   ├── templates/         # Email templates
│   └── types.ts           # TypeScript types
├── src/                    # Frontend (React)
├── docs/                   # Documentation
├── blocklet.yml           # Blocklet configuration
└── blocklet.md            # Store listing
```

## Blocklet Configuration

### blocklet.yml

Key configuration sections:

```yaml
name: email-kit
title: Email Kit
group: dapp

# Entry point
main: .blocklet/api/api/index.js

# Files to include in bundle
files:
  - .blocklet/api/api
  - .blocklet/api/lib
  - .blocklet/client
  - logo.svg
  - blocklet.md

# Web interface
interfaces:
  - type: web
    name: publicUrl
    path: /
    prefix: '*'
    port: BLOCKLET_PORT
    protocol: http

# Capabilities
capabilities:
  clusterMode: false
  component: true            # Enable component calls

# Server requirements
requirements:
  server: '>=1.16.0'
```

### Environment Variables in Blocklet

Set via Blocklet Server dashboard:

1. Go to your Blocklet Server
2. Navigate to Email Kit
3. Click Settings → Environment
4. Add/edit variables
5. Restart the Blocklet

## Security Configuration

### API Key Security

- Keys are stored as SHA-256 hashes
- Only the prefix (`ek_live_abc...`) is stored for display
- Full key is shown only once at creation

### Secure Variables

Mark sensitive variables as `secure: true` in blocklet.yml:

```yaml
environments:
  - name: ANTHROPIC_API_KEY
    secure: true
  - name: RESEND_API_KEY
    secure: true
  - name: SMTP_PASS
    secure: true
```

### CORS Configuration

By default, CORS allows all origins. For production, configure allowed origins in your reverse proxy or modify `api/index.ts`.

## Logging

### Log Levels

Set `LOG_LEVEL` environment variable:

| Level | Description |
|-------|-------------|
| `error` | Errors only |
| `warn` | Warnings and errors |
| `info` | Standard logging (default) |
| `debug` | Verbose debugging |

### Log Output

- **Development**: Console output
- **Production**: Structured JSON logs
- **Blocklet**: Blocklet Server log aggregation
