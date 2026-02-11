// =============================================================================
// WEBHOOK EVENT TYPES - Normalized format for all providers
// =============================================================================

export type WebhookEventType =
  | "delivered"
  | "bounced"
  | "complained"
  | "opened"
  | "clicked"
  | "deferred";

export interface NormalizedWebhookEvent {
  provider: "resend" | "sendgrid" | "postmark";
  messageId: string;
  eventType: WebhookEventType;
  email: string;
  timestamp: Date;
  raw: unknown;
  metadata?: {
    bounceType?: string;
    bounceReason?: string;
    clickUrl?: string;
    userAgent?: string;
  };
}
