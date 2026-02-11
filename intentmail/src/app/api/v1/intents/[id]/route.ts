import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrganization } from '@/lib/auth'
import { db } from '@/lib/db'

const slotSchema = z.object({
  id: z.string(),
  prompt: z.string().optional(),
  static: z.string().optional(),
  url: z.string().optional(),
  buttonText: z.string().optional(),
  attribution: z.string().optional(),
  maxLength: z.number().optional(),
})

const intentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9.-]+$/).optional(),
  description: z.string().max(500).optional(),
  brandId: z.string().nullable().optional(),
  purpose: z.string().min(1).max(500).optional(),
  tone: z.string().min(1).max(200).optional(),
  urgency: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional(),
  subjectDefault: z.string().min(1).max(200).optional(),
  subjectVariants: z.array(z.string()).optional(),
  subjectMaxLength: z.number().min(20).max(100).optional(),
  templateId: z.string().optional(),
  slots: z.array(slotSchema).optional(),
  contentGoal: z.string().max(500).optional(),
  contentMustInclude: z.array(z.string()).optional(),
  contentMustNotInclude: z.array(z.string()).optional(),
  ctaText: z.string().max(100).optional(),
  ctaUrl: z.string().max(500).optional(),
  ctaStyle: z.enum(['SOFT', 'MEDIUM', 'STRONG']).optional(),
  generationEnabled: z.boolean().optional(),
  generationConstraints: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const org = await requireOrganization()

    const intent = await db.intent.findFirst({
      where: { id, organizationId: org.id },
      include: {
        brand: { select: { id: true, name: true } },
      },
    })

    if (!intent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Intent not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: intent })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const org = await requireOrganization()

    const intent = await db.intent.findFirst({
      where: { id, organizationId: org.id },
    })

    if (!intent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Intent not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = intentSchema.parse(body)

    // Check unique slug if changed
    if (data.slug && data.slug !== intent.slug) {
      const existing = await db.intent.findFirst({
        where: {
          organizationId: org.id,
          slug: data.slug,
          id: { not: id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: { code: 'DUPLICATE', message: 'An intent with this slug already exists' } },
          { status: 400 }
        )
      }
    }

    // Verify brand belongs to org
    if (data.brandId) {
      const brand = await db.brand.findFirst({
        where: { id: data.brandId, organizationId: org.id },
      })
      if (!brand) {
        return NextResponse.json(
          { error: { code: 'INVALID_BRAND', message: 'Brand not found' } },
          { status: 400 }
        )
      }
    }

    const updated = await db.intent.update({
      where: { id },
      data: {
        brandId: data.brandId !== undefined ? data.brandId : undefined,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        purpose: data.purpose,
        tone: data.tone,
        urgency: data.urgency,
        subjectDefault: data.subjectDefault,
        subjectVariants: data.subjectVariants,
        subjectMaxLength: data.subjectMaxLength,
        templateId: data.templateId,
        slots: data.slots,
        contentGoal: data.contentGoal ?? null,
        contentMustInclude: data.contentMustInclude,
        contentMustNotInclude: data.contentMustNotInclude,
        ctaText: data.ctaText ?? null,
        ctaUrl: data.ctaUrl ?? null,
        ctaStyle: data.ctaStyle,
        generationEnabled: data.generationEnabled,
        generationConstraints: data.generationConstraints,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors } },
        { status: 400 }
      )
    }
    console.error('Intent update error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update intent' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const org = await requireOrganization()

    const intent = await db.intent.findFirst({
      where: { id, organizationId: org.id },
    })

    if (!intent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Intent not found' } },
        { status: 404 }
      )
    }

    await db.intent.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('Intent deletion error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete intent' } },
      { status: 500 }
    )
  }
}
