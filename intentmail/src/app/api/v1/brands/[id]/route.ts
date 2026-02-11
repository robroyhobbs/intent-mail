import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrganization } from '@/lib/auth'
import { db } from '@/lib/db'

const brandSchema = z.object({
  name: z.string().min(1).max(100).optional(),
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

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const org = await requireOrganization()

    const brand = await db.brand.findFirst({
      where: { id, organizationId: org.id },
    })

    if (!brand) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Brand not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: brand })
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

    const brand = await db.brand.findFirst({
      where: { id, organizationId: org.id },
    })

    if (!brand) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Brand not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = brandSchema.parse(body)

    // Check unique name if changed
    if (data.name && data.name !== brand.name) {
      const existing = await db.brand.findFirst({
        where: {
          organizationId: org.id,
          name: data.name,
          id: { not: id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: { code: 'DUPLICATE', message: 'A brand with this name already exists' } },
          { status: 400 }
        )
      }
    }

    // If setting as default, unset other defaults
    if (data.isDefault && !brand.isDefault) {
      await db.brand.updateMany({
        where: { organizationId: org.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const updated = await db.brand.update({
      where: { id },
      data: {
        name: data.name,
        tagline: data.tagline ?? null,
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
        voiceDoSay: data.voiceDoSay,
        voiceDontSay: data.voiceDontSay,
        logoUrl: data.logoUrl || null,
        logoWidth: data.logoWidth,
        logoAlt: data.logoAlt || null,
        linkHome: data.linkHome || null,
        linkPrivacy: data.linkPrivacy || null,
        linkUnsubscribe: data.linkUnsubscribe || null,
        fromEmail: data.fromEmail || null,
        fromName: data.fromName || null,
        isDefault: data.isDefault,
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
    console.error('Brand update error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update brand' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const org = await requireOrganization()

    const brand = await db.brand.findFirst({
      where: { id, organizationId: org.id },
    })

    if (!brand) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Brand not found' } },
        { status: 404 }
      )
    }

    if (brand.isDefault) {
      return NextResponse.json(
        { error: { code: 'CANNOT_DELETE_DEFAULT', message: 'Cannot delete the default brand' } },
        { status: 400 }
      )
    }

    await db.brand.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('Brand deletion error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete brand' } },
      { status: 500 }
    )
  }
}
