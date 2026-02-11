import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return stripeInstance
}

// Pricing configuration
export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '1,000 emails/month',
      '1 brand',
      '2 API keys',
      '100 req/min rate limit',
      '7-day analytics',
    ],
  },
  STARTER: {
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    features: [
      '10,000 emails/month',
      '3 brands',
      '5 API keys',
      '500 req/min rate limit',
      '30-day analytics',
      'Webhook integrations',
    ],
  },
  GROWTH: {
    name: 'Growth',
    price: 99,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID,
    features: [
      '50,000 emails/month',
      '10 brands',
      '20 API keys',
      '2,000 req/min rate limit',
      '90-day analytics',
      'Custom domain',
      'Priority support',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: null,
    priceId: null,
    features: [
      'Unlimited emails',
      'Unlimited brands',
      'Unlimited API keys',
      '10,000 req/min rate limit',
      '365-day analytics',
      'Custom domain',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS

export async function createCheckoutSession(
  organizationId: string,
  priceId: string,
  customerId?: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer: customerId,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
    metadata: {
      organizationId,
    },
  })

  return session
}

export async function createBillingPortalSession(
  customerId: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
  })

  return session
}

export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const stripe = getStripe()
    return await stripe.subscriptions.retrieve(subscriptionId)
  } catch {
    return null
  }
}
