import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization, getOrganizationWithLimits } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkGenerationLimit, incrementGenerationCount } from "@/lib/ai/limits";
import { generateIntentWithRetry, getDefaultIntent } from "@/lib/ai/generate-intent";
import type { Plan } from "@prisma/client";

const requestSchema = z.object({
  description: z.string().min(1, "Description is required").max(500, "Description too long").transform((s) => s.trim()),
  brandId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const org = await requireOrganization();

    const body = await request.json();
    const data = requestSchema.parse(body);

    // Validate brandId belongs to org (if provided)
    let brandContext: { name: string; tone: string; doSay: string[]; dontSay: string[] } | undefined;
    if (data.brandId) {
      const brand = await db.brand.findFirst({
        where: { id: data.brandId, organizationId: org.id },
      });
      if (!brand) {
        return NextResponse.json(
          { error: { code: "INVALID_BRAND", message: "Brand not found" } },
          { status: 400 },
        );
      }
      brandContext = {
        name: brand.name,
        tone: (brand.voiceTone as string) || "Professional",
        doSay: (brand.voiceDoSay as string[]) || [],
        dontSay: (brand.voiceDontSay as string[]) || [],
      };
    }

    // Check rate limit
    const orgWithLimits = await getOrganizationWithLimits();
    if (orgWithLimits) {
      const plan = (orgWithLimits.plan ?? "FREE") as Plan;
      const allowed = await checkGenerationLimit(org.id, plan);
      if (!allowed) {
        return NextResponse.json(
          { error: { code: "RATE_LIMITED", message: "AI generation limit reached for this billing period" } },
          { status: 429 },
        );
      }
    }

    // Generate intent via Gemini
    const generated = await generateIntentWithRetry({
      description: data.description,
      brandContext,
    });

    // Increment generation counter
    await incrementGenerationCount(org.id);

    return NextResponse.json({ data: generated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid request", details: error.errors } },
        { status: 400 },
      );
    }

    // Auth errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 },
      );
    }

    console.error("Generate intent error:", error);
    // Fallback: return defaults instead of 500
    try {
      const body = await request.clone().json();
      const desc = typeof body?.description === "string" ? body.description : "New Email";
      return NextResponse.json({ data: getDefaultIntent(desc) });
    } catch {
      return NextResponse.json({ data: getDefaultIntent("New Email") });
    }
  }
}
