import { requireOrganization } from '@/lib/auth'
import { ProviderForm } from '@/components/providers/provider-form'

export const dynamic = 'force-dynamic'

export default async function NewProviderPage() {
  const org = await requireOrganization()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Email Provider</h1>
        <p className="text-muted-foreground">
          Connect your email service provider
        </p>
      </div>

      <ProviderForm organizationId={org.id} />
    </div>
  )
}
