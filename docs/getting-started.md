# Getting Started with IntentMail

This guide will help you get IntentMail up and running in your environment.

## Prerequisites

- Node.js 18+
- A Blocklet Server instance (for production deployment)
- An Anthropic API key (for AI content generation)
- An email provider account (Resend recommended, or SMTP server)

## Installation

### Option 1: Install from Blocklet Store

1. Open your Blocklet Server dashboard
2. Go to the Store
3. Search for "IntentMail"
4. Click Install

### Option 2: Deploy from Source

```bash
# Clone the repository
git clone https://github.com/robroyhobbs/intent-mail.git
cd intent-mail

# Install dependencies
npm install

# Build the project
npm run build

# Bundle for deployment
npm run bundle

# Deploy to your Blocklet Server
blocklet deploy .blocklet/bundle
```

## Configuration

### Required Environment Variables

Set these in your Blocklet Server or `.env` file:

```bash
# AI Content Generation (required for AI features)
ANTHROPIC_API_KEY=sk-ant-...

# Email Provider (choose one)
EMAIL_PROVIDER=resend  # or: smtp, console

# For Resend
RESEND_API_KEY=re_...

# For SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password

# Sender defaults
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
DEFAULT_FROM_NAME=Your Company
```

### Optional: Credit-Based Billing

```bash
EMAIL_REQUIRE_CREDITS=true
EMAIL_CREDIT_RATE=0.01
PAYMENT_LIVE_MODE=false
```

## Your First Email

### Using the Web UI

1. Navigate to IntentMail in your browser
2. Go to the "Send" tab
3. Select a brand and intent
4. Fill in the recipient and data fields
5. Click "Preview" to see the AI-generated email
6. Click "Send" to deliver

### Using the API

First, create an API key:

1. Go to Settings → API Keys
2. Click "Create API Key"
3. Save the key securely (it won't be shown again)

Then send an email:

```bash
curl -X POST https://your-server.com/api/v1/send \
  -H "x-api-key: ek_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "default",
    "intent": "welcome",
    "to": "user@example.com",
    "data": {
      "userName": "John",
      "companyName": "Acme Inc"
    }
  }'
```

### Using Component Calls (Blocklet-to-Blocklet)

```javascript
const { Component } = require('@blocklet/sdk');

const result = await Component.call('intentmail', 'send-email', {
  brand: 'default',
  intent: 'welcome',
  data: {
    recipientEmail: 'user@example.com',
    userName: 'John'
  }
});
```

## Understanding the Architecture

IntentMail uses a layered architecture:

```
┌─────────────────────────────────────────┐
│            Your Application             │
├─────────────────────────────────────────┤
│   Intent Layer (what you want to say)   │
│   - welcome, password-reset, invoice    │
├─────────────────────────────────────────┤
│   Brand Layer (who you are)             │
│   - voice, colors, logo                 │
├─────────────────────────────────────────┤
│   Template Layer (how it looks)         │
│   - layouts, slots, styles              │
├─────────────────────────────────────────┤
│   AI Layer (content generation)         │
│   - Claude generates contextual content │
└─────────────────────────────────────────┘
```

## Next Steps

- [API Reference](./api-reference.md) - Full API documentation
- [Intents Guide](./intents-guide.md) - Understanding and customizing intents
- [Brands Guide](./brands-guide.md) - Setting up your brands
- [Integration Guide](./integration-guide.md) - Integrating with your apps
