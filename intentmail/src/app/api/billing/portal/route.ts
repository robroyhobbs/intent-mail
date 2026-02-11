import { NextResponse } from 'next/server'
import { requireOrganization } from '@/lib/auth'
import { createBillingPortalSession } from '@/lib/stripe'

export async function POST() {
  try {
    const org = await requireOrganization()

    if (!org.stripeCustomerId) {
      return NextResponse.json(
        { error: { code: 'NO_CUSTOMER', message: 'No billing account found' } },
        { status: 400 }
      )
    }

    const session = await createBillingPortalSession(org.stripeCustomerId)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create portal session' } },
      { status: 500 }
    )
  }
}
