// =============================================================================
// EMAIL PREVIEW ENDPOINT
// Renders email HTML + text without sending. Useful for QA and testing.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, hasScope } from "@/lib/api/auth";
import { db } from "@/lib/db";
import { generateEmail } from "@/lib/email/client";
import type { IntentConfig, BrandConfig } from "@/lib/email/types";

export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json(
      {
        error: { code: "UNAUTHORIZED", message: "Invalid or missing API key" },
      },
      { status: 401 },
    );
  }

  if (!hasScope(auth, "email:send")) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Insufficient scope" } },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const {
      brandId,
      intentId,
      data = {},
    } = body as {
      brandId?: string;
      intentId?: string;
      data?: Record<string, unknown>;
    };

    if (!brandId || !intentId) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "brandId and intentId are required",
          },
        },
        { status: 400 },
      );
    }

    const orgId = auth.organizationId;

    // Load brand
    const brand = await db.brand.findFirst({
      where: { id: brandId, organizationId: orgId },
    });
    if (!brand) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Brand not found" } },
        { status: 404 },
      );
    }

    // Load intent
    const intentRecord = await db.intent.findFirst({
      where: { id: intentId, organizationId: orgId },
    });
    if (!intentRecord) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Intent not found" } },
        { status: 404 },
      );
    }

    // Convert DB records to config objects (mirrors client.ts logic)
    const intentConfig: IntentConfig = {
      id: intentRecord.id,
      slug: intentRecord.slug,
      name: intentRecord.name,
      description: intentRecord.description ?? undefined,
      purpose: intentRecord.purpose,
      tone: intentRecord.tone,
      urgency: intentRecord.urgency.toLowerCase() as
        | "none"
        | "low"
        | "medium"
        | "high",
      subject: {
        default: intentRecord.subjectDefault,
        variants: intentRecord.subjectVariants as string[],
        maxLength: intentRecord.subjectMaxLength,
      },
      structure: {
        template: intentRecord.templateId,
        slots:
          intentRecord.slots as unknown as IntentConfig["structure"]["slots"],
      },
      content: {
        goal: intentRecord.contentGoal ?? undefined,
        mustInclude: intentRecord.contentMustInclude as string[],
        mustNotInclude: intentRecord.contentMustNotInclude as string[],
        cta: intentRecord.ctaText
          ? {
              text: intentRecord.ctaText,
              url: intentRecord.ctaUrl ?? "",
              style: intentRecord.ctaStyle.toLowerCase() as
                | "soft"
                | "medium"
                | "strong",
            }
          : undefined,
      },
      generation: {
        enabled: intentRecord.generationEnabled,
        constraints: intentRecord.generationConstraints as string[],
      },
    };

    const brandConfig: BrandConfig = {
      id: brand.id,
      name: brand.name,
      tagline: brand.tagline ?? undefined,
      colors: {
        primary: brand.colorPrimary,
        secondary: brand.colorSecondary,
        success: brand.colorSuccess,
        warning: brand.colorWarning,
        error: brand.colorError,
        background: brand.colorBackground,
        surface: brand.colorSurface,
        text: brand.colorText,
        textMuted: brand.colorTextMuted,
        border: brand.colorBorder,
      },
      typography: {
        headings: brand.fontHeadings,
        body: brand.fontBody,
        fontImportUrl: brand.fontImportUrl ?? undefined,
      },
      voice: {
        tone: brand.voiceTone,
        doSay: (brand.voiceDoSay as string[]) ?? [],
        dontSay: (brand.voiceDontSay as string[]) ?? [],
      },
      logo: brand.logoUrl
        ? {
            url: brand.logoUrl,
            width: brand.logoWidth,
            altText: brand.logoAlt ?? brand.name,
          }
        : undefined,
      links: {
        home: brand.linkHome ?? undefined,
        privacy: brand.linkPrivacy ?? undefined,
        unsubscribe: brand.linkUnsubscribe ?? undefined,
      },
      fromEmail: brand.fromEmail ?? undefined,
      fromName: brand.fromName ?? undefined,
    };

    // Generate email without sending
    const email = await generateEmail(intentConfig, brandConfig, {
      ...data,
      organizationId: orgId,
    });

    return NextResponse.json({
      data: {
        subject: email.subject,
        html: email.html,
        text: email.text,
        metadata: email.metadata,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: { code: "INTERNAL_ERROR", message: "Preview generation failed" },
      },
      { status: 500 },
    );
  }
}
