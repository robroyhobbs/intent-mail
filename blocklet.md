# Email Kit

AI-Native Email System with intent-driven architecture for intelligent, brand-consistent email communications.

## Overview

Email Kit transforms how you send emails by separating **what you want to say** (intents) from **how it looks** (templates) and **who you are** (brands). This layered architecture enables AI to generate contextually appropriate content while maintaining brand consistency.

## Key Features

### Intent-Driven Architecture
- **Pre-defined Intents**: Common email purposes (welcome, password reset, order confirmation, etc.) with structured content slots
- **AI Content Generation**: Claude AI generates subject lines, body content, and CTAs based on intent and context
- **Marketer Customization**: Non-developers can customize intent defaults via intuitive UI without touching code

### Brand Management
- **Multi-Brand Support**: Manage multiple brands with distinct voice, colors, and messaging
- **Brand Voice AI**: AI adapts tone and language to match each brand's personality
- **Centralized Settings**: One place to manage all brand-specific configurations

### Developer API
- **API Key Authentication**: Secure `ek_live_` prefixed API keys with hash-based storage
- **Rate Limiting**: Per-tier limits (free: 10/min, starter: 60/min, pro: 300/min, enterprise: 1000/min)
- **Usage Tracking**: Track emails sent, AI tokens used, and credit consumption
- **Credit-Based Billing**: PaymentKit integration for monetization

### Template System
- **Responsive Templates**: Pre-built email templates optimized for all devices
- **Dynamic Layouts**: Templates adapt content based on intent requirements
- **Content Slots**: Structured placeholders that AI fills intelligently

## Quick Start

### As a Standalone Blocklet

1. Install from Blocklet Store
2. Configure your email provider (Resend or SMTP) via settings
3. Set up your brands and customize intents
4. Start sending intelligent emails via API or UI

### As a Component (Inter-Blocklet Communication)

```javascript
// Call from another blocklet
const response = await Component.call('email-kit', 'send-email', {
  brand: 'your-brand',
  intent: 'welcome',
  data: {
    recipientName: 'John',
    recipientEmail: 'john@example.com',
  }
});
```

### Using the Developer API

```bash
# Create an API key first via the UI, then:
curl -X POST https://your-server/api/v1/send \
  -H "x-api-key: ek_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "your-brand",
    "intent": "welcome",
    "to": "user@example.com",
    "data": { "userName": "John" }
  }'
```

## API Endpoints

### V1 API (Authenticated)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/send` | POST | Send an email |
| `/api/v1/send/preview` | POST | Preview email without sending |
| `/api/v1/send/batch` | POST | Batch send (up to 100 recipients) |
| `/api/v1/send/test` | POST | Send test email with [TEST] prefix |
| `/api/v1/keys` | GET | List your API keys |
| `/api/v1/keys` | POST | Create new API key |
| `/api/v1/keys/:id` | DELETE | Revoke an API key |
| `/api/v1/keys/:id/rotate` | POST | Rotate an API key |
| `/api/v1/usage` | GET | Get usage statistics |
| `/api/v1/usage/history` | GET | Get usage history |
| `/api/v1/usage/summary` | GET | Get usage summary |
| `/api/v1/brands` | GET | List available brands |
| `/api/v1/intents` | GET | List available intents |
| `/api/v1/templates` | GET | List available templates |

### Legacy API (Internal/Blocklet Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/send` | POST | Send email (requires Blocklet auth) |
| `/api/brands` | GET | List brands |
| `/api/intents` | GET | List intents |
| `/api/logs` | GET | View email send history |
| `/api/settings` | GET/POST | Get/update settings |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_PROVIDER` | Email service (resend, smtp, console) | console |
| `RESEND_API_KEY` | Resend API key for email delivery | - |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI generation | - |
| `DEFAULT_FROM_EMAIL` | Default sender email address | noreply@example.com |
| `DEFAULT_FROM_NAME` | Default sender name | Email Kit |
| `SMTP_HOST` | SMTP server host | - |
| `SMTP_PORT` | SMTP server port | 587 |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password | - |

### Credit Billing (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_REQUIRE_CREDITS` | Enable credit-based billing | false |
| `EMAIL_CREDIT_RATE` | Credits per email | 0.01 |
| `AI_INPUT_TOKEN_RATE` | Credits per 1K input tokens | 0.001 |
| `AI_OUTPUT_TOKEN_RATE` | Credits per 1K output tokens | 0.003 |
| `PAYMENT_LIVE_MODE` | Use PaymentKit live mode | false |

### Supported Email Providers
- **Console** (development): Logs emails to console
- **Resend**: Modern email API for developers
- **SMTP**: Any SMTP server

## Pricing Model

When credit billing is enabled:
- **Email sent**: 0.01 credits (100 emails = 1 credit)
- **AI input tokens**: 0.001 credits per 1K tokens
- **AI output tokens**: 0.003 credits per 1K tokens
- **Preview**: Free

## Why Intent-Driven?

Traditional email systems require developers to code every email variation. Legacy AI solutions often produce inconsistent, off-brand content.

**Email Kit's approach:**
1. **Structured Intent** defines purpose and required data
2. **AI generates content** within defined constraints
3. **Brand voice** ensures consistency
4. **Marketer controls** allow refinement without code changes

This creates a sustainable system where AI enhances rather than replaces human judgment.

## License

Apache-2.0
