import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrganization } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStripe, createCheckoutSession } from '@/lib/stripe'

const checkoutSchema = z.object({
  priceId: z.string(),
})

export async function POST(request: Request) {
  try {
    const org = await requireOrganization()

    const body = await request.json()
    const { priceId } = checkoutSchema.parse(body)

    // Create or get Stripe customer
    let customerId = org.stripeCustomerId

    if (!customerId) {
      const stripe = getStripe()
      const customer = await stripe.customers.create({
        metadata: {
          organizationId: org.id,
        },
      })

      await db.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customer.id },
      })

      customerId = customer.id
    }

    // Create checkout session
    const session = await createCheckoutSession(org.id, priceId, customerId)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid data' } },
        { status: 400 }
      )
    }
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create checkout session' } },
      { status: 500 }
    )
  }
}
