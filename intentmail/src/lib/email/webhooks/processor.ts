// =============================================================================
// WEBHOOK EVENT PROCESSOR
// Stores raw events, updates EmailLog, auto-unsubscribes on complaints
// =============================================================================

import { db } from "@/lib/db";
import { recordUnsubscribe } from "@/lib/email/unsubscribe";
import type { NormalizedWebhookEvent, WebhookEventType } from "./types";
import type { EmailStatus } from "@prisma/client";

// Status can only advance forward in this order
const STATUS_ORDER: EmailStatus[] = [
  "PENDING",
  "QUEUED",
  "SENT",
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "BOUNCED",
  "COMPLAINED",
  "FAILED",
];

function canAdvanceStatus(
  current: EmailStatus,
  next: EmailStatus,
): boolean {
  // Bounce and complaint can always override (they're terminal negative states)
  if (next === "BOUNCED" || next === "COMPLAINED" || next === "FAILED") {
    return true;
  }
  const currentIdx = STATUS_ORDER.indexOf(current);
  const nextIdx = STATUS_ORDER.indexOf(next);
  return nextIdx > currentIdx;
}

const EVENT_TO_STATUS: Record<WebhookEventType, EmailStatus | null> = {
  delivered: "DELIVERED",
  bounced: "BOUNCED",
  complained: "COMPLAINED",
  opened: "OPENED",
  clicked: "CLICKED",
  deferred: null,
};

const EVENT_TO_TIMESTAMP_FIELD: Record<WebhookEventType, string | null> = {
  delivered: "deliveredAt",
  bounced: "bouncedAt",
  complained: "complainedAt",
  opened: "openedAt",
  clicked: "clickedAt",
  deferred: null,
};

export interface ProcessResult {
  success: boolean;
  eventStored: boolean;
  emailLogUpdated: boolean;
  error?: string;
}

export async function processWebhookEvent(
  event: NormalizedWebhookEvent,
): Promise<ProcessResult> {
  let eventStored = false;
  let emailLogUpdated = false;

  // 1. Store raw event in WebhookEvent table
  try {
    await db.webhookEvent.create({
      data: {
        provider: event.provider.toUpperCase().replace("-", "_") as
          | "RESEND"
          | "SENDGRID"
          | "POSTMARK"
          | "AWS_SES"
          | "MAILGUN",
        eventType: event.eventType,
        payload: event.raw as object,
      },
    });
    eventStored = true;
  } catch {
    return {
      success: false,
      eventStored: false,
      emailLogUpdated: false,
      error: "Failed to store webhook event",
    };
  }

  // 2. Find EmailLog by providerMessageId
  const emailLog = await db.emailLog.findFirst({
    where: { providerMessageId: event.messageId },
  });

  if (!emailLog) {
    // Unknown messageId — event stored but no EmailLog to update
    return { success: true, eventStored, emailLogUpdated: false };
  }

  // 3. Update EmailLog status + timestamp
  const newStatus = EVENT_TO_STATUS[event.eventType];
  const timestampField = EVENT_TO_TIMESTAMP_FIELD[event.eventType];

  if (newStatus && canAdvanceStatus(emailLog.status, newStatus)) {
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
      };

      // Only set timestamp if not already set (idempotent)
      if (
        timestampField &&
        emailLog[timestampField as keyof typeof emailLog] === null
      ) {
        updateData[timestampField] = event.timestamp;
      }

      // Add error info for bounces
      if (event.eventType === "bounced" && event.metadata) {
        updateData.errorCode = event.metadata.bounceType ?? "BOUNCE";
        updateData.errorMessage = event.metadata.bounceReason ?? "Email bounced";
      }

      await db.emailLog.update({
        where: { id: emailLog.id },
        data: updateData,
      });
      emailLogUpdated = true;
    } catch {
      // EmailLog update failed, but event is stored
    }
  }

  // 4. Auto-unsubscribe on complaint
  if (event.eventType === "complained" && emailLog.brandId) {
    try {
      await recordUnsubscribe(
        emailLog.organizationId,
        emailLog.brandId,
        emailLog.toEmail,
        "complaint",
      );
    } catch {
      // Auto-unsubscribe failure should not prevent event processing
    }
  }

  return { success: true, eventStored, emailLogUpdated };
}
