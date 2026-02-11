import { CreateOrganization } from '@clerk/nextjs'

export const dynamic = 'force-dynamic'

export default function CreateOrganizationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <CreateOrganization
        afterCreateOrganizationUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-xl',
          }
        }}
      />
    </div>
  )
}
