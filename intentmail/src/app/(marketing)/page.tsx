import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Palette,
  MessageSquare,
  Zap,
  Shield,
  BarChart3,
  Code,
  Check,
  ArrowRight,
  Mail,
} from "lucide-react";
import { PLANS } from "@/lib/stripe";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ================================================================= */}
      {/* NAVIGATION                                                        */}
      {/* ================================================================= */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <nav className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Send className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">IntentMail</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-white/10"
              asChild
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-400 text-white"
              asChild
            >
              <Link href="/waitlist">Request Access</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* ================================================================= */}
        {/* HERO                                                              */}
        {/* ================================================================= */}
        <section className="relative overflow-hidden bg-slate-950 py-24 lg:py-36">
          {/* Gradient mesh background */}
          <div className="animate-gradient absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-950 to-violet-600/20" />
          <div className="animate-pulse-glow absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div
            className="animate-pulse-glow absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl"
            style={{ animationDelay: "1.5s" }}
          />

          <div className="container relative z-10">
            <div className="mx-auto max-w-4xl text-center animate-fade-in-up">
              <Badge className="mb-6 border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20">
                <Mail className="mr-1.5 h-3 w-3" />
                AI-Native Email for Developers
              </Badge>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl">
                Stop writing email templates.{" "}
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Start declaring intents.
                </span>
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 sm:text-xl">
                Define what your email should accomplish — not how it looks.
                IntentMail generates brand-consistent, validated emails from a
                single API call.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-blue-500 px-8 text-lg hover:bg-blue-400"
                  asChild
                >
                  <Link href="/waitlist">
                    Request Early Access
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-700 px-8 text-lg text-slate-300 hover:bg-slate-800 hover:text-white"
                  asChild
                >
                  <Link href="/docs">View Documentation</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-slate-500">
                Private Beta &middot; Request access to get started
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* BEFORE / AFTER CODE COMPARISON                                    */}
        {/* ================================================================= */}
        <section className="border-b bg-slate-50 py-24">
          <div className="container">
            <div className="mx-auto mb-6 max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4">
                The Transformation
              </Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                From template hell to{" "}
                <span className="text-blue-600">8 lines of intent</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                No more copy-pasting HTML. No more hardcoded brand colors. No
                more broken emails reaching your users.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
              {/* The Old Way */}
              <div className="overflow-hidden rounded-xl border border-red-200/50 bg-slate-950">
                <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2.5">
                  <span className="text-sm font-medium text-red-400">
                    The Old Way
                  </span>
                </div>
                <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-400">
                  <code>{`<table width="600" cellpadding="0"
  cellspacing="0" border="0"
  style="margin:0 auto;">
  <tr>
    <td style="background-color:#4598fa;
      padding:20px;text-align:center;">
      <img src="/logo.png" width="120"
        alt="Logo" />
    </td>
  </tr>
  <tr>
    <td style="padding:30px;
      font-family:Arial,sans-serif;
      font-size:16px;color:#1f2937;
      line-height:1.6;">
      <p style="margin:0 0 16px 0;">
        Hey {{firstName}},
      </p>
      <p style="margin:0 0 16px 0;">
        Welcome to our platform...
      </p>
      <table cellpadding="0"
        cellspacing="0" border="0">
        <tr>
          <td style="background:#4598fa;
            border-radius:6px;">
            <a href="{{dashboardUrl}}"
              style="color:#fff;
              padding:12px 24px;
              text-decoration:none;
              display:inline-block;">
              Get Started
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`}</code>
                </pre>
              </div>

              {/* The IntentMail Way */}
              <div className="overflow-hidden rounded-xl border border-emerald-200/50 bg-slate-950">
                <div className="border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5">
                  <span className="text-sm font-medium text-emerald-400">
                    The IntentMail Way
                  </span>
                </div>
                <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-300">
                  <code>
                    {`curl -X POST /api/v1/emails/send \\
  -H "Authorization: Bearer im_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    `}
                    <span className="text-blue-400">{`"intent"`}</span>
                    {`: `}
                    <span className="text-emerald-400">{`"onboarding.welcome"`}</span>
                    {`,
    `}
                    <span className="text-blue-400">{`"to"`}</span>
                    {`: `}
                    <span className="text-emerald-400">{`"sarah@example.com"`}</span>
                    {`,
    `}
                    <span className="text-blue-400">{`"data"`}</span>
                    {`: {
      `}
                    <span className="text-blue-400">{`"firstName"`}</span>
                    {`: `}
                    <span className="text-emerald-400">{`"Sarah"`}</span>
                    {`,
      `}
                    <span className="text-blue-400">{`"dashboardUrl"`}</span>
                    {`: `}
                    <span className="text-emerald-400">{`"https://app.co/dash"`}</span>
                    {`
    }
  }'`}
                  </code>
                </pre>
                <div className="border-t border-emerald-500/10 bg-emerald-500/5 px-4 py-2.5">
                  <span className="text-xs text-emerald-400/70">
                    Brand styling, HTML generation, plain text, and validation —
                    all handled automatically.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* EMAIL PREVIEW                                                     */}
        {/* ================================================================= */}
        <section className="py-24">
          <div className="container">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4">
                What Your Users Receive
              </Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Beautiful emails, every time
              </h2>
              <p className="text-lg text-muted-foreground">
                Your brand. Your voice. Automatically applied to every email.
              </p>
            </div>

            {/* Email mockup */}
            <div className="mx-auto max-w-md">
              <div className="relative overflow-hidden rounded-xl border shadow-2xl shadow-blue-500/10">
                {/* Intent badge */}
                <div className="absolute right-3 top-3 z-10">
                  <Badge className="border-slate-200 bg-white/90 font-mono text-xs text-slate-600 backdrop-blur">
                    intent: onboarding.welcome
                  </Badge>
                </div>

                {/* Email header */}
                <div className="bg-[#4598fa] px-6 py-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Send className="h-5 w-5 text-white" />
                    <span className="text-lg font-semibold text-white">
                      IntentMail
                    </span>
                  </div>
                </div>

                {/* Email body */}
                <div className="bg-white p-6">
                  <p className="mb-4 text-[15px] text-slate-700">Hey Sarah,</p>
                  <p className="mb-4 text-[15px] leading-relaxed text-slate-600">
                    Welcome to IntentMail! We&apos;re excited to have you on
                    board. Your account is ready and you can start sending
                    beautiful, brand-consistent emails right away.
                  </p>
                  <p className="mb-6 text-[15px] leading-relaxed text-slate-600">
                    Head to your dashboard to create your first intent and
                    connect your email provider.
                  </p>

                  {/* CTA Button */}
                  <div className="text-center">
                    <div className="inline-block rounded-lg bg-[#4598fa] px-6 py-3 text-sm font-semibold text-white">
                      Go to Dashboard
                    </div>
                  </div>

                  <div className="mt-8 border-t pt-4">
                    <p className="text-sm text-slate-500">
                      The IntentMail Team
                    </p>
                  </div>
                </div>

                {/* Email footer */}
                <div className="border-t bg-slate-50 px-6 py-3 text-center text-xs text-slate-400">
                  Unsubscribe &middot; Privacy Policy
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* FEATURES GRID                                                     */}
        {/* ================================================================= */}
        <section id="features" className="border-t bg-slate-50 py-24">
          <div className="container">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4">
                Platform Features
              </Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need for email at scale
              </h2>
              <p className="text-lg text-muted-foreground">
                A complete platform for sending branded, intent-driven emails
                with your own provider.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: MessageSquare,
                  title: "Intent-Driven",
                  description:
                    "Define what your email should accomplish — purpose, tone, urgency — not the HTML. Content follows intent.",
                },
                {
                  icon: Palette,
                  title: "Brand Consistency",
                  description:
                    "10-color palettes, custom typography, voice rules, and logos. Every email matches your brand automatically.",
                },
                {
                  icon: Shield,
                  title: "BYOP — Your Provider",
                  description:
                    "Connect Resend, SendGrid, Postmark, AWS SES, or Mailgun. Keep your deliverability and infrastructure.",
                },
                {
                  icon: Zap,
                  title: "Quality Scoring",
                  description:
                    "100-point validation catches brand voice violations, jargon, passive voice, and accessibility issues before send.",
                },
                {
                  icon: Code,
                  title: "Developer-First API",
                  description:
                    "One endpoint. Intent slug or ID. Handlebars data. Rate limiting, scopes, and quota management built in.",
                },
                {
                  icon: BarChart3,
                  title: "Delivery Analytics",
                  description:
                    "Track opens, clicks, bounces, and complaints. Per-intent and per-brand analytics with configurable retention.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border bg-white p-6 transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-2.5">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* PROVIDER BADGES                                                   */}
        {/* ================================================================= */}
        <section className="py-16">
          <div className="container text-center">
            <p className="mb-6 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Works with your email provider
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["Resend", "SendGrid", "Postmark", "AWS SES", "Mailgun"].map(
                (provider) => (
                  <span
                    key={provider}
                    className="rounded-full border bg-white px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-600"
                  >
                    {provider}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* COMPACT PRICING                                                   */}
        {/* ================================================================= */}
        <section id="pricing" className="border-t bg-slate-50 py-24">
          <div className="container">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4">
                Pricing
              </Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Start free, scale as you grow
              </h2>
              <p className="text-lg text-muted-foreground">
                All plans include unlimited intents, full API access, and your
                own email provider.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {(
                Object.entries(PLANS) as [
                  string,
                  (typeof PLANS)[keyof typeof PLANS],
                ][]
              ).map(([key, plan]) => {
                const isPopular = key === "GROWTH";
                return (
                  <div
                    key={key}
                    className={`relative rounded-xl border bg-white p-6 transition-shadow hover:shadow-lg ${
                      isPopular
                        ? "border-blue-500 shadow-lg shadow-blue-500/10"
                        : ""
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-blue-500 text-white hover:bg-blue-500">
                          Popular
                        </Badge>
                      </div>
                    )}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <div className="mt-2">
                        {plan.price === null ? (
                          <span className="text-3xl font-bold">Custom</span>
                        ) : plan.price === 0 ? (
                          <span className="text-3xl font-bold">Free</span>
                        ) : (
                          <>
                            <span className="text-3xl font-bold">
                              ${plan.price}
                            </span>
                            <span className="text-muted-foreground">/mo</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ul className="mb-6 space-y-2.5 text-sm">
                      {plan.features.slice(0, 3).map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                          <span className="text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${isPopular ? "bg-blue-500 hover:bg-blue-400" : ""}`}
                      variant={isPopular ? "default" : "outline"}
                      size="sm"
                      asChild
                    >
                      {key === "ENTERPRISE" ? (
                        <a href="mailto:sales@intentmail.com">Contact Sales</a>
                      ) : (
                        <Link href="/waitlist">Request Access</Link>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all features & compare plans
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* FINAL CTA                                                         */}
        {/* ================================================================= */}
        <section className="relative overflow-hidden bg-slate-950 py-24">
          <div className="animate-gradient absolute inset-0 bg-gradient-to-r from-blue-600/20 via-slate-950 to-violet-600/20" />
          <div className="container relative z-10 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Ready to send better emails?
            </h2>
            <p className="mb-8 text-lg text-slate-400">
              Join the private beta and start sending intent-driven emails.
            </p>
            <Button
              size="lg"
              className="bg-blue-500 px-8 text-lg hover:bg-blue-400"
              asChild
            >
              <Link href="/waitlist">
                Request Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ================================================================= */}
      {/* FOOTER                                                            */}
      {/* ================================================================= */}
      <footer className="border-t bg-slate-950 py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-400" />
              <span className="font-semibold text-white">IntentMail</span>
            </div>
            <div className="flex gap-6 text-sm text-slate-500">
              <Link
                href="/pricing"
                className="transition-colors hover:text-slate-300"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="transition-colors hover:text-slate-300"
              >
                Docs
              </Link>
              <Link
                href="/privacy"
                className="transition-colors hover:text-slate-300"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-slate-300"
              >
                Terms
              </Link>
            </div>
            <p className="text-sm text-slate-600">
              &copy; {new Date().getFullYear()} IntentMail
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
