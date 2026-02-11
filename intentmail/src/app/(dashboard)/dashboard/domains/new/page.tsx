import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOrganizationWithLimits } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { createProvider } from "@/lib/email/providers";

export const dynamic = "force-dynamic";

const DOMAIN_REGEX =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;

async function addDomain(formData: FormData) {
  "use server";

  const org = await getOrganizationWithLimits();
  if (!org || !org.limits.customDomain) {
    redirect("/dashboard/domains");
  }

  const domain = (formData.get("domain") as string)?.toLowerCase().trim();
  const providerId = formData.get("providerId") as string;

  if (!domain || !DOMAIN_REGEX.test(domain)) {
    redirect("/dashboard/domains/new?error=invalid_domain");
  }

  if (!providerId) {
    redirect("/dashboard/domains/new?error=no_provider");
  }

  // Verify provider belongs to this org
  const providerRecord = await db.emailProvider.findFirst({
    where: { id: providerId, organizationId: org.id, isActive: true },
  });

  if (!providerRecord) {
    redirect("/dashboard/domains/new?error=invalid_provider");
  }

  // Check if domain already exists for this org
  const existing = await db.domain.findFirst({
    where: { organizationId: org.id, domain },
  });

  if (existing) {
    redirect(`/dashboard/domains/${existing.id}`);
  }

  // Call provider to add domain
  const apiKey = decrypt(
    providerRecord.apiKeyEncrypted,
    providerRecord.apiKeyIv,
  );
  const config = providerRecord.config as Record<string, unknown> | undefined;
  const provider = createProvider(
    providerRecord.type.toLowerCase() as Parameters<typeof createProvider>[0],
    apiKey,
    config ?? undefined,
  );

  if (!provider.addDomain) {
    redirect("/dashboard/domains/new?error=provider_unsupported");
  }

  const result = await provider.addDomain(domain);

  if (!result.success) {
    redirect(
      `/dashboard/domains/new?error=provider_error&message=${encodeURIComponent(result.error ?? "Unknown error")}`,
    );
  }

  // Store in database
  const domainRecord = await db.domain.create({
    data: {
      organizationId: org.id,
      providerId,
      domain,
      status: "PENDING",
      providerDomainId: result.providerDomainId ?? null,
      dnsRecords: (result.dnsRecords ??
        []) as unknown as import("@prisma/client").Prisma.InputJsonValue,
    },
  });

  redirect(`/dashboard/domains/${domainRecord.id}`);
}

export default async function NewDomainPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const org = await getOrganizationWithLimits();
  if (!org || !org.limits.customDomain) {
    redirect("/dashboard/domains");
  }

  const providers = await db.emailProvider.findMany({
    where: { organizationId: org.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // Filter to providers that support domain management (not AWS SES)
  const supportedProviders = providers.filter((p) => p.type !== "AWS_SES");

  const errorMessages: Record<string, string> = {
    invalid_domain:
      "Invalid domain name. Use lowercase letters, numbers, and dots only.",
    no_provider: "Please select a provider.",
    invalid_provider: "Selected provider not found or inactive.",
    provider_unsupported: "This provider does not support domain verification.",
    provider_error: params.message ?? "Provider returned an error.",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/domains">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add Domain</h1>
          <p className="text-muted-foreground">Verify a custom sender domain</p>
        </div>
      </div>

      {params.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessages[params.error] ?? "An error occurred."}
        </div>
      )}

      {supportedProviders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold">No providers configured</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground max-w-md">
              You need at least one active email provider (Resend, SendGrid,
              Mailgun, or Postmark) to add a domain. AWS SES domain verification
              is not yet supported.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/providers/new">Add Provider</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Domain Details</CardTitle>
            <CardDescription>
              Enter your domain and select which provider to verify it with.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={addDomain} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  name="domain"
                  placeholder="mail.acme.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the domain you want to send emails from (e.g.,
                  mail.acme.com)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="providerId">Email Provider</Label>
                <select
                  id="providerId"
                  name="providerId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a provider...</option>
                  {supportedProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  The provider will generate DNS records for domain
                  verification.
                </p>
              </div>

              <Button type="submit">Add Domain</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
