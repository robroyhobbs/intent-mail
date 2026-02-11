// =============================================================================
// SCHEDULED SEND CALLBACK - Called by QStash at the scheduled time
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyQStashSignature } from "@/lib/queue/qstash";
import { sendEmail } from "@/lib/email/client";
import { isUnsubscribed } from "@/lib/email/unsubscribe";
import type { EmailRequest } from "@/lib/email/types";

export async function POST(request: NextRequest) {
  // Read raw body for signature verification
  const rawBody = await request.text();

  // Verify QStash signature
  const signature = request.headers.get("upstash-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const isValid = await verifyQStashSignature(signature, rawBody);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse body
  let emailLogId: string;
  try {
    const body = JSON.parse(rawBody);
    emailLogId = body.emailLogId;
  } catch {
    return NextResponse.json({ ok: true }); // Malformed body, don't retry
  }

  if (!emailLogId) {
    return NextResponse.json({ ok: true }); // Missing ID, don't retry
  }

  // Load EmailLog
  const emailLog = await db.emailLog.findUnique({
    where: { id: emailLogId },
  });

  if (!emailLog) {
    // EmailLog was deleted — don't retry
    return NextResponse.json({ ok: true });
  }

  // Only process if still SCHEDULED
  if (emailLog.status !== "SCHEDULED") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Re-check unsubscribe status
  if (emailLog.brandId) {
    try {
      const unsubscribed = await isUnsubscribed(
        emailLog.organizationId,
        emailLog.brandId,
        emailLog.toEmail,
      );
      if (unsubscribed) {
        await db.emailLog.update({
          where: { id: emailLogId },
          data: { status: "CANCELLED" },
        });
        return NextResponse.json({ ok: true, cancelled: "unsubscribed" });
      }
    } catch {
      // Fail open: DB error should not prevent email delivery
    }
  }

  // Load stored request params
  const scheduledRequest = emailLog.scheduledRequest as Record<
    string,
    unknown
  > | null;
  if (!scheduledRequest) {
    await db.emailLog.update({
      where: { id: emailLogId },
      data: { status: "FAILED", errorMessage: "No scheduled request params" },
    });
    return NextResponse.json({ ok: true });
  }

  // Reconstruct EmailRequest from stored params (without scheduledFor to send immediately)
  const emailRequest: EmailRequest = {
    organizationId: scheduledRequest.organizationId as string,
    brandId: scheduledRequest.brandId as string,
    intentId: scheduledRequest.intentId as string,
    to: scheduledRequest.to as string,
    data: (scheduledRequest.data as Record<string, unknown>) ?? {},
    subject: scheduledRequest.subject as string | undefined,
    tags: scheduledRequest.tags as string[] | undefined,
    metadata: scheduledRequest.metadata as Record<string, unknown> | undefined,
    plan: scheduledRequest.plan as string | undefined,
    // No scheduledFor — send immediately
  };

  try {
    const result = await sendEmail(emailRequest);

    if (result.success) {
      await db.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          providerMessageId: result.messageId,
        },
      });
    } else {
      await db.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: "FAILED",
          errorCode: "SEND_FAILED",
          errorMessage: result.error ?? "Failed to send scheduled email",
        },
      });
    }
  } catch {
    await db.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: "FAILED",
        errorCode: "CALLBACK_ERROR",
        errorMessage: "Unexpected error during scheduled send",
      },
    });
  }

  // Always return 200 to prevent QStash retry after we've handled the message
  return NextResponse.json({ ok: true });
}
