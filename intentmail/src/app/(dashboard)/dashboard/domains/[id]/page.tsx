import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  AlertCircle,
  Trash2,
  RefreshCw,
  Copy,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrganizationWithLimits } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { createProvider } from "@/lib/email/providers";
import type { DnsRecord } from "@/lib/email/types";

export const dynamic = "force-dynamic";

const statusConfig = {
  PENDING: {
    label: "Pending Verification",
    variant: "outline" as const,
    icon: Clock,
    color: "text-yellow-600",
  },
  VERIFIED: {
    label: "Verified",
    variant: "success" as const,
    icon: Check,
    color: "text-green-600",
  },
  FAILED: {
    label: "Verification Failed",
    variant: "destructive" as const,
    icon: AlertCircle,
    color: "text-red-600",
  },
};

async function verifyDomain(formData: FormData) {
  "use server";

  const domainId = formData.get("domainId") as string;
  const org = await getOrganizationWithLimits();
  if (!org || !org.limits.customDomain) {
    redirect("/dashboard/domains");
  }

  const domain = await db.domain.findFirst({
    where: { id: domainId, organizationId: org.id },
    include: { provider: true },
  });

  if (!domain) {
    redirect("/dashboard/domains");
  }

  if (!domain.providerDomainId) {
    redirect(`/dashboard/domains/${domainId}?error=no_provider_id`);
  }

  const apiKey = decrypt(
    domain.provider.apiKeyEncrypted,
    domain.provider.apiKeyIv,
  );
  const config = domain.provider.config as Record<string, unknown> | undefined;
  const provider = createProvider(
    domain.provider.type.toLowerCase() as Parameters<typeof createProvider>[0],
    apiKey,
    config ?? undefined,
  );

  if (!provider.verifyDomain) {
    redirect(`/dashboard/domains/${domainId}?error=unsupported`);
  }

  const result = await provider.verifyDomain(domain.providerDomainId);

  if (result.verified) {
    await db.domain.update({
      where: { id: domainId },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        lastCheckedAt: new Date(),
      },
    });
  } else {
    await db.domain.update({
      where: { id: domainId },
      data: { lastCheckedAt: new Date() },
    });
  }

  redirect(`/dashboard/domains/${domainId}`);
}

async function removeDomain(formData: FormData) {
  "use server";

  const domainId = formData.get("domainId") as string;
  const org = await getOrganizationWithLimits();
  if (!org || !org.limits.customDomain) {
    redirect("/dashboard/domains");
  }

  const domain = await db.domain.findFirst({
    where: { id: domainId, organizationId: org.id },
    include: { provider: true },
  });

  if (!domain) {
    redirect("/dashboard/domains");
  }

  // Remove from provider first (if supported and has provider ID)
  if (domain.providerDomainId) {
    try {
      const apiKey = decrypt(
        domain.provider.apiKeyEncrypted,
        domain.provider.apiKeyIv,
      );
      const config = domain.provider.config as
        | Record<string, unknown>
        | undefined;
      const provider = createProvider(
        domain.provider.type.toLowerCase() as Parameters<
          typeof createProvider
        >[0],
        apiKey,
        config ?? undefined,
      );
      if (provider.removeDomain) {
        await provider.removeDomain(domain.providerDomainId);
      }
    } catch {
      // Non-blocking: proceed with DB deletion even if provider removal fails
    }
  }

  await db.domain.delete({ where: { id: domainId } });
  redirect("/dashboard/domains");
}

export default async function DomainDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const org = await getOrganizationWithLimits();
  if (!org || !org.limits.customDomain) {
    redirect("/dashboard/domains");
  }

  const domain = await db.domain.findFirst({
    where: { id, organizationId: org.id },
    include: { provider: { select: { name: true, type: true } } },
  });

  if (!domain) {
    notFound();
  }

  const config = statusConfig[domain.status];
  const StatusIcon = config.icon;
  const dnsRecords = (domain.dnsRecords ?? []) as unknown as DnsRecord[];

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
          <h1 className="text-3xl font-bold">{domain.domain}</h1>
          <p className="text-muted-foreground">
            via {domain.provider.name} ({domain.provider.type})
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error === "no_provider_id"
            ? "Domain has no provider ID. Try removing and re-adding."
            : error === "unsupported"
              ? "This provider does not support domain verification."
              : "An error occurred during verification."}
        </div>
      )}

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 ${config.color}`} />
              <div>
                <CardTitle>Domain Status</CardTitle>
                <CardDescription>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {domain.status !== "VERIFIED" && (
                <form action={verifyDomain}>
                  <input type="hidden" name="domainId" value={domain.id} />
                  <Button type="submit" variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Verify Now
                  </Button>
                </form>
              )}
              <form action={removeDomain}>
                <input type="hidden" name="domainId" value={domain.id} />
                <Button type="submit" variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </form>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Added</p>
              <p className="font-medium">
                {new Date(domain.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Checked</p>
              <p className="font-medium">
                {domain.lastCheckedAt
                  ? new Date(domain.lastCheckedAt).toLocaleString()
                  : "Never"}
              </p>
            </div>
            {domain.verifiedAt && (
              <div>
                <p className="text-muted-foreground">Verified</p>
                <p className="font-medium">
                  {new Date(domain.verifiedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DNS Records */}
      {dnsRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>DNS Records</CardTitle>
            <CardDescription>
              Add these records at your DNS provider to verify domain ownership.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dnsRecords.map((record, i) => (
                <div key={i} className="rounded-md border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{record.type}</Badge>
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase">
                        Name / Host
                      </p>
                      <code className="block rounded bg-muted px-2 py-1 text-xs break-all">
                        {record.name}
                      </code>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase">
                        Value
                      </p>
                      <code className="block rounded bg-muted px-2 py-1 text-xs break-all">
                        {record.value}
                      </code>
                    </div>
                    {record.priority !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase">
                          Priority
                        </p>
                        <code className="block rounded bg-muted px-2 py-1 text-xs">
                          {record.priority}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {domain.status !== "VERIFIED" && (
              <p className="mt-4 text-sm text-muted-foreground">
                After adding these records, DNS propagation may take up to 48
                hours. Click &quot;Verify Now&quot; to check if your records
                have propagated.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
