import Link from 'next/link'
import { Plus, MoreHorizontal, Palette, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { requireOrganization, getPlanLimits, canCreateBrand } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function BrandsPage() {
  const org = await requireOrganization()
  const limits = getPlanLimits(org.plan)

  const brands = await db.brand.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { intents: true, emailLogs: true },
      },
    },
  })

  const orgWithCount = { ...org, _count: { brands: brands.length } }
  const canCreate = canCreateBrand(orgWithCount, limits)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brands</h1>
          <p className="text-muted-foreground">
            Manage your brand configurations for consistent email styling
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/dashboard/brands/new">
              <Plus className="mr-2 h-4 w-4" />
              New Brand
            </Link>
          </Button>
        ) : (
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Limit Reached
          </Button>
        )}
      </div>

      {/* Brands Grid */}
      {brands.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Palette className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No brands yet</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Create your first brand to customize email styling and voice.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/brands/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Brand
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link key={brand.id} href={`/dashboard/brands/${brand.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Color Preview */}
                      <div
                        className="h-10 w-10 rounded-lg"
                        style={{ backgroundColor: brand.colorPrimary }}
                      />
                      <div>
                        <CardTitle className="text-lg">{brand.name}</CardTitle>
                        {brand.tagline && (
                          <CardDescription className="text-xs">
                            {brand.tagline}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    {brand.isDefault && (
                      <Badge variant="secondary">
                        <Check className="mr-1 h-3 w-3" />
                        Default
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Color Swatches */}
                  <div className="mb-4 flex gap-1">
                    {[
                      brand.colorPrimary,
                      brand.colorSecondary,
                      brand.colorSuccess,
                      brand.colorWarning,
                      brand.colorError,
                    ].map((color, i) => (
                      <div
                        key={i}
                        className="h-4 w-4 rounded-full border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{brand._count.intents} intents</span>
                    <span>{brand._count.emailLogs} emails sent</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Usage Info */}
      <p className="text-sm text-muted-foreground">
        {brands.length} of {limits.maxBrands === Infinity ? 'unlimited' : limits.maxBrands} brands used
      </p>
    </div>
  )
}
