import { redirect } from 'next/navigation'
import { requireOrganization, getPlanLimits, canCreateBrand } from '@/lib/auth'
import { db } from '@/lib/db'
import { BrandForm } from '@/components/brands/brand-form'

export const dynamic = 'force-dynamic'

export default async function NewBrandPage() {
  const org = await requireOrganization()
  const limits = getPlanLimits(org.plan)

  const brandCount = await db.brand.count({ where: { organizationId: org.id } })
  const orgWithCount = { ...org, _count: { brands: brandCount } }

  if (!canCreateBrand(orgWithCount, limits)) {
    redirect('/dashboard/brands?error=limit-reached')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Brand</h1>
        <p className="text-muted-foreground">
          Configure your brand&apos;s colors, typography, and voice
        </p>
      </div>

      <BrandForm organizationId={org.id} />
    </div>
  )
}
