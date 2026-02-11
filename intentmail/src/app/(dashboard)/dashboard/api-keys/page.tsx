import Link from 'next/link'
import { Plus, Key, Copy, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { requireOrganization, getPlanLimits, canCreateApiKey } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatDateTime } from '@/lib/utils'
import { ApiKeyActions } from '@/components/dashboard/api-key-actions'

export const dynamic = 'force-dynamic'

export default async function ApiKeysPage() {
  const org = await requireOrganization()
  const limits = getPlanLimits(org.plan)

  const apiKeys = await db.apiKey.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
  })

  const orgWithCount = { ...org, _count: { apiKeys: apiKeys.length } }
  const canCreate = canCreateApiKey(orgWithCount, limits)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for programmatic email sending
          </p>
        </div>
        <ApiKeyActions
          organizationId={org.id}
          canCreate={canCreate}
          maxKeys={limits.maxApiKeys}
        />
      </div>

      {/* API Documentation Link */}
      <Card className="bg-muted/50">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium">API Documentation</p>
            <p className="text-sm text-muted-foreground">
              Learn how to send emails programmatically using our API
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/docs/api">View Docs</Link>
          </Button>
        </CardContent>
      </Card>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No API keys yet</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Create an API key to start sending emails programmatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <Card key={key.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{key.name}</h3>
                      {!key.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {key.expiresAt && new Date(key.expiresAt) < new Date() && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <code className="rounded bg-muted px-2 py-0.5 font-mono">
                        {key.keyPrefix}...
                      </code>
                      <span>·</span>
                      <span>
                        Created {formatDateTime(key.createdAt)}
                      </span>
                      {key.lastUsedAt && (
                        <>
                          <span>·</span>
                          <span>Last used {formatDateTime(key.lastUsedAt)}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(key.scopes as string[]).map((scope) => (
                        <Badge key={scope} variant="outline" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <ApiKeyActions
                  organizationId={org.id}
                  apiKeyId={key.id}
                  isActive={key.isActive}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Usage Info */}
      <p className="text-sm text-muted-foreground">
        {apiKeys.length} of {limits.maxApiKeys === Infinity ? 'unlimited' : limits.maxApiKeys} API keys used
      </p>

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Send your first email using the API</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
            <code>{`curl -X POST https://intentmail.com/api/v1/emails/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "intent": "onboarding.welcome",
    "to": "user@example.com",
    "data": {
      "firstName": "John",
      "dashboardUrl": "https://example.com/dashboard"
    }
  }'`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
