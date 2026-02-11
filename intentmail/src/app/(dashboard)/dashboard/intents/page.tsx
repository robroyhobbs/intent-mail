import Link from 'next/link'
import { Plus, MessageSquare, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { requireOrganization } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function IntentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const org = await requireOrganization()
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const query = params.q ?? ''

  const where: Record<string, unknown> = { organizationId: org.id }
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { slug: { contains: query, mode: 'insensitive' } },
      { purpose: { contains: query, mode: 'insensitive' } },
    ]
  }

  const [intents, total] = await Promise.all([
    db.intent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        brand: { select: { name: true, colorPrimary: true } },
        _count: { select: { emailLogs: true } },
      },
    }),
    db.intent.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const urgencyColors = {
    NONE: 'secondary',
    LOW: 'outline',
    MEDIUM: 'warning',
    HIGH: 'destructive',
  } as const

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { page: String(page), q: query, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v)
    }
    return `/dashboard/intents?${p.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Intents</h1>
          <p className="text-muted-foreground">
            Manage your email intent templates
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/intents/new">
            <Plus className="mr-2 h-4 w-4" />
            New Intent
          </Link>
        </Button>
      </div>

      {/* Search */}
      <form action="/dashboard/intents" method="GET" className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          placeholder="Search intents..."
          defaultValue={query}
          className="pl-9"
        />
      </form>

      {/* Results count */}
      {(query || total > 0) && (
        <p className="text-sm text-muted-foreground">
          {total} intent{total !== 1 ? 's' : ''}{query ? ` matching "${query}"` : ''}
        </p>
      )}

      {/* Intents List */}
      {intents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {query ? (
              <p className="text-muted-foreground">No intents match your search</p>
            ) : (
              <>
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No intents yet</h3>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Create your first intent to define email templates with slots-based content.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/intents/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Intent
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {intents.map((intent) => (
            <Link key={intent.id} href={`/dashboard/intents/${intent.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    {/* Brand Color Indicator */}
                    <div
                      className="h-10 w-1 rounded-full"
                      style={{ backgroundColor: intent.brand?.colorPrimary ?? '#6b7280' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{intent.name}</h3>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {intent.slug}
                        </code>
                        {!intent.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {intent.purpose}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Template: {intent.templateId}</span>
                        <span>·</span>
                        <span>{intent._count.emailLogs} emails sent</span>
                        {intent.brand && (
                          <>
                            <span>·</span>
                            <span>Brand: {intent.brand.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={urgencyColors[intent.urgency]}>
                      {intent.urgency.toLowerCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildUrl({ page: String(page - 1) })}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
            )}
            {page < totalPages ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildUrl({ page: String(page + 1) })}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
