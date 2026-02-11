# Email Provider Webhooks Specification

## 1. Overview

- **Product positioning:** Deliverability tracking — required for production email operations
- **Core concept:** Each email provider sends delivery events (bounce, complaint, delivered, open, click) to provider-specific webhook endpoints. Events are signature-verified, normalized into a common format, and used to update EmailLog status. Complaints auto-unsubscribe recipients.
- **Priority:** P1 (blocks production monitoring and deliverability tracking)
- **Target user:** IntentMail platform (internal), org admins (dashboard visibility)
- **Project scope:** Webhook endpoints per provider + event normalizer + EmailLog updater + complaint auto-unsubscribe

## 2. Architecture

### Current State

```
provider.send() → Email delivered
                  ↓
        No feedback loop
        EmailLog stays as SENT forever
```

### Target State

```
provider.send() → Email delivered → Provider fires webhook
                                         ↓
POST /api/webhooks/{provider}
         ↓
Verify signature (provider-specific)
         ↓
Parse & normalize to WebhookPayload
         ↓
Store raw event in WebhookEvent table
         ↓
Find EmailLog by providerMessageId
         ↓
Update EmailLog status + timestamps
         ↓
If complaint → recordUnsubscribe(orgId, brandId, email, "complaint")
```

### New Files

```
src/lib/email/webhooks/types.ts       ← Normalized event types
src/lib/email/webhooks/processor.ts   ← Update EmailLog + auto-unsubscribe
src/app/api/webhooks/resend/route.ts  ← Verify + normalize + process inline
src/app/api/webhooks/sendgrid/route.ts
src/app/api/webhooks/postmark/route.ts
```

Note: AWS SES webhooks skipped for MVP (SNS verification too complex). Normalizer inlined per-route (no separate abstraction).

### Modified Files

```
(none — uses existing EmailLog, WebhookEvent models and unsubscribe module)
```

## 3. Detailed Behavior

### 3.1 Normalized Event Type

```typescript
export type WebhookEventType =
  | "delivered"
  | "bounced"
  | "complained"
  | "opened"
  | "clicked"
  | "deferred";

export interface NormalizedWebhookEvent {
  provider: "resend" | "sendgrid" | "postmark" | "aws_ses";
  messageId: string; // Provider's message ID
  eventType: WebhookEventType;
  email: string; // Recipient email
  timestamp: Date;
  raw: unknown; // Original payload for debugging
  metadata?: {
    bounceType?: string; // "hard" | "soft"
    bounceReason?: string;
    clickUrl?: string;
    userAgent?: string;
  };
}
```

### 3.2 Provider Event Mapping

| Provider     | Delivered         | Bounced         | Complained         | Opened         | Clicked         |
| ------------ | ----------------- | --------------- | ------------------ | -------------- | --------------- |
| **Resend**   | `email.delivered` | `email.bounced` | `email.complained` | `email.opened` | `email.clicked` |
| **SendGrid** | `delivered`       | `bounce`        | `spamreport`       | `open`         | `click`         |
| **Postmark** | `Delivery`        | `Bounce`        | `SpamComplaint`    | `Open`         | `Click`         |
| **AWS SES**  | `Delivery`        | `Bounce`        | `Complaint`        | `Open`         | `Click`         |

### 3.3 Signature Verification

