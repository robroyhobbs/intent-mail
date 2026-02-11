import { redirect } from "next/navigation";
import Link from "next/link";
import { Send, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function submitWaitlist(formData: FormData) {
  "use server";

  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const name = (formData.get("name") as string)?.trim();
  const useCase = (formData.get("useCase") as string)?.trim();

  if (!email || !EMAIL_REGEX.test(email)) {
    redirect("/waitlist?error=invalid_email");
  }

  if (!name || name.length < 2) {
    redirect("/waitlist?error=invalid_name");
  }

  if (!useCase || useCase.length < 10) {
    redirect("/waitlist?error=invalid_usecase");
  }

  // Upsert: update existing entry if email exists, preserving status
  await db.waitlistEntry.upsert({
    where: { email },
    update: {
      name,
      useCase,
      // Do NOT overwrite status — preserve APPROVED/REJECTED
    },
    create: {
      email,
      name,
      useCase,
    },
  });

  redirect("/waitlist?success=true");
}

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  const errorMessages: Record<string, string> = {
    invalid_email: "Please enter a valid email address.",
    invalid_name: "Please enter your name (at least 2 characters).",
    invalid_usecase:
      "Please tell us a bit more about your use case (at least 10 characters).",
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <nav className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Send className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">IntentMail</span>
          </Link>
          <Button
            variant="ghost"
            className="text-slate-300 hover:text-white hover:bg-white/10"
            asChild
          >
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </nav>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {params.success === "true" ? (
            <Card className="border-green-500/30 bg-slate-900">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  You&apos;re on the list!
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  We&apos;ll review your request and send you access details
                  soon. Keep an eye on your inbox.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                  asChild
                >
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">
                  Request Early Access
                </CardTitle>
                <CardDescription className="text-slate-400">
                  IntentMail is currently in private beta. Tell us about
                  yourself and we&apos;ll get you set up.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {params.error && (
                  <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {errorMessages[params.error] ?? "Something went wrong."}
                  </div>
                )}
                <form action={submitWaitlist} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@company.com"
                      className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="Jane Smith"
                      className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="useCase" className="text-slate-300">
                      What will you use IntentMail for?
                    </Label>
                    <Textarea
                      id="useCase"
                      name="useCase"
                      required
                      rows={3}
                      placeholder="Tell us about your use case — e.g., transactional emails for our SaaS, onboarding sequences, marketing campaigns..."
                      className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-500 text-white hover:bg-blue-400"
                  >
                    Request Access
                  </Button>
                </form>
                <p className="mt-4 text-center text-xs text-slate-500">
                  Already have access?{" "}
                  <Link
                    href="/sign-in"
                    className="text-blue-400 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
