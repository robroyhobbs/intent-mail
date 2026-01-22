# API Reference

IntentMail provides a RESTful API for sending emails, managing API keys, and tracking usage.

## Authentication

### API Key Authentication

All V1 API endpoints require authentication via API key. Include your key in requests using one of these methods:

```bash
# Header (recommended)
x-api-key: ek_live_your_api_key_here

# Bearer token
Authorization: Bearer ek_live_your_api_key_here

# Query parameter (not recommended for production)
?api_key=ek_live_your_api_key_here
```

### Creating API Keys

API keys are created through the web UI or via the keys endpoint (requires Blocklet SDK authentication):

1. Navigate to Settings → API Keys
2. Click "Create API Key"
3. Choose a tier (free, starter, pro, enterprise)
4. Save the key immediately - it won't be shown again

### Rate Limits

| Tier | Requests/Minute | Daily Limit |
|------|-----------------|-------------|
| Free | 10 | 50 |
| Starter | 60 | 1,000 |
| Pro | 300 | 10,000 |
| Enterprise | 1,000 | Unlimited |

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640000000
```

---

## Send Endpoints

### POST /api/v1/send

Send an email using intent-driven architecture.

**Request:**
```json
{
  "brand": "default",
  "intent": "welcome",
  "to": "user@example.com",
  "data": {
    "userName": "John",
    "companyName": "Acme Inc"
  },
  "subject": "Optional custom subject",
  "slotOverrides": {
    "intro": "Custom intro text"
  }
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| brand | string | Yes | Brand identifier |
| intent | string | Yes | Intent identifier |
| to | string/array | Yes | Recipient email(s) |
| data | object | No | Variables for template |
| subject | string | No | Override auto-generated subject |
| slotOverrides | object | No | Override specific content slots |
| scheduledFor | ISO date | No | Schedule for future delivery |

**Response:**
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "message": "Email sent successfully"
}
```

**Errors:**

| Code | Description |
|------|-------------|
| 400 | Missing required fields |
| 401 | Invalid or missing API key |
| 402 | Insufficient credits |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

### POST /api/v1/send/preview

Preview an email without sending it.

**Request:**
```json
{
  "brand": "default",
  "intent": "welcome",
  "data": {
    "userName": "John"
  }
}
```

**Response:**
```json
{
  "success": true,
  "html": "<html>...</html>",
  "subject": "Welcome to Acme Inc, John!"
}
```

---

### POST /api/v1/send/test

Send a test email (adds [TEST] prefix to subject).

**Request:** Same as `/api/v1/send`

**Response:**
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "message": "Test email sent successfully"
}
```

---

### POST /api/v1/send/batch

Send emails to multiple recipients (max 100).

**Request:**
```json
{
  "brand": "default",
  "intent": "welcome",
  "recipients": [
    "user1@example.com",
    {
      "to": "user2@example.com",
      "data": { "userName": "Jane" }
    }
  ],
  "data": {
    "companyName": "Acme Inc"
  }
}
```

**Response:**
```json
{
  "success": true,
  "sent": 2,
  "failed": 0,
  "results": [
    { "to": "user1@example.com", "success": true, "messageId": "msg_1" },
    { "to": "user2@example.com", "success": true, "messageId": "msg_2" }
  ]
}
```

---

## API Key Management

### GET /api/v1/keys

List all API keys for the authenticated user.

**Response:**
```json
{
  "success": true,
  "keys": [
    {
      "id": "key_abc123",
      "name": "Production Key",
      "keyPrefix": "ek_live_abc...",
      "tier": "pro",
      "status": "active",
      "permissions": ["send", "preview"],
      "rateLimit": 300,
      "lastUsedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/v1/keys

Create a new API key.

**Request:**
```json
{
  "name": "My New Key",
  "tier": "starter",
  "permissions": ["send", "preview"],
  "expiresAt": "2025-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key created. Save this key securely - it will not be shown again.",
  "key": "ek_live_abc123xyz789...",
  "keyPrefix": "ek_live_abc...",
  "id": "key_abc123",
  "tier": "starter",
  "permissions": ["send", "preview"],
  "rateLimit": 60
}
```

---

### GET /api/v1/keys/:id

Get details of a specific API key.

---

### PATCH /api/v1/keys/:id

Update an API key's settings.

**Request:**
```json
{
  "name": "Updated Name",
  "tier": "pro"
}
```

---

### DELETE /api/v1/keys/:id

Revoke an API key.

**Response:**
```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

---

### POST /api/v1/keys/:id/rotate

Rotate an API key (creates new key, revokes old).

**Response:**
```json
{
  "success": true,
  "message": "API key rotated. Save the new key securely.",
  "key": "ek_live_newkey123...",
  "keyPrefix": "ek_live_new...",
  "id": "key_xyz789"
}
```

---

## Usage Tracking

### GET /api/v1/usage

Get usage statistics.

**Query Parameters:**
- `start_date` - Filter from date (ISO format)
- `end_date` - Filter to date (ISO format)

**Response:**
```json
{
  "success": true,
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "stats": {
    "totalEmails": 1250,
    "totalAiTokens": 450000,
    "totalCredits": 15.75,
    "byType": {
      "email_sent": { "count": 1250, "credits": 12.50 },
      "ai_generation": { "count": 1250, "credits": 3.25 }
    },
    "byBrand": {
      "default": { "count": 800, "credits": 10.00 },
      "premium": { "count": 450, "credits": 5.75 }
    }
  }
}
```

---

### GET /api/v1/usage/history

Get detailed usage history.

**Query Parameters:**
- `limit` - Max records (default 50, max 100)
- `offset` - Pagination offset
- `start_date` - Filter from date
- `end_date` - Filter to date
- `type` - Filter by type (email_sent, ai_generation, preview)

**Response:**
```json
{
  "success": true,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1250,
    "hasMore": true
  },
  "records": [
    {
      "id": "usage_abc123",
      "type": "email_sent",
      "brand": "default",
      "intent": "welcome",
      "emailCount": 1,
      "aiInputTokens": 350,
      "aiOutputTokens": 120,
      "usedCredits": 0.0125,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### GET /api/v1/usage/summary

Get a quick usage summary for dashboards.

**Response:**
```json
{
  "success": true,
  "summary": {
    "today": { "emails": 45, "credits": 0.56 },
    "thisMonth": { "emails": 1250, "credits": 15.75 },
    "allTime": { "emails": 8500, "credits": 105.25 }
  }
}
```

---

## Read-Only Endpoints

These endpoints don't require authentication:

### GET /api/v1/brands

List available brands.

### GET /api/v1/intents

List available intents for a brand.

**Query Parameters:**
- `brand` - Filter by brand

### GET /api/v1/templates

List available templates.

### GET /api/v1/health

Health check endpoint.

**Response:**
```json
{
  "success": true,
  "version": "1.0.0",
  "status": "ok"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed explanation"
}
```

### 402 Payment Required

When credit-based billing is enabled and balance is insufficient:

```json
{
  "error": "Insufficient credits",
  "message": "This operation requires 0.0125 credits, but you only have 0.0050 available.",
  "required": 0.0125,
  "available": 0.0050,
  "shortfall": 0.0075,
  "paymentLink": "/payment?did=user123"
}
```

### 429 Rate Limit Exceeded

```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded your rate limit of 60 requests per minute.",
  "retryAfter": 30
}
```
