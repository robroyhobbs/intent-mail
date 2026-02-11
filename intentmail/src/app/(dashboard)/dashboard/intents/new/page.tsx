import { requireOrganization } from '@/lib/auth'
import { db } from '@/lib/db'
import { IntentForm } from '@/components/intents/intent-form'

export const dynamic = 'force-dynamic'

export default async function NewIntentPage() {
  const org = await requireOrganization()

  const brands = await db.brand.findMany({
    where: { organizationId: org.id },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Intent</h1>
        <p className="text-muted-foreground">
          Define a new email intent with template and content rules
        </p>
      </div>

      <IntentForm organizationId={org.id} brands={brands} />
    </div>
  )
}
