// =============================================================================
// SENDGRID WEBHOOK ENDPOINT
// Verifies ECDSA signature, normalizes events, processes
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createPublicKey, createVerify } from "crypto";
import { db } from "@/lib/db";
import { processWebhookEvent } from "@/lib/email/webhooks/processor";
import type { NormalizedWebhookEvent, WebhookEventType } from "@/lib/email/webhooks/types";

// SendGrid event type → our normalized type
const EVENT_MAP: Record<string, WebhookEventType> = {
  delivered: "delivered",
  bounce: "bounced",
  spamreport: "complained",
  open: "opened",
  click: "clicked",
  deferred: "deferred",
};

function verifyEcdsaSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null,
  publicKey: string,
): boolean {
  if (!signature || !timestamp) {
    return false;
  }

  try {
    const key = createPublicKey({
      key: `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`,
      format: "pem",
    });

    const payloadToVerify = timestamp + payload;
    const verifier = createVerify("sha256");
    verifier.update(payloadToVerify);
    return verifier.verify(key, signature, "base64");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Empty body" } },
        { status: 400 },
      );
    }

    // Get webhook verification key from provider config
    const provider = await db.emailProvider.findFirst({
      where: { type: "SENDGRID", isActive: true },
    });

    const verificationKey = (provider?.config as Record<string, string>)
      ?.webhookVerificationKey;
    if (!verificationKey) {
      console.error("SendGrid webhook: missing webhookVerificationKey in provider config");
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Webhook not configured" } },
        { status: 500 },
      );
    }

    // Verify ECDSA signature
    const isValid = verifyEcdsaSignature(
      rawBody,
      request.headers.get("x-twilio-email-event-webhook-signature"),
      request.headers.get("x-twilio-email-event-webhook-timestamp"),
      verificationKey,
    );

    if (!isValid) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid signature" } },
        { status: 401 },
      );
    }

    // Parse payload — SendGrid sends an array of events
    let events: Array<Record<string, unknown>>;
    try {
      const parsed = JSON.parse(rawBody);
      events = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
        { status: 400 },
      );
    }

    // Process each event
    for (const data of events) {
      const eventType = EVENT_MAP[data.event as string];
      if (!eventType) continue;

      const event: NormalizedWebhookEvent = {
        provider: "sendgrid",
        messageId: (data.sg_message_id as string)?.split(".")[0] ?? "",
        eventType,
        email: (data.email as string) ?? "",
        timestamp: new Date(((data.timestamp as number) ?? 0) * 1000),
        raw: data,
        metadata: {
          bounceType: data.type as string | undefined,
          bounceReason: data.reason as string | undefined,
          clickUrl: data.url as string | undefined,
          userAgent: data.useragent as string | undefined,
        },
      };

      await processWebhookEvent(event);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Webhook processing failed" } },
      { status: 500 },
    );
  }
}
