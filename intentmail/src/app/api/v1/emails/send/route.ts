import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateApiKey, hasScope } from "@/lib/api/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import { sendEmail } from "@/lib/email/client";
import { getPlanLimits } from "@/lib/auth";
import { publishScheduledEmail } from "@/lib/queue/qstash";

const sendEmailSchema = z.object({
  brandId: z.string().optional(),
  intentId: z.string().optional(),
  intent: z.string().optional(), // Slug-based lookup
  to: z.string().email(),
  data: z.record(z.unknown()).optional(),
  subject: z.string().max(200).optional(), // Override
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  scheduledFor: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate via API key
    const auth = await authenticateApiKey(request);
    if (!auth) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or missing API key",
          },
        },
        { status: 401 },
      );
    }

    // Check scope
    if (!hasScope(auth, "email:send")) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "API key lacks email:send scope",
          },
        },
        { status: 403 },
      );
    }

    // Get organization
    const org = await db.organization.findUnique({
      where: { id: auth.organizationId },
    });

    if (!org) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Organization not found" } },
        { status: 404 },
      );
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(
      auth.organizationId,
      org.plan,
      auth.rateLimitOverride,
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Rate limit exceeded" } },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        },
      );
    }

    // Check monthly limit
    const limits = getPlanLimits(org.plan);
    if (org.emailsUsedThisMonth >= limits.emailsPerMonth) {
      return NextResponse.json(
        {
          error: {
            code: "QUOTA_EXCEEDED",
            message: `Monthly email quota exceeded (${limits.emailsPerMonth} emails)`,
          },
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        },
      );
    }

    // Parse request body
    const body = await request.json();
    const data = sendEmailSchema.parse(body);

    // Resolve intent (by ID or slug)
    let intentId = data.intentId;
    if (!intentId && data.intent) {
      const intent = await db.intent.findFirst({
        where: { organizationId: auth.organizationId, slug: data.intent },
      });
      if (!intent) {
        return NextResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: `Intent not found: ${data.intent}`,
            },
          },
          { status: 404, headers: getRateLimitHeaders(rateLimit) },
        );
      }
      intentId = intent.id;
    }

    if (!intentId) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "intentId or intent slug is required",
          },
        },
        { status: 400, headers: getRateLimitHeaders(rateLimit) },
      );
    }

    // Resolve brand (by ID or get default)
    let brandId = data.brandId;
    if (!brandId) {
      const defaultBrand = await db.brand.findFirst({
        where: { organizationId: auth.organizationId, isDefault: true },
      });
      if (!defaultBrand) {
        return NextResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "No default brand configured",
            },
          },
          { status: 404, headers: getRateLimitHeaders(rateLimit) },
        );
      }
      brandId = defaultBrand.id;
    }

    // Check if this is a scheduled send
    const scheduledFor = data.scheduledFor
      ? new Date(data.scheduledFor)
      : undefined;
    const shouldSchedule = scheduledFor && scheduledFor.getTime() > Date.now();

    if (shouldSchedule) {
      // Store request params and publish to QStash
      const scheduledRequest = JSON.parse(
        JSON.stringify({
          organizationId: auth.organizationId,
          brandId,
          intentId,
          to: data.to,
          data: data.data ?? {},
          subject: data.subject,
          tags: data.tags,
          metadata: data.metadata,
          plan: org.plan,
        }),
      );

      // Create EmailLog first with SCHEDULED status
      const emailLog = await db.emailLog.create({
        data: {
          organizationId: auth.organizationId,
          brandId,
          intentId,
          toEmail: data.to,
          fromEmail: "pending",
          subject: data.subject ?? "pending",
          status: "SCHEDULED",
          scheduledFor,
          scheduledRequest,
          tags: data.tags ?? [],
          metadata: (data.metadata ?? {}) as Record<string, string>,
        },
      });

      try {
        const qstashMessageId = await publishScheduledEmail(
          emailLog.id,
          scheduledFor,
        );
        await db.emailLog.update({
          where: { id: emailLog.id },
          data: { qstashMessageId },
        });

        return NextResponse.json(
          {
            data: {
              messageId: emailLog.id,
              to: data.to,
              status: "scheduled",
              scheduled: true,
              scheduledFor: scheduledFor.toISOString(),
            },
          },
          { headers: getRateLimitHeaders(rateLimit) },
        );
      } catch {
        // QStash publish failed — clean up the EmailLog
        await db.emailLog.delete({ where: { id: emailLog.id } });
        return NextResponse.json(
          {
            error: {
              code: "SCHEDULE_FAILED",
              message: "Failed to schedule email",
            },
          },
          { status: 500, headers: getRateLimitHeaders(rateLimit) },
        );
      }
    }

    // Immediate send (no scheduledFor or scheduledFor in the past)
    const result = await sendEmail({
      organizationId: auth.organizationId,
      brandId,
      intentId,
      to: data.to,
      data: data.data ?? {},
      subject: data.subject,
      tags: data.tags,
      metadata: data.metadata,
      plan: org.plan,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: "SEND_FAILED",
            message: result.error ?? "Failed to send email",
          },
        },
        { status: 500, headers: getRateLimitHeaders(rateLimit) },
      );
    }

    return NextResponse.json(
      {
        data: {
          messageId: result.messageId,
          subject: result.email.subject,
          to: data.to,
          status: "sent",
        },
      },
      { headers: getRateLimitHeaders(rateLimit) },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.errors,
          },
        },
        { status: 400 },
      );
    }

    console.error("Email send error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to send email" } },
      { status: 500 },
    );
  }
}
