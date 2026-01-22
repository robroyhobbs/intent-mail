# Email Kit

AI-Native Email System with intent-driven architecture for intelligent, brand-consistent email communications.

## Overview

Email Kit transforms how you send emails by separating **what you want to say** (intents) from **how it looks** (templates) and **who you are** (brands). This layered architecture enables AI to generate contextually appropriate content while maintaining brand consistency.

## Key Features

### Intent-Driven Architecture
- **Pre-defined Intents**: Common email purposes (welcome, password reset, order confirmation, etc.) with structured content slots
- **AI Content Generation**: Automatically generates subject lines, body content, and CTAs based on intent and context
- **Marketer Customization**: Non-developers can customize intent defaults via intuitive UI without touching code

### Brand Management
- **Multi-Brand Support**: Manage multiple brands with distinct voice, colors, and messaging
- **Brand Voice AI**: AI adapts tone and language to match each brand's personality
- **Centralized Settings**: One place to manage all brand-specific configurations

### Template System
- **Responsive Templates**: Pre-built email templates optimized for all devices
- **Dynamic Layouts**: Templates adapt content based on intent requirements
- **Content Slots**: Structured placeholders that AI fills intelligently

### Developer & Marketer Collaboration
- **Developers**: Define intents, templates, and structure in code
- **Marketers**: Customize messaging, CTAs, and prompts via UI
- **Override System**: Database-backed customizations that persist through deployments

## Quick Start

### As a Standalone Blocklet

1. Install from Blocklet Store
2. Configure your email provider (SendGrid, AWS SES, etc.) via settings
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
    // ... other variables
  }
});
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/send` | Send an email using intent + brand |
| `GET /api/brands` | List available brands |
| `GET /api/intents` | List available intents |
| `GET /api/templates` | List available templates |
| `GET /api/logs` | View email send history |
| `GET /api/settings` | Get/update email settings |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_PROVIDER` | Email service (sendgrid, ses, console) | console |
| `SENDGRID_API_KEY` | SendGrid API key | - |
| `AWS_SES_REGION` | AWS SES region | - |
| `OPENAI_API_KEY` | OpenAI API key for AI generation | - |

### Supported Email Providers
- **Console** (development): Logs emails to console
- **SendGrid**: Full-featured email delivery
- **AWS SES**: Amazon Simple Email Service

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
