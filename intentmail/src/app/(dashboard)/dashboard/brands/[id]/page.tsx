import { notFound } from 'next/navigation'
import { requireOrganization } from '@/lib/auth'
import { db } from '@/lib/db'
import { BrandForm } from '@/components/brands/brand-form'

export const dynamic = 'force-dynamic'

interface BrandPageProps {
  params: Promise<{ id: string }>
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { id } = await params
  const org = await requireOrganization()

  const brand = await db.brand.findFirst({
    where: {
      id,
      organizationId: org.id,
    },
  })

  if (!brand) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Brand</h1>
        <p className="text-muted-foreground">
          Update {brand.name}&apos;s configuration
        </p>
      </div>

      <BrandForm organizationId={org.id} brand={brand} />
    </div>
  )
}
