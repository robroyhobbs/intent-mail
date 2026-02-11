import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { requireOrganization, getPlanLimits } from '@/lib/auth'
import { PLANS } from '@/lib/stripe'
import { formatNumber } from '@/lib/utils'
import { Check, Zap } from 'lucide-react'
import { BillingActions } from '@/components/dashboard/billing-actions'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const org = await requireOrganization()
  const limits = getPlanLimits(org.plan)
  const currentPlan = PLANS[org.plan]

  const usagePercentage = limits.emailsPerMonth === Infinity
    ? 0
    : (org.emailsUsedThisMonth / limits.emailsPerMonth) * 100

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and usage
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {currentPlan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Monthly Email Usage</span>
              <span className="text-sm text-muted-foreground">
                {formatNumber(org.emailsUsedThisMonth)} / {limits.emailsPerMonth === Infinity ? '∞' : formatNumber(limits.emailsPerMonth)}
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${usagePercentage > 90 ? 'bg-destructive' : usagePercentage > 75 ? 'bg-yellow-500' : 'bg-primary'}`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            {usagePercentage > 75 && (
              <p className="mt-2 text-sm text-yellow-600">
                {usagePercentage > 90 ? 'Almost at limit!' : 'Approaching limit'} — Consider upgrading your plan.
              </p>
            )}
          </div>

          {/* Plan Features */}
          <div className="grid gap-2">
            {currentPlan.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                {feature}
              </div>
            ))}
          </div>

          {/* Billing Actions */}
          <BillingActions
            organizationId={org.id}
            currentPlan={org.plan}
            stripeCustomerId={org.stripeCustomerId}
          />
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(PLANS).map(([key, plan]) => {
            const isCurrentPlan = key === org.plan
            const isUpgrade = getPlanOrder(key as keyof typeof PLANS) > getPlanOrder(org.plan)

            return (
              <Card
                key={key}
                className={isCurrentPlan ? 'border-primary' : ''}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {isCurrentPlan && <Badge>Current</Badge>}
                  </div>
                  <CardDescription>
                    {plan.price === null ? (
                      'Contact us'
                    ) : plan.price === 0 ? (
                      'Free forever'
                    ) : (
                      <span className="text-2xl font-bold">${plan.price}<span className="text-sm font-normal">/mo</span></span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {!isCurrentPlan && isUpgrade && plan.priceId && (
                    <BillingActions
                      organizationId={org.id}
                      currentPlan={org.plan}
                      targetPlan={key as keyof typeof PLANS}
                      stripeCustomerId={org.stripeCustomerId}
                      className="mt-4"
                    />
                  )}
                  {key === 'ENTERPRISE' && !isCurrentPlan && (
                    <Button variant="outline" className="w-full mt-4" asChild>
                      <a href="mailto:sales@intentmail.com">Contact Sales</a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function getPlanOrder(plan: keyof typeof PLANS): number {
  const order = { FREE: 0, STARTER: 1, GROWTH: 2, ENTERPRISE: 3 }
  return order[plan]
}
