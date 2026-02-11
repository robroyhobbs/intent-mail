import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { hashApiKey } from '@/lib/encryption'

export interface ApiKeyAuth {
  organizationId: string
  apiKeyId: string
  scopes: string[]
  rateLimitOverride?: number
}

export async function authenticateApiKey(
  request: NextRequest
): Promise<ApiKeyAuth | null> {
  // Get API key from Authorization header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const apiKey = authHeader.slice(7) // Remove "Bearer "

  // Hash the key to look it up
  const keyHash = hashApiKey(apiKey)

  // Find the API key
  const key = await db.apiKey.findFirst({
    where: {
      keyHash,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      organization: {
        select: {
          id: true,
          plan: true,
          emailsUsedThisMonth: true,
        },
      },
    },
  })

  if (!key) {
    return null
  }

  // Update last used timestamp
  await db.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    organizationId: key.organizationId,
    apiKeyId: key.id,
    scopes: key.scopes as string[],
    rateLimitOverride: key.rateLimitOverride ?? undefined,
  }
}

export function hasScope(auth: ApiKeyAuth, requiredScope: string): boolean {
  // Check for exact match or wildcard
  return auth.scopes.some(
    (scope) => scope === requiredScope || scope === '*' || scope === 'email:*'
  )
}
