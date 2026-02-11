import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrganization } from '@/lib/auth'
import { db } from '@/lib/db'
import { encrypt } from '@/lib/encryption'

const providerSchema = z.object({
  type: z.enum(['RESEND', 'SENDGRID', 'POSTMARK', 'AWS_SES', 'MAILGUN']),
  name: z.string().min(1).max(100),
  apiKey: z.string().min(1),
  isDefault: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
})

export async function GET() {
  try {
    const org = await requireOrganization()

    const providers = await db.emailProvider.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        isDefault: true,
        isActive: true,
        emailsSent: true,
        lastUsedAt: true,
        lastErrorAt: true,
        lastErrorMsg: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ data: providers })
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

    const body = await request.json()
    const data = providerSchema.parse(body)

    // Check unique name
    const existing = await db.emailProvider.findFirst({
      where: { organizationId: org.id, name: data.name },
    })

    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'A provider with this name already exists' } },
        { status: 400 }
      )
    }

    // Encrypt the API key
    const { encrypted, iv } = encrypt(data.apiKey)

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db.emailProvider.updateMany({
        where: { organizationId: org.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    // Check if this is the first provider
    const providerCount = await db.emailProvider.count({
      where: { organizationId: org.id },
    })

    const provider = await db.emailProvider.create({
      data: {
        organizationId: org.id,
        type: data.type,
        name: data.name,
        apiKeyEncrypted: encrypted,
        apiKeyIv: iv,
        isDefault: data.isDefault ?? providerCount === 0,
        config: (data.config ?? {}) as Record<string, string>,
      },
      select: {
        id: true,
        name: true,
        type: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ data: provider }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors } },
        { status: 400 }
      )
    }
    console.error('Provider creation error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create provider' } },
      { status: 500 }
    )
  }
}
