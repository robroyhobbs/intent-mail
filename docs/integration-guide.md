# Integration Guide

This guide covers how to integrate IntentMail with your applications, whether you're using the REST API, Blocklet Component calls, or building a custom integration.

## Integration Methods

| Method | Best For | Auth Required |
|--------|----------|---------------|
| REST API (v1) | External apps, microservices | API Key |
| Component Call | Other Blocklets on same server | Blocklet SDK |
| Legacy API | Internal UI, admin tools | Blocklet Session |

## REST API Integration

### Basic Setup

```javascript
// email-client.js
const EMAILKIT_URL = 'https://your-server.com';
const API_KEY = 'ek_live_your_api_key';

async function sendEmail(options) {
  const response = await fetch(`${EMAILKIT_URL}/api/v1/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send email');
  }

  return response.json();
}

// Usage
await sendEmail({
  brand: 'default',
  intent: 'welcome',
  to: 'user@example.com',
  data: { userName: 'John' }
});
```

### TypeScript Client

```typescript
// intentmail-client.ts
interface SendEmailOptions {
  brand: string;
  intent: string;
  to: string | string[];
  data?: Record<string, unknown>;
  subject?: string;
  slotOverrides?: Record<string, string>;
  scheduledFor?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailKitClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    return this.request('/api/v1/send', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  async preview(options: Omit<SendEmailOptions, 'to'>): Promise<{
    html: string;
    subject: string;
  }> {
    return this.request('/api/v1/send/preview', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  async sendBatch(options: {
    brand: string;
    intent: string;
    recipients: Array<string | { to: string; data?: Record<string, unknown> }>;
    data?: Record<string, unknown>;
  }): Promise<{
    sent: number;
    failed: number;
    results: Array<{ to: string; success: boolean; messageId?: string }>;
  }> {
    return this.request('/api/v1/send/batch', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  async getUsage(): Promise<{
    totalEmails: number;
    totalCredits: number;
  }> {
    return this.request('/api/v1/usage');
  }
}

// Usage
const client = new EmailKitClient(
  'https://your-server.com',
  'ek_live_your_api_key'
);

await client.send({
  brand: 'default',
  intent: 'welcome',
  to: 'user@example.com',
  data: { userName: 'John' }
});
```

## Blocklet Component Integration

For Blocklet-to-Blocklet communication on the same server:

### Setup

Ensure IntentMail is installed on your Blocklet Server and note its component name (usually `intentmail`).

### Sending Emails

```javascript
const { Component } = require('@blocklet/sdk');

// Send a single email
async function sendWelcomeEmail(user) {
  try {
    const result = await Component.call('intentmail', 'send-email', {
      brand: 'your-brand',
      intent: 'welcome',
      data: {
        recipientEmail: user.email,
        userName: user.name,
        activationLink: `https://yourapp.com/activate/${user.token}`
      }
    });

    console.log('Email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
```

### Available Component Actions

| Action | Description |
|--------|-------------|
| `send-email` | Send a single email |
| `preview-email` | Preview without sending |
| `get-brands` | List available brands |
| `get-intents` | List intents for a brand |

### Component Call vs REST API

| Feature | Component Call | REST API |
|---------|---------------|----------|
| Authentication | Automatic (Blocklet SDK) | API Key required |
| Rate Limiting | No | Yes |
| Usage Tracking | No | Yes |
| Credit Billing | No | Yes (when enabled) |
| Best for | Internal services | External integrations |

## Framework Examples

### Express.js

```javascript
const express = require('express');
const EmailKitClient = require('./intentmail-client');

const app = express();
const emailClient = new EmailKitClient(
  process.env.EMAILKIT_URL,
  process.env.EMAILKIT_API_KEY
);

app.post('/signup', async (req, res) => {
  const { email, name } = req.body;

  // Create user in database
  const user = await createUser({ email, name });

  // Send welcome email
  await emailClient.send({
    brand: 'default',
    intent: 'welcome',
    to: email,
    data: {
      userName: name,
      verificationLink: `https://yourapp.com/verify/${user.verificationToken}`
    }
  });

  res.json({ success: true, userId: user.id });
});
```

### Next.js API Route

```typescript
// pages/api/send-notification.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const EMAILKIT_URL = process.env.EMAILKIT_URL!;
const API_KEY = process.env.EMAILKIT_API_KEY!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, notificationType, data } = req.body;

  // Get user from database
  const user = await getUser(userId);

  // Send email via IntentMail
  const response = await fetch(`${EMAILKIT_URL}/api/v1/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({
      brand: 'default',
      intent: notificationType,
      to: user.email,
      data: {
        userName: user.name,
        ...data
      }
    })
  });

  const result = await response.json();

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  res.json({ success: true, messageId: result.messageId });
}
```

### Python

```python
import requests

class EmailKitClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            'Content-Type': 'application/json',
            'x-api-key': api_key
        }

    def send(self, brand: str, intent: str, to: str, data: dict = None):
        response = requests.post(
            f'{self.base_url}/api/v1/send',
            headers=self.headers,
            json={
                'brand': brand,
                'intent': intent,
                'to': to,
                'data': data or {}
            }
        )
        response.raise_for_status()
        return response.json()

    def preview(self, brand: str, intent: str, data: dict = None):
        response = requests.post(
            f'{self.base_url}/api/v1/send/preview',
            headers=self.headers,
            json={
                'brand': brand,
                'intent': intent,
                'data': data or {}
            }
        )
        response.raise_for_status()
        return response.json()

# Usage
client = EmailKitClient(
    'https://your-server.com',
    'ek_live_your_api_key'
)

result = client.send(
    brand='default',
    intent='welcome',
    to='user@example.com',
    data={'userName': 'John'}
)
```

## Webhook Integration

IntentMail can trigger webhooks on email events (coming soon):

```javascript
// Your webhook endpoint
app.post('/webhooks/email', (req, res) => {
  const { event, data } = req.body;

  switch (event) {
    case 'email.sent':
      console.log('Email sent:', data.messageId);
      break;
    case 'email.delivered':
      console.log('Email delivered:', data.messageId);
      break;
    case 'email.bounced':
      console.log('Email bounced:', data.messageId, data.reason);
      break;
  }

  res.status(200).send('OK');
});
```

## Error Handling

### Handling API Errors

```typescript
async function sendEmailSafely(options: SendEmailOptions) {
  try {
    return await emailClient.send(options);
  } catch (error) {
    if (error.status === 402) {
      // Insufficient credits
      console.log('Need more credits:', error.paymentLink);
      // Redirect user to payment or queue for retry
    } else if (error.status === 429) {
      // Rate limited
      const retryAfter = error.retryAfter || 60;
      console.log(`Rate limited, retry in ${retryAfter}s`);
      // Queue for retry
    } else if (error.status === 400) {
      // Bad request - check your data
      console.error('Invalid request:', error.message);
    } else {
      // Server error - retry with backoff
      console.error('Server error:', error.message);
    }
    throw error;
  }
}
```

### Retry Logic

```typescript
async function sendWithRetry(
  options: SendEmailOptions,
  maxRetries = 3
): Promise<SendEmailResult> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await emailClient.send(options);
    } catch (error) {
      lastError = error;

      // Don't retry client errors
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      // Calculate backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

## Security Best Practices

1. **Store API keys securely** - Use environment variables, never commit to code
2. **Use HTTPS** - Always connect over HTTPS in production
3. **Validate input** - Sanitize user data before including in emails
4. **Monitor usage** - Track your API usage for anomalies
5. **Rotate keys** - Periodically rotate API keys, especially after team changes
