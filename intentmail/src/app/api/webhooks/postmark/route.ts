// =============================================================================
// POSTMARK WEBHOOK ENDPOINT
// Verifies shared secret token, normalizes events, processes
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { processWebhookEvent } from "@/lib/email/webhooks/processor";
import type { NormalizedWebhookEvent, WebhookEventType } from "@/lib/email/webhooks/types";

// Postmark RecordType → our normalized type
const EVENT_MAP: Record<string, WebhookEventType> = {
  Delivery: "delivered",
  Bounce: "bounced",
  SpamComplaint: "complained",
  Open: "opened",
  Click: "clicked",
};

function verifyWebhookToken(
  providedToken: string | null,
  expectedToken: string,
): boolean {
  if (!providedToken) return false;

  try {
    const a = Buffer.from(providedToken);
    const b = Buffer.from(expectedToken);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body
    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Empty body" } },
        { status: 400 },
      );
    }

    // Get webhook token from provider config
    const provider = await db.emailProvider.findFirst({
      where: { type: "POSTMARK", isActive: true },
    });

    const webhookToken = (provider?.config as Record<string, string>)
      ?.webhookToken;
    if (!webhookToken) {
      console.error("Postmark webhook: missing webhookToken in provider config");
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Webhook not configured" } },
        { status: 500 },
      );
    }

    // Verify shared secret token from query string
    const providedToken = request.nextUrl.searchParams.get("token");
    if (!verifyWebhookToken(providedToken, webhookToken)) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid token" } },
        { status: 401 },
      );
    }

    // Parse payload — Postmark sends single event objects
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
        { status: 400 },
      );
    }

    // Normalize event
    const recordType = payload.RecordType as string;
    const eventType = EVENT_MAP[recordType];
    if (!eventType) {
      // Unknown event type — acknowledge but don't process
      return NextResponse.json({ received: true });
    }

    const event: NormalizedWebhookEvent = {
      provider: "postmark",
      messageId: (payload.MessageID as string) ?? "",
      eventType,
      email: (payload.Recipient as string) ?? (payload.Email as string) ?? "",
      timestamp: new Date(
        (payload.DeliveredAt as string) ??
        (payload.BouncedAt as string) ??
        (payload.ReceivedAt as string) ??
        Date.now(),
      ),
      raw: payload,
      metadata: {
        bounceType: payload.Type as string | undefined,
        bounceReason: payload.Description as string | undefined,
        clickUrl: (payload.OriginalLink as string) ?? undefined,
        userAgent: payload.UserAgent as string | undefined,
      },
    };

    await processWebhookEvent(event);

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Webhook processing failed" } },
      { status: 500 },
    );
  }
}
