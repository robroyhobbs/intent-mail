import Link from 'next/link'
import { Plus, Plug, Check, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { requireOrganization } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatDateTime, formatNumber } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const providerInfo = {
  RESEND: { name: 'Resend', color: 'bg-blue-500' },
  SENDGRID: { name: 'SendGrid', color: 'bg-blue-600' },
  POSTMARK: { name: 'Postmark', color: 'bg-yellow-500' },
  AWS_SES: { name: 'AWS SES', color: 'bg-orange-500' },
  MAILGUN: { name: 'Mailgun', color: 'bg-red-500' },
}

export default async function ProvidersPage() {
  const org = await requireOrganization()

  const providers = await db.emailProvider.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Providers</h1>
          <p className="text-muted-foreground">
            Connect your email service provider (BYOP - Bring Your Own Provider)
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/providers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Link>
        </Button>
      </div>

      {/* Providers List */}
      {providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plug className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No providers connected</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Connect an email provider to start sending emails.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/providers/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Provider
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((provider) => {
            const info = providerInfo[provider.type]
            return (
              <Link key={provider.id} href={`/dashboard/providers/${provider.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg ${info.color} flex items-center justify-center`}>
                          <Plug className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          <CardDescription>{info.name}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {provider.isDefault && (
                          <Badge variant="secondary">
                            <Check className="mr-1 h-3 w-3" />
                            Default
                          </Badge>
                        )}
                        {provider.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Emails Sent</p>
                        <p className="font-medium">{formatNumber(provider.emailsSent)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Used</p>
                        <p className="font-medium">
                          {provider.lastUsedAt
                            ? formatDateTime(provider.lastUsedAt)
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                    {provider.lastErrorAt && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>Last error: {provider.lastErrorMsg}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
