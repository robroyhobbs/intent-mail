// =============================================================================
// CANCEL / RESCHEDULE SCHEDULED EMAIL
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateApiKey, hasScope } from "@/lib/api/auth";
import {
  cancelScheduledEmail,
  publishScheduledEmail,
} from "@/lib/queue/qstash";

const rescheduleSchema = z.object({
  scheduledFor: z.string().datetime(),
});

// Cancel a scheduled email
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing API key" } },
      { status: 401 },
    );
  }

  if (!hasScope(auth, "email:send")) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "API key lacks email:send scope" } },
      { status: 403 },
    );
  }

  const { id } = await params;

  const emailLog = await db.emailLog.findFirst({
    where: { id, organizationId: auth.organizationId },
  });

  if (!emailLog) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Scheduled email not found" } },
      { status: 404 },
    );
  }

  if (emailLog.status !== "SCHEDULED") {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: `Cannot cancel email with status ${emailLog.status}`,
        },
      },
      { status: 400 },
    );
  }

  // Cancel in QStash (best-effort — may already be delivered)
  if (emailLog.qstashMessageId) {
    try {
      await cancelScheduledEmail(emailLog.qstashMessageId);
    } catch {
      console.warn(
        `Failed to cancel QStash message ${emailLog.qstashMessageId}`,
      );
    }
  }

  await db.emailLog.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({
    data: { id, status: "cancelled" },
  });
}

// Reschedule a scheduled email
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing API key" } },
      { status: 401 },
    );
  }

  if (!hasScope(auth, "email:send")) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "API key lacks email:send scope" } },
      { status: 403 },
    );
  }

  const { id } = await params;

  let body: z.infer<typeof rescheduleSchema>;
  try {
    body = rescheduleSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "scheduledFor is required and must be a valid ISO datetime",
          },
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid request body" } },
      { status: 400 },
    );
  }

  const newScheduledFor = new Date(body.scheduledFor);
  if (newScheduledFor.getTime() <= Date.now()) {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "scheduledFor must be in the future",
        },
      },
      { status: 400 },
    );
  }

  const emailLog = await db.emailLog.findFirst({
    where: { id, organizationId: auth.organizationId },
  });

  if (!emailLog) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Scheduled email not found" } },
      { status: 404 },
    );
  }

  if (emailLog.status !== "SCHEDULED") {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: `Cannot reschedule email with status ${emailLog.status}`,
        },
      },
      { status: 400 },
    );
  }

  // Publish new QStash message FIRST (so we don't lose the email if this fails)
  let newQstashMessageId: string;
  try {
    newQstashMessageId = await publishScheduledEmail(id, newScheduledFor);
  } catch {
    return NextResponse.json(
      { error: { code: "SCHEDULE_FAILED", message: "Failed to reschedule email" } },
      { status: 500 },
    );
  }

  // Cancel old QStash message (best-effort)
  if (emailLog.qstashMessageId) {
    try {
      await cancelScheduledEmail(emailLog.qstashMessageId);
    } catch {
      console.warn(
        `Failed to cancel old QStash message ${emailLog.qstashMessageId}`,
      );
    }
  }

  await db.emailLog.update({
    where: { id },
    data: {
      scheduledFor: newScheduledFor,
      qstashMessageId: newQstashMessageId,
    },
  });

  return NextResponse.json({
    data: {
      id,
      status: "scheduled",
      scheduledFor: newScheduledFor.toISOString(),
    },
  });
}
