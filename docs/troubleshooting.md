# Troubleshooting Guide

Solutions for common issues with IntentMail.

## Common Issues

### Emails Not Sending

#### Symptom
API returns success but emails aren't delivered.

#### Possible Causes

1. **Console provider active**
   ```bash
   # Check your provider
   echo $EMAIL_PROVIDER
   # Should be: resend or smtp, not console
   ```

2. **Invalid sender address**
   - Resend requires verified domains
   - SMTP may reject unauthorized senders

3. **API key issues**
   - Resend: Check key starts with `re_`
   - Verify key has send permissions

#### Solutions

```bash
# Set correct provider
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_actual_key

# Or for SMTP
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
```

---

### AI Content Not Generating

#### Symptom
Emails send but with placeholder content instead of AI-generated text.

#### Possible Causes

1. **Missing API key**
   ```bash
   echo $ANTHROPIC_API_KEY  # Should not be empty
   ```

2. **Invalid API key**
   - Check key starts with `sk-ant-`
   - Verify key hasn't expired

3. **API quota exceeded**
   - Check your Anthropic dashboard for usage limits

#### Solutions

```bash
# Set valid Anthropic key
ANTHROPIC_API_KEY=sk-ant-your_key_here

# Verify it's being read
curl http://localhost:3030/api/health
# Look for: "ai": { "enabled": true }
```

---

### API Key Authentication Fails

#### Symptom
Getting 401 Unauthorized with valid API key.

#### Possible Causes

1. **Wrong header format**
   ```bash
   # Correct
   -H "x-api-key: ek_live_abc123"

   # Also correct
   -H "Authorization: Bearer ek_live_abc123"

   # Wrong
   -H "api-key: ek_live_abc123"
   ```

2. **Key revoked or expired**
   - Check key status in Settings → API Keys

3. **Key prefix mismatch**
   - Keys must start with `ek_live_`

#### Solutions

```bash
# Test with correct header
curl -X POST https://your-server/api/v1/send \
  -H "x-api-key: ek_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{"brand":"default","intent":"welcome","to":"test@example.com","data":{}}'
```

---

### Rate Limit Exceeded (429)

#### Symptom
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 30
}
```

#### Possible Causes

1. **Too many requests**
   - Free tier: 10/minute
   - Check your tier limits

2. **Batch operations counting individually**
   - Each email in batch counts toward limit

#### Solutions

1. **Upgrade tier**
   - Update your API key to higher tier

2. **Implement backoff**
   ```javascript
   if (response.status === 429) {
     const retryAfter = response.headers.get('Retry-After') || 60;
     await sleep(retryAfter * 1000);
     // Retry request
   }
   ```

3. **Spread requests**
   - Don't burst all emails at once
   - Use batch endpoint for multiple recipients

---

### Insufficient Credits (402)

#### Symptom
```json
{
  "error": "Insufficient credits",
  "required": 0.0125,
  "available": 0.0050,
  "paymentLink": "/payment?did=user123"
}
```

#### Solutions

1. **Add credits**
   - Visit the payment link
   - Purchase credits via PaymentKit

2. **Disable credit billing** (development)
   ```bash
   EMAIL_REQUIRE_CREDITS=false
   ```

3. **Check usage**
   ```bash
   curl https://your-server/api/v1/usage \
     -H "x-api-key: your_key"
   ```

---

### Brand or Intent Not Found

#### Symptom
```json
{
  "error": "Brand not found: unknown-brand"
}
```

#### Solutions

1. **List available brands**
   ```bash
   curl https://your-server/api/v1/brands
   ```

2. **List available intents**
   ```bash
   curl https://your-server/api/v1/intents?brand=default
   ```

3. **Check spelling**
   - Brand and intent IDs are case-sensitive

---

### Database Errors

#### Symptom
```
Error: SQLITE_CANTOPEN: unable to open database file
```

#### Possible Causes

1. **Permission issues**
   - Data directory not writable

2. **Disk full**
   - Check available disk space

3. **Path issues**
   - In Blocklet, use `BLOCKLET_DATA_DIR`

#### Solutions

```bash
# Check data directory
ls -la ./data/

# Check permissions
chmod 755 ./data/
chmod 644 ./data/*.db

# In Blocklet, check
ls -la $BLOCKLET_DATA_DIR/
```

---

### Component Calls Not Working

#### Symptom
```
Error: Component intentmail not found
```

#### Possible Causes

1. **IntentMail not installed**
   - Verify it's running on same Blocklet Server

2. **Wrong component name**
   - Check exact component ID

3. **Component capability disabled**
   - Check blocklet.yml has `component: true`

#### Solutions

```javascript
// List available components
const { Component } = require('@blocklet/sdk');
const components = await Component.list();
console.log(components);

// Use correct component name
await Component.call('intentmail', 'send-email', { ... });
```

---

## Debugging Tips

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm run dev
```

### Check Health Endpoint

```bash
curl http://localhost:3030/api/health | jq
```

Expected response:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "features": {
    "apiKeyAuth": true,
    "rateLimiting": true,
    "usageTracking": true,
    "creditBilling": false
  },
  "payment": {
    "enabled": false,
    "mode": "disabled"
  }
}
```

### Test Email Provider

```bash
# Console provider (development)
EMAIL_PROVIDER=console npm run dev
# Then send a test - check console output

# Resend
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@yourdomain.com","to":"you@example.com","subject":"Test","text":"Test"}'
```

### View Email Logs

```bash
# Via API
curl http://localhost:3030/api/logs

# Via database
sqlite3 ./data/email-logs.db "SELECT * FROM logs ORDER BY sentAt DESC LIMIT 10;"
```

### Test AI Generation

```bash
curl -X POST http://localhost:3030/api/v1/send/preview \
  -H "x-api-key: your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "default",
    "intent": "welcome",
    "data": {"userName": "Test User"}
  }'
```

---

## Getting Help

### Check Logs

- **Blocklet**: Blocklet Server → Logs
- **Local**: Console output or `./logs/`

### Report Issues

1. Gather information:
   - IntentMail version
   - Node.js version
   - Error messages
   - Steps to reproduce

2. Open an issue:
   - GitHub: https://github.com/robroyhobbs/intent-mail/issues

### Community Support

- Blocklet Community forums
- ArcBlock Discord
