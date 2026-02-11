import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrganization, getPlanLimits, canCreateApiKey } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateApiKey } from '@/lib/encryption'

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
})

export async function GET() {
  try {
    const org = await requireOrganization()

    const apiKeys = await db.apiKey.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ data: apiKeys })
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
    const keyCount = await db.apiKey.count({ where: { organizationId: org.id } })
    const orgWithCount = { ...org, _count: { apiKeys: keyCount } }

    if (!canCreateApiKey(orgWithCount, limits)) {
      return NextResponse.json(
        {
          error: {
            code: 'LIMIT_REACHED',
            message: `You can only have ${limits.maxApiKeys} API keys on the ${org.plan} plan`,
          },
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = createApiKeySchema.parse(body)

    // Generate the API key
    const { key, prefix, hash } = generateApiKey()

    const apiKey = await db.apiKey.create({
      data: {
        organizationId: org.id,
        name: data.name,
        keyPrefix: prefix,
        keyHash: hash,
        scopes: data.scopes || ['email:send'],
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    })

    // Return the full key only once
    return NextResponse.json(
      {
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key, // Full key - only returned on creation
          keyPrefix: apiKey.keyPrefix,
          scopes: apiKey.scopes,
          createdAt: apiKey.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors } },
        { status: 400 }
      )
    }
    console.error('API key creation error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create API key' } },
      { status: 500 }
    )
  }
}