| Provider     | Method                                                                         | Key Source                                   |
| ------------ | ------------------------------------------------------------------------------ | -------------------------------------------- |
| **Resend**   | Svix webhook signature (`svix-id`, `svix-timestamp`, `svix-signature` headers) | Webhook signing secret from Resend dashboard |
| **SendGrid** | ECDSA signature in `X-Twilio-Email-Event-Webhook-Signature` header             | Verification key from SendGrid settings      |
| **Postmark** | Basic auth or IP allowlist (Postmark doesn't sign webhooks)                    | Shared secret in webhook URL                 |
| **AWS SES**  | SNS message signature verification (X.509 certificate)                         | AWS-provided signing cert URL in payload     |

Verification secrets stored in `EmailProvider.config` JSON field:

```typescript
// Example: Resend provider config
{
  "webhookSecret": "whsec_..."
}

// Example: SendGrid provider config
{
  "webhookVerificationKey": "MFkwEw..."
}

// Example: Postmark provider config
{
  "webhookToken": "random-shared-secret"
}

// Example: AWS SES provider config
{
  "region": "us-east-1"
  // SNS verification uses cert from payload
}
```

### 3.4 EmailLog Status Updates

```typescript
const STATUS_MAP: Record<WebhookEventType, Partial<EmailLog>> = {
  delivered: { status: "DELIVERED", deliveredAt: timestamp },
  bounced: { status: "BOUNCED", bouncedAt: timestamp },
  complained: { status: "COMPLAINED", complainedAt: timestamp },
  opened: { status: "OPENED", openedAt: timestamp },
  clicked: { status: "CLICKED", clickedAt: timestamp },
  deferred: {
    /* no status change, just log */
  },
};
```

Status only advances forward (e.g., DELIVERED can become OPENED, but OPENED cannot become DELIVERED).

### 3.5 Complaint Auto-Unsubscribe

When `eventType === "complained"`:

1. Find the EmailLog by providerMessageId
2. Get `organizationId`, `brandId`, `toEmail` from the EmailLog
3. Call `recordUnsubscribe(organizationId, brandId, toEmail, "complaint")`

### 3.6 Error Handling

| Scenario               | Behavior                                                 |
| ---------------------- | -------------------------------------------------------- |
| Invalid signature      | Return 401, do not process                               |
| Unknown messageId      | Store in WebhookEvent, skip EmailLog update              |
| Duplicate event        | Idempotent update (timestamps only set if null or newer) |
| DB error               | Return 500, provider will retry                          |
| Missing webhook secret | Return 500, log error                                    |

### 3.7 Endpoint Design

All webhook endpoints follow the same pattern:

1. Read raw body (needed for signature verification)
2. Verify signature
3. Parse payload
4. Normalize to common event format
5. Process event (store + update + auto-unsubscribe)
6. Return 200

AWS SES special case: First request may be a SubscriptionConfirmation. Must auto-confirm by fetching the `SubscribeURL`.

## 4. Decisions Summary

| Decision               | Choice                     | Rationale                                    |
| ---------------------- | -------------------------- | -------------------------------------------- |
| Signature verification | Per-provider verification  | Security: prevents spoofed webhook calls     |
| Complaint handling     | Auto-unsubscribe           | Legal compliance, reduces future complaints  |
| Status progression     | Forward-only               | OPENED should not regress to DELIVERED       |
| Event storage          | Raw + normalized           | Raw for debugging, normalized for processing |
| Endpoint structure     | `/api/webhooks/{provider}` | Clean separation, provider-specific parsing  |

## 5. MVP Scope

**In:**

- Webhook endpoints for Resend, SendGrid, Postmark (3 providers)
- Signature verification for all 3
- Event normalization inline per route (no separate abstraction)
- EmailLog status updates
- Complaint auto-unsubscribe
- Raw event storage in WebhookEvent

**Out:**

- AWS SES webhooks (SNS X.509 verification too complex for MVP)
- Webhook registration automation (manual setup in provider dashboard)
- Webhook event replay/retry
- Real-time webhook event streaming (WebSocket)
- Custom webhook event handlers (user-defined)
- Bounce rate monitoring/alerts

## 6. Risks

| Risk                              | Mitigation                                 |
| --------------------------------- | ------------------------------------------ |
| Provider changes webhook format   | Raw event stored for forensics             |
| High volume of open/click events  | Process async, batch updates if needed     |
| Signature verification complexity | Each provider isolated in its own verifier |
| Missing webhook secret in config  | Fail closed (reject), log error            |
