import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrganization, getPlanLimits, canCreateBrand } from '@/lib/auth'
import { db } from '@/lib/db'

const brandSchema = z.object({
  name: z.string().min(1).max(100),
  tagline: z.string().max(200).optional(),
  colorPrimary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  colorSecondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  colorSuccess: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  colorWarning: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  colorError: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  colorBackground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  colorSurface: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  colorText: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  colorTextMuted: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  colorBorder: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontHeadings: z.string().max(200).optional(),
  fontBody: z.string().max(200).optional(),
  fontImportUrl: z.string().url().optional().or(z.literal('')),
  voiceTone: z.string().max(500).optional(),
  voiceDoSay: z.array(z.string()).optional(),
  voiceDontSay: z.array(z.string()).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  logoWidth: z.number().min(10).max(500).optional(),
  logoAlt: z.string().max(200).optional(),
  linkHome: z.string().url().optional().or(z.literal('')),
  linkPrivacy: z.string().url().optional().or(z.literal('')),
  linkUnsubscribe: z.string().url().optional().or(z.literal('')),
  fromEmail: z.string().email().optional().or(z.literal('')),
  fromName: z.string().max(200).optional(),
  isDefault: z.boolean().optional(),
})

export async function GET() {
  try {
    const org = await requireOrganization()

    const brands = await db.brand.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: brands })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const org = await requireOrganization()
    const limits = getPlanLimits(org.plan)

    // Check limit
    const brandCount = await db.brand.count({ where: { organizationId: org.id } })
    const orgWithCount = { ...org, _count: { brands: brandCount } }

    if (!canCreateBrand(orgWithCount, limits)) {
      return NextResponse.json(
        {
          error: {
            code: 'LIMIT_REACHED',
            message: `You can only have ${limits.maxBrands} brands on the ${org.plan} plan`,
          },
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = brandSchema.parse(body)

    // Check unique name
    const existing = await db.brand.findFirst({
      where: { organizationId: org.id, name: data.name },
    })

    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'A brand with this name already exists' } },
        { status: 400 }
      )
    }

    // If this is the first brand, make it default
    const isFirstBrand = brandCount === 0

    const brand = await db.brand.create({
      data: {
        organizationId: org.id,
        name: data.name,
        tagline: data.tagline || null,
        colorPrimary: data.colorPrimary,
        colorSecondary: data.colorSecondary,
        colorSuccess: data.colorSuccess,
        colorWarning: data.colorWarning,
        colorError: data.colorError,
        colorBackground: data.colorBackground,
        colorSurface: data.colorSurface,
        colorText: data.colorText,
        colorTextMuted: data.colorTextMuted,
        colorBorder: data.colorBorder,
        fontHeadings: data.fontHeadings,
        fontBody: data.fontBody,
        fontImportUrl: data.fontImportUrl || null,
        voiceTone: data.voiceTone,
        voiceDoSay: data.voiceDoSay || [],
        voiceDontSay: data.voiceDontSay || [],
        logoUrl: data.logoUrl || null,
        logoWidth: data.logoWidth,
        logoAlt: data.logoAlt || null,
        linkHome: data.linkHome || null,
        linkPrivacy: data.linkPrivacy || null,
        linkUnsubscribe: data.linkUnsubscribe || null,
        fromEmail: data.fromEmail || null,
        fromName: data.fromName || null,
        isDefault: isFirstBrand || data.isDefault,
      },
    })

    return NextResponse.json({ data: brand }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors } },
        { status: 400 }
      )
    }
    console.error('Brand creation error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create brand' } },
      { status: 500 }
    )
  }
}
