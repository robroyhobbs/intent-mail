import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrganization } from '@/lib/auth'
import { db } from '@/lib/db'
import { encrypt } from '@/lib/encryption'

const updateProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  apiKey: z.string().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const org = await requireOrganization()

    const provider = await db.emailProvider.findFirst({
      where: { id, organizationId: org.id },
      select: {
        id: true,
        name: true,
        type: true,
        isDefault: true,
        isActive: true,
        config: true,
        emailsSent: true,
        lastUsedAt: true,
        lastErrorAt: true,
        lastErrorMsg: true,
        createdAt: true,
      },
    })

    if (!provider) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Provider not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: provider })
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

    const provider = await db.emailProvider.findFirst({
      where: { id, organizationId: org.id },
    })

    if (!provider) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Provider not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = updateProviderSchema.parse(body)

    // If setting as default, unset other defaults
    if (data.isDefault && !provider.isDefault) {
      await db.emailProvider.updateMany({
        where: { organizationId: org.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      name: data.name,
      isDefault: data.isDefault,
      isActive: data.isActive,
      config: data.config,
    }

    // Encrypt new API key if provided
    if (data.apiKey) {
      const { encrypted, iv } = encrypt(data.apiKey)
      updateData.apiKeyEncrypted = encrypted
      updateData.apiKeyIv = iv
    }

    const updated = await db.emailProvider.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        type: true,
        isDefault: true,
        isActive: true,
        updatedAt: true,
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
    console.error('Provider update error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update provider' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const org = await requireOrganization()

    const provider = await db.emailProvider.findFirst({
      where: { id, organizationId: org.id },
    })

    if (!provider) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Provider not found' } },
        { status: 404 }
      )
    }

    if (provider.isDefault) {
      return NextResponse.json(
        { error: { code: 'CANNOT_DELETE_DEFAULT', message: 'Cannot delete the default provider' } },
        { status: 400 }
      )
    }

    await db.emailProvider.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('Provider deletion error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete provider' } },
      { status: 500 }
    )
  }
}
