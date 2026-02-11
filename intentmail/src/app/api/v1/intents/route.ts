import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization } from "@/lib/auth";
import { db } from "@/lib/db";

const slotSchema = z.object({
  id: z.string(),
  prompt: z.string().optional(),
  static: z.string().optional(),
  url: z.string().optional(),
  buttonText: z.string().optional(),
  attribution: z.string().optional(),
  maxLength: z.number().optional(),
});

const intentSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9.-]+$/),
  description: z.string().max(500).optional(),
  brandId: z.string().nullable().optional(),
  purpose: z.string().min(1).max(500),
  tone: z.string().min(1).max(200),
  urgency: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]),
  subjectDefault: z.string().min(1).max(200),
  subjectVariants: z.array(z.string()).optional(),
  subjectMaxLength: z.number().min(20).max(100).optional(),
  templateId: z.string().optional(),
  slots: z.array(slotSchema).optional(),
  contentGoal: z.string().max(500).optional(),
  contentMustInclude: z.array(z.string()).optional(),
  contentMustNotInclude: z.array(z.string()).optional(),
  ctaText: z.string().max(100).optional(),
  ctaUrl: z.string().max(500).optional(),
  ctaStyle: z.enum(["SOFT", "MEDIUM", "STRONG"]).optional(),
  generationEnabled: z.boolean().optional(),
  generationConstraints: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const org = await requireOrganization();

    const intents = await db.intent.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      include: {
        brand: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: intents });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const org = await requireOrganization();

    const body = await request.json();
    const data = intentSchema.parse(body);

    // Check unique slug
    const existing = await db.intent.findFirst({
      where: { organizationId: org.id, slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: {
            code: "DUPLICATE",
            message: "An intent with this slug already exists",
          },
        },
        { status: 400 },
      );
    }

    // Verify brand belongs to org
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
    }

    const intent = await db.intent.create({
      data: {
        organizationId: org.id,
        brandId: data.brandId || null,
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        purpose: data.purpose,
        tone: data.tone,
        urgency: data.urgency,
        subjectDefault: data.subjectDefault,
        subjectVariants: data.subjectVariants || [],
        subjectMaxLength: data.subjectMaxLength || 50,
        templateId: data.templateId || "simple",
        slots: data.slots || [],
        contentGoal: data.contentGoal || null,
        contentMustInclude: data.contentMustInclude || [],
        contentMustNotInclude: data.contentMustNotInclude || [],
        ctaText: data.ctaText || null,
        ctaUrl: data.ctaUrl || null,
        ctaStyle: data.ctaStyle || "MEDIUM",
        generationEnabled: data.generationEnabled || false,
        generationConstraints: data.generationConstraints || [],
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json({ data: intent }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid data",
            details: error.errors,
          },
        },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create intent";
    console.error("Intent creation error:", message, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 },
    );
  }
}
