import { notFound } from 'next/navigation'
import { requireOrganization } from '@/lib/auth'
import { db } from '@/lib/db'
import { ProviderForm } from '@/components/providers/provider-form'

export const dynamic = 'force-dynamic'

interface ProviderPageProps {
  params: Promise<{ id: string }>
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { id } = await params
  const org = await requireOrganization()

  const provider = await db.emailProvider.findFirst({
    where: { id, organizationId: org.id },
  })

  if (!provider) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Provider</h1>
        <p className="text-muted-foreground">
          Update {provider.name} configuration
        </p>
      </div>

      <ProviderForm organizationId={org.id} provider={provider} />
    </div>
  )
}
