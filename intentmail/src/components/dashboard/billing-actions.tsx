'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PLANS, type PlanKey } from '@/lib/stripe'
import { Loader2, Zap, CreditCard } from 'lucide-react'
import type { Plan } from '@prisma/client'

interface BillingActionsProps {
  organizationId: string
  currentPlan: Plan
  targetPlan?: PlanKey
  stripeCustomerId: string | null
  className?: string
}

export function BillingActions({
  organizationId,
  currentPlan,
  targetPlan,
  stripeCustomerId,
  className,
}: BillingActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!targetPlan) return
    const plan = PLANS[targetPlan]
    if (!plan.priceId) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId }),
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManage = async () => {
    if (!stripeCustomerId) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Portal error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show upgrade button for a specific plan
  if (targetPlan) {
    return (
      <Button
        onClick={handleUpgrade}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Zap className="mr-2 h-4 w-4" />
        )}
        Upgrade to {PLANS[targetPlan].name}
      </Button>
    )
  }

  // Show manage subscription button
  if (stripeCustomerId && currentPlan !== 'FREE') {
    return (
      <Button
        variant="outline"
        onClick={handleManage}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="mr-2 h-4 w-4" />
        )}
        Manage Subscription
      </Button>
    )
  }

  // Show upgrade options for free plan
  if (currentPlan === 'FREE') {
    return (
      <Button
        onClick={() => {
          // Redirect to pricing or show upgrade modal
          window.location.href = '/pricing'
        }}
        className={className}
      >
        <Zap className="mr-2 h-4 w-4" />
        Upgrade Plan
      </Button>
    )
  }

  return null
}
