# AIGNE Hub

> The Unified AI Gateway for the AIGNE Ecosystem

## Product Overview

**Category:** Infrastructure, Revenue
**Status:** Released
**Repo:** https://github.com/AIGNE-io/aigne-hub
**Deployment:** Blocklet Store

### What It Is
AIGNE Hub is a multi-provider AI gateway that manages API keys, usage tracking, and billing across different AI services.

### What It's NOT
- Not an AI model itself
- Not just an API proxy
- Not a chatbot interface

---

## Target Audience

**Primary:** Developers, platform administrators
**Secondary:** Teams managing AI costs, self-hosters

### User Personas

1. **The Platform Admin** - Manages AI access for team
2. **The Developer** - Needs unified API for multiple LLMs
3. **The Self-Hoster** - Wants control over AI infrastructure

---

## Brand Voice & Tone

- **Technical and practical** - It's infrastructure
- **Clear on capabilities** - What it does and doesn't do
- **Security-conscious** - API keys are sensitive
- **Cost-aware** - Billing transparency matters

### Do Say
- "One API, multiple providers"
- "Your AI infrastructure"
- "Usage transparency"
- "Self-hostable and secure"

### Don't Say
- "AI platform" (too vague)
- "Easy" (it's infrastructure)
- "Unlimited" (it's metered)

---

## Tech Stack

```
Frontend: React 19, TypeScript
Backend:  Node.js, Express
Database: SQLite with Sequelize ORM
Auth:     OAuth, role-based access
Deploy:   Blocklet platform
```

---

## Supported Providers

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4, GPT-3.5, etc. |
| Anthropic | Claude 3, Claude 2 |
| Google | Gemini Pro, Gemini Ultra |
| DeepSeek | DeepSeek Chat |
| Ollama | Local models |
| xAI | Grok |
| Doubao | ByteDance models |
| Poe | Multi-model access |
| Amazon Bedrock | AWS models |
| OpenRouter | Multi-provider routing |

---

## Key Features

### Multi-Provider Support
Single API endpoint for all supported LLM providers.

### Credit-Based Billing
- Unified credit system
- Custom pricing per model
- Usage tracking and analytics

### Self-Hosting
- Encrypted API key storage
- Your infrastructure, your control
- No vendor lock-in

### Admin Dashboard
- User management
- Usage analytics
- Cost tracking
- Model playground

### Role-Based Access
- Admin, developer, viewer roles
- Team permission management
- OAuth integration

---

## Deployment

### Via Blocklet Store
1. Search "AIGNE Hub" in Blocklet Store
2. Follow installation wizard
3. Configure AI providers in admin panel

### Configuration
```
Admin Panel → Config → AI Providers
- Add API keys per provider
- Set custom pricing (optional)
- Enable/disable providers
```

---

## API Usage

```typescript
import { AIGNEClient } from '@aigne/aigne-hub';

const client = new AIGNEClient({
  endpoint: 'https://your-hub.example.com',
  apiKey: 'your-api-key'
});

const response = await client.chat({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }]
});
```

---

## Revenue Model

- Credit consumption fees
- Powers all AIGNE ecosystem products
- Self-hostable for enterprise

---

## Related Products

- **AIGNE Framework** - Uses Hub for LLM access
- **ArcSphere** - Consumer product, credits via Hub
- **DocSmith** - Documentation tool, powered by Hub
- **PaymentKit** - Billing integration

---

*Parent guide: See /Users/robroyhobbs/work/CLAUDE.md for company context*
