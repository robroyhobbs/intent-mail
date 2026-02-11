import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe, PLANS } from '@/lib/stripe'
import { db } from '@/lib/db'
import type { Plan } from '@prisma/client'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  let event
  const stripe = getStripe()

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const organizationId = session.metadata?.organizationId

        if (organizationId && session.subscription) {
          // Get subscription to determine the plan
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          const priceId = subscription.items.data[0]?.price.id

          // Determine plan from price ID
          let plan: Plan = 'FREE'
          for (const [key, value] of Object.entries(PLANS)) {
            if (value.priceId === priceId) {
              plan = key as Plan
              break
            }
          }

          await db.organization.update({
            where: { id: organizationId },
            data: {
              plan,
              stripeSubscriptionId: session.subscription as string,
              billingCycleStart: new Date(),
              emailsUsedThisMonth: 0, // Reset on new subscription
            },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const priceId = subscription.items.data[0]?.price.id

        // Find organization by subscription ID
        const org = await db.organization.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        })

        if (org) {
          let plan: Plan = 'FREE'
          for (const [key, value] of Object.entries(PLANS)) {
            if (value.priceId === priceId) {
              plan = key as Plan
              break
            }
          }

          await db.organization.update({
            where: { id: org.id },
            data: { plan },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object

        // Find organization by subscription ID
        const org = await db.organization.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        })

        if (org) {
          await db.organization.update({
            where: { id: org.id },
            data: {
              plan: 'FREE',
              stripeSubscriptionId: null,
            },
          })
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object

        if (invoice.subscription) {
          // Reset monthly usage on successful payment
          const org = await db.organization.findFirst({
            where: { stripeSubscriptionId: invoice.subscription as string },
          })

          if (org) {
            await db.organization.update({
              where: { id: org.id },
              data: {
                billingCycleStart: new Date(),
                emailsUsedThisMonth: 0,
              },
            })
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
