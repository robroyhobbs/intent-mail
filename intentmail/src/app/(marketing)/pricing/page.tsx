import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Check, ArrowRight } from 'lucide-react'
import { PLANS } from '@/lib/stripe'

export default function PricingPage() {
  const plans = Object.entries(PLANS)

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <nav className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Send className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">IntentMail</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/pricing" className="text-sm font-medium">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container py-16 text-center">
          <Badge variant="secondary" className="mb-4">
            Simple, Transparent Pricing
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Pay only for what you use
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Start free, upgrade as you grow. All plans include unlimited intents,
            full API access, and your own email provider.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="container pb-24">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map(([key, plan], index) => {
              const isPopular = key === 'GROWTH'
              return (
                <Card
                  key={key}
                  className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.price === null ? (
                        <span className="text-3xl font-bold">Custom</span>
                      ) : plan.price === 0 ? (
                        <span className="text-3xl font-bold">Free</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold">${plan.price}</span>
                          <span className="text-muted-foreground">/month</span>
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {key === 'FREE' ? (
                      <Button className="w-full" asChild>
                        <Link href="/sign-up">
                          Get Started Free
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : key === 'ENTERPRISE' ? (
                      <Button variant="outline" className="w-full" asChild>
                        <a href="mailto:sales@intentmail.com">Contact Sales</a>
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={isPopular ? 'default' : 'outline'}
                        asChild
                      >
                        <Link href="/sign-up">
                          Start with {plan.name}
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t bg-muted/30 py-24">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Frequently Asked Questions
            </h2>
            <div className="mx-auto max-w-3xl space-y-8">
              {[
                {
                  q: 'What is BYOP (Bring Your Own Provider)?',
                  a: 'IntentMail connects to your existing email provider (Resend, SendGrid, Postmark, or AWS SES). You keep full control of your email infrastructure and deliverability.',
                },
                {
                  q: 'What counts as an email?',
                  a: 'Each email sent through our API counts as one email toward your monthly limit. Scheduled emails count when they are sent, not when scheduled.',
                },
                {
                  q: 'Can I change plans anytime?',
                  a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.',
                },
                {
                  q: 'What happens if I exceed my limit?',
                  a: "We'll notify you when you're approaching your limit. Emails will be queued (not dropped) if you briefly exceed your limit, giving you time to upgrade.",
                },
                {
                  q: 'Do you store email content?',
                  a: 'We store email metadata (recipient, subject, status) for analytics. Email content is only stored temporarily during sending and is never used for any other purpose.',
                },
              ].map((faq) => (
                <div key={faq.q}>
                  <h3 className="mb-2 font-semibold">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-24 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to get started?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Start with 1,000 free emails. No credit card required.
          </p>
          <Button size="lg" asChild>
            <Link href="/sign-up">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <span className="font-semibold">IntentMail</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
              <Link href="/docs" className="hover:text-foreground">Docs</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} IntentMail
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
