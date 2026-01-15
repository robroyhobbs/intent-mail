# PaymentKit

> Vendor SDK for payment integration with signature verification

## Product Overview

**Category:** Infrastructure, Revenue Critical
**Status:** Released
**Repo:** https://github.com/blocklet/payment-kit
**Package:** `@blocklet/payment-vendor`
**License:** Apache-2.0

### What It Is
PaymentKit is the vendor SDK for integrating with ArcBlock's payment system. It provides signature verification, authentication middleware, and secure communication between brokers and vendors.

### What It's NOT
- Not a payment processor (it integrates with one)
- Not a wallet
- Not end-user facing

---

## Target Audience

**Primary:** Developers building vendor integrations
**Secondary:** Platform operators, service providers

### User Personas

1. **The Vendor Developer** - Building services that receive payment requests
2. **The Broker Developer** - Building platforms that send payment requests (like Payment Kit itself)
3. **The Platform Operator** - Managing trusted vendor relationships

---

## Brand Voice & Tone

- **Technical and security-focused** - This is infrastructure
- **Precise** - Security matters, no ambiguity
- **Integration-focused** - How to connect, not why
- **Trust-conscious** - Whitelist management, signature verification

### Do Say
- "Secure vendor integration"
- "Ed25519 signature verification"
- "Request authentication"
- "Whitelist management"

### Don't Say
- "Easy integration" (security isn't easy)
- "Payment processing" (it's not that)
- "Wallet" (it's not that either)

---

## Tech Stack

```
Language:   TypeScript
Framework:  Express middleware
Crypto:     Ed25519 signatures
Auth:       @ocap/wallet
SDK:        @blocklet/sdk
```

---

## Installation

```bash
npm install @blocklet/payment-vendor
```

---

## Integration Patterns

### Two Roles

| Role | Identity | Responsibility |
|------|----------|----------------|
| **Vendor** | Service provider | Receives and processes delivery requests |
| **Broker** | Payment Kit, platforms | Sends signed delivery requests |

### Vendor Side (Receiving Requests)

```typescript
import VendorSDK from '@blocklet/payment-vendor';
import express from 'express';

const app = express();

// 1. Configure trusted brokers
VendorSDK.setBrokers([
  {
    id: 'payment-kit',
    name: 'Payment Kit Service',
    publicKey: process.env.PAYMENT_KIT_PUBLIC_KEY,
    status: 'active',
    rateLimit: 100
  }
]);

// 2. Apply authentication middleware
app.use('/api/vendor', VendorSDK.middleware.ensureAuth());

// 3. Handle delivery requests
app.post('/api/vendor/deliveries', async (req, res) => {
  const { userInfo, deliveryParams } = req.body;
  // Process the delivery...
  res.json({ success: true, data: { instanceId: '...' } });
});
```

### Broker Side (Sending Requests)

```typescript
import { VendorAuth } from '@blocklet/payment-vendor';

// Sign and send request
const deliveryRequest = {
  path: '/api/vendor/deliveries',
  method: 'POST',
  timestamp: Date.now(),
  userInfo: { userDid: '...', email: '...' },
  deliveryParams: { instanceName: '...', productId: '...' }
};

const { headers, body } = VendorAuth.signRequestWithHeaders(deliveryRequest);

const response = await fetch('https://vendor.example.com/api/vendor/deliveries', {
  method: 'POST',
  headers,
  body
});
```

---

## Available Middleware

| Middleware | Purpose |
|------------|---------|
| `ensureAuth()` | Verify request signatures |
| `rateLimiter()` | Prevent API abuse |
| `healthCheck()` | System status endpoint |
| `errorHandler` | Unified error responses |

---

## Key Concepts

### Broker Whitelist
Only trusted brokers can send requests. Configure via `setBrokers()`.

### Signature Verification
All requests must be signed with Ed25519. Prevents tampering and verifies origin.

### Timestamp Validation
Requests expire after 5 minutes. Prevents replay attacks.

### Delivery Request
Standard format for requesting service delivery (instance creation, resource allocation).

---

## Security Best Practices

1. **HTTPS only** - Never accept HTTP requests
2. **Rotate keys** - Update keys quarterly
3. **Monitor usage** - Watch for anomalies
4. **Validate everything** - Don't trust, verify

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "Broker not in whitelist" | Unknown broker ID | Add to whitelist |
| "Missing signature header" | No x-broker-vendor-sig | Use signRequestWithHeaders() |
| "Request timestamp too old" | >5 min old | Use current timestamp |
| "Invalid signature" | Key mismatch | Verify public key config |

---

## Related Products

- **AIGNE Hub** - Credit management
- **Launcher** - Uses PaymentKit for provisioning
- **Blocklet Server** - Deployment target

---

*Parent guide: See /Users/robroyhobbs/work/CLAUDE.md for company context*
