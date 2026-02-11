// =============================================================================
// RESEND WEBHOOK ENDPOINT
// Verifies Svix signature, normalizes events, processes
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { processWebhookEvent } from "@/lib/email/webhooks/processor";
import type {
  NormalizedWebhookEvent,
  WebhookEventType,
} from "@/lib/email/webhooks/types";

// Resend event type → our normalized type
const EVENT_MAP: Record<string, WebhookEventType> = {
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.delivery_delayed": "deferred",
};

function verifySvixSignature(
  payload: string,
  headers: {
    svixId: string | null;
    svixTimestamp: string | null;
    svixSignature: string | null;
  },
  secret: string,
): boolean {
  if (!headers.svixId || !headers.svixTimestamp || !headers.svixSignature) {
    return false;
  }

  // Svix secret is base64 encoded with "whsec_" prefix
  const secretBytes = Buffer.from(
    secret.startsWith("whsec_") ? secret.slice(6) : secret,
    "base64",
  );

  const toSign = `${headers.svixId}.${headers.svixTimestamp}.${payload}`;
  const expectedSignature = createHmac("sha256", secretBytes)
    .update(toSign)
    .digest("base64");

  // Svix signature header may contain multiple signatures separated by spaces
  const signatures = headers.svixSignature.split(" ");
  return signatures.some((sig) => {
    const sigValue = sig.startsWith("v1,") ? sig.slice(3) : sig;
    return sigValue === expectedSignature;
  });
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

    // Get webhook secret from provider config
    const provider = await db.emailProvider.findFirst({
      where: { type: "RESEND", isActive: true },
    });

    const webhookSecret = (provider?.config as Record<string, string>)
      ?.webhookSecret;
    if (!webhookSecret) {
      console.error("Resend webhook: missing webhookSecret in provider config");
      return NextResponse.json(
        {
          error: { code: "INTERNAL_ERROR", message: "Webhook not configured" },
        },
        { status: 500 },
      );
    }

    // Verify Svix signature
    const isValid = verifySvixSignature(
      rawBody,
      {
        svixId: request.headers.get("svix-id"),
        svixTimestamp: request.headers.get("svix-timestamp"),
        svixSignature: request.headers.get("svix-signature"),
      },
      webhookSecret,
    );

    if (!isValid) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid signature" } },
        { status: 401 },
      );
    }

    // Parse payload
    let payload: { type: string; data: Record<string, unknown> };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
        { status: 400 },
      );
    }

    // Normalize event
    const eventType = EVENT_MAP[payload.type];
    if (!eventType) {
      // Unknown event type — acknowledge but don't process
      return NextResponse.json({ received: true });
    }

    const data = payload.data;
    const event: NormalizedWebhookEvent = {
      provider: "resend",
      messageId: (data.email_id as string) ?? "",
      eventType,
      email: (data.to as string[])?.[0] ?? (data.to as string) ?? "",
      timestamp: new Date((data.created_at as string) ?? Date.now()),
      raw: payload,
      metadata: {
        bounceType: (data.bounce as Record<string, unknown>)?.type as
          | string
          | undefined,
        bounceReason: (data.bounce as Record<string, unknown>)?.message as
          | string
          | undefined,
        clickUrl: (data.click as Record<string, unknown>)?.link as
          | string
          | undefined,
      },
    };

    await processWebhookEvent(event);

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Webhook processing failed" },
      },
      { status: 500 },
    );
  }
}
